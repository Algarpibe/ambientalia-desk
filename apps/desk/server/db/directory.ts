import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { ContactLite, AccountLite, ContactDetail, AccountDetail, TicketLite } from '@ambientalia/shared'

export async function getContacts(db: Queryable): Promise<ContactLite[]> {
  const r = await db.query(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.mobile, c.account_id, a.name AS company
     FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id
     ORDER BY lower(c.first_name) NULLS LAST, lower(c.last_name) NULLS LAST`,
  )
  return (r.rows as any[]).map((x) => {
    const name = `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim() || x.email || '—'
    return { id: x.id, name, company: x.company ?? null, companyId: x.account_id ?? null, email: x.email ?? null, phone: x.phone || x.mobile || null }
  })
}

export async function getAccounts(db: Queryable): Promise<AccountLite[]> {
  const r = await db.query('SELECT id, name, nit, email, phone, city FROM accounts ORDER BY lower(name)')
  return (r.rows as any[]).map((x) => ({ id: x.id, name: x.name ?? '', nit: x.nit ?? null, email: x.email ?? null, phone: x.phone ?? null, city: x.city ?? null }))
}

async function ticketsLite(db: Queryable, col: 'contact_id' | 'account_id', id: string): Promise<TicketLite[]> {
  const r = await db.query(
    `SELECT id, number, subject, status, status_type, channel, created_time, closed_time, due_date
     FROM tickets WHERE ${col}=$1 ORDER BY created_time DESC NULLS LAST`, [id])
  return (r.rows as any[]).map((x) => ({
    id: x.id, number: `#${x.number}`, subject: x.subject ?? '', status: x.status ?? '',
    statusType: x.status_type ?? null, channel: x.channel ?? null,
    createdAt: x.created_time ?? null, closedAt: x.closed_time ?? null, dueDate: x.due_date ?? null,
  }))
}

function parseRaw(raw: unknown): any { return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {}) }

export async function getContactDetail(db: Queryable, id: string): Promise<ContactDetail | null> {
  const r = await db.query('SELECT c.*, a.name AS company FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id WHERE c.id=$1', [id])
  const row = (r.rows as any[])[0]
  if (!row) return null
  const raw = parseRaw(row.raw)
  return {
    id: row.id, name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email || '—',
    email: row.email ?? null, phone: row.phone ?? null, mobile: row.mobile ?? null,
    company: row.company ?? null, companyId: row.account_id ?? null,
    owner: raw.owner?.name ?? null, createdAt: raw.createdTime ?? row.created_at ?? null,
    tickets: await ticketsLite(db, 'contact_id', id),
  }
}

export async function getAccountDetail(db: Queryable, id: string): Promise<AccountDetail | null> {
  const r = await db.query('SELECT * FROM accounts WHERE id=$1', [id])
  const row = (r.rows as any[])[0]
  if (!row) return null
  const raw = parseRaw(row.raw)
  const cr = await db.query('SELECT id, first_name, last_name, email, phone, mobile FROM contacts WHERE account_id=$1 ORDER BY lower(first_name) NULLS LAST', [id])
  const contacts = (cr.rows as any[]).map((x) => ({
    id: x.id, name: `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim() || x.email || '—',
    company: row.name ?? null, companyId: id, email: x.email ?? null, phone: x.phone || x.mobile || null,
  }))
  return {
    id: row.id, name: row.name ?? '', nit: row.nit ?? null, email: row.email ?? null, phone: row.phone ?? null,
    city: row.city ?? null, address: row.address ?? null, website: row.website ?? null,
    owner: raw.owner?.name ?? null, createdAt: raw.createdTime ?? row.created_at ?? null,
    tickets: await ticketsLite(db, 'account_id', id), contacts,
  }
}
