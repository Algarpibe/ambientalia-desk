# Delta for transitions-st

Contexto: `openspec/specs/transitions-st/spec.md`. `fechas-derivadas-servidor` (F1A-07 · IV-2) añade una
**segunda validación de campos**, fuera de `buildTransitionPlan`, para las tres fechas derivadas. **Toda
cita `ruta:línea` de este delta se lee contra `4976787`** (regla de mutación 4, `CLAUDE.md`).

**Las citas de `ticketService.ts` (y de `ticketService.test.ts`) de los tres bloques que este delta
reescribe — `RQ-TS-06`, `RQ-TS-08` y este `3.8`, incluida `createManagedTicket` — se reanclaron contra
`4976787`, caso A de la regla de mutación 4: eran ciertas en `f367186`; `ccedf4f` (código de
`orden-precedencia-guardas`) desplazó las líneas y `aa886c6` (su archive) las fusionó en la spec viva
sin reanclar.** Verificado leyendo los dos ficheros enteros, línea a línea, contra `4976787`. **Al
archivar esta tanda, se vuelven a comprobar contra el árbol de ese momento**: `:130` y `:132` de
`ticketService.ts` cambian de CONTENIDO aunque no se muevan —ahí inserta el diseño la validación
nueva—, y las citas que los nombren entonces tienen que describir lo que digan en ese punto, no lo de
hoy.

**MODIFICA:** `RQ-TS-06` (nueva fila «fecha derivada sin fuente inválida», escalón C, entre obligatorios
y derivación; las ocho filas, reancladas), `RQ-TS-08` (dos validaciones de campos: presencia,
en `buildTransitionPlan`; contenido de las tres fechas derivadas, fuera de él, mismo `422`) y `3.8`
(añade la guarda nueva al escalón C y a la secuencia de `executeTransition`; reancla contra `4976787`
todas las citas de `ticketService.ts` y `ticketService.test.ts` de sus dos puertas, `createManagedTicket`
incluida).

## MODIFIED Requirements

### Requirement: RQ-TS-06 · Orden de las guardas, y qué contesta cada una

`POST /api/tickets/:id/transition` (`routes/tickets.ts:192-194`) **SHALL** exigir sesión
(`routes/tickets.ts:35`) y **SHALL** aplicar las guardas de `executeTransition`
(`services/ticketService.ts:112-221`) **en este orden**, que es el que exige el orden total de
precedencia (§3.8): existencia (A) y estado/permiso (B) antes que contenido (C), y éste antes que
unicidad (D).

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | La transición existe | A | `400 'Transición desconocida'` | `ticketService.ts:121` |
| 2 | El ticket existe | A | `404 'Ticket no encontrado'` | `:123` |
| 3 | El estado actual está en el `from` de la transición | B | `409 '…no aplica desde el estado…'` | `:124-126` |
| 4 | El área del usuario cubre el área de la transición | B | `403 '…no tiene permiso para esta transición…'` | `:127-129` |
| 5 | Los campos obligatorios están presentes | C | `422 { errors: plan.errors }` | `:132` |
| 6 | Una fecha derivada tecleada sin fuente no es una fecha real | C | `422 { errors }` | `:132` (fijada por el diseño; ver `RQ-TS-08`) |
| 7 | La persona a la que se deriva existe y está activa | C | `422 'La persona a la que se deriva no existe o está dada de baja'` | `:136-140` |
| 8 | La orden de venta no está ya asociada a otro ticket | D | `409 '…ya está asociada al ticket #…'` | `:146-150` |

(Previously: siete filas, sin la 6; evidencias `:117`, `:119`, `:120-122`, `:123-125`, `:128`,
`:140-144` y `:132-136` — caducas contra `4976787`, reancladas por esta tanda. La guarda 6 antigua
(persona) pasa a fila 7; la 7 antigua (OV) pasa a fila 8.)

El orden **MUST** tenerse en cuenta al probar: una matriz de permisos montada sobre un estado de
origen inválido comprueba el `409` de la guarda 3 y cree comprobar el `403` de la 4
(`permisos.test.ts:29-33`).

> **Given** un ticket en estado `En Proceso`
> **When** se ejecuta `aprobacion`, cuyo único `from` es `Notificación cliente`
> **Then** el servidor responde `409` y no escribe nada.

#### Scenario: La fecha derivada inválida sin fuente responde 422, detrás de los obligatorios
- GIVEN una transición con sus campos obligatorios completos, sin fuente disponible para una de las
  tres fechas derivadas, y un valor tecleado que no es una fecha real (p. ej. `2026-02-30`)
- WHEN se ejecuta la transición
- THEN el servidor responde `422 { errors }`, con el error de esa fecha

