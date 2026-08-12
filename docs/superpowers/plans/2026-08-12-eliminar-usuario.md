# Eliminar usuarios — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** poder eliminar de la pantalla de Usuarios a quien se dio de alta por error, sin poder romper el rastro de auditoría de quien sí trabajó.

**Architecture:** tres tareas. (1) El repo: `usosDeUsuario` cuenta las dos referencias **por id** que romperían al borrar —tickets derivados y transiciones que lo derivaron, esta última escondida en un `jsonb`— y `borrarUsuario` barre el estado personal y borra la fila, lanzando `UsuarioEnUso` si hay historial. Calcado de `EntradaEnUso` en `db/catalogo.ts`. (2) La ruta `DELETE`, con las tres puertas de 409. (3) El botón. Spec: `docs/superpowers/specs/2026-08-12-eliminar-usuario-design.md`.

**Tech Stack:** Express 5 + pg-mem/vitest/supertest, React 19 + Tailwind.

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones desde la raíz y en secuencia.

⚠️ **El esquema no tiene claves foráneas.** Todo lo que este plan no barra explícitamente queda huérfano en silencio. La lista de tablas del spec es la lista completa: no ampliarla ni recortarla sin revisar el spec.

---

### Task 1: el repo — contar usos y borrar

**Files:**
- Modify: `apps/desk/server/auth/users.ts` (dos funciones y una clase, al final)
- Test: `apps/desk/server/auth/users.test.ts` (describe nuevo)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/users.test.ts`, añadir al final del fichero, **fuera** del `describe('users repo', …)`:

```ts
describe('borrado de usuarios', () => {
  it('cuenta como uso el ticket derivado y la transición que lo derivó', async () => {
    const u = await createUser(db, { email: 'u@x.co', name: 'U', passwordHash: 'h' })
    expect(await usosDeUsuario(db, u.id)).toBe(0)

    await db.query("INSERT INTO tickets (id, number, status) VALUES ('t1', 1, 'Ingresado')")
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [u.id, 't1'])
    expect(await usosDeUsuario(db, u.id)).toBe(1)

    // La referencia ESCONDIDA: el id vive dentro del jsonb de la transición, que es el rastro de
    // auditoría. Sin contarla, se podría borrar a alguien y dejar UUIDs crudos en el historial.
    await db.query(
      `INSERT INTO ticket_transitions (ticket_id, transition_name, from_status, to_status, performed_by, values)
       VALUES ('t1','Habilitar','Ticket creado','Ingresado','Admin',$1)`,
      [JSON.stringify({ derivado_a: u.id })],
    )
    expect(await usosDeUsuario(db, u.id)).toBe(2)
  })

  it('borra al usuario sin historial y se lleva sesiones, avisos y lecturas', async () => {
    const u = await createUser(db, { email: 'u@x.co', name: 'U', passwordHash: 'h' })
    const otro = await createUser(db, { email: 'o@x.co', name: 'O', passwordHash: 'h' })
    await db.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,now())', ['tok', u.id])
    await db.query('INSERT INTO avisos (id, user_id, ticket_id, texto) VALUES ($1,$2,null,$3)', ['avi-1', u.id, 'x'])
    await db.query('INSERT INTO ticket_reads (ticket_id, user_id, read_at) VALUES ($1,$2,now())', ['t1', u.id])
    // Lo del OTRO usuario no se toca.
    await db.query('INSERT INTO avisos (id, user_id, ticket_id, texto) VALUES ($1,$2,null,$3)', ['avi-2', otro.id, 'y'])

    await borrarUsuario(db, u.id)

    expect(await getUserById(db, u.id)).toBeNull()
    expect((await db.query('SELECT 1 FROM sessions WHERE user_id=$1', [u.id])).rows).toEqual([])
    expect((await db.query('SELECT 1 FROM avisos WHERE user_id=$1', [u.id])).rows).toEqual([])
    expect((await db.query('SELECT 1 FROM ticket_reads WHERE user_id=$1', [u.id])).rows).toEqual([])
    expect((await db.query('SELECT 1 FROM avisos WHERE user_id=$1', [otro.id])).rows).toHaveLength(1)
    expect(await getUserById(db, otro.id)).not.toBeNull()
  })

  it('se niega a borrar a quien tiene historial, y no borra nada', async () => {
    const u = await createUser(db, { email: 'u@x.co', name: 'U', passwordHash: 'h' })
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('t1', 1, 'Ingresado')")
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [u.id, 't1'])

    await expect(borrarUsuario(db, u.id)).rejects.toThrow(UsuarioEnUso)
    expect(await getUserById(db, u.id)).not.toBeNull()
  })
})
```

Añadir a los imports de la cabecera del fichero: `usosDeUsuario`, `borrarUsuario` y `UsuarioEnUso` de `./users`.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: FAIL — `usosDeUsuario is not a function`.

- [ ] **Step 3: implementación mínima**

Añadir al final de `apps/desk/server/auth/users.ts`:

```ts
/** Usuario con historial. Se traduce a 409 con el conteo delante, como `EntradaEnUso`. */
export class UsuarioEnUso extends Error {
  constructor(public readonly usos: number) {
    super(`En uso por ${usos}`)
    this.name = 'UsuarioEnUso'
  }
}

