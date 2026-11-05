import { mediaUrl } from '../data/products.js';
import { reducedMotion } from './motion.js';

export function playSafely(video) {
  const attempt = video.play();
  if (attempt) attempt.catch(() => {});
}

/** Loads a video only as it nears the screen, and pauses it once it leaves. */
export function setupLazyVideos() {
  const videos = document.querySelectorAll('[data-lazy-video]');
  videos.forEach((video) => {
    video.poster = mediaUrl(video.dataset.src.replace('.mp4', '.webp'));
  });

  if (reducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          if (!target.src) {
            target.src = mediaUrl(target.dataset.src);
            target.preload = 'auto';
          }
          playSafely(target);
        } else if (!target.paused) {
          target.pause();
        }
      });
    },
    { rootMargin: '15% 0px' },
  );

  videos.forEach((video) => observer.observe(video));
}
