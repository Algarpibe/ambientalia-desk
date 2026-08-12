# Avisos por cambio de área — plan de implementación (entrega 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que cuando un ticket entre en una fase que le toca a otra área, el coordinador de esa área y los administradores lo vean en la campana.

**Architecture:** cuatro capas de abajo arriba. (1) Dos funciones **puras** en shared: `areasSiguientes(estado)` y `avisosPorArea(...)`, que son toda la lógica que puede romperse en silencio. (2) La columna `roles.recibe_avisos` y su lectura de destinatarios (candidatos por SQL, cruce de áreas en JS por pg-mem). (3) El enganche en `executeTransition`, junto al aviso de derivación que ya existe. (4) La casilla en la pantalla de Roles. Esta entrega **no manda correo**: la campana ya existe y ya se lee. Spec: `docs/superpowers/specs/2026-08-12-avisos-por-correo-design.md`.

**Tech Stack:** TypeScript ESM, vitest + pg-mem + supertest, React 19 + Tailwind.

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones desde la raíz y en secuencia (nunca lint, test y build a la vez).

---

### Task 1: `areasSiguientes` — a quién le toca desde un estado

**Files:**
- Modify: `packages/shared/src/transitions.ts` (función nueva al final, junto a `areasForTransition`)
- Test: `packages/shared/src/permissions.test.ts` (describe nuevo al final; es donde vive el test de `areasForTransition`)

- [ ] **Step 1: escribir el test que falla**

En `packages/shared/src/permissions.test.ts`, cambiar la línea 3 de import por:

```ts
import { areasForTransition, areasSiguientes } from './transitions'
```

y añadir al final del fichero:

```ts
describe('areasSiguientes', () => {
  // El caso que motivó la funcionalidad: Servicio Técnico termina y el ticket queda a la espera de
  // que Comercial facture. Las tres transiciones que salen de «Por Facturar» son de Comercial.
  it('desde «Por Facturar» le toca a Comercial', () => {
    expect(areasSiguientes('Por Facturar')).toEqual(['Comercial'])
  })

  // Las compuestas se descomponen, y cada área aparece UNA vez aunque la ofrezcan varias transiciones.
  it('descompone las áreas compuestas y no las repite', () => {
    expect(areasSiguientes('Notificación Comercial').sort()).toEqual(['Comercial', 'Compras', 'Servicio Técnico'])
  })

  // Un estado terminal no le toca a nadie: no hay transición que salga de él.
  it('un estado final no le toca a nadie', () => {
    expect(areasSiguientes('Finalizado')).toEqual([])
  })

  // Un estado que no existe tampoco: no se inventa nada ni revienta.
  it('un estado desconocido devuelve lista vacía', () => {
    expect(areasSiguientes('Estado que no existe')).toEqual([])
  })
})
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- packages/shared/src/permissions.test.ts`
Expected: FAIL — `areasSiguientes is not a function`.

- [ ] **Step 3: implementación mínima**

Añadir al final de `packages/shared/src/transitions.ts`, después de `areasForTransition`:

```ts
/**
 * Qué áreas pueden actuar sobre un ticket que está en `estado`.
 *
 * Es lo contrario de mirar el `area` de la transición que se acaba de ejecutar: ese `area` dice quién
 * la EJECUTA, no a quién le toca después. `escalado_a_comercial` es de Servicio Técnico y deja el
 * ticket en «Notificación Comercial», donde quien tiene que actuar es Comercial — avisar por el área
 * de la transición ejecutada mandaría el aviso justo a quien acaba de hacer el trabajo.
 *
 * Un estado terminal («Finalizado») devuelve lista vacía: no hay a quién pasarle el testigo.
 */
export function areasSiguientes(estado: string): string[] {
  const areas = new Set<string>()
  for (const t of TRANSITIONS) {
    if (!t.from.includes(estado)) continue
    for (const a of areasForTransition(t.area)) areas.add(a)
  }
  return [...areas]
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- packages/shared/src/permissions.test.ts`
Expected: PASS (los 2 describes previos + los 4 nuevos).

- [ ] **Step 5: mutar para comprobar que el test muerde**

