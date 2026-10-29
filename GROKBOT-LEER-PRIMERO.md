# Grokbot — subir RUNWAY correctamente a mi GitHub

Quiero que subas el contenido de este ZIP a mi GitHub. El código frontend v47 y API v28 ya están recuperados. Leé `README.md` y `docs/VALIDACION.md` antes de actuar.

1. Verificá tu conexión autorizada a GitHub y la cuenta autenticada. Si falta un destino, preguntame únicamente cuenta/organización. Usá `runway-islanddao` como nombre sugerido y creá un repositorio PRIVADO si no existe. Si ya existe, clonalo, revisá su contenido y creá una rama con PR; no reemplaces código existente sin comparar y no uses force push.
2. Extraé el ZIP y ejecutá, desde su carpeta contenedora, `python3 VERIFICAR-PAQUETE.py`. Conservá la salida. Si falla, frená la carga y reportá el archivo afectado; no regeneres el manifiesto para ocultarlo.
3. Subí a la raíz del repo el CONTENIDO de `RUNWAY-GITHUB-v47/`: deben quedar `README.md`, `runway/`, `services/`, `docs/` y los manifiestos directamente en la raíz. No subas solo el ZIP ni agregues una carpeta contenedora redundante.
4. Incluí los archivos de configuración `.gitignore`, `.npmrc`, `.openai/hosting.json` y `.env.example` donde existan. Los IDs de proyecto conservados en hosting.json documentan el origen; no son credenciales. No subas `.env` reales, tokens, node_modules, directorios dist generados, bases de jugadores ni metadatos `.git` de origen.
5. Conservá los nombres y mayúsculas de los assets y las rutas entre ambas aplicaciones. Usá el manifiesto para comprobar cantidades y SHA256. Conservá también los permisos ejecutables Git de los scripts, indicados en `docs/ORIGEN-FUENTES.json`. Si tu extractor perdió permisos, restauralos con chmod en Unix y `git update-index --chmod=+x` para las rutas listadas como 100755 después de git add.
6. Subí con commit: `Import recovered RUNWAY frontend v47 and API v28 source`.
7. Verificá el árbol del commit contra el manifiesto después del push; descargá o leé los archivos desde GitHub para comprobar SHA256 cuando tu herramienta lo permita. Confirmá todos los archivos con git ls-tree en lugar de confiar solo en un mensaje de subida. Reportá cualquier límite o error. Ningún archivo de este paquete supera 100 MiB.
8. Entregame el enlace del repo o PR, rama y SHA final. No habilites Pages/Actions de despliegue ni cambies Cloudflare, Sites, DNS, secretos, base o público del repo. Esta instrucción autoriza subir código, no migrar producción.

## Si querés validar además en tu máquina

Usá Node 24 y los lockfiles con npm ci, sin actualizar paquetes. Los comandos y resultados previos están en README. Para compilar API usá `node scripts/run-framework.mjs build`, evitando su prebuild histórico. La instalación y compilación ya fueron verificadas en esta entrega; no hace falta ejecutarlas para realizar el push.

El pedido NO requiere migrar jugadores o desplegar backend. Si luego el usuario solicita hosting nuevo, tratá esa migración como otra tarea: guardar código en GitHub no traslada D1, identidad del navegador, rutas del dominio ni configuración CORS. No prometas equivalencia de producción sin validarla.
