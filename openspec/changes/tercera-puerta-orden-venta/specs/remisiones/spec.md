# Delta for remisiones

Contexto: `openspec/specs/remisiones/spec.md`. Cierra IV-4. `POST /api/remisiones` pasa a comprobar,
antes de escribir nada, que la orden de venta que llega no pertenezca ya a **otro** ticket. El
requisito es **NUEVO** (`RQ-RE-16`) y sube a `## 3 · Lo que la remisión mueve en el ticket`, porque deja
de ser un defecto "a corregir" para ser comportamiento decidido y construido. Por eso `### 5.1 · La
tercera puerta de la orden de venta: DECIDIDA, y se construye` (`:353-417`) se **retira**: sus dos
escenarios narraban el defecto y la decisión, no el comportamiento final, y se funden en los tres de
RQ-RE-16. Ningún otro requisito de `§§1-4` cambia de texto.

**Fuera de este delta, y por qué.** El caso (c) —OV libre + ticket con orden propia distinta, hoy
no-op silencioso con `201`— y la divergencia `orden_venta`/`salesorder_id` por sincronización (IV-11,
`config.yaml: incumplimientos_vivos`) quedan sin requisito a propósito: el segundo se cita en RQ-RE-16
sólo como razón de por qué las dos vías son obligatorias, no como algo que esta tanda corrija.
`tickets-core §4.2` tiene su propio párrafo y su propio escenario sobre IV-4, pero ese escenario
(`La cardinalidad OV↔ticket, resuelta en la misma dirección en las dos specs`) no cambia de texto: mi
requisito lo ejercita sin modificarlo, igual que `citas-verificables` con `RQ-CV-03`.

**CORRECCIÓN DEL CIERRE (2026-09-17).** Este párrafo decía que «`tickets-core` **no lleva delta**» y
que corregir la narrativa de su `§4.2` era trabajo de bitácora del cierre, no un requisito. **Es FALSO,
y lo fue desde el origen:** los DOS deltas nacieron en el MISMO commit (`b99d47a`), y el de
`tickets-core` reescribe esa narrativa como `MODIFIED Requirements` —incluida su línea `:405`, que
apuntaba a la `§5.1` que este delta retira—. Lo que sí sigue siendo cierto es el alcance: el escenario
`La cardinalidad OV↔ticket…` no cambia de texto. Se corrige aquí para no congelar la falsedad en el
`archive`.

## ADDED Requirements

### Requirement: RQ-RE-16 · La tercera puerta: una orden de venta no puede quedar en dos tickets

Antes de escribir `orden_venta`, `fecha_orden_venta` y `salesorder_id` sobre el ticket destino,
`POST /api/remisiones` **SHALL** comprobar contra `ticketConOrdenVenta(db, { salesorderId, numero },
ticketId)` (`packages/zoho-sync/src/db/repo.ts:330-347`) que la orden no pertenezca ya a otro ticket,
por las **dos vías** —`salesorder_id` y número— y **excluyendo el propio ticket destino**. La
comprobación **SHALL** ejecutarse dentro del bloque `if (b.salesOrderId)` de `remision.ts:218-240`,
**después** del `422` «Orden de venta no encontrada» (`:220`) y **antes** del `UPDATE` (`:235-239`).

Si la orden ya pertenece a otro ticket, la respuesta **SHALL** ser `409`, con el texto de
`ticketService.ts:135` («La orden de venta {ov} ya está asociada al ticket #{n}»), y **ninguna** de
las tres columnas **SHALL** quedar escrita. El `422` del serial (`remision.ts:152-157`) **SHALL**
seguir ganando al `409` nuevo, sin mover ninguna de las dos guardas. La condición
`WHERE ... COALESCE(orden_venta,'') = ''` (`:237`) **SHALL** mantenerse intacta: protege la carrera de
dos remisiones sobre el **mismo** ticket, una pregunta distinta de la que resuelve este requisito.

**Las dos vías son requisito, no preferencia.** La divergencia `orden_venta`/`salesorder_id` por
sincronización (IV-11, fuera de alcance) puede dejar a un ticket con sólo una de las dos columnas
vigente; comprobar sólo por número dejaría ese ticket sin protección.

**Tercer punto de captura legítimo.** La remisión de entrada **SHALL** contarse como el tercer punto
de captura de la orden de venta, junto con el alta del ticket (`tickets-core` RQ-TC-08) y
`habilitar_servicio` (`ticketService.ts:134-135`). La lista de
`docs/sdd/Decisiones_Gerencia_2026-09-10.md:156-164`, que sólo nombraba los dos primeros, quedó
incompleta por omisión de redacción, no por decisión (decisión 1 de la ronda de preguntas del
2026-09-16).

**Guarda transitoria.** Esta guarda **SHALL** retirarse el día en que la tabla propia con
`salesorder_id` como `PRIMARY KEY` (`Decisiones_Gerencia_2026-09-10.md:147-150`) sustituya a las tres
guardas de aplicación; retirar sólo ésta sin retirar las otras dos sería el defecto.

(Previously: dos escenarios sueltos en `§5.1 · Comportamiento actual, a corregir`, que narraban el
defecto sin corregir y la decisión pendiente de construir. Promovidos aquí porque IV-4 pasa de defecto
a comportamiento decidido y construido.)

#### Scenario: Una orden ya asociada a otro ticket se rechaza antes de escribir nada

- GIVEN una orden de venta ya asociada al ticket 7001
- WHEN se crea una remisión de entrada sobre otro ticket con esa misma orden
- THEN responde `409`, con el texto que nombra la orden y el ticket 7001
- AND ninguna de las tres columnas del ticket destino queda escrita

#### Scenario: El 422 del serial gana al 409 nuevo

- GIVEN un ticket destino sin serial —ni equipo con serial— y una orden ya asociada a otro ticket
- WHEN se crea la remisión de entrada
- THEN responde `422` «Falta el serial», no `409`
- AND ninguna de las tres columnas del destino queda escrita, y el ticket dueño de la orden sigue
      siendo el único

#### Scenario: Reenviar la misma orden al propio ticket no se rechaza a sí mismo

- GIVEN un ticket cuya orden de venta ya es la que llega en la remisión (reintento de red, doble clic)
- WHEN se crea la remisión de entrada
- THEN la comprobación excluye al propio ticket destino y no llega al `409`
- AND el `UPDATE` es no-op porque `orden_venta` ya no está vacía (`:237`), y la remisión se crea con
      `201`

## REMOVED Requirements

### 5.1 · La tercera puerta de la orden de venta: DECIDIDA, y se construye

*(Cita verbatim del encabezado real, sin el prefijo "Requirement:": la sección original no lo lleva.)*

(Reason: IV-4 deja de ser "comportamiento actual, a corregir" — la tercera puerta queda construida.
Su contenido y sus dos escenarios se funden en `RQ-RE-16`.)
(Migration: `Hoy, sin la tercera puerta, una OV puede duplicarse` y `Gerencia decidió, y el arreglo es
completar la tercera puerta` se sustituyen por los tres escenarios de `RQ-RE-16`. Toda cita a
`openspec/specs/remisiones/spec.md:353-416` en `67a90c1` debe re-anclarse en el `archive`, por la regla de mutación 4
de `CLAUDE.md`.)
