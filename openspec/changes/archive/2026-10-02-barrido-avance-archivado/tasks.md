# Tareas: el barrido cuenta sólo lo archivado y lee el §C de la R01.4

Base `840a353`. Toda cita a `comprobaciones.ts` sin revisión se lee en `840a353` (el cambio mueve sus líneas).

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas cambiadas estimadas (apply) | ≈540 (rango 480-640) |
| Techo del intento | 800 (`openspec/config.yaml:25-30`); umbral de partir antes: 720 |
| Riesgo vs. techo | Low: 540 < 720, no se parte |
| Medida real al cerrar | `git diff --shortstat --no-renames 840a353` + `wc -l` de lo nuevo sin trackear (binarios aparte) |
| Desglose | código +120/−30 · `comprobaciones.test.ts` +190/−15 · `registro.test.ts` +60 · YAML +27 · informe ±20 · anclas ±20 · `apply-progress` ≈50 · delta spec ±6 |
| Punto de control | Tras la Fase 3 se mide. Si pasa de 720, lote 2 = Fases 4-6 (YAML + `registro.test.ts` + informe + barrido) en intento aparte |
| verify / archive | verify ≈300-360 (precedente 358) · archive ≈2.600 (carpeta ≈1.100 × 2 sin renombrado + fusión medida + report ≈150): pasa de 800, ver «Fuera del recuento» |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low (techo real 800; el de 400 de la plantilla no rige aquí)

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Harness | Frontera de reversión |
|---|---|---|---|---|
| 1 (Fases 1-3) | Núcleo + pruebas + bloque YAML | `npx vitest run apps/desk/server/reconciliacion` | `npm run reconcile` sobre el árbol real | Revertir el commit; YAML aditivo |
| 2 (Fases 4-6, sólo si se parte) | Informe, barrido, spec | `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | `npm run reconcile` | El informe se regenera |

## Fase 1 · RED (`comprobaciones.test.ts`; todas fallan antes de tocar código)

- [x] 1.1 Migrar el fixture de `:145-156` en `840a353` a `archive/` y añadir una R01.4 sintética con §C. RED: la etiqueta y el denominador viejos no casan. Cubre 05b.
- [x] 1.2 RED: `cierra: si` fuera de `archive/` va a «en curso»; `no-archive/` (D1 con `includes`) no cuenta. Rojo natural: hoy cuenta como derivable. 05a.
- [x] 1.3 RED: cabecera inválida archivada no cuenta (05c); archivado `cierra: no` no cuenta y va a «en curso» (05d, 11c); archivado `si` + otro `no` → sólo «por archivo» (11d).
- [x] 1.4 RED: bloque sin `prueba:`, con `commit: ""`, con `prueba: >` y lista plana `- F0-01` → defecto con id y campo, sin contar (10b, 10c, 10d); bloque completo cuenta (10a). Rojo: hoy lee lista plana.
- [x] 1.5 RED: tanda en las dos poblaciones → hallazgo con las dos fuentes y exit intacto (05e); salida sin línea de suma (05f).
- [x] 1.6 RED: `cierra: si` y `no` sin archivar → «en curso» (11a, 11b); `fuera-del-plan` no (11e).
- [x] 1.7 RED: `**F1A-10**`, `1G-01`, `1H-00`, `F2-01`, `F4-01` cuentan; `F6-01`, `F1-01`, `F1G-01` no (12c); `F1B-04` repetido en §F.3 cuenta una vez (12b); `F1A-99` sólo en §G no entra (12e).
- [x] 1.8 RED: §C con `## C ·` renombrado → hallazgo que nombra el §C, sin denominador, exit sin cambio (12d, con D8). Fila 2 nombra la R01.4 (01a); comprobaciones 1, 3, 4, 5, 6 idénticas byte a byte (01b).
- [x] 1.9 RED: tanda nueva sólo en la R01.4, cerrada → no «sin verificar», sí «sin fuente» (06b); `M9.9` en la columna 4 de la R01.4 no es fuente (06c); `F0-02` con `maestro: ["Anexo H"]` → «sin verificar» (06a).
- [x] 1.10 RED mutación 1, P1: F0-01 por commit **y** con cabecera `cierra: si` fuera de `archive/` → no está «en curso».
- [x] 1.11 RED mutación 1, P2: bloque incompleto de F1B-09 **y** proposal suyo fuera de `archive/` → sigue «en curso» y no cuenta por commit. Cada una activa las dos guardas a la vez.
- [x] 1.12 RED: F0-04 con `cierra: no` y sin entrada por commit → «en curso» y no por commit (05g); 11f lo cubre `registro.test.ts` (Fase 3).

