# BRIGHTFIELD · v0.12.0

A gentle, offline town-builder for mouse or touch. Open `index.html` in a browser. No build step, account, download at play time, or external service is needed.

## New in v0.12: Paragons

Jay's request, inspired by Bloons TD 6: each track can make **one Paragon**, a landmark that blends Nature, Future and Magic into one.

- **Learn the other futures.** Once a track reaches its future, its row glows violet. Tap it to learn another future for 1 idea. New buildings of that kind come in the new look; tap the picked card again (or press its number twice) to switch looks. Each building keeps the look it was built in, and the first future still decides the crown.
- **Merge a triangle.** A Nature, a Future and a Magic building of the same kind, all three touching each other, pulse gold. A prompt offers "Merge into a Paragon!" (or tap one of them later). One Paragon per track.
- **What it does.** +25 sunbeams when it forms, and anything built touching it earns double sunbeams. It keeps its three hexes, so neighbours and groups work as before.
- **The eight:** The Everlight, Anywhere Station, The Everfeast Tree, The Moonspring, The Skyhearth, The Wonderworks, The Phoenix Ring and The Wildheart. Tap one to read about it in the field guide.
- **Art.** A procedural placeholder draws the three buildings around a crowned spire until the Paragon art arrives in `assets/paragons/` (two layouts per Paragon, on full hexes). See `docs/PARAGON-ART-BRIEF.md`. `index.html?mode=cozy&qa=paragon` opens a demo town (in a separate QA save) for checking it.
- **Saves.** v0.11 towns load unchanged. A town that never learns a second future plays exactly as before.

Design notes and tuning: `docs/PARAGONS.md`.

## New in v0.11: every building, every turn (free play)

Jay's request: free play no longer deals a 3-card hand. All eight building types sit in a palette along the bottom, in the same order as the tech rows, and stay there after you build. Keys 1–8 pick a type. The daily Challenge is unchanged: it keeps its 80-tile deck, 3-card hand and swaps.

- **Town demand.** With every type always on offer, the highest-scoring play became a factory-and-power-plant town with no homes or nature. Free play now has a small demand signal, like SimCity's demand meter:
  - A kind the town is short of shows a green ↑ and earns ×1.5 sunbeams.
  - A kind the town already has plenty of shows a grey ↓ and earns ×0.5.
  - The preview bubble shows the same arrow.
  - It's free play only. Set `TUNE.demandOn` to `false` in `src/core.js` to turn it off.
- **Layout.** One row of eight cards on wide screens, with undo where the swap button was. Two rows of four on iPad portrait and phones. On phones the animal book moves into a single row above the tech rows.
- **Saves.** A v0.10 free-play town (3-card hand) opens with the full palette. Its tiles, sunbeams, ideas and history are unchanged.
- **Length.** Simulated careful play reaches the crown in about 43 placements (v0.10: 49). A player who picks types on a whim and places them where the preview is best takes about 53 (v0.10: 55). Random play takes about 82 (v0.10: 85).

## New in v0.10: Smoke Age → Cleanup → Future

The town now tells the story of real technology: smoky machines were adopted because they gave lots of cheap power, they dimmed the sky, and people invented cleaner ways.

- **Smog hides the sun.** Placement sunbeams shrink as the sky gets smoggier (up to half, in the worst smog). The preview shows the loss as a grey cloud chip (e.g. −2), and a grey band creeps over the sun meter. A placement still always earns at least one sunbeam.
- **Why coal at all?** Factories get an extra heart beside coal or gas power ("lots of cheap power"), so the smoky start is a real boom, not just a mistake.
- **The sky and the goal agree.** While any kind of building is still smoky, a haze remains and the far smokestacks keep puffing; nature helps but cannot clear the sky alone. The sky turns fully clear exactly when the last smoky kind is upgraded, with a celebration.
- **A small tech tree.** Five links, each teaching one idea:
  - Charging Hub needs Wind Turbines: electric cars are only clean if the electricity is clean.
  - Robot Foundry needs Wind Turbines: robot arms run on electricity.
  - Recycling Depot needs a Workshop: recycled metal needs someone to use it.
  - Compost Yard needs an Orchard: compost is made from fruit and food scraps.
  - Glasshouse needs a Water Tower: a glasshouse needs water piped in.
