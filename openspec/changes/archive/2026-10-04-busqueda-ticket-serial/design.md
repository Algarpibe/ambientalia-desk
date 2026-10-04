# Diseño — Búsqueda por número de ticket y por serial en el listado

Cambio `busqueda-ticket-serial` · `tanda: F1B-08` · `cierra: no`. Base: worktree `busqueda-ticket-serial`, `2a74fdc`.
Todas las líneas citadas se leyeron en ese árbol al escribir este documento; lo no leído lleva «hipótesis».
`sdd-apply` las vuelve a medir antes de editar.

## 1 · Enfoque técnico

El servidor filtra; el cliente sólo envía el texto. Tres piezas nuevas y pequeñas concentran la lógica, y los
ficheros muy citados sólo ganan llamadas a ellas, **editando líneas existentes sin añadir ni quitar ninguna**:

    caja (.tsx) ──q──▶ conBusqueda (src/lib) ──▶ GET /api/tickets?q=   GET /api/mis-tickets?q=
                                                       │ requireAuth (401)
                                                       ▼
                                 leerBusqueda (server/util) ── 422 si no es válido
                                                       │ res.locals.busqueda = { numero, patron } | null
                                                       ▼
                       ticketsConCliente ──▶ repo.ts ──▶ sqlBusquedaTickets (zoho-sync/db)
                                                              ▲
     searchEquipos ──▶ patronSerial ◀── leerBusquedaTickets ──┘   (packages/shared: única noción del patrón)

**Corrección a la propuesta, con evidencia (D2):** la propuesta escribía el serial del equipo como
`LOWER(e.serial) LIKE` sobre un `LEFT JOIN equipos e`. No hay en el repositorio ningún precedente de `LIKE` sobre
una columna de la tabla UNIDA: los tres `LIKE` que conviven con un `LEFT JOIN` filtran la tabla BASE
(`apps/desk/server/db/equipos.ts:178-180`, `apps/desk/server/db/equipos.ts:261`,
`packages/zoho-sync/src/db/activities.ts:35`). Sí lo hay de subconsulta NO correlacionada con `IN`, y con la nota
de qué soporta pg-mem (`packages/zoho-sync/src/books/repo.ts:151-153`, usada en
`packages/zoho-sync/src/books/repo.ts:160-161`). El diseño usa la subconsulta: no añade `JOIN`, no puede duplicar
filas y sirve igual al recuento. El comportamiento observable es el mismo que pedía la propuesta.

## 2 · Decisiones

