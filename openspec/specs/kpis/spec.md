# Especificación: KPIs — Continuidad de los nueve indicadores de Zoho

| Dato | Valor |
|---|---|
| Capacidad | `kpis`, **nueva**. Declarada en `openspec/config.yaml:240`; sin spec viva hasta este cambio |
| Tanda | F1F-05 (`cierra: no`) |
| Procedencia | `decision/e009-kpis` (`openspec/config.yaml:2527`) · `decision/e009b-lista-indicadores` (`openspec/config.yaml:2655`) · `decision/encuesta-entre-corte-e-independencia` (`openspec/config.yaml:2858`) · `decision/calendario-habil` (`openspec/config.yaml:2555`) · maestro R08.4, Anexo G.6 (`R08.4.md:6285-6314`) y G.6b (`R08.4.md:6315-6364`) |
| Depende de | `calendario-laboral` (`diasHabilesEntre`, `packages/shared/src/calendarioLaboral.ts:196-204`, intervalo `(desde, hasta]`), consumida sin cambiar sus requisitos |

`R08.4.md` es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

## 0 · Procedencia y método

Cada fórmula dice de dónde sale. **Letra** es lo que el maestro o una decisión de Gerencia escribe, con su
línea. **SP-n** es un supuesto de esta spec o de la propuesta del cambio (S-n): se especifica tal cual
para poder construirlo y probarlo, **pero no es letra de Gerencia** y está sujeto a las preguntas E-171 a
E-180 de la bandeja.

| Id | Supuesto | Origen |
|---|---|---|
| SP-10 | El signo del 58 es orden de compra menos cotización; la letra dice «Entre …» sin signo (`R08.4.md:6311`) | Propuesta (§4) y export |
| S-1 | El 59 es orden de venta menos cotización, días naturales con signo. La letra sólo dice «Lo que tarda en generarse la orden de venta» (`R08.4.md:6314`) | Propuesta |
| S-2 | El 49 se mide en días hábiles del calendario laboral. La letra no da unidad (`R08.4.md:6293`) | Propuesta |
| S-5 | Reentrancia: último valor escrito más marca. El punto 66 sigue abierto (`R08.4.md:2961`) | Propuesta |
| S-7 | Unidades: naturales en 47, 57, 58 y 59; hábiles en 49 y 50·53 | Propuesta |
| S-8 | La comparación publica dos porcentajes: letra contra Zoho y fórmula de Zoho contra Zoho | Propuesta |
| SP-1 | Cada hito se toma del historial de la aplicación si lo tiene y, si no, de la columna heredada; la fuente se marca por hito | Spec |
| SP-2 | El 47 es con signo y sin tope, como 57, 58 y 59 | Spec |
| SP-3 | El 49 de la letra exige la marca de `ingreso_a_servicio`; sin ella es «sin dato», aunque el ticket tenga fecha de creación (`R08.4.md:2951`: el diagnóstico «se mide siempre desde las marcas de tiempo de las transiciones») | Spec |
| SP-4 | «Reentrante» se define por conteo de escrituras del hito en el historial (RQ-KP-10) | Spec |
| SP-5 | El periodo filtra por el día de cierre del ticket en `America/Bogota` (población de `decision/e224b-poblacion-indicadores`; RQ-KP-34) | Spec |
| SP-6 | Se publican DOS lecturas del porcentaje, y la letra no precisa cuál es «el 95 % de los tickets»: por indicador, y de tickets en que todo lo comparable coincide (R4) | Spec |
| SP-7 | El CSV va en formato largo, separador `;` | Spec |
| SP-9 | En el `GET /api/indicadores` el valor de Zoho se lee de los datos sincronizados del ticket. La comparación con la exportación es de la ruta de comparación (RQ-KP-26), que no lee los datos sincronizados | Spec |
| S-A | Con dos entregas, el 51 usa **la última** por `performed_at`. La decisión dice «vale la que tenga el ticket» (`openspec/config.yaml:4099`) y no cubre el caso de dos | Propuesta (§4) |
| S-B | Motivos del 51 y su orden: primero «falta el hito: transición de entrega»; con entrega y sin finalización, «falta el hito: finalización del servicio». Sin fila de entrega no se usa `Fecha Remisión de Salida` como sustituto | Propuesta (§4) |
| S-C | Tabla de respuestas con huella única y varias respuestas por ticket; vale la última | Propuesta (§4) |
| S-D | El fichero de respuestas identifica el ticket por su **número**. Que el formulario lo recoja es hipótesis | Propuesta (§4) |
| S-E | El fichero es un CSV de exportación de Google Forms: separador `,` o `;`, BOM tolerado, columnas por nombre normalizado con sinónimos, marca de tiempo leída en `America/Bogota`. El formato no está en el repositorio y no hay muestra (`openspec/config.yaml:4102-4103`) | Propuesta (§4) |
| S-F | La carga es un `POST` multipart de administrador, sin interruptor y sin pantalla | Propuesta (§4) |
| S-G | Sin columna `canal` en la tabla de respuestas | Propuesta (§4) |
| S-H | El `GET /api/indicadores` sigue siendo sólo lectura, con cuatro consultas | Propuesta (§4) |
| S-I | La exportación de noviembre trae las mismas columnas que la muestra: 59, separador coma, comillas, BOM UTF-8, CRLF | Propuesta (§5, S1) |
| S-J | El fichero se sube, se compara y **no se guarda** | Propuesta (§5, S2) |
| S-K | Se exigen las doce columnas que se leen, no las 59 | Propuesta (§5, S3) |
| S-L | En la ruta de comparación el valor de Zoho sale **sólo** del fichero; un ticket del periodo ausente de él no se completa con los datos sincronizados | Propuesta (§5, S4) |
| S-M | Un «ID» repetido: vale la primera fila y las siguientes se rechazan con motivo | Propuesta (§5, S5) |
| S-N | Un ticket del fichero que existe en Desk pero fuera del periodo se cuenta **aparte** de «no está en Desk» | Propuesta (§5, S6) |
| S-O | El periodo va por `desde` y `hasta`, como el `GET`; el `400` de parámetros precede al del fichero | Propuesta (§5, S7) |
| S-P | Una celda de indicador no vacía que `valorDeZoho` no acepta se cuenta y se lista por columna como «valor ilegible» | Propuesta (§5, S8) |
| S-Q | Los listados salen completos, sin paginar | Propuesta (§5, S9) |

## ADDED Requirements

### Requirement: RQ-KP-01 · Lista cerrada de nueve indicadores, en un orden fijo

El sistema **SHALL** calcular exactamente nueve indicadores, en este orden y con estas claves:
`47` permanencia, `49` diagnóstico, `50_53` servicio, `51` recogida, `54` cumplimiento del tiempo promesa,
`55` satisfacción, `57` cotización, `58` orden de compra y `59` orden de venta (letra:
`openspec/config.yaml:2655`, `R08.4.md:2954`). **MUST NOT** calcular ni emitir las columnas 48, 56 ni 16, ni
el décimo indicador de cumplimiento global (letra: `R08.4.md:2955`, `R08.4.md:2960`, `R08.4.md:6362`).

#### Scenario: Un ticket devuelve los nueve y ninguno más
- GIVEN cualquier ticket
- WHEN se calculan sus indicadores
- THEN el resultado trae las claves `47, 49, 50_53, 51, 54, 55, 57, 58, 59`, en ese orden
- AND no trae `48`, `56`, `16` ni un cumplimiento global

### Requirement: RQ-KP-02 · Cada hito dice de qué fuente salió

Cada fecha que un indicador usa (un **hito**) **SHALL** salir de los valores de `ticket_transitions`
(`packages/zoho-sync/src/db/schema.sql:57-61`) y, **sólo si el historial no la trae**, de la columna heredada
`tickets.fecha_*` (`packages/zoho-sync/src/db/schema.sql:32-37`) o `dias_entrega` (`:30`) (SP-1). Con varias
escrituras, **MUST** valer la última por `performed_at` (S-5). Cada hito **SHALL** llevar su fuente:
`transicion` o `columna_heredada`. Un hito ausente en las dos fuentes es ausente. La regla de leer el
historial y no la columna es de `packages/shared/src/reentrancia.ts:24`. La marca de la transición de
entrega del 51 es un hito **sin columna heredada**: si el ticket no tiene fila de entrega en el historial,
el hito está ausente. En la salida ese hito se llama `transición de entrega` y va **después** de
`Fecha Finalización ST` (el diseño, DD-1 y DD-2, fija la clave).

| Indicador | Hitos (etiqueta del campo) | Columna heredada |
|---|---|---|
| 47 | `Fecha Remisión Entrada`, `Fecha Remisión de Salida` | `fecha_remision_entrada`, `fecha_remision_salida` |
| 49 | marca `performed_at` de la transición `ingreso_a_servicio` (`bodegaje.ts:225-226`); `Fecha Revisión Informe` | `fecha_revision_informe`; la marca no tiene columna |
| 50·53 | `Fecha Orden De Venta`, `Fecha Recepción de repuestos`, `Fecha Finalización ST` | `fecha_orden_venta`, `fecha_recepcion_repuestos`, `fecha_finalizacion_st` |
| 51 | marca `performed_at` de la última transición de entrega (`entrega_al_cliente` o `entrega_sin_factura`, `packages/shared/src/transitions.ts:248-251`); `Fecha Finalización ST` | `fecha_finalizacion_st`; la marca de entrega no tiene columna |
| 54 | los de 50·53 y `Días de entrega` (col. 52) | los de 50·53 y `dias_entrega` |
| 57 | `Fecha Revisión Informe`, `Fecha de Cotización` | `fecha_revision_informe`, `fecha_cotizacion` |
| 58 | `Fecha de Cotización`, `Fecha Orden de Compra` | `fecha_cotizacion`, `fecha_orden_compra` |
| 59 | `Fecha de Cotización`, `Fecha Orden De Venta` | `fecha_cotizacion`, `fecha_orden_venta` |

Los campos `… Final` (`Fecha Orden de Compra Final`, `Fecha Orden de Venta Final`) **MUST NOT** usarse como
hito. La marca de tiempo de la transición se reduce a su día civil en `America/Bogota` con `diaEnZona`
(`packages/shared/src/fechasDerivadas.ts:63`).

#### Scenario: El historial gana a la columna
- GIVEN un ticket con la columna `fecha_cotizacion = 2026-12-01` y un historial con `Fecha de Cotización = 2026-12-10`
- WHEN se resuelve el hito de cotización
- THEN vale `2026-12-10` con fuente `transicion`

#### Scenario: Sin historial, la columna con su marca
- GIVEN un ticket sin filas en `ticket_transitions` y `fecha_cotizacion = 2026-12-10`
- WHEN se resuelve el hito de cotización
- THEN vale `2026-12-10` con fuente `columna_heredada`

#### Scenario: Último valor escrito
- GIVEN un historial con `Fecha de Cotización = 2026-12-05` y después `2026-12-10`
- WHEN se resuelve el hito
- THEN vale `2026-12-10`

