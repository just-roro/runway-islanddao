# RUNWAY — Tanda 7/7 · Cosméticos, desbloqueos y economía

Entrega local · 22 de octubre de 2026. No se publicó el frontend ni la API. No se regeneró el ZIP de producción.

## IMPLEMENTADO

### Catálogo y arte

- **94 accesorios originales** extraídos de la copia local `IslandDAO Assets.fig`: 12 básicos, 58 intermedios, 24 premium. Ninguna imagen faltante ni sustitución inventada.
- Son capas del retrato LED compatibles con su piloto de origen. No añaden mallas, huesos ni colliders. El inventario conserva nombres originales, incluso sus erratas.
- Composición base + accesorio en el lienzo original de 880 × 880. Un encuadre común por piloto contempla todos sus sombreros/halos; exportación a 256 × 256 con filtrado nearest. Dos ranuras de textura por actor permiten el cambio suave sin conservar las 94 composiciones en GPU.
- Cada piloto recuerda un accesorio o ninguno. Los mensajes y expresiones tienen prioridad sobre el retrato.
- **8 paracaídas nuevos**: Azure, Pearl, Tropical Split, Sunset Duo, Racing Checker, Ocean Waves, Constellation, Aurora. UV y patrones en el material existente; vértices, cuerdas, apertura y desprendimiento conservados.
- **6 trails nuevos**: Sky, Coral, Golden Stars, Bubbles, Cloud Mist, Comet. Un sistema instanciado activo, máximo 192 partículas y 96 para humo. Forma, tamaño, duración y movimiento diferenciados; emisión por velocidad.
- **8 bordes LED nuevos**: Lagoon, Solar, Violet, Sunset, Duo Tone, Pixel Chase, Aurora, Gold Circuit. Parámetros del shader actual, sólo franjas superior/inferior. Original continúa gratis.
- Catálogo final: **137 productos** (12 pilotos, 94 accesorios, 12 paracaídas, 10 trails, 9 bordes LED). Los productos anteriores conservan precios y propiedad.

### SHOP

- PILOTS / ACCESSORIES / PARACHUTES / TRAILS / HELMET, con miniaturas de los assets y capturas del render real.
- Filtro de accesorios por piloto, vista previa de pilotos bloqueados y compra condicionada a poseer el piloto compatible.
- Compra y equipamiento en una acción; drops sólo desbloquean. Opción de quitar accesorio.
- Botones, navegación y composición mantienen dimensiones estables al cambiar estado; comprobados en 360 × 640, 390 × 844, 844 × 390 y 1440 × 900.
- Recogida provisional muestra el nombre y `LAND TO KEEP`; resultados ofrecen acceso al producto adquirido.

### Economía y persistencia

| Nivel nuevo | Precio |
|---|---:|
| Básico | 1.000.000 SOL |
| Intermedio | 5.000.000 SOL |
| Premium | 15.000.000 SOL |

- `ShopAccount` v2 migra saldo, ingresos, recibos, compras y selecciones v1. Conserva cosméticos y objetivos históricos; no reconstruye dinero a partir del PB.
- Rare Cargo tiene **4% total** por partida elegible, configurable entre 2% y 5%, máximo uno. Elegibilidad: accesorio no adquirido para un piloto ya poseído.
- Selección reproducible con semilla independiente; peso por accesorio básico 4, intermedio 2, premium 1. Estos pesos no suman probabilidades de aparición.
- Intento con ID persistido, selección fija —también cuando es vacía— y estados `active`, `abandoned`, `settled`. Recoger es provisional; aterrizar desbloquea; equipar es una acción posterior.
- Derrota, abandono y reinicio no conceden el accesorio. Eliminada la concesión antigua que guardaba raros aun después de perder.
- Capital, objetivos y accesorio se liquidan en una única escritura local idempotente. Compras y liquidación leen el último perfil y usan Web Locks entre pestañas. Fallo de almacenamiento no confirma compra ni recompensa.
- Si otra pestaña compra el mismo accesorio, no se duplica, compensa con dinero ni sortea otro.
- Almacenamiento local, sin protección contra edición manual del guardado. No se añadió otro saldo, endpoint o tabla.

### Compatibilidad y correcciones necesarias

