// BRIGHTFIELD per-tile art manifest (art spec v2). See docs/ART-DIRECTION.md.
// A building listed here is drawn from its own PNG; anything not listed keeps
// the v0.9 atlas art. All coordinates are tile pixels on the 1024 x 1536
// canvas (hex centre 512,1040). Paths are relative to assets/tiles/.
//
// Example entry (delete the leading // to use):
//   tiles: {
//     'food:0': {
//       src: '0/food.png',                       // required, 1024 x 1536 RGBA
//       glow: '0/food-glow.png',                 // optional emissive layer, same canvas
//       emitters: [[700, 760, 1.4]],             // smoke: [x, y, strength]
//       actors: [
//         { sprite: 'tractor', path: [[300, 1180], [640, 1250]], period: 9 },      // drives back and forth
//         { sprite: 'windmill-sails', at: [760, 520], spin: 0.15 },                 // turns per second
//         { sprite: 'flag', at: [420, 300], sway: 6, period: 3 },                   // degrees
//       ],
//     },
//   },
//   sprites: { tractor: { src: 'actors/tractor.png', anchor: [96, 150] } },     // anchor = ground point, sprite px
//   travellers: { '0': 'cart', '1': 'sooty-car', '2': 'ev', leaf: 'garden-tram', star: 'maglev-pod', magic: 'wisp-lantern' },
window.BF_TILE_ART = window.BF_TILE_ART || {
  version: 2,
  tiles: {
    'power:0': { src: '0/power.png', emitters: [[634, 376, 1.2], [773, 439, 1.0]] },
    'move:0': { src: '0/move.png' },
    'food:0': { src: '0/food.png' },
    'water:0': { src: '0/water.png' },
    'home:0': { src: '0/home.png', emitters: [[353, 511, 0.6]] },
    'make:0': { src: '0/make.png', emitters: [[312, 516, 0.9], [430, 502, 0.9]] },
    'waste:0': { src: '0/waste.png' },
    'wild:0': { src: '0/wild.png' },
  },
  sprites: {},
  travellers: {},
};
