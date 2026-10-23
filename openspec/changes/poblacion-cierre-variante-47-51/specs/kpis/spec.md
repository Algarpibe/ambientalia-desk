# Delta: KPIs — población por cierre y variante de Zoho del 47 y del 51 (`poblacion-cierre-variante-47-51`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`). Propuesta:
`openspec/changes/poblacion-cierre-variante-47-51/proposal.md`. Decisiones: `decision/e224b-poblacion-indicadores`,
`decision/e224c-formulas-47-51-y-contraste`, `decision/h1-fechas-migrados`. «El GET» es `GET /api/indicadores`; «el
POST» es `POST /api/indicadores/comparacion` (RQ-KP-26). Las citas a la spec viva van por RQ-KP-NN.

**Nota de fusión.** Cada bloque `MODIFIED` conserva EXACTAMENTE el número de líneas de su bloque vivo (SP-5: 1 línea;
RQ-KP-11: 51; RQ-KP-13: 22; RQ-KP-22: 40; RQ-KP-25: 31) y TODOS sus escenarios, para que la fusión no desplace ninguna
línea de la spec viva, muy citada por `spec.md:NNNN`. Lo que no cabe va en `ADDED`, al final, tras RQ-KP-33.

## MODIFIED Requirements

### Fila SP-5 de la tabla «0 · Procedencia y método» (1 línea)

| SP-5 | El periodo filtra por el día de cierre del ticket en `America/Bogota` (población de `decision/e224b-poblacion-indicadores`; RQ-KP-34) | Spec |

### Requirement: RQ-KP-11 · Variante «fórmula de Zoho»

Donde la fórmula que Zoho calcula difiere de la letra, el sistema **SHALL** calcular además la variante
`formulaZoho`, con los mismos hitos y su fuente. Las del 47 y del 51 **SHALL** contar hasta el CIERRE del ticket (RQ-KP-34,
`decision/e224c-formulas-47-51-y-contraste`); las demás son **hipótesis sobre el export** (`docs/analisis-tickets/Tickets.csv`), no letra.

| Indicador | Variante de Zoho | Sale «sin dato» cuando |
|---|---|---|
| 47 | cierre − remisión de entrada, en días naturales, con signo y sin tope; un negativo lleva `orden_invertido`. Zoho no usa la remisión de salida y **MUST NOT** sustituirse por ella | falta el cierre o la remisión de entrada; el motivo nombra el hito que falta (**MUST NOT** ser `MOTIVO_H1`) |
| 49 | días de lunes a viernes **sin descontar festivos**, `(desde, hasta]`, de `Fecha creación ticket` (historial o `fecha_creacion_ticket`) a `Fecha Revisión Informe` | falta creación o revisión |
| 50·53 | lo mismo que RQ-KP-06 contando lunes a viernes sin festivos ni cierres, con el tope 0 y el 0 sin finalización | como RQ-KP-06 |
| 54 | 53 de la variante contra el 52; **sin tiempo promesa da `Cumple`** | el 53 de la variante es «sin dato» |
| 51 | cierre − finalización ST, en días naturales, con signo y sin tope; un negativo lleva `orden_invertido`. La transición de entrega **no** es la fórmula de Zoho y **MUST NOT** presentarse como tal | falta el cierre o la finalización; el motivo nombra el hito que falta (**MUST NOT** ser `MOTIVO_H1`) |
| 55 | igual que la letra: la calificación de la última respuesta cargada | como la letra |
| 57, 58, 59 | igual que la letra | como la letra |

#### Scenario: El 50·53 con festivos da dos números
- GIVEN orden de venta `2026-12-24` y finalización `2027-01-05`
- WHEN se calcula el 50·53
- THEN `valor` es `6` y `formulaZoho` es `8`

#### Scenario: El 49 de Zoho parte de la creación
- GIVEN creación `2026-12-01`, marca `2026-12-02T15:00:00Z` y revisión `2026-12-10`
- WHEN se calcula el 49
- THEN `valor` es `5` y `formulaZoho` es `7`

#### Scenario: El 54 de Zoho sin tiempo promesa
- GIVEN 53 = `6` y ningún tiempo promesa
- WHEN se calcula el 54
- THEN `valor` es «sin dato» y `formulaZoho` es `Cumple`

#### Scenario: El 54 difiere por la fórmula
- GIVEN tiempo promesa `6`, orden de venta `2026-12-24` y finalización `2027-01-05`
- WHEN se calcula el 54
- THEN `valor` es `Cumple` (6 ≤ 6) y `formulaZoho` es `No cumple` (8 > 6)

