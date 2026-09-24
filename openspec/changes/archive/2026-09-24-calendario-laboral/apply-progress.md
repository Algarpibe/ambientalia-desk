# Apply progress: calendario laboral (F1B-12)

**Modo**: Strict TDD. **Estado**: 16/17 tareas completas (task 6.3 es una nota para el orquestador,
tras el commit — no ejecutable por `sdd-apply`, regla del ciclo 1 de `CLAUDE.md`).

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1/1.2 | `packages/shared/src/calendarioLaboral.test.ts` (Pascua+festivos) | Unit | N/A (nuevo) | ✅ Escrito (módulo inexistente) | ✅ 12/12 a la primera | ✅ 3 años de Pascua (2026/2027/2000) + 18 fechas × 2 años + 4 casos de traslado | ➖ No hacía falta |
| 2.1/2.2 | mismo fichero, bloque Fase 2 (jornada/horas/días) | Unit | ✅ 13/13 previos siguen verdes | ✅ Escrito, 14 fallos reales (`TypeError: … is not a function`) | ✅ 27/27 tras implementar | ✅ 10 casos (jornada completa, sábado, viernes→lunes con/sin festivo, bordes, UTC, cierre) | ➖ No hacía falta |
| 2.3 | — (export puro) | — | — | — | ✅ `index.ts` con la nueva línea, comprobado por el resto de la suite | ➖ Triangulación no aplica (una sola línea de export, sin lógica) | ➖ |
| 4.1/4.2 | `packages/zoho-sync/src/db/migrate.test.ts` | Integration (pg-mem) | ✅ 21/21 baseline previa al cambio | ✅ Editado el recuento in situ, 20/21 (1 rojo real) | ✅ 21/21 tras `schema.sql` + `migrate.ts` | ➖ Un solo escenario (recuento); el guardián ya cubre calificación por separado (4.3) | ➖ No hacía falta |
| 4.4/4.5 | `apps/desk/server/db/calendarioCierres.test.ts` | Integration (pg-mem) | N/A (nuevo) | ✅ Escrito (módulo inexistente) | ✅ 2/2, tras corregir la *hipótesis* de `design.md` sobre `fecha::text` (ver Desviaciones) | ✅ 2 casos: con cierres (orden) y sin cierres (lista vacía) | ✅ Extraído `comoDiaCivil()` para no repetir la normalización |

### Test Summary
- **Total de pruebas nuevas**: 29 (27 en `calendarioLaboral.test.ts` + 2 en `calendarioCierres.test.ts`)
- **Total en verde al cierre**: 1321/1321 (`npm test`, suite completa) + 2 skipped (integración real, ya excluidas antes de esta tanda)
- **Capas usadas**: Unit (27), Integración pg-mem (2 nuevas + 21 de `migrate.test.ts` reutilizadas)
- **Pruebas de aprobación** (refactor): Ninguna — no hubo tarea de refactorización de código existente
- **Funciones puras creadas**: 9 (`domingoDePascua`, `trasladarALunes`, `festivosDeColombia`, `esDiaHabil`, `horasHabilesEntre`, `diasHabilesEntre`, más 4 internas: `diaCivil`, `sumarDias`, `diaSemanaISO`, `instanteDeJornada`)

## Mutaciones obligatorias (reglas 1 y 2 de `CLAUDE.md`) — salidas reales

Las cinco mutaciones de la Fase 3 y la de la Fase 4.3 se ejecutaron de verdad sobre el fichero de
producción, se confirmó el rojo con `npx vitest run`, y se revirtieron antes de continuar.

**M1 · Quitar un festivo (Navidad, de `FESTIVOS_FIJOS`)**
```
✕ tablas de datos de festivos … FESTIVOS_FIJOS tiene 6 entradas
  AssertionError: expected 5 to be 6
Tests  3 failed | 24 passed (27)
```
Revertido → 27/27 verde.

**M2 · Mover 6-ene de `FESTIVOS_TRASLADABLES` a `FESTIVOS_FIJOS` (rompe 2027)**
```
✕ FESTIVOS_TRASLADABLES tiene 7 entradas — expected 6 to be 7
Tests  5 failed | 22 passed (27)
```
Revertido → 27/27 verde.

