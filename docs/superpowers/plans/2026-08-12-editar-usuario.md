# Editar usuarios — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que la pantalla de Usuarios deje editar a la persona —correo, nombre, cargo y empresa— en una sola ventana.

**Architecture:** tres tareas de abajo arriba. (1) El repo acepta `email` en el patch. (2) La ruta lo normaliza y comprueba la unicidad **excluyendo al propio usuario**, que es la trampa de este endpoint. (3) La ventana de edición en la interfaz, que además retira los `prompt()` con los que hoy se editan cargo y empresa. Spec: `docs/superpowers/specs/2026-08-12-editar-usuario-design.md`.

**Tech Stack:** Express 5 + pg-mem/vitest/supertest (server), React 19 + Tailwind (apps/desk, sin harness de componentes).

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones desde la raíz y en secuencia (nunca lint, test y build a la vez).

---

### Task 1: el repo acepta `email`

**Files:**
- Modify: `apps/desk/server/auth/users.ts:83-97` (`updateUser`)
- Test: `apps/desk/server/auth/users.test.ts` (test nuevo)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/users.test.ts`, añadir dentro del `describe('users repo', ...)`:

```ts
  it('updateUser cambia el correo, normalizado', async () => {
    const u = await createUser(db, { email: 'viejo@x.co', name: 'V', passwordHash: 'h' })
    await updateUser(db, u.id, { email: 'NUEVO@X.CO' })
    expect((await getUserById(db, u.id))!.email).toBe('nuevo@x.co')
    // Y se puede encontrar por el nuevo, que es lo que hace falta para iniciar sesión.
    expect(await getUserByEmail(db, 'nuevo@x.co')).not.toBeNull()
  })
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: FAIL — `expected 'viejo@x.co' to be 'nuevo@x.co'`: el patch ignora la clave.

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/auth/users.ts`, en `updateUser`, ampliar la firma del patch:

```ts
  patch: { name?: string; email?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null; cargo?: string | null; empresa?: string | null },
```

y añadir el `set`, justo después del de `name`:

```ts
  // Normalizado aquí igual que en el alta: el correo es la identidad de acceso y dos grafías del
  // mismo buzón serían dos usuarios distintos para `getUserByEmail`.
  if (patch.email !== undefined) { params.push(normalize(patch.email)); sets.push(`email=$${params.length}`) }
```

(`normalize` ya existe en la línea 11 de ese fichero.)

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: PASS.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Cambiar `normalize(patch.email)` por `patch.email` (sin normalizar). Correr → debe FALLAR: el correo se guardaría como `NUEVO@X.CO`. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/users.ts apps/desk/server/auth/users.test.ts
git commit -m "feat(desk): updateUser acepta el correo

Normalizado igual que en el alta: el correo es la identidad de acceso
y dos grafías del mismo buzón serían dos usuarios para getUserByEmail.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: la ruta, con la unicidad que excluye al propio usuario

**Files:**
- Modify: `apps/desk/server/auth/routes.ts:74-105` (el PATCH)
- Test: `apps/desk/server/auth/routes.test.ts` (test nuevo)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/routes.test.ts`, añadir dentro del `describe('auth routes', ...)`:

```ts
  it('el PATCH cambia el correo, y el duplicado da 409 sin bloquear al propio usuario', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const creado = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'op@x.co', name: 'Op', password: 'password123' })
    const id = creado.body.id

    const ok = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: '  NUEVO@X.CO ' })
    expect(ok.status).toBe(200)
    expect(ok.body.email).toBe('nuevo@x.co')

    // LA TRAMPA: guardar la ficha sin haber tocado el correo no puede rechazarse a sí misma. Sin
    // excluir al propio usuario de la comprobación, este PATCH da 409 y no se puede editar nada más.
    const mismo = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: 'nuevo@x.co', name: 'Op 2' })
    expect(mismo.status).toBe(200)
    expect(mismo.body.name).toBe('Op 2')

    // El de OTRO usuario sí se rechaza.
    const chocado = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: 'admin@x.co' })
    expect(chocado.status).toBe(409)

    const vacio = await request(a).patch(`/api/users/${id}`).set('Cookie', cookie).send({ email: '   ' })
    expect(vacio.status).toBe(422)
  })
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: FAIL — `expected 'op@x.co' to be 'nuevo@x.co'`: la ruta ignora `email`.

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/auth/routes.ts`, en el PATCH, ampliar la declaración del patch:

```ts
    const patch: { name?: string; email?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null; cargo?: string | null; empresa?: string | null } = {}
```

y añadir, después de la línea de `name`:

```ts
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase()
      if (!email) { res.status(422).json({ error: 'El correo es obligatorio' }); return }
      // El `!== id` es la clave: sin él, guardar la ficha sin tocar el correo se choca consigo misma
      // y devuelve 409, dejando al usuario sin poder editar ni el nombre.
      const otro = await getUserByEmail(db, email)
      if (otro && otro.id !== id) { res.status(409).json({ error: 'Ya existe un usuario con ese correo' }); return }
      patch.email = email
    }
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: PASS.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar el `&& otro.id !== id` (dejar `if (otro)`). Correr → debe FALLAR la aserción de «guardar sin tocar el correo», que pasaría a devolver 409. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/routes.ts apps/desk/server/auth/routes.test.ts
git commit -m "feat(desk): el PATCH de usuario acepta el correo

Con la unicidad excluyendo al propio usuario: sin ese `!== id`,
guardar la ficha sin tocar el correo se choca consigo misma y devuelve
409, dejando al usuario sin poder editar ni el nombre.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: la ventana de edición

**Files:**
- Modify: `apps/desk/src/api/client.ts:121` (`updateUser`)
- Modify: `apps/desk/src/components/UsersAdmin.tsx` (ventana nueva, botón, y retirada de los `prompt()`)

- [ ] **Step 1: el cliente acepta `email`**

En `apps/desk/src/api/client.ts`, en la firma de `updateUser`, añadir `email: string` a las claves del `Partial<...>`:

```ts
export function updateUser(id: string, patch: Partial<{ name: string; email: string; isAdmin: boolean; active: boolean; password: string; roleId: string | null; cargo: string | null; empresa: string | null }>): Promise<UserPublic> {
```

- [ ] **Step 2: el estado y el botón en la tabla**

En `apps/desk/src/components/UsersAdmin.tsx`:

Añadir el estado, junto a `const [creating, setCreating] = useState(false)`:

```tsx
  const [editando, setEditando] = useState<UserPublic | null>(null)
```

**Borrar la función `editarCampo` entera** (las líneas del comentario `/** Cargo y empresa se imprimen…` y la función), porque las celdas dejan de ser botones.

Reemplazar las dos celdas de Cargo y Empresa, que hoy son botones con `prompt()`:

```tsx
                <td>
                  <button onClick={() => editarCampo(u, 'cargo')} className={`text-[12px] hover:underline ${u.cargo ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                    {u.cargo || 'Sin definir'}
                  </button>
                </td>
                <td>
                  <button onClick={() => editarCampo(u, 'empresa')} className={`text-[12px] hover:underline ${u.empresa ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                    {u.empresa || 'Sin definir'}
                  </button>
                </td>
```

por texto plano, conservando el «Sin definir» en gris cursiva:

```tsx
                <td className={`text-[12px] ${u.cargo ? 'text-slate-700' : 'text-slate-400 italic'}`}>{u.cargo || 'Sin definir'}</td>
                <td className={`text-[12px] ${u.empresa ? 'text-slate-700' : 'text-slate-400 italic'}`}>{u.empresa || 'Sin definir'}</td>
```

Y añadir el botón «Editar» el primero de la columna de acciones:

```tsx
                  <button onClick={() => setEditando(u)} className="text-[12px] text-blue-600 mr-3">Editar</button>
```

- [ ] **Step 3: montar la ventana**

Junto a `{creating && <CreateUser … />}`, añadir:

```tsx
      {editando && <EditarUsuario usuario={editando} onClose={() => setEditando(null)} onGuardado={() => { setEditando(null); reload() }} />}
```

- [ ] **Step 4: la ventana**

Añadir al final de `apps/desk/src/components/UsersAdmin.tsx`:

```tsx
/**
 * Edita QUIÉN es la persona: correo, nombre, cargo y empresa.
 *
 * No toca Admin, Activo ni Rol a propósito: esos tres ya tienen su control en la fila, y repetirlos
 * aquí serían dos formas de hacer lo mismo con el riesgo de que una pisara a la otra.
 */
function EditarUsuario({ usuario, onClose, onGuardado }: { usuario: UserPublic; onClose: () => void; onGuardado: () => void }) {
  const [email, setEmail] = useState(usuario.email)
  const [name, setName] = useState(usuario.name)
  const [cargo, setCargo] = useState(usuario.cargo ?? '')
  const [empresa, setEmpresa] = useState(usuario.empresa ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await updateUser(usuario.id, { email, name, cargo, empresa }); onGuardado() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Editar usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Cargo (opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        {/* Cambiar el correo no cierra su sesión —van por id— pero a partir de ahora entra con el nuevo. */}
        <p className="text-[11px] text-slate-400">Si cambias el correo, avísale: es con el que iniciará sesión.</p>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: verificación completa, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: la suite en verde. Línea base 707 passed | 2 skipped más los 2 tests de las tareas 1-2; anotar el número real.
2. `npm run typecheck` — Expected: limpio, exit 0.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**. Si sale un warning menos, probablemente sea porque `editarCampo` usaba algo que ya no está: comprobar que la bajada es por el borrado y no por otra cosa.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 6: commit y push**

```bash
git add apps/desk/src/api/client.ts apps/desk/src/components/UsersAdmin.tsx docs/superpowers/plans/2026-08-12-editar-usuario.md
git commit -m "feat(desk): ventana para editar usuarios

El nombre no se podía cambiar desde ninguna pantalla y el correo no lo
aceptaba el servidor: una errata al dar de alta se quedaba para
siempre. Cargo y empresa dejan los prompt() del navegador y se editan
aquí, en la misma ventana.

No toca Admin, Activo ni Rol: ya tienen su control en la fila.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 7: pedir la prueba manual al usuario (tras desplegar)**

1. Editar el nombre y el cargo de alguien → la tabla los muestra al cerrar.
2. Corregir un correo → la persona aparece con el nuevo y puede entrar con él.
3. **Guardar sin tocar el correo → debe funcionar**, no dar 409.
4. Poner el correo de otro usuario → 409 con mensaje claro.
5. Cargo y empresa ya no se editan pinchando en la celda.
