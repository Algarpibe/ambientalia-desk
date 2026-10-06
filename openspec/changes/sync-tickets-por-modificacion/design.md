# Diseño: sincronizar los tickets por fecha de modificación (`fuera-del-plan`, `cierra: no`)

## Enfoque técnico

`syncRecent` deja de leer la página 1 por `-recentThread` y pasa a: (1) calcular una marca de agua con los tickets de
origen Zoho, (2) pedir a `/tickets/search` los modificados desde la marca menos un solape, **sólo como índice de
identificadores**, (3) releer cada ticket por detalle y persistirlo con el `persistTicket` de hoy
(`packages/zoho-sync/src/sync.ts:112-123`). Sin marca, o si la búsqueda falla, el ciclo hace exactamente lo de hoy. El
cuerpo nuevo vive en una función al **final del fichero**; `syncRecent` conserva sus cinco líneas. No cambian `Sync`
(`sync.ts:14-24`), `Deps` (`:9-13`), `upsertTicket`, el esquema ni la configuración.

## Decisiones de arquitectura

| Tema | Opciones | Decisión y razón |
|---|---|---|
| Forma de la respuesta de búsqueda | (a) persistirla; (b) índice de ids + detalle | **(b).** La respuesta real del 2026-10-06 trae todo lo que lee `ticketRowFromZoho` (`packages/zoho-sync/src/db/mappers.ts:43-57`: `customFields`, `description`, `closedTime`, `onholdTime`, `dueDate`, `accountId`…), pero se obtuvo por el conector de la sesión; que el endpoint crudo con el token del worker devuelva lo mismo es **hipótesis**. Con (a), si faltara `customFields`, `mappers.ts:55-57` pondría a `null` todas las columnas promovidas y `upsertTicket` las escribiría. Con (b) sólo se depende de `id`; el detalle es la misma petición que `syncTicket` usa en producción (`sync.ts:179`) |
| Coste de (b) | — | Por ciclo: `⌈N/100⌉` búsquedas (mínimo 1; una más si N es múltiplo de 100) + **N** detalles + contactos y cuentas no vistos en el proceso (`sync.ts:64-66`). N = modificados en la ventana; en régimen, los de los últimos 15 minutos, repetidos hasta cinco ciclos. Hoy: 1 petición de lista y 100 `upsert` por ciclo. Corren dos ciclos (`apps/hub-sync/src/hubSync.ts:93`, `apps/desk/server/index.ts:88`): el coste se duplica, como hoy |
| Marca de agua | `max` con `WHERE` / `ORDER BY … LIMIT 1` | `SELECT max(modified_time) AS m FROM tickets WHERE id NOT LIKE $1 AND managed_by_app = false`, con `` `${PREFIJO_TICKET_APP}%` `` (`packages/shared/src/transitions.ts:124`). Sin subconsultas: `max` como `sync.ts:245` y `NOT LIKE $1` como `:307-310`. `managed_by_app` es `NOT NULL DEFAULT false` (`packages/zoho-sync/src/db/schema.sql:41`). Que pg-mem acepte `max` con ese `WHERE` es hipótesis; si no, la forma equivalente es la de `:307-310` con `modified_time IS NOT NULL … LIMIT 1`. Lo decide la primera prueba roja |
| Por qué las dos exclusiones | — | Los tres escritores de `modified_time` con reloj propio marcan la fila: `packages/zoho-sync/src/db/repo.ts:298`, `repo.ts:420` (alta en la app) y `apps/desk/server/db/prioridadCliente.ts:93`. Barrido `modified_time\s*=` sobre `apps/` y `packages/`: no hay más. El resto de filas sólo recibe el `modifiedTime` de Zoho por `upsertTicket` |
| Sin marca (`m` nulo) | — | Página 1 por `-recentThread`, **sin** error en el log: es el camino de hoy y el de la réplica vacía |
| Solape | — | `SOLAPE_MODIFICADOS_MS = 15 * 60_000`, constante con nombre al final del fichero. `desde = marca − solape` |
| `<hasta>` | futuro lejano / `ahora` | `hasta = max(Date.now(), marca)`. No depende de que Zoho acepte un final futuro (hipótesis). Un reloj del worker atrasado sólo **retrasa** los últimos cambios; nunca los pierde, porque la marca viene de fechas de Zoho. El `max` evita un rango invertido |
| Petición | — | `/tickets/search?` + `URLSearchParams({ departmentId, modifiedTimeRange: '<desde>,<hasta>', sortBy: 'modifiedTime', from, limit: '100' })`. Fechas con `toISOString()` (`yyyy-MM-ddTHH:mm:ss.SSSZ`). La coma codificada ya funciona en producción (`include: 'contacts,assignee'`, `sync.ts:139`). `from` = 0, 100, … 900: diez páginas, 1.000 ids |
| Sin resultados | — | `204` o cuerpo vacío: `readData` (`sync.ts:56`) da `{}`, `dataArray` (`:58-60`) da `[]`. Devuelve 0. **No es fallo, no dispara la caída, no escribe en el log** |
| Fallo de la búsqueda | persistir lo recogido / no persistir nada | Respuesta no-OK o excepción en **cualquier** página: `console.error('Zoho /tickets/search <estado>: el ciclo cae a la página 1 por -recentThread')` y se ejecuta la página 1. **De la búsqueda no se persiste nada**: primero se recogen todos los ids y sólo después se lee el detalle. *Se aparta del punto 3 de la propuesta* («la marca avanza hasta ahí»): persistir un prefijo sólo es seguro si Zoho ordena ascendente, y eso es hipótesis; si ordenara al revés, la marca saltaría por encima de lo no recogido. Así no depende del orden, y nunca es peor que hoy |
| Orden de persistencia | el de Zoho / propio | Los ids se deduplican y se ordenan **en código** por el `modifiedTime` de la búsqueda, ascendente y estable. Si el campo faltara (hipótesis), queda el orden de Zoho |
| Fallo de un detalle | aislar todo / cortar | Excepción de red, `429` o `≥ 500`: `console.error` y **se corta** la pasada; lo persistido es un prefijo ascendente, la marca queda en él y el ciclo siguiente continúa. Otro `4xx` o fallo de `persistTicket`: `console.error` (mismo texto que `sync.ts:132`) y **se sigue**. Aislar también el `429` dejaría que los últimos adelantaran la marca por encima de los fallidos |
| Tope de 1.000 | continuar por clave / declarar | Diez páginas llenas: no se pide `from=1000`; `console.error` que nombra el tope. El ciclo siguiente continúa si la marca avanzó. **Límite declarado:** si 1.000 o más tickets comparten una franja de 15 minutos (o el mismo instante), el ciclo siguiente relee los mismos y no progresa; el remedio es `backfillTickets`. Hoy no es alcanzable: la numeración va por el 884 (propuesta, «Intención») |
| Valor devuelto | — | Tickets leídos por detalle y entregados a `persistTicket`; en la caída, lo que devuelve la página 1 (`pageItems.length`, como hoy). Los dos llamadores lo descartan |

