import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DiaCivil } from '@ambientalia/shared'
import { comoDiaCivil } from './calendarioCierres'

/** Un ticket en `Pendiente de facturar` con fecha prevista que todavía no se avisó (facturar-dos-ramas, RQ-AV-23). */
export interface PendienteDeFacturar { id: string; number: number; fechaPrevista: DiaCivil }

/**
 * Los candidatos de la alarma de facturación: tickets en `Pendiente de facturar`, con fecha prevista, cuya marca no es ya
 * esa fecha. NO decide si vencieron: eso es de la regla pura `facturacionVencida` (`packages/shared`). Se compara con
 * `IS NULL OR <>` y no con `IS DISTINCT FROM`, que pg-mem no garantiza (`design.md` D6). La fecha NO se castea (`::text` no lo
 * soporta pg-mem) ni pasa por `diaEnZona`, que la leería como instante de medianoche UTC y en Bogotá daría el día anterior
 * (`fechasDerivadas.ts:58`): se normaliza con `comoDiaCivil` (`calendarioCierres.ts:18`), con getters UTC.
 */
export async function ticketsPendientesDeFacturarSinAvisar(db: Queryable): Promise<PendienteDeFacturar[]> {
  const r = await db.query(
    `SELECT id, number, fecha_prevista_facturacion AS prevista FROM tickets
      WHERE status = 'Pendiente de facturar' AND fecha_prevista_facturacion IS NOT NULL
        AND (facturacion_avisada_para IS NULL OR facturacion_avisada_para <> fecha_prevista_facturacion)
      ORDER BY number`,
  )
  const salida: PendienteDeFacturar[] = []
  for (const x of r.rows as Array<{ id: string; number: number; prevista: unknown }>) {
    const dia = x.prevista == null ? null : comoDiaCivil(x.prevista)
    if (dia !== null) salida.push({ id: String(x.id), number: Number(x.number), fechaPrevista: dia })
  }
  return salida
}
