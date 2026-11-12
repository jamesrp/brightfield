const fs=require('node:fs'),{createCanvas,loadImage}=require('@napi-rs/canvas'),S=require('../../tools/art/spec.cjs');
const {archiveFile}=require('./archive-paths.cjs');
const W=1024,H=1536;
async function read(p){const im=await loadImage(p),c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,W,H).data;}
(async()=>{
 const files=[...S.AXES.map(a=>`0/${a}.png`),...['earth','garden','alloy','arcane'].map(a=>`_slab/${a}.png`)],reports=[];
 const earth=await read('assets/tiles/_slab/earth.png');
 for(const f of files){const before=await read(archiveFile('docs/stage0-pilot/pre-lanes/assets/tiles/'+f)),after=await read('assets/tiles/'+f);let topDifferences=0,sideDifferences=0,outside=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(after[i+3]>16&&!S.inPoly(S.KEEP,x+.5,y+.5))outside++;
   if(x>=32&&x<992&&y>=90&&y+.5<=S.frontEdgeY(x+.5)){const j=((y-90)*W+x)*4;for(let k=0;k<4;k++)if(after[i+k]!==before[j+k])topDifferences++;}
   if(f.startsWith('0/')&&x>=32&&x<992&&y+.5>S.frontEdgeY(x+.5)&&y+.5<=S.bottomY(x+.5))for(let k=0;k<4;k++)if(after[i+k]!==earth[i+k])sideDifferences++;
  }
  reports.push({file:f,topRGBAChanges:topDifferences,kerbRGBAChangesVsEarth:sideDifferences,outsideAlphaPixels:outside});
  if(topDifferences||sideDifferences||outside)throw new Error(JSON.stringify(reports.at(-1)));
 }
 console.log(JSON.stringify({status:'PASS',translation_y:90,building_scale:1,files:reports},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
