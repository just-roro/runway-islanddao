# RUNWAY — Batch 5: island and environment

## Implemented

- **Bridge:** replaces the isolated piece at x=-104. Access at (35,3), oriented toward the mainland side of the rotated map, 7.2 units wide and extended for 1,400 units. A nearby suspended span, a simplified viaduct at distance and a coverage-based fade between 180 and 690 units. Keeps depth, without sorting transparent layers. The access road is integrated into the ground shader; it adds no surface that could cut through the terrain. It is a stylized interpretation, not an exact topographic reconstruction.
- **Terrain:** same vertex positions and physical surfaces. Continuous normals, sand/grass/rock blending by coast and slope, procedural variation at several scales and visual roughness/micro-relief. The existing paths remain readable.
- **Vegetation:** about 1,200 eligible locations spread over the island; only the 256 closest within the frustum are drawn. Height fade between 75–140 units; wind anchored at the base and reduced motion respected. Still 96 trees and up to 24 close-detail models. Improved silhouettes of the distant palm trees.
- **Placement:** trees and grass take their height from the rendered triangles, avoiding the mismatch with the analytic function between vertices. Beaches, paths, bridge access, landings, buildings and camera spaces are kept clear.
- **Real venue:** `jurere-event-venue / replaceable-venue-visuals` is kept, with units in meters, +Y up and +Z toward the approach, separate from the functional platform. `DESTINATIONS` still pins the three origins and surfaces. No house or supposedly real architecture was added.

## Verification

- `vitest run tests/island29.test.ts tests/habitat.test.ts`: **4 tests passed**. Connection over land, end beyond the fog, bridge geometry <4,000 triangles, decoration outside excluded areas and height checked with raycasting. Three routes with normal input/replay reach their destinations without crossing the bridge volume.
- Full WebKit flight, emulated iPhone 13: **54.5 s**, Jurerê, **1,755,000** capital, no JavaScript/shader errors. Maximum recorded during this pass: **54 draw calls / 80,771 triangles**, including passes. The last adjustment to the access removed 12 triangles and moved its look into the material.
- [Full video](evidence-island29/flight.webm), [result and metrics](evidence-island29/flight-evidence.json), [landing](evidence-island29/jurere-landed.png).
- Screenshots with seed 17/identical input at 40, 48 and 54 seconds. [Before](evidence-island29/before-chromium-island.png) and [after](evidence-island29/accepted-chromium-island.png), in Chromium 390×844. Final geometry also inspected in WebKit.
- Emulated mobile WebKit, host GPU: median **17 ms**, P95 **18 ms** in the 180-frame windows of approach, island and landing. Full flight at roughly 60 FPS after loading. These are not measurements on a physical iPhone.
- Chromium in the headless mode used by the capturer: baseline 108–117 ms median; afterwards 108–133 ms. It does not reach the mobile target in that environment and is not presented as approval of physical performance. Draw calls of the views: 39–50, no increase over the baseline; additional geometry limited to a few thousand triangles.
- The WebKit inspector logged a `ResizeObserver loop completed with undelivered notifications` warning when the viewport changed. The screenshots were produced and the full flight passed without that error. No UI outside this batch was modified to chase that warning.
- TypeScript/Vite and `git diff --check` verified. No changes to `src/core`, competitive rules, endpoints, economy, speeds or controls.

## Final evidence and reproduction

- [Connected bridge](evidence-island29/release-webkit-bridge-access-lit.png)
- [Bridge into the fog](evidence-island29/release-webkit-bridge-distance-lit.png)
- [Nearby grass](evidence-island29/detail-webkit-grass-near-lit.png)
- [Overview](evidence-island29/release-webkit-overview-lit.png)
- `node scripts/qa-island29.mjs release webkit`: screenshots and JSON against Vite on 127.0.0.1:5183.
- `RUNWAY_BASE_URL=http://127.0.0.1:5183 node node_modules/@playwright/test/cli.js test tests/browser/island29.spec.ts --project=webkit-mobile --workers=1`.

## Pending / limits

- Physical iPhone and Android, ten sustained minutes, and human assessment of the finish.
- Real photos of areas/architecture, final object references and audio: still pending; they were not replaced with invented content.
- The shaders refine the presentation of the relief; they add no physical relief and do not change where you land.

## Release

Frontend island-29 on the existing Site, API untouched. Rollback: menu-28, version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_6f7c97c91da481918f2a8743e9140f59`, commit `be7869137c25186fc41d60b3f8aa08150151eb04`.

Published on 2026-10-20: version 30, `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_c561bc902e2c8191946678ac5e96a1ba`, commit `39fcec7e9245e23b7fc693b4e2992a3f75fb3d82`. Deployment `appgdep_6ad7b176ae9481918604da75ea13b3e5`: succeeded. Public URL https://runway-islanddao.agenciahumanfriendly.chatgpt.site/ .
