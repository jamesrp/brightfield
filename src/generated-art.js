// BRIGHTFIELD: imagegen miniature atlas renderer with live canvas animation.
// Load after art.js. No rules, scoring, duration or save state are changed here.
(function (root) {
  'use strict';
  const A = root.ART;
  if (!A || typeof root.Image !== 'function') return;
  const fallback = A.drawBuilding;
  const axes = ['power', 'move', 'food', 'water', 'home', 'make', 'waste', 'wild'];
  const stages = ['0', '1', '2', 'leaf', 'star', 'magic'];
  const atlases = Object.create(null), failures = [];
  const script = root.document && root.document.currentScript;
  const base = script && script.src ? new URL('../assets/', script.src).href : 'assets/';
  const TAU = Math.PI * 2;
  const phase = v => v - Math.floor(v); // tile offsets can make time negative
  A.assetsReady = Promise.all(stages.map(function (stage) {
    return new Promise(function (resolve) {
      const img = new root.Image();
      img.onload = function () { atlases[stage] = img; resolve(true); };
      img.onerror = function () { failures.push(stage); resolve(false); };
      img.src = base + 'buildings-' + stage + '.png';
    });
  }));
  // v0.12 Paragons: optional per-Paragon PNGs in assets/paragons/, loaded only once a Paragon is on the board.
  // Until the art lands a file is missing, and art.js draws a procedural placeholder instead.
  // Geometry (docs/PARAGON-ART-BRIEF.md, tools/art/paragon-spec.cjs): a 2304 x 2304 canvas holding three
  // tile-spec-v2 plots (top face half-width 480) and a plaza over the lanes between them. Layout a = one plot
  // behind, two in front; b = two behind, one in front. The anchor is where the three plots' lanes meet, and
  // the game puts it on that point of the board at the same scale as every tile. A test checks this against
  // the tool; if ART.BOARD's plot size changes, regenerate the templates and update these numbers.
  const PARAGON_SPEC = { size: 2304, cx: 1152, halfW: 480, tileRadius: 0.88, anchorY: { a: 1681.95, b: 1480.41 } };
  A.PARAGON_SPEC = PARAGON_SPEC;
  const placeholderParagon = A.drawParagon;
  if (placeholderParagon) {
    const pcache = Object.create(null);
    const paragonImage = function (axis, layout) {
      const k = axis + '-' + layout;
      if (!pcache[k]) {
        const img = new root.Image(), entry = pcache[k] = { img, ok: false };
        img.onload = function () { entry.ok = true; };
        img.onerror = function () { entry.ok = false; };
        img.src = base + 'paragons/' + k + '.png';
      }
      return pcache[k].ok ? pcache[k].img : null;
    };
    const layoutOf = spots => (spots && spots.filter(p => p.dy > 0).length === 1 ? 'b' : 'a');
    A.paragonLayout = layoutOf;
    // Where the 2048 x 2048 Paragon image goes so its hexes sit on the board's (board hex size u, anchor at x, y).
    A.paragonPlacement = function (x, y, u, layout) {
      const k = (u * ((A.BOARD && A.BOARD.tileRadius) || PARAGON_SPEC.tileRadius) * Math.sqrt(3) / 2) / PARAGON_SPEC.halfW;
      return { k, side: PARAGON_SPEC.size * k, left: x - PARAGON_SPEC.cx * k, top: y - PARAGON_SPEC.anchorY[layout] * k };
    };
    A.drawParagon = function (g, axis, x, y, u, time, night, spots) {
      const layout = layoutOf(spots), img = axes.includes(axis) ? paragonImage(axis, layout) : null;
      if (!img) return placeholderParagon(g, axis, x, y, u, time, night, spots);
      const { side, left, top } = A.paragonPlacement(x, y, u, layout);
      g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(img, left, top, side, side);
      const t = Number.isFinite(time) ? time : 0;
      for (let i = 0; i < 9; i++) { // motes in all three futures' colours keep it alive
        const ph = phase(t * .22 + i / 9);
        g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * .8;
        dot(g, x + Math.sin(i * 2.2 + t * .5) * side * .3, y - side * ph * .45, Math.max(.6, u * .04), ['#c8ff9a', '#9fe4ff', '#e0c4ff'][i % 3]);
        g.restore();
      }
      g.restore();
      return [];
    };
    A.paragonArtReady = function (axis, layout) { const e = pcache[axis + '-' + (layout || 'a')]; return !!(e && e.ok); };
  }
  A.generatedStatus = function () {
    return { ready: Object.keys(atlases).length, total: stages.length, failed: failures.slice() };
  };

  function dot(g, x, y, r, c) {
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function ellipse(g, x, y, rx, ry, c) {
    g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
  }
  function pulse(g, x, y, r, color, alpha) {
    g.save(); g.globalAlpha *= alpha;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(180,240,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
  }
  function rotor(g, x, y, radius, t) {
    g.save(); g.translate(x, y); g.scale(0.73, 1); g.rotate(t);
    for (let j = 0; j < 3; j++) {
      g.rotate(TAU / 3); g.fillStyle = '#ede7d1'; g.strokeStyle = '#746e5e';
      g.lineWidth = Math.max(0.35, radius * 0.025);
      g.beginPath(); g.moveTo(-radius * 0.035, 0);
      g.lineTo(-radius * 0.1, -radius * 0.72); g.lineTo(0, -radius);
      g.lineTo(radius * 0.055, -radius * 0.30); g.closePath(); g.fill(); g.stroke();
    }
    dot(g, 0, 0, radius * 0.085, '#f7efda'); g.restore();
  }
  // Emission strengths retain the procedural art's original smoke behaviour.
  // Coordinates are calibrated to the generated chimney mouths in each cell.
  const emissions = {
    'power:0': [[.635, .051, 3], [.773, .103, 2]], 'power:1': [[.61, .082, 1.6]],
    'move:0': [[.50, .76, .5]], 'move:1': [[.25, .27, .6]],
    'home:0': [[.351, .066, 1.4]], 'home:1': [[.28, .115, .7]],
    'make:0': [[.264, .057, 2.5], [.397, .037, 2]],
    'make:1': [[.235, .125, .6]], 'waste:0': [[.50, .60, 1.2]]
  };

  // Board-only layout: keep icon and field-guide framing unchanged. The
  // fresh illustrations are scaled uniformly, never stretched or masked.
  const PLOT = (A.BOARD && A.BOARD.tileRadius) || 0.93; // board plot radius (art.js); these atlases were fitted to 0.93
  A.boardFootprint = Object.freeze({ tileRadius: PLOT, imageSide: 1.68, groundOffset: 0.18 });
  // Measured ground slab of each atlas cell: [slab width, slab centre x, slab
  // bottom, whole-picture width], as fractions of the 443 px cell
  // (tools/art/measure-atlas.py).
  // On the board each slab is scaled and moved so all 48 slabs share one width
  // and one baseline. Without this, Stage 2 (wind turbines...) sat ~14% smaller
  // and higher than its neighbours. Icons and the field guide are unchanged.
  const SLAB = {
    'power:0': [0.8929,0.4983,0.9402,0.8952], 'move:0': [0.8929,0.4983,0.9402,0.8974], 'food:0': [0.9087,0.4972,0.9402,0.9109], 'water:0': [0.8906,0.4994,0.9402,0.8929],
    'home:0': [0.8997,0.4904,0.9098,0.9087], 'make:0': [0.8906,0.4972,0.9098,0.8929], 'waste:0': [0.8997,0.4994,0.9098,0.9019], 'wild:0': [0.8929,0.5006,0.9098,0.8952],
    'power:1': [0.8974,0.4983,0.9312,0.8997], 'move:1': [0.9042,0.4949,0.9312,0.9087], 'food:1': [0.8997,0.4972,0.929,0.9493], 'water:1': [0.8771,0.5017,0.9335,0.8794],
    'home:1': [0.9245,0.4938,0.9346,0.9357], 'make:1': [0.9109,0.4961,0.9346,0.9245], 'waste:1': [0.9064,0.5028,0.9346,0.9154], 'wild:1': [0.9019,0.4983,0.9346,0.9267],
    'power:2': [0.7373,0.4994,0.8794,0.7396], 'move:2': [0.7756,0.5028,0.8816,0.7802], 'food:2': [0.7802,0.4983,0.8816,0.7869], 'water:2': [0.7689,0.4927,0.8816,0.7756],
    'home:2': [0.7644,0.5242,0.8557,0.7892], 'make:2': [0.7914,0.5017,0.8557,0.7959], 'waste:2': [0.7914,0.4972,0.8557,0.7982], 'wild:2': [0.7711,0.5006,0.8557,0.7937],
    'power:leaf': [0.9042,0.4994,0.9064,0.92], 'move:leaf': [0.9064,0.4961,0.9064,0.9154], 'food:leaf': [0.9042,0.4994,0.9064,0.929], 'water:leaf': [0.9042,0.5017,0.9064,0.9109],
    'home:leaf': [0.9042,0.4994,0.9076,0.9515], 'make:leaf': [0.9042,0.4994,0.9053,0.9357], 'waste:leaf': [0.9042,0.4994,0.9053,0.9154], 'wild:leaf': [0.9042,0.5017,0.9053,0.9448],
    'power:star': [0.8658,0.4961,0.9177,0.9087], 'move:star': [0.8749,0.4893,0.9177,0.9335], 'food:star': [0.8658,0.5006,0.9177,0.8952], 'water:star': [0.8636,0.5017,0.9222,0.9357],
    'home:star': [0.8568,0.5006,0.9256,0.8726], 'make:star': [0.8523,0.4938,0.9256,0.8546], 'waste:star': [0.8636,0.4972,0.9256,0.8929], 'wild:star': [0.8726,0.4972,0.9256,0.9538],
    'power:magic': [0.8591,0.4994,0.9019,0.8613], 'move:magic': [0.8591,0.4972,0.9042,0.8613], 'food:magic': [0.8591,0.4994,0.9042,0.9312], 'water:magic': [0.8568,0.5006,0.9042,0.8591],
    'home:magic': [0.8636,0.5017,0.903,0.8658], 'make:magic': [0.8613,0.4983,0.903,0.8636], 'waste:magic': [0.8591,0.5017,0.903,0.8681], 'wild:magic': [0.8568,0.5028,0.903,0.938]
  };
  A.slabFit = Object.freeze({ width: 0.90, bottom: 0.945, maxWidth: 0.945 }); // largest that keeps every octagonal slab inside the board hex
  A.drawBuilding = function (g, axis, era, variant, x, y, u, time, night, layout) {
    const stage = era === 3 ? variant || 'leaf' : String(era);
    const img = atlases[stage], idx = axes.indexOf(axis);
    if (!img || idx < 0) return fallback(g, axis, era, variant, x, y, u, time, night);
    const t = Number.isFinite(time) ? time : 0;
    const grounded = layout && layout.grounded;
    let side = u * (grounded ? A.boardFootprint.imageSide : 1.90);
    let left = x - side / 2, top = y + u * (grounded ? .28 : .34) - side;
    const slab = grounded && SLAB[axis + ':' + stage];
    if (slab) {
      const base = top + A.slabFit.bottom * side;
      side *= Math.min(A.slabFit.width / slab[0], A.slabFit.maxWidth / slab[3]);
      left = x - slab[1] * side;
      top = base - slab[2] * side;
    }
    if (grounded && PLOT !== 0.93) { // shrink about the plot centre to fit the board's plot
      const k = PLOT / 0.93 * 0.99, yc = y - u * A.boardFootprint.groundOffset;
      left = x + (left - x) * k; top = yc + (top - yc) * k; side *= k;
    }
    const cellW = img.naturalWidth / 4, cellH = img.naturalHeight / 2;
    const px = function (v) { return left + v * side; };
    const py = function (v) { return top + v * side; };
    const emitter = (emissions[axis + ':' + stage] || []).map(function (e) { return [px(e[0]), py(e[1]), e[2]]; });
    g.save();
    // v0.9 sprites are freshly drawn on six-sided slabs. Display complete
    // native miniatures: no silhouette mask, no trimming a diamond into a hex.
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    // Cut atlas rows through transparent gutters, not through a tall spire.
    // Keep the original coordinate origin and scale; all nontransparent pixels
    // survive. This is source-cell extraction, never a board silhouette mask.
    const split = stage === 'leaf' ? 424 : stage === 'star' ? 423 : cellH;
    const row = Math.floor(idx / 4), sourceY = row ? split : 0;
    const sourceH = row ? img.naturalHeight - split : split;
    g.drawImage(img, (idx % 4) * cellW, sourceY, cellW, sourceH,
      left, top + (sourceY - row * cellH) / cellH * side,
      side, sourceH / cellH * side);

    if (stage === 'magic') {
      // Runic motes move independently of the architecture. Crystal light,
      // portal traces and moon-water rings are gentle, not rigid sprite wobble.
      const hue = axis === 'water' ? '#aaddff' : '#dfb7ff';
      pulse(g, px(.50), py(.50), side * .17, hue, .13 + .07 * Math.sin(t * 1.4));
      for (let i = 0; i < 5; i++) {
        const ph = phase(t * .10 + i / 5);
        const xx = px(.24 + i * .12 + Math.sin(t * .8 + i) * .035);
        const yy = py(.73 - ph * .42);
        g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * .75;
        dot(g, xx, yy, Math.max(.45, u * .018), i % 2 ? '#ffe8aa' : hue);
        g.restore();
      }
      if (axis === 'move' || axis === 'power' || axis === 'make' || axis === 'waste') {
        g.strokeStyle = 'rgba(237,205,255,.65)'; g.lineWidth = Math.max(.5, u*.013);
        g.beginPath(); g.ellipse(px(.50), py(.56), side*.115, side*.045, -.12, t*.6, t*.6 + Math.PI*1.4); g.stroke();
      }
      if (axis === 'water') for (let i = 0; i < 2; i++) {
        const age = phase(t*.25+i*.5);
        g.save(); g.globalAlpha *= (1-age)*.6; g.strokeStyle = '#e9e5ff';
        g.lineWidth = Math.max(.5,u*.012); g.beginPath();
        g.ellipse(px(.50),py(.70),side*(.025+age*.10),side*(.01+age*.035),0,0,TAU);g.stroke();g.restore();
      }
    }
    if (axis === 'power' && stage === '2') {
      rotor(g, px(.391), py(.339), side * .111, t * 1.5);
      rotor(g, px(.645), py(.422), side * .087, t * 1.8 + 1.3);
    }
    if (axis === 'power' && stage === 'leaf') {
      pulse(g, px(.55), py(.31), side * .12, '#ffe99e', .2 + .16 * Math.sin(t * 2));
      for (let i = 0; i < 3; i++) {
        const ph = phase(t * .2 + i / 3);
        dot(g, px(.27 + ph * .28), py(.48 - ph * .18), Math.max(.4, u * .015), 'rgba(255,243,180,.8)');
      }
    }
    // v0.11.1: the painted miniatures already show the horse, tractor, car,
    // tram and maglev. The old procedural vehicles were drawn on top as flat
    // boxes (a second car in front of the garage, a maglev floating off its
    // rail), so they are gone until matching imagegen actor sprites arrive
    // (docs/ART-DIRECTION.md). Exhaust stays where the painted tractor is.
    if (axis === 'move' && stage === '2') pulse(g, px(.34), py(.63), side * .035, '#caff9b', .5 + .3 * Math.sin(t * 4));
    if (axis === 'food' && stage === '0') emitter.push([px(.69), py(.53), 1.4]);
    if (axis === 'move' && stage === 'leaf') {
      // station lanterns breathe; the painted tram stays put
      for (const [lx, ly, k] of [[.35, .38, 0], [.59, .45, 1.7]]) pulse(g, px(lx), py(ly), side * .05, '#ffe2a0', .35 + .25 * Math.sin(t * 2.2 + k));
    }
    if (axis === 'move' && stage === 'star') {
      // a soft light glides along the maglev guideway
      const k = phase(t * .22);
      pulse(g, px(.20 + k * .60), py(.73 - k * .26), side * .07, '#9ff3ff', Math.sin(k * Math.PI) * .55);
    }
    if (axis === 'water' && (stage === '2' || stage === 'leaf')) {
      for (let i = 0; i < 3; i++) {
        const age = phase(t * .40 + i / 3);
        g.save(); g.globalAlpha *= (1 - age) * .55;
        g.strokeStyle = '#c7edee'; g.lineWidth = Math.max(.5, u * .015);
        g.beginPath(); g.ellipse(px(.43 + i * .06), py(.66 - i * .025), side * (.025 + age * .09), side * (.009 + age * .023), -.1, 0, TAU); g.stroke(); g.restore();
      }
    }
    if (axis === 'water' && stage === 'star') {
      for (let i = 0; i < 6; i++) {
        const ph = phase(t * .30 + i * .17);
        g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * .8;
        dot(g, px(.33 + (i % 3) * .17), py(.62 - ph * .39), Math.max(.55, u * .022), '#c5ffff'); g.restore();
      }
    }
    if (stage === 'star' && (axis === 'power' || axis === 'make' || axis === 'waste')) {
      const fy = axis === 'power' ? .48 : .56;
      pulse(g, px(.51), py(fy), side * .13, '#73ecff', .25 + .12 * Math.sin(t * 2.6));
      g.strokeStyle = 'rgba(171,252,255,.65)'; g.lineWidth = Math.max(.5, u * .018);
      g.beginPath(); g.ellipse(px(.51), py(fy), side * .11, side * .04, -.14, t, t + Math.PI * 1.1); g.stroke();
    }
    if (axis === 'make' && stage === '2') {
      const ph = phase(t * 1.2);
      for (let i = 0; i < 3; i++) {
        g.save(); g.globalAlpha *= 1 - ph;
        dot(g, px(.51 + Math.cos(i * 2 + t) * ph * .06), py(.66 - ph * .09), Math.max(.5, u * .018), '#fff0a8'); g.restore();
      }
    }
    if (axis === 'food' && stage === 'star') {
      const level = Math.floor(phase(t * .2) * 4);
      pulse(g, px(.51), py(.34 + level * .13), side * .10, '#e7a4ff', .16 + .08 * Math.sin(t * 3));
    }
    if (axis === 'make' && (stage === '1' || stage === 'leaf')) {
      const ph = phase(t * .6);
      g.save(); g.globalAlpha *= (1 - ph) * .65;
      for (let i = 0; i < 3; i++) dot(g, px(.49 + Math.sin(i * 2 + ph) * .07), py(.69 - ph * .08), Math.max(.4, u * .014), '#e3c58b');
      g.restore();
    }
    if (axis === 'waste' && stage === '1') {
      const ph = phase(t * .24);
      g.fillStyle = '#d4b47d';
      g.fillRect(px(.55 + ph * .22), py(.58 + ph * .12), side * .024, side * .019);
    }
    if (axis === 'waste' && stage === 'leaf') {
      for (let i = 0; i < 4; i++) pulse(g, px(.27 + i * .12), py(.78 + Math.sin(i) * .04), side * .025, '#fff0ba', .25 + .22 * Math.sin(t * 2 - i));
    }
    // Vegetation is not wobbling as a rigid building. Small petals and birds
    // move independently, preserving the miniature's grounded architecture.
    if (axis === 'wild' || (axis === 'food' && stage !== '0' && stage !== 'star') || (axis === 'home' && stage === 'leaf')) {
      for (let i = 0; i < 3; i++) {
        const ph = phase(t * .10 + i / 3);
        const xx = px(.20 + ph * .62), yy = py(.46 + i * .13 + Math.sin(t + i) * .025);
        g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * .8;
        ellipse(g, xx, yy, Math.max(.45, u * .023), Math.max(.25, u * .012), i % 2 ? '#d9bb57' : '#b4d36f'); g.restore();
      }
    }
    if (axis === 'waste' && stage === '0') {
      for (let i = 0; i < 3; i++) dot(g, px(.46 + Math.sin(t * 2.6 + i * 2) * .12), py(.56 + Math.cos(t * 3.3 + i) * .06), Math.max(.45, u * .014), '#3f3728');
    }
    if (night && axis !== 'wild' && axis !== 'water') {
      pulse(g, px(.49), py(.64), side * .14, stage === 'magic' ? '#ddbeff' : stage === 'star' ? '#a7e9ff' : '#ffd685', .3 + .05 * Math.sin(t));
    }
    g.restore();
    return emitter;
  };
})(typeof window !== 'undefined' ? window : globalThis);
