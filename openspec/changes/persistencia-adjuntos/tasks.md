# Tareas — `persistencia-adjuntos` (1G-02, `cierra: si`)

Entradas: `proposal.md` (S-a a S-c, S-1 a S-15, CA-1 a CA-10), `specs/zoho-sync/spec.md` (RQ-ZS-30 a RQ-ZS-33; 22 escenarios) y `design.md`
(D1-D15, M1-M9, P1-P5; ante un conflicto de nombres manda la spec). `strict_tdd`: cada prueba nace **roja por la razón correcta** antes de
la línea de producción que la pone verde; las pruebas nuevas van en ficheros nuevos o **al final** de uno existente, nunca en medio.
Comprobaciones de CADA intento (no sólo de verify; D15 lo dice sólo de verify y aquí se corrige), **en serie** y sobre el árbol commiteado:
`npm run typecheck`; `npm run lint -- --max-warnings 165` (informar N avisos contra 165); detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`;
sin compuerta de memoria (corrección del 04/11): anotar memoria libre al arrancar, duración y código de cada pasada; si se corta por memoria, anotar y repetir; `npm test` solo, con la salida completa a un
log en el scratchpad (si sale 1 SÓLO por «Timeout calling onTaskUpdate» con todo verde, repetir); `npm run build`. Las cinco en 0. Mutaciones con
`perl -i -pe '… if $. == N'` (nunca `sed -i`: pasa a LF los ficheros CRLF); restaurar y comprobar `git diff` vacío y `file <fichero>` aún CRLF. Medida de cada
intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; ≤ 800. `apply-progress.md` se fusiona, nunca se sobrescribe.

## Review Workload Forecast
| Lote | Estimado | ×1,8 | Techo |
|---|---|---|---|
| L1 | ~390 | ~700 | 800 |
| L2 | ~330 | ~595 | 800 |
| L3 | ~380 | ~685 | 800 |
| L4 | ~350 | ~630 | 800 |
| L5 | ~300 | ~540 | 800 |

Cada lote ≤ 720 líneas cambiadas frente al techo de 800 (el `apply-progress.md`, ≈30, ya va dentro). Entrega: una rama fusionada por el analista, sin PRs.
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

| Unidad | Meta | Prueba focal | Arnés real | Frontera de vuelta atrás |
|---|---|---|---|---|
| L1 | `almacen.ts`: guardado seguro y estado de la copia (D2, D3) | `npx vitest run apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` | `fs.mkdtemp`, pg-mem, `zohoFetch` falsa | `apps/desk/server/adjuntos/` |
| L2 | Ruta local primero, `servir.ts`, configuración (D6, D7) | `npx vitest run apps/desk/server/adjuntos/servirLocal.test.ts apps/desk/server/admin.test.ts packages/zoho-sync/src/config.test.ts` | `appHarness.ts` | `attachment.ts`, `config.ts`, `app.ts`, módulo |
| L3 | Motor del relleno (D4, D8) | `npx vitest run apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` | pg-mem, `setTimeout` falso | `rellenoAdjuntos.ts` |
| L4 | Gancho `trasGuardar` y guardado periódico (D5) | `npx vitest run apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts packages/zoho-sync/src/conversacionesTrasGuardar.test.ts packages/zoho-sync/src/conversaciones.test.ts apps/hub-sync/src/hubSyncSinConversaciones.test.ts apps/desk/server/opcionesConversaciones.test.ts` | `createSync` real | `conversaciones.ts`, `sync.ts`, `index.ts`, módulo |
| L5 | Rutas de administración, §22 y `debt.md` (D9-D11) | `npx vitest run apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts apps/desk/server/deployRellenoAdjuntos.test.ts apps/desk/server/deployRellenoConversaciones.test.ts apps/desk/server/deployConversaciones.test.ts` | `appHarness.ts` | rutas, `app.ts`, docs |

## Planificación (i1)
- [x] P.1 Guarda que cuenta el árbol, en sitio y con el mismo número de líneas: `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` (1G-02 entra en «en curso»); hecha y en verde.

## Lote L1 — guardado seguro y estado de la copia (intento i2)
Escenarios: RQ-ZS-30 guardado correcto, `name` con `../` no influye, id no numérico, bytes de menos, fallo a mitad de escritura, sin `size`, directorio ausente o dentro de `dist/`.
Mutaciones y posiciones: M2 (las dos), M3 (sin comparar con `size`), M7 (segunda variante), P4.
- [x] L1.1 M0: `npm test` entero en el commit de partida (`d26ef8a5` más i1) con su log; anotar ficheros, pruebas y duración.
- [x] L1.2 ROJO `apps/desk/server/adjuntos/almacen.test.ts` (nuevo), pruebas SEPARADAS: guardado correcto y relanzar no pide; `name` con `../` no influye; id no numérico no pide ni escribe; bytes de menos; fallo a mitad de escritura (`fs` inyectado); sin `size` con `Content-Length`; sin `size` ni cabecera; `ErrorDisco`; `estadoCopia` (D3).
- [x] L1.3 ROJO `apps/desk/server/adjuntos/rutaAdjunto.test.ts` (nuevo): `dirAdjuntos` (ausente, relativa, dentro de `dist/`, válida) y la tabla de rutas contra `RUTA_ADJUNTO_ZOHO` y contra el literal leído de `apps/desk/server/routes/attachment.ts:17` (H5).
- [x] L1.4 Anotar el rojo medido de L1.2-L1.3 (fichero › prueba › aserción) en `apply-progress.md`; ninguna roja por el arnés.
- [x] L1.5 `apps/desk/server/adjuntos/almacen.ts` (nuevo): orden de D2 con `storage_path` sólo tras el `rename`, `estadoCopia`, `dirAdjuntos`; no crea el directorio.
- [x] L1.6 Verde: los dos ficheros nuevos, `npm run typecheck` y suite entera con su log.
- [x] L1.7 Mutaciones L1 con su rojo: M2 (nombre desde `name`; aparte, `writeFile` directo al final), M3, M7 (`\d+` → `\w+` en `attachment.ts:17`; aparte, en `almacen.ts`), P4 (`storage_path` antes del `rename`). Tabla en `apply-progress.md`.
- [x] L1.8 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`.
- [x] L1.9 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido (B.1) y `apply-progress.md`.

