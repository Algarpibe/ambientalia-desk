# Delta de `trazas` — `tipo-evento-transicion` (F1C-04)

## ADDED Requirements

### Requirement: RQ-TZ-21 · El historial expone el tipo de evento de cada transición, derivado del catálogo al leer

Fuente: maestro M1.3 y M7.3 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1665`, `:3026`):
el tipo es propiedad de la transición, y los movimientos registrados antes de aplicarlo quedan clasificados igual.

El historial del ticket (`getHistorialTicket`, `apps/desk/server/db/historial.ts:131-162`) **SHALL** llevar en cada evento de
transición (`eventoTransicion`, `apps/desk/server/db/historial.ts:49-61`) el campo `tipoEvento`, resuelto con
`tipoEventoDeTransicion` (`transitions-st` RQ-TS-45) **a partir del `transition_id` de la fila**
(`apps/desk/server/db/historial.ts:137`) y de **ninguna otra fuente**: **MUST NOT** leerse de `values`, que recibe casi
entero el cuerpo de la petición, ni del cuerpo. `HistoryEvent` (`packages/shared/src/types.ts:611`) **SHALL** declararlo
opcional, `tipoEvento?: TipoEvento | null`, de modo que los eventos de otro origen no lo llevan.

- Un `transition_id` que no está en ningún catálogo ni entre los pasos del servidor (marcadores de migración, ids retirados)
  **SHALL** dar `tipoEvento` = `null`.
- El evento de creación (`eventoCreacion`) **SHALL NOT** llevar tipo.
- El tipo **SHALL NOT** guardarse en `ticket_transitions`: sin columna y sin migración. Se deriva al leer, de modo que una
  fila escrita antes de este cambio queda clasificada **igual** que una nueva, y corregir un tipo en el catálogo reclasifica
  el historial entero (supuesto S-6, reversible).
- Abrir el historial **MUST NOT** insertar ni actualizar ninguna fila, y no cambia ningún otro campo del evento.
- Ninguna pantalla pinta el tipo en esta tanda.

#### Scenario: una fila de `aprobacion` sale con tipo Decisional — ROJO
- GIVEN una fila de `ticket_transitions` con `transition_id` = `aprobacion`
- WHEN se abre el historial del ticket
- THEN su evento de transición lleva `tipoEvento` = Decisional

#### Scenario: un `tipoEvento` falso en `values` se ignora — ROJO (mutación M4)
- GIVEN una fila de `aprobacion` cuyo `values` trae `tipoEvento: 'Administrativo'`
- WHEN se abre el historial
- THEN el evento sigue llevando `tipoEvento` = Decisional, y el detalle de `values` no altera el campo

#### Scenario: un marcador de migración no tiene tipo — ROJO
- GIVEN una fila con `transition_id` = `migracion_f1c09_pendiente` (o `migracion_f1f01_abiertos`)
- WHEN se abre el historial
- THEN su evento lleva `tipoEvento` = `null`

#### Scenario: la fila anterior al cambio se clasifica igual que una nueva — ROJO
- GIVEN dos filas con el mismo `transition_id` y sin ningún dato adicional, una escrita antes de este cambio y otra después
- WHEN se abre el historial
- THEN las dos llevan el mismo `tipoEvento`

#### Scenario: la creación no lleva tipo — ROJO
- GIVEN la fila de creación del ticket
- WHEN se abre el historial
- THEN su evento no lleva `tipoEvento`
