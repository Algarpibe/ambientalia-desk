# Catálogo maestro de equipos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir marcas, modelos y tipos de equipo en maestros administrables, de modo que la tabla `equipos` deje de ser su propia fuente de referencia.

**Architecture:** Tres tablas nuevas (`catalogo_tipos`, `catalogo_marcas`, `catalogo_modelos`) más `equipos.modelo_id`. El catálogo pasa a ser la fuente y `equipos` su consumidora: al crear o editar un equipo se elige un modelo del catálogo y el servidor rellena desde él los textos `marca` / `modelo` / `tipo`, que se conservan porque los leen la búsqueda, los tickets, la hoja de vida y `perfilChecklist`. Una siembra idempotente en un endpoint admin puebla el catálogo desde el inventario actual sin reescribir ningún equipo.

**Tech Stack:** TypeScript ESM con tsx (sin build de servidor), Express 5, pg, pg-mem, Vitest + supertest, React 19 + Vite + Tailwind.

**Spec:** `docs/superpowers/specs/2026-08-06-catalogo-maestro-equipos-design.md`

---

## Contexto del repo que hace falta conocer

- **Monorepo npm workspaces.** Verificar SIEMPRE desde la raíz: `npm test` desde `apps/desk` corre solo una fracción.
- **Línea base a respetar:** 437 tests pasando / 2 saltados. Lint: 0 errores, **159 warnings**. Si el lint sube a 160+, lo has introducido tú — normalmente un `as any` en un test. Compara la salida antes y después, no a ojo.
- **`migrate()` es tolerante por sentencia:** una sentencia inválida se salta con un `console.error` y el arranque sigue. Por eso los backfills van en endpoints con test propio, nunca en `schema.sql`.
- **`schema.sql`:** comentarios en una sola línea y **sin punto y coma dentro del comentario** (`migrate` parte el fichero por `;`). Se añade siempre al final.
- **Trampas de pg-mem ya pagadas:** no resuelve subconsultas correlacionadas; no soporta `TRIM`, `length()`, `search_path` ni `INSERT … SELECT $n` tipado. `NOT IN` con un solo NULL dentro devuelve NULL para todas las filas. Por eso este plan **agrega en JavaScript** lo que podría hacerse con SQL más listo, igual que hace hoy `equipoFacets`.
- **Ids con prefijo**, como el resto (`eq-`, `app-`): aquí `ctip-`, `cmar-`, `cmod-` + `randomUUID()`.
- **Todo el texto de cara al usuario y todos los comentarios, en español.** Los comentarios explican el porqué, no el qué.
- **Commits en español**, `tipo(ámbito): descripción`, con el porqué en el cuerpo, y terminando con la línea `Co-Authored-By`.
- **No hay harness de componentes React** (sin jsdom): las tareas de UI se verifican con typecheck, lint, build y prueba manual del usuario. Hay que decirlo explícitamente al entregar.

Ficheros de test y sus ayudantes:
- `apps/desk/server/db/equipos.test.ts` — `db` global con `migrate` en `beforeEach`.
- `apps/desk/server/app.test.ts` — `adminCookie()`, `userCookie(areas)`, `appWith()` → `{ app }`, `request` de supertest.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` | **Modificar** (al final): las tres tablas y `equipos.modelo_id`. |
| `apps/desk/server/db/catalogo.ts` | **Crear**: repo del catálogo — lecturas, altas, cambios, borrado, conflictos. |
| `apps/desk/server/db/catalogoSeed.ts` | **Crear**: la siembra desde `equipos`. Fichero propio porque es código de una sola vez y no debe mezclarse con el repo que se usa a diario. |
| `apps/desk/server/routes/catalogo.ts` | **Crear**: las rutas `/api/catalogo/*`. |
| `apps/desk/server/db/catalogo.test.ts` | **Crear**: tests del repo. |
| `apps/desk/server/db/catalogoSeed.test.ts` | **Crear**: tests de la siembra (obligatorios, ver arriba). |
| `apps/desk/server/routes/admin.ts` | **Modificar**: endpoint `POST /api/admin/seed-catalogo`. |
| `apps/desk/server/routes/equipos.ts` | **Modificar**: `modeloId` obligatorio; retirar `/facets`. |
| `apps/desk/server/db/equipos.ts` | **Modificar**: `modelo_id` en altas/ediciones/lecturas; retirar `equipoFacets`. |
| `apps/desk/server/app.ts` | **Modificar**: registrar las rutas del catálogo. |
| `packages/shared/src/types.ts` | **Modificar**: tipos del catálogo y `modeloId` en `EquipoLite`. |
| `apps/desk/src/api/client.ts` | **Modificar**: funciones del catálogo; retirar `equipoFacets`. |
| `apps/desk/src/components/CatalogoEquipos.tsx` | **Crear**: la pantalla de administración. |
| `apps/desk/src/components/EquiposAdmin.tsx` | **Modificar**: `EquipoForm` cerrado contra el catálogo. |
| `apps/desk/src/components/Configuracion.tsx` | **Modificar**: entrada «Catálogo de equipos». |
| `apps/desk/src/App.tsx` | **Modificar**: montar la pantalla. |

---

## Task 1: Esquema

**Files:**
- Modify: `packages/zoho-sync/src/db/schema.sql` (al final del fichero)
- Test: `packages/zoho-sync/src/db/migrate.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Añadir al final de `packages/zoho-sync/src/db/migrate.test.ts`, dentro del `describe` existente:

```ts
  it('crea las tablas del catálogo maestro y equipos.modelo_id', async () => {
    const db = await freshDb()
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('ctip-1','Calibrador Multigas')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('cmod-1','cmar-1','APSA-370','ctip-1')")
    const m = await db.query('SELECT id, marca_id, nombre, tipo_id, revisar, activo FROM catalogo_modelos')
    expect(m.rows[0]).toMatchObject({ id: 'cmod-1', marca_id: 'cmar-1', nombre: 'APSA-370', tipo_id: 'ctip-1', revisar: false, activo: true })
    // La columna que ata el equipo a su modelo del catálogo.
    const e = await db.query('SELECT modelo_id FROM equipos')
    expect(e.rows).toEqual([])
  })
```

Si en ese fichero el ayudante que crea la base no se llama `freshDb`, usa el que ya exista — mira cómo lo hacen los tests vecinos y copia ese patrón exacto.

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts -t "catálogo maestro"`
Expected: FAIL — `relation "catalogo_tipos" does not exist`

- [ ] **Step 3: Añadir el esquema**

Al **final** de `packages/zoho-sync/src/db/schema.sql`:

```sql
-- Catalogo maestro de equipos. Antes las listas de marca/modelo/tipo se derivaban de la propia tabla equipos con un SELECT DISTINCT, de modo que un equipo mal registrado se convertia en una opcion oficial para todos los siguientes y la suciedad se realimentaba
CREATE TABLE IF NOT EXISTS public.catalogo_tipos (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalogo_marcas (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- tipo_id admite NULL a proposito: un modelo cuyos equipos no declaran tipo entra sin el y marcado para revisar, que es un dato honesto en vez de una invencion
CREATE TABLE IF NOT EXISTS public.catalogo_modelos (
  id text PRIMARY KEY,
  marca_id text NOT NULL,
  nombre text NOT NULL,
  tipo_id text,
  revisar boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marca_id, nombre)
);
CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_marca ON catalogo_modelos (marca_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_tipo ON catalogo_modelos (tipo_id);

-- El equipo apunta a su modelo del catalogo. Las columnas de texto marca/modelo/tipo se conservan porque las leen la busqueda, la creacion de tickets, la hoja de vida y perfilChecklist: lo que cambia es que ahora las escribe el catalogo y nadie mas
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS modelo_id text;
CREATE INDEX IF NOT EXISTS idx_equipos_modelo ON equipos (modelo_id);
```

La unicidad va **declarada y además comprobada en el repo** (Task 4). No son alternativas: la comprobación previa existe para dar un 409 entendible en vez de un error del driver, y la restricción es la red de seguridad para cuando esa comprobación falle o dos administradores den de alta lo mismo a la vez. `catalogo_modelos` es precisamente la tabla que existe para acabar con los duplicados, así que dejarla sin respaldo sería el sitio más caro donde ahorrárselo.

El modelo es único **dentro de su marca**, no globalmente: un `6103` de Environics y otro de Horiba son equipos distintos y los dos tienen que poder existir.

`idx_equipos_modelo` no es opcional: `modelo_id` va a ser la clave de unión del catálogo —comprobar si un modelo está en uso, contar conflictos— y sería la única columna con forma de clave foránea de `equipos` sin índice, teniéndolo `serial`, `cliente_nombre` y `tipo`.

Las tres tablas se quedan en `public` a propósito. `DESK_TABLES` mueve a `desk` solo las tablas heredadas de Zoho, y su propio comentario dice que las nativas de la app no se mueven: el catálogo nace aquí, así que `public` es su sitio. Que `equipos` sí viva en `desk` no rompe nada — el `search_path` de producción es `desk,public`.

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/zoho-sync/src/db/schema.sql packages/zoho-sync/src/db/migrate.test.ts
git commit -m "feat(desk): tablas del catálogo maestro de equipos"
```

---

## Task 2: Tipos compartidos

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Añadir los tipos**

Junto a `EquipoLite` / `EquipoFull` en `packages/shared/src/types.ts`:

```ts
export interface CatalogoTipo { id: string; nombre: string; activo: boolean }
export interface CatalogoMarca { id: string; nombre: string; activo: boolean }
export interface CatalogoModelo {
  id: string
  marcaId: string
  nombre: string
  tipoId: string | null
  /** Denormalizado para que la pantalla no tenga que cruzar listas. */
  tipoNombre: string | null
  /** La siembra lo enciende cuando el inventario daba más de un tipo para este modelo. */
  revisar: boolean
  activo: boolean
}
export interface Catalogo { tipos: CatalogoTipo[]; marcas: CatalogoMarca[]; modelos: CatalogoModelo[] }

/** Un modelo que el inventario declara con más de un tipo, con el reparto real que lo demuestra. */
export interface ConflictoModelo {
  modeloId: string
  marca: string
  modelo: string
  tipoActual: string | null
  reparto: Array<{ tipo: string; equipos: number }>
}
export interface Conflictos { modelos: ConflictoModelo[]; equiposSinModelo: number }
```

Y añadir a `EquipoLite` el campo:

```ts
  modeloId?: string
```

- [ ] **Step 2: Comprobar que compila**

Run: `npm run typecheck`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(desk): tipos compartidos del catálogo de equipos"
```

---

## Task 3: Repo del catálogo — lectura

**Files:**
- Create: `apps/desk/server/db/catalogo.ts`
- Test: `apps/desk/server/db/catalogo.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `apps/desk/server/db/catalogo.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { leerCatalogo } from './catalogo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

/** Siembra directa por SQL: estos tests miran la lectura, no cómo se dieron de alta las filas. */
async function seedMinimo(): Promise<void> {
  await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-so2','Analizador de SO2')")
  await db.query("INSERT INTO catalogo_tipos (id,nombre,activo) VALUES ('t-off','Tipo retirado',false)")
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-hor','Horiba')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-apsa','m-hor','APSA-370','t-so2')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,activo) VALUES ('mo-off','m-hor','VIEJO','t-so2',false)")
}

