# RUNWAY — rush-19, 16 October 2026

## Implemented

- Four-second exit, 15-second open sky, 15-second active storm, and approximately 15 seconds of physical parachute descent. Real time drives cooldowns/replay; spatial progression drives the course. Existing authored encounter locations, object counts, money and land/water rules remain intact. Safety limit: 65 seconds.
- Hollow five-point stars use a shared rotating aperture for rendering and swept crossings: 150 capital plus 25% actual speed for 1.2 seconds, with 120 ms ramps and refresh without stacking.
- Close camera with velocity-dependent FOV and feed-forward movement; running follows exit velocity, limbs react to steering, canopy opens in one second with independent inertia and body-attached rigging. Storm turbulence is presentation only; reduced-motion is respected.
- Red/white animated sequence rings, red beacons, sequence LEDs, stronger green/red halos, cartoon sparkles and relative-speed trails. Moving object transforms are shared with collision/replay.
- Non-overlapping ocean/horizon geometry, broad waves and soft highlights; continuous shore/vegetation/rock colour transitions; tropical turquoise/pink sky. Storm rain/lightning/thunder and beach life retained.
- First-HTML loading animation ends after essential 3D assets and a rendered frame, then fades for 450 ms. No artificial minimum wait or fabricated percentage.
- Teal flight crew with six short typewritten tutorial bubbles, tap-to-complete/advance, skip and HOW TO PLAY revisit. New tutorial version appears once to existing players. No added dialogue sounds.
- Cash background/label removed; SOL, colour/spring feedback and feed retained. New profile fields are blank, saved names remain. Jurerê sign scrolls WELCOME / JURERÊ / LAND YOUR STARTUP / +10%.
- Tilt permission is requested from a gesture, neutral stance calibrates during exit, stale/missing sensors fall back to touch. Touch takeover is immediate and no longer permanently disables future tilt. Pause includes Tilt / Touch / Recenter.

## Supplied music

Original MP3 files are preserved byte-for-byte under `public/assets/music/` and fetched after a valid interaction:

- `inicio_espera.mp3`: menu and character selection, continuous musical region 8.0–38.4 seconds.
- `jugando.mp3`: gameplay, continuous musical region 0.4–28.5 seconds; results keep this track at reduced gain.

Measured opening/ending silence is excluded from the loop. A 300 ms in-memory overlap joins each loop; transitions between scenes crossfade for 800 ms with at most two live sources. Music uses the existing Web Audio context and an independent channel. Pause/background preserve playback position; volume and mute persist. Existing effects are retained without new sounds.

Audio decoding, silence/waveform inspection and browser playback lifecycle were tested. Subjective listening on phone speakers/headphones remains unverified.

## Compatibility

Rules `runway-2.6.0-rush`, content `jurere-course-6`. Canonical client core is copied into the API build. Same input protocol/endpoints; no schema migration. Identities, startups and cosmetic ownership persist; competitive results/PB are separated by rules version.

## Verification

- 43 unit tests passed: cash, spatial contacts, aperture misses/hits, boost expiry, sequence order, 30/60 Hz invariance, physical landing, deterministic replay and resets. Idle input fails across 100 seeds.
- 30 competent quantized-input routes reached Jurerê in 50.85–52.73 simulation seconds. Every replay matched exactly; maximum local replay CPU sample 74.94 ms (not a Cloudflare benchmark).
- Local D1 integration passed: real-duration ticket, authoritative capital 8,360, both rankings, invalid/foreign payload rejection, idempotent resend, atomic three-member capacity, membership lock and rate limits.
- Mobile emulation: Chromium/Pixel 7 and WebKit/iPhone 13. Full Jurerê/result/hangar, water defeat, loading, flare, limbs, storm, canopy, narrative briefing, volume/pause/mute/background and twenty music transitions checked. Synthetic orientation verifies the input path, not a physical sensor.
- Uninterrupted normal-render-loop flight in WebKit: 51.05 wall seconds / 51.12 simulation seconds to Jurerê, 14,245 capital, no JS errors. Input came from a QA pilot, with no seeking/stepping shortcuts. Video and representative frames recorded.
- Sampled real-time scene: 55 draw calls / 81,203 triangles; accelerated snapshots approximately 50 / 77,900. Below 70 / 90,000 content limits. WebKit desktop emulation around 30 FPS is not a phone performance measurement.
- Evidence: ignored `test-results-rush-verified/`, `test-results-rush-final2/`, `test-results-rush-audio-final/`. Development QA hooks and test assets are excluded from production.

## Pending verification / intentionally deferred

Physical iPhone/Android tilt permission, audio listening, ten-minute thermal/performance tests and twenty complete phone retries remain unverified. UI redesign and new sound effects are outside this iteration. No claim of final event QA is made from emulation.

## Paired rollback

Restore both STORM 18 saved versions together, without deleting data:

- Frontend 18: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_c7e351aefc30819193404d051ae82742`, commit `4e32d5251a2df357b1236f22f864bf7c5ea7f81b`.
- API 14: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_f07c7f29b7808191a10b67c38d77a6d6`, commit `2adf54ac9ff5846ab1ba5524ca74e1bae1f198a3`.

Deployment IDs and public verification are recorded in the parent `docs/runway/DEPLOYMENT.md` after publication.
