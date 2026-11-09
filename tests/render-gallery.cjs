// Local-only visual review helper. Does not change any source asset.
const {createCanvas}=require('@napi-rs/canvas');const fs=require('node:fs'),path=require('node:path');const {make}=require('./ui-harness.cjs');
(async()=>{const v=make(1024,768,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;const stages=[0,1,2,'leaf','star','magic'];const cv=createCanvas(1440,1800),g=cv.getContext('2d');g.fillStyle='#f8f5ec';g.fillRect(0,0,1440,1800);g.textAlign='center';
for(let row=0;row<6;row++)for(let col=0;col<8;col++){const a=v.c.BF.AXES[col],st=stages[row],x=col*180+90,y=row*300+215;g.fillStyle='#496850';g.font='bold 12px system-ui';g.fillText(v.c.TECHS.tech(a,row<3?row:3,row>=3?st:null).name,x,row*300+278,176);v.c.ART.drawBuilding(g,a,row<3?row:3,row>=3?st:null,x,y,92,.8,false,{grounded:true});}
const dest=process.argv[2]||path.join(__dirname,'gallery-internal.png');fs.writeFileSync(dest,cv.toBuffer('image/png'));console.log(dest);})();
