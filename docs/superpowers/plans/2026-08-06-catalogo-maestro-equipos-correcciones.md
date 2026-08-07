# Correcciones al plan del catálogo maestro de equipos

Nacidas de las revisiones de las tareas 1 a 4 al ejecutar el plan. **Tienen prioridad sobre el texto de `2026-08-06-catalogo-maestro-equipos.md`.**

## C1 — Task 1: la unicidad se declara además de comprobarse (YA APLICADA, commit `4a655fc`)

`catalogo_modelos` lleva `UNIQUE (marca_id, nombre)`, y existen los índices `idx_equipos_modelo` e `idx_catalogo_modelos_tipo`.

La comprobación con `SELECT` previo del repo **no sustituye** a la restricción: aquella da el mensaje entendible (409), esta da la garantía cuando dos administradores dan de alta lo mismo a la vez. Quedó demostrado al revisar la Task 4: al romper a propósito el `LOWER` del repo, el error que sale es el crudo de la restricción de la tabla.

⚠️ **Al desplegar:** `CREATE TABLE IF NOT EXISTS` no añade el `UNIQUE` a una tabla que ya exista. Esto solo funciona porque nada de esto se ha desplegado todavía. Si en producción llegaran a existir las tablas sin la restricción, habría que añadirla con un `ALTER TABLE ... ADD CONSTRAINT`.

## C2 — Task 5: extraer `altaSimple` y añadir `existeEnCatalogo` ANTES de escribir los cambios

`crearTipo` y `crearMarca` son idénticas salvo por el nombre de la tabla y el prefijo del id. `actualizarTipo` y `actualizarMarca` repetirían esa forma una tercera y cuarta vez, así que el momento de extraerlo es antes de escribirlas, no después.

```ts
async function altaSimple(db: Queryable, tabla: 'catalogo_tipos' | 'catalogo_marcas', prefijo: string, nombre: string): Promise<string> {
  const n = nombre.trim()
  const ya = await db.query(`SELECT 1 FROM ${tabla} WHERE LOWER(nombre) = $1`, [n.toLowerCase()])
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = `${prefijo}-${randomUUID()}`
  await db.query(`INSERT INTO ${tabla} (id,nombre) VALUES ($1,$2)`, [id, n])
  return id
}

export const crearTipo = (db: Queryable, nombre: string): Promise<string> => altaSimple(db, 'catalogo_tipos', 'ctip', nombre)
export const crearMarca = (db: Queryable, nombre: string): Promise<string> => altaSimple(db, 'catalogo_marcas', 'cmar', nombre)
```

`crearModelo` se queda fuera **a propósito**: su unicidad es compuesta y su `INSERT` lleva columnas propias, así que meterla dentro convertiría el ayudante en un constructor de consultas.

El nombre de tabla se interpola, pero **nunca viene del usuario**: el tipo del parámetro solo admite esos dos literales.

Los tests de la Task 4 tienen que seguir pasando **sin tocarlos**: son la red que prueba que el refactor no cambió el comportamiento.

Y el ayudante que necesita la Task 8, porque este esquema no declara claves foráneas:

```ts
/**
 * Si una entrada del catálogo existe. Sin claves foráneas declaradas, un `marcaId` inventado
 * crearía un modelo colgando de nada que ningún desplegable enseñaría jamás. La frontera es la
 * ruta, igual que el alta de equipos comprueba su cliente con `getClient`.
 */
export async function existeEnCatalogo(db: Queryable, que: 'tipos' | 'marcas' | 'modelos', id: string): Promise<boolean> {
  const r = await db.query(`SELECT 1 FROM ${USOS[que].tabla} WHERE id = $1`, [id])
  return r.rows.length > 0
}
```

## C3 — Task 6: el separador de claves va como ESCAPE, nunca como carácter literal

El código de la Task 6 usa un NUL como separador de las claves compuestas `(marca, modelo)`. En el texto del plan quedó escrito como **carácter literal invisible**, y eso es un error del plan: un carácter de control en el fuente se pierde en cualquier copia y deja dos claves distintas pegadas sin que nadie lo vea. De hecho convirtió el fichero del plan en «binario» para `grep`.

Escríbelo siempre como la secuencia de seis caracteres ASCII — barra invertida, `u`, `0`, `0`, `0`, `0` — y dale nombre:

```ts
/**
 * Separador de las claves compuestas. El NUL no puede aparecer en un nombre de marca ni de modelo,
 * así que dos pares distintos nunca colisionan. Va escrito como escape y no como carácter literal:
 * un carácter de control en el fuente es invisible y se pierde al copiarlo.
 */
const SEPARADOR = '\u0000'
const claveDe = (a: string, b: string): string => a + SEPARADOR + b
```

Y úsalo en los cuatro sitios donde el plan pone el carácter suelto: el índice `idModelo`, la clave del conteo, el `split` que la deshace, y `claveModelo`.

## C4 — Task 6: prohibido `r: any` al mapear filas

El bloque de código de la Task 6 usa `(r: any)` en cuatro sitios. **Sube el lint por encima de la línea base de 159 y hay que rehacerlo**, igual que ya tuvieron que hacer las tareas 3 y 4. El patrón de la casa, tomado de `remisionesDelEquipo` en `apps/desk/server/db/equipos.ts`:

```ts
/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>
```

⚠️ Ojo con el nombre: el plan tiene una variable local `filas` con el resultado de la consulta de equipos. **Renómbrala a `equipos`** para que no choque con el ayudante.

## C5 — Task 8: validar que la marca y el tipo existen

`POST /api/catalogo/modelos` debe rechazar con **422** un `marcaId` que no exista, y un `tipoId` que no exista cuando venga. `PATCH /api/catalogo/modelos/:id` debe hacer lo mismo con `tipoId`.

