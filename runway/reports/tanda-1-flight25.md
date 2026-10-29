# RUNWAY — Tanda 1/5 · flight-25

20-10-2026. Base: `shop-24`, commit `f2c0283089c467cf4b0fee2956a840e8e6b18b03`.
Alcance cerrado: gameplay, animación y continuidad cinematográfica de esta tanda. No se inició la tanda 2.

## Diagnóstico sobre la base

- La derrota congelaba la simulación competitiva y reutilizaba la pose de aterrizaje: piloto parado en el aire.
- El reinicio interpolaba desde la posición final hasta la cabina. La cámara recorría físicamente el avión.
- La apertura tenía inflación de canopy pero no una reacción coordinada del cuerpo. Al terminar, el canopy seguía siendo hijo del piloto y se ocultaba en 1,5 s.
- El joystick dependía del refresco React del HUD a 20 Hz; el input ya llegaba inmediatamente.
- El imán sí estaba generado y tenía efecto determinista. Se conservó el sistema, se verificó su alcance/caducidad y se corrigió su lectura visual positiva.

## Requerimientos y cierre

| # | Requerimiento | Implementación y estado |
|---|---|---|
| 1 | Cámara / iluminación interior | IMPLEMENTADO; encuadre tres cuartos desde atrás, foco más alto y dos luces existentes recolocadas con separación cálida/fría. Captura revisada. |
| 2 | Semáforo anclado | IMPLEMENTADO; soportes sobre las paredes laterales, independientes de la compuerta. Posición y jerarquía comprobadas con compuerta completamente abierta. |
| 3 | Salto con impulso | IMPLEMENTADO; carga de piernas, extensión, arco de separación al llegar al extremo de la rampa y apertura gradual de pose. Cámara consume la misma posición de presentación. |
| 4 | Reinicio sin atravesar avión | IMPLEMENTADO; fundido 160/240 ms, corte de cámara/FOV bajo cobertura, sin interpolación ascendente. Reintento y vuelta al menú comprobados. |
| 5–6 | Derrota aérea / ragdoll | IMPLEMENTADO como caída balística de presentación y reacción articulada procedural sobre los 15 huesos existentes. Continúa con gravedad después de cerrar el resultado. No es un solver de cuerpos rígidos por hueso. |
| 7 | Reacción contra edificio | IMPLEMENTADO; flail y recuperación tras contacto real no fatal; golpe fatal entra en caída y desprende canopy. |
| 8 | Estados compatibles | IMPLEMENTADO en escenarios probados; aterrizaje, caída terminal y reinicio diferenciados. Pausa congela reloj corporal y canopy. |
| 9 | Joystick | IMPLEMENTADO; thumb actualizado cada paint, input sin filtro añadido y retorno visual independiente. Pointer drag verificado en viewport móvil; sensación táctil física pendiente. |
| 10 | Imán | IMPLEMENTADO / VERIFICADO; pickup real generado, ocho segundos, alcance ampliado, renovación sin apilar potencia y atracción existente. Modelo cyan/verde para identificarlo como positivo. |
| 11 | Picada de estrella | IMPLEMENTADO; inclinación raíz, brazos recogidos y piernas extendidas durante el impulso real; recuperación al terminar. |
| 12 | Apertura | IMPLEMENTADO; tensión, tirón corporal, inflación, rebote amortiguado y estabilización con reloj compartido. Cuerdas siguen anclajes de manos. |
| 13 | Desprendimiento | IMPLEMENTADO; transformación independiente en mundo, deriva lateral, gravedad, plegado y fade; persiste 3,2 s. Ya no viaja pegado al torso ni desaparece al contacto. |

El arco de salida y la caída posterior a derrota son presentación local. No modifican colliders, economía, inputs, ruta, duraciones ni replay del servidor. No se cambió la API ni la versión competitiva.

## Verificación focalizada

- TypeScript sin errores.
- 15 pruebas unitarias de coreografía, reloj de presentación, canopy y runtime aprobadas.
- Dos pruebas existentes de magnetismo aprobadas: atracción/caducidad y renovación sin acumulación.
- Seis casos de navegador aprobados: tres en Chromium y tres en WebKit, sin errores JavaScript.
- Primera secuencia menú → PLAY → salida ejecutada a velocidad real. Distancia cámara/piloto entre **4,38 y 5,02 unidades**; 577 muestras Chromium y 319 WebKit.
- Reintento: cobertura opaca antes de cambiar cámara; no recorrido visible de vuelta a la cabina.
- Derrota aérea: descenso de **23,23 / 23,37 unidades** durante la espera de 600 ms en ambos navegadores, capital cerrado en cero.
- Impacto de edificio: contacto de la simulación compartida activa reacción; caso fatal conserva canopy separado y visible.
- Apertura: pausa/reanudación conserva exactamente el estado visual capturado. Anclajes de ambas manos activos antes del desprendimiento y liberados después.
- Joystick: desplazamiento 28/−14 px produce input 0,5/0,25 y thumb 22/−11 px en el siguiente refresco; al soltar vuelve a ocultarse.
- Imán y estrella activados mediante contactos reales. La estrella vuelve a fuerza visual cero tras finalizar.

Las pruebas de colisión/pickups usan fixtures de posición/estado y luego los contactos reales del núcleo. No representan vuelos humanos completos ni mediciones de rendimiento sostenido. El caso de salida no usa un salto temporal.

## Evidencia

- [Resultados y muestras completas](evidence-flight25/verified-tests.json).
- [Cabina](evidence-flight25/cabin.png), [apoyo en rampa](evidence-flight25/launch-2.45.png), [separación](evidence-flight25/launch-2.95.png), [entrada en caída](evidence-flight25/launch-3.6.png).
- [Derrota aérea](evidence-flight25/air-defeat.png), [impacto contra edificio](evidence-flight25/building-impact.png), [derrota contra edificio](evidence-flight25/building-defeat.png).
- [Imán](evidence-flight25/magnet-active.png), [picada](evidence-flight25/boost-dive.png), [canopy abierto](evidence-flight25/deployed.png), [desprendimiento lateral](evidence-flight25/landing-release.png).
- Grabaciones a velocidad real: [salida](evidence-flight25/launch.webm), [derrotas y reinicio](evidence-flight25/defeat.webm), [apertura, pausa y desprendimiento](evidence-flight25/canopy-pickups.webm).

Capturas revisadas visualmente. Durante esta tanda se corrigió también el canopy que tapaba el rostro durante el desprendimiento; ahora se pliega hacia el lado contrario de la órbita.

## Pendientes reales y límites

- iPhone/Android físicos: latencia táctil percibida, diez minutos sostenidos y valoración de las animaciones. Emulación no acredita estas pruebas.
- La reacción ragdoll es procedural; no incluye colisión individual de cada extremidad ni simulación de tela del canopy.
- La calidad artística global, puente, tipografía y otros pedidos fuera de esta tanda no se declaran cerrados ni se trabajaron aquí.
- No se añadieron sonidos ni nuevas reglas.

## Publicación / rollback

Frontend identificado como `flight-25`; audiencia pública conservada, API sin cambios.
Rollback: `shop-24`, versión guardada `appgprj_6acfeda93e2c8191a478eae796d0d3dd~appgver_07a664b751788191a90095fd5623672d`.
La confirmación del despliegue corresponde al resultado de Sites en esta entrega.
