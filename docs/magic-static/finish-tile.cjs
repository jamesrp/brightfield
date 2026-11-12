// Complete tiny transparent plot-edge gaps with the approved painted arcane-family slab.
// No procedural texture or architecture: the sources remain the generated tile and shared slab.
// Usage: node docs/stages-1-2/finish-tile.cjs fitted.png final.png
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const S=require('../../tools/art/spec.cjs');
(async()=>{
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw new Error('Expected fitted input and final output');
  const tile=await loadImage(input),slab=await loadImage('assets/tiles/_slab/arcane.png');
  if(tile.width!==1024||tile.height!==1536)throw new Error('Run art:fit first');
  const c=createCanvas(1024,1536),g=c.getContext('2d');
  g.drawImage(tile,0,0);const before=g.getImageData(0,0,1024,1536);
  let missing=0,semi=0;
  for(let y=0;y<1536;y++)for(let x=0;x<1024;x++)if(S.inPoly(S.FACE,x+.5,y+.5)){
    const a=before.data[(y*1024+x)*4+3];if(a<200)missing++;if(a<255)semi++;
  }
  if(missing>6000)throw new Error(`${missing} incomplete ground pixels: regenerate instead of filling`);
  g.clearRect(0,0,1024,1536);
  g.save();S.path(g,S.FACE);g.clip();g.drawImage(slab,0,0);g.restore();
  g.drawImage(tile,0,0);
  const after=g.getImageData(0,0,1024,1536),s=createCanvas(1024,1536),sg=s.getContext('2d');sg.drawImage(slab,0,0);const sd=sg.getImageData(0,0,1024,1536).data;
  let sidePixels=0;
  for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){
    const i=(y*1024+x)*4;
    if(before.data[i+3]>=200)for(let k=0;k<4;k++)after.data[i+k]=before.data[i+k];
    if(!S.inPoly(S.KEEP,x+.5,y+.5)){for(let k=0;k<4;k++)after.data[i+k]=0;}
    else if(y+.5>S.frontEdgeY(x+.5)&&y+.5<=S.bottomY(x+.5)){
      for(let k=0;k<4;k++)after.data[i+k]=sd[i+k];sidePixels++;
    }
  }
  g.putImageData(after,0,0);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,c.toBuffer('image/png'));
  console.log(JSON.stringify({input,output,incompleteGroundPixels:missing,groundPixelsBelowFullOpacity:semi,sharedKerbPixels:sidePixels,method:'painted arcane-family underlay only where ground alpha <200; other tile pixels preserved; exact shared kerb pixels'}));
})().catch(e=>{console.error(e);process.exit(1)});
