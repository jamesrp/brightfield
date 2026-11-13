'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas'),{make}=require('./ui-harness.cjs'),{check}=require('../tools/art/check-motion.cjs');
const expected={'make:2':'robot-arm','make:leaf':'repair-wheel','food:star':'lift-platform','make:magic':'forge-flame','waste:magic':'transmutation-orb'};
function shipped(){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/tiles/manifest.js'),'utf8'),c);return c.window.BF_TILE_ART;}
test('the five reserved moving parts are attached to their intended tiles',()=>{
 const m=shipped();for(const [key,name]of Object.entries(expected)){assert.ok(m.sprites[name],name);assert.ok((m.tiles[key].actors||[]).some(a=>a.sprite===name),key+' attachment');}
 const lift=m.tiles['food:star'].actors.find(a=>a.sprite==='lift-platform');assert.ok(lift.bob>=100,'lift visibly traverses the exposed shaft');assert.ok(lift.period>=8,'lift motion stays calm');
});
test('all moving-part silhouettes remain inside the plot through continuous motion',async()=>{
 const r=await check(shipped());assert.equal(r.passed,true,r.failures.join('\n'));assert.ok(r.actors.length>=5);
});
test('each reserved part visibly animates in the actual production renderer',async()=>{
 const v=make(1024,768,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
 const A=v.c.ART,m=v.c.BF_TILE_ART,c=createCanvas(512,768),g=c.getContext('2d'),u=240/(A.BOARD.tileRadius*Math.sqrt(3)/2);
 for(const [key,name]of Object.entries(expected)){
  const [axis,st]=key.split(':'),era=/^[012]$/.test(st)?+st:3,variant=era===3?st:null,a=m.tiles[key].actors.find(a=>a.sprite===name),quarter=a.spin?1/Math.abs(a.spin)/4:(a.period||6)/4;
  const render=t=>{g.clearRect(0,0,c.width,c.height);A.drawBuilding(g,axis,era,variant,256,565+u*.18,u,t,false,{grounded:true});return Buffer.from(g.getImageData(0,0,c.width,c.height).data);};
  assert.notDeepEqual(render(0),render(quarter),name+' must move or pulse');assert.doesNotThrow(()=>render(-quarter),name+' negative-time offset');
 }
});