## Fase 2 · GREEN (`comprobaciones.ts`)

- [x] 2.1 `:46` → R01.4, en su misma línea; constantes `RUTA_PLAN_FUENTES` (R01.1) y `PREFIJO_ARCHIVO` tras `:54` (D11).
- [x] 2.2 Helpers tras `sinTrackear` (`:345`): `tramoDelPlan` (D4), `tandasDelPlan` (D5, `Set`), `cierresPorCommit` (D2: `entradasYaml` + `campo` + `listaYaml`).
- [x] 2.3 Reescribir `numerador` en su sitio: predicado D1 sobre la lista única de `proposals()`; resta de `porCommit` y de `porArchivo` para «en curso» DESPUÉS de filtrar defectos (P1/P2); disjunción; guarda (b) con `filasDelPlan` sin tocar sobre la R01.1 (D6, D7).
- [x] 2.4 D8: §C ausente → hallazgo informativo, «denominador sin leer», **sin cambiar el exit code**. D10: retirar el hallazgo «sin declarar». Contrato de salida de «Contrato publicado» del diseño.
- [x] 2.5 GREEN: `npx vitest run apps/desk/server/reconciliacion/comprobaciones.test.ts` verde; ajustar las aserciones de `:175-179` a las etiquetas nuevas.

## Fase 3 · Bloque YAML y pruebas sobre ficheros reales

- [x] 3.1 Confirmar con `git show --stat` los commits `3d44e1e`, `fa445ac` y `3aaa0f1` (y `749d205`, hijo de `fa445ac`) y leer las tres pruebas citadas. Anotar la salida en `apply-progress`.
- [x] 3.2 RED en `registro.test.ts` (config real → 3 por commit, 0 defectos; R01.4 real → 78; F0-04 y el resto, seis en curso: 11f; F0-01..03 exactos: 10e). Rojo natural: hoy la clave no existe.
- [x] 3.3 GREEN: añadir `cierres_declarados_por_commit` AL FINAL de `openspec/config.yaml` (bloque de `design.md`), sin insertar antes de ninguna línea. Sólo F0-01..03; las otras seis, fuera.
- [x] 3.4 Mutación 2 sobre lo vigilado, en `registro.test.ts`: copia de `config.yaml` sin `prueba:` de F0-02 → 2 y defecto que nombra `F0-02`/`prueba`. R01.4: fila `| F2-09 |` (ID NUEVO) tras el `---` del §C → 78; dentro del §C → 79; `## C ·` renombrado → hallazgo, no 78.
- [x] 3.5 Medir: `git diff --shortstat --no-renames 840a353` + `wc -l` sin trackear. Si > 720, cortar aquí (punto de control).

## Fase 4 · Informe

- [x] 4.1 `npm run reconcile`; regenerar `docs/sdd/RECONCILIACION.md`.
- [x] 4.2 Comprobar: 10 por archivo · 3 por commit · 6 en curso (F0-04, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05) · denominador 78 · exit 0 · desaparece «sin declarar» · sin línea de suma. Los «sin verificar» se anotan medidos.

## Fase 5 · Barrido de citas (regla de mutación 4) y compuertas

