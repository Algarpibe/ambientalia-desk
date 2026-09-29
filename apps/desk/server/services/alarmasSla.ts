import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { ZONA_NEGOCIO, type AlarmaSla, type Estado } from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea, destinatariosDeCargo, marcarEnviados } from '../db/avisos'
import { ticketsConSlaVencido, type TicketConSlaVencido } from '../db/sla'
import { enTransaccion } from '../db/transaccion'
import { dispararAvisos, type AvisoParaEnviar } from '../avisosWebhook'
import { logger } from '../util/logger'

/**
 * Alarmas de SLA vencido (alarmas-horas-habiles, F1B-08; `derivacion-avisos` RQ-AV-15..17; `design.md` D-6).
 * Molde de `avisoRitmoContrato.ts`.
 *
 * **Una vez por entrada, y la unicidad la da la base.** La identidad de una alarma es (ticket, estado, instante de
 * entrada), clave primaria de `public.alarmas_avisadas`. Dentro de la transacción, la PRIMERA sentencia es el `INSERT`
 * de la marca SIN `ON CONFLICT`: si la clave ya existe lanza `23505`, la transacción se revierte y el caso es «ya
 * avisado». No se usa `ON CONFLICT … RETURNING` (pg-mem y Postgres difieren, H1) ni un `SELECT` previo (deja ventana:
 * dos evaluaciones leerían «sin marca» y avisarían las dos). Marca y avisos van por el MISMO cliente; pg-mem no
 * honra el `ROLLBACK`, así que la prueba lo fija por estructura.
 *
 * **Sin ráfaga al desplegar (S-13).** La primera pasada escribe el corte en `public.alarmas_corte` (una fila, nunca
 * se reescribe): lo que ya estaba vencido en el corte se marca con cero avisos y sin correo; la marca de tablero
 * sale igual, porque se lee de la marca. Un reinicio no mueve el corte.
 *
 * **A quién (S-4).** Al cargo de la alarma; si nadie lo tiene —`users.cargo` es texto libre de firma—, a su área de
 * respaldo, con un `warn` que lo dice. El correo sale DESPUÉS de todas las transacciones, en un solo lote, y un
 * fallo del correo no deshace nada.
 */

type Destinatario = { id: string; email?: string; name?: string }
const CLAVE_DUPLICADA = '23505'

/**
 * Marca la entrada vencida y crea un aviso por destinatario, en una transacción. Devuelve los ids de los avisos,
 * o `null` si la entrada ya estaba marcada. Cualquier otro error sale.
 */
export async function marcarYAvisarAlarma(
  db: Queryable,
  v: Pick<TicketConSlaVencido, 'id' | 'estado' | 'desde'>,
  destinatarios: ReadonlyArray<Destinatario>,
  texto: string,
): Promise<string[] | null> {
  try {
    return await enTransaccion(db, async (q) => {
      await q.query(
        'INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ($1,$2,$3,$4)',
        [v.id, v.estado, v.desde, destinatarios.length],
      )
      const ids: string[] = []
      for (const d of destinatarios) ids.push(await crearAviso(q, { userId: d.id, ticketId: v.id, texto }))
      return ids
    })
  } catch (e) {
    if ((e as { code?: string }).code === CLAVE_DUPLICADA) return null
    throw e
  }
}