Cambiar `for (const a of areasForTransition(t.area)) areas.add(a)` por `areas.add(t.area)` (sin descomponer las compuestas). Correr → debe FALLAR el test de «Notificación Comercial», que recibiría `'Comercial / Compras'` como si fuera un área. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add packages/shared/src/transitions.ts packages/shared/src/permissions.test.ts
git commit -m "feat(shared): areasSiguientes dice a quién le toca desde un estado

El `area` de una transición es quién la EJECUTA, no a quién le toca
después: avisar por ahí mandaría el aviso a quien acaba de hacer el
trabajo. Esto mira las transiciones que SALEN del estado nuevo.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `avisosPorArea` — la resta y el texto

La regla completa, pura: áreas siguientes **menos** las del actor, y el texto del aviso.

**Files:**
- Create: `apps/desk/server/services/avisoArea.ts`
- Test: `apps/desk/server/services/avisoArea.test.ts`

- [ ] **Step 1: escribir el test que falla**

Crear `apps/desk/server/services/avisoArea.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { areasAAvisar, textoAvisoArea } from './avisoArea'

describe('areasAAvisar', () => {
  // El caso que motivó la funcionalidad: el técnico termina y le toca facturar a Comercial.
  it('avisa al área que recibe el testigo', () => {
    expect(areasAAvisar('Por Facturar', ['Servicio Técnico'])).toEqual(['Comercial'])
  })

  // Sin la resta, «Facturado» (Comercial → Liberación Comercial, cuya siguiente también es Comercial)
  // le avisaría a Comercial de que le toca a Comercial.
  it('no avisa al área que acaba de actuar', () => {
    expect(areasAAvisar('Liberación Comercial', ['Comercial'])).toEqual([])
  })

  // Un admin tiene las tres áreas: la resta lo deja vacío. Decisión consciente del spec — si hace el
  // trabajo de las tres áreas no hay «otro perfil» a quien pasarle el testigo.
  it('quien tiene todas las áreas no le pasa el testigo a nadie', () => {
    expect(areasAAvisar('Por Facturar', ['Comercial', 'Servicio Técnico', 'Compras'])).toEqual([])
  })

  // De «Notificación Comercial» salen Comercial, Compras y Servicio Técnico; el técnico que acaba de
  // escalar se resta a sí mismo y quedan las otras dos.
  it('resta solo lo suyo cuando hay varias áreas siguientes', () => {
    expect(areasAAvisar('Notificación Comercial', ['Servicio Técnico']).sort()).toEqual(['Comercial', 'Compras'])
  })

  it('un estado final no avisa a nadie', () => {
    expect(areasAAvisar('Finalizado', ['Servicio Técnico'])).toEqual([])
  })
})

describe('textoAvisoArea', () => {
  it('dice el ticket, el estado nuevo y quién lo movió', () => {
    expect(textoAvisoArea({ ticketNumero: 1234, estado: 'Por Facturar', actorNombre: 'Ana' }))
      .toBe('Ana dejó el ticket #1234 en «Por Facturar»: le toca a tu área')
  })
})
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/services/avisoArea.test.ts`
Expected: FAIL — no se puede resolver `./avisoArea`.

- [ ] **Step 3: implementación mínima**

Crear `apps/desk/server/services/avisoArea.ts`:

```ts
import { areasSiguientes } from '@ambientalia/shared'

/**
 * A qué áreas hay que avisar tras dejar un ticket en `estado`.
 *
 * Es `areasSiguientes` MENOS las áreas de quien acaba de actuar, que es la definición literal que dio
 * el usuario: se avisa cuando interviene **otro** perfil. Sin la resta, «Facturado» —que deja el
 * ticket en una fase que también es de Comercial— le avisaría a Comercial de que le toca a Comercial,
 * y la campana se convierte en ruido que la gente aprende a ignorar.
 *
 * Se restan las áreas del USUARIO, no las de la transición: un administrador las tiene todas, así que
 * no dispara avisos de área. Es deliberado (ver el spec) — si hace el trabajo de las tres áreas, no
 * hay a quién pasarle el testigo.
 */
export function areasAAvisar(estado: string, areasActor: string[]): string[] {
  return areasSiguientes(estado).filter((a) => !areasActor.includes(a))
}

export function textoAvisoArea(c: { ticketNumero: number; estado: string; actorNombre: string }): string {
  return `${c.actorNombre} dejó el ticket #${c.ticketNumero} en «${c.estado}»: le toca a tu área`
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/services/avisoArea.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar el filtro: `return areasSiguientes(estado)`. Correr → deben FALLAR los tests «no avisa al área que acaba de actuar» y «quien tiene todas las áreas…». Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/services/avisoArea.ts apps/desk/server/services/avisoArea.test.ts
git commit -m "feat(desk): regla de aviso por cambio de área

