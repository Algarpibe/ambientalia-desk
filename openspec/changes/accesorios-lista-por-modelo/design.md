# Diseño — Accesorios de la remisión de entrada: lista del modelo con nombre oficial y SKU, sin texto libre (F1B-04, `cierra: no`)

Propuesta: `openspec/changes/accesorios-lista-por-modelo/proposal.md` (S-1 a S-10 tomados; S-9 aceptado; no se reabren).
Toda cita de este documento es a un fichero que existe y fue leído en este worktree. Los ficheros nuevos se nombran sin
línea, y una línea **prevista** se nombra en prosa («la línea 220 de ese fichero»), nunca con forma de cita.
Este diseño supera a propósito el tope de 800 palabras de la skill: el encargo pide nueve decisiones con firma exacta.

## 1. Enfoque técnico

La regla («un accesorio exige artículo de Books») es un módulo puro nuevo de `packages/shared`; el servidor la impone en
tres puntos del catálogo y en una ruta nueva del Director Técnico, y el cliente la consume. La función de escritura
`crearArticulo` (`apps/desk/server/db/catalogoArticulos.ts:68`) **no gana guarda**: la usan el legado, la migración de
accesorios y decenas de pruebas, y la regla es de las puertas HTTP, no del acceso a datos. Ningún fichero muy citado
gana ni pierde líneas: todo lo que se modifica se edita **sobre la línea que ya existe**; lo nuevo va en ficheros nuevos
o al final.

## 2. Decisiones de arquitectura

| # | Decisión | Alternativas descartadas | Por qué |
|---|---|---|---|
| DD-1 | Un predicado núcleo (`accesorioSinBooks`) y dos funciones `motivo…` que devuelven `string \| null` | Tres predicados independientes | Una sola noción, tres consumidores (alta, `PATCH`, copia): tres implementaciones serían el molde de H5. Las `motivo…` siguen el molde ya en uso en `apps/desk/server/routes/remision.ts:4` |
| DD-2 | La guarda vive en las rutas, no en `crearArticulo` | Lanzar desde `crearArticulo` | `apps/desk/server/db/materializarAccesorios.ts:91` y las pruebas de `apps/desk/server/db/` la llaman con y sin `itemId`; cerrarla ahí rompería el legado que la propuesta manda conservar |
| DD-3 | El detalle del checklist lo devuelve la **misma** llamada `checklistDeRemision`, como campo aditivo `detalle` | Segunda función que relea la lista | Dos lecturas de la misma lista pueden divergir; así `remision.ts` sólo cambia una línea |
| DD-4 | El tipo `ItemChecklist` vive en el módulo nuevo; `RemisionNueva` lo referencia en la **misma** línea con `import('./accesoriosLista').ItemChecklist[]` | Añadir un `import` arriba de `types.ts` (desplaza las 773 líneas); tipo estructural repetido en `types.ts` | No inserta líneas. **Hipótesis:** el lint lo admite (no se encontró regla que lo prohíba). Si lo rechaza, respaldo: literal `{ nombre: string; sku: string \| null }[]` en esa línea, más una prueba de asignabilidad mutua con `ItemChecklist` |
| DD-5 | `incluyeDetalle` es **obligatorio** en `RemisionNueva` | Opcional | `payload: RemisionNueva` (`apps/desk/server/routes/remision.ts:59`) convierte el olvido en error de compilación |
| DD-6 | La copia añade un campo **aditivo** `sinBooks` a su respuesta; `omitidos` conserva su significado (choque de nombre) | Sumar los excluidos a `omitidos` | El aviso de la pantalla dice «N ya estaban» (`apps/desk/src/components/CatalogoEquipos.tsx:638`): sumarlos ahí mentiría |
| DD-7 | `PATCH` de un id inexistente sigue respondiendo `200` sin escribir | Introducir `404` | El encargo prohíbe cambiar el comportamiento de los demás casos; la lectura por id sólo decide si hay algo que proteger |
| DD-8 | Ruta del Director Técnico: `POST /api/catalogo/modelos/:id/accesorios`, en fichero nuevo | Abrir `requireSuperAdmin` de `apps/desk/server/routes/catalogo.ts:213` con una excepción | Una puerta con una sola regla de permiso se puede probar por pares; no toca el fichero citado |
| DD-9 | La novedad se siembra al final de `schema.sql`, no junto a las diez | Insertarla tras `packages/zoho-sync/src/db/schema.sql:699` | Desplazaría 66 líneas de un fichero citado línea a línea |
| DD-10 | `openspec/config.yaml` y `docs/sdd/ENTRADA.md` **no se tocan** | Lote 5 de la propuesta | No hay capacidad nueva (R-2 no aplica) y `ENTRADA.md` tiene cambios sin commitear en `main`. Lo que iría ahí va al `archive-report.md` y a una sección al final de `DEPLOY.md` |

## 3. D1 — `packages/shared/src/accesoriosLista.ts` (nuevo)

Exportado con una línea nueva al final de `packages/shared/src/index.ts` (hoy acaba en `packages/shared/src/index.ts:38`):
`export * from './accesoriosLista'`.

