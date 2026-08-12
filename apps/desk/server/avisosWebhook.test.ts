import { describe, it, expect, vi } from 'vitest'
import { dispararAvisos, type AvisoParaEnviar } from './avisosWebhook'
import type { AppConfig } from '@ambientalia/zoho-sync/config'

const config = (o: Partial<AppConfig> = {}) =>
  ({ avisosWebhookUrl: 'https://n8n/webhook/avisos', avisosWebhookToken: 'tok', appBaseUrl: 'https://desk.example', ...o }) as AppConfig

const uno: AvisoParaEnviar[] = [
  { id: 'avi-1', email: 'ana@x.co', nombre: 'Ana', texto: 'Beto te derivó el ticket #12 en «Aprobación»', ticketNumero: 12 },
]

describe('dispararAvisos', () => {
  it('manda los avisos con el token, el asunto y el enlace a la aplicación', async () => {
    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const r = await dispararAvisos(config(), uno, fake)

    expect(r.disparado).toBe(true)
    const [url, init] = fake.mock.calls[0]
    expect(url).toBe('https://n8n/webhook/avisos')
    expect((init.headers as Record<string, string>)['X-Avisos-Token']).toBe('tok')
    const body = JSON.parse(init.body as string)
    expect(body.avisos[0]).toMatchObject({
      id: 'avi-1', email: 'ana@x.co', nombre: 'Ana',
      asunto: 'Ticket #12 · Desk Ambientalia',
      url: 'https://desk.example',
    })
  })

  // Sin URL configurada no se manda nada Y NO SE LLAMA a fetch: es el estado de «canal apagado»,
  // legítimo, no un fallo. La campana sigue avisando igual.
  it('sin webhook configurado no llama a nadie y lo dice', async () => {
    const fake = vi.fn()
    const r = await dispararAvisos(config({ avisosWebhookUrl: '' }), uno, fake)
    expect(r).toEqual({ disparado: false, motivo: 'N8N_AVISOS_WEBHOOK_URL sin configurar' })
    expect(fake).not.toHaveBeenCalled()
  })

  // Una lista vacía tampoco molesta a n8n: la mayoría de transiciones no generan ningún aviso.
  it('sin avisos que mandar no llama a nadie', async () => {
    const fake = vi.fn()
    expect((await dispararAvisos(config(), [], fake)).disparado).toBe(false)
    expect(fake).not.toHaveBeenCalled()
  })

  it('un n8n caído devuelve el motivo en vez de lanzar', async () => {
    const fake = vi.fn().mockRejectedValue(Object.assign(new Error('fetch failed'), { cause: new Error('ECONNREFUSED') }))
    const r = await dispararAvisos(config(), uno, fake)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toMatch(/ECONNREFUSED/)
  })

  it('un n8n que responde mal devuelve el estado', async () => {
    const fake = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }))
    const r = await dispararAvisos(config(), uno, fake)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toMatch(/500/)
  })
})