### Requirement: RQ-TS-08 · Campos y validación de obligatorios

`buildTransitionPlan(transition, values)` (`apps/desk/server/transitionExec.ts:37-99`) **SHALL** ser la
única validación de **presencia** de campos, **SHALL** ser puro y **SHALL** devolver la lista de errores
en `plan.errors` en lugar de lanzar.

**`buildTransitionPlan` DEJA de ser la única validación de campos, a secas.** Desde
`fechas-derivadas-servidor` hay una segunda validación, de **contenido** y sólo para las tres fechas
derivadas (`Fecha creación ticket`, `Fecha Remisión Entrada`, `Fecha Revisión Informe`). Vive fuera de
`buildTransitionPlan`, en `executeTransition` (`apps/desk/server/services/ticketService.ts:132`), por
dos razones: (1) no tocar `transitionExec.ts` — 40 citas vivas en 14 ficheros, medidas el 2026-09-21 —
y (2) acotar la validación nueva a esas tres fechas. Sus errores **SHALL** salir en el mismo
`422 { errors }` que los de presencia, **detrás** de ellos — presencia antes que validez, el sub-orden
que fija `transitions-st` §3.8. (Previously: «SHALL ser la única validación de campos», sin matiz.)

- Un campo `required` que llega vacío **SHALL** producir
  `Falta el campo obligatorio: <label>` (`transitionExec.ts:77`), y el llamador **SHALL** traducirlo a
  `422` (`ticketService.ts:132`).
- El **comentario NUNCA MAY declararse obligatorio**: el ayudante `comment()` no admite parámetro
  (`transitions.ts:65-74`), y por eso el motor se quedó sin la guarda aparte que lo comprobaba
  (`transitionExec.ts:95-99`). Es el principio de diseño nº 4 del maestro cumplido en el código
  (`:1416`).
- Un `checkbox` **required SHALL** exigir que llegue **marcado**: la condición es `asBool(raw) !== true`,
  no `empty` (`transitionExec.ts:76`). Ausente y presente-en-`false` **SHALL** producir el mismo
  `Falta el campo obligatorio: <label>`. Era el defecto **C1**, cerrado en **F1A-01** — ver §3.1.
- Un `checkbox` **opcional** ausente **SHALL** seguir escribiéndose como `false`: el chequeo de
  obligatorio va antes del bloque del checkbox, y éste antes del `if (empty) continue`
  (`transitionExec.ts:76-86`, fijado en `transitionExec.test.ts:89-111`).
- Las etiquetas de campo son las **etiquetas exactas de Zoho** (`transitions.ts:20-21`).

#### Scenario: `transitionExec.ts` no cambia
- GIVEN esta tanda completa
- WHEN se compara `apps/desk/server/transitionExec.ts` antes y después
- THEN no hay diferencia: la validación de contenido de las tres fechas vive en `ticketService.ts`

### Requirement: 3.8 · El orden único de precedencia entre guardas — cerrado en el motor por `orden-precedencia-guardas`

`plan:425` (`ad65161`) entrega un **orden total**, no una regla acotada por puerta ni redactada por
código HTTP.

**`SHALL`, sin recortes.** `A < B < C < D` es un orden total sobre las guardas. Toda guarda de un
escalón anterior **SHALL** evaluarse antes que cualquier guarda de un escalón posterior. No se acota
por grupo, no se enuncia como «precedencia observable» y no admite excepción escrita.

| Escalón | Qué clase de cosa comprueba | Guardas verificadas |
|---|---|---|
| **A · existencia** | ¿está presente y existe lo que la petición direcciona, o aporta por identificador? | `:121` transición desconocida · `:123` ticket no encontrado · `:23` falta el equipo · `:25` equipo no registrado · `:37` OV no encontrada |
| **B · estado y permiso del sujeto** | ¿puede esta operación ocurrir sobre este sujeto ahora? | `:124-126` estado de origen · `:127-129` área |
| **C · contenido** | ¿es válido y coherente lo que la petición aporta como contenido? | `:59-77` equipo↔cliente · `:86` obligatorios · `:88` cliente no encontrado · `:132` obligatorios del plan · **`:132` fecha derivada sin fuente inválida, fijada por el diseño (`fechas-derivadas-servidor`, nueva; ver `RQ-TS-08`)** · `:136-140` derivación |
| **D · unicidad sobre un valor aportado** | ¿el valor aportado choca con otro registro? | `:94-98` OV ya usada en el alta (bloque que `orden-precedencia-guardas` movió detrás de `:88`) · `:146-150` OV ya usada en `habilitar_servicio` (bloque que `orden-precedencia-guardas` movió detrás de `:140`) |

