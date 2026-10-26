# Tareas — `valor-reclamado-usd` (F1B-13, `cierra: no`)

`strict_tdd`: cada tarea de código es prueba → ROJO visto → implementar → VERDE. El rojo se anota en `apply-progress.md` (fichero, prueba, aserción y causa); si no es rojo por la causa esperada, parar. «§N» es de `design.md`; S-n y D-n, de `proposal.md` y `design.md`; RQ-TC-78/79/80 y los de 45/47/65, de `specs/tickets-core/spec.md` (cada escenario ROJO tiene una prueba que nace roja). Todo en `C:\dev\Desk_2_R1.023-worktrees\valor-reclamado-usd`. **Un intento por lote** (regla del ciclo 3), techo 800, válvula 720, medido con `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear (binarios aparte). Partida de cada intento: el commit con que cierra el anterior.
**Colocación (mutación 4, §11):** edición EN SU MISMA LÍNEA física; lo nuevo, al final del fichero o en ficheros nuevos; `index.ts` una línea tras `:54`. Ninguna línea se mueve. **Sin `any`** (lint sin holgura).
**Cierre `Lx.c` (lo hace el orquestador, no el aplicador), en serie y primer plano:** commit; `npm run typecheck` = 0; `npm run lint -- --max-warnings 165` = 0 y cifra contra 165; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` = 0; `npm test > <scratchpad>/npmtest-<hora>.log 2>&1` SOLO (si no sale 0, nombrar prueba y fichero del log y parar); `npm run build` = 0; medida ≤ 720; `settle`.

## Lote L1 · `shared` aditivo (~205 ingenua; ~370 con informes)

- [ ] L1.1 Línea base verde ANTES de editar: `packages/shared/src/garantiaProveedor.test.ts`, `medicionGarantias.test.ts` y `apps/desk/server/routes/medicionGarantias.test.ts`. Si no, parar.
- [ ] L1.2 ROJO `packages/shared/src/valorReclamado.test.ts` (nuevo): `lineasDeLaOVI` (objeto, texto JSON, `null` ante `line_items` ausente/vacía/no lista, sin `item_id`, cantidad 0, `'2'` en texto); `fotoValorReclamado` (2 × 150,54 + 1 × 10 = 311,08; repetido = 40; tres de 0,004 = 0,01; costo `null`, 0, ausente o no finito → `SIN_FOTO`; nunca parcial); `origenTrasEditar` (los cinco casos de S-5); `etiquetaOrigenValor` (S-7). Rojo: el módulo no existe. RQ-TC-78 (escenarios puros), RQ-TC-79.
- [ ] L1.3 ROJO al final de `packages/shared/src/medicionGarantias.test.ts`: cada grupo trae `moneda: 'USD'`; el cociente no lleva moneda; sumas, recuentos y orden idénticos (CARACTERIZACIÓN). RQ-TC-80, RQ-TC-65.
- [ ] L1.4 ROJO al final de `apps/desk/server/routes/medicionGarantias.test.ts`: `moneda` en cada grupo y la ruta devuelve exactamente lo de `shared`.
- [ ] L1.5 Anotar los rojos de L1.2-L1.4 en `apply-progress.md`.
- [ ] L1.6 VERDE: al FINAL de `packages/shared/src/garantiaProveedor.ts` (tras `:191`) las cuatro líneas de §4 (`ORIGEN_VALOR_OVI`, `OrigenValorReclamado`, `MONEDA_GARANTIA_PROVEEDOR`, `MonedaGarantiaProveedor`); en sitio `:36` (comentario S-4 corregido, sin «mientras no se calcule solo», `:37` sigue siendo `ORIGEN_VALOR_MANUAL`).
- [ ] L1.7 VERDE: `packages/shared/src/valorReclamado.ts` (nuevo, §4: `LineaOVI`, `ValorReclamadoConOrigen`, `SIN_FOTO`, `lineasDeLaOVI`, `fotoValorReclamado` con `Math.round(Σ × 100) / 100` una vez, `origenTrasEditar`, `ETIQUETA_ORIGEN_VALOR`, `etiquetaOrigenValor`) y UNA línea de export tras `packages/shared/src/index.ts:54`.
- [ ] L1.8 VERDE en sitio, `packages/shared/src/medicionGarantias.ts`: `:1` (importación añadida a la línea), `:26` (`moneda: MonedaGarantiaProveedor`), `:62` (`moneda: MONEDA_GARANTIA_PROVEEDOR`). `conNumerosDeTicket` (`:117-122`) no se toca.
- [ ] L1.9 Mutaciones, una a una, **M0 primero** (suite entera verde sin mutar): (a) quitar `cantidad` de la suma → cae 311,08 de L1.2; (d2) quitar `moneda` del grupo (`medicionGarantias.ts:62`) → caen L1.3 y L1.4; (f) saltar la línea sin costo (suma parcial) → cae «artículo ausente / costo 0 da `SIN_FOTO`»; (i) redondear por línea → cae «tres de 0,004 dan 0,01». Cada una: editar → correr SÓLO la prueba que debe caer → anotar la aserción → restaurar byte a byte (`git diff` vacío del hunk) → verde. Registro en `apply-progress.md`.
- [ ] L1.10 Regla de división: medir. Si L1 pasa de ~400 ingenuas, avisar en `apply-progress.md` antes de cerrar.
- [ ] L1.c Cierre: CC; `apply-progress.md` con rojos, M0 y mutaciones, medida.

