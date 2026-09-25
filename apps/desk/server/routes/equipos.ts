import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { urlSegura, cambiosComerciales, CAMPOS_COMERCIALES_RESTRINGIDOS, puedeEditarCamposRestringidos } from '@ambientalia/shared'
import { searchEquipos, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, getEquipoFull, deleteEquipo, getEquipoHistorial, registrarEdicion, listarCambiosEquipo } from '../db/equipos'
import { getModelo } from '../db/catalogo'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

export function registerEquipoRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // `clientId` acota la búsqueda a los equipos de ese cliente. Ya no hace falta resolver el cliente
  // en Books antes de buscar: desde que la acotación es solo por `client_id`, el nombre no participa,
  // así que la búsqueda se ahorra esa consulta. Sin `clientId` devuelve todos, que es la salida del
  // formulario cuando el equipo buscado aún no está enlazado a su cliente.
  app.get('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = req.query.clientId ? String(req.query.clientId) : ''
    res.json(await searchEquipos(db, String(req.query.search ?? ''), clientId))
  }))

  app.get('/api/equipos/manage', requireAuth(db), asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const items = await listEquiposManage(db, String(req.query.search ?? ''), 50, (page - 1) * 50)
    res.json({ items, page })
  }))

  // Un equipo por id. La necesita el panel del ticket para resolver su modelo y pintar la ficha
  // técnica: el detalle del ticket trae `equipoId` pero no `modeloId`, y meter un JOIN a `equipos`
  // en esa consulta —que corre al abrir cada ticket y ya arrastra cinco uniones— sale más caro que
  // una petición ligera y perezosa desde el panel.
  app.get('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const e = await getEquipoFull(db, String(req.params.id))
    if (!e) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
    res.json(e)
  }))

  app.get('/api/equipos/:id/historial', requireAuth(db), asyncHandler(async (req, res) => {
    const h = await getEquipoHistorial(db, String(req.params.id))
    if (!h) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
    res.json({ ...h, cambios: await listarCambiosEquipo(db, String(req.params.id)) })
  }))

  // El catálogo es la fuente de marca/modelo/tipo: se eligen por `modeloId` y el servidor rellena los
  // tres textos a partir de él. No se aceptan del cuerpo — así no pueden divergir del catálogo, que es
  // justo el problema que esta fase cierra (un equipo mal registrado dejaba de ser un error para
  // convertirse en opción oficial del formulario, porque las listas se derivaban de `equipos`).
  app.post('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      const modeloId = b.modeloId ? String(b.modeloId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      if (!modeloId) { res.status(422).json({ error: 'El modelo es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const modelo = await getModelo(db, modeloId)
      if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado' }); return }
      const camposResult = await camposHojaDeVida(db, b)
      if ('error' in camposResult) { res.status(422).json({ error: camposResult.error }); return }
      const campos = camposResult.campos
      const id = await createEquipo(db, {
        serial, marca: modelo.marca, modelo: modelo.nombre, tipo: modelo.tipo,
        clienteNombre: cliente.name, clientId, modeloId,
        fechaAdquisicion: campos.fechaAdquisicion ?? null, fechaFacturaCompra: campos.fechaFacturaCompra ?? null,
        finGarantia: campos.finGarantia ?? null, codigoInterno: campos.codigoInterno ?? null,
        mantenedorId: campos.mantenedorId ?? null, driveUrl: campos.driveUrl ?? null,
      })
      res.status(201).json(await getEquipoFull(db, id))
  }))

  app.patch('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      const actual = await getEquipoFull(db, id)
      if (!actual) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
      }
      // `modeloId` NO es obligatorio aquí, a propósito: el botón «Desactivar» del listado manda un
      // PATCH con solo { active }, y exigir el modelo en cada PATCH rompería esa desactivación. La
      // regla real es «no se puede guardar el FORMULARIO sin modelo» (lo exige quien construye el
      // payload, en una tarea posterior), no «no se puede tocar la fila sin mandar el modelo». Cuando
      // sí viene, se valida igual que en el alta y reescribe los tres textos desde el catálogo.
      if (b.modeloId !== undefined) {
        const modeloId = b.modeloId ? String(b.modeloId) : ''
        if (!modeloId) { res.status(422).json({ error: 'El modelo es obligatorio' }); return }
        const modelo = await getModelo(db, modeloId)
        if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado' }); return }
        patch.modeloId = modeloId; patch.marca = modelo.marca; patch.modelo = modelo.nombre; patch.tipo = modelo.tipo
      }
      const camposResult = await camposHojaDeVida(db, b)
      // Escalón A (mantenedor inexistente): gana a la guarda de área de abajo. Escalón C (fechas,
      // Drive) se retiene y se responde DESPUÉS del 403 (D8, RQ-HV-09 «El escalón B gana al 422 de
      // contenido cuando compiten»).
      if ('error' in camposResult && camposResult.escalon === 'A') { res.status(422).json({ error: camposResult.error }); return }
      // F1B-14 (RQ-HV-09/RQ-HV-10): «cambia» se mide contra el CUERPO CRUDO, no contra
      // `camposResult.campos` —que puede faltar si `camposHojaDeVida` cortó en un escalón C—, así que
      // una fecha con formato inválido SIGUE contando como cambio para la guarda de área.
      const cambios = cambiosComerciales(actual as unknown as Record<string, unknown>, b)
      const cambiosRestringidos = cambios.filter((c) => (CAMPOS_COMERCIALES_RESTRINGIDOS as readonly string[]).includes(c.campo))
      if (cambiosRestringidos.length && !puedeEditarCamposRestringidos(req.user!.areas, req.user!.isAdmin)) {
        res.status(403).json({ error: 'Sólo el área Comercial o un administrador puede cambiar fecha de factura, fin de garantía o mantenedor' })
        return
      }
      if ('error' in camposResult) { res.status(422).json({ error: camposResult.error }); return }
      Object.assign(patch, camposResult.campos)
      if (Object.keys(patch).length) {
        if (cambios.length) {
          await registrarEdicion(db, id, cambios, { id: req.user!.id, nombre: req.user!.name }, (q) => updateEquipo(q, id, patch))
        } else {
          await updateEquipo(db, id, patch)
        }
      }
      if (b.active !== undefined) await setEquipoActive(db, id, Boolean(b.active))
      res.json(await getEquipoFull(db, id))
  }))

  // Borrado físico de un equipo: SOLO super administrador.
  app.delete('/api/equipos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      await deleteEquipo(db, id)
      res.json({ ok: true })
  }))
}