#### Scenario: Instante cercano a medianoche
- GIVEN una marca `2026-12-03T03:00:00Z`
- WHEN se reduce a día civil
- THEN es `2026-12-02` (22:00 en Bogotá), no `2026-12-03`

#### Scenario: La marca de entrega no tiene columna heredada
- GIVEN un ticket sin fila de entrega en el historial y con `Fecha Remisión de Salida` y `fecha_finalizacion_st`
- WHEN se resuelve el hito de entrega del 51
- THEN el hito está ausente: ninguna columna heredada ni `Fecha Remisión de Salida` lo sustituye

#### Scenario: El hito de entrega lleva su fuente
- GIVEN un ticket con una fila `entrega_al_cliente` con `performed_at = 2027-01-08T15:00:00Z`
- WHEN se resuelve el hito de entrega del 51
- THEN vale `2027-01-08` con fuente `transicion`

### Requirement: RQ-KP-03 · Unidades y signo

Los **días naturales** **SHALL** ser la resta de días civiles de `America/Bogota`, `hasta − desde`, **con
signo y sin tope** (S-7; el signo del 47 es SP-2). Los **días hábiles** **SHALL** salir de
`diasHabilesEntre` con los cierres de empresa (`public.calendario_cierres`); **MUST NOT** existir otra
aritmética hábil (RQ-CL-11 de `calendario-laboral`; letra: `openspec/config.yaml:2555`): «hábil» con
festivos sólo sale de `diasHabilesEntre`. La única otra cuenta de días es la de lunes a viernes sin festivos
de la fórmula de Zoho, etiquetada como tal y propia de RQ-KP-11 (`diasLunesAViernesFormulaZoho`, en el módulo
de indicadores, no en el calendario laboral). Si `hasta` no es posterior a `desde`, `diasHabilesEntre` da 0 y
así se queda.

#### Scenario: Naturales con signo
- GIVEN desde `2026-12-10` y hasta `2026-12-08`
- WHEN se miden en días naturales
- THEN el resultado es `-2`

### Requirement: RQ-KP-04 · Indicador 47, tiempo de permanencia

Letra: «Entre remisión de entrada y remisión de salida. Es el dock-to-dock» (`R08.4.md:6287`). El valor
**SHALL** ser `Fecha Remisión de Salida − Fecha Remisión Entrada` en días naturales. Si falta cualquiera de
los dos hitos, **SHALL** ser «sin dato» y decir cuál falta.

#### Scenario: Remisión de entrada y de salida
- GIVEN entrada `2026-12-16` y salida `2027-01-02`
- WHEN se calcula el 47
- THEN vale `17`

#### Scenario: Falta la remisión de salida
- GIVEN entrada `2026-12-16` y ninguna remisión de salida
- WHEN se calcula el 47
- THEN es «sin dato», con motivo «falta el hito: remisión de salida», y no usa ninguna otra fecha

### Requirement: RQ-KP-05 · Indicador 49, tiempo de diagnóstico

Letra: `Fecha Revisión Informe − Fecha creación ticket`, medido sobre las marcas de las transiciones
(`R08.4.md:6293`, `R08.4.md:2951`). El valor **SHALL** ser los **días hábiles** (S-2) entre el día de la
marca `ingreso_a_servicio` y `Fecha Revisión Informe`. Sin la marca (SP-3) o sin revisión del informe,
**SHALL** ser «sin dato» con el hito que falta. **MUST NOT** sustituir la marca por la fecha de creación.

#### Scenario: Hábiles con festivo
- GIVEN marca `2026-12-02T15:00:00Z` (día `2026-12-02`) y revisión `2026-12-10`
- WHEN se calcula el 49
- THEN vale `5` (días 3, 4, 7, 9 y 10; el 8 es festivo)

#### Scenario: La marca se lee en Bogotá
- GIVEN marca `2026-12-03T03:00:00Z` y revisión `2026-12-10`
- WHEN se calcula el 49
- THEN vale `5`, porque el día de inicio es el `2026-12-02`

#### Scenario: Ticket heredado sin marca
- GIVEN un ticket sin historial, con `fecha_creacion_ticket` y `fecha_revision_informe`
- WHEN se calcula el 49
- THEN es «sin dato», con motivo «falta el hito: marca de ingreso a servicio»

### Requirement: RQ-KP-06 · Indicador 50·53, tiempo de servicio

Letra (`R08.4.md:6296`): días hábiles desde `Fecha Orden De Venta` —o desde `Fecha Recepción de repuestos` si
la hubo— hasta `Fecha Finalización ST`; devuelve 0 si el resultado es negativo o falta la finalización. El
valor **SHALL** seguir esas reglas con el calendario laboral. Sin finalización, **SHALL** ser `0` con la
marca `sinFinalizar: true`, aunque falte también la orden de venta. Con finalización y sin ninguna fecha de
inicio, **SHALL** ser «sin dato». Si hay repuestos, **MUST** contar desde ellos y no desde la orden de venta.
El 50 y el 53 son un solo valor (`R08.4.md:6294`, `openspec/config.yaml:2655`).

#### Scenario: Rango con dos festivos
- GIVEN orden de venta `2026-12-24`, finalización `2027-01-05`, sin repuestos ni cierres
- WHEN se calcula el 50·53
- THEN vale `6` (28, 29, 30 y 31 de diciembre; 4 y 5 de enero; el 25 de diciembre y el 1 de enero son festivos)

#### Scenario: Un cierre de empresa resta su día
- GIVEN el caso anterior con un cierre el `2026-12-31`
- WHEN se calcula el 50·53
- THEN vale `5`

#### Scenario: Los repuestos mandan sobre la orden de venta
- GIVEN orden de venta `2026-12-01`, repuestos `2026-12-10`, finalización `2026-12-17`
- WHEN se calcula el 50·53
- THEN vale `5` (11, 14, 15, 16 y 17), no `11`

#### Scenario: Resultado negativo
- GIVEN orden de venta `2026-12-15` y finalización `2026-12-10`
- WHEN se calcula el 50·53
- THEN vale `0`

#### Scenario: Sin finalización
- GIVEN orden de venta `2026-12-01` y ninguna finalización
- WHEN se calcula el 50·53
- THEN vale `0` con `sinFinalizar: true`

### Requirement: RQ-KP-07 · Indicador 54, cumplimiento del tiempo promesa

Letra: «Cumple / No cumple» comparando el tiempo total de servicio (53) contra los días de entrega de la
columna 52 (`R08.4.md:6302`, `R08.4.md:6341`; Diccionario de campos línea 131). El valor **SHALL** ser
`Cumple` si 53 ≤ 52 y `No cumple` si 53 > 52. Un 52 de `0` es un valor. Sin finalización el 53 vale 0
(RQ-KP-06), luego sale `Cumple` con `sinFinalizar: true` y esa marca **MUST** viajar con el valor. **Sin
tiempo promesa** la letra no dice nada: el valor **SHALL** ser «sin dato» con motivo «falta el tiempo
promesa», sin suponer `Cumple`. Si el 53 es «sin dato», el 54 también.

#### Scenario: Igual al tiempo promesa cumple
- GIVEN 53 = `6` y tiempo promesa `6`
- WHEN se calcula el 54
- THEN es `Cumple`

#### Scenario: Por encima del tiempo promesa
- GIVEN 53 = `6` y tiempo promesa `5`
- WHEN se calcula el 54
- THEN es `No cumple`

#### Scenario: Sin finalización
- GIVEN tiempo promesa `3` y ninguna finalización
- WHEN se calcula el 54
- THEN es `Cumple` con `sinFinalizar: true`

#### Scenario: Sin tiempo promesa
- GIVEN 53 = `6` y ningún tiempo promesa
- WHEN se calcula el 54
- THEN es «sin dato», no `Cumple`

### Requirement: RQ-KP-08 · Indicadores 57, 58 y 59

El valor **SHALL** ser, en días naturales con signo:
- **57** `Fecha de Cotización − Fecha Revisión Informe` (letra: `R08.4.md:6308`).
- **58** `Fecha Orden de Compra − Fecha de Cotización` (letra: «Entre Fecha Orden de Compra y Fecha de Cotización», `R08.4.md:6311`, que no fija el signo; el sentido es el de la propuesta y el del export, y el 58 es el aging de aprobación).
- **59** `Fecha Orden De Venta − Fecha de Cotización` (**S-1**, no letra).

Si falta un hito, **SHALL** ser «sin dato» con el hito que falta.

#### Scenario: Cotización tras la revisión
- GIVEN revisión `2026-12-10` y cotización `2026-12-13`
- WHEN se calcula el 57
- THEN vale `3`

#### Scenario: Cotización antes de la revisión
- GIVEN revisión `2026-12-10` y cotización `2026-12-08`
- WHEN se calcula el 57
- THEN vale `-2`

#### Scenario: Orden de compra
- GIVEN cotización `2026-12-10` y orden de compra `2026-12-14`
- WHEN se calcula el 58
- THEN vale `4`
- AND con orden de compra `2026-12-09` vale `-1`

#### Scenario: Orden de venta anterior a la cotización
- GIVEN cotización `2026-12-10` y orden de venta `2026-12-09`
- WHEN se calcula el 59
- THEN vale `-1`

#### Scenario: Falta la cotización
- GIVEN revisión `2026-12-10` y ninguna cotización
- WHEN se calcula el 57
- THEN es «sin dato», con motivo «falta el hito: cotización»

### Requirement: RQ-KP-09 · Indicadores 51 y 55: del historial y de las respuestas cargadas

**Indicador 51, tiempo de recogida.** La letra lo define como «Hora de actualización del estado − Fecha
Finalización ST» (`R08.4.md:6299`); la decisión de Gerencia (`openspec/config.yaml:4092`) lo calcula con la
transición de entrega. El valor **SHALL** ser `día civil de Bogotá de la última transición de entrega −
Fecha Finalización ST`, en **días naturales con signo y sin tope** (RQ-KP-03). Las transiciones de entrega
son `entrega_al_cliente` y `entrega_sin_factura` (`packages/shared/src/transitions.ts:248-251`); el módulo
**SHALL** declararlas en una constante cuyos identificadores existan todos en el catálogo de transiciones, y
una prueba **SHALL** enfrentar la constante al catálogo. Con dos o más filas de entrega vale **la última por
`performed_at`** (S-A). El orden de los motivos «sin dato» **SHALL** ser (S-B):
1. sin ninguna fila de entrega: «falta el hito: transición de entrega», **aunque** el ticket tenga
   `Fecha Remisión de Salida`, que **MUST NOT** usarse como sustituto;
2. con fila de entrega y sin `Fecha Finalización ST`: «falta el hito: finalización del servicio».

Un ticket movido sólo en Zoho, sin fila de entrega en el historial, queda «sin dato» (límite declarado por
`openspec/config.yaml:4100`). El módulo **MUST NOT** aceptar ya una entrada opcional de «hora del último
cambio de estado»: `horaActualizacionEstado` **SHALL NOT** existir en el código.

