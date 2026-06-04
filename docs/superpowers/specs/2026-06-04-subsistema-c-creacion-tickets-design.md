# Diseño — Subsistema C: Creación de tickets en la app

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** programa "reemplazar Zoho Desk" / autonomía de la plataforma.
**Depende de:** A (Postgres tipado, `ticket_number_seq`, mappers/repo), B (motor de transiciones + `ticket_transitions` + `applyTransition`), H1 (sesiones, `requireAuth`), **I (clientes + órdenes de venta de Zoho Books, endpoints `/api/clients` y `/api/sales-orders`)**.

## Objetivo

Permitir crear tickets **dentro de la plataforma** (no en Zoho), pivotando en una **Orden de Venta** de
Zoho Books para autocompletar cliente + Orden de Venta, armando el **asunto estandarizado** + Código
Servicio del Blueprint, y dejando el ticket en el estado inicial **"OV asignada"** para que el motor de
transiciones (B) continúe el flujo. El ticket nace **gestionado por la app** (`managed_by_app=true`,
`source='app'`), con número propio de `ticket_number_seq`.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Quién puede crear | **Cualquier usuario autenticado** (sin gate por área) |
| Orden de Venta | **Opcional**: con OV autocompleta; sin OV se elige cliente y se teclea lo necesario |
| Fuente de cliente | **Clientes de Books** (`/api/clients`); con OV se deriva de la OV |
| Escritura en Books | **No** (solo lectura). Se guarda `salesorder_id` + número de OV en el ticket para trazar |
| Estado inicial | **"OV asignada"** (transición #1 del Blueprint), `managed_by_app=true`, `source='app'` |
| Asunto/Código | Autogenerados con **vista previa editable** |
| Equipos | Texto libre (sin registro de equipos; eso es Remisiones) |

## Convención del asunto (Blueprint)

- **Código Servicio** = `PREFIJO_Serie_Modelo_AAMMDD` (fecha = hoy). Ej.: `MT_18A20070_EDM180C_260604`.
- **Asunto** = `Servicio Técnico {Cliente} {Tipo de equipo} {Código Servicio}`.
  Ej.: `Servicio Técnico Gecelca S.A. E.S.P. Monitor de partículas MT_18A20070_EDM180C_260604`.
- **Prefijos:** MT (mantenimiento/ST), CG (calibración), HV (equipo nuevo/Hoja de Vida), SR (soporte
  remoto), PRO (protocolos).

## Modelo de datos (`tickets`)

**Reusa** columnas tipadas existentes: `subject`, `classification` (Clasificaciones), `tipo_servicio`,
`equipo` (tipo de equipo), `marca`, `modelo`, `serial`, `codigo_servicio`, `orden_venta`, `priority`,
`status`, `status_type`, `number`, `managed_by_app`, `source`.

**Columnas nuevas** (idempotentes, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en `schema.sql`):
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id text;       -- → clients.id (Books)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS salesorder_id text;   -- → sales_orders.id (Books)
```
`account_id` queda `null` en los tickets creados por la app (usan `client_id`).

**Resolución de empresa en el tablero:** `getActiveTickets` y `getTicketWithRefs` (en `server/db/repo.ts`)
añaden `LEFT JOIN clients c ON t.client_id=c.id` y devuelven
`COALESCE(a.name, c.name) AS account_name`. Así la empresa se muestra igual para tickets de Desk
(`accounts`) y de la app (`clients`) — **sin cambios en el frontend del tablero**.

## Constructor de asunto/código (`shared/ticketCreate.ts`, puro, TDD)

- `buildCodigoServicio({ prefijo, serie, modelo, fecha }): string` → `PREFIJO_serie_modelo_AAMMDD`
  (fecha `Date` → `AAMMDD`; componentes vacíos se omiten con guiones bajos colapsados).
- `buildSubject({ cliente, tipoEquipo, codigo }): string` → `Servicio Técnico {cliente} {tipoEquipo} {codigo}`
  (colapsa espacios).
- `parseCodigoFromPotential(potentialName): { prefijo, serie, modelo } | null` — extrae el código de un
  `zcrm_potential_name` cuando contiene `PREFIJO_SERIE_MODELO_AAMMDD` (prefijos válidos MT/CG/HV/SR/PRO);
  si no, `null`. Usado para prefill (editable) cuando se elige una OV.
- `PREFIJOS` y `TIPOS_SERVICIO` y `CLASIFICACIONES` como constantes exportadas (alimentan los desplegables
  del frontend y la validación).

## Backend

### Repo (`server/db/repo.ts`)
`createTicket(db, input): Promise<TicketDetail>` — en **transacción** (`PoolLike.connect()` BEGIN/COMMIT/
ROLLBACK, con fallback secuencial como `applyTransition`):
1. `number = nextTicketNumber(db)`.
2. `INSERT INTO tickets` con: `id` (`app-${randomUUID()}`), `number`, `subject`, `status='OV asignada'`,
   `status_type='Open'`, `classification`, `tipo_servicio`, `equipo`, `marca`, `modelo`, `serial`,
   `codigo_servicio`, `orden_venta`, `priority`, `client_id`, `salesorder_id`, `managed_by_app=true`,
   `source='app'`, `created_time=now()`, `modified_time=now()`.
3. `INSERT INTO ticket_transitions` representando la transición #1 (`from_status=null`/'(creación)',
   `to_status='OV asignada'`, `transition_name='Enviar'`, `area='Comercial'`, `performed_by`=actor,
   `values` = `{ orden_venta }`).
4. Devuelve `getTicketWithRefs(db, id)` → `TicketDetail`.

Tipo `CreateTicketInput`:
`{ subject, codigoServicio, classification, tipoServicio, equipo, marca, modelo, serial, ordenVenta?, priority?, clientId, salesorderId?, actor }`.

### Endpoint (`server/app.ts`)
`POST /api/tickets` (bajo `requireAuth(db)`; nota: hoy `/api/tickets` GET ya está montado — el POST se
registra en el mismo router con su propia `requireAuth`). Cuerpo:
`{ salesOrderId?, clientId?, tipoServicio, clasificaciones, tipoEquipo, marca, modelo, serie, prefijo, ordenVenta?, prioridad?, subject?, codigoServicio? }`.

Lógica:
1. Si `salesOrderId`: cargar la OV (`getSalesOrder`); si existe, `clientId ??= ov.clientId`,
   `ordenVenta ??= ov.number`, `salesorderId = ov.id`.
2. Validar obligatorios → 422 si falta alguno (`clientId`, `tipoServicio`, `clasificaciones`,
   `tipoEquipo`, `marca`, `modelo`, `serie`, `prefijo`).
3. Construir `codigoServicio` (si no vino) con `buildCodigoServicio({prefijo, serie:serie, modelo, fecha:new Date()})`
   y `subject` (si no vino) con `buildSubject({ cliente: clientName, tipoEquipo, codigo })`
   (el `clientName` se obtiene de `getClient(clientId)`; 422 si el cliente no existe).
4. `createTicket(...)` con `actor = req.user.name`.
5. `201` con el `TicketDetail`.

Errores: 422 (validación / cliente u OV inexistente), 401 (sin sesión), 500 (try/catch genérico).

## Frontend

- Botón **"Nuevo ticket"** en el tablero (cabecera del board).
- Modal/página `CreateTicket.tsx`:
  - **Buscador de OV** (`searchSalesOrders` → `/api/sales-orders?search=`): al elegir, set `clientId` +
    `clientName` + `ordenVenta` + `salesorderId`, y si `parseCodigoFromPotential(potentialName)` → prefill
    de prefijo/serie/modelo.
  - **Buscador de cliente** (`searchClients` → `/api/clients?search=`): requerido; autollenado desde la OV.
  - Campos: tipo de servicio (select), clasificaciones (select), tipo de equipo, marca, modelo, número de
    serie, prefijo (select), orden de venta (texto), prioridad (select opcional).
  - **Vista previa editable** de Código Servicio y Asunto (se recalculan al cambiar componentes; editables).
  - Submit → `createTicket()` en `src/api/client.ts` → `POST /api/tickets`; al éxito cierra y
    **recarga el tablero** (el ticket aparece en la columna "OV asignada").
- `src/api/client.ts`: `searchSalesOrders(q)`, `searchClients(q)`, `createTicket(payload)` (todas
  `credentials:'include'`).

## Tipos compartidos (`shared/types.ts`)
- `CreateTicketPayload` (lo que envía el frontend) y reuso de `TicketDetail` (respuesta).

## Manejo de errores y seguridad
- `POST /api/tickets` bajo `requireAuth` (cualquier usuario autenticado).
- Validación servidor (422) independiente del cliente.
- Transacción atómica (ticket + transición) con rollback.
- No se escribe en Books; el `salesorder_id`/`orden_venta` son referencias.

## Pruebas
- **constructor** (`shared/ticketCreate.test.ts`, puro): `buildCodigoServicio` (formato + fecha AAMMDD),
  `buildSubject`, `parseCodigoFromPotential` (caso con código y caso sin código → null).
- **repo** (`server/db/repo.test.ts`, pg-mem): `createTicket` inserta con `managed_by_app=true`,
  `source='app'`, número de `ticket_number_seq`, estado "OV asignada", `client_id`/`salesorder_id`/
  `orden_venta`, y crea la fila en `ticket_transitions`; `getTicketWithRefs` resuelve la empresa por
  `client_id` (COALESCE).
- **endpoint** (`server/app.test.ts`, supertest+sesión): crear **con** `salesOrderId` (deriva cliente +
  orden de venta); crear **sin** OV (cliente manual); **422** sin obligatorios; **401** sin sesión; la
  respuesta es el `TicketDetail` con estado "OV asignada".

## Fuera de alcance (futuro)
- **Write-back a Books** (`cf_n_ticket`) — decidido: no ahora.
- **Registro de equipos** y selección de equipo por serial — es Remisiones (deuda).
- **Contacto** en el alta, **adjuntos** en el alta, **alta de clientes/cuentas**.
- **Gate por área** para crear (hoy: cualquier autenticado).
