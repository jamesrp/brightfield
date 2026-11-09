// Brightfield tile art spec v2: the one source of truth for tile geometry.
// Mirrors SPEC in src/tile-art.js. Units are tile pixels on a 1024 x 1536 canvas.
'use strict';
// The board plot (src/art.js ART.BOARD) fixes the side depth: the kerb, in tile pixels.
require('../../src/art.js');
const BOARD = globalThis.ART.BOARD;
const SPEC = Object.freeze({ w: 1024, h: 1536, cx: 512, cy: 1130, halfW: 480, faceHalfH: 354.7,
  depth: Math.round(BOARD.kerb * 480 / (BOARD.tileRadius * Math.sqrt(3) / 2) * 10) / 10, headroom: 24 });
const { w, h, cx, cy, halfW: hw, faceHalfH: fh, depth: d } = SPEC;
const q = fh / 2; // height of each slanted edge
// Pointy-top hex top face, clockwise from the top vertex.
const FACE = [[cx, cy - fh], [cx + hw, cy - q], [cx + hw, cy + q], [cx, cy + fh], [cx - hw, cy + q], [cx - hw, cy - q]];
// Visible slab = top face plus the two front side faces, depth d.
const SILHOUETTE = [FACE[0], FACE[1], FACE[2], [cx + hw, cy + q + d], [cx, cy + fh + d], [cx - hw, cy + q + d], FACE[4], FACE[5]];
const SIDE_LEFT = [FACE[4], FACE[3], [cx, cy + fh + d], [cx - hw, cy + q + d]];
const SIDE_RIGHT = [FACE[3], FACE[2], [cx + hw, cy + q + d], [cx, cy + fh + d]];
// Everything may rise above the slab, but nothing may sit outside the hex's
// columns or below the slab's bottom outline.
const KEEP = [[cx - hw, 0], [cx + hw, 0], [cx + hw, cy + q + d], [cx, cy + fh + d], [cx - hw, cy + q + d]];
const frontEdgeY = x => cy + fh - Math.min(hw, Math.abs(x - cx)) * q / hw; // lower edge of the top face
const bottomY = x => frontEdgeY(x) + d;                                    // lower edge of the slab
const backEdgeY = x => cy - fh + Math.min(hw, Math.abs(x - cx)) * q / hw;  // upper edge of the top face
function inPoly(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function path(g, poly) { g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
const STAGES = ['0', '1', '2', 'leaf', 'star', 'magic'];
const AXES = ['power', 'move', 'food', 'water', 'home', 'make', 'waste', 'wild'];
module.exports = { BOARD, SPEC, FACE, SILHOUETTE, SIDE_LEFT, SIDE_RIGHT, KEEP, frontEdgeY, bottomY, backEdgeY, inPoly, path, STAGES, AXES };
