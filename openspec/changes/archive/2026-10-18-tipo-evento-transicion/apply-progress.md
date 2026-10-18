# Progreso del apply — `tipo-evento-transicion` (F1C-04)

`strict_tdd` activo. Cada fila dice la prueba, el rojo visto y el verde. Base del lote 1: `67670be`.

## Lote 1 — el tipo cerrado en los catálogos (intento 3)

| Tarea | Rojo visto | Verde |
|---|---|---|
| 1.1 línea base | — | `npm run typecheck` en 0; `tsc -p packages/shared` con 2 errores (`fasesBlueprint.test.ts:33`, `reasignacion.test.ts:60`), vueltos a medir; `transitions.ts` 397 líneas |
| 1.2 `tipoEvento.test.ts` (77 líneas, tabla de 47 filas escrita a mano) | `Failed to load url ./tipoEvento ... Does the file exist?`, 0 pruebas | — |
| 1.3 `tipoEvento.ts` (15 líneas), barril en `index.ts` (línea nueva al final), `:60` | vitest: 6 de 9 en rojo (tabla, resolutor, recuentos, barrido, ejemplo, RQ-TS-45); `tsc` shared: 56 errores (2 ajenos + 54: 45 en `transitions.ts`, 5 en `tipoEvento.test.ts`, 2 en `mapaBlueprint.test.ts`, 1 en `sla.test.ts`, 1 en `tipoEvento.ts`); `npm run typecheck`: 92 líneas de error (90 en `transitions.ts` = 45 × 2 programas, 2 en `tipoEvento.ts`) | — |
| 1.4 los 47 valores en su línea y los seis literales de D4 | tras los 47 valores, `typecheck` aún rojo con 6 literales (`avisoArea.test.ts:48`, `transitionExec.test.ts:296-298,305` ×4 usos de 2 literales) y `tsc` shared con 4 (`mapaBlueprint.test.ts:200,294`, `sla.test.ts:8`) | `tipoEvento.test.ts` 9/9; `typecheck` 0; `tsc` shared otra vez los 2 ajenos y ninguno nuevo. Sin literales fuera de D4 |
| 1.5 guarda de D2 | — | `wc -l` 397 = 397; `--numstat` `47 47`; `:300` y `:348` intactas; `comentariosVigilados.test.ts` verde (15/15 junto a la nueva) |

`:150-151` llevan `tipoEvento: 'Compras / Logístico' } satisfies Omit<Transition, 'fields'>`. `:262` lleva `anulacion` (Decisional)
y `facturar` (Administrativo); `:362` y `:396` las anulaciones (Decisional). Los seis literales: `Operativo` (`as const` en `transitionExec.test.ts`).
Los otros tres ficheros de prueba conservan su recuento: `--numstat` 2/2, 2/2, 1/1, 1/1.

## Mutaciones del lote 1 (D6), sobre copia en el directorio temporal y restauradas copiando

| # | Mutación | Rojo | Restaurado |
|---|---|---|---|
| M1a | quitar `tipoEvento` de `aprobacion` (`:202`) | `npm run typecheck`: `transitions.ts(202,3): TS2741 Property 'tipoEvento' is missing` (2 líneas, una por programa); `tsc` shared: 2 ajenos + 1 (`transitions.ts(202,3)`) | `47 47`, 397 |
| M1b | quitar `tipoEvento` de `:150` | `typecheck`: `transitions.ts(150,186): TS1360` y `tipoEvento.ts(14,61): TS2339`; `tsc` shared: 2 ajenos + 6 | `47 47`, 397 |
| M2 | `'Logístico'` en `aprobacion` | `typecheck`: `transitions.ts(202,112): TS2322` ×2; `tsc` shared: 2 ajenos + 1 | `47 47`, 397 |
| M2b | `'Logístico' as never` | `typecheck` y `tsc` verdes (sólo los 2 ajenos); vitest 6 de 9 rojos, entre ellos el barrido | `47 47`, 397 |
| M3 | `aprobacion` a Operativo | vitest 5 de 9 rojos (tabla, resolutor, recuentos, ejemplo, RQ-TS-45) | `47 47`, 397 |

**Hipótesis de D6 confirmada por ejecución:** `npm run typecheck` ve `transitions.ts` (M1a, M1b, M2 lo ponen rojo desde `server` y `tsc -b`).
Las pruebas de `packages/shared/src` sólo las ve el segundo `tsc`. El barrido en ejecución es lo único que caza M2b.

## Medidas del cierre del lote

