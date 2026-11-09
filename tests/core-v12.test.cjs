'use strict';
// v0.12 Paragons: learn the other futures, build a Nature, a Future and a Magic building touching each other, merge them.
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/core.js');
const P=B.AXES.indexOf('power');
function ready(seed=4,first='leaf'){ const s=B.newGame({seed}); s.era.power=3; s.variant.power=first; s.ideas=5; return s; }
function triangle(s){ // Nature, Future, Magic power plants in a little triangle of hexes
  assert.ok(B.place(s,P,0,0)); assert.equal(B.tileStyle(s,s.tiles['0,0']),'leaf');
  assert.ok(B.learn(s,'power','star')); assert.ok(B.place(s,P,1,0)); assert.equal(s.tiles['1,0'].v,'star');
  assert.ok(B.learn(s,'power','magic')); assert.ok(B.place(s,P,1,-1)); assert.equal(s.tiles['1,-1'].v,'magic');
  return ['0,0','1,-1','1,0'];
}

test('another future can be learned only after the track reaches its future, for one idea each, once per look',()=>{
  const s=B.newGame({seed:4}); s.ideas=3; assert.equal(B.canLearn(s,'power'),false); assert.equal(B.learn(s,'power','star'),null);
  s.era.power=3; s.variant.power='leaf';
  assert.equal(B.canLearn(s,'power','leaf'),false,'already known'); assert.ok(B.canLearn(s,'power','star'));
  const ev=B.learn(s,'power','star'); assert.equal(ev[0].type,'learn'); assert.deepEqual(ev[0].known,['leaf','star']); assert.equal(ev[0].all,false);
  assert.equal(s.ideas,2); assert.equal(B.styleOf(s,'power'),'star'); assert.equal(s.variant.power,'leaf','the first future still decides the crown');
  assert.equal(B.learn(s,'power','star'),null); assert.equal(B.learn(s,'power','magic')[0].all,true); assert.equal(B.canLearn(s,'power'),false);
  s.ideas=0; s.era.food=3; s.variant.food='star'; assert.equal(B.canLearn(s,'food'),false,'needs an idea');
  B.TUNE.paragonOn=false; s.ideas=2; assert.equal(B.canLearn(s,'food'),false); B.TUNE.paragonOn=true;
});

test('each building keeps the look it was built in, and the card cycles through known looks',()=>{
  const s=ready(); B.place(s,P,0,0); B.learn(s,'power','magic'); B.place(s,P,1,0);
  assert.equal(B.tileStyle(s,s.tiles['0,0']),'leaf'); assert.equal(B.tileStyle(s,s.tiles['1,0']),'magic');
  assert.equal(s.tiles['0,0'].v,'leaf','each building remembers its look');
  assert.equal(B.cycleStyle(s,'power'),'leaf'); assert.equal(B.cycleStyle(s,'power'),'magic');
  assert.equal(B.setStyle(s,'power','star'),false); assert.ok(B.setStyle(s,'power','leaf')); assert.equal(B.styleOf(s,'power'),'leaf');
  assert.equal(B.cycleStyle(s,'food'),null);
});

test('three touching buildings, one of each future, merge into the one Paragon for that track',()=>{
  const s=ready(), tri=triangle(s);
  assert.deepEqual(B.paragonSpots(s,'power'),[tri]); assert.deepEqual(B.allParagonSpots(s),[{axis:'power',tiles:tri}]);
  assert.equal(B.merge(s,'power',['0,0','1,0','9,9']),null);
  const sun=s.sun, ev=B.merge(s,'power',['1,0','0,0','1,-1']);
  assert.equal(ev[0].type,'paragon'); assert.equal(ev[0].points,B.TUNE.paragonBurst); assert.ok(s.sun>sun);
  for(const k of tri) { assert.equal(s.tiles[k].paragon,'power'); assert.equal(s.tiles[k].type,'power'); }
  assert.deepEqual(s.paragons.power.tiles,tri); assert.equal(B.paragonCount(s),1);
  assert.deepEqual(B.paragonSpots(s,'power'),[],'only one Paragon per track');
  B.place(s,P,2,-1); B.place(s,P,2,0); B.place(s,P,0,1); assert.deepEqual(B.paragonSpots(s,'power'),[]);
});

