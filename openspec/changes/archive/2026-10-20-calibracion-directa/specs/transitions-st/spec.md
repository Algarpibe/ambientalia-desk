# Delta de `transitions-st` — `calibracion-directa` (F1C-08, `cierra: si`)

Sólo ADDED. Las cifras y tablas vivas (RQ-TS-05, tabla de RQ-TS-06, RQ-TS-26/27/44 y RQ-TS-50) se leen con RQ-TS-58 y se reescriben en el archive, a igual número de líneas.
Fuente: `decision/p15-p59-rutas`, `decision/f1c08-ov-calibracion`; M2.1 (`R08.4.md:2285-2288`), Anexo D nº 15 (`R08.4.md:5726-5730`) y nº 59 (`R08.4.md:5841-5845`).
Supuestos de la propuesta (reversibles, citados como tales, no como hechos): **S-1** mismo interruptor que Control de calidad; **S-2** la condición (1) es una declaración, sin leer la OV; **S-3** el atajo es Operativo con los campos de `ingreso_a_servicio`; **S-4** el escape lo ve cualquier ticket «Calibración» en `En Proceso`; **S-5** el escape vuelve a `Rev./Diagnostico`; **S-6** ninguna propone derivación, heredan; **S-7** nombres visibles; **S-8** `409` para lo que quita el interruptor.
La ruta de equipo sin novedad NO se construye (`R08.4.md:2286`, nº 59): no hay requisito para ella.

## ADDED Requirements

### Requirement: RQ-TS-52 · Dos transiciones de Servicio Técnico: `calibracion_directa` y `falla_calibracion`

Sólo se añade; nada existente cambia ni se reordena. Las dos son de área `Servicio Técnico` y tipo Operativo (S-3):

| id | Nombre | De → a | Tipo | Campos |
|---|---|---|---|---|
| `calibracion_directa` | Calibración directa (S-7) | `Ingresado` → `En Proceso` | Operativo | los de `ingreso_a_servicio` (`transitions.ts:191`) |
| `falla_calibracion` | Falla en calibración (S-7) | `En Proceso` → `Rev./Diagnostico` (S-5) | Operativo | texto obligatorio «Descripción de la falla» |

Ninguna **SHALL** proponer derivación por defecto: las dos heredan (S-6). `ingreso_a_servicio` y todo `Rechazo` **SHALL** quedar idénticos. No se crea ningún estado.

#### Scenario: tipos, áreas, recorridos y campos — ROJO
- GIVEN el catálogo de servicio
- WHEN se consultan los dos ids y sus campos
- THEN tienen tipo, área, `from`, `to` y `required` de la tabla, y la descripción es el único obligatorio de la falla

#### Scenario: el atajo conserva las fechas de ingreso — ROJO
- GIVEN `ingreso_a_servicio` y `calibracion_directa`
- WHEN se comparan sus campos
- THEN los de la segunda son los mismos que los de la primera, con las mismas fechas obligatorias

#### Scenario: `ingreso_a_servicio` no cambia — CARACTERIZACIÓN
- GIVEN `ingreso_a_servicio`
- WHEN se compara con el catálogo anterior
- THEN origen (`Ingresado`), destino (`Rev./Diagnostico`), área, tipo y campos son idénticos

#### Scenario: heredan la derivación — ROJO
- GIVEN la tabla de derivación por defecto
- WHEN se consultan las dos
- THEN ninguna propone persona; heredan

### Requirement: RQ-TS-53 · El interruptor `CONTROL_CALIDAD_LIBERACION` quita las dos; apagado, el flujo es el de hoy

Con la configuración de `permissions` RQ-PM-32, `executeTransition` **SHALL** responder `409` en el escalón B, tras el `409` de estado (`ticketService.ts:126-128`), sin escribir nada: apagado, o sin configuración, `calibracion_directa` y `falla_calibracion` dan `409` con un mensaje que dice que dependen de Control de calidad (S-1, S-8), distinto del de «no aplica desde el estado». La regla **SHALL** ser una función pura de `packages/shared`, la misma que usa el cliente (regla 13, punto 1). No hay interruptor nuevo ni migración. Apagado el flujo **MUST** ser el de hoy y la suite anterior sigue verde.

