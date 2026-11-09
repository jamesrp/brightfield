#!/usr/bin/env node
// Acceptance checks for spec v2 tiles and the manifest. Exit code 1 if any check fails.
// Usage: node tools/art/check-tiles.cjs            (every tile listed in assets/tiles/manifest.js)
//        node tools/art/check-tiles.cjs a.png b.png (just these files, geometry only)
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const S = require('./spec.cjs');
const { w, h, cx, cy, halfW: hw, faceHalfH: fh, depth: d, headroom } = S.SPEC;
const TILES = path.resolve(__dirname, '../../assets/tiles');

function loadManifest() {
  const c = { window: {} }; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(TILES, 'manifest.js'), 'utf8'), c);
  return c.window.BF_TILE_ART || {};
}

async function checkTile(file) {
  const fails = [], notes = [];
  const img = await loadImage(path.resolve(file));
  if (img.width !== w || img.height !== h) { fails.push(`size ${img.width}x${img.height}, want ${w}x${h}`); return { fails, notes }; }
  const cv = createCanvas(w, h), g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, w, h).data, A = (x, y) => px[(y * w + x) * 4 + 3];
  // 1. transparent background
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [cx, h - 1]]) if (A(x, y) > 8) fails.push(`background not transparent at ${x},${y}`);
  // 2. nothing outside the keep region (2 px antialiasing tolerance)
  let outside = 0, top = h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (A(x, y) <= 16) continue;
    top = Math.min(top, y);
    const dx = Math.abs(x + 0.5 - cx);
    if (dx > hw + 2 || y + 0.5 > S.bottomY(x + 0.5) + 2) outside++;
  }
  if (outside > 0) fails.push(`${outside} px outside the hex columns or below the slab`);
  // 3. headroom
  if (top < headroom) fails.push(`art reaches y=${top}; keep ${headroom} px clear at the top`);
  // 4. slab fully painted and solid (sample a grid inside the silhouette, 4 px in from the edge)
  let inside = 0, solid = 0;
  for (let y = Math.floor(cy - fh); y < cy + fh + d; y += 3) for (let x = cx - hw; x < cx + hw; x += 3) {
    const shrink = (p) => [cx + (p[0] - cx) * (1 - 4 / hw), (cy + d / 2) + (p[1] - cy - d / 2) * (1 - 4 / hw)];
    if (!S.inPoly(S.SILHOUETTE.map(shrink), x, y)) continue;
    inside++; if (A(x, y) >= 200) solid++;
  }
  const cover = solid / inside;
  if (cover < 0.995) fails.push(`slab only ${(cover * 100).toFixed(1)}% solid (holes or a smaller/different plate)`);
  // 5. slab edges land on the spec lines (bottom outline and the two vertical sides)
  let worstBottom = 0, worstSide = 0;
  for (let x = Math.ceil(cx - hw + 8); x < cx + hw - 8; x += 4) {
    let low = -1; for (let y = h - 1; y >= 0; y--) if (A(x, y) >= 128) { low = y + 1; break; }
    worstBottom = Math.max(worstBottom, Math.abs(low - S.bottomY(x + 0.5)));
  }
  for (let y = Math.ceil(cy - fh / 2 + 6); y < cy + fh / 2 + d - 6; y += 4) {
    let l = -1, r = -1; for (let x = 0; x < w; x++) if (A(x, y) >= 128) { if (l < 0) l = x; r = x + 1; }
    worstSide = Math.max(worstSide, Math.abs(l - (cx - hw)), Math.abs(r - (cx + hw)));
  }
  if (worstBottom > 3) fails.push(`slab bottom edge off by up to ${worstBottom.toFixed(1)} px (want <= 3)`);
  if (worstSide > 3) fails.push(`slab side edges off by up to ${worstSide.toFixed(1)} px (want <= 3)`);
  // 6. semi-transparent fringe (soft haze around foliage is fine; a big ring is not)
  let semi = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 16 && px[i] < 200) semi++;
  if (semi > 60000) notes.push(`${semi} semi-transparent px: check for a halo`);
  notes.push(`top y=${top}, slab ${(cover * 100).toFixed(1)}% solid, edges within ${Math.max(worstBottom, worstSide).toFixed(1)} px`);
  return { fails, notes };
}

function checkManifest(M) {
  const fails = [], inCanvas = p => Array.isArray(p) && p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h;
  const sprites = M.sprites || {};
  for (const [key, t] of Object.entries(M.tiles || {})) {
    const [axis, stage] = key.split(':');
    if (!S.AXES.includes(axis)) fails.push(`${key}: unknown building type ${axis}`);
    if (!t.src || !fs.existsSync(path.join(TILES, t.src))) fails.push(`${key}: missing file ${t.src}`);
    if (t.glow && !fs.existsSync(path.join(TILES, t.glow))) fails.push(`${key}: missing glow ${t.glow}`);
    for (const e of t.emitters || []) if (!inCanvas(e)) fails.push(`${key}: emitter ${e} off canvas`);
    for (const a of t.actors || []) {
      if (!sprites[a.sprite]) fails.push(`${key}: actor sprite '${a.sprite}' not in sprites`);
      if (!a.path && !a.at) fails.push(`${key}: actor '${a.sprite}' needs path or at`);
      for (const p of a.path || [a.at]) if (!inCanvas(p)) fails.push(`${key}: actor '${a.sprite}' point ${p} off canvas`);
      for (const p of a.path || []) if (!S.inPoly(S.FACE, p[0], p[1])) fails.push(`${key}: actor '${a.sprite}' path point ${p} is off the top face`);
    }
    if (stage && !S.STAGES.includes(stage)) fails.push(`${key}: '${stage}' is not a standard stage (fine for Paragons, just checking)`);
  }
  for (const [name, s] of Object.entries(sprites)) {
    if (!s.src || !fs.existsSync(path.join(TILES, s.src))) fails.push(`sprite ${name}: missing file ${s.src}`);
    if (!Array.isArray(s.anchor)) fails.push(`sprite ${name}: needs anchor [x, y] (its ground point)`);
  }
  for (const [k, name] of Object.entries(M.travellers || {})) if (!sprites[name]) fails.push(`traveller ${k}: sprite '${name}' not in sprites`);
  return fails;
}

(async () => {
  const files = process.argv.slice(2);
  let bad = 0;
  if (files.length) {
    for (const f of files) { const r = await checkTile(f); bad += r.fails.length; console.log(`${r.fails.length ? 'FAIL' : 'PASS'} ${f}\n  ${[...r.fails, ...r.notes].join('\n  ')}`); }
  } else {
    const M = loadManifest(), mf = checkManifest(M);
    for (const f of mf) console.log('FAIL manifest: ' + f);
    bad += mf.filter(f => !/not a standard stage/.test(f)).length;
    const listed = Object.entries(M.tiles || {});
    for (const [key, t] of listed) {
      const file = path.join(TILES, t.src || ''); if (!t.src || !fs.existsSync(file)) continue;
      const r = await checkTile(file); bad += r.fails.length;
      console.log(`${r.fails.length ? 'FAIL' : 'PASS'} ${key} (${t.src})\n  ${[...r.fails, ...r.notes].join('\n  ')}`);
    }
    const missing = []; for (const st of S.STAGES) for (const ax of S.AXES) if (!(M.tiles || {})[ax + ':' + st]) missing.push(ax + ':' + st);
    console.log(`${listed.length} tiles listed; ${missing.length} of 48 standard tiles still on the old atlas art.`);
  }
  console.log(bad ? `${bad} problem(s)` : 'all checks pass');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
