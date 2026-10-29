# Pickup audit — baseline for intervention 48

## Confirmed result

COMMUNITY, TERM SHEET and MAGNET are generated in every run: they are guaranteed slots, not entries in the probabilistic obstacle table. Clearance resolution does not remove them. Items and ObjectGlows iterate over their definitions and do include their geometries. No zero probability or disabled flag was found.

The previous presentation uses visual radii of 0.52 / 0.60 / 0.50, respectively, and the items' own fog between 30 and 110 units. Their Z positions are between 347 and 352; the pilot finishes the exit at Z341.6. These factors reduce anticipation and readability unless the user also judges the depth of the route. Three of their seven slots are inside the storm.

## Expected and observed frequencies

10,000 consecutive reproducible seeds, 0–9999. Counts after generation and clearance. Rings count members of the sequences; that does not mean they are all visible at once.

| Item | Expected per run | Observed per run | Runs with the item | Fall / glide |
|---|---:|---:|---:|---:|
| sol | 128.0000 | 128.0000 | 100.00% | 104.0000 / 24.0000 |
| gas | 18.0483 | 18.0910 | 100.00% | 12.4083 / 5.6827 |
| star | 18.0000 | 18.0000 | 100.00% | 16.0000 / 2.0000 |
| community | 3.0000 | 3.0000 | 100.00% | 3.0000 / 0.0000 |
| delivery | 11.8293 | 11.7902 | 100.00% | 11.7902 / 0.0000 |
| term | 2.0000 | 2.0000 | 100.00% | 2.0000 / 0.0000 |
| gate | 19.0000 | 19.0000 | 100.00% | 13.0000 / 6.0000 |
| hacked | 3.6736 | 3.6634 | 99.82% | 2.8683 / 0.7951 |
| magnet | 2.0000 | 2.0000 | 100.00% | 2.0000 / 0.0000 |
| rug | 15.5068 | 15.5134 | 100.00% | 9.9912 / 5.5222 |
| water | 1.0000 | 1.0000 | 100.00% | 1.0000 / 0.0000 |
| rare | 0.0400 | 0.0375 | 3.75% | 0.0375 / 0.0000 |

For delivery/gas/rug/hacked, the expected value accumulates the conditional probabilities of each slot, respecting the no-immediate-repeat exclusion, the HACK cap and obstacle-only slots. The 4/3/2/0.6 weights are not presented as global percentages: the constraints change the effective split. For Rare Cargo the configured probability is 4%; the observed 3.75% is within the expected sampling fluctuation.

RISK remains as a residual type and renderer, but it is not in CONTENT_CATALOG and is not generated. It is not an enabled item removed by accident. Buildings and ocean belong to separate collision systems and are not counted as pickups.

## Visibility and overlap

Analytic estimate of the stable fall framing at 390×844, without simulating geometry occlusion or capturing the browser: following the SOL route, the window with diameter ≥20px and object contrast >50% averages 0.42s for COMMUNITY, 0.63s for TERM and 0.63s for MAGNET. It is a sign of little anticipation, not a definitive visual measurement.

In a geometric check over 1,000 seeds, the envelope of the first MAGNET touches other envelopes in 11.7% of cases; the second, 36.6%; the last COMMUNITY, 19.4%, mostly rings. A ring is hollow: this indicates a risk of visual overlap, **not a confirmed collision bug**. Changing routes or hitboxes based on this test alone is not recommended.

## Automated verification

- `tests/pickups48.test.ts`: 2,000 seeds, determinism, guaranteed slots, complete enabled catalog, HACK maximum, no immediate encounter repeats and rarity rate.
- 100 runs with real quantized controls through the existing controller `tests/test-pilot.ts`, without teleporting or modifying the balance/course; verifies the effective COMMUNITY/TERM reward, MAGNET duration and no duplicates. Five runs are reproduced exactly through `replay()`.
- `reports/tutorial48/pickup-audit.mjs`: reproducible audit of 10,000 seeds and analytic visibility estimate; output in `pickup-audit.json`.

## Localized recommendation

Keep quantities, generation, economy and collisions. Only increase the presentation size of the three items within the existing contact envelope, sharing that size between model and glow, and make their approach more readable. Complete it with visual browser QA to confirm that this improvement fixes the reported perception.
