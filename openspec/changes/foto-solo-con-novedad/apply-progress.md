# Apply progress — `foto-solo-con-novedad` (F1B-04, cambio 1, `cierra: no`)

**Fase:** `sdd-apply` · **Base del apply:** commit `d5d66a1` (rama `main`, `C:\dev\Desk_2_R1.023`) ·
**Modo:** Strict TDD · **Lote:** único, fases 1-10 de `tasks.md` (comprometido: 1-9 completas; 10.1-10.2
completas; 10.3-10.4 diferidas al orquestador, como pide el encargo).

## Estado de las tareas

**47/49 casillas de `tasks.md` marcadas `[x]`.** Las dos que quedan `[ ]` son **10.3** (commit) y **10.4**
(CLI de citas post-commit): el encargo de esta fase las reserva explícitamente al orquestador — «en la
fase 10 el commit y el CLI de citas los hace el orquestador: déjalos sin marcar y dilo». No son tareas
de personas (regla del ciclo 1): son trabajo de repositorio que otro actor ejecuta a continuación.

## TDD Cycle Evidence (Strict TDD Mode)

| # | Mutación / Fase | RED confirmado | GREEN confirmado | REFACTOR / revertido |
|---|---|---|---|---|
| 1.1-1.3 | Esquema `hay_novedad` | `expected 36 to be 37` (migrate.test.ts) | 22/22 verde | — |
| 1.4 | Corrección menor #2 (comentario narrativo, en línea, 0 líneas netas) | N/A (documental) | 22/22 verde | — |
| 1.5 / **M5 parte 1** | `ALTER TABLE remisiones` sin calificar | 3 pruebas rojas (calificadas 18, `remisiones` en el conjunto sin calificar, recuento 18≠19) | — | Revertido; 22/22 verde |
| 2.1-2.3 | Predicado `faltaFotoPorNovedad` | `(0 , faltaFotoPorNovedad) is not a function` | 11/11 verde | — |
| 2.4 / **M4 parte 1** | Predicado → `hayNovedad !== false` | `expected true to be false` (caso `null`/0) | — | Revertido; 11/11 verde |
| 3.1 | P2, alta persiste `hayNovedad` | `expected undefined to be true` | — | — |
| 3.2-3.5 | GREEN: `types.ts`, `db/remisiones.ts`, `routes/remision.ts` | — | P2 verde | — |
| 3.6 / **M6** | `b.hayNovedad ?? null` | `expected true to be null` (caso `'true'` cadena) | — | Revertido; verde |
| 3.7 / **M8** | `toRemision` sin `hayNovedad` | `expected undefined to be true` | — | Revertido; verde |
| 3.8 / **M5 parte 2** | Borrar la `ALTER` de la Fase 1 | migrate.test.ts (36/18) **y** fotoNovedad.test.ts (500) rojas a la vez | — | Revertido; ambos verdes |
| 4.1-4.4 | P3-P6, sexta puerta | P3/P4 rojas (`expected 422 to be 200`); P5/P6 ya verdes (caracterización, sin romper) | — | — |
| 4.5 | GREEN: guarda en `/enviar` | — | P3-P6, 5/5 verde a la vez | — |
| 4.7 / **M1** | Guarda DESPUÉS de `reclamarEnvio` | P4 `409≠200`; P3 `enviado_at` puesto | — | Revertido; 5/5 verde |
| 4.8 / **M2** | Guarda ANTES de «anulada» | P5 (anulada) `422≠409` | — | Revertido; 5/5 verde |
| 4.9 / **M3** | Guarda ANTES de «ya enviada» | P5 (`ok`) `422≠409` | — | Revertido; 5/5 verde |
| 4.10 / **M4 parte 2** | Predicado → `hayNovedad !== false` (con P1 y P6 ya existentes) | remision.test.ts **y** fotoNovedad.test.ts rojas a la vez | — | Revertido; ambos verdes |
| 5.1-5.2 | P7, payload sin `hayNovedad` | Nace **VERDE** (prueba de guardia, no de rojo previo) | 6/6 verde | — |
| 5.3 / **M7** | `hayNovedad` añadido a `RemisionWebhookPayload` | `expected {...} to not have property "hayNovedad"` | — | Revertido; `git diff --stat` de `remisionWebhook.ts` vacío |

Las ocho mutaciones (M1-M8) confirmaron rojo y se revirtieron; `git diff` del árbol no deja restos de
ninguna (verificado fichero a fichero, ver §Cierre de calidad).

## Work Unit Evidence (todos los modos)

