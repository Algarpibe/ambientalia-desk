import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { perfilChecklist } from '@ambientalia/shared'
import type { RemisionHistorica } from './remisionesHistoricasSeed'
import { REMISIONES_HISTORICAS } from './remisionesHistoricasSeed'

const J = (v: unknown) => JSON.stringify(v ?? null)

export interface ImportarRemisionesResumen {
  total: number
  insertadas: number
  yaExistian: number
  conTicket: number
  sinTicket: number
  ticketNoEncontrado: number
  conEquipo: number
  equipoNoEncontrado: number
}

/**
 * Importa el histórico de remisiones de la hoja de Google (Paso 1 de la migración: una vez importado,
 * el nodo de n8n que sigue escribiendo en la hoja se puede desconectar).
 *
 * `filas` es un parámetro, no `REMISIONES_HISTORICAS` a pelo, para poder probar la función con un
 * puñado de filas sin acoplarla a la semilla real de 149 registros.
 *
 * **Idempotente**: `id` ya es un hash del contenido de la fila (ver `remisionesHistoricasSeed.ts`), así
 * que reimportar no duplica. Se comprueba con un SELECT previo —igual que `seedChecklist`, por ser el
 * patrón seguro en pg-mem de este repo— y el INSERT lleva además `ON CONFLICT (id) DO NOTHING` como
 * cinturón de seguridad ante una re-ejecución concurrente.
 *
 * **`dryRun`** no escribe nada, pero recorre exactamente las mismas resoluciones (ticket, equipo,
 * perfil) que la escritura real, así que el resumen que devuelve es el mismo: sirve para que el
 * usuario vea las cifras ANTES de tocar producción, porque no se sabe de antemano cuántos tickets de
 * Zoho que menciona la hoja siguen existiendo en la base.
 */
export async function importarRemisionesHistoricas(
  db: Queryable,
  opts: { filas?: RemisionHistorica[]; dryRun?: boolean } = {},
): Promise<ImportarRemisionesResumen> {
  const filas = opts.filas ?? REMISIONES_HISTORICAS
  const dryRun = opts.dryRun ?? false

  const resumen: ImportarRemisionesResumen = {
    total: filas.length, insertadas: 0, yaExistian: 0,
    conTicket: 0, sinTicket: 0, ticketNoEncontrado: 0,
    conEquipo: 0, equipoNoEncontrado: 0,
  }

  for (const fila of filas) {
    // `ticketNumero` es el número de Zoho (texto), no el id: hay que resolverlo contra tickets.number,
    // que es integer. Algunos números del histórico ya no existen en la base.
    let ticketId: string | null = null
    if (fila.ticketNumero) {
      resumen.conTicket++
      const numero = Number(fila.ticketNumero)
      const t = Number.isFinite(numero)
        ? await db.query('SELECT id FROM tickets WHERE number = $1', [numero])
        : { rows: [] as Array<{ id: string }> }
      if (t.rows[0]) ticketId = String(t.rows[0].id)
      else resumen.ticketNoEncontrado++
    } else {
      resumen.sinTicket++
    }

    let equipoId: string | null = null
    if (fila.serial) {
      const e = await db.query('SELECT id FROM equipos WHERE serial = $1 LIMIT 1', [fila.serial])
      if (e.rows[0]) { equipoId = String(e.rows[0].id); resumen.conEquipo++ }
      else resumen.equipoNoEncontrado++
    }

    const perfil = perfilChecklist(fila.marca, fila.modelo)

    const ya = await db.query('SELECT 1 FROM remisiones WHERE id = $1', [fila.id])
    if (ya.rows.length > 0) { resumen.yaExistian++; continue }
    resumen.insertadas++
    if (dryRun) continue

    // `estado: 'ok'`: nunca pasaron por el flujo de n8n, pero el equipo se generó y existe — no es un
    // 'pendiente' a medias. `resultado`, `resuelto_at` y `enviado_at` quedan NULL a propósito: no hay
    // desenlace de n8n que registrar.
    await db.query(
      `INSERT INTO remisiones
         (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye,
          observaciones, creado_por, estado, empresa, persona_contacto, origen)
       VALUES ($1,$2,'entrada',$3,$4,$5,$6,$7,$8,$9,$10,'ok',$11,$12,'historico')
       ON CONFLICT (id) DO NOTHING`,
      [fila.id, ticketId, fila.fecha, fila.tipoServicio, perfil, equipoId, fila.serial,
        J(fila.incluye), fila.observaciones, fila.tecnico, fila.empresa, fila.personaContacto],
    )
  }

  return resumen
}
