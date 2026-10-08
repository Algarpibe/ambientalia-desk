# Delta: KPIs — los indicadores 51 y 55 dejan de salir «sin dato» (`indicadores-51-55`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`). Propuesta:
`openspec/changes/indicadores-51-55/proposal.md`. `R08.4.md` es
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

**Nota de fusión — la tabla de supuestos no es un requisito.** La tabla «0 · Procedencia y método» de la
spec viva (`openspec/specs/kpis/spec.md:19-35` en `42a4828`) no lleva cabecera `### Requirement:`, así que un script que
sustituya bloques por cabecera no la toca. Su fusión es aparte y explícita, sin cambiar el formato de
tres columnas (`Id | Supuesto | Origen`):

1. **Se retira** la fila `SP-8` («Con el hito opcional del 51 o del 55 presente, el módulo lo usa; la ruta
   nunca lo aporta»): ya no hay entrada opcional.
2. **Se añaden**, al final de la tabla y en este orden, las ocho filas de la sección «Filas que se añaden a la
   tabla de supuestos» de más abajo (`S-A` a `S-H`). Sus identificadores son letras y no chocan con `S-n` ni
   `SP-n`.
3. **No se tocan** las demás filas. Los requisitos RQ-KP-09, RQ-KP-10, RQ-KP-11, RQ-KP-14 y RQ-KP-18
   dejan de nombrar `SP-8`; el resto de referencias a `SP-n` y `S-n` sigue igual.

La fusión de requisitos: los seis bloques de `## MODIFIED Requirements` sustituyen **entero** el de la spec
viva con la misma cabecera; los cuatro de `## ADDED Requirements` se añaden al final, tras RQ-KP-18, en el
orden RQ-KP-19, 20, 21, 22.

## Filas que se añaden a la tabla de supuestos

| Id | Supuesto | Origen |
|---|---|---|
| S-A | Con dos entregas, el 51 usa **la última** por `performed_at`. La decisión dice «vale la que tenga el ticket» (`openspec/config.yaml:4099`) y no cubre el caso de dos | Propuesta (§4) |
| S-B | Motivos del 51 y su orden: primero «falta el hito: transición de entrega»; con entrega y sin finalización, «falta el hito: finalización del servicio». Sin fila de entrega no se usa `Fecha Remisión de Salida` como sustituto | Propuesta (§4) |
| S-C | Tabla de respuestas con huella única y varias respuestas por ticket; vale la última | Propuesta (§4) |
| S-D | El fichero de respuestas identifica el ticket por su **número**. Que el formulario lo recoja es hipótesis | Propuesta (§4) |
| S-E | El fichero es un CSV de exportación de Google Forms: separador `,` o `;`, BOM tolerado, columnas por nombre normalizado con sinónimos, marca de tiempo leída en `America/Bogota`. El formato no está en el repositorio y no hay muestra (`openspec/config.yaml:4102-4103`) | Propuesta (§4) |
| S-F | La carga es un `POST` multipart de administrador, sin interruptor y sin pantalla | Propuesta (§4) |
| S-G | Sin columna `canal` en la tabla de respuestas | Propuesta (§4) |
| S-H | El `GET /api/indicadores` sigue siendo sólo lectura, con cuatro consultas | Propuesta (§4) |

## MODIFIED Requirements

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
`formulaZoho`, con los mismos hitos y su fuente. Las variantes son **hipótesis sobre el export**
(`docs/analisis-tickets/Tickets.csv`), no letra.

