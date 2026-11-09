// Writes assets/paragons/_template/{guide,base,mask}-{a,b}.png from tools/art/paragon-spec.cjs.
// Run: node tools/art/paragon-templates.cjs
'use strict';
const fs = require('fs'), path = require('path'), { createCanvas } = require('@napi-rs/canvas');
const S = require('./paragon-spec.cjs');
const OUT = path.join(__dirname, '../../assets/paragons/_template');
fs.mkdirSync(OUT, { recursive: true });
const poly = (g, p, dy = 0) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy)); g.closePath(); };
const fillPlaza = (g, L, dy, style) => { g.fillStyle = style; for (const p of S.plaza(L)) { poly(g, p, dy); g.fill(); } };
// The kerb: the plaza swept straight down by its depth (drawn in thin steps), then the top over it.
function kerb(g, L, style) { for (let t = S.D; t > 0; t -= 1.5) fillPlaza(g, L, t, style); }
function top(g, L) { const gr = g.createLinearGradient(0, S.BACK_Y - S.FH, 0, S.FRONT_Y + S.FH); gr.addColorStop(0, '#a9d37a'); gr.addColorStop(1, '#86b85c'); fillPlaza(g, L, 0, gr); }
function base(g, L) { kerb(g, L, '#b89a5a'); g.save(); g.globalAlpha = 0.6; fillPlaza(g, L, S.D, '#7a5a2a'); g.restore(); top(g, L); }
for (const [name, L] of Object.entries(S.LAYOUTS)) {
  // base: the merged plaza (three plots and the lanes between them) with a gold-stone kerb
  let cv = createCanvas(S.SIZE, S.SIZE), g = cv.getContext('2d'); base(g, L);
  fs.writeFileSync(path.join(OUT, `base-${name}.png`), cv.toBuffer('image/png'));
  // mask: opaque over the kerb (keep it), transparent where the model may paint (the plaza and the sky)
  cv = createCanvas(S.SIZE, S.SIZE); g = cv.getContext('2d'); kerb(g, L, '#000');
  g.globalCompositeOperation = 'destination-out'; fillPlaza(g, L, 0, '#000');
  fs.writeFileSync(path.join(OUT, `mask-${name}.png`), cv.toBuffer('image/png'));
  // guide: the plaza, the three plots it joins (dashed: where the lanes ran), columns, headroom and the anchor
  cv = createCanvas(S.SIZE, S.SIZE); g = cv.getContext('2d'); base(g, L); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, 0, S.SIZE, S.SIZE);
  g.lineWidth = 4; g.strokeStyle = '#d0302a'; g.setLineDash([18, 12]);
  for (const [x, y] of L.hexes) { poly(g, S.face(x, y)); g.stroke(); }
  g.setLineDash([24, 16]); g.strokeStyle = '#2c5aa0';
  const xs = L.hexes.map(h => h[0]), x0 = Math.min(...xs) - S.HW, x1 = Math.max(...xs) + S.HW;
  for (const x of [x0, x1]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S.SIZE); g.stroke(); }
  g.beginPath(); g.moveTo(0, S.HEADROOM); g.lineTo(S.SIZE, S.HEADROOM); g.stroke(); g.setLineDash([]);
  const [ax, ay] = L.anchor; g.fillStyle = '#000'; g.beginPath(); g.arc(ax, ay, 14, 0, 7); g.fill();
  g.font = 'bold 48px sans-serif'; g.fillStyle = '#222'; g.textAlign = 'center';
  g.fillText(`Paragon layout ${name}: ${name === 'a' ? 'one plot behind, two in front' : 'two plots behind, one in front'}`, S.CX, 130);
  g.fillText(`anchor ${ax}, ${ay}   ·   red dashes: the three plots`, S.CX, 195);
  g.fillText('the plaza covers the lanes between them', S.CX, 260);
  fs.writeFileSync(path.join(OUT, `guide-${name}.png`), cv.toBuffer('image/png'));
}
console.log('wrote', fs.readdirSync(OUT).join(', '));