- [x] 5.1 `grep -rnoE "comprobaciones\.ts:[0-9]+(-[0-9]+)?"` fuera de `archive/`; añadir `en 840a353` en la misma línea física de: R01.4 `:294` (caso C), R01.4 `:175` (B), `config.yaml:3339` (C), `Parte_2026-09-21.md:35` (B), citas del `proposal.md` (B). Comprobar cada una contra el fichero.
- [x] 5.2 Segundo pase: abreviadas en esos ficheros y las tres citas nuevas del YAML, leyendo qué afirman.
- [x] 5.3 `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0 bloqueantes.
- [x] 5.4 `npm test` · `npm run typecheck` · `npm run lint` (techo 165 avisos).

## Fase 6 · Contradicción spec↔diseño (supuesto reversible: se sigue D8)

- [x] 6.1 En `specs/reconciliacion/spec.md`, RQ-RC-12: cambiar «SHALL fallar con mensaje explícito» por «SHALL informar con hallazgo explícito, sin alterar el código de salida (RQ-RC-03)» y el escenario «mutar el fichero vigilado» (THEN «el barrido informa con hallazgo que nombra el §C»). Anotar el supuesto en `apply-progress`.
- [x] 6.2 Cierre: registrar en `apply-progress` la medida final del ledger y el supuesto D8.

## Matriz escenario → tarea (28/28)

| RQ | Escenario | Tarea |
|---|---|---|
| 01 | 01a fila 2 apunta al plan vigente | 1.8 |
| 01 | 01b demás comprobaciones no cambian | 1.8 |
| 05 | 05a sin archivar no entra | 1.2 |
| 05 | 05b archivado sí cuenta | 1.1 |
| 05 | 05c cabecera inválida | 1.3 |
| 05 | 05d archivado `cierra: no` | 1.3 |
| 05 | 05e dos poblaciones | 1.5, 1.10 |
| 05 | 05f cifras no se suman | 1.5, 4.2 |
| 05 | 05g F0-04 a «en curso» | 1.12, 3.2 |
| 06 | 06a sin fuente común se marca | 1.9 |
| 06 | 06b sólo en la R01.4 no se marca | 1.9 |
| 06 | 06c lee la R01.1, no la R01.4 | 1.9 |
| 10 | 10a entrada completa cuenta | 1.4 |
| 10 | 10b sin `prueba` | 1.4, 1.11, 3.4 |
| 10 | 10c `commit` vacío | 1.4 |
| 10 | 10d lista plana | 1.4 |
| 10 | 10e árbol real, tres | 3.2, 3.3 |
| 11 | 11a `si` sin archivar | 1.6 |
| 11 | 11b `no` sin archivar | 1.6 |
| 11 | 11c archivado `no` | 1.3 |
| 11 | 11d cerrada deja de estar en curso | 1.3 |
| 11 | 11e `fuera-del-plan` | 1.6 |
| 11 | 11f árbol real, seis | 3.2, 4.2 |
| 12 | 12a denominador 78 | 3.2, 4.2 |
| 12 | 12b ID repetido en §F.3 | 1.7 |
| 12 | 12c cinco familias y negrita | 1.7 |
| 12 | 12d mutar el fichero vigilado | 1.8, 3.4, 6.1 |
| 12 | 12e fila fuera del §C | 1.7 |

## Fuera del recuento (regla del ciclo 1: de personas, no las da por hechas el archive)

| Tarea | Dueño | Destino |
|---|---|---|
| Techo ≈3.000 para el `sdd-archive` (precedente `openspec/config.yaml:3585`; medir antes la parte revisable) | Gerencia | Panel, antes de archivar |
| ~~¿Registrar también F0-00, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01?~~ Resuelto: Gerencia lo mandó y el lote 2 las registró | Gerencia | `decision/archivo-barrido-y-regla-del-archivo-01-10`, punto 4 |
| Revisar los supuestos: F2/F4 dentro del 78, fuente de (b) en la R01.1, F0-02 con `fa445ac`, D8 informativo | Gerencia | `proposal.md` «Ronda de preguntas» |

## Lote 2 · seis cierres declarados por commit (decision/archivo-barrido-y-regla-del-archivo-01-10, punto 4)

- [x] L2.1 Localizar y verificar commit y prueba de F0-00, F1A-01, F1A-02, F1A-04, F1A-05 y F1B-01 (`git show --stat`, `npx vitest run` de sus ficheros de prueba, lectura de ruta:línea). Las seis tienen prueba; ninguna queda fuera.
- [x] L2.2 RED: `registro.test.ts` (10e y la mutación 2) espera los nueve; rojo natural (2 fallos).
- [x] L2.3 GREEN: seis bloques al FINAL de `openspec/config.yaml` (sin desplazar líneas anteriores).
- [x] L2.4 Corregir RQ-RC-10, su tabla y el escenario del árbol real en el delta de `specs/reconciliacion/spec.md`.
- [x] L2.5 `npm run reconcile`: 9 por commit, 10 por archivo, 6 en curso, denominador 78, sin tanda en las dos poblaciones.
- [x] L2.6 Mutación 2 sobre el `config.yaml` real: borrar el `prueba:` de F1A-04, rojo, revertir.
