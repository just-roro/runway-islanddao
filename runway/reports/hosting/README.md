# RUNWAY — hosting package validation

ZIP: `RUNWAY-ISLANDDAO-PRODUCTION.zip`  
Size: **10,559,886 bytes / 10.07 MiB**  
SHA-256: `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`

## Implemented

- Minified production build with React 19.3.0, R3F 9.8.1, Three 0.186.1, TypeScript 6.0.3 and Vite 8.3.4. Dependencies and graphics configuration unchanged.
- Base `/islanddao/`; a shared function for model URLs and their recovery, portraits, preloads, images, audio and licenses. Vite also transforms HTML and CSS fonts. The usual root build is preserved.
- Package invitations point to `https://humanfriendly.global/islanddao/?join=…`, both for sharing and copying.
- `npm run package:hosting`: types, isolated temporary build, assembly, ZIP, audit and SHA-256. No publishing, no new dependencies installed and no API contact.
- ZIP with 105 runtime files inside `islanddao/` and the manual outside it. No source code, node_modules, sourcemaps, credentials, QA tools or Sites configuration.
- Four assets with no current consumers were left out of the package: the old SVG favicon, the old SVG logo, the old Human Friendly logo and a JSON copy of the geography not used at runtime. The current coastline is still included in the simulation bundle; it was not altered.
- Gameplay, economy, competitive rules, design, materials and animations unchanged. API and main site untouched.

## Tests passed

1. TypeScript and minified subdirectory build. Usual root build. An automated URL test for both bases and for invitations with encoded parameters. `git diff --check`.
2. The final ZIP was extracted and served with a static HTTP server under `/islanddao/`. All **105 assets** returned the exact ZIP content, checked byte by byte. The trailing-slash redirect preserves `?join=`.
3. Emulated Chromium Pixel 7 (412×839), Chromium desktop (1440×900), emulated WebKit iPhone 13 (390×664, Playwright configuration), WebKit desktop (1440×900).
4. In all four combinations: cold load, menu, HOW TO PLAY, SHOP/categories/models, shared and copied invitation, reload with `?join=`, STARTUP, empty RANKING and handled error, real-time run, bankruptcy result, ONE MORE RUN, pause and BACK TO PLANE.
5. Five GLBs and twelve portraits loaded; fonts and licenses available. No local 404s, no accidental requests to root `/assets/`, no page/module errors and no unexpected external requests.
6. Web Audio instrumentation: **69 files decoded**, zero decoding errors and audio sources started after interaction in every configuration. This verifies loading and programmatic playback; it is not a critical listening review of the mix.
7. All API requests were intercepted in Playwright with controlled responses. Real data and CORS are not certified by these mocks.
8. Screenshots of the mobile menu and results were saved and reviewed; videos of the runs in `qa/`. The delivered build neither contains nor enables development hooks.

A first Chromium desktop run failed while waiting for the mocked ranking response while the build was also running. An isolated rerun of the same ZIP passed completely. Both logs are kept; the game was not modified and the initial failure was not hidden.

Build warnings: the Three bundle exceeds 500 kB, as in the existing baseline; its split is kept. Vite warns that `curtain.css` with an explicit base will be resolved at runtime; the file was checked over HTTP and in all four browser loads.

## Real pending items

- The API owner must authorize `https://humanfriendly.global` (OPTIONS, GET/POST, Authorization/Content-Type). The package cannot enable it. Without it, online features will not work from the new domain.
- Final hosting configuration, HTTPS, CSP, MIME, caching and an online test from the final URL. Nothing was published and Cloudflare was not accessed.
- Physical phones, real sensors and sustained performance not tested; mobile formats are emulated on this machine.
- No successful landing was completed in this smoke test: the four runs without maneuvers ended in bankruptcy. The LANDED asset is included and checked over HTTP; the victory celebration is not claimed to have been revalidated.
- Browser save/identity does not migrate between domains. Existing history was not modified.

## Regeneration and rerun

In the `runway` project, with Node 24 and dependencies already installed:

```sh
npm run package:hosting
```

On this machine, if PATH has another Node version, the command used was:

```sh
PATH=/Users/nacho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run package:hosting
```

The ZIP is regenerated in `../entregas/`. The script prints the size and SHA-256 and replaces `PACKAGE-METADATA.json`, marking that the new version needs its own QA. This report and the screenshots correspond only to the SHA-256 above.

To rerun QA, extract the new ZIP into `/private/tmp/runway-hosting-qa`, serve that folder on `127.0.0.1:5191` and run `node scripts/qa-hosting.mjs` from `runway`. The script intercepts all outgoing external network traffic; the hosting administrator does not need these tools.
