# Round 2: core actors and travellers

This batch starts from merged main `38f6cee23ae608066b91e356e2bb134da3f9282a` after [PR #11](https://github.com/jamesrp/brightfield/pull/11) brought all 48 static tiles together. [Issue #2](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6826475616) confirms that the Round 2 gate is satisfied.

The scope is the three missing mechanical parts (wind turbine blades, tracking Sun Mirror panels and mill waterwheel), six age-specific travellers, and matching painted vehicle actors on the existing roads and tracks. Static tiles, shared kerbs, game rules and saves remain unchanged. Further glow and detail layers are a separate batch.

## Art and integration

Each new sprite is generated separately with the built-in imagegen tool, using the actual shipped base tile as its visual reference. Transparent source art is cropped and uniformly resized to tile-pixel scale. Anchors mark the wheel/rotor pivot or vehicle ground contact. On-tile paths follow painted roads, tracks and forecourts; road vehicles flip for their return trip. The coal wagon, tram and maglev pod reverse without flipping so their painted wheelbase remains aligned with the rails. Travellers use the same existing lane and occlusion renderer.

Prompts, source hashes, selected crops/resizes, pivots and final hashes are recorded in the provenance files. Raw generations, rejected candidates, transfer parts and intermediate composites remain in the private external archive. Only final sprites and a few review sheets belong in git.

## Verification

`npm test` checks image loading, the six travellers, required mechanical actors, motion math and all shipped actor silhouettes. `npm run art:check` retains the existing 48 static tile and manifest checks. `npm run art:motion:check` separately verifies sprite transparency, image bounds, finite anchors, valid paths and continuous conservative painted-silhouette clearance over every path segment, both return facings, full spinner rotations, bounded sways and the complete bob range. Diagnostic samples also include negative times and independent motion periods. Animated pixels must stay inside the tile columns/headroom and above the front plot edge, so checking path anchors alone cannot hide blade or vehicle spill into the lanes.

`npm run art:preview` uses the actual game renderer for the gallery, stage towns, close-ups, animation strips and both directions of all six travellers. Final visual review must additionally check attachment alignment, scale, track alignment, occlusion, calm motion and the card-size silhouettes. Geometric clearance is not a substitute for that visual review.

## Rebuild and results

From the repository root, set `BRIGHTFIELD_ART_ARCHIVE` to the private Round 2 source archive and run:

```sh
node docs/round-2-actors/rebuild.cjs /path/to/rebuilt-output
```

The wrapper verifies every selected raw PNG against `source-archive.json`, runs the versioned normalization recipes, and checks all 14 rebuilt files against both `final-assets.json` and the shipped PNGs. All 14 reproduce byte-for-byte. `generation.json` and the canonical provenance record retain the exact prompts.

Integrated checks: **99/99 tests pass**, all **48/48 static tiles** pass geometry and shared-kerb checks, all **15 actor instances** pass continuous swept-clearance checks, and all six distinct traveller sprites load. Static base PNGs, shared kerbs and production renderer code are byte-unchanged from the merged main baseline. No deployment or merge is included.

To regenerate review sheets, run `npm run art:preview` then `node docs/round-2-actors/render-review.cjs`. The sheets show complete mechanical cycles, vehicle route positions, both traveller directions and three real-renderer towns.

- [Mechanical cycles](review/mechanical.png)
- [Vehicle routes](review/vehicles.png)
- [Six travellers](review/travellers.png)
- [Town close-ups](review/towns.png)

Independent final visual review passes all three mechanical additions, vehicle routes and traveller pairs in the actual renderer. All 48 static PNGs were independently compared with the baseline and remain byte-identical. See [visual review](qa/visual-review.md).
