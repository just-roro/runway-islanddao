# RUNWAY routes-21 — implementación y evidencia

Candidato del 19 de octubre de 2026. Reglas `runway-3.0.0-routes`, contenido `island-routes-8`. El núcleo de frontend y API es idéntico byte por byte.

## Cambios entregados

- Economía centralizada, penalización progresiva 2% / 20% / 100%, Water de un impacto, sin gasto por tiempo. SOL se ajustó de la propuesta inicial de 10.000 a 15.000 tras las simulaciones: la tabla propuesta era un punto de partida. El resto conserva los valores aprobados. FUNDED exige 500.000; no hay techo de capital.
- Eliminadas las decisiones Funding/Strategy y sus cuatro efectos exclusivos. Tres rutas continuas, 128 SOL, estrellas y secuencias espaciales. Jurerê necesita corrientes; se probaron ambas alternativas. Rankings, identidades y desbloqueos anteriores se conservan; las nuevas marcas están versionadas.
- Piloto skinned con 15 huesos, 5.344 triángulos de cuerpo, tres materiales y ocho clips. Rodillas/codos reales, colores PERKS conservados y cuerdas del canopy conectadas a las manos animadas. Casco PhysicalMaterial con LED emisivo y mapas de radiancia estáticos para interior/exterior.
- Avión: nervaduras, conductos, paneles, herrajes y tres familias de material; abertura y pivote de compuerta conservados. Exportadores separados para avión, ciudad y piloto evitan sobrescribir el rig nuevo.
- Costa, terreno, edificios y colisiones con orientación común; superficies de aterrizaje niveladas. Agua con profundidad derivada de la costa, luz solar consistente, horizonte cálido y nubes distantes. Aves, motos de agua, vegetación, actividad costera y puente decorativo fuera de las rutas.
- Moneda preparada al cargar y cada instancia visible solo junto al número. Pausa SVG. Tutorial y guía opcional de 14 elementos. Créditos Human Friendly con logo original y cuatro nombres. Resultados sin paneles CEO/STARTUP, replay económico real de dos segundos, piloto visible y retry inmediato.
- Corregida la espera repetida de 700 ms por un sensor ausente; Tilt permite reintentar explícitamente. La resolución adaptativa ya no queda reducida permanentemente por la compilación inicial de shaders.

## Balance reproducible

`node scripts/balance.mjs`: 100 semillas por ruta y controlador, 600 partidas con replay exacto. Control preciso a 30 Hz y demorado a 7,5 Hz. Estos controladores conocen las posiciones; no son personas ni estiman dificultad para un principiante.

| Ruta | Control | Media | Mediana | P10 / P90 | En 500k–2m | Objetivo alcanzado | Duración media |
|---|---|---:|---:|---:|---:|---:|---:|
| beach | precise | 1,184,125 | 1,170,000 | 1,017,500 / 1,412,500 | 100% | 100/100 | 54.07 s |
| beach | delayed | 660,610 | 660,000 | 490,000 / 835,000 | 89% | 100/100 | 54.56 s |
| terrace | precise | 1,361,744 | 1,345,500 | 1,170,125 / 1,624,375 | 100% | 100/100 | 51.85 s |
| terrace | delayed | 742,080 | 750,375 | 540,500 / 968,875 | 96% | 95/100 | 52.34 s |
| jurere | precise | 1,776,188 | 1,755,000 | 1,526,250 / 2,118,750 | 84% | 100/100 | 54.47 s |
| jurere | delayed | 829,548 | 798,750 | 475,000 / 1,230,000 | 87% | 49/100 | 54.97 s |

Los 600 controladores aterrizaron; los fallos de objetivo terminaron en terreno seguro sin su bonus. El controlador demorado llegó a Jurerê en 49/100 intentos. Los 20 controles inmóviles perdieron y terminaron en cero. Ninguno de estos controladores de recogida prioriza las secuencias: su media de secuencias es cero; pruebas independientes atraviesan una cadena completa con y sin impulso. No se presenta como validación humana del incentivo.

Sin corrientes, una cota optimista —entrada adelantada, velocidad máxima instantánea, sin choques— termina 21,2 unidades antes del borde válido de Jurerê. La prueba incluye esta cota y vuelos físicos por ambas corrientes. El jugador puede aterrizar en playa/terreno sin bonus; no se fuerza una derrota por fallar el destino.

