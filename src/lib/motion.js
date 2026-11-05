import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out' });

export { gsap, ScrollTrigger, SplitText };

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DESKTOP = '(min-width: 900px)';
export const isPortraitScreen = () => matchMedia('(max-aspect-ratio: 1/1)').matches;

let lenis = null;

export function startSmoothScroll() {
  history.scrollRestoration = 'manual';
  if (reducedMotion) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function lockScroll(locked) {
  document.documentElement.classList.toggle('is-locked', locked);
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

export function scrollToTarget(target) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  if (lenis) lenis.scrollTo(element, { duration: 1.8, easing: (t) => 1 - (1 - t) ** 4 });
  else element.scrollIntoView();
}

/** Sizes one line of text so it fills `width` pixels exactly. */
export function fitText(element, width) {
  element.style.fontSize = '100px';
  const measured = element.getBoundingClientRect().width;
  element.style.fontSize = `${(100 * width) / measured}px`;
}

export function fontsReady(limit = 2000) {
  return Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, limit))]);
}
