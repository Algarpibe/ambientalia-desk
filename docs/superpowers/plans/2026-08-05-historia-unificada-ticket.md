# Historia unificada del ticket — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o
> `superpowers:executing-plans` para ejecutar tarea a tarea. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que la pestaña HISTORIA del detalle del ticket muestre en una sola línea de tiempo cómo
nació el ticket, todas sus transiciones —de Zoho y de la app— con los campos diligenciados, y sus
remisiones con desenlace y anulación.

**Arquitectura:** la historia se **deriva al leer**, uniendo tres fuentes (`ticket_history`,
`ticket_transitions`, `remisiones`). No se registran eventos nuevos, así que aparece sola la historia
que ya existe. La composición vive en la app Desk, no en el motor de sync de Zoho, porque lee tablas
que son de la app. El frontend no se toca: los eventos nuevos entran por el molde que `HistoriaPanel`
ya renderiza.

**Stack:** TypeScript, Express 5, React, vitest + pg-mem + supertest. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-08-05-historia-unificada-ticket-design.md`

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `packages/shared/src/remision.ts` (modificar) | Gana las etiquetas de estado y `urlSegura`, que ahora necesitan cliente **y** servidor |
| `packages/shared/src/remision.test.ts` (modificar) | Tests de lo anterior |
| `apps/desk/src/lib/remisionResultado.ts` (modificar) | Se queda con las clases de Tailwind; compone la etiqueta desde shared |
| `packages/zoho-sync/src/db/history.ts` (modificar) | `getZohoHistoryEvents`: solo Zoho. Pierde el fallback, que sube un nivel |
| `packages/zoho-sync/src/db/repo.ts` (modificar) | `createTicket` guarda el payload completo en `values` |
| `apps/desk/server/db/historial.ts` (**nuevo**) | Compone las tres fuentes → `HistoryEvent[]` |
| `apps/desk/server/db/historial.test.ts` (**nuevo**) | Tests del compositor |
| `apps/desk/server/routes/tickets.ts` (modificar) | La ruta usa el compositor y decide el sync perezoso mejor |

**Nota sobre `urlSegura`:** el spec solo menciona mover las etiquetas. Se mueve también `urlSegura`
porque el servidor la necesita por el mismo motivo (el enlace de Drive se compone ahora ahí) y
duplicarla incurriría en la misma contradicción que el spec rechaza para las etiquetas.

---

### Tarea 1: etiquetas de estado y `urlSegura` a `packages/shared`

**Ficheros:**
- Modificar: `packages/shared/src/remision.ts`
- Modificar: `apps/desk/src/lib/remisionResultado.ts`
- Test: `packages/shared/src/remision.test.ts`

- [ ] **Paso 1: escribir el test que falla**

Añadir al final de `packages/shared/src/remision.test.ts` (el fichero ya existe y ya tiene
`import { describe, it, expect } from 'vitest'`; añade a ese import lo que falte):

```ts
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura } from './remision'

describe('ETIQUETA_ESTADO_REMISION', () => {
  it('traduce los cuatro estados conocidos', () => {
    expect(ETIQUETA_ESTADO_REMISION.pendiente).toBe('Enviando…')
    expect(ETIQUETA_ESTADO_REMISION.ok).toBe('Creada')
    expect(ETIQUETA_ESTADO_REMISION.ok_con_avisos).toBe('Creada con avisos')
    expect(ETIQUETA_ESTADO_REMISION.error).toBe('Falló')
  })

  // La columna no tiene CHECK y `toRemision` castea sin validar: indexar este mapa TIENE que poder
  // fallar sin lanzar, o un estado inesperado tumbaría la pantalla entera.
  it('un estado desconocido no está en el mapa y tiene su valor por defecto', () => {
    expect(ETIQUETA_ESTADO_REMISION['inventado']).toBeUndefined()
    expect(ETIQUETA_ESTADO_REMISION_DESCONOCIDA).toBe('Estado desconocido')
  })
})

describe('urlSegura', () => {
  it('acepta https y rechaza todo lo demás', () => {
    expect(urlSegura('https://drive.google.com/x')).toBe('https://drive.google.com/x')
    expect(urlSegura('http://drive.google.com/x')).toBeNull()
    expect(urlSegura('javascript:alert(1)')).toBeNull()
    expect(urlSegura(null)).toBeNull()
    expect(urlSegura(undefined)).toBeNull()
  })
})
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

Desde la RAÍZ del repo:

```bash
npx vitest run packages/shared/src/remision.test.ts
```

Esperado: FAIL — `ETIQUETA_ESTADO_REMISION` no se exporta desde `./remision`.

- [ ] **Paso 3: mover el texto a shared**

Añadir al final de `packages/shared/src/remision.ts`:

```ts
/**
 * Etiquetas en español del `estado` de una remisión. Viven aquí y no en la capa de presentación
 * porque las necesitan las dos orillas: las pantallas de remisiones y la historia del ticket, que se
 * compone en el servidor. Solo el TEXTO — las clases de Tailwind se quedan en el cliente, que es el
 * único que las entiende.
 *
 * Tipado como `Record<string, string>` y no `Record<Remision['estado'], string>` a propósito:
 * `estado` sale de Postgres con un cast sin validar y la columna no tiene `CHECK`, así que el tipo
 * promete uno de estos cuatro valores pero la base no lo garantiza. Indexarlo debe poder fallar sin
 * lanzar — de ahí `ETIQUETA_ESTADO_REMISION_DESCONOCIDA`.
 */
export const ETIQUETA_ESTADO_REMISION: Record<string, string> = {
  pendiente: 'Enviando…',
  ok: 'Creada',
  ok_con_avisos: 'Creada con avisos',
  error: 'Falló',
}
export const ETIQUETA_ESTADO_REMISION_DESCONOCIDA = 'Estado desconocido'

/**
 * `carpetaUrl` llega de n8n por el callback, sin validar, y acaba en un `href`. El callback está tras
 * un secreto compartido, así que el riesgo es bajo, pero es la única entrada de estos paneles que
 * llega a un atributo peligroso: si el secreto se filtrara, un `javascript:` colado ahí se ejecutaría
 * al clic. Exigir `https://` cierra esa puerta sin coste — mejor sin enlace que con uno malo.
 *
 * En shared porque ahora la usan el cliente (paneles de remisión) y el servidor (historia del ticket).
 */
export function urlSegura(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.startsWith('https://') ? v : null
}
```

- [ ] **Paso 4: que el cliente componga desde shared**

En `apps/desk/src/lib/remisionResultado.ts`:

Cambiar el import de la primera línea por:

```ts
import type { RemisionPasoFallido } from '@ambientalia/shared'
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA } from '@ambientalia/shared'
```

Borrar la función `urlSegura` entera (su docstring incluido) y reexportarla desde shared, para no
tocar los tres ficheros que la importan de aquí:

```ts
// Se mudó a `packages/shared` porque el servidor la necesita para la historia del ticket. Se
// reexporta para que los paneles la sigan importando de donde siempre.
export { urlSegura } from '@ambientalia/shared'
```

Sustituir el bloque de `ESTADO_REMISION` y `ESTADO_REMISION_DESCONOCIDA` (desde su docstring hasta
la línea de `ESTADO_REMISION_DESCONOCIDA`, inclusive) por:

```ts
/**
 * Clases de Tailwind por estado. El TEXTO vive en `packages/shared` porque lo necesita también el
 * servidor; aquí queda solo lo que es de cliente. Se componen para que las pantallas sigan
 * consumiendo un único objeto `{ label, className }` y no tengan que juntar dos mapas cada una.
 */
const CLASES_ESTADO_REMISION: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
  ok: 'bg-green-50 text-green-700 border-green-200',
  ok_con_avisos: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-600 border-red-100',
}

export const ESTADO_REMISION: Record<string, { label: string; className: string }> = Object.fromEntries(
  Object.entries(ETIQUETA_ESTADO_REMISION).map(([k, label]) => [k, { label, className: CLASES_ESTADO_REMISION[k] ?? '' }]),
)

// Sin este valor por defecto, un estado fuera de los cuatro conocidos tumbaría el render de TODA la
// vista que lo use —no solo la fila—: no hay ErrorBoundary en el árbol que lo contenga.
export const ESTADO_REMISION_DESCONOCIDA = {
  label: ETIQUETA_ESTADO_REMISION_DESCONOCIDA,
  className: 'bg-slate-100 text-slate-500 border-slate-200',
}
```

- [ ] **Paso 5: verificar desde la RAÍZ**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Esperado: typecheck limpio; lint `0 errors` (160 warnings preexistentes); build ok; y la suite
**sube en 3** respecto a la base de 376 pasando / 2 saltados → **379 / 2**.

Las cuentas de este plan se dan como incremento y no como total absoluto a propósito: si el número
que sale no cuadra, **no lo ajustes al que salga** — averigua qué test sobra o falta.

- [ ] **Paso 6: commit**

```bash
git add packages/shared/src/remision.ts packages/shared/src/remision.test.ts apps/desk/src/lib/remisionResultado.ts
git commit -m "refactor(shared): etiquetas de estado de remisión y urlSegura a shared