- Reglas competitivas `runway-3.2.0-chains` conservadas; contenido `island-cosmetics-11` actualizado también en la **copia local** del núcleo de API. PB e históricos no se reinician.
- Comparación SHA-256 de objetos no raros en 1.000 semillas contra la base anterior: idénticos IDs, posiciones, valores y rutas. El contacto Rare Cargo continúa con valor económico cero.
- Todas las nuevas rutas públicas usan `BASE_URL` para `/` y `/islanddao/`.
- Durante QA se corrigió la actualización del uniform efectivo del trail: la previsualización podía cambiar de producto manteniendo la forma anterior.
- Se corrigió la liberación de las texturas de huesos de los actores retirados del carrusel. La limpieza anterior liberaba materiales, pero conservaba esas texturas. No se modificaron poses ni rig.

## Simulaciones reproducibles

Son controladores automatizados; **no son pruebas de jugadores humanos**.

### Aparición y selección: 100.000 semillas por configuración

| Configuración | Apariciones | Tasa medida | Básicos / intermedios / premium | Máximo por intento |
|---|---:|---:|---|---:|
| 2% | 2.005 | 2,005% | 500 / 1.235 / 270 | 1 |
| 4% | 3.944 | 3,944% | 992 / 2.426 / 526 | 1 |
| 5% | 4.920 | 4,920% | 1.226 / 3.044 / 650 | 1 |

Distribución calculada con los doce pilotos poseídos y los 94 accesorios sin comprar. Los pesos se renormalizan según inventario; un inventario compatible completo no genera recompensa.

### Adquisición efectiva, separada de aparición

300 intentos **condicionados a que apareció** Rare Cargo, con controlador que intenta recogerlo: 137 contactos y 137 accesorios conservados tras aterrizar (45,7% de esos intentos). Esta tasa no equivale a la probabilidad de drop por partida y no constituye una estimación humana.

### Ahorro: 10.000 progresiones sobre 900 runs observados

Tres rutas × tres demoras de control × 100 semillas. Se muestrean ingresos efectivos, incluidas derrotas con cero, sin gastar antes del precio objetivo.

| Actualización del controlador | Básico: victorias medianas | Intermedio | Premium | Premium: intentos P10–P90 |
|---|---:|---:|---:|---|
| Cada 2 ticks | 1 | 4 | 11 | 10–12 |
| Cada 8 ticks | 2 | 7 | 19 | 17–21 |
| Cada 16 ticks | 3 | 14 | 39 | 36–43 |

El último grupo necesita una mediana de 40 intentos para 39 victorias. Se mantienen los precios acordados; la diferencia por precisión requiere contraste humano futuro, no un ajuste de reglas en esta entrega.

## PRUEBAS REALIZADAS

- 31 pruebas unitarias focalizadas aprobadas: catálogo, migración, compra, insuficiencia de saldo, compatibilidad, inventario completo, semillas, colisión real de Rare Cargo, concesión única, abandono, derrota, almacenamiento fallido, persistencia, geometría del canopy y partículas existentes.
- Matriz de 16 pruebas de navegador aprobadas en Chromium móvil/desktop y WebKit iPhone 13 emulado/desktop: SHOP, guardado, layout, shader efectivo, recogida provisional, liquidación repetida, resultados, reinicio y vuelo completo con Halo + Aurora LED + Cloud Mist + Aurora canopy.
- 8 comprobaciones adicionales aprobadas: cambios repetidos de accesorios/pilotos y compras/liquidación entre dos pestañas, en los cuatro formatos/motores anteriores.
- 24 cambios de accesorio y 24 cambios de piloto por motor/formato: **29 texturas residentes, sin crecimiento**; el canvas no se reconstruye.
- Revisión visual de hoja de contacto, accesorios sobre cada piloto, estrellas, burbujas, humo, paracaídas, bordes LED, HUD provisional y resultados. Videos continuos de los vuelos y navegación guardados con las capturas.
- Build de producción minificado y TypeScript aprobados. Build alternativo `/islanddao/` generado únicamente en `/tmp/runway-cosmetics-subpath`.
- Cuatro smoke tests del build compilado aprobados: Chromium y WebKit, tanto en `/` como en `/islanddao/`. Carga de 137–138 recursos por prueba, compra/equipamiento en las cuatro categorías nuevas, sin 404, errores JavaScript ni rutas fuera de la base. Debug de escena ausente en producción.
- Las llamadas a API se interceptaron durante QA: ninguna prueba envió compras, partidas o datos a producción.

