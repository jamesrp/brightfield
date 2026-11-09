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
  function vehicle(g, x, y, size, color, t, train, floating, slope = .20) {
    g.save(); g.translate(x, y); g.scale(size, size); g.transform(1, slope, 0, 1, 0, 0);
    ellipse(g, 0, 0.03, 0.53, 0.11, 'rgba(28,37,33,.35)');
    const len = train ? 1.1 : 0.8;
    if (floating) {
      g.shadowBlur = 6; g.shadowColor = '#77eaff';
      g.fillStyle = '#7bd5ed'; g.fillRect(-len / 2, -0.12, len, 0.04); g.shadowBlur = 0;
    } else {
      for (const wx of [-len * .33, len * .33]) {
        dot(g, wx, -0.015, .085, '#252e2c'); dot(g, wx, -0.015, .032, '#b3c2bb');
      }
    }
    g.fillStyle = color; g.fillRect(-len / 2, -0.29, len, .23);
    g.fillStyle = train ? '#e9d5a2' : '#d9ddd0';
    g.beginPath(); g.moveTo(-len / 2, -.29); g.lineTo(-len / 2 + .11, -.39);
    g.lineTo(len / 2 + .09, -.39); g.lineTo(len / 2, -.29); g.closePath(); g.fill();
    g.fillStyle = '#8bb6bf';
    for (let j = 0; j < (train ? 4 : 2); j++) g.fillRect(-len / 2 + .08 + j * .23, -.265, .17, .10);
    g.fillStyle = '#e9da8b'; g.fillRect(len / 2 - .045, -.16, .04, .05);
    if (train && !floating) {
      g.fillStyle = '#517d3d'; g.fillRect(-len / 2 + .08, -.42, len * .8, .05);
      for (let j = 0; j < 5; j++) dot(g, -len / 2 + .18 + j * .16, -.43, .035, j % 2 ? '#e6ba69' : '#739548');
    }
    g.restore();
  }
  function horse(g, x, y, size, t) {
    g.save(); g.translate(x, y); g.scale(size, size);
    ellipse(g, 0, -.27, .3, .13, '#80502c');
    g.strokeStyle = '#5a3a27'; g.lineWidth = .065; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = i < 2 ? -.19 : .18, step = Math.sin(t * 5 + i * 2) * .06;
      g.beginPath(); g.moveTo(lx, -.25); g.lineTo(lx + step, -.04); g.stroke();
    }
    g.fillStyle = '#895936'; g.beginPath(); g.moveTo(.16, -.28); g.lineTo(.23, -.62);
    g.lineTo(.37, -.62); g.lineTo(.40, -.48); g.lineTo(.29, -.44); g.lineTo(.27, -.22); g.fill();
    g.fillStyle = '#37291e'; g.fillRect(.20, -.62, .045, .26);
    dot(g, .34, -.56, .016, '#201b14'); g.restore();
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
  A.boardFootprint = Object.freeze({ tileRadius: 0.93, imageSide: 1.68, groundOffset: 0.18 });
  A.drawBuilding = function (g, axis, era, variant, x, y, u, time, night, layout) {
    const stage = era === 3 ? variant || 'leaf' : String(era);
    const img = atlases[stage], idx = axes.indexOf(axis);
    if (!img || idx < 0) return fallback(g, axis, era, variant, x, y, u, time, night);
    const t = Number.isFinite(time) ? time : 0;
    const grounded = layout && layout.grounded;
    const side = u * (grounded ? A.boardFootprint.imageSide : 1.90);
    const left = x - side / 2, top = y + u * (grounded ? .28 : .34) - side;
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
    if (axis === 'move') {
      const trip = (Math.sin(t * .45) + 1) / 2;
      if (stage === '0') horse(g, px(.43 + trip * .17), py(.76 + trip * .04), side * .15, t);
      else if (stage === '1' || stage === '2') {
        const vx = px(.40 + trip * .18), vy = py(.78 + trip * .04);
        vehicle(g, vx, vy, side * .22, stage === '1' ? '#ad4830' : '#4b8ca3', t, false, false);
        if (stage === '1') emitter.push([vx - side * .09, vy - side * .02, 1.8]);
        else pulse(g, px(.34), py(.63), side * .035, '#caff9b', .5 + .3 * Math.sin(t * 4));
      } else if (stage === 'leaf') {
        vehicle(g, px(.43 + trip * .27), py(.84 - trip * .20), side * .14, '#c49d4d', t, true, false, -.65);
      } else if (stage === 'star') {
        const trip2 = phase(t * .14);
        vehicle(g, px(.20 + trip2 * .60), py(.73 - trip2 * .26), side * .15, '#e2eeec', t, true, true, -.43);
      }
    }
    if (axis === 'food' && stage === '0') {
      const trip = (Math.sin(t * .35) + 1) / 2, vx = px(.30 + trip * .28), vy = py(.73 + trip * .07);
      vehicle(g, vx, vy, side * .16, '#a86934', t, false, false);
      emitter.push([vx + side * .045, vy - side * .064, 1.4]);
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
