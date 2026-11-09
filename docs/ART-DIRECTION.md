# Brightfield art direction: tile spec v2 and animation

This brief is for whoever paints Brightfield's buildings (currently Codex with imagegen).
It says what the tiles should look like, the exact geometry each PNG must have, how
animation will work, and how each round is checked. The game code already supports
everything described here; until a tile is listed in `assets/tiles/manifest.js`, the
game keeps drawing the v0.9 atlas art, so tiles can land one at a time.

Brightfield is a gentle hex town-builder for an 8-year-old. The town goes from
smoky Victorian industry (Stage 0) through mid-century and modern tech (Stages 1–2)
to one of three futures: **Nature** (`leaf`, solarpunk garden town), **Future**
(`star`, gleaming technofuturist) and **Magic** (`magic`, purple-and-gold fantasy).
Each stage has 8 buildings, one per type: power, move (travel), food, water, home,
make, waste (reuse), wild (nature). Paragons (one merged crown building per type,
being designed on another branch) follow exactly the same spec.

## 1. What is wrong today

Render `npm run art:preview` and open `tools/art/out/gallery.png` and
`tools/art/out/closeup-*.png` to see all of this.

1. **The ground slabs are the wrong shape.** The board draws pointy-top hexes (a
   vertex at the top and bottom, straight vertical sides). The v0.9 tiles paint an
   octagon or a flat-bottomed slab, narrower than the board hex and sitting higher
   than it, so every building looks like a small plate resting on a bigger plate,
   with the board's green rim showing around it.
2. **The slabs are not consistent.** Stage 2 slabs are about 14% smaller than
   Stage 0; edge materials vary (dirt, grass, stone, gold trim) and the slab
   thickness varies tile to tile, so a town reads as a patchwork.
3. **Animation does not match the painting.** Moving things were drawn by code as
   flat boxes and circles on top of painted vehicles (now removed in this branch),
   travellers between tiles are flat boxes, and smoke, petals, sparkles and critters
   are flat vector shapes next to painterly art.
4. **Some art overflows.** Several Nature tiles have foliage spilling past the hex
   sides, which overlaps neighbours on the board.

The painting itself (palette, detail, charm, lighting) is good. Keep it. The job is
to put the same art on the right base, then make the motion painted too.

## 1a. The board: plots and lanes

Decided with James: every building fills a **full hex plot**, and plots are
separated by **lanes** (little streets) rather than sitting edge to edge. The board
code already draws this (see `src/art.js` `ART.BOARD` and `drawLanes` in
`src/main.js`):

- Each plot is a hex of radius 0.88 board units, raised a low **kerb** (0.06
  units) above the lanes. The gaps between plots are the lanes, and the whole
  board stands on a plinth.
- The lane surface follows the travel technology the player has: dirt cart track
  (Stage 0), cobbles (1), tarmac with a dashed line (2), gravel garden path with
  flowers (Nature), pale guideway with a teal light line (Future), violet
  moonstone with twinkling gold glints (Magic).
- Travellers (the little vehicles) now drive along the lanes from the travel
  building to homes, farms and workshops, and buildings in front hide them.

Why lanes and not thin borders: with thin borders the plots touch and the town
reads as one busy carpet; lanes give each building its own clear plot, make the
grid obvious for a child placing tiles, show the age through the roads, and give
the travellers somewhere to drive. Buildings are about 5% smaller than with
borders, which still reads well on a phone.

So the tiles do **not** paint roads around their edges; the board does that. A
tile paints its plot: the full hex top face plus a thin kerb. Paths or roads on a
plot may run right out to the plot edge so they meet the lane.

## 2. Target look

- Same style as the v0.9 tiles: cosy, detailed isometric miniatures, warm light,
  rich but soft colour, clean readable silhouettes at small size (a tile is often
  only 90–140 px wide on a phone).
- Light from the upper left, soft shadows falling to the lower right, no cast
  shadow outside the tile.
- Camera: the board's own view. Top face is the hex squashed to 0.64 of its width
  (about 40° elevation). Buildings must sit in that same perspective; do not paint
  them straight-on or from a steeper angle.
- Every building sits on a **full** hex plot: the grass/ground top face reaches all
  six edges of the hex, and the two front side faces show a thin kerb (stone,
  hedge, metal or gold trim depending on the age) where the plot meets the lane.
