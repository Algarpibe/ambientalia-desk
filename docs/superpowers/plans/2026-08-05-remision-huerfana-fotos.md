# Remisión huérfana al fallar una foto — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o
> `superpowers:executing-plans` para ejecutar tarea a tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que un fallo al subir una foto deje de producir remisiones huérfanas en `pendiente` y
remisiones duplicadas del mismo ticket.

**Arquitectura:** la orquestación "crear → subir fotos → enviar" sale de `CrearRemision.tsx` a un módulo
propio con las dependencias inyectadas, para poder probarla con vitest (el repo no tiene harness de
componentes React). El módulo es **reanudable**: recibe qué se hizo ya y continúa desde ahí, y notifica
cada avance para que el componente lo guarde en estado. Un reintento continúa con la remisión existente
en vez de crear otra. Se añaden dos salidas: omitir las fotos que no suben, y retomar una remisión que
quedó `pendiente` de una sesión anterior.

**Stack:** TypeScript, React 18, vitest. Sin dependencias nuevas.

**Contexto del fallo:** ver [debt.md:400](../../../debt.md#L400). En `submit`, el bucle de fotos está dentro
del `try` externo, pero su `catch` devuelve al formulario y `rem.id` es una `const` local que se pierde.
La remisión ya existe en la base, en `pendiente` para siempre, y `POST /api/remisiones` no deduplica por
ticket: volver a pulsar "Crear remisión" crea una segunda.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `apps/desk/src/lib/envioRemision.ts` (nuevo) | Orquesta crear → fotos → enviar. Reanudable. Sin red, sin DOM, sin `File`. |
| `apps/desk/src/lib/envioRemision.test.ts` (nuevo) | Tests unitarios del módulo anterior. |
| `apps/desk/src/components/CrearRemision.tsx` (modificar) | Deja de orquestar; guarda el estado de avance, congela el formulario tras crear, y ofrece las dos salidas. |

---

### Tarea 1: el módulo de envío reanudable

**Ficheros:**
- Crear: `apps/desk/src/lib/envioRemision.ts`
- Test: `apps/desk/src/lib/envioRemision.test.ts`

- [ ] **Paso 1: escribir el test que falla**

Crear `apps/desk/src/lib/envioRemision.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { ejecutarEnvio, type EstadoEnvio, type PasosEnvio } from './envioRemision'

/** Pasos falsos con contadores; `avances` acumula lo que el componente guardaría en estado. */
function pasosFalsos(over: Partial<PasosEnvio> = {}) {
  const avances: EstadoEnvio[] = []
  const pasos: PasosEnvio = {
    crear: vi.fn(async () => 'rem-1'),
    subirFoto: vi.fn(async () => {}),
    enviar: vi.fn(async () => {}),
    onAvance: (e) => { avances.push(e) },
    ...over,
  }
  return { pasos, avances }
}

const NUEVO: EstadoEnvio = { remisionId: null, fotosSubidas: 0 }

describe('ejecutarEnvio', () => {
  it('flujo feliz: crea, sube todas las fotos en orden y envía', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio(NUEVO, 2, pasos)
    expect(pasos.crear).toHaveBeenCalledTimes(1)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(1, 'rem-1', 0)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(2, 'rem-1', 1)
    expect(pasos.enviar).toHaveBeenCalledWith('rem-1')
    expect(r).toEqual({ remisionId: 'rem-1', errorEnvio: null })
  })

  // El corazón del arreglo: con una remisión ya creada NO se crea otra.
  it('no vuelve a crear si el estado ya trae una remisión', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 0 }, 1, pasos)
    expect(pasos.crear).not.toHaveBeenCalled()
    expect(pasos.subirFoto).toHaveBeenCalledWith('rem-9', 0)
    expect(r.remisionId).toBe('rem-9')
  })

  it('reanuda las fotos desde donde se quedó, sin resubir las hechas', async () => {
    const { pasos } = pasosFalsos()
    await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 2 }, 4, pasos)
    expect(pasos.subirFoto).toHaveBeenCalledTimes(2)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(1, 'rem-9', 2)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(2, 'rem-9', 3)
  })

  // Sin esto el arreglo no sirve: el avance tiene que quedar registrado ANTES de propagar el fallo,
  // porque es lo único que permite que el reintento continúe en vez de empezar de cero.
  it('si una foto falla, propaga el error pero deja registrado lo ya subido', async () => {
    const { pasos, avances } = pasosFalsos({
      subirFoto: vi.fn(async (_id: string, i: number) => { if (i === 1) throw new Error('sin cobertura') }),
    })
    await expect(ejecutarEnvio(NUEVO, 3, pasos)).rejects.toThrow('sin cobertura')
    expect(avances.at(-1)).toEqual({ remisionId: 'rem-1', fotosSubidas: 1 })
    expect(pasos.enviar).not.toHaveBeenCalled()
  })

  it('omitirFotosPendientes salta las fotos que faltan y envía igual', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 1 }, 3, pasos, { omitirFotosPendientes: true })
    expect(pasos.subirFoto).not.toHaveBeenCalled()
    expect(pasos.enviar).toHaveBeenCalledWith('rem-9')
    expect(r.errorEnvio).toBeNull()
  })

  // Un disparo fallido NO es un fallo del envío: la remisión existe y se reintenta desde el panel.
  it('un fallo de enviar no lanza: vuelve como errorEnvio', async () => {
    const { pasos } = pasosFalsos({ enviar: vi.fn(async () => { throw new Error('n8n caído') }) })
    const r = await ejecutarEnvio(NUEVO, 0, pasos)
    expect(r).toEqual({ remisionId: 'rem-1', errorEnvio: 'n8n caído' })
  })
})
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

Desde la RAÍZ del repo:

```bash
npx vitest run apps/desk/src/lib/envioRemision.test.ts
```

Esperado: FAIL — `Failed to resolve import "./envioRemision"`.

- [ ] **Paso 3: escribir la implementación mínima**

Crear `apps/desk/src/lib/envioRemision.ts`:

```ts
/**
 * Orquesta "crear remisión → subir fotos → enviar a n8n", fuera del componente para poder probarlo:
 * el repo no tiene harness de componentes React, y aquí es donde vive el riesgo real —que un fallo a
 * mitad deje una remisión huérfana o cree una duplicada—, así que tiene que estar cubierto.
 *
 * Las dependencias entran por parámetro y no por import: así el test no necesita red, ni `File`, ni DOM.
 */

/** Lo que hay que recordar entre intentos para que un reintento CONTINÚE en vez de empezar de cero. */
export interface EstadoEnvio {
  /** Id de la remisión ya creada en la base. `null` = todavía no existe. */
  remisionId: string | null
  /** Cuántas fotos se subieron ya, en orden. Es el índice de la próxima que toca. */
  fotosSubidas: number
}

export interface PasosEnvio {
  /** Crea la remisión y devuelve su id. Solo se llama si el estado no trae una. */
  crear: () => Promise<string>
  subirFoto: (remisionId: string, indice: number) => Promise<void>
  enviar: (remisionId: string) => Promise<void>
  /**
   * Se llama tras CADA avance. Es la pieza que arregla el fallo: quien orquesta lo guarda en estado,
   * así que sobrevive al error y el reintento sabe por dónde iba.
   */
  onAvance: (estado: EstadoEnvio) => void
  /** Texto de progreso para la pantalla. Opcional: al test no le hace falta. */
  onProgreso?: (texto: string) => void
}

export interface ResultadoEnvio {
  remisionId: string
  /** Mensaje si el disparo a n8n falló. La remisión existe igual y se reintenta desde el panel. */
  errorEnvio: string | null
}

/**
 * Reanudable: `estado` dice qué se hizo ya y se continúa desde ahí. Un fallo de `crear` o de
 * `subirFoto` se propaga —el formulario tiene que enterarse—, pero para entonces `onAvance` ya
 * registró lo conseguido.
 *
 * `enviar` es la excepción y NO lanza: llegado ahí la remisión existe y sus fotos están subidas, así
 * que el sitio para reintentar es el panel de desenlace, no el formulario. Volver al formulario sería
 * justo lo que crea la remisión duplicada.
 */
export async function ejecutarEnvio(
  estado: EstadoEnvio,
  totalFotos: number,
  pasos: PasosEnvio,
  opciones: { omitirFotosPendientes?: boolean } = {},
): Promise<ResultadoEnvio> {
  let remisionId = estado.remisionId
  let fotosSubidas = estado.fotosSubidas

  if (!remisionId) {
    pasos.onProgreso?.('Guardando…')
    remisionId = await pasos.crear()
    fotosSubidas = 0
    pasos.onAvance({ remisionId, fotosSubidas })
  }

  if (!opciones.omitirFotosPendientes) {
    for (let i = fotosSubidas; i < totalFotos; i++) {
      pasos.onProgreso?.(`Subiendo foto ${i + 1} de ${totalFotos}…`)
      await pasos.subirFoto(remisionId, i)
      fotosSubidas = i + 1
      pasos.onAvance({ remisionId, fotosSubidas })
    }
  }

  pasos.onProgreso?.('Enviando…')
  let errorEnvio: string | null = null
  try {
    await pasos.enviar(remisionId)
  } catch (e) {
    errorEnvio = e instanceof Error ? e.message : String(e)
  }
  return { remisionId, errorEnvio }
}
```

- [ ] **Paso 4: ejecutar el test y ver que pasa**

```bash
npx vitest run apps/desk/src/lib/envioRemision.test.ts
```

Esperado: PASS, 6 tests.

- [ ] **Paso 5: commit**

```bash
git add apps/desk/src/lib/envioRemision.ts apps/desk/src/lib/envioRemision.test.ts
git commit -m "feat(desk): orquestación reanudable del envío de remisiones

Separada del componente para poder probarla: no hay harness de componentes
React, y es justo aquí donde un fallo a mitad deja una remisión huérfana.
Todavía no la usa nadie; el cableado va en el commit siguiente."
```

---

### Tarea 2: cablear el componente al módulo

**Ficheros:**
- Modificar: `apps/desk/src/components/CrearRemision.tsx`

- [ ] **Paso 1: sustituir imports y estado**

Reemplazar las líneas 1-6 por:

```tsx
import { useState } from 'react'
import type { RemisionNueva } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionNueva, crearRemision, subirFotoRemision, enviarRemision } from '../api/client'
import { redimensionarImagen, hoyISO } from '../lib/imagen'
import { ejecutarEnvio, type EstadoEnvio, type ResultadoEnvio } from '../lib/envioRemision'
import { ResultadoRemision } from './ResultadoRemision'
```

Reemplazar las líneas 21-23 (el estado `enviada` y su comentario) por:

```tsx
  // Lo que sobrevive a un fallo a mitad: sin esto, el id de la remisión ya creada se perdía al volver
  // al formulario y el siguiente intento creaba una segunda.
  const [envio, setEnvio] = useState<EstadoEnvio>({ remisionId: null, fotosSubidas: 0 })
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null)
```

- [ ] **Paso 2: sustituir `submit` por `ejecutar` + `submit`**

Reemplazar la función `submit` entera (líneas 27-51 del original) por:

```tsx
  /**
   * `estado` viaja como parámetro y no se lee de `envio` porque hay que poder invocarlo con un estado
   * recién calculado, antes de que React haya aplicado el `setEnvio` correspondiente.
   */
  async function ejecutar(estado: EstadoEnvio, omitirFotosPendientes: boolean) {
    setErr(null)
    try {
      const r = await ejecutarEnvio(estado, fotos.length, {
        crear: async () => {
          const incluye = Object.entries(marcados).filter(([, v]) => v).map(([k]) => k)
          const rem = await crearRemision({ ticketId, fecha, incluye, observaciones: observaciones || undefined })
          return rem.id
        },
        subirFoto: async (id, i) => { await subirFotoRemision(id, await redimensionarImagen(fotos[i])) },
        enviar: (id) => enviarRemision(id),
        onAvance: setEnvio,
        onProgreso: setBusy,
      }, { omitirFotosPendientes })
      setResultado(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    void ejecutar(envio, false)
  }

  /**
   * La remisión ya existe: los datos del formulario están guardados y no se pueden cambiar desde aquí,
   * así que se congelan. Cambiarlos daría la impresión de editar algo que ya no se va a reescribir.
   */
  const creada = envio.remisionId !== null
  const fotosPendientes = fotos.length - envio.fotosSubidas

  // Salir dejando una remisión creada la deja en `pendiente` sin enviar. No se puede borrar desde aquí
  // (anular es solo de administradores), así que al menos hay que decirlo.
  function cancelar() {
    if (creada && !confirm('La remisión ya se creó y quedaría sin enviar. Aparecerá en la pantalla de Remisiones y un administrador puede anularla. ¿Salir de todos modos?')) return
    onClose()
  }
```

- [ ] **Paso 3: sustituir el retorno del panel de desenlace**

Reemplazar la línea 59 del original por:

```tsx
  if (resultado) return <ResultadoRemision key={resultado.remisionId} remisionId={resultado.remisionId} errorEnvio={resultado.errorEnvio} onCerrar={onCreada} />
```

- [ ] **Paso 4: congelar los campos y añadir el aviso y las salidas**

En el campo Fecha (línea 78 del original), añadir `disabled={creada}`:

```tsx
              <input type="date" className={`${campo} w-full`} value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={creada} required />
```

En las casillas del checklist (línea 113 del original), añadir `disabled={creada}`:

```tsx
                      <input type="checkbox" className="accent-blue-600 mt-0.5" checked={!!marcados[item]} onChange={() => alternar(item)} disabled={creada} />
```

En Observaciones (línea 123 del original), añadir `disabled={creada}`:

```tsx
              <textarea className={`${campo} h-20 resize-none`} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={creada} placeholder="Estado del equipo, golpes, faltantes…" />
```

En el selector de fotos (líneas 128-129 del original), añadir `disabled={creada}`. Se congela porque
`fotosSubidas` es un índice sobre esta misma lista: cambiar los ficheros la invalidaría y resubiría fotos
ya subidas.

```tsx
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="text-[12px]" disabled={creada}
                onChange={(e) => setFotos(Array.from(e.target.files ?? []))} />
```

Reemplazar el bloque de error y botones (líneas 139-146 del original) por:

```tsx
        {creada && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            La remisión ya se creó y no se va a duplicar: al reintentar se continúa con ella.
            {fotos.length > 0 && ` Fotos subidas: ${envio.fotosSubidas} de ${fotos.length}.`}
          </div>
        )}
        {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}
        <div className="flex justify-end items-center gap-2">
          {busy && <span className="text-[12px] text-slate-500 mr-auto">{busy}</span>}
          {/* Salida para una foto que no sube nunca (corrupta, o demasiado pesada): sin esto el técnico
              se queda atrapado reintentando. Lo que ya subió sí viaja, y el flujo de n8n concilia
              contra lo que se mandó, así que una remisión con menos fotos no cuenta como error. */}
          {creada && fotosPendientes > 0 && !busy && (
            <button type="button" onClick={() => void ejecutar(envio, true)} className="px-3 py-1.5 text-[13px] text-slate-600 underline">
              Continuar sin las {fotosPendientes} fotos que faltan
            </button>
          )}
          <button type="button" onClick={cancelar} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          {/* El progreso lo cuenta el `busy` de la izquierda; repetirlo aquí solo haría bailar el ancho
              del botón a cada foto. */}
          <button type="submit" disabled={!data || !!busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">
            {creada ? 'Reintentar' : 'Crear remisión'}
          </button>
        </div>
```

- [ ] **Paso 5: verificar desde la RAÍZ del repo**

```bash
npm run typecheck && npm run lint && npm run build
```

Esperado: typecheck sin salida de error; lint `0 errors`; build `✓ built`.

```bash
npm test
```

Esperado: 370 passed (364 de base + 6 nuevos), 2 skipped.

- [ ] **Paso 6: commit**

```bash
git add apps/desk/src/components/CrearRemision.tsx
git commit -m "fix(desk): un fallo al subir una foto ya no deja la remisión huérfana

El bucle de fotos vivía dentro del try externo, pero su catch devolvía al
formulario y el id de la remisión era una const local que se perdía. La
remisión quedaba en 'pendiente' para siempre y, como POST /api/remisiones no
deduplica por ticket, volver a pulsar creaba una segunda.

Ahora el avance se guarda en estado: reintentar continúa con la remisión que
ya existe y con las fotos que faltan. Los campos ya guardados se congelan
—no se pueden reescribir desde aquí— y hay salida para una foto que no sube
nunca: se envía sin ella, que el flujo de n8n concilia contra lo mandado."
```

---

### Tarea 3: retomar una remisión pendiente de otra sesión

Cierra el agujero que la Tarea 2 no cubre: si el técnico recarga, se le cierra el navegador o pulsa
Cancelar, el estado en memoria se pierde y el siguiente "Crear remisión" vuelve a duplicar.

**Ficheros:**
- Modificar: `apps/desk/src/components/CrearRemision.tsx`

- [ ] **Paso 1: pedir las remisiones del ticket al montar**

Añadir el import del cliente (junto a los otros de `../api/client`):

```tsx
import { fetchRemisionNueva, crearRemision, subirFotoRemision, enviarRemision, fetchRemisiones, type RemisionConFotos } from '../api/client'
```

Justo después del `useAsync` de `fetchRemisionNueva` (línea 14 del original), añadir:

```tsx
  // Una remisión de este ticket que quedó creada pero sin enviar, de un intento anterior que se cortó.
  // Ofrecerla evita el duplicado: sin esto, "Crear remisión" arrancaría una segunda desde cero.
  const { data: previas } = useAsync<RemisionConFotos[]>(() => fetchRemisiones(ticketId), [ticketId])
  const pendiente = (previas ?? []).find((r) => r.estado === 'pendiente') ?? null
```

- [ ] **Paso 2: ofrecerla en el formulario**

Insertar este bloque justo antes de `{err && …}` en el JSX (y después del aviso de `creada`):

```tsx
        {/* Solo mientras no se haya creado nada en esta sesión: si ya hay una `creada`, el aviso de
            arriba manda y este sobraría. */}
        {!creada && pendiente && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-2">
            <span className="flex-1">Hay una remisión de este ticket del {pendiente.fecha} que se creó pero nunca llegó a enviarse.</span>
            <button
              type="button"
              onClick={() => void ejecutar({ remisionId: pendiente.id, fotosSubidas: 0 }, true)}
              className="shrink-0 font-bold underline"
            >
              Enviar esa
            </button>
          </div>
        )}
```

Se invoca con `omitirFotosPendientes` en `true` porque los ficheros de aquella sesión ya no están en el
navegador: las fotos que llegaron a subirse siguen en la base y viajan solas en el payload.

- [ ] **Paso 3: verificar desde la RAÍZ del repo**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Esperado: typecheck limpio, lint `0 errors`, build ok, 370 passed / 2 skipped.

- [ ] **Paso 4: commit**

```bash
git add apps/desk/src/components/CrearRemision.tsx
git commit -m "feat(desk): ofrecer enviar la remisión que quedó pendiente del ticket

La reanudación en memoria no cubre recargar la página ni cerrar el navegador:
ahí el id se pierde igual y el siguiente intento duplicaría. Al abrir el
formulario se busca una remisión del ticket en 'pendiente' y se ofrece
enviarla, en vez de empezar una segunda desde cero."
```

---

### Tarea 4: dejar constancia en debt.md

**Ficheros:**
- Modificar: `debt.md:400-412`

- [ ] **Paso 1: sustituir la entrada por su cierre**

Reemplazar el bloque completo **Remisión huérfana si falla la subida de una foto** (desde
`- **Remisión huérfana si falla la subida de una foto:**` hasta `…cierre del subsistema de entrada.`) por:

```markdown
- ~~**Remisión huérfana si falla la subida de una foto**~~ — **RESUELTO 2026-08-05.** Se optó por la
  opción (b): el avance (`remisionId` + `fotosSubidas`) vive en estado, así que reintentar continúa con
  la remisión ya creada en vez de crear otra. La orquestación se extrajo a
  `apps/desk/src/lib/envioRemision.ts` con las dependencias inyectadas, para poder probarla sin harness
  de componentes. Se añadieron dos salidas que el análisis original no contemplaba: **omitir las fotos
  que no suben** (una foto corrupta dejaba al técnico atrapado reintentando; lo ya subido viaja, y n8n
  concilia contra lo mandado, así que no cuenta como error) y **retomar la remisión `pendiente`** del
  ticket al abrir el formulario, que es lo que cubre recargar la página o cerrar el navegador.
```

- [ ] **Paso 2: commit**

```bash
git add debt.md
git commit -m "docs: cerrar la deuda de la remisión huérfana por fallo de foto"
```

---

## Fuera de alcance

- **Deduplicación en el servidor** (`POST /api/remisiones` rechazando una segunda `pendiente` del mismo
  ticket). Las tres tareas cierran las rutas que llevan al duplicado desde la interfaz; un guard en el
  servidor sería la red definitiva, pero hay que decidir antes si dos remisiones del mismo ticket son
  legítimas —lo son: un ticket puede recibir dos equipos— y entonces la regla no puede ser "una por
  ticket" sino "una `pendiente` por ticket". Merece su propia decisión.
- **Borrar la remisión abandonada.** Sigue haciendo falta que un administrador la anule a mano. Anular
  es reversible y deja rastro, que es lo que se quiere; automatizarlo es otra conversación.
- **Reintento automático de la foto** con backoff. El reintento es manual a propósito: el técnico sabe
  si ya recuperó cobertura mejor que un temporizador.
