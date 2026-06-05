# Diseño — Resolución del ticket (texto enriquecido + imágenes, repositorio interno)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** La pestaña "Resolución" del detalle es decorativa. Debe ser un **registro interno de la solución**
de cada ticket (cómo se resolvió), con texto enriquecido e imágenes, guardado en la app. **No se envía a
nadie** — es base para una futura base de conocimiento interna.
**Depende de:** A (tickets), H1 (sesiones). Primera funcionalidad de la app con **escritura propia + archivos**.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Dónde vive la resolución | **Postgres** (app-owned); no usa `ENABLE_WRITES` (es interno) |
| Dónde viven las imágenes | **Postgres** — guardadas como **base64 en columna `text`** (evita problemas de `bytea` en pg-mem; misma idea "todo en Postgres", sin infra nueva) |
| Editor | **Texto enriquecido ligero**: `contentEditable` + barra mínima (negrita/cursiva/lista/enlace) → HTML; saneado con **DOMPurify** al mostrar |
| Imágenes | **Galería** debajo del texto (no incrustadas en línea) en v1 |
| Notificar al cliente | **NO** (interno; correo depende de D) |
| Dependencias nuevas | `multer` (subida) + `dompurify` (saneado) |

## Backend

### Esquema (`server/db/schema.sql`)
- `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_html text;`
- `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_at timestamptz;`
- `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_by text;`
- Tabla nueva:
```sql
CREATE TABLE IF NOT EXISTS resolution_attachments (
  id text PRIMARY KEY,
  ticket_id text NOT NULL,
  filename text,
  content_type text,
  content_b64 text NOT NULL,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_resolution_att_ticket ON resolution_attachments (ticket_id);
```

### Repo (`server/db/resolutions.ts`)
- `getResolution(db, ticketId)` → `{ html, updatedAt, updatedBy, attachments }` (lee `tickets.resolution_*` + meta de adjuntos **sin** `content_b64`).
- `saveResolution(db, ticketId, html, by)` → `UPDATE tickets SET resolution_html=$1, resolution_at=now(), resolution_by=$2 WHERE id=$3`.
- `addResolutionAttachment(db, { id, ticketId, filename, contentType, contentB64, size, by })` → INSERT; devuelve la meta.
- `listResolutionAttachments(db, ticketId)` → meta (sin bytes).
- `getResolutionAttachmentContent(db, ticketId, attId)` → `{ filename, contentType, contentB64 } | null`.
- `deleteResolutionAttachment(db, ticketId, attId)` → DELETE.
- IDs de adjunto: `res-` + `randomUUID()` (de `node:crypto`).

### Tipos (`shared/types.ts`)
```ts
export interface ResolutionAttachment { id: string; filename: string; contentType: string; size: number }
export interface Resolution { html: string | null; updatedAt: string | null; updatedBy: string | null; attachments: ResolutionAttachment[] }
```

### Subida (multer)
`const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })`. Solo
`image/*` (rechazar otros con 415). `req.file.buffer.toString('base64')` → `content_b64`; `size = req.file.size`.

### Endpoints (`server/app.ts`, bajo `app.use('/api/tickets', requireAuth(db))`)
- `GET /api/tickets/:id/resolution` → `getResolution`.
- `PUT /api/tickets/:id/resolution` (JSON `{ html }`) → `saveResolution(db, id, html, req.user?.name ?? null)` → 200.
- `POST /api/tickets/:id/resolution/attachments` (`upload.single('file')`) → valida imagen; `addResolutionAttachment`; 201 con meta. 415 si no es imagen.
- `GET /api/tickets/:id/resolution/attachments/:attId` → sirve la imagen: `res.set('Content-Type', contentType)`, `res.send(Buffer.from(content_b64, 'base64'))`; 404 si no existe.
- `DELETE /api/tickets/:id/resolution/attachments/:attId` → `deleteResolutionAttachment`; 204.

## Frontend

### `src/components/ResolucionPanel.tsx` (nuevo)
- Carga vía `fetchResolution(ticketId)`.
- **Vista**: renderiza el HTML **saneado con DOMPurify** (`dangerouslySetInnerHTML`) + **galería** de imágenes (`<img>` a `/api/tickets/:id/resolution/attachments/:attId`, misma-origen → la cookie de sesión viaja); muestra "Actualizado por X" si hay. Botón **Editar** (o "Agregar resolución" si vacía).
- **Edición**: editor `contentEditable` con barra (Negrita/Cursiva/Lista/Enlace vía `document.execCommand`), **"Adjuntar imagen"** (`<input type=file accept=image/*>` → `uploadResolutionImage` → refresca galería), galería con botón **quitar** (×), **Guardar** (`PUT { html }`) / **Cancelar**.
- Estados de carga/guardado/error; al guardar, refresca y vuelve a vista.

### `src/api/client.ts`
- `fetchResolution(id): Promise<Resolution>`
- `saveResolution(id, html): Promise<void>` (PUT)
- `uploadResolutionImage(id, file): Promise<ResolutionAttachment>` (FormData, `file`)
- `deleteResolutionImage(id, attId): Promise<void>`

### `src/components/TicketDetailView.tsx`
- En `TABS`, la pestaña `res` (Resolución) pasa de `view: 'otros'` a `view: 'resolucion'`.
- En el área de contenido, añadir `{activeView === 'resolucion' && <ResolucionPanel ticketId={ticketId} />}`.

## Seguridad
- Endpoints bajo sesión (`requireAuth`). Imágenes solo `image/*`, límite 10 MB. Consultas parametrizadas.
- HTML **saneado con DOMPurify** al renderizar (lo escribe personal interno, pero se sanea igual).
- La imagen se sirve con su `content_type`; el `<img>` same-origin lleva la cookie.

## Pruebas
- **Repo** (pg-mem): `saveResolution`+`getResolution` (html/by/at); add/list/get-content/delete de adjuntos (round-trip base64).
- **Endpoints** (supertest+sesión): PUT guarda y GET devuelve; POST multipart con una imagen pequeña → 201 + aparece en GET; GET content sirve los bytes con su content-type; 415 si no es imagen; DELETE quita; **401** sin sesión.
- **Frontend**: no test (componente UI); se valida con `tsc`/build.

## Fuera de alcance (v1)
- Notificar al cliente / enviar por correo (depende de **D**).
- **Base de conocimiento consultable entre tickets** (búsqueda global de soluciones por equipo/marca/problema) — mejora futura natural de esto.
- "Guardar y Añadir Article", imágenes **incrustadas en línea** en el cuerpo, historial/versiones de la resolución, editor WYSIWYG con librería pesada.
