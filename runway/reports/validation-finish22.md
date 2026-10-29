# RUNWAY finish-22 — presentación y continuidad

19 de octubre de 2026. Continuación de `routes-21`; mismas reglas `runway-3.0.0-routes` y contenido `island-routes-8`. El núcleo compartido no cambia y conserva identidad byte a byte con `services/runway-api/lib/simulation.ts`. Solo se publica frontend.

## Causas corregidas

- El canvas tenía antialiasing, pero la escena se dibujaba primero en un render target sin muestras. El target HDR ahora usa hasta 2 muestras MSAA; se conserva el límite de DPR y el bloom a un cuarto de resolución. No se añade un pase de escena ni biblioteca.
- El horizonte cálido se reutilizaba como color de fog para toda la isla. La bruma vuelve al azul tropical, el horizonte conserva amarillo/rosa y las nubes retienen volumen bajo la atmósfera. El agua recibe ondas y reflejos finos sin la trama rectilínea de la primera prueba.
- El sol quedaba fuera del campo de visión del planeo. Una proyección descentrada reserva más espacio al recorrido sin cambiar el picado físico; sol, luz, agua, entorno reflectante y flare comparten dirección. El flare tiene proporciones según pantalla y menor intensidad periférica.
- Tras recoger, los objetos se agrandaban y seguían al piloto durante 420 ms. Ahora se contraen durante 220 ms. La moneda recupera emisión cálida; su aura positiva sigue verde. Corrientes representadas con trazos curvos ascendentes en lugar de conos.
- La cámara final miraba al suelo para reservar espacio al panel. Ahora encuadra al piloto y entorno costero, lo orienta hacia cámara y reserva espacio mediante proyección, con composición distinta en horizontal. Los carteles de navegación desaparecen al aterrizar para no cruzar el casco.
- El panel final cambiaba de altura al pasar del replay a totales. Ambos comparten un espacio fijo; gráfico, contador y eventos conservan el reloj de dos segundos. Hangar y retry están disponibles durante la reproducción. No se reintroducen rankings en resultados.
- Las mediciones de encuadre de QA usaban ocasionalmente la matriz de cámara anterior. Se actualiza antes de proyectar; se excluye geometría invisible y la medición de vértices se limita a cinco veces por segundo. Esto no altera la simulación.

## Evidencia y alcance

Comparaciones locales: [caída antes](evidence-polish22/before-fall.png) / [después](evidence-polish22/after-fall.png), [planeo antes](evidence-polish22/before-glide.png) / [después](evidence-polish22/after-glide.png). Semilla 17, estados generados con el controlador real de pruebas. La caída conserva encuadre; en planeo y cierre el cambio de cámara es intencional. Estas capturas congelan el estado y no equivalen a una partida humana.

Las pruebas de `tests/browser/presentation.spec.ts` reproducen playa, terraza, Jurerê y agua, y comprueban piloto visible, separación del panel y botones dentro de pantalla en 390×844, 360×740, 844×390 y 1440×900. La comparación de altura del panel excluye su animación inicial de entrada. WebKit requiere tolerancia subpíxel al comparar el viewport.

## Resultado de las comprobaciones

- 45 pruebas unitarias aprobadas; TypeScript y build Vite aprobados.
- Suite final: 10/10 pruebas Playwright aprobadas en Chromium y WebKit. Incluye tutorial inicial/repetido, continuidad musical, veinte navegaciones de hangar, doce colores NFT, recuperación de GLB fallido, preparación de moneda con caché fría, guía y créditos.
- Presentación: prueba adicional aprobada en ambos navegadores, con cuatro desenlaces × cuatro formatos. Capturas de [Jurerê horizontal](evidence-polish22/verified-jurere-844-webkit.png), [playa](evidence-polish22/verified-beach-390-webkit.png), [terraza](evidence-polish22/verified-terrace-390-webkit.png) y [agua](evidence-polish22/verified-water-390-webkit.png).
- Partidas completas a velocidad real, controladas automáticamente: Chromium 55,03 s / 1.845.000; WebKit 53,42 s / 1.616.250. Son semillas y entradas de controlador diferentes, no una comparación de equivalencia de replay. La simulación compartida no cambió.
- Máximos registrados durante esas partidas: 48 draw calls; 81.655 triángulos en Chromium y 83.433 en WebKit, dentro de los presupuestos de 70 / 90.000. No son mediciones de FPS en teléfonos físicos.
- Salida: distancia piloto/cámara entre 3,91 y 5,02 unidades en las muestras de WebKit; picado final 66,015°. Tamaño del piloto de 31,34% del alto en los cinco formatos comprobados; variación inferior a 0,001 puntos porcentuales.
- Veinte reintentos por navegador: máximo 416 ms en Chromium y 331 ms en WebKit. Sin reconstruir canvas ni repetir descargas del modelo al cambiar piloto.
- MSAA de 2 muestras y proyección visible del sol/flare comprobados durante planeo. Capturas finales de [planeo](evidence-polish22/verified-canopy-webkit.png) y [resultado real](evidence-polish22/verified-results-webkit.png).
- La validación automatizada de economía de 600 recorridos pertenece a `routes-21`; no se repitió ni se presenta como una nueva muestra de esta iteración.

## Límites

No se ejecutaron pruebas con iPhone/Android físicos ni cinco testers humanos. La emulación y las capturas no sustituyen esas comprobaciones. El acabado sigue siendo una interpretación del lenguaje de las referencias, no una reproducción equivalente a sus renders.

## Rollback

Frontend anterior: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_494f2be716808191816bb569f58efcb8`, commit `a86f16320e1ef2145370afc8c1fffc453c56ee3c`.
API compatible, sin cambios: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_84e8102324608191bf05d6846a9832fc`.
