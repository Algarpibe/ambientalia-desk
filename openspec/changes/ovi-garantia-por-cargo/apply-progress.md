# Apply-progress · `ovi-garantia-por-cargo` · lote 1 (`packages/shared`), partida `38078cc`

Tareas 1.1-1.11 hechas. Los lotes 2 y 3 no se tocan. Sin commit.

## Rojo → verde (`npx vitest run <fichero>`)
- 1.1 `subOV.test.ts` · rojo: 13 casos de `esOVI` con «esOVI is not defined» (el `it.each` de verdaderos y el de falsos); la CARACTERIZACIÓN de `clasificarOV` nació verde. Verde tras 1.2: 53 pruebas.
- 1.3 `ordenOVI.test.ts` · rojo: «Cannot find module './ordenOVI'»; tras crear el módulo con `cargos.ts` sin cambiar, 9 rojas en `motivoCargoOVI` (el Director Técnico sin área no pasaba, los demás cargos y el administrador por falta de `areas`). Verde tras 1.6.
- 1.5 `cargos.test.ts` · rojo: `:118-123` («expected false to be true») y PM20-2 («Array(1)» ≠ `['shared/src/ordenOVI.ts']`). El barrido 1.815 nació VERDE (sólo se quitó la línea de la primitiva y se cambió el número; es test-only). Verde tras 1.6 (40 ficheros, 1.034 pruebas en `packages/shared`).
- Pruebas nuevas: 14 en `subOV.test.ts` (13 casos de `esOVI` + 1 caracterización) y 26 en `ordenOVI.test.ts`; `cargos.test.ts` en sitio, sin pruebas añadidas.

## Mutaciones (cada una restaurada; `git diff` final sin restos)
| Id | Qué cambié | Roja |
|---|---|---|
| M-SH-1a | `PREFIJO_OVI = /^OVI-/` (sin `i`) | `esOVI … " ovi-2026-001 "`; `motivoCargoOVI … una OVI mal formada y en minúsculas sí` |
| M-SH-1b | `PREFIJO_OVI = /^OVI-\d{4}-\d{3,}/i` (sintaxis completa) | `esOVI … "OVI-26-1"`; `motivoCargoOVI … una OVI mal formada y en minúsculas sí` (sólo esas dos) |
| M-SH-1c | área Servicio Técnico devuelta a `puedeCrearOVIGarantia` | `cargos.test.ts … puedeCrearOVIGarantia: sin área, basta el cargo Director Técnico`; `ordenOVI.test.ts … motivoCargoOVI … Director Técnico` |
| M-RC-1 (parcial) | `ordenesQueEntran` sin la condición «ya la traía» | `número igual: no entra`, `número igual tras recortar: no entra`, `mismo salesorderId con número distinto: no entra (id igual)` |

## Cuatro comandos (códigos de salida)
`npm test` = 0 (234 ficheros pasan, 2 saltados; 3.562 pruebas, 7 saltadas) · `npm run typecheck` = 0 · `npm run lint` = 0 · `npm run build` = 0.

## Medida
`git diff --shortstat --no-renames 38078cc`: 6 ficheros, 44 inserciones, 18 borrados = 62; más `wc -l` nuevos: `ordenOVI.ts` 68 y `ordenOVI.test.ts` 111 = 179. **Total 241** frente a 387 (×1,8) y 720: holgado.
`git diff --numstat`: `cargos.ts` 5/5, `cargos.test.ts` 10/10, `index.ts` 1/1, `mantenimientoNovedades.ts` 1/1, `subOV.ts` 12/0 (sólo por el final), `subOV.test.ts` 15/1.

## DESVIACIONES
1. Los números de línea del diseño para `cargos.test.ts` (`:117-123`, `:185`, `:204-205`, `:226-229`) son los reales del árbol (título en `:117`); se editó en sitio con el mismo número de líneas.
2. Texto del `403`: se usó el de `design.md` §3 («La orden de venta ${n} es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico»); `specs/permissions/spec.md` RQ-PM-24 escribe «Asociar una orden OVI a un ticket sólo lo hace el cargo Director Técnico». No coinciden: decide el orquestador antes del lote 2 (las pruebas HTTP deben fijar uno).
3. `ordenesQueEntran` recorta también los números que el ticket ya tiene antes de compararlos (diseño: sólo el recibido); no cambia ningún caso del diseño.
4. `puedeCrearOVIGarantia` ahora acepta `Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>` (diseño §3).
