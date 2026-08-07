import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  leerCatalogo, leerConflictos, crearTipo, crearMarca, crearModelo,
  actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada, existeEnCatalogo,
  NombreRepetido, EntradaEnUso,
} from '../db/catalogo'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/** Las tres entidades que admite el borrado, como lista blanca. Nada de la URL llega a una tabla. */
const ENTIDADES = ['tipos', 'marcas', 'modelos'] as const
type Entidad = (typeof ENTIDADES)[number]
const esEntidad = (v: string): v is Entidad => (ENTIDADES as readonly string[]).includes(v)

// Lo que cuenta `borrarEntrada` cambia según la entidad: un tipo o una marca en uso los cuenta por
// MODELOS (ver USOS en db/catalogo.ts), un modelo en uso los cuenta por EQUIPOS. El mensaje tiene
// que nombrar lo que de verdad se contó, no adivinar.
const SUSTANTIVO_USO: Record<Entidad, string> = { tipos: 'modelo(s)', marcas: 'modelo(s)', modelos: 'equipo(s)' }

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
    const patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean } = {}
    if (b.tipoId !== undefined) {
      const tipoId = b.tipoId ? String(b.tipoId) : null
      if (tipoId && !(await existeEnCatalogo(db, 'tipos', tipoId))) { res.status(422).json({ error: 'El tipo no existe' }); return }
      patch.tipoId = tipoId
    }
    if (b.activo !== undefined) patch.activo = Boolean(b.activo)
    if (b.corregirEquipos !== undefined) patch.corregirEquipos = Boolean(b.corregirEquipos)
    res.json(await actualizarModelo(db, id, patch))
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
        res.status(409).json({ error: `En uso por ${err.usos} ${SUSTANTIVO_USO[entidad]}. Desactívala en su lugar de borrarla.` })
        return
      }
      throw err
    }
  }))
}
