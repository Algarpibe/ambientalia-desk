# Diseño: normalizar los estados de Zoho al sincronizar y al leer (`normalizar-estados-zoho`)

Tanda F1F-01 (`cierra: no`). Propuesta: `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md`. Deltas: `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/specs/zoho-sync/spec.md`
(RQ-ZS-24) y `…/specs/tickets-core/spec.md` (RQ-TC-40, desvío 3). Decisión: `decision/e249-normalizar-al-leer` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, por clave). Árbol medido: worktree
`normalizar-estados-zoho` en `f5465799`. Todo `ruta:línea` de este documento se leyó en ese árbol; lo que no, lleva «hipótesis».
Sin DDL: ninguna sentencia crea ni altera tablas (`rules.design`, `openspec/config.yaml:3126-3128`).

## Enfoque técnico

Una regla en un módulo nuevo de `packages/shared` con dos formas (TS y SQL). Se aplica en **un solo punto por camino de lectura**:
el mapeador de la sincronización, los dos lectores de fila de `packages/zoho-sync/src/db/repo.ts`, el punto de mapeo de cada consulta
del servidor que sólo SELECCIONA el estado, y la forma SQL dentro de cada consulta que FILTRA o COMPARA por él. Los consumidores puros
(`columnForStatus`, `transicionesDelTicket`, `enEsperaDe`…) no cambian: reciben el valor ya normalizado. Ninguna línea de
`apps/desk/server/services/ticketService.ts` ni de `apps/desk/src` cambia.

```
Zoho ──raw──> ticketRowFromZoho [regla] ──> upsertTicket ──> tickets.status (desde hoy, normalizado; lo viejo, como esté)
                                                               │
     ┌──────────────────────────┬──────────────────────────────┼──────────────────────────┐
     v                          v                              v                          v
lectores de repo [TS]     SELECT-only del servidor [TS]   SQL que filtra [forma SQL]   historia Zoho
(listas, detalle, guarda)  directory, analisis, indicadores  sla, alarmasAvisadas,      secuenciaDelReloj [TS]
     │                     reasignaciones, informeContrato,  esperasVencidas
     v                     migración, estadoPorRemision           │
rowToTicket ──> navegador                                         v
(sin tocar)                                                 alarmas, marca, esperas
```

## El módulo: `packages/shared/src/normalizarEstado.ts` (nuevo)

```ts
/** Regla única de nombres de estado (RQ-ZS-24; decision/e249-normalizar-al-leer). Sólo U+0020 (S-1). */
export function normalizarEstado(estado: string): string {
  return estado.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ')
}
/** La misma regla para lo que puede no ser texto: `null`, `undefined` o cualquier no-cadena pasan tal cual. */
export function normalizarSiTexto<T>(valor: T): T {
  return (typeof valor === 'string' ? normalizarEstado(valor) : valor) as T
}
/** Copia de la fila con `status` normalizado y el resto intacto; no muta la entrada. */
export function conEstadoNormalizado<F extends { status?: unknown }>(fila: F): F {
  return { ...fila, status: normalizarSiTexto(fila.status) }
}
const IDENTIFICADOR = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/
/** La forma SQL de la MISMA regla sobre una columna. Sólo identificadores: nunca texto de usuario. */
export function sqlEstadoNormalizado(columna: string): string {
  if (!IDENTIFICADOR.test(columna)) throw new Error(`sqlEstadoNormalizado: «${columna}» no es un identificador de columna`)
  return `regexp_replace(btrim(${columna}), ' {2,}', ' ', 'g')`
}
```

- **Nulos:** `normalizarEstado` exige `string`; donde el valor puede faltar se usa `normalizarSiTexto`, que conserva el comportamiento
  de hoy (en el mapeador, un `status` ausente sigue llegando ausente y lo rechaza la base, igual que ahora). En SQL, `btrim(NULL)` es NULL.
- **Equivalencia de las dos formas:** recortar y luego colapsar da lo mismo que colapsar y luego recortar cuando sólo se tocan
  espacios; `btrim` con un argumento recorta sólo espacios. La fijan la prueba del texto SQL, la imitación de pg-mem y la integración.
- **Exportación:** se AÑADE `export * from './normalizarEstado'` como línea nueva al final, detrás de `packages/shared/src/index.ts:53`
  (`diaDeCierre`). No se inserta nada por encima: el fichero tiene 41 citas `ruta:línea`.
- **Por qué no se reutiliza `normalizar`** (`packages/shared/src/flujos.ts:32-34`): pasa a minúsculas (igualaría
  `notificación comercial` con `Notificación Comercial`, que la spec prohíbe), usa `trim()` y `\s+` (tabuladores y NBSP), que `btrim`
  de un argumento no imita —las dos formas dejarían de ser la misma regla—, y es privada: exportarla cambiaría `flujos.ts`.

## Decisiones

