```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:54a47f9cd66fee1fab257e371147d7d7b8f5c44d1c72bfa5675e79f72e66449e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 11/11
scenarios: 118/118
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:54a47f9cd66fee1fab257e371147d7d7b8f5c44d1c72bfa5675e79f72e66449e
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verificación — propagar-top5-lista-remision-creada

Cambio `propagar-top5-lista-remision-creada` (`tanda: F1B-07`, `cierra: no`). Modo: `strict_tdd`, `hybrid`.
Rama del mismo nombre, cabeza `65a7595`; lo propio del cambio se lee con `git diff 2a74fdc 49582af`
(`989bd4e` es una fusión de otra tanda y no se verifica aquí).

## Veredicto: PASS con avisos

0 CRITICAL, 3 WARNING, 3 SUGGESTION. Las 94 casillas de `tasks.md` están marcadas (0 pendientes); las cinco líneas
«FIN DE Lx» y las ocho comprobaciones de persona están fuera del recuento por la regla del ciclo 1, con dueño y destino
escritos. Los cuatro mandatos salen con código 0; las siete mutaciones reproducidas cayeron en rojo y el árbol quedó
sin cambios.

## 1. Ejecución (códigos de salida literales)

| Comando | Salida | Cifras |
|---|---|---|
| `npm test` | **0** | `Test Files 196 passed \| 1 skipped (197)`; `Tests 3101 passed \| 2 skipped (3103)` |
| `npm run typecheck` | **0** | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)` |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 5.106 comprobadas; 0 cabeceras R-1 inválidas; línea base 0 informadas, 0 caducadas; 13 abreviadas rotas informativas |

**Contraste del dato de partida (3.064 y 2 omitidas).** Hoy son **3.101 y 2**: +37 pruebas y +1 fichero. La diferencia es
consistente con la fusión `989bd4e`, que trae las pruebas de `remision-creada-sin-salida` (hipótesis: no las he contado
una a una). Las omitidas son las mismas 2. Ninguna prueba falla.

**Las 13 abreviadas rotas no son de este cambio.** Caen en `CLAUDE.md`, `docs/` y `openspec/specs/`; ninguna está en
`openspec/changes/propagar-top5-lista-remision-creada/`. El detector no las bloquea.

## 2. Completitud

| Dimensión | Resultado |
|---|---|
| Tareas | 94 marcadas, 0 pendientes. Las cinco «FIN DE Lx» (L1.20, L2a.28, L2abis.8, L2b.18, L3.25) y la tabla de personas están fuera, a propósito, con dueño y destino al final de `tasks.md` |
| Requisitos de los deltas | 11: 6 ADDED (RQ-VT-10, RQ-TC-35 a RQ-TC-39) y 5 MODIFIED (RQ-TC-24, RQ-TC-27, RQ-TC-29, RQ-ZS-01, RQ-VT-03) |
| Escenarios | 118: 86 en `tickets-core`, 17 en `vistas-tablero`, 15 en `zoho-sync` |
| Esquema | `schema.sql` gana 3 sentencias `ALTER` (líneas 710, 713 y 714); ningún `process.env` nuevo |

## 3. Matriz de cumplimiento (prueba que pasó y línea que la sostiene)

Todas las pruebas citadas pasan en la corrida completa del apartado 1.

### RQ-TC-35 · propagar al marcar o cambiar — CUMPLE

Implementación: `apps/desk/server/db/prioridadCliente.ts:106-124` (una transacción; lecturas en `:108`, `:110`, `:111`
y `:112`; por ticket cambiado, un `UPDATE` en `:118` y un `INSERT` de traza en `:119`).

