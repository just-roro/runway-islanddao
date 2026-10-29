# RUNWAY — Batch 1/6: stars and REPLAY

Date: 2026-10-22. Local implementation and verification; no release and no ZIP regeneration. Batch 2 was not started.

## IMPLEMENTED

### Stars

Cause: `Items` used the same pickup branch for coins and stars: interpolation toward the pilot, shrinking scale and removal at 220 ms. The simulation already excluded stars from magnetic attraction; the visible fault was in the renderer.

Fix: an independent reaction with the position captured at contact, constant original scale, per-instance yellow emission and three turns in 1.2 seconds. The spin curve has zero velocity and acceleration at the start and end. Afterwards it stays in place, switched off, until it leaves the visible volume. Reduced motion keeps the flash without the fast spin. Pause keeps the exact moment.

Collisions: the continuous plane crossing in relative coordinates is kept. For rings/stars, the height rejection computed only on the final end of the movement is removed; a start exactly on the plane is accepted; the axes of vertical stars are fixed. The five-point opening now takes the pilot's physical radius into account, instead of requiring only its center point to be inside. It is not replaced by an oversized circle.

The boost and the 15,000 SOL still come from the same simulation event. `collected` remains the only per-object grant protection; the visual effect never grants money or re-triggers the boost. No new meshes or passes: one emission attribute on the existing instancing.

### REPLAY

Causes: `createRuntime` left the presentation at the world origin until the first step. Since the new attempt was paused under the curtain, that step never happened. In addition, the pause guards prevented restoring the rig, body rotation, canopy and inherited particles. Compiling shaders did not restore those states.

Fix:

- Initialize the presentation from the real state before mounting the attempt, without advancing the clock.
- Freeze the previous attempt from the REPLAY click.
- Explicitly restore pose, camera, FOV, framing, fog, canopy and trail when switching attempts, even with `dt=0`.
- Tie the scene-ready confirmation to the requested runtime, so that a late confirmation from the previous attempt cannot open the curtain.
- Keep the new attempt paused during the whole preparation and curtain opening. Resume once it is fully uncovered.
- Keep the normal continuity of PLAY from the menu and the LED portrait phase. The canvas is not remounted.

## TESTS RUN

- Production TypeScript + Vite: OK. Existing chunk size warning; no build error.
- 24 automated tests in six files: all OK. They include 90 combinations of timing, lateral offset and normal/boost speed; edge contact, real miss, start on the plane and overshooting the plane. Single reward and boost.
- Targeted regression: 100 runs per seed with exact ledger and replay; render scheduling check at 30/60 FPS; rings, parachutes, cues and pickups.
- Chromium/emulated Pixel 7 and WebKit/emulated iPhone 13: 6 cases, 6 OK, 0 skipped and 0 flaky. API intercepted with a 503 response; no QA runs sent to production.
- Star: 127 frames observed in Chromium and 45 in WebKit; contact position and 1.65 scale invariant, visible spin, one reward and one activation. Peak emission 0.996/1.000; max 40 draw calls observed in that scenario.
- Real victory through an input controller, REPLAY, air defeat through a controlled gas collision and a second REPLAY. `compileAsync` was deliberately held to check opaque coverage during preparation.
- 267/253 paused victory/defeat frames in Chromium and 69/69 in WebKit: tick 0, position `[0,1122.2,355]`, constant camera, `prepare` pose, hidden canopy and zero trail particles. Returning to the menu with held compilation also passes.
- Screenshots reviewed visually: star before and after contact, an auxiliary shot to see the whole silhouette during the flash, and the plane when the restart finishes. Continuous videos in `final/`. The first attempts revealed a QA sampler problem: it observed the runtime before the React commit and stopped recording; it was fixed to distinguish the opaque interval from the state already incorporated into the scene.
- Client/API core byte-for-byte identical. Local content: `island-stars-12`; economic rules and object generation unchanged. The next release must ship a compatible frontend and API.
- Production ZIP intact: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Evidence

- [Browser summary](browser-summary.json)
- [Logic tests](unit-tests.log) · [Build](build.log)
- [Yellow star](star-yellow-peak.png)
- [REPLAY from victory](victory-replay-ready.png) · [REPLAY from defeat](defeat-replay-ready.png)
- Full telemetry per browser: `*-star-frames.json`, `*-victory-reset-frames.json`, `*-defeat-reset-frames.json`.
- Original screenshots and videos: `final/`, kept locally outside the release package.

## PARTIAL / PENDING

No features remain pending within this batch. Checking on physical iPhone and Android remains pending; the tests above use emulation on desktop and are not equivalent to measurements on mobile hardware. The public version remains unchanged; publishing is not part of this intervention.
