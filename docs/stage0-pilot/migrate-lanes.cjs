// Reframe the existing approved pilot for the revised plots-and-lanes geometry.
// Buildings and ground receive only an integer 90px vertical translation.
// Each painted family side is vertically resampled from 113px to the new kerb.
// Original final art is preserved in the external source archive.
const fs=require('node:fs'),{archiveFile}=require('./archive-paths.cjs');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const S=require('../../tools/art/spec.cjs'),W=1024,H=1536,OLD_CY=1040,OLD_D=113,DY=S.SPEC.cy-OLD_CY;
const ROOT='docs/stage0-pilot/pre-lanes/assets/tiles';
async function data(file){const im=await loadImage(file),c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,W,H).data;}
async function migrate(src,out){
 const p=await data(src),c=createCanvas(W,H),g=c.getContext('2d'),id=g.createImageData(W,H),d=id.data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const xc=x+.5,yc=y+.5,front=S.frontEdgeY(xc),i=(y*W+x)*4;
  if(xc<32||xc>992||yc>S.bottomY(xc))continue;
  if(yc<=front){const sy=y-DY;if(sy<0||sy>=H)continue;const j=(sy*W+x)*4;for(let k=0;k<4;k++)d[i+k]=p[j+k];}
  else {const oldFront=front-DY,sy=oldFront+(yc-front)*OLD_D/S.SPEC.depth-.5,lo=Math.max(0,Math.min(H-1,Math.floor(sy))),hi=Math.min(H-1,lo+1),f=sy-lo;for(let k=0;k<4;k++)d[i+k]=Math.round(p[(lo*W+x)*4+k]*(1-f)+p[(hi*W+x)*4+k]*f);}
 }
 g.putImageData(id,0,0);fs.writeFileSync(out,c.toBuffer('image/png'));
}
(async()=>{
 for(const family of ['earth','garden','alloy','arcane'])await migrate(archiveFile(`${ROOT}/_slab/${family}.png`),`assets/tiles/_slab/${family}.png`);
 const earth=await data('assets/tiles/_slab/earth.png');
 for(const type of S.AXES){
  const out=`assets/tiles/0/${type}.png`;await migrate(archiveFile(`${ROOT}/0/${type}.png`),out);
  const im=await loadImage(out),c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(im,0,0);const id=g.getImageData(0,0,W,H),d=id.data;
  // Authoritative family side pixels, not source-over blending.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(y+.5>S.frontEdgeY(x+.5)&&S.inPoly(S.SILHOUETTE,x+.5,y+.5)){const i=(y*W+x)*4;for(let k=0;k<4;k++)d[i+k]=earth[i+k];}
  g.putImageData(id,0,0);fs.writeFileSync(out,c.toBuffer('image/png'));
 }
 console.log(JSON.stringify({from:{cy:OLD_CY,depth:OLD_D},to:S.SPEC,vertical_translation:DY,building_scale:1,method:'integer top-face translation; per-column painted-side resampling; shared family pixels copied'}));
})().catch(e=>{console.error(e);process.exit(1)});
