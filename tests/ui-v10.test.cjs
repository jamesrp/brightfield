'use strict';
// v0.10 interface: locked tech rows explain themselves, smog shows on the sun and the preview, and the sky clearing is celebrated.
const {test}=require('node:test'),assert=require('node:assert/strict');const {make}=require('./ui-harness.cjs');
function down(v,x,y){v.listeners.pointerdown({clientX:x,clientY:y,pointerType:'mouse'});}
function up(v,x,y){v.listeners.pointerup({clientX:x,clientY:y,pointerType:'mouse'});}
const SIZES=[[1440,900],[1024,768],[768,1024],[390,844]];
function tap(v,f,axis){const r=f.techRects()[f.B.AXES.indexOf(axis)],x=r.x+r.w/2,y=r.y+r.h/2;down(v,x,y);up(v,x,y);}
function panel(v){return v.elements.find(e=>e.className==='guide-shade');}

test('tapping a tree-locked row keeps the idea and opens the locked step with its reason',()=>{
  for(const [w,h] of SIZES){
    const v=make(w,h,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;f.s.ideas=1;f.s.era.move=1;
    v.step(2);tap(v,f,'move');
    assert.equal(f.s.era.move,1);assert.equal(f.s.ideas,1);
    assert.equal(f.V.card.kind,'locked');assert.equal(f.V.card.era,2);
    const html=panel(v).html;assert.match(html,/Locked for now/);assert.match(html,/Needs Wind Turbines/);assert.match(html,/electricity is clean/);
    f.closeCard();v.step(2);
  }
});

test('a future locked by smog explains the clear-sky rule and lists the next step it opens',()=>{
  const v=make(1024,768,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;for(const a of f.B.AXES)f.s.era[a]=2;f.s.era.make=1;f.s.ideas=1;
  tap(v,f,'home');assert.equal(f.s.era.home,2);assert.equal(f.V.card.kind,'locked');assert.equal(f.V.card.treeEra,3);
  assert.match(panel(v).html,/Needs a clear sky/);f.closeCard();
  f.openCard({axis:'power',era:2,variant:null,kind:'inspect'});assert.match(panel(v).html,/Opens the way to Charging Hub/);f.closeCard();
});

test('the last smoky upgrade celebrates the clear sky and every future row opens',()=>{
  const v=make(1024,768,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;for(const a of f.B.AXES)f.s.era[a]=2;f.s.era.make=1;f.s.ideas=2;f.s.turn=5;f.s.ideasSpent=12;
  f.doUpgrade('make');assert.ok(f.V.toastQ.some(t=>/sky is clear/i.test(t.text)));
  assert.equal(f.goalInfo().st,'crown');assert.equal(f.B.canUpgrade(f.s,'home'),true);v.step(20);
});

test('smog shows as lost sunbeams on the preview and after placing, at every size',()=>{
  for(const [w,h] of SIZES){
    const v=make(w,h,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;
    for(const [q,r,t] of [[2,0,'power'],[2,-2,'power'],[0,2,'power'],[-2,2,'power'],[0,-1,'move'],[-1,0,'wild']]) {f.s.tiles[f.B.key(q,r)]={q,r,type:t,critter:null};}
    f.s.turn=3;const sel=f.s.hand.indexOf('home');f.V.sel=sel;f.V.prev=f.B.preview(f.s,'home',0,0);
    assert.ok(f.V.prev.dimmed>0,'smoggy preview loses sunbeams');v.step(3);
    assert.ok(f.doPlace(0,0));assert.ok(f.V.floats.some(x=>x.k==='loss'));v.step(30);
  }
});

test('locked rows, peeks and the hazy sun render without errors at every size',()=>{
  for(const [w,h] of SIZES){
    const v=make(w,h,'?mode=cozy&seed=7&auto=20&cards=0'),f=v.c.__BF;f.s.era.move=1;f.s.era.power=1;f.s.ideas=2;v.step(4);
    f.V.peek={axis:'move',t:0};v.step(3);f.V.peek=null;
    for(const a of f.B.AXES)f.s.era[a]=2;f.s.era.waste=1;f.V.peek={axis:'home',t:0};v.step(3);f.V.peek=null;
    f.V.smog=1;v.step(3);
  }
});
