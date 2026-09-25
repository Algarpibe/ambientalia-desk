# Desenlace de la remisión de entrada — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el estado de una remisión de entrada en Desk diga la verdad — `ok`, `ok_con_avisos` o `error` según lo que realmente hizo el flujo de n8n — y que el técnico lo vea en pantalla al enviarla.

**Architecture:** En n8n se mete una barrera (`Merge Colector Entrada`, 7 entradas) delante del callback y un `Code Resumen Entrada` que interroga por nombre a los 15 nodos falibles de la rama de entrada y clasifica el desenlace. Todo lo posterior al reparto pasa a `onError: continueRegularOutput` para que el colector siempre corra. En la app se añade `GET /api/remisiones/:id`, un cerrojo contra reenvíos duplicados, y un panel que sondea el desenlace tras enviar.

**Tech Stack:** TypeScript + tsx (sin build de servidor), Express 5, React 18 + Vite + Tailwind, vitest + pg-mem + supertest, n8n 2.21.7 vía MCP `n8n-mcp`.

**Diseño:** [`docs/superpowers/specs/2026-08-04-remision-entrada-desenlace-design.md`](../specs/2026-08-04-remision-entrada-desenlace-design.md)

⚠️ **`Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) es producción y NO se toca.** Todo el trabajo de n8n va sobre `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`). Verificar el id antes de **cada** escritura.

---

## Estructura de ficheros

| Fichero | Responsabilidad | Acción |
|---|---|---|
| `packages/shared/src/types.ts` | `RemisionResultado`: la forma del detalle que manda n8n | Modificar |
| `apps/desk/server/db/remisiones.ts` | `reiniciarRemision` para el reenvío | Modificar |
| `apps/desk/server/routes/remision.ts` | `GET /:id`, cerrojo y reinicio en `/enviar` | Modificar |
| `apps/desk/server/app.test.ts` | Tests de las dos rutas | Modificar |
| `apps/desk/src/api/client.ts` | `fetchRemision` | Modificar |
| `apps/desk/src/components/ResultadoRemision.tsx` | Panel de desenlace: sondeo, estados y reintento | **Crear** |
| `apps/desk/src/components/CrearRemision.tsx` | Ceder el control al panel tras enviar | Modificar |
| n8n `Remisiones_ST_3.13_Desk` | Colector, resumen y `onError` | Modificar |
| n8n `Errores_Ambientalia` | Alerta genérica de fallos | **Crear** |

Comandos del repo: `npm test` (vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

---

## Task 1: Tipar el resultado que manda n8n

Hoy `Remision.resultado` es `Record<string, unknown> | null`, así que la UI tendría que hacer castings a ciegas para leer los avisos. La forma la controlamos nosotros (la produce `Code Resumen Entrada`), así que puede tiparse.

**Files:**
- Modify: `packages/shared/src/types.ts:299-321`

- [ ] **Step 1: Añadir la interfaz y usarla en `Remision`**

En `packages/shared/src/types.ts`, justo antes de `export interface Remision`:

```ts
/** Un paso del flujo de n8n que no salió bien, ya redactado para enseñárselo al técnico. */
export interface RemisionPasoFallido { paso: string; mensaje?: string }

/**
 * Detalle que `Code Resumen Entrada` del flujo n8n adjunta al callback. Todos los campos son
 * opcionales a propósito: las remisiones anteriores a este cambio guardaron otra forma, y una
 * remisión vieja no debe romper la pantalla que la muestra.
 */
export interface RemisionResultado {
  carpetaId?: string | null
  carpetaUrl?: string | null
  docId?: string | null
  pdfId?: string | null
  fotos?: { recibidas: number; subidas: number }
  avisos?: RemisionPasoFallido[]
  fallos?: RemisionPasoFallido[]
  ejecucionId?: string | null
}
```

Y en `export interface Remision`, cambiar la línea:

```ts
  resultado: Record<string, unknown> | null
```

por:

```ts
  resultado: RemisionResultado | null
```

- [ ] **Step 2: Ajustar el mapper para que compile**

En `apps/desk/server/db/remisiones.ts:17`, cambiar:

```ts
    resultado: typeof r.resultado === 'string' ? JSON.parse(r.resultado) : ((r.resultado as Record<string, unknown>) ?? null),
```

por:

```ts
    resultado: typeof r.resultado === 'string' ? JSON.parse(r.resultado) : ((r.resultado as Remision['resultado']) ?? null),
```

- [ ] **Step 3: Verificar que compila y los tests siguen verdes**

Run: `npm run typecheck && npm test`
Expected: typecheck sin errores; los 326 tests siguen pasando (2 skipped).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types.ts apps/desk/server/db/remisiones.ts
git commit -m "refactor(shared): tipar el resultado que n8n adjunta a la remision"
```

---

## Task 2: `GET /api/remisiones/:id`

Es lo que sondeará el formulario. **Ojo al orden de rutas:** `/:id` capturaría `/api/remisiones/nueva` si se registrara antes, así que va después. La regresión ya está cubierta: el bloque `describe('GET /api/remisiones/nueva')` que ya existe fallaría si se coloca mal.

