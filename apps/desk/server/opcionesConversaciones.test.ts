import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { opcionesConversaciones } from './opcionesConversaciones'

/**
 * sync-conversaciones-zoho, corrección de W-2 del verify-report: el cableado de los dos interruptores en la App no lo veía ninguna
 * prueba, porque nadie importa `index.ts`. La lectura pasa a `opcionesConversaciones` (probada aquí) y `index.ts` sólo la llama;
 * la segunda prueba vigila esa llamada leyendo el fichero (regla de mutación 2: se prueba ensuciando el fichero vigilado).
 */
const indice = readFileSync(path.resolve(__dirname, 'index.ts'), 'utf8')

describe('opcionesConversaciones · la única lectura de los dos interruptores (S-1b)', () => {
  it('cada interruptor llega a su campo, sin cruzarse, y no fija esperas: la App usa las de por omisión', () => {
    for (const periodica of [false, true]) {
      for (const marcar of [false, true]) {
        const o = opcionesConversaciones({ syncConversacionesPeriodica: periodica, marcarConversacionesAusentes: marcar })
        expect(o).toEqual({ periodica, marcarAusentes: marcar })
      }
    }
  })

  it('index.ts pasa esas opciones a createSync y no lee los interruptores por su cuenta', () => {
    const llamada = indice.split(/\r?\n/).find((l) => l.includes('createSync({')) ?? ''
    expect(llamada).toContain('conversaciones: opcionesConversaciones(config)')
    expect(indice).not.toMatch(/config\.(syncConversacionesPeriodica|marcarConversacionesAusentes)/)
  })
})
