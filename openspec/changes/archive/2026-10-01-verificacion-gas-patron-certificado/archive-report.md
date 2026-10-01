# Archive Report — `verificacion-gas-patron-certificado` (F1A-03, `cierra: si`)

**Change**: verificacion-gas-patron-certificado  
**Archived to**: `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/`  
**Date**: 2026-10-01

## Summary

F1A-03 covered by this change:
- **Coverage**: Constructs the patrol gas guard (E3/E4) for `liberacion` from `En Proceso` when equipment has compound and patrol gas is vigent, and the factory certificate field (E5) in `Liberación`. The row is complete with E1/E2 from `salidas-verificacion` (F1A-02), leaving the three points open per plan.
- **Scope**:
  - ✅ List of compounds and canonical form in `packages/shared/src/gasPatron.ts`
  - ✅ Table `public.gases_patron` with vigency predicate
  - ✅ Compound attribute in equipment (inheritance from model, correction by PATCH for admin only)
  - ✅ Guard on `liberacion` from `En Proceso` when equipment has vigent patrol gas (409)
  - ✅ Reason registered when no vigent patrol (motivo_sin_verificacion)
  - ✅ Certificate field on `Liberación` (required from Verificación and from En Proceso with compound)
  - ✅ Optional PDF upload with `application/pdf` validation
  - ✅ Server routes for PDF storage and retrieval
  - ✅ Seeding script template (not executed; awaiting person tasks P.1-P.4)
  - ❌ Seeding of compounds and patrol gases (person task P.1, P.2)
  - ❌ Editing compound from equipment sheet (F1B-02, as noted in design)
  - ❌ Catalog screen for compound editing (F1D-01)

## Implementation Status

**Verification**: PASS WITH WARNINGS
- 0 CRITICAL
- 5 WARNING
- 3 SUGGESTION
- All 53 implementation tasks checked ✅
- 84 scenarios from 15 requirements, all covered

**Test results** (from commit 5251896):
- 168 test files, 1 skipped
- 2363 tests, 2 skipped
- Typecheck: clean
- Lint: 165 warnings, 0 errors
- Build: green

**Delivered commits**:
1. Lote 1: `084875c` — Dato (compounds list, schema, inheritance, PATCH, R-2)
2. Lote 2: `f644027` — Guardas (patrol gas guard, reason, certificate, field in Liberación)
3. Lote 3: `5251896` — PDF, interface, seeding script, closing
4. Verify: `15e7bce` — verify-report
5. Design decisions: `f6f1b5b`, `4eafe5e`, `28167e8` (attempt records)

## Design Decisions Accepted by Gerencia

Three design points differ from proposal.md initial assumptions; Gerencia accepted all three as design decisions:

- **d-1 · Compound correction**: Only administrator can change equipment compound via `PATCH` (supuesto reversible). Design chose this over restricting to a technical director role (pending role infrastructure).
- **d-7 · Alta ignores compound**: Equipment creation never takes compound from request body; inherited from model only. Prevents the shortcut to bypass the Verificación guard (RQ-EN-08).
- **Decision on ov.clientId divergence**: When OV selection includes titularidad (maintainer exception), a write from the app marks the OV at row level (`ov_elegida_en_app_at`); sync does not overwrite that pair. Recorded in `decision/e005-iv4-iv11` (F1B-11 follows up with the data fill).

## Open Points (Not Closed by This Archive)

These are not implementation tasks; archiving does **not** mark them complete. Each has an owner and destination:

1. **Compound change not in `equipos_cambios` registry** (RQ-HV-10 tracks six commercial fields; compound is separate)
   - Owner: F1B-02 (equipment sheet editing feature)
   - Status: Noted in design §5; mentioned in tasks.md

2. **Compound of catalog model has no screen** (only seeding in this change)
   - Owner: F1D-01 (catalog management feature)
   - Status: Referenced in hojas-vida spec as out of scope

3. **Equipment without `modelo_id` stays outside the guard** (proportion unmeasured)
   - Owner: F1B-02 or data cleanup decision
   - Status: Noted in tasks.md

4. **Director who can correct compound** (reversible decision; currently admin only)
   - Owner: `decision/c10-permisos-cargo` (if role-based correction required)
   - Status: Deferred pending role infrastructure

## Person Tasks — Not Marked Complete by Archive

These tasks have owners outside the repository cycle and remain open. The deployment package notes require them before or after deployment:

| Task | Owner | Destination | Status |
|------|-------|-------------|--------|
| P.1 · Data for seeding: compounds by serial (AP-370 lot 2024), model converters, cylinder availability table | Director Técnico | `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` blocks A, C, D | ⏳ Pending |
| P.2 · Execute seeding in production (blocks A, B, C, D in order) | Alfonso (Ops) | Part of deployment | ⏳ Pending |
| P.3 · Count before deploy: tickets in Verificación, Equipo nuevo in En Proceso (by model) | Alfonso (Ops) | Deployment notes points 2, 3 | ⏳ Pending |
| P.4 · Verification in app after deploy: certificate field, PDF upload, 409 Verificación guard, motivo in historial | Calidad / Servicio Técnico | With Gerencia decision | ⏳ Pending |

The seeding script (`docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql`) is prepared with template structure and placeholder blocks marked `-- [P.1]`; it is idempotent and does not invent data. Without P.1 data, blocks B (inheritance to existing equipment) still runs.

## Specs Merged Into Live

Three delta specs merged into the source of truth (`openspec/specs/`):

