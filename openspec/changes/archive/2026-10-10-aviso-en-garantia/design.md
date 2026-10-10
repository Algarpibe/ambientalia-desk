# Diseño: aviso «En garantía» y «Garantía sin dato» (F1B-18)

Medido el 2026-10-10 en el worktree `aviso-en-garantia` (base `fc06f7b`). Rutas relativas al worktree. Lo no leído va como
«hipótesis».

## 1. Enfoque técnico

Enfoque A de la propuesta: **una fórmula en `packages/shared`, la marca la calcula el servidor por lote y el cliente sólo
pinta**. Molde exacto: `esperandoAprobacionCliente` (`apps/desk/server/db/alarmasAvisadas.ts:16-35`, adjuntado en
`apps/desk/server/db/colaTaller.ts:24`, pintado en `apps/desk/src/components/TicketCard.tsx:97-103`). No se toca
`packages/zoho-sync/src/db/repo.ts`, `schema.sql`, `transitions.ts`, `estados.ts` ni `ticketService.ts`.

## 2. Decisiones

| Decisión | Elegido | Rechazado | Por qué |
|---|---|---|---|
| D1 · Fin de garantía en el predicado | Sólo cadena `YYYY-MM-DD` real (`esFechaCalendarioReal`, `packages/shared/src/fechasDerivadas.ts:37`); cualquier otra cosa → `sin_dato` | `diaEnZona(finGarantia)` (propuesta, punto 1) | Para una `YYYY-MM-DD` es idéntico (`fechasDerivadas.ts:69`). Pero `diaEnZona` acepta un `Date` o un ISO con zona y los reduce a Bogotá: un `date` de pg es medianoche local, y con el contenedor en UTC (`vitest.config.ts:4-7`) caería el día ANTERIOR. Rechazarlo en el tipo cierra la trampa en vez de documentarla |
| D2 · Normalizar `fin_garantia` en el servidor | `fechaSolo` (`packages/zoho-sync/src/books/repo.ts:94-101`), la misma que ya usa `toFull` (`apps/desk/server/db/equipos.ts:114`) | `toISOString().slice(0,10)`; `diaEnZona(Date)`; cast `::text` en SQL | `fechaSolo` lee con getters locales, correcto para la medianoche local que construye pg. El cast en SQL no está probado en pg-mem (hipótesis) |
| D3 · Consulta por lote | `IN ($1, …, $n)` con marcadores, molde `alarmasAvisadas.ts:20-21`; 0 consultas si no hay equipos | `= ANY($1)` (propuesta) | pg-mem no tipa los arrays enlazados (`apps/desk/server/db/backfillFechaOrdenVenta.ts:49`) |
| D4 · Tipo de la marca | Literal en `Ticket` (`types.ts:37`, en sitio) y `EstadoGarantia = NonNullable<Ticket['garantia']>` en `garantia.ts` | Importar el tipo en `types.ts` | Un `import` nuevo arriba desplazaría todas las líneas de `types.ts` (fichero muy citado) |
| D5 · Error de lectura | Nunca lanza: `logger.warn` y mapa vacío (sin marca), molde `alarmasAvisadas.ts:31-34` | Propagar | La marca no puede tumbar el tablero |
| D6 · `createdAt` ilegible | Predicado devuelve `null` (sin marca) | `sin_dato` | `sin_dato` pide a Comercial completar algo que no es suyo |
| D7 · Equipo referido que no existe | Sin marca | `sin_dato` | No hay hoja de vida que completar (mismo criterio que S3) |
| D8 · Sugerencia en Notificado | Función pura en `shared` (`sugerenciaPorGarantia`) | Lógica en el `.tsx` | Es la única forma de probarla bajo `.tsx` excluidos (F0-00) |

## 3. Contratos

`packages/shared/src/garantia.ts` (nuevo; reexportado con `export * from './garantia'` en la ÚLTIMA línea de
`packages/shared/src/index.ts`):

