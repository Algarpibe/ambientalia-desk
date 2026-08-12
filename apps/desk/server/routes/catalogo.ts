import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { TIPOS_DOCUMENTO, type TipoDocumento } from '@ambientalia/shared'
import {
  leerCatalogo, leerConflictos, crearTipo, crearMarca, crearModelo,
  actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada, existeEnCatalogo, getModelo,
  NombreRepetido, EntradaEnUso,
} from '../db/catalogo'
import { leerFicha, crearEnlace, crearFichero, contenidoDocumento, borrarDocumento, DocumentoInvalido } from '../db/fichaModelo'
import { crearArticulo, actualizarArticulo, borrarArticulo, ArticuloRepetido, listarArticulosDeModelo, listarCategorias, asignarCategoria, quitarCategoria, CategoriaRepetida, ocultarArticulo, mostrarArticulo, copiarArticulos, reordenarArticulos } from '../db/catalogoArticulos'
import { getArticuloPorSku, getArticuloPorId } from '@ambientalia/zoho-sync/books/repo'
import { CLASES_ARTICULO, admiteCategorias, type ClaseArticulo } from '@ambientalia/shared'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'

// Un manual por encima del límite se ENLAZA en vez de subirse, que es justo el caso que motivó
// admitir los dos caminos.
const subida = crearSubida()
const esTipoDocumento = (v: string): v is TipoDocumento => (TIPOS_DOCUMENTO as readonly string[]).includes(v)
const esClaseArticulo = (v: string): v is ClaseArticulo => (CLASES_ARTICULO as readonly string[]).includes(v)

/** Cómo se nombra cada clase en los mensajes de error. La pantalla tiene sus propias etiquetas. */
const ETIQUETA_CLASE_PLURAL_SERVIDOR: Record<ClaseArticulo, string> = {
  accesorio: 'Los accesorios',
  consumible_repuesto: 'Los consumibles y repuestos',
  mano_obra: 'Los códigos de mano de obra',
}

/** Las tres entidades que admite el borrado, como lista blanca. Nada de la URL llega a una tabla. */
const ENTIDADES = ['tipos', 'marcas', 'modelos'] as const
type Entidad = (typeof ENTIDADES)[number]
const esEntidad = (v: string): v is Entidad => (ENTIDADES as readonly string[]).includes(v)

// Lo que cuenta `borrarEntrada` cambia según la entidad: un tipo o una marca en uso los cuenta por
// MODELOS (ver USOS en db/catalogo.ts), un modelo en uso los cuenta por EQUIPOS. El mensaje tiene
// que nombrar lo que de verdad se contó, no adivinar.
const SUSTANTIVO_USO: Record<Entidad, { uno: string; varios: string }> = {
  tipos: { uno: 'modelo', varios: 'modelos' },
  marcas: { uno: 'modelo', varios: 'modelos' },
  modelos: { uno: 'equipo', varios: 'equipos' },
}

// La sugerencia concuerda en género con la entidad. Va como frase entera y no ensamblada por trozos
// porque el género arrastra hasta el final («desactívala … borrarla»), y armarla a cachos es
// justo como se cuelan los textos que suenan a máquina.
const SUGERENCIA: Record<Entidad, string> = {
  tipos: 'Desactívalo en lugar de borrarlo.',
  marcas: 'Desactívala en lugar de borrarla.',
  modelos: 'Desactívalo en lugar de borrarlo.',
}

