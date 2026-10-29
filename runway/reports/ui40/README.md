# RUNWAY — Batch 4/7 · UI-40

2026-10-21. Implementation limited to interface, navigation and SHOP presentation. Baseline/rollback: `world-39`, commit `ba16b8eb803aa0767542232e82297eeefd978e79`, Sites version 40.

## Implemented

| Requirement | Cause and change | Verification |
|---|---|---|
| BACK always reachable | It was inside the same scroll as the content. `Panel` now supports navigation as a header separate from the scrollable body; applied to Rankings, My Startup, Options, Credits and pause. SHOP keeps its own anchored header. | Identical coordinates before/after scrolling; credits with expanded licenses. |
| Avatar without waiting/layout shift | The original PNG already weighed less than 2 KB; it was requested as an external resource among the 3D assets. The 12 originals are embedded in `identity-portraits.json` as data URLs for the badge, with 40×40 reserved. The art and helmet textures were not altered. | Inline source and dimensions verified; visible in the initial screenshots. |
| Borders and icons | A rectangular border cut by clip-path did not draw the diagonals. `Button` draws an SVG stroke at the real size with the same bevel. PLAY, navigation, plane, music and categories use the `Icon` SVG. | Chromium/WebKit screenshots; the pause border covers the whole button. |
| Branding | Original Human Friendly × IslandDAO PNG, byte-for-byte identical, above RUNWAY. Subtle 7 s motion and shine, disabled with reduced motion. | Screenshots in five formats and SHA256 in summary.json. |
| Chatlog | The fixed offsets depended on the viewport, not on the counter. Feed in the flow right after the amount; 14 px text, no arrows or shadows. | 4 px separation from the counter; real gains/losses and entry/fade kept. |
| SHOP intro | Ephemeral state when mounting SHOP restarted the conversation. `shopIntroSeen` is saved on the first visit; a SHOP GUIDE button lets you view it again. An empty conversation no longer plays expression audio. | First visit, return, reload and manual viewing. If you leave before finishing the explanation, the shop opens directly on return; SHOP GUIDE keeps the voluntary viewing. |
| SHOP categories/content | Three toggles with icons and animated states. Name followed by description. A single ownership state and a single action; removed redundant local-savings text. Arrows on a solid background. | Pilots, Parachutes and Trails; purchases and selection with no new categories. |
| SHOP stability | Rows reserved for title, description, variants and action. 3D fit computed from the preview rectangle; scale per category/format, independent of the balance or purchase message. | Exactly equal rectangles for BUY, EQUIP, EQUIPPED and INSUFFICIENT FUNDS. Canvas and pilot instance retained while browsing products; stable transforms with reduced motion. |
| LANDED | Removed the multi-layer frame, grid and ledger dividers; larger SVG plane, short gap to the text. Removed monetary credit phrases/"Capital secured"; real achievements are kept. | Result 1,657,500, exact breakdown and credited balance; controls visible. |

## Tests run

- `npm run build`: TypeScript and Vite OK. The existing Three chunk size warning remains; no dependencies were added.
- `npm test -- --run tests/shop.test.ts tests/economy.test.ts`: **11/11**.
- `tests/browser/ui40.spec.ts`: **8 distinct cases passed** (4 per engine), with an additional confirmation run after fixing the CSS specificity of the pause SVG.
- Chromium/Pixel 7 and WebKit/iPhone 13, at **390×844, 360×640, 412×915, 844×390 and 1440×900**.
- Purchase of Horse and Lagoon: 3,000,000 → 250,000 SOL, ownership/equipment persisted after reload; browsing without buying does not change the equipment.
- Ending with the real deterministic simulation, seed 17, Jurerê route: 1,657,500 SOL, reflected in results and balance. To speed up QA the simulation is fast-forwarded to the end; it is not a full human run.
- Reduced motion: no ambient logo motion; navigation keeps the canvas, instance and pilot transforms.
- Screenshots of menu, SHOP, HUD and LANDED were inspected visually, including small mobile and landscape. Videos of the interactions and the full matrix remain local in `final/` and `confirmation/`.

## Evidence

- [Previous menu](preview/menu-before.png) → [iPhone 13 menu](preview/menu-iphone13.png).
- [Previous SHOP](preview/shop-before.png) → [iPhone 13 SHOP](preview/shop-iphone13.png).
- Scrolled credits, small mobile and parachutes: additional local screenshots in `final/`.
- [Chatlog](preview/hud.png), [LANDED](preview/landed-iphone13.png).

## Real pending items / next iteration

- Validation on **physical** iPhone and Android pending; emulation is not equivalent to real devices and does not measure their performance.
- The API responded with 503 in QA to isolate presentation and local persistence; these tests do not certify ranking acceptance in production.
- Rules, prices, goals, collisions, island and backend were not modified. No Batch 7 categories were added and the next batch was not started.
- `identity-portraits.json` contains base64 of the originals in `public/assets/perks`; if those originals change, regenerate that map in the same order as `perks.json`.
