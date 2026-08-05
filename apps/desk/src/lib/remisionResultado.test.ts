import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { fmtFecha, fmtFechaHora } from './remisionResultado'

/**
 * Este bloque se sale a propósito del `TZ=UTC` que fija `vitest.config.ts` para reproducir el
 * contenedor, porque para ESTA función UTC es justo la zona en la que el fallo no se manifiesta: sin
 * el anclaje, `new Date("2026-05-19")` es medianoche UTC y bajo UTC se pinta como el 19 igual que con
 * él, así que la implementación buena y la rota dan lo mismo y el test no distingue ninguna de las
 * dos. El corrimiento solo aparece con desfase negativo, que es donde vive el técnico
 * (`America/Bogota`, UTC-5) y donde de verdad corre esta función: en el navegador, nunca en el
 * servidor.
 *
 * Vitest aísla cada fichero de test en su propio worker, así que la zona no se escapa de aquí.
 */
beforeAll(() => { vi.stubEnv('TZ', 'America/Bogota') })
afterAll(() => { vi.unstubAllEnvs() })

describe('fmtFecha', () => {
  it('no se corre un día: "2026-05-19" se pinta como el 19, no como el 18', () => {
    // Guardia del propio test, antes de mirar nada: en esta zona el parseo ingenuo SÍ retrocede un
    // día. El día que deje de hacerlo —otro Node, otro vitest, un `stubEnv` que deje de surtir
    // efecto— este `expect` lo grita, en vez de dejar pasar en verde un test que ya no prueba nada.
    expect(new Intl.DateTimeFormat('es-CO', { day: '2-digit' }).format(new Date('2026-05-19'))).toBe('18')

    // Se mira el DÍA y no la cadena entera porque el texto exacto ("19 de may de 2026") depende de la
    // versión de ICU del runtime, y el día es lo único que la función existe para no estropear.
    const out = fmtFecha('2026-05-19')
    expect(out).toContain('19')
    expect(out).not.toContain('18')
    expect(out).toContain('2026')
  })

  it('un valor que no es fecha se devuelve tal cual en vez de pintar "Invalid Date"', () => {
    expect(fmtFecha('')).toBe('')
    expect(fmtFecha('sin fecha')).toBe('sin fecha')
  })
})

describe('fmtFechaHora', () => {
  it('añade la hora al instante ISO', () => {
    const out = fmtFechaHora('2026-05-19T19:32:00.000Z')
    expect(out).toContain('2026')
    expect(out).toContain(':') // la hora
  })

  it('un valor que no es instante se devuelve tal cual', () => {
    expect(fmtFechaHora('')).toBe('')
  })
})
