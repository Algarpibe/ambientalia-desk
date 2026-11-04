import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { createSync } from './sync'
import type { AppConfig } from './config'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-33, D5): el gancho `trasGuardar` de la pasada periódica. Se llama UNA vez, al final, con los ids
 * cuyas conversaciones acaba de guardar; la apertura de un ticket (`syncConversations`) no lo lee nunca. `zohoFetch` va enrutado por
 * ruta, molde de `sync.conversacionesPeriodicas.test.ts`.
 */
const config = { departmentId: 'DEP' } as AppConfig
const hora = (n: number) => `2026-10-03T10:0${n}:00.000Z`
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })

function enrutar(opciones: { lista?: (id: string) => Response } = {}) {
  const peticiones: string[] = []
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const c = /^\/tickets\/([^/?]+)\/conversations\?/.exec(path)
    if (c) return opciones.lista ? opciones.lista(c[1]) : json({ data: [conv('c' + c[1])] })
    if (path.startsWith('/tickets/search?')) return json({ data: ['101', '102', '103'].map((id) => ({ id, modifiedTime: hora(Number(id.slice(-1))) })) })
    const m = /^\/tickets\/([^/?]+)\?/.exec(path)
    if (m) return json({ id: m[1], ticketNumber: m[1], subject: 's', status: 'Ingresado', statusType: 'Open', customFields: {}, modifiedTime: hora(Number(m[1].slice(-1))), commentCount: 1, threadCount: 0 })
    return vacio(404)
  })
  return zohoFetch
}

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
  // Sin ningún ticket en la base no hay marca y el ciclo cae a la página 1: este fija la marca de la búsqueda.
  await db.query("INSERT INTO tickets (id, number, status, modified_time) VALUES ('Z1', 1, 'Ingresado', '2026-10-02T10:00:00.000Z')")
})
const textoErrores = () => errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
const opciones = (trasGuardar?: (ids: string[]) => Promise<void>) => ({ periodica: true, pausaMs: 0, pausa429Ms: 0, trasGuardar })

/** Una base que falla al guardar las conversaciones de un ticket concreto y deja pasar el resto. */
function baseQueFallaEn(ticket: string): Queryable {
  return { query: (sql: string, params?: unknown[]) => {
    if (/^\s*INSERT INTO conversations/i.test(sql) && params?.[1] === ticket) return Promise.reject(new Error(`disco de la base lleno en ${ticket}`))
    return db.query(sql, params)
  } } as Queryable
}

describe('trasGuardar · la pasada periódica lo llama al final con los ids guardados (RQ-ZS-33)', () => {
  it('una sola llamada, con los tres ids en el orden de la pasada y después de pedir las tres listas', async () => {
    const llamadas: { ids: string[]; pedidasAntes: number }[] = []
    const zohoFetch = enrutar()
    const trasGuardar = vi.fn(async (ids: string[]) => { llamadas.push({ ids, pedidasAntes: zohoFetch.mock.calls.filter((c) => String(c[0]).includes('/conversations?')).length }) })
    await createSync({ zohoFetch, db, config, conversaciones: opciones(trasGuardar) }).syncRecent()
    expect(llamadas).toEqual([{ ids: ['101', '102', '103'], pedidasAntes: 3 }])
  })

  it('el segundo ciclo con el mismo modifiedTime no guarda nada y por tanto no llama', async () => {
    const zohoFetch = enrutar()
    const trasGuardar = vi.fn(async () => {})
    const sync = createSync({ zohoFetch, db, config, conversaciones: opciones(trasGuardar) })
    await sync.syncRecent()
    await sync.syncRecent()
    expect(trasGuardar).toHaveBeenCalledTimes(1)
  })

  it('sin la opción trasGuardar la pasada guarda igual y no falla', async () => {
    const n = await createSync({ zohoFetch: enrutar(), db, config, conversaciones: opciones() }).syncRecent()
    expect(n).toBe(3)
    expect(Number(((await db.query('SELECT count(*) AS n FROM conversations')).rows[0] as { n: unknown }).n)).toBe(3)
  })
})

