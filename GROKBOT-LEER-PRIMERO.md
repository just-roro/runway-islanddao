# Instrucción para Grokbot

Quiero subir este paquete de RUNWAY / IslandDAO a mi GitHub. Ejecutá la carga usando tu conexión autorizada a GitHub.

1. Leé `README.md`, `docs/ESTADO-EXPORTACION.json` y el manifiesto. Esta entrega es PARCIAL: no digas que contiene todo el código de la v47.
2. Verificá la cuenta autenticada. Si no está definido el destino, preguntame únicamente usuario/organización y nombre de repositorio. Sugerencia: `runway-islanddao`. Si no existe, crealo PRIVADO. Si existe, trabajá en una rama nueva y prepará un PR; no reemplaces archivos existentes sin revisar diferencias y no hagas force push.
3. Extraé el ZIP. Subí el CONTENIDO de `RUNWAY-GITHUB-HANDOFF/` a la raíz del repositorio, manteniendo `public/`, `api/` y `docs/`. No subas solo el ZIP ni agregues una carpeta contenedora redundante.
4. Conservá todos los assets, lockfiles, SQL, licencias y documentación. No incluyas credenciales, `.git`, `node_modules`, `.env`, estado local de Wrangler o bases de datos de jugadores.
5. Usá como mensaje de commit: `Import RUNWAY available frontend build and API v28 source; v47 source pending`.
6. Antes del push verificá el manifiesto, la cantidad de archivos y que ningún archivo supere el límite permitido por GitHub. No ejecutes scripts de despliegue. Para esta carga no hace falta instalar dependencias ni compilar.
7. Entregame el enlace del repositorio (o PR), el SHA del commit y la lista breve de faltantes. No habilites GitHub Pages, Actions de despliegue ni cambies Cloudflare, Sites, DNS o la API: el pedido es guardar los archivos en GitHub.

## Recuperar la última versión completa

Falta el código editable del frontend y el estado de la v47. Debe conseguirse desde el proyecto original de desarrollo o cuando vuelva a estar disponible el repositorio de Sites. Referencia de la fuente faltante:

- Proyecto: `appgprj_6acfeda93e2c8191a478eae796d0d3dd`.
- Versión guardada: 47.
- Commit: `e58d1fd3366258686830d116d2c6db5d80c5de32`.
- Sitio: https://runway-islanddao.agenciahumanfriendly.chatgpt.site

La credencial de Sites es temporal y no está incluida. No intentes adivinarla. Si el usuario te proporciona el proyecto local más reciente, comparalo con estas referencias y sumalo como una actualización separada. No reconstruyas React/TypeScript a partir del JS compilado fingiendo que es la fuente original.

## Hosting actual

El build exportado usa `/islanddao/` y la API `https://runway-api.agenciahumanfriendly.chatgpt.site/api`. `public/index.html` forma parte del paquete Direct Upload y `public/islanddao/` contiene el juego. Para alojarlo luego, el directorio de publicación sería `public/`; el backend requiere su propio runtime y D1. GitHub Pages por sí solo no ejecuta esa API.

El handoff histórico de Cloudflare está en `docs/`. Su nota CORS era pendiente en esa conversación: el código de API v28 recuperado sí incluye `https://humanfriendly.global` y `https://runway-islanddaoxhumanfriendly.pages.dev` en `api/lib/competitive.ts`. Esto no certifica una nueva prueba end-to-end ni el estado actual de la ruta del dominio.
