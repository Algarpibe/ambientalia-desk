import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { perfilChecklist } from '@ambientalia/shared'
import type { RemisionHistorica } from './remisionesHistoricasSeed'
import { REMISIONES_HISTORICAS } from './remisionesHistoricasSeed'

const J = (v: unknown) => JSON.stringify(v ?? null)

/**
 * Recuento de la importación. Los nombres distinguen **traer un dato** de **haberlo resuelto**, que no
 * es lo mismo: en la primera corrida real, 113 filas traían número de ticket pero solo 90 enlazaron
 * (23 apuntaban a tickets de Zoho que ya no están en la base). Un `conTicket` a secas se lee como
 * "enlazadas" y hace sacar la conclusión contraria.
 */
export interface ImportarRemisionesResumen {
  total: number
  insertadas: number
  yaExistian: number
  /** Filas que traían número de ticket, hayan enlazado o no. */
  conNumeroDeTicket: number
  /** De las anteriores, las que resolvieron a un ticket real. */
  enlazadasATicket: number
  /** Filas sin número de ticket en la hoja. Es legítimo, no un error. */
  sinNumeroDeTicket: number
  /** Traían número pero ese ticket ya no existe en la base. */
  ticketNoEncontrado: number
  enlazadasAEquipo: number
  equipoNoEncontrado: number
  /** Dos equipos distintos cuyo serial coincide al normalizar: no se enlaza ninguno. */
  equipoAmbiguo: number
}

/**
 * Normaliza un serial para poder cruzarlo. Los seriales del histórico son texto tecleado a mano en
 * una hoja de cálculo durante año y medio: sobra un espacio, cambia una mayúscula, y un cruce exacto
 * no enlaza un equipo que sí existe.
 *
 * Se hace en JS y no en SQL (`WHERE UPPER(TRIM(serial)) = ...`) porque pg-mem —el motor de los
 * tests de este repo— no soporta `TRIM` ni `length()`: esa cláusula sería SQL válido en Postgres real
 * pero rompería los tests.
 */
function normalizarSerial(s: string | null | undefined): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').toUpperCase()
}

/**
 * Todos los equipos, indexados por serial normalizado. Una única consulta en vez de una por fila:
 * con 149 filas, dos idas y vueltas cada una habría sido lento, y el cruce por serial de todos modos
 * necesita normalizar en memoria (ver `normalizarSerial`).
 *
 * Si dos equipos DISTINTOS normalizan al mismo serial (p.ej. dos erratas distintas del mismo número
 * de serie), no hay forma de saber cuál es el correcto. Quedarse con el primero en silencio
 * inventaría un enlace, así que la clave se deja en `null`: significa "ambiguo, no enlazar ninguno".
 */
async function mapaEquiposPorSerial(db: Queryable): Promise<Map<string, string | null>> {
  const r = await db.query('SELECT id, serial FROM equipos')
  const mapa = new Map<string, string | null>()
  for (const row of r.rows as Array<{ id: string; serial: string | null }>) {
    const clave = normalizarSerial(row.serial)
    if (!clave) continue
    mapa.set(clave, mapa.has(clave) ? null : String(row.id))
  }
  return mapa
}

/** Todos los tickets, indexados por número. `number` es UNIQUE NOT NULL, así que aquí no hay ambigüedad. */
async function mapaTicketsPorNumero(db: Queryable): Promise<Map<number, string>> {
  const r = await db.query('SELECT id, number FROM tickets')
  const mapa = new Map<number, string>()
  for (const row of r.rows as Array<{ id: string; number: number }>) mapa.set(Number(row.number), String(row.id))
  return mapa
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
 * Precisamente por ser idempotente, el cruce por serial/ticket tiene que acertar a la primera: una
 * fila que hoy entre con `equipo_id` NULL no se arregla reimportando mañana con un cruce mejor,
 * porque `ON CONFLICT DO NOTHING` la salta por existir ya. De ahí la normalización del serial.
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
    conNumeroDeTicket: 0, enlazadasATicket: 0, sinNumeroDeTicket: 0, ticketNoEncontrado: 0,
    enlazadasAEquipo: 0, equipoNoEncontrado: 0, equipoAmbiguo: 0,
  }

  // Dos consultas para las 149 filas, no 298: el resto de la resolución es en memoria.
  const ticketsPorNumero = await mapaTicketsPorNumero(db)
  const equiposPorSerial = await mapaEquiposPorSerial(db)

  for (const fila of filas) {
    // `ticketNumero` es el número de Zoho (texto), no el id: hay que resolverlo contra tickets.number.
    // Algunos números del histórico ya no existen en la base.
    let ticketId: string | null = null
    if (fila.ticketNumero) {
      resumen.conNumeroDeTicket++
      const numero = Number(fila.ticketNumero)
      const id = Number.isFinite(numero) ? ticketsPorNumero.get(numero) : undefined
      if (id) { ticketId = id; resumen.enlazadasATicket++ }
      else resumen.ticketNoEncontrado++
    } else {
      resumen.sinNumeroDeTicket++
    }

    let equipoId: string | null = null
    if (fila.serial) {
      const match = equiposPorSerial.get(normalizarSerial(fila.serial))
      if (match === undefined) resumen.equipoNoEncontrado++
      else if (match === null) resumen.equipoAmbiguo++
      else { equipoId = match; resumen.enlazadasAEquipo++ }
    }

    const perfil = perfilChecklist(fila.marca, fila.modelo)

    const ya = await db.query('SELECT 1 FROM remisiones WHERE id = $1', [fila.id])
    if (ya.rows.length > 0) { resumen.yaExistian++; continue }
    resumen.insertadas++
    if (dryRun) continue

    // `estado: 'ok'`: nunca pasaron por el flujo de n8n, pero el equipo se generó y existe — no es un
    // 'pendiente' a medias. `resultado`, `resuelto_at` y `enviado_at` quedan NULL a propósito: no hay
    // desenlace de n8n que registrar.
    //
    // `created_at` explícito y no el `now()` por defecto: los dos paneles del ticket ORDENAN por esa
    // columna, así que dejarla en el instante de la importación ponía una remisión de 2025 arriba
    // del todo, como si fuera lo último que le pasó al ticket. La fecha de servicio es la buena —es
    // lo que ya hacía `listRemisionesListado`, que ordena por `fecha` antes que por `created_at`—.
    //
    // Se ancla a las 12:00 y no a medianoche: la columna es `timestamptz` y el panel formatea en
    // America/Bogotá, así que un `date` convertido a pelo se pinta como el día ANTERIOR a las 19:00.
    // La expresión es la misma que la del backfill en `schema.sql`, a propósito.
    await db.query(
      `INSERT INTO remisiones
         (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye,
          observaciones, creado_por, estado, empresa, persona_contacto, origen, created_at)
       VALUES ($1,$2,'entrada',$3,$4,$5,$6,$7,$8,$9,$10,'ok',$11,$12,'historico',
               $3::timestamp + interval '12 hours')
       ON CONFLICT (id) DO NOTHING`,
      [fila.id, ticketId, fila.fecha, fila.tipoServicio, perfil, equipoId, fila.serial,
        J(fila.incluye), fila.observaciones, fila.tecnico, fila.empresa, fila.personaContacto],
    )
  }

  return resumen
}