| Escenario | Prueba |
|---|---|
| marcar propaga, una traza por ticket | `apps/desk/server/prioridadTop5.test.ts:180` (TC24-14) |
| cambiar la prioridad propaga (S-6) | `apps/desk/server/propagarTop5.test.ts:99` |
| contrato vigente y Top 5 `Low` → `High` | `apps/desk/server/propagarTop5.test.ts:76` |
| sin contrato, un Top 5 más bajo baja (S-5) | `apps/desk/server/propagarTop5.test.ts:84` |
| misma prioridad: ni escritura ni traza ni marca | `apps/desk/server/propagarTop5.test.ts:90` |
| cerrados, otro cliente y sin `client_id` no cambian | `apps/desk/server/propagarTop5.test.ts:41` |
| esperas y `status_type` nulo cuentan (S-3) | `apps/desk/server/propagarTop5.test.ts:49`; contra `getActiveTickets` (H5) en `:56` |
| ticket de Zoho conserva `managed_by_app` | `apps/desk/server/propagarTop5.test.ts:159` |
| si falla una escritura, no cambia nada | `apps/desk/server/propagarTop5Atomica.test.ts:37` y `:43` (por secuencia, ver W-1) |
| sin N+1 | `apps/desk/server/propagarTop5Atomica.test.ts:60` (mismas lecturas con 1 y con 5 tickets) |

### RQ-TC-36 · desmarcar revierte — CUMPLE

| Escenario | Prueba |
|---|---|
| desmarcar devuelve a la anterior, con traza | `apps/desk/server/prioridadTop5.test.ts:187` (TC24-15) |
| con contrato vigente la calculada es `High` | `packages/shared/src/prioridadPropagada.test.ts:56`; `apps/desk/server/propagarTop5.test.ts:90` |
| nacido bajo Top 5 vuelve a su calculada | `apps/desk/server/trazaTop5AlNacer.test.ts:39` |
| sin prioridad vuelve a no tenerla (`a` nulo) | `apps/desk/server/propagarTop5.test.ts:116`; `packages/shared/src/prioridadPropagada.test.ts:72` |
| varias propagaciones, una reversión | `apps/desk/server/propagarTop5.test.ts:99` |
| ciclo marcar, desmarcar, marcar | `packages/shared/src/prioridadPropagada.test.ts:75` |
| sin base no se toca (S-10) | `apps/desk/server/propagarTop5.test.ts:124`; `apps/desk/server/trazaTop5AlNacer.test.ts:90` |
| una transición no exime (S-4) | `apps/desk/server/propagarTop5.test.ts:108` |
| tras revertir se conserva la marca (S-2) | `apps/desk/server/propagarTop5.test.ts:174` |
| desmarcar a quien nunca fue Top 5 → 200 sin cambios | `apps/desk/server/propagarTop5.test.ts:90` cubre «nada que cambiar»; ver S-3 (no hay una prueba dedicada a un cliente sin fila) |

### RQ-TC-37 · la exención — CUMPLE

La exención sale de `cambioPorTop5` (`packages/shared/src/prioridadPropagada.ts:44`) y de `esAjusteManual`
(`packages/shared/src/prioridadPropagada.ts:24`), que falla cerrado: sólo cuentan como Top 5 los tres orígenes de la
lista. Pruebas: ajuste antes de marcar, exento sin marca `apps/desk/server/propagarTop5.test.ts:142`; posición frente
al filtro de abiertos `:65`; origen desconocido y vacío `:151`; ajuste después de propagar
`packages/shared/src/prioridadPropagada.test.ts:59`; filas anteriores con origen NULL `apps/desk/server/propagarTop5.test.ts:33`
y `:151`; ticket con sólo trazas del Top 5, no exento `packages/shared/src/prioridadPropagada.test.ts:42`.

### RQ-TC-38 · origen, alta bajo Top 5 y esquema — CUMPLE (con D-1 documentado)

Esquema en `packages/zoho-sync/src/db/schema.sql:713` y `:714`, calificado y al final. Traza al nacer en
`apps/desk/server/services/equipoNuevo.ts:90` (misma transacción, tras `createTicket`, antes de `asociarOV`); la base la
calcula `baseSiNaceBajoTop5` (`apps/desk/server/db/prioridadCliente.ts:130`) y se pasa en
`apps/desk/server/services/ticketService.ts:108`.