## Lote L2 — la ruta sirve de local; configuración (intento i3)
Escenarios: RQ-ZS-31 los cinco; RQ-ZS-32 el interruptor sólo abre con `'true'`; RQ-ZS-33 interruptor cerrado (la lectura de `GUARDAR_ADJUNTOS_AL_SINCRONIZAR`).
Mutaciones y posiciones: M1, M3 (servir sin comparar tamaño; la ruta que escribe), M6 (la línea de caída), P1.
- [x] L2.1 M0 del lote: `npm test` en el commit de L1 con su log.
- [x] L2.2 ROJO `apps/desk/server/adjuntos/servirLocal.test.ts` (nuevo): copia válida sin Zoho; HTML y SVG `attachment`; `4003` ausente y `4004` de otro tamaño caen a Zoho con UNA línea cada uno; cinco motivos del log; sin sesión y `/tickets/1/x` (P1: sin consultar `attachments`); `../secreto`; temporal; la ruta no escribe.
- [x] L2.3 ROJO `packages/zoho-sync/src/config.test.ts`, **al final**: las tres variables nuevas; sólo `'true'` abre (`TRUE`, `1`, vacío, ausente cierran); `ADJUNTOS_DIR` sin valor por defecto.
- [x] L2.4 Anotar el rojo medido de L2.2-L2.3 en `apply-progress.md`.
- [x] L2.5 En sitio, inserciones = borrados por fichero (`git diff --numstat`): `packages/zoho-sync/src/config.ts:66` y `:125`; `apps/desk/server/testing/appHarness.ts:46` y `:49`.
- [x] L2.6 `apps/desk/server/adjuntos/servir.ts` (nuevo) y `apps/desk/server/routes/attachment.ts` (`:4`, `:8`, `:10`; D6, `en d26ef8a5` en lo posterior a la `:20`); `requireAuth` y la guarda `:17-20` idénticas y antes de todo.
- [x] L2.7 `apps/desk/server/app.ts:9`, `:50` y `:58` en sitio. Condición: conservar las subcadenas de `apps/desk/server/opcionesConversaciones.test.ts:39-40` (`marcar: opcionesConversaciones(config).marcarAusentes === true` en la línea de `crearRellenoConversaciones({` y la importación de `opcionesConversaciones`) y de `:46-47`.
- [x] L2.8 Verde: ficheros de la prueba focal, `npm run typecheck` (el `dir` de `deps` en `index.ts` si hace falta) y suite entera con su log.
- [x] L2.9 Mutaciones L2 con su rojo: M1 (`!== 'false'`, un interruptor cada vez), M3, M6 (`name` en la línea de caída), P1 (buscar la copia antes de `requireAuth`; aparte, antes de la guarda). Tabla en `apply-progress.md`.
- [x] L2.10 Casilla de la regla 13 y regla de mutación 3: `git diff --name-only` sin `apps/desk/src`; cabeceras, rol y copia los decide el servidor.
- [x] L2.11 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Lote L3 — motor del relleno (intento i4)
Escenarios: RQ-ZS-32 `limite=0` sólo cuenta (módulo), reanudable e idempotente, `404` es ausente, `429`/disco/otro fallo, resumen y log sin datos de cliente, un segundo `POST` (módulo).
Mutaciones y posiciones: M5 (relleno), M6 (resumen), P3 (las dos), P5 (`enMarcha`).
- [x] L3.1 M0 del lote: `npm test` en el commit de L2 con su log.
- [x] L3.2 ROJO `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` (nuevo): orden, `desde` y `limite`; relanzar no pide; `limite=0` con `recuento` sin Zoho ni escritura; `dir` nulo no escribe.
- [x] L3.3 ROJO mismo fichero: `404` ausente listado; `429` dos veces y luego `200` con pausas de 2.000 ms; `429` agotado corta con `cortadoEn` sin pedir el siguiente; `500` cuenta y sigue; disco lleno corta y el tercero no se pide (`setTimeout` falso).
- [x] L3.4 ROJO mismo fichero: dos `lanzar` seguidos lanzan uno; resumen y línea de `registrar` con id y número del fallido y sin `name`, asunto, contacto ni empresa del fixture (serializado).
- [x] L3.5 Anotar el rojo medido de L3.2-L3.4 en `apply-progress.md`.
- [x] L3.6 `apps/desk/server/adjuntos/rellenoAdjuntos.ts` (nuevo): tipos de D8, guardas de D4 en su orden, `enMarcha` antes del primer `await`, `motivoPrimerFallo ??=`.
- [x] L3.7 Verde: el fichero de L3, `npm run typecheck` y suite entera con su log.
- [x] L3.8 Mutaciones L3 con su rojo: M5 (sin corte ante `429` agotado), M6 (`name` en el resumen), P3 (`429` tras `!res.ok`; aparte, el `404`), P5 (`enMarcha` tras el primer `await`). Tabla en `apply-progress.md`.
- [x] L3.9 Casilla de la regla 13: `git diff --name-only` sin `apps/desk/src`.
- [x] L3.10 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Lote L4 — gancho al sincronizar (intento i5)
Escenarios: RQ-ZS-33 la pasada trae los pendientes hasta el tope, interruptor cerrado o sin periódica, el worker y la apertura no descargan, un `404` o un tamaño distinto no se repite; RQ-ZS-30 directorio ausente (pasada).
Mutaciones y posiciones: M4 (las dos), M5 (gancho), M8 (las tres), M9, P5 (`guardados.push`).
- [x] L4.1 M0 del lote: `npm test` en el commit de L3 con su log.
- [x] L4.2 ROJO `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` (nuevo): `trasGuardar` al final con los ids guardados; si guardar lanza, el id no entra; un gancho que lanza no rompe el ciclo; la apertura (`syncConversations`) no lo llama.
- [x] L4.3 ROJO `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts` (nuevo, `createSync` real): tope; ticket no tocado; `TRUE`, `1`, vacío y sin periódica; sin directorio; memoria de `404`/`fallido:tamano`; corte por `429`; el worker no descarga.
- [x] L4.4 ROJO en sitio, mismo número de líneas: `apps/desk/server/opcionesConversaciones.test.ts:25` pasa a exigir `conversaciones: conGuardadoDeAdjuntos(opcionesConversaciones(config), config,` en la línea de `createSync({` de `index.ts` (fichero vigilado; M9 la ejerce).
- [x] L4.5 Anotar el rojo medido de L4.2-L4.4 en `apply-progress.md`.
- [x] L4.6 En sitio, inserciones = borrados (`git diff --numstat`): `packages/zoho-sync/src/conversaciones.ts:34`, `:149`, `:150`, `:154`, `:163`, `:173` (6/6); `packages/zoho-sync/src/sync.ts:66` (1/1); `apps/desk/server/index.ts:15` y `:23` (2/2).
- [x] L4.7 `apps/desk/server/adjuntos/guardadoAlSincronizar.ts` (nuevo): `conGuardadoDeAdjuntos`, tope `TOPE_ADJUNTOS_POR_CICLO = 20`, `Set` en el cierre, nunca rechaza.
- [x] L4.8 Verde: la prueba focal (incluye `hubSyncSinConversaciones.test.ts` y `opcionesConversaciones.test.ts`), `npm run typecheck` y suite entera con su log.
- [x] L4.9 Mutaciones L4 con su rojo: M4 (`syncConversations` llama a `trasGuardar`; aparte, `hub-sync.ts:21` pasa `conversaciones`), M5 (gancho), M8 (sin tope; sin memoria; `sync.ts:66` sin `trasGuardar`), M9 (`index.ts:23` sin el gancho), P5 (`guardados.push` antes de `guardarYReflejar`). Tabla en `apply-progress.md`.
- [x] L4.10 Casilla de la regla 13: `git diff --name-only` sin `apps/desk/src`.
- [x] L4.11 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Lote L5 — rutas de administración, §22 y `debt.md` (intento i6)
Escenarios: RQ-ZS-32 cerrado `403` antes de validar, sólo superadministrador, `GET` no lanza, `limite=0` sólo cuenta, el interruptor sólo abre con `'true'` (§22); RQ-ZS-30 directorio ausente (ruta).
Mutaciones y posiciones: M1 (§22), M7 (fichero vigilado), P2.
- [x] L5.1 M0 del lote: `npm test` en el commit de L4 con su log.
- [x] L5.2 ROJO `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts` (nuevo): `401`/`403` de rol en `POST` y `GET`; los dos `403` (interruptor y directorio) con `limite=abc`; `limite=0` libre y sin Zoho; `400`; el `GET` no lanza; segundo `POST`.
- [x] L5.3 ROJO `apps/desk/server/deployRellenoAdjuntos.test.ts` (nuevo, molde `deployConversaciones.test.ts`): orden y tras la §21, tres apartados con las dos frases, nace cerrado, líneas de entorno vacías, `df -h`, copia previa, `limite=0`, `desde=`, `=== 'true'` en `config.ts`.
- [x] L5.4 Anotar el rojo medido de L5.2-L5.3 en `apply-progress.md`.
- [x] L5.5 `apps/desk/server/routes/rellenoAdjuntos.ts` (nuevo): molde de `routes/rellenoConversaciones.ts`, `interruptorAdjuntos` antes de validar (B antes que C).
- [x] L5.6 `apps/desk/server/app.ts:22`, `:50` y `:57` en sitio (5/5 con L2). Condición: conservar las subcadenas de `opcionesConversaciones.test.ts:39-40` y `:46-47` (`habilitado: config.rellenoConversacionesHabilitado === true` en la línea de `registerRellenoConversacionesRoutes(app`).
- [x] L5.7 `DEPLOY.md`, tras `:912`: §22 con tres apartados `###` (D10). `.env.example` no se toca.
- [x] L5.8 Guarda que cuenta el árbol, en sitio y con el mismo número de líneas: `apps/desk/server/deployRellenoConversaciones.test.ts:10`, `:19`, `:22`, `:25` (la §21 deja de ser la última; molde `apps/desk/server/deployConversaciones.test.ts:20`); medir el rojo de `:25` al añadir la §22 y antes de editar.
- [x] L5.9 `debt.md:572`, `:582`, `:585`, `:597`, `:598` en sitio (D11), 5/5.
- [x] L5.10 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [x] L5.11 Mutaciones L5 con su rojo: M1 (`config.ts:125`, un interruptor cada vez), M7 (quitar «**Qué se rompe si se pone mal:**» de la §22; aparte, «Copia previa de `desk-db`» de la §21), P2 (interruptor tras validar; aparte, el de directorio). Tabla en `apply-progress.md`.
- [x] L5.12 Regla 13 y regla de mutación 3 (nada bajo `apps/desk/src`; rol e interruptores los impone el servidor) y cierre del lote: las cinco comprobaciones en 0, la medida, el barrido y `apply-progress.md`.

