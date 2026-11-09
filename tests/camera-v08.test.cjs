const {test}=require('node:test'),assert=require('node:assert/strict');
const {make}=require('./ui-harness.cjs');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(w=1024,h=768){const v=make(w,h),f=v.c.__BF;f.start({seed:7});return {v,f};}
function event(v,type,x,y,id=1,pointerType='mouse',extra={}){v.listeners[type]({clientX:x,clientY:y,pointerId:id,pointerType,button:0,...extra});}
test('camera clamps 1–3×; anchored zoom and inverse hex picking agree',()=>{
 const {v,f}=setup(),x=f.hx(1,0),y=f.hy(1,0),before=f.B.serialize(f.s);
 f.zoomAt(2,x,y);near(f.hx(1,0),x);near(f.hy(1,0),y);
 for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++){const p=f.pick(f.hx(q,r),f.hy(q,r));assert.equal(p[0]||0,q||0);assert.equal(p[1]||0,r||0);}
 f.zoomAt(100,f.V.baseX,f.V.baseY);assert.equal(f.V.zoom,3);assert.equal(f.cameraButtons.in.disabled,true);
 f.zoomAt(0,f.V.baseX,f.V.baseY);assert.equal(f.V.zoom,1);assert.equal(f.V.panX,0);assert.equal(f.V.panY,0);assert.equal(f.cameraButtons.out.disabled,true);assert.equal(f.B.serialize(f.s),before);
 let prevented=false;v.listeners.wheel({clientX:f.hx(0,0),clientY:f.hy(0,0),deltaY:-200,preventDefault(){prevented=true;}});assert.ok(prevented);assert.ok(f.V.zoom>1);
});
test('zoomed mouse drag pans without placing; click still places and inspects',()=>{
 const {v,f}=setup();f.V.sel=0;f.zoomAt(2,f.V.cx,f.V.cy);let x=f.hx(0,0),y=f.hy(0,0);
 event(v,'pointerdown',x,y);assert.equal(f.s.turn,0);event(v,'pointermove',x+60,y+20);event(v,'pointerup',x+60,y+20);assert.equal(f.s.turn,0);near(f.V.panX,60);
 x=f.hx(0,0);y=f.hy(0,0);event(v,'pointerdown',x,y);event(v,'pointerup',x,y);assert.equal(f.s.turn,1);
 event(v,'pointerdown',x,y);event(v,'pointerup',x,y);assert.ok(f.V.card);assert.equal(f.s.turn,1);
});
test('pinch consumes both fingers without placing, then a fresh touch tap works',()=>{
 const {v,f}=setup();f.V.sel=0;const x=f.hx(0,0),y=f.hy(0,0);
 event(v,'pointerdown',x-30,y,1,'touch');event(v,'pointerdown',x+30,y,2,'touch');assert.equal(f.s.turn,0);
 event(v,'pointermove',x+90,y,2,'touch');near(f.V.zoom,2);assert.equal(f.s.turn,0);
 event(v,'pointerup',x+90,y,2,'touch');event(v,'pointermove',x-15,y,1,'touch');event(v,'pointerup',x-15,y,1,'touch');assert.equal(f.s.turn,0);assert.equal(f.V.gesture,null);
 event(v,'pointerdown',f.hx(0,0),f.hy(0,0),3,'touch');event(v,'pointerup',f.hx(0,0),f.hy(0,0),3,'touch');assert.equal(f.s.turn,1);
});
test('cancelled touch drag and pan-only mouse never place',()=>{
 const {v,f}=setup();f.V.sel=0;const x=f.hx(0,0),y=f.hy(0,0);
 event(v,'pointerdown',x,y,1,'touch');event(v,'pointermove',x+20,y,1,'touch');event(v,'pointerup',x+20,y,1,'touch');assert.equal(f.s.turn,0);
 event(v,'pointerdown',x,y,1,'touch');v.listeners.pointercancel();event(v,'pointerup',x,y,1,'touch');assert.equal(f.s.turn,0);
 event(v,'pointerdown',x,y,1,'mouse',{button:2});event(v,'pointerup',x,y,1,'mouse',{button:2});assert.equal(f.s.turn,0);
 v.listeners.keydown({key:' ',preventDefault(){}});event(v,'pointerdown',x,y);event(v,'pointerup',x,y);v.listeners.keyup({key:' '});assert.equal(f.s.turn,0);
});
test('modal, fork, title and finale block zoom; finale resets overview',()=>{
 const {v,f}=setup();v.listeners.keydown({key:'+'});assert.equal(f.V.zoom,1.25);f.openCard({axis:'home',era:0});v.step(1);assert.equal(f.cameraControls.hidden,true);
 v.listeners.keydown({key:'+'});f.cameraButtons.in.onclick();assert.equal(f.V.zoom,1.25);f.closeCard();
 f.V.fork={axis:'home',t:0};v.listeners.keydown({key:'+'});assert.equal(f.V.zoom,1.25);f.V.fork=null;
 f.V.screen='title';f.zoomAt(3,500,300);assert.equal(f.V.zoom,1.25);f.V.screen='play';
 f.startFinale('mixed',true);assert.equal(f.V.zoom,1);assert.equal(f.V.panX,0);v.listeners.keydown({key:'+'});assert.equal(f.V.zoom,1);v.step(1);assert.equal(f.cameraControls.hidden,true);
});
test('resize and growth retain bounded zoom; fit restores an accessible town',()=>{
 const {v,f}=setup();f.zoomAt(3,f.V.cx,f.V.cy);f.V.panX=1e6;f.V.panY=-1e6;f.s.radius+=2;f.fitBoard();assert.equal(f.V.zoom,3);assert.ok(Math.abs(f.V.panX)<1e6);
 v.c.innerWidth=390;v.c.innerHeight=844;v.listeners.resize();v.step(3);assert.equal(f.V.zoom,3);assert.ok(Number.isFinite(f.V.cx));
 v.listeners.keydown({key:'0'});assert.equal(f.V.zoom,1);assert.equal(f.V.panX,0);near(f.V.cx,f.V.baseX);near(f.V.u,f.V.baseU);v.step(1);assert.equal(f.cameraControls.hidden,false);
});
test('pinch cancels a pending hand drag, and capture release keeps the other finger consumed',()=>{
 const {v,f}=setup();const card=f.cardRects()[0],x=card.x+card.w/2,y=card.y+card.h/2;
 event(v,'pointerdown',x,y,1,'touch');assert.ok(f.V.drag);
 event(v,'pointerdown',f.hx(0,0),f.hy(0,0),2,'touch');assert.equal(f.V.drag,null);assert.ok(f.V.gesture.pinch);
 event(v,'pointerup',x,y,1,'touch');v.listeners.lostpointercapture({pointerId:1});assert.ok(f.V.gesture.pinch);
 event(v,'pointermove',f.hx(0,0)+30,f.hy(0,0),2,'touch');event(v,'pointerup',f.hx(0,0)+30,f.hy(0,0),2,'touch');assert.equal(f.s.turn,0);assert.equal(f.V.gesture,null);
});

