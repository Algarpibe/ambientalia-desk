# apply-progress — derivacion-repuestos-director-tecnico (F1C-11)

Modo: Strict TDD · hybrid · lote ÚNICO (32/32). Partida `870adb6`; commit de código `d179c12`.

## Línea base (1.1)

`npm test`: 1 rojo previo y AJENO a la tanda de código: `apps/desk/server/reconciliacion/registro.test.ts:218-220`
(«en curso» eran SIETE; con la propuesta de F1C-11 ya commiteada en `870adb6` pasan a ocho). Se corrige en el mismo
commit, en sitio (precedente: `6dbae98` hizo lo mismo con F1B-03). Typecheck limpio; lint 165 avisos, 0 errores.
`wc -l` antes → después: `sla.ts` 146→146 · `sla.test.ts` 322→322 · `transitions.test.ts` 118→118 ·
`transitions.ts` 397→397 · `cargos.ts` 98→98 · `permisos.test.ts` 461→461 · `prioridadTop5.test.ts` 399→399.
`cargos.test.ts` 230→273, `cargoPermiso.test.ts` 269→290, `personas.test.ts` 122→152, `transiciones.test.ts` 461→533:
sólo líneas NUEVAS al final (más una en sitio por import en `personas.test.ts:2` y `transiciones.test.ts:10`).

## Rojo (1.2-1.11), con el dato viejo

Salida literal (prueba focal, antes de tocar `transitions.ts`, `cargos.ts` ni `sla.ts`):

    × transitions > solo cinco etapas proponen derivación, y estas                                 (R1)  expected {…3 entradas} to deeply equal {…5}
    × C11 · a quién se escala > un estado sin transición … En Proceso sí (F1C-11)                  (R2)  expected { hay: false, motivo: 'ningun_cargo' } to deeply equal { hay: true, … }
    × C11 · a quién se escala > sólo tres estados tienen a quién escalar …                         (R3)  expected [ 'Rev./Diagnostico', 'Notificado' ] to deeply equal [ …3 ]
    × CARGOS · la lista cerrada de ocho … > son ocho, escritos a mano y EN ORDEN                   (R4)  expected [7] to deeply equal [8]
    × CARGOS · guardián … > los siete de c10b y el octavo de cargo-encargado-de-inventario …       (R5)  expected [7] to deeply equal [8]
    × el cargo SÓLO restringe · barrido área × cargo × acción (RQ-PM-21) > ningún caso concede …   (R6)  expected 1700 to be 1870
    × permisos.test.ts · cargo × área × transición: 837 casos …                                    (R7)  expected 744 to be 837
    × permisos.test.ts · el barrido de cargo sube a 837 …                                          (R7)  expected 744 to be 837
    × prioridadTop5.test.ts · PM23-1 · diez sujetos … (PUT)                                        (R8)  expected [..] to have a length of 10 but got 9
    × prioridadTop5.test.ts · PM23-1 · diez sujetos … (POST)                                       (R8)  expected [..] to have a length of 10 but got 9
    × derivacionInicial con el porDefecto real … «Solicitud repuestos» …                           (N1)  expected undefined to deeply equal { tipo: 'cargo', … }
    × derivacionInicial con el porDefecto real … «Entrega de Repuestos» …                          (N1)  expected undefined to deeply equal { tipo: 'primerDerivado' }
    × N2 · … esCargo y cargoPermisoDelCuerpo lo aceptan, con su minúscula exacta                   (N2)  expected false to be true
    × N3 · el octavo cargo … el alta lo guarda, y la edición lo fija …                             (N3)  expected 422 to be 201
    × N4 · Solicitud repuestos al Director Técnico (200, Solicitado, …)                            (N4)  expected undefined to deeply equal { tipo: 'cargo', … }

**Total: 11 pruebas rojas en la primera pasada de los 8 ficheros focales** (más el rojo previo de `registro.test.ts`).
**N5 nació VERDE**, como se declaró: es caracterización (el servidor no cambia, `ticketService.ts:138-142`); su detector es M7.
La segunda `it` de N2 (veredictos de «Especialista técnico» = los de «Técnico») también nace verde: hoy un cargo desconocido
se comporta como «sin cargo», que da el mismo veredicto que «Técnico» en las 31; protege contra una futura excepción de cargo
mal puesta, no contra la ausencia del literal (esa la cubre la primera `it`).

## Verde (2.1-2.4)

`cargos.ts` (`:9-10`, `:14`), `transitions.ts` (`:269`, `:272`, `:275`, `:276`, `:280`, `:281`), `sla.ts` (`:66`, `:70`).
Dos líneas de comentario de `sla.ts`, no cuatro: sólo `:66` y `:70` llevaban cita desfasada (el «cuatro» del plan era previsión).
Cero netas. Prueba focal: 39 ficheros, 884 pruebas en verde (`packages/shared`, personas, transiciones, cargoPermiso, permisos,
prioridadTop5, reconciliacion).

