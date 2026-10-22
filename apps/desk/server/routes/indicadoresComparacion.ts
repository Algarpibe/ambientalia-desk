import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { compararIndicadores, parDeIndicador, type ComparacionExportacion, type Flujo } from '@ambientalia/shared'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'
import { decodificarFichero } from '../encuesta/analizarRespuestas'
import { validarPeriodo, validarFlujo, leerEntradasIndicadores, tablaIndicadores, type EntradasIndicadores } from '../indicadores'
import { leerExportacion, type FilaExportacion } from '../comparacion/leerExportacion'
import { cruzarExportacion, repartirSinCruzar, cruzarPorFlujo, type CruceRepartido } from '../comparacion/cruzarExportacion'
import { numerosDeTickets, ticketsConClasificacion } from '../db/ticketsPorId'

// comparacion-exportacion-zoho (F1F-05), RQ-KP-26 y -27: la comparación de los nueve indicadores con la exportación de Zoho. Sólo para
// administradores, SOLO lectura y sin guardar el fichero (S-J). Orden EXACTO: sesión (401) < administrador (403) < multer (413 límite, 400
// campo) < periodo (400) < flujo (400) < sin fichero (400) < lector (400) < consultas. Multer va DESPUÉS de las dos guardas (molde: `encuestaRespuestas.ts`).
// El valor de Zoho sale del lector por `valorDeZoho` y la comparación la arma `compararIndicadores`: no hay segunda lectura ni segundo cálculo.
// Ninguna llamada a la consola ni registro propio: un fallo inesperado cae en el manejador central, y ningún error de aquí lleva celdas.

export const MENSAJE_SIN_EXPORTACION = 'Falta el fichero de la exportación de Zoho'

const conTotal = <T,>(tickets: T[]) => ({ total: tickets.length, tickets })

export function registerIndicadoresComparacionRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  app.post('/api/indicadores/comparacion', requireAuth(db), requireAdmin, crearSubida().single('file'), asyncHandler(async (req, res) => {
    // Sólo `desde`, `hasta` y `flujo` opcional (DD-10, RQ-KP-29): `formato` no existe aquí. Del cuerpo sólo se lee el fichero.
    const p = validarPeriodo({ desde: req.query.desde, hasta: req.query.hasta }), fl = validarFlujo(req.query.flujo)
    if (!p.ok) { res.status(400).json({ error: p.error }); return }; if (!fl.ok) { res.status(400).json({ error: fl.error }); return }
    if (!req.file) { res.status(400).json({ error: MENSAJE_SIN_EXPORTACION }); return }
    const l = leerExportacion(decodificarFichero(req.file.buffer))
    if (!l.ok) { res.status(400).json({ error: l.error }); return }
    // A partir de aquí empiezan las consultas: cuatro de `leerEntradasIndicadores` y una por bloque de «ID» sin cruzar.
    const entradas = await leerEntradasIndicadores(db, p)
    const c = await cruceDeLaPeticion(db, l.filas, entradas, fl.flujo)
    const { soloEnFichero, fueraDelPeriodo, deOtroFlujo } = c
    const filas = tablaIndicadores({ ...entradas, tickets: c.cruzados })
    const porColumna: Record<string, number> = {}
    for (const v of l.ilegibles) porColumna[v.columna] = (porColumna[v.columna] ?? 0) + 1
    const cuerpo: ComparacionExportacion = {
      periodo: { desde: p.desde, hasta: p.hasta }, ...(fl.flujo === null ? {} : { flujo: fl.flujo }),
      fichero: { leidas: l.leidas, rechazadas: l.rechazadas },
      cruce: {
        cruzados: c.cruzados.length, soloEnFichero: conTotal(soloEnFichero), fueraDelPeriodo: conTotal(fueraDelPeriodo), ...(deOtroFlujo === undefined ? {} : { deOtroFlujo: conTotal(deOtroFlujo) }),
        soloEnDesk: conTotal(c.soloEnDesk), numeroDistinto: conTotal(c.numeroDistinto),
        valoresIlegibles: { total: l.ilegibles.length, porColumna, valores: l.ilegibles },
      },
      comparacion: compararIndicadores(filas.flatMap((f) => f.indicadores.map((i) => parDeIndicador(f.ticketId, i)))),
    }
    res.status(200).json(cuerpo)
  }))
}

// filtro-indicadores-por-flujo (F1F-05, RQ-KP-32, D7): se cruza SIEMPRE con todos los del periodo; sin flujo las llamadas son las de hoy (`numerosDeTickets`, el
// mismo número y los mismos «ID» de sentencias) y con flujo la clasificación de los «ID» sin cruzar viene en la MISMA sentencia (`ticketsConClasificacion`).
async function cruceDeLaPeticion(db: Queryable, filas: readonly FilaExportacion[], entradas: EntradasIndicadores, flujo: Flujo | null): Promise<CruceRepartido> {
  const c = cruzarExportacion(filas, entradas.tickets)
  const ids = c.sinCruzar.map((f) => f.id)
  if (flujo === null) return { ...c, ...repartirSinCruzar(c.sinCruzar, await numerosDeTickets(db, ids)) }
  return cruzarPorFlujo(filas, entradas.tickets, entradas.clasificaciones, await ticketsConClasificacion(db, ids), flujo)
}
