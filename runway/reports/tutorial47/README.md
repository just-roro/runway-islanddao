# NPC tutorial — cinematic 3D overhaul (local, 22 October 2026)

## IMPLEMENTED

- Four scenes: THE LEAP, SURVIVE, FLY & LAND, BUILD. The per-item guide was removed from the tutorial. Typing at 18 characters/second: about 20 seconds of script and transitions, plus voluntary pauses; READ completes immediately, NEXT advances and SKIP exits.
- Stable three-quarter composition: NPC on the left, projection on the right and dialogue reserved at the bottom. In short landscape, the scene takes the left and the dialogue the right. The player keeps their instance and state, but their visual group is excluded during the briefing; it is not moved artificially.
- The right hand extends through the existing rig. The light and rays start from the `pilot-grip-R` socket, also used by the parachute lines. The object materializes from that origin. Smooth rotation, holographic sweep, green/red color and disappearance before the next object or step. A single visible model.
- Short gestures per step, character LED expressions and worry tied to the gas fee. The alternation clock is independent of the gestures and of each typed character: typing does not restart the hologram. The existing digital sounds and their limits are kept.
- SKIP, finishing and Escape save the tutorial as seen. `npc-26` is kept as the persistence identifier so existing users are not forced to repeat it; HOW TO PLAY always offers the new tutorial. SHOP keeps its one-time introduction and SHOP GUIDE lets you repeat it voluntarily.
- No new dependencies, downloaded assets or gameplay changes. Six production geometries are reused; there are no PNGs or screenshots representing objects. Shader prewarming, the clock that stops in the background and reduced-motion alternatives are kept.

## Original models used

| Scene | 3D model | Real source |
|---|---|---|
| THE LEAP | Yellow parachute | `canopyGeometry`, same surface as the flight canopy |
| SURVIVE | Delivery / ETH gas fee | `propGeometry('delivery' / 'gas')`, same modeling, colors and labels as gameplay |
| FLY & LAND | Chained ring / hollow star | `propGeometry('gate' / 'star')`, including the ring stripe shader |
| BUILD | Parachute / Community | Equippable canopy and Community medallion representing the team |

The labels built into the original materials still exist; no image planes of objects are used to replace geometry. The canopy does not go through the pickup label shader, avoiding incorrect surface attributes.

## Required script adjustment

STARTUP records members, invitations and the sum of the best verified flights; it does not allow investing SOL in an office. That is why BUILD says:

> Bank your SOL. Unlock new gear in the Shop. Your best flights grow your startup’s team capital.

Community represents the team, not a fictional office. No Health mechanic is announced: the resource being protected is capital. No investment feature or management screen was added.

## Causes fixed

1. The previous tutorial had nine steps and a second explanatory catalog: replaced by four short scenes.
2. The projector spawned at a fixed world position: it now follows the skeleton's hand, after evaluating its pose.
3. The previous framing could include the player behind the objects: an NPC-only shot and framing adapted to the format.
4. Model alternation depended on the gesture clock, which restarted when speaking began: it now depends on the start of the step.
5. Models did not disappear before the text changed: a 320 ms exit before the next step; exclusive fades between alternating models.

## TESTS RUN

- `npm run build`: types for the whole application/tests and production OK. The bundle size warning persists; it is not a build error.
- `npx vitest run tests/dialogue.test.ts`: 8 tests passed; continuity, pause, exclusive transition, rapid changes, step clock and script/pacing.
- Playwright: 8 tutorial scenarios passed (4 per engine), plus 2 for the SHOP. Emulated Chromium/Pixel 7 and WebKit/iPhone 13. Additional screenshots at 1440×900, 844×390 and 320×568 with reduced motion.
- Full walk through the four steps, object alternations, READ/NEXT, SKIP, return, persistence after reload and HOW TO PLAY.
- Assertions on the real scene: player not visible, one hologram, origin 0.055 units above the socket, face and object separated from each other and from the dialogue, objects on screen.
- Typing and warning-expression audio events checked after interaction. SHOP does not repeat its introduction and lets you request it again. No human listening evaluation of the mix on phones was done.
- All `/api/` calls intercepted with a controlled 503 response: no production runs or rankings were modified.
- Six continuity tests are kept and two are added for the new script and clock; `npc26.spec.ts` keeps the SHOP regression and `tutorial47.spec.ts` replaces the obsolete nine-step/field guide expectations.

### Observed performance

Seven-second window going through real model changes, local Vite server and Mac hardware; does not represent physical phones.

| Engine / emulation | Median | P95 | Max | Max draw calls | Max triangles |
|---|---:|---:|---:|---:|---:|
| Chromium / Pixel 7 | 8.3 ms | 9.1 ms | 9.3 ms | 38 | 32,950 |
| WebKit / iPhone 13 | 17 ms | 20 ms | 34 ms | 38 | 33,030 |

25 geometries and 24 textures recorded; no new asset requests during the window and never two visible holograms. Full data: [performance.json](performance.json). The videos of each walk remain in the local folders `metrics/`, `final/` and `visual-final/`.

### Visual evidence

- [THE LEAP — iPhone 13](captures/iphone13-step-1.png)
- [SURVIVE — iPhone 13](captures/iphone13-step-2.png)
- [FLY & LAND — iPhone 13](captures/iphone13-step-3.png)
- [BUILD — iPhone 13](captures/iphone13-step-4.png)
- [Desktop](captures/desktop.png), [landscape](captures/landscape.png), [320×568 / reduced motion](captures/small-reduced.png)

## PENDING / LIMITS

- Physical iPhone/Android validation and listening to the audio on their speakers.
- Release: this intervention is implemented and built locally; the hosting ZIP was not published or regenerated.
- Investing SOL in STARTUP: does not exist and is out of scope for this task; the tutorial does not promise it.

## Validation environment

At the start, iCloud had offloaded part of the dependencies and some assets; the first Chromium launch was left waiting for loading. The exact lockfile dependencies were restored from the local cache, along with assets whose content matched the Git hash. The previous folder is kept as `.node_modules-offloaded-tutorial47/` (ignored). Later runs passed; no libraries were added and no versions were changed.