- One building's worth of content per tile. Keep the main structure in the
  middle; small props (carts, crates, benches, flowers) fill the rest of the top
  face so the hex never looks empty.
- Stage reading at a glance: Stage 0 brick, soot, timber; Stage 1 brick and early
  machines, cleaner; Stage 2 modern, green tech; Nature living wood, gardens,
  water; Future white/teal/gold glass and light; Magic purple stone, gold, glowing
  crystals.
- No text, no logos, no UI, no frame, no drop shadow under the slab.

## 3. Exact tile geometry (spec v2)

Every tile is one PNG:

| Property | Value |
| --- | --- |
| Canvas | **1024 × 1536 px**, RGBA, fully transparent background |
| Hex | pointy-top: vertices at top and bottom, vertical left and right sides |
| Hex centre (top face) | **(512, 1130)** |
| Top face | half-width **480** (x 32 to 992), half-height **354.7** (y 775.3 to 1484.7) |
| Top face vertices | (512, 775.3) (992, 952.7) (992, 1307.4) (512, 1484.7) (32, 1307.4) (32, 952.7) |
| Side faces (kerb) | the two front faces only, straight down **37.8 px** |
| Slab bottom outline | (32, 1345.2) → (512, 1522.5) → (992, 1345.2) |
| Headroom | nothing above **y = 24** |
| Keep region | nothing left of x = 32, right of x = 992, or below the slab bottom outline |
| Above the slab | anything tall (towers, trees, turbine blades) may rise above the face, inside the x 32–992 columns |

On the board the game scales the whole PNG uniformly so the top face lands exactly
on the board plot (scale = plot half-width / 480) and the kerb drops exactly to the
lane. So a tile that matches these numbers sits perfectly, with no plate-on-plate.
The kerb depth comes from `ART.BOARD` (37.8 px = 0.06 / (0.88 × √3/2) × 480); if
the board geometry ever changes, `tools/art/spec.cjs` and the templates follow it.

### Templates (in `assets/tiles/_template/`)

- `guide.png`: the slab, the exact outline in red, the allowed columns and headroom
  in blue dashes, and the centre mark. For looking at; never paint over it.
- `base-plain.png`: an empty grass-topped slab at the exact geometry. **Use this as
  the reference / edit image** when generating, so the slab comes out the right
  shape and size.
- `edit-mask.png`: an OpenAI-style edit mask for `base-plain.png`: transparent where
  the model may paint (the whole top face and the sky above it), opaque over the
  two side faces so they survive untouched.

Regenerate the templates with `npm run art:templates` (geometry lives in
`tools/art/spec.cjs`, the single source of truth, mirrored in `src/tile-art.js`).

### Kerbs by family

So a whole town reads as one board, the two kerb faces should be identical within a
family. Paint one plain slab per family into `assets/tiles/_slab/<family>.png`
(same 1024 × 1536 canvas, side faces only matter) and paste it onto every tile with
`fit-tile --sides`:

| Family | Stages | Side faces |
| --- | --- | --- |
| `earth` | 0, 1, 2 | grey-brown kerbstones under a thin grass lip |
| `garden` | leaf | a low clipped hedge or mossy log edging |
| `alloy` | star | white/pearl edge with a thin teal light line |
| `arcane` | magic | violet stone blocks with a gold band |

The top face's rim (the strip where it meets the sides) should be the same grass /
material on every tile of a family.

## 4. Workflow for each tile

1. Generate with imagegen, using `base-plain.png` + `edit-mask.png` as the edit
   inputs (or `base-plain.png` as a reference image), transparent background,
   1024 × 1536. Prompt with the target look above plus the building description
   from the v0.9 prompts in `docs/art-provenance.json`.
2. Snap it to the spec:
   `npm run art:fit -- raw.png assets/tiles/<stage>/<type>.png --sides assets/tiles/_slab/<family>.png`
   This finds the painted slab, scales it to exactly 960 px wide, puts its bottom on
   y 1522.5, clears anything outside the keep region, and pastes the family sides.
   It prints how many pixels it clipped; "LOTS clipped" means regenerate.
3. Check it: `npm run art:check -- assets/tiles/<stage>/<type>.png` (geometry only),
   then list it in `assets/tiles/manifest.js` and run `npm run art:check` (every
   listed tile plus the manifest).
