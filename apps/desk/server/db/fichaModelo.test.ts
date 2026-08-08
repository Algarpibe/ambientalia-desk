import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { leerFicha, crearEnlace, DocumentoInvalido } from './fichaModelo'

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
