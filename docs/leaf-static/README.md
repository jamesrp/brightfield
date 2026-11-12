# Leaf: static full-hex tiles

Second of the four remaining static-art batches in [issue #2's plan](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6815889758). Branch `art/leaf-static` starts from main at `d201c7789b18c863377bd0addff628c0db723837`. Stage 1–2 PR #7 is separate; no assets or manifest entries from that unmerged branch are required here.

## Scope

Eight 1024×1536 transparent PNGs: Sun Mirror Tower, Garden Tram station, Food Forest, Living Wetland, Canopy Village, Repair Guild, Mycelium Grid and Wildflower Expanse. Each fills the exact spec-v2 top face and reuses the existing garden kerb's RGBA pixels. Foliage stays inside the allowed columns with headroom. The tram, tracking mirror panels, repair wheel, animals and other moving pieces are reserved for round 2.

The git images are only the eight final tiles and a town close-up. Raw generations, rejected candidates, fitted sources and full galleries stay in the external private archive. Existing Stage 0 assets, shared kerbs, legacy atlases, Paragons and gameplay code are unchanged.

## Geometry and provenance

Built-in imagegen produces each tile separately using the garden slab as geometry reference and approved Stage 0 art as style reference. Exact prompts and source/final hashes are recorded in `../art-provenance.json`. `source-selection.json` identifies each accepted source; `source-archive.json` lists archive hashes without exposing a private machine path.

`art:fit --sides assets/tiles/_slab/garden.png` aligns each source. `finish-tile.cjs` fills small transparent ground-edge gaps only from the existing painted garden slab, limited to the top face where original alpha is below 200, preserving other original pixels. It rejects more than 6,000 incomplete pixels. The final front kerb pixels are copied exactly from the family slab. This is bounded source compositing, not procedural painting.

## Reproduce and verify

Set `BRIGHTFIELD_ART_ARCHIVE` to the private Leaf archive root. Normal tests and preview generation need only the committed final assets.

```
npm ci
BRIGHTFIELD_ART_ARCHIVE=/path/to/archive node docs/leaf-static/rebuild.cjs
npm run art:check
npm test
npm run art:preview
sha256sum -c SHA256SUMS.txt
```

The rebuild verifies source hashes before use. Per-tile fit and composition details are in `qa/composition.json`; final test and reproducibility records are under `qa/`.

## Verification results

- All 87 regression tests pass, including exact family-kerb checks.
- All 16 listed tiles on this branch pass the art checker: 100% solid faces and edges within 0.5 px. These are the 8 existing Stage 0 tiles plus the 8 Leaf tiles; other open branches are independent.
- All 8 new PNGs rebuild byte-identically from hash-verified sources, using normal alignment.
- Maximum fit clipping is 3,949 pixels; maximum bounded ground completion is 3,285 pixels.
- Independent final visual review passes all eight assets and the real-renderer close-up: intact foliage, no raised rear ground, no sky haze, consistent single kerbs and clear lanes.
- Targeted refinements fixed the tram floor, inset food-forest leaves, corrected rear ground and removed unwanted Repair Guild sky haze. Earlier sources remain archived.

## Review and remaining work

[Leaf town close-up](review/closeup-leaf.png), generated with the real game renderer. Review checks readable silhouettes, clear code-drawn lanes, full plot coverage, a single thin kerb, no clipped foliage and matching material/light. Renderer-harness review is not physical-device gameplay testing.

Star (eight alloy-kerb tiles) and Magic (eight arcane-kerb tiles) follow on their own branches from the then-current main. Shared manifest, provenance and checksum edits must be reconciled as earlier PRs merge. Re-run all checks and regenerate checksums after any rebase. Round 2, including the mill waterwheel, begins only after all four static PRs merge. No merge or deployment is included here.