## Lote L2 · la ficha en el servidor (~266 ingenua; ~480 con informes)

- [ ] L2.1 Línea base verde de L1 cerrado y de `apps/desk/server/db/garantiaProveedor.test.ts`, `routes/garantiaProveedor.test.ts`, `services/avisoReclamacionProveedor.test.ts`; las pruebas de posición de G1-G14 anotadas como «sin tocar».
- [ ] L2.2 ROJO `packages/shared/src/garantiaProveedor.test.ts`: en sitio `:55`, `:58` (sin la clave), `:65-67` (tres filas → UN comentario de tres líneas que remite al final), `:174-175` (título y aserción del «sí»); al final el bloque S-2: `-1`, `'abc'`, `Infinity`, `'800'` y `800000` se ignoran en el «sí» y siguen siendo error al editar. En sitio `medicionGarantias.test.ts:15` (`moneda` en el constructor).
- [ ] L2.3 ROJO `apps/desk/server/db/garantiaProveedor.test.ts`: en sitio `:16`, `:33`, `:39`, `:51`, `:53` y el cuarto argumento en `:108`, `:112`, `:115`, `:116`; al final: `fotoDeLaOVI` con fixtures pg-mem (`raw` por `JSON.stringify`, `asociarOV` con `salesorderId`) con foto 311,08 de cantidad 2; **un caso por cada uno de los diez huecos de S-4** (sin `salesorder_id`, sin fila de la orden, sin `line_items`, vacía, línea sin `item_id`, cantidad 0, cantidad en texto, artículo ausente, costo NULL, costo 0) → `SIN_FOTO`; «nunca parcial» (100 + ausente = `null`); `editarFicha` escribe el origen; `aGarantia` trae `moneda`; ficha previa sale `USD` con valor 1500 y origen `manual`; foto no se recalcula si cambia el catálogo (S-11); `Queryable` falsa con `purchase_rate` `'150.54'` y `raw` como TEXTO (molde `:76-91`).
- [ ] L2.4 ROJO `apps/desk/server/routes/garantiaProveedor.test.ts`: en sitio `:32`, `:67`; al final: «sí» con foto (`ovi`) y sin ella (`null`/`manual`) con `201`; cuerpo con 999, `-1`, `'abc'`, `Infinity` → `201` y valor de la foto; PUT sobre ficha `ovi` con X→X (conserva) y X→Y, NULL→X, X→NULL (`manual`); PUT con `-1` → `422` (G14); `moneda` en GET, «sí», «no», PUT y avanzar. Prueba de posición: la foto no cambia ninguna respuesta de G1-G6.
- [ ] L2.5 ROJO `apps/desk/server/routes/medicionGarantias.test.ts`: en sitio `:37`, `:41`, `:43` (la siembra pasa el importe por `foto`). `services/avisoReclamacionProveedor.test.ts:26`, en sitio. Rojo esperado: el campo `foto`/`moneda` aún no existe.
- [ ] L2.6 Anotar los rojos de L2.2-L2.5 en `apply-progress.md`.
- [ ] L2.7 VERDE `packages/shared/src/garantiaProveedor.ts` en sitio: `:60` (`moneda: MonedaGarantiaProveedor`), `:70` (el «sí» sin `valorReclamado`), `:151` (`datosComunes({ ...cuerpo, valorReclamado: null })`), `:153` (el «sí» con tres campos). `validarDatosFicha` (`:157-164`) sin cambios.
- [ ] L2.8 VERDE `apps/desk/server/db/garantiaProveedor.ts` en sitio (§5): `:4-5` imports; `:64` `moneda: MONEDA_GARANTIA_PROVEEDOR`; `:89` `foto?`; `:91` `foto = SIN_FOTO`; `:99` escribe `foto.valorReclamado, foto.origenValorReclamado`; `:114` `origen: string | null`; `:116` `origen_valor_reclamado = $7`; `:118` `origen`. Al final `fotoDeLaOVI` (`ov_asociaciones` → `books.sales_orders` calificada → `books.items IN ($1,…)`, costo por `numero()`, ids sin repetir, nunca rechaza).
- [ ] L2.9 VERDE `apps/desk/server/routes/garantiaProveedor.ts` en sitio: `:5` y `:10` imports; `:57` `foto: respuesta.valor.reclama ? await fotoDeLaOVI(db, asociacion.id) : undefined` dentro del `try`; `:78` `origenTrasEditar(ficha, datos.valor.valorReclamado)`. G1-G14 no se mueven.
- [ ] L2.10 Siembras e importaciones restantes en verde sin cambiar su sentido; `npm run typecheck` = 0 en el lote (el cambio de tipos arrastra todo).
- [ ] L2.11 Mutaciones (tras **M0** de la suite entera): (b) `origenTrasEditar` devuelve siempre el anterior, y aparte `editarFicha` sin `$7` → caen X→Y y NULL→X de shared y el PUT X→Y de la ruta; (c) regla de mutación 2: ensuciar el fixture de `books.sales_orders` con una línea sin `item_id` → la prueba POSITIVA de la foto (db y ruta) deja de dar `ovi`; (d1) quitar `moneda` de `aGarantia` (`:64`) → caen las cuatro respuestas de la ruta; (g) `validarRespuesta` vuelve a leer el valor → cae S-2 de shared y la ruta (999 no cambia la ficha; `-1` no da `422`); (h) quitar `numero()` del costo → cae la `Queryable` falsa con `'150.54'`. Cada una restaurada byte a byte y registrada.
- [ ] L2.12 Regla de mutación 1: mover `fotoDeLaOVI` antes/después de G6 no cambia ninguna respuesta (la foto no es guarda); las pruebas de posición de G1-G14, sin tocar y verdes. Anotarlo.
- [ ] L2.c Cierre: CC; `apps/desk/src` sin cambios (`git diff --stat <partida> -- apps/desk/src` vacío); `apply-progress.md`.

