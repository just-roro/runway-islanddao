# RUNWAY — Batch 3/5 · NPC & Tutorial · npc-26

2026-10-20. Baseline: `flight-25`, commit `8788fd14987792696e85c3cf103fe18874f71a4b`.
Exclusive scope: cinematic conversation, expressions, temporary digital voice and holograms. No other batch was started.

## Causes and changes

- The NPC was mounted/unmounted with the panel. It now stays in the scene, enters with a slide and gradual fade-in, keeps the rig and leaves progressively. The protagonist turns toward it; camera, presence and gestures use a shared state.
- Tutorial and SHOP had independent messages and timings. They now share typing at 35 characters/s, expression, gesture and voice. Close-up for conversation; wider framing when projecting objects; damped return to the menu or carousel.
- Nine tutorial beats separate movement, capital, funding, obstacles, utilities, star, sequences and landing. HOW TO PLAY lets you repeat it. Version `npc-26` is shown once to existing profiles; on new profiles, identity still comes before the tutorial.
- Five character expressions (`^_^`, `o_o`, `>_<`, `;)`, `\o/`), blinking and chest/arm gestures synchronized with the content and typing. Dark face to separate the characters from the environment.
- SHOP includes a welcome with close-up, typing and return to the carousel. The NPC responds to browsing, equipping and errors. Prices, bank and transactions were not changed.
- Gameplay models and materials reused for SOL, Community, Term Sheet, Delivery, Gas, Rug, Hacked, Magnet, Water, star, ring and Rare Cargo. The guide lets you select them. Light scan, smooth rotation and projection lines; the previous object finishes its exit before the next. Buildings and ocean are still explained as environmental hazards, without inventing pickup models.

## Original temporary sound

The existing music and effects were kept. The project had no NPC voice files; original digital tones were added with Web Audio, not recordings from Undertale.

`DIALOGUE_VOICE` in `src/services/audio.ts` configures a short typing voice and five distinct expression cues. Each entry accepts a `url` and duration to replace it with the final files, without changing the tutorial or SHOP. A failed optional file keeps the synthesized tone and is not requested repeatedly.

A single active voice, a minimum separation of 90 ms between groups and expression priority. Skipping text does not play pending syllables. Closing, muting and hiding the page cut the voice; on return, typing continues without replaying missed sounds. The same expression does not sound again on every text update. The menu music continues across these screens.

## Focused verification

- TypeScript and production build: passed. The build keeps the Three chunk size warning; it is not an error.
- 6 unit tests: gradual entry/exit, return from SHOP, stopped clock, 30/60 Hz equivalence, gestures and exclusive hologram replacement.
- 6 Chromium/WebKit cases passed: identity → full tutorial → menu → return; HOW TO PLAY; guide; SHOP → browse → equip; typing/expression; skip; mute; music preservation; landscape and reduced motion.
- After fixing the overlap of the holographic beam, the full tutorial walk was rerun in both browsers: 2/2 passed. A QA measurement that depended on child order was also fixed, using the stable name of the pilot node.
- Full face in the checked mobile framings. The protagonist's turn returns to approximately π (3.142 / 3.146 rad). The recorded typing cues respect ≥90 ms between emissions. Equipping triggers the celebration expression and cue.
- Background was checked through a controlled visibility event: emission stopped, no sound queue. This is an emulated test, not a real iOS interruption.
- Screenshots reviewed: close-up, projection of coin/hazard/magnet/star/ring, SHOP and landscape. Fixed the NPC crop, objects out of frame and the beam covering the protagonist's face.
- Tutorial samples: 36–41 draw calls and up to 42,698 triangles; return menu 27 / 24,706. These are samples of these states with the existing render passes, not a sustained performance measurement of the whole game.
- API, simulation, routes, competitive economy, music and original assets preserved. Local tests blocked the API with a controlled response; no QA results or competitive purchases were sent.

## Evidence

[Results and measurements](evidence-npc26/verified-tests.json).

[Close-up](evidence-npc26/tutorial-closeup.png), [coin](evidence-npc26/sol-projection.png), [obstacle](evidence-npc26/warning-projection.png), [guide](evidence-npc26/field-guide.png), [star](evidence-npc26/star-projection.png), [sequence](evidence-npc26/ring-projection.png), [SHOP](evidence-npc26/shop-greeting.png), [carousel](evidence-npc26/shop-browse.png), [landscape](evidence-npc26/landscape-hologram.png).

Recordings: [tutorial](evidence-npc26/tutorial.webm), [SHOP](evidence-npc26/shop.webm), [landscape](evidence-npc26/landscape.webm).

## Pending items and release

- Final voice files: pending from the user. The synthesized voice is temporary and replaceable.
- Validation on physical iPhone/Android and listening to the mix on their speakers: pending. Emulation and Web Audio logs do not vouch for that test.
- Other batches: outside this delivery; not started.
- Frontend `npc-26` built locally. API unchanged. Rollback available: `flight-25`, version `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_2933ca8125bc81918bbc8cc545065335`.
- Release explicitly authorized by the user on 2026-10-20. The Sites workflow is resumed to publish this validated frontend. The deployment result and public check are recorded separately.

## Release confirmed — 2026-10-20

Sites confirmed a successful deployment of `npc-26`, version 27. [Identifiers and public check](evidence-npc26/publication.json). Tutorial and SHOP opened from the public URL in emulated mobile Chromium, with no JavaScript errors; screenshots reviewed. API blocked during this smoke test to avoid generating QA data.
