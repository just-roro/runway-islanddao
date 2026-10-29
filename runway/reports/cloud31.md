# cloud-31 — Curtain readiness correction

- Home PLAY starts directly, without cloud entry or exit. Replay and return to plane retain the curtain.
- Cloud entry/exit now take 850 ms with ease-in-out (.42,0,.58,1). Fast boot waits for its entrance to finish before opening. Reduced motion remains immediate.
- Scene readiness now follows committed models, asynchronous shader preparation and rendered frames, on initial mount and runtime replacement. UI readiness also waits for fonts and image decoding. Replay simulation stays paused until opening completes.

Validation: Chromium Pixel 7 and WebKit iPhone 13 emulation passed full seeded flight, PLAY without clouds, landing, replay and return. Both passed held-GLB cold loading in reduced-motion landscape. An additional test held compileAsync during return: curtain remained fully closed until release, then revealed the complete menu. Screenshots/videos in reports/evidence/cloud31, cloud31-webkit and cloud31-gpu. One initial WebKit run was invalidated by a development-server reload during an HTML edit; the unchanged-source rerun passed. TypeScript and production build passed. No physical mobile testing.

No gameplay, economy, API or asset changes. Rollback: cloud-30.

Published successfully: version 32, commit 67a3bd2f30358cb1de86f510e73cbeff3407fa61, deployment appgdep_6ad7bc52752881918e579d57d46ff487, 2026-10-20T19:09:22Z. Large diagnostic trace remains locally available but excluded from Git after the remote size limit rejected it.
