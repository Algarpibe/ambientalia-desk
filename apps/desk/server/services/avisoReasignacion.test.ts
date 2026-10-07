// reasignacion-con-motivo (F1B-05), lote 2: el aviso al destino de una reasignación (RQ-AV-20). La mitad pura se prueba
// sin red ni base, como `avisoDerivacion.test.ts`; la mitad con base usa pg-mem y un `fetch` falso, como `avisosWebhook.test.ts`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { avisoReasignacion, notificarReasignacion } from './avisoReasignacion'
import { createUser } from '../auth/users'
import { reasignar } from '../db/reasignaciones'

const base = { nuevo: 'u-2', actorId: 'u-1', actorNombre: 'Carla Pardo', ticketNumero: 1024, motivo: 'Ana sale de vacaciones' }

describe('avisoReasignacion (RQ-AV-20: función pura)', () => {
  it('avisa al destino con el nombre de quien reasigna y el motivo', () => {
    expect(avisoReasignacion(base)).toEqual({
      userId: 'u-2',
      texto: 'Carla Pardo te reasignó el ticket #1024. Motivo: Ana sale de vacaciones',
    })
  })

  // Quien se reasigna a sí misma ya lo sabe: acaba de hacerlo (S-5, mismo criterio que `avisoDerivacion`).
  it('reasignarse a uno mismo no crea aviso', () => {
    expect(avisoReasignacion({ ...base, nuevo: 'u-1' })).toBeNull()
  })

  it('no hay otra supresión: una persona distinta del actor siempre recibe aviso', () => {
    expect(avisoReasignacion({ ...base, nuevo: 'u-9' })?.userId).toBe('u-9')
  })
})

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

// `avisosCopiaEmail` va en la fixture porque es lo que devuelve `loadConfig` cuando la variable no está (`avisosWebhook.test.ts`).
const config = (o: Partial<AppConfig> = {}) =>
  ({ avisosWebhookUrl: 'https://n8n/webhook/avisos', avisosWebhookToken: 'tok', appBaseUrl: 'https://desk.example', avisosCopiaEmail: '', ...o }) as AppConfig
const fetchOk = () => vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
const enviados = (f: ReturnType<typeof vi.fn>) => (JSON.parse(f.mock.calls[0][1].body as string).avisos as Array<Record<string, unknown>>)

/** Ana (origen), Beto (destino) y Carla (quien reasigna), con un ticket que ya pasó de Ana a Beto. */
async function escena(): Promise<{ ana: string; beto: string; carla: string; contexto: Parameters<typeof notificarReasignacion>[2] }> {
  const ana = (await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h' })).id
  const beto = (await createUser(db, { email: 'beto@x.co', name: 'Beto', passwordHash: 'h' })).id
  const carla = (await createUser(db, { email: 'carla@x.co', name: 'Carla', passwordHash: 'h' })).id
  await db.query("INSERT INTO tickets (id, number, subject, status, derivado_a) VALUES ('t1', 9401, 's', 'Ingresado', $1)", [ana])
  await reasignar(db, { ticketId: 't1', de: ana, a: beto, motivo: 'vacaciones', por: 'Carla' })
  return {
    ana, beto, carla,
    contexto: { ticketId: 't1', ticketNumero: 9401, actorId: carla, actorNombre: 'Carla', motivo: 'vacaciones', destino: { id: beto, email: 'beto@x.co', name: 'Beto' } },
  }
}
const avisosDe = async (userId: string) => (await db.query('SELECT ticket_id, texto, enviado_at FROM avisos WHERE user_id = $1', [userId])).rows as Array<Record<string, unknown>>

describe('notificarReasignacion (RQ-AV-20: la escritura, fuera de la transacción)', () => {
  it('crea el aviso del destino con su ticket_id y manda UN solo elemento con copia, y lo sella', async () => {
    const { beto, contexto } = await escena()
    const f = fetchOk()
    await notificarReasignacion(db, config({ avisosCopiaEmail: 'admin@x.co' }), contexto, f)

    const filas = await avisosDe(beto)
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ ticket_id: 't1', texto: 'Carla te reasignó el ticket #9401. Motivo: vacaciones' })
    expect(filas[0].enviado_at).not.toBeNull()
    // Un solo aviso de la aplicación; el segundo elemento del correo es la copia de verificación al administrador (S-7).
    expect(f).toHaveBeenCalledTimes(1)
    const items = enviados(f)
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ email: 'beto@x.co', nombre: 'Beto', texto: 'Carla te reasignó el ticket #9401. Motivo: vacaciones' })
    expect(items[1]).toMatchObject({ email: 'admin@x.co', nombre: 'Administrador' })
  })

  it('un administrador que es también el destino recibe un solo correo, no dos', async () => {
    const { contexto } = await escena()
    const f = fetchOk()
    await notificarReasignacion(db, config({ avisosCopiaEmail: 'beto@x.co' }), contexto, f)
    expect(enviados(f)).toHaveLength(1)
  })

  it('la persona de origen no recibe nada', async () => {
    const { ana, contexto } = await escena()
    await notificarReasignacion(db, config(), contexto, fetchOk())
    expect(await avisosDe(ana)).toEqual([])
    expect((await db.query('SELECT 1 FROM avisos')).rows).toHaveLength(1)
  })

  it('reasignarse a uno mismo no escribe ni manda nada', async () => {
    const { carla, contexto } = await escena()
    const f = fetchOk()
    await notificarReasignacion(db, config(), { ...contexto, destino: { id: carla, email: 'carla@x.co', name: 'Carla' } }, f)
    expect((await db.query('SELECT 1 FROM avisos')).rows).toEqual([])
    expect(f).not.toHaveBeenCalled()
  })

  it('con el correo fallando el aviso existe con enviado_at en NULL, y no lanza', async () => {
    const { beto, contexto } = await escena()
    const f = vi.fn().mockRejectedValue(new Error('fetch failed'))
    await expect(notificarReasignacion(db, config(), contexto, f)).resolves.toBeUndefined()
    const filas = await avisosDe(beto)
    expect(filas).toHaveLength(1)
    expect(filas[0].enviado_at).toBeNull()
  })

  it('sin URL de correo configurada el aviso existe con enviado_at en NULL y no se llama a nadie', async () => {
    const { beto, contexto } = await escena()
    const f = fetchOk()
    await notificarReasignacion(db, config({ avisosWebhookUrl: '' }), contexto, f)
    expect((await avisosDe(beto))[0].enviado_at).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })

  // Límite declarado del diseño §3(e): si falla el INSERT del aviso, la ruta responde 500 con la reasignación YA hecha.
  it('un fallo al escribir el aviso lanza, y no revierte la reasignación ni su traza', async () => {
    const { beto, contexto } = await escena()
    const roto = { query: (sql: string, p?: unknown[]) => (sql.startsWith('INSERT INTO avisos') ? Promise.reject(new Error('caído')) : db.query(sql, p)) } as unknown as Queryable
    await expect(notificarReasignacion(roto, config(), contexto, fetchOk())).rejects.toThrow('caído')
    expect((await db.query('SELECT derivado_a FROM tickets WHERE id = $1', ['t1'])).rows[0].derivado_a).toBe(beto)
    expect((await db.query('SELECT 1 FROM reasignaciones')).rows).toHaveLength(1)
  })
})
