import { gsap, reducedMotion } from '../lib/motion.js';

/** A small tag that follows the pointer over images, plus a magnetic pull on buttons. Mouse only. */
export function initCursor() {
  if (reducedMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');

  const dot = document.querySelector('[data-cursor-dot]');
  const label = document.querySelector('[data-cursor-label]');
  const moveX = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' });
  const moveY = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' });

  const pointer = { x: -1, y: -1 };
  let pending = false;

  // Reads what is under the pointer, so the label stays right when the page scrolls beneath it.
  const refresh = () => {
    pending = false;
    const target = document.elementFromPoint(pointer.x, pointer.y)?.closest('[data-cursor]');
    if (target) label.textContent = target.dataset.cursor;
    gsap.to(dot, { autoAlpha: target ? 1 : 0, duration: target ? 0.35 : 0.25, overwrite: 'auto' });
  };

  const scheduleRefresh = () => {
    if (pending || pointer.x < 0) return;
    pending = true;
    requestAnimationFrame(refresh);
  };

  addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    moveX(pointer.x);
    moveY(pointer.y);
    scheduleRefresh();
  });
  addEventListener('scroll', scheduleRefresh, { passive: true });

  document.querySelectorAll('[data-magnetic]').forEach((element) => {
    const pullX = gsap.quickTo(element, 'x', { duration: 0.8, ease: 'power3' });
    const pullY = gsap.quickTo(element, 'y', { duration: 0.8, ease: 'power3' });
    element.addEventListener('pointermove', (event) => {
      const box = element.getBoundingClientRect();
      pullX((event.clientX - box.left - box.width / 2) * 0.3);
      pullY((event.clientY - box.top - box.height / 2) * 0.4);
    });
    element.addEventListener('pointerleave', () => {
      pullX(0);
      pullY(0);
    });
  });
}
