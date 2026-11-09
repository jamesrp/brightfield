const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const {make}=require('./ui-harness.cjs');
test('all generated atlases load, all 48 buildings render, representative live animations change pixels',async()=>{
 const v=make(1024,768,'?mode=cozy&seed=7&cards=0',true),A=v.c.ART;
 assert.deepEqual(Array.from(await A.assetsReady),[true,true,true,true,true,true]);assert.equal(A.generatedStatus().ready,6);assert.equal(A.generatedStatus().failed.length,0);
 const cv=createCanvas(260,260),g=cv.getContext('2d');
 const render=(a,e,z,t)=>{g.clearRect(0,0,260,260);const em=A.drawBuilding(g,a,e,z,130,200,110,t,false);assert.ok(Array.isArray(em));for(const pt of em)assert.ok(pt.every(Number.isFinite));const pix=g.getImageData(0,0,260,260).data;assert.ok(pix.some((c,i)=>i%4===3&&c>0));return Buffer.from(pix);};
 for(const a of v.c.BF.AXES)for(const stage of [0,1,2,'leaf','star','magic'])render(a,typeof stage==='number'?stage:3,typeof stage==='string'?stage:null,.7);
 for(const [a,e,z] of [['power',2,null],['power',3,'star'],['move',3,'leaf'],['water',3,'star'],['wild',3,'leaf']])assert.notDeepEqual(render(a,e,z,0),render(a,e,z,1.4));
 v.step(5);assert.equal(v.imageLoads.length,6);
});
