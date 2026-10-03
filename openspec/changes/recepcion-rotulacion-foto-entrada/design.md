# Diseño: recepción con rotulado, lista de novedades y foto obligatoria en la remisión de entrada

Cambio `recepcion-rotulacion-foto-entrada` · tanda F1B-04 · `cierra: no`. Entrada: `proposal.md` y `exploration.md`
de esta carpeta. Todas las citas se leyeron en el worktree sobre `f55b7d9`. **Esta fase no tuvo terminal**: lo que
depende de ejecutar algo va marcado «hipótesis» y está reunido en el §12.

## 0. Enfoque en cinco líneas

- La lista de novedades es **dato** (`public.catalogo_novedades`, sembrada en `schema.sql`); el servidor decide
  leyendo las marcas `excluye_demas`, `exige_texto` y `activo`, nunca la clave.
- Toda la regla vive en un módulo nuevo de `packages/shared` que recibe el catálogo **como argumento**; el servidor
  lo alimenta desde la base y el cliente desde la ruta de lectura.
- Marcador de formulario nuevo: `novedades` presente en el cuerpo del alta y `novedades IS NOT NULL` en la fila.
  Ausente o `NULL` = legado, que se comporta como hoy.
- Los ficheros muy citados se editan **sustituyendo en sitio, cero líneas netas**. Lo nuevo va en ficheros nuevos o
  al final de `schema.sql`.
- Cuatro lotes de apply, cada uno verde por sí solo.

## 1. Esquema

### 1.1 Bloque que se añade al final de `schema.sql`

Hoy el fichero termina en `packages/zoho-sync/src/db/schema.sql:676`. Se añaden ≈ 31 líneas, de la 677 en adelante.
**Ningún comentario del bloque puede llevar punto y coma**: `schemaStatements` trocea por ese carácter sin
distinguir comentarios (`packages/zoho-sync/src/db/migrate.ts:19-21`). Los comentarios van sin tildes, como el
resto del fichero; las etiquetas sí las llevan (el fichero ya tiene tres caracteres no ASCII y se lee como UTF-8).

```sql
-- recepcion-rotulacion-foto-entrada (F1B-04): lista de tipos de novedad de la remision de entrada. Es DATO
-- mantenible (decision/f1b04-desplegables, consecuencia 5), sin pantalla: se edita por SQL. Una novedad se
-- RETIRA con activo = false y nunca borrando la fila, porque la siembra de abajo la volveria a insertar.
-- excluye_demas y exige_texto son el comportamiento: el servidor decide por las marcas y no por la clave.
-- CALIFICADA (public). AL FINAL para no desplazar citas
CREATE TABLE IF NOT EXISTS public.catalogo_novedades (
  clave text PRIMARY KEY,
  etiqueta text NOT NULL,
  orden integer NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  excluye_demas boolean NOT NULL DEFAULT false,
  exige_texto boolean NOT NULL DEFAULT false
);
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('sin_novedad', 'Sin novedad', 10, true, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('golpe_carcasa', 'Golpe o abolladura en la carcasa', 20, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('rayon_estetico', 'Rayón o daño estético', 30, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('pantalla_danada', 'Pantalla o display dañado', 40, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('conector_danado', 'Conector o puerto dañado', 50, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('falta_accesorio', 'Falta un accesorio', 60, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('embalaje_inadecuado', 'Embalaje inadecuado o dañado', 70, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('humedad_suciedad', 'Humedad, suciedad o contaminación visible', 80, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('sello_roto', 'Sello o precinto roto', 90, false, false) ON CONFLICT (clave) DO NOTHING;
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('otro', 'Otro', 100, false, true) ON CONFLICT (clave) DO NOTHING;
-- Columnas de la recepcion. Todas NULL-ables y SIN relleno: novedades NULL es la marca de remision de legado.
-- remisiones y remision_fotos son de PUBLIC_TABLES, asi que las seis van CALIFICADAS
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS novedades jsonb;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS novedad_otro text;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS rotulado_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS rotulado_por text;
ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS novedad text;
```

El `orden` va de diez en diez para poder intercalar por SQL.

### 1.2 Siembra: `ON CONFLICT (clave) DO NOTHING`, una sentencia por fila

| Opción | A favor | En contra | Decisión |
|---|---|---|---|
| `VALUES (…) ON CONFLICT (clave) DO NOTHING` | pg-mem ya lo ejecuta con `VALUES` sobre clave primaria (`packages/zoho-sync/src/db/migrate.test.ts:509`) y sobre índice único (`packages/zoho-sync/src/db/migrate.test.ts:666`); Postgres real lo ejecuta con literales (`packages/zoho-sync/src/db/migrate.integration.test.ts:38`) | con literales en pg-mem no está ejecutado: **hipótesis** | **Elegida** |
| `INSERT … SELECT … WHERE NOT EXISTS` | no depende de `ON CONFLICT` | es justo la forma que el repositorio documenta como insegura en pg-mem: «no infiere el tipo de un `INSERT … SELECT $n`» (`apps/desk/server/db/catalogo.ts:157-158`) | Reserva |

La propuesta lo planteaba al revés; la evidencia del repositorio señala a `WHERE NOT EXISTS` como la forma de
riesgo. Si la hipótesis falla, lo dice la primera prueba roja del lote 1 (diez filas tras `migrate`) y se pasa a la
reserva **con literales**, sin parámetros.

Diez sentencias y no una multifila: `migrate` es tolerante por sentencia
(`packages/zoho-sync/src/db/migrate.ts:29-35`), así que una fila mal escrita pierde una fila y no las diez, y
las mutaciones «borrar una fila» y «cambiar una marca» tocan una sola línea.

`DO NOTHING` y no `DO UPDATE`: reaplicar no pisa una etiqueta, un orden ni un `activo` que alguien haya editado.

