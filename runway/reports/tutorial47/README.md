# NPC tutorial — cinematic 3D overhaul (local, 22 October 2026)

## IMPLEMENTADO

- Cuatro escenas: THE LEAP, SURVIVE, FLY & LAND, BUILD. Se eliminó la guía individual de ítems del tutorial. Escritura a 18 caracteres/segundo: unos 20 segundos de guion y transiciones, más las pausas voluntarias; READ completa inmediatamente, NEXT avanza y SKIP sale.
- Composición estable de tres cuartos: NPC a la izquierda, proyección a la derecha y diálogo reservado abajo. En horizontal corto, la escena ocupa la izquierda y el diálogo la derecha. El jugador conserva su instancia y estado, pero su grupo visual se excluye durante el briefing; no se desplaza artificialmente.
- La mano derecha se extiende mediante el rig existente. La luz y los rayos parten del socket `pilot-grip-R`, utilizado también por las cuerdas del paracaídas. El objeto se materializa desde ese origen. Rotación suave, barrido holográfico, color verde/rojo y desaparición antes del siguiente objeto o paso. Un solo modelo visible.
- Gestos breves por paso, expresiones LED de caracteres y preocupación asociada al gas fee. El reloj de alternancia es independiente de los gestos y de cada carácter escrito: la escritura no reinicia el holograma. Se mantienen los sonidos digitales y sus límites existentes.
- SKIP, finalización y Escape guardan el tutorial visto. Se conserva `npc-26` como identificador de persistencia para no obligar a repetirlo a usuarios existentes; HOW TO PLAY siempre ofrece el nuevo tutorial. SHOP mantiene su introducción única y SHOP GUIDE permite repetirla voluntariamente.
- Sin nuevas dependencias, assets descargados ni cambios de gameplay. Se reutilizan seis geometrías de producción; no hay PNGs ni screenshots representando objetos. Se mantienen el precalentamiento de shaders, el reloj que se detiene en background y alternativas de movimiento reducido.

## Modelos originales utilizados

| Escena | Modelo 3D | Origen real |
|---|---|---|
| THE LEAP | Paracaídas amarillo | `canopyGeometry`, misma superficie que el canopy de vuelo |
| SURVIVE | Delivery / ETH gas fee | `propGeometry('delivery' / 'gas')`, mismo modelado, colores y etiquetas del gameplay |
| FLY & LAND | Aro encadenado / estrella hueca | `propGeometry('gate' / 'star')`, incluido shader de franjas del aro |
| BUILD | Paracaídas / Community | Canopy equipable y medallón Community como representación del equipo |

Las etiquetas integradas en los materiales originales siguen existiendo; no se usan planos con imágenes de objetos para sustituir geometría. El canopy no pasa por el shader de etiquetas de pickups, evitando atributos de superficie incorrectos.

## Ajuste necesario del guion

STARTUP registra integrantes, invitaciones y la suma de los mejores vuelos verificados; no permite invertir SOL en una oficina. Por eso BUILD dice:

> Bank your SOL. Unlock new gear in the Shop. Your best flights grow your startup’s team capital.

Community representa al equipo, no una oficina ficticia. No se anuncia una mecánica de Health: el recurso que se protege es el capital. No se agregó una función de inversión ni una pantalla de gestión.

## Causas corregidas

1. El tutorial anterior tenía nueve pasos y un segundo catálogo explicativo: reemplazado por cuatro escenas breves.
2. El proyector nacía en una posición fija del mundo: ahora sigue la mano del esqueleto, después de evaluar su pose.
3. El encuadre anterior podía incluir al jugador detrás de los objetos: plano exclusivo del NPC y encuadre adaptado al formato.
4. La alternancia de modelos dependía del reloj de gestos, reiniciado al comenzar a hablar: ahora depende del inicio del paso.
5. Los modelos no desaparecían antes de cambiar el texto: salida de 320 ms antes del siguiente paso; fades exclusivos entre modelos alternados.

## PRUEBAS REALIZADAS

- `npm run build`: tipos de toda la aplicación/tests y producción correctos. Persiste la advertencia de tamaño de bundles; no es un error de compilación.
- `npx vitest run tests/dialogue.test.ts`: 8 pruebas aprobadas; continuidad, pausa, transición exclusiva, cambios rápidos, reloj de pasos y guion/ritmo.
- Playwright: 8 escenarios del tutorial aprobados (4 por motor), más 2 del SHOP. Chromium/Pixel 7 y WebKit/iPhone 13 emulados. Capturas adicionales en 1440×900, 844×390 y 320×568 con movimiento reducido.
- Recorrido completo de los cuatro pasos, alternancias de objetos, READ/NEXT, SKIP, regreso, persistencia tras recarga y HOW TO PLAY.
- Aserciones sobre la escena real: jugador no visible, un holograma, origen a 0,055 unidades sobre el socket, rostro y objeto separados entre sí y del diálogo, objetos dentro de pantalla.
- Eventos de audio de escritura y expresión warning comprobados después de interacción. SHOP no repite su introducción y permite solicitarla de nuevo. No se hizo una evaluación auditiva humana de la mezcla en teléfonos.
- Todas las llamadas `/api/` interceptadas con respuesta controlada 503: ninguna partida ni ranking de producción modificados.
- Se conservan seis pruebas de continuidad y se añaden dos del nuevo guion y reloj; `npc26.spec.ts` conserva la regresión del SHOP y `tutorial47.spec.ts` sustituye las expectativas obsoletas de nueve pasos/field guide.

### Rendimiento observado

Ventana de siete segundos atravesando cambios reales de modelo, servidor Vite local y hardware del Mac; no representa teléfonos físicos.

| Motor / emulación | Mediana | P95 | Máximo | Draw calls máx. | Triángulos máx. |
|---|---:|---:|---:|---:|---:|
| Chromium / Pixel 7 | 8,3 ms | 9,1 ms | 9,3 ms | 38 | 32.950 |
| WebKit / iPhone 13 | 17 ms | 20 ms | 34 ms | 38 | 33.030 |

25 geometrías y 24 texturas registradas; ninguna solicitud nueva de assets durante la ventana y nunca dos hologramas visibles. Datos completos: [performance.json](performance.json). Los vídeos de cada recorrido permanecen en las carpetas locales `metrics/`, `final/` y `visual-final/`.

### Evidencia visual

- [THE LEAP — iPhone 13](captures/iphone13-step-1.png)
- [SURVIVE — iPhone 13](captures/iphone13-step-2.png)
- [FLY & LAND — iPhone 13](captures/iphone13-step-3.png)
- [BUILD — iPhone 13](captures/iphone13-step-4.png)
- [Escritorio](captures/desktop.png), [horizontal](captures/landscape.png), [320×568 / movimiento reducido](captures/small-reduced.png)

## PENDIENTE / LÍMITES

- Validación física de iPhone/Android y escucha de audio en sus altavoces.
- Publicación: esta intervención está implementada y compilada localmente; no se publicó ni se regeneró el ZIP de hosting.
- Inversión de SOL en STARTUP: no existe y queda fuera de este encargo; el tutorial no la promete.

## Entorno de validación

Al iniciar, iCloud había desalojado parte de las dependencias y algunos assets; el primer arranque Chromium quedó esperando la carga. Se restauraron exactamente las dependencias del lockfile desde caché local y recursos cuyo contenido coincidía con el hash Git. La carpeta anterior se conserva como `.node_modules-offloaded-tutorial47/` (ignorada). Las ejecuciones posteriores pasaron; no se añadieron bibliotecas ni se alteraron versiones.
