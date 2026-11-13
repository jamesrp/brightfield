#!/usr/bin/env node
// Reproducible review: the production drawBuilding path, without stretching or clipping.
// node docs/round-2-glows/render-review.cjs [output-directory]
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const { make } = require('../../tests/ui-harness.cjs');
const { checkGlows, loadManifest, REQUIRED_KEYS } = require('../../tools/art/check-glows.cjs');
const S = require('../../tools/art/spec.cjs');

// Invert tile-art.js's grounded frame so the whole 1024x1536 canvas lands in
// exactly width x width*1.5. Canvas itself supplies the actual production draw.
function drawTile(A, g, key, left, top, width, time, night) {
  const [axis, stage] = key.split(':'), scale = width / S.SPEC.w;
  const halfWidth = A.BOARD.tileRadius * Math.sqrt(3) / 2;
  const u = S.SPEC.halfW * scale / halfWidth;
  A.drawBuilding(g, axis, /^[012]$/.test(stage) ? +stage : 3,
    /^[012]$/.test(stage) ? null : stage,
    left + S.SPEC.cx * scale, top + S.SPEC.cy * scale + u * .18,
    u, time, night, { grounded: true });
}
async function artFor(manifest) {
  const view = make(720, 600, '?mode=cozy&cards=0', true, { tileArt: manifest });
  await view.c.ART.assetsReady; await view.c.ART.tileArtReady;
  const status = view.c.ART.tileArtStatus();
  if (status.failed.length) throw new Error(`review image loading failed: ${status.failed.join(', ')}`);
  return view.c.ART;
}
async function renderReview(out = path.join(__dirname, 'review')) {
  const manifest = loadManifest(), checked = await checkGlows({ manifest });
  if (!checked.ok) throw new Error(checked.fails.join('\n'));
  // These controlled manifests differ only in the glow field. They still use
  // the real manifest entries, image loader and renderer, not a composite mock.
  const selected = { ...manifest, tiles: Object.fromEntries(REQUIRED_KEYS.map(key => [key, manifest.tiles[key]])) };
  const baseline = { ...selected, tiles: Object.fromEntries(Object.entries(selected.tiles).map(([key, tile]) => {
    const { glow, glowPeriod, ...base } = tile; return [key, base];
  })) };
  const A = await artFor(selected), B = await artFor(baseline);
  fs.mkdirSync(out, { recursive: true });
  const groups = [
    ['star', 'Future / Star', REQUIRED_KEYS.filter(key => key.endsWith(':star'))],
    ['magic', 'Magic', REQUIRED_KEYS.filter(key => key.endsWith(':magic'))],
    ['home', 'Home windows', REQUIRED_KEYS.filter(key => key.startsWith('home:') && !/:star$|:magic$/.test(key))],
  ];
  const files = [];
  for (const [name, title, keys] of groups) {
    const W = 720, header = 98, rowH = 358, colW = 232, imageW = 216;
    const cv = createCanvas(W, header + rowH * keys.length + 16), g = cv.getContext('2d');
    g.fillStyle = '#182b36'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#f8f4df'; g.font = 'bold 22px sans-serif'; g.fillText(`${title}: emissive-layer review`, 20, 32);
    g.font = '12px sans-serif'; g.fillStyle = '#bed3d9';
    g.fillText('Production renderer • same neutral background • full tile canvas, uniform 216 × 324 px', 20, 54);
    for (const [column, label] of ['BASELINE · no glow', 'DAY LOW · 35%', 'NIGHT · full / day peak'].entries()) {
      g.font = 'bold 13px sans-serif'; g.fillStyle = '#edf3ef'; g.fillText(label, 20 + column * colW, 82);
    }
    keys.forEach((key, row) => {
      const top = header + row * rowH, period = manifest.tiles[key].glowPeriod;
      g.fillStyle = row % 2 ? '#1b303c' : '#182b36'; g.fillRect(12, top, W - 24, rowH);
      g.font = 'bold 13px sans-serif'; g.fillStyle = '#cbdcdf';
      g.fillText(`${key}  ·  ${period}s cycle`, 20, top + 17);
      drawTile(B, g, key, 20, top + 24, imageW, period * .75, false);
      drawTile(A, g, key, 20 + colW, top + 24, imageW, period * .75, false);
      drawTile(A, g, key, 20 + colW * 2, top + 24, imageW, period * .75, true);
    });
    const file = path.join(out, `glow-${name}.png`);
    fs.writeFileSync(file, cv.toBuffer('image/png')); files.push(file);
  }
  return files;
}
module.exports = { drawTile, renderReview };
if (require.main === module) renderReview(process.argv[2] && path.resolve(process.argv[2])).then(files => {
  for (const file of files) console.log(file);
}).catch(error => { console.error(`glow review failed: ${error.message}`); process.exitCode = 1; });
