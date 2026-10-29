# RUNWAY — Batch 7/7 · Cosmetics, unlocks and economy

Local delivery · October 22, 2026. Neither the frontend nor the API was published. The production ZIP was not regenerated.

## IMPLEMENTED

### Catalog and art

- **94 original accessories** extracted from the local copy of `IslandDAO Assets.fig`: 12 basic, 58 intermediate, 24 premium. No missing images and no invented substitutes.
- They are layers of the LED portrait, compatible with their original pilot. They add no meshes, bones or colliders. The inventory keeps the original names, typos included.
- Base + accessory composition on the original 880 × 880 canvas. A shared framing per pilot accommodates all of their hats/halos; exported at 256 × 256 with nearest filtering. Two texture slots per actor allow smooth switching without keeping the 94 compositions on the GPU.
- Each pilot remembers one accessory or none. Messages and expressions take priority over the portrait.
- **8 new parachutes**: Azure, Pearl, Tropical Split, Sunset Duo, Racing Checker, Ocean Waves, Constellation, Aurora. UVs and patterns on the existing material; vertices, lines, opening and release preserved.
- **6 new trails**: Sky, Coral, Golden Stars, Bubbles, Cloud Mist, Comet. One active instanced system, up to 192 particles and 96 for smoke. Distinct shape, size, lifetime and motion; speed-based emission.
- **8 new LED borders**: Lagoon, Solar, Violet, Sunset, Duo Tone, Pixel Chase, Aurora, Gold Circuit. Parameters of the current shader, top/bottom stripes only. Original remains free.
- Final catalog: **137 products** (12 pilots, 94 accessories, 12 parachutes, 10 trails, 9 LED borders). Earlier products keep their prices and ownership.

### SHOP

- PILOTS / ACCESSORIES / PARACHUTES / TRAILS / HELMET, with asset thumbnails and screenshots of the real render.
- Accessory filter by pilot, preview of locked pilots and purchase conditional on owning the compatible pilot.
- Purchase and equip in one action; drops only unlock. Option to remove an accessory.
- Buttons, navigation and layout keep stable dimensions when state changes; checked at 360 × 640, 390 × 844, 844 × 390 and 1440 × 900.
- A provisional pickup shows the name and `LAND TO KEEP`; the results screen links to the acquired product.

### Economy and persistence

| New tier | Price |
|---|---:|
| Basic | 1,000,000 SOL |
| Intermediate | 5,000,000 SOL |
| Premium | 15,000,000 SOL |

- `ShopAccount` v2 migrates v1 balance, earnings, receipts, purchases and selections. Keeps cosmetics and historical goals; does not rebuild money from the PB.
- Rare Cargo has a **4% total** chance per eligible run, configurable between 2% and 5%, at most one. Eligibility: an accessory not yet acquired for a pilot already owned.
- Reproducible selection with an independent seed; weight per accessory: basic 4, intermediate 2, premium 1. These weights are not summed appearance probabilities.
- Attempt with a persisted ID, fixed selection (also when empty) and `active`, `abandoned`, `settled` states. Picking up is provisional; landing unlocks; equipping is a later action.
- Defeat, abandoning and restarting do not grant the accessory. Removed the old grant that kept rares even after losing.
- Capital, goals and accessory are settled in a single idempotent local write. Purchases and settlement read the latest profile and use Web Locks across tabs. A storage failure confirms neither purchase nor reward.
- If another tab buys the same accessory, it is not duplicated, compensated with money or re-rolled.
- Local storage, with no protection against manual editing of the save. No additional balance, endpoint or table was added.

### Compatibility and required fixes

- Competitive rules `runway-3.2.0-chains` preserved; content `island-cosmetics-11` also updated in the **local copy** of the API core. PB and history are not reset.
- SHA-256 comparison of non-rare objects over 1,000 seeds against the previous baseline: identical IDs, positions, values and routes. Rare Cargo contact still has zero economic value.
- All new public paths use `BASE_URL` for `/` and `/islanddao/`.
- During QA, the update of the trail's effective uniform was fixed: the preview could switch product while keeping the previous shape.
- Fixed the release of bone textures of actors removed from the carousel. The previous cleanup released materials but kept those textures. Poses and rig were not modified.

## Reproducible simulations

These are automated controllers; **they are not tests with human players**.

### Appearance and selection: 100,000 seeds per configuration

| Configuration | Appearances | Measured rate | Basic / intermediate / premium | Max per attempt |
|---|---:|---:|---|---:|
| 2% | 2,005 | 2.005% | 500 / 1,235 / 270 | 1 |
| 4% | 3,944 | 3.944% | 992 / 2,426 / 526 | 1 |
| 5% | 4,920 | 4.920% | 1,226 / 3,044 / 650 | 1 |

Distribution computed with all twelve pilots owned and the 94 accessories not purchased. Weights are renormalized according to inventory; a complete compatible inventory generates no reward.

### Effective acquisition, separate from appearance

300 attempts **conditional on Rare Cargo appearing**, with a controller that tries to pick it up: 137 contacts and 137 accessories kept after landing (45.7% of those attempts). This rate is not the drop probability per run and is not a human estimate.

### Saving: 10,000 progressions over 900 observed runs

Three routes × three control delays × 100 seeds. Effective earnings are sampled, including defeats with zero, without spending before the target price.

