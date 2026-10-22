# Diseño — `filtro-indicadores-por-flujo` (F1F-05, `cierra: no`)

Base: `e901fb99`. Requisitos: RQ-KP-29..33 (`specs/kpis/spec.md`); supuestos S-1..S-8 de la propuesta (§6). Toda cita se leyó en el
worktree; lo no comprobado lleva «hipótesis». **Ningún fichero existente gana ni pierde líneas antes de su última línea de hoy**: lo
nuevo va al final o dentro de una línea que ya existe (regla de mutación 4; molde `archive/2026-10-21-salidas-esperas/design.md`).
Matriz de amenazas: **N/A** (sin shell, subprocesos, VCS ni clasificación de ejecutables). **Sin migración**: la columna existe
(`packages/zoho-sync/src/db/schema.sql:23`) y ninguna sentencia crea tablas. Fuera de alcance y sin cambios: la población «como Zoho»
(P-1), `flujoDelTicket`, `normalizar`, las alarmas (`apps/desk/server/db/sla.ts:49`) y los KPI de `fetchAnalisis` (`Analisis.tsx:77`).

```
GET  ?flujo → periodo → flujo → leerEntradasIndicadores (4 consultas, con clasificaciones) → recortarPorFlujo (null ⇒ la MISMA entrada) → json | csv
POST ?flujo → multer → periodo → flujo → fichero → lector → leerEntradasIndicadores → cruzarExportacion(TODOS los del periodo)
            ├ sin flujo: numerosDeTickets + repartirSinCruzar (las llamadas de hoy) ─┐
            └ con flujo: ticketsConClasificacion (mismos bloques) + cruzarPorFlujo  ─┴→ tablaIndicadores(cruzados) → (+ flujo, deOtroFlujo)
Análisis: selector → urlIndicadores(…, flujo) · <ComparacionExportacion flujo> → compararConExportacion → urlComparacion
```

## D1 · El predicado: `flujoPorClasificacion`, sólo la clasificación (confirma S-1)

`export function flujoPorClasificacion(clasificacion: string | null | undefined): Flujo`, tras `packages/shared/src/flujos.ts:163`.
`esClasificacionSoporteRemoto` (`:116-119`) → `soporte-remoto`; `esClasificacionEquipoNuevo` (`:40-43`) → `equipo-nuevo`; si no,
`servicio` (también `null`, `undefined` y grafías no reconocidas). `normalizar` (`:32-34`) no se toca. La firma no recibe el estado:
el «MUST NOT depender del estado» de RQ-KP-30 lo impone el tipo, no la disciplina.

Los dos casos del encargo, sobre estados del registro (`packages/shared/src/estados.ts:112`, 26) y el catálogo de equipo nuevo
(`packages/shared/src/transitions.ts:350-363`: Ingresado, En Proceso, Notificado, Verificación, Finalizado, Anulado):

| Ticket con clasificación «Equipo nuevo» | `flujoDelTicket` (`flujos.ts:57`) | `flujoPorClasificacion` |
|---|---|---|
| Recién dado de alta: todo alta que no es soporte remoto nace en `Ticket creado` (`flujos.ts:138-140`) | `servicio` | `equipo-nuevo` |
| Heredado en `Rev./Diagnostico` o en `Por Facturar` | `servicio` | `equipo-nuevo` |
| El MISMO ticket del primer caso, ya en `Finalizado` | `equipo-nuevo` | `equipo-nuevo` |