```ts
import { CLASES_ARTICULO, type ClaseArticulo } from './types'
import type { SujetoDePermiso } from './cargos'
import { puedeMantenerNovedades } from './mantenimientoNovedades'

export const CLASE_ACCESORIO: ClaseArticulo = 'accesorio'
/** Las clases que siguen admitiendo un artículo escrito a mano. La pantalla la consume para su desplegable. */
export const CLASES_TEXTO_LIBRE: readonly ClaseArticulo[]            // CLASES_ARTICULO sin CLASE_ACCESORIO

export const MENSAJES_ACCESORIOS = {
  exigeBooks: 'Un accesorio tiene que ser un artículo de Zoho Books: búscalo y elígelo de la lista',
  cambioSinBooks: 'Este artículo no viene de Zoho Books y no puede pasar a accesorio',
  modelo: 'Modelo no encontrado',
  permiso: 'Añadir accesorios a la lista de un modelo requiere el área Servicio Técnico y el cargo Director Técnico',
  faltaArticulo: 'Falta el artículo',
  noEnBooks: 'Artículo no encontrado en Zoho Books',
}

/** Núcleo: clase `accesorio` Y sin artículo de Books. «Sin» es falsy, el mismo criterio con que la ruta del catálogo decide su rama de Books. */
export function accesorioSinBooks(clase: ClaseArticulo, itemId: string | null | undefined): boolean
/** Alta: `MENSAJES_ACCESORIOS.exigeBooks` o `null`. */
export function motivoAltaAccesorio(clase: ClaseArticulo, itemId: string | null | undefined): string | null
/** Cambio de clase: `cambioSinBooks` sólo si la clase NUEVA es accesorio, la ACTUAL no lo es y no hay `itemId`. */
export function motivoCambioAAccesorio(actual: { clase: ClaseArticulo; itemId?: string | null }, claseNueva: ClaseArticulo): string | null
/** Permiso del Director Técnico. Devuelve `puedeMantenerNovedades(s)` tal cual: no repite su lógica. */
export function puedeAnadirAccesorios(s: SujetoDePermiso): boolean

export type CuerpoAccesorio = { ok: true; itemId: string } | { ok: false; error: string }
/** Cuerpo de la ruta del DT. Un solo error: `faltaArticulo` si no es objeto o `itemId` no es cadena no vacía tras recortar. */
export function accesorioDelCuerpo(v: unknown): CuerpoAccesorio

export interface ItemChecklist { nombre: string; sku: string | null }
/** Accesorios de la lista del modelo → detalle. Deduplica por nombre exacto; gana la primera aparición. */
export function detalleDeAccesorios(articulos: readonly { clase: ClaseArticulo; nombre: string; sku?: string | null }[]): ItemChecklist[]
/** Lista por perfil → detalle sin SKU, deduplicada igual. */
export function detalleSinSku(items: readonly string[]): ItemChecklist[]
```

Notas de contrato:

- `motivoCambioAAccesorio` devuelve `null` cuando la fila **ya es** accesorio: una fila de legado se puede desactivar con
  un `PATCH` que repita su clase (propuesta, tabla de compatibilidad).
- `accesorioDelCuerpo` **ignora** `clase`, `nombre` y `sku` del cuerpo; no los rechaza. Mismo criterio que la prueba de
  `apps/desk/server/catalogo.test.ts:77`. El molde es `packages/shared/src/reasignacion.ts:39-47`; aquí el orden fijo
  tiene un solo paso propio, y el segundo (existe en Books) necesita la base y es de la ruta.
- `MENSAJES_ACCESORIOS.modelo`, `.faltaArticulo` y `.noEnBooks` repiten a propósito los literales de
  `apps/desk/server/routes/catalogo.ts:215`, `apps/desk/server/routes/catalogo.ts:196` y
  `apps/desk/server/routes/catalogo.ts:227`, que no se tocan. El criterio «sin artículo» es el de
  `apps/desk/server/routes/catalogo.ts:225`.
- Consume `packages/shared/src/mantenimientoNovedades.ts:15-18`, `packages/shared/src/cargos.ts:37` y
  `packages/shared/src/types.ts:239-240`.

## 4. D2 — Detalle aditivo del checklist

`apps/desk/server/db/checklistRemision.ts` se queda en 43 líneas. Cuatro líneas cambian en sitio:

| Línea | Hoy | Queda |
|---|---|---|
| `apps/desk/server/db/checklistRemision.ts:2` | `import { listarArticulosDeModelo } from './catalogoArticulos'` | la misma, seguida de `; import { detalleDeAccesorios, detalleSinSku, type ItemChecklist } from '@ambientalia/shared'` |
| `apps/desk/server/db/checklistRemision.ts:13` | `origen: 'modelo' \| 'perfil'` | `origen: 'modelo' \| 'perfil'; detalle: ItemChecklist[]` |
| `apps/desk/server/db/checklistRemision.ts:36` | `return { items: await getChecklist(db, opts.perfil), origen: 'perfil' }` | `const items = await getChecklist(db, opts.perfil); return { items, origen: 'perfil', detalle: detalleSinSku(items) }` |
| `apps/desk/server/db/checklistRemision.ts:41` | `origen: 'modelo',` | `origen: 'modelo', detalle: detalleDeAccesorios(articulos),` |

