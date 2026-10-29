# RUNWAY — IslandDAO: instrucciones de hosting

## Qué entregar y subir

Este ZIP contiene el videojuego compilado con React 19, Three.js/R3F, TypeScript y Vite. No requiere Node, npm, compilación ni un servidor de aplicaciones en el hosting de destino.

1. Extraer `RUNWAY-ISLANDDAO-PRODUCTION.zip` en una carpeta local.
2. Subir **la carpeta `islanddao` completa** al directorio público de `humanfriendly.global`. El resultado debe ser `https://humanfriendly.global/islanddao/index.html`, no `/islanddao/islanddao/index.html`.
3. No subir este manual. No reemplazar archivos del sitio principal ni copiar el contenido de `islanddao` en la raíz del dominio.
4. Servir `https://humanfriendly.global/islanddao/` mediante HTTPS, con `index.html` como documento predeterminado. Redirigir `/islanddao` a `/islanddao/` preservando los parámetros de consulta.
5. En actualizaciones, subir primero los recursos y por último `index.html`. Es preferible reemplazar la carpeta de forma atómica. Conservar una copia de la versión previa para rollback. Invalidar caché de archivos sin hash.

La navegación usa estados de interfaz y parámetros como `?join=ABCDEF1234`; no necesita un fallback SPA global. No redirigir recursos inexistentes a HTML: deben responder 404. Cualquier regla debe limitarse a `/islanddao/`.

## Requisito pendiente: autorización de la API existente

El cliente conserva la API `https://runway-api.agenciahumanfriendly.chatgpt.site/api`. **Antes de habilitar las funciones online, el responsable de esa API debe autorizar el origen exacto `https://humanfriendly.global`.** Esta autorización no puede hacerse desde el ZIP ni desde el servidor estático.

Debe permitir:

- `Origin: https://humanfriendly.global` (sin `/islanddao/` y sin barra final).
- Preflight `OPTIONS`, y solicitudes `GET` y `POST`.
- Encabezados `Authorization` y `Content-Type`.
- Respuestas CORS adecuadas también en errores: `Access-Control-Allow-Origin: https://humanfriendly.global`; `Vary: Origin` cuando la respuesta dependa del origen.

La API ya tiene una lista de orígenes permitidos. Su responsable debe ampliar esa lista y publicar el cambio por su procedimiento habitual. **No se ha accedido ni modificado la API ni Cloudflare en esta entrega.** Si esta autorización falta, puede cargar el juego local, pero rankings, startups, invitaciones y verificación online no estarán operativos. No presentar esto como una migración completa del backend.

Después de habilitar el origen, comprobar desde el dominio real: identificación, ticket de partida, envío de resultado, rankings, startup e invitación. No hacen falta nuevas tablas, endpoints ni servicios para alojar este paquete.

## Recursos, MIME y seguridad del sitio

Todas las rutas públicas del build están prefijadas con `/islanddao/`. Conservar nombres y mayúsculas/minúsculas de los archivos. MIME recomendados:

| Extensión | Content-Type |
| --- | --- |
| `.html` | `text/html; charset=utf-8` |
| `.js` | `text/javascript; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.png`, `.webp`, `.svg` | `image/png`, `image/webp`, `image/svg+xml` |
| `.glb` | `model/gltf-binary` |
| `.ttf` | `font/ttf` |
| `.mp3`, `.m4a`, `.wav` | `audio/mpeg`, `audio/mp4`, `audio/wav` |
| `.txt` | `text/plain; charset=utf-8` |

HTTPS es necesario para sensores, audio tras interacción y algunas funciones del navegador. No bloquear WebGL/Web Audio ni sensores de movimiento con políticas del servidor. Si el sitio usa CSP, autorizar los scripts y recursos propios de `/islanddao/`, imágenes `data:`/`blob:`, estilos inline utilizados por React/R3F y el estilo inicial de `index.html`, y `connect-src` hacia la API indicada y el propio origen para modelos/audio. Adaptar una CSP existente de forma acotada; no deshabilitar la protección del sitio principal. El juego se entrega como página propia, no requiere iframe.

Compresión gzip/Brotli opcional para HTML/JS/CSS/texto. Los PNG y audios ya están comprimidos. Caché sugerida:

- `index.html`, `curtain.css`, `licenses.txt` y recursos con nombre estable: `Cache-Control: no-cache` (permite guardar y revalidar).
- Bundles generados `assets/index-<hash>.js`, `assets/index-<hash>.css`, `assets/three-<hash>.js`: `Cache-Control: public, max-age=31536000, immutable`.
- No aplicar `immutable` a todo `assets/`: los modelos, logos y sonidos mantienen nombres estables.

Conservar `licenses.txt` y avisos de fuentes: son accesibles desde créditos. No es necesario añadir service workers ni configuración de Cloudflare.

## Progreso e invitaciones

Las invitaciones generadas por este paquete apuntan a `https://humanfriendly.global/islanddao/?join=…`. Conservar los parámetros al redirigir.

El progreso, saldo SHOP, preferencias e identidad del navegador se guardan por origen. Los guardados del dominio anterior **no se trasladan automáticamente** a `humanfriendly.global`; allí se iniciará una identidad local nueva. Los históricos de la API se conservan, pero no se añade recuperación/migración de cuentas en esta entrega. Tampoco se comparten guardados entre navegadores o dispositivos.

## Comprobación del administrador

Abrir la URL en móvil y desktop, completar la carga, abrir tutorial y SHOP, jugar y reintentar. Comprobar en la consola/red que no hay 404 ni recursos solicitados accidentalmente a `/assets/` en la raíz. Probar música mediante un toque del usuario, ya que el autoplay sin interacción está bloqueado por los navegadores. Probar también una invitación y recargarla.

La entrega se valida localmente extrayendo el ZIP y sirviéndolo bajo `/islanddao/`, con API simulada para no contactar producción. Esa prueba no certifica la configuración del hosting real, su CSP/CORS ni rendimiento en teléfonos físicos. El informe de la entrega, tamaño y SHA-256 se entregan por separado, fuera de la carpeta pública.

## Regenerar desde el proyecto de desarrollo

Sólo el desarrollador necesita Node 24 y las dependencias fijadas del proyecto. En la carpeta `runway`, ejecutar `npm run package:hosting`.

El comando verifica tipos, compila con base `/islanddao/` en un directorio temporal, genera y audita el ZIP y muestra tamaño y SHA-256. No publica ni accede a la API. El resultado se escribe en `../entregas/RUNWAY-ISLANDDAO-PRODUCTION.zip`. Requiere Python 3 local para el ZIP, sin instalar nuevas dependencias. El administrador recibe los archivos ya compilados.