```ts
import type { Ticket } from './types'
export type EstadoGarantia = NonNullable<Ticket['garantia']>
/** creadoEn: Date o ISO con desplazamiento (lo que acepta diaEnZona, fechasDerivadas.ts:63).
 *  finGarantia: 'YYYY-MM-DD' o nada. null = creación ilegible. */
export function estadoGarantia(creadoEn: unknown, finGarantia: string | null | undefined): EstadoGarantia | null
// dia = diaEnZona(creadoEn); null → null. fin no es YYYY-MM-DD real (trim) → 'sin_dato'.
// dia <= fin (cadenas) → 'en_garantia'; si no → 'vencida'.
export function sugerenciaPorGarantia(status: string, garantia: EstadoGarantia | null | undefined): 'reporte_por_garantia' | null
// 'Notificado' && 'en_garantia' → 'reporte_por_garantia' (transitions.ts:218)
```

`packages/shared/src/types.ts`, **en sitio, sin líneas nuevas**:
- `:37` → `read?: boolean; esperandoAprobacionCliente?: boolean; garantia?: 'en_garantia' | 'sin_dato' | 'vencida' // marcas de vista calculadas por el servidor (RQ-VT-07, F1B-18)`. `TicketDetail` la hereda (`:122`).
- `:362` → `codigoInterno?: string; finGarantia?: string`. `EquipoFull.finGarantia` (`:370`) queda redundante y compatible; no se mueve.

`apps/desk/server/db/garantiaTickets.ts` (nuevo):

```ts
export async function marcasDeGarantia(db: Queryable,
  filas: ReadonlyArray<{ id: unknown; equipo_id?: unknown; created_time?: unknown }>): Promise<Map<string, EstadoGarantia>>
// ids distintos de equipo_id no vacíos; ninguno → Map vacío SIN consultar.
// SELECT id, fin_garantia FROM equipos WHERE id IN ($1..$n)   (desk vía search_path, como equipos.ts:66)
// por fila: estadoGarantia(row.created_time, fechaSolo(fin) ?? null); null o equipo ausente → no entra.
```

Unión ticket→equipo: `tickets.equipo_id` (`packages/zoho-sync/src/db/schema.sql:206`), presente en `row` porque las
consultas de lista y detalle son `SELECT t.*` (exploración 3.1.3). `created_time` llega como `Date` en pg y pg-mem
(`apps/desk/server/db/ticketFuentes.ts:49-50`).

## 4. Puntos de adjunto (servidor), todos en sitio

| Productor | Línea | Cambio |
|---|---|---|
| `colaDelTaller` (`GET /api/tickets` activos/all, `GET /api/mis-tickets`) | `apps/desk/server/db/colaTaller.ts:5` (import), `:23`, `:24` | `:23` añade `; const garantias = await marcasDeGarantia(db, list.map((x) => x.row))`; `:24` añade `garantia: garantias.get(String(row.id))` |
| Cerrados | `apps/desk/server/routes/tickets.ts:9` (import), `:110` | `:110`: calcular `marcas` sobre `items` y esparcir `garantia` en cada `rowToTicket` |
| `listaRemisionCreada` (`GET /api/remision-creada`, `routes/prioridad.ts:92-94`) | `apps/desk/server/db/listaRemisionCreada.ts:5` (import), `:15`, `:16` | igual que la cola |
| Detalle | `apps/desk/server/routes/tickets.ts:143`, `:144` | `:143` añade `; const garantia = (await marcasDeGarantia(db, [found.row])).get(id)`; `:144` añade `garantia` |
| Búsqueda de equipos | `apps/desk/server/db/equipos.ts:66`, `:42` | `,fin_garantia` en el `SELECT`; `finGarantia: fechaSolo(r.fin_garantia)` en `toLite` (`getEquipo`, `:78`, no lo selecciona → `undefined`) |

Sin marca el campo va `undefined` y JSON lo omite. La prueba VT09-9 (`apps/desk/server/misTickets.test.ts:121`) sigue
valiendo: una consulta fija, no N+1.

## 5. Cliente (`.tsx`, sin red de pruebas; lógica en `.ts` probados)

- `apps/desk/src/lib/distintivoGarantia.ts` (nuevo, probado): `distintivoGarantia(estado) → { texto, clase, titulo } | null`.
  `en_garantia` → «En garantía», verde; `sin_dato` → «Garantía sin dato», gris, título «Comercial debe completarlo en la hoja
  de vida»; `vencida`/ausente → `null` (S1, S2, S3).
