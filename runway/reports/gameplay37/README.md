# RUNWAY — Tanda 1/7: Gameplay & Controls

Release `gameplay-37`. Solo esta tanda. Reglas `runway-3.2.0-chains`; contenido `island-routes-10`. API y cliente comparten el mismo archivo de simulación. No cambian importes, velocidades, destinos, lift, colliders, música ni personalización.

## IMPLEMENTADO

- **Aros:** máquina de estados `active → completed / failed`, con índice siguiente y tick de activación. Solo el aro activo participa en render, rótulos y contactos. Al fallar se cierra esa cadena, se emite un único `sequence-missed` y no se concede premio; otra cadena sigue disponible. Los contactos duplicados son idempotentes. Aparición de 260 ms en el reloj fijo, detenida en pausa. Atlas de rótulos ampliado hasta 6/6.
- **Longitudes y alcance:** cadenas de 3, 4 y 6 aros en caída, permutadas según semilla; dos cadenas de 3 en planeo. Espaciado de caída de ~0,88 s nominal / ~0,71 s bajo impulso máximo; desplazamientos entre centros de 1,3 unidades. En planeo, separación longitudinal de 23 y lateral de 4 unidades. Premio de 100.000 exclusivamente al completar cada cadena.
- **Desintegración:** reutilizada y verificada la implementación existente de 24 segmentos con expansión radial, giro y fade de 720 ms. El siguiente aro se anima mientras los restos del anterior se disipan; los restos no tienen collider ni conceden dinero.
- **SOL adherida:** no era un problema de parenting. La persecución exponencial a 14/s conservaba un retraso estable mayor que el radio de contacto durante caída. Ahora la velocidad de atracción supera la del piloto en 20 unidades/s y converge en tiempo finito. Una moneda ya atraída puede completar su recorrido al pasar a paracaídas. Se conserva la retirada visual de 220 ms después del único contacto.
- **Variedad:** pesos centralizados Delivery 4 / Gas 3 / Rug 2 / Hacked 0,6. Selección en orden de encuentro sin sólidos idénticos consecutivos; HACK tiene máximo 4 y separación mínima de tres selecciones. Probabilidad del encuentro secundario 55%. Clearance mínimo de un radio de cada sólido +1 unidad y protección de aperturas de aros. Se conservan los 128 SOL, las líneas de recogida, los ocho patrones y los tres caminos.
- **Controles:** preferencia persistente separada del modo efectivo. TILT por defecto cuando llegan sensores; joystick toma TOUCH inmediatamente y soltar/cancelar vuelve a TILT. PAUSE→TOUCH persiste. Recenter, calibración inicial/rotación/recuperación, zona muerta de 2° y filtro de 40 ms; respuesta táctil directa y perilla por frame, independiente del HUD. Permiso solicitado desde PLAY/TILT; rechazo, ausencia o caducidad de muestras dejan TOUCH disponible sin bloquear. Una promesa tardía de permiso no sobrescribe TOUCH manual.
- **Tutorial:** explica revelado secuencial, longitudes, cierre por fallo y prioridad de controles.
- **Inventario:** [CSV](item-inventory.csv). Todos los 12 tipos habilitados se observaron. `risk` mantiene geometría legacy, pero está inactivo y no se genera; no se reactivaron decisiones retiradas.

## PRUEBAS REALIZADAS

- 48 pruebas en 8 archivos sobre simulación, controles, replays, balance de rutas, contactos de ítems y presentación afectada; más 2 pruebas de informe/API y cadenas de planeo: **50 aprobadas**. Logs adjuntos.
- 120 recorridos aislados de cadenas de caída: 20 semillas × 3 cadenas × normal/impulso máximo sostenido. Las 120 completadas con exactamente un premio por cadena. Pruebas de fallo, recontacto, aparición y pausa.
- 1.000 semillas: generación reproducible, 128.000 SOL, 19.000 aros, 2.000 imanes, 1.000 Water y 18 Rare Cargo. HACK: **3,656 de media y 4 máximo**, frente a 18 fijos en el generador anterior. Pesos y conteos completos en [metrics.json](metrics.json).
- 100 partidas con controlador automatizado, distribuidas en playa/intermedia/Jurerê: **100 aterrizajes**, 34/33/33 en sus destinos. Comparación exacta de estado, eventos, contactos y saldo contra replay de la API; media de capital 1.474.495. Es evidencia automatizada, no balance humano. La prueba de planificación de render 30/60 FPS también coincide.
- Chromium Pixel 7 y WebKit iPhone 13 emulados: 3 casos por navegador aprobados: cadenas/fragmentos, partida completa/limpieza de monedas/replay, controles/permisos/fallback. Se verificó que nunca se dibujan dos aros ni rótulos activos de la misma cadena, y que el dinero solo cambia al completar. Límite de 70 draw calls comprobado en las cadenas.
- Eventos de orientación y permisos **simulados**. Puntero nativo sobre el joystick en ambos navegadores; touch emulado mediante CDP en Chromium. Sin errores de página en la prueba final de controles. Una primera prueba de WebKit usaba un constructor sintético que no transportaba los datos de orientación; se corrigió el fixture a eventos con campos explícitos y se repitió correctamente.
- Inspección visual de capturas de ambos navegadores. Se detectaron y corrigieron los rótulos de futuros aros que todavía aparecían independientemente de sus modelos. Grabaciones continuas guardadas en `final-browser/` (cadenas), `controls/` (controles) y `browser/` (partidas completas).
- Builds frontend/API completados. El núcleo del servidor es idéntico byte a byte al cliente. Los tests de semilla anterior que fijaban 4 aros y un saldo exacto se actualizaron a las reglas nuevas; se preservaron las verificaciones contables y de premios únicos.

### Reproducir

```sh
npm test -- tests/gameplay37.test.ts tests/controls37.test.ts tests/gameplay37-report.test.mjs tests/simulation.test.ts tests/canopy.test.ts tests/balance.test.ts tests/items34.test.ts tests/runtime.test.ts tests/storm.test.ts
RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/gameplay37.spec.ts
```

El informe de API requiere ejecutar antes `node ../services/runway-api/scripts/sync-core.mjs` en este checkout. Las cadenas aisladas del navegador eliminan los demás ítems para observar claramente el sistema; las partidas completas mantienen todos los ítems y usan input cuantizado normal.

## PARCIAL / PENDIENTE

- La integración de sensores está implementada y comprobada con eventos simulados; **pendiente validación física de permiso iOS, orientación/calibración y sensación táctil en iPhone/Android**. No se afirma QA física ni medición de latencia de hardware.
- No quedan funcionalidades de esta tanda deliberadamente postergadas. `risk` es contenido inactivo documentado, no un pickup pendiente. No se inició otra tanda.

## Compatibilidad y rollback

La versión de reglas separa nuevas marcas competitivas y PB. Identidad, startup, compras, saldo y resultados históricos conservan su almacenamiento y contratos. Las partidas antiguas pendientes siguen el tratamiento local existente ante incompatibilidad.

Rollback de la pareja previa:
- Frontend `sound-36`, commit `0f47cfdbb8049b0a098667e081b955e88cbd54cf`, Sites versión 37 (`appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_288628e602f48191b1513b548722f6f1`).
- API commit `43997f20637feecf358d73b9148d1235fbb97fc4`, Sites versión 18 (`appgprj_6acfed30efd88191aef688e5a181c299~appgver_16d5bb387fa081919a614427a7bccc7d`).
