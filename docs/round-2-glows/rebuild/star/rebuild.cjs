#!/usr/bin/env node
'use strict';
// Generated source art is the sole RGB source. This performs only registered
// cropping/compositing and intensity attenuation, never draws replacement art.
// Usage: node rebuild-star.cjs REPOSITORY [ARCHIVE] [OUTPUT_DIRECTORY]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(process.argv[2]), archive=path.resolve(process.argv[3]||__dirname);
const out=path.resolve(process.argv[4]||path.join(repo,'assets/tiles/star'));
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[repo]}));
const S=require(path.join(repo,'tools/art/spec.cjs'));
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'mask-config.json'))),prompts=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json')));
const W=1024,H=1536,N=W*H;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=x=>Math.max(0,Math.min(1,x));
function region(x,y,a){let best=0;for(const [x0,y0,x1,y1,gain]of a||[])if(x>x0&&x<x1&&y>y0&&y<y1)best=Math.max(best,gain*Math.min(1,(x-x0)/4,(x1-x)/4,(y-y0)/4,(y1-y)/4));return best;}
function color(r,g,b,mode){
if(mode==='teal') return clamp((g-r-10)/28)*clamp((b-r+5)/24)*clamp((g-65)/65);
if(mode==='purple') return clamp((b-g-20)/35)*clamp((r-g+5)/28)*clamp((b-130)/60);
return clamp((r-180)/45)*clamp((g-125)/60)*clamp((r-b-30)/55);
}
function blur(a){const b=new Float32Array(N),c=new Float32Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0;for(let d=-2;d<=2;d++)s+=a[y*W+Math.max(0,Math.min(W-1,x+d))]*(3-Math.abs(d));b[y*W+x]=s/9;}for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0;for(let d=-2;d<=2;d++)s+=b[Math.max(0,Math.min(H-1,y+d))*W+x]*(3-Math.abs(d));c[y*W+x]=s/9;}return c;}
async function pixels(p){const im=await loadImage(p);if(im.width!==W||im.height!==H)throw Error(p+' wrong dimensions');const c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(im,0,0);return {im,c,g,d:g.getImageData(0,0,W,H).data};}
(async()=>{
fs.mkdirSync(out,{recursive:true});
const results=[];
for(const [type,C]of Object.entries(cfg)){
const basePath=path.join(repo,'assets/tiles/star',type+'.png'),rawPath=path.join(archive,'raw',type+'.png'),outPath=path.join(out,type+'-glow.png');
const B=await pixels(basePath),R=await pixels(rawPath);
let rawMinAlpha=255,rawMaxAlpha=0;for(let i=3;i<R.d.length;i+=4){rawMinAlpha=Math.min(rawMinAlpha,R.d[i]);rawMaxAlpha=Math.max(rawMaxAlpha,R.d[i]);}
// One generated home window glint was 31 px left of the existing lamp.
// Registered crop translation is limited to that lamp; all other art stays 1:1.
if(type==='home'){const c=createCanvas(W,H),g=c.getContext('2d');g.drawImage(R.im,0,0);g.clearRect(330,707,74,61);g.drawImage(R.im,330,707,56,61,361,707,56,61);R.d=g.getImageData(0,0,W,H).data;}
const m=new Float32Array(N);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
const i=(y*W+x)*4;if(B.d[i+3]<240)continue;
let v=0;for(const mode of ['teal','amber','purple'])v=Math.max(v,region(x+.5,y+.5,C[mode])*color(B.d[i],B.d[i+1],B.d[i+2],mode));
m[y*W+x]=v;
}
const mask=blur(m),cv=createCanvas(W,H),g=cv.getContext('2d'),I=g.createImageData(W,H);let count=0,maxAlpha=0,sumAlpha=0,maxAdd=0,clipped=0,bb=[W,H,0,0];
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
const i=(y*W+x)*4, p=y*W+x;
if(!S.inPoly(S.KEEP,x+.5,y+.5)||B.d[i+3]<240){if(mask[p]>0)clipped++;continue;}
const light=Math.max(R.d[i],R.d[i+1],R.d[i+2]);
if(light<12)continue;
const alpha=Math.round(R.d[i+3]*mask[p]);if(alpha<2)continue;
I.data[i]=R.d[i];I.data[i+1]=R.d[i+1];I.data[i+2]=R.d[i+2];I.data[i+3]=alpha;
count++;maxAlpha=Math.max(maxAlpha,alpha);sumAlpha+=alpha;maxAdd=Math.max(maxAdd,light*alpha/255);bb=[Math.min(bb[0],x),Math.min(bb[1],y),Math.max(bb[2],x),Math.max(bb[3],y)];
}g.putImageData(I,0,0);fs.writeFileSync(outPath,cv.toBuffer('image/png'));
results.push({type,base:'assets/tiles/star/'+type+'.png',source:'raw/'+type+'.png',output:'assets/tiles/star/'+type+'-glow.png',baseSha256:sha(basePath),sourceSha256:sha(rawPath),outputSha256:sha(outPath),prompt:prompts[type],glowPeriod:C.period,dimensions:[W,H],rawAlphaRange:[rawMinAlpha,rawMaxAlpha],nontransparentPixels:count,maxAlpha,meanAlpha:sumAlpha/count,maxAdditiveChannel:Math.round(maxAdd*100)/100,bounds:bb,clippedPixels:clipped});
}
console.log(JSON.stringify(results.map(({prompt,...r})=>r),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
