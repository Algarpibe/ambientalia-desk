# Delta for `derivacion-avisos`

Cambio `parche-iv11-orden-venta` (F1B-11, `cierra: no`). Nueva clase de aviso: discrepancia de orden
de venta detectada por el sincronizador contra una fila protegida (`zoho-sync` RQ-ZS-01 modificado),
con regla anti-ruido y restringida al proceso de la aplicación.

## ADDED Requirements

### Requirement: RQ-AV-13 · Aviso de discrepancia de orden de venta detectada por el sincronizador

El sistema **SHALL** crear un aviso a área Comercial cuando, para un ticket con la marca de fila
`ov_elegida_en_app_at` puesta, el sincronizador reciba de Zoho un valor de `orden_venta` distinto al
que la aplicación tiene guardado y protegido (`zoho-sync` RQ-ZS-01 modificado).

- El aviso **SHALL** entregarse vía `crearAviso` (`apps/desk/server/db/avisos.ts:8-18`) a cada
  destinatario de `destinatariosDeArea(db, 'Comercial', actorId)` (`:74-93`), uno por destinatario y
  por ticket.
- El texto **SHALL** nombrar las dos órdenes de venta: la que trae Zoho en esa pasada y la que la
  aplicación tiene guardada.
- **Regla anti-ruido:** mientras el valor que trae Zoho en pasadas sucesivas siga siendo el mismo que
  ya generó aviso para ese ticket, el sistema **MUST NOT** crear un segundo aviso. Un valor de Zoho
  nuevo, distinto del último avisado, **SHALL** generar un aviso nuevo.
- Un valor de Zoho vacío o nulo **MUST NOT** contarse como discrepancia (**supuesto S-2**): sin
  write-back hacia Zoho, la orden vacía del lado de Zoho es el caso normal, no un conflicto.
- El aviso **SHALL** ser sólo de bandeja (**supuesto S-3**): **MUST NOT** disparar el canal de correo
  de esta capacidad (RQ-AV-09), y `enviado_at` **SHALL** quedar `NULL`.
- El aviso **SHALL** originarse únicamente desde el proceso `ambientalia-desk`, a través de la
  devolución opcional que `createSync` (`packages/zoho-sync/src/sync.ts:62`) expone y que sólo ese
  proceso cablea (`apps/desk/server/index.ts:21-23`). El proceso `apps/hub-sync` **MUST NOT** crear
  este aviso: no cablea esa devolución.

#### Scenario: Primera discrepancia genera un aviso
- GIVEN un ticket con la marca puesta y `orden_venta = "OV-100"` en la aplicación
- WHEN el sincronizador recibe de Zoho `orden_venta = "OV-200"` para ese ticket
- THEN se crea un aviso a cada destinatario de área Comercial, nombrando OV-200 (Zoho) y OV-100
  (aplicación)

#### Scenario: Una segunda pasada con el mismo valor de Zoho no repite el aviso
- GIVEN el aviso del escenario anterior ya creado
- WHEN el sincronizador vuelve a recibir `orden_venta = "OV-200"` en la siguiente pasada
- THEN no se crea ningún aviso nuevo para ese ticket

#### Scenario: Un valor de Zoho distinto genera un aviso nuevo
- GIVEN el ticket del escenario anterior, ya avisado por "OV-200"
- WHEN el sincronizador recibe `orden_venta = "OV-300"`
- THEN se crea un aviso nuevo, nombrando OV-300 y OV-100

#### Scenario: Zoho vacío no es discrepancia
- GIVEN un ticket con la marca puesta y `orden_venta` protegida en la aplicación
- WHEN el sincronizador recibe de Zoho un `orden_venta` vacío o nulo
- THEN no se crea ningún aviso

#### Scenario: El aviso no dispara correo
- GIVEN cualquier discrepancia detectada bajo este requisito
- WHEN se crea el aviso
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de RQ-AV-09

#### Scenario: El worker del hub nunca crea este aviso
- GIVEN una discrepancia que la instancia de `createSync` dentro de `apps/hub-sync` detecta en su
  propia pasada
- WHEN esa pasada procesa el ticket
- THEN no se crea ningún aviso — sólo el proceso `ambientalia-desk` está cableado para emitirlo

## Fuera de alcance de este delta

- **Cambio 2 de F1B-11** — asociación OV↔ticket 1:N propia de la aplicación y subOV de lote. Sin
  relación con este aviso.
- **Cambio 3 de F1B-11** — registro de contrato y prioridad, que cierra la fila del plan
  (`cierra: si`). No cubierto por este delta.
- El espejo de Zoho (E-018, alcance condicional): cuando exista, esta misma información se mostrará
  allí y el aviso podrá retirarse — no es parte de este cambio.