**Files:**
- Modify: `apps/desk/server/routes/remision.ts:66-71` (justo después del listado)
- Test: `apps/desk/server/app.test.ts` (dentro del `describe('POST /api/remisiones')` existente, que ya agrupa todas las rutas de remisiones y tiene el helper `preparar`)

- [ ] **Step 1: Escribir el test que falla**

Añadir en `apps/desk/server/app.test.ts`, dentro de `describe('POST /api/remisiones', …)`, después del test `'sube fotos, las lista sin el base64 y las sirve con nosniff'`:

```ts
  // El formulario sondea esta ruta tras enviar, esperando el desenlace que escribirá el callback.
  it('GET /:id devuelve la remisión con sus fotos; 404 si no existe; 401 sin sesión', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    const id = rem.body.id
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
      .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

    const res = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, estado: 'pendiente', incluye: ['Manuales'] })
    expect(res.body.fotos).toHaveLength(1)
    expect(res.body.fotos[0].contentB64).toBeUndefined() // el listado nunca lleva el base64

    expect((await request(app).get('/api/remisiones/rem-nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/remisiones/${id}`)).status).toBe(401)
  })
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- app.test.ts -t "GET /:id devuelve la remisión"`
Expected: FAIL — la ruta no existe, así que Express contesta 404 y `expect(res.status).toBe(200)` falla.

- [ ] **Step 3: Implementar la ruta**

En `apps/desk/server/routes/remision.ts`, justo **después** del bloque `app.get('/api/remisiones', …)` (línea ~71) y **antes** de `app.post('/api/remisiones', …)`:

```ts
  /**
   * Una remisión con sus fotos. La sondea el formulario mientras espera el desenlace de n8n, que
   * llega por el callback y puede tardar decenas de segundos.
   *
   * Va DESPUÉS de `/api/remisiones/nueva`: registrada antes, `:id` se tragaría esa ruta.
   */
  app.get('/api/remisiones/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const r = await getRemision(db, String(req.params.id))
    if (!r) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    res.json({ ...r, fotos: await listFotos(db, r.id) })
  }))
```

- [ ] **Step 4: Ejecutar la suite completa**

Run: `npm test -- app.test.ts`
Expected: PASS, incluidos los cuatro tests de `GET /api/remisiones/nueva` (si `/:id` se hubiera colocado mal, esos serían los que fallarían).

- [ ] **Step 5: Commit**

```bash
git add apps/desk/server/routes/remision.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): endpoint para consultar una remision con sus fotos"
```

---

## Task 3: Cerrojo de reenvío y vuelta a `pendiente`

Sin el cerrojo, el botón de reintentar de la Task 6 permitiría generar un segundo documento y una segunda carpeta en Drive para el mismo equipo. Y sin el reinicio, el sondeo leería el `error` del intento anterior y daría por fracasado un envío recién empezado.

**Files:**
- Modify: `apps/desk/server/db/remisiones.ts` (nueva función tras `setResultadoRemision`)
- Modify: `apps/desk/server/routes/remision.ts:118-138` (`POST /:id/enviar`)
- Test: `apps/desk/server/app.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Añadir en `apps/desk/server/app.test.ts`, dentro del mismo `describe('POST /api/remisiones', …)`:

```ts
  // Reenviar una remisión ya cerrada crearía un segundo documento y una segunda carpeta en Drive para
  // el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
  it('no reenvía una remisión ya cerrada; reenviar una fallida la devuelve a pendiente', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada', remisionCallbackToken: 'secreto-cb' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const callback = (body: unknown) => request(app).post(`/api/remisiones/${id}/callback`)
        .set('X-Remision-Callback', 'secreto-cb').send(body)
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      await callback({ estado: 'ok' })
      expect((await enviar()).status).toBe(409)

      await callback({ estado: 'ok_con_avisos', resultado: { avisos: [{ paso: 'el correo al técnico' }] } })
      expect((await enviar()).status).toBe(409) // con avisos también cuenta como cerrada
      // El detalle que manda n8n se guarda entero: es lo que el panel enseña al técnico.
      const conAvisos = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(conAvisos.body.resultado.avisos).toEqual([{ paso: 'el correo al técnico' }])

      await callback({ estado: 'error', resultado: { fallos: [{ paso: 'el PDF de la remisión' }] } })
      expect((await enviar()).status).toBe(200)
      const tras = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(tras.body.estado).toBe('pendiente')
      expect(tras.body.resultado).toBeNull() // el detalle del intento anterior no se queda pegado
    } finally { vi.unstubAllGlobals() }
  })
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npm test -- app.test.ts -t "no reenvía una remisión ya cerrada"`
Expected: FAIL — hoy `/enviar` responde 200 siempre, así que el primer `expect(...).toBe(409)` falla con 200.

- [ ] **Step 3: Añadir `reiniciarRemision` en la capa de datos**