**Indicador 55, satisfacción.** El valor **SHALL** ser la calificación de la **última respuesta cargada**
del ticket (RQ-KP-22), tal como se guardó, sin transformar. El módulo de cálculo sigue recibiéndola como
entrada y **MUST NOT** conocer la base, la red ni ficheros. Sin respuesta cargada, **SHALL** ser «sin dato»
con motivo «falta el hito: satisfacción del cliente» y **MUST NOT** suponer ningún valor.

Un valor de Zoho sincronizado para estas columnas **MUST** quedar en `valorZoho`, nunca en `valor`.

#### Scenario: El 51 con una entrega
- GIVEN finalización `2027-01-05` y una fila `entrega_al_cliente` con `performed_at = 2027-01-08T15:00:00Z`
- WHEN se calcula el 51
- THEN vale `3`, con el hito de entrega `2027-01-08` de fuente `transicion` y la finalización con su fuente

#### Scenario: El 51 con `entrega_sin_factura`
- GIVEN finalización `2027-01-05` y una fila `entrega_sin_factura` con `performed_at = 2027-01-07T15:00:00Z`
- WHEN se calcula el 51
- THEN vale `2`

#### Scenario: El 51 con dos entregas vale la última
- GIVEN finalización `2027-01-05`, una entrega `entrega_sin_factura` el `2027-01-07T15:00:00Z` y después una `entrega_al_cliente` el `2027-01-12T15:00:00Z`
- WHEN se calcula el 51
- THEN vale `7` (la última por `performed_at`), no `2`
- AND `reentrante` es `true` (RQ-KP-10)

#### Scenario: Entrega anterior a la finalización
- GIVEN finalización `2027-01-05` y una fila de entrega con `performed_at = 2027-01-03T15:00:00Z`
- WHEN se calcula el 51
- THEN vale `-2`, con signo y sin tope, no `0`

#### Scenario: El 51 sin fila de entrega
- GIVEN un ticket con `Fecha Finalización ST` y `Fecha Remisión de Salida` y sin ninguna fila de entrega en el historial
- WHEN se calcula el 51
- THEN es «sin dato», con motivo «falta el hito: transición de entrega», y no usa la remisión de salida

#### Scenario: El 51 con entrega y sin finalización
- GIVEN un ticket con una fila de entrega y sin `Fecha Finalización ST`
- WHEN se calcula el 51
- THEN es «sin dato», con motivo «falta el hito: finalización del servicio»

#### Scenario: Sin entrega ni finalización manda el primer motivo
- GIVEN un ticket sin fila de entrega y sin `Fecha Finalización ST`
- WHEN se calcula el 51
- THEN el motivo es «falta el hito: transición de entrega»

#### Scenario: La constante de entregas no inventa transiciones
- GIVEN la constante de identificadores de entrega del módulo y el catálogo de transiciones
- WHEN la prueba de guardián los enfrenta
- THEN cada identificador de la constante existe en el catálogo y los dos de entrega (`entrega_al_cliente`, `entrega_sin_factura`) están en la constante

#### Scenario: Ya no existe la entrada de hora del último cambio de estado
- GIVEN el código del módulo de indicadores
- WHEN se busca `horaActualizacionEstado`
- THEN no aparece

#### Scenario: El 55 con respuesta cargada
- GIVEN un ticket cuya última respuesta cargada tiene calificación `Excelente`
- WHEN se calcula el 55
- THEN vale `Excelente`, con `unidad` `calificacion` y `estado` `calculado`

#### Scenario: El 55 sin respuesta
- GIVEN un ticket sin ninguna respuesta cargada
- WHEN se calcula el 55
- THEN es «sin dato», con motivo «falta el hito: satisfacción del cliente»

#### Scenario: Valor de Zoho sin calcular
- GIVEN un ticket cuyos datos sincronizados traen el 55 de Zoho `Good` y que no tiene respuesta cargada
- WHEN se arma la salida
- THEN `valor` es «sin dato» y `valorZoho` es `Good`

### Requirement: RQ-KP-10 · Marca de reentrante

Cada valor **SHALL** llevar `reentrante` (S-5, SP-4): `true` si alguno de los campos que ese indicador usa
como hito (RQ-KP-02; en el 49, la transición `ingreso_a_servicio`; en el 51, las transiciones de entrega
de RQ-KP-09) fue escrito por **dos o más** filas del historial del ticket; `false` si el ticket tiene
historial y ninguno se repite; `null` si el ticket no tiene historial. El valor **MUST** ser el del último
escrito, y **MUST NOT** corregirse la reentrancia (punto 66 abierto, `R08.4.md:2961`). En el 51 las filas
de `entrega_al_cliente` y de `entrega_sin_factura` **SHALL** contarse **juntas**: dos o más filas de
entrega, sean del mismo identificador o de los dos, dan `true`. Los indicadores 47, 50·53, 57 y 58 son los
que `INDICADORES_G6` declara reentrantes (`packages/shared/src/reentrancia.ts:78-83`).

#### Scenario: Cotización escrita dos veces
- GIVEN un historial con dos filas que escriben `Fecha de Cotización` (`2026-12-05` y `2026-12-10`)
- WHEN se calcula el 57
- THEN el hito vale `2026-12-10` y `reentrante` es `true`

#### Scenario: Escrita una sola vez
- GIVEN un historial con una sola fila que escribe `Fecha de Cotización`
- WHEN se calcula el 57
- THEN `reentrante` es `false`

#### Scenario: Ticket heredado
- GIVEN un ticket sin historial
- WHEN se calcula el 57
- THEN `reentrante` es `null`

#### Scenario: El 51 con dos filas de entrega
- GIVEN un historial con una fila `entrega_sin_factura` y otra `entrega_al_cliente`
- WHEN se calcula el 51
- THEN `reentrante` es `true` y el hito vale el de la última por `performed_at`

#### Scenario: El 51 con una sola fila de entrega
- GIVEN un historial con una sola fila de entrega
- WHEN se calcula el 51
- THEN `reentrante` es `false`

#### Scenario: El 51 de un ticket sin historial
- GIVEN un ticket sin ninguna fila en `ticket_transitions`
- WHEN se calcula el 51
- THEN `reentrante` es `null`

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

### Requirement: RQ-KP-12 · Ruta de sólo lectura, sólo para administradores

El sistema **SHALL** exponer `GET /api/indicadores`. **SHALL** exigir sesión y rol de administrador **antes**
de leer ningún dato de tickets, transiciones o cierres: sin cookie `sid`, `401`
(`apps/desk/server/auth/middleware.ts:14-23`); con sesión sin rol de administrador, `403`
(`apps/desk/server/auth/middleware.ts:26-29`). En ninguno de los dos casos **MUST** consultarse esos datos.
Mismo molde que `apps/desk/server/routes/analisis.ts:11`.

#### Scenario: Sin sesión
- GIVEN una petición sin cookie
- WHEN llama a `GET /api/indicadores`
- THEN responde `401` y ninguna consulta a tickets, transiciones o cierres se ejecutó

#### Scenario: Con sesión y sin rol
- GIVEN un usuario con sesión válida y sin `isAdmin`
- WHEN llama a `GET /api/indicadores`
- THEN responde `403` y ninguna consulta a tickets, transiciones o cierres se ejecutó

#### Scenario: Administrador
- GIVEN un administrador
- WHEN llama a `GET /api/indicadores`
- THEN responde `200` con JSON

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

### Requirement: RQ-KP-14 · La lectura no crece con el número de tickets y no escribe

El `GET /api/indicadores` **SHALL** leer con un número constante de **cuatro** consultas, independiente del
número de tickets: tickets del periodo, todas sus transiciones, los cierres de empresa y la última respuesta
de la encuesta de cada ticket del periodo (RQ-KP-22). El `GET` **MUST NOT** ejecutar ninguna sentencia que no
sea de lectura, ni llamar a Zoho, ni leer ningún fichero. La lectura de un fichero es **exclusiva** de la
ruta de comparación (RQ-KP-26) y no cambia nada del `GET`.

#### Scenario: Diez tickets, cuatro consultas
- GIVEN diez tickets del periodo, cada uno con transiciones
- WHEN llama un administrador
- THEN el número de consultas es cuatro, el mismo que con un solo ticket, y todas son de lectura

#### Scenario: Veinte tickets, cuatro consultas
- GIVEN veinte tickets del periodo, algunos con respuestas de la encuesta y otros sin ellas
- WHEN llama un administrador
- THEN el número de consultas sigue siendo cuatro y todas son de lectura

#### Scenario: El GET no cambia por existir la ruta de comparación
- GIVEN la ruta de comparación registrada
- WHEN un administrador llama al `GET /api/indicadores`
- THEN responde lo mismo que antes del cambio, con cuatro consultas, sin leer ningún fichero

### Requirement: RQ-KP-15 · CSV con escapado

Con `formato=csv` la ruta **SHALL** responder `text/csv; charset=utf-8` como descarga. El CSV **SHALL** ir
en formato largo (SP-7): una cabecera y una fila por ticket e indicador, separador `;`, fin de línea CRLF y una marca de orden de bytes UTF-8 (BOM) al principio, para que Excel en español lo abra sin asistente,
con estas columnas en este orden: `ticket_id;codigo_servicio;columna;indicador;unidad;valor;estado;motivo;fuente_hitos;reentrante;sin_finalizar;formula_zoho;valor_zoho`.
`fuente_hitos` lleva cada hito con su fuente, separados por `|`. Reglas de celda, en este orden:
1. Un **número** (`valor` numérico, incluidos los negativos del 47, 57, 58 y 59) se emite como número, sin
   apóstrofo.
2. Una celda de **texto** que empiece por `=`, `+`, `-` o `@` **SHALL** llevar un apóstrofo delante.
3. Una celda que contenga `;`, `"`, CR o LF **SHALL** ir entre comillas, con las comillas internas duplicadas.

#### Scenario: BOM y fin de línea
- GIVEN cualquier CSV generado
- WHEN se leen sus primeros bytes y sus saltos de fila
- THEN empieza por el BOM UTF-8 y cada fila, la cabecera incluida, termina en CRLF

#### Scenario: Negativo como número
- GIVEN un 57 de `-228`
- WHEN se genera el CSV
- THEN la celda `valor` es `-228`, sin apóstrofo

#### Scenario: Inyección de fórmula
- GIVEN un `codigo_servicio` `=HYPERLINK("x")`
- WHEN se genera el CSV
- THEN la celda es `"'=HYPERLINK(""x"")"`

#### Scenario: Los cuatro caracteres
- GIVEN textos que empiezan por `=`, `+`, `-` y `@`, p. ej. `-5 casos`
- WHEN se generan las celdas
- THEN cada una lleva apóstrofo delante: `'-5 casos`

#### Scenario: Separador y comillas
- GIVEN un `motivo` `a;b` y otro `dijo "sí"`
- WHEN se generan las celdas
- THEN salen `"a;b"` y `"dijo ""sí"""`

### Requirement: RQ-KP-16 · Comparación por pares con tolerancia de un día

