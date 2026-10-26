// medicion-garantias-por-marca (F1B-13), lote 1: la medición pura por fabricante y las fallas repetidas.
import { describe, it, expect } from 'vitest'
import { medirGarantias, claveMedicion, UMBRAL_FALLA_REPETIDA, conNumerosDeTicket } from './medicionGarantias'
import { CARGOS, CARGOS_MEDICION_GARANTIAS, puedeVerMedicionGarantias } from './cargos'
import type { GarantiaProveedor } from './garantiaProveedor'

let siguienteId = 1
/** Ficha «sí» mínima; cada prueba pisa sólo lo que le importa. */
function ficha(p: Partial<GarantiaProveedor> = {}): GarantiaProveedor {
  const id = p.id ?? siguienteId++
  return {
    id, asociacionId: id, ticketId: `T-${id}`, oviNumero: `OVI-${id}`, reclama: true, motivoNoReclama: null,
    respondidaPor: 'u', respondidaAt: '2026-10-01T00:00:00Z', fabricante: 'Acme', piezaReferencia: null,
    piezaSerial: null, rma: null, valorReclamado: null, origenValorReclamado: null, estado: 'abierta',
    resultado: null, valorRecuperado: null, enviadaAt: null, resueltaAt: null, aviso60At: null, moneda: 'USD', ...p,
  }
}
const resuelta = (p: Partial<GarantiaProveedor>) =>
  ficha({ estado: 'resuelta', resultado: 'nota_credito', valorRecuperado: 0, ...p })

describe('claveMedicion y el umbral (S-1, S-2)', () => {
  it('recorta y pasa a minúsculas, sin plegar acentos', () => {
    expect(claveMedicion('  ACME ')).toBe('acme')
    expect(claveMedicion('Müller')).not.toBe(claveMedicion('Muller'))
    expect(claveMedicion(null)).toBe('')
  })
  it('el umbral de falla repetida es 2', () => {
    expect(UMBRAL_FALLA_REPETIDA).toBe(2)
  })
})

describe('medirGarantias · reclamado y recuperado (RQ-TC-65)', () => {
  it('suma de cuatro estados: reclamado 1000 y recuperado 250', () => {
    const m = medirGarantias([
      ficha({ valorReclamado: 100 }),
      ficha({ estado: 'enviada', valorReclamado: 200 }),
      resuelta({ resultado: 'nota_credito', valorReclamado: 300, valorRecuperado: 250 }),
      resuelta({ resultado: 'rechazada', valorReclamado: 400, valorRecuperado: 0 }),
    ])
    expect(m.porFabricante).toHaveLength(1)
    const a = m.porFabricante[0]
    expect(a.fabricante).toBe('Acme')
    expect(a.reclamado).toBe(1000)
    expect(a.recuperado).toBe(250)
    expect(a.fichas).toBe(4)
    expect(a.sinResolver).toBe(2)
    expect(a.sinValorReclamado).toBe(0)
    expect(a.cociente).toBe(0.25)
    expect(a.resultados).toEqual({ reposicion: 0, nota_credito: 1, rechazada: 1 })
  })

  it('rechazada: reclamado 500, recuperado 0 y cociente 0 (M-3)', () => {
    const [a] = medirGarantias([resuelta({ resultado: 'rechazada', valorReclamado: 500, valorRecuperado: 0 })]).porFabricante
    expect(a.reclamado).toBe(500)
    expect(a.recuperado).toBe(0)
    expect(a.cociente).toBe(0)
    expect(a.resultados.rechazada).toBe(1)
  })

  it('abierta y enviada cuentan como reclamadas, no como recuperadas', () => {
    const [a] = medirGarantias([ficha({ valorReclamado: 100 }), ficha({ estado: 'enviada', valorReclamado: 200 })]).porFabricante
    expect(a.reclamado).toBe(300)
    expect(a.recuperado).toBe(0)
    expect(a.sinResolver).toBe(2)
  })

  it('una enviada con recuperado sintético 999 no suma a recuperado (M-2)', () => {
    const [a] = medirGarantias([ficha({ estado: 'enviada', valorReclamado: 100, valorRecuperado: 999 })]).porFabricante
    expect(a.recuperado).toBe(0)
  })

  it('una ficha «no» no entra en ninguna cifra (M-1a)', () => {
    const no = ficha({
      reclama: false, motivoNoReclama: 'mal_uso', estado: null, valorReclamado: 700,
      piezaReferencia: 'X-100',
    })
    const m = medirGarantias([no, ficha({ fabricante: 'Beta', valorReclamado: 10 })])
    expect(m.porFabricante.map(f => f.fabricante)).toEqual(['Beta'])
    expect(m.porFabricante[0].fichas).toBe(1)
    expect(m.porFabricante[0].reclamado).toBe(10)
  })

  it('sin valor reclamado se cuenta aparte y no suma 0 (M-4); su recuperado sí suma', () => {
    const [a] = medirGarantias([
      ficha({ valorReclamado: 100 }),
      resuelta({ valorReclamado: null, resultado: 'reposicion', valorRecuperado: 40 }),
    ]).porFabricante
    expect(a.reclamado).toBe(100)
    expect(a.fichas).toBe(2)
    expect(a.sinValorReclamado).toBe(1)
    expect(a.recuperado).toBe(40)
  })
})

