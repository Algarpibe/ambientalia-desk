import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * 1G-04 (RQ-ZS-44.1-2, D-4), fichero vigilado (regla de mutación 2): nadie importa `index.ts` porque arranca `main()` al cargarse,
 * así que el cableado del modo sin Zoho Desk se vigila leyendo el texto (molde `opcionesConversaciones.test.ts`).
 */
const lineas = readFileSync(path.resolve(__dirname, 'index.ts'), 'utf8').split(/\r?\n/)
const con = (texto: string) => lineas.filter((l) => l.includes(texto))
const una = (texto: string) => {
  const r = con(texto)
  expect(r, `se esperaba UNA línea con «${texto}»`).toHaveLength(1)
  return r[0]
}

describe('index.ts · el ciclo del temporizador', () => {
  it('la línea de cadenaDelCiclo( lleva las seis pasadas y sync.syncRecent() en orden, y termina en `}, config)`', () => {
    const l = una('cadenaDelCiclo({')
    const nombres = ['alarmas:', 'reclamaciones:', 'facturacionVencida:', 'salidasEsperas:', 'provisionalesEnBooks:', 'ritmoContratos:', 'ritmoYSincronizacion:', 'sync.syncRecent()']
    const pos = nombres.map((s) => l.indexOf(s))
    expect(pos.every((p) => p >= 0), `falta alguna pasada: ${pos.join(',')}`).toBe(true)
    expect([...pos].sort((a, b) => a - b)).toEqual(pos)
    expect(l.trimEnd().endsWith('}, config)')).toBe(true)
  })

  it('`let syncing = false` va seguida de `setInterval(() => {`: el temporizador no queda dentro de ningún if', () => {
    const i = lineas.findIndex((l) => l.trim() === 'let syncing = false')
    expect(i).toBeGreaterThanOrEqual(0)
    expect(lineas[i + 1].trim()).toBe('setInterval(() => {')
  })
})

describe('index.ts · el arranque', () => {
  it('el backfill, las actividades y los contactos iniciales llevan !config.modoSinZohoDesk', () => {
    expect(una('countTickets(pool)')).toContain('!config.modoSinZohoDesk')
    expect(una('if (config.syncActivities')).toContain('!config.modoSinZohoDesk')
    expect(una('if (config.syncContacts')).toContain('!config.modoSinZohoDesk')
  })

  it('la migración y la resiembra no llevan el salto: corren siempre', () => {
    expect(una('await migrate(pool)')).not.toContain('modoSinZohoDesk')
    expect(una('reseedTicketNumber(pool) }')).not.toContain('modoSinZohoDesk')
  })
})

describe('index.ts · el registro del modo', () => {
  it('const registroModo = aparece UNA vez, con avisar:, y createZohoClient( pasa registroModo', () => {
    expect(una('const registroModo =')).toContain('avisar:')
    expect(una('createZohoClient(')).toMatch(/registro:\s*registroModo/)
  })
})
