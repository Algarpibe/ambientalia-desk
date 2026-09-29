```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:0ca9cc8edb3aefe5bf662a38da25ebb581737870f6cd51bbe30d72b3f8bdd47a
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 74/74
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:e1d840c2fa196695d16577efd0c5e5815d1bb6a19d52712b080a7d0dbe2e2bfe
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:76bb1c1b3ea3d9c7a13b2264bc5a0e12c62c309b1c688b3d02c18713f2085849
```

## Verification Report

**Change**: `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`)
**Versión**: verify sobre `bfee93f`. Seis lotes: `9288779`, `285ecf4`, `d6ed24c`, `5d93eb7`, `e2bf85b`+`3034cef`, `f00c127`+`bfee93f`
**Modo**: Strict TDD, almacén hybrid. Sin cambios propios sin commitear (sólo cinco `docs/sdd/Parte_*`/`Evidencia_*` ajenos sin trackear).
**`evidence_revision`**: sha256 de la salida de `npm test` seguida de la de `npm run build`, ejecutados en esta sesión.

Convención de estado, la del precedente (`archive/2026-09-28-asociacion-ov-ticket/verify-report.md`): **PASS** = una prueba que pasó
en esta sesión afirma el THEN; **PARTIAL** = el THEN sólo se sostiene en parte; **FAIL** = no se cumple.

### Completeness
| Métrica | Valor |
|---|---|
| Lotes (`tasks.md`) | 6/6 con todas sus subtareas `[x]`; 0 tareas sin marcar |
| Requisitos / escenarios | 12 / 74 (34 `tickets-core`, 13 `transitions-st`, 11 `remisiones`, 9 `zoho-sync`, 7 `derivacion-avisos`), coincide con la matriz de `tasks.md:361-442` |
| Tareas de persona (fuera del recuento, regla del ciclo 1) | P.1, P.4, P.5, P.6, P.7 (`tasks.md:445-453`). **Archivar NO las da por hechas** |
| `CLAUDE.md` y `openspec/config.yaml` | `git diff --stat 5e8f6d4 HEAD` vacío para los dos: correcto (S-10, S-21) |

### Ejecución (esta sesión, sobre `bfee93f`)
| Comando | Salida | Código |
|---|---|---|
| `npm test` | 155 ficheros pasan, 1 omitido (`migrate.integration.test.ts`, sin credenciales); **1848 pruebas verdes**, 2 omitidas; 108 s | 0 |
| `npm run typecheck` | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin errores | 0 |
| `npm run lint` | `165 problems (0 errors, 165 warnings)`: los mismos 165 del techo `--max-warnings 165` | 0 |
| `npm run build` | Vite compila (`built in 1.76s`) | 0 |

`apply-progress.md:316` declara 1848 verdes, typecheck limpio, lint 165 y build: **coincide con lo medido hoy**.

### Strict TDD
- RED previo declarado por lote en `apply-progress.md` (lote 5: 23 rojos en 5.1; lote 6: mutaciones de `index.ts`). Los escenarios que nacieron verdes
  (regresión de guardas vecinas) se declaran como tales en `tasks.md:188`, `:197`, `:206`, `:212`.
- Pruebas de posición (regla de mutación 1): 403 < 422 < 409 (`routes/contratos.test.ts:138-156`), C < D en las tres puertas
  (`services/ticketService.test.ts:1017`, `:1071`, `:1100`; `remisiones.test.ts:1329`) y guardas vecinas
  (`ticketService.test.ts:1027`, `:1033`, `:1039`, `:1080`, `:1086`; `remisiones.test.ts:1336`, `:1347`).
- Fichero vigilado (regla de mutación 2): `schema.sql:570` (`CHECK`) y `:572` (índice único) las ejercen `db/contratos.test.ts:49`, `:56`; `migrate.test.ts` fija 33 tablas.
- Supervivientes declarados (no reabiertos): prefiltro de la marca en `avisarRitmoContratos` (optimización; lo cubre el `UPDATE` condicional, `avisoRitmoContrato.test.ts:80`).
  Las de «liberada» (lote 4) y 5.10a (lote 5) ganaron prueba (`informeContrato.test.ts:87`, `:100`; `avisoRitmoContrato.test.ts:80`).

### Cumplimiento de escenarios (todas las pruebas pasaron en `npm test`)
Rutas relativas a `apps/desk/server/` salvo `shared` (= `packages/shared/src/contratos.test.ts`) y `subOV` (= `packages/zoho-sync/src/books/subOV.test.ts`).

