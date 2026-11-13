# Tareas — `pool-conexion-cortada` (E-285, `fuera-del-plan`, `cierra: si`)

Entradas: `proposal.md` (S-1 a S-7, CA-1 a CA-8), `specs/zoho-sync/spec.md` (RQ-ZS-58 a RQ-ZS-62) y `design.md` (§3 a §12; ante un conflicto de nombres manda la spec).
`strict_tdd`: en cada tarea de código, primero la prueba ROJA por la razón correcta (nunca por el arnés ni por un import que falta), con su salida roja anotada
(`fichero › prueba › aserción`) en `apply-progress.md`; luego el mínimo para verde. Edición en un fichero existente: en su MISMA línea física o al final
(`git diff --numstat` da inserciones = borrados en `pool.ts` y en `deployArranqueEstricto.test.ts`). `apply-progress.md` se fusiona, nunca se sobrescribe.
Worktree `C:\dev\Desk_2_R1.023-worktrees\pool-conexion-cortada`, rama propia desde `96cba5ab` (la partida de las medidas); un intento por lote.

## Review Workload Forecast
| Lote | Intento | Bruto | ×1,8 | Riesgo frente a 400 | Techo |
|---|---|---|---|---|---|
| L1 | i3 | ~240 (módulo, U-1 a U-10, tres líneas de `pool.ts`) | ~430 | Medio: pasa de 400 (el presupuesto es 800) | 800 |
| L2 | i4 | ~310 (hijo, I-1 a I-4, `apply-progress`) | ~560 | Medio: pasa de 400 | 800 |
| L3 | i5 | ~180 (§27, su prueba, guarda en sitio, barrido) | ~325 | Bajo | 800 |

Decision needed before apply: No. Chained PRs recommended: No. Chain strategy: pending (rama única, fusionada por el analista, sin PRs). 400-line budget risk: Medium
(cada lote bajo 800). Verify es i6 y suma su `verify-report.md` (~350, sumando obligatorio); archive es i7 y abre con techo 2 × carpeta + 800. Si un lote se acerca al techo, se parte antes de seguir.
Restricción de ficheros: la rama NO toca `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los demás ficheros de Supervisión, `.env.example`, `packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/db/migrate.ts`, ni producción.

## Comprobaciones de cierre (las cinco, en UNA cadena, sobre el commit del lote)
`set -o pipefail; npm run typecheck && npm run lint -- --max-warnings 165 && npx tsx apps/desk/server/citas/cli.ts --sha HEAD && npm test > <scratchpad>/npmtest-<hora>.log 2>&1 && npm run build`.
Lint: dar «N avisos contra 165». `npm test` nunca con `| tail`; si no sale 0, sacar del log `FAIL <fichero> > <prueba>`. Anotar memoria libre al arrancar
(`systeminfo | grep -ai disponible | head -1`) y duración (repetir sólo si sale 1 SÓLO por «Timeout calling onTaskUpdate» con todo verde). Medida del intento:
`git diff --shortstat --no-renames 96cba5ab` (o la partida del lote) más `wc -l` de lo nuevo sin trackear (binarios aparte), ≤ 800, y es la que se registra.

## Protocolo de mutación (vale para M-1 a M-6; `design.md` §7)
Antes de mutar: `git add <fichero>` (sólo índice; módulo y prueba son nuevos y `git diff` no los vería sin eso). Aplicar con `perl -i -pe '<cambio> if $. == N'`
(N medido en ese momento; **nunca `sed -i`**, que pasa los CRLF a LF) y comprobar `file <fichero>`. Correr la prueba focal y anotar la que se pone roja.
Restaurar y comprobar `git diff --quiet -- <fichero>` (salida 0, contra el índice) y `file <fichero>` iguales que antes. Una mutación que no pone nada rojo es un hallazgo: se arregla la prueba.

## Lote L1 — módulo, pruebas unitarias, `pool.ts` y mutaciones (intento i3)
Escenarios: RQ-ZS-58 los cinco; RQ-ZS-59 los cuatro; RQ-ZS-61 los tres.
- [x] L1.1 M0: `npm test` entero en el commit de partida con su log (si no se hizo ya en el intento); anotar ficheros, pruebas, memoria libre y duración.
- [x] L1.2 ROJO `packages/zoho-sync/src/db/conexionPerdida.test.ts` (nuevo): U-1 se escribe primero importando SÓLO `./pool` (`createPool` `desk`, `public` y `createPoolFromUrl`: un oyente y `emit('error')` no lanza). Correrla y anotar el rojo: debe ser «lanza», no «módulo inexistente».
- [x] L1.3 ROJO resto de la prueba (`design.md` §5): U-2 a U-9 contra el módulo, con un esqueleto que exporta `escucharConexionPerdida` y `lineaConexionPerdida` sin lógica; U-10 (forma de `pool.ts`: 11 líneas, finales homogéneos, 2-5, 7-9 y 11 literales de `96cba5ab`). Anotar los rojos por aserción.
- [x] L1.4 `packages/zoho-sync/src/db/conexionPerdida.ts` (nuevo, `design.md` §3): `TEXTO_CONEXION_PERDIDA`, `lineaConexionPerdida` pura (saneado D-3, código D-4, no-Error D-5, nunca el objeto), `escucharConexionPerdida` genérico sobre `EventEmitter` con `try`/`catch` comentado y `pool.on('error', …)` en su propia línea. Verde: U-2 a U-9. Typecheck cierra la hipótesis del genérico.
- [x] L1.5 `packages/zoho-sync/src/db/pool.ts` en sitio, sólo las líneas 1, 6 y 10 con el texto exacto de `design.md` §4. Comprobar: `git diff --numstat` da `3 3`, `wc -l` 11 y `file` CRLF igual que en `96cba5ab`. Verde: U-1 y U-10.
- [x] L1.6 Verde focal: `npx vitest run packages/zoho-sync/src/db/conexionPerdida.test.ts packages/zoho-sync/src/db/pool.test.ts`; `pool.test.ts` intacta y en verde (RQ-ZS-61.2).
- [x] L1.7 Mutaciones M-1 a M-6 (`design.md` §7), cada una con su rojo anotado:
  - M-1 · comentar la línea `pool.on('error', …)` del módulo ⇒ U-1 (las tres), U-2 a U-5.
  - M-2 · `pool.ts:10` vuelve a `return new Pool({ connectionString })` ⇒ sólo los casos de `createPoolFromUrl` de U-1 y U-10.
  - M-3 · el mensaje pasa a `JSON.stringify(err)` ⇒ U-4.
  - M-4 · el oyente llama `console.error(linea, err)` en vez de `registrar(linea)` ⇒ U-2 y U-4.
  - M-5 · quitar el `try` del oyente ⇒ U-8.
  - M-6 · quitar la sustitución de URL ⇒ U-6.
- [x] L1.8 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`. CA-5: `git diff --quiet 96cba5ab -- packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/schema.sql .env.example` sale 0.
- [x] L1.9 Cierre del lote: las cinco comprobaciones en una cadena, la medida (i3), `apply-progress.md`, commit (lo hace el orquestador).

