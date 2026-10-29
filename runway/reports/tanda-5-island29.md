# RUNWAY — Tanda 5: isla y entorno

## Implementado

- **Puente:** reemplaza la pieza aislada en x=-104. Acceso en (35,3), orientación hacia el lado continental de la cartografía rotada, 7,2 unidades de ancho y prolongación de 1.400 unidades. Tramo suspendido cercano, viaducto simplificado a distancia y desvanecimiento por cobertura entre 180 y 690 unidades. Conserva profundidad, sin ordenar capas transparentes. Camino de acceso integrado en el shader del suelo; no añade una superficie que pueda atravesar el terreno. Es una interpretación estilizada, no una reconstrucción topográfica exacta.
- **Terreno:** mismas posiciones de vértices y superficies físicas. Normales continuas, mezcla de arena/pasto/roca por costa y pendiente, variación procedural en varias escalas y rugosidad/microrrelieve visual. Los caminos existentes mantienen su lectura.
- **Vegetación:** aproximadamente 1.200 ubicaciones elegibles distribuidas por la isla; solo las 256 más cercanas dentro del frustum se dibujan. Desvanecimiento de altura entre 75–140 unidades; viento anclado a la base y movimiento reducido respetado. Continúan 96 árboles y máximo 24 modelos de detalle cercano. Mejoradas las siluetas de las palmeras lejanas.
- **Apoyos:** árbol y pasto toman altura de los triángulos renderizados, evitando el desfase con la función analítica entre vértices. Despejados playas, caminos, acceso del puente, aterrizajes, edificios y espacios de cámara.
- **Lugar real:** se conserva `jurere-event-venue / replaceable-venue-visuals`, con unidades en metros, +Y arriba y +Z hacia la aproximación, separado de la plataforma funcional. `DESTINATIONS` sigue fijando los tres orígenes y superficies. No se agregó una casa ni arquitectura supuestamente real.

## Verificación

- `vitest run tests/island29.test.ts tests/habitat.test.ts`: **4 pruebas aprobadas**. Conexión sobre tierra, extremo más allá de la niebla, geometría del puente <4.000 triángulos, decoración fuera de áreas excluidas y altura contrastada con raycasting. Tres rutas con input/replay normal llegan a sus destinos sin cruzar el volumen del puente.
- Vuelo completo WebKit, iPhone 13 emulado: **54,5 s**, Jurerê, **1.755.000** de capital, sin errores de JavaScript/shaders. Máximo registrado durante esta pasada: **54 draw calls / 80.771 triángulos**, incluidos pases. El último ajuste del acceso eliminó 12 triángulos y trasladó su apariencia al material.
- [Vídeo completo](evidence-island29/flight.webm), [resultado y métricas](evidence-island29/flight-evidence.json), [aterrizaje](evidence-island29/jurere-landed.png).
- Capturas con seed 17/input idéntico a 40, 48 y 54 segundos. [Antes](evidence-island29/before-chromium-island.png) y [después](evidence-island29/accepted-chromium-island.png), en Chromium 390×844. Geometría final inspeccionada además en WebKit.
- WebKit móvil emulado, GPU del host: mediana **17 ms**, P95 **18 ms** en las ventanas de 180 frames de aproximación, isla y aterrizaje. Vuelo completo aproximadamente 60 FPS tras la carga. No son mediciones de un iPhone físico.
- Chromium en el modo headless usado por el capturador: base 108–117 ms de mediana; después 108–133 ms. No alcanza el objetivo móvil en ese entorno y no se presenta como aprobación de rendimiento físico. Draw calls de las vistas: 39–50, sin aumento frente a base; geometría adicional acotada a unos pocos miles de triángulos.
- El inspector WebKit registró una advertencia `ResizeObserver loop completed with undelivered notifications` al cambiar el viewport. Las capturas se produjeron y el vuelo completo pasó sin ese error. No se modificó UI fuera de esta tanda para perseguir esa advertencia.
- TypeScript/Vite y `git diff --check` verificados. Sin modificaciones en `src/core`, reglas competitivas, endpoints, economía, velocidades ni controles.

## Evidencia final y reproducción

- [Puente conectado](evidence-island29/release-webkit-bridge-access-lit.png)
- [Puente hacia la niebla](evidence-island29/release-webkit-bridge-distance-lit.png)
- [Pasto cercano](evidence-island29/detail-webkit-grass-near-lit.png)
- [Vista general](evidence-island29/release-webkit-overview-lit.png)
- `node scripts/qa-island29.mjs release webkit`: capturas y JSON contra Vite en 127.0.0.1:5183.
- `RUNWAY_BASE_URL=http://127.0.0.1:5183 node node_modules/@playwright/test/cli.js test tests/browser/island29.spec.ts --project=webkit-mobile --workers=1`.

## Pendiente / límites

- iPhone y Android físicos, diez minutos sostenidos, y valoración humana del acabado.
- Fotografías reales de zonas/arquitectura, referencias definitivas de objetos y audio: siguen pendientes; no se sustituyeron por contenido inventado.
- Los shaders refinan la presentación del relieve; no añaden relieve físico ni cambian dónde se aterriza.

## Publicación

Frontend island-29 en el Site existente, API intacta. Rollback: menu-28, versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_6f7c97c91da481918f2a8743e9140f59`, commit `be7869137c25186fc41d60b3f8aa08150151eb04`.

Publicado el 20-10-2026: versión 30, `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_c561bc902e2c8191946678ac5e96a1ba`, commit `39fcec7e9245e23b7fc693b4e2992a3f75fb3d82`. Despliegue `appgdep_6ad7b176ae9481918604da75ea13b3e5`: succeeded. URL pública https://runway-islanddao.agenciahumanfriendly.chatgpt.site/ .
