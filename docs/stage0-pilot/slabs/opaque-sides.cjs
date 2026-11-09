// A reusable painted side must be opaque before compositing it over other art.
// Preserve antialiased perimeter; make only side-face interior fully opaque.
const fs=require('node:fs'), {createCanvas,loadImage}=require('@napi-rs/canvas');
const S=require('../../../tools/art/spec.cjs');
(async()=>{
 for(const name of ['earth','garden','alloy','arcane']){
  const p=`assets/tiles/_slab/${name}.png`, source=`docs/stage0-pilot/slabs/${name}-before-opaque-sides.png`;
  if(!fs.existsSync(source))fs.copyFileSync(p,source);
  const im=await loadImage(source),c=createCanvas(1024,1536),g=c.getContext('2d');g.drawImage(im,0,0);
  const id=g.getImageData(0,0,1024,1536),d=id.data;let changed=0;
  for(let y=0;y<1536;y++)for(let x=33;x<991;x++){
   if(y>S.frontEdgeY(x)+1&&y<S.bottomY(x)-1){const a=(y*1024+x)*4+3;if(d[a]!==255){d[a]=255;changed++;}}
  }
  g.putImageData(id,0,0);fs.writeFileSync(p,c.toBuffer('image/png'));console.log(name,changed);
 }
})().catch(e=>{console.error(e);process.exit(1)});
