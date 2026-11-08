import { describe, it, expect } from 'vitest'
import { cargarConocidas, leerLista, type ListaConocidas } from './conocidas'
import { clasificar, conocidasSinUso, type Clasificacion, type FilaDiferencia } from './clasificar'

/**
 * verificacion-completitud (1G-03, D3, RQ-ZS-34) · clasificación pura: id, luego herencia, luego regla, luego «sin explicar».
 * QUÉ COMPRUEBA: cada paso por separado y su ORDEN (un par de pruebas por posición: P5 y P6 de D15); que `nacidoEnLaApp` sólo explica «falta en Zoho»;
 * que un ticket ausente transmite clase y `heredadaDe`; que la entrada sin uso sale aparte; que un hueco de lista no tiene clase.
 * QUÉ NO COMPRUEBA: de dónde salen los hechos de cada fila (los arma el motor, L4-L5).
 */
const real = cargarConocidas(leerLista())
const lista = (entradas: object[]): ListaConocidas => cargarConocidas(JSON.stringify({ version: 1, entradas }))
const fila = (f: Partial<FilaDiferencia> & Pick<FilaDiferencia, 'entidad' | 'id'>): FilaDiferencia => ({ lado: 'faltaEnZoho', ...f })
const conocida = (c: Clasificacion | null) => ({ clase: c?.clase, entrada: c?.entrada })
const SIN = { clase: 'sin explicar', entrada: undefined }

describe('clasificar · por id', () => {
  it('el #1017 ausente de Zoho sale conocido con E-267 y su causa (CA-5)', () => {
    const c = clasificar(real, fila({ entidad: 'tickets', id: 'z-1', numero: 1017 }))
    expect(conocida(c)).toEqual({ clase: 'conocida', entrada: 'E-267' })
    expect(c?.causa).toContain('Zoho no lo devuelve')
  })

  it('quitar la entrada del #1017 deja la misma diferencia «sin explicar»', () => {
    const sin1017 = lista(real.entradas.filter((e) => e.numeros === undefined))
    expect(conocida(clasificar(sin1017, fila({ entidad: 'tickets', id: 'z-1', numero: 1017 })))).toEqual(SIN)
  })

  it('otro número de ticket no queda explicado por esa entrada', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'tickets', id: 'z-2', numero: 1018 })))).toEqual(SIN)
  })

  it('los dos adjuntos de 1G-02 salen conocidos con DEPLOY.md §22, en cualquier lado', () => {
    for (const id of ['495552000061185001', '495552000057838002']) {
      expect(conocida(clasificar(real, fila({ entidad: 'adjuntos', id })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §22' })
    }
    expect(conocida(clasificar(real, fila({ entidad: 'adjuntos', id: '495552000061185001', lado: 'volumen' })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §22' })
  })

  it('el id sólo vale en SU entidad', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: '495552000061185001' })))).toEqual(SIN)
  })
})

describe('clasificar · por regla', () => {
  it('nacidoEnLaApp: el ticket con prefijo app- sale conocido con DEPLOY.md §23; el que no lo lleva, «sin explicar»', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'tickets', id: 'app-17', numero: 9001 })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §23' })
    expect(conocida(clasificar(real, fila({ entidad: 'tickets', id: '495552000000000001', numero: 9002 })))).toEqual(SIN)
  })

  it('nacidoEnLaApp: la conversación con source distinto de zoho, el contacto y la cuenta con managed_by_app o source distinto', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c1', fuente: 'app' })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §23' })
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c2', fuente: 'zoho' })))).toEqual(SIN)
    expect(conocida(clasificar(real, fila({ entidad: 'contactos', id: 'k1', managedByApp: true, fuente: 'zoho' })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §23' })
    expect(conocida(clasificar(real, fila({ entidad: 'cuentas', id: 'a1', fuente: 'app' })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §23' })
    expect(conocida(clasificar(real, fila({ entidad: 'cuentas', id: 'a2', managedByApp: false, fuente: 'zoho' })))).toEqual(SIN)
  })

  it('las reglas sólo explican «falta en Zoho»: lo que falta en Desk, el otro tamaño y el volumen sólo los explica un id', () => {
    for (const lado of ['faltaEnDesk', 'otroTamano', 'volumen'] as const) {
      expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c1', fuente: 'app', lado })))).toEqual(SIN)
    }
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c1', fuente: 'app', lado: 'faltaEnZoho' })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §23' })
  })

  it('conversacionAusenteEnZoho: la conversación con ausente_en_zoho_at sale conocida con DEPLOY.md §19', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c3', fuente: 'zoho', ausenteEnZoho: true })))).toEqual({ clase: 'conocida', entrada: 'DEPLOY.md §19' })
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c4', fuente: 'zoho', ausenteEnZoho: false })))).toEqual(SIN)
  })
})

