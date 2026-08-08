# Ficha técnica del modelo — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada modelo del catálogo lleve su foto de referencia, su SKU y sus documentos —manuales, instructivos, guías—, y que un técnico los tenga a mano desde el ticket y desde la hoja de vida del equipo.

**Architecture:** Una tabla nueva, `catalogo_documentos`, donde cada fila es **o un enlace o un fichero subido**, nunca las dos cosas. La foto de referencia es una fila más con `tipo='foto'`, única por modelo — deliberadamente **no** una columna de `catalogo_modelos`, que se lee en cada carga del formulario de equipos. Los ficheros se sirven por el proxy autenticado de la aplicación, igual que las fotos de remisión.

**Tech Stack:** TypeScript ESM con tsx (sin build de servidor), Express 5, pg, multer, pg-mem + supertest, vitest, React 19 + Vite + Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-07-ficha-tecnica-modelo-design.md`

---

## Contexto del repo que hace falta conocer

- **Monorepo npm workspaces.** Verificar SIEMPRE desde la raíz: `npm test` desde `apps/desk` corre solo una fracción.
- **Línea base:** **498 tests pasando / 2 saltados**. Lint: **0 errores, 158 warnings**. Si el lint sube, lo has introducido tú; se localiza comparando la salida antes y después, no a ojo.
- **Todo el texto de cara al usuario y todos los comentarios, en español.** Los comentarios explican el PORQUÉ, no el QUÉ.
- **Commits en español**, `tipo(ámbito): descripción`, con el porqué en el cuerpo, terminando con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Mensaje multilínea a fichero + `git commit -F` (el here-string de PowerShell se rompe con comillas dobles).
- **TDD**: test primero, verlo fallar, implementar. Y después **mutar el código para comprobar que el test muerde**.
- ⚠️ **Commitea ANTES de mutar**: `git checkout -- fichero` revierte al último commit y se lleva por delante lo que no esté guardado. **Nunca** `git checkout <sha> -- .`, `git reset --hard`, `git stash` ni `git clean`.
- ⚠️ **No dejes ficheros temporales en el árbol.** Un revisor de la fase 1 dejó uno y contaminó el recuento de tests y el lint. Confirma con `git status --short` al terminar: solo deben aparecer `docs/analisis-tickets/` y `docs/remisiones/`.
- **Prohibido `r: any`** al mapear filas: sube el lint. El patrón de la casa es `Record<string, unknown>` con casteo campo a campo, como en `apps/desk/server/db/catalogo.ts`.
- **Trampas de pg-mem ya pagadas:** no resuelve subconsultas correlacionadas; no soporta `TRIM`, `length()`, `search_path` ni `INSERT … SELECT $n` tipado. Sí soporta `GROUP BY`, `COUNT(*)::int` y `LEFT JOIN`. Por eso este proyecto agrega en JavaScript lo que en SQL exigiría acrobacias.
- **`schema.sql`:** comentarios en UNA línea y **sin punto y coma dentro** (`migrate()` parte el fichero por `;`). Se añade siempre al final. `migrate()` es **tolerante por sentencia**: se salta la que falle con un `console.error`, así que nada crítico va ahí escondido.

Ficheros de referencia que hay que leer antes de empezar:
- `apps/desk/server/db/catalogo.ts` — el repo del catálogo (~280 líneas). Aquí se amplía.
- `apps/desk/server/routes/catalogo.ts` — sus rutas, con el patrón de `requireAuth` + `requireSuperAdmin`.
- `apps/desk/server/routes/remision.ts:310-328` — **el patrón exacto** de subir y servir un binario.
- `apps/desk/server/db/remisiones.ts:190-230` — cómo se guardan y leen las fotos.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` | **Modificar** (al final): tabla `catalogo_documentos` y columna `catalogo_modelos.sku`. |
| `packages/shared/src/types.ts` | **Modificar**: `DocumentoModelo`, `FichaModelo`, `TIPOS_DOCUMENTO`. |
| `apps/desk/server/db/fichaModelo.ts` | **Crear**: repo de la ficha — leer, alta de enlace, alta de fichero, contenido, baja. Fichero propio y no dentro de `catalogo.ts`, que ya ronda las 280 líneas con cinco responsabilidades. |
| `apps/desk/server/db/fichaModelo.test.ts` | **Crear**: sus tests. |
| `apps/desk/server/routes/catalogo.ts` | **Modificar**: las cinco rutas nuevas. |
| `apps/desk/server/db/catalogo.ts` | **Modificar**: `actualizarModelo` acepta `sku`. |
| `apps/desk/server/app.test.ts` | **Modificar**: tests de las rutas y la frontera de autorización. |
| `apps/desk/src/api/client.ts` | **Modificar**: cliente HTTP de la ficha. |
| `apps/desk/src/components/FichaTecnica.tsx` | **Crear**: el bloque de solo lectura, reutilizado por la hoja de vida y el ticket. |
| `apps/desk/src/components/CatalogoEquipos.tsx` | **Modificar**: edición de la ficha al abrir un modelo. |
| `apps/desk/src/components/HojaDeVida.tsx` | **Modificar**: montar el bloque arriba. |
| `apps/desk/src/components/TicketProperties.tsx` | **Modificar**: montar el bloque compacto. |

---

## Task 1: Esquema

**Files:**
- Modify: `packages/zoho-sync/src/db/schema.sql` (al final)
- Test: `packages/zoho-sync/src/db/migrate.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Añadir al final del `describe` existente de `packages/zoho-sync/src/db/migrate.test.ts`:

```ts
  it('crea catalogo_documentos y catalogo_modelos.sku', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,sku) VALUES ('cmod-1','cmar-1','APSA-370','SKU-123')")
    // Un documento que es ENLACE: sin fichero.
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url) VALUES ('doc-1','cmod-1','manual','Manual de usuario','https://ejemplo/m.pdf')")
    // Y uno que es FICHERO: sin url.
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size) VALUES ('doc-2','cmod-1','foto','Foto','AAA','image/png',3)")

    const d = await db.query('SELECT id, modelo_id, tipo, nombre, url, content_b64 FROM catalogo_documentos ORDER BY id')
    expect(d.rows[0]).toMatchObject({ id: 'doc-1', tipo: 'manual', url: 'https://ejemplo/m.pdf', content_b64: null })
    expect(d.rows[1]).toMatchObject({ id: 'doc-2', tipo: 'foto', url: null, content_b64: 'AAA' })
    expect((await db.query('SELECT sku FROM catalogo_modelos')).rows[0].sku).toBe('SKU-123')
  })
