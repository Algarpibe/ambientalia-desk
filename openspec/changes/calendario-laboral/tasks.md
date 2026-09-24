# Tasks: calendario laboral (F1B-12)

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~510 (design.md: código+pruebas ~480, documental ~15) |
| 400-line budget risk | Low (budget efectivo 800 — `config.yaml`) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Módulo `calendarioLaboral.ts` + tabla `calendario_cierres` + lector | PR 1 | `npm test` (vitest) | pg-mem, molde `avisos.test.ts` | Revertir ficheros; `DROP TABLE public.calendario_cierres` |

## Phase 1 — Pascua y festivos (RED→GREEN)

- [ ] 1.1 RED: Pascua 2026/2027 + año extremo (RQ-CL-02); 18 festivos 2026/2027 `toEqual` (RQ-CL-03/04); traslados 6-ene-2027→11-ene, 15-ago-2027→16-ago, 29-jun-2026, 20-jul fijos
- [ ] 1.2 GREEN: crear `packages/shared/src/calendarioLaboral.ts` — `DiaCivil`, `FESTIVOS_FIJOS`(6)/`TRASLADABLES`(7)/`DE_PASCUA`(5), `domingoDePascua` (Meeus/Jones/Butcher, *hipótesis* Ley 51/1983), `festivosDeColombia(anio)`, hasta verde

## Phase 2 — Jornada, horas/días hábiles, UTC, cierres (RED→GREEN)

- [ ] 2.1 RED: jornada L-V 8-17 (RQ-CL-01); `horasHabilesEntre` viernes16→lunes9=2h, Corpus=1h (RQ-CL-07); `diasHabilesEntre` `(06-04,06-10]`=3 (RQ-CL-08); bordes 0/9h (RQ-CL-09); UTC `03:00Z`→domingo Bogotá (RQ-CL-10); cierre `2026-12-31` (RQ-CL-05)
- [ ] 2.2 GREEN: `JORNADA`, formateador `Intl` de módulo (D3), reutiliza `ZONA_NEGOCIO`/`diaEnZona` de `fechasDerivadas.ts:13,63-73`; `esDiaHabil`, `horasHabilesEntre`, `diasHabilesEntre(cierres: ReadonlySet<DiaCivil>)`, hasta verde
- [ ] 2.3 `export * from './calendarioLaboral'` al final de `packages/shared/src/index.ts` (hoy `:19`)

## Phase 3 — Mutaciones obligatorias del módulo (reglas 1 y 2)

- [ ] 3.1 Confirmar rojo y revertir: quitar festivo; 6-ene trasladable→fijo (2027); borrar cierre 2.1; `finHora`=18. Orden fin de semana/festivo/cierre en `esDiaHabil` es irrelevante (conjunto)

## Phase 4 — Persistencia: tabla, migrate, lector (RED→GREEN)

- [ ] 4.1 RED `migrate.test.ts:282-287` editado en su sitio: 29→30, 16→17 (tabla no existe)
- [ ] 4.2 GREEN `schema.sql`: `CREATE TABLE public.calendario_cierres` al final, calificado (`design.md:57-63`); `migrate.ts:70-73` añade `'calendario_cierres'` a `PUBLIC_TABLES`
- [ ] 4.3 Mutación regla 2: `CREATE` sin calificar en `schema.sql` → confirmar rojo el guardián `:266-275`; revertir
- [ ] 4.4 RED `apps/desk/server/db/calendarioCierres.test.ts`: pg-mem, molde `avisos.test.ts`, `listarCierres` ordenado `YYYY-MM-DD`
- [ ] 4.5 GREEN `apps/desk/server/db/calendarioCierres.ts`: `listarCierres(db)`, molde `avisos.ts`, sin endpoint (D6)
- [ ] 4.6 Barrido RQ-CL-11: `grep -rniE` hábil/festivo en `packages/`, `apps/` fuera del módulo — sin coincidencia (`sla.ts:37-43` excluido)

## Phase 5 — Documental

- [ ] 5.1 `openspec/config.yaml`: comprobar `:312` sigue en blanco; sustituir por `  - name: calendario-laboral` (D8)
- [ ] 5.2 R01.3: `## G · Catálogo de filas` al final (`:207`) — fila F1B-12 (`calendario-laboral`, `calendario-habil`, talla S); nota: `'Notificado'` 24h→9h va en F1B-08 (`anexo-3-alerta`)

## Phase 6 — Cierre

- [ ] 6.1 `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165`
- [ ] 6.2 Barrido regla mutación 4 (`grep -rnoE` citas) + `git diff --numstat` en `config.yaml`, `schema.sql`, `migrate.ts`, `migrate.test.ts`, `index.ts`, R01.3 — sin desplazamiento
- [ ] 6.3 Nota: detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` corre tras commit — orquestador, no esta tanda

## Datos de persona (fuera del recuento — regla del ciclo 1)

- [ ] Cierres de fin de año 2026/2027: Alfonso los registra por `INSERT` directo en `public.calendario_cierres`. Archivar **no** los da por hechos; pendientes, sin fecha fijada.