| Evidencia | Valor |
|---|---|
| Comando de prueba focalizado | `npx vitest run packages/shared/src/remision.test.ts apps/desk/server/fotoNovedad.test.ts packages/zoho-sync/src/db/migrate.test.ts` → 39/39 verde |
| Arnés de runtime | `npm test` completo contra `pg-mem` (sin credenciales Zoho): **1390/1390 verde, 2 saltadas** (integración pre-existente, no tocada) |
| Frontera de reversión | `git revert` del commit único: columna aditiva y `NULL`-able (queda sin efecto sin `DROP`); guarda de servidor y predicado compartido se retiran con el mismo commit; sin migración de datos que deshacer |

## Fase 6 — comprobación de persona (RQ-RE-19, fuera de la red de pruebas por F0-00)

`npm run typecheck` en verde para `client.ts` y `CrearRemision.tsx` (y el resto del árbol). Las tres
comprobaciones de persona (Persona-1/2/3) **NO se marcan aquí**: son casillas de Servicio Técnico en la
app, no de esta tanda (regla del ciclo 1) — quedan registradas en `tasks.md` bajo «Comprobaciones de
persona», y archivar este cambio no las da por hechas.

## Fase 7 — regla de mutación 3 (con corrección menor #3)

Confirmación decisión a decisión, con la corrección de la validación del diseño ya aplicada:

| Decisión del cliente | Línea del servidor que la impone | Caso |
|---|---|---|
| No deja crear/continuar sin contestar la pregunta (`submit()`, antes del `permitirSegunda`) | Ninguna — `POST /api/remisiones` no exige el campo (IV-12, sin guarda en el alta, a propósito) | **13.2** |
| No deja crear/continuar con «Sí» y 0 fotos (`submit()`, mismo bloque) | `routes/remision.ts:283-289` — pero en **`/enviar`**, un endpoint y un momento distintos del que el cliente bloquea (el alta) | **13.2, corregida frente a `design.md`** — guarda de cliente sin contrapartida en el paso de ALTA; la consecuencia SÍ la impone el servidor más adelante |
| Oculta «Continuar sin fotos» si quedaría en 0 (`!faltaFotoPorNovedad(...)` en la condición del botón) | La misma guarda de `/enviar` | 13.2, misma razón |
| Manda `hayNovedad` sólo como booleano (`hayNovedad ?? undefined`) | `routes/remision.ts:246` normaliza a `true`/`false`/`null` — MISMO endpoint, MISMO momento | **13.3** — espejo legítimo |

Nota dejada en `design.md`, junto a su tabla «Regla de mutación 3», sin reabrir las Decisiones D1-D10.

## Fase 8 — cierre de calidad

