# RUNWAY — FUND. BUILD. LAND.

New application, independent of the preserved AR spike. Node 24.

```sh
npm ci
npm run dev
npm test
npm run build
```

Local UI: http://127.0.0.1:5180. `/api` proxies to the D1 preview at port 8787.
Without the API the game explicitly runs in practice. It never fabricates rankings.

Canonical rules: `src/core/simulation.ts`. `../services/runway-api/scripts/sync-core.mjs` copies this file byte-for-byte into the API before a local build. Do not edit the API copy.

Official portrait provenance: `src/assets/perks.json`. There is no AR runtime, physics engine or wallet in this build.

The existing Sites deployment is public. A working local build is not real-device QA.

## Arcade 20 — 19 October 2026

- Camera follows one continuous exit transition, with a 66° fall angle and approximately 30.7% projected pilot height across portrait, landscape and desktop. Physical cabin constraints replace the old timer-based clamp.
- Freefall/storm speed is exactly 0.92 times rush-19; canopy descent remains 10.4 units/s. Rules `runway-2.7.0-arcade`, content `jurere-course-7`. API core remains byte-for-byte identical.
- Aircraft frame and hatch overlap correctly; two local cabin lights supply warm key/cool fill. Model source/export retained.
- First visit: identity → six-step NPC tutorial → menu → PLAY. Returning players see the new briefing once. NPC, expressions and gameplay props share tutorial state and are hidden otherwise.
- Twelve manifest accents drive suit and LED. Pilot name appears for one second; canvas and loaded GLBs survive twenty hangar navigations. Existing cosmetic ownership is preserved.
- Shared angular UI components cover menu, hangar, briefing, pause, rankings and settlement. Money remains the only score, with SOL icon and real event-driven feedback. OSM attribution is accessible through CREDITS.
- Result framing keeps the pilot visible; canopy collapse uses presentation time so it finishes after simulation stops.

Current browser suite: `node node_modules/@playwright/test/cli.js test tests/browser/arcade.spec.ts --workers=1`. Older named suites record earlier release interfaces. Chromium QA uses ANGLE/Metal on this macOS host; WebKit uses the iPhone 13 emulation profile.

Verified locally: 44 rule/physics tests (including 30/60 Hz replay and idle-input difficulty), production typecheck/build, five viewport sizes in both browser engines, full physical Jurerê flights, real settlement, pause, tutorial, pilot switching and failed-GLB recovery. Recorded runs around 54–55 simulation seconds; sampled content remained below 70 calls / 90,000 triangles. Evidence is in ignored `test-results-arcade-*` folders (screenshots, video and traces).

Physical iPhone/Android permissions, phone audio listening, ten-minute thermal performance and twenty complete phone retries remain unverified. Emulation is not hardware evidence.

Rollback must restore both saved versions together, without deleting data:
- Frontend rush-19: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_b5cede32f0308191bd7f48bf96409070`.
- API 15: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_b6d2bc3d64fc819199111732be65b07c`.

