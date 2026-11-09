const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const A=require('../src/audio.js');
const st=v=>({progress:1,clean:1,critters:0,finale:v});
test('Magic has a distinct uplifting score with bounded, finite planner events',()=>{
  const voices=new Set();
  for(let step=0;step<192;step++)for(const e of A.plan(st('magic'),step,()=>.5)){
    voices.add(e.v);for(const key of ['m','vol','len','off'])assert.ok(Number.isFinite(e[key]),key);
    assert.ok(e.vol>0&&e.vol<=.2);assert.ok(e.off>=0);assert.ok(e.len>=0);
  }
  assert.ok(voices.has('crystal'));assert.ok(voices.has('aura'));assert.ok(voices.has('pluck'));
  assert.ok(!voices.has('kick'));assert.ok(!voices.has('hat'));
  assert.equal(A.bpmOf(st('magic')),92);
  assert.notDeepEqual(A.plan(st('magic'),0,()=>.5),A.plan(st('leaf'),0,()=>.5));
  assert.notDeepEqual(A.plan(st('magic'),0,()=>.5),A.plan(st('star'),0,()=>.5));
});
test('shared finales weave only selected paths; legacy mixed defaults to Nature/Future',()=>{
  for(const paths of [['leaf','magic'],['star','magic'],['leaf','star','magic']]){
    const s={...st('mixed'),futurePaths:paths};
    for(let bar=0;bar<12;bar++)assert.equal(A.finalePath(s,bar*8),paths[bar%paths.length]);
    assert.ok(Array.from({length:64},(_,i)=>A.plan(s,i,()=>.5)).flat().some(e=>e.v==='crystal'));
  }
  assert.equal(A.finalePath(st('mixed'),0),'leaf');assert.equal(A.finalePath(st('mixed'),8),'star');
});
test('audio stays silent before interaction and mute controls every voice through master',()=>{
  const events=[];let tick;
  const param=()=>({value:0,setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));events.push(['set',v]);},linearRampToValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert.ok(v>0&&Number.isFinite(t));},setTargetAtTime(v,t,d){assert.ok(Number.isFinite(v)&&Number.isFinite(t)&&d>0);events.push(['target',v]);},cancelScheduledValues(){}});
  const node=()=>({gain:param(),frequency:param(),detune:param(),Q:param(),threshold:param(),ratio:param(),delayTime:param(),connect(){},start(){},stop(){}});
  class Context{constructor(){this.sampleRate=100;this.currentTime=0;this.state='running';this.destination=node();}createGain(){return node();}createOscillator(){return node();}createDynamicsCompressor(){return node();}createConvolver(){return node();}createDelay(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createBuffer(c,len){return {getChannelData:()=>new Float32Array(len)};}resume(){this.state='running';}}
  const c={console,Math,setInterval:f=>(tick=f,1),AudioContext:Context};c.window=c;vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8'),c);
  assert.equal(c.AUDIO.ctx,null);c.AUDIO.setMute(true);c.AUDIO.init();assert.equal(c.AUDIO._A.master.gain.value,0);
  for(const finale of ['leaf','star','magic','mixed']){c.AUDIO.update({...st(finale),futurePaths:['leaf','star','magic']});for(let i=0;i<20;i++){c.AUDIO.ctx.currentTime+=.4;tick();}c.AUDIO.S.upgrade(finale);c.AUDIO.S.crown(finale);}
  c.AUDIO.setMute(false);assert.deepEqual(events.at(-1),['target',.9]);c.AUDIO.setMute(true);assert.deepEqual(events.at(-1),['target',0]);
});
test('4096 original town/Nature/Future/shared audio plans match the frozen v0.8 score',()=>{
 const h=require('node:crypto').createHash('sha256');
 for(const finale of [null,'leaf','star','mixed'])for(const progress of [0,.3,.6,1])for(let step=0;step<256;step++)h.update(JSON.stringify(A.plan({finale,progress,clean:.8,eve:.1,critters:3},step,()=>.5))+'\n');
 assert.equal(h.digest('hex'),'2210415667203c4c2a0b7307a3ab52387921b8309c04259ae7aa8515b10a5d33');
});
