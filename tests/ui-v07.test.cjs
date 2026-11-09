const {test}=require('node:test'),assert=require('node:assert/strict');
const {make}=require('./ui-harness.cjs');
// v0.10: upgrades follow the tech tree, so climb it in an order the tree allows.
function climb(B,s,pick){ while(B.AXES.some(a=>s.era[a]<3)){ const a=B.AXES.find(a=>B.canUpgrade(s,a)); if(!a)break; B.upgrade(s,a,pick(a)); } }
function down(v,x,y){v.listeners.pointerdown({clientX:x,clientY:y,pointerType:'mouse'});}
function up(v,x,y){v.listeners.pointerup({clientX:x,clientY:y,pointerType:'mouse'});}
test('tap current building inspects, preserves selection and never places',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});f.V.sel=f.s.hand.indexOf('home');f.doPlace(0,0);v.step();const turn=f.s.turn,sel=f.V.sel;
 down(v,f.hx(0,0),f.hy(0,0));assert.equal(f.V.card.axis,'home');assert.equal(f.guide.isOpen,true);assert.equal(f.s.turn,turn);assert.equal(f.V.sel,sel);
 const panel=v.elements.find(e=>e.className==='guide-shade');assert.match(panel.html,/Today/);assert.match(panel.html,/Why these neighbours/);f.closeCard();assert.equal(f.guide.isOpen,false);
});
test('upgrades stay optional, connections are readable, all statuses exist',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});f.s.ideas=5;f.doUpgrade('power');v.flushTimers();assert.equal(f.V.card,null);
 f.connectionsButton.onclick();assert.equal(f.V.card.kind,'discoveries');const p=v.elements.find(e=>e.className==='guide-shade');assert.match(p.html,/Rain-fed growing/);assert.match(p.html,/Wind Turbines/);f.closeCard();
 for(const a of f.B.AXES) for(const e of [0,1,2,'leaf','star'])assert.ok(['Today','Emerging','Imagine'].includes(f.TECHS.T[a][e].status));
});
test('schema-2 save is discoverable and reloads exact state through UI lifecycle',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});f.V.sel=0;f.doPlace(0,0);const snapshot=f.B.serialize(f.s);const sv=f.loadSave();assert.equal(sv.mode,'cozy');f.start({seed:sv.seed,mode:sv.mode},sv.log,sv.saved);assert.equal(f.B.serialize(f.s),snapshot);
});
test('finale clears all inspection state and continuing keeps future save',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});f.openCard({axis:'home',era:0});f.s.ideas=30;
 climb(f.B,f.s,a=>f.B.AXES.indexOf(a)%2?'leaf':'star');
 assert.equal(f.s.crowned,'mixed');f.startFinale('mixed',true);assert.equal(f.V.card,null);assert.equal(f.guide.isOpen,false);assert.equal(f.V.peek,null);const k=f.finaleButtons()[0];f.finaleClick(k.x,k.y);assert.equal(f.s.over,false);assert.equal(f.V.finale,null);const sv=f.loadSave();f.start({},sv.log,sv.saved);assert.equal(f.s.over,false);assert.equal(f.V.finale,null);
});
test('row without ideas inspects, press cancel does not upgrade, modal blocks keyboard',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});let r=f.techRects()[0],x=r.x+r.w/2,y=r.y+r.h/2;down(v,x,y);up(v,x,y);assert.equal(f.V.card.axis,'power');f.closeCard();f.s.ideas=1;down(v,x,y);v.listeners.pointercancel();up(v,x,y);assert.equal(f.s.era.power,0);
 f.openCard({axis:'power',era:3,variant:'star'});const panel=v.elements.find(e=>e.className==='guide-shade');assert.match(panel.html,/Emerging/);const sel=f.V.sel;v.listeners.keydown({key:'2'});assert.equal(f.V.sel,sel);
});
test('all responsive canvas sizes render without exceptions',()=>{
 for(const [w,h]of [[1024,768],[768,1024],[390,844]]){const v=make(w,h,'?mode=cozy&seed=7&auto=45&cards=0');v.step(10);v.c.__BF.openCard({axis:'power',era:3,variant:'star'});v.step(10);v.c.__BF.closeCard();v.c.__BF.V.fork={axis:'home',t:0};v.step(10);v.c.__BF.V.fork=null;v.c.__BF.startFinale('mixed',true);v.step(10);}
});
test('real title resume handler restores continued town without replaying the finale',()=>{
 const v=make(),f=v.c.__BF;f.start({seed:7});f.s.ideas=30;climb(f.B,f.s,a=>f.B.AXES.indexOf(a)%2?'leaf':'star');f.startFinale('mixed',true);let b=f.finaleButtons()[0];down(v,b.x,b.y);f.V.sel=0;f.doPlace(0,0);const before=f.B.serialize(f.s);f.V.screen='title';b=f.titleButtons().find(b=>b.k==='cozy');down(v,b.x,b.y);assert.equal(f.B.serialize(f.s),before);assert.equal(f.V.finale,null);
});
test('last challenge ideas have a clear goal and no forced inspection card',()=>{
 const v=make(),f=v.c.__BF;f.start({mode:'challenge',seed:7});f.s.deck=[];f.s.hand=['home',null,null];f.s.ideas=1;f.V.sel=0;f.doPlace(0,0);assert.equal(f.s.over,false);assert.equal(f.goalInfo().st,'lastideas');f.doUpgrade('water');assert.equal(f.s.over,true);v.flushTimers();assert.equal(f.V.screen,'end');assert.equal(f.guide.isOpen,false);
});