#### Scenario: apagado, el atajo da 409 — ROJO (mutación 2)
- GIVEN el interruptor apagado, un ticket «Calibración» con OV en `Ingresado`
- WHEN se ejecuta `calibracion_directa`
- THEN `409` y el ticket no cambia

#### Scenario: apagado, el escape da 409 — ROJO
- GIVEN el interruptor apagado y un ticket «Calibración» en `En Proceso`
- WHEN se ejecuta `falla_calibracion` con descripción
- THEN `409` y el ticket no cambia

#### Scenario: apagado, la ruta de hoy sigue igual — CARACTERIZACIÓN
- GIVEN el interruptor apagado y un ticket en `Ingresado`
- WHEN se ejecuta `ingreso_a_servicio`
- THEN pasa a `Rev./Diagnostico` como hoy

#### Scenario: encendido, el atajo lleva a `En Proceso` con traza — ROJO
- GIVEN el interruptor encendido, un ticket «Calibración» con OV asignada en `Ingresado`
- WHEN se ejecuta `calibracion_directa` con los campos de ingreso
- THEN queda en `En Proceso` con su fila de traza

#### Scenario: apagar con un ticket ya en el atajo no lo vara — ROJO
- GIVEN un ticket que tomó el atajo, en `En Proceso`, y el interruptor luego apagado
- WHEN se ejecuta `diagnostico_complementario` y después `notif_recotizacion` (`transitions.ts:244`, `:261`)
- THEN ambas pasan sin `409` de interruptor y el ticket sale de `En Proceso`

### Requirement: RQ-TS-54 · Condición (1): tipo «Calibración» y orden de venta asignada, impuesta por el servidor

`calibracion_directa` **SHALL** rechazarse con `409`, sin escribir nada, si `tickets.tipo_servicio` no es «Calibración» (`ticketCreate.ts:4`) o el ticket no tiene orden de venta asignada. La condición describe al ticket y no al cuerpo: **SHALL** ir en el escalón B, tras el `409` del interruptor y antes del `403` de área (`ticketService.ts:129`). **SHALL NOT** leerse el contenido de la OV (S-2, `decision/f1c08-ov-calibracion` consecuencia 2): un ticket con otra grafía de tipo no toma el atajo. «Orden de venta asignada» **SHALL** evaluarse con las vías que lean las puertas de «una OV, un ticket»; el diseño fija cuáles y su fuente, y el requisito no presupone una sola columna (IV-11: la sincronización puede vaciar `orden_venta` y dejar `salesorder_id`).

#### Scenario: sin OV el atajo no pasa — ROJO (mutación 1)
- GIVEN el interruptor encendido y un ticket «Calibración» en `Ingresado` sin orden de venta por ninguna vía
- WHEN se ejecuta `calibracion_directa`
- THEN `409` y el ticket no cambia

#### Scenario: otro tipo de servicio no pasa — ROJO (mutación 5)
- GIVEN el interruptor encendido y tickets en `Ingresado` con OV de tipo «Mantenimiento», «Garantía» y sin tipo
- WHEN se ejecuta `calibracion_directa` en cada uno
- THEN `409` en los tres

#### Scenario: la OV por cualquiera de las vías de las puertas cuenta — ROJO
- GIVEN tres tickets «Calibración» cuya OV consta sólo en una de las vías que leen las puertas de «una OV, un ticket»
- WHEN se ejecuta `calibracion_directa` en cada uno
- THEN los tres pasan; con las tres vías vacías, `409`

#### Scenario: el servidor no lee el contenido de la OV — ROJO
- GIVEN un ticket «Calibración» con una OV asignada cuyo contenido no es de calibración
- WHEN se ejecuta `calibracion_directa`
- THEN pasa (S-2)