describe('leerCatalogo', () => {
  it('devuelve solo lo activo, con el nombre del tipo resuelto', async () => {
    await seedMinimo()
    const c = await leerCatalogo(db)
    expect(c.tipos.map((t) => t.id)).toEqual(['t-so2'])
    expect(c.marcas.map((m) => m.id)).toEqual(['m-hor'])
    expect(c.modelos.map((m) => m.id)).toEqual(['mo-apsa'])
    expect(c.modelos[0]).toMatchObject({ marcaId: 'm-hor', nombre: 'APSA-370', tipoNombre: 'Analizador de SO2', revisar: false })
  })

  // Sin esto, editar un equipo cuyo modelo se desactivó dejaría el campo en blanco y obligaría a
  // cambiarle el modelo para poder guardar — un efecto colateral que nadie pidió.
  it('incluir devuelve además el modelo desactivado que se le pida, y su marca', async () => {
    await seedMinimo()
    await db.query("UPDATE catalogo_marcas SET activo=false WHERE id='m-hor'")
    const c = await leerCatalogo(db, 'mo-off')
    expect(c.modelos.map((m) => m.id)).toContain('mo-off')
    expect(c.marcas.map((m) => m.id)).toContain('m-hor')
  })

  it('un modelo sin tipo sale con tipoNombre nulo, no revienta', async () => {
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-x','X')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,revisar) VALUES ('mo-x','m-x','SIN-TIPO',true)")
    const c = await leerCatalogo(db)
    expect(c.modelos[0]).toMatchObject({ tipoId: null, tipoNombre: null, revisar: true })
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts`
Expected: FAIL — no encuentra el módulo `./catalogo`

- [ ] **Step 3: Implementar**

Crear `apps/desk/server/db/catalogo.ts`:

```ts
import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Catalogo, CatalogoMarca, CatalogoModelo, CatalogoTipo } from '@ambientalia/shared'

const filaTipo = (r: any): CatalogoTipo => ({ id: r.id, nombre: r.nombre, activo: r.activo === true })
const filaMarca = (r: any): CatalogoMarca => ({ id: r.id, nombre: r.nombre, activo: r.activo === true })
const filaModelo = (r: any): CatalogoModelo => ({
  id: r.id, marcaId: r.marca_id, nombre: r.nombre,
  tipoId: r.tipo_id ?? null, tipoNombre: r.tipo_nombre ?? null,
  revisar: r.revisar === true, activo: r.activo === true,
})

/**
 * El catálogo tal como lo consumen los formularios: solo lo activo.
 *
 * `incluirModeloId` añade un modelo desactivado —y su marca, esté activa o no— para que editar un
 * equipo cuyo modelo se retiró no deje el campo en blanco y obligue a cambiárselo. Es el mismo
 * apaño que hacía `withCurrent` en la pantalla, resuelto aquí porque es el servidor quien sabe.
 */
export async function leerCatalogo(db: Queryable, incluirModeloId?: string | null): Promise<Catalogo> {
  const extra = incluirModeloId ?? ''
  const tipos = await db.query('SELECT id,nombre,activo FROM catalogo_tipos WHERE activo = true ORDER BY nombre')
  const modelos = await db.query(
    `SELECT mo.id, mo.marca_id, mo.nombre, mo.tipo_id, mo.revisar, mo.activo, ti.nombre AS tipo_nombre
       FROM catalogo_modelos mo LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.activo = true OR mo.id = $1
      ORDER BY mo.nombre`,
    [extra],
  )
  // Las marcas se piden DESPUÉS de los modelos porque la marca del modelo incluido tiene que entrar
  // aunque esté desactivada: sin ella, el desplegable de marca no podría enseñar la suya.
  const marcasNecesarias = modelos.rows.map((r: any) => r.marca_id)
  const marcas = await db.query('SELECT id,nombre,activo FROM catalogo_marcas ORDER BY nombre')
  const visibles = marcas.rows.filter((r: any) => r.activo === true || marcasNecesarias.includes(r.id))
  return {
    tipos: tipos.rows.map(filaTipo),
    marcas: visibles.map(filaMarca),
    modelos: modelos.rows.map(filaModelo),
  }
}

/** Un modelo por id, con su marca y su tipo ya resueltos a texto. Lo usa el alta de equipos. */
export async function getModelo(db: Queryable, id: string): Promise<{ id: string; nombre: string; marca: string; tipo: string | null } | null> {
  const r = await db.query(
    `SELECT mo.id, mo.nombre, ma.nombre AS marca, ti.nombre AS tipo
       FROM catalogo_modelos mo
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
       LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.id = $1`,
    [id],
  )
  const f = r.rows[0] as any
  return f ? { id: f.id, nombre: f.nombre, marca: f.marca, tipo: f.tipo ?? null } : null
}
```

El filtrado de marcas se hace en JavaScript a propósito: la alternativa en SQL sería una subconsulta correlacionada, y pg-mem no las resuelve.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/desk/server/db/catalogo.ts apps/desk/server/db/catalogo.test.ts
git commit -m "feat(desk): lectura del catálogo de equipos"
```

---

## Task 4: Repo del catálogo — altas

**Files:**
- Modify: `apps/desk/server/db/catalogo.ts`
- Test: `apps/desk/server/db/catalogo.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir a `apps/desk/server/db/catalogo.test.ts`. **Los nombres nuevos van al `import` de `./catalogo` que ya está arriba del fichero**, no en un `import` a media altura: la regla `import/first` los rechaza y subiría la línea base de lint.

```ts
// Arriba: import { leerCatalogo, crearTipo, crearMarca, crearModelo, NombreRepetido } from './catalogo'

describe('altas del catálogo', () => {
  it('crea tipo, marca y modelo con ids prefijados', async () => {
    const tipo = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: tipo })
    expect(tipo).toMatch(/^ctip-/)
    expect(marca).toMatch(/^cmar-/)
    expect(modelo).toMatch(/^cmod-/)
    const c = await leerCatalogo(db)
    expect(c.modelos[0]).toMatchObject({ nombre: 'APSA-370', tipoNombre: 'Analizador de SO2' })
  })

  // El nombre repetido es el caso corriente: dos administradores dando de alta lo mismo. Se avisa
  // con un error propio para que la ruta lo traduzca a 409 y no a un 500 del driver.
  it('rechaza un nombre repetido de tipo o de marca', async () => {
    await crearTipo(db, 'Analizador de SO2')
    await expect(crearTipo(db, 'Analizador de SO2')).rejects.toBeInstanceOf(NombreRepetido)
    await crearMarca(db, 'Horiba')
    await expect(crearMarca(db, 'Horiba')).rejects.toBeInstanceOf(NombreRepetido)
  })

  // El modelo es único DENTRO de su marca: un "6103" de Environics y otro de Horiba son equipos
  // distintos y los dos tienen que poder existir.
  it('rechaza un modelo repetido en la misma marca, pero lo admite en otra', async () => {
    const horiba = await crearMarca(db, 'Horiba')
    const environics = await crearMarca(db, 'Environics')
    await crearModelo(db, { marcaId: horiba, nombre: '6103', tipoId: null })
    await expect(crearModelo(db, { marcaId: horiba, nombre: '6103', tipoId: null })).rejects.toBeInstanceOf(NombreRepetido)
    await expect(crearModelo(db, { marcaId: environics, nombre: '6103', tipoId: null })).resolves.toMatch(/^cmod-/)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts -t "altas del catálogo"`
Expected: FAIL — `crearTipo is not a function`

- [ ] **Step 3: Implementar**

Añadir a `apps/desk/server/db/catalogo.ts`:

```ts
/** Nombre ya usado. Existe como clase propia para que la ruta lo traduzca a 409 sin adivinar. */
export class NombreRepetido extends Error {
  constructor(public readonly nombre: string) {
    super(`Ya existe «${nombre}»`)
    this.name = 'NombreRepetido'
  }
}

/**
 * La unicidad se comprueba con un SELECT previo y no con `ON CONFLICT`, por lo mismo que en
 * `seedChecklist`: es el patrón seguro en pg-mem, que no infiere el tipo de un `INSERT … SELECT $n`,
 * y deja el conflicto como un error nuestro con su mensaje en vez de como uno del driver.
 *
 * No sustituye a la restricción de la tabla, que sigue ahí: esto da el mensaje, aquella da la
 * garantía cuando dos administradores dan de alta lo mismo a la vez.
 */
export async function crearTipo(db: Queryable, nombre: string): Promise<string> {
  const n = nombre.trim()
  const ya = await db.query('SELECT 1 FROM catalogo_tipos WHERE LOWER(nombre) = $1', [n.toLowerCase()])
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'ctip-' + randomUUID()
  await db.query('INSERT INTO catalogo_tipos (id,nombre) VALUES ($1,$2)', [id, n])
  return id
}

export async function crearMarca(db: Queryable, nombre: string): Promise<string> {
  const n = nombre.trim()
  const ya = await db.query('SELECT 1 FROM catalogo_marcas WHERE LOWER(nombre) = $1', [n.toLowerCase()])
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'cmar-' + randomUUID()
  await db.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [id, n])
  return id
}

/** El modelo es único dentro de su marca: un "6103" de Environics y otro de Horiba coexisten. */
export async function crearModelo(
  db: Queryable,
  input: { marcaId: string; nombre: string; tipoId: string | null; revisar?: boolean },
): Promise<string> {
  const n = input.nombre.trim()
  const ya = await db.query(
    'SELECT 1 FROM catalogo_modelos WHERE marca_id = $1 AND LOWER(nombre) = $2',
    [input.marcaId, n.toLowerCase()],
  )
  if (ya.rows.length) throw new NombreRepetido(n)
  const id = 'cmod-' + randomUUID()
  await db.query(
    'INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,revisar) VALUES ($1,$2,$3,$4,$5)',
    [id, input.marcaId, n, input.tipoId, input.revisar === true],
  )
  return id
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Comprobar que el test muerde**

Cambiar en `crearModelo` la comprobación por `WHERE LOWER(nombre) = $2` (sin `marca_id = $1`, ajustando los parámetros). El tercer test debe fallar en la última aserción: el `6103` de Environics saldría rechazado.

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts -t "repetido en la misma marca"`
Expected: FAIL

**Deshacer la mutación** y volver a ejecutar para confirmar que pasa.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/db/catalogo.ts apps/desk/server/db/catalogo.test.ts
git commit -m "feat(desk): altas del catálogo de equipos con guarda de nombre repetido"
```

---

## Task 5: Repo del catálogo — cambios y borrado

**Files:**
- Modify: `apps/desk/server/db/catalogo.ts`
- Test: `apps/desk/server/db/catalogo.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir a `apps/desk/server/db/catalogo.test.ts`:

```ts
// Al import de arriba: actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada, EntradaEnUso

describe('cambios del catálogo', () => {
  it('renombra y desactiva un tipo', async () => {
    const t = await crearTipo(db, 'Analizador SO2')
    await actualizarTipo(db, t, { nombre: 'Analizador de Dióxido de Azufre (SO2)' })
    expect((await leerCatalogo(db)).tipos[0].nombre).toBe('Analizador de Dióxido de Azufre (SO2)')
    await actualizarTipo(db, t, { activo: false })
    expect((await leerCatalogo(db)).tipos).toEqual([])
  })

  // Fijar el tipo a conciencia ES resolver la duda, así que apaga `revisar` sin que haya que pedirlo
  // aparte. Por eso no hay endpoint "resolver": sería el mismo camino con otro nombre.
  it('fijar el tipo de un modelo apaga revisar y cuenta los equipos que discrepan', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const cal = await crearTipo(db, 'Calibrador Multigas')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: cal, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-2','B','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])

    const r = await actualizarModelo(db, modelo, { tipoId: so2, corregirEquipos: false })
    expect(r.discrepan).toBe(1) // eq-1 sigue diciendo Calibrador
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Analizador de SO2', revisar: false })
    const eq1 = await db.query("SELECT tipo FROM equipos WHERE id='eq-1'")
    expect(eq1.rows[0].tipo).toBe('Calibrador Multigas') // sin corregir, no se toca
  })

  it('corregirEquipos reescribe el tipo de los que discrepan', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null, revisar: true })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])

    const r = await actualizarModelo(db, modelo, { tipoId: so2, corregirEquipos: true })
    expect(r.discrepan).toBe(1)
    const eq1 = await db.query("SELECT tipo FROM equipos WHERE id='eq-1'")
    expect(eq1.rows[0].tipo).toBe('Analizador de SO2')
  })

  it('desactivar una marca no toca sus modelos ni sus equipos', async () => {
    const marca = await crearMarca(db, 'Horiba')
    await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null })
    await actualizarMarca(db, marca, { activo: false })
    const c = await leerCatalogo(db)
    expect(c.marcas).toEqual([])
    expect(c.modelos.length).toBe(1) // el modelo sigue vivo: desactivar la marca no es borrarla
  })

  // Borrar lo que alguien está usando dejaría equipos apuntando a la nada. Se niega con el conteo
  // delante, que es lo que permite decidir si desactivarlo en vez de borrarlo.
  it('no borra un modelo en uso, y sí uno libre', async () => {
    const marca = await crearMarca(db, 'Horiba')
    const usado = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: null })
    const libre = await crearModelo(db, { marcaId: marca, nombre: 'APOA-370', tipoId: null })
    await db.query("INSERT INTO equipos (id,serial,modelo_id) VALUES ('eq-1','A',$1)", [usado])

    await expect(borrarEntrada(db, 'modelos', usado)).rejects.toBeInstanceOf(EntradaEnUso)
    await expect(borrarEntrada(db, 'modelos', libre)).resolves.toBeUndefined()
    expect((await leerCatalogo(db)).modelos.map((m) => m.id)).toEqual([usado])
  })

  it('no borra una marca con modelos colgando ni un tipo asignado a un modelo', async () => {
    const tipo = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: tipo })
    await expect(borrarEntrada(db, 'marcas', marca)).rejects.toBeInstanceOf(EntradaEnUso)
    await expect(borrarEntrada(db, 'tipos', tipo)).rejects.toBeInstanceOf(EntradaEnUso)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts -t "cambios del catálogo"`
Expected: FAIL — `actualizarTipo is not a function`

- [ ] **Step 3: Implementar**

Añadir a `apps/desk/server/db/catalogo.ts`:

```ts
/** Entrada del catálogo que alguien está usando. Se traduce a 409 con el conteo delante. */
export class EntradaEnUso extends Error {
  constructor(public readonly usos: number) {
    super(`En uso por ${usos}`)
    this.name = 'EntradaEnUso'
  }
}

