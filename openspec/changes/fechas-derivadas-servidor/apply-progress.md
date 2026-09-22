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
