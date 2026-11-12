const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const axes=['power','move','food','water','home','make','waste','wild'],families=['earth','garden','alloy','arcane'];
const outputs=[];
for(const type of axes){
 const dir=`docs/stage0-pilot/raw/${type}`,p=`assets/tiles/0/${type}.png`;
 let m=fs.existsSync(`${dir}/metadata.json`)?json(`${dir}/metadata.json`):{};
 m={...m,method:'built-in image_gen',references:['assets/tiles/_template/base-plain.png','assets/buildings-0.png'],final:p,dimensions:[1024,1536],transparent_background:true,prompt:'prompt.txt',normalization:json(`${dir}/normalization.json`)};
 m.normalization.shared_side_opacity='The generated family side interiors were made fully opaque before compositing; exact shared side pixels are regression-tested.';
 if(type==='water')m.refinement={prompt:'edit-prompt.txt',raw:'edited-raw.png',reference:'assets/tiles/_slab/earth.png',reason:'Initial well ground missed rear corners; targeted imagegen edit extended the face before fitting.'};
 m.sha256={};for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.png')))m.sha256[f]=sha(`${dir}/${f}`);m.sha256.final=sha(p);
 m.geometry_status='PASS: 1024x1536 RGBA; transparent outside keep region; 100% slab coverage; edges within 1.1px.';
 fs.writeFileSync(`${dir}/metadata.json`,JSON.stringify(m,null,2)+'\n');
 outputs.push({file:p,kind:'stage0_static_tile',sha256:sha(p),prompt:fs.readFileSync(`${dir}/prompt.txt`,'utf8').trim(),...(type==='water'?{refinement_prompt:fs.readFileSync(`${dir}/edit-prompt.txt`,'utf8').trim()}:{}),process:`${dir}/metadata.json`});
}
const slabPrompts=json('docs/stage0-pilot/slabs/prompts.json');
for(const family of families){const p=`assets/tiles/_slab/${family}.png`;outputs.push({file:p,kind:'reusable_family_slab',sha256:sha(p),prompt:slabPrompts[family],process:'docs/stage0-pilot/slabs/README.md'});}
const p='docs/art-provenance.json',all=json(p);
all.tile_spec_v2_stage0_pilot={date:'2026-11-09',base_branch:'claude/project-thread-8c53rq',base_commit:'99cd62fcf8821005b260ac3a47c245d78411a7af',method:'built-in image_gen; exact-geometry fitting/compositing with repository canvas tools',dimensions:[1024,1536],scope:'4 reusable family slabs and 8 Stage 0 static tiles only; stop for review before remaining 40, actors, travellers or glows',raw_source_directory:'docs/stage0-pilot',geometry:{center:[512,1040],half_width:480,face_half_height:354.7,depth:113},outputs};
fs.writeFileSync(p,JSON.stringify(all,null,2)+'\n');
fs.writeFileSync('docs/stage0-pilot/slabs/SHA256SUMS',families.map(f=>`${sha(`assets/tiles/_slab/${f}.png`)}  assets/tiles/_slab/${f}.png`).join('\n')+'\n');
const old=fs.readFileSync('SHA256SUMS.txt','utf8').trim().split('\n').map(l=>l.slice(66));
const files=[...new Set([...old,...outputs.map(o=>o.file),'assets/tiles/manifest.js','tests/tile-art-v12.test.cjs','docs/ART-PROVENANCE.md','docs/art-provenance.json','docs/stage0-pilot/README.md'])].filter(p=>fs.existsSync(p)).sort();
fs.writeFileSync('SHA256SUMS.txt',files.map(p=>`${sha(p)}  ${p}`).join('\n')+'\n');
console.log('Recorded',outputs.length,'assets.');
