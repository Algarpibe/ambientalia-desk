```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:9209f7ee5d23b2073c67c67042fe1a624159c87fa16326935115dbb864a910d3
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 21/21
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:4fbb4414d5f379fd1bd0896a156c846243690ce6101b604c0037c299adec8fc2
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:84a5eaef903a77d17c737d5a7a434cc06cd93829474762728a4ec160de474817
```

## Verification Report

**Change**: `permisos-por-cargo` (F1C-05, `cierra: no`)
**Versión**: verify sobre `e71fd3f`. Tres lotes: `db5630f` (shared), `d201fe4` (servidor), `e71fd3f` (cliente y cierre). Planificación `38eed82`.
**Modo**: Strict TDD, almacén hybrid. Árbol de trabajo: sólo cinco `docs/sdd/Parte_*`/`Evidencia_*` y el `.docx` de la R08.3 sin trackear, ajenos al cambio.
**`evidence_revision`**: sha256 de la salida de `npm test` (exit 0) seguida de la de `npm run build` (exit 0), ambas de esta sesión.

Convención de estado (la de `archive/2026-09-29-alarmas-horas-habiles/verify-report.md`):
**PASS** = una prueba que pasó en esta sesión afirma el THEN; **PARTIAL** = algún elemento del THEN sólo se sostiene por lectura;
**FAIL** = no se cumple; **MANUAL** = verificación de una persona por decisión F0-00 (`.tsx` fuera de la red, sin `jsdom`).

### Completeness
| Métrica | Valor |
|---|---|
| Tareas de `tasks.md` | 49/49 `[x]`, 0 sin marcar. Ninguna describe trabajo no hecho: cada una tiene su lugar en el código o en las pruebas (tabla de escenarios) |
| Requisitos / escenarios | 12 / 21 (RQ-PM-12..22 ADDED: 11 requisitos, 18 escenarios; RQ-PM-03 MODIFIED: 3 escenarios). Coincide con `tasks.md:272` («21/21 cubiertos») |
| Cabecera R-1 de `proposal.md:1-9` | `tanda: F1C-05`, `cierra: no`, `toca_maestro: si`, siete campos. R-2 no aplica: `permissions` ya está en `capabilities` |
| `CLAUDE.md` y `openspec/config.yaml` | sin diff entre `38eed82` y HEAD (`git diff --stat --no-renames 38eed82 HEAD -- CLAUDE.md openspec/config.yaml` vacío) |
| Tareas de persona (fuera del recuento, regla del ciclo 1) | P.1, P.2, P.3 (`tasks.md:278-280`), fuera de las 49. **Archivar NO las da por hechas** |

### Ejecución (esta sesión, sobre `e71fd3f`)
| Comando | Salida | Código |
|---|---|---|
| `npm test` | 161 ficheros pasan, 1 omitido (`migrate.integration.test.ts`, sin credenciales); **2044 pruebas verdes**, 2 omitidas; 108,9 s. Coincide con `apply-progress.md` (lote 3) | 0 |
| `npm run typecheck` | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin errores | 0 |
| `npm run lint` | `165 problems (0 errors, 165 warnings)`: sin avisos nuevos | 0 |
| `npm run build` | Vite compila (`built in 1.70s`) | 0 |
| `npx vitest run cargos.test.ts cargoPermiso.test.ts permisos.test.ts migrate.test.ts auth/users.test.ts` | 5 ficheros, **116 pruebas verdes** (19 en `cargoPermiso.test.ts`) | 0 |

No se ejecutó el detector de citas (`citas/cli.ts --sha HEAD`): trabaja sobre commits y `apply-progress.md` (lote 3) declara el barrido de la regla 4 como pendiente de pasar tras el commit; queda para el cierre (WARNING 2).

### Strict TDD
- RED previo por lote en `apply-progress.md`: lote 1, `./cargos` inexistente y `puedeEjecutarTransicion` sin exportar; lote 2, ciclo RED/GREEN por bloque de tareas (2.1-2.22); lote 3, `.tsx` sin RED por F0-00. Lo que nació verde se declara en `apply-progress.md` (lote 2, «Nacen verdes y se declaran»).
- Posición (regla de mutación 1): P1 a P4 (`cargoPermiso.test.ts:211`, `:220`, `:228`, `:236`) activan las DOS guardas vecinas a la vez y comparan mensaje; mutaciones (a), (b), (c) del lote 2 declaradas en `apply-progress.md`.
- Fichero vigilado (regla de mutación 2): `schema.sql` última sentencia, `migrate.test.ts:519-524`, y guardián de `ALTER` en `:374-378` (41 `ALTER`: 20 calificadas, 21 sin calificar).
- Las mutaciones del apply no se reproducen aquí salvo la de la sección «Mutación de comprobación».

