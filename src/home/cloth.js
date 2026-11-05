import { gsap } from '../lib/motion.js';

const TAU = Math.PI * 2;
const STEP = 1 / 120;
const DAMPING = 5.6;
const STITCH_INSET = 16;
const IVORY = '#f2ede4';
const HIDDEN = 'inset(100% 0 0 0)';

// All as shares of the screen height.
const PARKED_PAST_SCREEN = 0.05;
const MAX_LAG = 0.2;
const BREEZE = 0.02;
const SHADOW_REACH = 0.26;
const FOLD_REACH = 0.5;

const clamp = gsap.utils.clamp;

/** Softer and stiffer stretches along the hem, so it falls out of step in long, uneven folds. */
function stiffnessAt(along, cycles) {
  const variation = 0.4 * Math.sin(TAU * along * cycles + 0.8) + 0.22 * Math.sin(TAU * along * cycles * 2.4 + 2.1);
  return 81 * (1 + variation);
}

function curveThrough(xs, ys, shiftX = 0, shiftY = 0) {
  const last = xs.length - 1;
  const at = (value, shift) => (value + shift).toFixed(1);
  let path = `M${at(xs[0], shiftX)} ${at(ys[0], shiftY)}`;
  for (let i = 0; i < last; i += 1) {
    const before = Math.max(i - 1, 0);
    const after = Math.min(i + 2, last);
    const c1x = xs[i] + (xs[i + 1] - xs[before]) / 6;
    const c1y = ys[i] + (ys[i + 1] - ys[before]) / 6;
    const c2x = xs[i + 1] - (xs[after] - xs[i]) / 6;
    const c2y = ys[i + 1] - (ys[after] - ys[i]) / 6;
    path += `C${at(c1x, shiftX)} ${at(c1y, shiftY)} ${at(c2x, shiftX)} ${at(c2y, shiftY)} ${at(xs[i + 1], shiftX)} ${at(ys[i + 1], shiftY)}`;
  }
  return path;
}

/**
 * The ivory sheet that rises over the hero film.
 *
 * Its edge is a row of points on springs of slightly different strengths. A slow scroll barely
 * separates them. A fast one pulls them out of step, which makes the folds, and they swing back
 * into line when the page stops. Nothing here loops, so the cloth only moves when it is moved,
 * apart from a faint breeze while it hangs part way up the screen.
 *
 * The sheet is drawn on a canvas because a full-screen cut-out over a playing video cannot hold
 * 60 frames a second. Only the dark headline is cut to the edge, and only while the edge crosses it.
 */