`apps/desk/server/db/checklistRemision.ts:40` (`items`) **no se toca**: `items` sigue siendo exactamente lo de hoy, sin
deduplicar. Hay así dos filtros de «accesorio» (esa línea y `detalleDeAccesorios`); los enfrenta una prueba de
invariante: en todos los casos, los nombres de `detalle` son los de `items` sin repetidos y en el mismo orden.

`GET /api/remisiones/nueva`: cambia **una** línea, `apps/desk/server/routes/remision.ts:68`, que pasa de
`incluye: checklist.items,` a `incluye: checklist.items, incluyeDetalle: checklist.detalle,`. La
`apps/desk/server/routes/remision.ts:58` no cambia (la propuesta la nombraba; no hace falta).
`apps/desk/server/routes/remision.ts:194-197` no cambia: sigue validando contra `.items`.

`packages/shared/src/types.ts:759` pasa de `incluye: string[]` a
`incluye: string[]; incluyeDetalle: import('./accesoriosLista').ItemChecklist[]` (DD-4, DD-5). Sin líneas nuevas.

El SKU no se guarda en la remisión ni viaja a n8n (S-8): `apps/desk/server/remisionWebhook.ts:46` no se toca.

## 5. D3 — Cierre en `apps/desk/server/routes/catalogo.ts` (380 líneas antes y después)

| Línea | Cambio en sitio |
|---|---|
| `apps/desk/server/routes/catalogo.ts:10` | se añade `getArticuloManual` a la lista importada |
| `apps/desk/server/routes/catalogo.ts:12` | se añaden `motivoAltaAccesorio, motivoCambioAAccesorio` |
| la línea 220 de ese fichero, hoy vacía (entre la guarda de clase y el comentario del `itemId`) | `{ const sinBooks = motivoAltaAccesorio(clase, b.itemId ? String(b.itemId) : null); if (sinBooks) { res.status(422).json({ error: sinBooks }); return } }` |
| `apps/desk/server/routes/catalogo.ts:294` | `patch.clase = clase; const actual = await getArticuloManual(db, String(req.params.id)); const sinBooks = actual ? motivoCambioAAccesorio(actual, clase) : null; if (sinBooks) { res.status(422).json({ error: sinBooks }); return }` |

**Alta.** La guarda queda tras «Modelo no encontrado» (`apps/desk/server/routes/catalogo.ts:215`, A) y «Clase de artículo
desconocida» (`apps/desk/server/routes/catalogo.ts:219`), antes de «El nombre es obligatorio»
(`apps/desk/server/routes/catalogo.ts:231`) y del `409` (`apps/desk/server/routes/catalogo.ts:238`). Con `itemId`
presente no dispara, así que su orden frente a «Artículo no encontrado en Zoho Books» no es observable.

**`PATCH`.** La lectura sólo ocurre cuando el cuerpo trae `clase`. Id inexistente: `actual` es `null`, no hay motivo, y
la ruta sigue hasta `actualizarArticulo` y responde `200` como hoy (DD-7). La guarda va antes de la escritura
(`apps/desk/server/routes/catalogo.ts:298`).

**Lectura por id**, al final de `apps/desk/server/db/catalogoArticulos.ts` (hoy acaba en
`apps/desk/server/db/catalogoArticulos.ts:358`):

```ts
/** Un artículo MANUAL por su id, o `null`. Los derivados no viven en esta tabla. */
export async function getArticuloManual(db: Queryable, id: string): Promise<ArticuloModelo | null>
//   SELECT id, clase, item_id, sku, nombre, orden, activo FROM catalogo_articulos WHERE id = $1  → aArticulo
```

**Copia** (`copiarArticulos`), en sitio:

| Línea | Queda |
|---|---|
| `apps/desk/server/db/catalogoArticulos.ts:3` | `import { accesorioSinBooks, type ArticuloModelo, type CategoriaModelo, type ClaseArticulo } from '@ambientalia/shared'` |
| `apps/desk/server/db/catalogoArticulos.ts:165` | el tipo de retorno gana `sinBooks: number` |
| `apps/desk/server/db/catalogoArticulos.ts:166` | `const todos = (…).filter((a) => a.clase === clase); const fuente = todos.filter((a) => !accesorioSinBooks(clase, a.itemId))` |
| `apps/desk/server/db/catalogoArticulos.ts:190` | `return { copiados, omitidos, porModelo, sinBooks: todos.length - fuente.length }` |

`sinBooks` cuenta artículos del **origen** excluidos, una vez cada uno, sin multiplicar por destinos; vale `0` en las
demás clases. La ruta (`apps/desk/server/routes/catalogo.ts:265`) lo devuelve sin tocarse.

