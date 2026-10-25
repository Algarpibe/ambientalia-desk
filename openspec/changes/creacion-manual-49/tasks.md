# Tareas — `creacion-manual-49` (F1F-05, `cierra: no`)

`strict_tdd`: el ROJO se ve y se anota en `apply-progress.md` (salida y causa) antes del VERDE mínimo. D* son de `design.md`; RQ-KP-* de
`specs/kpis/spec.md`; S-* de `proposal.md`. **Colocación (mutación 4, D1/D2/S-2/S-4):** en `apps/desk/server/testing/septiembre2026.ts`,
`apps/desk/server/routes/indicadoresSeptiembre.test.ts`, `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` y
`openspec/specs/kpis/spec.md` todo cambio es EN SU MISMA LÍNEA; no se inserta ni se borra ninguna. Todo en el worktree
`C:\dev\Desk_2_R1.023-worktrees\creacion-manual-49`. Un lote (L1), un intento, techo 800, válvula 720 medidas (`git diff --shortstat --no-renames <base>`
más `wc -l` de lo nuevo sin trackear; el informe que cada fase genera cuenta). Base: `186c2fe4`.

## Lote L1 · fixture + dos cifras (apply, ~50 líneas de diff)

- [x] L1.1 Línea base: correr `indicadoresSeptiembre.test.ts` e `indicadoresComparacionSeptiembre.test.ts` ANTES de editar; deben estar verdes en `186c2fe4`. Si no, parar.
- [x] L1.2 ROJO, `septiembre2026.ts` en sitio (D1, S-3, S-4): `:11` gana `fechaCreacionTicket: string | null` tras `creado`; `:19` gana `'fechaCreacionTicket'` tras `'creado'` en `CLAVES_DEL_FIXTURE`; en la primera línea de cada uno de los trece (`:23` … `:47`) `fechaCreacionTicket` = `creado` salvo 940 `'2026-05-20'`, 941 `'2026-05-21'`, 957 y 972 `null`; `'49'` de 940 `:28` a 6, de 941 `:30` a 5 y de 972 `:40` a `null` (957 ya es `null`); `:6` y `:52` reescritos (D1) sin cambiar su número de líneas. NO tocar todavía el 9.º valor de `:60` (sigue `t.creado`). RQ-KP-38, RQ-KP-42.
- [x] L1.3 ROJO, las dos cifras (D2): `indicadoresSeptiembre.test.ts:43` `['49', '49', '49', 9]` → `8`; `indicadoresComparacionSeptiembre.test.ts:23` `['49', 9]` → `['49', 8]`.
- [x] L1.4 Correr las dos pruebas y anotar las rojas esperadas (D3): RQ-KP-38 con 8 celdas y discrepancias `sep-03: Gerencia 6, Desk 15` y `sep-04: Gerencia 5, Desk 15`; RQ-KP-42 con `ticketsVariante` `{13, 11, 84.6}`, 49 con 8 comparados y 6 coincidentes y las ocho mutaciones por celda con 10 coincidentes en vez de 12. La prueba de claves (`indicadoresSeptiembre.test.ts:55-63`) debe seguir verde. Si el rojo difiere, parar y anotar por qué.
- [x] L1.5 VERDE: `septiembre2026.ts:60`, el 9.º valor pasa de `t.creado` a `t.fechaCreacionTicket`; el 5.º (`${t.creado}T17:00:00Z`) se queda. Las dos pruebas en verde; `indicadoresSeptiembre.test.ts:36` (el 998 por `creado`) sin cambio (S-5).
- [x] L1.6 Mutación M1 (D3): `:60` vuelve a `t.creado`; deben caer el 49 de 940 y 941 (rojo como en L1.4); anotar que el 972 NO lo caza (Gerencia `null`, no se compara). Revertir byte a byte (`git diff` vacío sobre ese hunk) y ver verde.
- [x] L1.7 Mutación M2 (regla de mutación 2): quitar `'fechaCreacionTicket'` de `:19`; debe caer la prueba de claves en los trece. Revertir byte a byte y ver verde.
- [x] L1.8 Colocación (mutación 4): `wc -l` igual a `186c2fe4` en los tres ficheros (fixture 64; las dos pruebas con su cuenta de hoy); `git diff -U0 186c2fe4` sin hunks que inserten o borren líneas; `openspec/specs/kpis/spec.md:1776` (cita `:55-63`) sigue cayendo en el sembrador. Sin cambio en `packages/` ni en `apps/desk/src`: `git diff --stat 186c2fe4 -- packages apps/desk/src` vacío (D4).
- [x] L1.9 Cadena, en primer plano y SIN `&`: `set -o pipefail; npm run typecheck && npm run lint && node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; luego `npm test > <log> 2>&1` con la salida entera al log (scratchpad). Si sale ≠ 0, nombrar prueba y fichero del log antes de seguir.
- [x] L1.c Cierre del apply: `apply-progress.md` con rojos (L1.4), mutaciones (L1.6, L1.7), salida de L1.8 y L1.9; medida ≤ 720 (estimación ~50 + informe).

## Verify

- [x] V.1 Contrastar el diff contra `specs/kpis/spec.md`: las siete celdas del `proposal.md` (940, 941, 957, 972 en `fechaCreacionTicket` y 49 de 940, 941, 972), 49 → 8 en las dos pruebas, nada más. Releer los 49 con la aritmética de lunes a viernes hasta el 28/05 (15, 6 y 5).
- [x] V.2 Repetir `npm test`, typecheck, lint y detector de citas; barrido de la regla de mutación 4: `grep -rnoE "septiembre2026\.ts:[0-9]+(-[0-9]+)?"` y pase por las abreviadas de los ficheros que citan el módulo; cada resultado leído contra lo que afirma (A/B/C). Las archivadas que describen `t.creado` o «49 → 9» son caso B y no se tocan (D5).
- [x] V.3 Regla invariable 13 (mutación 3): dejar escrito «sin cambio en `apps/desk/src` ni `packages/`: no hay decisión de cliente que enfrentar» con `git diff --stat` vacío como prueba. Escribir `verify-report.md` (cuenta como sumando del intento).

## Archive

- [ ] A.1 Anclar en `proposal.md:26` «en `186c2fe4`» a la descripción de `septiembre2026.ts:60` (dos veces `t.creado`) ANTES de la mudanza (caso B; sin renumerar, misma línea).
- [ ] A.2 Fusionar por script el delta en `openspec/specs/kpis/spec.md`, comparando bloques: RQ-KP-38 (26 líneas, `:1607-1632`) y RQ-KP-42 (35 líneas, `:1774-1808`); cambian sólo `:1612`, `:1781` y `:1793`. Comprobar `wc -l` = 1808 y que `:1776` sigue valiendo. Medir la fusión (`git diff --shortstat --no-renames`) ANTES de aplicar: debe ser ≪ 800 (regla del archivo).
- [ ] A.3 Escribir `archive-report.md` (una línea con qué parte de F1F-05 cubrió y qué dejó fuera, para el `cierra: no`); mudar la carpeta a `openspec/changes/archive/2026-10-24-creacion-manual-49/`. Abrir el intento de archive con techo que cubra la mudanza (2 × carpeta + 800); el commit de archivo contiene SÓLO el cambio (`git show --numstat`).

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar NO las da por hechas.**

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Corregir, si procede, los supuestos S-1 a S-5 | Gerencia | Lista semanal de supuestos (regla E-237) |
| P-2 | Revisión futura de la definición del 49 por campo vacío o retrasado (consecuencia (4), fuera de F1F-05) | Gerencia | `decision/f1f05-creacion-del-49-campo-manual` (`openspec/config.yaml:5321-5344`) |

## Review Workload Forecast

| Intento | Bruto | Con informe | Tareas |
|---|---|---|---|
| Apply (L1) | ~44 | ~50 + `apply-progress` ~60 | 9 + cierre |
| Verify | — | `verify-report` ~110 | 3 |
| Archive | fusión ~10 (3 líneas cambian) | mudanza ~2 × carpeta + `archive-report` ~120 | 3 |

Cada intento cabe en 720 con holgura; el archive sube por la mudanza (`git mv`, contada dos veces, carga de revisión cero).

Decision needed before apply: No — un lote, muy por debajo de 720; sin PR encadenados
Chained PRs recommended: No (una rama; se fusiona a `main` al cerrar, con autorización aparte)
Chain strategy: n/a
400-line budget risk: Low