| Controller update | Basic: median wins | Intermediate | Premium | Premium: attempts P10–P90 |
|---|---:|---:|---:|---|
| Every 2 ticks | 1 | 4 | 11 | 10–12 |
| Every 8 ticks | 2 | 7 | 19 | 17–21 |
| Every 16 ticks | 3 | 14 | 39 | 36–43 |

The last group needs a median of 40 attempts for 39 wins. The agreed prices are kept; the difference due to precision requires future human comparison, not a rules change in this delivery.

## TESTS RUN

- 31 focused unit tests passed: catalog, migration, purchase, insufficient balance, compatibility, complete inventory, seeds, real Rare Cargo collision, single grant, abandon, defeat, failed storage, persistence, canopy geometry and existing particles.
- A matrix of 16 browser tests passed in mobile/desktop Chromium and emulated iPhone 13/desktop WebKit: SHOP, save, layout, effective shader, provisional pickup, repeated settlement, results, restart and a full flight with Halo + Aurora LED + Cloud Mist + Aurora canopy.
- 8 additional checks passed: repeated accessory/pilot changes and purchases/settlement across two tabs, in the four formats/engines above.
- 24 accessory changes and 24 pilot changes per engine/format: **29 resident textures, no growth**; the canvas is not rebuilt.
- Visual review of the contact sheet, accessories on each pilot, stars, bubbles, smoke, parachutes, LED borders, provisional HUD and results. Continuous videos of the flights and navigation saved with the screenshots.
- Minified production build and TypeScript passed. Alternative `/islanddao/` build generated only in `/tmp/runway-cosmetics-subpath`.
- Four smoke tests of the compiled build passed: Chromium and WebKit, both at `/` and `/islanddao/`. 137–138 assets loaded per test, purchase/equip in the four new categories, no 404s, JavaScript errors or paths outside the base. Scene debug absent in production.
- API calls were intercepted during QA: no test sent purchases, runs or data to production.

### Render measurement

Serial walk through the 94 accessories and 31 finishes, followed by 180 frames of Cloud Mist in the SHOP. Viewport 390 × 844, on the same host machine; the final runs did not share load with another QA browser.

| Measurement | Median frame | P95 | Draw calls | Triangles | Textures / geometries |
|---|---:|---:|---:|---:|---:|
| Chromium baseline, previous SHOP | 8.3 ms | 13.1 ms | 39 | 44,774 | 33 / 22 |
| Chromium, new catalog + smoke | 8.3 ms | 8.8 ms | 39 | 44,710 | 29 / 22 |
| WebKit, new catalog + smoke | 17 ms | 21 ms | 39 | 44,710 | 29 / 22 |

These are samples of the customization scene; they do not prove a general FPS improvement nor replace a sustained mobile session. Captures during flight with cosmetics recorded 29–45 draw calls and 36,006–57,409 triangles at the sampled moments (6, 18 and 36 seconds). They are not claimed to be the maximum across all frames.

Render counters include the passes of the existing pipeline. Textures/geometries count resident resources; they are not a VRAM measurement in bytes. The JSON files contain samples and errors. The functional drop test combines real contact with accelerated simulation until landing; the full audiovisual flight is tested separately in real time.

## PARTIAL / PENDING

- **PARTIAL — physical mobile performance:** emulation and desktop engines were verified. A sustained ten-minute test on real iPhone and Android is missing; no performance is claimed for those devices.
- **PENDING — human balance:** the simulations allow comparing prices and probabilities; observing real players is still missing.
- **Out of scope:** publishing and updating the ZIP. A future release must deploy a frontend/API pair compatible with the new CONTENT. The hosted API was not modified or validated live.
- No references or files are missing for the 94 accessories. No additional batch was implemented.

## Evidence and regeneration

- [Inventory with Figma provenance](nft-inventory.csv)
- [Contact sheet of the 94 accessories and 12 bases](nft-contact-sheet.png)
- [Full catalog and prices](catalog.json)
- [Simulation, earnings and acquisition data](simulation.json)
- [Full browser matrix](browser-full-results.json)
- [Additional memory and tab tests](browser-results.json)
- [Chromium gallery and metrics](chromium-render.json)
- [WebKit gallery and metrics](webkit-render.json)
- [Root and subpath build](production-results.json)

From `runway/`, with Node 24:

```sh
npm run build
npx vitest run tests/cosmetics42.test.ts tests/shop.test.ts tests/gameplay37.test.ts tests/items34.test.ts tests/canopy.test.ts
node scripts/simulate-cosmetics42.mjs
npm run dev
# In another terminal, with the local server on 5180:
npx playwright test -c playwright.cosmetics.config.mjs
node scripts/qa-cosmetics42.mjs chromium
node scripts/qa-cosmetics42.mjs webkit
# Build check on both bases, without regenerating the ZIP:
npx vite build --base=/islanddao/ --outDir /tmp/runway-cosmetics-subpath --emptyOutDir
node scripts/qa-cosmetics42-build.mjs
```

`scripts/export-cosmetics.py` regenerates compositions and inventory from the local Figma file using Python/Pillow. `--thumbnails` in the catalog walk regenerates thumbnails from the game. No runtime libraries were added.

Preserved ZIP: `../entregas/RUNWAY-ISLANDDAO-PRODUCTION.zip`, 10,559,886 bytes.

SHA-256: `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.
