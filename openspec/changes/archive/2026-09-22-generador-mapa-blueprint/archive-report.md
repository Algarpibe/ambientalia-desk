# Archive Report — generador-mapa-blueprint (F1A-06)

**Change**: `generador-mapa-blueprint`  
**Archived**: 2026-09-22  
**Status**: CLOSED  
**Observation IDs** (hybrid mode): #879 (spec), #880 (design), #882 (tasks), #884 (apply-progress), #886 (Unit B), #895 (verify-report)

---

## Cycle Summary

Generador-mapa-blueprint (F1A-06 — generating the state-machine blueprint per M1.3.1, M1.3.7, and Anexo F) 
completed in three SDD units with one maintenance reset (Unit B) and one exceeding self-imposed budget 
(Unit C, settled by maintainer as **blocks** until reset). Verification: **PASS WITH WARNINGS**, 
0 CRITICAL, 3 WARNING. All 38/38 tasks marked complete.

## Deliverables

### Specs Synced

- **`mapa-blueprint`** (NEW, 149 lines): Pure function `mapaBlueprint()` (state/transition graph → 
  Mermaid), four generated `.md` files, CLI `generar-mapa-blueprint`, anti-drift test (RQ-MB-01…06, 
  12 scenarios). Capability registered in `openspec/config.yaml`.

- **`transitions-st`** (MODIFIED, +39/-6): RQ-TS-03 — the two buttonless steps now declare 
  explicit `from`/`to` matching their row in the spec table; `estadoPorRemision.ts:41` (phase guard) 
  and `:49` (destination) derive from those constants instead of re-encoding status literals (kills 
  the third-copy duplication, proposal P-2). Master-doc discrepancy M1.3.3 `:1198` corrected in 
  F0-01 entry 17 per CLAUDE.md mutation rule 4.

### Archive Contents

- ✅ proposal.md (18,563 bytes)
- ✅ design.md (23,554 bytes)
- ✅ specs/mapa-blueprint/ (149 lines)
- ✅ specs/transitions-st/ (delta, merged)
- ✅ tasks.md (38/38 complete)
- ✅ apply-progress.md (Units A, B, C detailed)
- ✅ verify-report.md (PASS WITH WARNINGS)

### Verification Results

**Command suite** (final commit `3b6c168`):

1. `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` → EXIT=0, 2,029 citations verified, 
   11 malformed (all pre-existing, informative only), 0 blockers
2. `npm test` → EXIT=0, 1,247 passed / 2 skipped / 0 failed (1,249 total)
3. `npm run typecheck` → EXIT=0
4. `npm run lint` → EXIT=0, 0 errors, 165 warnings (no increase)

Verdict: **PASS WITH WARNINGS**. Four scenarios lack runtime test coverage (per CLAUDE.md strict_tdd):

| Requirement | Scenario | Reason | Verification |
|---|---|---|---|
| RQ-MB-01 | "the function does not read from disk" | I/O boundary (file interaction only via CLI and test) | Code reading: `mapaBlueprint.ts` has no `fs` import; CLI alone calls `writeFileSync` |
| RQ-MB-01 | "the function does not call permissions.ts" | API boundary (authorization check outside scope) | Code reading: no `import ... from 'permissions.ts'`; `ticketService.ts:123-125` enforces server-side |
| RQ-MB-06 | "generated output does not have duplicate state literals in the Mermaid stateDiagram" | Structural property (parser cannot express as assertion) | Code reading: `mapaBlueprint.ts:56-65` uses `Set` to collect state aliases; alias collisions cannot occur |
| RQ-TS-03 | "two steps declare their `from`/`to` exact, inverted invariant 5b" | Inverted test (5b now asserts presence instead of absence) | Code reading: `transitions.ts:150-151` declare both pairs; `invariantesGrafo.test.ts:120-127` inverted by Unit C |

**Comprobadas de verdad:** Verified by direct code reading with `ruta:línea`, not by test absence alone 
(see verify-report #895 for details).

## Work Units

- **Unit A** (e864b7a4): `fasesBlueprint.ts` (data table), P-2 derivation in `transitions.ts`, 
  inverted invariant 5b, `estadoPorRemision.ts` refactored to use `.from`/`.to`. 14/14 tasks.
  
- **Unit B** (c1680a8..8a36d03, reset authorized): `mapaBlueprint.ts` (pure function), CLI, 
  four blueprint `.md` files, anti-drift test. Fixed regression in Unit A (`estadoPorRemision.ts:41` 
  TS2345 uncaught by typecheck). 15/15 tasks. Reset due to ledger measurement discrepancy.
  
- **Unit C** (372196e..d2bca6f): Documentatio — NOTA.md §3/§6 rewritten (case B, historical evidence 
  preserved), F0-01 entry 17 (master-doc correction), `mapa-blueprint` capability verified in 
  `config.yaml`. Repair of broken citations in `proposal.md` discovered and fixed in-place 
  (rule of mutation 4). 9/9 tasks.

Ledger: attempts 1–6 passed; Unit B and Unit C required maintainer resets due to self-imposed line 
budgets (700, then 300; budget ceiling is 800 per `openspec/config.yaml:29`). No work remained 
pending after any ledger block; reset was accounting only.

## Gap to Plan

**Cierra: SÍ** — F1A-06 (plan row 145, `Desk2.0_Plan_…_R01.1.md`) covered in full:
- ✅ Generador (function + CLI)
- ✅ Specs (new + delta)
- ✅ Four artifact `.md` files per M1.3.1
- ✅ Closed the 38-vs-36 discrepancy (M1.3.7 cite into M1.3.3, Anexo F)
- ✅ Closed M1.3.3 `:1198` correction (master-doc, F0-01 entry 17)

**Declared gap**: Four scenarios have no runtime test (noted above), per strict_tdd without 
`apps/desk/src` coverage scope (CLAUDE.md F0-00). Comprobadas are direct code readings; 
no test-absence downgrade to CRITICAL or BLOCKED.

---

*Archive persisted to Engram (hybrid mode) as topic `sdd/generador-mapa-blueprint/archive-report`.*
