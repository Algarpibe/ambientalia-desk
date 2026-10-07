# Delta para trazas — la reasignación con motivo deja registro propio y SÍ se lee en el historial (F1B-05, `cierra: si`)

Numeración comprobada contra `openspec/specs/trazas/spec.md`: el último requisito vivo es RQ-TZ-19; el nuevo es RQ-TZ-20.
**Modifica** RQ-TZ-06 (las fuentes del historial pasan de tres a cuatro, y la prohibición de tabla propia queda para las tres primeras) y RQ-TZ-17 (la reasignación se declara como registro propio que sí entra en el historial; la frase final pasa a
referirse a los tres que no entran). **No modifica** RQ-TZ-18: la línea de traspaso sigue derivándose sólo de las
transiciones y la reasignación no es una transición; RQ-TZ-20 lo aclara sin tocarlo. Supuestos S-1…S-7: los de
`proposal.md`, todos reversibles. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

## MODIFIED Requirements

### RQ-TZ-17 · Las excepciones a la traza del ticket se declaran, no se absorben

Cada cosa que cambia datos sin fila en `ticket_transitions` **SHALL** estar declarada con su situación:

| Hecho | Situación |
|---|---|
| Ajustes de prioridad y Top 5 (`prioridad_ajustes`) | Registro propio; **no** entra en el historial del ticket |
| Asociaciones de orden de venta (`ov_asociaciones`) | Registro propio; **no** entra en el historial |
| Cambios del equipo (`equipos_cambios`) | Registro propio; **no** entra en el historial |
| Reasignaciones de la persona a cargo (`reasignaciones`, RQ-TZ-20) | Registro propio; **sí** entra en el historial, como evento propio compuesto al leer |
| Resolución del ticket | Sin registro por evento: guarda solo la última (hipótesis, no releída) |
| Rellenos de datos y sincronización de Zoho | Sin registro por evento, fuera de este cambio |
| Borrado de administrador | Sin fila; dueño Gerencia |

El historial **MUST NOT** incorporar ninguno de los tres registros propios que no entran (`prioridad_ajustes`,
`ov_asociaciones`, `equipos_cambios`).

#### Scenario: Un ajuste de prioridad no aparece en el historial
- GIVEN un ticket con un ajuste en `prioridad_ajustes`
- WHEN se abre su historial
- THEN ningún evento procede de ese registro

#### Scenario: Una reasignación sí aparece en el historial — ROJO
- GIVEN un ticket con una fila en `public.reasignaciones` y otro ajuste en `prioridad_ajustes`
- WHEN se abre su historial
- THEN hay un evento procedente de la reasignación y ninguno procedente del ajuste de prioridad

### RQ-TZ-06 · La historia es una sola línea de tiempo, no un fallback

`getHistorialTicket` **SHALL** combinar las **cuatro** fuentes en una sola línea de tiempo ordenada de
más reciente a más antigua, y **MUST NOT** elegir una de ellas
(`apps/desk/server/db/historial.ts:131-161`, con la unión en `:157` y el orden en `:123-124`):

| Fuente | De dónde | Línea |
|---|---|---|
| Historial de Zoho | `ticket_history` | `historial.ts:132` |
| Transiciones de la app y la creación, más la línea de traspaso derivada de cada transición (RQ-TZ-18) | `ticket_transitions` | `:136-144` |
| Remisiones: creación, desenlace, anulación y restauración | `remisiones` | `:149-155` |
| Reasignaciones de la persona a cargo (RQ-TZ-20) | `reasignaciones` | `apps/desk/server/db/eventoReasignacion.ts`, fichero de F1B-05 |

- Las tres primeras fuentes **SHALL** derivarse al leer y **MUST NOT** registrar eventos nuevos en tabla propia: eso es lo que hace que aparezca
  sola la historia ya existente, las 149 remisiones migradas incluidas
  (`historial.ts:126-129`; `design unificada:32`). La restauración se deriva de las columnas de la remisión (RQ-TZ-14),
  y el traspaso de la fila de la transición (RQ-TZ-18). La cuarta es la excepción declarada: la reasignación **sí**
  guarda registro propio, porque no hay fila de transición de la que derivarla, y su evento se compone al leer esa
  tabla (RQ-TZ-17, RQ-TZ-20).