Una función pura **SHALL** recibir pares (valor de la aplicación, valor de Zoho) por ticket e indicador y
devolver, **por indicador** (SP-6), `comparados`, `coincidentes`, `diferentes`, `sinComparar` y
`porcentaje` (coincidentes entre comparados, ×100, un decimal), y lo mismo para la variante de la fórmula de
Zoho contra Zoho (S-8). Letra: coincidencia con diferencia máxima de un día, cada diferencia mayor
explicada por escrito (`openspec/config.yaml:2655`, `R08.4.md:2957`).
- Dos números **coinciden** si `|a − b| ≤ 1`; con 2 de diferencia **no** coinciden.
- Dos textos del 54 **coinciden** si son iguales sin distinguir mayúsculas ni espacios laterales
  (`No Cumple` = `No cumple`).
- Un par **sin comparar** es el que tiene «sin dato» en la aplicación o en la variante, o **no tiene valor
  de Zoho**: ausente, `null`, vacío, o no numérico (no `Cumple`/`No cumple` en el 54). **MUST NOT** contarse
  como coincidencia ni como diferencia.
- Con `comparados = 0`, `porcentaje` **SHALL** ser `null`, nunca `0` ni `100`.
- Cada **diferencia mayor** (diferencia de más de un día, o textos distintos) **SHALL** listarse con
  `ticketId`, `columna`, ambos valores, los hitos con su fuente, `reentrante` y, en 49 y 50·53, los días
  de lunes a viernes del intervalo que el calendario laboral descuenta (festivos y cierres).
- Además del porcentaje por indicador, el resumen **SHALL** dar el de **tickets**: un ticket es comparado si tiene
  al menos un par comparable de la letra y es coincidente si todos esos pares coinciden (`tickets`: `comparados`,
  `coincidentes`, `porcentaje`, `null` sin tickets comparados). La letra no precisa cuál de las dos lecturas es
  «el 95 % de los tickets» (R4, SP-6): se publican **las dos** y una `nota` lo dice.
- Las diferencias mayores de la letra van en `diferencias`; las de la variante, en `variante.diferencias`.
- El resumen **MUST NOT** llevar bandera de aprobado/suspenso, color ni meta: el 95 % lo juzgan las personas.

#### Scenario: Cuatro pares del 50·53
- GIVEN pares (app, Zoho): `(6, 7)`, `(6, 8)`, `(sin dato, 3)` y `(6, null)`
- WHEN se comparan
- THEN `comparados` es 2, `coincidentes` 1, `diferentes` 1, `sinComparar` 2 y `porcentaje` `50`

#### Scenario: La tolerancia es de un día
- GIVEN los pares `(6, 5)`, `(6, 7)` y `(6, 8)`
- WHEN se comparan
- THEN los dos primeros coinciden y el tercero es diferencia

#### Scenario: Un «sin dato» no coincide con nada
- GIVEN el par `(sin dato, 0)`
- WHEN se compara
- THEN cuenta como `sinComparar`, no como coincidente ni diferente

#### Scenario: Textos del 54
- GIVEN los pares `(Cumple, cumple)`, `(Cumple, No Cumple)` y `(sin dato, Cumple)`
- WHEN se comparan
- THEN hay 1 coincidente, 1 diferente y 1 sin comparar

#### Scenario: La diferencia mayor lleva su causa
- GIVEN el par del 50·53 `(6, 8)` de orden de venta `2026-12-24` a finalización `2027-01-05`
- WHEN se comparan
- THEN la diferencia lista los días `2026-12-25` y `2027-01-01`, ambos hitos con su fuente y `reentrante`

#### Scenario: Letra contra Zoho y fórmula de Zoho contra Zoho
- GIVEN el 50·53 con `valor 6`, `formulaZoho 8` y valor de Zoho `8`
- WHEN se comparan
- THEN la letra cuenta una diferencia y la variante, una coincidencia

### Requirement: RQ-KP-17 · Resumen de comparación en la ruta

El `GET /api/indicadores` **SHALL** armar los pares sólo con los valores de Zoho ya presentes en los datos
sincronizados del ticket (SP-9) y **MUST NOT** leer ningún fichero ni cargar el export de Zoho. Cargar la
exportación es de la ruta de comparación (RQ-KP-26), no del `GET`. Si **ningún** par tiene valor de Zoho,
`comparacion` **SHALL** decir `«sin valor de Zoho con que comparar»` y
`porcentaje` **MUST** ser `null` en cada indicador. Si hay valores de Zoho pero ningún par comparable, el
mensaje **SHALL** ser `«sin pares comparables»`, también con `porcentaje` `null`.

#### Scenario: Los datos sincronizados no traen valores de Zoho
- GIVEN tickets sin ningún valor de Zoho en sus datos sincronizados
- WHEN responde la ruta
- THEN `comparacion` dice «sin valor de Zoho con que comparar» y ningún indicador trae porcentaje

#### Scenario: Con valores de Zoho
- GIVEN dos tickets cuyo 59 de Zoho coincide con el de la aplicación y otro que difiere en 3 días
- WHEN responde la ruta
- THEN el 59 trae `comparados` 3, `coincidentes` 2 y `porcentaje` `66.7`, y lista una diferencia mayor

#### Scenario: El GET no usa el fichero
- GIVEN una exportación subida antes por la ruta de comparación
- WHEN un administrador llama al `GET`
- THEN el `GET` no la conoce: sus pares salen sólo de los datos sincronizados

### Requirement: RQ-KP-18 · Lo que el módulo no hace

El `GET /api/indicadores` y el cálculo de los indicadores **MUST NOT** escribir en la base (sin tabla de
fotos, sin escritor, sin migración propia del cálculo). La **única escritura admitida** en la capacidad es
la de la carga de respuestas de la encuesta de RQ-KP-21, **sólo** sobre la tabla
`public.encuesta_respuestas` de RQ-KP-19; esta excepción no autoriza ningún otro escritor, ninguna
escritura desde el `GET` ni desde el cálculo, ni ninguna escritura sobre otra tabla. La carga de la
exportación (RQ-KP-26) **no** es una escritura: no crea tabla, no migra y no guarda nada. El sistema **MUST
NOT** además: escribir contra Zoho; enviar correo o la encuesta; mostrar tablero, semáforo ni umbral (letra:
`R08.4.md:2956`, `R08.4.md:2959`, `R08.4.md:6316`); corregir la reentrancia (`R08.4.md:2961`) ni IV-11 o
IV-12; tocar `computeAnalisis` (`packages/shared/src/analisis.ts:17-95`). El cliente **MUST** limitarse a un
enlace de descarga visible para administradores y, **sólo** para la comparación con la exportación, a un
selector de fichero que lo sube y pinta lo que el servidor devuelve (RQ-KP-28); la imposición de ese permiso
es la de RQ-KP-12. La capacidad **MUST NOT** añadir ninguna otra pantalla de carga en el cliente.

#### Scenario: Una petición no deja rastro
- GIVEN un administrador que llama a la ruta con o sin `formato=csv`
- WHEN termina la petición
- THEN todas las sentencias ejecutadas fueron de lectura y no hubo llamada de red a Zoho

#### Scenario: Sin elementos de tablero
- GIVEN la respuesta JSON y el CSV
- WHEN se inspeccionan
- THEN no traen color, semáforo, meta ni bandera de aprobación

#### Scenario: La carga no abre la puerta a otras escrituras
- GIVEN una carga válida de respuestas por RQ-KP-21
- WHEN termina la petición
- THEN las únicas sentencias de escritura se ejecutaron sobre `public.encuesta_respuestas` y ninguna sobre `tickets`, `ticket_transitions` ni otra tabla

#### Scenario: La carga de la exportación no es una excepción de escritura
- GIVEN una carga válida de la exportación por la ruta de comparación
- WHEN termina la petición
- THEN no se ejecutó ninguna sentencia de escritura sobre ninguna tabla y no se creó ningún fichero

### Requirement: RQ-KP-19 · Almacén de respuestas de la encuesta

El sistema **SHALL** guardar las respuestas de la encuesta de satisfacción en la tabla
`public.encuesta_respuestas`, creada con el esquema **calificado** y con las columnas `id`, `ticket_id`,
`calificacion`, `respondida_at`, `huella`, `cargado_por` y `cargado_at`, y un índice por `ticket_id` (S-C). La
`huella` **SHALL** ser **única** en la tabla. Un ticket **MAY** tener varias respuestas (un cliente puede
contestar dos veces). La tabla **MUST NOT** llevar columna `canal` (S-G). El nombre de la tabla **SHALL**
constar en la lista de tablas de `public` que vigila el guardián de esquema. La tabla nace vacía: **MUST NOT**
haber relleno de datos de producción. `calificacion` es **texto** (la escala del formulario se desconoce).
Ninguna de las columnas `ticket_id`, `calificacion`, `respondida_at`, `huella` y `cargado_por` **SHALL**
admitir nulo, y `calificacion` **MUST NOT** ser la cadena vacía; la base lo impone, no sólo el analizador.

La `huella` **SHALL** ser una función determinista del contenido que identifica la respuesta (el ticket, la
calificación y la marca de tiempo de la respuesta): el mismo contenido da la misma huella y cambiar
cualquiera de esos tres da otra. Es un **sha256 en hexadecimal** de una versión (`v1`), el número de ticket en
decimal, el instante en ISO UTC con milisegundos y la calificación (normalizada NFC, con los espacios
colapsados y recortada), unidos por salto de línea. Por tanto la huella **MUST NOT** depender de
`cargado_por`, de `cargado_at`, de la posición de la fila ni del nombre del fichero, **ni** de los espacios
sobrantes de la calificación ni de cómo se escribió el desplazamiento horario de un mismo instante; y **MUST
NOT** plegar mayúsculas. La huella vive en un módulo propio, separado del analizador, de modo que sustituir el
analizador (P-1) no cambia qué cuenta como duplicado.

#### Scenario: La tabla existe, calificada y con huella única
- GIVEN el esquema de `packages/zoho-sync/src/db/schema.sql`
- WHEN se inspecta la sentencia de `encuesta_respuestas`
- THEN crea `public.encuesta_respuestas` con el esquema explícito, con las siete columnas, sin `canal`, con restricción única sobre `huella` e índice sobre `ticket_id`

#### Scenario: El guardián de esquema la vigila
- GIVEN la tabla escrita sin calificar en `schema.sql`, o su nombre ausente de la lista de tablas de `public`
- WHEN corre el guardián de `migrate.test.ts`
- THEN se pone rojo

#### Scenario: Una huella repetida no inserta
- GIVEN una respuesta ya guardada con una huella
- WHEN se intenta insertar otra con la misma huella
- THEN no se crea una segunda fila y la operación la cuenta como duplicada

#### Scenario: Dos respuestas del mismo ticket
- GIVEN dos respuestas del mismo ticket con distinta marca de tiempo
- WHEN se insertan
- THEN la tabla guarda las dos filas, con huellas distintas

#### Scenario: Cada campo de la huella cuenta
- GIVEN dos respuestas que sólo difieren en el ticket, o sólo en la calificación, o sólo en la marca de tiempo
- WHEN se calculan sus huellas
- THEN las huellas son distintas en los tres casos

#### Scenario: La huella ignora lo que no es contenido
- GIVEN una respuesta y la misma con espacios sobrantes en la calificación, o con el mismo instante escrito con otro desplazamiento horario
- WHEN se calculan sus huellas
- THEN son iguales; y una carga repetida por otra persona, otro día o con las filas reordenadas da las mismas huellas

