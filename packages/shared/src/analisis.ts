import type { Analisis, AnalisisPunto, AnalisisMes, AnalisisRow } from './types'
import { esAnulado } from './anulacion'; import { JORNADA } from './calendarioLaboral'
function parseDate(s: string | null): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
function inRange(d: Date | null, from: Date | null, to: Date): boolean {
  if (!d) return false
  if (from && d < from) return false
  return d <= to
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function computeAnalisis(rows: AnalisisRow[], from: Date | null, to: Date): Analisis {
  let activos = 0, creados = 0, finalizados = 0
  const servicio: number[] = [], sla: number[] = [], total: number[] = []
  let conPromesa = 0, cumplidos = 0
  const porEstado = new Map<string, number>()
  const porTecnico = new Map<string, number>()
  const porCliente = new Map<string, number>()
  const porMarca = new Map<string, number>()
  const porTipoServicio = new Map<string, number>()
  const porClasificacion = new Map<string, number>()
  const gestion = new Map<string, { sum: number; n: number }>()
  const tend = new Map<string, { creados: number; finalizados: number }>()
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
  const bumpMes = (k: string, f: 'creados' | 'finalizados') => {
    const cur = tend.get(k) ?? { creados: 0, finalizados: 0 }
    cur[f]++
    tend.set(k, cur)
  }

  for (const r of rows) {
    const cerrado = r.statusType === 'Closed'
    const created = parseDate(r.createdAt)
    if (!cerrado) {
      activos++; bump(porEstado, r.status || '—')
      if (created) {
        const edadDias = (to.getTime() - created.getTime()) / 86400000
        if (edadDias >= 0) {
          const g = gestion.get(r.status || '—') ?? { sum: 0, n: 0 }
          g.sum += edadDias; g.n++; gestion.set(r.status || '—', g)
        }
      }
    }
    const fin = parseDate(r.finalizadoAt)
    if (inRange(created, from, to)) {
      creados++
      bump(porTecnico, r.tecnico || 'Sin asignar')
      bump(porCliente, r.cliente || '—')
      bump(porMarca, r.marca || '—')
      bump(porTipoServicio, r.tipoServicio || '—')
      bump(porClasificacion, r.clasificaciones || '—')
      bumpMes(monthKey(created!), 'creados')
    }
    if (cerrado && !esAnulado(r.status) && inRange(fin, from, to)) {
      finalizados++
      bumpMes(monthKey(fin!), 'finalizados')
      if (created && fin) {
        const dias = (fin.getTime() - created.getTime()) / 86400000
        if (dias >= 0) {
          servicio.push(dias); if (r.slaHoras != null && r.totalHoras != null) { sla.push(r.slaHoras); total.push(r.totalHoras) }
          if (r.diasEntrega != null) { conPromesa++; if (dias <= r.diasEntrega) cumplidos++ }
        }
      }
    }
  }

  const puntos = (m: Map<string, number>, top?: number): AnalisisPunto[] => {
    const arr = [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    return top ? arr.slice(0, top) : arr
  }
  const tendencia: AnalisisMes[] = [...tend.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes, creados: v.creados, finalizados: v.finalizados }))

  return {
    activos, creados, finalizados,
    tiempoPromedioDias: servicio.length ? Math.round((servicio.reduce((a, b) => a + b, 0) / servicio.length) * 10) / 10 : null,
    cumplimientoPct: conPromesa ? Math.round((cumplidos / conPromesa) * 100) : null, ...mediasDelReloj(sla, total),
    porEstado: puntos(porEstado),
    porTecnico: puntos(porTecnico, 10),
    porCliente: puntos(porCliente, 10),
    porMarca: puntos(porMarca, 10),
    porTipoServicio: puntos(porTipoServicio, 10),
    porClasificacion: puntos(porClasificacion, 10),
    gestionPorEstado: [...gestion.entries()]
      .map(([label, { sum, n }]) => ({ label, value: Math.round((sum / n) * 10) / 10 }))
      .sort((a, b) => b.value - a.value),
    tendencia,
  }
}

// RQ-TC-76 (F1C-06): las horas hábiles del reloj del SLA pasan a días hábiles de la jornada (9 h, `JORNADA`), media a un decimal.
// Entran sólo los tickets que `tiempoPromedioDias` también cuenta y que traen los dos tiempos; sin ninguno, `null`.
function mediasDelReloj(sla: number[], total: number[]): Pick<Analisis, 'tiempoSlaPromedioDias' | 'tiempoTotalPromedioDias' | 'ticketsConReloj'> {
  const diasMedios = (horas: number[]): number | null =>
    horas.length ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length / (JORNADA.finHora - JORNADA.inicioHora)) * 10) / 10 : null
  return { tiempoSlaPromedioDias: diasMedios(sla), tiempoTotalPromedioDias: diasMedios(total), ticketsConReloj: sla.length }
}
