# Diseño — `sync-conversaciones-zoho` (1G-01, `cierra: no`)

Entradas: `proposal.md` (S-1 a S-15) y las deltas `specs/zoho-sync/spec.md` (RQ-ZS-25 a RQ-ZS-27) y `specs/trazas/spec.md`
(RQ-TZ-25). Líneas medidas en `b4255928`.

## D1 · Todo lo nuevo en un módulo propio; `sync.ts` y `repo.ts` sólo en sitio

`sync.ts` y `repo.ts` están citados por número en casi toda su longitud (`proposal.md` §2), así que **ninguna línea de los dos se
inserta ni se borra**: cada cambio sustituye una línea por otra, y la lógica vive en `packages/zoho-sync/src/conversaciones.ts`
(nuevo). Es el molde de `config.ts:66` y `:125` («en esta línea para no desplazar citas»). Se descartó añadir métodos a `Sync`:
`Sync` se construye como literal tipado en `apps/hub-sync/src/hubSync.test.ts:12-25`, y varios arneses lo enumeran a mano
(`apps/desk/server/testing/appHarness.ts:50`); un método nuevo obligaría a tocarlos todos.

## D2 · El módulo `conversaciones.ts`

Constantes exportadas (S-5, S-6, S-9): `LIMITE_CONVERSACIONES = 100`, `TOPE_PAGINAS_CONVERSACIONES = 20`, `PAUSA_429_MS = 2000`,
`REINTENTOS_429 = 3`, `PAUSA_ENTRE_TICKETS_MS = 150`. No importa nada de `sync.ts` (evita el ciclo de importación): repite los
dos ayudantes de lectura de dos líneas (`readData`, `dataArray`, `sync.ts:56-60`).

- `interface ConversacionesDeps { conversaciones?: { periodica?: boolean; marcarAusentes?: boolean; pausaMs?: number; pausa429Ms?: number } }`
  — la opción que sólo pasa la App (S-1b). `pausaMs` y `pausa429Ms` existen para que las pruebas pasen 0; la App no los pasa.
- `esperadoDeZoho(raw: unknown): number | null` — `commentCount` + `threadCount`. Acepta el objeto o el `jsonb` como texto (pg-mem lo
  entrega como texto, `apps/desk/server/db/ticketFuentes.ts:52-54`). Cada recuento **debe estar** y ser entero finito ≥ 0 (número
  o texto numérico); si falta uno, `null` (S-3). Nunca `Number(undefined)` ni `Number(null)` a secas.
- `leerConversaciones(zohoFetch, id, { reintentos429 = 0, pausa429Ms = PAUSA_429_MS } = {}): Promise<ListaConversaciones>`, con
  `ListaConversaciones = { items: ZohoRecord[]; error: string | null; por429: boolean }`. Pide
  `/tickets/${id}/conversations?from=${from}&limit=100` desde `from=0`. **Orden de las guardas por respuesta (posición fijada,
  P2):** primero el `429` (espera `pausa429Ms` y repite la MISMA página mientras queden reintentos), después `!res.ok` (error con el
  texto de hoy, `Zoho /tickets/${id}/conversations ${status}`, `sync.ts:185`). `204`/cuerpo vacío es una página vacía. Para en la
  primera página con menos de 100. En la página 20 llena: `error = 'tope de 20 páginas'`. Una excepción de red pasa a `error`. Nunca
  lanza: devuelve lo recibido hasta el fallo.
- `instanteBase(db): Promise<Date>` — `SELECT now() AS t`: el reloj de la base, el mismo que llena `conversations.created_at`
  (`packages/zoho-sync/src/db/schema.sql:48`).
- `guardarYReflejar(db, ticketId, lista, { esperado, marcar, inicio }): Promise<{ marcadas: string[]; completa: boolean }>`.
  1. Guarda cada elemento con `upsertConversation` y sus adjuntos con `upsertAttachment`, como hoy `sync.ts:187-190`. El
     `upsertConversation` desmarca (D4).
  2. `completa = lista.error === null && esperado !== null && idsUnicos(lista.items).size === esperado`.
  3. Si `!marcar` o `!completa`: no marca. Si `marcar && !completa`, una línea `console.error` con el ticket, los ids únicos
     recibidos, el `esperado` (o «sin recuento») y el `error` si lo hay.
  4. Si `marcar && completa`: `SELECT id FROM conversations WHERE ticket_id=$1 AND source='zoho' AND ausente_en_zoho_at IS NULL AND
     created_at < $2` con `inicio`; las que no están en los ids recibidos reciben `UPDATE conversations SET ausente_en_zoho_at=now()
     WHERE id=$1`, una a una (pg-mem no tipa los arrays enlazados, `apps/desk/server/db/ticketFuentes.ts:121-122`).
