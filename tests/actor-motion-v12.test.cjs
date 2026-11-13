'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const {position}=require('../tools/art/check-motion.cjs');
test('motion checker follows eased outbound, flipped return and negative times',()=>{
  const a={path:[[300,1180],[600,1180]],period:8};
  assert.deepEqual(position(a,0),{x:300,y:1180,flip:false,rotation:0});
  assert.deepEqual(position(a,2),{x:450,y:1180,flip:false,rotation:0});
  assert.deepEqual(position(a,4),{x:600,y:1180,flip:true,rotation:0});
  assert.deepEqual(position(a,6),{x:450,y:1180,flip:true,rotation:0});
  assert.deepEqual(position(a,-2),position(a,6));
});
test('motion checker keeps loop movement, no-flip actors and spinner pivots',()=>{
  assert.deepEqual(position({path:[[600,1180],[300,1180]],period:8,mode:'loop'},4),{x:450,y:1180,flip:true,rotation:0});
  assert.equal(position({path:[[300,1180],[600,1180]],period:8,face:'none'},6).flip,false);
  const p=position({at:[320,366],spin:.1},2.5);
  assert.equal(p.x,320);assert.equal(p.y,366);assert.equal(p.rotation,Math.PI/2);
  const s=position({at:[500,1000],sway:5,bob:4,period:8},2);
  assert.equal(s.y,1004);assert.equal(s.rotation,5*Math.PI/180);
});

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {check}=require('../tools/art/check-motion.cjs');

