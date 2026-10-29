# RUNWAY polish-16 audit — 2026-10-16

Rules: runway-2.3.0-arcade. Content: jurere-course-3.

## Root causes fixed
- Descent began over the ramp. Exit now crosses the fully opened ramp before descending; continuous vertical velocity at 4 s and a camera floor constraint prevent penetration.
- Duplicate Jurerê pads existed in the city GLB and scene. Removed the GLB pad; render and collision use the canonical destination surface.
- LED message rows sampled vertically backwards. Corrected UV direction, removed collar, updated the actual material uniforms when switching identities.
- Selecting a new portrait could suspend the whole Canvas. All twelve tiny portrait textures are loaded together; only the LED sampler and suit accents change, with crossfade.
- A three-second ticket race and GPU stalls silently discarded ranked eligibility. Tickets prefetch in the hangar; slow rendering does not disqualify. Explicit background/pause still does.

## Implemented presentation
Original supplied logo preserved under assets-source/brand; SVG paths/layout unchanged, embedded PNGs re-encoded to WebP for mobile. Source 6.58 MB -> delivered SVG 764,448 bytes. Supplied coin retained; 9,116-byte UI icon and faceted 3D coin with teal edge/gold rim/dark Solana marks. Existing numerical values unchanged.

Clean aircraft floor/interior, matching hatch, red/green lamps. Continuous distance fog, cloud crossing and progressive island reveal. Nearby cloud fragments dissolve instead of covering the camera as hard polygons. Warm lighting, low-cost contact shadows, selective green/red bloom at quarter resolution, green rewards/red hazards.

Cash spring with bounded combo intensity, safe text fitting, three economic feed lines with fade and rearrangement. High-contrast pause and touch targets. Two-second result replay uses the real chronological events and exact final cash; compact settlement leaves the pilot visible. CEO/startup positions come from the API or explicitly display pending/offline/local states.

## Verification
- 32 unit tests: deterministic 30/60 FPS input, economy, water, one-time awards, magnet, contacts, replay, exit clearance, stall handling.
- 100 idle seeds: all defeated with zero final money; active steering tests reach Jurerê in at least 18/20 seeds.
- Chromium and WebKit mobile emulation: real-time idle run, offline finish/retry <1 s, controls and pause; accelerated real-simulation Jurerê and water flights, screenshots and WebM recordings. Accelerated QA is not timing or real-device evidence.
- Local real D1: three-member race, ticket ownership, input validation, authoritative replay, idempotency, membership lock, both rankings, rate limit. New flight accepted at 11,541 capital; matching exact personal/team rank 1 in the isolated QA database.
- Recorded scene maxima <=44 draws and <=68,466 triangles in sampled QA, including postprocess draws. Full static artifact ~4 MB uncompressed. These do not prove sustained mobile FPS.

Evidence stays in test-results-polish16*, excluded from deployment. Public deployment and evidence details are tracked in the parent docs/runway/POLISH16-VERIFICATION.md.

## Explicit limits
No physical iPhone/Android testing or ten-minute thermal/FPS certification performed here. Sensors, venue light conditions, and twenty real-device retries remain unverified. Two additional real destinations still require locations; only Jurerê is active. No invented rank, device result, or final-event sign-off.

## Rollback pair
Frontend: appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_1f54220024cc8191854f7d10d69aa175
API: appgprj_6acfed30efd88191aef688e5a181c299~appgver_464e8f8ec5408191b3d14aa283295803
Restore both together. No destructive schema migration. Keep identities, memberships, cosmetics and historical rankings.