4. Look at it in the game: `npm run art:preview` writes the gallery, a full town per
   stage, close-ups and animation strips into `tools/art/out/` (git-ignored).
5. Post the gallery and the relevant close-ups on the GitHub issue for review.

File layout: `assets/tiles/<stage>/<type>.png`, for example `assets/tiles/0/food.png`,
`assets/tiles/leaf/wild.png`. Actor and traveller sprites go in
`assets/tiles/actors/`. Glow layers sit next to their tile as `<type>-glow.png`.

## 5. Animation: layered, not frame-by-frame

Do not make frame sequences or sprite sheets of whole tiles: they are heavy, hard to
keep consistent, and would drift from the static art. Instead each tile is built
from layers the game moves:

1. **Base tile** (static PNG, as above). Paint the scene **without** the things that
   will move: leave the road empty where the tram will run, leave the windmill
   tower without its sails.
2. **Actor sprites**: small separate transparent PNGs, painted in the same style,
   light and scale as the tile, that the game moves along a path, spins, sways,
   bobs or pulses. Examples: a horse and cart, a tram, windmill sails, a turbine
   rotor, a flag, a waterwheel, a bird, a lantern flame.
3. **Glow layer** (optional): a second 1024 × 1536 PNG, black/transparent except
   the parts that emit light (windows, crystals, screens, lanterns), painted as
   soft light. The game adds it on top and lets it breathe; at night it shows fully.
4. **Effects already in code**: chimney smoke is placed with `emitters` (a point and
   a strength). Round 3 replaces the flat smoke, sparkles, petals and critters with
   painted sprites; the code hooks for those will be added before that round.

**Important:** when a tile is listed in the manifest, the old code-drawn effects for
that tile (turbine spin, tram lights, crystal glow and so on) are no longer drawn.
Each new tile's entry must bring its own actors / glow / emitters for anything
that should move.

### Manifest format (`assets/tiles/manifest.js`)

All coordinates are tile pixels on the 1024 × 1536 canvas. Paths are relative to
`assets/tiles/`.

```js
window.BF_TILE_ART = {
  version: 2,
  tiles: {
    'food:0': {
      src: '0/food.png',                        // required
      glow: '0/food-glow.png',                  // optional, same canvas, glowPeriod: seconds
      emitters: [[700, 760, 1.4]],              // smoke: [x, y, strength]
      actors: [
        { sprite: 'tractor', path: [[300, 1180], [640, 1250]], period: 9 },  // there and back, eased
        { sprite: 'tram', path: [[90, 1100], [930, 1100]], period: 8, mode: 'loop' }, // one way, restarts
        { sprite: 'windmill-sails', at: [760, 520], spin: 0.15 },            // turns per second
        { sprite: 'flag', at: [420, 300], sway: 6, period: 3 },              // degrees
        { sprite: 'duck', at: [600, 1200], bob: 6, period: 2 },              // px up and down
        { sprite: 'lantern-flame', at: [480, 900], pulse: 0.4, period: 2 },  // fades by up to 40%
      ],
    },
  },
  sprites: {
    tractor: { src: 'actors/tractor.png', anchor: [96, 150] }, // anchor = ground point (or pivot), sprite px
  },
  travellers: { '0': 'cart', '1': 'car-1', '2': 'ev', leaf: 'garden-bike', star: 'pod', magic: 'wisp' },
};
```

Rules for actors:

- Paint each actor at the **same pixel scale as the tile** (a car that is 160 px
  long in the tile is 160 px long in its sprite). Sprites face **right**; the game
  flips them for the return trip (`face: 'none'` to disable).
- `anchor` is the sprite's ground point for movers, or the pivot for spinners
  (the hub of the sails).
- A mover's `path` must stay on the top face (the checker enforces this) and should
  follow a road, track, path or water painted in the base tile.
- Keep motion calm: periods of 4–12 s for vehicles, gentle sways. This is a cosy
  game for a child, not a busy one.

Travellers are the little vehicles that drive along roads between tiles. One sprite
per stage, about 120–180 px long at tile scale, facing right, ground point anchor.

### Suggested motion per building type

