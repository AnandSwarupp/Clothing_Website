import { DESKTOP, SplitText, fitText, gsap, reducedMotion } from '../lib/motion.js';

function statement() {
  const element = document.querySelector('[data-statement]');
  const { words } = SplitText.create(element, { type: 'words' });
  gsap.fromTo(
    words,
    { opacity: 0.12 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: element, start: 'top 78%', end: 'bottom 48%', scrub: 0.4 },
    },
  );
}

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

function risingLines() {
  gsap.utils.toArray('[data-lines]').forEach((element) => {
    const { lines } = SplitText.create(element, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    gsap.from(lines, {
      yPercent: 110,
      duration: 1.2,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: element, start: 'top 85%' },
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

  // On larger screens each piece of the spread travels at its own speed, which creates the depth.
  // Phones stack everything in one column, where drifting pieces would slide over the text.
  gsap.matchMedia().add(DESKTOP, () => {
    gsap.utils.toArray('[data-drift]').forEach((element) => {
      const amount = Number(element.dataset.drift);
      gsap.fromTo(
        element,
        { y: () => innerHeight * (amount / 100) },
        {
          y: () => innerHeight * (-amount / 100),
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });
  });
}

function invitation() {
  const title = document.querySelector('[data-invite-title]');
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
  statement();
  risingTitles();
  risingLines();
  revealMedia();
  parallax();
  invitation();
  footerWord();
}