| # | Decisión | Alternativas descartadas | Razón |
|---|---|---|---|
| D1 | Un normalizador en `packages/shared/src/busquedaTickets.ts`: `patronSerial` y `leerBusquedaTickets` | Normalizar en el middleware; normalizar en SQL | Regla 13 y molde H5: una sola noción, probada, que consumen las dos búsquedas. SQL sin `TRIM` ni `CAST` (pg-mem) |
| D2 | Serial del equipo por `t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $p)` | `LEFT JOIN equipos e` + `LOWER(e.serial) LIKE` (propuesta); buscar sólo en `tickets.serial` (exploración) | §1. Queda como plan B el `LEFT JOIN` y como plan C resolver los ids en una consulta previa (§5) |
| D3 | El fragmento SQL vive en `packages/zoho-sync/src/db/busquedaTickets.ts` y recibe el índice del primer parámetro | Construirlo dentro de `repo.ts` | `repo.ts` es el fichero más citado: cero líneas netas |
| D4 | Validación como middleware de RUTA (`leerBusqueda`), detrás de `requireAuth` | Validar dentro del manejador; `app.use` global | Cero líneas netas en `routes/tickets.ts` y orden 401 < 422 mutables por posición |
| D5 | `q` ausente → sin filtro; presente y no texto (`?q=a&q=b`) → `422`; vacío o de espacios → sin filtro | Tomar el primer valor de la lista; ignorar en silencio | Un parámetro repetido no tiene lectura única; error de contenido, escalón C |
| D6 | La longitud (64) se mide sobre el texto YA recortado | Medir el texto crudo | Los espacios de los lados no son búsqueda (S-3); el tope protege el patrón |
| D7 | El patrón lleva el texto recortado ENTERO, incluido un `#` inicial; el número se extrae aparte con `^#?(\d+)$` | Quitar el `#` también del patrón | «#864» busca el ticket 864 por número; por serial sólo casaría un serial que contenga «#864». Sin excepciones en `patronSerial`, que es la pieza compartida |
| D8 | La búsqueda de tickets NO filtra `equipos.active`; `searchEquipos` sí | Filtrar activos | Un ticket existe aunque su equipo esté desactivado. Lo compartido es el PATRÓN, no el filtro de filas; la confrontación usa equipos activos |
| D9 | El reinicio de página se queda en `App.tsx` (dependencias del efecto de la línea 59) | Reductor en `.ts` probado | No decide dominio: el servidor responde `items` vacío y `total` filtrado a una página fuera de rango (`apps/desk/server/tickets.test.ts:90-99`). La petición con la página vieja la descarta `apps/desk/src/hooks/useAsync.ts:20-27` |
| D10 | La espera entre pulsaciones es `aplazar(fn, ms)` en `apps/desk/src/lib/busquedaTickets.ts`, probada con temporizadores falsos | `setTimeout` suelto en el `.tsx` | Cuesta 6 líneas y deja el `.tsx` sin lógica propia |
| D11 | `fetchTickets` (`apps/desk/src/api/client.ts:14-17`, `scope=all`) no gana `q` en el cliente; el servidor sí lo acepta en `scope=all` | Añadirlo también | El front no la usa (`apps/desk/server/routes/tickets.ts:113`); el servidor trata los tres alcances por igual |
| D12 | `listEquiposManage` (`apps/desk/server/db/equipos.ts:175`) NO pasa a `patronSerial` | Unificarla también | La letra nombra el autocompletado de la recepción. Es una noción hermana que sigue sin recortar: se devuelve como hallazgo para la bandeja, sin destino inventado |

## 3 · Contratos

```ts
// packages/shared/src/busquedaTickets.ts  (exportado desde index.ts, línea nueva AL FINAL)
export const BUSQUEDA_MAX = 64
export function patronSerial(q: string): string            // `%${q.trim().toLowerCase()}%`
export interface BusquedaTickets { numero: number | null; patron: string }
export type LecturaBusqueda = { ok: true; filtro: BusquedaTickets | null } | { ok: false; error: string }
export function leerBusquedaTickets(q: unknown): LecturaBusqueda

// packages/zoho-sync/src/db/busquedaTickets.ts
export function sqlBusquedaTickets(f: BusquedaTickets | null | undefined, desde: number):
  { and: string; where: string; params: unknown[] }        // sin filtro: '', '', []

// apps/desk/server/util/busquedaTickets.ts
export function leerBusqueda(req: Request, res: Response, next: NextFunction): void
export function busquedaDe(res: Response): BusquedaTickets | null

// apps/desk/src/lib/busquedaTickets.ts
export const ESPERA_BUSQUEDA_MS = 300
export function conBusqueda(url: string, q: string): string
export function aplazar(fn: () => void, ms: number): () => void   // devuelve la cancelación
```

**`leerBusquedaTickets`, caso a caso:**

| Entrada | Resultado |
|---|---|
| `undefined` | `{ ok: true, filtro: null }` |
| no es texto (lista, objeto) | `{ ok: false, error: 'Búsqueda inválida' }` |
| `''`, `'   '` | `{ ok: true, filtro: null }` |
| recortado > 64 | `{ ok: false, error: 'La búsqueda admite 64 caracteres como máximo' }` |
| `'864'`, `' #864 '`, `'0864'` | `numero: 864`, `patron: '%864%'`, `'%#864%'`, `'%0864%'` |
| `'# 864'`, `'86a'`, `'12345678901'` (no cabe en `integer`, tope 2147483647) | `numero: null`, patrón del texto |
| `'22052 '`, `'85HHP'` | `numero: 22052` / `null`; patrón en minúsculas y recortado |

