// Brightfield Paragon art geometry. A Paragon stands on three board hexes that all touch.
// It uses the same hex as tile spec v2 (pointy-top, half-width 480, face half-height 354.7, slab depth 113),
// on a 2048 x 2048 canvas. Two layouts, because a merge can point either way on the board:
//   a: one hex behind, two in front      b: two hexes behind, one in front
// The anchor is the point where the three hexes meet; the game puts it on the same point on the board.
// Mirrored in src/generated-art.js (A.PARAGON_SPEC); a test checks they agree.
'use strict';
const HW = 480, FH = 354.7, D = 113, SIZE = 2048, CX = 1024, FRONT_Y = 1552, ROW = 1.5 * FH, HEADROOM = 24;
const BACK_Y = +(FRONT_Y - ROW).toFixed(2);
const LAYOUTS = {
  a: { hexes: [[CX, BACK_Y], [CX - HW, FRONT_Y], [CX + HW, FRONT_Y]] },
  b: { hexes: [[CX - HW, BACK_Y], [CX + HW, BACK_Y], [CX, FRONT_Y]] },
};
for (const L of Object.values(LAYOUTS)) L.anchor = [CX, +(L.hexes.reduce((s, h) => s + h[1], 0) / 3).toFixed(2)];
const face = (x, y) => [[x, y - FH], [x + HW, y - FH / 2], [x + HW, y + FH / 2], [x, y + FH], [x - HW, y + FH / 2], [x - HW, y - FH / 2]];
const sides = (x, y) => { const f = face(x, y); return [[f[4], f[3], [x, y + FH + D], [x - HW, y + FH / 2 + D]], [f[3], f[2], [x + HW, y + FH / 2 + D], [x, y + FH + D]]]; };
module.exports = { HW, FH, D, SIZE, CX, FRONT_Y, BACK_Y, HEADROOM, LAYOUTS, face, sides };
