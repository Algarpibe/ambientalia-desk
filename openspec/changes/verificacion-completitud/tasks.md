# Tareas — `verificacion-completitud` (1G-03, `cierra: si`)

Entradas: `proposal.md` (S-a a S-n, CA-1 a CA-13), `specs/zoho-sync/spec.md` (RQ-ZS-34 a RQ-ZS-39; 32 escenarios) y `design.md` (D1-D17, M1-M12, P1-P8; ante un
conflicto de nombres manda la spec). `strict_tdd`: cada prueba nace **roja por la razón correcta** (nunca por el arnés) antes de la línea de producción que la pone
verde; las pruebas nuevas van en ficheros nuevos o **al final** de uno existente, nunca en medio. Comprobaciones de CADA intento, **en serie** y sobre el árbol
commiteado: `npm run typecheck`; `npm run lint -- --max-warnings 165` (informar N avisos contra 165; la base es exactamente 165, así que un aviso nuevo falla);
detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; sin compuerta de memoria: anotar memoria libre al arrancar, duración y código de cada
`npm test`, con la salida completa a un log en el scratchpad (repetir sólo si sale 1 SÓLO por «Timeout calling onTaskUpdate» con todo verde); `npm run build`. Las
cinco en 0. Mutaciones con `perl -i -pe '… if $. == N'` (nunca `sed -i`: pasa a LF los ficheros CRLF); restaurar y comprobar `git diff` vacío y `file <fichero>` aún
CRLF. Medida de cada intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; ≤ 800. `apply-progress.md` se fusiona, nunca se sobrescribe.

## Review Workload Forecast
| Lote | Estimado | ×1,8 | Techo |
|---|---|---|---|
| L1 | ~415 | ~750 | 800 |
| L2 | ~410 | ~740 | 800 |
| L3 | ~425 | ~765 | 800 |
| L4 | ~430 | ~775 | 800 |
| L5 | ~430 | ~775 | 800 |
| L6 | ~425 | ~765 | 800 |

Cada lote supera las 400 líneas pero ninguno las 800 de su intento (el `apply-progress.md`, ~80, ya va dentro); una rama, fusionada por el analista, sin PRs. Márgenes
estrechos: si un lote se desvía de su estimado, se parte antes de seguir. Esta tarea (i2) ya carga las 259 líneas del diseño.
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High

| Unidad | Meta | Prueba focal | Arnés real | Frontera de vuelta atrás |
|---|---|---|---|---|
| L1 | `comparar.ts`, `veredicto.ts`, interruptor, §23 y su guarda (D11-D13) | `npx vitest run apps/desk/server/completitud/comparar.test.ts apps/desk/server/completitud/veredicto.test.ts packages/zoho-sync/src/config.test.ts apps/desk/server/deployVerificacionCompletitud.test.ts apps/desk/server/deployRellenoAdjuntos.test.ts apps/desk/server/deployRellenoConversaciones.test.ts` | lectura de `DEPLOY.md` y `config.ts` | `completitud/`, `config.ts`, `appHarness.ts`, `DEPLOY.md` |
| L2 | `conocidas.json`, `conocidas.ts`, `clasificar.ts` (D2, D3) | `npx vitest run apps/desk/server/completitud/conocidas.test.ts apps/desk/server/completitud/clasificar.test.ts apps/desk/server/deployVerificacionCompletitud.test.ts` | el fichero real y copias ensuciadas | `completitud/` |
| L3 | `soloLectura.ts`, `lectores.ts`, `eventId` exportado (D4-D6) | `npx vitest run apps/desk/server/completitud/soloLectura.test.ts apps/desk/server/completitud/lectores.test.ts` | `upsertHistoryEvent` real, `setTimeout` falso | `completitud/`, `history.ts` |
| L4 | `verificacion.ts`: estado, fase A, `lanzar`, `recuento`, `estado` (D7, D10, D11) | `npx vitest run apps/desk/server/completitud/verificacionGlobal.test.ts` | pg-mem, `zohoFetch` falsa | `verificacion.ts` |
| L5 | `porTicket.ts` y el bucle de la fase B (D8) | `npx vitest run apps/desk/server/completitud/verificacionPorTicket.test.ts` | pg-mem, grabadora de sentencias | `porTicket.ts`, `verificacion.ts` |
| L6 | Fase C, continuación, ruta y cableado (D9, D10, D12) | `npx vitest run apps/desk/server/completitud/verificacionContinuacion.test.ts apps/desk/server/completitud/verificacionRutas.test.ts apps/desk/server/opcionesConversaciones.test.ts` | `appHarness.ts`, `fs` inyectado | ruta, `app.ts`, módulo |