### Requirement: RQ-TS-55 · El escape: elegibilidad, descripción obligatoria y destino que lleva a cotizar

`falla_calibracion` **SHALL** ser elegible con el interruptor encendido y tipo «Calibración», estando el ticket en `En Proceso`, tomara o no el atajo (S-4); otro tipo da `409` (escalón B, `permissions` RQ-PM-38). Una «Descripción de la falla» ausente o de sólo espacios **SHALL** dar `422` dentro del agregado (`ticketService.ts:134`, escalón C), juntada con los demás errores de contenido en una sola respuesta; el `comment()` no obligatorio (`transitions.ts:73-74`) no la sustituye. El destino **SHALL** ser `Rev./Diagnostico` y desde él **SHALL** alcanzarse `notif_cliente_comercial` con «Fecha de Cotización» por las transiciones de hoy (`escalado_a_revision`, `escalado_a_comercial`), sin transiciones nuevas (S-5).

#### Scenario: con falla describe y sale a diagnóstico — ROJO
- GIVEN el interruptor encendido y un ticket «Calibración» en `En Proceso`
- WHEN se ejecuta `falla_calibracion` con «Descripción de la falla»
- THEN queda en `Rev./Diagnostico` con su fila de traza y la descripción en `values`

#### Scenario: descripción ausente o en blanco, 422 — ROJO (mutación 7)
- GIVEN el mismo ticket
- WHEN se ejecuta con la descripción ausente, vacía y de sólo espacios
- THEN `422` que nombra «Descripción de la falla» y el ticket no cambia

#### Scenario: el 422 va junto a los demás de contenido — ROJO
- GIVEN el mismo ticket
- WHEN se ejecuta con la descripción en blanco (su único obligatorio: «ausente» y «en blanco» son excluyentes, así que no cabe un segundo error de contenido)
- THEN el error va en el `422` agregado de contenido, en un único `errors` que es exactamente el mensaje de blanco (medido en el lote 2)

#### Scenario: el escape sin tomar el atajo — ROJO
- GIVEN un ticket «Calibración» llegado a `En Proceso` por `ingreso_a_servicio`, cotización y aprobación
- WHEN se ejecuta `falla_calibracion`
- THEN pasa (S-4)

#### Scenario: el destino lleva a cotizar — ROJO (mutación 4)
- GIVEN un ticket recién llegado a `Rev./Diagnostico` por `falla_calibracion`
- WHEN se encadenan `escalado_a_revision`, `escalado_a_comercial` y `notif_cliente_comercial` con «Fecha de Cotización»
- THEN cada paso pasa y el ticket queda en el estado de cotización de hoy

#### Scenario: el grafo ofrece el escape y su destino cotiza — ROJO por catálogo
- GIVEN el grafo con las dos transiciones
- WHEN se calcula el alcance desde el destino de `falla_calibracion`
- THEN `notif_cliente_comercial` es alcanzable; si `falla_calibracion` falta o lleva a un estado desde el que no se alcanza, la prueba falla

### Requirement: RQ-TS-56 · Condición (3) como propiedad del grafo: el trabajo terminado pasa por Control de calidad

La condición (3) se lee como «el trabajo terminado pasa por Control de calidad» (S-14, supuesto reversible, no hecho). Con el interruptor encendido, las únicas entradas a `Por Facturar` alcanzables desde `En Proceso` sin pasar por `Control de calidad` **SHALL** ser los tres rechazos Decisionales: `rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`, que entran desde `Notificación Comercial`, `Notificación cliente` y `Rev./Diagnostico` (`packages/shared/src/transitions.ts`; el cliente no aprueba y no hay trabajo que liberar). Es propiedad calculada sobre el catálogo real, en una prueba junto a `invariantesGrafo.test.ts`, que **SHALL** ponerse en rojo si se ensucia el catálogo: un atajo cuyo destino sea `Por Facturar`, o el interruptor que deja de quitar `finalizacion_servicio`. El conjunto sin el escape son dos; `rechazo_revision` entra por `falla_calibracion`. Con el interruptor encendido `finalizacion_servicio` sigue dando `409` (RQ-TS-47).

