# RUNWAY — Tanda 3/6: Parachute Experience & Environment

Fecha: 2026-10-22. Implementación local, sin publicación. No se avanzó a otra tanda.

## IMPLEMENTADO

- **Tormenta y salida:** la niebla gris aumenta en la aproximación y permanece densa hasta el borde inferior de la capa. Se añadieron 48 lóbulos de nube en coordenadas del mundo, reutilizando el instancing existente. El cielo, la luz de relleno, la luz solar, el fog y el postproceso consumen la misma envolvente atmosférica. La isla permanece montada durante el vuelo y se revela por la atmósfera, sin encender su grupo a mitad del descenso.
- **Apertura sincronizada:** la capa termina 0,2 s antes del inicio de la apertura existente de un segundo. Adaptación de exposición, bloom y sonido existente de revelación siguen ese hito. No se alteraron controles, animación del canopy, duración de apertura ni sustentación de las corrientes.
- **Corrientes:** 36 cintas ascendentes con punta direccional, repartidas entre las dos columnas; límites circulares en la base, medio y parte superior del volumen físico real. Visibles desde la salida de las nubes. Dos draws instanciados, sin objetos ni texturas por partícula. Pausa y movimiento reducido respetados.
- **Estrellas en planeo:** dos alternativas, una a la salida de cada corriente. Radio visual y de apertura compartido (3,2). Se reutilizan la detección continua, posición fija tras el contacto, flash amarillo y giro de Tanda 1. Cada estrella concede una sola vez el bonus existente. El impulso de 1,2 s aumenta hasta 25% la velocidad horizontal; no aumenta la velocidad de descenso ni el presupuesto de sustentación.
- **Aves y arcoíris:** dos grupos de tres aves se incorporan progresivamente a ambos lados del piloto, con menor escala, aleteo y orientación según el movimiento. Arcoíris lejano fijo en el mundo, con bordes suaves y atenuación atmosférica; una malla de 160 triángulos, sin textura adicional.
- **LOD:** las rocas ya no dependen de un corte a 240 unidades ni de pertenecer a las 48 más cercanas. Siluetas de ocho triángulos a distancia, detalle cercano y transición por cobertura, culling por frustum y desaparición completa entre 480–620 unidades. Los árboles también transicionan por cobertura, sin cambio brusco del grupo de los 16 más cercanos. Se conservan costa, posiciones de decoración, plataformas y colliders.

## Causas corregidas

1. La capa comenzaba a despejarse muchos segundos antes de abrir el canopy y terminaba después de empezar la apertura. Ahora hay un hito único de salida anterior al despliegue.
2. Las corrientes se habilitaban después de abrir el canopy y sus trazos eran demasiado finos. Se muestran durante la revelación y tienen dirección y límites reconocibles.
3. El impulso genérico sólo aceleraba el reloj de caída: aplicado sin adaptación al planeo habría aumentado el hundimiento. En planeo afecta velocidad horizontal; las corrientes conservan su tasa y límite anteriores.
4. Las rocas se eliminaban antes de alcanzar la distancia de desvanecimiento del material. El culling ahora ocurre después de cobertura cero.
5. Durante la verificación apareció una discrepancia entre los uniforms de configuración y los del material realmente montado: la visibilidad renderizada permanecía en cero. Cintas, arcoíris y cielo actualizan ahora el material efectivo; el test comprueba esos valores y se revisaron las imágenes resultantes.

## PRUEBAS REALIZADAS

