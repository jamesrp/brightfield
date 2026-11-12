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
    'power:0': {"src":"0/power.png","emitters":[[634,466,1.2],[773,529,1]],"actors":[{"sprite":"coal-wagon","path":[[455,1378],[668,1305]],"period":10,"face":"none"}]},
    'move:0': {"src":"0/move.png","actors":[{"sprite":"horse-cart","path":[[300,1352],[540,1322],[760,1288]],"period":10}]},
    'food:0': {"src":"0/food.png","actors":[{"sprite":"tractor","path":[[513,1406],[652,1340],[723,1265]],"period":12}]},
    'water:0': { src: '0/water.png' },
    'home:0': { src: '0/home.png', emitters: [[353, 601, 0.6]] },
    'make:0': {"src":"0/make.png","emitters":[[312,606,0.9],[430,592,0.9]],"actors":[{"sprite":"mill-wheel-mount","at":[218,1173]},{"sprite":"mill-waterwheel","at":[218,1173],"spin":0.055}]},
    'waste:0': { src: '0/waste.png' },
    'wild:0': { src: '0/wild.png' },
    'power:1': { src: '1/power.png', emitters: [[742, 407, 0.25]] },
    'move:1': {"src":"1/move.png","actors":[{"sprite":"motor-car","path":[[510,1400],[590,1325],[675,1245]],"period":8}]},
    'food:1': { src: '1/food.png' },
    'water:1': { src: '1/water.png' },
    'home:1': { src: '1/home.png', emitters: [[270, 609, 0.2], [512, 566, 0.2], [758, 525, 0.2]] },
    'make:1': { src: '1/make.png' },
    'waste:1': { src: '1/waste.png' },
    'wild:1': { src: '1/wild.png' },
    'power:2': {"src":"2/power.png","actors":[{"sprite":"turbine-rotor","at":[320,366],"spin":0.08},{"sprite":"turbine-rotor-small","at":[653,613],"spin":0.1}]},
    'move:2': {"src":"2/move.png","actors":[{"sprite":"electric-car","path":[[425,1355],[570,1277],[770,1190]],"period":9}]},
    'food:2': { src: '2/food.png' },
    'water:2': { src: '2/water.png' },
    'home:2': { src: '2/home.png' },
    'make:2': { src: '2/make.png' },
    'waste:2': { src: '2/waste.png' },
    'wild:2': { src: '2/wild.png' },
    'power:star': { src: 'star/power.png' },
    'move:star': {"src":"star/move.png","actors":[{"sprite":"maglev-pod","path":[[160,1110],[540,981]],"period":10,"face":"none"}]},
    'food:star': { src: 'star/food.png' },
    'water:star': { src: 'star/water.png' },
    'home:star': { src: 'star/home.png' },
    'make:star': { src: 'star/make.png' },
    'waste:star': { src: 'star/waste.png' },
    'wild:star': { src: 'star/wild.png' },
    'power:leaf': {"src":"leaf/power.png","actors":[{"sprite":"sun-mirror","at":[165,898],"sway":1.5,"period":12},{"sprite":"sun-mirror","at":[500,1095],"sway":1.4,"period":11},{"sprite":"sun-mirror","at":[873,940],"sway":1.3,"period":10}]},
    'move:leaf': {"src":"leaf/move.png","actors":[{"sprite":"garden-tram","path":[[340,1320],[410,1280],[465,1225],[500,1165],[555,1117]],"period":10,"face":"none"}]},
    'food:leaf': { src: 'leaf/food.png' },
    'water:leaf': { src: 'leaf/water.png' },
    'home:leaf': { src: 'leaf/home.png' },
    'make:leaf': { src: 'leaf/make.png' },
    'waste:leaf': { src: 'leaf/waste.png' },
    'wild:leaf': { src: 'leaf/wild.png' },
    'power:magic': { src: 'magic/power.png' },
    'move:magic': {"src":"magic/move.png","actors":[{"sprite":"lantern-wisp","path":[[345,1170],[300,1220],[307,1270],[368,1336]],"period":12,"bob":6,"bobPeriod":4}]},
    'food:magic': { src: 'magic/food.png' },
    'water:magic': { src: 'magic/water.png' },
    'home:magic': { src: 'magic/home.png' },
    'make:magic': { src: 'magic/make.png' },
    'waste:magic': { src: 'magic/waste.png' },
    'wild:magic': { src: 'magic/wild.png' },
  },
  sprites: {
    "turbine-rotor": {
      "src": "actors/turbine-rotor.png",
      "anchor": [
        260,
        260
      ]
    },
    "turbine-rotor-small": {
      "src": "actors/turbine-rotor-small.png",
      "anchor": [
        168,
        168
      ]
    },
    "mill-waterwheel": {
      "src": "actors/mill-waterwheel.png",
      "anchor": [
        128,
        128
      ]
    },
    "mill-wheel-mount": {
      "src": "actors/mill-wheel-mount.png",
      "anchor": [
        120,
        62
      ]
    },
    "tractor": {
      "src": "actors/tractor.png",
      "anchor": [
        96,
        135
      ]
    },
    "coal-wagon": {
      "src": "actors/coal-wagon.png",
      "anchor": [
        152,
        200
      ]
    },
    "horse-cart": {
      "src": "actors/horse-cart.png",
      "anchor": [
        92,
        94
      ]
    },
    "motor-car": {
      "src": "actors/motor-car.png",
      "anchor": [
        69,
        95
      ]
    },
    "electric-car": {
      "src": "actors/electric-car.png",
      "anchor": [
        71,
        95
      ]
    },
    "sun-mirror": {
      "src": "actors/sun-mirror.png",
      "anchor": [
        72,
        57
      ]
    },
    "garden-tram": {
      "src": "actors/garden-tram.png",
      "anchor": [
        116,
        163
      ]
    },
    "garden-bike": {
      "src": "actors/garden-bike.png",
      "anchor": [
        82,
        168
      ]
    },
    "maglev-pod": {
      "src": "actors/maglev-pod.png",
      "anchor": [
        87,
        82
      ]
    },
    "lantern-wisp": {
      "src": "actors/lantern-wisp.png",
      "anchor": [
        112,
        90
      ]
    }
  },
  travellers: {"0":"horse-cart","1":"motor-car","2":"electric-car","leaf":"garden-bike","star":"maglev-pod","magic":"lantern-wisp"},
};
