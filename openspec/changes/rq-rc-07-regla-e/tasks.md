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

- [x] 1.1 Ejecutar `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` sobre el árbol sin tocar; registrar el fallo real de `:49` (espera `['a','b','c','d']`, el registro trae cinco). Confirma que el rojo ya existe desde `be78ef9` — este paso lo mide, no lo introduce.

## Phase 2: GREEN — cerrar el rojo heredado de `:49`

- [x] 2.1 `registro.test.ts:47` — título del `describe`: «CUATRO» → «CINCO reglas de lectura».
- [x] 2.2 `registro.test.ts:48` — título del `it`: nombrar `a`-`e` en vez de `a`-`d`.
- [x] 2.3 `registro.test.ts:49` — expectativa a `['a', 'b', 'c', 'd', 'e']`.
- [x] 2.4 Correr el test focal; confirmar `:49` en verde. M3 (`:60-62`) sigue verde pero por la razón equivocada (regex sin acotar borra (d) y (e) a la vez) — no tocar todavía.

## Phase 3: RED real de M3 — sólo expectativas, regex intacta

- [x] 3.1 `registro.test.ts:61` → `not.toEqual(['a','b','c','d','e'])`; `:62` → `toEqual(['a','b','c','e'])`. NO tocar `:60` en este paso.
- [x] 3.2 Correr el test focal; confirmar rojo real (`expected ['a','b','c'] to equal ['a','b','c','e']`) y guardar la salida textual en el cierre de la tanda.

## Phase 4: GREEN — acotar la regex (D2 del diseño)

- [x] 4.1 `registro.test.ts:60` — acotar el lookahead a `/^ {4}- id: d$[\s\S]*?(?=^ {4}- id: |^ {2}[a-z_]+:)/m`.
- [x] 4.2 Correr `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`; confirmar verde completo (los cinco `describe` del fichero).
- [x] 4.3 Mutación de posición (regla de mutación 1): quitar temporalmente la alternativa `^ {4}- id: ` del lookahead, confirmar rojo en `:62`, revertir. Se documenta en el cierre; no añade prueba nueva (paso 5 del diseño).

## Phase 5: Suite completa y no-desplazamiento de citas

- [x] 5.1 Ejecutar `npm test` completo; confirmar verde.
- [x] 5.2 `wc -l apps/desk/server/reconciliacion/registro.test.ts` antes y después de las ediciones — debe seguir en 123 líneas (medido con `wc -l`; el diseño no fijaba el número), para no desplazar las citas externas ancladas en `:96`, `:101`, `:108` (regla de mutación 4).
- [x] 5.3 Ejecutar `npm run typecheck`.
- [x] 5.4 Ejecutar `npm run lint -- --max-warnings 165`.

## Fuera de esta tanda

- La delta spec (`openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md`) ya está escrita; no es tarea de `sdd-apply`.
- `openspec/config.yaml` no se toca: ya declara las cinco reglas.

## Remediación tras verify (2 CRITICAL, verdict `fail`)

El `verify-report.md` marcó `fail`: 2/3 escenarios de la spec delta sin test — «un cierre por
dictamen se distingue de uno por trabajo» y «un cambio... lleva un único `tanda:`» (RQ-RC-07).
D4 del diseño seguía siendo correcta para su alternativa original (insertar en `:52-57`
desplaza `:96`/`:101`/`:108`); la remediación añade el control al FINAL del fichero, sin tocar
las líneas 1-123.

- [x] R.1 Añadir `describe('registro · RQ-RC-07: el TEXTO de las reglas (d) y (e) está en el registro', …)` al final de `registro.test.ts` (después de `:123`), con la función `bloqueDeRegla` que reutiliza el patrón de regex acotada de M3.
- [x] R.2 Prueba: el bloque de la regla (d) contiene «por trabajo» y «por dictamen» (`configReal()`, sin `toContain` global).
- [x] R.3 Control del otro signo de R.2: sobre una copia con «por trabajo o por dictamen» sustituido, el bloque (d) deja de contener ambos textos. RED real capturado primero en polaridad `toContain` (falla), invertido a `not.toContain` (verde).
- [x] R.4 Prueba: el bloque de la regla (e) contiene «UN SOLO `tanda:`» y «cuenta en parte».
- [x] R.5 Control del otro signo de R.4: sobre una copia con el bloque (e) completo borrado (misma regex de M3, adaptada a `id: e`), el bloque extraído deja de contener ambos textos. RED real capturado primero en polaridad `toContain` (falla), invertido a `not.toContain` (verde).
- [x] R.6 Confirmar con `git diff` que sólo se AÑADEN líneas al final; `:96`, `:101`, `:108` releídas e intactas.
- [x] R.7 Actualizar `design.md` con una nota en D4 explicando que el control de texto SÍ se añadió en remediación, al final del fichero (evita el desplazamiento que D4 quería evitar).
- [x] R.8 Ejecutar `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` (15/15), `npm test` (suite completa), `npm run typecheck` y `npm run lint -- --max-warnings 165`.