### 1.3 Cifras nuevas del guardián (calculadas sobre el fichero de hoy)

Recuento hecho sobre las sentencias `ALTER TABLE` y `CREATE TABLE` del fichero: hoy 44 `ALTER` (16 de `public`,
5 de `books`, 23 sin calificar) y 40 tablas.

| Sitio | Hoy | Después |
|---|---|---|
| `packages/zoho-sync/src/db/migrate.ts:73` (`PUBLIC_TABLES`) | 27 nombres | 28: se añade `'catalogo_novedades'` al final de la misma línea |
| `packages/zoho-sync/src/db/migrate.test.ts:282` (título) | «son 40 tablas … 27 de la app» | «son 41 tablas … 28 de la app», más la mención del cambio |
| `packages/zoho-sync/src/db/migrate.test.ts:283` | `[10, 27, 3]` | `[10, 28, 3]` |
| `packages/zoho-sync/src/db/migrate.test.ts:284-286` | `40` las tres | `41` las tres |
| `packages/zoho-sync/src/db/migrate.test.ts:374` (título) | «44 ALTER: 21 calificadas (16 de public + 5 de books) y 23 sin calificar» | «50 ALTER: 27 calificadas (22 de public + 5 de books) y 23 sin calificar», más la mención |
| `packages/zoho-sync/src/db/migrate.test.ts:376` | `44` | `50` |
| `packages/zoho-sync/src/db/migrate.test.ts:377` | `21` | `27` |
| `packages/zoho-sync/src/db/migrate.test.ts:378` | `23` | `23` (no cambia) |
| `packages/zoho-sync/src/db/migrate.test.ts:383` | `tickets`, `equipos`, `contacts` | no cambia |
| `packages/zoho-sync/src/db/migrate.test.ts:385` | seis identidades | siete: se añade `'public.remision_fotos'` |

La narración del cambio va en el título de la prueba, como ya hace el fichero; el comentario de
`packages/zoho-sync/src/db/migrate.test.ts:353-373` no se amplía, para no desplazar nada.

## 2. Módulos

### 2.1 `packages/shared/src/recepcion.ts` (nuevo; se exporta añadiendo una línea al final de `index.ts`)

Puro, sin base ni red. Lo consumen las dos orillas.

```ts
export interface NovedadCatalogo { clave: string; etiqueta: string; orden: number; activo: boolean; excluyeDemas: boolean; exigeTexto: boolean }
export interface NovedadMarcada { clave: string; etiqueta: string }            // la instantánea que guarda la remisión
export const CATEGORIAS_FOTO = ['equipo', 'accesorios', 'embalaje', 'novedad'] as const
export type CategoriaFoto = (typeof CATEGORIAS_FOTO)[number]
export const CATEGORIAS_FOTO_MINIMAS = ['equipo', 'accesorios', 'embalaje'] as const
export const ETIQUETA_CATEGORIA_FOTO: Record<CategoriaFoto, string>            // «del equipo», «de los accesorios»…
export const MOTIVO_FOTO_LEGADO: string                                        // el texto de hoy, letra por letra

export function novedadesActivas(catalogo: readonly NovedadCatalogo[]): NovedadCatalogo[]   // activas, por orden
export interface RecepcionValidada { novedades: NovedadMarcada[]; novedadOtro: string | null; hayNovedad: boolean; observaciones: string }
export function validarRecepcion(
  catalogo: readonly NovedadCatalogo[],
  cuerpo: { novedades: unknown; novedadOtro?: unknown; rotulado?: unknown },
): { ok: true; valor: RecepcionValidada } | { ok: false; error: string }
export function componerObservaciones(catalogo: readonly NovedadCatalogo[], marcadas: readonly NovedadMarcada[], otro: string | null): string

type RemisionRecepcion = { hayNovedad: boolean | null; novedades: NovedadMarcada[] | null; rotuladoAt: string | null }
type FotoClasificada = { categoria?: string | null; novedad?: string | null }
export function fotosQueFaltan(rem: RemisionRecepcion, fotos: readonly FotoClasificada[], catalogo: readonly NovedadCatalogo[]): { categorias: CategoriaFoto[]; novedades: NovedadMarcada[] }
export function motivoNoEnviable(rem: RemisionRecepcion, fotos: readonly FotoClasificada[], catalogo: readonly NovedadCatalogo[]): string | null
export function categoriaDeFoto(
  rem: RemisionRecepcion, cuerpo: { categoria?: unknown; novedad?: unknown },
): { ok: true; categoria: CategoriaFoto | null; novedad: string | null } | { ok: false; error: string }
```

Reglas, en el **orden interno fijo** en que se evalúan:

- `validarRecepcion`: (1) catálogo sin filas activas → «La lista de novedades no está cargada: avisa a un
  administrador.»; (2) no es lista o está vacía → «Marca al menos una novedad, o «Sin novedad».»; (3) claves
  desconocidas o inactivas → «Novedades fuera de la lista: …»; (4) una con `excluyeDemas` junto a otra → ««<etiqueta>»
  no se puede marcar junto con otra novedad.»; (5) una con `exigeTexto` y `novedadOtro` vacío tras recortar →
  ««<etiqueta>» exige describir la novedad.»; (6) `rotulado !== true` → «Confirma que el equipo quedó rotulado y
  guardado.». Duplicados se pliegan; la salida va por `orden`.
- `hayNovedad` = alguna marcada sin `excluyeDemas`. Como (4) impide la convivencia, `hayNovedad === true` implica
  que **todas** las marcadas piden foto; por eso la instantánea sólo guarda clave y etiqueta.
