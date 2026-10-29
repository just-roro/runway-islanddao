# RUNWAY — Tutorial, pickups, startup, tormenta y música (48)

Fecha: 22 de octubre de 2026. Cambios localizados sobre tutorial47. Sin nuevas mecánicas, cambios económicos, rutas o hitboxes. El ZIP de producción de Human Friendly no se regeneró.

## IMPLEMENTADO

| Sistema | Causa comprobada | Corrección |
|---|---|---|
| HOW TO PLAY | `char.visible` ocultaba el actor al superar 0,02 de foco del tutorial y lo mostraba al volver. No era una descarga del modelo. | Se mantiene el mismo actor, rig, materiales y personalización. La cámara lo deja fuera de cuadro y regresa por una interpolación continua; transición de foco más pausada. |
| Encuadre NPC | Plano amplio, destino fijo de hologramas separado de la mano; gestos de brazo competían con la proyección. | Plano cercano de tres cuartos adaptado al formato. NPC más atrás en la bodega para no compartir encuadre con el jugador. Proyección sobre `pilot-grip-R`, brazo extendido estable, modelos originales y salida/entrada existentes. |
| COMMUNITY / TERM SHEET / MAGNET | Sí existían en el generador y se podían recoger; su tamaño y el fog individual reducían mucho su anticipación. | Tamaño visual ×1,65 dentro del alcance de contacto existente, coherente entre modelo y glow; distancia de disolución ampliada. No se duplicaron slots ni se aumentaron recompensas. |
| STARTUP | El campo estaba dentro de un desplegable y desaparecía con membresía bloqueada. El backend devolvía un error ambiguo incluso al repetir el mismo código. | Campo y JOIN visibles, validación hexadecimal, confirmación y roster inmediato. Se usa el endpoint real; unión al mismo equipo idempotente, errores separados para código inexistente, equipo lleno y membresía bloqueada. |
| Tormenta | Las 48 instancias grises compartían la geometría de esfera de las nubes blancas. | Dos bancos continuos cerrados, perfiles anchos e irregulares, crestas y bases diferenciadas, colores por vértice y tamaños variados. Instancing opaco, sin texturas nuevas ni pases de sombras. |
| Victoria | No existía una pista de música asociada a la confirmación de aterrizaje. | El evento real `landed` con destino válido activa una sola pista; crossfade de 0,8 s, reproducción única, pausa/reanudación conservando posición y controles de música existentes. Termina recuperando la música habitual atenuada de resultados. |

El archivo adjunto llamado `mus_win_01.wav` contiene realmente audio MP3. Se copió **sin modificar sus bytes** a `public/assets/music/mus_win_01.mp3`, con MIME y extensión correctos. 131.475 bytes, duración decodificada ~6,048 s. SHA-256: `346861b2d7d5bed2a657f685408efdaa5e25fc86947df37f3ae4e4545fff5340`.

La música comienza en el contacto válido, junto a la celebración; el cartel y los resultados conservan su entrada cinematográfica existente. No se reemplazó música de menú ni de gameplay. Fallos transitorios de descarga permiten un nuevo intento en la siguiente interacción, sin bucle de peticiones.

## Auditoría reproducible de ítems

[Frecuencias completas, restricciones y diagnóstico](PICKUPS.md) · [Resultados JSON](pickup-audit.json) · [Script](pickup-audit.mjs).

10.000 semillas (0–9999): COMMUNITY esperado/observado **3/3 por partida**; TERM SHEET **2/2**; MAGNET **2/2**. Los tres están presentes en el 100% de las generaciones. Los slots aleatorios mantienen límites de HACK y exclusión de repetición consecutiva. Todos los tipos habilitados aparecieron. RISK es un tipo residual, no un ítem habilitado del catálogo.

Además, 100 partidas con entradas cuantizadas reales del controlador existente produjeron 73 recogidas de COMMUNITY, 58 de TERM SHEET y 23 de MAGNET. Se comprobaron importes, duración del imán, ausencia de duplicados y cinco replays idénticos. Esto comprueba funcionamiento; no representa habilidad ni balance de jugadores humanos.