Áreas siguientes menos las del actor: se avisa cuando interviene otro
perfil, que es la definición que dio el usuario. Sin la resta,
«Facturado» le avisaría a Comercial de que le toca a Comercial.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `roles.recibe_avisos` y los destinatarios

**Files:**
- Modify: `packages/zoho-sync/src/db/schema.sql` (dos ALTER, junto a los de `roles`/`avisos`)
- Modify: `apps/desk/server/auth/roles.ts` (tipo `Role`, `rowToRole`, los tres SELECT y `updateRole`)
- Modify: `apps/desk/server/db/avisos.ts` (función nueva `destinatariosDeArea`)
- Test: `apps/desk/server/db/avisos.test.ts` (describe nuevo)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/db/avisos.test.ts`, añadir al final del fichero (dentro del `describe` de nivel superior si lo hay, o como describe nuevo — mirar cómo está montado el `beforeEach` del fichero y reutilizarlo tal cual):

```ts
describe('destinatariosDeArea', () => {
  // El coordinador del área y TODOS los administradores activos, sin repetir a nadie y sin el actor.
  it('devuelve el rol receptor del área más los administradores activos', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const otro = await createRole(db, { name: 'Asistente Comercial', areas: ['Comercial'] })

    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h', roleId: otro.id })
    const admin = await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: 'h', isAdmin: true })

    const ids = (await destinatariosDeArea(db, 'Comercial', '')).map((d) => d.id).sort()
    expect(ids).toEqual([admin.id, ana.id].sort())
  })

  it('no incluye al actor, aunque le tocara por rol', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    expect(await destinatariosDeArea(db, 'Comercial', ana.id)).toEqual([])
  })

  it('ignora a los inactivos y a los de un rol desactivado', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    await updateUser(db, ana.id, { active: false })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])

    await updateUser(db, ana.id, { active: true })
    await updateRole(db, coord.id, { active: false })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])
  })

  // El rol receptor de OTRA área no recibe los avisos de esta.
  it('no avisa al receptor de un área distinta', async () => {
    const tec = await createRole(db, { name: 'Coordinador Técnico', areas: ['Servicio Técnico'] })
    await actualizarRecibeAvisos(db, tec.id, true)
    await createUser(db, { email: 'tec@x.co', name: 'Tec', passwordHash: 'h', roleId: tec.id })
    expect(await destinatariosDeArea(db, 'Comercial', '')).toEqual([])
  })
})
```

Los imports que hay que añadir a la cabecera del fichero de test: `destinatariosDeArea` de `./avisos`, `createRole`, `updateRole` y `actualizarRecibeAvisos` de `../auth/roles`, y `createUser`, `updateUser` de `../auth/users`.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/db/avisos.test.ts`
Expected: FAIL — `destinatariosDeArea is not a function` (y `actualizarRecibeAvisos` tampoco existe).

- [ ] **Step 3: la columna**

En `packages/zoho-sync/src/db/schema.sql`, junto a los `ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo …` (línea 112-116), añadir:

```sql
-- Que rol recibe los avisos de sus areas cuando un ticket entra en una fase que le toca. Es una
-- casilla del rol y no del usuario: el destinatario es el cargo, no la persona, y asi sobrevive a
-- que la persona cambie. Comentario de UNA linea: el split por `;` de pg-mem no maneja bloques.
ALTER TABLE roles ADD COLUMN IF NOT EXISTS recibe_avisos boolean NOT NULL DEFAULT false;
-- Cuando se despacho el correo de este aviso. NULL = pendiente, que es la cola de reintento.
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS enviado_at timestamptz;
```

