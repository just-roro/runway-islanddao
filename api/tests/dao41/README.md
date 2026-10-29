# DAO 41 validation

`node --test tests/dao41/rankings.test.mjs` runs actual production SQL through a small SQLite/D1 adapter with migrations 0000 and 0001. Covers leadership, ties, membership changes, data projection, pagination, rules isolation and atomic rollback.

`node tests/api.integration.mjs` targets local Worker/D1 only (default 127.0.0.1:8787). It creates local QA identities, executes an authoritative replay and checks duplicate submission, ranking, membership capacity/locks and ticket ownership/rate limits. Never run this fixture generator against production.

Frontend tests `tests/browser/dao41.integration.spec.ts` compare the UI to local API responses, create/join startups and exercise invitation copying. All production schema changes are additive. Initial leader accession dates are intentionally null; observation dates are not historical tenure.