Espacios interiores, `%` y `_` se conservan tal cual (S-3, S-4). `patronSerial('')` es `'%%'`: lo mismo que hace
hoy `searchEquipos` con texto vacío (`apps/desk/server/db/equipos.ts:60`).

**Consumo:** `searchEquipos` pasa a `const like = patronSerial(q)` en la misma línea 60, con `patronSerial`
añadido a la importación de la línea 6. **Qué cambia en el autocompletado (S-3):** sólo que los espacios de los
lados dejan de formar parte del patrón; mayúsculas, «contiene» y comodines, igual. **Qué lo fija hoy:**
`apps/desk/server/db/equipos.test.ts:25-27`, `:64`, `:68`, `:77`, `:83`, `:467`, `:486` y `:503`; ninguna pasa
espacios a los lados, así que siguen verdes sin tocarlas. El caso nuevo lo fija la confrontación.

## 4 · SQL

Predicado, con `d` = índice del primer parámetro:

    con número:  (t.number = $d OR LOWER(t.serial) LIKE $d+1 OR t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $d+1))
    sin número:  (LOWER(t.serial) LIKE $d OR t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $d))

`and` = `' AND ' + predicado`; `where` = `' WHERE ' + predicado`. Los paréntesis exteriores son la guarda de
posición (§8, MP-1). Sin filtro el SQL emitido es **el de hoy, carácter a carácter** (criterio 4). `equipos` va
sin calificar, como en `searchEquipos`: no se crea ninguna tabla.

| Consulta | `desde` | Fragmento | Parámetros |
|---|---|---|---|
| `getActiveTickets` | 2 | `and`, tras el filtro de estado | `[userId, ...b.params]` |
| `getClosedTickets` | 4 | `and`, antes de `ORDER BY`; `LIMIT $2 OFFSET $3` no se mueven | `[userId, limit, offset, ...b.params]` |
| `countClosedTickets` | 1 | `and`; la tabla gana el alias `t` | `b.params` |
| `getAllTickets` | 2 | `where` (hoy no tiene `WHERE`) | `[userId, ...b.params]` |

«Mis tickets» no tiene consulta propia: usa `getActiveTickets` y filtra después (`apps/desk/server/routes/prioridad.ts:85`).

### pg-mem

- **H-1 (hipótesis, a despejar en el PRIMER rojo del lote 1):** pg-mem acepta `IN (SELECT … WHERE LOWER(serial) LIKE $n)`
  con parámetro dentro de la subconsulta. El precedente cubre `NOT IN` no correlacionado con filtros literales,
  no con parámetro.
- **Plan B:** `LEFT JOIN equipos e ON t.equipo_id=e.id` + `LOWER(e.serial) LIKE $p` (sin precedente; el fragmento
  ganaría un campo `join` y las líneas 150, 165 y 185 de `repo.ts` lo interpolarían, siempre en su sitio).
- **Plan C (siempre funciona):** una consulta previa `SELECT id FROM equipos WHERE LOWER(serial) LIKE $1` y
  `t.equipo_id IN ($d+1, …)` expandido. Cuesta una consulta más por petición: habría que revisar
  `apps/desk/server/misTickets.test.ts:121`, que cuenta consultas (sin `q` el número no cambia).
- Si H-1 cae, `sdd-apply` pasa a B y luego a C sin volver a diseño: el contrato de `sqlBusquedaTickets` no cambia
  para sus llamadores salvo en C, donde pasa a ser asíncrono y recibe `db`. Eso sí se anota en el parte.

## 5 · Cambios fichero a fichero

`eslint.config.js:29-32` es el único bloque de reglas propias y no hay `semi`, `no-extra-semi` ni
`max-statements-per-line`: unir sentencias con `;` no lo rechaza el lint. Precedentes vivos:
`apps/desk/server/routes/tickets.ts:5` y `apps/desk/server/routes/tickets.ts:9`.

### Lote 1 · Núcleo

