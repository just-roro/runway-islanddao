# RUNWAY — validación del paquete de hosting

ZIP: `RUNWAY-ISLANDDAO-PRODUCTION.zip`  
Tamaño: **10,559,886 bytes / 10.07 MiB**  
SHA-256: `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`

## Implementado

- Producción minificada con React 19.3.0, R3F 9.8.1, Three 0.186.1, TypeScript 6.0.3 y Vite 8.3.4. Dependencias y configuración gráfica sin cambios.
- Base `/islanddao/`; función compartida para URLs de modelos y su recuperación, retratos, precargas, imágenes, audio y licencias. Vite transforma también HTML y fuentes CSS. Build habitual de raíz conservado.
- Invitaciones del paquete a `https://humanfriendly.global/islanddao/?join=…`, tanto para compartir como copiar.
- `npm run package:hosting`: tipos, build temporal aislado, ensamblado, ZIP, auditoría y SHA-256. Sin publicar, instalar dependencias nuevas ni contactar la API.
- ZIP con 105 archivos de ejecución dentro de `islanddao/` y el manual fuera. Sin código fuente, node_modules, sourcemaps, credenciales, herramientas de QA ni configuración de Sites.
- Excluidos del paquete cuatro recursos sin consumidores actuales: favicon SVG anterior, logo SVG anterior, logo Human Friendly anterior y copia JSON de geografía no utilizada en runtime. La costa actual sigue incluida en el bundle de simulación; no se alteró.
- Gameplay, economía, reglas competitivas, diseño, materiales y animaciones no modificados. API y sitio principal intactos.

## Pruebas aprobadas

1. TypeScript y build minificado de subdirectorio. Build habitual de raíz. Una prueba automatizada de URLs para ambas bases e invitaciones con parámetros codificados. `git diff --check`.
2. Extraído el ZIP final, servido con un servidor HTTP estático en `/islanddao/`. Los **105 recursos** devolvieron el contenido exacto del ZIP, comprobado byte por byte. Redirección de barra final preserva `?join=`.
3. Chromium Pixel 7 emulado (412×839), Chromium desktop (1440×900), WebKit iPhone 13 emulado (390×664, configuración de Playwright), WebKit desktop (1440×900).
4. En las cuatro combinaciones: carga sin caché previa, menú, HOW TO PLAY, SHOP/categorías/modelos, invitación compartida y copiada, recarga con `?join=`, STARTUP, RANKING vacío y error controlado, partida en tiempo real, resultado de bancarrota, ONE MORE RUN, pausa y BACK TO PLANE.
5. Cinco GLB y doce retratos cargados; fuentes y licencias disponibles. Sin 404 locales, solicitudes accidentales a `/assets/` raíz, errores de página/módulo ni solicitudes externas no previstas.
6. Instrumentación de Web Audio: **69 archivos decodificados**, cero errores de decodificación y fuentes de audio iniciadas tras interacción en cada configuración. Esto verifica carga y reproducción programática; no equivale a una escucha crítica de la mezcla.
7. Todas las solicitudes a la API fueron interceptadas en Playwright con respuestas controladas. No se certifican datos reales ni CORS mediante estos mocks.
8. Capturas guardadas y revisadas de menú y resultados móviles; vídeos de los recorridos en `qa/`. El build entregado no contiene ni habilita hooks de desarrollo.

Una primera ejecución Chromium desktop falló al esperar la respuesta simulada del ranking mientras corría también la compilación. La repetición aislada del mismo ZIP pasó completa. Se conservan ambos registros; no se modificó el juego ni se ocultó el fallo inicial.

Avisos de build: el bundle de Three supera 500 kB, como en la base existente; se conserva su separación. Vite avisa que `curtain.css` con base explícita se resolverá en runtime; su archivo fue comprobado por HTTP y en las cuatro cargas de navegador.

## Pendientes reales

- El responsable de la API debe autorizar `https://humanfriendly.global` (OPTIONS, GET/POST, Authorization/Content-Type). El paquete no puede habilitarlo. Sin ello, las funciones online no estarán operativas desde el dominio nuevo.
- Configuración final de hosting, HTTPS, CSP, MIME, caché y prueba online desde la URL definitiva. No se publicó ni se accedió a Cloudflare.
- Teléfonos físicos, sensores reales y rendimiento sostenido no probados; los formatos móviles son emulados en esta máquina.
- No se completó un aterrizaje exitoso en este smoke test: las cuatro partidas sin maniobras terminaron en bancarrota. El recurso LANDED está incluido y comprobado por HTTP; no se afirma haber revalidado la celebración de victoria.
- El guardado/identidad del navegador no migra entre dominios. Los históricos existentes no se modificaron.

## Regeneración y repetición

En el proyecto `runway`, con Node 24 y dependencias ya instaladas:

```sh
npm run package:hosting
```

En esta máquina, si el PATH tiene otra versión de Node, el comando utilizado fue:

```sh
PATH=/Users/nacho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run package:hosting
```

El ZIP se regenera en `../entregas/`. El script imprime tamaño y SHA-256 y reemplaza `PACKAGE-METADATA.json`, marcando que la nueva versión requiere su propia QA. Este informe y las capturas corresponden sólo al SHA-256 indicado arriba.

Para repetir QA, extraer el nuevo ZIP en `/private/tmp/runway-hosting-qa`, servir esa carpeta en `127.0.0.1:5191` y ejecutar `node scripts/qa-hosting.mjs` desde `runway`. El script intercepta toda salida de red externa; el administrador del hosting no necesita estas herramientas.
