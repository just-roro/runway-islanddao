# light-32 — Lighting, reflections and materials

## Implemented scope

Only phase 2. No simulation, collision, economy, route, camera or audio changes.

The cabin/sky environment assignment previously switched at route time 4 seconds. The new rig prefilters two 256×128 environments once at scene mount, then blends their radiance with a continuous quintic curve from route time 2.2 to 4.8. Both maps share orientation. Helmet, suit and aircraft consume this blend; exterior props retain the sky environment. Stable shader hooks preserve LED emission and personalization. No live cube capture, additional shadow pass or dependency.

Cabin ambient/fill illumination is lower. Existing warm/cool fixtures remain localized; the existing shadow-casting key transitions from the cabin fixture toward the exterior sun with the same blend. Its 1024 shadow map covers a tighter area with lower bias, and the existing contact shadow is stronger. Customization remains readable.

Cloth, rubber, satin hardware, painted alloy and LED glass now have distinct roughness/metalness/environment responses. Helmet highlights are controlled; bloom threshold rises and intensity falls to preserve LED and metallic detail. Existing tone mapping/exposure is retained.

## Evidence and reproduction

- `scripts/qa-light32.mjs before webkit` captured the baseline before edits. Final runs: `release webkit` and `release chromium` against localhost:5183.
- Baseline: [menu](evidence/light32/before-webkit/menu.png), [exit](evidence/light32/before-webkit/exit.png), [fall](evidence/light32/before-webkit/fall.png).
- Final: [menu](evidence/light32/release-webkit/menu.png), [shop](evidence/light32/release-webkit/shop.png), [exit](evidence/light32/release-webkit/exit.png), [former switch point](evidence/light32/release-webkit/threshold.png), [fall](evidence/light32/release-webkit/fall.png).
- Videos and raw metrics accompany each capture directory. Same seed 17 and phase/camera samples; menu idle timing may differ. Baseline shop capture is the greeting, final shop is the carousel, so those are not identical compositions.
- Visually reviewed darker cabin, visible pilot, localized warm/cool helmet highlights, gradual loss of cabin reflections and coherent exterior sky highlights. No shader errors or observed reflection artifacts in either browser.
- Transition retained one environment UUID throughout. Blend was 0 in menu, 0.05694 at exit, 0.85984 near 4.05 seconds and 1 in freefall. Largest adjacent sampled change: 0.02384 WebKit / 0.01202 Chromium, rather than a map switch.

## Validation

Production build passed. `tests/lighting32.test.ts` passed endpoint, monotonicity and former-switch continuity assertions. Existing full-flight `tests/browser/island29.spec.ts` passed in WebKit: seed 17, Jurerê landed, 1,755,000 capital, tick 3270. Maximum observed 54 draw calls / 80,759 triangles including render passes. Full flight video/capture is in `evidence/light32/full-flight-final/`.

WebKit iPhone 13 emulation: 150 requestAnimationFrame samples per pose on host Apple GPU:

| Pose | Baseline median / P95 | Final median / P95 | Calls / triangles (unchanged) |
|---|---|---|---|
| Menu | 17 / 19 ms | 17 / 20 ms | 27 / 24,706 |
| Exit | 17 / 20 ms | 17 / 19 ms | 35 / 37,720 |
| 4.05 s | 17 / 20 ms | 17 / 20 ms | 31 / 45,900 |
| Freefall | 17 / 19 ms | 17 / 20 ms | 26 / 43,974 |

Chromium Pixel 7 emulation / ANGLE Metal: median 8.3 ms; P95 9.2–9.5 ms across final poses. No Chromium baseline collected. Full-flight final WebKit windows were approximately 57–60 FPS.

These are VSync-bound presentation intervals, not isolated GPU execution times or measurements on an iPhone/Android. They show no observed frame-interval regression in this host comparison; physical ten-minute mobile testing remains pending. Existing low-poly geometry is unchanged. No subsequent phase started.

## Publication

Frontend build light-32; API unchanged. Rollback cloud-31: commit `67a3bd2f30358cb1de86f510e73cbeff3407fa61`, saved version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_29169f68be20819196f8b36e0ee59438`. Deployment confirmation is recorded after publication.

Published successfully 2026-10-20: commit `64a78f3ddd081d8ec08a54c9a7ec5ef2fa33e2a6`, saved version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_a5d085abbecc8191a70e7350f94c7b94` (33), deployment `appgdep_6ad7c2b5f5c48191985552188039d42a`. URL: https://runway-islanddao.agenciahumanfriendly.chatgpt.site/?v=light-32
