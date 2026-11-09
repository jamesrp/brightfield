// BRIGHTFIELD: per-tile miniature loader (art spec v2, docs/ART-DIRECTION.md).
// Load after generated-art.js and assets/tiles/manifest.js. A building with an
// entry in window.BF_TILE_ART.tiles is drawn from its own 1024 x 1536 PNG whose
// ground slab is exactly the board hex; everything else falls back to the v0.9
// atlases (and those fall back to procedural art). No rules or saves change.
(function (root) {
  'use strict';
  const A = root.ART, M = root.BF_TILE_ART;
  if (!A || typeof root.Image !== 'function') return;
  // Canonical tile geometry in tile pixels. Keep in sync with tools/art/spec.cjs.
  const HEX_HALF_W = ((A.BOARD && A.BOARD.tileRadius) || 0.93) * Math.sqrt(3) / 2; // board plot half-width in units of u (art.js BOARD)
  const SPEC = Object.freeze({ w: 1024, h: 1536, cx: 512, cy: 1130, halfW: 480, faceHalfH: 354.7, depth: ((A.BOARD && A.BOARD.kerb) || 0.19) * 480 / HEX_HALF_W });
  A.tileSpec = SPEC;
  const tiles = (M && M.tiles) || {}, sprites = (M && M.sprites) || {}, travellers = (M && M.travellers) || {};
  const imgs = Object.create(null), failed = [];
  const script = root.document && root.document.currentScript;
  const base = script && script.src ? new URL('../assets/tiles/', script.src).href : 'assets/tiles/';
  const srcs = new Set();
  for (const k in tiles) { if (tiles[k].src) srcs.add(tiles[k].src); if (tiles[k].glow) srcs.add(tiles[k].glow); }
  for (const k in sprites) if (sprites[k].src) srcs.add(sprites[k].src);
  A.tileArtReady = Promise.all(Array.from(srcs).map(function (src) {
    return new Promise(function (resolve) {
      const img = new root.Image();
      img.onload = function () { imgs[src] = img; resolve(true); };
      img.onerror = function () { failed.push(src); resolve(false); };
      img.src = base + src;
    });
  }));
  A.tileArtStatus = function () { return { listed: srcs.size, ready: Object.keys(imgs).length, failed: failed.slice() }; };
  if (!srcs.size) return; // nothing listed yet: atlases exactly as before

  const TAU = Math.PI * 2;
  const phase = v => v - Math.floor(v);
  // Board: the tile's top face lands exactly on the board hex. Icons (cards,
  // tech rows, guide): same footprint as the old atlas framing (slab ~1.67u).
  function frame(x, y, u, grounded) {
    const k = grounded ? u * HEX_HALF_W / SPEC.halfW : u * 0.835 / SPEC.halfW;
    const cx = x, cy = grounded ? y - u * 0.18 : y - u * 0.19;
    return { k, X: v => cx + (v - SPEC.cx) * k, Y: v => cy + (v - SPEC.cy) * k };
  }
  function sprite(g, name, x, y, k, flip, rot, alpha) {
    const s = sprites[name], img = s && imgs[s.src];
    if (!img) return false;
    const ax = (s.anchor || [img.naturalWidth / 2, img.naturalHeight])[0], ay = (s.anchor || [0, img.naturalHeight])[1];
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(flip ? -k : k, k);
    if (alpha !== undefined) g.globalAlpha *= alpha;
    g.drawImage(img, -ax, -ay); g.restore();
    return true;
  }
  // Point along a polyline path at fraction f (0..1), plus the x direction.
  function along(path, f) {
    if (path.length < 2) return [path[0][0], path[0][1], 1];
    let total = 0; const seg = [];
    for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push(d); total += d; }
    let d = f * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, d / seg[i]) : 0, a = path[i], b = path[i + 1];
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, b[0] >= a[0] ? 1 : -1];
      }
      d -= seg[i];
    }
    return [path[0][0], path[0][1], 1];
  }
  function actor(g, a, F, t) {
    const period = a.period || 6;
    if (a.path) {
      let f = phase(t / period), dir = 1;
      if (a.mode !== 'loop') { dir = f < 0.5 ? 1 : -1; f = f < 0.5 ? f * 2 : 2 - f * 2; f = f * f * (3 - 2 * f); }
      const p = along(a.path, f), moving = p[2] * dir;
      const bob = a.bob ? Math.sin(t * TAU / (a.bobPeriod || 0.6)) * a.bob : 0;
      sprite(g, a.sprite, F.X(p[0]), F.Y(p[1] + bob), F.k, a.face !== 'none' && moving < 0, 0);
    } else if (a.at) {
      const rot = a.spin ? t * a.spin * TAU : a.sway ? Math.sin(t * TAU / period) * a.sway * Math.PI / 180 : 0;
      const bob = a.bob ? Math.sin(t * TAU / period) * a.bob : 0;
      const alpha = a.pulse ? 1 - a.pulse * (0.5 + 0.5 * Math.sin(t * TAU / period)) : undefined;
      sprite(g, a.sprite, F.X(a.at[0]), F.Y(a.at[1] + bob), F.k, false, rot, alpha);
    }
  }
  const atlasDraw = A.drawBuilding;
  A.drawBuilding = function (g, axis, era, variant, x, y, u, time, night, layout) {
    const stage = era === 3 ? variant || 'leaf' : String(era);
    const T = tiles[axis + ':' + stage], img = T && imgs[T.src];
    if (!img) return atlasDraw.apply(this, arguments);
    const t = Number.isFinite(time) ? time : 0, F = frame(x, y, u, layout && layout.grounded);
    g.save();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, F.X(0), F.Y(0), SPEC.w * F.k, SPEC.h * F.k);
    const glow = T.glow && imgs[T.glow];
    if (glow) {
      // Emissive layer (same canvas as the tile), breathing between 35% and 100%.
      g.save(); g.globalCompositeOperation = 'lighter';
      g.globalAlpha *= (night ? 1 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * TAU / (T.glowPeriod || 3))));
      g.drawImage(glow, F.X(0), F.Y(0), SPEC.w * F.k, SPEC.h * F.k); g.restore();
    }
    for (const a of T.actors || []) actor(g, a, F, t);
    g.restore();
    return (T.emitters || []).map(e => [F.X(e[0]), F.Y(e[1]), e[2]]);
  };
  // Ambient travellers between tiles (main.js). Returns false when no sprite
  // is listed for this age, so main.js draws its procedural fallback.
  A.drawTraveller = function (g, key, x, y, u, dir, t, alpha) {
    const name = travellers[key], s = name && sprites[name];
    if (!s || !imgs[s.src]) return false;
    const k = u * HEX_HALF_W / SPEC.halfW, bob = s.bob ? Math.sin(t * 6) * s.bob * k : 0;
    return sprite(g, name, x, y + bob, k, dir < 0, 0, alpha);
  };
})(typeof window !== 'undefined' ? window : globalThis);
