import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { saveResolution, getResolution, addResolutionAttachment, getResolutionAttachmentContent, deleteResolutionAttachment } from './resolutions'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('resolutions repo', () => {
  it('guarda/lee resolución y adjuntos (round-trip base64)', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await saveResolution(db, 't1', '<p>Listo</p>', 'Ana')
    const att = await addResolutionAttachment(db, { ticketId: 't1', filename: 'foto.png', contentType: 'image/png', contentB64: 'aGVsbG8=', size: 5, by: 'Ana' })
    const res = await getResolution(db, 't1')
    expect(res.html).toBe('<p>Listo</p>')
    expect(res.updatedBy).toBe('Ana')
    expect(res.attachments).toEqual([{ id: att.id, filename: 'foto.png', contentType: 'image/png', size: 5 }])
    const content = await getResolutionAttachmentContent(db, 't1', att.id)
    expect(content).toMatchObject({ contentType: 'image/png', contentB64: 'aGVsbG8=' })
    await deleteResolutionAttachment(db, 't1', att.id)
    expect((await getResolution(db, 't1')).attachments).toHaveLength(0)
  })
})
