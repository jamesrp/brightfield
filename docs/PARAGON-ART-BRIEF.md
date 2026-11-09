# Paragon art brief (for the imagegen pass)

Eight landmarks, one per track. Each comes in **two layouts**, so that is 16 PNGs in `assets/paragons/`. The game picks a file up automatically and draws a procedural placeholder for any that are missing. No code changes are needed to drop them in.

Follow the general tile spec, `docs/ART-DIRECTION.md` (tile spec v2), for style, slab look and the art workflow. A Paragon is three of its hexes merged into one. Where the two disagree on style, the general spec wins; the geometry below is what the renderer needs.

## Geometry

- **Files:** `assets/paragons/<type>-a.png` and `<type>-b.png`, where type is power, move, food, water, home, make, waste or wild.
- **Board:** the town is full hex **plots** with **lanes** (little streets) between them, drawn by the board, not the tiles. See `docs/ART-DIRECTION.md` section 1a and issue #2.
- **Canvas:** **2304 × 2304 px**, RGBA, fully transparent background.
- **Plots:** three **full** spec-v2 plots (pointy-top, top face half-width 480, half-height 354.7, a gold-stone kerb 37.8 px deep), spaced exactly as on the board, so a lane-width gap runs between them.
- **Layout a, one plot behind and two in front:** plot centres (1152, 1278.86), (606.55, 1883.5), (1697.45, 1883.5). Anchor (1152, 1681.95).
- **Layout b, two plots behind and one in front:** plot centres (606.55, 1278.86), (1697.45, 1278.86), (1152, 1883.5). Anchor (1152, 1480.41).
- **Anchor:** the middle of the lane junction between the three plots. The game puts it on the same point of the board, at the same scale as every tile, so the painted plots land exactly on the board's.
- **Keep region:** nothing left of x = 96, right of x = 2208, above y = 24, or below the kerb bottoms.
- **Ground:** the Paragon is one place, so its ground is one raised **plaza**: the three plot tops plus the three lane pieces between them and the little junction in the middle, all at plot height. Paint the plaza as one paved, planted square; nothing of the lanes shows inside it. The outside edges stay plot edges with the kerb down to the board's lanes, like every v2 tile. Paint no roads around the outside: the board's lanes are already there. Paths on the plaza may run out to its edge to meet a lane.
- Templates, made by `node tools/art/paragon-templates.cjs` from `tools/art/paragon-spec.cjs`, are in `assets/paragons/_template/`:
  - `guide-a.png`, `guide-b.png`: the plaza outline, the three plots it joins (dashed, where the lanes would run), allowed columns, headroom and the anchor. For looking at.
  - `base-a.png`, `base-b.png`: a plain plaza at the exact geometry, to use as the reference or edit image.
  - `mask-a.png`, `mask-b.png`: edit masks that keep the kerb and let the model paint the plaza and the sky.
- Paint the landmark once per type, then fit it to both layouts. The building is the same; only the ground under it changes.

## Style

Match the existing atlases (`assets/buildings-leaf.png`, `buildings-star.png`, `buildings-magic.png`): warm, detailed painterly 3D game miniature, crisp material detail, cheerful cozy spirit, lit from the upper left, same camera angle. A Paragon should read as **bigger and more special** than any single building (about 1.5× the height of a future building) but clearly the same world.

**The key: one landmark, not three buildings side by side.** Each Paragon blends all three ethoses into a single idea:

- **Nature (solarpunk):** warm wood, living greenery, flowers, moss, reeds, hand-built craft.
- **Future (technofuturist):** white ceramic, gold trim, cyan glass, clean machines, glowing panels.
- **Magic:** purple and lilac roofs, amethyst crystals, gold stars, lanterns, soft runes, floating motes.

Every Paragon wears a small **gold crown with three jewels (leaf green, sky cyan, amethyst)** at its very top. That crown is how a child spots a Paragon across the town.

## The eight Paragons