En `Finalizado` coinciden; los separa el estado de servicio. Con `flujoDelTicket`, un ticket cuenta como `servicio` el día del alta y
como `equipo-nuevo` desde `Ingresado`: la descarga del MISMO periodo cerrado da poblaciones distintas según el día en que se pida, y un
heredado en `Por Facturar` no entra en «equipo nuevo» hasta finalizar. Su condición de estado es una guarda de **enrutado**
(`flujos.ts:50-55`: que el heredado no quede varado), no una definición de población. Igual en soporte remoto: «Soporte remoto» en
`Rev./Diagnostico` da `servicio` con `flujoDelTicket`, porque ese estado no está en `transitions.ts:388-397`.
Descartados: `flujoDelTicket` (población que cambia con el estado de hoy; RQ-KP-30 la excluye) y el flujo por historial
(`flujoDeTransicion` de cada paso, `flujos.ts:83-88`: un ticket puede mezclar catálogos, haría falta un desempate que nadie ha decidido
y uno sin pasos no tendría flujo). **S-1, confirmado** (reversible, lista semanal de F1F-05): revertir es cambiar el cuerpo de una
función. Las alarmas siguen con `flujoDelTicket` porque miran el estado de ahora (hipótesis razonada).

## D2 · Lista y nombres de los flujos: de `flujos.ts`, sin tercera lista (S-4, S-8)

- `export const FLUJOS = Object.keys(CATALOGO_POR_FLUJO) as readonly Flujo[]`, al final de `flujos.ts` con D1: `servicio`,
  `equipo-nuevo`, `soporte-remoto`, el orden de `:19-22`. Así la deriva ya, como constante local, `mapaBlueprint.test.ts:263`.
- `NOMBRE_FLUJO`: `:127` pasa de `const` a `export const` y `:126` amplía su comentario («…y el selector de Análisis»), en sitio. Sale
  por `packages/shared/src/index.ts:22`; ningún otro módulo de `shared` exporta `FLUJOS`, `NOMBRE_FLUJO` ni `flujoPorClasificacion`.
- Descartado: lista literal en el validador o en el cliente (diverge al añadir un flujo) y `Object.hasOwn(CATALOGO_POR_FLUJO, v)` (el
  cliente necesita igualmente la lista ordenada). Observación fuera de alcance, para la bandeja: los comentarios de `flujos.ts:45`
  («los 5») y `:121` («los 4») cuentan menos estados de los que tienen hoy los catálogos (6 y 5, `transitions.ts:350-363`, `:388-397`).

## D3 · `validarFlujo` y el orden de las guardas (RQ-KP-29)

Al final de `apps/desk/server/indicadores.ts` (tras `:96`): `export const MENSAJE_FLUJO = 'El parámetro «flujo» debe ser servicio,
equipo-nuevo o soporte-remoto'` (molde `:36`; una prueba fija que nombra cada elemento de `FLUJOS`); `export type FlujoValidado =
{ ok: true; flujo: Flujo | null } | { ok: false; error: string }`; `export function validarFlujo(v: unknown): FlujoValidado`:
`undefined` → `null`; `FLUJOS.find((f) => f === v)` → ese flujo; lo demás → `MENSAJE_FLUJO`.

- Vacío (`flujo=` llega `''`), repetido (Express 5, `package.json:33`, lo entrega como array; hipótesis que fija la prueba) y otra
  grafía (`Servicio`): ninguno es igual a un elemento de `FLUJOS` → `400`. Sin normalizar (S-4).
- GET, en sitio: `routes/indicadores.ts:42` `const p = validarPeriodo(req.query), fl = validarFlujo(req.query.flujo)`; `:43` tras
  `if (!p.ok) {…}` y en la MISMA línea, `if (!fl.ok) { res.status(400).json({ error: fl.error }); return }`. Orden: sesión <
  administrador < periodo y formato < flujo < lectura.
- POST, en sitio: `routes/indicadoresComparacion.ts:27` y `:28` igual; `:29` («falta el fichero») queda detrás. Orden: … < multer <
  periodo < flujo < fichero < lector < consultas. Los comentarios que lo enumeran se ponen al día en sitio (`:15` y `:26`).