| Comando | Resultado |
|---|---|
| `npm test` | **1390 passed, 2 skipped** (141 ficheros verdes, 1 con 2 pruebas de integración saltadas, pre-existente) |
| `npm run typecheck` | Verde, 0 errores (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`) |
| `npm run lint` | **0 errores, 165 warnings** — las 165 son `@typescript-eslint/no-explicit-any` preexistentes; **ninguna** cae en un fichero tocado por este cambio (comprobado grep sobre la salida completa) |
| `npm run build` | Verde (`tsc -b && vite build`), `366.58 kB` el bundle principal, sin avisos nuevos salvo el aviso preexistente de import dinámico/estático de `EquiposAdmin.tsx` |

## Fase 9 — barrido de citas (regla de mutación 4)

**Desplazamiento real, medido (no estimado) — corrige a `design.md`, que estimaba con `≈`:**

| Fichero | Desplazamiento estimado por `design.md` | Desplazamiento REAL medido |
|---|---|---|
| `routes/remision.ts` | +5 desde `:283` | **+7 desde `:283`** (7 líneas: 2 de comentario + `const fotos` + el `if` + 2 líneas de `res.status` + `}`) |
| `CrearRemision.tsx` | +1 desde `:3`, +2 desde `:52`, ≈+5 desde `:93`, ≈+13 desde `:266` | **+1 desde `:3`, +4 desde `:59`, +9 desde `:93`, +25 desde `:270`** (el estado `hayNovedad` lleva 2 líneas de comentario, el bloqueo de `submit()` son 5 líneas, y la pregunta Sí/No con sus dos `<label>` de radio ocupa 16 líneas — todas más largas que la estimación) |
| `schema.sql`, `db/remisiones.ts`, `remisionWebhook.ts` (revertido), `shared/remision.ts`, `index.ts`, `migrate.test.ts`, `remisiones.test.ts`, `client.ts`, `types.ts` | 0 | **0, confirmado** (`git diff --numstat`: `db/remisiones.ts` 5+/5− = 0 netas; `migrate.test.ts` 5+/5− = 0 netas; el resto sólo crece al final del fichero) |

Nota añadida en `design.md` documentando ambos desplazamientos reales, sin reabrir sus Decisiones.

**Barrido COMPLETO ejecutado** (`grep -rnoE "routes/remision\.ts:[0-9]+(-[0-9]+)?"` y
`"CrearRemision\.tsx:[0-9]+(-[0-9]+)?"` sobre todo el repositorio, excluyendo `openspec/changes/archive/`)
— no sólo la lista de `design.md`. Encontró **dos citas que `design.md` no había listado**:
`openspec/specs/remisiones/spec.md:298` (`:330`, restaurar, dentro de la misma frase que `:318`) y la
cita abreviada `:353-363` dentro de la fila M-1 (línea 500), además de la cita completa
`routes/remision.ts:354-356` en la misma fila.

### Reapuntadas (Caso A — el hecho sigue siendo cierto hoy, sólo cambia la línea)

| Fichero | Cita(s) | Antes (`a0a2935`/base) | Ahora |
|---|---|---|---|
| `openspec/specs/remisiones/spec.md` | fila "Qué cierra la remisión" | `:353-363` | `:360-370` |
| ídem | RQ-RE-07 (dos citas) | `:307`, `:309` | `:314`, `:316` |
| ídem | RQ-RE-09 | `:344-346` | `:351-353` |
| ídem | RQ-RE-11 (tabla) | `:363` | `:370` |
| ídem | RQ-RE-12 | `:318`, `:330` | `:325`, `:337` |
| ídem | Alcance del cerrojo (tabla) | `:275-288` | `:275-295` |
| ídem | D-2 (tabla) | `:286-288` | `:293-295` |
| ídem | M-1 (tabla, dos citas) | `:353-363`, `:354-356` | `:360-370`, `:361-363` |
| `openspec/specs/trazas/spec.md` | 3.1 (tres citas) | `:363`, `:358-362`, `:325`+`:335` | `:370`, `:365-369`, `:332`+`:342` |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | (tres citas) | `:363`, `:358-362`, `:325`+`:335` | `:370`, `:365-369`, `:332`+`:342` |
| `docs/sdd/F0-00_Baseline_as-built.md` | e.9 | `:325`,`:335`,`:363` | `:332`,`:342`,`:370` (nota: se reapunta pese a que `design.md` lo marcaba "probable Caso B" — el contenido asertado sigue siendo cierto hoy, no es histórico; se deja constancia de la desviación) |
| ídem | 7.1 P14 | `:302` | `:309` (misma nota que arriba) |
| `docs/superpowers/plans/2026-08-07-ficha-tecnica-modelo.md` | patrón de subir/servir binario | `:367-385` | `:374-392` |
| `CLAUDE.md:220` | H4 (cita "hoy… misma línea") | `CrearRemision.tsx:195` en `d5d66a1` | `CrearRemision.tsx:204` |
| `docs/sdd/ENTRADA.md:1173` | E-080 | `CrearRemision.tsx:264` | `CrearRemision.tsx:273` |

### Caso B (fechado — se nombra la revisión, no se renumera)

| Fichero | Cita | Tratamiento |
|---|---|---|
| `docs/sdd/F0-00_Baseline_as-built.md:137` | `CrearRemision.tsx:16` (inventario réplica/prototipo, commit auditado `a3a8f03`) | Se deja `:16` con nota "en `a3a8f03`"; se añade que hoy (`a0a2935`) es `:17` |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:70` | `CrearRemision.tsx:195` en `d5d66a1` (paquete de despliegue fechado) | Se deja `:195` con nota "en `a0a2935`, cita válida de este paquete"; se añade que hoy es `:204` |
| `docs/superpowers/plans/2026-08-04-remision-entrada-desenlace.md:486` | `CrearRemision.tsx:1-5, 12-44, 49-51` | Histórico congelado (`docs/superpowers/plans`, "materia prima, no autoridad"); rango no renumerable en bloque porque cruza la frontera 0/+1 de desplazamiento; se deja con nota |

### No editado — pendiente para el orquestador

**`openspec/config.yaml` NO se editó**, por instrucción explícita. **Verificado, y no hace falta acción:**
las siete citas a `routes/remision.ts` en `config.yaml` (líneas 570, 586, 1098, 1119, 1188, 1201, 1204)
están **todas en `:127`, `:218-240` o `:230`, ninguna por encima de `:282`** — ninguna se desplaza por
este cambio. No queda nada pendiente sobre `config.yaml` para esta fila.

### Confirmaciones sin cambio

- `CLAUDE.md`: seis citas más a `routes/remision.ts` (`:152-157`, `:153`, `:218-240`, `:127`, `:220`),
  todas `≤:282`, sin desplazamiento.
- `types.ts`: **cero** citas vivas a partir de la línea 730 en todo el repositorio (grep confirmado) — la
  adición de la Fase 3.2 (+3 líneas) no rompe ninguna.
