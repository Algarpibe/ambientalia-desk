# Tareas — `arranque-migracion-estricta` (`fuera-del-plan`, `cierra: si`)

Entradas: `proposal.md` (S-1 a S-7, CA-1 a CA-9), `specs/zoho-sync/spec.md` (RQ-ZS-52 a RQ-ZS-57) y `design.md` (§2 a §9; ante un conflicto de nombres manda la spec).
`strict_tdd`: en cada tarea de código, primero la prueba ROJA por la razón correcta (nunca por el arnés ni por un import que falta), con su salida roja anotada
(`fichero › prueba › aserción`) en `apply-progress.md`; luego el mínimo para verde. Edición en un fichero existente: en su MISMA línea física o al final
(`git diff --numstat` da inserciones = borrados en `index.ts` y en las dos pruebas de guarda). `apply-progress.md` se fusiona, nunca se sobrescribe.
Worktree `C:\dev\Desk_2_R1.023-worktrees\arranque-migracion-estricta`, rama propia desde `97539c73`; un intento por lote.

## Review Workload Forecast
| Lote | Intento | Bruto | ×1,8 | Riesgo frente a 400 | Techo |
|---|---|---|---|---|---|
| L1 | i3 | ~350 (módulo ~90, U-1..U-12 ~170, prueba de índice ~45, ediciones en sitio ~6, `apply-progress` ~40) | ~630 | Alto: pasa de 400 (el presupuesto es 800) | 800 |
| L2 | i4 | ~160 (I-1..I-4 ~120, S-7 condicional ~10, `apply-progress` ~30) | ~290 | Bajo | 800 |
| L3 | i5 | ~125 (§26 ~40, prueba ~50, guarda en sitio ~10, `apply-progress` ~25) | ~225 | Bajo | 800 |