test('two of the same look, or a line instead of a triangle, never merges',()=>{
  const s=ready(); B.place(s,P,0,0); B.learn(s,'power','star'); B.place(s,P,1,0); B.setStyle(s,'power','leaf'); B.place(s,P,1,-1);
  assert.deepEqual(B.paragonSpots(s,'power'),[],'two Nature, one Future');
  const t=ready(); B.place(t,P,0,0); B.learn(t,'power','star'); B.place(t,P,1,0); B.learn(t,'power','magic'); B.place(t,P,2,0);
  assert.deepEqual(B.paragonSpots(t,'power'),[],'a line of three');
  const u=ready(); triangle(u); u.tiles['0,0'].type='food'; assert.deepEqual(B.paragonSpots(u,'power'),[],'all the same kind');
});

test('building next to a Paragon earns double sunbeams, and only next to it',()=>{
  const s=ready(), tri=triangle(s);
  const near=B.preview(s,'home',0,-1), before=B.preview(s,'home',0,-1);
  assert.equal(near.paragon,null); B.merge(s,'power',tri);
  const p=B.preview(s,'home',0,-1); assert.equal(p.paragon,'power'); assert.equal(p.aura,2); assert.equal(p.raw,before.raw*2);
  const far=B.legalHexes(s).find(([q,r])=>tri.every(k=>{const [a,b]=k.split(',').map(Number);return B.hexDist(q,r,a,b)>1;})), f=B.preview(s,'home',far[0],far[1]);
  assert.equal(f.aura,1); assert.equal(f.paragon,null);
});

test('learning and merging replay, save and undo exactly',()=>{
  const s=ready(); triangle(s); B.merge(s,'power',B.paragonSpots(s,'power')[0]);
  assert.ok(s.log.some(a=>a[0]==='l')); assert.ok(s.log.some(a=>a[0]==='m')); assert.ok(s.log.some(a=>a[0]==='p'&&a[4]==='star'));
  const back=B.deserialize(B.serialize(s)); assert.deepEqual(back.paragons,s.paragons); assert.deepEqual(back.tiles,s.tiles); assert.equal(back.sun,s.sun);
  const un=B.undo(s); assert.equal(un.paragons.power,undefined); assert.equal(un.tiles['0,0'].paragon,undefined); assert.equal(B.paragonSpots(un,'power').length,1);
  // replay from a log on a state whose futures were reached by real upgrades
  const r=B.newGame({seed:9}); r.ideas=99; for(const a of B.AXES) if(a!=='power') r.era[a]=2;
  r.era.power=2; assert.ok(B.upgrade(r,'power','star')); B.place(r,P,0,0); B.learn(r,'power','leaf'); B.place(r,P,1,0); B.learn(r,'power','magic'); B.place(r,P,1,-1);
  assert.equal(B.paragonSpots(r,'power').length,1);
});

test('a v0.11 save without the new fields still plays, and a town that never learns plays exactly as before',()=>{
  const s=B.newGame({seed:11}); B.place(s,4,0,0); B.place(s,7,1,0);
  const old=JSON.parse(B.serialize(s)).state; delete old.learned; delete old.style; delete old.paragons; old.v='0.11.0';
  const r=B.deserialize(JSON.stringify({schema:2,state:old})); assert.ok(B.place(r,0,-1,0)); assert.deepEqual(B.allParagonSpots(r),[]);
  r.era.power=3; r.variant.power='magic'; assert.deepEqual(B.known(r,'power'),['magic']); assert.equal(B.styleOf(r,'power'),'magic'); assert.ok(B.canLearn(Object.assign(r,{ideas:1}),'power'));
  // with Paragons switched off, the same seed and moves give the same town
  const play=()=>{ const g=B.newGame({seed:21}); for(let i=0;i<40&&!g.over;i++){ const h=B.legalHexes(g); const [q,r2]=h[i*7%h.length]; B.place(g,i%8,q,r2); for(const a of B.AXES) if(B.canUpgrade(g,a)) B.upgrade(g,a,['leaf','star','magic'][i%3]); } return g; };
  const on=play(); B.TUNE.paragonOn=false; const off=play(); B.TUNE.paragonOn=true;
  assert.equal(on.sun,off.sun); assert.deepEqual(on.tiles,off.tiles); assert.deepEqual(on.era,off.era);
});
