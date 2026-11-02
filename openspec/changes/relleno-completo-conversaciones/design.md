# Diseño — `relleno-completo-conversaciones` (1G-01, `cierra: si`)

Entradas: `proposal.md` (S-1 a S-15, vinculantes) y la delta `specs/zoho-sync/spec.md` (RQ-ZS-28; RQ-ZS-29 si la delta lo parte), que se
escribe en paralelo: los nombres de campos (D6) y los códigos (D7) son la propuesta del diseño; si la delta dice otra cosa, manda la delta.
Líneas medidas en este worktree, sobre `a729a371`. Flujo por ticket: detalle fresco (429/404) → `syncTicket(id, detalle)` → `inicio` →
`leerConversaciones` → `guardarYReflejar` → recuento de lo guardado y visible → clase; al final, resumen en memoria y una línea de log.

## D1 · Lo nuevo, en dos ficheros nuevos de `apps/desk/server`; lo citado por número, sólo en sitio

`apps/desk/server/rellenoConversaciones.ts` (la pasada, su estado y su resumen) va junto a su molde, `createDetailBackfiller`
(`apps/desk/server/backfill.ts:29-78`), porque sólo la corre la App: el worker no registra rutas de administración (S-1) y no podría
importarlo sin cruzar de `apps/hub-sync` a `apps/desk`. `apps/desk/server/routes/rellenoConversaciones.ts` lleva las dos rutas y su guarda.
Rechazado: el módulo en `packages/zoho-sync/src/` (al alcance del worker, y tendría que persistir igualmente por `Sync`, D2). Rechazado:
registrar las rutas dentro de `registerAdminRoutes`: su cuerpo cierra en `apps/desk/server/routes/admin.ts:233` y detrás van `:234` e
`interruptorMigracion` (`:245-255`), que la propuesta cita (`:246-249`, `:252`); una ruta dentro las desplaza. El interruptor llega como
`migracionTicketsHabilitada`: booleano leído en `apps/desk/server/app.ts:57` y dependencia del registrador (S-1), como `registerRespaldoRoutes`.

## D2 · Detalle fresco una vez, persistido por la vía de hoy: `syncTicket(id, detalle?)`

La pasada pide el detalle ella misma, por la ruta de `packages/zoho-sync/src/sync.ts:179`, para ver el código HTTP (S-6, S-11) y los
recuentos, y se lo entrega a `syncTicket` como segundo argumento opcional. Tres sustituciones de línea en `sync.ts`, ninguna nueva:

| Línea | Hoy | Queda |
|---|---|---|
| `:18` | `syncTicket(id: string): Promise<void>` | `syncTicket(id: string, detalle?: Record<string, unknown>): Promise<void>` |
| `:178` | `async syncTicket(id: string): Promise<void> {` | `async syncTicket(id: string, detalle?: ZohoRecord): Promise<void> {` |
| `:179` | `const res = await zohoFetch(…)` | `if (detalle) return persistTicket(detalle); const res = await zohoFetch(…)` |

`:180` y `:181` no cambian. Sin `detalle` todo sigue igual (`apps/desk/server/routes/tickets.ts:132`, `:136` y `backfill.ts:46` llaman
con un argumento, y la petición sigue en `:179`, S-5). Con `detalle`, `persistTicket` (`sync.ts:112-123`) hace lo de hoy: contacto y
cuenta (`:86-110`), `upsertTicket` con la guarda de `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:71`) y el aviso de OV que sólo
conecta `apps/desk/server/index.ts:23` (S-7). **Hipótesis** de tipos (la confirma el `typecheck` de L1): ningún literal de `Sync` cambia;
siguen asignables `vi.fn()` (`apps/hub-sync/src/hubSync.test.ts:18`, `apps/desk/server/testing/appHarness.ts:50`) y las funciones con
menos parámetros (`apps/desk/server/backfill.test.ts:25`, `:58`). Rechazadas: (a) devolver el detalle desde `syncTicket`: lanza ante
todo no `ok` (`sync.ts:180`), el 404 saldría del texto del error, y (**hipótesis**) rompe el `typecheck` de `backfill.test.ts:25`, `:58`,
cuyo `vi.fn(async () => {})` da `Promise<void>` (las incluye `apps/desk/tsconfig.server.json:12`); (b) un método nuevo en `Sync`: toca los
literales de `hubSync.test.ts:12-25`, `appHarness.ts:50`, `apps/desk/server/auth/routes.test.ts:18` y `backfill.test.ts:20-31`, `:53-64`;
(c) leer el detalle y llamar después a `syncTicket(id)`: dos peticiones, contra S-5; (d) otro `createSync` con `zohoFetch` con memoria:
pierde o duplica el aviso de OV y las cachés.

