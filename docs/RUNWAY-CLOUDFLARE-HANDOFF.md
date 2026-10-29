# RUNWAY / IslandDAO — Handoff compacto para otros LLMs
Actualizado: 2026-10-29. Fuente: conversación de despliegue, capturas Cloudflare, PACKAGE-METADATA.json e inspección local de ZIPs. **No equivale a auditoría online de producción.**

## Objetivo
Publicar y actualizar RUNWAY (IslandDAO) en `https://humanfriendly.global/islanddao/` sin alterar el sitio principal `https://humanfriendly.global/`, sin GitHub ni terminal; desarrollo local con Codex/ChatGPT. QR/URL deben permanecer constantes al actualizar el juego.

## Infraestructura comprobada en capturas
- Cloudflare zone `humanfriendly.global`, plan Free; registro A apex `194.242.56.175`, Proxied (nube naranja); `www` CNAME al apex, Proxied. No cambiar registros DNS.
- Captura inicial de Workers Routes: no había rutas. No garantiza ausencia de otras reglas (Redirect/Transform/Origin/Page Rules y prioridades aún requieren revisión).
- Proyectos previos en Workers & Pages: `human-friendly-web`, `human-friendly`, ambos con `Latest build failed` en captura; NO tocar, esto no implica que la web esté caída.
- Cloudflare Pages creado por el usuario: `https://runway-islanddaoxhumanfriendly.pages.dev/islanddao/`. Usuario recibió la URL tras subir un ZIP por interfaz web.
- Worker router creado: `runway-islanddao-router` y `https://runway-islanddao-router.agenciahumanfriendly.workers.dev/islanddao/`. Captura Deployments: `RUNWAY - IslandDAO Router V1`, estado Ready. Inicialmente devolvía Hello World; tras sustituir código, el usuario confirmó que el juego ya abría correctamente en la URL del Worker.
- En la última pantalla, el usuario estaba en **Domains → Add Route**. La ruta había sido propuesta, pero **NO hay confirmación en esta conversación de que el usuario finalmente pulsara Add Route ni de que `humanfriendly.global/islanddao/` esté funcionando**.

## Archivos y contenido verificados localmente
- `RUNWAY-ISLANDDAO-PRODUCTION.zip`: 10,559,886 bytes (10.07 MiB), 106 entradas ZIP; carpeta interna `islanddao/` con `index.html`, `assets` (JS/CSS, Three.js, modelos .glb, imágenes, sonidos, fuentes) y `INSTRUCCIONES-HOSTING.md` fuera de la carpeta pública. ZIP no es código fuente, sino build Vite listo para alojar.
- `PACKAGE-METADATA.json`: base `/islanddao/`; API `https://runway-api.agenciahumanfriendly.chatgpt.site/api`; builtAt `2026-10-22T00:55:33.652Z`; SHA256 del ZIP original `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`. Indica tests TypeScript, Vite, Chromium/WebKit, 105 recursos runtime, audio (69 archivos), etc. **Son resultados consignados por el empaquetador, no una nueva verificación en dominio real**.
- `RUNWAY-CLOUDFLARE-WEB-UPLOAD.zip`: 106 entradas, adaptado para Cloudflare Pages Direct Upload; raíz `index.html` y subcarpeta `islanddao/`. Es el paquete subido según los pasos de la conversación.
- `RUNWAY-CLOUDFLARE-DEPLOY-KIT.zip`: 107 entradas; `dist/islanddao/...` + `wrangler.jsonc` para alternativa CLI. Config: `name=runway-islanddao`, `workers_dev=true`, `assets.directory=./dist`; no se requiere para flujo por navegador.
- Stack según manual incluido en ZIP: React 19, Three.js/R3F, TypeScript, Vite. `index.html` compilado usa rutas absolutas bajo `/islanddao/` y meta build `dao-41a`.

## Código del Worker router mostrado y corregido en esta conversación
```js
const PAGES_ORIGIN =
  "https://runway-islanddaoxhumanfriendly.pages.dev";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/islanddao") {
      return Response.redirect(
        new URL("/islanddao/" + url.search, url.origin),
        308
      );
    }

    if (!url.pathname.startsWith("/islanddao/")) {
      return new Response("Not found", { status: 404 });
    }

    const upstream = new URL(
      url.pathname + url.search,
      PAGES_ORIGIN
    );

    return fetch(new Request(upstream, request), {
      redirect: "manual"
    });
  }
};
```
**Nota:** este es el código instruido, no un volcado independiente del estado activo del Worker. El usuario confirmó que dejó de verse Hello World y cargaba el juego. Revisar cómo se comportan cookies/headers/CORS/redirects si surgen errores.

