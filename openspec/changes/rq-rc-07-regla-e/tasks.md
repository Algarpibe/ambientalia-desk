# Tasks: RQ-RC-07 declara cinco reglas de lectura, con la (e)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~12 (6 líneas sustituidas: `:47`, `:48`, `:49`, `:60`, `:61`, `:62`, delta neta 0) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Alinear `registro.test.ts` con el registro real (cinco reglas, M3 acotada) | PR único | `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` | N/A — guardián de fichero de configuración, no requiere servicios ni datos externos | `git revert` del commit devuelve el fichero a `b5676a5` |

## Phase 1: Rojo de partida (medido, no creado)

- [ ] 1.1 Ejecutar `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` sobre el árbol sin tocar; registrar el fallo real de `:49` (espera `['a','b','c','d']`, el registro trae cinco). Confirma que el rojo ya existe desde `be78ef9` — este paso lo mide, no lo introduce.

## Phase 2: GREEN — cerrar el rojo heredado de `:49`

- [ ] 2.1 `registro.test.ts:47` — título del `describe`: «CUATRO» → «CINCO reglas de lectura».
- [ ] 2.2 `registro.test.ts:48` — título del `it`: nombrar `a`-`e` en vez de `a`-`d`.
- [ ] 2.3 `registro.test.ts:49` — expectativa a `['a', 'b', 'c', 'd', 'e']`.
- [ ] 2.4 Correr el test focal; confirmar `:49` en verde. M3 (`:60-62`) sigue verde pero por la razón equivocada (regex sin acotar borra (d) y (e) a la vez) — no tocar todavía.

## Phase 3: RED real de M3 — sólo expectativas, regex intacta

- [ ] 3.1 `registro.test.ts:61` → `not.toEqual(['a','b','c','d','e'])`; `:62` → `toEqual(['a','b','c','e'])`. NO tocar `:60` en este paso.
- [ ] 3.2 Correr el test focal; confirmar rojo real (`expected ['a','b','c'] to equal ['a','b','c','e']`) y guardar la salida textual en el cierre de la tanda.

## Phase 4: GREEN — acotar la regex (D2 del diseño)

- [ ] 4.1 `registro.test.ts:60` — acotar el lookahead a `/^ {4}- id: d$[\s\S]*?(?=^ {4}- id: |^ {2}[a-z_]+:)/m`.
- [ ] 4.2 Correr `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`; confirmar verde completo (los cinco `describe` del fichero).
- [ ] 4.3 Mutación de posición (regla de mutación 1): quitar temporalmente la alternativa `^ {4}- id: ` del lookahead, confirmar rojo en `:62`, revertir. Se documenta en el cierre; no añade prueba nueva (paso 5 del diseño).

## Phase 5: Suite completa y no-desplazamiento de citas

- [ ] 5.1 Ejecutar `npm test` completo; confirmar verde.
- [ ] 5.2 `wc -l apps/desk/server/reconciliacion/registro.test.ts` antes y después de las ediciones — debe seguir en 124 líneas, para no desplazar las citas externas ancladas en `:96`, `:101`, `:108` (regla de mutación 4).
- [ ] 5.3 Ejecutar `npm run typecheck`.
- [ ] 5.4 Ejecutar `npm run lint -- --max-warnings 165`.

## Fuera de esta tanda

- La delta spec (`openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md`) ya está escrita; no es tarea de `sdd-apply`.
- `openspec/config.yaml` no se toca: ya declara las cinco reglas.
