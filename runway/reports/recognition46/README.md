# RUNWAY — Tanda 4/6 · UI y reconocimiento CEO

## IMPLEMENTADO

- Vocabulario SVG compartido: PLAY conserva su triángulo original. Tutorial, modificadores, navegación, confirmaciones, invitaciones y expansores legales ya no usan caracteres como iconos. Sin nueva dependencia.
- HOME: MUSIC independiente (toggle real), CREDITS verde independiente, HOW TO PLAY y SOUND con controles de volumen/SFX. El logo reserva espacio para la corona. PAUSE: BACK TO PLANE inmediatamente después de RESUME FLIGHT.
- Corona física low-poly: oro #1, plata #2, bronce #3, un mesh de 256 triángulos. El borde interior apoya sobre la esfera del casco, por encima del panel LED. Comparte el anclaje del casco al pecho; no usa otro rig ni un reloj. Visible en menú, preview y vuelo/resultados; excluida del NPC.
- Reconocimiento exclusivamente desde `leaderboard?kind=ceo`, entrada `own` del jugador autenticado, capital positivo y rango entero 1–3. Respeta empates del backend. Consulta al entrar, cada 20 segundos visibles, al reconectar y después de verificar una run. Si falla la confirmación se retira la corona. STARTUP nunca concede una corona.
- Resultados: consulta anterior al vuelo y consulta posterior al acuse de subida. Muestra posiciones, ganancias/pérdidas de puestos, primera entrada y acceso a TOP 10/TOP 3. Sin baseline no inventa comparación; práctica, rechazo, actualización y desconexión son estados distintos. Reintenta y actualiza datos visibles.
- Se corrigió la coordinación de `flushQueue`: los consumidores esperan la misma promesa real, en lugar de continuar mientras otra subida sigue pendiente. Una consulta iniciada antes del acuse no sustituye a la posterior.
- Resumen compacto y animación reducida cuando el usuario lo solicita. En 320×568 las acciones de resultados comparten fila para reservar espacio al personaje.

## PRUEBAS REALIZADAS

- `npm run build`: TypeScript y Vite aprobados. Se mantiene el aviso conocido de chunks superiores a 500 kB; no se añadieron dependencias.
- 6 tests frontend: validación de identidad/rango, empates, TOP 3, ausencia de datos, red fallida, comparaciones, consulta posterior a subida, cola concurrente y geometría de corona.
- 5 tests del backend usando su consulta SQL real contra SQLite local: PB, empates, paginación, aislamiento de reglas, rollback y cambio #12 → #2 → #17 por resultados controlados. No se modificó la lógica de API.
- 6 escenarios de navegador (tres por motor) aprobados en Chromium/Pixel 7 emulado y WebKit/iPhone 13 emulado. Después se repitieron las cuatro pruebas afectadas por los ajustes finales de corona y resultados pequeños.
- Capturas en 390×844, 320×568, 844×390 y 1440×900. Navegación, SVG, música, créditos, orden de pausa, tres materiales de corona, eliminación fuera de TOP 3/sin conexión y conservación de la instancia del piloto.
- Resultados con respuesta retenida: no aparece un puesto antes del acuse. #12 → #2 = 10 ganados; #12 → #17 = 5 perdidos; sin puesto → #9 = primera entrada TOP 10. Reconexión y retry sin duplicar envíos.
- Dos vuelos continuos grabados: corona durante caída, apertura y aterrizaje. Máximos dentro de 70 draw calls / 90.000 triángulos en ambos motores. No se afirma un benchmark de hardware móvil a partir de esta emulación.
- Pruebas de navegador interceptan las llamadas API con datos controlados. No se crearon puntuaciones de QA en producción.

## PARCIAL / PENDIENTE

- Validación física de iPhone y Android pendiente por falta de dispositivos. Los SVG tienen la misma geometría en los motores probados; no se afirma haber probado todos los dispositivos físicos.
- La posición es una instantánea real del servidor; durante una pantalla abierta se refresca cada 20 segundos. No hay suscripción push en el backend existente.
- No se ejecutaron otras tandas, ni se regeneró el ZIP de hosting.

## Evidencia local

- [Menú y corona](captures/menu-gold-iphone.png)
- [Resultados 320 px](captures/results-small.png)
- [Vuelo continuo: aterrizaje](captures/continuous-landing.png)
- [Pausa](captures/pause.png)
- Videos completos en `reviewed/`; últimas revisiones en `small-final/` y `crown-final/`.
- [Resumen de verificación](verification.json)

Publicación pendiente de autorización explícita: la revisión automática rechazó iniciar la publicación de esta tanda. No se inició ningún despliegue; frontend público v45 y API v22 permanecen vigentes. Ver `publication.json`.
