import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getContacts, getAccounts, getContactDetail, getAccountDetail } from './directory'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('directory repo', () => {
  it('getContacts: nombre compuesto + empresa + phone||mobile', async () => {
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,mobile,account_id) VALUES ('c1','Ana','Pérez','a@b.co','300','a1')")
    const list = await getContacts(db)
    expect(list[0]).toMatchObject({ id: 'c1', name: 'Ana Pérez', company: 'ACME', email: 'a@b.co', phone: '300' })
  })
  it('getAccounts ordena por nombre', async () => {
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a2','Zeta',null)")
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a1','Alfa','900')")
    const list = await getAccounts(db)
    expect(list.map((a) => a.name)).toEqual(['Alfa', 'Zeta'])
  })
})

describe('directory detail', () => {
  it('getContactDetail: info + company + tickets por contact_id', async () => {
    await db.query("INSERT INTO accounts (id,name) VALUES ('a1','ACME')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,email,account_id) VALUES ('c1','Ana','P','a@b.co','a1')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,channel,contact_id,created_time) VALUES ('t1',5,'Asunto','Finalizado','Closed','Email','c1',now())")
    const d = await getContactDetail(db, 'c1')
    expect(d).toMatchObject({ id: 'c1', name: 'Ana P', company: 'ACME' })
    expect(d!.tickets).toHaveLength(1)
    expect(d!.tickets[0]).toMatchObject({ number: '#5', subject: 'Asunto', channel: 'Email' })
  })
  it('getAccountDetail: info + tickets + contactos por account_id', async () => {
    await db.query("INSERT INTO accounts (id,name,nit) VALUES ('a1','ACME','900')")
    await db.query("INSERT INTO contacts (id,first_name,last_name,account_id) VALUES ('c1','Ana','P','a1')")
    await db.query("INSERT INTO tickets (id,number,subject,status,account_id,created_time) VALUES ('t1',5,'X','Ingresado','a1',now())")
    const d = await getAccountDetail(db, 'a1')
    expect(d).toMatchObject({ id: 'a1', name: 'ACME', nit: '900' })
    expect(d!.tickets).toHaveLength(1)
    expect(d!.contacts.map((c) => c.id)).toEqual(['c1'])
  })
  it('null si no existe', async () => {
    expect(await getContactDetail(db, 'nope')).toBeNull()
  })
})
