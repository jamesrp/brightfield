# Magic: static full-hex tiles

Fourth of the remaining static-art batches in [issue #2's plan](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6815889758). Branch `art/magic-static` starts from main at `d201c7789b18c863377bd0addff628c0db723837`. It does not depend on the other unmerged art branches.

## Scope

Eight 1024×1536 transparent PNGs: Crystal Beacon, Portal Pavilion, Enchanted Orchard, Moonwell, Starlight Village, Spellforge, Transmutation Garden and Luminous Grove. Each fills the exact spec-v2 top face and reuses the existing arcane kerb's RGBA pixels. Friendly purple stone, amethyst, warm windows and gold details carry the Magic theme. Crystal and lamp fixtures stay static; rotating rings, floating orbs, wisps, moving tools, fire, particles and separate glow layers are reserved for later rounds.

Only the eight final tiles and a town close-up are committed as images. Raw generations, rejected candidates, fitted sources and full galleries remain in the external private archive. Existing Stage 0 assets, shared kerbs, legacy atlases, Paragons and gameplay code are unchanged.

## Geometry and provenance

Built-in imagegen produces each tile separately using the arcane slab as geometry reference and approved Stage 0 art as style reference. Exact prompts and source/final hashes are in `../art-provenance.json`. `source-selection.json` identifies accepted sources, while `source-archive.json` records archive hashes without exposing a private machine path.

`art:fit --sides assets/tiles/_slab/arcane.png` aligns each source. `finish-tile.cjs` fills small transparent ground-edge gaps only from the existing painted arcane-family slab, limited to the exact top face where original alpha is below 200, preserving other original pixels. More than 6,000 incomplete pixels is rejected. The front kerb RGBA pixels copy the family slab exactly. This is bounded source compositing, not procedural painting.

Seven tiles use normal alignment. The Moonwell correction starts from an already template-aligned canvas and uses the existing `--no-align` option to preserve those pixel positions; it passes the same unchanged ground-completion cap and geometry checks. Portal faces are static opaque amethyst panels, with animated swirls reserved for later layers.

## Reproduce and verify

Set `BRIGHTFIELD_ART_ARCHIVE` to the private Magic archive root. Normal tests and previews use only the final committed images.

```
npm ci
BRIGHTFIELD_ART_ARCHIVE=/path/to/archive node docs/magic-static/rebuild.cjs
npm run art:check
npm test
npm run art:preview
sha256sum -c SHA256SUMS.txt
```

The rebuild verifies accepted source hashes first. Fit/composition details are in `qa/composition.json`; final test and reproducibility records are under `qa/`.

## Verification results

- All 87 regression tests pass, including exact family-kerb checks.
- All 16 listed tiles on this branch pass the art checker: 100% solid faces and edges within 0.5 px. These are the 8 existing Stage 0 tiles plus the 8 Magic tiles; other open branches remain independent.
- All 8 new PNGs rebuild byte-identically from hash-verified sources.
- Maximum fit clipping is 2,619 pixels; maximum bounded ground completion is 5,767 pixels.
- Independent final visual review passes all eight tiles and the real-renderer town close-up: no clipped leaves, sky haze, broad rear-floor overhangs, second plates or lane intrusion.
- Refinements repaired portal ground, inset orchard canopies and corrected Moonwell/recycling-garden rear footprints; all earlier candidates remain archived.

## Review and round 2 gate

[Magic town close-up](review/closeup-magic.png), generated through the real game renderer. Review checks readable architecture, comparable scale, clear lanes, full plot coverage, a single arcane kerb, unclipped towers and the friendly purple/gold palette. This is renderer-harness review, not physical-device gameplay testing.

Reconcile shared manifest, provenance and checksum changes against current main as earlier PRs merge; re-run all checks and regenerate checksums after rebasing. Round 2, including the mill waterwheel and other actors, begins only after all four static PRs merge. No merge or deployment is included here.