| Medida | Valor |
|---|---|
| `wc -l transitions.ts` | 397 antes y después; `--numstat` `47 47` |
| `npm run typecheck` | 0 errores |
| `tsc -p packages/shared` | 2 errores, los mismos ajenos |
| `npx vitest run` | 4963 pasadas / 11 omitidas (base 4954 / 11; +9 de la prueba nueva); 296 ficheros pasan, 3 omitidos |
| `npx eslint .` | 0 errores / 165 avisos (base 0 / 165) |
| Paquete del cliente (D9) | `index-C7NdRWwC.js` 418.292 bytes → `index-CtuL2ALD.js` 419.433 bytes (+1.141; hipótesis de D9 ~1,1 KB) |
| Líneas del intento | rastreado `git diff --shortstat --no-renames`: 54 inserciones / 53 borrados (6 ficheros); sin trackear: `tipoEvento.ts` 15 + `tipoEvento.test.ts` 77 = 92; más este informe |

Pendiente para el orquestador: commit y detector de citas (`--sha HEAD`). Ninguna posición de `transitions.ts`, `index.ts` ni de las pruebas se movió.

**Contraste del orquestador (antes del commit).** Los 47 valores de `transitions.ts` comparados por script con la tabla de la medición: 0 diferencias. M3 y M1a reproducidas: M3 deja 5 de 9 en rojo en `tipoEvento.test.ts`; M1a da `transitions.ts(202,3): error TS2741` en los dos programas de `npm run typecheck`. Restaurado por copia, `cmp` idéntico, `47 47`.

## Lote 2 — el historial expone el tipo (intento 4)

| Tarea | Rojo visto | Verde |
|---|---|---|
| 2.1 `historialTipoEvento.test.ts` (5 pruebas, pg-mem, filas escritas a mano en `ticket_transitions`) | 4 de 5 en rojo: `aprobacion` da `undefined` (esperaba `Decisional`), con `values` `{"tipoEvento":"Administrativo"}` igual, migración sin la propiedad (`expected false to be true`), las dos filas `[undefined, undefined]`. La de creación nace verde (se valida con M6) | — |
| 2.2 `types.ts:611` y `historial.ts:3` y `:51` | — | 5 de 5. `--numstat` `types.ts` `1 1`, `historial.ts` `2 2`; `eventoCreacion` y `historial.ts:143` sin tocar; `fila.values` no se lee para el tipo |

## Mutaciones del lote 2 (D6), sobre copia en el directorio temporal y restauradas copiando

| # | Mutación | Rojo | Restaurado |
|---|---|---|---|
| M4 | `:51` lee `json(fila.values)?.tipoEvento` antes que el id | 1 de 5: «un `values` con otro tipo no lo cambia» | `cmp` idéntico, `2 2` |
| M5a | `tipoEvento: null` | 3 de 5: catálogo, `values`, fila anterior y nueva | `cmp` idéntico, `2 2` |
| M5b | resolver por `transition_name` | 3 de 5, las mismas | `cmp` idéntico, `2 2` |
| M6 | `eventoCreacion` con `tipoEvento: null` | 1 de 5: «el evento de creación no lleva la propiedad» | `cmp` idéntico, `2 2` |

## Medidas del cierre del lote

| Medida | Valor |
|---|---|
| `npm run typecheck` | 0 errores |
| `tsc -p packages/shared` | 2 errores, los mismos ajenos (`fasesBlueprint.test.ts:33`, `reasignacion.test.ts:60`) |
| `npx vitest run` | 4968 pasadas / 11 omitidas (base del lote 1: 4963 / 11; +5); 297 ficheros pasan, 3 omitidos |
| `npx eslint .` | 0 errores / 165 avisos |
| Paquete del cliente | `index-CtuL2ALD.js` 419.433 bytes, sin cambio respecto al lote 1 |
| Líneas del intento | rastreado: `types.ts` 1/1 y `historial.ts` 2/2; sin trackear: `historialTipoEvento.test.ts` 56 líneas; más este informe |

Pendiente para el orquestador: tarea 2.4 (commit y detector de citas). Ninguna posición de `types.ts` ni de `historial.ts` se movió.

**Contraste del orquestador (antes del commit).** M4 reproducida: con `historial.ts:51` leyendo antes `values.tipoEvento`, cae justo «un `values` con otro tipo no lo cambia» (1 de 5). Restaurado por copia, `cmp` idéntico, `2 2`. `historial.ts` y `types.ts` no cambian de número de líneas.