La historia del ticket se compone en el servidor y necesita las dos cosas.
Duplicarlas contradiría el motivo que el propio fichero tiene escrito ('un
único sitio: dos mapas iguales acaban divergiendo'), así que sube el texto y
el cliente se queda con las clases de Tailwind, que solo él entiende."
```

---

### Tarea 2: `createTicket` guarda el payload completo

**Ficheros:**
- Modificar: `packages/zoho-sync/src/db/repo.ts:323-327`
- Test: `packages/zoho-sync/src/db/repo.test.ts`

- [ ] **Paso 1: escribir el test que falla**

Añadir a `packages/zoho-sync/src/db/repo.test.ts` (usa los imports y el `beforeEach` que el fichero
ya tiene; si `createTicket` no está importado, añádelo al import de `./repo`):

```ts
// La transición de creación es el ÚNICO sitio donde puede quedar una foto de con qué nació el
// ticket: las columnas de `tickets` son estado actual y cualquier cosa podría reescribirlas. Antes
// solo se guardaba `orden_venta`, así que la historia tenía que leer la fila y mentir un poco.
it('createTicket guarda el payload completo en values de la transición', async () => {
  const id = await createTicket(db, {
    subject: 'MT_18A20070_EDM180C_260805', priority: 'Medium', classification: 'Garantía',
    tipoServicio: 'Calibración', equipo: 'Monitor', marca: 'Grimm', modelo: 'EDM180C',
    serial: '18A20070', codigoServicio: 'MT_260805', ordenVenta: 'OV-2026-141',
    clientId: 'c1', salesorderId: 'so1', equipoId: 'eq1', actor: 'Luz Ángela',
  })
  const r = await db.query('SELECT values FROM ticket_transitions WHERE ticket_id = $1', [id])
  const v = typeof r.rows[0].values === 'string' ? JSON.parse(r.rows[0].values) : r.rows[0].values
  expect(v).toMatchObject({
    orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070',
    tipo_servicio: 'Calibración', clasificacion: 'Garantía', prioridad: 'Medium',
    codigo_servicio: 'MT_260805', client_id: 'c1',
  })
})
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

```bash
npx vitest run packages/zoho-sync/src/db/repo.test.ts -t "payload completo"
```

Esperado: FAIL — `values` solo contiene `orden_venta`.

- [ ] **Paso 3: guardar el payload**

En `packages/zoho-sync/src/db/repo.ts`, sustituir la llamada que inserta la transición de creación
(la que hoy pasa `JSON.stringify({ orden_venta: input.ordenVenta })`) por:

```ts
    // La foto de con qué nació el ticket. Las columnas de `tickets` son estado ACTUAL, así que la
    // historia no puede apoyarse en ellas para contar la creación: aquí queda congelado. Los tickets
    // anteriores a este cambio no la tienen y no hay forma de reconstruirla — la historia cae a la
    // fila del ticket para esos.
    await q.query(
      `INSERT INTO ticket_transitions (ticket_id,transition_id,transition_name,from_status,to_status,area,performed_by,values,comment_id)
       VALUES ($1,'enviar','Enviar','(creación)','OV asignada','Comercial',$2,$3,null)`,
      [id, input.actor, JSON.stringify({
        orden_venta: input.ordenVenta, marca: input.marca, modelo: input.modelo, serial: input.serial,
        equipo: input.equipo, tipo_servicio: input.tipoServicio, clasificacion: input.classification,
        prioridad: input.priority, codigo_servicio: input.codigoServicio, client_id: input.clientId,
      })],
    )
```

- [ ] **Paso 4: ejecutar el test y ver que pasa**

```bash
npx vitest run packages/zoho-sync/src/db/repo.test.ts -t "payload completo"
```

Esperado: PASS.

- [ ] **Paso 5: commit**

```bash
git add packages/zoho-sync/src/db/repo.ts packages/zoho-sync/src/db/repo.test.ts
git commit -m "feat(desk): la transición de creación guarda el payload completo

Era el único sitio donde puede quedar una foto de con qué nació el ticket, y
solo guardaba orden_venta. Sin ella, la historia tiene que leer las columnas
de tickets, que son estado actual y no lo que se tecleó ese día. Los tickets
ya creados no la ganan: eso no tiene arreglo retroactivo."
```

---

### Tarea 3: `history.ts` se queda solo con Zoho

**Ficheros:**
- Modificar: `packages/zoho-sync/src/db/history.ts:21-36`
- Modificar: `packages/zoho-sync/src/db/history.test.ts`

- [ ] **Paso 1: mover el test del fallback fuera**

En `packages/zoho-sync/src/db/history.test.ts`, **borrar entero** el test
`'fallback a ticket_transitions cuando no hay historial'`. Su cobertura renace en la Tarea 4, sobre
el compositor, que es donde el fallback pasa a vivir.

Cambiar el import de la primera línea de tests:

```ts
import { upsertHistoryEvent, getZohoHistoryEvents } from './history'
```

Y en el test que queda, cambiar la llamada:

```ts
    const h = await getZohoHistoryEvents(db, 't1')
```

- [ ] **Paso 2: renombrar y quitar el fallback**

En `packages/zoho-sync/src/db/history.ts`, sustituir la función `getTicketHistory` entera por:

```ts
/**
 * Solo los eventos que vinieron de Zoho. NO cae a `ticket_transitions`: componer la historia
 * completa es trabajo de `apps/desk/server/db/historial.ts`, porque mezcla tablas de la app Desk
 * —`remisiones`— que este paquete, que es el motor de sync de Zoho, no tiene por qué conocer.
 *
 * El `else` que había aquí ocultaba datos: un ticket que vino de Zoho y luego se movió en la app
 * enseñaba las transiciones de Zoho y NINGUNA de la app.
 */
export async function getZohoHistoryEvents(db: Queryable, ticketId: string): Promise<HistoryEvent[]> {
  const r = await db.query('SELECT raw FROM ticket_history WHERE ticket_id=$1 ORDER BY event_time DESC NULLS LAST', [ticketId])
  return (r.rows as any[]).map((x) => mapHistoryEvent(typeof x.raw === 'string' ? JSON.parse(x.raw) : x.raw))
}
```

- [ ] **Paso 3: verificar que compila y que el test que queda pasa**

```bash
npx vitest run packages/zoho-sync/src/db/history.test.ts
```

Esperado: PASS, 1 test.

`npm run typecheck` va a **fallar** aquí, porque `apps/desk/server/routes/tickets.ts` sigue
importando `getTicketHistory`. Es esperado y lo arregla la Tarea 5. No lo arregles ahora ni hagas
commit todavía: sigue con la Tarea 4 y commitea al final de la 5.

---

### Tarea 4: el compositor

**Ficheros:**
- Crear: `apps/desk/server/db/historial.ts`
- Test: `apps/desk/server/db/historial.test.ts`

- [ ] **Paso 1: escribir el test que falla**

Crear `apps/desk/server/db/historial.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getHistorialTicket } from './historial'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const insTicket = (id: string) =>
  db.query("INSERT INTO tickets (id,number,subject,status) VALUES ($1,1,'A','Ingresado')", [id])

describe('getHistorialTicket', () => {
  // La regresión que motiva todo esto: antes era `if (Zoho) else (app)`, así que un ticket con las
  // dos cosas solo enseñaba las de Zoho.
  it('devuelve los eventos de Zoho Y las transiciones de la app', async () => {
    await insTicket('t1')
    await db.query(
      "INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', eventTime: '2026-08-01T10:00:00Z', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })],
    )
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,area,performed_by,performed_at) VALUES ('t1','Habilitar Servicio','OV asignada','Ingresado','Comercial','Admin','2026-08-02T10:00:00Z')")
    const { eventos } = await getHistorialTicket(db, 't1')
    expect(eventos.map((e) => e.title)).toEqual([
      'Transición: Habilitar Servicio',
      'Ana ha publicado un comentario',
    ])
  })

  it('la fila de creación sale como "Ticket creado" con los datos de la foto', async () => {
    await insTicket('t2')
    await db.query(
      "INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t2','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-2026-141', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070', tipo_servicio: 'Calibración' })],
    )
    const { eventos } = await getHistorialTicket(db, 't2')
    expect(eventos[0].title).toBe('Ticket creado')
    expect(eventos[0].actor).toBe('Luz')
    expect(eventos[0].details).toContainEqual({ label: 'Orden de venta', value: 'OV-2026-141' })
    expect(eventos[0].details).toContainEqual({ label: 'Equipo', value: 'Grimm EDM180C · serie 18A20070' })
    expect(eventos[0].details).toContainEqual({ label: 'Tipo de servicio', value: 'Calibración' })
  })

  // Los tickets creados antes de guardar la foto: la historia cae a la fila del ticket.
  // El nombre del cliente NO está en `tickets`: hay que resolverlo contra la vista `clients`. Este
  // test existe porque es el único camino del compositor que toca otra tabla, y sin él quedaría sin
  // ejercitar hasta producción.
  it('resuelve el nombre del cliente y prefiere la empresa al contacto', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name,company_name) VALUES ('cli1','Edgar Barrera','SERAMBIENTE S.A.S.')")
    await db.query("INSERT INTO tickets (id,number,subject,status,client_id) VALUES ('tc',20,'A','Ingresado','cli1')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('tc','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-1' })])
    const { eventos } = await getHistorialTicket(db, 'tc')
    expect(eventos[0].details).toContainEqual({ label: 'Cliente', value: 'SERAMBIENTE S.A.S.' })
  })

  it('sin foto en values, la creación lee los datos de la fila del ticket', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,marca,modelo,serial) VALUES ('t3',3,'A','Ingresado','Horiba','APNA-370','VMH2YJP3')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t3','Enviar','(creación)','OV asignada','Luz','2026-08-01T09:00:00Z',$1)",
      [JSON.stringify({ orden_venta: 'OV-9' })])
    const { eventos } = await getHistorialTicket(db, 't3')
    expect(eventos[0].details).toContainEqual({ label: 'Equipo', value: 'Horiba APNA-370 · serie VMH2YJP3' })
  })

  it('una transición normal expone un detalle por campo diligenciado', async () => {
    await insTicket('t4')
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at,values) VALUES ('t4','Diagnosticar','Ingresado','En Proceso','Juan','2026-08-03T10:00:00Z',$1)",
      [JSON.stringify({ diagnostico: 'Sensor averiado', requiere_repuestos: 'Sí' })])
    const { eventos } = await getHistorialTicket(db, 't4')
    expect(eventos[0].details).toContainEqual({ label: 'Estado', value: 'Ingresado → En Proceso' })
    expect(eventos[0].details).toContainEqual({ label: 'Diagnostico', value: 'Sensor averiado' })
    expect(eventos[0].details).toContainEqual({ label: 'Requiere repuestos', value: 'Sí' })
  })

  it('una remisión resuelta produce creada + desenlace, con el enlace a Drive', async () => {
    await insTicket('t5')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,incluye,observaciones,creado_por,estado,resultado,created_at,resuelto_at)
       VALUES ('r1','t5','entrada','2026-08-04','Calibración','["Cabezal","tubo"]'::jsonb,'Sin caja','Julián','ok',$1,'2026-08-04T14:00:00Z','2026-08-04T14:01:00Z')`,
      [JSON.stringify({ carpetaUrl: 'https://drive.google.com/carpeta', fotos: { recibidas: 3, subidas: 3 } })],
    )
    const { eventos } = await getHistorialTicket(db, 't5')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión: Creada', 'Remisión de entrada creada'])
    expect(eventos[1].details).toContainEqual({ label: 'Técnico', value: 'Julián' })
    expect(eventos[1].details).toContainEqual({ label: 'Incluye', value: 'Cabezal, tubo' })
    expect(eventos[1].details).toContainEqual({ label: 'Observaciones', value: 'Sin caja' })
    expect(eventos[0].details).toContainEqual({ label: 'Carpeta en Drive', value: '<a href="https://drive.google.com/carpeta" target="_blank" rel="noopener noreferrer">Abrir carpeta</a>', html: true })
  })

  // Una remisión anulada PASÓ. El historial registra lo que pasó, no lo que sigue vigente.
  it('una remisión anulada aparece, con su tercer evento', async () => {
    await insTicket('t6')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at,anulada_at,anulada_por)
       VALUES ('r2','t6','entrada','2026-08-04','Julián','ok','2026-08-04T14:00:00Z','2026-08-05T09:00:00Z','Admin')`,
    )
    const { eventos } = await getHistorialTicket(db, 't6')
    expect(eventos.map((e) => e.title)).toEqual(['Remisión anulada', 'Remisión de entrada creada'])
    expect(eventos[0].details).toContainEqual({ label: 'Anulada por', value: 'Admin' })
  })

  it('una carpetaUrl que no sea https no produce enlace', async () => {
    await insTicket('t7')
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,resultado,created_at,resuelto_at)
       VALUES ('r3','t7','entrada','2026-08-04','Julián','ok',$1,'2026-08-04T14:00:00Z','2026-08-04T14:01:00Z')`,
      [JSON.stringify({ carpetaUrl: 'javascript:alert(1)' })],
    )
    const { eventos } = await getHistorialTicket(db, 't7')
    expect(eventos[0].details.some((d) => d.label === 'Carpeta en Drive')).toBe(false)
  })

  it('ordena todo por fecha descendente', async () => {
    await insTicket('t8')
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Uno','A','B','X','2026-08-01T10:00:00Z')")
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t8','Tres','B','C','X','2026-08-03T10:00:00Z')")
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('r4','t8','entrada','2026-08-02','X','pendiente','2026-08-02T10:00:00Z')`,
    )
    const { eventos } = await getHistorialTicket(db, 't8')
    expect(eventos.map((e) => e.title)).toEqual([
      'Transición: Tres', 'Remisión de entrada creada', 'Transición: Uno',
    ])
  })

  // El sync perezoso preguntaba "¿está vacío el historial?". Con la unión eso ya no distingue nada:
  // un ticket de la app SIEMPRE tiene su transición de creación, así que preguntaría a Zoho por un
  // ticket que Zoho no conoce, en cada apertura.
  it('dice si hay que pedirle la historia a Zoho, y no la pide para un ticket de la app', async () => {
    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('t9',9,'A','Ingresado',true)")
    expect((await getHistorialTicket(db, 't9')).sincronizarConZoho).toBe('no')

    await db.query("INSERT INTO tickets (id,number,subject,status,managed_by_app) VALUES ('t10',10,'A','Ingresado',false)")
    expect((await getHistorialTicket(db, 't10')).sincronizarConZoho).toBe('ahora')

    await db.query(
      "INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h10','t10','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [] })],
    )
    expect((await getHistorialTicket(db, 't10')).sincronizarConZoho).toBe('en-segundo-plano')
  })
})
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

```bash
npx vitest run apps/desk/server/db/historial.test.ts
```

Esperado: FAIL — no se puede resolver `./historial`.

- [ ] **Paso 3: escribir el compositor**

Crear `apps/desk/server/db/historial.ts`:

```ts
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { HistoryDetail, HistoryEvent, RemisionResultado } from '@ambientalia/shared'
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura } from '@ambientalia/shared'
import { getZohoHistoryEvents } from '@ambientalia/zoho-sync/db/history'

/**
 * Qué hacer con Zoho antes de responder. Sustituye al viejo "¿está vacío el historial?", que con la
 * unión ya no distingue nada: un ticket de la app siempre tiene al menos su transición de creación.
 */
export type PlanSyncZoho = 'no' | 'ahora' | 'en-segundo-plano'

export interface HistorialTicket {
  eventos: HistoryEvent[]
  sincronizarConZoho: PlanSyncZoho
}

/** `timestamptz`: pg y pg-mem lo entregan como `Date`; el histórico puede traer texto. */
const iso = (v: unknown): string | null => (v instanceof Date ? v.toISOString() : v ? String(v) : null)

/** `jsonb`: pg lo entrega parseado, pg-mem como texto. */
const json = (v: unknown): Record<string, unknown> =>
  typeof v === 'string' ? (JSON.parse(v) as Record<string, unknown>) : ((v as Record<string, unknown>) ?? {})

/** Descarta los detalles vacíos: una lista de seis "—" no informa de nada. */
function detalles(pares: Array<[string, unknown]>): HistoryDetail[] {
  return pares
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([label, v]) => ({ label, value: String(v) }))
}