Decision needed before apply: No. Chained PRs recommended: No. Chain strategy: pending (rama única, fusionada por el analista, sin PRs). Verify (i4 del registro
tras L3) suma su `verify-report.md` (~350, sumando obligatorio); archive abre con techo 2 × carpeta + 800. Si un lote se acerca al techo, se parte antes de seguir.
Restricción de ficheros: este cambio NO toca `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los otros ficheros de Supervisión, `.env.example`, `schema.sql`, `migrate.ts`.

## Comprobaciones de cierre (las cinco, en UNA cadena, sobre el commit del lote)
`set -o pipefail; npm run typecheck && npm run lint -- --max-warnings 165 && npx tsx apps/desk/server/citas/cli.ts --sha HEAD && npm test > <scratchpad>/npmtest-<hora>.log 2>&1 && npm run build`.
Lint: dar «N avisos contra 165». `npm test` nunca con `| tail`; si no sale 0, sacar del log `FAIL <fichero> > <prueba>`; anotar memoria al arrancar y duración
(repetir sólo si sale 1 SÓLO por «Timeout calling onTaskUpdate» con todo verde). Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo
nuevo sin trackear (binarios aparte), ≤ 800, y es la que se registra.

## Protocolo de mutación (vale para M-1 a M-10)
Antes de mutar: `git add <fichero>` (sólo índice, no commit). Aplicar con `perl -i -pe '<cambio> if $. == N'` (N medido en ese momento; **nunca `sed -i`**, que pasa los CRLF
a LF) y comprobar `file <fichero>`. Correr la prueba focal, anotar la prueba que se pone roja. Restaurar con `git checkout -- <fichero>` y comprobar
`git diff --quiet -- <fichero>` (salida 0) y `file <fichero>` iguales que antes: vuelve byte a byte. Una mutación que no pone nada rojo es un hallazgo: se arregla la prueba.

## Lote L1 — módulo, pruebas unitarias, `index.ts:26-27` y mutaciones (intento i3)
Escenarios: RQ-ZS-52 los tres; RQ-ZS-53 límite y otro fallo; RQ-ZS-54 corte, reorganización y fuera de `index.ts`; RQ-ZS-55 posición, sin `desk`, `index.ts` conserva líneas; RQ-ZS-56 tolerante.
- [x] L1.1 M0: `npm test` entero en el commit de partida, con su log; anotar ficheros, pruebas y duración.
- [x] L1.2 ROJO `packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts` (nuevo, `design.md` §5): `FuenteDeConexiones` falsa que registra en UN solo arreglo cada texto y cada `release` con su argumento; U-1 a U-12. Rojo esperado: el módulo no existe (el import resuelve y falla la aserción de exportación, no el arnés: crear antes un esqueleto que exporte y lance «no implementado»).
- [x] L1.3 ROJO `apps/desk/server/arranqueEstrictoIndice.test.ts` (nuevo, molde `apps/desk/server/modoSinZohoIndice.test.ts:5-15`, `index.ts` leído como texto): líneas = las de `97539c73` (medidas al aplicar), finales homogéneos, `:8` idéntica, `:26`/`:27` como en `design.md` §3, ninguna otra línea con `aplicar(`, `await` en las dos, `app.listen(` después de `:27`, `main().catch` intacto, y el especificador del `import()` de `:26` se importa de verdad.
- [x] L1.4 ROJO `apps/desk/server/modoSinZohoIndice.test.ts:42`, en sitio: `expect(una('puestaAlDia.aplicar(migrate)')).not.toContain('modoSinZohoDesk')`. Rojo: la línea 27 aún dice `await migrate(pool)`. Anotar los rojos de L1.2 a L1.4.
- [x] L1.5 `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts` (nuevo, `design.md` §4): `LIMITE_ESPERA_BLOQUEO_MS = 10_000`, `ErrorPuestaAlDia`, `ErrorLimiteEspera`, `recortarSentencia`, `abrirPuestaAlDiaEstricta` (cliente propio, `SET lock_timeout` antes de nada, captura con grabador, ejecución una a una en autocommit, `release(true)` siempre, guarda de orden, «paso no capturable»). Sin `process.env`. Importa de `migrate.ts` sólo el tipo `Queryable`. Verde: U-1 a U-12.
- [x] L1.6 `apps/desk/server/index.ts:26-27` en sitio, con el texto de `design.md` §3; `:8` NO se toca. Comprobar: `git diff --numstat` da `2 2`, `wc -l` y finales iguales a `97539c73`, `file index.ts` igual. Verde: L1.3 y L1.4.
- [x] L1.7 Verde: focal `npx vitest run packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts apps/desk/server/arranqueEstrictoIndice.test.ts apps/desk/server/modoSinZohoIndice.test.ts`; `migrate.test.ts` y las cuatro pruebas que leen `index.ts` intactas y en verde.
- [x] L1.8 Mutaciones (protocolo de arriba), con su rojo anotado en `apply-progress.md`:
  - M-1 · en el módulo, enviar el `SET` tras la primera sentencia del primer `aplicar` (`perl` sobre la línea del `SET`) ⇒ U-1, U-2.
  - M-2 · `index.ts`: intercambiar el contenido de `:26` y `:27` (dos `perl` en sitio) ⇒ prueba de índice (y U-7 en ejecución).
  - M-3 · quitar la guarda de orden del módulo ⇒ U-7.
  - M-4 · volver a tolerar (`catch` que sigue con la siguiente) ⇒ U-4, U-5.
  - M-5 · clasificar por el texto del mensaje, o invertir la comparación con `55P03` ⇒ U-6 y, por la clase, U-4.
  - M-6 · quitar el valor del límite del texto ⇒ U-6.
  - M-7 · `release()` en lugar de `release(true)` ⇒ U-1, U-4, U-9 (I-4 se anota en L2).
  - M-8 · leer el límite de `process.env.LOCK_TIMEOUT` ⇒ U-8.
  - M-9 · `index.ts:27` vuelve a `await migrate(pool)` ⇒ prueba de índice y `modoSinZohoIndice.test.ts:42`.
  - M-10 va en L3 (necesita la §26).
- [x] L1.9 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`. CA-5: `git diff --quiet 97539c73 -- packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/schema.sql apps/hub-sync/src/hubSync.ts apps/hub-sync/src/hub-sync.ts packages/zoho-sync/src/db/pool.ts .env.example` sale 0.
- [x] L1.10 Cierre del lote: las cinco comprobaciones en una cadena, la medida, `apply-progress.md`, commit (lo hace el orquestador).

## Lote L2 — pruebas de integración y evidencia a mano (intento i4)
Escenarios: RQ-ZS-53 evidencia contra PostgreSQL real; RQ-ZS-52 conexión limpia.
- [x] L2.1 ROJO `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts` (nuevo, molde `apps/desk/server/db/migracionConcurrente.integration.test.ts:17-21`, se salta sin `TEST_DATABASE_URL`, base propia creada y borrada, esperas acotadas): I-1 a I-4 de `design.md` §6. Sin `TEST_DATABASE_URL` queda «omitida»: el rojo se mide CON el contenedor de L2.2 (rojo por la razón correcta: aserción, no conexión).
- [x] L2.2 Contenedor desechable, sólo local: `docker run --rm -d --name ame-pg -p 55432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine` (imagen local, sin red). `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/postgres npx vitest run packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts`. Verde: I-1 (idempotente), I-2 (`55P03`, ≥ 10 s y < 25 s, sesión cerrada con `ROLLBACK` en `finally`), I-3 (hipótesis del brief), I-4 (pid distinto, `SHOW lock_timeout` = `0`). Anotar versión de PostgreSQL, tiempos, SQLSTATE y la sentencia exacta. Si I-2 da otro código que `55P03`, PARAR: contradice la clasificación de `design.md` §4.
- [x] L2.3 M-7 contra PostgreSQL real: `release()` sin `true` ⇒ I-4 rojo; restaurar con el protocolo.
- [x] L2.4 E-3 (a mano, fuera de la suite, SÓLO contra ese contenedor). Con el bloqueo de I-2 abierto: `cwd` en un directorio NUEVO del scratchpad SIN `.env` (porque `apps/desk/server/index.ts:1` carga `dotenv/config` y el repositorio principal puede tener un `.env` real); variables ficticias (`DATABASE_URL` al contenedor, `DB_SCHEMA=desk`, las cinco `ZOHO_*` de `packages/zoho-sync/src/config.ts:77-81` con valores de relleno; ninguna credencial real, nada de Zoho): `npx tsx <ruta absoluta>/apps/desk/server/index.ts`. Esperado: salida 1, línea «Fallo al arrancar el servidor» con el mensaje de límite, ninguna «API en http». Anotar salida y código. Sin bloqueo no se corre.
- [x] L2.5 S-7, sólo si L2.4 no ve la línea en el registro: ROJO en `puestaAlDiaEstricta.test.ts` (**al final**, U-13: espía de `console.error` recibe el mismo texto del error antes de que `aplicar` rechace); después el mínimo en el módulo (`console.error` síncrono antes de lanzar, sin tocar `index.ts:106-109`); repetir L2.4 y anotar. Si la línea ya se ve, se anota «S-7 no aplicó» y no se escribe código.
- [x] L2.6 `docker stop ame-pg` (el contenedor se borra solo por `--rm`); comprobar con `docker ps -a` que no queda; borrar el directorio de trabajo de E-3.
- [x] L2.7 Cierre del lote: las cinco comprobaciones (la suite NO lleva `TEST_DATABASE_URL`; la integración queda omitida), medida, `apply-progress.md` (fusionado), commit.

## Lote L3 — `DEPLOY.md` §26 y guardas de sección (intento i5)
Escenarios: RQ-ZS-57 los tres.
- [x] L3.1 ROJO `apps/desk/server/deployArranqueEstricto.test.ts` (nuevo, molde `apps/desk/server/deployCalificacionesConversaciones.test.ts:17-35`): `faltasSeccion26` con la lista de `design.md` §7; sobre el real, `[]`; sobre tres copias ensuciadas en memoria (sin `pg_terminate_backend`, sin «Qué hacer si la App no arranca tras desplegar», con `## 27. ` detrás), cada una con su falta exacta (regla de mutación 2). Rojo: `DEPLOY.md` aún no tiene la §26.
- [x] L3.2 `DEPLOY.md`, al final: la §26 de `design.md` §7 (qué cambia, línea del registro con los dos textos de §4, procedimiento con `pg_blocking_pids` y `pg_terminate_backend` del pid raíz, `No hay interruptor nuevo`, `LIMITE_ESPERA_BLOQUEO_MS`, 10 s, P-2). Ninguna línea existente se mueve (`git diff --numstat` con 0 borrados).
- [x] L3.3 Antes de tocar la guarda, MEDIR el rojo que la §26 causa en `apps/desk/server/deployCalificacionesConversaciones.test.ts:24` y `:67-68` y anotarlo; luego corregir en sitio (`:9`, `:23`, `:24`, `:67`, `:68`, `design.md` §7); `git diff --numstat` da inserciones = borrados y el fichero conserva su número de líneas. Verde: las dos pruebas de despliegue y `deployControlCalidad.test.ts`, `deployModoSinZoho.test.ts` intactas.
- [x] L3.4 M-10 con el protocolo, sobre copias en memoria y, además, sobre el `DEPLOY.md` real: borrar con `perl` la línea que nombra `pg_terminate_backend` ⇒ rojo; restaurar. Regla de mutación 1 de la guarda: quitar la acotación de `:23` ⇒ rojo en `deployCalificacionesConversaciones.test.ts` (la §26 satisface las cadenas de la §25); restaurar.
- [x] L3.5 CA-6/CA-8: `registro.test.ts:218-220` sigue verde sin tocarlo (`fuera-del-plan` no entra en «en curso», `apps/desk/server/reconciliacion/comprobaciones.ts:215`); si se pusiera rojo, corregir en sitio y anotarlo. `.env.example` y `schema.sql` sin diff.
- [x] L3.6 Cierre del lote: las cinco comprobaciones, medida, `apply-progress.md`, commit.

## Barrido de la regla de mutación 4 (tarea final, tras L3)
- [x] B.1 `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre TODO el repositorio, SIN excluir `openspec/changes/archive/` ni `docs/`, para `apps/desk/server/index.ts`, `apps/desk/server/modoSinZohoIndice.test.ts`, `apps/desk/server/deployCalificacionesConversaciones.test.ts` y `DEPLOY.md`. Leer cada hallazgo contra lo que AFIRMA y clasificarlo A (sigue cierto), B (histórico, se nombra la revisión) o C (superado, se añade qué lo cerró). Contrastar con `design.md` §9 (A: `DEPLOY.md:318`, `spec.md:355`/`:705` y los `Paquete_de_Despliegue_*` listados; B: `Paquete_de_Despliegue_2026-10-09.md:384-386`, `2026-10-05b.md:244-246`, `2026-10-10b.md:201-203`). Segundo pase para las abreviadas (`:26`, `:27`, `:24`, `:67-68`) en los ficheros que ya citan el módulo. Se editan en sitio sólo las citas B/C de ficheros fuera de Supervisión que lo pidan; los paquetes fechados no se reescriben.
- [x] B.2 Las de los seis ficheros de Supervisión (`CLAUDE.md`, `docs/sdd/ENTRADA.md`, `docs/sdd/F0-05_Bloques*`, `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`, `docs/sdd/R08.4_Expediente_de_cambios.md`, `openspec/config.yaml`) se LISTAN con su clasificación en `apply-progress.md` (previstas: `ENTRADA.md:2425` A y B, `:2430` A y C; `config.yaml:6478-6479` A) y NO se editan.
- [x] B.3 Cierre: las cinco comprobaciones sobre el commit final, `git show --numstat` con sólo ficheros de este cambio, medida y `apply-progress.md`.

## Verificación y archivo (intentos propios, tras L3)
- [x] V.1 Verify independiente: `verify-report.md` con cada escenario de RQ-ZS-52 a RQ-ZS-57 contra su prueba y CA-1 a CA-9; reproducir al menos M-1, M-4 y M-10 con `perl` y restauración comprobada.
- [ ] A.1 Archivo: techo = 2 × `wc -l` de la carpeta + 800; fusión por script de los seis ADDED (RQ-ZS-52 a RQ-ZS-57) al final de `openspec/specs/zoho-sync/spec.md`, ensayo `--dry`, finales de línea conservados; `archive-report.md` con la línea de R-1 (cubre el paso 2 entero; deja fuera el paso 1 y la medida P-2). Medir la parte revisable antes de aplicar; si supera 800, parar.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar antes del 12/12 y comprobar que la App escucha (el despliegue lo hace Alfonso) | Alfonso | `DEPLOY.md` §26 |
| P-2 | ANTES de desplegar, medir las líneas «omitida» (`migrate: sentencia omitida`, `reorgToDesk: sentencia omitida`) del registro de producción y si EasyPanel enseña stderr: si alguna sentencia falla en cada arranque, con el cambio la App no arrancaría (consecuencia (3)) | analista, con el registro de Alfonso | `DEPLOY.md` §26, `proposal.md` §7 |
| P-3 | El paso 1 de la decisión: `idle_in_transaction_session_timeout` en la base de producción, con copia previa | Alfonso | `openspec/config.yaml:6474-6475` |
