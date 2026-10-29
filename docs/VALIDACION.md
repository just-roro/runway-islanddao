# Validación de recuperación — 29/10/2026

## Procedencia

Frontend: última versión guardada 47, commit e58d1fd3366258686830d116d2c6db5d80c5de32. Backend: versión 28, commit 3d74ea5a3fbc15cd9a9dcda956692c892985eb9c. La descarga completa del frontend mediante Git protocol.version=0 funcionó tras fallos 500/503 del método anterior. No se reconstruyeron fuentes a partir de JS compilado.

Cada archivo fuente incluido fue comparado byte por byte con su checkout recuperado. Se conservan sus modos Git. No se incluyó el enlace node_modules que apuntaba a una computadora del desarrollador. No se encontraron placeholders .icloud entre los archivos recuperados.

## Resultados actuales

- Node 24.22.1.
- Frontend `npm ci`: aprobado, 75 paquetes.
- Frontend `npm run build`: TypeScript y Vite aprobados. Advertencia de tamaño de bundles (no error de build).
- Frontend `npm test`: 132 aprobados, 3 fallidos, 135 totales. Dos fallos: `cosmetics42.test.ts` y `gameplay37-report.test.mjs`, que comparan la simulación frontend contra la simulación actual más nueva de la API. Un fallo por timeout de 5 segundos en `gameplay37.test.ts`.
- Repetición `node node_modules/vitest/vitest.mjs run tests/gameplay37.test.ts --testTimeout=20000 --maxWorkers=1 --reporter=dot`: 6/6 aprobados. El timeout quedó explicado por el límite de duración; no se cambió código para hacerlo pasar.
- API `npm ci`: aprobado, 687 paquetes.
- API `node scripts/run-framework.mjs build`: aprobado con Vinext.
- API `node --test tests/production-leaderboards/api.test.mjs tests/dao41/rankings.test.mjs`: 12/12 aprobados, SQL en SQLite/D1 simulado local. Sin solicitudes ni escrituras a producción.
- No se ejecutó navegador ni QA físico. No se ejecutaron pruebas que escriben en API real.

## Compatibilidad real entre las dos fuentes

El frontend tiene RULES `runway-3.2.0-chains`, CONTENT `island-glide-13`. Su simulación coincide byte por byte con `services/runway-api/lib/legacy/island-glide-13.ts`. La API actual usa `glide-rewards-15`, conserva varias simulaciones y decide cuál usar para cada ticket; no corresponde reemplazar automáticamente su módulo actual con el del cliente.

El frontend recuperado manda `{}` al pedir un ticket. La API v28 elige `island-glide-13` por defecto en el origen Sites y `island-routes-10` en los orígenes `humanfriendly.global` y Pages. Por lo tanto, **no desplegar sin cambios este frontend v47 sobre el dominio externo suponiendo rankings compatibles**: para una futura migración se deberá negociar explícitamente rules/content o ajustar la política del servidor y probarla. No se aplicó esa modificación porque esta entrega es el código original para GitHub, no un cambio de producción.

El script histórico `api/scripts/sync-core.mjs` sobrescribe lib/simulation.ts desde el cliente si existe en la ruta original. Evitar npm run build del backend en este monorepo; usar el comando directo documentado. Así se conserva la v28 y su compatibilidad de replays históricos.

## Alcance

Código/activos disponibles para GitHub: recuperados. Datos D1 y secretos: no exportados, no necesarios para este push. Infraestructura Cloudflare y producción: intactas. Cambios locales posteriores no guardados en Sites: no accesibles desde esta entrega.

El handoff Cloudflare adjunto es histórico y tenía CORS pendiente: el código v28 recuperado sí lista humanfriendly.global y Pages entre los orígenes permitidos. La nueva inspección de código no certifica el estado de DNS/rutas o una nueva partida real.
