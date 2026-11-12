#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const archive=process.env.BRIGHTFIELD_ART_ARCHIVE;
if(!archive||!process.argv[2])throw new Error('Set BRIGHTFIELD_ART_ARCHIVE and supply an output directory');
const out=path.resolve(process.argv[2]),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=new Map(require('./source-archive.json').files.map(f=>[f.file,f.sha256]));
const recipes={
  mechanical:require('./rebuild/mechanical/normalization.json').sprites.map(s=>s.source),
  'earth-travellers':require('./rebuild/earth-travellers/generation-plan.json').sources.map(s=>s.raw),
  garden:require('./rebuild/garden/normalization.json').map(s=>s.raw),
  'future-travellers':require('./rebuild/future-travellers/metadata.json').map(s=>s.name+'.raw.png'),
};
for(const [group,names] of Object.entries(recipes)){
  for(const name of new Set(names)){
    const file=group+'/'+name,expected=sources.get(file);
    if(!expected||hash(fs.readFileSync(path.join(archive,file)))!==expected)throw new Error('Source checksum mismatch: '+file);
  }
  execFileSync(process.execPath,[path.join(__dirname,'rebuild',group,'rebuild.cjs'),path.join(archive,group),out],{cwd:ROOT,stdio:'pipe'});
}
const results=require('./final-assets.json').map(s=>{
  const file=path.basename(s.file),actual=hash(fs.readFileSync(path.join(out,file)));
  if(actual!==s.sha256)throw new Error('Rebuild mismatch: '+file);
  if(hash(fs.readFileSync(path.join(ROOT,s.file)))!==s.sha256)throw new Error('Shipped file mismatch: '+s.file);
  return {file:s.file,sha256:actual,byteIdentical:true};
});
console.log(JSON.stringify({passed:true,files:results},null,2));