- `client.ts`: las ocho citas encontradas caen todas por debajo de `:280`; la adición de la Fase 6.1
  (+2 líneas, al final de `CrearRemisionPayload`) no desplaza ninguna.
- Segundo pase por la forma ABREVIADA (9.6): hecho sobre `remisiones/spec.md`, `trazas/spec.md`,
  `CLAUDE.md`, `F0-01_Correcciones…md`, `F0-00_Baseline…md` y `config.yaml` — las abreviadas
  encontradas ya están cubiertas en las tablas de arriba.
- `openspec/changes/foto-solo-con-novedad/{proposal.md,tasks.md}` y
  `openspec/changes/foto-solo-con-novedad/specs/remisiones/spec.md` (la DELTA, no la spec canónica):
  **no se tocan**. Son artefactos anclados a `a0a2935` por diseño (la delta declara explícitamente en
  `design.md` que sus abreviadas `:286-288` y `:291` "dejan de ser ciertas tras el apply" y "se
  re-apuntan al cerrar" — trabajo de `sdd-archive`, no de este `sdd-apply`).

## Medida del intento (E-078)

`git add -N apps/desk/server/fotoNovedad.test.ts` (único fichero nuevo del intento; los otros cuatro
`??` del `git status` inicial — `Evidencia_Transporte_Tarea_Programada_2026-09-18.txt`,
`Parte_2026-09-18.md`, `Parte_2026-09-22.md`, `Parte_2026-09-24.md` — ya estaban sin trackear ANTES de
empezar esta tanda, según el `git status` del encargo, y no se indexan aquí: no son de este intento).
`apply-progress.md` (este fichero) se indexa también, antes de la medida final.

`git diff --shortstat --no-renames d5d66a1` (base del apply, que YA incluye los 749 líneas de
`proposal.md`+`design.md`+`tasks.md`+delta `spec.md` creados por ese mismo commit — no se cuentan dos
veces):

- **Antes de indexar `apply-progress.md`:** 20 ficheros, **295 inserciones, 40 borrados = 335 líneas**
  (código, pruebas y barrido de citas).
- **Con `apply-progress.md` indexado (medida final del intento, este mismo párrafo incluido — el
  recuento es recursivo y se acepta la última cifra sin perseguir la cola):** **22 ficheros, ~540
  inserciones, 87 borrados ≈ 627 líneas.** Casi todo el crecimiento sobre los 335 de código+pruebas es
  `apply-progress.md` (este fichero) más las 47 casillas de `tasks.md` que pasan de `[ ]` a `[x]` (cada
  una cuenta 1 borrado + 1 inserción en el diff).

Contraste contra la estimación de `tasks.md` (~505-580 para el lote completo): la medida real, **≈627**,
queda por encima de esa banda pero **bien por debajo del techo de 800** del ledger de `sdd-attempt`
(margen de ~173 líneas). El exceso frente a la estimación es la extensión del propio `apply-progress.md`
(más detallado que el precedente de 76-272 por las tablas del barrido de citas real vs. estimado) y las
notas de reapuntado añadidas en `CLAUDE.md`, los tres ficheros `docs/sdd/*` y los dos `openspec/specs/*`
— no hay código de producción sin contar.

## Deviations from design

1. **Desplazamiento de líneas mayor al estimado** (ver tabla de la Fase 9): `routes/remision.ts` +7 en
   vez de +5; `CrearRemision.tsx` con offsets reales mayores en cada tramo. No cambia ningún
   comportamiento ni requisito — sólo las líneas de destino del barrido de citas, ya corregidas.
2. **Dos citas que `design.md` no había listado** (`spec.md:298` con `:330`, y la abreviada `:353-363`
   de la fila M-1) se encontraron con el barrido completo (no sólo la lista del diseño) y se
   reapuntaron igual que las demás.
3. **Clasificación Caso A en vez de Caso B** para `F0-00_Baseline_as-built.md:173` y `:468`: `design.md`
   las marcaba "probable Caso B", pero al leer la frase completa (regla de método) el contenido
   asertado sigue siendo cierto HOY, no es un hecho fechado que haya dejado de serlo — es Caso A. Se
   reapuntaron con una nota que dice la revisión de todos modos, por transparencia.

Ningún desvío cambia el enfoque técnico, las Decisiones D1-D10, ni los criterios de aceptación.

## Issues Found

Ninguno. Las 1390 pruebas pasan, typecheck y build en verde, lint sin warnings nuevos.

## Pendiente para el orquestador (Fase 10.3-10.4)

- **10.3** Commit del lote — no ejecutado por esta fase, por encargo explícito.
- **10.4** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` — sólo se puede correr
  DESPUÉS del commit, contra un árbol ya commiteado; diferido igual que en el precedente
  `edicion-comercial-equipo`.