```

Si el ayudante que crea la base no se llama `freshDb`, usa el que ya exista — copia el patrón de los tests vecinos.

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts -t "catalogo_documentos"`
Expected: FAIL — `relation "catalogo_documentos" does not exist`

- [ ] **Step 3: Añadir el esquema**

Al **final** de `packages/zoho-sync/src/db/schema.sql`:

```sql
-- Documentos de un modelo del catalogo: su foto de referencia, manuales, instructivos y guias. Cada fila es O un enlace -url- O un fichero subido -content_b64-, nunca las dos cosas ni ninguna: lo comprueba el repo y no el esquema, porque pg-mem trata los CHECK de forma desigual y una restriccion que solo existe en produccion da falsa seguridad en los tests
CREATE TABLE IF NOT EXISTS public.catalogo_documentos (
  id text PRIMARY KEY,
  modelo_id text NOT NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  url text,
  content_b64 text,
  content_type text,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);
CREATE INDEX IF NOT EXISTS idx_catalogo_documentos_modelo ON catalogo_documentos (modelo_id);

-- El SKU es del MODELO y no del equipo. Sin books.items en desk-db no se valida contra nada: es una cadena que alguien teclea, y habra que reconciliarla cuando llegue la sincronizacion con Books
ALTER TABLE catalogo_modelos ADD COLUMN IF NOT EXISTS sku text;
```

⚠️ La foto **NO** es una columna de `catalogo_modelos`. Esa tabla la lee `leerCatalogo` cada vez que alguien abre el formulario de equipos, y arrastrar 35 imágenes en base64 en cada carga sería un desastre silencioso — de los que solo se notan cuando la aplicación ya va lenta.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts`
Expected: PASS

- [ ] **Step 5: Verificar y commitear**

Run desde la raíz: `npm test` → **499 passed | 2 skipped** (498 + 1). `npm run lint` → `0 errors, 158 warnings`. `npm run typecheck` → exit 0.

```bash
git add packages/zoho-sync/src/db/schema.sql packages/zoho-sync/src/db/migrate.test.ts
git commit -F <fichero con el mensaje>
```

Mensaje: `feat(desk): tabla de documentos del modelo y columna sku`

---

## Task 2: Tipos compartidos

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Añadir los tipos**

Junto a `CatalogoModelo` en `packages/shared/src/types.ts`:

```ts
/** Los tipos de documento que admite la ficha. Lista blanca en el código y no un CHECK del esquema:
 *  añadir uno nuevo no debería exigir una migración. */
export const TIPOS_DOCUMENTO = ['foto', 'manual', 'instructivo', 'guia'] as const
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]

/**
 * Un documento de la ficha. **Nunca lleva el `content_b64`**: el fichero se pide aparte por el proxy
 * (`/api/catalogo/modelos/:id/documentos/:docId/contenido`), así una ficha con diez documentos no
 * arrastra diez ficheros cada vez que alguien la abre.
 *
 * `url` con valor ⇒ es un enlace. `url` nulo ⇒ es un fichero subido. Nunca las dos cosas.
 */
export interface DocumentoModelo {
  id: string
  tipo: TipoDocumento
  nombre: string
  url: string | null
  contentType: string | null
  size: number | null
}

/** La foto va SEPARADA de `documentos` aunque en la tabla sea una fila más con `tipo='foto'`: la
 *  pantalla la trata distinto, y separarla aquí ahorra que cada consumidor la filtre por su cuenta. */