#### Scenario: el atajo lleva a `Por Facturar` sólo por Control de calidad — ROJO
- GIVEN el interruptor encendido y un ticket «Calibración» con OV en `Ingresado`
- WHEN recorre `calibracion_directa`, `envio_control_calidad` y `aprobacion_control_calidad`
- THEN llega a `Por Facturar`; y `finalizacion_servicio` desde `En Proceso` da `409`

#### Scenario: las entradas sin Control de calidad son los tres rechazos — ROJO
- GIVEN el catálogo real y el interruptor encendido
- WHEN se calculan las transiciones a `Por Facturar` alcanzables desde `En Proceso` sin entrar en `Control de calidad`
- THEN son exactamente `rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`, las tres Decisionales; apagado, `rechazo_comercial`, `rechazo_cliente` y `finalizacion_servicio` (el escape también cuelga del interruptor, así que `rechazo_revision` no se alcanza; medido en el lote 1b)

#### Scenario: ensuciar el catálogo pone la propiedad en rojo — ROJO (mutación 3)
- GIVEN el catálogo con un atajo de prueba cuyo destino es `Por Facturar` (o con `finalizacion_servicio` sin quitar por el interruptor)
- WHEN corre la propiedad
- THEN el conjunto gana una id y la prueba falla; sin esa transición pasa

### Requirement: RQ-TS-57 · El escape agranda el ciclo: campos de fecha reentrantes (R-1)

`camposFechaReentrantes` (`reentrancia.ts:218-225`) cuenta los campos de las transiciones internas a una componente fuertemente conexa. Con `falla_calibracion`, `Rev./Diagnostico`, `Notificado` y `Notificación a Compras` dejan de alcanzarse sólo desde `Ingresado`. La cifra de campos reentrantes **SHALL** medirse en el diseño y escribirse en la prueba y en la spec viva en el mismo commit; la propuesta sólo la plantea como hipótesis (de 10 a 12; `Fecha Revisión Informe` y `Fecha Notificación por garantía`) y **SHALL NOT** darse por cierta antes de medirla. La tabla de `reentrancia.test.ts` **SHALL** reflejar el resultado y la prueba **SHALL** declarar que el efecto viene del escape (R-1). Si S-4 se restringe, la guarda de elegibilidad lo limita en ejecución; el análisis estático del grafo no la ve.

#### Scenario: la cifra de reentrantes es la medida — ROJO
- GIVEN el grafo con las dos transiciones nuevas
- WHEN se calcula `camposFechaReentrantes`
- THEN el conjunto coincide con el que fijó la medición del diseño [cifra medida por ejecución en el lote 1a: 12 campos, 10 obligatorios y 2 opcionales]

#### Scenario: los campos entran por el escape — ROJO
- GIVEN el grafo sin `falla_calibracion` y luego con ella
- WHEN se comparan los conjuntos de reentrantes
- THEN la diferencia es el efecto declarado en la prueba

### Requirement: RQ-TS-58 · Cifras: servicio 38 transiciones, 23 estados, 46 pasos; tipos 52 con 19 / 16 / 13 / 4

El catálogo de servicio **SHALL** tener 38 transiciones (antes 36), 23 estados (sin cambio) y 46 pasos del mapa (antes 44, con el mapa regenerado y su prueba anti-desfase en verde). La tabla de tipos (RQ-TS-44) **SHALL** tener 52 filas (antes 50), 38 de servicio, y 19 Operativo · 16 Decisional · 13 Compras / Logístico · 4 Administrativo (antes 17 · 16 · 13 · 4; por catálogo, servicio 12 · 11 · 11 · 4 contra 10 · 11 · 11 · 4). Los estados con una sola salida **SHALL** ser 10 (antes 11), sin `Ingresado`, que pasa a tener dos; la aserción y el comentario de `estados.test.ts:146-149` cambian con él. La derivación por defecto **SHALL** ser 5 proponen y 33 heredan (antes 31). Decisionales: 16, sin cambio. `cifras_ancladas` y los guardianes llevan las cifras en el mismo commit (RQ-TS-26, RQ-TS-27). Los 23 estados **SHALL** seguir alcanzables.

