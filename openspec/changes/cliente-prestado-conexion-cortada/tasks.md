# Tareas — `cliente-prestado-conexion-cortada` (E-290)

Entradas: `proposal.md` (S-1 a S-8, CA-1 a CA-10), `specs/zoho-sync/spec.md` (RQ-ZS-63 a RQ-ZS-67) y `design.md` (§2 a §13; en el reparto manda el diseño: §8 ficheros, §10 lotes con D-9, §5 mutaciones, §9 barrido, §7 medición).
`strict_tdd`: en cada tarea de código, primero la prueba ROJA por la razón correcta (nunca por el arnés ni por un import que falta), con su salida roja anotada
(`fichero › prueba › aserción › valor recibido`) en `apply-progress.md`; luego el mínimo para verde. `apply-progress.md` se fusiona, nunca se sobrescribe.
Restricciones: los ficheros citados (`pool.ts`, `conexionPerdida.ts`, `transaccion.ts`, `repo.ts`, `eliminarTicket.ts`, `DEPLOY.md`, las pruebas de integración) sólo se editan EN SITIO
(misma línea física) o AL FINAL; todos están en CRLF renglón a renglón y lo editado conserva el CRLF. Sin variable de entorno; nada de producción. NO se tocan los seis de
Supervisión (`CLAUDE.md`, `docs/sdd/ENTRADA.md`, `docs/sdd/F0-05_*`, el expediente R08.4, `openspec/config.yaml`), `.env.example`, `schema.sql`, `migrate.ts`, `pool.ts` ni los seis sitios.
Worktree `C:\dev\Desk_2_R1.023-worktrees\cliente-prestado-conexion-cortada`. Partida de cada lote: el commit con que cierra el lote anterior; la del L1, el commit de cierre de i2 (el orquestador la fija en `apply-progress.md`).

## Review Workload Forecast
| Lote | Intento | Bruto | Riesgo frente a 400 | Techo |
|---|---|---|---|---|
| L1 | i3 | ~380 (hijo ~44, integración ~57, unitarias ~117, módulo ~30, progreso ~130) | Medio: ×1,8 sobre el código llega a ~580 | 800 |
| L2 | i4 | ~170 (guarda ~46, `DEPLOY.md` ~20, anclajes ~12, progreso ~90) | Bajo | 800 |
| verify | i5 | `verify-report.md` (~350, sumando obligatorio) | Medio | 800 |
| archivo | i6 | techo = 2 × `wc -l` de la carpeta + 800 | — | la parte revisable (fusión del delta + `archive-report.md`) ≤ 800, medida ANTES de aplicar |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending (rama única, fusionada por el analista, sin PRs)
400-line budget risk: Medium

### Suggested Work Units
| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| L1 | Módulo del cliente prestado, hijo e integración, unitarias, M-1..M-7 | rama única | `npx vitest run packages/zoho-sync/src/db/conexionPerdida.test.ts` | integración con el contenedor 55432 (abajo) | revertir el commit del lote |
| L2 | Guarda y `DEPLOY.md` §27, DEPLOY-1..3, barrido | rama única | `npx vitest run apps/desk/server/deployPoolConexionCortada.test.ts` | `DEPLOY.md` real ensuciado y restaurado | revertir el commit del lote (L1 queda) |

## Comprobaciones de cierre (las cinco, en UNA cadena, sobre el commit del lote)
`set -o pipefail; npm run typecheck && npm run lint -- --max-warnings 165 && node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD && npm test > <scratchpad>/npmtest-<hora>.log 2>&1 && npm run build`.
`npm test` en PRIMER PLANO y nunca con `| tail`; si no sale 0, sacar del log `FAIL <fichero> > <prueba>`. Lint: «N avisos contra 165» (sin holgura). Anotar memoria libre al arrancar y duración.
Medida del lote: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear (binarios aparte), ≤ 800; se registra esa cifra.

## Protocolo de mutación (M-1..M-7 y DEPLOY-1..3; `design.md` §5)
Antes de mutar: `git add <fichero>` en verde y anotar sha256. Aplicar con `perl -i -pe '<cambio> if $. == N'` (N medido en ese momento; nunca `sed -i`), correr lo afectado y anotar el rojo
por prueba y aserción. Restaurar con la sustitución inversa y comprobar `git diff --quiet -- <fichero>`, el mismo sha256 y CRLF en todos los renglones. Una mutación que no pone nada rojo es un hallazgo.

