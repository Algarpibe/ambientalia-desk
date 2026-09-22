# Apply progress — `fechas-derivadas-servidor` (F1A-07 · IV-2), Unidad A

**Intento 1** (unidad A: shared + servidor), rama `f1a-07-r1`, base `b3c089b`. `strict_tdd`. Tareas y
método: `tasks.md` A.1–A.7; contratos: `design.md` §3-§4. Aquí sólo va la evidencia.

## TDD Cycle Evidence

| Fase | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| A.1 `fechasDerivadas` | `packages/shared/src/fechasDerivadas.test.ts` | Unit | N/A (nuevo) | ✅ 13/23 por aserción (esqueleto) | ✅ 23/23 | ✅ 5 ramas + 3 fuentes + D-1/D-3/P-2 | ➖ |
| A.1.5 zona | mismo fichero, `describe.each` | Unit | — | ✅ A.5.5 | ✅ 4/4 | ➖ | ➖ |
| A.2 `bodegaje.dia()` | `packages/shared/src/bodegaje.test.ts` | Unit | ✅ 21/22 | ✅ por aserción | ✅ 22/22 | ➖ | ➖ neto 0 |
| A.3–A.4 `executeTransition` | `apps/desk/server/services/valoresDeTransicion.test.ts` | Integración (pg-mem) | N/A (nuevo) | ✅ 10/11 contra HOY | ✅ 11/11 | ✅ 5 criterios + P-a/P-b | ➖ |

## A.1.2 — RED por aserción (esqueleto)
```
npx vitest run packages/shared/src/fechasDerivadas.test.ts
× diaEnZona · las cinco ramas de A-5 > 1 · una YYYY-MM-DD real pasa tal cual, sin desplazarse de día
× fechasDerivadas · las tres fuentes > deriva las tres cuando las tres fuentes están disponibles
× valoresEfectivos > D-3 · sin fuente, lo tecleado inválido da el mensaje exacto
  AssertionError: expected [] to deeply equal [ Array(1) ]
Test Files  1 failed (1)
     Tests  13 failed | 10 passed (23)
```
GREEN (A.1.3): `Tests 23 passed (23)`. A.1.5 (`-t zona`): `Tests 4 passed | 19 skipped (23)`.

## A.2.1 — RED por aserción (P-3)
```
npx vitest run packages/shared/src/bodegaje.test.ts
× F1A-07 · IV-2 — dia() consume diaEnZona, no el día UTC > 21 · un instante en la ventana 00:00–04:59 UTC…
  - Expected  { desde: "2026-02-01", dias: 8 }
  + Received  { desde: "2026-02-02", dias: 7 }
Tests  1 failed | 21 passed (22)
```
GREEN (A.2.2): `Tests 22 passed (22)`.

## A.3.3 — RED contra el `executeTransition` de HOY

Salida literal, recortada. **Regenerada por el orquestador el 2026-09-21** para sustituir un resumen
redactado: `ticketService.ts` de `b3c089b` restaurado temporalmente, misma prueba, y vuelta al índice con
`git checkout --` (`git diff` 0 líneas, `wc -l` 221).
```
npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts
× 1 · navegador ≠ derivado en las tres: gana SIEMPRE el derivado (D-1) > 1a · «Fecha creación ticket» y «Fecha Remisión Entrada» (ingreso_a_servicio)
  → expected '2020-01-01' to be '2026-09-09' // Object.is equality
× 1 · navegador ≠ derivado en las tres: gana SIEMPRE el derivado (D-1) > 1b · «Fecha Revisión Informe» (reporte_por_garantia)
  → expected '2020-01-01' to be '2026-09-09' // Object.is equality
✓ 4 · sin fuente: lo tecleado válido pasa, lo inválido da 422 con el mensaje > «2026-02-28» pasa (no regresión: ya pasaba hoy sin este módulo)
× 5 · P-2: «Fecha Remisión Entrada» enviada en una transición que no la declara no llega al historial
  → expected true to be false // Object.is equality
FAIL … > 2 · «Fecha Remisión Entrada» toma la entrada VIGENTE más reciente, …
Error: HttpError
 ❯ executeTransition apps/desk/server/services/ticketService.ts:132:33
    132|   if (plan.errors.length) throw new HttpError(422, { errors: plan.erro…
FAIL … > 3 · con fuente, la transición pasa aunque el navegador no mande las fechas
Error: HttpError
 ❯ executeTransition apps/desk/server/services/ticketService.ts:132:33
FAIL … > «2026-02-30» (día que no existe) …
Error: Invalid timestamp format: 2026-02-30
FAIL … > «10/09/2026» (formato distinto de YYYY-MM-DD) …
FAIL … > «2026-09-10T00:30» (fecha-hora sin desplazamiento) …
Error: se esperaba un HttpError y la llamada no lanzó ninguno
FAIL … > P-a · sin remisión, fecha inválida Y derivado_a inexistente: SÓLO el error de fecha …
-   "Fecha inválida en el campo: Fecha Remisión Entrada",
+   "Falta el campo obligatorio: Fecha creación ticket",
FAIL … > P-b · lo mismo, y ADEMÁS sin «Código Servicio»: los dos errores, presencia antes que validez
    "Falta el campo obligatorio: Código Servicio",
-   "Fecha inválida en el campo: Fecha Remisión Entrada",
+   "Falta el campo obligatorio: Fecha creación ticket",
 Test Files  1 failed (1)
      Tests  10 failed | 1 passed (11)
```
Excepción declarada: `2026-02-28` nace verde. El rojo de `2026-02-30` no es por aserción: hoy nadie valida
la fecha y pg-mem rechaza la escritura en la columna `date`. GREEN (A.4): `Tests 11 passed (11)`.

