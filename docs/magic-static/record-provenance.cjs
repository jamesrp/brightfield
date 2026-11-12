'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.BRIGHTFIELD_ART_ARCHIVE;
if(!root)throw new Error('Set BRIGHTFIELD_ART_ARCHIVE to the private Magic archive');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const selected=require('./source-selection.json');
const files=fs.readdirSync(root).filter(f=>/^magic-.*\.(png|prompt\.txt)$/.test(f)).sort();
fs.writeFileSync('docs/magic-static/source-archive.json',JSON.stringify({date:'2026-11-12',storage:'External private archive; set BRIGHTFIELD_ART_ARCHIVE to rebuild. Raw images and intermediates are not committed.',files:files.map(file=>({file,bytes:fs.statSync(path.join(root,file)).size,sha256:sha(path.join(root,file))}))},null,2)+'\n');
const p='docs/art-provenance.json',all=JSON.parse(fs.readFileSync(p,'utf8'));
all.tile_spec_v2_magic={date:'2026-11-12',issue:'https://github.com/jamesrp/brightfield/issues/2#issuecomment-6815889758',base_commit:'d201c7789b18c863377bd0addff628c0db723837',base_branch:'main',method:'built-in image_gen per-tile generation and targeted edits; art:fit; painted arcane-family underlay for small incomplete ground edges; exact shared kerb pixels',dimensions:[1024,1536],scope:'8 static Magic tiles; no actors, glows, Paragons or gameplay changes',source_archive_manifest:'docs/magic-static/source-archive.json',shared_kerb:{file:'assets/tiles/_slab/arcane.png',sha256:sha('assets/tiles/_slab/arcane.png')},outputs:selected.map(item=>{
  const [type,stage]=item.key.split(':'),file=`assets/tiles/${stage}/${type}.png`,prefix=`${stage}-${type}`;
  return {key:item.key,file,sha256:sha(file),source:item.source,source_sha256:sha(path.join(root,item.source)),noAlign:!!item.noAlign,prompts:files.filter(f=>f.endsWith('.prompt.txt')&&(f===prefix+'.prompt.txt'||f.startsWith(prefix+'-'))).map(file=>({file,prompt:fs.readFileSync(path.join(root,file),'utf8').trim()})),process:'docs/magic-static/rebuild.cjs'};
})};
fs.writeFileSync(p,JSON.stringify(all,null,2)+'\n');
console.log('Recorded',selected.length,'final tiles and',files.length,'archived sources.');
