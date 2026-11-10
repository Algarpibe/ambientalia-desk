# Diseño — `calificaciones-cuadre-conversaciones` (`fuera-del-plan`, `cierra: no`)

Entradas: `proposal.md` (S-1 a S-11, CA-1 a CA-10) y la delta `specs/zoho-sync/spec.md` (MODIFIED RQ-ZS-26 y RQ-ZS-28, ADDED RQ-ZS-48 a RQ-ZS-51), que
manda si un nombre choca. Líneas medidas en este worktree, sobre `7cbdadd5`; las citas de la propuesta, medidas en `79546497`, casan línea a línea con lo
leído aquí. Nombres cortos, los de la propuesta (`conversaciones.ts`, `server/…`, `routes/…`, `src/sync.ts`, `db/…`). Flujo: un predicado único decide qué
no cuenta → `guardarYReflejar` compara sólo lo que Zoho cuenta y marca con todo lo recibido → las tres vías lo heredan sin tocar `src/sync.ts` → la
verificación del relleno cuenta lo visible con el mismo predicado → cada pasada deja su fila en `public.relleno_conversaciones_pasadas` → el `GET` la
devuelve → `numeros` acota la pasada a los 51. **Ninguna línea citada se mueve:** toda edición en un fichero existente va en su MISMA línea física o al
final del fichero, y las pruebas van en ficheros nuevos (D-12).

```
lista de Zoho ─► guardarYReflejar: completa = sin error ∧ recuento ∧ contadasPorZoho(items) = esperado ─► marca con TODOS los ids (o log)
                 (relleno, pasada periódica, syncConversations)          └── esCalificacion (único) ──┐
relleno ─► visibles(id): SELECT raw … ─► filter(!esCalificacion) ─► clase    ◄────────────────────────┘
POST ─► lanzar ─► conResumenGuardado ─┬─ abrir: INSERT (sin esperar) ─┐
                                      └─ await pasada (la de hoy) ────┴─► cerrar: UPDATE (o INSERT completo)
GET  ─► { ...estado(), ultimaGuardada: ultima() }      (ultima nunca rechaza: null si falla)
```

## D-1 · El predicado, uno solo y al final de `conversaciones.ts` (RQ-ZS-48, S-2, S-3, CA-6)
**Elección.** Tras la línea 175 de `packages/zoho-sync/src/conversaciones.ts` (hoy la última), dos funciones exportadas. `esCalificacion(raw: unknown): boolean`,
molde `esperadoDeZoho` (`conversaciones.ts:50-53`): texto ⇒ `JSON.parse` en su `try` (si falla, `false`); no objeto o nulo ⇒ `false`; `true` sólo si
`channel === 'FEEDBACK'` EXACTO. `contadasPorZoho(items: ZohoRecord[]): number`: el tamaño del `Set` de `String(c.id)` de los elementos que NO son
calificación. `ZohoRecord` es el tipo local de `conversaciones.ts:11`. Son declaraciones de función: se elevan, y `:119-120` las usan sin importar nada.
**Exacto y no normalizado** (mayúsculas, espacios) porque lo pide el fallo seguro de S-2: lo dudoso cuenta como hoy y el ticket sigue sin marcarse; P-1
dirá el valor real, y si fuera otro se cambia una cadena.
**Descartadas.** Normalizar el canal: un canal parecido y no medido pasaría a calificación. Reconocerla también por la fuente `SYSTEM` (la nombra
`docs/sdd/ENTRADA.md:2410`): otros hilos de sistema caerían dentro y se marcaría de más. Ponerlo en `packages/shared`: es una regla de la lectura de Zoho,
no del dominio, y el cliente no la usa (D-11).
**Lo fija** `packages/zoho-sync/src/conversacionesCalificaciones.test.ts` (nuevo): objeto y texto con `FEEDBACK` ⇒ `true`; `EMAIL`, sin `channel`, `null`,
`undefined`, texto que no es JSON, `'feedback'`, `' FEEDBACK'` y el texto `'"FEEDBACK"'` ⇒ `false`; `contadasPorZoho` con un id repetido y una calificación.

