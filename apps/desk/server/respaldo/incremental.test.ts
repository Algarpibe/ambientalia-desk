import { describe, it, expect } from 'vitest'
import type { ArchivoDrive } from './driveApi'
import { aplicarCopia, claveObjeto, huella, indiceVacio, marcarDesaparecidos, planificar, type IndiceDrive } from './incremental'

/** F1F-02 (RQ-ZS-21): decisiones puras sobre el índice y el listado; nada de red. Las pruebas congelan las entradas para cazar mutaciones. */
const T1 = '2026-09-27T05:00:00.000Z'
const T2 = '2026-10-04T05:00:00.000Z'
const doc = (id: string, h: string): ArchivoDrive => ({ id, nombre: `${id}.pdf`, ruta: `${id}.pdf`, mimeType: 'application/pdf', huella: h })
const congelar = <T>(o: T): T => { JSON.stringify(o); return structuredClone(o) }
const con = (...docs: Array<[string, string]>): IndiceDrive => docs.reduce((i, [id, h]) => aplicarCopia(i, doc(id, h), { clave: `k/${id}/${h}`, copiadaEn: T1 }), indiceVacio(T1))

describe('huella', () => {
  it('es md5Checksum si existe y, si no, modifiedTime', () => {
    expect(huella({ md5Checksum: 'abc', modifiedTime: '2026-01-01T00:00:00Z' })).toBe('abc')
    expect(huella({ modifiedTime: '2026-01-01T00:00:00Z' })).toBe('2026-01-01T00:00:00Z')
    expect(huella({ md5Checksum: '', modifiedTime: 'f' })).toBe('f')
    expect(huella({})).toBe('')
  })
})

describe('claveObjeto', () => {
  it('lleva el id y la fecha UTC sin dos puntos, y nunca el nombre del documento', () => {
    expect(claveObjeto('1AbC', new Date('2026-10-04T05:07:09.123Z'))).toBe('drive/archivos/1AbC/2026-10-04T05-07-09Z.enc')
  })
})

describe('planificar', () => {
  it('primera pasada: con el índice vacío se copia todo', () => {
    const l = [doc('a', '1'), doc('b', '2'), doc('c', '3')]
    expect(planificar(indiceVacio(T1), l).map((a) => a.id)).toEqual(['a', 'b', 'c'])
  })

  it('incremental: sólo el nuevo y el de huella distinta; el que no cambió no vuelve a subirse', () => {
    const indice = congelar(con(['a', '1'], ['b', '2']))
    const r = planificar(indice, [doc('a', '1'), doc('b', '2-nueva'), doc('n', '9')])
    expect(r.map((a) => a.id)).toEqual(['b', 'n'])
  })

  it('compara con la ÚLTIMA versión: volver a una huella antigua también es un cambio', () => {
    const i = aplicarCopia(con(['a', '1']), doc('a', '2'), { clave: 'k2', copiadaEn: T2 })
    expect(planificar(i, [doc('a', '1')]).map((a) => a.id)).toEqual(['a'])
    expect(planificar(i, [doc('a', '2')])).toEqual([])
  })
})

describe('aplicarCopia', () => {
  it('añade la versión, marca superada la anterior con la fecha de la nueva y no muta la entrada', () => {
    const antes = congelar(con(['a', '1']))
    const copia = structuredClone(antes)
    const nuevo = aplicarCopia(copia, doc('a', '2'), { clave: 'k2', versionId: 'v2', copiadaEn: T2 })
    expect(copia).toEqual(antes)
    expect(nuevo.documentos.a.versiones).toEqual([
      { clave: 'k/a/1', copiadaEn: T1, huella: '1', superadaEn: T2 },
      { clave: 'k2', versionId: 'v2', copiadaEn: T2, huella: '2' },
    ])
    expect(nuevo.actualizado).toBe(T2)
  })

  it('un documento nuevo crea su entrada con nombre, ruta y tipo', () => {
    const e = con(['a', '1']).documentos.a
    expect(e).toEqual({ nombre: 'a.pdf', ruta: 'a.pdf', mimeType: 'application/pdf', versiones: [{ clave: 'k/a/1', copiadaEn: T1, huella: '1' }] })
  })
})

describe('marcarDesaparecidos', () => {
  it('con listado completo marca al que falta y no toca al que sigue', () => {
    const r = marcarDesaparecidos(con(['a', '1'], ['b', '2']), [doc('a', '1')], true, T2)
    expect(r.documentos.b.desaparecidoEn).toBe(T2)
    expect(r.documentos.a.desaparecidoEn).toBeUndefined()
  })

  it('no re-marca: conserva la fecha de la primera vez', () => {
    const una = marcarDesaparecidos(con(['b', '2']), [], true, T1)
    expect(marcarDesaparecidos(una, [], true, T2).documentos.b.desaparecidoEn).toBe(T1)
  })

  it('con listado INCOMPLETO no marca a nadie (devuelve el índice tal cual)', () => {
    const indice = congelar(con(['a', '1'], ['b', '2']))
    expect(marcarDesaparecidos(indice, [], false, T2)).toEqual(indice)
  })

  it('el que reaparece pierde la marca y conserva sus versiones', () => {
    const marcado = marcarDesaparecidos(con(['b', '2']), [], true, T1)
    const r = marcarDesaparecidos(marcado, [doc('b', '2')], true, T2)
    expect('desaparecidoEn' in r.documentos.b).toBe(false)
    expect(r.documentos.b.versiones).toHaveLength(1)
  })
})
