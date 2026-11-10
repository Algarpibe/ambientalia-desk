# Informe de verificación — `arranque-migracion-estricta` (`fuera-del-plan`, `cierra: si`)

**Veredicto: PASS** · 0 CRITICAL · 1 WARNING · 3 SUGGESTION.
Verificado sobre `a7ee92de` (partida `97539c73`), en el worktree `C:\dev\Desk_2_R1.023-worktrees\arranque-migracion-estricta`, árbol limpio al empezar y al acabar
(`git status --short` vacío tras las mutaciones). Contraste hecho contra el código y las pruebas reales, no contra `openspec/changes/arranque-migracion-estricta/apply-progress.md`.

## 1 · Las cinco comprobaciones (cadena `ame-cinco.sh V a7ee92de`, memoria libre al arrancar 5.531 MB)

| # | Comprobación | Código | Cifra |
|---|---|---|---|
| 1 | `npm run typecheck` | 0 | — |
| 2 | `npm run lint -- --max-warnings 165` | 0 | 165 avisos contra 165 |
| 3 | `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | detector limpio (incluye las 13 anclas «en 97539c73») |
| 4 | `npm test` (log a fichero, sin `tail`) | 0 | 364 s; sin `TEST_DATABASE_URL`, la integración queda omitida |
| 5 | `npm run build` | 0 | bundle `index-F1jDYjEU.js`, el mismo de producción (el cliente no cambia) |

La línea «medida» del script salió vacía, como se esperaba (partida igual a HEAD). El intento de verify no escribe código: sólo este informe.

## 2 · Comprobaciones por ejecución del brief

- `git diff --numstat 97539c73 a7ee92de -- apps/desk/server/index.ts` = `2 2`. Ambas versiones tienen 118 líneas y 0 retornos de carro en el árbol (final de línea homogéneo e igual).
  Las únicas líneas cambiadas son `:26` y `:27`; `:8` (`import { migrate, reorgToDesk, reseedTicketNumber }`) es idéntica.
- `git diff --quiet 97539c73 a7ee92de -- packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/schema.sql packages/zoho-sync/src/db/pool.ts apps/hub-sync .env.example CLAUDE.md docs/sdd/ENTRADA.md openspec/config.yaml docs/sdd/R08.4_Expediente_de_cambios.md` = 0.
  La diferencia de los ficheros `docs/sdd/F0-05_*` está vacía.
- Ninguna variable de entorno nueva: en líneas añadidas, `process.env.` sólo aparece en `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts` (`TEST_DATABASE_URL`, de pruebas)
  y en la prosa de `apply-progress.md` y `tasks.md` que nombra la mutación M-8. El módulo de producción no lee `process.env` (lo fija U-8). `.env.example` sin diff.
- Regla 13: `git diff --stat 97539c73 a7ee92de -- apps/desk/src` vacío (cambio sin cliente; el bundle es el mismo).
- `openspec/changes/arranque-migracion-estricta/proposal.md:1-8` empieza con la cabecera R-1 literal del brief (`tanda: fuera-del-plan`, `motivo`, `capacidad: [zoho-sync]`, `maestro: []`, `cierra: si`, `toca_maestro: no`, `origen_cabecera: declarada`).
- `openspec/changes/arranque-migracion-estricta/tasks.md`: marcadas todas las de trabajo (L1.1-9, L2.1-6, L3.1-5, B.1-2). Sin marcar: L1.10, L2.7, L3.6, B.3 (cierres del orquestador),
  V.1 (este verify) y A.1 (archivo). P-1, P-2 y P-3 están fuera del recuento, en la tabla de personas (`tasks.md:82-87`), con dueño y destino (regla del ciclo 1).
- Docker no se repitió: la integración contra PostgreSQL real se midió en L2 (16.14, 4/4; `apply-progress.md:72-85`); la suite verde la omite.

## 3 · Matriz requisito → escenario → prueba → resultado

Siglas: `U-n` = `packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts` (línea del `it`); `I-n` = `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts`;
`IDX` = `apps/desk/server/arranqueEstrictoIndice.test.ts`; `DEP` = `apps/desk/server/deployArranqueEstricto.test.ts`; `MOD` = `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts`.

| Requisito | Escenario | Prueba (ruta:línea) | Código que lo cumple | Resultado |
|---|---|---|---|---|
| RQ-ZS-52 | límite vigente antes de la primera sentencia y en todas | U-1 `:54`, U-2 `:67` | MOD `:90-96` (SET antes de nada), `:123` | PASS |
| RQ-ZS-52 | valor constante, sin variable | U-8 `:165`; `.env.example` sin diff | MOD `:15` (`LIMITE_ESPERA_BLOQUEO_MS = 10_000`) | PASS |
| RQ-ZS-52 | conexión limpia al pool, bien o mal | U-9 `:185`, U-10 `:191`, `:198`; I-4 `:141` | MOD `:83-87` (`release(true)`), `:94`, `:108`, `:117`, `:125` | PASS |
| RQ-ZS-53 | bloqueo ajeno agota el límite y la línea lo dice | U-6 `:128`; I-2 `:93` (`55P03` real, 10.105 ms) | MOD `:67-72` (`ErrorLimiteEspera`) | PASS |
| RQ-ZS-53 | otro fallo no se presenta como límite | U-6b `:144`, U-6c `:154` | MOD `:73-76` | PASS |
| RQ-ZS-53 | la línea llega al registro del arranque | IDX `:62` (catch de `main` conserva el aviso y la salida); E-3 a mano (`apply-progress.md:84`) | `apps/desk/server/index.ts:106-109` | PASS (la prueba viva es E-3, no repetida) |
| RQ-ZS-53 | evidencia contra PostgreSQL real, idempotente | I-1 `:81`, I-2 `:93` | — | PASS (medido en L2) |
| RQ-ZS-54 | la primera que falla corta la secuencia | U-4 `:98` | MOD `:121-128` | PASS |
| RQ-ZS-54 | fallo de la reorganización no llega a la migración | U-5 `:116` | MOD `:98-130` | PASS |
| RQ-ZS-54 | el fallo termina el proceso con código distinto de 0 | IDX `:62`; E-3 (salida 1) | `apps/desk/server/index.ts:106-109` | PASS |
| RQ-ZS-54 | volver a tolerar pone la prueba en rojo | mutación M-4 reproducida aquí (§4) | — | PASS |
| RQ-ZS-55 | posición del límite (mutación 1) | U-1 `:54` | MOD `:92` | PASS (M-1 reproducida) |
| RQ-ZS-55 | reorganización antes de la migración (mutación 1) | U-7 `:76`; IDX `:32`, `:41` | MOD `:115-119`; `apps/desk/server/index.ts:26-27` | PASS (M-2 reproducida) |
| RQ-ZS-55 | sin `DB_SCHEMA=desk` no hay reorganización | U-2 `:67`; IDX `:32` (el `if` de `DB_SCHEMA` envuelve sólo el reorg) | `apps/desk/server/index.ts:26` | PASS |
| RQ-ZS-55 | la puesta al día termina antes de escuchar | IDX `:62` (`app.listen(` tras `:27`) | `apps/desk/server/index.ts:27` frente a `:57-59` | PASS |
| RQ-ZS-55 | `index.ts` conserva sus líneas | IDX `:19`, `:26` | `numstat` `2 2` (§2) | PASS |
| RQ-ZS-56 | `migrate()`/`reorgToDesk()` siguen omitiendo y continuando | U-11 `:208`, U-3 `:87` | `packages/zoho-sync/src/db/migrate.ts:24-36`, `:126-131` sin diff | PASS |
| RQ-ZS-56 | los ficheros tolerantes no cambian | `git diff --quiet` (§2) = 0 | `migrate.ts`, `schema.sql`, `apps/hub-sync` | PASS |
| RQ-ZS-56 | el worker no recibe el límite | U-11 `:208` (no recibe `lock_timeout`); `apps/hub-sync` sin diff | `apps/hub-sync/src/hubSync.ts:13` | PASS |
| RQ-ZS-57 | §26 existe, última, completa | DEP `:36` | `DEPLOY.md:1112` (`## 26.`), `numstat` `38 0` | PASS |
| RQ-ZS-57 | ensuciar el fichero vigilado | DEP `:41`, `:47`, `:53` | — | PASS (M-10 en `apply-progress.md:119`) |
| RQ-ZS-57 | la guarda de la §25 sigue verde en sitio | `apps/desk/server/deployCalificacionesConversaciones.test.ts:9`, `:23`, `:24`, `:67`, `:68` | `numstat` `5 5`, 71 líneas antes y después | PASS |

CA-5 (nada tolerante cambia) y CA-6/CA-8 (`registro.test.ts`, `.env.example`) cumplen: ver §2 y la suite entera en verde.

## 4 · Mutaciones reproducidas aquí

Protocolo: `git add`, `perl -i -pe` con la condición de número de línea, focal, `git checkout`, `git diff --quiet`, `file`. Focal = `puestaAlDiaEstricta.test.ts` (15 pruebas) + `arranqueEstrictoIndice.test.ts` (8).

| Mutación | Cambio | Pruebas en rojo | Restaurada |
|---|---|---|---|
| **M-1 · posición del `SET`** | `puestaAlDiaEstricta.ts:92` pasa a `void 0` y el `SET` se envía tras la primera sentencia (`:123`) | **8 de 23:** U-1 `:54`, U-2 `:67`, U-4, U-5, U-7 `:76`, U-8 `:165`, U-9 `:185`, U-10 `:191` | sí: `git diff --quiet` = 0, `file` igual |
| **M-2 · orden reorg/migrate en `index.ts:26-27`** | contenido de `:26` y `:27` intercambiado (dos sustituciones en sitio; `numstat` 1/1) | **5 de 8** en IDX: líneas/finales `:19`, `:26 abre…` `:32`, `:27 aplica…` `:41`, `las dos líneas llevan await…` `:55`, `el especificador del import()…` `:74` | sí: `git diff --quiet` = 0, `file` igual |
| **M-4 · tolerar el fallo** | `puestaAlDiaEstricta.ts:125` `cerrar()` pasa a `continue` | **5 de 23:** U-4, U-5, U-6, U-6b, U-6c | sí: `git diff --quiet` = 0, `file` igual |

Incidente de método (mío, sin efecto): el primer intento de M-2 usó un `perl -i -e` que vació el fichero en vez de intercambiar las líneas; las pruebas salieron rojas por una razón trivial,
se descartó esa corrida, se restauró con `git checkout` y se repitió con sustituciones línea a línea, que es la fila de arriba. `git status --short` quedó vacío.
Las demás (M-3, M-5a/b, M-6 a M-10) constan en `apply-progress.md:30-44` y `:116-122`; el brief pedía reproducir al menos tres y las tres dan rojo.

## 5 · Desviaciones respecto del diseño

1. **Guarda de orden por la primera sentencia capturada** (MOD `:21`, `:115`), no por la identidad de la función: el módulo sólo importa el tipo `Queryable` de `migrate.ts`.
   Si `reorgToDeskStatements()` cambia su primera sentencia, U-1 y U-7 se ponen rojas (es lo buscado). Aceptable.
2. `ErrorPuestaAlDia` conserva `cause` (MOD `:31`): no estaba en el diseño y no altera el `message`. Efecto cosmético medido en E-3: el texto de la causa sale dos veces en el registro.
3. La sentencia que agota el límite en el bloqueo real fue el primer `CREATE INDEX IF NOT EXISTS … ON catalogo_modelos`, no el `ALTER … ADD COLUMN sku` del incidente. La §26 lo advierte. Es información, no defecto.
4. Cuatro citas literales que `design.md` §9 daba por A (`await migrate(pool)`) se anclaron como B (13 anclas «en 97539c73»). Inocuo si fueran A.
5. I-1 a I-4 nacieron en verde (el módulo ya existía desde L1): son caracterización; su capacidad de discriminar la prueba M-7 (I-4 en rojo, `apply-progress.md:79`).

## 6 · Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- W-1 · **Consecuencia (3) y P-2, de persona, siguen abiertas.** Si alguna sentencia de `schema.sql` o de la reorganización falla en CADA arranque de producción, con este cambio la App deja de
  arrancar (antes se omitía en silencio). Medida del analista del 10/11: ninguna línea «omitida» en el arranque del 08/11, con la hipótesis (sin comprobar) de que EasyPanel muestra stderr.
  Las sentencias de E-266 (`abc632ca`) no están medidas. P-2 (`tasks.md:86`) manda medir el registro de producción ANTES de desplegar; no es tarea de este repositorio y
  **archivar no la da por hecha**. Mitigación escrita en `DEPLOY.md` §26 (volver a la imagen anterior si falla una sentencia). Recomendación: no desplegar antes de P-2.

**SUGGESTION**
- S-1 · El `message` repite la causa de PostgreSQL (pino serializa `cause`). Cosmético; puede dejarse.
- S-2 · `apps/desk/server/index.ts:26` queda como línea larga (import dinámico, apertura y reorg). Es la forma que impone la regla de mutación 4 (sin insertar líneas); no tocar.
- S-3 · Para el archivo: A.1 abre con techo `2 × carpeta + 800` (carpeta ≈ 760 líneas con este informe) y fusiona los seis ADDED por script, con ensayo `--dry`.

## 7 · Citas de Supervisión que da `apply-progress.md` (bloque L3), re-comprobadas en `a7ee92de`

Re-comprobadas con `git grep` en los seis ficheros: las citas a `index.ts`, `migrate.ts`, `DEPLOY.md` (zona 1060-1199), `modoSinZohoIndice.test.ts` y `deployCalificacionesConversaciones.test.ts`
coinciden con las de `apply-progress.md:158-169`; `CLAUDE.md`, `docs/sdd/R08.4_Expediente_de_cambios.md` y `docs/sdd/F0-05_*` no tienen ninguna. Ningún fichero de Supervisión se editó.

| Fichero:línea | Cita | Qué afirma | Caso | Re-comprobada |
|---|---|---|---|---|
| `docs/sdd/ENTRADA.md:2425` | `apps/desk/server/index.ts:27` (y `:57`) | el arranque migra antes de escuchar | A (`:27` sigue siendo la migración) | sí |
| `docs/sdd/ENTRADA.md:2425` | `migrate.ts:28-34` | «sólo registra las que fallan» | B para el arranque de la App (cierto de la función y del worker) | sí |
| `docs/sdd/ENTRADA.md:2430` | `index.ts:27`, `:57` | la migración se espera antes de `app.listen` | A | sí |
| `docs/sdd/ENTRADA.md:2430` | `migrate.ts:28-34`, `:25-34` | «con un `lock_timeout` el arranque no fallaría» | C: lo cierra este cambio | sí |
| `docs/sdd/ENTRADA.md:2414` | `DEPLOY.md:1068` | la §25 empieza en la 1068 | A (ninguna línea se movió: `numstat` `38 0`) | sí |
| `openspec/config.yaml:6478` | `migrate.ts:25-34` | tolerancia deliberada; «con el cambio la App dejaría de arrancar» | A de la función; el segundo enunciado es hoy lo construido | sí |
| `docs/sdd/ENTRADA.md:1231`, `:1271`, `:2059` | `index.ts:85-93`, `:88` | la pasada periódica | A (líneas no tocadas) | por `apply-progress.md`, no re-leídas una a una |

Qué hacer: nada en la rama. Supervisión decide si añade a `docs/sdd/ENTRADA.md:2425` un «Actualizado» (caso B) y deja constancia del caso C de `:2430`.

## 8 · Contrato de fase

- `status`: done · `executive_summary`: PASS, 0 CRITICAL, 1 WARNING (P-2 / consecuencia (3), de persona), 3 SUGGESTION; las cinco en 0; tres mutaciones reproducidas.
- `artifacts`: `openspec/changes/arranque-migracion-estricta/verify-report.md`; Engram `sdd/arranque-migracion-estricta/verify-report`.
- `next_recommended`: `sdd-archive` (A.1) tras el commit del orquestador; P-2 antes de desplegar.
