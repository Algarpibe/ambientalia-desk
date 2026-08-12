import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { eliminarTicket, TicketNoEncontrado, TicketNoBorrable } from './eliminarTicket'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

/**
 * Las diez tablas, escritas A MANO y no importadas del módulo.
 *
 * Si se importaran, quitar una tabla de la implementación la borraría también de la expectativa y el
 * test seguiría verde mientras deja huérfanas en producción. Duplicarlas es justo lo que hace que la
 * mutación muerda.
 */
const LAS_DIEZ = [
  'remision_fotos', 'remisiones', 'avisos', 'ticket_reads', 'resolution_attachments',
  'attachments', 'conversations', 'ticket_transitions', 'ticket_history', 'tickets',
]

/** Un ticket con AL MENOS una fila en cada una de las nueve hijas. */
async function ticketCompleto(id: string, numero: number, remisionId: string): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, status, subject, managed_by_app) VALUES ($1,$2,$3,$4,true)',
    [id, numero, 'Ingresado', `Asunto ${numero}`])
  await db.query('INSERT INTO remisiones (id, ticket_id, fecha, tipo, resultado) VALUES ($1,$2,$3,$4,$5)',
    [remisionId, id, '2026-03-04', 'entrada', JSON.stringify({ carpetaUrl: 'https://drive.google.com/drive/folders/CAR', pdfId: 'PDF1', docId: 'DOC1', dymoId: 'DYM1' })])
  await db.query('INSERT INTO remision_fotos (id, remision_id, content_b64) VALUES ($1,$2,$3)', [`foto-${id}`, remisionId, 'x'])
  await db.query('INSERT INTO avisos (id, user_id, ticket_id, texto) VALUES ($1,$2,$3,$4)', [`avi-${id}`, 'u-1', id, 'aviso'])
  // Dos usuarios distintos leyendo el MISMO ticket: sin esto, un `WHERE user_id` mal puesto pasaría.
  await db.query('INSERT INTO ticket_reads (ticket_id, user_id, read_at) VALUES ($1,$2,now())', [id, 'u-1'])
  await db.query('INSERT INTO ticket_reads (ticket_id, user_id, read_at) VALUES ($1,$2,now())', [id, 'u-2'])
  await db.query('INSERT INTO resolution_attachments (id, ticket_id, content_b64) VALUES ($1,$2,$3)', [`ra-${id}`, id, 'x'])
  await db.query('INSERT INTO attachments (id, ticket_id, name) VALUES ($1,$2,$3)', [`att-${id}`, id, 'a.pdf'])
  await db.query('INSERT INTO conversations (id, ticket_id, kind) VALUES ($1,$2,$3)', [`con-${id}`, id, 'comment'])
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_name, from_status, to_status, performed_by) VALUES ($1,$2,$3,$4,$5)',
    [id, 'Habilitar', 'Ticket creado', 'Ingresado', 'Admin'])
  await db.query('INSERT INTO ticket_history (id, ticket_id, actor_name) VALUES ($1,$2,$3)', [`his-${id}`, id, 'X'])
}

const contar = async (tabla: string, col: string, valor: string): Promise<number> => {
  const r = await db.query(`SELECT COUNT(*)::int AS n FROM ${tabla} WHERE ${col} = $1`, [valor])
  return Number((r.rows[0] as Record<string, unknown>).n)
}

/** Lo que queda de un ticket en las nueve hijas más la cabecera. */
async function huellaDe(id: string, remisionId: string): Promise<number> {
  let n = await contar('remision_fotos', 'remision_id', remisionId)
  for (const t of ['remisiones', 'avisos', 'ticket_reads', 'resolution_attachments', 'attachments', 'conversations', 'ticket_transitions', 'ticket_history']) {
    n += await contar(t, 'ticket_id', id)
  }
  return n + (await contar('tickets', 'id', id))
}

