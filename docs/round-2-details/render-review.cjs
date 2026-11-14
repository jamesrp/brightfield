#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),{make}=require('../../tests/ui-harness.cjs');
const out=path.resolve(process.argv[2]||path.join(__dirname,'review'));
(async()=>{fs.mkdirSync(out,{recursive:true});const v=make(1200,900,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
const A=v.c.ART,M=v.c.BF_TILE_ART,keys=['make:2','make:leaf','food:star','make:magic','waste:magic'],c=createCanvas(960,1400),g=c.getContext('2d');g.fillStyle='#f6f2e6';g.fillRect(0,0,c.width,c.height);g.textAlign='center';
keys.forEach((key,row)=>{const [axis,st]=key.split(':'),era=/^[012]$/.test(st)?+st:3,variant=era===3?st:null,a=M.tiles[key].actors[0],period=a.spin?1/Math.abs(a.spin):a.period||6;
for(let i=0;i<4;i++){const t=period*i/4,x=i*240+120;A.drawBuilding(g,axis,era,variant,x,row*280+213,105,t,false,{grounded:true});g.fillStyle='#344038';g.font='12px sans-serif';g.fillText(key+'  '+t.toFixed(1)+'s',x,row*280+270);}});
fs.writeFileSync(path.join(out,'moving-parts.png'),c.toBuffer('image/png'));
const tc=createCanvas(1200,828),tg=tc.getContext('2d');tg.fillStyle='#f6f2e6';tg.fillRect(0,0,tc.width,tc.height);tg.imageSmoothingQuality='high';
for(const [i,st]of ['2','leaf','star','magic'].entries()){const x=(i%2)*600,y=Math.floor(i/2)*414;tg.fillStyle='#344038';tg.font='18px sans-serif';tg.fillText('Town close-up: '+st,x+16,y+23);tg.drawImage(await loadImage(path.resolve('tools/art/out/closeup-'+st+'.png')),x,y+30,600,384);}
fs.writeFileSync(path.join(out,'towns.png'),tc.toBuffer('image/png'));console.log('wrote',out);
})().catch(e=>{console.error(e);process.exitCode=1});