En `apps/desk/server/db/remisiones.ts`, justo después de `setResultadoRemision`:

```ts
/**
 * Devuelve la remisión a `pendiente` antes de un reenvío. El estado se escribe en literal y no como
 * parámetro porque pg-mem no tipa bien los `$n` en `SET`, y estos tests corren sobre pg-mem.
 */
export async function reiniciarRemision(db: Queryable, id: string): Promise<void> {
  await db.query("UPDATE remisiones SET estado = 'pendiente', resultado = NULL, resuelto_at = NULL WHERE id = $1", [id])
}
```

- [ ] **Step 4: Aplicar el cerrojo y el reinicio en la ruta**

En `apps/desk/server/routes/remision.ts`, ampliar el import de la línea 9 con `reiniciarRemision`:

```ts
import { createRemision, getRemision, listRemisionesByTicket, addFoto, listFotos, getFotoContent, setResultadoRemision, listFotosConContenido, reiniciarRemision } from '../db/remisiones'
```

Y dentro de `app.post('/api/remisiones/:id/enviar', …)`, sustituir:

```ts
    const rem = await getRemision(db, id)
    if (!rem) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
```

por:

```ts
    const rem = await getRemision(db, id)
    if (!rem) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    // Reenviar una remisión ya cerrada generaría un segundo documento y una segunda carpeta en Drive
    // para el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
    if (rem.estado === 'ok' || rem.estado === 'ok_con_avisos') {
      res.status(409).json({ error: 'Esta remisión ya se envió' }); return
    }
    // El formulario sondea el estado: si quedara el `error` del intento anterior, daría por fracasado
    // un envío que acaba de empezar.
    if (rem.estado === 'error') await reiniciarRemision(db, id)
```

- [ ] **Step 5: Ejecutar la suite completa**

Run: `npm test -- app.test.ts`
Expected: PASS. En particular sigue pasando `'enviar manda las fotos en base64 dentro del payload'`, que envía desde `pendiente`.

- [ ] **Step 6: Commit**

```bash
git add apps/desk/server/db/remisiones.ts apps/desk/server/routes/remision.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): impedir reenviar una remision ya cerrada y reiniciar la fallida"
```

---

## Task 4: `fetchRemision` en el cliente de API

**Files:**
- Modify: `apps/desk/src/api/client.ts:277-281` (junto a `fetchRemisiones`, que ya define `RemisionConFotos`)

- [ ] **Step 1: Añadir la función**

En `apps/desk/src/api/client.ts`, justo después de `fetchRemisiones`:

```ts
/** Una remisión concreta con sus fotos. La usa el sondeo que espera el desenlace de n8n tras enviar. */
export function fetchRemision(id: string): Promise<RemisionConFotos> {
  return fetch(`/api/remisiones/${encodeURIComponent(id)}`, { credentials: 'include' }).then((r) => json<RemisionConFotos>(r))
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run typecheck`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/desk/src/api/client.ts
git commit -m "feat(desk): cliente para consultar una remision concreta"
```

---

## Task 5: El panel de resultado

Fichero propio porque `CrearRemision.tsx` ya son 138 líneas de formulario y esto es otra responsabilidad: sondear, interpretar el desenlace y reintentar.

**No hay harness de componentes React en el repo (sin jsdom), así que aquí no hay test.** Se verifica con `typecheck` + `lint` + `build` y con la prueba real de la Task 10.

**Files:**
- Create: `apps/desk/src/components/ResultadoRemision.tsx`

- [ ] **Step 1: Crear el componente completo**

```tsx
import { useEffect, useRef, useState } from 'react'
import { fetchRemision, enviarRemision, type RemisionConFotos } from '../api/client'

const INTERVALO_MS = 2000
const ESPERA_MAX_MS = 60000

/**
 * Desenlace de una remisión recién enviada.
 *
 * El resultado real lo escribe n8n por el callback, decenas de segundos después de que el técnico
 * termine, así que esta pantalla sondea `GET /api/remisiones/:id` en vez de esperar a la respuesta
 * del envío. El estado ya está guardado en Postgres: cerrar el panel no pierde nada, y por eso el
 * sondeo se corta al desmontar.
 *
 * `errorEnvio` es el fallo del disparo inicial, si lo hubo. En ese caso no se sondea nada — el
 * desenlace no va a llegar nunca — y se ofrece reintentar de inmediato en vez de esperar el minuto.
 */
