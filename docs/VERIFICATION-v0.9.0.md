# Brightfield v0.9.0 verification

## Scope

Local implementation on the Mac Mini. No publication or purchases. The original v0.8 source and archive are preserved unchanged. All 21 original source files were compared byte-for-byte with the supplied ZIP; all matched. The original archive SHA-256 remains `99c76ed7beb1de4734ccdf55fb5989484d6505c9df176076bd570dec6ee814b8`.

## Gameplay and persistence

- The upgrade goal is still 24, with no crown at 23. The Challenge is still 80 tiles.
- Existing directed neighbour opinions, discovery requirements, clean-air scores and upgrade thresholds are unchanged.
- Magic introduces a distinct three-target future bonus. Future bonuses remain capped at +1 per link; discoveries can add at most another +1.
- Schema-2 snapshots retain historic score, choices, RNG and placement state. The storage key is unchanged. Magic choices survive serialization, continuation and undo; legacy action logs still load.
- Mixed crowns preserve the original Nature/Future condition and support any two paths with 3+ upgrades each, or all three with 2+ each.
- Three-choice controls work through canvas selection, native buttons and keyboard 1/2/3. Cancelling never spends an idea or places a tile.

## Progression comparison

`tests/balance-review.cjs` is a deterministic greedy-play comparison, not a claim about every player's pace. It uses seeds 7, 17, 42, 101 and 314 and scores placement points with a small distance preference. Detailed results are in `balance-v0.9.0.json`.

- Nature: 51, 53, 54, 53, 53 placements, exactly matching v0.8. Mean 52.8.
- Future: 51, 53, 54, 52, 52 placements, exactly matching v0.8. Mean 52.4.
- Magic: 52, 53, 54, 52, 52 placements. Mean 52.6.
- Every run required 24 upgrades. Magic's run length is comparable to the two existing paths.

## Sound

The Nature score uses marimba and bell figures over warm chords at 88 BPM. Future uses brighter, interleaved plucks and a light kick/hat pulse at 100 BPM. Their original arrangement, normal-town music and legacy shared arrangement are preserved: 4,096 planner outputs have an exact frozen v0.8 hash regression.

Magic has its own 92 BPM harmony and melody, harmonic glass chimes, a soft sine/triangle aura, and harp accents in a 3+3+2 pattern. Its open major/add9 harmony and occasional raised fourth provide an arcane feeling without a dark or threatening mood. The pad gain is balanced against the original filtered pads. Mixed music alternates only the paths the town actually chose.

Planner and WebAudio scheduler regressions check finite event values, bounded gains, recognized voices, all selected-path combinations, user-gesture initialization and the shared master mute. Chrome also initialized the actual AudioContext and ran the score, with mute toggled successfully. This is a synthesis/runtime check, not a calibrated listening test on every speaker or device.

## Browser checks

Real Chrome on the Mac Mini was used, not just a DOM stub. The local-only QA fixture exercised the actual game UI:

- Card selection and placement.
- Magic final choice, idea spending and field-guide inspection.
- Responsive chooser and final celebrations at phone, tablet and desktop viewport sizes.
- Magic and three-path shared finales, including crystal/lantern/drone effects.
- Zoom-in/Fit controls and browser audio initialization/mute.

The real browser found an inherited water-ripple bug: board-position offsets can give animation code a negative time, and JavaScript's remainder operator then produced a negative ellipse radius. Positive cycle phases now handle every tile location, with a dedicated regression. No sprite silhouette clipping is used in the v0.9 renderer.

## Remaining limits

Responsive Chrome viewports are not physical-device testing. Safari, an actual iPad/iPhone, touch hardware, Bluetooth/speaker differences and long-running mobile performance have not been verified. Touch/pinch/cancellation paths have automated event coverage. Browser saves remain local to their browser/file or site origin; a compatible format does not automatically transfer a town between origins.

## Final suite and artwork check

All **46 tests passed**, with zero failures, skips or cancellations on Node.js v24.22.1 using @napi-rs/canvas 0.1.100. The full final test output is saved in `test-results-v0.9.0.txt`. All six final PNGs load, all 48 sprites retain detail within their raised tile footprints, and all eight Magic overlays animate. A complete rendered gallery was visually checked.

The final installed assets were then checked again in real Chrome at 390 × 844, 768 × 1024 and 1440 × 900. Magic selection spent the expected idea, the Starlight Village field guide displayed its full fresh miniature and explicit fantasy description, the Magic/shared finales fit their viewports, Zoom reached 125% and Fit returned to 100%, and the AudioContext ran after a canvas gesture with M toggling master mute. The fresh test tab reported no warnings or errors. Temporary viewport overrides were reset and the localhost server was stopped.

The browser QA fixture now uses an isolated `brightfield.qa.*` storage namespace. A regression verifies it cannot write the normal cozy save key. Normal game storage names are unchanged.

Independent final review found no additional gameplay/save/audio regressions and reverified all 21 original source hashes plus the original archive CRC/SHA-256.
