import { formatPrice, mediaUrl, products } from '../data/products.js';
import { DESKTOP, ScrollTrigger, gsap, reducedMotion } from '../lib/motion.js';
import { playSafely } from '../lib/video.js';
import { addToBag } from '../ui/overlays.js';

const section = document.querySelector('[data-edit]');
const track = section.querySelector('[data-edit-track]');
const list = section.querySelector('[data-edit-cards]');
const countLabel = section.querySelector('[data-edit-count]');
const bar = section.querySelector('[data-edit-bar]');

function createCard(product) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.dataset.cursor = 'Add';
  card.setAttribute('aria-label', `Add ${product.name} to your bag, ${formatPrice(product.price)}`);

  const media = document.createElement('div');
  media.className = 'card__media';
  const image = new Image();
  image.src = mediaUrl(`edit/${product.id}.webp`);
  image.alt = '';
  image.loading = 'lazy';
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('aria-hidden', 'true');
  video.dataset.src = mediaUrl(`edit/${product.id}.mp4`);
  media.append(image, video);

  const text = document.createElement('span');
  text.className = 'card__text';
  const name = document.createElement('span');
  name.className = 'card__name';
  name.textContent = product.name;
  const price = document.createElement('span');
  price.className = 'card__price';
  price.textContent = formatPrice(product.price);
  const detail = document.createElement('span');
  detail.className = 'card__detail';
  detail.textContent = product.detail;
  text.append(name, price, detail);

  card.append(media, text);
  card.addEventListener('click', () => addToBag(product));
  return card;
}

function startCard(card) {
  const video = card.querySelector('video');
  if (!video.src) video.src = video.dataset.src;
  card.classList.add('is-playing');
  playSafely(video);
}

function stopCard(card) {
  card.classList.remove('is-playing');
  const video = card.querySelector('video');
  setTimeout(() => {
    if (!card.classList.contains('is-playing') && !video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  }, 700);
}

function setProgress(index, fraction) {
  countLabel.textContent = String(index + 1).padStart(2, '0');
  gsap.set(bar, { scaleX: fraction });
}

function desktopScroll(cards) {
  const distance = () => Math.max(0, track.scrollWidth - innerWidth);
  const setHeight = () => {
    section.style.height = `calc(100svh + ${distance()}px)`;
  };
  setHeight();
  ScrollTrigger.addEventListener('refreshInit', setHeight);

  let hovered = null;
  let active = null;

  const updateActive = (progress) => {
    const index = Math.round(progress * (cards.length - 1));
    setProgress(index, progress);
    const next = cards[index];
    if (next === active) return;
    if (active && active !== hovered) stopCard(active);
    active = next;
    startCard(active);
  };

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateActive(self.progress),
      onLeave: () => {
        if (active) stopCard(active);
        active = null;
      },
      onLeaveBack: () => {
        if (active) stopCard(active);
        active = null;
      },
    },
  });

  // Every piece drifts in a touch later than the one before, so the row feels hand placed.
  cards.forEach((card, index) => {
    gsap.fromTo(
      card,
      { yPercent: index % 2 ? 5 : -5 },
      {
        yPercent: index % 2 ? -5 : 5,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      },
    );
  });

  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      hovered = card;
      startCard(card);
    });
    card.addEventListener('pointerleave', () => {
      hovered = null;
      if (card !== active) stopCard(card);
    });
  });

  return () => {
    ScrollTrigger.removeEventListener('refreshInit', setHeight);
    section.style.height = '';
    gsap.set(track, { clearProps: 'transform' });
  };
}

function phoneSwipe(cards) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          startCard(target);
          const index = cards.indexOf(target);
          setProgress(index, (index + 1) / cards.length);
        } else {
          stopCard(target);
        }
      });
    },
    { root: list, threshold: 0.65 },
  );
  cards.forEach((card) => observer.observe(card));
  setProgress(0, 1 / cards.length);
  return () => observer.disconnect();
}

export function initEdit() {
  const cards = products.map(createCard);
  list.append(...cards);

  if (reducedMotion) {
    setProgress(0, 1 / cards.length);
    return;
  }

  const media = gsap.matchMedia();
  media.add(DESKTOP, () => desktopScroll(cards));
  media.add('(max-width: 899px)', () => phoneSwipe(cards));
}
