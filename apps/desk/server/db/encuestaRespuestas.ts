import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { enTransaccion } from './transaccion'
import type { FilaEncuesta, FilaRechazada } from '../encuesta/respuesta'

// indicadores-51-55 (F1F-05), RQ-KP-19 y RQ-KP-21: la carga de las respuestas de la encuesta en `public.encuesta_respuestas`.
// No importa el analizador: sólo los tipos de `../encuesta/respuesta`. Consultas sin calificar para `tickets` (la app conecta con
// `search_path=desk,public`) y calificadas para la tabla nueva, que sólo existe en `public`.

export const MOTIVO_TICKET_INEXISTENTE = 'no existe un ticket con ese número'

export interface ResultadoCarga { insertadas: number; duplicadas: number; rechazadas: FilaRechazada[] }

/** Marcadores `$d, $d+1, …` para una lista `IN` (DD-8: pg-mem no ejecuta `= ANY` con arrays ligados). */
const marcadores = (desde: number, n: number): string => Array.from({ length: n }, (_, i) => `$${desde + i}`).join(', ')

function enBloques<T>(xs: readonly T[], tamano: number): T[][] {
  const salida: T[][] = []
  for (let i = 0; i < xs.length; i += tamano) salida.push(xs.slice(i, i + tamano))
  return salida
}

/**
 * Carga las filas ya analizadas en UNA transacción, sin consulta por fila: una lectura de tickets, una de huellas y una
 * escritura de varias filas (cada una por bloques de `trozo`, que sólo se parametriza para probarlo). `insertadas` se cuenta
 * en memoria tras la lectura previa de huellas (DD-7); `ON CONFLICT (huella) DO NOTHING` queda de red. `cargado_por` es el
 * usuario de la sesión y `cargado_at` lo pone la base.
 *
 * Límite declarado: dos cargas simultáneas del mismo fichero dejan la tabla bien (la unicidad es de la base), pero las dos
 * respuestas pueden decir «insertadas».
 */
export async function cargarRespuestas(db: Queryable, filas: readonly FilaEncuesta[], cargadoPor: string, trozo = 5000): Promise<ResultadoCarga> {
  if (filas.length === 0) return { insertadas: 0, duplicadas: 0, rechazadas: [] }
  return enTransaccion(db, async (q) => {
    // 1. Los tickets del lote, por número, en una consulta (una por bloque de `trozo` números distintos).
    const idPorNumero = new Map<number, string>()
    for (const bloque of enBloques([...new Set(filas.map((f) => f.numeroTicket))], trozo)) {
      const r = await q.query(`SELECT id, number FROM tickets WHERE number IN (${marcadores(1, bloque.length)})`, bloque)
      for (const t of r.rows as Array<{ id: unknown; number: unknown }>) idPorNumero.set(Number(t.number), String(t.id))
    }

    // 2 y 3. Ticket inexistente: rechazada. Huella repetida dentro del fichero: duplicada a partir de la segunda.
    const rechazadas: FilaRechazada[] = []
    const candidatas: Array<FilaEncuesta & { ticketId: string }> = []
    const vistas = new Set<string>()
    let duplicadas = 0
    for (const f of filas) {
      const ticketId = idPorNumero.get(f.numeroTicket)
      if (ticketId === undefined) { rechazadas.push({ fila: f.fila, motivo: MOTIVO_TICKET_INEXISTENTE }); continue }
      if (vistas.has(f.huella)) { duplicadas++; continue }
      vistas.add(f.huella)
      candidatas.push({ ...f, ticketId })
    }

    // 4. Las huellas que la tabla ya tiene cuentan como duplicadas.
    const presentes = new Set<string>()
    for (const bloque of enBloques(candidatas.map((f) => f.huella), trozo)) {
      const r = await q.query(`SELECT huella FROM public.encuesta_respuestas WHERE huella IN (${marcadores(1, bloque.length)})`, bloque)
      for (const h of r.rows as Array<{ huella: unknown }>) presentes.add(String(h.huella))
    }
    const nuevas = candidatas.filter((f) => !presentes.has(f.huella))
    duplicadas += candidatas.length - nuevas.length

    // 5. Una escritura de varias filas por bloque; si no hay nuevas, no se emite ninguna.
    for (const bloque of enBloques(nuevas, trozo)) {
      const valores = bloque.map((_, i) => `(${marcadores(i * 5 + 1, 5)})`).join(', ')
      const params = bloque.flatMap((f) => [f.ticketId, f.calificacion, f.respondidaAt, f.huella, cargadoPor])
      await q.query(`INSERT INTO public.encuesta_respuestas (ticket_id, calificacion, respondida_at, huella, cargado_por) VALUES ${valores} ON CONFLICT (huella) DO NOTHING`, params)
    }

    // 6. Las filas nuevas se cuentan en memoria (DD-7).
    return { insertadas: nuevas.length, duplicadas, rechazadas }
  })
}
