# Archive Report: reasignar-desvios-huerfanos

**Change**: reasignar-desvios-huerfanos  
**Archived**: 2026-09-10  
**Mode**: hybrid (Engram + filesystem)  
**Status**: CLOSED  

---

## Artifact Traceability

| Artifact | Type | Observation ID | Status |
|----------|------|---|---|
| Proposal | architecture | #363 | archived |
| Specification | architecture | #366 | archived |
| Design | architecture | #364 | archived |
| Tasks | architecture | #367 | archived |
| Verification Report | architecture | #390 | archived |

---

## Final State Summary

**Cycle Status**: Complete  
**Implementation Tasks**: 11/11 complete  
**Verification Verdict**: PASS WITH WARNINGS  
**Critical Issues**: 0  
**Blockers**: 0  

This change is a retrofit of work already committed in `56ff441` (base `607e26a`, branch `main`). The SDD cycle closes documentation and specification updates that followed the code commits.

---

## Tasks Completed

### A. Done in Commit 56ff441 (Original Reassignment)

- [x] **Task 1**: Reassign IV-1, IV-5 → F1B-08; IV-2 → open Gerencia point; IV-4 → master point #52
- [x] **Task 2**: Add IV-7 (boardView.ts:49-50, "todos" view hides 726 closed tickets) with two exits declared as Gerencia decision
- [x] **Task 3**: Write in CLAUDE.md the rule for sweeping deviations when an epic closes
- [x] **Task 4**: Entry 5 (5.a, 5.b, 5.c) in docs/sdd/F0-01_Correcciones_para_el_plan.md
- [x] **Task 5**: REASIGNADO notes in tickets-core §4.1/§4.2 and transitions-st §3.8

### B. Done in This Cycle (Post-Retrofit)

- [x] **Task 6**: Cross-reference comment between two contradictory precedence tests (ticketService.test.ts:186-193, :313-317)
- [x] **Task 7**: Seven remision.ts citations updated from old line ranges to `:218-226`/`:221-225`/`:223`/`:214-216`/`:205-208` in live specs and config.yaml
- [x] **Task 8**: Four more orphaned spec sections found and reasigned: remisiones §5.1 → #52 (inverted frame), remisiones §5.3 → undeclared, transitions-st §3.4 → #52, transitions-st §3.6 → F1B-08
- [x] **Task 9**: SDD cycle artifacts written and verified: proposal.md, design.md, specs/remisiones/spec.md, specs/tickets-core/spec.md
- [x] **Task 10**: Sanitize delta before archive: remove «a corregir en F1A» and correct stale line citations across both delta specs
- [x] **Task 11**: Close 10 stale-citation findings from sdd-verify (PASS WITH WARNINGS). **Critical correction**: remisiones/spec.md cited ticketService.ts:100 (wrong — blank line today) twice; corrected to :128-129. Same citation already fixed in tickets-core delta §4.2 the same morning; sanitization was file-by-file instead of citation-by-citation, so the sibling was missed. Also: CLAUDE.md citations in tasks 1,2,3; tickets-core spec.md citations in task 5; ticketService.test.ts and config.yaml citations in task 6-7.

### C. Delivered to Gerencia (Handoff, Not This Cycle's Tasks)

**Why not checkboxes**: The cycle contract requires all tasks complete for verify and archive to reach `ready` (§~sdd-status-contract.md:138,:141). A checkbox whose owner is a person outside the repository cannot be marked by any cycle: while they were here as tasks, this change could never archive by that path. That was a modeling error — it registered work as pending what was actually a delivery. This cycle's job was to **route and write** these three points, which is done and verified in tasks 1, 2, and 4.

| # | Open Point | Where Written | Owner |
|---|---|---|---|
| H1 | Master point #52: OV↔ticket cardinality. No key in plan decision table (config.yaml:434-437, verified by grep across entire plan) | tickets-core §4.2, remisiones §5.1, entry 5.b of docs/sdd/F0-01_Correcciones_para_el_plan.md | Gerencia |
| H2 | decision/vista-todos-tablero (IV-7): rename «Todos» view or change what it returns. No key assigned | CLAUDE.md:204, openspec/config.yaml (`incumplimientos_vivos`) | Gerencia |
| H3 | Apply entry 5 of docs/sdd/F0-01_Correcciones_para_el_plan.md to the plan. Gerencia maintains the plan; no cycle edits it directly | docs/sdd/F0-01_Correcciones_para_el_plan.md:243,280,304 | Gerencia |

