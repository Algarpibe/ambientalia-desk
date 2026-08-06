# CONVERSACIONES como relato del ticket — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o
> `superpowers:executing-plans` para ejecutar tarea a tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que la pestaña CONVERSACIONES cuente el ticket como un hilo legible — una entrada por
etapa, firmada por quien la ejecutó, con su prosa y sus adjuntos enlazados a Drive.

**Arquitectura:** se **deriva al leer**, como la historia, así que aparece sola la que ya existe. Las
entradas generadas son objetos `Message` normales con `type: 'Privado'`: el panel ya tiene la forma
exacta que se busca y solo hay que alimentarlo. Lo que los dos compositores comparten —la regla de la
foto de creación, el origen del ticket, las coerciones de pg/pg-mem— se extrae a un módulo común antes
de escribir el segundo, para que la regla sutil no viva en dos sitios.

**Stack:** TypeScript, Express 5, React, vitest + pg-mem + supertest, n8n MCP. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-08-05-conversaciones-relato-ticket-design.md`

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| n8n `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`) | `Code Resumen Entrada` añade `dymoId` al `resultado` |
| `packages/shared/src/types.ts` (modificar) | `Attachment.url`, `RemisionResultado.dymoId` |
| `packages/zoho-sync/src/db/mappers.ts` (modificar) | Exporta `fmtTime` (hoy privado) |
| `apps/desk/server/db/ticketFuentes.ts` (**nuevo**) | Lo común a los dos compositores: origen del ticket, foto de creación, coerciones |
| `apps/desk/server/db/historial.ts` (modificar) | Pasa a consumir `ticketFuentes` |
| `apps/desk/server/db/conversacion.ts` (**nuevo**) | Compone el hilo → `Message[]` |
| `apps/desk/server/db/conversacion.test.ts` (**nuevo**) | Tests del compositor |
| `apps/desk/server/routes/tickets.ts` (modificar) | La ruta usa el compositor y arregla el sync perezoso |
| `apps/desk/src/components/TicketDetailView.tsx` (modificar) | El adjunto usa `att.url` cuando existe |

**Orden obligatorio:** la Tarea 3 (extracción) va **antes** de la 4 (compositor nuevo). Si se invierte,
la regla `hayFoto` acaba duplicada, que es justo lo que se quiere evitar.

---

### Tarea 1: n8n manda el id del `.dymo`

**Ficheros:** ninguno del repo. Workflow `Remisiones_ST_3.13_Desk`, id **`BpLlnPAfjpHaoeKA`**.

⚠️ **Verifica el id antes de escribir.** `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) es **producción y
no se toca**. Los nombres se parecen demasiado. Confirma con `n8n_get_workflow` `mode:"minimal"` que
el id que vas a tocar se llama `Remisiones_ST_3.13_Desk`.

- [ ] **Paso 1: leer el nodo**

Invoca antes la skill `n8n-mcp-skills:using-n8n-mcp-skills`. Luego:

```
n8n_get_workflow  { id: "BpLlnPAfjpHaoeKA", mode: "filtered", nodeNames: ["Code Resumen Entrada"] }
```

- [ ] **Paso 2: añadir la clave**

En el objeto `resultado` que el `return` construye, entre `pdfId` y `fotos`, añadir:

```js
      dymoId: campo('Mueve dymo Entrada', 'id'),
```

Es aditivo. **No toques nada más**: ni la tabla `PASOS`, ni el nombre del nodo, ni las conexiones. En
este flujo hay 127 expresiones que referencian nodos por nombre y ninguna validación detecta su rotura.

Usa `n8n_update_partial_workflow` con una operación `updateNode` (o `patchNodeField`) sobre
`Code Resumen Entrada`. **No** uses `n8n_update_full_workflow`.

- [ ] **Paso 3: validar y verificar**

```
n8n_validate_workflow { id: "BpLlnPAfjpHaoeKA" }
n8n_get_workflow      { id: "BpLlnPAfjpHaoeKA", mode: "filtered", nodeNames: ["Code Resumen Entrada"] }
```

Lee el `jsCode` devuelto y confirma que la línea está y que el resto del nodo quedó intacto.

