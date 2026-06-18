# Diseño — `@algarpibe/zoho-sync`: paquete delgado de LECTURA de zoho-hub-db (Enfoque R1)

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Repo destino:** `https://github.com/Algarpibe/zoho-sync` (proyecto npm autónomo, separado del monorepo).
**Supersede:** el plan/spec `2026-06-18-publicar-motor-zoho-sync*` (Enfoque C, motor completo) — descartado.

## Contexto y decisión

**Objetivo final del usuario:** que apps futuras se **conecten y lean** los datos centralizados en `zoho-hub-db` (`desk.*`/`books.*`/`crm.*`).

**Recorrido de la decisión:** se evaluó separar el motor completo (A-full/A-lite/C). Hallazgo decisivo: **el servidor de Desk está construido SOBRE el motor** (`db/repo`, `db/mappers`, `db/migrate`, `sync`, `config`, `books/repo`, `db/activities`, `db/history`, `Queryable` en auth). Desk y el motor **se co-desarrollan** → sacar el motor a otro repo impondría fricción crónica de publicado en cada feature de Desk. Además, el objetivo NO necesita el motor de ingesta (clientes OAuth, backfill, sync) — eso es trabajo central del worker. Una app lectora solo necesita **conexión + tipos + esquema**.

**Decisión (R1):** publicar un **paquete delgado de solo-lectura** `@algarpibe/zoho-sync` en el repo `Algarpibe/zoho-sync`, **independiente**, que las apps consumidoras instalan para leer hub-db. **El monorepo NO se toca** (Desk/worker siguen usando el motor interno como hoy). Alcance v1.0.0 = **mínimo representativo** (YAGNI; se amplía cuando exista una app real).

**Distinción clave:** *ingesta* (Zoho→hub) = worker, central, único. *Consumo* (hub→app) = lo que este paquete facilita. El paquete NO ingiere.

## Arquitectura

```
zoho-hub-db (Postgres, esquemas desk.*/books.*/crm.*)
        ▲ escribe                         ▲ lee (read-only user)
   worker (monorepo, motor interno)   apps futuras  ──usa──▶  @algarpibe/zoho-sync (este paquete)
```

El paquete es un proyecto npm autónomo (no workspace del monorepo). Duplica un subconjunto pequeño y estable (helper de conexión + tipos del contrato de datos) — precio de la independencia, mitigado con un **test de contrato**.

## Contenido v1.0.0 (mínimo representativo)

Superficie pública (`src/index.ts` reexporta):
1. **Conexión:** `createPoolFromUrl(connectionString: string): Pool` (de `pg`; idéntico al del motor, 2 líneas) + reexport del tipo `Pool`.
2. **Tipos de fila** de un conjunto clave de tablas del hub (interfaces que reflejan las columnas reales):
   - `CrmDeal` (de `crm.deals`: id, deal_name, stage, amount, numero_ticket, closing_date, modified_time, …columnas curadas).
   - `BooksInvoice` (de `books.invoices`), `BooksSalesOrder` (de `books.sales_orders`).
   - `DeskTicket` (de la tabla de tickets de `desk`: número, asunto, estado, fechas clave).
   (Solo estas en v1; se amplían por demanda.)
3. **Helpers de lectura** tipados sobre esas tablas, p. ej.:
   - `getDealsByStage(db, stage): Promise<CrmDeal[]>`
   - `getInvoicesByContact(db, contactId): Promise<BooksInvoice[]>`
   - `getTicketByNumber(db, n): Promise<DeskTicket | null>`
   - `query(db, sql, params)` — passthrough para SQL libre tipado por el consumidor.
4. **`SCHEMA.md`** — documenta los esquemas `desk.*`/`books.*`/`crm.*` y las tablas/columnas principales, para que un consumidor sepa qué consultar (aunque no haya tipo aún).

Uso esperado por una app consumidora:
```ts
import { createPoolFromUrl, getDealsByStage } from '@algarpibe/zoho-sync'
const db = createPoolFromUrl(process.env.HUB_DB_URL!) // usuario read-only del hub
const ganados = await getDealsByStage(db, 'Ganado')
```

