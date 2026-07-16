import { describe, it, expect, vi } from 'vitest'
import { createBooksClient } from './booksClient'
import type { AppConfig } from '../config'

const config = { booksApiDomain: 'books.test', booksAccountsDomain: 'acc.test', booksRefreshToken: 'r', booksClientId: 'c', booksClientSecret: 's', booksOrgId: 'o' } as AppConfig
const tokenRes = () => new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })

describe('booksClient', () => {
  it('refresca token y llama a la API con Authorization', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(tokenRes()).mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }))
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch })
    const res = await booksFetch('/contacts?x=1')
    expect(res.status).toBe(200)
    const [url, init] = fetchImpl.mock.calls[1]
    expect(String(url)).toBe('https://books.test/books/v3/contacts?x=1')
    expect((init.headers as Record<string, string>).Authorization).toBe('Zoho-oauthtoken tok')
  })

  it('reintenta tras 401 refrescando el token', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }))
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch })
    const res = await booksFetch('/salesorders')
    expect(res.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('reintenta tras 429 respetando Retry-After (evita perder artículos en el backfill)', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(new Response('{"ok":1}', { status: 200 }))
    const sleep = vi.fn().mockResolvedValue(undefined)
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch, sleep })
    const res = await booksFetch('/items/i1')
    expect(res.status).toBe(200)
    expect(sleep).toHaveBeenCalledWith(2000) // Retry-After: 2s → 2000ms
  })

  it('se rinde tras varios 429 seguidos en vez de colgarse', async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string) =>
      String(url).includes('/oauth/') ? tokenRes() : new Response('', { status: 429 })
    )
    const sleep = vi.fn().mockResolvedValue(undefined)
    const { booksFetch } = createBooksClient({ config, fetchImpl: fetchImpl as unknown as typeof fetch, sleep })
    const res = await booksFetch('/items/i1')
    expect(res.status).toBe(429) // devuelve el 429 tras agotar los reintentos, no un bucle infinito
  })
})
