// Raw and intermediate artwork is deliberately stored outside the game repo.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const manifest=require('./source-archive.json');
const records=new Map(manifest.files.map(entry=>[entry.path,entry]));
function sourceSha(relative){
  const record=records.get(relative);
  if(!record)throw new Error(`No archived source record for ${relative}`);
  return record.sha256;
}
function archiveFile(relative){
  const root=process.env.BRIGHTFIELD_ART_ARCHIVE;
  if(!root)throw new Error('Set BRIGHTFIELD_ART_ARCHIVE to the external Stage 0 source archive root. See docs/stage0-pilot/README.md.');
  const file=path.resolve(root,relative);
  if(!fs.existsSync(file))throw new Error(`Archived source is missing: ${relative}`);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(actual!==sourceSha(relative))throw new Error(`Archived source checksum mismatch: ${relative}`);
  return file;
}
module.exports={archiveFile,sourceSha};
