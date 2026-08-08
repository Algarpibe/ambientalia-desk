import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Catalogo, CatalogoMarca, CatalogoModelo, CatalogoTipo, Conflictos, ConflictoModelo } from '@ambientalia/shared'

/** Fila cruda de cualquiera de las tablas del catálogo, sin comprometerse a sus columnas exactas. */
type Fila = Record<string, unknown>

const filaTipo = (r: Fila): CatalogoTipo => ({ id: r.id as string, nombre: r.nombre as string, activo: r.activo === true })
const filaMarca = (r: Fila): CatalogoMarca => ({ id: r.id as string, nombre: r.nombre as string, activo: r.activo === true })
const filaModelo = (r: Fila): CatalogoModelo => ({
  id: r.id as string, marcaId: r.marca_id as string, nombre: r.nombre as string,
  tipoId: (r.tipo_id as string) ?? null, tipoNombre: (r.tipo_nombre as string) ?? null,
  revisar: r.revisar === true, activo: r.activo === true,
})

/**
 * El catálogo tal como lo consumen los formularios: solo lo activo.
 *
 * `incluirModeloId` añade un modelo desactivado para que editar un equipo cuyo modelo se retiró no
 * deje el campo en blanco y obligue a cambiárselo. Es el mismo apaño que hacía `withCurrent` en la
 * pantalla, resuelto aquí porque es el servidor quien sabe.
 */
export async function leerCatalogo(db: Queryable, incluirModeloId?: string | null): Promise<Catalogo> {
  const extra = incluirModeloId ?? ''
  const tipos = await db.query('SELECT id,nombre,activo FROM catalogo_tipos WHERE activo = true ORDER BY nombre')
  const modelos = await db.query(
    `SELECT mo.id, mo.marca_id, mo.nombre, mo.tipo_id, mo.revisar, mo.activo, ti.nombre AS tipo_nombre
       FROM catalogo_modelos mo LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.activo = true OR mo.id = $1
      ORDER BY mo.nombre`,
    [extra],
  )
  // Invariante real (no solo la del modelo de `incluirModeloId`): NINGUNA marca con un modelo
  // visible se queda fuera, esté esa marca activa o no. Un modelo elegible sin su marca en el
  // desplegable es un modelo inalcanzable — y eso vale igual para el modelo activo de una marca
  // desactivada (dato heredado del inventario, nadie lo pidió así) que para el que se pide por
  // `incluirModeloId`. Por eso se calcula sobre TODAS las filas de `modelos`, no solo la incluida.
  const marcasNecesarias = (modelos.rows as Fila[]).map((r) => r.marca_id)
  const marcas = await db.query('SELECT id,nombre,activo FROM catalogo_marcas ORDER BY nombre')
  const visibles = (marcas.rows as Fila[]).filter((r) => r.activo === true || marcasNecesarias.includes(r.id))
  return {
    tipos: (tipos.rows as Fila[]).map(filaTipo),
    marcas: visibles.map(filaMarca),
    modelos: (modelos.rows as Fila[]).map(filaModelo),
  }
}

/**
 * La etiqueta que ve el administrador en el reparto cuando los equipos de un modelo marcado no
 * declaran tipo (equipos.tipo NULL). No es un tipo real del catálogo — no tiene fila en
 * catalogo_tipos ni id propio —, así que se exporta como constante: en cuanto la pantalla (Task 13)
 * necesite reconocer esta fila (para resaltarla, excluirla de un conteo, cambiarle la redacción),
 * lo hace comparando contra esto y no contra un literal repetido a mano en el cliente.
 */
export const SIN_TIPO = '(sin tipo)'

/**
 * Los modelos que la siembra dejó marcados, con el reparto de tipos que lo demuestra.
 *
 * No hay tabla de conflictos: como la siembra no reescribe `equipos` (salvo para rellenar
 * `modelo_id`), la evidencia sigue viva en los datos y el reparto se puede recalcular agrupando
 * sobre `equipos` en vez de guardarlo aparte. Así la bandeja nunca miente — si alguien corrige
 * equipos por otra vía (a mano, por otra ruta), la cuenta lo refleja sola en la siguiente lectura.
 */
