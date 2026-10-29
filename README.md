# RUNWAY — IslandDAO

**FUND. BUILD. LAND.**

> *Build your capital. Ride the currents. Land your startup in Floripa.*

RUNWAY is a web game for IslandDAO × Human Friendly. Every run is a flight: you jump out of the plane, freefall, pray to open your parachute and land on the island while collecting SOL (the in-game money, which is the only score). Players have their own identity, can create or join a startup and invite others, buy cosmetics and compete on two global leaderboards: **CEO** (each player's best verified score) and **STARTUP** (the sum of its members' best scores). Scores are recomputed on the server from the replay: the score sent by the client is not trusted.

- Live game: https://humanfriendly.global/islanddao/ (the version deployed in production; it may not match this code exactly).

## Version

| Component | Folder | Saved version | Source commit |
|---|---|---|---|
| Frontend (game) | `runway/` | v47 | `e58d1fd3366258686830d116d2c6db5d80c5de32` |
| API (leaderboards, tickets, startups) | `services/runway-api/` | v28 | `3d74ea5a3fbc15cd9a9dcda956692c892985eb9c` |

## Tech stack

- **Frontend:** React 19, Three.js + React Three Fiber, Zustand, TypeScript, Vite. Tests with Vitest and Playwright (Chromium/WebKit).
- **API:** Cloudflare Workers with [vinext](https://github.com/cloudflare/vinext), Cloudflare D1 database (binding `DB`), Drizzle ORM, SQL migrations.
- **Assets:** original Blender models (`runway/assets-source/`), GLB models, images, music and sound effects (`runway/public/`).

## Structure

```
runway/                  Game frontend
  src/                   React/TypeScript code (App, UI, 3D scene, economy, shop)
  src/core/simulation.ts Canonical simulation rules
  public/                Served assets (models, audio, fonts, images) and third-party licenses
  assets-source/         Original sources (.blend, SVG)
  tests/                 Unit tests (Vitest) and browser tests (Playwright)
  scripts/               Hosting packaging and QA
  docs/                  Design notes and hosting instructions
  reports/               QA reports for each iteration
services/runway-api/     API
  app/api/               HTTP routes
  lib/                   Leaderboards, competitive rules, current and legacy simulations (lib/legacy)
  db/, drizzle/          D1 schema and SQL migrations
  tests/                 Leaderboard, startup and API tests
```

`runway/` and `services/runway-api/` must stay at these relative paths: some scripts reference each other across them.

## Running the game locally

Requires Node 24.

```sh
cd runway
npm ci
npm run dev        # http://127.0.0.1:5180
```

The development server proxies `/api` to a local API on port 8787. Without an API, the game runs in practice mode (no leaderboards).

Other scripts (`runway/package.json`):

```sh
npm test                  # Vitest
npm run build             # typecheck + Vite build into runway/dist/
npm run preview           # serves the build on 127.0.0.1:5180
npm run package:hosting   # build for the /islanddao/ path (see runway/docs/INSTRUCCIONES-HOSTING.md)
```

`runway/.env.example` shows the `VITE_API_URL` variable. Do not point local tests at the production API: they create real players and runs.

## Running the API locally

```sh
cd services/runway-api
npm ci
node scripts/run-framework.mjs build
npm start                 # local Worker with Wrangler and a local D1 in .wrangler/state
```

**Important:** use `node scripts/run-framework.mjs build`, not `npm run build`. The `prebuild` step (`scripts/sync-core.mjs`) copies the frontend simulation over the API's, which would overwrite the v28 simulation.

API tests:

```sh
node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs tests/startup48/join.test.mjs
```

## Test status (verified on 2026-10-29, Node 24)

- Frontend: `npm ci` and `npm run build` passed. `npm test`: 132 of 135 passed. One test (`gameplay37.test.ts`) exceeded the 5 s timeout and passes with `--testTimeout=20000`. The other two (`cosmetics42.test.ts`, `gameplay37-report.test.mjs`) compare the client simulation with the API's newest simulation and fail with these versions.
- API: build passed. `tests/production-leaderboards/api.test.mjs` and `tests/dao41/rankings.test.mjs`: 12 of 12 passed, with a local D1.
- No QA was done on physical phones.

**Compatibility:** frontend v47 uses the `island-glide-13` content, which API v28 supports in `lib/legacy/island-glide-13.ts`. The API chooses the rules version based on the origin. Before deploying this frontend on another domain, that negotiation must be adjusted and tested.

## Not included

- The production D1 database (players, runs, leaderboards) and the server's secrets or variables.
- The original Git history (the source commits are listed in the table above).
- QA recordings and screenshots (only the text and JSON reports are included).

## License

© 2026 Tres Humanos S.R.L. (Human Friendly). All rights reserved. This is proprietary software: no license is granted to use, copy, modify or distribute it without prior written permission. See [`LICENSE`](LICENSE).

Third-party licenses (libraries, fonts and assets) are in `runway/public/licenses.txt` and `runway/public/assets/fonts/*-OFL.txt`.