- `componerObservaciones`: etiquetas unidas por `; ` (C2: manda la spec); la que exige texto se escribe «<etiqueta>: <texto>».
- `motivoNoEnviable` (recibe `catalogo`: las marcas se leen por clave aunque la fila esté inactiva, C5): `novedades == null` → legado: `faltaFotoPorNovedad(hayNovedad, fotos.length)` con
  `MOTIVO_FOTO_LEGADO`. Si no: (a) `rotuladoAt` nulo → «Falta confirmar que el equipo quedó rotulado y guardado.»;
  (b) falta alguna categoría mínima → «Faltan fotos obligatorias: …» nombrando **todas** las que faltan; (c) falta
  la foto de alguna novedad → «Falta la foto de cada novedad marcada: …» con todas las etiquetas.
- `categoriaDeFoto` (C3/C4, manda la spec; también en legado): sin categoría → `{ categoria: null, novedad: null }` (201 con NULL). Categoría
  fuera de `CATEGORIAS_FOTO` → error; `novedad` exige que la clave esté en la instantánea de la remisión (en legado, sin instantánea: error).

`packages/shared/src/remision.ts` **no se edita**: `faltaFotoPorNovedad` se importa desde el módulo nuevo.

### 2.2 `apps/desk/server`

| Fichero | Acción | Contenido |
|---|---|---|
| `db/novedades.ts` | nuevo | `listNovedades(db: Queryable): Promise<NovedadCatalogo[]>` — todas las filas de `public.catalogo_novedades`, `ORDER BY orden, clave`. No filtra `activo`: esa regla es de shared |
| `services/recepcion.ts` | nuevo | `resolverRecepcion(db, cuerpo): Promise<null \| { error: string } \| RecepcionValidada>` — `null` si `cuerpo.novedades === undefined` (legado, sin leer la base); si no, lee el catálogo y llama a `validarRecepcion`. Un `novedades: null` explícito cuenta como presente y cae en «lista vacía» |
| `routes/novedades.ts` | nuevo | `registerNovedadesRoutes(app, { db })`: `GET /api/novedades-remision`, `requireAuth`, responde `novedadesActivas(await listNovedades(db))` |
| `app.ts` | en sitio | importación al final de `apps/desk/server/app.ts:22` y registro al final de `apps/desk/server/app.ts:61` |
| `routes/remision.ts` | en sitio | §3 |
| `db/remisiones.ts` | en sitio | §3.5 |

La ruta de lectura va **fuera** de `/api/remisiones/`: registrada bajo ese prefijo, `:id` se la comería
(`apps/desk/server/routes/remision.ts:110`) salvo insertando su registro antes, y eso desplaza líneas.

Tipos compartidos, en sitio, dos líneas: `packages/shared/src/types.ts:622`
(`RemisionFoto` gana `categoria?: string | null; novedad?: string | null`) y `packages/shared/src/types.ts:735`
(`Remision` gana, en la misma línea, `novedades: NovedadMarcada[] | null; novedadOtro: string | null;
rotuladoAt: string | null; rotuladoPor: string | null`). El único constructor de `Remision` es `toRemision`
(`apps/desk/server/db/remisiones.ts:11-27`), así que los campos pueden ser obligatorios.

## 3. Puntos de inserción en `apps/desk/server/routes/remision.ts`

Seis bloques, **0 líneas netas cada uno**. El fichero conserva sus 397 líneas.

| # | Líneas | Hoy | Después | Neto |
|---|---|---|---|---|
| R1 | 4 | importa `faltaFotoPorNovedad` | importa `motivoNoEnviable` y `categoriaDeFoto` en su lugar | 0 |
| R2 | 7 | una importación | se le añaden `; import { resolverRecepcion } from '../services/recepcion'; import { listNovedades } from '../db/novedades'` (C5: R5 pasa el catálogo) | 0 |
| R3 | 158 (hoy vacía) | línea en blanco entre la guarda del serial y el comentario del `409` | la guarda del alta, en una línea | 0 |
| R4 | 249-250 | `observaciones` y `hayNovedad` tomados del cuerpo | derivados cuando hay recepción; del cuerpo cuando no | 0 |
| R5 | 287-291 | comentario, `listFotos`, `if (faltaFotoPorNovedad…)`, el `422` | comentario nuevo, `listFotos` + `motivoNoEnviable`, `if (motivo)`, el `422` con `motivo` | 0 |
| R6 | 380 y 384-387 | `404` sin guardar la fila; `addFoto` en cuatro líneas | `404` guardando `rem`; guarda de categoría en la 384 y `addFoto` en las 385-387 | 0 |

**R3**, la línea 158:

```ts
    const rec = await resolverRecepcion(db, b); if (rec && 'error' in rec) { res.status(422).json({ error: rec.error }); return } // escalón C: tras el serial (A) y antes del 409 (D)
```

**R4**, `apps/desk/server/routes/remision.ts:249-250`: la 249 sigue asignando `observaciones`
(`rec ? rec.observaciones : …lo de hoy…`) y la 250 sigue asignando `hayNovedad` (`rec ? rec.hayNovedad : …lo de
hoy…`) y añade `recepcion: rec ? { novedades: rec.novedades, novedadOtro: rec.novedadOtro, rotuladoPor:
req.user?.name ?? null } : null`. Con recepción presente, lo que el cuerpo traiga en `observaciones`,
`hayNovedad`, `rotuladoPor` o `rotuladoAt` **se ignora**.

**R5**, `apps/desk/server/routes/remision.ts:287-293`: se conserva la forma — la 290 sigue siendo el `if` que
decide y la 291 la que responde `422`; las 292-293 no cambian.

```ts
    // RQ-RE-08, sexta puerta: UNA sola, antes de reclamar. Legado (novedades NULL): la regla anterior, mismo texto.
    // Formulario nuevo, orden interno fijo en shared: rotulado, fotos mínimas, foto por cada novedad.
    const fotos = await listFotos(db, id); const motivo = motivoNoEnviable(rem, fotos, await listNovedades(db))
    if (motivo) {
      res.status(422).json({ error: motivo })
```