| # | Opción elegida | Alternativas descartadas | Razón |
|---|---|---|---|
| D1 | Un punto de normalización por camino | Normalizar también en `rowToTicket` y en `getTicketRow` | Dos puntos en el mismo camino se tapan entre sí: M2 y M3 no se pondrían rojas («si nadie se queja, el detector no existe», CLAUDE.md, reglas de la mutación) |
| D2 | Consulta que FILTRA o COMPARA: forma SQL dentro de la consulta, y la misma forma en su `SELECT` del estado | Filtrar en TS tras leer todo | Lo pide la spec (`openspec/changes/archive/2026-10-25-normalizar-estados-zoho/specs/zoho-sync/spec.md:30`); con la forma también en el `SELECT`, el TS de esa consulta recibe el valor de la misma expresión |
| D3 | Consulta que sólo SELECCIONA: función TS en el punto de mapeo, en la misma línea | Forma SQL en el `SELECT` | No necesita imitación de pg-mem, así que no se tocan los ficheros de prueba de esas consultas; misma función que el resto del TS |
| D4 | `sqlEstadoNormalizado` rechaza lo que no es identificador | Interpolar sin control | La forma se interpola en el texto de la consulta: un uso indebido lanza en vez de abrir una inyección |
| D5 | Imitación de pg-mem en un ayudante central, registrado a mano en el arnés y en cinco ficheros | `vi.mock('pg-mem')` global en `setupFiles`; copia por fichero | Ver «pg-mem». La global exige editar `vitest.config.ts:98` o insertar líneas en un fichero que CLAUDE.md cita (`vitest.config.ts:16`, `:17-20`, `:57`) y su efecto en `setupFiles` es hipótesis; la copia diverge |
| D6 | Reloj: normalizar los dos lados en `secuenciaDelReloj` (`apps/desk/server/db/relojSla.ts:45`, `:58`) | Normalizar en `etapasDesdeHistoria` (`packages/shared/src/etapasDesdeHistoria.ts:115-116`) | La comparación vive en `apps/desk/server/db/relojSla.ts:58`; el otro consumidor de `etapasDesdeHistoria` es presentación (`apps/desk/server/db/equipos.ts:318`) |
| D7 | Una prueba de aceptación nueva que crece por lote (bloques añadidos al final) | Un fichero con `it.fails` para lo que llega después | Cada lote empieza con su bloque en rojo sin reescribir lo anterior; al final no queda `it.fails` que voltear |

## LA TABLA: lectura → cómo se normaliza → prueba

«Aceptación» = `apps/desk/server/normalizarEstadosZoho.test.ts` (nuevo). Una cita abreviada (`:NN`) se refiere siempre a la última
cita completa de su misma línea.