export interface FichaModelo {
  modeloId: string
  sku: string | null
  foto: DocumentoModelo | null
  documentos: DocumentoModelo[]
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npm run typecheck` → exit 0. `npm test` → **499 passed | 2 skipped** (sin cambios). `npm run lint` → `0 errors, 158 warnings`.

Comprueba que `packages/shared/src/index.ts` los reexporta; si ya usa `export * from './types'`, no toques nada.

Mensaje: `feat(desk): tipos compartidos de la ficha técnica del modelo`

---

## Task 3: Repo de la ficha — lectura y alta de enlace

**Files:**
- Create: `apps/desk/server/db/fichaModelo.ts`
- Test: `apps/desk/server/db/fichaModelo.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `apps/desk/server/db/fichaModelo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { leerFicha, crearEnlace, DocumentoInvalido } from './fichaModelo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m1','Horiba')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo1','m1','APSA-370')")
})

describe('leerFicha', () => {
  it('devuelve el sku, la foto aparte y el resto de documentos', async () => {
    await db.query("UPDATE catalogo_modelos SET sku='SKU-1' WHERE id='mo1'")
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size) VALUES ('d-foto','mo1','foto','Vista frontal','AAA','image/png',3)")
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url) VALUES ('d-man','mo1','manual','Manual','https://x/m.pdf')")

    const f = await leerFicha(db, 'mo1')
    expect(f).toMatchObject({ modeloId: 'mo1', sku: 'SKU-1' })
    expect(f!.foto).toMatchObject({ id: 'd-foto', tipo: 'foto', url: null })
    // La foto NO se repite dentro de `documentos`: ya va aparte.
    expect(f!.documentos.map((d) => d.id)).toEqual(['d-man'])
  })

  // El base64 no puede viajar en la ficha: una con diez documentos arrastraría diez ficheros cada
  // vez que alguien la abre, y eso no se nota hasta que la aplicación ya va lenta.
  it('nunca incluye el contenido del fichero', async () => {
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type) VALUES ('d1','mo1','manual','M','SECRETO','application/pdf')")
    const f = await leerFicha(db, 'mo1')
    expect(JSON.stringify(f)).not.toContain('SECRETO')
  })

  it('un modelo sin ficha devuelve la ficha vacía, no null', async () => {
    const f = await leerFicha(db, 'mo1')
    expect(f).toEqual({ modeloId: 'mo1', sku: null, foto: null, documentos: [] })
  })

  it('null si el modelo no existe', async () => {
    expect(await leerFicha(db, 'no-existe')).toBeNull()
  })
})

describe('crearEnlace', () => {
  it('da de alta un documento con url y sin fichero', async () => {
    const id = await crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'Manual', url: 'https://x/m.pdf', creadoPor: 'Admin' })
    expect(id).toMatch(/^cdoc-/)
    const f = await leerFicha(db, 'mo1')
    expect(f!.documentos[0]).toMatchObject({ nombre: 'Manual', url: 'https://x/m.pdf', contentType: null })
  })

  // Nombre y url vacíos son el error corriente de un formulario mal rellenado, y dejarlos entrar
  // crearía filas que la pantalla no sabe pintar.
  it('rechaza nombre o url vacíos', async () => {
    await expect(crearEnlace(db, 'mo1', { tipo: 'manual', nombre: '  ', url: 'https://x', creadoPor: 'A' })).rejects.toBeInstanceOf(DocumentoInvalido)
    await expect(crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'M', url: '   ', creadoPor: 'A' })).rejects.toBeInstanceOf(DocumentoInvalido)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/fichaModelo.test.ts`
Expected: FAIL — no encuentra `./fichaModelo`

- [ ] **Step 3: Implementar**

Crear `apps/desk/server/db/fichaModelo.ts`:

```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DocumentoModelo, FichaModelo, TipoDocumento } from '@ambientalia/shared'

/** Las filas de pg como las trata este repo: `any` sube el lint por encima de la línea base. */
const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** Documento que no se puede guardar. Clase propia para que la ruta lo traduzca a 422 sin adivinar. */
export class DocumentoInvalido extends Error {
  constructor(motivo: string) {
    super(motivo)
    this.name = 'DocumentoInvalido'
  }
}

/** Sin `content_b64` NUNCA: el fichero se pide por el proxy, no viaja en la ficha. */
const SELECT_DOC = 'id, tipo, nombre, url, content_type, size'

const aDocumento = (r: Record<string, unknown>): DocumentoModelo => ({
  id: String(r.id),
  tipo: String(r.tipo) as TipoDocumento,
  nombre: String(r.nombre),
  url: (r.url as string) ?? null,
  contentType: (r.content_type as string) ?? null,
  size: r.size == null ? null : Number(r.size),
})

/**
 * La ficha de un modelo. `null` solo si el modelo no existe — un modelo **sin** documentos devuelve
 * una ficha vacía, que es un estado legítimo y distinto de «no hay tal modelo».
 *
 * La foto sale **aparte** de `documentos` aunque en la tabla sea una fila más con `tipo='foto'`: la
 * pantalla la trata distinto, y separarla aquí ahorra que cada consumidor la filtre por su cuenta.
 */
export async function leerFicha(db: Queryable, modeloId: string): Promise<FichaModelo | null> {
  const mo = await db.query('SELECT id, sku FROM catalogo_modelos WHERE id = $1', [modeloId])
  const fila = filas(mo.rows)[0]
  if (!fila) return null

  const docs = await db.query(
    `SELECT ${SELECT_DOC} FROM catalogo_documentos WHERE modelo_id = $1 ORDER BY tipo, nombre`,
    [modeloId],
  )
  const todos = filas(docs.rows).map(aDocumento)
  return {
    modeloId: String(fila.id),
    sku: (fila.sku as string) ?? null,
    foto: todos.find((d) => d.tipo === 'foto') ?? null,
    documentos: todos.filter((d) => d.tipo !== 'foto'),
  }
}

/** Alta de un documento que es un ENLACE: sin fichero, sin tamaño, sin tipo de contenido. */
export async function crearEnlace(
  db: Queryable,
  modeloId: string,
  input: { tipo: TipoDocumento; nombre: string; url: string; creadoPor: string },
): Promise<string> {
  const nombre = input.nombre.trim()
  const url = input.url.trim()
  if (!nombre) throw new DocumentoInvalido('El nombre es obligatorio')
  if (!url) throw new DocumentoInvalido('El enlace es obligatorio')
  const id = 'cdoc-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url,created_by) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, modeloId, input.tipo, nombre, url, input.creadoPor],
  )
  return id
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/fichaModelo.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Verificar y commitear**

Run desde la raíz: `npm test` → **505 passed | 2 skipped** (499 + 6). `npm run lint` → `0 errors, 158 warnings`. `npm run typecheck` → exit 0.

Mensaje: `feat(desk): lectura de la ficha del modelo y alta de enlaces`

- [ ] **Step 6: Comprobar que el test muerde**

Tras commitear, añade `content_b64` a `SELECT_DOC` y a `aDocumento`. El test «nunca incluye el contenido del fichero» debe FALLAR. Restaura con `git checkout -- apps/desk/server/db/fichaModelo.ts` y confirma con `git status --short`.

---

## Task 4: Repo de la ficha — alta de fichero, contenido y baja

**Files:**
- Modify: `apps/desk/server/db/fichaModelo.ts`
- Test: `apps/desk/server/db/fichaModelo.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir a `apps/desk/server/db/fichaModelo.test.ts`. **Los nombres nuevos van al `import` de arriba**, nunca en un import a media altura (`import/first` lo rechaza y subiría el lint).

```ts
describe('crearFichero', () => {
  it('da de alta un documento con contenido y sin url', async () => {
    const id = await crearFichero(db, 'mo1', {
      tipo: 'manual', nombre: 'Manual', contentB64: 'QUJD', contentType: 'application/pdf', size: 3, creadoPor: 'Admin',
    })
    const c = await contenidoDocumento(db, 'mo1', id)
    expect(c).toEqual({ contentType: 'application/pdf', contentB64: 'QUJD' })
    const f = await leerFicha(db, 'mo1')
    expect(f!.documentos[0]).toMatchObject({ nombre: 'Manual', url: null, size: 3 })
  })

  /**
   * La foto de referencia es UNA por modelo: subir otra sustituye la anterior en vez de acumularlas.
   * Sin esto la ficha acabaría con cinco fotos y nadie sabría cuál es «la» del modelo — y `leerFicha`
   * devolvería una cualquiera, la que el ORDER BY dejara primero.
   */
  it('subir una foto nueva sustituye la anterior; un manual nuevo NO sustituye nada', async () => {
    const vieja = await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'V', contentB64: 'AAA', contentType: 'image/png', size: 3, creadoPor: 'A' })
    const nueva = await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'N', contentB64: 'BBB', contentType: 'image/png', size: 3, creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', vieja)).toBeNull()
    expect((await leerFicha(db, 'mo1'))!.foto).toMatchObject({ id: nueva, nombre: 'N' })

    await crearFichero(db, 'mo1', { tipo: 'manual', nombre: 'M1', contentB64: 'CCC', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    await crearFichero(db, 'mo1', { tipo: 'manual', nombre: 'M2', contentB64: 'DDD', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    expect((await leerFicha(db, 'mo1'))!.documentos.length).toBe(2)
  })

  it('rechaza el nombre vacío', async () => {
    await expect(crearFichero(db, 'mo1', { tipo: 'manual', nombre: ' ', contentB64: 'A', contentType: 'application/pdf', size: 1, creadoPor: 'A' }))
      .rejects.toBeInstanceOf(DocumentoInvalido)
  })
})

describe('contenidoDocumento', () => {
  // Un enlace no tiene fichero que servir. Devolver la url por esta vía confundiría dos cosas
  // distintas: la ruta la traduce a 404, que es lo que de verdad ocurre.
  it('devuelve null para un documento que es un enlace', async () => {
    const id = await crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'M', url: 'https://x', creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', id)).toBeNull()
  })

  // El modelo va en la consulta y no solo en la ruta: sin esa condición, saber un id bastaría para
  // leer el fichero de cualquier otro modelo.
  it('devuelve null si el documento es de otro modelo', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo2','m1','APOA-370')")
    const id = await crearFichero(db, 'mo2', { tipo: 'manual', nombre: 'M', contentB64: 'AAA', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', id)).toBeNull()
  })
})

describe('borrarDocumento', () => {
  it('borra el suyo y no el de otro modelo', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo2','m1','APOA-370')")
    const mio = await crearEnlace(db, 'mo1', { tipo: 'guia', nombre: 'G', url: 'https://x', creadoPor: 'A' })
    const ajeno = await crearEnlace(db, 'mo2', { tipo: 'guia', nombre: 'G', url: 'https://x', creadoPor: 'A' })

    expect(await borrarDocumento(db, 'mo1', ajeno)).toBe(false) // no es suyo: no lo toca
    expect(await borrarDocumento(db, 'mo1', mio)).toBe(true)
    expect((await leerFicha(db, 'mo1'))!.documentos).toEqual([])
    expect((await leerFicha(db, 'mo2'))!.documentos.length).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/fichaModelo.test.ts -t "crearFichero"`
Expected: FAIL — `crearFichero is not a function`

- [ ] **Step 3: Implementar**

Añadir a `apps/desk/server/db/fichaModelo.ts`:

```ts
/**
 * Alta de un documento que es un FICHERO subido: sin url. Lo sirve después el proxy autenticado de
 * la aplicación, igual que las fotos de remisión — nada sale de la sesión.
 *
 * Si el tipo es `foto`, **sustituye la anterior del modelo** en vez de acumularse: la foto de
 * referencia es una por modelo, y sin esto la ficha acabaría con cinco sin que nadie supiera cuál es
 * la buena. El resto de tipos sí se acumulan: un modelo puede tener varios manuales.
 */
export async function crearFichero(
  db: Queryable,
  modeloId: string,
  input: { tipo: TipoDocumento; nombre: string; contentB64: string; contentType: string; size: number; creadoPor: string },
): Promise<string> {
  const nombre = input.nombre.trim()
  if (!nombre) throw new DocumentoInvalido('El nombre es obligatorio')
  if (input.tipo === 'foto') {
    await db.query("DELETE FROM catalogo_documentos WHERE modelo_id = $1 AND tipo = 'foto'", [modeloId])
  }
  const id = 'cdoc-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, modeloId, input.tipo, nombre, input.contentB64, input.contentType, input.size, input.creadoPor],
  )
  return id
}

/**
 * El fichero de un documento, para servirlo por el proxy. `null` si no existe, si es de otro modelo
 * o si es un enlace — un enlace no tiene fichero que servir, y devolver su url por esta vía
 * confundiría dos cosas distintas.
 *
 * El `modelo_id` va en la consulta y no solo en la ruta: sin esa condición, saber un id bastaría
 * para leer el fichero de cualquier otro modelo.
 */
export async function contenidoDocumento(
  db: Queryable,
  modeloId: string,
  docId: string,
): Promise<{ contentType: string; contentB64: string } | null> {
  const r = await db.query(
    'SELECT content_type, content_b64 FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2',
    [docId, modeloId],
  )
  const f = filas(r.rows)[0]
  if (!f || f.content_b64 == null) return null
  return { contentType: (f.content_type as string) ?? 'application/octet-stream', contentB64: String(f.content_b64) }
}

/** Baja. Devuelve si borró algo, para que la ruta distinga un 404 de un borrado real. */
export async function borrarDocumento(db: Queryable, modeloId: string, docId: string): Promise<boolean> {
  const antes = await db.query('SELECT 1 FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2', [docId, modeloId])
  if (!antes.rows.length) return false
  await db.query('DELETE FROM catalogo_documentos WHERE id = $1 AND modelo_id = $2', [docId, modeloId])
  return true
}
```

El `SELECT` previo del borrado en vez de mirar `rowCount`: pg-mem no siempre lo rellena, y es el mismo patrón de comprobar-antes que ya usa el resto del proyecto.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/fichaModelo.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: Verificar y commitear**

Run desde la raíz: `npm test` → **511 passed | 2 skipped** (505 + 6). `npm run lint` → `0 errors, 158 warnings`. `npm run typecheck` → exit 0.

Mensaje: `feat(desk): ficheros de la ficha del modelo, con foto única por modelo`

- [ ] **Step 6: Comprobar que los tests muerden**

Tras commitear, una a una, restaurando entre medias con `git checkout -- apps/desk/server/db/fichaModelo.ts`:

1. Quita el `DELETE` de la foto anterior en `crearFichero` → debe fallar el test de sustitución.
2. Quita `AND modelo_id = $2` de `contenidoDocumento` → debe fallar el test del documento de otro modelo.
3. Haz que `contenidoDocumento` devuelva algo cuando `content_b64` es null → debe fallar el test del enlace.

Confirma con `git status --short` tras cada restauración.

---

## Task 5: Rutas de la ficha

**Files:**
- Modify: `apps/desk/server/routes/catalogo.ts`
- Modify: `apps/desk/server/db/catalogo.ts` (`actualizarModelo` acepta `sku`)
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al final del `describe('Catálogo maestro de equipos')` de `apps/desk/server/app.test.ts`:

```ts
  /** Modelo listo para colgarle ficha. Devuelve su id. */
  async function modeloParaFicha(app: ReturnType<typeof appWith>['app'], cookie: string): Promise<string> {
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    return (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370' })).body.id
  }

  it('alta de enlace y de fichero; la ficha los devuelve y el proxy sirve el fichero', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)

    const enlace = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'Manual de usuario', url: 'https://ejemplo/m.pdf' })
    expect(enlace.status).toBe(201)

    const subida = await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'Vista frontal')
      .attach('archivo', Buffer.from('imagen'), { filename: 'f.png', contentType: 'image/png' })
    expect(subida.status).toBe(201)

    const ficha = await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)
    expect(ficha.status).toBe(200)
    expect(ficha.body.foto).toMatchObject({ nombre: 'Vista frontal', url: null })
    expect(ficha.body.documentos.map((d: { nombre: string }) => d.nombre)).toEqual(['Manual de usuario'])

    const contenido = await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${ficha.body.foto.id}/contenido`).set('Cookie', cookie)
    expect(contenido.status).toBe(200)
    expect(contenido.headers['content-type']).toContain('image/png')
    expect(contenido.text).toBe('imagen')
  })

  // Un enlace no tiene fichero que servir.
  it('404 al pedir el contenido de un documento que es un enlace', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const id = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/documentos/${id}/contenido`).set('Cookie', cookie)).status).toBe(404)
  })

  it('422 sin nombre, sin url ni fichero, o con un tipo que no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    const post = (body: object) => request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie).send(body)
    expect((await post({ tipo: 'manual', nombre: '', url: 'https://x' })).status).toBe(422)
    expect((await post({ tipo: 'manual', nombre: 'M' })).status).toBe(422)
    expect((await post({ tipo: 'inventado', nombre: 'M', url: 'https://x' })).status).toBe(422)
  })

  it('el sku se guarda por el PATCH del modelo y sale en la ficha', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    expect((await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ sku: 'SKU-9' })).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', cookie)).body.sku).toBe('SKU-9')
  })

  // Es la regresión más fácil de introducir y la más difícil de notar: todo seguiría funcionando,
  // solo más lento cada día que pasara.
  it('GET /api/catalogo sigue sin devolver documentos ni base64', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, cookie)
    await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', cookie)
      .field('tipo', 'foto').field('nombre', 'F')
      .attach('archivo', Buffer.from('IMAGENSECRETA'), { filename: 'f.png', contentType: 'image/png' })

    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(JSON.stringify(c.body)).not.toContain('IMAGENSECRETA')
    expect(JSON.stringify(c.body)).not.toContain('documentos')
  })

  it('leer la ficha exige sesión; escribir exige super administrador', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const modeloId = await modeloParaFicha(app, admin)
    const docId = (await request(app).post(`/api/catalogo/modelos/${modeloId}/documentos`).set('Cookie', admin)
      .send({ tipo: 'manual', nombre: 'M', url: 'https://x' })).body.id
    const op = await userCookie(['Servicio Técnico'])

    // Leer: cualquiera con sesión. El técnico tiene que poder abrir el manual.
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`).set('Cookie', op)).status).toBe(200)
    expect((await request(app).get(`/api/catalogo/modelos/${modeloId}/ficha`)).status).toBe(401)

    // Escribir: solo super administrador.
    const alta = `/api/catalogo/modelos/${modeloId}/documentos`
    expect((await request(app).post(alta).set('Cookie', op).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(403)
    expect((await request(app).post(alta).send({ tipo: 'manual', nombre: 'X', url: 'https://y' })).status).toBe(401)
    const baja = `/api/catalogo/modelos/${modeloId}/documentos/${docId}`
    expect((await request(app).delete(baja).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(baja)).status).toBe(401)
    expect((await request(app).delete(baja).set('Cookie', admin)).status).toBe(200)
  })
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/app.test.ts -t "alta de enlace y de fichero"`
Expected: FAIL — 404

- [ ] **Step 3: `actualizarModelo` acepta `sku`**

En `apps/desk/server/db/catalogo.ts`, dentro de `actualizarModelo`, y añade `sku?: string | null` al tipo del parámetro `patch`:

```ts
  if (patch.sku !== undefined) await db.query('UPDATE catalogo_modelos SET sku=$2 WHERE id=$1', [id, patch.sku])