export async function actualizarTipo(db: Queryable, id: string, patch: { nombre?: string; activo?: boolean }): Promise<void> {
  if (patch.nombre !== undefined) await db.query('UPDATE catalogo_tipos SET nombre=$2 WHERE id=$1', [id, patch.nombre.trim()])
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_tipos SET activo=$2 WHERE id=$1', [id, patch.activo])
}

/**
 * La marca NO se renombra, solo se activa o desactiva. `perfilChecklist` decide el checklist
 * "Incluye" de una remisión leyendo el TEXTO de la marca (`marca === 'horiba'`), así que un
 * renombrado cambiaría en silencio qué accesorios pide la remisión de todos sus equipos. Renombrar
 * y fusionar necesitan su propio diseño, con ese aviso delante.
 */
export async function actualizarMarca(db: Queryable, id: string, patch: { activo?: boolean }): Promise<void> {
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_marcas SET activo=$2 WHERE id=$1', [id, patch.activo])
}

/**
 * Cambia el tipo de un modelo y/o lo activa. Tampoco renombra, por la misma razón que la marca:
 * `perfilChecklist` mira el modelo por subcadena (`modelo.includes('edm180')`).
 *
 * Fijar `tipoId` apaga `revisar`: un administrador que elige el tipo a conciencia es exactamente lo
 * que resuelve la duda que la siembra dejó abierta.
 *
 * Devuelve siempre cuántos equipos declaran otro tipo, se hayan corregido o no, para que el número
 * quede a la vista sin tener que ir a buscarlo.
 */
export async function actualizarModelo(
  db: Queryable,
  id: string,
  patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean },
): Promise<{ discrepan: number }> {
  if (patch.activo !== undefined) await db.query('UPDATE catalogo_modelos SET activo=$2 WHERE id=$1', [id, patch.activo])
  if (patch.tipoId === undefined) return { discrepan: 0 }

  await db.query('UPDATE catalogo_modelos SET tipo_id=$2, revisar=false WHERE id=$1', [id, patch.tipoId])
  const modelo = await getModelo(db, id)
  const tipo = modelo?.tipo ?? null
  if (!tipo) return { discrepan: 0 }

  const r = await db.query(
    "SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id = $1 AND COALESCE(tipo,'') <> $2",
    [id, tipo],
  )
  const discrepan = Number(r.rows[0].n)
  if (patch.corregirEquipos === true && discrepan > 0) {
    await db.query("UPDATE equipos SET tipo=$2, updated_at=now() WHERE modelo_id = $1 AND COALESCE(tipo,'') <> $2", [id, tipo])
  }
  return { discrepan }
}

/** Dónde se mira si una entrada está en uso antes de dejar borrarla. */
const USOS: Record<'tipos' | 'marcas' | 'modelos', { tabla: string; consulta: string }> = {
  tipos: { tabla: 'catalogo_tipos', consulta: 'SELECT COUNT(*)::int AS n FROM catalogo_modelos WHERE tipo_id = $1' },
  marcas: { tabla: 'catalogo_marcas', consulta: 'SELECT COUNT(*)::int AS n FROM catalogo_modelos WHERE marca_id = $1' },
  modelos: { tabla: 'catalogo_modelos', consulta: 'SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id = $1' },
}

/**
 * Borrado físico, y solo si nadie la usa: borrar una entrada usada dejaría equipos apuntando a la
 * nada. Cuando está en uso se niega con el conteo, que es el dato con el que se decide si lo que
 * tocaba era desactivarla.
 */
export async function borrarEntrada(db: Queryable, que: 'tipos' | 'marcas' | 'modelos', id: string): Promise<void> {
  const { tabla, consulta } = USOS[que]
  const r = await db.query(consulta, [id])
  const usos = Number(r.rows[0].n)
  if (usos > 0) throw new EntradaEnUso(usos)
  await db.query(`DELETE FROM ${tabla} WHERE id = $1`, [id])
}
```

`USOS` es una tabla de despacho y no un `switch` para que añadir una cuarta entidad no obligue a tocar la función. El nombre de tabla se interpola pero **nunca viene del usuario**: sale de esta constante, y la firma solo admite los tres literales.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: Comprobar que el test muerde**

En `actualizarModelo`, quitar `, revisar=false` del `UPDATE`. El test «fijar el tipo de un modelo apaga revisar» debe fallar.

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts -t "apaga revisar"`
Expected: FAIL — `revisar` sigue siendo `true`

**Deshacer la mutación** y volver a ejecutar.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/db/catalogo.ts apps/desk/server/db/catalogo.test.ts
git commit -m "feat(desk): cambios y borrado guardado del catálogo de equipos"
```

---

## Task 6: La siembra

**Files:**
- Create: `apps/desk/server/db/catalogoSeed.ts`
- Test: `apps/desk/server/db/catalogoSeed.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `apps/desk/server/db/catalogoSeed.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { sembrarCatalogo } from './catalogoSeed'
import { leerCatalogo } from './catalogo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

let n = 0
const eq = (marca: string | null, modelo: string | null, tipo: string | null) =>
  db.query('INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ($1,$2,$3,$4,$5)', [`eq-${++n}`, `SN-${n}`, marca, modelo, tipo])

describe('sembrarCatalogo', () => {
  it('siembra marcas, tipos y modelos, y enlaza los equipos', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APOA-370', 'Analizador de Ozono')
    await eq('Grimm', 'EDM180C', 'Monitor PM10')

    const r = await sembrarCatalogo(db)
    expect(r).toMatchObject({ marcas: 2, tipos: 3, modelos: 3, equiposEnlazados: 3, conflictos: 0 })

    const c = await leerCatalogo(db)
    expect(c.marcas.map((m) => m.nombre)).toEqual(['Grimm', 'Horiba'])
    const apsa = c.modelos.find((m) => m.nombre === 'APSA-370')!
    expect(apsa.tipoNombre).toBe('Analizador de SO2')
    expect(apsa.revisar).toBe(false)
  })

  // Un modelo con dos tipos es un dato ambiguo del inventario. Se queda con el MÁS FRECUENTE para no
  // perder la deducción, pero marcado, porque elegir por el usuario y callárselo sería esconderlo.
  it('un modelo con dos tipos se queda con el más frecuente y marcado para revisar', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Calibrador Multigas')

    const r = await sembrarCatalogo(db)
    expect(r.conflictos).toBe(1)
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Analizador de SO2', revisar: true })
  })

  // Sin desempate explícito, dos ejecuciones sobre los mismos datos podrían dar resultados distintos
  // según el orden en que la base devuelva las filas.
  it('el empate lo rompe el orden alfabético', async () => {
    await eq('Horiba', 'DUAL', 'Zeta')
    await eq('Horiba', 'DUAL', 'Alfa')

    await sembrarCatalogo(db)
    expect((await leerCatalogo(db)).modelos[0]).toMatchObject({ tipoNombre: 'Alfa', revisar: true })
  })

  it('un modelo cuyos equipos no declaran tipo entra sin tipo y marcado', async () => {
    await eq('Horiba', 'APSA-370', null)
    const r = await sembrarCatalogo(db)
    expect(r.conflictos).toBe(1)
    expect((await leerCatalogo(db)).modelos[0]).toMatchObject({ tipoId: null, tipoNombre: null, revisar: true })
  })

  it('un equipo sin marca o sin modelo no entra en el catálogo y se queda sin enlazar', async () => {
    await eq(null, 'HUERFANO', 'Monitor')
    await eq('Horiba', null, 'Monitor')
    await eq('Horiba', '  ', 'Monitor') // en blanco cuenta como ausente

    const r = await sembrarCatalogo(db)
    expect(r.modelos).toBe(0)
    expect(r.equiposEnlazados).toBe(0)
    const sinEnlazar = await db.query('SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NULL')
    expect(sinEnlazar.rows[0].n).toBe(3)
  })

  // La siembra se dispara a mano y puede repetirse. Si pisara, revertiría las correcciones que un
  // administrador hizo entre una ejecución y la siguiente — que es justo lo que pasaba con la vieja
  // semilla CSV de equipos.
  it('reejecutarla no duplica ni pisa las correcciones hechas a mano', async () => {
    await eq('Horiba', 'APSA-370', 'Analizador de SO2')
    await eq('Horiba', 'APSA-370', 'Calibrador Multigas')
    await sembrarCatalogo(db)

    // Un administrador resuelve el conflicto a mano eligiendo el otro tipo.
    const cal = (await leerCatalogo(db)).tipos.find((t) => t.nombre === 'Calibrador Multigas')!
    await db.query('UPDATE catalogo_modelos SET tipo_id=$1, revisar=false', [cal.id])

    const r2 = await sembrarCatalogo(db)
    expect(r2).toMatchObject({ marcas: 0, tipos: 0, modelos: 0 })
    const m = (await leerCatalogo(db)).modelos[0]
    expect(m).toMatchObject({ tipoNombre: 'Calibrador Multigas', revisar: false })
    expect((await leerCatalogo(db)).modelos.length).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/catalogoSeed.test.ts`
