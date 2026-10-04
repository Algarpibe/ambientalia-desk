import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Indicador, Valor } from '@ambientalia/shared'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { validarPeriodo, leerEntradasIndicadores, tablaIndicadores, type FilaIndicadores } from '../indicadores'

const valorDe = <T,>(v: Valor<T>): T | null => (v.tipo === 'valor' ? v.valor : null)

/** Un indicador con la forma de RQ-KP-13; `orden_invertido` se queda en el dominio y no se serializa. */
function serializar(i: Indicador) {
  return {
    columna: i.columna, valor: valorDe(i.valor), unidad: i.unidad,
    estado: i.valor.tipo === 'valor' ? 'calculado' : 'sin_dato',
    ...(i.valor.tipo === 'sin_dato' ? { motivo: i.valor.motivo } : {}),
    hitos: Object.entries(i.hitos).map(([nombre, h]) => ({ nombre, dia: h.dia, fuente: h.fuente })),
    reentrante: i.reentrante,
    ...(i.columna === '50_53' || i.columna === '54' ? { sinFinalizar: i.marcas.includes('sin_finalizar') } : {}),
    formulaZoho: valorDe(i.formulaZoho), valorZoho: i.valorZoho,
  }
}
const serializarFila = (f: FilaIndicadores) => ({ ticketId: f.ticketId, codigoServicio: f.codigoServicio, indicadores: f.indicadores.map(serializar) })

export function registerIndicadoresRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  // Escalera: sesión (401) < administrador (403) < parámetros (400) < lectura. Molde de `analisis.ts`.
  app.get('/api/indicadores', requireAuth(db), requireAdmin, asyncHandler(async (req, res) => {
    const p = validarPeriodo(req.query)
    if (!p.ok) { res.status(400).json({ error: p.error }); return }
    const filas = tablaIndicadores(await leerEntradasIndicadores(db, p))
    // `comparacion` llega con el lote 5a; hasta entonces `null`, sin porcentajes inventados. `formato=csv` es del lote 4.
    res.json({ periodo: { desde: p.desde, hasta: p.hasta }, tickets: filas.map(serializarFila), comparacion: null })
  }))
}
