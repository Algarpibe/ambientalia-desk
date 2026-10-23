```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:c954c1e4393f58045848005bc87e0ad369ecfef29509e4c57c1c250a3017c86c
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 45/45
test_command: npx vitest run packages/shared/src/diaDeCierre.test.ts packages/shared/src/indicadores.test.ts apps/desk/server/poblacionPorCierre.test.ts apps/desk/server/indicadores.test.ts apps/desk/server/routes/indicadores.test.ts apps/desk/server/routes/indicadoresComparacion.test.ts apps/desk/server/routes/indicadoresSeptiembre.test.ts apps/desk/server/migracionMarcadorLectores.test.ts
test_exit_code: 0
test_output_hash: sha256:a34b447da6b4de11885206cdaa4439093885626f618b81dc76084dc6f5d071b7
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verificación — `poblacion-cierre-variante-47-51` (F1F-05, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\poblacion-cierre-variante-47-51`, rama `poblacion-cierre-variante-47-51`, HEAD verificado `bd66704f`, base
`f0eb92c4`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Verificado el 2026-10-23 sin tocar código ni mutar nada. El
`evidence_revision` es el sha256 de `git diff --no-renames f0eb92c4 bd66704f`. Los requisitos son 10: RQ-KP-11, -13, -22 y -25 (MODIFIED) y
RQ-KP-34 a -39 (ADDED); la fila SP-5 (MODIFIED, una línea) no lleva escenarios propios. Los escenarios son 45 (los encabezados de escenario de
`openspec/changes/poblacion-cierre-variante-47-51/specs/kpis/spec.md`, contados con `grep -c`).

## Veredicto: PASS CON AVISOS — 0 CRITICAL · 1 WARNING · 3 SUGGESTION

Los 10 requisitos y los 45 escenarios tienen una prueba que pasa. Las 39 tareas están marcadas y respaldadas por `apply-progress.md`. La
colocación (regla de mutación 4) es limpia, el servidor sólo lee, `apps/desk/src` no cambia y el fixture de septiembre coincide con el CSV de
origen en 273 de 273 celdas sin llevar un solo dato fuera de la lista de S-10. El aviso es una divergencia de redacción entre la spec y la
consulta de la encuesta, que el diseño ya declara.

## 1. Ejecución

| Comando | Código | Detalle |
|---|---|---|
| Suite completa (`typecheck`, `lint`, detector, `npm test`) | 0 | Hechos del orquestador sobre `bd66704f`, no repetidos aquí: typecheck 0; lint 0 errores y 165 avisos; detector 0 (7593 comprobadas, 13 abreviadas rotas informativas); `npm test` 0 con 316+3/319 ficheros y 5482+11/5493 pruebas (385 s) |
| `npx vitest run` dirigido (los ocho ficheros del cambio) | **0** | 8 ficheros, 311 pruebas, todas en verde |
| `npm run typecheck` | **0** | |
| Contraste propio con el CSV (script temporal fuera del repositorio) | 0 | 273 celdas ok, 0 diferencias (ver sección 6) |

## 2. Tareas y strict TDD

`tasks.md`: 39 casillas marcadas y 0 sin marcar (contadas con `grep -c`). Cada lote lleva su `apply-progress.md` con rojos, verdes, colocación y
mutaciones.

| Tarea de producción | Rojo anotado antes del verde | Dónde |
|---|---|---|
| L1.4 `packages/shared/src/diaDeCierre.ts` | «Failed to load url ./diaDeCierre»: símbolo inexistente | `apply-progress.md`, «Rojos vistos», L1.2 / L1.3 |
| L1.6 `packages/shared/src/indicadores.ts` | 12 pruebas rojas (3 en su línea y 9 nuevas) | ídem, L1.5 |
| L2.5 `apps/desk/server/indicadores.ts` | `poblacionPorCierre.test.ts`: 15 rojas y 2 verdes de caracterización; `expected 2 to be +0` en `indicadores.test.ts` | ídem, L2.3 / L2.4 |
| L3.3 `apps/desk/server/testing/septiembre2026.ts` | «Failed to load url ../testing/septiembre2026» | ídem, L3.2 |