## D-2 · El criterio, en sitio; las tres vías lo heredan (RQ-ZS-26, RQ-ZS-48, S-1, S-4, CA-1 a CA-3, CA-5)
`conversaciones.ts:119` conserva `recibidos` (TODOS los ids) y añade en la misma línea `; const contadas = contadasPorZoho(lista.items)`; `:120` pasa a
`… && contadas === esperado`; `conversaciones.ts:135` (`recibidos.has(id)`) no cambia: una calificación recibida nunca se marca, y una guardada que la
lista completa ya no trae sí (S-4); se desmarca sola al volver a guardarse (`db/repo.ts:103`). `conversaciones.ts:121` sigue devolviendo el `completa` de
`conversaciones.ts:120`: con `marcar` apagado informa con el criterio nuevo. `conversaciones.ts:124` pasa a `recibidos ${contadas} únicos sin calificaciones (${recibidos.size} con ellas), …`: el caso (b) lee
«recibidos 2 … Zoho cuenta 3», y `packages/zoho-sync/src/conversaciones.test.ts:218` (`'recibidos 5'`) sigue verde, como `sync.conversaciones.test.ts:96`.
El docblock `conversaciones.ts:104-108` se reescribe en `:106` y `:107`, con sus cinco líneas: «Completa = sin error, con recuento de Zoho, e ids ÚNICOS
recibidos que NO son calificación (RQ-ZS-48) igual a ese recuento; para marcar valen TODOS».
**Herencia sin tocar `src/sync.ts`:** las tres vías pasan la lista leída de Zoho a `guardarYReflejar` y el criterio vive dentro: relleno
(`server/rellenoConversaciones.ts:104`), pasada periódica (`conversaciones.ts:163`) y `syncConversations` (`packages/zoho-sync/src/sync.ts:189`, con los
recuentos de `tickets.raw` de `src/sync.ts:188`).
**Descartadas.** «Recibido ≥ contado» (S-1: falla (b)). Sumar a `esperado` las calificaciones recibidas: la misma aritmética, pero tocaría `esperadoDeZoho`
(`conversaciones.ts:50-57`, citado en `docs/sdd/ENTRADA.md:2411`) y lo que el log llama «lo que cuenta Zoho» dejaría de serlo.
**Lo fija** `conversacionesCalificaciones.test.ts` contra pg-mem, con el mismo fixture en la pasada periódica (`crearPasadaConversaciones`, molde
`packages/zoho-sync/src/conversacionesPausas.test.ts:38`) y en `syncConversations` (`createSync` con `tickets.raw`, molde `packages/zoho-sync/src/sync.conversaciones.test.ts:43-49`):
**(a)** `commentCount` 2 y `threadCount` 0; guardadas dos reales, una calificación y una cuarta que ya no viene; la lista trae las dos reales y la calificación
⇒ la cuarta queda marcada. **(b)** Zoho cuenta 3 (2 + 1); la lista trae 2 reales y 1 calificación; falta una real guardada ⇒ nada marcado y el log con
«recibidos 2» y «Zoho cuenta 3». Con `guardarYReflejar` directo: la calificación recibida nunca se marca; la guardada que no viene se marca y, devuelta,
se desmarca; con `marcar` apagado, (a) devuelve `{ marcadas: [], completa: true }` sin log. La tercera vía, el relleno, en D-3.

## D-3 · La verificación del relleno, con el mismo predicado (RQ-ZS-28, CA-4)
`server/rellenoConversaciones.ts:76` pasa de `SELECT count(*)::int AS n` a `SELECT raw` con el MISMO `WHERE` (`ticket_id`, `source='zoho'`,
`ausente_en_zoho_at IS NULL`), y `server/rellenoConversaciones.ts:77` a `return (r.rows as { raw: unknown }[]).filter((f) => !esCalificacion(f.raw)).length`;
`server/rellenoConversaciones.ts:74` añade «sin calificaciones (RQ-ZS-48)» en su línea, y `server/rellenoConversaciones.ts:4` importa `esCalificacion`.
`visibles` sigue en cuatro líneas (`server/rellenoConversaciones.ts:75-78`).
**Descartado** filtrar en SQL (`raw->>'channel' <> 'FEEDBACK'`): sería una segunda implementación del predicado, que S-3 y CA-4 prohíben, con otra semántica
para el `raw` nulo o guardado como texto, y lo que pg-mem hiciera con esa expresión no diría nada de producción. El coste es leer los `raw` visibles de UN
ticket, dentro del servidor.
**Consecuencia en (b):** no se marca nada y el relleno clasifica el ticket «completo», porque la real sigue visible y Desk enseña lo que Zoho cuenta; lo
avisa la línea de log de D-2. La prueba lo fija así, para que nadie lo tome por fallo.
**Lo fija** `apps/desk/server/rellenoConversacionesCalificaciones.test.ts` (nuevo; molde `apps/desk/server/rellenoConversaciones.test.ts:39-68`, con un servidor que
sirve objetos con `channel`): (a) ⇒ la cuarta marcada y «completo»; (b) ⇒ nada marcado, el log, «completo»; y CA-4, la (a) con la calificación visible
(sin el predicado saldría «descuadrado»: es M-4).