### Cumplimiento de escenarios (todas las pruebas pasaron en `npm test`)
Abreviaturas: `cp` = `apps/desk/server/cargoPermiso.test.ts`; `pt` = `apps/desk/server/permisos.test.ts`; `cg` = `packages/shared/src/cargos.test.ts`;
`ut` = `apps/desk/server/auth/users.test.ts`; `mt` = `packages/zoho-sync/src/db/migrate.test.ts`. Producción: `cargos.ts` = `packages/shared/src/cargos.ts`; `ts` = `apps/desk/server/services/ticketService.ts`.

| RQ | # | Escenario | Prueba | Línea de producción | Estado |
|---|---|---|---|---|---|
| RQ-PM-12 | 1 | La lista tiene siete entradas exactas, «Gerente comercial» fuera | `cg:23` (siete, a mano y en orden), `cg:29` (sin «Gerente comercial»), guardián contra `decision/c10b` `cg:40-63` | `cargos.ts:12-15` | PASS |
| RQ-PM-13 | 2 | El cargo de firma no da permiso | `cp:150` (S2: `users.cargo = Director Comercial`, `cargo_permiso` nulo, 403) | `ts:131`, `cargos.ts:40-41` | PASS |
| RQ-PM-13 | 3 | Migración calificada y al final | `mt:519-524` (última sentencia `ALTER TABLE public.users ... cargo_permiso text`, sin `CHECK`); guardián `mt:374-378`, `:332-352` | `schema.sql` (última sentencia) | PASS |
| RQ-PM-14 | 4 | Valor desconocido en base se lee como sin cargo | `ut:142-149` (S4 repositorio: `null` y `rowToPublicUser`); `cp:140` (S4 HTTP: 403 con el valor escrito por SQL) | `users.ts:30`, `cargos.ts:40-41` | PASS |
| RQ-PM-15 | 5 | Cargo inválido: 422 y no se escribe | `cp:46` (alta, dos valores, la fila no existe), `cp:58` (edición, ni cargo previo ni resto del parche) | `auth/routes.ts:70-71`, `:99-100` | PASS |
| RQ-PM-15 | 6 | No admin: 403 | `cp:68` (S6: alta y auto-edición dan 403, la columna no cambia) | `auth/routes.ts:55`, `:76` (`requireAdmin`) | PASS |
| RQ-PM-15 | 7 | Vaciar el cargo | `cp:82` (S7: la cadena vacía deja `null`; alta sin campo `null`; edición sin campo no lo borra) | `auth/routes.ts:70`, `:99`, `cargos.ts:90-97` | PASS |
| RQ-PM-16 | 8 | La sesión real lleva el cargo | `cp:36` (S8: `/api/auth/me` con cookie real devuelve `Director Comercial`); `cp:187` (misma cookie, 403 a 200 sin reentrar) | `sessions.ts:17`, `users.ts:14`, `:30`, `types.ts:222` | PASS |
| RQ-PM-17 | 9 | Comercial sin cargo | `cp:102` (S9: 403, nombra Director Comercial y «Liberación sin factura», ticket sigue en `Por Facturar`) | `ts:131` | PASS |
| RQ-PM-17 | 10 | Director Comercial | `cp:112` (S10: 200 y `Por Entregar / Sin facturar`) | `ts:131`, `cargos.ts:45-53` | PASS |
| RQ-PM-17 | 11 | Otro cargo comercial | `cp:120` (S11: Coordinador Comercial y Director Técnico, 403 que nombra Director Comercial) | `ts:131` | PASS |
| RQ-PM-18 | 12 | 409 antes que 403 de cargo | `cp:220` (P2: `Ingresado`, 409 «no aplica desde el estado»); `cp:228` (P3, 409 de flujo) | `ts:125-128` antes de `:131` | PASS |
| RQ-PM-18 | 13 | 403 de área antes que el de cargo | `cp:211` (P1: Servicio Técnico sin cargo oye «área: Comercial» y NO «Director Comercial») | `ts:129-130` antes de `:131` | PASS |
| RQ-PM-18 | 14 | 403 de cargo antes que 422 | `cp:236` (P4: cuerpo vacío da 403; el control con admin y el mismo cuerpo da 422) | `ts:131` antes de `:132-134` | PASS |
| RQ-PM-19 | 15 | Admin sin cargo | `cp:160` (S15+S18: base sin ningún `cargo_permiso`, admin 200); `pt:89` (admin pasa por las 34) | `cargos.ts:49` | PASS |
| RQ-PM-20 | 16 | Por cargo y admin | `cg:118-123` (siete cargos, sin cargo, cargo sin área y admin para OVI de garantía), `cg:124-129` (Top 5); el título de `cg:117` declara «HOY NO LAS LLAMA NADIE» | `cargos.ts:71-74`, `:80-83` | PASS |
| RQ-PM-21 | 17 | Cargo sin área | `cp:132` (S17: Servicio Técnico + Director Comercial, 403 de ÁREA); `pt:356` (816 casos, ninguno concede lo que el área niega); `cg:189` | `cargos.ts:56-58` | PASS |
| RQ-PM-22 | 18 | Nadie tiene cargo | `cp:160` (S15+S18: precondición afirmada, `cargo_permiso IS NOT NULL` vacío; no admin 403 con el cargo; admin 200) | `ts:131` | PASS |
| RQ-PM-03 (MOD) | 19 | La matriz de área, sin cambios | `pt:77-81` (102 casos, 60 prohibidos, 42 permitidos, sólo área) | `permissions.ts` sin tocar | PASS |
| RQ-PM-03 (MOD) | 20 | Prohibición por área | `cp:173` (S20: Compras + `facturado`, 403 con «área: Comercial») | `ts:129-130` | PASS |
| RQ-PM-03 (MOD) | 21 | Exactamente un caso difiere | `cp:250` (S21, HTTP, 102 celdas contra `canExecuteTransition`: una sola diferencia, Comercial × `liberacion_sin_factura`, observado 403); `pt:341` (pura); `pt:349` (61/41) | `cargos.ts:56-58`, `:32` | PASS |

