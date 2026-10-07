# Diseño — Los indicadores 51 y 55 dejan de salir «sin dato» (`indicadores-51-55`, F1F-05, `cierra: no`)

Propuesta: `openspec/changes/indicadores-51-55/proposal.md` (S-A a S-H tomados; no se reabren). Delta de spec:
`openspec/changes/indicadores-51-55/specs/kpis/spec.md` (leída para alinear; no editada).
Toda cita de este documento es a un fichero que existe y fue leído en este worktree, sobre `42a4828`. Los ficheros
nuevos se nombran sin línea, y una línea **prevista** se nombra en prosa («la línea 86 de ese fichero»), nunca con
forma de cita. Lo no comprobado está en el apartado 15 con la palabra «hipótesis».
Este diseño supera a propósito el tope de 800 palabras de la skill: el encargo pide diez decisiones con firma exacta.

## 1. Enfoque técnico

El 51 es dominio puro: una constante y una función al final de `packages/shared/src/indicadores.ts`, enchufadas donde
el 49 enchufa su marca (`packages/shared/src/indicadores.ts:133`). El 55 son cuatro piezas que no se conocen entre sí
más que por un tipo: **formato** (analizador), **identidad** (huella), **almacén** (tabla y capa de datos) y **puerta**
(ruta). La lectura suma una cuarta consulta y pasa la calificación al cálculo, que no cambia de forma. Ningún fichero
muy citado gana líneas por dentro: lo nuevo va al final o en fichero nuevo, y lo que se modifica se edita **sobre la
línea que ya existe**.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativas descartadas | Por qué |
|---|---|---|---|
| DD-1 | El hito de entrega es una entrada más de `hitos` del 51, con clave `transición de entrega`, y **no** entra en `HITOS_POR_COLUMNA` | Añadirlo a la tabla de `packages/shared/src/indicadores.ts:52-62` | Molde del 49: su marca tampoco está en la tabla y se añade en `packages/shared/src/indicadores.ts:133`. La tabla es de etiquetas de campo y la recorre `resolverHito`, que buscaría una columna heredada que la spec prohíbe |
| DD-2 | La clave del hito y el texto del motivo son **la misma constante** (`MARCA_ENTREGA`) | Dos literales | El motivo es «falta el hito: transición de entrega» (S-B); una sola cadena no puede desincronizarse |
| DD-3 | El recuento de reentrante sale de `escrituras` del hito, sin código nuevo | Rama propia para el 51 | `packages/shared/src/indicadores.ts:134` ya mira `escrituras >= 2` de todos los hitos; las dos transiciones se cuentan juntas porque el hito es uno |
| DD-4 | El guardián enfrenta la constante a `transicionesQueEscriben('Fecha Remisión de Salida')` por **igualdad de conjuntos**, además de exigir que cada id exista | Sólo «cada id existe» | La igualdad caza también la entrega nueva que nadie añadió a la constante. `packages/shared/src/bodegaje.ts:234-236` ya da esa lista desde el catálogo; hoy son las dos de `packages/shared/src/transitions.ts:248-251` |
| DD-5 | `calificacion` es `text`, no numérica | `smallint` con rango | El 55 es textual en el módulo (`packages/shared/src/indicadores.ts:76`) y «se usa tal cual»; la escala del formulario es desconocida (S-E) |
| DD-6 | La huella vive en un módulo propio (`encuesta/respuesta.ts`), no en el analizador ni en la capa de datos | Dentro del analizador | Es la identidad del almacén: sustituir el analizador cuando llegue la muestra (P-1) no debe cambiar qué cuenta como duplicado |
| DD-7 | `insertadas` se cuenta en memoria tras una lectura previa de huellas; `ON CONFLICT (huella) DO NOTHING` queda de red | `INSERT … ON CONFLICT … RETURNING` | `apps/desk/server/services/alarmasSla.ts:17` documenta que pg-mem y Postgres difieren en esa forma |
| DD-8 | Listas con `IN ($1,$2,…)`, en bloques de 5.000 | `= ANY($1)`; un `400` por tope de filas | pg-mem no ejecuta `= ANY` con arrays ligados (`apps/desk/server/db/eliminarTicket.ts:65`, `apps/desk/server/db/ticketFuentes.ts:121`); el molde es `apps/desk/server/db/sla.ts:45`. Un tope de filas sería un `400` que la spec no tiene |
| DD-9 | La hora de pared de Bogotá se convierte con `instanteDeJornada`, **exportándola** en sitio | Reescribir la medición del desplazamiento en el analizador | `packages/shared/src/calendarioLaboral.ts:147-149` declara que fijar el desplazamiento a mano sería una segunda definición de la zona; dos implementaciones de la misma noción es el molde H5 |
| DD-10 | Ruta `POST /api/indicadores/encuesta`, en fichero propio | Añadirla a `apps/desk/server/routes/indicadores.ts` | La spec separa lectura (RQ-KP-14) y único escritor (RQ-KP-21); en fichero propio la prueba de «sólo SELECT» del `GET` no comparte módulo con un `INSERT` |
| DD-11 | La última respuesta se elige **en memoria**, con `ORDER BY e.respondida_at, e.id` y «gana la última fila» | `DISTINCT ON`; subconsulta con `MAX` | Molde de la consulta del historial (`apps/desk/server/indicadores.ts:76`); `DISTINCT ON` en pg-mem no está visto en el repositorio |
| DD-12 | Éxito `200`, no `201` | `201` | La carga es idempotente y puede no crear nada |
| DD-13 | La variante de Zoho del 55 pasa a ser la letra quitando el cuarto argumento de `armar` | Calcularla aparte | `packages/shared/src/indicadores.ts:223` ya cae en `calculo.valor` cuando no hay variante propia |

## 3. D1 — El 51 en `packages/shared/src/indicadores.ts` (251 líneas; sigue numerando igual hasta la 251)

Ediciones **en sitio** (misma cantidad de líneas) y un bloque al final:

