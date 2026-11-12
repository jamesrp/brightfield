// Map generated painted planar surfaces to the exact spec; no procedural art.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('fs');
const S=require('../../../tools/art/spec.cjs');
(async()=>{
  for(const [name,back,front,frontEdge,bottom,bottomEdge] of [
    ['alloy',688,1360,1177,1509,1329],
    ['arcane',687,1401,1218,1511,1332]
  ]) {
    const im=await loadImage(`docs/stage0-pilot/slabs/${name}-normalized.png`);
    const c=createCanvas(1024,1536),g=c.getContext('2d');g.drawImage(im,0,0);
    const src=g.getImageData(0,0,1024,1536),dst=g.createImageData(1024,1536);
    for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){
      if(!S.inPoly(S.SILHOUETTE,x+.5,y+.5))continue;
      const u=Math.abs(x+.5-512)/480;
      const tb=S.backEdgeY(x+.5),tf=S.frontEdgeY(x+.5);
      const sb=back+177.35*u,sf=front+(frontEdge-front)*u,sd=bottom+(bottomEdge-bottom)*u;
      const sy=y+.5<=tf?sb+(y+.5-tb)/(tf-tb)*(sf-sb):sf+(y+.5-tf)/113*(sd-sf);
      const ix=Math.max(33,Math.min(990,x)),iy=Math.max(0,Math.min(1535,Math.round(sy)));
      const a=(y*1024+x)*4,b=(iy*1024+ix)*4;
      for(let k=0;k<3;k++)dst.data[a+k]=src.data[b+k];dst.data[a+3]=255;
    }
    g.putImageData(dst,0,0);fs.writeFileSync(`docs/stage0-pilot/slabs/${name}-composed.png`,c.toBuffer('image/png'));
  }
})();
