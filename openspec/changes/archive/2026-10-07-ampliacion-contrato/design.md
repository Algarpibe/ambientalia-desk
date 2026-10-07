# Diseño — Ampliación de contrato: hasta el 31/12 del año del vencimiento, por Comercial y con traza (F1B-11, `cierra: si`)

Propuesta: `openspec/changes/ampliacion-contrato/proposal.md` (S-1 a S-10 tomados; no se reabren).
Toda cita de este documento es a un fichero que existe y fue leído en este worktree. Los ficheros nuevos se nombran sin
línea, y una línea **prevista** se nombra en prosa («la línea 72 de ese fichero»), nunca con forma de cita.
Este diseño supera a propósito el tope de 800 palabras de la skill: el encargo pide nueve decisiones con firma exacta.

## 1. Enfoque técnico

La regla (tope, motivos de rechazo, fecha original) es dominio puro al final de `packages/shared/src/contratos.ts`; el
servidor la impone en una ruta nueva y el cliente la consume. La escritura es una transacción de dos sentencias con el
`UPDATE` condicionado a la fecha leída, molde de `apps/desk/server/db/reasignaciones.ts:30-39`. Las tres puertas no se
editan: ya leen `fecha_fin`. Ningún fichero citado gana líneas por dentro: todo lo nuevo va al final o en un fichero
nuevo, y lo que se modifica se edita **sobre la línea que ya existe**. La única excepción es `ContratoFicha.tsx`, que
no tiene citas vivas.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativas descartadas | Por qué |
|---|---|---|---|
| DD-1 | `motivoNoAmpliable` decide la fecha y `ampliacionDelCuerpo` la envuelve con el motivo y devuelve **un solo** error | Validar el cuerpo en la ruta | Con un solo error el orden es observable y mutable; molde `packages/shared/src/reasignacion.ts:39-47` |
| DD-2 | Mensajes en una constante exportada `MENSAJES_AMPLIACION` | Literales en la ruta | Ruta, pruebas y cliente comparan contra la misma constante; molde `packages/shared/src/reasignacion.ts:9-16` |
| DD-3 | El permiso es `canExecuteTransition(areas, isAdmin, 'Comercial')`, sin predicado nuevo | `puedeAmpliarContrato` en shared | Es el mismo del alta (`apps/desk/server/routes/contratos.ts:43`, `apps/desk/src/components/ContratosPanel.tsx:24`); otro nombre sería una segunda implementación de la misma noción (molde H5) |
| DD-4 | La carrera se señala con un error tipado `ContratoCambiadoError`, lanzado **dentro** de la transacción | Devolver `false` como `reasignar` | Lo pide el encargo; al lanzar dentro, `enTransaccion` hace `ROLLBACK` (`apps/desk/server/db/transaccion.ts:22-24`) y el `INSERT` no se intenta |
| DD-5 | `fechaFinOriginal` es una función pura de shared sobre la lista de traza | Columna nueva en `public.contratos`; subconsulta SQL | La propuesta prohíbe columnas; una función pura se prueba y se muta en node |
| DD-6 | `hoy` entra por `deps.hoy?: () => DiaCivil` y sólo lo usa la ruta nueva | Pasarlo desde `createApp`; usarlo también en las lecturas | `apps/desk/server/app.ts:61` no se toca; las lecturas (`apps/desk/server/routes/contratos.ts:33`, `apps/desk/server/routes/contratos.ts:69`) siguen como están |
| DD-7 | Éxito `200` con `{ contrato, ampliaciones, fechaFinOriginal }` | `201`; cuerpo vacío | No nace un recurso direccionable; el cuerpo evita adivinar el estado tras escribir |
| DD-8 | Pruebas de la ruta en fichero **nuevo**; las de las puertas en otro fichero **nuevo** | Añadir a `routes/contratos.test.ts`, `ticketService.test.ts` y `remisiones.test.ts` | No desplaza citas ni mezcla el reloj falso con pruebas que usan fechas relativas al día real (`apps/desk/server/services/ticketService.test.ts:947`) |
| DD-9 | Un predicado `cabeAmpliacion` en shared para que el cliente decida si enseña «Ampliar» | Que el `.tsx` compare fechas | Regla 13, punto 1: el cliente consume; una prueba lo enfrenta a `motivoNoAmpliable` |
| DD-10 | `openspec/config.yaml` y `docs/sdd/ENTRADA.md` **no se tocan** | Anotar ahí el cierre | No hay capacidad nueva (R-2 no aplica) y `ENTRADA.md` tiene cambios sin commitear en `main`; lo que iría ahí va al `archive-report.md` |

## 3. D1 — `packages/shared/src/contratos.ts`, al final (hoy acaba en `packages/shared/src/contratos.ts:242`)

Sin importaciones nuevas: `DiaCivil` ya está (`packages/shared/src/contratos.ts:9`) y `fechaCalendario` es del propio
fichero (`packages/shared/src/contratos.ts:34`). **El índice no cambia:** `packages/shared/src/index.ts:24` ya hace
`export * from './contratos'`.