#### Scenario: La base rechaza lo incompleto
- GIVEN una fila con `ticket_id`, `calificacion`, `respondida_at`, `huella` o `cargado_por` nulo, o con `calificacion` vacía
- WHEN se intenta insertar
- THEN la base la rechaza

### Requirement: RQ-KP-20 · Analizador del fichero de respuestas

El sistema **SHALL** tener un analizador del fichero de respuestas **aislado y puro**, en un módulo propio
que recibe el contenido del fichero y devuelve las filas leídas y las filas rechazadas con su motivo. **MUST
NOT** conocer la base, la red ni el sistema de ficheros, y es la **única** pieza que conoce el formato. El
formato es **supuesto** (S-D, S-E; no hay muestra, tarea de persona P-1): CSV de exportación de Google
Forms con separador `,` o `;`, BOM tolerado, columnas reconocidas por nombre normalizado con sinónimos,
ticket identificado por su número y marca de tiempo leída en `America/Bogota`.

El analizador **SHALL** devolver un error de cabecera, y ninguna fila, si el contenido está vacío o si la
cabecera no trae las columnas necesarias (ticket, calificación y marca de tiempo de la respuesta). Una **fila
mala** **MUST NOT** hacer fallar el fichero: **SHALL** ir a la lista de rechazadas con su **número de fila**
y su **motivo**, y las demás filas **SHALL** leerse. Son filas malas las que no traen número de ticket
reconocible, las que no traen calificación y las que traen una marca de tiempo ausente o ilegible. Cada fila
leída lleva ticket, calificación, `respondida_at` y su huella (RQ-KP-19). Las líneas completamente en blanco
**MUST NOT** contarse como filas.

El diseño (D3) fija lo que esta spec dejaba abierto:
- **Numeración.** `fila` es el ordinal del **registro** del fichero y **la cabecera es la fila 1**: la primera
  fila de datos es la 2. Un registro con todos sus campos vacíos no cuenta como leído ni como rechazado.
- **`leidas` del analizador** es `filas.length + rechazadas.length` (las filas de datos, buenas y malas). En
  esta spec «fila leída» sin más es la que pasó el análisis; `leidas` las cuenta junto con las rechazadas.
- **Un motivo por fila**, el primero que falle en este orden: ticket, marca de tiempo, calificación. Los
  motivos son cinco: «falta el número de ticket», «el número de ticket no es un número reconocible», «falta la
  marca de tiempo», «la marca de tiempo no es una fecha legible» y «falta la calificación».
- **Ticket.** Recortado; se admite un `#` delante; debe ser un entero positivo que quepa en la columna
  `integer` (hasta 2147483647), si no es «no reconocible».
- **Marca de tiempo.** Se leen `AAAA-MM-DD` o `AAAA/MM/DD` y `DD/MM/AAAA` (**día primero**), con hora
  opcional, sufijo opcional `a. m.`/`p. m.`/`AM`/`PM` y zona opcional (`Z`, `±HH:MM`, `GMT±H`, `UTC±H`). Sin
  zona es hora de pared de `America/Bogota`, convertida con la **misma** noción de zona del resto del dominio
  (`instanteDeJornada`, DD-9), no con un desplazamiento escrito aparte; sin hora, las 00:00 de Bogotá. Fecha
  inexistente (31/02) u hora fuera de rango es ilegible.
- **Calificación.** Se guarda recortada y con los espacios internos colapsados, **sin ninguna otra
  transformación** (ni mayúsculas ni traducción); lo que RQ-KP-09 llama «tal como se guardó» es eso.
- **Cabecera.** Además de vacío y de columnas que faltan (el error nombra **todas** las que faltan), si más de
  una columna puede ser la misma (ticket, marca o calificación) el error es de cabecera por **ambigüedad**. Una
  columna se reconoce primero por sinónimo exacto del nombre normalizado y, si ninguno casa, por palabra
  (`ticket`; `calificacion` o `satisf`; para la marca sólo sinónimo exacto).
- **Formato del texto.** Registros RFC 4180 (campos entre comillas, `""`, separador y saltos dentro de
  comillas; fin de registro `\r\n`, `\n` o `\r`); separador `,` o `;` contado fuera de comillas en el primer
  registro, gana el más frecuente y a igualdad `,`; los bytes se leen como UTF-8 y, si no lo son, como
  windows-1252.

#### Scenario: Separador `;` y BOM
- GIVEN un fichero que empieza por BOM UTF-8, con separador `;` y una cabecera reconocida
- WHEN se analiza
- THEN se leen las filas igual que con separador `,` y el BOM no forma parte del nombre de la primera columna

#### Scenario: Separador `,`
- GIVEN un fichero con separador `,` y la misma cabecera reconocida
- WHEN se analiza
- THEN se leen las mismas filas que con `;`

#### Scenario: Columnas reconocidas por nombre
- GIVEN un fichero cuyas columnas llegan en otro orden y con mayúsculas o tildes distintas
- WHEN se analiza
- THEN se reconocen por su nombre normalizado y no por su posición

#### Scenario: Cabecera irreconocible
- GIVEN un fichero cuya cabecera no trae las columnas necesarias
- WHEN se analiza
- THEN devuelve un error de cabecera y ninguna fila leída ni rechazada

#### Scenario: Fichero vacío
- GIVEN un contenido vacío
- WHEN se analiza
- THEN devuelve un error de cabecera y ninguna fila

#### Scenario: Una fila mala no tira las demás
- GIVEN un fichero con tres filas, la segunda sin calificación
- WHEN se analiza
- THEN se leen la primera y la tercera, y la segunda queda rechazada con su número de fila y un motivo
- AND ese número de fila es el **3** (la cabecera es la fila 1) y `leidas` es 3

#### Scenario: Un motivo por fila, en orden
- GIVEN una fila sin calificación **y** con el número de ticket ilegible, y otra con marca de tiempo ilegible **y** sin calificación
- WHEN se analiza
- THEN la primera se rechaza por el ticket y la segunda por la marca de tiempo, nunca por la calificación

#### Scenario: Marca de tiempo ausente
- GIVEN una fila con ticket y calificación y la marca de tiempo vacía
- WHEN se analiza
- THEN la fila queda rechazada con su número de fila y el motivo «falta la marca de tiempo»

#### Scenario: Cabecera ambigua
- GIVEN un fichero con dos columnas que pueden ser la calificación
- WHEN se analiza
- THEN devuelve un error de cabecera que dice cuál es la columna ambigua y ninguna fila

#### Scenario: Líneas en blanco
- GIVEN un fichero con una línea completamente en blanco entre dos filas de datos
- WHEN se analiza
- THEN no cuenta ni en `leidas` ni en las rechazadas

#### Scenario: La calificación se guarda recortada
- GIVEN una fila cuya calificación llega como `  Muy   buena  `
- WHEN se analiza
- THEN la calificación leída es `Muy buena`, sin otra transformación

#### Scenario: Ticket no reconocible
- GIVEN una fila cuyo número de ticket está vacío o no es un número
- WHEN se analiza
- THEN la fila queda rechazada con su número de fila y un motivo que dice que el ticket no es reconocible

#### Scenario: Marca de tiempo en Bogotá
- GIVEN una fila con la marca de tiempo `2027-01-12 08:00:00` sin zona
- WHEN se analiza
- THEN `respondida_at` es el instante `2027-01-12T13:00:00Z`

#### Scenario: Marca de tiempo ilegible
- GIVEN una fila con una marca de tiempo que no es una fecha
- WHEN se analiza
- THEN la fila queda rechazada con su número de fila y un motivo

#### Scenario: Pureza del analizador
- GIVEN el módulo del analizador
- WHEN se inspeccionan sus importaciones
- THEN no importa la base, la red ni el sistema de ficheros

### Requirement: RQ-KP-21 · Ruta de carga de las respuestas

El sistema **SHALL** exponer `POST /api/indicadores/encuesta` (DD-10), la carga del fichero de respuestas,
**sólo para administradores**, con el fichero en `multipart` en memoria, campo `file` (`crearSubida()`,
`apps/desk/server/util/subida.ts:10-11`), sin interruptor y sin pantalla (S-F), en un fichero de ruta propio
distinto del `GET`. La ruta **SHALL** cumplir esta escalera, en este orden y sin que un escalón superior
llegue a ejecutar el siguiente:
1. sin cookie `sid`: `401` (`apps/desk/server/auth/middleware.ts:14-23`);
2. con sesión sin rol de administrador: `403` (`apps/desk/server/auth/middleware.ts:26-29`);
3. sin fichero, o con fichero vacío o de cabecera irreconocible (RQ-KP-20): `400` con `{ error }`;
4. carga.

Sesión y administrador **MUST** ir **antes** del analizador de `multipart`, de modo que un usuario sin
permiso no llegue a subir el fichero. En los casos `401`, `403` y `400` **MUST NOT** ejecutarse ninguna
sentencia sobre `public.encuesta_respuestas`. Entre el escalón 2 y el 3 actúa el analizador de `multipart`:
un fichero mayor que el límite lo resuelve el manejador central con `413` y un fichero en un campo con otro
nombre con `400` (`apps/desk/server/app.ts:84-89`), **siempre después** de los escalones 1 y 2. El `201` no se
usa: el éxito es `200` porque la carga es idempotente y puede no crear nada (DD-12).

La carga **SHALL** identificar el ticket por su número y comprobar que **existe**; una fila cuyo ticket no
existe **SHALL** rechazarse con su número de fila y el motivo «no existe un ticket con ese número», sin
impedir que se carguen las demás. La carga **SHALL** ser **idempotente por huella** (RQ-KP-19): es
**duplicada** la fila cuya huella ya está en la tabla **y** la que repite la huella de otra anterior del
**mismo fichero** (cuenta como duplicada a partir de la segunda). Todo el lote va en **una** transacción, con
una lectura de tickets y una de huellas (por bloques de 5.000 si hay más) y una escritura de varias filas, sin consulta por fila. Las
`rechazadas` de la respuesta son la unión de las del analizador y las de la comprobación de tickets, ordenadas
por `fila`. De la petición sólo se lee el fichero: `cargado_por` **MUST NOT** venir del cuerpo. La respuesta **SHALL** ser `200` con JSON
`{ leidas, insertadas, duplicadas, rechazadas: [{ fila, motivo }] }`, donde `leidas` es el número de filas de
datos del fichero y se cumple `leidas = insertadas + duplicadas + rechazadas.length`. En cada fila insertada
`cargado_por` **SHALL** ser el usuario de la sesión y `cargado_at` el instante de la carga. Una fila mala no
es `400`: va a `rechazadas`.

#### Scenario: Sin sesión
- GIVEN una petición sin cookie `sid`, con un fichero válido
- WHEN llama al `POST` de carga
- THEN responde `401` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Sin sesión y fichero inválido
- GIVEN una petición sin cookie `sid`, con un fichero vacío
- WHEN llama al `POST` de carga
- THEN responde `401`, no `403` ni `400`