**Validar no es verificar.** `validate_workflow` es necesario pero insuficiente: en este flujo todos
los fallos serios los ha cazado una remisión real, nunca la validación.

- [ ] **Paso 4: pedir la prueba real**

**Para aquí y pide al usuario que cree una remisión real desde un ticket de prueba**, y que te diga si
llegó a `ok` y si el `resultado` guardado trae `dymoId`. No sigas sin esa confirmación: si el nodo
quedó roto, toda remisión nueva se degrada y hay que revertir antes de seguir construyendo encima.

Consulta para el usuario, si la pide:
```sql
SELECT id, estado, resultado->>'dymoId' AS dymo FROM remisiones ORDER BY created_at DESC LIMIT 3;
```

- [ ] **Paso 5: el tipo en shared**

En `packages/shared/src/types.ts`, dentro de `RemisionResultado`, tras `pdfId`:

```ts
  /** Id en Drive de la etiqueta `.dymo`. Lo manda el callback desde 2026-08-05: las remisiones anteriores no lo tienen. */
  dymoId?: string | null
```

- [ ] **Paso 6: verificar y commitear**

```bash
npm run typecheck && npm run lint && npm test
```
Esperado: sin cambios de cifras (**391 pasando / 2 saltados**, lint 0 errores / 159 warnings).

```bash
git add packages/shared/src/types.ts
git commit -m "feat(shared): el resultado de la remisión trae el id de la etiqueta .dymo

El callback de n8n ya lo manda: se añadió `dymoId` a `Code Resumen Entrada`,
de forma aditiva, para poder enlazar la etiqueta desde el hilo del ticket.
Las remisiones anteriores a hoy no lo tienen, y las 149 históricas no tienen
`resultado` en absoluto."
```

---

### Tarea 2: el adjunto puede ser un enlace externo

**Ficheros:**
- Modificar: `packages/shared/src/types.ts` (`Attachment`)
- Modificar: `apps/desk/src/components/TicketDetailView.tsx`

- [ ] **Paso 1: el tipo**

En `packages/shared/src/types.ts`, en `Attachment`, añadir tras `path`:

```ts
  /**
   * Enlace externo, cuando el adjunto no vive en Zoho. Los del hilo generado apuntan a Google Drive,
   * que la app no puede servir por el proxy porque no tiene credenciales de Google. Si está, el panel
   * enlaza directo; si no, sigue pasando por `/api/attachment`.
   */
  url?: string
```

- [ ] **Paso 2: el panel**

En `apps/desk/src/components/TicketDetailView.tsx`, en la tarjeta de adjunto de la vista
`conversaciones`, sustituir el `href` por:

```tsx
                                          href={att.url ?? `/api/attachment?path=${encodeURIComponent(att.path)}`}
```

- [ ] **Paso 3: verificar y commitear**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```
Esperado: cifras sin cambio (**391 / 2**, 0 errores / 159 warnings).

```bash
git add packages/shared/src/types.ts apps/desk/src/components/TicketDetailView.tsx
git commit -m "feat(desk): un adjunto puede ser un enlace externo

El hilo generado enlaza a Google Drive, que el proxy `/api/attachment` no
puede servir porque la app no tiene credenciales de Google. Con `url` puesto
el panel enlaza directo; sin él, todo sigue como estaba."
```

---

### Tarea 3: extraer lo común a los dos compositores

Va **antes** de escribir el compositor nuevo: la regla de la foto de creación es sutil —ya se
implementó mal una vez— y no puede acabar copiada en dos ficheros.

**Ficheros:**
- Crear: `apps/desk/server/db/ticketFuentes.ts`
- Modificar: `apps/desk/server/db/historial.ts`
- Modificar: `packages/zoho-sync/src/db/mappers.ts` (exportar `fmtTime`)

- [ ] **Paso 1: exportar `fmtTime`**

En `packages/zoho-sync/src/db/mappers.ts`, añadir `export` a `fmtTime`:

```ts
/** Hora de un mensaje, en la zona de visualización. Exportada porque el hilo generado tiene que
 *  formatear igual que las conversaciones de Zoho, o se notaría cuál es cuál. */