| Dónde | Queda |
|---|---|
| `packages/shared/src/indicadores.ts:2-3` | la cabecera deja de decir «51 y 55 sin dato»: «51 desde la transición de entrega; 55 desde la calificación que aporta la lectura» |
| `packages/shared/src/indicadores.ts:45-48` | cuatro líneas por cuatro: desaparecen el comentario H-1 y `horaActualizacionEstado`; queda un comentario de tres líneas (`/**`, texto, `*/`) sobre `calificacionSatisfaccion?: string \| null`: «la última calificación cargada del ticket (RQ-KP-22); la aporta la lectura y se usa tal cual» |
| `packages/shared/src/indicadores.ts:86` | `const MARCA_INGRESO = 'marca de ingreso a servicio', MARCA_ENTREGA = 'transición de entrega'` |
| `packages/shared/src/indicadores.ts:133` | la línea gana `; if (columna === '51') hitos[MARCA_ENTREGA] = hitoEntrega(historial)` |
| `packages/shared/src/indicadores.ts:228-232` | cinco líneas por cinco: el cierre `v51` de abajo |
| `packages/shared/src/indicadores.ts:241` | `armar('51', 'dias_naturales', v51, sinDato(MOTIVO_H1)),` |
| `packages/shared/src/indicadores.ts:246` | sin el cuarto argumento: `armar('55', 'calificacion', () => ({ valor: v55, marcas: [] })),` (DD-13) |

`MOTIVO_H1` (`packages/shared/src/indicadores.ts:88`) **se conserva** con su texto: sigue siendo el motivo de la
variante de Zoho del 47 (`packages/shared/src/indicadores.ts:238`) y del 51 (RQ-KP-11). `v55`
(`packages/shared/src/indicadores.ts:233`) no cambia.

```ts
// líneas 228-232, en sitio
  const v51 = (h: Record<string, Hito>): Calculo => {
    const entrega = h[MARCA_ENTREGA].dia, fin = h['Fecha Finalización ST'].dia
    if (entrega === null) return { valor: sinDato(`falta el hito: ${MARCA_ENTREGA}`), marcas: [] }
    if (fin === null) return { valor: sinDato(`falta el hito: ${NOMBRE_HITO['Fecha Finalización ST']}`), marcas: [] }
    const n = diasNaturalesEntre(fin, entrega); return { valor: valorDe(n), marcas: n < 0 ? ['orden_invertido'] : [] } }

// al final del fichero, tras la línea 251
/** Las transiciones que entregan el equipo al cliente (RQ-KP-09). El guardián las enfrenta al catálogo. */
export const TRANSICIONES_DE_ENTREGA: readonly string[] = ['entrega_al_cliente', 'entrega_sin_factura']

/** El día de Bogotá de la ÚLTIMA fila de entrega por `performedAt` (S-A) y cuántas filas de entrega hay. */
function hitoEntrega(historial: PasoDelHistorial[]): Hito {
  const entregas = historial.filter((p) => TRANSICIONES_DE_ENTREGA.includes(p.transitionId))
    .sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
  const dia = diaEnZona(entregas[entregas.length - 1]?.performedAt ?? null)
  return dia === null ? { dia: null, fuente: 'ausente', escrituras: 0 } : { dia, fuente: 'transicion', escrituras: entregas.length }
}
```

- **Orden de los motivos** (S-B): entrega ausente gana a finalización ausente; es el orden de las dos primeras líneas
  de `v51` y se muta permutándolas.
- **Signo:** `entrega − finalización`, sin tope; negativo lleva la marca `orden_invertido`, como `naturales`
  (`packages/shared/src/indicadores.ts:139-144`). La marca no se serializa.
- **Hito en `hitos`:** `{ 'Fecha Finalización ST': …, 'transición de entrega': … }`, en ese orden. La ruta lo
  serializa sin cambios (`apps/desk/server/routes/indicadores.ts:41` no se toca).
- En `apps/desk/server/indicadores.ts:90`, en sitio y en el **mismo lote**: el comentario deja de nombrar
  `horaActualizacionEstado`, para que el criterio «no existe en el código» se cumpla al cerrar el lote 1.

**Pruebas existentes que cambian** (`packages/shared/src/indicadores.test.ts`; ninguna cita viva apunta a sus líneas):

| Dónde | Hoy | Queda |
|---|---|---|
| `packages/shared/src/indicadores.test.ts:76` | pasa `{ horaActualizacionEstado: … }` | sin tercer argumento; la aserción de `packages/shared/src/indicadores.test.ts:77` no cambia |
| `packages/shared/src/indicadores.test.ts:100-126` | «sin dato salvo entrada opcional» | bloque reescrito: K13 pasa a «con finalización y sin fila de entrega → falta el hito: transición de entrega»; el `it.each` de `packages/shared/src/indicadores.test.ts:106-111` conserva sus dos instantes (el segundo es el borde de las 22:00 de Bogotá) pero como **filas de entrega**; `packages/shared/src/indicadores.test.ts:112-114` pasa a «con entrega y sin finalización». Las del 55 (`packages/shared/src/indicadores.test.ts:115-125`) se conservan |
| `packages/shared/src/indicadores.test.ts:306-315` | dos casos, uno «con horaActualizacionEstado» (`packages/shared/src/indicadores.test.ts:310`) | un solo caso; el título deja de nombrar la entrada opcional |

**Guardián de la constante** (regla de mutación 2), junto a K14 (`packages/shared/src/indicadores.test.ts:146-151`):
(a) cada id de `TRANSICIONES_DE_ENTREGA` resuelve con `transicionPorId` (`packages/shared/src/flujos.ts:74`);
(b) `[...TRANSICIONES_DE_ENTREGA].sort()` es igual a `transicionesQueEscriben('Fecha Remisión de Salida').sort()`.
**Qué se ensucia para verlo rojo:** el fichero vigilado es el catálogo, `packages/shared/src/transitions.ts` —se
renombra temporalmente `entrega_al_cliente`, o se le pone ese campo de fecha a otra transición— y, por el otro lado, la
constante (quitar un id; poner uno inventado). `transitions.ts` no se edita en la tanda: la mutación se deshace.

## 4. D2 — Almacén

**Al final de `packages/zoho-sync/src/db/schema.sql`**, tras `packages/zoho-sync/src/db/schema.sql:782`. Comentarios
sin punto y coma (el troceo es por `;`, `packages/zoho-sync/src/db/migrate.ts:19`), sin tildes, sin comentarios
dentro del `CREATE`, y sin las palabras que otros guardianes cuentan sobre el texto crudo (`compuesto`, `modalidad`,
`ov_elegida_en_app_at`, `prioridad_en_app_at`, `reasignaciones`, `contrato_ampliaciones`):