## Planificación (i1, i2)
- [x] P.1 Guarda que cuenta el árbol, en sitio y con el mismo número de líneas: `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` (1G-03 entra en «en curso», NUEVE); rojo medido antes, 2/2; commit `e9941944`.
- [x] P.2 `proposal.md` y `specs/zoho-sync/spec.md` (i1).
- [x] P.3 `design.md`, este `tasks.md` y las dos ediciones en sitio de la delta (`openspec/changes/verificacion-completitud/specs/zoho-sync/spec.md:54`, la excepción `app-`; `:127`, el corte en A se reanuda sin `desde`), 1/1 cada una (i2).

## Lote L1 — comparación, veredicto, interruptor y §23 (intento i3)
Escenarios: RQ-ZS-36 igual cantidad con ids distintos, recuento declarado no decide, adjunto por las dos vías cuenta una vez y `size` distinto; RQ-ZS-38 precedencia (a nivel de `veredicto.ts`); RQ-ZS-39 sólo `'true'` abre y `DEPLOY.md` documenta la variable.
Mutaciones y posiciones: M1 (`config.ts:125`), M5 (línea del «incompleto» global; se ejerce de nuevo en L6).
- [x] L1.1 M0: `npm test` entero en el commit de partida (`e9941944`) con su log; anotar ficheros, pruebas y duración.
- [x] L1.2 ROJO `apps/desk/server/completitud/comparar.test.ts` y `veredicto.test.ts` (nuevos): `compararIds` (CA-2: mismo número, ids distintos ⇒ diferencia; ordenado por longitud y luego texto), `unirPorId` (`4001` cuenta una vez; tamaño del lado de la conversación primero; `distintoTamano`, CA-3); precedencia **sin comparar > incompleto > rojo > verde** y global sin «sin comparar»; `cortadoEn`, `completa` falsa o `escriturasRechazadas.total > 0` ⇒ «incompleto» (M5).
- [x] L1.3 ROJO `apps/desk/server/deployVerificacionCompletitud.test.ts` (nuevo, molde `apps/desk/server/deployRellenoConversaciones.test.ts`): §23 tras la §22, un apartado `###` con las dos frases, nace cerrada, línea de entorno vacía, `=== 'true'` en `packages/zoho-sync/src/config.ts`, los pasos (`limite=0`, `?limite=20`, `?desde=`). Y `packages/zoho-sync/src/config.test.ts`, **al final**: sólo `'true'` abre (`TRUE`, `1`, vacío, ausente cierran).
- [x] L1.4 Anotar el rojo medido de L1.2-L1.3 (fichero › prueba › aserción) en `apply-progress.md`; ninguna roja por el arnés.
- [x] L1.5 `apps/desk/server/completitud/comparar.ts` y `veredicto.ts` (nuevos; el «incompleto» global en UNA línea). En sitio, inserciones = borrados (`git diff --numstat`): `packages/zoho-sync/src/config.ts:66` y `:125`; `apps/desk/server/testing/appHarness.ts:46` y `:49` (2/2 cada uno).
- [x] L1.6 `DEPLOY.md`, tras `:987`: §23 (D13). Antes de tocar la guarda, **medir el rojo** que la §23 causa en `apps/desk/server/deployRellenoAdjuntos.test.ts:37` y `:38` (`seccion` llega al final: dos `##` y cuatro `###`); anotarlo. La §23 aterriza antes de que exista la ruta: la prueba de despliegue sólo comprueba texto. `.env.example` no se toca (P-5); `packages/zoho-sync/src/db/migrate.test.ts` tampoco: no hay tabla, el informe va en memoria.
- [x] L1.7 Guarda que cuenta el árbol, en sitio, 4/4 y con el molde de `apps/desk/server/deployRellenoConversaciones.test.ts:19` y `:25`: `apps/desk/server/deployRellenoAdjuntos.test.ts:22` acota hasta `## 23. `; `:37` añade que la §23 va detrás; `:11` y `:34` dejan de decir «es la última».
- [x] L1.8 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [x] L1.9 Mutaciones L1 con su rojo: M1 (`s/_HABILITADA === 'true'/_HABILITADA !== 'false'/` sólo en el campo nuevo de `config.ts:125`), M5 (vaciar la línea del «incompleto» global). Tabla en `apply-progress.md`.
- [x] L1.10 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`.
- [x] L1.11 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido (B.1) y `apply-progress.md`.

## Lote L2 — lista de conocidas y clasificación (intento i4)
Escenarios: RQ-ZS-34 los cinco (conocida con causa y entrada, quitar la entrada ⇒ «sin explicar», ticket ausente transmite su clase, copia ensuciada no carga, entrada sin efecto).
Mutaciones y posiciones: M6, M7, M9, P5, P6.
- [x] L2.1 M0 del lote: `npm test` en el commit de L1 con su log.
- [x] L2.2 ROJO `apps/desk/server/completitud/conocidas.test.ts` (nuevo): el fichero REAL carga; copias ensuciadas en memoria (sin causa, sin entrada, entrada mal formada, regla o entidad desconocida, clave de más, `ids` y `regla` juntas, `numeros` fuera de tickets, id repetido) no cargan y nombran la entrada sin eco de valores (CA-6); con el real, el #1017 sale conocida con E-267 (CA-5).
- [x] L2.3 ROJO `apps/desk/server/completitud/clasificar.test.ts` (nuevo): orden de D3 (id, herencia, regla); `nacidoEnLaApp` sólo explica «falta en Zoho»; un ticket ausente transmite clase y `heredadaDe`; entrada sin uso en `conocidasSinUso`; hueco de lista sin clase. Y **al final** de `deployVerificacionCompletitud.test.ts`: cada `entrada` del fichero real existe como `## E-<n> ·` en `docs/sdd/ENTRADA.md` (sólo lectura) o `## <n>. ` en `DEPLOY.md`.
- [x] L2.4 Anotar el rojo medido de L2.2-L2.3 en `apply-progress.md`.
- [x] L2.5 `apps/desk/server/completitud/conocidas.json` (siete entradas, disposición fija de D2, el #1017 en medio), `conocidas.ts` (`cargarConocidas`, `ErrorLista`, `REGLAS` una pareja por línea, `leerLista` síncrona) y `clasificar.ts` (`return porId(f) ?? porHerencia(f) ?? porRegla(f) ?? SIN_EXPLICAR` en UNA línea).
- [x] L2.6 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [x] L2.7 Mutaciones L2 con su rojo: M6 (`s/"causa": "[^"]*", //` en la línea del #1017; aparte, `s/nacidoEnLaApp/nacidoEnApp/` en una regla), M7 (borrar la línea del #1017 con `$_ = '' if $. == N`, que no es la última; aparte, vaciar en `REGLAS` la de `conversacionAusenteEnZoho`), M9 (quitar `porHerencia(f) ?? `), P5 (`porRegla(f) ?? porId(f) ?? porHerencia(f) ?? SIN_EXPLICAR`), P6 (`porId(f) ?? porRegla(f) ?? porHerencia(f) ?? SIN_EXPLICAR`). Tabla en `apply-progress.md`.
- [x] L2.8 Casilla de la regla 13 (`git diff --name-only` sin `apps/desk/src`) y cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`. **Hecho en el lote:** regla 13, medida y barrido (B.1); PENDIENTE DEL ORQUESTADOR: las cinco comprobaciones sobre el árbol commiteado.

## Lote L3 — sólo lectura y lectores de Zoho (intento i5)
Escenarios: RQ-ZS-37 sólo `GET` y ninguna escritura de negocio, `429` se reintenta antes del `404` y del `!res.ok`; RQ-ZS-36 la historia casa por el id derivado (CA-4).
Mutaciones y posiciones: M3 (c), M4 (b), P3.
- [ ] L3.1 M0 del lote: `npm test` en el commit de L2 con su log.
- [ ] L3.2 ROJO `apps/desk/server/completitud/soloLectura.test.ts` (nuevo): `soloSelect` y `soloGet` rechazan, REGISTRAN total y tipo (nunca sentencia ni parámetros) y después lanzan; un `init` con `POST` se rechaza y se cuenta; el registro es lo que se prueba, no la excepción.
- [ ] L3.3 ROJO `apps/desk/server/completitud/lectores.test.ts` (nuevo): `429, 429, 404` ⇒ «falta en Zoho» tras dos pausas; `429, 500` ⇒ error tras la pausa; `404` por id ⇒ «falta», en una lista ⇒ error; agotados los `429` ⇒ `corte`; `from=1`; `200` vacío y `204`; tope de 200 páginas; motivos de un conjunto cerrado sin `e.message`; `reintentos429` siempre pasado a `leerConversaciones`; CA-4 con el `upsertHistoryEvent` real.
- [ ] L3.4 Anotar el rojo medido de L3.2-L3.3 en `apply-progress.md`.
- [ ] L3.5 `apps/desk/server/completitud/soloLectura.ts` y `lectores.ts` (nuevos; cada guarda en SU línea, orden `429`, `404`, `!res.ok`, `catch` en una línea; sin `init` en las llamadas). En sitio, 1/1: `packages/zoho-sync/src/db/history.ts:8`, `function eventId(` pasa a `export function eventId(`; y `openspec/changes/verificacion-completitud/proposal.md:47`, la cita `packages/zoho-sync/src/db/history.ts:8-11` pasa a caso B («en una función no exportada» en `03ab82c2`).
- [ ] L3.6 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [ ] L3.7 Mutaciones L3 con su rojo: M3 (c) (vaciar la comprobación de `soloGet`), M4 (b) (`catch (e) { return falla(String(e)) }`), P3 (en cada lector, una vez por lector, anteponer a la del `429` una copia de la de `!res.ok`; aparte, en `leerPorId`, a la del `404`). Tabla en `apply-progress.md`.
- [ ] L3.8 Casilla de la regla 13 (`git diff --name-only` sin `apps/desk/src`) y cierre del lote: las cinco comprobaciones en 0, la medida, el barrido (B.1, con la anotación del caso B de `proposal.md:47`) y `apply-progress.md`.

## Lote L4 — motor: estado, fase A, `lanzar` y `recuento` (intento i6)
Escenarios: RQ-ZS-35 los cinco; RQ-ZS-37 `limite=0` cuenta y estima sin llamar a Zoho, una pasada a la vez, sólo `GET` y ninguna escritura (`escriturasRechazadas`).
Mutaciones y posiciones: M3 (a), M11, P4, P7.
- [ ] L4.1 M0 del lote: `npm test` en el commit de L3 con su log.
- [ ] L4.2 ROJO `apps/desk/server/completitud/verificacionGlobal.test.ts` (nuevo): CA-1 (un id que falta en cada lado, en su lado y ordenado), S-l (hueco de lista), archivados, lista que falla ⇒ «sin comparar», `app-` sin petición por id (sale «falta en Zoho», «sin explicar» sin regla), corte `429` en la A con `cortadoEn: { fase: 'A', numero: null }`, `limite=0` con cero llamadas a Zoho, dos `lanzar` seguidos lanzan uno, lista inválida ⇒ `{ lanzada: false }` con `error`, `escriturasRechazadas.total` en 0.
- [ ] L4.3 Anotar el rojo medido de L4.2 en `apply-progress.md`.
- [ ] L4.4 `apps/desk/server/completitud/verificacion.ts` (nuevo): `crearVerificacionCompletitud`, estado, fase A, `lanzar` (la línea de `estado` con `enMarcha: true` y después `void pasada(…)`, ANTES de todo `await`), `recuento`, `estado()` con `structuredClone`; el bucle de re-verificación por id en UNA línea; sin `sync`.
- [ ] L4.5 Verde: `verificacionGlobal.test.ts`, `npm run typecheck` y suite entera con su log.
- [ ] L4.6 Mutaciones L4 con su rojo: M3 (a) (anteponer a la línea de la lista de tickets de la A `await createSync(…).backfillTickets(); ` más su importación, dos N; rojo: `escriturasRechazadas.total` > 0 en la aserción `toBe(0)`), M11 (anteponer a la primera de `recuento` `await faseA(estadoInicial()); `), P4 (`await leerPorId(f, ruta(id))` → `({ estado: 'noEsta' })`), P7 (`enMarcha: true` → `enMarcha: false` y anteponer a la primera de `pasada` `await Promise.resolve(); estado.enMarcha = true; `, dos N). Tabla en `apply-progress.md`.
- [ ] L4.7 Casilla de la regla 13 (`git diff --name-only` sin `apps/desk/src`) y cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Lote L5 — fase B, por ticket (intento i7)
Escenarios: RQ-ZS-36 igual cantidad con ids distintos, recuento declarado, adjunto por dos vías, historia por id derivado (a nivel de motor); RQ-ZS-34 un ticket ausente transmite su clase; RQ-ZS-37 informe, `GET` y log sin datos de clientes.
Mutaciones y posiciones: M2, M3 (b), M4 (a), M12 (`unirPorId`), P8.
- [ ] L5.1 M0 del lote: `npm test` en el commit de L4 con su log.
- [ ] L5.2 ROJO `apps/desk/server/completitud/verificacionPorTicket.test.ts` (nuevo): CA-2, CA-3, CA-4; herencia a hijos de un ticket de un solo lado; `noEvaluados` con número y clase; error de una fuente = error del ticket en esa entidad (el de conversaciones arrastra a adjuntos); corte `429` en la B sin filas parciales de ese ticket; CA-10 con grabadora (ningún `INSERT`); CA-11 con marcadores en el Zoho falso (asunto, contacto, empresa) ausentes del informe, del `GET` y de `registrar` (serializados).
- [ ] L5.3 Anotar el rojo medido de L5.2 en `apply-progress.md`.
- [ ] L5.4 `apps/desk/server/completitud/porTicket.ts` (nuevo: `compararIds(zohoConv, deskConv)` y `unirPorId(deConversaciones, deSegunda)`, cada uno en UNA línea; `porTicket` acumula en local) y el bucle de la fase B en `verificacion.ts` (la línea del corte antes de la de `comparados++`).
- [ ] L5.5 Verde: `verificacionPorTicket.test.ts`, `npm run typecheck` y suite entera con su log.
- [ ] L5.6 Mutaciones L5 con su rojo: M2 (la de `compararIds` → condición por igual número), M3 (b) (`const lee = soloSelect(db)` → `const lee = db`; rojo: la grabadora ve un `INSERT`), M4 (a) (en la fila de ticket de la A, `asunto: t.subject, `), M12 (`unirPorId(…)` → `[...deConversaciones, ...deSegunda]`), P8 (anteponer a la del corte `estado.informe.cobertura.comparados++; ` y vaciar la de `comparados++`, dos N). Tabla en `apply-progress.md`.
- [ ] L5.7 Casilla de la regla 13 (`git diff --name-only` sin `apps/desk/src`) y cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Lote L6 — fase C, continuación, ruta y cableado (intento i8)
Escenarios: RQ-ZS-36 el volumen se juzga sin descargar, sin `ADJUNTOS_DIR`; RQ-ZS-37 `429` agotado corta y `desde` reanuda; RQ-ZS-38 los cuatro; RQ-ZS-39 orden de guardas, `limite=0` libre, `desde`/`limite` no enteros, `GET` no lanza.
Mutaciones y posiciones: M5 (de nuevo), M8, M10, M12 (`estadoCopia`), P1, P2.
- [ ] L6.1 M0 del lote: `npm test` en el commit de L5 con su log.
- [ ] L6.2 ROJO `apps/desk/server/completitud/verificacionContinuacion.test.ts` (nuevo, `fs` inyectado): fase C (`sinCopia`, `ausente`, `otroTamano`; `dir` nulo ⇒ «sin comparar» con `ADJUNTOS_DIR`; `ErrorDisco` ⇒ `code` de Node sin ruta; sin descargar); CA-7 (corte, error por ticket, parte previa perdida ⇒ «incompleto»); `?limite=20` y luego `desde=<cortadoEn>` dan UNA pasada completa; CA-9; CA-12 (dos pasadas iguales).
- [ ] L6.3 ROJO `apps/desk/server/completitud/verificacionRutas.test.ts` (nuevo, `appHarness.ts`): CA-8, P1 (cerrado y `limite=abc` ⇒ `403` que nombra `VERIFICACION_COMPLETITUD_HABILITADA`), P2 (sin rol y cerrado ⇒ el `403` de rol), `limite=0` libre y sin Zoho, `400` por no entero, `GET` sin lanzar, literal `habilitado: config.verificacionCompletitudHabilitada === true` leído de `apps/desk/server/app.ts` (molde `apps/desk/server/opcionesConversaciones.test.ts:39-41` y `:46-47`).
- [ ] L6.4 Anotar el rojo medido de L6.2-L6.3 en `apply-progress.md`.
- [ ] L6.5 Fase C y continuación en `verificacion.ts` (`completa: faseA && desdeInicial === null && faseB && faseC` en UNA línea; `estadoCopia` en UNA línea); `apps/desk/server/routes/verificacionCompletitud.ts` (nuevo: `app.post(RUTA, requireAuth(db), requireSuperAdmin, interruptorVerificacion(habilitado), validarParametros, asyncHandler(…))`). En sitio, 3/3: `apps/desk/server/app.ts:22` (las dos importaciones), `:50` (`const verificacion = crearVerificacionCompletitud({ … })`) y `:57` (`registerVerificacionCompletitudRoutes(app, { … habilitado: config.verificacionCompletitudHabilitada === true })`); conservar las subcadenas de `opcionesConversaciones.test.ts:39-41` y `:46-47`.
- [ ] L6.6 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [ ] L6.7 Mutaciones L6 con su rojo: M5 (vaciar el «incompleto» global; corte, error por ticket y parte perdida salen verdes), M8 (`s/habilitado: config\.verificacionCompletitudHabilitada === true/habilitado: true/` en `app.ts:57`), M10 (quitar `desdeInicial === null && `), M12 (la de `estadoCopia` → `const e = fila.storage_path ? 'presente' : 'sinCopia'`), P1 y P2 (los `s///` de D15 sobre la línea del `app.post`). Tabla en `apply-progress.md`.
- [ ] L6.8 Casilla de la regla 13 y regla de mutación 3: `git diff --name-only` sin nada bajo `apps/desk/src`; rol, interruptor y validación los impone el servidor.
- [ ] L6.9 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Barrido de la regla de mutación 4 (tarea de cierre de cada lote)
- [ ] B.1 `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` (y `DEPLOY.md:`) sobre TODO el repositorio, incluidos `openspec/changes/archive/` y `docs/`, para cada fichero muy citado editado en el lote (lista de D16): `packages/zoho-sync/src/config.ts`, `apps/desk/server/app.ts`, `packages/zoho-sync/src/db/history.ts`, `apps/desk/server/testing/appHarness.ts`, `DEPLOY.md`, `apps/desk/server/deployRellenoAdjuntos.test.ts`. Leer cada hallazgo contra lo que AFIRMA (casos A/B/C de `CLAUDE.md`); comprobar que `config.ts:125` sigue siendo la lectura `=== 'true'`, `app.ts:57` el `habilitado` y `history.ts:8-11` el id de la historia; segundo pase para las abreviadas en los ficheros que ya citan el módulo. En L3, anotar en sitio el caso B de `proposal.md:47`. Resultado en `apply-progress.md`.

## Verificación (intento i9)
- [ ] V.1 Verify independiente: `verify-report.md` con cada escenario de RQ-ZS-34 a RQ-ZS-39 contra su prueba.
- [ ] V.2 Reproducir todas las M* y P* del `apply-progress.md` con `perl`, restauración comprobada (`git diff` vacío, `file` aún CRLF).
- [ ] V.3 Las cinco comprobaciones en 0 y la medida del intento (el `verify-report.md` suma).

## Archivo (intento i10)
- [ ] A.1 Techo del intento = 2 × `wc -l` de la carpeta del cambio + 800. Medir antes de aplicar la parte revisable (fusión del delta más `archive-report.md`) con `git diff --shortstat --no-renames`; si supera 800, parar y consultar.
- [ ] A.2 Fusión por script de los seis ADDED (RQ-ZS-34 a RQ-ZS-39) al **final** de `openspec/specs/zoho-sync/spec.md`; identidad bloque a bloque y CRLF conservado (la spec viva es CRLF en la copia de trabajo y la delta se escribió en LF; comprobar con `file`).
- [ ] A.3 `archive-report.md` con la línea de R-1 (qué parte de 1G-03 cubrió y qué dejó fuera); tareas de persona declaradas aparte.
- [ ] A.4 `apps/desk/server/reconciliacion/registro.test.ts:218` («NUEVE» → «OCHO», 1G-03 cerrada por archivo por `verificacion-completitud`, `cierra: si`) y `:220` (quitar '1G-03' de «en curso» y `toContain('1G-03')` en «cerradas por archivo»), en sitio, mismo número de líneas, con su rojo medido al mover la carpeta.
- [ ] A.5 Cinco comprobaciones en 0 y commit que contiene sólo este cambio: `git show --numstat`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Abrir el interruptor (`true`) en la App y redesplegar | Alfonso | `DEPLOY.md` §23 |
| P-2 | `limite=0` primero; después la pasada completa y el `GET` hasta `terminado: true`; si se corta, `desde=<cortadoEn>` | Alfonso | `DEPLOY.md` §23 |
| P-3 | Pasar el resumen del `GET` final al analista y cerrar el interruptor, con redespliegue | Alfonso | `DEPLOY.md` §23 |
| P-4 | Repetir la pasada el día del corte, tras congelar Zoho y la sincronización final (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:97-98`) | Alfonso | `DEPLOY.md` §23 |
| P-5 | Añadir a `.env.example` la línea de la variable: la terminal no puede leer ese fichero | Alfonso | informe de cierre |
