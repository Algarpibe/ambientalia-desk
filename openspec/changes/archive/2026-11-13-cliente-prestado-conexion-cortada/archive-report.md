# Informe de archivo — `cliente-prestado-conexion-cortada`

Cabecera R-1 (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:1-9`): `tanda: fuera-del-plan`, motivo E-290 («el cliente
prestado por pool.connect() no escucha su evento error…»), `capacidad: [zoho-sync]`, `maestro: []`, `cierra: si`, `toca_maestro: no`, `origen_cabecera: declarada`.

**Qué cubre de E-290, en una línea:** un corte del servidor sobre un cliente prestado por `pool.connect()` deja de tumbar el proceso en los seis sitios que lo
toman (la App, el worker y la puesta al día del arranque), con una línea por cliente; deja fuera, medido y escrito, que la operación de ese cliente falla.

Origen: E-290, el aviso W-1 del verify de `pool-conexion-cortada` (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:147`). Partida:
`main` en `4d7aad75`. Rama `cliente-prestado-conexion-cortada`, worktree propio con su `.codegraph/`. Verify: PASS WITH WARNINGS, 0 CRITICAL
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/verify-report.md:165`).

## 1 · Qué se construyó

| Pieza | Dónde |
|---|---|
| Enganche, el único cambio en sitio del módulo: la línea 44 pasa de `return pool` a devolver el pool con el oyente nuevo | `packages/zoho-sync/src/db/conexionPerdida.ts:44` |
| Al final del módulo: texto fijo propio, línea pura sin secretos y oyente por cliente desde `connect`, con filtro de prestado (`acquire`/`release`) y una línea por cliente | `packages/zoho-sync/src/db/conexionPerdida.ts:48`, `:50`, `:55` |
| Unitarias U-11 a U-19, al final; la 7 gana el import en sitio | `packages/zoho-sync/src/db/conexionPerdida.test.ts:225`, `:324` |
| Integración: I-4 reescrita en sitio («el proceso sigue»); I-5 (consulta en curso dentro de la transacción) e I-6 (pool del worker) antes del cierre; I-1 a I-3 cuentan las dos clases de línea en sitio | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179`, `:189`, `:199`; `:132`, `:141`, `:164` |
| El hijo imita `apps/desk/server/db/transaccion.ts:16-27` tras el corte; ocho líneas en sitio y la función al final | `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:81` |
| `DEPLOY.md` §27 en sitio (1179, 1182, 1183, 1185, 1186: ocho renglones siguen siendo ocho) y un bloque `###` al final con la línea medida | `DEPLOY.md:1179`, `DEPLOY.md:1182-1186`, `DEPLOY.md:1188` |
| Guarda de la §27: en sitio sus líneas 4, 11, 32 y 35; al final, la línea medida construida con el código y tres copias ensuciadas | `apps/desk/server/deployPoolConexionCortada.test.ts:71`, `:74` |
| Spec viva: RQ-ZS-63 a RQ-ZS-67, añadidos al final por script | `openspec/specs/zoho-sync/spec.md:3043`, `:3081`, `:3112`, `:3153`, `:3184` |

Sin tocar: `pool.ts`, los seis sitios (`apps/desk/server/db/transaccion.ts:16`, `apps/desk/server/db/eliminarTicket.ts:178`, `packages/zoho-sync/src/db/repo.ts:336` y
`:440`, `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`, `apps/hub-sync/src/hub-sync.ts:55`), `.env.example`, `schema.sql`, `migrate.ts`, los seis ficheros de
Supervisión y `apps/desk/src`. Ninguna variable de entorno ni interruptor nuevo. El bundle del cliente no cambia (`index-F1jDYjEU.js`): cambia sólo el servidor.

## 2 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commit | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `77e1a8a2` | 385 |
| i2 | diseño y tareas | `a1882ad7` | 363 |
| i3 | L1: hijo e integración con rojo, U-11 a U-19, módulo, M-1 a M-7 | `4c382fb8`, `d092a1e8` | 330 |
| i4 | L2: guarda con rojo, `DEPLOY.md` §27, DEPLOY-1 a DEPLOY-3, barrido | `3ffe1269`, `ea87a382`, `02dca012` | 181 |
| i5 | verify | `3433fc09` | 171 |
| i6 | archivo | este commit | techo 3.300 (2 × 1.200 + 800, redondeado); parte revisable medida antes: 175 de la fusión más este informe |

Ningún intento pasó de 800. En cada uno, las cinco comprobaciones salieron con 0 sobre su commit: typecheck, `npm run lint -- --max-warnings 165` (165 contra
165), detector de citas, `npm test` con log en primer plano (6.500 pasan y 36 omitidas desde i4) y build. Memoria libre al arrancar: i1 5.763 MB, i2 7.023,
i3 6.994, i4 7.820, i5 5.968. **Pasada fallida**, que queda como evidencia en el `settle` de i4: la primera, sobre `ea87a382` (6.530 MB), dio el detector en 1,
porque dos citas del barrido abreviaban la ruta del archivo como `archive/…/`; se repararon en sitio en `02dca012`.

## 3 · Integración y mutación

**PostgreSQL 17.10** (contenedor desechable `postgres:17-alpine`; producción es 17.11 y el CI, 17.12), medido tres veces: apply y orquestador en el contenedor
del orquestador, verify en uno propio. Siempre 6 de 6 y salida 0 sin «Unhandled 'error' event»:

