# RUNWAY — scope and continuity log

## Most recent update — Batch 5/5, island-29

See [changes, screenshots and metrics](tanda-5-island29.md). Bridge joined to the coast and extended into the fog, terrain with continuous normals and procedural blending, grass distributed with a limit of 256 visible tufts, improved distant tree canopies and decoration resting on the real mesh. Rules, routes, API and physical zones unchanged. Four focused tests passed and a full WebKit flight to Jurerê. Pending: performance on physical phones and real photos/architecture. The emulated FPS figure does not vouch for a real mobile device. Do not start another batch automatically.

## Previous log — Batch 4/5, hud-27

See [implementation, evidence and pending items](tanda-4-hud27.md). Wide financial HUD, progressive streaks, YOU LANDED and neon results with real data, adaptive final framing, menu with identity and official PNG, clarified MY STARTUP and credits with the original logo. 5 unit + 8 Chromium/WebKit tests passed. Physical tests and startup actions against the real API remain pending. Published hud-27 (version 28), menu/credits checked on the public URL; keep npc-26 as rollback. Stop here: do not start batch 5.

## Previous log — Batch 3/5, npc-26

See [NPC/tutorial implementation, tests and pending items](tanda-3-npc26.md). Closed in the tested browsers: cinematic entry and return, LED close-up, coordinated tutorial and SHOP, contextual expressions, temporary original digital voice and holograms of the real models. Music, shop and gameplay are preserved. Pending: final sounds and audiovisual validation on physical phones. Published `npc-26` on 2026-10-20 with explicit authorization; tutorial and SHOP checked on the public URL. See the deployment log. Do not start the next batch automatically.

## Previous log — Batch 1/5, flight-25

See [log and evidence for this batch](tanda-1-flight25.md). Implemented and checked in Chromium/WebKit: cabin framing/light, traffic light on a fixed structure, jump with charge and push-off, restart with fade, terminal fall with procedural ragdoll, reaction against buildings, joystick independent of HUD refresh, star dive, canopy opening and persistent release. The existing magnet was checked and its visual readability was improved.

The PENDING/PARTIAL states of those items in the historical audit below describe the previous baseline; they are superseded by the flight-25 log. Shop, economy, routes, API and customization are preserved.

Pending: touch/physical test on iPhone and Android, human artistic review and requirements of other batches (including bridge and typography). Do not start batch 2 automatically: the user asked to stop after finishing this batch.

Updated: 2026-10-20. Audited baseline: `motion-23`, commit `3afa682c5c705cac31fb4aaea077a8e85ef658e6`. Code inspection is not visual validation. This log replaces any inference that the list after motion-23 was already finished.

## Original list of the iteration requested after motion-23

| Requirement | State before this pass | Evidence / closure required |
|---|---|---|
| Interior camera and lighting | PARTIAL | Existing camera and two point lights. The new framing direction and the requested visual inspection are missing. |
| Floating traffic light when the hatch opens | PENDING | `Aircraft`: independent signals at ±2.4 / 3.4 / 0.5; their wall mounting was not fixed. |
| Improve the jump | PARTIAL | Exit rig/clip and shared clock exist; the user asks for higher quality. Having a clip does not mean it is finished. |
| Ragdoll-style air defeat and building hit | PENDING | `PilotBody` falls back to land/idle on any outcome. Articulated fall, framing and building response are missing. |
| Bridge: placement, length, rotation and fog | PENDING | Old 180-unit geometry at x=-104. No placement adjustment as requested. |
| Parachute opening | PARTIAL | Inflation, springs and anchors exist; the new requested choreography is not closed. |
| Suit reflections | PARTIAL | Three existing materials; fabric with roughness .76. This pass adjusts the environment response; needs visual review. |
| Skins bought from the NPC with accumulated balance | PENDING | There was no bank, transactions or shop. Only community unlocks. |
| Prices and special goals for skins | PENDING | The community threshold did not cover this request. |
| Buy canopy and trail colors | PENDING | Nebula canopy was a rare; there was no catalog, purchases or personal trail. |
| AIRPORT → SHOP in the menu | PENDING | The button still opened the old grid. BACK TO AIRPORT outside the menu is still correct. |
| Dive during star boost | PENDING | Physical boost exists; visual pitch responds to input/accel, not to the boost. |
| 3D skin carousel | PENDING | Card grid; only one pilot shown. |
| Spendable balance in the menu | PENDING | Only capital per run/PB. |
| Change general typography | PENDING | Original Rajdhani and Space. Not changed yet. |

