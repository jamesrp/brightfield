# Round 2: emissive layers

This independent batch starts from merged main `38f6cee23ae608066b91e356e2bb134da3f9282a` after PR #11. It supplies all eight Star glow layers, all eight Magic glow layers and four home-window layers for stages 0, 1, 2 and Leaf. It complements the separate core actor/traveller and remaining moving-part batches.

## Artwork

All 20 sources were painted using built-in imagegen, with the exact shipped base as the registration reference. Final overlays retain only generated light texture at existing painted glass, crystals, cores, fruit and lamp apertures. Deterministic masks and restrained alpha remove broad raw halos; registration corrections are limited to the documented emitter crops. No replacement art is drawn in code. Static bases, kerbs, production rendering, lanes, game rules and saves are unchanged.

The existing additive renderer breathes between 35% and 100% by day and holds at full brightness at night. Each layer has its own calm 5–9.1 second period. These glows do not invent missing actors: the Magic forge fire and transmutation orb belong to the moving-part batch. There are no new particle or lane systems.

## Reproduction

`final-assets.json` records the 20 raw/base/final checksums. `rebuild/` contains complete prompts, original normalization metadata and portable recipes. Raw generations and full-resolution diagnostic sheets remain in a private external archive. The source inventory is `source-archive.json`. From the repository root:

```sh
node docs/round-2-glows/rebuild.cjs /path/to/private/archive /path/to/rebuilt-output
```

The output directory must be outside the repository. The wrapper checks every selected raw source and unchanged base, runs the three group recipes, and verifies all 20 rebuilt PNGs against both recorded hashes and the shipped assets. All 20 rebuild byte-for-byte with the pinned `@napi-rs/canvas@0.1.100` dependency. The Star provenance's original script hash identifies the archived normalization script; the versioned adaptation only redirects output and removes private diagnostic writes.

## Verification

- 97/97 tests pass, including malformed input fixtures and all 20 layers rendered through actual day-low, day-peak and night paths.
- All 48 static tiles pass `npm run art:check`.
- All 20 overlays pass `npm run art:glow:check`: correct dimensions, transparency, nonempty emission, finite periods, headroom, column and front-edge clearance.
- All existing tile PNGs, shared kerbs and production renderer files are byte-identical to the merged baseline.
- Independent review passes all 20 layers; see [visual review](qa/visual-review.md).
- The real renderer restores blend state after each glow, changes actual pixels over the daytime cycle, and renders night exactly like the daytime peak.

Run `node docs/round-2-glows/render-review.cjs` for uniformly framed complete-tile comparisons, and `node docs/round-2-glows/render-towns.cjs` for day/night town close-ups:

- [Star comparisons](review/glow-star.png)
- [Magic comparisons](review/glow-magic.png)
- [Home-window comparisons](review/glow-home.png)
- [Town close-ups](review/towns.png)

A private combined snapshot of all three Round 2 batches passes 112/112 tests, all 48 tile checks, all 20 actor swept-envelope checks and all 20 glow checks. See [combined integration](qa/combined-integration.json). No merge commit was created.

This branch is independently testable from main. Combining the three Round 2 batches requires preserving each manifest/provenance addition and regenerating `SHA256SUMS.txt`. No merge or deployment is included.