## D3 · Conversaciones: la lectura de 1G-01, reutilizada; la verificación, con consulta propia

Por ticket con detalle válido ya persistido: `inicio = instanteBase(db)` (`packages/zoho-sync/src/conversaciones.ts:99-102`) **antes** de
leer; `leerConversaciones(contado, id, { reintentos429: REINTENTOS_429, pausa429Ms })` (`:67-93`, constantes `:23-24`), con `contado`
envolviendo la `zohoFetch` para contar peticiones y `429` (D6); y `guardarYReflejar(db, id, lista, { esperado, marcar, inicio })`
(`:109-140`) con `esperado = esperadoDeZoho(detalle)` (`:50-57`), nunca `tickets.raw` (S-5), y `marcar` = el `MARCAR_CONVERSACIONES_AUSENTES`
que entrega `opcionesConversaciones` (`apps/desk/server/opcionesConversaciones.ts:9-13`): el interruptor nuevo no marca solo (S-8). La
verificación no usa `completa` (`conversaciones.ts:119-120`), que compara lo RECIBIDO: tras guardar y marcar,
`SELECT count(*)::int AS n FROM conversations WHERE ticket_id=$1 AND source='zoho' AND ausente_en_zoho_at IS NULL`; `id` es clave primaria
(`packages/zoho-sync/src/db/schema.sql:46`; la columna, `:852`), así que `n` son ids únicos. Clase, en este orden (S-9): `lista.por429` ⇒
corte (D5); `lista.error` ⇒ con error; `esperado === null` ⇒ sin recuento; `n === esperado` ⇒ completo; si no, descuadrado.

## D4 · Recorrido sobre `desk.tickets`

Al lanzar, una consulta simple: `SELECT id, number FROM tickets ORDER BY number` (`schema.sql:22`); sin subconsulta correlacionada, que
pg-mem no resuelve (`sync.ts:216-217`). El filtro va en código, como `sync.ts:222-224`, pero con el predicado que ya existe,
`nacidoEnLaApp` (`apps/desk/server/db/ticketFuentes.ts:40-42`, sobre `PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`), y
no con otra copia del prefijo. Tramo: `number >= desde` si viene `desde`; dentro, los `app-` se cuentan en `saltadosApp` y se apartan, y
a los de Zoho se aplica `slice(0, limite)`. La lista se fija al lanzar. `recuento({ desde })` hace esa cuenta sin Zoho ni escritura (S-3).

## D5 · `429`, corte, fallos y pausas

- **Detalle** (`/tickets/${id}?include=contacts,assignee`, por `contado`). Guardas por respuesta, en orden: `429` (espera `pausa429Ms` y
  repite la misma petición hasta `REINTENTOS_429`; agotados ⇒ corte); `404` ⇒ no está en Zoho; `!res.ok` ⇒ con error
  (`Zoho /tickets/${id} ${status}`); cuerpo con `isDeleted` o `isTrashed` a `true` o `'true'` ⇒ no está en Zoho. «No está» no persiste,
  no lee ni marca (S-6); que Zoho responda 404 a un borrado es **hipótesis** de la propuesta.
- **Páginas:** las repite `leerConversaciones` (`conversaciones.ts:78-81`); `lista.por429` ⇒ corte, con el detalle ya persistido y lo
  recibido guardado (`:115-118`) sin marcar (`:120` exige `error === null`); relanzar con `desde` repite el ticket entero, por `upsert`.
- **Corte:** `cortadoEn` = `number` del ticket, `enMarcha = false`, resumen al log y fin de la pasada (S-11).
- **Otro fallo** (red, base, `syncTicket` que lanza): con error, `motivoPrimerFallo ??=` (molde `sync.ts:228`, `:238`) y se sigue; si
  falla `syncTicket`, no se leen sus conversaciones. Un fallo fuera del bucle (la consulta inicial) va a `error`.
- **Pausa** `pausaMs` (por omisión `PAUSA_ENTRE_TICKETS_MS`, `conversaciones.ts:26`) antes de cada ticket salvo el primero (molde
  `sync.ts:316`). `pausaMs` y `pausa429Ms` son parámetros con valor por omisión, como `conversaciones.ts:149`: las pruebas pasan 0.