describe('medirGarantias · agrupación (S-1)', () => {
  it('Acme y «  ACME » forman un grupo con etiqueta determinista (M-6)', () => {
    const f1 = ficha({ id: 1, fabricante: 'Acme', valorReclamado: 100 })
    const f2 = ficha({ id: 2, fabricante: '  ACME ', valorReclamado: 50 })
    const directo = medirGarantias([f1, f2])
    const permutado = medirGarantias([f2, f1])
    expect(directo.porFabricante).toHaveLength(1)
    expect(directo.porFabricante[0].reclamado).toBe(150)
    expect(directo.porFabricante[0].fichas).toBe(2)
    expect(directo.porFabricante[0].fabricante).toBe('Acme')
    expect(permutado).toEqual(directo)
  })

  it('Müller y Muller son dos grupos', () => {
    const m = medirGarantias([ficha({ fabricante: 'Müller' }), ficha({ fabricante: 'Muller' })])
    expect(m.porFabricante).toHaveLength(2)
  })

  it('una ficha «sí» sin fabricante cae en un grupo de etiqueta null', () => {
    const m = medirGarantias([ficha({ fabricante: null, valorReclamado: 5 })])
    expect(m.porFabricante).toHaveLength(1)
    expect(m.porFabricante[0].fabricante).toBeNull()
  })
})

describe('medirGarantias · cociente (S-6)', () => {
  it('sin reclamado, o con reclamado 0, el cociente es null y no NaN (M-8)', () => {
    const m = medirGarantias([
      ficha({ fabricante: 'Sin', valorReclamado: null }),
      resuelta({ fabricante: 'Cero', valorReclamado: 0, valorRecuperado: 0 }),
    ])
    for (const f of m.porFabricante) expect(f.cociente).toBeNull()
  })

  it('sin fichas la medición es vacía y no lanza', () => {
    expect(medirGarantias([])).toEqual({ porFabricante: [], fallasRepetidas: [] })
  })
})

describe('medirGarantias · orden determinista', () => {
  it('por reclamado descendente y, a igualdad, por clave; permutar no cambia nada', () => {
    const fichas = [
      ficha({ fabricante: 'Beta', valorReclamado: 100 }),
      ficha({ fabricante: 'Alfa', valorReclamado: 100 }),
      ficha({ fabricante: 'Gama', valorReclamado: 900 }),
    ]
    const m = medirGarantias(fichas)
    expect(m.porFabricante.map(f => f.fabricante)).toEqual(['Gama', 'Alfa', 'Beta'])
    expect(medirGarantias([...fichas].reverse())).toEqual(m)
  })
})