```

⚠️ **Colócalo junto al manejo de `activo`, es decir ANTES de la línea `if (patch.tipoId === undefined) return { discrepan: 0 }`.** Esa línea sale de la función en cuanto no viene `tipoId`, y un `PATCH` que solo trae `sku` no lo trae. Si lo pones después, el SKU no se guardaría nunca y **el test lo cazaría, pero el motivo no sería evidente**: parecería un problema de la ruta y no del orden de dos líneas.

- [ ] **Step 4: Las rutas**

En `apps/desk/server/routes/catalogo.ts`. Añade arriba:

```ts
import multer from 'multer'
import { TIPOS_DOCUMENTO, type TipoDocumento } from '@ambientalia/shared'
import { leerFicha, crearEnlace, crearFichero, contenidoDocumento, borrarDocumento, DocumentoInvalido } from '../db/fichaModelo'

// Mismo límite que resoluciones y remisiones. Un manual más grande se ENLAZA en vez de subirse, que
// es justo el caso que motivó admitir los dos caminos.
const subida = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const esTipoDocumento = (v: string): v is TipoDocumento => (TIPOS_DOCUMENTO as readonly string[]).includes(v)
```

Y dentro de `registerCatalogoRoutes`, **antes** de la ruta `DELETE /api/catalogo/:entidad/:id` (para que su comodín no capture estas):

```ts
  // Leer la ficha: cualquiera con sesión. El técnico que repara tiene que poder abrir el manual;
  // decidir qué documentos existen es administrar. Nunca devuelve `content_b64` (ver leerFicha).
  app.get('/api/catalogo/modelos/:id/ficha', requireAuth(db), asyncHandler(async (req, res) => {
    const f = await leerFicha(db, String(req.params.id))
    if (!f) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    res.json(f)
  }))

  // El fichero, por el proxy autenticado de la aplicación: nada sale de la sesión. 404 si el
  // documento es un enlace — no hay fichero que servir.
  app.get('/api/catalogo/modelos/:id/documentos/:docId/contenido', requireAuth(db), asyncHandler(async (req, res) => {
    const c = await contenidoDocumento(db, String(req.params.id), String(req.params.docId))
    if (!c) { res.status(404).json({ error: 'No encontrado' }); return }
    res.set('Content-Type', c.contentType)
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(c.contentB64, 'base64'))
  }))

  // Alta. Admite las dos formas: JSON con `url` (enlace) o multipart con el campo `archivo`.
  app.post('/api/catalogo/modelos/:id/documentos', requireAuth(db), requireSuperAdmin, subida.single('archivo'), asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await existeEnCatalogo(db, 'modelos', modeloId))) { res.status(404).json({ error: 'Modelo no encontrado' }); return }
    const b = (req.body ?? {}) as Record<string, unknown>
    const tipo = String(b.tipo ?? '')
    if (!esTipoDocumento(tipo)) { res.status(422).json({ error: 'Tipo de documento no válido' }); return }
    const nombre = String(b.nombre ?? '')
    const creadoPor = req.user?.name ?? 'App'
    try {
      if (req.file) {
        const id = await crearFichero(db, modeloId, {
          tipo, nombre, contentB64: req.file.buffer.toString('base64'),
          contentType: req.file.mimetype, size: req.file.size, creadoPor,
        })
        res.status(201).json({ id }); return
      }
      const url = String(b.url ?? '')
      if (!url.trim()) { res.status(422).json({ error: 'Hace falta un enlace o un archivo' }); return }
      res.status(201).json({ id: await crearEnlace(db, modeloId, { tipo, nombre, url, creadoPor }) })
    } catch (err) {
      if (err instanceof DocumentoInvalido) { res.status(422).json({ error: err.message }); return }
      throw err
    }
  }))

  app.delete('/api/catalogo/modelos/:id/documentos/:docId', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const ok = await borrarDocumento(db, String(req.params.id), String(req.params.docId))
    if (!ok) { res.status(404).json({ error: 'No encontrado' }); return }
    res.json({ ok: true })
  }))
