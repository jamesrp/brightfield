# Brightfield v0.12.0 verification

## Change

Paragons: a finished track can learn its other two futures (1 idea each), and a Nature, a Future and a Magic building of the same kind that all touch each other can merge into that track's one Paragon (+25 sunbeams, double sunbeams for anything built touching it). Design and tuning: `PARAGONS.md`. Art brief: `PARAGON-ART-BRIEF.md`.

Changed: `src/core.js` (rules), `src/techs.js` (the eight Paragons' names and lines), `src/art.js` (procedural placeholder), `src/generated-art.js` (optional `assets/paragons.png`), `src/main.js` (learn picker, look switching, merge prompt, board, tech rows, `?qa=paragon` demo), `src/inspector.js` (Paragon field-guide card), `src/audio.js` (Paragon chime), `src/ui.css` (merge buttons).

## What stays the same

- A town that never learns a second future plays exactly as before: a test plays the same seed and moves with Paragons on and off and gets the same tiles, sunbeams and eras.
- The crown still comes from the first future chosen on each track.
- v0.11 saves (no `learned`, `style` or `paragons` fields) load and play.
- The daily Challenge has the same deck and hand. Learning costs an idea there too.

## Tests

All **78 tests pass** (`test-results-v0.12.0.txt`): the 67 earlier tests plus 11 new ones. One earlier art test now expects 7 image loads (the optional Paragon atlas is requested; a missing file falls back to the placeholder).

New core tests (`core-v12`): learn rules and costs; each building keeps its look; card look cycling; triangle detection (a line, two of a look, or mixed kinds never merge); one Paragon per track; the ×2 aura only touching it; save, undo and replay of learn and merge; old saves; Paragons-off equivalence.

New interface tests (`ui-v12`): tapping a finished row opens the learn picker with known futures disabled; tapping the picked card switches its look; finishing a triangle opens the merge prompt; tapping a ready building reopens it; merging, then tapping the Paragon opens its field-guide card; the merge prompt and Paragon render at 1440×900 down to 320×568; Enter, Escape and double digit keys.

## Art path

A stand-in atlas built from `paragon-cell-guide.png` was dropped in as `assets/paragons.png` and rendered on the board for both orientations of the three hexes: the guide hexes landed exactly on the board hexes. The stand-in was removed; no Paragon atlas ships in this version.

## Not checked

- A real iPad or phone (only the headless canvas harness at several sizes).
- Pacing with players who chase Paragons. Learning spends up to two extra ideas per track, so a Paragon-hunting town reaches the crown a little later and earns the bursts and auras on the way. Not simulated.
- Final Paragon art (waiting on the imagegen pass).