## D-4 · La tabla `public.relleno_conversaciones_pasadas` (RQ-ZS-49, S-5, CA-9)
Al final de `db/schema.sql`, tras `db/schema.sql:852`, cuatro líneas de comentario sin punto y coma (molde `:849-851`; `migrate` parte el fichero por él,
`db/migrate.ts:19-21`) y la sentencia:
```sql
CREATE TABLE IF NOT EXISTS public.relleno_conversaciones_pasadas (
  id bigserial PRIMARY KEY,
  lanzada_at timestamptz NOT NULL DEFAULT now(),
  terminada_at timestamptz,
  resumen jsonb NOT NULL
);
```
En `public` porque es registro operativo de la App, no reflejo de Zoho (topología de dos esquemas de `CLAUDE.md`), y calificada como pide
`openspec/config.yaml:3128`. `lanzada_at` y `terminada_at` son el reloj de la base y dicen el ciclo de la FILA; `inicio` y `fin` van dentro del resumen con el
reloj de la App (`server/rellenoConversaciones.ts:120`, `:134`) y no se duplican en columnas del mismo nombre. Una fila con `terminada_at` nulo y sin pasada
en marcha es una pasada cortada por un redespliegue. Sin índice: se lee por clave primaria y hay una fila por pasada, así que entra UNA sentencia (D-10).
`PUBLIC_TABLES` gana `'relleno_conversaciones_pasadas'` al final de `db/migrate.ts:73`, en sitio. Sin datos de cliente: el resumen es `EstadoRelleno`.
**Descartadas.** Una columna por campo (`peticiones`, `vistos429`…): el resumen ya tiene forma fija (`server/rellenoConversaciones.ts:23-29`) y cada campo
nuevo pediría otra migración. Guardar el progreso ticket a ticket: RQ-ZS-49 pide fila al lanzar y al terminar, y 51 `UPDATE` más no dan rastro útil (S-13).
**Lo fija** `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts` (nuevo; molde `packages/zoho-sync/src/db/migrate.test.ts:871-885`): tras
`migrate`, la tabla en `public` y vacía; la ÚLTIMA sentencia es el `CREATE … public.relleno_conversaciones_pasadas (` con sus cuatro columnas y sin
`subject`, `contact` ni `account`; `PUBLIC_TABLES` la contiene.

## D-5 · El resumen guardado: un módulo nuevo y un enganche en sitio (RQ-ZS-49, S-5, CA-7)
`apps/desk/server/rellenoConversacionesResumen.ts` (nuevo; importa `EstadoRelleno` sólo como tipo, sin ciclo en ejecución):
```ts
export const LIMITE_PETICIONES = 'no cuenta las lecturas de contacto y cuenta del Sync compartido: a lo sumo 3 por ticket recorrido, menos por su caché'
export interface PasadaGuardada { id: number; lanzadaAt: string; terminadaAt: string | null; resumen: Record<string, unknown> }
export interface GuardaResumen {   // NINGUNO rechaza: cada uno lleva su catch
  abrir(e: EstadoRelleno): Promise<number | null>; cerrar(id: number | null, e: EstadoRelleno): Promise<void>; ultima(): Promise<PasadaGuardada | null>
}
export function guardaEnBase(db: Queryable, avisar?: (linea: string) => void): GuardaResumen
export function conResumenGuardado(a: { guardar: GuardaResumen; estado: EstadoRelleno; correr: () => Promise<void> }): Promise<void>
```
`abrir`: `INSERT … (resumen) VALUES ($1) RETURNING id`. `cerrar`: `UPDATE … SET terminada_at = now(), resumen = $2 WHERE id = $1`, o un `INSERT` ya completo si
`abrir` falló (`id` nulo). `ultima`: `SELECT … ORDER BY id DESC LIMIT 1`, con `resumen` leído como objeto o texto (molde de D-1) y fechas en ISO. El
`resumen` es `JSON.stringify({ ...structuredClone(e), limitePeticiones: LIMITE_PETICIONES })`, sin cast, como `db/repo.ts:104`. Un fallo llama a `avisar`
(por omisión `logger.error`) con UNA línea que nombra la operación y el mensaje, dentro de su PROPIO `try`: la escritura no depende del log ni el log de
ella. Nunca `logger.info`: `apps/desk/server/rellenoConversaciones.test.ts:410-421` exige una sola llamada a `info` por pasada.
`conResumenGuardado`: con `estado.limite === 0` sólo corre (`limite=0` no escribe). Si no, lanza `abrir` SIN esperarlo —la fila nace al lanzar y la
primera petición a Zoho no se retrasa—, `await correr()` y después `cerrar(await abierta, …)`; `abierta` lleva su `.catch(() => null)` para que un rechazo
no quede sin manejar mientras corre la pasada. `estado` llega por REFERENCIA y la foto final se toma de ella: un `lanzar` nuevo entre el `finally` de la
pasada y `cerrar` reasigna la variable del cierre (`server/rellenoConversaciones.ts:143`), no el objeto ya capturado.
**Enganche, en sitio**: `apps/desk/server/rellenoConversaciones.ts:8` añade la importación; `:33` gana `; guardar?: GuardaResumen`; `:51`,
`guardar = guardaEnBase(db),` (un valor por omisión puede leer `db`, que se desestructura antes); `server/rellenoConversaciones.ts:144` pasa a
`void conResumenGuardado({ guardar, estado, correr: () => pasada(estado.desde, estado.limite) })` (L3 añade `estado.numeros`);
`server/rellenoConversaciones.ts:152` añade `ultimaGuardada: () => guardar.ultima(),`. El `registrar` de `server/rellenoConversaciones.ts:135` y su `try` no
cambian: log y tabla, independientes.
**Descartadas.** Un `registrar` asíncrono: escaparía del `try` de `server/rellenoConversaciones.ts:135` y un fallo de la base sería un rechazo sin manejar.
Una función tras el `return` de `crearRellenoConversaciones`: correría su llave de cierre y mezclaría persistencia y pasada. Crear la guarda en
`apps/desk/server/app.ts:50`: es una línea que leen como texto `apps/desk/server/opcionesConversaciones.test.ts:35` y `apps/desk/server/completitud/verificacionRutas.test.ts:17`.
**Lo fija** `apps/desk/server/rellenoConversacionesResumen.test.ts` (nuevo): con la `zohoFetch` retenida, la fila existe con `terminadaAt` nulo mientras la
primera petición espera, y al soltarla queda completa con `peticiones`, `vistos429`, `inicio`, `fin`, `desde`, `limite` y `limitePeticiones`; dos
`crearRellenoConversaciones` sobre la misma base pg-mem (redespliegue simulado): el segundo, en estado inicial, devuelve por `ultimaGuardada()` la pasada del
primero sin llamar a Zoho; con una base que rechaza toda sentencia sobre la tabla, los tres tickets se procesan, `registrar` recibe UNA llamada, `logger.error`
una línea y un oyente de `unhandledRejection` en `process` ninguna; `abrir`, `cerrar` y `ultima` resuelven (`null` o nada) con esa base y con un `avisar` que
lanza; `limite: 0` no deja fila; con marcadores de asunto, contacto y empresa (molde `apps/desk/server/rellenoConversaciones.test.ts:380-397`), el `resumen`
guardado no contiene ninguno.