```sql
-- indicadores-51-55 (F1F-05, decision e171-e172-e173): respuestas de la encuesta de satisfaccion cargadas desde fichero
-- Varias por ticket. Vale la ultima por respondida_at y, a igualdad, por id. huella UNICA: cargar dos veces no duplica
-- Sin FK a tickets (vive en desk), sin columna de canal (S-G) y sin DELETE ni UPDATE. Nace vacia, sin relleno
-- AL FINAL del fichero para no desplazar citas (regla de mutacion 4). CALIFICADA public.
CREATE TABLE IF NOT EXISTS public.encuesta_respuestas (
  id bigserial PRIMARY KEY,
  ticket_id text NOT NULL,
  calificacion text NOT NULL CONSTRAINT encuesta_respuestas_calificacion CHECK (calificacion <> ''),
  respondida_at timestamptz NOT NULL,
  huella text NOT NULL UNIQUE,
  cargado_por text NOT NULL,
  cargado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_encuesta_respuestas_ticket ON public.encuesta_respuestas (ticket_id);
```

**Compatibilidad con pg-mem, pieza a pieza:** `bigserial`, `timestamptz … DEFAULT now()` y el índice calificado son los
de `packages/zoho-sync/src/db/schema.sql:773-782`; el `CHECK` con nombre es el de
`packages/zoho-sync/src/db/schema.sql:761`; `UNIQUE` en línea de columna es el de
`packages/zoho-sync/src/db/schema.sql:22`; y que pg-mem lanza `23505` ante un duplicado lo usa ya
`packages/zoho-sync/src/db/migrate.test.ts:777`.

**`packages/zoho-sync/src/db/migrate.ts:73`**, en sitio: la lista gana `, 'encuesta_respuestas'` detrás de
`'contrato_ampliaciones'`. El fichero no gana líneas.

**Lo que cambia en `packages/zoho-sync/src/db/migrate.test.ts`**, todo en sitio salvo el bloque final:

