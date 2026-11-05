import { gsap, reducedMotion } from '../lib/motion.js';
import { holdNav } from '../ui/nav.js';

// A short rest on the first and last pairs, as a share of one move between pairs.
const REST = 0.12;

/**
 * The screen holds still while pairs of photos travel down it, against the direction of the
 * scroll. The word in the middle never moves. It only changes as each pair arrives, and each
 * change drops downwards with the photos.
 */
export function initStory() {
  if (reducedMotion) return;

  const story = document.querySelector('[data-story]');
  const stage = story.querySelector('[data-story-stage]');
  const track = story.querySelector('[data-story-track]');
  const pairs = gsap.utils.toArray('[data-story-pair]', story);
  const words = gsap.utils.toArray('[data-story-word]', story);
  const lastPair = pairs.length - 1;
  const length = REST * 2 + lastPair;

  story.classList.add('is-moving');
  gsap.set(words.slice(1), { yPercent: -110 });

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
    gsap.to(words[shown], { yPercent: 110 * direction, duration: 0.9, ease: 'expo.out', overwrite: true });
    gsap.fromTo(
      words[next],
      { yPercent: -110 * direction },
      { yPercent: 0, duration: 1.1, ease: 'expo.out', overwrite: true },
    );
    shown = next;
  }

  const timeline = gsap.timeline({
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