## D-6 · El `GET` devuelve además la última pasada guardada (RQ-ZS-49, precisa RQ-ZS-29)
`routes/rellenoConversaciones.ts:46-48`, en sitio: `:46` envuelve el manejador en `asyncHandler(async (_req, res) => {` (ya importado en `:4`), `:47` responde
`{ ...relleno.estado(), ultimaGuardada: await relleno.ultimaGuardada() }` y `routes/rellenoConversaciones.ts:48` cierra con `}))`. Una lectura fallida da `ultimaGuardada: null` y el `200`
con el estado. Sigue sin lanzar, sin llamar a Zoho, sin guarda del modo (como fija `apps/desk/server/modoSinZohoRutas.test.ts:184-186`) y tras
`requireAuth` y `requireSuperAdmin`. Las aserciones de hoy sobre el `GET` usan `toMatchObject` o leen un campo
(`apps/desk/server/rellenoConversacionesRutas.test.ts:82`, `:143`, `:163`): el campo nuevo no las rompe. El docblock `routes/rellenoConversaciones.ts:30`
cambia «devuelve sólo el estado» por «devuelve el estado y la última pasada guardada», en su línea.
```json
{ "enMarcha": false, "terminado": false, "numeros": null, "noEncontrados": [], "…": "…",
  "ultimaGuardada": { "id": 3, "lanzadaAt": "2026-11-10T14:00:00.000Z", "terminadaAt": "2026-11-10T14:02:10.000Z",
                      "resumen": { "numeros": [208, 209], "peticiones": 104, "vistos429": 0, "cuentas": { "completo": 2 }, "limitePeticiones": "…" } } }
```
**Lo fija** `apps/desk/server/rellenoConversacionesResumenRutas.test.ts` (nuevo; arnés `apps/desk/server/testing/appHarness.ts:46-54`): sin pasadas,
`ultimaGuardada: null`; tras una pasada en un `appWith` A, un `appWith` B sobre la misma `db` responde «sin pasada» más la de A, sin llamar a su `zohoFetch`;
con una `dbPropia` que rechaza la tabla, `200` y `ultimaGuardada: null`; `POST ?limite=0` no deja fila.

## D-7 · `numeros` (RQ-ZS-50, S-7, S-10, CA-8)
**Ruta**, en sitio: `apps/desk/server/routes/rellenoConversaciones.ts:37` desestructura `numeros`; `:38` suma al `400` de hoy
`|| !numerosValidos(numeros) || (numeros !== undefined && desde !== undefined)` y amplía el mensaje («… `numeros`, hasta 200 enteros separados por comas y
nunca junto a `desde`»); `routes/rellenoConversaciones.ts:39` pasa `numeros: aNumeros(numeros)` al recuento y `:42`, a `lanzar`. Tras la línea 49, dos
funciones: `numerosValidos(v)` —ausente vale; si viene, UNA cadena con `^\d+(,\d+)*$` y como mucho 200 elementos; repetida en la query llega como lista y da
`400`— y `aNumeros(v)`, sin repetidos y en orden ascendente. El `400` vive en el manejador, así que queda detrás de `401`, `403` de rol, `503` del modo y `403` del interruptor por construcción, como el
de `desde`/`limite` (escalón C); con `limite=0`, el interruptor y el modo dejan pasar (`routes/rellenoConversaciones.ts:17`, y
`apps/desk/server/routes/modoSinZohoDesk.ts:45`) y el `400` sigue valiendo.
**Módulo**, en sitio: `EstadoRelleno` gana `numeros: number[] | null` al final de `server/rellenoConversaciones.ts:24` y `noEncontrados: number[]` en `:28`,
antes del comentario; `estadoInicial`, `null` en `server/rellenoConversaciones.ts:37` y `[]` en `:39`. `tramo` (`server/rellenoConversaciones.ts:56`) recibe
`numeros` (por omisión `null`); `server/rellenoConversaciones.ts:60` añade `&& (numeros === null || numeros.includes(f.numero))` y `:61` devuelve además
`noEncontrados`, los de `numeros` que no salen en `filas` (un `app-` sí sale y se salta como hoy, S-10).
`pasada` (`server/rellenoConversaciones.ts:117`) recibe `numeros`, `:119` lo pasa a `tramo` y `:121` guarda `estado.noEncontrados`.
`lanzar` (`server/rellenoConversaciones.ts:141`) lo acepta, `:143` lo guarda y `:144` lo pasa.
`recuento` (`server/rellenoConversaciones.ts:148`) lo acepta, `:149` lo pasa y `:150` añade `noEncontrados` SÓLO si vino `numeros`, porque `apps/desk/server/rellenoConversacionesRutas.test.ts:115` y `:127` comparan con `toEqual`. `limite` acota después del filtro.
**Supuesto S-12 (reversible, a la lista semanal):** tope de 200 números por petición; cubre los 51 con margen y una pasada así sigue siendo de minutos.
**Descartadas.** Intersecar `numeros` y `desde` (S-7). Rechazar los que no existen (S-10: se nombran y no se recorren). Validar en un middleware propio: sería
una pieza más de la cadena cuya posición habría que fijar; en el manejador hereda la del `400` de hoy.
**Lo fija** `apps/desk/server/rellenoConversacionesNumeros.test.ts` (nuevo). Módulo: números 10 a 15 con el 12 `app-…` y `numeros` `[14, 12, 11]` ⇒ detalles de
11 y 14 en ese orden; `numeros` y `noEncontrados` en el estado y en la fila guardada; con `limite`, acota tras filtrar. Ruta: interruptor cerrado,
`numeros=11,14,999&limite=0` ⇒ `{ aRecorrer: 2, saltadosApp: 0, noEncontrados: [999] }` sin Zoho ni fila; `numeros=`, `1,x`, `1,,2`, 201 números, repetido y
junto a `desde` ⇒ `400` sin Zoho; 200 números ⇒ no `400`. **Posición, con dos guardas activas:** `numeros=x` sin sesión ⇒ `401`, sin rol ⇒ `403`, modo abierto
⇒ `503`, interruptor cerrado ⇒ `403` del interruptor; todo abierto ⇒ `400`.

