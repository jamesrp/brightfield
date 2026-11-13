#!/usr/bin/env node
// Sparse emissive overlays, not solid slabs: validate the glow contract independently.
// node tools/art/check-glows.cjs [--json] [--manifest manifest.js] [--tiles-dir dir]
// node tools/art/check-glows.cjs [--json] file.png ...  (pixels only, no manifest metadata)
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const S = require('./spec.cjs');
const ROOT = path.resolve(__dirname, '../..');
const REQUIRED_KEYS = Object.freeze([
  ...['star', 'magic'].flatMap(stage => S.AXES.map(axis => `${axis}:${stage}`)),
  ...['0', '1', '2', 'leaf'].map(stage => `home:${stage}`),
]);
const ALPHA_THRESHOLD = 16, EDGE_TOLERANCE = 1;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const round = value => Math.round(value * 10000) / 10000;

function loadManifest(file = path.join(ROOT, 'assets/tiles/manifest.js')) {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file, timeout: 1000 });
  return context.window.BF_TILE_ART;
}

async function checkGlow(file, options = {}) {
  const fails = [], notes = [], result = { file, fails, notes, metrics: null };
  if (Object.hasOwn(options, 'period') && !(Number.isFinite(options.period) && options.period > 0)) {
    fails.push('glowPeriod must be a finite positive number of seconds');
  }
  if (typeof file !== 'string' || !file.trim()) {
    fails.push('glow file must be a nonempty path'); return result;
  }
  let img;
  try {
    const stat = await fs.promises.stat(file);
    if (!stat.isFile()) { fails.push(`glow path is not a file: ${file}`); return result; }
    img = await loadImage(file);
  } catch (error) {
    fails.push(error.code === 'ENOENT' ? `missing glow file: ${file}` : `cannot read glow PNG ${file}: ${error.message}`);
    return result;
  }
  const { w, h, cx, halfW, headroom } = S.SPEC;
  if (img.width !== w || img.height !== h) {
    fails.push(`size ${img.width}x${img.height}, want ${w}x${h}`); return result;
  }
  const cv = createCanvas(w, h), g = cv.getContext('2d');
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h).data;
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    if (data[(y * w + x) * 4 + 3] !== 0) fails.push(`corner ${x},${y} must be fully transparent`);
  }
  const bounds = { minX: w, minY: h, maxX: -1, maxY: -1 };
  const visibleBounds = { ...bounds };
  const expand = (box, x, y) => {
    box.minX = Math.min(box.minX, x); box.minY = Math.min(box.minY, y);
    box.maxX = Math.max(box.maxX, x); box.maxY = Math.max(box.maxY, y);
  };
  let nontransparentPixels = 0, alphaGt16Pixels = 0, emissionPixels = 0, alphaSum = 0, maxAlpha = 0;
  let additiveRgbSum = 0, maxAdditiveChannel = 0, outsidePixels = 0;
  let outsideColumns = 0, aboveHeadroom = 0, belowFrontEdge = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, alpha = data[i + 3];
    if (!alpha) continue;
    nontransparentPixels++; alphaSum += alpha; maxAlpha = Math.max(maxAlpha, alpha); expand(bounds, x, y);
    const channel = Math.max(data[i], data[i + 1], data[i + 2]) * alpha / 255;
    if (channel > 0) emissionPixels++;
    additiveRgbSum += (data[i] + data[i + 1] + data[i + 2]) * alpha / 255;
    maxAdditiveChannel = Math.max(maxAdditiveChannel, channel);
    if (alpha <= ALPHA_THRESHOLD) continue;
    alphaGt16Pixels++; expand(visibleBounds, x, y);
    // Pixel centres and 1 px tolerance are used consistently on all four limits.
    const X = x + .5, Y = y + .5;
    const columns = X < cx - halfW - EDGE_TOLERANCE || X > cx + halfW + EDGE_TOLERANCE;
    const head = Y < headroom - EDGE_TOLERANCE;
    // Light may illuminate the plot, but never its kerb or the neighbouring lane.
    const front = Y > S.frontEdgeY(X) + EDGE_TOLERANCE;
    if (columns) outsideColumns++;
    if (head) aboveHeadroom++;
    if (front) belowFrontEdge++;
    if (columns || head || front) outsidePixels++;
  }
  if (!emissionPixels) fails.push('empty emission: no nontransparent pixel contributes RGB light');
  if (outsideColumns) fails.push(`${outsideColumns} pixels with alpha > ${ALPHA_THRESHOLD} outside x=32..992 columns (1 px tolerance)`);
  if (aboveHeadroom) fails.push(`${aboveHeadroom} pixels with alpha > ${ALPHA_THRESHOLD} above y=24 headroom (1 px tolerance)`);
  if (belowFrontEdge) fails.push(`${belowFrontEdge} pixels with alpha > ${ALPHA_THRESHOLD} below the front plot edge (1 px tolerance)`);
  result.metrics = {
    width: w, height: h, nontransparentPixels, alphaGt16Pixels, emissionPixels,
    bounds: nontransparentPixels ? bounds : null, alphaGt16Bounds: alphaGt16Pixels ? visibleBounds : null,
    maxAlpha, meanAlpha: round(nontransparentPixels ? alphaSum / nontransparentPixels : 0), alphaSum,
    coverage: round(nontransparentPixels / (w * h)),
    // Additive channels are premultiplied by alpha, in 0..255 channel units.
    maxAdditiveChannel: round(maxAdditiveChannel), additiveRgbSum: round(additiveRgbSum),
    meanAdditiveChannel: round(emissionPixels ? additiveRgbSum / (3 * emissionPixels) : 0),
    outsidePixels, outsideColumns, aboveHeadroom, belowFrontEdge,
  };
  notes.push(`${emissionPixels} emitting px; alpha max ${maxAlpha}, mean ${result.metrics.meanAlpha}; additive channel max ${result.metrics.maxAdditiveChannel}`);
  notes.push(`bounds ${nontransparentPixels ? `${bounds.minX},${bounds.minY}..${bounds.maxX},${bounds.maxY}` : 'empty'}; ${outsidePixels} out-of-bounds px`);
  return result;
}