export function ResultadoRemision({ remisionId, errorEnvio, onCerrar }: {
  remisionId: string
  errorEnvio?: string | null
  onCerrar: () => void
}) {
  const [rem, setRem] = useState<RemisionConFotos | null>(null)
  const [err, setErr] = useState<string | null>(errorEnvio ?? null)
  const [envioFallido, setEnvioFallido] = useState(!!errorEnvio)
  const [agotado, setAgotado] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [intento, setIntento] = useState(0)
  const desde = useRef(Date.now())

  useEffect(() => {
    if (envioFallido) return
    let vivo = true
    let temporizador: ReturnType<typeof setTimeout> | undefined
    async function mirar() {
      try {
        const r = await fetchRemision(remisionId)
        if (!vivo) return
        setRem(r)
        if (r.estado !== 'pendiente') return // ya hay desenlace: se deja de sondear
        if (Date.now() - desde.current >= ESPERA_MAX_MS) { setAgotado(true); return }
      } catch (e) {
        if (!vivo) return
        setErr(e instanceof Error ? e.message : String(e))
        return
      }
      temporizador = setTimeout(mirar, INTERVALO_MS)
    }
    void mirar()
    return () => { vivo = false; if (temporizador) clearTimeout(temporizador) }
  }, [remisionId, intento, envioFallido])

  async function reintentar() {
    setReintentando(true); setErr(null); setAgotado(false)
    try {
      await enviarRemision(remisionId)
      desde.current = Date.now()
      setEnvioFallido(false)
      setIntento((n) => n + 1) // relanza el efecto y con él el sondeo
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setEnvioFallido(true)
    } finally {
      setReintentando(false)
    }
  }

  const resultado = rem?.resultado ?? null
  const esperando = !envioFallido && !agotado && !err && (!rem || rem.estado === 'pendiente')
  const puedeReintentar = envioFallido || agotado || rem?.estado === 'error'

  const carpeta = resultado?.carpetaUrl ? (
    <a className="text-[#2C7BE5] underline" href={resultado.carpetaUrl} target="_blank" rel="noreferrer">
      Abrir la carpeta en Drive
    </a>
  ) : null

  return (
    <div className="fixed inset-0 z-[85] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Remisión de entrada</h3>

        {esperando && <div className="text-[13px] text-slate-500">Generando la remisión…</div>}

        {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}

        {agotado && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            n8n no ha respondido todavía. La remisión está guardada, así que puedes reintentar el envío
            ahora o cerrar y revisarla más tarde.
          </div>
        )}

        {rem?.estado === 'ok' && (
          <div className="text-[13px] text-slate-700 flex flex-col gap-1">
            <span>Remisión creada.</span>
            {carpeta}
          </div>
        )}

        {rem?.estado === 'ok_con_avisos' && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col gap-1">
            <span className="font-bold">Remisión creada, con avisos</span>
            <ul className="list-disc ml-4">
              {(resultado?.avisos ?? []).map((a, i) => <li key={i}>No se pudo completar {a.paso}.</li>)}
            </ul>
            <span>El documento sí se generó; solo falló el aviso.</span>
            {carpeta}
          </div>
        )}

        {rem?.estado === 'error' && (
          <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2 flex flex-col gap-1">
            <span className="font-bold">No se pudo generar la remisión</span>
            <ul className="list-disc ml-4">
              {(resultado?.fallos ?? []).map((f, i) => <li key={i}>Falló {f.paso}.</li>)}
            </ul>
          </div>
        )}

        <div className="flex justify-end items-center gap-2">
          {puedeReintentar && (
            <button type="button" onClick={reintentar} disabled={reintentando}
              className="px-3 py-1.5 text-[13px] text-slate-600 disabled:opacity-50">
              {reintentando ? 'Reenviando…' : 'Reintentar'}
            </button>
          )}
          <button type="button" onClick={onCerrar}
            className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación y estilo**

Run: `npm run typecheck && npm run lint`
Expected: sin errores. `resultado.avisos` y `resultado.fallos` tipan porque la Task 1 los declaró en `RemisionResultado`.

- [ ] **Step 3: Commit**

```bash
git add apps/desk/src/components/ResultadoRemision.tsx
git commit -m "feat(desk): panel que sondea el desenlace de la remision y permite reintentar"
```

---

## Task 6: Enganchar el panel al formulario

Hoy `submit()` llama a `onCreada()` nada más enviar, así que el técnico se va antes de que exista el desenlace. El envío se queda donde está (imperativo, una sola vez): ponerlo en un `useEffect` del panel lo dispararía dos veces bajo StrictMode y generaría dos documentos en Drive.

**Files:**
- Modify: `apps/desk/src/components/CrearRemision.tsx:1-5, 12-44, 49-51` (cita válida en `a0a2935`;
  histórico congelado, no se renumera — `foto-solo-con-novedad`/F1B-04 movió parte de ese rango tras
  esta fecha)

- [ ] **Step 1: Añadir el import y el estado**

En `apps/desk/src/components/CrearRemision.tsx`, tras la línea 5:

```tsx
import { ResultadoRemision } from './ResultadoRemision'
```

Y junto al resto de `useState` (tras la línea 19):

```tsx
  // Una vez enviada, manda el panel de desenlace: `enviada` deja de dejar volver al formulario, que es
  // lo que evita crear una segunda remisión cuando el disparo a n8n falla.
  const [enviada, setEnviada] = useState<{ id: string; errorEnvio: string | null } | null>(null)
```

- [ ] **Step 2: Ceder el control al panel al final del envío**

Sustituir el bloque de `submit` (líneas 35-38) que hoy dice:

