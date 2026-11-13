```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:44d8cc406cde4c60228cf70f24ceb7d96edec7862a2152f3eff62f105c393b3a
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 21/21
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:b8d91ff5981ad961c3ea74ea203664663a4d1ac841af2d19ba620f4411714d2d
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:8251fc0b549a432eba05fb2fac4ac8f2657d41dfc539a760445630317e9d9bdf
```

## Verification Report

**Change**: `cliente-prestado-conexion-cortada` (E-290, `fuera-del-plan`, `cierra: si`)
**Mode**: Strict TDD · persistencia hybrid · intento i5
**Árbol verificado**: `02dca012fee6443892bc5fe85d6f3639c814bf69` (HEAD del worktree `C:\dev\Desk_2_R1.023-worktrees\cliente-prestado-conexion-cortada`), partida `4d7aad75`. Único cambio sin commitear al arrancar: las casillas L1.10 y L2.7 de `tasks.md`, del orquestador.
**`evidence_revision`**: sha256 de la cadena del commit `02dca012…` completo.
**Método**: verificación independiente. Nada de `apply-progress.md` se dio por bueno: PostgreSQL, mutaciones, comparación en sitio y las cinco comprobaciones se reprodujeron.

### Completeness
| Metric | Value |
|---|---|
| Tareas de código (L1.1 a L2.7) | 17 de 17 marcadas `[x]` en `openspec/changes/cliente-prestado-conexion-cortada/tasks.md` |
| Pendientes | V.1 (esta verificación, que se marca) y A.1 (archivo, i6): fases siguientes, no trabajo de código |
| Tareas de persona | P-1, P-2 y P-3 fuera del recuento, con dueño y destino (regla del ciclo 1); archivar no las da por hechas |
| Requisitos | RQ-ZS-63 a RQ-ZS-67: 5 de 5 con implementación y prueba |
| Escenarios | 21 de 21 (5 + 4 + 5 + 4 + 3), tabla abajo |

### Build & Tests Execution
Memoria libre al arrancar: **7.568.964 KB** (≈ 7,2 GB); antes de la cadena, 7.204.248 KB, y antes de `npm test`, 7.375.400 KB. Cadena sobre `HEAD`, un paso tras otro y con el código de cada uno:

| Paso | Salida | Detalle |
|---|---|---|
| `npm run typecheck` | 0 | |
| `npm run lint -- --max-warnings 165` | 0 | **165 avisos contra 165**, 0 errores |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 8.865 comprobadas, línea base 0, 0 cabeceras R-1 inválidas; 13 abreviadas rotas informativas, ninguna de este cambio |
| `npm test` (log `npmtest-verify-1036.log` en el scratchpad, primer plano) | 0 | 378 ficheros pasan y 6 omitidos; **6.500 pruebas pasan, 36 omitidas** (las de integración sin `TEST_DATABASE_URL`: se corrieron aparte, abajo); 285,7 s de vitest; sin «Timeout onTaskUpdate» |
| `npm run build` | 0 | `index-F1jDYjEU.js` 427,51 kB y `index-BXv9vVDm.css`: **el mismo bundle de producción**, el cliente no cambia |

Cobertura: no se mide (no hay herramienta en el preflight); no es fallo.

### PostgreSQL real (CA-2 a CA-5)
Contenedor propio `cpc-pg-v` (`postgres:17-alpine`, puerto 55436; el `cpc-pg17` del orquestador, 55432, no se tocó). `SHOW server_version` = **17.10**. `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55436/postgres npx vitest run` sobre la integración y la unitaria: **2 ficheros, 36 de 36 verdes** (10,3 s). Las aserciones de cada caso fijan lo siguiente (líneas de `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`):

