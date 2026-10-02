import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { esIdProvisional, puedeEditarCamposRestringidos } from '@ambientalia/shared'
import { getProvisional, enlazarProvisional } from '../db/clientesProvisionales'
import { getEquipo } from '../db/equipos'
import { registrarEdicion } from '../db/equiposCambios'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/**
 * Enlace del cliente provisional (RQ-TC-32) y validación del equipo (RQ-HV-18), F1B-15. Los dos exigen Comercial o
 * administración (`puedeEditarCamposRestringidos`, `packages/shared/src/equipoComercial.ts:31-33`). Precedencia
 * A < B < C < D de `transitions-st` §3.8, nunca por código HTTP: A existencia (`404`) · B permiso (`403`) y estado (`409`) ·
 * C contenido (`422`). Nada de aquí escribe en Zoho ni en `books.*` (RQ-TC-33).
 */
export function registerAltaManualRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.post('/api/clientes-provisionales/:id/enlace', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const b = (req.body ?? {}) as Record<string, unknown>
    const contactId = typeof b.contactId === 'string' ? b.contactId.trim() : ''
    // A · existencia del provisional y del contacto. SUPUESTO: un contactId ausente o con prefijo provisional no se busca
    // en Books —no hay qué buscar, y el prefijo nunca es de Books—, así que su `422` queda en C, detrás de B.
    const provisional = await getProvisional(db, String(req.params.id))
    if (!provisional) { res.status(404).json({ error: 'Cliente provisional no encontrado' }); return }
    const contacto = contactId && !esIdProvisional(contactId) ? await getClient(db, contactId) : null
    if (contactId && !esIdProvisional(contactId) && !contacto) { res.status(404).json({ error: 'El contacto de Books no existe' }); return }
    // B · permiso, y después estado
    if (!puedeEditarCamposRestringidos(user.areas, user.isAdmin)) { res.status(403).json({ error: 'Enlazar un cliente provisional requiere el área Comercial' }); return }
    if (provisional.enlazadoA) { res.status(409).json({ error: 'El cliente provisional ya está enlazado con un contacto de Books' }); return }
    // C · contenido
    if (!contacto) { res.status(422).json({ error: 'Falta el contacto de Books con el que enlazar (no puede ser un cliente provisional)' }); return }
    const hecho = await enlazarProvisional(db, provisional.id, { id: contacto.id, name: contacto.name }, { id: user.id, nombre: user.name })
    if (!hecho) { res.status(409).json({ error: 'El cliente provisional ya está enlazado con un contacto de Books' }); return }
    res.json({ id: provisional.id, enlazadoA: contacto.id, ...hecho })
  }))

  app.post('/api/equipos/:id/validacion', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const id = String(req.params.id)
    // A · existencia
    const equipo = await getEquipo(db, id)
    if (!equipo) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
    // B · permiso, y después estado
    if (!puedeEditarCamposRestringidos(user.areas, user.isAdmin)) { res.status(403).json({ error: 'Validar un equipo requiere el área Comercial' }); return }
    if (!equipo.pendienteValidar) { res.status(409).json({ error: 'El equipo no está pendiente de validar' }); return }
    await registrarEdicion(db, id, [{ campo: 'validacion', anterior: 'pendiente', nuevo: 'validado' }], { id: user.id, nombre: user.name },
      async (q) => { await q.query('UPDATE equipos SET pendiente_validar = false WHERE id = $1', [id]) })
    res.json({ id, pendienteValidar: false })
  }))
}