- `crearPasadaConversaciones({ zohoFetch, db, marcar, pausaMs = 150, pausa429Ms = 2000 })` devuelve
  `(tickets: ZohoRecord[]) => Promise<void>` con una `Map<id, modifiedTime>` propia (S-7). Por cada ticket, en orden: si la memoria
  tiene su `modifiedTime`, lo salta; pausa `pausaMs` antes de cada ticket que pide salvo el primero; `inicio = instanteBase(db)`
  **antes** de leer (posición fijada, P1); `leerConversaciones` con `reintentos429: 3`; `guardarYReflejar` con
  `esperado = esperadoDeZoho(t)` —el detalle del ciclo, S-4—. Si `lista.por429`: registra el corte con los ids que quedan y sale.
  Si `lista.error` (otro): lo registra y sigue. Si no hay error, apunta el `modifiedTime` en la memoria. Cada ticket va en su
  `try/catch`: un fallo de base se registra y no corta la pasada.

## D3 · `sync.ts`, sólo sustituciones de línea (ninguna línea nueva)

| Línea | Hoy | Queda |
|---|---|---|
| `:7` | importación de `./db/mappers` | la misma `; import { leerConversaciones, guardarYReflejar, esperadoDeZoho, instanteBase, crearPasadaConversaciones, type ConversacionesDeps } from './conversaciones'` |
| `:9` | `interface Deps extends AvisoOVDeps {` | `interface Deps extends AvisoOVDeps, ConversacionesDeps {` |
| `:62` | `createSync({ zohoFetch, db, config, alDiscrepanciaOV }: Deps)` | añade `conversaciones` al desestructurado |
| `:66` | `const contactAccount = new Map…` | la misma `; const pasadaConversaciones = conversaciones?.periodica === true ? crearPasadaConversaciones({ zohoFetch, db, marcar: conversaciones.marcarAusentes === true, pausaMs: conversaciones.pausaMs, pausa429Ms: conversaciones.pausa429Ms }) : undefined` |
| `:176` | `return sincronizarModificados({ …, paginaReciente })` | añade `trasLeer: pasadaConversaciones` |
| `:183-191` | cuerpo de `syncConversations` (9 líneas) | 9 líneas: comentario (2), `inicio`, `leerConversaciones(zohoFetch, id)` sin reintentos (S-5), `raw` de `tickets`, `guardarYReflejar(…, { esperado: esperadoDeZoho(raw), marcar: conversaciones?.marcarAusentes === true, inicio })`, `if (lista.error) throw new Error(lista.error)`, cierre |
| `:375` | `paginaReciente: () => Promise<number>` | la misma `; trasLeer?: (leidos: ZohoRecord[]) => Promise<void>` |
| `:411` | `let leidos = 0` | la misma `; const vistos: ZohoRecord[] = []` |
| `:426` | `leidos++` | `leidos++; vistos.push(t)` |
| `:433` | `return leidos` | `if (d.trasLeer) await d.trasLeer(vistos).catch((e) => console.error(…)); return leidos` |

Consecuencias que fija la tabla: la pasada corre **después** del bucle de persistencia (posición, P3); las dos salidas a
`paginaReciente()` (`:383`, `:406`) devuelven antes de `:433`, así que la caída no corre la pasada (S-8) sin tocarlas; y
`createSync` **no lee** `config.syncConversacionesPeriodica` ni `config.marcarConversacionesAusentes` (S-1b). El worker
(`apps/hub-sync/src/hub-sync.ts:21`) no se toca.

## D4 · `repo.ts`, dos sustituciones

- `:103` termina en `raw=EXCLUDED.raw\`,` y pasa a `raw=EXCLUDED.raw,ausente_en_zoho_at=NULL\`,`: desmarca al volver a guardar, con o
  sin interruptor (S-11). Al insertar, la columna nace nula.
- `:219`: `WHERE ticket_id=$1 AND ausente_en_zoho_at IS NULL ORDER BY …` (S-13, RQ-TZ-25). Los adjuntos de `:220` siguen leyéndose
  todos, pero `:226` sólo los cuelga de filas devueltas.

## D5 · Esquema, configuración y cableado

- `schema.sql`, al final (tras `:848`): tres líneas de comentario **sin punto y coma** (`migrate` parte el fichero por él, molde de
  `:845-847`) y `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ausente_en_zoho_at timestamptz;`, **sin calificar**
  (`migrate.test.ts:314-316`).
- `config.ts:66`: al final del tipo, `; syncConversacionesPeriodica: boolean; marcarConversacionesAusentes: boolean`, antes del `}`.
  `config.ts:125`: antes del comentario, `syncConversacionesPeriodica: env.SYNC_CONVERSACIONES_PERIODICA === 'true',
  marcarConversacionesAusentes: env.MARCAR_CONVERSACIONES_AUSENTES === 'true',`. Si `typecheck` encuentra literales completos de
  `AppConfig`, se les añaden los dos campos en sitio.
- `apps/desk/server/index.ts:23`: añade `conversaciones: { periodica: config.syncConversacionesPeriodica, marcarAusentes:
  config.marcarConversacionesAusentes }`. Es la ÚNICA lectura de los dos campos en todo el código.
- `DEPLOY.md`, al final (tras `:831`): §18 `SYNC_CONVERSACIONES_PERIODICA`, §19 `MARCAR_CONVERSACIONES_AUSENTES` (qué enciende, qué
  se rompe si se pone mal, nace cerrado, la línea de entorno) y §20, el relleno de persona (P-3).