```

Y en el `PATCH /api/catalogo/modelos/:id` ya existente, añade dentro de la construcción del `patch`:

```ts
    if (b.sku !== undefined) patch.sku = b.sku ? String(b.sku).trim() : null
```

⚠️ **El orden de registro importa.** `DELETE /api/catalogo/:entidad/:id` es un comodín de dos segmentos; `DELETE /api/catalogo/modelos/:id/documentos/:docId` tiene cuatro, así que no colisionan. Pero registra las rutas de ficha antes de todos modos: es más fácil de leer y no depende de contar segmentos.

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/app.test.ts -t "Catálogo maestro"`
Expected: PASS

- [ ] **Step 6: Verificar y commitear**

Run desde la raíz: `npm test` → **517 passed | 2 skipped** (511 + 6). `npm run lint` → `0 errors, 158 warnings`. `npm run typecheck` → exit 0.

Mensaje: `feat(desk): endpoints de la ficha técnica del modelo`

- [ ] **Step 7: Comprobar que los tests muerden**

Tras commitear, restaurando entre medias:

1. Quita `requireSuperAdmin` del `POST` de documentos → debe fallar el test de autorización.
2. Haz que `GET /api/catalogo` devuelva también los documentos → debe fallar el test de la regresión.

---

## Task 6: Cliente HTTP

