export interface ClientRow {
  id: string; name: string; company_name: string | null; nit: string | null
  email: string | null; phone: string | null; mobile: string | null
  contact_person: string | null; customer_sub_type: string | null; status: string | null
  source: string; raw: unknown; last_modified_time: string | null
}

export interface SalesOrderRow {
  id: string; number: string; client_id: string | null; customer_name: string | null
  date: string | null; total: number | null; currency_code: string | null; status: string | null
  ticket_number: string | null; potential_name: string | null; salesperson_name: string | null
  source: string; raw: unknown; last_modified_time: string | null
}

export function clientFromBooks(raw: any): ClientRow {
  const name = raw.contact_name ?? raw.company_name ?? ''
  const contactPerson = [raw.first_name, raw.last_name].filter(Boolean).join(' ').trim() || null
  return {
    id: raw.contact_id, name, company_name: raw.company_name ?? null,
    nit: raw.cf_nit ?? raw.custom_field_hash?.cf_nit ?? null,
    email: raw.email ?? null, phone: raw.phone ?? null, mobile: raw.mobile ?? null,
    contact_person: contactPerson, customer_sub_type: raw.customer_sub_type ?? null,
    status: raw.status ?? null, source: 'books', raw, last_modified_time: raw.last_modified_time ?? null,
  }
}

export function salesOrderFromBooks(raw: any): SalesOrderRow {
  return {
    id: raw.salesorder_id, number: raw.salesorder_number ?? '', client_id: raw.customer_id ?? null,
    customer_name: raw.customer_name ?? null, date: raw.date || null,
    total: raw.total != null && raw.total !== '' ? Number(raw.total) : null,
    currency_code: raw.currency_code ?? null, status: raw.status ?? null,
    ticket_number: raw.cf_n_ticket ?? raw.custom_field_hash?.cf_n_ticket ?? null,
    potential_name: raw.zcrm_potential_name ?? null, salesperson_name: raw.salesperson_name ?? null,
    source: 'books', raw, last_modified_time: raw.last_modified_time ?? null,
  }
}
