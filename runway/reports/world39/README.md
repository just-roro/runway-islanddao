# WORLD-39 — Batch 3/7: Florianópolis World Overhaul

Implemented and verified on October 21, 2026. World presentation only: OSM coastline, physical heights, controls, pickups, collisions, flight routes, economy, API and competitive rules are preserved. Baseline and rollback: `sky-38`.

## Diagnosis and changes

| Requirement | Status | Change and check |
| --- | --- | --- |
| Grass on green surfaces | IMPLEMENTED | The exclusion used for trees also emptied the low-vegetation corridor. There are now 2,230 deterministic positions and up to 768 visible tufts, versus 1,253 / 256 in the baseline. Five curved blades per tuft, ten triangles, scale and rotation variation, wind in the shader and height reduction with distance. No transparent atlas or overdraw layers. Asphalt, sand, buildings and platforms stay clear. |
| Trees and palms | IMPLEMENTED | 112 trees versus 96. Two palms with curved trunks and nine arched fronds in close detail; coastal tree with a clustered canopy. LOD, at most 16 detailed trees and frustum culling. Bases resting on the visible terrain triangles. |
| Grey coastal rocks | IMPLEMENTED | 306 candidate locations along the coast, large and small sizes, excluding bridge and platforms. At most 48 visible: up to 16 with 80 triangles and the rest with 20. Grey material with mineral variation and asymmetric geometry. |
| Road network and bridge | IMPLEMENTED | Six routes connect the existing access, the north/south spine, the urban sector and a side branch. Distances baked into a shared texture; asphalt, lines and shoulders are drawn over the real terrain, without a second coplanar surface. The first node matches the bridge anchor exactly. Its geography and the coastline are not altered. |
| Cars | IMPLEMENTED | Ten instanced cars, continuous routes with lanes and curved turnarounds. Resting on four wheels over the rendered mesh, with longitudinal and lateral tilt. Continuity, staying on land and separation from buildings/platforms are tested. This is decorative traffic; it has no road physics or traffic lights. |
| Air life | IMPLEMENTED | Six of the fifteen existing birds accompany the player while gliding; the other distributed flocks are kept. Five ambient skydivers with descent, suspension and swaying, and three distant balloons. Kept apart from the central corridor and the reward objects. |
| Sea life | IMPLEMENTED | Five boats on elliptical routes verified to stay off the coast, ten swimmers with arm and leg motion, and the four jet skis and their wakes are kept. The routes do not cross the island or modify collisions. |
| NPCs | IMPLEMENTED | The system of 64 articulated residents is kept. Larger body scale and an LED helmet proportioned to the pilot's look; feet on the rendered surface. Bodies and umbrellas outside the frame are culled. Walking, talking and resting reuse the existing behaviors. |
| Platforms | IMPLEMENTED | The clipping was caused by ground triangles cutting through the analytically flattened circles. The triangulation now has 32-sided holes matching each platform. Physical radii and heights are kept. New edges, center sign, beacons and materials. Ray-based verification in the three zones. |
| Moving lights | IMPLEMENTED | Two projectors per destination, raised beams with a slow sweep, a single instanced draw call and no additional shadow passes. Pause freezes the motion. |
| Fireworks | IMPLEMENTED | Three colored bursts, 192 particles in a single draw call, gravity, damping and fade-out. They require `landed`, a valid destination, a position within its radius and a real contact height. They grant no money. Water, bankruptcy and ground outside a platform do not trigger them. The material clock is verified in addition to the activation flag. |
| Real event venue | PREPARED, NOT REBUILT | `jurere-event-venue` is kept, origin at the destination, meters/Y up/+Z toward the approach and a replaceable visual group. No new house and no claim of architectural reproduction. |