## D6 · Estado y resumen (contrato)

```ts
interface EstadoRelleno { enMarcha: boolean; terminado: boolean; cortadoEn: number | null; error?: string; desde: number | null
  limite: number | null; aRecorrer: number; saltadosApp: number; recorridos: number; peticiones: number; vistos429: number
  cuentas: { completo: number; descuadrado: number; sinRecuento: number; conError: number; noEstaEnZoho: number }
  descuadrados: { numero: number; esperado: number; guardadas: number }[]; sinRecuento: number[]; conError: number[]
  noEstaEnZoho: number[]; motivoPrimerFallo?: string; inicio?: string; fin?: string }   // números de ticket; nunca datos de cliente
crearRellenoConversaciones(d: { zohoFetch; db: Queryable; sync: Pick<Sync, 'syncTicket'>; marcar: boolean; pausaMs?; pausa429Ms?;
  registrar?: (r: EstadoRelleno) => void }) ⇒ { lanzar({ desde?, limite? }): { lanzada: boolean; estado: EstadoRelleno };
  recuento({ desde? }): Promise<{ aRecorrer: number; saltadosApp: number }>; estado(): EstadoRelleno }
```

En memoria, uno por `createApp`. `lanzar` reinicia el estado (molde `backfill.ts:34`) y pone `enMarcha = true` **antes** del primer
`await`; con la pasada en marcha devuelve `{ lanzada: false, estado }` y no lanza otra (S-2). `estado()` devuelve una copia. `peticiones`
y `vistos429` cuentan detalle y páginas; las de contacto y cuenta de `persistTicket` (`sync.ts:90`, `:100`) van por la `zohoFetch` del
`Sync` y no se cuentan. Al terminar o cortarse, `registrar` (por omisión `logger.info({ resumen }, texto)`, `apps/desk/server/util/logger`)
deja UNA línea con recuentos por clase, números de ticket, `peticiones`, `vistos429` y `cortadoEn` (S-10). `motivoPrimerFallo` es el texto
del error (molde `sync.ts:238`): **hipótesis**, que ningún error de Zoho ni de Postgres de esta pasada traiga datos de cliente.

## D7 · Interruptor, cableado y rutas

- `packages/zoho-sync/src/config.ts:66`: antes del `}` del tipo, `; rellenoConversacionesHabilitado: boolean` (y su nota en el
  comentario de la línea); `:125`, antes del comentario: `rellenoConversacionesHabilitado: env.RELLENO_CONVERSACIONES_HABILITADO === 'true',`.
- `apps/desk/server/app.ts`, cuatro sustituciones: `:9` y `:22` añaden las importaciones; `:50` añade
  `; const relleno = crearRellenoConversaciones({ zohoFetch, db, sync, marcar: opcionesConversaciones(config).marcarAusentes === true })`;
  `:57` añade `; registerRellenoConversacionesRoutes(app, { db, relleno, habilitado: config.rellenoConversacionesHabilitado === true })`.
  `opcionesConversaciones` sigue siendo la única lectura de los interruptores de conversaciones (`opcionesConversaciones.ts:5`).
- `POST /api/admin/relleno-conversaciones`: `requireAuth(db), requireSuperAdmin` (`apps/desk/server/auth/middleware.ts:26-29`) y
  `interruptorRelleno(habilitado)` (molde `admin.ts:250-255`): cerrado y `req.query.limite !== '0'` ⇒ `403` que nombra la variable y
  ofrece el recuento; escalón B antes que C (`admin.ts:246-249`), antes de validar. Después: `desde`/`limite`, si vienen, `/^\d+$/` o
  `400`; `limite=0` ⇒ `200` con `recuento` (S-3, molde `admin.ts:199`); si no, `200` con `lanzar(…)`.
- `GET` (misma ruta): las dos guardas de rol y `res.json(relleno.estado())`. Nunca lanza (S-2), al revés que `backfill-details`
  (`admin.ts:54-56`); no lo gobierna el interruptor: leer el estado no escribe.
- `apps/desk/server/testing/appHarness.ts:46` y `:49`, en sitio: la opción `rellenoConversacionesHabilitado`, `false` de partida (`:47-48`).

## D8 · `DEPLOY.md` §21 y sus pruebas

