#!/usr/bin/env node
// Selected whole-cycle review sheets, using the production tile renderer.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {make}=require('../../tests/ui-harness.cjs');
const out=path.resolve(process.argv[2]||path.join(__dirname,'review'));
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const v=make(1200,900,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
  const A=v.c.ART,M=v.c.BF_TILE_ART;
  const sets={mechanical:['power:2','power:leaf','make:0'],vehicles:['power:0','food:0','move:0','move:1','move:2','move:leaf','move:star','move:magic']};
  for(const [name,keys] of Object.entries(sets)){
    const cols=name==='mechanical'?6:4,cw=name==='mechanical'?240:220,ch=280,c=createCanvas(cols*cw,keys.length*ch),g=c.getContext('2d');
    g.fillStyle='#f6f2e6';g.fillRect(0,0,c.width,c.height);g.textAlign='center';
    keys.forEach((key,row)=>{
      const [axis,stage]=key.split(':'),era=/^[012]$/.test(stage)?+stage:3,variant=era===3?stage:null;
      const T=M.tiles[key],duration=Math.max(...(T.actors||[]).map(a=>a.spin?1/Math.abs(a.spin):a.period||6),1);
      for(let col=0;col<cols;col++){
        const t=col*duration/cols,x=col*cw+cw/2,y=row*ch+213;
        A.drawBuilding(g,axis,era,variant,x,y,105,t,false,{grounded:true});
        g.fillStyle='#344038';g.font='12px sans-serif';g.fillText(`${key}  ${t.toFixed(1)}s`,x,row*ch+ch-10);
      }
    });
    fs.writeFileSync(path.join(out,name+'.png'),c.toBuffer('image/png'));
  }
  const stages=['0','1','2','leaf','star','magic'],c=createCanvas(1200,180),g=c.getContext('2d');g.fillStyle='#f6f2e6';g.fillRect(0,0,c.width,c.height);g.textAlign='center';
  stages.forEach((st,i)=>{const x=i*200;A.drawTraveller(g,st,x+55,100,240,1,0,1);A.drawTraveller(g,st,x+150,100,240,-1,0,1);g.fillStyle='#344038';g.font='14px sans-serif';g.fillText(st,x+100,155);});
  fs.writeFileSync(path.join(out,'travellers.png'),c.toBuffer('image/png'));
  const town=createCanvas(800,3*547),tg=town.getContext('2d');tg.fillStyle='#f6f2e6';tg.fillRect(0,0,town.width,town.height);tg.imageSmoothingQuality='high';
  for(const [i,st] of ['0','2','leaf'].entries()){tg.fillStyle='#344038';tg.font='bold 18px sans-serif';tg.fillText('Town close-up: '+st,16,i*547+24);tg.drawImage(await loadImage(path.resolve('tools/art/out/closeup-'+st+'.png')),0,i*547+35,800,512);}
  fs.writeFileSync(path.join(out,'towns.png'),town.toBuffer('image/png'));
  console.log('wrote',out);
})().catch(e=>{console.error(e);process.exitCode=1;});
