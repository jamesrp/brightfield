'use strict';
// Run from the repository (with installed @napi-rs/canvas 0.1.100):
// node rebuild.cjs <archive-directory> <output-directory>
// normalization.json is adjacent to this script. Output directory receives PNGs.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const {createCanvas,loadImage}=createRequire(path.resolve(process.cwd(),'package.json'))('@napi-rs/canvas');
const archive=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||'');
if(process.argv.length!==4)throw new Error('Usage: node rebuild.cjs <archive-directory> <output-directory>');
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'normalization.json'),'utf8'));
(async()=>{fs.mkdirSync(out,{recursive:true});for(const s of spec.sprites){
 const im=await loadImage(path.join(archive,s.source)),c=createCanvas(s.width,s.height),g=c.getContext('2d');
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.translate(...s.anchor);
 if(s.rotation)g.rotate(s.rotation);
 g.drawImage(im,-s.sourcePivot[0]*s.scale,-s.sourcePivot[1]*s.scale,im.width*s.scale,im.height*s.scale);
 fs.writeFileSync(path.join(out,s.name+'.png'),c.toBuffer('image/png'));
 console.log(s.name+'.png '+s.width+'x'+s.height);
}})().catch(e=>{console.error(e);process.exitCode=1;});