#### Scenario: El 47 de Zoho no cae en la remisión de salida
- GIVEN entrada `2026-12-16`, salida `2027-01-02` y cierre `2027-01-05`
- WHEN se calcula el 47
- THEN `valor` es `17` y `formulaZoho` es `20`, contado hasta el cierre

#### Scenario: El 51 de Zoho cuenta hasta el cierre
- GIVEN finalización `2026-12-10`, entrega `2026-12-12` y cierre `2026-12-22`
- WHEN se calcula el 51
- THEN `valor` es `2` (finalización a entrega) y `formulaZoho` es `12` (finalización a cierre)

#### Scenario: El 55 con variante igual a la letra
- GIVEN un ticket con una respuesta cargada de calificación `Excelente`
- WHEN se calcula el 55
- THEN `valor` es `Excelente` y `formulaZoho` es `Excelente`

### Requirement: RQ-KP-13 · Parámetros y forma del JSON

Parámetros: `desde` y `hasta` (`YYYY-MM-DD`, ambos opcionales e inclusivos, sobre el día de CIERRE del ticket en Bogotá — SP-5, RQ-KP-34) y `formato` (`json`, por defecto, o `csv`). La población por defecto **SHALL** ser los tickets cerrados (`status_type = 'Closed'`) y no anulados cuyo día de cierre cae en `desde`/`hasta`; abiertos y anulados **MUST NOT** entrar.
Sin periodo entran todos los cerrados no anulados, incluso sin cierre que cuente (S-4); con periodo, uno sin cierre que cuente no entra. `flujo` (RQ-KP-29 a RQ-KP-32) se compone encima.
Un valor mal formado, `desde > hasta` o un `formato` distinto **SHALL** dar `400` con `{ error }` y sin consultar datos. Los parámetros **MUST** llegar a la base como valores ligados, nunca concatenados.
La respuesta JSON **SHALL** ser `{ periodo: { desde, hasta }, tickets: [...], comparacion }`. Cada ticket lleva `ticketId`, `codigoServicio` e `indicadores`, con las nueve claves de RQ-KP-01.
Cada indicador lleva `columna`, `valor` (número, texto o `null`), `unidad` (`dias_naturales`, `dias_habiles`, `cumplimiento` o `calificacion`), `estado` (`calculado` o `sin_dato`),
`motivo` (sólo en `sin_dato`), `hitos` (lista de `{ nombre, dia, fuente }`), `reentrante`,
`sinFinalizar` (en 50·53 y 54), `formulaZoho` y `valorZoho`.
El `GET` y el `POST` **SHALL** leer esta misma población (RQ-KP-35).
Los parámetros y la forma del JSON no cambian por ello.

#### Scenario: Forma de un indicador calculado
- GIVEN un ticket cerrado con cotización `2026-12-10` y orden de venta `2026-12-09`, con cierre dentro del periodo
- WHEN responde la ruta
- THEN el `59` trae `valor: -1`, `unidad: "dias_naturales"`, `estado: "calculado"` y dos `hitos` con su `fuente`

#### Scenario: Periodo inválido
- GIVEN `desde=2026-12-31` y `hasta=2026-12-01`
- WHEN llama un administrador
- THEN responde `400` y no se consultan tickets

### Requirement: RQ-KP-22 · El 55 en la lectura

La lectura de `GET /api/indicadores` **SHALL** aportar al cálculo del 55 la **última respuesta** de cada
ticket del periodo: la de mayor `respondida_at` y, a igualdad, la de mayor `id`. La traerá la cuarta
consulta de RQ-KP-14, una sola para todos los tickets del periodo: trae las respuestas de esos tickets
ordenadas por `respondida_at` y `id` y **el cálculo se queda con la última** de cada ticket (DD-11). Un ticket sin ninguna respuesta
**SHALL** dar el 55 «sin dato» con el motivo de RQ-KP-09. El `GET` **MUST** seguir siendo sólo lectura
(S-H): **MUST NOT** cargar, borrar ni actualizar respuestas. Las respuestas de tickets fuera de la población
**MUST NOT** viajar en la salida.

#### Scenario: Dos respuestas del mismo ticket
- GIVEN un ticket con una respuesta `Regular` de `respondida_at = 2027-01-10T15:00:00Z` y otra `Excelente` de `2027-01-12T15:00:00Z`
- WHEN responde la ruta
- THEN el 55 del ticket vale `Excelente`

#### Scenario: Se carga primero la más reciente
- GIVEN las mismas dos respuestas, insertadas la más reciente con el `id` menor
- WHEN responde la ruta
- THEN el 55 sigue valiendo `Excelente`: manda `respondida_at`, no el orden de carga

