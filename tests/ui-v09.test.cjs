const {test}=require('node:test'),assert=require('node:assert/strict');const {make}=require('./ui-harness.cjs');
test('three distinct choice targets fit mobile, tablet and desktop and keyboard 3 chooses Magic',()=>{
 for(const [w,h]of [[320,568],[390,844],[768,1024],[1440,900]]){
 const v=make(w,h,'?mode=cozy&seed=7&cards=0'),f=v.c.__BF;for(const a of f.B.AXES)f.s.era[a]=2;f.s.ideas=1;f.doUpgrade('home');v.step(2);
 const rects=f.forkRects();assert.equal(rects.length,3);assert.deepEqual(Array.from(rects,r=>r.v),['leaf','star','magic']);
 for(const r of rects){assert.ok(r.x-r.r>=0&&r.x+r.r<=w);assert.ok(r.r>=30);}
 for(let i=1;i<3;i++)assert.ok(rects[i].x-rects[i-1].x>rects[i].r*2);
 assert.equal(f.forkControls.hidden,false);v.listeners.keydown({key:'3',preventDefault(){}});assert.equal(f.s.variant.home,'magic');assert.equal(f.s.ideasSpent,1);v.step(2);assert.equal(f.forkControls.hidden,true);
 }
});
test('native Magic choice and cancel do not place buildings',()=>{
 const v=make(390,844,'?mode=cozy&cards=0'),f=v.c.__BF;for(const a of f.B.AXES)f.s.era[a]=2;f.s.ideas=1;f.doUpgrade('water');f.forkControls.children[3].onclick();assert.equal(f.s.ideas,1);assert.equal(f.V.fork,null);f.doUpgrade('water');f.forkControls.children[2].onclick();assert.equal(f.s.variant.water,'magic');assert.equal(Object.keys(f.s.tiles).length,0);
});
test('Magic fallback art, guide, future preview and finales render at responsive sizes',()=>{
 for(const [w,h]of [[320,568],[390,844],[768,1024],[1440,900]]){
 const v=make(w,h,'?mode=cozy&auto=30&cards=0'),f=v.c.__BF;
 for(const a of f.B.AXES){f.s.era[a]=3;f.s.variant[a]='magic';}v.step(4);
 f.openCard({axis:'power',era:3,variant:'magic'});v.step(2);assert.ok(v.elements.some(e=>e.innerHTML.includes('Crystal Beacon')));f.closeCard();
 f.s.era.home=2;f.V.peek={axis:'home',t:0};v.step(2);f.V.peek=null;f.s.era.home=3;
 for(const crown of ['magic','mixed']){f.startFinale(crown,true);v.step(4);}
 }
});


test('browser QA storage is isolated while ordinary game keeps its historic save key',()=>{
 const qa=make(1024,768,'?qa=1&mode=cozy&seed=47&cards=0');
 qa.c.__BF.save();
 assert.ok(qa.ls.has('brightfield.qa.v1.save'));
 assert.ok(!qa.ls.has('brightfield.v1.save'));
 for(const key of qa.ls.keys())assert.ok(key.startsWith('brightfield.qa.'),key);
 const live=make(1024,768,'?mode=cozy&seed=47&cards=0');live.c.__BF.save();
 assert.ok(live.ls.has('brightfield.v1.save'));assert.ok(!live.ls.has('brightfield.qa.v1.save'));
});
