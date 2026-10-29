# RUNWAY — registro de alcance y continuidad

## Actualización más reciente — Tanda 5/5, island-29

Ver [cambios, capturas y métricas](tanda-5-island29.md). Puente unido a costa y prolongado hacia la niebla, terreno con normales continuas y mezcla procedural, pasto distribuido con límite de 256 matas visibles, copas lejanas mejoradas y decoración apoyada en la malla real. Reglas, recorridos, API y zonas físicas sin cambios. Cuatro pruebas focalizadas aprobadas y vuelo WebKit completo hasta Jurerê. Pendientes: rendimiento en teléfonos físicos y fotografías/arquitectura reales. La cifra de FPS emulada no acredita un móvil real. No iniciar otra tanda automáticamente.

## Registro anterior — Tanda 4/5, hud-27

Ver [implementación, evidencia y pendientes](tanda-4-hud27.md). HUD financiero ancho, rachas progresivas, YOU LANDED y resultados neón con datos reales, encuadre final adaptativo, menú con identidad y PNG oficial, MY STARTUP clarificado y créditos con logo original. 5 unitarias + 8 pruebas Chromium/WebKit aprobadas. Pruebas físicas y acciones de startup contra API real siguen pendientes. Publicado hud-27 (versión 28), menú/créditos comprobados en la URL pública; conservar npc-26 como rollback. Detenerse aquí: no iniciar tanda 5.

## Registro anterior — Tanda 3/5, npc-26

Ver [implementación, pruebas y pendientes de NPC/tutorial](tanda-3-npc26.md). Cerrados en los navegadores probados: entrada y regreso cinematográficos, primer plano LED, tutorial y SHOP coordinados, expresiones contextuales, voz digital original temporal y hologramas de modelos reales. Música, tienda y gameplay se conservan. Pendientes: sonidos definitivos y validación audiovisual en teléfonos físicos. Publicado `npc-26` el 20-10-2026 con autorización explícita; tutorial y SHOP comprobados en la URL pública. Ver registro de despliegue. No iniciar la siguiente tanda automáticamente.

## Registro anterior — Tanda 1/5, flight-25

Ver [registro y evidencia de esta tanda](tanda-1-flight25.md). Implementados y comprobados en Chromium/WebKit: encuadre/luz de cabina, semáforo sobre estructura fija, salto con carga e impulso, reinicio con fundido, caída terminal con ragdoll procedural, reacción contra edificios, joystick independiente del refresco HUD, picada de estrella, apertura y desprendimiento persistente del canopy. El imán existente fue comprobado y se mejoró su lectura visual.

Los estados PENDIENTE/PARCIAL de esos puntos en la auditoría histórica de abajo describen la base anterior; quedan sustituidos por el registro flight-25. Tienda, economía, rutas, API y personalización se conservan.

Pendientes: prueba táctil/física en iPhone y Android, valoración artística humana y requerimientos de otras tandas (incluidos puente y tipografía). No iniciar automáticamente la tanda 2: el usuario pidió detenerse al terminar esta tanda.

Actualizado: 20-10-2026. Base auditada: `motion-23`, commit `3afa682c5c705cac31fb4aaea077a8e85ef658e6`. La inspección del código no equivale a validación visual. Este registro sustituye cualquier inferencia de que la lista posterior a motion-23 ya estaba terminada.

## Lista original de la iteración solicitada después de motion-23

| Requerimiento | Estado antes de esta pasada | Evidencia / cierre requerido |
|---|---|---|
| Cámara e iluminación interior | PARCIAL | Cámara y dos point lights existentes. Falta nueva dirección del encuadre e inspección visual solicitada. |
| Semáforo flotante al abrir compuerta | PENDIENTE | `Aircraft`: señales independientes en ±2,4 / 3,4 / 0,5; no se corrigió su montaje sobre pared. |
| Mejorar salto | PARCIAL | Rig/clip exit y reloj común existen; el usuario pide más calidad. No equivale a terminado por tener un clip. |
| Derrota aérea y golpe de edificio tipo ragdoll | PENDIENTE | `PilotBody` deriva a land/idle ante cualquier outcome. Falta caída articulada, encuadre y respuesta a edificio. |
| Puente: ubicación, longitud, rotación y fog | PENDIENTE | Geometría antigua de 180 unidades en x=-104. Sin ajuste de implantación solicitado. |
| Apertura del paracaídas | PARCIAL | Inflación, resortes y anclajes existen; no está cerrada la nueva coreografía solicitada. |
| Reflejos en traje | PARCIAL | Tres materiales existentes; tela con roughness .76. En esta pasada se ajusta respuesta al entorno; requiere revisión visual. |
| Skins compradas al NPC usando saldo acumulado | PENDIENTE | No había banco, transacciones ni tienda. Solo desbloqueo por comunidad. |
| Precios y objetivos especiales para skins | PENDIENTE | El umbral por comunidad no cubría este pedido. |
| Comprar colores de canopy y rastro | PENDIENTE | Nebula canopy era un rare; no existían catálogo, compras ni rastro personal. |
| AIRPORT → SHOP en menú | PENDIENTE | El botón seguía abriendo la cuadrícula anterior. BACK TO AIRPORT fuera del menú sigue siendo correcto. |
| Picada durante impulso de estrella | PENDIENTE | Boost físico existe; pitch visual responde a input/accel, no al boost. |
| Carrusel 3D de skins | PENDIENTE | Cuadrícula de tarjetas; un solo piloto mostrado. |
| Saldo gastable en menú | PENDIENTE | Solo capital por run/PB. |
| Cambiar tipografía general | PENDIENTE | Rajdhani y Space originales. No se cambió todavía. |