| Fichero | Línea(s) | Cambio |
|---|---|---|
| `packages/shared/src/busquedaTickets.ts` | NUEVO | §3 |
| `packages/shared/src/index.ts` | tras la 31 | `export * from './busquedaTickets'` (última línea: no desplaza nada) |
| `packages/zoho-sync/src/db/busquedaTickets.ts` | NUEVO | §4 |
| `packages/zoho-sync/src/db/repo.ts` | 129 | se une `; import { sqlBusquedaTickets } from './busquedaTickets'; import type { BusquedaTickets } from '@ambientalia/shared'` |
| | 142, 157, 172, 177 | firma: último parámetro `busqueda?: BusquedaTickets \| null` |
| | 143, 158, 178 | `const b = sqlBusquedaTickets(busqueda, N); const r = await db.query(` (N = 2, 4, 2) |
| | 151, 166 | `${b.and}` entre el filtro de estado y `ORDER BY` |
| | 186 | `${b.where} ORDER BY …` |
| | 152, 167, 187 | `...b.params` al final de la lista |
| | 173 | `const b = sqlBusquedaTickets(busqueda, 1); const r = await db.query(\`SELECT count(*)::int AS n FROM tickets t WHERE t.status_type = 'Closed'${b.and}\`, b.params)` |
| `apps/desk/server/db/equipos.ts` | 6, 60 | importación y `patronSerial(q)` |

15 líneas de `repo.ts` y 2 de `equipos.ts`, todas reemplazadas en su sitio. El parámetro es opcional: nadie que
llame hoy a estas funciones cambia, y el lote 1 queda verde sin el lote 2.

### Lote 2 · Puertas y cliente

| Fichero | Línea(s) | Cambio |
|---|---|---|
| `apps/desk/server/util/busquedaTickets.ts` | NUEVO | §3 |
| `apps/desk/server/routes/tickets.ts` | 13 | se une `; import { leerBusqueda, busquedaDe } from '../util/busquedaTickets'` |
| | 104 | `app.get('/api/tickets', leerBusqueda, asyncHandler(…` |
| | 108, 109, 114 | `busquedaDe(res)` como último argumento de las cuatro llamadas |
| `apps/desk/server/routes/prioridad.ts` | 7, 83, 85 | importación unida; `requireAuth(db), leerBusqueda,`; `getActiveTickets(db, yo, busquedaDe(res))` |
| `apps/desk/server/db/ticketsConCliente.ts` | 6, 26-27, 29-30, 32-33 | `type BusquedaTickets` en la importación; parámetro opcional que se pasa a `repo` |
| `apps/desk/src/lib/busquedaTickets.ts` | NUEVO | §3 |
| `apps/desk/src/api/client.ts` | 1 | se une `; import { conBusqueda } from '../lib/busquedaTickets'` |
| | 19-20, 25-26, 743-744 | parámetro `q = ''` y `fetch(conBusqueda(<url de hoy>, q), …)` |
| `apps/desk/src/App.tsx` | 17 | se une la importación de `BuscadorTickets` |
| | 58 | se une `; const [q, setQ] = useState('')` |
| | 59, 71 | `q` en las dos listas de dependencias |
| | 63, 66, 69 | `q` como último argumento de las tres llamadas |
| | 107 | `<BuscadorTickets onBuscar={setQ} />` delante de `<ViewModeMenu …/>`, misma línea |
| `apps/desk/src/components/BuscadorTickets.tsx` | NUEVO | caja `type="search"`, `maxLength={BUSQUEDA_MAX}`, estado local y `useEffect(() => aplazar(() => onBuscar(texto), ESPERA_BUSQUEDA_MS), [texto, onBuscar])` |

**Comprobación de cierre de cada lote:** `git diff --numstat` de `routes/tickets.ts`, `repo.ts`, `App.tsx`,
`client.ts`, `equipos.ts`, `prioridad.ts` y `ticketsConCliente.ts` con inserciones = borrados. Con eso no hay
citas que barrer; si alguno no cuadra, barrido completo de la regla de mutación 4 sobre ese fichero (los recuentos
por debajo de cada punto están en la propuesta, §7).

## 6 · Puertas

| Ruta | Acepta | Orden | Texto inválido |
|---|---|---|---|
| `GET /api/tickets` (activos, `scope=all`, `scope=closed`) | `q` | `requireAuth` (`apps/desk/server/routes/tickets.ts:35`) → `leerBusqueda` (línea 104) → manejador | `422 { error }`, antes de cualquier consulta de tickets |
| `GET /api/mis-tickets` | `q` | `requireAuth` → `leerBusqueda` (línea 83 de `prioridad.ts`) → manejador | igual |

