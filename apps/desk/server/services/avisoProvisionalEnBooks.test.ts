import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  avisarProvisionalesEnBooks, marcarYAvisarPareja, parejasPorAvisar, textoAvisoProvisionalEnBooks, type ParejaProvisionalBooks,
} from './avisoProvisionalEnBooks'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'
import { logger } from '../util/logger'

/**
 * nit-exentos-aviso-provisional (F1B-19, lote 2) · `derivacion-avisos` RQ-AV-21: aviso a Comercial de un cliente
 * provisional cuyo NIT ya está en Books. Una vez por pareja (provisional, contacto), y la unicidad la da la clave
 * primaria de `public.provisional_books_avisados`. Este lote no cablea la pasada: se prueba el servicio.
 *
 * Atomicidad por ESTRUCTURA, no por filas: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`), así que se
 * mira que la marca y los avisos vayan por el MISMO cliente entre `BEGIN` y `COMMIT`/`ROLLBACK`.
 */
let db: Queryable
let conexiones: number
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  // Cuenta las transacciones abiertas: `enTransaccion` pide un cliente con `connect`.
  conexiones = 0
  const pool = db as unknown as { connect: () => Promise<unknown> }
  const connect = pool.connect.bind(pool)
  pool.connect = async () => { conexiones++; return connect() }
})
afterEach(() => { vi.restoreAllMocks() })