**M3 · Desactivar la comprobación de cierres en `esDiaHabil`**
```
✕ un cierre inyectado resta su día completo — expected +0 to be 1
Tests  2 failed | 25 passed (27)
```
Revertido → 27/27 verde.

**M4 · `finHora` de 17 a 18**
```
✕ con el lunes festivo (Corpus Christi): 1 hora hábil — expected 2 to be 1
Tests  3 failed | 24 passed (27)
```
Revertido → 27/27 verde.

**M5 (Fase 4.3, regla 2 — mutar el FICHERO VIGILADO) · `CREATE TABLE` sin calificar en `schema.sql`**
```
✕ toda tabla del esquema está clasificada, y en el esquema que su lista declara
  tablas de schema.sql que no están en DESK_TABLES, PUBLIC_TABLES ni BOOKS_TABLES:
  expected [ 'calendario_cierres' ] to deeply equal []
Tests  1 failed | 20 passed (21)
```
Revertido → 21/21 verde.

**Regla 1 · orden de guardas en `esDiaHabil` (fin de semana / festivo / cierre)**
Invertido el orden (cierre → festivo → fin de semana) y ejecutado: **27/27 sigue en verde** — confirma
que las tres comprobaciones son una intersección de conjuntos, no una cadena con distinto mensaje, así
que el orden es irrelevante. Revertido al orden original por claridad de lectura (festivo primero es
el caso más frecuente).

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de prueba enfocado y resultado exacto | `npx vitest run packages/shared/src/calendarioLaboral.test.ts` → 27/27; `npx vitest run apps/desk/server/db/calendarioCierres.test.ts` → 2/2; `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` → 21/21 |
| Comando/escenario de arnés en tiempo de ejecución | pg-mem + `migrate()` real, molde `avisos.test.ts` — `calendarioCierres.test.ts` inserta filas por SQL y lee con `listarCierres`, igual que lo hará Alfonso en producción |
| Frontera de reversión | `packages/shared/src/calendarioLaboral.ts(+.test.ts)`, `apps/desk/server/db/calendarioCierres.ts(+.test.ts)`, `packages/shared/src/index.ts` (última línea), `packages/zoho-sync/src/db/{schema.sql,migrate.ts,migrate.test.ts}`, `openspec/config.yaml:312`, R01.3 (sección `## G` al final), `apps/desk/server/reconciliacion/registro.test.ts:108` — revertir el commit basta; `DROP TABLE public.calendario_cierres` si ya se aplicó en algún entorno |

## Desviaciones de diseño

1. **`design.md` §"Preguntas abiertas" tenía una *hipótesis* que resultó FALSA, confirmada por
   ejecución.** `fecha::text` **no** castea en pg-mem (`Error: cannot cast type date to text`,
   `TimestampType._convert`). `listarCierres` no castea en SQL: lee `fecha` cruda y la normaliza en JS
   con `comoDiaCivil()`, usando getters **UTC** (nunca locales — el servidor corre en UTC, riesgo ya
   anotado en `proposal.md`). Cubre los dos casos: `Date` (node-postgres en producción) y `string`
   (pg-mem). Las dos pruebas de `calendarioCierres.test.ts` pasan sobre esta implementación real.
2. **Fuera de las 17 tareas, un ajuste mecánico obligado**: `apps/desk/server/reconciliacion/registro.test.ts:108`
   tenía el recuento de capacidades declaradas hardcodeado en `'19 declaradas'`. La alta de
   `calendario-laboral` en `capabilities` (tarea 5.1, R-2/RQ-CL-12) lo sube a 20 de forma mecánica —
   mismo patrón que el recuento de `migrate.test.ts` (tarea 4.1). Sin este ajuste, `npm test` fallaría
   por un efecto colateral directo y esperado de una tarea SÍ asignada, no por un desvío de alcance.
   No se tocó ninguna otra aserción de ese fichero.

Ninguna otra desviación: el resto de la implementación sigue `design.md` tarea a tarea.

## Barrido RQ-CL-11 (exclusividad, Fase 4.6)

