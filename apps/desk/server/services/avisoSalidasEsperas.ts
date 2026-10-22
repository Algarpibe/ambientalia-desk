import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { ALARMA_ESPERA, canExecuteTransition, diasEnEspera, enEsperaDe, esperaVencida, hoyEnZona, textoAvisoEspera, type DiaCivil } from '@ambientalia/shared'
import { destinatariosDeArea, destinatariosDeCargoPermiso } from '../db/avisos'
import { ticketsEnEspera, type EsperaEnCurso } from '../db/esperasVencidas'
import { getUserById } from '../auth/users'
import { logger } from '../util/logger'
import { marcarYAvisarAlarma } from './alarmasSla'

/**
 * Alarma de caducidad de las cuatro esperas (salidas-esperas, F1C-03; `derivacion-avisos` RQ-AV-26 y RQ-AV-27; `design.md` D4).
 * Molde de `avisoFacturacionVencida.ts`. Plazos: `plazosEsperas.ts` (79, 13, 31 y 20 días naturales, provisionales).
 *
 * **SUGIERE o ESCALA, y NUNCA ejecuta.** Las externas avisan a Comercial con la decisión por delante (cobrar el diagnóstico o anular);
 * las internas escalan al área responsable sin nombrar ninguna salida. No hay transición ni cambio de estado: sólo la marca y los avisos.
 *
 * **Una sola vez por (ticket, estado, entrada), y la unicidad la da la base.** Se reutiliza `marcarYAvisarAlarma`: el `INSERT` de
 * `public.alarmas_avisadas` va primero en la transacción y la clave duplicada devuelve `null`. La reentrada trae otra entrada y otro aviso.
 *
 * **Destinatarios ANTES de la marca.** Los cargos de la espera; el área de respaldo sólo si nadie los lleva (S-19); en las externas se suma
 * el derivado si es de Comercial y está activo. Lista vacía: NO se marca, se avisa en el log y la pasada siguiente reintenta (S-18).
 *
 * **Sólo bandeja (S-17).** Sin correo.
 */

type Destinatario = { id: string; email?: string; name?: string }

/** Los cargos de la espera o, si nadie los lleva, su área de respaldo. Una vez por estado y pasada. */
async function destinatariosDeLaEspera(db: Queryable, estado: EsperaEnCurso['estado']): Promise<Destinatario[]> {
  const { cargos, areaRespaldo } = ALARMA_ESPERA[estado as keyof typeof ALARMA_ESPERA]
  const porId = new Map<string, Destinatario>()
  for (const cargo of cargos) for (const d of await destinatariosDeCargoPermiso(db, cargo)) porId.set(d.id, d)
  if (porId.size === 0) for (const d of await destinatariosDeArea(db, areaRespaldo, '')) porId.set(d.id, d)
  return [...porId.values()]
}

/** El derivado del ticket, si es de Comercial y está activo. */
async function derivadoDeComercial(db: Queryable, derivadoA: string | null): Promise<Destinatario | null> {
  if (!derivadoA) return null
  const u = await getUserById(db, derivadoA)
  if (!u || !u.active || !canExecuteTransition(u.areas, u.isAdmin, 'Comercial')) return null
  return { id: u.id, email: u.email, name: u.name }
}

/** Evalúa las esperas en curso y avisa las vencidas. Devuelve cuántas avisó. Un fallo en una no para a las demás. */
export async function avisarSalidasEsperas(db: Queryable, hoy: DiaCivil): Promise<number> {
  const base = new Map<string, Destinatario[]>()
  let avisadas = 0
  for (const e of await ticketsEnEspera(db)) {
    try {
      const dias = diasEnEspera(e.desde, hoy)
      if (!esperaVencida(e.estado, dias)) continue
      if (!base.has(e.estado)) base.set(e.estado, await destinatariosDeLaEspera(db, e.estado))
      const lista = new Map((base.get(e.estado) ?? []).map((d) => [d.id, d]))
      if (enEsperaDe(e.estado) === 'externa') {
        const der = await derivadoDeComercial(db, e.derivadoA)
        if (der) lista.set(der.id, der)
      }
      if (lista.size === 0) {
        logger.warn({ ticketId: e.id, estado: e.estado }, `Espera vencida del ticket #${e.number}: sin destinatarios, no se marca y se reintenta`)
        continue
      }
      if (await marcarYAvisarAlarma(db, e, [...lista.values()], textoAvisoEspera(e.estado, e.number, dias))) avisadas++
    } catch (err) {
      logger.error({ err, ticketId: e.id, estado: e.estado }, 'alarma de espera vencida: falló un ticket')
    }
  }
  return avisadas
}

let ultimoDia: DiaCivil | null = null

/**
 * La pasada periódica (`index.ts:88`, detrás de la de facturación vencida): apagado no corre ni consume el día; encendido, como mucho una
 * evaluación por día civil y proceso, y NUNCA lanza, para que un fallo aquí no impida la sincronización.
 */
export async function pasadaSalidasEsperas(db: Queryable, config: Pick<AppConfig, 'salidasEsperas'>, hoy: DiaCivil = hoyEnZona()): Promise<void> {
  if (config.salidasEsperas !== true) return
  if (ultimoDia === hoy) return
  ultimoDia = hoy
  try {
    await avisarSalidasEsperas(db, hoy)
  } catch (e) {
    logger.error({ err: e }, 'pasadaSalidasEsperas falló')
  }
}
