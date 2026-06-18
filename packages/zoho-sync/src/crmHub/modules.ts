const num = (v: unknown): number | null => (v != null && v !== '' ? Number(v) : null)
const str = (v: unknown): string | null => (v != null && v !== '' ? String(v) : null)
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : v == null ? null : v === 'true')
const ts = (v: unknown): string | null => (v ? String(v) : null)
const lkId = (v: any): string | null => (v && typeof v === 'object' ? v.id ?? null : null)
const lkName = (v: any): string | null => (v && typeof v === 'object' ? v.name ?? null : null)
const lkModule = (v: any): string | null => (v && typeof v === 'object' ? (v.module?.api_name ?? (typeof v.module === 'string' ? v.module : null)) : null)
const J = (v: unknown) => JSON.stringify(v ?? null)

export interface CrmModule {
  table: string
  apiName: string
  fields: string  // csv de api_names para el param ?fields=
  toRow: (raw: any) => Record<string, unknown>
  hasLines?: boolean
}

export const MODULES: CrmModule[] = [
  {
    table: 'leads', apiName: 'Leads',
    fields: 'Company,First_Name,Last_Name,Full_Name,Email,Phone,Mobile,Lead_Source,Lead_Status,Industry,City,Pa_s,Departamento,Cargo,Converted__s,Converted_Deal,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), company: str(r.Company), first_name: str(r.First_Name), last_name: str(r.Last_Name), full_name: str(r.Full_Name), email: str(r.Email), phone: str(r.Phone), mobile: str(r.Mobile), lead_source: str(r.Lead_Source), lead_status: str(r.Lead_Status), industry: str(r.Industry), city: str(r.City), pais: str(r.Pa_s), departamento: str(r.Departamento), cargo: str(r.Cargo), is_converted: bool(r.Converted__s), converted_deal_id: lkId(r.Converted_Deal), converted_deal_name: lkName(r.Converted_Deal), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'deals', apiName: 'Deals',
    fields: 'Deal_Name,Amount,Stage,Type,Probability,Closing_Date,Expected_Revenue,Next_Step,Account_Name,Contact_Name,Owner,N_mero_Ticket,Stage_Modified_Time,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), deal_name: str(r.Deal_Name), amount: num(r.Amount), stage: str(r.Stage), type: str(r.Type), probability: num(r.Probability), closing_date: r.Closing_Date || null, expected_revenue: num(r.Expected_Revenue), next_step: str(r.Next_Step), account_id: lkId(r.Account_Name), account_name: lkName(r.Account_Name), contact_id: lkId(r.Contact_Name), contact_name: lkName(r.Contact_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), numero_ticket: num(r.N_mero_Ticket), stage_modified_time: ts(r.Stage_Modified_Time), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'tasks', apiName: 'Tasks',
    fields: 'Subject,Status,Priority,Due_Date,Closed_Time,Who_Id,What_Id,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), subject: str(r.Subject), status: str(r.Status), priority: str(r.Priority), due_date: r.Due_Date || null, closed_time: ts(r.Closed_Time), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'events', apiName: 'Events',
    fields: 'Event_Title,Venue,Start_DateTime,End_DateTime,All_day,Who_Id,What_Id,Owner,Meeting_Venue__s,Meeting_Provider__s,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), event_title: str(r.Event_Title), venue: str(r.Venue), start_datetime: ts(r.Start_DateTime), end_datetime: ts(r.End_DateTime), all_day: bool(r.All_day), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), meeting_venue: str(r.Meeting_Venue__s), meeting_provider: str(r.Meeting_Provider__s), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'calls', apiName: 'Calls',
    fields: 'Subject,Call_Type,Call_Purpose,Call_Result,Call_Start_Time,Call_Duration_in_seconds,Outgoing_Call_Status,Dialled_Number,Who_Id,What_Id,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), subject: str(r.Subject), call_type: str(r.Call_Type), call_purpose: str(r.Call_Purpose), call_result: str(r.Call_Result), call_start_time: ts(r.Call_Start_Time), call_duration_seconds: num(r.Call_Duration_in_seconds), outgoing_call_status: str(r.Outgoing_Call_Status), dialled_number: str(r.Dialled_Number), who_id: lkId(r.Who_Id), who_name: lkName(r.Who_Id), what_id: lkId(r.What_Id), what_name: lkName(r.What_Id), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'products', apiName: 'Products',
    fields: 'Product_Name,Product_Code,Unit_Price,Product_Active,Manufacturer,Categor_a,Posici_n,Vendor_Name,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), product_name: str(r.Product_Name), product_code: str(r.Product_Code), unit_price: num(r.Unit_Price), product_active: bool(r.Product_Active), manufacturer: str(r.Manufacturer), categoria: str(r.Categor_a), posicion: num(r.Posici_n), vendor_id: lkId(r.Vendor_Name), vendor_name: lkName(r.Vendor_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'quotes', apiName: 'Quotes', hasLines: true,
    fields: 'Quote_Number,No_Cotizaci_n,Subject,Quote_Stage,Valid_Till,Fecha_de_Cotizaci_n,Sub_Total,Tax,Discount,Grand_Total,Deal_Name,Account_Name,Contact_Name,Owner,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), quote_number: str(r.Quote_Number), no_cotizacion: str(r.No_Cotizaci_n), subject: str(r.Subject), quote_stage: str(r.Quote_Stage), valid_till: r.Valid_Till || null, fecha_cotizacion: r.Fecha_de_Cotizaci_n || null, sub_total: num(r.Sub_Total), tax: num(r.Tax), discount: num(r.Discount), grand_total: num(r.Grand_Total), deal_id: lkId(r.Deal_Name), deal_name: lkName(r.Deal_Name), account_id: lkId(r.Account_Name), account_name: lkName(r.Account_Name), contact_id: lkId(r.Contact_Name), contact_name: lkName(r.Contact_Name), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'campaigns', apiName: 'Campaigns',
    fields: 'Campaign_Name,Type,Status,Start_Date,End_Date,Expected_Revenue,Budgeted_Cost,Actual_Cost,Expected_Response,Num_sent,Parent_Campaign,Owner,Description,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), campaign_name: str(r.Campaign_Name), type: str(r.Type), status: str(r.Status), start_date: r.Start_Date || null, end_date: r.End_Date || null, expected_revenue: num(r.Expected_Revenue), budgeted_cost: num(r.Budgeted_Cost), actual_cost: num(r.Actual_Cost), expected_response: num(r.Expected_Response), num_sent: num(r.Num_sent), parent_campaign_id: lkId(r.Parent_Campaign), parent_campaign_name: lkName(r.Parent_Campaign), owner_id: lkId(r.Owner), owner_name: lkName(r.Owner), description: str(r.Description), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
  {
    table: 'visits', apiName: 'Visits',
    fields: 'Visited_By,Visited_Time,Visited_Page,Visited_Page_URL,Referrer,Visit_Source,Visitor_Type,Time_Spent,No_of_Pages,Revenue,Search_Keyword,Search_Engine,Attended_By,Last_Activity_Time,Created_Time,Modified_Time',
    toRow: (r) => ({ id: String(r.id), visited_by_id: lkId(r.Visited_By), visited_by_name: lkName(r.Visited_By), visited_by_module: lkModule(r.Visited_By), visited_time: ts(r.Visited_Time), visited_page: str(r.Visited_Page), visited_page_url: str(r.Visited_Page_URL), referrer: str(r.Referrer), visit_source: str(r.Visit_Source), visitor_type: str(r.Visitor_Type), time_spent: num(r.Time_Spent), no_of_pages: num(r.No_of_Pages), revenue: num(r.Revenue), search_keyword: str(r.Search_Keyword), search_engine: str(r.Search_Engine), attended_by: str(r.Attended_By), last_activity_time: ts(r.Last_Activity_Time), created_time: ts(r.Created_Time), raw: J(r), modified_time: ts(r.Modified_Time) }),
  },
]

/** Mapea una línea del subform Quoted_Items → fila de crm.quote_line_items. */
export function quoteLineRow(quoteId: string, r: any): Record<string, unknown> {
  return { id: String(r.id), quote_id: quoteId, product_id: lkId(r.Product_Name), product_name: lkName(r.Product_Name), description: str(r.Description), quantity: num(r.Quantity), list_price: num(r.List_Price), total: num(r.Total), discount: num(r.Discount), total_after_discount: num(r.Total_After_Discount), tax: num(r.Tax), net_total: num(r.Net_Total), sequence_number: num(r.Sequence_Number), price_book_id: lkId(r.Price_Book_Name), price_book_name: lkName(r.Price_Book_Name), line_tax: J(r.Line_Tax), raw: J(r) }
}

export function byTable(table: string): CrmModule {
  const m = MODULES.find((x) => x.table === table)
  if (!m) throw new Error(`Módulo CRM desconocido: ${table}`)
  return m
}
