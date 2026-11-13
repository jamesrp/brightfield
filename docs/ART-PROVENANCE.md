# Brightfield v0.9 artwork

All 48 building illustrations were generated fresh for this release with imagegen, as six transparent RGBA PNG atlases at 1774 × 887 pixels. The early town, intermediate technologies, Nature and Future preserve the subject matter of their predecessors; Magic introduces eight purple-and-gold fantasy miniatures. Every ground slab was drawn as a native six-sided isometric hex, not cropped from a square island.

## Atlas order

Each atlas contains four columns and two rows. Reading order is power, travel, food, water; homes, making, reuse, nature. Stage files are buildings-0.png, buildings-1.png, buildings-2.png, buildings-leaf.png, buildings-star.png and buildings-magic.png.

The full generation prompts, refinement prompts, dimensions and final SHA-256 checksums are in art-provenance.json. Stage 2 received a framing refinement so the complete turbine blades fit inside their cell. Magic received a background-only transparency correction. The final files retain actual transparent backgrounds.

## Integration and checks

All six atlases were visually inspected. The complete 48-building rendered gallery was checked, including turbine tips and the tall Nature/Future spires. Atlas row boundaries pass through transparent gutters (Nature row split 424px; Future 423px), preserving every building rather than trimming it to a tile mask. Other atlases use the equal-height row boundary.

The runtime scales uniformly and does not apply silhouette clipping. Live turbine hubs and tram/maglev paths were recalibrated to the new illustrations. Small independent effects retain the original animated spirit; Magic adds crystal glow, runic arcs, moon-water rings and rising motes.

Automated checks load all six PNGs, render every sprite, verify grounded horizontal/front tile bounds, detect animation changes, and exercise negative tile-time offsets. Real Chrome checks confirmed the new art in the chooser, field guide, town and final celebrations.

## Next: tile spec v2

The v0.9 atlases are being replaced tile by tile with per-tile PNGs whose slab is exactly the board hex, plus painted actor sprites for animation. See ART-DIRECTION.md for the spec, tools and acceptance checks.

## Stage 0 spec-v2 pilot: plots and lanes (2026-11-09)

The pilot contains four reusable family kerbs and eight Stage 0 static tiles. It follows the revised brief at upstream commit `948b010`: centre (512,1130), a full hex face and 37.8 px kerb. Original building paintings were translated down 90 px without scaling. Earth and garden received targeted built-in imagegen material edits to grey-brown kerbstones and mossy log edging. Only kerb surfaces were replaced; original top/structure art was preserved.

The current [pilot review](stage0-pilot/README.md) records original and revised prompts, raw art, geometry conversion, material compositing and final checksums. Raw/intermediate images and the initial deep-slab pilot are preserved outside git. `stage0-pilot/source-archive.json` records all 66 archived image hashes and the reproduction instructions are in the pilot README. Its five current review sheets remain in git. The canonical `art-provenance.json` record and `SHA256SUMS.txt` describe the revised outputs.

After rebasing onto main at `29b4cb29` and count-agnostic test cleanup, all 87 tests pass. Geometry checks show 100% plot coverage, with tile edges within 0.5 px, and all eight share identical earth kerb pixels. Gallery and close-up inspection verify clear code-drawn lanes and no board-green rim. On-plot paths remain inside plots. This pilot adds no Paragon art, later-stage tiles, actors or glow layers. Concurrent upstream Paragon work is preserved. It is submitted on a review branch only; merging and deployment are outside this revision.

## Stages 1–2 static tiles (2026-11-12)

The next 16 individual tiles follow the [four-PR plan for issue #2](https://github.com/jamesrp/brightfield/issues/2#issuecomment-6815889758). All reuse the unchanged earth kerb. Built-in imagegen supplies the paintings; exact-geometry fitting and narrowly bounded compositing of the existing painted earth slab complete small ground-edge gaps. Moving parts remain out of the static bases. See [batch review and reproduction](stages-1-2/README.md), `stages-1-2/source-archive.json` for externally retained source hashes, and the `tile_spec_v2_stages_1_2` entry in `art-provenance.json` for every prompt, selected source and final checksum. Only the final assets and two town close-ups are added as images in git. Actors, future-stage tiles and deployment are separate work.
## Star full-hex static tiles

The [Star batch](star-static/README.md) records eight separate built-in imagegen tiles, exact shared alloy kerb compositing, source/final checksums and reproducible geometry completion. Raw and intermediate images remain in an external private archive; only the final tiles and one real-renderer town close-up are committed. Exact prompts are in `art-provenance.json`, and `star-static/source-archive.json` records the archived sources.
## Leaf full-hex static tiles

The [Leaf batch](leaf-static/README.md) records eight separate built-in imagegen tiles, exact shared garden kerb compositing, source/final checksums and reproducible geometry completion. Raw and intermediate images remain in an external private archive; only the final tiles and one real-renderer town close-up are committed. Exact prompts are in `art-provenance.json`, and `leaf-static/source-archive.json` records the archived sources.
## Magic full-hex static tiles

The [Magic batch](magic-static/README.md) records eight separate built-in imagegen tiles, exact shared arcane kerb compositing, source/final checksums and reproducible geometry completion. Raw and intermediate images remain in an external private archive; only the final tiles and one real-renderer town close-up are committed. Exact prompts are in `art-provenance.json`, and `magic-static/source-archive.json` records the archived sources.

## Round 2 core actors and travellers

The [core actor batch](round-2-actors/README.md) adds 14 painted sprite files, six age-specific travellers and 15 actor instances across 11 tiles. The missing wind turbine blades, Sun Mirror panels and mill waterwheel now move independently of the unchanged static bases. The mill wheel includes a stationary axle and trough backing. Rail vehicles reverse without mirroring their diagonal painting. Exact prompts, transformations, source/final hashes, portable rebuilding and actual-renderer review sheets are recorded with the batch. Raw generations and intermediate images remain outside git.