export function createCloth({ stage, canvas, title, onCovered }) {
  const context = canvas.getContext('2d');
  const foldStrip = document.createElement('canvas');
  const foldContext = foldStrip.getContext('2d');

  let width = 0;
  let height = 0;
  let count = 0;
  let cycles = 0;
  let tension = 0;
  let xs = [];
  let ys = [];
  let velocities = [];
  let stiffness = [];
  let drawn = [];
  let foldPixels = null;

  let progress = 0;
  let target = 0;
  let clock = 0;
  let waiting = 0;
  let asleep = false;
  let covered = false;
  let flatState = '';

  const targetFor = (value) => height * (1 + PARKED_PAST_SCREEN - value * (1 + 2 * PARKED_PAST_SCREEN));

  function measure() {
    const pixelRatio = Math.min(devicePixelRatio, 2);
    width = stage.clientWidth;
    height = stage.clientHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    count = width < 700 ? 16 : 30;
    cycles = width < 700 ? 0.7 : 1.25;
    tension = 420 * (count / 30) ** 2;
    target = targetFor(progress);

    xs = Array.from({ length: count }, (_, i) => (i / (count - 1)) * width);
    ys = new Array(count).fill(target);
    velocities = new Array(count).fill(0);
    drawn = new Array(count).fill(target);
    stiffness = Array.from({ length: count }, (_, i) => stiffnessAt(i / (count - 1), cycles * 1.1));

    foldStrip.width = count;
    foldStrip.height = 1;
    foldPixels = foldContext.createImageData(count, 1);
    flatState = '';
    asleep = false;
  }

  function step() {
    const maxLag = height * MAX_LAG;
    for (let i = 0; i < count; i += 1) {
      const left = ys[Math.max(i - 1, 0)];
      const right = ys[Math.min(i + 1, count - 1)];
      const pull = stiffness[i] * (target - ys[i]) + tension * (left + right - 2 * ys[i]);
      velocities[i] += (pull - DAMPING * velocities[i]) * STEP;
    }
    for (let i = 0; i < count; i += 1) {
      ys[i] = clamp(target - maxLag, target + maxLag, ys[i] + velocities[i] * STEP);
    }
  }

  /** Each fold is shaded on one side and lit on the other. */
  function shadeFolds() {
    const { data } = foldPixels;
    const spacing = xs[1];
    const strength = clamp(0, 1, (1 - progress) / 0.12);
    for (let i = 0; i < count; i += 1) {
      const slope = (drawn[Math.min(i + 1, count - 1)] - drawn[Math.max(i - 1, 0)]) / (2 * spacing);
      const light = clamp(-1, 1, slope * 3);
      const shaded = light > 0;
      const pixel = i * 4;
      data[pixel] = shaded ? 110 : 255;
      data[pixel + 1] = shaded ? 94 : 252;
      data[pixel + 2] = shaded ? 76 : 246;
      data[pixel + 3] = strength * Math.abs(light) * (shaded ? 72 : 150);
    }
    foldContext.putImageData(foldPixels, 0, 0);
  }

  function paintSheet(edgePath, middle) {
    const edge = new Path2D(edgePath);
    const sheet = new Path2D(`${edgePath}L${width} ${height}L0 ${height}Z`);

    context.clearRect(0, 0, width, height);
    context.fillStyle = IVORY;
    context.fill(sheet);

    // Folds fade out down the sheet. These two only touch what is already painted.
    const foldTop = middle - height * 0.12;
    const foldHeight = height * FOLD_REACH;
    const fade = context.createLinearGradient(0, foldTop, 0, foldTop + foldHeight);
    fade.addColorStop(0.2, 'rgb(242 237 228 / 0)');
    fade.addColorStop(0.95, IVORY);
    shadeFolds();
    context.globalCompositeOperation = 'source-atop';
    context.drawImage(foldStrip, 0, foldTop, width, foldHeight);
    context.fillStyle = fade;
    context.fillRect(0, foldTop, width, foldHeight);

    // The soft shadow the sheet casts on the film, painted underneath it.
    const reach = height * SHADOW_REACH;
    const shadow = context.createLinearGradient(0, middle - reach, 0, middle);
    shadow.addColorStop(0, 'rgb(20 18 16 / 0)');
    shadow.addColorStop(1, 'rgb(20 18 16 / 0.3)');
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = shadow;
    context.fillRect(0, middle - reach, width, height - middle + reach);
    context.globalCompositeOperation = 'source-over';

    // A line of stitching just inside the hem, which is what makes the edge read as cloth.
    context.save();
    context.translate(0, STITCH_INSET);
    context.setLineDash([7, 6]);
    context.lineWidth = 1;
    context.strokeStyle = 'rgb(20 18 16 / 0.24)';
    context.stroke(edge);
    context.restore();
  }

  function setTitleClip(clip) {
    if (clip !== flatState) title.style.clipPath = clip;
    flatState = clip;
  }

  /** The dark headline shows only on the sheet, so it changes colour exactly at the edge. */
  function cutTitle(highest, lowest) {
    const box = title.getBoundingClientRect();
    const stageTop = stage.getBoundingClientRect().top;
    const overhang = box.height * 0.3;
    const top = box.top - stageTop;
    if (lowest <= top - overhang) setTitleClip('none');
    else if (highest >= top + box.height + overhang) setTitleClip(HIDDEN);
    else {
      const curve = curveThrough(xs, drawn, -box.left, -top);
      const reach = height * 2;
      setTitleClip(`path("${curve}L${width} ${reach}L${-width} ${reach}Z")`);
    }
  }

  function draw() {
    const breeze = height * BREEZE * Math.sqrt(Math.sin(Math.PI * progress));
    for (let i = 0; i < count; i += 1) {
      const along = i / (count - 1);
      drawn[i] =
        ys[i] +
        breeze *
          (0.62 * Math.sin(TAU * along * cycles + clock * 0.55) +
            0.38 * Math.sin(TAU * along * cycles * 2.3 - clock * 0.8 + 1.7));
    }

    const highest = Math.min(...drawn);
    const lowest = Math.max(...drawn);
    const isCovered = lowest + STITCH_INSET + 2 <= 0;
    const isHidden = highest >= height;

    if (isCovered !== covered) {
      covered = isCovered;
      onCovered(covered);
    }

    cutTitle(highest, lowest);
    if (isCovered) {
      context.fillStyle = IVORY;
      context.fillRect(0, 0, width, height);
    } else if (isHidden) {
      context.clearRect(0, 0, width, height);
    } else {
      const middle = drawn.reduce((total, y) => total + y, 0) / count;
      paintSheet(curveThrough(xs, drawn), middle);
    }
  }

  function isAtRest() {
    if (progress > 0 && progress < 1) return false;
    return ys.every((y, i) => Math.abs(y - target) < 0.3 && Math.abs(velocities[i]) < 0.3);
  }

  function tick(_, deltaMs) {
    if (asleep) return;
    const passed = Math.min(deltaMs / 1000, 0.05);
    waiting += passed;
    clock += passed;
    while (waiting >= STEP) {
      step();
      waiting -= STEP;
    }
    draw();
    asleep = isAtRest();
  }

  measure();
  new ResizeObserver(() => {
    if (stage.clientWidth !== width || stage.clientHeight !== height) measure();
  }).observe(stage);
  gsap.ticker.add(tick);

  return {
    setProgress(value) {
      progress = clamp(0, 1, value);
      target = targetFor(progress);
      asleep = false;
    },
  };
}
