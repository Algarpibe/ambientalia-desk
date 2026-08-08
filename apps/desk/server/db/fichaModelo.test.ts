import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { leerFicha, crearEnlace, crearFichero, contenidoDocumento, borrarDocumento, DocumentoInvalido } from './fichaModelo'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
  await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m1','Horiba')")
  await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo1','m1','APSA-370')")
})

describe('leerFicha', () => {
  it('devuelve el sku, la foto aparte y el resto de documentos', async () => {
    await db.query("UPDATE catalogo_modelos SET sku='SKU-1' WHERE id='mo1'")
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type,size) VALUES ('d-foto','mo1','foto','Vista frontal','AAA','image/png',3)")
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,url) VALUES ('d-man','mo1','manual','Manual','https://x/m.pdf')")

    const f = await leerFicha(db, 'mo1')
    expect(f).toMatchObject({ modeloId: 'mo1', sku: 'SKU-1' })
    expect(f!.foto).toMatchObject({ id: 'd-foto', tipo: 'foto', url: null })
    // La foto NO se repite dentro de `documentos`: ya va aparte.
    expect(f!.documentos.map((d) => d.id)).toEqual(['d-man'])
  })

  // El base64 no puede viajar en la ficha: una con diez documentos arrastraría diez ficheros cada
  // vez que alguien la abre, y eso no se nota hasta que la aplicación ya va lenta.
  it('nunca incluye el contenido del fichero', async () => {
    await db.query("INSERT INTO catalogo_documentos (id,modelo_id,tipo,nombre,content_b64,content_type) VALUES ('d1','mo1','manual','M','SECRETO','application/pdf')")
    const f = await leerFicha(db, 'mo1')
    expect(JSON.stringify(f)).not.toContain('SECRETO')
  })

  it('un modelo sin ficha devuelve la ficha vacía, no null', async () => {
    const f = await leerFicha(db, 'mo1')
    expect(f).toEqual({ modeloId: 'mo1', sku: null, foto: null, documentos: [] })
  })

  it('null si el modelo no existe', async () => {
    expect(await leerFicha(db, 'no-existe')).toBeNull()
  })
})

describe('crearEnlace', () => {
  it('da de alta un documento con url y sin fichero', async () => {
    const id = await crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'Manual', url: 'https://x/m.pdf', creadoPor: 'Admin' })
    expect(id).toMatch(/^cdoc-/)
    const f = await leerFicha(db, 'mo1')
    expect(f!.documentos[0]).toMatchObject({ nombre: 'Manual', url: 'https://x/m.pdf', contentType: null })
  })

  // Nombre y url vacíos son el error corriente de un formulario mal rellenado, y dejarlos entrar
  // crearía filas que la pantalla no sabe pintar.
  it('rechaza nombre o url vacíos', async () => {
    await expect(crearEnlace(db, 'mo1', { tipo: 'manual', nombre: '  ', url: 'https://x', creadoPor: 'A' })).rejects.toBeInstanceOf(DocumentoInvalido)
    await expect(crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'M', url: '   ', creadoPor: 'A' })).rejects.toBeInstanceOf(DocumentoInvalido)
  })
})

