'use strict';
// Art spec v2: per-tile PNGs whose slab is exactly the board hex, with actor sprites and travellers.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');const {make}=require('./ui-harness.cjs');
const S=require('../tools/art/spec.cjs');
const ROOT=path.resolve(__dirname,'..'),TILES=path.join(ROOT,'assets/tiles');

// Validate the complete key, not just the first two colon-separated fields.
function tileFamily(key){
  const parts=key.split(':');
  assert.equal(parts.length,2,`${key}: expected type:stage`);
  const [axis,stage]=parts;
  assert.ok(S.AXES.includes(axis),`${key}: unknown building type`);
  assert.ok(S.STAGES.includes(stage),`${key}: unknown stage`);
  return {0:'earth',1:'earth',2:'earth',leaf:'garden',star:'alloy',magic:'arcane'}[stage];
}
function imageSources(manifest){
  const sources=new Set();
  for(const [key,tile] of Object.entries(manifest.tiles || {})){
    tileFamily(key);
    assert.ok(typeof tile.src==='string'&&tile.src.length,`${key}: missing tile source`);
    sources.add(tile.src);
    if(tile.glow)sources.add(tile.glow);
  }
  for(const [name,sprite] of Object.entries(manifest.sprites || {})){
    assert.ok(typeof sprite.src==='string'&&sprite.src.length,`${name}: missing sprite source`);
    sources.add(sprite.src);
  }
  return sources;
}
function shippedManifest(){
  const context={window:{}};
  require('node:vm').runInNewContext(fs.readFileSync(path.join(TILES,'manifest.js'),'utf8'),context);
  return context.window.BF_TILE_ART;
}

function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bf-tiles-')),{w,h,cx,cy}=S.SPEC;
  const tile=createCanvas(w,h),g=tile.getContext('2d');
  g.fillStyle='#7a5a3a';S.path(g,S.SILHOUETTE);g.fill();g.fillStyle='#8fc060';S.path(g,S.FACE);g.fill();
  g.fillStyle='#c04030';g.fillRect(cx-150,cy-500,300,520); // a tall red "building"
  fs.writeFileSync(path.join(dir,'tile.png'),tile.toBuffer('image/png'));
  const car=createCanvas(80,50),cg=car.getContext('2d');cg.fillStyle='#2050d0';cg.fillRect(0,0,80,50);
  fs.writeFileSync(path.join(dir,'car.png'),car.toBuffer('image/png'));
  const rel=f=>path.relative(TILES,path.join(dir,f));
  return {
    tiles:{'food:0':{src:rel('tile.png'),emitters:[[512,610,1]],actors:[{sprite:'car',path:[[250,1150],[780,1150]],period:4}]},
           'home:1':{src:rel('missing.png')}},
    sprites:{car:{src:rel('car.png'),anchor:[40,50]}},
    travellers:{'0':'car'},
  };
}

test('a spec v2 tile lands exactly on the board hex, animates its actors, and keeps emitters',async()=>{
  const v=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:fixture()});const A=v.c.ART;
  await A.assetsReady;await A.tileArtReady;
  assert.deepEqual(A.tileArtStatus().failed.length,1,'the missing file is reported, not fatal');
  const cv=createCanvas(420,420),g=cv.getContext('2d'),x=210,y=250,u=120;
  const draw=t=>{g.clearRect(0,0,420,420);const em=A.drawBuilding(g,'food',0,null,x,y+u*.18,u,t,false,{grounded:true});return {em,px:g.getImageData(0,0,420,420).data};};
  const {em,px}=draw(0),a=(X,Y)=>px[(Math.round(Y)*420+Math.round(X))*4+3];
  const r=A.BOARD.tileRadius*u,hw=Math.sqrt(3)/2*r,kb=A.BOARD.kerb*u;
  assert.ok(a(x-hw+2,y)>200&&a(x+hw-2,y)>200,'face reaches both board hex sides');
  assert.equal(a(x-hw-3,y),0);assert.equal(a(x+hw+3,y),0);
  assert.ok(a(x,y+r*.64-2)>200,'face reaches the board hex front vertex');
  assert.ok(a(x,y+r*.64+kb-2)>200&&a(x,y+r*.64+kb+3)===0,'slab side is the board kerb');
  assert.equal(em.length,1);assert.ok(Math.abs(em[0][0]-x)<1&&em[0][1]<y-u*.5,'emitter maps into board space');
  assert.notDeepEqual(Buffer.from(px),Buffer.from(draw(1.3).px),'actor moves');
  assert.ok(A.drawTraveller(g,'0',100,100,u,1,0,1),'listed traveller drawn as a sprite');
  assert.equal(A.drawTraveller(g,'leaf',100,100,u,1,0,1),false,'unlisted traveller falls back');
});

