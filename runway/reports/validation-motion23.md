# RUNWAY · motion-23

## Implementado

**Cinematografía.** El rig de 15 huesos ahora tiene poses articuladas y traslación de pelvis: idle de seis segundos, preparación, carrera con zancada de 2,7 unidades, salida, caída, apertura, absorción del contacto y celebración de una sola ejecución. Cabeza y cuerdas siguen anclajes del torso/manos. El casco usa una transformación del socket del pecho dentro del árbol del actor: se corrigió una desaparición detectada al pausar con el montaje mediante portal.

Cuerpo, cámara, canopy, LED, impactos y liquidación consumen el mismo reloj de presentación; pausa y background lo detienen. El cierre continúa cuando acaba la simulación. Se conserva el picado de 66° en caída y 38° en planeo. La cámara busca un arco de llegada libre de edificios, con alternativas más cortas; movimiento reducido elimina órbita y sacudidas.

**Feedback.** Cada evento tiene identidad de partida/índice, saldo, importe efectivo y origen de contacto. El contador responde con resorte limitado a 0,94–1,15×, magnitud y racha; un impacto conserva prioridad. El gráfico muestra diez segundos de saldos reales, incluidos eventos simultáneos y cero. Feed de dos líneas, agrupación exclusiva de SOL consecutivas hasta 100 ms. Desaparecen recordatorios repetidos; las secuencias se muestran únicamente mientras están en curso. Se incorporan entradas/salidas de paneles y respuesta de botones, con alternativa de movimiento reducido. Textos visibles: AIRPORT / BACK TO AIRPORT.

**Isla.** Material de suelo con variación por costa y pendiente, normales finas sin desplazar las superficies. 96 árboles en tres variantes, LOD cercano/lejano, hasta 256 matas de pasto cercanas y 64 habitantes con caminar, conversación o descanso; extremidades animadas en shader. Distribución determinista con zonas despejadas alrededor de rutas y aterrizajes. Jurerê tiene un grupo visual provisional reemplazable, en metros, Y arriba y +Z hacia la aproximación, separado de su plataforma física. No se creó una casa supuestamente real.

Se conserva música y efectos existentes. No hay bibliotecas, audio, endpoints, tablas, reglas económicas ni controles nuevos.

## Pruebas y evidencia

- **51 pruebas unitarias**, 12 archivos: replay, economía, rutas y presentación. Casos nuevos de ventanas financieras vacías, eventos del mismo tick, llegada a cero, agrupación del feed, origen de impactos y distribución ambiental.
- **18 escenarios de navegador** aprobados entre Chromium y WebKit, ejecutados por bloques y repetidos tras las correcciones: inicio, tutorial, veinte cambios de piloto, doce acentos NFT, música/interrupción/background, GLB fallido, recuperación gráfica, veinte retries, cámara, cuatro desenlaces, reloj compartido, feedback y movimiento reducido.
- Cinco formatos de cámara: 390×664, 393×852, 360×740, 844×390 y 1440×900. Tamaño del piloto en caída: aproximadamente **31,3%** del alto, variación medida inferior a 0,01 puntos porcentuales entre formatos para la misma pose. Salida: distancia aproximada **3,91–5,02 unidades**, sin el antiguo alejamiento de 20 unidades.
- Pausa comprobada durante preparación, carrera, salto, caída, inflación del canopy, planeo y contacto: reloj, huesos, cámara, cuerdas y HUD idénticos antes/después de esperar pausado. Comprobación adicional de que el casco sigue siendo dibujado por el renderer.
- Veinte reintentos por navegador: máximos **365 ms en Chromium / 473 ms en WebKit**, sin reconstrucción de canvas. Son pruebas de ciclo de vida con replay acelerado; las partidas completas se graban por separado.
- Pérdida seguida de recogida en el mismo tick mantiene reacción roja/LOST; escala dentro de límites. Movimiento reducido mantiene escala 1 y órbita 0. Recuperación gráfica regresa a AIRPORT y comienza con cues vacíos.

### Comparación controlada

[Vídeo antes/después](evidence-motion23/comparison.mp4): izquierda `finish-22`, derecha esta iteración. Semilla **17**, **1.635 muestras de input a 30 Hz**. Inputs, eventos y resultado son idénticos: **1.755.000**, aterrizaje Jurerê. [Resumen reproducible y hash](evidence-motion23/comparison.json), telemetría completa [antes](evidence-motion23/before-measurements.json.gz) / [después](evidence-motion23/after-measurements.json.gz). El vídeo antecede únicamente a la optimización posterior de nubes fuera de cámara y al filtrado final de secuencias inactivas del HUD.

Capturas: [menú anterior](evidence-motion23/before-airport.png) / [actual](evidence-motion23/after-airport.png), [salida](evidence-motion23/after-exit.png), [caída](evidence-motion23/after-freefall.png), [inflación pausada en WebKit](evidence-motion23/opening-webkit.png), [contacto](evidence-motion23/contact-webkit.png), [planeo final](evidence-motion23/final-canopy-webkit.png), [resultado final](evidence-motion23/final-results-webkit.png).

[Medidas de pausa Chromium](evidence-motion23/motion-measurements-chromium-mobile.json), [WebKit](evidence-motion23/motion-measurements-webkit-mobile.json). [Encuadres de cuatro desenlaces en cuatro formatos](evidence-motion23/settlement-framing-webkit-mobile.json).

### Rendimiento y corrección de regresiones

La comparación inicial con semilla 17 pasó de **48 / 81.351** a **53 / 86.007** (draw calls / triángulos, incluidos pases). Otra semilla detectó un pico de **92.437**, por encima del límite. Se eliminó trabajo de nubes fuera del frustum mediante sus volúmenes conservadores, sin simplificar nubes visibles ni variar el gameplay. La semilla problemática **1079896713** terminó después con **53 / 84.499** en ambos navegadores, duración **54,77 s** y capital **1.717.500**. También se simplificó la malla decorativa del agua y se excluyó pasto fuera de su distancia visible.

`src/core/simulation.ts` es idéntico a `finish-22` y al servidor. SHA-256: `a28aaa1519a4fd66028835fb8937b4c0f76ded2ca80db9373396bb72d08798b1`. Reglas `runway-3.0.0-routes`, contenido `island-routes-8`; no cambia la versión competitiva.

## Límites reales

No se dispone de iPhone/Android físicos: quedan pendientes diez minutos sostenidos, mediana ≥30 FPS y P95 ≤40 ms en dispositivos reales. WebKit con viewport iPhone no equivale a Safari en un teléfono. No se presenta este pase como una prueba humana ni como equivalencia artística con las imágenes de referencia. Se revisaron capturas y vídeo de los hitos principales; no se certifican todas las semillas y posibles arcos de cámara.

Los nuevos sonidos y la revisión de mezcla están deliberadamente pendientes, como indica el plan. La zona real del evento depende de las futuras fotografías.

## Publicación y rollback

Publicar únicamente el frontend `motion-23`, con audiencia pública existente. API, identidades e históricos permanecen sin cambios.

Rollback `finish-22`: versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_2b4d211d024c819184b87f874c1791fe`, commit `651421e5f09297a10cd3aa550e3a3334024efab7`, deployment `appgdep_6ad6baf80a4081918ff8179dacf53d5d`.

API compatible: versión `appgprj_6acfed30efd88191aef688e5a181c299~appgver_84e8102324608191bf05d6846a9832fc`, commit `77632ca0b4bab0c1128025e66fdbb13b04bab94e`.
