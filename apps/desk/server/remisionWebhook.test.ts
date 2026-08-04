import { describe, it, expect, vi } from 'vitest'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Remision, ClientLite, EquipoFull } from '@ambientalia/shared'
import { buildRemisionPayload, dispararRemision } from './remisionWebhook'

const remision = {
  id: 'rem-1', ticketId: 't1', tipo: 'entrada', fecha: '2026-08-03', tipoServicio: 'Mantenimiento',
  perfil: 'grimm_edm180', equipoId: 'eq-1', serial: '18A20070', incluye: ['Manuales'],
  observaciones: 'Llega con golpe', creadoPor: 'Gustavo', estado: 'pendiente', resultado: null, createdAt: '',
} as Remision

const cliente = {
  id: 'c1', name: 'Airlab Consulting S.A.S.', nit: '901229003', email: 'jose@airlab.co',
  companyName: 'Airlab Consulting S.A.S.', direccion: 'Km 19 Troncal', telefono: '(1) 8941075',
  personaContacto: 'José Luis López Parra',
} as ClientLite

const equipo = { id: 'eq-1', serial: '18A20070', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', active: true } as EquipoFull
const usuario = { name: 'Gustavo Novoa', email: 'g@ambientalia.co', cargo: 'Director Técnico' }

describe('buildRemisionPayload', () => {
  it('arma los campos que exige el nodo Validar payload del flujo', () => {
    const p = buildRemisionPayload({ remision, ticketNumero: '10000', cliente, equipo, usuario })
    // Los seis obligatorios: si alguno falta, n8n responde 400 enumerándolo.
    expect(p.remisionId).toBe('rem-1')
    expect(p.ticketNumero).toBe('10000')
    expect(p.fecha).toBe('2026-08-03')
    expect(p.tecnico.nombre).toBe('Gustavo Novoa')
    expect(p.equipo.serial).toBe('18A20070')
    expect(Array.isArray(p.incluye)).toBe(true)
    // Los datos del cliente que imprime el documento.
    expect(p.cliente).toMatchObject({ nit: '901229003', direccion: 'Km 19 Troncal', telefono: '(1) 8941075', personaContacto: 'José Luis López Parra' })
  })

  it('sin cliente ni equipo no revienta: cae al serial guardado en la remisión', () => {
    const p = buildRemisionPayload({ remision, ticketNumero: '10000', cliente: null, equipo: null, usuario })
    expect(p.equipo.serial).toBe('18A20070') // el de la remisión
    expect(p.cliente.nombre).toBe('')
    expect(p.cliente.nit).toBeNull()
  })
})

describe('dispararRemision', () => {
  const cfg = (o: Partial<AppConfig>) => ({ remisionWebhookUrl: '', remisionWebhookToken: '', ...o }) as AppConfig
  const payload = buildRemisionPayload({ remision, ticketNumero: '10000', cliente, equipo, usuario })

  it('sin URL configurada no llama a nadie y explica por qué', async () => {
    const f = vi.fn()
    const r = await dispararRemision(cfg({}), payload, f as unknown as typeof fetch)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toContain('N8N_REMISION_WEBHOOK_URL')
    expect(f).not.toHaveBeenCalled()
  })

  it('manda el token en la cabecera que exige el webhook', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }))
    const r = await dispararRemision(cfg({ remisionWebhookUrl: 'https://n8n/webhook/x', remisionWebhookToken: 'tok' }), payload, f as unknown as typeof fetch)
    expect(r.disparado).toBe(true)
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://n8n/webhook/x')
    expect((init.headers as Record<string, string>)['X-Remision-Token']).toBe('tok')
    expect(JSON.parse(init.body as string).remisionId).toBe('rem-1')
  })

  it('un rechazo de n8n se reporta, no se traga', async () => {
    const f = vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 403 }))
    const r = await dispararRemision(cfg({ remisionWebhookUrl: 'https://n8n/webhook/x' }), payload, f as unknown as typeof fetch)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toContain('403')
  })

  // `fetch` no solo devuelve respuestas con código de error: rechaza la promesa cuando el host no
  // resuelve, la conexión falla o el TLS/timeout expira — el modo de fallo típico de "n8n está caído".
  // Sin atraparlo, la excepción subiría por la ruta sin soltar la reclamación del envío.
  //
  // El mock imita cómo rechaza el `fetch` nativo de verdad: mensaje genérico "fetch failed" con el
  // detalle real (aquí, un DNS que no resuelve) en `error.cause`, que es donde vive lo que de verdad
  // sirve para diagnosticar. Un mock con un mensaje artesanal habría dado confianza falsa: en
  // producción el técnico nunca ve un mensaje tan descriptivo si no se mira `cause`.
  it('si n8n está caído (fetch rechaza), se reporta como no disparado en vez de lanzar', async () => {
    const causaReal = new Error('getaddrinfo ENOTFOUND n8n.invalido.local')
    const f = vi.fn().mockRejectedValue(new Error('fetch failed', { cause: causaReal }))
    const r = await dispararRemision(cfg({ remisionWebhookUrl: 'https://n8n/webhook/x' }), payload, f as unknown as typeof fetch)
    expect(r.disparado).toBe(false)
    expect(r.motivo).toContain('fetch failed')
    expect(r.motivo).toContain('ENOTFOUND') // el detalle útil vive en `cause`, no en el mensaje genérico
  })
})