#### Scenario: Desempate por id
- GIVEN dos respuestas del mismo ticket con la misma `respondida_at`, `Regular` con `id` 7 y `Excelente` con `id` 9
- WHEN responde la ruta
- THEN el 55 vale `Excelente`

#### Scenario: Sin respuesta
- GIVEN un ticket del periodo sin ninguna fila en `public.encuesta_respuestas`
- WHEN responde la ruta
- THEN el 55 es «sin dato», con motivo «falta el hito: satisfacción del cliente»

#### Scenario: El `GET` no escribe
- GIVEN un administrador que llama a la ruta con tickets que tienen y que no tienen respuestas
- WHEN termina la petición
- THEN las cuatro consultas fueron de lectura y no se ejecutó ninguna sentencia de escritura

#### Scenario: Respuestas de tickets fuera de la población
- GIVEN una respuesta de un ticket fuera de la población (cerrado fuera del periodo pedido, abierto o anulado)
- WHEN responde la ruta
- THEN el ticket no aparece en la salida y su respuesta no afecta a ningún otro

### Requirement: RQ-KP-25 · Tickets que no cruzan, en los dos sentidos

La respuesta **SHALL** contar y listar los tickets que no cruzan en **los dos sentidos**: (a) filas válidas del
fichero cuyo «ID» no existe en Desk, y (b) tickets de Desk del periodo cuyo `id` no está en el fichero. Un
ticket del fichero que sí existe en Desk pero **fuera** del periodo pedido **SHALL** contarse y listarse
**aparte** de (a) (S-N); **MUST NOT** decirse de él que «no está en Desk». Los listados **SHALL** salir
completos (S-Q) e identificar cada ticket por «ID» y número de solicitud, sin otro dato del fichero. Las dos
listas y los recuentos **SHALL** estar siempre presentes, vacíos si es el caso.

Los tickets del periodo ausentes del fichero **MUST NOT** completarse con los datos sincronizados (S-L).

#### Scenario: Sólo en el fichero
- GIVEN una fila válida cuyo «ID» no existe en `desk.tickets`
- WHEN se compara
- THEN se cuenta y se lista en «sólo en el fichero», y no entra en la comparación

#### Scenario: Sólo en Desk
- GIVEN un ticket del periodo en Desk cuyo `id` no figura en el fichero
- WHEN se compara
- THEN se cuenta y se lista en «sólo en Desk», y sus pares no se completan con datos sincronizados

#### Scenario: Existe en Desk fuera del periodo
- GIVEN una fila válida cuyo «ID» existe en Desk pero fuera de la población (cerrado fuera de `desde`/`hasta`, abierto o anulado)
- WHEN se compara
- THEN se cuenta y se lista como «en Desk fuera del periodo», no como «sólo en el fichero»

#### Scenario: Los dos sentidos a la vez
- GIVEN una fila ajena a Desk y un ticket del periodo ausente del fichero
- WHEN se compara
- THEN las dos listas traen un elemento cada una y ninguna se funde con la otra

## ADDED Requirements

### Requirement: RQ-KP-34 · El día de cierre de un ticket

Una función pura de `packages/shared`, junto a `cierreEnCifras.ts` (regla invariable 13), **SHALL** decidir el día de
cierre en Bogotá de un ticket. Orden (S-1): (a) el `performed_at` de la ÚLTIMA transición de la aplicación cuyo destino
es «Finalizado» según el catálogo compartido, excluido el marcador de la migración (`esPasoDeMigracion`,
`packages/shared/src/cierreEnCifras.ts:19-21`); (b) si no hay, `closed_time` pasado por `cierreQueCuenta`
(`packages/shared/src/cierreEnCifras.ts:29-33`) con el cierre de `cierrePuestoPorMigracion` (`:24-26`); (c) si tampoco,
ninguno. Un cierre cuyo origen es la migración **MUST NOT** contar nunca (S-3, `decision/h1-fechas-migrados`).
El cliente **MUST NOT** reimplementarla.

#### Scenario: La transición a «Finalizado» manda sobre `closed_time` (regla de mutación 1)
- GIVEN transición a «Finalizado» el `2026-09-10` y `closed_time` de Zoho el `2026-09-20`
- WHEN se decide el día de cierre
- THEN es `2026-09-10`; con `closed_time` primero daría `2026-09-20` y se pone rojo

#### Scenario: La última transición a «Finalizado»
- GIVEN dos transiciones a «Finalizado», el `2026-09-05` y el `2026-09-12`, y una a «Anulado» el `2026-09-20`
- WHEN se decide el día de cierre
- THEN es `2026-09-12`; la de «Anulado» no cuenta como cierre

