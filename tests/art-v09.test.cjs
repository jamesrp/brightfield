const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');const {make}=require('./ui-harness.cjs');
test('native hex sprites are never clipped and negative tile time never creates negative ripple radii',async()=>{
 const v=make(1024,768,'?mode=cozy&seed=9&auto=45&cards=0',true);await v.c.ART.assetsReady;const A=v.c.ART;
 const cv=createCanvas(420,420),g=cv.getContext('2d'),native=g.ellipse.bind(g);let clips=0;
 g.clip=()=>{clips++};g.ellipse=(x,y,rx,ry,...rest)=>{assert.ok(rx>=0&&ry>=0,'browser-compatible ellipse radii');return native(x,y,rx,ry,...rest)};
 for(const a of v.c.BF.AXES)for(const st of [0,1,2,'leaf','star','magic'])for(const t of [-9.1,-3.7,-.01,0,1.4]){g.clearRect(0,0,420,420);A.drawBuilding(g,a,typeof st==='number'?st:3,typeof st==='string'?st:null,210,280,120,t,false,{grounded:true});}
 assert.equal(clips,0,'native art is displayed intact');
});
test('all eight Magic miniature overlays animate independently',async()=>{
 const v=make(1024,768,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;const A=v.c.ART;
 const cv=createCanvas(360,360),g=cv.getContext('2d');
 for(const a of v.c.BF.AXES){const render=t=>{g.clearRect(0,0,360,360);A.drawBuilding(g,a,3,'magic',180,260,120,t,true,{grounded:true});return Buffer.from(g.getImageData(0,0,360,360).data)};assert.notDeepEqual(render(0),render(1.8),a);}
});
