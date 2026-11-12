```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:31309626f18a2d531dfbdcd81e2edff05ca9902de9828f7d761beb1b2ebe3f26
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 19/19
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:9561d4260020822d50a757d8392450fa1792e25b2825bbf509db498cd486fb8d
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:71c478fbfad4ee4c60b17e87fac54b16dc89e4c883c524b0cf9438f0d06c3bd4
```

## Verification Report

**Change**: `pool-conexion-cortada` (E-285, `fuera-del-plan`, `cierra: si`)
**Mode**: Strict TDD · persistencia hybrid · intento i6
**Árbol verificado**: `bdde29b3` (HEAD del worktree `C:\dev\Desk_2_R1.023-worktrees\pool-conexion-cortada`), partida `96cba5ab`. Árbol limpio antes y después (`git status --short` vacío).
**`evidence_revision`**: sha256 de la cadena del commit `bdde29b3`.

### Completeness
| Metric | Value |
|---|---|
| Tareas de código (L1.1 a L3.9) | 26 de 26 marcadas `[x]` en `openspec/changes/pool-conexion-cortada/tasks.md` |
| Pendientes | V.1 (esta verificación) y A.1 (archivo, i7): fases siguientes, no trabajo de código |
| Tareas de persona | P-1 y P-2 fuera del recuento, con dueño y destino (regla del ciclo 1) |

### Build & Tests Execution
Memoria libre al arrancar: 6.265 MB. Cadena sobre `HEAD`, con el código de cada paso (el guion corrió los cinco aunque uno fallara; ninguno falló):

| Paso | Salida | Detalle |
|---|---|---|
| `npm run typecheck` | 0 | |
| `npm run lint -- --max-warnings 165` | 0 | **165 avisos contra 165**, 0 errores |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 8.844 comprobadas, línea base 0; 14 abreviadas rotas informativas (ver W-3) |
| `npm test` (log `npmtest-verify-1719.log` en el scratchpad) | 0 | 378 ficheros pasan y 6 omitidos; **6.486 pruebas pasan, 34 omitidas** (las 4 de integración sin `TEST_DATABASE_URL`); 292 s de vitest |
| `npm run build` | 0 | `index-F1jDYjEU.js`, 427,51 kB (mismo bundle que producción: no hay cambio de cliente) |

Duración total de la cadena: 349 s. Sin «Timeout calling onTaskUpdate» ni repetición. Cobertura: no se mide (no hay herramienta en el preflight); no es fallo.

### PostgreSQL real (CA-3)
Contenedor desechable `pcc-pg-verify` (`postgres:17-alpine`, puerto 55436, libre antes: sólo estaba el 55433 del contenedor ajeno `salestracker-postgres-e2e`, no tocado). `SHOW server_version` = **17.10**. `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55436/postgres npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`: **4 de 4 verdes** (7,2 s).

| Prueba | Tiempo | Resultado |
|---|---|---|
| I-1 `createPool` (desk) | 1.290 ms | verde: una línea con `[57P01]`, salida 0, pid nuevo |
| I-2 `createPoolFromUrl` | 1.131 ms | verde: ídem |
| I-3 consulta en curso (caracterización) | 1.134 ms | verde: la consulta rechaza con `57P01`, el proceso sigue, 0 líneas |
| I-4 cliente prestado con transacción abierta (límite) | 1.081 ms | verde: el proceso MUERE (salida 1, `Unhandled 'error' event`), 0 líneas |

Contenedor retirado: `docker stop pcc-pg-verify` y `docker ps -a` no lo lista.

### Mutaciones reproducidas
Con `perl` por número de línea (nunca `sed -i`); restauración con `git checkout --`, `git diff --quiet` = 0, `file` CRLF y sha256 idéntico al de antes.

| Mutación | Cambio | Rojas |
|---|---|---|
| **M-1** (unitarias + integración) | `packages/zoho-sync/src/db/conexionPerdida.ts:43`: comentar `pool.on('error', oyente)` | **11 rojas de 25**: U-1 (3), U-2, U-3 (2), U-4, U-5, U-8 e **I-1 e I-2** (el hijo muere con salida 1). Siguen verdes I-3 e I-4 (no dependen del oyente), U-6, U-7, U-9, U-10 y `pool.test.ts` |
| **M-3** | `packages/zoho-sync/src/db/conexionPerdida.ts:15`: `sanear(JSON.stringify(err))` | **7 rojas de 19**: U-2, U-3 (2), U-4 (la prevista), U-5, U-6, U-7 (getter) |
| **§27 real** | borrar `DEPLOY.md:1171` (la línea de «salvo que se repita») | **5 rojas de 5** en `apps/desk/server/deployPoolConexionCortada.test.ts`; `apps/desk/server/deployArranqueEstricto.test.ts` sigue en 4 verdes |