#### Scenario: Sin transición, `closed_time`
- GIVEN un ticket sin transición a «Finalizado» y `closed_time = 2026-09-15T17:00:00Z`
- WHEN se decide el día de cierre
- THEN es `2026-09-15`

#### Scenario: El cierre de la migración no cuenta
- GIVEN `closed_time` igual al `closed_time_destino` del marcador con `cierre_origen: 'migracion'`, y el marcador entre las transiciones
- WHEN se decide el día de cierre
- THEN no hay día de cierre: ni el marcador ni ese `closed_time` cuentan

#### Scenario: Migrado con la fecha de Zoho
- GIVEN un marcador con `cierre_origen: 'zoho'` y `closed_time` igual a su destino
- WHEN se decide el día de cierre
- THEN es el día de ese `closed_time`, la fecha original de Zoho

#### Scenario: Día en Bogotá
- GIVEN `closed_time = 2026-10-01T04:30:00Z`
- WHEN se decide el día de cierre
- THEN es `2026-09-30`, no el día en UTC

#### Scenario: Sin cierre que cuente
- GIVEN un ticket sin transición a «Finalizado» y con `closed_time` nulo
- WHEN se decide el día de cierre
- THEN no hay día de cierre

### Requirement: RQ-KP-35 · Población por cierre en el GET y en el POST

El GET (json y csv) y el POST **SHALL** leer la MISMA población, por `leerEntradasIndicadores`
(`apps/desk/server/routes/indicadoresComparacion.ts:33`): cerrados no anulados con día de cierre (RQ-KP-34) dentro del
periodo, inclusivo en `desde` y en `hasta`. El corte en SQL **SHALL** ser por `status_type`; el del día, en memoria. Los
anulados y los abiertos **MUST NOT** entrar aunque su creación o su `closed_time` caiga en el periodo. El `flujo`
**SHALL** componerse sobre esta población sin cambios (RQ-KP-31, RQ-KP-32).

#### Scenario: Cierre en el periodo, creación fuera (mutación: cortar por creación)
- GIVEN un ticket creado en agosto y cerrado el `2026-09-10`, y otro creado el `2026-09-03` y cerrado el `2026-10-02`, con periodo de septiembre
- WHEN llama un administrador
- THEN sale el primero y no el segundo

#### Scenario: Un anulado no entra (mutación: dejar entrar anulados)
- GIVEN un ticket anulado con `status_type = 'Closed'` y cierre en el periodo
- WHEN llama un administrador
- THEN no aparece en la salida

#### Scenario: Un abierto no entra (mutación: dejar entrar abiertos)
- GIVEN un ticket abierto creado en el periodo, también con `closed_time` dentro de él
- WHEN llama un administrador
- THEN no aparece en la salida

#### Scenario: Migrado con la fecha de Zoho (mutación: la fecha de la migración)
- GIVEN un migrado cuyo cierre de Zoho cae fuera del periodo y cuya fecha de migración cae dentro
- WHEN llama un administrador
- THEN no aparece; y con el cierre de Zoho dentro y la migración fuera, sí

#### Scenario: Los bordes del periodo
- GIVEN dos tickets cerrados el día `desde` y el día `hasta`, y uno el día anterior a `desde`
- WHEN llama un administrador
- THEN salen los dos primeros y no el tercero

#### Scenario: Sin periodo
- GIVEN un cerrado sin cierre que cuente (S-4), un abierto y un anulado
- WHEN llama un administrador sin `desde` ni `hasta`
- THEN sale el cerrado y no los otros dos; con periodo, el cerrado sin cierre no sale

#### Scenario: El flujo se compone (mutación: dejar de componerlo)
- GIVEN dos cerrados en el periodo, uno de «Equipo nuevo» y otro de servicio, y `flujo=equipo-nuevo`
- WHEN llama un administrador al GET y, aparte, al POST
- THEN en ambos sólo sale el de equipo nuevo, y el otro cae en «De otro flujo» del POST

### Requirement: RQ-KP-36 · Cuatro consultas, sólo lectura, marcador en la misma consulta

RQ-KP-14 se conserva. La lectura **SHALL** seguir en cuatro consultas: el marcador de la migración, que hoy se descarta
(`apps/desk/server/indicadores.ts:81`), **SHALL** leerse en la MISMA consulta del historial (`:76`) para pasarlo a
`cierreQueCuenta`, y **MUST NOT** añadir una quinta. **MUST NOT** escribir `closed_time` ni ningún dato (S-2).

