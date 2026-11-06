import { gsap, reducedMotion } from '../lib/motion.js';
import { holdNav } from '../ui/nav.js';

// A short rest on the first and last pairs, as a share of one move between pairs.
const REST = 0.12;

/**
 * The screen holds still while pairs of photos travel down it, against the direction of the
 * scroll. The word in the middle never moves. It only changes as each pair arrives, and each
 * change drops downwards with the photos.
 *
 * On phones the photos pass behind the words. Like the hero headline, the words exist twice, so
 * they turn ivory exactly where a photo crosses them.
 */
export function initStory() {
  if (reducedMotion) return;

  const story = document.querySelector('[data-story]');
  const stage = story.querySelector('[data-story-stage]');
  const track = story.querySelector('[data-story-track]');
  const pairs = gsap.utils.toArray('[data-story-pair]', story);
  const words = gsap.utils.toArray('[data-story-word]', story);
  const echoes = gsap.utils.toArray('[data-story-echo]', story);
  const light = story.querySelector('[data-story-light]');
  const photos = gsap.utils.toArray('.story__photo', story);
  const stacked = matchMedia('(max-width: 899px)');
  const lastPair = pairs.length - 1;
  const length = REST * 2 + lastPair;

  story.classList.add('is-moving');
  gsap.set([...words.slice(1), ...echoes.slice(1)], { yPercent: -110 });

  // Decoded ahead of time, so no photo arrives as an empty box.
  story.querySelectorAll('img').forEach((photo) => photo.decode().catch(() => {}));

  const centredOn = (index) => {
    const pair = pairs[index];
    return stage.clientHeight / 2 - (pair.offsetTop + pair.offsetHeight / 2);
  };

  let shown = 0;

  function showWord(next) {
    if (next === shown) return;
    const direction = next > shown ? 1 : -1;
    gsap.to([words[shown], echoes[shown]], {
      yPercent: 110 * direction,
      duration: 0.9,
      ease: 'expo.out',
      overwrite: true,
    });
    gsap.fromTo(
      [words[next], echoes[next]],
      { yPercent: -110 * direction },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', overwrite: true },
    );
    shown = next;
  }

  /** Cuts the ivory words to the shape of whichever photos are behind them. */
  function followPhotos() {
    if (!stacked.matches) return;
    const box = light.getBoundingClientRect();
    const shapes = photos
      .map((photo) => photo.getBoundingClientRect())
      .filter((photo) => photo.bottom > box.top && photo.top < box.bottom)
      .map((photo) => {
        const left = (photo.left - box.left).toFixed(1);
        const right = (photo.right - box.left).toFixed(1);
        const top = (photo.top - box.top).toFixed(1);
        const bottom = (photo.bottom - box.top).toFixed(1);
        return `M${left} ${top}H${right}V${bottom}H${left}Z`;
      });
    light.style.clipPath = shapes.length ? `path("${shapes.join('')}")` : 'inset(100%)';
  }

  const timeline = gsap.timeline({
    onUpdate: followPhotos,
    scrollTrigger: {
      trigger: story,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const place = gsap.utils.clamp(0, lastPair, self.progress * length - REST);
        showWord(Math.round(place));
      },
      // Photos pass under the top of the screen here, where the menu would be hard to read.
      onToggle: (self) => holdNav(self.isActive ? 'hidden' : null),
    },
  });

  timeline.fromTo(track, { y: () => centredOn(0) }, { y: () => centredOn(0), duration: REST, ease: 'none' });
  pairs.slice(1).forEach((_, index) => {
    timeline.to(track, { y: () => centredOn(index + 1), duration: 1, ease: 'sine.inOut' });
  });
  timeline.to({}, { duration: REST });
}