| Caso | Prueba | Tiempo | Salida | Sin «Unhandled 'error' event» | Líneas de E-285 | Líneas del cliente prestado | Pasos y resto |
|---|---|---|---|---|---|---|---|
| I-1 `createPool` desk, reposo | `:132` | 1.349 ms | 0 | sí | 1, con `[57P01]` | 0 | pid posterior distinto del cortado |
| I-2 `createPoolFromUrl`, reposo | `:141` | 1.298 ms | 0 | sí | 1, con `[57P01]` | 0 | ídem |
| I-3 consulta en curso (`pool.query()`) | `:164` | 1.319 ms | 0 | sí | 0 | 0 | la consulta rechaza con `57P01`; pid nuevo |
| I-4 prestado con `BEGIN`, `idle in transaction` | `:179` | 1.248 ms | 0 | sí | 0 | **1**: `… — terminating connection due to administrator command [57P01]` | `listo`, `siguiente` (rechazada), `rollback` (rechazada), `baja` (total 0), `despues` (pid nuevo) |
| I-5 prestado con consulta en curso, `active` | `:189` | 1.208 ms | 0 | sí | 0 | **1**: `… — Connection terminated unexpectedly`, sin código | la consulta rechaza con `57P01`; `rollback` rechaza; `baja` total 0; pid nuevo |
| I-6 `createPoolFromUrl`, prestado con `BEGIN` | `:199` | 1.229 ms | 0 | sí | 0 | **1**: igual que I-4 | los mismos cinco pasos que I-4 |

Antes de cortar, cada caso espera el estado del backend (`hasta(...)`, `:155`; I-1 e I-2 esperan que el backend desaparezca, `:104`) y exige `pg_terminate_backend` = `true` (`:103`, `:156`): no hay verde falso. La línea de I-5 coincide con la hipótesis de la spec (RQ-ZS-65) y del diseño. Contenedor retirado con `docker stop cpc-pg-v`; `docker ps -a` no lo lista.

### Matriz escenario → prueba
Unitarias en `packages/zoho-sync/src/db/conexionPerdida.test.ts`; todas verdes.

| Escenario | Prueba (`ruta:línea`) | Resultado |
|---|---|---|
| RQ-ZS-63 · cliente prestado emite `error`: no lanza, una línea | U-11 `conexionPerdida.test.ts:225`; I-4 `…integration.test.ts:179` | OK |
| RQ-ZS-63 · cliente en reposo: sin línea del oyente de cliente | U-12 `:235` (el del pool da exactamente la línea de E-285) | OK |
| RQ-ZS-63 · cliente liberado: sin línea | U-13 `:247` | OK |
| RQ-ZS-63 · dos errores del mismo cliente: una línea | U-14 `:258`; I-4 | OK |
| RQ-ZS-63 · dos clientes prestados: dos líneas | U-15 `:268` | OK |
| RQ-ZS-64 · texto propio, sin contener al de E-285, con `[57P01]` | U-16 `:280`, U-11 `:225` | OK |
| RQ-ZS-64 · sin `code`, sin corchetes | U-16 `:280`; I-5 `:189` | OK |
| RQ-ZS-64 · ningún secreto en la línea (mutación 2) | U-17 `:293` (M-6 del apply la pone roja) | OK |
| RQ-ZS-64 · un `registrar` que lanza no tumba el proceso | U-18 `:313` (M-5 del apply) | OK |
| RQ-ZS-65 · I-4 reescrita en sitio, mismo número de líneas | `…integration.test.ts:179-187`; cambian sólo las 176 a 185 (ver comparación) | OK |
| RQ-ZS-65 · H-2, consulta en curso dentro de la transacción | I-5 `:189` | OK |
| RQ-ZS-65 · worker con `createPoolFromUrl` | I-6 `:199`; U-19 `conexionPerdida.test.ts:324` (los tres pools reales) | OK, el arnés lo permite |
| RQ-ZS-65 · sin regresión en I-1, I-2 e I-3 | `:132`, `:141`, `:164`; cada una cuenta también las líneas del texto nuevo (0) | OK |
| RQ-ZS-65 · verde falso evitado | `hasta(...)` y `expect(await terminar(pid)).toBe(true)` | OK |
| RQ-ZS-66 · los siete ficheros no cambian | `git diff --quiet 4d7aad75 -- <pool.ts y los seis sitios>`: salida 0; U-10 `conexionPerdida.test.ts:184` verde | OK |
| RQ-ZS-66 · `conexionPerdida.ts` conserva sus líneas | comparación abajo: sólo cambia la 44; lo nuevo va de la 46 a la 69 | OK |
| RQ-ZS-66 · sin variable ni interruptor | `.env.example`, `schema.sql` y `migrate.ts` sin diff contra `4d7aad75` | OK |
| RQ-ZS-66 · quitar oyente, filtro o deduplicación pone rojas las pruebas | M-1 y M-3 reproducidas; M-2 sólo la del apply | OK |
| RQ-ZS-67 · la §27 declara el cliente prestado cubierto | `apps/desk/server/deployPoolConexionCortada.test.ts:41` y `:74-94` verdes sobre el `DEPLOY.md` real | OK |
| RQ-ZS-67 · ensuciar el fichero vigilado pone la guarda en rojo | `deployPoolConexionCortada.test.ts:75`, `:83`, `:89`; posición `:64`; DEPLOY-1 reproducida | OK |
| RQ-ZS-67 · `DEPLOY.md` no mueve líneas | comparación abajo: sólo 1179, 1182, 1183, 1185, 1186 y el final | OK |

