# RUNWAY routes-21 — implementation and evidence

Candidate from October 19, 2026. Rules `runway-3.0.0-routes`, content `island-routes-8`. The frontend and API core are byte-for-byte identical.

## Delivered changes

- Centralized economy, progressive penalty 2% / 20% / 100%, single-hit Water, no time-based spending. SOL was adjusted from the initial proposal of 10,000 to 15,000 after the simulations: the proposed table was a starting point. Everything else keeps the approved values. FUNDED requires 500,000; there is no capital ceiling.
- Removed the Funding/Strategy decisions and their four exclusive effects. Three continuous routes, 128 SOL, stars and spatial sequences. Jurerê needs the currents; both alternatives were tested. Earlier rankings, identities and unlocks are kept; the new marks are versioned.
- Skinned pilot with 15 bones, 5,344 body triangles, three materials and eight clips. Real knees/elbows, PERKS colors kept and canopy lines connected to the animated hands. PhysicalMaterial helmet with emissive LED and static radiance maps for interior/exterior.
- Plane: ribs, ducts, panels, hardware and three material families; hatch opening and pivot kept. Separate exporters for plane, city and pilot avoid overwriting the new rig.
- Coast, terrain, buildings and collisions with a common orientation; leveled landing surfaces. Water with depth derived from the coast, consistent sunlight, warm horizon and distant clouds. Birds, jet skis, vegetation, coastal activity and a decorative bridge outside the routes.
- Coin prepared on load and each instance visible only next to the number. SVG pause. Tutorial and optional 14-item guide. Human Friendly credits with the original logo and four names. Results without CEO/STARTUP panels, real two-second economic replay, visible pilot and immediate retry.
- Fixed the repeated 700 ms wait caused by a missing sensor; Tilt allows retrying explicitly. Adaptive resolution no longer stays permanently reduced by the initial shader compilation.

## Reproducible balance

`node scripts/balance.mjs`: 100 seeds per route and controller, 600 runs with exact replay. Precise control at 30 Hz and delayed control at 7.5 Hz. These controllers know the positions; they are not people and do not estimate difficulty for a beginner.

| Route | Control | Mean | Median | P10 / P90 | In 500k–2m | Goal reached | Mean duration |
|---|---|---:|---:|---:|---:|---:|---:|
| beach | precise | 1,184,125 | 1,170,000 | 1,017,500 / 1,412,500 | 100% | 100/100 | 54.07 s |
| beach | delayed | 660,610 | 660,000 | 490,000 / 835,000 | 89% | 100/100 | 54.56 s |
| terrace | precise | 1,361,744 | 1,345,500 | 1,170,125 / 1,624,375 | 100% | 100/100 | 51.85 s |
| terrace | delayed | 742,080 | 750,375 | 540,500 / 968,875 | 96% | 95/100 | 52.34 s |
| jurere | precise | 1,776,188 | 1,755,000 | 1,526,250 / 2,118,750 | 84% | 100/100 | 54.47 s |
| jurere | delayed | 829,548 | 798,750 | 475,000 / 1,230,000 | 87% | 49/100 | 54.97 s |

All 600 controllers landed; goal misses ended on safe ground without their bonus. The delayed controller reached Jurerê in 49/100 attempts. The 20 motionless controls lost and ended at zero. None of these pickup controllers prioritizes the sequences: their mean number of sequences is zero; independent tests go through a full chain with and without boost. This is not presented as human validation of the incentive.

Without currents, an optimistic bound (early entry, instant maximum speed, no crashes) ends 21.2 units short of the valid edge of Jurerê. The test includes this bound and physical flights through both currents. The player can land on the beach/ground without a bonus; missing the destination does not force a defeat.

Full data: [balance-routes.json](balance-routes.json). Inventory: [Markdown](content-inventory.md), [CSV](content-inventory.csv), [real models](content-contact-sheet.png).

## Validation run

| Check | Result / scope |
|---|---|
| TypeScript + build | OK. Vite warns about the large Three chunk; it is not an error. |
| Unit | 45 tests, 10 files: 30/60 replay, economy, Water, magnetism, chains, routes, water, bankruptcy and single grants. |
| Browsers | 8 general tests and 2 additional ones, each relevant flow in Chromium/WebKit; 5 formats for camera and fullscreen. Full walks repeated after visual adjustments. |
| Fall camera | 66.015°; projected height ~31.78% with variation well under ±3 points across formats. Exit between 3.86 and 5.02 units; without the old pull-back to 20. |
| Retry | 20 cycles per browser with endings obtained through accelerated replay: maximum 687 ms Chromium and 451 ms WebKit. Canvas and music kept. Not equivalent to 20 real-time flights. |
| Cold load | Coin download held: loading stays and coin/amount appear together. A failed GLB recovers without reloading the page. |
| Audio/customization | 20 navigations, 12 NFT colors, background/interruption, mute and no duplicate tracks. |
| Local API | Identity, atomic three-seat limit, someone else's ticket, invalid input, incomplete run, arbitrary score ignored, idempotency, fixed membership, persistent rankings and rate limit. Validated run: 1,800,000. |
| Observed render | Last walk: maximum 48 draw calls / 83,793 triangles, including passes counted by the renderer. Does not certify ten minutes on a phone. |
| Download | All non-music assets of the build: 4,446,255 bytes uncompressed; gzip estimate 1,346,707 bytes. Music on demand. This is a file estimate, not a 4G measurement. |
| Local replay | 20 replays on Node 24: median 53.77 ms / P95 71.87 ms. Not a Worker CPU measurement. |

## Visual evidence

- [Fall before](evidence/freefall-before.png) / [after](evidence/freefall-after.png): seed 17, tick 600, FOV ~78°, camera offset [0, 4.65, 1.88]. [Measurements](evidence/comparison.json). Same camera and time state; rules and art change.
- [Menu before](evidence/menu-before.png) / [after](evidence/menu-after.png).
- Plane with fixed Blender framing: [before](evidence/aircraft-before.png), [after](evidence/aircraft-after.png), [open](evidence/aircraft-open.png).
- [Exit](evidence/exit-after.png), [storm](evidence/storm-after.png), [glide](evidence/canopy-after.png), [result](evidence/results-after.png).
- [Full WebKit flight](evidence/full-flight-webkit.webm), [guide](evidence/guide.png), [credits](evidence/credits.png).

## Pending items and explicit limits

- Five testers × five runs and 4/5 comprehension: not run; it requires people. Human balance is not approved yet.
- Physical iPhone/Android, ten sustained minutes and P95 ≤40 ms: not run. Emulated WebKit does not vouch for Safari on a real iPhone.
- The pickup models are still the existing ones with improved readability/materials/feedback; their final redesign with future references is outside this pass. The inventory flags the silhouettes that can still be improved.
- Visual comparison with the references is still an artistic review: the metrics do not prove finish equivalence with the target images.

## Compatible rollback

Restore both Sites; do not mix the old API with the new client:
- Frontend arcade-20: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_4d9506438bec81918c4c37d75ef56dc1` · commit `3c3610f8b7cd2c8dd80b94b51801f6e58358c68f`.
- API arcade-20: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_95f25afaf9e881918ff2bf4905771503` · commit `c13140ef999a16922bac692d7ae32b4094a82fd2`.
- No destructive changes to tables, identities, memberships or cosmetics. `score` is still an alias of final capital.