/**
 * Cuántas referencias POR ID tiene esta persona, que son las que romperían al borrarla.
 *
 * Dos, y la segunda es la que importa: el id de la derivación viaja dentro del `values` de cada
 * transición, que es el rastro de auditoría que enseña el panel de Historia. Borrar a alguien
 * derivado alguna vez deja ese panel mostrando un UUID crudo para siempre, y reescribir el `values`
 * para evitarlo sería falsificar la auditoría.
 *
 * Lo que guarda el NOMBRE (quién ejecutó la transición, quién firmó la remisión) no se cuenta: es
 * texto y sobrevive al borrado sin romperse.
 */
export async function usosDeUsuario(db: Queryable, id: string): Promise<number> {
  const t = await db.query('SELECT COUNT(*)::int AS n FROM tickets WHERE derivado_a = $1', [id])
  const tr = await db.query("SELECT COUNT(*)::int AS n FROM ticket_transitions WHERE values->>'derivado_a' = $1", [id])
  return Number((t.rows[0] as Record<string, unknown>).n) + Number((tr.rows[0] as Record<string, unknown>).n)
}

/**
 * Borrado físico, y solo si no tiene historial.
 *
 * El esquema no tiene claves foráneas: lo que no se barra aquí queda huérfano en silencio. Se llevan
 * sesiones, avisos y lecturas —estado personal, sin valor de auditoría— y la fila se borra LA ÚLTIMA:
 * sin transacción que pg-mem pueda probar, un fallo a medias deja a la persona existiendo con menos
 * estado personal, que es molesto pero nunca corrupto. Al revés dejaría justo los huérfanos que esto
 * viene a evitar.
 */