Escalera: sin sesión `401` (`apps/desk/server/auth/middleware.ts:17`) antes que contenido `422` (escalón C). No
hay escalón A ni D: una búsqueda no tiene sujeto ni unicidad. En `scope=closed`, `items` y `total` reciben el
MISMO `busquedaDe(res)` (líneas 108 y 109): la paginación cuenta lo filtrado.

## 7 · Cliente

| Pieza | Dónde | Prueba |
|---|---|---|
| `conBusqueda`: `q === ''` devuelve la URL intacta; si no, añade `q=` con `encodeURIComponent`, con `?` o `&` según la URL | `.ts` | automática |
| `aplazar`: llama una vez pasados `ms`; cancelada no llama | `.ts` | automática, temporizadores falsos |
| Reinicio de página al cambiar `q` | `apps/desk/src/App.tsx:59` | persona (D9) |
| La caja y su cableado | `BuscadorTickets.tsx`, `App.tsx` | persona |

El cliente no recorta, no quita `#` y no pasa a minúsculas: `conBusqueda` sólo decide si hay algo que enviar.

## 8 · Plan de pruebas (`strict_tdd`) y mutaciones

Las pruebas nuevas no usan `as any`: el lint está en 165 avisos sin holgura y cada `any` suma uno.

### Lote 1

| Fichero (nuevo) | Prueba | Clase |
|---|---|---|
| `packages/shared/src/busquedaTickets.test.ts` | tabla del §3, caso a caso | ROJO: el módulo no existe |
| `packages/zoho-sync/src/db/busquedaTickets.test.ts` | **primera:** ticket enlazado a un equipo, se encuentra por el serial del equipo (despeja H-1) | ROJO |
| | número exacto: «864» sí, «86» no por número; dígitos que no caben en `integer` no rompen | ROJO |
| | últimos dígitos, centro, serial guardado en mayúsculas | ROJO |
| | serial del equipo corregido: se encuentra por el nuevo y por el viejo (criterio 3) | ROJO |
| | **posición:** un cerrado y un activo que casan los dos, uno por `t.serial` y otro por el equipo; activos devuelve sólo el activo; cerrados y su recuento, sólo el cerrado | ROJO |
| | recuento y página 2 filtrados (criterio 5) | ROJO |
| | `getAllTickets` con filtro (rama `where`) | ROJO |
| | sin filtro (`undefined` y `null`): mismos resultados que sin el argumento | CARACTERIZACIÓN |
| `apps/desk/server/db/busquedaConfrontacion.test.ts` | una tabla de casos, dos veredictos por caso | ROJO sólo en «espacios»; el resto CARACTERIZACIÓN de `searchEquipos` |

**Confrontación (molde H5).** Por caso: un equipo activo con serial `S` y sin marca, modelo, tipo, cliente ni
código interno que puedan casar; un ticket SIN equipo enlazado con `serial = S` y número alto que no colisione.
Veredicto A = `searchEquipos(db, q)` encuentra el equipo; veredicto B =
`getActiveTickets(db, '', leerBusquedaTickets(q).filtro)` encuentra el ticket. Se exige A = B **y** el valor
esperado. Casos: últimos dígitos, centro, `q` en mayúsculas contra serial en minúsculas y al revés, espacios a los
lados, `%`, `_` como comodín, texto que no casa, vacío (los dos devuelven todo).

### Lote 2

| Fichero (nuevo) | Prueba | Clase |
|---|---|---|
| `apps/desk/server/busquedaTickets.test.ts` | criterios 1 y 2 por HTTP (`?q=864`, `?q=%23864`, `?q=86`, últimos dígitos, espacios) | ROJO: la ruta ignora `q` |
| | `scope=closed&q=`: `total` filtrado y página 2 | ROJO |
| | `mis-tickets?q=`: sólo los del usuario y en el orden de la cola | ROJO |
| | 65 caracteres con sesión → `422`; `?q=a&q=b` → `422` | ROJO |
| | **posición:** 65 caracteres SIN sesión → `401`, en las dos rutas | CARACTERIZACIÓN que la mutación MP-2 vuelve roja |
| | `q` ausente, vacío y de espacios: cuerpo idéntico al de la misma petición sin `q`, en las tres | CARACTERIZACIÓN |
| `apps/desk/src/lib/busquedaTickets.test.ts` | `conBusqueda` y `aplazar` | ROJO: el módulo no existe |