## D6 · Pruebas (ficheros nuevos; a los existentes sólo se AÑADE al final)

| Fichero | Lote | Qué fija |
|---|---|---|
| `packages/zoho-sync/src/conversaciones.test.ts` (nuevo) | L1 | `esperadoDeZoho`; `leerConversaciones` (250, 200 exacto + `204`, `500` en la segunda, tope, `429` con y sin reintentos); `guardarYReflejar` (#958, recuento distinto con log, recuento ausente, lista parcial, interruptor apagado, reaparece, `source='app'`, `created_at` posterior, id repetido) |
| `packages/zoho-sync/src/sync.conversaciones.test.ts` (nuevo) | L1 | `syncConversations` por `createSync`: 250 en tres páginas; `500` guarda y rechaza; #958 con `raw` y `marcarAusentes`; sin la opción no marca; P1 (fila guardada por otra vía DURANTE la lectura, desde la falsa `zohoFetch`) |
| `apps/desk/server/db/conversacionAusentes.test.ts` (nuevo) | L1 | RQ-TZ-25 sobre `getConversacionTicket` |
| `packages/zoho-sync/src/sync.conversacionesPeriodicas.test.ts` (nuevo) | L2 | RQ-ZS-27: sólo los modificados; apagado y sin opción; gestionado por la App con recuentos del detalle; `429` repite y corta; memoria; caída a la página 1; fallo que no tumba `syncRecent` |
| `apps/hub-sync/src/hubSyncSinConversaciones.test.ts` (nuevo) | L2 | el worker: `createSync` como `hub-sync.ts:21` con `loadConfig` y las dos variables a `'true'` → cero `/conversations`; y `hub-sync.ts` no contiene `conversaciones` en su llamada a `createSync` (fichero vigilado) |
| `packages/zoho-sync/src/config.test.ts` (al final) | L2 | los dos interruptores nacen cerrados y sólo `'true'` los abre |

`zohoFetch` falso **enrutado por ruta**, como `sync.modificados.test.ts:30-43`. Las filas previas se insertan con `created_at`
explícito en el pasado, para que S-15 no dependa del milisegundo.

## D7 · Mutaciones y posiciones (cada una con su rojo esperado; M0 = la suite verde antes de mutar)

| Id | Mutación | Rojo esperado |
|---|---|---|
| M1 | quitar la paginación (salir tras la primera página) | 250 y 200 exactos; el caso de 151 guardadas y 150 en dos páginas marca **0** en vez de 1: la lista parcial no marca |
| M2 | quitar `lista.error === null` de `completa` | `500` en la segunda página marca |
| M3 | quitar el cotejo con `esperado` (y, aparte, contar `items.length` en vez de ids únicos) | recuento distinto, recuento ausente; id repetido |
| M4 | `marcar` siempre verdadero en `syncConversations` y en la pasada | «interruptor apagado no marca» |
| M5 | `conversaciones?.periodica === true` → `true` | apagado/sin opción; el worker |
| M6 | `=== 'true'` → `!== 'false'`, una variable cada vez | `config.test.ts` |
| M7 | quitar `ausente_en_zoho_at=NULL` de `repo.ts:103` | «reaparece» en los dos ficheros |
| M8a | `createSync` lee los interruptores de `config` si falta la opción | el worker (conductual) |
| M8b | escribir `conversaciones: { periodica: true }` en `hub-sync.ts:21` (**fichero vigilado**, regla 2) | el worker (estática) |
| M9 | quitar el filtro de `repo.ts:219` | RQ-TZ-25 |
| M10 | quitar `source='zoho'`; aparte, quitar `created_at < $2` | fila de la App; fila guardada durante la lectura |
| M11 | quitar la memoria de proceso | «un `modifiedTime` ya traído no se repide» |
| P1 | `inicio` capturado **después** de leer | fila guardada durante la lectura queda marcada |
| P2 | la guarda del `429` **después** de `!res.ok` | «un 429 espera y repite» |
| P3 | `trasLeer` llamado **antes** del bucle de persistencia (con `vistos` vacío) | «se piden las de los modificados» |

Las mutaciones se hacen con `perl -i -pe '… if $. == N'` y se restauran comprobando `sha256sum` del diff, `git status` y `file`
(CRLF).

## D8 · Regla invariable 13

Nada toca `apps/desk/src`: el cliente no decide nada nuevo. Ocultar lo ausente lo decide el servidor en el lector
(`repo.ts:219`), y el cliente pinta lo que recibe. No hay espejo que justificar.

## D9 · Partición de intentos

i1 planificación (este) · i2 apply L1 (B, C y RQ-TZ-25: módulo, `repo.ts`, `schema.sql`, `syncConversations`, tres pruebas) ·
i3 apply L2 (A y D: pasada, `sync.ts` restante, `config.ts`, `index.ts`, worker, `DEPLOY.md`) · i4 verify · i5 archive. Cada uno
≤ 800 con su `apply-progress.md`.
