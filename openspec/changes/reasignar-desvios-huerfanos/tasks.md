# Tasks: Reasignar desvíos huérfanos tras el cierre de F1A

## Nota de retrofit

Casi todo el contenido de este cambio ya está commiteado en `56ff441` (base `607e26a`, rama `main`).
Este `tasks.md` no planifica trabajo futuro: registra qué está hecho, con su verificación, y qué queda
abierto y de quién es.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~45 (7 citas de línea + 2 comentarios cruzados + 2 deltas de spec, ya integrados) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR único |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Cerrar el ciclo SDD sobre el retrofit ya integrado | PR único | `npm test` | N/A — documentación y comentarios, sin ruta de ejecución nueva | `git revert` del commit de esta tanda, sin tocar `56ff441` |

## A. Hecho en `56ff441` (reasignación original)

- [x] 1. Reasignar IV-1 e IV-5 → F1B-08; IV-2 → punto abierto Gerencia; IV-4 → punto abierto nº 52.
      Verificación: `CLAUDE.md:130-134`; `openspec/config.yaml:413-439` (bloque `incumplimientos_vivos`, IV-4).
- [x] 2. Añadir IV-7 (`apps/desk/src/lib/boardView.ts:49-50`, vista «todos» oculta 726 cerrados) con
      las dos salidas declaradas como decisión de Gerencia. Verificación: `CLAUDE.md:131`.
- [x] 3. Escribir en `CLAUDE.md` la regla del barrido (reasignar desvíos al cerrar una épica).
      Verificación: `CLAUDE.md:121-126`.
- [x] 4. Entrada 5 (5.a, 5.b, 5.c) en `docs/sdd/F0-01_Correcciones_para_el_plan.md`.
      Verificación: líneas 243, 280, 304.
- [x] 5. Notas de REASIGNADO en `tickets-core` §4.1/§4.2 y `transitions-st` §3.8.
      Verificación: `openspec/specs/tickets-core/spec.md:238,255`; `openspec/specs/transitions-st/spec.md:565`.

## B. Hecho en esta tanda (post-retrofit)

- [x] 6. Comentario cruzado entre las dos pruebas de precedencia contradictorias.
      Verificación: `apps/desk/server/services/ticketService.test.ts:186-193` (cita `:194` desde `:319`) y
      `:313-317` (cita `:194` desde `:319`). Suite reportada en verde (26/26 en el fichero, 990 en total);
      reproducir con `npm test -- ticketService.test.ts` y `npm test`.
- [x] 7. Siete citas de `remision.ts` actualizadas de `:189-197`/`:192-196`/`:194`/`:185-187`/`:176-179`
      a `:218-226`/`:221-225`/`:223`/`:214-216`/`:205-208`, en specs vivas y `config.yaml`.
      Verificación: `openspec/specs/remisiones/spec.md:34,374-375,380-381,463`;
      `openspec/specs/transitions-st/spec.md:489`; `openspec/config.yaml:415,428`. No se tocan
      `openspec/changes/F0-01/proposal.md:120` ni `F0-04/proposal.md:194` (proposals archivados).
- [x] 8. Cuatro apartados de spec más, huérfanos y no vistos por el barrido de `56ff441`:
      `remisiones` §5.1 → nº 52, enmarcado invertido «retirar, no añadir»
      (`openspec/specs/remisiones/spec.md:349-369`); `remisiones` §5.3 → variables de entorno sin
      documentar, **sin tanda asignada** (`:408-414`; `grep -n "REMISION|N8N_REMISION" DEPLOY.md`
      verificado hoy, cero resultados); `transitions-st` §3.4 → nº 52
      (`openspec/specs/transitions-st/spec.md:475-492`); `transitions-st` §3.6 → F1B-08 (`:507-524`).
- [x] 9. Artefactos del ciclo escritos y verificados por lectura directa: `proposal.md`, `design.md`,
      `specs/remisiones/spec.md`, `specs/tickets-core/spec.md`, todos bajo
      `openspec/changes/reasignar-desvios-huerfanos/`.

## C. Pendiente — de Gerencia, no de esta tanda

- [ ] 10. Decidir el punto abierto nº 52 del maestro (cardinalidad OV↔ticket). Sin clave en la tabla de
      decisiones del plan (`openspec/config.yaml:434-437`, verificado por `grep` sobre el plan entero).
      **Dueño: Gerencia.**
- [ ] 11. Decidir `decision/vista-todos-tablero` (IV-7): renombrar la vista «Todos» o hacer que
      devuelva todo. Sin clave asignada. **Dueño: Gerencia.**
- [ ] 12. Aplicar al plan la entrada 5 de `docs/sdd/F0-01_Correcciones_para_el_plan.md`. El plan lo
      mantiene Gerencia; ninguna tanda lo edita directamente. **Dueño: Gerencia.**

## Recuento

**9 completas** (5 en `56ff441` + 4 en esta tanda), **3 pendientes** — las 3 son de Gerencia; ninguna
queda a cargo de una tanda de ingeniería futura.