All three go to `docs/sdd/Puntos_para_Gerencia_2026-09-11.md`. Archiving this change does **NOT** close or decide them: they remain live in CLAUDE.md, config.yaml, and specs, where a future cycle will encounter them again.

---

## Specs Synced

### Remisiones (openspec/specs/remisiones/spec.md)

**Action**: Updated requirement 5.1  
**Change**: Requirement 5.1 now carries:
- Corrected line citations: `ticketService.ts:45-48` and `:128-129` (was `:45` and `:100`)
- Inverted framing: repair may be **RETIRE** the two existing doors, not **ADD** the third
- Two scenarios with explicit governance-dependent execution paths
- Preamble note documenting sanitation (task 10)

**Why this matters**: F1B-01 inserted 29 lines before the OV capture block, leaving 6 stale citations in specs. Delta was sanitized and corrected to `:128-129` before merge, preventing reversion of the correction `0a2c4ff` had already made to the main spec.

### Tickets-Core (openspec/specs/tickets-core/spec.md)

**Action**: Updated requirements 4.1 and 4.2  
**Change**: Both requirements now carry:
- Corrected line citations: tests at `:327`, `:194`, `:302-314`, `:315`, `:336` (was `:295`, `:176`, etc.)
- Requirement 4.1: added quantified scope (12 precedence tests, 6 change under natural order, 3 alter user-visible error)
- Requirement 4.1: added grep evidence showing no plan entry covers this precedence
- Requirement 4.2: explicit reference to remisiones §5.1 as the canonical rule location
- Requirement 4.2: corrected OV door citations to `:45-48` and `:128-129`
- Both: preamble notes documenting work-in-progress state (Previously: …) per task 10

**Deliberate omissions**: `ticketService.test.ts:176` and `:179` cite `:319` where the line is now `:327` — this file is being rewritten right now by the `mensaje-422-cliente-duplicado` change, which runs its re-anchoring phase with the code frozen. Those citations were explicitly handed to it per the change proposal (§3).

---

## Test Results

**npm test**: 999 passed / 2 skipped (112 files)  
**npm run typecheck**: PASSED  
**npm run lint**: 0 errors / 158 warnings (pre-existing, unrelated)  

Test count (999 passed / 2 skipped) is identical to the baseline declared by orchestrator before this cycle, confirming no behavior changed.

---

## Notes

1. **Retrofit nature**: Almost all content was already committed in `56ff441` before SDD wrapping existed. Tasks 1-5 document what `56ff441` did; tasks 6-11 close loose ends and citations that `56ff441` left behind.

2. **Why sanitization was needed before merge**: The delta specs carried ten stale citations from before `9ed5635`, which would have devolved the main specs if merged as-is. Task 10 sanitized them. One citation (remisiones §5.1 → ticketService.ts:100) was missed by the initial sanitization pass because it was done file-by-file instead of by citation — task 11 caught and fixed it.

3. **Gerencia decisions stay alive, not closed**: The three handoff points (H1, H2, H3) are live decisions, not tasks. They're delivered to the Friday agenda (`Puntos_para_Gerencia_2026-09-11.md`) but documented in the specs and configuration where future cycles will find them.

4. **No apply-progress artifact**: This cycle never ran a real `sdd-apply` phase — it's a retrofit of committed work. The verification report noted this as WARNING (not CRITICAL) because the sole file touched in test (`ticketService.test.ts`) only gained comments, and test counts are identical to baseline.

---

## Closure

**Change archival**: Complete  
**Specs merged**: ✅ remisiones (§5.1), tickets-core (§4.1, §4.2)  
**Folder moved**: ✅ openspec/changes/reasignar-desvios-huerfanos → openspec/changes/archive/2026-09-10-reasignar-desvios-huerfanos  
**Archive verification**: ✅ diff confirmed byte-identity  
**Cycle status**: CLOSED  

Ready for next cycle.
