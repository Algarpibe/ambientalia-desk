# Cargo y empresa en el alta de usuario — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el formulario «Nuevo usuario» acepte cargo y empresa en el mismo alta, porque son los datos con los que el usuario firma el documento de remisión.

**Architecture:** a diferencia del rol (que era solo frontend), aquí el servidor no acepta los campos: `createUser` no los incluye en el INSERT y `POST /api/users` no los lee. Tres capas en orden TDD: repo (`users.ts`), ruta (`routes.ts`) y formulario (`client.ts` + `UsersAdmin.tsx`). La normalización (`trim()`, vacío → NULL) vive en el servidor con la misma regla que ya usa el PATCH; el cliente manda el texto tal cual. Spec: `docs/superpowers/specs/2026-08-12-cargo-empresa-en-alta-usuario-design.md`.

**Tech Stack:** Express 5 + pg-mem/vitest/supertest (server), React 19 + Tailwind (apps/desk, sin harness de componentes: el cableado se verifica con typecheck + lint + build + prueba manual).

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones siempre desde la raíz y en secuencia (nunca lint, test y build a la vez).

---

### Task 1: repo — `createUser` acepta cargo y empresa

**Files:**
- Modify: `apps/desk/server/auth/users.ts:34-45` (input e INSERT)
- Test: `apps/desk/server/auth/users.test.ts` (test nuevo tras el bloque de la línea 30)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/users.test.ts`, añadir dentro del `describe('users repo', ...)`, después del primer `it` (línea 30):

```ts
  it('createUser acepta cargo y empresa desde el alta', async () => {
    const u = await createUser(db, { email: 'alta@x.co', name: 'Alta', passwordHash: 'h', cargo: 'Técnico de campo', empresa: 'Ambientalia S.A.S.' })
    expect(u.cargo).toBe('Técnico de campo')
    expect(u.empresa).toBe('Ambientalia S.A.S.')
  })
```

(El default a NULL cuando no se mandan ya lo cubre el primer test del fichero.)

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: FAIL — `expected null to be 'Técnico de campo'` (esbuild no comprueba tipos: la propiedad extra se ignora y el INSERT actual no la escribe).

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/auth/users.ts`, reemplazar `createUser` (líneas 34-45) por:

```ts
export async function createUser(
  db: Queryable,
  input: { email: string; name: string; passwordHash: string; isAdmin?: boolean; roleId?: string | null; cargo?: string | null; empresa?: string | null },
): Promise<UserPublic> {
  const id = randomUUID()
  await db.query(
    `INSERT INTO users (id,email,name,password_hash,is_admin,active,role_id,cargo,empresa,updated_at)
     VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,now())`,
    [id, normalize(input.email), input.name, input.passwordHash, input.isAdmin ?? false, input.roleId ?? null, input.cargo ?? null, input.empresa ?? null],
  )
  return (await getUserById(db, id))!
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/users.test.ts`
Expected: PASS (7 tests del fichero en verde).

- [ ] **Step 5: mutar para comprobar que el test muerde**

En el array de parámetros del INSERT, cambiar `input.cargo ?? null` por `null`. Correr el test → debe FALLAR. Deshacer la mutación y correr otra vez → verde. Si la mutación sobrevive, el test está flojo: parar y arreglarlo antes de seguir.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/users.ts apps/desk/server/auth/users.test.ts
git commit -m "feat(desk): createUser acepta cargo y empresa

Cargo y empresa firman el documento de remisión, pero el INSERT del
alta no los escribía: solo se podían poner con un PATCH posterior.
Primer paso para pedirlos en el formulario de alta.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: ruta — `POST /api/users` lee cargo y empresa