- Descartado: una línea nueva tras `:43` o `:28`. Desplazaría `routes/indicadores.ts:52`, citada desde `openspec/config.yaml:4105`
  —fichero que esta tanda no toca—, y `routes/indicadoresComparacion.ts:29` y `:30-31`, citadas desde `DEPLOY.md:744-745`. Ampliar
  `validarPeriodo`: RQ-KP-29 lo prohíbe y sus pruebas (`apps/desk/server/indicadores.test.ts:21-36`) no se editan.

## D4 · La clasificación entra en la lectura sin mover una línea

`apps/desk/server/indicadores.ts:1-96`, sólo en sitio: `:2` el import de `shared` gana `flujoPorClasificacion, FLUJOS, type Flujo`;
`:43` gana `; clasificaciones: Map<string, string | null>`; `:64` añade `t.classification` tras `t.status` (la MISMA consulta: siguen
siendo cuatro, RQ-KP-14); `:65` declara `clasificaciones = new Map<string, string | null>()` junto a `tickets`; `:73` la rellena antes
del `push` (`clasificaciones.set(String(r.id), r.classification == null ? null : String(r.classification));`), sólo para los admitidos
por `:70`; `:88` la devuelve. Viaja CRUDA (texto o `null`) por id; el predicado se aplica sólo en las funciones puras de D5 y D6.

Descartado: campo en `TicketParaIndicadores` (`packages/shared/src/indicadores.ts:33-42`), tipo del cálculo que no la usa; obligatorio,
cambiaría los literales de prueba que lo construyen (`apps/desk/server/comparacion/cruzarExportacion.test.ts:7-8`); opcional, ensucia
el dominio. `Map<id, Flujo>` resuelto al leer: la comparación necesita además la clasificación de tickets FUERA del periodo (D7), y el
predicado acabaría aplicándose en dos capas distintas.

## D5 · Recorte del GET

Al final de `indicadores.ts`: `export function recortarPorFlujo(e: EntradasIndicadores, flujo: Flujo | null): EntradasIndicadores`.
Con `null` devuelve **la misma referencia** (prueba con `toBe`); con flujo, `{ ...e, tickets: e.tickets.filter((t) =>
flujoPorClasificacion(e.clasificaciones.get(t.id)) === flujo) }`. Historial, encuesta y cierres no se recortan: `tablaIndicadores` los
busca por id (`:95`). Va después de leer: cuatro consultas con o sin flujo.

`apps/desk/server/routes/indicadores.ts`: **0 líneas insertadas** (55 antes y después), en sitio:
- `:7` importa `validarFlujo, recortarPorFlujo`; `:44` `tablaIndicadores(recortarPorFlujo(await leerEntradasIndicadores(db, p), fl.flujo))`.
- `:48`: `indicadores-${fl.flujo === null ? '' : `${fl.flujo}-`}${día}.csv`. Sin flujo, el nombre de hoy (`routes/indicadores.test.ts:96`
  sigue verde); con él, `indicadores-equipo-nuevo-AAAA-MM-DD.csv`. Las cabeceras (`:26`) no cambian.
- `:53`: `{ periodo, ...(fl.flujo === null ? {} : { flujo: fl.flujo }), tickets, comparacion }`: la clave va tras `periodo` y sólo con
  flujo; `comparacion` sale de las filas recortadas. Descartado: recortar en SQL (`WHERE classification …`), que duplicaría la
  normalización de `flujos.ts:32-34` (molde H5) y cambiaría la consulta sin flujo.

## D6 · Comparación: cruzar con todo y repartir después (RQ-KP-32, S-2, S-3)

Al final de `apps/desk/server/comparacion/cruzarExportacion.ts` (tras `:41`), puras; `cruzarExportacion` y `repartirSinCruzar` intactas:

```ts
export interface TicketExistente { numero: number; clasificacion: string | null }
export interface CruceRepartido extends ResultadoCruce { soloEnFichero: TicketRef[]; fueraDelPeriodo: TicketRef[]; deOtroFlujo?: TicketRef[] }
export function cruzarPorFlujo(filas: readonly FilaExportacion[], delPeriodo: readonly TicketParaIndicadores[],
  clasificaciones: ReadonlyMap<string, string | null>, existentes: ReadonlyMap<string, TicketExistente>, flujo: Flujo): CruceRepartido
```

