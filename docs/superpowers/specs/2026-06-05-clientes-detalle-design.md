# Diseño — D2: Detalle de Cliente (Contacto / Empresa)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** Continuación de D1 (directorio). Al hacer clic en un contacto o empresa, se abre su **detalle**
replicando **exactamente** las pantallas de Zoho Desk adjuntas (maestro-detalle, columna de Propiedades,
cabecera, pestañas e "Información General" con KPIs + tickets + dona + tiempos).
**Depende de:** D1 (directorio + tablas/endpoints), A (tickets con `contact_id`/`account_id`).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Empresa | datos + **tickets** + **contactos** |
| Clic en ticket | **abre `TicketDetailView`** (cierra Clientes) |
| Layout | **maestro-detalle** (lista a la izquierda, detalle a la derecha) — réplica de las imágenes |
| Métricas sin datos (CSAT, 1ª/2ª respuesta) | **mostrarlas con placeholder** (`0%` / `00:00`) |
| Pestañas extra (Historia, Actividades, …) | **decorativas "Pronto"** (funciona INFORMACIÓN GENERAL y, en empresa, CONTACTOS) |
| Botón "Agregar Ticket" | **abre el modal Nuevo ticket** (CreateTicket) |

## Backend

### Tipos (`shared/types.ts`)
```ts
export interface TicketLite { id: string; number: string; subject: string; status: string; statusType: string | null; channel: string | null; createdAt: string | null; closedAt: string | null; dueDate: string | null }
export interface ContactDetail { id: string; name: string; email: string | null; phone: string | null; mobile: string | null; company: string | null; companyId: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[] }
export interface AccountDetail { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null; address: string | null; website: string | null; owner: string | null; createdAt: string | null; tickets: TicketLite[]; contacts: ContactLite[] }
```

### Repo (`server/db/directory.ts`)
- Helper `ticketsLite(db, col, id)` (col = literal `'contact_id'`|`'account_id'`): `SELECT id, number, subject, status,
  status_type, channel, created_time, closed_time, due_date FROM tickets WHERE {col}=$1 ORDER BY created_time
  DESC NULLS LAST` → `TicketLite[]` (`number → "#"+n`).
- `getContactDetail(db, id)`: `contacts c LEFT JOIN accounts a` por id → info + `company` + `owner`/`createdAt`
  de `raw` (`raw.owner?.name`, `raw.createdTime`) + `tickets = ticketsLite('contact_id')`. `null` si no existe.
- `getAccountDetail(db, id)`: `accounts` por id → info (nit/email/phone/city/address/website) + `owner`/`createdAt`
  de `raw` + `tickets = ticketsLite('account_id')` + `contacts` (los `ContactLite` con `account_id=id`). `null` si
  no existe.

### Endpoints (`server/app.ts`, con `requireAuth(db)`)
- `GET /api/contacts/:id` → `getContactDetail` (404 si null).
- `GET /api/accounts/:id` → `getAccountDetail` (404 si null).

## Frontend

### `ClientesPage` — maestro-detalle
- Estado `selected: { kind: 'contacto' | 'empresa'; id: string } | null`. Las filas del directorio (D1) se vuelven
  **clicables** → `setSelected`.
- Layout: **lista a la izquierda** (más angosta, con su índice A-Z y búsqueda) + **área de detalle a la derecha**.
  Sin selección, el detalle muestra un placeholder ("Selecciona un contacto o empresa"). Con selección, renderiza
  `<ClienteDetalle kind id onSelectTicket onSelectContacto onAgregarTicket />`.
- `onSelectTicket(id)` viene de `App`: cierra Clientes (`setShowClientes(false)`) y abre el ticket
  (`setSelectedTicketId(id)`). `onSelectContacto(id)` → `setSelected({ kind: 'contacto', id })` (cambia el detalle).
  `onAgregarTicket` → abre `CreateTicket`.

### `src/components/ClienteDetalle.tsx`
Réplica de las imágenes:
- Carga `fetchContactDetail(id)` o `fetchAccountDetail(id)` según `kind`.
- **Columna "Propiedades de Contacto/Empresa"** (~300px): Propietario · Correo electrónico · Número de móvil ·
  Número de teléfono · Dirección · (Página web + NIT en Empresa) · Hora de creación · Diseño ("Ambientalia Soporte
  y Servicio Técnico"). Campos vacíos → "—".
- **Cabecera**: avatar (iniciales) + **nombre** + subtítulo (empresa, en contacto) + botón **"Agregar Ticket"**
  (`onAgregarTicket`).
- **Pestañas**: `INFORMACIÓN GENERAL` (activa) · `HISTORIA` · `ACTIVIDADES` · `INTERACCIÓN CON TICKET` · `TICKETS`
  · `ENTRADA DE TIEMPO` · (empresa: `CONTACTOS`) · `CALIFICACIÓN DE SATISFACCIÓN` · `PRODUCTOS`. Solo
  INFORMACIÓN GENERAL (y CONTACTOS en empresa) funcionan; el resto → "Pronto".
- **INFORMACIÓN GENERAL** (cálculo en cliente sobre `tickets`):
  - **KPIs**: Todas las Tickets (`tickets.length`) · Tickets abierto (`statusType !== 'Closed'`) · Tickets atrasados
    (`dueDate < ahora && no cerrado`) · Calificación de satisfacción (**placeholder `0%`**).
  - **Tickets** con sub-tabs **TODO / ABIERTO / EN ESPERA** (EN ESPERA = `status ~ /espera/i`): lista (ícono,
    asunto, `#número · empresa · fecha`, badge de estado **en español**) → clic **`onSelectTicket`**.
  - **Análisis del tráfico**: **dona SVG** por canal (`channel ?? 'Otro'`) con leyenda y % (real).
  - **Tiempo promedio de operación (Últimos 6 meses)**: **Tiempo de resolución** = promedio de
    `closedAt − createdAt` de los cerrados, formato `HH:MM` (real); **Tiempo de primera respuesta** y **Tiempo de
    respuesta** = `00:00` (placeholder).
- **CONTACTOS** (empresa): lista de `contacts` (avatar, nombre, email/teléfono) → clic `onSelectContacto`.

### `src/api/client.ts`
`fetchContactDetail(id): Promise<ContactDetail>`, `fetchAccountDetail(id): Promise<AccountDetail>`.

## Pruebas
- **Repo** (pg-mem): `getContactDetail` (info + company + tickets por `contact_id`); `getAccountDetail` (info +
  tickets por `account_id` + contactos por `account_id`); `null` si no existe.
- **Endpoints** (supertest+sesión): `GET /api/contacts/:id` y `/api/accounts/:id` devuelven el detalle; **404**
  inexistente; **401** sin sesión.
- **Frontend**: sin test (UI); se valida con `tsc`/build.

## Datos (honestidad)
- **Reales**: info del contacto/empresa, tickets, conteos (todas/abierto/atrasados/en espera), dona por canal,
  tiempo de resolución.
- **Placeholder** (no se sincroniza esa data de Zoho): CSAT (`0%`), tiempos de 1ª/2ª respuesta (`00:00`).
- `owner`/`createdAt` salen del `raw` de Zoho si están; si no, "—".

## Fuera de alcance (D2)
- Construir las pestañas Historia/Actividades/Interacción/Entrada de tiempo/Productos/Calificación del contacto.
- Precargar el contacto/empresa en "Nuevo ticket".
- CSAT y tiempos de respuesta reales (requieren sync de hilos/SLA — futuro).
- Editar/crear/eliminar contactos o empresas.
