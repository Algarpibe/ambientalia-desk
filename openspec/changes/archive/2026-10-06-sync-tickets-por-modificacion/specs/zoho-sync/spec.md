# Delta para `zoho-sync`

## ADDED Requirements

### RQ-ZS-22 · El incremental de tickets se guía por la fecha de modificación, con marca de agua y caída explícita

El incremental de tickets (`syncRecent`) **SHALL** traer de Zoho los tickets modificados desde una marca de agua, por la
búsqueda de tickets con rango de fecha de modificación, en orden **ascendente** por fecha de modificación y paginado hasta
agotar. Un cierre o un cambio de estado hecho en Zoho sin conversación nueva **MUST** llegar a la réplica en el ciclo
siguiente, aunque el ticket haya salido de la ventana de los 100 con actividad de conversación más reciente.

**Marca de agua.** Es el máximo de `modified_time` de los tickets de origen Zoho de la réplica, **excluyendo** los nacidos
en la App (prefijo `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`) y las filas con
`managed_by_app = true`, **menos un solape de 15 minutos**. La exclusión es obligatoria: la App escribe `modified_time`
con su propio reloj (`packages/zoho-sync/src/db/repo.ts:298`, `apps/desk/server/db/prioridadCliente.ts:93`) y una
transición hecha en la App **MUST NOT** adelantar la marca por encima de cambios de Zoho aún sin traer.

**Orden ascendente.** Lo persistido en un ciclo **MUST** ser un prefijo de lo pendiente: si se alcanza el tope de
paginación de la búsqueda o falla una página intermedia, la marca avanza hasta lo persistido y el ciclo siguiente
continúa desde ahí, sin hueco.

**Sin marca de agua.** Si la réplica no tiene tickets o ninguno es elegible, el ciclo **MUST** conservar el
comportamiento anterior: la primera página por conversación reciente (`-recentThread`). La carga inicial sigue siendo
de `backfillTickets`.

**Fallo de la búsqueda.** Si la búsqueda responde no-OK (o lanza), la App **MUST** escribir en el log un error explícito
que nombre la búsqueda y el código de estado, y **ese ciclo MUST** caer al comportamiento anterior. El ciclo **MUST NOT**
lanzar por ello.

**Lo que no cambia.** La guarda de `upsertTicket` sobre filas gestionadas por la App (`packages/zoho-sync/src/db/repo.ts:71`)
**MUST** seguir igual: el incremental por modificación no reescribe lo que la guarda protege. Un ticket que falla al
persistir **MUST NOT** abortar el lote (ya es así, `persistEach`, `packages/zoho-sync/src/sync.ts:126-136`).

**Datos completos.** Ninguna columna que hoy se puebla desde el detalle del ticket (`customFields`, `description`,
`closedTime`, `onholdTime`; `packages/zoho-sync/src/db/mappers.ts:43-57`) **MUST** quedar vaciada por venir de la
búsqueda. Si la respuesta de búsqueda no las trae, el diseño decide si relee el detalle o persiste otra forma; la
especificación sólo exige el resultado.

#### Scenario: Cierre en Zoho sin conversación nueva, fuera de la ventana de 100
- GIVEN una réplica con el ticket T abierto y `modified_time` M
- AND Zoho tiene T cerrado con `modifiedTime` > M, sin hilo nuevo, y más de 100 tickets con conversación más reciente
- WHEN corre el incremental de tickets
- THEN la búsqueda se pide con rango de modificación desde M menos 15 minutos
- AND la réplica queda con T en estado cerrado y su `closed_time` poblado

#### Scenario: Más de una página de modificados
- GIVEN más modificados que el tamaño de una página de la búsqueda
- WHEN corre el incremental
- THEN se piden páginas sucesivas en orden ascendente por `modifiedTime` hasta agotar
- AND todos quedan persistidos

#### Scenario: Tope de paginación alcanzado
- GIVEN más modificados de los que la búsqueda permite recorrer en un ciclo
- WHEN corre el incremental
- THEN se persiste el prefijo más antiguo
- AND el ciclo siguiente parte de una marca que no deja fuera a ninguno de los pendientes

#### Scenario: Una transición hecha en la App no adelanta la marca
- GIVEN una fila con `managed_by_app = true` y `modified_time` posterior al de todas las filas de origen Zoho
- WHEN se calcula la marca de agua
- THEN la marca ignora esa fila
- AND vale el máximo `modified_time` de las filas elegibles menos 15 minutos

#### Scenario: Un ticket nacido en la App no cuenta para la marca
- GIVEN una fila cuyo identificador lleva el prefijo `PREFIJO_TICKET_APP` y el `modified_time` más alto
- WHEN se calcula la marca de agua
- THEN esa fila se excluye

#### Scenario: Réplica vacía o sin filas elegibles
- GIVEN una réplica sin tickets, o cuyos tickets son todos nacidos en la App o con `managed_by_app = true`
- WHEN corre el incremental
- THEN no se llama a la búsqueda por modificación
- AND se pide la primera página por `-recentThread`, como antes

#### Scenario: La búsqueda responde no-OK
- GIVEN una marca de agua válida y una búsqueda que responde con un código distinto de OK
- WHEN corre el incremental
- THEN el log recibe un error que nombra la búsqueda y el código de estado
- AND ese ciclo pide la primera página por `-recentThread`
- AND el ciclo no lanza

#### Scenario: Un ticket falla al persistir
- GIVEN un lote de modificados donde uno falla al persistir
- WHEN corre el incremental
- THEN el fallo se registra y el resto del lote se persiste

#### Scenario: Fila gestionada por la App
- GIVEN Zoho devuelve como modificado un ticket cuya fila tiene `managed_by_app = true`
- WHEN el incremental lo persiste
- THEN `upsertTicket` se abstiene como hoy y la fila no cambia

#### Scenario: Ninguna columna promovida se vacía
- GIVEN un ticket con `customFields`, `description`, `closedTime` y `onholdTime` poblados en la réplica
- AND la respuesta de la búsqueda lo trae sin alguno de esos campos
- WHEN el incremental lo persiste
- THEN esas columnas conservan sus valores del detalle del ticket
