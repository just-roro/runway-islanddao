# Production Leaderboards — API repair

## Confirmed causes

Rankings are already shared: D1 stores players, tickets, runs, startups and memberships; CEO uses each player's highest verified score and STARTUP adds up its members' highest scores. localStorage keeps identity, preferences and the submission queue, not the global ranking.

1. CORS only allowed Sites and localhost; humanfriendly.global received 403.
2. Pages keeps island-routes-10 and requires a ticket for that version. The API only issued island-glide-13; the client discarded the ticket and played in non-competitive mode. Fixing CORS alone was not enough.
3. Two concurrent submissions were stored only once thanks to the PK, but both could report duplicate=false. Now the result of the insert decides that response.

## Solution

Exact allowlist for humanfriendly.global, the stable Pages origin and the previous origins. No Pages wildcard.

The old replay is frozen from the original source and checked against 100 seeds run on the bundle that was actually published (result and all economic events identical). Tickets without negotiation from the Pages origins get that version; Sites keeps the current one. New clients can declare rules/content. The ticket pins the replay version; the score sent by the client is not trusted. Unknown versions are rejected. There is no silent downgrade of an existing ticket.

The local client declares its version explicitly; that single change is ready for the future frontend release, without deploying the game now.

The DB binding, schema, history, competitive rules, input validation, minimum duration, expiry, authentication and membership restrictions are all preserved. No resources or migrations are created.

## Reproducible tests

From services/runway-api with Node 24:

```sh
node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs tests/startup48/join.test.mjs
TEST_API=http://127.0.0.1:8791/api node tests/api.integration.mjs
```

The second test requires the built Worker and a local test D1 with the two existing migrations. Do not point it at production: it creates five identities and a startup and plays a run with a reward.

`runway/scripts/qa-production-rankings.mjs` compares the saved Pages bundle, served locally on 5186, with the recovered replay; it blocks every call to the real API.

Structured evidence: validation.json. The SQL test closes and reopens an on-disk database, and an independent identity queries CEO, STARTUP and contributions. The Worker test uses Miniflare's real D1, not a mocked API.

## Limits that remain

Pausing or hiding the tab makes the run non-competitive by existing design; that rule was not changed. Offline results without a ticket cannot be validated retroactively. Guest identities are local to each browser/origin: the ranking is global and persistent across devices, but recovering the SAME identity on another device requires a sign-in system that this phase does not add. Do not merge accounts by name.

## Release and rollback

Only the existing Sites API appgprj_6acfed30efd88191aef688e5a181c299. Pages frontend and router untouched. Rollback: return to API version 23 recorded in entregas/release-safety-2026-10-22/sites-publication.json. It does not modify D1. The ID of the new release and the real endpoint checks are kept here.

## Verified published result

API version **24**, commit `faf59e166f23e940cc9a38aa1d17dbe544e324ad`, deployment `appgdep_6adaadedd6508191b244dd61ae7a8010`, published 2026-10-23 00:44:49 UTC. Endpoint https://runway-api.agenciahumanfriendly.chatgpt.site/api . IDs and the release file are in publication.json.

Real test in Chromium and WebKit with origin https://humanfriendly.global: CORS/preflight, identity creation, idempotent startup creation and joining, default legacy ticket, explicit current ticket, old replay, two concurrent submissions resulting in a single row, reading from another identity/context, reloading both sessions, individual detail with runs=1 and membership lookup.

Two identities labeled as QA and one QA startup were deliberately kept to audit the test. Only one real loss with score 0 was stored; no artificial score was awarded and no leaders were displaced. The five previous CEO records and three startups keep their IDs, names and scores. No production records were deleted. The test does not simulate a physical device or demonstrate recovering the same guest account across phones.

There were no changes to the schema/migrations or to the frontend/router hosting. The previous delivery ZIP remains intact. The local client has explicit version negotiation ready for when the rest of the game is published.

Type checking: the modified backend modules and the client session module passed; the global checks were blocked by dependency declarations offloaded to iCloud (zod/three) and were stopped. The backend build and runtime tests did complete.
