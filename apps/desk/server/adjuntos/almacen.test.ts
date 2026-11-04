import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import * as fsReal from 'node:fs/promises'
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { guardarAdjunto, estadoCopia, ErrorDisco, type FilaAdjunto } from './almacen'

const HREF = (id: string) => `/tickets/10/comments/20/attachments/${id}/content`

let db: Queryable
let base: string
let dir: string
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  base = await mkdtemp(join(tmpdir(), 'adjuntos-'))
  dir = join(base, 'volumen'); await mkdir(dir)
  await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('T10', 10, 'Asunto', 'Ingresado')")
})
afterEach(async () => { await rm(base, { recursive: true, force: true }) })

const bytes = (n: number) => Buffer.alloc(n, 7)
const respuesta = (cuerpo: Buffer, cabeceras: Record<string, string> = {}, status = 200) =>
  new Response(new Uint8Array(cuerpo), { status, headers: cabeceras })
function zoho(res: () => Response | Promise<Response>) {
  const peticiones: string[] = []
  const zohoFetch = vi.fn(async (path: string) => { peticiones.push(path); return res() })
  return { zohoFetch, peticiones }
}
async function fila(id: string, size: number | null, name: string | null = 'foto.png', href: string | null = HREF(id)): Promise<FilaAdjunto> {
  await db.query('INSERT INTO attachments (id, ticket_id, name, size, zoho_href) VALUES ($1, $2, $3, $4, $5)', [id, 'T10', name, size, href])
  return { id, name, size, zoho_href: href, storage_path: null }
}
const storagePath = async (id: string) =>
  ((await db.query('SELECT storage_path FROM attachments WHERE id=$1', [id])).rows[0] as { storage_path: string | null }).storage_path
const contenido = () => readdir(dir)

describe('guardarAdjunto · guardado correcto (RQ-ZS-30)', () => {
  it('guarda los bytes con el id como nombre, fija storage_path relativo y comprueba el tamaño', async () => {
    const f = await fila('4001', 1024)
    const z = zoho(() => respuesta(bytes(1024)))
    const r = await guardarAdjunto({ zohoFetch: z.zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'guardado', comprobado: true, bytes: 1024 })
    expect(await contenido()).toEqual(['4001'])
    expect(await readFile(join(dir, '4001'))).toEqual(bytes(1024))
    expect(await storagePath('4001')).toBe('4001')
    expect(z.peticiones).toEqual([HREF('4001')])
  })
  it('con la copia ya guardada, estadoCopia dice presente: relanzar no pide', async () => {
    const f = await fila('4001', 1024)
    await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(1024))).zohoFetch, db, dir }, f)
    expect(await estadoCopia(dir, { ...f, storage_path: await storagePath('4001') })).toBe('presente')
  })
  it('size llega como cadena (bigint de pg) y se compara con Number(size)', async () => {
    const f = { ...(await fila('4010', 10)), size: '10' }
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(10))).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'guardado', comprobado: true, bytes: 10 })
  })
})

describe('guardarAdjunto · el nombre sale del id, nunca de name', () => {
  it('name con ../ no influye: el fichero es el id dentro del directorio y nada fuera', async () => {
    const f = await fila('4002', 5, '../../etc/x')
    await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(5))).zohoFetch, db, dir }, f)
    expect(await contenido()).toEqual(['4002'])
    expect(await readdir(base)).toEqual(['volumen'])
    expect(await storagePath('4002')).toBe('4002')
  })
  it('otro name (con separadores y punto) tampoco cambia el nombre en disco', async () => {
    const f = await fila('4003', 5, 'sub/dir/informe.pdf')
    await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(5))).zohoFetch, db, dir }, f)
    expect(await contenido()).toEqual(['4003'])
  })
})

describe('guardarAdjunto · id no numérico y ruta de Zoho inválida no piden ni escriben', () => {
  it.each(['abc1', '12a', '../7', '', '1.5'])('id %j → fallido:id sin pedir ni escribir', async (id) => {
    const z = zoho(() => respuesta(bytes(5)))
    const r = await guardarAdjunto({ zohoFetch: z.zohoFetch, db, dir }, { id, size: 5, zoho_href: HREF('1') })
    expect(r).toEqual({ estado: 'fallido', motivo: 'id' })
    expect(z.zohoFetch).not.toHaveBeenCalled()
    expect(await contenido()).toEqual([])
  })
  it.each([['/tickets/1/x'], ['/tickets/abc/comments/1/attachments/1/content'], [null], ['']])(
    'zoho_href %j → sinRuta sin pedir ni escribir', async (href) => {
      const f = await fila('4004', 5, 'a', href)
      const z = zoho(() => respuesta(bytes(5)))
      expect(await guardarAdjunto({ zohoFetch: z.zohoFetch, db, dir }, f)).toEqual({ estado: 'sinRuta' })
      expect(z.zohoFetch).not.toHaveBeenCalled()
      expect(await contenido()).toEqual([])
    })
})