**R6**: la 380 pasa a `const rem = await getRemision(db, id); if (!rem) { …404… }`. La 384:

```ts
    const cat = categoriaDeFoto(rem, req.body ?? {}); if (!cat.ok) { res.status(422).json({ error: cat.error }); return }
```

y `addFoto` (385-387) recibe además `categoria: cat.categoria, novedad: cat.novedad`. Los campos de texto del
`multipart` llegan en `req.body` porque la subida usa multer en memoria (`apps/desk/server/util/subida.ts:10-11`).

### 3.1 Citas que se desplazan

**Ninguna.** Medido con `grep`, sin excluir `archive/`: `routes/remision\.ts:[0-9]+` da 182 apariciones en 69
ficheros (cifra de la propuesta), y con neto cero ninguna cambia de línea. Lo que sí cambia es **el texto** de
líneas citadas, y hay que leerlo:

- La línea 158 no la cita nadie (0 apariciones).
- Las líneas 380-387 no las cita nadie (0 apariciones).
- Las líneas 287-293 las citan doce apariciones: la propuesta y la exploración de este cambio, y diez en
  `docs/sdd/Paquete_de_Despliegue_2026-09-27.md`, `…-09-29.md`, `…-09-30.md` y `…-10-01.md` (seis a la 290,
  tres a la 291, una a la 287). Son registros fechados: §10.
- La 250 sigue asignando `hayNovedad` y la 249 `observaciones`: lo que afirman sus citas sigue siendo cierto de
  la vía de legado.

### 3.2 Una guarda de rotulado o dos: **dos**

En el alta, porque no existe ningún acto posterior que confirme el rotulado: sin esa guarda se crearía una fila
que `/enviar` rechazaría para siempre. En `/enviar`, porque es el acto que completa la recepción — lo que la
decisión declara obligatorio — y es la guarda que sobrevive si el supuesto (s1) se revierte a un acto posterior.
Coste de la segunda: una rama dentro de la misma puerta y una prueba que anula `rotulado_at` por SQL.

### 3.3 `apps/desk/server/db/remisiones.ts`, en sitio

- `apps/desk/server/db/remisiones.ts:25`: `toRemision` añade los cuatro campos. `novedades` se lee como
  `incluye` (texto o ya parseado) y un valor nulo en cualquiera de las dos formas da `null`.
- `apps/desk/server/db/remisiones.ts:40`: `CreateRemisionInput` gana `recepcion: { novedades: NovedadMarcada[];
  novedadOtro: string | null; rotuladoPor: string | null } | null`.
- `apps/desk/server/db/remisiones.ts:47-50`: el `INSERT` gana `novedades, novedad_otro, rotulado_at,
  rotulado_por` (`$14`–`$17`), cuatro líneas por cuatro. **`novedades` NO pasa por `J`**
  (`apps/desk/server/db/remisiones.ts:6`): `J(null)` escribe el JSON `null`, que no es `NULL` de SQL, y rompería
  el marcador de legado. Se pasa `JSON.stringify(...)` o `null`. `rotulado_at` es `new Date()` del servidor cuando
  hay recepción, `null` cuando no: nada del cuerpo.
- `apps/desk/server/db/remisiones.ts:189-199`: `addFoto` acepta `categoria` y `novedad` opcionales y los inserta;
  mismo número de líneas.
- `apps/desk/server/db/remisiones.ts:202-211`: `listFotos` selecciona y devuelve las dos columnas.
  `listFotosConContenido` no se toca: es la que alimenta a n8n.

49 apariciones de `db/remisiones\.ts:[0-9]+` en 25 ficheros; neto cero.

## 4. Orden de guardas

### 4.1 Alta (`POST /api/remisiones`)

| Orden | Línea | Guarda | Escalón | Estado |
|---|---|---|---|---|
| 1 | 123, 125 | falta el ticket / no encontrado | A | intacta |
| 2 | 127 | fecha inválida | C | intacta (IV-12, punto 1) |
| 3 | 155 | falta el serial | A | intacta |
| 4 | **158** | **recepción: lista, exclusión, texto, rotulado** | **C** | **nueva** |
| 5 | 177 | remisión pendiente (`409`) | D | intacta |
| 6 | 197 | ítems fuera del checklist | C | intacta |
| 7 | 220 | orden de venta no encontrada, cuarentena, contrato | A y C | intacta (IV-12, punto 2) |
| 8 | 232 | orden de venta ya asociada (`409`) | D | intacta |

La guarda nueva cumple A < C < D frente a sus dos vecinas. No se mueve ninguna existente: IV-12 queda igual.

### 4.2 `/enviar`

| Orden | Línea | Guarda | Escalón | Estado |
|---|---|---|---|---|
| 1 | 276 | no encontrada | A | intacta |
| 2 | 279, 284 | anulada / ya enviada (`409`) | B | intactas |
| 3 | **289-293** | **sexta puerta: legado, o rotulado → mínimas → por novedad** | **C** | **cambia de regla, sigue siendo una** |
| 4 | 297 | `reclamarEnvio` (`409`) | D | intacta |
| 5 | 302, 304 | sin ticket / ticket no encontrado | A | intactas, y detrás de D desde antes: no se tocan |

### 4.3 Subida de foto

404 (línea 380, A) → falta el archivo (382, C) → `415` (383, C) → **categoría (384, C, nueva)**.

### 4.4 Pruebas de posición (regla de mutación 1), cada una con las dos guardas activas