Arnés: el de `apps/desk/server/tickets.test.ts:6` (`adminCookie` y `userCookie`,
`apps/desk/server/testing/appHarness.ts:86` y `apps/desk/server/testing/appHarness.ts:91`).

### Mutaciones que el orquestador reproduce a mano

| # | Receta | Prueba que cae |
|---|---|---|
| **MP-1** posición | `zoho-sync/db/busquedaTickets.ts`: quitar los paréntesis EXTERIORES del predicado | «posición» del lote 1: el cerrado que casa por su equipo aparece en activos |
| **MP-2** posición | `routes/tickets.ts`: quitar `leerBusqueda` de la línea 104 y dejar la 35 como `app.use('/api/tickets', leerBusqueda, requireAuth(db))`. Y en `prioridad.ts`, línea 83, intercambiar `requireAuth(db)` y `leerBusqueda` | 65 caracteres sin sesión: llega `422`, se esperaba `401` |
| MC-1 | quitar `OR t.equipo_id IN (…)` del predicado | serial corregido del equipo |
| MC-2 | `leerBusquedaTickets`: devolver siempre `numero: null` | «864» encuentra el ticket 864 |
| MC-3 | `patronSerial`: quitar el `%` inicial («empieza por») | últimos dígitos (unitaria y de repositorio). **La confrontación sigue verde a propósito:** las dos búsquedas cambian juntas, que es lo que demuestra que comparten la pieza |
| MC-4 (M-4) | `equipos.ts`, línea 60: volver a `` `%${q.toLowerCase()}%` `` | confrontación, caso «espacios» |
| MC-5 | `leerBusquedaTickets`: `patron` sin pasar por `patronSerial` (`` `%${t}%` ``) | confrontación, `q` en mayúsculas; unitaria |
| MC-6 | quitar `LOWER(` de `t.serial` en el predicado | serial guardado en mayúsculas |
| MC-7 | `t.number = $d` → `t.number >= $d` | «86» no devuelve el 864 |
| MC-8 | `repo.ts`, línea 173: quitar `${b.and}` | `total` filtrado |
| MC-9 | `leerBusquedaTickets`: quitar la comprobación de longitud | `422` con sesión |

**Sobre el criterio 6 de la propuesta:** «poner el predicado antes del filtro de estado» es un mutante
EQUIVALENTE mientras conserve sus paréntesis (el `AND` conmuta) y no pone nada rojo; la posición que discrimina es
la de los paréntesis (MP-1). Se dice aquí para que nadie lo dé por probado con la otra receta. Regla de mutación 2:
no aplica (no hay fichero de datos vigilado).

## 9 · Regla 13, decisión a decisión

Las líneas son las de después del cambio, que coinciden con las de hoy porque no se mueve ninguna.

| # | Qué hace el cliente | Línea del servidor que lo impone | Clase |
|---|---|---|---|
| 1 | Envía el texto tal cual | `apps/desk/server/routes/tickets.ts:104` y `apps/desk/server/routes/prioridad.ts:83` (`leerBusqueda`) | consume |
| 2 | No filtra por `q` lo recibido | `packages/zoho-sync/src/db/repo.ts:151`, `packages/zoho-sync/src/db/repo.ts:166`, `packages/zoho-sync/src/db/repo.ts:173`, `packages/zoho-sync/src/db/repo.ts:186` | consume |
| 3 | No normaliza (ni `#`, ni minúsculas, ni recorte) | `leerBusquedaTickets`, llamado sólo desde `leerBusqueda` | consume |
| 4 | `maxLength` 64 en la caja | `422` de `leerBusqueda`, probado | comodidad con imposición probada |
| 5 | Vuelve a la página 1 (`apps/desk/src/App.tsx:59`) | `total` filtrado en `apps/desk/server/routes/tickets.ts:109`; página fuera de rango → `items` vacío | comodidad |
| 6 | Pagina con el `total` recibido | `apps/desk/server/routes/tickets.ts:109` | consume |
| 7 | Filtro de vista sobre el resultado | no es guarda; no cambia | vista |
| 8 | «Mis tickets» con `q` | `apps/desk/server/routes/prioridad.ts:85` | consume |
| 9 | Espera entre pulsaciones; omite `q` si la caja está vacía | sin regla de dominio: `q` vacío y `q` ausente dan lo mismo en el servidor, probado | comodidad |