export function fmtTime(iso?: string | null): string {
```

(Deja `fmtSize` privado: nadie más lo necesita.)

- [ ] **Paso 2: crear el módulo común**

Crear `apps/desk/server/db/ticketFuentes.ts` **moviendo** desde `historial.ts` —sin reescribirlas— las
piezas `iso`, `json`, `textoEquipo`, y el bloque de la foto de creación. Añadir el origen del ticket:

```ts
/**
 * Lo que comparten los dos compositores del ticket: `historial.ts` (el log) y `conversacion.ts` (el
 * relato). Vive aquí y no duplicado en cada uno porque la regla de la foto de creación es sutil —ya
 * se implementó mal una vez— y dos copias divergen en cuanto alguien toca una.
 */

/** Qué hacer con Zoho antes de responder. */
export type PlanSyncZoho = 'no' | 'ahora' | 'en-segundo-plano'

/**
 * Si el ticket nació en la app, Zoho no lo conoce y preguntarle por él es un 404 en cada apertura.
 *
 * Se mira el PREFIJO del id y no `managed_by_app` ni `source`: `writeTransition` pone las dos
 * columnas a "app" en CUALQUIER transición hecha aquí, incluidas las de un ticket que vino de Zoho,
 * así que ambas mienten. El id lo acuña `createTicket` como `app-<uuid>` y ningún UPDATE lo toca.
 */
export function nacidoEnLaApp(ticketId: string): boolean {
  return ticketId.startsWith('app-')
}

export function planSyncZoho(ticketId: string, hayDatosDeZoho: boolean): PlanSyncZoho {
  if (nacidoEnLaApp(ticketId)) return 'no'
  return hayDatosDeZoho ? 'en-segundo-plano' : 'ahora'
}

/** `timestamptz`: pg y pg-mem lo entregan como `Date`; el histórico puede traer texto. */
export const iso = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : v ? String(v) : null)

/** `jsonb`: pg lo entrega parseado, pg-mem como texto. */
export const json = (v: unknown): Record<string, unknown> =>
  typeof v === 'string' ? (JSON.parse(v) as Record<string, unknown>) : ((v as Record<string, unknown>) ?? {})

/** "Grimm EDM180C · serie 18A20070", saltándose lo que falte. */
export function textoEquipo(marca: unknown, modelo: unknown, serial: unknown): string {
  const nombre = [marca, modelo].filter((x) => x != null && String(x).trim() !== '').join(' ')
  const s = serial != null && String(serial).trim() !== '' ? `serie ${serial}` : ''
  return [nombre, s].filter(Boolean).join(' · ')
}

/**
 * Lector de los datos de creación. Hay foto o no la hay: se decide UNA vez, no campo a campo. Los
 * tickets anteriores a que `createTicket` guardara el payload completo dejaron en `values` solo
 * `orden_venta`, así que la presencia de cualquier otra clave es el discriminador. Mezclar con
 * `v[c] ?? ticket[col]` sería un error sutil: la foto guarda los `null` explícitos, de modo que un
 * campo que el técnico dejó vacío ese día caería a la columna y mostraría el estado ACTUAL — justo la
 * mentira que la foto evita.
 */
export function lectorCreacion(values: unknown, ticket: Record<string, unknown>) {
  const v = json(values)
  const hayFoto = Object.keys(v).some((k) => k !== 'orden_venta')
  return (clave: string, columna: string): unknown => (hayFoto ? v[clave] : ticket[columna])
}
```

- [ ] **Paso 3: que `historial.ts` lo consuma**

Borrar de `historial.ts` las definiciones movidas (`iso`, `json`, `textoEquipo`, `PlanSyncZoho`, y el
cuerpo de `hayFoto`/`de` dentro de `eventoCreacion`) e importarlas:

```ts
import { iso, json, lectorCreacion, planSyncZoho, textoEquipo, type PlanSyncZoho } from './ticketFuentes'
```

Reexportar el tipo para no romper a quien lo importe de aquí:

```ts
export type { PlanSyncZoho }
```

En `eventoCreacion`, sustituir el cálculo de `hayFoto` y `de` por:

```ts
  const de = lectorCreacion(fila.values, ticket)
```

Y al final de `getHistorialTicket`, sustituir el ternario por:

```ts
  const sincronizarConZoho = planSyncZoho(ticketId, zoho.length > 0)