/** Los seis campos comerciales de la hoja de vida (F1B-02), sólo los que llegaron en el cuerpo. */
interface CamposHojaDeVida {
  fechaAdquisicion?: string | null
  fechaFacturaCompra?: string | null
  finGarantia?: string | null
  codigoInterno?: string | null
  mantenedorId?: string | null
  driveUrl?: string | null
}

/**
 * `AAAA-MM-DD` con ida y vuelta por UTC: la regex sola deja pasar `2026-02-30` (RQ-HV-03), que
 * `new Date` normaliza a marzo sin avisar. El precedente de la regex es `routes/remision.ts:127`;
 * no hay validador de fecha en `packages/shared/src`.
 */
function esFechaIso(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v
}

/**
 * Valida y normaliza los seis campos comerciales de la hoja de vida, SIN escribir nada: el llamador
 * decide qué hacer con `campos` (creación completa o `PATCH` parcial). Sólo toca las claves presentes
 * en `b` — `undefined` no entra en `campos`, que es la misma semántica que ya sigue el resto del
 * `PATCH` (`if (b.X !== undefined) …`). Un valor vacío o `null` normaliza a `null` (vaciar el campo).
 *
 * Orden interno —existencia antes que contenido—: mantenedor (`getClient`) primero, luego las tres
 * fechas, y Drive al final. Se corre ENTERO antes de escribir nada, así que un error en Drive tumba
 * también un `codigoInterno` que ya había validado bien: la ruta nunca escribe un subconjunto
 * (ver la prueba de posición de `equipos.test.ts`, regla de mutación 1).
 */
export async function camposHojaDeVida(db: Queryable, b: Record<string, unknown>): Promise<{ error: string; escalon: 'A' | 'C' } | { campos: CamposHojaDeVida }> {
  const campos: CamposHojaDeVida = {}

  if (b.mantenedorId !== undefined) {
    const v = b.mantenedorId ? String(b.mantenedorId) : ''
    if (!v) { campos.mantenedorId = null }
    else {
      const mantenedor = await getClient(db, v)
      // Escalón A (D7, D8): un identificador aportado tal cual, sin resolver antes — igual que
      // `clientId`/`modeloId` del propio PATCH — y no contenido (C), aunque el error se lea parecido.
      if (!mantenedor) return { error: 'Mantenedor no encontrado', escalon: 'A' }
      campos.mantenedorId = v
    }
  }

  if (b.fechaAdquisicion !== undefined) {
    const v = b.fechaAdquisicion ? String(b.fechaAdquisicion) : ''
    if (!v) { campos.fechaAdquisicion = null }
    else if (!esFechaIso(v)) { return { error: 'La fecha de adquisición no es válida', escalon: 'C' } }
    else { campos.fechaAdquisicion = v }
  }
  if (b.fechaFacturaCompra !== undefined) {
    const v = b.fechaFacturaCompra ? String(b.fechaFacturaCompra) : ''
    if (!v) { campos.fechaFacturaCompra = null }
    else if (!esFechaIso(v)) { return { error: 'La fecha de factura de compra no es válida', escalon: 'C' } }
    else { campos.fechaFacturaCompra = v }
  }
  if (b.finGarantia !== undefined) {
    const v = b.finGarantia ? String(b.finGarantia) : ''
    if (!v) { campos.finGarantia = null }
    else if (!esFechaIso(v)) { return { error: 'El fin de garantía no es válido', escalon: 'C' } }
    else { campos.finGarantia = v }
  }

  if (b.codigoInterno !== undefined) {
    const v = b.codigoInterno ? String(b.codigoInterno) : ''
    campos.codigoInterno = v || null
  }

  if (b.driveUrl !== undefined) {
    const v = b.driveUrl ? String(b.driveUrl) : ''
    if (!v) { campos.driveUrl = null }
    else if (urlSegura(v) === null) { return { error: 'El enlace de Drive debe empezar por https:// y no llevar comillas', escalon: 'C' } }
    else { campos.driveUrl = v }
  }

  return { campos }
}