## Mutaciones (Fase 3), reproducidas de verdad con `scratchpad/mut.js` (aplica, ejecuta los 8 ficheros focales, revierte)

| # | Mutación | Pruebas que se pusieron rojas | Mensaje | Esperado |
|---|---|---|---|---|
| M1 | quitar `solicitud_repuestos` | R1, R2, R3, N1, N4 (5) | `expected undefined to deeply equal { tipo: 'cargo', … }` / `expected { hay: false … } to deeply equal { hay: true … }` | sí |
| M2a | quitar `entrega_repuestos` | R1, N1, N4 | `expected undefined to deeply equal { tipo: 'primerDerivado' }` | **N4 NO se ponía roja la primera vez** (ver Desviaciones); con la aserción añadida, sí |
| M2b | `entrega_repuestos` → `cargo` | R1, N1, N4, R2, R3 | R2/R3: la lista gana `Solicitado` | sí |
| M3 | otro cargo en `solicitud_repuestos` | R1, R2, N1, N4 (R3 no: la lista de estados es la misma) | `expected … 'Coordinador Comercial' …` | sí (R3 no estaba en la fila de D-4) |
| M4 | mover «Especialista técnico» en `CARGOS` | R4, R5 | `expected [ 'Director Técnico', …(6) ] to deeply equal [ …(7) ]` | sí |
| M5a | `openspec/config.yaml:3494` «Especialista técnico» → «Especialista tecnico» | R5 | `AssertionError: expected [ 'Director Técnico', …(7) ] to deeply equal [ …(7) ]` | sí |
| M5b | `:3494` sin «no está entre los siete cargos» | R5 | `Error: Guardián sin objeto: no aparece «… no está entre los siete cargos decididos el 24/09» …` | sí |
| M6 | quitar el octavo | R4, R5, R6, R7 (×2), R8 (×2), N2, N3 (9 rojas) | `expected 1700 to be 1870` · `expected 744 to be 837` · `to have a length of 10 but got 9` · `expected 422 to be 201` | sí |
| M7 | `ticketService.ts` rechaza un derivado distinto del Director Técnico | N5 (única) | `AssertionError: expected 422 to be 200` | sí |

Tras M5a y M5b: `git diff --stat -- openspec/config.yaml` salió VACÍO. Tras M7: `git diff --stat -- apps/desk/server/services/ticketService.ts`, vacío.
Cada mutación se revirtió restaurando los bytes y se volvió a ejecutar en verde (suite completa al final).

## Cierre (Fase 4)