**Citas `catalogo.ts:NNN` vivas** (fuera de `openspec/changes/`): ninguna se desplaza, porque no se inserta ninguna
línea. Para el barrido de la regla de mutación 4, las que apuntan a líneas cuyo **contenido** cambia o cuya afirmación
toca esta tanda: `openspec/config.yaml:4036`, `openspec/config.yaml:4050` y `openspec/config.yaml:4054` (afirman el
estado de partida: caso B o C, se anota qué lo cerró en el `archive-report.md`, no se reescriben aquí).
`openspec/config.yaml:4046`, `openspec/config.yaml:193`, `openspec/config.yaml:197` y las dos de
`docs/sdd/ENTRADA.md` no se ven afectadas. La mención de `apps/desk/server/db/equipos.ts:394` es a `db/catalogo.ts`,
otro fichero.

## 6. D4 — Ruta del Director Técnico

Fichero nuevo `apps/desk/server/routes/accesoriosModelo.ts`:

```ts
export function registerAccesoriosModeloRoutes(app: Express, deps: { db: Queryable }): void
// POST /api/catalogo/modelos/:id/accesorios   — requireAuth(db); SIN requireSuperAdmin
```

| Paso | Escalón | Condición | Respuesta |
|---|---|---|---|
| 1 | A | `!(await getModelo(db, modeloId))` | `404` `MENSAJES_ACCESORIOS.modelo` |
| 2 | B | `!puedeAnadirAccesorios(req.user!)` | `403` `MENSAJES_ACCESORIOS.permiso` |
| 3 | C | `accesorioDelCuerpo(req.body)` no `ok` | `422` `MENSAJES_ACCESORIOS.faltaArticulo` |
| 4 | C | `getArticuloPorId(db, cuerpo.itemId)` es `null` (`packages/zoho-sync/src/books/repo.ts:60-63`) | `422` `MENSAJES_ACCESORIOS.noEnBooks` |
| 5 | D | `crearArticulo(db, modeloId, { clase: CLASE_ACCESORIO, itemId: art.id, sku: art.sku \|\| null, nombre: art.nombre })` lanza `ArticuloRepetido` | `409` con `e.message` |
| — | — | éxito | `201` `{ id }` |

La clase la fija el servidor; nombre y SKU salen de Books. Reutiliza `crearArticulo` y `getModelo`, sin copiar nada de
`catalogo.ts`. Molde: `apps/desk/server/routes/novedades.ts:39-48` y `apps/desk/server/routes/reasignacion.ts:23-43`.

Registro en `apps/desk/server/app.ts`, en sitio: el `import` se añade al final de `apps/desk/server/app.ts:22` y la
llamada `registerAccesoriosModeloRoutes(app, { db })` al final de `apps/desk/server/app.ts:61`. No choca con ninguna
ruta: `POST …/modelos/:id/articulos` es otro literal y el `DELETE /api/catalogo/:entidad/:id` es otro método.

La lectura que necesita la pantalla ya pide sólo sesión: catálogo (`apps/desk/server/routes/catalogo.ts:58`), lista del
modelo (`apps/desk/server/routes/catalogo.ts:153-157`) y buscador (`apps/desk/server/routes/directory.ts:33-35`).

## 7. D5 — Siembra de `accesorio_fuera_de_lista`

Las diez existentes (`packages/zoho-sync/src/db/schema.sql:690-699`) llevan las columnas
`(clave, etiqueta, orden, excluye_demas, exige_texto)` y órdenes de 10 en 10. Al final del fichero, tras
`packages/zoho-sync/src/db/schema.sql:765`:

```sql
-- accesorios-lista-por-modelo (F1B-04): un accesorio que llega y no esta en la lista del modelo se anota como novedad, con texto
-- Orden 65, tras falta_accesorio, sin renumerar. AL FINAL para no desplazar citas. CALIFICADA public. Se retira con activo = false
INSERT INTO public.catalogo_novedades (clave, etiqueta, orden, excluye_demas, exige_texto) VALUES ('accesorio_fuera_de_lista', 'Accesorio fuera de lista', 65, false, true) ON CONFLICT (clave) DO NOTHING;
```

Comentarios sin punto y coma (el troceo es por `;`, `packages/zoho-sync/src/db/migrate.ts:19-20`) y sin tildes.

**Guardianes que vigilan ese fichero y se mueven** (todos en sitio, mismo número de líneas):