## Lote L1 — módulo, hijo, integración, unitarias y mutaciones (intento i3)
Escenarios: RQ-ZS-63 los cinco; RQ-ZS-64 los cuatro; RQ-ZS-65 los cinco; RQ-ZS-66.
Medición: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/postgres npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` (contenedor del orquestador; si no está, uno desechable `--rm` en otro puerto).
- [x] L1.1 Hijo `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts`: en sitio `:2`, `:12`, `:14`, `:26`, `:50`, `:51`, `:54`, `:67`; `comoEnTransaccion` al final, detrás de la 78 (`design.md` §4.1, D-4, D-11).
- [x] L1.2 Padre `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` en sitio: `:6`, `:11`, `:136`, `:145`, `:151`, `:170` y la I-4 reescrita en `:176-186` (once líneas); I-5, I-6 y `lineasPrestado` al final del `describe`, antes de su cierre (`design.md` §4.2).
- [x] L1.3 ROJO de integración con el módulo SIN tocar: I-4, I-5 e I-6 rojas por salida 1, I-1 a I-3 verdes; anotar prueba, aserción y valor recibido (D-9).
- [x] L1.4 ROJO unitario `packages/zoho-sync/src/db/conexionPerdida.test.ts`: import en sitio `:7` y U-11 a U-19 al final, detrás de la 210; rojas por «lanza» (`design.md` §3). Si el fichero no carga con el nombre aún sin exportar, añadir antes sólo la constante al final del módulo y anotarlo.
- [x] L1.5 Módulo `packages/zoho-sync/src/db/conexionPerdida.ts`: enganche en sitio en `:44` (`return escucharClientePrestado(pool, registrar)`) y el bloque del §2 al final, una pieza por línea física. Verde: U-1 a U-19.
- [x] L1.6 Verde de unitarias e integración con el contenedor; anotar `SHOW server_version` y la línea observada de I-5 (hipótesis: se fija lo observado).
- [x] L1.7 `npm run typecheck` (cierra la hipótesis del tipado) y `npm run lint -- --max-warnings 165` con «165 contra 165».
- [x] L1.8 Mutaciones M-1 a M-7 (protocolo; rojos previstos en `design.md` §5): M-1 la 44 vuelve a `return pool`; M-2 filtro `!prestados.has`; M-3 deduplicación; M-4 `release`; M-5 `try` del registro; M-6 `JSON.stringify(err)`; M-7 línea de E-285 en el oyente de cliente.
- [x] L1.9 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`; `git diff --quiet` sobre `pool.ts`, `migrate.ts`, `schema.sql` y `.env.example` sale 0.
- [ ] L1.10 Cierre del lote: medida (i3) y las cinco comprobaciones en una cadena, con memoria libre anotada; `apply-progress.md`; commit lo hace el orquestador.

## Lote L2 — guarda, `DEPLOY.md` §27 y barrido (intento i4)
Escenarios: RQ-ZS-67 los tres. Necesita la línea medida en L1.
- [ ] L2.1 ROJO `apps/desk/server/deployPoolConexionCortada.test.ts`: en sitio `:4`, `:11`, `:32`, `:35`; al final, `LINEA_MEDIDA_PRESTADO` y el `describe` de copias ensuciadas (`design.md` §6). Roja contra el `DEPLOY.md` de hoy por sus faltas exactas.
- [ ] L2.2 `DEPLOY.md:1179-1186` en sitio (cambian 1179, 1182, 1183, 1185 y 1186; ocho renglones siguen siendo ocho, CRLF) y bloque `### La línea del cliente prestado (E-290)` al final con la línea medida en L1, sin `## ` nuevo.
- [ ] L2.3 Verde: la guarda y las que la rodean (`deployPoolConexionCortada.test.ts`, `deployArranqueEstricto.test.ts`) sin tocar estas últimas.
- [ ] L2.4 DEPLOY-1 a DEPLOY-3 sobre el `DEPLOY.md` real (regla de mutación 2), con restauración comprobada.
- [ ] L2.5 Barrido de citas (regla de mutación 4, `design.md` §9): caso B anclado «en `4d7aad75`» en la misma línea física de `proposal.md:15`, `:58`, `:148`, `:168` y `specs/zoho-sync/spec.md:98`; segundo pase humano de abreviadas; listar sin editar el archivo de `pool-conexion-cortada` y cualquier cita de Supervisión.
- [ ] L2.6 Anotar en `apply-progress.md` la respuesta medida a la pregunta de la §26 (`design.md` §7) para el verify.
- [ ] L2.7 Cierre del lote: medida (i4) contra el commit de cierre de L1, las cinco comprobaciones, `git show --numstat` con sólo ficheros de este cambio.

## Verificación y archivo (intentos propios, tras L2)
- [ ] V.1 Verify independiente (i5): `verify-report.md` con cada escenario de RQ-ZS-63 a RQ-ZS-67 contra su prueba y CA-1 a CA-10; reproducir al menos M-1, M-3 y DEPLOY-1.
- [ ] A.1 Archivo (i6): techo = 2 × carpeta + 800; fusión por script del delta, ensayo `--dry`, finales de línea conservados; `archive-report.md` con la línea de R-1; medir la parte revisable antes de aplicar y parar si supera 800.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio en el mismo despliegue que `pool-conexion-cortada` | Alfonso | `DEPLOY.md` §27, `proposal.md` |
| P-2 | Registrar E-290 en la bandeja | Supervisión | `docs/sdd/ENTRADA.md` |
| P-3 | Anotar en E-285 la respuesta medida a la pregunta de la §26 | Supervisión | `docs/sdd/ENTRADA.md`, `verify-report.md` |
