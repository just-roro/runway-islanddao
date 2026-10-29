# Jurerê 10 — jetpack, geographic coast and economic presentation

## Product decisions
- Confirmed destination: Jurerê neighbourhood only. It is not an asserted street address or model of Casa Island Villa. Two additional event locations remain inactive until the user supplies them.
- Start $5,000; no time burn; water clears capital. Money is the only ranking value. Jurerê awards 10% once.
- Jetpack replaces all parachute visuals. Same finite glide and updraft budget; cosmetic slot 1 retains ownership and now selects nebula thrusters.
- Passive monetary pickup attraction 1.15x; temporary magnet 2.5x / 8 seconds. Refresh, not stacking. Seeker 1.6x SOL uses maximum active range. Gates, choices, rare/modifier pickups and hazards are not attracted.
- Rules `runway-2.2.0-jetpack`, content `jurere-coast-2`. Guest identity, team and cosmetics persist; old competitive boards are separate.

## Geography provenance
Coast: OpenStreetMap relation 3360578, downloaded 2026-10-15 from https://api.openstreetmap.org/api/0.6/relation/3360578/full.json.
The import script joins all 308 outer ways into one closed 8,583-node outline and simplifies it to 220 vertices with a 0.7 world-unit tolerance. Uniform geographic scaling uses longitude cosine correction; north is positive world Z. Render and authoritative contact share the same polygon.
The derived dataset is distributed at `/assets/geography/santa-catarina.json` under ODbL 1.0, with attribution and source links: https://opendatacommons.org/licenses/odbl/1-0/ and https://www.openstreetmap.org/copyright . The menu links to this public dataset.
Relief, buildings and vegetation are stylized authored scenery, not surveyed elevations or verified event architecture. No runtime map SDK, external map download, GPS or tile service.

## Presentation
- Authored Blender GLBs: articulated universal pilot, cargo aircraft, independent rear hatch, Jurerê architecture. Source and reproducible exporter included.
- Four cloud cluster families; initial atmospheric concealment, cloud deck at ~61s, progressive coast reveal 62–87s, jetpack transition 92–98s.
- Shared object pose for rendered attraction and collision; instanced SOL loss burst is visual-only.
- Economic feed uses actual clamped cash deltas, three recent lines, four-second lifetime.
- Financial results have one two-second clock. Chart, event log and number follow the same chronological events. Exact personal CEO/startup ranks load after submission verification; no fabricated percentiles.
- BACK TO HANGAR restores the same scene and personalization. Context-loss recovery alone remounts the renderer.

## Evidence classification
Unit tests and local API checks are automated. Chromium/WebKit viewport checks are browser-emulated; the accelerated visual test directly advances the real simulation and does NOT establish real-time mobile performance. No physical iPhone/Android QA has been performed by the agent.
Real-device ten-minute thermal/performance sessions, motion sensor permission, twenty physical retries and participant playtesting remain required before final event signoff.

## Rollback pair
Prior frontend: commit 5cf7aae23de8f6f2741408a458c02b052eece109, saved version appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_5cd84053aee88191948fd9103b4f2c5c.
Prior API: commit 8321571d2e5c4f7762e810236cd4d285c82c2555, Flight 8 rules runway-2.1.0-contact / floripa-city-1.
Restore BOTH matching versions if rollback is necessary; do not migrate/delete players, teams, runs or cosmetics. A client/server version mismatch falls back to local practice rather than submitting incompatible input.

## Executed checks, 2026-10-15
- 29 unit tests, frontend TypeScript/build and backend build passed.
- Accelerated Chromium and WebKit walkthroughs passed; observed maximum 39 draw calls / 64,592 triangles before final decoration exclusion. Captures and video: test-results-jurere/.
- Local D1 integration passed: three-seat concurrency, ticket ownership, invalid/incomplete input, authoritative replay (including a client-supplied bogus score), duplicate submission, team lock, CEO/startup ranks and rate limits. Ticket age was respected; the test waited the full simulated flight duration.
- Six real-time browser-emulated flow tests passed in Chromium/WebKit: complete flight, exact settlement, retry under one second, pause/resume, collection, offline ranking and pointer release. Max observed 38 draw calls / 64,594 triangles. These are not physical-phone measurements.
- Replay optimization skips untouched non-glide objects outside their possible contact interval and computes ground height once per step. Ten full before/after states matched exactly. Local replay: 30–68 ms after optimization (previous 133–227 ms); deployed Worker latency remains unmeasured.
- Production artifact excludes the development-only QA runtime handle and contains no AR/Rapier/ecctrl dependencies. Entire artifact uncompressed ~3.04 MB; transfer timing still requires production-network measurement.
- Public anonymous smoke: current build and all four GLBs HTTP 200, tickets with matching rules/content, no JavaScript errors. A complete public automated flight reached water settlement but degraded to local practice; production competitive submission remains unverified.
- Final presentation correction: water defeat now splashes and stays afloat instead of sinking the pilot out of view. The defeat camera exposes the LED sphere above the settlement. Chromium/WebKit accelerated water-result checks and screenshot inspection passed. This changes presentation only.
