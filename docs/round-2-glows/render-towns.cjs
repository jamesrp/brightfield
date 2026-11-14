#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),{make}=require('../../tests/ui-harness.cjs');
const out=path.resolve(process.argv[2]||path.join(__dirname,'review'));
(async()=>{fs.mkdirSync(out,{recursive:true});const cv=createCanvas(1200,828),g=cv.getContext('2d');g.fillStyle='#182b36';g.fillRect(0,0,cv.width,cv.height);g.imageSmoothingQuality='high';
for(const [row,stage]of ['star','magic'].entries()){
const v=make(1440,900,'?mode=cozy&seed=9&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
const f=v.c.__BF,s=f.s,AX=f.B.AXES,cells=[];
for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(f.B.hexDist(q,r)<=2)cells.push([q,r]);
cells.forEach(([q,r],k)=>s.tiles[f.B.key(q,r)]={q,r,type:AX[k%8],critter:null});
AX.forEach(a=>{s.era[a]=3;s.variant[a]=stage;});
v.step(120);
for(let col=0;col<2;col++){
if(col){f.startFinale(stage,true);v.step(5);}
const x=col*600,y=row*414;g.fillStyle='#edf3ef';g.font='18px sans-serif';g.fillText(stage.toUpperCase()+' · '+(col?'NIGHT FINALE':'DAY'),x+16,y+24);
g.drawImage(v.cv,f.V.cx-250,f.V.cy-190,500,320,x,y+30,600,384);
}}
fs.writeFileSync(path.join(out,'towns.png'),cv.toBuffer('image/png'));console.log('wrote town day/night close-ups');
})().catch(e=>{console.error(e);process.exitCode=1});
