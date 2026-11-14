'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createCanvas } = require('@napi-rs/canvas');
const { make } = require('./ui-harness.cjs');
const { checkGlow, checkGlows, loadManifest, REQUIRED_KEYS } = require('../tools/art/check-glows.cjs');
const { drawTile } = require('../docs/round-2-glows/render-review.cjs');
const S = require('../tools/art/spec.cjs');
const ROOT = path.resolve(__dirname, '..'), TILES = path.join(ROOT, 'assets/tiles');

function fixture(t, paint = g => { g.fillStyle = 'rgba(80,180,240,0.4)'; g.fillRect(400,500,40,30); }, w = 1024, h = 1536) {
  const out = path.join(ROOT, 'tools/art/out'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(out, 'glow-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const cv = createCanvas(w, h), g = cv.getContext('2d'); paint(g);
  const file = path.join(dir, 'glow.png'); fs.writeFileSync(file, cv.toBuffer('image/png'));
  return { file, dir, cv, g };
}
const paintPixel = (g, x, y, alpha = 255) => {
  const data = g.createImageData(1, 1); data.data.set([90, 160, 220, alpha]); g.putImageData(data, x, y);
};

test('glow checker accepts sparse emission and reports alpha, bounds and additive intensity', async t => {
  const f = fixture(t), result = await checkGlow(f.file, { period: 6 });
  assert.deepEqual(result.fails, []);
  assert.equal(result.metrics.emissionPixels, 1200);
  assert.equal(result.metrics.nontransparentPixels, 1200);
  assert.deepEqual(result.metrics.bounds, { minX:400, minY:500, maxX:439, maxY:529 });
  assert.equal(result.metrics.maxAlpha, 102);
  assert.ok(Math.abs(result.metrics.maxAdditiveChannel - 96) < 1);
  assert.ok(result.metrics.additiveRgbSum > 0);
  assert.equal(result.metrics.outsidePixels, 0);
});

test('glow checker rejects empty or black emission, wrong dimensions, and nontransparent corners', async t => {
  for (const [name, paint] of [['transparent', () => {}], ['black', g => { g.fillStyle='#000'; g.fillRect(300,300,12,12); }]]) {
    assert.match((await checkGlow(fixture(t, paint).file)).fails.join('\n'), /empty emission/, name);
  }
  assert.match((await checkGlow(fixture(t, () => {}, 100, 100).file)).fails.join('\n'), /size 100x100, want 1024x1536/);
  const f = fixture(t, g => { for (const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]]) paintPixel(g,x,y,1); });
  assert.equal((await checkGlow(f.file)).fails.filter(x => /corner/.test(x)).length, 4);
});

test('glow checker applies alpha > 16 and one-pixel tolerance to columns, headroom and front edge', async t => {
  const allowed = fixture(t, g => {
    paintPixel(g,31,100); paintPixel(g,992,100); paintPixel(g,512,23);
    const edge = S.frontEdgeY(512.5); paintPixel(g,512,Math.floor(edge + .5));
    paintPixel(g,5,100,16); paintPixel(g,400,10,16); paintPixel(g,400,1510,16);
  });
  assert.deepEqual((await checkGlow(allowed.file)).fails, []);
  const forbidden = fixture(t, g => {
    paintPixel(g,30,100,17); paintPixel(g,993,100,17); paintPixel(g,512,22,17);
    paintPixel(g,512,Math.floor(S.frontEdgeY(512.5)+.5)+1,17);
    paintPixel(g,80,Math.floor(S.frontEdgeY(80.5))+8,17); // kerb, not neighbouring canvas only
  });
  const result = await checkGlow(forbidden.file);
  assert.equal(result.metrics.outsideColumns,2); assert.equal(result.metrics.aboveHeadroom,1);
  assert.equal(result.metrics.belowFrontEdge,2); assert.equal(result.metrics.outsidePixels,5);
  assert.match(result.fails.join('\n'), /front plot edge/);
});

