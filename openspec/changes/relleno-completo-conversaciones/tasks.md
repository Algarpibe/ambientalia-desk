# Tareas — `relleno-completo-conversaciones` (1G-01, `cierra: si`)

Entradas: `proposal.md` (S-1 a S-15), `specs/zoho-sync/spec.md` (RQ-ZS-28, RQ-ZS-29; 19 escenarios) y `design.md` (D1-D13, plan de
registro; ante un conflicto de nombres manda la spec). `strict_tdd`: cada prueba nace **roja por la razón correcta** antes de la línea
de producción que la pone verde; las de CARACTERIZACIÓN nacen verdes y su valor está en la mutación de D11. Comprobaciones de cada
intento, **en serie** y sobre el árbol commiteado: `npm run typecheck`; `npm run lint -- --max-warnings 165` (informar N avisos
contra 165); detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; compuerta de memoria
`systeminfo | grep -ai disponible` ≥ 12.000 MB antes de `npm test` (si no, PARAR e informar); `npm test` solo, con la salida completa
a un log (si sale 1 SÓLO por «Timeout calling onTaskUpdate» con todo verde, repetir); `npm run build`. Las cinco en 0.
Mutaciones con `perl -i -pe '… if $. == N'` (nunca `sed -i`: pasa a LF los ficheros CRLF); restaurar y comprobar `git diff` vacío
del fichero y `file <fichero>` aún CRLF si lo era. Medida de cada intento: `git diff --shortstat --no-renames <partida>` más
`wc -l` de lo nuevo sin trackear; ≤ 800. `apply-progress.md` se fusiona, nunca se sobrescribe.

## Review Workload Forecast

| Lote | Estimado | ×1,8 | Techo |
|---|---|---|---|
| L1 | ~380 | ~685 | 800 |
| L2 | ~310 | ~560 | 800 |
| L3 | ~380 | ~685 | 800 |

Cada lote ≤ 720 líneas cambiadas frente al techo de 800. Entrega: una rama fusionada por el analista, sin PRs.
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

| Unidad | Meta | Prueba focal | Arnés real | Frontera de vuelta atrás |
|---|---|---|---|---|
| L1 | `syncTicket(id, detalle?)` y recorrido, detalle, persistencia, lectura y clases | `npx vitest run apps/desk/server/rellenoConversaciones.test.ts packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` | pg-mem + `createSync` real, `zohoFetch` falsa | `sync.ts` en sitio y el módulo nuevo |
| L2 | Corte por 429, resumen, `registrar`, concurrencia, pausas | `npx vitest run apps/desk/server/rellenoConversaciones.test.ts apps/desk/server/rellenoConversacionesPausas.test.ts` | pg-mem, `setTimeout` falso | los dos ficheros de L2 |
| L3 | Interruptor, cableado, rutas, `DEPLOY.md` §21, `debt.md` | `npx vitest run apps/desk/server/rellenoConversacionesRutas.test.ts apps/desk/server/deployRellenoConversaciones.test.ts` | arnés `appHarness.ts` | rutas, config y docs |

## Lote L1 — `syncTicket(id, detalle?)` y el recorrido (intento i2)

Escenarios: RQ-ZS-28 orden y `app-`, `desde`/`limite`, cuadra, descuadrado, sin recuento, lectura fallida, no está en Zoho; RQ-ZS-29 otro fallo no corta y `limite=0` (módulo).
Mutaciones de D11 en este lote: M3, M8, M9 (las dos variantes).

