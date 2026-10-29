# art-33 — Siete correcciones gráficas

## Causas y ejecución

| Pedido | Causa observada | Cambio |
|---|---|---|
| Hombros unidos | La manga y el torso terminaban antes del pivote del húmero, sin tejido que cubriera la articulación. | Fuente Blender y GLB: fuelle continuo con pesos pecho/brazo y casquete de manga alrededor del pivote existente. Conserva 15 huesos, nueve clips, tres materiales y personalización. +384 triángulos de cuerpo; 5.728 en total sin casco. |
| Destellos cuadrados del casco | Radiance map con rectángulos binarios y filtrado nearest; además, el desenfoque muestreaba la fuente completa con separaciones de una textura reducida, replicando los puntos luminosos. | Fuentes angulares suaves, HDR half-float 512×256 filtrable; prefiltrado separado antes de Gaussian X/Y. Los halos ya no forman una cuadrícula. |
| Cuerpo mate | Inspección efectiva de material/programa confirmó IBL activo, sin maps que lo anularan. La capa de tela rugosa dispersaba el brillo y no existía un lóbulo de recubrimiento sobre los paneles. | MeshPhysical solo para la superficie recubierta; conserva base textil, colores y rugosidad. Clearcoat 0,48 / roughness 0,22. Goma y herrajes conservan sus materiales. A/B de IBL y de clearcoat por separado. |
| Apertura sin entrada de luz | La compuerta abría entre 0,1–1,15 s, pero la iluminación interior/exterior comenzaba a mezclarse a los 2,2 s. | Misma función de apertura para geometría y luz de entrada: foco exterior localizado, glare centrado en la abertura y recuperación de exposición antes de 3,2 s. No se añade un mapa de sombras. |
| Exterior apagado / ítems débiles | Fog desaturaba muy pronto, el hemisferio inferior del cielo era cyan uniforme, bloom poco presente y destello estático de baja intensidad. | Azul más vivo, key exterior más intenso, detalle de nubes menos lavado, mezcla radiométrica continua, saturación +6% solo exterior. Bloom graduado por fase. Estrellas ópticas analíticas de cuatro puntas más puntas secundarias, rotación continua y soporte radial que elimina bordes de sprite. |
| Cámara de menú | Offset anterior más alto y cercano. | Cámara 0,35 unidades más atrás y 0,19 más baja; picado de menú 10,2° → 7,66°. Misma composición, FOV y trayectoria de salida. |
| Casco se reinicia en PLAY | Instancia persistente, pero el shader cambiaba del reloj de aeropuerto al reloj de partida que empieza en cero. | Fase LED acumulada en el actor persistente, avanzando con el dt de presentación. Pausa conserva la fase; resultado conserva la detención prevista. Sin delays. |

## Verificación real

- Build de producción y TypeScript aprobados. Tres tests unitarios verifican transición, apertura/recuperación y contrato del GLB con pesos combinados de hombros.
- `scripts/qa-art33.mjs`: WebKit iPhone 13 y Chromium Pixel 7 emulados. Capturas/vídeo de menú, tienda, apertura, salida y caída; muestreo de fase/UUID LED y ausencia de errores de shaders. Fase monotónica desde antes de PLAY; misma instancia durante toda la secuencia.
- `tests/browser/art33.spec.ts`: vuelo seed 17, input del controlador de QA, apertura, planeo y aterrizaje en Jurerê. Resultado 1.755.000 / tick 3270 en ambos navegadores; no se modifican reglas, colisiones ni velocidades. Prueba de pausa del LED y comprobación de uniforms efectivos de IBL/recubrimiento.
- WebKit full-flight corresponde al código inmediatamente anterior a convertir las texturas a half-float y explicitar PHYSICAL; capturas finales WebKit y vuelo Chromium corresponden al código final.
- A/B de IBL al mismo tick/cámara: se desactiva únicamente envMapIntensity del cuerpo. Cambia iluminación ambiental difusa y especular; por sí solo no demuestra reflejo especular. El probe adicional `scripts/qa-coating33.mjs` elimina únicamente clearcoat, conservando luz, entorno, color y base difusa.
- Inspección visual de menú, apertura, salida, caída, despliegue y planeo: unión visible de hombro; reflejos sobre mangas y bordes; halos continuos; destellos de ítems definidos; recuperación de contraste al salir del avión. Vídeos conservados para revisar movimiento.

## Evidencia

- [Antes: caída](evidence/art33/before-webkit/fall.png) / [después: caída](evidence/art33/final-webkit/fall.png).
- [Antes: menú](evidence/art33/before-webkit/menu.png) / [después: menú](evidence/art33/final-webkit/menu.png).
- [Apertura luminosa](evidence/art33/final-webkit/door.png), [salida](evidence/art33/final-webkit/exit.png), [tienda](evidence/art33/final-webkit/shop.png).
- `evidence/art33/final-flight/`: vídeo Chromium, IBL A/B, despliegue, planeo y llegada. `full-flight/`: equivalentes WebKit.
- `evidence/art33/coating/`: prueba aislada del lóbulo especular. `metrics.json` en cada directorio de navegador contiene la serie de transición y medidas completas.

## Rendimiento y límites

Se conserva un mapa de sombras y no hay captura de cubemaps por frame. Se añade un pase de prefiltrado a 1/4 de resolución para corregir el kernel de bloom, un foco sin sombras y 384 triángulos de cuerpo. Máximo de vuelo: 55 draw calls / 81.369 triángulos (incluye pases).

150 intervalos requestAnimationFrame por pose, VSync del host Apple GPU:

| WebKit | Base mediana/P95 | Final mediana/P95 |
|---|---|---|
| Menú | 33/48 ms | 33/37 ms |
| Apertura | 33/43 ms | 33/37 ms |
| Salida | 33/42 ms | 33/36 ms |
| Caída | 33/44 ms | 33/37 ms |

Chromium final: mediana 8,3–8,4 ms; P95 10,4–11,7 ms. Estas cifras son intervalos de presentación en emulación, no tiempo GPU aislado ni rendimiento de un teléfono. El host WebKit de esta sesión funcionó a ~30 Hz también antes del cambio; no se compara con los 17 ms de otra sesión light-32. Las ventanas FPS del test de vuelo que incluyen pausa/captura se excluyen como medida de rendimiento.

Pendiente: prueba sostenida en iPhone/Android físicos. La geometría ambiental low-poly existente limita la similitud con la ilustración de referencia; esta entrega mejora el pipeline solicitado, no sustituye el mundo por esa ilustración. Sin nuevas mecánicas ni rediseños UI.

## Publicación

Frontend art-33; API e históricos intactos. Rollback light-32: commit `64a78f3ddd081d8ec08a54c9a7ec5ef2fa33e2a6`, versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_a5d085abbecc8191a70e7350f94c7b94`. Confirmación de despliegue al final del registro.

Prueba especular aislada: 5566 píxeles del recorte corporal cambiaron más de 3 niveles RGB al retirar solamente clearcoat (mismo tick/cámara, base e iluminación). Diferencia RGB media [0.33, 0.25, 0.24].

Publicado correctamente el 2026-10-20: commit `3b0316f901543fc2f22f6aa01ef53dda899161a1`; versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_47f6560812b881919dd54d8a7885ece9` (34); deployment `appgdep_6ad7eeb626ac819180cd89cf540c0e94`. https://runway-islanddao.agenciahumanfriendly.chatgpt.site/?v=art-33