#### Scenario: cifras de servicio y de tipos — ROJO
- GIVEN el catálogo, el registro y la tabla de tipos
- WHEN se cuentan
- THEN 38 / 23 / 46, 52 filas con 38 de servicio y 19 / 16 / 13 / 4, y `cifras_ancladas` coincide

#### Scenario: `Ingresado` deja de tener una sola salida — ROJO
- GIVEN el registro de estados y el grafo
- WHEN se cuentan los estados con una sola salida
- THEN son 10 y no incluyen `Ingresado`

#### Scenario: derivación y decisionales — ROJO
- GIVEN la tabla de derivación y el barrido de Decisionales
- WHEN se cuentan
- THEN 5 proponen y 33 heredan, y los Decisionales siguen en 16

#### Scenario: alcanzabilidad y barrido de citas — ROJO
- GIVEN el grafo con 23 estados y los ficheros muy citados tocados (`transitions.ts`, `estados.ts`, `ticketService.ts`, `controlCalidad.ts`)
- WHEN corren los barridos de alcanzabilidad y de citas de la regla de mutación 4
- THEN los 23 son alcanzables y no hay roturas de citas nuevas (mutación 8)

### Requirement: RQ-TS-59 · Orden de las guardas nuevas, fijado por pruebas de posición

Orden (A < B < C < D, RQ-TS-06, F1B-10): `409` del interruptor (B) tras el `409` de estado y antes de la condición (1) y del `403` de área; condición (1) (B) tras el interruptor y antes del `403` de área (`ticketService.ts:129`); `409` de elegibilidad del escape por tipo (B) en el mismo bloque; «Descripción de la falla» en blanco (C) dentro del `422` agregado (`:134`), tras todos los `403`. La posición exacta de la condición (1) es hipótesis de la propuesta (§9) que fija el diseño. Cada posición **MUST** tener prueba que active DOS guardas a la vez y se ponga roja si se mueve (regla de mutación 1); las existentes de CC-1…CC-6 no cambian.

#### Scenario: CD-1 el 409 de estado gana al del interruptor — ROJO por posición
- GIVEN el interruptor apagado y un ticket en `Rev./Diagnostico`
- WHEN se ejecuta `calibracion_directa`
- THEN el mensaje es el de «no aplica desde el estado»

#### Scenario: CD-2 el 409 del interruptor gana al de la condición (1) — ROJO por posición
- GIVEN el interruptor apagado y un ticket de otro tipo sin OV en `Ingresado`
- WHEN se ejecuta `calibracion_directa`
- THEN el `409` es el del interruptor, no el de la condición

#### Scenario: CD-3 la condición (1) gana al 403 de área — ROJO por posición (mutación 6)
- GIVEN el interruptor encendido, un ticket sin OV en `Ingresado` y un usuario sin área de Servicio Técnico
- WHEN ejecuta `calibracion_directa`
- THEN `409`, no `403`

#### Scenario: CD-4 el 409 del tipo en el escape gana al 422 de la descripción — ROJO por posición
- GIVEN el interruptor encendido, un ticket de otro tipo en `En Proceso`
- WHEN se ejecuta `falla_calibracion` con la descripción en blanco
- THEN `409`, no `422`

#### Scenario: CD-5 el 403 de área gana al 422 de la descripción — ROJO por posición
- GIVEN un ticket «Calibración» en `En Proceso`, un usuario sin área de Servicio Técnico y la descripción en blanco
- WHEN ejecuta `falla_calibracion`
- THEN `403`, no `422`

#### Scenario: CD-6 el 409 del interruptor gana al 422 de la descripción — ROJO por posición
- GIVEN el interruptor apagado y la descripción en blanco
- WHEN se ejecuta `falla_calibracion`
- THEN `409`, no `422`
