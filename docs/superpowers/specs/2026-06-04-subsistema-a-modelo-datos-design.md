# Diseño — Subsistema A: Modelo de datos propio (Postgres como fuente de verdad)

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** `docs/migracion-zoho-roadmap.md` (programa "reemplazar Zoho Desk por completo").

## Objetivo

Convertir Postgres de **réplica de lectura** de Zoho a **sistema de registro** (fuente de verdad):
un esquema propio, **escribible**, que la app pueda modificar (transiciones, edición, creación) y que
el sync siga **alimentando** desde Zoho hasta el corte, **sin pisar** los tickets que la app ya gestione.
Subsistema A entrega el **modelo de datos completo** (tablas + mappers + repos + cambios de sync/lectura
+ migración). NO incluye la ejecución de transiciones (subsistema B), creación de tickets (C), correo
(D) ni reportería (G).

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Alcance | Modelo propio **completo** de una vez |
| Almacenamiento de campos | **Híbrido**: columnas tipadas para flujo/reportables + `custom_fields jsonb` para la cola larga |
| Numeración de tickets app | **Continuar desde el máximo de Zoho** (numeración continua, misma lógica actual) |
| Fechas del flujo + equipo | **Promovidas a columnas tipadas** (reportería directa en SQL) |
| `raw jsonb` | **Se mantiene** como referencia hasta el corte |
| Convivencia con sync | Marca `managed_by_app`; el sync **omite** los gestionados por la app |

## Arquitectura (entidades y relaciones)

```
accounts 1───* contacts ───* tickets *───1 agents
                               │
                               ├──* conversations ──* attachments
                               └──* ticket_transitions
```
Cada entidad lleva control: `source` ('zoho'|'app'), `managed_by_app boolean`, `raw jsonb` (referencia
Zoho, se elimina en el corte), `synced_at`, `created_at`, `updated_at`.

## Esquema (Postgres)