| Indicador | Variante de Zoho | Sale «sin dato» cuando |
|---|---|---|
| 47 | «sin dato — falta el hito: hora del último cambio de estado». Zoho no usa la remisión de salida y **MUST NOT** sustituirse por ella | siempre |
| 49 | días de lunes a viernes **sin descontar festivos**, `(desde, hasta]`, de `Fecha creación ticket` (historial o `fecha_creacion_ticket`) a `Fecha Revisión Informe` | falta creación o revisión |
| 50·53 | lo mismo que RQ-KP-06 contando lunes a viernes sin festivos ni cierres, con el tope 0 y el 0 sin finalización | como RQ-KP-06 |
| 54 | 53 de la variante contra el 52; **sin tiempo promesa da `Cumple`** | el 53 de la variante es «sin dato» |
| 51 | «sin dato — falta el hito: hora del último cambio de estado». El texto completo es el de la constante `MOTIVO_H1` del módulo, que **no cambia** (el de hoy añade «, pendiente de decisión»; es el mismo del 47). La transición de entrega **no** es la fórmula de Zoho y **MUST NOT** presentarse como tal | siempre |
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
- GIVEN entrada `2026-12-16` y salida `2027-01-02`
- WHEN se calcula el 47
- THEN `valor` es `17` y `formulaZoho` es «sin dato»

#### Scenario: El 51 calculado sigue sin variante de Zoho
- GIVEN un ticket con entrega y finalización, con lo que el 51 es un número
- WHEN se calcula el 51
- THEN `valor` es ese número y `formulaZoho` es «sin dato»

#### Scenario: El 55 con variante igual a la letra
- GIVEN un ticket con una respuesta cargada de calificación `Excelente`
- WHEN se calcula el 55
- THEN `valor` es `Excelente` y `formulaZoho` es `Excelente`

### Requirement: RQ-KP-14 · La lectura no crece con el número de tickets y no escribe

La ruta **SHALL** leer con un número constante de **cuatro** consultas, independiente del número de tickets:
tickets del periodo, todas sus transiciones, los cierres de empresa y la última respuesta de la encuesta de
cada ticket del periodo (RQ-KP-22). **MUST NOT** ejecutar ninguna sentencia que no sea de lectura, ni llamar
a Zoho, ni leer ningún fichero.

#### Scenario: Diez tickets, cuatro consultas
- GIVEN diez tickets del periodo, cada uno con transiciones
- WHEN llama un administrador
- THEN el número de consultas es cuatro, el mismo que con un solo ticket, y todas son de lectura

#### Scenario: Veinte tickets, cuatro consultas
- GIVEN veinte tickets del periodo, algunos con respuestas de la encuesta y otros sin ellas
- WHEN llama un administrador
- THEN el número de consultas sigue siendo cuatro y todas son de lectura

### Requirement: RQ-KP-18 · Lo que el módulo no hace

El `GET /api/indicadores` y el cálculo de los indicadores **MUST NOT** escribir en la base (sin tabla de
fotos, sin escritor, sin migración propia del cálculo). La **única escritura admitida** en la capacidad es
la de la carga de respuestas de la encuesta de RQ-KP-21, **sólo** sobre la tabla
`public.encuesta_respuestas` de RQ-KP-19; esta excepción no autoriza ningún otro escritor, ninguna
escritura desde el `GET` ni desde el cálculo, ni ninguna escritura sobre otra tabla. El sistema **MUST NOT**
además: escribir contra Zoho; enviar correo o la encuesta; mostrar tablero, semáforo ni umbral (letra:
`R08.4.md:2956`, `R08.4.md:2959`, `R08.4.md:6316`); corregir la reentrancia (`R08.4.md:2961`) ni IV-11 o
IV-12; tocar `computeAnalisis` (`packages/shared/src/analisis.ts:17-95`). El cliente **MUST** limitarse a un
enlace de descarga visible para administradores; la imposición de ese permiso es la de RQ-KP-12. La
capacidad **MUST NOT** añadir pantalla de carga en el cliente.

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

## ADDED Requirements

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
(S-H): **MUST NOT** cargar, borrar ni actualizar respuestas. Las respuestas de tickets fuera del periodo
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

#### Scenario: Respuestas de tickets fuera del periodo
- GIVEN una respuesta de un ticket creado fuera del periodo pedido
- WHEN responde la ruta
- THEN el ticket no aparece en la salida y su respuesta no afecta a ningún otro