⚠️ `avisos` y `roles` son app-nativas: los `ALTER` van sobre el nombre pelado porque las tablas ya se declararon `public.` arriba, igual que los `ALTER` de `users`.

- [ ] **Step 4: el campo en el repo de roles**

En `apps/desk/server/auth/roles.ts`:

Reemplazar la interfaz (línea 5):

```ts
export interface Role { id: string; name: string; areas: string[]; active: boolean }
```

por:

```ts
export interface Role { id: string; name: string; areas: string[]; active: boolean; recibeAvisos: boolean }
```

Reemplazar `rowToRole` (líneas 7-9):

```ts
function rowToRole(r: any): Role {
  return { id: r.id, name: r.name, areas: Array.isArray(r.areas) ? r.areas : [], active: r.active }
}
```

por:

```ts
function rowToRole(r: any): Role {
  return {
    id: r.id, name: r.name, areas: Array.isArray(r.areas) ? r.areas : [], active: r.active,
    recibeAvisos: r.recibe_avisos === true,
  }
}
```

Añadir `,recibe_avisos` a las tres consultas que hoy piden `id,name,areas,active`: el `RETURNING` de `createRole` (línea 17), el `SELECT` de `listRoles` (línea 24) y el de `getRole` (línea 29).

En `updateRole`, ampliar el patch y añadir el `set`:

```ts
export async function updateRole(
  db: Queryable,
  id: string,
  patch: { name?: string; areas?: string[]; active?: boolean; recibeAvisos?: boolean },
): Promise<void> {
  const sets: string[] = ['updated_at=now()']
  const params: unknown[] = [id]
  if (patch.name !== undefined) { params.push(patch.name.trim()); sets.push(`name=$${params.length}`) }
  if (patch.areas !== undefined) { params.push(JSON.stringify(validAreas(patch.areas))); sets.push(`areas=$${params.length}`) }
  if (patch.active !== undefined) { params.push(patch.active); sets.push(`active=$${params.length}`) }
  if (patch.recibeAvisos !== undefined) { params.push(patch.recibeAvisos); sets.push(`recibe_avisos=$${params.length}`) }
  await db.query(`UPDATE roles SET ${sets.join(',')} WHERE id=$1`, params)
}
```

Y añadir el atajo que usan los tests, al final del fichero:

```ts
/** Atajo de un solo campo, para no arrastrar el patch entero donde solo se marca la casilla. */
export async function actualizarRecibeAvisos(db: Queryable, id: string, valor: boolean): Promise<void> {
  await updateRole(db, id, { recibeAvisos: valor })
}
```

- [ ] **Step 5: los destinatarios**

Añadir al final de `apps/desk/server/db/avisos.ts`:

```ts
/**
 * Quién debe enterarse de que un ticket entró en una fase de `area`.
 *
 * Dos grupos, sin repetidos: quien tenga un rol **marcado como receptor** cuyas áreas cubran esa área,
 * y **todos los administradores activos**, que reciben copia de los cambios de área por decisión del
 * usuario. El actor nunca se avisa a sí mismo: acaba de hacerlo.
 *
 * El cruce de áreas se hace en JS y no con `@>` en SQL porque `roles.areas` es `jsonb` y pg-mem no
 * resuelve la contención; el filtro barato (`recibe_avisos`, activos) sí va en SQL.
 */
export async function destinatariosDeArea(
  db: Queryable,
  area: string,
  actorId: string,
): Promise<Array<{ id: string; email: string; name: string }>> {
  const r = await db.query(
    `SELECT u.id, u.email, u.name, u.is_admin, r.areas AS role_areas
       FROM users u LEFT JOIN roles r ON u.role_id = r.id AND r.active = true AND r.recibe_avisos = true
      WHERE u.active = true`,
  )
  const porId = new Map<string, { id: string; email: string; name: string }>()
  for (const x of filas(r.rows)) {
    const id = String(x.id)
    if (id === actorId) continue
    const areas = Array.isArray(x.role_areas) ? (x.role_areas as string[]) : []
    if (x.is_admin !== true && !areas.includes(area)) continue
    porId.set(id, { id, email: String(x.email), name: String(x.name) })
  }
  return [...porId.values()]
}
```