```ts
/* ampliacion-contrato (F1B-11; `decision/e086-ampliacion-contrato`; `tickets-core`). */

/** Los textos de la ruta `POST /api/contratos/:id/ampliar`, en un solo sitio. */
export const MENSAJES_AMPLIACION = {
  inexistente: 'Contrato no encontrado',
  permiso: 'Ampliar un contrato requiere el área Comercial',
  fecha: 'La nueva fecha de fin es obligatoria, en formato AAAA-MM-DD',
  noPosterior: 'La nueva fecha de fin tiene que ser posterior a la vigente',
  pasaDelTope: 'Un contrato sólo se puede ampliar hasta el 31/12 del año de su vencimiento',
  plazoCerrado: 'El plazo para ampliar este contrato terminó el 31/12 del año de su vencimiento',
  motivo: 'El motivo es obligatorio',
  carrera: 'La fecha de fin del contrato cambió mientras lo ampliabas: recarga la ficha y vuelve a decidir',
}

/** El 31/12 del año natural del vencimiento. El año son los cuatro primeros caracteres: NO se pasa por `Date`. */
export function topeAmpliacion(fechaFin: DiaCivil): DiaCivil            // `${fechaFin.slice(0, 4)}-12-31`

/** El mensaje del rechazo, o `null`. Orden fijo: fecha, noPosterior, pasaDelTope, plazoCerrado. */
export function motivoNoAmpliable(contrato: Pick<Contrato, 'fechaFin'>, nuevaFecha: unknown, hoy: DiaCivil): string | null

/** Si queda sitio para ampliar: `fechaFin < tope` y `hoy <= tope`. Comodidad del cliente (regla 13). */
export function cabeAmpliacion(contrato: Pick<Contrato, 'fechaFin'>, hoy: DiaCivil): boolean

export type CuerpoAmpliacion = { ok: true; fechaFin: DiaCivil; motivo: string } | { ok: false; error: string }
/** Cuerpo HTTP → un solo error: primero el de `motivoNoAmpliable`, después `motivo` vacío tras recortar (S-1, S-9). */
export function ampliacionDelCuerpo(v: unknown, contrato: Pick<Contrato, 'fechaFin'>, hoy: DiaCivil): CuerpoAmpliacion

/** Una fila de la traza, tal como la sirve `GET /api/contratos/:id`. */
export interface AmpliacionContrato { fechaAnterior: DiaCivil; fechaNueva: DiaCivil; motivo: string | null; ampliadoPor: string; ampliadoAt: string }

/** La fecha de fin del alta: la `fechaAnterior` de la PRIMERA fila (orden ascendente); sin filas, la vigente (S-8). */
export function fechaFinOriginal(vigente: DiaCivil, ampliaciones: readonly Pick<AmpliacionContrato, 'fechaAnterior'>[]): DiaCivil
```

Contrato de `motivoNoAmpliable`, con comparación de cadenas (el orden lexicográfico es el del calendario,
`packages/shared/src/contratos.ts:4-5`):

| Paso | Condición | Devuelve |
|---|---|---|
| 1 | `fechaCalendario(nuevaFecha)` es `null` | `fecha` |
| 2 | `nueva <= contrato.fechaFin` | `noPosterior` |
| 3 | `nueva > topeAmpliacion(contrato.fechaFin)` | `pasaDelTope` |
| 4 | `hoy > topeAmpliacion(contrato.fechaFin)` | `plazoCerrado` |

`motivo` va el último (paso 5, en `ampliacionDelCuerpo`). Si la spec fija otro orden, manda la spec: es reordenar
líneas de dos funciones. `hoy` lo pasa quien llama y es siempre el de la zona de negocio
(`packages/shared/src/contratos.ts:61`).

## 4. D2 — Esquema

**Al final de `packages/zoho-sync/src/db/schema.sql`** (la última sentencia es hoy
`packages/zoho-sync/src/db/schema.sql:768`). Comentarios sin punto y coma (el troceo es por `;`,
`packages/zoho-sync/src/db/migrate.ts:19-20`), sin tildes y sin comentarios dentro del `CREATE`:

```sql
-- ampliacion-contrato (F1B-11, decision e086): traza de cada ampliacion de la fecha de fin de un contrato
-- contratos.fecha_fin pasa a ser la fecha VIGENTE y la original es la fecha_anterior de la primera fila
-- Sin FK a contratos y sin DELETE ni UPDATE. motivo es anulable y sin CHECK (S-1, la obligacion la impone la ruta)
-- AL FINAL del fichero para no desplazar citas (regla de mutacion 4). CALIFICADA public.
CREATE TABLE IF NOT EXISTS public.contrato_ampliaciones (
  id bigserial PRIMARY KEY,
  contrato_id bigint NOT NULL,
  fecha_anterior date NOT NULL,
  fecha_nueva date NOT NULL,
  motivo text,
  ampliado_por text NOT NULL,
  ampliado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contrato_ampliaciones_contrato ON public.contrato_ampliaciones (contrato_id);
```

