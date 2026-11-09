const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/core.js'), T=require('../src/techs.js');
// v0.10: upgrades follow the tech tree; `each` runs after every upgrade.
function upgradeAll(s,pick,each=()=>{}) { let n=0; while(B.AXES.some(a=>s.era[a]<3)) { const a=B.AXES.find(a=>B.canUpgrade(s,a)); if(!a) break; assert.ok(B.upgrade(s,a,pick(a))); each(++n); } return n; }
test('Magic has eight explicit fantasy entries and a distinct three-neighbour bonus',()=>{
 for(const a of B.AXES){ const t=T.tech(a,3,'magic');assert.ok(t.name);assert.equal(t.status,'Imagine');assert.equal(B.ERA_NAMES[a][3][2],t.name.toLowerCase()); }
 const s=B.newGame();s.era.power=3;s.variant.power='magic';
 for(const a of B.AXES)assert.equal(B.linkBonuses(s,'power',a).future,['home','water','waste'].includes(a)?1:0);
 s.era.waste=3;s.variant.waste='magic';assert.equal(B.linkBonuses(s,'power','waste').future,1);
 s.era.food=3;s.variant.food='magic';s.era.water=2;assert.equal(B.linkBonuses(s,'food','water').points,2);
});
test('all Magic upgrades still cost 24 ideas and do not end at 23',()=>{
 const s=B.newGame();s.ideas=24;
 assert.equal(upgradeAll(s,()=>'magic',n=>{if(n<24)assert.equal(s.crowned,null);}),24);
 assert.equal(s.ideasSpent,24);assert.equal(s.crowned,'magic');assert.equal(s.over,true);
 assert.equal(B.TUNE.challengeDeck,80);assert.equal(B.MAX_ERA,3);
 assert.equal(B.upgrade(s,'home','bogus'),null);
});
test('two and three path shared crowns are symmetric, with dominant Magic retained',()=>{
 for(const [variants,want] of [['mmmmlsss','mixed'],['mmllssml','mixed'],['mmmmmmls','magic'],['llllllmm','leaf'],['ssssssmm','star']]){
 const s=B.newGame();B.AXES.forEach((a,i)=>{s.era[a]=3;s.variant[a]={m:'magic',l:'leaf',s:'star'}[variants[i]];});assert.equal(B.crownOf(s),want);
 }
});
test('Magic save, continuation and undo preserve variants and exact state',()=>{
 const s=B.newGame({seed:42});s.ideas=24;upgradeAll(s,()=>'magic');
 assert.ok(B.continueTown(s));const before=B.serialize(s);B.place(s,0,0,0);const copy=B.deserialize(B.serialize(s));assert.deepEqual(copy,s);const u=B.undo(copy),o=JSON.parse(before).state;delete o._undo;o.swaps=Infinity;assert.deepEqual(u,o);
});
test('v0.8 schema-2 snapshots retain historic score, choices and RNG',()=>{
 const s=B.newGame({seed:97});B.place(s,0,0,0);s.v='0.7.0';s.sun=145;s.era.home=3;s.variant.home='star';const r=B.deserialize(JSON.stringify({schema:2,state:s}));const expected=JSON.parse(JSON.stringify(s));expected.swaps=Infinity;expected.v=B.VERSION;assert.deepEqual(r,expected);
});