| Dónde | Hoy | Queda |
|---|---|---|
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts:27` | fila `falta_accesorio` de `LISTA` | la misma línea gana detrás `['accesorio_fuera_de_lista', 'Accesorio fuera de lista', 65],` |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts:40`, `:46`, `:55`, `:78` | títulos con «diez» | «once» |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts:49`, `:71`, `:80` | `toHaveLength(10)` | `toHaveLength(11)` |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts:52` | `['otro']` | `['accesorio_fuera_de_lista', 'otro']` y título de `:46` acorde |
| `packages/zoho-sync/src/db/novedadesSiembra.test.ts:61` | `toBe(10)` | `toBe(11)` |
| `packages/zoho-sync/src/db/migrate.test.ts:652` | suma `… + 3 + 2` | `… + 3 + 2 + 1`, con su etiqueta en el mensaje |
| `packages/zoho-sync/src/db/migrate.test.ts:794-798` | `reasignaciones` es penúltima y su índice la última (`l.length - 2`, `l.length - 1`) | antepenúltima y penúltima (`- 3`, `- 2`); el título lo dice y nombra la siembra nueva como última |
| `apps/desk/server/recepcion.test.ts:14` | `ETIQUETAS` | gana `'Accesorio fuera de lista'` tras `'Falta un accesorio'`, en la misma línea |
| `apps/desk/server/recepcion.test.ts:25` | «las diez» | «las once» |
| `apps/desk/server/recepcion.test.ts:32` | `r.body[9]` | `r.body[10]` |
| `apps/desk/server/recepcion.test.ts:36`, `:42` | «quedan nueve», `toHaveLength(9)` | «quedan diez», `toHaveLength(10)` |
| `DEPLOY.md:241`, `DEPLOY.md:256` | «diez filas», «menos de diez» | «once» |
| `DEPLOY.md:261` | «la lista de diez» | «la lista (las diez de la recepción más «Accesorio fuera de lista»)» |

**No se toca** `apps/desk/server/recepcion.test.ts:419`: sus «diez claves» son las del payload a n8n, no novedades.
`openspec/specs/remisiones/spec.md:859` y `openspec/specs/remisiones/spec.md:875-884` (RQ-RE-21, «diez») son de la spec
viva: los mueve el delta de `sdd-spec` al archivar, no `apply`.

Las dos pruebas de `migrate.test.ts` **no las nombraba la propuesta**; sin moverlas, añadir al final deja la suite roja.

## 8. D6 — Cliente

| Fichero | Cambio |
|---|---|
| `apps/desk/src/components/AccesoriosModeloPanel.tsx` (nuevo) | `export function AccesoriosModeloPanel({ onVolver }: { onVolver: () => void })`. Molde `apps/desk/src/components/NovedadesPanel.tsx:17-20`: `puede = !!user && puedeAnadirAccesorios(user)`. Elige modelo (`getCatalogo`, `apps/desk/src/api/client.ts:317`), enseña sus accesorios activos con SKU (`getArticulosModelo`), busca en Books (`buscarArticulos`) y añade. No tiene campo de nombre ni de clase, ni botones de retirar o reordenar (S-3) |
| `apps/desk/src/components/Configuracion.tsx:2`, `:33`, `:127`, `:165` | en sitio: `import`, `'accesorios'` en la unión de `section`, entrada «Accesorios por modelo» junto a la de novedades, y su `if (section === 'accesorios') return …`. La entrada de `apps/desk/src/components/Configuracion.tsx:100` no se toca |
| `apps/desk/src/components/CrearRemision.tsx:261`, `:264` | itera `data.incluyeDetalle` (`{ nombre: item, sku }`) y pinta `{item}` más el SKU en gris cuando lo hay. La clave y `marcados[item]` siguen siendo el nombre: lo que se envía no cambia |
| `apps/desk/src/components/CrearRemision.tsx:245-248` | el aviso de lista vacía se reescribe en las mismas cuatro líneas: la completa el Director Técnico en Configuración → Accesorios por modelo; lo que llegue sin estar en la lista se anota como novedad |
| `apps/desk/src/components/CatalogoEquipos.tsx:3`, `:561`, `:1018` | en sitio: importa `CLASES_TEXTO_LIBRE`; el valor inicial pasa a `'consumible_repuesto'`; el desplegable itera `CLASES_TEXTO_LIBRE` |
| `apps/desk/src/components/CatalogoEquipos.tsx:638-639` | el aviso de la copia añade «, N sin artículo de Books no se copiaron» cuando `r.sinBooks > 0` |
| `apps/desk/src/api/client.ts:590` | el tipo de la respuesta gana `sinBooks: number` |
| final de `apps/desk/src/api/client.ts` (hoy `apps/desk/src/api/client.ts:871`) | `export function anadirAccesorioModelo(modeloId: string, itemId: string): Promise<{ id: string }>` |

### Regla 13 — decisión del cliente → línea del servidor

| # | Decisión del cliente | Servidor |
|---|---|---|
| 1 | Sólo se marcan accesorios de la lista; no hay campo para escribir uno | `apps/desk/server/routes/remision.ts:194-197` (existe, probada) |
| 2 | Pinta nombre y SKU | No decide: llegan de `apps/desk/server/routes/remision.ts:68` (**prevista**: la misma línea, con el campo nuevo) |
| 3 | El fuera de lista se marca como novedad y exige texto | `apps/desk/server/routes/remision.ts:158`, con `packages/shared/src/recepcion.ts:97-99` (existen) |
| 4 | «Añadir a mano» no ofrece la clase accesorio | **Prevista:** la línea 220 de `apps/desk/server/routes/catalogo.ts` |
| 5 | La pantalla del catálogo no ofrece cambiar de clase (`apps/desk/src/components/CatalogoEquipos.tsx:671-673`) | **Prevista:** `apps/desk/server/routes/catalogo.ts:294`, en sitio |
| 6 | El aviso de la copia cuenta los no copiados | No decide: **prevista** `apps/desk/server/db/catalogoArticulos.ts:166` |
| 7 | El panel sólo enseña controles a quien puede | **Prevista:** paso 2 (`403`) de `apps/desk/server/routes/accesoriosModelo.ts` |
| 8 | El panel sólo ofrece artículos de Books y no pide clase | **Prevista:** pasos 3 a 5 del mismo fichero (artículo obligatorio, existe en Books, clase fijada) |
| 9 | El panel no ofrece lo que ya está en la lista | `apps/desk/server/db/catalogoArticulos.ts:74`, traducido a `409` en el paso 5 (**prevista**) |

