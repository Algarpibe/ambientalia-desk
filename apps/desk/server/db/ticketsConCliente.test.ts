import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { rowToTicket } from '@ambientalia/zoho-sync/db/mappers'
import { getActiveTickets, getClosedTickets, getAllTickets, getTicketWithRefs } from './ticketsConCliente'

/**
 * RQ-TC-34 · «El listado de tickets muestra el nombre del provisional» (F1B-15, lote 1). Los cuatro
 * `LEFT JOIN clients` de `zoho-sync/db/repo.ts` no se tocan: este envoltorio rellena el nombre con una
 * segunda consulta y marca `clienteProvisional`.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('c1','Acme SAS')")
  await db.query("INSERT INTO public.clientes_provisionales (id,razon_social,nit,contacto,telefono,correo,motivo) VALUES ('prov-1','Zeta Provisional','1','a','b','c','m')")
  await db.query("INSERT INTO public.clientes_provisionales (id,razon_social,nit,contacto,telefono,correo,motivo,enlazado_a) VALUES ('prov-2','Ya Enlazado','1','a','b','c','m','c1')")
  const t = (id: string, n: number, cliente: string, tipo: string) =>
    db.query('INSERT INTO tickets (id,number,subject,status,status_type,client_id) VALUES ($1,$2,$3,$4,$5,$6)', [id, n, `T${n}`, 'Ingresado', tipo, cliente])
  await t('tp', 1, 'prov-1', 'Open'); await t('tb', 2, 'c1', 'Open'); await t('te', 3, 'prov-2', 'Open'); await t('tc', 4, 'prov-1', 'Closed')
})

const empresa = (rs: { row: { id: string }; refs: { accountName?: string | null; clienteProvisional?: boolean } }[]) =>
  Object.fromEntries(rs.map((x) => [x.row.id, [x.refs.accountName ?? null, x.refs.clienteProvisional ?? false]]))

describe('ticketsConCliente · nombre y marca del provisional en los cuatro envoltorios', () => {
  it('getActiveTickets: el provisional con su nombre y marca; el de Books, igual que antes', async () => {
    expect(empresa(await getActiveTickets(db, ''))).toEqual({ tp: ['Zeta Provisional', true], tb: ['Acme SAS', false], te: [null, false] })
  })
  it('getAllTickets y getClosedTickets', async () => {
    expect(empresa(await getAllTickets(db, '')).tc).toEqual(['Zeta Provisional', true])
    expect(empresa(await getClosedTickets(db, '', 50, 0))).toEqual({ tc: ['Zeta Provisional', true] })
  })
  it('getTicketWithRefs: ficha con nombre y marca; null si no existe', async () => {
    const f = await getTicketWithRefs(db, 'tp')
    expect(f?.refs).toMatchObject({ accountName: 'Zeta Provisional', clienteProvisional: true })
    expect((await getTicketWithRefs(db, 'tb'))?.refs.clienteProvisional).toBeUndefined()
    expect(await getTicketWithRefs(db, 'no-existe')).toBeNull()
  })
  it('el mapeo a Ticket lleva clienteProvisional sólo cuando es provisional (mappers.ts)', async () => {
    const [p, b] = await Promise.all([getTicketWithRefs(db, 'tp'), getTicketWithRefs(db, 'tb')])
    expect(rowToTicket(p!.row, p!.refs)).toMatchObject({ company: 'Zeta Provisional', clienteProvisional: true })
    expect(rowToTicket(b!.row, b!.refs)).not.toHaveProperty('clienteProvisional')
  })
})
