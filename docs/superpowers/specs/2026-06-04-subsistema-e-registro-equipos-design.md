# Diseño — Subsistema E: Registro de equipos

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** programa "reemplazar Zoho Desk" / autonomía de la plataforma. Primer ladrillo del futuro
subsistema **Remisiones** y de las **hojas de vida** de equipos.
**Depende de:** A (Postgres tipado, `migrate` tolerante), H1 (sesiones, `requireAuth`), **C (creación de
tickets)** — al que modifica.

## Objetivo

Tener en Postgres el **registro de equipos** vendidos por Ambientalia (serial → marca/modelo/tipo/cliente),
importado del listado existente, y usarlo para que la **creación de tickets** (C) deje de capturar a mano
marca/modelo/serie/tipo: se **elige un equipo registrado** que autocompleta esos campos. **Regla dura: no
se puede crear un ticket para un equipo que no esté en el registro.** El `equipo_id` queda en el ticket
como base para las **hojas de vida** (historial por equipo, fase futura).

## Datos de origen (listado provisto)

CSV separado por `;` con columnas: **`Nombre cliente · Marca · Modelo · Numero serie · Tipo`** (~330
equipos reales). Marcas: Grimm, Horiba, Environics, Kunak, Durag, TCA. Tipos ricos (Monitor de Material
Particulado PM10/PM2.5; Analizadores de NOx/CO/O3/SO2/NH3/H2S; Convertidores; Calibrador Multigas;
Generador de Aire Cero; Estación Meteorológica; Opacímetro; Sensor de Calidad del Aire; medidores de agua…).

**Quirks a manejar en el import:**
- Filas vacías (`;;;;…`) → se omiten.
- `;` sobrantes al final de cada fila → se recortan.
- **Serial NO único:** hay seriales repetidos en distintos equipos/clientes (p.ej. `191TE0NC` en *Ser As*
  y *SGS*; `RUXGB0SH` dos veces en *MCS*; `GK2E0021` dos veces en *Camposol*) → la tabla usa un `id` propio,
  no el serial como llave.
- **2 seriales corruptos** (WS600-UMB con `2,720,130,…` por Excel) → se importan tal cual (texto) y se
  pueden corregir luego.
- **Filas de prueba**: la de serial que contiene `prueba` (`18Aprueba_prueba`) se **excluye**; el resto se
  importa.
- Filas exactamente duplicadas (mismo cliente+marca+modelo+serial+tipo) → se deduplican.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Gate en creación | **Obligatorio elegir un equipo registrado**; marca/modelo/serie/tipo salen de él (solo lectura). Sin equipo → no hay ticket (422). |
| Fuente de datos | **Semilla en el repo** (CSV limpio) cargada **al arrancar si la tabla está vacía** (cero pasos manuales al desplegar). |
| Llave | `id` propio (serial no es único). |
| Alta de equipos | **No** se crean equipos en el alta de tickets (estricto); la gestión de equipos (alta/edición) es fase siguiente. |
| Vínculo en el ticket | `tickets.equipo_id` (base para hojas de vida). |

## Modelo de datos (Postgres)

```sql
CREATE TABLE IF NOT EXISTS equipos (
  id text PRIMARY KEY,                 -- id propio (serial no es único)
  serial text NOT NULL,
  marca text,
  modelo text,
  tipo text,                           -- tipo de equipo (del listado)
  cliente_nombre text,                 -- dueño del equipo (texto; no se vincula a Books en v1)
  source text NOT NULL DEFAULT 'seed',
  active boolean NOT NULL DEFAULT true,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos (serial);
CREATE INDEX IF NOT EXISTS idx_equipos_cliente ON equipos (cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos (tipo);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS equipo_id text;   -- → equipos.id
```
Aditivo e idempotente (se añade a `server/db/schema.sql`).

## Importación (semilla)