## Alcance anterior: plan Movimiento / cinematografía / feedback

| Sistema | Estado y límite |
|---|---|
| Reloj compartido, pausa, captura de eventos | IMPLEMENTADO y verificado en motion-23: pruebas de pausa en siete hitos y eventos del mismo tick. |
| Idle, preparación, carrera, salida, caída, apertura, aterrizaje | PARCIAL en acabado: clips y overlays implementados, vídeos previos existentes; calidad y casos de derrota siguen abiertos por feedback del usuario. |
| Cámara 66°/38°, encuadre, órbita de llegada | IMPLEMENTADO en condiciones probadas en motion-23; nueva dirección interior y derrotas no resueltas. |
| Contador elástico, pérdidas, SOL expulsadas, gráfico 10 s, feed de dos líneas | IMPLEMENTADO con pruebas de datos y navegador anteriores. Sin cambios de reglas en esta pasada. |
| Motion UI, tutorial, simplificación HUD, AIRPORT | IMPLEMENTADO previamente; SHOP reemplaza ahora solo el acceso solicitado. |
| Suelo, 96 árboles, pasto, 64 residentes, grupo provisional Jurerê | IMPLEMENTADO previamente con capturas y distribución comprobada. Calidad artística no certificada como equivalente a referencias. |
| Música y efectos existentes | Conservados. Nuevos sonidos pendientes de archivos; la lista de búsqueda no es integración. |
| QA físico y cinco testers | PENDIENTE. Emulación no sustituye iPhone/Android reales. |

## Orden de bloques pendientes

1. **Bloque funcional de esta pasada:** banco local → liquidación idempotente → catálogo/objetivos → compras/equipamiento → NPC/carrusel y previews → aplicación en vuelo. Es una funcionalidad completa ausente y no necesita rehacer física/backend.
2. **Siguiente bloque prioritario:** derrota aérea/impacto en edificio y picada de boost; comparten pose, transición y cámara. Después salida y apertura: validar coreografía con vídeo, no solo tests.
3. **Presentación del avión y mundo:** cámara/luz, montaje de señal y puente hacia fog. Revisar contra geometría real.
4. **Tipografía general:** sustituir fuentes con licencia y comprobar HUD/menú/resultados tras fijar contenido de tienda.
5. **Materiales de audio futuros y QA físico:** requieren archivos/dispositivos, no declararlos terminados.

## Decisiones del bloque tienda

- SOL ficticia, saldo cosmético local separado de capital/score/ranking. Sin wallet ni dinero real.
- Se acredita el capital final de aterrizajes exitosos desde esta versión; derrotas y abandonos no acreditan. Cada run tiene recibo único.
- No se reconstruye una suma histórica desde el PB: no existe historial completo fiable para hacerlo. Se conservan todos los pilotos/cosméticos antes desbloqueados.
- Nuevos perfiles: Dragon inicial. Compra de otros pilotos entre 2M y 10M; tres objetivos: Jurerê, aterrizaje sin golpes, dos secuencias en una run exitosa. Colores: 750k–2,5M. Precios iniciales, pendientes de balance humano.
- Vista previa no equipa; comprar/equipar sí. Créditos y compras usan bloqueo de navegador y escritura antes de confirmar.
- Saldo/propiedad no sincronizados entre dispositivos; borrar almacenamiento los elimina. No se presentan como una cuenta backend.

## Cierre de esta pasada

Versión frontend: **shop-24**. Bloque prioritario implementado: tienda cosmética local completa. API, reglas competitivas, rutas, colisiones, música e históricos conservados.

| Requerimiento cerrado en esta pasada | Estado final y prueba |
|---|---|
| NPC / compra de skins | IMPLEMENTADO y verificado. Diálogo del tripulante, catálogo, compra, equipamiento, saldo insuficiente y propiedad persistente. |
| Precios / skins por objetivos | IMPLEMENTADO. 2–10M; Jurerê, sin golpes y dos secuencias. Reglas automatizadas; balance de precios humano PENDIENTE. |
| Colores de paracaídas y rastro | IMPLEMENTADO y verificado en preview y vuelo completo. Cuatro variantes por categoría; tres comprables. |
| Carrusel 3D | IMPLEMENTADO: tres pilotos articulados, deslizamiento, flechas y teclado; preview no gasta ni equipa. Veinte cambios mantienen canvas y no descargan GLB de nuevo. |
| SHOP y saldo en menú | IMPLEMENTADO. Capital final de aterrizajes exitosos acreditado una vez, disponible al volver. |
| Reflejos de traje | PARCIAL: tela, herrajes y goma responden de forma diferenciada; inspección visual y material comprobados. No se declara terminado el rediseño artístico del personaje. |

