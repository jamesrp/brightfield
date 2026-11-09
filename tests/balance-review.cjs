// Deterministic progression comparison; no game or save writes.
const path=require('node:path');const B=require('../src/core.js');
const seeds=[7,17,42,101,314];
function run(R,seed,variant){const s=R.newGame({seed});for(let n=0;n<150&&!s.over;n++){
 while(s.ideas>0){const a=R.AXES.filter(a=>R.canUpgrade(s,a)).sort((a,b)=>s.era[a]-s.era[b])[0];if(!a)break;R.upgrade(s,a,s.era[a]===2?variant:undefined);}
 if(s.over)break;let best;
 for(let i=0;i<3;i++)if(s.hand[i])for(const [q,r]of R.legalHexes(s)){const p=R.preview(s,s.hand[i],q,r),score=p.points-R.hexDist(q,r)*.3;if(!best||score>best.score)best={i,q,r,score};}
 if(!best)break;R.place(s,best.i,best.q,best.r);
 }return {placements:s.turn,upgrades:s.ideasSpent,crown:s.crowned};}
const rows={seeds};for(const v of ['leaf','star','magic'])rows[v]=seeds.map(seed=>run(B,seed,v));
if(process.argv[2]){const old=require(path.resolve(process.argv[2]));rows.baseline={};for(const v of ['leaf','star'])rows.baseline[v]=seeds.map(seed=>run(old,seed,v));}
console.log(JSON.stringify(rows,null,2));