En sitio, `packages/zoho-sync/src/db/schema.sql:559`: «Sin DELETE ni UPDATE de datos (S-13)» pasa a «Sin DELETE. El
unico UPDATE de datos es la ampliacion de fecha_fin (ampliacion-contrato)». Misma línea, sin punto y coma.

**`packages/zoho-sync/src/db/migrate.ts:73`**, en sitio: la lista gana `, 'contrato_ampliaciones'` detrás de
`'reasignaciones'`. El fichero sigue en 131 líneas.

**Guardianes de `packages/zoho-sync/src/db/migrate.test.ts` que se rompen** (barrido hecho sobre todos los usos de
`schemaStatements` del repositorio; los demás ficheros que la usan filtran por otras tablas y no se ven afectados).
Todas las ediciones son **en sitio**: el fichero no gana líneas hasta su final.

| Dónde | Hoy | Queda |
|---|---|---|
| `packages/zoho-sync/src/db/migrate.test.ts:282` | título «son 43 tablas: 10 de Desk, 30 de la app en public (reasignaciones, F1B-05; …» | «son 44 tablas: 10 de Desk, 31 de la app en public (contrato_ampliaciones, F1B-11; reasignaciones, F1B-05; …» |
| `packages/zoho-sync/src/db/migrate.test.ts:283` | `toEqual([10, 30, 3])` | `toEqual([10, 31, 3])` |
| `packages/zoho-sync/src/db/migrate.test.ts:284-286` | tres `toBe(43)` | tres `toBe(44)` |
| `packages/zoho-sync/src/db/migrate.test.ts:652` | suma `… + 3 + 2 + 1` | `… + 3 + 2 + 1 + 2`, y el mensaje gana «y las dos de public.contrato_ampliaciones (F1B-11, ampliacion-contrato)» |
| `packages/zoho-sync/src/db/migrate.test.ts:794` | título: reasignaciones antepenúltima, índice penúltima, siembra última | título: quinta, cuarta y tercera por el final; las dos últimas son las de `contrato_ampliaciones` |
| `packages/zoho-sync/src/db/migrate.test.ts:796` | `l[l.length - 3]` | `l[l.length - 5]` |
| `packages/zoho-sync/src/db/migrate.test.ts:798` | `l[l.length - 2]` y `l[l.length - 1]` | `l[l.length - 4]` y `l[l.length - 3]` |
| `packages/zoho-sync/src/db/migrate.test.ts:782` y `packages/zoho-sync/src/db/migrate.test.ts:785` | «cierran el esquema» / «cierra el esquema» | sólo el texto: dejan de afirmar que cierran el esquema |

No se rompe `packages/zoho-sync/src/db/migrate.test.ts:799` (cuenta sentencias que mencionan `reasignaciones` tras
quitar los comentarios; por eso el comentario nuevo no nombra esa tabla ni las palabras que otros guardianes cuentan
sobre el texto crudo, como `compuesto`). El guardián de clasificación
(`packages/zoho-sync/src/db/migrate.test.ts:266-275`) se pone rojo sin la edición de `PUBLIC_TABLES`: es lo esperado.

**Bloque nuevo al final de `migrate.test.ts`** (tras `packages/zoho-sync/src/db/migrate.test.ts:819`), molde
`packages/zoho-sync/src/db/migrate.test.ts:785-819`: la tabla existe en `public` y vacía; el `CREATE` calificado es la
penúltima sentencia y el índice la última; dos sentencias la mencionan; la base rechaza `fecha_anterior`,
`fecha_nueva`, `contrato_id` y `ampliado_por` nulos y acepta `motivo` nulo; `PUBLIC_TABLES` la contiene.

**Citas vivas a `migrate.test.ts`:** ninguna se desplaza (no se inserta nada antes del final). Cambia el
**contenido** de la línea del recuento, que cita `openspec/specs/gases-patron/spec.md:198`; esa cita ya nombra su
revisión («medidos sobre `f5255d2`»), así que es caso B y no se reescribe.

## 5. D3 — `apps/desk/server/db/contratos.ts` (115 líneas hoy; en sitio las líneas 2, 3 y 8; lo demás al final)

| Línea | Queda |
|---|---|
| `apps/desk/server/db/contratos.ts:2` | la lista importada gana `MENSAJES_AMPLIACION, type AmpliacionContrato` |
| `apps/desk/server/db/contratos.ts:3` | la misma, seguida de `; import { enTransaccion } from './transaccion'` |
| `apps/desk/server/db/contratos.ts:8` | «no hay `DELETE`. `UPDATE` sólo hay dos: la marca de ritmo y la ampliación de `fecha_fin` (al final), siempre con traza.» |

Al final del fichero:

```ts
/** La fecha de fin ya no era la que la ruta leyó: otra ampliación se coló. No se escribió nada. */
export class ContratoCambiadoError extends Error {
  constructor(readonly contratoId: number) { super(MENSAJES_AMPLIACION.carrera) }
}

export interface Ampliar { contratoId: number; fechaAnterior: string; fechaNueva: string; motivo: string | null; ampliadoPor: string }

/** Amplía y deja la traza en UNA transacción. Devuelve el contrato ya ampliado. */
export async function ampliarContrato(db: Queryable, a: Ampliar): Promise<Contrato>
//  enTransaccion(db, async (q) => {
//    1. `UPDATE contratos SET fecha_fin = $2 WHERE id = $1 AND fecha_fin = $3 RETURNING ${COLUMNAS}`  [contratoId, fechaNueva, fechaAnterior]
//       → 0 filas: throw new ContratoCambiadoError(a.contratoId)
//    2. 'INSERT INTO contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, motivo, ampliado_por) VALUES ($1, $2, $3, $4, $5)'
//    3. return filas(r.rows)[0]!
//  })

/** La traza de un contrato, de la más antigua a la más reciente (`ORDER BY id`). */
export async function ampliacionesDelContrato(db: Queryable, contratoId: number): Promise<AmpliacionContrato[]>
//  SELECT fecha_anterior, fecha_nueva, motivo, ampliado_por, ampliado_at FROM contrato_ampliaciones WHERE contrato_id = $1 ORDER BY id
//  fechas con `comoDiaCivil`; `ampliadoAt` en ISO como `createdAt` de la línea 36
```

- El texto del `UPDATE` **empieza** por `UPDATE contratos SET fecha_fin`: el doble de carrera de las pruebas lo
  reconoce por ese prefijo.
- `fechaAnterior` es la que **leyó la ruta**, no una relectura: así la traza dice siempre la fecha vigente al aplicarse.
- `fechaFinOriginal` no se calcula aquí: la ruta llama a la función pura de shared con esta lista (DD-5).
- **Hipótesis:** pg-mem compara `fecha_fin = $3` con un parámetro de texto `YYYY-MM-DD` sin conversión explícita. Si
  no, respaldo: `$3::date` y `$2::date`.
- La atomicidad real no se prueba: sin pool no hay transacción (`apps/desk/server/db/transaccion.ts:15`). Se prueba
  por estructura, con el doble de `apps/desk/server/db/reasignaciones.test.ts:108-109`: `BEGIN`, `UPDATE`, `ROLLBACK`
  y ningún `INSERT` cuando el `UPDATE` no acierta fila.

## 6. D4 — `apps/desk/server/routes/contratos.ts` (71 líneas hoy)

En sitio, sin cambiar el número de líneas:

| Línea | Queda |
|---|---|
| `apps/desk/server/routes/contratos.ts:5` | la lista gana `MENSAJES_AMPLIACION, ampliacionDelCuerpo, fechaFinOriginal, type DiaCivil` |
| `apps/desk/server/routes/contratos.ts:9` | la lista gana `ampliarContrato, ampliacionesDelContrato, ContratoCambiadoError` |
| `apps/desk/server/routes/contratos.ts:21` | `deps: { db: Queryable; hoy?: () => DiaCivil }` |
| `apps/desk/server/routes/contratos.ts:22` | `const { db } = deps; const hoy = deps.hoy ?? hoyEnZona` |
| `apps/desk/server/routes/contratos.ts:33` | `const ampliaciones = await ampliacionesDelContrato(db, contrato.id); res.json({ contrato, estado: estadoContrato(contrato, hoyEnZona()), saldo: await saldoPorLote(db, contrato.lote), ampliaciones, fechaFinOriginal: fechaFinOriginal(contrato.fechaFin, ampliaciones) })` |

`apps/desk/server/app.ts:61` no se toca: `hoy` es opcional. El comentario de cabecera
(`apps/desk/server/routes/contratos.ts:11-20`) no se amplía; la ruta nueva lleva el suyo.

**Ruta nueva**, insertada entre `apps/desk/server/routes/contratos.ts:70` y la llave de cierre de la línea 71: empieza
en la línea 72 de ese fichero (tras una línea en blanco). La última línea citada del fichero es la 70, así que
**ninguna cita se desplaza**.

`POST /api/contratos/:id/ampliar` — `requireAuth(db)`; cuerpo `{ fechaFin, motivo }`.

| Paso | Escalón | Condición | Respuesta |
|---|---|---|---|
| 1 | A | id no numérico, o `contratoPorId` devuelve `null` | `404` `MENSAJES_AMPLIACION.inexistente` |
| 2 | B | `!canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` | `403` `MENSAJES_AMPLIACION.permiso` |
| 3 | C | `ampliacionDelCuerpo(req.body, contrato, hoy())` no `ok` | `422` con su `error` |
| 4 | D | `ampliarContrato(db, { contratoId, fechaAnterior: contrato.fechaFin, fechaNueva, motivo, ampliadoPor: user.name })` lanza `ContratoCambiadoError` | `409` `MENSAJES_AMPLIACION.carrera` |
| — | — | éxito | `200` `{ contrato, ampliaciones, fechaFinOriginal }` |

`ampliadoPor` es `user.name`, como `creadoPor` en `apps/desk/server/routes/contratos.ts:57`; del cuerpo sólo se leen
`fechaFin` y `motivo`. El id no numérico no llega a la base, como en `apps/desk/server/routes/contratos.ts:31`.

**Citas vivas a `routes/contratos.ts`** (fuera de `openspec/changes/`): `openspec/config.yaml:4072` (línea 43, intacta),
`docs/sdd/ENTRADA.md:1239` (línea 24, intacta) y las de los paquetes de despliegue del 29/09 al 01/10, que son
registros fechados (caso B). De ellas, sólo la que apunta a la línea 33 ve cambiar el **contenido**: afirma lo que
la ficha servía en su fecha y no se reescribe.

## 7. D5 — Pruebas (strict TDD: rojo antes que verde; vitest en node, pg-mem con `migrate(db)`)

| Fichero | Tipo | Cubre |
|---|---|---|
| `packages/shared/src/contratos.test.ts` | existente, **al final** | `topeAmpliacion` (cuatro bordes), `motivoNoAmpliable` (tabla y orden por pares), `cabeAmpliacion`, `ampliacionDelCuerpo`, `fechaFinOriginal` |
| `packages/zoho-sync/src/db/migrate.test.ts` | existente, en sitio y al final | apartado 4 |
| `apps/desk/server/db/contratos.test.ts` | existente, **al final** | `ampliarContrato`, `ampliacionesDelContrato`, carrera y estructura de la transacción |
| `apps/desk/server/routes/contratosAmpliar.test.ts` | **nuevo** | escalera de la ruta, traza, lectura ampliada |
| `apps/desk/server/ampliacionContratoPuertas.test.ts` | **nuevo** | efecto en las tres puertas |

**Shared.** Bordes: fin el 31/12 (tope el propio día; toda fecha posterior da `pasaDelTope`); fin el 01/01 (tope el
31/12 de ese año); petición para el 01/01 del año siguiente (`pasaDelTope`); `hoyEnZona(new Date('2027-01-01T03:00:00Z'))`
es `2026-12-31` y con él un contrato que vence en 2026 aún se amplía. Orden por pares, las dos condiciones activas a la
vez: inválida ↔ plazo cerrado; no posterior ↔ plazo cerrado; pasa del tope ↔ plazo cerrado; cualquiera de las cuatro ↔
motivo vacío. Par **no activable**, y se declara: no posterior ↔ pasa del tope (una fecha no puede ser a la vez `<=` la
vigente y `>` el tope). Propiedad que enfrenta las dos implementaciones (DD-9): si `cabeAmpliacion` es falso,
`motivoNoAmpliable` no es `null` para ninguna fecha de una rejilla.

**Capa de datos.** Ampliar escribe la fecha y una fila con los cinco datos; dos ampliaciones encadenadas dejan dos
filas en orden y `fechaFinOriginal` sigue siendo la del alta; `fechaAnterior` desfasada lanza `ContratoCambiadoError`,
la fecha no cambia y no hay fila; `motivo: null` se guarda como nulo.

**Ruta** (`apps/desk/server/testing/appHarness.ts:34-40`, `apps/desk/server/testing/appHarness.ts:46`,
`apps/desk/server/testing/appHarness.ts:86-95`). `hoy` fijo se inyecta con una aplicación mínima local al fichero
—`express()`, `express.json()`, `cookieParser()` y `registerContratosRoutes(app, { db, hoy })`—, sin tocar el arnés.
Contratos con fechas fijas (por ejemplo fin `2031-06-30`), ninguna relativa al día real.

| Par | Caso (las dos guardas activas) | Esperado |
|---|---|---|
| A ↔ B | Servicio Técnico sobre un id inexistente | `404` |
| A ↔ C | Comercial, id inexistente y cuerpo vacío | `404` |
| B ↔ C | Servicio Técnico, contrato real y cuerpo inválido | `403`, sin fila |
| B ↔ D | Servicio Técnico, cuerpo válido y doble de carrera | `403`, el doble no dispara |
| C ↔ D | Comercial, motivo vacío y doble de carrera | `422`, el doble no dispara, fecha intacta |
| D sola | Comercial, cuerpo válido y doble de carrera | `409` `carrera`, sin fila, fecha como la dejó la otra escritura |

**Doble de carrera** (C ↔ D y el `409`), molde `apps/desk/server/routes/reasignacion.test.ts:221-230`: un `Queryable`
**sin `connect`** que, antes de reenviar la sentencia que empieza por `UPDATE contratos SET fecha_fin`, escribe otra
`fecha_fin` en la base real y cuenta los disparos. Se pasa como `dbPropia` a `appWith`.

Además: matriz por área (molde `apps/desk/server/routes/contratos.test.ts:24-31`); `ampliadoPor` es el de la sesión
aunque el cuerpo traiga otro; el motivo se guarda recortado; `GET /api/contratos/:id` sirve `ampliaciones` y
`fechaFinOriginal` (sin ampliaciones, igual a la fecha de fin) y conserva `contrato`, `estado` y `saldo`. La prueba
existente de la ficha usa `toMatchObject` (`apps/desk/server/routes/contratos.test.ts:76`) y sigue verde sin tocarse; la
del espía (`apps/desk/server/routes/contratos.test.ts:80-84`) cuenta consultas que casan con `contratos`, y el nombre
`contrato_ampliaciones` no casa. Una prueba más, por `appWith` y **sin** inyectar `hoy`, fija el valor por defecto:
con el reloj en `2027-01-01T03:00:00Z` un contrato que vence el `2026-06-30` se amplía al `2026-12-31` (`200`).

**Las tres puertas**, en `apps/desk/server/ampliacionContratoPuertas.test.ts`. Reloj:
`vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime(…)`, con `afterEach(() => { vi.useRealTimers() })`.
Precedente en el repositorio: `apps/desk/server/services/guardaGasPatron.test.ts:17` y
`apps/desk/server/services/guardaGasPatron.test.ts:113`, que lo usa con pg-mem y **sin** supertest. Por tanto: que
pg-mem no se cuelga está visto; que supertest tampoco es **hipótesis** (sólo se falsea `Date`, no los temporizadores).
Respaldo si se cuelga: `vi.mock('@ambientalia/shared', …)` sustituyendo sólo `hoyEnZona` por un reloj de la prueba; los
valores por defecto de `apps/desk/server/db/contratos.ts:84` y `apps/desk/server/db/contratos.ts:91` lo recogen.

Guion de cada puerta (una prueba por puerta, base nueva en cada una):

1. Reloj en `2031-07-15T15:00:00Z`. Contrato del lote con fin `2031-06-30`, dado de alta con `crearContrato`.
2. La puerta **rechaza** con «venció el 2031-06-30».
3. Se amplía con el **escritor real**: `POST /api/contratos/:id/ampliar` al `2031-09-30`, por `appWith` → `200`.
4. La puerta **deja pasar** la subOV.
5. Reloj en `2031-10-01T15:00:00Z`. La puerta **vuelve a rechazar** otra subOV del mismo lote, con «venció el
   2031-09-30».

| Puerta | Cómo se llega | Molde |
|---|---|---|
| Alta | `createManagedTicket` | `apps/desk/server/services/ticketService.test.ts:985-995` |
| Transición | `executeTransition` con `habilitar_servicio` | `apps/desk/server/services/ticketService.test.ts:1049-1061` |
| Remisión | `POST /api/remisiones` | `apps/desk/server/remisiones.test.ts:1294-1327` |

Los ayudantes de esos moldes son locales a sus ficheros: se copian los mínimos al fichero nuevo. **Sesiones:** la
sesión caduca a los 30 días y se compara con `now()` de la base (`apps/desk/server/auth/sessions.ts:6`,
`apps/desk/server/auth/sessions.ts:21`); es **hipótesis** que el `now()` de pg-mem sigue al reloj falso. Para no
depender de ello, el usuario se crea una vez y se abre **una sesión nueva tras cada salto de reloj** con `createSession`.
**Hipótesis:** el alta de remisión no compara su `fecha` con el día de hoy; la prueba usa una fecha coherente con el
reloj falso por si lo hiciera.

## 8. D6 — Cliente

| Fichero | Cambio |
|---|---|
| `apps/desk/src/api/client.ts:680` | en sitio: `FichaContrato` gana `ampliaciones: import('@ambientalia/shared').AmpliacionContrato[]; fechaFinOriginal: string` |
| final de `apps/desk/src/api/client.ts` (acababa en `apps/desk/src/api/client.ts:878` en `351c046`) | `export function ampliarContrato(id: number, cuerpo: { fechaFin: string; motivo: string }): Promise<{ contrato: Contrato; ampliaciones: FichaContrato['ampliaciones']; fechaFinOriginal: string }>`, molde `apps/desk/src/api/client.ts:867-871` |
| `apps/desk/src/components/ContratosPanel.tsx:17` | en sitio: «No hay edición ni borrado. La fecha de fin se amplía desde la ficha (ampliacion-contrato).» |
| `apps/desk/src/components/ContratoFicha.tsx` | inserciones por dentro (abajo) |

`ContratoFicha.tsx` (88 líneas, sin citas vivas a sus líneas):

- Usuario de sesión: `const { user } = useAuth()`, de `../auth/AuthContext`, igual que
  `apps/desk/src/components/ContratosPanel.tsx:3` y `apps/desk/src/components/ContratosPanel.tsx:20`. La firma del
  componente (`apps/desk/src/components/ContratoFicha.tsx:21`) no cambia.
- `puedeAmpliar = !!user && canExecuteTransition(user.areas, user.isAdmin, 'Comercial') && !!c && cabeAmpliacion(c, hoyEnZona())`.
- «Vigencia» sigue enseñando la fecha vigente; un dato nuevo «Fecha de fin original» cuando difiere.
- Botón «Ampliar» y formulario con fecha (`max={topeAmpliacion(c.fechaFin)}`) y motivo. No valida: envía, y el
  mensaje del servidor se enseña con `mensajeDelServidor` (`apps/desk/src/api/client.ts:660`).
- Tras el éxito o un `409`: `ficha.reload()` e `informe.reload()`.
- Sección «Ampliaciones»: tabla con quién, cuándo, fecha anterior, fecha nueva y motivo, tal como llegan.

### Regla 13 — decisión del cliente → guarda del servidor

| # | Decisión del cliente | Servidor |
|---|---|---|
| 1 | «Ampliar» sólo se enseña a Comercial y administradores | **Prevista:** paso 2 (`403`) de la ruta nueva de `apps/desk/server/routes/contratos.ts`, con `canExecuteTransition` |
| 2 | El campo de fecha propone como máximo el 31/12 del año del vencimiento | **Prevista:** paso 3 (`422` `pasaDelTope`), con `motivoNoAmpliable` |
| 3 | No ofrece «Ampliar» si pasó el tope o no queda sitio (`cabeAmpliacion`) | **Prevista:** paso 3 (`422` `plazoCerrado` o `pasaDelTope`) |
| 4 | Pide motivo | **Prevista:** paso 3 (`422` `motivo`), con `ampliacionDelCuerpo` |
| 5 | Tras un `409`, recarga la ficha | **Prevista:** paso 4, el `UPDATE` condicionado de `ampliarContrato` |
| 6 | Pinta la traza y la fecha original | No decide: llegan de `apps/desk/server/routes/contratos.ts:33` (misma línea, con los campos nuevos) |

Las filas «prevista» se cierran en `tasks.md` con la línea real. Los `.tsx` quedan fuera de la red de pruebas (F0-00).

## 9. D7 — Dónde cae cada edición (regla de mutación 4)

| Fichero | Dónde | Citas que se desplazan |
|---|---|---|
| `packages/shared/src/contratos.ts` | al final | ninguna |
| `packages/shared/src/contratos.test.ts` | al final | ninguna |
| `packages/zoho-sync/src/db/schema.sql` | al final; línea 559 en sitio | ninguna. `DEPLOY.md:530` cita la línea 768 por la siembra que contiene, no por ser la última sentencia: sigue siendo cierta |
| `packages/zoho-sync/src/db/migrate.ts` | línea 73 en sitio | ninguna |
| `packages/zoho-sync/src/db/migrate.test.ts` | en sitio y al final | ninguna; cambia el contenido de la línea 283, que cita `openspec/specs/gases-patron/spec.md:198` con su revisión nombrada (`f5255d2`): caso B, no se toca |
| `apps/desk/server/db/contratos.ts` | líneas 2, 3 y 8 en sitio; al final | ninguna; `openspec/config.yaml:4073` cita la línea 8 como estado de partida (caso C: se anota qué lo cerró) |
| `apps/desk/server/db/contratos.test.ts` | al final | ninguna |
| `apps/desk/server/routes/contratos.ts` | líneas 5, 9, 21, 22 y 33 en sitio; ruta tras la línea 70 | ninguna |
| `apps/desk/src/api/client.ts` | línea 680 en sitio; al final | ninguna |
| `apps/desk/src/components/ContratosPanel.tsx` | línea 17 en sitio | ninguna |
| `apps/desk/src/components/ContratoFicha.tsx` | **en medio** | ninguna cita viva encontrada fuera de `openspec/changes/`; el cierre repite el barrido incluyendo `apps/` |
| `DEPLOY.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | al final | ninguna |
| plan R01.4 | fila de F1B-11 en sitio (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:91`, `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:216`) | ninguna |

**Barrido del cierre:** por cada fichero de la tabla, `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre el repositorio,
cada resultado leído contra el fichero y contra lo que **afirma** la frase; segundo pase para las abreviadas en los
ficheros que ya citan esos módulos; detector con cero bloqueantes. En el archivo, además,
`openspec/specs/tickets-core/spec.md`: modificar RQ-TC-21 puede desplazar lo que la sigue.

## 10. D8 — Lotes de `apply` (techo 800, válvula 720)

Pruebas: primera cuenta × 1,8. Código y documentos: primera cuenta, contando dos veces las líneas editadas en sitio.

| Lote | Ficheros | Código | Pruebas × 1,8 | Total |
|---|---|---|---|---|
| 1 · Regla | `packages/shared/src/contratos.ts`; `packages/shared/src/contratos.test.ts` | 60 | 80 → 144 | **~205** |
| 2 · Esquema y datos | `schema.sql` (16); `migrate.ts` (2); `migrate.test.ts` en sitio (18) y bloque nuevo; `apps/desk/server/db/contratos.ts` (45); `apps/desk/server/db/contratos.test.ts` | 81 | 105 → 189 | **~270** |
| 3 · Ruta | `apps/desk/server/routes/contratos.ts` (38); `apps/desk/server/routes/contratosAmpliar.test.ts` | 38 | 150 → 270 | **~310** |
| 4 · Tres puertas | `apps/desk/server/ampliacionContratoPuertas.test.ts` | 0 | 115 → 207 | **~210** |
| 5 · Cliente y cierre | `ContratoFicha.tsx` (80); `client.ts` (12); `ContratosPanel.tsx` (2); sección al final de `DEPLOY.md` (25); paquete de despliegue nuevo en `docs/sdd/` (130); corrección al final de `F0-01_Correcciones_para_el_maestro.md` (30); plan R01.4 (6); tabla de la regla 13 en `tasks.md` (15) | 300 | — | **~300** |

Los lotes 3 y 4 juntos suman ~520 y cabrían en uno; se dejan **aparte** porque el 4 lleva dos hipótesis (reloj falso
con supertest, sesiones) que no deben arrastrar a la ruta si fallan. El lote 2 depende del 1; el 3, del 2; el 4, del 3;
el 5, del 3. Cada intento se cierra con `git diff --shortstat --no-renames` contra el commit de partida más `wc -l`
de lo nuevo sin trackear.

## 11. D9 — Mutaciones que el verify deberá reproducir

| # | Mutación | La caza |
|---|---|---|
| M1 | Ruta: permutar los pasos 1 y 2 | par A ↔ B |
| M2 | Ruta: permutar los pasos 2 y 3 | par B ↔ C |
| M3 | Ruta: escribir antes de validar (paso 4 antes del 3) | par C ↔ D: el doble dispara y la fecha cambia |
| M4 | `motivoNoAmpliable`: `plazoCerrado` el primero; `motivo` antes que la fecha | pares de orden de shared |
| M5 | Fichero vigilado `schema.sql`: quitar `public.` del `CREATE` | guardián de clasificación y bloque nuevo |
| M6 | `schema.sql`: mover el `CREATE` nuevo antes de la siembra de accesorios | posición del bloque nuevo y `packages/zoho-sync/src/db/migrate.test.ts:798` |
| M7 | `schema.sql`: quitar `NOT NULL` de `fecha_anterior`; de `ampliado_por` | rechazos de la base del bloque nuevo |
| M8 | Quitar `'contrato_ampliaciones'` de `PUBLIC_TABLES` | guardián de clasificación y recuento |
| M9 | Tope ±1 día (`-12-30`; 01/01 del año siguiente) | bordes de `topeAmpliacion` y de `pasaDelTope` |
| M10 | Tope con el año de `hoy`; año obtenido con `new Date(fechaFin).getFullYear()` | borde del 01/01 y contrato de otro año |
| M11 | `<=` por `<` en «posterior a la vigente» (acepta la misma fecha) | caso fecha igual → `noPosterior` |
| M12 | `>` por `>=` en «posterior al tope» (rechaza el propio 31/12) | ampliar exactamente al tope → `200` |
| M13 | `>` por `>=` en «plazo cerrado» (cierra el 31/12) | `hoy` igual al tope todavía amplía (S-10) |
| M14 | Día en UTC: `deps.hoy ?? (() => new Date().toISOString().slice(0, 10))` | prueba del valor por defecto con el reloj en `2027-01-01T03:00:00Z` |
| M15 | Quitar `AND fecha_fin = $3` del `UPDATE` | `409` de carrera y `ContratoCambiadoError` de la capa de datos |
| M16 | Quitar el `INSERT` de la traza; invertirlo con el `UPDATE` | fila de traza; estructura de la transacción |
| M17 | `fechaFinOriginal` desde la última fila; `ORDER BY id DESC` | dos ampliaciones encadenadas |
| M18 | `ampliadoPor` tomado del cuerpo | prueba del actor de la sesión |
| M19 | `cabeAmpliacion` siempre `true` | propiedad que la enfrenta a `motivoNoAmpliable` |
| M20 | Quitar `ampliaciones` o `fechaFinOriginal` de la lectura | prueba del `GET` |

## 12. Flujo de datos

    ficha (Comercial) ──POST /api/contratos/:id/ampliar──→ A existe → B permiso → C ampliacionDelCuerpo (shared, hoy)
                                                                                      │
                                         D ampliarContrato: UPDATE contratos … AND fecha_fin = leída ──→ INSERT contrato_ampliaciones
                                                                                      │
    alta · transición · remisión ──motivoContratoVencido──→ contratos.fecha_fin (ya vigente) ── sin tocar las puertas
    ficha ←── GET /api/contratos/:id ←── contrato + ampliacionesDelContrato + fechaFinOriginal (shared)

## 13. Matriz de amenazas

No aplica: no hay comandos de shell, subprocesos, automatización de control de versiones ni clasificación de ficheros
ejecutables. La ruta HTTP nueva se cubre con la escalera de guardas del apartado 6.

## 14. Migración y despliegue

Sin migración de datos ni relleno: la tabla nace vacía en el arranque. Sin interruptores nuevos: `.env.example` no
cambia. Reversión: se revierte la rama y la tabla queda sin lector; las fechas ya ampliadas se restauran a mano con la
`fecha_anterior` de la primera fila de cada contrato, y es dato de producción.

## 15. Preguntas abiertas

- [ ] Orden de los motivos del escalón C: este diseño propone fecha, no posterior, pasa del tope, plazo cerrado,
      motivo. Si la spec fija otro, manda la spec y se ajustan M4 y los pares de shared. No bloquea.
- [ ] Con el plazo cerrado y una fecha inválida, el usuario corrige la fecha y sólo entonces lee que el plazo terminó.
      `cabeAmpliacion` lo evita en la pantalla; por la API es observable. Se declara, no se cambia.
- [ ] Tres hipótesis a confirmar en `apply`, cada una con su respaldo escrito: comparación de `date` con texto en
      pg-mem (apartado 5); reloj falso con supertest y `now()` de pg-mem (apartado 7).
