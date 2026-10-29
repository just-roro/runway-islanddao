# RUNWAY — código recuperado para GitHub

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
