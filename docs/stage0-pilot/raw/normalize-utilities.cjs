// Exact shared-slab underlay fills small generated top-face edge gaps only.
// Run after art:fit; raw and first-fit files remain preserved for provenance.
const fs = require('node:fs');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
const S = require('../../../tools/art/spec.cjs');
(async () => {
  const earth = await loadImage('assets/tiles/_slab/earth.png');
  for (const type of ['power','move','food','water']) {
    const dir = `docs/stage0-pilot/raw/${type}`;
    const source = `${dir}/first-fit.png`;
    if (!fs.existsSync(source)) fs.copyFileSync(`assets/tiles/0/${type}.png`, source);
    const tile = await loadImage(source);
    const c = createCanvas(1024,1536), g = c.getContext('2d');
    g.drawImage(tile,0,0);
    const before = g.getImageData(0,0,1024,1536).data;
    g.globalCompositeOperation = 'destination-over';
    g.save(); S.path(g,S.SILHOUETTE); g.clip(); g.drawImage(earth,0,0); g.restore();
    g.globalCompositeOperation = 'source-over';
    for (const side of [S.SIDE_LEFT,S.SIDE_RIGHT]) { g.save(); S.path(g,side); g.clip(); g.drawImage(earth,0,0); g.restore(); }
    const after = g.getImageData(0,0,1024,1536).data;
    let filledPixels = 0, faceFilledPixels = 0;
    for (let y=0;y<1536;y++) for(let x=0;x<1024;x++) {
      const a=(y*1024+x)*4+3;
      if(before[a]<200 && after[a]>=200) { filledPixels++; if(S.inPoly(S.FACE,x+.5,y+.5)) faceFilledPixels++; }
    }
    fs.writeFileSync(`assets/tiles/0/${type}.png`,c.toBuffer('image/png'));
    const report = {method:'generated earth destination-over, clipped to exact slab silhouette; shared sides reapplied',filledPixels,faceFilledPixels};
    fs.writeFileSync(`${dir}/normalization.json`,JSON.stringify(report,null,2)+'\n');
    console.log(type,report);
  }
})();
