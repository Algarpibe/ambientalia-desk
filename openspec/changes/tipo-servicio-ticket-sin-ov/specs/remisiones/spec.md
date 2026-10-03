# Delta para remisiones — noción única de «remisión de entrada vigente» (F1B-03, parte L, lote 1)

## ADDED Requirements

### RQ-RE-20 · «Remisión de entrada vigente» tiene una sola definición, y una prueba afirma en qué diverge del recuento de `Remisión creada`

El repositorio **SHALL** tener **una** definición de «remisión de entrada vigente», y la guarda de `habilitar_servicio`
(`transitions-st` RQ-TS-33) y el cliente **SHALL** consumirla. Hoy hay varias nociones vecinas (molde H5, ninguna rota por
separado):

| Noción | Dónde | `anulada_at IS NULL` | `estado` | `tipo` |
|---|---|---|---|---|
| Pendiente de una remisión nueva | `apps/desk/server/db/remisiones.ts:67-73` | sí | sólo `pendiente` | no filtra |
| Remisiones del panel del ticket | `apps/desk/server/db/remisiones.ts:76-79` | sí | cualquiera | no filtra |
| Recuento que mueve `Remisión creada` | `apps/desk/server/db/estadoPorRemision.ts:43-47` | sí | `ok` u `ok_con_avisos` | no filtra |
| `vigentes` del botón de remisión (cliente) | `apps/desk/src/lib/botonRemision.ts:33` | sí | cualquiera | `entrada` |

**La definición (a la letra de Gerencia; no es un supuesto):** `tipo = 'entrada'` y `anulada_at IS NULL` —creada y no
anulada—, **sea cual sea su estado de envío** (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`;
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). **SHALL** vivir como predicado puro
en `packages/shared`, y la cuarta noción de la tabla **SHALL** pasar a consumirlo (es la misma condición). Las dos
primeras **MUST NOT** cambiar de comportamiento: cumplen otro oficio (la unicidad de una remisión en curso, RQ-RE-06; el
listado del panel), y `estadoPorRemision.ts` **MUST NOT** reescribirse (su recuento mueve el estado del ticket).

**«Confirmada» es otra noción, y no entra en la guarda.** Que una remisión esté en `ok` u `ok_con_avisos` decide el
estado `Remisión creada` (RQ-RE-11; `transitions-st` RQ-TS-03) y, en el cliente, el aviso no bloqueante de «remisión sin
confirmar» y que no se ofrezca crear otra (`apps/desk/src/lib/botonRemision.ts:39`). El cliente **SHALL** tomarla de un
predicado de `packages/shared` y **MUST NOT** usarla para desactivar «Habilitar Servicio».

**La guarda y el recuento divergen A PROPÓSITO — consecuencia declarada, no defecto.** El recuento de
`sincronizarEstadoPorRemision` cuenta sólo las confirmadas y no filtra `tipo`; la guarda cuenta toda entrada no anulada.
Por tanto:

- **Divergencia en `estado`:** con una remisión de entrada no anulada en `pendiente` o en `error`, la guarda
  **SHALL** habilitar y el recuento **MUST NOT** pasar el ticket a `Remisión creada`. Un ticket puede así seguir en
  `Ticket creado` y habilitarse desde ahí.
- **Divergencia en `tipo`:** con una fila confirmada y no anulada de `tipo` distinto de `entrada`, la guarda **MUST NOT**
  habilitar y el recuento sí cuenta. Hoy no puede darse porque `createRemision` escribe siempre `'entrada'`
  (`apps/desk/server/db/remisiones.ts:44-53`), y llegará con la remisión de salida (F1B-17).

**Una prueba SHALL enfrentar la guarda y el recuento** recorriendo la misma tabla de filas —`pendiente`, `error`, `ok`,
`ok_con_avisos`, anulada, histórica `ok`, una segunda vigente tras una anulada, y una de `tipo` distinto— y **SHALL
afirmar el veredicto de cada una, fila a fila**, nombrando las dos divergencias. Si alguien alinea una noción con la otra
sin una decisión —filtra `estado` en el predicado, lo quita del recuento o filtra `tipo` en el recuento—, la prueba
**SHALL** ponerse roja.

#### Scenario: Guarda y recuento coinciden donde deben
- GIVEN un ticket con, por separado, una remisión de entrada `ok`, `ok_con_avisos`, histórica `ok`, anulada, y otra vigente tras una anulada
- WHEN se evalúan la guarda de `habilitar_servicio` y el recuento de `sincronizarEstadoPorRemision`
- THEN las dos dan el mismo veredicto en cada caso: cuentan las cuatro no anuladas y no cuenta la anulada

#### Scenario: La divergencia por `estado` está declarada y afirmada
- GIVEN un ticket en `Ticket creado` con una remisión de entrada no anulada en `pendiente` (y, por separado, en `error`)
- WHEN se evalúan la guarda y el recuento
- THEN la guarda habilita, el recuento no pasa el ticket a `Remisión creada`, y la prueba lo nombra como divergencia declarada; reintroducir el filtro de estado en el predicado, o quitarlo del recuento, la pone roja

#### Scenario: La divergencia por `tipo` está declarada y afirmada
- GIVEN una fila no anulada, en `ok`, con `tipo` distinto de `entrada`, insertada a mano
- WHEN se evalúan la guarda y el recuento
- THEN la guarda no la cuenta, el recuento sí, y la prueba lo nombra como divergencia declarada; filtrar `tipo` en el recuento la pone roja

#### Scenario: Una remisión pendiente sigue bloqueando la creación de otra
- GIVEN un ticket con una remisión `pendiente` no anulada
- WHEN se evalúa la noción de pendiente (`remisionPendienteDe`)
- THEN sigue devolviéndola —la unicidad de RQ-RE-06 no cambia—, y la guarda de «Habilitar Servicio» dice que **sí** hay una vigente

#### Scenario: El listado del panel no cambia
- GIVEN un ticket con remisiones de cualquier estado, algunas anuladas
- WHEN se lista con `listRemisionesByTicket`
- THEN devuelve las no anuladas de cualquier estado, como antes, y el cliente aplica el predicado compartido encima

#### Scenario: El cliente no redefine «vigente»
- GIVEN `apps/desk/src` y `packages/shared`
- WHEN se buscan condiciones sobre `anulada_at` o `tipo` de una remisión para decidir si «Habilitar Servicio» se puede pulsar, o sobre `estado` para decidir el aviso de «sin confirmar»
- THEN las dos salen de predicados de `packages/shared`, no hay copia de ninguna en el cliente, y el `estado` no interviene en desactivar el botón

## Fuera de alcance — para el `archive-report`

- La fusión de este requisito **no** modifica RQ-RE-11 (el recuento sigue siendo la fuente del estado `Remisión creada`).
- Alinear la guarda con el recuento, en cualquiera de los dos sentidos: pide una decisión.
- **Lote 3 (condicionado a Q1, E-157 de `docs/sdd/ENTRADA.md`):** si la OVI se restringe en la puerta de la remisión de
  entrada, entra en el mismo `if` de `apps/desk/server/routes/remision.ts:220`, sin mover las guardas vecinas (IV-12).
  Está en el borrador de `permissions`, no aquí; si no hay respuesta registrada al terminar el lote 2, ese borrador sale
  del cambio antes de archivar.
