# RUNWAY — Item art and particle FX / items-34

Scope: eight supplied references, collection of sequence rings, purchased cosmetic trails. No simulation/API/economy changes, new items, or next phase.

## Root causes and implementation

- `props.ts` supplied coarse merged procedural meshes. Delivery was a shipping cube, Hacked a server block, Rug Pull stacked slabs and Community a three-person disc. Eight replacement generators in `itemArt.ts` now author their referenced silhouettes. Both gameplay instancing and tutorial holograms use the same generator.
- Model source remains reproducible Three BufferGeometry, not imported illustration planes. Labels share one 1024×512 canvas atlas; silhouettes, hoses, cases, layered sheets, handles, terminals, cloth curvature, fringe and medallion relief are actual geometry. Per-vertex material channels distinguish rough paper/fabric, metal, plastic and luminous displays within one draw per item family.
- Every redesigned model is centered and normalized to its existing visual radius. Sphere colliders, generous pickup acquisition volumes, hazard penalty tiers and aperture detection remain unchanged. Positive/negative green/red auras are preserved. The bottle uses opaque stylized liquid and specular highlights, not costly transmission/refraction.
- Rings previously shrank toward the player for 220ms and emitted generic gold sparks. They now hand off to 24 red/white torus fragments at the real contact signal. Each fragment has a centered pivot, radial impulse, tumble and 720ms alpha decay. A fixed instanced buffer handles overlapping cues. Presentation never writes money or collected IDs; only the existing final sequence event pays.
- Trails previously held 22 position samples / 44 opaque diamonds. A 192-slot typed-array pool now emits 48–156 particles per second according to real vertical speed, interpolates spawn positions and varies lifespan, size, lateral drift, rotation and opacity. One draw uses an analytic star/core sprite with no square edge. Life is 0.55–0.95 seconds; pause freezes it and retry clears the pool. SHOP preview and equipped trail retain their real purchased colors.

## References and inventory

See [inventory.csv](inventory.csv). All eight supplied references used; SOL, hollow star, Rare Cargo, buildings and environmental water retain their existing designs. Ring design retained, collection FX improved. `risk` remains inactive. No definitive new designs invented for missing references.

## Reproduction

- `npm test -- --run tests/items34.test.ts`
- `node scripts/qa-items34.mjs final chromium` (local server port 5183)
- `RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/items34.spec.ts`

Visual sheets are lit geometry-only comparisons, not gameplay screenshots. Full-flight recordings show the actual bloom, camera, storm, collections and equipped trail. Synthetic four-ring stress is explicitly separate from real contact/replay validation.

## Limitations

No physical iPhone/Android sustained GPU/thermal measurement. Browser device presets emulate viewport/input, not phone hardware. No human recognition study; legibility review is visual at real game speed. Fine printed text is secondary to silhouette at distance. These are optimized stylized interpretations, not exact reproductions of every painted detail in the reference boards.

## Verification results (2026-10-20)

- TypeScript and production build pass. Four focused unit tests pass: geometry/surface consistency, bounded particle motion, unchanged seed-17 replay and one-time sequence payout, and actual collision of all eight redesigned kinds with their correct values/utilities.
- Six browser scenarios pass across Chromium Pixel 7 and WebKit iPhone 13 emulation: complete deterministic flight with real ring contact, all four SHOP trail variants/equip/reload, and four simultaneous ring bursts. No page/shader errors in the full flights. The existing API is intentionally mocked unavailable for these local visual tests; no new public ranking is submitted.
- Seed 17 lands at Jurerê with **1,755,000** in both browsers and the replay. Events match exactly. A ring contact emits one event and 24 fragments; intermediate rings have zero cash delta and only the final sequence pays. Pausing preserves the simulation tick.
- Purchased violet remains `#bc83ff`; Air, Mint, Violet and Gold previews each use 128 instanced particles. Gold persists across reload and appears during the next flight. Real flight peaks at 111–115 live trail particles in the recorded runs.
- Same-session Chromium, equivalent seed-17 flight sample: before median **8.4 ms / P95 12.6 ms**, final **8.3 ms / P95 14.1 ms**. This is host rAF timing with mobile viewport emulation, not physical-device GPU timing. Small P95 increase; no median regression in this sample.
- Four overlapping synthetic bursts: **96 fragments + 95–99 trail particles**, one fragment draw and one trail draw, economy/event counts unchanged. Chromium median 8.8 ms / P95 18.6 ms; WebKit median 33 ms / P95 44 ms during concurrent browser tests. Those stress timings are not a sustained mobile benchmark.
- Final per-model triangles: Gas 906, Delivery 674, Water 846, Magnet 706, Term Sheet 406, Hacked 994, Rug Pull 1,116, Community 800. Compared with the old geometry, cost is spent on silhouette/detail; micro-bevels on tiny medallion segments were removed after profiling.

Evidence: `reports/evidence/items34/before-chromium/inventory.png`, `final-chromium/inventory.png`, `final-chromium/metrics.json`, browser screenshots/recordings in `final/` and final full flights in `flight-final/`. Revisions found during visual QA: Gas Fee lettering aspect, curved palm leaves, carpet reverse winding, and centered ring-fragment pivots with inherited downward velocity to avoid flying into the camera.

Rollback: **art-33**, source `3b0316f901543fc2f22f6aa01ef53dda899161a1`, saved version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_47f6560812b881919dd54d8a7885ece9`. API and rules unchanged.

Final full-flight recheck after the cloth reverse-face and fragment trajectory corrections: Chromium **55 calls / 87,545 triangles**, WebKit **55 calls / 87,697 triangles**, including rendering passes; both retain the exact 1,755,000 replay result and no page/shader errors. This is +6,328 triangles against the art-33 observed maximum, within the 70 / 90,000 budget.

Publication confirmed: `items-34`, saved version 35, commit `43e6f7016d705b149ca4b0a574909af6c9a6e185`, deployment `appgdep_6ad7fd46d7808191b17640c4a707d381` succeeded. URL: https://runway-islanddao.agenciahumanfriendly.chatgpt.site/?v=items-34 . No API or audience change.
