# Avisos por correo — plan de implementación (entrega 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que los avisos que hoy solo aparecen en la campana lleguen además por correo, enviados desde `comercial@ambientalia.com.co`.

**Architecture:** la entrega 1 ya calcula **a quién** avisar y lo persiste en `avisos`. Esto solo añade el canal: un `avisosWebhook.ts` calcado de `remisionWebhook.ts` (config vacía = no-op explícito, `fetch` inyectable, nunca tumba la transición), un sello `enviado_at` para que la tabla sea de verdad la cola que su propio comentario dice que es, y un flujo n8n **nuevo** con un nodo Gmail. Spec: `docs/superpowers/specs/2026-08-12-avisos-por-correo-design.md`.

**Tech Stack:** Express 5 + pg-mem/vitest/supertest; n8n (flujo nuevo, sin tocar los existentes).

**Regla del proyecto:** tras ver pasar cada test nuevo, mutar la implementación para comprobar que el test muerde, y deshacer la mutación. Verificaciones desde la raíz y en secuencia.

## Dos decisiones que se apartan del spec, y por qué

1. **El envío se espera, no es «fire and forget».** El spec decía disparar sin esperar. Al implementarlo hay dos razones para esperar: `enviado_at` solo puede sellarse si se conoce el resultado, y una promesa suelta hace el test no determinista. Se espera **con `AbortSignal.timeout(5000)`**, para que un n8n colgado no cuelgue la transición, y **el fallo nunca se propaga**: se registra y ya. La transición está escrita mucho antes de llegar aquí.

2. **El correo enlaza a la aplicación, no al ticket.** La interfaz **no tiene enrutador** —los tickets se abren en un panel, no en una URL— así que un enlace profundo no resolvería. Se manda `APP_BASE_URL` y el correo dice «ábrelo en Desk». Cuando la aplicación tenga rutas, el enlace mejora sin tocar n8n.

⚠️ **No tocar `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`, producción) ni `_Desk` (`BpLlnPAfjpHaoeKA`, activo y en uso real).** El flujo de avisos es NUEVO.

---

### Task 1: las tres variables de configuración

**Files:**
- Modify: `packages/zoho-sync/src/config.ts` (interfaz y cargador)
- Modify: `.env.example`

- [ ] **Step 1: la interfaz**

En `packages/zoho-sync/src/config.ts`, junto a las tres de remisión (líneas 42-47), añadir:

```ts
  /** Webhook de n8n que manda los avisos por correo. Vacío = no se manda nada (la campana sigue igual). */
  avisosWebhookUrl: string
  /** Valor de la cabecera `X-Avisos-Token` que exige ese webhook. */
  avisosWebhookToken: string
  /** URL pública de la aplicación, para que el correo pueda enlazarla. Vacío = el correo no lleva enlace. */
  appBaseUrl: string
```

- [ ] **Step 2: el cargador**

En la misma función, junto a `remisionCallbackToken` (línea 101):

```ts
    avisosWebhookUrl: env.N8N_AVISOS_WEBHOOK_URL || '',
    avisosWebhookToken: env.N8N_AVISOS_TOKEN || '',
    appBaseUrl: env.APP_BASE_URL || '',
```

- [ ] **Step 3: documentarlas**

En `.env.example`, junto a las de remisión, con placeholders (nunca valores reales):

```
# Avisos por correo (flujo n8n propio, distinto del de remisiones). Vacio = no se manda correo.
N8N_AVISOS_WEBHOOK_URL=
N8N_AVISOS_TOKEN=
# URL publica de la app, para el enlace del correo
APP_BASE_URL=
```

- [ ] **Step 4: comprobar que compila**

Run: `npm run typecheck`
Expected: limpio, exit 0. (Sin tests: son tres campos de configuración con default vacío.)

- [ ] **Step 5: commit**