/**
 * `values` guarda las claves con el nombre técnico del campo (`requiere_repuestos`). No se traducen
 * con un diccionario a propósito: el conjunto de campos lo decide el Blueprint y un diccionario
 * quedaría desactualizado en silencio el día que alguien añada uno.
 */
function etiquetaCampo(clave: string): string {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** "Grimm EDM180C · serie 18A20070", saltándose lo que falte. */
function textoEquipo(marca: unknown, modelo: unknown, serial: unknown): string {
  const nombre = [marca, modelo].filter((x) => x != null && String(x).trim() !== '').join(' ')
  const s = serial != null && String(serial).trim() !== '' ? `serie ${serial}` : ''
  return [nombre, s].filter(Boolean).join(' · ')
}

function eventoCreacion(fila: Record<string, unknown>, ticket: Record<string, unknown>, cliente: string | null): HistoryEvent {
  const v = json(fila.values)
  // Hay foto o no la hay: se decide UNA vez, no campo a campo. Los tickets anteriores a que se
  // guardara el payload completo dejaron en `values` solo `orden_venta`, así que la presencia de
  // cualquier otra clave es el discriminador. Mezclar con `v[c] ?? ticket[col]` sería un error
  // sutil: la foto guarda los `null` explícitos, de modo que un campo que el técnico dejó vacío ese
  // día caería a la columna y mostraría el estado ACTUAL — justo la mentira que la foto evita.
  const hayFoto = Object.keys(v).some((k) => k !== 'orden_venta')
  const de = (clave: string, columna: string): unknown => (hayFoto ? v[clave] : ticket[columna])
  return {
    eventName: 'AppTicketCreado',
    time: iso(fila.performed_at),
    actor: (fila.performed_by as string) ?? 'App',
    title: 'Ticket creado',
    details: detalles([
      ['Cliente', cliente],
      ['Orden de venta', de('orden_venta', 'orden_venta')],
      ['Equipo', textoEquipo(de('marca', 'marca'), de('modelo', 'modelo'), de('serial', 'serial'))],
      ['Tipo de servicio', de('tipo_servicio', 'tipo_servicio')],
      ['Clasificación', de('clasificacion', 'classification')],
      ['Prioridad', de('prioridad', 'priority')],
      ['Código de servicio', de('codigo_servicio', 'codigo_servicio')],
    ]),
  }
}

function eventoTransicion(fila: Record<string, unknown>): HistoryEvent {
  const v = json(fila.values)
  return {
    eventName: 'AppTransition',
    time: iso(fila.performed_at),
    actor: (fila.performed_by as string) ?? 'App',
    title: `Transición: ${fila.transition_name ?? ''}`.trim(),
    details: [
      ...detalles([
        ['Estado', `${fila.from_status ?? '—'} → ${fila.to_status ?? '—'}`],
        ['Área', fila.area],
      ]),
      // La anotación de tupla es necesaria: sin ella `map` infiere `unknown[][]` y no encaja con
      // `Array<[string, unknown]>`.
      ...detalles(Object.entries(v).map(([k, val]): [string, unknown] => [etiquetaCampo(k), val])),
    ],
  }
}

/** `incluye` es un `jsonb` con un array: pg lo entrega parseado, pg-mem como texto. */
function listaIncluye(v: unknown): string {
  const arr = typeof v === 'string' ? JSON.parse(v) : v
  return Array.isArray(arr) ? arr.join(', ') : ''
}

function eventosRemision(fila: Record<string, unknown>): HistoryEvent[] {
  const lista = listaIncluye(fila.incluye)
  const tecnico = (fila.creado_por as string) ?? 'App'
  const out: HistoryEvent[] = [{
    eventName: 'RemisionCreada',
    time: iso(fila.created_at),
    actor: tecnico,
    title: 'Remisión de entrada creada',
    details: detalles([
      ['Técnico', tecnico],
      ['Fecha de servicio', fila.fecha instanceof Date ? fila.fecha.toISOString().slice(0, 10) : fila.fecha],
      ['Tipo de servicio', fila.tipo_servicio],
      ['Incluye', lista],
      ['Observaciones', fila.observaciones],
    ]),
  }]

  const resuelto = iso(fila.resuelto_at)
  if (resuelto) {
    const r = json(fila.resultado) as RemisionResultado
    const estado = String(fila.estado ?? '')
    const url = urlSegura(r.carpetaUrl)
    const enlace: HistoryDetail[] = url
      ? [{ label: 'Carpeta en Drive', value: `<a href="${url}" target="_blank" rel="noopener noreferrer">Abrir carpeta</a>`, html: true }]
      : []
    out.push({
      eventName: 'RemisionDesenlace',
      time: resuelto,
      actor: tecnico,
      title: `Remisión: ${ETIQUETA_ESTADO_REMISION[estado] ?? ETIQUETA_ESTADO_REMISION_DESCONOCIDA}`,
      details: [
        ...enlace,
        ...detalles([
          ['Fotos', r.fotos ? `${r.fotos.subidas} de ${r.fotos.recibidas}` : null],
          ['Avisos', (r.avisos ?? []).map((a) => a.paso).join(', ')],
          ['Fallos', (r.fallos ?? []).map((f) => f.paso).join(', ')],
        ]),
      ],
    })
  }

  const anulada = iso(fila.anulada_at)
  if (anulada) {
    out.push({
      eventName: 'RemisionAnulada',
      time: anulada,
      actor: (fila.anulada_por as string) ?? 'App',
      title: 'Remisión anulada',
      details: detalles([['Anulada por', fila.anulada_por]]),
    })
  }
  return out
}

/** Descendente por tiempo, con los que no lo tienen al final: es el orden que `HistoriaPanel` espera. */
function masRecientePrimero(a: HistoryEvent, b: HistoryEvent): number {
  const ta = a.time ? Date.parse(a.time) : NaN
  const tb = b.time ? Date.parse(b.time) : NaN
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
  if (Number.isNaN(ta)) return 1
  if (Number.isNaN(tb)) return -1
  return tb - ta
}

/**
 * Toda la historia del ticket en una sola línea de tiempo: lo que vino de Zoho, las transiciones de
 * la app y sus remisiones. Se DERIVA al leer y no se registran eventos nuevos, que es lo que hace
 * que aparezca sola la historia ya existente —las 149 remisiones migradas incluidas—.
 */
export async function getHistorialTicket(db: Queryable, ticketId: string): Promise<HistorialTicket> {
  const zoho = await getZohoHistoryEvents(db, ticketId)

  const t = await db.query(
    'SELECT marca, modelo, serial, tipo_servicio, classification, priority, orden_venta, codigo_servicio, client_id, managed_by_app FROM tickets WHERE id = $1',
    [ticketId],
  )
  const ticket = (t.rows[0] as Record<string, unknown>) ?? {}

  // Consulta aparte y no un JOIN: `clients` es una vista sobre `books.contacts` y pg-mem —el motor
  // de los tests— tropieza con los joins contra vistas de otro esquema.
  let cliente: string | null = null
  if (ticket.client_id) {
    const c = await db.query('SELECT name, company_name FROM clients WHERE id = $1', [ticket.client_id])
    const fila = c.rows[0] as Record<string, unknown> | undefined
    cliente = (fila?.company_name as string) || (fila?.name as string) || null
  }

  const tr = await db.query(
    'SELECT transition_name, from_status, to_status, area, performed_by, performed_at, values FROM ticket_transitions WHERE ticket_id = $1',
    [ticketId],
  )
  const transiciones = (tr.rows as Record<string, unknown>[]).map((f) =>
    f.from_status === '(creación)' ? eventoCreacion(f, ticket, cliente) : eventoTransicion(f),
  )

  const rem = await db.query(
    `SELECT id, fecha, tipo_servicio, incluye, observaciones, creado_por, estado, resultado,
            created_at, resuelto_at, anulada_at, anulada_por
       FROM remisiones WHERE ticket_id = $1`,
    [ticketId],
  )
  const remisiones = (rem.rows as Record<string, unknown>[]).flatMap(eventosRemision)

  const eventos = [...zoho, ...transiciones, ...remisiones].sort(masRecientePrimero)

  const sincronizarConZoho: PlanSyncZoho =
    ticket.managed_by_app ? 'no' : zoho.length === 0 ? 'ahora' : 'en-segundo-plano'

  return { eventos, sincronizarConZoho }
}
```

- [ ] **Paso 4: ejecutar el test y ver que pasa**

```bash
npx vitest run apps/desk/server/db/historial.test.ts
```

Esperado: PASS, 9 tests.

---

### Tarea 5: la ruta usa el compositor

**Ficheros:**
- Modificar: `apps/desk/server/routes/tickets.ts:8` y `:115-125`

- [ ] **Paso 1: cambiar el import**

Sustituir la línea que importa `getTicketHistory` desde `@ambientalia/zoho-sync/db/history` por:

```ts
import { getHistorialTicket } from '../db/historial'
```

- [ ] **Paso 2: reescribir el handler**

Sustituir el cuerpo del handler `GET /api/tickets/:id/history` (desde `const id = String(req.params.id)`
hasta el `res.json(...)` que lo cierra) por:

```ts
    const id = String(req.params.id)
    const primero = await getHistorialTicket(db, id)
    // Un ticket gestionado por la app no existe en Zoho: preguntarle por su historia sería un 404 en
    // cada apertura. Antes bastaba con mirar si la historia venía vacía, pero con la unión eso ya no
    // distingue nada —siempre trae al menos la transición de creación—.
    if (primero.sincronizarConZoho === 'ahora') {
      try { await sync.syncTicketHistory(id) } catch (err) { req.log.warn({ err, ticketId: id }, 'syncTicketHistory (lazy) falló') }
      res.json((await getHistorialTicket(db, id)).eventos)
      return
    }
    if (primero.sincronizarConZoho === 'en-segundo-plano') {
      void sync.syncTicketHistory(id).catch((err) => req.log.warn({ err, ticketId: id }, 'syncTicketHistory bg falló'))
    }
    res.json(primero.eventos)
```

- [ ] **Paso 3: verificar desde la RAÍZ**

```bash
npm run typecheck && npm run lint && npm run build && npm test
```

Esperado: typecheck limpio (el error que la Tarea 3 dejó abierto se cierra aquí); lint `0 errors`;
build ok.

Cuentas acumuladas desde la base de **376**: +3 (Tarea 1) +1 (Tarea 2) −1 (el test del fallback que
la Tarea 3 borra) +9 (Tarea 4) = **388 pasando / 2 saltados**.

- [ ] **Paso 4: commit**

```bash
git add packages/zoho-sync/src/db/history.ts packages/zoho-sync/src/db/history.test.ts apps/desk/server/db/historial.ts apps/desk/server/db/historial.test.ts apps/desk/server/routes/tickets.ts
git commit -m "feat(desk): historia del ticket unificada en una sola línea de tiempo

HISTORIA enseñaba las transiciones de Zoho O las de la app, nunca las dos: el
fallback de getTicketHistory era un else, así que un ticket que vino de Zoho y
luego se movió aquí no enseñaba jamás sus transiciones de la app. Y crear una
remisión no dejaba rastro en el ticket.

Ahora se componen tres fuentes al leer —ticket_history, ticket_transitions y
remisiones— sin registrar eventos nuevos, que es lo que hace que aparezca sola
la historia que ya existe, incluidas las 149 remisiones migradas.

La composición vive en la app y no en zoho-sync: lee remisiones, que es tabla
de Desk y el motor de sync no tiene por qué conocer.

De paso, el sync perezoso deja de preguntarle a Zoho por tickets de la app."
```

---

### Tarea 6: prueba de la ruta de punta a punta

**Ficheros:**
- Modificar: `apps/desk/server/app.test.ts`

- [ ] **Paso 1: escribir el test**

**Añadir** este `it` dentro del `describe('GET /api/tickets/:id/history', …)` que ya existe, sin
tocar los que hay. El primero de ellos se llama `'mapea el historial; fallback a transiciones; 401
sin sesión'` y su parte de *fallback* ya no describe el comportamiento actual (la historia de Zoho y
las transiciones salen ahora juntas, no una en lugar de la otra). **Ajusta ese test si sus
aserciones fallan, pero no lo borres**: lo que cubre del mapeo de Zoho y del 401 sigue haciendo
falta.