1. **Power: The Everlight.** A great living tree whose leaves are sun mirrors (Nature + Future) catches sunlight and feeds it to a tiny fusion star held inside a giant amethyst beacon crystal at the crown of the tree (Future + Magic). Golden light runs down the trunk in thin gold-trimmed ceramic veins. Feels like it keeps shining all night.
2. **Travel: Anywhere Station.** A white-and-gold maglev ring circles the station, its track a flowering garden rail with planters (Nature + Future). A sleek little train with a roof garden glides around it and passes through a purple stone portal arch glowing with runes (Magic). A wooden platform with lanterns where people wait.
3. **Food: The Everfeast Tree.** A giant fruit tree (food forest) grows up through a spiral of misty glass aeroponic rings with gold trim. Its fruit glows softly in lilac and gold like enchanted orchard fruit. Baskets, ladders and a small harvest table at the base.
4. **Water: The Moonspring.** Tall cyan glass towers full of green kelp lift water upward under a crescent moon (Future + Magic: water flowing up). It spills from the top into a moonwell basin with silver runes, then tumbles down terraces of reeds, lilies and stones (Nature), clearer at every step.
5. **Homes: The Skyhearth.** One enormous tree holds a whole neighbourhood: wooden treehouses, white-and-glass arcology balconies spiralling up the trunk, and little purple wizard turrets on the high branches, joined by rope bridges and floating lanterns. Lit windows, laundry lines, a swing.
6. **Making: The Wonderworks.** An open timber workshop (repair guild) wrapped around one shared furnace: a white ceramic nanofab crystal whose flame is purple spellforge fire. Tiny round robot helpers and floating magic tools (hammer, wrench, spool) drift between workbenches covered in mended things.
7. **Reuse: The Phoenix Ring.** A fairy ring of giant glowing mushrooms (mycelium) circles a golden phoenix machine with a cyan glass heart (matter reclaimer). Its wings are gold filigree, and sparkling sparks of transmutation fly from them, turning heaps of old junk into shining new objects.
8. **Nature: The Wildheart.** An ancient glowing grove tree rises through a glass biosphere dome that has opened like a flower, its gold-trimmed panels curling out as petals. Wildflowers spill over the rim. Deer, foxes, birds, rabbits and butterflies are welcome around it.

## Prompt starting point

> Use case: stylized-concept. One transparent 2304 × 2304 PNG of a single detailed miniature landmark for a cozy isometric town game, edited onto the attached base image so it stands on its three-plot plaza exactly; keep the kerb, and paint the plaza as one paved, planted square with no roads around its outside edges. The landmark rises from the middle of the plaza; nothing above 24 px from the top. Warm detailed painterly 3D game miniature aesthetic matching the attached reference atlases, lovely crisp material detail, cheerful cozy spirit, lit upper-left. Each landmark blends three styles into ONE structure: solarpunk (warm wood, greenery, flowers), technofuturist (white ceramic, gold trim, cyan glass) and gentle magic (purple roofs, amethyst crystals, gold stars, lanterns). Each wears a small gold crown with green, cyan and amethyst jewels at its top. Transparent background outside the art: zero alpha, no backdrop, no haze or glow outside the silhouette, no shadow cloud, no checkerboard. No labels or text. [One of the eight descriptions above.]

Attach `base-a.png` (or `base-b.png`) and its mask as the edit inputs, and the Nature, Future and Magic building art as style references.

## Checking it in the game

1. Save the files as `assets/paragons/<type>-a.png` and `<type>-b.png`.
2. Open `index.html?mode=cozy&qa=paragon`. It opens a demo town (in a separate QA save) with The Everlight already made in layout a, and a food triangle in layout b ready to merge.
3. Every Paragon also shows in its field-guide card (tap it).
4. Run `npm test`. `tests/paragon-art-v12.test.cjs` checks the geometry against the board.
5. Add the prompt, size and SHA-256 to `docs/art-provenance.json` and `SHA256SUMS.txt` like the other art.