- `apps/desk/src/components/DistintivoGarantia.tsx` (nuevo): pinta lo anterior; tamaño `sm`/`md`.
- `TicketDetailView.tsx:183` (cabecera, tras «Hoja de vida del equipo») y `:335` (`garantia={ticket.garantia}` al panel).
- `TicketCard.tsx:103` (tras la marca RQ-VT-07). `TicketList.tsx:29` (junto a `StatusBadge`). `TicketTable.tsx:34` (celda de estado).
- `CreateTicket.tsx:345`: aviso con `estadoGarantia(new Date(), equipo.finGarantia)`, sólo para `en_garantia`; informativo.
- `TransitionPanel.tsx:52` (prop `garantia`), `:133` (resaltado si `t.id === sugerenciaPorGarantia(status, garantia)`, sin
  `disabled`), `:137` (línea de texto «Equipo en garantía: se sugiere Reporte por garantía»).
- Imports: añadidos al final de una línea de import existente, sin líneas nuevas.

## 6. Regla 13 / regla de mutación 3

| Decisión del cliente | Tipo | Servidor |
|---|---|---|
| Distintivo en tarjeta, lista, tabla, cabecera | avisa | `colaTaller.ts:23-24`, `routes/tickets.ts:110`, `:143-144`, `listaRemisionCreada.ts:15-16`, vía `garantiaTickets.ts`. El cliente no calcula |
| Aviso en `CreateTicket` | avisa | Ninguna, a propósito (punto 1 de la regla: consume `shared`). El ticket creado recibe la marca de `:143-144` |
| Resaltar «Reporte por garantía» | avisa | Ninguna: no impone (S7). Las tres salidas siguen sujetas a `canExecuteTransition` |
| No pintar con vencida o sin equipo | — | El servidor omite o manda `vencida`; `distintivoGarantia` sólo traduce |

Nada bloquea ni rellena.

## 7. Pruebas (strict TDD, sólo `*.test.ts`)

| Fichero | Casos |
|---|---|
| `packages/shared/src/garantia.test.ts` (nuevo) | G1 `2026-03-16T01:00:00Z` (15/03 20:00 Bogotá), fin `2026-03-15` → `en_garantia`; G2 `2026-03-16T05:30:00Z` (16/03 00:30) → `vencida`; G3 `2026-03-15T15:00:00Z`, fin mismo día → `en_garantia`; G4 fin `2026-03-14` → `vencida`; G5 fin `null`/`undefined`/`''`/`'  '`/`2026-02-30` → `sin_dato`; G6 fin `2026-03-15T00:00:00.000Z` → `sin_dato`; G7 G1 con `Date` → igual; G8 creación sin desplazamiento o `null` → `null`; G9 sugerencia (Notificado+en_garantia sí; otro estado u otra marca no) y que `TRANSITIONS` tiene `reporte_por_garantia` con `from` Notificado |
| `apps/desk/server/db/garantiaTickets.test.ts` (nuevo, `Queryable` falso) | S1 fin `new Date(2026, 2, 15)` + creación G1 → `en_garantia`; S2 sin `equipo_id`, equipo ausente → sin entrada; fin `null` → `sin_dato`; S3 una consulta para N tickets, cero sin equipos; S4 `query` lanza → mapa vacío; S5 (hipótesis) con `process.env.TZ='Asia/Tokyo'` temporal, la medianoche local da `2026-03-15` |
| `apps/desk/server/garantiaListas.test.ts` (nuevo, `testing/appHarness.ts` como `tickets.test.ts:6`) | R1 `GET /api/tickets`: en_garantia, sin_dato, vencida y sin equipo; R2 `?scope=closed`; R3 `GET /api/tickets/:id`; R4 `GET /api/remision-creada`; R5 `GET /api/mis-tickets` |
| `apps/desk/server/db/equipos.test.ts` (al final) | `searchEquipos` devuelve `finGarantia` `YYYY-MM-DD` exacto; ausente si `NULL` |
| `apps/desk/src/lib/distintivoGarantia.test.ts` (nuevo) | textos de S1; `vencida`/ausente → `null` |

**Mutaciones a reproducir (cada una debe poner rojo):**