describe('medirGarantias · fallas repetidas (RQ-TC-66)', () => {
  it('frontera: una ficha no es repetida (M-5) y dos sí', () => {
    const f1 = ficha({ id: 1, piezaReferencia: 'X-100' })
    expect(medirGarantias([f1]).fallasRepetidas).toEqual([])
    const f2 = ficha({ id: 2, piezaReferencia: 'X-100' })
    const [r] = medirGarantias([f1, f2]).fallasRepetidas
    expect(r.fichas).toBe(2)
    expect(r.fabricante).toBe('Acme')
    expect(r.piezaReferencia).toBe('X-100')
    expect(r.ticketIds).toEqual(['T-1', 'T-2'])
  })

  it('mayúsculas y espacios no parten la clave (M-6)', () => {
    const m = medirGarantias([
      ficha({ id: 1, fabricante: 'Acme', piezaReferencia: 'x-100' }),
      ficha({ id: 2, fabricante: ' ACME', piezaReferencia: ' X-100 ' }),
    ])
    expect(m.fallasRepetidas).toHaveLength(1)
    expect(m.fallasRepetidas[0].fichas).toBe(2)
    expect(m.fallasRepetidas[0].piezaReferencia).toBe('x-100')
  })

  it('cualquier estado cuenta, también la rechazada', () => {
    const m = medirGarantias([
      resuelta({ resultado: 'rechazada', piezaReferencia: 'X-100' }),
      ficha({ piezaReferencia: 'X-100' }),
    ])
    expect(m.fallasRepetidas).toHaveLength(1)
  })

  it('sin referencia (vacía o sólo espacios) no cuenta, aunque compartan serial', () => {
    const m = medirGarantias([
      ficha({ piezaReferencia: '', piezaSerial: 'S1' }),
      ficha({ piezaReferencia: '   ', piezaSerial: 'S1' }),
    ])
    expect(m.fallasRepetidas).toEqual([])
  })

  it('la misma referencia de otro fabricante no se junta', () => {
    const m = medirGarantias([
      ficha({ fabricante: 'Acme', piezaReferencia: 'X-100' }),
      ficha({ fabricante: 'Beta', piezaReferencia: 'X-100' }),
    ])
    expect(m.fallasRepetidas).toEqual([])
  })

  it('una ficha «no» no cuenta', () => {
    const m = medirGarantias([
      ficha({ piezaReferencia: 'X-100' }),
      ficha({ reclama: false, motivoNoReclama: 'mal_uso', estado: null, piezaReferencia: 'X-100' }),
    ])
    expect(m.fallasRepetidas).toEqual([])
  })

  it('orden: más fichas primero, luego por clave; permutar no cambia nada', () => {
    const fichas = [
      ficha({ id: 1, piezaReferencia: 'B-1' }), ficha({ id: 2, piezaReferencia: 'B-1' }),
      ficha({ id: 3, piezaReferencia: 'A-1' }), ficha({ id: 4, piezaReferencia: 'A-1' }),
      ficha({ id: 5, piezaReferencia: 'C-1' }), ficha({ id: 6, piezaReferencia: 'C-1' }),
      ficha({ id: 7, piezaReferencia: 'C-1' }),
    ]
    const m = medirGarantias(fichas)
    expect(m.fallasRepetidas.map(f => f.piezaReferencia)).toEqual(['C-1', 'A-1', 'B-1'])
    expect(medirGarantias([...fichas].reverse())).toEqual(m)
  })
})

