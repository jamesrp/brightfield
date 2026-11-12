# Star: static full-hex tiles

Third of the four remaining static-art batches in [issue #2's plan](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6815889758). Branch `art/star-static` starts from main at `d201c7789b18c863377bd0addff628c0db723837`. It does not depend on unmerged Stage 1–2 or Leaf branches.

## Scope

Eight 1024×1536 transparent PNGs: Fusion Reactor, Maglev Express station, Aeroponic Stack, Kelp Bioreactors, Arcology Spire, Nanofab Spire, Matter Reclaimer and Biosphere Dome. Each fills the exact spec-v2 top face and reuses the existing alloy kerb's RGBA pixels. Static fixtures and coloured cores stay in the bases; moving pods, lift platforms, orbiting rings, bubbles and separate glow effects are reserved for later rounds.

Only eight final tiles and a town close-up are committed as images. Raw generations, rejected candidates, fitted sources and full galleries remain in the external private archive. Existing Stage 0 assets, shared kerbs, legacy atlases, Paragons and gameplay code are unchanged.

## Geometry and provenance

Built-in imagegen produces each tile separately using the alloy slab as geometry reference and approved Stage 0 art as style reference. Prompts and source/final hashes are in `../art-provenance.json`. `source-selection.json` identifies accepted sources, while `source-archive.json` records archive hashes without exposing a private machine path.

`art:fit --sides assets/tiles/_slab/alloy.png` aligns each source. `finish-tile.cjs` fills small transparent ground-edge gaps only from the existing painted alloy-family slab, limited to the exact top face where original alpha is below 200, preserving other original pixels. More than 6,000 incomplete pixels is rejected. The front kerb RGBA pixels copy the family slab exactly. This is bounded source compositing, not procedural painting.

## Reproduce and verify

Set `BRIGHTFIELD_ART_ARCHIVE` to the private Star archive root. Normal tests and previews use only committed final assets.

```
npm ci
BRIGHTFIELD_ART_ARCHIVE=/path/to/archive node docs/star-static/rebuild.cjs
npm run art:check
npm test
npm run art:preview
sha256sum -c SHA256SUMS.txt
```

The rebuild verifies accepted source hashes first. Fit/composition details are in `qa/composition.json`; final test and reproducibility records are under `qa/`.

## Verification results

- All 87 regression tests pass, including the exact per-family kerb check.
- All 16 listed tiles on this branch pass the art checker: 100% solid faces and edges within 0.5 px. The branch includes the 8 existing Stage 0 tiles and these 8 Star tiles; other open art branches are independent.
- All 8 new PNGs rebuild byte-identically from hash-verified sources.
- Maximum fit clipping is 2,192 pixels; maximum bounded ground completion is 5,818 pixels.
- Independent visual review passed all eight tiles and the actual renderer close-up, including rear ground boundaries, empty actor spaces, intact silhouettes and clear lanes.
- Arcology was revised for clearly futuristic architecture; Maglev and Nanofab were refined to remove excess rear ground. Earlier sources remain archived.

## Review and remaining work

[Star town close-up](review/closeup-star.png), generated through the real game renderer. Review checks readable architecture, comparable scale, clear lanes, full plot coverage, a single alloy kerb and unclipped towers. This is renderer-harness review, not physical-device gameplay testing.

Magic (eight arcane-kerb tiles) follows on a separate branch from the then-current main. Reconcile shared manifest, provenance and checksum changes as earlier PRs merge; re-run all checks and regenerate checksums after rebasing. Round 2 starts only after all four static PRs merge. No merge or deployment is included here.
