# Apply progress — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-apply`, **SÓLO Rebanada 1 «el orden»** (Fases 1-6 de `tasks.md`).
**Worktree:** `C:\dev\Desk_2_R1.023-worktrees\f1b-10-r1`, rama `f1b-10-r1`, base `a756d74`.
**Commit de esta rebanada:** `ccedf4f`.
**Ledger:** `gentle-ai sdd-attempt acquire` con el token del padre, work-unit
"R1 - el orden (fases 1-6)", `max-changed-lines 800` → `state: proceed`. **NO se ejecutó `settle`**
(lo hace el orquestador).

## Medición del ledger (obligatoria, contra `a756d74`)

```
git diff --shortstat --no-renames a756d74
 2 files changed, 110 insertions(+), 72 deletions(-)
```

**182 líneas.** `git status --porcelain` no muestra ficheros nuevos sin trackear, así que no hay
`wc -l` adicional. Muy por debajo del techo de 800 del intento.

## Suite, typecheck, lint

- `npx vitest run apps/desk/server/services/ticketService.test.ts` → **36 passed** (34 base + N1 + N2).
- `npx vitest run apps/desk/server/remisiones.test.ts` → **54 passed** (incluye el caso ex-`:957`).
- `npm test` completo → **1134 passed, 2 skipped, 0 failed**.
- `npm run typecheck` → limpio.
- `npm run lint` → **0 errores**, 158 warnings preexistentes de `any`, ninguno en ficheros tocados.

## Evidencia de mutación

| Comprobación | Nace | Mutación | `it` que se puso rojo | Reversión |
|---|---|---|---|---|
| **N1** — «la discrepancia equipo↔cliente gana a la orden de venta ya usada: 422, no 409» | **ROJO NATURAL** | Ninguna: se escribió antes de mover G4 y corrió contra el código sin tocar (`expected 409 to be 422`) | N1 (única prueba nueva en ese momento) | N/A — pasó a verde con el movimiento real (Fase 2) |
| **N2** — «dentro del escalón C, el equipo↔cliente se resuelve antes de contar los obligatorios: «cliente» no aparece» | VERDE | Se movió temporalmente el bloque G5 (comentario + las dos ramas `if/else if`) detrás del bloque de obligatorios | **N2** falló exactamente como se predijo (`expected 'Faltan campos obligatorios: cliente, …' to be 'Faltan campos obligatorios: tipo de s…'`); colateral esperado en `M5` por la misma causa | Bloque G5 restaurado a posición y contenido originales; suite completa vuelta a 36/36 |

N3/N4 (`contratoErrores.test.ts`) quedan para la Rebanada 2 — fuera de alcance de este intento.

## Comprobación del recordatorio 1

- `applyTransition` se invoca en la línea **153**; su `409` de OV (guarda D) queda en la línea
  **149**, última guarda antes de esa llamada.
- Paralelo en la otra puerta: `createTicket` en la línea **101**, con su `409` de OV en la línea
  **97**.

## Confirmación de las siete pruebas intactas

`:154`, `:160`, `:166`, `:194`, `:218`, y la prueba equivalente a `:343` (título «los obligatorios
que faltan ganan al cliente inexistente») — todas ✓ PASSED, ninguna editada. `remisiones.test.ts`
completo (54 tests, incluye el caso ex-`:957`) también ✓ PASSED sin tocar ese fichero.

## TDD Cycle Evidence

| Fase | Test | Capa | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1 | N1 | Unidad/servicio | ✅ 34/34 | ✅ Natural | ✅ Verde tras Fase 2 | ➖ Único escenario | ➖ No aplica |
| 2 | movimiento G4 + comentarios | — | — | — | ✅ N1 pasa, 33/34 preexistentes intactos | — | ✅ Comentarios reescritos |
| 3 | `:327`/`:336` volteadas | Unidad/servicio | ✅ 35/35 | ✅ Rojo confirmado tras Fase 2, antes de voltear | ✅ 35/35 tras voltear | ➖ Casos fijos | ➖ No aplica |
| 4 | N2 | Unidad/servicio | ✅ 35/35 | ✅ Rojo por mutación, revertido | ✅ 36/36 | ➖ Único escenario | ➖ No aplica |
| 5 | movimiento OV `executeTransition` + `:205` | Unidad/servicio | ✅ 36/36 | ✅ Rojo confirmado tras mover, antes de voltear | ✅ 36/36 | ➖ Caso fijo | ➖ No aplica |
| 6 | 4 docblocks | — | — | — | ✅ 36/36 sin cambio de comportamiento | — | ✅ Consistentes con código final |

## Remaining Tasks (Rebanada 2 — Fases 7-10, PENDIENTES)

- [ ] 7.1-7.4 `contratoErrores.test.ts` con N3 y N4 (rojo por mutación, cero cambios de producción).
- [ ] 8.1-8.2 Reparación documental P4 (5 afirmaciones vivas + 4 notas Caso C).
- [ ] 9.1-9.11 Barrido de las 18 citas de cierre — **leer los números finales contra `ccedf4f`, no
  contra el mapa de `design.md` §4**.
- [ ] 10.4 Cerrar el `apply-progress` combinado de R1+R2.

## Deviations from Design

Ninguna. Movimientos, forma de aserciones, y rojo de N1 (natural)/N2 (mutación) siguen literalmente
`design.md` §3, §5.1 y §5.2.

## Issues Found

Ninguno nuevo.