describe('trasGuardar · si guardar un ticket lanza, su id no entra (P5)', () => {
  it('el 102 falla al guardar: llegan el 101 y el 103, y el fallo se anota', async () => {
    const trasGuardar = vi.fn(async () => {})
    const n = await createSync({ zohoFetch: enrutar(), db: baseQueFallaEn('102'), config, conversaciones: opciones(trasGuardar) }).syncRecent()
    expect(n).toBe(3)
    expect(trasGuardar).toHaveBeenCalledTimes(1)
    expect(trasGuardar).toHaveBeenCalledWith(['101', '103'])
    expect(textoErrores()).toContain('102 falló al guardar')
  })

  it('si fallan los tres, no queda nada que guardar y no se llama', async () => {
    const trasGuardar = vi.fn(async () => {})
    const dbTodoMal = { query: (sql: string, params?: unknown[]) => (/^\s*INSERT INTO conversations/i.test(sql) ? Promise.reject(new Error('base caída')) : db.query(sql, params)) } as Queryable
    await createSync({ zohoFetch: enrutar(), db: dbTodoMal, config, conversaciones: opciones(trasGuardar) }).syncRecent()
    expect(trasGuardar).not.toHaveBeenCalled()
  })
})

describe('trasGuardar · un gancho que falla no rompe el ciclo', () => {
  it('rechaza: syncRecent devuelve su cuenta y las conversaciones quedan guardadas, con el fallo anotado', async () => {
    const trasGuardar = vi.fn(async () => { throw new Error('volumen lleno') })
    const n = await createSync({ zohoFetch: enrutar(), db, config, conversaciones: opciones(trasGuardar) }).syncRecent()
    expect(n).toBe(3)
    expect(trasGuardar).toHaveBeenCalledTimes(1)
    expect(Number(((await db.query('SELECT count(*) AS n FROM conversations')).rows[0] as { n: unknown }).n)).toBe(3)
    expect(textoErrores()).toContain('el gancho trasGuardar falló: volumen lleno')
  })
})

describe('trasGuardar · cortes y apertura', () => {
  it('un corte por 429 de conversaciones salta el gancho: no se descarga tras un corte', async () => {
    const trasGuardar = vi.fn(async () => {})
    const zohoFetch = enrutar({ lista: (id) => (id === '102' ? json({}, 429) : json({ data: [conv('c' + id)] })) })
    await createSync({ zohoFetch, db, config, conversaciones: opciones(trasGuardar) }).syncRecent()
    expect(zohoFetch.mock.calls.filter((c) => String(c[0]).startsWith('/tickets/103/conversations')).length).toBe(0)
    expect(textoErrores()).toContain('pasada cortada por 429 en el ticket 102')
    expect(trasGuardar).not.toHaveBeenCalled()
  })

  it('la apertura (syncConversations) guarda la lista y nunca llama a trasGuardar', async () => {
    const trasGuardar = vi.fn(async () => {})
    await db.query("INSERT INTO tickets (id, number, status) VALUES ('101', 101, 'Ingresado')")
    await createSync({ zohoFetch: enrutar(), db, config, conversaciones: opciones(trasGuardar) }).syncConversations('101')
    expect(Number(((await db.query("SELECT count(*) AS n FROM conversations WHERE ticket_id='101'")).rows[0] as { n: unknown }).n)).toBe(1)
    expect(trasGuardar).not.toHaveBeenCalled()
  })

  it('con periodica apagada hay gancho pero no hay pasada: no se llama', async () => {
    const trasGuardar = vi.fn(async () => {})
    await createSync({ zohoFetch: enrutar(), db, config, conversaciones: { ...opciones(trasGuardar), periodica: false } }).syncRecent()
    expect(trasGuardar).not.toHaveBeenCalled()
  })
})