## D-8 · Peticiones: el límite queda declarado (S-6, E-254 (d))
Contar contacto y cuenta exige que pasen por `contado` (`server/rellenoConversaciones.ts:65-70`), y hoy van por la `zohoFetch` del `Sync` compartido
(`packages/zoho-sync/src/sync.ts:90`, `:100`). Las dos salidas no caben: tocar `src/sync.ts` (fuera de alcance, propuesta §3) o un `Sync` propio del relleno,
que perdería el `alDiscrepanciaOV` que sólo cablea `apps/desk/server/index.ts:23` y la caché por proceso (`src/sync.ts:87`, `:97`), y sería un segundo
cableado que puede divergir. Queda declarado: el resumen guardado lleva `limitePeticiones` (D-5) y la §25 da la cota `peticiones + 3 × recorridos`.
**Corrección a la propuesta, en sitio:** S-6 decía «a lo sumo 2 por ticket»; son **3**: la cuenta del ticket (`src/sync.ts:113`), el contacto
(`src/sync.ts:114`) y la cuenta del contacto si es otra (`src/sync.ts:104`). Cambió el número en `openspec/changes/calificaciones-cuadre-conversaciones/proposal.md:96`.

## D-9 · `DEPLOY.md` §25 y su prueba (RQ-ZS-51, S-8)
Al final, tras `DEPLOY.md:1066`: `## 25. Calificaciones en el cuadre, relance por numeros y resumen guardado del relleno (…, decision/calificaciones-y-borrados-de-zoho)`;
un párrafo (el canal `FEEDBACK` deja de contar en el cuadre, S-2 hipótesis hasta P-1; «No hay interruptor nuevo»: todo tras `RELLENO_CONVERSACIONES_HABILITADO`,
§21, y `MARCAR_CONVERSACIONES_AUSENTES`, §19; sin líneas para `.env.example`); `### numeros y el resumen guardado` con **Qué enciende:** (`numeros` acota la
pasada; cada pasada deja su fila; con el marcado encendido, desde el despliegue las tres vías marcan también en los tickets con calificación) y **Qué se rompe
si se pone mal:** (`numeros` mal escrito o junto a `desde` da `400` y no lanza; si el canal real no es `FEEDBACK`, esos tickets siguen sin marcarse, nunca de
más; con el modo sin Zoho abierto, `503`); `### Cómo leer el resumen guardado` (`ultimaGuardada`; `terminadaAt` nulo sin pasada en marcha = cortada;
`peticiones` y su límite, contacto y cuenta sin contar); `### Pasos` (P-1 a P-3 de la propuesta, con sus consultas citadas, no copiadas).
**Prueba** `apps/desk/server/deployCalificacionesConversaciones.test.ts` (molde `apps/desk/server/deployModoSinZoho.test.ts:18-43`): `faltasSeccion25(texto)`,
pura, exige la `## 25. ` tras la §24 y última, los dos apartados en negrita, `` `numeros` ``, `limite=0`, `ultimaGuardada`, `relleno_conversaciones_pasadas`,
`FEEDBACK`, las dos variables, «No hay interruptor nuevo» y «contacto y cuenta». Sobre el real, `[]`; sobre copias en memoria sin `` `numeros` ``, sin «Qué se
rompe» o con una `## 26.` añadida, la falta nombrada.
**Guarda en sitio** (molde `apps/desk/server/deployVerificacionCompletitud.test.ts:20`, `:36`): `apps/desk/server/deployModoSinZoho.test.ts:24` acota la §24
hasta la `## 25. ` si existe, en una línea; `apps/desk/server/deployModoSinZoho.test.ts:25` renombra su falta a «la §24 sola hasta la §25»; `:50` añade que la
§25 va tras la §24; `apps/desk/server/deployModoSinZoho.test.ts:66` mete una `## 99. Otra` antes de la §25 y espera esa falta; `:9` y `:65` dejan de decir
«la última». Las §21 a §24 no se tocan; la frase de `DEPLOY.md:888` («sólo devuelve el estado») la precisa la §25, como RQ-ZS-49 precisa RQ-ZS-29.