Las capturas `pickup-*.png` son fixtures de encuadre del renderer real, con semilla 17 y posiciones originales, no pruebas de una partida humana. La recogida se verifica por separado con los controles reales. Otros obstáculos pueden seguir ocultando momentáneamente un objeto: no se eliminó ese desafío.

## PRUEBAS REALIZADAS

- Build frontend: TypeScript + Vite de producción. Conserva la advertencia preexistente de bundles grandes (Three separado).
- Build API: Vinext/Vite, compilación completa en una copia limpia temporal del mismo source, después de detectar archivos locales de iCloud descargados. Dependencias fijadas sin cambios.
- 17 tests en cinco suites: diálogo, generación/recogida, geometría de tormenta, audio y runtime; además las tres pruebas existentes de cielo (20 tests distintos en total).
- Endpoint real de STARTUP ejecutado contra SQLite mediante adaptador D1 de prueba: código inválido/inexistente, traslado de membresía desbloqueada, equipo lleno, bloqueo, reintentos idempotentes y persistencia después de cerrar y reabrir la base. No se crearon miembros de prueba en producción.
- Chromium y WebKit: 14 casos distintos aprobados entre `integration48.spec.mjs` y los casos de tutorial47 afectados. Entrar/salir tres veces conserva UUID y posición del jugador, sin apagar su visibilidad; su geometría queda fuera del encuadre final. Capturas en 390×844, 320×568, 844×390 y 1440×900.
- Los cuatro pasos, SKIP, avance rápido, HOW TO PLAY, flag persistente, audio digital y movimiento reducido. Un holograma visible a la vez y cero nuevas solicitudes de assets durante alternancia de objetos.
- Anclaje de proyección a 0,055 unidades de la mano; offset vertical constante del objeto respecto de la mano. Capturas revisadas de rostro, objetos y diálogo. Se corrigieron durante QA el piloto residual en el borde horizontal y el recorte superior del canopy.
- STARTUP en ambos navegadores con respuestas controladas: código inválido, unión, actualización inmediata, recarga y membresía existente/bloqueada. La persistencia del backend se comprobó separadamente con la ruta real.
- Victoria: AudioContext activo, pista decodificada, fuente reproduciendo y señal de audio no nula; un inicio por partida. Pausa/mute conservan posición. Contactos de agua y aterrizaje fuera de plataforma no disparan victoria. Se prepararon posiciones de contacto para estas pruebas; no se presentan como un recorrido humano completo.
- Vuelo real con controlador y capturas de entrada, capa densa, salida y canopy, sin errores de página. Nubes: geometría cerrada, normales finitas, corredor libre y límite de triángulos. Su incremento teórico máximo es de 2 draw calls y 4.608 triángulos frente a las esferas anteriores.

Los vídeos y trazas completos quedan en `browser/`, `tutorial-final6/`, `audio-final/` y `storm-final/` (locales, ignorados por Git). Las capturas seleccionadas están en [captures](captures/). Las mediciones finales se guardan en [performance.json](performance.json). No son mediciones de GPU de un teléfono físico.

## PARCIAL

- Rendimiento y audio móvil comprobados en Chromium/WebKit emulados sobre este Mac. No se certifica comportamiento térmico, altavoz ni sensores en hardware real.
- Unión en producción: despliegue de la API comprobado, pero sin cambiar membresías de usuarios reales. Las operaciones y persistencia están verificadas con la misma ruta y SQL en una base de prueba.

## PENDIENTE

- Escucha y prueba sostenida en iPhone/Android físicos.
- No hay un sistema de vencimiento de invitaciones en el backend existente: los códigos persistentes no caducan. Se informa código inexistente, sin inventar expiración ni añadir otra política.

## Continuación

API publicada desde `/private/tmp/runway-api-48-clean`, commit `1162edbb44985eea25f6207649399970104657aa`, versión 23. Los cambios de la ruta y sus tests también permanecen en `services/runway-api`; su checkout original tenía archivos y objetos Git descargados de iCloud. No se sustituyó su historial local. Ver `publication.json` para la publicación final del frontend.
