# Diseño — D1: Directorio de Clientes (Contactos + Empresas)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** El tab "Clientes" del Header es decorativo. Debe abrir un **directorio** que replica la pantalla
"Todos los Contactos" de Zoho Desk: lista de contactos (persona · empresa · email · teléfono), índice A-Z,
búsqueda, y un toggle **Contactos / Empresas**.
**Depende de:** A (tickets/sync/`zohoFetch`, tablas `contacts`/`accounts`), H1 (sesiones).
**Parte de:** "Clientes" — **D1 = directorio** (esto); **D2 = detalle** (clic → ficha + tickets), siguiente.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Datos contactos | **Backfill de TODOS los contactos de Zoho Desk** (hoy solo se sincronizan los de tickets) |
| Vistas | **Contactos + Empresas** (toggle); Empresas = tabla `accounts` |
| Interacción | **Solo lista/lectura** en D1 (índice A-Z + búsqueda); el detalle es D2 |
| Entrada | El tab **"Clientes"** del Header abre la página |

## Backend

### Backfill de contactos (incremental)
- `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS modified_time timestamptz;`
- `contactRowFromZoho` añade `modified_time: raw.modifiedTime ?? null` (y `ContactRow` el campo).
- `syncContacts()` (`server/sync.ts`): pagina `GET /contacts?departmentId=…&from=&limit=100&sortBy=-modifiedTime`,
  hace `upsertContact` de cada uno (+ `ensureAccount(c.accountId)` para tener la empresa). **Incremental**:
  marca de agua `max(modified_time)`; corta cuando una página trae solo contactos `modifiedTime <= watermark`
  (igual que `syncActivities`). Primera corrida = full. Se añade a la interfaz `Sync` y corre en el
  **backfill de arranque** + en el **loop periódico**.

### Endpoints (con sesión — `requireAuth(db)`, fuera de `/api/tickets`)
- `GET /api/contacts` → `ContactLite[]`: `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.mobile,
  a.name AS company FROM contacts c LEFT JOIN accounts a ON c.account_id=a.id ORDER BY lower(...)`. Map:
  `name = "{first} {last}".trim() || email || "—"`, `company = a.name`, `phone = phone || mobile`.
- `GET /api/accounts` → `AccountLite[]`: `SELECT id, name, nit, email, phone, city FROM accounts ORDER BY
  lower(name)`.

### Tipos (`shared/types.ts`)
```ts
export interface ContactLite { id: string; name: string; company: string | null; email: string | null; phone: string | null }
export interface AccountLite { id: string; name: string; nit: string | null; email: string | null; phone: string | null; city: string | null }
```

## Frontend — `src/components/ClientesPage.tsx` (overlay pantalla completa)

Réplica de la imagen:
- **Barra superior** oscura: botón volver + título.
- **Sidebar izquierdo** (blanco, ~220px): "VISTAS CON ESTRELLAS / Todos los Contactos" (activo) y "TODAS LAS
  VISTAS" (decorativo). Abajo, el **toggle Contactos / Empresas** (como la imagen).
- **Área principal**: encabezado con título ("Todos los Contactos" / "Todas las Empresas") + **Recuento total**
  (N) + **buscador**. Debajo, la **lista**:
  - Contacto: avatar con iniciales · **nombre** (bold) · empresa · email · teléfono.
  - Empresa: avatar · **nombre** · NIT · email · teléfono · ciudad.
- **Índice A-Z** (columna derecha): letras A…Z; clic salta (scroll) a la primera fila de esa letra
  (`id="letra-A"` + `scrollIntoView`). Las letras sin contactos se ven atenuadas.
- **Búsqueda** filtra en cliente (la lista es acotada): por nombre/empresa/email.
- `src/api/client.ts`: `fetchContacts()`, `fetchAccounts()`.
- `src/components/Header.tsx`: el tab **"Clientes"** de `NAV_TABS` se vuelve funcional (`onClick` → `onOpenClientes`).
  `src/App.tsx`: estado `showClientes` + render `<ClientesPage/>`.

## Manejo de errores / seguridad
- Endpoints bajo `requireAuth(db)` → 401 sin sesión. Consultas parametrizadas (sin entrada de usuario en SQL;
  la búsqueda es en cliente).

## Pruebas
- **Repo** (pg-mem): `getContacts` (join empresa, nombre compuesto, phone||mobile, orden); `getAccounts`
  (orden por nombre).
- **`syncContacts`** (`zohoFetch` mock): pagina + upsert + corta por marca de agua.
- **Endpoints** (supertest+sesión): `GET /api/contacts` y `/api/accounts` devuelven la lista; **401** sin sesión.
- **Frontend**: sin test (UI); se valida con `tsc`/build.

## Fuera de alcance (D1)
- **Detalle** del contacto/empresa (ficha + tickets) → **D2**.
- Filtros, "Vista clásica"/otros modos, vistas guardadas/estrelladas reales, crear/editar/eliminar contactos,
  importación. (El sidebar y el selector "Vista clásica" se renderizan decorativos.)