## D-10 · Guardas que cuentan el árbol y pruebas que leen ficheros editados
Una sentencia nueva al final de `db/schema.sql` y una tabla más en `PUBLIC_TABLES`. En `packages/zoho-sync/src/db/migrate.test.ts`, en sitio:
- `packages/zoho-sync/src/db/migrate.test.ts:282` (título: 48 tablas, 35 de `public`, nombra la nueva), `:283` (`[10, 35, 3]`), `:284`, `:285`, `:286` (47 → 48).
- `packages/zoho-sync/src/db/migrate.test.ts:652`: su suma gana `+ 1` y su mensaje, «y el CREATE de public.relleno_conversaciones_pasadas». La propuesta no la listaba.
- Contadas desde el final, todas **+1**: `packages/zoho-sync/src/db/migrate.test.ts:796` (22 → 23), `:798` (21 → 22, 20 → 21), `:839` (19 → 20), `:840` (18 → 19), `:879` (17 → 18), `:880` (16 → 17), `:882` (17 → 18).
- Sus títulos `packages/zoho-sync/src/db/migrate.test.ts:794`, `:837` y `:877` corren cada ordinal uno, y `:794` termina en «y la última, el CREATE de relleno_conversaciones_pasadas».
- No cambian el guardián `packages/zoho-sync/src/db/migrate.test.ts:266` ni el recuento de `ALTER` calificadas de `:377`. Ninguna otra prueba cuenta el esquema por posición.
`apps/desk/server/reconciliacion/registro.test.ts` no se rompe: `fuera-del-plan` sale del recuento en `apps/desk/server/reconciliacion/comprobaciones.ts:215`.
Ningún `*.test.ts` lee como texto `conversaciones.ts`, `server/…`, `routes/…` ni `db/schema.sql` salvo `migrate.test.ts` (búsqueda de `readFileSync`);
`apps/desk/server/app.ts` no se edita (D-5). Las de la §24, en D-9.

## D-11 · Regla 13: el cliente no gana ninguna decisión
`apps/desk/src` no cambia. Las decisiones nuevas viven todas en el servidor: qué es calificación (`esCalificacion`, al final de `conversaciones.ts`), cuándo
una lista está completa (`conversaciones.ts:120`), qué cuenta como visible (`server/rellenoConversaciones.ts:77`), qué `numeros` se admiten
(`routes/rellenoConversaciones.ts:38`) y qué se guarda (D-5). Ninguna tiene espejo en el cliente.

## D-12 · Contabilidad de líneas y citas que caen en líneas editadas (regla de mutación 4)
| Líneas en sitio (y lo nuevo) | Antes → después |
|---|---|
| `packages/zoho-sync/src/conversaciones.ts:106`, `:107`, `:119`, `:120`, `:124`; dos funciones al final | 175 → ~190 |
| `apps/desk/server/rellenoConversaciones.ts:4`, `:8`, `:24`, `:28`, `:33`, `:37`, `:39`, `:51`, `:56`, `:60`, `:61`, `:74`, `:76`, `:77`, `:117`, `:119`, `:121`, `:141`, `:143`, `:144`, `:148`, `:149`, `:150`, `:152` | 154 → 154 |
| `apps/desk/server/routes/rellenoConversaciones.ts:30`, `:37`, `:38`, `:39`, `:42`, `:46`, `:47`, `:48`; dos funciones al final | 49 → ~56 |
| `packages/zoho-sync/src/db/schema.sql`, sólo al final · `packages/zoho-sync/src/db/migrate.ts:73` | 852 → ~862 · 131 → 131 |
| `packages/zoho-sync/src/db/migrate.test.ts`, los 17 de D-10 · `apps/desk/server/deployModoSinZoho.test.ts:9`, `:24`, `:25`, `:50`, `:65`, `:66` | iguales |
| `DEPLOY.md`, sólo al final · `openspec/changes/calificaciones-cuadre-conversaciones/proposal.md:96` (D-8) | 1066 → ~1110 · igual |

