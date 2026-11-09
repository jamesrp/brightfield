'use strict';
// Art spec v2: per-tile PNGs whose slab is exactly the board hex, with actor sprites and travellers.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');const {make}=require('./ui-harness.cjs');
const S=require('../tools/art/spec.cjs');
const ROOT=path.resolve(__dirname,'..'),TILES=path.join(ROOT,'assets/tiles');

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
  const v=make(1024,768,'?mode=cozy&cards=0',true,{tileArt:fixture()}),w=make(1024,768,'?mode=cozy&cards=0',true);
  for(const z of [v,w]){await z.c.ART.assetsReady;await z.c.ART.tileArtReady;}
  const render=(A,axis,era)=>{const cv=createCanvas(260,260),g=cv.getContext('2d');A.drawBuilding(g,axis,era,null,130,200,110,.7,false,{grounded:true});return Buffer.from(g.getImageData(0,0,260,260).data);};
  for(const [axis,era] of [['home',1],['power',2],['wild',0]]) assert.deepEqual(render(v.c.ART,axis,era),render(w.c.ART,axis,era));
});

test('the empty shipped manifest loads no extra images, and the spec template passes its own checks',async()=>{
  const v=make(1024,768,'?mode=cozy&cards=0',true);await v.c.ART.assetsReady;await v.c.ART.tileArtReady;
  assert.equal(v.c.ART.tileArtStatus().listed,0);
  const {execFileSync}=require('node:child_process');
  const out=execFileSync(process.execPath,[path.join(ROOT,'tools/art/check-tiles.cjs'),path.join(TILES,'_template/base-plain.png')]).toString();
  assert.match(out,/all checks pass/);
  assert.match(execFileSync(process.execPath,[path.join(ROOT,'tools/art/check-tiles.cjs')]).toString(),/all checks pass/,'shipped manifest is valid');
});