Las filas «prevista» se cierran en `tasks.md` con la línea real tras cada lote. Los `.tsx` quedan fuera de la red de
pruebas (F0-00): se verifican en la aplicación.

## 9. D7 — Pruebas (strict TDD: rojo antes que verde)

**Ficheros nuevos** (nada se inserta en mitad de un fichero de pruebas existente):

| Fichero | Cubre |
|---|---|
| `packages/shared/src/accesoriosLista.test.ts` | los tres predicados (tabla de casos por clase × `itemId`), `puedeAnadirAccesorios` igual a `puedeMantenerNovedades` sobre una matriz de sujetos, `accesorioDelCuerpo`, deduplicado de los dos `detalle…`, `CLASES_TEXTO_LIBRE` |
| `apps/desk/server/accesoriosCatalogo.test.ts` | alta, `PATCH` y copia por HTTP; posición; legado |
| `apps/desk/server/accesoriosRemision.test.ts` | `incluyeDetalle` en `GET /api/remisiones/nueva`; invariante `items`↔`detalle`; novedad sembrada exige texto por el alta de remisión; las cuatro pruebas de compatibilidad |
| `apps/desk/server/accesoriosModelo.test.ts` | ruta del Director Técnico |

**Arnés.** `instalarArnes`, `appWith`, `adminCookie` y `userCookie(areas, cargoPermiso)` de
`apps/desk/server/testing/appHarness.ts:91-95`. Sujetos, con el molde de
`apps/desk/server/novedadesMantenimiento.test.ts:12-13`: Director Técnico (`['Servicio Técnico']`, `'Director Técnico'`),
técnico sin el cargo, y Director Técnico con otra área (`['Comercial']`). `userCookie` fija el correo `op@x.co`: una
prueba que necesite **dos** sujetos no administradores crea el segundo con `createRole`/`createUser`/`createSession` en
un helper local del fichero, sin tocar el arnés.

**Pruebas de posición, par a par, con las dos guardas activas a la vez:**

| Puerta | Par | Caso | Esperado |
|---|---|---|---|
| Alta del catálogo | A ↔ C nueva | modelo inexistente + accesorio sin `itemId` | `404` |
| Alta del catálogo | permiso ↔ C nueva | sujeto no administrador + accesorio sin `itemId` | `403` |
| Alta del catálogo | C nueva ↔ «El nombre es obligatorio» | accesorio sin `itemId` y nombre en blanco | `422` con `exigeBooks` |
| Alta del catálogo | C nueva ↔ `409` | accesorio sin `itemId` cuyo nombre ya existe (fila de legado sembrada por SQL) | `422`, no `409` |
| `PATCH` | C nueva ↔ escritura | `{ clase: 'accesorio', activo: false }` sobre un consumible sin `itemId` | `422` y la fila conserva clase y `activo` |
| Ruta del DT | A ↔ B | modelo inexistente + técnico sin cargo | `404` |
| Ruta del DT | A ↔ C | modelo inexistente + cuerpo vacío | `404` |
| Ruta del DT | B ↔ C (falta) | técnico sin cargo + cuerpo vacío | `403` |
| Ruta del DT | B ↔ C (no en Books) | técnico sin cargo + `itemId` inexistente | `403` |
| Ruta del DT | B ↔ D | técnico sin cargo + artículo ya en la lista | `403`, sin fila nueva |

**Pares que no se pueden activar a la vez**, y se declara en vez de fingir la prueba: «Clase desconocida» ↔ guarda de
accesorio (la clase no puede ser desconocida y `accesorio`); en la ruta del DT, C(falta) ↔ C(no en Books) y C ↔ D (el
`409` necesita el nombre que da Books). Su orden lo fija la dependencia de datos, no una convención.

**Compatibilidad** (las cuatro de la propuesta):

1. Una remisión guardada con un `incluye` que hoy no está en ninguna lista se lee por `GET /api/remisiones/:id` y se
   envía sin error. **Hipótesis:** el molde del doble de n8n es el `conN8n` de `apps/desk/server/recepcion.test.ts`,
   local a ese fichero; se copia al nuevo.
2. Una fila `item_id NULL` de clase `accesorio` (sembrada por SQL) sale en `incluye` y en `incluyeDetalle` con
   `sku: null`, y el alta de remisión que la marca responde `201`.
3. Un ticket sin equipo recibe la lista del perfil igual que antes, con `origen: 'perfil'` y detalle sin SKU.
4. El payload a n8n conserva sus claves y no lleva `incluyeDetalle` ni SKU.

