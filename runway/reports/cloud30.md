# cloud-30 — Original artwork and cloud transitions

Implemented: removed the duplicate home pilot/PERKS link; replaced visible BACK TO AIRPORT with BACK TO PLANE (results, pause and tutorial); removed local-flight submission copy. Original supplied PNGs copied unchanged for LANDED, favicon and both cloud panels.

One shared cloud animation serves the HTML boot and runtime transitions. Boot waits for the first scene frame and essential image decoding. Replay covers the scene before replacement and keeps simulation paused until the curtain opens. Return to plane and graphics recovery use the same curtain; recovery waits for scene readiness. Reduced motion disables logo bobbing and makes panel movement immediate. Closed backdrop protects against the PNGs’ residual translucency.

Verified:
- WebKit iPhone 13 emulation: complete seed-17 flight, successful landing PNG, replay, pause and return to plane; no page errors.
- Chromium Pixel 7 emulation: same complete flow; no page errors.
- Both engines: cold loading with GLB responses held, horizontal viewport and reduced motion. Curtain remained until models were released.
- Pixel composition at 390×844: no cloud coverage holes (minimum combined alpha 250/255, with opaque backing while closed).
- TypeScript and production build passed.
- Existing browser expectations updated for intentional text/artwork changes; those older suites were not rerun in full.

Evidence: reports/evidence/cloud30 (menu, landed, retry curtain and full Chromium video; cold-loading screenshots/videos for both engines). Earlier WebKit full-flight screenshots were inspected, but superseded by the subsequent Playwright output directory; Chromium evidence retained.

Physical iPhone/Android testing not performed. Rules, API, routes and economic values unchanged. Rollback: island-29 / saved version 30.

Published successfully: saved version 31, SHA e9ec8ed5b75bb6c95f998c1d34cada177e2468e0, deployment appgdep_6ad7b6e9e39c819188839d1e3dc55198 (2026-10-20T18:46:23Z). URL: https://runway-islanddao.agenciahumanfriendly.chatgpt.site/?v=cloud-30
