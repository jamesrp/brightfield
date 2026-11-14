#!/usr/bin/env node
'use strict';
// Deterministic extraction/registration of imagegen-painted warm light.
// No procedural replacement artwork: RGB always comes from the corresponding raw PNG.
// Usage: node rebuild-homes.cjs --repo PATH --archive PATH/homes --output PATH
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { createRequire } = require('node:module');
const args = process.argv.slice(2), opt={};
for(let i=0;i<args.length;i+=2)opt[args[i].replace(/^--/,'')]=path.resolve(args[i+1]);
for(const k of ['repo','archive','output']) if(!opt[k]) throw new Error('Required --'+k);
const {createCanvas,loadImage}=createRequire(path.join(opt.repo,'package.json'))('@napi-rs/canvas');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json')));
const prompts=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json')));
const [W,H]=config.canvas, hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const canvas=()=>createCanvas(W,H);
const pixels=im=>{const c=canvas();c.getContext('2d').drawImage(im,0,0);return c.getContext('2d').getImageData(0,0,W,H).data;};
function stats(d){let nonzero=0,maxAlpha=0,sum=0,minX=W,minY=H,maxX=-1,maxY=-1,offKeep=0;
for(let p=0;p<W*H;p++){const a=d[p*4+3];if(!a)continue;const x=p%W,y=Math.floor(p/W);nonzero++;sum+=a;maxAlpha=Math.max(maxAlpha,a);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x<32||x>992||y<24||y>1522.5-Math.abs(x-512)*177.3/480)offKeep++;}
return {nonzero,maxAlpha,meanNonzeroAlpha:sum/(nonzero||1),bbox:nonzero?[minX,minY,maxX,maxY]:null,offKeep};}
const results=[];
(async()=>{fs.mkdirSync(path.join(opt.output,'qa'),{recursive:true});
for(const [stage,cfg]of Object.entries(config.stages)){
 const baseFile=path.join(opt.repo,'assets/tiles',stage,'home.png'),rawFile=path.join(opt.archive,'raw','home-'+stage+'-imagegen.png');
 const baseBuf=fs.readFileSync(baseFile),rawBuf=fs.readFileSync(rawFile);
 if(hash(baseBuf)!==cfg.baseSha256)throw new Error('Base checksum changed: '+stage);
 if(hash(rawBuf)!==cfg.rawSha256)throw new Error('Raw checksum changed: '+stage);
 const base=await loadImage(baseFile),raw=await loadImage(rawFile);
 if([base.width,base.height,raw.width,raw.height].join(',')!==[W,H,W,H].join(','))throw new Error('Unexpected dimensions');
 const bd=pixels(base),rd=pixels(raw),out=canvas(),g=out.getContext('2d'),im=g.createImageData(W,H),od=im.data;
 const regionReports=[];
 for(const reg of cfg.regions){
  const registered=canvas(),rg=registered.getContext('2d');rg.imageSmoothingEnabled=true;rg.imageSmoothingQuality='high';
  const [sx0,sy0,sx1,sy1]=reg.source,[tx0,ty0,tx1,ty1]=reg.target;
  rg.drawImage(raw,sx0,sy0,sx1-sx0,sy1-sy0,tx0,ty0,tx1-tx0,ty1-ty0);
  const data=rg.getImageData(0,0,W,H).data,mask=canvas(),mg=mask.getContext('2d');
  mg.fillStyle='#ffffff';mg.beginPath();reg.polygon.forEach(([x,y],i)=>i?mg.lineTo(x,y):mg.moveTo(x,y));mg.closePath();mg.fill();
  const md=mg.getImageData(0,0,W,H).data;
  let kept=0;
  for(let y=Math.max(24,Math.floor(ty0));y<Math.min(H,Math.ceil(ty1));y++)for(let x=Math.max(32,Math.floor(tx0));x<Math.min(993,Math.ceil(tx1));x++){
   const i=(y*W+x)*4;if(!md[i+3]||!bd[i+3]||!data[i+3])continue;
   const br=bd[i],bg=bd[i+1],bb=bd[i+2];
   const selection=reg.kind==='lantern'?1:smooth(165,220,br)*smooth(105,170,bg)*smooth(8,38,br-bg)*(1-smooth(.72,.98,bb/Math.max(1,bg)));
   let a=Math.round(data[i+3]*(reg.alpha??cfg.alpha)*(md[i+3]/255)*selection*(bd[i+3]/255));
   // Attenuate only alpha so pre-existing lamp highlights do not become white panels.
   a=Math.min(a,Math.floor(Math.max(0,235-bb)*255/Math.max(1,data[i+2])));
   if(!a||a<=od[i+3])continue;
   od[i]=data[i];od[i+1]=data[i+1];od[i+2]=data[i+2];od[i+3]=a;kept++;
  }
  regionReports.push({name:reg.name,sourceBox:reg.source,targetBox:reg.target,paintedEmitterPolygon:reg.polygon,kind:reg.kind||'window',alphaMultiplier:reg.alpha??cfg.alpha,keptPixels:kept});
 }
 g.putImageData(im,0,0);const finalBuf=out.toBuffer('image/png'),dest=path.join(opt.output,'assets/tiles',stage,'home-glow.png');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,finalBuf);
 const render=(alpha,alone=false)=>{const c=canvas(),cg=c.getContext('2d');cg.fillStyle='#142125';cg.fillRect(0,0,W,H);if(!alone)cg.drawImage(base,0,0);if(alpha){cg.globalCompositeOperation='lighter';cg.globalAlpha=alpha;cg.drawImage(out,0,0);}return c;};
 const labels=['STATIC BASE','DAY MINIMUM: 35% LIGHTER','FULL NIGHT: 100% LIGHTER','GLOW ALONE: ACTUAL ALPHA'];
 const panels=[render(0),render(.35),render(1),render(1,true)];
 const strip=createCanvas(2048,800),sg=strip.getContext('2d');sg.fillStyle='#142125';sg.fillRect(0,0,2048,800);sg.fillStyle='#ffffff';sg.font='15px sans-serif';
 panels.forEach((c,i)=>{sg.fillText(labels[i],i*512+12,22);sg.drawImage(c,i*512,32,512,768);});
 fs.writeFileSync(path.join(opt.output,'qa','home-'+stage+'-strip.png'),strip.toBuffer('image/png'));
 for(let i=0;i<panels.length;i++)fs.writeFileSync(path.join(opt.output,'qa','home-'+stage+'-'+['base','day-min','night-full','glow-alone'][i]+'.png'),panels[i].toBuffer('image/png'));
 const night=panels[2].getContext('2d').getImageData(0,0,W,H).data;
 let newWhite=0,changed=0,maxDelta=0;
 for(let p=0;p<W*H;p++){const i=p*4;if(!od[i+3])continue;changed++;if(night[i]>=250&&night[i+1]>=250&&night[i+2]>=250&&!(bd[i]>=250&&bd[i+1]>=250&&bd[i+2]>=250))newWhite++;maxDelta=Math.max(maxDelta,night[i]-bd[i],night[i+1]-bd[i+1],night[i+2]-bd[i+2]);}
 const result={tile:'home:'+stage,final:'assets/tiles/'+stage+'/home-glow.png',manifest:{glow:stage+'/home-glow.png',glowPeriod:cfg.glowPeriod},sourceBase:'assets/tiles/'+stage+'/home.png',sourceBaseSha256:cfg.baseSha256,raw:'raw/home-'+stage+'-imagegen.png',rawSha256:cfg.rawSha256,finalSha256:hash(finalBuf),rawDimensions:[raw.width,raw.height],outputDimensions:[W,H],rawStats:stats(rd),finalStats:stats(od),additiveQA:{formula:'Canvas globalCompositeOperation=lighter; globalAlpha=0.35 or 1.0; base unmodified as in src/tile-art.js',changedPixels:changed,newWhitePixels:newWhite,maxAddedChannel:maxDelta},normalization:{globalTransform:'identity; no resizing or cropping of the tile canvas',method:config.normalization,whiteProtection:'Alpha additionally capped by max(0,235-baseBlue)*255/rawBlue; generated RGB unchanged',windowSelection:'smoothstep(165,220,R) * smoothstep(105,170,G) * smoothstep(8,38,R-G) * (1-smoothstep(.72,.98,B/G)); derived only from existing painted glass',regions:regionReports},prompt:prompts[stage],generator:config.tool};
 results.push(result);
 if(result.finalStats.offKeep||newWhite)throw new Error('QA failed '+stage+' '+JSON.stringify({stats:result.finalStats,qa:result.additiveQA}));
 console.log(JSON.stringify({tile:result.tile,hash:result.finalSha256,stats:result.finalStats,qa:result.additiveQA}));
}
fs.writeFileSync(path.join(opt.output,'provenance.json'),JSON.stringify({schema:1,generated:config.generated,results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
