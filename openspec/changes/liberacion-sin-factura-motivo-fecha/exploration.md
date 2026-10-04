# Exploración — `liberacion-sin-factura-motivo-fecha`

Volcado de la exploración guardada en Engram (`sdd/liberacion-sin-factura-motivo-fecha/explore`, obs. 1345),
que el agente de exploración no pudo escribir en fichero. **Cada cita se ha vuelto a leer contra el worktree
(rama nacida de `2a74fdc`) el 2026-10-04 antes de copiarla**; lo que no se pudo releer lleva la palabra
«hipótesis», y las correcciones a la exploración original van marcadas con **[corregido]**.

## 1 · Estado actual

- **La transición.** `packages/shared/src/transitions.ts:246-247`: `liberacion_sin_factura`, de `Por Facturar`
  a `Por Entregar / Sin facturar`, área `Comercial`, con `comment()` y la casilla obligatoria. Es el **único**
  `checkbox` obligatorio de `packages/shared/src` (un barrido de `cfCheck(…, true)` da sólo esa línea). La
  casilla de derivación se añade a todas en `transitions.ts:295-298`.
- **Tipos de campo.** `transitions.ts:14` ya declara `select` y `date`; `transitions.ts:26` ya declara
  `options`.
- **Lo que el servidor valida hoy de un campo.** `apps/desk/server/transitionExec.ts:76-77` sólo comprueba
  presencia. Un `date` se recorta con `slice(0, 10)` sin validar (`transitionExec.ts:33`). **No existe
  ninguna comprobación de `options`** para un `select` de `customField`: en el servidor, el único lector de
  `kind === 'select'` es el arnés de pruebas (`apps/desk/server/testing/appHarness.ts:78`).
- **La única validación de fecha real** es `esFechaCalendarioReal`
  (`packages/shared/src/fechasDerivadas.ts:37`), **no exportada**, que sólo usa `valoresEfectivos`
  (`fechasDerivadas.ts:129`) para las tres fechas derivadas.
- **Orden de guardas** en `executeTransition` (`apps/desk/server/services/ticketService.ts`): `400` (`:123`),
  `404` y flujo (`:125`), `409` de estado (`:126-128`), `403` de área (`:129-130`), `403` de cargo y resto
  del escalón B (`:131`), `422` agregado del escalón C (`:134`), `422` de persona derivada (`:138-142`),
  `422` de contrato vencido (`:147`), `409` de orden de venta (`:148-152`).
- **Cargo.** `packages/shared/src/cargos.ts:24` nombra la transición; la impone `ticketService.ts:131`
  (`cargoQueFaltaParaTransicion`). Requisito vivo: `openspec/specs/permissions/spec.md:389` (RQ-PM-17).
- **Persistencia.** Etiqueta en `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:85-132`) → columna;
  si no → `tickets.custom_fields` (`transitionExec.ts:90-92`, `packages/zoho-sync/src/db/repo.ts:307-310`).
  Todos los valores van además a `ticket_transitions.values` (`repo.ts:314-318`). `writeTransition` pone
  `managed_by_app=true` (`repo.ts:298`) y `upsertTicket` sale entero si la fila está gestionada
  (`repo.ts:71`). Molde de columna propia fuera de `TICKET_COLS`: `fecha_aviso_cliente` (`rows.ts:125`,
  guarda en `packages/zoho-sync/src/db/repo.test.ts:279-288`).
- **Cliente.** `apps/desk/src/components/TransitionPanel.tsx:253-263` ya pinta `date`, `select` y texto;
  el asterisco sale de `f.required` (`TransitionPanel.tsx:209`).
- **La trampa de la re-liberación.** `yaLoTraeElTicket` (`TransitionPanel.tsx:32-36`) bloquea y prellena
  (`TransitionPanel.tsx:80`) todo `customField` que el ticket ya traiga, salvo los `checkbox`. El ciclo
  `Por Facturar` ⇄ `Por Entregar / Sin facturar` existe (`transitions.ts:246-249`), así que en una segunda
  liberación el motivo y la fecha saldrían bloqueados con el valor viejo. **[corregido]** Afecta también al
  texto aunque se guarde en el `jsonb`: `customFieldsFromRow`
  (`packages/zoho-sync/src/db/mappers.ts:222-232`) mezcla `custom_fields` y columnas promovidas.

