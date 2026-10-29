# RUNWAY — canopy-17, 16 October 2026

## Implemented
- Cabin/ramp clearance applied to camera targets and damped camera positions. The camera stays below the cabin ceiling until fully past the four-metre ramp.
- Opaque depth-writing cloud lobes, a clear gameplay corridor, continuous distance haze, rain and two restrained thunder/light pulses. Sky and fog share their atmospheric colour; removed unsorted translucent clouds and the failed grainy fade.
- Warm gradient sky, visible HDR sun, projected lens flare, selective HDR glow including yellow LED/sun, edge-only radial blur; reduced motion disables blur/lightning.
- Tight 1024px directional shadow map for aircraft, pilot and canopy, retaining inexpensive environmental contact shadows.
- Backward trailing limbs, steering response and raised hands under a new faceted yellow/navy ram-air canopy. No jetpack props, flames or runtime labels. Existing four-way glide rules retained. Nebula cosmetic ownership retained as a canopy tint.
- Brighter coral/teal/violet suit, preserving live skin changes without reloading the world.
- Loading overlay ends when the loaded scene renders. First-flight visual tutorial persists after acknowledgement; retry skips it. No stage label beneath cash. Cash colour now explicitly overrides the old always-green CSS.
- Transient event-driven LED messages, impact priority, no permanent RUNWAY message. Presentation-time expiry also clears the final message while simulation is stopped on results.
- Stars pay 150 individually. Circular chains pay 1,000 only after every ring is crossed in order; a miss invalidates the chain. Three four-ring freefall chains and one three-ring approach chain. Choice doors are hexagonal to avoid confusing them with chain rings.
- 96 freefall SOL in 24 close vertical strings, plus 6 approach SOL. Seeded positions remain deterministic. Cash remains the only score; no burn, no automatic wind, water loses all capital.

## Compatibility
Rules `runway-2.4.0-canopy`, content `jurere-course-4`. Shared simulation is byte-identical in the API. New competitive board; identities, startups and cosmetics stay intact. No schema migration, library or service added.

## Verification
- Unit suite: 37/37 passed. Ordered/full/missed/repeated chains, actual reachable four-ring slalom, stars, dense SOL paths, camera clearance, replay equality, magnet, losses and land/water outcomes. 100 idle seeds lose; active route tested over 20 seeds.
- Chromium Pixel 7 and WebKit iPhone 13 **emulation**, not physical phones: complete flight, cloud/reveal, parachute, Jurerê and water results, return to hangar, skin continuity, pause, HUD bounds, first tutorial and camera clearance during real-time exit.
- Screenshot/video evidence: `test-results-canopy17-final/` and `test-results-canopy17-onboarding/` (ignored from source/public build). The first visual pass exposed noisy clouds, which were corrected before final evidence.
- Final sampled flight: maximum 48 draw calls / 47,835 triangles in both emulated browsers, including postprocessing and shadows. These are content budgets, not a physical-phone FPS claim.
- Local D1/API: real ticket duration; server replay returned 21,890 capital; duplicate submission, ownership, payload rejection, three-member capacity, membership lock, rate limits and both persistent rankings passed.
- An additional full-island/LED-shadow experiment caused a software-rendering timeout and was rolled back to the previously passing tight shadow configuration before publication.
- A unit stress test timed out while multiple software-rendered browsers were competing for CPU. It passed when re-run alone; do not conflate this with a game-rules assertion failure.

## Still unverified / intentionally pending
- Physical iPhone/Android performance, thermals and tilt. Ten-minute physical sessions remain necessary; emulation does not replace them.
- User item 22 (unspecified UI reference) is untouched, pending the actual reference.
- Other two real destinations remain inactive, pending locations; Jurerê is the confirmed destination.

## Rollback pair
Frontend previous public version 15: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_435ba95e719c8191bff96fa689325530`, commit `4c2d0f5e4966414b2b0065886fb3775260422c3f`.
API previous public version 12: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_6ebcd42e97448191a164e4858983624c`, commit `40078f744c5be191497639ed495c52b4fde7fe14`.
Restore the pair together. Rankings are version-separated; no data deletion is needed.
