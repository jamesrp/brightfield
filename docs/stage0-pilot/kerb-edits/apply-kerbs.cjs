// Composite only imagegen-painted kerb materials onto the exact migrated plots.
// Preserve original top/structure pixels; reuse the canonical earth kerb verbatim.
const fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const S=require('../../../tools/art/spec.cjs'),W=1024,H=1536;
const {archiveFile}=require('../archive-paths.cjs');
async function read(p){const im=await loadImage(p),c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(im,0,0);return {c,g,id:g.getImageData(0,0,W,H)};}
const inSide=(x,y)=>x>=32&&x<992&&y+.5>S.frontEdgeY(x+.5)&&y+.5<=S.bottomY(x+.5);
(async()=>{
 const reports=[];
 for(const family of ['earth','garden']){
  const prefix=`docs/stage0-pilot/kerb-edits/${family}`,a=await read(archiveFile(prefix+'-before.png')),b=await read(archiveFile(prefix+'-fitted.png')),d=a.id.data,p=b.id.data;let resampled=0;
  for(let y=0;y<H;y++)for(let x=32;x<992;x++)if(inSide(x,y)){
   const i=(y*W+x)*4;let j=i;
   if(p[j+3]<200){let best=Infinity;for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){const xx=x+dx,yy=y+dy,k=(yy*W+xx)*4,dist=dx*dx+dy*dy;if(xx>=32&&xx<992&&yy>=0&&yy<H&&p[k+3]>=200&&dist<best&&inSide(xx,yy)){best=dist;j=k;}}if(!Number.isFinite(best))throw new Error(`No painted material near ${family} ${x},${y}`);resampled++;}
   for(let k=0;k<3;k++)d[i+k]=p[j+k];d[i+3]=255;
  }
  a.g.putImageData(a.id,0,0);fs.writeFileSync(`assets/tiles/_slab/${family}.png`,a.c.toBuffer('image/png'));reports.push({family,material_source:prefix+'-generated.png',top_face:'unchanged from migrated original',transparent_boundary_samples_replaced_from_nearest_painted_kerb:resampled});
 }
 const earth=(await read('assets/tiles/_slab/earth.png')).id.data;
 for(const type of S.AXES){const out=`assets/tiles/0/${type}.png`,a=await read(out),d=a.id.data;for(let y=0;y<H;y++)for(let x=32;x<992;x++)if(inSide(x,y)){const i=(y*W+x)*4;for(let k=0;k<4;k++)d[i+k]=earth[i+k];}a.g.putImageData(a.id,0,0);fs.writeFileSync(out,a.c.toBuffer('image/png'));}
 fs.writeFileSync('docs/stage0-pilot/kerb-edits/composition.json',JSON.stringify(reports,null,2)+'\n');console.log(reports);
})().catch(e=>{console.error(e);process.exit(1)});
