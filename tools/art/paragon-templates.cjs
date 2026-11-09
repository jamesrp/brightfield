// Writes assets/paragons/_template/{guide,base,mask}-{a,b}.png from tools/art/paragon-spec.cjs.
// Run: node tools/art/paragon-templates.cjs
'use strict';
const fs = require('fs'), path = require('path'), { createCanvas } = require('@napi-rs/canvas');
const S = require('./paragon-spec.cjs');
const OUT = path.join(__dirname, '../../assets/paragons/_template');
fs.mkdirSync(OUT, { recursive: true });
const poly = (g, p) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
// a side face shows only where no hex of the three sits below that edge
const exposed = (L, x, y) => { const has = (hx, hy) => L.hexes.some(([a, b]) => Math.abs(a - hx) < 1 && Math.abs(b - hy) < 1); return [!has(x - S.HW, y + 1.5 * S.FH), !has(x + S.HW, y + 1.5 * S.FH)]; };
const back2front = (L) => L.hexes.slice().sort((p, q) => p[1] - q[1]);
function base(g, L) {
  for (const [x, y] of back2front(L)) {
    const [sl, sr] = S.sides(x, y);
    poly(g, sl); g.fillStyle = '#7a5236'; g.fill(); poly(g, sr); g.fillStyle = '#5f3f29'; g.fill();
    for (const sd of [sl, sr]) { g.beginPath(); g.moveTo(...sd[0]); g.lineTo(...sd[1]); g.lineWidth = 10; g.strokeStyle = '#d9b44a'; g.stroke(); }
    poly(g, S.face(x, y)); const gr = g.createLinearGradient(0, y - S.FH, 0, y + S.FH); gr.addColorStop(0, '#a9d37a'); gr.addColorStop(1, '#86b85c'); g.fillStyle = gr; g.fill();
  }
}
for (const [name, L] of Object.entries(S.LAYOUTS)) {
  // base: a plain merged grass plaza on the three hexes, with soil sides and a thin gold band
  let cv = createCanvas(S.SIZE, S.SIZE), g = cv.getContext('2d'); base(g, L);
  fs.writeFileSync(path.join(OUT, `base-${name}.png`), cv.toBuffer('image/png'));
  // mask: opaque over the side faces (keep them), transparent where the model may paint
  cv = createCanvas(S.SIZE, S.SIZE); g = cv.getContext('2d'); g.fillStyle = '#000';
  for (const [x, y] of L.hexes) for (const sd of S.sides(x, y)) { poly(g, sd); g.fill(); }
  for (const [x, y] of L.hexes) { poly(g, S.face(x, y)); g.globalCompositeOperation = 'destination-out'; g.fill(); g.globalCompositeOperation = 'source-over'; }
  fs.writeFileSync(path.join(OUT, `mask-${name}.png`), cv.toBuffer('image/png'));
  // guide: base faded, exact hex outlines in red, allowed columns and headroom in blue, the anchor
  cv = createCanvas(S.SIZE, S.SIZE); g = cv.getContext('2d'); base(g, L); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, 0, S.SIZE, S.SIZE);
  g.lineWidth = 4; g.strokeStyle = '#d0302a'; for (const [x, y] of L.hexes) { poly(g, S.face(x, y)); g.stroke(); const ex = exposed(L, x, y); S.sides(x, y).forEach((sd, i) => { if (ex[i]) { poly(g, sd); g.stroke(); } }); }
  g.setLineDash([24, 16]); g.strokeStyle = '#2c5aa0'; g.lineWidth = 4;
  for (const x of [S.CX - 2 * S.HW, S.CX + 2 * S.HW]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S.SIZE); g.stroke(); }
  g.beginPath(); g.moveTo(0, S.HEADROOM); g.lineTo(S.SIZE, S.HEADROOM); g.stroke(); g.setLineDash([]);
  const [ax, ay] = L.anchor; g.fillStyle = '#000'; g.beginPath(); g.arc(ax, ay, 14, 0, 7); g.fill();
  g.font = 'bold 44px sans-serif'; g.fillStyle = '#222'; g.textAlign = 'center';
  g.fillText(`Paragon layout ${name}: ${name === 'a' ? 'one hex behind, two in front' : 'two hexes behind, one in front'}`, S.CX, 120);
  g.fillText(`anchor (where the three hexes meet) ${ax}, ${ay}`, S.CX, 180);
  fs.writeFileSync(path.join(OUT, `guide-${name}.png`), cv.toBuffer('image/png'));
}
console.log('wrote', fs.readdirSync(OUT).join(', '));
