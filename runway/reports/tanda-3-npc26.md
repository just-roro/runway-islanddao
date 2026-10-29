# RUNWAY — Tanda 3/5 · NPC & Tutorial · npc-26

20-10-2026. Base: `flight-25`, commit `8788fd14987792696e85c3cf103fe18874f71a4b`.
Alcance exclusivo: conversación cinematográfica, expresiones, voz digital temporal y hologramas. No se avanzó a otra tanda.

## Causas y cambios

- El NPC se montaba/desmontaba con el panel. Ahora permanece en la escena, entra con desplazamiento y aparición gradual, conserva el rig y sale progresivamente. El protagonista gira hacia él; cámara, presencia y gestos consumen un estado compartido.
- Tutorial y SHOP tenían mensajes y tiempos independientes. Ahora comparten escritura a 35 caracteres/s, expresión, gesto y voz. Primer plano para conversar; encuadre más amplio al proyectar objetos; regreso amortiguado a menú o carrusel.
- Nueve intervenciones del tutorial separan movimiento, capital, financiación, obstáculos, utilidades, estrella, secuencias y aterrizaje. HOW TO PLAY permite repetirlo. Versión `npc-26` se muestra una vez a perfiles existentes; identidad continúa antes del tutorial en perfiles nuevos.
- Cinco expresiones de caracteres (`^_^`, `o_o`, `>_<`, `;)`, `\o/`), parpadeo y gestos de pecho/brazos sincronizados con el contenido y la escritura. Cara oscura para separar los caracteres del entorno.
- SHOP incluye bienvenida con primer plano, escritura y regreso al carrusel. El NPC responde al explorar, equipar y a errores. No se cambiaron precios, banco ni transacciones.
- Modelos y materiales del gameplay reutilizados para SOL, Community, Term Sheet, Delivery, Gas, Rug, Hacked, Magnet, Water, estrella, aro y Rare Cargo. La guía permite seleccionarlos. Escaneo luminoso, rotación suave y líneas de proyección; el objeto anterior termina su salida antes del siguiente. Edificios y océano siguen explicados como peligros ambientales, sin inventar modelos de pickups.

## Sonido temporal original

Se conservaron música y efectos existentes. El proyecto no tenía archivos de voz NPC; se añadieron tonos digitales originales con Web Audio, no grabaciones de Undertale.

`DIALOGUE_VOICE` en `src/services/audio.ts` configura una voz corta de escritura y cinco señales distintas de expresión. Cada entrada admite `url` y duración para sustituirla por los archivos definitivos, sin cambiar tutorial o SHOP. Un archivo opcional fallido conserva el tono sintetizado y no se solicita continuamente.

Una única voz activa, separación mínima de 90 ms entre grupos y prioridad de expresión. Saltar texto no reproduce sílabas pendientes. Cerrar, silenciar y ocultar la página corta la voz; al volver continúa la escritura, sin recuperar sonidos atrasados. La misma expresión no vuelve a sonar por cada actualización del texto. La música de menú continúa entre estas pantallas.

## Verificación focalizada

- TypeScript y build de producción: aprobados. El build conserva el aviso de tamaño del chunk de Three; no es un error.
- 6 pruebas unitarias: entrada/salida gradual, regreso de SHOP, reloj detenido, equivalencia 30/60 Hz, gestos y reemplazo exclusivo de hologramas.
- 6 casos Chromium/WebKit aprobados: identidad → tutorial completo → menú → regreso; HOW TO PLAY; guía; SHOP → explorar → equipar; escritura/expresión; skip; mute; conservación de música; horizontal y movimiento reducido.
- Después de corregir la superposición del haz holográfico se repitió el recorrido completo de tutorial en ambos navegadores: 2/2 aprobados. Se corrigió además una medición de QA que dependía del orden de hijos, usando el nombre estable del nodo del piloto.
- Rostro completo en los encuadres móviles comprobados. El giro del protagonista regresa a aproximadamente π (3,142 / 3,146 rad). Las señales sonoras de escritura registradas respetan ≥90 ms entre emisiones. Equipar dispara la expresión y señal de celebración.
- Background se comprobó mediante evento de visibilidad controlado: emisión detenida, sin cola de sonidos. Es una prueba emulada, no una interrupción real de iOS.
- Capturas revisadas: primer plano, proyección de moneda/peligro/imán/estrella/aro, SHOP y horizontal. Se corrigieron el recorte del NPC, objetos fuera de cuadro y el haz que tapaba el rostro del protagonista.
- Muestras de tutorial: 36–41 draw calls y hasta 42.698 triángulos; menú de regreso 27 / 24.706. Son muestras de estos estados con los pases de render existentes, no una medición de rendimiento sostenido de todo el juego.
- API, simulación, rutas, economía competitiva, música y assets originales preservados. Las pruebas locales bloquearon la API con una respuesta controlada; no se enviaron resultados ni compras competitivas de QA.

## Evidencia

[Resultados y mediciones](evidence-npc26/verified-tests.json).

[Primer plano](evidence-npc26/tutorial-closeup.png), [moneda](evidence-npc26/sol-projection.png), [obstáculo](evidence-npc26/warning-projection.png), [guía](evidence-npc26/field-guide.png), [estrella](evidence-npc26/star-projection.png), [secuencia](evidence-npc26/ring-projection.png), [SHOP](evidence-npc26/shop-greeting.png), [carrusel](evidence-npc26/shop-browse.png), [horizontal](evidence-npc26/landscape-hologram.png).

Grabaciones: [tutorial](evidence-npc26/tutorial.webm), [SHOP](evidence-npc26/shop.webm), [horizontal](evidence-npc26/landscape.webm).

## Pendientes y publicación

- Archivos de voz definitivos: pendientes del usuario. La voz sintetizada es temporal y reemplazable.
- Validación en iPhone/Android físicos y escucha de la mezcla en sus altavoces: pendiente. Emulación y registros Web Audio no acreditan esa prueba.
- Otras tandas: fuera de esta entrega; no iniciadas.
- Frontend `npc-26` construido localmente. API sin cambios. Rollback disponible: `flight-25`, versión `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_2933ca8125bc81918bbc8cc545065335`.
- Publicación autorizada explícitamente por el usuario el 20-10-2026. Se retoma el workflow de Sites para publicar este frontend validado. El resultado de despliegue y la comprobación pública se registran por separado.

## Publicación confirmada — 20-10-2026

Sites confirmó despliegue correcto de `npc-26`, versión 27. [Identificadores y comprobación pública](evidence-npc26/publication.json). Tutorial y SHOP abiertos desde la URL pública en Chromium móvil emulado, sin errores JavaScript; capturas revisadas. API bloqueada durante este smoke test para no generar datos de QA.