- [ ] **Step 6: verlo pasar**

Run: `npm test -- apps/desk/server/db/avisos.test.ts`
Expected: PASS.

- [ ] **Step 7: mutar para comprobar que el test muerde**

Quitar `AND r.recibe_avisos = true` del `LEFT JOIN`. Correr → debe FALLAR «devuelve el rol receptor del área más los administradores activos», porque Beto (Asistente Comercial, sin la casilla) entraría en la lista. Deshacer y correr otra vez → verde.

- [ ] **Step 8: commit**

```bash
git add packages/zoho-sync/src/db/schema.sql apps/desk/server/auth/roles.ts apps/desk/server/db/avisos.ts apps/desk/server/db/avisos.test.ts
git commit -m "feat(desk): rol receptor de avisos y resolución de destinatarios

El destinatario es el CARGO y no la persona: así sobrevive a que la
persona cambie. Los administradores reciben copia de los cambios de
área, por decisión del usuario. El cruce de áreas va en JS porque
roles.areas es jsonb y pg-mem no resuelve la contención.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: el enganche en la transición

**Files:**
- Modify: `apps/desk/server/services/ticketService.ts:104-122` (bloque de avisos)
- Test: `apps/desk/server/app.test.ts` (test nuevo de integración)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/app.test.ts`, añadir al final del fichero. Usa los helpers que ya existen: `userCookie(areas)` (línea 42, crea rol + usuario + sesión), `appWith()` (línea 30) y `createRole`/`createUser`, ya importados en la cabecera.

```ts
/**
 * El segundo disparador de avisos: el ticket entra en una fase que le toca a OTRA área. No es la
 * derivación —ahí se nombra a una persona—; aquí el testigo pasa a un cargo.
 */
describe('avisos por cambio de área', () => {
  it('avisa al rol receptor del área que recibe el testigo, no a quien ejecutó', async () => {
    // Quien recibe el testigo: el coordinador comercial, con la casilla marcada.
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })
    // Un comercial SIN la casilla: no debe recibir nada, para que el test distinga rol de área.
    const otro = await createRole(db, { name: 'Asistente Comercial', areas: ['Comercial'] })
    const beto = await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h', roleId: otro.id })

    // Quien ejecuta: Servicio Técnico. `userCookie` le crea su propio rol.
    const cookie = await userCookie(['Servicio Técnico'])
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'En Proceso', true)")
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'finalizacion_servicio', values: { comment: 'listo', 'Fecha Finalización ST': '2026-08-12' } })
    expect(res.status).toBe(200)

    const deAna = await listarAvisos(db, ana.id)
    expect(deAna).toHaveLength(1)
    expect(deAna[0].texto).toMatch(/Por Facturar/)
    expect(await listarAvisos(db, beto.id)).toEqual([])
  })

  // «Facturado» deja el ticket en «Liberación Comercial», cuya transición siguiente TAMBIÉN es de
  // Comercial: avisar ahí sería decirle a Comercial que le toca a Comercial.
  it('no avisa cuando la fase siguiente sigue siendo del área que actuó', async () => {
    const coord = await createRole(db, { name: 'Coordinador Comercial', areas: ['Comercial'] })
    await actualizarRecibeAvisos(db, coord.id, true)
    const ana = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: coord.id })

    const cookie = await userCookie(['Comercial'])
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10001, 'Por Facturar', true)")
    const { app } = appWith()

    await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'facturado', values: { comment: 'ok', 'Fecha De Factura': '2026-08-12' } })

    expect(await listarAvisos(db, ana.id)).toEqual([])
  })
})
```

Imports a añadir en la cabecera del fichero: `listarAvisos` de `./db/avisos` y `actualizarRecibeAvisos` de `./auth/roles` (`createRole` y `createUser` ya están importados).

