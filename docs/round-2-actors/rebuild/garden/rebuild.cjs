'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let canvas;try {canvas=require('@napi-rs/canvas');}catch(e){canvas=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd()]}));}
const {createCanvas,loadImage}=canvas;
const archive=path.resolve(process.argv[2]||__dirname),out=path.resolve(process.argv[3]||path.join(archive,'rebuilt'));
const specs=[
{name:'sun-mirror',source:'sun-mirror-raw.png',crop:[266,118,996,781],width:136,padding:4,anchor:[72,57]},
{name:'garden-tram',source:'garden-tram-fixed-raw.png',crop:[291,1,949,969],width:180,padding:4,anchor:[116,163]},
{name:'garden-bike',source:'garden-bike-raw.png',crop:[312,3,916,1013],width:156,padding:4,anchor:[82,168]}
];
(async()=>{fs.mkdirSync(out,{recursive:true});const report=[];
for(const s of specs){const raw=fs.readFileSync(path.join(archive,s.source));const im=await loadImage(path.join(archive,s.source)),h=Math.round(s.crop[3]*s.width/s.crop[2]),c=createCanvas(s.width+s.padding*2,h+s.padding*2),g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,...s.crop,s.padding,s.padding,s.width,h);const bytes=c.toBuffer('image/png');fs.writeFileSync(path.join(out,s.name+'.png'),bytes);report.push({...s,file:s.name+'.png',draw:[s.padding,s.padding,s.width,h],raw:s.source,rawSha256:crypto.createHash('sha256').update(raw).digest('hex'),dimensions:[c.width,c.height],source_sha256:crypto.createHash('sha256').update(raw).digest('hex'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),method:'Crop source rectangle without rotation; uniformly resize with canvas high smoothing; add 4px transparent padding. No pixel recoloring, painted geometry or alpha masking.'});}console.log(JSON.stringify(report,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
