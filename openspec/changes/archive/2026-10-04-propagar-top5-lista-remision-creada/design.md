# Diseño — Propagar el Top 5 a los tickets abiertos y lista de «Remisión creada»

Cambio `propagar-top5-lista-remision-creada` (`tanda: F1B-07`, `cierra: no`). Citas comprobadas contra el worktree
el 2026-10-04. Lo que no se pudo comprobar por lectura lleva la palabra «hipótesis».

## 1 · Enfoque

Cuatro piezas, cuatro lotes, cada uno verde por sí solo:

1. **Marca por fila** `tickets.prioridad_en_app_at`, con el molde exacto de `ov_elegida_en_app_at`
   (`packages/zoho-sync/src/db/repo.ts:73-78`): con la marca, `upsertTicket` saca `priority` de la lista de columnas.
2. **Propagación y reversión** en una transacción con la fila del cliente. El cálculo es puro y vive en `shared`,
   apoyado en `prioridadAlNacer` (`packages/shared/src/contratos.ts:66-69`): una sola fórmula.
3. **Traza al nacer bajo Top 5**, dentro de la transacción del alta, para que la reversión tenga base.
4. **Lista de «Remisión creada»**: el servidor filtra y ordena con el reloj de la alarma (`entradasActuales`,
   `apps/desk/server/db/sla.ts:78-102`); el cliente la enseña como llega.

## 2 · Decisiones

| # | Decisión | Descartado | Razón |
|---|---|---|---|
| D1 | Columna `tickets.prioridad_en_app_at timestamptz`, NULL = manda Zoho. La escribe **sólo** el `UPDATE` de propagación y de reversión | (A) `managed_by_app` en masa; (B) sólo los ya gestionados | S-1 de la propuesta. (A) congela el ticket entero (`decision/e005-iv4-iv11`); (B) incumple «sus tickets abiertos» |
| D2 | Al desmarcar, la marca **se conserva** (el mismo `UPDATE` la renueva) | Vaciarla | S-2. Un solo molde de escritura; vaciarla es una línea |
| D3 | `ajustarPrioridad` (`apps/desk/server/db/prioridadCliente.ts:91-96`) **no se toca**: sigue con `managed_by_app = true` | Migrarlo a la marca nueva | Nadie lo pidió y cambiaría comportamiento probado (`apps/desk/server/prioridadTop5.test.ts:320`). El alta tampoco escribe la marca: el ticket nace con `managed_by_app = true` (`repo.ts:420-421`) |
| D4 | El `UPDATE` de propagación fija `priority`, `prioridad_en_app_at = now()`, `updated_at = now()`. **No** toca `managed_by_app`, `source` ni `modified_time` | Copiar el `SET` de `ajustarPrioridad` | Precedente `apps/desk/server/routes/remision.ts:240`. `modified_time` está en `TICKET_COLS` y gobierna «leído» (`repo.ts:139`): moverlo marcaría como no leídos todos los tickets del cliente |
| D5 | «La calculada» = `prioridadAlNacer(base, contratoVigente, top5)`; `top5 = null` al revertir. `base` = el `de` de la **primera** fila de origen Top 5 **posterior a la última reversión**; sin fila, al marcar la base es la prioridad actual y al desmarcar **no se toca** (S-10) | Guardar la base en una columna de `tickets` | La traza ya la contiene; una columna más sería otra cosa que el sincronizador podría pisar |
| D6 | Si la calculada es igual a la actual: ni `UPDATE`, ni traza, ni marca | Traza siempre | Molde D-9 de `ajusteDelCuerpo` (`packages/shared/src/prioridad.ts:71`): una traza sin cambio no dice nada |
| D7 | `public.prioridad_ajustes.origen text`: NULL = manual. Valores `top5`, `top5_revertido`, `top5_al_nacer`, lista en `shared`. **Manual = todo lo que no esté en la lista** (falla cerrado: un origen desconocido exime) | CHECK en la base; tabla nueva | Sin CHECK de lista, como `schema.sql:603-605`. Fallar cerrado es no tocar el ticket |
| D8 | Exento = el ticket tiene **alguna** fila manual, antes o después de propagar | Sólo la última fila | Letra de la decisión: «en ningún caso» |
| D9 | `ALTER COLUMN a DROP NOT NULL`, para revertir a «sin prioridad» | Guardar `''` | **Hay precedente probado**: `schema.sql:306` sobre una columna `NOT NULL` (`schema.sql:273`), y `apps/desk/server/db/remisionesHistoricas.test.ts:200` inserta NULL tras `migrate` (`:8`). Plan B si el primer rojo lo desmiente: guardar `''` en `a` y leerlo como `null` en `ajustesDelTicket` |
| D10 | Lecturas fijas (fila del cliente, candidatos, trazas, contratos); escrituras, dos por ticket **cambiado** | `UPDATE … IN` + `INSERT` multifila | Molde de `ajustarPrioridad`. El multifila en pg-mem es hipótesis sin precedente en el repositorio |
| D11 | `ticketService.ts:106` queda **byte a byte**; la traza al nacer entra por un argumento nuevo en `:108` y toma `a` de `input.priority` | Calcular una vez y partir `:106` | 59 citas apuntan a `ticketService.ts:103-108` y varias afirman que `:106` llama a `prioridadAlNacer`. `a` es el valor realmente escrito: no puede divergir |
| D12 | La lista reutiliza `getActiveTickets` + `entradasActuales` y se ordena con una función pura de `shared` | SQL con `ORDER BY` propio | Mismo instante que la alarma por construcción (H5). Molde de `/api/mis-tickets` (`apps/desk/server/routes/prioridad.ts:83-86`) |
| D13 | La lista no filtra por flujo ni por orden de venta (S-7) y devuelve `enEstadoDesde`; **no** se pinta el tiempo en la tarjeta | Tocar `TicketCard.tsx` | Fichero citado en `CLAUDE.md` y `.tsx` sin pruebas. Ordenar por instante de entrada ascendente equivale a ordenar por tiempo transcurrido descendente bajo cualquier reloj monótono, hábil o natural |
| D14 | L2 se parte en L2a y L2b | Un solo L2 | L2 entero mide ~670, por encima de 550 |

