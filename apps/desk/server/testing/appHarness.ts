import { beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { CLAVE_CERTIFICADO_FABRICA, type Transition, type Cargo } from '@ambientalia/shared'
import type { EquipoRow } from '../db/equipos'
import { createApp } from '../app'
import { createUser } from '../auth/users'
import { createSession } from '../auth/sessions'
import { hashPassword } from '../auth/passwords'
import { createRole } from '../auth/roles'

/**
 * Arnés compartido por los ficheros de prueba HTTP del servidor.
 *
 * Vive aquí desde que `app.test.ts` se partió por dominios (F0-04): seis copias de esta cabecera
 * habrían derivado con el tiempo y una sola no. El fichero original tenía 3.010 líneas y consumía
 * 36 de los 40 segundos de la suite; partirlo no reduce el trabajo —siguen siendo 185 migraciones
 * de pg-mem— pero deja que vitest reparta los ficheros entre workers.
 *
 * `db` se exporta como `let` a propósito. Los enlaces vivos de ESM hacen que quien la importe vea
 * la reasignación de cada `beforeEach`, y así los cuerpos de las pruebas siguen escribiendo `db` a
 * secas: el partido no tuvo que tocar ni una línea de los 185 tests.
 */
export let db: Queryable

/**
 * Registra el `beforeEach` que levanta una base pg-mem NUEVA por prueba.
 *
 * Es lo que hace que las pruebas sean independientes del orden —verificado con
 * `vitest run --sequence.shuffle` antes de partir el fichero— y por eso el partido pudo ser
 * mecánico. Cada fichero de dominio la llama una vez, arriba del todo.
 */
export function instalarArnes(): void {
  beforeEach(async () => {
    const pg = newDb().adapters.createPg()
    db = new pg.Pool(); emularMezclaJsonb(db as unknown as ConPool)
    await migrate(db)
  })
}

/** Equipo al estilo de la carga inicial: `client_id` NULL y cliente solo como texto libre. */
export const equipoRow = (id: string, serial: string, cliente = 'Gecelca S.A. E.S.P.'): EquipoRow =>
  ({ id, serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10/PM2.5', cliente_nombre: cliente, source: 'seed', raw: null })

export function appWith(overrides: Partial<{ enableWrites: boolean; remisionCallbackToken: string; remisionWebhookUrl: string; avisosWebhookUrl: string; appBaseUrl: string; avisosCopiaEmail: string }> = {}, dbPropia?: Queryable) {
  // Los vacíos son los que devuelve `loadConfig` cuando la variable no está: dejar alguno `undefined`
  // probaría un config que en producción no existe.
  const config = { enableWrites: false, remisionWebhookUrl: '', remisionCallbackToken: '', avisosWebhookUrl: '', appBaseUrl: '', avisosCopiaEmail: '', ...overrides } as AppConfig
  const sync = { backfillTickets: vi.fn(), backfillArchivedTickets: vi.fn().mockResolvedValue(0), syncRecent: vi.fn(), syncTicket: vi.fn().mockResolvedValue(undefined), syncConversations: vi.fn().mockResolvedValue(undefined), syncActivities: vi.fn(), syncTicketHistory: vi.fn().mockResolvedValue(undefined), backfillTicketHistory: vi.fn().mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0, restantes: 0 }), syncContacts: vi.fn(), syncPendingHistory: vi.fn().mockResolvedValue({ intentados: 0, poblados: 0, fallidos: 0 }) }
  const zohoFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  const app = createApp({ db: dbPropia ?? db, zohoFetch, sync, config })
  return { app, sync, zohoFetch }
}

/**
 * Los valores mínimos que dejan pasar el chequeo de obligatorios de `buildTransitionPlan` para una
 * transición cualquiera.
 *
 * Se derivan del `kind` de cada campo, no de una tabla por transición: las dos baterías que barren
 * las 31 —la matriz de permisos (`permisos.test.ts`) y la de ejecución
 * (`transicionesEjecucion.test.ts`)— tienen que seguir funcionando cuando el registro de flujos (`flujos.ts`) gane catálogos con
 * campos nuevos. Sin esto, las transiciones permitidas contestarían 422 —que llega DESPUÉS del 403 y
 * del cambio de estado— y las dos matrices parecerían correctas enseñando el color equivocado.
 *
 * Vive en el arnés y no en cada fichero por lo mismo que `appWith`: dos copias de este derivador
 * habrían divergido en la primera etapa con un `kind` nuevo, y una sola no.
 *
 * `n` desambigua los valores que tienen que ser únicos por ticket (la orden de venta).
 */
export function valoresValidos(t: Transition, n: number): Record<string, unknown> {
  const values: Record<string, unknown> = { comment: 'valores mínimos del arnés' }
  for (const f of t.fields) {
    if (!f.required && f.key !== CLAVE_CERTIFICADO_FABRICA) continue
    if (f.kind === 'date') values[f.key] = '2026-01-15'
    else if (f.kind === 'number') values[f.key] = 3
    else if (f.kind === 'checkbox') values[f.key] = true
    else if (f.kind === 'select') values[f.key] = f.options?.[0] ?? ''
    // La orden de venta es única por ticket —una OV, un ticket—, así que cada caso lleva la suya.
    else if (f.kind === 'ordenVenta') values[f.key] = `OV-ARNES-${n}`
    else values[f.key] = `ARNES-${n}`
  }
  return values
}

export async function adminCookie(): Promise<string> {
  const u = await createUser(db, { email: 'admin@x.co', name: 'Admin', passwordHash: await hashPassword('password123'), isAdmin: true })
  return `sid=${await createSession(db, u.id)}`
}

export async function userCookie(areas: string[], cargoPermiso?: Cargo | null): Promise<string> {
  const role = await createRole(db, { name: 'Rol-' + areas.join('-'), areas })
  const u = await createUser(db, { email: 'op@x.co', name: 'Op', passwordHash: await hashPassword('password123'), roleId: role.id, cargoPermiso })
  return `sid=${await createSession(db, u.id)}`
}

type ConsultaFn = Queryable['query']
type ConPool = { query: ConsultaFn; connect: () => Promise<{ query: ConsultaFn }> }
/**
 * pg-mem no sabe `jsonb || jsonb`: lo trata como concatenación de TEXTO y revienta al volver a convertir
 * (`{}{"k":1}`). `writeTransition` (`packages/zoho-sync/src/db/repo.ts:309`) mezcla así `custom_fields`, y
 * hasta F1C-05 ninguna prueba HTTP escribía una clave fuera de `PROMOTED_COLUMNS`. Aquí se emula la MISMA mezcla
 * (`{...actual, ...nuevo}`: la clave nueva gana, `null` incluido) leyendo antes la fila. Sólo toca esa sentencia.
 */
function emularMezclaJsonb(pool: ConPool): void {
  const envolver = (q: ConsultaFn): ConsultaFn => async (sql, params) => {
    const m = /custom_fields = custom_fields \|\| \$(\d+)::jsonb/.exec(sql)
    if (!m || !params) return q(sql, params)
    const i = Number(m[1]) - 1
    const actual = (await q('SELECT custom_fields FROM tickets WHERE id=$1', [params[0]])).rows[0]?.custom_fields ?? {}
    const nuevos = [...params]; nuevos[i] = JSON.stringify({ ...actual, ...JSON.parse(String(params[i])) })
    return q(sql.replace(m[0], `custom_fields = $${m[1]}::jsonb`), nuevos)
  }
  const q0 = pool.query.bind(pool); pool.query = envolver(q0)
  const c0 = pool.connect.bind(pool)
  pool.connect = async () => { const c = await c0(); c.query = envolver(c.query.bind(c)); return c }
}