- La consulta de remisiones **MUST** ser propia y **MUST NOT** reutilizar
  `listRemisionesByTicket`: aquélla filtra `anulada_at IS NULL` porque el panel del ticket sólo enseña
  lo vigente, y aquí hacen falta justo las anuladas — «el historial registra lo que PASÓ, y una
  remisión anulada pasó (y su anulación también)» (`historial.ts:146-148`).

> **Given** un ticket que vino de Zoho y luego se movió en la app
> **When** se abre su pestaña de Historia
> **Then** se ven las dos cosas: los eventos de Zoho y las transiciones de la app.
> *(Con el `else` del diseño original se veían sólo las de Zoho — era el más grave de los tres fallos
> que la historia unificada vino a arreglar, `design unificada:19-23`.)*

(Previously: la fuente de remisiones listaba creación, desenlace y anulación; la restauración borraba la anulación sin
rastro, y el traspaso no tenía línea propia. Antes de F1B-05 las fuentes eran tres y ninguna guardaba registro propio.)

#### Scenario: Zoho y app conviven en la misma línea de tiempo
- GIVEN un ticket de Zoho movido después en la app
- WHEN se abre su historial
- THEN aparecen los eventos de Zoho y los de la app, ordenados del más reciente al más antiguo

#### Scenario: La remisión anulada y restaurada sigue en la historia
- GIVEN una remisión anulada y restaurada
- WHEN se abre el historial
- THEN aparecen su creación, su anulación y su restauración, aunque ya no figure anulada

#### Scenario: La reasignación entra en la misma línea de tiempo — ROJO
- GIVEN un ticket con una transición de la app y, después, una reasignación
- WHEN se abre su historial
- THEN aparecen los dos eventos, la reasignación antes que la transición, en el orden de más reciente a más antiguo


## ADDED Requirements

### RQ-TZ-20 · La reasignación se guarda en `public.reasignaciones` y se lee como evento propio del historial

Reasignar la persona a cargo (`tickets-core` RQ-TC-50) **SHALL** dejar una fila en la tabla nueva
`public.reasignaciones`, **no** en `ticket_transitions`. La fila **SHALL** llevar: identificador, `ticket_id`, `de` (id
de la persona anterior; **nulo** si el ticket no tenía a nadie), `a` (id de la persona nueva, obligatorio), `motivo`,
`reasignado_por` (nombre del actor, texto) y `reasignado_at`. `de` y `a` se guardan **por id** y se traducen al leer, con el
mismo criterio de RQ-TZ-08; el actor se guarda **por nombre**, como `performed_by` (SUPUESTO S-1, reversible).

- La sentencia `CREATE TABLE` **SHALL** llevar el esquema calificado (`public.`) y **SHALL** ir al **final** de
  `packages/zoho-sync/src/db/schema.sql`, con el patrón de `public.prioridad_ajustes`: `id` autonumérico, **sin claves
  foráneas** y un índice por `ticket_id`. `motivo` **SHALL** llevar `CHECK (motivo <> '')`: la base rechaza un motivo vacío
  aunque la ruta lo deje pasar. La tabla **SHALL** declararse en `PUBLIC_TABLES` de `packages/zoho-sync/src/db/migrate.ts`
  y la cubren los guardianes de `migrate.test.ts` (un `CREATE` sin `public.` los pone en rojo).
- **Por qué no es una fila de `ticket_transitions`** (con `to_status` igual al estado actual): esa fila reiniciaría el reloj
  de la alarma (RQ-AV-16), haría que `primerDerivado` (RQ-AV-03) devolviera una reasignación como «quien tomó el ticket»,
  saldría en el historial dos veces (como «Transición» y como línea de traspaso) y rompería el inventario exacto de
  escritores de RQ-TZ-16. Nada de eso es admisible: la reasignación **MUST NOT** escribir en `ticket_transitions`.
