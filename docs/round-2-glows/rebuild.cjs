#!/usr/bin/env node
'use strict';
// Usage: node docs/round-2-glows/rebuild.cjs PRIVATE_ARCHIVE OUTPUT_DIRECTORY
// Input PNGs remain private. Output is a separate verification tree, never the repo.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
if(!process.argv[2]||!process.argv[3])throw Error('Provide PRIVATE_ARCHIVE and OUTPUT_DIRECTORY');
const archive=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
if(out===root||out.startsWith(root+path.sep))throw Error('Use an output directory outside the repository');
const inventory=JSON.parse(fs.readFileSync(path.join(__dirname,'final-assets.json')));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function verify(file,want){if(hash(file)!==want)throw Error('Checksum mismatch: '+file);}
for(const t of inventory){
 verify(path.join(root,t.base),t.baseSha256);
 verify(path.join(archive,t.group,t.raw),t.rawSha256);
 if(t.reference)verify(path.join(archive,t.group,t.reference),t.baseSha256);
}
fs.mkdirSync(out,{recursive:true});
function run(script,args){execFileSync(process.execPath,[path.join(__dirname,'rebuild',script),...args],{cwd:root,stdio:['ignore','pipe','inherit']});}
run('star/rebuild.cjs',[root,path.join(archive,'star'),path.join(out,'assets/tiles/star')]);
run('magic/rebuild.cjs',[path.join(archive,'magic'),path.join(out,'assets/tiles/magic')]);
run('homes/rebuild-homes.cjs',['--repo',root,'--archive',path.join(archive,'homes'),'--output',out]);
const results=inventory.map(t=>{
 verify(path.join(out,t.output),t.sha256); verify(path.join(root,t.output),t.sha256);
 return {key:t.key,output:t.output,sha256:t.sha256,byteIdentical:true};
});
console.log(JSON.stringify({count:results.length,ok:true,results},null,2));
