# Production Leaderboards — reparación de API

## Causas comprobadas

Los rankings ya son compartidos: D1 almacena players, tickets, runs, startups y memberships; CEO usa el máximo score verificado por jugador y STARTUP suma los máximos de sus miembros. localStorage conserva identidad, preferencias y cola de envío, no el ranking global.

1. CORS sólo autorizaba Sites y localhost; humanfriendly.global recibía 403.
2. Pages conserva island-routes-10 y exige un ticket de esa versión. La API sólo emitía island-glide-13; el cliente descartaba el ticket y jugaba en modo no competitivo. Reparar CORS únicamente no bastaba.
3. Dos envíos concurrentes se guardaban una sola vez por PK, pero ambos podían informar duplicate=false. Ahora el resultado de la inserción decide esa respuesta.

## Solución

Allowlist exacta para humanfriendly.global, el Pages estable y los orígenes anteriores. No wildcard de Pages.

Replay antiguo congelado desde el source original, comprobado contra 100 semillas ejecutadas en el bundle realmente publicado (resultado y todos los eventos económicos idénticos). Tickets sin negociación desde los orígenes de Pages reciben esa versión; Sites conserva la actual. Clientes nuevos pueden declarar rules/content. El ticket fija la versión del replay; no se confía en score enviado por el cliente. Las versiones desconocidas se rechazan. No hay downgrade silencioso de un ticket existente.

El cliente local declara su versión explícitamente; ese único cambio queda preparado para la publicación futura del frontend, sin desplegar el juego ahora.

Se conservan binding DB, schema, históricos, reglas competitivas, validación de inputs, duración mínima, expiración, autenticación y restricciones de membresía. No se crean recursos ni migraciones.

## Pruebas reproducibles

Desde services/runway-api con Node 24:

```sh
node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs tests/startup48/join.test.mjs
TEST_API=http://127.0.0.1:8791/api node tests/api.integration.mjs
```

La segunda prueba requiere el Worker compilado y una D1 local de prueba con las dos migraciones existentes. No apuntarla a producción: crea cinco identidades y una startup y juega una partida con premio.

`runway/scripts/qa-production-rankings.mjs` compara el bundle guardado de Pages servido localmente en 5186 con el replay recuperado; bloquea todas las llamadas a la API real.

Evidencia estructurada: validation.json. El test SQL cierra y reabre una base en disco, y una identidad independiente consulta CEO, STARTUP y contribuciones. El test Worker usa D1 real de Miniflare, no una API simulada.

## Límites que se conservan

Pausar u ocultar la pestaña vuelve no competitiva la partida por diseño existente; no se cambió esa regla. Los resultados offline sin ticket no pueden validarse retroactivamente. Las identidades guest son locales a cada navegador/origen: el ranking es global y persistente entre dispositivos, pero recuperar la MISMA identidad en otro dispositivo requiere un sistema de acceso que esta fase no añade. No unir cuentas por nombre.

## Publicación y rollback

Sólo la API Sites existente appgprj_6acfed30efd88191aef688e5a181c299. Frontend Pages y router intactos. Rollback: volver a la versión API 23 registrada en entregas/release-safety-2026-10-22/sites-publication.json. No modifica D1. Se conservará aquí el ID de la nueva publicación y las verificaciones reales del endpoint.

## Resultado publicado verificado

API versión **24**, commit `faf59e166f23e940cc9a38aa1d17dbe544e324ad`, deployment `appgdep_6adaadedd6508191b244dd61ae7a8010`, publicado 2026-10-23 00:44:49 UTC. Endpoint https://runway-api.agenciahumanfriendly.chatgpt.site/api . IDs y archivo de publicación en publication.json.

Prueba real en Chromium y WebKit con origen https://humanfriendly.global: CORS/preflight, alta de identidades, creación y unión idempotente a startup, ticket legacy por defecto, ticket actual explícito, replay antiguo, dos envíos concurrentes con una sola fila, lectura desde otra identidad/contexto, recarga de ambas sesiones, detalle individual con runs=1 y consulta de membresía.

Se conservan deliberadamente dos identidades identificadas como QA y la startup RUNWAY QA 387683 para auditar la prueba. Sólo se guardó una derrota real con score 0; no se otorgó una puntuación artificial ni se desplazó a líderes. Los cinco registros CEO y tres startups previos conservan IDs, nombres y scores. No se eliminaron registros de producción. La prueba no simula un dispositivo físico ni demuestra recuperación de una misma cuenta guest entre teléfonos.

No hubo cambios en schema/migraciones ni en el hosting de frontend/router. El ZIP de entrega anterior se mantiene intacto. El cliente local tiene preparada negociación explícita de versión para cuando se publique el resto del juego.

Comprobación de tipos: módulos backend modificados y módulo cliente de sesión pasaron; los chequeos globales quedaron bloqueados por declaraciones de dependencias descargadas de iCloud (zod/three), se detuvieron. Build backend y pruebas de ejecución sí completaron.
