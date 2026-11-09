# Brightfield v0.12.0 verification

## Change

Paragons: a finished track can learn its other two futures (1 idea each), and a Nature, a Future and a Magic building of the same kind that all touch each other can merge into that track's one Paragon (+25 sunbeams, double sunbeams for anything built touching it). Design and tuning: `PARAGONS.md`. Art brief: `PARAGON-ART-BRIEF.md`.

Changed: `src/core.js` (rules), `src/techs.js` (the eight Paragons' names and lines), `src/art.js` (procedural placeholder), `src/generated-art.js` (optional Paragon images in `assets/paragons/`, loaded only once a Paragon exists), `tools/art/paragon-*.cjs` (geometry and templates), `src/main.js` (learn picker, look switching, merge prompt, board, tech rows, `?qa=paragon` demo), `src/inspector.js` (Paragon field-guide card), `src/audio.js` (Paragon chime), `src/ui.css` (merge buttons).

## What stays the same

- A town that never learns a second future plays exactly as before: a test plays the same seed and moves with Paragons on and off and gets the same tiles, sunbeams and eras.
- The crown still comes from the first future chosen on each track.
- v0.11 saves (no `learned`, `style` or `paragons` fields) load and play.
- The daily Challenge has the same deck and hand. Learning costs an idea there too.

## Tests

All **81 tests pass** (`test-results-v0.12.0.txt`): the 67 earlier tests plus 14 new ones. Paragon images are requested only once a Paragon is on the board, so start-up still loads the same six images.

New core tests (`core-v12`): learn rules and costs; each building keeps its look; card look cycling; triangle detection (a line, two of a look, or mixed kinds never merge); one Paragon per track; the ×2 aura only touching it; save, undo and replay of learn and merge; old saves; Paragons-off equivalence.

New interface tests (`ui-v12`): tapping a finished row opens the learn picker with known futures disabled; tapping the picked card switches its look; finishing a triangle opens the merge prompt; tapping a ready building reopens it; merging, then tapping the Paragon opens its field-guide card; the merge prompt and Paragon render at 1440×900 down to 320×568; Enter, Escape and double digit keys.

## Art path

Paragon art follows tile spec v2: three full hexes, in two layouts (one hex behind and two in front, or the reverse). New tests (`paragon-art-v12`) check that the renderer and `tools/art/paragon-spec.cjs` agree, that each layout's painted hex centres land on the board's hex centres to within half a pixel at the board's own scale, and that a missing image falls back to the placeholder. The two guide templates were also dropped in as stand-ins and rendered on the board, one Paragon per layout; their outlines sat exactly on the board hexes. The stand-ins were removed; no Paragon art ships in this version.

## Not checked

- A real iPad or phone (only the headless canvas harness at several sizes).
- Pacing with players who chase Paragons. Learning spends up to two extra ideas per track, so a Paragon-hunting town reaches the crown a little later and earns the bursts and auras on the way. Not simulated.
- Final Paragon art (waiting on the imagegen pass).