| Spec | Action | Changes |
|------|--------|---------|
| `openspec/specs/gases-patron/spec.md` | **Created** (new capacity) | 6 new requirements (RQ-GP-01 to RQ-GP-06), 24 scenarios total |
| `openspec/specs/transitions-equipo-nuevo/spec.md` | **Updated** | 5 requirements added (RQ-EN-08 to RQ-EN-12), 41 scenarios added; RQ-EN-01 modified to reflect 6 transitions and field declarations; 3 bullets removed from "Out of Scope" (E3, E4, E5) |
| `openspec/specs/hojas-vida/spec.md` | **Updated** | 3 requirements added (RQ-HV-13 to RQ-HV-15), 19 scenarios added; no existing requirements modified |

**Capacity registration**: `openspec/config.yaml` line 313-315 updated to add `gases-patron` with zero-displacement rewrap (3 lines for single entry; regla de mutación 4 compliance checked).

## Warnings and Follow-Up

**From verify-report (5 WARNING, 3 SUGGESTION)**:

These do not block archive; they are follow-up findings:

- WARNING items require decisions outside the repository (deployment checklist, role infrastructure, dashboard column for Verificación state)
- SUGGESTION items point to minor code quality improvements (type safety for compuesto field in transactionExec context, grep coverage on custom_fields write-to-Zoho path)

All captured in `verify-report` artifact and marked for future review cycles.

## Rule of Mutation 4 — Citation Sweep

All very-cited files touched were swept for citations against this change. No broken citations in the new or modified specs. Citation form check (full vs. abbreviated) complete; relative displacements checked (A, B, C cases per CLAUDE.md):

- `transitions-equipo-nuevo/spec.md`: 4 internal references, 0 new displacements
- `hojas-vida/spec.md`: 0 internal references to other specs
- `gases-patron/spec.md`: 1 reference to `transitions-equipo-nuevo` RQ-EN-08, 1 reference to hojas-vida RQ-HV-13..15 (all present in merged live specs)
- `openspec/config.yaml`: `:313-315` rewrapped; 0 citations to that range pre-existing

No citas-rotas reported; detector clean.

## Attempt Record

**Attempt 1**: Lotes 1, 2, 3 executed sequentially; verify run; archive phase.
- Ledger line count (with git mv double-count): ~5,530 estimated; measured against 6,000 approval per Gerencia 2026-10-01
- Measure split:
  - Folder move (`git mv`): ~4,900 (verbatim copy, zero review load)
  - Reviewable delta (specs merge + archive-report): ~630 (actual merge deltas + 260-line archive report)
  - Total: ~5,530 (final measure pending Step 2)

**Intermediate snapshots**:
- `apply-progress.md` (3 × ~60 lines, lotes 1/2/3): Green, three effects vivo confirmed
- `verify-report.md`: PASS WITH WARNINGS; all tasks checked ✅

## Traceability

**Engram artifacts**:
- sdd/verificacion-gas-patron-certificado/proposal (obs. 1219)
- sdd/verificacion-gas-patron-certificado/spec (obs. 1220)
- sdd/verificacion-gas-patron-certificado/design (obs. 1221)
- sdd/verificacion-gas-patron-certificado/tasks (obs. 1222)
- sdd/verificacion-gas-patron-certificado/verify-report (obs. 1234)
- sdd/verificacion-gas-patron-certificado/archive-report (this file, to be saved)

**OpenSpec artifacts** (merged into live):
- `openspec/specs/gases-patron/spec.md` (new, 213 lines)
- `openspec/specs/transitions-equipo-nuevo/spec.md` (updated, +380 lines delta)
- `openspec/specs/hojas-vida/spec.md` (updated, +169 lines delta)
- `openspec/config.yaml` (3-line rewrap at 313-315)

**Change folder** (to be archived):
- `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/`

---

## Deployment Notes (Literal — From tasks.md 3.14)

**Visible changes from deploy**:

1. **Schema**: Additive; two new tables (`public.gases_patron`, `public.certificados_fabrica`) and two new columns (`desk.equipos.compuesto`, `public.catalogo_modelos.compuesto`). Empty, no backfill; migrate creates them.

2. **Change (a)**: From deploy onward, **all `Liberación` from `Verificación` requires the factory certificate number** (text, PDF optional), **including tickets already in `Verificación` that day** (no exemption). `Liberación` from `En Proceso` of equipment with compound and no vigent patrol gas also requires it; equipment without compound or without equipment does not.

3. **Change (b)**: **Equipment with family `modelo_id` and vigent patrol gas of its compound no longer releases from `En Proceso`**: responds 409 "must pass through Verificación". Ticket count (P.3 measure) before deploy.

4. **Table empty = 0 targets**: Until compounds are seeded, no equipment has compound; change (b) reaches nobody. With compounds and empty gases table, all family equipment exits `En Proceso` **with reason registered** ("Sin gas patrón vigente de SO₂", visible in history as "Liberado sin Verificación") and certificate required. **Only with compounds and vigent gases does the guard block.**

5. **Seed order**: Counts P.3 **before** deploy; deploy; seed A (compound by model), B (inherit to existing), C (AP-370 lot 2024 exceptions) with data from P.1; then D (vigent patrol gases, also P.1); then P.4. Script is idempotent, does not invent values.

6. **Correct compound** (`PATCH /api/equipos/:id`) **admin only**; no trace in `equipos_cambios` (F1B-02). Equipment creation never takes compound from body; inherits from model.

7. **Rollback**: Revert commits; columns and tables live without readers. Seeding remains inert without the guard. `liberacion_sin_factura` and already-released tickets unchanged.

---

**End of archive report**
