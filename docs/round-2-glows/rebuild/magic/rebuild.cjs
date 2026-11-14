#!/usr/bin/env node
'use strict';
// Usage: node rebuild.cjs <archive-directory> <output-directory>
// Requires @napi-rs/canvas 0.1.100 in the current project's node_modules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd(),__dirname]}));
const archive=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'rebuilt');
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'metadata.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function drawShape(g,s){g.beginPath();if(s.ellipse){const[x,y,rx,ry]=s.ellipse;g.ellipse(x,y,rx,ry,0,0,Math.PI*2);}else if(s.rect){g.rect(...s.rect);}else{s.polygon.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}g.fill();}
function hue(r,g,b,f){switch(f){case'amber':return r>140&&g>75&&g>b*1.2&&r>b*1.3;case'violet':return r>85&&b>90&&b>g*1.15;case'blue':return b>r*.95&&g>r*1.1;case'fruit':return(r>g*1.1&&b>g*.85)||(r>g*.95&&g>b*1.1);case'pink':return r>g*1.1&&b>g*.85;default:return true;}}
(async()=>{fs.mkdirSync(out,{recursive:true});const results={};for(const[type,t]of Object.entries(meta.tiles)){
 const rawBytes=fs.readFileSync(path.join(archive,t.raw)),baseBytes=fs.readFileSync(path.join(archive,t.reference));
 if(t.rawSha256&&sha(rawBytes)!==t.rawSha256)throw Error('Raw checksum mismatch '+type);
 if(t.referenceSha256&&sha(baseBytes)!==t.referenceSha256)throw Error('Reference checksum mismatch '+type);
 const raw=await loadImage(path.join(archive,t.raw)),base=await loadImage(path.join(archive,t.reference));if(raw.width!==1024||raw.height!==1536||base.width!==1024||base.height!==1536)throw Error('Wrong source dimensions '+type);
 const cv=createCanvas(1024,1536),g=cv.getContext('2d');g.drawImage(raw,0,0);const im=g.getImageData(0,0,1024,1536),d=im.data;
 const bv=createCanvas(1024,1536),bg=bv.getContext('2d');bg.drawImage(base,0,0);const b=bg.getImageData(0,0,1024,1536).data;
 const allow=new Uint8Array(1024*1536);
 for(const group of t.transform.groups){const m=createCanvas(1024,1536),mg=m.getContext('2d');mg.fillStyle='#fff';for(const s of group.shapes)drawShape(mg,s);const md=mg.getImageData(0,0,1024,1536).data;
 for(let p=0;p<allow.length;p++){const i=p*4;if(md[i+3]&&hue(b[i],b[i+1],b[i+2],group.filter))allow[p]=Math.max(allow[p],md[i+3]);}}
 let visible=0,sumAlpha=0,outsideBase=0;const bounds=[1024,1536,0,0];
 for(let y=0;y<1536;y++)for(let x=0;x<1024;x++){const p=y*1024+x,i=p*4,bottom=1522.5-Math.abs(x-512)*(177.3/480);let a=0;if(x>=32&&x<=992&&y>=24&&y<=bottom)a=Math.round(d[i+3]*t.transform.opacity*allow[p]/255*b[i+3]/255);d[i+3]=a;if(!a){d[i]=d[i+1]=d[i+2]=0;}else{visible++;sumAlpha+=a;if(!b[i+3])outsideBase++;bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}}
 g.putImageData(im,0,0);const bytes=cv.toBuffer('image/png');fs.writeFileSync(path.join(out,t.output),bytes);results[type]={rawSha256:sha(rawBytes),referenceSha256:sha(baseBytes),finalSha256:sha(bytes),visiblePixels:visible,meanAlpha:sumAlpha/visible,bounds,outsideBase,width:1024,height:1536};if(t.finalSha256&&sha(bytes)!==t.finalSha256)throw Error('Final checksum mismatch '+type);}
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
