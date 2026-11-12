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

## Stage 0 spec-v2 pilot (2026-11-09)

Four reusable family slabs and eight Stage 0 tiles were painted separately with built-in imagegen. The 1024×1536 outputs use the exact spec-v2 hex and shared family side faces. Stage 0 moving subjects were omitted for later actor layers; smoke emitter locations are in the manifest.

The source prompts, raw outputs, fit reports and deterministic geometry normalization are preserved in [stage0-pilot](stage0-pilot/README.md). Small edge gaps were filled using the generated earth surface; the well first received a targeted imagegen geometry edit. Reusable side interiors were made opaque before compositing, and a pixel-level test verifies that all eight share identical earth side pixels. The canonical output hashes and full prompts are recorded in `art-provenance.json` and `SHA256SUMS.txt`.

The gallery and dense-town previews show the new art without the old board-green rim. Existing street gutters and procedural inter-tile travellers remain renderer behaviour for later rounds. This pilot stops for review before the other 40 tiles. No Paragon artwork or publication is included.
