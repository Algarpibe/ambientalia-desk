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
| `openspec/changes/fechas-derivadas-servidor/design.md:246`, `:249`, `:250` | tabla regla de mutación 3: `:130` deriva, `:132` valida | Presente, describe el árbol de hoy | Sin cambio |
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

## Unidad B — cliente + cierre (objetivo rescopeado, gen. 4, resto de la unidad B)

**Intento único**, rama `f1a-07-r1`, base `02c8ac2` (§4.1 ya reparado). Tareas: `tasks.md` B.1–B.7;
contratos: `design.md` §4.3, §8, §9. `strict_tdd`.

### B.1 — `apps/desk/src/lib/valoresTransicion.ts`, RED antes que GREEN

| Fase | Qué | RED | GREEN |
|---|---|---|---|
| B.1.1 | Invertir las dos «ya guarda gana» (`:33-40`, `:117-123` antes de editar) a «gana SIEMPRE lo derivado» | ✅ por aserción | ✅ |
| B.1.2 | Caso nuevo: sin fuente, se conserva lo que el ticket ya trae | ➖ nace verde (ver nota) | ✅ |
| B.1.3 | Repropósito de `:100-104` como demostración de zona (`describe.each`, tres condiciones) | ✅ natural | ✅ |

**B.1.1/B.1.3 — RED por aserción, contra el código de antes de B.1.4:**
```
npx vitest run apps/desk/src/lib/valoresTransicion.test.ts
× valoresConocidos > con fuente disponible, gana SIEMPRE lo derivado, no lo que el ticket ya guardaba
  expected '2026-01-01' to be '2026-08-06'
× valoresConocidos · Fecha Revisión Informe > zona · UTC > el día de 2026-09-10T00:30:00Z…
  expected '2026-09-10' to be '2026-09-09'
× valoresConocidos · Fecha Revisión Informe > con fuente disponible, gana SIEMPRE lo derivado…
  expected '2026-01-01' to be '2026-08-10'
Test Files  1 failed (1)
     Tests  3 failed | 13 passed (16)
```
El bloque `zona · America/Bogota` pasa **verde en falso** con el código viejo (getters locales, bajo
`vi.stubEnv('TZ','America/Bogota')` coincide con la zona de negocio) — exactamente lo que predice
`design.md` §6.4, y por eso no cuenta como fallo.

**B.1.2 — nace verde, no regresión (excepción declarada, mismo molde que `2026-02-28` en A.3.3):** sin
ninguna fuente, el ternario viejo (`yaEsta(cf[...]) ? cf[...] : diaLocal(...)`) YA devolvía el valor de
`customFields` cuando lo había — `diaLocal(undefined)` da `null`, pero el ternario ni lo evalúa. El caso
nuevo coincide con el viejo por construcción; no hay contraste que producir.

**B.1.4 — GREEN**, en sitio (`design.md` §4.3): `:1` añade `fechasDerivadas` a la desestructuración;
cabecera reescrita; `diaLocal` borrado; `valoresConocidos` pasa a
`derivadas[etiqueta] ?? (yaEsta(cf[etiqueta]) ? cf[etiqueta] : null)` con
`derivadas = fechasDerivadas({ createdAt, remisiones, escaladoARevisionAt })`.

**B.1.5 — verde:**
```
npx vitest run apps/desk/src/lib/valoresTransicion.test.ts
Test Files  1 passed (1)
     Tests  16 passed (16)
```

### B.2 — Regla de mutación 3 (transcrita y verificada contra el código final)

| Decisión del cliente | Dónde | Línea del servidor que la impone |
|---|---|---|
| Prellena la derivada cuando hay fuente | `valoresConocidos` | `ticketService.ts:130` → `valoresConFechasDerivadas` (D-1). Espejo legítimo: los criterios 1-5/P-a/P-b de la unidad A están en verde |
| La enseña bloqueada | `TransitionPanel.tsx:32-36` (`yaLoTraeElTicket`), `:174` | La misma: el servidor ignora lo que llegue (D-1) |
| Sin fuente, prellena la columna y la bloquea | `valoresConocidos` y `TransitionPanel.tsx:32-36` | **Ninguna, a propósito**: sin fuente el servidor acepta cualquier fecha real (D-3). El bloqueo es comodidad genérica del panel, no regla |
| Sin fuente ni columna, deja teclear | `TransitionPanel.tsx:254` (`type="date"`) | Presencia `transitionExec.ts:77`; validez `ticketService.ts:132` (`erroresFecha`) |
| Manda `YYYY-MM-DD` | `TransitionPanel.tsx:254` | `ticketService.ts:132` |
| *Hipótesis:* no manda las tres en transiciones que no las declaran | `TransitionPanel` | P-2 en `valoresEfectivos`: el servidor las descarta igual |

Las cinco citas de código se releyeron contra el árbol de hoy (post-B.1.4): todas describen el
contenido actual, ninguna quedó apuntando al `diaLocal` borrado.

### B.3 — Regla de mutación 4, resto (B.3.1, B.3.2, B.3.4 — B.3.3 ya cerrado en la gen. 3)

