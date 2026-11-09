# Brightfield v0.10.0 verification

## Scope

Rebased on the supplied v0.9.0 ZIP. Artwork, audio, camera, Magic and save formats are unchanged. Gameplay changes are in `src/core.js`; interface changes are in `src/main.js`, `src/inspector.js`, `src/art.js` (one new reason picture), `src/techs.js` (card text) and `src/ui.css` (tech tree styles).

## Automated tests

All **60 tests pass** on Node.js v22 with @napi-rs/canvas 0.1.100: the 46 v0.9 tests plus 14 new ones. Full output: `test-results-v0.10.0.txt`.

Eight v0.9 tests were updated because their premise changed on purpose, not to hide regressions:

- Five tests upgraded every track in a fixed order (power, travel, food…). Food's Glasshouse now needs the Water Tower first, so they now climb in an order the tech tree allows. Each still checks the same thing: 24 upgrades, no crown at 23, continuation, undo and save round-trips.
- Two choice-screen tests set up a smoky town and then opened the final choice, which is now locked by the clear-sky rule. They now start from a clean town.
- One discovery test checked an exact sunbeam total under a smoggy sky. It now checks the undimmed total and the smog-dimmed result separately.

New tests cover:

- Each prerequisite blocks only its own step, spends no idea, and opens once met.
- The clear-sky gate fires exactly once and opens all seven other futures.
- Nature alone cannot clear the sky.
- The dimming formula, including the minimum of one sunbeam.
- The cheap-power heart for coal and gas only.
- The well's smoke, the renamed cards and the matching short names.
- The tree has no loops, and 20 random walks all reach 24 upgrades.
- A v0.9 save made mid-tree loads and finishes.
- A five-seed greedy run stays at or under 62 placements, with the sky clear well before the crown.
- Interface: tapping a locked row (four screen sizes), the field guide's tech tree text, the sky-clear toast, the lost-sunbeam chip and puff, and rendering locked peeks and a smoggy sun at every size.

## Real browser

Headless Google Chrome via Playwright, from `file://`:

- Screens at 1280 × 860, 820 × 1180 (iPad portrait) and 390 × 844 (phone): smoggy preview, locked rows, locked peek, locked field guide, sky-clear moment, three-future chooser, Magic finale and title. No console errors or warnings.
- A full cozy game played only with touch taps (cards, hexes, tech rows, choice circles) reached a mixed crown after 53 placements and 24 upgrades. The sky cleared at placement 32. No errors.

## Remaining limits

The v0.9 limits still apply: responsive Chrome is not physical-device testing, and Safari / real iPad hardware were not run. Audio was not listened to; no audio code changed except that the existing "clear" sound now plays at the sky-clear moment. The phone portrait layout from v0.9 still crowds the animal book against the undo button; only the bulbs and locks were fixed there.