Nacieron verdes y está anotado el porqué: L2.6 (el POST hereda la lectura; la primera prueba se contrastó contra la lectura vieja y cae con
`expected 3 to be 1`), las caracterizaciones de L2.3 y L2.4, y los datos de L2.2 (verdes por diseño, D6). La aceptación de L3 nació verde con el código de
L1 y L2 y lo declara.

Mutaciones registradas, cada una con la prueba que cayó y el sha256 igual tras revertir: M4, M8 (regla 1), M5 y G1 (regla 2) en L1; M1, M2, M3, M4,
M6 GET y M6 POST en L2; M1 y las ocho M7 (47, 49, 50·53, 51, 54, 57, 58, 59; regla 2) en L3, donde en cada M7 cae EXACTAMENTE una fila
(1 fallida y 10 verdes de 11, las ocho veces). Total M1-M8 y G1 más M7×8, sin huecos.

## 3. Matriz requisito · escenario · prueba

| Requisito | Escenarios | Código | Prueba que lo cubre | Resultado |
|---|---|---|---|---|
| SP-5 (fila) | — | `apps/desk/server/indicadores.ts:60` | `apps/desk/server/poblacionPorCierre.test.ts:47` | COMPLIANT |
| RQ-KP-11 | 50·53, 49, 54 (×2), 55: sin cambio de código | `packages/shared/src/indicadores.ts:238-241` no los toca | pruebas existentes de `packages/shared/src/indicadores.test.ts`, en verde | COMPLIANT |
| RQ-KP-11 | «El 47 de Zoho no cae en la remisión de salida», «El 51 de Zoho cuenta hasta el cierre» | `packages/shared/src/indicadores.ts:238`, `:241`, `:270` | Equivalentes con otras fechas en `packages/shared/src/indicadores.test.ts:433`, `:438`, `:443`, `:448`. No se afirman los números literales 17/20 y 2/12 (ver S1) | COMPLIANT (equivalente) |
| RQ-KP-13 | Forma, periodo inválido | `apps/desk/server/indicadores.ts:59-60` | `apps/desk/server/routes/indicadores.test.ts` (datos con `Closed` y `closed_time`), en verde | COMPLIANT |
| RQ-KP-22 | 6 escenarios | `apps/desk/server/indicadores.ts:85-87` (encuesta podada por `vistos`) | `apps/desk/server/poblacionPorCierre.test.ts:95`, `:105` (fuera de población), `:146` (sin escritura) y las existentes de la última respuesta | COMPLIANT (ver W1) |
| RQ-KP-25 | 4 escenarios | `apps/desk/server/routes/indicadoresComparacion.ts:33` | `apps/desk/server/routes/indicadoresComparacion.test.ts:499` (abierto, anulado y cerrado fuera caen en `fueraDelPeriodo`) y las existentes | COMPLIANT |
| RQ-KP-34 | 7 | `packages/shared/src/diaDeCierre.ts:28-38` | `packages/shared/src/diaDeCierre.test.ts:12`, `:16`, `:22`, `:25`, `:28`, `:32`, `:41` | COMPLIANT |
| RQ-KP-35 | 7 | `apps/desk/server/indicadores.ts:59`, `:68`, `:130` | `apps/desk/server/poblacionPorCierre.test.ts:47`, `:52`, `:57`, `:62`, `:73`, `:82`, `:113` | COMPLIANT |
| RQ-KP-36 | 2 | `apps/desk/server/indicadores.ts:76`, `:81` | `apps/desk/server/poblacionPorCierre.test.ts:122`, `:133`, `:139`, `:146` | COMPLIANT |
| RQ-KP-37 | 4 | `packages/shared/src/indicadores.ts:238`, `:241`, `:270-277` | `packages/shared/src/indicadores.test.ts:433`, `:443`, `:453`, `:467`, `:475` | COMPLIANT |
| RQ-KP-38 | 4 | `apps/desk/server/testing/septiembre2026.ts:22-49` | `apps/desk/server/routes/indicadoresSeptiembre.test.ts:30`, `:36`, `:55` y las ocho filas de `it.each` (`:42`) | COMPLIANT |
| RQ-KP-39 | 2 | `apps/desk/server/routes/indicadores.test.ts:263`, `:271`; `apps/desk/server/routes/indicadoresComparacion.test.ts:326` | Los tres hashes conservan sus bytes (`0975f415…992cf`, `c83ef69a…ba88be2`, `862d1958…10623a7`); el `git diff` no toca ninguna línea con sha256; ningún `it` borrado ni saltado (tres títulos reescritos en su línea) | COMPLIANT |

