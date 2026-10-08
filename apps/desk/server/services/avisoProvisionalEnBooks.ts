import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { esNitExento, nitCoincide } from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea } from '../db/avisos'
import { nitExentosActivos } from '../db/nitExentos'
import { contactosDeBooks, parejasYaAvisadas, provisionalesSinEnlazar } from '../db/provisionalEnBooks'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso a Comercial de un cliente provisional cuyo NIT ya está en Books (F1B-19, lotes 2 y 3; `derivacion-avisos` RQ-AV-21;
 * `design.md` §5 y §6). Molde de `alarmasSla.ts:37-57`. `pasadaProvisionalesEnBooks` lo cablea en `index.ts`.
 *
 * **Una vez por pareja (provisional, contacto), y la unicidad la da la base.** Dentro de la transacción la PRIMERA
 * sentencia es el `INSERT` de la marca SIN `ON CONFLICT`: si la clave ya existe lanza `23505`, la transacción se revierte
 * y el caso es «ya avisada». No se usa `ON CONFLICT … RETURNING` (pg-mem y Postgres difieren). La consulta previa de marcas
 * y la captura de `23505` conviven: sin la previa, cada pareja ya avisada abriría una transacción fallida en cada
 * intervalo; la captura cubre sólo la carrera entre dos pasadas.
 *
 * **Sin destinatarios no se marca.** Quien recibe es Comercial (`destinatariosDeArea`), leído UNA vez por pasada y fuera
 * de la transacción: son los mismos para todas las parejas y así el `warn` es uno. Sin nadie no hay fila y la pasada
 * siguiente reintenta; marcar sin avisar dejaría la pareja callada para siempre.
 *
 * **Exentos.** Una pareja con el NIT de cualquiera de sus dos lados en `public.nit_exentos` no se avisa: el consumidor
 * final sería el provisional más frecuente. La comparación es la del alta (`nitCoincide`, `esNitExento`).
 */

export interface ParejaProvisionalBooks { provisionalId: string; razonSocial: string; nit: string; contactoId: string; contactoNombre: string }
const CLAVE_DUPLICADA = '23505'

/** El NIT es el del provisional tal como se tecleó; `contactoNombre` ya viene resuelto (`name ?? id`). */
export function textoAvisoProvisionalEnBooks(p: ParejaProvisionalBooks): string {
  return `El cliente provisional «${p.razonSocial}» (NIT ${p.nit}) coincide por NIT con el contacto de Books «${p.contactoNombre}». Conviene enlazarlos.`
}

/** Parejas que faltan por avisar, ordenadas por provisional y luego por contacto. Sale pronto, sin leer de más, cuando no hay nada. */
export async function parejasPorAvisar(db: Queryable): Promise<ParejaProvisionalBooks[]> {
  const provisionales = await provisionalesSinEnlazar(db)
  if (provisionales.length === 0) return []
  const exentos = await nitExentosActivos(db)
  const candidatos = provisionales.filter((p) => !esNitExento(p.nit, exentos))
  if (candidatos.length === 0) return []
  const contactos = (await contactosDeBooks(db)).filter((c) => !esNitExento(c.nit, exentos))
  const parejas: ParejaProvisionalBooks[] = []
  for (const p of candidatos) {
    for (const c of contactos) {
      if (nitCoincide(p.nit, c.nit)) parejas.push({ provisionalId: p.id, razonSocial: p.razonSocial, nit: p.nit, contactoId: c.id, contactoNombre: c.name })
    }
  }
  parejas.sort((a, b) => (a.provisionalId < b.provisionalId ? -1 : a.provisionalId > b.provisionalId ? 1 : a.contactoId < b.contactoId ? -1 : a.contactoId > b.contactoId ? 1 : 0))
  if (parejas.length === 0) return []
  const yaAvisadas = await parejasYaAvisadas(db, [...new Set(parejas.map((p) => p.provisionalId))])
  return parejas.filter((p) => !yaAvisadas.has(`${p.provisionalId}|${p.contactoId}`))
}

/**
 * Marca la pareja y crea un aviso por destinatario, en una transacción y por el mismo cliente. `true` si avisó; `false` si
 * no había destinatarios (sin abrir transacción) o si la pareja ya estaba marcada. Cualquier otro error sale.
 */
export async function marcarYAvisarPareja(
  db: Queryable,
  p: ParejaProvisionalBooks,
  destinatarios: ReadonlyArray<{ id: string }>,
  texto: string,
): Promise<boolean> {
  if (destinatarios.length === 0) return false
  try {
    return await enTransaccion(db, async (q) => {
      await q.query(
        'INSERT INTO public.provisional_books_avisados (provisional_id, contacto_id, avisos_creados) VALUES ($1,$2,$3)',
        [p.provisionalId, p.contactoId, destinatarios.length],
      )
      for (const d of destinatarios) await crearAviso(q, { userId: d.id, ticketId: null, texto })
      return true
    })
  } catch (e) {
    if ((e as { code?: string }).code === CLAVE_DUPLICADA) return false
    throw e
  }
}

/** Una evaluación completa. Devuelve cuántas parejas avisó. Un fallo en una pareja no para a las demás. */
export async function avisarProvisionalesEnBooks(db: Queryable): Promise<number> {
  const parejas = await parejasPorAvisar(db)
  if (parejas.length === 0) return 0
  const destinatarios = await destinatariosDeArea(db, 'Comercial', '')
  if (destinatarios.length === 0) {
    logger.warn({ parejas: parejas.length }, 'Provisional ya en Books: sin destinatarios en Comercial, no se marca y se reintenta')
    return 0
  }
  let avisadas = 0
  for (const p of parejas) {
    try {
      if (await marcarYAvisarPareja(db, p, destinatarios, textoAvisoProvisionalEnBooks(p))) avisadas++
    } catch (e) {
      logger.error({ err: e, provisionalId: p.provisionalId, contactoId: p.contactoId }, 'aviso de provisional ya en Books: falló una pareja')
    }
  }
  return avisadas
}

/**
 * La pasada periódica (`index.ts:88`, tras la de reclamaciones y antes de la de ritmo y de `sync.syncRecent()`): corre en
 * CADA intervalo, SIN cerrojo diario (la unicidad la da la marca por pareja), y NUNCA lanza, para que un fallo aquí no
 * impida la sincronización.
 */
export async function pasadaProvisionalesEnBooks(db: Queryable): Promise<void> {
  try {
    await avisarProvisionalesEnBooks(db)
  } catch (e) {
    logger.error({ err: e }, 'pasadaProvisionalesEnBooks falló')
  }
}
