'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
if(!process.argv[2]||!process.argv[3])throw new Error('Usage: node rebuild.cjs <archive-directory> <output-directory>');
const archive=path.resolve(process.argv[2]);
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const plan=require('./generation-plan.json');
const expected=new Map(require('./normalized-metadata.json').map(s=>[s.name,s]));
const out=path.resolve(process.argv[3]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{fs.mkdirSync(out,{recursive:true});const metadata=[];
for(const s of plan.sources){
 const raw=fs.readFileSync(path.join(archive,s.raw));
 if(sha(raw)!==s.rawSha256)throw new Error(s.name+': raw checksum mismatch');
 const im=await loadImage(path.join(archive,s.raw));
 const c=createCanvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);
 const d=g.getImageData(0,0,c.width,c.height).data;
 let minX=c.width,minY=c.height,maxX=-1,maxY=-1;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>8){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const crop=[Math.max(0,minX-4),Math.max(0,minY-4),Math.min(im.width,maxX+5)-Math.max(0,minX-4),Math.min(im.height,maxY+5)-Math.max(0,minY-4)];
 const ratio=s.bodyWidth/crop[2],h=Math.round(crop[3]*ratio),pad=4,cv=createCanvas(s.bodyWidth+2*pad,h+2*pad),ctx=cv.getContext('2d');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(im,...crop,pad,pad,s.bodyWidth,h);
 const bytes=cv.toBuffer('image/png');
 if(sha(bytes)!==expected.get(s.name).sha256)throw new Error(s.name+': final checksum mismatch');
 fs.writeFileSync(path.join(out,s.name+'.png'),bytes);
 const anchor=[Math.round((s.anchorSource[0]-crop[0])*ratio+pad),Math.round((s.anchorSource[1]-crop[1])*h/crop[3]+pad)];
 metadata.push({name:s.name,raw:s.raw,rawSha256:sha(raw),rawDimensions:[im.width,im.height],crop,draw:[pad,pad,s.bodyWidth,h],dimensions:[cv.width,cv.height],anchor,src:'actors/'+s.name+'.png',sha256:sha(bytes),operation:'Only alpha-guided rectangular crop, uniform resize (integer height rounding), transparent padding. No painting, masks or replacement pixels.'});
}
console.log(JSON.stringify(metadata,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
