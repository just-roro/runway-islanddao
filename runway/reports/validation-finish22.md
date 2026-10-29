# RUNWAY finish-22 — presentation and continuity

October 19, 2026. Continuation of `routes-21`; same rules `runway-3.0.0-routes` and content `island-routes-8`. The shared core does not change and stays byte-for-byte identical to `services/runway-api/lib/simulation.ts`. Only the frontend is published.

## Causes fixed

- The canvas had antialiasing, but the scene was drawn first into a render target without samples. The HDR target now uses up to 2 MSAA samples; the DPR limit and the quarter-resolution bloom are kept. No scene pass or library is added.
- The warm horizon was reused as the fog color for the whole island. The haze returns to tropical blue, the horizon keeps yellow/pink and the clouds retain volume under the atmosphere. The water gets fine waves and reflections without the rectilinear pattern of the first test.
- The sun was outside the field of view while gliding. An off-center projection reserves more space for the route without changing the physical tilt; sun, light, water, reflective environment and flare share the same direction. The flare has screen-based proportions and lower peripheral intensity.
- After pickup, objects grew and followed the pilot for 420 ms. They now shrink over 220 ms. The coin regains its warm emission; its positive aura stays green. Currents are represented with rising curved strokes instead of cones.
- The final camera looked at the ground to leave room for the panel. It now frames the pilot and the coastal environment, turns them toward the camera and reserves space through projection, with a different composition in landscape. The navigation signs disappear on landing so they do not cross the helmet.
- The final panel changed height when switching from the replay to the totals. Both share a fixed space; chart, counter and events keep the two-second clock. Hangar and retry are available during playback. Rankings are not reintroduced on the results screen.
- QA framing measurements occasionally used the previous camera matrix. It is now updated before projecting; invisible geometry is excluded and vertex measurement is limited to five times per second. This does not alter the simulation.

## Evidence and scope

Local comparisons: [fall before](evidence-polish22/before-fall.png) / [after](evidence-polish22/after-fall.png), [glide before](evidence-polish22/before-glide.png) / [after](evidence-polish22/after-glide.png). Seed 17, states generated with the real test controller. The fall keeps its framing; while gliding and at the end, the camera change is intentional. These screenshots freeze the state and are not equivalent to a human run.

The tests in `tests/browser/presentation.spec.ts` reproduce beach, terrace, Jurerê and water, and check that the pilot is visible, separated from the panel and that buttons are on screen at 390×844, 360×740, 844×390 and 1440×900. The panel height comparison excludes its initial entry animation. WebKit needs sub-pixel tolerance when comparing the viewport.

## Results of the checks

- 45 unit tests passed; TypeScript and Vite build passed.
- Final suite: 10/10 Playwright tests passed in Chromium and WebKit. Includes the initial/repeated tutorial, music continuity, twenty hangar navigations, twelve NFT colors, recovery from a failed GLB, coin preparation with a cold cache, guide and credits.
- Presentation: an additional test passed in both browsers, with four outcomes × four formats. Screenshots of [Jurerê landscape](evidence-polish22/verified-jurere-844-webkit.png), [beach](evidence-polish22/verified-beach-390-webkit.png), [terrace](evidence-polish22/verified-terrace-390-webkit.png) and [water](evidence-polish22/verified-water-390-webkit.png).
- Full real-speed runs, automatically controlled: Chromium 55.03 s / 1,845,000; WebKit 53.42 s / 1,616,250. They use different seeds and controller inputs, not a replay equivalence comparison. The shared simulation did not change.
- Maximums recorded during those runs: 48 draw calls; 81,655 triangles in Chromium and 83,433 in WebKit, within the budgets of 70 / 90,000. These are not FPS measurements on physical phones.
- Exit: pilot/camera distance between 3.91 and 5.02 units in the WebKit samples; final tilt 66.015°. Pilot size of 31.34% of the height in the five formats checked; variation under 0.001 percentage points.
- Twenty retries per browser: maximum 416 ms in Chromium and 331 ms in WebKit. No canvas rebuild or repeated model downloads when switching pilots.
- 2-sample MSAA and visible sun/flare projection checked while gliding. Final screenshots of [gliding](evidence-polish22/verified-canopy-webkit.png) and [real result](evidence-polish22/verified-results-webkit.png).
- The automated economy validation over 600 runs belongs to `routes-21`; it was not repeated and is not presented as a new sample for this iteration.

## Limits

No tests were run on physical iPhone/Android or with five human testers. Emulation and screenshots do not replace those checks. The finish is still an interpretation of the references' visual language, not a reproduction equivalent to their renders.

## Rollback

Previous frontend: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_494f2be716808191816bb569f58efcb8`, commit `a86f16320e1ef2145370afc8c1fffc453c56ee3c`.
Compatible API, unchanged: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_84e8102324608191bf05d6846a9832fc`.
