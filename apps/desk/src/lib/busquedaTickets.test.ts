import { describe, it, expect, vi, afterEach } from 'vitest'
import { conBusqueda, aplazar, ESPERA_BUSQUEDA_MS } from './busquedaTickets'

describe('conBusqueda: el cliente sólo decide si hay algo que enviar', () => {
  it('q vacío devuelve la URL intacta, con y sin parámetros', () => {
    expect(conBusqueda('/api/tickets', '')).toBe('/api/tickets')
    expect(conBusqueda('/api/tickets?scope=closed&page=2', '')).toBe('/api/tickets?scope=closed&page=2')
  })

  it('añade q con ? si la URL no tiene parámetros y con & si ya los tiene', () => {
    expect(conBusqueda('/api/tickets', '864')).toBe('/api/tickets?q=864')
    expect(conBusqueda('/api/tickets?scope=closed&page=1', '864')).toBe('/api/tickets?scope=closed&page=1&q=864')
  })

  it('codifica el texto: # % & espacios y acentos viajan sin romper la URL', () => {
    expect(conBusqueda('/api/mis-tickets', '#864')).toBe('/api/mis-tickets?q=%23864')
    expect(conBusqueda('/api/tickets', 'a&b=c d%')).toBe('/api/tickets?q=a%26b%3Dc%20d%25')
    expect(conBusqueda('/api/tickets', 'sérial')).toBe('/api/tickets?q=s%C3%A9rial')
  })

  it('no recorta, no quita # y no pasa a minúsculas: eso es del servidor', () => {
    expect(conBusqueda('/api/tickets', '  AbC ')).toBe('/api/tickets?q=%20%20AbC%20')
  })
})

describe('aplazar: espera entre pulsaciones', () => {
  afterEach(() => { vi.useRealTimers() })

  it('la espera por defecto de la caja es de 300 ms', () => {
    expect(ESPERA_BUSQUEDA_MS).toBe(300)
  })

  it('llama una sola vez, pasados ms', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    aplazar(fn, 300)
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancelada no llama', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const cancelar = aplazar(fn, 300)
    vi.advanceTimersByTime(100)
    cancelar()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })
})
