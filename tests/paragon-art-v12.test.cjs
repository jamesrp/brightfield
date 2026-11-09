'use strict';
// v0.12 Paragon art: full-hex images line up with the board for both ways three hexes can sit, and load only when needed.
const {test}=require('node:test'),assert=require('node:assert/strict');const {make}=require('./ui-harness.cjs');
const S=require('../tools/art/paragon-spec.cjs');

test('the renderer and the art tools agree on the Paragon canvas',()=>{
  const v=make(1024,768,'?mode=cozy&seed=7&cards=0',true),P=v.c.ART.PARAGON_SPEC;
  assert.equal(P.size,S.SIZE);assert.equal(P.cx,S.CX);assert.equal(P.halfW,S.HW);
  for(const l of ['a','b']) assert.equal(P.anchorY[l],S.LAYOUTS[l].anchor[1]);
});

test('each layout puts its three painted hexes exactly on the three board hexes',()=>{
  const v=make(1280,860,'?mode=cozy&seed=7&cards=0',true),f=v.c.__BF,A=v.c.ART;
  for(const [tiles,layout] of [[[[0,0],[1,0],[1,-1]],'a'],[[[0,0],[1,0],[0,1]],'b']]){
    const pts=tiles.map(([q,r])=>({x:f.hx(q,r),y:f.hy(q,r)})), cx=pts.reduce((s,p)=>s+p.x,0)/3, cy=pts.reduce((s,p)=>s+p.y,0)/3;
    const spots=pts.map(p=>({dx:p.x-cx,dy:p.y-cy}));assert.equal(A.paragonLayout(spots),layout);
    const pl=A.paragonPlacement(cx,cy,f.V.u,layout);
    assert.ok(Math.abs(S.HW*pl.k-f.V.u*Math.sqrt(3)/2)<1e-9,'same hex size');
    const painted=S.LAYOUTS[layout].hexes.map(([x,y])=>({x:pl.left+x*pl.k,y:pl.top+y*pl.k}));
    for(const p of pts) assert.ok(painted.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<0.5),'hex centre '+layout);
  }
});

test('Paragon images load only once a Paragon is on the board, and a missing one falls back to the placeholder',()=>{
  const v=make(1280,860,'?mode=cozy&seed=7&cards=0',true),f=v.c.__BF;v.step(3);
  assert.ok(!v.imageLoads.some(s=>s.includes('paragons/')));
  f.s.era.power=3;f.s.variant.power='leaf';f.s.ideas=3;f.V.sel=0;f.doPlace(0,0);f.doLearn('power','star');f.V.sel=0;f.doPlace(1,0);f.doLearn('power','magic');f.V.sel=0;f.doPlace(1,-1);
  v.flushTimers();f.doMerge();v.step(10);
  assert.equal(v.imageLoads.filter(s=>s.includes('paragons/')).length,1);assert.ok(v.imageLoads.some(s=>s.endsWith('paragons/power-a.png')));
  assert.equal(v.c.ART.paragonArtReady('power','a'),false);v.step(10);
});