## Lote L3 · cliente y cierre (~98 ingenua; ~175 con informes)

- [ ] L3.1 Línea base verde de L2 cerrado. Los `.tsx` no admiten rojo previo (F0-00, `vitest.config.ts:16`, `:17-20`): lo respalda L2.
- [ ] L3.2 `apps/desk/src/components/PanelGarantiaProveedor.tsx` en sitio (§7): `:4` importa `etiquetaOrigenValor`; `:26` `fmtValor(v, moneda)`; `:47-48` `moneda?: string`; `:61` campo de valor sólo con `moneda`; `:85` el «sí» sin `moneda`; `:87` cuerpo sin valor; `:118` valor con `f.moneda` y etiqueta del origen; `:120` recuperado con `f.moneda`; `:132` `moneda={f.moneda}`; `:146` «Valor recuperado (moneda)».
- [ ] L3.3 `apps/desk/src/components/MedicionGarantias.tsx` en sitio: `:16` `fmtValor(v, moneda)`; `:66-67` con `g.moneda`. `apps/desk/src/api/client.ts:848` deja de declarar `valorReclamado` en el cuerpo del «sí».
- [ ] L3.4 `grep -rn "USD" apps/desk/src` = 0 (ningún `.tsx` ni `client.ts` escribe el literal); `npm run typecheck` y `npm run build` = 0.
- [ ] L3.5 **Casilla de regla 13 (mutación 3)** en `apply-progress.md`: para C-1…C-4 (§8), la línea EXACTA del servidor que impone la decisión, leída al cerrar (C-1 `routes/garantiaProveedor.ts:57`; C-2 `db/garantiaProveedor.ts:64` y `medicionGarantias.ts:62`; C-3 `db/garantiaProveedor.ts:99` y `:116`; C-4 `routes/garantiaProveedor.ts:78`), cada una con lo que afirma; enumerar también toda decisión del cliente que no esté en la tabla.
- [ ] L3.6 **Barrido de citas (mutación 4, §11)**: `grep -rnoE "<fichero>\.(ts|tsx):[0-9]+(-[0-9]+)?"` sobre `*.md`, `*.ts` y `*.yaml` para cada fichero tocado (`garantiaProveedor.ts` shared, db y ruta; `medicionGarantias.ts`; `index.ts`; los dos `.tsx`; `client.ts`; los ficheros de prueba), cada resultado leído contra lo que AFIRMA (caso A/B/C; los documentos fechados y archivados son B: se nombra la revisión, no se renumera), principio y final de cada rango por separado, más el SEGUNDO PASE de las abreviadas `:NN` en los ficheros que ya citan el módulo. La spec viva, en su propio intento.
- [ ] L3.7 **Inventario de importes de Desk sin moneda** (ruta y línea de cada uno, en `apps/` y `packages/`; no se corrige ninguno) escrito en `apply-progress.md` para que el archivo lo lleve al `archive-report.md` (R-3, `CLAUDE.md:691-701`).
- [ ] L3.8 **Enmienda de la corrección 29** en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: punto 2 (`:1474-1476`) a «valor reclamado en USD, foto al abrir la ficha: cantidad × costo de catálogo, sumado por línea; editable a mano, con su origen», recuperado en USD, y suma la línea 1232 del maestro (el costo lo conserva el catálogo, no la línea); punto 3 (`:1477-1480`) al día (construidos el valor automático y las dos mediciones; falta el envío físico). En sitio dentro de sus líneas; si no cabe, barrido de las citas a ese fichero.
- [ ] L3.9 Registro final de mutaciones (a)-(d2), (f)-(i) con M0 en `apply-progress.md`; criterios de §14 de la propuesta marcados con su prueba.
- [ ] L3.c Cierre: CC completa; `apply-progress.md` completo; medida ≤ 720.

