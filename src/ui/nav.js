import { ScrollTrigger, scrollToTarget } from '../lib/motion.js';

const nav = document.querySelector('[data-nav]');

export function setNavTone(tone) {
  nav.dataset.tone = tone;
}

export function initNav() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-scroll]');
    if (!link) return;
    event.preventDefault();
    document.dispatchEvent(new CustomEvent('overlays:close'));
    scrollToTarget(link.getAttribute('href'));
  });

  // Hides on the way down and returns on the way up, so the visuals get the full screen.
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const goingDown = self.direction === 1;
      nav.classList.toggle('is-hidden', goingDown && self.scroll() > 160);
    },
  });

  const tones = [
    ['.statement', 'dark'],
    // The panels leave ivory at each side on wide screens, where light text would disappear.
    ['.split', () => (document.querySelector('.split').offsetWidth < innerWidth - 40 ? 'dark' : 'light')],
    ['.edit', 'dark'],
    ['.lookbook', 'dark'],
    ['.craft', 'light'],
    ['.invite', 'light'],
    ['.footer', 'dark'],
  ];
  tones.forEach(([selector, tone]) => {
    ScrollTrigger.create({
      trigger: selector,
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: (self) => self.isActive && setNavTone(typeof tone === 'function' ? tone() : tone),
    });
  });
}