| # | fichero:línea (re-medido) | Lectura | Cómo se normaliza | Prueba |
|---|---|---|---|---|
| 1 | `packages/zoho-sync/src/db/mappers.ts:47` (único camino: `packages/zoho-sync/src/sync.ts:116`, `:119`) | `status` de Zoho que se guarda | Mapeador de la sincronización, en sitio: `status: normalizarSiTexto(raw.status as string)` | Nueva `packages/zoho-sync/src/db/estadoNormalizado.test.ts`: `upsertTicket(ticketRowFromZoho(dos espacios))` y `SELECT status` crudo da un espacio (M1) |
| 2 | `packages/zoho-sync/src/db/repo.ts:139` (`mapTicketRowWithRefs`, de `:154`, `:169`, `:189`) | Listas activa, cerrada y todas → `apps/desk/server/routes/tickets.ts:110`, `:114-115`; `apps/desk/server/routes/prioridad.ts:85`; `apps/desk/server/db/listaRemisionCreada.ts:14`; `apps/desk/server/db/colaTaller.ts:24` | Lector de fila, en sitio: `row: conEstadoNormalizado(row) as TicketRow` | Aceptación L1: `GET /api/tickets` da `Notificación Comercial` y `columnForStatus` → `notif_comercial` (`packages/shared/src/columns.ts:29`) en los dos gemelos (M2); `estadoNormalizado.test.ts` sobre las tres listas |
| 3 | `packages/zoho-sync/src/db/repo.ts:209` (`getTicketWithRefs`, envuelto en `apps/desk/server/db/ticketsConCliente.ts:36`) | Detalle (`apps/desk/server/routes/tickets.ts:130-144`) y `current` de la transición (`apps/desk/server/services/ticketService.ts:124`) | Lector de fila, en sitio: `row: conEstadoNormalizado(row) as TicketRow` | Aceptación L1: `GET /api/tickets/:id` normalizado; `POST …/transition` `200` y `from_status` normalizado (M3) |
| 4 | `apps/desk/server/services/ticketService.ts:125` (`fueraDeFlujo`), `:126-127` (guarda y texto del `409`), `:131` (`veredictoEjecutorSalida`, `:329-330`; `veredictoDeLiberacion`, `:241-244`), `:155` (`fromStatus`); reglas en `packages/shared/src/flujos.ts:101-106`, `packages/shared/src/salidasEsperas.ts:56`, `packages/shared/src/gasPatron.ts:69` | Todas leen `current.row.status` | Sin cambio en el fichero: es el MISMO objeto de la fila 3, así que guarda, regla de cargo y liberación leen el mismo valor por construcción | Aceptación L1 (`200`, no `409`); con M3 la guarda vuelve a `409` |
| 5 | `packages/zoho-sync/src/db/repo.ts:119-122` (`getTicketRow`) | `SELECT *` por id | NO se normaliza: sin llamador de producción (búsqueda de `getTicketRow(` fuera de `*.test.ts`: sólo la definición). Se deja crudo a propósito: es lo que leen las pruebas para ver la columna guardada | `estadoNormalizado.test.ts` fija que devuelve el crudo |
| 6 | `packages/zoho-sync/src/db/mappers.ts:200` (`rowToTicket`), `:236` (`rowToTicketDetail`) | Paso al navegador | NO se normaliza: todos sus llamadores le pasan filas de 2 o 3 (`apps/desk/server/db/colaTaller.ts:24`, `apps/desk/server/db/listaRemisionCreada.ts:16`, `apps/desk/server/routes/tickets.ts:110`, `:144`, `apps/desk/server/services/ticketService.ts:110`, `:222`); normalizar aquí taparía M2 y M3 (D1) | Cubierta por M2 y M3 |
| 7 | `packages/zoho-sync/src/sync.ts:307-308`, `:319` | `history_synced_status <> status` | No le afecta: compara la columna con su propia marca, escrita con lo que se leyó (`:319`); detecta cambios, no interpreta estados. S-8 | Sin prueba nueva |
| 8 | `apps/desk/server/db/directory.ts:23-26` → `apps/desk/src/components/ClienteDetalle.tsx:36` y `apps/desk/server/db/directory.ts:67-68` | Tickets de la ficha de cliente y su media de resolución | Sólo SELECT: TS en el mapeo, en sitio en `:26` (`normalizarEstado(x.status ?? '')`) | Aceptación L2: `GET /api/accounts/:id` (`apps/desk/server/routes/directory.ts:77`) da el estado normalizado |
| 9 | `apps/desk/server/analisis.ts:13`, `:20`, `:24` → `packages/shared/src/analisis.ts:40`, `:44-45`, `:59` | Filas de Análisis y `tiemposDelRelojPorTicket(db, filas)` (`apps/desk/server/analisis.ts:22`) | Sólo SELECT: TS en `:20`, `(r.rows as any[]).map(conEstadoNormalizado)`; una edición cubre los dos consumidores | Aceptación L2: `getAnalisisRows` da el mismo `status` a los gemelos |
| 10 | `apps/desk/server/indicadores.ts:64`, `:66`, `:68`, `:73` | `esAnulado` y `estado` del candidato | Sólo SELECT (el filtro es `status_type`, `:59`): TS en `:66`, `rt.rows.map(conEstadoNormalizado)` | Aceptación L2: ` Anulado` y `Anulado` cerrados: ninguno entra (escenario de la spec) |
| 11 | `apps/desk/server/db/reasignaciones.ts:16-18` → `apps/desk/server/routes/reasignacion.ts:25`, `:29` → `packages/shared/src/reasignacion.ts:24` | Permiso de reasignar | Sólo SELECT: TS en sitio en `apps/desk/server/db/reasignaciones.ts:18` | Aceptación L2: `POST /api/tickets/:id/reasignar` con `userCookie(['Comercial'])` y cuerpo vacío: el de dos espacios recibe el mismo código que su gemelo, no `403` |
| 12 | `apps/desk/server/db/informeContrato.ts:31`, `:45` → `packages/shared/src/contratos.ts:138` | `estadoSubOV` (`Finalizado` → ejecutada) | Sólo SELECT: TS en sitio en `apps/desk/server/db/informeContrato.ts:45` | Bloque AÑADIDO al final de `apps/desk/server/db/informeContrato.test.ts` con sus ayudantes `subOV` y `servicio` (`apps/desk/server/db/informeContrato.test.ts:23`, `:30`): `Finalizado ` y su gemelo, los dos ejecutados |
| 13 | `apps/desk/server/db/migracionTicketsAbiertos.ts:33-36` → `:57`, `:70`, `:74`, `:81`, `:85` | Plan, negativa y escrituras de la migración | Sólo SELECT: TS en sitio en `:36` (S-5) | Aceptación L2: `migrarTicketsAbiertos` en seco: `negativa` nula y `porEstado` con el par identidad de `Notificación Comercial` y 2 tickets |
| 14 | `apps/desk/server/db/estadoPorRemision.ts:39-41`, `:50`, `:55` | Estado actual contra `TRANSICION_REMISION_*` (`packages/shared/src/transitions.ts:150-151`) | Sólo SELECT: TS en sitio en `apps/desk/server/db/estadoPorRemision.ts:40` (`normalizarSiTexto(…)`); `undefined` sigue pasando a `:41` | Aceptación L2: `Ticket  creado` con remisión `ok` pasa a `Remisión creada` como su gemelo, con `from_status` `Ticket creado` |
| 15 | `apps/desk/server/db/relojSla.ts:45`, `:58` (llamadores `apps/desk/server/db/esperasVencidas.ts:54`, `apps/desk/server/db/relojSla.ts:101-105`) | Etapas de Zoho frente al estado del ticket | TS en sitio en las dos líneas (D6): `de`/`hacia` de Zoho y `ticket.status` | Aceptación L2: `secuenciaDelReloj` directa, en los dos sentidos del escenario (molde `apps/desk/server/relojSla.test.ts:53`, `:58`) |
| 16 | `apps/desk/server/db/relojSla.ts:44` | `from_status`/`to_status` de la app | No le afecta: `to_status` sale del catálogo (`packages/zoho-sync/src/db/repo.ts:317` `plan.status`, `:429` alta; `apps/desk/server/db/migracionTicketsAbiertos.ts:81` destino o NULL); `from_status` pasó antes una igualdad exacta (`apps/desk/server/services/ticketService.ts:126`; `apps/desk/server/db/estadoPorRemision.ts:41`) y desde hoy sale normalizado (filas 3, 13, 14) | — |
| 17 | `apps/desk/server/db/relojSla.ts:72` | `ES_TERMINAL(String(f.status))` | Recibe normalizado de la fila 9 (único llamador, `apps/desk/server/analisis.ts:22`) | Fila 9 |
| 18 | `apps/desk/server/db/sla.ts:45` → `:49`, `:51`, `:53` → `apps/desk/server/services/alarmasSla.ts:46-47`, `:88`, `:100`, `:106` | Tickets con SLA vencido, clave y texto de la alarma | Forma SQL en `SELECT` y `WHERE`, en la misma línea | Aceptación L3: `Notificado ` y `Notificado` con entrada: los dos vencidos con el mismo estado; tras `avisarAlarmasVencidas`, `alarmas_avisadas.estado` es `Notificado` en los dos |
| 19 | `apps/desk/server/db/sla.ts:89`, `:95` (`entradasActuales`; llamadores `apps/desk/server/db/sla.ts:50`, `apps/desk/server/db/alarmasAvisadas.ts:22`, `apps/desk/server/db/listaRemisionCreada.ts:15`) | Subconsulta por estado, y la comparación con `to_status` | Forma SQL en la subconsulta; `apps/desk/server/db/sla.ts:95` no le afecta (`to_status` de catálogo, fila 16) | Fila 18: sin entrada no hay alarma (M4b opcional) |
| 20 | `apps/desk/server/db/alarmasAvisadas.ts:21`, `:23`, `:28` (← `apps/desk/server/db/colaTaller.ts:22`) | Marca «esperando aprobación del cliente» | Forma SQL en `SELECT` y `WHERE`; `apps/desk/server/db/alarmasAvisadas.ts:28` compara con `alarmas_avisadas.estado`, que sólo escriben `apps/desk/server/services/alarmasSla.ts:46-47` y `apps/desk/server/services/avisoSalidasEsperas.ts:63` con valores que ya pasaron el filtro exacto | Aceptación L3: `Notificación  cliente` con entrada y marca, marcado como su gemelo. Fija el camino que traga errores (`apps/desk/server/db/alarmasAvisadas.ts:31-34`) |
| 21 | `apps/desk/server/db/esperasVencidas.ts:30`, `:37`, `:42` → `:31`, `:54`, `:57` → `apps/desk/server/services/avisoSalidasEsperas.ts:52-55`, `:63` | Esperas en curso | Forma SQL: `SELECT` y `WHERE` en `apps/desk/server/db/esperasVencidas.ts:30`, `WHERE` en las subconsultas `:37` y `:42` | Aceptación L3: `Solicitado ` y `Solicitado` con `deApp` (molde `apps/desk/server/db/esperasVencidas.test.ts:19-26`): los dos, mismo estado y mismo `desde` (M4) |
| 22 | `apps/desk/server/db/facturacionVencida.ts:18`; `apps/desk/server/services/avisoFacturacionVencida.ts:39` | `status = 'Pendiente de facturar'` | No le afecta, probado: la consulta exige `fecha_prevista_facturacion IS NOT NULL`; esa columna está fuera de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:44-54`, fijado por `packages/zoho-sync/src/db/repo.test.ts:544`) y sólo la escribe `writeTransition` (`packages/zoho-sync/src/db/repo.ts:301-302`), que en la misma sentencia pone `managed_by_app=true` (`:298`); desde ahí el sync no toca la fila (`:71`) y el estado sólo lo escribe la app desde el catálogo | — |
| 23 | `apps/desk/server/services/ticketService.ts:196`, `:202` | Avisos de área | No le afecta: usan `t.to`, del catálogo | — |
| 24 | `apps/desk/server/db/traspaso.ts:32-33`; `apps/desk/server/db/informeContrato.ts:34` | `to_status` | No le afecta (fila 16) | — |
| 25 | `apps/desk/server/db/conversacion.ts:79`, `:140`; `apps/desk/server/db/historial.ts:57`, `:137`; `packages/shared/src/historyMap.ts:19`, `:63` | Historia que se enseña | No le afecta: presentación | — |
| 26 | `apps/desk/server/db/equipos.ts:256`, `:318`, `:330` → `apps/desk/src/components/HojaDeVida.tsx:81` | Hoja de vida | No le afecta: se enseña, no decide | — |
| 27 | `apps/desk/server/db/eliminarTicket.ts:104`, `:143` | Resumen del borrado | No le afecta: sólo tickets nacidos en la app (`apps/desk/server/db/eliminarTicket.ts:116`), cuyo estado escribe la app | — |
| 28 | `packages/shared/src/columns.ts:45-47`, `packages/shared/src/estados.ts:169-173`, `packages/shared/src/flujos.ts:56-61`, `:69-71`, `packages/shared/src/transitions.ts:163-165`, `:301-303`, `:327`, `packages/shared/src/salidasEsperas.ts:47`, `:78`, `packages/shared/src/anulacion.ts:57`, `:69`, `packages/shared/src/garantia.ts:25`, `packages/shared/src/sla.ts:52`, `packages/shared/src/relojSla.ts:38`, `packages/shared/src/plazosEsperas.ts:29`, `:49`, `packages/shared/src/migracionTickets.ts:30`, `:89`, `packages/shared/src/cierreEnCifras.ts:45` | Reglas puras por nombre exacto | Sin cambio: reciben el valor de las filas 1-3, 8-15 y 18-21 | Puntos fijos en `packages/shared/src/normalizarEstado.test.ts` (la regla no altera ningún nombre que comparan) |
| 29 | Cliente: `apps/desk/src/board.ts:9`, `apps/desk/src/lib/boardView.ts:39`, `apps/desk/src/components/TransitionPanel.tsx:56-57`, `apps/desk/src/components/TransitionPanel.tsx:163`, `apps/desk/src/components/PanelReasignar.tsx:30`, `apps/desk/src/lib/botonRemision.ts:31`, `apps/desk/src/components/TicketDetailView.tsx:45`, `apps/desk/src/components/ClienteDetalle.tsx:36`, `apps/desk/src/components/TicketCard.tsx:26` | Reglas del cliente | Sin cambio: consumen el `status` de las filas 2, 3 y 8 (ver «Regla 13») | `.tsx` excluidos (F0-00); los `.ts` reciben el valor normalizado |

## pg-mem

El `package.json` de pg-mem en `node_modules` declara la versión 3.0.14; ni `btrim` ni `regexp_replace` aparecen en el paquete (búsqueda
sin resultados), y su fichero de tipos `interfaces.d.ts` declara `registerFunction` en el esquema y la forma de `FunctionDefinition`
(se nombra en prosa porque `node_modules` no está versionado y el detector de citas lo daría por inexistente). Ninguna prueba lo usa hoy
(búsqueda en `apps` y `packages`: 0). El repositorio ya anota el límite para `TRIM` (`apps/desk/server/db/remisionesHistoricas.ts:37-39`).

- **El ayudante:** `apps/desk/server/testing/pgMemEstado.ts` (nuevo; `testing/` está fuera de la cobertura, `vitest.config.ts:57`)
  exporta `conFuncionesDeEstado(mem: IMemoryDb): IMemoryDb`. Registra en `mem.public` `btrim(text)` (recorta U+0020) y
  `regexp_replace(text, text, text, text)`, que SÓLO acepta `' {2,}'`, `' '` y `'g'` —lo que emite `sqlEstadoNormalizado`— y lanza
  «imitación fuera de alcance» con cualquier otra cosa. Implementa lo que el módulo emite y nada más.
- **Dónde se registra (en sitio, sin mover líneas):** `newDb()` pasa a `conFuncionesDeEstado(newDb())` en la línea del `beforeEach`, y la
  importación se añade a la línea de `import { newDb }`, en el arnés y en los cinco ficheros con `newDb()` propio que llegan a una
  consulta con la forma SQL (los demás usan la forma TS, D3):
  - `apps/desk/server/testing/appHarness.ts:36` (dentro de `instalarArnes`), importación en `:2`;
  - `apps/desk/server/db/sla.test.ts:7`, importación en `:2`;
  - `apps/desk/server/db/alarmasAvisadas.test.ts:17`, importación en `:2`;
  - `apps/desk/server/db/esperasVencidas.test.ts:14`, importación en `:2`;
  - `apps/desk/server/services/alarmasSla.test.ts:27`, importación en `:4`;
  - `apps/desk/server/services/avisoSalidasEsperas.test.ts:19`, importación en `:4`.
- **¿Se puede olvidar, y entonces falla a la vista?** Sí se puede, y en casi todos los caminos falla a la vista: pg-mem rechaza la
  consulta con una función desconocida (hipótesis del texto exacto del error). **La excepción es `apps/desk/server/db/alarmasAvisadas.ts:31-34`**, que
  traga cualquier error y devuelve el conjunto vacío: olvidar la imitación ahí apagaría la marca sin error. Por eso la aceptación L3 tiene
  un caso que EXIGE la marca en el gemelo con espacios: con la imitación olvidada se pone rojo. La comprobación final es la suite entera.
- **Fake frente a TS, en local:** `apps/desk/server/testing/pgMemEstado.test.ts` (nuevo) evalúa la forma SQL en pg-mem sobre las
  muestras de la spec y exige el mismo resultado que `normalizarEstado`.
- **SQL real, en CI:** `apps/desk/server/db/normalizarEstado.integration.test.ts` (nuevo), molde de
  `apps/desk/server/db/migracionConcurrente.integration.test.ts:20-21` (se salta sin `TEST_DATABASE_URL`, que el CI fija en
  `.github/workflows/ci.yml:45-47`, contra el servicio PostgreSQL 17 de `:10-19`). (a) `SELECT ${sqlEstadoNormalizado('v')} AS r FROM (VALUES ($1::text)) AS m(v)`
  sobre cada muestra, igual a `normalizarEstado`. (b) `ticketsEnEspera` con el par de gemelos en una base propia (molde
  `apps/desk/server/db/migracionConcurrente.integration.test.ts:17-18`): cierra el riesgo de que pg-mem acepte una forma de la consulta
  (alias `AS status`, función dentro de `IN`) que PostgreSQL rechace.

## Aceptación (`apps/desk/server/normalizarEstadosZoho.test.ts`, nuevo, arnés `instalarArnes`)

- **Siembra sin el mapeador:** `upsertTicket(db, { ...ticketRowFromZoho({ … status: 'Notificación Comercial' … }), status: 'Notificación  Comercial' })`
  (molde de fila a mano de `apps/desk/server/tickets.test.ts:14`) y su gemelo con un espacio. Precondición: `SELECT status` crudo devuelve
  los dos espacios (prueba que la siembra no pasó por la regla).
- **L1:** `GET /api/tickets` y `GET /api/tickets/:id` devuelven `Notificación Comercial`; `columnForStatus` da `notif_comercial`;
  `transicionesDelTicket` del de dos espacios no está vacía y es igual (por `id`) a la del gemelo; `POST /api/tickets/:id/transition` con
  `notif_cliente_comercial` (`packages/shared/src/transitions.ts:210`) y `valoresValidos` (`apps/desk/server/testing/appHarness.ts:71`)
  da `200` y la fila nueva de `ticket_transitions` lleva `from_status` `Notificación Comercial`; las filas previas no cambian (molde
  `apps/desk/server/transiciones.test.ts:268-279`). Tras las lecturas, la columna sigue con dos espacios y un espía sobre `db.query` no ve
  ningún `UPDATE tickets … status`. Durante la transición, `zohoFetch` (`apps/desk/server/testing/appHarness.ts:51`) no se llama, y
  `apps/desk/server/superficieSaliente.test.ts:44-67` sigue en verde sin tocarse.
- **L2 (bloque añadido al final):** filas 8-15 de la tabla, cada una con su gemelo.
- **L3 (bloque añadido al final):** filas 18, 20 y 21 (moldes `apps/desk/server/db/sla.test.ts:11-18`,
  `apps/desk/server/db/alarmasAvisadas.test.ts:22-27`, `apps/desk/server/db/esperasVencidas.test.ts:19-26`), y el espía de escrituras
  sobre las tres consultas.
- **Cómo se ve en producción (no cambia la prueba):** un ticket con el nombre crudo de Zoho tiene `managed_by_app=false` y ninguna
  entrada propia en `ticket_transitions` (`packages/zoho-sync/src/db/repo.ts:298` la marca; `:71` hace que el sync se aparte), así que
  la alarma SLA no lo mide (`apps/desk/server/db/sla.ts:56`) ni antes ni después. Las esperas sí pueden medirlo por la historia de Zoho:
  un ticket así puede recibir su primer aviso de espera tras desplegar, como su gemelo.

## Catálogo

- **Fuente:** `docs/analisis-tickets/Tickets.csv` (trackeado según el encargo y el inventario; hipótesis no re-medida sin `git ls-files`).
  Cabecera con «Estado» en la sexta columna (`docs/analisis-tickets/Tickets.csv:1`); los dos espacios en `:13` y `:21`. **No es la lista
  completa de Zoho (S-6).**
- **Lector:** se reutiliza `leerRegistros` (`apps/desk/server/encuesta/analizarRespuestas.ts:54`, RFC 4180: comas y saltos dentro de
  comillas) y la retirada del BOM de `apps/desk/server/comparacion/leerExportacion.ts:42`, `:51`. Por eso la prueba va en
  `apps/desk/server/estadosZohoCatalogo.test.ts` (nuevo) y no en `packages/shared`.
- **Afirma:** el fichero contiene `Notificación  Comercial`; cada valor distinto, normalizado, está en `ESTADOS`
  (`packages/shared/src/estados.ts:112`, los 26 de `:59-106`); ningún valor trae tabulador ni NBSP (S-1). En
  `packages/shared/src/normalizarEstado.test.ts`: los 26 nombres, todo `from`/`to` de `CATALOGO_POR_FLUJO`
  (`packages/shared/src/flujos.ts:19-22`) y de `TRANSICION_REMISION_*` (`packages/shared/src/transitions.ts:150-151`) y todo estado de
  `COLUMNS` (`packages/shared/src/columns.ts:10-35`) son puntos fijos.
- **Regla de mutación 2:** un caso permanente pasa al mismo comprobador el texto del CSV más una fila con `Estado ajeno` y exige que lo
  devuelva. M7 lo repite a mano sobre una COPIA en el directorio temporal, nunca sobre el fichero trackeado.

## Mutaciones

| # | Edición exacta | Se pone rojo | Se restaura |
|---|---|---|---|
| M1 | `packages/zoho-sync/src/db/mappers.ts:47` vuelve a `status: raw.status as string` | `estadoNormalizado.test.ts` (sincronización guarda un espacio) | Deshacer la línea |
| M2 | `packages/zoho-sync/src/db/repo.ts:139` vuelve a `row: row as TicketRow` | Aceptación L1: lista, columna y botones | Deshacer |
| M3 | `packages/zoho-sync/src/db/repo.ts:209` vuelve a `row: row as TicketRow` | Aceptación L1: `409` en vez de `200`, detalle crudo | Deshacer |
| M4 | `apps/desk/server/db/esperasVencidas.ts:30`: el `WHERE` vuelve a `status IN (…)` (el `SELECT` sigue normalizado) | Aceptación L3: falta el gemelo con espacios. M4b opcional: `apps/desk/server/db/sla.ts:89`, rojo en la alarma | Deshacer |
| M5 | `normalizarEstado` sin `.replace(/^ +| +$/g, '')` | Unitaria de extremos, aceptación L2 (` Anulado`) y, en CI, la integración. **No el catálogo** (ver desvíos) | Deshacer |
| M6 | `normalizarEstado` añade `.toLowerCase()` | Unitaria («mayúsculas no se tocan»), puntos fijos y catálogo | Deshacer |
| M7 | Copia del CSV con una fila `Estado ajeno`, apuntando la ruta de la prueba a la copia | `estadosZohoCatalogo.test.ts` | Ruta original; la copia se borra |

**Regla de mutación 1:** no aplica. Ninguna guarda cambia de sitio: el fichero de las guardas no cambia, y lo único que cambia es el
valor que se lee antes de todas ellas, en `apps/desk/server/services/ticketService.ts:124`; que deje de salir el `409` de `:126` es el arreglo.

## Regla 13 / mutación 3: decisiones del cliente sobre el estado

| Decisión | Cliente | Servidor que la impone o dato que consume |
|---|---|---|
| Columna del tablero | `apps/desk/src/board.ts:9` | Vista; consume `packages/zoho-sync/src/db/repo.ts:139` vía `apps/desk/server/routes/tickets.ts:114-115` |
| Botones de transición | `apps/desk/src/components/TransitionPanel.tsx:56` | `apps/desk/server/services/ticketService.ts:126`, sobre el mismo valor (`packages/zoho-sync/src/db/repo.ts:209`) |
| Ejecutor de la salida de espera | `apps/desk/src/components/TransitionPanel.tsx:57` | `apps/desk/server/services/ticketService.ts:131` |
| Orden de motivos de anulación | `apps/desk/src/components/TransitionPanel.tsx:163` | Sólo orden; el motivo lo valida `apps/desk/server/services/ticketService.ts:134` |
| «En espera» en la vista | `apps/desk/src/lib/boardView.ts:39` | Vista; consume `packages/zoho-sync/src/db/repo.ts:139` |
| Panel de reasignar | `apps/desk/src/components/PanelReasignar.tsx:30` | `apps/desk/server/routes/reasignacion.ts:29`, sobre `apps/desk/server/db/reasignaciones.ts:18` (L2) |
| Botón «Crear remisión» | `apps/desk/src/lib/botonRemision.ts:31` | **Ninguna línea por estado**: `apps/desk/server/routes/remision.ts` no consulta el estado (búsqueda sin resultados). Hallazgo previo, no lo introduce ni lo cambia este cambio |
| Hermanos | `apps/desk/src/components/TicketDetailView.tsx:45` | Vista; los dos lados de `packages/zoho-sync/src/db/repo.ts:139` y `:209` |
| Espera en la ficha de cliente | `apps/desk/src/components/ClienteDetalle.tsx:36` | Vista; consume `apps/desk/server/db/directory.ts:26` (L2) |
| Colores | `apps/desk/src/components/ClienteDetalle.tsx:41`, `apps/desk/src/components/TicketCard.tsx:26` | Color (IV-9); sin decisión |

**Ningún fichero de `apps/desk/src` cambia.**

## Escrituras, S-4 y S-5

- **S-4:** `writeTransition` sólo inserta `fromStatus` (`packages/zoho-sync/src/db/repo.ts:276-319`, uso único en `:317`): no lo compara
  con nada, así que funciona igual con el valor normalizado. Las filas viejas no se tocan.
- **S-5:** con la lectura normalizada de `apps/desk/server/db/migracionTicketsAbiertos.ts:36`, un ticket con dos espacios es «identidad».
  `apps/desk/server/db/migracionTicketsAbiertos.ts:74` y `:81` guardan `estado_previo` y `from_status` normalizados, y `:81` deja `to_status` NULL
  porque destino y origen coinciden (D-6 intacto). `apps/desk/server/db/migracionTicketsAbiertos.ts:85-88` escribe el nombre del catálogo: es la
  escritura planificada de la migración, no un `UPDATE` cuyo fin sea normalizar.
- **Pruebas existentes:** ninguna siembra un estado con espacios de más esperando otro resultado (búsqueda en `*.test.ts`). `Estado raro`
  normaliza a sí mismo, así que `apps/desk/server/db/migracionTicketsAbiertos.test.ts:107` y
  `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:119` siguen igual. `packages/shared/src/migracionTickets.test.ts:73` prueba la
  función pura con `Entregado ` y sigue en verde (la regla va en el lector, no en `equivalenciaDeEstado`).

## Disciplina de líneas y regla de mutación 4

Recuento: `grep -rnoE "<ruta>:[0-9]+"` sobre `*.md`, `*.ts` y `*.yaml`. Todas las ediciones son en sitio (misma línea física; las
importaciones se añaden a una importación que ya existe) o líneas al final; **ninguna línea se mueve en ningún fichero**.

| Líneas que cambian (en sitio) | Citas del fichero |
|---|---|
| `packages/shared/src/index.ts`: una línea nueva tras la última (la 53) | 41 |
| `packages/zoho-sync/src/db/mappers.ts:2`, `:47` | 71 (patrón `mappers.ts:`) |
| `packages/zoho-sync/src/db/repo.ts:129`, `:139`, `:209` | 279 |
| `apps/desk/server/db/directory.ts:2`, `:26` | 13 |
| `apps/desk/server/analisis.ts:2`, `:20` | 28 |
| `apps/desk/server/indicadores.ts:2`, `:66` | 118 |
| `apps/desk/server/db/reasignaciones.ts:2`, `:18` | 18 |
| `apps/desk/server/db/informeContrato.ts:4`, `:45` | 12 |
| `apps/desk/server/db/migracionTicketsAbiertos.ts:5`, `:36` | 60 |
| `apps/desk/server/db/estadoPorRemision.ts:11`, `:40` | 28 |
| `apps/desk/server/db/relojSla.ts:3`, `:45`, `:58` | 11 |
| `apps/desk/server/db/sla.ts:2`, `:45`, `:89` | 84 |
| `apps/desk/server/db/alarmasAvisadas.ts:2`, `:21` | 19 |
| `apps/desk/server/db/esperasVencidas.ts:2`, `:30`, `:37`, `:42` | 1 |
| `apps/desk/server/testing/appHarness.ts:2`, `:36` | 82 |
| Los cinco `*.test.ts` de pg-mem: dos líneas por fichero (las de «pg-mem») | 21 entre los cinco |
| `apps/desk/server/db/informeContrato.test.ts`: bloque añadido al final | 32 (con `relojSla.test.ts`) |

Nuevos: `packages/shared/src/normalizarEstado.ts`, `packages/shared/src/normalizarEstado.test.ts`,
`packages/zoho-sync/src/db/estadoNormalizado.test.ts`, `apps/desk/server/estadosZohoCatalogo.test.ts`,
`apps/desk/server/normalizarEstadosZoho.test.ts`, `apps/desk/server/testing/pgMemEstado.ts`, `apps/desk/server/testing/pgMemEstado.test.ts`,
`apps/desk/server/db/normalizarEstado.integration.test.ts`.

**Citas vivas de líneas cuyo CONTENIDO cambia, a revisar en el cierre:**
- `openspec/specs/tickets-core/spec.md:2129` dice que la sincronización copia el estado «verbatim»: deja de ser cierto (desvío 3).
- La consecuencia (2) de `decision/e249-normalizar-al-leer`, que cita `packages/zoho-sync/src/db/mappers.ts:47` (la sincronización usa la función): sigue siendo cierta.
- `openspec/specs/zoho-sync/spec.md:936` cita `entradasActuales` por su rango de la consulta y el filtro; cambia una línea de dentro (la
  subconsulta), y la frase, que sólo nombra la función, sigue siendo cierta.
- `openspec/specs/zoho-sync/spec.md:226` cita el filtro de `estadoPorRemision`, que no cambia (cambia la línea anterior).
- Las citas de la línea 129 de un `repo.ts` en las specs vivas son de `packages/zoho-sync/src/books/repo.ts`, no del de `db`.
- Las de los archivados son caso B (históricas) y no se renumeran. Falta, como siempre, el segundo pase de las abreviadas.

## Lotes de apply (válvula 720, medida = `git diff --shortstat --no-renames` + nuevo sin trackear)

| Lote | Rojo de partida | Contenido | Bruto | ×1,8 |
|---|---|---|---|---|
| L1 | `normalizarEstado.test.ts`, `estadoNormalizado.test.ts`, catálogo y bloque L1 de la aceptación | Módulo, `index.ts`, mapeador, los dos lectores de `repo.ts` (filas 1-3), pruebas | ~360 | ~650 |
| L2 | Bloque L2 añadido a la aceptación y a `informeContrato.test.ts` | Filas 8-15 (ocho ficheros, dos líneas cada uno) | ~190 | ~340 |
| L3 | Bloque L3, `pgMemEstado.test.ts` | Filas 18-21, imitación y sus seis registros, integración | ~280 | ~500 |
| L4 | Cada mutación M1-M7 (no hay código nuevo) | Registro de mutaciones en `apply-progress.md`, barrido de citas | ~80 | ~145 |

L1 es el más justo: si al medirlo pasa de 400 brutas, el catálogo se muda a L2. La tabla no empuja L3 por encima de 400.

## Desvíos respecto a la propuesta/spec

1. **`getTicketRow` y `rowToTicket` no se tocan** (`openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md:65`, `:67` los listaba). Filas 5 y 6:
   sin llamador de producción el primero; ya recibe normalizado el segundo; tocarlos taparía M2 y M3.
2. **`etapasDesdeHistoria` no se toca** (`openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md:69`); se normaliza donde se compara (D6, fila 15).
3. **RQ-TC-40 de la spec viva `tickets-core`: su párrafo de igualdad exacta deja de ser cierto.** `openspec/specs/tickets-core/spec.md:2128-2130` en `f5465799`
   la justifica con «Zoho copia el estado verbatim»; desde este cambio la sincronización normaliza y el lector de la migración también (fila 13, S-5),
   así que un `Entregado ` de Zoho llega al núcleo como `Entregado` y pasa a `entregado-a-finalizado`. El escenario del núcleo puro
   (`openspec/specs/tickets-core/spec.md:2188-2191` en `f5465799`) sigue cierto: pide el equivalente al núcleo, que no normaliza. Delta escrito en este intento:
   `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/specs/tickets-core/spec.md`, `## MODIFIED` de RQ-TC-40 con sus 107 líneas; sólo cambia ese párrafo.
   No sube a Gerencia: `decision/e249-normalizar-al-leer` dice «toda lectura del estado» (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`).
4. **El riesgo de la clave de `alarmas_avisadas` con valor crudo previo** (`openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md:146`) **no existe**: los dos únicos escritores
   (`apps/desk/server/services/alarmasSla.ts:46-47`, `apps/desk/server/services/avisoSalidasEsperas.ts:63`) sólo recibieron estados que
   pasaron un filtro exacto (`apps/desk/server/db/sla.ts:45`, `:53`; `apps/desk/server/db/esperasVencidas.ts:30`, `:57`).
5. **M5 no la caza el catálogo** (`openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md:98`): ningún valor de `Tickets.csv` trae espacios en los extremos (hipótesis del
   inventario; la prueba de catálogo lo deja medido). La cazan la unitaria, la aceptación con ` Anulado` y la integración.
6. **S-5, precisión:** la reversión de una identidad sólo restaura `managed_by_app`
   (`apps/desk/server/db/migracionTicketsF1F01.test.ts:171`, `:184`), así que el estado queda con el nombre del catálogo; para la
   aplicación es el mismo estado, como dice la propuesta.

**Inventario corregido** (segunda mano, re-medido):
- cabecera: `normalizar` es `packages/shared/src/flujos.ts:32-34`; la línea 31 es su comentario;
- filas 31-32: el embudo son los lectores de `repo.ts` (filas 2-3), y la consulta de la marca es `apps/desk/server/db/alarmasAvisadas.ts:21`;
  `apps/desk/server/db/colaTaller.ts:22` sólo la llama;
- filas 33-34: las líneas exactas de `sla.ts` están en las filas 18-19; fila 39: el lado de la app no trae espacios por construcción (fila 16);
- fila 44: se normaliza igualmente (fila 14); fila 45: «no le afecta», probado (fila 22); fila 24: `etapasDesdeHistoria` no se toca;
- fila 52: las lecturas son `apps/desk/src/components/TransitionPanel.tsx:56`, `:57` y `:163`; y el inventario no tenía RQ-TC-40 (desvío 3).

## Para Gerencia

Nada sube. El desvío 3 lo resuelve la decisión ya registrada, y su delta ya está escrito. Hallazgo para la bandeja, sin destino: el
botón «Crear remisión» decide por estado sólo en el cliente (`apps/desk/src/lib/botonRemision.ts:31`; regla 13).

## Matriz de amenazas

N/A: no hay enrutado, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Despliegue y vuelta atrás

Sin migración de datos ni DDL. Lo despliega el usuario. Las filas existentes se leen bien desde el primer arranque; las que Zoho
reenvíe se guardan normalizadas por la sincronización normal (S-8: una historia de más por ticket afectado). Vuelta atrás: revertir el
commit de fusión; nada que reparar.

## Preguntas abiertas

- [x] El delta de RQ-TC-40 (desvío 3): escrito por el orquestador en el intento 2, por script y comprobado con `diff` contra el bloque vivo.
