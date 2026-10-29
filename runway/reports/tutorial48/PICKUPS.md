# Auditoría de pickups — base de la intervención 48

## Resultado comprobado

COMMUNITY, TERM SHEET y MAGNET se generan en todas las partidas: son slots garantizados, no entradas de la tabla probabilística de obstáculos. La resolución de clearance no los elimina. Items y ObjectGlows recorren sus definiciones y sí incluyen sus geometrías. No se encontró una probabilidad cero ni un flag deshabilitado.

La presentación previa usa radios visuales de 0,52 / 0,60 / 0,50, respectivamente, y un fog propio de los ítems entre 30 y 110 unidades. Sus posiciones Z están entre 347 y 352; el piloto termina la salida en Z341,6. Estos factores reducen la anticipación y la legibilidad si el usuario no ajusta también la profundidad del recorrido. Tres de sus siete slots están dentro de la tormenta.

## Frecuencias esperadas y observadas

10.000 semillas consecutivas reproducibles, 0–9999. Conteos después de generación y clearance. Los aros cuentan miembros de las secuencias; no significa que todos sean visibles simultáneamente.

| Ítem | Esperado por run | Observado por run | Runs con el ítem | Caída / planeo |
|---|---:|---:|---:|---:|
| sol | 128.0000 | 128.0000 | 100.00% | 104.0000 / 24.0000 |
| gas | 18.0483 | 18.0910 | 100.00% | 12.4083 / 5.6827 |
| star | 18.0000 | 18.0000 | 100.00% | 16.0000 / 2.0000 |
| community | 3.0000 | 3.0000 | 100.00% | 3.0000 / 0.0000 |
| delivery | 11.8293 | 11.7902 | 100.00% | 11.7902 / 0.0000 |
| term | 2.0000 | 2.0000 | 100.00% | 2.0000 / 0.0000 |
| gate | 19.0000 | 19.0000 | 100.00% | 13.0000 / 6.0000 |
| hacked | 3.6736 | 3.6634 | 99.82% | 2.8683 / 0.7951 |
| magnet | 2.0000 | 2.0000 | 100.00% | 2.0000 / 0.0000 |
| rug | 15.5068 | 15.5134 | 100.00% | 9.9912 / 5.5222 |
| water | 1.0000 | 1.0000 | 100.00% | 1.0000 / 0.0000 |
| rare | 0.0400 | 0.0375 | 3.75% | 0.0375 / 0.0000 |

Para delivery/gas/rug/hacked el valor esperado acumula las probabilidades condicionales de cada slot, respetando exclusión de repetición inmediata, cap de HACK y slots sólo de obstáculos. No se presentan los pesos 4/3/2/0,6 como porcentajes globales: las restricciones cambian el reparto efectivo. Para Rare Cargo la probabilidad configurada es 4%; 3,75% observado está dentro de la fluctuación muestral esperable.

RISK permanece como tipo y renderer residual, pero no figura en CONTENT_CATALOG ni se genera. No es un ítem habilitado eliminado por accidente. Edificios y océano pertenecen a sistemas de colisiones distintos y no se cuentan como pickups.

## Visibilidad y superposición

Estimación analítica del encuadre estable de caída a 390×844, sin simular oclusión de geometría ni capturar el navegador: al seguir el recorrido de SOL, la ventana con diámetro ≥20px y contraste del objeto >50% promedia 0,42s para COMMUNITY, 0,63s para TERM y 0,63s para MAGNET. Es una señal de poca anticipación, no una medición visual definitiva.

En una comprobación geométrica de 1.000 semillas, la envolvente del primer MAGNET roza otras envolventes en 11,7%; el segundo, 36,6%; el último COMMUNITY, 19,4%, principalmente aros. Un aro es hueco: esto indica riesgo de superposición visual, **no un bug de colisión confirmado**. No se recomienda modificar rutas ni hitboxes sólo por esta prueba.

## Verificación automatizada

- `tests/pickups48.test.ts`: 2.000 semillas, determinismo, slots garantizados, catálogo habilitado completo, máximo de HACK, ausencia de repeticiones inmediatas de encounters y tasa de rareza.
- 100 partidas con controles reales cuantizados mediante el controlador existente `tests/test-pilot.ts`, sin teletransportar ni modificar el saldo/curso; verifica recompensa efectiva de COMMUNITY/TERM, duración del MAGNET y ausencia de duplicados. Cinco runs se reproducen exactamente mediante `replay()`.
- `reports/tutorial48/pickup-audit.mjs`: auditoría reproducible de 10.000 semillas y estimación analítica de visibilidad; salida en `pickup-audit.json`.

## Recomendación localizada

Mantener cantidades, generación, economía y colisiones. Aumentar únicamente el tamaño de presentación de los tres ítems dentro de la envolvente de contacto ya existente, compartiendo ese tamaño entre modelo y glow, y hacer más legible su aproximación. Completar con QA visual del navegador para confirmar que esta mejora resuelve la percepción reportada.