### Validación focalizada

- **11 pruebas unitarias**: liquidación por run, duplicados, derrotas, objetivos, migración, compras y canopy. TypeScript y diff sin errores.
- **6 casos de navegador aprobados**: tres casos en Chromium y WebKit; flujo de tienda, vuelo equipado completo y rechazo de doble gasto/almacenamiento fallido. El gesto de arrastre y teclado se verificó en la última repetición del caso de tienda.
- Cinco replays reales acreditaron **8.512.500**; compras de 2M + 750k + 1,5M dejaron **4.262.500**. Repetir cada liquidación no duplicó saldo.
- Vuelo a velocidad real con seed 17: final **1.755.000**, banco inicial 1.250.000 → **3.005.000**, mismo resultado en ambos navegadores. Pausa/reanudación mantuvo colores y rastro.
- Máximo observado en esos vuelos: **54 draw calls / 78.663 triángulos**. Es medición de render emulado, no certificación de rendimiento físico sostenido.
- Capturas revisadas en portrait, móvil pequeño, horizontal y desktop. Se corrigió el canopy cortado y la superposición del diálogo durante el desarrollo.
- [Resultados estructurados](evidence-shop24/verified-tests.json), [carrusel](evidence-shop24/shop-pilot.png), [paracaídas](evidence-shop24/shop-canopy.png), [horizontal](evidence-shop24/shop-844.png), [cosméticos en vuelo](evidence-shop24/equipped-flight.png), [vídeo completo](evidence-shop24/equipped-flight.webm).
- QA limitado a estos cambios. No se revalidaron como terminados los otros pedidos por pasar esta suite. iPhone/Android físicos y balance con personas siguen PENDIENTES.

### Próxima iteración, sin repetir esta auditoría

Prioridad: derrota aérea / golpe contra edificio + pose de impulso; luego coreografía de salida y apertura. Después cámara/luz interior, semáforo y puente; finalmente tipografía. Conservar banco/catálogo/carousel y verificar solo sus posibles regresiones cuando otro bloque los toque.

### Publicación y rollback

Frontend shop-24 preparado para el Site público existente. Rollback: motion-23, commit `3afa682c5c705cac31fb4aaea077a8e85ef658e6`, versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_e7fc10397a448191af049bd421bc1bd5`; API sin cambios. La confirmación del despliegue queda en la entrega de esta conversación.

## cloud-30
Original cloud curtain, LANDED banner and favicon integrated; duplicate home pilot strip removed; BACK TO PLANE and removal of local-flight copy completed. Full flight/replay/return tested in WebKit and Chromium mobile emulation; cold-loading/reduced-motion landscape passed both. Details and evidence: reports/cloud30.md. Physical mobile validation pending.

## cloud-31
Home PLAY no longer shows clouds. Slower ease-in-out and real scene/UI readiness before opening. Full mobile-emulated flows and deliberately delayed GPU preparation passed Chromium/WebKit. See reports/cloud31.md.

## light-32 — Phase 2 only
Continuous prefiltered cabin/sky reflections; darker localized cabin illumination; stronger existing shadows/contact; distinct cloth, rubber, hardware, alloy and LED materials; restrained bloom. Build, continuity unit test, Chromium/WebKit mobile-emulated visual checks and complete WebKit flight passed. Max 54 calls / 80,759 triangles. Physical mobile sustained testing pending. Evidence and limitations: reports/lighting32.md. No next phase started.

## art-33 — Siete correcciones gráficas
Hombros deformables en fuente Blender/GLB; reflejos y bloom sin retícula; capa especular de traje validada con ablation; entrada de luz ligada a compuerta; exterior y estrellas ópticas; cámara de menú ligeramente baja/lejana; fase LED persistente al pulsar PLAY. Build, 3 unit tests, Chromium/WebKit y vuelos completos aprobados. Máximo 55 calls / 81.369 triángulos. Evidencia, causas y límites: reports/art33.md. Dispositivos físicos pendientes. No iniciar otra fase automáticamente.

## items-34 — Fase 4 solamente
Ocho modelos remodelados desde las referencias: Gas Fee, Delivery, Water, Magnet, Term Sheet, Hacked, Rug Pull y Community. Materiales por vértice y atlas compartido, mismas geometrías en tutorial/gameplay. Aros con 24 fragmentos instanciados y trails con pool de 192 partículas, colores comprados preservados. Cuatro pruebas unitarias y seis escenarios Chromium/WebKit aprobados; vuelos con saldo y eventos iguales al replay. Inventario, evidencia, métricas y límites: reports/items34/README.md y inventory.csv. Pendientes: referencias de objetos restantes y rendimiento sostenido en dispositivos físicos. No avanzar a otra fase automáticamente.