- Archivo `server/db/equipos.seed.csv` (listado limpio, `;`-delimitado, sin filas vacías) versionado en el repo.
- `server/db/seedEquipos.ts`: parser puro `parseEquiposCsv(text) → EquipoRow[]` (omite vacías, recorta `;`,
  excluye seriales con `prueba`, deduplica) + `seedEquipos(db)` que hace upsert de cada fila (id determinista
  = hash de `serial|cliente|modelo` para reimportes idempotentes).
- En `server/index.ts`, tras `migrate`: si `count(equipos)=0`, cargar la semilla (log del total). No re-siembra
  si ya hay datos.

## Backend

- `GET /api/equipos?search=texto` (bajo `requireAuth`, datos de negocio): busca case-insensitive por
  `serial`/`cliente_nombre`/`marca`/`modelo`/`tipo`, sólo `active`, límite 20. Devuelve `EquipoLite`.
- Repo `server/db/equipos.ts`: `upsertEquipo`, `searchEquipos`, `getEquipo(id)`, `countEquipos`.

## Tipos compartidos (`shared/types.ts`)
`EquipoLite` = `{ id, serial, marca?, modelo?, tipo?, clienteNombre? }`.

## Integración con C (modifica creación de tickets)

**Formulario (`CreateTicket.tsx`):**
- Se **quitan** los campos libres Tipo de equipo / Marca / Modelo / Número de serie.
- Se **añade** un **selector de Equipo (obligatorio)** que busca en `/api/equipos?search=` y, al elegir,
  fija `equipoId` y muestra (solo lectura) marca/modelo/serie/tipo + el dueño del equipo.
- Permanecen: OV (opcional), Cliente (de la OV/Books), Tipo de Servicio, Clasificaciones, Prefijo,
  Prioridad, y la vista previa editable de Código/Asunto.
- El Código se arma con `serie`+`modelo` del equipo; el Asunto usa el `tipo` del equipo como "tipo de equipo".

**Endpoint `POST /api/tickets`:**
- Nuevo campo `equipoId` **obligatorio**: se carga el equipo (`getEquipo`); si no existe → **422**
  ("Equipo no registrado"). De él se toman `marca`, `modelo`, `serial`, `tipo` (ignorando cualquier valor
  libre del cliente).
- Se guarda `equipo_id` en el ticket (vía `createTicket`, que gana el parámetro `equipoId`).
- El resto del flujo (cliente desde OV/Books, estado "OV asignada", transición #1) no cambia.

## Hoja de vida (visión, fase futura)
Con `tickets.equipo_id` poblado, la hoja de vida de un equipo será una vista de su historial de
tickets/transiciones (se arma con lo ya registrado). No se construye ahora; el modelo queda listo.

## Manejo de errores y seguridad
- `GET /api/equipos` bajo `requireAuth`. Búsqueda case-insensitive con parámetros ligados (sin inyección).
- Semilla tolerante (filas inválidas se omiten con log); un fallo de seed no tumba el arranque.
- `equipoId` validado en servidor (422) — el gate no depende del frontend.

## Pruebas
- **parser** (`parseEquiposCsv`, puro): omite vacías, recorta `;`, excluye `prueba`, deduplica, mapea
  columnas (incl. el tipo).
- **seed/repo** (pg-mem): `seedEquipos` inserta N filas y es idempotente; `searchEquipos` por
  serial/cliente/tipo; `getEquipo`.
- **endpoint** `GET /api/equipos` (supertest+sesión): devuelve coincidencias; **401 sin sesión**.
- **C (endpoint)**: `POST /api/tickets` con `equipoId` válido crea y toma marca/modelo/serie/tipo del equipo
  + guarda `equipo_id`; con `equipoId` inexistente → **422**; sin `equipoId` → **422**.

## Fuera de alcance (futuro)
- Página de **gestión de equipos** (alta/edición/baja) y "crear equipo" en el alta (→ Remisiones).
- **Reconciliar** `equipos.cliente_nombre` con los clientes de Books.
- La **vista de hoja de vida** por equipo.
- Sincronización viva con la hoja de Google (la semilla es de una vez).