describe('guardarAdjunto · bytes contra size', () => {
  it('bytes de menos: no queda fichero final ni temporal ni storage_path', async () => {
    const f = await fila('4005', 2048)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(1500))).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'fallido', motivo: 'tamano' })
    expect(await contenido()).toEqual([])
    expect(await storagePath('4005')).toBeNull()
  })
  it('bytes de más también es fallido:tamano', async () => {
    const f = await fila('4006', 100)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(101))).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'fallido', motivo: 'tamano' })
    expect(await contenido()).toEqual([])
  })
  it('cuerpo cortado a mitad de lectura es fallido:red y no escribe', async () => {
    const f = await fila('4007', 2048)
    const cortada = { ok: true, status: 200, headers: new Headers(), arrayBuffer: () => Promise.reject(new TypeError('terminated')) } as unknown as Response
    const r = await guardarAdjunto({ zohoFetch: zoho(() => cortada).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'fallido', motivo: 'red' })
    expect(await contenido()).toEqual([])
    expect(await storagePath('4007')).toBeNull()
  })
  it('zohoFetch que lanza es fallido:red', async () => {
    const f = await fila('4008', 5)
    const zohoFetch = vi.fn(async () => { throw new Error('ECONNRESET') })
    expect(await guardarAdjunto({ zohoFetch, db, dir }, f)).toEqual({ estado: 'fallido', motivo: 'red' })
    expect(await contenido()).toEqual([])
  })
  it('respuesta no ok se devuelve con su estado, sin escribir (el detalle de 429/404 es de D4)', async () => {
    const f = await fila('4009', 5)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(0), {}, 404)).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'respuesta', status: 404 })
    expect(await contenido()).toEqual([])
    expect(await storagePath('4009')).toBeNull()
  })
})

describe('guardarAdjunto · sin size', () => {
  it('con Content-Length igual a los bytes: se guarda comparada con la cabecera', async () => {
    const f = await fila('4101', null)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(900), { 'content-length': '900' })).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'guardado', comprobado: true, bytes: 900 })
    expect(await storagePath('4101')).toBe('4101')
  })
  it('con Content-Length distinto de los bytes: fallido:tamano', async () => {
    const f = await fila('4102', null)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(800), { 'content-length': '900' })).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'fallido', motivo: 'tamano' })
    expect(await contenido()).toEqual([])
  })
  it('sin size ni cabecera: se guarda y cuenta sin tamaño comprobable', async () => {
    const f = await fila('4103', null)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(300))).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'guardado', comprobado: false, bytes: 300 })
    expect(await storagePath('4103')).toBe('4103')
  })
  it('Content-Length con Content-Encoding no es comparable: se guarda sin comprobar', async () => {
    const f = await fila('4104', null)
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(300), { 'content-length': '50', 'content-encoding': 'gzip' })).zohoFetch, db, dir }, f)
    expect(r).toEqual({ estado: 'guardado', comprobado: false, bytes: 300 })
  })
})