#### CA-1 a CA-10
| CA | Estado | Evidencia |
|---|---|---|
| CA-1 rojo unitario | OK | U-11 a U-19; M-1 las pone rojas (11 de 11) |
| CA-2 I-4 en sitio | OK | `:179`: salida 0, línea con `57P01`, `rechazada` ×2 y total 0, medidos arriba |
| CA-3 H-2 | OK | I-5; línea «Connection terminated unexpectedly» sin código, fijada |
| CA-4 worker | OK | I-6 y U-19 con `createPoolFromUrl` |
| CA-5 sin regresión | OK | I-1 a I-3 verdes contando también la línea nueva |
| CA-6 mutación | OK | M-1 y M-3 reproducidas; las demás, sólo del apply |
| CA-7 en sitio | OK | comparación abajo; `pool.ts` y los seis sitios sin diff |
| CA-8 `DEPLOY.md` §27 | OK | guarda 8 de 8 verde; DEPLOY-1 roja 7 de 8 |
| CA-9 sin variable | OK | `.env.example` sin diff |
| CA-10 cinco comprobaciones | OK | tabla de ejecución |

### Mutaciones reproducidas
Protocolo: `git add` del fichero y sha256 antes; una línea con `perl -i -pe` y `if $. == N` (nunca `sed -i`); restauración con la sustitución inversa; `git diff --quiet` = 0, mismo sha256 y CRLF completo; `git reset -q` al final.

| Mutación | Cambio | Rojas | Restauración |
|---|---|---|---|
| **M-1** | `packages/zoho-sync/src/db/conexionPerdida.ts:44` vuelve a `return pool` | **14 rojas de 36**: I-4, I-5, I-6 y U-11 a U-18 más las tres de U-19 (11 unitarias); verdes U-1 a U-10 e I-1 a I-3 | diff vacío, sha256 `5f7ab852…` igual, CRLF 69 de 69 |
| **M-3** | `conexionPerdida.ts:61` comenta `if (registrados.has(cliente)) return` | **3 rojas de 36**: U-14, I-4 e I-6 (dos líneas); I-5 sigue verde (un solo error) | ídem |
| **DEPLOY-1** | `DEPLOY.md:1183`: `nada la reintenta.` pasa a `nada la reintenta: sigue muriendo.` | **7 rojas de 8** en `deployPoolConexionCortada.test.ts`; la falta recibida es `sin «sigue muriendo»`; verde sólo la prueba que devuelve la frase ella misma | diff vacío, sha256 `ea939cae…` igual, CRLF 1196 de 1196 |