| Caso | Línea de E-285 | Línea del cliente prestado | Lo demás |
|---|---|---|---|
| I-1 `createPool` · I-2 `createPoolFromUrl`, en reposo | 1, `[57P01]` | 0 | la siguiente consulta usa otro pid |
| I-3 `pool.query()` en curso | 0 | 0 | la consulta rechaza con `57P01` |
| I-4 prestado con `BEGIN`, en reposo · I-6 lo mismo con `createPoolFromUrl` | 0 | 1, `… — terminating connection due to administrator command [57P01]` | siguiente consulta y `ROLLBACK` rechazan; el pool queda en 0 y sirve con otro pid |
| I-5 prestado con `BEGIN` y una consulta en curso | 0 | 1, `… — Connection terminated unexpectedly`, sin código | la consulta rechaza con `57P01`; el `ROLLBACK` rechaza; pool en 0 y pid nuevo |

**Rojo previo** (con el módulo sin tocar): I-4, I-5 e I-6 salen con 1; U-11 a U-19 lanzan. **I-5 era un caso nuevo**: hoy en `main` también tumba el proceso.
**Mutaciones:** M-1 (la 44 devuelta a `return pool`) pone rojas I-4, I-5, I-6 y U-11 a U-19, reproducida por apply, orquestador y verify; M-3 (sin la
deduplicación) pone rojas U-14, I-4 e I-6 por dos líneas, reproducida por el verify; DEPLOY-1 (devolver «sigue muriendo» a la §27) pone roja la guarda. Las
demás, M-2 y M-4 a M-7, DEPLOY-2 y DEPLOY-3, sólo las reprodujo el apply
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/apply-progress.md:35`, `:117`). Todas restauradas con el mismo sha256 y CRLF completo.
**Hallazgo:** M-4 (sin el oyente de `release`) pone rojas también I-1 e I-2: el cliente de un `pool.query()` quedaría marcado como prestado.

## 4 · Barrido de citas (regla de mutación 4)

Ninguna línea citada se movió: los cambios fueron en sitio o al final, y en la integración sólo bajó su línea de cierre, que nadie cita. Cambia lo que afirman
algunas. De las **40** citas que caen en líneas cambiadas, 37 están en los artefactos de este cambio (6 de caso B, ancladas en sitio «en `4d7aad75`»; el resto, A)
y 3 en el archivo de `pool-conexion-cortada`, caso B, listadas y sin editar:
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:160`, `:191` y
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:117`. Ninguna en otros ficheros ni en los de Supervisión. El verify reprodujo el
cruce (642 citas a los seis ficheros tocados) sin hallar ninguna sin listar. Tabla completa:
`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/apply-progress.md:129`. El límite de RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3017-3019`)
queda sin efecto por la precedencia que declara RQ-ZS-67 (`openspec/specs/zoho-sync/spec.md:3184`), sin modificarlo.

## 5 · Supuestos para la lista semanal (reversibles)

S-1 a S-8 de la propuesta (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:161-168`) y D-1 a D-14 del diseño
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:278-291`). Los que más conviene que lea Gerencia: **S-1**, el texto de la línea
(«Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue»); **S-2**, una línea por cliente aunque dé dos errores;
y **D-9**, el rojo de la integración antes de tocar el módulo.

## 6 · Tareas de persona — archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio en el mismo despliegue que `pool-conexion-cortada` | Alfonso | `DEPLOY.md:1150`; `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/tasks.md:70` |
| P-2 | Registrar E-290 en la bandeja | Supervisión | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/tasks.md:71` |
| P-3 | Anotar en E-285 la respuesta a la pregunta de la §26 (§7 de este informe) | Supervisión | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/tasks.md:72` |

## 7 · La pregunta de la §26, respondida con lo medido

**La precaución de la §26 no puede retirarse todavía, pero su razón ha cambiado.** Con este cambio, cortar con `pg_terminate_backend` el pid de una sesión de la App
con una transacción abierta —la forma del pid raíz de la §26 cuando es de la App— ya no tumba el proceso: I-4, I-5 e I-6 salen con 0, dejan una línea y el pool
vuelve a servir. Pero la siguiente consulta y el `ROLLBACK` de ese cliente rechazan: **la operación de ese usuario falla y su transacción no se confirma**. Esa
es hoy la razón de la precaución, y así queda escrita en `DEPLOY.md:1185-1186`. Además, sin medir: que la ruta de la App responda su error de siempre (hipótesis,
W-1 del verify, `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/verify-report.md:156`); cortar la puesta al día del arranque
(`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`), que la §26 da por detenido con salida 1; PostgreSQL 17.11 de producción; el `application_name` de la
App allí; y que EasyPanel enseñe stderr. Retirarla es una decisión sobre un procedimiento de persona, y no se toma en este cambio.

## 8 · Para Supervisión (la rama no toca sus ficheros)

- **Registrar E-290** (P-2): origen, el W-1 citado arriba; construida por `cliente-prestado-conexion-cortada` (`fuera-del-plan`, `cierra: si`). Lleva también el
  caso nuevo que encontró la sonda: una consulta en curso dentro de la transacción también tumbaba el proceso (I-5), y queda cubierto.
- **Traza de E-285** («Afecta a», `docs/sdd/ENTRADA.md:2536` en `96cba5ab`): el procedimiento de la §26 sigue vigente, con la razón corregida del §7 (P-3).
- **Spec viva:** RQ-ZS-67 deja sin efecto, por precedencia declarada, el límite de RQ-ZS-62 sobre el cliente prestado.
- **Pendiente tras P-1:** medir en producción las hipótesis de W-1 (rutas de la App, stderr en EasyPanel, `application_name`).
- **Hallazgo de método** para quien vuelva a tocar el módulo: M-4 también pone rojas I-1 e I-2 (§3).