Líneas de los MODIFIED: RQ-KP-11 = 51, RQ-KP-13 = 22, RQ-KP-22 = 40 y RQ-KP-25 = 31, tanto en la spec viva de `f0eb92c4` como en el delta (medido con
`awk` sobre ambas); SP-5 es una línea en las dos. La fusión no desplaza nada de la spec viva.

## 4. Decisiones del diseño

| Decisión | Realizada | Evidencia |
|---|---|---|
| D1 función pura y conjunto derivado | Sí | `packages/shared/src/diaDeCierre.ts:18-20` (derivado de `CATALOGO_POR_FLUJO`), exportada en `packages/shared/src/index.ts:53` |
| D2 `diaDeCierre?` opcional y `MOTIVO_CIERRE` | Sí | `packages/shared/src/indicadores.ts:41`, `:88` |
| D3 variante del 47 y del 51 en sus líneas | Sí | `packages/shared/src/indicadores.ts:238`, `:241`; `contraCierre` al final, `:270` |
| D4 tabla de líneas | Sí, línea a línea | `apps/desk/server/indicadores.ts:2`, `:53-54`, `:59`, `:60`, `:64`, `:65`, `:68`, `:69`, `:70`, `:73`, `:77`, `:78`, `:81`, `:84`; `poblacionPorCierre` en `:121` |
| D5 el POST hereda | Sí, sin cambio de código | `apps/desk/server/routes/indicadoresComparacion.ts:33`; el diff no toca ese fichero |
| D6 datos en su línea, sha256 intactas | Sí | tres hashes sin cambio; `apps/desk/server/migracionMarcadorLectores.test.ts` +1/-1 |
| D7 fixture y aceptación | Sí | `apps/desk/server/testing/septiembre2026.ts`, `apps/desk/server/routes/indicadoresSeptiembre.test.ts` |
| D8 mutaciones | Sí | sección 2 |
| D9 lotes | Sí | intentos 3, 4 y 5 passed (sección 8) |

## 5. Colocación, sólo lectura y regla 13

- **Colocación (regla de mutación 4).** `git diff -U0 f0eb92c4 HEAD` sobre `apps/desk/server/indicadores.ts`: hunks `-2 +2`, `-53,2 +53,2`, `-59,2 +59,2`,
  `-64,2 +64,2`, `-68,3 +68,3`, `-73 +73`, `-77,2 +77,2`, `-81 +81`, `-84 +84` y `+118,17` tras la última línea. Sobre
  `packages/shared/src/indicadores.ts`: `-41 +41`, `-88 +88`, `-238 +238`, `-241 +241` y `+265,13` tras la última. Sobre `packages/shared/src/index.ts`:
  `+53` tras la última. Todos en sitio de igual tamaño o al final: **ninguna línea existente se desplazó**.
- **Sólo lectura (S-2).** Las líneas añadidas a `apps/desk/server/indicadores.ts` no contienen ninguna sentencia de escritura nueva (el único `SELECT` que
  cambia es el de `:64`; los `delete` son de `Map`). La prueba `apps/desk/server/poblacionPorCierre.test.ts:146` fija «ninguna sentencia de escritura» y
  `:122` «exactamente cuatro consultas, todas SELECT».