**tickets-core (RQ-TC-08, 21, 22, 23, 24, 25) — 34 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| 1-3 | RQ-TC-08 sin cambios / asociación vigente 409 / posición existente | heredadas de `services/ticketService.test.ts` y `ordenVentaUnTicket.test.ts` (0 líneas de diff), verdes en la suite completa | PASS |
| 4 | Vencido bloquea el alta | `services/ticketService.test.ts:989` | PASS |
| 5 | Vencido gana al 409 | `services/ticketService.test.ts:1017` | PASS |
| 6 | Faltantes ganan al vencido | `services/ticketService.test.ts:1027` (más `:1033`, `:1039`) | PASS |
| 7 | Comercial registra | `routes/contratos.test.ts:35` (fila `Comercial`: 201, `creadoPor`, `createdAt`) | PASS |
| 8 | Sin Comercial, 403 | `routes/contratos.test.ts:35` (ST, Compras) y `:49` (403 con cuerpo inválido) | PASS |
| 9 | Administrador puede crear | `routes/contratos.test.ts:35` (fila `administrador sin área`) | PASS |
| 10 | Segundo del mismo lote, 409 | `routes/contratos.test.ts:117`, `:126` (carrera 23505); base: `db/contratos.test.ts:44`, `:49` | PASS |
| 11 | Contenido inválido, 422 | `routes/contratos.test.ts:100-115` (8 casos); `CHECK`: `db/contratos.test.ts:56` | PASS |
| 12 | Permiso > contenido > unicidad | `routes/contratos.test.ts:141`, `:147` | PASS |
| 13 | Lectura abierta a sesión | `routes/contratos.test.ts:57-67` (3 rutas por 6 roles), `:80` | PASS |
| 14-16 | Fin incluido / día siguiente / inicio y víspera | `shared:24-38` (`estadoContrato`), `:62-72` (`hoyEnZona`) | PASS |
| 17-21 | Ticket de contrato: vigente, vencido sin escribir, liberada, ordinaria o sin contrato, clientes distintos | `db/contratos.test.ts:126`, `:132`, `:140`, `:147`, `:154` | PASS |
| 22-27 | Prioridad `High` (Low a High, sin prioridad, sin contrato, vencido o no iniciado, fin = hoy, cliente del ticket) | `services/ticketService.test.ts:962-975` (`it.each`, 7 casos) y `:977`; `shared:75-80` | PASS |
| 28-32 | Vencido en cada puerta / sin contrato / no iniciado / último día / ordinaria y `OVI-` | `services/ticketService.test.ts:989`, `:997-1008`, `:1054`, `:1063`; `remisiones.test.ts:1321`, `:1354`; `db/contratos.test.ts:89`; `shared:40-60` | PASS |
| 33 | Vencido y unicidad, gana el vencido | `services/ticketService.test.ts:1017`, `:1071`, `:1100`; `remisiones.test.ts:1329` | PASS |
| 34 | Cuarentena y vencido, excluyentes | `services/ticketService.test.ts:1009` | PASS |

**transitions-st (RQ-TS-14, 18, 06) — 13 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| 35, 36, 41, 42, 45, 46 | Heredados (cuarentena, fecha de OC, orden de guardas) | pruebas del cambio 2 en `services/ticketService.test.ts` (aserciones sin cambio), verdes | PASS |
| 37 | Vencido bloquea `habilitar_servicio` | `services/ticketService.test.ts:1054` | PASS |
| 38 | Vencido gana al 409 | `services/ticketService.test.ts:1071` | PASS |
| 39 | Persona derivada inválida gana | `services/ticketService.test.ts:1086` | PASS |
| 40 | Sin contrato o no iniciado no bloquea | `services/ticketService.test.ts:1063` | PASS |
| 43 | Vencido en `Aprobación` | `services/ticketService.test.ts:1092` | PASS |
| 44 | Vencido gana al 409 en `Aprobación y S. Repuestos` | `services/ticketService.test.ts:1100` | PASS |
| 47 | Vencido (9) tras obligatorios (6) y antes de unicidad (10) | `services/ticketService.test.ts:1080`, `:1071` | PASS |