```bash
git add packages/zoho-sync/src/config.ts .env.example
git commit -m "feat(desk): configuración del canal de avisos por correo

Tres variables con default vacío: sin ellas no se manda nada y la
campana sigue funcionando igual.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `avisosWebhook.ts`

**Files:**
- Create: `apps/desk/server/avisosWebhook.ts`
- Test: `apps/desk/server/avisosWebhook.test.ts`

- [ ] **Step 1: escribir el test que falla**

Crear `apps/desk/server/avisosWebhook.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { dispararAvisos, type AvisoParaEnviar } from './avisosWebhook'
import type { AppConfig } from '@ambientalia/zoho-sync/config'

const config = (o: Partial<AppConfig> = {}) =>
  ({ avisosWebhookUrl: 'https://n8n/webhook/avisos', avisosWebhookToken: 'tok', appBaseUrl: 'https://desk.example', ...o }) as AppConfig

const uno: AvisoParaEnviar[] = [
  { id: 'avi-1', email: 'ana@x.co', nombre: 'Ana', texto: 'Beto te derivó el ticket #12 en «Aprobación»', ticketNumero: 12 },
]

describe('dispararAvisos', () => {
  it('manda los avisos con el token, el asunto y el enlace a la aplicación', async () => {
    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const r = await dispararAvisos(config(), uno, fake)

    expect(r.disparado).toBe(true)
    const [url, init] = fake.mock.calls[0]
    expect(url).toBe('https://n8n/webhook/avisos')
    expect((init.headers as Record<string, string>)['X-Avisos-Token']).toBe('tok')
    const body = JSON.parse(init.body as string)
    expect(body.avisos[0]).toMatchObject({
      id: 'avi-1', email: 'ana@x.co', nombre: 'Ana',
      asunto: 'Ticket #12 · Desk Ambientalia',
      url: 'https://desk.example',
    })
  })

  // Sin URL configurada no se manda nada Y NO SE LLAMA a fetch: es el estado de «canal apagado»,
  // legítimo, no un fallo. La campana sigue avisando igual.
  it('sin webhook configurado no llama a nadie y lo dice', async () => {
    const fake = vi.fn()
    const r = await dispararAvisos(config({ avisosWebhookUrl: '' }), uno, fake)
    expect(r).toEqual({ disparado: false, motivo: 'N8N_AVISOS_WEBHOOK_URL sin configurar' })
    expect(fake).not.toHaveBeenCalled()
  })

  // Una lista vacía tampoco molesta a n8n: la mayoría de transiciones no generan ningún aviso.
  it('sin avisos que mandar no llama a nadie', async () => {
    const fake = vi.fn()
    expect((await dispararAvisos(config(), [], fake)).disparado).toBe(false)
    expect(fake).not.toHaveBeenCalled()
  })

  it('un n8n caído devuelve el motivo en vez de lanzar', async () => {
    const fake = vi.fn().mockRejectedValue(Object.assign(new Error('fetch failed'), { cause: new Error('ECONNREFUSED') }))
    const r = await dispararAvisos(config(), uno, fake)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toMatch(/ECONNREFUSED/)
  })

  it('un n8n que responde mal devuelve el estado', async () => {
    const fake = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }))
    const r = await dispararAvisos(config(), uno, fake)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toMatch(/500/)
  })
})
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/avisosWebhook.test.ts`
Expected: FAIL — no se puede resolver `./avisosWebhook`.

- [ ] **Step 3: implementación mínima**

Crear `apps/desk/server/avisosWebhook.ts`:

```ts
import type { AppConfig } from '@ambientalia/zoho-sync/config'

/** Un aviso ya persistido, listo para salir por correo. */
export interface AvisoParaEnviar {
  id: string
  email: string
  nombre: string
  texto: string
  ticketNumero: number
}