- **Lectura.** El historial **SHALL** componer, al leer, un evento por cada fila de `public.reasignaciones` del ticket, con
  la hora de `reasignado_at`, un título que nombra origen y destino ya resueltos por nombre, y los detalles **De**, **A**,
  **Motivo** y **Reasignado por**. Si `de` es nulo, **De** **SHALL** leerse «Sin derivar». Un id de `de` o `a` que no
  resuelve **SHALL** enseñarse crudo, sin «desconocido» (el criterio de RQ-TZ-18, S-5). El evento **MUST NOT** pasar por la
  línea de traspaso de RQ-TZ-18 ni por «Transición»: es un evento de otro origen, y RQ-TZ-18 sigue derivando su línea sólo
  de las transiciones. Abrir el historial **MUST NOT** insertar ni actualizar ninguna fila.
- **Lo que la traza NO toca** (criterios 2 a 4 de la propuesta): `ticket_transitions`, la entrada vigente del estado que
  lee la alarma y `primerDerivado` quedan **idénticos** antes y después de reasignar.
- **Atomicidad:** el alta de la fila y el cambio de `tickets.derivado_a` van en la misma transacción
  (`tickets-core` RQ-TC-51).

#### Scenario: la fila queda con origen, destino, motivo recortado, actor y fecha — ROJO
- GIVEN un ticket a cargo de «Ana»
- WHEN «Carla» lo reasigna a «Beto» con motivo «  Ana sale de vacaciones  »
- THEN `public.reasignaciones` tiene una fila con `de` = id de Ana, `a` = id de Beto, motivo «Ana sale de vacaciones», `reasignado_por` «Carla» y `reasignado_at` con el instante de la acción

#### Scenario: el historial enseña el evento con De, A, Motivo y Reasignado por — ROJO
- GIVEN una reasignación de Ana a Beto, con motivo «Ana sale de vacaciones», hecha por Carla a las 10:00
- WHEN se abre el historial del ticket
- THEN hay un evento a las 10:00 cuyo título nombra a Ana y a Beto, con detalles De «Ana», A «Beto», Motivo «Ana sale de vacaciones» y Reasignado por «Carla»

#### Scenario: origen nulo se lee «Sin derivar» — ROJO
- GIVEN un ticket sin persona a cargo reasignado a «Beto»
- WHEN se abre el historial
- THEN el detalle De del evento dice «Sin derivar»

#### Scenario: id que no resuelve se enseña crudo — ROJO
- GIVEN una fila cuyo `de` es un id que ya no está entre las personas
- WHEN se abre el historial
- THEN el detalle De enseña el id crudo, sin «desconocido»

#### Scenario: la reasignación no escribe en `ticket_transitions` — ROJO
- GIVEN un ticket con N filas en `ticket_transitions`
- WHEN se reasigna
- THEN siguen siendo N y el inventario exacto de escritores de RQ-TZ-16 no cambia

#### Scenario: el reloj de la alarma y `primerDerivado` no se mueven — ROJO
- GIVEN un ticket con su entrada vigente del estado y su `primerDerivado`
- WHEN se reasigna
- THEN la entrada vigente que lee la alarma y el resultado de `primerDerivado` son los mismos que antes

#### Scenario: la reasignación no genera además una línea de traspaso — ROJO
- GIVEN un ticket con una reasignación y ninguna transición posterior a ella
- WHEN se abre el historial
- THEN la reasignación aparece una sola vez, como evento propio, y ninguna línea de traspaso procede de ella

#### Scenario: la base rechaza un motivo vacío — ROJO
- GIVEN un `INSERT` directo en `public.reasignaciones` con motivo vacío
- WHEN se ejecuta
- THEN la base lo rechaza por el `CHECK`

#### Scenario: el esquema califica la tabla y va al final — ROJO
- GIVEN el fichero `packages/zoho-sync/src/db/schema.sql` con el `CREATE TABLE` de la tabla sin `public.`
- WHEN corre el guardián de `migrate.test.ts`
- THEN falla; y con el `CREATE` calificado y al final del fichero, pasa

#### Scenario: abrir el historial no escribe — CARACTERIZACIÓN
- GIVEN un ticket con reasignaciones
- WHEN se abre su historial dos veces
- THEN no se inserta ni actualiza ninguna fila