## Lote L2 — arnés de integración en proceso hijo y evidencia (intento i4)
Escenarios: RQ-ZS-60 los cuatro. Necesita el oyente de L1.
- [x] L2.1 Contenedor desechable, sólo local: `docker run --rm -d --name pcc-pg -p 55433:5432 -e POSTGRES_PASSWORD=postgres postgres:17-alpine`; esperar `pg_isready`; anotar `SHOW server_version`.
- [x] L2.2 `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts` (nuevo, no `.test.ts`; `design.md` §6): modos `reposo-desk`, `reposo-url`, `en-curso`, `prestado`; una línea JSON por paso; sale 3 si se cierra stdin sin «cortado» y 4 por temporizador `unref` de 40 s.
- [x] L2.3 ROJO `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` (nuevo, molde `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:17-35`, se salta sin `TEST_DATABASE_URL`): I-1 e I-2 con `spawn(process.execPath, [tsx cli.mjs, hijo, modo])` asíncrono, anti falso verde (`idle`, `pg_terminate_backend` = `true`, < 8 s desde «listo»), plazo propio de 60 s. Rojo medido CON el contenedor y con el esqueleto de L1 sin oyente activo (M-1), por aserción, no por conexión.
- [x] L2.4 Verde I-1 e I-2: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55433/postgres npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`. Anotar versión, SQLSTATE (`57P01` es hipótesis: se fija lo observado), línea exacta, pid antes/después y `application_name` del pool.
- [x] L2.5 I-3 (caracterización · consulta en curso) e I-4 (límite · cliente prestado con transacción abierta): primero medir, luego fijar lo observado (D-7); sus títulos dicen que son caracterización. Anotar la respuesta al §7 de la propuesta y si I-4 cambia la §27.
- [x] L2.6 E-1 a mano: `docker exec pcc-pg psql -U postgres -c "SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid()"`; anotar cómo se distingue la consola de la App.
- [x] L2.7 M-1 y M-2 sobre la integración (protocolo): M-1 ⇒ I-1 e I-2 rojas (hijo con salida ≠ 0), anotar qué hace I-3; M-2 ⇒ sólo I-2 roja.
- [x] L2.8 `docker stop pcc-pg` (el `--rm` lo borra); comprobar con `docker ps -a` que no queda.
- [x] L2.9 Cierre del lote: las cinco comprobaciones (la suite NO lleva `TEST_DATABASE_URL`; la integración queda omitida), medida (i4), `apply-progress.md` (fusionado), commit.

## Lote L3 — `DEPLOY.md` §27, guardas y barrido (intento i5)
Escenarios: RQ-ZS-62 los tres; RQ-ZS-61.3.
- [x] L3.1 ROJO `apps/desk/server/deployPoolConexionCortada.test.ts` (nuevo, molde `apps/desk/server/deployArranqueEstricto.test.ts:17-31`): `faltasSeccion27` con la lista de `design.md` §8, el texto fijo IMPORTADO de `@ambientalia/zoho-sync/db/conexionPerdida`; real ⇒ `[]`; copias en memoria sin «salvo que se repita», sin `pool.connect()`, con `## 28. Otra` detrás y sin §27, cada una con su falta exacta. Rojo: `DEPLOY.md` aún no tiene la §27.
- [x] L3.2 `DEPLOY.md`, al final: la §27 de `design.md` §8 con lo medido en L2 (línea de I-1, SQLSTATE, versión, `application_name` de E-1, límite de I-4). Ninguna línea existente se mueve (`git diff --numstat` con 0 borrados).
- [x] L3.3 Medir el rojo que la §27 causa en `apps/desk/server/deployArranqueEstricto.test.ts`; luego corregir en sitio `:9`, `:23`, `:24`, `:53`, `:54` (`design.md` §8): mismo número de líneas (57) y `git diff --numstat` con inserciones = borrados. Verde: esa prueba, `apps/desk/server/deployCalificacionesConversaciones.test.ts`, `deployControlCalidad.test.ts` y `deployModoSinZoho.test.ts` intactas.
- [x] L3.4 Mutaciones de la §27 (regla de mutación 2) sobre el `DEPLOY.md` real: borrar con `perl` la línea de «salvo que se repita» y la de `pool.connect()` ⇒ rojo; restaurar. Regla de mutación 1 de la guarda: quitar la acotación de `apps/desk/server/deployArranqueEstricto.test.ts:23` ⇒ rojo; restaurar.
- [x] L3.5 Citas B de artefactos propios: añadir en sitio «en `96cba5ab`» a `openspec/changes/pool-conexion-cortada/proposal.md:35` y `openspec/changes/pool-conexion-cortada/specs/zoho-sync/spec.md:24`, sin mover líneas.
- [x] L3.6 Barrido (regla de mutación 4, `design.md` §10): `grep -rnoE "pool\.ts:[0-9]+(-[0-9]+)?"` sobre TODO el repositorio INCLUIDO `openspec/changes/archive/` y `docs/`; explicar la diferencia 26 frente a 34. Leer cada hallazgo contra lo que AFIRMA y clasificarlo A, B o C. Segundo pase de la forma abreviada en los ficheros que citan `pool.ts` y de las citas a `apps/desk/server/deployArranqueEstricto.test.ts:23-24` y `:54`. Editar en sitio sólo B/C fuera de Supervisión; los paquetes fechados no se reescriben.
- [x] L3.7 Las de Supervisión (`docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`) NO se editan: se LISTAN con su clasificación en `apply-progress.md` (previstas: `docs/sdd/ENTRADA.md:2533` B, su «Afecta a» `:2536` según I-4; `CLAUDE.md:199` A).
- [x] L3.8 CA-6/CA-8: `apps/desk/server/reconciliacion/registro.test.ts` sigue verde sin tocarlo (`fuera-del-plan` no entra en «en curso»); `.env.example` y `packages/zoho-sync/src/db/schema.sql` sin diff.
- [x] L3.9 Cierre del lote: las cinco comprobaciones sobre el commit final, `git show --numstat` con sólo ficheros de este cambio, medida (i5), `apply-progress.md`, commit.

## Verificación y archivo (intentos propios, tras L3)
- [x] V.1 Verify independiente (i6): `verify-report.md` con cada escenario de RQ-ZS-58 a RQ-ZS-62 contra su prueba y CA-1 a CA-8; reproducir al menos M-1, M-3 y la mutación de la §27 con `perl` y restauración comprobada.
- [x] A.1 Archivo (i7): techo = 2 × `wc -l` de la carpeta + 800; fusión por script de los cinco ADDED (RQ-ZS-58 a RQ-ZS-62) al final de `openspec/specs/zoho-sync/spec.md`, ensayo `--dry`, finales de línea conservados; `archive-report.md` con la línea de R-1. Medir la parte revisable antes de aplicar; si supera 800, parar.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio (mismo despliegue que el arranque estricto, o antes) y comprobar que la App escucha | Alfonso | `DEPLOY.md` §27, `proposal.md` §8 |
| P-2 | Opcional: cortar una conexión `idle` de la App y buscar la línea en el registro; si no aparece, EasyPanel no enseña stderr (cierra también la P-2 de la §26) y se aplica D-1 | Alfonso, con el analista | `DEPLOY.md` §27, `design.md` §8 |