- [x] L1.1 M0: `npm test` entero en el árbol de partida con su log; anotar ficheros, pruebas y duración.
- [x] L1.2 ROJO `packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` (nuevo): con `detalle` cero peticiones de detalle y fila persistida; sin él, lo de hoy; `managed_by_app` conserva su fila.
- [x] L1.3 ROJO `apps/desk/server/rellenoConversaciones.test.ts` (nuevo, pg-mem + `createSync` real): orden y salto de `app-` con archivados (D4), `desde`, `limite`, una petición de detalle por ticket, `recuento({ desde })` sin Zoho.
- [x] L1.4 ROJO mismo fichero: 404 e `isDeleted`/`isTrashed` sin escribir ni leer; `500` que cuenta y sigue; archivado tipo #300 (7 + 1) completo; descuadrado; sin recuento; lectura fallida «con error».
- [x] L1.5 Anotar el rojo medido de L1.2-L1.4 (fichero › prueba › aserción) en `apply-progress.md`; ninguna roja por el arnés.
- [x] L1.6 `packages/zoho-sync/src/sync.ts:18`, `:178`, `:179` en sitio (D2), mismo número de líneas: `git diff --numstat` con inserciones = borrados; `:180` sigue siendo el `throw`.
- [x] L1.7 `apps/desk/server/rellenoConversaciones.ts` (nuevo): tipos de D6, recorrido (D4), detalle (D5), persistencia por `syncTicket(id, detalle)`, lectura con `inicio` antes (D3) y clases.
- [x] L1.8 Verde: los dos ficheros nuevos y `npm run typecheck` (confirma la hipótesis de tipos de D2); suite entera con su log.
- [x] L1.9 Mutaciones L1 con su rojo: M3 (sin filtro `app-`), M8 (`sync.ts:179` sin la rama de `detalle`), M9 (404 sin rama propia; aparte, ignorar `isDeleted`/`isTrashed`). Tabla en `apply-progress.md`: colocación, rojas, restauración comprobada.
- [x] L1.10 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`.
- [x] L1.11 Cierre del lote: las cinco comprobaciones en 0 y la medida; barrido de la regla de mutación 4 (sección Barrido); `apply-progress.md`.

## Lote L2 — corte por 429, resumen y concurrencia (intento i3)

Escenarios: RQ-ZS-28 `managed_by_app`, verificación tras marcar, resumen sin datos de cliente; RQ-ZS-29 429 reintentado, 429 agotado en página, POST con la pasada en marcha (módulo).
Mutaciones y posiciones: M1, M2 (las dos variantes), M6 (las dos), M7 (en el módulo), P2, P3, P4.

- [x] L2.1 M0 del lote: `npm test` en el commit de L1 (hecho por el orquestador: 335+4 ficheros, 5.794 pruebas, 407 s, salida 0).
- [x] L2.2 ROJO `apps/desk/server/rellenoConversaciones.test.ts`: `managed_by_app` con `raw` viejo y detalle nuevo ⇒ completo y fila de la app intacta; fila visible que ya no viene (marcar apagado ⇒ descuadrado; encendido ⇒ marcada y completo); `source='app'` no cuenta.
- [x] L2.3 ROJO mismo fichero: 429 del detalle dos veces y luego 200 (repite la misma petición, `vistos429` = 2); 429 agotado en el detalle y en una página cortan, sin pedir el tercer ticket y con `cortadoEn`; fila guardada durante la lectura no se marca.
- [x] L2.4 ROJO mismo fichero: dos `lanzar` seguidos lanzan uno; resumen vía `registrar` con el número del descuadrado y sin asunto, contacto ni empresa del fixture (serializado); una sola línea de log.
- [x] L2.5 ROJO `apps/desk/server/rellenoConversacionesPausas.test.ts` (nuevo): pausas por omisión (`PAUSA_ENTRE_TICKETS_MS`, `pausa429Ms`) por conducta y con `setTimeout` falso, molde `conversacionesPausas.test.ts:16-51`.
- [x] L2.6 Anotar el rojo medido de L2.2-L2.5 en `apply-progress.md`.
- [x] L2.7 `rellenoConversaciones.ts`: verificación sobre lo guardado y visible (D3), corte (D5), `enMarcha` antes del primer `await`, resumen y `registrar` (D6), `motivoPrimerFallo ??=`.
- [x] L2.8 Verde: ficheros de L2 (30/30), regresiones cercanas, typecheck y eslint; la suite entera con su log es del orquestador en L2.11.
- [x] L2.9 Mutaciones L2 con su rojo: M1, M2 (contar lo recibido; aparte, quitar `source='zoho'`), M6, M7 (`marcar: true` fijo en el módulo), P2 (guarda 429 tras `!res.ok`), P3 (`inicio` tras leer), P4 (`enMarcha` tras el `await`). Tabla en `apply-progress.md`.
- [x] L2.10 Casilla de la regla 13 otra vez.
- [x] L2.11 Cierre del lote: las cinco comprobaciones en 0, medida, barrido y `apply-progress.md`.

## Lote L3 — interruptor, cableado, rutas y despliegue (intento i4)

Escenarios: RQ-ZS-29 interruptor sólo con `'true'`, `403` antes de validar, sólo superadministrador, POST en segundo plano y GET nunca lanza, POST en marcha (ruta), `limite=0` sólo cuenta.
Mutaciones y posiciones: M3 (`limite=0`), M4, M5, M7 (en `app.ts:50`), M10 (las dos), P1.

- [x] L3.1 M0 del lote: `npm test` en el commit de L2. Hecha por el orquestador sobre `16f54ec4`: 336+4 ficheros, 5.810 pruebas, 441 s, salida 0.
- [x] L3.2 ROJO `packages/zoho-sync/src/config.test.ts`, **al final**: nace cerrado, sólo `'true'` abre (`TRUE`, `1`, `yes`, vacío), independiente de `MARCAR_CONVERSACIONES_AUSENTES`.
- [x] L3.3 ROJO `apps/desk/server/opcionesConversaciones.test.ts`, **al final**: `app.ts` pasa `opcionesConversaciones(config).marcarAusentes` y no lee los interruptores por su cuenta (fichero vigilado, regla de mutación 2).
- [x] L3.4 ROJO `apps/desk/server/rellenoConversacionesRutas.test.ts` (nuevo): `401`/`403` en las dos rutas (molde `admin.test.ts:418-423`); `403` del interruptor que nombra la variable con `limite=abc`; `limite=0` libre y sin Zoho; `400`; el `GET` no lanza; POST en marcha.
- [x] L3.5 ROJO `apps/desk/server/deployRellenoConversaciones.test.ts` (nuevo, molde `deployConversaciones.test.ts`): orden y última, las dos frases, nace cerrado, línea `> RELLENO_CONVERSACIONES_HABILITADO=` vacía, copia previa, `limite=0`, `desde=`, la ruta y `=== 'true'` en `config.ts`.
- [x] L3.6 Anotar el rojo medido de L3.2-L3.5 en `apply-progress.md`.
- [x] L3.7 En sitio, mismo número de líneas: `config.ts:66` y `:125`; `app.ts:9`, `:22`, `:50`, `:57`; `appHarness.ts:46` y `:49` (D7).
- [x] L3.8 `apps/desk/server/routes/rellenoConversaciones.ts` (nuevo): `POST` y `GET`, `requireAuth(db), requireSuperAdmin`, `interruptorRelleno` antes de validar (D7).
- [x] L3.9 `DEPLOY.md`, al final: §21 con **Qué enciende:**, **Qué se rompe si se pone mal:**, nace cerrado, línea de entorno y pasos de P-2 (D8). `.env.example` no se toca.
- [x] L3.10 Guarda que cuenta el árbol: acotar `apps/desk/server/deployConversaciones.test.ts:20` (`tramo` sin `hasta`, se para en `## 21. `) y `:23` («va hasta la §21»), en sitio y con el mismo número de líneas (D8); nunca sólo `:27`.
- [x] L3.11 `debt.md:602`, `:614` y `:616-617` en sitio (D9), mismo número de líneas; `debt.md:631-634` sin tocar.
- [x] L3.12 Verde: ficheros de L3, `typecheck` y suite entera con su log.
- [x] L3.13 Mutaciones L3 con su rojo: M3 (`limite=0`), M4 (`!== 'false'` en `config.ts:125`), M5 (el `GET` llama a `lanzar`), M7 (`marcar: true` en `app.ts:50`), M10 (frase de la §21; aparte, «Copia previa» de la §20), P1 (interruptor tras validar). Tabla en `apply-progress.md`.
- [x] L3.14 Casilla de la regla 13 y regla de mutación 3: `git diff --name-only` sin nada bajo `apps/desk/src`; el rol y el interruptor los impone el servidor (D7).
- [x] L3.15 Cierre del lote: las cinco comprobaciones en 0, medida, barrido y `apply-progress.md`.