/** El corte de S-13: se escribe una sola vez (la primera pasada) y después sólo se lee. */
async function corteDeLaPrimeraPasada(db: Queryable, ahora: Date): Promise<Date> {
  await db.query('INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [ahora])
  const r = await db.query('SELECT corte_at FROM public.alarmas_corte WHERE id = 1')
  return new Date((r.rows[0] as { corte_at: string | Date }).corte_at)
}

function textoDelAviso(v: TicketConSlaVencido): string {
  const entro = v.desde.toLocaleString('es-CO', { timeZone: ZONA_NEGOCIO, dateStyle: 'short', timeStyle: 'short' })
  const extra = v.alarma.soloSinOrdenVenta ? ' y sigue sin orden de venta' : v.alarma.marcaTablero ? ', esperando aprobación del cliente' : ''
  return `El ticket #${v.number} lleva más de ${v.horas} horas hábiles en «${v.estado}» (entró el ${entro})${extra}.`
}

/** Los destinatarios de una alarma: el cargo o, si nadie lo tiene, el área de respaldo. */
async function destinatariosDe(db: Queryable, alarma: AlarmaSla): Promise<{ lista: Destinatario[]; sinCargo: boolean }> {
  const delCargo = await destinatariosDeCargo(db, alarma.cargo)
  if (delCargo.length > 0) return { lista: delCargo, sinCargo: false }
  return { lista: await destinatariosDeArea(db, alarma.areaRespaldo, ''), sinCargo: true }
}

/** Una evaluación completa. Un fallo en un ticket no para a los demás. */
export async function avisarAlarmasVencidas(
  db: Queryable,
  config: AppConfig,
  ahora: Date,
  fetchImpl: typeof fetch = fetch,
): Promise<{ avisadas: number; silenciosas: number }> {
  const corte = await corteDeLaPrimeraPasada(db, ahora)
  const vencidos = await ticketsConSlaVencido(db, ahora, corte)
  const clave = (id: string, estado: string, at: Date) => `${id}|${estado}|${at.getTime()}`
  const yaMarcadas = new Set<string>()
  if (vencidos.length > 0) {
    const m = vencidos.map((_, i) => `$${i + 1}`).join(', ')
    const r = await db.query(`SELECT ticket_id, estado, entrada_at FROM public.alarmas_avisadas WHERE ticket_id IN (${m})`, vencidos.map((v) => v.id))
    for (const x of r.rows as Array<{ ticket_id: string; estado: string; entrada_at: string | Date }>) yaMarcadas.add(clave(String(x.ticket_id), x.estado, new Date(x.entrada_at)))
  }

  const porAlarma = new Map<Estado, { lista: Destinatario[]; sinCargo: boolean }>()
  const porCorreo: AvisoParaEnviar[] = []
  let avisadas = 0, silenciosas = 0
  for (const v of vencidos) {
    if (yaMarcadas.has(clave(v.id, v.estado, v.desde))) continue
    try {
      if (v.vencidoEnCorte) {
        if (await marcarYAvisarAlarma(db, v, [], textoDelAviso(v))) silenciosas++
        continue
      }
      if (!porAlarma.has(v.estado)) porAlarma.set(v.estado, await destinatariosDe(db, v.alarma))
      const { lista, sinCargo } = porAlarma.get(v.estado)!
      const texto = textoDelAviso(v)
      const ids = await marcarYAvisarAlarma(db, v, lista, texto)
      if (!ids) continue
      avisadas++
      if (sinCargo) {
        logger.warn({ cargo: v.alarma.cargo, estado: v.estado, ticketId: v.id, avisos: ids.length },
          `Alarma de SLA sin ${v.alarma.cargo}: aviso al área ${v.alarma.areaRespaldo}`)
      }
      ids.forEach((id, i) => {
        const d = lista[i]!
        if (d.email) porCorreo.push({ id, email: d.email, nombre: d.name ?? d.email, texto, ticketNumero: v.number, conCopia: true })
      })
    } catch (e) {
      logger.error({ err: e, ticketId: v.id, estado: v.estado }, 'alarma de SLA: falló un ticket')
    }
  }
  if (silenciosas > 0) logger.info({ silenciosas, corte }, 'alarmas de SLA vencidas antes del corte: marcadas sin avisar (S-13)')

  // El correo, DESPUÉS de todas las transacciones y en un solo lote. `dispararAvisos` nunca lanza; lo que no se
  // selle queda con `enviado_at` NULL, que es la cola de reintento (molde `ticketService.ts:215-219`).
  if (porCorreo.length > 0) {
    try {
      const r = await dispararAvisos(config, porCorreo, fetchImpl)
      if (r.disparado) await marcarEnviados(db, porCorreo.map((a) => a.id))
      else logger.warn({ motivo: r.motivo, avisos: porCorreo.length }, 'alarmas de SLA: no se pudieron mandar por correo')
    } catch (e) {
      logger.warn({ err: e }, 'alarmas de SLA: falló el sellado del correo')
    }
  }
  return { avisadas, silenciosas }
}

/** La pasada periódica (`index.ts:88`, antes del ritmo de contratos y de la sincronización). NUNCA lanza. */
export async function pasadaAlarmas(db: Queryable, config: AppConfig, ahora: Date = new Date(), fetchImpl: typeof fetch = fetch): Promise<void> {
  try {
    await avisarAlarmasVencidas(db, config, ahora, fetchImpl)
  } catch (e) {
    logger.error({ err: e }, 'pasadaAlarmas falló')
  }
}