## Previous scope: Motion / cinematography / feedback plan

| System | State and limit |
|---|---|
| Shared clock, pause, event capture | IMPLEMENTED and verified in motion-23: pause tests at seven milestones and same-tick events. |
| Idle, preparation, run-up, exit, fall, opening, landing | PARTIAL in finish: clips and overlays implemented, earlier videos exist; quality and defeat cases remain open per user feedback. |
| 66°/38° camera, framing, arrival orbit | IMPLEMENTED under the conditions tested in motion-23; new interior direction and defeats not resolved. |
| Elastic counter, losses, ejected SOL, 10 s chart, two-line feed | IMPLEMENTED with earlier data and browser tests. No rule changes in this pass. |
| Motion UI, tutorial, HUD simplification, AIRPORT | IMPLEMENTED earlier; SHOP now replaces only the requested entry point. |
| Ground, 96 trees, grass, 64 residents, provisional Jurerê group | IMPLEMENTED earlier with screenshots and checked distribution. Artistic quality not certified as equivalent to the references. |
| Existing music and effects | Preserved. New sounds pending files; the search list is not an integration. |
| Physical QA and five testers | PENDING. Emulation does not replace real iPhone/Android. |

## Order of pending blocks

1. **Functional block of this pass:** local bank → idempotent settlement → catalog/goals → purchases/equipping → NPC/carousel and previews → applied in flight. It is a complete missing feature and does not require redoing physics/backend.
2. **Next priority block:** air defeat/building impact and boost dive; they share pose, transition and camera. Then exit and opening: validate the choreography with video, not only tests.
3. **Plane and world presentation:** camera/light, signal mounting and bridge into the fog. Review against the real geometry.
4. **General typography:** replace fonts with licensed ones and check HUD/menu/results after fixing the shop content.
5. **Future audio materials and physical QA:** require files/devices; do not declare them finished.

## Shop block decisions

- Fictional SOL, local cosmetic balance separate from capital/score/ranking. No wallet or real money.
- The final capital of successful landings is credited from this version on; defeats and abandoned runs are not credited. Each run has a unique receipt.
- A historical total is not rebuilt from the PB: there is no complete reliable history to do so. All previously unlocked pilots/cosmetics are kept.
- New profiles: Dragon as the starter. Other pilots cost between 2M and 10M; three goals: Jurerê, a landing without hits, two sequences in one successful run. Colors: 750k–2.5M. Initial prices, pending human balancing.
- Preview does not equip; buying/equipping does. Credits and purchases use a browser lock and write before confirming.
- Balance/ownership not synced across devices; clearing storage removes them. They are not presented as a backend account.

## Closing of this pass

Frontend version: **shop-24**. Priority block implemented: complete local cosmetic shop. API, competitive rules, routes, collisions, music and history preserved.

| Requirement closed in this pass | Final state and test |
|---|---|
| NPC / skin purchase | IMPLEMENTED and verified. Crew member dialogue, catalog, purchase, equipping, insufficient balance and persistent ownership. |
| Prices / goal-based skins | IMPLEMENTED. 2–10M; Jurerê, no hits and two sequences. Automated rules; human price balancing PENDING. |
| Parachute and trail colors | IMPLEMENTED and verified in preview and full flight. Four variants per category; three purchasable. |
| 3D carousel | IMPLEMENTED: three articulated pilots, swipe, arrows and keyboard; preview neither spends nor equips. Twenty switches keep the canvas and do not re-download GLBs. |
| SHOP and balance in the menu | IMPLEMENTED. Final capital of successful landings credited once, available on return. |
| Suit reflections | PARTIAL: fabric, hardware and rubber respond differently; visual inspection and material checked. The artistic redesign of the character is not declared finished. |

