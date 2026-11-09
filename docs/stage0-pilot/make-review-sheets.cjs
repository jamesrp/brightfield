const fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const axes=['power','move','food','water','home','make','waste','wild'],names=['Coal Plant','Horse Stable','Tractor Farm','Deep Well','Chimney Cottage','Smokestack Mill','Landfill','Meadow'];
 const c=createCanvas(1200,840),g=c.getContext('2d');g.fillStyle='#f6f2e6';g.fillRect(0,0,c.width,c.height);g.textAlign='center';
 for(let i=0;i<8;i++){const x=(i%4)*300,y=Math.floor(i/4)*420,im=await loadImage(`assets/tiles/0/${axes[i]}.png`);g.drawImage(im,x+20,y,260,390);g.fillStyle='#285333';g.font='bold 19px sans-serif';g.fillText(names[i],x+150,y+408);}
 fs.writeFileSync('docs/stage0-pilot/review/stage0-sheet.png',c.toBuffer('image/png'));
 const f=createCanvas(1200,340),h=f.getContext('2d');h.fillStyle='#f6f2e6';h.fillRect(0,0,f.width,f.height);h.textAlign='center';
 for(let i=0;i<4;i++){const name=['earth','garden','alloy','arcane'][i],im=await loadImage(`assets/tiles/_slab/${name}.png`);h.drawImage(im,0,730,1024,806,i*300+10,15,280,245);h.fillStyle='#285333';h.font='bold 21px sans-serif';h.fillText(name[0].toUpperCase()+name.slice(1),i*300+150,300);}
 fs.writeFileSync('docs/stage0-pilot/review/family-slabs.png',f.toBuffer('image/png'));
})().catch(e=>{console.error(e);process.exit(1)});
