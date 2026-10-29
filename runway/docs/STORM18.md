# RUNWAY — storm-18, 16 October 2026

## Changes
- Loading screen is in the first HTML, before React/Three downloads. It shows the original logo and animated wind/star, then fades after the loaded scene has rendered (minimum 1.2 seconds from navigation). Retry does not reload it.
- Freefall speed is exactly 30% higher: 10.5 → 13.65 world units/s. Course timing is compressed against the existing spatial layout; altitude and vertical speed remain continuous through exit and parachute deployment. Glide controls, money rules and landing geometry are unchanged.
- Added ten freefall hazards, five visible storm hazards and four additional approach hazards. Reward corridors remain available; no automatic lateral wind.
- Arms and legs bank, spread and tuck with actual velocity/acceleration. Presentation smoothing never delays the input or changes the hitbox.
- Yellow/navy canopy inflates in 1.6 seconds, with a bounded damped spring for bank/pitch and rigging that follows the moving canopy. Small inflation overshoot settles quickly. Physics and visual inertia stay separate.
- Restored the cloud corridor before deployment: volumetric opaque clouds, continuous fog, 240 rain streaks, branching lightning, delayed thunder and storm lighting. Reduced-motion mode limits flashes and rain movement.
- Projected warm lens flare and coloured ghosts remain visible while the sun is in view after the hatch opens; removed the old short time window.
- Added instanced beachgoers, umbrellas and surfers, denser palms, animated surface waves, sea highlights and continuous shoreline foam. Decorations do not change landing/collision rules and avoid the target and building footprints.

## Compatibility
Rules `runway-2.5.0-storm`, content `jurere-course-5`. Frontend and API use the same simulation. A separate competitive board avoids comparing the faster course with the previous rules. Guest identities, memberships and cosmetics are preserved; no schema migration or dependency added.

## Verification
- Unit suite: 40/40 passed. Includes exact speed increase, continuous altitude, storm/approach hazards, canopy spring at 30/60 Hz, deterministic replay, chains, pickups, cash and land/water outcomes. Existing balance cases include 100 idle seeds and 20 active routes.
- Local D1/API integration passed with a real-duration ticket: authoritative replay returned 16,555 capital; identity, atomic startup capacity, ownership, malformed input rejection, idempotency, membership lock, rate limits and both rankings were checked.
- Browser tests use Chromium/Pixel 7 and WebKit/iPhone 13 emulation on macOS. They are not physical-phone QA. Accelerated course inspection advances the actual simulation and waits for the damped camera to settle before screenshots.
- Visual review caught an occluded lightning bolt, discontinuous shoreline normals and excess water triangles. These were corrected before final verification. Evidence is in ignored `test-results-storm18-*` folders, not the public build.

## Remaining physical QA
Phone tilt, real iPhone/Android FPS, thermal behaviour and sustained ten-minute sessions are still unverified. Browser draw-call/triangle measurements are content budgets, not device-performance claims.

## Rollback pair
Restore both previous public versions together:
- Frontend 17: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_17f6308218388191804563af041c3dea`, commit `d34c356646c5c1730b59df5c28389df99023110a`.
- API 13: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_68c2a67acd8481919509003d2ef8f644`, commit `3d82d5828e226dd78ccd53be11245a0b082c8c28`.

## Final local browser evidence
- Full Jurerê route/result/hangar passed in both Chromium and WebKit. Water defeat passed in both. Loading, exit flare, steering limbs, lightning/rain and fast canopy passed in both.
- Maximum sampled geometry: 49 draw calls / 86,873 triangles (WebKit); Chromium 86,823 triangles. Both meet the 70 / 90,000 limits.
- One development reload interrupted a Chromium water test; isolated rerun passed. Capturing Chromium's initial WebGL compilation caused repeated SwiftShader ReadPixels stalls. The boot test now holds the entry script, captures the actual initial HTML loader, releases the script and verifies the rendered game. That isolated test passed; no production workaround or delayed-ready bypass was added.
- Final captures/video: `test-results-storm18-final/`, `test-results-storm18-chromium-recheck/` (water) and `test-results-storm18-chromium-boot/` (loader/weather/canopy). Hardware-specific load time is not established by these tests.