/**
 * Manda los avisos a n8n, que los reparte por correo.
 *
 * Calcado de `dispararRemision`, con las mismas tres reglas: `fetch` inyectable para los tests, config
 * vacía = no-op explícito con motivo, y **nunca lanza** — devuelve el motivo. Quien lo llama está justo
 * detrás de una transición ya escrita, y un problema de red no puede deshacerla.
 *
 * El asunto y el enlace se arman AQUÍ y no en n8n: el flujo debe ser tonto (recibir y enviar), para que
 * cambiar la redacción sea un cambio de código con test y no una edición a mano en una interfaz web.
 *
 * `AbortSignal.timeout` acota la espera: sin él, un n8n colgado colgaría la respuesta de la transición,
 * que es una acción de una persona esperando delante de la pantalla.
 */
export async function dispararAvisos(
  config: AppConfig,
  avisos: AvisoParaEnviar[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ disparado: boolean; motivo?: string }> {
  if (!config.avisosWebhookUrl) return { disparado: false, motivo: 'N8N_AVISOS_WEBHOOK_URL sin configurar' }
  if (avisos.length === 0) return { disparado: false, motivo: 'sin avisos que mandar' }
  const payload = {
    avisos: avisos.map((a) => ({
      id: a.id,
      email: a.email,
      nombre: a.nombre,
      asunto: `Ticket #${a.ticketNumero} · Desk Ambientalia`,
      texto: a.texto,
      url: config.appBaseUrl,
    })),
  }
  let res: Response
  try {
    res = await fetchImpl(config.avisosWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Avisos-Token': config.avisosWebhookToken },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) {
    // El `fetch` de Node casi siempre rechaza con "fetch failed" y guarda el detalle real en `cause`.
    const mensaje = e instanceof Error ? e.message : String(e)
    const causa = e instanceof Error && e.cause ? `: ${e.cause instanceof Error ? e.cause.message : String(e.cause)}` : ''
    return { disparado: false, motivo: `no se pudo contactar con n8n: ${mensaje}${causa}` }
  }
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    return { disparado: false, motivo: `n8n respondió ${res.status}: ${detalle.slice(0, 200)}` }
  }
  return { disparado: true }
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/avisosWebhook.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar la cabecera `'X-Avisos-Token'` del `headers`. Correr → debe FALLAR el primer test. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/avisosWebhook.ts apps/desk/server/avisosWebhook.test.ts
git commit -m "feat(desk): disparador de avisos por correo hacia n8n

Calcado de dispararRemision: fetch inyectable, config vacía = no-op
explícito, y nunca lanza. El asunto y el enlace se arman aquí para que
el flujo de n8n sea tonto y la redacción tenga test.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: sellar `enviado_at`

**Files:**
- Modify: `apps/desk/server/db/avisos.ts` (función nueva)
- Test: `apps/desk/server/db/avisos.test.ts`

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/db/avisos.test.ts`, dentro del `describe('avisos', …)`:

```ts
  // `enviado_at` es lo que convierte esta tabla en la cola que su propio comentario dice que es: lo
  // que sigue en NULL es lo que no salió, y mañana es la lista de reintento.
  it('marca los avisos como enviados sin tocar los demás', async () => {
    const a = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'A' })
    const b = await crearAviso(db, { userId: 'u-1', ticketId: 't1', texto: 'B' })

    await marcarEnviados(db, [a])

    const enviados = await db.query('SELECT id FROM avisos WHERE enviado_at IS NOT NULL')
    expect((enviados.rows as Array<{ id: string }>).map((r) => r.id)).toEqual([a])
    const pendientes = await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')
    expect((pendientes.rows as Array<{ id: string }>).map((r) => r.id)).toEqual([b])
  })
```

Añadir `marcarEnviados` al import de `./avisos` en la cabecera.

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/db/avisos.test.ts`
Expected: FAIL — `marcarEnviados is not a function`.

- [ ] **Step 3: implementación mínima**

En `apps/desk/server/db/avisos.ts`, junto a `marcarLeidos`:

```ts
/** Sella el despacho del correo. Lo que se queda en NULL es la cola de reintento del día de mañana. */
export async function marcarEnviados(db: Queryable, ids: string[]): Promise<void> {
  // De uno en uno y no con `ANY($1)`, por lo mismo que `marcarLeidos`: pg-mem no tipa los arrays.
  for (const id of ids) {
    await db.query('UPDATE avisos SET enviado_at = now() WHERE id = $1', [id])
  }
}
```

