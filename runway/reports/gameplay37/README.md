# RUNWAY — Batch 1/7: Gameplay & Controls

Release `gameplay-37`. This batch only. Rules `runway-3.2.0-chains`; content `island-routes-10`. API and client share the same simulation file. Amounts, speeds, destinations, lift, colliders, music and customization do not change.

## IMPLEMENTED

- **Rings:** `active → completed / failed` state machine, with next index and activation tick. Only the active ring takes part in rendering, labels and contacts. On failure the chain closes, a single `sequence-missed` is emitted and no reward is granted; another chain remains available. Duplicate contacts are idempotent. 260 ms appearance on the fixed clock, stopped while paused. Label atlas extended up to 6/6.
- **Lengths and reach:** chains of 3, 4 and 6 rings during the fall, permuted by seed; two chains of 3 while gliding. Fall spacing of ~0.88 s nominal / ~0.71 s under maximum boost; offsets of 1.3 units between centers. While gliding, 23 units of longitudinal and 4 of lateral separation. A reward of 100,000 only when each chain is completed.
- **Disintegration:** reused and verified the existing 24-segment implementation with radial expansion, spin and a 720 ms fade. The next ring animates while the debris of the previous one dissipates; debris has no collider and grants no money.
- **Sticky SOL:** it was not a parenting problem. The exponential chase at 14/s kept a steady lag larger than the contact radius during the fall. Now the attraction speed exceeds the pilot's by 20 units/s and converges in finite time. A coin that is already attracted can finish its path when switching to the parachute. The 220 ms visual removal after the single contact is kept.
- **Variety:** centralized weights Delivery 4 / Gas 3 / Rug 2 / Hacked 0.6. Selection in encounter order with no identical consecutive solids; HACK has a maximum of 4 and a minimum separation of three selections. Secondary encounter probability 55%. Minimum clearance of one radius of each solid +1 unit and protection of ring openings. The 128 SOL, the pickup lines, the eight patterns and the three paths are kept.
- **Controls:** persistent preference separate from the effective mode. TILT by default when sensors are available; the joystick takes TOUCH immediately and releasing/cancelling returns to TILT. PAUSE→TOUCH persists. Recenter, initial calibration/rotation/recovery, 2° dead zone and 40 ms filter; direct touch response and per-frame knob, independent of the HUD. Permission requested from PLAY/TILT; denial, absence or expiry of samples leave TOUCH available without blocking. A late permission promise does not overwrite manual TOUCH.
- **Tutorial:** explains sequential reveal, lengths, closing on failure and control priority.
- **Inventory:** [CSV](item-inventory.csv). All 12 enabled types were observed. `risk` keeps legacy geometry but is inactive and not generated; retired decisions were not reactivated.

## TESTS RUN

- 48 tests in 8 files covering simulation, controls, replays, route balance, item contacts and affected presentation; plus 2 report/API and glide-chain tests: **50 passed**. Logs attached.
- 120 isolated runs of fall chains: 20 seeds × 3 chains × normal/sustained maximum boost. All 120 completed with exactly one reward per chain. Tests for failure, re-contact, appearance and pause.
- 1,000 seeds: reproducible generation, 128,000 SOL, 19,000 rings, 2,000 magnets, 1,000 Water and 18 Rare Cargo. HACK: **3.656 on average and 4 maximum**, versus a fixed 18 in the previous generator. Full weights and counts in [metrics.json](metrics.json).
- 100 runs with an automated controller, spread across beach/intermediate/Jurerê: **100 landings**, 34/33/33 at their destinations. Exact comparison of state, events, contacts and balance against the API replay; mean capital 1,474,495. This is automated evidence, not human balance. The 30/60 FPS render scheduling test also matches.
- Emulated Chromium Pixel 7 and WebKit iPhone 13: 3 cases per browser passed: chains/fragments, full run/coin cleanup/replay, controls/permissions/fallback. Verified that two rings or active labels of the same chain are never drawn, and that money only changes on completion. The 70 draw call limit was checked on the chains.
- Orientation and permission events **simulated**. Native pointer on the joystick in both browsers; touch emulated via CDP in Chromium. No page errors in the final controls test. A first WebKit test used a synthetic constructor that did not carry orientation data; the fixture was fixed to events with explicit fields and rerun successfully.
- Visual inspection of screenshots from both browsers. Labels of future rings that still appeared independently of their models were detected and fixed. Continuous recordings saved in `final-browser/` (chains), `controls/` (controls) and `browser/` (full runs).
- Frontend/API builds completed. The server core is byte-for-byte identical to the client. The earlier seed tests that pinned 4 rings and an exact balance were updated to the new rules; the accounting and single-reward checks were preserved.

### Reproduce

```sh
npm test -- tests/gameplay37.test.ts tests/controls37.test.ts tests/gameplay37-report.test.mjs tests/simulation.test.ts tests/canopy.test.ts tests/balance.test.ts tests/items34.test.ts tests/runtime.test.ts tests/storm.test.ts
RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/gameplay37.spec.ts
```

The API report requires running `node ../services/runway-api/scripts/sync-core.mjs` first in this checkout. The isolated browser chains remove the other items to observe the system clearly; full runs keep all items and use normal quantized input.

## PARTIAL / PENDING

- Sensor integration is implemented and checked with simulated events; **physical validation of the iOS permission, orientation/calibration and touch feel on iPhone/Android is pending**. No physical QA or hardware latency measurement is claimed.
- No features of this batch were deliberately postponed. `risk` is documented inactive content, not a pending pickup. No other batch was started.

## Compatibility and rollback

The rules version separates new competitive marks and PB. Identity, startup, purchases, balance and historical results keep their storage and contracts. Old pending runs follow the existing local handling on incompatibility.

Rollback of the previous pair:
- Frontend `sound-36`, commit `0f47cfdbb8049b0a098667e081b955e88cbd54cf`, Sites version 37 (`appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_288628e602f48191b1513b548722f6f1`).
- API commit `43997f20637feecf358d73b9148d1235fbb97fc4`, Sites version 18 (`appgprj_6acfed30efd88191aef688e5a181c299~appgver_16d5bb387fa081919a614427a7bccc7d`).
