# Paragon art brief (for the imagegen pass)

Eight new miniatures, one per track, in **one** transparent PNG atlas: `assets/paragons.png`. The game loads it automatically if it exists and falls back to a procedural placeholder if not. No code changes are needed to drop it in.

If a general tile and animation spec exists in this repo (`docs/`), follow it too. Where the two disagree on style, the general spec wins; the layout contract below is what the renderer needs.

## Layout contract (what the renderer assumes)

- **Atlas:** 4 columns × 2 rows of **square** cells, transparent RGBA. Suggested size 2048 × 1024 (512 px cells); any size works if cells stay square.
- **Order** (same as every building atlas): top row power, travel, food, water; bottom row homes, making, reuse, nature.
- **Anchor:** each Paragon stands on the three board hexes it merged. The renderer puts the point where those three hexes meet at **50% across and 62% down** the cell.
- **Scale:** three board hexes side by side span **80% of the cell width**. So the landmark's footprint is roughly the middle half of the cell.
- **Ground:** a single rounded, three-lobed plinth (a clover-shaped island) whose base fits inside an ellipse about **50% of the cell wide** (height × 0.64, the board's isometric squash), centred on the anchor. It sits on top of the town's own grass hexes, and a merge can point either way (one hex behind and two in front, or the reverse), so keep the plinth rounded rather than drawing three sharp hex outlines.
- **Height:** nothing above **8%** of the cell (the crown tip), no ground below **92%**.
- **Background:** zero alpha outside the art. No backdrop, glow cloud, baked shadow, checkerboard, text or border.
- See `docs/paragon-cell-guide.png` for the guide lines on one cell. The green and red outlines are the two ways the three hexes can sit.

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

> Use case: stylized-concept. Production transparent PNG sprite atlas for a cozy isometric town game. EXACTLY 8 independent detailed miniature landmarks, regular 4-column 2-row grid on a wide 2:1 canvas, each cell square. Each landmark stands on one rounded three-lobed clover-shaped ground plinth, centred horizontally, plinth centre 62% down the cell, plinth about 50% of the cell wide, front edge no lower than 92%, tallest point no higher than 8%. Warm detailed painterly 3D game miniature aesthetic matching the attached reference atlases, lovely crisp material detail, cheerful cozy spirit, lit upper-left. Each landmark blends three styles into ONE structure: solarpunk (warm wood, greenery, flowers), technofuturist (white ceramic, gold trim, cyan glass) and gentle magic (purple roofs, amethyst crystals, gold stars, lanterns). Each wears a small gold crown with green, cyan and amethyst jewels at its top. Transparent background outside sprites: zero alpha, no backdrop, no haze or glow outside silhouette, no shadow cloud, no checkerboard. No labels, text, borders or shared scene. Top row left to right (1)…(4), bottom row (5)…(8): [the eight descriptions above].

Attach `assets/buildings-leaf.png`, `buildings-star.png` and `buildings-magic.png` as style references.

## Checking it in the game

1. Save the atlas as `assets/paragons.png`.
2. Open `index.html?mode=cozy&qa=paragon`. It opens a demo town with every track finished and every future learned, and one Paragon already made. The other tracks have a triangle ready to merge.
3. Every Paragon also shows in the field guide card (tap it).
4. Run `npm test`. The art test checks that all atlases load.
5. Add the prompt, size and SHA-256 to `docs/art-provenance.json` and `SHA256SUMS.txt` like the other atlases.