export async function leerConflictos(db: Queryable): Promise<Conflictos> {
  // LEFT JOIN a catalogo_tipos: un modelo marcado puede no tener tipo asignado (la siembra también
  // marca `revisar` cuando el inventario no declaraba ninguno), y con un JOIN normal ese modelo
  // desaparecería de la bandeja en vez de mostrarse con tipoActual nulo.
  const marcados = await db.query(
    `SELECT mo.id, mo.nombre, ma.nombre AS marca, ti.nombre AS tipo_actual
       FROM catalogo_modelos mo
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
       LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.revisar = true
      ORDER BY ma.nombre, mo.nombre`,
  )
  // Decisión sobre los equipos que no declaran tipo (equipos.tipo NULL): en vez de desaparecer del
  // reparto (que se leería en pantalla como "sin conflicto"), cuentan aparte bajo la etiqueta
  // SIN_TIPO. Es evidencia tan real como cualquier tipo declarado — el administrador necesita verla
  // para decidir, no que se la escondan.
  //
  // Ninguna de las dos consultas de abajo filtra por `equipos.active`: adrede, porque `active` es un
  // borrado lógico (el equipo se dio de baja), no un estado operativo, y lo que la bandeja responde
  // es "¿qué tipo es este modelo?" — una propiedad del modelo, no un censo de lo que está en
  // servicio hoy. Un equipo archivado sigue siendo evidencia de cómo se tipificó en su día, y
  // excluirlo del reparto podría voltear el tipo ganador sin ninguna razón de negocio detrás.
  const repartos = await db.query(
    `SELECT modelo_id, COALESCE(tipo,'${SIN_TIPO}') AS tipo, COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NOT NULL GROUP BY modelo_id, tipo`,
  )
  const sinModelo = await db.query('SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NULL')

  // Agrupa el reparto en JavaScript, por modelo_id: GROUP BY no promete ningún orden de filas, así
  // que el agrupado y el desempate se hacen aquí y no se delegan a la base.
  const repartoPorModelo = new Map<string, Array<{ tipo: string; equipos: number }>>()
  for (const r of repartos.rows as Fila[]) {
    const modeloId = r.modelo_id as string
    const lista = repartoPorModelo.get(modeloId) ?? []
    lista.push({ tipo: r.tipo as string, equipos: Number(r.n) })
    repartoPorModelo.set(modeloId, lista)
  }
  // De más a menos, que es como se lee para decidir cuál es el tipo bueno; empatados, alfabético para
  // que el orden sea determinista y la bandeja no se reordene sola entre recargas.
  for (const lista of repartoPorModelo.values()) {
    lista.sort((a, b) => (b.equipos - a.equipos) || a.tipo.localeCompare(b.tipo))
  }

  const modelos: ConflictoModelo[] = (marcados.rows as Fila[]).map((r) => ({
    modeloId: r.id as string,
    marca: r.marca as string,
    modelo: r.nombre as string,
    tipoActual: (r.tipo_actual as string) ?? null,
    reparto: repartoPorModelo.get(r.id as string) ?? [],
  }))

  return { modelos, equiposSinModelo: Number((sinModelo.rows[0] as Fila).n) }
}

/** Un modelo con su marca y su tipo ya resueltos a texto, la forma que consume el alta de equipos. */
export interface ModeloResuelto { id: string; nombre: string; marca: string; tipo: string | null }

/** Un modelo por id, con su marca y su tipo ya resueltos a texto. Lo usa el alta de equipos. */
export async function getModelo(db: Queryable, id: string): Promise<ModeloResuelto | null> {
  const r = await db.query(
    `SELECT mo.id, mo.nombre, ma.nombre AS marca, ti.nombre AS tipo
       FROM catalogo_modelos mo
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
       LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.id = $1`,
    [id],
  )
  const f = r.rows[0] as Fila | undefined
  return f ? { id: f.id as string, nombre: f.nombre as string, marca: f.marca as string, tipo: (f.tipo as string) ?? null } : null
}

/** Nombre ya usado. Existe como clase propia para que la ruta lo traduzca a 409 sin adivinar. */
export class NombreRepetido extends Error {
  constructor(public readonly nombre: string) {
    super(`Ya existe «${nombre}»`)
    this.name = 'NombreRepetido'
  }
}

/**
 * La unicidad se comprueba con un SELECT previo y no con `ON CONFLICT`, por lo mismo que en
 * `seedChecklist`: es el patrón seguro en pg-mem, que no infiere el tipo de un `INSERT … SELECT $n`,
 * y deja el conflicto como un error nuestro con su mensaje en vez de como uno del driver.
 *
 * No sustituye a la restricción de la tabla, que sigue ahí: esto da el mensaje, aquella da la
 * garantía cuando dos administradores dan de alta lo mismo a la vez.
 *
 * `crearTipo` y `crearMarca` son idénticas salvo la tabla y el prefijo del id, así que comparten
 * este ayudante. `crearModelo` se queda fuera a propósito: su unicidad es compuesta (marca+nombre) y
 * su `INSERT` lleva columnas propias, así que meterla aquí convertiría el ayudante en un
 * constructor de consultas. El nombre de tabla se interpola pero nunca viene del usuario: el tipo
 * del parámetro solo admite los dos literales de abajo.
 */
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

/** El modelo es único dentro de su marca: un "6103" de Environics y otro de Horiba coexisten. */
export async function crearModelo(
  db: Queryable,
  input: { marcaId: string; nombre: string; tipoId: string | null; revisar?: boolean },
): Promise<string> {
  const n = input.nombre.trim()
  const ya = await db.query(
    'SELECT 1 FROM catalogo_modelos WHERE marca_id = $1 AND LOWER(nombre) = $2',
    [input.marcaId, n.toLowerCase()],
  )
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'cmod-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,revisar) VALUES ($1,$2,$3,$4,$5)',
    [id, input.marcaId, n, input.tipoId, input.revisar === true],
  )
  return id
}

