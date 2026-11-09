'use strict';
// v0.10: smog dims the sun, the sky and the goal agree, and a small tech tree gates some upgrades.
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../src/core.js'), T=require('../src/techs.js');
function tile(s,q,r,type){ s.tiles[B.key(q,r)]={q,r,type,critter:null}; }
function clean(s){ for(const a of B.AXES) s.era[a]=Math.max(s.era[a],2); s.era.make=2; }
function greedy(s){let best=null;for(let i=0;i<s.hand.length;i++){const t=s.hand[i];if(!t)continue;for(const [q,r] of B.legalHexes(s)){const p=B.preview(s,t,q,r),v=p.points-B.hexDist(q,r)*.3;if(!best||v>best.v)best={i,q,r,v};}}return best;}

test('each prerequisite blocks only its own step, spends nothing, and opens once met',()=>{
  const cases=[['move',2,'power',2,'cleangrid'],['make',2,'power',2,'robotpower'],['waste',1,'make',1,'recyclers'],['waste',2,'food',1,'scrapsfirst'],['food',2,'water',1,'pipes']];
  for(const [axis,era,need,needEra,why] of cases){
    const s=B.newGame();s.ideas=1;s.era[axis]=era-1;
    for(const a of B.AXES) if(a!==axis && a!==need) s.era[a]=2; // satisfy any other link
    s.era[need]=needEra-1;
    const locks=B.locksFor(s,axis);
    assert.deepEqual(locks.map(l=>[l.kind,l.axis,l.era,l.why]),[['tech',need,needEra,why]],axis+era);
    assert.equal(B.canUpgrade(s,axis),false); assert.equal(B.upgrade(s,axis),null); assert.equal(s.ideas,1); assert.equal(s.era[axis],era-1);
    s.era[need]=needEra; assert.equal(B.canUpgrade(s,axis),true); assert.ok(B.upgrade(s,axis)); assert.equal(s.era[axis],era);
    assert.ok(B.LOCK_REASONS[why]); assert.ok(B.unlocksOf(need,needEra).some(u=>u.axis===axis&&u.era===era));
  }
});

test('every future needs a clear sky, and the step that clears it says so once',()=>{
  const s=B.newGame();clean(s);s.era.make=1;s.ideas=3; // one smoky kind left: the workshop
  assert.deepEqual(B.smokyKinds(s),['make']);
  for(const a of B.AXES) if(a!=='make'){ assert.equal(B.canUpgrade(s,a),false,a); assert.equal(B.locksFor(s,a)[0].kind,'sky'); }
  const ev=B.upgrade(s,'make'); assert.equal(ev.filter(e=>e.type==='skyclear').length,1);
  const open=ev.find(e=>e.type==='unlock'); assert.ok(open && open.axes.length===7);
  assert.equal(B.skyClear(s),true); assert.equal(B.canUpgrade(s,'home'),true);
  const again=B.upgrade(s,'home','leaf'); assert.ok(!again.some(e=>e.type==='skyclear'));
});

test('the sky stays hazy while any kind is smoky, however much nature, and clears exactly at the last upgrade',()=>{
  const s=B.newGame();s.radius=6;clean(s);s.era.power=1; // gas turbines are the last smoky kind
  tile(s,0,0,'power'); let k=0; for(let q=-4;q<=4;q++)for(let r=-4;r<=4;r++) if((q||r)&&B.hexDist(q,r)<=4&&k++<40) tile(s,q,r,'wild');
  const floor=B.TUNE.smogFloor+B.TUNE.smogPerKind;
  assert.ok(B.smogLevel(s)>=floor-1e-9, 'nature alone cannot clear the sky');
  s.ideas=1;B.upgrade(s,'power'); assert.equal(B.smogLevel(s),0); assert.equal(B.sunFactor(s),1);
});

