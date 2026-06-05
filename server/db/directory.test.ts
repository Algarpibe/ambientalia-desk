import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { getContacts, getAccounts } from './directory'

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