/** Entrada del catálogo que alguien está usando. Se traduce a 409 con el conteo delante. */
export class EntradaEnUso extends Error {
  constructor(public readonly usos: number) {
    super(`En uso por ${usos}`)
    this.name = 'EntradaEnUso'
  }
}

/** Dónde se mira si una entrada está en uso antes de dejar borrarla. */
const USOS: Record<'tipos' | 'marcas' | 'modelos', { tabla: string; consulta: string }> = {
  tipos: { tabla: 'catalogo_tipos', consulta: 'SELECT COUNT(*)::int AS n FROM catalogo_modelos WHERE tipo_id = $1' },
  marcas: { tabla: 'catalogo_marcas', consulta: 'SELECT COUNT(*)::int AS n FROM catalogo_modelos WHERE marca_id = $1' },
  modelos: { tabla: 'catalogo_modelos', consulta: 'SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id = $1' },
}

/**
 * Si una entrada del catálogo existe. Sin claves foráneas declaradas, un `marcaId` inventado crearía
 * un modelo colgando de nada que ningún desplegable enseñaría jamás. La frontera es la ruta, igual
 * que el alta de equipos comprueba su cliente con `getClient`.
 */
export async function existeEnCatalogo(db: Queryable, que: 'tipos' | 'marcas' | 'modelos', id: string): Promise<boolean> {
  const r = await db.query(`SELECT 1 FROM ${USOS[que].tabla} WHERE id = $1`, [id])
  return r.rows.length > 0
}

export async function actualizarTipo(db: Queryable, id: string, patch: { nombre?: string; activo?: boolean }): Promise<void> {
  if (patch.nombre !== undefined) await db.query('UPDATE catalogo_tipos SET nombre=$2 WHERE id=$1', [id, patch.nombre.trim()])
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_tipos SET activo=$2 WHERE id=$1', [id, patch.activo])
}

/**
 * La marca NO se renombra, solo se activa o desactiva. `perfilChecklist` decide el checklist
 * "Incluye" de una remisión leyendo el TEXTO de la marca (`marca === 'horiba'`), así que un
 * renombrado cambiaría en silencio qué accesorios pide la remisión de todos sus equipos. Renombrar
 * y fusionar necesitan su propio diseño, con ese aviso delante.
 */
export async function actualizarMarca(db: Queryable, id: string, patch: { activo?: boolean }): Promise<void> {
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_marcas SET activo=$2 WHERE id=$1', [id, patch.activo])
}

/**
 * Cambia el tipo de un modelo y/o lo activa. Tampoco renombra, por la misma razón que la marca:
 * `perfilChecklist` mira el modelo por subcadena (`modelo.includes('edm180')`).
 *
 * Fijar `tipoId` apaga `revisar`: un administrador que elige el tipo a conciencia es exactamente lo
 * que resuelve la duda que la siembra dejó abierta.
 *
 * Devuelve cuántos equipos declaran otro tipo, se hayan corregido o no, para que el número quede a
 * la vista sin tener que ir a buscarlo. OJO: eso solo es una cuenta real cuando `tipoId` se fija a
 * un tipo concreto. Si `tipoId` no viene en el patch, o se fija a `null` (el modelo se queda sin
 * tipo), la función sale antes de contar y el `0` que devuelve es un valor fijo, no una cuenta.
 */
export async function actualizarModelo(
  db: Queryable,
  id: string,
  patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean; sku?: string | null },
): Promise<{ discrepan: number }> {
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_modelos SET activo=$2 WHERE id=$1', [id, patch.activo])
  if (patch.sku !== undefined) await db.query('UPDATE catalogo_modelos SET sku=$2 WHERE id=$1', [id, patch.sku])
  if (patch.tipoId === undefined) return { discrepan: 0 }

  await db.query('UPDATE catalogo_modelos SET tipo_id=$2, revisar=false WHERE id=$1', [id, patch.tipoId])
  const modelo = await getModelo(db, id)
  const tipo = modelo?.tipo ?? null
  if (!tipo) return { discrepan: 0 }

  const r = await db.query(
    "SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id = $1 AND COALESCE(tipo,'') <> $2",
    [id, tipo],
  )
  const discrepan = Number((r.rows[0] as Record<string, unknown>).n)
  if (patch.corregirEquipos === true && discrepan > 0) {
    await db.query("UPDATE equipos SET tipo=$2, updated_at=now() WHERE modelo_id = $1 AND COALESCE(tipo,'') <> $2", [id, tipo])
  }
  return { discrepan }
}

/**
 * Borrado físico, y solo si nadie la usa: borrar una entrada usada dejaría equipos apuntando a la
 * nada. Cuando está en uso se niega con el conteo, que es el dato con el que se decide si lo que
 * tocaba era desactivarla.
 */
export async function borrarEntrada(db: Queryable, que: 'tipos' | 'marcas' | 'modelos', id: string): Promise<void> {
  const { tabla, consulta } = USOS[que]
  const r = await db.query(consulta, [id])
  const usos = Number((r.rows[0] as Record<string, unknown>).n)
  if (usos > 0) throw new EntradaEnUso(usos)
  await db.query(`DELETE FROM ${tabla} WHERE id = $1`, [id])
}