| Mutación | Rojo en |
|---|---|
| `<=` → `<` en `estadoGarantia` | G3 |
| `diaEnZona(creadoEn)` → `new Date(creadoEn).toISOString().slice(0,10)` | G1 |
| Fin por `diaEnZona` en vez de `esFechaCalendarioReal` | G6 |
| `fechaSolo(fin)` → `diaEnZona(fin)` en `garantiaTickets.ts` | S1 |
| `fechaSolo` → `toISOString().slice(0,10)` | S5 (sólo si Node respeta el cambio de `TZ` en caliente; si no, se anota como no cazable, igual que `repo.ts:91-92`) |
| Invertir `sin_dato`/`vencida` | G4, G5 |
| Quitar el adjunto de cada productor (cuatro mutaciones) | R1/R5, R2, R3, R4 |
| Quitar `fin_garantia` del `SELECT` de `searchEquipos` | prueba de `equipos.test.ts` |
| Mover el cálculo dentro del bucle (N+1) | S3 y `misTickets.test.ts:121` |

Regla de mutación 1 no aplica: no hay guarda nueva. Regla 2 no aplica: no se vigila ningún fichero de datos.

## 8. Ficheros muy citados y barrido (regla de mutación 4)

Todo en sitio: `types.ts:37`, `:362`; `equipos.ts:42`, `:66`; `colaTaller.ts:5`, `:23`, `:24`; `routes/tickets.ts:9`,
`:110`, `:143`, `:144`; `listaRemisionCreada.ts:5`, `:15`, `:16`; `.tsx` en las líneas de §5. Ningún fichero existente gana
líneas salvo los de pruebas (al final) e `index.ts` (al final). Al cierre: `grep -rnoE` de `types\.ts`, `equipos\.ts`,
`colaTaller\.ts`, `routes/tickets\.ts`, `listaRemisionCreada\.ts`, `TicketCard\.tsx`, `TicketDetailView\.tsx`,
`TransitionPanel\.tsx`, `CreateTicket\.tsx`, `TicketList\.tsx`, `TicketTable\.tsx` con `:[0-9]+`, más el pase de abreviadas,
leyendo que cada línea editada siga diciendo lo que afirma su cita.

## 9. `registro.test.ts:218-220`

`enCurso` se ordena con `ordenar` = `[...xs].sort()` (`apps/desk/server/reconciliacion/comprobaciones.ts:59`, `:222`),
orden léxico: `'F1B-13' < 'F1B-18' < 'F1C-05'`. `:218` «ONCE» → «DOCE»; `:220` inserta `'F1B-18'` tras `'F1B-13'`. En el
commit de archivo (`cierra: si` en `archive/`, `comprobaciones.ts:217`) se revierte a ONCE; no hay aserción sobre
«cerradas por archivo» en ese fichero.

## 10. Estimación y lotes

| Pieza | Líneas (diff) |
|---|---|
| `garantia.ts` + `index.ts` + `types.ts` | ~35 + 1 + 4 |
| `garantia.test.ts` | ~90 |
| `garantiaTickets.ts` + test | ~35 + ~90 |
| `garantiaListas.test.ts` | ~110 |
| `equipos.ts`, `colaTaller.ts`, `listaRemisionCreada.ts`, `routes/tickets.ts` | ~26 |
| `equipos.test.ts` | ~15 |
| `registro.test.ts` | 4 |
| Cliente: `distintivoGarantia.ts` + test + `DistintivoGarantia.tsx` + 6 `.tsx` | ~25 + 30 + 25 + 24 |
| `apply-progress.md` y casillas | ~80 |

Total ≈ **595**, bajo la válvula de 720 pero cerca. Lotes si la medida real se acerca: **1** `shared` + servidor +
`registro.test.ts` (~490); **2** cliente (~105).

## 11. Matriz de amenazas

N/A — sin enrutado, shell, subprocesos, automatización VCS/PR ni integración de procesos.

## 12. Migración

Ninguna: la marca se calcula al leer (S8).

## 13. Preguntas abiertas

- [ ] S5: si Node no aplica `process.env.TZ` en caliente dentro del worker de vitest, la mutación `toISOString` sobre `fin_garantia` queda sin detector; se anota, no bloquea.
- [x] `busquedaConfrontacion.test.ts` y `equipos.test.ts` (consumen `searchEquipos`/`toLite`): ninguno usa `toStrictEqual` (barrido del 2026-10-10), así que el `finGarantia: undefined` nuevo no los rompe; `toEqual` ignora propiedades `undefined`.