Datos completos: [balance-routes.json](balance-routes.json). Inventario: [Markdown](content-inventory.md), [CSV](content-inventory.csv), [modelos reales](content-contact-sheet.png).

## Validación ejecutada

| Comprobación | Resultado / alcance |
|---|---|
| TypeScript + build | Correctos. Vite advierte del chunk Three grande; no es un error. |
| Unitarias | 45 pruebas, 10 archivos: replay 30/60, economía, Water, magnetismo, cadenas, rutas, agua, bancarrota y concesiones únicas. |
| Navegadores | 8 pruebas generales y 2 adicionales, cada flujo relevante en Chromium/WebKit; 5 formatos para cámara y fullscreen. Recorridos completos repetidos tras ajustes visuales. |
| Cámara de caída | 66,015°; altura proyectada ~31,78% con variación muy inferior a ±3 puntos entre formatos. Salida entre 3,86 y 5,02 unidades; sin el antiguo alejamiento a 20. |
| Retry | 20 ciclos por navegador con finales obtenidos por replay acelerado: máximo 687 ms Chromium y 451 ms WebKit. Canvas y música conservados. No equivalen a 20 vuelos en tiempo real. |
| Carga fría | Descarga de moneda retenida: loading permanece y moneda/importe aparecen juntos. GLB fallido se recupera sin recargar página. |
| Audio/personalización | 20 navegaciones, 12 colores NFT, background/interrupción, mute y ausencia de pistas duplicadas. |
| API local | Identidad, cupo atómico de tres, ticket ajeno, input inválido, run incompleta, score arbitrario ignorado, idempotencia, pertenencia fija, rankings persistentes y rate limit. Run validada: 1.800.000. |
| Render observado | Último recorrido: máximo 48 draw calls / 83.793 triángulos, incluyendo pases contabilizados por el renderer. No certifica diez minutos en teléfono. |
| Descarga | Todos los assets no musicales del build: 4.446.255 bytes sin comprimir; estimación gzip 1.346.707 bytes. Música bajo demanda. Es estimación de archivos, no medición 4G. |
| Replay local | 20 replays Node 24: mediana 53,77 ms / P95 71,87 ms. No es medición CPU del Worker. |

## Evidencia visual

- [Caída antes](evidence/freefall-before.png) / [después](evidence/freefall-after.png): semilla 17, tick 600, FOV ~78°, offset de cámara [0, 4,65, 1,88]. [Mediciones](evidence/comparison.json). Misma cámara y estado temporal; las reglas y el arte cambian.
- [Menú antes](evidence/menu-before.png) / [después](evidence/menu-after.png).
- Avión con encuadre de Blender fijo: [antes](evidence/aircraft-before.png), [después](evidence/aircraft-after.png), [abierto](evidence/aircraft-open.png).
- [Salida](evidence/exit-after.png), [tormenta](evidence/storm-after.png), [planeo](evidence/canopy-after.png), [resultado](evidence/results-after.png).
- [Vuelo completo WebKit](evidence/full-flight-webkit.webm), [guía](evidence/guide.png), [créditos](evidence/credits.png).

## Pendiente y límites explícitos

- Cinco testers × cinco partidas y comprensión 4/5: no ejecutado; requiere personas. El balance humano todavía no está aprobado.
- iPhone/Android físicos, diez minutos sostenidos y P95 ≤40 ms: no ejecutado. WebKit emulado no acredita Safari en iPhone real.
- Los modelos de pickups siguen siendo los existentes con lectura/materiales/feedback mejorados; su rediseño definitivo con futuras referencias queda fuera de esta pasada. El inventario señala las siluetas que todavía admiten mejora.
- Comparar visualmente con las referencias sigue siendo una revisión artística: las métricas no prueban equivalencia de acabado con las imágenes objetivo.

## Rollback compatible

Restaurar ambos Sites, no mezclar API vieja y cliente nuevo:
- Frontend arcade-20: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_4d9506438bec81918c4c37d75ef56dc1` · commit `3c3610f8b7cd2c8dd80b94b51801f6e58358c68f`.
- API arcade-20: `appgprj_6acfed30efd88191aef688e5a181c299~appgver_95f25afaf9e881918ff2bf4905771503` · commit `c13140ef999a16922bac692d7ae32b4094a82fd2`.
- Sin cambios destructivos de tablas, identidades, membresías o cosméticos. `score` sigue siendo alias de capital final.
