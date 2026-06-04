import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchTickets, authMe } from './client'

afterEach(() => vi.restoreAllMocks())

describe('client', () => {
  it('fetchTickets pega a /api/tickets y devuelve json', async () => {
    const data = [{ id: '1', number: '#864' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status: 200 })))
    expect(await fetchTickets()).toEqual(data)
    expect(fetch).toHaveBeenCalledWith('/api/tickets', { credentials: 'include' })
  })

  it('authMe → null en 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))
    const res = await authMe()
    expect(res).toBeNull()
  })

  it('lanza si la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })))
    await expect(fetchTickets()).rejects.toThrow()
  })
})
