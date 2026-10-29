# RUNWAY — Tanda 1/6: estrellas y REPLAY

Fecha: 2026-10-22. Implementación y verificación local; no publicación ni regeneración del ZIP. No se inició la tanda 2.

## IMPLEMENTADO

### Estrellas

Causa: `Items` usaba la misma rama de recogida para monedas y estrellas: interpolación hacia el piloto, escala descendente y retirada a los 220 ms. La simulación ya excluía estrellas de la atracción magnética; el fallo visible estaba en el renderer.

Corrección: reacción independiente con posición capturada en el contacto, escala original constante, emisión amarilla por instancia y tres vueltas en 1,2 segundos. La curva de giro tiene velocidad y aceleración nulas al comienzo y al final. Después queda en su posición, apagada, hasta salir del volumen visible. Movimiento reducido conserva el destello sin giro rápido. La pausa conserva el instante exacto.

Colisiones: se mantiene el cruce continuo del plano en coordenadas relativas. Se elimina para aros/estrellas el descarte por altura calculado sólo sobre el extremo final del movimiento; se acepta un comienzo exactamente sobre el plano; se corrigen los ejes de estrellas verticales. La abertura de cinco puntas considera ahora el radio físico del piloto, en vez de exigir que sólo su punto central esté dentro. No se reemplaza por un círculo sobredimensionado.

El impulso y los 15.000 SOL siguen naciendo del mismo evento de simulación. `collected` continúa siendo la única protección de concesión por objeto; el efecto visual nunca concede dinero ni vuelve a activar el impulso. Sin nuevas mallas ni pases: un atributo de emisión en el instancing existente.

### REPLAY

Causas: `createRuntime` dejaba la presentación en el origen del mundo hasta el primer avance. Como el nuevo intento se pausaba bajo el telón, ese avance no ocurría. Además, los guards de pausa impedían restaurar el rig, la rotación del cuerpo, el canopy y las partículas heredadas. Compilar shaders no restauraba esos estados.

Corrección:

- Inicializar la presentación a partir del estado real antes de montar el intento, sin avanzar el reloj.
- Congelar el intento anterior desde el clic de REPLAY.
- Restaurar explícitamente pose, cámara, FOV, framing, niebla, canopy y trail al cambiar de intento, aun con `dt=0`.
- Asociar la confirmación de escena lista al runtime solicitado, evitando que una confirmación tardía del intento anterior abra el telón.
- Mantener el intento nuevo pausado durante toda la preparación y apertura del telón. Reanudar al quedar completamente descubierto.
- Mantener la continuidad normal de PLAY desde el menú y la fase del retrato LED. No remonta el canvas.

## PRUEBAS REALIZADAS

- TypeScript + Vite producción: correcto. Advertencia ya existente de tamaño de chunks; sin error de compilación.
- 24 pruebas automatizadas en seis archivos: todas correctas. Incluyen 90 combinaciones de orientación temporal, desplazamiento lateral y velocidad normal/impulso; contacto de borde, fallo real, comienzo sobre plano y sobrepaso del plano. Recompensa e impulso únicos.
- Regresión dirigida: 100 partidas por semilla con ledger y replay exactos; comprobación de programación de render a 30/60 FPS; aros, paracaídas, cues y recogidas.
- Chromium/Pixel 7 emulado y WebKit/iPhone 13 emulado: 6 casos, 6 correctos, 0 omitidos y 0 inestables. API interceptada con respuesta 503; ninguna partida de QA enviada a producción.
- Estrella: 127 cuadros observados en Chromium y 45 en WebKit; posición de contacto y escala 1,65 invariantes, giro observable, una recompensa y una activación. Pico de emisión 0,996/1,000; 40 draw calls máximos observados en ese escenario.
- Victoria real mediante controlador de input, REPLAY, derrota aérea mediante colisión de gas controlada y segundo REPLAY. Se retuvo deliberadamente `compileAsync` para comprobar cobertura opaca durante la preparación.
- 267/253 cuadros pausados de victoria/derrota en Chromium y 69/69 en WebKit: tick 0, posición `[0,1122.2,355]`, cámara constante, pose `prepare`, canopy oculto y cero partículas del trail. También pasa el retorno al menú con compilación retenida.
- Capturas revisadas visualmente: estrella antes y después del contacto, plano auxiliar para ver completa la silueta durante el destello y avión al terminar el reinicio. Vídeos continuos en `final/`. Los primeros intentos detectaron un problema del muestreador de QA: observaba el runtime antes del commit de React y dejaba de registrar; se corrigió para distinguir el intervalo opaco del estado ya incorporado a escena.
- Núcleo cliente/API idéntico byte a byte. Contenido local: `island-stars-12`; reglas económicas y generación de objetos sin cambios. La próxima publicación debe llevar frontend y API compatibles.
- ZIP de producción intacto: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Evidencia

- [Resumen de navegador](browser-summary.json)
- [Pruebas de lógica](unit-tests.log) · [Build](build.log)
- [Estrella amarilla](star-yellow-peak.png)
- [REPLAY desde victoria](victory-replay-ready.png) · [REPLAY desde derrota](defeat-replay-ready.png)
- Telemetría completa por navegador: `*-star-frames.json`, `*-victory-reset-frames.json`, `*-defeat-reset-frames.json`.
- Capturas originales y vídeos: `final/`, conservados localmente fuera del paquete de publicación.

## PARCIAL / PENDIENTE

No quedan funcionalidades pendientes dentro de esta tanda. La comprobación en iPhone y Android físicos queda pendiente; las pruebas anteriores usan emulación sobre desktop y no equivalen a mediciones en hardware móvil. La versión pública sigue sin cambios; la publicación no forma parte de esta intervención.
