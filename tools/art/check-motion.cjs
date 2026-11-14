#!/usr/bin/env node
// Continuous conservative clearance, plus diagnostic samples of production motion.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const S = require('./spec.cjs');
const ROOT = path.resolve(__dirname, '../..'), TILES = path.join(ROOT, 'assets/tiles');
const TAU = Math.PI * 2;
const phase = n => n - Math.floor(n);
function position(a, t) {
  const period = a.period || 6;
  if (a.path) {
    let f = phase(t / period), dir = 1;
    if (a.mode !== 'loop') { dir = f < .5 ? 1 : -1; f = f < .5 ? f * 2 : 2 - f * 2; f = f * f * (3 - 2 * f); }
    const lengths = a.path.slice(1).map((p, i) => Math.hypot(p[0] - a.path[i][0], p[1] - a.path[i][1]));
    let d = f * lengths.reduce((x, y) => x + y, 0), p = a.path[0], right = true;
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i] || i === lengths.length - 1) {
        const k = lengths[i] ? Math.min(1, d / lengths[i]) : 0, q = a.path[i + 1];
        p = [a.path[i][0] + (q[0] - a.path[i][0]) * k, a.path[i][1] + (q[1] - a.path[i][1]) * k];
        right = q[0] >= a.path[i][0]; break;
      }
      d -= lengths[i];
    }
    return {x:p[0], y:p[1] + (a.bob ? Math.sin(t * TAU / (a.bobPeriod || .6)) * a.bob : 0), flip:a.face !== 'none' && (right ? 1 : -1) * dir < 0, rotation:0};
  }
  return {x:a.at[0], y:a.at[1] + (a.bob ? Math.sin(t * TAU / period) * a.bob : 0), flip:false,
    rotation:a.spin ? t * a.spin * TAU : a.sway ? Math.sin(t * TAU / period) * a.sway * Math.PI / 180 : 0};
}
const finitePair = a => Array.isArray(a) && a.length === 2 && Number.isFinite(a[0]) && Number.isFinite(a[1]);
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v);
// The allowed region is convex. Testing its half-planes also tests all positions
// between path vertices, including turns that uniform time samples can miss.
const {cx, cy, halfW, faceHalfH, headroom} = S.SPEC;
const slope = faceHalfH / (2 * halfW);
const directions = [
  {name:'left column', x:-1, y:0, limit:-(cx-halfW-1)},
  {name:'right column', x:1, y:0, limit:cx+halfW+1},
  {name:'headroom', x:0, y:-1, limit:-(headroom-1)},
  {name:'front right edge', x:slope, y:1, limit:cy+faceHalfH+1+slope*cx},
  {name:'front left edge', x:-slope, y:1, limit:cy+faceHalfH+1-slope*cx},
  {name:'bottom bound', x:0, y:1, limit:Infinity},
];
// Maximum A*cos(angle)+B*sin(angle) over a symmetric continuous sway range.
function angularSupport(A, B, angle) {
  if (angle >= Math.PI) return Math.hypot(A, B);
  if (!angle) return A;
  const peak = Math.atan2(B, A);
  if (peak >= -angle && peak <= angle) return Math.hypot(A, B);
  return Math.max(A*Math.cos(angle)+B*Math.sin(angle), A*Math.cos(angle)-B*Math.sin(angle));
}
function sweptEnvelope(a, points) {
  const bob = Math.abs(a.bob || 0);
  const radius = a.spin && !a.path ? points.reduce((r,p)=>Math.max(r,Math.hypot(...p)),0) : 0;
  const supports = directions.map(n => {
    const bobSupport = Math.abs(n.y) * bob;
    if (a.path) {
      const shapes = [false,true].map(flip => points.reduce((v,[x,y])=>Math.max(v,n.x*(flip?-x:x)+n.y*y),-Infinity));
      let support = -Infinity;
      for (let i=1;i<a.path.length;i++) {
        const p=a.path[i-1], q=a.path[i];
        const flips = a.face==='none' ? [false] : a.mode==='loop' ? [q[0]<p[0]] : [false,true];
        for (const flip of flips) for (const at of [p,q])
          support=Math.max(support,n.x*at[0]+n.y*at[1]+shapes[Number(flip)]+bobSupport);
      }
      return support;
    }
    const shape = a.spin ? Math.hypot(n.x,n.y)*radius : points.reduce((v,[x,y])=>{
      const A=n.x*x+n.y*y, B=n.y*x-n.x*y;
      return Math.max(v,angularSupport(A,B,Math.abs(a.sway || 0)*Math.PI/180));
    },-Infinity);
    return n.x*a.at[0]+n.y*a.at[1]+shape+bobSupport;
  });
  return {
    bounds:[-supports[0],-supports[2],supports[1],supports[5]],
    crossings:directions.filter((n,i)=>supports[i]>n.limit+1e-7).map(n=>n.name),
  };
}
function sampleTimes(a) {
  const period=a.period || 6;
  const periods=a.path ? [period,...(a.bob?[a.bobPeriod || .6]:[])] :
    [a.spin?1/Math.abs(a.spin):period,...(a.spin&&a.bob?[period]:[])];
  const duration=Math.max(...periods), times=new Set([-.25,0,duration,duration+.25]);
  for (const p of periods) for(let i=0;i<128;i++)times.add(p*(i/128));
  return {duration,times};
}
async function check(M, {loadImage:readImage=loadImage}={}) {
  const failures = [], sprites = Object.create(null), actors = [], glows = [];
  if (!record(M)) { failures.push('manifest: object required'); M={}; }
  const collection = key => {
    if (M[key]===undefined) return {};
    if (!record(M[key])) { failures.push('manifest: '+key+' must be an object'); return {}; }
    return M[key];
  };
  const spriteEntries=collection('sprites'), tileEntries=collection('tiles'), travellers=collection('travellers');
  for (const [name, s] of Object.entries(spriteEntries)) {
    if (!record(s)) { failures.push(name+': sprite must be an object'); continue; }
    if (!finitePair(s.anchor)) { failures.push(name+': finite anchor [x,y] required'); continue; }
    if (typeof s.src!=='string'||!s.src.trim()) { failures.push(name+': sprite source required'); continue; }
    if (s.bob!==undefined&&!Number.isFinite(s.bob)) failures.push(name+': invalid traveller bob');
    let img, data;
    try {
      img=await readImage(path.resolve(TILES,s.src));
      const c=createCanvas(img.width,img.height),g=c.getContext('2d'); g.drawImage(img,0,0);
      data=g.getImageData(0,0,img.width,img.height).data;
    } catch(e) { failures.push(name+': unable to load sprite '+s.src+': '+e.message); continue; }
    if (s.anchor[0]<0||s.anchor[0]>img.width||s.anchor[1]<0||s.anchor[1]>img.height) failures.push(name+': anchor outside sprite');
    const points=[];
    let transparent=0,boundary=0;
    for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){
      const alpha=data[(y*img.width+x)*4+3];
      if(!alpha)transparent++;
      if(alpha>16){points.push([x+.5-s.anchor[0],y+.5-s.anchor[1]]);if(!x||!y||x===img.width-1||y===img.height-1)boundary++;}
    }
    if(!points.length)failures.push(name+': empty sprite');
    if(!transparent)failures.push(name+': missing transparent background');
    if(boundary)failures.push(name+': painted pixels touch image boundary');
    sprites[name]={width:img.width,height:img.height,anchor:s.anchor,points};
  }
  for(const [key,tile] of Object.entries(tileEntries)){
    if(!record(tile)){failures.push(key+': tile must be an object');continue;}
    if(tile.glowPeriod!==undefined&&(!Number.isFinite(tile.glowPeriod)||tile.glowPeriod<=0))failures.push(key+': glowPeriod must be finite and positive');
    if(tile.glow!==undefined){
      if(typeof tile.glow!=='string'||!tile.glow.trim())failures.push(key+': glow source required');
      else try{
        const img=await readImage(path.resolve(TILES,tile.glow));
        if(img.width!==1024||img.height!==1536)failures.push(key+': glow must be 1024x1536');
        glows.push({tile:key,width:img.width,height:img.height});
      }catch(e){failures.push(key+': unable to load glow '+tile.glow+': '+e.message);}
    }
    if(tile.actors!==undefined&&!Array.isArray(tile.actors)){failures.push(key+': actors must be an array');continue;}
    for(const [index,a] of (tile.actors || []).entries()){
      if(!record(a)){failures.push(key+'/actor '+index+': actor must be an object');continue;}
      const label=key+'/'+(a.sprite || 'actor '+index), sprite=typeof a.sprite==='string'&&sprites[a.sprite];
      if(!sprite){failures.push(label+': missing sprite '+a.sprite);continue;}
      if(!sprite.points.length)continue;
      const before=failures.length,hasPath=a.path!==undefined,hasAt=a.at!==undefined;
      if(hasPath===hasAt){failures.push(label+': exactly one of path or at required');continue;}
      if(hasPath&&(!Array.isArray(a.path)||a.path.length<2||Array.from(a.path).some(p=>!finitePair(p)||!S.inPoly(S.FACE,...p)))){failures.push(label+': path must have two or more top-face points');continue;}
      if(hasAt&&!finitePair(a.at)){failures.push(label+': invalid position');continue;}
      for(const k of ['period','spin','sway','bob','bobPeriod','pulse'])if(a[k]!==undefined&&!Number.isFinite(a[k]))failures.push(label+': invalid '+k);
      if(a.period!==undefined&&a.period<=0)failures.push(label+': period must be positive');
      if(a.bobPeriod!==undefined&&a.bobPeriod<=0)failures.push(label+': bobPeriod must be positive');
      if(a.pulse!==undefined&&(a.pulse<0||a.pulse>1))failures.push(label+': pulse must be between 0 and 1');
      if(failures.length!==before)continue;
      const {duration,times}=sampleTimes(a);
      if(!Number.isFinite(duration)||[...times].some(t=>!Number.isFinite(t))){failures.push(label+': motion duration must be finite');continue;}
      let invalidMotion=false;
      for(const t of times){
        const p=position(a,t);
        if(![p.x,p.y,p.rotation].every(Number.isFinite)){invalidMotion=true;break;}
      }
      if(invalidMotion){failures.push(label+': motion produces non-finite coordinates or rotation');continue;}
      const envelope=sweptEnvelope(a,sprite.points);
      if(envelope.crossings.length)failures.push(label+': swept painted silhouette crosses '+envelope.crossings.join(', '));
      actors.push({tile:key,sprite:a.sprite,samples:times.size,duration,coverage:'continuous conservative envelope',
        bounds:envelope.bounds.map(n=>Math.round(n*10)/10),outside:envelope.crossings.length,crossings:envelope.crossings});
    }
  }
  for(const [stage,name] of Object.entries(travellers)){
    if(!S.STAGES.includes(stage))failures.push('unknown traveller stage '+stage);
    if(typeof name!=='string'||!sprites[name])failures.push('traveller '+stage+': missing sprite '+name);
  }
  return {passed:failures.length===0,failures,sprites:Object.fromEntries(Object.entries(sprites).map(([n,s])=>[n,{width:s.width,height:s.height,anchor:s.anchor,paintedPixels:s.points.length}])),actors,glows,travellers};
}
if(require.main===module){
  const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(TILES,'manifest.js'),'utf8'),c);
  check(c.window.BF_TILE_ART).then(r=>{console.log(JSON.stringify(r,null,2));process.exitCode=r.passed?0:1;}).catch(e=>{console.error(e);process.exitCode=1;});
}
module.exports={position,check};
