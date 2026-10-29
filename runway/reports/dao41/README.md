# DAO ranking & startup UX — dao-41

Scope: TANDA 5/7 only. No office, investment or progression mechanics. Rules and content remain `runway-3.2.0-chains` / `island-routes-10`.

## Implemented

- DAO RANKING title, CEO/STARTUP selector and two persistent gold featured cards.
- Server-derived capital and ranks, positive-score leaders, shared positions for ties. Full table accessible in pages of 50; own position computed over the entire board.
- Leader clock updates every second from the server clock; board refreshes every 20 seconds while visible. Stale responses cannot overwrite a different category/page. Failed refresh clearly labels the last verified snapshot.
- Leader and row detail panels: CEO best-run economic breakdown, number of verified flights/landings, destination/date and current startup; startup members, best contributions and recorded flight counts. No invented hours.
- STARTUP overview, actual team capital, member contributions, open seats, + INVITE, share/clipboard/manual-copy fallback. Create/join and existing three-seat/locked-membership rules preserved.
- Fixed BACK/CLOSE, shared panels/toggles/metric/member-list styles. Mobile widths 360/390/412, landscape 844 and desktop 1440 covered.
- StartupOverview accepts optional visual content for a future office/garage scene; nothing fictitious is displayed or calculated.

## Backend contract / timestamp policy

Additive D1 migration `0001_normal_edwin_jarvis.sql`: `ranking_tracking` and `ranking_leaders`, scoped by rules version/category/entity. Before the first observed ranking mutation (or first read), existing leaders are baselined with `since = null` and a real observation timestamp. UI says “OBSERVED IN FIRST FOR” and “Earlier lead date not recorded”. It never presents migration/deployment time as the historical accession time.

Every accepted run, startup creation and membership move includes baseline + original mutation + reconciliation in one D1 transaction. A new leader gets the request timestamp; improving their own score preserves tenure. Each tied leader has independent tenure. Losing and regaining first place starts a new period. Zero-score entries remain in the standings but are not featured leaders.

`GET leaderboard` preserves rows/own and adds leaders, serverNow, total and nextOffset. `GET leaderboard/detail` exposes only ranking/game data; no tokens or invitation codes. `GET startups` adds each member's verified run count. Old frontend responses remain compatible.

## Validation and evidence

- Frontend TypeScript + Vite production build; backend TypeScript + Vinext build.
- Four SQL tests run the production query/reconciliation module against SQLite with both real migrations: historical unknown dates, takeover/ties/retaking, membership shifts, best-score aggregation, rules isolation, pagination/own rank, empty/zero states, transactional rollback and private-field exclusion.
- Real local Cloudflare D1/API integration: server replay, ticket ownership, arbitrary submitted score ignored, duplicate submission, membership lock, concurrent three-seat cap, both rankings and rate limit. Verified run capital: 2,392,500, rank #1 in both local boards.
- Ten browser cases passed (five per engine), followed by two enhanced end-to-end invitation cases: opening the shared link in a second isolated user session, accepting through JOIN STARTUP, clearing the invitation query and refreshing the owner roster.
- Browser matrix uses controlled fixtures for deterministic clocks/layout/empty/error/race cases. Separate browser integration uses the actual local Worker + D1 for create, copy invitation, join, updated roster, exact ranking order and record values; checks 400/401/404 handling.
- `preview/` contains selected captures. All names in fixture captures are explicit test data; `d1-ceo-record.png` is a real server-verified **local QA** run, not a human or production leaderboard claim. Raw videos/traces and full matrix remain ignored in `final/`.

## Limits / next iteration

- Historical leadership start dates cannot be recovered reliably because prior membership changes were not recorded. New changes are tracked from now on; initial leaders remain explicitly marked unknown.
- No hours/duration field exists in saved run results. Hours are not shown or inferred from submission timestamps.
- Physical iPhone/Android and native share-sheet behavior were not tested; Chromium/WebKit mobile emulation and share/clipboard fallback logic were tested.
- Do not add office/garage mechanics until their requested batch.

Rollback: frontend ui-40, source dff3b969cef0e4fae7f935808c35022246c5f4fc; previous API source 2c119322b84673921c3d9d743847f0f1730ea0fe. Additive tables may remain on rollback; do not delete production records. Deploy the new API before dao-41 frontend.

## Follow-up dao-41a — persistent featured cards

Moved #1 CEO / #1 STARTUP above the category toggle. Featured leaders now have independent retained state, outside the table's loading branch; identical responses preserve their data object. Switching category or pagination no longer unmounts the cards, amount components or clocks. Table fetch/race protection remains unchanged.

Verified production build and four targeted Chromium/WebKit cases: card order, same DOM nodes before/after three delayed switches, continuously advancing clock, correct table categories and stale-response/detail-error handling. Screenshot: `preview/persistent-leaders.png`. Backend unchanged.