## A.5 — Mutaciones (método: preámbulo de A.5 en `tasks.md`)

**A.5.1 · P-a** (`erroresFecha` detrás de la guarda de derivación). Revertido: `git diff -- ticketService.ts` → 0 líneas.
```
npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts -t "P-a"
- "Fecha inválida en el campo: Fecha Remisión Entrada"
+ "La persona a la que se deriva no existe o está dada de baja"
Tests  1 failed | 10 skipped (11)
```
**A.5.2 · P-b** (`[...erroresFecha, ...plan.errors]`). Revertido: `git diff -- ticketService.ts` → 0 líneas.
```
npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts -t "P-b"
- "Falta el campo obligatorio: Código Servicio",
- "Fecha inválida en el campo: Fecha Remisión Entrada",
+ "Fecha inválida en el campo: Fecha Remisión Entrada",
+ "Falta el campo obligatorio: Código Servicio",
Tests  1 failed | 10 skipped (11)
```
**A.5.3 · P-2** (sin el filtro de las tres etiquetas en `valoresEfectivos`). Revertido: `git diff --
fechasDerivadas.ts` → 0 líneas. *Nota:* el `true` es que `Fecha Remisión Entrada` llega al historial de
`escalado_a_revision`.
```
npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts -t "P-2"
expected true to be false
Tests  1 failed | 10 skipped (11)
```
**A.5.4 · `diaEnZona` con día UTC** (`toISOString().slice(0,10)`). Revertido: `git diff -- fechasDerivadas.ts` → 0 líneas.
```
npx vitest run packages/shared/src/fechasDerivadas.test.ts -t zona
× zona · UTC > el día de 2026-09-10T00:30:00Z…            expected '2026-09-10' to be '2026-09-09'
× zona · America/Bogota > el día de 2026-09-10T00:30:00Z…  expected '2026-09-10' to be '2026-09-09'
Tests  2 failed | 2 passed | 19 skipped (23)
```
**A.5.5 · `diaEnZona` con la noción vieja de `diaLocal`** (getters locales): fase roja de la demostración
de zona de shared (condición 3 del analista). Revertido: `git diff -- fechasDerivadas.ts` → 0 líneas.
*Nota:* el último `✓` es el verde EN FALSO: bajo `vi.stubEnv('TZ', 'America/Bogota')` la zona del proceso
coincide con la de negocio.
```
npx vitest run packages/shared/src/fechasDerivadas.test.ts -t zona
× zona · UTC > el día de 2026-09-10T00:30:00Z…  expected '2026-09-10' to be '2026-09-09'
✓ zona · UTC > autocomprobación propia…
✓ zona · America/Bogota > autocomprobación propia…
✓ zona · America/Bogota > el día de 2026-09-10T00:30:00Z…
Tests  1 failed | 3 passed | 19 skipped (23)
```

## A.6, A.7 — Invariantes, docker y suite