- `npm test`: 178 ficheros pasan, 1 omitido (179) · 2.639 pruebas pasan, 2 omitidas (2.641). Línea base: 2.634 pruebas → +7 nuevas (N1 ×2, N2 ×2, N3, N4, N5).
- `npm run typecheck`: salida 0. `npm run lint`: `165 problems (0 errors, 165 warnings)`.
- Detector `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: salida 0, comprobadas 4.774, abreviadas rotas 15 (informativas), cabeceras R-1 inválidas 0.
- **Barrido de citas (regla 4, D-6), sin excluir `archive/`:** 107 citas completas solapan una línea editada (script sobre `git diff -U0`).
  Leídas contra el fichero, por caso:
  - **A, correctas hoy, sin tocar:** `config.yaml:1427`, `:1552`, `:2400` (el rango `274-282` y el `:276` siguen diciendo lo afirmado); `sla.ts:66`, `sla.test.ts:93`/`:95` (reparadas aquí); los `design`/`exploration`/`proposal`/`tasks` de ESTE cambio (apuntan a las líneas de las pruebas, que siguen siendo esas).
  - **A, las arregla el archivo:** `openspec/specs/derivacion-avisos/spec.md:81` y `:656` (delta y fusión); `openspec/specs/permissions/spec.md:284`, `:422` y `:462`.
  - **B, registros fechados, no se editan:** `config.yaml:1443`, `:1940`, `:2593` (dos de ellas nombran su revisión `3f30710`), `ENTRADA.md:216`, `:1044`, `F0-01_Correcciones…:396`, `:419`, `Decisiones_Gerencia_2026-09-10.md:346`, `F0-00_Baseline:55`, `F0-03/decisiones-para-carga.md:113`, todo `archive/`.
  - **C, superado por esta tanda, se conserva:** `Desk2.0_Plan…R01.4.md:175` («la lista cerrada tiene siete», `cargos.ts:12-15`): afirma la dependencia que F1C-11 acaba de cerrar; no se edita la R01.4 desde aquí.
  - Ninguna cita apuntaba a una línea que hubiera cambiado de contenido sin que su frase siguiera siendo cierta, salvo las anteriores.
- **Pase de abreviadas** en `CLAUDE.md`, `openspec/config.yaml`, `derivacion-avisos`, `permissions` y `transitions-st`: las únicas abreviadas halladas en el rango 269-282 (tres, de ficheros ajenos) pertenecen a otros ficheros (maestro, `transicionesEjecucion.test.ts`, `migrate.test.ts`); no hay abreviada que apunte a lo editado.
- **Medida (4.2):** `git diff --shortstat --no-renames 870adb6` con el código y las pruebas: `12 files changed, 213 insertions(+), 47 deletions(-)` = 260; tras 4.8-4.9, `tasks.md` y este `apply-progress.md` (120 líneas, nuevo): 260 + 195 + 32 = 487 (el commit 2 mide `4 files changed, 195 insertions(+), 32 deletions(-)`). Válvula: bajo 560, un lote.

## Regla 13, decisión a decisión (4.7)

| Decisión del cliente | Línea del servidor | Veredicto |
|---|---|---|
| Rellena «Derivado a» con el Director Técnico / el primer derivado (`apps/desk/src/components/TransitionPanel.tsx:87-94`, `apps/desk/src/lib/personas.ts:73-79`) | **Ninguna la impone.** `apps/desk/server/services/ticketService.ts:138-142` sólo exige persona existente y activa; la prueba N5 (`apps/desk/server/transiciones.test.ts`, `describe` «F1C-11 · derivación del taller») lo deja escrito y M7 es su detector | Comodidad sin imposición. La pregunta S-1 queda en `docs/sdd/ENTRADA.md` (E-160) |
| Ofrece «Especialista técnico» en la administración de usuarios | La lista cerrada es la de `packages/shared/src/cargos.ts:12-15`, la misma que usa el servidor para el 422; N3 prueba alta y edición por HTTP | Espejo legítimo (imposición probada) |
| Bloquea, avisa o rellena algo más | — | Nada: no hay decisión nueva en `apps/desk/src` (cero `.tsx` editados) |

## Desviaciones del diseño

1. **`registro.test.ts:218-220` editada en sitio** («SIETE» → «OCHO», `'F1C-11'` al final de la lista): no estaba en el diseño. Era rojo previo causado por la propia propuesta de F1C-11 (cuenta las propuestas en curso); precedente `6dbae98`. Cero netas.
2. **N4 gana una aserción** (`pdDe('entrega_repuestos')` es `primerDerivado`) porque M2a NO la ponía roja: N4 fijaba `derivado_a` a mano con el `primerDerivado` del detalle. Con ella, M2a pone roja a N4 como pedía D-4.
3. `sla.ts`: dos líneas editadas, no cuatro.
4. M3 no pone roja a R3 (la lista de estados con destinatario no cambia de longitud ni de orden).
5. El `describe` de N4/N5 usa `TRANSITIONS` (import en sitio en la línea 10) y lee el cargo del catálogo, no `derivacionInicial` (D-2).

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2 R1 | `packages/shared/src/transitions.test.ts` | Unit | ✅ 5/5 previo | ✅ rojo | ✅ | ✅ 5 entradas exactas | ➖ |
| 1.3 R2/R3 | `packages/shared/src/sla.test.ts` | Unit | ✅ | ✅ | ✅ | ✅ 3 estados | ➖ |
| 1.4 R4-R6 | `packages/shared/src/cargos.test.ts` | Unit | ✅ | ✅ | ✅ | ✅ guardián con dos mutaciones (M5a/M5b) | ➖ |
| 1.5 N2 | `packages/shared/src/cargos.test.ts` | Unit | ✅ | ✅ (1ª it; la 2ª nace verde) | ✅ | ✅ | ➖ |
| 1.6 R7/R8 | `permisos.test.ts`, `prioridadTop5.test.ts` | Integración (pg-mem) | ✅ | ✅ | ✅ | ➖ cifra a mano | ➖ |
| 1.7 N3 | `apps/desk/server/cargoPermiso.test.ts` | Integración HTTP | ✅ | ✅ | ✅ | ✅ alta, edición, otra grafía | ➖ |
| 1.8 N1 | `apps/desk/src/lib/personas.test.ts` | Unit | ✅ | ✅ | ✅ | ✅ dos etapas, cuatro casos | ➖ |
| 1.9 N4 | `apps/desk/server/transiciones.test.ts` | Integración HTTP | ✅ | ✅ | ✅ | ✅ ida y vuelta | ➖ |
| 1.10 N5 | `apps/desk/server/transiciones.test.ts` | Integración HTTP | ✅ | ➖ caracterización, nace verde | ✅ | ✅ activa y de baja | ➖ |

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run` sobre los 8 ficheros focales + `packages/shared` + `reconciliacion`: 39 ficheros, 884 pruebas, verde |
| Arnés real | `POST /api/tickets/:id/transition` con `solicitud_repuestos` y `entrega_repuestos` contra pg-mem (N4, N5): 200, estados, avisos |
| Reversión | `git revert d179c12` |

## De personas — no son tareas de esta tanda; archivar no las da por hechas

Las cuatro de `tasks.md` (cargo a Johny Luna; `users.cargo` del Director Técnico; S-1 en E-160; HTML en E-161) quedan con su dueño y destino.