```ts
  it('compone Zoho + transiciones + remisiones en una sola línea de tiempo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t1',1,'A','Ingresado')")
    await db.query("INSERT INTO ticket_history (id,ticket_id,event_name,event_time,actor_name,raw) VALUES ('h1','t1','CommentAdded','2026-08-01T10:00:00Z','Ana',$1)",
      [JSON.stringify({ eventName: 'CommentAdded', actor: { name: 'Ana' }, eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Private' }] })])
    await db.query("INSERT INTO ticket_transitions (ticket_id,transition_name,from_status,to_status,performed_by,performed_at) VALUES ('t1','Habilitar','OV asignada','Ingresado','Admin','2026-08-02T10:00:00Z')")
    await db.query("INSERT INTO remisiones (id,ticket_id,tipo,fecha,creado_por,estado,created_at) VALUES ('rh1','t1','entrada','2026-08-03','Julián','pendiente','2026-08-03T10:00:00Z')")

    const { app } = appWith()
    const res = await request(app).get('/api/tickets/t1/history').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((e: { title: string }) => e.title)).toEqual([
      'Remisión de entrada creada',
      'Transición: Habilitar',
      'Ana ha publicado un comentario',
    ])
    expect((await request(app).get('/api/tickets/t1/history')).status).toBe(401)
  })
})
```