#### Scenario: Con sesión y sin rol
- GIVEN un usuario con sesión y sin `isAdmin`, con un fichero válido
- WHEN llama al `POST` de carga
- THEN responde `403` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: No administrador con fichero inválido
- GIVEN un usuario con sesión y sin `isAdmin`, con un fichero vacío o de cabecera irreconocible
- WHEN llama al `POST` de carga
- THEN responde `403`, no `400`, y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Sin fichero
- GIVEN un administrador que llama sin adjuntar fichero
- WHEN llama al `POST` de carga
- THEN responde `400` con `{ error }` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Fichero vacío
- GIVEN un administrador que sube un fichero de cero bytes
- WHEN llama al `POST` de carga
- THEN responde `400` con `{ error }` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Cabecera irreconocible
- GIVEN un administrador que sube un fichero cuya cabecera no trae las columnas necesarias
- WHEN llama al `POST` de carga
- THEN responde `400` con `{ error }` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Carga válida
- GIVEN un administrador y un fichero de cuatro filas válidas de tickets que existen, con BOM y separador `;`
- WHEN llama al `POST` de carga
- THEN responde `200` con `{ leidas: 4, insertadas: 4, duplicadas: 0, rechazadas: [] }` y la tabla tiene cuatro filas con `cargado_por` igual al administrador

#### Scenario: Ticket inexistente
- GIVEN un fichero de tres filas, la segunda con un número de ticket que no existe
- WHEN un administrador lo carga
- THEN responde `200` con `leidas: 3`, `insertadas: 2` y `rechazadas` con una entrada de `fila: 3` (la cabecera es la fila 1) y el motivo «no existe un ticket con ese número», y las otras dos filas entran

#### Scenario: Fichero en un campo con otro nombre
- GIVEN un administrador que sube un fichero válido en un campo llamado `intruso`
- WHEN llama al `POST` de carga
- THEN responde `400` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: No administrador con el fichero en otro campo
- GIVEN un usuario con sesión y sin `isAdmin`, con el fichero en un campo llamado `intruso`
- WHEN llama al `POST` de carga
- THEN responde `403`, no `400`, y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: No administrador con un fichero sobre el límite
- GIVEN un usuario con sesión y sin `isAdmin`, con un fichero mayor que el límite de subida
- WHEN llama al `POST` de carga
- THEN responde `403`, no `413`, y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Sin sesión y el fichero en otro campo
- GIVEN una petición sin cookie `sid`, con el fichero en un campo llamado `intruso`
- WHEN llama al `POST` de carga
- THEN responde `401`, no `400`

#### Scenario: Administrador con un fichero sobre el límite
- GIVEN un administrador que sube un fichero mayor que el límite de subida
- WHEN llama al `POST` de carga
- THEN responde `413` y ninguna sentencia se ejecuta sobre `public.encuesta_respuestas`

#### Scenario: Huella repetida dentro del mismo fichero
- GIVEN un fichero con dos filas idénticas en ticket, calificación y marca de tiempo
- WHEN un administrador lo carga
- THEN responde `200` con `insertadas: 1` y `duplicadas: 1`

#### Scenario: El actor sale de la sesión
- GIVEN un administrador que carga un fichero válido con un campo de formulario `cargado_por` de otra persona
- WHEN termina la carga
- THEN `cargado_por` de las filas insertadas es el usuario de la sesión

#### Scenario: Recarga del mismo fichero
- GIVEN un fichero ya cargado con N filas válidas
- WHEN un administrador lo carga otra vez
- THEN responde `200` con `insertadas: 0` y `duplicadas: N`, y la tabla conserva las mismas filas

#### Scenario: Dos respuestas del mismo ticket en el fichero
- GIVEN un fichero con dos filas del mismo ticket y distinta marca de tiempo
- WHEN un administrador lo carga
- THEN responde `200` con `insertadas: 2` y la tabla guarda las dos

#### Scenario: Filas malas mezcladas
- GIVEN un fichero con una fila sin calificación y dos válidas
- WHEN un administrador lo carga
- THEN responde `200` con `insertadas: 2` y `rechazadas` con la fila mala y su motivo, no `400`

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

### Requirement: RQ-KP-23 · Lector de la exportación

El sistema **SHALL** tener un lector de la exportación, **puro** (recibe el texto, no conoce la base ni el
disco). **SHALL** aceptar CSV con separador coma, comillas, comillas dobladas, saltos de línea dentro de un
campo entrecomillado, BOM UTF-8 y fin de línea CRLF (S-I). Las cabeceras **SHALL** reconocerse por nombre
normalizado (tildes, mayúsculas y espacios, como `valorDeZoho` en `packages/shared/src/indicadores.ts:109`):
«Cumplimiento del tiempo  promesa», con dos espacios en el fichero, **MUST** casar.

El lector **SHALL** exigir **doce** columnas (S-K): «ID», «ID de la solicitud» y las diez de indicadores
(«Tiempo permanecía», «Tiempo de diagnóstico», «Tiempo de servicio», «Tiempo total servicio», «Tiempo
recogida del equipo», «Cumplimiento del tiempo  promesa», «Calificación de satisfacción», «Tiempo de
cotización», «Tiempo de orden de compra», «Tiempo de orden de Venta»). Si falta **alguna**, el lector
**SHALL** fallar con un mensaje que **nombra cada columna que falta**. **MUST NOT** devolver «sin valor de
Zoho» en silencio por un fichero de otro formato. Un fichero sin filas de datos o ilegible como CSV
**SHALL** fallar con mensaje propio.

Por cada fila el lector **SHALL** devolver sólo la clave, el número de solicitud y las diez celdas de
indicadores (RQ-KP-27). Una fila con problema **SHALL** ir a *rechazadas* con su número de fila y su motivo y
no impide leer las demás. Una celda de indicador no vacía que `valorDeZoho` no acepta (un decimal, un texto) se
cuenta y se lista por columna como «valor ilegible» (S-P); no se rechaza la fila.

#### Scenario: Fichero con la cabecera completa
- GIVEN un fichero con las 59 columnas de la muestra, BOM, CRLF y un campo entrecomillado con coma y otro con salto de línea
- WHEN se lee
- THEN se devuelven las filas con clave, número y diez celdas, y ninguna fila rechazada por el formato

#### Scenario: Falta una columna (mutación sobre el fichero vigilado)
- GIVEN el fixture sin la columna «Tiempo de servicio»
- WHEN se lee
- THEN falla y el mensaje nombra «Tiempo de servicio»; no hay resultado parcial ni «sin valor de Zoho»

#### Scenario: Faltan dos columnas
- GIVEN el fixture sin «Tiempo de servicio» ni «ID de la solicitud»
- WHEN se lee
- THEN el mensaje nombra las dos

#### Scenario: Columna renombrada
- GIVEN el fixture con «Tiempo de servicio» escrita «Tiempo del servicio»
- WHEN se lee
- THEN falla nombrando «Tiempo de servicio»; no se adivina por parecido

#### Scenario: Dos espacios en la cabecera de la promesa
- GIVEN la cabecera «Cumplimiento del tiempo  promesa» con dos espacios y celdas «Cumple» y «No Cumple»
- WHEN se lee
- THEN la columna se reconoce y los valores llegan a `valorDeZoho` tal cual

#### Scenario: Valor no numérico en una columna de tiempo (mutación sobre el fichero vigilado)
- GIVEN una fila con «abc» en «Tiempo de diagnóstico» y otra con «2.5»
- WHEN se lee
- THEN ambas filas se conservan, cada una cuenta un «valor ilegible» de esa columna con fila y columna en el listado, y el listado no repite «abc» ni «2.5»

#### Scenario: Celdas con comas y saltos de línea
- GIVEN un campo entrecomillado con una coma y otro con un salto de línea, en columnas que no se leen
- WHEN se lee
- THEN el número de filas leídas es el de registros, no el de líneas físicas

### Requirement: RQ-KP-24 · Clave de cruce

El cruce **SHALL** hacerse por «ID» ↔ `desk.tickets.id` (`id text PRIMARY KEY`; el sincronizador mapea
`id: raw.id` en `packages/zoho-sync/src/db/mappers.ts:46`). El cruce **MUST NOT** hacerse por número de
solicitud ni aproximando. Una clave **vacía** o que **no sea sólo dígitos** (por ejemplo, notación científica
de una hoja de cálculo) **SHALL** dar una fila rechazada con motivo que nombra fila y columna «ID». Un «ID»
repetido: vale la primera fila y las siguientes se rechazan con motivo (S-M).

«ID de la solicitud» es **exigida**. Sirve para nombrar al ticket en los listados y para contrastar con
`tickets.number`. Si el `id` cruza y el número no coincide, la ruta **SHALL** contar y listar la discrepancia
(clave, número del fichero, número de Desk), y el par **SHALL** compararse igual: la clave es el `id`. Que
«ID de la solicitud» sea `ticketNumber` es hipótesis apoyada en los valores de la muestra, no en código.

#### Scenario: Cruce por ID
- GIVEN un ticket de Desk con `id` de 18 dígitos y una fila del fichero con ese «ID»
- WHEN se cruza
- THEN la fila se compara con ese ticket

#### Scenario: Mismo número, otro ID
- GIVEN una fila cuyo «ID de la solicitud» es el `number` de un ticket de Desk pero cuyo «ID» no es el `id` de ninguno
- WHEN se cruza
- THEN no se cruza con ese ticket; la fila va a «sólo en el fichero»

#### Scenario: Clave vacía (mutación sobre el fichero vigilado)
- GIVEN una fila con «ID» vacío
- WHEN se lee
- THEN se rechaza con motivo que nombra su número de fila y la columna «ID», y las demás filas se comparan

#### Scenario: Clave en notación científica
- GIVEN una fila con «ID» «1.23457E+17»
- WHEN se lee
- THEN se rechaza con motivo que dice que la clave no es sólo dígitos; no se cruza aproximando

#### Scenario: ID repetido
- GIVEN dos filas con el mismo «ID» válido
- WHEN se lee
- THEN la primera entra y la segunda se rechaza con motivo; el motivo no cita ninguna celda

#### Scenario: Número distinto
- GIVEN una fila cuyo «ID» cruza y cuyo «ID de la solicitud» difiere de `tickets.number`
- WHEN se compara
- THEN la discrepancia se cuenta y se lista, y el par se compara con los valores de esa fila

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

### Requirement: RQ-KP-26 · Ruta de comparación con la exportación

La ruta de comparación **SHALL** ser un `POST` multipart, **sólo para administradores**, distinta del `GET
/api/indicadores`. Recibe el periodo por los parámetros `desde` y `hasta` y el fichero. La escalera **SHALL**
ser, en este orden: sesión `401` < administrador `403` < `400` (periodo inválido por `validarPeriodo`,
`apps/desk/server/indicadores.ts:26`; luego, falta de fichero, fichero ilegible o cabecera incompleta de
RQ-KP-23). Multer en memoria **SHALL** ir **detrás** de las guardas de sesión y de administrador (molde
`apps/desk/server/routes/encuestaRespuestas.ts:19`), con el límite común `LIMITE_SUBIDA_BYTES`
(`apps/desk/server/util/subida.ts:6`, 10 MB); pasado el límite, el manejador central **SHALL** responder `413`
nombrando el límite (`apps/desk/server/app.ts:86`). En los `401`, `403` y `400` **no se ejecuta ninguna
consulta** de tickets y la cabecera se valida **antes** de leer tickets.

