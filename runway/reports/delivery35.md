# Delivery 35 — pickup positivo

Delivery ahora suma 5.000, frente a 15.000 de SOL. Recompensa directa, sin multiplicador temporal. Conserva posiciones, escala y volumen de contacto; no causa daño, no consume Water ni modifica inmunidad. Glow verde, señal luminosa verde, sonido positivo y tutorial/guía/feed actualizados.

Reglas: runway-3.1.0-delivery; contenido island-routes-9. Núcleo de frontend y API idéntico. Históricos preservados; las marcas usan la nueva versión de reglas.

Validación: 13 tests focalizados aprobados (contacto único, protección, escalas iniciales, curso, replay completo y geometría). Chromium Pixel 7 y WebKit iPhone 13 emulados: recogida +5.000, Water intacto, sin nuevos golpes ni errores JavaScript. Capturas y vídeos en test-results/delivery35*. Captura WebKit inspeccionada. No prueba en teléfono físico.

Rollback coordinado: frontend items-34 commit 43e6f7016d705b149ca4b0a574909af6c9a6e185 y API commit 77632ca0b4bab0c1128025e66fdbb13b04bab94e.

Publicación confirmada: frontend versión 36 (39879a632cbfa4473b3c72b03070dd9d247ffc7c) y API versión 18 (43997f20637feecf358d73b9148d1235fbb97fc4). Ambos despliegues succeeded. Dependencias de API restauradas desde lockfile porque macOS había descargado archivos locales; sin cambios de dependencias ni mecánicas adicionales.
