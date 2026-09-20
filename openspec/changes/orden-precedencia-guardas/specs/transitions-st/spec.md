# Delta for transitions-st

Contexto: `openspec/specs/transitions-st/spec.md`. `orden-precedencia-guardas` (F1B-10) declara un
**orden total** de precedencia entre guardas —cuatro escalones, `A < B < C < D`— y mueve dos bloques en
`apps/desk/server/services/ticketService.ts`. **Toda cita `ruta:línea` de este delta se lee contra
`ad65161`** (Caso B de la regla de mutación 4, `CLAUDE.md`): `:45-49` (OV en el alta) y `:132-136` (OV
en `executeTransition`) son la posición **actual** de los bloques que esta tanda mueve, no una
numeración futura todavía inexistente.

**El eje de todo `SHALL` de este delta es el escalón — nunca el código HTTP** (obs. #700, #707): el
código de respuesta es consecuencia del escalón y del canal, nunca el criterio.

**MODIFICA:** `RQ-TS-06` (tabla de guardas de `executeTransition`, las guardas 6 y 7 se intercambian),
`3.4` (**corrección de Gerencia, 2026-09-17, opción (a) sobre el hallazgo de `sdd-design`:** dos de sus
tres aserciones se vuelven falsas con el movimiento —no sólo la línea, el CONTENIDO— y ningún otro
delta las cubría; se reescribe aquí porque la frase que queda falsa es resultado propio de esta tanda,
no daño colateral) y `3.8` (reescrita entera: el orden total, la tabla de las siete guardas reales por
puerta, la frontera A/C, el sub-orden conservado de §3.8(b), el contrato de errores 404/422 de P3, y el
incumplimiento registrado del alta de remisión — IV-12).

**Barrido de cierre — obligación de `apply`, registrada aquí para que no se pierda. Inventario
CORREGIDO** (el que circulaba antes —«tres citas», luego «cinco»— estaba incompleto por defecto;
completo contra `60f03ae`, buscando los DOS bloques que se mueven):

**Bloque de `executeTransition` (`:132-136`) — seis sitios citan `:134` o `:134-135`:**

| Sitio | Cita | Qué afirma | Pendiente de `apply` |
|---|---|---|---|
| `CLAUDE.md:341` | `:134` | IV-11: la puerta 2 comprueba «sólo por número» | sí |
| `openspec/config.yaml:455` | `:134-135` (y `:45-48`, ver abajo) | IV-4 cerrado, describe qué comprobaba la tercera puerta | sí |
| `openspec/config.yaml:984` | `:134` | IV-11, misma afirmación | sí |
| `openspec/specs/remisiones/spec.md:330` | `:135` | texto del `409` citado en `RQ-RE-16` | sí — ⚠️ cita `:135`, no `:134`: un `grep` de `:134` no la caza aunque esté en el mismo bloque |
| `openspec/specs/remisiones/spec.md:342` | `:134-135` | `SHALL` del tercer punto de captura de la OV | sí |
| `openspec/specs/transitions-st/spec.md:574` | `:134-135` | tabla de §3.4: «el 422 de obligatorios gana» en `habilitar_servicio` | **NO — la resuelve el `MODIFIED` de `3.4` de este mismo delta** |

**Bloque G4 (`:43-49`) — catorce sitios más.** Seis son specs VIVAS (Caso A, se reapuntan al cierre):
`openspec/specs/tickets-core/spec.md:181`, `:185`, `:355`, `:368`, `:401` y
`openspec/specs/transitions-st/spec.md:573` (**ésta la resuelve el `MODIFIED` de `3.4` de este mismo
delta, igual que `:574`**). Los otros ocho son documentos **fechados** (Caso B, **no se renumeran**,
se leen anclados a su fecha): `docs/sdd/F1B-01_Serial_llave_de_entrada.md:223`,
`docs/sdd/Puntos_para_Gerencia_2026-09-11.md:167`, `docs/sdd/F0-01_Correcciones_para_el_plan.md:293`,
`docs/runbooks/verificaciones-pendientes-F0.md:148`, `openspec/changes/F0-01/proposal.md:130`,
`openspec/changes/F0-04/proposal.md:204`, `openspec/config.yaml:478` (⚠️ abreviada: «`:45-48` … y
`:134-135`», sin nombre de fichero) y `openspec/config.yaml:987` (`ticketService.ts:45-49`).

De los **veinte** sitios (seis + catorce), **dos** —`transitions-st/spec.md:573` y `:574`— los resuelve
ya este delta, al traer `3.4` a `MODIFIED Requirements`. Quedan **dieciocho** pendientes del barrido de
`apply`. Ninguno se vuelve semánticamente falso con el movimiento salvo los dos que este delta ya
corrige: lo que se rompe en los otros dieciocho es sólo el número de línea (Caso A) o nada, porque están
anclados a su fecha (Caso B). El barrido se hace **por fichero citado**
(`grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"`), **más un segundo pase para la forma abreviada**
(sin nombre de fichero, que ese `grep` no captura), comprobando los dos extremos de cada rango por
separado y leyendo qué afirma la frase — nunca por el tema de la tanda. Ninguno de los dieciocho se
toca en este intento: el código todavía no se ha movido.

## MODIFIED Requirements

### Requirement: RQ-TS-06 · Orden de las guardas, y qué contesta cada una

`POST /api/tickets/:id/transition` (`routes/tickets.ts:192-194`) **SHALL** exigir sesión
(`routes/tickets.ts:35`) y **SHALL** aplicar las guardas de `executeTransition`
(`services/ticketService.ts:108-215`) **en este orden**, que es el que exige el orden total de
precedencia (§3.8): existencia (A) y estado/permiso (B) antes que contenido (C), y éste antes que
unicidad (D).

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | La transición existe | A | `400 'Transición desconocida'` | `ticketService.ts:117` |
| 2 | El ticket existe | A | `404 'Ticket no encontrado'` | `:119` |
| 3 | El estado actual está en el `from` de la transición | B | `409 '…no aplica desde el estado…'` | `:120-122` |
| 4 | El área del usuario cubre el área de la transición | B | `403 '…no tiene permiso para esta transición…'` | `:123-125` |
| 5 | Los campos obligatorios están presentes | C | `422 { errors: plan.errors }` | `:128` |
| 6 | La persona a la que se deriva existe y está activa | C | `422 'La persona a la que se deriva no existe o está dada de baja'` | `:140-144` |
| 7 | La orden de venta no está ya asociada a otro ticket | D | `409 '…ya está asociada al ticket #…'` | `:132-136` |

> **⚠️ Las siete citas de esta tabla se reanclaron el 2026-09-10 y SEIS DE LAS SIETE estaban caducas.**
> Decían `:82-83`, `:84-85`, `:86-88`, `:89-91`, `:93-94` y `:106-110`. Sólo la 6 se había corregido
> antes, y ella sola ha derivado **tres veces**: `:100` → `:128-129` → `:134-135`.
>
> **Una tabla anclada por número de línea y sin detector volverá a derivar.** La columna Respuesta
> lleva el mensaje literal del `throw` precisamente por eso: es un ancla que no se mueve al insertar
> código encima. Queda **sin decidir** si eso basta o si hace falta además una prueba que fije la
> tabla — es alcance nuevo y se propone aparte.

El orden **MUST** tenerse en cuenta al probar: una matriz de permisos montada sobre un estado de
origen inválido comprueba el `409` de la guarda 3 y cree comprobar el `403` de la 4
(`permisos.test.ts:29-33`).

El intercambio de las guardas 6 y 7 lo fija `ticketService.test.ts:205` en `ad65161`, que manda a la vez una orden
de venta ya usada y una derivación que no resuelve: antes ganaba el `409` de la OV, ahora gana el `422`
de la derivación. `:218` —una sola guarda, sin OV de por medio— sobrevive intacta.

(Previously: la guarda 6 era «la orden de venta no está ya asociada a otro ticket» (`:134-135`, D) y la
7 «la persona a la que se deriva…» (`:140-144`, C); la OV ganaba a la derivación.
`orden-precedencia-guardas` las invierte: el escalón C precede al D.)

> **Given** un ticket en estado `En Proceso`
> **When** se ejecuta `aprobacion`, cuyo único `from` es `Notificación cliente`
> **Then** el servidor responde `409` y no escribe nada.

### Requirement: 3.4 · La tercera puerta de la orden de venta · DECIDIDA, y se construye

> **✅ RESUELTO EL 2026-09-10 · `decision/n52-cardinalidad-ov`.** Es el mismo defecto que
> `remisiones` §5.1 y `tickets-core` §4.2, visto desde la tercera spec. El punto abierto nº 52 quedó
> cerrado como **`1 ticket : N OV`**: **se construye la tercera puerta y las dos existentes se
> quedan.** Ver `remisiones` §5.1, que es donde vive el detalle.
>
> *(Previously, hasta el barrido del 2026-09-10: «**Destino: punto abierto nº 52 del maestro**, no una
> tanda — y el arreglo **puede ser retirar** las dos puertas existentes, no añadir la tercera». Ese
> enmarcado lo invirtió la decisión del 10/09.)*

**Comportamiento actual. IV-4 pasa de bloqueado a CONSTRUIBLE** (`config.yaml`,
`incumplimientos_vivos`, IV-4). La regla «una OV, un ticket» tiene **tres** puertas; las **dos**
primeras la comprueban, y ahora **en el mismo orden** entre sí:

| Puerta | Comprueba | Precedencia del `409` frente al `422` de obligatorios | Evidencia |
|---|---|---|---|
| Creación de ticket | Sí, `409` | El **`422` de obligatorios gana** | `ticketService.ts:45-49` (movida detrás de la guarda de cliente, `:94`) |
| Transición `habilitar_servicio` | Sí, `409` | El **`422` de obligatorios gana** | `ticketService.ts:132-136` (movida detrás de la guarda de derivación, `:144`) |
| **Alta de remisión** | **No** | — | `apps/desk/server/routes/remision.ts:218-240` |

**Las dos primeras SON equivalentes ahora**: comprueban la misma regla en el mismo orden. La inversión
de precedencia que aquí se declaraba —«órdenes opuestos», «va aparte en §3.8»— la **resuelve**
`orden-precedencia-guardas`: el orden único que las hace equivalentes queda declarado, con sus cuatro
escalones, en §3.8. La tercera puerta —el alta de remisión— sigue sin comprobar esta regla de
cardinalidad, y por separado incumple el orden total en dos puntos propios: registrado como **IV-12**,
también en §3.8, sin corregirse aquí.

La tercera confiaba sólo en `WHERE COALESCE(orden_venta,'') = ''`, que impide pisar la OV del propio
ticket pero **no** evitaba que dos tickets distintos acabaran con la misma. Había un `it.fails`
esperando (`apps/desk/server/ordenVentaUnTicket.test.ts:161` en `b99d47a`), con una prueba que fijaba
el daño observable: la orden quedaba en los dos tickets, por sus dos vías (`:156-158` en `b99d47a`).
**CERRADO por `tercera-puerta-orden-venta` (`79cf09b`):** el `it.fails` se puso verde con un `409`, y
la tercera puerta llama hoy también a `ticketConOrdenVenta` (`remision.ts:230`).

(Previously: la fila de creación de ticket decía «el `409` de la OV gana», con evidencia `:45-49` sin
más — falso por CONTENIDO tras esta tanda, no sólo por línea. El párrafo siguiente declaraba las dos
primeras puertas «no equivalentes», con la inversión «aparte en §3.8». Corrección de Gerencia,
2026-09-17, opción (a): hallazgo de `sdd-design` —§6.3 y §7 de `design.md`—, no del encargo original de
`sdd-spec`; el barrido por fichero citado de la primera versión de este delta no lo cazaba porque las
dos frases hablan de CONTENIDO, no sólo de número de línea.)

#### Scenario: Las dos primeras puertas de la OV evalúan ya la misma regla en el mismo orden
- GIVEN un alta de ticket y una transición `habilitar_servicio`, cada una con los obligatorios sin
  completar y una orden de venta ya asociada a otro ticket
- WHEN se ejecuta cualquiera de las dos
- THEN las dos responden `422` (los obligatorios ganan) — ya no hay inversión de precedencia entre
  ellas

### Requirement: 3.8 · El orden único de precedencia entre guardas — cerrado en el motor por `orden-precedencia-guardas`

`plan:425` (`ad65161`) entrega un **orden total**, no una regla acotada por puerta ni redactada por
código HTTP.

**`SHALL`, sin recortes.** `A < B < C < D` es un orden total sobre las guardas. Toda guarda de un
escalón anterior **SHALL** evaluarse antes que cualquier guarda de un escalón posterior. No se acota
por grupo, no se enuncia como «precedencia observable» y no admite excepción escrita.

| Escalón | Qué clase de cosa comprueba | Guardas verificadas |
|---|---|---|
| **A · existencia** | ¿está presente y existe lo que la petición direcciona, o aporta por identificador? | `:117` transición desconocida · `:119` ticket no encontrado · `:23` falta el equipo · `:25` equipo no registrado · `:37` OV no encontrada |
| **B · estado y permiso del sujeto** | ¿puede esta operación ocurrir sobre este sujeto ahora? | `:120-122` estado de origen · `:123-125` área |
| **C · contenido** | ¿es válido y coherente lo que la petición aporta como contenido? | `:65-83` equipo↔cliente · `:92` obligatorios · `:94` cliente no encontrado · `:128` obligatorios del plan · `:140-144` derivación |
| **D · unicidad sobre un valor aportado** | ¿el valor aportado choca con otro registro? | `:45-49` OV ya usada en el alta (bloque que esta tanda mueve detrás de `:94`) · `:132-136` OV ya usada en `habilitar_servicio` (bloque que esta tanda mueve detrás de `:144`) |

**La frontera A/C.**
- `:94` «Cliente no encontrado» es **C**, no A: no comprueba una entidad aportada tal cual, comprueba
  el `clientId` **ya resuelto** —cuerpo, orden de venta (`:39`) o equipo (`:68`)—. Valida el resultado
  de una resolución, no un identificador recibido.
- `:140-144` «la persona a la que se deriva» es **C**, no A (obs. #702): no es existencia pura, rechaza
  también a quien existe pero está dado de baja (`:143`).

**El criterio de fondo de P1 sobrevive intacto:** primero lo que el usuario puede arreglar (A y C),
después lo que no (D). La escalera sólo lo hace decible sin contradecir a P2.

**Sub-orden dentro de un escalón**, fijado por dependencia de datos y por prueba, no por la escalera:
presencia antes que validez (`:128` antes de `:140-144`) y el hueco se rellena antes de contarlo
(`:65-83` antes de `:92`, porque la rama (i) de `:65-68` tiene que poner `clientId` antes de `:88`).

#### a) Las dos puertas de la OV comprueban ahora la misma regla en el mismo orden

| Puerta | Orden declarado (las siete guardas reales, tras esta tanda) | Quién gana ante el error doble (obligatorios / OV ya usada) |
|---|---|---|
| `createManagedTicket` | `:23` A · `:25` A · `:37` A · `:65-83` C · `:92` C · `:94` C · `:45-49` D (movida, última) | el **`422`** de obligatorios (`ticketService.test.ts:327`, `:336`) |
| `executeTransition` | `:117` A · `:119` A · `:120-122` B · `:123-125` B · `:128` C · `:140-144` C · `:132-136` D (movida, última) | el **`422`** de obligatorios (`ticketService.test.ts:194`) |

Cero inversión: las dos puertas evalúan la misma pareja en el mismo orden.

(Previously: la tabla citaba `createManagedTicket` en `ticketService.ts:22-60` y `executeTransition`
en `:82-110`, con **cinco** guardas cada uno —los dos rangos se cortaban justo donde empieza la guarda
equipo↔cliente, `:65`— y las pruebas contradictorias citadas eran `ticketService.test.ts:295` y `:176`;
las reales, hoy en verde consistente, son `:327`/`:336` y `:194`.)

#### b) El `409` de estado sigue contestando antes que el `403` de área — conservado como sub-orden de B

En `executeTransition`, la guarda del estado de origen **SHALL** evaluarse antes que la guarda del área
(`:120-122` antes de `:123-125`). Las **tres** pruebas de posición que clavan la cadena completa:
`ticketService.test.ts:154` (estado > área), `:160` (estado > obligatorios) y `:166` (área >
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
| `executeTransition` | A A B B C C D | **cumple** |
| Alta de remisión (`remision.ts`, no se toca) | A A C A D C A D | **incumple, en dos puntos → IV-12** |

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

(Previously: «Dos inversiones de precedencia entre guardas · destino REASIGNADO», sin escalones, sin
declarar un orden total, sin el contrato 404/422, y sin registrar el incumplimiento del alta de
remisión.)

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
