import { describe, it, expect } from 'vitest'
import { cargarConocidas, ErrorLista, leerLista, REGLAS, ENTIDADES } from './conocidas'

/**
 * verificacion-completitud (1G-03, D2, RQ-ZS-34) · la lista de conocidas es un fichero de datos validado al cargar.
 * QUÉ COMPRUEBA: que el fichero REAL carga (siete entradas, el #1017 con E-267, CA-5); que copias ENSUCIADAS en memoria —sin causa, sin entrada,
 * entrada mal formada, regla o entidad desconocida, clave de más, `ids` y `regla` juntas, `numeros` fuera de tickets, id o número repetido— no
 * cargan y el error nombra la entrada por su índice SIN repetir el valor defectuoso (CA-6).
 * QUÉ NO COMPRUEBA: que la entrada citada exista en la bandeja (al final de `deployVerificacionCompletitud.test.ts`) ni cómo se clasifica (`clasificar.test.ts`).
 */
type Lista = { version: number; entradas: Record<string, unknown>[] }
const real = (): Lista => JSON.parse(leerLista()) as Lista
const MARCA = 'SECRETO'
const indice = (pred: (e: Record<string, unknown>) => boolean): number => real().entradas.findIndex(pred)
const I_1017 = indice((e) => Array.isArray(e.numeros) && (e.numeros as number[]).includes(1017))
const I_ADJ = indice((e) => e.entidad === 'adjuntos')
const I_REGLA = indice((e) => e.regla === 'nacidoEnLaApp')
const sucia = (i: number, cambio: (e: Record<string, unknown>) => void): string => {
  const l = real()
  cambio(l.entradas[i])
  return JSON.stringify(l)
}
const mensaje = (texto: string): string => {
  try {
    cargarConocidas(texto)
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorLista)
    return (e as Error).message
  }
  return 'NO LANZÓ'
}

describe('conocidas.json real', () => {
  it('carga sin error: versión 1, siete entradas y todas las entidades y reglas dentro del conjunto cerrado', () => {
    const lista = cargarConocidas(leerLista())
    expect(lista.version).toBe(1)
    expect(lista.entradas).toHaveLength(7)
    expect(lista.entradas.every((e) => ENTIDADES.includes(e.entidad))).toBe(true)
    expect(lista.entradas.filter((e) => e.regla !== undefined).map((e) => `${e.regla}:${e.entidad}`).sort()).toEqual([
      'conversacionAusenteEnZoho:conversaciones', 'nacidoEnLaApp:contactos', 'nacidoEnLaApp:conversaciones', 'nacidoEnLaApp:cuentas', 'nacidoEnLaApp:tickets',
    ])
  })

  it('el #1017 va por número, con su causa y E-267, y no es la última entrada (CA-5)', () => {
    const lista = cargarConocidas(leerLista())
    const e = lista.entradas[I_1017]
    expect(I_1017).toBeGreaterThan(0)
    expect(I_1017).toBeLessThan(lista.entradas.length - 1)
    expect(e).toMatchObject({ entidad: 'tickets', numeros: [1017], entrada: 'E-267' })
    expect(e.causa).toContain('Zoho no lo devuelve')
  })

  it('los dos adjuntos de 1G-02 van por id, con DEPLOY.md §22 y su causa del 404', () => {
    const e = cargarConocidas(leerLista()).entradas[I_ADJ]
    expect(e.ids).toEqual(['495552000061185001', '495552000057838002'])
    expect(e.entrada).toBe('DEPLOY.md §22')
    expect(e.causa).toContain('404')
  })

  it('las parejas de REGLAS son las cinco del diseño, y no hay ninguna otra', () => {
    expect(REGLAS.map(([r, e]) => `${r}:${e}`)).toEqual([
      'nacidoEnLaApp:tickets', 'nacidoEnLaApp:conversaciones', 'nacidoEnLaApp:contactos', 'nacidoEnLaApp:cuentas', 'conversacionAusenteEnZoho:conversaciones',
    ])
  })
})

describe('copias ensuciadas: no cargan y nombran la entrada sin repetir el valor (CA-6)', () => {
  const casos: [string, () => string, string][] = [
    ['sin causa', () => sucia(I_1017, (e) => { delete e.causa }), 'causa'],
    ['causa vacía', () => sucia(I_1017, (e) => { e.causa = '  ' }), 'causa'],
    ['sin entrada', () => sucia(I_1017, (e) => { delete e.entrada }), 'entrada'],
    ['entrada mal formada', () => sucia(I_1017, (e) => { e.entrada = `E-${MARCA}` }), 'entrada'],
    ['regla desconocida', () => sucia(I_REGLA, (e) => { e.regla = `regla${MARCA}` }), 'regla'],
    ['regla sobre una entidad que no es suya', () => sucia(I_REGLA, (e) => { e.regla = 'conversacionAusenteEnZoho' }), 'regla'],
    ['entidad desconocida', () => sucia(I_1017, (e) => { e.entidad = `entidad${MARCA}` }), 'entidad'],
    ['clave de más', () => sucia(I_1017, (e) => { e[`clave${MARCA}`] = 1 }), 'clave'],
    ['ids y regla juntas', () => sucia(I_ADJ, (e) => { e.regla = 'nacidoEnLaApp' }), 'exactamente una'],
    ['ninguna de ids, numeros o regla', () => sucia(I_1017, (e) => { delete e.numeros }), 'exactamente una'],
    ['numeros fuera de tickets', () => sucia(I_1017, (e) => { e.entidad = 'contactos' }), 'numeros'],
    ['número no entero', () => sucia(I_1017, (e) => { e.numeros = [1017.5] }), 'numeros'],
    ['id con espacios', () => sucia(I_ADJ, (e) => { e.ids = [`a ${MARCA}`] }), 'ids'],
  ]
  it.each(casos)('%s', (_nombre, texto, campo) => {
    const m = mensaje(texto())
    expect(m).toMatch(/entrada \d+/)
    expect(m).toContain(campo)
    expect(m).not.toContain(MARCA)
  })

  it('el mensaje lleva el índice DE la entrada defectuosa, no otro', () => {
    expect(mensaje(sucia(I_1017, (e) => { delete e.causa }))).toContain(`entrada ${I_1017}`)
    expect(mensaje(sucia(I_ADJ, (e) => { delete e.causa }))).toContain(`entrada ${I_ADJ}`)
  })

  it('un id repetido en dos entradas es inválido y nombra las dos', () => {
    const l = real()
    l.entradas.push({ ...l.entradas[I_ADJ] })
    const m = mensaje(JSON.stringify(l))
    expect(m).toContain(`entrada ${l.entradas.length - 1}`)
    expect(m).toContain(`entrada ${I_ADJ}`)
  })

  it('un número repetido en dos entradas es inválido y nombra las dos', () => {
    const l = real()
    l.entradas.push({ ...l.entradas[I_1017] })
    const m = mensaje(JSON.stringify(l))
    expect(m).toContain(`entrada ${l.entradas.length - 1}`)
    expect(m).toContain(`entrada ${I_1017}`)
  })

  it('la lista entera: JSON roto, versión inválida y entradas que no son lista', () => {
    expect(mensaje('{ no es json')).toMatch(/JSON/)
    expect(mensaje(JSON.stringify({ ...real(), version: 0 }))).toContain('version')
    expect(mensaje(JSON.stringify({ version: 1, entradas: {} }))).toContain('entradas')
    expect(mensaje('[]')).toContain('objeto')
  })

  it('un JSON roto no repite su contenido', () => {
    expect(mensaje(`{ "x": ${MARCA}`)).not.toContain(MARCA)
  })
})
