// Rebuild the committed static tiles from checksum-verified external imagegen sources.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=process.env.BRIGHTFIELD_ART_ARCHIVE;
if(!root)throw new Error('Set BRIGHTFIELD_ART_ARCHIVE to the private Leaf archive');
const selected=require('./source-selection.json'),archive=require('./source-archive.json');
const hashes=new Map(archive.files.map(f=>[f.file,f.sha256]));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reports=[];
for(const item of selected){
  const input=path.join(root,item.source),expected=hashes.get(item.source);
  if(!expected||sha(input)!==expected)throw new Error(`Source checksum mismatch: ${item.source}`);
  const fitted=path.join(root,'rebuild',item.key.replace(':','-')+'-fitted.png');
  const args=['tools/art/fit-tile.cjs',input,fitted,'--sides','assets/tiles/_slab/garden.png'];
  if(item.noAlign)args.push('--no-align');
  const fit=JSON.parse(execFileSync(process.execPath,args,{encoding:'utf8'}));
  const file='assets/tiles/'+item.key.split(':').reverse().join('/')+'.png';
  const finish=JSON.parse(execFileSync(process.execPath,['docs/leaf-static/finish-tile.cjs',fitted,file],{encoding:'utf8'}));
  reports.push({key:item.key,source:item.source,file,fit:{scale:fit.scale,dx:fit.dx,dy:fit.dy,clippedPixels:fit.clippedPixels,verdict:fit.verdict},incompleteGroundPixels:finish.incompleteGroundPixels,sharedKerbPixels:finish.sharedKerbPixels,sha256:sha(file)});
}
fs.writeFileSync('docs/leaf-static/qa/composition.json',JSON.stringify(reports,null,2)+'\n');
console.log('Rebuilt',reports.length,'tiles from verified sources.');
