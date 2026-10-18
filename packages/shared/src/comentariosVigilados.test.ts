import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO,
  TRANSICION_REMISION_CONFIRMADA, CLAVE_DERIVACION,
} from './transitions'
import { ESTADOS_SERVICIO, ESTADOS_EN_ESPERA } from './estados'

/**
 * CIFRAS Y REFERENCIAS EN COMENTARIOS QUE NADA VIGILABA (E-228, F1B-09).
 *
 * Un comentario con un número («otras 43», «da SEIS») envejece en silencio: ni `tsc`, ni `eslint`, ni
 * las pruebas lo leen. Este guardián LEE EL FICHERO VIGILADO (regla de mutación 2) y exige que la cifra
 * escrita coincida con la que el código calcula hoy. Los literales de palabra están escritos a propósito:
 * si el código cambia, se toca este fichero A PROPÓSITO, en el mismo commit que el comentario.
 * El caso (e) cubre además E-227: `transitionsForStatus` y `transitionById` no tienen llamador de
 * producción, y el comentario lo dice; si alguien los llama, el comentario deja de ser cierto.
 */

const leer = (ruta: string): string => readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')
const lineas = (texto: string): string[] => texto.split(/\r?\n/)

const PALABRAS = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE',
  'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE']
const palabra = (n: number): string => PALABRAS[n] ?? `«${n} sin palabra en el mapa»`

describe('comentarios vigilados (E-228, E-227)', () => {
  it('(a) estados.ts: las cifras de «salida única» y su cruce con en_espera son las del código', () => {
    const salidas = new Map<string, number>()
    for (const t of TRANSITIONS) for (const f of t.from) salidas.set(f, (salidas.get(f) ?? 0) + 1)
    const unica = ESTADOS_SERVICIO.filter((e) => salidas.get(e) === 1)
    const cruce = unica.filter((e) => (ESTADOS_EN_ESPERA as string[]).includes(e))
    const fuente = leer('./estados.ts')
    expect(fuente, `estados.ts debe decir «Hay ${palabra(unica.length)}» (salida única: ${unica.length})`).toContain(`Hay ${palabra(unica.length)}`)
    expect(fuente, `estados.ts debe decir «da ${palabra(cruce.length)},» (cruce con en_espera: ${cruce.length})`).toContain(`da ${palabra(cruce.length)},`)
  })

  it('(b) estados.ts: el comentario de `Remisión creada` nombra la transición que entra', () => {
    const l = lineas(leer('./estados.ts'))
    const i = l.findIndex((x) => x.includes("'Remisión creada': 'interna',"))
    expect(i).toBeGreaterThan(0)
    const bloque = l.slice(Math.max(0, i - 3), i).join('\n')
    expect(bloque, `el comentario sobre «Remisión creada» debe nombrar \`${TRANSICION_REMISION_CONFIRMADA.id}\``).toContain(`\`${TRANSICION_REMISION_CONFIRMADA.id}\``)
  })

  it('(c) ticketService.ts: «en las otras N transiciones» cuenta las del código', () => {
    const n = TRANSITIONS.length + TRANSITIONS_EQUIPO_NUEVO.length + TRANSITIONS_SOPORTE_REMOTO.length - 1
    const fuente = leer('../../../apps/desk/server/services/ticketService.ts')
    expect(fuente, `ticketService.ts debe decir «en las otras ${n} transiciones»`).toContain(`en las otras ${n} transiciones`)
  })

  it('(d) transitions.ts: el docblock de EQUIPO_NUEVO nombra las transiciones con campo de negocio', () => {
    const l = lineas(leer('./transitions.ts'))
    const fin = l.findIndex((x) => x.startsWith('export const TRANSITIONS_EQUIPO_NUEVO'))
    expect(fin).toBeGreaterThan(0)
    const campos = l.slice(0, fin).filter((x) => x.includes('Campos:')).pop() ?? ''
    const conNegocio = TRANSITIONS_EQUIPO_NUEVO
      .filter((t) => t.fields.some((f) => f.key !== 'comment' && f.key !== CLAVE_DERIVACION))
      .map((t) => t.id)
    expect(conNegocio.length).toBeGreaterThan(0)
    for (const id of conNegocio) expect(campos, `la línea «Campos:» debe nombrar \`${id}\``).toContain(`\`${id}\``)
    expect(campos).not.toContain('Campos: sólo `comment()`')
  })

  it('(e) E-227: el comentario de transitionsForStatus lo declara y no hay llamadores de producción', () => {
    const l = lineas(leer('./transitions.ts'))
    const i = l.findIndex((x) => x.startsWith('export function transitionsForStatus'))
    expect(i).toBeGreaterThan(0)
    expect(l[i - 1], 'el JSDoc de transitionsForStatus debe decir «sin llamador de producción»').toContain('sin llamador de producción')

    const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))
    const fuentes = (dir: string): string[] => {
      const salida: string[] = []
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const ruta = join(dir, e.name)
        if (e.isDirectory()) {
          if (!['node_modules', 'dist', '.codegraph', '.git'].includes(e.name)) salida.push(...fuentes(ruta))
        } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) salida.push(ruta)
      }
      return salida
    }
    const propios = [join('shared', 'src', 'transitions.ts'), join('shared', 'src', 'index.ts')]
    const llamadores = (nombre: string): string[] =>
      ['apps', 'packages', 'scripts'].flatMap((d) => { try { return fuentes(join(RAIZ, d)) } catch { return [] } })
        .filter((f) => !propios.some((p) => f.endsWith(p)) && readFileSync(f, 'utf8').includes(`${nombre}(`))
        .map((f) => f.slice(RAIZ.length))
    expect(llamadores('transitionsForStatus')).toEqual([])
    expect(llamadores('transitionById')).toEqual([])
  })

  it('(f) E-226: la cifra de la vista en estados.ts y su cita en sla.test.ts son las del código', () => {
    const n = ESTADOS_EN_ESPERA.length, fuente = leer('./estados.ts')
    expect(fuente, `estados.ts:21 debe decir «${n} estados — LO QUE DECLARA»`).toContain(`${n} estados — LO QUE DECLARA`)
    expect(fuente, `estados.ts:28 debe decir «La vista muestra las ${palabra(n).toLowerCase()}.»`).toContain(`La vista muestra las ${palabra(n).toLowerCase()}.`)
    expect(fuente, `estados.ts:115 debe decir «Las ${palabra(n)} que la vista»`).toContain(`Las ${palabra(n)} que la vista`)
    expect(leer('./sla.test.ts'), 'sla.test.ts cita la frase de estados.ts:28').toContain(`La vista muestra las ${palabra(n).toLowerCase()}.`)
  })
})