### Focused validation

- **11 unit tests**: per-run settlement, duplicates, defeats, goals, migration, purchases and canopy. TypeScript and diff with no errors.
- **6 browser cases passed**: three cases in Chromium and WebKit; shop flow, full equipped flight and rejection of double spend/failed storage. The drag gesture and keyboard were verified in the last rerun of the shop case.
- Five real replays credited **8,512,500**; purchases of 2M + 750k + 1.5M left **4,262,500**. Repeating each settlement did not duplicate the balance.
- Real-speed flight with seed 17: final **1,755,000**, starting bank 1,250,000 → **3,005,000**, same result in both browsers. Pause/resume kept colors and trail.
- Maximum observed in those flights: **54 draw calls / 78,663 triangles**. This is an emulated render measurement, not a certification of sustained physical performance.
- Screenshots reviewed in portrait, small mobile, landscape and desktop. The clipped canopy and the dialogue overlap were fixed during development.
- [Structured results](evidence-shop24/verified-tests.json), [carousel](evidence-shop24/shop-pilot.png), [parachutes](evidence-shop24/shop-canopy.png), [landscape](evidence-shop24/shop-844.png), [cosmetics in flight](evidence-shop24/equipped-flight.png), [full video](evidence-shop24/equipped-flight.webm).
- QA limited to these changes. The other requests were not revalidated as finished just because this suite passed. Physical iPhone/Android and balancing with people remain PENDING.

### Next iteration, without repeating this audit

Priority: air defeat / building hit + boost pose; then exit and opening choreography. After that, interior camera/light, traffic light and bridge; finally typography. Keep bank/catalog/carousel and only check for possible regressions when another block touches them.

### Release and rollback

Frontend shop-24 prepared for the existing public Site. Rollback: motion-23, commit `3afa682c5c705cac31fb4aaea077a8e85ef658e6`, version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_e7fc10397a448191af049bd421bc1bd5`; API unchanged. The deployment confirmation is in the delivery of this conversation.

## cloud-30
Original cloud curtain, LANDED banner and favicon integrated; duplicate home pilot strip removed; BACK TO PLANE and removal of local-flight copy completed. Full flight/replay/return tested in WebKit and Chromium mobile emulation; cold-loading/reduced-motion landscape passed both. Details and evidence: reports/cloud30.md. Physical mobile validation pending.

## cloud-31
Home PLAY no longer shows clouds. Slower ease-in-out and real scene/UI readiness before opening. Full mobile-emulated flows and deliberately delayed GPU preparation passed Chromium/WebKit. See reports/cloud31.md.

## light-32 — Phase 2 only
Continuous prefiltered cabin/sky reflections; darker localized cabin illumination; stronger existing shadows/contact; distinct cloth, rubber, hardware, alloy and LED materials; restrained bloom. Build, continuity unit test, Chromium/WebKit mobile-emulated visual checks and complete WebKit flight passed. Max 54 calls / 80,759 triangles. Physical mobile sustained testing pending. Evidence and limitations: reports/lighting32.md. No next phase started.

## art-33 — Seven graphics fixes
Deformable shoulders in the Blender/GLB source; reflections and bloom without a grid; suit specular layer validated with ablation; incoming light tied to the hatch; exterior and optical stars; menu camera slightly lower/further; LED phase persists when pressing PLAY. Build, 3 unit tests, Chromium/WebKit and full flights passed. Max 55 calls / 81,369 triangles. Evidence, causes and limits: reports/art33.md. Physical devices pending. Do not start another phase automatically.

## items-34 — Phase 4 only
Eight models remodeled from the references: Gas Fee, Delivery, Water, Magnet, Term Sheet, Hacked, Rug Pull and Community. Per-vertex materials and a shared atlas, same geometries in tutorial/gameplay. Rings with 24 instanced fragments and trails with a 192-particle pool, purchased colors preserved. Four unit tests and six Chromium/WebKit scenarios passed; flights with balance and events identical to the replay. Inventory, evidence, metrics and limits: reports/items34/README.md and inventory.csv. Pending: references for the remaining objects and sustained performance on physical devices. Do not move on to another phase automatically.
