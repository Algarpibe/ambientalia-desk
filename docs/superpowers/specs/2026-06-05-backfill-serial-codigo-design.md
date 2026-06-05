# Diseño — Backfill de serial/código desde el asunto

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** Confirmado en producción que los tickets históricos de Zoho tienen `serial` y
`codigo_servicio` en NULL — el número de serie vive solo en el `subject` (p.ej. `…MT_18A19042_EDM180C_260305`).
El mapeo promueve `serial`/`codigo_servicio` desde customFields de Zoho ("Serial"/"Código Servicio") que esos
tickets no diligencian.
**Depende de:** A (tickets tipados + `ticketRowFromZoho`), H1 (sesiones + admin).

## Objetivo

Poblar `serial` y `codigo_servicio` extrayéndolos del **asunto**, en dos frentes:
1. **Hacia adelante:** al sincronizar, si el campo de Zoho viene vacío, rellenar desde el asunto.
2. **Backfill:** un pase único (endpoint admin) sobre los tickets existentes.

Así mejoran búsqueda por serie, el gate de creación y reportería; la hoja de vida queda más sólida.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Alcance | **Hacia adelante (sync) + backfill** de existentes |
| Columnas | **`serial` + `codigo_servicio`** |
| Disparador backfill | **Endpoint admin manual** (`POST /api/admin/backfill-serial`, sesión + admin) |
| Regla de escritura | **Solo rellena lo vacío** (nunca sobreescribe lo que Zoho sí trae); **solo `managed_by_app=false`** |

## Helper compartido (`shared/ticketCreate.ts`)

`extractServiceCode(text: string | null | undefined): { serial: string; codigo: string } | null`
- Regex: `/\b(MT|CG|HV|SR|PRO)_([^_\s]+)_([^_\s]+)(?:_(\d{6}))?\b/` (fecha **opcional**, para códigos de 3 partes
  como `HV_219587_Defender520`).
- Si hay match: `serial = grupo 2`, `codigo = la subcadena completa matcheada` (p.ej.
  `MT_18A19042_EDM180C_260305`). Si no, `null`.
- (No cambia `parseCodigoFromPotential`, que sigue exigiendo la fecha para el prefill de OV.)

## Hacia adelante (`server/db/mappers.ts`, `ticketRowFromZoho`)

Tras el bucle de `PROMOTED_COLUMNS`, si el ticket no es gestionado por la app (este mapper es solo para
sincronizados) y `serial`/`codigo_servicio` quedaron vacíos:
```ts
const ext = extractServiceCode(row.subject)
if (ext) {
  if (!row.serial) row.serial = ext.serial
  if (!row.codigo_servicio) row.codigo_servicio = ext.codigo
}
```
Nunca sobreescribe valores que Zoho sí trae.

## Backfill (`server/backfillSerial.ts` + endpoint)

`backfillSerialFromSubject(db): Promise<{ updated: number }>`:
1. `SELECT id, subject, serial, codigo_servicio FROM tickets WHERE managed_by_app = false AND
   (COALESCE(serial,'') = '' OR COALESCE(codigo_servicio,'') = '')`.
2. Por fila: `ext = extractServiceCode(subject)`. Si `ext`, calcular `nuevoSerial` (si el actual está vacío) y
   `nuevoCodigo` (si el actual está vacío). Si alguno cambia → `UPDATE tickets SET serial=$1, codigo_servicio=$2
   WHERE id=$3` con los valores resultantes (el vacío relleno, el existente conservado).
3. Devolver `{ updated }`.
Idempotente (re-correrlo no cambia nada nuevo).

Endpoint `POST /api/admin/backfill-serial` (`requireAuth(db)` + `requireSuperAdmin`) → ejecuta y devuelve
`{ updated }`.

## Pruebas
- **`extractServiceCode`** (puro): extrae de un asunto con código de 4 partes y de 3 partes (`HV_…`);
  `null` si no hay código.
- **`ticketRowFromZoho`**: con `customFields.Serial` vacío + asunto con código → `serial`/`codigo_servicio`
  poblados; con `customFields.Serial` presente → **no** se sobreescribe.
- **`backfillSerialFromSubject`** (pg-mem): rellena los vacíos desde el asunto; **idempotente**; **no toca**
  `managed_by_app=true`; respeta valores ya presentes.
- **Endpoint** (supertest+sesión): admin → `{ updated }`; **403** no-admin; **401** sin sesión.

## Fuera de alcance
- Extraer modelo/marca del asunto a sus columnas.
- Limpiar/normalizar seriales corruptos (los 2 WS600-UMB).
- Programar el backfill automático (queda manual por endpoint).
- Re-vincular tickets a equipos por el serial recién poblado (la hoja de vida ya empareja por asunto).
