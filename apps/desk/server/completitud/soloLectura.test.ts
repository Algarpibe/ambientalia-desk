import { describe, it, expect } from 'vitest'
import { crearRegistroEscrituras, ErrorEscritura, soloGet, soloSelect } from './soloLectura'

/**
 * verificacion-completitud (1G-03, D4, CA-10, RQ-ZS-37) · sólo lectura por construcción.
 * QUÉ COMPRUEBA: que cada rechazo queda REGISTRADO (total y tipo, nunca sentencia ni parámetros) y que después lanza. Lo que se prueba es el
 * registro, no la excepción: `persistEach` y los `ensure*` de `sync.ts` se la tragan, y un camino que escribe por ahí no rompería nada.
 * QUÉ NO COMPRUEBA: qué hace el motor con el total (L4).
 */
const MARCADOR = 'marcador-secreto-7731'
const baseFalsa = () => {
  const llamadas: { sql: string; params?: unknown[] }[] = []
  return { llamadas, query: async (sql: string, params?: unknown[]) => { llamadas.push({ sql, params }); return { rows: [{ ok: 1 }] } } }
}
const tragar = (p: Promise<unknown>) => p.catch(() => undefined)

describe('soloSelect', () => {
  it('deja pasar un SELECT, con sus parámetros, sin registrar nada', async () => {
    const base = baseFalsa(); const registro = crearRegistroEscrituras()
    expect(await soloSelect(base, registro).query('SELECT id FROM tickets WHERE id = $1', ['t1'])).toEqual({ rows: [{ ok: 1 }] })
    expect(base.llamadas).toEqual([{ sql: 'SELECT id FROM tickets WHERE id = $1', params: ['t1'] }])
    expect(registro).toEqual({ total: 0, tipos: [] })
  })

  it('un INSERT se registra con su tipo, no llega a la base y después lanza', async () => {
    const base = baseFalsa(); const registro = crearRegistroEscrituras()
    const lee = soloSelect(base, registro)
    await expect(lee.query(`INSERT INTO tickets (id) VALUES ('${MARCADOR}')`, [MARCADOR])).rejects.toThrow(ErrorEscritura)
    expect(registro).toEqual({ total: 1, tipos: ['INSERT'] })
    expect(base.llamadas).toEqual([])
  })

  it('cuenta cada rechazo y sus tipos sin repetir, con minúsculas y espacios delante', async () => {
    const registro = crearRegistroEscrituras(); const lee = soloSelect(baseFalsa(), registro)
    for (const sql of ['  update tickets set x = 1', 'DELETE FROM tickets', 'update tickets set y = 2']) await tragar(lee.query(sql))
    expect(registro).toEqual({ total: 3, tipos: ['DELETE', 'UPDATE'] })
  })

  it('una segunda sentencia es VARIAS aunque empiece por SELECT; un solo `;` final se admite', async () => {
    const base = baseFalsa(); const registro = crearRegistroEscrituras(); const lee = soloSelect(base, registro)
    await tragar(lee.query('SELECT 1; DELETE FROM tickets'))
    expect(registro).toEqual({ total: 1, tipos: ['VARIAS'] })
    await lee.query('SELECT 2;')
    expect(base.llamadas.map((l) => l.sql)).toEqual(['SELECT 2;'])
    expect(registro.total).toBe(1)
  })

  it('el registro y el mensaje de la excepción no llevan la sentencia ni los parámetros', async () => {
    const registro = crearRegistroEscrituras()
    const error = await soloSelect(baseFalsa(), registro).query(`DELETE FROM tickets WHERE asunto = '${MARCADOR}'`, [MARCADOR]).catch((e: Error) => e)
    expect(JSON.stringify(registro)).not.toContain(MARCADOR)
    expect((error as Error).message).toBe('escritura rechazada: DELETE')
  })
})

describe('soloGet', () => {
  it('deja pasar un GET, con o sin init, sin registrar nada', async () => {
    const vistas: string[] = []; const registro = crearRegistroEscrituras()
    const f = soloGet(async (ruta) => { vistas.push(ruta); return new Response('{}') }, registro)
    await f('/tickets'); await f('/tickets/1', { method: 'get' })
    expect(vistas).toEqual(['/tickets', '/tickets/1'])
    expect(registro).toEqual({ total: 0, tipos: [] })
  })

  it('un init con POST se rechaza y se cuenta, y la petición no sale', async () => {
    const vistas: string[] = []; const registro = crearRegistroEscrituras()
    const f = soloGet(async (ruta) => { vistas.push(ruta); return new Response('{}') }, registro)
    await tragar(f('/tickets', { method: 'POST', body: MARCADOR }))
    await tragar(f('/tickets/1', { method: 'delete' }))
    expect(registro).toEqual({ total: 2, tipos: ['DELETE', 'POST'] })
    expect(vistas).toEqual([])
    expect(JSON.stringify(registro)).not.toContain(MARCADOR)
  })

  it('el mismo registro suma los rechazos de la base y los de Zoho', async () => {
    const registro = crearRegistroEscrituras()
    await tragar(soloSelect(baseFalsa(), registro).query('DROP TABLE tickets'))
    await tragar(soloGet(async () => new Response('{}'), registro)('/tickets', { method: 'PUT' }))
    expect(registro).toEqual({ total: 2, tipos: ['DROP', 'PUT'] })
  })
})
