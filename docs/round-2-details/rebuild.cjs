#!/usr/bin/env node
'use strict';
// Portable deterministic reconstruction. Raw bytes are always read beneath argv[2].
// Usage: node rebuild.cjs <archive-directory> <output-directory>
// Install @napi-rs/canvas 0.1.100 in the script/current/output project when needed.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const archive=path.resolve(process.argv[2] || __dirname), output=path.resolve(process.argv[3] || '.');
const search=[__dirname,process.cwd()]; for(let p=output;;p=path.dirname(p)){search.push(p);if(p===path.dirname(p))break;}
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:search}));
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'metadata.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected=new Map(require('./final-hashes.json').map(x=>[x.name,x.sha256]));
(async()=>{fs.mkdirSync(output,{recursive:true});const results=[];
for(const a of meta.assets){
 const raw=fs.readFileSync(path.join(archive,a.raw));if(sha(raw)!==a.rawSHA256)throw new Error(a.name+': raw checksum mismatch');
 const img=await loadImage(path.join(archive,a.raw)),[w,h]=a.paintSize,p=a.padding,cv=createCanvas(w+2*p,h+2*p),g=cv.getContext('2d');
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(img,...a.crop,p,p,w,h);
 const png=cv.toBuffer('image/png');if(sha(png)!==expected.get(a.name))throw new Error(a.name+': final checksum mismatch');fs.writeFileSync(path.join(output,a.name+'.png'),png);
 results.push({name:a.name,width:cv.width,height:cv.height,sha256:sha(png),rawSHA256:a.rawSHA256});
}
console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