describe('crearFichero', () => {
  it('da de alta un documento con contenido y sin url', async () => {
    const id = await crearFichero(db, 'mo1', {
      tipo: 'manual', nombre: 'Manual', contentB64: 'QUJD', contentType: 'application/pdf', size: 3, creadoPor: 'Admin',
    })
    const c = await contenidoDocumento(db, 'mo1', id)
    expect(c).toEqual({ contentType: 'application/pdf', contentB64: 'QUJD' })
    const f = await leerFicha(db, 'mo1')
    expect(f!.documentos[0]).toMatchObject({ nombre: 'Manual', url: null, size: 3 })
  })

  /**
   * La foto de referencia es UNA por modelo: subir otra sustituye la anterior en vez de acumularlas.
   * Sin esto la ficha acabaría con cinco fotos y nadie sabría cuál es «la» del modelo — y `leerFicha`
   * devolvería una cualquiera, la que el ORDER BY dejara primero.
   */
  it('subir una foto nueva sustituye la anterior; un manual nuevo NO sustituye nada', async () => {
    const vieja = await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'V', contentB64: 'AAA', contentType: 'image/png', size: 3, creadoPor: 'A' })
    const nueva = await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'N', contentB64: 'BBB', contentType: 'image/png', size: 3, creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', vieja)).toBeNull()
    expect((await leerFicha(db, 'mo1'))!.foto).toMatchObject({ id: nueva, nombre: 'N' })

    await crearFichero(db, 'mo1', { tipo: 'manual', nombre: 'M1', contentB64: 'CCC', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    await crearFichero(db, 'mo1', { tipo: 'manual', nombre: 'M2', contentB64: 'DDD', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    expect((await leerFicha(db, 'mo1'))!.documentos.length).toBe(2)
  })

  it('rechaza el nombre vacío', async () => {
    await expect(crearFichero(db, 'mo1', { tipo: 'manual', nombre: ' ', contentB64: 'A', contentType: 'application/pdf', size: 1, creadoPor: 'A' }))
      .rejects.toBeInstanceOf(DocumentoInvalido)
  })
})

// El agujero real: la unicidad de la foto vivía solo en `crearFichero`. Un enlace con tipo='foto'
// pasaba de largo y dejaba una segunda fila `tipo='foto'` que ni `foto` ni `documentos` enseñan —
// por eso aquí se cuenta con un SELECT crudo, y no a través de `leerFicha`, que es justo lo que
// esconde el problema.
describe('la foto es única sea cual sea la vía de alta', () => {
  const filasFoto = async (): Promise<Array<Record<string, unknown>>> => {
    const r = await db.query("SELECT id, nombre FROM catalogo_documentos WHERE modelo_id = 'mo1' AND tipo = 'foto'")
    return r.rows as Array<Record<string, unknown>>
  }

  it('fichero y luego enlace: solo queda una fila, la del enlace', async () => {
    await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'V', contentB64: 'AAA', contentType: 'image/png', size: 3, creadoPor: 'A' })
    const nuevo = await crearEnlace(db, 'mo1', { tipo: 'foto', nombre: 'N', url: 'https://x/n.png', creadoPor: 'A' })
    const filas = await filasFoto()
    expect(filas).toHaveLength(1)
    expect(filas[0].id).toBe(nuevo)
  })

  it('enlace y luego fichero: solo queda una fila, la del fichero', async () => {
    await crearEnlace(db, 'mo1', { tipo: 'foto', nombre: 'V', url: 'https://x/v.png', creadoPor: 'A' })
    const nuevo = await crearFichero(db, 'mo1', { tipo: 'foto', nombre: 'N', contentB64: 'BBB', contentType: 'image/png', size: 3, creadoPor: 'A' })
    const filas = await filasFoto()
    expect(filas).toHaveLength(1)
    expect(filas[0].id).toBe(nuevo)
  })
})

describe('contenidoDocumento', () => {
  // Un enlace no tiene fichero que servir. Devolver la url por esta vía confundiría dos cosas
  // distintas: la ruta la traduce a 404, que es lo que de verdad ocurre.
  it('devuelve null para un documento que es un enlace', async () => {
    const id = await crearEnlace(db, 'mo1', { tipo: 'manual', nombre: 'M', url: 'https://x', creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', id)).toBeNull()
  })

  // El modelo va en la consulta y no solo en la ruta: sin esa condición, saber un id bastaría para
  // leer el fichero de cualquier otro modelo.
  it('devuelve null si el documento es de otro modelo', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo2','m1','APOA-370')")
    const id = await crearFichero(db, 'mo2', { tipo: 'manual', nombre: 'M', contentB64: 'AAA', contentType: 'application/pdf', size: 3, creadoPor: 'A' })
    expect(await contenidoDocumento(db, 'mo1', id)).toBeNull()
  })
})

describe('borrarDocumento', () => {
  it('borra el suyo y no el de otro modelo', async () => {
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo2','m1','APOA-370')")
    const mio = await crearEnlace(db, 'mo1', { tipo: 'guia', nombre: 'G', url: 'https://x', creadoPor: 'A' })
    const ajeno = await crearEnlace(db, 'mo2', { tipo: 'guia', nombre: 'G', url: 'https://x', creadoPor: 'A' })

    expect(await borrarDocumento(db, 'mo1', ajeno)).toBe(false) // no es suyo: no lo toca
    expect(await borrarDocumento(db, 'mo1', mio)).toBe(true)
    expect((await leerFicha(db, 'mo1'))!.documentos).toEqual([])
    expect((await leerFicha(db, 'mo2'))!.documentos.length).toBe(1)
  })
})
