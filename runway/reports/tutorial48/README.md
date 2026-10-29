# RUNWAY — Tutorial, pickups, startup, storm and music (48)

Date: October 22, 2026. Localized changes on top of tutorial47. No new mechanics, economic changes, routes or hitboxes. The Human Friendly production ZIP was not regenerated.

## IMPLEMENTED

| System | Confirmed cause | Fix |
|---|---|---|
| HOW TO PLAY | `char.visible` hid the actor when the tutorial focus exceeded 0.02 and showed it again on return. It was not a model unload. | The same actor, rig, materials and customization are kept. The camera moves it out of frame and returns through a continuous interpolation; a slower focus transition. |
| NPC framing | Wide shot, a fixed hologram target separate from the hand; arm gestures competed with the projection. | Close three-quarter shot adapted to the format. NPC further back in the hold so it does not share the frame with the player. Projection over `pilot-grip-R`, stable extended arm, original models and the existing exit/entry. |
| COMMUNITY / TERM SHEET / MAGNET | They did exist in the generator and could be picked up; their size and individual fog greatly reduced their anticipation. | Visual size ×1.65 within the existing contact reach, consistent between model and glow; longer dissolve distance. Slots were not duplicated and rewards were not increased. |
| STARTUP | The field was inside a dropdown and disappeared with locked membership. The backend returned an ambiguous error even when repeating the same code. | Field and JOIN visible, hexadecimal validation, confirmation and immediate roster. The real endpoint is used; joining the same team is idempotent, with separate errors for a nonexistent code, a full team and locked membership. |
| Storm | The 48 grey instances shared the sphere geometry of the white clouds. | Two continuous closed banks, wide and irregular profiles, distinct crests and bases, per-vertex colors and varied sizes. Opaque instancing, no new textures or shadow passes. |
| Victory | There was no music track tied to the landing confirmation. | The real `landed` event with a valid destination triggers a single track; 0.8 s crossfade, single playback, pause/resume keeping the position and the existing music controls. It ends by bringing back the usual dimmed results music. |

The attached file named `mus_win_01.wav` actually contains MP3 audio. It was copied **without modifying its bytes** to `public/assets/music/mus_win_01.mp3`, with the correct MIME and extension. 131,475 bytes, decoded duration ~6.048 s. SHA-256: `346861b2d7d5bed2a657f685408efdaa5e25fc86947df37f3ae4e4545fff5340`.

The music starts at the valid contact, together with the celebration; the banner and results keep their existing cinematic entry. Menu and gameplay music were not replaced. Transient download failures allow a new attempt on the next interaction, without a request loop.

## Reproducible item audit

[Full frequencies, constraints and diagnosis](PICKUPS.md) · [JSON results](pickup-audit.json) · [Script](pickup-audit.mjs).

10,000 seeds (0–9999): COMMUNITY expected/observed **3/3 per run**; TERM SHEET **2/2**; MAGNET **2/2**. All three are present in 100% of generations. Random slots keep the HACK limits and the consecutive-repeat exclusion. All enabled types appeared. RISK is a residual type, not an enabled catalog item.

In addition, 100 runs with real quantized inputs from the existing controller produced 73 COMMUNITY pickups, 58 TERM SHEET and 23 MAGNET. Amounts, magnet duration, no duplicates and five identical replays were checked. This checks functionality; it does not represent human player skill or balance.

The `pickup-*.png` screenshots are framing fixtures of the real renderer, with seed 17 and original positions, not tests of a human run. Pickup is verified separately with the real controls. Other obstacles may still momentarily hide an object: that challenge was not removed.

## TESTS RUN

- Frontend build: production TypeScript + Vite. Keeps the pre-existing large bundle warning (Three split out).
- API build: Vinext/Vite, full build in a clean temporary copy of the same source, after detecting local files offloaded by iCloud. Pinned dependencies unchanged.
- 17 tests in five suites: dialogue, generation/pickup, storm geometry, audio and runtime; plus the three existing sky tests (20 distinct tests in total).
- Real STARTUP endpoint run against SQLite through a test D1 adapter: invalid/nonexistent code, moving an unlocked membership, full team, lock, idempotent retries and persistence after closing and reopening the database. No test members were created in production.
- Chromium and WebKit: 14 distinct cases passed between `integration48.spec.mjs` and the affected tutorial47 cases. Entering/leaving three times keeps the player's UUID and position, without switching off its visibility; its geometry stays out of the final frame. Screenshots at 390×844, 320×568, 844×390 and 1440×900.
- The four steps, SKIP, fast-forward, HOW TO PLAY, persistent flag, digital audio and reduced motion. One visible hologram at a time and zero new asset requests during object alternation.
- Projection anchored 0.055 units from the hand; constant vertical offset of the object relative to the hand. Screenshots of face, objects and dialogue reviewed. During QA, the leftover pilot at the horizontal edge and the top crop of the canopy were fixed.
- STARTUP in both browsers with controlled responses: invalid code, joining, immediate update, reload and existing/locked membership. Backend persistence was checked separately with the real route.
- Victory: AudioContext active, track decoded, source playing and non-zero audio signal; one start per run. Pause/mute keep the position. Water contacts and off-platform landings do not trigger victory. Contact positions were prepared for these tests; they are not presented as a full human run.
- Real flight with the controller and screenshots of the entry, dense layer, exit and canopy, with no page errors. Clouds: closed geometry, finite normals, clear corridor and triangle limit. Their maximum theoretical increase is 2 draw calls and 4,608 triangles compared with the previous spheres.

The full videos and traces are kept in `browser/`, `tutorial-final6/`, `audio-final/` and `storm-final/` (local, ignored by Git). The selected screenshots are in [captures](captures/). The final measurements are saved in [performance.json](performance.json). They are not GPU measurements of a physical phone.

## PARTIAL

- Mobile performance and audio checked in emulated Chromium/WebKit on this Mac. Thermal behavior, speaker and sensors on real hardware are not certified.
- Joining in production: API deployment checked, but without changing real users' memberships. The operations and persistence are verified with the same route and SQL on a test database.

## PENDING

- Listening and sustained testing on physical iPhone/Android.
- There is no invitation expiry system in the existing backend: persistent codes do not expire. A nonexistent code is reported, without inventing an expiry or adding another policy.

## Continuation

API published from `/private/tmp/runway-api-48-clean`, commit `1162edbb44985eea25f6207649399970104657aa`, version 23. The route changes and their tests also remain in `services/runway-api`; its original checkout had files and Git objects offloaded by iCloud. Its local history was not replaced. See `publication.json` for the final frontend release.