test('Space preserves focused camera button activation instead of starting a pan',()=>{
 const {v,f}=setup();f.cameraButtons.in.focus();let prevented=false;
 v.listeners.keydown({key:' ',preventDefault(){prevented=true;}});
 assert.equal(prevented,false);assert.equal(f.V.space,false);
 f.cameraButtons.in.onclick();assert.equal(f.V.zoom,1.25);
 v.doc.activeElement=null;v.listeners.keydown({key:' ',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(f.V.space,true);
});

test('held Space remains pan-only across repeated gestures until keyup, blur or reset',()=>{
 const {v,f}=setup();f.V.sel=0;const x=f.hx(0,0),y=f.hy(0,0);
 v.listeners.keydown({key:' ',preventDefault(){}});
 event(v,'pointerdown',x,y);event(v,'pointermove',x+25,y);event(v,'pointerup',x+25,y);
 assert.equal(f.V.space,true);assert.equal(f.s.turn,0);
 event(v,'pointerdown',x,y);event(v,'pointerup',x,y);assert.equal(f.s.turn,0);assert.equal(f.V.space,true);
 event(v,'pointerdown',x,y);v.listeners.pointercancel({pointerId:1});assert.equal(f.V.space,true);
 v.listeners.keyup({key:' '});assert.equal(f.V.space,false);
 event(v,'pointerdown',x,y);event(v,'pointerup',x,y);assert.equal(f.s.turn,1);
 v.listeners.keydown({key:' ',preventDefault(){}});v.listeners.blur();assert.equal(f.V.space,false);assert.equal(f.V.gesture,null);
 v.listeners.keydown({key:' ',preventDefault(){}});f.resetCamera();assert.equal(f.V.space,false);
});