### `accounts` (empresas)
`id text PK`, `name text NOT NULL`, `nit text`, `email text`, `phone text`, `website text`,
`city text`, `address text`, `industry text`, `source text`, `managed_by_app boolean DEFAULT false`,
`raw jsonb`, `synced_at timestamptz`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz`.

### `contacts`
`id text PK`, `first_name text`, `last_name text`, `email text`, `phone text`, `mobile text`,
`account_id text REFERENCES accounts(id)`, `source text`, `managed_by_app boolean DEFAULT false`,
`raw jsonb`, `synced_at`, `created_at`, `updated_at`.

### `agents` (personal Ambientalia — owners/assignees)
`id text PK`, `name text`, `email text`, `role text`, `source text`, `raw jsonb`, `synced_at`,
`created_at`, `updated_at`.

### `tickets` (central — híbrida)
Identidad/flujo:
- `id text PK`, `number integer UNIQUE NOT NULL`, `subject text`, `status text NOT NULL`,
  `status_type text`, `priority text`, `classification text`, `channel text`, `description text`.

Relaciones: `contact_id text REFERENCES contacts(id)`, `account_id text REFERENCES accounts(id)`,
`assignee_id text REFERENCES agents(id)`.

Tiempos: `created_time timestamptz`, `modified_time timestamptz`, `closed_time timestamptz`,
`onhold_time timestamptz`, `due_date timestamptz`.

Columnas promovidas (texto salvo indicado):
- `codigo_servicio`, `tipo_servicio`, `equipo`, `marca`, `modelo`, `serial`, `codigo_interno`,
  `encargado`, `correo_encargado`, `nit`, `ciudad`, `direccion`, `telefono`, `orden_venta`,
  `conformidad`; `dias_entrega integer`; `cumple_condiciones_comerciales boolean`.

Fechas del flujo (16, tipo `date`):
- `fecha_creacion_ticket`, `fecha_remision_entrada`, `fecha_revision_informe`, `fecha_cotizacion`,
  `fecha_orden_compra`, `fecha_orden_venta`, `fecha_recepcion_repuestos`, `fecha_finalizacion_st`,
  `fecha_factura`, `fecha_remision_salida`, `fecha_salida_servicio_externo`,
  `fecha_entrada_servicio_externo`, `fecha_notificacion_garantia`, `fecha_solicitud_sku`,
  `fecha_orden_compra_final`, `fecha_orden_venta_final`.

Checkboxes de proceso (`boolean`):
- `equipo_partes_listas`, `archivo_trazabilidad_actualizado`, `doc_almacenada_drive`,
  `hv_actualizada`, `liberacion_sin_facturar`, `servicio_in_situ`.

Cola larga + control: `custom_fields jsonb`, `managed_by_app boolean DEFAULT false`,
`source text`, `raw jsonb`, `synced_at`, `created_at`, `updated_at`.

### `conversations` (comentarios/hilos/respuestas)
`id text PK`, `ticket_id text REFERENCES tickets(id)`, `kind text` ('comment'|'thread'|'reply'),
`author_name text`, `author_type text` ('agent'|'end_user'), `is_public boolean`, `content text`,
`content_type text` ('html'|'plainText'), `commented_time timestamptz`, `source text`, `raw jsonb`,
`created_at`.

### `attachments` (metadata; bytes diferidos — ver debt.md)
`id text PK`, `conversation_id text REFERENCES conversations(id)`, `ticket_id text REFERENCES tickets(id)`,
`name text`, `size bigint`, `content_type text`, `zoho_href text`, `storage_path text` (null hasta
almacenar archivos), `raw jsonb`, `created_at`.

### `ticket_transitions` (historial/auditoría — base de fechas e indicadores)
`id bigserial PK`, `ticket_id text REFERENCES tickets(id)`, `transition_id text`, `transition_name text`,
`from_status text`, `to_status text`, `area text`, `performed_by text`, `values jsonb`,
`comment_id text REFERENCES conversations(id)`, `performed_at timestamptz DEFAULT now()`.

### Índices
`tickets(status)`, `tickets(status_type)`, `tickets(account_id)`, `tickets(contact_id)`,
`tickets(modified_time)`, `conversations(ticket_id)`, `ticket_transitions(ticket_id)`,
`contacts(account_id)`, `attachments(ticket_id)`.

## Numeración de tickets

- Los números siguen siendo **enteros continuos** (misma lógica que hoy en Zoho).
- Secuencia `ticket_number_seq`. Al migrar/sincronizar se **re-siembra** a `MAX(number)` actual:
  `SELECT setval('ticket_number_seq', (SELECT COALESCE(MAX(number),0) FROM tickets))`.
- La creación de tickets en la app (subsistema C) tomará `nextval('ticket_number_seq')`.
- **Caveat de transición:** mientras Zoho y la app coexistan, ambos podrían asignar números. Mitigación:
  la creación en la app (C) se usará en/cerca del corte; el sync re-siembra la secuencia tras cada
  pasada, manteniéndola por delante del máximo de Zoho.

## `managed_by_app` y comportamiento del sync

- Al ejecutar una transición/edición/creación (subsistemas B/C), el ticket pasa a `managed_by_app = true`.
- **El sync omite** (`WHERE managed_by_app = true` no se sobrescribe) esos tickets; sigue trayendo de
  Zoho solo los nuevos/no tocados.
- En el **corte**: se apaga el sync; opcionalmente se marca todo `managed_by_app = true`.

## Cambios en sync y lectura (parte de A)

- **Sync** (`server/sync.ts`): en vez de guardar solo `raw jsonb`, **parsea** el payload de Zoho a las
  entidades tipadas (account → contact → agent → ticket con columnas promovidas → conversations →
  attachments). Respeta `managed_by_app`. Reutiliza `zohoClient`/`tokenManager` (siguen leyendo Zoho).
- **Lectura** (`app.ts` GET /tickets, /:id, /conversations): pasa a leer de **columnas tipadas** vía
  mappers `rowToTicket` / `rowToTicketDetail` / `rowToMessage`, reemplazando `normalize(raw)`.
- **Mappers nuevos** (`server/db/mappers.ts`):
  - `zohoTicketToRow(raw)`, `zohoAccountToRow`, `zohoContactToRow`, `zohoAgentToRow`,
    `zohoConversationToRow`, `zohoAttachmentToRow` (Zoho → fila tipada; aquí vive el mapeo
    etiqueta→columna, reusando el conocimiento de `cfApiNames`).
  - `rowToTicket(row)`, `rowToTicketDetail(row)`, `rowToMessage(row)` (fila → forma de UI).

## Migración

- El esquema actual (solo `raw jsonb`) se **redefine** al esquema híbrido. Como aún **no hay tickets
  gestionados por la app**, es seguro **recrear** y **re-poblar desde Zoho** (backfill).
- Pasos: aplicar nuevo `schema.sql` (idempotente, `CREATE TABLE IF NOT EXISTS`) → si las tablas viejas
  existen con datos solo-raw, se descartan/migran → re-ejecutar el backfill (parsea a tipado).

## Componentes / estructura de archivos

- Modify `server/db/schema.sql` — esquema híbrido completo.
- Modify `server/db/migrate.ts` — aplicar schema (dividir por `;` si hace falta) + re-siembra de secuencia.
- Rewrite `server/db/mappers.ts` — mappers Zoho→fila y fila→UI (reemplaza `ticketRowFromZoho`/`conversationRowFromZoho`).
- Rewrite `server/db/repo.ts` — upserts/queries por entidad, respetando `managed_by_app`; `nextTicketNumber`.
- Modify `server/sync.ts` — parsear a entidades tipadas; omitir gestionados.
- Modify `server/app.ts` — endpoints de lectura usan repo/mappers nuevos.
- Replace/retire `server/normalize.ts` — su lógica (helpers de fecha/tamaño, HTML) pasa a mappers.
- Modify `shared/types.ts` — tipos `Ticket`/`TicketDetail` enriquecidos + `Account`, `Contact`, `Agent`.

## Manejo de errores

- Mappers tolerantes: campos faltantes → `null` (no romper la fila).
- Sync: error por entidad no aborta el lote (cuenta y sigue), como ya hace el backfill.
- FKs: si llega un ticket cuyo contacto/cuenta no se sincronizó aún, insertar primero la entidad
  referida (o permitir FK nullable y reconciliar en la siguiente pasada).

## Pruebas

- **Puras (TDD):** `zoho*ToRow` y `rowTo*` (mapeo de columnas, fechas, custom_fields, html).
- **Repos con `pg-mem`:** upserts por entidad; `upsertTicket` **no** sobrescribe si `managed_by_app=true`;
  `getActiveTickets` excluye cerrados; `nextTicketNumber` continúa desde el máximo.
- **Migración:** las tablas e índices se crean; `setval` deja la secuencia en el máximo.

## Fuera de alcance (YAGNI / otros subsistemas)

- Ejecución de transiciones escribiendo en Postgres → **subsistema B**.
- Creación de tickets (formulario + alta) → **subsistema C**.
- Correo entrante/saliente → **subsistema D**.
- CRUD de contactos/empresas en la UI → **subsistema E**.
- Almacenar archivos de adjuntos → deuda (`debt.md`).
- Indicadores calculados / reportería → **subsistema G**.
