import { SplitText, fitText, gsap, reducedMotion } from '../lib/motion.js';

function risingTitles() {
  gsap.utils.toArray('[data-rise]').forEach((element) => {
    const { chars } = SplitText.create(element, {
      type: 'lines,chars',
      mask: 'lines',
      linesClass: 'ln',
    });
    gsap.from(chars, {
      yPercent: 115,
      duration: 1.3,
      stagger: 0.035,
      ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 90%' },
    });
  });
}

function revealMedia() {
  gsap.utils.toArray('[data-reveal-media]').forEach((element) => {
    gsap.fromTo(
      element,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: element.parentElement, start: 'top 86%' },
      },
    );
    gsap.from(element.firstElementChild, {
      scale: 1.28,
      duration: 2.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: element.parentElement, start: 'top 86%' },
    });
  });
}

function parallax() {
  gsap.utils.toArray('[data-parallax]').forEach((element) => {
    const amount = Number(element.dataset.parallax);
    gsap.fromTo(
      element,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: element.closest('figure, div'), start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

function invitation() {
  const title = document.querySelector('[data-invite-title]');
  gsap.from('[data-invite-photo] img', {
    scale: 1.08,
    transformOrigin: '100% 8%',
    duration: 2.6,
    ease: 'expo.out',
    scrollTrigger: { trigger: title, start: 'top 80%' },
  });
  const { words } = SplitText.create(title, { type: 'words' });
  gsap.from(words, {
    autoAlpha: 0,
    y: 26,
    duration: 1.8,
    stagger: 0.18,
    ease: 'power2.out',
    scrollTrigger: { trigger: title, start: 'top 72%' },
  });
  gsap.utils.toArray('[data-fade]').forEach((element) => {
    gsap.from(element, {
      autoAlpha: 0,
      y: 20,
      duration: 1.6,
      delay: 0.5,
      scrollTrigger: { trigger: title, start: 'top 72%' },
    });
  });
}

function footerWord() {
  const word = document.querySelector('[data-footer-word]');
  const footer = word.closest('.footer');
  const size = () => {
    const gutter = parseFloat(getComputedStyle(footer).paddingLeft);
    fitText(word, footer.clientWidth - gutter * 2);
  };
  size();
  addEventListener('resize', size);
  const { chars } = SplitText.create(word, { type: 'chars', mask: 'chars' });
  gsap.from(chars, {
    yPercent: 105,
    duration: 1.4,
    stagger: 0.06,
    ease: 'expo.out',
    scrollTrigger: { trigger: word, start: 'top 96%' },
  });
}

export function initReveals() {
  if (reducedMotion) {
    const word = document.querySelector('[data-footer-word]');
    fitText(word, word.parentElement.clientWidth * 0.92);
    return;
  }
  risingTitles();
  revealMedia();
  parallax();
  invitation();
  footerWord();
}