- **Regla 13 (mutación 3).** `git diff --stat f0eb92c4 HEAD -- apps/desk/src` sale vacío: el cliente no toma ninguna decisión nueva. La tabla de
  `apply-progress.md` (D1 a D4) nombra las líneas del servidor y de `shared` que imponen cada decisión, y esas líneas existen (`apps/desk/server/indicadores.ts:59`,
  `:68`, `:130`; `packages/shared/src/diaDeCierre.ts:28`; `packages/shared/src/indicadores.ts:238`, `:241`, `:270`).

## 6. Datos personales del fixture (`apps/desk/server/testing/septiembre2026.ts`)

Revisado campo a campo. La interfaz (`:9`) y la lista cerrada `CLAVES_DEL_FIXTURE` (`:19`) llevan únicamente: `id` (sintético, `sep-01` a `sep-13`),
`numero`, `clasificacion`, `estado`, `creado`, `cerrado`, las fechas de hito (`remisionEntrada`, `remisionSalida`, `revisionInforme`, `cotizacion`,
`ordenCompra`, `ordenVenta`, `recepcionRepuestos`, `finalizacionSt`), `diasEntrega` y `gerencia` (columnas 47 a 59). Los trece literales (`:23-47`) no
traen más claves. **No hay** contacto, asunto, serial, `cf_codigo_servicio`, tipo de servicio ni ids de Zoho; esos nombres sólo aparecen en el comentario
que declara lo que se excluye (`:5`). La siembra (`:55`) sólo inserta columnas de esa lista.
Contraste con el CSV (`C:\dev\Desk_2_R1.023\docs\sdd\Export_Zoho_Tickets_cerrados_2026-09.csv`, sin trackear; leído y no copiado): un script temporal,
fuera del repositorio, comparó por número de ticket la clasificación, las nueve fechas, `cf_dias_de_entrega` y las diez celdas de Gerencia: **273 celdas,
0 diferencias**. La prueba `apps/desk/server/routes/indicadoresSeptiembre.test.ts:55` fija la lista cerrada.

## 7. Barrido de citas de L3.13

Lo que dice `apply-progress.md` cuadra con el árbol. Muestreo comprobado: las anclas de `proposal.md:24-27` y `:88` «en `f0eb92c4`» (verificadas contra
ese árbol: `apps/desk/server/indicadores.ts:59-60` son las dos ventanas de `created_time`, `:67-70` el corte por creación con el comentario «Sin periodo salen
todos», y en `packages/shared/src/indicadores.ts` `:88` es `MOTIVO_H1` y `:238`, `:241` los `sinDato(MOTIVO_H1)`); las del propio cambio
(`packages/shared/src/cierreEnCifras.ts:19-21`, `:24-26`, `:29-33` caen en `esPasoDeMigracion`, `cierrePuestoPorMigracion` y `cierreQueCuenta`;
`apps/desk/server/routes/indicadoresComparacion.ts:33` es la llamada a `leerEntradasIndicadores`); y los números de la tabla de la regla 13. Caso A
confirmado: `openspec/specs/kpis/spec.md:1447` cita `apps/desk/server/indicadores.ts:70`, hoy un comentario; el corte vive en `:60`.

**Pendiente para el archivo (no es defecto de la rama):** reapuntar `openspec/specs/kpis/spec.md:1447` a `:60` al fusionar el delta.
**Pendiente para `main` (orquestador):** O-1 (`openspec/config.yaml:4096`, cita `MOTIVO_H1` en `:88-89`: anclarla «en `f0eb92c4`» y decir que hoy es
`MOTIVO_CIERRE`) y O-2 (`openspec/config.yaml:5199-5200`, cita `:59-60` y `:67-70`: anclarlas «en `f0eb92c4`»). Y los 7 casos C (superados por esta
tanda), anotados en `apply-progress.md` sin editar: `docs/sdd/ENTRADA.md:2128`, `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:247`, los paquetes de
despliegue del 2026-10-04 (líneas 643 y 978), el `design.md` archivado de `comparacion-exportacion-zoho` (línea 90) y el de `indicadores-51-55` (líneas 51-52).
`openspec/config.yaml` no se tocó en la rama (`git diff --stat` vacío).