| Escenario | Prueba |
|---|---|
| nace bajo Top 5 y deja traza | `apps/desk/server/trazaTop5AlNacer.test.ts:30` |
| si nace con la pedida, no hay fila | `apps/desk/server/trazaTop5AlNacer.test.ts:84` |
| la base es la pedida aunque el salto lo cause el contrato (D-1) | `apps/desk/server/trazaTop5AlNacer.test.ts:55` |
| sin Top 5, sin traza | `apps/desk/server/trazaTop5AlNacer.test.ts:62` y `:70` |
| un fallo posterior no deja la fila | `apps/desk/server/trazaTop5AlNacer.test.ts:126` (por secuencia, ver W-1) |
| la lectura muestra el origen | `apps/desk/server/trazaTop5AlNacer.test.ts:100` |
| columna nueva, filas previas y `a` nulo | `apps/desk/server/propagarTop5.test.ts:33` |
| sentencias calificadas y al final; guardián rojo si se ensucia | `packages/zoho-sync/src/db/migrate.test.ts:332` y `:374`; ver apartado 6 |

**D-1 (manda el diseño sobre la spec original):** el delta ya está alineado y lo declara en su propio texto como
supuesto del orquestador del 2026-10-04, no letra de Gerencia. Es reversible y queda como pregunta de bandeja. No es
defecto.

### RQ-TC-39 · lo que no hacen — CUMPLE

No tocan estado, `ticket_transitions`, `managed_by_app` ni `modified_time`: `apps/desk/server/propagarTop5.test.ts:159`
(el `UPDATE` de `apps/desk/server/db/prioridadCliente.ts:118` sólo escribe `priority`, `prioridad_en_app_at` y
`updated_at`). Un Top 5 previo no propaga solo: `apps/desk/server/propagarTop5.test.ts:132`. `ajustarPrioridad` sigue con
la marca vieja (`apps/desk/server/db/prioridadCliente.ts:93`) y su fila queda con origen NULL
(`apps/desk/server/propagarTop5.test.ts:186`).

### RQ-TC-24, RQ-TC-27 y RQ-TC-29 (MODIFIED) — CUMPLEN

- RQ-TC-24: las altas con contrato y Top 5 siguen en `apps/desk/server/services/ticketService.test.ts:1154` y `:1160`
  (el diff de este cambio no las toca). Los escenarios invertidos S-1 y S-9 son
  `apps/desk/server/prioridadTop5.test.ts:180` y `:187`.
- RQ-TC-27: la respuesta lleva el recuento (`apps/desk/server/propagarTop5.test.ts:197`); el cuerpo no dirige la
  propagación (`:204`); 403 y 422/404 no propagan (`:211` y `:218`). El orden 403 antes de 422 sigue en
  `apps/desk/server/routes/prioridad.ts:40` (permiso) frente a `:42` (contenido). Fila y tickets van juntos:
  `apps/desk/server/propagarTop5Atomica.test.ts:43`.
- RQ-TC-29: la fila manual lleva origen vacío y exime: `apps/desk/server/propagarTop5.test.ts:186` y `:142`.

### RQ-ZS-01 (MODIFIED) · marca por fila de la prioridad — CUMPLE

Implementación: `packages/zoho-sync/src/db/repo.ts:76-78`; la guarda de fila entera, `:71`, sigue primera.