const {createCanvas}=require('@napi-rs/canvas');
function fixture(actors, options={}) {
  const image=createCanvas(options.width || 3,options.height || 3),g=image.getContext('2d');
  g.fillStyle='#fff';g.fillRect(...(options.pixel || [1,1]),1,1);
  return {manifest:{sprites:{painted:{src:'in-memory.png',anchor:options.anchor || [1.5,1.5]}},
    tiles:{'make:0':{actors:actors.map(a=>({sprite:'painted',...a}))}}},
    options:{loadImage:async()=>image}};
}
async function checkFixture(actors,options){
  const f=fixture(actors,options);return check(f.manifest,f.options);
}
test('swept clearance catches independent spin and bob phases after the first rotation',async()=>{
  const a={at:[512,1400],spin:1,bob:100,period:100};
  assert.equal(position(a,25).y,1500);
  const r=await checkFixture([a]);
  assert.equal(r.passed,false);assert.match(r.failures.join('\n'),/swept.*front/);
  assert.deepEqual(r.actors[0].bounds,[512,1300,512,1500]);
  assert.equal(r.actors[0].coverage,'continuous conservative envelope');
});
test('swept clearance catches aliased path bob peaks and unsampled path turns',async()=>{
  const a={path:[[512,1450],[512,1480]],period:8,bob:6,bobPeriod:.0625};
  assert.ok(position(a,4.015625).y>1485.7);
  const r=await checkFixture([a]);
  assert.equal(r.passed,false);assert.match(r.failures.join('\n'),/swept.*front/);
  const turn={path:[[200,1100],[983.1,1100],[200,1200]],mode:'loop',face:'none',period:8};
  // Even 128 uniform samples miss the small excursion at this internal vertex.
  for(let i=0;i<128;i++)assert.ok(position(turn,i*8/128).x+10<=993);
  const turned=await checkFixture([turn],{width:25,height:25,pixel:[12,12],anchor:[2.5,12.5]});
  assert.equal(turned.passed,false);assert.match(turned.failures.join('\n'),/right column/);
});
test('swept clearance respects loop facing and bounded sway rather than assuming a full spin',async()=>{
  const options={width:25,height:25,pixel:[12,12],anchor:[2.5,12.5]};
  const mover={path:[[35,1100],[200,1100]],period:8};
  assert.equal((await checkFixture([{...mover,mode:'loop'}],options)).passed,true);
  assert.equal((await checkFixture([mover],options)).passed,false,'return-facing silhouette crosses left column');
  assert.equal((await checkFixture([{...mover,face:'none'}],options)).passed,true);
  const sway=await checkFixture([{at:[512,50],sway:5,bob:1,period:8}],
    {width:85,height:5,pixel:[41,2],anchor:[1.5,2.5]});
  assert.equal(sway.passed,true,sway.failures.join('\n'));
  const spin=await checkFixture([{at:[512,50],spin:.1}],
    {width:85,height:5,pixel:[41,2],anchor:[1.5,2.5]});
  assert.equal(spin.passed,false);assert.match(spin.failures.join('\n'),/headroom/);
});
test('motion validation reports malformed containers and references without throwing',async()=>{
  for(const [manifest,message] of [
    [null,/manifest: object required/],
    [{sprites:[]},/sprites must be an object/],
    [{tiles:[]},/tiles must be an object/],
    [{travellers:[]},/travellers must be an object/],
    [{sprites:{x:null}},/sprite must be an object/],
    [{sprites:{x:{anchor:[1,1]}}},/sprite source required/],
    [{tiles:{x:null}},/tile must be an object/],
    [{tiles:{x:{actors:{}}}},/actors must be an array/],
    [{tiles:{x:{actors:[null]}}},/actor must be an object/],
    [{tiles:{x:{actors:[{sprite:'constructor',at:[512,1000]}]}}},/missing sprite/],
  ]){
    const r=await check(manifest);
    assert.equal(r.passed,false);assert.match(r.failures.join('\n'),message);
  }
});
test('motion validation rejects invalid coordinates, motion values and overflow',async()=>{
  for(const [actor,message] of [
    [{at:null},/invalid position/],
    [{at:[,1000]},/invalid position/],
    [{path:[[512,1100],,[600,1100]]},/top-face points/],
    [{at:[512,1000],path:[[400,1100],[600,1100]]},/exactly one/],
    [{path:[[512,1100],[NaN,1100]]},/top-face points/],
    [{at:[512,1000],period:0},/period must be positive/],
    [{at:[512,1000],bobPeriod:0},/bobPeriod must be positive/],
    [{at:[512,1000],spin:Infinity},/invalid spin/],
    [{at:[512,1000],sway:'5'},/invalid sway/],
    [{at:[512,1000],pulse:2},/pulse must be between/],
    [{at:[512,1000],spin:1e-320},/duration must be finite/],
    [{at:[512,1000],spin:Number.MAX_VALUE},/non-finite coordinates or rotation/],
  ]){
    const r=await checkFixture([actor]);
    assert.equal(r.passed,false);assert.match(r.failures.join('\n'),message);
    assert.equal(r.actors.length,0,'invalid actor is not sampled or certified');
  }
});
test('unreadable sprites and glows are aggregated into a report',async()=>{
  const f=fixture([{at:[512,1200]}]),reader=f.options.loadImage;
  f.manifest.sprites.missing={src:'missing.png',anchor:[1,1]};
  f.manifest.tiles['make:0'].glow='missing-glow.png';
  f.options.loadImage=async file=>{if(file.includes('missing'))throw new Error('fixture missing');return reader(file);};
  const r=await check(f.manifest,f.options);
  assert.equal(r.passed,false);assert.equal(r.actors.length,1);
  assert.match(r.failures.join('\n'),/unable to load sprite missing.png/);
  assert.match(r.failures.join('\n'),/unable to load glow missing-glow.png/);
});
test('sprite validation covers empty, opaque, boundary and invalid anchor inputs',async()=>{
  for(const [change,message] of [
    [f=>{f.manifest.sprites.painted.anchor=[NaN,0];},/finite anchor/],
    [f=>{f.manifest.sprites.painted.anchor=[,0];},/finite anchor/],
    [f=>{f.manifest.sprites.painted.anchor=[4,0];},/anchor outside/],
    [f=>{f.manifest.sprites.painted.bob=Infinity;},/invalid traveller bob/],
    [f=>{f.options.loadImage=async()=>createCanvas(3,3);},/empty sprite/],
    [f=>{const c=createCanvas(3,3);c.getContext('2d').fillRect(0,0,3,3);f.options.loadImage=async()=>c;},/missing transparent background/],
    [f=>{const c=createCanvas(3,3);c.getContext('2d').fillRect(0,0,1,1);f.options.loadImage=async()=>c;},/painted pixels touch image boundary/],
  ]){
    const f=fixture([]);change(f);const r=await check(f.manifest,f.options);
    assert.equal(r.passed,false);assert.match(r.failures.join('\n'),message);
  }
});
test('checker positions agree with production actor transforms',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/tile-art.js'),'utf8');
  const actors=[
    {path:[[300,1180],[600,1200],[440,1250]],period:8,bob:3,bobPeriod:.6},
    {path:[[600,1180],[600,1180],[300,1180]],period:8,mode:'loop'},
    {path:[[300,1180],[600,1180]],period:8,face:'none'},
    {at:[320,366],spin:.1,bob:4,period:8},
    {at:[500,1000],sway:5,bob:4,period:8,pulse:.4},
  ];
  for(const actor of actors)for(const t of [-8.25,-2,0,.5,2,4,6,25]){
    const c={ART:{BOARD:{tileRadius:.88,kerb:.06},drawBuilding(){}},
      BF_TILE_ART:{tiles:{'make:0':{src:'tile.png',actors:[{sprite:'painted',...actor}]}},
        sprites:{painted:{src:'sprite.png',anchor:[1.5,1.5]}}},
      Image:class{set src(value){this.onload();}}};
    c.window=c;vm.runInNewContext(source,c);
    const actual={x:0,y:0,flip:false,rotation:0};
    const g={globalAlpha:1,save(){},restore(){},drawImage(){},
      translate(x,y){actual.x=x;actual.y=y;},scale(x){actual.flip=x<0;},rotate(r){actual.rotation=r;}};
    const u=480/(.88*Math.sqrt(3)/2);
    c.ART.drawBuilding(g,'make',0,null,512,1130+u*.18,u,t,false,{grounded:true});
    const expected=position(actor,t);
    for(const key of ['x','y','rotation'])assert.ok(Math.abs(actual[key]-expected[key])<1e-8,key+' at '+t);
    assert.equal(actual.flip,expected.flip,'flip at '+t);
  }
});

