# RUNWAY — paquete para GitHub y Grokbot

Preparado el 29/10/2026. **Exportación parcial: NO es una copia completa de la última versión del juego.**

## Qué contiene

- `public/`: último paquete de frontend exportado recuperable, del 22/10/2026. Es el build para `/islanddao/`, con imágenes, modelos 3D, fuentes, música, sonidos, JS y CSS. No contiene el código React/TypeScript editable del juego.
- `api/`: código fuente recuperado del repositorio de la API v28, commit `3d74ea5a3fbc15cd9a9dcda956692c892985eb9c`, con lockfile, migraciones SQL y pruebas existentes. Se omiten únicamente los informes de ejecución de `reports/`; los archivos de código se conservan sin modificaciones.
- `docs/`: contexto del hosting y estado comprobado de la exportación.
- `GROKBOT-LEER-PRIMERO.md`: instrucciones para subir lo disponible a un repositorio privado.
- `MANIFEST-SHA256.json`: integridad de los archivos del paquete.

## Qué falta para tener TODO lo último

Sites registra el frontend v47, commit `e58d1fd3366258686830d116d2c6db5d80c5de32`. Los intentos de descarga del repositorio devolvieron HTTP 500/503. Esa versión y su código fuente NO están incluidos. No sustituirla por el build de `public/` afirmando que son equivalentes.

La base D1 de producción, sus registros y las variables/secretos del servidor tampoco se exportaron. La API incluida es código y esquema, no un backup de los jugadores ni una migración operativa.

## Uso

Adjuntar este ZIP a Grokbot y pedirle que lea `GROKBOT-LEER-PRIMERO.md`. Solo necesita que le indiques la cuenta/organización y, si corresponde, el repositorio de destino. Debe usar su conexión autorizada a GitHub; no pegar tokens dentro del chat ni del repositorio.

Subir a GitHub almacena los archivos; no publica automáticamente el juego ni migra la API.

## Ver el build disponible

Desde `public/`, servir con cualquier servidor estático local y abrir `/islanddao/`. Los archivos compilados apuntan a la API existente; las funciones online dependen del origen permitido y de esa API. No crear identidades ni enviar partidas de prueba a producción durante esta exportación.

La API mantiene sus instrucciones originales en `api/README.md` y scripts en `api/package.json`. No se reinstalaron dependencias ni se repitieron builds/pruebas funcionales: esta entrega preserva archivos, no cambia el juego.
