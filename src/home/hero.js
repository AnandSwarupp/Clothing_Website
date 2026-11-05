import { mediaUrl } from '../data/products.js';
import { gsap, isPortraitScreen, reducedMotion, ScrollTrigger } from '../lib/motion.js';
import { playSafely } from '../lib/video.js';
import { keepNavOpen, setNavTone } from '../ui/nav.js';

const hero = document.querySelector('[data-hero]');
const stage = hero.querySelector('[data-hero-stage]');
const slot = hero.querySelector('[data-hero-slot]');
const film = hero.querySelector('[data-hero-film]');
const frame = hero.querySelector('[data-hero-frame]');
const video = hero.querySelector('[data-hero-video]');
const shade = hero.querySelector('[data-hero-shade]');
const copy = hero.querySelector('[data-hero-copy]');
const inkTitle = hero.querySelector('.hero__title--ink');
const lightTitle = hero.querySelector('.hero__title--light');
const titleLines = hero.querySelectorAll('.hero__line > span');
const fades = hero.querySelectorAll('[data-hero-fade]');

/**
 * Which part of each film stays in view when the screen or the frame crops it, from 0 (left or
 * top edge) to 1 (right or bottom edge). The people stand right of centre with their heads near
 * the top, so the frame leans that way and never trims a face.
 */
const FILMS = {
  desktop: {
    ratio: 16 / 9,
    full: { x: 0.62, y: 0.06 },
    framed: { x: 0.9, y: 0 },
    hemShot: { start: 6.2, end: 9.8, y: 0.62 },
  },
  phone: {
    ratio: 9 / 16,
    full: { x: 0.5, y: 0.3 },
    framed: { x: 0.5, y: 0.15 },
  },
};

// How far through the hero's scroll the film reaches its frame. The rest is a pause on the page.
const LANDS_AT = 0.76;

const mix = (from, to, amount) => from + (to - from) * amount;

const covering = ({ width, height }, ratio) => {
  const coverWidth = Math.max(width, height * ratio);
  return { width: coverWidth, height: coverWidth / ratio };
};

let choice = FILMS.desktop;

export function prepareHero() {
  const version = isPortraitScreen() ? 'phone' : 'desktop';
  choice = FILMS[version];
  video.poster = mediaUrl(`hero/poster-${version}.webp`);
  video.src = mediaUrl(`hero/film-${version}.mp4`);
  if (!reducedMotion) {
    hero.classList.add('is-moving');
    gsap.set(titleLines, { yPercent: 112 });
    gsap.set(video, { scale: 1.1 });
  }
}

export function startHeroFilm() {
  if (reducedMotion) {
    video.loop = false;
    return;
  }
  playSafely(video);
  gsap.to(video, { scale: 1, duration: 3.4, ease: 'expo.out' });
}

export function revealHeroTitle() {
  if (reducedMotion) return;
  gsap.to(titleLines, { yPercent: 0, duration: 1.5, stagger: 0.14, ease: 'expo.out' });
}

/**
 * As you scroll, the film steps back from the full screen into its frame, and the headline rises
 * from the bottom of the screen into its place among the words beside it. The headline exists
 * twice, ivory inside the film and dark on the page behind it, so it changes colour exactly where
 * the edge of the film crosses it.
 *
 * The frame is cut with a rectangle and the film shrinks with a transform, which holds 60 frames
 * a second over a playing video. Both come from one value, so the film always fills the frame.
 */
export function initHeroScroll() {
  if (reducedMotion) {
    setNavTone('dark');
    return;
  }

  const shot = { amount: 0, focusY: choice.full.y };
  let ratio = choice.ratio;
  let full = null;
  let framed = null;
  let filmSize = null;
  let endScale = 1;
  let titleDrop = 0;

  function placeFilm() {
    const { amount, focusY } = shot;
    const left = mix(0, framed.left, amount);
    const top = mix(0, framed.top, amount);
    const width = mix(full.width, framed.width, amount);
    const height = mix(full.height, framed.height, amount);
    const scale = mix(1, endScale, amount);
    const x = left + mix(choice.full.x, choice.framed.x, amount) * (width - filmSize.width * scale);
    const y = top + mix(focusY, choice.framed.y, amount) * (height - filmSize.height * scale);

    const titleShift = `translate3d(0, ${((1 - amount) * titleDrop).toFixed(2)}px, 0)`;

    inkTitle.style.transform = titleShift;
    lightTitle.style.transform = titleShift;
    frame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;
    film.style.clipPath = `inset(${top.toFixed(2)}px ${(full.width - left - width).toFixed(2)}px ${(full.height - top - height).toFixed(2)}px ${left.toFixed(2)}px)`;
  }

  function measure() {
    const stageBox = stage.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    full = { width: stageBox.width, height: stageBox.height };
    framed = {
      left: slotBox.left - stageBox.left,
      top: slotBox.top - stageBox.top,
      width: slotBox.width,
      height: slotBox.height,
    };
    filmSize = covering(full, ratio);
    endScale = covering(framed, ratio).width / filmSize.width;
    frame.style.width = `${filmSize.width}px`;
    frame.style.height = `${filmSize.height}px`;

    // The ivory headline rests exactly on the dark one, and both start at the bottom of the screen.
    const restLeft = copy.offsetLeft + inkTitle.offsetLeft;
    const restTop = copy.offsetTop + inkTitle.offsetTop;
    lightTitle.style.left = `${restLeft}px`;
    lightTitle.style.top = `${restTop}px`;
    titleDrop = full.height - restLeft - inkTitle.offsetHeight - restTop;

    placeFilm();
  }

  /** Wide screens crop the film's height, so faces need it framed high and the hem shot low. */
  function followFilmFraming() {
    const { hemShot, full: { y: faces } } = choice;
    if (!hemShot) return;
    gsap.ticker.add(() => {
      if (video.paused) return;
      const { currentTime } = video;
      const target = currentTime > hemShot.start && currentTime < hemShot.end ? hemShot.y : faces;
      if (Math.abs(target - shot.focusY) < 0.0005) return;
      shot.focusY += (target - shot.focusY) * 0.035;
      placeFilm();
    });
  }

  measure();
  followFilmFraming();
  ScrollTrigger.addEventListener('refresh', measure);
  video.addEventListener('loadedmetadata', () => {
    ratio = video.videoWidth / video.videoHeight;
    measure();
  });

  const reveal = gsap.from(fades, { autoAlpha: 0, y: 18, duration: 1.4, stagger: 0.14, paused: true });
  let landed = false;

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          if (self.isActive) setNavTone(self.progress > LANDS_AT * 0.5 ? 'dark' : 'light');
          const nowLanded = self.progress > LANDS_AT * 0.9;
          keepNavOpen(nowLanded && self.isActive);
          if (nowLanded === landed) return;
          landed = nowLanded;
          if (landed) reveal.play();
          else reveal.reverse();
        },
        onLeaveBack: () => setNavTone('light'),
      },
    })
    .to(shot, { amount: 1, duration: LANDS_AT, ease: 'sine.inOut', onUpdate: placeFilm }, 0)
    .to(shade, { autoAlpha: 0, duration: LANDS_AT * 0.6 }, LANDS_AT * 0.3)
    .to({}, { duration: 1 - LANDS_AT }, LANDS_AT);

  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => video.pause(),
    onEnterBack: () => playSafely(video),
  });
}