Al final, tras `DEPLOY.md:880`, `## 21. \`RELLENO_CONVERSACIONES_HABILITADO\`: …` con **Qué enciende:**, **Qué se rompe si se pone mal:**,
**Nace cerrado** (`=== 'true'`, `config.ts:125`), la línea `> RELLENO_CONVERSACIONES_HABILITADO=` y los pasos de P-2: copia previa de
`desk-db`; abrir y redesplegar; `?limite=0`; pasada corta (`?limite=20`) y `GET` hasta `terminado`; la completa; si se corta,
`?desde=<cortadoEn>`; marcar sigue en §19. La fija `apps/desk/server/deployRellenoConversaciones.test.ts` (nuevo, molde
`deployConversaciones.test.ts`): orden y última, las dos frases, nace cerrado, línea vacía, copia previa, `limite=0`, `desde=`, la ruta y
la lectura `=== 'true'` en `config.ts`. La §21 pone en rojo `apps/desk/server/deployConversaciones.test.ts:27` (`tramo(s20)` llega al
final). **Desvío de la propuesta §10**, que acota en `:27`: acoto en `:20` (`tramo` sin `hasta` se para en `## 21. `) y `:23` pasa a «va
hasta la §21», en sitio, porque `:42` y `:43` también leen `tramo(s20)` y la §21 llevará «Copia previa de `desk-db`»: acotando sólo `:27`,
quitar esa frase de la §20 seguiría en verde (regla de mutación 2). `.env.example` no se toca (P-1).

## D9 · `debt.md` §2, en sitio

`debt.md:602` añade al título «— CERRADO por `relleno-completo-conversaciones` (1G-01)»; `:614` dice que el reintento ante 429 es sólo de
la página de la lista (`apps/desk/server/backfill.ts:40`); `:616-617` («Cómo retomar») remiten a `POST /api/admin/relleno-conversaciones`
y a `DEPLOY.md` §21. Mismo número de líneas. I-3 (`debt.md:631-634`) no se toca (S-13).

## D10 · Pruebas (strict TDD: rojo antes de cada línea de producción)

| Fichero | Lote | Qué fija |
|---|---|---|
| `packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` (nuevo) | L1 | con `detalle`, cero peticiones de detalle y fila persistida; sin él, lo de hoy; `managed_by_app` conserva su fila |
| `apps/desk/server/rellenoConversaciones.test.ts` (nuevo) | L1, L2 | pg-mem (`newDb().adapters.createPg()` + `migrate`) y `createSync` real con `zohoFetch` falsa enrutada por ruta (molde `packages/zoho-sync/src/conversaciones.test.ts:17-36`). L1: orden, `desde`, `limite`, `app-` saltado, una petición de detalle por ticket, 404 e `isDeleted`/`isTrashed` sin escribir, `500` que cuenta y sigue, archivado tipo #300 (7 + 1) completo, sin recuento. L2: `managed_by_app` con `raw` viejo; fila de Zoho visible que ya no viene (marcar apagado ⇒ descuadrado; encendido ⇒ marcada y completo); `source='app'` no cuenta; 429 de detalle y de página que cortan; fila guardada durante la lectura; dos `lanzar` seguidos; resumen sin asunto, contacto ni empresa del fixture |
| `apps/desk/server/rellenoConversacionesPausas.test.ts` (nuevo) | L2 | las esperas por omisión, por conducta y con `setTimeout` falso (molde `packages/zoho-sync/src/conversacionesPausas.test.ts:16-51`) |
| `apps/desk/server/rellenoConversacionesRutas.test.ts` (nuevo) | L3 | `401`/`403` en las dos rutas (molde `apps/desk/server/admin.test.ts:418-423`); `403` del interruptor; `limite=0` libre y sin Zoho; `400`; el `GET` no lanza |
| `packages/zoho-sync/src/config.test.ts` (al final, tras `:139`) | L3 | nace cerrado, sólo `'true'`, independiente de `MARCAR_CONVERSACIONES_AUSENTES` |
| `apps/desk/server/opcionesConversaciones.test.ts` (al final, tras `:28`) | L3 | fichero vigilado: `app.ts` pasa `opcionesConversaciones(config).marcarAusentes` y no lee los interruptores por su cuenta |
| `apps/desk/server/deployRellenoConversaciones.test.ts` (nuevo) | L3 | D8 |

`admin.test.ts` no se toca: las pruebas de rutas van juntas en su fichero, con el mismo arnés (`appHarness.ts:34-40`, `:46-54`).

## D11 · Mutaciones y posiciones (M0 = suite verde; `perl -i -pe '… if $. == N'` por CRLF; restaurar con `git diff` vacío y `file`)

