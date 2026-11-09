const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const {make}=require('./ui-harness.cjs');

test('all 48 legacy atlas illustrations stay within their raised hex footprint',async()=>{
  const v=make(1024,768,'?mode=cozy&seed=7&cards=0',true,{tileArt:{version:2,tiles:{}}}),A=v.c.ART;
  await A.assetsReady;
  const cv=createCanvas(420,420),g=cv.getContext('2d'),x=210,y=280,u=120;
  const radius=A.boardFootprint.tileRadius*u,halfWidth=Math.sqrt(3)/2*radius;
  for(const axis of v.c.BF.AXES)for(const stage of [0,1,2,'leaf','star','magic']){
    g.clearRect(0,0,420,420);
    const emitters=A.drawBuilding(g,axis,typeof stage==='number'?stage:3,typeof stage==='string'?stage:null,x,y+u*.18,u,.8,false,{grounded:true});
    const pixels=g.getImageData(0,0,420,420).data;let count=0,minY=420;
    for(let py=0;py<420;py++)for(let px=0;px<420;px++){
      if(pixels[(py*420+px)*4+3]<16)continue;
      count++;minY=Math.min(minY,py);
      assert.ok(Math.abs(px+.5-x)<=halfWidth+1,axis+':'+stage+' fits horizontal edges');
      const frontY=y+radius*.64-Math.abs(px+.5-x)*(.32/(Math.sqrt(3)/2));
      assert.ok(py<=frontY+1,axis+':'+stage+' fits front hex edges');
    }
    assert.ok(count>3000,axis+':'+stage+' retains visible detail');
    assert.ok(minY<y-u*.4,axis+':'+stage+' keeps the raised silhouette');
    assert.ok(emitters.every(p=>p.every(Number.isFinite)));
  }
});

test('grounded live overlays animate and default guide/icon framing is unchanged',async()=>{
  const v=make(1024,768,'?mode=cozy&seed=7&cards=0',true),A=v.c.ART;
  await A.assetsReady;
  const cv=createCanvas(300,300),g=cv.getContext('2d');
  const render=(axis,era,variant,time,layout)=>{
    g.clearRect(0,0,300,300);A.drawBuilding(g,axis,era,variant,150,215,110,time,false,layout);
    return Buffer.from(g.getImageData(0,0,300,300).data);
  };
  for(const [axis,era,variant]of [['power',2,null],['move',3,'star'],['water',3,'star'],['wild',3,'leaf']]){
    assert.notDeepEqual(render(axis,era,variant,0,{grounded:true}),render(axis,era,variant,1.4,{grounded:true}));
    assert.deepEqual(render(axis,era,variant,.8),render(axis,era,variant,.8,{grounded:false}));
  }
});

test('generated art and camera render overview and close-up on desktop, tablet and phone',async()=>{
  for(const [w,h]of [[1440,900],[768,1024],[390,844]]){
    const v=make(w,h,'?mode=cozy&seed=7&auto=45&cards=0',true);await v.c.ART.assetsReady;
    v.step(5);const f=v.c.__BF,before=f.B.serialize(f.s);
    f.zoomAt(3,f.V.baseX,f.V.baseY);v.step(5);
    f.resetCamera();v.step(5);
    assert.equal(f.B.serialize(f.s),before,'camera never edits game/save state');
  }
});