Expected: FAIL — no encuentra `./catalogoSeed`

- [ ] **Step 3: Implementar**

Crear `apps/desk/server/db/catalogoSeed.ts`:

```ts
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearMarca, crearModelo, crearTipo } from './catalogo'

export interface ResumenSiembra {
  tipos: number
  marcas: number
  modelos: number
  equiposEnlazados: number
  conflictos: number
}

const limpio = (v: unknown): string => String(v ?? '').trim()

/**
 * Puebla el catálogo desde el inventario que ya existe. **Idempotente y no destructiva**: lo que ya
 * está se deja como está, incluidas las correcciones que un administrador haya hecho a mano entre
 * una ejecución y la siguiente. Es la lección de la vieja semilla CSV de equipos, que revertía las
 * ediciones en cada arranque.
 *
 * No reescribe ningún equipo salvo para rellenarle `modelo_id`. Gracias a eso la evidencia del
 * reparto de tipos sigue en los datos y la bandeja de conflictos puede recalcularla sin tabla propia.
 *
 * Vive en un endpoint admin y no en `schema.sql` porque `migrate()` es tolerante por sentencia: una
 * sentencia que fallara se saltaría con un `console.error` y el backfill no correría nunca sin que
 * nadie se enterara.
 *
 * La agregación se hace en JavaScript y no en SQL a propósito: es el mismo patrón que ya usaba
 * `equipoFacets`, y esquiva las lagunas de pg-mem con las agrupaciones y las subconsultas.
 */
export async function sembrarCatalogo(db: Queryable): Promise<ResumenSiembra> {
  const filas = await db.query('SELECT marca, modelo, tipo FROM equipos')
  const resumen: ResumenSiembra = { tipos: 0, marcas: 0, modelos: 0, equiposEnlazados: 0, conflictos: 0 }

  // Índices de lo que YA existe, para no volver a insertarlo. En minúsculas porque la unicidad del
  // catálogo no distingue mayúsculas.
  const tiposPrevios = await db.query('SELECT id, nombre FROM catalogo_tipos')
  const idTipo = new Map<string, string>(tiposPrevios.rows.map((r: any) => [String(r.nombre).toLowerCase(), r.id]))
  const marcasPrevias = await db.query('SELECT id, nombre FROM catalogo_marcas')
  const idMarca = new Map<string, string>(marcasPrevias.rows.map((r: any) => [String(r.nombre).toLowerCase(), r.id]))
  const modelosPrevios = await db.query('SELECT id, marca_id, nombre FROM catalogo_modelos')
  const idModelo = new Map<string, string>(modelosPrevios.rows.map((r: any) => [`${r.marca_id} ${String(r.nombre).toLowerCase()}`, r.id]))

  // Reparto real de tipos por cada par (marca, modelo), que es lo que decide el tipo y el conflicto.
  const conteo = new Map<string, Map<string, number>>()
  for (const f of filas.rows as any[]) {
    const marca = limpio(f.marca)
    const modelo = limpio(f.modelo)
    if (!marca || !modelo) continue // sin par no hay modelo que sembrar
    const clave = `${marca} ${modelo}`
    if (!conteo.has(clave)) conteo.set(clave, new Map())
    const tipo = limpio(f.tipo)
    if (tipo) conteo.get(clave)!.set(tipo, (conteo.get(clave)!.get(tipo) ?? 0) + 1)
  }

  for (const [clave, tipos] of conteo) {
    const [marca, modelo] = clave.split(' ')

    let marcaId = idMarca.get(marca.toLowerCase())
    if (!marcaId) { marcaId = await crearMarca(db, marca); idMarca.set(marca.toLowerCase(), marcaId); resumen.marcas++ }

    // El más frecuente; a igualdad de cuenta, el primero por orden alfabético, para que dos
    // ejecuciones sobre los mismos datos den siempre lo mismo.
    const candidatos = [...tipos.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const elegido = candidatos[0]?.[0] ?? null
    const ambiguo = candidatos.length !== 1 // 0 tipos o más de uno: en ambos casos hay que mirarlo

    let tipoId: string | null = null
    if (elegido) {
      tipoId = idTipo.get(elegido.toLowerCase()) ?? null
      if (!tipoId) { tipoId = await crearTipo(db, elegido); idTipo.set(elegido.toLowerCase(), tipoId); resumen.tipos++ }
    }

    const claveModelo = `${marcaId} ${modelo.toLowerCase()}`
    let modeloId = idModelo.get(claveModelo)
    if (!modeloId) {
      modeloId = await crearModelo(db, { marcaId, nombre: modelo, tipoId, revisar: ambiguo })
      idModelo.set(claveModelo, modeloId)
      resumen.modelos++
      if (ambiguo) resumen.conflictos++
    }

    // Enlace por coincidencia EXACTA del par. Lo que no case se queda en NULL: no se inventa nada.
    const upd = await db.query(
      'UPDATE equipos SET modelo_id=$1 WHERE modelo_id IS NULL AND marca=$2 AND modelo=$3',
      [modeloId, marca, modelo],
    )
    resumen.equiposEnlazados += upd.rowCount ?? 0
  }

  return resumen
}
```

Nota sobre ` ` como separador de claves: es el único carácter que no puede aparecer en un nombre de marca o modelo, así que `Horiba` + `APSA-370` nunca puede colisionar con otra pareja.

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/catalogoSeed.test.ts`
Expected: PASS (6 tests)

Si el test del empate falla porque `rowCount` viene `undefined` en pg-mem, comprueba el conteo con un `SELECT COUNT(*)` en su lugar; el resto de la lógica no cambia.

- [ ] **Step 5: Comprobar que los tests muerden**

Mutación A — quitar el desempate alfabético: cambiar el `sort` por `(a, b) => b[1] - a[1]`.
Run: `npx vitest run apps/desk/server/db/catalogoSeed.test.ts -t "empate"` → debe FALLAR.

Mutación B — hacerla destructiva: quitar el `if (!modeloId)` y crear siempre.
Run: `npx vitest run apps/desk/server/db/catalogoSeed.test.ts -t "Reejecutarla"` → debe FALLAR.

**Deshacer las dos mutaciones** y volver a ejecutar el fichero entero.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/db/catalogoSeed.ts apps/desk/server/db/catalogoSeed.test.ts
git commit -m "feat(desk): siembra idempotente del catálogo desde el inventario"
```

---

## Task 7: Bandeja de conflictos

**Files:**
- Modify: `apps/desk/server/db/catalogo.ts`
- Test: `apps/desk/server/db/catalogo.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Añadir a `apps/desk/server/db/catalogo.test.ts`:

```ts
// Al import de arriba: leerConflictos

describe('leerConflictos', () => {
  it('devuelve los modelos marcados con su reparto real y cuenta los equipos sin modelo', async () => {
    const so2 = await crearTipo(db, 'Analizador de SO2')
    const marca = await crearMarca(db, 'Horiba')
    const modelo = await crearModelo(db, { marcaId: marca, nombre: 'APSA-370', tipoId: so2, revisar: true })
    await crearModelo(db, { marcaId: marca, nombre: 'LIMPIO', tipoId: so2 })
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-1','A','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-2','B','Horiba','APSA-370','Analizador de SO2',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-3','C','Horiba','APSA-370','Calibrador Multigas',$1)", [modelo])
    await db.query("INSERT INTO equipos (id,serial) VALUES ('eq-4','D')") // sin modelo

    const c = await leerConflictos(db)
    expect(c.modelos.length).toBe(1) // el limpio no aparece
    expect(c.modelos[0]).toMatchObject({ modeloId: modelo, marca: 'Horiba', modelo: 'APSA-370', tipoActual: 'Analizador de SO2' })
    // Ordenado de más a menos, que es como se lee para decidir.
    expect(c.modelos[0].reparto).toEqual([
      { tipo: 'Analizador de SO2', equipos: 2 },
      { tipo: 'Calibrador Multigas', equipos: 1 },
    ])
    expect(c.equiposSinModelo).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts -t "leerConflictos"`
Expected: FAIL — `leerConflictos is not a function`

- [ ] **Step 3: Implementar**

Añadir a `apps/desk/server/db/catalogo.ts` (con `Conflictos` y `ConflictoModelo` añadidos al `import type` de `@ambientalia/shared`):

```ts
/**
 * Los modelos que la siembra dejó marcados, con el reparto de tipos que lo demuestra.
 *
 * No hay tabla de conflictos: como la siembra no reescribe `equipos`, la evidencia sigue en los
 * datos y el reparto se recalcula. Así la bandeja nunca miente — si alguien corrige equipos por otra
 * vía, la cuenta lo refleja sola.
 */
export async function leerConflictos(db: Queryable): Promise<Conflictos> {
  const marcados = await db.query(
    `SELECT mo.id, mo.nombre, ma.nombre AS marca, ti.nombre AS tipo_actual
       FROM catalogo_modelos mo
       JOIN catalogo_marcas ma ON ma.id = mo.marca_id
       LEFT JOIN catalogo_tipos ti ON ti.id = mo.tipo_id
      WHERE mo.revisar = true
      ORDER BY ma.nombre, mo.nombre`,
  )
  const repartos = await db.query(
    "SELECT modelo_id, COALESCE(tipo,'(sin tipo)') AS tipo, COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NOT NULL GROUP BY modelo_id, tipo",
  )
  const porModelo = new Map<string, Array<{ tipo: string; equipos: number }>>()
  for (const r of repartos.rows as any[]) {
    if (!porModelo.has(r.modelo_id)) porModelo.set(r.modelo_id, [])
    porModelo.get(r.modelo_id)!.push({ tipo: r.tipo, equipos: Number(r.n) })
  }

  const sin = await db.query('SELECT COUNT(*)::int AS n FROM equipos WHERE modelo_id IS NULL')
  const modelos: ConflictoModelo[] = (marcados.rows as any[]).map((r) => ({
    modeloId: r.id,
    marca: r.marca,
    modelo: r.nombre,
    tipoActual: r.tipo_actual ?? null,
    // De más a menos: es el orden en el que se lee para decidir cuál es el bueno.
    reparto: (porModelo.get(r.id) ?? []).sort((a, b) => b.equipos - a.equipos || a.tipo.localeCompare(b.tipo)),
  }))
  return { modelos, equiposSinModelo: Number(sin.rows[0].n) }
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/db/catalogo.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/desk/server/db/catalogo.ts apps/desk/server/db/catalogo.test.ts
git commit -m "feat(desk): bandeja de conflictos del catálogo, recalculada del inventario"
```

---

## Task 8: Rutas del catálogo

**Files:**
- Create: `apps/desk/server/routes/catalogo.ts`
- Modify: `apps/desk/server/app.ts:16-20` (imports) y `:48-54` (registro)
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al final de `apps/desk/server/app.test.ts`:

```ts
describe('Catálogo maestro de equipos', () => {
  /** Alta por la API, que es el camino que se quiere probar. Devuelve { tipoId, marcaId, modeloId }. */
  async function altaBasica(app: ReturnType<typeof appWith>['app'], cookie: string) {
    const tipoId = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })).body.id
    const marcaId = (await request(app).post('/api/catalogo/marcas').set('Cookie', cookie).send({ nombre: 'Horiba' })).body.id
    const modeloId = (await request(app).post('/api/catalogo/modelos').set('Cookie', cookie).send({ marcaId, nombre: 'APSA-370', tipoId })).body.id
    return { tipoId, marcaId, modeloId }
  }

  it('alta de tipo, marca y modelo; GET los devuelve con el tipo resuelto', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    expect(modeloId).toMatch(/^cmod-/)

    const c = await request(app).get('/api/catalogo').set('Cookie', cookie)
    expect(c.status).toBe(200)
    expect(c.body.modelos[0]).toMatchObject({ nombre: 'APSA-370', tipoNombre: 'Analizador de SO2' })
  })

  it('409 al repetir el nombre de un tipo', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    const dup = await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Analizador de SO2' })
    expect(dup.status).toBe(409)
  })

  it('409 al borrar un modelo en uso, con el conteo en el mensaje', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { modeloId } = await altaBasica(app, cookie)
    await db.query("INSERT INTO equipos (id,serial,modelo_id) VALUES ('eq-u','A',$1)", [modeloId])
    const res = await request(app).delete(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie)
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('1')
  })

  it('PATCH del modelo fija el tipo y devuelve cuántos equipos discrepan', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const { marcaId, modeloId } = await altaBasica(app, cookie)
    const otro = (await request(app).post('/api/catalogo/tipos').set('Cookie', cookie).send({ nombre: 'Calibrador Multigas' })).body.id
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo,modelo_id) VALUES ('eq-d','A','Horiba','APSA-370','Analizador de SO2',$1)", [modeloId])
    expect(marcaId).toMatch(/^cmar-/)

    const res = await request(app).patch(`/api/catalogo/modelos/${modeloId}`).set('Cookie', cookie).send({ tipoId: otro, corregirEquipos: true })
    expect(res.status).toBe(200)
    expect(res.body.discrepan).toBe(1)
    const eq = await db.query("SELECT tipo FROM equipos WHERE id='eq-d'")
    expect(eq.rows[0].tipo).toBe('Calibrador Multigas')
  })

  it('la bandeja de conflictos es de administrador', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/catalogo/conflictos').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ modelos: [], equiposSinModelo: 0 })
  })

  // Esconder el botón no protege el dato: la frontera es el endpoint. Se comprueba en TODAS las
  // rutas de escritura, no en una de muestra.
  it('escribir exige super administrador; leer solo exige sesión', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const { marcaId, modeloId, tipoId } = await altaBasica(app, admin)
    const op = await userCookie(['Servicio Técnico'])

    const escrituras: Array<[string, string, object]> = [
      ['post', '/api/catalogo/tipos', { nombre: 'X' }],
      ['post', '/api/catalogo/marcas', { nombre: 'Y' }],
      ['post', '/api/catalogo/modelos', { marcaId, nombre: 'Z', tipoId }],
      ['patch', `/api/catalogo/tipos/${tipoId}`, { nombre: 'W' }],
      ['patch', `/api/catalogo/marcas/${marcaId}`, { activo: false }],
      ['patch', `/api/catalogo/modelos/${modeloId}`, { activo: false }],
      ['delete', `/api/catalogo/modelos/${modeloId}`, {}],
    ]
    for (const [metodo, ruta, cuerpo] of escrituras) {
      const sinRol = await (request(app) as any)[metodo](ruta).set('Cookie', op).send(cuerpo)
      expect([metodo, ruta, sinRol.status]).toEqual([metodo, ruta, 403])
      const sinSesion = await (request(app) as any)[metodo](ruta).send(cuerpo)
      expect([metodo, ruta, sinSesion.status]).toEqual([metodo, ruta, 401])
    }
    expect((await request(app).get('/api/catalogo').set('Cookie', op)).status).toBe(200)
    expect((await request(app).get('/api/catalogo')).status).toBe(401)
    expect((await request(app).get('/api/catalogo/conflictos').set('Cookie', op)).status).toBe(403)
  })
})
```

Las aserciones de autorización comparan la tripleta `[metodo, ruta, status]` en vez del status a secas: si una ruta falla, el mensaje dice cuál, en vez de un `expected 200 to be 403` que no señala a nadie.

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/app.test.ts -t "Catálogo maestro"`
Expected: FAIL — 404 en todas las rutas