Los valores de Zoho de cada par **SHALL** salir de la fila del fichero por `valorDeZoho`
(`packages/shared/src/indicadores.ts:109`) y la comparación **SHALL** armarla `compararIndicadores`
(`packages/shared/src/indicadoresComparacion.ts:90`), con la tolerancia de un día y **sin veredicto** (RQ-KP-16).
**MUST NOT** existir una segunda implementación de la comparación. Los pares de la aplicación **SHALL** salir de
la misma ruta de cálculo que el `GET` (`leerEntradasIndicadores`, `tablaIndicadores`), sin cambiar el 55, el 47
ni las fórmulas ni el orden de los otros ocho.

La respuesta **SHALL** traer: el periodo; el recuento del fichero (filas leídas y rechazadas, cada una con
número de fila y motivo); el cruce (cruzados, sólo en el fichero, en Desk fuera del periodo, sólo en Desk, número
distinto, valores ilegibles); y `comparacion` con la forma del `GET`. **Toda** sentencia de la ruta **SHALL** ser
un `SELECT`: sin tabla, sin migración, sin variable de entorno, sin escritura ni fichero en disco (S-J).
Una fila mala **MUST NOT** dar `400`: va a rechazadas y las demás se comparan.

#### Scenario: Sin sesión
- GIVEN una petición sin sesión, con fichero y periodo válidos
- WHEN llega
- THEN `401` y no se ejecuta ninguna consulta de tickets ni se procesa el fichero

#### Scenario: Usuario sin rol de administrador
- GIVEN un usuario con sesión sin rol de administrador
- WHEN envía un fichero
- THEN `403`, no se ejecuta ninguna consulta de tickets y multer no procesó el cuerpo

#### Scenario: Posición de las guardas (regla de mutación 1)
- GIVEN un fichero mayor que el límite enviado sin sesión y otro enviado por un usuario sin rol
- WHEN llegan
- THEN el primero da `401` y el segundo `403`, no `413`; mover multer delante de las guardas rompe la prueba

#### Scenario: Periodo inválido con fichero malo
- GIVEN `desde=2026-12-31`, `hasta=2026-12-01` y un fichero sin la columna «ID»
- WHEN llama un administrador
- THEN `400` por el periodo (S-O) y no se ejecuta ninguna consulta de tickets

#### Scenario: Sin fichero
- GIVEN un administrador con periodo válido y sin fichero
- WHEN llama
- THEN `400` con mensaje que dice que falta el fichero y sin consultas de tickets

#### Scenario: Cabecera incompleta antes de leer tickets
- GIVEN un administrador con periodo válido y un fichero sin dos columnas exigidas
- WHEN llama
- THEN `400` cuyo mensaje nombra las dos, y no se ejecuta ninguna consulta de tickets

#### Scenario: Fichero sobre el límite
- GIVEN un fichero de más de 10 MB
- WHEN lo sube un administrador
- THEN `413` y el mensaje dice el límite en MB del manejador central; fijado también por el valor de `LIMITE_SUBIDA_BYTES`

#### Scenario: Comparación con tolerancia y sin veredicto
- GIVEN un ticket cuyo 59 de la aplicación difiere en un día del de la fila, y otro que difiere en tres
- WHEN responde la ruta
- THEN el primero cuenta como coincidente, el segundo como diferencia mayor, y la respuesta no trae color, meta ni bandera

#### Scenario: Camino único del valor
- GIVEN una fila cuya «Cumplimiento del tiempo  promesa» es «Cumple»
- WHEN se arma el par del 54
- THEN el valor llegó por `valorDeZoho` y se comparó con `compararIndicadores`; no hay otra función que lea la celda ni que compare

#### Scenario: Todo es lectura
- GIVEN una carga válida con filas que cruzan, otras que no y otras rechazadas
- WHEN termina la petición
- THEN todas las sentencias fueron `SELECT`, no se escribió ningún fichero y no hubo llamada a Zoho

#### Scenario: Una fila mala no tumba la carga
- GIVEN un fichero válido con una fila de clave vacía
- WHEN llama un administrador
- THEN responde `200`, la fila va a rechazadas con su motivo y las demás se comparan

### Requirement: RQ-KP-27 · Privacidad de la exportación

La exportación lleva nombre y correo del contacto. El sistema **MUST NOT** guardar, registrar en logs ni
devolver ningún dato del fichero que no sea la clave, el número de solicitud y los valores de los indicadores.
Sólo se leen esas doce columnas; las demás no salen del lector. El motivo de una fila rechazada o de un
«valor ilegible» **SHALL** nombrar fila y columna y **MUST NOT** contener el contenido de la celda. Un error
inesperado **MUST NOT** volcar filas ni celdas al log ni a la respuesta.

#### Scenario: Datos de contacto centinela
- GIVEN un fixture con la cabecera real y, en las columnas de contacto, el nombre «Centinela Prueba» y el correo «centinela@ejemplo.invalid»
- WHEN un administrador sube el fichero y se recorre la respuesta JSON, los motivos y lo escrito en logs
- THEN ninguno de los dos valores aparece en ninguna parte

#### Scenario: Una fila rechazada no cita la celda
- GIVEN una fila con clave vacía y otra con un valor ilegible «xyz» en un indicador
- WHEN se leen
- THEN cada motivo trae número de fila y nombre de columna y no contiene «xyz» ni ninguna otra celda

#### Scenario: Una columna de contacto no sale aunque se pida
- GIVEN una respuesta de la ruta
- WHEN se inspeccionan sus claves
- THEN sólo hay claves, números de solicitud, motivos con fila y columna, y valores de indicadores

### Requirement: RQ-KP-28 · Cliente de la comparación

En «Análisis», junto al enlace de descarga, el cliente **SHALL** ofrecer a los administradores un selector de
fichero `.csv` y un botón «Comparar» que sube el fichero con `desde` y `hasta` tal como se escriben y pinta lo
que el servidor devuelve: recuentos, porcentajes y listados, **sin color, meta, semáforo ni veredicto**. El
cliente **MUST NOT** leer el fichero, cruzar ni calcular ningún porcentaje. Lo decidible (armar la petición,
decidir qué mostrar) **SHALL** vivir en `apps/desk/src/lib/*.ts` y probarse allí. Regla invariable 13: cada
decisión del cliente tiene su imposición en el servidor, y los espejos son comodidad:

- mostrar el control sólo a administradores: `403` de la ruta de comparación (RQ-KP-26);
- deshabilitar «Comparar» sin fichero: `400` de «falta el fichero» (RQ-KP-26);
- limitar el selector a `.csv`: `400` de cabecera que nombra las columnas (RQ-KP-23);
- avisar de fichero grande: `413` del manejador central (RQ-KP-26);
- enviar el periodo sin validarlo: `400` de `validarPeriodo` (RQ-KP-26).

#### Scenario: El cliente no valida lo que impone el servidor
- GIVEN un periodo mal escrito y un fichero cualquiera
- WHEN el cliente arma la petición
- THEN envía `desde` y `hasta` tal como se escribieron y lo rechaza el servidor con `400`

#### Scenario: El cliente pinta lo devuelto
- GIVEN una respuesta con porcentajes, listados y motivos
- WHEN la función de presentación la procesa
- THEN muestra los mismos números y listas, sin recalcular y sin color, meta ni veredicto

#### Scenario: Un error del servidor se muestra tal cual
- GIVEN un `400` cuyo mensaje nombra las columnas que faltan
- WHEN el cliente lo recibe
- THEN muestra ese mensaje y no lo sustituye por «sin valor de Zoho»

### Requirement: RQ-KP-29 · Parámetro `flujo` y su validación

El GET y el POST **SHALL** aceptar un parámetro opcional `flujo` en la URL, junto a `desde` y `hasta`. Sus únicos
valores válidos son las claves de `CATALOGO_POR_FLUJO` (`packages/shared/src/flujos.ts:19-22`), comparadas por
igualdad exacta. Un valor vacío, repetido o con otra grafía (`Servicio`, `equipo nuevo`) **MUST** responder `400`
con la forma `{ error }` de `validarPeriodo` y un mensaje que nombra el parámetro «flujo». La validación de
`flujo` **MUST NOT** modificar `validarPeriodo` (`apps/desk/server/indicadores.ts:26-38`). Orden de las guardas:
en el GET, sesión < administrador < periodo < flujo < lectura; en el POST, sesión < administrador < multer <
periodo < flujo < «falta el fichero» < lector < consultas. Un `flujo` inválido **MUST NOT** ejecutar ninguna
consulta de tickets.

#### Scenario: Valor desconocido
- GIVEN un administrador y `flujo=otro`
- WHEN llama al GET o al POST con periodo válido
- THEN responde `400` y el mensaje contiene «flujo»

#### Scenario: Vacío, repetido y otra grafía
- GIVEN un administrador y, por separado, `flujo=`, `flujo=servicio&flujo=servicio` y `flujo=Servicio`
- WHEN llama al GET
- THEN las tres peticiones dan `400` que nombra «flujo»

#### Scenario: Los tres valores válidos
- GIVEN un administrador y periodo válido
- WHEN llama al GET con `flujo=servicio`, `flujo=equipo-nuevo` y `flujo=soporte-remoto`
- THEN las tres responden `200`

#### Scenario: Periodo antes que flujo (regla de mutación 1)
- GIVEN `desde=2026-12-31`, `hasta=2026-12-01` y `flujo=otro`, en el GET y, aparte, en el POST
- WHEN llama un administrador
- THEN ambas rutas dan `400` cuyo mensaje es el del periodo y no nombra «flujo»

#### Scenario: Flujo antes que «falta el fichero» en el POST (regla de mutación 1)
- GIVEN periodo válido, `flujo=otro` y ninguna parte de fichero
- WHEN llama un administrador al POST
- THEN el `400` nombra «flujo» y no dice que falta el fichero

#### Scenario: Flujo inválido no lee tickets
- GIVEN `flujo=otro` con periodo válido
- WHEN llama un administrador
- THEN no se ejecuta ninguna consulta de tickets

### Requirement: RQ-KP-30 · El flujo de un ticket lo decide su clasificación

Un predicado **único** de `packages/shared` **SHALL** decidir el flujo de un ticket para los indicadores. Devuelve
`Flujo` y lo da **sólo** la clasificación: consume `esClasificacionSoporteRemoto` y `esClasificacionEquipoNuevo`
(`packages/shared/src/flujos.ts:116-119`, `:40-43`) y devuelve `servicio` cuando ninguna la reconoce, incluida la
clasificación ausente o `null`. **MUST NOT** depender del estado del ticket ni reescribir la normalización
(`packages/shared/src/flujos.ts:32-34`), y **MUST NOT** ser `flujoDelTicket` (`:56-61`): éste exige además que el
estado esté en el catálogo del flujo, condición de **enrutado** de transiciones (`:50-55`), no de población. Con
él, un mismo ticket de equipo nuevo cambiaría de flujo al pasar de `Ticket creado` a `Ingresado` y un heredado
en `Por Facturar` contaría como `servicio`. El cliente **MUST NOT** reimplementar este predicado.