### Medición de render

Recorrido serial de los 94 accesorios y 31 acabados, seguido de 180 frames de Cloud Mist en el SHOP. Viewport 390 × 844, en el mismo equipo anfitrión; las ejecuciones finales no compartieron carga con otro navegador de QA.

| Medición | Mediana de frame | P95 | Draw calls | Triángulos | Texturas / geometrías |
|---|---:|---:|---:|---:|---:|
| Base Chromium, SHOP anterior | 8,3 ms | 13,1 ms | 39 | 44.774 | 33 / 22 |
| Chromium, catálogo nuevo + humo | 8,3 ms | 8,8 ms | 39 | 44.710 | 29 / 22 |
| WebKit, catálogo nuevo + humo | 17 ms | 21 ms | 39 | 44.710 | 29 / 22 |

Son muestras de la escena de personalización; no demuestran una mejora general de FPS ni sustituyen una sesión sostenida en móvil. Las capturas durante vuelo con cosméticos registraron 29–45 draw calls y 36.006–57.409 triángulos en los instantes muestreados (6, 18 y 36 segundos). No se afirma que sean el máximo de todos los frames.

Los contadores de render incluyen los pases del pipeline existente. Texturas/geometrías cuentan recursos residentes; no son una medición de VRAM en bytes. Los JSON contienen muestras y errores. La prueba funcional del drop combina contacto real con avance acelerado de la simulación hasta el aterrizaje; el vuelo audiovisual completo se prueba por separado en tiempo real.

## PARCIAL / PENDIENTE

- **PARCIAL — rendimiento móvil físico:** se verificaron emulación y motores de escritorio. Falta prueba sostenida de diez minutos en iPhone y Android reales; no se afirma rendimiento de esos equipos.
- **PENDIENTE — balance humano:** las simulaciones permiten comparar precios y probabilidades; falta observar jugadores reales.
- **No incluido por alcance:** publicación y actualización del ZIP. Para una publicación futura deberá desplegarse una pareja frontend/API compatible con el nuevo CONTENT. La API alojada no se modificó ni se validó en vivo.
- No faltan referencias o archivos de los 94 accesorios. No se implementó ninguna tanda adicional.

## Evidencia y regeneración

- [Inventario con procedencia Figma](nft-inventory.csv)
- [Hoja de contacto de los 94 accesorios y 12 bases](nft-contact-sheet.png)
- [Catálogo y precios completos](catalog.json)
- [Datos de simulaciones, ingresos y adquisición](simulation.json)
- [Matriz completa de navegador](browser-full-results.json)
- [Pruebas adicionales de memoria y pestañas](browser-results.json)
- [Galería y métricas Chromium](chromium-render.json)
- [Galería y métricas WebKit](webkit-render.json)
- [Build raíz y subruta](production-results.json)

Desde `runway/`, con Node 24:

```sh
npm run build
npx vitest run tests/cosmetics42.test.ts tests/shop.test.ts tests/gameplay37.test.ts tests/items34.test.ts tests/canopy.test.ts
node scripts/simulate-cosmetics42.mjs
npm run dev
# En otra terminal, con el servidor local en 5180:
npx playwright test -c playwright.cosmetics.config.mjs
node scripts/qa-cosmetics42.mjs chromium
node scripts/qa-cosmetics42.mjs webkit
# Verificación del build en ambas bases, sin regenerar el ZIP:
npx vite build --base=/islanddao/ --outDir /tmp/runway-cosmetics-subpath --emptyOutDir
node scripts/qa-cosmetics42-build.mjs
```

`scripts/export-cosmetics.py` regenera composiciones e inventario desde el Figma local usando Python/Pillow. `--thumbnails` en el recorrido de catálogo regenera miniaturas desde el juego. No se añadieron bibliotecas de ejecución.

ZIP preservado: `../entregas/RUNWAY-ISLANDDAO-PRODUCTION.zip`, 10.559.886 bytes.

SHA-256: `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.
