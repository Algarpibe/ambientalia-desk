# Diseño — CRM rico en Node, Fase 1: ingesta `crm.*` (8 módulos) al hub

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Depende de:** motor de ingesta (booksHub como referencia), worker `apps/hub-sync`, reorg por esquemas (`crm` reservado). Memoria `zoho-hub-arquitectura`.

## Contexto y objetivo

`zoho-hub-sync` (Node) es el motor único de ingesta Zoho→hub (Desk en `desk.*`, Books en `books.*`). Falta **CRM**. La
Fase 1 ingesta 8 módulos de Zoho CRM al esquema **`crm.*`** del hub, como **sistema de registro para apps futuras** (mismo
patrón que Books rico; sin consumidor concreto aún).

**Decisiones (confirmadas):**
- Propósito: centralizar para apps futuras (como Books). Solo en el hub (sin consumidor Desk; no se replica a desk-db).
- Módulos (8): **Leads, Deals, Tasks, Events, Calls, Products, Quotes, Campaigns**. (NO Accounts/Contacts — solapan con
  Desk/Books; NO los módulos custom Facturas/Órdenes — duplican Books.)
- Forma: **columnas planas clave por módulo** (curadas vía `getFields`) **+ `raw jsonb`** (registro completo) — como Books
  rico. Lookups (`{id,name}`) → dos columnas `*_id`/`*_name`.
- Alcance Fase 1: motor genérico CRM + los 8 módulos. Fases futuras: Accounts/Contacts, custom, line items de Quotes.

## Arquitectura (espejo de `booksHub`)

```
packages/zoho-sync/src/crmHub/
  crmClient.ts     ← token CRM (OAuth refresh) + crmFetch (base /crm/v8, auth + reintento 401)
  schema-crm.sql   ← CREATE SCHEMA crm + 8 tablas crm.<módulo>
  migrate.ts       ← migrateCrm(db) (aplica schema-crm.sql; solo lo llama el worker)
  mappers.ts       ← 8 mappers raw CRM → fila (columnas clave + raw; lookups → id/name)
  repo.ts          ← 8 upserts ON CONFLICT(id) + maxModifiedTime(db, módulo)
  sync.ts          ← createCrmSync(): backfill por módulo + syncRecent() (incremental por módulo)
```
Cableado solo en `apps/hub-sync`. `crm.*` vive solo en el hub. Aislado de Desk/Books.

## Auth + config

CRM usa su **propio token/scope** (distinto de Desk y Books):
- `config.ts`: `crmRefreshToken` (`ZOHO_CRM_REFRESH_TOKEN`), `crmClientId`/`crmClientSecret` (`ZOHO_CRM_CLIENT_ID`/`SECRET`,
  fallback a `ZOHO_CLIENT_ID`/`SECRET`), `crmApiDomain` (`ZOHO_CRM_API_DOMAIN` || `www.zohoapis.com`), `crmAccountsDomain`
  (`ZOHO_CRM_ACCOUNTS_DOMAIN` || `accounts.zoho.com`), `syncCrm` (`SYNC_CRM !== 'false'`).
- `crmClient.ts`: `crmFetch(path)` = base `https://{crmApiDomain}/crm/v8`, header `Authorization: Zoho-oauthtoken {token}`,
  refresh por `grant_type=refresh_token` + reintento 401 (idéntico patrón a `books/booksClient.ts`).
- **Scope:** `ZohoCRM.modules.READ` (read-only, cubre los 8 módulos).
- Token se genera al desplegar (canje de grant code, como hicimos hoy con Books).

## Esquema `crm.*` (8 tablas, columnas clave + raw)

Cada tabla: `id text PRIMARY KEY`, las columnas clave del módulo, `raw jsonb NOT NULL`, `modified_time timestamptz`
(de `Modified_Time`), `synced_at timestamptz DEFAULT now()`. Lookups como `*_id`/`*_name` (text). Columnas por módulo
(api_name Zoho → columna):

- **crm.leads:** company, first_name, last_name, full_name, email, phone, mobile, lead_source, lead_status, industry,
  city, pais(Pa_s), departamento(Departamento), cargo(Cargo), is_converted(Converted__s bool), converted_deal_id/_name
  (Converted_Deal), owner_id/_name(Owner), created_time(Created_Time).
- **crm.deals:** deal_name, amount(numeric), stage, type, probability(numeric), closing_date(date), expected_revenue
  (numeric), next_step, account_id/_name(Account_Name), contact_id/_name(Contact_Name), owner_id/_name(Owner),
  numero_ticket(N_mero_Ticket, numeric — enlaza Deal↔ticket Desk), stage_modified_time(timestamptz), created_time.
- **crm.tasks:** subject, status, priority, due_date(date), closed_time(timestamptz), who_id/_name(Who_Id),
  what_id/_name(What_Id), owner_id/_name(Owner), description, created_time.
- **crm.events:** event_title(Event_Title), venue, start_datetime(timestamptz), end_datetime(timestamptz),
  all_day(All_day bool), who_id/_name, what_id/_name, owner_id/_name, meeting_venue(Meeting_Venue__s),
  meeting_provider(Meeting_Provider__s), description, created_time.
