import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

export interface ResumenEnlace {
  /** Tickets a los que se les acaba de poner `equipo_id`. */
  enlazados: number
  /** Su serial casa con MÁS de un equipo, así que se dejan sin tocar. */
  ambiguos: number
  /** Tienen serial, pero no hay ningún equipo con ese serial en el inventario. */
  sinEquipo: number
  /** Nunca llegaron a tener serial: el asunto no seguía el patrón del código de servicio. */
  sinSerial: number
}

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** Serial normalizado para comparar. Ver el porqué en la cabecera de `enlazarTicketsConEquipos`. */
const clave = (v: unknown): string => String(v ?? '').trim().toLowerCase()

/**
 * Ata los tickets del histórico a su equipo cruzando `tickets.serial` con `equipos.serial`.
 *
 * Es el segundo paso de un par: `backfillSerialFromSubject` rellena `tickets.serial` leyéndolo del
 * asunto, y esto convierte ese texto en el enlace real. Sin este paso la pestaña HOJA DE VIDA del
 * ticket no se pinta, porque exige `equipo_id` — el serial suelto no le basta.
 *
 * **Solo enlaza lo inequívoco.** `equipos.serial` NO es único (la tabla tiene id propio precisamente
 * por eso), así que un serial puede casar con varios equipos. Esos se dejan sin tocar y se cuentan
 * aparte: elegir uno al azar sería peor que no enlazar, porque ataría el historial de un cliente al
 * equipo de otro y nadie se enteraría jamás.
 *
 * **No destructivo**: solo escribe donde `equipo_id` está NULL. Un enlace ya existente —puesto por la
 * app al crear el ticket, o corregido a mano— manda sobre esto.
 *
 * **Idempotente**: reejecutarlo no cambia nada, porque lo ya enlazado deja de entrar en la consulta.
 *
 * La comparación **no distingue mayúsculas ni espacios sobrantes**, la misma decisión que tomó la
 * siembra del catálogo: el inventario trae la misma grafía escrita de varias formas y comparar
 * literalmente dejaría fuera a la mitad sin ninguna razón de negocio.
 *
 * Incluye los equipos **dados de baja**: siguen siendo el equipo al que ese ticket se refirió, y
 * excluirlos dejaría huecos justo en el historial de los equipos que más lo necesitan.
 *
 * La agregación va en JavaScript y no en SQL a propósito: el cruce necesita distinguir «casa con uno»
 * de «casa con varios», y pg-mem —el motor de los tests— no resuelve las subconsultas correlacionadas
 * que eso pediría.
 */
export async function enlazarTicketsConEquipos(db: Queryable): Promise<ResumenEnlace> {
  const resumen: ResumenEnlace = { enlazados: 0, ambiguos: 0, sinEquipo: 0, sinSerial: 0 }

  // Índice serial → ids de los equipos que lo llevan. Es una LISTA, no un id: la lista con más de un
  // elemento es justo lo que identifica a los ambiguos.
  const inventario = await db.query('SELECT id, serial FROM equipos')
  const porSerial = new Map<string, string[]>()
  for (const e of filas(inventario.rows)) {
    const k = clave(e.serial)
    if (!k) continue
    if (!porSerial.has(k)) porSerial.set(k, [])
    porSerial.get(k)!.push(String(e.id))
  }

  const pendientes = await db.query('SELECT id, serial FROM tickets WHERE equipo_id IS NULL')
  for (const t of filas(pendientes.rows)) {
    const k = clave(t.serial)
    if (!k) { resumen.sinSerial++; continue }
    const candidatos = porSerial.get(k)
    if (!candidatos || candidatos.length === 0) { resumen.sinEquipo++; continue }
    if (candidatos.length > 1) { resumen.ambiguos++; continue }
    await db.query('UPDATE tickets SET equipo_id=$1, updated_at=now() WHERE id=$2', [candidatos[0], String(t.id)])
    resumen.enlazados++
  }

  return resumen
}