**La frontera A/C.**
- `:88` «Cliente no encontrado» es **C**, no A: no comprueba una entidad aportada tal cual, comprueba
  el `clientId` **ya resuelto** —cuerpo, orden de venta (`:39`) o equipo (`:62`)—. Valida el resultado
  de una resolución, no un identificador recibido.
- `:136-140` «la persona a la que se deriva» es **C**, no A (obs. #702): no es existencia pura, rechaza
  también a quien existe pero está dado de baja (`:139`).

**El criterio de fondo de P1 sobrevive intacto:** primero lo que el usuario puede arreglar (A y C),
después lo que no (D). La escalera sólo lo hace decible sin contradecir a P2.

**Sub-orden dentro de un escalón**, fijado por dependencia de datos y por prueba, no por la escalera:
presencia antes que validez (`:132` obligatorios del plan antes que la fecha derivada sin fuente
inválida —misma línea, `fechas-derivadas-servidor`—, y ésta antes de `:136-140` derivación) y el hueco
se rellena antes de contarlo (`:59-77` antes de `:86`, porque la rama (i) de `:59-62` tiene que poner
`clientId` antes de `:82`).

#### a) Las dos puertas de la OV comprueban ahora la misma regla en el mismo orden

| Puerta | Orden declarado (guardas reales, tras esta tanda) | Quién gana ante el error doble (obligatorios / OV ya usada) |
|---|---|---|
| `createManagedTicket` | `:23` A · `:25` A · `:37` A · `:59-77` C · `:86` C · `:88` C · `:94-98` D (movida, última) | el **`422`** de obligatorios (`ticketService.test.ts:345`, `:352`) |
| `executeTransition` | `:121` A · `:123` A · `:124-126` B · `:127-129` B · `:132` C · fecha derivada C (nueva) · `:136-140` C · `:146-150` D (movida, última) | el **`422`** de obligatorios (`ticketService.test.ts:195`) |

Cero inversión: las dos puertas evalúan la misma pareja en el mismo orden.

(Previously: la tabla citaba `createManagedTicket` en `ticketService.ts:22-60` y `executeTransition`
en `:82-110`, con **cinco** guardas cada uno —los dos rangos se cortaban justo donde empieza la guarda
equipo↔cliente— y las pruebas contradictorias citadas eran `ticketService.test.ts:295` y `:176`. Tras
`orden-precedencia-guardas` las evidencias pasaron a `:327`/`:336` y `:194`, y esta tanda —
`fechas-derivadas-servidor` — las reancla otra vez contra `4976787`: `:345`/`:352` y `:195`, más la
guarda de fecha derivada en `executeTransition`.)

#### b) El `409` de estado sigue contestando antes que el `403` de área — conservado como sub-orden de B

En `executeTransition`, la guarda del estado de origen **SHALL** evaluarse antes que la guarda del área
(`:124-126` antes de `:127-129`). Las **tres** pruebas de posición que clavan la cadena completa:
`ticketService.test.ts:158` (estado > área), `:164` (estado > obligatorios) y `:170` (área >
obligatorios).

**Alcance real, para no exagerarlo.** El middleware ya exige sesión antes de llegar aquí
(`routes/tickets.ts:35`): no es exposición a un anónimo, y el `403` llegaría igual en cuanto el ticket
estuviera en el estado bueno. Es inconsistencia de contrato, no fuga.

#### c) Contrato de errores: `404` frente a `422` (P3)

El sujeto que la propia ruta direcciona por identificador **SHALL** producir `404` cuando no exista; la
entidad referenciada desde el cuerpo de la petición, o desde un dato ya guardado, **SHALL** producir
`422` cuando no exista o no sea válida. La distinción es por **quién nombra al sujeto** (la URL) frente
a **quién aporta la referencia** (el cliente, en el cuerpo o en datos previos) — nunca por el código en
sí. Ningún código, texto ni guarda de producción de `ticketService.ts` ni de `remision.ts` cambia por
este contrato: se fija con un guión de prueba nuevo, que se pone en rojo al invertir cualquiera de los
dos casos.

**Bajo `strict_tdd`:** las dos comprobaciones del contrato 404/422 nacen **verdes** —el código ya
distingue por dónde llega el sujeto—; su rojo se obtiene **por mutación**: invertir el código de venta
en cada caso, correr el guión, confirmar el rojo, revertir con `git diff`.

#### Las tres puertas contra el orden total

| Puerta | Secuencia de escalones tras esta tanda | Veredicto |
|---|---|---|
| `createManagedTicket` | A A A C C C D | **cumple** |
| `executeTransition` | A A B B C C C D | **cumple** — la C añadida es la fecha derivada de `fechas-derivadas-servidor` |
| Alta de remisión (`remision.ts`, no se toca) | A A C A D C A D | **incumple, en dos puntos → IV-12** |

(Previously: `executeTransition` | A A B B C C D — seis escalones, sin la fecha derivada.)

**El precedente de F1B-01 es consecuencia del orden, no una excepción.** `remision.ts:155` —el `422`
del serial, escalón A— gana al `409` de remisión pendiente (`:177`, escalón D) porque A precede a D. La
prueba de posición `remisiones.test.ts:957` queda intacta, sin necesidad de declarar nada aparte.

**El alta de remisión no cumple el orden total, y se registra sin corregirse** (IV-12, `CLAUDE.md`,
`openspec/config.yaml`):
1. **C antes que A** — `remision.ts:127` (fecha inválida, C) corre antes que `:155` (falta el serial,
   A).
2. **A después de C** — `remision.ts:220` (OV no encontrada, A) corre después de `:127` y de `:197`
   (ítems fuera del checklist, C).

Ninguno de los dos se corrige aquí: reordenar el alta reabriría el precedente que F1B-01 fijó a
propósito, sin una decisión de Gerencia que lo pida.

#### Scenario: La guarda de contenido equipo↔cliente gana a la guarda de unicidad de la OV
- GIVEN un alta cuyo equipo pertenece a un cliente distinto del solicitado, y cuya orden de venta ya
  está asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (equipo↔cliente, escalón C) y no `409` (OV, escalón D)

#### Scenario: Dentro del escalón B, el estado de origen sigue precediendo al área
- GIVEN un ticket en un estado que no admite la transición pedida, ejecutado por un usuario sin el
  área requerida
- WHEN se ejecuta la transición
- THEN responde `409` (estado de origen) y no `403` (área)

#### Scenario: El sujeto direccionado por la URL responde 404; la referencia del cuerpo responde 422
- GIVEN una petición cuyo identificador de ruta no existe
- WHEN se procesa
- THEN responde `404`
- GIVEN una petición cuyo identificador de ruta sí existe, pero cuya referencia del cuerpo (p. ej. la
  orden de venta) no existe
- WHEN se procesa
- THEN responde `422`

#### Scenario: El alta de remisión no cumple el orden total, y el desvío queda registrado sin corregirse
- GIVEN una fecha inválida y un ticket sin serial en la misma petición de alta de remisión
- WHEN se envía
- THEN responde `422` de fecha inválida (escalón C) antes que la falta de serial (escalón A) — IV-12

#### Scenario: La fecha derivada sin fuente inválida es escalón C, y no altera la escalera A-B-C-D

**Garantía estructural documentada, no escenario con test de ejecución pendiente.** De las 34
transiciones declaradas en `packages/shared/src/transitions.ts`, sólo `habilitar_servicio`
(`:178-189`) declara `cfOrdenVenta` — el campo que activa la guarda de unicidad de OV, escalón D — y
esa misma entrada no declara ninguna de las tres fechas derivadas; y la única transición que declara
fechas derivadas junto a otros campos propios, `ingreso_a_servicio` (`:190-191`, declara `Fecha
creación ticket` y `Fecha Remisión Entrada`), no declara `cfOrdenVenta`. El GIVEN de abajo — una
fecha derivada inválida sin fuente Y una orden de venta ya asociada a otro ticket, en la MISMA
petición — no es alcanzable hoy con ninguna de las 34 transiciones reales: no existe una que declare
los dos campos a la vez.

La garantía queda sostenida por inspección de código y por la prueba de mutación de posición (regla
de mutación 1 de `CLAUDE.md`): el orden lineal de `executeTransition` valida la fecha derivada
(escalón C, `ticketService.ts:130-132`) incondicionalmente antes que la unicidad de OV (escalón D,
`ticketService.ts:146-150`), sin ninguna rama que pueda invertirlos, y ese mismo tramo está probado
en rojo y revertido por los casos `P-a`/`P-b` de
`apps/desk/server/services/valoresDeTransicion.test.ts:176-197`.

- GIVEN una transición con sus obligatorios completos, sin fuente para una fecha derivada, y un valor
  tecleado inválido, ejecutada sobre un ticket con una orden de venta ya asociada a otro ticket
- WHEN se ejecuta la transición
- THEN responde `422` de la fecha (escalón C) y no `409` de la OV (escalón D)

> **Nota — esta enmienda no cierra la puerta a la cobertura de ejecución.** Si en el futuro una
> transición real llega a declarar a la vez un campo de fecha derivada y `cfOrdenVenta`, el GIVEN de
> arriba pasa a ser alcanzable con datos reales y el requisito vuelve a exigir un test de integración
> que lo ejercite exactamente — esta nota documenta que hoy (34 transiciones, ninguna combina los dos
> campos) la garantía es estructural, no que quede eximida para siempre.
