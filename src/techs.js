// BRIGHTFIELD tech cards: cool real / sci-fi / solarpunk names + a short kid-followable explanation.
// name: what the card calls it. line: what it is (real or fictional). town: what it changes in YOUR town.
// Runs in the browser (window.TECHS) and Node (require) so tests can check every card exists.
(function (root) {
  'use strict';
  const T = {
    power: {
      0: { name: 'Coal Plant', line: 'Burns coal (black rocks dug from the ground) to make electricity, and lots of smoke.', town: 'Lots of cheap power, so factories love it. But its smoke dims the sun, and homes next door cough.' },
      1: { name: 'Gas Turbine', line: 'Burns natural gas. Much less smoke than coal, but it still puts out carbon dioxide, an invisible gas that warms the planet.', town: 'Still cheap power that factories love, with less smoke than coal. Homes still don\u2019t want it next door.' },
      2: { name: 'Wind Turbines', line: 'Giant windmills. Wind spins the blades and that spinning makes electricity.', town: 'No smoke at all! They love open meadows and fields, but whoosh too loudly for homes.' },
      leaf: { name: 'Sun Mirror Tower', line: 'Rows of mirrors aim sunlight at one tall tower. The heat makes electricity, and a tank of hot melted salt keeps it going after sunset.', town: 'Cleans the air. Quiet enough that homes like having it next door.' },
      star: { name: 'Fusion Reactor', line: 'Scientists are learning to squeeze tiny hydrogen atoms together into helium, the way the sun does. Power stations like these are not ready yet.', town: 'Cleans the air, and it\u2019s quiet, so homes like it next door.' },
    },
    move: {
      0: { name: 'Horse Stable', line: 'Before cars, people rode horses and pulled carts with them.', town: 'Homes like a ride nearby. A little dusty and smelly.' },
      1: { name: 'Motor Garage', line: 'Cars with petrol engines that puff smoke out of a pipe at the back.', town: 'Faster rides, but more smoke than the horses!' },
      2: { name: 'Charging Hub', line: 'Electric cars plug in here, like charging a tablet, and drive with no smoke.', town: 'No more smoke from rides, as long as the town\u2019s electricity is clean too.' },
      leaf: { name: 'Garden Tram', line: 'A street train that carries lots of people, with plants growing on its roof.', town: 'Cleans the air. It has a garden growing on its roof.' },
      star: { name: 'Maglev Express', line: 'Magnets lift the train so it floats above the track and zooms.', town: 'Cleans the air and zooms people around town.' },
    },
    food: {
      0: { name: 'Tractor Farm', line: 'A big field where a smoky tractor ploughs and plants the crops.', town: 'Makes food but puffs smoke. Flies from a dump next door bug the crops.' },
      1: { name: 'Orchard', line: 'Rows of fruit trees. People climb ladders to pick the apples.', town: 'Less smoke. Homes now love fresh fruit, and fallen fruit can become compost.' },
      2: { name: 'Glasshouse', line: 'A glass building that keeps plants warm so food grows even in winter.', town: 'No smoke. Farms love compost from the compost yard.' },
      leaf: { name: 'Food Forest', line: 'A forest where almost every plant is food: nut trees, berry bushes and herbs.', town: 'Cleans the air and feeds the bees.' },
      star: { name: 'Aeroponic Stack', line: 'Plants grow with roots in a fine water mist. Indoor farms use lamps and need electricity.', town: 'Cleans the air and grows lots of food in a small space.' },
    },
    water: {
      0: { name: 'Deep Well', line: 'A deep hole in the ground. You lower a bucket on a rope to pull up water.', town: 'Plants and animals like water nearby. No smoke: a bucket on a rope needs no fuel.' },
      1: { name: 'Water Tower', line: 'A big tank up high. Pumps fill it, then water flows down the pipes by itself to every tap.', town: 'Pipes now reach every tap, and they can reach a glasshouse too.' },
      2: { name: 'Rain Garden', line: 'A low garden that soaks up rain so streets don\u2019t flood and the water stays clean.', town: 'Clean water for crops and animals.' },
      leaf: { name: 'Living Wetland', line: 'A marshy pond with reeds. The plants clean the water and ducks live there.', town: 'Cleans the air. Animals come to drink and swim.' },
      star: { name: 'Kelp Bioreactors', line: 'Scientists grow seaweed in tanks to capture nutrients and carbon dioxide. It does not turn salt water into drinking water.', town: 'In this imagined town, living water systems earn a clean-air bonus.' },
    },
    home: {
      0: { name: 'Chimney Cottage', line: 'A little house heated by burning wood or coal in a fireplace.', town: 'Puffs chimney smoke. Likes parks, rides and good neighbours.' },
      1: { name: 'Terrace Houses', line: 'Houses joined side by side in a row, so they keep each other warm.', town: 'Less smoke than the cottages.' },
      2: { name: 'Living-Roof Flats', line: 'Apartments stacked high with gardens on the roof and on the balconies.', town: 'No smoke from homes any more.' },
      leaf: { name: 'Canopy Village', line: 'Homes built in and around big trees, joined by bridges.', town: 'Cleans the air. Every window looks out on leaves.' },
      star: { name: 'Arcology Spire', line: 'An imagined city-sized tower brings homes, shops and gardens close together.', town: 'Cleans the air and fits lots of families in a small space.' },
    },
    make: {
      0: { name: 'Smokestack Mill', line: 'A factory with tall chimneys that puff smoke while machines make things.', town: 'Makes lots of smoke. Homes don\u2019t want it next door.' },
      1: { name: 'Workshop', line: 'A smaller place where people build and fix things with tools.', town: 'Less smoke. Homes don\u2019t mind it any more. Loves recycled stuff.' },
      2: { name: 'Robot Foundry', line: 'Robot arms help people build things carefully and quickly.', town: 'No smoke at all.' },
      leaf: { name: 'Repair Guild', line: 'Bring broken toys and bikes here; neighbours help you fix them instead of throwing them away.', town: 'Cleans the air. Less stuff ends up in the trash.' },
      star: { name: 'Nanofab Spire', line: 'An imagined factory where tiny machines build almost anything, one atom at a time.', town: 'Cleans the air and makes things without waste.' },
    },
    waste: {
      0: { name: 'Landfill', line: 'A big pile where all the trash goes. It smells and attracts flies.', town: 'Homes hate the smell. Farms hate the flies.' },
      1: { name: 'Recycling Depot', line: 'Old cans, bottles and paper get sorted so they can be made into new things.', town: 'No more smell or flies. Workshops love the recycled metal.' },
      2: { name: 'Compost Yard', line: 'Food scraps and leaves rot into rich soil called compost.', town: 'No smoke. Farms LOVE compost: it helps food grow.' },
      leaf: { name: 'Mycelium Grid', line: 'Fungi can break down some waste. A whole-town mushroom recycling grid is still an idea.', town: 'Cleans the air. Farms still love the compost.' },
      star: { name: 'Matter Reclaimer', line: 'An imagined machine takes old things apart and makes almost anything from their pieces.', town: 'Cleans the air. Nothing gets thrown away.' },
    },
    wild: {
      0: { name: 'Meadow', line: 'A patch of grass with a few small trees. Wild land where animals can live.', town: 'Homes like nature next door. Animals visit when the air is clean.' },
      1: { name: 'City Park', line: 'Grass, trees, flowers and a bench, for people and animals to share.', town: 'Cleans more smoke. Butterflies may visit.' },
      2: { name: 'Old Growth', line: 'An old forest with many layers of trees. Leaves absorb carbon dioxide and release oxygen.', town: 'Cleans even more smoke. Foxes and deer may come.' },
      leaf: { name: 'Wildflower Expanse', line: 'A field full of wild flowers that bees and butterflies love.', town: 'Cleans lots of smoke. A home for many animals.' },
      star: { name: 'Biosphere Dome', line: 'A giant glass bubble full of plants, with perfect weather inside.', town: 'Cleans lots of smoke. Plants grow all year round.' },
    },
  };
  // Magic is an uplifting fantasy choice, never a claim about working technology.
  const MAGIC = {"power": ["Crystal Beacon", "An imagined crystal tower gathers gentle starlight to power the town."], "move": ["Portal Pavilion", "An imagined doorway folds space so neighbours can step safely across town."], "food": ["Enchanted Orchard", "An enchanted orchard grows fruit with sparkling spells. This is a fantasy garden."], "water": ["Moonwell", "A magical well draws clear water from moonbeams. This is fantasy, not real water treatment."], "home": ["Starlight Village", "Cozy wizard homes float among purple roofs and warm starlight. This is an imagined village."], "make": ["Spellforge", "An imagined workshop shapes useful things with friendly spells and floating tools."], "waste": ["Transmutation Garden", "A fantasy garden turns old objects into new treasures with transmutation spells."], "wild": ["Luminous Grove", "A fantasy woodland glows with luminous trees, flowers and gentle woodland magic."]};
  for (const axis of Object.keys(MAGIC)) T[axis].magic = {name: MAGIC[axis][0], line: MAGIC[axis][1], town: "Cleans the air in this imagined town. Magic links favour homes, water and reuse.", status: "Imagine"};
  // Labels describe the real-world technology, not which game era it belongs to.
  const FUTURE_STATUS = {
    power: {leaf:'Today',star:'Emerging'}, move:{leaf:'Today',star:'Today'},
    food:{leaf:'Today',star:'Today'}, water:{leaf:'Today',star:'Emerging'},
    home:{leaf:'Imagine',star:'Imagine'}, make:{leaf:'Today',star:'Imagine'},
    waste:{leaf:'Imagine',star:'Imagine'}, wild:{leaf:'Today',star:'Today'},
  };
  Object.keys(T).forEach(axis => Object.keys(T[axis]).forEach(k => {
    T[axis][k].status = k === 'magic' ? 'Imagine' : FUTURE_STATUS[axis][k] || 'Today';
  }));
  function statusNote(status, variant) {
    if (variant === 'magic') return 'A make-believe magical idea, not a real-world technology.';
    return status === 'Imagine' ? 'A possible future or a science-fiction idea.' : status === 'Emerging' ? 'Being explored and tested. Not yet an everyday town system.' : 'People already use versions of this in the real world.';
  }
  function futureBonus(variant) {
    return variant === 'magic' ? '+1 sunbeam beside homes, water or reuse.' : variant === 'star' ? '+1 sunbeam beside power, travel, making or homes.' : '+1 sunbeam beside nature, food or water.';
  }
  function tech(axis, era, variant) { const k = era === 3 ? variant || 'leaf' : era; return T[axis][k]; }
  // v0.12 Paragons: one per track, made by merging its Nature, Future and Magic buildings.
  // Each one blends all three ways of living: growing things (Nature), clever machines (Future) and wonder (Magic).
  // name / line: what the card says. weave: how the three futures became one (for parents and the art brief).
  const PARAGONS = {
    power: { name: 'The Everlight', line: 'A great tree with mirror leaves catches the sun and feeds it to a tiny star held inside a giant crystal. The crystal keeps shining all night.', weave: 'Sun mirrors grow as leaves; the fusion star sits in the beacon crystal; daylight is stored as starlight.' },
    move: { name: 'Anywhere Station', line: 'A floating train glides around a ring of flowering track, through a magic doorway, and comes out anywhere in town.', weave: 'The maglev ring is a living garden rail; the portal is the station gate; the tram roof garden blooms on every carriage.' },
    food: { name: 'The Everfeast Tree', line: 'A giant fruit tree grows up through a spiral of misty glass gardens. Its glowing fruit grows back as soon as you pick it.', weave: 'The food forest is the trunk; the aeroponic tiers spiral round it as glass rings; the enchanted fruit glows and regrows.' },
    water: { name: 'The Moonspring', line: 'By moonlight, water climbs up glass towers full of kelp, then tumbles down steps of reeds and lilies, cleaner at every step.', weave: 'Kelp bioreactor towers lift the water; the moonwell makes it flow upward; the wetland terraces clean it on the way down.' },
    home: { name: 'The Skyhearth', line: 'A whole neighbourhood lives in one enormous tree: treehouses, glass sky-homes and little wizard towers, joined by bridges and floating lanterns.', weave: 'The canopy village tree is the frame; arcology glass balconies spiral up the trunk; starlight-village turrets crown the branches.' },
    make: { name: 'The Wonderworks', line: 'Neighbours, tiny robot helpers and floating magic tools fix and build things together, so nothing is ever wasted.', weave: 'The repair guild is the open workshop; the nanofab crystal and the spellforge fire are one shared furnace; tools float to whoever needs them.' },
    waste: { name: 'The Phoenix Ring', line: 'A ring of giant glowing mushrooms and a golden phoenix machine turn broken old things into brand-new treasures.', weave: 'The mycelium grid becomes a fairy ring; the matter reclaimer is the phoenix\u2019s glowing heart; transmutation sparks fly from its wings.' },
    wild: { name: 'The Wildheart', line: 'An ancient glowing tree grows up through a glass dome that has opened like a flower. Wildflowers spill out, and every animal is welcome.', weave: 'The biosphere dome opens into petals; the luminous grove tree rises through it; the wildflower expanse spills over the rim.' },
  };
  for (const a of Object.keys(PARAGONS)) Object.assign(PARAGONS[a], { status: 'Imagine', town: 'Made by merging your Nature, Future and Magic ' + {power:'power plants',move:'stations',food:'farms',water:'waterworks',home:'homes',make:'workshops',waste:'reuse yards',wild:'wild places'}[a] + '. Anything you build touching it earns double sunbeams.' });
  const TECHS = { T, tech, statusNote, futureBonus, FUTURE_STATUS, PARAGONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = TECHS;
  else root.TECHS = TECHS;
})(typeof window !== 'undefined' ? window : globalThis);
