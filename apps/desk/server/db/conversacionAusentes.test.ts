import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getConversacionTicket } from './conversacion'

/**
 * sync-conversaciones-zoho (1G-01, RQ-TZ-25). El hilo no enseña las conversaciones que Zoho ya no tiene —las que
 * la sincronización marcó con `ausente_en_zoho_at`— ni sus adjuntos. Ocultar no es borrar: las filas siguen en la
 * base y, desmarcadas, vuelven con su adjunto. El filtro vive en el lector `getConversations`, no aquí.
 */
let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const HREF = (a: string) => `/tickets/t1/attachments/${a}`
async function conversacion(id: string, contenido: string, adjunto: string) {
  await db.query(
    `INSERT INTO conversations (id, ticket_id, kind, author_name, is_public, content, content_type, commented_time, source)
     VALUES ($1, 't1', 'comment', 'Zoho', true, $2, 'plainText', '2026-09-01T10:00:00Z', 'zoho')`, [id, contenido])
  await db.query('INSERT INTO attachments (id, conversation_id, ticket_id, name, size, zoho_href) VALUES ($1, $2, $3, $4, 100, $5)',
    ['a-' + id, id, 't1', adjunto, HREF(adjunto)])
}
const marcar = (id: string) => db.query('UPDATE conversations SET ausente_en_zoho_at = now() WHERE id = $1', [id])
const desmarcar = (id: string) => db.query('UPDATE conversations SET ausente_en_zoho_at = NULL WHERE id = $1', [id])
const n = async (tabla: string) => Number(((await db.query(`SELECT count(*) AS n FROM ${tabla}`)).rows[0] as { n: unknown }).n)

describe('getConversacionTicket · conversaciones ausentes en Zoho (RQ-TZ-25)', () => {
  it('una conversación marcada no sale, ni su adjunto; la no marcada sale con el suyo; las filas siguen en la base', async () => {
    await conversacion('vive', 'Sigue en Zoho', 'vive.pdf')
    await conversacion('ausente', 'Ya no está en Zoho', 'ausente.pdf')
    await marcar('ausente')
    const { mensajes } = await getConversacionTicket(db, 't1')
    expect(mensajes.map((m) => m.id)).toEqual(['vive'])
    expect(mensajes[0].attachments).toEqual([{ name: 'vive.pdf', size: expect.any(String), path: '/tickets/t1/attachments/vive.pdf' }])
    expect(JSON.stringify(mensajes)).not.toContain('ausente.pdf')
    expect(await n('conversations')).toBe(2)
    expect(await n('attachments')).toBe(2)
  })
  it('al desmarcarse vuelve con su adjunto', async () => {
    await conversacion('vive', 'Sigue en Zoho', 'vive.pdf')
    await conversacion('ausente', 'Ya no está en Zoho', 'ausente.pdf')
    await marcar('ausente')
    expect((await getConversacionTicket(db, 't1')).mensajes).toHaveLength(1)
    await desmarcar('ausente')
    const { mensajes } = await getConversacionTicket(db, 't1')
    expect(mensajes.map((m) => m.id).sort()).toEqual(['ausente', 'vive'])
    expect(mensajes.find((m) => m.id === 'ausente')?.attachments?.[0].name).toBe('ausente.pdf')
    expect(mensajes.find((m) => m.id === 'vive')?.attachments?.[0].name).toBe('vive.pdf')
  })
  it('CARACTERIZACIÓN: lo que compone la App —transición con comentario y remisión vigente— sigue saliendo con una de Zoho marcada', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await conversacion('ausente', 'Ya no está en Zoho', 'ausente.pdf')
    await marcar('ausente')
    await db.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values)
       VALUES ('t1','Asignar','Ingresado','Asignado','Luz Ángela','2026-09-02T09:00:00Z',$1)`,
      [JSON.stringify({ comment: 'Pasa a diagnóstico', diagnostico: 'Sensor averiado' })])
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,incluye,observaciones,creado_por,estado,created_at)
       VALUES ('r1','t1','entrada','2026-09-03','Calibración','[]'::jsonb,'Llega con el cabezal suelto.','Julián Maya','ok','2026-09-03T14:00:00Z')`)
    const { mensajes } = await getConversacionTicket(db, 't1')
    expect(mensajes.map((m) => m.id)).not.toContain('ausente')
    expect(mensajes.some((m) => m.content === 'Asignar: Ingresado → Asignado\nDiagnostico: Sensor averiado')).toBe(true)
    expect(mensajes.some((m) => m.content.includes('Llega con el cabezal suelto.') && m.content.startsWith('El equipo ingresa para Calibración'))).toBe(true)
  })
})
