import '@fontsource-variable/cormorant-garamond/wght.css';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './styles/main.css';

import { initCraft } from './home/craft.js';
import { initEdit } from './home/edit.js';
import { initHeroScroll, prepareHero, revealHeroTitle, startHeroFilm } from './home/hero.js';
import { runIntro } from './home/intro.js';
import { initReveals } from './home/reveals.js';
import { ScrollTrigger, fontsReady, startSmoothScroll } from './lib/motion.js';
import { setupLazyVideos } from './lib/video.js';
import { initCursor } from './ui/cursor.js';
import { initNav } from './ui/nav.js';
import { initOverlays } from './ui/overlays.js';

async function start() {
  scrollTo(0, 0);
  startSmoothScroll();
  prepareHero();
  await fontsReady();

  initOverlays();
  initCursor();
  initEdit();
  initNav();
  initReveals();
  initHeroScroll();
  initCraft();
  setupLazyVideos();
  ScrollTrigger.refresh();

  runIntro({ onFilm: startHeroFilm, onSettled: revealHeroTitle });
}

start();