1. Flujo de cada «ID» que Desk tiene: el del periodo, por `clasificaciones`; el de fuera, por `existentes`; los dos con D1.
2. `deOtroFlujo` = filas cuyo «ID» está en Desk con otro flujo, dentro o fuera del periodo; `numero` = el del fichero (como dice
   `:35`). **Gana** a «fuera del periodo» y a «sólo en el fichero». Un «ID» ausente de Desk no tiene flujo y nunca entra.
3. Con el resto: `cruzarExportacion(restoDeFilas, delPeriodo del flujo)` da `cruzados`, `soloEnDesk` y `numeroDistinto` sólo del flujo
   pedido; `repartirSinCruzar(sinCruzar, números de existentes)` da «sólo en el fichero» y «fuera del periodo».
4. Invariante con flujo: `leidas = rechazadas + cruzados + soloEnFichero + fueraDelPeriodo + deOtroFlujo` (la de
   `apps/desk/server/routes/indicadoresComparacion.test.ts:92`, con un sumando más).

`:2` pasa de `import type {…}` a `import { flujoPorClasificacion, type Flujo, type NumeroDistinto, … }`, en sitio. Sigue sin base, red
ni disco (`:1`; lo vigila `apps/desk/server/routes/indicadoresComparacion.test.ts:141-143`, que además prohíbe `console`). Descartado: recortar
`entradas.tickets` ANTES de cruzar (el ticket de otro flujo del periodo caería en `sinCruzar` y `:39` lo diría «fuera del periodo»,
falso); excluir y sólo contar (los demás cubos llevan lista, y con ella el administrador ve cuáles son).

## D7 · Clasificación de los «ID» sin cruzar: sin consulta nueva y sin tocar `numerosDeTickets`

Al final de `apps/desk/server/db/ticketsPorId.ts` (tras `:19`): `export async function ticketsConClasificacion(db: Queryable, ids:
readonly string[], trozo = 5000): Promise<Map<string, { numero: number; clasificacion: string | null }>>`, con la forma de `:10-19`:
únicos, bloques de `trozo`, `marcadores` (`:7`), `SELECT id, number, classification FROM tickets WHERE id IN (…)` sin calificar (`:4-5`)
y lista vacía sin sentencia. La ruta la llama **en lugar de** `numerosDeTickets` y **sólo con flujo**, desde un auxiliar al final de
`routes/indicadoresComparacion.ts` (tras `:51`), `async function cruceDeLaPeticion(db, filas, entradas: EntradasIndicadores, flujo:
Flujo | null): Promise<CruceRepartido>`: `c = cruzarExportacion(filas, entradas.tickets)` y, con los «ID» de `c.sinCruzar`, sin flujo
`{ ...c, ...repartirSinCruzar(c.sinCruzar, await numerosDeTickets(db, ids)) }` —las llamadas de hoy, en su orden—; con flujo
`cruzarPorFlujo(filas, entradas.tickets, entradas.clasificaciones, await ticketsConClasificacion(db, ids), flujo)`. Los mismos «ID» y el
mismo número de sentencias con o sin flujo (cuatro + una por bloque, `apps/desk/server/routes/indicadoresComparacion.test.ts:96`). En sitio
en la ruta: imports `:3`, `:8`, `:9`, `:10`, `:11`; `:34` `const c = await cruceDeLaPeticion(db, l.filas, entradas, fl.flujo)`; `:35`
`const { soloEnFichero, fueraDelPeriodo, deOtroFlujo } = c`. `:36` y `:44` no cambian (`c.cruzados`, `c.soloEnDesk`, `c.numeroDistinto`).
Descartados: llamar SIEMPRE a la nueva (sin flujo cambiaría la sentencia y `numerosDeTickets` quedaría muerta en producción con sus
siete pruebas en verde); ampliar `numerosDeTickets` (cambia su firma y sus pruebas, `ticketsPorId.test.ts:21-75`, que no se editan); una
consulta aparte de clasificaciones (una sentencia más por bloque, M10). Duplicación aceptada: el bucle por bloques existe dos veces,
con el mismo `marcadores` y el mismo `trozo`.