test('glow checker returns useful file and malformed-manifest failures without throwing', async t => {
  const f = fixture(t), broken = path.join(f.dir, 'broken.png'); fs.writeFileSync(broken, 'not a png');
  assert.match((await checkGlow(path.join(f.dir,'missing.png'))).fails.join('\n'), /missing glow file/);
  assert.match((await checkGlow(broken)).fails.join('\n'), /cannot read glow PNG/);
  assert.match((await checkGlow(f.dir)).fails.join('\n'), /not a file/);
  for (const manifest of [null, {}, {tiles:[]}, {tiles:null}]) {
    assert.match((await checkGlows({manifest})).fails.join('\n'), /tiles object/);
  }
  const report = await checkGlows({tilesDir:f.dir,requiredKeys:[],manifest:{tiles:{
    'home:0':null, 'home:1':{glow:9}, 'home:2':{glow:'missing.png',glowPeriod:4},
    'home:leaf':{glow:'../escape.png',glowPeriod:4}, 'home:magic':{glow:'glow.png',glowPeriod:0},
    'home:star:extra':{glow:'glow.png',glowPeriod:4},
  }}});
  for (const text of ['tile entry must be an object','nonempty relative PNG','missing glow file','inside the tiles directory','finite positive','invalid type:stage']) {
    assert.ok(report.fails.some(failure=>failure.includes(text)), text);
  }
  const invalidFile = path.join(f.dir,'manifest.js'); fs.writeFileSync(invalidFile,'window.BF_TILE_ART = {');
  assert.match((await checkGlows({manifestFile:invalidFile})).fails.join('\n'), /cannot read manifest/);
});

test('glow periods must be explicit finite positive numeric seconds', async t => {
  const f = fixture(t);
  for (const period of [undefined,null,0,-1,NaN,Infinity,-Infinity,'6']) {
    const report = await checkGlows({tilesDir:f.dir,requiredKeys:[],manifest:{tiles:{'home:0':{glow:'glow.png',glowPeriod:period}}}});
    assert.match(report.fails.join('\n'), /glowPeriod must be a finite positive/, String(period));
  }
  assert.equal((await checkGlows({tilesDir:f.dir,requiredKeys:[],manifest:{tiles:{'home:0':{glow:'glow.png',glowPeriod:.1}}}})).ok,true);
});

test('glow checker CLI exits successfully or unsuccessfully with useful JSON and text', t => {
  const f=fixture(t), script=path.join(ROOT,'tools/art/check-glows.cjs');
  const good=spawnSync(process.execPath,[script,'--json',f.file],{encoding:'utf8'});
  assert.equal(good.status,0,good.stderr); assert.equal(JSON.parse(good.stdout).ok,true);
  const bad=spawnSync(process.execPath,[script,path.join(f.dir,'missing.png')],{encoding:'utf8'});
  assert.equal(bad.status,1); assert.match(bad.stdout,/missing glow file/);
  const malformed=spawnSync(process.execPath,[script,'--manifest'],{encoding:'utf8'});
  assert.equal(malformed.status,1); assert.match(malformed.stderr,/requires a path/);
});

test('required glow inventory covers all eight Star, all eight Magic and four other homes', async () => {
  const expected=[...['star','magic'].flatMap(stage=>S.AXES.map(axis=>`${axis}:${stage}`)),...['0','1','2','leaf'].map(stage=>`home:${stage}`)];
  assert.deepEqual([...REQUIRED_KEYS],expected); assert.equal(new Set(REQUIRED_KEYS).size,20);
  const report=await checkGlows({manifest:{tiles:{'home:0':{src:'0/home.png'}}}});
  assert.equal(report.ok,false); assert.equal(report.fails.length,20);
  assert.ok(report.fails.includes('home:0: required glow path is missing'));
});