- [ ] **Paso 2: verificar desde la RAÍZ**

```bash
npm test
```

Esperado: **388 pasando / 2 saltados** — el `describe` viejo tenía dos tests y ahora tiene uno.

Si el `describe` original tenía otro número de tests, ajusta la cuenta pero **no** borres cobertura:
si alguno de los que sustituyes probaba algo que este no cubre, consérvalo aparte.

- [ ] **Paso 3: verificación final completa**

```bash
npm run typecheck && npm run lint && npm run build
```

Esperado: typecheck limpio; lint `0 errors, 160 warnings`; build `✓ built`.

- [ ] **Paso 4: commit**

```bash
git add apps/desk/server/app.test.ts
git commit -m "test(desk): la ruta de historia devuelve las tres fuentes compuestas"
```

---

## Fuera de alcance

- **Frontend.** `HistoriaPanel.tsx` no se toca: ya renderiza `HistoryEvent[]` con agrupación por día
  y sanea con DOMPurify los detalles marcados `html`.
- **Publicar nada en CONVERSACIONES.** Se queda para el correo real con el cliente.
- **Adjuntar el PDF de la remisión al ticket.** La app no tiene credenciales de Drive.
- **Paginar o plegar la línea de tiempo.** Son decenas de eventos, no miles. Riesgo asumido: un
  ticket con mucha historia de Zoho más varias remisiones da una pantalla larga. Si al usarla resulta
  ilegible, el arreglo natural es plegar por tipo de evento.
- **Backfill de la foto de creación** para los tickets ya creados: no se puede reconstruir.
