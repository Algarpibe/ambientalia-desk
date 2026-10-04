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
línea. **SP-n** es un supuesto de esta spec o de la propuesta (`proposal.md`, S-n): se especifica tal cual
para poder construirlo y probarlo, **pero no es letra de Gerencia** y está sujeto a las preguntas E-171 a
E-178 de la bandeja.

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
| SP-5 | El periodo filtra por el día de creación del ticket en `America/Bogota` | Spec |
| SP-6 | Los porcentajes se dan por indicador | Spec |
| SP-7 | El CSV va en formato largo, separador `;` | Spec |
| SP-8 | Con el hito opcional del 51 o del 55 presente, el módulo lo usa; la ruta nunca lo aporta | Spec |
| SP-9 | El valor de Zoho se lee de los datos sincronizados del ticket; **dónde** viene queda pendiente de la tarea de persona P-1 de la propuesta | Spec |

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
historial y no la columna es de `packages/shared/src/reentrancia.ts:24`.

| Indicador | Hitos (etiqueta del campo) | Columna heredada |
|---|---|---|
| 47 | `Fecha Remisión Entrada`, `Fecha Remisión de Salida` | `fecha_remision_entrada`, `fecha_remision_salida` |
| 49 | marca `performed_at` de la transición `ingreso_a_servicio` (`bodegaje.ts:225-226`); `Fecha Revisión Informe` | `fecha_revision_informe`; la marca no tiene columna |
| 50·53 | `Fecha Orden De Venta`, `Fecha Recepción de repuestos`, `Fecha Finalización ST` | `fecha_orden_venta`, `fecha_recepcion_repuestos`, `fecha_finalizacion_st` |
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

### Requirement: RQ-KP-09 · Indicadores 51 y 55: «sin dato — falta el hito»

El 51 se define como «Hora de actualización del estado − Fecha Finalización ST» (letra: `R08.4.md:6299`), y
la aplicación no guarda esa hora (`packages/shared/src/transitions.ts:252-255`). El 55 es la satisfacción
del cliente, que la aplicación no tiene; la encuesta es manual y su carga es de enero
(`openspec/config.yaml:2858`). Por eso el 51 y el 55 **SHALL** devolver «sin dato — falta el hito» con
motivo propio, y **MUST NOT** suponer ninguna fecha ni valor. El módulo **SHALL** aceptar una entrada
opcional por indicador: la hora del último cambio de estado para el 51 (valor = esa hora, día civil de
Bogotá, menos la finalización, en días naturales) y la calificación para el 55 (valor = el texto recibido,
sin transformar) (SP-8). **La ruta MUST NOT aportar nunca esas entradas.** Un valor de Zoho sincronizado
para estas columnas **MUST** quedar en `valorZoho`, nunca en `valor`.

#### Scenario: El 51 sin entrada opcional
- GIVEN un ticket con finalización `2027-01-05` y sin entrada de hora del cambio de estado
- WHEN se calcula el 51
- THEN es «sin dato», con motivo «falta el hito: hora del último cambio de estado, pendiente de decisión»

#### Scenario: El 51 con la entrada opcional enchufada
- GIVEN finalización `2027-01-05` y entrada opcional `2027-01-08T15:00:00Z`
- WHEN se calcula el 51
- THEN vale `3`

#### Scenario: El 55 sin entrada
- GIVEN un ticket cualquiera
- WHEN se calcula el 55
- THEN es «sin dato», con motivo «falta el hito: satisfacción del cliente»

#### Scenario: Valor de Zoho sin calcular
- GIVEN un ticket cuyos datos sincronizados traen el 55 de Zoho `Good`
- WHEN se arma la salida
- THEN `valor` es «sin dato» y `valorZoho` es `Good`

### Requirement: RQ-KP-10 · Marca de reentrante

Cada valor **SHALL** llevar `reentrante` (S-5, SP-4): `true` si alguno de los campos que ese indicador usa
como hito (RQ-KP-02; en el 49, la transición `ingreso_a_servicio`) fue escrito por **dos o más** filas del
historial del ticket; `false` si el ticket tiene historial y ninguno se repite; `null` si el ticket no tiene
historial. El valor **MUST** ser el del último escrito, y **MUST NOT** corregirse la reentrancia (punto 66
abierto, `R08.4.md:2961`). Los indicadores 47, 50·53, 57 y 58 son los que `INDICADORES_G6` declara
reentrantes (`packages/shared/src/reentrancia.ts:78-83`).

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

### Requirement: RQ-KP-11 · Variante «fórmula de Zoho»

Donde la fórmula que Zoho calcula difiere de la letra, el sistema **SHALL** calcular además la variante
`formulaZoho`, con los mismos hitos y su fuente. Las variantes son **hipótesis sobre el export**
(`docs/analisis-tickets/Tickets.csv`), no letra.

| Indicador | Variante de Zoho | Sale «sin dato» cuando |
|---|---|---|
| 47 | «sin dato — falta el hito: hora del último cambio de estado». Zoho no usa la remisión de salida y **MUST NOT** sustituirse por ella | siempre |
| 49 | días de lunes a viernes **sin descontar festivos**, `(desde, hasta]`, de `Fecha creación ticket` (historial o `fecha_creacion_ticket`) a `Fecha Revisión Informe` | falta creación o revisión |
| 50·53 | lo mismo que RQ-KP-06 contando lunes a viernes sin festivos ni cierres, con el tope 0 y el 0 sin finalización | como RQ-KP-06 |
| 54 | 53 de la variante contra el 52; **sin tiempo promesa da `Cumple`** | el 53 de la variante es «sin dato» |
| 51 y 55 | «sin dato» por el mismo hito | siempre |
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
- GIVEN entrada `2026-12-16` y salida `2027-01-02`
- WHEN se calcula el 47
- THEN `valor` es `17` y `formulaZoho` es «sin dato»

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