async function productionArt(manifest) {
  const view=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:manifest});
  await view.c.ART.assetsReady; await view.c.ART.tileArtReady;
  assert.equal(view.c.ART.tileArtStatus().failed.length,0);
  return view.c.ART;
}
function render(A,key,time,night) {
  const cv=createCanvas(256,384),g=cv.getContext('2d');
  drawTile(A,g,key,0,0,256,time,night);
  assert.equal(g.globalCompositeOperation,'source-over','renderer restores blending mode');
  assert.equal(g.globalAlpha,1,'renderer restores alpha');
  return Buffer.from(g.getImageData(0,0,256,384).data);
}
function intensity(pixels) {
  let sum=0; for(let i=0;i<pixels.length;i+=4)sum+=(pixels[i]+pixels[i+1]+pixels[i+2])*pixels[i+3]/255;
  return sum;
}

test('production glow renderer breathes at the actual low and peak and holds full brightness at night', async t => {
  const f=fixture(t,g=>{g.fillStyle='rgba(80,160,200,0.4)';g.fillRect(400,600,120,120);});
  const base=createCanvas(1024,1536),g=base.getContext('2d');g.fillStyle='#203040';g.fillRect(300,400,300,500);
  fs.writeFileSync(path.join(f.dir,'base.png'),base.toBuffer('image/png'));
  const manifest={version:2,tiles:{'home:0':{src:path.relative(TILES,path.join(f.dir,'base.png')),glow:path.relative(TILES,f.file),glowPeriod:8}},sprites:{},travellers:{}};
  const A=await productionArt(manifest),low=render(A,'home:0',6,false),peak=render(A,'home:0',2,false);
  assert.notDeepEqual(low,peak); assert.ok(intensity(peak)>intensity(low));
  assert.deepEqual(render(A,'home:0',6,true),peak);
  assert.deepEqual(render(A,'home:0',2,true),peak);
  assert.deepEqual(render(A,'home:0',11.3,true),peak);
  assert.deepEqual(render(A,'home:0',14,false),low,'day cycle repeats after one period');
});

test('review framing matches the complete production tile canvas without squashing or clipping', async t => {
  const f=fixture(t,g=>{g.fillStyle='#52a080';g.fillRect(0,0,1024,1536);g.fillStyle='#e02060';g.fillRect(100,200,80,160);});
  const A=await productionArt({version:2,tiles:{'home:0':{src:path.relative(TILES,f.file)}},sprites:{},travellers:{}});
  const actual=render(A,'home:0',0,false),cv=createCanvas(256,384),g=cv.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(f.cv,0,0,256,384);
  assert.deepEqual(actual,Buffer.from(g.getImageData(0,0,256,384).data));
});

test('all 20 shipped glow layers pass pixel checks and render through the production low/peak/night path', async () => {
  const manifest=loadManifest(),report=await checkGlows({manifest});
  assert.deepEqual(report.fails,[]); assert.equal(report.count,20);
  // Isolate light breathing from independent actor motion: the core/detail PRs
  // add moving sprites whose positions legitimately differ at these timestamps.
  const selected={...manifest,tiles:Object.fromEntries(REQUIRED_KEYS.map(key=>{
    const {actors,...tile}=manifest.tiles[key]; return [key,tile];
  }))};
  const A=await productionArt(selected);
  for(const key of REQUIRED_KEYS){
    const period=selected.tiles[key].glowPeriod;
    const low=render(A,key,period*.75,false),peak=render(A,key,period*.25,false);
    assert.notDeepEqual(low,peak,`${key}: day breathing changes actual pixels`);
    assert.ok(intensity(peak)>intensity(low),`${key}: day peak adds more light`);
    assert.deepEqual(render(A,key,period*.75,true),peak,`${key}: night low equals day peak`);
    assert.deepEqual(render(A,key,period*.25,true),peak,`${key}: night peak equals day peak`);
    assert.deepEqual(render(A,key,period*1.37,true),peak,`${key}: night remains constant`);
  }
});