async function checkGlows(options = {}) {
  const rootDir = options.rootDir || ROOT, tilesDir = options.tilesDir || path.join(rootDir, 'assets/tiles');
  const requiredKeys = options.requiredKeys || REQUIRED_KEYS, fails = [], entries = [];
  const result = { ok: false, fails, entries, count: 0, requiredCount: requiredKeys.length };
  let manifest = options.manifest;
  if (manifest === undefined) {
    try { manifest = loadManifest(options.manifestFile || path.join(tilesDir, 'manifest.js')); }
    catch (error) { fails.push(`cannot read manifest: ${error.message}`); return result; }
  }
  if (!record(manifest) || !record(manifest.tiles)) {
    fails.push('manifest must contain a tiles object'); return result;
  }
  for (const key of requiredKeys) {
    if (!Object.hasOwn(manifest.tiles, key)) fails.push(`${key}: required glow tile is missing`);
    else if (record(manifest.tiles[key]) && !Object.hasOwn(manifest.tiles[key], 'glow')) fails.push(`${key}: required glow path is missing`);
  }
  for (const [key, tile] of Object.entries(manifest.tiles)) {
    if (!record(tile)) { fails.push(`${key}: tile entry must be an object`); continue; }
    if (!Object.hasOwn(tile, 'glow')) continue;
    const [axis, stage, extra] = key.split(':');
    if (!S.AXES.includes(axis) || !S.STAGES.includes(stage) || extra !== undefined) fails.push(`${key}: invalid type:stage glow key`);
    if (typeof tile.glow !== 'string' || !tile.glow.trim()) { fails.push(`${key}: glow must be a nonempty relative PNG path`); continue; }
    if (path.isAbsolute(tile.glow) || tile.glow.split(/[\\/]/).includes('..') || path.extname(tile.glow).toLowerCase() !== '.png') {
      fails.push(`${key}: glow must be a relative PNG path inside the tiles directory`); continue;
    }
    const checked = await checkGlow(path.join(tilesDir, tile.glow), { period: tile.glowPeriod });
    entries.push({ key, src: tile.glow, period: tile.glowPeriod, ...checked });
    fails.push(...checked.fails.map(message => `${key}: ${message}`));
  }
  result.count = entries.length; result.ok = fails.length === 0;
  return result;
}

async function main(args = process.argv.slice(2)) {
  const files = [], options = {}; let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--help') {
      console.log('Usage: check-glows.cjs [--json] [--manifest file.js] [--tiles-dir dir] [file.png ...]');
      return 0;
    } else if (['--manifest', '--tiles-dir'].includes(args[i])) {
      const flag = args[i], value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${flag} requires a path`);
      options[flag === '--manifest' ? 'manifestFile' : 'tilesDir'] = path.resolve(value);
    } else if (args[i].startsWith('--')) throw new Error(`unknown option: ${args[i]}`);
    else files.push(args[i]);
  }
  if (files.length && (options.manifestFile || options.tilesDir)) throw new Error('choose manifest mode or individual PNG files, not both');
  let report;
  if (files.length) {
    const entries = [];
    for (const file of files) entries.push(await checkGlow(path.resolve(file)));
    const fails = entries.flatMap(entry => entry.fails.map(failure => `${entry.file}: ${failure}`));
    report = { ok: !fails.length, fails, entries, count: entries.length };
  } else report = await checkGlows(options);
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    for (const entry of report.entries) console.log(`${entry.fails.length ? 'FAIL' : 'PASS'} ${entry.key || entry.file}\n  ${[...entry.fails, ...entry.notes].join('\n  ')}`);
    for (const failure of report.fails) console.log(`FAIL ${failure}`);
    console.log(report.ok ? `all glow checks pass (${report.count} layers)` : `${report.fails.length} glow problem(s)`);
  }
  return report.ok ? 0 : 1;
}
module.exports = { checkGlow, checkGlows, loadManifest, REQUIRED_KEYS, ALPHA_THRESHOLD, EDGE_TOLERANCE, main };
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(`glow check failed: ${error.message}`); process.exitCode = 1;
});