describe('guardarAdjunto · fallos de disco y de base', () => {
  it('fallo a mitad de escritura (fs inyectado): ErrorDisco con el code, sin final ni temporal ni storage_path', async () => {
    const f = await fila('4201', 2048)
    const fs = {
      ...fsReal,
      writeFile: (async (ruta: string, datos: Uint8Array, op?: object) => {
        await fsReal.writeFile(ruta, datos.subarray(0, 700), op)
        throw Object.assign(new Error('no space'), { code: 'ENOSPC' })
      }) as typeof fsReal.writeFile,
    }
    const p = guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(2048))).zohoFetch, db, dir, fs }, f)
    await expect(p).rejects.toBeInstanceOf(ErrorDisco)
    await expect(p).rejects.toMatchObject({ code: 'ENOSPC' })
    expect(await contenido()).toEqual([])
    expect(await storagePath('4201')).toBeNull()
  })
  it('rename que falla: ErrorDisco, temporal borrado y storage_path sigue nulo (P4)', async () => {
    const f = await fila('4202', 10)
    const fs = { ...fsReal, rename: (async () => { throw Object.assign(new Error('denegado'), { code: 'EACCES' }) }) as typeof fsReal.rename }
    await expect(guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(10))).zohoFetch, db, dir, fs }, f))
      .rejects.toMatchObject({ code: 'EACCES' })
    expect(await contenido()).toEqual([])
    expect(await storagePath('4202')).toBeNull()
  })
  it('directorio ausente: ErrorDisco ENOENT y no se crea el directorio', async () => {
    const f = await fila('4203', 10)
    const ausente = join(base, 'no-existe')
    await expect(guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(10))).zohoFetch, db, dir: ausente }, f))
      .rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readdir(base)).toEqual(['volumen'])
    expect(await storagePath('4203')).toBeNull()
  })
  it('ErrorDisco es un Error con name y code', () => {
    const e = new ErrorDisco('ENOSPC')
    expect(e).toBeInstanceOf(Error)
    expect(e.code).toBe('ENOSPC')
    expect(e.name).toBe('ErrorDisco')
  })
  it('el UPDATE falla: fallido:base y el fichero sin storage_path vuelve a ser pendiente (sinCopia)', async () => {
    const f = await fila('4204', 10)
    const dbRota = { query: async (sql: string, p?: unknown[]) => {
      if (sql.includes('UPDATE attachments')) throw new Error('base caída')
      return db.query(sql, p)
    } } as Queryable
    const r = await guardarAdjunto({ zohoFetch: zoho(() => respuesta(bytes(10))).zohoFetch, db: dbRota, dir }, f)
    expect(r).toEqual({ estado: 'fallido', motivo: 'base' })
    expect(await storagePath('4204')).toBeNull()
    expect(await estadoCopia(dir, { ...f, storage_path: null })).toBe('sinCopia')
  })
})

describe('estadoCopia (D3)', () => {
  const f = (o: Partial<FilaAdjunto>): FilaAdjunto => ({ id: '5001', size: 4, zoho_href: HREF('5001'), storage_path: '5001', ...o })
  it('storage_path nulo ⇒ sinCopia aunque el fichero exista', async () => {
    await writeFile(join(dir, '5001'), bytes(4))
    expect(await estadoCopia(dir, f({ storage_path: null }))).toBe('sinCopia')
  })
  it('storage_path distinto del id (../secreto) ⇒ sinCopia y no abre nada', async () => {
    await writeFile(join(base, 'secreto'), bytes(4))
    expect(await estadoCopia(dir, f({ storage_path: '../secreto' }))).toBe('sinCopia')
  })
  it('id no numérico ⇒ sinCopia', async () => {
    await writeFile(join(dir, 'abc'), bytes(4))
    expect(await estadoCopia(dir, f({ id: 'abc', storage_path: 'abc' }))).toBe('sinCopia')
  })
  it('fichero que no existe ⇒ ausente', async () => {
    expect(await estadoCopia(dir, f({}))).toBe('ausente')
  })
  it('lo que hay con ese nombre es un directorio ⇒ ausente', async () => {
    await mkdir(join(dir, '5001'))
    expect(await estadoCopia(dir, f({}))).toBe('ausente')
  })
  it('tamaño distinto de size ⇒ otroTamano', async () => {
    await writeFile(join(dir, '5001'), bytes(3))
    expect(await estadoCopia(dir, f({}))).toBe('otroTamano')
  })
  it('tamaño igual a size (también como cadena) ⇒ presente', async () => {
    await writeFile(join(dir, '5001'), bytes(4))
    expect(await estadoCopia(dir, f({}))).toBe('presente')
    expect(await estadoCopia(dir, f({ size: '4' }))).toBe('presente')
  })
  it('sin size, el fichero existente es presente', async () => {
    await writeFile(join(dir, '5001'), bytes(9))
    expect(await estadoCopia(dir, f({ size: null }))).toBe('presente')
  })
  it('otro error de disco (no ENOENT) ⇒ ErrorDisco con su code', async () => {
    const fs = { ...fsReal, stat: (async () => { throw Object.assign(new Error('sin permiso'), { code: 'EACCES' }) }) as typeof fsReal.stat }
    await expect(estadoCopia(dir, f({}), fs)).rejects.toMatchObject({ name: 'ErrorDisco', code: 'EACCES' })
  })
})
