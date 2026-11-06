import { mediaUrl } from '../data/products.js';
import { ScrollTrigger, gsap, isPortraitScreen, reducedMotion } from '../lib/motion.js';

const section = document.querySelector('[data-craft]');
const canvas = section.querySelector('[data-craft-canvas]');
const context = canvas.getContext('2d');
const messages = gsap.utils
  .toArray('[data-craft-message]')
  .map((message) => gsap.utils.toArray('.craft__line > span', message));

const FRAMES = { desktop: 80, phone: 60 };

/** Scroll moves through still frames, which stays perfectly smooth on any device. */
export function initCraft() {
  const folder = isPortraitScreen() ? 'phone' : 'desktop';
  const count = FRAMES[folder];
  const frames = new Array(count).fill(null);
  const state = { frame: 0 };
  let started = false;

  const frameUrl = (index) =>
    mediaUrl(`craft/${folder}/${String(index + 1).padStart(3, '0')}.webp`);

  function draw() {
    const wanted = Math.round(state.frame);
    let image = frames[wanted];
    for (let gap = 1; !image && gap < count; gap += 1) {
      image = frames[wanted - gap] || frames[wanted + gap];
    }
    if (!image) return;
    const { width, height } = canvas;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    draw();
  }

  function load(index) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        frames[index] = image;
        draw();
        resolve();
      };
      image.onerror = resolve;
      image.src = frameUrl(index);
    });
  }

  /** Loads a coarse set first so scrolling always has something close, then fills the gaps. */
  async function loadFrames() {
    if (started) return;
    started = true;
    const order = [];
    [12, 6, 3, 1].forEach((step) => {
      for (let index = 0; index < count; index += step) {
        if (!order.includes(index)) order.push(index);
      }
    });
    const workers = Array.from({ length: 6 }, async () => {
      while (order.length) await load(order.shift());
    });
    await Promise.all(workers);
  }

  addEventListener('resize', resize);
  resize();

  if (reducedMotion) {
    load(Math.floor(count / 2));
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 180%',
    onEnter: loadFrames,
    onEnterBack: loadFrames,
  });

  section.classList.add('is-moving');
  gsap.set(messages.flat(), { yPercent: 115 });

  let shown = -1;

  /** One message leaves, then the next rises into the same place, line by line. */
  function show(next) {
    if (next === shown) return;
    const forward = next > shown;
    const leaving = messages[shown];
    const entering = messages[next];
    if (leaving) {
      gsap.to(leaving, {
        yPercent: forward ? -115 : 115,
        duration: 0.6,
        ease: 'power2.in',
        stagger: 0.04,
        overwrite: true,
      });
    }
    if (entering) {
      gsap.fromTo(
        entering,
        { yPercent: forward ? 115 : -115 },
        { yPercent: 0, duration: 1.4, delay: leaving ? 0.4 : 0, ease: 'expo.out', stagger: 0.1, overwrite: true },
      );
    }
    shown = next;
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    onEnter: () => show(0),
    onLeaveBack: () => show(-1),
  });

  const lastMessage = messages.length - 1;

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => show(Math.min(lastMessage, Math.floor(self.progress * messages.length))),
      },
    })
    .to(state, { frame: count - 1, duration: 1, onUpdate: draw }, 0);
}