Sin claves foráneas en el esquema, la ruta es la única red: un `marcaId` inventado crearía un modelo que ningún desplegable enseñaría jamás. Es la misma frontera que ya aplica el alta de equipos con `getClient` (422 «Cliente no encontrado»).

Los dos casos necesitan su test: `422` con marca inexistente y `422` con tipo inexistente.

## C6 — Regla de proceso para los revisores

Ningún revisor debe ejecutar `git checkout <sha> -- .`, `git reset --hard`, `git stash` ni `git clean`. Para comprobar que un test muerde: editar el fichero concreto, ejecutar, y restaurar **ese** fichero con `git checkout -- ruta/concreta.ts`, confirmando después con `git status --short` que el árbol quedó como estaba.

Un revisor de la Task 3 ejecutó `git checkout 161bc94 -- .`. Resultó inofensivo porque ese commit era HEAD y el árbol estaba limpio, pero pudo haber destruido trabajo sin recuperación.

## C7 — Task 5: el test de «desactivar una marca» del plan estaba mal (YA CORREGIDO, commit `366863d`)

El plan proponía este test:

```ts
await actualizarMarca(db, marca, { activo: false })
const c = await leerCatalogo(db)
expect(c.marcas).toEqual([])            // ← MAL
```

**Contradice la invariante fijada en `ba7974b`**: una marca desactivada que conserva un modelo activo SÍ debe seguir apareciendo en `leerCatalogo`, porque si no el modelo quedaría sin marca en el desplegable y sería inalcanzable. Esa invariante tiene su propio test dedicado.

El error de fondo era mezclar dos cosas: lo que `actualizarMarca` garantiza (que desactivar una marca **no** cae en cascada sobre sus modelos) y lo que `leerCatalogo` decide enseñar. El test corregido comprueba las filas crudas de `catalogo_marcas` y `catalogo_modelos`, que es justo lo primero, y deja lo segundo a su test.

**Lección para las tareas que quedan:** no des por hecho que desactivar algo lo hace desaparecer de `leerCatalogo`. Si un test necesita comprobar lo que una función de escritura hace, míralo en la tabla, no a través de la capa de lectura.

## C8 — Task 6: la siembra es insensible a mayúsculas, también al enlazar (mejor que lo escrito)

La especificación decía que el paso 5 rellena `equipos.modelo_id` «cruzando por coincidencia **exacta** de (marca, modelo)». La implementación (`fa1f90c`) no lo hace así, y **hace bien**.

El inventario real trae la misma marca escrita de varias formas (`Horiba` y `HORIBA`, `Grimm` y `GRIMM`). Con coincidencia exacta, el catálogo se habría quedado con una sola grafía y **todos los equipos escritos de la otra forma habrían quedado huérfanos**, sin `modelo_id`, que es justo el problema que esta fase viene a cerrar.

Lo que hace en su lugar:

- Agrega e indexa por `toLowerCase()`, así que las dos grafías son la misma marca y el mismo modelo.
- **La grafía que sobrevive en el catálogo es determinista**: la del equipo con el `id` alfabéticamente menor, gracias a un `ORDER BY id` en la consulta de equipos. Ese `ORDER BY` no es decorativo — sin él, dos ejecuciones sobre los mismos datos podrían guardar grafías distintas.
- El paso 5 busca también por `toLowerCase()`, así que enlaza los equipos de las dos grafías al mismo modelo. **Ningún equipo queda huérfano por una diferencia de mayúsculas.**
- Los tipos se suman igual: `Monitor PM10` y `monitor pm10` cuentan como un solo tipo, y se guarda la primera grafía vista. Si además hay otro tipo distinto, `revisar` sigue encendiéndose, que es lo correcto.

**Por qué importa dejarlo escrito:** que funcione depende de que el `toLowerCase()` esté también en las claves de búsqueda del enlace, no solo en las de agregación. No es evidente leyendo el código por encima, y «simplificarlo» a una comparación literal rompería el enlace de cientos de equipos. Por eso lleva tests propios que lo fijan.

## C9 — `ResumenSiembra` cambia de forma: los contadores dicen que son deltas

Los cinco contadores cuentan lo creado en **esa** ejecución, no el total. El tipo no lo decía y los nombres tampoco, así que una segunda siembra sobre un catálogo ya poblado devolvía `{ tipos: 0, marcas: 0, modelos: 0, conflictos: 0 }` — que se lee como «no hay nada» cuando significa «no había nada nuevo que crear».

`conflictos` era el caso grave: devolvía `0` aunque quedaran decenas de modelos marcados para revisar de la primera pasada. Justo el número que necesita quien acaba de sembrar, y le dábamos el contrario.

La forma nueva:

```ts
export interface ResumenSiembra {
  tiposCreados: number
  marcasCreadas: number
  modelosCreados: number
  equiposEnlazados: number
  conflictosNuevos: number
  /** TOTAL de modelos con `revisar = true` en la tabla, no el delta. Es lo que el administrador
   *  necesita ver: «no creé nada nuevo, pero quedan 23 por revisar». */
  modelosPorRevisar: number
}
```

Sigue el precedente de `seedChecklist`, que ya distinguía `insertados` de `existentes` por esta misma razón.

⚠️ **La Task 9 tiene que usar los nombres nuevos.** El test que el plan propone para el endpoint de siembra comprueba `{ marcas: 1, tipos: 1, modelos: 1, equiposEnlazados: 1 }`; con la forma nueva son `{ marcasCreadas: 1, tiposCreados: 1, modelosCreados: 1, equiposEnlazados: 1 }`. Y el mensaje de `logger.info` de esa ruta debe reflejar los nombres nuevos e incluir `modelosPorRevisar`.
