# WORLD-39 — Tanda 3/7: Florianópolis World Overhaul

Implementado y verificado el 21 de octubre de 2026. Solo presentación del mundo: se conservan costa OSM, alturas físicas, controles, pickups, colisiones, rutas de vuelo, economía, API y reglas competitivas. Base y rollback: `sky-38`.

## Diagnóstico y cambios

| Requerimiento | Estado | Cambio y comprobación |
| --- | --- | --- |
| Pasto sobre superficies verdes | IMPLEMENTADO | La exclusión usada para árboles también vaciaba el corredor de vegetación baja. Ahora hay 2.230 posiciones deterministas y hasta 768 matas visibles, frente a 1.253 / 256 en la base. Cinco hojas curvadas por mata, diez triángulos, variación de escala y giro, viento en shader y reducción de altura por distancia. Sin atlas transparente ni capas de overdraw. Se mantienen libres asfalto, arena, edificios y plataformas. |
| Árboles y palmeras | IMPLEMENTADO | 112 árboles frente a 96. Dos palmeras con troncos curvos y nueve hojas arqueadas en detalle cercano; árbol costero de copa agrupada. LOD, máximo 16 árboles detallados y descarte por frustum. Bases apoyadas en los triángulos visibles del terreno. |
| Rocas grises costeras | IMPLEMENTADO | 306 ubicaciones candidatas a lo largo de la costa, tamaños grandes y pequeños, excluyendo puente y plataformas. Máximo 48 visibles: hasta 16 de 80 triángulos y las restantes de 20. Material gris con variación mineral y geometría asimétrica. |
| Red vial y puente | IMPLEMENTADO | Seis trazados conectan el acceso existente, la espina norte/sur, el sector urbano y un ramal lateral. Distancias horneadas en una textura compartida; asfalto, líneas y banquinas se dibujan sobre el terreno real, sin una segunda superficie coplanar. El primer nodo coincide exactamente con el anclaje del puente. No se altera su geografía ni la costa. |
| Autos | IMPLEMENTADO | Diez autos instanciados, recorridos continuos con carriles y retornos curvos. Apoyo en cuatro ruedas sobre la malla renderizada, inclinación longitudinal y lateral. Se prueban continuidad, permanencia en tierra y separación de edificios/plataformas. Son tráfico decorativo; no incorporan física vial ni semáforos. |
| Vida aérea | IMPLEMENTADO | Seis de las quince aves existentes acompañan al jugador durante el planeo; se conservan otras bandadas distribuidas. Cinco paracaidistas ambientales con descenso, suspensión y balanceo, y tres globos distantes. Separados del corredor central y de los objetos de recompensa. |
| Vida marítima | IMPLEMENTADO | Cinco barcos en recorridos elípticos verificados fuera de la costa, diez nadadores con movimiento de brazos y piernas, y conservación de las cuatro motos de agua y sus estelas. Las rutas no cruzan la isla ni modifican colisiones. |
| NPCs | IMPLEMENTADO | Se conserva el sistema de 64 habitantes articulados. Mayor escala corporal y casco LED proporcionado al lenguaje del piloto; pies sobre la superficie renderizada. Se descartan cuerpos y sombrillas fuera del encuadre. Caminata, conversación y descanso reutilizan los comportamientos existentes. |
| Plataformas | IMPLEMENTADO | La causa del clipping eran triángulos de tierra que atravesaban los círculos analíticamente aplanados. La triangulación ahora tiene huecos de 32 lados coincidentes con cada plataforma. Se conservan radios y alturas físicas. Nuevos bordes, señal central, balizas y materiales. Verificación por rayos en las tres zonas. |
| Luces móviles | IMPLEMENTADO | Dos proyectores por destino, haces elevados con barrido lento, un único draw call instanciado y sin pases de sombras adicionales. Pausa congela el movimiento. |
| Fuegos artificiales | IMPLEMENTADO | Tres explosiones de color, 192 partículas en un único draw call, gravedad, amortiguación y desaparición. Requieren `landed`, destino válido, posición dentro de su radio y altura real de contacto. No conceden dinero. Agua, bancarrota y tierra fuera de plataforma no los disparan. El reloj del material se verifica además del flag de activación. |
| Lugar real del evento | PREPARADO, SIN RECONSTRUIR | Se mantiene `jurere-event-venue`, origen en el destino, metros/Y arriba/+Z hacia aproximación y grupo visual reemplazable. Ninguna casa nueva ni afirmación de reproducción arquitectónica. |