| Par | Prueba | Escenario | Espera | Mutación que la pone roja |
|---|---|---|---|---|
| serial (A) < recepción (C) | PA-1 | ticket de Zoho sin serial **y** `novedades: []` | `422` «Falta el serial» | subir la línea 158 por encima de la 152 |
| recepción (C) < pendiente (D) | PA-2 | remisión pendiente previa, sin `permitirSegunda`, **y** `novedades: []` | `422` de novedades, no `409` | bajar la línea 158 por debajo de la 183 |
| anulada / enviada (B) < puerta (C) | PE-1 | remisión de formulario nuevo sin fotos, anulada; otra, en `ok` | `409` en las dos | subir las 289-293 por encima de la 279 |
| puerta (C) < reclamación (D) | PE-2 | formulario nuevo sin fotos → `422`, sin llamada a n8n, `enviado_at` nulo; se suben y se reenvía **de inmediato** → `200` | éxito al segundo intento | bajar las 289-293 por debajo de la 299: el segundo intento da `409` |
| rotulado < mínimas < por novedad | PE-3 (pura, en shared) | sin rotulado **y** sin fotos → motivo de rotulado; sin la de embalaje **y** sin la de una novedad → motivo de mínimas | el primer motivo del orden | permutar las ramas de `motivoNoEnviable` |
| `415` < categoría | PS-1 | SVG **y** categoría inválida sobre remisión nueva | `415` | subir la línea 384 por encima de la 383 |
| orden interno del alta | PA-3 (pura) | cada par vecino de los seis pasos de `validarRecepcion`, activos a la vez | el primero del orden | permutar dos pasos |

## 5. Pruebas

### 5.1 Ficheros nuevos, en orden rojo → verde

**Lote 1**

- `packages/zoho-sync/src/db/novedadesSiembra.test.ts` (con su `freshDb` local, como
  `packages/zoho-sync/src/db/migrate.test.ts:6-11`):
  1. tras `migrate`, `public.catalogo_novedades` tiene **diez** filas, en este orden de `orden`, con estas
     etiquetas;
  2. sólo `sin_novedad` tiene `excluye_demas` y sólo `otro` tiene `exige_texto`; las diez están activas;
  3. reejecutar las sentencias de siembra extraídas con `schemaStatements()` no lanza y deja diez — la forma de
     `packages/zoho-sync/src/db/migrate.test.ts:438-439`, porque pg-mem no admite reaplicar `migrate` entero
     (`packages/zoho-sync/src/db/migrate.ts:16-17`);
  4. editar una etiqueta y poner `activo = false`, reejecutar la siembra: lo editado se conserva;
  5. las sentencias de siembra son exactamente diez;
  6. las seis columnas existen tras `migrate`, y las sentencias de `schema.sql` que nombran alguna de ellas son
     exactamente las seis `ALTER` (sin relleno).
- `apps/desk/server/recepcion.test.ts`, bloque de lectura: `GET /api/novedades-remision` sin sesión → `401`; con
  sesión → diez en orden; con una fila desactivada por SQL → nueve.

**Lote 2**

- `packages/shared/src/recepcion.test.ts`: los seis rechazos de `validarRecepcion`, PA-3, deduplicado y orden,
  `hayNovedad` en los dos sentidos, `componerObservaciones` (una, varias, con texto, «Sin novedad»).
- `apps/desk/server/recepcion.test.ts`, bloque de alta: los seis `422`; `201` que guarda instantánea,
  `observaciones` compuesta y `hay_novedad` derivado; el cuerpo trae `observaciones`, `hayNovedad: false`,
  `rotuladoPor` y `rotuladoAt` falsos y **no** se guardan; `rotulado_por` es el usuario de la sesión y
  `rotulado_at` cae entre el antes y el después de la petición; alta de legado (sin `novedades`) deja
  `novedades IS NULL` en SQL; **catálogo vacío** (`DELETE` de la tabla) → `422` «no está cargada»; PA-1 y PA-2;
  pruebas de dato D1–D3 (§6).

**Lote 3**

- `packages/shared/src/recepcion.test.ts`: `fotosQueFaltan`, `motivoNoEnviable` (legado con el texto literal,
  PE-3), `categoriaDeFoto`.
- `apps/desk/server/recepcion.test.ts`, bloques de subida y `/enviar`: categoría ausente o inválida → `422`;
  `novedad` con clave no marcada → `422`; legado sin categoría → `201` como hoy; PS-1; PE-1; PE-2; falta la foto
  de **una** de dos novedades → `422` que la nombra; `rotulado_at` anulado por SQL con todas las fotos → `422`
  de rotulado; completo → `200`.
- **Payload hacia n8n**: remisión nueva completa; `Object.keys(cuerpo).sort()` es exactamente la lista de las diez
  claves de `RemisionWebhookPayload` (`apps/desk/server/remisionWebhook.ts:5-24`); las claves de `fotos[0]` son
  `data`, `fileName` y `mimeType`; `observaciones` es la cadena compuesta. Nace verde, como
  `apps/desk/server/fotoNovedad.test.ts:155-156`: su valor lo prueba la mutación M-N1.

**Lote 4**

- `apps/desk/src/lib/recepcionForm.test.ts` (§8).

### 5.2 Pruebas existentes

| Fichero | Qué pasa |
|---|---|
| `packages/zoho-sync/src/db/migrate.test.ts` | cambian las cifras del §1.3, en sitio, en el lote 1. Antes de tocarlas se comprueba que están **rojas** con el esquema nuevo |
| `apps/desk/server/remisiones.test.ts` | **no se edita** y debe seguir verde: ninguna petición suya manda `novedades`. Sus aserciones sobre el cuerpo usan `toMatchObject`, que tolera las claves nuevas; la única igualdad estricta sobre fotos es una lista vacía (`apps/desk/server/remisiones.test.ts:145`). **Hipótesis** hasta ejecutarla |
| `apps/desk/server/fotoNovedad.test.ts` | **no se edita** y debe seguir verde: es la vía de legado entera. **Hipótesis** hasta ejecutarla |
| `packages/shared/src/remision.test.ts`, `apps/desk/src/lib/envioRemision.test.ts` | no se editan |

