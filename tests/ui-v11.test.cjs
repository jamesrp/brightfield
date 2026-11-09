'use strict';
// v0.11 interface: an 8-card palette that fits every screen without covering buttons, tech rows or each other.
const {test}=require('node:test'),assert=require('node:assert/strict');const {make}=require('./ui-harness.cjs');
const SIZES=[[1440,900],[1280,860],[1024,768],[820,1180],[768,1024],[390,844],[320,568]];
const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const circ=(c)=>({x:c.x-c.r,y:c.y-c.r,w:2*c.r,h:2*c.r});

test('the free-play palette shows all eight cards on screen, clear of buttons and tech rows',()=>{
  for(const [w,h] of SIZES){
    const v=make(w,h,'?mode=cozy&seed=7&auto=12&cards=0'),f=v.c.__BF;f.s.ideas=1;v.step(3);
    const cards=f.cardRects();assert.equal(cards.length,8,w+'x'+h);
    for(const c of cards){ assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=w&&c.y+c.h<=h,'on screen '+w+'x'+h); assert.ok(c.w>=56,'readable '+w+'x'+h+' '+c.w); }
    for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)assert.ok(!overlap(cards[i],cards[j]),'cards apart '+w+'x'+h);
    const buttons=[f.undoRect(),{x:30,y:h-30,r:18},{x:w-30,y:h-30,r:18}].map(circ);
    for(const c of cards)for(const b of buttons)assert.ok(!overlap(c,b),'buttons clear '+w+'x'+h);
    for(const c of cards)for(const r of f.techRects())assert.ok(!overlap(c,r),'tech rows clear '+w+'x'+h);
  }
});

test('keys 1 to 8 pick a type, placing keeps it selected, and the Challenge keeps three cards and a swap',()=>{
  const v=make(1280,860,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;
  v.listeners.keydown({key:'8'});assert.equal(f.s.hand[f.V.sel],'wild');
  assert.ok(f.doPlace(0,0));assert.equal(f.s.hand[f.V.sel],'wild');assert.equal(f.s.tiles['0,0'].type,'wild');
  const sw=f.swapRect();v.listeners.pointerdown({clientX:sw.x,clientY:sw.y,pointerType:'mouse'});assert.deepEqual(f.s.hand,f.B.AXES);
  const c=make(1280,860,'?mode=challenge&seed=7&cards=0'),g=c.c.__BF;assert.equal(g.cardRects().length,3);assert.ok(g.swapRect().r>0);c.step(3);
});