**Files:**
- Modify: `apps/desk/src/api/client.ts`

- [ ] **Step 1: Añadir las funciones**

Junto a las del catálogo en `apps/desk/src/api/client.ts` (y añade `FichaModelo` y `TipoDocumento` al `import type` de `@ambientalia/shared`):

```ts
export function getFichaModelo(modeloId: string): Promise<FichaModelo> {
  return fetch(`/api/catalogo/modelos/${modeloId}/ficha`, { credentials: 'include' }).then((r) => json<FichaModelo>(r))
}

/** La URL con la que se pinta un fichero (`<img src>`) o se descarga. Los enlaces usan su `url`. */
export const urlDocumento = (modeloId: string, docId: string): string =>
  `/api/catalogo/modelos/${modeloId}/documentos/${docId}/contenido`

export const crearEnlaceDocumento = (modeloId: string, input: { tipo: TipoDocumento; nombre: string; url: string }) =>
  escribirCatalogo<{ id: string }>(`/api/catalogo/modelos/${modeloId}/documentos`, 'POST', input)

/** Subida multipart: NO pasa por `escribirCatalogo`, que manda JSON. */
export async function subirDocumento(modeloId: string, tipo: TipoDocumento, nombre: string, archivo: File): Promise<{ id: string }> {
  const fd = new FormData()
  fd.append('tipo', tipo)
  fd.append('nombre', nombre)
  fd.append('archivo', archivo)
  const res = await fetch(`/api/catalogo/modelos/${modeloId}/documentos`, { method: 'POST', credentials: 'include', body: fd })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<{ id: string }>
}

export const borrarDocumentoModelo = (modeloId: string, docId: string) =>
  escribirCatalogo<{ ok: true }>(`/api/catalogo/modelos/${modeloId}/documentos/${docId}`, 'DELETE')
```

