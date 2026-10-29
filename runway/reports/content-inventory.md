# RUNWAY — Content inventory

Rules: runway-3.0.0-routes / island-routes-8. Generated from the same catalog as the player guide.

The contact sheet contains actual gameplay geometry; it is not concept art. Green/red halos and motion are applied by the live scene. The listed visual concerns are future redesign priorities, not claims of completed new pickup artwork.

| ID | Status | Name / effect | Phase | Model / collider | Visual review | Capture |
|---|---|---|---|---|---|---|
| sol | active | SOL: +15,000 | Fall / glide | props.ts / propGeometry('sol'); Swept sphere + magnetic attraction | Keep the three-bar relief legible when spinning; green aura must not flatten the gold face. | [view](content-contact-sheet.png) |
| term | active | Signed Term Sheet: +150,000 | Fall | props.ts / propGeometry('term'); Swept sphere + magnetic attraction | Paper silhouette is clear; strengthen signature/seal recognition in the future asset pass. | [view](content-contact-sheet.png) |
| community | active | Community: +25,000 | Fall | props.ts / propGeometry('community'); Swept sphere + magnetic attraction | Three people read as community at close range; improve distance silhouette in future reference pass. | [view](content-contact-sheet.png) |
| star | active | Hollow Star: +15,000 · speed +25% for 1.2 s | Fall | props.ts / propGeometry('star'); Swept plane / five-point aperture | Preserve the five-point opening and its exact shared collision polygon. | [view](content-contact-sheet.png) |
| gate | active | Striped Ring Sequence: +100,000 only when every ring is crossed in order | Fall / glide | props.ts / propGeometry('gate'); Swept circular aperture | Preserve red/white striping, beacons and visible opening; LED sequence label is added in gameplay. | [view](content-contact-sheet.png) |
| magnet | active | Magnet: Attract cash pickups for 8 s; refreshes, never stacks | Fall | props.ts / propGeometry('magnet'); Swept sphere | Keep horseshoe silhouette and two differently colored tips. | [view](content-contact-sheet.png) |
| water | active | Water: Halves the next hit; no expiry timer | Fall | props.ts / propGeometry('water'); Swept sphere | Bottle silhouette is visible; future artwork should communicate one-hit protection more directly. | [view](content-contact-sheet.png) |
| rare | active | Rare Cargo: Cosmetic unlock · no cash | Fall · 2% of runs | props.ts / propGeometry('rare'); Swept sphere | Distinct orbiting crystal; must remain cosmetic and never resemble cash. | [view](content-contact-sheet.png) |
| delivery | active | Delivery. Again.: −25,000 | Fall | props.ts / propGeometry('delivery'); Swept sphere | Package silhouette is readable; red aura distinguishes it from rewards. | [view](content-contact-sheet.png) |
| gas | active | Gas Fee: −37,500 | Fall / glide | props.ts / propGeometry('gas'); Swept sphere | Pump silhouette with hose; keep dark display readable against red aura. | [view](content-contact-sheet.png) |
| rug | active | Rug Pull: −50,000 | Fall | props.ts / propGeometry('rug'); Swept sphere | Thin silhouette is weak edge-on; future redesign should retain broad visible carpet plane. | [view](content-contact-sheet.png) |
| hacked | active | Hacked: −75,000 | Fall / glide | props.ts / propGeometry('hacked'); Swept sphere | Server block reads as technology, but a clearer security warning is a future art opportunity. | [view](content-contact-sheet.png) |
| tower | active | Buildings & structures: −37,500 · blocks movement | Glide | runway-city.glb + LANDMARK_BLOCKERS; Swept box | Rendered building envelopes must stay within shared collision bounds; roof/landing separation tested. | [view](evidence/canopy-after.png) |
| ocean | active | Ocean: Run lost · capital becomes 0 | Landing | Island.tsx coast-derived water shader; Authoritative coast polygon | Coast depth texture derives from the authoritative polygon; decoration must not imply safe ground. | [view](evidence/canopy-after.png) |
| risk | inactive | Risk route: Declared type, not generated | None | Legacy definition only; None active | Do not include in player guide or commission a new asset. | — |
| funding | retired | funding: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |
| strategy | retired | strategy: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |
| customer | retired | customer: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |
| grant | retired | grant: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |
| seeker | retired | seeker: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |
| insurance | retired | insurance: Removed from generation, simulation and player UI | None | None active; None | Preserve historical results only. Do not redesign or reintroduce. | — |

Obstacle amounts are full penalties. First two sections use 2%, next two 20%, then 100%. Immunity lasts 800 ms. Water halves one hit. Loss never exceeds available capital.

Landing targets: South Beach 0%, Island Terrace 15%, Jurerê 50%; safe ground outside targets keeps capital without bonus. Sea landing sets capital to zero.

Rebuild with `node scripts/content-inventory.mjs`. Capture gallery: `tests/content-gallery.html` through Vite.