## D8 · La forma de la respuesta del POST

En sitio (28 líneas antes y después), `packages/shared/src/indicadoresExportacion.ts:16` gana `; flujo?: import('./flujos').Flujo` y
`:21` gana `; deOtroFlujo?: { total: number; tickets: TicketRef[] }`; el tipo, sin import nuevo (molde `apps/desk/src/api/client.ts:906`).
Orden del JSON con flujo: `periodo, flujo, fichero, cruce{cruzados, soloEnFichero, fueraDelPeriodo, deOtroFlujo, soloEnDesk,
numeroDistinto, valoresIlegibles}, comparacion`, armado en sitio en `routes/indicadoresComparacion.ts:40` (`...(fl.flujo === null ? {} :
{ flujo: fl.flujo })`) y `:43` (`...(deOtroFlujo === undefined ? {} : { deOtroFlujo: conTotal(deOtroFlujo) })`). Con flujo, `deOtroFlujo`
está siempre, aunque vacío (molde de listas siempre presentes, `apps/desk/server/routes/indicadoresComparacion.test.ts:65-74`). Sin flujo, ni la clave ni `null`.
Descartado: claves obligatorias con `null`, que cambian los bytes sin flujo (M2).

## D9 · Cliente: transporte y presentación en `lib`; el `.tsx` sólo pinta (RQ-KP-33)

| Pieza | Firma o cambio | Sitio |
|---|---|---|
| `urlIndicadores` | `(formato, periodo?, flujo?: string)`; vacío o ausente no entra; va tras `hasta` | `apps/desk/src/lib/indicadoresUrl.ts:5`, `:8`, en sitio |
| `opcionesFlujo` | `(): Array<{ valor: '' \| Flujo; etiqueta: string }>`: `''`/«Todos» y `FLUJOS` con `NOMBRE_FLUJO` en mayúscula inicial | tras `indicadoresUrl.ts:18`; su import ocupa la línea 3, hoy vacía |
| `urlComparacion` | `(periodo, flujo?: string)`, mismo criterio | `apps/desk/src/lib/comparacionExportacion.ts:13`, `:16`, en sitio |
| `vistaComparacion` | `periodo` gana « · Flujo: <nombre>» si llega `flujo`; recuento y lista «De otro flujo» tras «Fuera del periodo» sólo si llega `deOtroFlujo`, con su total tal cual | `:56`, `:62`, `:76` en sitio (`...(c.deOtroFlujo ? [ … ] : [])`); `:4` importa `NOMBRE_FLUJO` |
| `compararConExportacion` | `(file, periodo, flujo?: string)` → `urlComparacion(periodo, flujo)` | `apps/desk/src/api/client.ts:897`, `:899` |
| `Analisis.tsx` | `:75` gana `const [flujo, setFlujo] = useState('')`; `:83` pinta el `<select>` de `opcionesFlujo()` ante el enlace, que pasa a `urlIndicadores('csv', undefined, flujo)`; `:91` `<ComparacionExportacion flujo={flujo} />`; `:6` importa `opcionesFlujo` | en sitio (118 líneas) |
| `ComparacionExportacion.tsx` | `:9` recibe `{ flujo }: { flujo?: string }`; `:20` lo pasa a `compararConExportacion` | en sitio |

`flujo` viaja como `string`: el cliente no valida (escenario «El cliente no valida»). El selector gobierna descarga y comparación
(S-7); la vista rotula el flujo de la RESPUESTA, no el del selector, así que cambiar el selector sin volver a comparar no rotula mal un
resultado anterior. Descartado: un `.tsx` de selector propio (lógica fuera de la red de pruebas, F0-00); tipar `flujo` como `Flujo`
en `lib` (obligaría a un `as` sobre el valor del DOM: una validación disfrazada).