## Verify y archive (un intento cada uno)

- [ ] V.1 `sdd-verify`: contrastar el diff contra los escenarios de RQ-TC-78, -79, -80 y los MODIFIED de RQ-TC-45, -47, -65; cada hueco de S-4 una prueba. Repetir CC y el barrido de L3.6.
- [ ] A.1 `sdd-archive` (techo 2 × carpeta + 800): medir ANTES la parte revisable (fusión del delta + `archive-report.md`) ≤ 800; fusionar POR SCRIPT, MODIFIED en sitio a igual longitud (57, 62 y 80 líneas) y ADDED tras RQ-TC-77. `archive-report.md` con UNA línea de qué cubrió de F1B-13 y el inventario de L3.7; commit sólo del cambio archivado (`git show --numstat`).

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son trabajo del repositorio. **Archivar NO las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Correr la consulta SQL de sólo lectura de `proposal.md` §12 (fichas con algún importe) antes de publicar | Alfonso | Si alguna está en pesos: punto abierto con dueño en `docs/sdd/ENTRADA.md` (toca datos de producción) | `proposal.md` §12, `archive-report.md`; la entrada de bandeja, en `main` al fusionar |
| P-2 | Pegar en el maestro la corrección 29 enmendada (L3.8) | Gerencia | El maestro deja de decir «tomado del costo de la OVI» y que las líneas conservan el costo | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |

## Review Workload Forecast

| Intento | Ingenua | ×1,8 (con informes) | Tareas |
|---|---|---|---|
| Apply L1 | ~205 | ~370 | 10 + cierre |
| Apply L2 | ~266 | ~480 | 12 + cierre |
| Apply L3 | ~98 | ~175 | 9 + cierre |
| Verify | — | `verify-report` ~300 | 1 |
| Archive | fusión ≪ 800 | mudanza 2 × carpeta + `archive-report` ~230 | 1 |

Ningún lote pasa de 400 ingenuas; L2 es el más justo (~480 de 720). Juntar L2 y L3 daría ~655: no se recomienda. Entrega: una rama con `git merge --no-ff` a `main` al cerrar, sin PR.

Decision needed before apply: No — un intento por lote, todos bajo 720
Chained PRs recommended: No (una rama; se fusiona a `main` al cerrar)
Chain strategy: n/a
400-line budget risk: Low (L1 ~205, L2 ~266, L3 ~98 ingenuas; L2 ~480 con informes)
