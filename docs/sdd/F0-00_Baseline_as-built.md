# F0-00 · Baseline as-built de Desk 2.0

| Dato | Valor |
|---|---|
| Tanda | **F0-00 — Auditoría del as-built** |
| Fase | Fase 0 — Cimientos SDD (plan R01.1, §3, S37) |
| Plan de referencia | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` |
| Documento maestro de referencia | R08.1 (`docs/Manifesto/…_R08.1.docx`; leído en conversión Markdown fuera del repo, ver observación Engram #216) |
| Fecha del documento | 2026-09-08 |
| Commit auditado | **`a3a8f03`** — verificado con `git rev-parse --short HEAD` el 2026-09-08; coincide con el commit que leyó la R04/R08.1 (M1.3), luego no hay deriva |
| Sesión de auditoría | 2026-09-07 y 2026-09-08 (sesión Engram `f0-00-auditoria-as-built-2026-09-07`) |
| Observaciones Engram | #215 (mapa), #216 (decisiones de preflight), #217 (motor de flujo), #218 (zoho-sync), #219 (interfaz), #220 (esquema de datos), #221 (superpowers), #222 (deuda), #223 (pruebas y build) |
| Alcance de escritura | Ninguno. No se modificó código, no se escribió en base de datos ni en Zoho, no se hizo commit |

---

## 1. Resumen ejecutivo

Se auditaron siete frentes del repositorio `C:\dev\Desk_2_R1.023` al commit `a3a8f03`: motor de flujo, esquema de datos, sincronización con Zoho, interfaz, pruebas y build, deuda técnica e histórico de diseño. Seis frentes salen en **CONSERVAR** y uno —la interfaz— en **REFACTORIZAR**. Ninguno sale en **REHACER**: la Fase 1 puede construirse sobre el repo actual, como decidió Gerencia el 07/09/2026.

Cuatro cosas que un lector con prisa tiene que saber:

1. **Las cifras del as-built del maestro son exactas.** 34 transiciones, 21 estados, 27 etiquetas de campo mapeadas, 4 estados de espera con una sola salida, 1 estado terminal, 3 etapas que proponen derivación: todas verificadas una a una contra `packages/shared/src/transitions.ts:171-256`. La única cifra que falla es del propio maestro: «Diez de las 34 transiciones son compartidas por dos áreas» (M1.9.1) debe decir **ocho**.

2. **La corrección C1 sigue abierta y no tiene ninguna prueba.** `apps/desk/server/transitionExec.ts:63-70` procesa la rama del checkbox con `continue` antes del chequeo de campo obligatorio. La única prueba de obligatorios (`apps/desk/server/transitionExec.test.ts:82-86`) usa un campo de texto, nunca una casilla. Bajo `strict_tdd`, **F1A-01 no puede arrancar en rojo**: hay que escribir la prueba que falla antes de tocar el código.

3. **La red de pruebas es amplia pero no exhaustiva, y la interfaz entera queda fuera de ella por construcción.** 96 ficheros, 830 tests, `typecheck`/`lint`/`test`/`build` en verde al commit auditado. Pero 22 de las 34 transiciones no se citan en ninguna prueba, no hay ningún invariante de grafo, no hay matriz área×transición, y los 39 ficheros `.tsx` (6.329 líneas) de `apps/desk/src` no tienen ninguna prueba porque `vitest.config.ts:14,16-19` los excluye (`environment: 'node'`, patrones solo `.test.ts`). La cobertura numérica **no se midió**: no hay proveedor instalado y medirla exigía modificar el repositorio.

4. **Dos afirmaciones del Anexo H no resisten la lectura del código.** La fila M7 dice que «trece indicadores se calculan hoy sobre la tabla de tickets»: los 11 indicadores calculados del Anexo G.6 **no tienen ninguna fórmula** en `apps/desk` ni en `packages/*`. La fila M11 dice que la conexión Zoho→PostgreSQL es «vía MCP»: es un cliente REST propio con OAuth2 refresh-token, y no existe ningún uso de MCP en el repositorio.

---

## 2. Tabla de veredictos por frente

| Frente | Veredicto | Justificación en una frase | Observación Engram |
|---|---|---|---|
| (a) Motor de flujo | **CONSERVAR** | El grafo, los permisos por área, la ejecución, el enganche de la remisión y los avisos son internamente coherentes y fieles al as-is documentado; las seis anomalías de la R04 son propiedades heredadas del blueprint de Zoho, no errores de implementación. | #217 |
| (b) Esquema de datos | **CONSERVAR** | El esquema implementa casi literalmente los diseños de los Subsistemas A/B/E/F y del catálogo maestro, y la topología de dos esquemas (`desk`/`public`) es deliberada y está documentada en el propio código. | #220 |
| (c) Sincronización Zoho | **CONSERVAR** | «Zoho de solo lectura» y «las dos entradas no se cruzan» están verificadas en código, con una única escritura de negocio gateada; los puntos débiles son deuda conocida, no motivo de rehacer. | #218 |
| (d) Interfaz | **REFACTORIZAR** | La estructura es funcional y coherente con el resto del as-built, pero acumula defectos concretos —prioridad sin traducir en cuatro vistas, dos etiquetas en inglés, un mapa de colores muerto y una regla de «espera» divergente del motor— que se propagan a cada pantalla nueva que reutilice esos módulos. | #219 |
| (e) Pruebas y build | **CONSERVAR** | 96 ficheros y 830 tests en verde, ciclo focalizado de 792 ms y un CI que corre las cuatro puertas contra un PostgreSQL real: es base sobre la que construir, y lo que falta es exhaustividad, no existencia. | #223 |
| (f) Deuda | **CONSERVAR** | Más del 90 % de los puntos de `debt.md` verificados coinciden con el código; sus dos defectos de fondo son una ruta desactualizada y una entrada ya corregida por la auditoría de sincronización. | #222 |
| (g) Histórico de diseño (Superpowers) | **CONSERVAR** | De 52 diseños, 44 coinciden con el código y los 8 desactualizados tienen causa identificable y trazable; es materia prima destilable para F0-02, no archivo a rehacer. | #221 |

---

## 3. Hallazgos por frente

Los hallazgos **en negrita** bloquean o condicionan una tanda concreta, nombrada al final de cada uno.

### 3.a Motor de flujo (#217) — CONSERVAR

Ficheros canónicos auditados: `packages/shared/src/transitions.ts` (328 líneas), `apps/desk/server/transitionExec.ts` (84), `apps/desk/server/db/estadoPorRemision.ts` (61), `packages/shared/src/permissions.ts` (7), `apps/desk/server/services/ticketService.ts` (182), `apps/desk/server/services/avisoArea.ts` (21).

**a.1 — Las cifras del as-built se confirman una a una.** `packages/shared/src/transitions.ts:171-256` contiene exactamente **34** entradas en `TRANSICIONES_BASE`, contadas de una en una. Los `from`/`to` de esas 34 entradas dan exactamente **21** estados distintos. **27** etiquetas de campo (`customField`/`ordenVenta`) distintas se usan entre las 34. `DERIVACION_POR_DEFECTO` (`transitions.ts:267-275`) tiene exactamente **3** entradas.

**a.2 — Las 38 «filas» de M1.3.7 se explican.** «Habilitar Servicio» (`transitions.ts:178`) es UNA transición cuyo `from` es un array de tres estados (`STATUS_OV_ASIGNADA`, `STATUS_TICKET_CREADO`, `STATUS_REMISION_CREADA`), todos con destino `Ingresado`. 34 − 1 + 3 + 2 pasos sin botón = 38.

**a.3 — Los dos pasos sin botón existen y son reversibles.** `apps/desk/server/db/estadoPorRemision.ts:36-61`: `sincronizarEstadoPorRemision` cuenta remisiones confirmadas (`estado = 'ok' OR estado = 'ok_con_avisos'`, `anulada_at IS NULL`, líneas 44-47), decide destino (:49) y aplica `TRANSICION_REMISION_CONFIRMADA` o `TRANSICION_RETIRADA` (:52-60).

**a.4 — La regla invariable 7 («las dos entradas no se cruzan») está implementada literalmente.** `estadoPorRemision.ts:41` corta con `return` antes de tocar nada si el estado no es `Ticket creado` ni `Remisión creada`.

**a.5 — `Finalizado` es el único estado sin salida.** Comprobado buscando cada uno de los 21 estados como `from` entre las 34 transiciones (`transitions.ts:178-255`).

**a.6 — Los cuatro estados de espera tienen exactamente una salida cada uno y ninguna caducidad.** `En Espera de Repuestos` → `llegada_repuestos` (:196); `Solicitado` → `entrega_repuestos` (:204); `Servicio externo` → `retorno_servicio_externo` (:228); `En espera de SKU inventario` → `notif_cliente_sku` (:212). No hay ningún `setInterval` ni cron de caducidad en `apps/desk/server`.

**a.7 — C1 sigue abierto (Anexo D punto 33, `debt.md` M-2, corrección C1).** `apps/desk/server/transitionExec.ts:63-68` procesa `f.kind === 'checkbox'` y hace `continue` incondicional (asigna `asBool(raw)`, que es `false` si `raw` es `undefined`) **antes** de que la línea 70 (`if (f.required && empty) { errors.push(...) }`) pueda evaluar ese campo. El único checkbox con `required: true` en las 34 transiciones es `cfCheck('Liberación del ticket sin facturar', true)` (`transitions.ts:247`). → **Bloquea F1A-01.**

**a.8 — El ciclo `Por Facturar` ⇄ `Por Entregar / Sin facturar` sobreescribe la fecha, sin guarda (corrección C4).** `liberacion_sin_factura` (`transitions.ts:246-247`) y `entrega_sin_factura` (`transitions.ts:248-249`, escribe «Fecha Remisión de Salida») forman el ciclo. `buildTransitionPlan` (`transitionExec.ts:75-77`) asigna `plan.columns[col.col]` sin comprobar valor previo, y `writeTransition` (`packages/zoho-sync/src/db/repo.ts:274`) emite un `SET` plano. Cada vuelta pisa la fecha. → **Condiciona F1C-02.**

**a.9 — No existe atributo de tipo de evento (corrección C5).** `interface Transition` (`transitions.ts:55-62`) sólo declara `id, name, from, to, area, fields`. → Condiciona F1C-04.

**a.10 — El borrado de administrador destruye la tabla de auditoría (Anexo D punto 36, M11.4).** `apps/desk/server/db/eliminarTicket.ts:45-56` incluye `ticket_transitions` (línea 53) entre las nueve tablas hijas que borra, además de la cabecera (líneas 154-161). Guardado por prefijo `app-` **y** `managed_by_app` (:116), luego sólo aplica a tickets nacidos en la app; para esos el borrado es total e irreversible.

**a.11 — La ventana de pérdida de aviso existe y está documentada en el propio código.** `apps/desk/server/services/ticketService.ts:115-122` y `:145-153`: el aviso se escribe después de `applyTransition` (línea 113) y fuera de su transacción.

**a.12 — La traza es automática en fecha/hora y real en persona.** `packages/zoho-sync/src/db/schema.sql:57-61` declara `ticket_transitions.performed_at timestamptz NOT NULL DEFAULT now()`. `performed_by` recibe el `actor` (`repo.ts:283-286`), que en `ticketService.ts:111` es `user.name ?? TRANSITION_ACTOR`; el único invocador real (`apps/desk/server/routes/tickets.ts:193`) pasa `req.user!`, cuyo `name` es `NOT NULL` en el esquema (`schema.sql:85`). El fallback a `'Equipo Técnico'` (`apps/desk/server/transitionActor.ts:3`) no se dispara en la ruta HTTP de producción. No hay ningún endpoint PATCH/PUT que cambie `status` a mano: la «vía de escape manual» es hoy edición directa de base de datos.

**a.13 — Los permisos son sólo por área; el administrador cortocircuita.** `packages/shared/src/permissions.ts:4-7` (`canExecuteTransition`): `if (isAdmin) return true`, si no exige intersección de áreas. `apps/desk/server/auth/middleware.ts:32-35` (`requireArea`) exige `isAdmin || areas.length > 0`. Búsquedas de `cargo ===`, `derivado_a ===`, `propietario`, `owner_id ===` en `apps/desk/server` no encuentran ninguna comprobación de autorización por cargo ni por propietario. Confirma M1.9.1 / C10 / Anexo D punto 39. → Condiciona F1C-05.

**a.14 — Ningún comentario puede declararse obligatorio.** `comment()` (`transitions.ts:73-74`) no acepta parámetros y devuelve siempre `required: false`; las 34 entradas lo usan sin argumentos. Coincide con la regla invariable 4 del plan (§4.4).

**a.15 — Regla de flujo fuera de los ficheros canónicos: el filtro «en espera» del tablero.** `apps/desk/src/lib/boardView.ts:35` define `const enEspera = (t: Ticket) => /espera/i.test(t.status ?? '')`, usado por las vistas «abiertos» (:43) y «espera» (:44). Es una clasificación independiente del grafo canónico y no importa nada de `transitions.ts`. De los 4 estados de espera reales, sólo dos contienen la subcadena «espera»: **«Solicitado» y «Servicio externo» caen en «Tickets abiertos»**. El test `apps/desk/src/lib/boardView.test.ts:11,21` usa «En espera de repuesto», que sí encaja, y nunca ejercita los dos que fallan. **Hallazgo nuevo, no registrado en el Anexo D.** Contradice la regla invariable 1 de §4.4 («ninguna regla de flujo vive en la interfaz»).

**a.16 — Corrección factual al maestro: ocho, no diez.** Recuento exhaustivo de `area` compuesta en las 34 entradas: `Comercial / Compras` en `llegada_repuestos` (:196), `aprobacion_y_repuestos` (:198), `notif_por_garantia` (:208), `rechazo_garantia` (:214), `solicitud_sku` (:216) = 5; `Comercial / Servicio Técnico` en `rechazo_comercial` (:234), `rechazo_cliente` (:236), `rechazo_revision` (:238) = 3. **Total 8.** M1.9.1 dice diez.

**a.17 — Desvíos menores respecto a `docs/blueprint-servicio-tecnico.md`.** «Orden de Venta» aparece como obligatoria en la fila 1 del blueprint, pero `createManagedTicket` (`ticketService.ts:53-58`) no la incluye en su lista de obligatorios (consistente con que el punto está «EN EVALUACIÓN» en §1.8). Los campos «Adjuntar archivos», «Fecha de vencimiento» y «Resolución» de las filas 9, 11, 19, 23, 24 y 33 no existen en las 34 transiciones; la omisión es deliberada y está documentada en `transitions.ts:168`.

**a.18 — No verificado en esta pasada.** La decisión de §1.8 «las transiciones clave alimentan automáticamente la hoja de vida del equipo» quedó fuera del alcance de los seis ficheros canónicos de flujo y **no se verificó** en el frente (a). Se cubre parcialmente desde el frente (g) — ver 3.g.

### 3.b Esquema de datos (#220) — CONSERVAR

**b.1 — Ausencia total de claves foráneas.** Grep exhaustivo de `REFERENCES` en `packages/zoho-sync/src/**/*.sql` → **0 resultados**. Ninguna tabla del proyecto declara FK: ni `tickets↔equipos`, ni `catalogo_modelos↔catalogo_marcas`, ni `remisiones↔tickets`. La integridad se sostiene sólo en los repositorios de acceso (comentario propio en `schema.sql:68` y `:390`). El diseño de Subsistema A sí las especificaba (`docs/superpowers/specs/2026-06-04-subsistema-a-modelo-datos-design.md:40-98`). Impacto documentado con dos incidentes reales en `debt.md:421-431`. **Desvío no registrado en el Anexo H ni en el Anexo D.**

**b.2 — Los 11 indicadores calculados del Anexo G.6 no tienen ninguna fórmula en el repositorio.** Columnas 47, 48, 49, 50, 51, 53, 54, 56, 57, 58, 59 (permanencia, inicio de servicio, diagnóstico, servicio ×2, recogida, cumplimiento del tiempo promesa, bodegaje de ingreso, cotización, orden de compra, orden de venta): grep exhaustivo de sus nombres sólo devuelve resultados en `docs/analisis-tickets/*` y documentación, nunca en `apps/desk` ni `packages/*`. Sólo están almacenadas las 16 fechas de hito de G.5 y `dias_entrega`. → **Contradice el Anexo H.4 fila M7.** Condiciona F1A-04 y la spec `kpis`.

**b.3 — Columnas del Anexo G sin columna en `tickets`.** Col 3 «Correo electrónico» y col 4 «Contact Name» viven en `contacts` (modelo relacional, no duplicación); col 12 «Hora de actualización del estado» es derivable de `MAX(ticket_transitions.performed_at)` pero no está materializada; col 13 «Hora de reapertura» no tiene columna ni lógica localizada; col 16 «Número de comentarios» sólo es calculable con `COUNT` sobre `conversations`; **col 55 «Calificación de satisfacción» no existe** ni en `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:83-123`) ni en `schema.sql`, y el grep no la encuentra en ningún punto del código.

**b.4 — Columnas en `tickets` que no están en las 59 del Anexo G.** `client_id`, `salesorder_id` (`schema.sql:185-187`); `equipo_id` (`:206`); `derivado_a` (`:123`); `resolution_html`, `resolution_at`, `resolution_by` (`:228-230`); `channel`; los siete checkboxes de proceso (`equipo_partes_listas`, `archivo_trazabilidad_actualizado`, `doc_almacenada_drive`, `hv_actualizada`, `liberacion_sin_facturar`, `servicio_in_situ`, `cumple_condiciones_comerciales`); las de control (`managed_by_app`, `source`, `raw`, `synced_at`, `created_at`, `updated_at`, `custom_fields jsonb`); y las relaciones normalizadas `contact_id`, `account_id`, `assignee_id`.

**b.5 — Dos fechas «final» sin correlato documental.** `fecha_orden_compra_final` y `fecha_orden_venta_final` (`packages/zoho-sync/src/db/rows.ts:115-116`) existen en el código y no aparecen en el Anexo G ni en ningún otro punto del maestro leído. Su origen y uso **no están verificados**.

**b.6 — Dos esquemas físicos, con precedente de fallo real.** `reorgToDeskStatements` (`packages/zoho-sync/src/db/migrate.ts:52-63`) mueve `accounts, contacts, agents, tickets, conversations, attachments, ticket_transitions, ticket_history, activities, equipos` a `desk.*` cuando `config.dbSchema === 'desk'` (`packages/zoho-sync/src/config.ts:87`). El catálogo (`catalogo_*`), `remisiones*`, `resolution_attachments`, `avisos`, `users`, `roles` y `sessions` se quedan deliberadamente en `public`. `schema.sql:390-391` documenta que `catalogo_articulos` aterrizó una vez en el esquema equivocado por un `CREATE` sin calificar y hubo que moverla a mano en producción.

**b.7 — `remisiones_entrada` no es una tabla de este repositorio.** Ver §7 (punto abierto P14).

**b.8 — Migración de histórico parcialmente ejecutada y sin registrar.** `apps/desk/server/db/remisionesHistoricasSeed.ts` importó 149 remisiones (2025-01-29 a 2026-07-24) desde `docs/remisiones/Entrada.xlsx`; es la única migración de histórico documental verificada en código. No hay ningún importador de tickets previos a Desk 2.0. Relacionado con el Anexo D punto 8, sin registro en el Anexo H.

**b.9 — `books.items`, `books.invoices` y `books.purchase_orders` no llegan a `desk-db`.** Sólo existen en `apps/hub-sync`. `catalogo_articulos` referencia `item_id` de `books.items`; el bloqueo está documentado en el diseño del catálogo (2026-08-06, «Fuera de alcance») y en `debt.md:403-404`. **Nota:** el frente (f) verifica que este bloqueo **ya se resolvió** en producción (1428 artículos replicados, `debt.md:288-305`) — ver 3.f.

### 3.c Sincronización con Zoho (#218) — CONSERVAR

**c.1 — «Zoho es de solo lectura» (regla invariable 6) está verificada.** Sólo existen dos escrituras hacia dominios Zoho en todo el monorepo, verificado por grep exhaustivo: (1) `apps/desk/server/routes/tickets.ts:203`, `POST /tickets/:id/sendReply`, gateada por `guardWrites` (`tickets.ts:27-33`, aplicado en `:196`) y con `ENABLE_WRITES=false` en el despliegue documentado (`DEPLOY.md:46`, activación manual en `:56-58`); (2) `packages/zoho-sync/src/tokenManager.ts:25`, refresco de token OAuth, que es infraestructura y no dato de negocio. Transiciones y creación de tickets se migraron a Postgres puro en los Subsistemas B/C (`ticketService.ts:63-68,113`).

**c.2 — «Vía MCP» es falso.** No hay ningún uso de Model Context Protocol en el repositorio (grep sin resultados). Es un cliente REST propio con OAuth2 refresh-token (`zohoClient.ts`, `tokenManager.ts`) contra `desk.zoho.com/api/v1` y `www.zohoapis.com`. → **Contradice M11.1 y el Anexo H.4 fila M11.**

**c.3 — Cadencia confirmada: 3 minutos.** `SYNC_INTERVAL_MS` por defecto 180000 ms (`packages/zoho-sync/src/config.ts:88`).

**c.4 — Hay DOS lectores independientes de Zoho Desk.** El scheduler arranca en `apps/desk/server/index.ts:81-90` **y** en `apps/hub-sync/src/hubSync.ts:75-97`; ambos procesos llaman a Zoho Desk por separado para tickets y actividades cada ciclo. El backfill inicial también corre por duplicado (`index.ts:58-67` y `apps/hub-sync/src/hubSync.ts:11-72`). Doble consumo de cuota de API, no documentado en el maestro.

**c.5 — `syncRecent` no usa marca de agua real.** `packages/zoho-sync/src/sync.ts:170-174` trae sólo la página 1 de 100 ordenada por `-recentThread`.

**c.6 — El alcance de la sincronización es mayor que el declarado.** Además de tickets, órdenes de venta y contactos (M11.1), se sincronizan tickets archivados, detalle de ticket, conversaciones y adjuntos, historial de blueprint, actividades, agentes y cuentas; y en el hub, el catálogo Books completo (ítems, facturas, pagos, órdenes de compra) y 8 módulos de CRM. Todas las tablas llevan columna `raw jsonb`.

**c.7 — Sólo 4 tablas se replican del hub a `desk-db`.** `contacts`, `activities`, `clients` (vista sobre `books.contacts`) y `sales_orders`, vía replicación lógica de Postgres. `tickets`, `accounts`, `agents`, `conversations` e `history` siguen sincronizándose de forma independiente en cada proceso.

**c.8 — El guard de `managed_by_app` no es atómico en `tickets` ni en `contacts`.** Se escribe en `writeTransition` (`packages/zoho-sync/src/db/repo.ts:271`, incondicional en cualquier transición ejecutada desde Desk) y en `createTicket` (`repo.ts:386`). Se respeta con `SELECT` + early-return en `upsertTicket` (`repo.ts:56-60`) y `upsertContact` (`repo.ts:19-21`) — TOCTOU; en cambio `upsertAccount` (`repo.ts:8-16`) sí usa un `WHERE accounts.managed_by_app = false` atómico dentro del `ON CONFLICT`. Inconsistencia entre tablas, limitada en pruebas por `pg-mem`.

**c.9 — Documentos de referencia desactualizados.** `docs/blueprint-servicio-tecnico.md:163-166` describe un diseño que escribía en Zoho vía Blueprint API, abandonado por los Subsistemas B/C, y **no está marcado como obsoleto**. `docs/migracion-zoho-roadmap.md` dice «Próximo: diseñar el subsistema A» cuando A, B y C ya están implementados. `DEPLOY.md` no menciona `apps/hub-sync` ni la topología de dos bases.

**c.10 — El Anexo D punto 44 no tiene ningún código, ni gateado ni no gateado.** No existe ninguna escritura hacia CRM para precargar repuestos en un borrador de cotización.

### 3.d Interfaz (#219) — REFACTORIZAR

**d.1 — No hay router.** `react-router` no está en `package.json` ni se usa; no hay `BrowserRouter`, `useNavigate` ni `history.pushState`. Las 13 «pantallas» son overlays controlados por booleanos de `useState` dentro de `apps/desk/src/App.tsx`, sin URL propia, sin deep-linking y sin historial de navegador.

**d.2 — Reparto réplica/prototipo.** Réplicas de Zoho Desk: vista principal (`KanbanBoard.tsx:5`, `TicketList.tsx:10`, `TicketTable.tsx:15`), ficha de ticket (`TicketDetailView.tsx:37`, con comentario propio en `:95-100`), actividades (`ActividadesPage.tsx:15`, parcial) y los sub-paneles `TransitionPanel.tsx:38`, `TicketProperties.tsx:93`, `HistoriaPanel.tsx:17`, `ResolucionPanel.tsx:7`, `ActividadesPanel.tsx:10`, `Adjuntos.tsx:13`. Prototipos propios: `Login.tsx:4`, `CreateTicket.tsx:7`, `UsersAdmin.tsx:5`, `RolesAdmin.tsx:5`, `Configuracion.tsx:25`, `EquiposAdmin.tsx:15`, `CatalogoEquipos.tsx:41`, `Analisis.tsx:70`, `ClientesPage.tsx:17`, `RemisionesPage.tsx:132`, y los paneles `HojaDeVida.tsx:145`, `PanelRemisiones.tsx:111`, `CrearRemision.tsx:16`, `EliminarTicket.tsx:14`.

**d.3 — La prioridad del ticket nunca se traduce.** `apps/desk/src/board.ts:32-34` (columnas del modo «prioridad» del Kanban), `TicketProperties.tsx:179`, `TicketTable.tsx:35` y —el más visible— **`CreateTicket.tsx:306`, el desplegable de alta que ofrece «High»/«Medium»/«Low» en inglés al técnico**. Existe `traducirPrioridad` (`apps/desk/src/lib/actividades.ts:14-18`), pero cubre el vocabulario de Activities (`highest/high/normal/low/lowest`), no el de Tickets, y sólo se usa en `ActividadesPanel.tsx:20` y `ActividadesPage.tsx:47`. Contradice la regla invariable 12 (§4.4).

**d.4 — Canal (`channel`) tampoco se traduce.** `TicketProperties.tsx:180`, `TicketTable.tsx:43`.

**d.5 — Dos ítems de menú en inglés.** `apps/desk/src/components/Sidebar.tsx:125-126`: «Views created by me» y «Views shared to me». Hoy son secciones deshabilitadas (comentario propio en `Sidebar.tsx:4`).

**d.6 — Mapa de colores muerto.** `apps/desk/src/components/TicketCard.tsx:14-23` usa claves en MAYÚSCULAS (`'INGRESADO'`, `'COMERCIAL'`) que nunca casan contra los strings reales de estado (mixtos, p. ej. `"Ingresado"`); cae siempre al `default` (`:26`). El texto se muestra correcto; el estilo de color nunca se aplica. Reconfirmado desde el frente (a).

**d.7 — Reglas de dominio en el cliente.** Además de `boardView.ts:35` (ver a.15), `apps/desk/src/lib/valoresTransicion.ts:3-17` documenta en su propio comentario que es «una regla de negocio, no maquetado» —qué fecha corresponde a qué campo de transición— y explica que vive en el cliente porque «el repo no tiene harness de componentes React». No duplica el grafo ni los permisos, pero es una regla de dominio que sólo existe client-side. **Contraejemplo correcto:** `apps/desk/src/lib/botonRemision.ts:2,30-31` consume `puedeCrearRemisionDeEntrada` importado de `@ambientalia/shared` en vez de reimplementar el criterio.

**d.8 — Ninguna de las siete skills de UI instaladas tiene evidencia de uso.** Sin dependencias de shadcn/radix/`class-variance-authority`/`clsx`/`tailwind-merge` en `package.json` raíz ni en `apps/desk/package.json`; sin directorio `components/ui`; sin `DESIGN.md` de proyecto (sólo el ejemplo dentro de `.agent/skills/design-md/examples/`); sin referencias a Remotion, Stitch ni «enhance-prompt» en `apps/`. Lo que hay es React 19 + Vite + TailwindCSS 3.4 en utilidades planas con clases arbitrarias (`bg-[#2C7BE5]`, `text-[13px]`) repetidas a mano en decenas de ficheros.

**d.9 — Sin atomic design ni container/presentational estricto.** Páginas grandes que mezclan fetch, estado y JSX (`App.tsx`, `TicketDetailView.tsx`, `CreateTicket.tsx`, `CatalogoEquipos.tsx`), con separación pragmática vía `lib/*.ts` (funciones puras testeadas) y un puñado de componentes de presentación reutilizables (`TicketCard`, `ClienteLink`, `ReadToggle`, `Pagination`, `KanbanBoard`).

**d.10 — El resto de la interfaz sí cumple el español.** La inmensa mayoría de la UI está en español con vocabulario de negocio adaptado, verificado en los ficheros leídos.

### 3.e Pruebas y build (#223) — CONSERVAR

**e.1 — Los cuatro comandos salen en verde al commit auditado.** `npm run typecheck` → salida 0, sin ninguna línea de diagnóstico. `npm run lint` → salida 0 con `✖ 158 problems (0 errors, 158 warnings)` en 35 ficheros (157 `@typescript-eslint/no-explicit-any` + 1 `react-hooks/exhaustive-deps`); el `any` está degradado a `warn` a propósito en `eslint.config.js:24-26`. `npm test` → salida 0, `Test Files 95 passed | 1 skipped (96)`, `Tests 828 passed | 2 skipped (830)`, 40,45 s. `npm run build` → salida 0, 101 módulos, bundle 349,40 kB (gzip 102,51 kB); `dist` está en `.gitignore:11`, luego no crea ningún fichero versionado.

**e.2 — 96 ficheros de prueba, coincide exacto con §2.4 del plan.** Reparto: `apps/desk` 52 (37 servidor + 15 cliente), `packages/zoho-sync` 32, `packages/shared` 11, `apps/hub-sync` 1. Cero ficheros `*.test.tsx`, cero `*.spec.*`.

**e.3 — La interfaz entera está fuera de la red de pruebas, por construcción.** 39 ficheros `.tsx` / **6.329 líneas** en `apps/desk/src` sin ninguna prueba. `vitest.config.ts:16-19` incluye sólo `apps/**/*.test.ts` y `packages/**/*.test.ts`; `vitest.config.ts:14` fija `environment: 'node'`; no están instalados `jsdom` ni `@testing-library`. Entre lo no cubierto hay lógica de decisión: **`apps/desk/src/components/TransitionPanel.tsx:57` aplica `canExecuteTransition(user.areas, user.isAdmin, t.area)` en el cliente** — la mitad cliente del modelo de autorización, sin ninguna prueba que la toque. → **Condiciona F0-04 y F1C-05.**

**e.4 — 22 de las 34 transiciones no se citan en ninguna prueba.** Recuento exacto cruzando los 34 `id` de `packages/shared/src/transitions.ts:178-255` contra todos los `*.test.ts` del repositorio. Las 22: `cal_sensores_proceso`, `cal_sensores_revision`, `diagnostico_complementario`, `entrega_al_cliente`, `entrega_repuestos`, `entrega_sin_factura`, `habilitado_para_entrega`, `liberacion_sin_factura`, `llegada_repuestos`, `marcar_pendiente`, `notif_cliente_comercial`, `notif_cliente_sku`, `notif_por_garantia`, `notif_recotizacion`, `rechazo_comercial`, `rechazo_garantia`, `rechazo_revision`, `retorno_servicio_externo`, `servicio_externo_notificado`, `servicio_externo_pendiente`, `solicitud_repuestos`, `solicitud_sku`. **Incluyen las cuatro salidas únicas de los cuatro estados de espera y las dos ramas del ciclo de facturación.** → **Condiciona F0-04, F1C-02 y F1C-03.**

**e.5 — Ninguna prueba fija los invariantes del grafo.** `packages/shared/src/transitions.test.ts:25-27` es lo más cercano, pero comprueba `transitionsForStatus('Finalizado') === []` bajo el título «estado desconocido no habilita transiciones»: prueba el caso equivocado. Añadir un estado sin salida, o perder una transición al editar el array, no rompe ninguna prueba. → **Condiciona F0-04 y F1B-06.**

**e.6 — El defecto C1 no tiene ninguna prueba, ni que lo fije ni que lo denuncie.** La prueba de obligatorios `apps/desk/server/transitionExec.test.ts:82-86` usa `ingreso_a_servicio` y el campo de texto «Código Servicio», nunca una casilla. → **Bloquea F1A-01 bajo `strict_tdd`.**

**e.7 — Permisos sin matriz área×transición y middleware sin prueba directa.** `permissions.test.ts:13-26` prueba `canExecuteTransition` con cuatro casos sintéticos; `app.test.ts:1806/1813` prueba una sola transición real (`aprobacion`, área Comercial). No hay ninguna prueba que recorra las 34 comprobando que un usuario de un área sólo puede ejecutar las suyas. `requireAuth`/`requireAdmin`/`requireArea` (`apps/desk/server/auth/middleware.ts:14-35`) no se importan en ningún `*.test.ts`. → **Condiciona F0-04 y F1C-05.**

**e.8 — La traza obligatoria se comprueba en una sola transición.** `apps/desk/server/app.test.ts:1793` verifica `performed_by === 'Admin'` para `aprobacion`; no hay prueba de que las 34 dejen fila en `ticket_transitions`. → Condiciona F1B-05.

**e.9 — `estadoPorRemision.ts` y `ticketService.ts` no tienen fichero de prueba propio.** No existe `estadoPorRemision.test.ts`; `sincronizarEstadoPorRemision` sólo se ejercita de refilón desde `app.test.ts:2421` vía `apps/desk/server/routes/remision.ts:282,292,320`. La guarda de no-cruce (`estadoPorRemision.ts:41`), que es la regla invariable 7, no tiene prueba que la nombre. `executeTransition` (`ticketService.ts:74-181`) y `createManagedTicket` (`:20-71`) sólo se prueban por HTTP.

**e.10 — La única prueba contra PostgreSQL real se salta en local, pero sí corre en CI.** `packages/zoho-sync/src/db/migrate.integration.test.ts:5-6` (`const d = url ? describe : describe.skip`). En local todo corre sobre `pg-mem`, cuyo dialecto no implementa el `ON CONFLICT … WHERE` atómico de `upsertAccount`.

**e.11 — La cobertura numérica no es medible sin modificar el repositorio.** `vitest.config.ts` no declara sección `coverage`; `@vitest/coverage-v8` no está en `node_modules` y `package-lock.json` no lo contiene. **No se midió y no se estima ninguna cifra.**

**e.12 — CI existe y es correcto.** Único workflow: `.github/workflows/ci.yml` (33 líneas), job `verify` sobre `ubuntu-latest`, Node 22, con `postgres:17` adjunto y `TEST_DATABASE_URL` (`ci.yml:29-30`); ejecuta `npm ci`, `typecheck`, `lint`, `test`, `build`. Disparadores: `pull_request` a `main` y `push` a `main`. No hay GitLab CI, Jenkinsfile, Azure Pipelines, CircleCI ni ganchos de git. **Le falta:** techo de avisos (`ci.yml:27` corre `npm run lint` sin `--max-warnings`), publicación de cobertura y cualquier prueba de interfaz.

**e.13 — `app.test.ts` concentra el 90 % del tiempo de la suite.** `apps/desk/server/app.test.ts`: 3010 líneas, 185 tests, **36,435 s** de los 40,45 s totales. Medido: la suite sin ese fichero (94 ficheros, 643 tests) tarda **11,41 s**. → **Tarea concreta para F0-04.**

**e.14 — `strict_tdd` es viable desde el día uno.** Ciclo focalizado del motor (`transitions` + `permissions` + `transitionExec`, 3 ficheros, 26 tests): **792 ms**. Cero intermitencias en tres ejecuciones. `vitest.config.ts:7` fija `process.env.TZ = 'UTC'` a propósito. La infraestructura (vitest 3.2.6, pg-mem 3.0.14, supertest 7.2.2, CI con Postgres real) ya existe.

**e.15 — Cinco capacidades de §2.3 sin ninguna prueba, y las cinco por falta de código.** `transitions-equipo-nuevo`, `transitions-soporte-remoto`, `diagnostico-checklist`, `informes`, `kpis`. `grep -i "bodegaje|OTD|lead_time|leadTime"` sobre `apps` y `packages` devuelve **cero** resultados. El único rastro de las dos ramas es `packages/shared/src/ticketCreate.ts:5` (`CLASIFICACIONES`, tres etiquetas). **Aviso contra confusión:** `db/checklistRemision.test.ts` y `db/remisionChecklist.test.ts` cubren la lista de accesorios de la remisión de entrada, **no** el catálogo fase→macro→subnivel→ítem de F1D-01.

### 3.f Deuda (#222) — CONSERVAR

**f.1 — Más del 90 % de `debt.md` (903 líneas) coincide con el código.** Reclasificación completa en §5.

**f.2 — Contradicción con el frente (c): `managed_by_app`.** `debt.md:626-630` (I-1) afirma que «nada pone `managed_by_app=true` aún». Es falso desde el Subsistema B (2026-06-04): `packages/zoho-sync/src/db/repo.ts:271,283-286,386`. **Gana el código.** El riesgo real subsistente es sólo el TOCTOU del `SELECT` + early-return, de ventana corta, no la ausencia total de la marca.

**f.3 — Ruta desactualizada en M-4.** `debt.md` cita `server/books/sync.ts`; el código real vive en `packages/zoho-sync/src/booksHub/sync.ts:124` (`if (wm && lmt <= wm) { reachedOld = true; break }`) tras la reorganización a monorepo. No es contradicción de fondo, es de ubicación.

**f.4 — Contradicción interna de `debt.md`.** El bloque «RESUELTO esta sesión» (líneas 18-26) da por cerrado el gate por área de `/api/tickets/:id/reply`, pero §3d (línea 660) sigue describiéndolo como abierto. El propio archivo declara que el header manda sobre las secciones numeradas (línea 10).

**f.5 — El guard anti-drift `DESK_TABLES`↔`schema.sql` no existe como prueba.** `packages/zoho-sync/src/db/migrate.integration.test.ts` no contiene ninguna referencia a `DESK_TABLES` (grep sin resultados). `debt.md` lo da por existente o sugerido. **Hallazgo nuevo.** → Condiciona F0-04.

**f.6 — `getEquipo` sin filtro `active` (M-9) dejó de ser riesgo teórico.** Confirmado vigente en `apps/desk/server/db/equipos.ts:75-78`; y desde que `apps/desk/src/components/EquiposAdmin.tsx:31-34` (`toggleActive`/`setEquipoActive`) permite dar de baja equipos desde la interfaz, un equipo desactivado **sí puede usarse hoy** para crear un ticket si se conoce su id. → Condiciona F1B.

**f.7 — El bloqueo de `books.items` ya está resuelto en producción.** 1428 artículos replicados (`debt.md:288-305`). Lo que se arrastra es sólo la población de accesorios en 26 de 35 modelos (`debt.md:174-183,237-239`), que es contenido, no motor. → **Abarata F1D-06.**

**f.8 — El roadmap de catálogo y accesorios está mayormente ejecutado.** El rediseño «Artículos por modelo» (2026-08-10/11) resolvió de facto dos entradas de roadmap que siguen redactadas como pendientes (`debt.md:91-97` y `:247-284`). Si F0-02 destila las specs de `hojas-vida`/`inventario-lectura` desde `debt.md` sin cruzar esto, describiría trabajo hecho como pendiente. → **Condiciona F0-02.**

**f.9 — Código real sin registro en ningún documento.** `apps/desk/server/db/remisionesHistoricas.ts` (`importarRemisionesHistoricas`) no figura ni en `debt.md` ni en el maestro R08.1.

**f.10 — Sólo hay webhooks salientes.** `avisosWebhook.ts` y `remisionWebhook.ts` hacia n8n; ningún webhook entrante de Zoho Desk. Confirmado en código.

**f.11 — Rotación de secretos: alta prioridad, sin dueño ni fecha, y ausente del Anexo D.** `debt.md:29-31`: `ZOHO_CLIENT_SECRET`, refresh tokens de Desk/Books/CRM, password `hub_reader`, dos PAT de GitHub. No aparece en ninguna tanda F1A–F1F del plan.

### 3.g Histórico de diseño · Superpowers (#221) — CONSERVAR

**g.1 — Los conteos declarados en §2.4 del plan son exactos.** **52** ficheros en `docs/superpowers/specs/*-design.md` y **60** en `docs/superpowers/plans/*.md`, ambos del 2026-06-02 al 2026-08-12, verificados con Glob.

**g.2 — Emparejamiento.** 45 planes emparejan 1:1 por fecha y tema con un diseño; 2 casos son 1 diseño → 2 planes (`books-rico-node` → A-ingesta / B-derivación; `avisos-por-correo` → avisos-cambio-de-area / avisos-por-correo-entrega-2); 1 caso con nombre ligeramente distinto (`zoho-hub-sync-independizacion` → `…-etapa1`); **7 planes huérfanos** sin diseño propio; **1 diseño sin plan** (`2026-08-10-articulos-por-modelo-design.md`, en estado «propuesta, pendiente del visto bueno»).

**g.3 — 44 de 52 diseños coinciden con el código; 8 están desactualizados.** Detalle completo en §6.

**g.4 — Los diseños de 06-05 subestimaron sistemáticamente los tickets heredados de Zoho.** El mismo patrón aparece dos veces: la historia del ticket (corregida por `historia-unificada-ticket-design.md`, 08-05, implementada en `apps/desk/server/db/historial.ts`) y la hoja de vida del equipo (corregida sólo en el código, `apps/desk/server/db/equipos.ts:260-292`, con comentario explícito «Y las etapas que NO pasaron por Desk, reconstruidas desde la historia de Zoho», **sin ningún diseño que lo documente**). → Este segundo caso responde parcialmente el punto no verificado en 3.a.18: las transiciones sí alimentan la hoja de vida, y además ésta fusiona el historial de Zoho.

**g.5 — `CLASES_ARTICULO` diverge del diseño.** `packages/shared/src/types.ts:239` declara `['accesorio', 'consumible_repuesto', 'mano_obra']`; `articulos-por-modelo-design.md` (08-10) diseñaba tres clases separadas (`accesorio | consumible | repuesto`). Dos se fusionaron y una cuarta (`mano_obra`) vino de un diseño posterior (08-12). **Hallazgo no registrado antes.**

**g.6 — §2.3 no tiene ninguna capacidad para «catálogo de equipos».** 7 de los 52 diseños giran en torno a ese dominio (subsistema-e, subsistema-f, catalogo-maestro-equipos y su adéndum de correcciones, ficha-tecnica-modelo, articulos-por-modelo, mano-de-obra-por-modelo) y está en producción con datos reales (26 tipos, 6 marcas, 35 modelos, 354 equipos). Hoy no encaja limpiamente en ninguna de las 14 capacidades nombradas. → **Condiciona F0-02.**

---

## 4. Desvíos respecto al Anexo H

| Fila del Anexo H | Lo que declara | Lo que dice el código (ruta:línea) | Propuesta para el Anexo D |
|---|---|---|---|
| **H.4 · M7 — Analítica y KPIs** | «Parcial: **trece indicadores se calculan hoy** sobre la tabla de tickets (Anexo G)» | Los **11 indicadores calculados del Anexo G.6** (cols. 47, 48, 49, 50, 51, 53, 54, 56, 57, 58, 59) **no tienen ninguna fórmula** en `apps/desk` ni en `packages/*`; grep exhaustivo de sus nombres sólo devuelve `docs/analisis-tickets/*`. Sólo están almacenadas las 16 fechas de hito de G.5 y `dias_entrega` (`packages/zoho-sync/src/db/rows.ts:83-123`) | Corregir la fila M7: si esos indicadores se calculan, es **fuera** de Desk 2.0 (Zoho Analytics u hoja de cálculo). Punto abierto nuevo: dónde vive hoy el cálculo y quién lo hereda en la Fase 2 |
| **H.4 · M11 — Arquitectura** | «Conexión Zoho → PostgreSQL **vía MCP** operativa» | Cliente REST propio con OAuth2 refresh-token: `packages/zoho-sync/src/zohoClient.ts`, `tokenManager.ts` contra `desk.zoho.com/api/v1` y `www.zohoapis.com`. Grep de MCP en todo el repo: 0 resultados | Corregir M11.1 y H.4 fila M11: «cliente REST propio con OAuth2, no MCP» |
| **H.4 · M11 — Arquitectura** | Describe una sola conexión | Topología real de **dos bases** (`zoho-hub-db` + `desk-db`) con replicación lógica de sólo 4 tablas, y **dos ciclos independientes** de lectura directa contra Zoho Desk (`apps/desk/server/index.ts:81-90` y `apps/hub-sync/src/hubSync.ts:75-97`) | Ampliar la fila M11 con la topología y el doble consumo de cuota; punto abierto nuevo sobre si se consolida en un solo lector |
| **H.2 · Servicio técnico** | «Ninguna [diferencia] en el grafo. Las diferencias son de comportamiento y están en H.3» | **Confirmado** en el grafo (34/21 exactos). Pero aparece una regla de flujo fuera del motor: `apps/desk/src/lib/boardView.ts:35` clasifica «en espera» por regex sobre el nombre del estado y falla para «Solicitado» y «Servicio externo» | Punto abierto nuevo o nota bajo C3/M1.3.4: si el filtro debe alinearse con los 4 estados canónicos o si el criterio de negocio de esa vista es otro |
| **H.3 · C1** | «Pendiente. Confirmada la corrección; una línea» | **Confirmado abierto** en `apps/desk/server/transitionExec.ts:63-70`, con su único caso real en `packages/shared/src/transitions.ts:247`. Añadido: **no existe ninguna prueba** que lo cubra (`transitionExec.test.ts:82-86` usa campo de texto) | Sin cambio en H.3; anotar en el punto 33 que el arreglo exige escribir primero la prueba en rojo |
| **H.3 · C4** | «Replanteada en la R08» | Confirmado sin protección: `transitions.ts:246-249`, `transitionExec.ts:75-77`, `packages/zoho-sync/src/db/repo.ts:274` (`SET` plano). Añadido: las dos transiciones del ciclo están entre las 22 sin prueba | Sin cambio en H.3; anotar la ausencia de red de pruebas en el punto 34 |
| **M1.9.1 (texto)** | «**Diez** de las 34 transiciones son compartidas por dos áreas» | **Ocho**: 5 `Comercial / Compras` (`transitions.ts:196,198,208,214,216`) + 3 `Comercial / Servicio Técnico` (`:234,236,238`) | Corrección factual al maestro. No es un desvío del código |
| **Anexo G · col 55** | «Calificación de satisfacción … sólo para reporte trimestral» | No existe en `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:83-123`) ni en `schema.sql`; grep sin resultados en `apps/desk` ni `packages/*` | Anotar en H.5 (fila «Satisfacción del cliente») que el dato **no está replicado** en Desk 2.0 |
| **Anexo G (completo)** | 59 columnas | Dos columnas del código sin correlato documental: `fecha_orden_compra_final` y `fecha_orden_venta_final` (`packages/zoho-sync/src/db/rows.ts:115-116`) | Punto abierto nuevo: confirmar origen y uso antes de decidir si migran o se retiran |
| **M11.4 (auditoría inmutable)** | Exige «tabla inmutable de auditoría para todas las transacciones críticas» | Ausencia **total** de claves foráneas en todo el esquema: grep de `REFERENCES` en `packages/zoho-sync/src/**/*.sql` → 0 resultados, pese a que el diseño de Subsistema A las especificaba (`docs/superpowers/specs/2026-06-04-subsistema-a-modelo-datos-design.md:40-98`) | Punto abierto nuevo o nota bajo M11.4: la integridad referencial se sostiene sólo en el código de acceso |
| **Anexo D · punto 8** | «Definir el mecanismo de migración del historial de Desk 1.0 a Desk 2.0» | Resuelto parcialmente y sin registrar: `apps/desk/server/db/remisionesHistoricasSeed.ts` importó 149 remisiones (2025-01-29 a 2026-07-24) desde `docs/remisiones/Entrada.xlsx`. No hay importador de tickets | Actualizar el punto 8: la parte de remisiones está hecha; lo abierto es el histórico de tickets |
| **Anexo D · punto 14** | «Confirmar si la entrada de `remisiones_entrada` procede de la plataforma de hojas de vida» | **Respondido: no.** Ver §7 | Cerrar la parte técnica del punto 14; abrir la decisión de negocio sobre la doble escritura |
| **Anexo D · punto 44** | Precarga de repuestos en borrador de cotización CRM | **No existe ningún código** que lo intente, ni gateado ni no gateado (grep exhaustivo de escrituras a dominios Zoho: sólo `sendReply` y el refresco de token) | Anotar en el punto 44 que hoy no hay nada que desmontar; la decisión es de construcción, no de retirada |
| **Anexo H (alcance)** | No cubre la capa de interfaz | 39 ficheros `.tsx` / 6.329 líneas sin ninguna prueba, excluidos por construcción (`vitest.config.ts:14,16-19`), incluido `TransitionPanel.tsx:57` que aplica el filtro de permisos en el cliente | Punto abierto nuevo: si la interfaz entra o no en la red de pruebas (hoy parece olvido y es una elección) |
| **H.3 (alcance)** | Las doce correcciones C1–C12 | Sólo **C1** figura en `debt.md` (como M-2, vía M11.7); C2–C12 no aparecen en absoluto (grep sin resultados sobre «Anulado», «SLA», «QA/QC», «tipo de evento», «bodegaje», «Verificación», «Por Facturar») | No es omisión: son dos inventarios complementarios. Conviene declararlo explícitamente en H.1 para que no se lea como hueco |
| **Documentos de soporte** | `docs/blueprint-servicio-tecnico.md` marcado «Vigente» en §4.7 del plan | `docs/blueprint-servicio-tecnico.md:163-166` describe creación de tickets y transiciones **escribiendo en Zoho** (Blueprint API), abandonado por los Subsistemas B/C. `docs/migracion-zoho-roadmap.md` dice «Próximo: diseñar el subsistema A» con A, B y C ya implementados. `DEPLOY.md` no menciona `apps/hub-sync` | Marcar los tres como parcialmente obsoletos antes de que F0-02 los cite como fuente |

---

## 5. Reclasificación de `debt.md`

Auditoría completa de `debt.md` (903 líneas) contra el código al commit `a3a8f03`, el plan R01.1 (§2.3, Fase 1) y el maestro R08.1 (M11.7, Anexo D, Anexo H.3).

### 5.1 Tabla de reclasificación

| Punto de `debt.md` | Categoría | Evidencia (ruta:línea) | Justificación |
|---|---|---|---|
| Reply sin gate por área (F2-06) | OBSOLETO | `debt.md:18-26` (header) vs `debt.md:660` (§3d) | El header lo da por cerrado (`requireArea` ya gatea `/api/tickets/:id/reply`); §3d quedó sin actualizar. El propio archivo declara que el header manda (`debt.md:10`) |
| `String(err)` crudo (F4-01) | OBSOLETO | `debt.md:18-26` | Cerrado en la auditoría 06-19, con tanda nombrada |
| `/api/admin/*?token=` (F2-02) | OBSOLETO | `debt.md:18-26` | Ídem |
| Re-sync de conversaciones (F3-02) | OBSOLETO | `debt.md:18-26` | Ídem |
| Dedup Books-lite | OBSOLETO | `debt.md:18-26` | Ídem |
| `any` en mapeo (F4-03) | OBSOLETO | `debt.md:18-26` | Ídem |
| rate-limit + helmet | OBSOLETO | `debt.md:18-26` | Ídem |
| CI | OBSOLETO | `.github/workflows/ci.yml` | Construido y verificado en el frente (e) |
| Paginación | OBSOLETO | `debt.md:18-26` | Ídem |
| Refactor de `app.ts` | OBSOLETO | `apps/desk/server/routes/{tickets,directory,equipos,analisis,admin,attachment}.ts` | Implementado exactamente como proponía `f4-02-split-app-design.md` |
| Logging | OBSOLETO | `apps/desk/server/util/logger.ts` | Construido (pino) |
| Caché | OBSOLETO | `debt.md:18-26` | Ídem |
| Test de integración | OBSOLETO | `packages/zoho-sync/src/db/migrate.integration.test.ts` | Construido; corre en CI |
| Modelo de autorización | OBSOLETO | `debt.md:18-26` | Ídem |
| Independizar `zoho-hub-sync` — Etapa 1 | OBSOLETO | Estructura `packages/*` + `apps/*` real | Monorepo y `@algarpibe/zoho-sync` construidos |
| Independizar `zoho-hub-sync` — Etapa 2 | SE-ARRASTRA | — | Separación total de despliegues; sin tanda en F1A–F1F, condicionada a que el hub sume consumidores |
| **Rotación de secretos** | SE-ARRASTRA | `debt.md:29-31` | Alta prioridad declarada, sin fecha ni responsable; no aparece en ninguna tanda del plan ni en el Anexo D |
| F3-03 adjuntos fuera de BD | SE-ARRASTRA | `debt.md:33-36` | Sin tanda; sólo existe `GET /api/admin/measure-attachments` |
| F2-05 token CSRF | NO-APLICA-AL-MVP | `apps/desk/server/auth/routes.ts:11-12` (`sameSite:'lax'`, sin token CSRF en ninguna ruta) | Decisión ya ejecutada, no pendiente |
| R2 calificar queries vs `search_path` | NO-APLICA-AL-MVP | — | Condicional a que `pg-mem` deje de ser harness; F5-02 ya cubre `desk`/`search_path` contra Postgres real en CI |
| Renombrar/fusionar marcas y modelos | OBSOLETO | Comprobación 2026-08-07: 0 filas duplicadas | Catálogo cerrado, sin «Otro…» |
| Ficha técnica: SKU validado | OBSOLETO | Resuelto 2026-08-10 | — |
| Ficha técnica: límite de subida 500 | OBSOLETO | Resuelto 2026-08-10 | — |
| Ficha sin versionado | NO-APLICA-AL-MVP | — | Decisión explícita de no construirlo |
| Catálogo de equipos — fases siguientes | PARCIALMENTE OBSOLETO + SE-ARRASTRA | `debt.md:91-97`; bloqueo resuelto en `debt.md:288-305` (1428 artículos); pendiente en `debt.md:174-183,237-239` | El bloqueo original (`books.items` ausente en `desk-db`) está resuelto y replicado en producción; se arrastra sólo la población de accesorios en 26 de 35 modelos |
| Equipos sin enlazar | OBSOLETO | Cerrado 2026-08-10 (0 filas NULL) | — |
| Artículos por modelo: censo, migración, Fase 2, copiar/reordenar | OBSOLETO | `debt.md:106-246` | Hecho en producción |
| Gestión de accesorios por marca/modelo | OBSOLETO | `debt.md:247-284` | Superado por «Artículos por modelo»; el bloqueo de `books.items` ya no existe |
| Consumibles y repuestos | OBSOLETO | `debt.md:366-404` | Ídem |
| Remisiones — rama de SALIDA | SE-ARRASTRA | `debt.md:419-420` | Bloqueada por la decisión pendiente sobre dónde se guardan las remisiones de entrada (P14) |
| Borrar ticket a mano: limpieza y huérfana de junio | OBSOLETO | `debt.md:421-445` | Ya ejecutado |
| `POST /api/admin/borrar-ticket` con `dryRun` | SE-ARRASTRA | — | Sin construir. Coincide con el Anexo D punto 36 y M11.4: no es omisión cruzada |
| CONVERSACIONES — papelera de administrador | SE-ARRASTRA | — | Aplazada, sin tanda |
| Backfill de detalle+conversaciones y de serial/código desde el asunto | SE-ARRASTRA | — | Bajo demanda |
| Enlace ticket→equipo | OBSOLETO | 88,9 % recuperado; el resto declarado «no es deuda» | — |
| Webhooks entrantes de Zoho Desk | SE-ARRASTRA | `avisosWebhook.ts`, `remisionWebhook.ts` (ambos salientes hacia n8n) | Confirmado en código: no existe ningún webhook entrante |
| Imágenes inline de emails | SE-ARRASTRA | `apps/desk/src/components/HistoriaPanel.tsx:45` (sólo sanitiza HTML, no reescribe `inlineattachments`) | Confirmado sin proxy |
| Reconciliar `equipos.cliente_nombre` → `client_id` | OBSOLETO | Resuelto al 100 % | — |
| zoho-hub arquitectura (Opción A, write-back SP3/SP4, separación de despliegues, CRM Fase 3) | NO-APLICA-AL-MVP | — | Roadmap post-MVP explícito; el plan sólo contempla la política de escritura acotada (P44 / F1B-08) |
| I-1 `managed_by_app` atómica | SE-ARRASTRA | `packages/zoho-sync/src/db/repo.ts:56-60` (TOCTOU), `:271,283-286,386` (sí se marca) vs `debt.md:626-630` | **Contradicción**: `debt.md` dice «nada pone `managed_by_app=true` aún»; el código prueba lo contrario desde 2026-06-04. Gana el código. Lo vigente es sólo el TOCTOU |
| I-3 backoff 429 en backfill | SE-ARRASTRA | — | `backfill-details` sí reintenta; el backfill principal no |
| M-1 `status_type` fino | NO-APLICA-AL-MVP | — | Reportería/`kpis` es capacidad de Fase 2 en §2.3 |
| **M-2 checkbox obligatorio** | **CIERRA-EN-F1A (F1A-01, C1)** | `apps/desk/server/transitionExec.ts:63-70`; `packages/shared/src/transitions.ts:247` | Único punto de `debt.md` que el maestro registra explícitamente (M11.7) y único que cierra en una tanda nombrada del plan |
| M-3 enumeración por timing en el login | SE-ARRASTRA | `apps/desk/server/auth/routes.ts:18-22` (el `||` cortocircuita antes de `verifyPassword`) | Confirmado vigente; bajo riesgo, sin tanda |
| M-9 `getEquipo` sin filtro `active` | SE-ARRASTRA | `apps/desk/server/db/equipos.ts:75-78`; `apps/desk/src/components/EquiposAdmin.tsx:31-34` | Confirmado vigente, y **ya no es teórico**: existe la UI de baja lógica, luego un equipo desactivado puede usarse para crear un ticket si se conoce su id |
| M-10 dedup del parser de la semilla | NO-APLICA-AL-MVP | — | Siembra de una sola vez, catálogo cerrado, sin re-siembra prevista |
| M-14 PATCH `serial` vacío | SE-ARRASTRA | `apps/desk/server/routes/equipos.ts:71` (sólo `trim()`) | Confirmado vigente |
| M-5 escapar comodines de búsqueda | SE-ARRASTRA | — | **No reverificado en código** en esta pasada; bajo riesgo, sin tanda |
| M-12 zona horaria en `due_date` | NO-APLICA-AL-MVP | `apps/desk/src/board.ts:68` | Confirmado presente; vistas finas son Fase 2, bajo impacto |
| `config.syncBooks` sin uso | SE-ARRASTRA | `packages/zoho-sync/src/config.ts:91` (sólo referenciado por su propio test) | Limpieza cosmética pendiente |
| **Guard anti-drift `DESK_TABLES`↔`schema.sql`** | SE-ARRASTRA | `packages/zoho-sync/src/db/migrate.integration.test.ts` (grep de `DESK_TABLES` sin resultados) | **Hallazgo nuevo**: el guard que `debt.md` da por existente o sugerido **no está construido** como prueba automática |
| M-4 marca de agua `<=` en `syncRecent` | SE-ARRASTRA | Real: `packages/zoho-sync/src/booksHub/sync.ts:124`; `debt.md` cita `server/books/sync.ts` | Confirmado en código, con **ruta desactualizada** en `debt.md` tras el reorg a monorepo |
| M-6 gap de número en rollback | NO-APLICA-AL-MVP | — | Aceptado por diseño; trade-off estándar de secuencias Postgres |
| M-7 prioridad / tipo de servicio / clasificaciones sin whitelist | SE-ARRASTRA | `apps/desk/server/services/ticketService.ts:50-58` (sólo `prefijo` se valida contra `PREFIJOS`) | Confirmado vigente |
| M-8 `buildCodigoServicio` con fecha local | SE-ARRASTRA | `packages/shared/src/ticketCreate.ts:7-9` (getters locales) | Confirmado vigente |
| M-11 «vence hoy» excluye lo ya vencido | NO-APLICA-AL-MVP | `apps/desk/src/board.ts:68` | Confirmado fiel al diseño; sin bug |
| M-13 cobertura de ramas | SE-ARRASTRA | — | Mejora de pruebas, sin tanda |
| `listEquiposManage` ordenado por `serial` | NO-APLICA-AL-MVP | — | Cosmético |
| M-15 paginación en la UI de gestión de equipos | POSIBLE OBSOLETO, **sin confirmar** | `apps/desk/src/components/EquiposAdmin.tsx` (estado `page`); `apps/desk/server/routes/equipos.ts:142-152` (acepta `limit`/`offset`) | Sugiere que se implementó tras escribirse la entrada; **no se verificó** el wrapper `listEquiposManage` de `api/client.ts` |
| §4 rotar Zoho Client Secret | SE-ARRASTRA | `debt.md:29-31` | Duplicado de «rotación de secretos» |
| §4 frescura de conversaciones | SE-ARRASTRA | — | Duplicado parcial de «webhooks entrantes» |
| §4 remisión huérfana por fotos | OBSOLETO | Resuelto 08-05/08-06 | — |
| §4 `POST /api/remisiones` no deduplica | OBSOLETO | Resuelto 08-05/08-06 | — |
| §4 reenvío en estado error | OBSOLETO | Resuelto 08-05/08-06 | — |
| §4 reply 500 tras enviar el correo | OBSOLETO | Resuelto 08-05/08-06 | — |
| `users.role_id` sin FK | NO-APLICA-AL-MVP | — | Coherente con la ausencia total de FKs del esquema (hallazgo b.1) |
| Subsistema D — correo propio | NO-APLICA-AL-MVP | — | Fuera del MVP |

### 5.2 Conteos por categoría

| Categoría | Conteo |
|---|---|
| CIERRA-EN-F1A | **1** (M-2 / C1 → F1A-01) |
| CIERRA-EN-F1C | **0** (ninguna de las C2–C12 del maestro está registrada en `debt.md`) |
| OBSOLETO | **~26** |
| SE-ARRASTRA | **~22** |
| NO-APLICA-AL-MVP | **~11** |

Los conteos llevan «~» porque algunas entradas de `debt.md` son compuestas (un roadmap con varias fases dentro de una misma entrada) y admiten más de un recuento razonable. La tabla de 5.1 es la fuente; los conteos son su resumen.

### 5.3 Omisiones cruzadas

**En `debt.md` pero no en el maestro.** Por diseño: M11.7 declara que «la R04 incorpora al documento maestro el único punto [de `debt.md`] con efecto funcional visible» (M-2). Los ~50 puntos restantes —TOCTOU de `managed_by_app`, backoff 429, todo el trabajo de catálogo y artículos por modelo, arquitectura zoho-hub, rotación de secretos, webhooks, PATCH `serial`, whitelist de campos, guard anti-drift— **no están en el maestro y no es omisión**: son dos documentos con propósitos distintos (deuda de implementación frente a decisiones de negocio pendientes). El más significativo por impacto y por ausencia total en el Anexo D es la **rotación de secretos**: prioridad alta, sin dueño ni fecha en ningún documento.

**En el maestro pero no en `debt.md`.** **Las once correcciones restantes del blueprint —C2 (Anulado), C3 (esperas sin salida), C4 (ciclo facturar↔entregar), C5 (tipo de evento), C6 (QA/QC), C7 (esperas y SLA), C8 (traducción de estados), C9 (bodegajes), C10 (permisos por cargo), C11 (SLA de Notificado) y C12 (salidas de Verificación)— no aparecen en `debt.md` en absoluto.** Grep exhaustivo sobre «Anulado», «SLA», «QA/QC», «tipo de evento», «bodegaje», «Verificación» y «Por Facturar»: sin resultados. Confirma que `debt.md` es el inventario de deuda de implementación y el Anexo D / H.3 el de correcciones de proceso pendientes de decisión de negocio: complementarios, no solapados.

---

## 6. Índice del histórico de Superpowers

### 6.1 Los 52 diseños (`docs/superpowers/specs/`, orden cronológico)

| Fecha | Fichero | Tema | Capacidad §2.3 | ¿Coincide? |
|---|---|---|---|---|
| 2026-06-02 | `zoho-desk-live-board-design.md` | Tablero leyendo Postgres réplica de Zoho | zoho-sync | **NO** (autodeclarado «SUPERADO» en su cabecera) |
| 2026-06-04 | `subsistema-a-modelo-datos-design.md` | Modelo de datos propio en Postgres, `managed_by_app` | tickets-core | SÍ |
| 2026-06-04 | `subsistema-b-transiciones-postgres-design.md` | Motor de transiciones escribe en Postgres | transitions-st | SÍ (auditado a fondo) |
| 2026-06-04 | `subsistema-h1-auth-usuarios-design.md` | Login correo+contraseña, sesiones, bcrypt | permissions | SUPERFICIAL |
| 2026-06-04 | `subsistema-h2-roles-permisos-design.md` | Roles por área, `canExecuteTransition` | permissions | SÍ (auditado a fondo) |
| 2026-06-04 | `subsistema-i-sync-zoho-books-design.md` | Sync de clientes y OV de Books a tablas propias | zoho-sync | **PARCIAL** |
| 2026-06-04 | `subsistema-c-creacion-tickets-design.md` | Creación de tickets pivotando en OV | tickets-core | SÍ |
| 2026-06-04 | `subsistema-e-registro-equipos-design.md` | Registro de equipos, gate de creación | tickets-core / hojas-vida | SUPERFICIAL |
| 2026-06-04 | `subsistema-vistas-modos-design.md` | Kanban / lista / tabla, modos de vista | tickets-core | SÍ, con la nota del bug de `boardView.ts` |
| 2026-06-05 | `subsistema-f-gestion-equipos-design.md` | Alta, edición y baja de equipos | tickets-core / hojas-vida | SUPERFICIAL |
| 2026-06-05 | `hoja-de-vida-equipo-design.md` | Historial de servicio por equipo | hojas-vida | **PARCIAL** |
| 2026-06-05 | `subsistema-g-analisis-design.md` | Página Análisis, KPIs genéricos | kpis (precursor) | SUPERFICIAL |
| 2026-06-05 | `backfill-serial-codigo-design.md` | Extraer serial y código del asunto | tickets-core | SUPERFICIAL |
| 2026-06-05 | `actividades-ticket-design.md` | Pestaña Actividades = Tasks de Zoho | tickets-core | SUPERFICIAL |
| 2026-06-05 | `resolucion-ticket-design.md` | Registro interno de resolución + imágenes | tickets-core | SUPERFICIAL |
| 2026-06-05 | `historia-ticket-design.md` | Timeline de auditoría del ticket | trazas | **PARCIAL** |
| 2026-06-05 | `clientes-directorio-design.md` | Directorio de contactos y empresas | tickets-core | SUPERFICIAL |
| 2026-06-05 | `clientes-detalle-design.md` | Detalle maestro-detalle de contacto/empresa | tickets-core | SUPERFICIAL |
| 2026-06-05 | `backfill-tickets-archivados-design.md` | Backfill de archivados de Zoho | zoho-sync | SÍ |
| 2026-06-05 | `actividades-vista-global-design.md` | Vista global de todas las tareas | tickets-core | SUPERFICIAL |
| 2026-06-05 | `sidebar-vistas-funcionales-design.md` | Vistas del sidebar filtran el tablero | tickets-core | SÍ, con la misma nota del bug de `boardView.ts` |
| 2026-06-05 | `analisis-paneles-extra-design.md` | Paneles por tipo, clasificación y tiempo | kpis (precursor) | SUPERFICIAL |
| 2026-06-06 | `tickets-contacto-empresa-links-design.md` | Contacto y empresa como enlaces en tarjetas | tickets-core | SUPERFICIAL |
| 2026-06-06 | `tickets-leido-no-leido-design.md` | Leído/no leído por usuario | tickets-core | SUPERFICIAL |
| 2026-06-06 | `zoho-hub-sp1-sync-service-design.md` | Worker `zoho-hub-sync` separado | zoho-sync | SÍ (`apps/hub-sync`) |
| 2026-06-06 | `zoho-hub-sp2-replica-referencia-design.md` | Réplica lógica hub→desk | zoho-sync | **PARCIAL** (el propio doc se autocorrige de 4 a 3 tablas) |
| 2026-06-17 | `zoho-hub-sync-independizacion-design.md` | Monorepo npm workspaces, deploys separados | zoho-sync | SÍ |
| 2026-06-17 | `fix-numeracion-tickets-design.md` | Rango de numeración propio para tickets de app | tickets-core | SUPERFICIAL |
| 2026-06-18 | `books-rico-node-design.md` | Ingesta Books rico en Node (`booksHub/`) | zoho-sync | SÍ |
| 2026-06-18 | `reorg-esquemas-fase1-design.md` | Tablas de Zoho Desk → esquema `desk.*` | zoho-sync | SUPERFICIAL |
| 2026-06-18 | `reorg-esquemas-fase2-design.md` | Vistas `public.clients` / `sales_orders` sobre `books.*` | zoho-sync | SÍ (`schema.sql:169,176`) |
| 2026-06-18 | `crm-hub-fase1-design.md` | Ingesta CRM, 8 módulos a `crm.*` | zoho-sync | SÍ |
| 2026-06-18 | `crm-hub-fase2-design.md` | + Visitas y líneas de Quotes | zoho-sync | SUPERFICIAL |
| 2026-06-18 | `publicar-motor-zoho-sync-design.md` | Publicar `@ambientalia/zoho-sync` completo | zoho-sync | **NO** (declarado descartado por su sucesor) |
| 2026-06-18 | `paquete-lectura-hub-design.md` | `@algarpibe/zoho-sync` delgado, sólo lectura | zoho-sync | SUPERFICIAL (repo externo) |
| 2026-06-18 | `app-prueba-hub-design.md` | `hub-test-app` de validación end-to-end | zoho-sync | SUPERFICIAL (repo externo) |
| 2026-06-19 | `hardening-fase-b-design.md` | Quick wins de seguridad (helmet, rate-limit, error handler) | permissions / trazas | SUPERFICIAL |
| 2026-06-19 | `f3-02-lectura-async-design.md` | Lazy + background al abrir un ticket | zoho-sync | SUPERFICIAL |
| 2026-06-19 | `f3-01-paginacion-design.md` | Paginar tickets cerrados | tickets-core | SUPERFICIAL |
| 2026-06-19 | `f4-02-split-app-design.md` | Partir `app.ts` en routers por dominio | tickets-core (infra) | SÍ |
| 2026-08-04 | `remision-entrada-desenlace-design.md` | Colector n8n, `ok_con_avisos`, workflow de errores | remisiones | SÍ |
| 2026-08-05 | `historia-unificada-ticket-design.md` | HISTORIA fusiona creación + transiciones + Zoho + remisiones | trazas | SÍ (auditado a fondo) |
| 2026-08-05 | `conversaciones-relato-ticket-design.md` | CONVERSACIONES como relato en prosa | trazas | SUPERFICIAL |
| 2026-08-06 | `catalogo-maestro-equipos-design.md` | Catálogo cerrado de tipos, marcas y modelos | hojas-vida (sin capacidad propia) | **PARCIAL** |
| 2026-08-07 | `ficha-tecnica-modelo-design.md` | Fotos y manuales por MODELO, no por unidad | hojas-vida | SUPERFICIAL |
| 2026-08-10 | `articulos-por-modelo-design.md` | Accesorio / consumible / repuesto por modelo desde Books | hojas-vida / inventario-lectura | **PARCIAL** |
| 2026-08-12 | `rol-en-alta-usuario-design.md` | Desplegable de rol en el alta | permissions | SUPERFICIAL |
| 2026-08-12 | `cargo-empresa-en-alta-usuario-design.md` | Cargo y empresa en el alta (servidor) | permissions / trazas | SUPERFICIAL |
| 2026-08-12 | `mano-de-obra-por-modelo-design.md` | Nueva clase `mano_obra` en el catálogo de artículos | hojas-vida | SÍ (`packages/shared/src/types.ts:239`) |
| 2026-08-12 | `avisos-por-correo-design.md` | Avisos por cambio de área + canal de correo (n8n) | derivacion-avisos | SÍ (auditado a fondo, `avisosWebhook.ts`) |
| 2026-08-12 | `editar-usuario-design.md` | Editar nombre, correo, cargo y empresa | permissions | SUPERFICIAL |
| 2026-08-12 | `eliminar-usuario-design.md` | Borrado físico de usuario (sin FKs) | permissions / trazas | SÍ (`auth/routes.ts:129`) |

«SUPERFICIAL» significa que los ficheros y símbolos existen pero no se verificaron línea a línea en esta tanda; no es un veredicto de coincidencia ni de desvío.

### 6.2 Los 7 planes huérfanos (sin diseño propio)

| Fecha | Fichero (`plans/`) | Tema | Capacidad §2.3 | ¿Coincide? |
|---|---|---|---|---|
| 2026-06-19 | `ci-fase-c.md` | GitHub Actions CI (typecheck + lint + test + build) | transversal | SÍ (`.github/workflows/ci.yml`) |
| 2026-06-19 | `f3-05-code-splitting.md` | `React.lazy` de las vistas overlay | transversal | SUPERFICIAL |
| 2026-06-19 | `f4-05-logging.md` | pino + pino-http en el servidor | transversal | SÍ (`apps/desk/server/util/logger.ts`) |
| 2026-06-19 | `f5-02-test-integracion-desk.md` | Test de integración `search_path` / `desk.*` contra Postgres real | zoho-sync (infra) | SUPERFICIAL |
| 2026-06-19 | `nav-header-persistente.md` | Header persistente y sección activa | tickets-core (UI) | SUPERFICIAL |
| 2026-08-05 | `remision-huerfana-fotos.md` | Reintento y reanudación si falla una foto | remisiones | SUPERFICIAL |
| 2026-08-06 | `catalogo-maestro-equipos-correcciones.md` | Correcciones al plan del catálogo | hojas-vida | SÍ (`UNIQUE (marca_id, nombre)` en `schema.sql`) |

Un diseño sin plan: `2026-08-10-articulos-por-modelo-design.md`, en estado «propuesta, pendiente del visto bueno».

### 6.3 Los 8 diseños desactualizados

1. **`zoho-desk-live-board-design.md` (06-02) — NO.** Autodeclarado «SUPERADO» en su propia cabecera desde 2026-06-04: el proyecto giró de «Postgres como réplica» a «Postgres como fuente de verdad» (Subsistemas A–C). El documento se retracta a sí mismo.
2. **`publicar-motor-zoho-sync-design.md` (06-18) — NO.** `paquete-lectura-hub-design.md`, del mismo día, declara: «Supersede: el plan/spec `2026-06-18-publicar-motor-zoho-sync*` (Enfoque C, motor completo) — descartado». No existe publicación de `@ambientalia/zoho-sync` completo; en su lugar está `@algarpibe/zoho-sync`.
3. **`subsistema-i-sync-zoho-books-design.md` (06-04) — PARCIAL.** Diseñaba tablas propias `clients`/`sales_orders` pobladas por un sync dedicado. Hoy son **vistas**: `packages/zoho-sync/src/db/schema.sql:169` (`CREATE OR REPLACE VIEW public.clients AS SELECT contact_id AS id … FROM books.contacts`) y `:176`. El contrato de lectura (`/api/clients`, `/api/sales-orders`) se conserva; el mecanismo de almacenamiento, no.
4. **`zoho-hub-sp2-replica-referencia-design.md` (06-06) — PARCIAL.** El propio documento incluye una «CORRECCIÓN (2026-06-16, durante el cutover)» que reduce el alcance de 4 a 3 tablas replicadas, excluyendo `contacts` porque no era de solo lectura como se asumió (`sync.ts:51`, `ensureContact`/`upsertContact` escriben ahí).
5. **`historia-ticket-design.md` (06-05) — PARCIAL.** Diseñaba `getTicketHistory` con fallback `if hay filas en ticket_history … else ticket_transitions` (nunca las dos). `packages/zoho-sync/src/db/history.ts:22-30` documenta explícitamente que `getZohoHistoryEvents` «NO cae a `ticket_transitions`»; la fusión la hace ahora `apps/desk/server/db/historial.ts`, según el diseño que lo corrige (08-05).
6. **`hoja-de-vida-equipo-design.md` (06-05) — PARCIAL.** Diseñaba la cronología del equipo sólo desde `ticket_transitions`. `apps/desk/server/db/equipos.ts:260-292` fusiona además `ticket_history` («Y las etapas que NO pasaron por Desk, reconstruidas desde la historia de Zoho»). **Evolución posterior sin diseño que la documente.**
7. **`catalogo-maestro-equipos-design.md` (08-06) — PARCIAL.** La clase de artículo diverge en un aspecto colindante (ver el punto 8), y el propio plan tiene un adéndum de correcciones con prioridad declarada sobre el texto del diseño.
8. **`articulos-por-modelo-design.md` (08-10) — PARCIAL.** Diseñaba `clase text NOT NULL, -- accesorio | consumible | repuesto` (tres clases). `packages/shared/src/types.ts:239` declara `CLASES_ARTICULO = ['accesorio', 'consumible_repuesto', 'mano_obra']`: dos clases fusionadas y una cuarta añadida desde un diseño posterior (08-12).

### 6.4 Materia prima recomendada por capacidad para F0-02

| Capacidad §2.3 | Diseño(s) fuente | Nota |
|---|---|---|
| `tickets-core` | `subsistema-a-modelo-datos-design.md` + `subsistema-c-creacion-tickets-design.md` | Los dos más completos y ya confirmados contra el código |
| `transitions-st` | `subsistema-b-transiciones-postgres-design.md` | Único y auditado a fondo en el frente (a) |
| `transitions-equipo-nuevo` | — | Sin diseño histórico |
| `transitions-soporte-remoto` | — | Sin diseño histórico |
| `remisiones` | `remision-entrada-desenlace-design.md` | Complementar con el plan huérfano `remision-huerfana-fotos.md` |
| `permissions` | `subsistema-h2-roles-permisos-design.md` | Con `subsistema-h1` como complemento |
| `zoho-sync` | `zoho-hub-sp1-sync-service-design.md` + `reorg-esquemas-fase1/fase2-design.md` | El conjunto más fiel al estado actual; `subsistema-i` quedó parcialmente superado |
| `derivacion-avisos` | `avisos-por-correo-design.md` | El más completo y reciente; cubre las dos entregas construidas |
| `trazas` | `historia-unificada-ticket-design.md` | Corrige y sustituye a `historia-ticket-design.md` (06-05) |
| `hojas-vida` | `hoja-de-vida-equipo-design.md` + `ficha-tecnica-modelo-design.md` | **Necesita actualizarse** con la fusión de la historia de Zoho antes de destilar la spec |
| `diagnostico-checklist` | — | Sin diseño ni código |
| `informes` | — | Sin diseño ni código |
| `inventario-lectura` | `articulos-por-modelo-design.md` | Precursor parcial: lee `books.items` pero no filtra por etapa de diagnóstico como pide §2.3 |
| `kpis` | `subsistema-g-analisis-design.md` + `analisis-paneles-extra-design.md` | Precursores genéricos; no cubren OTD ni los tres bodegajes de §2.3 |

### 6.5 Capacidades sin diseño histórico

- **`transitions-equipo-nuevo`** y **`transitions-soporte-remoto`**: §2.3 declara «Sólo mapeo (hojas 03/02)», en `docs/analisis-tickets/`, no en Superpowers. Sin diseño y sin implementación más allá del mapeo as-is.
- **`diagnostico-checklist`**: capacidad «Nueva» en §2.3. Ningún diseño de Superpowers la menciona.
- **`informes`**: capacidad «Nueva». Ningún diseño la menciona.
- **`inventario-lectura`** y **`kpis`** tienen precursores parciales (ver 6.4), pero ningún diseño dedicado a los requisitos exactos de §2.3.

---

## 7. Puntos abiertos resueltos por la auditoría

### 7.1 P14 (Anexo D punto 14) — RESUELTO en su parte técnica

**Pregunta:** «Confirmar si la entrada de `remisiones_entrada` procede de la plataforma de hojas de vida.»

**Respuesta: no.** `remisiones_entrada` **no es una tabla de este repositorio ni de PostgreSQL**: es la hoja de Google Sheets `Remision_Data/remisiones_entrada`, escrita por el nodo `BBDD remisiones_entrada` del flujo de n8n `Remisiones_ST_3.13_Desk` (id `BpLlnPAfjpHaoeKA`), documentado en `docs/superpowers/specs/2026-08-04-remision-entrada-desenlace-design.md:11,52,88`. Ese nodo vive enteramente en n8n (SaaS externo), fuera del código de este repositorio.

**Lo que sí está en el repo es el disparador.** `apps/desk/server/routes/remision.ts:259` llama a `dispararRemision` (`apps/desk/server/remisionWebhook.ts:75-108`), que hace `POST` al webhook de n8n (`config.remisionWebhookUrl`) con el payload que arma `buildRemisionPayload` (`remisionWebhook.ts:31-66`). Ese `POST` dispara las siete ramas paralelas del flujo, una de las cuales es `BBDD remisiones_entrada`.

**No tiene ninguna relación con la hoja de vida.** El módulo de hoja de vida (`apps/desk/server/db/historial.ts`) sólo lee `ticket_history`, `ticket_transitions` y `remisiones` de PostgreSQL.

**Lo que queda abierto, y es decisión de negocio:** la doble escritura. n8n sigue alimentando la hoja de Google Sheets **y** la app guarda su propia copia en PostgreSQL (`apps/desk/server/db/remisiones.ts:44-53`, `createRemision`). `debt.md:419-420` señala esta decisión como bloqueante («¿siguen en Google Sheets, o pasan a Postgres?») y sigue sin resolverse: ambos caminos coexisten hoy. → Ver pregunta 6 de §9.

### 7.2 Puntos abiertos con evidencia nueva (no cerrados)

| Punto | Qué aporta la auditoría | Evidencia |
|---|---|---|
| **Anexo D · 33 (C1)** | La mitad técnica está confirmada: la guarda sigue abierta y, además, **no existe ninguna prueba** que la cubra. La mitad de negocio (si «Liberación del ticket sin facturar» sigue siendo checkbox o pasa a campo exigible, y si se restringe a un cargo) sigue siendo de Gerencia | `apps/desk/server/transitionExec.ts:63-70`; `packages/shared/src/transitions.ts:247`; `apps/desk/server/transitionExec.test.ts:82-86` |
| **Anexo D · 36** | Las dos mitades del punto están confirmadas mecánicamente: el borrado sí destruye `ticket_transitions`, y la ventana de pérdida de aviso sí existe y está documentada en el propio código. Lo que falta es la aceptación formal | `apps/desk/server/db/eliminarTicket.ts:45-56,116,154-161`; `apps/desk/server/services/ticketService.ts:115-122` |
| **Anexo D · 44** | Hoy **no existe ningún código** de escritura hacia CRM, ni gateado ni no gateado: la decisión es sobre construir, no sobre retirar | Grep exhaustivo de escrituras a dominios Zoho: sólo `apps/desk/server/routes/tickets.ts:203` y `packages/zoho-sync/src/tokenManager.ts:25` |
| **Anexo D · 8** | La migración de remisiones históricas ya está hecha (149 filas, 2025-01-29 a 2026-07-24). Lo que sigue abierto es el histórico de **tickets**, sin ningún importador localizado | `apps/desk/server/db/remisionesHistoricasSeed.ts`; `docs/remisiones/Entrada.xlsx` |
| **Anexo D · 31 (C3)** | Confirmado que las cuatro esperas tienen exactamente una salida y **ninguna caducidad ni job** que las libere | `packages/shared/src/transitions.ts:196,204,212,228`; sin `setInterval` ni cron en `apps/desk/server` |
| **Anexo D · 39 (C10)** | Confirmado que sólo existe el nivel «área»; no hay ninguna comprobación por cargo ni por propietario en el servidor | `packages/shared/src/permissions.ts:4-7`; `apps/desk/server/auth/middleware.ts:32-35` |

---

## 8. Lo que cambia en el plan

Cada entrada lleva su evidencia. Las tandas no listadas aquí no cambian por efecto de esta auditoría.

### F0-01 · Init SDD, config y `CLAUDE.md` — **REPLANTEAR (dos tareas añadidas)**

Al inicializar CodeGraph aparecen `.codegraph/` y `.atl/` sin versionar: F0-01 debe añadirlos a `.gitignore` (observación #216). Además, **no hay `pandoc` en la máquina**: la exportación `docs/Manifesto/…_R08.1.md` que §4.7 asigna a F0-01 necesita otra vía; la conversión usada en esta tanda se hizo con un script propio y **fuera del repositorio**, y no es el entregable oficial (#216).

### F0-02 · Specs as-built — **REPLANTEAR (cuatro efectos)**

1. **Cuatro capacidades de §2.3 no tienen ni diseño histórico ni código: sus specs no se destilan, se escriben.** Son `transitions-equipo-nuevo`, `transitions-soporte-remoto`, `diagnostico-checklist` e `informes`. Evidencia: ningún diseño de Superpowers las menciona (#221, §6.5); no tienen ninguna prueba y no la tienen porque no tienen código (#223); el único rastro de las dos ramas es `packages/shared/src/ticketCreate.ts:5` (`CLASIFICACIONES`, tres etiquetas). El plan (§2.4) da por supuesto que «las specs as-built de F0-02 no se escriben desde cero: se destilan»; para estas cuatro, sí se escriben desde cero.
2. **Hay que decidir si «catálogo de equipos» es capacidad propia de §2.3.** Siete de los 52 diseños giran en torno a ese dominio y está en producción con datos reales (26 tipos, 6 marcas, 35 modelos, 354 equipos), pero no encaja limpiamente en ninguna de las 14 capacidades nombradas (#221, §6.6/g.6). Sin esa decisión, F0-02 tiene que repartir esos siete diseños entre `hojas-vida` y `tickets-core` sin criterio.
3. **Tres diseños hay que actualizarlos antes de destilarlos.** `hoja-de-vida-equipo-design.md` no documenta la fusión con `ticket_history` que el código sí hace (`apps/desk/server/db/equipos.ts:260-292`); `articulos-por-modelo-design.md` declara tres clases y el código tiene otras tres distintas (`packages/shared/src/types.ts:239`); `subsistema-i-sync-zoho-books-design.md` diseña tablas y el código tiene vistas (`schema.sql:169,176`).
4. **`debt.md` no puede destilarse tal cual para `hojas-vida`/`inventario-lectura`.** El roadmap de catálogo y accesorios (`debt.md:91-97,247-284`) está mayormente ejecutado por el rediseño «Artículos por modelo» de 08-10/11; destilarlo sin cruzarlo describiría trabajo hecho como pendiente (#222, hallazgo 7).

### F0-04 · Base técnica — **REPLANTEAR (alcance concreto)**

La frase de §2.4 del plan —«F0-04 no crea la red de pruebas: la mide y la completa donde falta (motor de transiciones, permisos)»— **es literalmente falsa en su premisa**: el motor y los permisos ya tienen 34 pruebas entre unidad y HTTP, con 400 por transición desconocida, 409 por estado de origen equivocado, 422 por campo obligatorio ausente, 403/200 por área y escritura del actor en `ticket_transitions` (#223). Lo que falta no es existencia, sino exhaustividad. Las tareas concretas que salen de la auditoría:

| Tarea | Evidencia |
|---|---|
| **Partir `apps/desk/server/app.test.ts`** por dominio (tickets, remisiones, catálogo, admin, auth) antes de añadirle pruebas nuevas | 3010 líneas, 185 tests, **36,435 s de los 40,45 s** de la suite; sin ese fichero la suite tarda 11,41 s (medido) |
| **Decidir y, si procede, habilitar las pruebas de interfaz** | Hoy imposibles por construcción: `vitest.config.ts:16-19` (patrones sólo `.test.ts`) y `vitest.config.ts:14` (`environment: 'node'`); sin `jsdom` ni `@testing-library` instalados; 39 `.tsx` / 6.329 líneas sin cubrir, incluido `TransitionPanel.tsx:57` |
| **Invariantes del grafo** (34 transiciones, 21 estados, `Finalizado` único terminal, cada transición parte y llega a estados declarados) | No existe ninguno hoy; `packages/shared/src/transitions.test.ts:25-27` prueba el caso equivocado |
| **Matriz área×transición** | `permissions.test.ts:13-26` sólo tiene cuatro casos sintéticos; `app.test.ts:1806,1813` sólo una transición real; `apps/desk/server/auth/middleware.ts:14-35` no se importa en ningún test |
| **Cubrir las 22 transiciones huérfanas**, empezando por las cuatro salidas únicas de los estados de espera y las dos del ciclo de facturación | Recuento cruzado sobre `packages/shared/src/transitions.ts:178-255` (lista completa en 3.e.4) |
| **Prueba en rojo de C1**, antes de F1A-01 | `apps/desk/server/transitionExec.ts:63-70`; `transitionExec.test.ts:82-86` usa campo de texto |
| **Guard anti-drift `DESK_TABLES`↔`schema.sql`** | No existe: `packages/zoho-sync/src/db/migrate.integration.test.ts` no referencia `DESK_TABLES` (#222) |
| **Proveedor de cobertura y techo de avisos de lint**, si Gerencia lo decide | `vitest.config.ts` sin sección `coverage`; `@vitest/coverage-v8` ausente de `node_modules` y de `package-lock.json`; `.github/workflows/ci.yml:27` corre `eslint .` sin `--max-warnings` (158 avisos hoy) |
| **Pruebas propias para `estadoPorRemision.ts` y `ticketService.ts`** | No existen; la regla invariable 7 (`estadoPorRemision.ts:41`) no tiene prueba que la nombre |

### F1A-01 · C1, guarda del checkbox — **BLOQUEADA por la prueba, no por una decisión**

El plan la marca con gate «Ninguno» y tamaño XS. Es correcto en cuanto al código —el arreglo es una línea— pero **bajo `strict_tdd` la tanda no puede arrancar en rojo**: no existe ninguna prueba que ejercite el camino del checkbox obligatorio. Evidencia: `apps/desk/server/transitionExec.ts:63-70` (la rama sale antes del chequeo), `packages/shared/src/transitions.ts:247` (único caso real), `apps/desk/server/transitionExec.test.ts:82-86` (la prueba de obligatorios usa el campo de texto «Código Servicio», nunca una casilla). Si no se escribe primero la prueba que falla, el arreglo se dará por bueno sin evidencia. **Dependencia real: F0-04 (o la propia F1A-01 empezando por la prueba).**

### F1B-04 · Recepción unificada — **ABARATAR**

El plan la dimensiona como **L** (cuatro o cinco días). El subsistema de remisiones de entrada ya está activo en producción y el checklist «Incluye» ya sale del catálogo de accesorios por modelo (`checklistDeRemision`, Fase 2 ejecutada el 2026-08-11). Gran parte de F1B-04 es integración y pulido, no construcción desde cero (#222, hallazgo 1). Evidencia adicional del frente (e): la capacidad `remisiones` es de las mejor cubiertas por pruebas (`remisionWebhook.test.ts`, `db/remisionChecklist.test.ts`, `db/checklistRemision.test.ts`, `shared/remision.test.ts`, `lib/envioRemision.test.ts`, `lib/remisionResultado.test.ts`, `lib/botonRemision.test.ts`, `app.test.ts:887,1410,2421`).

### F1D-06 · Criterio de falla y repuestos por etapa — **ABARATAR**

El cimiento ya está construido: `books.items` está replicado en producción (1428 artículos, `debt.md:288-305`) y el discriminador de clase por modelo existe (`packages/shared/src/types.ts:239`, `CLASES_ARTICULO`). Lo que se arrastra es contenido —accesorios sin poblar en 26 de 35 modelos (`debt.md:174-183,237-239`)—, no motor (#222, hallazgo 2).

### F1B-05 · Roles, traspaso, checkbox comercial y trazas — **ABARATAR en la parte de trazas; REPLANTEAR en la de verificación**

La traza «fecha, hora y persona, sin excepciones» ya está construida: `performed_at` es `NOT NULL DEFAULT now()` (`packages/zoho-sync/src/db/schema.sql:57-61`) y `performed_by` recibe el usuario de sesión real en la única ruta de producción (`apps/desk/server/routes/tickets.ts:193` → `ticketService.ts:111` → `repo.ts:283-286`). Lo que no existe es la **prueba** de que se cumple en las 34: `app.test.ts:1793` la verifica en una sola (`aprobacion`). La tanda es menos construcción y más aseguramiento.

### F1B-06 · Blueprints de equipo nuevo y soporte remoto — **REPLANTEAR (depende de F0-04)**

`TRANSICIONES_BASE` (`packages/shared/src/transitions.ts:171`) es el **único** grafo del repositorio, verificado por grep. No existe ningún grafo de equipo nuevo ni de soporte remoto, ni prueba alguna de esas capacidades. Y como no hay ningún invariante de grafo (3.e.5), **esta tanda puede romper el grafo de servicio técnico al editar el array sin que nada dé rojo**. La red de seguridad de F0-04 es prerrequisito, no complemento.

### F1B-08 · Paridad de vistas y política Zoho (P44) — **ABARATAR**

Hoy no hay nada que desmontar: la única escritura de negocio hacia Zoho es el reply de correo (`apps/desk/server/routes/tickets.ts:203`), gateada por `ENABLE_WRITES=false` (`DEPLOY.md:46`); no existe ningún código de escritura hacia CRM. La verificación de «conexión Zoho en solo lectura en las tres entidades» ya está hecha en esta auditoría (#218). La tanda queda reducida a la paridad de vistas más el registro de la decisión P44.

### F1C-02 · C4, ciclo facturar ↔ entregar — **REPLANTEAR (sin red de pruebas)**

El defecto está confirmado (`transitions.ts:246-249`, `transitionExec.ts:75-77`, `repo.ts:274`), pero **sus dos transiciones (`liberacion_sin_factura`, `entrega_sin_factura`) están entre las 22 sin ninguna prueba**. Igual que F1A-01, la tanda necesita escribir primero la prueba que fija el comportamiento actual.

### F1C-03 · C3, salida de las cuatro esperas — **REPLANTEAR (sin red de pruebas)**

Las cuatro salidas únicas (`llegada_repuestos`, `entrega_repuestos`, `retorno_servicio_externo`, `notif_cliente_sku`) están **todas** entre las 22 transiciones sin prueba. Además, la vista «Tickets en espera» del tablero no ve dos de los cuatro estados (`boardView.ts:35`), de modo que cualquier verificación manual de esta tanda contra la interfaz daría un recuento incompleto.

### F1C-05 · C10, permisos por cargo y propietario — **REPLANTEAR (depende de F0-04)**

`packages/shared/src/permissions.ts` tiene 7 líneas y se va a modificar sin batería de regresión por área (3.e.7). Además, la mitad cliente del modelo (`apps/desk/src/components/TransitionPanel.tsx:57`) queda fuera de la red de pruebas por construcción (3.e.3). Sin la matriz área×transición de F0-04, esta tanda cambia el fichero más sensible del proyecto a ciegas.

### F1E-01 · Modelo del informe — **DESBLOQUEADA a medias**

Su gate es P14. La parte técnica **está respondida** por esta auditoría (§7.1): los datos de cabecera de `remisiones_entrada` vienen de una hoja de Google Sheets escrita por n8n, no de la plataforma de hojas de vida. Lo que sigue bloqueando es la decisión de negocio sobre la doble escritura.

### F1B / F1B-01 · Registro de equipos — **REPLANTEAR (defecto activo)**

`getEquipo` no filtra por `active` (`apps/desk/server/db/equipos.ts:75-78`) y desde que existe la UI de baja lógica (`apps/desk/src/components/EquiposAdmin.tsx:31-34`) **un equipo dado de baja puede usarse hoy para crear un ticket** si se conoce su id. `debt.md` lo clasificaba como riesgo teórico «para cuando llegue la gestión de equipos»: ya llegó (#222, hallazgo 4).

### F1A-05 y F1B-09 · Auditorías de blueprint — **REPLANTEAR (dato de entrada corregido)**

La corrección factual «ocho, no diez, transiciones compartidas por dos áreas» (3.a.16) y el hallazgo del filtro «en espera» del tablero (3.a.15) entran como dato de partida de la primera auditoría, para que `docs/artefactos/blueprintserviciotecnico.html` no se regenere sobre una cifra incorrecta.

### Tres lugares donde vive lógica de flujo fuera de `packages/shared` — **decisión de alcance para F1A o antes**

La regla invariable 1 de §4.4 dice: «Ninguna regla de flujo vive en la interfaz». Hoy hay tres incumplimientos de distinta gravedad, y hay que decidir si se consolidan en F1A o se dejan para F1C:

| Lugar | Qué es | Gravedad |
|---|---|---|
| `apps/desk/src/lib/boardView.ts:35` | Clasificación de «estados en espera» por regex sobre el nombre del estado, sin ningún import de `transitions.ts`. **Diverge del grafo**: «Solicitado» y «Servicio externo» caen en «Tickets abiertos» | Alta — es una regla duplicada **e incoherente**, y su prueba (`boardView.test.ts:11,21`) pasa igualmente porque nunca ejercita esos dos estados |
| `apps/desk/src/components/TransitionPanel.tsx:57` | Aplica `canExecuteTransition(user.areas, user.isAdmin, t.area)` en el cliente. No duplica la regla —importa la función canónica— pero es la mitad cliente del modelo de autorización y **ninguna prueba la toca** | Media — no diverge, pero no está asegurada |
| `apps/desk/src/lib/valoresTransicion.ts:3-17` | Regla de dominio (qué fecha corresponde a qué campo de transición) que sólo existe client-side; el propio fichero documenta que es «una regla de negocio, no maquetado» y que vive ahí porque «el repo no tiene harness de componentes React» | Media — está documentada y probada (`lib/valoresTransicion.test.ts`, 12 tests), pero contradice la regla invariable 1 |

Como nota aparte, `apps/desk/src/components/TicketCard.tsx:14-23` es código muerto (mapa de colores con claves en mayúsculas que nunca casan), sin efecto sobre el flujo.

---

## 9. Preguntas para Gerencia

Sólo las que ninguna lectura de código puede responder. Los puntos abiertos ya registrados en el Anexo D (31–36, 39, 40) no se repiten salvo cuando la auditoría aporta algo nuevo.

1. **Filtro «Tickets en espera» del tablero.** ¿Debe alinearse con los cuatro estados canónicos de espera, o el criterio de negocio de esa vista es otro («esperando algo externo» en vez de «el nombre del estado contiene la palabra espera»)? *Bloquea:* si es un defecto, entra en F1A; si es una definición distinta, hay que documentarla y F1C-03 la hereda. Hoy `boardView.ts:35` deja «Solicitado» y «Servicio externo» fuera de la vista.

2. **Corrección factual del maestro (M1.9.1).** ¿Se corrige «Diez de las 34 transiciones son compartidas por dos áreas» a **ocho**? *Bloquea:* la spec `permissions` de F0-02 y la matriz cargo×transición de F1C-05 se escriben sobre esa cifra; el recuento en código es exhaustivo y reproducible.

3. **¿Entra la interfaz en la red de pruebas?** Hoy 39 ficheros `.tsx` y 6.329 líneas quedan fuera **por construcción** (`vitest.config.ts:14,16-19`), incluido `TransitionPanel.tsx:57`. *Bloquea:* el alcance de F0-04 y el aseguramiento de F1C-05. Si la respuesta es no, conviene escribirlo como decisión, porque hoy parece un olvido y es una elección.

4. **Puertas de calidad del CI.** ¿Se pone techo a los avisos de lint (hoy 158, sin `--max-warnings`) y se instala un proveedor de cobertura con umbral? *Bloquea:* la definición de «hecho» de F0-04. Sin proveedor, la palabra «cobertura» seguirá siendo una impresión: esta auditoría **no pudo medirla** sin modificar el repositorio.

5. **¿Es «catálogo de equipos» una capacidad propia de §2.3, o se absorbe en `hojas-vida` / `tickets-core`?** Siete de los 52 diseños y una siembra real de 354 equipos giran en torno a ese dominio, y no encaja en ninguna de las 14 capacidades nombradas. *Bloquea:* F0-02 no puede repartir esos diseños sin criterio.

6. **P14 — doble escritura de las remisiones de entrada.** La parte técnica está respondida (§7.1): la hoja de Google Sheets la escribe n8n, no la plataforma de hojas de vida. ¿La hoja sigue siendo destino, o PostgreSQL pasa a ser el único? *Bloquea:* F1E-01 (de dónde salen los datos de cabecera del informe) y la rama de salida de remisiones (`debt.md:419-420`).

7. **`fecha_orden_compra_final` y `fecha_orden_venta_final`.** Existen en el código (`packages/zoho-sync/src/db/rows.ts:115-116`) y no aparecen en el Anexo G ni en ningún punto del maestro. ¿Qué son, quién las escribe y migran o se retiran? *Bloquea:* la spec `tickets-core` de F0-02 y el contraste del Anexo G.

8. **Rotación de secretos: dueño y fecha.** `ZOHO_CLIENT_SECRET`, refresh tokens de Desk/Books/CRM, password `hub_reader` y dos PAT de GitHub (`debt.md:29-31`). Declarada de alta prioridad, **sin fecha ni responsable**, ausente del Anexo D y de todas las tandas F1A–F1F. *Bloquea:* la puesta en producción de F1F es el último momento razonable para hacerlo.

9. **Dos lectores independientes de Zoho Desk.** Desk app y `apps/hub-sync` mantienen cada uno su propio ciclo de tres minutos contra Zoho Desk para tickets y actividades, con doble consumo de cuota de API. ¿Se acepta, o se migra a la réplica lógica del hub? *Bloquea:* F1F-01 (migración de tickets abiertos) parte de esta topología.

10. **P44 — política de escritura contra Zoho, con la evidencia nueva.** Hoy **no existe ningún código** de escritura hacia CRM; la única escritura de negocio del monorepo es el reply de correo, gateado. La decisión es sobre construir una excepción acotada, importar a mano, o esperar a sustituir el CRM. *Bloquea:* F1B-08 y el flujo de cotización de F1D-06.

---

## Anexo — Trazabilidad de este documento

Cada afirmación técnica de este documento procede de una de estas fuentes, todas verificadas al commit `a3a8f03`:

| Sección | Observación Engram | Frente |
|---|---|---|
| §1, §2 | #215–#223 | Todos |
| §3.a, §4 (filas del motor) | #217 | (a) Motor de flujo |
| §3.b, §4 (filas del esquema), §7.1 | #220 | (b) Esquema de datos |
| §3.c, §4 (filas de Zoho) | #218 | (c) Sincronización Zoho |
| §3.d | #219 | (d) Interfaz |
| §3.e, §8 (F0-04) | #223 | (e) Pruebas y build |
| §3.f, §5 | #222 | (f) Deuda |
| §3.g, §6 | #221 | (g) Histórico de diseño |
| Cabecera, §8 (F0-01) | #216 | Preflight y tooling |

Lo que **no** se verificó en esta tanda, declarado explícitamente para que no se lea como afirmación: la cobertura numérica de pruebas (§3.e.11); el punto M-5 de `debt.md` (escapar comodines de búsqueda); el wrapper `listEquiposManage` de `api/client.ts` (punto M-15); los símbolos `visits` y `quote_line_items` de `crm-hub-fase2-design.md`; y los diseños marcados «SUPERFICIAL» en §6.1, cuyos ficheros y símbolos existen pero no se leyeron línea a línea.