**Pruebas existentes que cambian de expectativa por contrato** (se editan en sitio, después del rojo de las nuevas):

| Dónde | Por qué | Queda |
|---|---|---|
| `apps/desk/server/catalogo.test.ts:151`, `:154`, `:166`, `:168-169`, `:200` | daban de alta un accesorio de texto libre y esperaban `201`/`409` | la clase pasa a `consumible_repuesto`: siguen probando el texto libre, que sigue abierto para esa clase |
| `apps/desk/server/db/catalogoArticulos.test.ts:166-179` | copiaba «Manuales» sin `itemId` | espera `{ copiados: 2, omitidos: 0, sinBooks: 1 }` y sólo «Slides» en los destinos |
| `apps/desk/server/db/catalogoArticulos.test.ts:183-184`, `:193`, `:201`, `:217` | sus accesorios de origen no tenían `itemId` | ganan `itemId` y `sku` en la misma línea; cada prueba sigue afirmando lo suyo |
| `apps/desk/server/db/checklistRemision.test.ts:28-29`, `:57-58`, `:67-68` | `toEqual` exacto sobre `{ items, origen }` | ganan `detalle` |

`apps/desk/server/catalogo.test.ts:180` (pasar a accesorio un consumible **con** `itemId`) y
`apps/desk/server/catalogo.test.ts:199` siguen verdes sin tocarse.

**Mutaciones previstas** (cada una tiene que poner algo rojo; si no, falta una prueba):

| # | Mutación | La caza |
|---|---|---|
| M1 | Mover la guarda del alta detrás de la rama del nombre, y detrás del `try` | par C ↔ nombre, par C ↔ `409` |
| M2 | Mover la guarda del `PATCH` detrás de `actualizarArticulo` | par C ↔ escritura |
| M3 | `motivoCambioAAccesorio` sin mirar la clase actual | legado: desactivar repitiendo la clase responde `200` |
| M4 | Quitar el filtro de la copia | prueba de la copia y `sinBooks` |
| M5 | Ruta del DT: permutar los pasos 1 y 2; 2 y 3; 2 y 4 | los cinco pares de la ruta |
| M6 | Permiso abierto a cualquier área (sólo cargo) y a cualquier cargo (sólo área) | DT con área Comercial → `403`; técnico de Servicio Técnico → `403` |
| M7 | Clase y nombre tomados del cuerpo | el cuerpo manda `clase: 'consumible_repuesto'` y un nombre inventado; la fila queda `accesorio` con el nombre de Books |
| M8 | Fichero vigilado `schema.sql`: borrar la fila nueva; quitarle `ON CONFLICT`; poner `exige_texto` en `false`; quitarle `public.` | pruebas 1, 2, 3 y 5 de `packages/zoho-sync/src/db/novedadesSiembra.test.ts` y la de `packages/zoho-sync/src/db/migrate.test.ts:652` |
| M9 | Quitar el deduplicado o tomar el SKU de otro campo en `detalleDeAccesorios` | unitaria de shared e invariante `items`↔`detalle` |
| M10 | Quitar `incluyeDetalle` de la respuesta | error de tipos (DD-5) y prueba del `GET` |

## 10. D8 — Consulta de sólo lectura

Fichero nuevo `docs/sdd/Consulta_Modelos_Sin_Accesorios_2026-10-07.sql`, con el envoltorio de
`docs/sdd/Consultas_Recuentos_2026-09-25.sql:70-103`. Replica en SQL el criterio de `listarArticulosDeModelo`
(`apps/desk/server/db/catalogoArticulos.ts:307-314` para los derivados activos,
`apps/desk/server/db/catalogoArticulos.ts:316-317` para los ocultos y
`apps/desk/server/db/catalogoArticulos.ts:348-356` para los manuales activos), restringido a la clase `accesorio`.
Ninguna sesión la ejecuta y la suite no la corre: es **hipótesis** que PostgreSQL de producción la acepte tal cual.

```sql
BEGIN TRANSACTION READ ONLY;

WITH con_manual AS (
  SELECT DISTINCT a.modelo_id
  FROM public.catalogo_articulos a
  WHERE a.clase = 'accesorio' AND a.activo = true
), con_derivado AS (
  SELECT DISTINCT c.modelo_id
  FROM public.catalogo_modelo_categorias c
  JOIN books.items i ON i.category_name = c.categoria AND COALESCE(i.status, 'active') = 'active'
  WHERE c.clase = 'accesorio'
    AND NOT EXISTS (SELECT 1 FROM public.catalogo_articulos_ocultos o
                    WHERE o.modelo_id = c.modelo_id AND o.item_id = i.item_id)
), equipos_por_modelo AS (
  SELECT e.modelo_id, COUNT(*) AS equipos
  FROM desk.equipos e
  WHERE e.modelo_id IS NOT NULL
  GROUP BY e.modelo_id
)
SELECT ma.nombre AS marca, mo.nombre AS modelo, ti.nombre AS tipo,
       COALESCE(ep.equipos, 0) AS equipos,
       COUNT(*) OVER () AS modelos_sin_accesorios,
       (SELECT COUNT(*) FROM public.catalogo_modelos WHERE activo = true) AS modelos_activos
FROM public.catalogo_modelos mo
JOIN public.catalogo_marcas ma ON ma.id = mo.marca_id
LEFT JOIN public.catalogo_tipos ti ON ti.id = mo.tipo_id
LEFT JOIN equipos_por_modelo ep ON ep.modelo_id = mo.id
WHERE mo.activo = true
  AND NOT EXISTS (SELECT 1 FROM con_manual x WHERE x.modelo_id = mo.id)
  AND NOT EXISTS (SELECT 1 FROM con_derivado x WHERE x.modelo_id = mo.id)
ORDER BY equipos DESC, ma.nombre, mo.nombre;

ROLLBACK;
```