```

- [ ] **Paso 4: verificar que NADA cambió de comportamiento**

```bash
npx vitest run apps/desk/server/db/historial.test.ts
```
Esperado: **11 pasando**, sin tocar un solo test. Es una extracción: si algún test cambia de resultado,
la extracción está mal.

```bash
npm run typecheck && npm run lint && npm test
```
Esperado: **391 / 2**, lint 0 errores / 159 warnings.

- [ ] **Paso 5: commit**

```bash
git add apps/desk/server/db/ticketFuentes.ts apps/desk/server/db/historial.ts packages/zoho-sync/src/db/mappers.ts
git commit -m "refactor(desk): extraer a ticketFuentes lo común a los compositores del ticket

El relato de CONVERSACIONES necesita las mismas piezas que el log de HISTORIA:
el origen del ticket, la regla de la foto de creación y las coerciones de
pg/pg-mem. Copiarlas sería garantizar que divergen, y la regla de la foto es
justo la que ya se implementó mal una vez.

Extracción pura: los 11 tests del historial pasan sin tocar ninguno."
```

---

### Tarea 4: el compositor del hilo

**Ficheros:**
- Crear: `apps/desk/server/db/conversacion.ts`
- Test: `apps/desk/server/db/conversacion.test.ts`

- [ ] **Paso 1: escribir el test que falla**

Crear `apps/desk/server/db/conversacion.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getConversacionTicket } from './conversacion'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const insTicket = (id: string, n: number) =>
  db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,$2,'A','Ingresado')", [id, n])