- **Every future needs a clear sky.** Nature, Future and Magic open once no smoky kind is left, so the three acts are clear.
- **Locks explain themselves.** A locked row shows a padlock and a picture of what it needs. Hover or hold it to see why; tap it to open the field guide's new Tech tree section ("Needs…" / "Opens the way to…"). Tapping a locked row never spends an idea.
- **Fact fixes.** Orbital Mirrors is now **Sun Mirror Tower** (matching its picture: real concentrated solar with molten-salt storage, labelled Today). Fusion Collectors is now **Fusion Reactor**. The Deep Well no longer makes smoke. The Gas Turbine card mentions invisible carbon dioxide.
- **Balance.** The sunbeams needed per idea dropped slightly (base 7 → 6) so games stay as short as v0.9. See `docs/BALANCE-v0.10.0.md`.
- **Phones.** Idea bulbs and lock badges now stay inside the narrow tech rows.

Saves: v0.9 towns load unchanged (same key and schema-2 snapshots). New rules apply from the next action, so a town already past a lock keeps its progress.

## Three uplifting futures

Every building track still has three upgrades. The last upgrade now offers **Nature**, **Future**, or **Magic**. Finish all eight tracks for the crown: the journey remains **24 upgrades**, and the daily Challenge remains **80 tiles**.

- **Nature:** +1 sunbeam on a newly placed link beside nature, food or water.
- **Future:** +1 beside power, travel, making or homes.
- **Magic:** +1 beside homes, water or reuse.

Either endpoint can supply the future bonus, capped at +1 per link. The existing discoveries can add another +1. Existing neighbour hearts, frowns and air-cleaning rules remain unchanged. Magic adds a new strategic grouping rather than a stronger bonus.

Magic's eight technologies are Crystal Beacon, Portal Pavilion, Enchanted Orchard, Moonwell, Starlight Village, Spellforge, Transmutation Garden, and Luminous Grove. They are explicitly labelled **Imagine**, with warm purple, lilac and gold artwork and a crystal-filled celebration.

Choose at least three upgrades in each of any two paths, or at least two in all three, for **A Shared Future**. Otherwise the most-chosen path supplies the crown. Existing Nature/Future shared towns keep the same result.

## Fresh native-hex miniatures

All existing building illustrations have been redrawn, alongside eight new Magic buildings. Six local transparent PNG atlases supply all 48 miniatures. Their six-sided isometric ground slabs are part of the original generated artwork, rather than square artwork cut into a hex-shaped mask. The renderer displays each complete miniature without stretching or silhouette clipping.

Turbines, vehicles, water, petals, lights, smoke, critters and travellers stay animated. Magic adds moving runic light, rising gold/lilac motes, portal traces and moon-water ripples without making buildings wobble. A procedural fallback remains available if an image cannot load.

## A sound of its own

Nature keeps its warm marimba and bells. Future keeps its bright, syncopated synth and gentle drums. Magic introduces rounded glass chimes, an airy sine/triangle pad and a lilting 3+3+2 harp pattern over open major/add9 and Lydian harmony, at 92 BPM. It feels curious and welcoming, not ominous. Shared-future music weaves the actual selected paths, including Magic.

All audio is generated locally with WebAudio, with no samples or network requests. It starts after a user gesture and uses the existing master mute. Press **M** or use the speaker button.

## Play and explore

- Green Play resumes the cozy town. Yellow target starts the daily Challenge.
- Select a card and an empty hex. Friendly neighbours earn sunbeams and ideas.
- Select a glowing technology row to upgrade that building type throughout town.
- Tap a placed building for the optional animated field guide and neighbour reasons.
- Hover a technology row, or hold it on touch, to preview its next version.
- Use + / − / Fit, mouse-wheel zoom, or touch pinch to inspect the miniatures up to 3×. Drag while zoomed to pan. A pan/pinch never places a building.
- Keys: 1/2/3 select cards, or Nature/Future/Magic while the final-choice panel is open. +/− zoom, 0 fits, Esc closes/deselects, M mutes, Ctrl/Cmd+Z undoes the latest cozy placement.

## Saves

The same storage key and schema-2 snapshot format are retained. Older v0.7/v0.8 snapshots preserve their historical scores, RNG, placements, choices and continuation state. New Magic variants also survive reload, continuation, replay and undo. Very old action-log saves still use the existing migration path.

Browser saves belong to the browser and file/site origin. Opening this separate version from a new file path or address may use different browser storage; schema compatibility does not automatically transfer a town between origins. The original v0.8 folder and ZIP are preserved separately.

## Development and verification

Run `node --test tests/*.test.*` from this folder. Canvas/UI tests need the development dependency `@napi-rs/canvas`; the game itself has no dependencies.

The local-only `tests/browser-qa.html` fixture offers reproducible Magic choices and finales for real-browser inspection. It uses an isolated QA save namespace when served locally. See `docs/VERIFICATION-v0.12.0.md`, `docs/VERIFICATION-v0.11.0.md` (and the earlier notes) for completed tests and remaining device limits, and `docs/ART-PROVENANCE.md` for artwork generation details.
