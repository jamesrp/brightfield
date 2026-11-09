# Brightfield v0.11.0 verification

## Change

Free play replaces the 3-card hand with an 8-type palette and adds town demand (free play only). Only `src/core.js` and `src/main.js` changed, plus tests and docs. The daily Challenge rules, deck, hand and layout are unchanged.

## Why town demand

With all types always available, a points-maximising simulated player built a town that was 45% power plants and 35% factories in its first 20 tiles. It had no homes, food, water or nature, and no nature all game. The random hand had been forcing variety. With demand on, the same player's whole-game mix is 6–16% per type, with no type above 25%. The early town still leans industrial, which suits the Smoke Age.

## Pacing (simulated, cozy mode)

| Player | v0.10 (3 cards) | v0.11 (palette + demand) |
|---|---|---|
| Careful (greedy, smokiest-first upgrades) | 49 | 43 |
| Mixed | 63 | 54 |
| Whim (random type, best hex for it) | 55 | 53 |
| Random | 85 | 82 |

The sky still clears on the same upgrade as the last smoky kind, at about placement 29 for careful play.

## Tests

All **67 tests pass** (`test-results-v0.11.0.txt`). Two existing tests assumed a 3-card free-play hand: one picked card 1 expecting a house, and one greedy loop scanned only 3 cards. Both now use the palette. Three v0.10 smog tests now compare against the demand-adjusted base.

New tests cover:
- The palette persists after placing, and free play has no swap.
- The Challenge still deals 3 cards and has swaps.
- A v0.10 3-card save converts to the palette with tiles, sunbeams and RNG unchanged, and undo still works.
- Demand tiers, demand in free play only, and the on/off switch.
- A greedy player builds a mixed town and crowns within 60 placements.
- The palette is fully on screen and clear of buttons, tech rows and other cards at seven sizes, from 1440 × 900 down to 320 × 568.
- Keys 1–8 select a type, selection persists after placing, and the Challenge layout is intact.

## Real browser (headless Chrome, file://)

- Screens at 1280 × 860, 1024 × 768, 1180 × 820, 820 × 1180, 390 × 844, and the Challenge at 1280 × 860. No console errors or warnings.
- A town saved by v0.10 in Chrome opened in v0.11 from a different folder with 6 tiles and 25 sunbeams unchanged and 8 cards.
- A full free-play game using only taps reached the crown after 45 placements and 24 upgrades, with the sky clear at placement 30. No errors.

## Not changed / known

- The Challenge is untouched. Its deck-count and score chips (top left) sit behind the v0.9 Connections and zoom buttons, which is a v0.9 layout issue to fix when you try Challenge mode.
- Physical iPad/Safari testing is still outstanding, as before.
