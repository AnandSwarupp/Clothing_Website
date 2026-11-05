import { fitText, gsap, lockScroll, reducedMotion } from '../lib/motion.js';

const STORAGE_KEY = 'velmora-intro-seen';

function introAlreadySeen() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Private windows can block storage. The opening simply plays again.
  }
}

/**
 * The giant name rises letter by letter, then shrinks into the menu as the ivory lifts off the film.
 * `onFilm` fires as the film starts, and `onSettled` as the name lands.
 */
export function runIntro({ onFilm, onSettled }) {
  const root = document.querySelector('[data-intro]');
  const navItems = document.querySelectorAll('.nav__links, .nav__menu');
  const logo = document.querySelector('[data-nav-logo]');

  if (reducedMotion || introAlreadySeen()) {
    root.remove();
    onFilm();
    onSettled();
    return;
  }

  const word = root.querySelector('[data-intro-word]');
  const letters = word.querySelectorAll('.mask > span');
  const note = root.querySelector('[data-intro-note]');
  const panel = root.querySelector('[data-intro-panel]');

  lockScroll(true);
  fitText(word, Math.min(innerWidth * 0.9, innerHeight * 1.5));
  gsap.set([logo, ...navItems], { autoAlpha: 0 });

  const box = word.getBoundingClientRect();
  const target = logo.getBoundingClientRect();
  const shift = {
    x: target.left + target.width / 2 - (box.left + box.width / 2),
    y: target.top + target.height / 2 - (box.top + box.height / 2),
    scale: target.width / box.width,
  };

  const lift = 1.95;

  gsap
    .timeline({
      onComplete: () => {
        rememberIntro();
        root.remove();
      },
    })
    .from(letters, { yPercent: 118, duration: 1.25, stagger: 0.07, ease: 'expo.out' }, 0.15)
    .from(note, { autoAlpha: 0, y: 10, duration: 0.8 }, 0.9)
    .to(note, { autoAlpha: 0, duration: 0.4 }, lift - 0.3)
    .add(onFilm, lift - 0.2)
    .to(panel, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.4, ease: 'expo.inOut' }, lift)
    .to(word, { ...shift, color: '#f2ede4', duration: 1.4, ease: 'expo.inOut' }, lift)
    .add(() => {
      lockScroll(false);
      onSettled();
    }, lift + 0.95)
    .set(logo, { autoAlpha: 1 }, lift + 1.4)
    .set(word, { autoAlpha: 0 }, lift + 1.4)
    .to(navItems, { autoAlpha: 1, duration: 0.8, stagger: 0.08 }, lift + 1.05);
}