**Recuento por estado**: 12 requisitos, todos PASS; 21 escenarios: **21 PASS, 0 PARTIAL, 0 FAIL, 0 MANUAL**.
La spec no lleva escenarios de UI; lo de UI (`TransitionPanel.tsx:57`, `UsersAdmin.tsx:123`, `:183`) es comodidad o entrada, y su verificación visual es la tarea de persona P.2 (`tasks.md:279`), MANUAL por F0-00 y fuera de la matriz.

### Criterios de éxito de `proposal.md:146-153` (6/6)
| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | Comercial sin cargo 403 que nombra Director Comercial; con cargo 200; admin 200 | `cp:102`, `:112`, `:160` | PASS |
| 2 | Matriz HTTP: un solo caso difiere; `:77-81` sigue 60/42 | `cp:250`, `pt:341`, `pt:77-81` | PASS |
| 3 | Director Comercial de área técnica: 403 fuera de su área | `cp:132`, `pt:356` | PASS |
| 4 | Cargo fuera de lista 422 en alta y edición; no admin 403 | `cp:46`, `:58`, `:68` | PASS |
| 5 | Mover el 403 de cargo delante del 409 de estado o detrás del 422 pone la suite en rojo | `cp:220`, `:228`, `:236`; mutaciones (b) y (c) de `apply-progress.md` (lote 2). No reproducidas aquí | PASS (mutación por hipótesis del apply) |
| 6 | Primitivas OVI y Top 5 por cargo y admin | `cg:118-129` | PASS |
Las casillas de `proposal.md:148-153` siguen sin marcar: ver SUGGESTION 1.