**remisiones (RQ-RE-16) — 11 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| 48, 50-53 | Heredados (ya asociada, mismo ticket, protección del sincronizador, cuarentena, fila de asociación) | pruebas del cambio 2 en `remisiones.test.ts`; el diff sólo añade `:1290-1360` y toca imports y cabecera | PASS |
| 49 | El 422 del serial gana al 409 | `remisiones.test.ts:988`, intacta | PASS |
| 54 | Vencido bloquea la remisión | `remisiones.test.ts:1321` | PASS |
| 55 | Vencido gana al 409 de unicidad | `remisiones.test.ts:1329` | PASS |
| 56 | La pendiente (`:177`) gana al vencido | `remisiones.test.ts:1336` | PASS |
| 57 | Los ítems fuera del checklist ganan | `remisiones.test.ts:1347` | PASS |
| 58 | Sin contrato o no iniciado | `remisiones.test.ts:1354` | PASS |

**zoho-sync (RQ-ZS-15) — 9 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| 59 | 10 subOV, 3 finalizadas, 2 en curso: 30 % y 50 % | `db/informeContrato.test.ts:45`, `:56` | PASS |
| 60 | Liberada devuelve a libre | `db/informeContrato.test.ts:87`, `:100` | PASS |
| 61 | Cuarentena, borrador y anulada no cuentan | `db/informeContrato.test.ts:69`; `subOV:90-110` (enfrentamiento con `saldoPorLote`) | PASS |
| 62 | Trimestres desde el inicio | `shared:82-106`, `:130-142` | PASS |
| 63 | % acumulado al cierre | `db/informeContrato.test.ts:133` | PASS |
| 64 | Equipo, serial, tipo, fecha y hueco | `db/informeContrato.test.ts:147`, `:159` | PASS |
| 65 | Sin creadas, 0 % | `db/informeContrato.test.ts:79`; `shared:149` | PASS |
| 66 | Días hasta el vencimiento | `shared:144`; `db/informeContrato.test.ts:169` | PASS |
| 67 | Se exporta como tabla | `shared:176-215` (`celdaCSV`, `csvDelInforme`); ruta `routes/contratos.test.ts:203-227`. El botón (`ContratoFicha.tsx`) queda fuera de la red (F0-00) | PARTIAL (W3) |

**derivacion-avisos (RQ-AV-14) — 7 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| 68 | Ritmo insuficiente avisa a Comercial | `services/avisoRitmoContrato.test.ts:60`; regla `shared:168` | PASS |
| 69 | Segunda evaluación no repite | `services/avisoRitmoContrato.test.ts:71`, `:80` | PASS |
| 70 | Trimestre siguiente avisa de nuevo | `services/avisoRitmoContrato.test.ts:88` | PASS |
| 71-73 | Ritmo suficiente / dentro de t1 / sin creadas o vencido | `services/avisoRitmoContrato.test.ts:97-108` (`it.each`); `shared:168-173` | PASS |
| 74 | El aviso no dispara correo | `services/avisoRitmoContrato.test.ts:60` (sólo bandeja) | PASS |

### Criterios de éxito de `proposal.md:166-172`
| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | `High` con contrato vigente aunque venga `Low` | `services/ticketService.test.ts:962`; código `services/ticketService.ts:106` | PASS |
| 2 | Vencido rechazado en tres puertas, gana a C y a 409 | `services/ticketService.ts:96`, `:147`; `routes/remision.ts:220`; pruebas de posición arriba | PASS |
| 3 | Marca de ticket de contrato, y deja de serlo al vencer | `db/contratos.test.ts:126`, `:132`; código `db/contratos.ts:106` | PASS |
| 4 | 30 % ejecutado y 50 % consumido a la vez | `db/informeContrato.test.ts:45` | PASS |
| 5 | Informe por trimestre exportable, hueco declarado | `db/informeContrato.test.ts:147`; `shared:209` | PASS (botón: W3) |
| 6 | Un aviso por trimestre; segunda evaluación, cero | `services/avisoRitmoContrato.test.ts:60`, `:71` | PASS |
| 7 | `remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts` sin cambios | `:988` intacta; `ordenVentaUnTicket.test.ts` sin diff desde `5e8f6d4` | PASS |