describe('eliminarTicket', () => {
  it('no deja huérfanas en ninguna de las nueve hijas, y no toca al ticket vecino', async () => {
    await ticketCompleto('app-1', 10000, 'rem-1')
    await ticketCompleto('app-2', 10001, 'rem-2')

    await eliminarTicket(db, 'app-1')

    expect(await huellaDe('app-1', 'rem-1')).toBe(0)
    // 11 filas: 1 por hija + 2 lecturas + la cabecera.
    expect(await huellaDe('app-2', 'rem-2')).toBe(11)
  })

  it('el simulacro devuelve los números pero no escribe nada', async () => {
    await ticketCompleto('app-1', 10000, 'rem-1')
    const antes = await huellaDe('app-1', 'rem-1')

    const r = await eliminarTicket(db, 'app-1', { dryRun: true })

    expect(r.dryRun).toBe(true)
    expect(r.total).toBeGreaterThan(0)
    expect(await huellaDe('app-1', 'rem-1')).toBe(antes)
  })

  it('el simulacro y la ejecución real devuelven lo mismo', async () => {
    await ticketCompleto('app-1', 10000, 'rem-1')
    const seco = await eliminarTicket(db, 'app-1', { dryRun: true })
    const real = await eliminarTicket(db, 'app-1')
    expect(real).toEqual({ ...seco, dryRun: false })
  })

  it('lista las diez tablas en orden de borrado, aunque estén vacías', async () => {
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app-1', 10000, 'Ingresado', true)")
    const r = await eliminarTicket(db, 'app-1', { dryRun: true })

    expect(r.filas.map((f) => f.tabla)).toEqual(LAS_DIEZ)
    // Solo la cabecera: todo lo demás a cero, y aun así presente.
    expect(r.total).toBe(1)
    expect(r.filas.filter((f) => f.borradas > 0).map((f) => f.tabla)).toEqual(['tickets'])
  })

  it('las fotos se borran por su remisión, sin tocar las de otra', async () => {
    await ticketCompleto('app-1', 10000, 'rem-1')
    await ticketCompleto('app-2', 10001, 'rem-2')

    await eliminarTicket(db, 'app-1')

    expect(await contar('remision_fotos', 'remision_id', 'rem-1')).toBe(0)
    expect(await contar('remision_fotos', 'remision_id', 'rem-2')).toBe(1)
  })

  /**
   * El caso que motivó el guardia: `managed_by_app` NO significa «nació en la app». `writeTransition`
   * la pone en `true` en cualquier transición hecha desde Desk, también sobre un ticket de Zoho. Con
   * ese guardia, este ticket se borraría y volvería en la siguiente sincronización.
   */
  it('se niega a borrar un ticket de Zoho aunque tenga managed_by_app, y no borra nada', async () => {
    await ticketCompleto('12345', 987, 'rem-z')

    await expect(eliminarTicket(db, '12345')).rejects.toThrow(TicketNoBorrable)
    expect(await huellaDe('12345', 'rem-z')).toBe(11)
  })

  it('un ticket que no existe lanza TicketNoEncontrado', async () => {
    await expect(eliminarTicket(db, 'app-inventado')).rejects.toThrow(TicketNoEncontrado)
  })

  it('una remisión histórica sin resultado no revienta y se cuenta aparte', async () => {
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app-1', 10000, 'Ingresado', true)")
    await db.query("INSERT INTO remisiones (id, ticket_id, fecha, tipo) VALUES ('rem-h', 'app-1', '2026-01-01', 'entrada')")

    const r = await eliminarTicket(db, 'app-1', { dryRun: true })

    expect(r.drive).toEqual([])
    expect(r.remisionesSinRastro).toBe(1)
  })

  it('devuelve los cuatro enlaces de Drive, y reconstruye la carpeta desde carpetaId', async () => {
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('app-1', 10000, 'Ingresado', true)")
    await db.query('INSERT INTO remisiones (id, ticket_id, fecha, tipo, resultado) VALUES ($1,$2,$3,$4,$5)',
      ['rem-1', 'app-1', '2026-03-04', 'entrada', JSON.stringify({ carpetaUrl: 'https://drive.google.com/drive/folders/CAR', pdfId: 'PDF1', docId: 'DOC1', dymoId: 'DYM1' })])
    // Sin `carpetaUrl` pero con `carpetaId`: la carpeta se reconstruye en vez de perderse.
    await db.query('INSERT INTO remisiones (id, ticket_id, fecha, tipo, resultado) VALUES ($1,$2,$3,$4,$5)',
      ['rem-2', 'app-1', '2026-03-05', 'salida', JSON.stringify({ carpetaId: 'SOLOID' })])

    const r = await eliminarTicket(db, 'app-1', { dryRun: true })

    expect(r.drive).toHaveLength(2)
    expect(r.drive[0]).toEqual({
      remisionId: 'rem-1',
      etiqueta: 'Remisión de entrada del 2026-03-04',
      carpetaUrl: 'https://drive.google.com/drive/folders/CAR',
      documentoUrl: 'https://docs.google.com/document/d/DOC1/edit',
      pdfUrl: 'https://drive.google.com/file/d/PDF1/view',
      dymoUrl: 'https://drive.google.com/file/d/DYM1/view',
    })
    expect(r.drive[1].carpetaUrl).toBe('https://drive.google.com/drive/folders/SOLOID')
    expect(r.remisionesSinRastro).toBe(0)
  })

  it('el resumen trae el ticket legible sin cruzar nada', async () => {
    await ticketCompleto('app-1', 10000, 'rem-1')
    const r = await eliminarTicket(db, 'app-1', { dryRun: true })
    expect(r.ticket).toEqual({ id: 'app-1', numero: 10000, asunto: 'Asunto 10000', estado: 'Ingresado' })
  })
})
