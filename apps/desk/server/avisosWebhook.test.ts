import { describe, it, expect, vi } from 'vitest'
import { dispararAvisos, type AvisoParaEnviar } from './avisosWebhook'
import type { AppConfig } from '@ambientalia/zoho-sync/config'

// `avisosCopiaEmail: ''` va en la fixture porque es lo que devuelve `loadConfig` cuando la variable no
// está: dejarlo `undefined` probaría un config que no existe en producción.
const config = (o: Partial<AppConfig> = {}) =>
  ({ avisosWebhookUrl: 'https://n8n/webhook/avisos', avisosWebhookToken: 'tok', appBaseUrl: 'https://desk.example', avisosCopiaEmail: '', ...o }) as AppConfig

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

/**
 * La copia de verificación: mientras dure la fase de pruebas, el administrador quiere ver los correos
 * de derivación que salen para otras personas.
 *
 * Se marca aviso por aviso (`conCopia`) en vez de copiarlo todo, y no es un detalle: los avisos de
 * ÁREA ya le llegan al administrador como destinatario de pleno derecho (`destinatariosDeArea` mete a
 * todos los administradores activos), así que copiarlos también le mandaría el mismo texto tantas
 * veces como destinatarios tuviera la transición.
 */
describe('dispararAvisos · copia de verificación', () => {
  const conCopia: AvisoParaEnviar[] = [{ ...uno[0], conCopia: true }]
  const cuerpo = async (avisos: AvisoParaEnviar[], o: Partial<AppConfig> = {}) => {
    const fake = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    await dispararAvisos(config(o), avisos, fake)
    return JSON.parse(fake.mock.calls[0][1].body as string)
  }

  it('añade la copia al final sin tocar el aviso original', async () => {
    const body = await cuerpo(conCopia, { avisosCopiaEmail: 'comercial@ambientalia.com.co' })
    expect(body.avisos).toHaveLength(2)
    expect(body.avisos[0]).toMatchObject({ email: 'ana@x.co', nombre: 'Ana', asunto: 'Ticket #12 · Desk Ambientalia' })
    expect(body.avisos[1]).toMatchObject({
      email: 'comercial@ambientalia.com.co',
      asunto: '[Copia] Ticket #12 · Desk Ambientalia',
    })
    // El texto dice a quién iba dirigido: sin eso, la copia es indistinguible del aviso propio y no
    // sirve para verificar nada.
    expect(body.avisos[1].texto).toContain('Ana')
    expect(body.avisos[1].texto).toContain('ana@x.co')
  })

  /**
   * La copia NO entra en la lista de ids que sella `marcarEnviados`, porque no es una fila de
   * `avisos`: si compartiera id, un fallo del correo del destinatario real quedaría sellado como
   * enviado por haber salido la copia.
   */
  it('la copia no lleva el id del aviso, que es lo que se sella en base de datos', async () => {
    const body = await cuerpo(conCopia, { avisosCopiaEmail: 'comercial@ambientalia.com.co' })
    expect(body.avisos[1].id).not.toBe('avi-1')
  })

  // Es una muleta de la fase de pruebas: se apaga borrando la variable, sin tocar código.
  it('sin dirección configurada no copia nada', async () => {
    expect((await cuerpo(conCopia)).avisos).toHaveLength(1)
  })

  // Los avisos de área ya le llegan al administrador como destinatario: copiarlos sería mandárselos
  // dos veces, y tantas como personas hubiera en el área.
  it('un aviso sin marcar no se copia', async () => {
    expect((await cuerpo(uno, { avisosCopiaEmail: 'comercial@ambientalia.com.co' })).avisos).toHaveLength(1)
  })

  // Si el aviso ya va a esa dirección, la copia es el mismo correo dos veces.
  it('no se copia a sí mismo cuando el destinatario ya es esa dirección', async () => {
    const propio: AvisoParaEnviar[] = [{ ...uno[0], email: 'comercial@ambientalia.com.co', conCopia: true }]
    expect((await cuerpo(propio, { avisosCopiaEmail: 'COMERCIAL@Ambientalia.com.co' })).avisos).toHaveLength(1)
  })
})