- [ ] **Step 3: Implementar**

Crear `apps/desk/server/routes/catalogo.ts`:

```ts
import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  leerCatalogo, leerConflictos, crearTipo, crearMarca, crearModelo,
  actualizarTipo, actualizarMarca, actualizarModelo, borrarEntrada,
  NombreRepetido, EntradaEnUso,
} from '../db/catalogo'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/** Las tres entidades que admite el borrado, como lista blanca. Nada de la URL llega a una tabla. */
const ENTIDADES = ['tipos', 'marcas', 'modelos'] as const
type Entidad = (typeof ENTIDADES)[number]

export function registerCatalogoRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // Lectura: cualquiera con sesión, porque la consume el formulario de equipos, que no es de admin.
  // `incluir` trae además ese modelo aunque esté desactivado (ver leerCatalogo).
  app.get('/api/catalogo', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await leerCatalogo(db, req.query.incluir ? String(req.query.incluir) : null))
  }))

  app.get('/api/catalogo/conflictos', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    res.json(await leerConflictos(db))
  }))

  // A partir de aquí, todo exige super administrador. Definir qué existe es administrar; registrar
  // un equipo con lo que existe es el trabajo diario y sigue abierto.
  app.post('/api/catalogo/tipos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const nombre = String((req.body ?? {}).nombre ?? '').trim()
    if (!nombre) { res.status(422).json({ error: 'El nombre es obligatorio' }); return }
    try { res.status(201).json({ id: await crearTipo(db, nombre) }) }
    catch (e) { if (e instanceof NombreRepetido) res.status(409).json({ error: `Ya existe el tipo «${nombre}»` }); else throw e }
  }))

  app.post('/api/catalogo/marcas', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const nombre = String((req.body ?? {}).nombre ?? '').trim()
    if (!nombre) { res.status(422).json({ error: 'El nombre es obligatorio' }); return }
    try { res.status(201).json({ id: await crearMarca(db, nombre) }) }
    catch (e) { if (e instanceof NombreRepetido) res.status(409).json({ error: `Ya existe la marca «${nombre}»` }); else throw e }
  }))

  app.post('/api/catalogo/modelos', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const nombre = String(b.nombre ?? '').trim()
    const marcaId = b.marcaId ? String(b.marcaId) : ''
    if (!nombre || !marcaId) { res.status(422).json({ error: 'La marca y el nombre son obligatorios' }); return }
    try { res.status(201).json({ id: await crearModelo(db, { marcaId, nombre, tipoId: b.tipoId ? String(b.tipoId) : null }) }) }
    catch (e) { if (e instanceof NombreRepetido) res.status(409).json({ error: `Esa marca ya tiene un modelo «${nombre}»` }); else throw e }
  }))

  app.patch('/api/catalogo/tipos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    await actualizarTipo(db, String(req.params.id), {
      nombre: b.nombre !== undefined ? String(b.nombre) : undefined,
      activo: b.activo !== undefined ? Boolean(b.activo) : undefined,
    })
    res.json({ ok: true })
  }))

  // Sin `nombre`: renombrar una marca cambiaría en silencio el perfil de checklist de sus remisiones
  // (perfilChecklist lee el TEXTO). Renombrar y fusionar necesitan su propio diseño.
  app.patch('/api/catalogo/marcas/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    await actualizarMarca(db, String(req.params.id), { activo: b.activo !== undefined ? Boolean(b.activo) : undefined })
    res.json({ ok: true })
  }))

  app.patch('/api/catalogo/modelos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const r = await actualizarModelo(db, String(req.params.id), {
      tipoId: b.tipoId !== undefined ? (b.tipoId ? String(b.tipoId) : null) : undefined,
      activo: b.activo !== undefined ? Boolean(b.activo) : undefined,
      corregirEquipos: b.corregirEquipos === true,
    })
    res.json(r)
  }))

  app.delete('/api/catalogo/:entidad/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
    const entidad = String(req.params.entidad) as Entidad
    if (!ENTIDADES.includes(entidad)) { res.status(404).json({ error: 'Entidad desconocida' }); return }
    try { await borrarEntrada(db, entidad, String(req.params.id)); res.json({ ok: true }) }
    catch (e) {
      if (e instanceof EntradaEnUso) res.status(409).json({ error: `No se puede eliminar: lo usan ${e.usos} registros. Desactívalo en su lugar.` })
      else throw e
    }
  }))
}
```

En `apps/desk/server/app.ts`, junto a los demás imports de rutas:

```ts
import { registerCatalogoRoutes } from './routes/catalogo'
```

y junto a los demás registros, **antes** de `registerEquipoRoutes`:

```ts
  registerCatalogoRoutes(app, { db })
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/app.test.ts -t "Catálogo maestro"`
Expected: PASS (6 tests)

- [ ] **Step 5: Comprobar que el test de autorización muerde**

Quitar `requireSuperAdmin` de la ruta `delete`. El test «escribir exige super administrador» debe fallar señalando esa ruta.

Run: `npx vitest run apps/desk/server/app.test.ts -t "exige super administrador"`
Expected: FAIL con `['delete', '/api/catalogo/modelos/cmod-…', 200]`

**Deshacer la mutación** y volver a ejecutar.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/routes/catalogo.ts apps/desk/server/app.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): endpoints del catálogo de equipos"
```

---

## Task 9: Endpoint de siembra

**Files:**
- Modify: `apps/desk/server/routes/admin.ts` (junto a `seed-remision-checklist`, ~línea 63)
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Añadir dentro del `describe('Catálogo maestro de equipos')` de `apps/desk/server/app.test.ts`:

```ts
  it('la siembra puebla el catálogo desde los equipos; 403 no-admin; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO equipos (id,serial,marca,modelo,tipo) VALUES ('eq-s1','A','Horiba','APSA-370','Analizador de SO2')")
    const { app } = appWith()

    const res = await request(app).post('/api/admin/seed-catalogo').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marcas: 1, tipos: 1, modelos: 1, equiposEnlazados: 1 })
    expect((await request(app).get('/api/catalogo').set('Cookie', cookie)).body.modelos[0].nombre).toBe('APSA-370')

    const op = await userCookie([])
    expect((await request(app).post('/api/admin/seed-catalogo').set('Cookie', op)).status).toBe(403)
    expect((await request(app).post('/api/admin/seed-catalogo')).status).toBe(401)
  })
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/app.test.ts -t "la siembra puebla"`
Expected: FAIL — 404

- [ ] **Step 3: Implementar**

En `apps/desk/server/routes/admin.ts`, añadir el import:

```ts
import { sembrarCatalogo } from '../db/catalogoSeed'
```

y la ruta, justo debajo de `seed-remision-checklist`:

```ts
  // Puebla el catálogo maestro desde el inventario que ya existe. SOLO super administrador.
  // Se dispara a mano UNA vez tras el despliegue; es idempotente y no destructiva, así que
  // repetirla solo añade lo que falte y respeta las correcciones hechas a mano.
  app.post('/api/admin/seed-catalogo', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    const r = await sembrarCatalogo(db)
    logger.info(`Catálogo sembrado: ${r.marcas} marcas, ${r.tipos} tipos, ${r.modelos} modelos, ${r.equiposEnlazados} equipos enlazados, ${r.conflictos} por revisar`)
    res.json(r)
  }))
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npx vitest run apps/desk/server/app.test.ts -t "la siembra puebla"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desk/server/routes/admin.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): endpoint de siembra del catálogo"
```

---

## Task 10: El equipo se ata al catálogo

**Files:**
- Modify: `apps/desk/server/db/equipos.ts:94-146` (`EquipoInput`, `toLite`, `toFull`, `createEquipo`, `updateEquipo`, lecturas)
- Modify: `apps/desk/server/routes/equipos.ts:36-68` en `0bea513`
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir dentro del `describe('Gestión de equipos (Subsistema F)')` de `apps/desk/server/app.test.ts`:

```ts
  // El catálogo es la fuente: los textos marca/modelo/tipo del equipo se rellenan DESDE él y no se
  // aceptan del navegador. Así no pueden divergir, que es lo que esta fase viene a cerrar.
  it('crear un equipo toma marca, modelo y tipo del modelo del catálogo, ignorando lo que mande el cliente', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliC','Cliente C')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-1','Analizador de SO2')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-1','m-1','APSA-370','t-1')")
    const { app } = appWith()

    const res = await request(app).post('/api/equipos').set('Cookie', cookie)
      .send({ serial: 'SN-CAT', clientId: 'cliC', modeloId: 'mo-1', marca: 'INVENTADA', modelo: 'FALSA', tipo: 'MENTIRA' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ marca: 'Horiba', modelo: 'APSA-370', tipo: 'Analizador de SO2', modeloId: 'mo-1' })
  })

  it('422 sin modeloId, y 422 si el modelo no existe', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliD2','D')")
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S1', clientId: 'cliD2' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S2', clientId: 'cliD2', modeloId: 'no-existe' })).status).toBe(422)
  })

  it('editar el modelo reescribe los tres textos del equipo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliE2','E')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-a','Analizador de SO2'),('t-b','Monitor PM10')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-a','Horiba'),('m-b','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-a','m-a','APSA-370','t-a'),('mo-b','m-b','EDM180C','t-b')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-ED', clientId: 'cliE2', modeloId: 'mo-a' })).body.id

    const res = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ modeloId: 'mo-b' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10', modeloId: 'mo-b' })
  })