## Conectar el dominio (solo luego de validar)
1. Cloudflare Dashboard → Workers & Pages → `runway-islanddao-router` → pestaña **Domains** (NO Settings) → **Add Route** (NO Add Domain).
2. Zone: `humanfriendly.global`.
3. Route exacta recomendada en conversación: `humanfriendly.global/islanddao*` (**quitar el `*.` que Cloudflare autocompletó al inicio**). Cubre `/islanddao` y `/islanddao/` y sus assets, pero también cualquier URL que comience con `islanddao`; el Worker responde 404 a prefijos ajenos. Revisar conflictos existentes antes de activar.
4. Failure mode seleccionado en captura: `Fail closed (block)`. Ante errores del Worker puede fallar esta ruta, no todas las páginas del sitio.
5. Antes de Add Route: revisar Redirect Rules y otras reglas de rutas, y que no exista contenido previo en ese prefijo. **En esta conversación no se mostró el inventario de reglas activas**.
6. Luego de activar: abrir `https://humanfriendly.global/islanddao/`, `https://humanfriendly.global/islanddao`, `https://humanfriendly.global/` y otras páginas existentes. Probar recursos, WebGL, controles móviles y funciones online. Rollback de enrutamiento: quitar SOLO la nueva Route del router, sin eliminar otros Workers/DNS.

## Actualizar el juego (sin cambiar URL ni QR)
1. Seguir desarrollando en máquina local con Codex. Generar un nuevo build Vite para base `/islanddao/`, sin cambiar estructura de archivos/rutas. Preparar ZIP de Direct Upload con `index.html` en raíz y `islanddao/index.html` + assets. No subir carpeta de código fuente ni secretos.
2. En Cloudflare Dashboard → Workers & Pages → proyecto PAGES `runway-islanddaoxhumanfriendly` (**no** `runway-islanddao-router`) → Deployments → Create a deployment.
3. Subir ZIP primero como **Preview** y verificarlo (ojo: rutas/URLs absolutas deben funcionar en el enlace de preview). Luego desplegar el mismo ZIP en **Production** al mismo proyecto Pages. El Worker sigue apuntando al dominio estable `.pages.dev`; no editar Worker/ruta por cada release.
4. Guardar versión anterior; si hay regresiones, usar rollback del deployment en Cloudflare Pages, verificar comportamiento y cache. Si cambian API/backend, actualizar y validar por separado.

## Bloqueador pendiente crítico: API / CORS
El manual de producción especifica que la API `https://runway-api.agenciahumanfriendly.chatgpt.site/api` debe autorizar exactamente el Origin `https://humanfriendly.global` (sin ruta ni barra final). Preflight OPTIONS, GET/POST, `Authorization` y `Content-Type`; responder Access-Control-Allow-Origin apropiado, Vary: Origin si depende del origen. Sin esto pueden fallar rankings, startup, invitaciones, identificación, ticket de partida y envío de resultados aunque el juego renderice. **No está confirmado que CORS se haya modificado**. El archivo estático no cambia la API.

## Validaciones y riesgos no resueltos
- Verificar en producción dominio final y sitio principal: no confirmado después de la última captura.
- CORS/flujo API completo en dominio real: pendiente.
- Safari/Chrome en dispositivos físicos y landing exitosa: pendientes según metadata.
- Cache de recursos de nombre estable; preservar licencias y MIME para .glb/.ttf/audio; no responder HTML para assets inexistentes.
- Verificar si `*.humanfriendly.global/islanddao*` fue reemplazado por `humanfriendly.global/islanddao*` antes de activar; esta conversación no confirma el clic final.
- Ningún deploy tiene riesgo literalmente cero; siempre prueba aislada, snapshot y rollback.

## Prompt breve reutilizable para otro LLM
"Actuá como ingeniero Cloudflare de producción. Leé este handoff y preservá su distinción confirmado/pendiente. Quiero mantener RUNWAY accesible en `https://humanfriendly.global/islanddao/` sin afectar la web principal. El juego se desarrolla localmente y se actualiza por ZIP con Cloudflare Pages Direct Upload, sin GitHub ni Terminal. Pages: `runway-islanddaoxhumanfriendly.pages.dev`; Worker: `runway-islanddao-router` con proxy hacia `/islanddao/`; ruta prevista `humanfriendly.global/islanddao*`. Verificá seguridad, routing, assets, API CORS, Preview/Production y rollback. Indicame pasos exactos de panel web y pedime captura solo donde el estado siga sin confirmar. NO modificar DNS, otros Workers ni publicar sin aprobación explícita."