## D10 · Regla 13, decisión a decisión (regla de mutación 3)

| # | Decisión del cliente | Línea del servidor que la impone |
|---|---|---|
| C1 | Selector sólo a administradores (`mostrarDescargaIndicadores`, `Analisis.tsx:83`, `:91`) | `requireAdmin` → `403`: `routes/indicadores.ts:41`, `routes/indicadoresComparacion.ts:25` |
| C2 | Ofrece sólo «Todos» y `FLUJOS` | `validarFlujo` → `400`: `routes/indicadores.ts:43` y `routes/indicadoresComparacion.ts:28`, en sitio (al aplicar) |
| C3 | «Todos» no envía `flujo` | `validarFlujo(undefined)` → `null` y `recortarPorFlujo(e, null)` devuelve `e` (al aplicar); el único corte sigue en `apps/desk/server/indicadores.ts:70` |
| C4 | La descarga lleva el flujo | `routes/indicadores.ts:44` (recorte) y `:48` (nombre), al aplicar |
| C5 | La comparación lleva el mismo flujo | `routes/indicadoresComparacion.ts:34` → `cruzarPorFlujo`, al aplicar |
| C6 | Pinta flujo y «De otro flujo» sólo si llegan, sin calcular | `routes/indicadoresComparacion.ts:40`, `:43` (serialización), al aplicar |
| C7 | Rótulos de `NOMBRE_FLUJO` | ninguna: es rótulo, no decisión; su fuente es `shared` (`flujos.ts:127`) |

## D11 · Pruebas y mutaciones (strict TDD)

Las pruebas de hoy no se editan. Las nuevas van AL FINAL de su fichero, con su `import` al principio del bloque añadido (ESM eleva los
`import`; precedente `apps/desk/src/api/client.ts:895-896`; `eslint.config.js:18-32` no activa `import/first`). **Primera tarea del
apply, antes de tocar producción: las tres caracterizaciones de M2**, verdes a propósito: GET json, GET csv (cuerpo) y POST sin
`flujo`, sobre un fixture con «Equipo nuevo» en `Ticket creado`, «Soporte remoto», «Servicio» y `NULL`; asertan el `sha256` literal del
cuerpo y el orden de las claves. El cuerpo es estable: el cálculo no lee la fecha del día (su único `new Date(`,
`packages/shared/src/indicadores.ts:152`, parte de un día dado). Cada M se ejecuta mutando el código y el rojo se anota en
`apply-progress.md`. Ficheros bajo `apps/desk/` salvo los de `packages/shared`.