⚠️ `subirDocumento` **no** pone `Content-Type`: el navegador lo genera con el `boundary` del multipart. Ponerlo a mano rompe la subida en silencio.

- [ ] **Step 2: Verificar y commitear**

Run: `npm run typecheck` → exit 0. `npm run lint` → `0 errors, 158 warnings`. `npm test` → **517 passed | 2 skipped** (sin cambios).

Mensaje: `feat(desk): cliente HTTP de la ficha técnica`

---

## Task 7: El bloque de consulta

**Files:**
- Create: `apps/desk/src/components/FichaTecnica.tsx`

⚠️ **NO HAY HARNESS DE PRUEBAS DE COMPONENTES.** El proyecto no tiene jsdom. **No escribas tests de componente ni instales dependencias.** La verificación es typecheck, lint y build, más prueba manual del usuario. Dilo al entregar.

- [ ] **Step 1: Escribir el componente**

Crear `apps/desk/src/components/FichaTecnica.tsx`:

```tsx
import { useEffect, useState } from 'react'
import type { FichaModelo } from '@ambientalia/shared'
import { getFichaModelo, urlDocumento } from '../api/client'

/**
 * La ficha de un modelo, en solo lectura. La usan la hoja de vida y el panel del ticket, por eso vive
 * aparte de las dos: es el mismo dato enseñado en dos sitios, y duplicarlo garantizaría que uno de
 * los dos se quedara atrás.
 *
 * `compacto` es para el panel de propiedades del ticket, que es estrecho y ya va cargado: ahí la foto
 * va pequeña y los documentos como una lista de enlaces, sin cabecera propia.
 *
 * Un modelo sin ficha **no pinta nada**, ni siquiera un bloque vacío: en el ticket sería ruido en una
 * pantalla que ya tiene bastante.
 */
export function FichaTecnica({ modeloId, compacto = false }: { modeloId: string; compacto?: boolean }) {
  const [ficha, setFicha] = useState<FichaModelo | null>(null)

  useEffect(() => {
    let vivo = true
    getFichaModelo(modeloId).then((f) => { if (vivo) setFicha(f) }).catch(() => {})
    return () => { vivo = false }
  }, [modeloId])

  if (!ficha) return null
  const vacia = !ficha.foto && ficha.documentos.length === 0 && !ficha.sku
  if (vacia) return null

  // Un documento —la foto incluida— es un enlace o un fichero. Si tiene `url` se abre esa; si no, se
  // pide por el proxy autenticado. La foto usa la misma regla: también puede haberse dado de alta
  // como enlace, y asumir siempre el proxy la dejaría rota.
  const enlaceDe = (d: FichaModelo['documentos'][number]) => d.url ?? urlDocumento(modeloId, d.id)

  return (
    <section className={compacto ? 'flex flex-col gap-2' : 'border border-slate-200 rounded p-3 flex gap-4'}>
      {ficha.foto && (
        <img
          src={ficha.foto.url ?? urlDocumento(modeloId, ficha.foto.id)}
          alt={ficha.foto.nombre}
          className={compacto ? 'w-full max-h-[120px] object-contain rounded border border-slate-200' : 'w-[140px] h-[140px] object-contain rounded border border-slate-200 shrink-0'}
        />
      )}
      <div className="flex-1 min-w-0">
        {!compacto && <h3 className="text-[13px] font-bold text-slate-700 mb-1">Ficha técnica</h3>}
        {ficha.sku && <div className="text-[12px] text-slate-500 mb-1">SKU: <span className="text-slate-700">{ficha.sku}</span></div>}
        {ficha.documentos.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {ficha.documentos.map((d) => (
              <li key={d.id}>
                <a href={enlaceDe(d)} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 hover:underline">
                  {d.nombre}
                </a>
                <span className="text-[11px] text-slate-400 ml-1">· {d.tipo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npm run typecheck` → exit 0. `npm run lint` → `0 errors, 158 warnings`. `npm run build` → `✓ built`.

Mensaje: `feat(desk): bloque de consulta de la ficha técnica`

---

## Task 8: Editar la ficha en el catálogo

**Files:**
- Modify: `apps/desk/src/components/CatalogoEquipos.tsx`

⚠️ Sin harness de componentes: typecheck, lint, build y prueba manual.

- [ ] **Step 1: Añadir la edición**

**Lee el fichero entero antes de tocarlo.** En la tabla de Modelos, añade una acción **«Ficha»** por fila que abra un panel o modal con:

- El **SKU**, editable, guardado con `actualizarModeloCatalogo(id, { sku })`. Un texto bajo el campo advirtiendo de que **no se valida contra Zoho Books**, porque hoy es solo una cadena que alguien teclea.
- La **foto**: la actual si la hay (con `urlDocumento`), y un `<input type="file" accept="image/*">` para sustituirla. Al subir una nueva, el servidor borra la anterior — dilo en la pantalla para que no parezca que se acumulan.
- Los **documentos**: la lista con su nombre, su tipo y un botón de eliminar; y un alta con tipo (`manual`, `instructivo`, `guia`), nombre, y **o** un enlace **o** un fichero.

Todo el texto en español. Los errores del servidor se enseñan **tal cual** —ya vienen redactados— en la misma franja que usa el resto de la pantalla, no con `alert()`.

Sigue el estilo ya establecido en ese fichero: `field` para los inputs, botón principal `bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold`, acciones `text-[12px] text-blue-600` y destructivas en `text-red-600`.

- [ ] **Step 2: Verificar y commitear**

Run: `npm run typecheck` → exit 0. `npm run lint` → `0 errors, 158 warnings`. `npm run build` → `✓ built`. `npm test` → **517 passed | 2 skipped**.

Mensaje: `feat(desk): edición de la ficha técnica en el catálogo`

---

## Task 9: Montar el bloque en la hoja de vida y en el ticket

**Files:**
- Modify: `apps/desk/src/components/HojaDeVida.tsx`
- Modify: `apps/desk/src/components/TicketProperties.tsx`

⚠️ Sin harness de componentes: typecheck, lint, build y prueba manual.