Ninguna quedó sin rojo. M-2 y M-4 a M-7, DEPLOY-2 y DEPLOY-3 las reprodujo sólo el apply y no se afirman como propias. El índice quedó como estaba: sólo `tasks.md`, el cambio del orquestador, figura modificado.

### Comparación en sitio y barrido (regla de mutación 4)
Comparado contra `4d7aad75` sin finales de línea y por posición:

| Fichero | Líneas que cambian | Largo | CRLF |
|---|---|---|---|
| `packages/zoho-sync/src/db/conexionPerdida.ts` | sólo la 44; lo nuevo, 46 a 69 | 45 → 69 | 69 de 69 |
| `packages/zoho-sync/src/db/conexionPerdida.test.ts` | sólo la 7; lo nuevo, 211 a 345 | 210 → 345 | 345 de 345 |
| `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` | 6, 11, 136, 145, 151, 170, 176 a 185 y el cierre (187, que baja a la 208) | 187 → 208 | 208 de 208 |
| `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts` | 2, 12, 14, 26, 50, 51, 54, 67; lo nuevo, 79 a 93 | 78 → 93 | 93 de 93 |
| `apps/desk/server/deployPoolConexionCortada.test.ts` | 4, 11, 32, 35; lo nuevo, 67 a 96 | 68 → 96 | 96 de 96 |
| `DEPLOY.md` | 1179, 1182, 1183, 1185, 1186; lo nuevo, 1187 a 1196 | 1186 → 1196 | 1196 de 1196 |

- Sin cambios contra `4d7aad75` (`git diff --quiet`, salida 0): `pool.ts`, `apps/desk/server/db/transaccion.ts`, `apps/desk/server/db/eliminarTicket.ts`, `packages/zoho-sync/src/db/repo.ts`, `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts`, `apps/hub-sync/src/hub-sync.ts`, `.env.example`, `schema.sql`, `migrate.ts`, `CLAUDE.md`, `docs/sdd/ENTRADA.md` y `openspec/config.yaml`. Los ficheros cambiados de la rama son los de la tabla y la carpeta de este cambio: nada bajo `apps/desk/src` (regla 13), nada en `docs/`.
- **Barrido de citas.** Reproducido con `grep -rnoE` sobre los seis ficheros tocados (642 citas con ruta) y cruzado con las líneas cambiadas: caen en la carpeta de este cambio (`apply-progress.md` 12, `design.md` 21, `proposal.md` 9, `specs/zoho-sync/spec.md` 6 y `tasks.md` 1, las descriptivas del plan incluidas) y 3 en `openspec/changes/archive/2026-11-12-pool-conexion-cortada/` (`apply-progress.md` 2 y `verify-report.md` 1). **Ninguna** en otro fichero ni en los seis de Supervisión. Coincide con la tabla de L2.5 de `apply-progress.md`: no hay cita afectada sin listar. Las tres del archivo son caso B (informes fechados) y no se editan.
- La sha256 de `DEPLOY.md` que anota L2.4 (`5a622a98…`) no es la de hoy: el commit `ea87a382` cambió después el renglón 1190 («si lo trae»). Ocho renglones siguen siendo ocho y la comparación de arriba lo confirma.

### Strict TDD
| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD en `apply-progress.md` | OK | rojos por `fichero › prueba › aserción › recibido` en L1.3, L1.4 y L2.1 |
| Rojo por la razón correcta | OK | I-4 a I-6 por `expect(codigo).toBe(0) › recibido 1`; U-11 a U-19 por «lanza»; guarda 8 de 8 por faltas exactas, no por el arnés. La reproducción de M-1 da otra vez esos mismos rojos |
| Verde confirmado | OK | 36 de 36 con PostgreSQL y suite completa en 0 |
| Triangulación | OK | 3 pools, dos formas de corte (reposo y consulta en curso) y dos pools de integración |
| Casilla de la regla 13 | OK | sin cambios bajo `apps/desk/src` |

### La pregunta de la §26 (§7 de `proposal.md` y de `design.md`)
**¿Puede retirarse ya la precaución de la §26? No, con lo medido.** Lo medido afirma sólo que el corte **ya no tumba el proceso**.

