#!/usr/bin/env node
// Writes the exact-geometry templates for imagegen into assets/tiles/_template/.
//   guide.png       – slab outline, centre, safe columns and headroom line, for looking at
//   base-plain.png  – an empty grass-topped slab at the exact geometry: use as the edit/reference image
//   edit-mask.png   – OpenAI-style edit mask: transparent = may repaint, opaque = keep (the two side faces)
// Usage: node tools/art/make-templates.cjs
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const S = require('./spec.cjs');
const { w, h, cx, cy, halfW: hw, faceHalfH: fh, depth: d, headroom } = S.SPEC;
const out = path.resolve(__dirname, '../../assets/tiles/_template');
fs.mkdirSync(out, { recursive: true });

function plainSlab(g) {
  // sides: layered soil, darker toward the bottom
  for (const side of [S.SIDE_LEFT, S.SIDE_RIGHT]) {
    S.path(g, side);
    const gr = g.createLinearGradient(0, cy + fh / 2, 0, cy + fh + d);
    gr.addColorStop(0, side === S.SIDE_LEFT ? '#8a6440' : '#74532f'); gr.addColorStop(1, side === S.SIDE_LEFT ? '#5e432a' : '#4d3622');
    g.fillStyle = gr; g.fill();
  }
  // top face: plain meadow
  S.path(g, S.FACE);
  const gr = g.createLinearGradient(0, cy - fh, 0, cy + fh); gr.addColorStop(0, '#a4cf6a'); gr.addColorStop(1, '#86b955');
  g.fillStyle = gr; g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(255,250,215,0.55)'; g.lineWidth = 8; g.stroke(); g.restore(); // rim inside the face
}
{ // base-plain.png
  const cv = createCanvas(w, h), g = cv.getContext('2d'); plainSlab(g);
  fs.writeFileSync(path.join(out, 'base-plain.png'), cv.toBuffer('image/png'));
}
{ // edit-mask.png: opaque only where the template must survive (side faces)
  const cv = createCanvas(w, h), g = cv.getContext('2d');
  g.fillStyle = '#000'; for (const side of [S.SIDE_LEFT, S.SIDE_RIGHT]) { S.path(g, side); g.fill(); }
  fs.writeFileSync(path.join(out, 'edit-mask.png'), cv.toBuffer('image/png'));
}
{ // guide.png
  const cv = createCanvas(w, h), g = cv.getContext('2d');
  g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,170,90,0.10)'; S.path(g, S.KEEP); g.fill();
  plainSlab(g);
  g.lineWidth = 3; g.strokeStyle = '#d0402f'; S.path(g, S.SILHOUETTE); g.stroke();
  g.setLineDash([12, 10]); g.strokeStyle = '#2f6fd0'; g.lineWidth = 2;
  for (const x of [cx - hw, cx + hw]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.beginPath(); g.moveTo(0, headroom); g.lineTo(w, headroom); g.stroke();
  g.setLineDash([]); g.strokeStyle = '#222'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 20, cy); g.lineTo(cx + 20, cy); g.moveTo(cx, cy - 20); g.lineTo(cx, cy + 20); g.stroke();
  g.fillStyle = '#333'; g.font = '22px sans-serif';
  g.fillText('Brightfield tile spec v2 · 1024 x 1536 · transparent outside the art', 40, 70);
  g.fillText('Blue dashes: nothing left/right of these columns, nothing above the top line', 40, 100);
  g.fillText(`Red: exact slab outline (pointy-top hex, 960 wide, kerb depth ${d})`, 40, 130);
  g.fillText(`Hex centre (${cx}, ${cy})`, cx + 26, cy - 8);
  fs.writeFileSync(path.join(out, 'guide.png'), cv.toBuffer('image/png'));
}
console.log('wrote', out);