```tsx
      // El envío va al final, no al crear: las fotos viajan dentro del payload y hasta aquí no existían.
      setBusy('Enviando…')
      await enviarRemision(rem.id)
      onCreada()
```

por:

```tsx
      // El envío va al final, no al crear: las fotos viajan dentro del payload y hasta aquí no existían.
      setBusy('Enviando…')
      // Un fallo del disparo NO vuelve al formulario: la remisión ya está creada y reenviarla desde el
      // panel es lo correcto; reintentar el formulario crearía una segunda.
      let errorEnvio: string | null = null
      try { await enviarRemision(rem.id) } catch (e3) { errorEnvio = e3 instanceof Error ? e3.message : String(e3) }
      setEnviada({ id: rem.id, errorEnvio })
```

- [ ] **Step 3: Renderizar el panel en lugar del formulario**

Justo antes del `return (` de la línea 49 (y después de las constantes `campo`/`fijo`):

```tsx
  // `onCreada` recarga el ticket y cierra: se invoca al cerrar el panel, no al enviar.
  if (enviada) return <ResultadoRemision remisionId={enviada.id} errorEnvio={enviada.errorEnvio} onCerrar={onCreada} />
```

- [ ] **Step 4: Verificar compilación, estilo y build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: los tres sin errores.

- [ ] **Step 5: Commit y push**

```bash
git add apps/desk/src/components/CrearRemision.tsx
git commit -m "feat(desk): el formulario de remision espera y muestra el desenlace de n8n"
git push origin main
```

---

## Task 7: Desplegar la app y comprobar que nada se rompió

La app va **antes** que n8n: el endpoint del callback ya acepta los tres estados, así que queda lista para recibirlos cuando n8n empiece a mandarlos. No hay DDL, así que la regla "app antes que worker" de la replicación lógica no aplica.

- [ ] **Step 1: Suite completa antes de pedir el despliegue**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: todo verde. Los tests deben ser **328 pasando, 2 skipped** (326 previos + los 2 nuevos).

- [ ] **Step 2: Pedir el despliegue al usuario**

El despliegue en EasyPanel lo hace el usuario a mano. Avisarle de que ya está pusheado y esperar confirmación.

- [ ] **Step 3: Comprobación en producción**

Crear una remisión real desde un ticket. El flujo de n8n todavía es el viejo, así que el desenlace esperado es **`ok` en unos segundos** (el callback antiguo sigue mandando `ok` fijo). Lo que se está comprobando aquí es que el panel aparece, sondea y pinta el resultado — no la clasificación, que aún no existe.

---

## Task 8: El colector en n8n

⚠️ **El flujo está ACTIVO y en uso.** Un estado intermedio a medio cablear rompería cualquier remisión que se envíe mientras tanto. Por eso todas las operaciones van en **una sola llamada** a `n8n_update_partial_workflow`, y conviene acordar con el usuario un momento sin actividad.

**Files:** n8n `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`)

- [ ] **Step 1: Verificar el id y guardar el estado previo**

```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "structure" }
```
Expected: `name: "Remisiones_ST_3.13_Desk"`, `nodeCount: 63`, `connectionCount: 44`. **Si el nombre no es ese, PARAR** — `2OJl7Y75KykNNHyT` es producción.

Comprobar también que ninguna expresión menciona `Callback Desk (ok)`:
```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "full" }
```
y buscar la cadena `Callback Desk` en el JSON. Si solo aparece como nombre del nodo, el renombrado de la Task 10 es seguro.

- [ ] **Step 2: Leer el esquema vivo del nodo Merge**

```
get_node { nodeType: "nodes-base.merge", detail: "standard" }
```
Confirmar el `typeVersion` actual, el nombre del parámetro de número de entradas (`numberInputs`) y que el modo por defecto es `append`. **Usar lo que devuelva la herramienta, no lo que diga este plan** si difieren.

- [ ] **Step 3: Marcar como no fatales los 16 nodos posteriores al reparto**

En la llamada única del Step 5, una operación `updateNode` por nodo poniendo `onError: "continueRegularOutput"`. Los `retryOnFail` existentes **se conservan**: reintentar sigue siendo lo primero que debe pasar.

```
Correo Remisión Entrada, Code JS .dymo, Sube el .dymo, Mensaje Remisión Entrada AGPB,
Doc Remisión Entrada, Mueve Gdoc Entrada, Convertir PDF Entada, PDF a bin Entrada,
Sube PDF Entrada, Mueve PDF Entrada, BBDD remisiones_entrada,
Merge Fotos Entrada, Code fotos Entrada, Sube foto Entrada, Mueve foto Entrada
```

(`Mueve dymo Entrada` ya lo tiene. `Convertir PDF Entada` lleva esa errata en el nombre real: **no corregirla**.)

Los nodos **anteriores** al reparto (`Webhook Remisión`, `Validar payload`, `Remision-Entrada-Salida`, `Code Parsing Datos Agente IA`, `If Entrada`, `Merge Entrada`, `Verifica Incluye Entrada`, `Copia archivo base Entrada`, `Crea carpeta Entrada`) **siguen fatales a propósito**: si fallan no hay nada que recolectar, y de eso avisa el workflow de errores.