## Flujo de datos

    syncRecent ─→ sincronizarModificados
      marca = max(modified_time) origen Zoho ── nula ─→ página 1 (-recentThread)
      búsqueda from=0..900 ── no-OK / excepción ─→ console.error ─→ página 1 (-recentThread)
      ids únicos, ascendentes por modifiedTime
      por id: GET /tickets/{id}?include=contacts,assignee ─→ persistTicket ─→ upsertTicket
              429 / 5xx / red ⇒ corte      otro 4xx / fallo de persistencia ⇒ siguiente

## Colocación (regla de mutación 4)

`sync.ts` tiene 58 citas en 17 ficheros fuera de `openspec/changes/`. **No se mueve ninguna línea.**

| Línea | Hoy | Después |
|---|---|---|
| 173 | `async syncRecent(): Promise<number> {` | igual |
| 174 | `const pageItems = await fetchTicketPage(1, '-recentThread')` | `const paginaReciente = async () => { const p = await fetchTicketPage(1, '-recentThread'); await persistEach(p); return p.length }` |
| 175 | `await persistEach(pageItems)` | comentario de una línea: el cuerpo vive al final del fichero (RQ-ZS-22) |
| 176 | `return pageItems.length` | `return sincronizarModificados({ zohoFetch, db, config, persistTicket, paginaReciente })` |
| 177 | `},` | igual |

Tras la línea 358 se añaden `SOLAPE_MODIFICADOS_MS`, `ModificadosDeps` y `async function sincronizarModificados`
(declaración de función: se iza). Usa `readData`, `dataArray`, `ZohoRecord` y `PAGE_SIZE`, que ya son del módulo.

**Frases que dejan de ser ciertas (barrido de cierre):**

- `docs/sdd/ENTRADA.md:2048` — «sólo trae los cien más recientes (`sync.ts:173-177`)»: caso **C**; se ancla a la
  revisión de partida y se añade qué lo cerró.
- `proposal.md:15` y `:65` de este cambio: describen el «antes»; se anclan a la revisión de partida.
- `docs/sdd/F0-00_Baseline_as-built.md:121` ya está anclada a `17ddfec`: caso **B**, no se toca.
- Segundo pase obligado: rangos que **contienen** 173-177 con otros extremos, formas abreviadas, y las dos líneas
  largas que nombran `syncRecent` sin cita (`openspec/specs/zoho-sync/spec.md:743`, `docs/sdd/ENTRADA.md:1270`).
- Siguen ciertas: `openspec/specs/zoho-sync/spec.md:264-265` y el comentario de `apps/hub-sync/src/hubSync.test.ts:154`.

## Interfaces

```ts
const SOLAPE_MODIFICADOS_MS = 15 * 60_000
interface ModificadosDeps {
  zohoFetch: Deps['zohoFetch']; db: Queryable; config: AppConfig
  persistTicket: (t: ZohoRecord) => Promise<void>
  paginaReciente: () => Promise<number>
}
async function sincronizarModificados(d: ModificadosDeps): Promise<number>
```

## Ficheros