⚠️ El primer test lleva a Beto a propósito: sin él, la mutación de quitar `recibe_avisos` del `JOIN` (Task 3) sobreviviría a este test también.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: FAIL — `expected [] to have length 1`: hoy la transición solo crea avisos de derivación.

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/services/ticketService.ts`, después del bloque del aviso de derivación (el `if` que termina en la línea 122) y **antes** de `const updated = await getTicketWithRefs(...)`, añadir:

```ts
  /*
   * El segundo aviso: el ticket entró en una fase que le toca a otra área. Va aquí, junto al de
   * derivación y por la misma razón —fuera de la transacción, porque `avisos` es de la app y
   * `applyTransition` vive en el paquete de sincronización—, y con la misma tolerancia al fallo: lo
   * que importa es la transición, que ya está escrita.
   */
  for (const area of areasAAvisar(t.to, user.areas)) {
    for (const d of await destinatariosDeArea(db, area, user.id ?? '')) {
      await crearAviso(db, {
        userId: d.id,
        ticketId: id,
        texto: textoAvisoArea({ ticketNumero: Number(current.row.number), estado: t.to, actorNombre: actor }),
      })
    }
  }
```

⚠️ Una persona que sea destinataria por dos áreas a la vez (Comercial y Compras) recibiría dos avisos idénticos. Deduplicar por id **fuera del bucle de áreas**: acumular los destinatarios de todas las áreas en un `Map` por id y crear un aviso por persona. Escribirlo así:

```ts
  const areasAvisar = areasAAvisar(t.to, user.areas)
  if (areasAvisar.length) {
    const porPersona = new Map<string, { id: string }>()
    for (const area of areasAvisar) {
      for (const d of await destinatariosDeArea(db, area, user.id ?? '')) porPersona.set(d.id, d)
    }
    const texto = textoAvisoArea({ ticketNumero: Number(current.row.number), estado: t.to, actorNombre: actor })
    for (const d of porPersona.values()) {
      await crearAviso(db, { userId: d.id, ticketId: id, texto })
    }
  }
```

Añadir a los imports de la cabecera: `areasAAvisar` y `textoAvisoArea` de `./avisoArea`, y `destinatariosDeArea` de `../db/avisos` (junto a `crearAviso`, que ya está importado de ahí).

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: PASS.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Cambiar `areasAAvisar(t.to, user.areas)` por `areasAAvisar(t.to, [])` (sin restar al actor). Correr → debe FALLAR el **segundo** test («no avisa cuando la fase siguiente sigue siendo del área que actuó»): sin la resta, ejecutar «Facturado» como Comercial deja `['Comercial']` y Ana recibiría un aviso.

⚠️ El primer test **no** caza esta mutación, y conviene entender por qué antes de darlo por bueno: el rol que crea `userCookie` para el técnico no tiene la casilla de avisos, así que el técnico no recibiría nada ni con la resta ni sin ella. Es el segundo test el que tiene dientes aquí.

Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/services/ticketService.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): la transición avisa al área que recibe el testigo

Junto al aviso de derivación y fuera de la transacción, por la misma
razón ya documentada ahí. Se deduplica por persona: quien sea
destinatario por dos áreas recibe un solo aviso.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: la casilla en la pantalla de Roles

**Files:**
- Modify: `apps/desk/server/auth/routes.ts:121-124` (el PATCH de roles)
- Modify: `apps/desk/src/api/client.ts:129` (tipo `Role`) y `:148` (`updateRole`)
- Modify: `apps/desk/src/components/RolesAdmin.tsx` (columna nueva y pie explicativo)

- [ ] **Step 1: aceptar el campo en el PATCH**

En `apps/desk/server/auth/routes.ts`, en `app.patch('/api/roles/:id', …)`, reemplazar la declaración del patch:

```ts
    const patch: { name?: string; areas?: string[]; active?: boolean } = {}
```

por:

```ts
    const patch: { name?: string; areas?: string[]; active?: boolean; recibeAvisos?: boolean } = {}
```

y añadir, junto a las demás asignaciones de ese bloque:

```ts
    if (req.body.recibeAvisos !== undefined) patch.recibeAvisos = Boolean(req.body.recibeAvisos)