La red vial es una interpretación simplificada adaptada al mundo comprimido, no un levantamiento de calles. Orientación apoyada en la relación Centro–Norte de la [SC-401, fuente ALESC](https://www.alesc.sc.gov.br/radio/noticia/audiencia-publica-debate-obras-de-ampliacao-da-sc-401-na-capital/) y conexiones de las SC-402/404/405 documentadas por la [Secretaria da Infraestrutura e Mobilidade](https://www.sie.sc.gov.br/webdocs/sie/doc-rodoviario/Denomina%C3%A7%C3%A3o-de-Rodovias-SC16fev2023-Ordenadas-por-Rodovia.pdf). La atribución OSM existente se conserva.

## Validación ejecutada

- TypeScript y build de producción.
- **15/15 pruebas técnicas**: `tests/world39.test.ts`, `island29.test.ts`, `sky38.test.ts`, `camera.test.ts`. Incluyen conexión al puente, carreteras sobre tierra y fuera de edificios, retornos continuos, apoyo sobre relieve, huecos de plataformas, distribución reproducible, rutas marítimas, presupuestos de geometría y continuidad de cámaras sobre el terreno modificado.
- **8/8 pruebas de navegador**, Chromium y WebKit, `tests/browser/world39.spec.mjs`. Vuelo completo en tiempo real a Jurerê; aproximación y aterrizaje reales en South Beach a 320×568 e Island Terrace a 844×390; movimiento ambiental, pausa y ausencia de fuegos fuera de plataforma. Viewports Pixel 7 e iPhone 13 emulados para el vuelo completo.
- Los seis vuelos/aterrizajes comprobados coinciden con el replay de la simulación compartida. El vuelo completo de semilla 17 conserva **1.657.500** en Jurerê. Ningún cambio en el archivo del núcleo ni en el backend; no se ejecutó un nuevo replay remoto contra la API.
- Cero errores de página/shader en los escenarios. Separación de cámara al terreno comprobada durante los tres aterrizajes; no se modifica su trayectoria cinematográfica.
- Revisadas capturas reales desde el avión, planeo, isla, costa, barcos, nadadores, globos y paracaidistas. Revisada la aparición efectiva de partículas en el encuadre de victoria, además de su telemetría.
- La primera medición excedía ligeramente 90.000 triángulos. Se corrigió con culling de árboles/habitantes y LOD de rocas, preservando el detalle cercano. Las primeras pruebas de aproximación tenían un adelanto de simulación en tick impar; se corrigió el arnés para continuar en frontera de input, y la igualdad de replay pasa en los seis casos finales.

## Rendimiento y memoria

Mediciones sobre Apple M5 con Metal en Chromium y WebKit local. Los intervalos `requestAnimationFrame` incluyen capturas/grabación; no son tiempos GPU aislados ni equivalen a teléfonos físicos. Los contadores del renderer incluyen los pases de render.

| Vuelo completo | Mediana | P95 | Máximo draw calls | Máximo triángulos |
| --- | ---: | ---: | ---: | ---: |
| Base sky-38 / Chromium, registro anterior | 8,3 ms | 9,1 ms | 57 | 79.539 |
| world-39 / Chromium | 8,3 ms | 10,0 ms | 60 | 88.051 |
| Base sky-38 / WebKit, registro anterior | 17,0 ms | 20,0 ms | 57 | 79.695 |
| world-39 / WebKit | 17,0 ms | 20,0 ms | 60 | 87.863 |

Además se tomó una base nueva antes de editar, con cámaras idénticas de aproximación/planeo/aterrizaje. En Chromium, P95 de 9,1/9,2/9,1 ms antes y 9,9/9,9/9,9 ms después. La tabla completa está en `summary.json`.

Buffers de geometría estimados de las mallas de escena: **4.439.152 → 4.761.104 bytes** (+321.952). Texturas registradas: **22 → 23**. La nueva textura vial ocupa 3.108.800 bytes base, aproximadamente 4,15 MB con mipmaps. Se reutilizan materiales, instancias y targets existentes; no hay nuevas capturas de reflejo ni mapas de sombras. Estas cifras son tamaños de buffers y contadores de recursos; **el navegador no expone la VRAM real del driver**.

## Evidencia y reproducción

- [Comparador antes/después y grabación](comparison.html).
- [Resumen medido](summary.json), [comprobaciones geométricas](geometry-checks.json).
- `scripts/qa-world39.mjs before|after chromium` registra las cámaras fijas con el servidor en 5183.
- `scripts/qa-world39-detail.mjs` registra detalles de los assets y partículas dentro de la escena.
- `RUNWAY_BASE_URL=http://127.0.0.1:5183 npx playwright test tests/browser/world39.spec.mjs --workers=1 --output=reports/world39/final` reproduce la validación de ambos motores.
- Capturas seleccionadas en `preview/`; vídeos, trazas y métricas completas de `before/`, `after/`, `draft/` y `final/` permanecen locales y excluidos de Git por tamaño.

## Pendientes reales y compatibilidad

- **Pendiente:** diez minutos sostenidos en iPhone y Android físicos. No disponibles en esta intervención; no se certifica rendimiento térmico ni memoria de esos dispositivos.
- Las fotografías y la reconstrucción del lugar real siguen pendientes de las referencias del usuario, deliberadamente fuera de esta tanda.
- No se avanzó a la tanda siguiente. No se añadieron mecánicas, dependencias, música, sonidos ni cambios competitivos.
- Frontend `world-39`; publicación registrada aparte en `publication.json` tras desplegar.
- Rollback: `sky-38`, commit `d2b5ea1ffecc8b1bf517d9465f29522ca49163be`, Sites versión 39, `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_38027f1c39c08191a33aca62dc640312`. API conservada: versión 19, commit `2c119322b84673921c3d9d743847f0f1730ea0fe`, reglas `runway-3.2.0-chains`, contenido `island-routes-10`.