// Corrección de `decision/medicion-garantias-acceso` (17/10): quién ve la medición y el número del ticket.
describe('puedeVerMedicionGarantias (decision/medicion-garantias-acceso)', () => {
  it('el admin pasa aunque no tenga cargo', () => {
    expect(puedeVerMedicionGarantias({ isAdmin: true, cargoPermiso: null })).toBe(true)
  })
  it('pasan exactamente Director Técnico y Director Comercial; ningún otro cargo', () => {
    expect([...CARGOS_MEDICION_GARANTIAS].sort()).toEqual(['Director Comercial', 'Director Técnico'])
    for (const c of CARGOS) {
      expect(puedeVerMedicionGarantias({ isAdmin: false, cargoPermiso: c })).toBe(CARGOS_MEDICION_GARANTIAS.includes(c))
    }
  })
  it('sin cargo, con un cargo fuera de la lista o sin sujeto, no pasa', () => {
    expect(puedeVerMedicionGarantias({ isAdmin: false, cargoPermiso: null })).toBe(false)
    expect(puedeVerMedicionGarantias({ isAdmin: false })).toBe(false)
    expect(puedeVerMedicionGarantias({ isAdmin: false, cargoPermiso: 'director técnico' as never })).toBe(false)
    expect(puedeVerMedicionGarantias(null)).toBe(false)
    expect(puedeVerMedicionGarantias(undefined)).toBe(false)
  })
})

describe('conNumerosDeTicket', () => {
  it('cambia los ids por el número del ticket, en el mismo orden, y null si el ticket ya no existe', () => {
    const m = medirGarantias([
      ficha({ id: 1, ticketId: 'z-1', piezaReferencia: 'P' }),
      ficha({ id: 2, ticketId: 'z-2', piezaReferencia: 'P' }),
    ])
    const r = conNumerosDeTicket(m, new Map([['z-1', 996]]))
    expect(r.fallasRepetidas).toEqual([{ fabricante: 'Acme', piezaReferencia: 'P', fichas: 2, numerosTicket: [996, null] }])
    expect(r.porFabricante).toEqual(m.porFabricante)
    expect(JSON.stringify(r)).not.toContain('z-1')
  })
})

// valor-reclamado-usd (F1B-13), lote L1: cada grupo lleva su moneda (RQ-TC-80, RQ-TC-65). Lo demás no cambia.
describe('medirGarantias · moneda por grupo (RQ-TC-80)', () => {
  it('cada grupo trae moneda USD y el cociente no lleva moneda', () => {
    const m = medirGarantias([
      ficha({ fabricante: 'Acme', valorReclamado: 100 }),
      resuelta({ fabricante: 'Beta', valorReclamado: 100, valorRecuperado: 50 }),
    ])
    expect(m.porFabricante).toHaveLength(2)
    for (const g of m.porFabricante) expect(g.moneda).toBe('USD')
    const beta = m.porFabricante.find(g => g.fabricante === 'Beta')!
    expect(beta.cociente).toBe(0.5)
    expect(typeof beta.cociente).toBe('number')
  })
  it('CARACTERIZACIÓN: sumas, recuentos y orden idénticos; sólo se añade moneda', () => {
    const m = medirGarantias([
      ficha({ fabricante: 'Beta', valorReclamado: 100 }),
      ficha({ fabricante: 'Alfa', valorReclamado: 100 }),
      resuelta({ fabricante: 'Gama', valorReclamado: 900, valorRecuperado: 450, resultado: 'reposicion' }),
    ])
    expect(m.porFabricante).toEqual([
      { fabricante: 'Gama', moneda: 'USD', fichas: 1, sinResolver: 0, sinValorReclamado: 0, reclamado: 900, recuperado: 450, cociente: 0.5, resultados: { reposicion: 1, nota_credito: 0, rechazada: 0 } },
      { fabricante: 'Alfa', moneda: 'USD', fichas: 1, sinResolver: 1, sinValorReclamado: 0, reclamado: 100, recuperado: 0, cociente: 0, resultados: { reposicion: 0, nota_credito: 0, rechazada: 0 } },
      { fabricante: 'Beta', moneda: 'USD', fichas: 1, sinResolver: 1, sinValorReclamado: 0, reclamado: 100, recuperado: 0, cociente: 0, resultados: { reposicion: 0, nota_credito: 0, rechazada: 0 } },
    ])
    expect(m.porFabricante.every(g => g.moneda === 'USD')).toBe(true)
  })
})