test('a listed tile whose file is missing, and every unlisted tile, keep the atlas art',async()=>{
  const v=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:fixture()}),w=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:{version:2,tiles:{}}});
  for(const z of [v,w]){await z.c.ART.assetsReady;await z.c.ART.tileArtReady;}
  const render=(A,axis,era)=>{const cv=createCanvas(260,260),g=cv.getContext('2d');A.drawBuilding(g,axis,era,null,130,200,110,.7,false,{grounded:true});return Buffer.from(g.getImageData(0,0,260,260).data);};
  for(const [axis,era] of [['home',1],['power',2],['wild',0]]) assert.deepEqual(render(v.c.ART,axis,era),render(w.c.ART,axis,era));
});

test('every shipped manifest tile and image loads with a known type and stage',async()=>{
  const v=make(1024,768,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
  const manifest=v.c.BF_TILE_ART,sources=imageSources(manifest),status=v.c.ART.tileArtStatus();
  assert.ok(Object.keys(manifest.tiles).length>0,'the shipped manifest lists tiles');
  // The loader counts unique sources, including optional glows and sprites, not tile keys.
  for(const src of sources)assert.ok(v.imageLoads.includes('assets/tiles/'+src),`${src}: image requested`);
  assert.equal(status.listed,sources.size);
  assert.equal(status.ready,sources.size);
  assert.equal(status.failed.length,0,`failed images: ${status.failed.join(', ')}`);
  const {execFileSync}=require('node:child_process');
  const out=execFileSync(process.execPath,[path.join(ROOT,'tools/art/check-tiles.cjs'),path.join(TILES,'_template/base-plain.png')]).toString();
  assert.match(out,/all checks pass/);
  assert.match(execFileSync(process.execPath,[path.join(ROOT,'tools/art/check-tiles.cjs')]).toString(),/all checks pass/,'shipped manifest is valid');
});

test('every listed tile reuses its family’s shared side pixels',async()=>{
  const pixels=async file=>{const img=await loadImage(file),c=createCanvas(S.SPEC.w,S.SPEC.h);c.getContext('2d').drawImage(img,0,0);return c.getContext('2d').getImageData(0,0,S.SPEC.w,S.SPEC.h).data;};
  const manifest=shippedManifest(),slabs=new Map();
  const samples=[];
  for(let y=0;y<S.SPEC.h;y++)for(let x=33;x<991;x++){
    if(y>S.frontEdgeY(x)+3&&y<S.bottomY(x)-3)samples.push((y*S.SPEC.w+x)*4);
  }
  for(const [key,tile] of Object.entries(manifest.tiles)){
    const family=tileFamily(key);
    if(!slabs.has(family))slabs.set(family,await pixels(path.join(TILES,'_slab',family+'.png')));
    const slab=slabs.get(family),data=await pixels(path.join(TILES,tile.src));
    let differences=0;
    for(const i of samples)for(let k=0;k<4;k++)if(data[i+k]!==slab[i+k])differences++;
    assert.equal(differences,0,`${key} uses the shared ${family} side faces`);
  }
});


test('manifest keys select the matching slab family and reject malformed keys',()=>{
  for(const axis of S.AXES)for(const [stage,family] of Object.entries({0:'earth',1:'earth',2:'earth',leaf:'garden',star:'alloy',magic:'arcane'})){
    assert.equal(tileFamily(`${axis}:${stage}`),family);
  }
  for(const key of ['food','food:','food:0:extra',':0','unknown:0','food:3','food:unknown']){
    assert.throws(()=>tileFamily(key),assert.AssertionError,key);
  }
});

test('loader status counts shared tile, glow and sprite sources only once',async()=>{
  const manifest=fixture(),tile=manifest.tiles['food:0'];
  delete manifest.tiles['home:1'];
  manifest.tiles['home:1']={src:tile.src};
  manifest.tiles['wild:2']={src:tile.src,glow:manifest.sprites.car.src};
  const v=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:manifest});
  await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
  assert.equal(Object.keys(manifest.tiles).length,3);
  assert.equal(imageSources(manifest).size,2);
  const status=v.c.ART.tileArtStatus();
  assert.equal(status.listed,2);
  assert.equal(status.ready,2);
  assert.equal(status.failed.length,0);
});
