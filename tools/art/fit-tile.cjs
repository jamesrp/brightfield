#!/usr/bin/env node
// Snaps one raw imagegen tile onto the exact spec v2 geometry.
//   1. finds the painted ground slab (widest opaque row near the bottom, and the lowest opaque row)
//   2. scales it uniformly so the slab is 960 px wide, centres it, and puts its bottom at y 1522.5
//   3. clears anything outside the hex columns or below the slab outline (reports how much)
//   4. optional --sides FILE: pastes the two side faces from a family slab (assets/tiles/_slab/*.png)
//      so every tile of that family has identical, exact edges
// Usage: node tools/art/fit-tile.cjs raw.png assets/tiles/0/food.png [--sides assets/tiles/_slab/earth.png] [--no-align]
// The input may be any size; transparent background required.
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const S = require('./spec.cjs');
const { w, h, cx, cy, halfW: hw, faceHalfH: fh, depth: d } = S.SPEC;

function measure(img) {
  const cv = createCanvas(img.width, img.height), g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, img.width, img.height).data, W = img.width, H = img.height;
  const op = (x, y) => px[(y * W + x) * 4 + 3] > 128;
  let bottom = -1;
  for (let y = H - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < W; x++) if (op(x, y)) { bottom = y; break; }
  if (bottom < 0) throw new Error('image is fully transparent');
  // The slab's straight vertical sides are the widest rows in its lower part.
  // Expected slab height for a slab of width ws is ws*(fh/2+d)/(2hw)+..., so search a generous band.
  let best = { width: 0, left: 0, right: 0 };
  const band = Math.round(H * 0.35);
  for (let y = Math.max(0, bottom - band); y <= bottom; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (op(x, y)) { if (l < 0) l = x; r = x; }
    if (l >= 0 && r - l > best.width) best = { width: r - l + 1, left: l, right: r, y };
  }
  return { bottom: bottom + 1, slabWidth: best.width, slabCx: (best.left + best.right + 1) / 2, widestRow: best.y };
}

(async () => {
  const args = process.argv.slice(2), files = []; let sidesFile = null, noAlign = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sides') sidesFile = args[++i]; else if (args[i] === '--no-align') noAlign = true; else files.push(args[i]);
  }
  const [input, output] = files;
  if (!input || !output) { console.error('usage: fit-tile.cjs raw.png out.png [--sides slab.png] [--no-align]'); process.exit(2); }
  const img = await loadImage(path.resolve(input));
  const cv = createCanvas(w, h), g = cv.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  let report;
  if (noAlign) {
    if (img.width !== w || img.height !== h) throw new Error(`--no-align needs a ${w}x${h} input`);
    g.drawImage(img, 0, 0); report = { scale: 1, dx: 0, dy: 0 };
  } else {
    const m = measure(img), k = (2 * hw) / m.slabWidth;
    const dx = cx - m.slabCx * k, dy = (cy + fh + d) - m.bottom * k;
    g.drawImage(img, dx, dy, img.width * k, img.height * k);
    report = { scale: +k.toFixed(4), dx: +dx.toFixed(1), dy: +dy.toFixed(1), measured: m };
  }
  // Count then clear everything outside the keep region.
  const before = g.getImageData(0, 0, w, h).data;
  let clipped = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (before[(y * w + x) * 4 + 3] > 16 && !S.inPoly(S.KEEP, x + 0.5, y + 0.5)) clipped++;
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; S.path(g, S.KEEP); g.fill();
  g.globalCompositeOperation = 'source-over';
  if (sidesFile) {
    const slab = await loadImage(path.resolve(sidesFile));
    for (const side of [S.SIDE_LEFT, S.SIDE_RIGHT]) { g.save(); S.path(g, side); g.clip(); g.drawImage(slab, 0, 0, w, h); g.restore(); }
  }
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, cv.toBuffer('image/png'));
  report.clippedPixels = clipped;
  report.verdict = clipped > 4000 ? 'LOTS clipped: something hung outside the hex, check by eye or regenerate' : 'ok';
  console.log(JSON.stringify({ input, output, ...report }));
})().catch(e => { console.error(e.message); process.exit(1); });
