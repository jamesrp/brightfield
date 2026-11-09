#!/usr/bin/env node
// Renders the real game (no browser needed) so art can be reviewed in context.
// Writes into tools/art/out/ (git-ignored):
//   gallery.png        all 48 buildings on the board, labelled; NEW = spec v2 tile, old = atlas
//   board-<era>.png     a filled radius-2 town at 1440 x 900 for each age, plus a mixed futures town
//   closeup-<era>.png   the same town cropped and enlarged 2x around the centre
//   anim-<key>.png      6 frames, 0.5 s apart, for every tile that lists actors (and the travellers)
// Usage: npm run art:preview    or    node tools/art/preview.cjs [outdir]
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { make } = require('../../tests/ui-harness.cjs');
const S = require('./spec.cjs');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(out, { recursive: true });

async function game(w = 1440, h = 900) {
  const v = make(w, h, '?mode=cozy&seed=9&cards=0', true);
  await v.c.ART.assetsReady; await v.c.ART.tileArtReady; return v;
}
const label = (st) => (st === '0' || st === '1' || st === '2') ? { era: +st, variant: null } : { era: 3, variant: st };

(async () => {
  // gallery
  {
    const v = await game(), A = v.c.ART, T = v.c.TECHS, tiles = (v.c.BF_TILE_ART && v.c.BF_TILE_ART.tiles) || {};
    const CW = 200, CH = 270, cv = createCanvas(CW * 8, CH * 6), g = cv.getContext('2d');
    g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, cv.width, cv.height); g.textAlign = 'center';
    S.STAGES.forEach((st, row) => S.AXES.forEach((axis, col) => {
      const { era, variant } = label(st), x = col * CW + CW / 2, y = row * CH + 175, u = 92;
      // the board hex underneath, as the game draws it
      g.save(); g.translate(x, y); g.fillStyle = '#8a6a46'; g.beginPath();
      for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6, px = Math.cos(a) * u * S.BOARD.tileRadius, py = Math.sin(a) * u * S.BOARD.tileRadius * .64 + u * S.BOARD.kerb; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.fill();
      g.fillStyle = '#97cf6a'; g.beginPath();
      for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6, px = Math.cos(a) * u * S.BOARD.tileRadius, py = Math.sin(a) * u * S.BOARD.tileRadius * .64; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.fill(); g.restore();
      A.drawBuilding(g, axis, era, variant, x, y + u * .18, u, .8, false, { grounded: true });
      const isNew = !!tiles[axis + ':' + st];
      g.fillStyle = isNew ? '#1d7a3a' : '#8a7f6a'; g.font = 'bold 13px sans-serif';
      g.fillText((isNew ? 'NEW ' : 'old ') + T.tech(axis, era, variant).name, x, row * CH + CH - 18, CW - 8);
    }));
    fs.writeFileSync(path.join(out, 'gallery.png'), cv.toBuffer('image/png'));
  }
  // boards
  const eras = { '0': {}, '1': {}, '2': {}, leaf: {}, star: {}, magic: {}, mixed: {} };
  for (const name of Object.keys(eras)) {
    const v = await game(), f = v.c.__BF, s = f.s, AX = f.B.AXES, cells = [];
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (f.B.hexDist(q, r) <= 2) cells.push([q, r]);
    cells.forEach(([q, r], k) => { s.tiles[f.B.key(q, r)] = { q, r, type: AX[k % 8], critter: null }; });
    AX.forEach((a, k) => {
      if (name === 'mixed') { s.era[a] = 3; s.variant[a] = ['leaf', 'star', 'magic'][k % 3]; }
      else { const l = label(name); s.era[a] = l.era; s.variant[a] = l.variant; }
    });
    v.step(120);
    const file = path.join(out, `board-${name}.png`); v.save(file);
    const img = await loadImage(path.resolve(file)), cv = createCanvas(1000, 640), g = cv.getContext('2d');
    g.imageSmoothingQuality = 'high'; g.drawImage(img, f.V.cx - 250, f.V.cy - 190, 500, 320, 0, 0, 1000, 640);
    fs.writeFileSync(path.join(out, `closeup-${name}.png`), cv.toBuffer('image/png'));
  }
  // animation strips
  {
    const v = await game(), A = v.c.ART, M = v.c.BF_TILE_ART || {};
    for (const [key, t] of Object.entries(M.tiles || {})) {
      if (!(t.actors || []).length && !t.glow) continue;
      const [axis, st] = key.split(':'), { era, variant } = label(st);
      const cv = createCanvas(6 * 260, 300), g = cv.getContext('2d'); g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < 6; i++) A.drawBuilding(g, axis, era, variant, i * 260 + 130, 210, 130, i * 0.5, false, { grounded: true });
      fs.writeFileSync(path.join(out, `anim-${key.replace(':', '-')}.png`), cv.toBuffer('image/png'));
    }
    const trav = Object.keys(M.travellers || {});
    if (trav.length) {
      const cv = createCanvas(trav.length * 160, 140), g = cv.getContext('2d'); g.fillStyle = '#97cf6a'; g.fillRect(0, 0, cv.width, cv.height);
      trav.forEach((k, i) => { A.drawTraveller(g, k, i * 160 + 50, 100, 60, 1, 0, 1); A.drawTraveller(g, k, i * 160 + 115, 100, 60, -1, 0, 1); });
      fs.writeFileSync(path.join(out, 'anim-travellers.png'), cv.toBuffer('image/png'));
    }
  }
  console.log('wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
