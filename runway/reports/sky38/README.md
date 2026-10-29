# SKY-38 — Tanda 2/7: cielo, nubes y aterrizaje

Implementación y validación: 21 de octubre de 2026. Alcance cerrado a atmósfera, nubes, cámara de aterrizaje e idle posterior. No modifica economía, generación de ítems, controles, física, destinos, API ni reglas competitivas.

## Causas y cambios implementados

| Sistema | Causa comprobada | Cambio |
| --- | --- | --- |
| Profundidad del cielo | La distribución anterior se concentraba alrededor del recorrido; el fog exterior corto ocultaba el fondo. | Campo determinista de tres escalas: 64 lóbulos próximos, 128 de bancos intermedios y 120 billboards lejanos con ocho siluetas. Bancos debajo del avión y cobertura alrededor de todo el horizonte, hasta aproximadamente 2.100 unidades. Posiciones fijas, culling con margen, tres draw calls y atlas compartido. |
| Salida de las nubes | Existía adaptación para la compuerta, pero no una envolvente común para salida de tormenta, fog y apertura. | `atmosphere.ts` usa el mismo reloj de recorrido para inmersión, despeje, exposición, bloom y velo cálido. Recupera sus valores normales después del despliegue. Reutiliza el postprocesado existente, sin pases adicionales. Pausa congela la transición; movimiento reducido atenúa el efecto. |
| Cámara final | Se comprobaban edificios, pero no la superficie triangulada visible. La órbita podía cruzar pilares o quedar elevada y estática. | Se consulta el terreno real y las plataformas, con margen para cámara/near plane. Se selecciona una trayectoria completa libre de edificios: acercamiento, giro de hasta 120° y alejamiento para resultados. Parte de la pose real de llegada y adapta distancia/encuadre al panel. |
| Piloto después de aterrizar | La celebración se quedaba fijada en su último fotograma. | Celebración única seguida del idle existente con respiración y cambios de apoyo. Se conservan rig, clips y mezcla de animaciones. El giro complementario termina mostrando el rostro. |

Durante la revisión se descartaron bancos demasiado angulosos y un atlas que producía anillos visibles. También se corrigió la selección de órbita al probar la posición efectiva de llegada a Jurerê, desplazada del centro de la plataforma. La evidencia `final/` corresponde a esas correcciones completas.

## Pruebas realizadas

- TypeScript: `npx tsc --noEmit` sin errores.
- `npx vitest run tests/sky38.test.ts tests/camera.test.ts`: **6/6**. Cobertura determinista en ocho sectores, variantes, presupuesto geométrico, recuperación de exposición, movimiento reducido y trayectorias sobre terreno real en 15 posiciones de aterrizaje y cuatro distancias finales.
- `SKY_ASSERT=1 RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/sky38.spec.mjs --workers=1 --output=reports/sky38/final`: **10/10**, Chromium y WebKit.
- Vuelo completo en tiempo real, semilla 17, controlador cuantizado de QA. Ambos motores aterrizan en Jurerê con **1.657.500**, el mismo resultado que la base. Estado final idéntico al replay de la simulación compartida. Ningún error de página en las pruebas.
- Cámara en Pixel 7 emulado (412×839), iPhone 13 emulado (390×664), móvil pequeño (320×568), horizontal (844×390) y desktop (1440×900). Los tres destinos pasan; las pruebas de formatos adelantan la simulación hasta la aproximación y luego ejecutan el render y aterrizaje reales.
- Las cuatro orientaciones de cámara fuera del avión muestran nubes intermedias y lejanas. Mínimos observados por orientación: **12 lóbulos intermedios y 13 billboards**, también fuera del corredor central.
- El personaje completo queda dentro del viewport final, con rostro orientado a cámara e idle activo. Se registran transformaciones de rodilla distintas después de la celebración. Separación mínima respecto del terreno en los escenarios de formatos: **3,46 unidades**. Las comprobaciones de rayos y terreno validan también el recorrido de la órbita.
- Revisadas capturas de apertura, capa desde arriba, inmersión, salida iluminada y aterrizaje. Grabaciones continuas disponibles. Fotogramas extraídos del vídeo muestran recuperación del contraste y continuidad hasta resultados.
- No se ejecutó un nuevo replay remoto contra la API: esta tanda no altera el núcleo compartido ni el servidor. Los tests de navegador usan una respuesta API 503 controlada para ejecutar una partida local reproducible.

## Rendimiento observado

Intervalos entre frames medidos con `requestAnimationFrame` durante el vuelo y el cierre, con grabación y capturas activas. Son medidas del equipo anfitrión con emulación de viewport; **no son tiempos GPU aislados ni certifican rendimiento de un teléfono**. Draw calls y triángulos incluyen los pases registrados por el renderer.

| Ejecución | Mediana | P95 | Máximo draw calls | Máximo triángulos |
| --- | ---: | ---: | ---: | ---: |
| Base gameplay-37 / Chromium | 8,3 ms | 9,0 ms | 56 | 82.573 |
| sky-38 / Chromium | 8,3 ms | 9,1 ms | 57 | 79.539 |
| sky-38 / WebKit | 17,0 ms | 20,0 ms | 57 | 79.695 |

Los escenarios comprobados permanecen debajo de 70 draw calls y 90.000 triángulos. La reducción del máximo geométrico proviene del cambio de distribución/culling, no de reducir el detalle de la isla. No se obtuvo una base WebKit anterior para comparar su delta.

## Evidencia

- Capturas representativas versionadas: [cielo anterior](preview/clouds-before.png), [cielo final](preview/clouds-after.png), [revelación de la isla](preview/reveal.png), [aterrizaje final](preview/landing.png).
- Las carpetas completas `before/` y `final/`, vídeos y telemetría se conservan en este workspace, fuera de Git por el límite de tamaño del servidor de publicación. El comparador y los enlaces siguientes funcionan con esa evidencia local.
- [Resumen numérico](summary.json), con métricas originales por escenario en `before/` y `final/`.
- [Comparador visual y vídeos](comparison.html).
- [Vuelo anterior, Chromium](before/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-chromium-mobile/video.webm).
- [Vuelo final, Chromium](final/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-chromium-mobile/video.webm).
- [Vuelo final, WebKit](final/sky38-sky-deck-cloud-exit--73daf-ng-on-the-real-flight-clock-webkit-mobile/video.webm).

Las capturas usan la misma semilla, controlador y umbrales de tiempo; el instante de captura puede diferir algunos frames, especialmente en el contador animado. No representan una muestra de jugadores humanos.

## Pendiente real y publicación

- Pruebas en iPhone y Android físicos y sesiones sostenidas de diez minutos: **pendientes**, dispositivos no disponibles.
- No se avanzó a otra tanda. No se añadieron mecánicas, bibliotecas, audio, arquitectura ni assets externos.
- Frontend identificado como `sky-38`; publicación registrada separadamente en `publication.json` después del despliegue.
- Rollback: frontend `gameplay-37`, commit `06a89d97192a671ff9817d37cc5550ed97887e70`, Sites versión 38 (`appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_7b8ace185e74819197f43e04fb9cc88e`). API conservada: versión 19, commit `2c119322b84673921c3d9d743847f0f1730ea0fe`, reglas `runway-3.2.0-chains`, contenido `island-routes-10`.