### Supuestos S-1, S-9, S-10
- **S-1 (estricto mientras nadie tenga cargo)**: implementado sin respaldo al área. `cargos.ts:49-52` sólo deja pasar al admin o al cargo exacto; `cp:160` afirma que con la base sin cargos el no admin recibe 403 y el admin 200. Sin `CHECK` en base (S-3): `schema.sql` última sentencia, `mt:524`. PASS.
- **S-9 (área de los dos actos sin llamador)**: `cargos.ts:72` exige Servicio Técnico y `:81` Comercial, además del cargo; `cg:118-129` lo fija con «cargo sin área». Sin llamador en el código (hipótesis: no se hizo un grep exhaustivo de llamadores en este verify). PASS.
- **S-10 (orden: 409 gana al 403 de cargo)**: el usuario pidió lo contrario para los dos 409; se siguió el orden de F1B-10 (`design.md` §5, `apply-progress.md` lote 2 «S-10»), que coincide con RQ-PM-18 del delta. Fijado por P2 y P3 (`cp:220`, `:228`). No contradice la spec; se documenta como desvío declarado del encargo, sin acción.

### Regla 13, decisión a decisión (`apply-progress.md`, lote 3). Se comprobaron tres líneas de servidor
| Decisión del cliente | Línea del servidor leída | Resultado |
|---|---|---|
| `TransitionPanel.tsx:57` oculta la Liberación sin el cargo | `ticketService.ts:129-130` (área) y `:131` (cargo `cargoQueFaltaParaTransicion`, 403) | Correcta; probada por `cp:102`, `:112`, `:120`, `:132` |
| El selector de `UsersAdmin.tsx` ofrece los siete y «Sin cargo» | `auth/routes.ts:70-71` (alta) y `:99-100` (edición): `cargoPermisoDelCuerpo`, 422 | Correcta; `cp:46`, `:58` |
| Sólo un admin ve la consola | `requireAdmin` en `auth/routes.ts:51`, `:55`, `:76`; cliente `Header.tsx:146` (`user.isAdmin`) | Correcta; `cp:68` |
Las tres líneas están donde las cita la tabla del apply. Toda decisión del cliente tiene línea de servidor probada: comodidad legítima (regla 13, punto 3).

### Coherencia con el diseño
| Decisión de `design.md` | Código | Estado |
|---|---|---|
| Dominio puro en `shared`; excepciones como dato | `cargos.ts:27-35` (`EXCEPCIONES_POR_CARGO`), exportado en `index.ts:25` | Coherente |
| `canExecuteTransition` intacta; la compuesta la envuelve | `cargos.ts:56-58`; `permissions.ts` sin diff | Coherente |
| 403 de cargo editado en sitio, tras el área, antes del 422 | `ts:131` en la misma línea que el cierre del `if` de área (sin desplazar) | Coherente |
| Sin `CHECK`; lista cerrada sólo en `shared` | `schema.sql` (última sentencia); `users.ts:30` `esCargo` | Coherente |
| `cargo` (firma) distinto de `cargo_permiso` | `users.ts:14`, `types.ts:220-222`; `cp:150` | Coherente |
| Cambio de cargo surte efecto en la siguiente petición | `sessions.ts:17`; `cp:187` (misma cookie) | Coherente |

### Ledger frente a git
`gentle-ai sdd-attempt status --cwd . --change permisos-por-cargo` (sólo lectura): intentos 1 a 3 `passed`, intento 4 `verify` en `running` (0 líneas hasta ahora), presupuesto 800 y 2 intentos máximos por objetivo.
| Intento | Lote | Rango git | `git diff --shortstat --no-renames` | Git (ins + del) | Ledger `changed_lines` | Coincide |
|---|---|---|---|---|---|---|
| 1 | lote-1-shared | `38eed82..db5630f` | 9 ficheros, 432 ins, 21 del | 453 | 453 | Sí |
| 2 | lote-2-servidor | `db5630f..d201fe4` | 14 ficheros, 417 ins, 52 del | 469 | 469 | Sí |
| 3 | lote-3-cliente-cierre | `d201fe4..e71fd3f` | 14 ficheros, 138 ins, 29 del | 167 | 167 | Sí |
| 4 | verify | (en curso) | este informe, sin código | ~155 | 0 (running) | A medir al settle |
Total git `38eed82..e71fd3f`: 30 ficheros, 986 ins, 101 del (1087). Suma del ledger de los tres lotes: 1089 (453+469+167). Las cifras por lote coinciden exactas; los 2 de diferencia con el agregado son, hipótesis, líneas tocadas en más de un lote que se compensan en el diff total.