| Type | Stage 0–2 | Nature | Future | Magic |
| --- | --- | --- | --- | --- |
| power | coal wagon on rails (0), turbine rotors spin (2) | sun mirrors slowly track, glow | reactor core glow + orbiting ring sprite | crystal glow, floating rune ring spins |
| move | horse and cart (0), car in and out of garage (1), EV charging light (2) | garden tram along its track, lanterns | maglev pod glides through the arch | portal swirl glow, a lantern wisp drifts out |
| food | tractor along the field (0), apple picker / basket (1), sprinkler (2) | bees or birds over the food forest | lift platform rising in the stack | glowing fruit pulse, floating fairy light |
| water | well bucket bobs (0), tower flow (1), stream ripple (2) | heron bobs, lily pads | bubbles rising in the tanks | moonwell sparkle glow |
| home | chimney smoke (0, 1), window lights at night | rope bridge lanterns | windows glow | windows and crystal lamps glow |
| make | mill waterwheel spins (0), workshop saw (1), robot arm (2) | repair guild bike wheel | nanolab spire light | forge fire flicker |
| waste | gull over the heap (0), sorting conveyor (1), compost steam (2) | mushroom glow | reclaimer core glow | transmutation orb spins |
| wild | butterflies, swaying tree tops | swaying flowers, butterflies | dome glow, little waterfall | glowing mushrooms, motes |

These are suggestions; pick one or two motions per tile that suit what is painted.

## 6. Per-tile notes for the repaint

All 48 tiles get the new full-hex plot (that is the main fix). On top of that:

- **Stage 2 (all 8):** paint at the same building scale as Stage 0/1; v0.9 Stage 2
  sits smaller on its slab.
- **Leaf (all 8):** keep foliage inside the x 32–992 columns; let trees grow taller
  rather than wider.
- **wild:0 Meadow, wild:1 City Park:** fill the hex edge to edge (they currently look
  sparse at small size); keep a clear focal point (one big tree, a pond, a bench).
- **power:2 Wind Turbines:** paint the towers without rotors; rotors become `spin`
  actors. Full blades must stay inside the columns and headroom.
- **move:0 Horse Stable, move:1 Motor Garage, move:2 Charging Hub, move:leaf Garden
  Tram, move:star Maglev Express:** paint the road / track / bay empty; the horse and
  cart, car, EV, tram and pod become actors.
- **food:0 Tractor Farm:** paint the field without the tractor; tractor is an actor.
- **make:0 Smokestack Mill:** waterwheel as a separate `spin` actor.
- **Magic (all 8):** put glowing crystals, windows and orbs in a glow layer as well
  as in the base, so they can breathe.
- **Future (all 8):** the same for teal light lines and cores.

## 7. Rounds

Each round ends with Codex posting the preview images on the GitHub issue and
Claude reviewing them there. Keep each round to one pull request or one push to a
branch.

1. **Round 1, static tiles.** The four family slabs, then all 48 base tiles to
   spec v2, listed in the manifest with `emitters` for smoke. Start with one stage
   (Stage 0) as a pilot and post it before doing the rest.
2. **Round 2, actors and travellers.** Actor sprites and manifest entries for the
   motions above, and the six traveller sprites.
3. **Round 3, glow and effects.** Glow layers for Future, Magic and night windows;
   painted smoke puffs, sparkles, petals and critters (Claude adds the code hooks
   first). Optional: a small seamless lane texture per age to replace the
   code-drawn lane surface.

## 8. Acceptance checks

A round passes when all of these hold:

- [ ] `npm run art:check` prints `all checks pass` (size, transparency, keep region,
      headroom, slab at least 99.5% solid, slab edges within 3 px of the spec lines,
      manifest valid, actor paths on the top face).
- [ ] `npm test` passes.
- [ ] In `tools/art/out/closeup-*.png` each building fills its plot (no grass rim
      or second plate inside it), every lane between plots stays clear, and nothing
      hangs over a neighbour's plot.
- [ ] Kerb faces are identical across a family.
- [ ] Each building still reads clearly at gallery size (about 150 px wide).
- [ ] Style, palette and light match the rest of the set; nothing looks like a
      different artist.
- [ ] Nothing moving is painted into the base tile as well as drawn as an actor.
- [ ] Actors are in the same style and scale as their tile, and move calmly along
      painted roads / tracks.
- [ ] `docs/ART-PROVENANCE.md` / `docs/art-provenance.json` record the prompts and
      checksums for the new files, as for v0.9.
