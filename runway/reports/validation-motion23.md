# RUNWAY · motion-23

## Implemented

**Cinematography.** The 15-bone rig now has articulated poses and pelvis translation: six-second idle, preparation, run-up with a 2.7-unit stride, exit, fall, opening, contact absorption and a one-time celebration. Head and lines follow the torso/hand anchors. The helmet uses a transform from the chest socket inside the actor tree: this fixed a disappearance detected when pausing with the portal-based mounting.

Body, camera, canopy, LED, impacts and settlement use the same presentation clock; pause and background stop it. The ending continues when the simulation finishes. The 66° tilt during the fall and 38° while gliding are kept. The camera looks for an arrival arc free of buildings, with shorter alternatives; reduced motion removes the orbit and shakes.

**Feedback.** Each event has a run/index identity, balance, effective amount and contact source. The counter responds with a spring limited to 0.94–1.15×, magnitude and streak; an impact keeps priority. The chart shows ten seconds of real balances, including simultaneous events and zero. Two-line feed, exclusive grouping of consecutive SOL up to 100 ms. Repeated reminders disappear; sequences are shown only while in progress. Panel entries/exits and button responses are added, with a reduced-motion alternative. Visible texts: AIRPORT / BACK TO AIRPORT.

**Island.** Ground material with variation by coast and slope, fine normals without displacing the surfaces. 96 trees in three variants, near/far LOD, up to 256 nearby grass tufts and 64 residents walking, talking or resting; limbs animated in a shader. Deterministic distribution with clear zones around routes and landings. Jurerê has a replaceable provisional visual group, in meters, Y up and +Z toward the approach, separate from its physical platform. No supposedly real house was created.

The existing music and effects are kept. There are no new libraries, audio, endpoints, tables, economic rules or controls.

## Tests and evidence

- **51 unit tests**, 12 files: replay, economy, routes and presentation. New cases for empty financial windows, same-tick events, reaching zero, feed grouping, impact source and environment distribution.
- **18 browser scenarios** passed across Chromium and WebKit, run in blocks and repeated after the fixes: start, tutorial, twenty pilot switches, twelve NFT accents, music/interruption/background, failed GLB, graphics recovery, twenty retries, camera, four outcomes, shared clock, feedback and reduced motion.
- Five camera formats: 390×664, 393×852, 360×740, 844×390 and 1440×900. Pilot size during the fall: approximately **31.3%** of the height, measured variation under 0.01 percentage points across formats for the same pose. Exit: approximate distance **3.91–5.02 units**, without the old 20-unit pull-back.
- Pause checked during preparation, run-up, jump, fall, canopy inflation, gliding and contact: clock, bones, camera, lines and HUD identical before/after waiting while paused. Additional check that the helmet is still drawn by the renderer.
- Twenty retries per browser: maximums of **365 ms in Chromium / 473 ms in WebKit**, with no canvas rebuild. These are lifecycle tests with an accelerated replay; full runs are recorded separately.
- A loss followed by a pickup on the same tick keeps the red/LOST reaction; scale within limits. Reduced motion keeps scale 1 and orbit 0. Graphics recovery returns to AIRPORT and starts with empty cues.

### Controlled comparison

[Before/after video](evidence-motion23/comparison.mp4): left `finish-22`, right this iteration. Seed **17**, **1,635 input samples at 30 Hz**. Inputs, events and result are identical: **1,755,000**, landing at Jurerê. [Reproducible summary and hash](evidence-motion23/comparison.json), full telemetry [before](evidence-motion23/before-measurements.json.gz) / [after](evidence-motion23/after-measurements.json.gz). The video only predates the later optimization of off-camera clouds and the final filtering of inactive HUD sequences.

Screenshots: [previous menu](evidence-motion23/before-airport.png) / [current](evidence-motion23/after-airport.png), [exit](evidence-motion23/after-exit.png), [fall](evidence-motion23/after-freefall.png), [paused inflation in WebKit](evidence-motion23/opening-webkit.png), [contact](evidence-motion23/contact-webkit.png), [final glide](evidence-motion23/final-canopy-webkit.png), [final result](evidence-motion23/final-results-webkit.png).

[Chromium pause measurements](evidence-motion23/motion-measurements-chromium-mobile.json), [WebKit](evidence-motion23/motion-measurements-webkit-mobile.json). [Framing of four outcomes in four formats](evidence-motion23/settlement-framing-webkit-mobile.json).

### Performance and regression fixes

The initial comparison with seed 17 went from **48 / 81,351** to **53 / 86,007** (draw calls / triangles, including passes). Another seed revealed a peak of **92,437**, above the limit. Cloud work outside the frustum was removed using their conservative volumes, without simplifying visible clouds or changing gameplay. The problematic seed **1079896713** then finished with **53 / 84,499** in both browsers, duration **54.77 s** and capital **1,717,500**. The decorative water mesh was also simplified and grass beyond its visible distance was excluded.

`src/core/simulation.ts` is identical to `finish-22` and to the server. SHA-256: `a28aaa1519a4fd66028835fb8937b4c0f76ded2ca80db9373396bb72d08798b1`. Rules `runway-3.0.0-routes`, content `island-routes-8`; the competitive version does not change.

## Real limits

No physical iPhone/Android is available: ten sustained minutes, median ≥30 FPS and P95 ≤40 ms on real devices remain pending. WebKit with an iPhone viewport is not equivalent to Safari on a phone. This pass is not presented as a human test or as artistic equivalence with the reference images. Screenshots and video of the main milestones were reviewed; not every seed and possible camera arc is certified.

The new sounds and the mix review are deliberately pending, as the plan states. The real event area depends on future photos.

## Release and rollback

Publish only the `motion-23` frontend, with the existing public audience. API, identities and history remain unchanged.

Rollback `finish-22`: version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_2b4d211d024c819184b87f874c1791fe`, commit `651421e5f09297a10cd3aa550e3a3334024efab7`, deployment `appgdep_6ad6baf80a4081918ff8179dacf53d5d`.

Compatible API: version `appgprj_6acfed30efd88191aef688e5a181c299~appgver_84e8102324608191bf05d6846a9832fc`, commit `77632ca0b4bab0c1128025e66fdbb13b04bab94e`.
