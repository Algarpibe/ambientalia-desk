# Informe de verificación — `decisionales-por-cargo` (F1C-05, `cierra: no`)

Rama `decisionales-por-cargo`, HEAD `0f7c19b`, base `7ff08c8`. Modo `strict_tdd`. Árbol de trabajo limpio al empezar y al
terminar (`git diff --quiet` sin diferencias tras las mutaciones propias).

## Veredicto: PASS WITH WARNINGS

**0 CRITICAL · 2 WARNING · 3 SUGGESTION.** Los cuatro requisitos y sus 15 escenarios tienen código y prueba; las cuatro
comprobaciones terminan en 0. Los avisos son de forma (formato del registro de TDD y una cita desfasada una línea).

## Los cuatro códigos de salida (ejecutados en el worktree)

| Comando | Salida | Resultado |
|---|---|---|
| `npx vitest run` | **0** | 299 ficheros en verde, 3 saltados; 5.003 pruebas en verde, 11 saltadas |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` sin errores |
| `npx eslint .` | **0** | 0 errores, 165 avisos (igual que la línea base) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 7.309 comprobadas; 0 cabeceras inválidas; 13 abreviadas rotas informativas, ninguna de este cambio (la única que nombra `DEPLOY.md`, `docs/sdd/F0-00_Baseline_as-built.md:113`, apunta a la línea 56 de ese fichero, que esta tanda no toca: su único hunk empieza en la línea 753) |

## Requisito → evidencia

| Requisito / escenario | Código | Prueba | Estado |
|---|---|---|---|
| RQ-PM-28 · sólo `'true'` lo enciende | `packages/zoho-sync/src/config.ts:124` (`=== 'true'`); interfaz `:66` | `packages/zoho-sync/src/config.test.ts:101-107` (vacío, `false`, `TRUE`, `1`, `yes`, `true`) | OK |
| RQ-PM-28 · apagado todo como hoy, sin consulta extra | `apps/desk/server/services/ticketService.ts:131`: `config?.decisionalesPorCargo ? … : null` cortocircuita antes de `contextoDecisionales`; `apps/desk/server/services/decisionales.ts:10-13` devuelve `DECISIONALES_APAGADO` sin consultar | `apps/desk/server/decisionalesPorCargo.test.ts`: caracterización (Técnico ejecuta `escalado_a_revision`, ticket a `Notificado`) y «no consulta» (espía de SQL, `:53`) | OK |
| RQ-PM-28 · `DEPLOY.md` | `DEPLOY.md:754-774` (§15): qué enciende, qué se rompe, no antes del 14/12/2026, cargos antes de encender, línea para `.env.example` | lectura | OK |
| RQ-PM-29 · las 14 Decisionales y su área | `packages/shared/src/decisionales.ts:16-24` (mixtas y `area`) | `packages/shared/src/decisionales.test.ts` (tabla escrita a mano contra `CATALOGO_POR_FLUJO`) | OK |
| RQ-PM-29 · Técnico sin cargo suficiente | `decisionales.ts:44-49`, `:27-32` | 18 pruebas en `decisionales.test.ts` | OK |
| RQ-PM-29 · Especialista sólo con Coordinador vacante | `decisionales.ts:29-31`; vacante por `apps/desk/server/db/avisos.ts:121-127` (`active = true AND cargo_permiso = $1`) usada en `services/decisionales.ts:13` | dos del Especialista en shared y en servidor; M4a y M4b | OK |
| RQ-PM-29 · mixtas (`rechazo_revision` → Servicio Técnico; `rechazo_comercial` y `rechazo_garantia` → Comercial) | `decisionales.ts:16-18` | `decisionales.test.ts`; servidor «mixtas» | OK |
| RQ-PM-29 · `liberacion_sin_factura` sigue sólo del Director Comercial | `decisionales.ts:46` (la regla nueva no la reclama); `packages/shared/src/cargos.ts:32` | «la lista corta no se relaja» (shared y servidor) | OK |
| RQ-PM-29 · admin pasa, sin cargo bloqueado, Operativa intacta | `decisionales.ts:44` (admin), `:45` (no Decisional), `:49` (sin cargo → lista) | escenario «administrador, sin cargo y no Decisional» | OK |
| RQ-PM-29 · falla cerrada sin área | `decisionales.ts:48` (`[]`) y `mensajeDecisional` `:59-60` | `decisionales.test.ts:134` | OK |
| RQ-PM-30 · 403 tras el 409, el 403 de área y el de cargo, antes de todo 422 | `ticketService.ts:126-128` (409), `:129-130` (área), `:131` (cargo y Decisionales en la misma línea), `:141` (422 de derivación) | cinco pruebas de posición activan las dos guardas a la vez; M7a, M7b y M8 en rojo | OK (M7c equivalente, ver abajo) |
| RQ-PM-30 · sin escribir nada | el `throw` de `:131` precede a `entrantesDeTransicion` y a toda escritura | las pruebas comprueban `estadoDe` sin cambio | OK |
| RQ-PM-31 · ruta con sesión, mismo contexto | `apps/desk/server/routes/permisosDecisionales.ts:16-17` (`requireAuth` + `contextoDecisionales`), registro en `apps/desk/server/app.ts:61` | tres de la ruta (apagada, encendida con y sin Coordinador) y `401` sin sesión | OK |
| RQ-PM-31 · filtro del panel | `apps/desk/src/components/TransitionPanel.tsx:55` (contexto del servidor, apagado si falla), `:57` (`puedeEjecutarTransicionConDecisionales`) | sin prueba (`.tsx` fuera de la red, F0-00); lo cubre `typecheck` | OK |

## TDD y mutaciones

**Cumplimiento de TDD.** `apply-progress.md:10-13` y `:38-47` registran el rojo visto antes de cada verde: módulo
inexistente en `decisionales.test.ts`, `expected undefined to be false` en `config.test.ts`, 8 fallidas y 8 en verde en el
servidor. Los ficheros de prueba existen (18 + 16 pruebas, más 1 en `config.test.ts`) y pasan hoy. La caracterización
apagada nace en verde y está anotada como tal (`:42-47`). Triangulación adecuada: valores esperados distintos por caso.
Auditoría de aserciones: sin tautologías ni bucles fantasma; los dos `toEqual([])` (`decisionales.test.ts:134`,
`decisionalesPorCargo.test.ts:53`) afirman un contrato (falla cerrada; «no consulta») y tienen compañera no vacía.

**Mutaciones reproducidas por mí** (edición, prueba concreta, restauración; `git diff --quiet` en cada una):

| Id | Mutación | Resultado |
|---|---|---|
| M2 | la guarda ignora el interruptor (`true ?`) en `ticketService.ts:131` | ROJO, 2 fallidas (coincide con el registro) |
| M5a | `rechazo_revision` → `Comercial` en `decisionales.ts:17` | ROJO, 6 fallidas (5 de shared + 1 de servidor; el registro las cuenta por separado) |
| control | edición nula, mismo procedimiento | VERDE, 16/16: el procedimiento no inventa rojos |

**M7c es equivalente; la afirmación es correcta.** `cargosQueFaltanParaDecisional` devuelve `null` para toda transición de la
lista corta (`decisionales.ts:46`), y `cargoQueFaltaParaTransicion` sólo devuelve cargo para ellas (`cargos.ts:49-53`). Los
dos `403` no se activan nunca en la misma petición, así que ningún cuerpo distingue su orden. Lo que sí se puede fijar es la
consecuencia, y está fijada: sin `decisionales.ts:46` el orden pasa a importar y M6a+M7c se pone roja. M6a sola sobrevive en el
servidor porque el `403` de cargo, más estricto, va antes; la caza la prueba pura (lote 1). No es un hueco de la suite.

## Regla de mutación 4

`git diff --numstat 7ff08c8 0f7c19b`: `ticketService.ts` 3/3, `app.ts` 2/2, `appHarness.ts` 2/2, `TransitionPanel.tsx` 4/4;
`cargos.ts` no figura (intacto). `config.ts` 2/1: la línea 66 cambia en su sitio y la nueva `:124` sólo desplaza las dos
últimas líneas, que nadie cita. `DEPLOY.md` (22/0, hunk al final), `client.ts` (5/0), `index.ts` (1/0) y `config.test.ts`
(8/0) sólo crecen. Citas de los artefactos comprobadas contra el fichero: `cargos.ts:12-15`, `:27-35`, `:32`, `:40-42`,
`:45-53`, `:49`, `:56-58`; `tipoEvento.ts:11-15`; `avisos.ts:121-127`; `ticketService.ts:126-128`, `:129-130`, `:131`, `:141`;
`app.ts:61`; `appHarness.ts:46`/`:49`; `config.ts:123`/`:124`; `config.test.ts:32-36`; `users.ts:14-16`, `:30`;
`routes.ts:36`; `permissions.ts:5`; `transitions.ts:192`; `DEPLOY.md:335-336`, `:345-361`, `:358-361`; `config.yaml:1935`,
`:1942` (consecuencia 5): todas dicen lo que la frase afirma. Excepción en W2.

## Regla invariable 13

La tabla de `apply-progress.md:78-88` enumera cinco decisiones del cliente y las cinco tienen línea de servidor: ocultar
Decisionales sin cargo y mostrar al Especialista con vacante (`ticketService.ts:131`), saber si está encendido y vacante
(`permisosDecisionales.ts:17`, la misma `contextoDecisionales`), no filtrar si la ruta falla (comodidad; manda el `403`) y
ocultar `liberacion_sin_factura` (`ticketService.ts:131`, `cargoFalta`). Contraste en el código: el cliente no lee ninguna
variable de entorno ni decide la vacante (`TransitionPanel.tsx:55`); consume `puedeEjecutarTransicionConDecisionales` de shared
(`:57`) con el contexto del servidor. La imposición está probada en el servidor: el filtro es comodidad legítima (punto 3).

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W1 · Formato del registro de TDD.** `apply-progress.md` no lleva la tabla «TDD Cycle Evidence» con las columnas Safety
  Net / Triangulación / Refactor; lleva rojo y verde por tarea (`:10-13`, `:38-40`) y la línea base (`:7-8`). El contenido
  sustituye a la tabla, no hay incumplimiento de fondo. Recomendación: dejarlo dicho en el `archive-report.md`.
- **W2 · Cita desfasada una línea.** `apply-progress.md:84` («`permisosDecisionales.ts:16`, que llama a la misma
  `contextoDecisionales`») apunta a la apertura de la ruta (`app.get` de `/api/permisos/decisionales`); la llamada está en
  `apps/desk/server/routes/permisosDecisionales.ts:17`. En `DEPLOY.md:754-774` (§15) la frase habla de la ruta y `:16` vale.
  El detector no lo caza (la línea existe y no está vacía).

### SUGGESTION
- **S1.** Encendido, `ticketService.ts:131` consulta el contexto en **toda** transición, incluidas las Operativas y las de la
  lista corta, aunque la regla las descarte (`decisionales.ts:45-46`). No contradice RQ-PM-28 (exige cero consultas sólo
  apagado). Hipótesis: evaluar antes el tipo de evento ahorraría esa consulta; no se pide en esta tanda.
- **S2.** `proposal.md:45` cita `TransitionPanel.tsx:56-58` y `proposal.md:39` `ticketService.ts:126-128`: describen el árbol
  de `7ff08c8` (caso B de la regla de mutación 4), ciertas de su fecha; si el `archive-report.md` las repite, que nombre la revisión.
- **S3.** `proposal.md:39` describe «todo `422` (`:131-134`)» sobre la base; en esa revisión `:134` es el cálculo de cuarentena,
  no un `422` (hipótesis: se quiso decir el tramo de guardas). Sin efecto en el comportamiento.

## Tareas

Las tareas 1.1-2.9 de `tasks.md` están marcadas y coinciden con el estado del código; `3.1` queda abierta (verify y archive).
Las tareas de persona están fuera del recuento, con dueño y destino en `proposal.md` §10 (regla del ciclo 1); **archivar no las
da por hechas**.

## Siguiente paso

`sdd-archive`. Los dos avisos no bloquean; W2 se puede reparar en el acto de archivo (una cita de una línea).
