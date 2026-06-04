import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchTickets } from './client'

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
})