```

Además, **los tests existentes de este describe y de `POST /api/tickets (crear)` que dan de alta equipos por la API tendrán que pasar `modeloId`**. Localízalos con:

```bash
npx vitest run apps/desk/server/app.test.ts 2>&1 | grep -c "422"
```

y arregla los que rompan sembrando antes un modelo del catálogo, como en el test de arriba. Los que usan `upsertEquipo(db, equipoRow(...))` **no** se ven afectados: esa vía es la de la reconciliación y no pasa por la ruta.

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run apps/desk/server/app.test.ts -t "toma marca, modelo y tipo del modelo del catálogo"`
Expected: FAIL — devuelve `marca: 'INVENTADA'`

- [ ] **Step 3: Implementar**

En `apps/desk/server/db/equipos.ts`:

1. Añadir `modeloId: string | null` a `EquipoInput`.
2. En `toLite`, añadir `modeloId: r.modelo_id ?? undefined`.
3. **En `toFull` también**, que construye su propio objeto y no pasa por `toLite`. Sin esto, `getEquipoFull` devuelve el equipo sin `modeloId` y los tests del paso 1 fallan aunque la columna esté bien escrita:

```ts
function toFull(r: any): EquipoFull {
  return {
    id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined,
    tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined,
    modeloId: r.modelo_id ?? undefined,
    active: r.active === true, clientId: r.client_id ?? undefined,
  }
}
```

4. En `createEquipo`, incluir la columna:

```ts
export async function createEquipo(db: Queryable, input: EquipoInput): Promise<string> {
  const id = 'eq-' + randomUUID()
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,client_id,modelo_id,source,active,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'app',true,now())`,
    [id, input.serial, input.marca, input.modelo, input.tipo, input.clienteNombre, input.clientId, input.modeloId],
  )
  return id
}
```

5. En `updateEquipo`, añadir tras la línea de `clientId`:

```ts
  if (patch.modeloId !== undefined) add('modelo_id', patch.modeloId)
```

6. Añadir `modelo_id` a las listas de columnas de `getEquipo`, `getEquipoFull` y `listEquiposManage` (las tres consultas que empiezan por `SELECT id,serial,marca,modelo,tipo,…`).

En `apps/desk/server/routes/equipos.ts`, importar `getModelo`:

```ts
import { getModelo } from '../db/catalogo'
```

y sustituir el cuerpo de `POST /api/equipos` y el bloque de textos de `PATCH /api/equipos/:id`:

```ts
  app.post('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      const modeloId = b.modeloId ? String(b.modeloId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      if (!modeloId) { res.status(422).json({ error: 'El modelo del catálogo es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      // Marca, modelo y tipo se toman del catálogo y NO del navegador: son la misma clase de dato
      // que el equipo de una remisión, que también se recalcula en el servidor.
      const modelo = await getModelo(db, modeloId)
      if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado en el catálogo' }); return }
      const id = await createEquipo(db, {
        serial, marca: modelo.marca, modelo: modelo.nombre, tipo: modelo.tipo,
        clienteNombre: cliente.name, clientId, modeloId,
      })
      res.status(201).json(await getEquipoFull(db, id))
  }))

  app.patch('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.modeloId !== undefined) {
        const modelo = await getModelo(db, String(b.modeloId))
        if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado en el catálogo' }); return }
        patch.modeloId = modelo.id
        patch.marca = modelo.marca
        patch.modelo = modelo.nombre
        patch.tipo = modelo.tipo
      }
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
      }
      if (Object.keys(patch).length) await updateEquipo(db, id, patch)
      if (b.active !== undefined) await setEquipoActive(db, id, Boolean(b.active))
      res.json(await getEquipoFull(db, id))
  }))
```

`marca`, `modelo` y `tipo` dejan de leerse del cuerpo: el catálogo es quien los escribe.

**El `PATCH` NO exige `modeloId`, y es deliberado.** El botón «Desactivar» del listado manda un `PATCH` con solo `{ active }`, así que exigirlo en cada `PATCH` rompería la desactivación desde la lista. Quien fuerza el modelo al editar es el formulario (Task 14): el `<select>` va con `required` y el botón de guardar deshabilitado sin él. La regla real es «no se puede *guardar el formulario* sin modelo», no «no se puede tocar la fila sin mandar el modelo».

- [ ] **Step 4: Ejecutar el fichero entero y arreglar los tests que arrastra**

Run: `npx vitest run apps/desk/server/app.test.ts`
Expected: PASS. Los que fallen con 422 son altas de equipo que aún no mandan `modeloId`; siembra el modelo y pásalo.

- [ ] **Step 5: Comprobar que el test muerde**

En `POST /api/equipos`, volver a leer `marca: b.marca ? String(b.marca) : null`. El primer test debe fallar con `marca: 'INVENTADA'`.

**Deshacer** y volver a ejecutar.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/db/equipos.ts apps/desk/server/routes/equipos.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): el equipo toma marca, modelo y tipo de su modelo del catálogo"
```

---

## Task 11: Retirar las facetas

**Files:**
- Modify: `apps/desk/server/db/equipos.ts:160-195` (borrar `FacetasMarca` y `equipoFacets`)
- Modify: `apps/desk/server/routes/equipos.ts:4,26-28`
- Modify: `apps/desk/server/db/equipos.test.ts` (borrar los dos tests de facetas)
- Modify: `apps/desk/server/app.test.ts:1371` en `0bea513` (el test `facets devuelve marcas/tipos; manage lista; 401 sin sesión`)

- [ ] **Step 1: Borrar el código y sus tests**

`equipoFacets` derivaba las listas de la propia tabla `equipos`; ahora las da el catálogo, y dejarla viva sería mantener dos fuentes que pueden discrepar.

1. En `apps/desk/server/db/equipos.ts`, borrar la interfaz `FacetasMarca` y la función `equipoFacets` entera (todo el bloque final del fichero, con su comentario de cabecera).
2. En `apps/desk/server/routes/equipos.ts`, quitar `equipoFacets` del `import` de la línea 4 y borrar la ruta `app.get('/api/equipos/facets', …)`.
3. En `apps/desk/server/db/equipos.test.ts`, borrar los tests `facets devuelve marcas y tipos distintos` y `facets empareja cada modelo con sus tipos, y conserva todos los de un modelo ambiguo`, y quitar `equipoFacets` de sus imports.
4. En `apps/desk/server/app.test.ts`, en el test `facets devuelve marcas/tipos; manage lista; 401 sin sesión`: quitar las tres líneas de `/api/equipos/facets`, renombrarlo a `manage lista; 401 sin sesión`, y ajustar el alta de `SN-G` para que pase un `modeloId` del catálogo (o sustituirla por un `INSERT` directo, que es lo que ese test necesita de verdad).

- [ ] **Step 2: Ejecutar y comprobar**

Run: `npm test`
Expected: PASS. El total baja respecto a Task 10 en los tests borrados; anota la cifra.

Run: `npm run typecheck`
Expected: exit 0 — si queda algún consumidor de `equipoFacets`, sale aquí.

- [ ] **Step 3: Commit**

```bash
git add apps/desk/server/db/equipos.ts apps/desk/server/routes/equipos.ts apps/desk/server/db/equipos.test.ts apps/desk/server/app.test.ts
git commit -m "refactor(desk): retirar las facetas derivadas, que el catálogo sustituye"
```

---

## Task 12: Cliente HTTP del navegador

**Files:**
- Modify: `apps/desk/src/api/client.ts:188-204` en `0bea513`

- [ ] **Step 1: Sustituir `equipoFacets` por el catálogo**

Borrar `EquipoFacets` y `equipoFacets`, y añadir:

```ts
import type { Catalogo, Conflictos } from '@ambientalia/shared'

/** `incluir` trae además ese modelo aunque esté desactivado: sin él, editar un equipo cuyo modelo
 *  se retiró dejaría el campo en blanco. */
export function getCatalogo(incluir?: string | null): Promise<Catalogo> {
  const p = new URLSearchParams()
  if (incluir) p.set('incluir', incluir)
  const qs = p.toString()
  return fetch(`/api/catalogo${qs ? `?${qs}` : ''}`, { credentials: 'include' }).then((r) => json<Catalogo>(r))
}

export function getConflictosCatalogo(): Promise<Conflictos> {
  return fetch('/api/catalogo/conflictos', { credentials: 'include' }).then((r) => json<Conflictos>(r))
}

/** Lanza `Error` con el mensaje del servidor: es como el 409 de nombre repetido llega a la pantalla. */
async function catalogoWrite<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(b.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const crearTipoCatalogo = (nombre: string) => catalogoWrite<{ id: string }>('/api/catalogo/tipos', 'POST', { nombre })
export const crearMarcaCatalogo = (nombre: string) => catalogoWrite<{ id: string }>('/api/catalogo/marcas', 'POST', { nombre })
export const crearModeloCatalogo = (input: { marcaId: string; nombre: string; tipoId: string | null }) =>
  catalogoWrite<{ id: string }>('/api/catalogo/modelos', 'POST', input)
export const actualizarTipoCatalogo = (id: string, patch: { nombre?: string; activo?: boolean }) =>
  catalogoWrite<{ ok: true }>(`/api/catalogo/tipos/${id}`, 'PATCH', patch)
export const actualizarMarcaCatalogo = (id: string, patch: { activo: boolean }) =>
  catalogoWrite<{ ok: true }>(`/api/catalogo/marcas/${id}`, 'PATCH', patch)
export const actualizarModeloCatalogo = (id: string, patch: { tipoId?: string | null; activo?: boolean; corregirEquipos?: boolean }) =>
  catalogoWrite<{ discrepan: number }>(`/api/catalogo/modelos/${id}`, 'PATCH', patch)
export const borrarEntradaCatalogo = (entidad: 'tipos' | 'marcas' | 'modelos', id: string) =>
  catalogoWrite<{ ok: true }>(`/api/catalogo/${entidad}/${id}`, 'DELETE')
export const sembrarCatalogoRemoto = () => catalogoWrite<Record<string, number>>('/api/admin/seed-catalogo', 'POST')
```