export async function borrarUsuario(db: Queryable, id: string): Promise<void> {
  const usos = await usosDeUsuario(db, id)
  if (usos > 0) throw new UsuarioEnUso(usos)
  await db.query('DELETE FROM sessions WHERE user_id = $1', [id])
  await db.query('DELETE FROM avisos WHERE user_id = $1', [id])
  await db.query('DELETE FROM ticket_reads WHERE user_id = $1', [id])
  await db.query('DELETE FROM users WHERE id = $1', [id])
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: PASS.

⚠️ Si el `values->>'derivado_a'` revienta en pg-mem, **parar y avisar**, no rodearlo: la alternativa (traer todas las transiciones y filtrar en JS) es un full scan de una tabla que crece sin techo. pg-mem sí soporta `->>` (validado en la reorg de esquemas fase 2), así que un fallo aquí significa otra cosa.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar la segunda consulta de `usosDeUsuario` (devolver solo el conteo de `tickets`). Correr → debe FALLAR «cuenta como uso el ticket derivado y la transición que lo derivó», que esperaría 2 y recibiría 1. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/users.ts apps/desk/server/auth/users.test.ts
git commit -m "feat(desk): borrar usuario solo si no tiene historial

Sin claves foráneas, un DELETE deja huérfanos en silencio. Se cuentan
las dos referencias por id que romperían —el ticket derivado y la
transición que lo derivó, esta escondida en el jsonb de auditoría— y
se barre el estado personal antes de borrar la fila.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: la ruta `DELETE`, con sus tres puertas

**Files:**
- Modify: `apps/desk/server/auth/routes.ts` (ruta nueva tras el PATCH, e import)
- Test: `apps/desk/server/auth/routes.test.ts` (test nuevo)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/routes.test.ts`, añadir dentro del `describe('auth routes', …)`:

```ts
  it('elimina al usuario sin historial y cierra las tres puertas de 409', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const creado = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    const id = creado.body.id

    // 1) Al último administrador activo no se le borra: dejaría el sistema sin nadie que administre.
    const admins = (await request(a).get('/api/users').set('Cookie', cookie)).body
    const adminId = (admins as Array<{ id: string; isAdmin: boolean }>).find((u) => u.isAdmin)!.id
    expect((await request(a).delete(`/api/users/${adminId}`).set('Cookie', cookie)).status).toBe(409)

    // 2) Con historial, 409 con la salida escrita en el mensaje.
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('t1', 1, 'Ingresado')")
    await db.query('UPDATE tickets SET derivado_a = $1 WHERE id = $2', [id, 't1'])
    const enUso = await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)
    expect(enUso.status).toBe(409)
    expect(enUso.body.error).toMatch(/Desactívalo/)

    // 3) Sin historial, se borra.
    await db.query('UPDATE tickets SET derivado_a = NULL WHERE id = $1', ['t1'])
    expect((await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)).status).toBe(204)
    expect((await request(a).get('/api/users').set('Cookie', cookie)).body).toHaveLength(1)

    expect((await request(a).delete(`/api/users/${id}`).set('Cookie', cookie)).status).toBe(404)
  })

  it('no puedes borrarte a ti mismo', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    // Un segundo admin, para que la puerta que salte sea la de «a ti mismo» y no la del último admin.
    await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'a2@x.co', name: 'A2', password: 'password123', isAdmin: true })
    const yo = (await request(a).get('/api/auth/me').set('Cookie', cookie)).body

    const res = await request(a).delete(`/api/users/${yo.id}`).set('Cookie', cookie)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/ti mismo/)
  })
```

⚠️ El segundo test crea un admin extra a propósito: sin él saltaría la puerta del último administrador y el test pasaría por el motivo equivocado.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: FAIL — `expected 404 to be 409`: la ruta no existe, así que Express devuelve 404 a todo.

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/auth/routes.ts`, añadir al import de `./users` (línea 4) las tres piezas nuevas: `usosDeUsuario`, `borrarUsuario` y `UsuarioEnUso`.

Y añadir la ruta después del `PATCH /api/users/:id`:

```ts
  /**
   * Borrado físico, y solo de quien no tiene historial.
   *
   * El esquema no tiene claves foráneas, así que el orden de las puertas importa tanto como el
   * borrado: cada 409 evita un destrozo distinto y todos son irreversibles.
   */
  app.delete('/api/users/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const target = await getUserById(db, id)
    if (!target) { res.status(404).json({ error: 'Usuario no encontrado' }); return }
    // Te dejaría con la sesión muerta y sin forma de deshacerlo desde la propia aplicación.
    if (id === req.user!.id) { res.status(409).json({ error: 'No puedes borrarte a ti mismo' }); return }
    // La misma protección que el PATCH: sin ella, el borrado era la puerta de atrás para quedarse sin
    // ningún administrador.
    if (target.isAdmin && target.active && (await countActiveAdmins(db)) <= 1) {
      res.status(409).json({ error: 'No puedes borrar el último administrador activo' }); return
    }
    try {
      await borrarUsuario(db, id)
      res.status(204).end()
    } catch (e) {
      if (e instanceof UsuarioEnUso) {
        const tickets = e.usos === 1 ? 'ticket' : 'tickets'
        res.status(409).json({ error: `Tiene historial en ${e.usos} ${tickets}. Desactívalo en lugar de borrarlo.` })
        return
      }
      throw e
    }
  })
```