| Escenario | Prueba |
|---|---|
| con la marca no pisa `priority`, el resto sí | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:24` |
| sin la marca manda Zoho | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:56` |
| las dos marcas son independientes | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:34` y `:44` |
| `managed_by_app` sigue primero | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:62` |
| `upsertTicket` nunca escribe la marca | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:71` |
| la marca no entra en `TICKET_COLS` | `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts:78` |
| sobrevive a la pasada siguiente y tras revertir | `apps/desk/server/propagarTop5.test.ts:174` |
| sin relleno de filas previas | `packages/zoho-sync/src/db/migrate.test.ts:754` |

### RQ-VT-10 · lista de «Remisión creada» — CUMPLE

Implementación: `apps/desk/server/db/listaRemisionCreada.ts:13-16`, la ruta `apps/desk/server/routes/prioridad.ts:92`
(`requireAuth`) y el orden `packages/shared/src/listaPorEntrada.ts:10-16`.

| Escenario | Prueba |
|---|---|
| el más antiguo primero | `apps/desk/server/listaRemisionCreada.test.ts:39` |
| varias entradas: cuenta la última | `apps/desk/server/listaRemisionCreada.test.ts:49` |
| una entrada a otro estado no cuenta | `apps/desk/server/listaRemisionCreada.test.ts:57` |
| mismo instante que la alarma (H5) | `apps/desk/server/listaRemisionCreada.test.ts:97` |
| sin entrada, al final y sin omitirse | `apps/desk/server/listaRemisionCreada.test.ts:65`; `packages/shared/src/listaPorEntrada.test.ts:14` |
| con o sin orden de venta; sólo ese estado | `apps/desk/server/listaRemisionCreada.test.ts:87` y `:92` |
| la prioridad no cambia el orden | `apps/desk/server/listaRemisionCreada.test.ts:79` |
| empates por número | `apps/desk/server/listaRemisionCreada.test.ts:73` |
| cualquier sesión la lee; sin sesión 401 | `apps/desk/server/listaRemisionCreada.test.ts:108` |
| sin N+1 | `apps/desk/server/listaRemisionCreada.test.ts:118` |
| la vista del cliente no reordena | `apps/desk/src/lib/boardView.test.ts:152` |
| «Habilitar Servicio» sigue guardado por el servidor | `apps/desk/server/listaRemisionCreada.test.ts:141` (guarda en `apps/desk/server/services/ticketService.ts:129`) |
| la pantalla se verifica a mano | Comprobación de persona nº 5, fuera del recuento; `.tsx` fuera de la red por decisión de Gerencia |

### RQ-VT-03 (MODIFIED) — CUMPLE

Las siete claves tienen su `case`: `apps/desk/src/lib/boardView.test.ts:162-173`. Si alguien quita el `case`, además del
rojo de la prueba falla la compilación por la guarda `never` de `boardView.ts` (mutación M12 de apply-progress).

## 4. Mutaciones reproducidas por el verificador

Con `mut.mjs` (aplica, corre, restaura y comprueba). Tras las siete, `git status --short` salió **vacío**
(restaurado = true en todas).

| # | Mutación (fichero) | Pruebas corridas | Qué cayó |
|---|---|---|---|
| M3 · **POSICIÓN** (regla 1) | `routes/prioridad.ts`: propagar justo ANTES de la guarda de permiso | `propagarTop5.test.ts`, `prioridadTop5.test.ts` | **7 failed \| 56 passed.** «403 con tickets que propagar», «422 y 404 no propagan», «devuelve ticketsCambiados», «cambiar la prioridad… (S-6)», TC27-3, TC27-5 y TC27-6 |
| M4 · atómica | `apps/desk/server/db/prioridadCliente.ts:108`: `fijarPrioridadCliente(q, a)` pasa a `(db, a)` | `propagarTop5Atomica.test.ts` | **3 failed \| 1 passed.** Las dos de atomicidad y la del recuento de lecturas; sólo sobrevive «sin fallo cierra en COMMIT» |
| M6 | `packages/shared/src/prioridadPropagada.ts:44`: borrar la línea de exención manual | `prioridadPropagada.test.ts`, `propagarTop5.test.ts` | **5 failed \| 52 passed.** Exención antes/después, origen desconocido, posición frente al filtro de abiertos, vecino y origen vacío |
| ML2 (D-2) | `apps/desk/server/services/equipoNuevo.ts:90`: la traza por `db` en vez de `q` | `trazaTop5AlNacer.test.ts` | **1 failed \| 12 passed.** La de atomicidad del alta (aparece `pool:INSERT`) |
| P1 · estado erróneo | `apps/desk/server/db/listaRemisionCreada.ts:15`: el estado pasado a `entradasActuales` se fija a Notificado | `listaRemisionCreada.test.ts` | **7 failed \| 5 passed.** RC-1 a RC-6 y RC-9 (H5) |
| R1 | `packages/zoho-sync/src/db/repo.ts:78`: el nombre de columna `priority` se cambia por `prioridad` | `repoPrioridadEnApp.test.ts` | **3 failed \| 4 passed.** Las tres que ejercitan la marca |
| M9 · fichero vigilado (regla 2) | `schema.sql`: se añade una `ALTER TABLE public.tickets ADD COLUMN` extra | `migrate.test.ts` | **3 failed \| 47 passed.** «toda ALTER TABLE apunta a una tabla clasificada» (`packages/zoho-sync/src/db/migrate.test.ts:332`), «son 53 ALTER» (`packages/zoho-sync/src/db/migrate.test.ts:374`) y el recuento posicional |

**M4 nacía verde y discrimina:** sin la mutación, 4 de 4 verdes; con ella, 3 rojas. **M3 confirma el orden de la guarda**
(permiso antes de propagar), que apply-progress declara como regla de mutación 1.

## 5. Regla invariable 13, decisión a decisión (cliente → línea del servidor)

| Decisión del cliente | Línea del servidor que la impone | ¿Probada? |
|---|---|---|
| `apps/desk/src/App.tsx:69` pide `/api/remision-creada` cuando la vista es `remision_creada` | `apps/desk/server/routes/prioridad.ts:92`; contenido en `apps/desk/server/db/listaRemisionCreada.ts:14` y orden en `:16` (`shared`) | Sí: `apps/desk/server/listaRemisionCreada.test.ts:39` a `:79` |
| `apps/desk/src/lib/boardView.ts:53` devuelve la lista tal como llega, sin filtrar ni reordenar | Orden y contenido: `apps/desk/server/db/listaRemisionCreada.ts:13-16` | Sí: `apps/desk/src/lib/boardView.test.ts:152` |
| `apps/desk/src/lib/boardView.ts:15` y `apps/desk/src/components/Sidebar.tsx:10`: etiqueta de la vista | Nada que imponer: es navegación; no concede permiso. «Habilitar Servicio» lo guarda `apps/desk/server/services/ticketService.ts:129` | Sí: `apps/desk/server/listaRemisionCreada.test.ts:141` (403 por área) |
| `apps/desk/src/components/Top5Panel.tsx:28` enseña «N tickets abiertos actualizados» | El recuento lo devuelve `apps/desk/server/db/prioridadCliente.ts:122` | Sí: `apps/desk/server/propagarTop5.test.ts:197` |
| `apps/desk/src/components/PanelPrioridad.tsx:55` enseña «sin prioridad» si `a` es nulo | `ajustesDelTicket` devuelve `null`, no la cadena `"null"` (`apps/desk/server/db/prioridadCliente.ts:81`) | Sí: `apps/desk/server/trazaTop5AlNacer.test.ts:100` |
| `apps/desk/src/api/client.ts:713` y `:715`: tipos con `ticketsCambiados?` y `origen?` | Sólo describen la respuesta; no deciden | n/a |
| Preexistente, no de este cambio: `apps/desk/src/components/Top5Panel.tsx:20` oculta los controles sin `puedeFijarPrioridadTop5` | `apps/desk/server/routes/prioridad.ts:40` (403) | Sí: TC27-3, que cae bajo M3 |

**Ninguna decisión del cliente queda sin línea del servidor.** El cliente no calcula ni la base, ni la prioridad
calculada, ni el tiempo transcurrido (D13: no se pinta). Cada espejo cumple el punto 3 de la regla: la imposición del
servidor está probada.

## 6. Regla dura del esquema (topología de dos esquemas)

- `packages/zoho-sync/src/db/schema.sql:710`, `ALTER TABLE tickets …` **sin calificar**: correcto, `tickets` es de `DESK_TABLES` y las sentencias de
  Desk van sin calificar (nota de IV-6 en `CLAUDE.md`).
- `packages/zoho-sync/src/db/schema.sql:713` y `:714`, `ALTER TABLE public.prioridad_ajustes …` **calificadas**: correcto, es de `PUBLIC_TABLES`.
- Ninguna es un `CREATE` y ninguna rellena filas (`packages/zoho-sync/src/db/migrate.test.ts:754`).
- Guardián (`packages/zoho-sync/src/db/migrate.test.ts:332`, `:374` y el posicional de `:652`): cuenta 53 `ALTER` (29 calificadas y 24 sin
  calificar), exige que las sin calificar sólo sean de `tickets`, `equipos` y `contacts`, e incluye
  `public.prioridad_ajustes` entre las calificadas. **Regla de mutación 2 reproducida con M9:** se ensució el fichero
  vigilado y el guardián se puso rojo en tres sitios.

## 7. Coherencia con el diseño

| Decisión | Código | Veredicto |
|---|---|---|
| Una transacción con lecturas fijas | `apps/desk/server/db/prioridadCliente.ts:107-123` | Conforme |
| Fórmula única en `shared` (`prioridadAlNacer`) | `packages/shared/src/prioridadPropagada.ts:36-50` | Conforme: sin segunda implementación |
| No tocar `modified_time` (no marcar como no leído) | `apps/desk/server/db/prioridadCliente.ts:118` | Conforme; `apps/desk/server/propagarTop5.test.ts:159` |
| Falla cerrado ante un origen desconocido | `packages/shared/src/prioridadPropagada.ts:24` | Conforme |
| D-1 (base = pedida) y D-2 (traza en la transacción del ticket) | `apps/desk/server/services/equipoNuevo.ts:90`; `apps/desk/server/services/ticketService.ts:108` | Conforme; ML2 lo demuestra |
| Cero netas en ficheros muy citados | `repo.ts`, `boardView.ts`, `ticketService.ts`, `equipoNuevo.ts`, `App.tsx`, `Sidebar.tsx` | Conforme: entran y salen las mismas líneas |

## 8. Hallazgos

### CRITICAL
Ninguno.

### WARNING

- **W-1 · La atomicidad se prueba por secuencia, no por efecto sobre filas.** `pg-mem` no revierte, así que
  `apps/desk/server/propagarTop5Atomica.test.ts:37`, `:43` y `apps/desk/server/trazaTop5AlNacer.test.ts:126` demuestran
  que cada escritura va por la transacción, que acaba en `ROLLBACK` y que nada va por el pool; no que las filas
  vuelvan a su valor. El límite está declarado en apply-progress y M4 y ML2 prueban que discrimina, pero el escenario
  de la spec dice «no cambian la fila, ningún ticket ni la traza». La cobertura real exige Postgres de verdad
  (aceptación con servicios reales, F1F-03).
- **W-2 · Cifra de pruebas distinta del dato de partida.** Hoy 3.101 y 2 omitidas, no 3.064. Explicación probable: la
  fusión `989bd4e` (hipótesis). Este verificador corrió el árbol tal como está en `65a7595`; si se necesita la cifra propia
  del cambio, hay que contarla sobre `49582af`.
- **W-3 · La fila IV-11 de `CLAUDE.md` sigue cierta pero incompleta.** Habla de la orden de venta y no dice que la misma
  zona de `repo.ts` protege ya la prioridad. apply-progress lo deja anotado para el archivo; se recoge aquí para que no
  se pierda. Aparte, las 13 abreviadas rotas del detector no las provoca este cambio.

### SUGGESTION

- **S-1 · Carrera entre el ajuste manual y la propagación.** `apps/desk/server/db/prioridadCliente.ts:110` y `:111` leen
  tickets y trazas sin `FOR UPDATE`; un ajuste manual confirmado entre esa lectura y el `UPDATE` de `:118` podría perder
  su exención (hipótesis: no probado; exige concurrencia real y Postgres). Probabilidad baja.
- **S-2 · Mutaciones no reproducidas.** Quedan fuera de esta pasada ML1, ML3 a ML7, M5, M7, M10, M11 y M12; las declara
  apply-progress con su literal y su restauración por `cmp`. Las siete reproducidas cubren posición (M3, P1),
  atomicidad (M4, ML2), exención (M6), sincronizador (R1) y fichero vigilado (M9). P2 sobrevive y es un equivalente
  (filtrar y ordenar conmutan), como declara apply-progress.
- **S-3 · Falta una prueba dedicada a «desmarcar a quien nunca fue Top 5».** El escenario de RQ-TC-36 pide un cliente sin
  fila y un `top5: false` con 200; lo más cercano son `apps/desk/server/propagarTop5.test.ts:90` (sin cambios al desmarcar
  con la misma prioridad) y `:124` (sin base no se toca). Probablemente basta, pero conviene una prueba de una línea.

## 9. Lo que no se verifica a propósito

- `.tsx` (`App.tsx`, `Sidebar.tsx`, `Top5Panel.tsx`, `PanelPrioridad.tsx`): fuera de la red de pruebas por decisión de
  Gerencia (F0-00). No se registra como carencia. Su efecto visible queda en las comprobaciones de persona 1 a 7.
- Comprobaciones de persona (dueño Comercial; la nº 8, Gerencia) y la fusión a `main`: fuera del recuento; archivar no
  las da por hechas.
- El barrido de citas de la regla de mutación 4 sobre los ficheros tocados está hecho en apply-progress (clases A, B y
  C); el detector sale con 0 y 0 cabeceras R-1 inválidas.

## 10. Siguiente paso

`sdd-archive`. Sin CRITICAL. El orquestador numera la corrección del maestro (M1.9.1) y las preguntas E-nueva-1 a
E-nueva-6 y D-1 en la bandeja, y completa la fila IV-11 de `CLAUDE.md` al archivar, como indica apply-progress.

## 11. Contraste y remediación del orquestador (2026-10-04, mismo intento)

- **W-2, cerrado: la cifra cuadra.** La fusión `989bd4e` trae la tanda F1B-03, que añade 37 pruebas (de 2.954 a 2.991,
  medido en su rama y en `main` tras fusionarla). 3.064 más 37 son las 3.101 que cuenta este informe.
- **S-3, remediado.** El escenario «desmarcar a quien nunca fue Top 5» de RQ-TC-36 tiene ya prueba propia, añadida al
  FINAL de `apps/desk/server/propagarTop5.test.ts` para no mover ninguna línea citada. Es de caracterización: nace
  verde, y no tiene mutante que la distinga de sus vecinas (sin Top 5 y sin base, la fórmula devuelve la prioridad que
  el ticket ya tiene). Con ella la suite pasa a 3.102 pruebas.
- **Mutaciones reproducidas por el orquestador**, además de las siete del verificador: M6 (5 caen de 57), P1 (7 caen de
  12) y una variante de M9 que quita el esquema a la `ALTER` de `prioridad_ajustes` (3 caen de 50). Las tres
  restauradas y comprobadas; el árbol queda sin cambios de código.
- **Códigos de salida vistos por el orquestador antes de asentar:** pruebas, typecheck, lint (165 avisos, 0 errores) y
  detector, los cuatro con salida 0.
- **W-1, W-3 y S-1 siguen abiertos** y van al informe de archivo: W-1 espera la aceptación con servicios reales; W-3
  se resuelve al archivar; S-1 es hipótesis y va a la bandeja.
