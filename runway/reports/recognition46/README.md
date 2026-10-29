# RUNWAY — Batch 4/6 · UI and CEO recognition

## IMPLEMENTED

- Shared SVG vocabulary: PLAY keeps its original triangle. Tutorial, modifiers, navigation, confirmations, invitations and legal expanders no longer use characters as icons. No new dependency.
- HOME: independent MUSIC (real toggle), independent green CREDITS, HOW TO PLAY and SOUND with volume/SFX controls. The logo reserves space for the crown. PAUSE: BACK TO PLANE right after RESUME FLIGHT.
- Low-poly physical crown: gold #1, silver #2, bronze #3, a single 256-triangle mesh. The inner rim rests on the helmet sphere, above the LED panel. It shares the helmet's chest anchor; it does not use another rig or clock. Visible in the menu, preview and flight/results; excluded from the NPC.
- Recognition only from `leaderboard?kind=ceo`, the authenticated player's `own` entry, positive capital and an integer rank 1–3. Respects backend ties. Queried on entry, every 20 visible seconds, on reconnect and after a run is verified. If confirmation fails, the crown is removed. STARTUP never grants a crown.
- Results: a query before the flight and a query after the upload acknowledgment. Shows positions, places gained/lost, first entry and access to TOP 10/TOP 3. Without a baseline it does not invent a comparison; practice, rejection, update and disconnection are distinct states. Retries and updates the visible data.
- Fixed the coordination of `flushQueue`: consumers wait on the same real promise instead of continuing while another upload is still pending. A query started before the acknowledgment does not replace the later one.
- Compact summary and reduced animation when the user requests it. At 320×568 the results actions share a row to leave room for the character.

## TESTS RUN

- `npm run build`: TypeScript and Vite passed. The known warning about chunks over 500 kB remains; no dependencies were added.
- 6 frontend tests: identity/rank validation, ties, TOP 3, missing data, failed network, comparisons, query after upload, concurrent queue and crown geometry.
- 5 backend tests using its real SQL query against local SQLite: PB, ties, pagination, rules isolation, rollback and the #12 → #2 → #17 change through controlled results. The API logic was not modified.
- 6 browser scenarios (three per engine) passed in Chromium/emulated Pixel 7 and WebKit/emulated iPhone 13. The four tests affected by the final crown and small-results adjustments were then rerun.
- Screenshots at 390×844, 320×568, 844×390 and 1440×900. Navigation, SVG, music, credits, pause order, three crown materials, removal outside TOP 3/offline and preservation of the pilot instance.
- Results with a held response: no position appears before the acknowledgment. #12 → #2 = 10 gained; #12 → #17 = 5 lost; no position → #9 = first TOP 10 entry. Reconnect and retry without duplicate submissions.
- Two continuous flights recorded: crown during fall, opening and landing. Maximums within 70 draw calls / 90,000 triangles in both engines. No mobile hardware benchmark is claimed from this emulation.
- Browser tests intercept API calls with controlled data. No QA scores were created in production.

## PARTIAL / PENDING

- Physical iPhone and Android validation pending for lack of devices. The SVGs have the same geometry in the tested engines; testing on all physical devices is not claimed.
- The position is a real server snapshot; while a screen is open it refreshes every 20 seconds. There is no push subscription in the existing backend.
- No other batches were run, and the hosting ZIP was not regenerated.

## Local evidence

- [Menu and crown](captures/menu-gold-iphone.png)
- [Results 320 px](captures/results-small.png)
- [Continuous flight: landing](captures/continuous-landing.png)
- [Pause](captures/pause.png)
- Full videos in `reviewed/`; latest reviews in `small-final/` and `crown-final/`.
- [Verification summary](verification.json)

Release pending explicit authorization: the automatic review declined to start publishing this batch. No deployment was started; public frontend v45 and API v22 remain current. See `publication.json`.
