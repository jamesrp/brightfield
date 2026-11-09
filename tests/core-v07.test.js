'use strict';
const assert = require('node:assert/strict');
const B = require('../src/core.js');
const test = require('node:test');
function tile(s,q,r,type) { s.tiles[B.key(q,r)] = {q,r,type,critter:null}; }
// v0.10: upgrades follow the tech tree, so walk it in any order the tree allows.
function upgradeAll(s,pick) { let n=0; while(B.AXES.some(a=>s.era[a]<3)) { const a=B.AXES.find(a=>B.canUpgrade(s,a)); if(!a) break; assert.ok(B.upgrade(s,a,pick(a))); n++; } return n; }
function play(s,n) {
  for(let i=0;i<n&&!s.over;i++) {
    const [q,r]=B.legalHexes(s)[0]; B.place(s,0,q,r);
    const a=B.AXES.find(a=>B.canUpgrade(s,a)); if(a) B.upgrade(s,a, i%2?'leaf':'star');
  }
  return s;
}
test('future bonus is directed, gentle, unmultiplied, and capped once per link',()=>{
 const s=B.newGame();s.era.home=3;s.variant.home='leaf';tile(s,1,0,'water');
 const p=B.preview(s,'home',0,0); assert.equal(p.bonus,1); assert.equal(p.points,2);
 assert.equal(B.linkBonuses(s,'home','make').points,0);
 s.variant.home='star';assert.equal(B.linkBonuses(s,'home','make').future,1);
 s.era.make=3;s.variant.make='star';assert.equal(B.linkBonuses(s,'home','make').future,1);
});
test('discoveries require both tracks and add exactly one sun per matching link',()=>{
 const s=B.newGame();s.era.water=2;s.ideas=1;s.era.food=1;
 assert.equal(B.discoveries(s).length,0);const ev=B.upgrade(s,'food');
 assert.equal(ev.filter(e=>e.type==='discovery').length,1);assert.equal(s.era.food,2);
 tile(s,1,0,'water');const p=B.preview(s,'food',0,0);assert.equal(p.bonus,1);assert.equal(p.raw,8);assert.equal(p.points,Math.max(1,Math.round(8*B.sunFactor(s))));
 assert.equal(B.linkBonuses(s,'water','water').discovery,0);
 s.era.food=3;s.variant.food='leaf';assert.equal(B.linkBonuses(s,'food','water').points,2);
});
test('every track can reach its future through the tech tree and total progression is 24',()=>{
 const s=B.newGame();s.ideas=24;
 assert.equal(upgradeAll(s,()=>'leaf'),24);
 assert.equal(s.ideasSpent,24);assert.equal(s.crowned,'leaf');assert.equal(s.over,true);
 assert.deepEqual(B.TUNE.growAt,{3:3,8:4,14:5});assert.equal(B.sunNeed(1),6);
});
test('mixed endings require at least three of each future',()=>{
 for(const [leaves,want] of [[0,'star'],[2,'star'],[3,'mixed'],[4,'mixed'],[5,'mixed'],[6,'leaf'],[8,'leaf']]) {
 const s=B.newGame();B.AXES.forEach((a,i)=>{s.era[a]=3;s.variant[a]=i<leaves?'leaf':'star';});assert.equal(B.crownOf(s),want);
 }
});
test('last challenge tile allows earned ideas, then ends after spending',()=>{
 const s=B.newGame({mode:'challenge'});s.deck=[];s.hand=['power',null,null];s.sun=6;
 const ev=B.place(s,0,0,0);assert.equal(s.ideas,1);assert.equal(s.over,false);assert.equal(B.waitingForIdeas(s),true);assert.ok(!ev.some(e=>e.type==='end'));
 const end=B.upgrade(s,'power');assert.equal(s.over,true);assert.ok(end.some(e=>e.type==='end'));
});
test('merging groups crosses 5 and 9, without repeating existing milestones',()=>{
 const s=B.newGame();s.radius=10;
 for(let q=-4;q<=4;q++)if(q)tile(s,q,0,'home');
 let p=B.preview(s,'home',0,0);assert.deepEqual(p.hood.thresholds,[5,9]);assert.equal(p.hood.points,18);
 tile(s,-5,0,'home');p=B.preview(s,'home',0,0);assert.deepEqual(p.hood.thresholds,[9]);
 for(let q=-9;q<=-6;q++)tile(s,q,0,'home');assert.equal(B.preview(s,'home',0,0).hood,null);
});
test('save, reload, replay and one-step undo preserve exact seeded results',()=>{
 const s=play(B.newGame({seed:7854}),35);
 assert.deepEqual(B.deserialize(B.serialize(s)),s);
 assert.deepEqual(B.replay({seed:s.seed},s.log),s);
 const before=B.serialize(s);const [q,r]=B.legalHexes(s)[0];B.place(s,0,q,r);
 const restored=B.undo(s);const old=JSON.parse(before).state;delete old._undo;old.swaps=Infinity;assert.deepEqual(restored,old);
});
test('crowned continuation survives save/reload with explicit continuation log',()=>{
 const s=B.newGame();s.ideas=24;upgradeAll(s,()=>'leaf');
 assert.ok(B.continueTown(s));assert.equal(s.log.at(-1)[0],'c');assert.equal(s.over,false);
 assert.ok(B.place(s,0,0,0));const r=B.deserialize(B.serialize(s));assert.deepEqual(r,s);assert.ok(B.place(r,0,1,0));
});
test('legacy action logs still load deterministically',()=>{
 const s=play(B.newGame({seed:441}),20);const legacy={mode:s.mode,seed:s.seed,log:s.log};
 assert.deepEqual(B.deserialize(JSON.stringify(legacy)),s);
});
test('legacy logs with unlogged post-crown play recover continuation',()=>{
 const s=play(B.newGame({seed:17}),500);assert.ok(s.crowned);
 B.continueTown(s);const [q,r]=B.legalHexes(s)[0];B.place(s,0,q,r);
 const legacyLog=s.log.filter(a=>a[0]!=='c');const rstate=B.deserialize(JSON.stringify({mode:s.mode,seed:s.seed,log:legacyLog}));
 assert.equal(rstate.turn,s.turn);assert.equal(rstate.over,false);assert.equal(Object.keys(rstate.tiles).length,Object.keys(s.tiles).length);
 assert.ok(rstate.log.some(a=>a[0]==='c'));
});