- [ ] **Step 4: verlo pasar**

Run: `npm test -- apps/desk/server/db/avisos.test.ts`
Expected: PASS.

- [ ] **Step 5: mutar para comprobar que el test muerde**

Quitar el `WHERE id = $1` (dejar `UPDATE avisos SET enviado_at = now()`). Correr → debe FALLAR: el aviso `b` también quedaría sellado. Deshacer y correr otra vez → verde.

- [ ] **Step 6: commit**

```bash
git add apps/desk/server/db/avisos.ts apps/desk/server/db/avisos.test.ts
git commit -m "feat(desk): sellar enviado_at al despachar el correo

Lo que queda en NULL es lo que no salió, que es la cola de reintento
que el comentario del esquema lleva prometiendo desde el principio.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: cablear el envío a la transición

**Files:**
- Modify: `apps/desk/server/services/ticketService.ts` (recoger los avisos creados y despacharlos)
- Modify: `apps/desk/server/routes/tickets.ts:153-155` (pasar `config`)
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: escribir el test que falla**

En `apps/desk/server/app.test.ts`, ampliar el tipo de `appWith` (línea 31) para admitir las claves nuevas:

```ts
function appWith(overrides: Partial<{ enableWrites: boolean; remisionCallbackToken: string; remisionWebhookUrl: string; avisosWebhookUrl: string; appBaseUrl: string }> = {}) {
  const config = { enableWrites: false, remisionWebhookUrl: '', remisionCallbackToken: '', avisosWebhookUrl: '', appBaseUrl: '', ...overrides } as AppConfig
```

Y añadir al final del fichero:

```ts
describe('avisos por correo', () => {
  it('la derivación manda el correo al derivado y sella enviado_at', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")

    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fake)
    try {
      const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos', appBaseUrl: 'https://desk.example' })
      const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
        .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
      expect(res.status).toBe(200)

      const body = JSON.parse(fake.mock.calls[0][1].body as string)
      expect(body.avisos).toHaveLength(1)
      expect(body.avisos[0]).toMatchObject({ email: 'dest@x.co', nombre: 'Destino', url: 'https://desk.example' })
      expect(body.avisos[0].texto).toMatch(/te derivó/)
    } finally {
      vi.unstubAllGlobals()
    }

    const sellados = await db.query('SELECT id FROM avisos WHERE enviado_at IS NOT NULL')
    expect(sellados.rows).toHaveLength(1)
  })

  // El canal apagado no puede romper nada: es el estado por defecto y el de cualquier despliegue que
  // aún no tenga el flujo montado.
  it('sin webhook configurado la transición funciona igual y el aviso queda sin sellar', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
    expect(res.status).toBe(200)

    expect((await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')).rows).toHaveLength(1)
  })

  // Un n8n caído NO puede tumbar una transición ya escrita: es el invariante de todo este canal.
  it('un n8n caído no rompe la transición', async () => {
    const dest = await createUser(db, { email: 'dest@x.co', name: 'Destino', passwordHash: 'h' })
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id, number, status, managed_by_app) VALUES ('t1', 10000, 'Ticket creado', true)")

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')))
    try {
      const { app } = appWith({ avisosWebhookUrl: 'https://n8n/webhook/avisos' })
      const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
        .send({ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-1', Serial: 'S1', derivado_a: dest.id } })
      expect(res.status).toBe(200)
    } finally {
      vi.unstubAllGlobals()
    }

    const t = await db.query('SELECT status FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { status: string }).status).toBe('Ingresado')
    expect((await db.query('SELECT id FROM avisos WHERE enviado_at IS NULL')).rows).toHaveLength(1)
  })
})
```

- [ ] **Step 2: verlo fallar**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: FAIL en el primer test — `fake.mock.calls[0]` es `undefined`: nadie llama al webhook.

- [ ] **Step 3: recoger los avisos en `executeTransition`**

En `apps/desk/server/services/ticketService.ts`:

Añadir a los imports:

```ts
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { dispararAvisos, type AvisoParaEnviar } from '../avisosWebhook'
import { crearAviso, destinatariosDeArea, marcarEnviados } from '../db/avisos'
import { logger } from '../util/logger'
```

(`crearAviso` y `destinatariosDeArea` ya están importados de `../db/avisos`: añadir solo `marcarEnviados`.)

Ampliar la firma con un quinto parámetro **opcional**:

```ts
export async function executeTransition(
  db: Queryable,
  id: string,
  body: unknown,
  user: { areas: string[]; isAdmin: boolean; name?: string; id?: string },
  config?: AppConfig,
): Promise<unknown> {
```

Es opcional a propósito: sin config no hay canal, que es exactamente lo que debe pasar en cualquier llamada que no venga de la ruta.

Declarar el acumulador justo **antes** del bloque del aviso de derivación:

```ts
  // Se acumulan aquí para mandarlos en UNA sola llamada a n8n: una transición puede generar el aviso
  // de derivación y varios de área, y un webhook por cabeza sería ruido de red por nada.
  const porCorreo: AvisoParaEnviar[] = []
```

En el bloque de la derivación, reemplazar:

```ts
    if (aviso) await crearAviso(db, { userId: aviso.userId, ticketId: id, texto: aviso.texto })
```

por:

```ts
    if (aviso) {
      const avisoId = await crearAviso(db, { userId: aviso.userId, ticketId: id, texto: aviso.texto })
      const dest = await getUserById(db, aviso.userId)
      if (dest) porCorreo.push({ id: avisoId, email: dest.email, nombre: dest.name, texto: aviso.texto, ticketNumero: Number(current.row.number) })
    }
```

En el bloque de área, reemplazar:

```ts
    for (const d of porPersona.values()) {
      await crearAviso(db, { userId: d.id, ticketId: id, texto })
    }
```

por:

```ts
    for (const d of porPersona.values()) {
      const avisoId = await crearAviso(db, { userId: d.id, ticketId: id, texto })
      porCorreo.push({ id: avisoId, email: d.email, nombre: d.name, texto, ticketNumero: Number(current.row.number) })
    }
```

⚠️ `porPersona` guarda hoy `{ id: string }`. Cambiar su tipo a `Map<string, { id: string; email: string; name: string }>` para conservar el correo, que es justo lo que `destinatariosDeArea` ya devuelve.

Y **antes** de `const updated = await getTicketWithRefs(db, id)`, el despacho:

```ts
  /*
   * El correo va al final y NUNCA puede tumbar la transición, que a estas alturas lleva rato escrita.
   * Se espera al resultado —en vez de soltarlo— porque `enviado_at` solo tiene sentido si se conoce, y
   * `dispararAvisos` ya acota la espera con su propio timeout. Lo que no se selle queda en NULL, que es
   * la cola de reintento.
   */
  if (config && porCorreo.length) {
    const r = await dispararAvisos(config, porCorreo)
    if (r.disparado) await marcarEnviados(db, porCorreo.map((a) => a.id))
    else logger.warn({ motivo: r.motivo, ticketId: id, avisos: porCorreo.length }, 'no se pudieron mandar los avisos por correo')
  }
```

- [ ] **Step 4: pasar `config` desde la ruta**

En `apps/desk/server/routes/tickets.ts`, reemplazar:

```ts
    res.json(await executeTransition(db, String(req.params.id), req.body, req.user!))
```

por:

```ts
    res.json(await executeTransition(db, String(req.params.id), req.body, req.user!, config))
```

- [ ] **Step 5: verlo pasar**

Run: `npm test -- apps/desk/server/app.test.ts`
Expected: PASS, todo el fichero en verde.

- [ ] **Step 6: mutar para comprobar que el test muerde**

Cambiar `if (r.disparado) await marcarEnviados(...)` por `await marcarEnviados(...)` sin condición. Correr → debe FALLAR el tercer test («un n8n caído no rompe la transición»), que espera el aviso **sin sellar** y lo encontraría sellado pese a no haber salido. Deshacer y correr otra vez → verde.

- [ ] **Step 7: commit**

```bash
git add apps/desk/server/services/ticketService.ts apps/desk/server/routes/tickets.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): la transición manda sus avisos por correo

Una sola llamada a n8n con todos los avisos de esa transición. El
fallo nunca se propaga: la transición está escrita mucho antes, y lo
que no se selle queda en NULL como cola de reintento.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: verificación completa

- [ ] **Step 1: los cuatro comandos, en secuencia**

Run (desde la raíz, uno tras otro, nunca a la vez):

1. `npm test` — Expected: la suite en verde. Línea base 714 passed | 2 skipped más los 9 tests nuevos; anotar el número real.
2. `npm run typecheck` — Expected: limpio, exit 0.
3. `npm run lint` — Expected: **0 errores y 158 warnings EXACTOS**.
4. `npm run build` — Expected: build de Vite sin errores.

- [ ] **Step 2: push**

```bash
git push
```

---

### Task 6: el flujo de n8n (con el usuario)

⚠️ **Esta tarea toca un sistema en producción. No crear nada sin confirmar antes con el usuario.**

- [ ] **Step 1: inventario previo**

Listar los flujos existentes y las credenciales de Gmail disponibles (herramientas MCP de n8n). Objetivo: **confirmar qué credencial de Gmail usa hoy el flujo de remisiones**, para reutilizar esa misma y no crear una nueva.

⚠️ No modificar `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) ni `_Desk` (`BpLlnPAfjpHaoeKA`).

- [ ] **Step 2: crear el flujo nuevo**

Flujo nuevo, tres nodos:

1. **Webhook** (POST, ruta `avisos-desk`): valida la cabecera `X-Avisos-Token` contra el valor acordado. Si no casa, responde 401.
2. **Split Out** sobre `avisos`: un elemento por destinatario.
3. **Gmail → Send**: remitente **`comercial@ambientalia.com.co`** (confirmado por el usuario), destinatario `{{ $json.email }}`, asunto `{{ $json.asunto }}`, cuerpo con `{{ $json.texto }}` y el enlace `{{ $json.url }}`.

El flujo **no decide nada**: Node ya manda el asunto, el texto y el enlace resueltos.

- [ ] **Step 3: probarlo antes de activarlo**

Ejecutarlo a mano con un payload de un solo aviso a una dirección propia, y comprobar que el correo llega desde `comercial@ambientalia.com.co`. Solo entonces activarlo.

- [ ] **Step 4: entregar las variables al usuario**

Darle los tres valores para EasyPanel (`N8N_AVISOS_WEBHOOK_URL`, `N8N_AVISOS_TOKEN`, `APP_BASE_URL`) y recordarle que **sin ellas el canal queda apagado** y la campana sigue funcionando exactamente igual.

- [ ] **Step 5: prueba manual del usuario (tras desplegar)**

1. Derivar un ticket a otra persona en una transición → esa persona recibe un correo desde `comercial@ambientalia.com.co`.
2. Derivarlo a la misma persona otra vez en la transición siguiente, sin tocar la casilla → **no** llega otro correo (la supresión de «la persona no cambia» es deliberada).
3. Con las variables sin configurar, ejecutar una transición → todo funciona y el aviso sigue en la campana.

⚠️ **Recordatorio del diagnóstico de hoy:** si ejecutas las transiciones con el usuario Administrador, los avisos **de área** no se generan —un administrador tiene las tres áreas y la regla resta las suyas—, así que tampoco habrá correo de área. Los de **derivación** sí. Si eso estorba en el uso real, la solución es cambiar `areasAAvisar` para restar las áreas de la transición en vez de las del usuario; es una decisión pendiente del usuario, no de este plan.