Ninguna decisión queda sólo en el cliente.

## 10 · Lotes definitivos y medida

Dos lotes, un intento del registro cada uno. Pruebas × 1,8; casillas a 2 líneas; `apply-progress.md` a 40 por
lote. Una línea editada en su sitio cuenta 2 (borrado + inserción).

| Lote 1 | Líneas |
|---|---|
| `shared/busquedaTickets.ts` 32 · `index.ts` 1 · `zoho-sync/db/busquedaTickets.ts` 22 | 55 |
| `repo.ts` 15 × 2 · `equipos.ts` 2 × 2 | 34 |
| pruebas: 55 + 95 + 60 = 210 → × 1,8 | 378 |
| casillas 8 × 2 · `apply-progress.md` | 56 |
| **Total** | **523** |

| Lote 2 | Líneas |
|---|---|
| `server/util/busquedaTickets.ts` 18 · `src/lib/busquedaTickets.ts` 16 · `BuscadorTickets.tsx` 30 | 64 |
| `tickets.ts` 5 × 2 · `prioridad.ts` 3 × 2 · `ticketsConCliente.ts` 7 × 2 · `client.ts` 7 × 2 · `App.tsx` 8 × 2 | 60 |
| pruebas: 110 + 40 = 150 → × 1,8 | 270 |
| casillas 12 × 2 · `apply-progress.md` | 64 |
| **Total** | **458** |

Los dos bajo la válvula de 720. La propuesta daba 430 y 406 sin `apply-progress.md` ni el doble recuento de las
líneas editadas. Cada lote cierra con `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores) y la
medida real (`git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear).
Si el lote 1 tuviera que pasar al plan C, se vuelve a medir antes de seguir.

## 11 · Matriz de amenazas

No aplica: no hay enrutado de órdenes, shell, subprocesos, automatización de control de versiones ni
clasificación de ejecutables. El único límite nuevo es un parámetro de consulta HTTP, siempre parametrizado
(`$n`) y nunca interpolado en el SQL.

## 12 · Despliegue

- Sin esquema, índices, variables de entorno ni migración. Servidor y cliente salen en el mismo artefacto.
- Dato a pedir a quien despliegue, para confirmar la hipótesis de tamaño del `LIKE` sin índice:
  `SELECT count(*) FROM desk.tickets;` y `SELECT count(*) FROM desk.equipos;`.
- Comprobaciones de persona en la aplicación (fuera del recuento de tareas): un número con y sin `#`; los
  últimos dígitos de un serial; el mismo serial en minúsculas; un cerrado que no esté en la primera página, y que
  el paginador muestre el total filtrado; lo mismo en «Mis tickets»; cambiar de página, escribir y ver que vuelve a
  la primera; borrar el texto y ver el listado completo; en la recepción, que el autocompletado por serial sigue
  respondiendo igual.
- Reversión: `git revert` de la fusión. Retirar sólo la caja deja `q` sin emisor y el listado como hoy.

## 13 · Preguntas abiertas

- [ ] H-1 (pg-mem y la subconsulta con parámetro): se despeja en el primer rojo del lote 1. No bloquea: planes B y C escritos.
- [ ] D12: `listEquiposManage` conserva su patrón propio. Hallazgo para la bandeja; decide el alcance quien lo asigne.
- [ ] Las cuatro preguntas de la propuesta (E-nueva-1 a 4) siguen con su supuesto; ninguna bloquea.
