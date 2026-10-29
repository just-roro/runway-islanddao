# RUNWAY · IslandDAO

Juego web RUNWAY (frontend React/TypeScript + Vite/Three.js) y su API (Cloudflare Workers/Vinext + D1).

**Estado: código fuente completo de la última versión guardada.** Frontend **v47** (commit original `e58d1fd3366258686830d116d2c6db5d80c5de32`, proyecto `appgprj_6acfeda93e2c8191a478eae796d0d3dd`) y API **v28** (commit original `3d74ea5a3fbc15cd9a9dcda956692c892985eb9c`). La v47 ya no está pendiente.

- Juego publicado: https://humanfriendly.global/islanddao/ (sirve el build desplegado en producción; no se verificó que sea idéntico a la v47)
- Sitio original (Sites): https://runway-islanddao.agenciahumanfriendly.chatgpt.site

## Estructura del repositorio

| Carpeta | Qué es |
|---|---|
| `runway/` | **Fuente del frontend v47** (React/TS, assets originales, modelos Blender/GLB, audio, tests, scripts). Es la carpeta para desarrollar. |
| `services/runway-api/` | **Fuente de la API v28** (rutas, simulaciones, migraciones D1, tests, lockfile). |
| `docs/` | Procedencia (`ORIGEN-FUENTES.json`), validación (`VALIDACION.md`), exclusiones (`ARCHIVOS-EXCLUIDOS.json`) y handoff de Cloudflare. |
| `public/` | *Histórico:* build compilado del frontend exportado el 22/10/2026 para `/islanddao/` (anterior a la v47; no es fuente). |
| `api/` | *Histórico:* copia de la API v28 de la primera entrega parcial; idéntica a `services/runway-api/` salvo `reports/`. Usar `services/runway-api/`. |
| `docs/entrega-parcial-anterior/` y `docs/ESTADO-EXPORTACION.json` | Documentos de la primera entrega parcial (ya superados: decían que la v47 faltaba). |

`MANIFEST-SHA256.json` + `VERIFICAR-PAQUETE.py` verifican los 730 archivos del paquete v47 (`python3 VERIFICAR-PAQUETE.py`). Este `README.md` se amplió después de importar el paquete, por lo que es el único archivo que el verificador marca como distinto; el original está en el commit `Import recovered RUNWAY frontend v47 and API v28 source`.

## Qué no incluye

- Base D1 de producción (jugadores, rankings) ni secretos/variables del servidor: no se exportan a un repositorio.
- Historial Git original (los commits de origen están referenciados arriba) ni cambios locales posteriores que no se hayan guardado en Sites.
- Grabaciones/screenshots de QA (listados en `docs/ARCHIVOS-EXCLUIDOS.json`).

---

## Notas de la entrega v47 (README original del paquete)

Entrega del 29/10/2026. **Reemplaza el ZIP parcial RUNWAY-GITHUB-HANDOFF.zip.**

Se recuperó el código original de la última versión guardada en Sites: frontend v47, commit `e58d1fd3366258686830d116d2c6db5d80c5de32`. Incluye API v28, commit `3d74ea5a3fbc15cd9a9dcda956692c892985eb9c`.

Esto permite guardar y continuar desarrollando el proyecto. No afirma incluir cambios que alguien haya hecho después en una computadora sin guardarlos en Sites.

## Contenido

- `runway/`: código React/TypeScript, modelos originales Blender, modelos GLB, imágenes, audio, tipografías, licencias, tests, scripts, configuración Vite y lockfile.
- `services/runway-api/`: código del backend, simulaciones actuales y heredadas, migraciones D1, tests, scripts y lockfile.
- `docs/`: procedencia, validación actual, contexto de Cloudflare y lista exacta de exclusiones.
- `GROKBOT-LEER-PRIMERO.md`: instrucciones para subir a GitHub.
- `MANIFEST-SHA256.json` y `VERIFICAR-PAQUETE.py`: integridad de todos los archivos entregados.

La estructura conserva las rutas relativas originales entre `runway/` y `services/runway-api/`. No mover estas carpetas por separado.

## Subir a GitHub

Adjuntar este ZIP a Grokbot y pedirle que lea `GROKBOT-LEER-PRIMERO.md`. Indicar cuenta/organización y nombre del repositorio, o permitir que use `runway-islanddao` como nombre para un repositorio privado nuevo.

No se necesita base de datos ni credenciales de hosting para subir el código. La base de jugadores y secretos de producción no están incluidos. GitHub no ejecuta automáticamente la API ni publica el juego por recibir estos archivos.

## Trabajar con el juego

Requiere Node 24. En `runway/`:

```sh
npm ci
npm run dev
```

Abrir http://127.0.0.1:5180. El proxy de desarrollo espera una API local en 8787; sin API se usa el modo práctica. No copiar `.env.example` apuntando a producción para ejecutar pruebas que creen jugadores o partidas.

```sh
npm run build
```

Genera `runway/dist/`. En producción el cliente usa por defecto la URL de API original. Las invitaciones dependen de `VITE_PUBLIC_URL`. Las rutas bajo `/islanddao/` se generan con el script original `npm run package:hosting`; leer primero la advertencia de versiones en `docs/VALIDACION.md` antes de desplegarlo.

## Trabajar con la API preservando v28

En `services/runway-api/`:

```sh
npm ci
node scripts/run-framework.mjs build
node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs
```

**Para preservar esta versión no ejecutar `npm run build` en la API:** su `prebuild` histórico ejecuta `scripts/sync-core.mjs` y copia la simulación del frontend sobre la simulación más nueva de la API. La compilación directa indicada arriba evita esa sobrescritura; fue la utilizada en esta verificación. No editar ni reemplazar las simulaciones por intuición.

El backend usa Cloudflare Workers/Vinext y un binding D1 `DB`. Su alojamiento original es Sites. Una migración a otra cuenta necesita configurar runtime, D1 y orígenes; no basta con GitHub Pages.

## Verificación realizada

Instalación limpia y build de frontend y API: aprobados. API: 12/12 pruebas seleccionadas aprobadas. Suite completa frontend: 132/135 inicialmente; una prueba agotó 5 segundos y pasó al repetir su archivo con 20 segundos (6/6). Las otras dos comparan directamente la simulación del cliente con la más nueva del backend y fallan con estas dos versiones guardadas. El cliente coincide byte por byte con `api/lib/legacy/island-glide-13.ts`, soportada por el backend. Detalle en `docs/VALIDACION.md`.

Se conservaron los fuentes sin cambios. No se ejecutaron nuevas pruebas en navegador o teléfonos físicos ni se modificó producción.

Se excluyeron el enlace local de `node_modules`, grabaciones, screenshots y binarios auxiliares de informes QA; se conservan los informes textuales y fixtures JSON. Lista en `docs/ARCHIVOS-EXCLUIDOS.json`. No se incluye el historial Git de origen; los commits originales quedan identificados en la documentación.