test('smog dims placement sunbeams, but a placement still earns at least one',()=>{
  const s=B.newGame();tile(s,1,0,'wild');tile(s,2,0,'power');tile(s,3,0,'make');
  const p=B.preview(s,'home',0,0), f=B.sunFactor(s);
  assert.ok(f<1 && f>=1-B.TUNE.smogDim);
  assert.equal(p.points,Math.max(1,Math.round(p.base*f))); assert.equal(p.dimmed,p.base-p.points);
  for(let i=0;i<30;i++) tile(s,-i-1,5,'power'); // a very smoggy town
  for(const [q,r] of B.legalHexes(s)) assert.ok(B.preview(s,'waste',q,r).points>=1);
  const c=B.newGame();clean(c);tile(c,1,0,'wild'); const pc=B.preview(c,'home',0,0); assert.equal(pc.points,pc.base); assert.equal(pc.dimmed,0);
  const [lq,lr]=B.legalHexes(s)[0]; const ev=B.place(s,0,lq,lr); assert.equal(ev[0].dimmed,Math.max(1,Math.round(ev[0].raw*B.TUNE.demandMult[ev[0].demand]))-ev[0].points);
});

test('coal and gas give factories a cheap-power heart that clean power does not',()=>{
  const s=B.newGame();
  assert.ok(B.opinions(s,'make','power').some(o=>o.why==='cheap'));
  s.era.power=1; assert.ok(B.opinions(s,'make','power').some(o=>o.why==='cheap'));
  s.era.power=2; assert.ok(!B.opinions(s,'make','power').some(o=>o.why==='cheap'));
  assert.ok(B.opinions(s,'make','power').some(o=>o.why==='bolt'));
  assert.ok(B.REASONS.cheap);
});

test('a bucket-and-rope well makes no smoke, and the renamed futures match their cards',()=>{
  assert.equal(B.EMIT.water[0],0);
  assert.equal(T.tech('power',3,'leaf').name,'Sun Mirror Tower'); assert.equal(T.tech('power',3,'leaf').status,'Today');
  assert.equal(T.tech('power',3,'star').name,'Fusion Reactor');
  for(const a of B.AXES) for(const v of ['leaf','star','magic']) assert.equal(B.ERA_NAMES[a][3][['leaf','star','magic'].indexOf(v)],T.tech(a,3,v).name.toLowerCase());
});

test('the tree has no loops and every link points at a real step',()=>{
  for(const n of B.NEEDS){ assert.ok(B.AXES.includes(n.axis)&&n.era>=1&&n.era<=2); for(const [a,e] of Object.entries(n.needs)){ assert.ok(B.AXES.includes(a)&&e>=1&&e<=2); assert.notEqual(a,n.axis); } assert.ok(B.LOCK_REASONS[n.why]); }
  for(let seed=1;seed<=20;seed++){ const s=B.newGame({seed});s.ideas=24;let n=0; while(B.AXES.some(a=>s.era[a]<3)){ const ok=B.AXES.filter(a=>B.canUpgrade(s,a)); assert.ok(ok.length,'never stuck'); const a=ok[(seed*7+n)%ok.length]; B.upgrade(s,a,['leaf','star','magic'][n%3]); n++; } assert.equal(n,24); assert.ok(s.crowned); }
});

test('a v0.9 town saved mid-tree loads, keeps its history and can still finish',()=>{
  const s=B.newGame({seed:5});B.place(s,0,0,0);s.v='0.9.0';s.era.move=2;s.era.power=1;s.era.food=2;s.era.water=0;s.sun=210;
  const r=B.deserialize(JSON.stringify({schema:2,state:s}));
  assert.equal(r.era.move,2); assert.equal(r.sun,210); assert.equal(r.v,B.VERSION);
  r.ideas=24; let n=0; while(B.AXES.some(a=>r.era[a]<3)&&n<40){ const a=B.AXES.find(a=>B.canUpgrade(r,a)); if(!a) break; B.upgrade(r,a,'star'); n++; }
  assert.ok(r.crowned);
});

test('greedy play stays short and clears the sky well before the crown',()=>{
  for(const seed of [7,17,42,101,314]){
    const s=B.newGame({seed}); let clear=null;
    for(let n=0;n<150&&!s.over;n++){
      while(s.ideas>0){const a=B.AXES.filter(a=>B.canUpgrade(s,a)).sort((a,b)=>s.era[a]-s.era[b])[0];if(!a)break;B.upgrade(s,a,s.era[a]===2?'leaf':undefined);}
      if(clear===null&&B.skyClear(s)) clear=s.turn;
      if(s.over)break; const b=greedy(s); if(!b)break; B.place(s,b.i,b.q,b.r);
    }
    assert.ok(s.crowned,'crowned '+seed); assert.ok(s.turn<=62,'short '+seed+' '+s.turn); assert.ok(clear!==null&&clear<s.turn-8,'clear sky first '+seed);
  }
});