Sin tocar: `src/sync.ts`, `db/repo.ts`, `db/mappers.ts`, `apps/desk/server/app.ts`, `apps/desk/src`, `.env.example` y los seis de Supervisión. **Barrido de
cierre** de cada lote, cita por cita contra lo que afirma; las que caen en líneas editadas, con el caso esperado (B = fechada, se ancla, no se renumera):
- `packages/zoho-sync/src/conversaciones.ts:119`: la cita suelta de `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:95`; el rango 119-120 de `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:47` y del `design.md` y el `verify-report.md` archivados que nombra la búsqueda; el rango 119-127 de `docs/sdd/Paquete_de_Despliegue_2026-11-02.md:77` y `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:74`; el 109-140 de `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:52`. Todas B.
- `packages/zoho-sync/src/conversaciones.ts:120` (y `:124`, dentro de rangos): `openspec/config.yaml:6310`, `docs/sdd/ENTRADA.md:2414` y el rango 120-127 de `docs/sdd/ENTRADA.md:2411`. B, las anota Supervisión (propuesta §10).
- `apps/desk/server/rellenoConversaciones.ts:76`: `openspec/changes/archive/2026-11-07-verificacion-completitud/design.md:46`, `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/verify-report.md:79`, `:80` y sus gemelas en `proposal.md` y `apply-progress.md` archivados. Siguen ciertas (A): el `WHERE` que nombran se queda en esa línea.
- `apps/desk/server/rellenoConversaciones.ts:60`, `:61`, `:143`: `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/verify-report.md:109`, `:81`, `:97` (y sus `apply-progress.md`). A: `>= desde`, el filtro `app-` y `enMarcha` se quedan donde dicen.
- `apps/desk/server/rellenoConversaciones.ts` en rango: 56-62 en `docs/sdd/Paquete_de_Despliegue_2026-11-03.md:132`, `:159` y 147-151 en sus `:115`, `:157` (A); 140-144 en `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:97` (A).
- `apps/desk/server/routes/rellenoConversaciones.ts:38`, `:39`, `:46`: `docs/sdd/Paquete_de_Despliegue_2026-11-03.md:110`, `:115`, `:171`, `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:98` y los `apply-progress.md`/`verify-report.md` de `2026-11-02-relleno-completo-conversaciones` (A); `openspec/changes/archive/2026-11-08-modo-sin-zoho/design.md:103` («sólo leen memoria», hoy lee además la base): B.
- Las de esta propuesta (§2, §9, §10, §12) describen `79546497` y pasan a B al archivar.

## D-13 · Mutaciones (apply las reproduce en su lote; verify, las de su muestra)
Molde: antes de mutar `F`, guardar su `sha256sum` y la salida de `file F`, y copiarlo al scratchpad; mutar SIEMPRE con `perl -i -pe 's/…/…/ if $. == N' F`
(nunca `sed -i`, rompe el CRLF); correr la prueba focal; restaurar con la copia y comprobar el mismo `sha256sum` y el mismo `file`. En las de código nuevo, `N`
lo anota `apply-progress.md`.
- **M-1** `conversaciones.ts:120`, `s/contadas === esperado/recibidos.size === esperado/` (el criterio de hoy) ⇒ rojas (a) y (b) en las tres vías.
- **M-2** `conversaciones.ts:120`, `s/contadas === esperado/recibidos.size >= esperado/` («recibido ≥ contado» de S-1) ⇒ roja (b) en las tres vías.
- **M-3** `conversaciones.ts:119`, `s/new Set\(lista\.items\.map/new Set(lista.items.filter((c) => !esCalificacion(c)).map/` ⇒ roja «la calificación recibida nunca se marca».
- **M-4** `server/rellenoConversaciones.ts:77`, `s/\.filter\(\(f\) => !esCalificacion\(f\.raw\)\)//` ⇒ roja CA-4: la (a) del relleno sale «descuadrado».
- **M-5** `esCalificacion`, `s/\.channel === \x27FEEDBACK\x27/.channel?.toString().trim().toUpperCase() === \x27FEEDBACK\x27/` ⇒ rojas `'feedback'` y `' FEEDBACK'`.
- **M-6** quitar el `catch` de `abrir` en `guardaEnBase` ⇒ roja «abrir resuelve con una base que falla». **M-7** quitar el `limite === 0` de `conResumenGuardado` ⇒ roja «`limite: 0` no deja fila».
- **M-8** `server/rellenoConversaciones.ts:60`, quitar la conjunción de `numeros` ⇒ roja «recorre sólo esos». **M-9** `routes/rellenoConversaciones.ts:38`, quitar la de `desde` ⇒ roja «junto a `desde`, `400`».
- **M-10** `server/rellenoConversaciones.ts:150`, `noEncontrados` siempre ⇒ rojas `apps/desk/server/rellenoConversacionesRutas.test.ts:115` y `:127` (CA-5).
- **P-1 (regla 1, posición del `400`)** `routes/rellenoConversaciones.ts:36`, anteponer un validador:
  `s/guardaModoSinZoho\(modo, esRecuento\), /(req, res, next) => (numerosValidos(req.query.numeros) ? next() : res.status(400).json({})), $&/` ⇒ roja «modo
  abierto ⇒ `503`». Lo mismo delante de `interruptorRelleno\(habilitado\), `, de `requireSuperAdmin, ` y de `requireAuth\(db\), ` ⇒ rojas `403`, `403` y `401`.