Parámetros: `desde` y `hasta` (`YYYY-MM-DD`, ambos opcionales e inclusivos, sobre el día de creación del
ticket en Bogotá — SP-5) y `formato` (`json`, por defecto, o `csv`). Un valor mal formado, `desde > hasta` o
un `formato` distinto **SHALL** dar `400` con `{ error }` y sin consultar datos. Los parámetros **MUST**
llegar a la base como valores ligados, nunca concatenados. La respuesta JSON **SHALL** ser
`{ periodo: { desde, hasta }, tickets: [...], comparacion }`. Cada ticket lleva `ticketId`, `codigoServicio`
e `indicadores`, con las nueve claves de RQ-KP-01. Cada indicador lleva `columna`, `valor` (número, texto o
`null`), `unidad` (`dias_naturales`, `dias_habiles`, `cumplimiento` o `calificacion`), `estado` (`calculado` o `sin_dato`),
`motivo` (sólo en `sin_dato`), `hitos` (lista de `{ nombre, dia, fuente }`), `reentrante`, `sinFinalizar` (en
50·53 y 54), `formulaZoho` y `valorZoho`.

#### Scenario: Forma de un indicador calculado
- GIVEN un ticket con cotización `2026-12-10` y orden de venta `2026-12-09`
- WHEN responde la ruta
- THEN el `59` trae `valor: -1`, `unidad: "dias_naturales"`, `estado: "calculado"` y dos `hitos` con su `fuente`

#### Scenario: Periodo inválido
- GIVEN `desde=2026-12-31` y `hasta=2026-12-01`
- WHEN llama un administrador
- THEN responde `400` y no se consultan tickets

### Requirement: RQ-KP-14 · La lectura no crece con el número de tickets y no escribe

La ruta **SHALL** leer con un número constante de consultas, independiente del número de tickets (tickets
del periodo, todas sus transiciones y los cierres de empresa). **MUST NOT** ejecutar ninguna sentencia que
no sea de lectura, ni llamar a Zoho, ni leer ningún fichero.

#### Scenario: Diez tickets, tres consultas
- GIVEN diez tickets del periodo, cada uno con transiciones
- WHEN llama un administrador
- THEN el número de consultas es el mismo que con un solo ticket y todas son de lectura

### Requirement: RQ-KP-15 · CSV con escapado

Con `formato=csv` la ruta **SHALL** responder `text/csv; charset=utf-8` como descarga. El CSV **SHALL** ir
en formato largo (SP-7): una cabecera y una fila por ticket e indicador, separador `;`, fin de línea CRLF,
con estas columnas en este orden: `ticket_id;codigo_servicio;columna;indicador;unidad;valor;estado;motivo;fuente_hitos;reentrante;sin_finalizar;formula_zoho;valor_zoho`.
`fuente_hitos` lleva cada hito con su fuente, separados por `|`. Reglas de celda, en este orden:
1. Un **número** (`valor` numérico, incluidos los negativos del 47, 57, 58 y 59) se emite como número, sin
   apóstrofo.
2. Una celda de **texto** que empiece por `=`, `+`, `-` o `@` **SHALL** llevar un apóstrofo delante.
3. Una celda que contenga `;`, `"`, CR o LF **SHALL** ir entre comillas, con las comillas internas duplicadas.

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
- El resumen **MUST NOT** llevar bandera de aprobado/suspenso, color ni meta.

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

La ruta **SHALL** armar los pares sólo con los valores de Zoho ya presentes en los datos sincronizados del
ticket (SP-9) y **MUST NOT** leer ningún fichero ni cargar el export de Zoho. Si **ningún** par tiene valor de Zoho, `comparacion` **SHALL** decir `«sin valor de Zoho con que comparar»` y
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

### Requirement: RQ-KP-18 · Lo que el módulo no hace

El sistema **MUST NOT**: escribir en la base (sin tabla de fotos, sin escritor, sin migración); escribir
contra Zoho; enviar correo o la encuesta; mostrar tablero, semáforo ni umbral (letra:
`R08.4.md:2956`, `R08.4.md:2959`, `R08.4.md:6316`); corregir la reentrancia (`R08.4.md:2961`) ni IV-11 o
IV-12; tocar `computeAnalisis` (`packages/shared/src/analisis.ts:17-95`). El cliente **MUST** limitarse a un
enlace de descarga visible para administradores; la imposición de ese permiso es la de RQ-KP-12.

#### Scenario: Una petición no deja rastro
- GIVEN un administrador que llama a la ruta con o sin `formato=csv`
- WHEN termina la petición
- THEN todas las sentencias ejecutadas fueron de lectura y no hubo llamada de red a Zoho

#### Scenario: Sin elementos de tablero
- GIVEN la respuesta JSON y el CSV
- WHEN se inspeccionan
- THEN no traen color, semáforo, meta ni bandera de aprobación
