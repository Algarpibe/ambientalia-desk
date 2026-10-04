import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { compararIndicadores, diaEnZona, NOMBRES_ZOHO, parDeIndicador, type Indicador, type Valor } from '@ambientalia/shared'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { aCsv } from '../util/csv'
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

/** RQ-KP-15: formato largo, una fila por ticket e indicador. */
const CABECERAS_CSV = ['ticket_id', 'codigo_servicio', 'columna', 'indicador', 'unidad', 'valor', 'estado', 'motivo', 'fuente_hitos', 'reentrante', 'sin_finalizar', 'formula_zoho', 'valor_zoho']
const siNo = (b: boolean | null): string => (b === null ? '' : b ? 'true' : 'false')
function filasCsv(f: FilaIndicadores): Array<Array<string | number | null>> {
  return f.indicadores.map((i) => [
    f.ticketId, f.codigoServicio, i.columna, NOMBRES_ZOHO[i.columna][0] ?? i.columna, i.unidad,
    valorDe(i.valor), i.valor.tipo === 'valor' ? 'calculado' : 'sin_dato', i.valor.tipo === 'sin_dato' ? i.valor.motivo : null,
    Object.entries(i.hitos).map(([nombre, h]) => `${nombre}: ${h.fuente}`).join('|'),
    siNo(i.reentrante), i.columna === '50_53' || i.columna === '54' ? siNo(i.marcas.includes('sin_finalizar')) : '',
    valorDe(i.formulaZoho), i.valorZoho,
  ])
}

export function registerIndicadoresRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  // Escalera: sesión (401) < administrador (403) < parámetros (400) < lectura. Molde de `analisis.ts`.
  app.get('/api/indicadores', requireAuth(db), requireAdmin, asyncHandler(async (req, res) => {
    const p = validarPeriodo(req.query)
    if (!p.ok) { res.status(400).json({ error: p.error }); return }
    const filas = tablaIndicadores(await leerEntradasIndicadores(db, p))
    if (p.formato === 'csv') {
      res.set('Content-Type', 'text/csv; charset=utf-8')
      res.set('X-Content-Type-Options', 'nosniff')
      res.set('Content-Disposition', `attachment; filename="indicadores-${diaEnZona(new Date()) ?? 'hoy'}.csv"`)
      res.send(aCsv(CABECERAS_CSV, filas.flatMap(filasCsv)))
      return
    }
    // Sólo con lo ya sincronizado (`custom_fields`): ningún fichero, ninguna escritura. Resumen sin veredicto (RQ-KP-16, -17).
    res.json({ periodo: { desde: p.desde, hasta: p.hasta }, tickets: filas.map(serializarFila), comparacion: compararIndicadores(filas.flatMap((f) => f.indicadores.map((i) => parDeIndicador(f.ticketId, i)))) })
  }))
}