| M | Caso que la pone roja | Fichero(s) |
|---|---|---|
| M1 | `flujo=equipo-nuevo` sobre los tres flujos: sólo los suyos y `flujo` en el JSON; `recortarPorFlujo` puro | `server/routes/indicadores.test.ts`, `server/indicadores.test.ts` |
| M2 | Las tres caracterizaciones; `recortarPorFlujo(e, null)` con `toBe(e)`; POST sin flujo sin `flujo` ni `deOtroFlujo` | las dos de rutas, `server/indicadores.test.ts` |
| M3 | `otro`, `''`, repetido y `Servicio` → `400` con `MENSAJE_FLUJO` y ninguna consulta de datos, GET y POST; `validarFlujo` puro | las dos de rutas, `server/indicadores.test.ts` |
| M4 | Con `flujo=equipo-nuevo`: SR del periodo y servicio fuera → `deOtroFlujo`; EN fuera → `fueraDelPeriodo`; ausente → `soloEnFichero`; invariante de D6 | `server/comparacion/cruzarExportacion.test.ts`, `server/routes/indicadoresComparacion.test.ts` |
| M5 | CSV `flujo=soporte-remoto`: filas sólo SR, cabecera de hoy, nombre con `soporte-remoto` | `server/routes/indicadores.test.ts` |
| M6 | «Equipo nuevo» en `Ticket creado` y en `Por Facturar` salen con `equipo-nuevo`; SR en `Rev./Diagnostico` con `soporte-remoto`; tabla que enfrenta los dos predicados en los 26 `ESTADOS` | `packages/shared/src/flujos.test.ts`, `server/indicadores.test.ts`, `server/comparacion/cruzarExportacion.test.ts` |
| M7 | `urlIndicadores('csv', undefined, 'equipo-nuevo')`; sin flujo y con `''`, sin `flujo` | `src/lib/indicadoresUrl.test.ts` |
| M8 | Periodo invertido + `flujo=otro` → mensaje del periodo (GET y POST); `formato=xml&flujo=otro` → el de formato; POST con `flujo=otro` sin fichero → `MENSAJE_FLUJO` | las dos de rutas |
| M9 | `urlComparacion({…}, 'soporte-remoto')`; sin flujo, la URL de hoy | `src/lib/comparacionExportacion.test.ts` |
| M10 | GET con flujo: `datos()` = 4; POST mixto con y sin flujo: 5; `ticketsConClasificacion`: bloques, parámetros, sólo `SELECT`, vacío sin sentencia | las dos de rutas, `server/db/ticketsPorId.test.ts` |
| M11 | Sin `deOtroFlujo`, ni recuento ni lista «De otro flujo»; con él, un total incoherente se repite | `src/lib/comparacionExportacion.test.ts` |
| M12 | Fixture vigilado (regla 2): «Equipo Nuevo» y `NULL` → `equipo-nuevo` y `servicio` | `packages/shared/src/flujos.test.ts`, `server/routes/indicadores.test.ts` |

## D12 · Regla de mutación 4: ficheros tocados y citas medidas

Medido con ripgrep `-o` sobre el worktree, patrón `<fichero>:[0-9]+`; entre paréntesis, las de los artefactos de este cambio.

| Fichero | Citas | Líneas que cambian |
|---|---|---|
| `apps/desk/server/indicadores.ts` | 82 (8) | en sitio `:2`, `:43`, `:64`, `:65`, `:73`, `:88`; nuevo tras `:96` |
| `apps/desk/server/routes/indicadores.ts` | 29 (5) | en sitio `:7`, `:42`, `:43`, `:44`, `:48`, `:53`; ninguna nueva |
| `apps/desk/server/routes/indicadoresComparacion.ts` | 51 (6); ≥ 7 son del homónimo de `shared` (líneas 63 y 90, que la ruta no tiene) | en sitio `:3`, `:8-11`, `:15`, `:26-28`, `:34`, `:35`, `:40`, `:43`; nuevo tras `:51` |
| `packages/shared/src/flujos.ts` | 175 (11) | en sitio `:126`, `:127`; nuevo tras `:163` |
| `apps/desk/server/comparacion/cruzarExportacion.ts` | 2 (2) | en sitio `:2`; nuevo tras `:41` |
| `apps/desk/server/db/ticketsPorId.ts` | 2 (2) | nuevo tras `:19` |
| `packages/shared/src/indicadoresExportacion.ts` | 2 (1) | en sitio `:16`, `:21` |
| `apps/desk/src/lib/indicadoresUrl.ts` | 11 (2) | en sitio la línea 3 (hoy vacía), `:5`, `:8`; nuevo tras `:18` |
| `apps/desk/src/lib/comparacionExportacion.ts` | 5 (3) | en sitio `:4`, `:13`, `:16`, `:56`, `:62`, `:76` |
| `apps/desk/src/api/client.ts` | 61 (0) | en sitio `:897`, `:899` |
| `apps/desk/src/components/Analisis.tsx` | 36 (3) | en sitio `:6`, `:75`, `:83`, `:91` |
| `apps/desk/src/components/ComparacionExportacion.tsx` | 1 (1) | en sitio `:9`, `:20` |
| Los ocho `*.test.ts` de D11 | p. ej. 62 a `flujos.test.ts:N` | sólo crecen al final |