## 3 · Esquema

Sólo al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `schema.sql:707`). Ningún comentario puede
llevar punto y coma: `schemaStatements` parte por él (`packages/zoho-sync/src/db/migrate.ts:19-21`).

| Lote | Líneas previstas | Sentencia |
|---|---|---|
| L1 | 708 y 709 comentario; 710 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;` — sin calificar, `tickets` es de `DESK_TABLES` |
| L2a | 711 y 712 comentario; 713 | `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` |
| L2a | 714 | `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;` |

Sin relleno. La marca **no** entra en `TICKET_COLS`.

**Guardián** (`packages/zoho-sync/src/db/migrate.test.ts:374-385`, editado en sitio, cero líneas netas):

| | Hoy | Tras L1 | Tras L2a |
|---|---|---|---|
| `ALTER` totales (`:376`) | 50 | 51 | 53 |
| Calificadas (`:377`) | 27 | 27 | 29 (24 de public + 5 de books) |
| Sin calificar (`:378`) | 23 | 24 | 24 |
| Identidades calificadas (`:385`) | 7 | 7 | 8: entra `public.prioridad_ajustes` |

El título de `:374` se actualiza en la misma línea. El recuento de tablas (`:282-286`) no cambia.

## 4 · Cambios fichero a fichero

### L1 — marca frente al sincronizador (~150)

| Fichero | Cambio | Líneas netas |
|---|---|---|
| `schema.sql` | Líneas 708 a 710 | +3 al final |
| `repo.ts` | `:67` añade `prioridad_en_app_at` al `SELECT`. `:70` añade `prioridad_en_app_at?: unknown` al tipo. `:76-78` pasan a ser tres líneas: `const cols = TICKET_COLS.filter((c) =>` / `!(marcada && (c === 'orden_venta' \|\| c === 'fecha_orden_venta'))` / `&& !(prev?.prioridad_en_app_at != null && c === 'priority'))`. `:71` no se toca y sigue primera | **0** (5 modificadas) |
| `migrate.test.ts` | `:374`, `:376`, `:378` en sitio; prueba «sin relleno» nueva **al final** (tras `:444`), molde de `:432-443` | +12 al final |
| `packages/zoho-sync/src/db/repoPrioridadEnApp.test.ts` | **Nuevo** | ~70 |

### L2a — propagación y reversión (~490)

| Fichero | Cambio | Líneas netas |
|---|---|---|
| `schema.sql` | Líneas 711 a 714 | +4 al final |
| `migrate.test.ts` | `:374`, `:376`, `:377`, `:385` en sitio | 0 |
| `packages/shared/src/prioridadPropagada.ts` | **Nuevo**: `ORIGENES_TOP5`, `MOTIVO_POR_ORIGEN`, `esAjusteManual`, `baseDeTop5`, `cambioPorTop5` | ~50 |
| `packages/shared/src/index.ts` | `export * from './prioridadPropagada'` al final | +1 |
| `packages/shared/src/prioridadPropagada.test.ts` | **Nuevo** | ~75 |
| `prioridadCliente.ts` | **Al final** (tras `:96`): `fijarYPropagarPrioridadCliente`. Nada por encima se mueve | ~50 |
| `routes/prioridad.ts` | `:8` cambia el import; `:44` pasa a `res.json(await fijarYPropagarPrioridadCliente(db, { clientId, top5: cuerpo.top5, prioridad: cuerpo.prioridad, por: user.name }))` | 0 |
| `prioridadTop5.test.ts` | `:179-194` se reescriben conservando 16 líneas | 0 |
| `apps/desk/server/propagarTop5.test.ts` | **Nuevo** | ~190 |

### L2b — traza al nacer y lo que se enseña (~180)

| Fichero | Cambio | Líneas netas |
|---|---|---|
| `prioridadPropagada.ts` y su prueba | `baseAlNacer(pedida)` = `prioridadAlNacer(pedida, false, null)` | +8 y +20 |
| `prioridadCliente.ts` | Al final: `baseSiNaceBajoTop5(db, clientId, pedida)` → `{ de } \| null`. En sitio: `:76` (`a: string \| null`, `origen: string \| null`), `:80` (añade `origen` al `SELECT`), `:81` (mapea los dos) | +12 |
| `apps/desk/server/services/equipoNuevo.ts` | `:84` añade `alNacer?: { de: string \| null } \| null`. `:90` añade tras el `createTicket`: `; if (alNacer && alNacer.de !== input.priority) await q.query(INSERT …)` con `origen 'top5_al_nacer'`, `a = input.priority`, `ajustado_por = input.actor` | **0** |
| `apps/desk/server/services/ticketService.ts` | `:5` añade `baseSiNaceBajoTop5` al import existente. `:108` añade el argumento `, await baseSiNaceBajoTop5(db, clientId!, b.prioridad)`. `:106` intacta | **0** |
| `apps/desk/server/trazaTop5AlNacer.test.ts` | **Nuevo** | ~70 |
| `apps/desk/src/api/client.ts` | `:713` añade `ticketsCambiados?: number`; `:715` pasa a `a: string \| null; origen?: string \| null` | 0 |
| `Top5Panel.tsx` (`:28`), `PanelPrioridad.tsx` (`:55`) | Enseñar el recuento; `{a.a ?? 'sin prioridad'}` | ~+3 |

L2a es verde sin L2b: un ticket nacido bajo Top 5 no tiene base y al desmarcar no se toca (prueba en L2a que L2b
**invierte**, criterio 8).

### L3 — la lista (~255)

| Fichero | Cambio | Líneas netas |
|---|---|---|
| `packages/shared/src/listaPorEntrada.ts` + prueba | **Nuevo**: `ordenarPorEntrada(xs)` — instante ascendente, `null` al final, empate por `number` | ~15 + ~35 |
| `index.ts` de `shared` | Un `export` al final | +1 |
| `apps/desk/server/db/listaRemisionCreada.ts` | **Nuevo** | ~25 |
| `routes/prioridad.ts` | `GET /api/remision-creada` **al final**, tras `:86`; import en sitio en `:9` | +8 |
| `apps/desk/server/listaRemisionCreada.test.ts` | **Nuevo** | ~90 |
| `apps/desk/src/lib/boardView.ts` | `:15` → `{ key: 'mios', label: 'Mis Tickets' }, { key: 'remision_creada', label: 'Equipos en Remisión creada' },`. `:53` → `case 'todos': case 'remision_creada': return tickets` | **0** |
| `boardView.test.ts` | Pruebas nuevas al final (tras `:145`) | +18 |
| `App.tsx` | `:16` import; `:69` → `(view === 'mios' ? fetchMisTickets() : view === 'remision_creada' ? fetchRemisionCreada() : fetchActiveTickets())` | 0 |
| `Sidebar.tsx` | `:10` → `'Mis Tickets', 'Equipos en Remisión creada',` | 0 |
| `client.ts` | `fetchRemisionCreada()` al final del fichero | +5 |

Cada estimación incluye `apply-progress.md` (~35 a 60) y las casillas. Suma ~1.075: la propuesta decía ~770.

## 5 · Contratos

```ts
// packages/shared/src/prioridadPropagada.ts
export const ORIGENES_TOP5 = ['top5', 'top5_revertido', 'top5_al_nacer'] as const
export interface TrazaDePrioridad { de: string | null; origen: string | null }
export function esAjusteManual(origen: unknown): boolean            // todo lo que no esté en la lista
export function baseDeTop5(filas: readonly TrazaDePrioridad[]): { de: string | null } | null
export function cambioPorTop5(x: {
  actual: string | null; filas: readonly TrazaDePrioridad[]; contratoVigente: boolean; top5: PrioridadAsignable | null
}): { de: string | null; a: string | null; origen: 'top5' | 'top5_revertido' } | null
```

`cambioPorTop5`, en este orden: (1) alguna fila manual → `null`; (2) `b = baseDeTop5(filas)`; al desmarcar sin `b`
→ `null`; (3) `a = prioridadAlNacer(b ? b.de : actual, contratoVigente, top5)`; (4) `a === actual` → `null`.

`fijarYPropagarPrioridadCliente(db, a, hoy?)`, todo sobre el `q` de `enTransaccion`
(`apps/desk/server/db/transaccion.ts:13-28`):

    1  fijarPrioridadCliente(q, a)                                         INSERT … ON CONFLICT
    2  SELECT id, priority FROM tickets WHERE client_id = $1
         AND (status_type <> 'Closed' OR status_type IS NULL)              «abierto» = repo.ts:151
    3  SELECT ticket_id, de, origen FROM prioridad_ajustes
         WHERE ticket_id IN (SELECT id FROM tickets WHERE client_id = $1) ORDER BY id
    4  hayContratoVigente(q, clientId, hoy)                                apps/desk/server/db/contratos.ts:79
    5  por cada ticket con cambioPorTop5 ≠ null:  UPDATE tickets …  +  INSERT prioridad_ajustes (…, origen)

Devuelve `{ ...fila, ticketsCambiados }`. `top5` de la llamada es `prioridadTop5(fila)`. El subselect de la
consulta 3 tiene precedente en pg-mem (`apps/desk/server/db/sla.ts:89`).

Lista: `GET /api/remision-creada` → `Array<Ticket & { enEstadoDesde: string | null }>`, molde del tipo de retorno
de `apps/desk/server/db/colaTaller.ts:21`. Dos lecturas fijas: `getActiveTickets` filtrado por
`STATUS_REMISION_CREADA` (`packages/shared/src/transitions.ts:144`) y `entradasActuales`.

## 6 · Pruebas (`strict_tdd`)

| Lote | Prueba | Tipo | Qué la hace fallar hoy |
|---|---|---|---|
| L1 | Recuento del guardián 51/27/24 | ROJO | `schema.sql` tiene 50 |
| L1 | Con la marca, `upsertTicket` con otra prioridad no la cambia; `subject` sí; `managed_by_app` sigue `false` | ROJO | `repo.ts:76-78` no filtra `priority` |
| L1 | Las dos marcas a la vez: orden y prioridad protegidas, `subject` cambia | ROJO | ídem |
| L1 | Sin marca, Zoho manda; `managed_by_app = true` gana con la marca puesta (gemela de `repo.test.ts:318`); la marca no está en `TICKET_COLS` | CARACTERIZACIÓN | — |
| L1 | La `ALTER` no rellena filas previas y es la única sentencia que nombra la columna | ROJO | La columna no existe |
| L2a | `cambioPorTop5`: tabla de casos (marcar, cambiar, desmarcar, contrato + `Low` → `High`, exento antes y después, origen desconocido exime, sin base, ciclo) | ROJO | La función no existe |
| L2a | **TC24-14 invertida**: dos `Low` quedan `High`, una fila `top5` por ticket con `de`, `a`, autor, fecha | INVERSIÓN | `routes/prioridad.ts:44` sólo escribe la fila del cliente |
| L2a | **TC24-15 invertida**: ticket `Low`, marcar `High`, desmarcar → `Low` con fila `top5_revertido`. El caso de hoy (ya era `High`) pasa a prueba nueva: sin cambio y sin traza (D6) | INVERSIÓN | ídem |
| L2a | Cerrados y cliente ajeno intactos; reversión a NULL; `managed_by_app` no cambia; sobrevive a `upsertTicket`; nacido bajo Top 5 sin base no se toca | ROJO | ídem |
| L2a | «Abierto» enfrentado a `getActiveTickets` sobre el mismo juego de datos (H5) | ROJO | ídem |
| L2a | Atómico, molde de `prioridadTop5.test.ts:333`: falla el `INSERT` de la traza → `BEGIN, INSERT, SELECT, SELECT, SELECT, UPDATE, INSERT, ROLLBACK`, todo `tx:` | ROJO | No hay transacción |
| L2a | Mismas lecturas con 1 y con 5 tickets | ROJO | — |
| L2a | 403 con tickets que propagar: siguen `Low`, sin traza | ROJO tras la mutación M3 | — |
| L2b | Nace bajo Top 5 con prioridad distinta de la pedida: fila `top5_al_nacer`, `de` = pedida; desmarcar la devuelve (criterio 8) | ROJO | `equipoNuevo.ts:90` no escribe traza |
| L2b | Nace sin Top 5, o con Top 5 igual a la pedida: sin fila; `GET` del ticket trae `origen` | ROJO y CARACTERIZACIÓN | — |
| L3 | Orden del más antiguo al más reciente; sin entrada, al final; cuenta la **última** entrada | ROJO | La ruta no existe |
| L3 | Mismo instante que `ticketsConSlaVencido` para el mismo ticket (H5); incluye los que tienen orden de venta; 401 sin sesión; cualquier área lee | ROJO | ídem |
| L3 | `applyBoardView(…, 'remision_creada')` no filtra ni reordena; etiqueta y `FUNCTIONAL_BY_LABEL` | ROJO | Cae en `default` (`boardView.ts:54`) y devuelve vacío |

Las de `apps/desk/server/services/ticketService.test.ts:1154` y `:1160` no se tocan.

## 7 · Mutaciones a reproducir a mano

| # | Regla | Qué se cambia | Qué cae |
|---|---|---|---|
| M1 | 1 | `repo.ts:71` se mueve debajo del `await db.query` de `:89-93` | «`managed_by_app` gana con la marca de prioridad» (L1) |
| M2 | — | En `repo.ts:78`, `c === 'priority'` → `c === 'prioridad'` | Las dos ROJAS de L1 |
| M3 | 1 | La llamada de `routes/prioridad.ts:44` se sube encima de la guarda de `:40`, con valores fijos | «403 con tickets que propagar» (dos condiciones a la vez) |
| M4 | 1 | En `fijarYPropagarPrioridadCliente`, `fijarPrioridadCliente(q, …)` → `(db, …)` antes de `enTransaccion` | La atómica: aparece `pool:INSERT` |
| M5 | 1 | En `baseDeTop5`, buscar en todas las filas en vez de tras la última reversión | Ciclo marcar, desmarcar, transición a `Medium`, marcar, desmarcar: da `Low` en vez de `Medium` |
| M6 | — | En `cambioPorTop5`, quitar el paso (1) | Exención, antes y después de propagar |
| M7 | 2 | Datos: insertar en `prioridad_ajustes` una fila con `origen` NULL y otra con `origen = 'otro'` | Sin tocar código: los dos tickets quedan exentos. Con `esAjusteManual` mutado a `origen == null`, cae el segundo |
| M8 | 2 | `schema.sql`: `ALTER TABLE prioridad_ajustes ADD COLUMN IF NOT EXISTS x text;` sin calificar | `migrate.test.ts:332` y `:345` |
| M9 | 2 | `schema.sql`: `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS x text;` | `migrate.test.ts:332` |
| M10 | 2 | `schema.sql`: `UPDATE tickets SET prioridad_en_app_at = now();` | «Sin relleno» de L1: dos sentencias en vez de una |
| M11 | — | En `ordenarPorEntrada`, invertir el signo | Orden de la lista |
| M12 | — | En `boardView.ts:53`, quitar `case 'remision_creada':` | `tsc` en `:59` y la prueba de la vista |

## 8 · Regla invariable 13

| Decisión | Quién la impone | Línea del servidor |
|---|---|---|
| Quién marca o desmarca | Servidor, probado | `routes/prioridad.ts:40` |
| Qué tickets se tocan | Servidor; el cliente no envía tickets | Consultas 2 y 3 de `fijarYPropagarPrioridadCliente` (nueva, al final de `prioridadCliente.ts`) |
| Qué prioridad toma cada uno | `shared`, consumida | `cambioPorTop5` → `packages/shared/src/contratos.ts:66-69` |
| Que el sincronizador no la pise | Servidor | `repo.ts:76-78` |
| La traza al nacer | Servidor | `equipoNuevo.ts:90` |
| Orden y contenido de la lista | Servidor | `listaRemisionCreada` + `ordenarPorEntrada` (nuevas) |
| «Habilitar Servicio» desde la lista | Servidor, probado | `ticketService.ts:126-131` |

El cliente sólo enseña: el recuento de tickets cambiados, el origen de cada traza y la vista. `boardView.ts:53`
devuelve lo recibido sin decidir nada.

## 9 · Paquete de despliegue

- **Esquema:** las tres sentencias del §3, que aplica la migración al arrancar. Sin relleno.
- **Condición:** los Top 5 ya marcados no se propagan solos; se propaga al volver a guardarlos.
- **Comprobaciones de persona** (dueño Comercial, fuera del recuento de tareas): las cinco del §14 de la propuesta,
  más: (6) un ticket creado para un cliente Top 5 vuelve a su prioridad al desmarcarlo; (7) tras propagar, los
  tickets del cliente **no** aparecen como no leídos.

## 10 · Matriz de amenazas

N/A: no hay comandos de shell, subprocesos, automatización de control de versiones ni clasificación de ejecutables.
La única ruta nueva es un `GET` HTTP detrás de `requireAuth`.

## 11 · Barrido de cierre (regla de mutación 4)

`git diff --numstat` con inserciones = borrados en `repo.ts`, `boardView.ts`, `ticketService.ts`, `equipoNuevo.ts`,
`App.tsx` y `Sidebar.tsx`. Aun sin desplazamiento, se lee qué **afirma** cada cita sobre `repo.ts:64-95` (56),
`equipoNuevo.ts:80-99` (32) y, contadas juntas, `boardView.ts`, `prioridadCliente.ts` y `routes/prioridad.ts` (279
citas completas en 52 ficheros, con `openspec/changes/archive/` incluido): las que digan
que `:76-78` sólo filtra la orden de venta, o que `FUNCTIONAL_VIEWS` tiene seis claves, pasan a caso B.

## 12 · Preguntas abiertas

Ninguna bloquea. Para `docs/sdd/ENTRADA.md`, además de las cuatro de la propuesta:

- **E-nueva-5** · ¿La lista debe enseñar el tiempo transcurrido en cada tarjeta (D13)?
- **E-nueva-6** · Una prioridad escrita por una transición entre marcar y desmarcar se pierde al revertir, que
  vuelve a la base (consecuencia de S-4 y D5). ¿Es lo querido?
