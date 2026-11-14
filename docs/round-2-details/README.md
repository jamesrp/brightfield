# Round 2: remaining moving parts

This independent batch starts from merged main `38f6cee23ae608066b91e356e2bb134da3f9282a` after PR #11. It complements [the core actor/traveller batch](https://github.com/jamesrp/brightfield/pull/12) and restores five moving parts deliberately left out of the approved static art:

- A gently swaying robot arm on the Stage 2 foundry pedestal.
- A spinning wheel on the Repair Guild bicycle fork.
- A lift platform moving through 380 tile pixels of the Star food stack's exposed shaft over 12 seconds.
- A softly pulsing flame inside the Magic forge aperture.
- A slowly spinning, gently bobbing orb above the transmutation cradle.

The five source paintings were generated separately with built-in imagegen using the actual static tiles as style and placement references. Deterministic crop, resize and transparent padding create the final sprites. Static base PNGs, shared kerbs and production renderer code remain unchanged. Raw generations and full-resolution diagnostic composites remain in the private external archive.

## Reproduction

`metadata.json` records source hashes, crop rectangles, final sizes, pivots and exact actor placement. `prompts.json` contains the full prompts. `final-hashes.json` pins every final sprite. From the repository root:

```sh
node docs/round-2-details/rebuild.cjs /path/to/private/archive /path/to/rebuilt-output
```

The versioned script verifies raw and final hashes. All five sprites rebuild byte-for-byte.

## Verification and review

- 90/90 tests pass, including actual-renderer motion changes for each new part.
- All 48 static tiles pass `art:check`.
- All five continuous swept envelopes pass `art:motion:check`.
- The lift's complete footprint stays within x706.5–793.5 and y551.5–967.5, clear of the shaft roof and base.
- Existing base tiles and renderer code are byte-unchanged from merged main.
- Independent full-cycle and town visual review passes for all five parts; see [review notes](qa/visual-review.md).

The motion checker is identical to the one in the core actor batch. This branch is independently testable from main. When combining it with the core and glow batches, preserve all manifest/provenance additions and regenerate `SHA256SUMS.txt`.

Run `npm run art:preview`, then `node docs/round-2-details/render-review.cjs` for the compact production-renderer sheets:

- [Moving-part cycles](review/moving-parts.png)
- [Town close-ups](review/towns.png)

No merge or deployment is included.
