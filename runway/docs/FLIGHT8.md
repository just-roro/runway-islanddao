# Flight 8 — contact and camera pass

- Corrected freefall pitch: chest toward descent, backpack visible to rear camera.
- Closer rear follow camera, with trajectory preview retained after screenshot review.
- Added camera-centred gradient sky/sun and warm key/cool fill lighting.
- Removed PRACTICE FLIGHT / FREEFALL HUD labels. Offline status remains truthful in results.
- Smaller pickups (roughly 20–25%) and airborne hazards (roughly 35%). Rings preserve authored openings.
- Replaced thin pickup ellipsoids with a shared generous body envelope. Obstacles retain tighter collision; render and server use the same radii.
- Rules version runway-2.1.0-contact separates competitive results after collision changes; identities and cosmetics preserved.

Verification: 25 unit tests pass, including edge contacts in freefall/glide, distant misses, idempotence and fixed-step replay. Frontend/server core byte-identical. Frontend/API builds pass. Chromium and WebKit mobile-emulated screenshot tests pass without WebGL errors. Real-device touch/tilt and sustained performance remain unverified this iteration.