## Barrido de la regla de mutación 4 (tarea de cierre de cada lote)

- [x] B.1 `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre TODO el repositorio, incluidos `openspec/changes/archive/` y `docs/`, y leer cada hallazgo contra lo que AFIRMA: `sync.ts:18`, `:178`, `:179`; `config.ts:66`, `:125`; `app.ts:9`, `:22`, `:50`, `:57`; `deployConversaciones.test.ts:20`, `:23`; `debt.md:602`, `:614`, `:616-617`. Segundo pase para las abreviadas; resultado en `apply-progress.md`.

## Verificación (intento i5)

- [x] V.1 Verify independiente: `verify-report.md` con cada escenario de RQ-ZS-28 y RQ-ZS-29 contra su prueba.
- [x] V.2 Reproducir las mutaciones M1-M10 y P1-P4 del `apply-progress.md`, con `perl` y restauración comprobada.
- [x] V.3 Las cinco comprobaciones en 0 y la medida del intento (el `verify-report.md` suma).

## Archivo (intento i6)

- [ ] A.1 Medir antes de aplicar la parte revisable (fusión del delta más `archive-report.md`) con `git diff --shortstat --no-renames`; si supera 800, parar y consultar.
- [ ] A.2 Fusión por script de los dos bloques ADDED (RQ-ZS-28 y RQ-ZS-29) al **final** de `openspec/specs/zoho-sync/spec.md`; comprobar la identidad bloque a bloque y conservar CRLF (`file`).
- [ ] A.3 `archive-report.md` en UNA línea qué parte de 1G-01 cubrió y qué dejó fuera; tareas de persona declaradas aparte.
- [ ] A.4 `apps/desk/server/reconciliacion/registro.test.ts:218` («DIEZ» → «NUEVE» y el paréntesis: 1G-01 cerrada por archivo) y `:220` (quitar '1G-01' de «en curso» y `toContain('1G-01')` en «cerradas por archivo»), en sitio y con el mismo número de líneas (S-15).
- [ ] A.5 Cinco comprobaciones en 0 y commit que contiene sólo este cambio: `git show --numstat`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` la línea `RELLENO_CONVERSACIONES_HABILITADO=` | Alfonso | informe de cierre |
| P-2 | Copia previa de `desk-db`; abrir el interruptor y redesplegar; `limite=0`, pasada corta y completa | Alfonso | `DEPLOY.md` §21 |
| P-3 | Pasar el resumen al analista; descuadrados y «no está en Zoho» a la bandeja | Alfonso / analista | bandeja (R-3), Supervisión |
