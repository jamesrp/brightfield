# Brightfield v0.10.0 balance notes

## What changed

| Setting | v0.9 | v0.10 | Why |
|---|---|---|---|
| `sunBase` (sunbeams per idea curve) | 7 | 6 | Smog now dims sunbeams; this keeps the game as short as v0.9 |
| `smogDim` | none | 0.5 | Placement sunbeams × (1 − 0.5 × smog), never below 1 |
| Haze floor | none | 0.20 + 0.03 per smoky kind | The sky cannot look clear while any kind is still smoky |
| Nature's cleaning | unlimited | cancels at most half the smoke | Nature helps, but only technology clears the sky |
| Deep Well smoke | 1 | 0 | A bucket on a rope burns no fuel |
| Factory ♥ coal/gas | none | +1 heart ("cheap") | The smoky start is a real boom |
| Prerequisites | none | 5 links, plus clear sky for every future | See README |

## Simulated pacing (200 seeds each, cozy mode)

"Careful" places greedily and upgrades the smokiest kind first. "Mixed" plays half greedy, half random. "Random" places randomly next to the town and upgrades at random.

| Player | v0.9 crown | v0.10 crown | v0.10 sky clears at | Sunbeams lost to smog |
|---|---|---|---|---|
| Careful | 52 | 49 | 32 | 8% |
| Mixed | 62 | 63 | 49 | 18% |
| Random | 86 | 85 | 67 | 18% |

Placements are medians. In v0.9 the sky looked clear for a careful player at about placement 19, when only about 8 of 24 upgrades were done, while the last smoky kind was not upgraded until about 43. In v0.10 the sky clears on the same placement as the last smoky upgrade, every time.

The five-seed greedy comparison is in `balance-v0.10.0.json` (v0.10 means: Nature 51.8, Future 51.6, Magic 51.6; v0.9: 52.8 / 52.4).

## Daily Challenge

The 80-tile deck is unchanged. A simulated careful player reached the crown in 60 of 60 seeded challenges (v0.9: 60 of 60). The median score moved from 1566 to 1529. Every game ended normally, including when only locked upgrades remained.