Sin diff: `git diff --stat -- apps/desk/server/transitionExec.ts packages/zoho-sync/src/db/repo.ts
vitest.config.ts` → vacío. `ticketService.ts` `+4/-4`, `wc -l` 221 → 221; `bodegaje.ts` `+4/-4`, 236 → 236.
```
docker run --rm node:22-alpine node -e "const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date('2026-09-10T00:30:00Z'));const v=t=>p.find(x=>x.type===t).value;console.log(v('year')+'-'+v('month')+'-'+v('day'))"
2026-09-09
exit=0
npm test          → Test Files 130 passed | 1 skipped (131) · Tests 1218 passed | 2 skipped (1220) · exit 0
npm run typecheck → exit 0
npm run lint      → ✖ 158 problems (0 errors, 158 warnings) · exit 0
```
Docker 29.6.2. Suite, en solitario. 158 avisos = techo del CI (`eslint.config.js:14-15`), ninguno de la
tanda. Docker y suite repetidos por el orquestador, mismas salidas. Desviaciones de diseño: ninguna
(`design.md` §3 literal en `ticketService.ts:6`, `:7`, `:130`, `:132`; `bodegaje.ts` en sitio, A-9).
Medida del ledger: en el commit de la unidad A. Comprobaciones de persona: `tasks.md`, fuera del recuento.

## B.3 — Barrido de la regla de mutación 4 tras la unidad A (objetivo rescopeado, gen. 3)

**Intento único** (rescope 200 líneas / 1 intento real, `cumulative_attempts` heredado del `interrupted`
de la gen. 2), rama `f1a-07-r1`, base `98cbda7`. Evidence-goal: cada cita viva a `ticketService.ts:6`,
`:7`, `:130`, `:132` y `bodegaje.ts:19`, `:129-133` leída y reparada o justificada por caso; detector en
modo hook exit 0.

### Inventario (grep propio sobre `98cbda7`, no la lista heredada)

Formas completas (`grep -rnoE "ticketService\.ts:(6|7|130|132)\b"` y `"bodegaje\.ts:19\b"` /
`"bodegaje\.ts:12[0-9]-13[0-9]"`) confirmaron el inventario recibido: toda cita a `bodegaje.ts:19` o
`:129-133` vive dentro de la carpeta del cambio; de `ticketService.ts:6`, `:7`, `:130`, `:132`, la única fuera de
la carpeta es `openspec/specs/transitions-st/spec.md:584`. Segundo pase (abreviadas, sin nombre de
fichero) en los ficheros que ya citan el módulo: encontró además la fila 7/8 de la tabla de
`RQ-TS-06` en la MISMA spec viva (`:164`, abreviada `:132-136`) y la fila 5 (`:162`, abreviada `:132`) —
ninguna de las dos aparecía en la lista completa por ser abreviada. Verificado contra `docs/sdd/ENTRADA.md`
E-023 (`:316-341`): esas dos filas viven dentro de `RQ-TS-06`, uno de los TRES bloques que el propio
delta de F1A-07 reescribe (`specs/transitions-st/spec.md` del cambio, `:34-47`, ya trae las OCHO filas
reancladas contra `4976787`, con evidencia `:121`, `:123`, `:124-126`, `:127-129`, `:132`, `:132`,
`:136-140`, `:146-150`) — se sobrescriben enteras al archivar, así que tocar la tabla vieja ahora sería
trabajo perdido (`tasks.md` «Para el archive» lo dice explícitamente: las anclas de los deltas se
comprueban contra el árbol del momento del archive, no ahora). `:584` vive en §3.4 («la tercera puerta de
la orden de venta»), que NINGÚN delta reescribe: por eso es la única reparación directa de fuera de la
carpeta, tal como decía el encargo.

### Tabla cita a cita

