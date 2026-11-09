// BRIGHTFIELD core rules. Pure, deterministic, seeded. Runs in the browser (window.BF) and Node (require).
(function (root) {
  'use strict';
  const VERSION = '0.12.0';
  const AXES = ['power', 'move', 'food', 'water', 'home', 'make', 'waste', 'wild'];
  // v0.6: adjacency OPINIONS with real-world reasons (the son's wish #2: "why do things go next to each other?").
  // Each rule is directed: tile type `a` (the one who thinks) has an opinion about a neighbouring `b`.
  // `when(eraA, eraB)` makes rules change as the town changes (the dump becomes compost -> farms start loving it).
  // v = +1 (a heart, a like) or -1 (a frown, a dislike). Reason ids map to a picture (art.js) and a sentence (REASONS).
  const RULES = [
    { a: 'home', b: 'wild', v: 1, why: 'park' },
    { a: 'home', b: 'food', v: 1, why: 'apple', when: (ea, eb) => eb >= 1 },
    { a: 'home', b: 'move', v: 1, why: 'bus' },
    { a: 'move', b: 'home', v: 1, why: 'riders' },
    { a: 'home', b: 'power', v: 1, why: 'quiet', when: (ea, eb) => eb >= 3 },
    { a: 'home', b: 'power', v: -1, why: 'smoke', when: (ea, eb) => eb <= 1 },
    { a: 'home', b: 'power', v: -1, why: 'noise', when: (ea, eb) => eb === 2 },
    { a: 'home', b: 'make', v: -1, why: 'smoke', when: (ea, eb) => eb === 0 },
    { a: 'home', b: 'waste', v: -1, why: 'smell', when: (ea, eb) => eb === 0 },
    { a: 'power', b: 'make', v: 1, why: 'bolt' },
    { a: 'make', b: 'power', v: 1, why: 'bolt' },
    // v0.10: why towns used coal at all. Coal and gas make lots of power cheaply, so factories love them (until smoke dims the sun).
    { a: 'make', b: 'power', v: 1, why: 'cheap', when: (ea, eb) => eb <= 1 },
    { a: 'power', b: 'wild', v: 1, why: 'wind', when: (ea) => ea === 2 },
    { a: 'power', b: 'food', v: 1, why: 'wind', when: (ea) => ea === 2 },
    { a: 'food', b: 'water', v: 1, why: 'drop' },
    { a: 'water', b: 'food', v: 1, why: 'drop' },
    { a: 'food', b: 'waste', v: 1, why: 'compost', when: (ea, eb) => eb >= 2 },
    { a: 'waste', b: 'food', v: 1, why: 'scraps', when: (ea) => ea >= 2 },
    { a: 'food', b: 'waste', v: -1, why: 'flies', when: (ea, eb) => eb === 0 },
    { a: 'food', b: 'home', v: 1, why: 'market', when: (ea) => ea >= 1 },
    { a: 'water', b: 'wild', v: 1, why: 'drink' },
    { a: 'wild', b: 'water', v: 1, why: 'drink' },
    { a: 'move', b: 'make', v: 1, why: 'truck' },
    { a: 'make', b: 'move', v: 1, why: 'truck' },
    { a: 'make', b: 'waste', v: 1, why: 'recycle', when: (ea, eb) => eb >= 1 },
    { a: 'waste', b: 'make', v: 1, why: 'recycle', when: (ea) => ea >= 1 },
    { a: 'wild', b: 'wild', v: 1, why: 'forest' },
  ];
  // One short sentence per reason, said from the thinker's point of view (cards, read-aloud, parents).
  const REASONS = {
    park: 'A park next door to play in', apple: 'Fresh fruit right outside the window', bus: 'The bus stop is right outside',
    riders: 'Lots of riders live here', quiet: 'Quiet, clean power next door', smoke: 'Smoke makes people cough',
    noise: 'Turbines whoosh all night, too noisy to sleep', smell: 'The dump smells yucky', bolt: 'Factories need lots of electricity',
    wind: 'Open land, nothing blocks the wind', drop: 'Plants need water to grow', compost: 'Compost feeds the soil so food grows',
    scraps: 'Farm scraps turn into compost', flies: 'Flies from the dump bug the crops', market: 'Neighbours come to buy fresh food',
    drink: 'Animals come to drink', truck: 'Trucks bring parts to the workshop', recycle: 'Old stuff gets made into new stuff',
    forest: 'Animals need big, joined-up wild places', cheap: 'Coal and gas make lots of power, cheaply',
  };
  // Smog emitted per tile, by era (era 3 cleans the air). Sooty cars (move era 1) are worse than horses.
  // v0.10: a bucket-and-rope well makes no smoke, so water starts clean.
  const EMIT = {
    power: [3, 2, 0, -1], move: [1, 2, 0, -1], food: [2, 1, 0, -1], water: [0, 0, 0, -1],
    home: [2, 1, 0, -1], make: [3, 1, 0, -1], waste: [2, 1, 0, -1], wild: [-1, -1, -2, -3],
  };
  // Short lower-case names used in toasts (full cards live in src/techs.js).
  const ERA_NAMES = {
    power: ['coal plant', 'gas turbine', 'wind turbines', ['sun mirror tower', 'fusion reactor', 'crystal beacon']],
    move: ['horse stable', 'motor garage', 'charging hub', ['garden tram', 'maglev express', 'portal pavilion']],
    food: ['tractor farm', 'orchard', 'glasshouse', ['food forest', 'aeroponic stack', 'enchanted orchard']],
    water: ['deep well', 'water tower', 'rain garden', ['living wetland', 'kelp bioreactors', 'moonwell']],
    home: ['chimney cottage', 'terrace houses', 'living-roof flats', ['canopy village', 'arcology spire', 'starlight village']],
    make: ['smokestack mill', 'workshop', 'robot foundry', ['repair guild', 'nanofab spire', 'spellforge']],
    waste: ['landfill', 'recycling depot', 'compost yard', ['mycelium grid', 'matter reclaimer', 'transmutation garden']],
    wild: ['meadow', 'city park', 'old growth', ['wildflower expanse', 'biosphere dome', 'luminous grove']],
  };
  // These are extra sunbeams, never era-multiplied and never upgrade prerequisites.
  const FUTURE_BONUSES = {
    leaf: { targets: ['wild', 'food', 'water'], points: 1 },
    star: { targets: ['power', 'move', 'make', 'home'], points: 1 },
    magic: { targets: ['home', 'water', 'waste'], points: 1 },
  };
  const DISCOVERIES = [
    { id: 'rain-fed-growing', name: 'Rain-fed growing', needs: { water: 2, food: 2 }, pair: ['water', 'food'], points: 1 },
    { id: 'clean-travel', name: 'Clean travel', needs: { power: 2, move: 2 }, pair: ['power', 'move'], points: 1 },
    { id: 'circular-workshop', name: 'Circular workshop', needs: { waste: 1, make: 1 }, pair: ['waste', 'make'], points: 1 },
  ];
  for (const d of DISCOVERIES) {
    d.requires = Object.entries(d.needs);
    d.types = d.pair;
    d.bonusText = '+1 sun per new link between these two kinds, not multiplied by era';
  }
  function discoveries(s) {
    return DISCOVERIES.filter((d) => Object.entries(d.needs).every(([a, e]) => s.era[a] >= e));
  }
  // v0.12: va / vb are the future styles of the two buildings (a track can know several futures once it learns them).
  function linkBonuses(s, a, b, va, vb) {
    const reasons = [];
    for (const [source, target, sv] of [[a, b, va], [b, a, vb]]) {
      const v = sv || s.variant[source], rule = FUTURE_BONUSES[v];
      if (s.era[source] === 3 && rule && rule.targets.includes(target)) reasons.push({ kind: 'future', variant: v, source, target });
    }
    const future = reasons.length ? 1 : 0;
    const ds = discoveries(s).filter((d) => d.pair.includes(a) && d.pair.includes(b) && a !== b);
    for (const d of ds) reasons.push({ kind: 'discovery', id: d.id, name: d.name });
    const discovery = ds.length ? 1 : 0;
    return { future, discovery, points: future + discovery, reasons };
  }
  const MAX_ERA = 3;
  // v0.10 tech tree: a few upgrades need another track first. Each link teaches one real-world idea.
  // `era` is the step being unlocked; `needs` is {axis: era} that must already be reached.
  const NEEDS = [
    { axis: 'move', era: 2, needs: { power: 2 }, why: 'cleangrid' }, // Charging Hub needs Wind Turbines
    { axis: 'make', era: 2, needs: { power: 2 }, why: 'robotpower' }, // Robot Foundry needs Wind Turbines
    { axis: 'waste', era: 1, needs: { make: 1 }, why: 'recyclers' }, // Recycling Depot needs a Workshop
    { axis: 'waste', era: 2, needs: { food: 1 }, why: 'scrapsfirst' }, // Compost Yard needs an Orchard
    { axis: 'food', era: 2, needs: { water: 1 }, why: 'pipes' }, // Glasshouse needs a Water Tower
  ];
  // Every final future (step 3) also needs a smoke-free sky: Smoke Age -> Cleanup -> Future.
  const LOCK_REASONS = {
    cleangrid: 'Electric cars are only clean if the electricity is clean.',
    robotpower: 'Robot arms run on electricity, so the town needs clean power first.',
    recyclers: 'Recycled metal needs a workshop that can use it.',
    scrapsfirst: 'Compost is made from fruit and food scraps, so the town needs an orchard.',
    pipes: 'A glasshouse needs water piped in, so the town needs a water tower.',
    clearsky: 'The future starts when the sky is clear. Upgrade every smoky kind of building first.',
  };
  // Kinds whose current step still makes smoke (by step, so the goal is stable: "make every kind clean").
  function smokyKinds(s) { return AXES.filter((a) => EMIT[a][s.era[a]] > 0); }
  function skyClear(s) { return smokyKinds(s).length === 0; }
  // What still blocks the next step of `axis`: [{kind:'tech', axis, era, why} | {kind:'sky', why, left}]
  function locksFor(s, axis) {
    const next = s.era[axis] + 1, out = [];
    if (next > MAX_ERA) return out;
    for (const n of NEEDS) if (n.axis === axis && n.era === next) for (const [a, e] of Object.entries(n.needs)) if (s.era[a] < e) out.push({ kind: 'tech', axis: a, era: e, why: n.why });
    if (next === MAX_ERA && !skyClear(s)) out.push({ kind: 'sky', why: 'clearsky', left: smokyKinds(s) });
    return out;
  }
  // Every rule that unlocks step `era` of `axis` (for cards: "Needs Wind Turbines first").
  function needsOf(axis, era) {
    const out = [];
    for (const n of NEEDS) if (n.axis === axis && n.era === era) for (const [a, e] of Object.entries(n.needs)) out.push({ kind: 'tech', axis: a, era: e, why: n.why });
    if (era === MAX_ERA) out.push({ kind: 'sky', why: 'clearsky' });
    return out;
  }
  // What step `era` of `axis` helps unlock elsewhere (for cards: "Opens the way to the Charging Hub").
  function unlocksOf(axis, era) {
    const out = [];
    for (const n of NEEDS) if (n.needs[axis] === era) out.push({ axis: n.axis, era: n.era, why: n.why });
    return out;
  }
  // Critters: arrive on a nature tile with clean local air (sum of smog in radius 1 <= 0).
  const CRITTERS = [
    { id: 'bird', need: () => true },
    { id: 'bee', need: (s, t, n) => n.food >= 1 },
    { id: 'duck', need: (s, t, n) => n.water >= 1 },
    { id: 'butterfly', need: (s, t, n) => n.wild >= 2 && t.eraOf >= 1 },
    { id: 'fox', need: (s, t, n) => n.home >= 1 && t.eraOf >= 2 },
    { id: 'deer', need: (s, t, n) => t.group >= 4 && t.eraOf >= 2 },
  ];
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const key = (q, r) => q + ',' + r;
  const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

  // ---- RNG (mulberry32, state is a uint32 stored in the game state) ----
  function rnd(s) {
    let t = (s.rng = (s.rng + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Sun level thresholds (cumulative sunbeams needed to reach level L, L>=1).
  const TUNE = {
    sunBase: 6, sunGrow: 1.48, // need(L) = round(sunBase * L^sunGrow). v0.6: 8 -> 7 so frowns don't slow the kid curve. v0.10: 7 -> 6 because smog now dims sunbeams (docs/BALANCE-v0.10.0.md)
    growAt: { 3: 3, 8: 4, 14: 5 }, // sun level -> board radius
    startRadius: 2,
    districtAt: 3, districtBonus: 3, districtExtra: 1,
    critterAir: 1, critterFirst: 6,
    hoodAt: [5, 9], hoodOn: true,
    wishBonus: 5, maxWishes: 3, wishers: ['home', 'make', 'food'], critterAgain: 3,
    upgradePerTile: 2,
    challengeDeck: 80, challengeSwaps: 3,
    maxRadius: 10,
    // v0.10 smog: dim = how much a fully smoggy sky hides the sun; floor/perKind = haze while any kind is smoky.
    smogDim: 0.5, smogFloor: 0.2, smogPerKind: 0.03, smogScale: 6, smogPerTile: 0.9, natureCleans: 0.5,
    // v0.11 free play: town demand (like SimCity's demand meter). With every type always on offer, the town asks for a mix.
    // A kind at least `demandNeed` below the average count is 'need'; at least `demandPlenty` above it (and 3+ tiles) is 'plenty'.
    demandOn: true, demandNeed: 1, demandPlenty: 1.5, demandMult: { need: 1.5, ok: 1, plenty: 0.5 },
    // v0.12 Paragons: learning another future costs one idea; merging pays a burst; buildings placed touching a Paragon earn x2.
    paragonOn: true, learnCost: 1, paragonBurst: 25, paragonAura: 2,
  };
  function sunNeed(L) { return Math.round(TUNE.sunBase * Math.pow(L, TUNE.sunGrow)); }

  function newGame(opts = {}) {
    const mode = opts.mode || 'cozy';
    const seed = (opts.seed >>> 0) || 1;
    const s = {
      v: VERSION, mode, seed, rng: seed, turn: 0,
      radius: TUNE.startRadius,
      tiles: {}, // key -> {q,r,type,critter}
      era: Object.fromEntries(AXES.map((a) => [a, 0])),
      variant: Object.fromEntries(AXES.map((a) => [a, null])), // 'leaf' | 'star' | 'magic' at era 3 (the track's first future: it decides the crown)
      learned: {}, style: {}, paragons: {}, // v0.12: futures each track knows, the look new buildings use, and merged Paragons
      sun: 0, sunLevel: 0, ideas: 0, ideasSpent: 0,
      hand: [], deck: null, swaps: mode === 'challenge' ? TUNE.challengeSwaps : Infinity,
      species: {}, critterCount: 0,
      crowned: null, over: false,
      log: [],
    };
    if (mode === 'challenge') {
      // Fixed deck: equal-ish share of every type, shuffled with the seed.
      const deck = [];
      for (let i = 0; i < TUNE.challengeDeck; i++) deck.push(AXES[i % AXES.length]);
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      s.deck = deck;
    }
    // v0.11: free play offers every building type, every turn (a palette in tech-row order).
    // The daily Challenge keeps its fixed deck and 3-card hand.
    s.hand = mode === 'cozy' ? palette() : [draw(s), draw(s), draw(s)];
    return s;
  }

  function palette() { return AXES.slice(); }
  function counts(s) {
    const c = Object.fromEntries(AXES.map((a) => [a, 0]));
    for (const k in s.tiles) c[s.tiles[k].type]++;
    return c;
  }

  function draw(s) {
    if (s.deck) return s.deck.length ? s.deck.pop() : null;
    // Cozy: weighted so rarely-seen types come up more; never 3 of the same in hand.
    const c = counts(s);
    const inHand = {};
    for (const h of s.hand) if (h) inHand[h] = (inHand[h] || 0) + 1;
    const w = AXES.map((a) => (inHand[a] >= 2 ? 0 : 1 / (1 + c[a] * 0.35 + (inHand[a] || 0) * 1.5)));
    let tot = w.reduce((a, b) => a + b, 0), x = rnd(s) * tot;
    for (let i = 0; i < AXES.length; i++) { x -= w[i]; if (x <= 0) return AXES[i]; }
    return AXES[AXES.length - 1];
  }

  function inBoard(s, q, r) { return hexDist(q, r) <= s.radius; }
  function neighbors(q, r) { return DIRS.map(([dq, dr]) => [q + dq, r + dr]); }
  function emitOf(s, t) { return EMIT[t.type][s.era[t.type]]; }
  function localSmog(s, q, r) {
    let sum = 0;
    const t0 = s.tiles[key(q, r)];
    if (t0) sum += emitOf(s, t0);
    for (const [nq, nr] of neighbors(q, r)) { const t = s.tiles[key(nq, nr)]; if (t) sum += emitOf(s, t); }
    return sum;
  }
  // 0 = clear sky, 1 = thick smog.
  // v0.10: the sky and the goal agree. While any kind of building is still smoky, a haze floor remains
  // (the old smokestacks over the hill keep puffing), and nature can cancel at most half the smoke.
  // The sky only turns fully clear when the last smoky kind is upgraded.
  function smogLevel(s) {
    let dirty = 0, clean = 0, n = 0;
    for (const k in s.tiles) { const e = emitOf(s, s.tiles[k]); if (e > 0) dirty += e; else clean -= e; n++; }
    if (n === 0) return 0.55; // the starting valley is a little hazy from the old town over the hill
    const kinds = smokyKinds(s).length;
    if (!kinds) return 0;
    const net = dirty - Math.min(clean * TUNE.natureCleans, dirty * 0.5);
    const floor = TUNE.smogFloor + TUNE.smogPerKind * kinds;
    return Math.max(floor, Math.min(1, net / (TUNE.smogScale + TUNE.smogPerTile * n)));
  }
  // v0.11: what the town thinks of one more `type` ('need' | 'ok' | 'plenty'). Free play only; the Challenge's deck already mixes.
  function demand(s, type) {
    if (s.mode !== 'cozy' || !TUNE.demandOn) return 'ok';
    let n = 0, c = 0;
    for (const k in s.tiles) { n++; if (s.tiles[k].type === type) c++; }
    const avg = n / AXES.length;
    if (c <= avg - TUNE.demandNeed) return 'need';
    if (c >= 3 && c >= avg + TUNE.demandPlenty) return 'plenty';
    return 'ok';
  }
  // Smog dims the sun: placement sunbeams are multiplied by this (1 = clear sky).
  function sunFactor(s) { return 1 - TUNE.smogDim * smogLevel(s); }
  // Opinions `a` has about a neighbouring `b` in this town (eras matter). [{a, b, v, why}]
  function opinions(s, a, b) {
    const ea = s.era[a], eb = s.era[b], out = [];
    for (const R of RULES) if (R.a === a && R.b === b && (!R.when || R.when(ea, eb))) out.push(R);
    return out;
  }
  function likes(s, a, b) { return opinions(s, a, b).reduce((t, o) => t + o.v, 0); }
  // Net value of a link: hearts minus frowns, both directions. Symmetric.
  function hearts(s, a, b) { return likes(s, a, b) + likes(s, b, a); }
  // Types `a` currently likes (net > 0) / dislikes (net < 0).
  function likedTypes(s, a) { return AXES.filter((b) => likes(s, a, b) > 0); }
  function dislikedTypes(s, a) { return AXES.filter((b) => likes(s, a, b) < 0); }
  // Both directions of opinion between a tile of type `a` (placed or hypothetical) and neighbour `b`.
  function linkOps(s, a, b) {
    return [...opinions(s, a, b).map((o) => ({ by: 'self', v: o.v, why: o.why })), ...opinions(s, b, a).map((o) => ({ by: 'nb', v: o.v, why: o.why }))];
  }

  function legalHexes(s) {
    const out = [];
    const R = s.radius;
    for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (inBoard(s, q, r) && !s.tiles[key(q, r)]) out.push([q, r]);
    return out;
  }

  function groupOf(s, q, r, type, extra) {
    // Connected component of `type` containing (q,r); `extra` is a hypothetical tile key.
    const seen = new Set([key(q, r)]), st = [[q, r]];
    while (st.length) {
      const [cq, cr] = st.pop();
      for (const [nq, nr] of neighbors(cq, cr)) {
        const k = key(nq, nr);
        if (seen.has(k)) continue;
        const t = s.tiles[k];
        if ((t && t.type === type) || k === extra) { seen.add(k); st.push([nq, nr]); }
      }
    }
    return seen.size;
  }

  // Tiles of the connected `type` group through (q,r), counting (q,r) itself as `type`.
  function groupTiles(s, q, r, type) {
    const seen = new Set([key(q, r)]), st = [[q, r]], out = [[q, r]];
    while (st.length) {
      const [cq, cr] = st.pop();
      for (const [nq, nr] of neighbors(cq, cr)) { const k = key(nq, nr); if (seen.has(k)) continue; const t = s.tiles[k]; if (t && t.type === type) { seen.add(k); st.push([nq, nr]); out.push([nq, nr]); } }
    }
    return out;
  }
  // Neighbourhood: when a same-type group grows past 5 or 9 tiles it throws a party.
  // The party is bigger for every different friend type touching the group (served neighbourhoods).
  function hoodOf(s, q, r, type) {
    const tiles = groupTiles(s, q, r, type), g = tiles.length;
    // Compare with the largest OLD component. Bridging small groups can cross both
    // thresholds; joining an already celebrated group never repeats its party.
    let previous = 0;
    const without = Object.assign({}, s, { tiles: Object.assign({}, s.tiles) });
    delete without.tiles[key(q, r)];
    for (const [nq, nr] of neighbors(q, r)) {
      const t = without.tiles[key(nq, nr)];
      if (t && t.type === type) previous = Math.max(previous, groupOf(without, nq, nr, type));
    }
    const m = TUNE.hoodOn ? TUNE.hoodAt.filter((x) => previous < x && x <= g) : [];
    if (!m.length) return null;
    const inG = new Set(tiles.map(([a, b]) => key(a, b))), touch = new Set();
    for (const [a, b] of tiles) for (const [nq, nr] of neighbors(a, b)) { const k = key(nq, nr); if (inG.has(k)) continue; const t = s.tiles[k]; if (t && t.type !== type && likes(s, type, t.type) > 0) touch.add(t.type); }
    return { size: g, thresholds: m, friends: [...touch], points: m.length * g * (1 + touch.size) };
  }

  // What would placing `type` at (q,r) score? Pure.
  function preview(s, type, q, r, style) {
    if (!type || !inBoard(s, q, r) || s.tiles[key(q, r)]) return null;
    const mult = 1 + s.era[type];
    const mine = s.era[type] === MAX_ERA ? (style && known(s, type).includes(style) ? style : styleOf(s, type)) : null;
    const links = [];
    let plus = 0, minus = 0, bonus = 0, paragon = null;
    for (const [nq, nr] of neighbors(q, r)) {
      const t = s.tiles[key(nq, nr)];
      if (!t) continue;
      if (t.paragon && !paragon) paragon = t.paragon;
      const ops = linkOps(s, type, t.type);
      const linkBonus = linkBonuses(s, type, t.type, mine, tileStyle(s, t));
      if (!ops.length && !linkBonus.points) continue;
      const lp = ops.filter((o) => o.v > 0).length, lm = ops.filter((o) => o.v < 0).length;
      links.push({ q: nq, r: nr, hearts: lp, frowns: lm, ops, bonus: linkBonus.points, bonuses: linkBonus });
      bonus += linkBonus.points;
      plus += lp; minus += lm;
    }
    // Hearts minus frowns; a frown costs a heart but a placement never pays less than +1 (no punishment, pillar 2).
    const h = Math.max(0, plus - minus);
    const wishes = [];
    for (const [nq, nr] of neighbors(q, r)) { const t = s.tiles[key(nq, nr)]; if (t && t.wish === type) wishes.push({ q: nq, r: nr }); }
    const g = groupOf(s, q, r, type, null);
    let district = 0;
    if (g === TUNE.districtAt) district = TUNE.districtBonus;
    else if (g > TUNE.districtAt) district = TUNE.districtExtra;
    const wish = wishes.length * TUNE.wishBonus;
    const hood = hoodOf(s, q, r, type);
    // v0.12: a building placed touching a Paragon earns double.
    const aura = paragon ? TUNE.paragonAura : 1;
    const raw = (1 + h * mult + bonus + district + wish + (hood ? hood.points : 0)) * aura;
    // v0.11: town demand scales the whole placement (free play only).
    const dem = demand(s, type), base = Math.max(1, Math.round(raw * TUNE.demandMult[dem]));
    // v0.10: smog hides part of the sun. A placement still always earns at least one sunbeam.
    const points = Math.max(1, Math.round(base * sunFactor(s)));
    return { type, q, r, style: mine, paragon, aura, links, hearts: h, likes: plus, frowns: minus, mult, bonus, district, group: g, wishes, wish, hood, raw, demand: dem, base, dimmed: base - points, points };
  }

  function nbCounts(s, q, r) {
    const n = Object.fromEntries(AXES.map((a) => [a, 0]));
    for (const [nq, nr] of neighbors(q, r)) { const t = s.tiles[key(nq, nr)]; if (t) n[t.type]++; }
    return n;
  }

  // Check every nature tile without a critter; arrivals pay sunbeams. Returns events.
  function settleCritters(s) {
    const ev = [];
    const keys = Object.keys(s.tiles).sort();
    for (const k of keys) {
      const t = s.tiles[k];
      if (t.type !== 'wild' || t.critter) continue;
      if (localSmog(s, t.q, t.r) > TUNE.critterAir) continue;
      const n = nbCounts(s, t.q, t.r);
      const info = { eraOf: s.era.wild, group: groupOf(s, t.q, t.r, 'wild', null) };
      // Prefer a species the town has not met yet, then the rarest.
      const ok = CRITTERS.filter((c) => c.need(s, info, n));
      if (!ok.length) continue;
      ok.sort((a, b) => (s.species[a.id] || 0) - (s.species[b.id] || 0) || CRITTERS.indexOf(b) - CRITTERS.indexOf(a));
      const c = ok[0];
      const first = !s.species[c.id];
      s.species[c.id] = (s.species[c.id] || 0) + 1;
      s.critterCount++;
      t.critter = c.id;
      const pts = first ? TUNE.critterFirst : TUNE.critterAgain;
      ev.push({ type: 'critter', q: t.q, r: t.r, critter: c.id, first, points: pts });
      ev.push(...addSun(s, pts, t.q, t.r));
    }
    return ev;
  }

  function addSun(s, pts, q, r) {
    const ev = [];
    s.sun += pts;
    while (s.sun >= sunNeed(s.sunLevel + 1)) {
      s.sunLevel++;
      s.ideas++;
      ev.push({ type: 'level', level: s.sunLevel });
      const grow = TUNE.growAt[s.sunLevel];
      if (grow && grow > s.radius) { s.radius = grow; ev.push({ type: 'grow', radius: grow }); }
    }
    return ev;
  }

  function boardFull(s) { return legalHexes(s).length === 0; }

  function rememberUndo(s) {
    const copy = Object.assign({}, s);
    delete copy._undo;
    s._undo = JSON.stringify(copy);
  }
  function canUndo(s) { return !!s._undo; }
  function undo(s) {
    if (!canUndo(s)) return null;
    return deserialize(JSON.stringify({ schema: 2, state: JSON.parse(s._undo) }));
  }
  function waitingForIdeas(s) {
    return s.mode === 'challenge' && !s.over &&
      (s.hand.every((h) => !h) || boardFull(s)) && AXES.some((a) => canUpgrade(s, a));
  }

  function place(s, handIdx, q, r, style) {
    if (s.over) return null;
    const type = s.hand[handIdx];
    const p = preview(s, type, q, r, style);
    if (!p) return null;
    rememberUndo(s);
    s.turn++;
    for (const w of p.wishes) s.tiles[key(w.q, w.r)].wish = null;
    s.wishesMet = (s.wishesMet || 0) + p.wishes.length;
    // A newly placed home/workshop/farm wishes for one friend it does not have next door yet.
    let wish = null;
    if (TUNE.wishers.includes(type)) {
      const nb = nbCounts(s, q, r);
      const want = likedTypes(s, type).filter((f) => !nb[f]);
      if (want.length) wish = want[Math.floor(rnd(s) * want.length)];
    }
    s.tiles[key(q, r)] = { q, r, type, critter: null, born: s.turn, wish };
    if (p.style) s.tiles[key(q, r)].v = p.style; // v0.12: each future-era building keeps the look it was built with
    // Keep the board calm: only the newest few wishes stay; older ones quietly drift away (no penalty).
    if (wish) { const w = Object.values(s.tiles).filter((x) => x.wish).sort((a, b) => a.born - b.born); while (w.length > TUNE.maxWishes) w.shift().wish = null; }
    const ev = [{ type: 'place', tile: type, q, r, style: p.style, paragon: p.paragon, aura: p.aura, points: p.points, raw: p.raw, dimmed: p.dimmed, demand: p.demand, links: p.links, bonus: p.bonus, district: p.district, group: p.group, hood: p.hood, wishes: p.wishes, wish: p.wish, newWish: wish }];
    ev.push(...addSun(s, p.points, q, r));
    ev.push(...settleCritters(s));
    if (s.mode !== 'cozy') s.hand[handIdx] = draw(s); // free play keeps its full palette
    s.log.push(p.style && p.style !== s.variant[type] ? ['p', handIdx, q, r, p.style] : ['p', handIdx, q, r]);
    ev.push(...endCheck(s));
    return ev;
  }

  // Every opinion on links that touch a tile of `axis`: key 'q,r>q2,r2:why' -> v (thinker at q,r).
  function pairOps(s, axis) {
    const m = new Map();
    for (const k in s.tiles) {
      const t = s.tiles[k]; if (t.type !== axis) continue;
      for (const [nq, nr] of neighbors(t.q, t.r)) {
        const n = s.tiles[key(nq, nr)]; if (!n) continue;
        for (const o of opinions(s, t.type, n.type)) m.set(key(t.q, t.r) + '>' + key(nq, nr) + ':' + o.why, o.v);
        for (const o of opinions(s, n.type, t.type)) m.set(key(nq, nr) + '>' + key(t.q, t.r) + ':' + o.why, o.v);
      }
    }
    return m;
  }
  // What an upgrade changed between neighbours: new likes, new dislikes, dislikes that went away.
  function diffOps(a, b) {
    const out = [];
    const parse = (k) => { const [ab, why] = k.split(':'); const [p, o] = ab.split('>'); const [q, r] = p.split(',').map(Number), [oq, or] = o.split(',').map(Number); return { q, r, oq, or, why }; };
    for (const [k, v] of b) if (!a.has(k)) out.push(Object.assign(parse(k), { kind: v > 0 ? 'like' : 'frown' }));
    for (const [k, v] of a) if (!b.has(k) && v < 0) out.push(Object.assign(parse(k), { kind: 'unfrown' }));
    return out;
  }

  function canUpgrade(s, axis) { return s.ideas > 0 && s.era[axis] < MAX_ERA && !s.over && !locksFor(s, axis).length; }

  function upgrade(s, axis, variant) {
    if (!canUpgrade(s, axis)) return null;
    const next = s.era[axis] + 1;
    if (next === MAX_ERA && !['leaf', 'star', 'magic'].includes(variant)) return null;
    rememberUndo(s);
    const priorDiscoveries = new Set(discoveries(s).map((d) => d.id));
    const wasClear = skyClear(s);
    const lockedBefore = Object.fromEntries(AXES.map((a) => [a, locksFor(s, a).length > 0]));
    s.ideas--; s.ideasSpent++;
    const before = pairOps(s, axis);
    s.era[axis] = next;
    if (next === MAX_ERA) { s.variant[axis] = variant; learnedOf(s)[axis] = [variant]; styleMap(s)[axis] = variant; }
    const changed = diffOps(before, pairOps(s, axis));
    let n = 0;
    for (const k in s.tiles) if (s.tiles[k].type === axis) n++;
    const pts = n * TUNE.upgradePerTile;
    const ev = [{ type: 'upgrade', axis, era: next, variant: s.variant[axis], points: pts, tiles: n, changed }];
    if (!wasClear && skyClear(s)) ev.push({ type: 'skyclear' });
    // Steps this upgrade just opened up elsewhere (the tree), so the UI can celebrate them.
    const opened = AXES.filter((a) => a !== axis && s.era[a] < MAX_ERA && lockedBefore[a] && !locksFor(s, a).length);
    if (opened.length) ev.push({ type: 'unlock', axes: opened, by: axis });
    for (const d of discoveries(s)) if (!priorDiscoveries.has(d.id)) ev.push({ type: 'discovery', discovery: d.id, name: d.name, pair: d.pair, points: d.points });
    ev.push(...addSun(s, pts));
    ev.push(...settleCritters(s));
    s.log.push(['u', axis, variant || null]);
    ev.push(...endCheck(s));
    return ev;
  }

  // ---- v0.12 Paragons ----
  // A track that has reached its future can learn the other two futures (one idea each). New buildings of that kind
  // can then be built in any known look. A Nature, a Future and a Magic building of the same kind that all touch each
  // other (a little triangle of hexes) can merge into that track's one Paragon: a landmark that keeps all three hexes.
  const FUTURES = ['leaf', 'star', 'magic'];
  function learnedOf(s) { return s.learned || (s.learned = {}); }
  function styleMap(s) { return s.style || (s.style = {}); }
  function paragonMap(s) { return s.paragons || (s.paragons = {}); }
  function known(s, axis) {
    if (s.era[axis] !== MAX_ERA) return [];
    const l = (s.learned && s.learned[axis]) || [];
    const out = s.variant[axis] ? [s.variant[axis]] : [];
    for (const v of l) if (!out.includes(v)) out.push(v);
    return FUTURES.filter((v) => out.includes(v));
  }
  function styleOf(s, axis) { const v = s.style && s.style[axis]; return v && known(s, axis).includes(v) ? v : s.variant[axis]; }
  function tileStyle(s, t) { return s.era[t.type] === MAX_ERA ? (t.v || s.variant[t.type]) : null; }
  function canLearn(s, axis, variant) {
    if (!TUNE.paragonOn || s.over || s.ideas < TUNE.learnCost || s.era[axis] !== MAX_ERA) return false;
    const k = known(s, axis);
    return variant ? FUTURES.includes(variant) && !k.includes(variant) : k.length < FUTURES.length;
  }
  function learn(s, axis, variant) {
    if (!canLearn(s, axis, variant) || !variant) return null;
    rememberUndo(s);
    s.ideas -= TUNE.learnCost; s.ideasSpent += TUNE.learnCost;
    const l = learnedOf(s); l[axis] = known(s, axis).concat(variant);
    styleMap(s)[axis] = variant; // the next buildings of this kind use the new look
    s.log.push(['l', axis, variant]);
    const ev = [{ type: 'learn', axis, variant, known: known(s, axis), all: known(s, axis).length === FUTURES.length }];
    ev.push(...endCheck(s));
    return ev;
  }
  // Pick which known look new buildings of `axis` use (a view choice: placements log their own look).
  function setStyle(s, axis, variant) { if (!known(s, axis).includes(variant)) return false; styleMap(s)[axis] = variant; return true; }
  function cycleStyle(s, axis) { const k = known(s, axis); if (k.length < 2) return null; const i = k.indexOf(styleOf(s, axis)); styleMap(s)[axis] = k[(i + 1) % k.length]; return styleMap(s)[axis]; }
  // Every ready merge for `axis`: triangles of three touching buildings, one of each future. [[k1,k2,k3], ...] sorted keys.
  function paragonSpots(s, axis) {
    if (!TUNE.paragonOn || s.era[axis] !== MAX_ERA || (s.paragons && s.paragons[axis])) return [];
    const out = [], seen = new Set();
    for (const k in s.tiles) {
      const t = s.tiles[k]; if (t.type !== axis || t.paragon) continue;
      for (let i = 0; i < 6; i++) {
        const [d1q, d1r] = DIRS[i], [d2q, d2r] = DIRS[(i + 1) % 6];
        const a = s.tiles[key(t.q + d1q, t.r + d1r)], b = s.tiles[key(t.q + d2q, t.r + d2r)];
        if (!a || !b || a.type !== axis || b.type !== axis || a.paragon || b.paragon) continue;
        const looks = new Set([tileStyle(s, t), tileStyle(s, a), tileStyle(s, b)]);
        if (looks.size !== 3) continue;
        const tri = [k, key(a.q, a.r), key(b.q, b.r)].sort(), id = tri.join('|');
        if (!seen.has(id)) { seen.add(id); out.push(tri); }
      }
    }
    return out;
  }
  function allParagonSpots(s) { const out = []; for (const a of AXES) for (const tri of paragonSpots(s, a)) out.push({ axis: a, tiles: tri }); return out; }
  function merge(s, axis, tiles) {
    if (s.over || !tiles || tiles.length !== 3) return null;
    const want = tiles.slice().sort().join('|');
    const tri = paragonSpots(s, axis).find((t) => t.join('|') === want);
    if (!tri) return null;
    rememberUndo(s);
    s.turn++;
    const ts = tri.map((k) => s.tiles[k]);
    for (const t of ts) { t.paragon = axis; t.wish = null; }
    paragonMap(s)[axis] = { tiles: tri, born: s.turn };
    s.log.push(['m', axis, ...tri]);
    const pts = TUNE.paragonBurst;
    const ev = [{ type: 'paragon', axis, tiles: tri, points: pts }];
    ev.push(...addSun(s, pts, ts[0].q, ts[0].r));
    ev.push(...settleCritters(s));
    ev.push(...endCheck(s));
    return ev;
  }
  function paragonCount(s) { return Object.keys(s.paragons || {}).length; }

  function swap(s) {
    if (s.over || s.swaps <= 0 || s.mode === 'cozy') return null; // nothing to swap when every type is on offer
    if (s.deck && s.deck.length === 0) return null;
    rememberUndo(s);
    s.swaps--;
    const old = s.hand.slice();
    // Put the old hand back (challenge: under the deck) and draw fresh.
    if (s.deck) { for (const h of old) if (h) s.deck.unshift(h); }
    s.hand = [null, null, null];
    for (let i = 0; i < 3; i++) s.hand[i] = draw(s);
    s.log.push(['s']);
    return [{ type: 'swap' }];
  }

  function crownOf(s) {
    const counts = { leaf: 0, star: 0, magic: 0 };
    for (const a of AXES) if (counts[s.variant[a]] !== undefined) counts[s.variant[a]]++;
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    // Preserve the original two-path shared ending; three paths need two of each.
    if (ranked[1][1] >= 3 || ranked[2][1] >= 2) return 'mixed';
    return ranked[0][0];
  }
  function continueTown(s) {
    if (s.mode !== 'cozy' || !s.crowned || !s.over) return null;
    rememberUndo(s);
    s.over = false;
    s.log.push(['c']);
    return [{ type: 'continue' }, ...endCheck(s)];
  }
  function allCrowned(s) { return AXES.every((a) => s.era[a] === MAX_ERA); }

  function endCheck(s) {
    const ev = [];
    if (!s.crowned && allCrowned(s)) {
      s.crowned = crownOf(s);
      ev.push({ type: 'crown', crown: s.crowned });
      if (s.mode === 'cozy') s.over = true;
    }
    // Cozy never dead-ends: if the land is full, it grows.
    if (s.mode === 'cozy' && !s.over && boardFull(s) && s.radius < TUNE.maxRadius) {
      s.radius++; ev.push({ type: 'grow', radius: s.radius });
    }
    if (s.mode === 'challenge' && !s.over) {
      const noTiles = s.hand.every((h) => !h);
      if ((noTiles || boardFull(s)) && !AXES.some((a) => canUpgrade(s, a))) { s.over = true; ev.push({ type: 'end', score: finalScore(s) }); }
    }
    return ev;
  }

  // Challenge score: sunbeams + 25 per crown-era axis + 10 per species met + 40 if crowned.
  function finalScore(s) {
    let crowns = 0; for (const a of AXES) if (s.era[a] === MAX_ERA) crowns++;
    return s.sun + crowns * 25 + Object.keys(s.species).length * 10 + (s.crowned ? 40 : 0);
  }

  // Replay a log on a fresh state (used by tests + saves).
  function replay(opts, log) {
    const s = newGame(opts);
    for (const a of log) {
      // v0.6 UI cleared `over` without logging it. Recover subsequent actions.
      if (a[0] !== 'c' && s.over && s.mode === 'cozy' && s.crowned) continueTown(s);
      if (a[0] === 'p') place(s, a[1], a[2], a[3], a[4]);
      else if (a[0] === 'u') upgrade(s, a[1], a[2]);
      else if (a[0] === 's') swap(s);
      else if (a[0] === 'l') learn(s, a[1], a[2]);
      else if (a[0] === 'm') merge(s, a[1], a.slice(2));
      else if (a[0] === 'c') continueTown(s);
    }
    return s;
  }
  // Snapshot avoids changed rules reinterpreting an existing town's score/RNG.
  // JSON maps cozy's Infinity swaps to null; restore that sentinel explicitly.
  function serialize(s) { return JSON.stringify({ schema: 2, state: s }); }
  function deserialize(str) {
    const o = JSON.parse(str);
    if (o.schema === 2) {
      const s = o.state;
      if (!s || !Array.isArray(s.log) || !Array.isArray(s.hand) || !s.tiles || !s.era || !s.variant || !['cozy', 'challenge'].includes(s.mode)) throw new Error('Invalid town save');
      if (s.mode === 'cozy' && s.swaps === null) s.swaps = Infinity;
      if (s.mode === 'cozy') s.hand = palette(); // v0.11: older 3-card free-play towns continue with the full palette
      s.v = VERSION;
      return s;
    }
    if (!Array.isArray(o.log)) throw new Error('Invalid town save');
    return replay({ mode: o.mode, seed: o.seed }, o.log);
  }

  const BF = {
    FUTURES, known, styleOf, tileStyle, canLearn, learn, setStyle, cycleStyle, paragonSpots, allParagonSpots, merge, paragonCount,
    palette, demand, NEEDS, LOCK_REASONS, smokyKinds, skyClear, locksFor, needsOf, unlocksOf, sunFactor,
    VERSION, canUndo, undo, waitingForIdeas, FUTURE_BONUSES, DISCOVERIES, discoveries, linkBonuses, continueTown, AXES, RULES, REASONS, EMIT, ERA_NAMES, MAX_ERA, CRITTERS, DIRS, TUNE,
    key, hexDist, newGame, preview, place, upgrade, canUpgrade, swap, legalHexes, smogLevel, localSmog,
    sunNeed, counts, hearts, likes, opinions, linkOps, likedTypes, dislikedTypes, crownOf, finalScore, replay, serialize, deserialize, groupOf, groupTiles, hoodOf, boardFull, nbCounts, neighbors,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = BF;
  else root.BF = BF;
})(typeof window !== 'undefined' ? window : globalThis);