- **P-2 (regla 1, `completa` frente a `if (!marcar)`)** `conversaciones.ts:121`, `s/completa \}/completa: recibidos.size === esperado }/` (el `return` anticipado
  con su propio cálculo de hoy) ⇒ roja «con `marcar` apagado, (a) da `completa: true`».
- **P-3 / P-4** en `conResumenGuardado`, `abrir` después de `await correr()` ⇒ roja «fila al lanzar»; `cerrar` antes ⇒ roja «completa al terminar».
- **R-1 (regla 2, fichero vigilado)** `db/schema.sql`, línea del `CREATE` nuevo, `s/EXISTS public\.relleno/EXISTS relleno/` ⇒ rojos el guardián
  `packages/zoho-sync/src/db/migrate.test.ts:266` (sin clasificar y fantasma) y la última sentencia de D-4. Es la «copia ensuciada» del escenario de RQ-ZS-49: el
  guardián lee una ruta fija (`db/migrate.ts:9`), así que se prueba ensuciando el fichero real y restaurándolo.
- **R-2 (regla 2)** `DEPLOY.md`, sólo en las líneas posteriores a la 1066, cambiar `numeros` entre comillas invertidas por `otros` ⇒ roja la prueba de la §25.

## D-14 · Lotes (strict TDD: rojo antes de cada línea de producción; ×1,8 sobre código, pruebas y ~50 de `apply-progress.md`)
**Sustituye a la tabla de §12 de la propuesta** (650 → ~1.310 líneas): cada lote suma su `apply-progress.md`, la guarda de `packages/zoho-sync/src/db/migrate.test.ts:652` y los
títulos de D-10 no estaban, y las pruebas de ruta del resumen tampoco. Cada lote ≤ 800 medido con `git diff --shortstat --no-renames` contra su commit de
partida más `wc -l` de lo nuevo sin trackear; cierra con `npm run typecheck`, su prueba focal y el barrido de D-12 de las líneas que tocó.

| Lote | Producción y pruebas | Mutaciones | Est. | ×1,8 |
|---|---|---|---|---|
| L1 | `conversaciones.ts` (5 + final), `server/rellenoConversaciones.ts:4`, `:74`, `:76`, `:77`; `conversacionesCalificaciones.test.ts`, `rellenoConversacionesCalificaciones.test.ts` | M-1 a M-5, P-2 | ~390 | ~700 |
| L2 | `db/schema.sql`, `db/migrate.ts:73`, `migrate.test.ts` (17), `rellenoConversacionesResumen.ts`, `server/rellenoConversaciones.ts:8`, `:33`, `:51`, `:144`, `:152`; `db/rellenoConversacionesPasadas.test.ts`, `rellenoConversacionesResumen.test.ts` | M-6, M-7, P-3, P-4, R-1 | ~395 | ~710 |
| L3 | `routes/rellenoConversaciones.ts` (8 + final), `server/rellenoConversaciones.ts` (las 15 restantes, y `numeros` en la misma línea del enganche de L2); `rellenoConversacionesResumenRutas.test.ts`, `rellenoConversacionesNumeros.test.ts` | M-8 a M-10, P-1 | ~355 | ~640 |
| L4 | `DEPLOY.md` §25, `deployCalificacionesConversaciones.test.ts`, `deployModoSinZoho.test.ts` (6) | R-2 | ~165 | ~300 |

L3 depende de L2 (`ultimaGuardada`, `server/rellenoConversaciones.ts:144`); L1 y L2 son independientes. Verify corre `npm test` entero (con log) y `npm run lint -- --max-warnings 165`.

## Matriz de amenazas
Las cinco filas, N/A: no hay documentación ejecutable, ni selección de repositorio, commit, push ni PR. Los límites reales van en D-1 (fallo seguro), D-5
(sin rechazos sin manejar y sin datos de cliente) y D-7 (posición del `400`).

## Migración, vuelta atrás, riesgos y puntos abiertos
- **Migración:** `migrate` crea la tabla al arrancar la App; sin relleno ni interruptor. Revertir deja la tabla vacía e inocua (`IF NOT EXISTS`, sin `DROP`).
- **S-2 es hipótesis** hasta P-1; falla seguro. Con `MARCAR_CONVERSACIONES_AUSENTES` encendido, desde el despliegue la pasada periódica y `syncConversations`
  marcan lo ausente en los tickets con calificación que se modifiquen: es lo que la decisión autoriza, y la §25 lo dice.
- **H-1:** pg-mem entrega `raw` como objeto o como texto; el predicado acepta los dos. **H-2:** el `INSERT` de `abrir`, lanzado a la vez que la pasada, cabe
  en las 200 vueltas de `apps/desk/server/rellenoConversacionesPausas.test.ts:30`; si no, lo enseña el rojo de L2 y la salida es pasar una guarda vacía a esas
  dos pruebas, en sitio.
- **S-13** (sin progreso por ticket) y **S-14:** el `GET` puede enseñar `terminado: true` un instante antes de que `ultimaGuardada.terminadaAt` deje de ser
  nulo; P-2 lo lee hasta que lo esté. Los dos, reversibles, a la lista semanal con S-12.
- Ninguna duda da causa de parada de la «Regla de ejecución»: no cambia alcance, no cuesta dinero y no toca más datos de producción que los autorizados.
