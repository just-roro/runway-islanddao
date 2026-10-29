# SKY-38 — Batch 2/7: sky, clouds and landing

Implementation and validation: October 21, 2026. Scope limited to atmosphere, clouds, landing camera and the idle that follows. Does not modify economy, item generation, controls, physics, destinations, API or competitive rules.

## Causes and implemented changes

| System | Confirmed cause | Change |
| --- | --- | --- |
| Sky depth | The previous distribution was concentrated around the route; the short exterior fog hid the background. | Deterministic three-scale field: 64 nearby lobes, 128 intermediate banks and 120 distant billboards with eight silhouettes. Banks below the plane and coverage around the whole horizon, up to roughly 2,100 units. Fixed positions, culling with margin, three draw calls and a shared atlas. |
| Exiting the clouds | There was adaptation for the hatch, but no common envelope for storm exit, fog and opening. | `atmosphere.ts` uses the same route clock for immersion, clearing, exposure, bloom and warm haze. It restores its normal values after deployment. Reuses the existing post-processing, with no additional passes. Pause freezes the transition; reduced motion softens the effect. |
| Final camera | Buildings were checked, but not the visible triangulated surface. The orbit could cross pillars or stay high and static. | The real terrain and platforms are queried, with a margin for the camera/near plane. A complete path free of buildings is selected: approach, turn of up to 120° and pull-back for the results. It starts from the real arrival pose and adapts distance/framing to the panel. |
| Pilot after landing | The celebration froze on its last frame. | A single celebration followed by the existing idle with breathing and weight shifts. Rig, clips and animation blending are kept. The complementary turn ends showing the face. |

During review, banks that were too angular and an atlas that produced visible rings were discarded. The orbit selection was also fixed when testing the actual arrival position at Jurerê, offset from the center of the platform. The `final/` evidence corresponds to those complete fixes.

## Tests run

- TypeScript: `npx tsc --noEmit` with no errors.
- `npx vitest run tests/sky38.test.ts tests/camera.test.ts`: **6/6**. Deterministic coverage in eight sectors, variants, geometry budget, exposure recovery, reduced motion and paths over real terrain at 15 landing positions and four final distances.
- `SKY_ASSERT=1 RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/sky38.spec.mjs --workers=1 --output=reports/sky38/final`: **10/10**, Chromium and WebKit.
- Full real-time flight, seed 17, quantized QA controller. Both engines land at Jurerê with **1,657,500**, the same result as the baseline. Final state identical to the shared simulation replay. No page errors in the tests.
- Camera on emulated Pixel 7 (412×839), emulated iPhone 13 (390×664), small mobile (320×568), landscape (844×390) and desktop (1440×900). All three destinations pass; the format tests fast-forward the simulation to the approach and then run the real render and landing.
- The four camera orientations outside the plane show intermediate and distant clouds. Minimums observed per orientation: **12 intermediate lobes and 13 billboards**, also outside the central corridor.
- The whole character stays within the final viewport, with the face toward the camera and idle active. Different knee transforms are recorded after the celebration. Minimum clearance from the terrain in the format scenarios: **3.46 units**. The ray and terrain checks also validate the orbit path.
- Screenshots reviewed for opening, layer from above, immersion, lit exit and landing. Continuous recordings available. Frames extracted from the video show contrast recovery and continuity through to the results.
- No new remote replay was run against the API: this batch does not alter the shared core or the server. The browser tests use a controlled 503 API response to run a reproducible local game.

## Observed performance

Frame intervals measured with `requestAnimationFrame` during the flight and the ending, with recording and screenshots active. These are host machine measurements with viewport emulation; **they are not isolated GPU times and do not certify phone performance**. Draw calls and triangles include the passes recorded by the renderer.

| Run | Median | P95 | Max draw calls | Max triangles |
| --- | ---: | ---: | ---: | ---: |
| Baseline gameplay-37 / Chromium | 8.3 ms | 9.0 ms | 56 | 82,573 |
| sky-38 / Chromium | 8.3 ms | 9.1 ms | 57 | 79,539 |
| sky-38 / WebKit | 17.0 ms | 20.0 ms | 57 | 79,695 |

The tested scenarios stay below 70 draw calls and 90,000 triangles. The reduction in maximum geometry comes from the distribution/culling change, not from reducing the island's detail. No previous WebKit baseline was obtained to compare its delta.

## Evidence

- Representative versioned screenshots: [previous sky](preview/clouds-before.png), [final sky](preview/clouds-after.png), [island reveal](preview/reveal.png), [final landing](preview/landing.png).
- The full `before/` and `final/` folders, videos and telemetry are kept in this workspace, outside Git because of the publishing server's size limit. The comparator and the following links work with that local evidence.
- [Numeric summary](summary.json), with the original metrics per scenario in `before/` and `final/`.
- [Visual comparator and videos](comparison.html).
- [Previous flight, Chromium](before/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-chromium-mobile/video.webm).
- [Final flight, Chromium](final/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-chromium-mobile/video.webm).
- [Final flight, WebKit](final/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-webkit-mobile/video.webm).

The screenshots use the same seed, controller and time thresholds; the capture moment may differ by a few frames, especially in the animated counter. They do not represent a sample of human players.

## Real pending items and release

- Tests on physical iPhone and Android and sustained ten-minute sessions: **pending**, devices not available.
- No other batch was started. No mechanics, libraries, audio, architecture or external assets were added.
- Frontend identified as `sky-38`; release recorded separately in `publication.json` after deployment.
- Rollback: frontend `gameplay-37`, commit `06a89d97192a671ff9817d37cc5550ed97887e70`, Sites version 38 (`appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_7b8ace185e74819197f43e04fb9cc88e`). API kept: version 19, commit `2c119322b84673921c3d9d743847f0f1730ea0fe`, rules `runway-3.2.0-chains`, content `island-routes-10`.
