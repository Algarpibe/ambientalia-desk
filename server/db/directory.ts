import type { Queryable } from './migrate'
import type { ContactLite, AccountLite } from '../../shared/types'

export async function getContacts(db: Queryable): Promise<ContactLite[]> {
  const r = await db.query(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.mobile, a.name AS company
     FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id
     ORDER BY lower(c.first_name) NULLS LAST, lower(c.last_name) NULLS LAST`,
  )
  return (r.rows as any[]).map((x) => {
    const name = `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim() || x.email || '—'
    return { id: x.id, name, company: x.company ?? null, email: x.email ?? null, phone: x.phone || x.mobile || null }
  })
}

export async function getAccounts(db: Queryable): Promise<AccountLite[]> {
  const r = await db.query('SELECT id, name, nit, email, phone, city FROM accounts ORDER BY lower(name)')
  return (r.rows as any[]).map((x) => ({ id: x.id, name: x.name ?? '', nit: x.nit ?? null, email: x.email ?? null, phone: x.phone ?? null, city: x.city ?? null }))
}