**Files:**
- Modify: `apps/desk/server/auth/routes.ts:62-67` (bloque previo al `createUser`)
- Test: `apps/desk/server/auth/routes.test.ts` (test nuevo en el `describe('auth routes', ...)`, tras el de la línea 69)

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/auth/routes.test.ts`, añadir dentro del `describe('auth routes', ...)` después del test «correo duplicado → 409»:

```ts
  it('el alta acepta cargo y empresa; vacíos o espacios quedan NULL', async () => {
    await seedAdmin()
    const a = app()
    const cookie = (await request(a).post('/api/auth/login').send({ email: 'admin@x.co', password: 'password123' })).headers['set-cookie']
    const con = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 'c@x.co', name: 'C', password: 'password123', cargo: 'Técnico', empresa: 'Ambientalia S.A.S.' })
    expect(con.status).toBe(201)
    expect(con.body).toMatchObject({ cargo: 'Técnico', empresa: 'Ambientalia S.A.S.' })
    // El documento de remisión imprime estos campos: una cadena en blanco debe guardarse como NULL.
    const sin = await request(a).post('/api/users').set('Cookie', cookie).send({ email: 's@x.co', name: 'S', password: 'password123', cargo: '   ', empresa: '' })
    expect(sin.status).toBe(201)
    expect(sin.body.cargo).toBeNull()
    expect(sin.body.empresa).toBeNull()
  })
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: FAIL — `expected null to match object { cargo: 'Técnico', ... }` (la ruta ignora los campos del body).

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/auth/routes.ts`, reemplazar (líneas 62-67):

```ts
    let roleId: string | null = null
    if (req.body.roleId) {
      roleId = String(req.body.roleId)
      if (!(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
    }
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin), roleId })
```

por:

```ts
    let roleId: string | null = null
    if (req.body.roleId) {
      roleId = String(req.body.roleId)
      if (!(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
    }
    // Cargo y empresa firman el documento de remisión: vacío se guarda como NULL, no como cadena en blanco.
    const cargo = String(req.body.cargo ?? '').trim() || null
    const empresa = String(req.body.empresa ?? '').trim() || null
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin), roleId, cargo, empresa })
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/auth/routes.test.ts`
Expected: PASS (todos los tests del fichero en verde).

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar la normalización de cargo: `const cargo = String(req.body.cargo ?? '') || null` (sin `.trim()`). Correr el test → debe FALLAR en el caso de `'   '` (espacios). Deshacer y correr otra vez → verde. Si sobrevive, parar y reforzar el test.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/auth/routes.ts apps/desk/server/auth/routes.test.ts
git commit -m "feat(desk): el alta de usuario acepta cargo y empresa en el POST

Misma regla de normalización que el PATCH: trim y vacío a NULL, para
que el documento de remisión nunca imprima una cadena en blanco. La
puerta vive en el servidor; el formulario manda el texto tal cual.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: formulario — inputs de cargo y empresa

**Files:**
- Modify: `apps/desk/src/api/client.ts:107` (interfaz `NewUser`)
- Modify: `apps/desk/src/components/UsersAdmin.tsx` (componente `CreateUser`)

- [ ] **Step 1: ampliar la interfaz `NewUser`**

En `apps/desk/src/api/client.ts`, línea 107, reemplazar:

```ts
export interface NewUser { email: string; name: string; password: string; isAdmin: boolean; roleId: string | null }
```

por:

```ts
export interface NewUser { email: string; name: string; password: string; isAdmin: boolean; roleId: string | null; cargo: string; empresa: string }
```

(`string`, no `string | null`: el cliente manda el texto tal cual y el servidor normaliza a NULL.)

- [ ] **Step 2: estados e inputs en `CreateUser`**

En `apps/desk/src/components/UsersAdmin.tsx`, dentro de `CreateUser`:

Tras la línea `const [password, setPassword] = useState('')`, añadir:

```tsx
  // Empresa prellenada: casi todos los usuarios son personal de Ambientalia; quien no, la sobreescribe.
  const [cargo, setCargo] = useState('')
  const [empresa, setEmpresa] = useState('Ambientalia S.A.S.')
```

En el `submit`, reemplazar:

```tsx
    try { await createUser({ email, name, password, isAdmin, roleId: isAdmin ? null : roleId || null }); onCreated() }
```

por:

```tsx
    try { await createUser({ email, name, password, isAdmin, roleId: isAdmin ? null : roleId || null, cargo, empresa }); onCreated() }
```

En el JSX, entre el input de «Nombre» y el de «Contraseña inicial (mín. 8)», añadir:

```tsx
        <input type="text" placeholder="Cargo (opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
```

Orden final del formulario: Correo, Nombre, Cargo, Empresa, Contraseña, Rol, Administrador.

- [ ] **Step 3: verificación completa, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: la suite entera en verde: 689 passed | 2 skipped (los 687 de línea base + los 2 de las Tasks 1-2).
2. `npm run typecheck` — Expected: limpio, exit 0.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**. Un warning de diferencia es regresión: parar y mirar.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 4: commit y push**

```bash
git add apps/desk/src/api/client.ts apps/desk/src/components/UsersAdmin.tsx docs/superpowers/plans/2026-08-12-cargo-empresa-en-alta-usuario.md
git commit -m "feat(desk): cargo y empresa se piden en el alta de usuario

Sin esto, un usuario recién creado que firmara una remisión antes de
que alguien le editara los campos en la tabla firmaba en blanco.
Empresa arranca prellenada con «Ambientalia S.A.S.» (editable), por
decisión del usuario: es el caso común.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 5: pedir la prueba manual al usuario (tras desplegar)**

1. Crear un usuario con cargo y empresa → la tabla los muestra.
2. Crear borrando la empresa prellenada → queda «Sin definir» (NULL, no cadena vacía).
3. Una remisión firmada por el usuario nuevo imprime su cargo y empresa.
