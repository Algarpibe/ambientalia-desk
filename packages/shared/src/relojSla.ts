import type { Estado } from './estados'
import { horasHabilesEntre, type DiaCivil } from './calendarioLaboral'

/**
 * EL RELOJ DEL SLA DE c7 (F1C-06; RQ-TC-73 y RQ-TC-74), en horas HÁBILES.
 *
 * ⚠️ ESTE es el reloj del SLA de `decision/c7-reloj-sla`. Lo que `sla.ts:5` titula «EL RELOJ DEL SLA»
 * son ALARMAS de permanencia: siguen midiendo en su estado y no leen esta lista (`R08.4.md:1878`, «La
 * alarma y el reloj son independientes»).
 *
 * LA LISTA ES PROPIA DEL RELOJ, declarada a mano, y NO se deriva de la vista. Hoy coincide con las
 * `externa` de `CLASIFICACION_EN_ESPERA` salvo en `Pendiente`, que la vista marca `externa` y el
 * reloj NO para (c7: «mientras tanto, el reloj corre»). Si el tablero cambia mañana, el SLA no se
 * mueve. De `./estados` sólo se importa el TIPO `Estado`, que se borra al compilar: `satisfies` hace
 * que un nombre mal escrito rompa `tsc`, y el guardián de `relojSla.test.ts` prohíbe cualquier
 * `import` de valor desde ese fichero y los nombres de la vista.
 *
 * Es una función pura: no lee la base, no mira el reloj de la máquina y no calcula días hábiles por
 * su cuenta —cada tramo se mide con `horasHabilesEntre` (`calendarioLaboral.ts:174`)—. Quién arma la
 * secuencia de estados de cada ticket es el servidor.
 */

/** Los estados en que la demora no es de Ambientalia: el reloj del SLA se detiene (RQ-TC-73). */
export const ESTADOS_QUE_PARAN_EL_RELOJ = [
  'Notificación cliente', 'Por Entregar', 'Por Entregar / Sin facturar', 'En Espera de Repuestos', 'Servicio externo',
] as const satisfies readonly Estado[]

/** El ticket ya cerró: el tiempo posterior a estos estados no cuenta en ningún reloj (RQ-TC-74). */
export const ESTADOS_TERMINALES_DEL_RELOJ = ['Finalizado', 'Anulado'] as const satisfies readonly Estado[]

/** Una entrada de la secuencia de un ticket: estuvo en `estado` desde `desde`. */
export interface PasoDelReloj { estado: string; desde: Date | string }

/** Los dos tiempos, en horas hábiles: el del SLA (sin pausas) y el total que esperó el cliente. */
export interface TiemposDelReloj { slaHoras: number; totalHoras: number }

/** ¿Este estado detiene el reloj del SLA? */
export function paraElReloj(estado: string): boolean {
  return (ESTADOS_QUE_PARAN_EL_RELOJ as readonly string[]).includes(estado)
}

const esTerminal = (estado: string): boolean => (ESTADOS_TERMINALES_DEL_RELOJ as readonly string[]).includes(estado)

/**
 * Los dos tiempos de un ticket a partir de su secuencia de estados. Cada tramo va desde su `desde`
 * hasta el del siguiente; el último llega hasta `hasta`. Un tramo terminal no suma a nada, una pausa
 * suma sólo al total y el resto suma a los dos. Sin entradas, o con un `desde` inválido, no hay dato
 * (`null`): nunca `0`, que sería inventarlo.
 */
export function tiemposDelReloj(pasos: readonly PasoDelReloj[], hasta: Date, cierres: ReadonlySet<DiaCivil>): TiemposDelReloj | null {
  if (pasos.length === 0) return null
  const tramos = pasos.map((p) => ({ estado: p.estado, desde: new Date(p.desde) }))
  if (tramos.some((t) => Number.isNaN(t.desde.getTime()))) return null
  tramos.sort((x, y) => x.desde.getTime() - y.desde.getTime()) // copia propia, y el orden estable respeta el de entrada
  let slaHoras = 0, totalHoras = 0
  tramos.forEach((t, i) => {
    if (esTerminal(t.estado)) return
    const fin = i + 1 < tramos.length ? tramos[i + 1].desde : hasta
    const horas = horasHabilesEntre(t.desde, fin.getTime() > hasta.getTime() ? hasta : fin, cierres)
    totalHoras += horas
    if (!paraElReloj(t.estado)) slaHoras += horas
  })
  return { slaHoras, totalHoras }
}
