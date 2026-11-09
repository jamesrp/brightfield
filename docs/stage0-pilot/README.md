# Brightfield Stage 0 review pilot: plots and lanes

This revision supersedes the initial deep-slab pilot. It uses the updated brief and renderer introduced at `claude/project-thread-8c53rq`, commit `948b010da6580de0341ccf3e05d56b3c1599661f`. The review branch is rebased onto main at `29b4cb29afe87d0a43850f4540e4100d3ac3c1a9` after PR #6 merged, preserving the concurrently merged Paragon work.

Scope remains **four reusable family kerbs and eight Stage 0 static tiles**. The other 40 tiles keep the original v0.9 atlases. No Paragons, actors, travellers, glow layers, gameplay changes or deployment are included. Working branch: `art/stage0-lanes-pilot`.

## Current review images

- `review/gallery.png`: all 48 buildings; Stage 0 is labelled NEW.
- `review/closeup-0.png`: dense town with clear code-drawn lanes.
- `review/board-0.png`: full town and UI.
- `review/stage0-sheet.png`: the eight revised plots.
- `review/family-slabs.png`: the four revised kerb materials.

The buildings fill their plots with no board-green rim or second slab. Lanes between plots are painted by the game. Existing on-plot paths remain inside the art and can meet lanes at the edge, as the updated brief allows. No perimeter roads were added. Existing procedural inter-tile travellers are left for the later actor round.

## Revision method

Every output remains 1024×1536 RGBA. The pointy hex has centre (512,1130), half-width 480, half-height 354.7 and a 37.8 px kerb. The original eight paintings are translated down exactly 90 px, without resizing the buildings or ground. Original deep sides are replaced by thin family kerbs; smoke emitter anchors also move down 90 px.

Earth's side material was edited with built-in imagegen to grey-brown kerbstones beneath a grass lip. Garden's side material was edited to moss-covered low log edging. Only those generated side surfaces are composited into the exact kerb polygons; original grass top faces are retained. Alloy and arcane retain their painted materials, reframed to the thin kerb. Side interiors are opaque and all Stage 0 tiles copy the same authoritative earth side pixels.

`migrate-lanes.cjs` performs the geometry conversion from the immutable initial pilot assets under `docs/stage0-pilot/pre-lanes/assets/tiles` in the external archive. Then `kerb-edits/apply-kerbs.cjs` composites the fitted material edits and updates all eight earth kerbs. Small transparent boundary gaps are sampled from the nearest painted kerb pixel, not painted procedurally. The material prompts, fits and composition report remain in `kerb-edits/`; the source images are in the external archive.

## Source archive and repository size

The [pilot review](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6746806116) approved the visuals and asked for a smaller repository. All 66 raw/intermediate PNGs and old review images were copied outside git and verified byte-for-byte before removal from this branch. `source-archive.json` retains their relative paths, sizes and SHA-256 hashes. This removes 102,436,537 bytes (97.7 MiB) from the current tree; `docs/stage0-pilot/` is now about 5.6 MiB instead of 103.2 MiB. The 12 shipped assets are unchanged. Five current review sheets remain in git.

Prompts, provenance JSON, fit records, QA logs and scripts remain in the repository. The raw and intermediate PNGs under `raw/`, `slabs/`, `kerb-edits/` and `pre-lanes/` are preserved in an external local archive with the same repository-relative paths. Their historical text records describe the original geometry, not the current asset contract. Source image patterns are ignored to prevent accidental re-addition. The cleaned pilot was rebased as one commit onto main after PR #6 merged, so raw/intermediate images are absent from this branch's ancestry. The earlier review commits remain available by their IDs and in local backup refs; no repository-wide history purge is attempted here.

Normal tests, art checks, previews and provenance recording do not need the archive. To reproduce or verify the geometry migration, set `BRIGHTFIELD_ART_ARCHIVE` to the archive root, then run:

```
node docs/stage0-pilot/migrate-lanes.cjs
node docs/stage0-pilot/kerb-edits/apply-kerbs.cjs
node docs/stage0-pilot/verify-migration.cjs
```

Each archived source is checksum-verified before use. Do not rerun the historical normalization scripts against the revised geometry.

## Review scope and order

The Stage 0 visuals are approved, but the remaining 40 tiles and Round 2 actors are not part of this change. The Smokestack Mill's separate spinning waterwheel is explicitly deferred to Round 2. PR #6 has merged. This pilot now targets main and remains a draft for review. No PR #5 merge or deployment is included here.

## Verification

- `npm run art:check`: eight tiles, 100% plot coverage, edges within 0.5 px, all checks pass.
- Four family kerbs individually pass with 100% coverage; maximum edge deviation 1.0 px.
- `npm test`: 87 tests pass, including count-agnostic loading, strict type/stage validation, duplicate image-source handling and shared-side comparisons for each listed tile’s family.
- `npm run art:preview`: gallery and town images generated by the real game renderer.
- Legacy atlas tests use explicit empty-manifest fixtures to preserve their six-image and old-footprint assertions.
- No runtime source changes beyond the upstream renderer revision. The gallery preview tool now reads the current board radius and kerb depth rather than drawing the old backing plate.
- `BRIGHTFIELD_ART_ARCHIVE=/path/to/archive node docs/stage0-pilot/verify-migration.cjs`: zero changed top/structure RGBA values after the 90 px translation across all 12 assets, zero shared-kerb differences and zero outside-boundary pixels.

Full prompts and final SHA-256 values are in `docs/art-provenance.json` and `SHA256SUMS.txt`. Final check logs are in `qa/`. The next 40 tiles require separate authorization.
