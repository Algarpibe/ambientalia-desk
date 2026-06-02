import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchTickets, updateTicketStatus } from './client'

afterEach(() => vi.restoreAllMocks())

describe('client', () => {
  it('fetchTickets pega a /api/tickets y devuelve json', async () => {
    const data = [{ id: '1', number: '#864' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 })))
    expect(await fetchTickets()).toEqual(data)
    expect(fetch).toHaveBeenCalledWith('/api/tickets')
  })

  it('lanza si la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))
    await expect(fetchTickets()).rejects.toThrow()
  })

  it('updateTicketStatus envía PATCH con el status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    await updateTicketStatus('1', 'En Proceso')
    const [url, init] = (fetch as any).mock.calls[0]
    expect(url).toBe('/api/tickets/1/status')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ status: 'En Proceso' })
  })
})