Barrido del cierre (L2): (1) `git diff -U0 8a068fe9 -- <fichero>` sólo admite trozos `-N,k +N,k` (en sitio) o añadidos tras la última
línea de hoy; cualquier otro trozo obliga al barrido completo de ese fichero. (2) `git grep -noE "<fichero>:[0-9]+(-[0-9]+)?"`, y cada
resultado que caiga en una línea editada en sitio se lee contra lo que afirma su frase (p. ej. `DEPLOY.md:735`, que apunta a las líneas 27-28 de la ruta del POST). (3) Pase
de abreviadas en los ficheros que citan estos módulos. (4) El detector de `pre-push`, como ayuda.

## D13 · Lotes e intentos

L1 (servidor y `shared`) mide ~455 brutas, ~820 con ×1,8: **no cabe bajo la válvula de 720 y se parte desde el diseño**. Cada intento
se mide con `git diff --shortstat --no-renames` contra su commit de partida más `wc -l` de lo nuevo sin trackear, y asienta sólo con
`npm test`, `npm run typecheck`, `npm run lint` (techo de 165 avisos sin holgura, `.github/workflows/ci.yml:41`: ningún aviso nuevo) y
`npm run build` en 0. Parada antes de fusionar.

| Intento | Contenido | Bruto | ×1,8 |
|---|---|---|---|
| L1a | M2 (las tres caracterizaciones, primero); D1, D2, D3 (GET), D4, D5 y sus pruebas (M1, M3, M5, M6, M8, M10, M12 del GET); `apply-progress.md` | ~240 | ~430 |
| L1b | D3 (POST), D6, D7, D8 y sus pruebas (M3, M4, M6, M8, M10 del POST); `apply-progress.md` | ~215 | ~390 |
| L2 | D9 y sus pruebas (M7, M9, M11); mutaciones restantes; barrido de D12; `npm run reconcile` (`package.json:20`) regenera `docs/sdd/RECONCILIACION.md` (se mide); `apply-progress.md` | ~200 | ~360 |

## Supuestos nuevos o corregidos (reversibles; lista semanal bajo F1F-05) y riesgos

| ID | Supuesto | Reversión |
|---|---|---|
| S-1 | Confirmado (D1), con nombre y firma `flujoPorClasificacion(clasificacion)` | Cambiar su cuerpo |
| S-9 | En `deOtroFlujo`, `numero` es el del fichero, como en «sólo en el fichero» y «fuera del periodo» | Tomar el de Desk |
| S-10 | El CSV con flujo se llama `indicadores-<flujo>-<día>.csv` | Otro patrón en `routes/indicadores.ts:48` |
| S-11 | `flujo` va tras `periodo` en los dos JSON; `deOtroFlujo`, tras `fueraDelPeriodo` y siempre presente con flujo | Mover la clave |
| S-12 | Rótulos: «Todos», «Servicio técnico», «Equipo nuevo», «Soporte remoto»; la vista añade « · Flujo: equipo nuevo» | Otro texto |

- Dos nociones de «flujo» en el código (población por clasificación; enrutado y alarmas por clasificación y estado), molde H5:
  deliberado, escrito en RQ-KP-30 y enfrentado por la tabla de M6.
- El selector convive con los KPI de `fetchAnalisis`, que no filtra: su `title` dice «Flujo de la descarga y de la comparación»
  (hipótesis: basta; lo ve P-3 en la app). Líneas en sitio más largas (`routes/indicadores.ts:43`, `Analisis.tsx:83`): legibilidad
  a cambio de no desplazar citas; precedentes `flujos.ts:57` y `estados.ts:99`. Ninguna pregunta bloquea el diseño.