Sale una fila por modelo activo sin ningún accesorio activo, con los más usados arriba. La columna `modelo_id` de
equipos es la de `packages/zoho-sync/src/db/schema.sql:354`.

## 11. D9 — Lotes de `apply` (techo 800, válvula 720)

Primera cuenta: líneas nuevas más inserciones y borrados de cada edición en sitio. Estimación: × 1,8.

| Lote | Ficheros | Depende de | Cuenta | × 1,8 |
|---|---|---|---|---|
| 1 · Regla y cierre del catálogo | `packages/shared/src/accesoriosLista.ts` y su prueba; `packages/shared/src/index.ts`; `apps/desk/server/routes/catalogo.ts`; `apps/desk/server/db/catalogoArticulos.ts`; `apps/desk/server/accesoriosCatalogo.test.ts`; en sitio `apps/desk/server/catalogo.test.ts` y `apps/desk/server/db/catalogoArticulos.test.ts` | — | 385 | **693** |
| 2 · Detalle, novedad sembrada y compatibilidad | `apps/desk/server/db/checklistRemision.ts`; `packages/shared/src/types.ts`; `apps/desk/server/routes/remision.ts`; `packages/zoho-sync/src/db/schema.sql`; `apps/desk/server/accesoriosRemision.test.ts`; en sitio `novedadesSiembra.test.ts`, `migrate.test.ts`, `recepcion.test.ts`, `checklistRemision.test.ts`, `DEPLOY.md` | 1 | 270 | **486** |
| 3 · Ruta del Director Técnico | `apps/desk/server/routes/accesoriosModelo.ts`; `apps/desk/server/app.ts`; `apps/desk/server/accesoriosModelo.test.ts` | 1 | 225 | **405** |
| 4 · Cliente | `AccesoriosModeloPanel.tsx`; `Configuracion.tsx`, `CrearRemision.tsx`, `CatalogoEquipos.tsx`; `apps/desk/src/api/client.ts` | 1, 2, 3 | 175 | **315** |
| 5 · Cierre documental | la consulta `.sql`; texto para el maestro al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; sección nueva al **final** de `DEPLOY.md` (consulta de persona y comprobación tras desplegar); tabla de la regla 13 en `tasks.md` | 2, 3 | 130 | **234** |

El lote 1 roza la válvula: si su primera medida real pasa de 720, se parte por la costura natural —1a: módulo de shared
y su prueba; 1b: catálogo y sus pruebas—. Los lotes 2 y 3 no dependen entre sí. Cada intento se cierra con
`git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

**La rama no toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`** (DD-10).

## 12. Flujo de datos

    catálogo (super admin) ──POST articulos──┐
    panel del DT ──POST accesorios──────────┤→ motivo…/puede… (shared) → crearArticulo → public.catalogo_articulos
    copia entre modelos ──filtro────────────┘                                                    │
                                                                                                 ▼
    formulario ←─ incluye + incluyeDetalle ←─ GET /api/remisiones/nueva ←─ checklistDeRemision (items + detalle)
    formulario ──POST /api/remisiones (incluye: nombres; novedades: claves) → guardas de hoy, sin cambios

## 13. Matriz de amenazas

No aplica: no hay comandos de shell, subprocesos, automatización de control de versiones ni clasificación de ficheros
ejecutables. La ruta HTTP nueva se cubre con la escalera de guardas del apartado 6.

## 14. Migración y despliegue

Sin migración de datos ni relleno. La fila sembrada llega en el arranque, como llegaron las diez. Sin interruptores
nuevos: `.env.example` no cambia. Reversión: se revierte la rama; la novedad se retira con `activo = false`.

## 15. Preguntas abiertas

- [ ] El Director Técnico recibe `409` al añadir un accesorio que existe **desactivado** en ese modelo, y no puede
      reactivarlo (S-3: sólo añade). Se declara; si molesta, es la pregunta 3 de la propuesta.
- [ ] `getArticuloPorId` no filtra por estado: un artículo inactivo en Books se puede añadir si se conoce su id, igual
      que hoy en el alta del catálogo. El buscador sólo ofrece activos (`packages/zoho-sync/src/books/repo.ts:26-36`).
- [ ] DD-4 depende de que el lint admita el tipo `import()` en línea; el respaldo está descrito.
