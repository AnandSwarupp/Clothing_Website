import { formatPrice, mediaUrl, products } from '../data/products.js';
import { lockScroll, scrollToTarget } from '../lib/motion.js';

const menu = document.querySelector('[data-menu]');
const search = document.querySelector('[data-search]');
const bag = document.querySelector('[data-bag]');
const scrim = document.querySelector('[data-scrim]');
const toast = document.querySelector('[data-toast]');
const searchInput = document.querySelector('[data-search-input]');
const searchResults = document.querySelector('[data-search-results]');
const bagItems = document.querySelector('[data-bag-items]');
const bagFoot = document.querySelector('[data-bag-foot]');
const bagTotal = document.querySelector('[data-bag-total]');
const bagCount = document.querySelector('[data-bag-count]');

const bagContents = [];
let toastTimer;

function setOpen(element, open) {
  element.classList.toggle('is-open', open);
  element.setAttribute('aria-hidden', String(!open));
}

function closeAll() {
  [menu, search, bag].forEach((element) => setOpen(element, false));
  scrim.classList.remove('is-open');
  document.querySelector('[data-menu-open]').setAttribute('aria-expanded', 'false');
  lockScroll(false);
}

function openPanel(element, { withScrim = true } = {}) {
  closeAll();
  setOpen(element, true);
  scrim.classList.toggle('is-open', withScrim);
  lockScroll(true);
}

function renderSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = products.filter((product) =>
    `${product.name} ${product.detail}`.toLowerCase().includes(query),
  );
  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('li');
    empty.className = 'sheet__empty';
    empty.textContent = 'Nothing matches that search.';
    searchResults.append(empty);
    return;
  }
  matches.forEach((product) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const image = new Image();
    image.src = mediaUrl(`edit/${product.id}.webp`);
    image.alt = '';
    const name = document.createElement('strong');
    name.textContent = product.name;
    const price = document.createElement('span');
    price.textContent = formatPrice(product.price);
    button.append(image, name, price);
    button.addEventListener('click', () => {
      closeAll();
      scrollToTarget('#the-edit');
    });
    item.append(button);
    searchResults.append(item);
  });
}

function renderBag() {
  bagCount.textContent = String(bagContents.length);
  bagItems.replaceChildren();
  bagFoot.hidden = bagContents.length === 0;

  if (!bagContents.length) {
    const empty = document.createElement('div');
    empty.className = 'drawer__empty';
    empty.textContent = 'Your bag is empty.';
    const browse = document.createElement('button');
    browse.type = 'button';
    browse.textContent = 'Browse The Edit';
    browse.addEventListener('click', () => {
      closeAll();
      scrollToTarget('#the-edit');
    });
    empty.append(browse);
    bagItems.append(empty);
    return;
  }

  bagContents.forEach((product, index) => {
    const row = document.createElement('div');
    row.className = 'bag-item';
    const image = new Image();
    image.src = mediaUrl(`edit/${product.id}.webp`);
    image.alt = '';
    const text = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const detail = document.createElement('span');
    detail.textContent = product.detail;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      bagContents.splice(index, 1);
      renderBag();
    });
    text.append(name, detail, remove);
    const price = document.createElement('p');
    price.textContent = formatPrice(product.price);
    row.append(image, text, price);
    bagItems.append(row);
  });

  bagTotal.textContent = formatPrice(bagContents.reduce((sum, item) => sum + item.price, 0));
}

export function addToBag(product) {
  bagContents.push(product);
  renderBag();
  openPanel(bag);
}

export function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

export function initOverlays() {
  renderBag();
  renderSearch();

  document.querySelector('[data-menu-open]').addEventListener('click', (event) => {
    openPanel(menu, { withScrim: false });
    event.currentTarget.setAttribute('aria-expanded', 'true');
  });
  document.querySelector('[data-menu-close]').addEventListener('click', closeAll);
  document.querySelector('[data-bag-open]').addEventListener('click', () => openPanel(bag));
  document.querySelector('[data-bag-close]').addEventListener('click', closeAll);
  document.querySelector('[data-search-close]').addEventListener('click', closeAll);
  document.querySelectorAll('[data-search-open]').forEach((button) => {
    button.addEventListener('click', () => {
      openPanel(search);
      setTimeout(() => searchInput.focus({ preventScroll: true }), 350);
    });
  });
  searchInput.addEventListener('input', renderSearch);
  scrim.addEventListener('click', closeAll);
  document.addEventListener('overlays:close', closeAll);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });

  // Pages that are not built yet say so, rather than leading nowhere.
  document.querySelectorAll('[data-soon]').forEach((button) => {
    button.addEventListener('click', () => showToast(`${button.dataset.soon} comes next.`));
  });
}
