# Tanda 4/5 — HUD, resultados y branding (`hud-27`)

Fecha: 20-10-2026. Base publicada: `npc-26`, commit `783ec13ba085e3e4b2552cb6b6c6ed252ccf90dd`. Alcance exclusivo de la tanda 4.

## Implementado y comprobado

- **Menú:** PNG RUNWAY oficial, saldo real de SHOP, identidad con retrato PERKS/nombre/startup arriba a la izquierda, PLAY amarillo y navegación con superficies facetadas cyan. Entrada de marca, identidad y acciones; pulsación inmediata. Se conserva la escena 3D existente.
- **HUD:** gráfico de diez segundos a todo el ancho seguro, 120–140 px de alto, detrás del importe; segmentos verdes/rojos por cada cambio real, incluidos cambios del mismo tick. Dominio suavizado, línea estable si no hay eventos. Ninguna fluctuación inventada.
- **Contador:** spring continuo, intensidad acumulada por importe y hasta cinco recogidas consecutivas; recuperación gradual. Escala acotada a 0,94–1,15 y espacio reservado al calcular la fuente. Pérdidas rojas con prioridad y reinicio de la intensidad positiva. Pausa congela la presentación.
- **Victoria:** YOU LANDED en cabecera LED neón, entrada con overshoot y panel financiero inspirado directamente en la referencia. Replay de dos segundos después de la entrada; dinero final, gráfico ancho, INITIAL/GAINS/LOSSES/BONUS, BACK TO AIRPORT, ONE MORE RUN y recibo real de SHOP. El estado de verificación conserva la distinción entre vuelo local y ranking confirmado. Derrota usa RUN LOST y saldo cero.
- **Personaje en resultados:** cámara final consume el espacio realmente disponible entre los paneles, mediante ResizeObserver y el estado de presentación. Cambia encuadre/distancia solo en resultados. La cámara de vuelo, animación y reglas permanecen iguales. Comprobado cuerpo/casco completos en las cuatro relaciones de aspecto.
- **MY STARTUP:** auditados los endpoints existentes. Presenta la suma de los mejores vuelos verificados de hasta tres fundadores, cada contribución, asientos libres, invitación y acceso al ranking. Explica que el saldo de SHOP es independiente y cuándo se fija la membresía. Carga/error/vacío diferenciados; cambiar crew queda subordinado y se oculta cuando la membresía está bloqueada. Crear/unirse conserva los endpoints y reglas existentes.
- **Créditos:** PNG Human Friendly original; cuatro nombres preservados. Eliminadas las secciones redundantes ISLAND OUTLINE/MAP SOURCE. © OpenStreetMap, ODbL y avisos de terceros continúan accesibles en LICENSES & DATA.
- **Accesibilidad:** movimiento reducido sin rebotes, datos intactos; nombres accesibles, contraste sobre panel navy, importes responsivos y márgenes seguros.

No se generaron ni alteraron los PNG oficiales. [Hashes SHA-256 idénticos a los originales](evidence-hud27/original-assets.json). El logo RUNWAY añade 1.025.371 bytes al paquete; se precarga y decodifica durante el inicio. El logo HF se carga al abrir créditos.

## Validación focalizada

- TypeScript y build de producción aprobados. Se conserva el aviso existente de tamaño del chunk de Three.
- **5 pruebas unitarias**: replay económico, mismo tick, cero, ventana móvil, agrupación y dirección por segmento.
- **8 pruebas Chromium/WebKit aprobadas, cero flaky**, con capturas y vídeos. Formatos 390×844, 360×640, 844×390 y 1440×900. No equivale a probar teléfonos físicos.
- Cinco SOL consecutivas produjeron escalas aproximadas **1,040 → 1,058 → 1,072 → 1,085 → 1,099**. Comprobado máximo 1,15, prioridad de pérdida y congelación en pausa.
- Replay real del controlador existente, semilla 17 / Jurerê: **5.000 + 1.165.000 − 0 + 585.000 = 1.755.000**. Importe final y crédito en SHOP coincidentes. Un vuelo inmóvil termina derrotado con cero. Retry y regreso al menú comprobados.
- Formularios MY STARTUP: offline/reconexión, creación, unión y membresía bloqueada con API controlada; total de prueba **750.000 + 500.000 = 1.250.000**. No se crearon equipos ni registros competitivos de QA en producción.
- Saldos grandes del menú (12.345.678) y gráfico/contador/resultados dentro del ancho disponible en los formatos comprobados.
- Resultado 3D: muestras **38–40 draw calls / 47.757–48.493 triángulos**. El gráfico usa SVG, sin nuevos pases WebGL. No es una prueba sostenida de rendimiento físico.
- Las primeras comprobaciones detectaron y corrigieron el mensaje offline persistente tras reconectar y el personaje parcialmente oculto por resultados. La medición inicial del cuerpo incluía el canopy desprendido: se corrigió usando nodos explícitos de rig/casco. Movimiento reducido se valida contra la regla global existente que elimina las animaciones.

[Resultados y medidas verificables](evidence-hud27/verified-tests.json).

## Evidencia visual

- Menú: [antes](evidence-hud27/before-menu.png) / [después](evidence-hud27/menu-mobile.png).
- Resultados, misma semilla/input: [antes](evidence-hud27/before-results.png) / [después](evidence-hud27/results-mobile.png).
- [Móvil pequeño](evidence-hud27/results-small.png), [horizontal](evidence-hud27/results-landscape.png), [desktop](evidence-hud27/results-desktop.png).
- [HUD con pérdida](evidence-hud27/hud-loss.png), [derrota](evidence-hud27/defeat.png), [MY STARTUP](evidence-hud27/startup.png), [créditos](evidence-hud27/credits.png).
- Vídeos y capturas por navegador: `reports/evidence-hud27/accepted/`.

## Pendientes reales y publicación

- Pruebas en iPhone/Android físicos, áreas seguras físicas y rendimiento sostenido: pendientes. Solo se acredita emulación de navegador.
- Validación de crear/unirse contra API real no ejecutada para evitar datos de prueba públicos; contrato inspeccionado y flujo verificado con respuestas controladas.
- Valoración artística final del usuario; la referencia se tradujo a UI real responsive, no a una captura estática con cifras pintadas.
- Tanda 5 y otras solicitudes anteriores fuera de este alcance: no iniciadas.
- Frontend publicado como `hud-27`, versión 28. API, reglas, rutas, economía, identidades y persistencia conservadas.
- Rollback `npc-26`, versión 27: `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_93937fa874a4819189d7bed6400ddc32`.

## Publicación confirmada

Sites confirmó el despliegue el 20-10-2026 a las 17:09 UTC. [Registro de versión, SHA y rollback](evidence-hud27/publication.json). [Smoke público](evidence-hud27/public-smoke.json): build hud-27, menú/créditos móviles revisados, ambos PNG cargados y ningún error JavaScript. API bloqueada en esta prueba para no generar identidades ni runs públicos de QA.
