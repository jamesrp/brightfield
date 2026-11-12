// BRIGHTFIELD per-tile art manifest (art spec v2). See docs/ART-DIRECTION.md.
// A building listed here is drawn from its own PNG; anything not listed keeps
// the v0.9 atlas art. All coordinates are tile pixels on the 1024 x 1536
// canvas (hex centre 512,1130). Paths are relative to assets/tiles/.
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
    'power:0': { src: '0/power.png', emitters: [[634, 466, 1.2], [773, 529, 1.0]] },
    'move:0': { src: '0/move.png' },
    'food:0': { src: '0/food.png' },
    'water:0': { src: '0/water.png' },
    'home:0': { src: '0/home.png', emitters: [[353, 601, 0.6]] },
    'make:0': { src: '0/make.png', emitters: [[312, 606, 0.9], [430, 592, 0.9]] },
    'waste:0': { src: '0/waste.png' },
    'wild:0': { src: '0/wild.png' },
    'power:1': { src: '1/power.png', emitters: [[742, 407, 0.25]] },
    'move:1': { src: '1/move.png' },
    'food:1': { src: '1/food.png' },
    'water:1': { src: '1/water.png' },
    'home:1': { src: '1/home.png', emitters: [[270, 609, 0.2], [512, 566, 0.2], [758, 525, 0.2]] },
    'make:1': { src: '1/make.png' },
    'waste:1': { src: '1/waste.png' },
    'wild:1': { src: '1/wild.png' },
    'power:2': { src: '2/power.png' },
    'move:2': { src: '2/move.png' },
    'food:2': { src: '2/food.png' },
    'water:2': { src: '2/water.png' },
    'home:2': { src: '2/home.png' },
    'make:2': {"src":"2/make.png","actors":[{"sprite":"robot-arm","at":[630,1157],"sway":1.5,"period":7}]},
    'waste:2': { src: '2/waste.png' },
    'wild:2': { src: '2/wild.png' },
    'power:star': { src: 'star/power.png' },
    'move:star': { src: 'star/move.png' },
    'food:star': {"src":"star/food.png","actors":[{"sprite":"lift-platform","at":[750,760],"bob":190,"period":12}]},
    'water:star': { src: 'star/water.png' },
    'home:star': { src: 'star/home.png' },
    'make:star': { src: 'star/make.png' },
    'waste:star': { src: 'star/waste.png' },
    'wild:star': { src: 'star/wild.png' },
    'power:leaf': { src: 'leaf/power.png' },
    'move:leaf': { src: 'leaf/move.png' },
    'food:leaf': { src: 'leaf/food.png' },
    'water:leaf': { src: 'leaf/water.png' },
    'home:leaf': { src: 'leaf/home.png' },
    'make:leaf': {"src":"leaf/make.png","actors":[{"sprite":"repair-wheel","at":[845,1207],"spin":0.07}]},
    'waste:leaf': { src: 'leaf/waste.png' },
    'wild:leaf': { src: 'leaf/wild.png' },
    'power:magic': { src: 'magic/power.png' },
    'move:magic': { src: 'magic/move.png' },
    'food:magic': { src: 'magic/food.png' },
    'water:magic': { src: 'magic/water.png' },
    'home:magic': { src: 'magic/home.png' },
    'make:magic': {"src":"magic/make.png","actors":[{"sprite":"forge-flame","at":[596,1102],"pulse":0.22,"period":3.6}]},
    'waste:magic': {"src":"magic/waste.png","actors":[{"sprite":"transmutation-orb","at":[522,944],"spin":0.025,"bob":3,"period":8}]},
    'wild:magic': { src: 'magic/wild.png' },
  },
  sprites: {
    "robot-arm": {
      "src": "actors/robot-arm.png",
      "anchor": [
        58,
        191
      ]
    },
    "repair-wheel": {
      "src": "actors/repair-wheel.png",
      "anchor": [
        63,
        63
      ]
    },
    "lift-platform": {
      "src": "actors/lift-platform.png",
      "anchor": [
        49,
        24
      ]
    },
    "forge-flame": {
      "src": "actors/forge-flame.png",
      "anchor": [
        62,
        78
      ]
    },
    "transmutation-orb": {
      "src": "actors/transmutation-orb.png",
      "anchor": [
        82,
        83
      ]
    }
  },
  travellers: {},
};
