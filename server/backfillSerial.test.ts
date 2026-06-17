import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { backfillSerialFromSubject } from './backfillSerial'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('backfillSerialFromSubject', () => {
  it('rellena vacíos desde el asunto, idempotente, no toca managed_by_app', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('h1',1,'Servicio MT_18A19042_EDM180C_260305','Finalizado',false)")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app,serial) VALUES ('app1',2,'X MT_AAA_BBB_260101','Ingresado',true,'APP-SER')")
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('no',3,'Sin codigo','X',false)")
    expect(await backfillSerialFromSubject(db)).toEqual({ updated: 1 })
    const h1 = (await db.query("SELECT serial, codigo_servicio FROM tickets WHERE id='h1'")).rows[0]
    expect(h1).toMatchObject({ serial: '18A19042', codigo_servicio: 'MT_18A19042_EDM180C_260305' })
    expect((await db.query("SELECT serial FROM tickets WHERE id='app1'")).rows[0].serial).toBe('APP-SER')
    expect(await backfillSerialFromSubject(db)).toEqual({ updated: 0 })
  })
})