#### Scenario: «Equipo nuevo» en un estado de servicio
- GIVEN un ticket con clasificación «Equipo nuevo» y estado `Ticket creado`
- WHEN se decide su flujo
- THEN es `equipo-nuevo` (con `flujoDelTicket` sería `servicio`)

#### Scenario: «Equipo nuevo» finalizado y heredado
- GIVEN dos tickets con clasificación «Equipo nuevo», uno en `Finalizado` y otro heredado en `Por Facturar`
- WHEN se decide su flujo
- THEN los dos son `equipo-nuevo` (con `flujoDelTicket`, el segundo sería `servicio`)

#### Scenario: Otra mayúscula
- GIVEN un ticket con clasificación «Equipo Nuevo»
- WHEN se decide su flujo
- THEN es `equipo-nuevo`; un predicado que compare sin normalizar da `servicio` y se pone rojo

#### Scenario: Clasificación ausente
- GIVEN un ticket con clasificación `null`
- WHEN se decide su flujo
- THEN es `servicio`, igual que con una clasificación no reconocida

#### Scenario: Soporte remoto
- GIVEN un ticket con clasificación «Soporte remoto» y estado `Rev./Diagnostico`
- WHEN se decide su flujo
- THEN es `soporte-remoto` (con `flujoDelTicket` sería `servicio`)

### Requirement: RQ-KP-31 · Recorte del GET por flujo

La lectura **SHALL** traer la clasificación de cada ticket en la misma consulta de tickets
(`apps/desk/server/indicadores.ts:64`), de modo que RQ-KP-14 se mantenga: **cuatro** consultas, con o sin `flujo`.
Con `flujo`, el GET **SHALL** devolver, en json y en csv, **sólo** los tickets cuyo flujo por RQ-KP-30 es el
pedido; el recorte se aplica después de leer y es una función pura. El JSON **SHALL** llevar la clave `flujo` con el
valor pedido; las cabeceras del CSV no cambian y el nombre del fichero **SHALL** incluir el flujo. **Sin `flujo`**,
el cuerpo json y el cuerpo csv **MUST** ser idénticos byte a byte a los anteriores a este cambio: la misma
población, las mismas claves, sin clave `flujo` y sin sufijo en el nombre.

#### Scenario: El recorte filtra
- GIVEN tickets de los tres flujos en el periodo
- WHEN un administrador pide el JSON con `flujo=equipo-nuevo`
- THEN `tickets` sólo trae los de equipo nuevo, `flujo` vale `equipo-nuevo`, y los de otros flujos no aparecen

#### Scenario: El CSV también filtra
- GIVEN los mismos tickets
- WHEN pide el CSV con `flujo=soporte-remoto`
- THEN las filas sólo son de tickets de soporte remoto, las cabeceras son las de RQ-KP-15 y el nombre del fichero contiene `soporte-remoto`

#### Scenario: Sin `flujo`, los bytes de hoy
- GIVEN una caracterización de las respuestas json y csv sin parámetro, escrita antes del cambio
- WHEN se repite tras el cambio
- THEN los cuerpos son idénticos byte a byte, sin clave `flujo` ni `null`, y las pruebas anteriores pasan sin editarse

#### Scenario: Cuatro consultas con y sin flujo
- GIVEN diez tickets con transiciones
- WHEN llama un administrador con `flujo=servicio` y, aparte, sin `flujo`
- THEN ambas ejecutan cuatro consultas, todas de lectura

#### Scenario: Ticket sin clasificación
- GIVEN un ticket con clasificación `null` y «Equipo Nuevo» en otro, en el periodo
- WHEN se pide `flujo=servicio` y luego `flujo=equipo-nuevo`
- THEN el primero sale sólo con `servicio` y el segundo sólo con `equipo-nuevo`

### Requirement: RQ-KP-32 · La comparación por flujo y el cubo «de otro flujo»

El POST **SHALL** cruzar el fichero contra **todos** los tickets del periodo y repartir **después**: con el reparto
sin clasificación de RQ-KP-25, recortar antes llevaría un ticket de otro flujo a «fuera del periodo», y con
clasificación cambiaría los «ID» que se consultan. Con `flujo`: un ticket del fichero que existe en
Desk y es de otro flujo **SHALL** ir al cubo `deOtroFlujo`, que gana a «fuera del periodo» y a «sólo en el
fichero»; «sólo en Desk» y «número distinto» **SHALL** contar sólo tickets del flujo pedido; y la comparación
**SHALL** hacerse sólo con los cruzados del flujo pedido. La clasificación de los tickets fuera del periodo sale,
sólo con `flujo`, de `ticketsConClasificacion` (`apps/desk/server/db/ticketsPorId.ts:24`), que consulta por bloques
como `numerosDeTickets` (`apps/desk/server/db/ticketsPorId.ts:10`) con una columna más y la sustituye. La
respuesta **SHALL** llevar la clave `flujo` y el cubo `deOtroFlujo` **sólo** con `flujo`; sin él, ambos
**MUST NOT** aparecer y el cuerpo es el de hoy. El número de consultas **MUST NOT** cambiar.

#### Scenario: Otro flujo dentro del periodo
- GIVEN un ticket de soporte remoto del periodo presente en el fichero y `flujo=equipo-nuevo`
- WHEN llama un administrador al POST
- THEN está en `deOtroFlujo`, no en `soloEnFichero` ni en `fueraDelPeriodo`, y no entra en `cruzados`

#### Scenario: Otro flujo fuera del periodo
- GIVEN un ticket de servicio existente pero fuera del periodo, presente en el fichero, y `flujo=equipo-nuevo`
- WHEN llama
- THEN está en `deOtroFlujo` y no en `fueraDelPeriodo`; uno de equipo nuevo fuera del periodo sigue en `fueraDelPeriodo`

#### Scenario: Ausente de Desk
- GIVEN un número del fichero que no existe en Desk y `flujo=servicio`
- WHEN llama
- THEN va a `soloEnFichero`, no a `deOtroFlujo`

#### Scenario: «Sólo en Desk» del flujo pedido
- GIVEN un ticket de servicio y otro de equipo nuevo del periodo, ambos ausentes del fichero, y `flujo=servicio`
- WHEN llama
- THEN `soloEnDesk` trae sólo el de servicio, y lo mismo vale para `numeroDistinto`

#### Scenario: Sin `flujo`, el cuerpo de hoy
- GIVEN una caracterización del POST sin parámetro, escrita antes del cambio
- WHEN se repite tras el cambio
- THEN no hay clave `flujo` ni `deOtroFlujo` y el cuerpo es idéntico byte a byte

#### Scenario: Mismas consultas
- GIVEN el POST con y sin `flujo` sobre los mismos datos
- WHEN se cuentan las consultas
- THEN son las mismas: cuatro de `leerEntradasIndicadores` y una por bloque de «ID» sin cruzar

### Requirement: RQ-KP-33 · Cliente del filtro por flujo

En «Análisis», junto a la descarga, el cliente **SHALL** ofrecer a los administradores un selector con «Todos» (por
defecto) y los tres flujos, con las etiquetas de `NOMBRE_FLUJO` (`packages/shared/src/flujos.ts:127-131`,
exportado). El selector gobierna la descarga **y** la comparación. «Todos» **MUST NOT** enviar `flujo`. Las URL las
arman `urlIndicadores` (`apps/desk/src/lib/indicadoresUrl.ts:5`) y `urlComparacion`
(`apps/desk/src/lib/comparacionExportacion.ts:13`), con un `flujo` opcional, cada una con su prueba en `lib`. La
función de presentación (`vistaComparacion`) **SHALL** mostrar «De otro flujo» sólo si la respuesta trae
`deOtroFlujo`. El `.tsx` **MUST** sólo pintar y **MUST NOT** clasificar, recortar ni validar. Regla invariable 13:

- mostrar el selector sólo a administradores: `403` de `requireAdmin` (`apps/desk/server/routes/indicadores.ts:41`,
  `apps/desk/server/routes/indicadoresComparacion.ts:25`);
- ofrecer sólo «Todos» y los tres flujos: `400` de `flujo` (RQ-KP-29);
- «Todos» no envía `flujo`: sin parámetro el único corte es el periodo (`apps/desk/server/indicadores.ts:60`);
- la descarga lleva el flujo elegido: el recorte del GET (RQ-KP-31);
- la comparación lleva el mismo flujo: el reparto del POST (RQ-KP-32);
- pintar el flujo y «de otro flujo» tal como llegan: la serialización de la respuesta (RQ-KP-31, RQ-KP-32).

#### Scenario: `urlIndicadores` lleva el flujo
- GIVEN `urlIndicadores('csv', undefined, 'equipo-nuevo')` (firma exacta a fijar por el diseño)
- WHEN se arma la URL
- THEN contiene `flujo=equipo-nuevo`, y sin flujo no contiene `flujo`

#### Scenario: `urlComparacion` lleva el flujo
- GIVEN un periodo y el flujo `soporte-remoto`
- WHEN se arma la URL
- THEN contiene `desde`, `hasta` y `flujo=soporte-remoto`; sin flujo, la URL es la de hoy

#### Scenario: «Todos» no envía parámetro
- GIVEN el selector en «Todos»
- WHEN se arman las dos URL
- THEN ninguna contiene `flujo`, ni siquiera vacío

#### Scenario: Cubo sólo si llega
- GIVEN una respuesta sin `deOtroFlujo` y otra con él
- WHEN se procesan con `vistaComparacion`
- THEN la primera no muestra «De otro flujo» y la segunda sí, con el total y la lista tal como llegan, sin calcularlos

#### Scenario: El cliente no valida
- GIVEN un valor de `flujo` fuera del dominio
- WHEN el cliente arma la petición
- THEN lo envía sin validarlo y lo rechaza el servidor con `400`

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
`apps/desk/server/routes/indicadoresComparacion.test.ts:326`) **SHALL** actualizarse, no borrarse: sus tickets pasan a
ser cerrados (`status_type = 'Closed'`) y el hash se recalcula sobre el cuerpo nuevo; si el cuerpo no cambia byte a byte,
el hash se conserva y el informe lo dice. El commit **SHALL** nombrar `decision/e224b-poblacion-indicadores`. Las pruebas de `packages/shared/src/indicadores.test.ts` que fijan «sin dato» en 47 y 51 se
actualizan por `decision/e224c-formulas-47-51-y-contraste`.

#### Scenario: Siguen siendo tres
- GIVEN las pruebas tras el cambio
- WHEN se cuentan las caracterizaciones sha256
- THEN siguen siendo tres, con el hash recalculado sobre tickets cerrados, y ningún `it` fue borrado ni saltado

#### Scenario: Un cambio de respuesta ajeno a la decisión las rompe
- GIVEN una respuesta con un campo extra sin relación con la decisión
- WHEN corren las caracterizaciones
- THEN alguna se pone roja
