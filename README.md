# RUNWAY — IslandDAO

**FUND. BUILD. LAND.**

> *Build your capital. Ride the currents. Land your startup in Floripa.*

RUNWAY es un juego web 3D para IslandDAO × Human Friendly. Cada partida es un vuelo: salís del avión, caés en caída libre, abrís el paracaídas y aterrizás en la isla juntando SOL (el dinero del juego, que es el único puntaje). Los jugadores tienen identidad propia, pueden crear o unirse a una startup e invitar a otros, comprar cosméticos y competir en dos rankings globales: **CEO** (mejor puntaje verificado por jugador) y **STARTUP** (suma de los mejores puntajes de sus miembros). Los puntajes se recalculan en el servidor a partir del replay: no se confía en el score que manda el cliente.

*English summary: RUNWAY is a 3D web game (React + Three.js) for IslandDAO × Human Friendly: freefall, canopy and landing runs where you earn in-game SOL, with server-verified CEO and startup leaderboards on Cloudflare Workers + D1.*

- Juego publicado: https://humanfriendly.global/islanddao/ (versión desplegada en producción; puede no coincidir exactamente con este código).

## Versión

| Componente | Carpeta | Versión guardada | Commit de origen |
|---|---|---|---|
| Frontend (juego) | `runway/` | v47 | `e58d1fd3366258686830d116d2c6db5d80c5de32` |
| API (rankings, tickets, startups) | `services/runway-api/` | v28 | `3d74ea5a3fbc15cd9a9dcda956692c892985eb9c` |

## Stack

- **Frontend:** React 19, Three.js + React Three Fiber, Zustand, TypeScript, Vite. Tests con Vitest y Playwright (Chromium/WebKit).
- **API:** Cloudflare Workers con [vinext](https://github.com/cloudflare/vinext), base de datos Cloudflare D1 (binding `DB`), Drizzle ORM, migraciones SQL.
- **Assets:** modelos originales de Blender (`runway/assets-source/`), modelos GLB, imágenes, música y efectos de sonido (`runway/public/`).

## Estructura

```
runway/                  Frontend del juego
  src/                   Código React/TypeScript (App, UI, escena 3D, economía, tienda)
  src/core/simulation.ts Reglas canónicas de la simulación
  public/                Assets servidos (modelos, audio, fuentes, imágenes) y licencias de terceros
  assets-source/         Fuentes originales (.blend, SVG)
  tests/                 Tests unitarios (Vitest) y de navegador (Playwright)
  scripts/               Empaquetado para hosting y QA
  docs/                  Notas de diseño e instrucciones de hosting
  reports/               Informes de QA de cada iteración
services/runway-api/     API
  app/api/               Rutas HTTP
  lib/                   Rankings, reglas competitivas, simulaciones actuales y heredadas (lib/legacy)
  db/, drizzle/          Esquema y migraciones SQL de D1
  tests/                 Tests de rankings, startups y API
```

`runway/` y `services/runway-api/` deben quedar en estas rutas relativas: algunos scripts las referencian entre sí.

## Correr el juego localmente

Requiere Node 24.

```sh
cd runway
npm ci
npm run dev        # http://127.0.0.1:5180
```

El servidor de desarrollo redirige `/api` a una API local en el puerto 8787. Sin API, el juego funciona en modo práctica (sin rankings).

Otros scripts (`runway/package.json`):

```sh
npm test                  # Vitest
npm run build             # typecheck + build de Vite en runway/dist/
npm run preview           # sirve el build en 127.0.0.1:5180
npm run package:hosting   # build para la ruta /islanddao/ (ver runway/docs/INSTRUCCIONES-HOSTING.md)
```

`runway/.env.example` muestra la variable `VITE_API_URL`. No apuntes pruebas locales a la API de producción: crean jugadores y partidas reales.

## Correr la API localmente

```sh
cd services/runway-api
npm ci
node scripts/run-framework.mjs build
npm start                 # Worker local con Wrangler y D1 local en .wrangler/state
```

**Importante:** usá `node scripts/run-framework.mjs build` y no `npm run build`. El `prebuild` (`scripts/sync-core.mjs`) copia la simulación del frontend sobre la de la API, y eso pisaría la simulación v28.

Tests de la API:

```sh
node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs tests/startup48/join.test.mjs
```

## Estado de los tests (verificación del 29/10/2026, Node 24)

- Frontend: `npm ci` y `npm run build` aprobados. `npm test`: 132 de 135 aprobados. Un test (`gameplay37.test.ts`) superó el timeout de 5 s y pasa con `--testTimeout=20000`. Los otros dos (`cosmetics42.test.ts`, `gameplay37-report.test.mjs`) comparan la simulación del cliente con la simulación más nueva de la API y fallan con estas versiones.
- API: build aprobado. `tests/production-leaderboards/api.test.mjs` y `tests/dao41/rankings.test.mjs`: 12 de 12 aprobados, con D1 local.
- No se hizo QA en teléfonos físicos.

**Compatibilidad:** el frontend v47 usa el contenido `island-glide-13`, que la API v28 soporta en `lib/legacy/island-glide-13.ts`. La API elige la versión de reglas según el origen. Antes de desplegar este frontend en otro dominio hay que ajustar y probar esa negociación.

## Qué no incluye

- La base de datos D1 de producción (jugadores, partidas, rankings) ni los secretos o variables del servidor.
- El historial Git original (los commits de origen están en la tabla de arriba).
- Grabaciones y capturas de QA (solo se incluyen los informes de texto y JSON).

## Licencias

Las licencias de terceros (librerías, tipografías y assets) están en `runway/public/licenses.txt` y `runway/public/assets/fonts/*-OFL.txt`. El proyecto no declara una licencia propia.