```
grep -rnE "hábil|festivo" packages/ apps/ --include=*.ts --include=*.tsx | grep -v calendarioLaboral | grep -v calendarioCierres
```
Sin coincidencias. `sla.ts` no contiene ninguna de las dos palabras (confirmado: `grep -n` sale con
código 1). Único cálculo horario fuera del módulo: `sla.ts:37,43` (reloj de calendario, fuera de
alcance a propósito, F1B-08/F1C-06) — nunca usa esas palabras, así que ni siquiera hacía falta
excluirlo del patrón.

## Barrido regla de mutación 4 (Fase 6.2) — desplazamiento cero

`git diff --numstat` de los seis ficheros citados por número de línea en el repositorio:

```
2   1  apps/desk/server/reconciliacion/registro.test.ts   (ajuste mecánico, ver Desviaciones)
20  0  docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md   (append puro tras :206)
1   1  openspec/config.yaml                                (sustitución en sitio, línea 312)
1   0  packages/shared/src/index.ts                        (append puro tras :18)
5   5  packages/zoho-sync/src/db/migrate.test.ts            (edición in situ, :282-287)
1   1  packages/zoho-sync/src/db/migrate.ts                 (edición in situ, :73)
12  0  packages/zoho-sync/src/db/schema.sql                 (append puro tras :471)
```

Barrido de citas (`grep -rnoE`) sobre los seis ficheros: las únicas citas a `config.yaml:312`
encontradas (`openspec/specs/reconciliacion/spec.md:281`, y su copia archivada) son **Caso B
(histórico)** — ya llevaban la revisión `ce93480` anotada («`openspec/config.yaml:312` en `ce93480`»),
así que siguen siendo ciertas de esa revisión y no se tocan. Ninguna otra cita a `migrate.ts:6x-8x`,
`migrate.test.ts:28x/39x` o `schema.sql:4xx` resultó afectada — todas caen antes del punto de edición
o el punto de edición no cambió el número de línea.

## Ficheros cambiados

| Fichero | Acción | Qué |
|---|---|---|
| `packages/shared/src/calendarioLaboral.ts` | Creado | Módulo puro: festivos, jornada, horas/días hábiles |
| `packages/shared/src/calendarioLaboral.test.ts` | Creado | 27 pruebas unitarias |
| `packages/shared/src/index.ts` | Modificado | `export * from './calendarioLaboral'` al final |
| `packages/zoho-sync/src/db/schema.sql` | Modificado | `CREATE TABLE public.calendario_cierres` al final, calificada |
| `packages/zoho-sync/src/db/migrate.ts` | Modificado | `'calendario_cierres'` añadida a `PUBLIC_TABLES`, misma línea `:73` |
| `packages/zoho-sync/src/db/migrate.test.ts` | Modificado | Recuento `:282-287`: 29→30, 16→17, editado en su sitio |
| `apps/desk/server/db/calendarioCierres.ts` | Creado | `listarCierres(db)`, sin endpoint (D6, YAGNI) |
| `apps/desk/server/db/calendarioCierres.test.ts` | Creado | 2 pruebas de integración (pg-mem) |
| `openspec/config.yaml` | Modificado | `:312` (antes en blanco) → `  - name: calendario-laboral` |
| `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md` | Modificado | `## G · Catálogo de filas` al final, fila F1B-12 |
| `apps/desk/server/reconciliacion/registro.test.ts` | Modificado (fuera de las 17 tareas) | Recuento de capacidades declaradas: 19→20 |

## Verificación de cierre (Fase 6.1)

- `npm test` → **1321 passed, 2 skipped (137 test files, 136 passed, 1 skipped)**, 0 fallos.
- `npm run typecheck` → `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, **exit 0**, sin salida.
- `npm run lint -- --max-warnings 165` → **165 problems (0 errors, 165 warnings), exit 0**. Ningún
  fichero nuevo de esta tanda aparece en la lista de warnings.

## Datos de persona (fuera del recuento — regla del ciclo 1, sin marcar)

- [ ] Cierres de fin de año 2026/2027: Alfonso los registra por `INSERT` directo en
  `public.calendario_cierres`. Este `apply` **no** los da por hechos.

## Nota de cierre (tarea 6.3, sin marcar a propósito)

El detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` corre **tras el commit**, y ese paso es del
orquestador, no de `sdd-apply` (esta fase no hace `git commit`). Se deja sin `[x]` porque no es una
tarea que esta fase pueda ejecutar — no es trabajo pendiente de código.