function shipped(){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/tiles/manifest.js'),'utf8'),c);return c.window.BF_TILE_ART;}
test('Round 2 includes six painted travellers, core vehicles and missing mechanical parts',()=>{
  const m=shipped(),stages=['0','1','2','leaf','star','magic'],actors=key=>m.tiles[key]?.actors || [];
  for(const stage of stages)assert.ok(m.sprites[m.travellers[stage]],`${stage}: painted traveller`);
  assert.equal(new Set(stages.map(stage=>m.travellers[stage])).size,6,'six age-specific traveller sprites');
  for(const key of ['power:0','food:0','move:0','move:1','move:2','move:leaf','move:star','move:magic'])
    assert.ok(actors(key).some(a=>Array.isArray(a.path)&&a.path.length>=2),key+': painted vehicle follows a path');
  assert.ok(actors('power:2').filter(a=>a.spin).length>=2,'both bare wind turbine hubs have spinning rotors');
  assert.ok(actors('make:0').some(a=>a.spin),'mill waterwheel spins');
  assert.ok(actors('power:leaf').some(a=>a.sway),'sun mirror panels track gently');
});
test('every shipped actor silhouette stays on its plot across a complete motion cycle',async()=>{
  const report=await check(shipped());
  assert.equal(report.passed,true,report.failures.join('\n'));
  assert.ok(report.actors.length>0,'painted actors are present');
});