```

- [ ] **Step 2: el tipo y el cliente**

En `apps/desk/src/api/client.ts`, reemplazar la línea 129:

```ts
export interface Role { id: string; name: string; areas: string[]; active: boolean }
```

por:

```ts
export interface Role { id: string; name: string; areas: string[]; active: boolean; recibeAvisos: boolean }
```

y la línea 148:

```ts
export function updateRole(id: string, patch: Partial<{ name: string; areas: string[]; active: boolean }>): Promise<Role> {
```

por:

```ts
export function updateRole(id: string, patch: Partial<{ name: string; areas: string[]; active: boolean; recibeAvisos: boolean }>): Promise<Role> {
```

- [ ] **Step 3: la columna en la tabla**

En `apps/desk/src/components/RolesAdmin.tsx`, añadir el manejador junto a `toggleArea` (después de la línea 19):

```tsx
  async function toggleAvisos(r: Role) { await updateRole(r.id, { recibeAvisos: !r.recibeAvisos }); reload() }
```

En la cabecera de la tabla (línea 32), reemplazar:

```tsx
            <th className="py-2">Rol</th>{AREAS.map((a) => <th key={a} className="px-2">{a}</th>)}<th>Activo</th><th></th>
```

por:

```tsx
            <th className="py-2">Rol</th>{AREAS.map((a) => <th key={a} className="px-2">{a}</th>)}<th className="px-2">Avisos</th><th>Activo</th><th></th>
```

Y en el cuerpo, justo después del `{AREAS.map(...)}` que pinta las casillas de área (cierra en la línea 42), añadir la celda:

```tsx
                <td className="px-2 text-center">
                  <input type="checkbox" checked={r.recibeAvisos} onChange={() => toggleAvisos(r)} className="accent-blue-600" />
                </td>
```

- [ ] **Step 4: el pie explicativo**

Reemplazar el párrafo de la línea 51:

```tsx
        <p className="text-[11px] text-slate-400 mt-3">Cada rol puede ejecutar las transiciones de las áreas marcadas. Un rol con las 3 áreas equivale a "Gerencia/Director".</p>
```

por:

```tsx
        <p className="text-[11px] text-slate-400 mt-3">
          Cada rol puede ejecutar las transiciones de las áreas marcadas. Un rol con las 3 áreas equivale
          a «Gerencia/Director». La casilla <strong>Avisos</strong> marca quién se entera cuando un ticket
          entra en una fase de sus áreas: márcala en el rol que coordina cada área, no en todos. Los
          administradores reciben esos avisos siempre.
        </p>
```

- [ ] **Step 5: verificación completa, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: toda la suite en verde. La cuenta esperada es la línea base (691 passed | 2 skipped) más los tests añadidos en las tareas 1-4; anotar el número real, no darlo por bueno de memoria.
2. `npm run typecheck` — Expected: limpio, exit 0.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 6: commit y push**

```bash
git add apps/desk/server/auth/routes.ts apps/desk/src/api/client.ts apps/desk/src/components/RolesAdmin.tsx docs/superpowers/plans/2026-08-12-avisos-cambio-de-area.md
git commit -m "feat(desk): casilla de avisos en la pantalla de Roles

Marca qué rol se entera cuando un ticket entra en una fase de sus
áreas. Se eligió una casilla del rol frente a deducirlo del nombre,
que se rompe en silencio en cuanto alguien lo renombra.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 7: pedir la prueba manual al usuario (tras desplegar)**

1. Roles → marcar la casilla **Avisos** en «Coordinador Comercial».
2. Con un usuario de Servicio Técnico, ejecutar «finalización de servicio» en un ticket que esté «En Proceso».
3. La persona con el rol «Coordinador Comercial» ve el aviso en la campana; el técnico que lo ejecutó, no.
4. Ejecutar «Facturado» con el coordinador comercial → **no** debe generarse aviso de área (la fase siguiente sigue siendo suya).

⚠️ Esta entrega **no manda correo**. El canal de correo es la entrega 2, con su propio spec ya escrito y su propio plan.