## 2 · La decisión

`openspec/config.yaml:2373-2388`, clave `decision/anexo-33-checkbox`; el texto literal está en la línea 2378
de ese fichero y se copia entero en la propuesta. La partición antes/después del corte es E-102
(`docs/sdd/ENTRADA.md:1378-1382`) y la fila del plan es
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:103`.

## 3 · Enfoques

| | Qué | Juicio |
|---|---|---|
| A | Motivo, fecha y texto al `jsonb` `custom_fields`; cero esquema | Más barato, pero F1C-02 tendría que leer una fecha guardada como texto y migrarla después |
| **B** | Motivo y fecha en columnas propias de `tickets`, fuera de `TICKET_COLS`; el texto al `jsonb` y a la traza | **Recomendado**: E-102 pide que la fecha registrada desde el corte sirva a la alarma de F1C-02 |
| C | Conservar la casilla y añadir campos | Contradice la letra («Deja de ser un checkbox») |

Molde de la guarda: módulo nuevo en `packages/shared/src`, con el mismo patrón que `erroresCertificado`
(`packages/shared/src/gasPatron.ts:82-86`): campo opcional en el catálogo y exigencia condicional en el
servidor, escalón C, cableado en la línea del `422` agregado (`ticketService.ts:134`).

## 4 · Pruebas que cambian (releídas)

- `apps/desk/server/transicionesEjecucion.test.ts:41-103` — el bloque C1 de la casilla.
- `packages/shared/src/reentrancia.test.ts:43-52` (C1, una sola reentrante), `:83-85` (nueve casos) y
  `:92-100` (diez campos, ocho obligatorios). **[corregido]** los rangos de la exploración acababan una
  línea antes.
- `packages/shared/src/invariantesGrafo.test.ts:137-150` — invariante 6, la lista de diez.
- `packages/shared/src/bodegaje.test.ts:113` — longitud diez.
- `packages/shared/src/prioridad.test.ts:106` y `:118-123` — el literal de obligatorios.
- `packages/zoho-sync/src/db/migrate.test.ts:374-386` — recuento 50 / 27 / 23.
- `packages/zoho-sync/src/db/mappers.test.ts:119` — fila completa de `TicketRow`.

No cambian: el mapa del blueprint (`scripts/generar-mapa-blueprint.ts:15` y `:29` sólo pasan `TRANSITIONS`;
el script no lee `fields`) y las matrices de permisos, que derivan valores del arnés
(`appHarness.ts:71-84`: `select` → primera opción, `date` → `2026-01-15`).

## 5 · Citas que afirman la casilla en la línea 247

Barrido `transitions\.ts:24[67]` fuera de `openspec/changes/archive/`: `apps/desk/server/transitionExec.ts:73`,
`apps/desk/server/transicionesEjecucion.test.ts:13`, `debt.md:652`,
`openspec/specs/transitions-st/spec.md:918` en `ce4fead`; y sobre la línea 246 (el id y el área, que no cambian)
`openspec/specs/permissions/spec.md:518` en `ce4fead` y `openspec/specs/transitions-equipo-nuevo/spec.md:118` y `:516`.
**[corregido]** La exploración no listó los documentos fechados que también casan:
`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:743` y ocho líneas de `docs/sdd/F0-00_Baseline_as-built.md`
(67, 69, 237, 238, 302, 481, 523 y 547; *hipótesis*: puede haber más en forma abreviada, que ese barrido
no caza).

## 6 · Lo que la exploración afirmó y no se ha releído (hipótesis)

- Que `fecha_aviso_cliente` esté en la línea 448 de `schema.sql`.
- El recuento global de citas a `transitions.ts` (656 en 185 ficheros; 274 con número ≥ 248).
- Que `guardaPrioridad` valide las opciones de `priority`.