- [ ] **Step 1: En la hoja de vida**

**Lee el fichero entero.** El componente ya recibe el equipo con su `modeloId` (viene en `EquipoFull`). Monta `<FichaTecnica modeloId={...} />` **arriba, antes de la cronología**, solo si el equipo tiene `modeloId`:

```tsx
{equipo.modeloId && <FichaTecnica modeloId={equipo.modeloId} />}
```

Así esa pantalla pasa a ser el sitio único del equipo: qué es, qué le ha pasado y cómo se repara.

- [ ] **Step 2: En el panel del ticket**

**Lee el fichero entero.** `TicketProperties` pinta las propiedades del ticket. El ticket trae `equipoId`, pero **no** el `modeloId` — hay que resolverlo.

Comprueba primero si `TicketDetail` ya lo trae. Si no, la vía más corta y sin tocar el servidor es que `TicketProperties` pida el equipo con `fetchEquipoHistorial(equipoId)` —que ya devuelve el equipo completo— o, mejor, exponer `modeloId` en el detalle del ticket si el mapeador ya tiene la fila a mano.

**Si resolverlo exige tocar el servidor, párate y repórtalo** en vez de improvisar: es una decisión de alcance, no un detalle de implementación.

Una vez resuelto, monta el bloque compacto al final del panel:

```tsx
{modeloId && <FichaTecnica modeloId={modeloId} compacto />}
```

Sin pestaña nueva: el detalle del ticket ya tiene bastantes.

- [ ] **Step 3: Verificar y commitear**

Run: `npm run typecheck` → exit 0. `npm run lint` → `0 errors, 158 warnings`. `npm run build` → `✓ built`. `npm test` → **517 passed | 2 skipped**.

Mensaje: `feat(desk): la ficha técnica se consulta desde la hoja de vida y el ticket`

---

## Task 10: Cierre

**Files:** `debt.md`

- [ ] **Step 1: Verificación final desde la raíz**

- `npm test` → **517 passed | 2 skipped**. **Calcula el número esperado y compáralo.** Si no cuadra, INVESTIGA; no lo ajustes a lo que salga. Un recuento que no cuadra ha delatado ya un fichero temporal olvidado en este proyecto.
- `npm run lint` → `0 errors, 158 warnings`.
- `npm run typecheck` → exit 0.
- `npm run build` → `✓ built`.
- `git status --short` → solo `docs/analisis-tickets/` y `docs/remisiones/`.

- [ ] **Step 2: Anotar en `debt.md`**

En la sección ROADMAP:

```markdown
- **Ficha técnica — el SKU no se valida (2026-08-07).** `catalogo_modelos.sku` es una cadena que alguien
  teclea: sin `books.items` en `desk-db` no hay contra qué contrastarla. Cuando llegue la sincronización con
  Books habrá que **reconciliar los SKU escritos a mano** con los artículos reales, y decidir si el campo pasa
  a ser una referencia en vez de texto libre.
- **Ficha técnica — sin versionado.** Sustituir la foto o un documento pisa el anterior. Nadie ha pedido
  conservar históricos y hacerlo multiplicaría el almacenamiento sin beneficio conocido.
```

- [ ] **Step 3: Commit y push**

```bash
git add debt.md
git commit -F <fichero con el mensaje>
git push origin main
```

- [ ] **Step 4: Decirle al usuario qué le toca**

1. **Desplegar.** No hace falta ninguna acción manual: la tabla y la columna las crea el esquema al arrancar. **No hay siembra que disparar.**
2. **Prueba manual**, que es lo único sin cobertura: subir una foto y comprobar que sustituye la anterior; dar de alta un enlace y un fichero; verlos desde la hoja de vida y desde el panel del ticket; y comprobar que **un modelo sin ficha no pinta ningún bloque**.
3. Que **el SKU no se valida contra Books**, y por qué.

---

## Notas de revisión del plan

Repasado contra la especificación. Cobertura: tabla y columna (Task 1), tipos (Task 2), repo completo (Tasks 3 y 4), las cinco rutas y el `sku` en el PATCH (Task 5), cliente (Task 6), bloque de consulta (Task 7), edición (Task 8), montaje en las dos pantallas (Task 9), y lo que queda fuera anotado (Task 10).

Tres cosas que la especificación dejaba implícitas y aquí se fijan:

- **`leerFicha` devuelve ficha vacía y no `null` cuando el modelo existe sin documentos.** `null` queda reservado a «no hay tal modelo», que es lo que la ruta traduce a 404.
- **`contenidoDocumento` filtra por `modelo_id`**, no solo por el id del documento. Sin esa condición, conocer un id bastaría para leer el fichero de cualquier otro modelo.
- **`subirDocumento` no fija `Content-Type`**: lo genera el navegador con el `boundary`. Ponerlo a mano rompe la subida en silencio, y es un error que se comete una vez en la vida.

Y un riesgo señalado como punto de parada: **el `modeloId` en el panel del ticket**. El detalle del ticket trae `equipoId` pero puede que no `modeloId`; si resolverlo exige tocar el servidor, la Task 9 dice explícitamente que hay que parar y reportarlo en vez de improvisar una vía.

Dos notas sobre la forma del plan, para que nadie las tome por descuidos:

- **Las tareas de interfaz (8 y 9) van descritas, no con el código entero.** Es deliberado: los ficheros que tocan hay que leerlos completos de todos modos para integrarse en ellos, y en la fase 1 este mismo formato produjo mejores decisiones de pantalla que las que yo habría dictado. Lo que sí va fijado es lo que no se puede improvisar — los estilos de la casa, el aviso de que el SKU no se valida, que la foto sustituye en vez de acumularse, y que los errores del servidor se enseñan tal cual.
- **El recuento de tests sube 1 → 6 → 6 → 6.** Está calculado contando los `it()` de cada bloque: Task 1 uno; Task 3 cuatro de `leerFicha` más dos de `crearEnlace`; Task 4 tres de `crearFichero`, dos de `contenidoDocumento` y uno de `borrarDocumento`; Task 5 seis. Si al ejecutar no cuadra, la causa está en los tests añadidos, no en la aritmética.
