# RUNWAY — Tanda 4/7 · UI-40

2026-10-21. Implementación acotada a interfaz, navegación y presentación de SHOP. Base/rollback: `world-39`, commit `ba16b8eb803aa0767542232e82297eeefd978e79`, versión Sites 40.

## Implementado

| Requerimiento | Causa y cambio | Verificación |
|---|---|---|
| BACK siempre accesible | Estaba dentro del mismo scroll que el contenido. `Panel` ahora admite navegación como encabezado separado del cuerpo desplazable; aplicado a Rankings, My Startup, Options, Credits y pausa. SHOP mantiene su propio encabezado anclado. | Coordenadas idénticas antes/después de scroll; créditos con licencias expandidas. |
| Avatar sin espera/layout shift | El PNG original ya pesaba menos de 2 KB; se solicitaba como recurso externo entre los assets 3D. Los 12 originales se incorporan en `identity-portraits.json` como data URLs para el badge, con 40×40 reservados. No se alteró el arte ni las texturas del casco. | Fuente inline y dimensiones verificadas; visible en capturas iniciales. |
| Bordes e iconos | Un borde rectangular cortado por clip-path no dibujaba las diagonales. `Button` dibuja un trazo SVG con el tamaño real y el mismo bisel. PLAY, navegación, avión, música y categorías usan `Icon` SVG. | Capturas Chromium/WebKit; borde de pausa ocupa todo el botón. |
| Branding | PNG Human Friendly × IslandDAO original, idéntico byte a byte, encima de RUNWAY. Movimiento y brillo sutiles de 7 s, desactivados con reduced motion. | Capturas en cinco formatos y SHA256 en summary.json. |
| Chatlog | Los offsets fijos dependían del viewport, no del contador. Feed dentro del flujo inmediatamente después del importe; texto de 14 px, sin flechas ni sombras. | Separación de 4 px respecto al contador; ganancias/pérdidas reales y entrada/fade conservados. |
| SHOP intro | Estado efímero al montar SHOP reiniciaba la conversación. `shopIntroSeen` se guarda en la primera visita; botón SHOP GUIDE permite volver a consultarla. Una conversación vacía ya no emite audio de expresión. | Primera visita, regreso, recarga y consulta manual. Si se abandona antes de completar la explicación, la tienda abre directamente al volver; SHOP GUIDE mantiene la consulta voluntaria. |
| SHOP categorías/contenido | Tres toggles con iconos y estados animados. Nombre seguido de descripción. Estado de propiedad único y acción única; retirado texto redundante de ahorro local. Flechas sobre fondo sólido. | Pilots, Parachutes y Trails; compras y selección sin nuevas categorías. |
| SHOP estabilidad | Filas reservadas para título, descripción, variantes y acción. Encaje 3D calculado desde el rectángulo de preview; escala por categoría/formato, independiente del saldo o mensaje de compra. | Rectángulos exactamente iguales para BUY, EQUIP, EQUIPPED e INSUFFICIENT FUNDS. Canvas e instancia del piloto retenidos al navegar productos; transforms estables con reduced motion. |
| LANDED | Se retiraron marco multicapa, cuadrícula y divisores del ledger; mayor avión SVG, separación corta al texto. Retiradas frases de crédito monetario/«Capital secured»; se conservan logros reales. | Resultado 1.657.500, desglose y saldo acreditado exactos; controles visibles. |

## Pruebas realizadas

- `npm run build`: TypeScript y Vite correctos. Se mantiene el aviso existente de tamaño del chunk Three; no se agregaron dependencias.
- `npm test -- --run tests/shop.test.ts tests/economy.test.ts`: **11/11**.
- `tests/browser/ui40.spec.ts`: **8 casos distintos aprobados** (4 por motor), con ejecución adicional de confirmación tras corregir la especificidad CSS del SVG de pausa.
- Chromium/Pixel 7 y WebKit/iPhone 13, en **390×844, 360×640, 412×915, 844×390 y 1440×900**.
- Compra de Horse y Lagoon: 3.000.000 → 250.000 SOL, propiedad/equipamiento persistidos después de reload; navegación sin compra no modifica el equipamiento.
- Cierre con simulación determinista real, semilla 17, ruta Jurerê: 1.657.500 SOL, reflejados en resultados y saldo. Para acelerar QA se avanza la simulación hasta el final; no es una partida humana completa.
- Reduced motion: sin movimiento ambiental del logo; navegación conserva canvas, instancia y transforms del piloto.
- Se inspeccionaron visualmente capturas de menú, SHOP, HUD y LANDED, incluyendo móvil pequeño y horizontal. Videos de las interacciones y matriz completa quedan locales en `final/` y `confirmation/`.

## Evidencia

- [Menú anterior](preview/menu-before.png) → [Menú iPhone 13](preview/menu-iphone13.png).
- [SHOP anterior](preview/shop-before.png) → [SHOP iPhone 13](preview/shop-iphone13.png).
- Créditos desplazados, móvil pequeño y paracaídas: capturas adicionales locales en `final/`.
- [Chatlog](preview/hud.png), [LANDED](preview/landed-iphone13.png).

## Pendientes reales / siguiente iteración

- Validación en iPhone y Android **físicos** pendiente; emulación no equivale a dispositivos reales ni mide su rendimiento.
- La API se respondió con 503 en QA para aislar presentación y persistencia local; no se certifica aceptación de rankings en producción con estas pruebas.
- No se modificaron reglas, precios, objetivos, colisiones, isla ni backend. No se añadieron categorías de Tanda 7 ni se inició la siguiente tanda.
- `identity-portraits.json` contiene base64 de los originales de `public/assets/perks`; si esos originales cambian, regenerar ese mapa en el mismo orden de `perks.json`.
