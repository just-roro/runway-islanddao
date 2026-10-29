# RUNWAY — Batch 3/6: Parachute Experience & Environment

Date: 2026-10-22. Local implementation, not published. No other batch was started.

## IMPLEMENTED

- **Storm and exit:** the grey fog increases on approach and stays dense down to the bottom edge of the layer. 48 cloud lobes were added in world coordinates, reusing the existing instancing. Sky, fill light, sunlight, fog and post-processing all use the same atmospheric envelope. The island stays mounted during the flight and is revealed through the atmosphere, without switching its group on midway through the descent.
- **Synchronized opening:** the layer ends 0.2 s before the start of the existing one-second opening. Exposure adaptation, bloom and the existing reveal sound follow that milestone. Controls, canopy animation, opening duration and current lift were not altered.
- **Currents:** 36 rising ribbons with a directional tip, split between the two columns; circular boundaries at the base, middle and top of the real physical volume. Visible from the moment you exit the clouds. Two instanced draws, with no per-particle objects or textures. Pause and reduced motion are respected.
- **Stars while gliding:** two alternatives, one at the exit of each current. Shared visual and opening radius (3.2). Reuses Batch 1's continuous detection, fixed position after contact, yellow flash and spin. Each star grants the existing bonus only once. The 1.2 s boost increases horizontal speed by up to 25%; it does not increase descent speed or the lift budget.
- **Birds and rainbow:** two groups of three birds progressively join on both sides of the pilot, at a smaller scale, with flapping and orientation following their motion. A distant rainbow fixed in the world, with soft edges and atmospheric attenuation; a single 160-triangle mesh, with no additional texture.
- **LOD:** rocks no longer depend on a cut at 240 units or on being among the 48 closest. Eight-triangle silhouettes at distance, close-up detail and coverage-based transition, frustum culling and full disappearance between 480–620 units. Trees also transition by coverage, with no abrupt change of the 16-closest group. Coast, decoration positions, platforms and colliders are preserved.

## Causes fixed

1. The layer started clearing many seconds before the canopy opened and ended after the opening started. Now there is a single exit milestone before deployment.
2. The currents were enabled after the canopy opened and their strokes were too thin. They now show during the reveal and have a recognizable direction and boundaries.
3. The generic boost only sped up the fall clock: applied to gliding without adaptation it would have increased sinking. While gliding it affects horizontal speed; the currents keep their previous rate and limit.
4. Rocks were removed before reaching the material's fade distance. Culling now happens after coverage reaches zero.
5. During verification, a mismatch appeared between the configuration uniforms and those of the material actually mounted: the rendered visibility stayed at zero. Ribbons, rainbow and sky now update the effective material; the test checks those values and the resulting images were reviewed.

## TESTS RUN

- Production TypeScript/Vite build OK. The known warning about the Three bundle size remains; no dependencies were added.
- 27 focused tests of atmosphere, stars, simulation, sound sync, geography and clock; plus two vegetation tests. The old habitat test expected 96 trees, but the existing generator already produced 112; that expectation was corrected and both tests passed. Tree density was not changed.
- SHA-256 comparison over **1,000 seeds**: removing only the two new stars, every generated object matches the baseline exactly. Includes IDs, order, economy, obstacles and sequences.
- **200 automated flights**, 50 seeds per side/current combination: 100/100 with currents reached Jurerê and collected the corresponding star; 0/100 without currents reached Jurerê (they landed at Terrace). These are automated controllers, not human tests.
- Boost, single collection, continuous sweeps, no star attraction and greater reach without added sinking checked by executable tests.
- **Four final browser tests**: full real flight + scenery inspection, in Chromium and WebKit. Screenshots and video from the plane, storm, reveal, opening, currents, star activation and landing. Reproducible replay, a single grant of the new star, stable pause, no shader or JavaScript errors in the final run.
- Two additional tests in both browsers: horizon coverage, pause and reduced motion.
- Formats: emulated Pixel 7, emulated iPhone 13, 1440×900 and 844×390. A previous pass also reviewed 320×568 and the three landing zones. The artificial viewport change produced a ResizeObserver warning in WebKit; the log was kept and separated from graphics errors, without modifying the UI in this batch.
- Frontend core and local API copy identical. `CONTENT = island-glide-13`; competitive rules and PB preserved. The production API was not contacted during the browser tests.

## Observed performance

Includes scene, shadows and post-processing. RAF intervals during route 19–50; measured on the host machine with emulated viewports, **not on physical devices**.

| Measurement | Chromium baseline | Chromium final | WebKit final |
|---|---:|---:|---:|
| Median frame | 8.3 ms | 8.4 ms | 33 ms |
| P95 frame | 8.9 ms | 10 ms | 38 ms |
| Max draw calls | 60 | 61 | 61 |
| Max triangles | 88,015 | 89,071 | 88,985 |

GPU objects observed at the end: up to 79 geometries and 24 textures. These are Three counts, not a measurement of GPU memory in MB. No WebKit performance baseline was captured in this intervention. Screenshots cause a few isolated pauses of about 300 ms; they are kept in the telemetry and are not interpreted as jumps in the camera trajectory.

## Evidence

- [Consolidated metrics](verification.json), [route simulations](routes.json), [fingerprints of the previous course](course-before.json).
- [Previous storm](captures/before-inside-clouds.png) / [current storm](captures/final-inside-clouds.png).
- [Before opening](captures/final-clearing-before-canopy.png), [opening](captures/final-canopy-opening.png), [island, currents, birds and rainbow](captures/final-sunlit-island-reveal.png).
- [Activated star](captures/final-glide-star-activated.png), [desktop view](captures/final-glide-1440.png), [distant coast](captures/final-coast-400.png), [close LOD](captures/final-coast-65.png).
- Videos, traces and full telemetry kept locally in `final/`; original shots in `before/`. Those heavy files are not included in Git.

## PARTIAL / PENDING

- Pending validation of touch controls/sensors and sustained performance on physical iPhone and Android. Emulation does not replace that validation.
- The visual review covers the screenshots of each milestone and the continuity telemetry; the run was recorded. No session with human testers was held.
- Not published: before a future release, compatible frontend and API must ship together, because there are new stars and a boost adaptation in the shared core.
- Production ZIP intact: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Local rerun

From `runway/`, with Node 24:

```sh
npm run build
npm test -- tests/parachute45.test.mjs tests/sky38.test.ts tests/stars43.test.ts tests/storm.test.ts tests/audio36.test.mjs tests/world39.test.ts tests/presentation-clock.test.ts tests/habitat.test.ts
RUNWAY_BASE_URL=http://127.0.0.1:5181 npx playwright test tests/browser/parachute45.spec.mjs --workers 1
```

The seed test uses `course-before.json`; do not regenerate it from the new version.