Las dos hipótesis se comprueban **antes de escribir código** en los lotes 2 y 3, y otra vez al cerrar cada uno.

## 6. Mutaciones que el apply reproduce

| Id | Mutación | Prueba que debe ponerse roja |
|---|---|---|
| M-P1 | línea 158 por encima de la guarda del serial | PA-1 |
| M-P2 | línea 158 por debajo del `409` de pendiente | PA-2 |
| M-P3 | puerta de `/enviar` por encima de anulada | PE-1 |
| M-P4 | puerta de `/enviar` por debajo de `reclamarEnvio` | PE-2 |
| M-P5 | permutar ramas de `motivoNoEnviable` | PE-3 |
| M-P6 | permutar dos pasos de `validarRecepcion` | PA-3 |
| M-P7 | guarda de categoría por encima del `415` | PS-1 |
| M-F1 | quitar `public.` al `CREATE` de la tabla | «toda tabla del esquema está clasificada» (`packages/zoho-sync/src/db/migrate.test.ts:266`). Las funcionales siguen verdes en pg-mem: sólo la caza el guardián |
| M-F2 | quitar `public.` a una `ALTER` de `remision_fotos` | «las ALTER sin calificar son exactamente las de DESK_TABLES» (`packages/zoho-sync/src/db/migrate.test.ts:345`) y el recuento |
| M-F7 | quitar `catalogo_novedades` de `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:73`) | «toda tabla del esquema está clasificada» (hueco de RQ-RE-21) |
| M-F3 | borrar una fila de la siembra | siembra 1 y 5 |
| M-F4 | cambiar una marca (`exige_texto` de `otro`, o `excluye_demas` de `sin_novedad`) | siembra 2 |
| M-F5 | añadir un `UPDATE public.remisiones SET novedades = …` de relleno | siembra 6 |
| M-F6 | quitar `ON CONFLICT (clave) DO NOTHING` a una fila | siembra 3 |
| M-D1 | en shared, decidir por `clave === 'otro'` en vez de `exigeTexto` | D1: con `exige_texto = false` por SQL, «Otro» sin texto debe dar `201`; y con `exige_texto = true` en otra fila, ésa debe exigirlo |
| M-D2 | no filtrar `activo` | D2: fila desactivada por SQL → `422` en el alta y ausente en la lectura |
| M-D3 | decidir por `clave === 'sin_novedad'` en vez de `excluyeDemas` | D3: con `excluye_demas = true` por SQL en otra fila, marcarla junto a otra debe dar `422` |
| M-D4 | devolver una lista constante en vez de leer la tabla | catálogo vacío → `422` |
| M-N1 | añadir `novedades: r.novedades` a `buildRemisionPayload` (`apps/desk/server/remisionWebhook.ts:40-65`) | payload hacia n8n |
| M-L1 | escribir `novedades` con `J` | alta de legado deja `novedades IS NULL` |

Cada una se anota en `apply-progress.md` con su salida roja y se deshace.

## 7. Regla invariable 13, decisión a decisión

Líneas del servidor **tras** el cambio; todas en `apps/desk/server/routes/remision.ts` salvo indicación.

| # | Lo que hace el cliente (`apps/desk/src/components/CrearRemision.tsx`) | Clase | Lo impone el servidor en |
|---|---|---|---|
| 1 | pinta la lista servida, sólo activas | comodidad | línea 158 → paso 3 de `validarRecepcion` |
| 2 | al marcar una excluyente desmarca las demás, y al revés | rellena | línea 158 → paso 4 |
| 3 | no deja crear sin ninguna marcada | bloquea | línea 158 → paso 2 |
| 4 | no deja crear con una que exige texto y el texto vacío | bloquea | línea 158 → paso 5 |
| 5 | no deja crear sin la casilla «Rotulado y guardado» | bloquea | línea 158 → paso 6; y líneas 289-293 |
| 6 | no deja crear sin las tres fotos mínimas ni sin la de cada novedad | bloquea | líneas 289-293, antes de `reclamarEnvio`. En el alta no puede imponerse: las fotos se suben después. La comodidad es legítima porque PE-2 prueba la imposición |
| 7 | esconde «Continuar sin las fotos que faltan» si lo ya subido no cumple | bloquea | líneas 289-293 |
| 8 | etiqueta cada foto con su categoría y, si es de novedad, con su clave | rellena | línea 384 |
| 9 | no manda `observaciones` ni `hayNovedad` | no decide | líneas 249-250: derivados |
| 10 | no manda persona ni hora del rotulado | no decide | líneas 249-250 y `createRemision` |
| 11 | avisa y deshabilita «Crear» si la lista no carga o llega vacía | avisa | línea 158 → paso 1 |

Ninguna decisión queda sólo en el cliente. Los pasos 2-4 los ejecuta el cliente llamando a la **misma**
`validarRecepcion`, no a una reescritura (punto 1 de la regla).

**Lo que se cierra y lo que no.** La obligación de contestar que hoy vive sólo en el cliente
(`apps/desk/src/components/CrearRemision.tsx:97-101`, regla 13 punto 2 declarado) pasa a estar impuesta para el
formulario nuevo. **Sigue abierto**: una petición que omita `novedades` entra por la vía de legado y evita todo lo
nuevo (E-081). Se declara; no se corrige aquí.

## 8. Cliente

### 8.1 `apps/desk/src/lib/recepcionForm.ts` (nuevo, puro, con prueba)