Ninguna mutación quedó sin rojo. La línea 1171 lleva también «conexiones en reposo», por eso las faltas son dos; la exactitud de cada falta por separado la fijan las pruebas sobre copias en memoria.

### Strict TDD
| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD en `apply-progress.md` | ✅ | rojos anotados por `fichero › prueba › aserción` en L1, L2 y L3 |
| Todas las tareas de código tienen prueba | ✅ | módulo, `pool.ts`, hijo, §27 y guarda de la §26 |
| Rojo por la razón correcta | ✅ | U-1 por «lanza» (`expected [Function] to not throw`), no por módulo inexistente; I-1 e I-2 por `expected 1 to be +0` (salida del hijo), no por conexión; §27 por `expected -1 to be greater than…` (no hay `## 27. `); guarda de la §26 roja 3 de 4 al llegar la §27, medida antes de corregirla |
| Verde confirmado | ✅ | todo verde en esta ejecución (suite entera y focales) |
| Triangulación | ✅ | 3 pools en U-1, 4 modos en la integración, 5 casos en la §27 |
| Red de seguridad | ✅ | `pool.test.ts` 2/2 antes de tocar `pool.ts` |

**Capas**: unitarias 19 pruebas (`packages/zoho-sync/src/db/conexionPerdida.test.ts`); integración 4 (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`, PostgreSQL real, proceso hijo); contenido de documento 5 (`apps/desk/server/deployPoolConexionCortada.test.ts`). Total 28.

**Assertion quality**: 0 CRITICAL, 2 WARNING (W-2). Sin tautologías, bucles fantasma ni pruebas sin llamada a producción. U-9 y las dos primeras de U-10 nacieron verdes (caracterizan lo que `pool.ts` ya cumplía; declarado; U-9 afirma `max` 10 y la igualdad con un `new Pool` de referencia).

### Spec Compliance Matrix
Rutas bajo `packages/zoho-sync/src/db/` (U-, I-) y `apps/desk/server/` (deploy*).

| Requisito | Escenario | Prueba | Resultado |
|---|---|---|---|
| RQ-ZS-58 | `createPool` desk sobrevive a `error` | `packages/zoho-sync/src/db/conexionPerdida.test.ts:30` (U-1, caso 1) | ✅ |
| RQ-ZS-58 | `createPool` public sobrevive | `packages/zoho-sync/src/db/conexionPerdida.test.ts:30` (caso 2) | ✅ |
| RQ-ZS-58 | `createPoolFromUrl` sobrevive | `packages/zoho-sync/src/db/conexionPerdida.test.ts:30` (caso 3) | ✅ |
| RQ-ZS-58 | quitar el oyente pone rojo | M-1 reproducida: U-1 (3) e I-1/I-2 rojas | ✅ |
| RQ-ZS-58 | sin cambio de tiempos ni límites | `packages/zoho-sync/src/db/conexionPerdida.test.ts:165` (U-9) | ✅ |
| RQ-ZS-59 | una línea con texto fijo y mensaje | `packages/zoho-sync/src/db/conexionPerdida.test.ts:44` (U-2) | ✅ |
| RQ-ZS-59 | con `code` la línea lo lleva; sin él no | `packages/zoho-sync/src/db/conexionPerdida.test.ts:61` y `:66` (U-3) | ✅ |
| RQ-ZS-59 | ningún secreto (mutación 2) | `packages/zoho-sync/src/db/conexionPerdida.test.ts:74` (U-4) y `:109` (U-6); M-3 reproducida | ✅ |
| RQ-ZS-59 | un evento, una línea | `packages/zoho-sync/src/db/conexionPerdida.test.ts:93` (U-5) | ✅ |
| RQ-ZS-60 | corte en reposo con `createPool` | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:132` (I-1) | ✅ (PostgreSQL 17.10) |
| RQ-ZS-60 | corte en reposo con `createPoolFromUrl` | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:141` (I-2) | ✅ |
| RQ-ZS-60 | la prueba no pasa en falso | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:101-105` (estado `idle`, `pg_terminate_backend` = true, < 8 s) y M-1 sobre I-1/I-2 | ✅ |
| RQ-ZS-60 | sin base se salta | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:18` (`describe.skip`); `npm test` sin variable: 4 omitidas, salida 0 | ✅ |
| RQ-ZS-61 | `pool.ts` conserva sus líneas | `packages/zoho-sync/src/db/conexionPerdida.test.ts:184-209` (U-10) y `git diff --numstat` = `3 3` | ✅ |
| RQ-ZS-61 | `pool.test.ts` sigue verde | `packages/zoho-sync/src/db/pool.test.ts` sin modificar, 2/2 | ✅ |
| RQ-ZS-61 | sin variable ni interruptor | `.env.example` fuera de `git diff --name-only 96cba5ab HEAD`; ningún `process.env` de producción nuevo (ver Correctness) | ✅ (por diff, no por prueba) |
| RQ-ZS-62 | la §27 existe, es la última y cubre lo obligatorio | `apps/desk/server/deployPoolConexionCortada.test.ts:41` | ✅ |
| RQ-ZS-62 | ensuciar el fichero vigilado | `apps/desk/server/deployPoolConexionCortada.test.ts:46`, `:52`, `:58`, `:64`; mutación de la §27 real reproducida | ✅ |
| RQ-ZS-62 | la guarda de la §26 sigue verde en sitio | `apps/desk/server/deployArranqueEstricto.test.ts:23-24` y `:54`; 57 líneas antes y después, `git diff --numstat` = `5 5` | ✅ |

**Cumplimiento**: 19 de 19 escenarios. Tres se apoyan además en comprobación por diff, que la propia spec pide en esos términos.

### Criterios de aceptación
| CA | Estado | Evidencia |
|---|---|---|
| CA-1 rojo previo | ✅ | `openspec/changes/pool-conexion-cortada/apply-progress.md:15-16`; reproducible por M-1 (U-1 en rojo sin oyente) |
| CA-2 la línea | ✅ | U-2 a U-6 |
| CA-3 PostgreSQL real | ✅ | I-1 e I-2 con 17.10, SQLSTATE `57P01` observado, una línea, pid distinto |
| CA-4 mutación | ✅ | M-1, M-3 y §27 reproducidas con restauración comprobada |
| CA-5 `pool.ts` en sitio | ✅ | 11 líneas, CRLF, `3 3`; diff leído: sólo cambian la 1, la 6 y la 10; firmas de `packages/zoho-sync/src/db/pool.ts:4` y `:9` intactas |
| CA-6 §27 al final y guarda en sitio | ✅ | `DEPLOY.md:1150` (`## 27.`), 38 inserciones y 0 borrados |
| CA-7 límite escrito y §7 respondido | ✅ | `DEPLOY.md:1179-1186` y respuesta de abajo |
| CA-8 cinco comprobaciones | ✅ | todas con salida 0 |

### Correctness (estática)
- `packages/zoho-sync/src/db/pool.ts`: 11 líneas, CRLF; el import va en la línea 1 y `escucharConexionPerdida(new Pool(...))` envuelve las líneas 6 y 10.
- Ninguna variable de entorno nueva. Aciertos de `process.env` en lo añadido: `TEST_DATABASE_URL` en `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:17` y `:56` (la propaga al hijo) y en `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:37`; es la variable de pruebas ya existente, no de producción.
- Sin secretos: `packages/zoho-sync/src/db/conexionPerdida.ts` lee sólo `message` y `code` (código limitado por `/^[A-Za-z0-9_]{1,32}$/`), sustituye cualquier `esquema://…` por «<url omitida>», colapsa saltos de línea y, para un valor que no es `Error` ni cadena, escribe sólo `typeof`. U-4 y U-6 lo prueban con testigos de contraseña, usuario y host; M-3 lo confirma.
- La rama NO toca `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `CLAUDE.md`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`, `.env.example`, `schema.sql`, `migrate.ts` ni nada bajo `apps/desk/src` (`git diff --name-only 96cba5ab HEAD`: 13 rutas, todas del cambio). Con `.env.example` en el pathspec de `git diff --stat`, una regla de permisos del entorno bloquea el comando; se verificó con la lista de nombres.

### Coherence (diseño)
Seguido: módulo aparte, `pool.on` en su propia línea, línea por `console.error` (D-1), saneado D-3, código D-4, no-Error D-5, hijo con temporizador `unref` de 40 s y salidas 3 y 4, caracterización D-7. Desvíos declarados en `apply-progress.md` (puerto 55434, M-5 con `catch` que relanza, U-2 a U-5 sobre `EventEmitter`): razonables, sin romper la spec.

### Citas (muestra de 22 leídas contra el árbol)
Correctas, diciendo lo que afirman: `apps/desk/server/db/transaccion.ts:16-26` (préstamo, BEGIN, COMMIT, release); `apps/desk/server/index.ts:18`; `apps/hub-sync/src/hub-sync.ts:18`, `:53` y `:55` (`createPoolFromUrl` y `stPool.connect()`); `apps/hub-sync/src/backfill-items.ts:31`; `apps/desk/server/util/logger.ts:5-11` (pino); `packages/zoho-sync/package.json:2` (`"./*"`); `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:17-18`, `:23-26` y `:62-64`; `apps/desk/server/deployCalificacionesConversaciones.test.ts:23-24` y `:68`; `apps/desk/server/db/eliminarTicket.ts:178`, `packages/zoho-sync/src/db/repo.ts:336` y `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80` (todas `pool.connect()`); `apps/desk/server/respaldo/dependencias.ts:49` (oyente de proceso hijo); `DEPLOY.md:1143-1144` (pid raíz y `pg_terminate_backend`); `openspec/specs/zoho-sync/spec.md:2860-2862` (RQ-ZS-57). En `96cba5ab`: `DEPLOY.md:1112` (§26) y `:1127` («PostgreSQL 16»), `docs/sdd/ENTRADA.md:2532-2537` (E-285) y `:2430` (17.11 y «EasyPanel muestra stderr» como hipótesis), `openspec/config.yaml:6465`, `:26` y `:137`, `apps/desk/server/reconciliacion/comprobaciones.ts:215` (excluye `fuera-del-plan`). La tabla del barrido de `pool.ts` (33 A y 1 B) coincide con lo leído; las dos B de artefactos propios ya llevan «en `96cba5ab`».

### Respuesta a la pregunta del §7 de la propuesta
**¿Deja de ser necesaria la precaución de la §26 (cortar sólo la sesión de la consola)? No: sigue siendo necesaria**, por el caso que el oyente del pool no cubre. Medido en PostgreSQL 17.10:

| Situación de la conexión de la App que se corta | Resultado medido | ¿Tumba el proceso? |
|---|---|---|
| **En reposo** en el pool (I-1, I-2) | una línea `… [57P01]`; la siguiente consulta abre otra conexión con pid distinto | No: cubierto |
| **Consulta en curso** por `pool.query()` (I-3) | la consulta rechaza con `57P01`; el proceso sigue y vuelve a servir; 0 líneas (el error llega a la consulta, no al evento del pool) | No, pero sin línea |
| **Cliente prestado** por `pool.connect()` con transacción abierta (I-4; el caso de `apps/desk/server/db/transaccion.ts:16-26`) | `Unhandled 'error' event`, `code: '57P01'`, salida 1; 0 líneas | **Sí: el proceso muere** |

El pid raíz de una cadena de bloqueos tiene una transacción abierta (`idle in transaction`): si es de la App, es un cliente prestado, justo el caso I-4. Lo que este cambio retira es el riesgo de un **reinicio de `desk-db`** y de cortar conexiones en reposo. La precaución de la §26 se mantiene para sesiones de la App con bloqueos: comprobar `application_name` (en el contenedor, `psql` frente a vacío para la App) antes de cortar. No medido: el `application_name` de la App en producción.

### Issues
**CRITICAL**: ninguno.

**WARNING**
- W-1 · **`cierra: si` cubre la mitad del riesgo de E-285.** El cliente prestado (I-4) sigue tumbando el proceso. Está declarado en la propuesta (§3, §7) y escrito en la §27, pero `docs/sdd/ENTRADA.md:2536` («Afecta a») no debe darse por resuelta del todo: Supervisión debería abrir entrada para el oyente por cliente prestado (`apps/desk/server/db/transaccion.ts:16`, `packages/zoho-sync/src/db/repo.ts:336` y `:440`, `apps/hub-sync/src/hub-sync.ts:55`, `apps/desk/server/db/eliminarTicket.ts:178`).
- W-2 · I-3, I-4 y las dos primeras de U-10 no tienen rojo previo (caracterización declarada). I-4 depende de que `pg` 8.21 lance un `error` sin oyente; una versión nueva lo rompería, a propósito.
- W-3 · El detector marca una abreviada rota informativa en el propio cambio: `openspec/changes/pool-conexion-cortada/tasks.md:66` (`:23`, atribuida a `DEPLOY.md` cuando se refiere a `apps/desk/server/deployArranqueEstricto.test.ts:23`). Falso positivo, no bloquea; se repara nombrando el fichero en la misma línea.

**SUGGESTION**
- S-1 · La §27 cita «un corte de red» como causa; sólo se midió `pg_terminate_backend`.
- S-2 · P-2 (cortar una conexión en reposo de la App en producción y buscar la línea) es la única prueba de que EasyPanel enseña stderr; hasta entonces es hipótesis.
- S-3 · `sanear` sólo reconoce `esquema://`; un mensaje con `password=…` en forma clave-valor pasaría. Los errores en reposo (`57P01`, `ECONNRESET`) no lo traen; endurecimiento futuro.
- S-4 · M-2, M-4, M-5 y M-6 del apply no se reprodujeron aquí (el encargo pedía M-1, M-3 y la §27).

### Verdict
**PASS WITH WARNINGS.** 19 de 19 escenarios y 8 de 8 CA cubiertos por pruebas en verde; las cinco comprobaciones salen con 0; la integración contra PostgreSQL 17.10 y las mutaciones se reprodujeron con restauración comprobada. El aviso de fondo es W-1: el cliente prestado sigue sin protección y debe seguir en la bandeja.