- [ ] **Step 4: Preparar el código de `Code Resumen Entrada`**

```js
// Resumen del desenlace de la remisión de ENTRADA.
//
// Corre detrás de `Merge Colector Entrada`, y esa barrera es lo que lo hace posible: n8n no garantiza
// el orden entre ramas paralelas, así que sin ella `$('Correo Remisión Entrada')` podría lanzar por no
// haberse ejecutado TODAVÍA y confundiríamos "aún no" con "falló".
//
// Se interrogan todos los nodos falibles, no solo los finales de rama: con `continueRegularOutput` el
// error se arrastra por la cadena, así que mirar solo el final diría "falló el PDF" cuando lo que se
// rompió fue el documento. La tabla va en orden de cadena para que el primer caído sea la causa raíz.
const PASOS = [
  { nodo: 'Doc Remisión Entrada',          etiqueta: 'el documento de la remisión',       critico: true },
  { nodo: 'Mueve Gdoc Entrada',            etiqueta: 'el documento de la remisión',       critico: true },
  { nodo: 'Convertir PDF Entada',          etiqueta: 'el PDF de la remisión',             critico: true },
  { nodo: 'PDF a bin Entrada',             etiqueta: 'el PDF de la remisión',             critico: true },
  { nodo: 'Sube PDF Entrada',              etiqueta: 'el PDF de la remisión',             critico: true },
  { nodo: 'Mueve PDF Entrada',             etiqueta: 'el PDF de la remisión',             critico: true },
  { nodo: 'BBDD remisiones_entrada',       etiqueta: 'el registro en la hoja de cálculo', critico: true },
  { nodo: 'Code fotos Entrada',            etiqueta: 'el registro fotográfico',           critico: true },
  { nodo: 'Sube foto Entrada',             etiqueta: 'el registro fotográfico',           critico: true },
  { nodo: 'Mueve foto Entrada',            etiqueta: 'el registro fotográfico',           critico: true },
  { nodo: 'Correo Remisión Entrada',       etiqueta: 'el correo al técnico',              critico: false },
  { nodo: 'Code JS .dymo',                 etiqueta: 'la etiqueta .dymo',                 critico: false },
  { nodo: 'Sube el .dymo',                 etiqueta: 'la etiqueta .dymo',                 critico: false },
  { nodo: 'Mueve dymo Entrada',            etiqueta: 'la etiqueta .dymo',                 critico: false },
  { nodo: 'Mensaje Remisión Entrada AGPB', etiqueta: 'el aviso de Telegram',              critico: false },
];

// Salida 0 del If = "hay fotos". Preguntárselo a él evita depender del centinela interno de
// `Code fotos Entrada`. Que la pareja de subida no corra sin fotos es lo correcto, no un fallo.
let sinFotos = false;
try { sinFotos = $('If Hay foto Entrada').all(0).length === 0; } catch (e) { sinFotos = true; }
const OPCIONALES_SIN_FOTOS = new Set(['Sube foto Entrada', 'Mueve foto Entrada']);

// undefined = el nodo no llegó a ejecutarse; null = se ejecutó pero no dejó items.
const item0 = (nombre) => { try { return $(nombre).all()[0] ?? null; } catch (e) { return undefined; } };
const contar = (nombre) => { try { return $(nombre).all().length; } catch (e) { return 0; } };
const campo = (nombre, prop) => { try { return $(nombre).first().json[prop] ?? null; } catch (e) { return null; } };

const caidos = [];
for (const p of PASOS) {
  if (sinFotos && OPCIONALES_SIN_FOTOS.has(p.nodo)) continue;
  const it = item0(p.nodo);
  let mensaje = null;
  if (it === undefined) mensaje = 'no se ejecutó';
  else if (it === null) mensaje = 'sin resultado';
  else if (it.json && it.json.error) mensaje = String(it.json.error.message || it.json.error);
  if (mensaje) caidos.push({ paso: p.etiqueta, mensaje, critico: p.critico });
}

// Solo la primera caída de cada etiqueta: las siguientes de esa rama son su consecuencia, no otra causa.
const vistos = new Set();
const primeros = [];
for (const c of caidos) { if (!vistos.has(c.paso)) { vistos.add(c.paso); primeros.push(c); } }

const fallos = primeros.filter((c) => c.critico).map((c) => ({ paso: c.paso, mensaje: c.mensaje }));
const avisos = primeros.filter((c) => !c.critico).map((c) => ({ paso: c.paso, mensaje: c.mensaje }));
const carpetaId = campo('Crea carpeta Entrada', 'id');

return [{
  json: {
    estado: fallos.length ? 'error' : (avisos.length ? 'ok_con_avisos' : 'ok'),
    resultado: {
      carpetaId: carpetaId,
      carpetaUrl: carpetaId ? 'https://drive.google.com/drive/folders/' + carpetaId : null,
      docId: campo('Doc Remisión Entrada', 'documentId'),
      pdfId: campo('Mueve PDF Entrada', 'id'),
      fotos: { recibidas: sinFotos ? 0 : contar('Code fotos Entrada'), subidas: contar('Mueve foto Entrada') },
      avisos: avisos,
      fallos: fallos,
      ejecucionId: String($execution.id),
    },
  },
}];
```

