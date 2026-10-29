# RUNWAY — Batch 1/5 · flight-25

2026-10-20. Baseline: `shop-24`, commit `f2c0283089c467cf4b0fee2956a840e8e6b18b03`.
Scope limited to this batch's gameplay, animation and cinematic continuity. Batch 2 was not started.

## Diagnosis of the baseline

- Defeat froze the competitive simulation and reused the landing pose: the pilot stood still in mid-air.
- The restart interpolated from the final position back to the cabin. The camera physically travelled through the plane.
- The opening had canopy inflation but no coordinated body reaction. At the end, the canopy was still a child of the pilot and hid after 1.5 s.
- The joystick depended on the HUD's React refresh at 20 Hz; the input already arrived immediately.
- The magnet was in fact generated and had a deterministic effect. The system was kept, its reach/expiry verified and its positive visual reading fixed.

## Requirements and closure

| # | Requirement | Implementation and status |
|---|---|---|
| 1 | Interior camera / lighting | IMPLEMENTED; three-quarter framing from behind, higher focus and the two existing lights repositioned with a warm/cool split. Screenshot reviewed. |
| 2 | Anchored traffic light | IMPLEMENTED; mounts on the side walls, independent of the hatch. Position and hierarchy checked with the hatch fully open. |
| 3 | Jump with push-off | IMPLEMENTED; leg charge, extension, separation arc when reaching the end of the ramp and gradual pose opening. The camera uses the same presentation position. |
| 4 | Restart without crossing the plane | IMPLEMENTED; 160/240 ms fade, camera/FOV cut under cover, no upward interpolation. Retry and return to the menu checked. |
| 5–6 | Air defeat / ragdoll | IMPLEMENTED as a ballistic presentation fall and a procedural articulated reaction on the 15 existing bones. It continues under gravity after the result closes. It is not a per-bone rigid body solver. |
| 7 | Reaction against buildings | IMPLEMENTED; flail and recovery after real non-fatal contact; a fatal hit goes into a fall and releases the canopy. |
| 8 | Compatible states | IMPLEMENTED in the tested scenarios; landing, terminal fall and restart are distinct. Pause freezes the body clock and canopy. |
| 9 | Joystick | IMPLEMENTED; thumb updated every paint, input without added filtering and independent visual return. Pointer drag verified on a mobile viewport; physical touch feel pending. |
| 10 | Magnet | IMPLEMENTED / VERIFIED; real generated pickup, eight seconds, extended reach, renewal without stacking strength and existing attraction. Cyan/green model to identify it as positive. |
| 11 | Star dive | IMPLEMENTED; root tilt, arms tucked and legs extended during the real boost; recovery when it ends. |
| 12 | Opening | IMPLEMENTED; tension, body jerk, inflation, damped bounce and stabilization with the shared clock. The lines follow the hand anchors. |
| 13 | Release | IMPLEMENTED; independent world transform, lateral drift, gravity, folding and fade; persists for 3.2 s. It no longer travels stuck to the torso or disappears on contact. |

The exit arc and the post-defeat fall are local presentation. They do not modify colliders, economy, inputs, route, durations or the server replay. The API and the competitive version were not changed.

## Focused verification

- TypeScript with no errors.
- 15 unit tests of choreography, presentation clock, canopy and runtime passed.
- Two existing magnetism tests passed: attraction/expiry and renewal without stacking.
- Six browser cases passed: three in Chromium and three in WebKit, with no JavaScript errors.
- First menu → PLAY → exit sequence run at real speed. Camera/pilot distance between **4.38 and 5.02 units**; 577 Chromium samples and 319 WebKit.
- Retry: opaque cover before changing the camera; no visible travel back to the cabin.
- Air defeat: descent of **23.23 / 23.37 units** during the 600 ms wait in both browsers, capital closed at zero.
- Building impact: contact from the shared simulation triggers the reaction; the fatal case keeps the canopy separated and visible.
- Opening: pause/resume keeps exactly the captured visual state. Both hand anchors active before the release and freed afterwards.
- Joystick: a 28/−14 px displacement produces input 0.5/0.25 and thumb 22/−11 px on the next refresh; on release it hides again.
- Magnet and star triggered through real contacts. The star returns to zero visual strength after finishing.

The collision/pickup tests use position/state fixtures and then the real core contacts. They do not represent complete human flights or sustained performance measurements. The exit case does not use a time jump.

## Evidence

- [Full results and samples](evidence-flight25/verified-tests.json).
- [Cabin](evidence-flight25/cabin.png), [push-off on the ramp](evidence-flight25/launch-2.45.png), [separation](evidence-flight25/launch-2.95.png), [entering the fall](evidence-flight25/launch-3.6.png).
- [Air defeat](evidence-flight25/air-defeat.png), [building impact](evidence-flight25/building-impact.png), [building defeat](evidence-flight25/building-defeat.png).
- [Magnet](evidence-flight25/magnet-active.png), [dive](evidence-flight25/boost-dive.png), [open canopy](evidence-flight25/deployed.png), [lateral release](evidence-flight25/landing-release.png).
- Real-speed recordings: [exit](evidence-flight25/launch.webm), [defeats and restart](evidence-flight25/defeat.webm), [opening, pause and release](evidence-flight25/canopy-pickups.webm).

Screenshots reviewed visually. This batch also fixed the canopy covering the face during the release; it now folds toward the side opposite the orbit.

## Real pending items and limits

- Physical iPhone/Android: perceived touch latency, ten sustained minutes and assessment of the animations. Emulation does not vouch for these tests.
- The ragdoll reaction is procedural; it does not include individual collision for each limb or cloth simulation for the canopy.
- Overall artistic quality, bridge, typography and other requests outside this batch are not declared closed and were not worked on here.
- No sounds or new rules were added.

## Release / rollback

Frontend identified as `flight-25`; public audience kept, API unchanged.
Rollback: `shop-24`, saved version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_07a664b751788191a90095fd5623672d`.
The deployment confirmation corresponds to the Sites result in this delivery.
