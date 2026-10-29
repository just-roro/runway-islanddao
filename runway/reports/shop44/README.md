# RUNWAY — Tanda 2/6 · SHOP UX/UI

Fecha: 2026-10-22. Implementación local sobre la versión de trabajo, conservando las correcciones previas de estrellas/replay. No se publicó ni se regeneró el ZIP de hosting.

## Diagnóstico comprobado

- El catálogo era una tira de miniaturas de 30×27 px dentro de botones de 68 px; PILOTS no tenía esa tira. Paracaídas/trails/casco usaban screenshots del preview.
- El preview renderizaba tres pilotos. Los laterales tenían 58% de escala; el protagonista cambiaba de escala según la altura de UI y se reducía aún más al mostrar el canopy.
- Las reglas de SHOP se repartían entre varios bloques de style.css y ui-system.css. El selector de accesorios dependía de un select nativo.
- Al girar al actor para mostrar el trail, los billboards heredaban la rotación del padre y volvían a aplicar la de cámara: quedaban de canto. Se corrigió la conversión de orientación sólo para el preview.

## IMPLEMENTADO

- Catálogo con dos columnas en móvil vertical y dos/tres en desktop y horizontal, scroll independiente y encabezado BACK siempre accesible.
- Cinco categorías, selección explícita, descripción debajo del nombre, precio separado y acciones con dimensiones fijas. Conserva BUY & EQUIP, EQUIP, EQUIPPED, restricciones por piloto, retos y saldo insuficiente.
- Miniaturas cuadradas: 12 retratos originales, 94 composiciones originales de accesorios, 12 ilustraciones de canopy, 10 trails y 9 diseños de bordes LED. Los acabados se dibujan con los colores y claves de patrón del catálogo. No se solicitan screenshots de /previews/.
- Filtro de accesorios con retratos desplazables, sin dropdown. No accessory conserva la acción de retirar el accesorio.
- Un actor 3D de escala constante 0.9, con pedestal y fondo de exhibición en el canvas existente. Cámara ajustada al espacio disponible: cuerpo para pilotos, retrato para accesorios/helmet, detalle del canopy y vista trasera para trails.
- El fondo de exhibición evita que la estructura del avión tape el paracaídas. El avión y el NPC regresan al consultar la guía; al salir de SHOP se recupera el menú.
- La guía de primera visita y la posibilidad de consultarla permanecen. El patrón histórico de casco se conserva como control independiente del texto del producto.
- Estilos de tienda consolidados en src/shop.css, eliminando las reglas antiguas equivalentes. Sin dependencias, productos, precios, reglas económicas ni persistencia nuevos.

## PRUEBAS REALIZADAS

- `npm run build`: TypeScript y Vite de producción correctos. Permanece el aviso de tamaño del bundle de Three, no un error de compilación.
- Vitest: **22/22** en cosmetics42.test.ts, shop.test.ts y dialogue.test.ts. Incluyen migración, compras, persistencia, operaciones concurrentes y errores de almacenamiento del sistema existente.
- Playwright: **8 escenarios/navegador aprobados en total** (cuatro casos en cada motor, incluyendo el control histórico del casco y regreso al menú). Chromium y WebKit: formatos 360×640, 390×844 (iPhone 13 emulado), 844×390 y 1440×900. Capturas de las cinco categorías; comprobación de dimensiones, miniaturas cuadradas, un solo actor y escala estable.
- Compra de Ninja, Sun Glasses, Gold Circuit, Bubbles y Racing Checker: saldo esperado de 33 M desde 60 M; equipar no vuelve a cobrar. Compra posterior de Aurora y Comet deja 3 M y bloquea un producto premium por saldo insuficiente.
- Se comprobó accesorio incompatible con piloto bloqueado, selección por piloto, retiro del accesorio, recarga y persistencia, BACK después de scroll y consulta manual de la guía.
- Los 94 accesorios y los 12 filtros de piloto cargan imágenes válidas. Se verificaron cantidades de productos y miniaturas propias de cada categoría. El canvas conserva identidad durante los cambios.
- Sin errores JavaScript ni solicitudes de miniaturas antiguas en los recorridos de categorías. API interceptada con respuesta 503 durante QA; no se ejecutaron operaciones online de producción.
- Capturas revisadas para móvil y desktop, incluyendo patrones de canopy, casco, retratos y trail en movimiento. Hojas de catálogo en captures/catalog-*.png. Videos completos de QA quedan en las carpetas locales ignoradas de este informe.

Comando reproducible (con el servidor de desarrollo local activo):

```sh
RUNWAY_BASE_URL=http://127.0.0.1:5181 npx playwright test tests/browser/shop44.spec.ts
```

## PARCIAL / PENDIENTE

- La comprobación móvil es emulación Chromium/WebKit en este equipo. No equivale a una prueba física en iPhone o Android; rendimiento sostenido y gestos en hardware real quedan pendientes.
- Cambios locales, sin publicación. No se avanzó a otra tanda.
- ZIP de producción intacto: SHA-256 `2e58d83034d89f7b5957b172c9b823f56b49951c1194b949c5aacfa09de3c9fc`.

## Archivos principales

- src/Shop.tsx: catálogo, navegación y estados existentes de transacción.
- src/ui/CatalogIcon.tsx: iconografía de producto.
- src/shop.css: layout responsive y jerarquía visual.
- src/scene/World.tsx: actor único y encuadres de preview.
- src/scene/PilotTrail.tsx: orientación correcta de los billboards del preview.
- tests/browser/shop44.spec.ts: cobertura y captura de evidencia.
- tests/browser/cosmetics42.spec.ts: selectores actualizados a la navegación nueva.