- [ ] **Step 5: Aplicar TODAS las operaciones en una sola llamada**

`n8n_update_partial_workflow` con `id: "BpLlnPAfjpHaoeKA"` y, en este orden:

1. `addNode` **Merge Colector Entrada** — `n8n-nodes-base.merge`, `position: [640, 1248]`, parámetros según el Step 2 (7 entradas, modo append).
2. `addNode` **Code Resumen Entrada** — `n8n-nodes-base.code`, `position: [880, 1248]`, `jsCode` del Step 4.
3. `removeConnection` `Mueve PDF Entrada` → `Callback Desk (ok)`.
4. `addConnection` ×8 hacia `Merge Colector Entrada`:

| Origen | Salida | Entrada del colector |
|---|---|---|
| `Correo Remisión Entrada` | 0 | 0 |
| `Mueve dymo Entrada` | 0 | 1 |
| `Mensaje Remisión Entrada AGPB` | 0 | 2 |
| `Mueve Gdoc Entrada` | 0 | 3 |
| `Mueve PDF Entrada` | 0 | 4 |
| `BBDD remisiones_entrada` | 0 | 5 |
| `Mueve foto Entrada` | 0 | 6 |
| `If Hay foto Entrada` | **1** (false) | 6 |

   La última es la que hay que no olvidar: sin ella, una remisión **sin fotos** deja muda la entrada 6.
5. `addConnection` `Merge Colector Entrada` → `Code Resumen Entrada`.
6. `addConnection` `Code Resumen Entrada` → `Callback Desk (ok)`.
7. Las 15 operaciones `updateNode` del Step 3.

- [ ] **Step 6: Verificar el cableado a mano**

```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "structure" }
```
Expected: `nodeCount: 65`. Comprobar leyendo el objeto `connections`:
- `Mueve PDF Entrada` apunta al colector y **ya no** a `Callback Desk (ok)`.
- `If Hay foto Entrada` tiene **dos** salidas cableadas, la segunda al colector.
- Las 7 entradas del colector tienen origen.
- `Merge Colector Entrada` → `Code Resumen Entrada` → `Callback Desk (ok)`.

```
n8n_validate_workflow { id: "BpLlnPAfjpHaoeKA" }
```
Expected: sin errores. **Esto es necesario pero no suficiente** — la prueba de verdad es la Task 10.

---

## Task 9: El cuerpo del callback

**Files:** n8n `Remisiones_ST_3.13_Desk`, nodo `Callback Desk (ok)`

- [ ] **Step 1: Sustituir el `jsonBody`**

Hoy el nodo escribe `estado: 'ok'` a mano y reconstruye el resultado con expresiones. Ahora todo eso lo produce `Code Resumen Entrada`, así que el cuerpo pasa a ser el item entero:

```
={{ JSON.stringify($json) }}
```

La `url` **no cambia**: sigue siendo
`=https://ambientalia-desk.ambientalia.cloud/api/remisiones/{{ $('Remision-Entrada-Salida').first().json.remisionId }}/callback`.
La credencial (`Callback n8n → Desk`, `XI4FybGmVyzxjt4O`) y el `retryOnFail` (3 × 5000 ms) tampoco.

- [ ] **Step 2: Renombrar el nodo (opcional)**

Si el MCP ofrece operación de renombrado, pasar `Callback Desk (ok)` → `Callback Desk`: el `(ok)` ya no es cierto. Solo si el Step 1 de la Task 8 confirmó que ninguna expresión lo menciona. Si no hay operación de renombrado, **dejarlo como está y seguir**: es cosmético y no justifica un `n8n_update_full_workflow` sobre un flujo activo.

- [ ] **Step 3: Verificar**

```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "filtered", nodeNames: ["Callback Desk (ok)", "Code Resumen Entrada", "Merge Colector Entrada"] }
```
Expected: el `jsonBody` es el nuevo, la url intacta, la credencial intacta.

---

## Task 10: `Errores_Ambientalia`

**Files:** n8n, workflow nuevo

- [ ] **Step 1: Leer la configuración del Telegram existente**

```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "filtered", nodeNames: ["Mensaje Remisión Entrada AGPB"] }
```
Anotar el `chatId` y el id de la credencial de Telegram: se reutilizan tal cual, sin crear credenciales nuevas.

- [ ] **Step 2: Crear el workflow**

`n8n_create_workflow` con nombre `Errores_Ambientalia` y dos nodos:

