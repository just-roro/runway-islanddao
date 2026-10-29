# Tropical 9 — supplied visual reference

Direction: saturated tropical arcade, cream/ink instrument plates, mint cash, gold pickups, warm sun, turquoise water and a dark-suited rear-view pilot. This is an adaptation into the playable 3D world, not an image pasted behind gameplay.

Implemented:
- Compact responsive cash plate and pause button; existing money and rules only. No fictional distance, fuel gauge or radar.
- Rear camera aligned more closely with the falling trajectory; island appears ahead of the pilot. Smooth canopy camera blend retained.
- Dark flight suit, accent shoulder/knee panels, cream pack and harness; smaller LED sphere relative to body, preserving PERKS identity.
- Warm clustered clouds, brighter tropical coastline and water facets, distant scenic archipelago outside the reachable flight envelope.
- Real island visible at altitude. A brief dense cloud layer still masks canopy deployment; course objects retain their own short fog range to avoid showing the full sequence.
- Vite ignores test artifact directories so concurrent screenshot/trace writes cannot reload the game during QA.

Rules, collisions, backend, rankings and competitive version are unchanged from Flight 8. The main island's collision geometry is preserved. Pilot and city modeling still fall short of the supplied concept art's authored detail; no parity claim is made.

Checks: frontend build and 25 unit tests pass. Browser-emulated screenshots cover Chromium and WebKit; real-device performance remains unverified.