export function registerCatalogoRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // De sesión, no de admin: lo consume el formulario de alta de equipos, que usa cualquiera con
  // sesión. `incluir` deja ver un modelo desactivado cuyo equipo se está editando (ver leerCatalogo).
  app.get('/api/catalogo', requireAuth(db), asyncHandler(async (req, res) => {
    const incluir = req.query.incluir ? String(req.query.incluir) : null
    res.json(await leerCatalogo(db, incluir))
  }))

  // La bandeja de modelos que la siembra dejó marcados para revisar: solo interesa a quien administra.
  app.get('/api/catalogo/conflictos', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    res.json(await leerConflictos(db))
  }))

  app.post('/api/catalogo/tipos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const nombre = String((req.body as Record<string, unknown> | undefined)?.nombre ?? '').trim()
    if (!nombre) { res.status(422).json({ error: 'El nombre es obligatorio' }); return }
    try {
      res.status(201).json({ id: await crearTipo(db, nombre) })
    } catch (err) {
      if (err instanceof NombreRepetido) { res.status(409).json({ error: err.message }); return }
      throw err
    }
  }))

  app.post('/api/catalogo/marcas', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const nombre = String((req.body as Record<string, unknown> | undefined)?.nombre ?? '').trim()
    if (!nombre) { res.status(422).json({ error: 'El nombre es obligatorio' }); return }
    try {
      res.status(201).json({ id: await crearMarca(db, nombre) })
    } catch (err) {
      if (err instanceof NombreRepetido) { res.status(409).json({ error: err.message }); return }
      throw err
    }
  }))

  // Sin claves foráneas en el esquema, esta ruta es la única red contra un modelo colgando de una
  // marca o un tipo que no existen — igual que el alta de equipos comprueba su cliente con getClient.
  app.post('/api/catalogo/modelos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const marcaId = b.marcaId ? String(b.marcaId) : ''
    const nombre = b.nombre ? String(b.nombre).trim() : ''
    const tipoId = b.tipoId ? String(b.tipoId) : null
    if (!marcaId || !nombre) { res.status(422).json({ error: 'La marca y el nombre son obligatorios' }); return }
    if (!(await existeEnCatalogo(db, 'marcas', marcaId))) { res.status(422).json({ error: 'La marca no existe' }); return }
    if (tipoId && !(await existeEnCatalogo(db, 'tipos', tipoId))) { res.status(422).json({ error: 'El tipo no existe' }); return }
    try {
      res.status(201).json({ id: await crearModelo(db, { marcaId, nombre, tipoId }) })
    } catch (err) {
      if (err instanceof NombreRepetido) { res.status(409).json({ error: err.message }); return }
      throw err
    }
  }))

  app.patch('/api/catalogo/tipos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const b = (req.body ?? {}) as Record<string, unknown>
    const patch: { nombre?: string; activo?: boolean } = {}
    if (b.nombre !== undefined) patch.nombre = String(b.nombre)
    if (b.activo !== undefined) patch.activo = Boolean(b.activo)
    await actualizarTipo(db, id, patch)
    res.json({ ok: true })
  }))

  // La marca NO se renombra en esta fase (ver actualizarMarca en db/catalogo.ts: perfilChecklist
  // decide el checklist "Incluye" de una remisión leyendo el TEXTO de la marca por subcadena, así que
  // un renombrado cambiaría en silencio qué accesorios pide la remisión de todos sus equipos). Por
  // eso este patch solo admite `activo`, aunque el cuerpo traiga otra cosa se ignora.
  app.patch('/api/catalogo/marcas/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const b = (req.body ?? {}) as Record<string, unknown>
    const patch: { activo?: boolean } = {}
    if (b.activo !== undefined) patch.activo = Boolean(b.activo)
    await actualizarMarca(db, id, patch)
    res.json({ ok: true })
  }))

  // El modelo tampoco se renombra, por la misma razón que la marca (perfilChecklist lo mira por
  // subcadena). Sí se le puede fijar el tipo y activarlo/desactivarlo.
  app.patch('/api/catalogo/modelos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const b = (req.body ?? {}) as Record<string, unknown>
    const patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean; sku?: string | null } = {}
    if (b.tipoId !== undefined) {
      const tipoId = b.tipoId ? String(b.tipoId) : null
      if (tipoId && !(await existeEnCatalogo(db, 'tipos', tipoId))) { res.status(422).json({ error: 'El tipo no existe' }); return }
      patch.tipoId = tipoId
    }
    if (b.activo !== undefined) patch.activo = Boolean(b.activo)
    if (b.corregirEquipos !== undefined) patch.corregirEquipos = Boolean(b.corregirEquipos)
    if (b.sku !== undefined) patch.sku = b.sku ? String(b.sku).trim() : null
    res.json(await actualizarModelo(db, id, patch))
  }))

  // ── Artículos del modelo: accesorios, consumibles y repuestos ──────────────────────────────────
  // Leer: cualquier sesión (el técnico que prepara una remisión tiene que ver qué lleva el equipo).
  // Escribir: solo super administrador, como el resto del catálogo maestro.
  // La lista REAL del modelo: lo que derivan sus categorías de Books más los añadidos a mano. No es la
  // tabla `catalogo_articulos` en crudo — esa solo guarda los manuales.
  app.get('/api/catalogo/modelos/:id/articulos', requireAuth(db), asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    res.json(await listarArticulosDeModelo(db, modeloId, { incluirInactivos: true }))
  }))

  app.get('/api/catalogo/modelos/:id/categorias', requireAuth(db), asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    res.json(await listarCategorias(db, modeloId))
  }))

  app.post('/api/catalogo/modelos/:id/categorias', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>
    const clase = String(b.clase ?? '')
    if (!esClaseArticulo(clase)) { res.status(422).json({ error: 'Clase de artículo desconocida' }); return }
    // Hay clases que se eligen pieza a pieza: una categoría de serie trae decenas de artículos y la
    // mayoría no aplica a la variante concreta, así que se acababa desactivando uno a uno. La puerta
    // se cierra AQUÍ y no solo en la pantalla: esconder el desplegable dejaría la vía abierta a
    // cualquiera que llamase a la API a mano, y volvería a haber modelos con categorías que la
    // interfaz ya no sabe gestionar.
    if (!admiteCategorias(clase)) {
      res.status(422).json({ error: `${ETIQUETA_CLASE_PLURAL_SERVIDOR[clase]} se añaden artículo a artículo, no por categoría.` })
      return
    }
    const categoria = String(b.categoria ?? '').trim()
    if (!categoria) { res.status(422).json({ error: 'La categoría es obligatoria' }); return }
    try {
      res.status(201).json({ id: await asignarCategoria(db, modeloId, clase, categoria) })
    } catch (e) {
      if (e instanceof CategoriaRepetida) { res.status(409).json({ error: e.message }); return }
      throw e
    }
  }))

  // Excluir un artículo derivado de ESTE modelo. Una categoría de serie trae decenas y no todos valen
  // para todas sus variantes; sin esto habría que renunciar a la categoría entera.
  app.post('/api/catalogo/modelos/:id/articulos-ocultos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const itemId = String((req.body as Record<string, unknown> | undefined)?.itemId ?? '')
    if (!itemId) { res.status(422).json({ error: 'Falta el artículo' }); return }
    await ocultarArticulo(db, modeloId, itemId)
    res.json({ ok: true })
  }))

  app.delete('/api/catalogo/modelos/:id/articulos-ocultos/:itemId', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    await mostrarArticulo(db, String(req.params.id), String(req.params.itemId))
    res.status(204).end()
  }))

  // Quitar la categoría retira de golpe todos los artículos que aportaba: es la contrapartida de que la
  // lista se derive en vez de copiarse.
  app.delete('/api/catalogo/categorias/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    await quitarCategoria(db, String(req.params.id))
    res.status(204).end()
  }))

  app.post('/api/catalogo/modelos/:id/articulos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>

    const clase = String(b.clase ?? '')
    if (!esClaseArticulo(clase)) { res.status(422).json({ error: 'Clase de artículo desconocida' }); return }

    // Con `itemId`, el artículo manda: sku y nombre los escribe el SERVIDOR leyéndolos de Books. Es la
    // misma regla que el alta de equipos desde el catálogo — si el nombre viniera del navegador, el
    // mismo artículo acabaría con dos grafías y volvería el problema que Books viene a resolver.
    let datos: { itemId: string | null; sku: string | null; nombre: string }
    if (b.itemId) {
      const art = await getArticuloPorId(db, String(b.itemId))
      if (!art) { res.status(422).json({ error: 'Artículo no encontrado en Zoho Books' }); return }
      datos = { itemId: art.id, sku: art.sku || null, nombre: art.nombre }
    } else {
      const nombre = String(b.nombre ?? '').trim()
      if (!nombre) { res.status(422).json({ error: 'El nombre es obligatorio' }); return }
      datos = { itemId: null, sku: null, nombre }
    }

    try {
      res.status(201).json({ id: await crearArticulo(db, modeloId, { clase, ...datos }) })
    } catch (e) {
      if (e instanceof ArticuloRepetido) { res.status(409).json({ error: e.message }); return }
      throw e
    }
  }))

  /**
   * Copia los artículos de una clase de este modelo a otros. Pensado para los ACCESORIOS, que desde que
   * se eligen pieza a pieza perdieron la vía de compartirse entre variantes de una serie que los
   * consumibles siguen teniendo por categoría.
   *
   * Los destinos se comprueban uno a uno ANTES de escribir nada: a medio copiar, el operador no sabría
   * cuáles llegaron y cuáles no, y repetir la operación es justo lo que no debe dar miedo.
   */
  app.post('/api/catalogo/modelos/:id/copiar-articulos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const origenId = String(req.params.id)
    if (!(await getModelo(db, origenId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>

    const clase = String(b.clase ?? '')
    if (!esClaseArticulo(clase)) { res.status(422).json({ error: 'Clase de artículo desconocida' }); return }

    const destinos = Array.isArray(b.destinos) ? b.destinos.map(String) : []
    if (!destinos.length) { res.status(422).json({ error: 'Elige al menos un modelo de destino' }); return }
    for (const d of destinos) {
      if (!(await getModelo(db, d))) { res.status(422).json({ error: `Modelo de destino desconocido: ${d}` }); return }
    }

    res.json(await copiarArticulos(db, origenId, destinos, clase))
  }))

  /**
   * Fija el orden de una clase de golpe. Es el orden con el que el técnico verá los accesorios al
   * hacer los checks de la remisión de entrada.
   *
   * Va en una sola petición y no un PATCH por fila: a media reordenación quedarían dos artículos con
   * el mismo `orden` y la lista se pintaría en un orden que nadie eligió.
   */
  app.put('/api/catalogo/modelos/:id/articulos/orden', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>

    const clase = String(b.clase ?? '')
    if (!esClaseArticulo(clase)) { res.status(422).json({ error: 'Clase de artículo desconocida' }); return }
    if (!Array.isArray(b.ids)) { res.status(422).json({ error: 'Falta el orden' }); return }

    await reordenarArticulos(db, modeloId, clase, b.ids.map(String))
    res.status(204).end()
  }))

  app.patch('/api/catalogo/articulos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const patch: { clase?: ClaseArticulo; orden?: number; activo?: boolean } = {}
    if (b.clase !== undefined) {
      const clase = String(b.clase)
      if (!esClaseArticulo(clase)) { res.status(422).json({ error: 'Clase de artículo desconocida' }); return }
      patch.clase = clase
    }
    if (b.orden !== undefined) patch.orden = Number(b.orden)
    if (b.activo !== undefined) patch.activo = b.activo === true
    await actualizarArticulo(db, String(req.params.id), patch)
    res.json({ ok: true })
  }))

  // Borrado físico. La vía normal para retirar un artículo es DESACTIVARLO: eso lo saca de las listas
  // futuras sin tocar las remisiones ya emitidas.
  app.delete('/api/catalogo/articulos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    await borrarArticulo(db, String(req.params.id))
    res.status(204).end()
  }))

  // Leer la ficha: cualquiera con sesión. El técnico que repara tiene que poder abrir el manual;
  // decidir qué documentos existen es administrar. Nunca devuelve `content_b64` (ver leerFicha).
  app.get('/api/catalogo/modelos/:id/ficha', requireAuth(db), asyncHandler(async (req, res) => {
    const f = await leerFicha(db, String(req.params.id))
    if (!f) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    // El artículo se resuelve AQUÍ y no dentro de `leerFicha` para no atar la ficha —que es del
    // catálogo propio— a la réplica de Books. Si algún día Books deja de estar, la ficha sigue leyéndose.
    res.json({ ...f, skuArticulo: f.sku ? await getArticuloPorSku(db, f.sku) : null })
  }))

  // El fichero, por el proxy autenticado de la aplicación: nada sale de la sesión. 404 si el
  // documento es un enlace — no hay fichero que servir.
  app.get('/api/catalogo/modelos/:id/documentos/:docId/contenido', requireAuth(db), asyncHandler(async (req, res) => {
    const c = await contenidoDocumento(db, String(req.params.id), String(req.params.docId))
    if (!c) { res.status(404).json({ error: 'No encontrado' }); return }
    res.set('Content-Type', c.contentType)
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(c.contentB64, 'base64'))
  }))

  // Alta. Admite las dos formas: JSON con `url` (enlace) o multipart con el campo `archivo`.
  app.post('/api/catalogo/modelos/:id/documentos', requireAuth(db), requireSuperAdmin, subida.single('archivo'), asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await existeEnCatalogo(db, 'modelos', modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>
    const tipo = String(b.tipo ?? '')
    if (!esTipoDocumento(tipo)) { res.status(422).json({ error: 'Tipo de documento no válido' }); return }
    const nombre = String(b.nombre ?? '')
    const creadoPor = req.user?.name ?? 'App'
    try {
      if (req.file) {
        const id = await crearFichero(db, modeloId, {
          tipo, nombre, contentB64: req.file.buffer.toString('base64'),
          contentType: req.file.mimetype, size: req.file.size, creadoPor,
        })
        res.status(201).json({ id }); return
      }
      const url = String(b.url ?? '')
      if (!url.trim()) { res.status(422).json({ error: 'Hace falta un enlace o un archivo' }); return }
      res.status(201).json({ id: await crearEnlace(db, modeloId, { tipo, nombre, url, creadoPor }) })
    } catch (err) {
      if (err instanceof DocumentoInvalido) { res.status(422).json({ error: err.message }); return }
      throw err
    }
  }))

  app.delete('/api/catalogo/modelos/:id/documentos/:docId', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const ok = await borrarDocumento(db, String(req.params.id), String(req.params.docId))
    if (!ok) { res.status(404).json({ error: 'No encontrado' }); return }
    res.json({ ok: true })
  }))

  // Lista blanca: `req.params.entidad` nunca llega a interpolarse en un nombre de tabla si no está
  // en ENTIDADES. Sin esto, un valor de la URL acabaría dentro de una consulta SQL.
  app.delete('/api/catalogo/:entidad/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const entidad = String(req.params.entidad)
    if (!esEntidad(entidad)) { res.status(404).json({ error: 'No encontrado' }); return }
    const id = String(req.params.id)
    try {
      await borrarEntrada(db, entidad, id)
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof EntradaEnUso) {
        const sustantivo = err.usos === 1 ? SUSTANTIVO_USO[entidad].uno : SUSTANTIVO_USO[entidad].varios
        res.status(409).json({ error: `En uso por ${err.usos} ${sustantivo}. ${SUGERENCIA[entidad]}` })
        return
      }
      throw err
    }
  }))
}