En `EquipoInput` (mismo fichero), sustituir `marca`/`modelo`/`tipo` por `modeloId: string`, dejando `serial` y `clientId` como están.

- [ ] **Step 2: Comprobar que compila**

Run: `npm run typecheck`
Expected: FAIL en `EquiposAdmin.tsx`, que aún usa `equipoFacets`. Es lo esperado: lo arregla la Task 14.

- [ ] **Step 3: Commit**

```bash
git add apps/desk/src/api/client.ts
git commit -m "feat(desk): cliente HTTP del catálogo de equipos"
```

---

## Task 13: Pantalla del catálogo

**Files:**
- Create: `apps/desk/src/components/CatalogoEquipos.tsx`

- [ ] **Step 1: Escribir el componente**

Sigue el patrón de `EquiposAdmin`: capa a pantalla completa `fixed inset-0 z-[70]`, barra `#2C2E3E` de 48px con flecha de volver, y `field` para los inputs.

```tsx
import { useEffect, useState } from 'react'
import type { Catalogo, Conflictos } from '@ambientalia/shared'
import {
  getCatalogo, getConflictosCatalogo, crearTipoCatalogo, crearMarcaCatalogo, crearModeloCatalogo,
  actualizarTipoCatalogo, actualizarMarcaCatalogo, actualizarModeloCatalogo, borrarEntradaCatalogo,
} from '../api/client'

const VACIO: Catalogo = { tipos: [], marcas: [], modelos: [] }
const field = 'border border-slate-200 rounded p-2 text-[13px]'

export function CatalogoEquipos({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState<Catalogo>(VACIO)
  const [conf, setConf] = useState<Conflictos>({ modelos: [], equiposSinModelo: 0 })
  const [pestana, setPestana] = useState<'modelos' | 'marcas' | 'tipos'>('modelos')
  const [error, setError] = useState<string | null>(null)

  async function recargar() {
    try {
      setCat(await getCatalogo())
      setConf(await getConflictosCatalogo())
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  useEffect(() => { recargar() }, [])

  /** Envuelve toda escritura: recarga al terminar y enseña el mensaje del servidor si falla. */
  async function accion(fn: () => Promise<unknown>) {
    try { await fn(); await recargar() }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  const nombreMarca = (id: string) => cat.marcas.find((m) => m.id === id)?.nombre ?? '—'

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Catálogo de equipos</h1>
        <div className="ml-6 flex gap-1">
          {(['modelos', 'marcas', 'tipos'] as const).map((p) => (
            <button key={p} onClick={() => setPestana(p)}
              className={`px-3 py-1 rounded text-[13px] capitalize ${pestana === p ? 'bg-white/20 font-bold' : 'text-white/70 hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {/* La bandeja va arriba del todo mientras quede algo que decidir: es trabajo pendiente, no
            una sección más. Desaparece sola cuando se vacía. */}
        {(conf.modelos.length > 0 || conf.equiposSinModelo > 0) && (
          <section className="border border-amber-200 bg-amber-50 rounded p-3">
            <h2 className="text-[13px] font-bold text-amber-900 mb-2">Por revisar</h2>
            {conf.modelos.map((c) => (
              <div key={c.modeloId} className="mb-2 text-[12px] text-amber-900">
                <b>{c.marca} {c.modelo}</b> figura con {c.reparto.length} tipos:{' '}
                {c.reparto.map((r) => `${r.tipo} (${r.equipos})`).join(' · ')}
                <div className="mt-1 flex items-center gap-2">
                  <select className={field} defaultValue={c.tipoActual ? (cat.tipos.find((t) => t.nombre === c.tipoActual)?.id ?? '') : ''}
                    onChange={(e) => {
                      const tipoId = e.target.value
                      if (!tipoId) return
                      const corregir = confirm(`¿Corregir también los equipos que declaran otro tipo?\n\nAceptar los reescribe. Cancelar deja los ya registrados como están y solo rige para los nuevos.`)
                      accion(() => actualizarModeloCatalogo(c.modeloId, { tipoId, corregirEquipos: corregir }))
                    }}>
                    <option value="">Elige el tipo correcto…</option>
                    {cat.tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {conf.equiposSinModelo > 0 && (
              <p className="text-[12px] text-amber-900">
                <b>{conf.equiposSinModelo}</b> equipos no están enlazados a ningún modelo del catálogo
                (no tenían marca o modelo). Se arreglan editándolos en <b>Registro de equipos</b>.
              </p>
            )}
          </section>
        )}

        {pestana === 'modelos' && <Modelos cat={cat} accion={accion} nombreMarca={nombreMarca} />}
        {pestana === 'marcas' && <Simple titulo="Marcas" filas={cat.marcas} onCrear={(n) => accion(() => crearMarcaCatalogo(n))}
          onActivo={(id, activo) => accion(() => actualizarMarcaCatalogo(id, { activo }))}
          onBorrar={(id) => accion(() => borrarEntradaCatalogo('marcas', id))} />}
        {pestana === 'tipos' && <Simple titulo="Tipos" filas={cat.tipos} onCrear={(n) => accion(() => crearTipoCatalogo(n))}
          onActivo={(id, activo) => accion(() => actualizarTipoCatalogo(id, { activo }))}
          onBorrar={(id) => accion(() => borrarEntradaCatalogo('tipos', id))}
          onRenombrar={(id, nombre) => accion(() => actualizarTipoCatalogo(id, { nombre }))} />}
      </div>
    </div>
  )
}

/** Marcas y tipos comparten forma: nombre y poco más. Los modelos no, por eso van aparte. */
function Simple({ titulo, filas, onCrear, onActivo, onBorrar, onRenombrar }: {
  titulo: string
  filas: Array<{ id: string; nombre: string; activo: boolean }>
  onCrear: (nombre: string) => void
  onActivo: (id: string, activo: boolean) => void
  onBorrar: (id: string) => void
  onRenombrar?: (id: string, nombre: string) => void
}) {
  const [nuevo, setNuevo] = useState('')
  return (
    <section>
      <h2 className="text-[13px] font-bold text-slate-700 mb-2">{titulo}</h2>
      <div className="flex gap-2 mb-3">
        <input className={`${field} w-[280px]`} placeholder={`Nuevo… `} value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <button disabled={!nuevo.trim()} onClick={() => { onCrear(nuevo.trim()); setNuevo('') }}
          className="px-3 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">Añadir</button>
      </div>
      <table className="w-full text-[13px]">
        <thead><tr className="text-left text-slate-500 border-b"><th className="py-2">Nombre</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-b">
              <td className="py-2">{f.nombre}</td>
              <td>{f.activo ? 'Activo' : 'Inactivo'}</td>
              <td className="text-right whitespace-nowrap">
                {onRenombrar && (
                  <button onClick={() => { const n = prompt('Nuevo nombre', f.nombre); if (n && n.trim()) onRenombrar(f.id, n.trim()) }}
                    className="text-[12px] text-blue-600 mr-3">Renombrar</button>
                )}
                <button onClick={() => onActivo(f.id, !f.activo)} className="text-[12px] text-blue-600 mr-3">{f.activo ? 'Desactivar' : 'Activar'}</button>
                <button onClick={() => onBorrar(f.id)} className="text-[12px] text-red-600">Eliminar</button>
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-400">Vacío.</td></tr>}
        </tbody>
      </table>
    </section>
  )
}

function Modelos({ cat, accion, nombreMarca }: {
  cat: Catalogo
  accion: (fn: () => Promise<unknown>) => void
  nombreMarca: (id: string) => string
}) {
  const [marcaId, setMarcaId] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipoId, setTipoId] = useState('')

  return (
    <section>
      <h2 className="text-[13px] font-bold text-slate-700 mb-2">Modelos</h2>
      <div className="flex gap-2 mb-3">
        <select className={field} value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
          <option value="">Marca…</option>
          {cat.marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input className={`${field} w-[200px]`} placeholder="Modelo…" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <select className={field} value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
          <option value="">Tipo de equipo…</option>
          {cat.tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        <button disabled={!marcaId || !nombre.trim() || !tipoId}
          onClick={() => { accion(() => crearModeloCatalogo({ marcaId, nombre: nombre.trim(), tipoId })); setNombre('') }}
          className="px-3 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">Añadir</button>
      </div>
      <table className="w-full text-[13px]">
        <thead><tr className="text-left text-slate-500 border-b">
          <th className="py-2">Marca</th><th>Modelo</th><th>Tipo</th><th>Estado</th><th></th>
        </tr></thead>
        <tbody>
          {cat.modelos.map((m) => (
            <tr key={m.id} className={`border-b ${m.revisar ? 'bg-amber-50' : ''}`}>
              <td className="py-2">{nombreMarca(m.marcaId)}</td>
              <td className="font-bold">{m.nombre}</td>
              <td>
                <select className="text-[12px] border border-slate-200 rounded p-1" value={m.tipoId ?? ''}
                  onChange={(e) => accion(() => actualizarModeloCatalogo(m.id, { tipoId: e.target.value || null }))}>
                  <option value="">— sin tipo —</option>
                  {cat.tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </td>
              <td>{m.activo ? 'Activo' : 'Inactivo'}</td>
              <td className="text-right whitespace-nowrap">
                <button onClick={() => accion(() => actualizarModeloCatalogo(m.id, { activo: !m.activo }))} className="text-[12px] text-blue-600 mr-3">
                  {m.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => accion(() => borrarEntradaCatalogo('modelos', m.id))} className="text-[12px] text-red-600">Eliminar</button>
              </td>
            </tr>
          ))}
          {cat.modelos.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-slate-400">
              Sin modelos. Si es la primera vez, siembra el catálogo desde el inventario con <b>POST /api/admin/seed-catalogo</b>.
            </td></tr>
          )}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-400 mt-3">
        Los modelos y las marcas no se renombran: el nombre decide qué accesorios pide la remisión de sus equipos.
        Para retirar una variante mal escrita, desactívala — los equipos ya registrados no se tocan.
      </p>
    </section>
  )
}
```

El nombre del tipo no se resuelve a mano en ninguna parte: el `<select>` de cada fila ya lo enseña, porque su `value` es el `tipoId` del modelo. Cualquier ayudante que acabe sin usarse hay que borrarlo — un parámetro muerto es un warning de lint, y la línea base son 159 exactos.

- [ ] **Step 2: Comprobar que compila**

Run: `npm run typecheck`
Expected: FAIL solo en `EquiposAdmin.tsx` (Task 14).

- [ ] **Step 3: Commit**

```bash
git add apps/desk/src/components/CatalogoEquipos.tsx
git commit -m "feat(desk): pantalla de administración del catálogo de equipos"
```

---

## Task 14: El formulario de equipo, cerrado

**Files:**
- Modify: `apps/desk/src/components/EquiposAdmin.tsx:83-200` (`EquipoForm` entero)

- [ ] **Step 1: Reescribir `EquipoForm`**

Cambios respecto a lo que hay:

1. `facets` / `EquipoFacets` → `cat` / `Catalogo`, cargado con `getCatalogo(equipo?.modeloId)`.
2. Fuera los estados `marca`, `modelo`, `tipo`, `marcaOtro`, `modeloOtro`, `tipoOtro`, `tipoAuto` y toda la lógica de deducción: el tipo lo dice el modelo y no hay nada que deducir.
3. Estados nuevos: `marcaId` y `modeloId`.
4. El envío manda `modeloId`.

```tsx
function EquipoForm({ equipo, onClose, onSaved, isAdmin, onAbrirCatalogo }: {
  equipo: EquipoFull | null
  onClose: () => void
  onSaved: () => void
  isAdmin: boolean
  onAbrirCatalogo: () => void
}) {
  const [serial, setSerial] = useState(equipo?.serial ?? '')
  const [cat, setCat] = useState<Catalogo>({ tipos: [], marcas: [], modelos: [] })
  const [modeloId, setModeloId] = useState(equipo?.modeloId ?? '')
  const [marcaId, setMarcaId] = useState('')
  const [clientId, setClientId] = useState<string | null>(equipo?.clientId ?? null)
  const [clientName, setClientName] = useState(equipo?.clienteNombre ?? '')
  const [clientQuery, setClientQuery] = useState(equipo?.clienteNombre ?? '')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [clienteOpen, setClienteOpen] = useState(false)

  // `incluir` trae el modelo del equipo aunque se haya desactivado: sin eso, editarlo para cambiarle
  // el cliente obligaría además a cambiarle el modelo, que es un efecto colateral que nadie pidió.
  useEffect(() => {
    getCatalogo(equipo?.modeloId ?? null).then((c) => {
      setCat(c)
      const suyo = c.modelos.find((m) => m.id === equipo?.modeloId)
      if (suyo) setMarcaId(suyo.marcaId)
    }).catch(() => {})
  }, [equipo?.modeloId])

  useEffect(() => {
    if (clientId) { setClientResults([]); return }
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery, clientId])

  const modelos = cat.modelos.filter((m) => m.marcaId === marcaId)
  const elegido = cat.modelos.find((m) => m.id === modeloId) ?? null

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setBusy(true); setError(null)
    try {
      const payload = { serial, modeloId, clientId: clientId ?? undefined }
      if (equipo) await updateEquipo(equipo.id, payload)
      else await createEquipo(payload)
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[480px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">{equipo ? 'Editar equipo' : 'Nuevo equipo'}</h3>
        <input className={field} placeholder="Número de serie *" value={serial} onChange={(e) => setSerial(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={marcaId} onChange={(e) => { setMarcaId(e.target.value); setModeloId('') }} required>
            <option value="">Marca *</option>
            {cat.marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select className={field} value={modeloId} disabled={!marcaId} onChange={(e) => setModeloId(e.target.value)} required>
            <option value="">{marcaId ? 'Modelo *' : 'Elige marca primero'}</option>
            {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        {/* El tipo no se elige: lo determina el modelo. Se enseña para confirmar que es el equipo
            correcto, no para tocarlo. */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Tipo de equipo</label>
          <input className={`${field} bg-slate-50 text-slate-600 cursor-default`} readOnly
            value={elegido ? (elegido.tipoNombre ?? 'Sin tipo definido en el catálogo') : '—'} />
        </div>
        {/* El catálogo es cerrado a propósito: «Otro…» era la puerta por la que entraban EDM180C y
            EDM 180 C como modelos distintos. Quien no administra no se queda sin salida: se le dice
            a quién pedirlo. */}
        {marcaId && modelos.length === 0 && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            Esta marca no tiene modelos en el catálogo.{' '}
            {isAdmin
              ? <button type="button" onClick={onAbrirCatalogo} className="underline font-bold">Dalo de alta en el catálogo</button>
              : <>Pídele a un administrador que lo dé de alta en <b>Configuración → Catálogo de equipos</b>.</>}
          </div>
        )}
        {/* … el bloque del cliente se queda EXACTAMENTE como está hoy (líneas 172-185) … */}
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy || !modeloId} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
```

Ajusta los imports del fichero: fuera `equipoFacets` y `type EquipoFacets`, dentro `getCatalogo` y `type Catalogo`. `EquiposAdmin` pasa `isAdmin={!!user?.isAdmin}` y un `onAbrirCatalogo` que cierre el formulario y abra el catálogo (una prop nueva que `EquiposAdmin` recibe de `App`).

- [ ] **Step 2: Comprobar que compila y que el lint no sube**

Run: `npm run typecheck`
Expected: exit 0

Run: `npm run lint`
Expected: `159 problems (0 errors, 159 warnings)`. Si sale 160+, has dejado una variable o un parámetro sin usar; compara con la salida anterior para localizarlo.

Run: `npm run build`
Expected: `✓ built`

- [ ] **Step 3: Commit**

```bash
git add apps/desk/src/components/EquiposAdmin.tsx
git commit -m "feat(desk): el alta de equipos elige del catálogo y ya no inventa marcas ni modelos"
```

---

## Task 15: Montar la pantalla

**Files:**
- Modify: `apps/desk/src/components/Configuracion.tsx:24-30` en `0bea513` (props) y `:122-129` (categoría)
- Modify: `apps/desk/src/App.tsx:25` (lazy), `:144-162` (montaje)

- [ ] **Step 1: Enlazar desde Configuración**

En `Configuracion.tsx`, añadir `onOpenCatalogo: () => void` a las props y, en la categoría **Administración de datos**, la entrada justo antes de «Registro de equipos» — solo para administrador, porque la ruta lo exige:

```tsx
    {
      title: 'Administración de datos',
      items: [
        { label: 'Clientes (Zoho Books)', soon: true },
        { label: 'Órdenes de venta (Zoho Books)', soon: true },
        ...(isAdmin ? [{ label: 'Catálogo de equipos', onClick: onOpenCatalogo }] : []),
        { label: 'Registro de equipos', onClick: onOpenEquipos },
        { label: 'Importar / Exportar', soon: true },
      ],
    },
```

Y una entrada nueva al principio de `NOVEDADES`:

```tsx
  { title: 'Catálogo de equipos', body: 'Marcas, modelos y tipos se administran desde Configuración → Administración de datos. El tipo de equipo lo determina el modelo, así que el alta ya no lo pregunta, y las marcas y modelos dejan de inventarse sobre la marcha.' },
```

- [ ] **Step 2: Montar en App**

En `App.tsx`, junto a los demás `lazy`:

```tsx
const CatalogoEquipos = lazy(() => import('./components/CatalogoEquipos').then(m => ({ default: m.CatalogoEquipos })))
```

Añadir el estado `const [showCatalogo, setShowCatalogo] = useState(false)` junto a los otros `show*`, y dentro del `<Suspense>`:

```tsx
        {showCatalogo && <CatalogoEquipos onClose={() => setShowCatalogo(false)} />}
```

Pasar a `EquiposAdmin` las props nuevas:

```tsx
        {showEquipos && <EquiposAdmin onClose={() => setShowEquipos(false)} onAbrirCatalogo={() => { setShowEquipos(false); setShowCatalogo(true) }} />}
```

Y a `Configuracion`:

```tsx
            onOpenCatalogo={() => { setShowConfig(false); setShowCatalogo(true) }}
```

- [ ] **Step 3: Verificar**

Run: `npm run typecheck` → exit 0
Run: `npm run lint` → `159 problems (0 errors, 159 warnings)`
Run: `npm run build` → `✓ built`

- [ ] **Step 4: Commit**

```bash
git add apps/desk/src/components/Configuracion.tsx apps/desk/src/App.tsx
git commit -m "feat(desk): el catálogo de equipos entra en Configuración"
```

---

## Task 16: Verificación final y despliegue

**Files:** ninguno (salvo lo que haya que arreglar)

- [ ] **Step 1: Suite completa desde la raíz**

Run: `npm test`
Expected: todo verde. La cifra será 437 menos los tests de facetas borrados (Task 11) más los añadidos en las tareas 1, 3, 4, 5, 6, 7, 8, 9 y 10. **Calcula el número esperado y compáralo.** Si no cuadra, investiga; no lo ajustes a lo que salga.

- [ ] **Step 2: Typecheck, lint y build**

Run: `npm run typecheck` → exit 0
Run: `npm run lint` → `0 errors, 159 warnings`. Si es 160+, localízalo comparando con la línea base; casi siempre es un `as any` en un test o un parámetro sin usar.
Run: `npm run build` → `✓ built`

- [ ] **Step 3: Anotar en debt.md lo que queda abierto**

Añadir a la sección ROADMAP de `debt.md`:

```markdown
- **Catálogo de equipos — renombrar y fusionar (PENDIENTE, 2026-08-06).** La fase 1 deja el catálogo
  administrable pero **sin renombrar marcas ni modelos**, y por tanto sin poder fusionar `EDM180C` con
  `EDM 180 C`: solo desactivar la mala. El motivo es `perfilChecklist`, que decide el checklist "Incluye"
  de la remisión leyendo el TEXTO de marca y modelo por subcadena (`modelo.includes('edm180')`,
  `marca === 'horiba'`, `modelo.startsWith('ap')`). Renombrar cambiaría en silencio qué accesorios pide
  la remisión de esos equipos. Necesita su propio diseño, probablemente con previsualización del efecto
  sobre los perfiles antes de confirmar.
- **Catálogo de equipos — fases siguientes.** Ficha técnica (SKU, fotos, manuales), sincronización con
  Books y gestión de accesorios. Bloqueadas por lo ya anotado sobre `books.items`. Spec de la fase 1:
  `docs/superpowers/specs/2026-08-06-catalogo-maestro-equipos-design.md`.
```

- [ ] **Step 4: Commit y push**

```bash
git add debt.md
git commit -m "docs(desk): anotar lo que el catálogo de equipos deja abierto"
git push origin main
```

- [ ] **Step 5: Decirle al usuario qué le toca a él**

Al entregar, hay que decirle explícitamente:

1. **Desplegar**, y después **disparar la siembra una vez**: `POST /api/admin/seed-catalogo` con sesión de super administrador. Sin eso el catálogo está vacío y **no se pueden dar de alta equipos**, porque el modelo es obligatorio.
2. **Revisar la bandeja de conflictos** en Configuración → Catálogo de equipos: son los modelos que el inventario declaraba con más de un tipo.
3. Que **la UI no tiene harness de componentes** (sin jsdom), así que la pantalla del catálogo y el formulario de equipo van verificados con typecheck, lint y build, y necesitan su prueba manual.
4. Que **renombrar y fusionar no están**, y por qué.

---

## Notas de revisión del plan

Repasado contra la especificación. Cobertura: modelo de datos (Task 1), enlace con `equipos` (Task 10), siembra con sus cinco pasos y el desempate alfabético (Task 6), bandeja sin tabla propia (Task 7), API completa incluido `incluir=` (Tasks 3, 8, 9), pantallas (Tasks 13, 14, 15), fuera de alcance y riesgos anotados en `debt.md` (Task 16).

Cuatro cosas que la especificación dejaba implícitas y aquí se fijan:

- **`GET /api/catalogo` es de sesión, no de administrador.** Lo consume el formulario de equipos, que cualquiera puede usar. Solo `/api/catalogo/conflictos` y las escrituras exigen `isAdmin`.
- **La marca del modelo incluido por `incluir=` entra aunque esté desactivada.** Sin eso, el desplegable de marca no podría enseñar la del equipo que se está editando.
- **«`modelo_id` obligatorio al editar» rige en el formulario, no en el `PATCH`.** Exigirlo en la ruta rompería el botón «Desactivar» del listado, que manda un `PATCH` con solo `{ active }`.
- **El modelo se identifica por par (marca, modelo), no por nombre suelto.** Un `6103` de Environics y otro de Horiba son equipos distintos y los dos tienen que poder existir; la unicidad es por marca.

Revisado además el encaje de tipos entre tareas: `EquipoLite` gana `modeloId` en la Task 2, y **las dos** funciones que construyen equipos desde una fila —`toLite` y `toFull`— tienen que rellenarlo. `toFull` no pasa por `toLite`, así que se arreglan por separado; olvidar la segunda deja los tests de la Task 10 en rojo con la columna bien escrita, que es el fallo más caro de diagnosticar de todo el plan.
