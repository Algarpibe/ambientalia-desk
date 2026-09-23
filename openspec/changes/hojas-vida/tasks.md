# Tasks: Hoja de vida — seis campos comerciales (F1B-02)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420 (código+pruebas), rango 380-480 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | PR único (contingencia: servidor primero, `.tsx` después) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Presupuesto de sesión: 800 (`config.yaml:25-30`), no 400. El estimado deja ~380 de margen, pero
`proposal.md` ya marca el sobrecoste de verify/archive como riesgo "Media" contra ese mismo 800
(regla del ciclo 2: precedentes de 110-358 líneas por informe). Confirmar antes de `sdd-apply`;
corte de contingencia si hiciera falta: servidor (esquema→routes→pruebas) primero, `.tsx` después.

## Phase 1: Esquema

- [x] 1.1 `packages/zoho-sync/src/db/schema.sql`, al final (tras `:448`): seis `ALTER TABLE equipos
      ADD COLUMN IF NOT EXISTS` (fecha_adquisicion, fecha_factura_compra, fin_garantia,
      codigo_interno, mantenedor_id, drive_url); comentario sin `;`.

## Phase 2: Tipos

- [x] 2.1 `packages/zoho-sync/src/books/repo.ts:94` — exportar `fechaSolo`.
- [x] 2.2 `packages/shared/src/types.ts` — `EquipoLite` (`:329`) + `codigoInterno?`; `EquipoFull`
      (`:350`) + `fechaAdquisicion?`, `fechaFacturaCompra?`, `finGarantia?`, `mantenedorId?`,
      `mantenedorNombre?`, `driveUrl?`.

## Phase 3: `db/equipos.ts`

- [x] 3.1 `EquipoInput` (`:85`): seis campos `string | null` opcionales.
- [x] 3.2 `createEquipo`: INSERT con las seis columnas.
- [x] 3.3 `updateEquipo`: seis `add(...)` condicionales.
- [x] 3.4 `toLite`/`toFull`: mapear `codigoInterno` y los otros cinco (fechas vía `fechaSolo`).
- [x] 3.5 `getEquipoFull`/`listEquiposManage`: SELECT de las seis + `LEFT JOIN clients` →
      `mantenedor_nombre`.
- [x] 3.6 `searchEquipos`/`listEquiposManage`: `OR` por `codigo_interno`.

## Phase 4: `routes/equipos.ts`

- [x] 4.1 Helper `camposHojaDeVida(db, b)`: mantenedor (`getClient`) → tres fechas (`esFechaIso`)
      → Drive (`urlSegura`); vacío/`null` → `NULL`, `undefined` no toca.
- [x] 4.2 Llamada en POST (entre `:58`/`:59`), pasar `campos` a `createEquipo`.
- [x] 4.3 Llamada en PATCH (entre `:88`/`:89`), antes de `updateEquipo` **y** de `setEquipoActive`
      (`:90`).

## Phase 5: Pruebas de servidor (`equipos.test.ts`, nuevo `describe('Hoja de vida — F1B-02')`)

- [x] 5.1 [RQ-01] POST mínimo → 201, seis vacíos; PATCH `{active}` sigue. Muta: exigir campo nuevo.
- [x] 5.2 [RQ-01/02] POST con los seis → 201 + `mantenedorNombre`. Muta: quitar columna del INSERT.
- [x] 5.3 [RQ-02] PATCH sólo `codigoInterno` → resto intacto. Muta: `add` incondicional.
- [x] 5.4 [RQ-03] Fecha `2026/01/01` (POST) y `2026-02-30` (PATCH) → 422. Muta: quitar `esFechaIso`.
- [x] 5.5 [RQ-04] Drive `http://` → 422, no escrito. Muta: quitar la rama Drive.
- [x] 5.6 [RQ-04] Drive con comilla doble → 422. Muta: `startsWith` en vez de `urlSegura`.
- [x] 5.7 [RQ-05] Mantenedor inexistente → 422. Muta: saltar `getClient`.
- [x] 5.8 [mutación 1] PATCH `{codigoInterno, active:false, driveUrl:'http://x'}` → 422;
      `codigoInterno` sigue null y `active` sigue `true`. Muta: mover el helper tras `:89`/`:90`.
- [x] 5.9 [RQ-06] `INT-001`/`int-001` → mismo id que `SN-1`. Muta: quitar el `OR`.
- [x] 5.10 [RQ-07 servidor] `/historial` trae los seis; `driveUrl:''` → nulo. Muta: `toFull` no
      los mapea.

## Phase 6: Cliente (`.tsx`, fuera de la red de pruebas — F0-00)

- [ ] 6.1 `apps/desk/src/api/client.ts:301` — `EquipoInput` + seis opcionales.
- [ ] 6.2 `HojaDeVida.tsx`, tras `:161` — rejilla de seis pares etiqueta/valor (`'—'` si vacío,
      fechas tal cual, sin `fmtFecha`); botón «Ver en Google Drive» sólo si
      `urlSegura(eq.driveUrl)`, `target="_blank" rel="noopener noreferrer"`. [RQ-07] Verificación
      manual en staging.
- [ ] 6.3 `EquiposAdmin.tsx` (`EquipoForm`, `:95-227`) — tres `type="date"`, código interno, Drive,
      `SelectorMantenedor` local (`searchClients` + «Quitar»); payload `:148` manda los seis.
      [RQ-08] Verificación manual en staging.

## Phase 7: Cierre

- [ ] 7.1 Barrido de la regla de mutación 4 sobre los seis ficheros tocados (schema.sql,
      types.ts, db/equipos.ts, routes/equipos.ts, HojaDeVida.tsx, EquiposAdmin.tsx,
      equipos.test.ts).

## Fuera de esta tanda

Carga retroactiva del parque (persona), guarda del mantenedor sobre la OV (F1B-11), E-028
(desplazamiento UTC) — registrados, no son tareas de F1B-02.
