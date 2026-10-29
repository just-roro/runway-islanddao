# Batch 4/5 — HUD, results and branding (`hud-27`)

Date: 2026-10-20. Published baseline: `npc-26`, commit `783ec13ba085e3e4b2552cb6b6c6ed252ccf90dd`. Exclusive scope of batch 4.

## Implemented and checked

- **Menu:** official RUNWAY PNG, real SHOP balance, identity with PERKS portrait/name/startup at the top left, yellow PLAY and navigation with faceted cyan surfaces. Entry animation for brand, identity and actions; immediate press response. The existing 3D scene is kept.
- **HUD:** ten-second chart across the full safe width, 120–140 px tall, behind the amount; green/red segments for each real change, including same-tick changes. Smoothed domain, stable line if there are no events. No invented fluctuation.
- **Counter:** continuous spring, intensity accumulated by amount and up to five consecutive pickups; gradual recovery. Scale bounded to 0.94–1.15 and space reserved when sizing the font. Red losses take priority and reset positive intensity. Pause freezes the presentation.
- **Victory:** YOU LANDED in a neon LED header, entry with overshoot and a financial panel directly inspired by the reference. Two-second replay after the entry; final money, wide chart, INITIAL/GAINS/LOSSES/BONUS, BACK TO AIRPORT, ONE MORE RUN and a real SHOP receipt. The verification state keeps the distinction between a local flight and a confirmed ranking. Defeat uses RUN LOST and a zero balance.
- **Character on the results screen:** the final camera uses the space actually available between the panels, through ResizeObserver and the presentation state. It changes framing/distance only on the results screen. The flight camera, animation and rules stay the same. Full body/helmet checked in all four aspect ratios.
- **MY STARTUP:** the existing endpoints were audited. It shows the sum of the best verified flights of up to three founders, each contribution, free seats, invitation and access to the ranking. It explains that the SHOP balance is independent and when membership is locked. Loading/error/empty states are distinct; changing crew is secondary and hidden when membership is locked. Create/join keep the existing endpoints and rules.
- **Credits:** original Human Friendly PNG; four names preserved. Removed the redundant ISLAND OUTLINE/MAP SOURCE sections. © OpenStreetMap, ODbL and third-party notices remain available under LICENSES & DATA.
- **Accessibility:** reduced motion without bounces, data intact; accessible names, contrast on the navy panel, responsive amounts and safe margins.

The official PNGs were not generated or altered. [SHA-256 hashes identical to the originals](evidence-hud27/original-assets.json). The RUNWAY logo adds 1,025,371 bytes to the package; it is preloaded and decoded at startup. The HF logo loads when the credits are opened.

## Focused validation

- TypeScript and production build passed. The existing Three chunk size warning remains.
- **5 unit tests**: economic replay, same tick, zero, moving window, grouping and direction per segment.
- **8 Chromium/WebKit tests passed, zero flaky**, with screenshots and videos. Formats 390×844, 360×640, 844×390 and 1440×900. Not equivalent to testing physical phones.
- Five consecutive SOL produced approximate scales of **1.040 → 1.058 → 1.072 → 1.085 → 1.099**. Checked the 1.15 maximum, loss priority and freeze on pause.
- Real replay of the existing controller, seed 17 / Jurerê: **5,000 + 1,165,000 − 0 + 585,000 = 1,755,000**. Final amount and SHOP credit match. A motionless flight ends defeated with zero. Retry and return to the menu checked.
- MY STARTUP forms: offline/reconnect, creation, joining and locked membership with a controlled API; test total **750,000 + 500,000 = 1,250,000**. No QA teams or competitive records were created in production.
- Large menu balances (12,345,678) and chart/counter/results within the available width in the checked formats.
- 3D results: samples of **38–40 draw calls / 47,757–48,493 triangles**. The chart uses SVG, with no new WebGL passes. Not a sustained physical performance test.
- The first checks found and fixed the offline message persisting after reconnecting and the character partially hidden by the results. The initial body measurement included the released canopy: it was fixed by using explicit rig/helmet nodes. Reduced motion is validated against the existing global rule that removes animations.

[Verifiable results and measurements](evidence-hud27/verified-tests.json).

## Visual evidence

- Menu: [before](evidence-hud27/before-menu.png) / [after](evidence-hud27/menu-mobile.png).
- Results, same seed/input: [before](evidence-hud27/before-results.png) / [after](evidence-hud27/results-mobile.png).
- [Small mobile](evidence-hud27/results-small.png), [landscape](evidence-hud27/results-landscape.png), [desktop](evidence-hud27/results-desktop.png).
- [HUD with loss](evidence-hud27/hud-loss.png), [defeat](evidence-hud27/defeat.png), [MY STARTUP](evidence-hud27/startup.png), [credits](evidence-hud27/credits.png).
- Videos and screenshots per browser: `reports/evidence-hud27/accepted/`.

## Real pending items and release

- Tests on physical iPhone/Android, physical safe areas and sustained performance: pending. Only browser emulation is vouched for.
- Create/join validation against the real API not run to avoid public test data; contract inspected and flow verified with controlled responses.
- Final artistic assessment by the user; the reference was translated into a real responsive UI, not a static screenshot with painted figures.
- Batch 5 and other earlier requests outside this scope: not started.
- Frontend published as `hud-27`, version 28. API, rules, routes, economy, identities and persistence preserved.
- Rollback `npc-26`, version 27: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_93937fa874a4819189d7bed6400ddc32`.

## Release confirmed

Sites confirmed the deployment on 2026-10-20 at 17:09 UTC. [Version, SHA and rollback record](evidence-hud27/publication.json). [Public smoke test](evidence-hud27/public-smoke.json): build hud-27, mobile menu/credits reviewed, both PNGs loaded and no JavaScript errors. API blocked in this test to avoid generating public QA identities or runs.
