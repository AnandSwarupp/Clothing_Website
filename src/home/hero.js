import { mediaUrl } from '../data/products.js';
import { DESKTOP, gsap, isPortraitScreen, reducedMotion } from '../lib/motion.js';
import { playSafely } from '../lib/video.js';
import { setNavTone } from '../ui/nav.js';
import { createCloth } from './cloth.js';

const hero = document.querySelector('[data-hero]');
const stage = hero.querySelector('[data-hero-stage]');
const video = hero.querySelector('[data-hero-video]');
const frame = hero.querySelector('[data-hero-frame]');
const titleLines = hero.querySelectorAll('.hero__line > span');
const meta = hero.querySelector('[data-hero-meta]');

export function prepareHero() {
  const version = isPortraitScreen() ? 'phone' : 'desktop';
  video.poster = mediaUrl(`hero/poster-${version}.webp`);
  video.src = mediaUrl(`hero/film-${version}.mp4`);
  if (!reducedMotion) {
    gsap.set(titleLines, { yPercent: 112 });
    gsap.set(meta, { autoAlpha: 0 });
    gsap.set(video, { scale: 1.1 });
  }
}

/**
 * Screens wider than the film crop its top and bottom, so faces need the framing high
 * and the coat hem shot needs it low. The framing eases between them during each dissolve.
 */
function followFilmFraming() {
  const hemShot = { start: 6.2, end: 9.8 };
  const faces = 6;
  const boots = 62;
  let current = faces;

  gsap.ticker.add(() => {
    if (video.paused || innerWidth / innerHeight <= 1.8) return;
    const { currentTime } = video;
    const target = currentTime > hemShot.start && currentTime < hemShot.end ? boots : faces;
    if (Math.abs(target - current) < 0.05) return;
    current += (target - current) * 0.035;
    video.style.objectPosition = `62% ${current.toFixed(2)}%`;
  });
}

export function startHeroFilm() {
  if (reducedMotion) {
    video.loop = false;
    return;
  }
  playSafely(video);
  followFilmFraming();
  gsap.to(video, { scale: 1, duration: 3.4, ease: 'expo.out' });
}

export function revealHeroTitle() {
  if (reducedMotion) return;
  gsap.to(titleLines, { yPercent: 0, duration: 1.5, stagger: 0.14, ease: 'expo.out' });
  gsap.to(meta, { autoAlpha: 1, duration: 1, delay: 0.7 });
}

/**
 * As you scroll, an ivory sheet rises over the full-size film and becomes the page.
 * The headline exists twice, ivory on the film and dark on the sheet, so it changes colour
 * exactly where the edge of the sheet crosses it.
 */
export function initHeroScroll() {
  if (reducedMotion) {
    setNavTone('light');
    return;
  }
  const titles = hero.querySelectorAll('[data-hero-title]');
  const riseEnds = 0.8;

  const cloth = createCloth({
    stage,
    canvas: hero.querySelector('[data-cloth]'),
    title: hero.querySelector('.hero__title--ink'),
    onCovered: (covered) => (covered ? video.pause() : playSafely(video)),
  });

  // Growing from the top edge, so the slow push-in can never crop a head.
  gsap.set(frame, { transformOrigin: '62% 0%' });

  const build = (desktop) => {
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          cloth.setProgress(self.progress / riseEnds);
          if (self.isActive) setNavTone(self.progress > riseEnds * 0.94 ? 'dark' : 'light');
        },
        onRefresh: (self) => cloth.setProgress(self.progress / riseEnds),
        onLeaveBack: () => setNavTone('light'),
      },
    });

    timeline
      .to(frame, { scale: 1.06, duration: riseEnds }, 0)
      .to(titles, { y: () => innerHeight * (desktop ? -0.12 : -0.34), duration: riseEnds }, 0)
      .to({}, { duration: 1 - riseEnds }, riseEnds);
  };

  const media = gsap.matchMedia();
  media.add(DESKTOP, () => build(true));
  media.add('(max-width: 899px)', () => build(false));
}