1. `Error Trigger` — `n8n-nodes-base.errorTrigger`.
2. `Telegram` (nombre: `Alerta Telegram`) — `n8n-nodes-base.telegram`. Leer primero el esquema vivo
   con `get_node { nodeType: "nodes-base.telegram", detail: "standard" }` y configurar
   `resource: "message"`, `operation: "sendMessage"`, `chatId` y credencial copiados del Step 1, y
   este `text`:

```
=🚨 Fallo en n8n

Flujo: {{ $json.workflow.name }}
Nodo: {{ $json.execution.lastNodeExecuted }}
Error: {{ $json.execution.error.message }}
Ejecución: {{ $json.execution.id }}
{{ $json.execution.url }}
```

Conectar `Error Trigger` → `Alerta Telegram`. **Dejarlo inactivo**: n8n dispara los workflows de error por su cuenta, sin necesidad de activarlos. Se confirma en la Task 11.

- [ ] **Step 3: Verificar**

```
n8n_validate_workflow { id: "<id nuevo>" }
n8n_get_workflow { id: "<id nuevo>", mode: "structure" }
```
Expected: sin errores y la conexión presente.

- [ ] **Step 4: Pedir al usuario que lo asigne**

Asignar el Error Workflow es **solo-UI**, el MCP no puede. Pedirle que abra `Remisiones_ST_3.13_Desk` → Workflow Settings → Error Workflow → `Errores_Ambientalia`. **Solo en `_Desk`**; producción (`2OJl7Y75KykNNHyT`) se deja al margen hasta verlo funcionar.

---

## Task 11: Las cuatro ejecuciones reales

Ninguna prueba automática cubre el `Merge` de 7 entradas. Esto es lo que de verdad valida el trabajo.

- [ ] **Step 1: Remisión con fotos**

Crear una remisión real desde un ticket, con 2-3 fotos.
Expected: el panel muestra **"Remisión creada"** con enlace a Drive. En Postgres, `estado = 'ok'` y `resultado.fotos = { recibidas: 3, subidas: 3 }`.

- [ ] **Step 2: Remisión sin fotos**

Misma operación, sin adjuntar ninguna foto. **Es la prueba clave**: valida el cable `false` de `If Hay foto Entrada`. Si el `Merge` se cuelga esperando una entrada que nunca llega, se cuelga aquí y el panel llegará a los 60 s sin desenlace.
Expected: **`ok`**, con `resultado.fotos = { recibidas: 0, subidas: 0 }` y sin fallos por el registro fotográfico.

Si se cuelga: partir el colector en dos `Merge` encadenados (4 entradas + 4 entradas) y repetir.

- [ ] **Step 3: Aviso forzado**

Poner un `chatId` inválido en `Mensaje Remisión Entrada AGPB`. Crear una remisión.
Expected: **`ok_con_avisos`**, y el panel dice *"No se pudo completar el aviso de Telegram"*. El documento y el PDF se generan igual.
**Revertir el `chatId` inmediatamente después.**

- [ ] **Step 4: Crítico forzado**

Apuntar `BBDD remisiones_entrada` a una hoja inexistente. Crear una remisión.
Expected: **`error`**, y el panel dice *"Falló el registro en la hoja de cálculo"* con el botón **Reintentar**.
**Revertir la hoja inmediatamente después.**

- [ ] **Step 5: Comprobar el workflow de errores**

Durante el Step 4, `BBDD remisiones_entrada` es no fatal, así que la ejecución **no** morirá y el Error Trigger no debería dispararse (es lo esperado: ese fallo lo gestiona el colector). Para probar el workflow de errores hace falta un fallo **pre-reparto**: por ejemplo apuntar `Copia archivo base Entrada` a un fichero inexistente.
Expected: llega el mensaje de Telegram con flujo, nodo y ejecución; la remisión se queda en `pendiente`; el panel llega a los 60 s y ofrece **Reintentar**.
**Revertir inmediatamente después.**

- [ ] **Step 6: Verificación final del estado del flujo**

```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "structure" }
```
Expected: 65 nodos, el flujo activo, y ninguno de los cambios temporales de los Steps 3-5 en pie. Confirmar leyendo los nodos tocados:
```
n8n_get_workflow { id: "BpLlnPAfjpHaoeKA", mode: "filtered", nodeNames: ["Mensaje Remisión Entrada AGPB", "BBDD remisiones_entrada", "Copia archivo base Entrada"] }
```

- [ ] **Step 7: Actualizar la memoria del proyecto**

Actualizar `~/.claude/projects/c--dev-Desk-2-R1-023/memory/remisiones-n8n-integracion.md`: `ok_con_avisos` implementado, el flujo pasa a 65 nodos, existe `Errores_Ambientalia`, y la señal de fallo ya no es el rojo de n8n sino el estado en Desk.

---

## Fuera de alcance

- El panel de remisiones en `TicketDetailView` (sigue en pendientes).
- La rama de **salida** del flujo, intacta.
- Cualquier cambio en `Remisiones_ST_3.13` (producción).
- Marcar la remisión desde el workflow de errores vía API de n8n.
- Reactivar `Mensaje Remisión Entrada GANG`.