let n = 0
const comercial = async (email: string) => {
  const rol = await createRole(db, { name: `Comercial ${++n}`, areas: ['Comercial'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  return createUser(db, { email, name: email, passwordHash: 'h', roleId: rol.id })
}
const servicioTecnico = async () => {
  const rol = await createRole(db, { name: 'ST', areas: ['Servicio Técnico'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  await createUser(db, { email: 'tec@x.co', name: 'Tec', passwordHash: 'h', roleId: rol.id })
}
const provisional = (id: string, razon: string, nit: string, enlazadoA: string | null = null) =>
  db.query(
    "INSERT INTO public.clientes_provisionales (id, razon_social, nit, contacto, telefono, correo, motivo, enlazado_a) VALUES ($1,$2,$3,'c','t','c@x.co','m',$4)",
    [id, razon, nit, enlazadoA],
  )
const contacto = (id: string, nombre: string | null, nit: string | null) =>
  db.query('INSERT INTO books.contacts (contact_id, contact_name, nit) VALUES ($1,$2,$3)', [id, nombre, nit])
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marcas = async () => (await db.query('SELECT provisional_id, contacto_id, avisos_creados FROM public.provisional_books_avisados ORDER BY provisional_id, contacto_id')).rows as Array<{ provisional_id: string; contacto_id: string; avisos_creados: number }>

const PAREJA: ParejaProvisionalBooks = { provisionalId: 'p1', razonSocial: 'Acme SAS', nit: '900123456', contactoId: 'c1', contactoNombre: 'Acme Books' }

describe('avisarProvisionalesEnBooks · una vez por pareja', () => {
  it('(a) una pareja y dos usuarios de Comercial → dos avisos de bandeja, una marca con avisos_creados = 2; Servicio Técnico no recibe', async () => {
    const ana = await comercial('ana@x.co'); const luis = await comercial('luis@x.co')
    await servicioTecnico()
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Acme Books', '900.123.456-7')
    expect(await avisarProvisionalesEnBooks(db)).toBe(1)
    const a = await avisos()
    expect(a.map((x) => x.user_id).sort()).toEqual([ana.id, luis.id].sort())
    for (const x of a) expect(x).toMatchObject({ ticket_id: null, enviado_at: null })
    expect(a[0]!.texto).toBe(textoAvisoProvisionalEnBooks(PAREJA))
    for (const trozo of ['Acme SAS', '900123456', 'Acme Books']) expect(a[0]!.texto).toContain(trozo)
    expect(await marcas()).toEqual([{ provisional_id: 'p1', contacto_id: 'c1', avisos_creados: 2 }])
  })

  it('el texto trae razón social, NIT tal como se tecleó y nombre del contacto', () => {
    expect(textoAvisoProvisionalEnBooks(PAREJA)).toBe('El cliente provisional «Acme SAS» (NIT 900123456) coincide por NIT con el contacto de Books «Acme Books». Conviene enlazarlos.')
  })

  it('(b) la segunda pasada devuelve 0, no crea avisos y NO abre ninguna transacción', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Acme Books', '900123456-7')
    expect(await avisarProvisionalesEnBooks(db)).toBe(1)
    conexiones = 0
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(conexiones).toBe(0)
    expect(await avisos()).toHaveLength(1)
    expect(await marcas()).toHaveLength(1)
  })

  it('(c) un provisional con dos contactos del mismo NIT → dos marcas, en orden de contactoId', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Acme SAS', '900123456')
    await contacto('c-b', 'Beta', '900123456-7'); await contacto('c-a', 'Alfa', '900123456')
    expect(await avisarProvisionalesEnBooks(db)).toBe(2)
    expect((await marcas()).map((m) => m.contacto_id)).toEqual(['c-a', 'c-b'])
    expect((await parejasPorAvisar(db))).toEqual([])
  })

  it('el orden de las parejas es por provisional y luego por contacto; un contacto sin nombre se nombra por su id', async () => {
    await provisional('p2', 'Segundo', '800111222'); await provisional('p1', 'Primero', '900123456')
    await contacto('c2', 'Otro', '800111222'); await contacto('c1', null, '900123456'); await contacto('c0', 'Cero', '900123456')
    const parejas = await parejasPorAvisar(db)
    expect(parejas.map((p) => `${p.provisionalId}|${p.contactoId}`)).toEqual(['p1|c0', 'p1|c1', 'p2|c2'])
    expect(parejas[1]).toMatchObject({ contactoNombre: 'c1', razonSocial: 'Primero', nit: '900123456' })
  })

  it('(d) un provisional ya enlazado no avisa', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Acme SAS', '900123456', 'c9'); await contacto('c1', 'Acme Books', '900123456')
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(await avisos()).toEqual([]); expect(await marcas()).toEqual([])
  })

  it('(e) exento por el lado del provisional Y del contacto (la siembra 222222222222) → 0', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Consumidor', '222222222222'); await contacto('c1', 'Consumidor final', '222222222222')
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(await marcas()).toEqual([])
  })

  it('(e) exento SÓLO el contacto (2222222222221 × 222222222222-1: casan entre sí) → 0', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Consumidor', '2222222222221'); await contacto('c1', 'Consumidor final', '222222222222-1')
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(await marcas()).toEqual([])
  })

  it('(e) exento SÓLO el provisional (fila extra 900123456-7; 9001234567 × 9001234567-9 casan entre sí) → 0', async () => {
    await comercial('ana@x.co')
    await db.query("INSERT INTO public.nit_exentos (nit, motivo) VALUES ('900123456-7', 'Ficticio de prueba')")
    await provisional('p1', 'Genérico', '9001234567'); await contacto('c1', 'Otro', '9001234567-9')
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(await marcas()).toEqual([])
  })

  it('(f) sin destinatarios y dos parejas → 0, sin marcas y UN solo warn; al aparecer un usuario, la pasada siguiente avisa las dos', async () => {
    const warn = vi.spyOn(logger, 'warn')
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Uno', '900123456'); await contacto('c2', 'Dos', '900123456')
    expect(await avisarProvisionalesEnBooks(db)).toBe(0)
    expect(await marcas()).toEqual([]); expect(await avisos()).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
    await comercial('ana@x.co')
    expect(await avisarProvisionalesEnBooks(db)).toBe(2)
    expect(await marcas()).toHaveLength(2); expect(await avisos()).toHaveLength(2)
  })
})

describe('parejasPorAvisar · salidas cortas (g)', () => {
  const contando = (base: Queryable) => {
    const sqls: string[] = []
    return { sqls, db: { query: ((s: string, p?: unknown[]) => { sqls.push(s); return base.query(s, p) }) as Queryable['query'] } }
  }

  it('sin provisionales: UNA consulta y []', async () => {
    const c = contando(db)
    expect(await parejasPorAvisar(c.db)).toEqual([])
    expect(c.sqls).toHaveLength(1)
  })

  it('sólo provisionales exentos: dos consultas y ninguna a los contactos de Books', async () => {
    await provisional('p1', 'Consumidor', '222222222222'); await contacto('c1', 'X', '222222222222')
    const c = contando(db)
    expect(await parejasPorAvisar(c.db)).toEqual([])
    expect(c.sqls).toHaveLength(2)
    expect(c.sqls.some((s) => /\bclients\b|books\./i.test(s))).toBe(false)
  })

  it('sin ninguna pareja (nadie casa por NIT): tres consultas y NINGUNA a la tabla de marcas', async () => {
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Otro', '800111222')
    const c = contando(db)
    expect(await parejasPorAvisar(c.db)).toEqual([])
    expect(c.sqls).toHaveLength(3)
    expect(c.sqls.some((s) => /provisional_books_avisados/.test(s))).toBe(false)
  })

  it('con parejas ya avisadas, la consulta previa de marcas las descarta sin tocar la transacción', async () => {
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Uno', '900123456'); await contacto('c2', 'Dos', '900123456')
    await db.query("INSERT INTO public.provisional_books_avisados (provisional_id, contacto_id, avisos_creados) VALUES ('p1','c1',1)")
    expect((await parejasPorAvisar(db)).map((p) => p.contactoId)).toEqual(['c2'])
  })
})

// ── Atomicidad por estructura (Plan B de `db/transaccion.test.ts`): quién recibe cada sentencia ──
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
function rastreador(falla: 'aviso' | 'ninguno' | 'duplicada'): { db: Queryable & ConPool; calls: string[] } {
  const calls: string[] = []
  const hacer = (quien: string) => async (sql: string) => {
    const tipo = /provisional_books_avisados/.test(sql) ? 'marca' : /INSERT INTO avisos/i.test(sql) ? 'aviso' : sql.trim().split(/\s+/)[0]!.toUpperCase()
    calls.push(`${quien}:${tipo}`)
    if (tipo === 'aviso' && falla === 'aviso') throw new Error('boom (aviso)')
    if (tipo === 'marca' && falla === 'duplicada') throw Object.assign(new Error('duplicate key'), { code: '23505' })
    return { rows: [] }
  }
  const pool = { query: hacer('pool') as Queryable['query'], connect: async () => ({ query: hacer('cliente') as Queryable['query'], release: () => {} }) }
  return { db: pool, calls }
}

describe('marcarYAvisarPareja · la marca PRIMERO y todo en el MISMO cliente entre BEGIN y COMMIT/ROLLBACK', () => {
  const dos = [{ id: 'u1' }, { id: 'u2' }]

  it('(h) sin fallo: BEGIN, marca, aviso, aviso, COMMIT, todo por el cliente y nada por el pool', async () => {
    const { db: d, calls } = rastreador('ninguno')
    await expect(marcarYAvisarPareja(d, PAREJA, dos, 'texto')).resolves.toBe(true)
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:marca', 'cliente:aviso', 'cliente:aviso', 'cliente:COMMIT'])
  })

  it('(h) si falla un aviso: ROLLBACK de la marca en la misma transacción, el error sale y nada toca el pool', async () => {
    const { db: d, calls } = rastreador('aviso')
    await expect(marcarYAvisarPareja(d, PAREJA, dos, 'texto')).rejects.toThrow('boom')
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:marca', 'cliente:aviso', 'cliente:ROLLBACK'])
  })

  it('(h) 23505 en la marca → false, sin ningún aviso', async () => {
    const { db: d, calls } = rastreador('duplicada')
    await expect(marcarYAvisarPareja(d, PAREJA, dos, 'texto')).resolves.toBe(false)
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:marca', 'cliente:ROLLBACK'])
  })

  it('(i) dos llamadas seguidas → true y false, y un solo juego de avisos', async () => {
    const ana = await comercial('ana@x.co')
    expect(await marcarYAvisarPareja(db, PAREJA, [{ id: ana.id }], 'texto')).toBe(true)
    expect(await marcarYAvisarPareja(db, PAREJA, [{ id: ana.id }], 'texto')).toBe(false)
    expect(await avisos()).toHaveLength(1)
    expect(await marcas()).toHaveLength(1)
  })

  it('(i) con destinatarios vacíos → false, sin marca y sin abrir transacción', async () => {
    expect(await marcarYAvisarPareja(db, PAREJA, [], 'texto')).toBe(false)
    expect(await marcas()).toEqual([])
    expect(conexiones).toBe(0)
  })

  it('(i) dos pasadas concurrentes → una sola marca y un solo juego de avisos', async () => {
    await comercial('ana@x.co')
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Acme Books', '900123456')
    await Promise.all([avisarProvisionalesEnBooks(db), avisarProvisionalesEnBooks(db)])
    expect(await marcas()).toHaveLength(1)
    expect(await avisos()).toHaveLength(1)
  })
})

describe('avisarProvisionalesEnBooks · un fallo en una pareja no para a las demás', () => {
  it('(j) falla la marca de la primera pareja → la segunda se avisa igual', async () => {
    const error = vi.spyOn(logger, 'error')
    await comercial('ana@x.co')
    await provisional('p1', 'Acme SAS', '900123456'); await contacto('c1', 'Uno', '900123456'); await contacto('c2', 'Dos', '900123456')
    const pool = db as unknown as ConPool
    const rota: Queryable & ConPool = {
      query: db.query.bind(db),
      connect: async () => {
        const c = await pool.connect()
        return {
          query: ((s: string, p?: unknown[]) => (/provisional_books_avisados/.test(s) && p?.[1] === 'c1' ? Promise.reject(new Error('boom')) : c.query(s, p))) as Queryable['query'],
          release: () => c.release(),
        }
      },
    }
    await expect(avisarProvisionalesEnBooks(rota)).resolves.toBe(1)
    expect((await marcas()).map((m) => m.contacto_id)).toEqual(['c2'])
    expect(error).toHaveBeenCalledTimes(1)
  })
})

describe('parejasPorAvisar · el provisional es el lado tecleado, como en el alta', () => {
  it('base más dígito sin guion en el PROVISIONAL casa con el contacto que lo lleva con guion; al revés no', async () => {
    // `nitCoincide` es asimétrica: sólo acepta «base + dígito sin guion» en su PRIMER argumento, que en el alta es lo
    // tecleado (`clientesBooksPorNit`). Aquí lo tecleado es el NIT del provisional; con los argumentos invertidos, las dos
    // parejas de abajo cambiarían de signo.
    await provisional('p1', 'Acme SAS', '9001234567'); await contacto('c1', 'Acme Books', '900.123.456-7')
    await provisional('p2', 'Beta SAS', '800.111.222-3'); await contacto('c2', 'Beta Books', '8001112223')
    expect((await parejasPorAvisar(db)).map((p) => `${p.provisionalId}|${p.contactoId}`)).toEqual(['p1|c1'])
  })
})
