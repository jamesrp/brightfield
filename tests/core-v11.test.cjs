'use strict';
// v0.11: free play offers every building type each turn; the daily Challenge keeps its 3-card hand.
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/core.js');

test('free play offers all eight types, keeps them after placing, and has nothing to swap',()=>{
  const s=B.newGame({seed:3});assert.deepEqual(s.hand,B.AXES);
  for(let i=0;i<B.AXES.length;i++){ const [q,r]=B.legalHexes(s)[0]; assert.ok(B.place(s,i,q,r)); assert.equal(s.tiles[B.key(q,r)].type,B.AXES[i]); assert.deepEqual(s.hand,B.AXES); }
  assert.equal(B.swap(s),null);
});

test('the daily Challenge still deals three cards from its 80-tile deck and keeps its swaps',()=>{
  const s=B.newGame({mode:'challenge',seed:20261108});assert.equal(s.hand.length,3);assert.equal(s.deck.length,77);assert.equal(s.swaps,3);
  const [q,r]=B.legalHexes(s)[0];B.place(s,0,q,r);assert.equal(s.hand.length,3);assert.equal(s.deck.length,76);
  assert.ok(B.swap(s));assert.equal(s.swaps,2);
});

test('a v0.10 free-play town saved with a 3-card hand continues with the full palette and nothing else changes',()=>{
  const s=B.newGame({seed:11});B.place(s,4,0,0);B.place(s,7,1,0);
  const old=JSON.parse(B.serialize(s)).state;old.hand=['home','wild','food'];old.v='0.10.0';
  const r=B.deserialize(JSON.stringify({schema:2,state:old}));
  assert.deepEqual(r.hand,B.AXES);assert.deepEqual(r.tiles,s.tiles);assert.equal(r.sun,s.sun);assert.equal(r.rng,s.rng);
  assert.ok(B.place(r,0,-1,0));assert.equal(B.undo(r).turn,s.turn);
  const ch=B.newGame({mode:'challenge',seed:5});const back=B.deserialize(B.serialize(ch));assert.deepEqual(back.hand,ch.hand);
});

test('town demand asks for a mix in free play only, and scales the whole placement',()=>{
  const s=B.newGame({seed:2});const put=(q,r,t)=>{s.tiles[B.key(q,r)]={q,r,type:t,critter:null};};
  let k=0;for(const [q,r] of B.legalHexes(s)) if(k++<8) put(q,r,'power'); // 8 power plants, nothing else
  assert.equal(B.demand(s,'power'),'plenty'); assert.equal(B.demand(s,'home'),'need');
  const t=B.newGame({seed:2}); t.tiles={'0,0':{q:0,r:0,type:'home',critter:null}}; assert.equal(B.demand(t,'home'),'ok'); assert.equal(B.demand(t,'power'),'ok');
  for(const [q,r] of B.legalHexes(s).slice(0,8)) put(q,r,['make','move','food','water','waste','wild','make','move'][k++%8]);
  assert.equal(B.demand(s,'home'),'need');
  const [q,r]=B.legalHexes(s)[0], p=B.preview(s,'home',q,r);
  assert.equal(p.demand,'need'); assert.equal(p.base,Math.max(1,Math.round(p.raw*1.5))); assert.equal(p.points,Math.max(1,Math.round(p.base*B.sunFactor(s))));
  const c=B.newGame({mode:'challenge',seed:2}); c.tiles=s.tiles; assert.equal(B.demand(c,'power'),'ok'); assert.equal(B.demand(c,'home'),'ok');
  B.TUNE.demandOn=false; assert.equal(B.demand(s,'home'),'ok'); B.TUNE.demandOn=true;
});

test('with every type on offer, a points-maximising player still builds a mixed town',()=>{
  const s=B.newGame({seed:9});
  for(let n=0;n<150&&!s.over;n++){
    while(s.ideas>0){const a=B.AXES.filter(a=>B.canUpgrade(s,a)).sort((a,b)=>s.era[a]-s.era[b])[0];if(!a)break;B.upgrade(s,a,s.era[a]===2?'leaf':undefined);}
    if(s.over)break; let best=null;
    for(let i=0;i<s.hand.length;i++)for(const [q,r] of B.legalHexes(s)){const p=B.preview(s,s.hand[i],q,r),v=p.points-B.hexDist(q,r)*.3;if(!best||v>best.v)best={i,q,r,v};}
    B.place(s,best.i,best.q,best.r);
  }
  const c=B.counts(s), n=Object.keys(s.tiles).length;
  for(const a of B.AXES){ assert.ok(c[a]/n<=0.25,a+' share '+c[a]+'/'+n); assert.ok(c[a]>=2,a+' present'); }
  assert.ok(s.crowned); assert.ok(s.turn<=60, 'short '+s.turn);
});
