# Paragons (v0.12)

Jay asked for a Paragon, like Bloons TD 6's: something above Nature, Future and Magic. In Bloons a Paragon is special because you sacrifice towers to make one, and you only get one. Brightfield upgrades a whole track at once, so "everything becomes a Paragon" would feel samey. Instead, each track gets **one** Paragon, made by merging three buildings, one built in each future.

## How you make one

1. **Finish a track.** Upgrade it to its future as before (Nature, Future or Magic). That first choice still decides the crown.
2. **Learn the other futures.** Tap the finished track's row. It glows violet when you can. Each other future costs **1 idea**. New buildings of that kind now come in the look you just learned. Tap the selected card again (or press its number twice) to switch looks. Every building keeps the look it was built in.
3. **Build a triangle.** Put a Nature, a Future and a Magic building of the same kind so that all three touch each other: a little triangle of hexes. A line of three does not count. The three hexes pulse gold.
4. **Merge.** A prompt opens by itself ("Merge into a Paragon!"). You can also tap any of the three later. Enter merges, Escape waits.

You get one Paragon per track, so up to eight in a town.

## What it does

- **Burst:** +25 sunbeams when it forms.
- **Aura:** any building placed touching the Paragon earns **double** sunbeams (the preview says "×2 Paragon").
- It keeps all three hexes and its kind, so neighbours, groups and demand work exactly as before. Nothing else changes: no new costs, no new rules for towns that never learn a second future.

Why this shape:

- **The sacrifice is real.** Three finished buildings become one, and you spend two ideas to get there, like Bloons.
- **It reads at a glance.** "One of each colour, all touching" is a rule an eight-year-old can say back.
- **Power without breaking the game.** The burst is about two good placements. The aura rewards building around your trophy, which makes the town grow around it rather than shortening the game much.
- **Old towns are safe.** The crown and every existing rule are untouched. Learning is optional and only opens at the end of a track.

## The eight Paragons

Each one is a single place where growing things (Nature), clever machines (Future) and wonder (Magic) became one idea, not three buildings glued together.

| Track | Paragon | Made from | The blend |
|---|---|---|---|
| Power | **The Everlight** | Sun Mirror Tower, Fusion Reactor, Crystal Beacon | A great tree's mirror leaves feed sunlight to a tiny star held in a giant crystal, which keeps shining all night. |
| Travel | **Anywhere Station** | Garden Tram, Maglev Express, Portal Pavilion | A floating train rides a ring of flowering track through a magic doorway and comes out anywhere in town. |
| Food | **The Everfeast Tree** | Food Forest, Aeroponic Stack, Enchanted Orchard | A fruit tree grows up through a spiral of misty glass gardens; its glowing fruit grows back as soon as it is picked. |
| Water | **The Moonspring** | Living Wetland, Kelp Bioreactors, Moonwell | By moonlight water climbs glass kelp towers, then tumbles down reed and lily steps, cleaner at every step. |
| Homes | **The Skyhearth** | Canopy Village, Arcology Spire, Starlight Village | A whole neighbourhood in one enormous tree: treehouses, glass sky-homes and wizard turrets, joined by bridges and lanterns. |
| Making | **The Wonderworks** | Repair Guild, Nanofab Spire, Spellforge | Neighbours, tiny robots and floating magic tools share one furnace and fix things together, so nothing is wasted. |
| Reuse | **The Phoenix Ring** | Mycelium Grid, Matter Reclaimer, Transmutation Garden | A fairy ring of glowing mushrooms around a golden phoenix machine turns broken things into treasures. |
| Nature | **The Wildheart** | Wildflower Expanse, Biosphere Dome, Luminous Grove | An ancient glowing tree rises through a glass dome opened like a flower; wildflowers spill out and every animal is welcome. |

All eight are labelled **Imagine** in the field guide.

## For grown-ups and tuning

- `TUNE.paragonOn` (true), `TUNE.learnCost` (1), `TUNE.paragonBurst` (25), `TUNE.paragonAura` (2) in `src/core.js`.
- New state: `learned` (futures known per track), `style` (the look the next building uses), `paragons` (each track's three hexes and the turn it formed). Tiles built in their future remember their look in `v`.
- New log actions: `['l', axis, future]` learn, `['m', axis, k1, k2, k3]` merge, and `['p', i, q, r, future]` when a building's look differs from the track's first future. v0.11 saves load unchanged.
- Undo after a placement still works as before. Learning and merging are not undone by the undo button (they have their own picker and confirm prompt).
- Art: until `assets/paragons/<type>-a.png` and `-b.png` exist, the game draws a placeholder (the three buildings around a spire that grades from wood and leaves through white ceramic to amethyst, with a crown). See `docs/PARAGON-ART-BRIEF.md`.
