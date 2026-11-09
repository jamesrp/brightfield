// Brightfield Paragon art geometry. A Paragon stands on three board plots that all touch, and covers
// the lanes between them, so it reads as one big place. Each plot is a tile-spec-v2 plot (pointy-top,
// top face half-width 480, half-height 354.7, a low kerb down to the lanes), on a 2304 x 2304 canvas.
// Two layouts, because a merge can point either way on the board:
//   a: one plot behind, two in front      b: two plots behind, one in front
// The anchor is the board point where the three plots' lanes meet (the middle of the three); the game
// puts it on the same point of the board at the same scale as every tile.
// Board numbers (plot radius and kerb, in board hex units) come from ART.BOARD when the board defines
// them, so the art follows the board. Mirrored in src/generated-art.js (A.PARAGON_SPEC); a test checks it.
'use strict';
let BOARD = {};
try { require('../../src/art.js'); BOARD = (globalThis.ART && globalThis.ART.BOARD) || {}; } catch (e) { /* defaults below */ }
const TILE_RADIUS = BOARD.tileRadius || 0.88, KERB = BOARD.kerb || 0.06, SQ = 0.64, R3 = Math.sqrt(3);
const HW = 480, FH = 354.7, SIZE = 2304, CX = 1152, HEADROOM = 24, MARGIN = 28;
const U = HW / (TILE_RADIUS * R3 / 2);               // one board hex unit, in canvas pixels
const D = Math.round(KERB * U * 10) / 10;              // kerb depth
const STEP_X = R3 * U / 2, ROW = 1.5 * U * SQ;         // centre offsets to the neighbouring row
const FRONT_Y = Math.round((SIZE - MARGIN - FH - D) * 100) / 100;
const BACK_Y = Math.round((FRONT_Y - ROW) * 100) / 100;
const r2 = (v) => Math.round(v * 100) / 100;
const LAYOUTS = {
  a: { hexes: [[CX, BACK_Y], [r2(CX - STEP_X), FRONT_Y], [r2(CX + STEP_X), FRONT_Y]] },
  b: { hexes: [[r2(CX - STEP_X), BACK_Y], [r2(CX + STEP_X), BACK_Y], [CX, FRONT_Y]] },
};
for (const L of Object.values(LAYOUTS)) L.anchor = [CX, r2(L.hexes.reduce((s, h) => s + h[1], 0) / 3)];
const face = (x, y) => [[x, y - FH], [x + HW, y - FH / 2], [x + HW, y + FH / 2], [x, y + FH], [x - HW, y + FH / 2], [x - HW, y - FH / 2]];
// The plaza: the three plot faces, the lane strips between each pair, and the small junction in the middle.
function plaza(L) {
  const F = L.hexes.map(([x, y]) => face(x, y)), parts = F.slice();
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const inner = [];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    // the two facing edges: on each face, the two vertices nearest the other plot's centre
    const pick = (f, c) => f.map((v, k) => [near(v, c), k]).sort((a, b) => a[0] - b[0]).slice(0, 2).map(([, k]) => f[k]);
    const [a1, a2] = pick(F[i], L.hexes[j]), [b1, b2] = pick(F[j], L.hexes[i]);
    const bb = near(a1, b1) + near(a2, b2) < near(a1, b2) + near(a2, b1) ? [b1, b2] : [b2, b1];
    parts.push([a1, a2, bb[1], bb[0]]);
  }
  for (let i = 0; i < 3; i++) { const c = L.anchor; inner.push(F[i].reduce((m, v) => near(v, c) < near(m, c) ? v : m)); }
  parts.push(inner);
  return parts;
}
module.exports = { TILE_RADIUS, KERB, HW, FH, D, U, SIZE, CX, FRONT_Y, BACK_Y, HEADROOM, MARGIN, LAYOUTS, face, plaza };
