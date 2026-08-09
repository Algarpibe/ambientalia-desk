import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/** Un equipo que no se pudo enlazar, con lo justo para buscarlo y corregirlo a mano en Equipos. */
export interface EquipoPendiente {
  id: string
  serial: string
  clienteNombre: string
  /** `ambiguo` = el nombre casa con varios clientes; `sin-cliente` = no casa con ninguno. */
  motivo: 'ambiguo' | 'sin-cliente'
  /** Solo en los ambiguos: los clientes que compiten, para que el humano elija sabiendo cuáles son. */
  candidatos?: string[]
}

export interface ResumenReconciliacion {
  /** Equipos a los que se les acaba de escribir `client_id`. */
  enlazados: number
  /** Su nombre casa con MÁS de un cliente, así que se dejan sin tocar. */
  ambiguos: number
  /** Ningún cliente de Books casa con ese nombre. */
  sinCliente: number
  /** Nunca llegaron a tener nombre de cliente: no hay nada que emparejar. */
  sinNombre: number
  /** Los que hay que arreglar a mano. Es la salida útil del endpoint, no las cifras. */
  pendientes: EquipoPendiente[]
}

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/**
 * Formas societarias que se descartan al comparar. El CSV las omitía casi siempre y Books casi nunca,
 * así que son la diferencia más frecuente entre las dos grafías del MISMO cliente.
 * Se quitan solo al FINAL del nombre: «SAS Institute» empieza por una de ellas y no es una forma legal.
 */
const FORMAS = ['sas esp', 'sa esp', 'sas', 'sa', 'esp', 'ltda', 'eu', 'sca', 'scs', 'ltd', 'inc', 'gmbh', 'llc']

/**
 * Nombre reducido a lo que de verdad identifica al cliente.
 *
 * Quita acentos, mayúsculas y puntuación, colapsa los espacios sobrantes (el CSV traía dobles) y
 * descarta la forma societaria del final. Con eso, «AMBIENTALIA» y «Ambientalia S.A.S.» convergen,
 * que es justo el caso que dejó a ~352 equipos sin `client_id`.
 *
 * Devuelve '' cuando no queda nada: un nombre que era solo puntuación no identifica a nadie y no debe
 * emparejar con otro igual de vacío.
 */
export function normalizarNombreCliente(v: unknown): string {
  let s = String(v ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // acentos fuera: «Bogotá» y «Bogota» son el mismo
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  // Se recorta por el final en bucle porque las formas se acumulan y llegan de dos maneras: «SAS» como
  // palabra, y «S.A.S.» que al perder los puntos queda como LETRAS SUELTAS («s a s»). Quitar solo la
  // lista de formas no bastaba —era el bug que dejaba «ambientalia s a s» sin casar con «ambientalia»—,
  // así que también se descarta cualquier token de una sola letra al final: «Gecelca S.A. E.S.P.» pasa
  // por «gecelca s a e s p» y acaba en «gecelca».
  let recorto = true
  while (recorto) {
    recorto = false
    for (const f of FORMAS) {
      if (s.endsWith(' ' + f)) { s = s.slice(0, -(f.length + 1)).trim(); recorto = true; break }
    }
    if (!recorto && /\s[a-z0-9]$/.test(s)) { s = s.slice(0, -2).trim(); recorto = true }
  }
  return s
}

/**
 * Rellena `equipos.client_id` cruzando el `cliente_nombre` de texto libre con los clientes de Books.
 *
 * La carga inicial de ~352 equipos (un CSV que ya se retiró del código) dejó `client_id` en NULL y el
 * cliente como texto libre con grafías que no casan con Books. Mientras tanto `searchEquipos` acota
 * por cliente cruzando `client_id` **y** contención de nombre en ambos sentidos; cuando esto termine,
 * ese filtro puede pasar a ser solo por `client_id`.
 *
 * **Solo enlaza lo inequívoco.** Si el nombre normalizado casa con varios clientes, el equipo se deja
 * sin tocar y se devuelve en `pendientes`: elegir uno al azar ataría el equipo de un cliente a otro y
 * nadie se enteraría. Lo mismo vale para los que no casan con nadie.
 *
 * **No destructivo**: solo escribe donde `client_id` está NULL. Un enlace ya existente —puesto al dar
 * de alta el equipo en la app, o corregido a mano— manda sobre esto.
 *
 * **Idempotente**: reejecutarlo no cambia nada, porque lo ya enlazado deja de entrar en la consulta.
 *
 * Se compara contra el nombre de contacto **y** el nombre de empresa: el CSV usaba unas veces uno y
 * otras el otro, y exigir que fuera siempre el mismo dejaría fuera a un montón sin razón de negocio.
 *
 * La agregación va en JavaScript y no en SQL a propósito: hay que distinguir «casa con uno» de «casa
 * con varios», y pg-mem —el motor de los tests— no resuelve las subconsultas correlacionadas que eso
 * pediría. Tampoco implementa TRIM ni length(), de ahí que la normalización sea toda de este lado.
 */
export async function reconciliarClientesDeEquipos(
  db: Queryable,
  opts: { dryRun?: boolean } = {},
): Promise<ResumenReconciliacion> {
  const resumen: ResumenReconciliacion = { enlazados: 0, ambiguos: 0, sinCliente: 0, sinNombre: 0, pendientes: [] }

  // Índice nombre normalizado → ids de los clientes que responden a él. Es un Set y no un id porque el
  // conjunto con más de un elemento es justo lo que identifica a los ambiguos. Un mismo cliente que
  // aporta contacto y empresa distintos entra dos veces con el mismo id: eso NO es ambigüedad.
  const clientes = await db.query("SELECT id, name, company_name FROM clients WHERE COALESCE(contact_type,'customer') = 'customer'")
  const porNombre = new Map<string, Set<string>>()
  for (const c of filas(clientes.rows)) {
    const id = String(c.id)
    for (const campo of [c.name, c.company_name]) {
      const k = normalizarNombreCliente(campo)
      if (!k) continue
      if (!porNombre.has(k)) porNombre.set(k, new Set())
      porNombre.get(k)!.add(id)
    }
  }

  const pendientes = await db.query('SELECT id, serial, cliente_nombre FROM equipos WHERE client_id IS NULL')
  for (const e of filas(pendientes.rows)) {
    const id = String(e.id)
    const nombre = String(e.cliente_nombre ?? '')
    const k = normalizarNombreCliente(nombre)
    if (!k) { resumen.sinNombre++; continue }

    const candidatos = porNombre.get(k)
    const base = { id, serial: String(e.serial ?? ''), clienteNombre: nombre }
    if (!candidatos || candidatos.size === 0) {
      resumen.sinCliente++
      resumen.pendientes.push({ ...base, motivo: 'sin-cliente' })
      continue
    }
    if (candidatos.size > 1) {
      resumen.ambiguos++
      resumen.pendientes.push({ ...base, motivo: 'ambiguo', candidatos: [...candidatos].sort() })
      continue
    }
    if (!opts.dryRun) {
      await db.query('UPDATE equipos SET client_id=$1, updated_at=now() WHERE id=$2', [[...candidatos][0], id])
    }
    resumen.enlazados++
  }

  return resumen
}
