# Delivery 35 — positive pickup

Delivery now adds 5,000, compared with 15,000 for SOL. Direct reward, with no time multiplier. Keeps positions, scale and contact volume; it causes no damage, does not consume Water and does not modify immunity. Green glow, green light signal, positive sound and updated tutorial/guide/feed.

Rules: runway-3.1.0-delivery; content island-routes-9. Frontend and API core identical. History preserved; marks use the new rules version.

Validation: 13 focused tests passed (single contact, protection, initial scales, course, full replay and geometry). Emulated Chromium Pixel 7 and WebKit iPhone 13: pickup +5,000, Water intact, no new hits or JavaScript errors. Screenshots and videos in test-results/delivery35*. WebKit screenshot inspected. Not tested on a physical phone.

Coordinated rollback: frontend items-34 commit 43e6f7016d705b149ca4b0a574909af6c9a6e185 and API commit 77632ca0b4bab0c1128025e66fdbb13b04bab94e.

Release confirmed: frontend version 36 (39879a632cbfa4473b3c72b03070dd9d247ffc7c) and API version 18 (43997f20637feecf358d73b9148d1235fbb97fc4). Both deployments succeeded. API dependencies restored from the lockfile because macOS had offloaded local files; no dependency changes or additional mechanics.