- **crm.calls:** subject, call_type, call_purpose, call_result, call_start_time(timestamptz),
  call_duration_seconds(Call_Duration_in_seconds, numeric), outgoing_call_status, dialled_number, who_id/_name,
  what_id/_name, owner_id/_name, created_time.
- **crm.products:** product_name, product_code, unit_price(numeric), product_active(bool), manufacturer,
  categoria(Categor_a), posicion(Posici_n, numeric), vendor_id/_name(Vendor_Name), owner_id/_name, description, created_time.
- **crm.quotes:** quote_number, no_cotizacion(No_Cotizaci_n), subject, quote_stage, valid_till(date),
  fecha_cotizacion(Fecha_de_Cotizaci_n, date), sub_total(numeric), tax(numeric), discount(numeric), grand_total(numeric),
  deal_id/_name(Deal_Name), account_id/_name(Account_Name), contact_id/_name(Contact_Name), owner_id/_name, created_time.
  (Las líneas `Quoted_Items` quedan en `raw` — child table fuera de alcance.)
- **crm.campaigns:** campaign_name, type, status, start_date(date), end_date(date), expected_revenue(numeric),
  budgeted_cost(numeric), actual_cost(numeric), expected_response(numeric), num_sent(Num_sent, numeric),
  parent_campaign_id/_name(Parent_Campaign), owner_id/_name, description, created_time.

(El DDL exacto va en el plan. `crm` no se crea en desk-db — `migrateCrm` solo en el worker.)

## Mappers

Helpers `num`/`str` (como booksHub). Lookups: `lk(raw.Owner)` → `{id: raw.Owner?.id ?? null, name: raw.Owner?.name ?? null}`.
`raw` = registro CRM completo. `modified_time = raw.Modified_Time`. Cada mapper extrae sus columnas clave + raw.

## Flujo de sync

- **Genérico por módulo.** `crmFetch('/{módulo}?fields={lista}&per_page=200&sort_by=Modified_Time&sort_order=desc&page=N')`.
  Respuesta `{ data: [...], info: { more_records, next_page_token, page, per_page } }`. Sin fetch de detalle (getRecords ya
  trae el registro completo).
- **`fields` requerido (CRM v8):** se pasa la lista de api_names de cada módulo (las columnas modeladas + sistema) para que
  `raw` traiga lo necesario. (Lista por módulo definida en el plan.)
- **Backfill (paginación profunda):** CRM page-based topa en ~2000 registros (10 páginas × 200); para módulos grandes se usa
  **cursor `next_page_token`** (`info.next_page_token`) hasta `more_records=false`. El backfill recorre todo por page_token.
- **Incremental:** descendente por `Modified_Time` hasta `MAX(modified_time)` de esa tabla (como Books); page-based basta
  (los cambios recientes son pocas páginas).
- **Resiliencia:** `forEachSafe` por-registro (un registro malo no aborta el módulo) **y** por-módulo (un módulo que falle
  no aborta los demás).
- `syncRecent()` devuelve `{leads, deals, tasks, events, calls, products, quotes, campaigns}` (conteos).

## Cableado (`apps/hub-sync`) + config

- `hubBootstrap`: `migrateCrm(db)` + backfill-si-vacío por módulo (`maxModifiedTime(db,'deals') == null` → backfill).
- `scheduleHubSync`: timer incremental CRM al `intervalMs` (3 min).
- Flag `SYNC_CRM` (default true si hay `crmRefreshToken`). Sin token → se desactiva y loguea (como Books).
- Construcción en el entrypoint: `if (config.crmRefreshToken && config.syncCrm) crmSync = createCrmSync(...)`.

## Pruebas (TDD, pg-mem)

- `migrateCrm`: crea `crm` + las 8 tablas (verificable consultando `crm.<t>`; pg-mem soporta esquemas, ya comprobado).
- Mappers (8): raw CRM → fila; lookups → id/name; `raw` completo; `modified_time`.
- Upserts (8): `ON CONFLICT (id) DO UPDATE`.
- Incremental: respeta watermark `MAX(modified_time)`; se detiene al alcanzar lo viejo.
- Genérico por módulo + resiliencia: un módulo/registro que falla no aborta el resto (`crmFetch` mockeado).
- Verificación estándar: `npm test`, `tsc -b`, `tsc server`, `eslint`, `vite build`.

## Despliegue

1. Generar el **refresh token CRM** (scope `ZohoCRM.modules.READ`) vía grant code + canje (como Books hoy).
2. Setear env en el worker `zoho-hub-sync`: `ZOHO_CRM_REFRESH_TOKEN` (+ opcional client/domain si difieren).
3. Redeploy → `migrateCrm` crea `crm.*`; backfill-si-vacío ingesta los 8 módulos (page_token); incremental cada 3 min.
4. Validar: conteos `crm.<módulo>` vs CRM; logs sin errores; `crm.deals.numero_ticket` poblado donde aplique.

## Fuera de alcance

- Accounts/Contacts y módulos custom (Facturas/Presupuestos/Órdenes/Visitas); line items de Quotes (`Quoted_Items` → raw).
- Réplica de `crm.*` a desk-db / vistas / consumidor (no hay app consumidora aún).
- Rotación de secretos.
