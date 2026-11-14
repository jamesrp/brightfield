#!/usr/bin/env node
'use strict';
// Run from repo root: node rebuild.cjs <private-source-directory> <output-directory>.
// Metadata is versioned beside this script; raw PNGs stay outside git.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const requireFromRepo=createRequire(path.join(process.cwd(),'package.json'));
const {createCanvas,loadImage}=requireFromRepo('@napi-rs/canvas');
const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'metadata.json'),'utf8'));
if(!process.argv[2]||!process.argv[3]) throw new Error('Supply private source directory and output directory');
const archive=path.resolve(process.argv[2]);
const destination=path.resolve(process.argv[3]);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
fs.mkdirSync(destination,{recursive:true});
for(const s of metadata){
  const raw=fs.readFileSync(path.join(archive,s.name+'.raw.png'));
  if(hash(raw)!==s.rawSha256) throw new Error(s.name+': source checksum mismatch');
  const im=await loadImage(path.join(archive,s.name+'.raw.png')),c=createCanvas(s.w,s.h),g=c.getContext('2d');
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(im,...s.crop,3,3,s.paintW,s.crop[3]*s.paintW/s.crop[2]);
  const b=c.toBuffer('image/png'),sha256=hash(b);
  if(sha256!==s.sha256) throw new Error(s.name+': final checksum mismatch '+sha256);
  const file=path.join(destination,s.name+'.png');fs.writeFileSync(file,b);
  console.log(JSON.stringify({file,sha256,byteIdentical:true}));
}
})().catch(e=>{console.error(e);process.exitCode=1;});