## 8. Cabecera R-1 y `cierra: no`

`proposal.md:1-9` lleva los siete campos: `tanda: F1F-05`, `motivo: ""` (vacío es correcto porque no es `fuera-del-plan`), `capacidad: [kpis]`,
`maestro: ["Anexo G"]`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`. `cierra: no` es coherente: `proposal.md:32` y `:162` dejan fuera la
encuesta de satisfacción (55), que depende de la salida de correo de 1H-01. Un solo `tanda:` (R-4). Registro de intentos citado por el orquestador:
1 propuesta y spec 512, 2 diseño y tareas 363, 3 L1 280, 4 L2 357, 5 L3 236, todos passed, por debajo de la válvula de 720.

## 9. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W1 · RQ-KP-22 describe una consulta más estrecha que la que corre.** La spec del delta (`specs/kpis/spec.md:94-96`) dice que la cuarta consulta trae las
  respuestas «de esos tickets» (los del periodo), pero `apps/desk/server/indicadores.ts:85` trae las de TODOS los cerrados y las recorta en memoria con
  `vistos` (`:87`), porque el día de cierre sólo se conoce tras leer el historial. Lo observable se mantiene (sólo cuentan y sólo viajan las respuestas de la
  población; lo fijan `apps/desk/server/poblacionPorCierre.test.ts:95` y `:105`), y `design.md` (D4, «La consulta de la encuesta es más amplia que la
  población, y se dice») lo declara y decide no tocar la spec. No rompe ningún escenario. Queda como deriva de redacción de RQ-KP-14 y RQ-KP-22: conviene decidir
  al archivar si se precisa el texto o se deja el contrato observable como está.

### SUGGESTION
- **S1 · Los escenarios literales del 47 y del 51 de RQ-KP-11 no se afirman con sus números.** «El 47 de Zoho no cae en la remisión de salida» (17 y 20) y «El 51
  de Zoho cuenta hasta el cierre» (2 y 12) están cubiertos por sus equivalentes de RQ-KP-37 con otras fechas (11 y 12) y por la prueba de `:75` (sin cierre); la
  conducta es la misma, pero ninguna prueba usa los datos literales del escenario. Bastaría añadir las dos aserciones o reescribir el escenario del delta con las
  fechas de las pruebas.
- **S2 · O-1 y O-2 de `tasks.md` están abreviadas.** O-2 dice «citan `:59` y `:67`», pero `openspec/config.yaml:5199-5200` cita `:59-60` y `:67-70`; y O-1 dice `:88`
  cuando `openspec/config.yaml:4096` cita `:88-89`. Al aplicarlas en `main`, anclar los rangos completos.
- **S3 · RQ-KP-39, segundo escenario, sin mutación propia.** «Un cambio de respuesta ajeno… las rompe» lo cubren las tres caracterizaciones existentes (así lo
  anota `tasks.md` L2.7), pero no se registra una mutación que lo demuestre; las tres pasan con sus bytes originales.

## 10. Pendientes fuera de la rama

1. Archivo: reapuntar `openspec/specs/kpis/spec.md:1447` de `:70` a `:60`; decidir lo de W1; la fusión del delta mantiene las líneas de los cinco MODIFIED.
2. `main`, orquestador: O-1 y O-2 (sección 7, con S2) en `openspec/config.yaml`; los 7 casos C de la sección 7.
3. Personas (regla del ciclo 1; archivar NO las da por hechas): P-1 (corregir S-1 a S-11; Gerencia; lista semanal de supuestos) y P-2 (probar en la app los
   indicadores de septiembre por cierre; Gerencia / analista; lista acumulada de pruebas en la app).
4. F1F-05 sigue abierta (`cierra: no`): la encuesta de satisfacción (55) depende de 1H-01.

## 11. Recomendación

Siguiente fase: `sdd-archive`. Sin CRITICAL.