- Build TypeScript/Vite de producción correcto. Sigue el aviso conocido del tamaño del bundle de Three; no se añadieron dependencias.
- 27 pruebas focalizadas de atmósfera, estrellas, simulación, sincronización sonora, geografía y reloj; más dos pruebas de vegetación. La prueba antigua de hábitat esperaba 96 árboles, pero el generador existente ya producía 112; se corrigió esa expectativa y ambas pruebas pasaron. No se cambió la densidad de árboles.
- Comparación SHA-256 de **1.000 semillas**: quitando únicamente las dos nuevas estrellas, todos los objetos generados coinciden exactamente con la base. Incluye IDs, orden, economía, obstáculos y secuencias.
- **200 vuelos automatizados**, 50 semillas por combinación de lado/corrientes: 100/100 con corrientes alcanzaron Jurerê y recogieron la estrella correspondiente; 0/100 sin corrientes alcanzaron Jurerê (aterrizaron en Terrace). Son controladores automatizados, no pruebas humanas.
- Impulso, recolección única, barridos continuos, ausencia de atracción de estrellas y mayor alcance sin hundimiento añadido comprobados por pruebas ejecutables.
- **Cuatro pruebas finales de navegador**: vuelo real completo + inspección de escenario, en Chromium y WebKit. Capturas y vídeo desde avión, tormenta, revelación, apertura, corrientes, activación de estrella y aterrizaje. Replay reproducible, una sola concesión de la nueva estrella, pausa estable, sin errores de shader o JavaScript en el recorrido final.
- Dos pruebas adicionales en ambos navegadores: cobertura del horizonte, pausa y movimiento reducido.
- Formatos: Pixel 7 emulado, iPhone 13 emulado, 1440×900 y 844×390. En una pasada previa también se revisaron 320×568 y las tres zonas de aterrizaje. El cambio artificial de viewport produjo un aviso de ResizeObserver en WebKit; se conservó el registro y se separó de los errores gráficos, sin modificar la UI en esta tanda.
- Núcleo de frontend y copia local de API idénticos. `CONTENT = island-glide-13`; reglas competitivas y PB conservados. No se contactó la API de producción durante las pruebas de navegador.

## Rendimiento observado

Incluye escena, sombras y postproceso. Intervalos de RAF durante ruta 19–50; medidos en el equipo anfitrión con viewports emulados, **no en dispositivos físicos**.

| Medida | Base Chromium | Final Chromium | Final WebKit |
|---|---:|---:|---:|
| Mediana frame | 8,3 ms | 8,4 ms | 33 ms |
| P95 frame | 8,9 ms | 10 ms | 38 ms |
| Draw calls máximos | 60 | 61 | 61 |
| Triángulos máximos | 88.015 | 89.071 | 88.985 |

Objetos GPU observados al final: hasta 79 geometrías y 24 texturas. Son recuentos de Three, no una medición en MB de memoria GPU. No se capturó una base WebKit de rendimiento en esta intervención. Las capturas generan algunas pausas aisladas de unos 300 ms; se conservan en la telemetría, no se interpretan como saltos de la trayectoria de cámara.

## Evidencia

- [Métricas consolidadas](verification.json), [simulaciones de rutas](routes.json), [huellas del curso anterior](course-before.json).
- [Tormenta anterior](captures/before-inside-clouds.png) / [tormenta actual](captures/final-inside-clouds.png).
- [Antes de abrir](captures/final-clearing-before-canopy.png), [apertura](captures/final-canopy-opening.png), [isla, corrientes, aves y arcoíris](captures/final-sunlit-island-reveal.png).
- [Estrella activada](captures/final-glide-star-activated.png), [vista desktop](captures/final-glide-1440.png), [costa lejana](captures/final-coast-400.png), [LOD cercano](captures/final-coast-65.png).
- Vídeos, trazas y telemetría completa locales en `final/`; tomas originales en `before/`. No se incluyen esos archivos pesados en Git.

## PARCIAL / PENDIENTE

- Pendiente validar controles táctiles/sensores y rendimiento sostenido en iPhone y Android físicos. La emulación no sustituye esa validación.
- La revisión visual realizada cubre las capturas de cada hito y la telemetría de continuidad; el recorrido quedó grabado. No se realizó una sesión de testers humanos.
- No publicado: antes de una publicación futura deben salir juntos frontend y API compatibles, porque hay nuevas estrellas y una adaptación del boost en el núcleo compartido.
- ZIP de producción intacto: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Repetición local

Desde `runway/`, con Node 24:

```sh
npm run build
npm test -- tests/parachute45.test.mjs tests/sky38.test.ts tests/stars43.test.ts tests/storm.test.ts tests/audio36.test.mjs tests/world39.test.ts tests/presentation-clock.test.ts tests/habitat.test.ts
RUNWAY_BASE_URL=http://127.0.0.1:5181 npx playwright test tests/browser/parachute45.spec.mjs --workers 1
```

El test de semillas utiliza `course-before.json`; no regenerarlo desde la versión nueva.