describe('getConversacionTicket', () => {
  it('la creación produce su entrada firmada, con cliente, equipo, servicio y orden', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('cli1','Edgar','Airlab Consulting S.A.S.')")
    await db.query("INSERT INTO tickets (id,number,subject,status,client_id) VALUES ('app-1',1,'A','Ingresado','cli1')")
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('app-1','Enviar','(creación)','OV asignada','Luz Ángela','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A19035', tipo_servicio: 'Calibración', clasificacion: 'Garantía', prioridad: 'Media' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-1')
    expect(mensajes).toHaveLength(1)
    expect(mensajes[0].author).toBe('Luz Ángela')
    expect(mensajes[0].type).toBe('Privado')
    expect(mensajes[0].content).toBe([
      'Ticket creado para Airlab Consulting S.A.S.',
      'Equipo: Grimm EDM180C · serie 18A19035',
      'Tipo de servicio: Calibración',
      'Orden de venta: OV-2026-141',
      'Clasificación: Garantía · Prioridad: Media',
    ].join('\n'))
  })

  // La prosa del hilo son las observaciones que escribió el técnico, tal cual: es lo que hace que
  // esto se lea como lo escrito a mano en Zoho y no como un volcado de campos.
  it('la remisión produce su entrada con observaciones, incluye y fotos', async () => {
    await insTicket('app-2', 2)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,incluye,observaciones,creado_por,estado,resultado,created_at)
       VALUES ('r1','app-2','entrada','2026-08-04','Calibración','["cabezal","tubo"]'::jsonb,'El equipo ingresa sin sensor de temperatura y humedad.','Julián Maya','ok',$1,'2026-08-04T14:24:00Z')`,
      [JSON.stringify({ fotos: { recibidas: 3, subidas: 3 } })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-2')
    expect(mensajes[0].author).toBe('Julián Maya')
    expect(mensajes[0].content).toBe([
      'El equipo ingresa para Calibración.',
      'El equipo ingresa sin sensor de temperatura y humedad.',
      'Incluye: cabezal, tubo',
      'Registro fotográfico: 3 fotos',
    ].join('\n'))
  })

  it('los cuatro adjuntos salen como enlaces cuando los ids existen', async () => {
    await insTicket('app-3', 3)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at)
       VALUES ('r2','app-3','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z')`,
      [JSON.stringify({ carpetaUrl: 'https://drive.google.com/drive/folders/CAR', docId: 'DOC', pdfId: 'PDF', dymoId: 'DYM' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-3')
    expect(mensajes[0].attachments?.map((a) => [a.name, a.url])).toEqual([
      ['Remisión de entrada', 'https://drive.google.com/file/d/PDF/view'],
      ['Documento editable', 'https://docs.google.com/document/d/DOC/edit'],
      ['Etiqueta .dymo', 'https://drive.google.com/file/d/DYM/view'],
      ['Carpeta en Drive', 'https://drive.google.com/drive/folders/CAR'],
    ])
  })

  // Las 149 remisiones migradas de la hoja de Google nunca pasaron por n8n: `resultado` es NULL.
  it('una remisión sin resultado no lleva adjuntos y no revienta', async () => {
    await insTicket('app-4', 4)
    await db.query(
      "INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('r3','app-4','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z')",
    )
    const { mensajes } = await getConversacionTicket(db, 'app-4')
    expect(mensajes[0].attachments).toBeUndefined()
  })

  it('una carpetaUrl que no sea https no produce adjunto', async () => {
    await insTicket('app-5', 5)
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at)
       VALUES ('r4','app-5','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z')`,
      [JSON.stringify({ carpetaUrl: 'javascript:alert(1)' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-5')
    expect(mensajes[0].attachments).toBeUndefined()
  })

  // El hilo registra lo que pasó, y una remisión anulada pasó.
  it('una remisión anulada aparece igual', async () => {
    await insTicket('app-6', 6)
    await db.query(
      "INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at,anulada_at,anulada_por) VALUES ('r5','app-6','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z','2026-08-05T09:00:00Z','Admin')",
    )
    const { mensajes } = await getConversacionTicket(db, 'app-6')
    expect(mensajes).toHaveLength(1)
  })

  it('una transición lista sus campos diligenciados', async () => {
    await insTicket('app-7', 7)
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at,values) VALUES ('app-7','Diagnosticar','Ingresado','En Proceso','Taller','Juan','2026-08-03T10:00:00Z',$1)",
      [JSON.stringify({ diagnostico: 'Sensor averiado' })],
    )
    const { mensajes } = await getConversacionTicket(db, 'app-7')
    expect(mensajes[0].content).toBe([
      'Diagnosticar: Ingresado → En Proceso',
      'Área: Taller',
      'Diagnostico: Sensor averiado',
    ].join('\n'))
  })

  it('mezcla las conversaciones de Zoho con lo generado, más reciente primero', async () => {
    await insTicket('t8', 8)
    await db.query(
      "INSERT INTO conversations (id,ticket_id,author_name,is_public,content,content_type,commented_time) VALUES ('c1','t8','Ana',false,'Nota de Zoho','text','2026-08-02T10:00:00Z')",
    )
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Habilitar','A','B','Admin','2026-08-03T10:00:00Z')")
    const { mensajes } = await getConversacionTicket(db, 't8')
    expect(mensajes.map((m) => m.author)).toEqual(['Admin', 'Ana'])
  })

  it('no le pide conversaciones a Zoho para un ticket nacido en la app', async () => {
    await insTicket('app-9', 9)
    expect((await getConversacionTicket(db, 'app-9')).sincronizarConZoho).toBe('no')
    await insTicket('98765', 10)
    expect((await getConversacionTicket(db, '98765')).sincronizarConZoho).toBe('ahora')
  })
})
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

```bash
npx vitest run apps/desk/server/db/conversacion.test.ts
```
Esperado: FAIL — no se puede resolver `./conversacion`.

⚠️ Comprueba la forma real de la tabla `conversations` en
`packages/zoho-sync/src/db/schema.sql` antes de dar por buena la inserción del último test. Si alguna
columna no se llama así, **ajusta el test, no inventes columnas**.

- [ ] **Paso 3: escribir el compositor**

Crear `apps/desk/server/db/conversacion.ts`.

⚠️ `getConversations` y `rowToMessage` ya los importa `apps/desk/server/routes/tickets.ts`. **Copia de
ahí sus rutas exactas** en vez de deducirlas: son las dos únicas que este plan no fija.

```ts
import type { Attachment, Message } from '@ambientalia/shared'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { urlSegura } from '@ambientalia/shared'
import { fmtTime } from '@ambientalia/zoho-sync/db/mappers'
import {
  datosTicket, etiquetaCampo, iso, json, lectorCreacion, listaIncluye, planSyncZoho, porFechaDesc,
  textoEquipo, type PlanSyncZoho,
} from './ticketFuentes'
// … más `getConversations` y `rowToMessage`, con las rutas que usa `routes/tickets.ts`.

export interface ConversacionTicket {
  mensajes: Message[]
  sincronizarConZoho: PlanSyncZoho
}

/** Un mensaje con su instante real al lado: `Message.time` viene ya formateado y ordenar por él sería ordenar alfabéticamente. */
interface Entrada { at: string | null; msg: Message }

/** Une las líneas que tienen contenido. Una línea vacía en medio de la prosa se lee como un descuido. */
function texto(lineas: Array<string | null | undefined>): string {
  return lineas.filter((l) => l != null && String(l).trim() !== '').join('\n')
}

const enlaceDrive = (id: unknown): string | null =>
  id ? urlSegura(`https://drive.google.com/file/d/${String(id)}/view`) : null
const enlaceDoc = (id: unknown): string | null =>
  id ? urlSegura(`https://docs.google.com/document/d/${String(id)}/edit`) : null

/**
 * Los adjuntos son ENLACES, no ficheros: la app no tiene credenciales de Google y no puede servirlos
 * por el proxy. `size` lleva el tipo en vez del tamaño porque de un fichero de Drive no lo sabemos y
 * la segunda línea de la tarjeta tiene que decir algo.
 */
function adjuntosRemision(resultado: Record<string, unknown>): Attachment[] {
  const posibles: Array<[string, string, string | null]> = [
    ['Remisión de entrada', 'PDF', enlaceDrive(resultado.pdfId)],
    ['Documento editable', 'Documento', enlaceDoc(resultado.docId)],
    ['Etiqueta .dymo', 'Etiqueta', enlaceDrive(resultado.dymoId)],
    ['Carpeta en Drive', 'Carpeta', urlSegura(resultado.carpetaUrl as string | null | undefined)],
  ]
  return posibles
    .filter(([, , url]) => url !== null)
    .map(([name, size, url]) => ({ name, size, path: url as string, url: url as string }))
}

function entradaCreacion(fila: Record<string, unknown>, ticket: Record<string, unknown>, cliente: string | null): Entrada {
  const de = lectorCreacion(fila.values, ticket)
  const equipo = textoEquipo(de('marca', 'marca'), de('modelo', 'modelo'), de('serial', 'serial'))
  const clas = de('clasificacion', 'classification')
  const prio = de('prioridad', 'priority')
  const at = iso(fila.performed_at)
  // Clasificación y prioridad comparten línea separadas por `·`, no una línea cada una: son dos
  // etiquetas cortas y darles renglón propio alarga la entrada sin aportar nada.
  const clasPrio = [
    clas ? `Clasificación: ${clas}` : null,
    prio ? `Prioridad: ${prio}` : null,
  ].filter(Boolean).join(' · ')
  return {
    at,
    msg: {
      id: `crea-${String(fila.ticket_id)}`,
      author: (fila.performed_by as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        cliente ? `Ticket creado para ${cliente}.` : 'Ticket creado.',
        equipo ? `Equipo: ${equipo}` : null,
        de('tipo_servicio', 'tipo_servicio') ? `Tipo de servicio: ${de('tipo_servicio', 'tipo_servicio')}` : null,
        de('orden_venta', 'orden_venta') ? `Orden de venta: ${de('orden_venta', 'orden_venta')}` : null,
        clasPrio || null,
      ]),
    },
  }
}

function entradaTransicion(fila: Record<string, unknown>): Entrada {
  const v = json(fila.values)
  const at = iso(fila.performed_at)
  const campos = Object.entries(v)
    .filter(([, val]) => val != null && String(val).trim() !== '')
    .map(([k, val]) => `${etiquetaCampo(k)}: ${String(val)}`)
  return {
    at,
    msg: {
      id: `tr-${String(fila.ticket_id)}-${String(fila.performed_at)}-${String(fila.transition_name)}`,
      author: (fila.performed_by as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        `${String(fila.transition_name ?? 'Transición')}: ${String(fila.from_status ?? '—')} → ${String(fila.to_status ?? '—')}`,
        fila.area ? `Área: ${String(fila.area)}` : null,
        ...campos,
      ]),
    },
  }
}

function entradaRemision(fila: Record<string, unknown>): Entrada {
  const incluye = listaIncluye(fila.incluye)
  const resultado = json(fila.resultado)
  const fotos = resultado.fotos as { subidas?: number } | undefined
  const at = iso(fila.created_at)
  const adjuntos = adjuntosRemision(resultado)
  const servicio = fila.tipo_servicio ? String(fila.tipo_servicio) : 'servicio técnico'
  return {
    at,
    msg: {
      id: `rem-${String(fila.id)}`,
      author: (fila.creado_por as string) ?? 'App',
      type: 'Privado',
      time: fmtTime(at),
      content: texto([
        `El equipo ingresa para ${servicio}.`,
        fila.observaciones,
        incluye ? `Incluye: ${incluye}` : null,
        fotos?.subidas ? `Registro fotográfico: ${fotos.subidas} ${fotos.subidas === 1 ? 'foto' : 'fotos'}` : null,
        fila.anulada_at ? `Remisión anulada por ${String(fila.anulada_por ?? 'un administrador')}.` : null,
      ]),
      attachments: adjuntos.length ? adjuntos : undefined,
    },
  }
}

/** Más reciente primero, con los que no tienen fecha al final: es el orden que el panel ya usa. */
const masRecientePrimero = porFechaDesc<Entrada>((e) => e.at)

/**
 * El hilo del ticket: las conversaciones de Zoho más una entrada por etapa ocurrida en la app. Se
 * DERIVA al leer y no se registran mensajes nuevos, que es lo que hace que aparezca solo lo que ya
 * existe —las 149 remisiones migradas incluidas—.
 */
export async function getConversacionTicket(db: Queryable, ticketId: string): Promise<ConversacionTicket> {
  const zoho = await getConversations(db, ticketId)
  const deZoho: Entrada[] = zoho.map(({ row, attachments }) => ({
    at: iso((row as Record<string, unknown>).commented_time),
    msg: rowToMessage(row, attachments),
  }))

  const { ticket, cliente } = await datosTicket(db, ticketId)

  const tr = await db.query(
    'SELECT ticket_id, transition_name, from_status, to_status, area, performed_by, performed_at, values FROM ticket_transitions WHERE ticket_id = $1',
    [ticketId],
  )
  const deTransiciones = (tr.rows as Record<string, unknown>[]).map((f) =>
    f.from_status === '(creación)' ? entradaCreacion(f, ticket, cliente) : entradaTransicion(f),
  )

  // No se reutiliza `listRemisionesByTicket` porque filtra `anulada_at IS NULL`, y aquí hacen falta:
  // el hilo registra lo que pasó, y una remisión anulada pasó.
  const rem = await db.query(
    `SELECT id, tipo, tipo_servicio, incluye, observaciones, creado_por, resultado, created_at, anulada_at, anulada_por
       FROM remisiones WHERE ticket_id = $1`,
    [ticketId],
  )
  const deRemisiones = (rem.rows as Record<string, unknown>[]).map(entradaRemision)

  const mensajes = [...deZoho, ...deTransiciones, ...deRemisiones].sort(masRecientePrimero).map((e) => e.msg)
  return { mensajes, sincronizarConZoho: planSyncZoho(ticketId, zoho.length > 0) }
}
```

- [ ] **Paso 4: ejecutar el test y ver que pasa**

```bash
npx vitest run apps/desk/server/db/conversacion.test.ts
```
Esperado: PASS, 9 tests.

Si alguno falla por el formato exacto del texto, **lee el fallo antes de tocar el test**: puede que el
compositor tenga un separador de más, y ajustar el test escondería el defecto.

---

### Tarea 5: la ruta y la prueba de punta a punta

**Ficheros:**
- Modificar: `apps/desk/server/routes/tickets.ts`
- Modificar: `apps/desk/server/app.test.ts`

- [ ] **Paso 1: la ruta**

Añadir el import:

```ts
import { getConversacionTicket } from '../db/conversacion'
```

Sustituir el cuerpo del handler `GET /api/tickets/:id/conversations` por:

```ts
    const id = String(req.params.id)
    const primero = await getConversacionTicket(db, id)
    // Antes se miraba `convs.length === 0`, y un ticket nacido en la app NUNCA tiene conversaciones de
    // Zoho: ese `if` se cumplía siempre y la ruta esperaba a una llamada a Zoho en cada apertura, por
    // un ticket que Zoho no conoce.
    if (primero.sincronizarConZoho === 'ahora') {
      try { await sync.syncConversations(id) } catch (err) { req.log.warn({ err, ticketId: id }, 'syncConversations (lazy) falló') }
      res.json((await getConversacionTicket(db, id)).mensajes)
      return
    }
    if (primero.sincronizarConZoho === 'en-segundo-plano') {
      void sync.syncConversations(id).catch((err) => req.log.warn({ err, ticketId: id }, 'syncConversations bg falló'))
    }
    res.json(primero.mensajes)
```

Nota: el `await sync.syncConversations(id)` pasa a estar dentro de un `try`. Antes no lo estaba, así
que un fallo de Zoho tumbaba la petición entera con un 500; ahora degrada a devolver lo que haya.

- [ ] **Paso 2: la prueba de punta a punta**

Añadir a `apps/desk/server/app.test.ts`, en el `describe` que cubra las conversaciones (o uno nuevo si
no existe):

```ts
describe('GET /api/tickets/:id/conversations (hilo compuesto)', () => {
  it('mezcla la creación, la remisión y el correo de Zoho; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('app-c1',701,'A','Ingresado')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('app-c1','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-1', marca: 'Grimm', modelo: 'EDM180C', serial: 'S1' })])
    await db.query("INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,creado_por,estado,created_at) VALUES ('rc1','app-c1','entrada','2026-08-02','Calibración','Julián','ok','2026-08-02T14:00:00Z')")

    const { app } = appWith()
    const res = await request(app).get('/api/tickets/app-c1/conversations').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((m: { author: string }) => m.author)).toEqual(['Julián', 'Luz'])
    expect(res.body[1].content).toContain('Equipo: Grimm EDM180C · serie S1')
    expect((await request(app).get('/api/tickets/app-c1/conversations')).status).toBe(401)
  })
})
```

- [ ] **Paso 3: verificación final desde la RAÍZ**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Esperado: typecheck limpio; lint `0 errors, 159 warnings`; build ok. La suite acabó en **405 pasando / 2
a 391 → **405 pasando / 2 saltados**.

(La previsión inicial era 401. La Tarea 4 acabó añadiendo cuatro tests más de los planeados: el
importador anclando `created_at`, el backfill de `schema.sql`, la remisión de salida, y en esta tarea
el que fija que un Zoho caído degrada a 200 en vez de 500.)

Si el número no cuadra, **no lo ajustes al que salga**: averigua qué sobra o falta.

- [ ] **Paso 4: commit**

```bash
git add apps/desk/server/db/conversacion.ts apps/desk/server/db/conversacion.test.ts apps/desk/server/routes/tickets.ts apps/desk/server/app.test.ts
git commit -m "feat(desk): CONVERSACIONES cuenta el ticket como un hilo legible

Una entrada por etapa —creación, remisión, transición—, firmada por quien la
ejecutó y con los adjuntos enlazados a Drive. Se deriva al leer, así que
aparece sola la historia que ya existe, las 149 remisiones migradas incluidas.

La prosa no se inventa: las observaciones que escribió el técnico van tal cual,
que es lo que hacía legible el hilo de comentarios privados de Zoho.

De paso, el sync perezoso deja de pedirle a Zoho las conversaciones de un
ticket nacido en la app: como esos nunca tienen ninguna, la condición vieja se
cumplía SIEMPRE y se esperaba a Zoho en cada apertura."
```

---

## Fuera de alcance

- **Redacción propia por transición.** Hoy todas comparten forma genérica; se irá definiendo.
- **Adjuntar ficheros de verdad.** Se enlaza. Adjuntar exigiría que n8n mande los bytes o dar
  credenciales de Drive a la app.
- **Escribir entradas a mano.** El hilo es generado; no hay caja de texto.
- **Las fotos como miniaturas.** Se dice cuántas hay; verlas es abrir la carpeta.
- **Backfill de `dymoId`** para las remisiones anteriores a la Tarea 1: el id no se puede reconstruir.