**Medido** (PostgreSQL 17.10, contenedor local, I-4 a I-6 en verde):
- Salida 0 y sin «Unhandled 'error' event» (antes, salida 1).
- **Una** línea del cliente prestado por corte: con `57P01` si el cliente estaba en reposo con `BEGIN`, y sin código («Connection terminated unexpectedly») si había una consulta en curso.
- La siguiente consulta sobre ese cliente y su `ROLLBACK` **rechazan**: la transacción del usuario no se confirma. Esto es lo que la precaución protege hoy; ya no es «el proceso muere», sino «la operación de un usuario falla».
- Tras liberarlo, el pool queda en 0 clientes y su siguiente consulta resuelve con otro pid.

**Sin medir**: que la ruta de la App devuelva su error de siempre al usuario (**hipótesis**, escrita así en `DEPLOY.md:1183`); qué ocurre si el pid raíz es la puesta al día del arranque (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`), que la §26 da por detenido con salida 1; PostgreSQL 17.11 de producción; el `application_name` de la App allí; y que EasyPanel enseñe stderr.

**Conclusión.** La razón escrita de la §26 («el proceso muere») ya no es cierta y la §27 la corrige, pero la precaución tiene otra razón, medida en local y sin medir en producción. El cambio **no la retira**, y es lo correcto: retirarla es una decisión de persona sobre un procedimiento, fuera de alcance (RQ-ZS-67). Para la anotación en E-285 (P-3): «no retirable todavía; su razón cambió de el proceso muere a la operación del usuario falla y su transacción no se confirma».

### Issues

**CRITICAL**: ninguno.

**WARNING**
- **W-1 · Hipótesis sin medir, escritas como tales.** Respuesta de las rutas de la App ante la operación fallida, arranque con `puestaAlDiaEstricta.ts:80`, `application_name` y PostgreSQL 17.11 de producción, y stderr en EasyPanel. No bloquea: ni la spec ni `DEPLOY.md` las dan por hechas. Se miden tras P-1 (despliegue), que es de Alfonso.
- **W-2 · La mecánica de `pg-pool` no es contrato** (riesgo de `proposal.md` §6). El orden de `connect` y `acquire` y el momento en que se quita el oyente de reposo son lo medido con `pg` 8.21.0 y `pg-pool` 3.14.0; una versión nueva podría cambiarlo. Lo cazan U-11 a U-19 y I-4 a I-6; la integración sólo corre con `TEST_DATABASE_URL`, que el CI fija en `.github/workflows/ci.yml:47`.

**SUGGESTION**
- **S-1** · `apply-progress.md` (L2.2) copia el bloque final de `DEPLOY.md` con la redacción previa a `ea87a382`. Es la crónica de un intento: no hace falta reescribirla.
- **S-2** · Diferencia con el diseño, a favor de la prueba: M-4 (quitar `release`) pone rojas también I-1 e I-2, no sólo las unitarias. Conviene recogerlo en el `archive-report.md`.
- **S-3** · Las 13 abreviadas rotas del detector son informativas y de otros ficheros (por ejemplo `openspec/specs/permissions/spec.md:42` y `openspec/specs/transitions-st/spec.md:33`): no son de este cambio.

### Verdict
**PASS WITH WARNINGS.** 5 de 5 requisitos y 21 de 21 escenarios con prueba verde, CA-1 a CA-10 cumplidos, integración contra PostgreSQL 17.10 propio en verde (36 de 36), M-1, M-3 y DEPLOY-1 reproducidas con rojo y restauración byte a byte, y las cinco comprobaciones en 0 (lint 165 contra 165; bundle `index-F1jDYjEU.js` sin cambio). 0 CRITICAL, 2 WARNING, 3 SUGGESTION. Siguiente: `sdd-archive` (i6) con techo = 2 × `wc -l` de la carpeta + 800, midiendo antes la parte revisable.