| Fichero | Acción | Qué |
|---|---|---|
| `packages/zoho-sync/src/sync.ts` | Modificar | Líneas 174-176 cambian de contenido; bloque nuevo tras la 358 (≈ 55 líneas) |
| `packages/zoho-sync/src/sync.modificados.test.ts` | Crear | Pruebas nuevas (≈ 230 líneas). `sync.test.ts` no se toca |
| `openspec/changes/sync-tickets-por-modificacion/specs/zoho-sync/spec.md` | Crear | Delta (fase de especificación) |

## Estrategia de pruebas (strict_tdd)

Fichero nuevo, pg-mem y `zohoFetch` **enrutado por ruta** (no por orden de llamada), que registra las peticiones. Todas
nacen rojas contra el `syncRecent` de hoy.

| # | Prueba | Mutación que la pone roja |
|---|---|---|
| 1 | Búsqueda devuelve un elemento **recortado** (`id`, `modifiedTime`); el detalle trae el ticket cerrado: la fila queda `Closed`, con `closed_time` y `serial`; no se llama a `/tickets?` | Persistir la respuesta de búsqueda |
| 2 | Forma de la petición: `departmentId`, `sortBy=modifiedTime`, `from=0`, `limit=100`, `desde` = marca − 15 min exacto, `hasta` ≥ marca | Quitar el solape; cambiar `sortBy` |
| 3 | Fila `managed_by_app = true` más reciente no adelanta la marca | Quitar `managed_by_app = false` |
| 4 | Fila `app-…` más reciente no adelanta la marca | Quitar el `NOT LIKE` |
| 5 | Sin marca: página 1 por `-recentThread`, sin búsqueda y sin `console.error` | Tratar la marca nula como fallo |
| 6 | 100 + 3 resultados: `from=0` y `from=100`, 103 detalles | Quitar el bucle |
| 7 | `204` sin cuerpo: devuelve 0, sin caída y sin `console.error` | Tratar vacío como fallo |
| 8 | Búsqueda `403` (y variante con excepción): `console.error` con `/tickets/search` y `403`; se pide y persiste la página 1 | Quitar la caída |
| 9 | Página 2 responde `500`: **ningún** detalle pedido, y caída | **Posición (regla 1):** leer el detalle dentro del bucle de paginación |
| 10 | Ids repetidos y en orden descendente: un detalle por id, pedidos en orden ascendente | Quitar o invertir el orden; quitar la deduplicación |
| 11 | Detalle `429` en el 2.º de 3: el 1.º persiste, el 3.º no se pide | Aislar el `429` |
| 12 | Detalle `404` en el 2.º de 3: el 3.º persiste | Cortar ante cualquier fallo |
| 13 | Colisión de número en uno: el otro persiste; el recuento incluye a los dos | Dejar salir la excepción |
| 14 | Diez páginas llenas (detalles `404`, sin escrituras): no hay `from=1000`; `console.error` del tope | Quitar el tope |

Regla de mutación 2: no aplica (ningún guardián lee un fichero de datos).

**Pruebas existentes — no se tocan.** `packages/zoho-sync/src/sync.test.ts:33-42` y `:55-78` insertan filas sin
`modified_time` (`:34`, `:52`) y `z()` no trae `modifiedTime` (`:10-15`): marca nula, camino de hoy, la primera llamada
sigue siendo `/tickets?…`. `apps/desk/server/ovDiscrepanciaSync.test.ts:37-40` inserta `t1` sin `modified_time`, la
remisión no lo escribe (barrido de arriba) y `zohoTicket` (`:14-16`) tampoco lo trae: las tres pasadas de `:69-79` van
por la página 1. `apps/hub-sync/src/hubSync.test.ts:17` sustituye `syncRecent` entero. A ninguna simulación le llega
`/tickets/search`. Si a una simulación por orden le llegara, devolvería su página como índice y la siguiente respuesta
como detalle: por eso el fichero nuevo enruta por ruta.

## Matriz de amenazas

N/A — sin enrutado, shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables.

## Despliegue

Sin migración ni interruptor. Las tres tareas de persona de la propuesta siguen vigentes (`backfillTickets` una vez,
mirar el log del primer ciclo, comprobar el nº 884).

## Supuestos e hipótesis

- **H-1** El token del worker tiene permiso de búsqueda. Si no, la caída lo dice en cada ciclo.
- **H-2** `sortBy=modifiedTime` es ascendente. Sólo importa al alcanzar el tope de 1.000.
- **H-3** La búsqueda cruda trae `modifiedTime` por elemento. Si no, el orden propio no actúa y rige H-2 en el corte por `429`.
- **H-4** Latencia del índice de búsqueda inferior a 15 minutos, sin medir.

## Riesgos

- Un ticket con `4xx` propio o que no persiste queda atrás cuando la marca lo rebasa en más de 15 minutos; queda en el log. Igual que hoy.
- Tras una parada larga, hasta 1.000 detalles seguidos sin pausa; `zohoFetch` no reintenta ante un `429`, y el corte lo absorbe.
- Los tickets ya marcados `managed_by_app` siguen sin recibir nada de Zoho (`repo.ts:71`), aunque se relean: fuera de alcance.

## Preguntas abiertas

Ninguna bloqueante.