**B.3.1 · `valoresTransicion.ts`.** Grep propio confirma: `F0-00_Baseline_as-built.md:147,574` y
`design.md:235` citan `:3-17` (cabecera); `proposal.md:33`, `exploration.md` y `specs/trazas/spec.md:180`
citan el cuerpo viejo (`:49-79`, `diaLocal:30-36`) — los tres documentos están AUTO-declarados caso B
(«tras el apply, este documento es caso B de la regla 4», `design.md:8`; «en cuanto el apply mueva
líneas», `proposal.md:14`; `exploration.md` fecha su propio árbol en la cabecera) y las líneas SÍ se
movieron (`:49-79`→`:35-67`, `diaLocal` desaparece). Único fix real: `design.md:235` apuntaba a
`config.yaml:434` (mi propio B.4.1 lo desplazó a `:442`) — corregido.

**B.3.2 · `bodegaje.ts`, rango `:60-66`→`:59-65` (preexistente, cuatro sitios).** Verificado contra el
código (`packages/shared/src/bodegaje.ts:59-65`, el objeto `entrada` completo). Corregidos:
`openspec/config.yaml` (dentro de la ficha IV-2, ahora `:476`), `openspec/specs/trazas/spec.md:274`,
`docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:224`. El cuarto sitio, `CLAUDE.md:338`, desapareció
solo: era la misma fila que B.4.2 borró.

**B.3.4 · Barrido de `CLAUDE.md`, `config.yaml`, `ENTRADA.md`.** `config.yaml` desplazó **+8** líneas
desde `estado: CERRADO` de IV-2 (verificado con dos anclas de control: IV-3 `:479`→`:487`). Barrido
completo de citas externas a `config.yaml` por encima de esa línea: la mayoría —`reconciliacion/spec.md`
(11), `F1A-05_Auditoria...:46`— están **ancladas a una revisión** (`en ce93480`, `en 648432d`) y son caso
B por diseño, sin tocar. Sin anclar y con contenido presente, se corrigieron: `CLAUDE.md:344`
(`:1467-1484`→`:1475-1492`, `:824-829`→`:832-837`), `F0-01_Correcciones_para_el_maestro.md:15`
(`:1677`→`:1685`, verificado contra el texto «Actualizar el Anexo H…»), `R08.3_Expediente_de_cambios.md`
(`:1524-1562`→`:1532-1570`, `:1525`→`:1533`, verificado contra `unidad_de_avance:`).
`CLAUDE.md` desplazó **+13** desde el §308 (verificado con dos anclas: los bloques R-1/R-2 de
`openspec/config.yaml → capabilities`, `:424→:437`, `:454→:467`). Corregidos:
`openspec/specs/citas-verificables/spec.md:942` y `openspec/specs/reconciliacion/spec.md:281`.
Los citantes DE `CLAUDE.md:338`/`:308` desde dentro del propio cambio (`design.md:239`, `proposal.md:200-203`,
`tasks.md:210-214`) son instrucciones/planes fechados contra `4976787` (caso B declarado) o quedaron
moot por la fila borrada; no se tocan. `F0-01_Correcciones_para_el_maestro.md` pasó de 858 a 898 líneas;
las tres citas que lo nombran (`:704`, `:129`×2) siguen dentro de rango.

### Cierre de la unidad B

```
npm test          → Test Files 130 passed | 1 skipped (131) · Tests 1222 passed | 2 skipped (1224) · exit 0
                     (una corrida previa dio "[vitest-worker]: Timeout calling onTaskUpdate" con 2
                     errores de RPC — el margen de 60s de design.md §10 nota 2; repetida en solitario,
                     limpia)
npm run typecheck → exit 0
npm run lint      → ✖ 158 problems (0 errors, 158 warnings) · exit 0 — mismo techo que la unidad A
```
1222 = 1218 (unidad A) + 4 (B.1: 2 inversiones sin cambio de cardinalidad, −1 test viejo +4 de zona,
+1 de B.1.2 = +4 neto).

**Medida de este intento** (gen. 4, base `02c8ac2`): `git diff --shortstat --no-renames 02c8ac2` →
**140 insertions(+), 67 deletions(-)**, 12 ficheros. Techo 800, muy por debajo.
**Acumulada de la unidad B completa** (contra el commit de la unidad A, `98cbda7`, incluye también la
gen. 3 ya settleada): `git diff --shortstat --no-renames 98cbda7` → **214 insertions(+), 72 deletions(-)**,
17 ficheros.

Desviaciones de diseño: ninguna. `TransitionPanel.tsx` sin diff (comodidad ya probada, regla 13.3, no
tocado). Comprobaciones de persona (regla del ciclo 1, fuera del recuento): las (a)/(b) de la unidad A
siguen fuera del repositorio; sin novedad en B.

### Detector, sobre el commit FINAL (Q6: no sobre uno anterior)

Primer commit de cierre, `b4c3bcf`: `tsx apps/desk/server/citas/cli.ts --sha b4c3bcf` → **exit 1**, 2
bloqueantes, los dos causados por B.1.4 (`diaLocal` borrado, `valoresConocidos` desplazado): `exploration.md:53`
citaba `valoresTransicion.ts:20` (línea vacía hoy; `yaEsta` está en `:22`) y `proposal.md:33` citaba
`valoresTransicion.ts:49-79` (fuera de rango, el fichero tiene hoy 68 líneas). Reparados: el primero se
renumera (`:22`, sigue siendo cierto hoy); el segundo se ancla a `4976787` (caso B — el párrafo describe
el problema que motivó la tanda, no el árbol de hoy) en vez de renumerarse. Commit `7e64c30`.
```
tsx apps/desk/server/citas/cli.ts --sha 7e64c30
comprobadas 2154 · saltadas 2056 · abreviadas rotas 11 (mismas de siempre, informativas) ·
cabeceras R-1 inválidas 0 · exit 0
```
