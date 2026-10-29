# RUNWAY — Batch 2/6 · SHOP UX/UI

Date: 2026-10-22. Local implementation on the working version, keeping the earlier star/replay fixes. The hosting ZIP was not published or regenerated.

## Confirmed diagnosis

- The catalog was a strip of 30×27 px thumbnails inside 68 px buttons; PILOTS did not have that strip. Parachutes/trails/helmet used preview screenshots.
- The preview rendered three pilots. The side ones were at 58% scale; the main one changed scale depending on the UI height and shrank even more when showing the canopy.
- SHOP rules were spread across several blocks of style.css and ui-system.css. The accessory selector relied on a native select.
- When the actor was turned to show the trail, the billboards inherited the parent's rotation and reapplied the camera's: they ended up edge-on. The orientation conversion was fixed for the preview only.

## IMPLEMENTED

- Catalog with two columns on portrait mobile and two/three on desktop and landscape, independent scrolling and a BACK header that is always reachable.
- Five categories, explicit selection, description under the name, separate price and fixed-size actions. Keeps BUY & EQUIP, EQUIP, EQUIPPED, pilot restrictions, challenges and insufficient balance.
- Square thumbnails: 12 original portraits, 94 original accessory compositions, 12 canopy illustrations, 10 trails and 9 LED border designs. Finishes are drawn with the catalog's colors and pattern keys. No screenshots are requested from /previews/.
- Accessory filter with scrollable portraits, no dropdown. No accessory keeps the action to remove the accessory.
- A single 3D actor at a constant 0.9 scale, with a pedestal and display background in the existing canvas. Camera fitted to the available space: body for pilots, portrait for accessories/helmet, canopy detail and rear view for trails.
- The display background prevents the plane structure from covering the parachute. The plane and the NPC return when viewing the guide; leaving SHOP restores the menu.
- The first-visit guide and the ability to view it again remain. The historical helmet pattern is kept as a control independent from the product text.
- Shop styles consolidated in src/shop.css, removing the equivalent old rules. No new dependencies, products, prices, economic rules or persistence.

## TESTS RUN

- `npm run build`: production TypeScript and Vite OK. The Three bundle size warning remains; it is not a build error.
- Vitest: **22/22** in cosmetics42.test.ts, shop.test.ts and dialogue.test.ts. They include migration, purchases, persistence, concurrent operations and storage errors of the existing system.
- Playwright: **8 scenario/browser runs passed in total** (four cases per engine, including the historical helmet control and return to the menu). Chromium and WebKit: formats 360×640, 390×844 (emulated iPhone 13), 844×390 and 1440×900. Screenshots of the five categories; checks of dimensions, square thumbnails, a single actor and stable scale.
- Purchase of Ninja, Sun Glasses, Gold Circuit, Bubbles and Racing Checker: expected balance of 33 M from 60 M; equipping does not charge again. A later purchase of Aurora and Comet leaves 3 M and blocks a premium product for insufficient balance.
- Checked an accessory incompatible with a locked pilot, selection by pilot, accessory removal, reload and persistence, BACK after scrolling and manually opening the guide.
- All 94 accessories and the 12 pilot filters load valid images. Product counts and each category's own thumbnails were verified. The canvas keeps its identity during changes.
- No JavaScript errors or requests for old thumbnails in the category walks. API intercepted with a 503 response during QA; no online production operations were run.
- Screenshots reviewed for mobile and desktop, including canopy patterns, helmet, portraits and trail in motion. Catalog sheets in captures/catalog-*.png. Full QA videos remain in this report's ignored local folders.

Reproducible command (with the local development server running):

```sh
RUNWAY_BASE_URL=http://127.0.0.1:5181 npx playwright test tests/browser/shop44.spec.ts
```

## PARTIAL / PENDING

- The mobile check is Chromium/WebKit emulation on this machine. It is not a physical test on iPhone or Android; sustained performance and gestures on real hardware remain pending.
- Local changes, not published. No other batch was started.
- Production ZIP intact: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Main files

- src/Shop.tsx: catalog, navigation and existing transaction states.
- src/ui/CatalogIcon.tsx: product iconography.
- src/shop.css: responsive layout and visual hierarchy.
- src/scene/World.tsx: single actor and preview framing.
- src/scene/PilotTrail.tsx: correct orientation of the preview billboards.
- tests/browser/shop44.spec.ts: coverage and evidence capture.
- tests/browser/cosmetics42.spec.ts: selectors updated to the new navigation.