## Estructura del repo `Algarpibe/zoho-sync`

```
zoho-sync/
├── package.json        # name @algarpibe/zoho-sync, version 1.0.0, type module, exports → dist, files:[dist], publishConfig (GitHub Packages), dep: pg
├── tsconfig.json       # build: tsc → dist (JS + .d.ts)
├── .npmrc              # @algarpibe:registry=https://npm.pkg.github.com + _authToken=${NPM_TOKEN}
├── vitest.config.ts
├── SCHEMA.md
├── README.md           # cómo instalar/consumir (auth read:packages + ejemplo)
└── src/
    ├── index.ts        # superficie pública
    ├── pool.ts         # createPoolFromUrl
    ├── types.ts        # CrmDeal, BooksInvoice, BooksSalesOrder, DeskTicket
    ├── reads.ts        # helpers de lectura
    ├── reads.test.ts   # tests con pg-mem (sembrar tabla + leer)
    └── contract.test.ts# test de contrato: las columnas de los tipos existen en el esquema real (ver más abajo)
```

`exports` simple (paquete compilado, consumidores externos): `{ ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`. NO necesita exports condicionales (no es consumido como fuente por un monorepo).

## Test de contrato (anti-drift)

Como los tipos se duplican respecto al esquema real del hub, un test verifica que **no hay drift**: monta el esquema del hub en pg-mem (reutilizando, mediante COPIA documentada, las DDL relevantes de `desk`/`books`/`crm`) o, más simple para v1, valida contra un `expected-columns.json` versionado que lista las columnas que cada tipo espera. Si una columna del tipo no existe en el esquema esperado → falla. (Cuando el motor cambie el esquema, este test recuerda actualizar el paquete.)

## Operativo (habilita el objetivo)

1. **Usuario de solo-lectura en `zoho-hub-db`:** `CREATE ROLE hub_reader LOGIN PASSWORD '…'; GRANT CONNECT ON DATABASE "zoho-hub" TO hub_reader; GRANT USAGE ON SCHEMA desk, books, crm TO hub_reader; GRANT SELECT ON ALL TABLES IN SCHEMA desk, books, crm TO hub_reader; ALTER DEFAULT PRIVILEGES IN SCHEMA desk, books, crm GRANT SELECT TO hub_reader;` Las apps consumidoras usan este usuario (nunca el de escritura del worker).
2. **`SCHEMA.md`** publicado en el repo.

## Publicación

- Build: `tsc` → `dist/` (JS + `.d.ts`).
- `npm publish` a GitHub Packages bajo scope `@algarpibe` (= dueño del repo). Auth = PAT `write:packages` en `NPM_TOKEN`.
- Consumo externo: `.npmrc` con `read:packages` + `npm i @algarpibe/zoho-sync@^1`.

## Pruebas / verificación

- `reads.test.ts` (pg-mem): sembrar filas en una tabla del hub + helper devuelve filas tipadas.
- `contract.test.ts`: columnas de los tipos ⊆ esquema esperado.
- Build limpio (`tsc` → dist con `.d.ts`), `npm pack --dry-run` muestra solo `dist/`.
- Publish v1.0.0 (manual, PAT) + (opcional) instalación en un proyecto de prueba leyendo hub-db real con el usuario read-only.

## Esfuerzo

Acotado: bootstrap de UN repo pequeño (paquete + tooling) + el usuario read-only. El monorepo no cambia. Trabajo de desarrollo en un clon local del repo nuevo (p. ej. `c:\dev\zoho-sync`), push a `Algarpibe/zoho-sync`.

## Fuera de alcance

- Tocar el monorepo (Desk/worker siguen igual). Sacar el motor completo (A-lite/A-full/C). Tipar TODAS las tablas (solo el set v1). Ingesta desde apps consumidoras (es del worker). Una API HTTP delante del hub (las apps conectan por `pg`). Rotación de secretos.