| Dónde | Qué afirma | Caso | Qué se hizo |
|---|---|---|---|
| `openspec/specs/transitions-st/spec.md:584` | «`ticketService.ts:132-136` (movida detrás de la guarda de derivación, `:144`)», evidencia del 409 de unicidad de OV en `habilitar_servicio` | Roto por contenido — hoy `:132` es el 422 de fechas derivadas, no la OV; el bloque real es `:146-150` | Reparado entero: evidencia → `:146-150` (detrás de `:136-140`), con nota explícita de por qué `:132` ya no vale. Única excepción a «E-023 no se toca» |
| `openspec/changes/fechas-derivadas-servidor/specs/trazas/spec.md:173` | «`dia()` … hoy usa `toISOString().slice(0,10)`, día UTC» | Roto por contenido — hoy delega en `diaEnZona` | Reparado: «tras `fechas-derivadas-servidor` delega en `diaEnZona`; antes usaba `toISOString()…`» |
| `openspec/changes/fechas-derivadas-servidor/specs/trazas/spec.md:198` | GIVEN `'2026-09-09'` pasado a `dia()` (`bodegaje.ts:129-133`) | Cita de posición pura, sin afirmación de contenido | Sin cambio — sigue siendo cierta |
| `openspec/changes/fechas-derivadas-servidor/specs/transitions-st/spec.md:72` | `executeTransition` (`:132`) valida contenido fuera de `buildTransitionPlan` | Presente, describe el árbol de hoy | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/specs/transitions-st/spec.md:80` | el llamador traduce a `422` en `:132` | Presente, describe el árbol de hoy | Sin cambio |
| `packages/shared/src/fechasDerivadas.ts:106` | comentario: el `422` de `ticketService.ts:132` impide escribir `erroresFecha` | Presente, describe el árbol de hoy | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/proposal.md:64` | P-3: «`dia()`… Hoy es otra noción… (`toISOString`, día UTC)» | Roto por contenido, mismo caso que trazas:173 | Reparado: «Antes de esta tanda era otra noción…; tras la unidad A, `dia()` delega en `diaEnZona`» |
| `openspec/changes/fechas-derivadas-servidor/proposal.md:197` | meta: `:130`/`:132` cambian de contenido sin moverse | Es la regla misma, no una cita de comportamiento | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/design.md:32` (A-9) | `bodegaje.ts:19` pasa a import; `:130-132` a comentario+`return` | Prescriptivo, coincide con lo implementado | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/design.md:246,:249,:250` | tabla regla de mutación 3: `:130` deriva, `:132` valida | Presente, describe el árbol de hoy | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/exploration.md:99` | 422 en `transitionExec.ts:77`, `ticketService.ts:132` | Presente, describe el árbol de hoy | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/tasks.md:6` | cabecera: `:130`/`:132` cambian de contenido sin moverse | Meta, correcto | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/tasks.md:71-72` (A.2.2) | `bodegaje.ts:19` → import; `:129-132` → comentario+`return` | Rango impreciso: `:129` es la firma de `dia()`, no cambió | Reparado: `:129-132` → `:130-132` |
| `openspec/changes/fechas-derivadas-servidor/tasks.md:125` (A.4.2) | `:6`,`:7`,`:130`,`:132` — texto exacto del diseño | Prescriptivo, coincide 1:1 con lo implementado | Sin cambio |
| `openspec/changes/fechas-derivadas-servidor/tasks.md:217` (B.3.3) | cita como ejemplo de «lo viejo» `transitions-st/spec.md:162, fila 5 de RQ-TS-06` | Correcto como ejemplo — esa fila SÍ está caduca, pero vive en el bloque que el delta reescribe entero al archivar | Sin cambio (no es trabajo de esta rebanada; ver inventario arriba) |
| `openspec/changes/fechas-derivadas-servidor/tasks.md:293` | meta: anclas de los deltas se comprueban en el archive, no ahora | Correcto | Sin cambio |
| `openspec/specs/transitions-st/spec.md:162` (fila 5, RQ-TS-06) y `:164` (fila 7) | evidencia `:128` y `:132-136` — abreviadas, encontradas en el 2º pase | Rotas por contenido, pero dentro de un bloque que el delta de F1A-07 reescribe entero al archivar | Sin cambio ahora — se resuelven solas al fusionar el delta (ya reanclado, `:34-47` del delta) |

### Cierre

```
git diff --shortstat --no-renames 98cbda7
 4 files changed, 7 insertions(+), 5 deletions(-)
```
Commit `32ec47f` (antes del settle).
```
tsx apps/desk/server/citas/cli.ts --sha 32ec47f
comprobadas 2098 · saltadas 1959 · abreviadas rotas 11 (informativas, preexistentes, ninguna de esta
tanda — incluye Puntos_para_Gerencia_2026-09-11.md:167 → ticketService.ts:128, parte del mismo E-023) ·
cabeceras R-1 inválidas 0 · exit 0
```
```
npm test → Test Files 130 passed | 1 skipped (131) · Tests 1218 passed | 2 skipped (1220) · exit 0
```
Sin diff en código vivo: los cuatro ficheros tocados son documentales (dos specs delta, `proposal.md`,
`tasks.md`, y la spec viva `transitions-st`). `npm run typecheck`/`lint` no aplican (sin `.ts` de
producción tocado).