⚠️ `usosDeUsuario` se importa aunque la ruta no la llame directamente: la usa `borrarUsuario`. Si el linter avisa de import sin usar, quitarla del import — es la implementación la que la necesita, no la ruta.

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: PASS.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar la puerta del último administrador (borrar ese `if` entero). Correr → debe FALLAR la primera aserción del primer test, que esperaba 409 y recibiría 204. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/routes.ts apps/desk/server/auth/routes.test.ts
git commit -m "feat(desk): DELETE /api/users/:id con sus tres puertas

Tres 409, cada uno evitando un destrozo irreversible distinto: el
último administrador activo —que hasta ahora solo protegía el PATCH,
porque no había borrado—, borrarte a ti mismo, y borrar a quien tiene
historial, con la salida escrita en el mensaje.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: el botón

**Files:**
- Modify: `apps/desk/src/api/client.ts` (función nueva junto a `updateUser`)
- Modify: `apps/desk/src/components/UsersAdmin.tsx` (manejador y botón)

- [ ] **Step 1: el cliente**

En `apps/desk/src/api/client.ts`, justo después de `updateUser`, añadir:

```ts
export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}
```

- [ ] **Step 2: el manejador**

En `apps/desk/src/components/UsersAdmin.tsx`, añadir `deleteUser` al import de `../api/client`, y el manejador junto a `resetPassword`:

```tsx
  async function eliminar(u: UserPublic) {
    if (!confirm(`¿Eliminar a ${u.name}? No se puede deshacer.`)) return
    // El 409 del servidor viene redactado para leerse —trae el conteo y la salida—, así que se enseña
    // tal cual en vez de traducirlo aquí.
    try { await eliminarUsuarioApi(u.id); reload() }
    catch (e) { alert(String(e instanceof Error ? e.message : e)) }
  }
```

⚠️ El import debe renombrar la función para no chocar con el manejador: `import { …, deleteUser as eliminarUsuarioApi } from '../api/client'`. Si se prefiere no renombrar, llamar al manejador de otra forma; lo que no puede haber es dos `deleteUser` en el mismo ámbito.

- [ ] **Step 3: el botón**

En la columna de acciones, después del de resetear contraseña:

```tsx
                  <button onClick={() => eliminar(u)} className="text-[12px] text-red-600 ml-3">Eliminar</button>
```

- [ ] **Step 4: verificación completa, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: la suite en verde. Línea base 709 passed | 2 skipped más los 5 tests de las tareas 1-2; anotar el número real.
2. `npm run typecheck` — Expected: limpio, exit 0.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 5: commit y push**

```bash
git add apps/desk/src/api/client.ts apps/desk/src/components/UsersAdmin.tsx docs/superpowers/plans/2026-08-12-eliminar-usuario.md
git commit -m "feat(desk): botón de eliminar usuario

En rojo y con confirmación. El 409 del servidor se enseña tal cual: ya
viene redactado con el conteo y la salida (desactivar).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 6: pedir la prueba manual al usuario (tras desplegar)**

1. Crear un usuario de prueba y eliminarlo → desaparece de la lista.
2. Intentar eliminar a alguien con tickets derivados → aviso con el conteo y la sugerencia de desactivarlo.
3. Intentar eliminarte a ti mismo → aviso, no se borra.
4. Intentar eliminar al único administrador activo → aviso, no se borra.
