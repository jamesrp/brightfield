const vm=require('node:vm'), fs=require('node:fs'), path=require('node:path');
const {createCanvas,Image}=require('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'..');
function make(W=1024,H=768,search='',generated=false,opts={}) {
  const cv=createCanvas(W,H), ls=new Map(), listeners={},timers=[],elements=[],imageLoads=[];let cb,now=0;
  class LocalImage extends Image {set src(value){ imageLoads.push(value); super.src=path.resolve(ROOT,value); } get src(){return super.src;} }
  class Element {
    constructor(tag){this.tagName=tag.toUpperCase();this.style={};this.hidden=false;this.children=[];this.handlers={};this.attrs={};this.html='';this.selectorNodes={};elements.push(this);}
    appendChild(el){this.children.push(el);return el;}
    addEventListener(k,f){this.handlers[k]=f;}
    setAttribute(k,v){this.attrs[k]=v;}
    focus(){doc.activeElement=this;}
    closest(){return null;}
    set innerHTML(v){this.html=v;this.selectorNodes={};}
    get innerHTML(){return this.html;}
    querySelector(sel){if(!this.selectorNodes[sel]) {if(sel==='canvas' && !this.html.includes('<canvas'))return null;const e=sel==='canvas'?createCanvas(560,340):new Element(sel==='summary'?'summary':'button');this.selectorNodes[sel]=e;}return this.selectorNodes[sel];}
    querySelectorAll(){return [this.querySelector('.guide-close'),this.querySelector('.guide-done')];}
  }
  const doc={activeElement:null,getElementById:()=>cv,createElement:t=>new Element(t),body:new Element('body')};
  cv.style={};cv.addEventListener=(k,f)=>listeners[k]=f;
  const c={console,URLSearchParams,Math,Date,Map,Set,JSON,Object,Array,Infinity,performance:{now:()=>0},location:{search},localStorage:{getItem:k=>ls.get(k),setItem:(k,v)=>ls.set(k,v),removeItem:k=>ls.delete(k)},setTimeout:(f,t)=>{timers.push({f,t});},requestAnimationFrame:f=>{cb=f},document:doc,Image:LocalImage};
  c.window=c;c.innerWidth=W;c.innerHeight=H;c.devicePixelRatio=1;c.addEventListener=(k,f)=>listeners[k]=f;c.AUDIO={S:new Proxy({},{get:()=>()=>{}}),update:()=>{},init:()=>{},setMute:()=>{}};
  if(opts.tileArt)c.BF_TILE_ART=opts.tileArt; // test fixtures replace assets/tiles/manifest.js
  vm.createContext(c);for(const f of ['src/core','src/techs','src/art',...(generated?['src/generated-art','assets/tiles/manifest','src/tile-art']:[]),'src/inspector','src/main'])vm.runInContext(fs.readFileSync(path.join(ROOT,f+'.js'),'utf8'),c);
  return {c,cv,ls,listeners,timers,elements,doc,imageLoads,step:(n=50)=>{for(let i=0;i<n;i++){now+=16.6667;cb(now)}},save:file=>fs.writeFileSync(file,cv.toBuffer('image/png')),flushTimers:()=>{for(const timer of timers.splice(0).sort((a,b)=>a.t-b.t))timer.f();}};
}
module.exports={make};
