'use strict';
// v0.12 interface: learn another future from the tech row, switch looks on the card, merge three buildings into a Paragon.
const {test}=require('node:test'),assert=require('node:assert/strict');const {make}=require('./ui-harness.cjs');
function down(v,x,y){v.listeners.pointerdown({clientX:x,clientY:y,pointerType:'mouse'});}
function up(v,x,y){v.listeners.pointerup({clientX:x,clientY:y,pointerType:'mouse'});}
const P=0; // power is the first card
function town(w=1280,h=860){ const v=make(w,h,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF; f.s.era.power=3; f.s.variant.power='leaf'; f.s.ideas=3; v.step(3); return {v,f}; }

test('tapping a finished track offers the futures you do not have yet, for one idea',()=>{
  const {v,f}=town(), r=f.techRects()[P];
  down(v,r.x+r.w/2,r.y+r.h/2); up(v,r.x+r.w/2,r.y+r.h/2);
  assert.ok(f.V.fork&&f.V.fork.learn,'learn picker open'); v.step(10);
  f.forkPick('leaf'); assert.ok(f.V.fork,'a known future is not offered again'); assert.equal(f.s.ideas,3);
  f.forkPick('star'); assert.equal(f.V.fork,null); assert.equal(f.s.ideas,2); assert.equal(f.B.known(f.s,'power').join(),'leaf,star');
  assert.equal(f.s.hand[f.V.sel],'power','the card is picked for you'); assert.equal(f.B.styleOf(f.s,'power'),'star');
  const c=f.cardRects()[P]; down(v,c.x+c.w/2,c.y+c.h/2); up(v,c.x+c.w/2,c.y+c.h/2);
  assert.equal(f.B.styleOf(f.s,'power'),'leaf','tapping the picked card again switches its look'); v.step(20);
});

test('completing a triangle opens the merge prompt; merging makes the Paragon, shows it and opens its card',()=>{
  const {v,f}=town(); f.V.sel=P;
  assert.ok(f.doPlace(0,0)); f.doLearn('power','star'); f.V.sel=P; assert.ok(f.doPlace(1,0)); f.doLearn('power','magic'); f.V.sel=P; assert.ok(f.doPlace(1,-1));
  v.flushTimers(); assert.ok(f.V.merge,'merge prompt opens by itself'); assert.equal(f.mergeControls.hidden,true); v.step(30);
  assert.equal(f.mergeControls.hidden,false,'buttons for touch and keyboard'); f.V.merge=null; v.step(2);
  // tapping one of the three opens the prompt again
  const sx=f.hx(1,0),sy=f.hy(1,0); f.V.sel=-1; down(v,sx,sy); up(v,sx,sy); assert.ok(f.V.merge,'tap a ready building to merge');
  const sun=f.s.sun; f.doMerge(); assert.equal(f.V.merge,null); assert.equal(f.s.paragons.power.tiles.length,3); assert.ok(f.s.sun>sun);
  v.step(120); v.flushTimers(); v.step(10);
  down(v,sx,sy); up(v,sx,sy); assert.equal(f.V.card&&f.V.card.kind,'paragon','tapping it opens the Paragon card');
  f.guide.tick(1.2); f.closeCard();
  // the next building beside it shows double sunbeams
  f.V.sel=1; const p=f.B.preview(f.s,f.s.hand[1],0,-1); assert.equal(p.aura,2);
  assert.ok(f.doPlace(0,-1)); v.step(40);
  if(process.env.SHOT) v.save(process.env.SHOT);
});

test('the merge prompt and a Paragon render at every screen size',()=>{
  for(const [w,h] of [[1440,900],[1024,768],[820,1180],[390,844],[320,568]]){
    const {v,f}=town(w,h); f.V.sel=P; f.doPlace(0,0); f.doLearn('power','star'); f.V.sel=P; f.doPlace(1,0); f.doLearn('power','magic'); f.V.sel=P; f.doPlace(1,-1);
    v.flushTimers(); v.step(30); const R=f.mergeRects(); assert.ok(R.x>0&&R.y-R.u>0&&R.y<h,'prompt on screen '+w+'x'+h);
    f.doMerge(); v.step(60);
  }
});

test('keys: Enter merges, Escape waits; the same digit twice switches the look',()=>{
  const {v,f}=town(); f.V.sel=P; f.doPlace(0,0); f.doLearn('power','star'); f.V.sel=P; f.doPlace(1,0); f.doLearn('power','magic'); f.V.sel=P; f.doPlace(1,-1);
  v.flushTimers(); v.listeners.keydown({key:'Escape',preventDefault(){}}); assert.equal(f.V.merge,null); assert.equal(f.B.paragonCount(f.s),0);
  f.openMerge(f.B.allParagonSpots(f.s)[0]); v.listeners.keydown({key:'Enter',preventDefault(){}}); assert.equal(f.B.paragonCount(f.s),1);
  const before=f.B.styleOf(f.s,'power'); v.listeners.keydown({key:'1'}); v.listeners.keydown({key:'1'}); assert.notEqual(f.B.styleOf(f.s,'power'),before);
});