```ts
export interface FotoPlan { file: File; categoria: CategoriaFoto; novedad: string | null }
export interface FotosDelFormulario { equipo: File[]; accesorios: File[]; embalaje: File[]; porNovedad: Record<string, File[]> }
export const FOTOS_VACIAS: FotosDelFormulario
export function alternarNovedad(catalogo: readonly NovedadCatalogo[], marcadas: readonly string[], clave: string): string[]
export function planDeFotos(fotos: FotosDelFormulario, marcadas: readonly NovedadMarcada[]): FotoPlan[]
export function motivoNoCreable(catalogo, cuerpo, plan: readonly FotoPlan[]): string | null
export function puedeContinuarSinPendientes(rem: RemisionRecepcion, plan: readonly FotoPlan[], fotosSubidas: number): boolean
```

- `planDeFotos` aplana a **una lista ordenada** (equipo, accesorios, embalaje, novedades por orden) y descarta las
  fotos de novedades ya desmarcadas.
- `motivoNoCreable` = error de `validarRecepcion`, o si no, el de `motivoNoEnviable` sobre el plan completo.
- `puedeContinuarSinPendientes` = `motivoNoEnviable` sobre el prefijo ya subido es nulo.

Pruebas (`recepcionForm.test.ts`): exclusión en los dos sentidos por marca y no por clave; orden y descarte del
plan; cada motivo; prefijo insuficiente y suficiente. El tipo `File` sólo se usa como tipo: las pruebas pasan
objetos, como ya hace `envioRemision.test.ts`.

### 8.2 `apps/desk/src/lib/envioRemision.ts`: **no se edita**

Su contrato es un índice posicional sobre una lista que no cambia entre intentos
(`apps/desk/src/lib/envioRemision.ts:20-27`), y el plan aplanado es exactamente eso: `totalFotos = plan.length`
y `subirFoto(id, i)` sube `plan[i]` con su categoría. El formulario ya congela los campos una vez creada la
remisión (`apps/desk/src/components/CrearRemision.tsx:130`), así que el plan no cambia. `envioRemision.test.ts`
queda intacto.

### 8.3 `apps/desk/src/api/client.ts`

- `apps/desk/src/api/client.ts:534-535`, en sitio: `CrearRemisionPayload` gana `novedades?: string[];
  novedadOtro?: string; rotulado?: boolean`.
- `apps/desk/src/api/client.ts:554-555`, en sitio: `subirFotoRemision(id, file, meta?: { categoria: string;
  novedad?: string | null })` añade los campos al `FormData` en la misma línea.
- `fetchNovedadesRemision(): Promise<NovedadCatalogo[]>`, **al final del fichero**.

18 apariciones de `api/client\.ts:[0-9]+` en 17 ficheros; neto cero en las líneas existentes.

### 8.4 `apps/desk/src/components/CrearRemision.tsx`

**Cero líneas netas hasta la 270; de la 271 en adelante cambia de tamaño.**

| Líneas | Cambio |
|---|---|
| 3, 5, 7 | importaciones, en sitio |
| 50-52 | `observaciones` y `fotos` → `marcadas`, `otro` y `fotosForm`, en sitio (tres líneas) |
| 59-61 | `hayNovedad` → `rotulado` y la carga de la lista con `useAsync`, en sitio (tres líneas) |
| 78-79, 82 | cuerpo del alta (`novedades`, `novedadOtro`, `rotulado`; sin `observaciones` ni `hayNovedad`) y subida con `plan[i]`, en sitio |
| 97-101 | las dos comprobaciones de hoy → `motivoNoCreable`, cinco líneas por cinco |
| 271-274 | el área de texto → lista de casillas «Novedades» y el campo de texto de la que lo exige |
| 276-290 | la pregunta Sí/No → casilla «Rotulado y guardado» |
| 292-301 | un selector de fotos → uno por categoría y uno por cada novedad marcada |
| 353 | la condición usa `puedeContinuarSinPendientes`, en sitio |

Textos: «Novedades», «Describe la novedad», «Rotulado y guardado: el equipo quedó rotulado con el código del
ticket y guardado», «Registro fotográfico (obligatorio)», «Foto del equipo», «Foto de los accesorios», «Foto del
embalaje», «Foto de: <etiqueta>», «La lista de novedades no se pudo cargar: recarga la página o avisa a un
administrador». Los errores se muestran con el texto que devuelven las funciones compartidas.

«Enviar esa» sobre una remisión pendiente anterior no cambia: si le faltan fotos, el `422` de `/enviar` se ve en
el panel de desenlace, como hoy.

## 9. Lotes de apply