#### Scenario: Con migrados, cuatro consultas
- GIVEN veinte cerrados, varios con marcador de la migración
- WHEN llama un administrador
- THEN son cuatro consultas, todas de lectura, las mismas que con un solo ticket

#### Scenario: El marcador no es un paso del cálculo
- GIVEN un ticket con marcador de la migración y una transición real
- WHEN responde la ruta
- THEN el historial que usan los indicadores no contiene el marcador, pero el cierre sí lo tuvo en cuenta

### Requirement: RQ-KP-37 · Variante del 47 y del 51 contra el cierre

`formulaZoho` del 47 **SHALL** ser cierre − remisión de entrada y la del 51 cierre − finalización ST (RQ-KP-11), en días
naturales, con signo y sin tope 0 (S-11). La letra de los dos no cambia. **MUST NOT** calcularse contra la remisión de
salida ni contra la entrega, ni usar `MOTIVO_H1`.

#### Scenario: El 47 no usa la salida (mutación: remisión de salida)
- GIVEN entrada `2026-09-01`, salida `2026-09-03` y cierre `2026-09-12`
- WHEN se calcula el 47
- THEN `formulaZoho` es `11` y `valor` es `2`

#### Scenario: El 51 no usa la entrega (mutación: entrega)
- GIVEN finalización `2026-09-02`, entrega `2026-09-04` y cierre `2026-09-14`
- WHEN se calcula el 51
- THEN `formulaZoho` es `12` y `valor` es `2`

#### Scenario: Cierre anterior al hito
- GIVEN cierre `2026-09-01` y remisión de entrada `2026-09-03`
- WHEN se calcula el 47
- THEN `formulaZoho` es `-2` con la marca `orden_invertido`

#### Scenario: «Sin dato» nombra el hito
- GIVEN un ticket con cierre y sin remisión de entrada, y otro con remisión y sin cierre
- WHEN se calcula el 47
- THEN los motivos nombran «remisión de entrada» y «cierre» respectivamente

### Requirement: RQ-KP-38 · Aceptación con los trece tickets de septiembre

Una prueba **SHALL** cargar un fixture anonimizado de los trece tickets de la exportación de septiembre y pedir a la
ruta septiembre. El fixture **SHALL** llevar SÓLO número, clasificación, estado, fechas y las columnas 47 a 59 (S-10),
y **MUST NOT** llevar contacto, asunto, serial, `cf_codigo_servicio` ni tipo de servicio. Se compara con tolerancia de
±1 día (S-9) en las celdas con valor: 47 → 11, 49 → 9, 50·53 → 11, 51 → 12, 54 → 9, 57 → 9, 58 → 9, 59 → 9.

#### Scenario: Septiembre por cierre son trece
- GIVEN el fixture y el periodo `2026-09-01` a `2026-09-30`
- WHEN llama un administrador
- THEN salen los trece tickets; por creación salía uno, el 998

#### Scenario: Las celdas coinciden con Gerencia
- GIVEN el fixture cargado
- WHEN se compara `formulaZoho` con la celda de Gerencia
- THEN cada una de las ocho celdas con valor coincide dentro de ±1 día

#### Scenario: Un valor alterado de cada indicador (mutación por indicador)
- GIVEN el fixture con una celda alterada fuera de ±1, probando por separado 47, 49, 50·53, 51, 54, 57, 58 y 59
- WHEN corre la aceptación
- THEN se pone rojo en cada una de las ocho alteraciones

#### Scenario: El fixture no lleva datos personales
- GIVEN el fixture versionado
- WHEN se revisa campo a campo
- THEN todo campo pertenece a la lista de S-10 y el CSV de origen no está copiado

### Requirement: RQ-KP-39 · Las caracterizaciones sha256 se actualizan por decisión

Las tres caracterizaciones sha256 (`apps/desk/server/routes/indicadores.test.ts:263`, `:271`;
`apps/desk/server/routes/indicadoresComparacion.test.ts:326`) **SHALL** actualizarse, no borrarse, y el commit **SHALL**
nombrar `decision/e224b-poblacion-indicadores`. Las pruebas de `packages/shared/src/indicadores.test.ts` que fijan «sin dato» en 47 y 51 se
actualizan por `decision/e224c-formulas-47-51-y-contraste`.

#### Scenario: Siguen siendo tres
- GIVEN las pruebas tras el cambio
- WHEN se cuentan las caracterizaciones sha256
- THEN siguen siendo tres, con el hash nuevo, y ningún `it` fue borrado ni saltado

#### Scenario: Un cambio de respuesta ajeno a la decisión las rompe
- GIVEN una respuesta con un campo extra sin relación con la decisión
- WHEN corren las caracterizaciones
- THEN alguna se pone roja