| Id | Mutación | Rojo esperado |
|---|---|---|
| M1 | `esperado` desde `tickets.raw` en vez del detalle fresco | `managed_by_app` con `raw` viejo |
| M2 | contar lo recibido (`completa`); aparte, quitar `source='zoho'` | fila visible que ya no viene con marcar apagado; fila `source='app'` |
| M3 | quitar el filtro `app-` | `app-` saltado; `limite=0` |
| M4 | `=== 'true'` → `!== 'false'` en `config.ts:125` | `config.test.ts`; `deployRellenoConversaciones.test.ts` |
| M5 | el `GET` llama a `lanzar` | «el `GET` no lanza» |
| M6 | no cortar ante 429 agotado (detalle; aparte, página) | los dos casos de corte |
| M7 | `marcar: true` fijo (en el módulo; aparte, en `app.ts:50`) | «marcar apagado no marca»; el fichero vigilado |
| M8 | `sync.ts:179` sin la rama de `detalle` | «una petición de detalle»; `sync.syncTicketDetalle.test.ts` |
| M9 | 404 sin rama propia; aparte, ignorar `isDeleted`/`isTrashed` | «no está en Zoho» |
| M10 | quitar una frase de la §21; aparte, «Copia previa» de la §20 | las dos pruebas de `DEPLOY.md` |
| P1 | el interruptor después de validar | cerrado, `desde=abc&limite=5` da `403`, no `400` |
| P2 | la guarda del 429 del detalle después de `!res.ok` | «el 429 del detalle repite» |
| P3 | `inicio` después de leer | fila guardada durante la lectura |
| P4 | `enMarcha` puesto tras el primer `await` | de dos `lanzar` seguidos, sólo uno lanza |

## D12 · Contabilidad de líneas (regla de mutación 4) y regla invariable 13

Sólo en sitio, mismo número de líneas: `sync.ts` (`:18`, `:178`, `:179`), `config.ts` (`:66`, `:125`), `app.ts` (`:9`, `:22`, `:50`,
`:57`), `appHarness.ts` (`:46`, `:49`), `deployConversaciones.test.ts` (`:20`, `:23`), `debt.md` (`:602`, `:614`, `:616-617`). Sólo al
final: `DEPLOY.md`, `config.test.ts`, `opcionesConversaciones.test.ts`. Sin tocar: `conversaciones.ts`, `repo.ts`, `schema.sql`,
`routes/admin.ts`, `admin.test.ts` y `packages/zoho-sync/src/db/migrate.test.ts` (sin cambio de esquema).
`apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` cambian sólo en el archive (S-15). Barrido al cierre de cada lote: cada
frase que cite una línea sustituida sigue siendo cierta (`sync.ts:179` sigue siendo la petición de detalle y `:180` el `throw`).
**Regla 13:** nada toca `apps/desk/src`; el cliente no decide nada (no hay pantalla) y el rol y el interruptor los impone el servidor (D7).

## D13 · Partición y tamaño

i1 planificación · i2 L1 · i3 L2 · i4 L3 · i5 verify · i6 archive. Medida: `git diff --shortstat --no-renames` contra el commit de
partida más `wc -l` de lo nuevo sin trackear, `apply-progress.md` incluido.

| Lote | Contenido | Estimado | ×1,8 |
|---|---|---|---|
| L1 | `sync.ts` y su prueba; módulo: recorrido, detalle, persistencia, lectura y clases; sus pruebas L1 | ~380 | ~685 |
| L2 | corte por 429, resumen y `registrar`, concurrencia; pruebas L2 y de pausas | ~310 | ~560 |
| L3 | `config.ts`, `app.ts`, `appHarness.ts`, rutas y su prueba, `config.test.ts`, `opcionesConversaciones.test.ts`, §21 y sus dos pruebas, `debt.md` | ~380 | ~685 |

**Matriz de amenazas:** N/A: sin shell, subprocesos, automatización de VCS o PR ni ejecutables; la ruta va tras sesión, rol e interruptor.

## Riesgos y puntos abiertos

- Delta en paralelo: nombres (D6) y códigos (D7) deben casar con RQ-ZS-28; si no, `sdd-tasks` los alinea con la delta.
- `syncTicket(id, detalle)` amplía el contrato de `Sync`: quien pasara el detalle de otro id lo persistiría. Sólo lo pasa la pasada.
- Cuota (E-254): las peticiones de contacto y cuenta no entran en `peticiones` (D6). Que un 404 sea un borrado sigue siendo hipótesis (S-6).