| Dónde | Hoy | Queda |
|---|---|---|
| `packages/zoho-sync/src/db/migrate.test.ts:282` | «son 44 tablas: 10 de Desk, 31 de la app en public (contrato_ampliaciones, F1B-11; …» | «son 45 tablas: 10 de Desk, 32 de la app en public (encuesta_respuestas, F1F-05; contrato_ampliaciones, F1B-11; …» |
| `packages/zoho-sync/src/db/migrate.test.ts:283` | `toEqual([10, 31, 3])` | `toEqual([10, 32, 3])` |
| `packages/zoho-sync/src/db/migrate.test.ts:284-286` | tres `toBe(44)` | tres `toBe(45)` |
| `packages/zoho-sync/src/db/migrate.test.ts:652` | suma `… + 1 + 2` | `… + 1 + 2 + 2`, y el mensaje gana «y las dos de public.encuesta_respuestas (F1F-05, indicadores-51-55)» |
| `packages/zoho-sync/src/db/migrate.test.ts:794` | título: quinta, cuarta y tercera por el final | séptima, sexta y quinta; las cuatro últimas son las de `contrato_ampliaciones` y `encuesta_respuestas` |
| `packages/zoho-sync/src/db/migrate.test.ts:796` | `l[l.length - 5]` | `l[l.length - 7]` |
| `packages/zoho-sync/src/db/migrate.test.ts:798` | `l[l.length - 4]` y `l[l.length - 3]` | `l[l.length - 6]` y `l[l.length - 5]` |
| `packages/zoho-sync/src/db/migrate.test.ts:822` y `packages/zoho-sync/src/db/migrate.test.ts:825` | «cierran el esquema» / «cierra el esquema» | dejan de afirmarlo |
| `packages/zoho-sync/src/db/migrate.test.ts:837` | título: penúltima y última | cuarta y tercera por el final |
| `packages/zoho-sync/src/db/migrate.test.ts:839` y `packages/zoho-sync/src/db/migrate.test.ts:840` | `l.length - 2` y `l.length - 1` | `l.length - 4` y `l.length - 3` |

No se rompen `packages/zoho-sync/src/db/migrate.test.ts:799` ni `packages/zoho-sync/src/db/migrate.test.ts:841`
(cuentan sentencias que nombran otra tabla). El guardián de clasificación
(`packages/zoho-sync/src/db/migrate.test.ts:266-275`) se pone rojo sin la edición de `PUBLIC_TABLES`: es el rojo
esperado del lote.

**Bloque nuevo al final** (tras `packages/zoho-sync/src/db/migrate.test.ts:858`), molde
`packages/zoho-sync/src/db/migrate.test.ts:825-858`: la tabla existe en `public` y vacía; el `CREATE` calificado es la
penúltima sentencia y el índice la última; dos sentencias la nombran; el texto del `CREATE` trae las siete columnas y
no trae `canal`; la base rechaza `ticket_id`, `calificacion`, `respondida_at`, `huella` y `cargado_por` nulos y una
`calificacion` vacía; un segundo `INSERT` con la misma `huella` falla con `23505`; dos filas del mismo ticket con
huellas distintas entran; `PUBLIC_TABLES` la contiene.

## 5. D3 — Identidad y analizador (formato SUPUESTO, S-D y S-E)

### `apps/desk/server/encuesta/respuesta.ts` (nuevo) — tipos e identidad; sobrevive al cambio de analizador

```ts
import { createHash } from 'node:crypto'

export interface FilaEncuesta { fila: number; numeroTicket: number; calificacion: string; respondidaAt: string; huella: string }
export interface FilaRechazada { fila: number; motivo: string }

/** sha256 en hexadecimal de: 'v1', número en decimal, instante en ISO UTC con milisegundos y calificación (NFC, espacios colapsados, recortada), unidos por salto de línea. */
export function huellaRespuesta(r: { numeroTicket: number; calificacion: string; respondidaAt: string }): string
```

Entran **sólo** el ticket, la calificación y el instante (RQ-KP-19). No entran `cargado_por`, `cargado_at`, la posición
de la fila ni el nombre del fichero: cargar el mismo contenido otro día, por otra persona o reordenado da la misma
huella. No se pliegan mayúsculas. El separador no puede aparecer dentro de un campo tras colapsar espacios.

### `apps/desk/server/encuesta/analizarRespuestas.ts` (nuevo) — la única pieza que conoce el formato

Importa **sólo** `./respuesta` y, de `@ambientalia/shared`, `instanteDeJornada`. Nada del servidor, de la base, de red
ni de ficheros.

```ts
export const MOTIVOS_FILA = {
  sinTicket: 'falta el número de ticket',
  ticketNoNumerico: 'el número de ticket no es un número reconocible',
  sinMarca: 'falta la marca de tiempo',
  marcaIlegible: 'la marca de tiempo no es una fecha legible',
  sinCalificacion: 'falta la calificación',
} as const
export const ERRORES_CABECERA = {
  vacio: 'El fichero está vacío',
  faltan: (columnas: readonly string[]) => `El fichero no trae las columnas necesarias: ${columnas.join(', ')}`,
  ambigua: (columna: string) => `Más de una columna del fichero puede ser «${columna}»`,
}
export type AnalisisEncuesta =
  | { ok: true; leidas: number; filas: FilaEncuesta[]; rechazadas: FilaRechazada[] }
  | { ok: false; error: string }

/** Bytes → texto: UTF-8 y, si no es UTF-8 válido, windows-1252. */
export function decodificarFichero(bytes: Uint8Array): string
/** Pura: mismo contenido, mismo resultado. */
export function analizarRespuestasEncuesta(contenido: string): AnalisisEncuesta
```

| Aspecto | Regla |
|---|---|
| BOM | un `U+FEFF` inicial se descarta antes de todo |
| Registros | RFC 4180: campo entre comillas dobles, `""` es una comilla, separador y saltos de línea dentro de comillas son contenido; fin de registro `\r\n`, `\n` o `\r`. Una comilla sin cerrar al final **no** es error de fichero: cierra el campo y el registro sigue su curso de fila |
| Separador | se cuentan `,` y `;` **fuera de comillas** en el primer registro; gana el más frecuente y, a igualdad, `,` |
| Filas | la cabecera es la fila 1; `fila` es el ordinal del registro. Un registro con todos sus campos vacíos no cuenta ni en `leidas` ni en `rechazadas`. `leidas = filas.length + rechazadas.length` |
| Cabeceras | normalización: NFD sin diacríticos, minúsculas, todo lo que no sea `[a-z0-9]` a un espacio, recorte. Por **nombre**, no por posición |
| Sinónimos exactos | ticket: `ticket`, `numero de ticket`, `numero del ticket`, `no ticket`, `n ticket`, `nro ticket`, `numero de servicio` · marca: `marca temporal`, `timestamp`, `fecha`, `fecha y hora`, `fecha de respuesta` · calificación: `calificacion`, `calificacion de satisfaccion`, `satisfaccion` |
| Por palabra | si ningún sinónimo exacto casa (Google Forms pone la pregunta entera como cabecera): ticket si contiene `ticket`; calificación si contiene `calificacion` o `satisf`. Tiene que casar **exactamente una** columna; con dos, `ambigua` |
| Error de cabecera | contenido vacío o sólo blancos: `vacio`. Falta alguna de las tres: `faltan`, nombrando todas las que faltan. `{ ok: false }` y ninguna fila |
| Ticket | recortado; vacío → `sinTicket`; se admite `#` delante; si no es `^\d+$` o supera 2147483647 (la columna es `integer`, `packages/zoho-sync/src/db/schema.sql:22`) → `ticketNoNumerico` |
| Marca de tiempo | (a) `AAAA-MM-DD` o `AAAA/MM/DD`, con hora `H:MM[:SS]` opcional separada por espacio o `T`; (b) `DD/MM/AAAA` con la misma hora, **día primero**; (c) sufijo opcional `a. m.`/`p. m.`/`AM`/`PM`; (d) sufijo opcional de zona `Z`, `±HH:MM`, `GMT±H[:MM]` o `UTC±H`. Sin zona, es hora de pared de `America/Bogota` y se convierte con `instanteDeJornada(dia, hora, minuto)` más los segundos; con zona, se usa la escrita. Sin hora: las 00:00 de Bogotá. Vacía → `sinMarca`; fecha que no existe (31/02), hora fuera de rango u otra forma → `marcaIlegible`. Sale en ISO UTC |
| Calificación | recortada y con espacios internos colapsados; vacía → `sinCalificacion`; si no, se guarda tal cual (texto o número) |
| Orden del motivo | un motivo por fila, el primero que falle en este orden: ticket, marca de tiempo, calificación |
| Fila corta | los campos que faltan valen vacío y dan su motivo |

`packages/shared/src/calendarioLaboral.ts:155`, en sitio: `function instanteDeJornada` pasa a `export function
instanteDeJornada` (DD-9). El índice ya reexporta el módulo (`packages/shared/src/index.ts:20`).

## 6. D4 — Capa de datos: `apps/desk/server/db/encuestaRespuestas.ts` (nuevo)

No importa el analizador: sólo los tipos de `../encuesta/respuesta`.

```ts
export const MOTIVO_TICKET_INEXISTENTE = 'no existe un ticket con ese número'
export interface ResultadoCarga { insertadas: number; duplicadas: number; rechazadas: FilaRechazada[] }

/** Carga las filas ya analizadas en UNA transacción. `trozo` es el tamaño de bloque de las listas `IN` (parámetro sólo para probarlo). */
export async function cargarRespuestas(db: Queryable, filas: readonly FilaEncuesta[], cargadoPor: string, trozo = 5000): Promise<ResultadoCarga>
```

Dentro de `enTransaccion` (`apps/desk/server/db/transaccion.ts:13-28`), y con `filas` vacío sin tocar la base:

1. `SELECT id, number FROM tickets WHERE number IN ($1,…)` con los números **distintos** del lote: una consulta para
   todo el lote (una por bloque de 5.000 distintos, que en la práctica es una). Sin consulta por fila.
2. Las filas cuyo número no aparece van a `rechazadas` con `MOTIVO_TICKET_INEXISTENTE` y su `fila`.
3. Entre las restantes, una huella repetida **dentro del fichero** cuenta como duplicada a partir de la segunda.
4. `SELECT huella FROM public.encuesta_respuestas WHERE huella IN ($1,…)`: las que ya están cuentan como duplicadas.
5. Un `INSERT INTO public.encuesta_respuestas (ticket_id, calificacion, respondida_at, huella, cargado_por) VALUES
   (…),(…) ON CONFLICT (huella) DO NOTHING` de varias filas con las nuevas (por bloques de `trozo`). Si no hay nuevas,
   no se emite.
6. `insertadas` es el número de filas nuevas contadas en memoria (DD-7).

El texto de la escritura **empieza** por `INSERT INTO public.encuesta_respuestas`: los espías de las pruebas la
reconocen por ese prefijo. `cargado_por` es `user.name` de la sesión (`packages/shared/src/types.ts:211`), que pasa la
ruta; `cargado_at` lo pone la base. **Límite declarado:** dos cargas simultáneas del mismo fichero dejan la tabla
bien (la unicidad es de la base) pero las dos respuestas pueden decir «insertadas».

## 7. D5 — Ruta de carga: `apps/desk/server/routes/encuestaRespuestas.ts` (nuevo)

```ts
export const MENSAJE_SIN_FICHERO = 'Falta el fichero de respuestas'
export function registerEncuestaRespuestasRoutes(app: Express, deps: { db: Queryable }): void
//  const subida = crearSubida()
//  app.post('/api/indicadores/encuesta', requireAuth(db), requireAdmin, subida.single('file'), asyncHandler(async (req, res) => { … }))
```

**Orden EXACTO de los middlewares:** `requireAuth(db)` → `requireAdmin` → `subida.single('file')` → manejador. El
precedente `apps/desk/server/routes/certificadoFabrica.ts:28` pone multer delante de su `403` y **no** es el molde:
ahí un usuario sin permiso llega a subir el fichero. El molde del orden es
`apps/desk/server/routes/indicadores.ts:41`.

| Paso | Dónde | Condición | Respuesta |
|---|---|---|---|
| 1 | `requireAuth` (`apps/desk/server/auth/middleware.ts:14-23`) | sin cookie o sesión inválida | `401` |
| 2 | `requireAdmin` (`apps/desk/server/auth/middleware.ts:26-29`) | sin `isAdmin` | `403` |
| 3 | multer, vía el manejador central (`apps/desk/server/app.ts:84-89`) | fichero mayor que el límite de `apps/desk/server/util/subida.ts:10-11`; campo de fichero con otro nombre | `413`; `400` |
| 4 | manejador | `!req.file` | `400` `{ error: MENSAJE_SIN_FICHERO }` |
| 5 | manejador | `analizarRespuestasEncuesta(decodificarFichero(req.file.buffer))` no `ok` (vacío o cabecera) | `400` `{ error }` |
| 6 | manejador | `cargarRespuestas(db, a.filas, req.user!.name)` | `200` `{ leidas, insertadas, duplicadas, rechazadas }` |

`rechazadas` es la unión de las del analizador y las de la capa de datos, ordenada por `fila`; `leidas` es la del
analizador y se cumple `leidas = insertadas + duplicadas + rechazadas.length`. Una fila mala nunca es `400`. Del
cuerpo sólo se lee el fichero: `cargado_por` no puede venir del cliente.

**Registro en `apps/desk/server/app.ts`, sin insertar líneas:** `apps/desk/server/app.ts:22` gana al final
`; import { registerEncuestaRespuestasRoutes } from './routes/encuestaRespuestas'`, y `apps/desk/server/app.ts:61`
gana al final `; registerEncuestaRespuestasRoutes(app, { db })`. Sin interruptor (S-F): `.env.example` no cambia.

## 8. D6 — Lectura del 55: `apps/desk/server/indicadores.ts` (93 líneas)

| Dónde | Queda |
|---|---|
| `apps/desk/server/indicadores.ts:5` y `apps/desk/server/indicadores.ts:51-55` | en sitio: «tres» pasa a «cuatro» y se nombra la cuarta |
| `apps/desk/server/indicadores.ts:43` | en sitio: `cierres: Set<DiaCivil>; calificaciones: Map<string, string>` |
| tras `apps/desk/server/indicadores.ts:84` | **inserción** de la cuarta consulta (tres líneas) |
| `apps/desk/server/indicadores.ts:85` | el `return` gana `calificaciones` |
| `apps/desk/server/indicadores.ts:92` | las opciones ganan `calificacionSatisfaccion: e.calificaciones.get(t.id) ?? null` |

```ts
  const re = await db.query(`SELECT e.ticket_id, e.calificacion FROM public.encuesta_respuestas e JOIN tickets t ON t.id = e.ticket_id${donde} ORDER BY e.respondida_at, e.id`, params)
  const calificaciones = new Map<string, string>()
  for (const r of re.rows) { const id = String(r.ticket_id); if (vistos.has(id)) calificaciones.set(id, String(r.calificacion)) }
```

Acotada a los tickets del periodo por el mismo `JOIN` y el mismo `donde` que la del historial
(`apps/desk/server/indicadores.ts:76`), con los mismos parámetros ligados; el corte exacto lo da `vistos`
(`apps/desk/server/indicadores.ts:77`). Con el orden ascendente, la última fila de cada ticket es la de mayor
`respondida_at` y, a igualdad, mayor `id`: «gana la última». La inserción cae **después** de la línea 76, que es la
única de este fichero con cita viva (`apps/desk/server/migracionMarcadorLectores.test.ts:54`).

**Pruebas que pasan de tres a cuatro:**

| Dónde | Hoy | Queda |
|---|---|---|
| `apps/desk/server/indicadores.test.ts:6` | «tres consultas» | «cuatro» |
| `apps/desk/server/indicadores.test.ts:53` | título «EXACTAMENTE tres consultas» | «EXACTAMENTE cuatro» |
| `apps/desk/server/indicadores.test.ts:58` | `toHaveLength(3)` | `toHaveLength(4)`; `apps/desk/server/indicadores.test.ts:59` (todas `SELECT`) no cambia |
| `apps/desk/server/indicadores.test.ts:78` | el doble devuelve las filas de tickets a toda consulta que no reconoce | devuelve `[]` también a la que nombra `encuesta_respuestas` |
| `apps/desk/server/routes/indicadores.test.ts:13` | `DATOS` no reconoce la consulta nueva (dice `JOIN tickets`, no `FROM tickets`) | la expresión gana `encuesta_respuestas` |
| `apps/desk/server/routes/indicadores.test.ts:183` | `toBeGreaterThan(3)` | `toBeGreaterThan(4)` |
| `apps/desk/server/routes/indicadores.test.ts:186` y `apps/desk/server/routes/indicadores.test.ts:190` | «las mismas tres lecturas», `toHaveLength(3)` | «cuatro», `toHaveLength(4)` |

## 9. D7 — Regla 13: decisiones del cliente

**Ninguna.** No se toca `apps/desk/src`: no hay pantalla, botón, enlace ni validación nuevos, y la spec lo prohíbe
(RQ-KP-18, «MUST NOT añadir pantalla de carga»). No hay espejo que justificar ni comodidad que probar. Lo que decide
la tanda lo decide el servidor, y estas son sus líneas **previstas** (se cierran con la línea real en `tasks.md`):

| Decisión | Dónde la impone el servidor |
|---|---|
| Quién puede cargar | pasos 1 y 2 de la ruta nueva (`requireAuth`, `requireAdmin`) |
| Qué fichero se rechaza entero | pasos 4 y 5 de la ruta nueva |
| Qué fila se rechaza | `analizarRespuestasEncuesta` y el paso 2 de `cargarRespuestas` |
| Qué cuenta como duplicado | `huellaRespuesta` y la restricción `UNIQUE` de `huella` |
| Cuál respuesta vale | la cuarta consulta de `leerEntradasIndicadores` |
| Qué entrega cuenta para el 51 | `TRANSICIONES_DE_ENTREGA` y `hitoEntrega` |

## 10. D8 — Plan de pruebas por lote (strict TDD: rojo antes que verde; vitest en node, pg-mem con `migrate`)

| Lote | Fichero de prueba | Rojo primero |
|---|---|---|
| L1 | `packages/shared/src/indicadores.test.ts` (en sitio y bloque nuevo al final) | los escenarios del 51 de RQ-KP-09, -10 y -11: una entrega (3), `entrega_sin_factura` (2), dos entregas (7 y `reentrante: true`), entrega anterior (−2), sin entrega aun con `Fecha Remisión de Salida`, con entrega y sin finalización, sin ninguna de las dos (manda la entrega), filas desordenadas, hito con fuente y `escrituras`, `reentrante` `false` y `null`, `formulaZoho` del 51 «sin dato» y la del 55 igual a la letra; el guardián de la constante; una prueba que busca `horaActualizacionEstado` en el texto de los dos módulos |
| L1 | `apps/desk/server/indicadores.test.ts` (al final) | integración: una fila `entrega_al_cliente` en `ticket_transitions` da el 51 calculado por `tablaIndicadores` |
| L2a | `packages/zoho-sync/src/db/migrate.test.ts` | apartado 4 |
| L2a | `apps/desk/server/encuesta/respuesta.test.ts` (nuevo) | determinismo; cambia con cada uno de los tres campos; no cambia con espacios sobrantes ni con el mismo instante escrito con otro desplazamiento |
| L2a | `apps/desk/server/db/encuestaRespuestas.test.ts` (nuevo) | carga y cuenta; recarga (`insertadas: 0`); duplicado dentro del fichero; ticket inexistente con su `fila`; dos del mismo ticket; `cargado_por`; con 20 filas, exactamente una lectura de tickets, una de huellas y un `INSERT`; con `trozo = 2`, los bloques; lote vacío sin sentencias; estructura `BEGIN`…`COMMIT` con el doble de `connect` |
| L2b | `apps/desk/server/encuesta/analizarRespuestas.test.ts` (nuevo) | los diez escenarios de RQ-KP-20 más: comillas con separador, comilla doblada y salto de línea dentro; `\r\n`; empate de separadores; cabecera por palabra y ambigua; `DD/MM/AAAA`, `p. m.`, `GMT-5`, fecha sin hora, 31/02; `#123`; número fuera de rango; orden del motivo con dos fallos a la vez; fila corta; `decodificarFichero` con windows-1252; propiedad que enfrenta las dos nociones de zona: `diaEnZona(respondidaAt)` es el día escrito en el fichero; pureza por inspección de importaciones (molde `apps/desk/server/respaldo/sinDisco.test.ts:47`) |
| L3 | `apps/desk/server/routes/encuestaRespuestas.test.ts` (nuevo) | los doce escenarios de RQ-KP-21 y las pruebas de posición de abajo; «la carga no abre la puerta a otras escrituras» (RQ-KP-18) |
| L3 | `apps/desk/server/indicadores.test.ts`, `apps/desk/server/routes/indicadores.test.ts` | apartado 8 y los seis escenarios de RQ-KP-22 |

**Pruebas de posición de la ruta** (regla de mutación 1: dos guardas activas a la vez). Arnés:
`apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:46`,
`apps/desk/server/testing/appHarness.ts:86-95`; adjunto como en `apps/desk/server/routes/certificadoFabrica.test.ts:31`.
El espía es un `Queryable` **sin `connect`** pasado como `dbPropia`, para que también vea lo que corre dentro de
`enTransaccion` (`apps/desk/server/db/transaccion.ts:15`).

| Par | Caso | Esperado |
|---|---|---|
| 401 ↔ 403 | sin cookie, fichero válido | `401` |
| 401 ↔ 400 | sin cookie, fichero vacío | `401` |
| 401 ↔ multer | sin cookie, fichero en un campo llamado `intruso` | `401`, no `400` |
| 403 ↔ 400 | usuario sin administrador, fichero vacío o de cabecera irreconocible | `403` |
| 403 ↔ multer | usuario sin administrador, fichero en el campo `intruso` | `403`, no `400` |
| 403 ↔ 413 | usuario sin administrador, fichero mayor que el límite | `403`, no `413` |
| 400 ↔ carga | administrador sin fichero; con fichero vacío; con cabecera irreconocible | `400` |

En todos, ninguna sentencia vista por el espía nombra `encuesta_respuestas`. Los pares «↔ multer» y «↔ 413» son los
que hacen **observable** el orden de multer: con multer delante, la respuesta sería `400` o `413`. Sin ellos, mover
multer no rompe nada, porque el `403` saldría igual.

**Desempate por `id`:** la prueba inserta con `id` explícito y **en orden inverso** (primero el 9, luego el 7), con la
misma `respondida_at`; si las filas se insertan en orden de `id`, quitar `e.id` del `ORDER BY` no se nota.

## 11. D9 — Mutaciones que el verify reproducirá

| # | Regla | Mutación | La caza |
|---|---|---|---|
| M1 | 1 | Ruta: `subida.single` delante de `requireAdmin` | pares 403 ↔ multer y 403 ↔ 413 |
| M2 | 1 | Ruta: `subida.single` delante de `requireAuth` | par 401 ↔ multer |
| M3 | 1 | Ruta: `requireAdmin` delante de `requireAuth` | par 401 ↔ 403 (daría `403`) |
| M4 | 1 | Ruta: cargar antes de comprobar `!req.file` o el resultado del analizador | pares 400 ↔ carga: el espía ve la tabla |
| M5 | 1 | `v51`: permutar las dos comprobaciones de ausencia | «sin entrega ni finalización manda el primer motivo» |
| M6 | 1 | Analizador: comprobar la calificación antes que el ticket | orden del motivo con dos fallos |
| M7 | 2 | `schema.sql`: quitar `public.` del `CREATE` | guardián de clasificación y bloque nuevo |
| M8 | 2 | `schema.sql`: quitar `UNIQUE` de `huella` | `23505` del bloque nuevo |
| M9 | 2 | `schema.sql`: quitar un `NOT NULL`; quitar el `CHECK` | rechazos del bloque nuevo |
| M10 | 2 | `schema.sql`: mover el `CREATE` nuevo delante del de `contrato_ampliaciones` | posiciones del bloque nuevo y de `packages/zoho-sync/src/db/migrate.test.ts:839` |
| M11 | 2 | Quitar `'encuesta_respuestas'` de `PUBLIC_TABLES` | guardián de clasificación y recuento |
| M12 | 2 | Catálogo: renombrar `entrega_al_cliente`; dar `Fecha Remisión de Salida` a otra transición | guardián de la constante, parte (b) |
| M13 | 2 | Constante: quitar un id; añadir uno inventado | guardián, partes (b) y (a); con un id menos, también el escenario de `entrega_sin_factura` |
| M14 | — | Huella: quitar el ticket, la calificación o el instante de lo que entra | «cada campo de la huella cuenta» |
| M15 | — | Huella: meter `cargadoPor` o la fila | recarga con otro usuario da `insertadas: 0` |
| M16 | — | Lectura: `ORDER BY … DESC` (toma la primera) | «dos respuestas» y «se carga primero la más reciente» |
| M17 | — | Lectura: quitar `e.id` del `ORDER BY` | «desempate por id», con inserción en orden inverso |
| M18 | — | Lectura: quitar `if (vistos.has(id))` o el `JOIN` con el periodo | «respuestas de tickets fuera del periodo» |
| M19 | — | `hitoEntrega`: tomar la primera entrega | «dos entregas vale la última» (daría 2) |
| M20 | — | 51: caer en `Fecha Remisión de Salida` sin fila de entrega | «el 51 sin fila de entrega» |
| M21 | — | 51: invertir el signo | una entrega (daría −3) y entrega anterior (daría 2) |
| M22 | — | 51: día en UTC en vez de Bogotá | el instante `2027-01-09T03:00:00Z` (daría 4) |
| M23 | — | Capa de datos: quitar el filtro de huellas ya presentes | recarga: `insertadas` dejaría de ser 0 |
| M24 | — | Capa de datos: una consulta de ticket por fila | recuento de sentencias con 20 filas |
| M25 | — | Analizador: marca sin zona leída como UTC | «marca de tiempo en Bogotá» (daría las 08:00Z) |
| M26 | — | Ruta: `cargado_por` leído del cuerpo | «carga válida»: `cargado_por` es el de la sesión aunque el formulario traiga otro |
| M27 | 3 | **No aplica**: no hay decisiones de cliente (apartado 9) | — |

## 12. D10 — Lotes de `apply` (techo 800 por intento)

Pruebas: primera cuenta × 1,8. Código: primera cuenta, contando dos veces las líneas editadas en sitio. **El lote 2 de
la propuesta se parte en dos:** con el analizador que pide el encargo, junto sumaba ~810.

| Lote | Ficheros | Código | Pruebas × 1,8 | Total |
|---|---|---|---|---|
| L1 · El 51 | `packages/shared/src/indicadores.ts` (28 en sitio, 12 al final); `apps/desk/server/indicadores.ts` (comentario, 2); `packages/shared/src/indicadores.test.ts`; `apps/desk/server/indicadores.test.ts` | 42 | 120 → 216 | **~260** |
| L2a · Almacén, huella y datos | `schema.sql` (14); `migrate.ts` (2); `migrate.test.ts` (18 en sitio y bloque nuevo); `encuesta/respuesta.ts` (15); `db/encuestaRespuestas.ts` (75); sus dos pruebas | 124 | 155 → 279 | **~405** |
| L2b · Analizador | `calendarioLaboral.ts` (2); `encuesta/analizarRespuestas.ts` (150); su prueba | 152 | 140 → 252 | **~405** |
| L3 · Ruta y lectura | `routes/encuestaRespuestas.ts` (30); `app.ts` (4); `apps/desk/server/indicadores.ts` (14); pruebas nuevas y las ocho ediciones del apartado 8 | 72 | 215 → 387 | **~460** |
| L4 · Cierre documental | barrido de citas; `openspec/config.yaml` (citas de la decisión ancladas a `42a4828`, caso B); `docs/sdd/ENTRADA.md` (tres preguntas y P-1 a P-3); `DEPLOY.md`; `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; tabla de la regla 13 en `tasks.md` | — | — | aparte |

Dependencias: L2b depende de L2a sólo por los tipos de `respuesta.ts`; L3, de L1, L2a y L2b. Cada intento se cierra
midiendo `git diff --shortstat --no-renames` contra el commit de partida más las líneas de lo nuevo sin trackear.

### Dónde cae cada edición (regla de mutación 4)

| Fichero | Dónde | Citas vivas que se desplazan |
|---|---|---|
| `packages/shared/src/indicadores.ts` | en sitio y al final | ninguna: `apps/desk/server/migracionMarcadorLectores.test.ts:58` y `docs/sdd/ENTRADA.md:2078` citan la línea 134, que no se mueve ni cambia |
| `apps/desk/server/indicadores.ts` | en sitio; inserción tras la línea 84 | ninguna: la única cita viva es a la línea 76 |
| `packages/zoho-sync/src/db/schema.sql` | al final | ninguna |
| `packages/zoho-sync/src/db/migrate.ts` | línea 73 en sitio | ninguna |
| `packages/zoho-sync/src/db/migrate.test.ts` | en sitio y al final | ninguna; cambia el contenido de la línea 283, que cita `openspec/specs/gases-patron/spec.md:198` con su revisión nombrada: caso B, no se toca |
| `apps/desk/server/app.ts` | líneas 22 y 61 en sitio | ninguna |
| `packages/shared/src/calendarioLaboral.ts` | línea 155 en sitio | ninguna |
| pruebas de indicadores (tres ficheros) | en sitio y al final | ninguna cita viva encontrada a sus líneas |

Cambia el **contenido** de líneas que la decisión cita como estado de partida (`openspec/config.yaml:4096`,
`openspec/config.yaml:4102`): son caso B y el cierre las ancla a `42a4828`, sin renumerar. El barrido del cierre repite
el `grep` por cada fichero de la tabla y lee cada resultado contra lo que la frase afirma, con segundo pase para las
abreviadas.

## 13. Flujo de datos

    administrador ──POST /api/indicadores/encuesta──→ sesión → administrador → multer → fichero presente
                                                                                            │
                      decodificarFichero → analizarRespuestasEncuesta (formato) ── filas con huella + rechazadas
                                                                                            │
                      cargarRespuestas: tickets por número → huellas presentes → INSERT public.encuesta_respuestas
                                                                                            │
    administrador ←── { leidas, insertadas, duplicadas, rechazadas }

    GET /api/indicadores → leerEntradasIndicadores: tickets · historial · encuesta (última por ticket) · cierres
                         → tablaIndicadores → calcularIndicadores: 51 = hitoEntrega − finalización · 55 = calificación

## 14. Matriz de amenazas, migración y preguntas abiertas

**Matriz de amenazas:** no aplica. No hay comandos de shell, subprocesos, automatización de control de versiones ni
clasificación de ficheros ejecutables. La ruta HTTP nueva se cubre con la escalera del apartado 7.

**Migración y despliegue:** sin migración de datos ni relleno; la tabla nace vacía en el arranque. Sin interruptores.
Reversión: la de la propuesta (§10); la tabla queda inerte.

**Preguntas abiertas** (ninguna bloquea):

- [ ] `DD/MM/AAAA` se lee con el **día primero**. Una exportación con el mes primero se rechazaría fila a fila cuando
      el día pasa de 12, pero se leería mal en silencio cuando no. Lo resuelve la muestra (P-1).
- [ ] El 51 calculado empieza a entrar en la comparación con el valor de Zoho del `GET`, donde antes no había par. Es
      consecuencia de calcularlo; se anota en el parte.
- [ ] Este diseño añade dos motivos de fila que la spec no enumera a la letra (`sinMarca`, y `ambigua` como error de
      cabecera) y exporta `instanteDeJornada`. Caben en RQ-KP-20 («marca de tiempo ilegible», «error de cabecera»).

## 15. Hipótesis — lo que no se pudo comprobar

1. **Hipótesis:** pg-mem acepta `ON CONFLICT (huella) DO NOTHING` sobre una columna `UNIQUE` que no es clave primaria.
   Los precedentes vistos son sobre clave primaria (`apps/desk/server/services/alarmasSla.ts:61`,
   `packages/zoho-sync/src/db/schema.sql:768`). Respaldo: `INSERT` sin `ON CONFLICT`, y ante `23505` se repite la
   función una vez (la segunda pasada los ve como duplicados).
2. **Hipótesis:** pg-mem acepta un `INSERT … VALUES (…),(…)` de varias filas con parámetros. Respaldo: un `INSERT` por
   fila nueva dentro de la misma transacción (las lecturas siguen siendo dos).
3. **Hipótesis:** pg-mem devuelve en orden de inserción las filas empatadas en el `ORDER BY`; de eso depende que M17
   se vea roja con la inserción en orden inverso.
4. **Hipótesis:** un fichero de cero bytes llega como `req.file` con tamaño 0 y no como fichero ausente. Con
   cualquiera de las dos lecturas la respuesta es `400`; la prueba sólo afirma el estado y que hay `error`.
5. **Hipótesis:** el `TextDecoder` de Node del despliegue conoce `windows-1252`. Respaldo: `latin1` de `Buffer`.
6. **Hipótesis:** las reglas de `eslint` del repositorio no impiden usar en `hitosDe` una función declarada más abajo
   (`no-use-before-define` no aparece en `eslint.config.*`; los conjuntos que extiende no se leyeron). Respaldo:
   declarar `hitoEntrega` en la línea 128 de ese fichero, unida a la llave de cierre de `hitoMarcaIngreso`.
7. **Hipótesis:** ninguna prueba de `packages/shared/src/indicadoresComparacion` supone que el 51 nunca es comparable.
   No se leyeron.
8. **Hipótesis:** cortar la petición con `401` o `403` antes de leer el cuerpo multipart no cuelga a supertest con
   ficheros pequeños ni con el de más de 10 MB del par 403 ↔ 413.
9. Todo el formato del fichero (S-D, S-E) es **supuesto**: no hay muestra en el repositorio.
10. Las cifras de citas de la exploración (§6, riesgo 2) siguen sin repetirse; aquí sólo se barrieron los ficheros de
    la tabla del apartado 12, en `openspec/config.yaml`, `openspec/specs/`, `docs/sdd/ENTRADA.md`, `DEPLOY.md`,
    `CLAUDE.md`, `apps/` y `packages/`. El resto de `docs/sdd/` queda para el barrido del cierre.