The road network is a simplified interpretation adapted to the compressed world, not a street survey. Orientation based on the Centro–Norte relationship of the [SC-401, source ALESC](https://www.alesc.sc.gov.br/radio/noticia/audiencia-publica-debate-obras-de-ampliacao-da-sc-401-na-capital/) and the SC-402/404/405 connections documented by the [Secretaria da Infraestrutura e Mobilidade](https://www.sie.sc.gov.br/webdocs/sie/doc-rodoviario/Denomina%C3%A7%C3%A3o-de-Rodovias-SC16fev2023-Ordenadas-por-Rodovia.pdf). The existing OSM attribution is kept.

## Validation run

- TypeScript and production build.
- **15/15 technical tests**: `tests/world39.test.ts`, `island29.test.ts`, `sky38.test.ts`, `camera.test.ts`. They include connection to the bridge, roads over land and outside buildings, continuous turnarounds, resting on relief, platform holes, reproducible distribution, sea routes, geometry budgets and camera continuity over the modified terrain.
- **8/8 browser tests**, Chromium and WebKit, `tests/browser/world39.spec.mjs`. Full real-time flight to Jurerê; real approach and landing at South Beach at 320×568 and Island Terrace at 844×390; ambient motion, pause and no fireworks off-platform. Emulated Pixel 7 and iPhone 13 viewports for the full flight.
- The six flights/landings checked match the shared simulation replay. The full seed 17 flight keeps **1,657,500** at Jurerê. No changes to the core file or the backend; no new remote replay was run against the API.
- Zero page/shader errors in the scenarios. Camera clearance from the terrain checked during the three landings; its cinematic path is not modified.
- Real screenshots reviewed from the plane, glide, island, coast, boats, swimmers, balloons and skydivers. The actual appearance of particles in the victory framing was reviewed, in addition to their telemetry.
- The first measurement slightly exceeded 90,000 triangles. It was fixed with tree/resident culling and rock LOD, preserving close detail. The first approach tests had the simulation one tick ahead on an odd tick; the harness was fixed to continue at an input boundary, and replay equality passes in the six final cases.

## Performance and memory

Measurements on Apple M5 with Metal in local Chromium and WebKit. The `requestAnimationFrame` intervals include screenshots/recording; they are not isolated GPU times and are not equivalent to physical phones. The renderer counters include the render passes.

| Full flight | Median | P95 | Max draw calls | Max triangles |
| --- | ---: | ---: | ---: | ---: |
| Baseline sky-38 / Chromium, previous log | 8.3 ms | 9.1 ms | 57 | 79,539 |
| world-39 / Chromium | 8.3 ms | 10.0 ms | 60 | 88,051 |
| Baseline sky-38 / WebKit, previous log | 17.0 ms | 20.0 ms | 57 | 79,695 |
| world-39 / WebKit | 17.0 ms | 20.0 ms | 60 | 87,863 |

A new baseline was also taken before editing, with identical approach/glide/landing cameras. In Chromium, P95 of 9.1/9.2/9.1 ms before and 9.9/9.9/9.9 ms after. The full table is in `summary.json`.

Estimated geometry buffers of the scene meshes: **4,439,152 → 4,761,104 bytes** (+321,952). Registered textures: **22 → 23**. The new road texture takes 3,108,800 bytes at base, roughly 4.15 MB with mipmaps. Existing materials, instances and targets are reused; there are no new reflection captures or shadow maps. These figures are buffer sizes and resource counters; **the browser does not expose the driver's real VRAM**.

## Evidence and reproduction

- [Before/after comparator and recording](comparison.html).
- [Measured summary](summary.json), [geometric checks](geometry-checks.json).
- `scripts/qa-world39.mjs before|after chromium` records the fixed cameras with the server on 5183.
- `scripts/qa-world39-detail.mjs` records details of the assets and particles in the scene.
- `RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/world39.spec.mjs --workers=1 --output=reports/world39/final` reproduces the validation of both engines.
- Selected screenshots in `preview/`; videos, traces and full metrics from `before/`, `after/`, `draft/` and `final/` remain local and excluded from Git because of their size.

## Real pending items and compatibility

- **Pending:** ten sustained minutes on physical iPhone and Android. Not available in this intervention; thermal performance and memory of those devices are not certified.
- The photos and the reconstruction of the real venue are still pending the user's references, deliberately outside this batch.
- The next batch was not started. No mechanics, dependencies, music, sounds or competitive changes were added.
- Frontend `world-39`; release recorded separately in `publication.json` after deployment.
- Rollback: `sky-38`, commit `d2b5ea1ffecc8b1bf517d9465f29522ca49163be`, Sites version 39, `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_38027f1c39c08191a33aca62dc640312`. API kept: version 19, commit `2c119322b84673921c3d9d743847f0f1730ea0fe`, rules `runway-3.2.0-chains`, content `island-routes-10`.
