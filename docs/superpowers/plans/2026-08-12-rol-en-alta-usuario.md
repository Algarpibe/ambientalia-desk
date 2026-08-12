# Rol en el alta de usuario — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el formulario «Nuevo usuario» permita asignar el rol en el mismo alta, sin segundo paso en la tabla.

**Architecture:** cambio solo de frontend en dos ficheros — el servidor ya acepta y valida `roleId` en `POST /api/users` (con test propio en `apps/desk/server/auth/routes.test.ts`). Se añade `roleId` a la interfaz `NewUser` del cliente y un `<select>` al formulario `CreateUser`, que se desactiva al marcar Administrador (mismo comportamiento que la celda de rol de la tabla). Spec: `docs/superpowers/specs/2026-08-12-rol-en-alta-usuario-design.md`.

**Tech Stack:** React 19 + Tailwind (apps/desk). Sin harness de componentes (no hay jsdom): el cableado se verifica con typecheck + lint + build y prueba manual del usuario — es la convención del proyecto para cambios de puro cableado, y por eso este plan no lleva pasos de TDD.

---

### Task 1: desplegable de rol en el formulario de alta

**Files:**
- Modify: `apps/desk/src/api/client.ts:107` (interfaz `NewUser`)
- Modify: `apps/desk/src/components/UsersAdmin.tsx:93` (paso de prop) y `:98-129` (componente `CreateUser`)

- [ ] **Step 1: añadir `roleId` a la interfaz `NewUser`**

En `apps/desk/src/api/client.ts`, línea 107, reemplazar:

```ts
export interface NewUser { email: string; name: string; password: string; isAdmin: boolean }
```

por:

```ts
export interface NewUser { email: string; name: string; password: string; isAdmin: boolean; roleId: string | null }
```

`createUser` no cambia: ya hace `body: JSON.stringify(input)`, así que el campo viaja solo. El servidor trata `null` y `''` como «sin rol» (`if (req.body.roleId)` en `apps/desk/server/auth/routes.ts:63`), pero el cliente manda `null` explícito para que la intención quede en el tipo.

- [ ] **Step 2: pasar los roles al formulario y añadir el desplegable**

En `apps/desk/src/components/UsersAdmin.tsx`, línea 93, reemplazar:

```tsx
      {creating && <CreateUser onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
```

por:

```tsx
      {creating && <CreateUser roles={roles} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
```

(`roles` ya está cargado en el estado de `UsersAdmin` desde el `useEffect` de la línea 10; no hay carga nueva.)

En el mismo fichero, reemplazar el componente `CreateUser` completo (líneas 98-129) por:

```tsx
function CreateUser({ roles, onClose, onCreated }: { roles: Role[]; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    // Un admin nunca lleva rol (lo cortocircuita): se descarta aunque se hubiera elegido antes de marcar la casilla.
    try { await createUser({ email, name, password, isAdmin, roleId: isAdmin ? null : roleId || null }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="password" placeholder="Contraseña inicial (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="border border-slate-200 rounded p-2 text-[13px]" />
        {isAdmin ? (
          <select disabled className="border border-slate-200 rounded p-2 text-[13px] bg-slate-50 text-slate-400">
            <option>Acceso total (Admin)</option>
          </select>
        ) : (
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]">
            <option value="">— Sin rol —</option>
            {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Administrador</label>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
```

Cambios respecto al original: prop `roles: Role[]` (el tipo `Role` ya está importado en la línea 3), estado `roleId` (`''` = sin rol), el bloque del `<select>` entre la contraseña y la casilla, y el `roleId: isAdmin ? null : roleId || null` en el `createUser`. Todo lo demás queda byte a byte igual.

- [ ] **Step 3: typecheck**

Run (desde la raíz): `npm run typecheck`
Expected: sale limpio, exit 0.

- [ ] **Step 4: lint**

Run (desde la raíz): `npm run lint`
Expected: **0 errores y 158 warnings EXACTOS** (la línea base). Un warning más o menos es regresión: parar y mirar.

- [ ] **Step 5: build**

Run (desde la raíz): `npm run build`
Expected: build de Vite termina sin errores.

⚠️ No lanzar lint, test y build a la vez (los tests de hubSync fallan bajo carga); estos pasos van en secuencia. No hace falta correr la suite: no se toca ningún fichero que los tests importen.

- [ ] **Step 6: commit y push**

```bash
git add apps/desk/src/api/client.ts apps/desk/src/components/UsersAdmin.tsx docs/superpowers/plans/2026-08-12-rol-en-alta-usuario.md
git commit -m "feat(desk): asignar el rol en el mismo alta del usuario

Crear un usuario eran dos pasos y el segundo (buscarlo en la tabla
para darle rol) se olvidaba porque nada lo pedía; mientras tanto el
usuario no podía ejecutar transiciones ni responder correo. El
servidor ya aceptaba roleId en el POST: esto solo añade el desplegable
al formulario. Con Administrador marcado se desactiva y se manda
roleId null — un admin nunca lleva rol residual, igual que en la
tabla.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 7: pedir la prueba manual al usuario (tras desplegar)**

1. Crear un usuario eligiendo rol → aparece en la tabla con ese rol.
2. Marcar Administrador → el select se desactiva con «Acceso total (Admin)»; el usuario creado queda admin y sin rol.
3. Crear sin tocar el desplegable → usuario sin rol, como hasta ahora.
