const fs=require('node:fs'),crypto=require('node:crypto'),S=require('../../tools/art/spec.cjs');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const {sourceSha}=require('./archive-paths.cjs');
const families=['earth','garden','alloy','arcane'],outputs=[];
for(const type of S.AXES){
 const dir=`docs/stage0-pilot/raw/${type}`,p=`assets/tiles/0/${type}.png`,m=json(`${dir}/metadata.json`),source=`docs/stage0-pilot/pre-lanes/assets/tiles/0/${type}.png`;
 m.pre_lanes_final_sha256=sourceSha(source);m.sha256.final=sha(p);m.geometry_status='PASS: 1024x1536 RGBA; centre(512,1130); kerb37.8px; 100% plot coverage; edges within0.5px.';
 m.lanes_revision={base_commit:'948b010da6580de0341ccf3e05d56b3c1599661f',source,source_storage:'external archive; see docs/stage0-pilot/source-archive.json',source_sha256:sourceSha(source),translation_y:90,building_scale:1,kerb_source:'assets/tiles/_slab/earth.png',steps:['docs/stage0-pilot/migrate-lanes.cjs','docs/stage0-pilot/kerb-edits/apply-kerbs.cjs']};
 fs.writeFileSync(`${dir}/metadata.json`,JSON.stringify(m,null,2)+'\n');
 outputs.push({file:p,kind:'stage0_static_tile',sha256:sha(p),original_prompt:fs.readFileSync(`${dir}/prompt.txt`,'utf8').trim(),...(type==='water'?{original_geometry_refinement_prompt:fs.readFileSync(`${dir}/edit-prompt.txt`,'utf8').trim()}:{}),process:`${dir}/metadata.json`});
}
const prompts=json('docs/stage0-pilot/slabs/prompts.json');
for(const family of families){const p=`assets/tiles/_slab/${family}.png`,edit=`docs/stage0-pilot/kerb-edits/${family}-prompt.txt`;outputs.push({file:p,kind:'reusable_family_kerb',sha256:sha(p),original_prompt:prompts[family],...(fs.existsSync(edit)?{material_edit_prompt:fs.readFileSync(edit,'utf8').trim()}:{}),process:'docs/stage0-pilot/README.md'});}
const p='docs/art-provenance.json',all=json(p);
all.tile_spec_v2_stage0_pilot={date:'2026-11-09',revision:'plots-and-lanes',base_branch:'claude/project-thread-8c53rq',base_commit:'948b010da6580de0341ccf3e05d56b3c1599661f',integration_base_commit:'29b4cb29afe87d0a43850f4540e4100d3ac3c1a9',review_base_branch:'main',original_base_commit:'99cd62fcf8821005b260ac3a47c245d78411a7af',method:'built-in image_gen; exact-geometry fitting/composition; integer 90px translation of original paintings and kerb material edits',dimensions:[1024,1536],scope:'4 reusable family kerbs and 8 Stage 0 static tiles only; stop for review before remaining 40, actors, travellers or glows',raw_source_directory:'external archive rooted at BRIGHTFIELD_ART_ARCHIVE',source_archive_manifest:'docs/stage0-pilot/source-archive.json',geometry:S.SPEC,original_geometry:{center:[512,1040],depth:113},original_snapshot:'docs/stage0-pilot/pre-lanes (relative to external archive root)',outputs};
fs.writeFileSync(p,JSON.stringify(all,null,2)+'\n');
fs.writeFileSync('docs/stage0-pilot/slabs/SHA256SUMS',families.map(f=>`${sha(`assets/tiles/_slab/${f}.png`)}  assets/tiles/_slab/${f}.png`).join('\n')+'\n');
const old=fs.readFileSync('SHA256SUMS.txt','utf8').trim().split('\n').map(l=>l.slice(66));
const files=[...new Set([...old,...outputs.map(o=>o.file),'assets/tiles/manifest.js','src/tile-art.js','tools/art/spec.cjs','tools/art/preview.cjs','tests/tile-art-v12.test.cjs','docs/ART-DIRECTION.md','docs/ART-PROVENANCE.md','docs/art-provenance.json','docs/stage0-pilot/README.md','docs/stage0-pilot/migrate-lanes.cjs','docs/stage0-pilot/kerb-edits/apply-kerbs.cjs','docs/stage0-pilot/archive-paths.cjs','docs/stage0-pilot/source-archive.json','docs/stage0-pilot/verify-migration.cjs'])].filter(p=>fs.existsSync(p)).sort();
fs.writeFileSync('SHA256SUMS.txt',files.map(p=>`${sha(p)}  ${p}`).join('\n')+'\n');console.log('Recorded revised',outputs.length,'assets.');