describe('clasificar · por herencia', () => {
  const ticketConocido: Clasificacion = { clase: 'conocida', causa: 'causa del ticket', entrada: 'E-267', indice: 2 }
  const padreTicket = (lado: FilaDiferencia['lado'], clasificacion: Clasificacion) => ({ etiqueta: 'tickets:1017', lado, clasificacion })

  it('un hijo de un ticket ausente copia clase, causa y entrada y anota de quién', () => {
    const c = clasificar(real, fila({ entidad: 'conversaciones', id: 'c1', fuente: 'zoho', padres: [padreTicket('faltaEnZoho', ticketConocido)] }))
    expect(c).toEqual({ clase: 'conocida', causa: 'causa del ticket', entrada: 'E-267', indice: 2, heredadaDe: 'tickets:1017' })
  })

  it('el padre sólo vale si es diferencia del MISMO lado', () => {
    expect(conocida(clasificar(real, fila({ entidad: 'conversaciones', id: 'c1', fuente: 'zoho', padres: [padreTicket('faltaEnDesk', ticketConocido)] })))).toEqual(SIN)
  })

  it('un padre «sin explicar» transmite también su clase', () => {
    const c = clasificar(real, fila({ entidad: 'historia', id: 'h1', padres: [padreTicket('faltaEnZoho', { clase: 'sin explicar' })] }))
    expect(c).toEqual({ clase: 'sin explicar', heredadaDe: 'tickets:1017' })
  })

  it('un adjunto hereda antes de su conversación que de su ticket', () => {
    const conv: Clasificacion = { clase: 'conocida', causa: 'ausente', entrada: 'DEPLOY.md §19' }
    const c = clasificar(real, fila({ entidad: 'adjuntos', id: 'ad1', padres: [{ etiqueta: 'conversaciones:c3', lado: 'faltaEnZoho', clasificacion: conv }, padreTicket('faltaEnZoho', ticketConocido)] }))
    expect(c).toMatchObject({ entrada: 'DEPLOY.md §19', heredadaDe: 'conversaciones:c3' })
  })
})

describe('clasificar · el orden id, herencia, regla (D3, P5 y P6)', () => {
  const ticketConocido: Clasificacion = { clase: 'conocida', causa: 'causa del ticket', entrada: 'E-267', indice: 2 }

  it('P5: un ticket app- con entrada propia sale con la causa de la entrada, no con la de la regla, y la regla queda sin uso', () => {
    const propia = lista([
      { entidad: 'tickets', regla: 'nacidoEnLaApp', causa: 'regla', entrada: 'DEPLOY.md §23' },
      { entidad: 'tickets', numeros: [9001], causa: 'propia', entrada: 'E-1' },
    ])
    const c = clasificar(propia, fila({ entidad: 'tickets', id: 'app-9001', numero: 9001 }))
    expect(c).toMatchObject({ causa: 'propia', entrada: 'E-1', indice: 1 })
    expect(conocidasSinUso(propia, [c as Clasificacion])).toEqual([{ indice: 0, entidad: 'tickets', entrada: 'DEPLOY.md §23' }])
  })

  it('P6: una conversación nacida en la app bajo el #1017 sale con E-267 (herencia antes que regla)', () => {
    const c = clasificar(real, fila({ entidad: 'conversaciones', id: 'c9', fuente: 'app', padres: [{ etiqueta: 'tickets:1017', lado: 'faltaEnZoho', clasificacion: ticketConocido }] }))
    expect(c).toMatchObject({ entrada: 'E-267', heredadaDe: 'tickets:1017' })
  })

  it('el id propio gana a la herencia', () => {
    const c = clasificar(real, fila({ entidad: 'adjuntos', id: '495552000061185001', padres: [{ etiqueta: 'tickets:1017', lado: 'faltaEnZoho', clasificacion: ticketConocido }] }))
    expect(c).toMatchObject({ entrada: 'DEPLOY.md §22' })
    expect(c?.heredadaDe).toBeUndefined()
  })
})

describe('conocidasSinUso y huecos', () => {
  it('la entrada que no explica ninguna fila sale con su índice, entidad y entrada; las usadas, no', () => {
    const cs = [clasificar(real, fila({ entidad: 'tickets', id: 'z-1', numero: 1017 })) as Clasificacion]
    const sinUso = conocidasSinUso(real, cs)
    expect(sinUso).toHaveLength(real.entradas.length - 1)
    expect(sinUso.map((u) => u.indice)).not.toContain(real.entradas.findIndex((e) => e.numeros !== undefined))
    expect(sinUso[0]).toEqual({ indice: 0, entidad: real.entradas[0].entidad, entrada: real.entradas[0].entrada })
  })

  it('sin ninguna clasificación, todas las entradas están sin uso', () => {
    expect(conocidasSinUso(real, [])).toHaveLength(real.entradas.length)
  })

  it('un hueco de lista no es diferencia: no tiene clase', () => {
    expect(clasificar(real, fila({ entidad: 'contactos', id: 'k9', lado: 'huecoDeLista' }))).toBeNull()
    expect(clasificar(real, fila({ entidad: 'contactos', id: 'k9', lado: 'faltaEnZoho' }))?.clase).toBe('sin explicar')
  })
})
