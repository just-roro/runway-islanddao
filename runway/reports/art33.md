# art-33 — Seven graphics fixes

## Causes and execution

| Request | Observed cause | Change |
|---|---|---|
| Joined shoulders | The sleeve and torso ended before the humerus pivot, with no fabric covering the joint. | Blender source and GLB: continuous bellows with chest/arm weights and a sleeve cap around the existing pivot. Keeps 15 bones, nine clips, three materials and customization. +384 body triangles; 5,728 in total without the helmet. |
| Square glints on the helmet | Radiance map with binary rectangles and nearest filtering; in addition, the blur sampled the full source with the spacing of a reduced texture, replicating the bright spots. | Soft angular sources, filterable 512×256 half-float HDR; separate prefiltering before Gaussian X/Y. The halos no longer form a grid. |
| Matte body | Effective material/program inspection confirmed IBL active, with no maps cancelling it. The rough fabric layer scattered the shine and there was no coating lobe over the panels. | MeshPhysical only for the coated surface; keeps the textile base, colors and roughness. Clearcoat 0.48 / roughness 0.22. Rubber and hardware keep their materials. Separate A/B for IBL and for clearcoat. |
| Door opens with no light coming in | The hatch opened between 0.1–1.15 s, but the interior/exterior lighting started blending at 2.2 s. | Same opening function for geometry and incoming light: localized exterior spotlight, glare centered on the opening and exposure recovery before 3.2 s. No shadow map is added. |
| Dull exterior / weak items | Fog desaturated too early, the lower sky hemisphere was a uniform cyan, bloom was barely present and the static glint was low-intensity. | Livelier blue, stronger exterior key, less washed-out cloud detail, continuous radiometric blend, +6% saturation on the exterior only. Bloom graded by phase. Analytic four-point optical stars plus secondary points, continuous rotation and radial support that removes sprite edges. |
| Menu camera | Previous offset higher and closer. | Camera 0.35 units further back and 0.19 lower; menu tilt 10.2° → 7.66°. Same composition, FOV and exit trajectory. |
| Helmet resets on PLAY | Persistent instance, but the shader switched from the airport clock to the run clock, which starts at zero. | LED phase accumulated on the persistent actor, advancing with the presentation dt. Pause keeps the phase; the result screen keeps the intended stop. No delays. |

## Real verification

- Production build and TypeScript passed. Three unit tests verify the transition, opening/recovery and the GLB contract with combined shoulder weights.
- `scripts/qa-art33.mjs`: emulated WebKit iPhone 13 and Chromium Pixel 7. Screenshots/video of menu, shop, opening, exit and fall; LED phase/UUID sampling and no shader errors. Monotonic phase from before PLAY; same instance throughout the sequence.
- `tests/browser/art33.spec.ts`: seed 17 flight, QA controller input, opening, gliding and landing in Jurerê. Result 1,755,000 / tick 3270 in both browsers; rules, collisions and speeds are not modified. LED pause test and check of the effective IBL/coating uniforms.
- The WebKit full flight corresponds to the code right before converting the textures to half-float and making PHYSICAL explicit; the final WebKit screenshots and the Chromium flight correspond to the final code.
- IBL A/B at the same tick/camera: only the body's envMapIntensity is disabled. It changes diffuse and specular ambient lighting; on its own it does not prove specular reflection. The additional probe `scripts/qa-coating33.mjs` removes only the clearcoat, keeping light, environment, color and diffuse base.
- Visual inspection of menu, opening, exit, fall, deployment and gliding: visible shoulder joint; reflections on sleeves and edges; continuous halos; well-defined item glints; contrast recovery when leaving the plane. Videos kept to review motion.

## Evidence

- [Before: fall](evidence/art33/before-webkit/fall.png) / [after: fall](evidence/art33/final-webkit/fall.png).
- [Before: menu](evidence/art33/before-webkit/menu.png) / [after: menu](evidence/art33/final-webkit/menu.png).
- [Lit opening](evidence/art33/final-webkit/door.png), [exit](evidence/art33/final-webkit/exit.png), [shop](evidence/art33/final-webkit/shop.png).
- `evidence/art33/final-flight/`: Chromium video, IBL A/B, deployment, gliding and arrival. `full-flight/`: WebKit equivalents.
- `evidence/art33/coating/`: isolated test of the specular lobe. `metrics.json` in each browser directory contains the transition series and full measurements.

## Performance and limits

One shadow map is kept and there is no per-frame cubemap capture. A prefilter pass at 1/4 resolution is added to fix the bloom kernel, plus a spotlight without shadows and 384 body triangles. Flight maximum: 55 draw calls / 81,369 triangles (including passes).

150 requestAnimationFrame intervals per pose, Apple GPU host VSync:

| WebKit | Baseline median/P95 | Final median/P95 |
|---|---|---|
| Menu | 33/48 ms | 33/37 ms |
| Opening | 33/43 ms | 33/37 ms |
| Exit | 33/42 ms | 33/36 ms |
| Fall | 33/44 ms | 33/37 ms |

Final Chromium: median 8.3–8.4 ms; P95 10.4–11.7 ms. These figures are presentation intervals under emulation, not isolated GPU time or phone performance. The WebKit host in this session also ran at ~30 Hz before the change; it is not compared with the 17 ms of another light-32 session. FPS windows of the flight test that include pause/capture are excluded as a performance measure.

Pending: sustained test on physical iPhone/Android. The existing low-poly environment geometry limits the similarity to the reference illustration; this delivery improves the requested pipeline and does not replace the world with that illustration. No new mechanics or UI redesigns.

## Release

Frontend art-33; API and history untouched. Rollback to light-32: commit `64a78f3ddd081d8ec08a54c9a7ec5ef2fa33e2a6`, version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_a5d085abbecc8191a70e7350f94c7b94`. Deployment confirmation at the end of the log.

Isolated specular test: 5566 pixels of the body crop changed by more than 3 RGB levels when only the clearcoat was removed (same tick/camera, base and lighting). Mean RGB difference [0.33, 0.25, 0.24].

Published successfully on 2026-10-20: commit `3b0316f901543fc2f22f6aa01ef53dda899161a1`; version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_47f6560812b881919dd54d8a7885ece9` (34); deployment `appgdep_6ad7eeb626ac819180cd89cf540c0e94`. https://runway-islanddao.agenciahumanfriendly.chatgpt.site/?v=art-33