## Barrido de la regla de mutación 4 (tarea de cierre de cada lote)
- [x] B.1 `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre TODO el repositorio, incluidos `openspec/changes/archive/` y `docs/`, para cada fichero muy citado editado en el lote (lista de D14) y para `attachment.ts`; leer cada hallazgo contra lo que AFIRMA (casos A/B/C de `CLAUDE.md`); comprobar que `conversaciones.ts:163` sigue siendo la llamada a `guardarYReflejar` y `config.ts:125` la lectura `=== 'true'`; segundo pase para las abreviadas en los ficheros que ya citan el módulo. Resultado en `apply-progress.md`.

## Verificación (intento i7)
- [x] V.1 Verify independiente: `verify-report.md` con cada escenario de RQ-ZS-30 a RQ-ZS-33 contra su prueba.
- [x] V.2 Reproducir M1-M9 y P1-P5 del `apply-progress.md` con `perl`, restauración comprobada (`git diff` vacío, `file` aún CRLF).
- [ ] V.3 Las cinco comprobaciones en 0 y la medida del intento (el `verify-report.md` suma).

## Archivo (intento i8)
- [ ] A.1 Techo del intento = 2 × `wc -l` de la carpeta + 800. Medir antes de aplicar la parte revisable (fusión del delta más `archive-report.md`) con `git diff --shortstat --no-renames`; si supera 800, parar y consultar.
- [ ] A.2 Fusión por script de los cuatro ADDED (RQ-ZS-30 a RQ-ZS-33) al **final** de `openspec/specs/zoho-sync/spec.md`; identidad bloque a bloque y CRLF conservado (`file`).
- [ ] A.3 `archive-report.md` con la línea de R-1 (qué parte de 1G-02 cubrió y qué dejó fuera); tareas de persona declaradas aparte.
- [ ] A.4 `apps/desk/server/reconciliacion/registro.test.ts:218` («NUEVE» → «OCHO», 1G-02 cerrada por archivo por `persistencia-adjuntos`) y `:220` (quitar '1G-02' de «en curso» y `toContain('1G-02')` en «cerradas por archivo»), en sitio, mismo número de líneas, con su rojo medido al mover la carpeta.
- [ ] A.5 Cinco comprobaciones en 0 y commit que contiene sólo este cambio: `git show --numstat`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Crear el volumen persistente y montarlo en la App | Alfonso | `DEPLOY.md` §22 |
| P-2 | `df -h` del VPS (las copias de `desk` están en ese disco); si no alcanza, cuesta dinero: parar y consultar | Alfonso | `DEPLOY.md` §22 |
| P-3 | Copia previa de `desk-db`; `ADJUNTOS_DIR`; abrir interruptores; `limite=0`, pasada corta y completa | Alfonso | `DEPLOY.md` §22 |
| P-4 | Incluir el volumen en las copias (B2) | Alfonso | informe de cierre |
| P-5 | Añadir a `.env.example` las líneas de las tres variables | Alfonso | informe de cierre |