Cada lote: un intento, en el worktree, verde al cerrar. Medida al cierre:
`git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

| Lote | Contenido | Código | Pruebas | Casillas y progreso | Total |
|---|---|---|---|---|---|
| L1 | bloque de `schema.sql` (31), `migrate.ts` (2), cifras de `migrate.test.ts` (14), tipo `NovedadCatalogo` y `novedadesActivas` (20), `db/novedades.ts` (25), `routes/novedades.ts` (18), `app.ts` (4), `index.ts` (1) | 115 | 125 | 50 | **≈ 290** |
| L2 | validación y composición en shared (75), `services/recepcion.ts` (30), alta en `routes/remision.ts` (10), `db/remisiones.ts` alta y lectura (12), `types.ts` (2) | 130 | 240 | 55 | **≈ 425** |
| L3 | predicados de fotos en shared (50), `/enviar` y subida en `routes/remision.ts` (20), `addFoto` y `listFotos` (14), `types.ts` (2) | 86 | 220 | 55 | **≈ 360** |
| L4 | `client.ts` (20), `recepcionForm.ts` (55), `CrearRemision.tsx` (≈ 135, sin pruebas), barrido de citas | 210 | 95 | 40 | **≈ 345** |

**Se confirman los cuatro lotes; las cifras se corrigen** (la propuesta daba ≈ 315, ≈ 390, ≈ 340 y ≈ 295): L2 y
L4 suben, L1 baja. Total ≈ 1.420. El mayor queda a 295 de la válvula de 720. L1 y L2 juntos darían ≈ 715: no se
juntan.

Por qué cada uno queda verde solo: tras L1 la tabla y las columnas existen y nadie las usa; tras L2 el alta
acepta novedades y `/enviar` sigue con la regla anterior, que lee el `hay_novedad` derivado; tras L3 el servidor
está completo y ningún cliente manda `novedades` todavía; L4 enciende el formulario. Nada se publica hasta fusionar
los cuatro.

## 10. Barrido de citas al cierre (regla de mutación 4)

**Comprobación de neto cero**, por fichero: `git diff --numstat <partida>` con inserciones = borrados y `wc -l`
igual que en `f55b7d9`, para `routes/remision.ts`, `db/remisiones.ts`, `types.ts`, `migrate.ts`,
`migrate.test.ts` y `app.ts`. En `schema.sql`, `client.ts` e `index.ts`: borrados = modificados y lo demás al
final. Si alguno falla, barrido completo de su patrón.

**Barrido obligatorio aunque el neto sea cero**, porque cambia el texto de líneas citadas:

| Patrón (sin excluir `archive/`) | Apariciones | Qué se lee |
|---|---|---|
| `routes/remision\.ts:(28[7-9]\|29[0-3])` | 12 | qué afirma cada una de la sexta puerta |
| `CrearRemision\.tsx:[0-9]+` | 49; ocho apuntan a la 271 o más allá | cada una contra el fichero nuevo |
| `migrate\.test\.ts:(28[2-7]\|37[4-9]\|38[0-6])` | las de las cifras | si afirman 40, 27, 44 o 21 como presente |
| abreviadas | — | segundo pase a mano en `openspec/specs/remisiones/spec.md` (25 citas a ficheros de esta lista) y `CLAUDE.md` |

Casos:

- **A · presente** — se apunta a la línea de hoy: las citas vivas de `openspec/specs/remisiones/spec.md` a la
  sexta puerta (las reescribe el delta de la spec) y las de `CLAUDE.md` a `CrearRemision.tsx` (la 204, que no se
  mueve).
- **B · histórico** — se deja o se le nombra la revisión, nunca se renumera: los cuatro
  `docs/sdd/Paquete_de_Despliegue_*.md`, `docs/sdd/ENTRADA.md` (su cita a la línea 273 del formulario describe el
  área de texto que este cambio retira) y la propuesta y la exploración de este cambio, que declaran `f55b7d9`.
- **C · superado** — se conserva y se añade qué lo cerró: la nota de `decision/f1b04-desplegables` sobre el alta
  que guarda `null` sigue siendo cierta de la vía de legado; no se edita `config.yaml` por ello.

**No se toca**: `openspec/changes/archive/2026-09-25-foto-solo-con-novedad/` entero (sus ocho citas al formulario
y sus dos a `types.ts` son registro fechado), ni ningún otro cambio archivado, ni los paquetes de despliegue.

El detector de `pre-push` sólo comprueba que la línea exista y no esté vacía: este barrido es de lectura.

## 11. Despliegue

El servidor sirve el cliente compilado en el mismo puerto: un solo despliegue lleva las tres cosas, y el orden
sale solo.

1. **Migración**, al arrancar. Tolerante por sentencia: un fallo se registra como «sentencia omitida» y no tumba
   el arranque. **Comprobación tras desplegar, antes de dar el cambio por publicado** (lectura, dos consultas):
   diez filas en `public.catalogo_novedades` y las seis columnas en `information_schema.columns`. Si falta una
   columna de `remisiones`, **todo** alta falla, también el de legado, porque el `INSERT` las nombra.
2. **Servidor**: acepta las dos formas de cuerpo.
3. **Cliente**: el paquete nuevo manda `novedades`.

**Cliente viejo en caché**: manda `observaciones` y `hayNovedad`, sin `novedades` → vía de legado, funciona como
hoy, sin rotulado ni fotos mínimas. Desaparece al recargar. El caso inverso — cliente nuevo contra servidor
viejo — perdería las observaciones, y no puede darse con un único despliegue.

**Vuelta atrás**: revertir los commits y redesplegar. Tabla y columnas quedan sin uso. Las remisiones creadas con
el formulario nuevo conservan `observaciones` compuesta y `hay_novedad` derivado, que es lo que lee el código
anterior. Sin `DROP` salvo que Gerencia lo pida. Ningún interruptor nuevo: nada que añadir a `.env.example`.

## 12. Hipótesis sin ejecutar

1. pg-mem acepta `INSERT … VALUES (literales) ON CONFLICT (clave) DO NOTHING` dentro de `migrate`. Reserva: §1.2.
2. pg-mem acepta `ALTER TABLE … ADD COLUMN IF NOT EXISTS … jsonb` sobre `public.remisiones`.
3. `remisiones.test.ts` y `fotoNovedad.test.ts` siguen verdes sin editarse.
4. multer deja en `req.body` los campos de texto enviados junto al fichero, sea cual sea su orden en el formulario.
5. Ninguna ruta existente captura `/api/novedades-remision` antes del registro nuevo.
6. Las estimaciones del §9.
7. La sección M1.2 de la cabecera de la propuesta (heredada: no se remidió el encabezado del maestro).

## 13. Matriz de amenazas

No aplica: el cambio no toca enrutamiento de agentes, órdenes de terminal, subprocesos, automatización de control
de versiones ni clasificación de ejecutables. Añade una ruta HTTP de lectura con sesión y amplía validaciones.

## 14. Preguntas abiertas

Ninguna bloquea. Las cinco de la propuesta siguen en pie y el diseño construye la lectura más estricta de cada
una; revertir cualquiera es un cambio de dato o de una rama en `packages/shared/src/recepcion.ts`.