### Mutación de comprobación (una pasada, revertida)
Mutación: en `packages/shared/src/cargos.ts:32` se sustituyó la entrada `liberacion_sin_factura` de `transiciones` por un objeto vacío. Se corrieron `cargos.test.ts`, `cargoPermiso.test.ts`, `permisos.test.ts` y `auth/users.test.ts`.
**Resultado: 23 pruebas en rojo** (`Tests 23 failed | 65 passed`, 3 ficheros):
| Fichero | Rojas | Cuáles |
|---|---|---|
| `cargoPermiso.test.ts` | 8 | S9, S11, S4 (HTTP), S2, S15+S18, «surte efecto», **P4**, **S21** |
| `permisos.test.ts` | 2 | `:341` (un caso difiere) y `:349` (**61 prohibidos / 41 permitidos**) |
| `cargos.test.ts` | 13 | tabla como dato (2), `cargoQueFalta` (1), compuesta (1), `puedeLiberarSinFactura` (1), cargo desconocido o vacío (8) |
Dos precisiones frente a lo que esperaba el encargo:
- **La matriz HTTP de `permisos.test.ts:43` NO cae** (la celda Comercial × `liberacion_sin_factura` sigue en 200 observado y 200 esperado): su `esperado` sale de `puedeEjecutarTransicion` (`pt:63-64`), que la mutación vacía por igual, así que es autoconsistente por diseño. Lo que la ata al cargo es S21 (`cp:250`), que compara contra `canExecuteTransition` sólo de área y sí cae. El 61/41 lo afirma la prueba pura `pt:349`, que sí cae. Ver WARNING 1.
- **S10 (`cp:112`) NO cae**, y es lo esperado: afirma el 200 del Director Comercial, que sin excepción también es 200. P4 sí cae (el 403 pasa a 422).
Reversión: `git checkout -- packages/shared/src/cargos.ts`; `git diff --stat` vacío y sin ficheros tracked modificados.

### Issues
**CRITICAL**: ninguno.

**WARNING**
1. La matriz HTTP de área de `permisos.test.ts:43-66` es tautológica respecto a la excepción por cargo: su `esperado` consume la compuesta (`:64`), así que vaciar `EXCEPCIONES_POR_CARGO.transiciones` no la pone roja. Queda cubierta por S21 (`cargoPermiso.test.ts:250`, contra la matriz de área) y por `permisos.test.ts:341` y `:349`; RQ-PM-03 no queda sin detector, pero el detector no es la matriz que su nombre sugiere. Sin acción; se anota para quien lea la matriz como prueba del cargo.
2. Barrido de citas de la regla de mutación 4 pendiente: el detector sólo mide commits y este verify no lo ejecutó. Debe pasarse `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` en el cierre (0 completas rotas esperadas; las 11 abreviadas informativas son previas). Los casos B ya están anclados según `apply-progress.md` (lote 3).
3. Las mutaciones (a) a (k) del apply no se reprodujeron aquí (sólo una pasada); se citan como hipótesis del apply, con prueba nombrada por cada una.

**SUGGESTION**
1. Marcar las seis casillas de `proposal.md:148-153` como cumplidas en el cierre (todas tienen prueba; ver tabla de criterios). No bloquea.
2. La UI (`UsersAdmin.tsx`, `TransitionPanel.tsx`) queda MANUAL por F0-00: P.2 la cubre; no proponer `jsdom`.

### Verdict
**PASS WITH WARNINGS**: 12/12 requisitos y 21/21 escenarios con prueba ejecutada en verde, `npm test` 2044 verdes (exit 0), typecheck y build limpios, lint 165 avisos y 0 errores, tareas 49/49, ledger igual a git lote a lote. Ningún CRITICAL. Las P.1-P.3 quedan fuera del recuento y archivar no las da por hechas.

## Nota del orquestador sobre W2 y W3

- **W2:** el detector de citas sí corrió sobre cada commit de la tanda: `db5630f`, `d201fe4` y `e71fd3f` (este último tras
  corregir un bloqueo de `apply-progress.md`), con exit 0 y las 11 abreviadas rotas preexistentes. Falta sólo el del commit de este informe.
- **W3:** el orquestador reprodujo 10 mutaciones además de la de este informe: en el lote 1, (g), (g2), (g3), (l), (n) y (m);
  en el lote 2, las de posición (a), (b) y (c) y la de sesión (d). Todas revertidas y comprobadas con `cmp`.