### Regla 13: tabla de `apply-progress.md:283-292` contra las líneas reales de hoy
| Afirmación de la tabla | Línea real leída hoy | Estado |
|---|---|---|
| `403` antes de leer el cuerpo | `routes/contratos.ts:43` (`canExecuteTransition`); cuerpo en `:45` | correcta |
| `requireAuth` en las lecturas | `routes/contratos.ts:24`, `:28`, `:36`, `:65` | correcta |
| Validación: `esLote` `:49`, fechas `:50`, fin no anterior a inicio `:51`, cliente `:52`, `409` `:55` y `:59` | idénticas | correcta |
| `CHECK` `schema.sql:570`, índice único `:572` | idénticas | correcta |
| Marca derivada `routes/contratos.ts:36` hacia `db/contratos.ts:106` | idénticas | correcta |
| Estado y saldo `routes/contratos.ts:28`; informe `:65` | `:28` abre la ruta (estado y saldo en `:33`); `:65` abre la del informe | correcta |
| `High` `ticketService.ts:106` | `prioridadAlNacer(b.prioridad, await hayContratoVigente(db, clientId!))` | correcta |
| `celdaCSV` `packages/shared/src/contratos.ts:219`, `csvDelInforme` `:233` | idénticas | correcta |
| Sólo `GET` y `POST` | cinco rutas: `:24`, `:28`, `:36`, `:40`, `:65`; ningún `PUT`, `PATCH` ni `DELETE` | correcta |

Ninguna decisión del cliente queda sin línea del servidor. El CSV es la excepción declarada: lo genera el navegador y la regla vive en `shared`, probada en node.

### Design coherence
- Orden B < C < D en `POST /api/contratos`: `routes/contratos.ts:43` < `:49-52` < `:55`. Coincide con el diseño.
- Vencido tras la cuarentena y antes de `ticketConOrdenVenta`: `services/ticketService.ts:96` (alta); `:147` antes de `:148-152` (transición); `routes/remision.ts:220` tras el 422 de A/C. Coincide.
- Decisión de vigencia con `motivoVencido` en `shared`, no en SQL; `LOTE_OV` retirado en favor de `esLote` (`routes/contratos.ts:49`).
- Aviso de ritmo: marca y aviso en la misma transacción (`avisoRitmoContrato.test.ts:128`, `:134`); pasada antes de `sync.syncRecent()` (`index.ts:88`), y la prueba `avisoRitmoContrato.test.ts:185` fija el ORDEN, no la línea.

### Issues
**CRITICAL**: ninguno.

**WARNING**
- **W1 · Hallazgo PREVIO al cambio, no lo causa.** `openspec/specs/transitions-st/spec.md:32` y `:1052` citan `ticketService.ts:145` como «el actor es el usuario de la sesión». En la partida (`5e8f6d4`) esa línea ya era un comentario; hoy el actor está en `ticketService.ts:153` (`const actor = user.name ?? TRANSITION_ACTOR`). Es caso A (afirmación presente, línea desfasada). **Debe corregirse al archivar** (`:32` y `:1052` a `:153`), en el mismo acto que la fusión del delta de `transitions-st`; no bloquea.
- **W2 · Atomicidad del aviso probada por estructura, no por efecto.** pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`), así que `avisoRitmoContrato.test.ts:128` y `:134` fijan la secuencia `BEGIN/UPDATE/SELECT/INSERT/ROLLBACK` en un mismo cliente. La reversión real sólo la verifica Postgres (P.6).
- **W3 · Escenario 67, PARTIAL.** Los datos y el texto CSV están probados en node (`shared:197-215`); el botón, el BOM y el `Blob` de `ContratoFicha.tsx` no (`.tsx` fuera de la red por decisión de Gerencia F0-00; no es carencia). Lo cubre la verificación manual P.6. Se cuenta 74/74 porque el THEN comprobable (una fila por trimestre y servicio, con el hueco) está afirmado.
- **W4 · Hipótesis sin cerrar.** Que `index.ts:85` registra el `setInterval` siempre y que la pasada de ritmo corre en producción (`tasks.md:325`). Sólo la comprueba P.6.
- **W5 · Superviviente declarado.** El prefiltro de la marca en `avisarRitmoContratos` no lo detecta ninguna prueba (optimización, no comportamiento).

**SUGGESTION**
- S1 · `RQ-AV-14` define `díasTranscurridos` = hoy menos inicio y el diseño (S-19) suma 1; `shared:163-173` fija el `+1`. Al archivar, alinear el texto del requisito con S-19 (`tasks.md:443`).
- S2 · El `archive-report` debe llevar la línea de cobertura de F1B-11 (`cierra: no`; fuera la ampliación E-086 y la regla Top 5, F1B-07).
- S3 · El `git mv` del archive supera 800 líneas por diseño (regla del ciclo 2): el ledger del archive debe pedir un techo mayor, como en `asociacion-ov-ticket`.

### Verdict
**PASS WITH WARNINGS.** 12/12 requisitos, 74/74 escenarios (73 PASS y 1 PARTIAL por el botón `.tsx`), siete criterios de éxito cumplidos, regla 13 sin discrepancias, 0 críticos. Listo para `sdd-archive`; W1 se corrige en el archive.
