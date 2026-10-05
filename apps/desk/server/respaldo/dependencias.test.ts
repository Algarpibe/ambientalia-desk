import { describe, it, expect, vi } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cargarConfigRespaldo } from './config'
import { argumentosPgDump, avisarFallo, subirObjeto } from './dependencias'

/** F1F-02 (RQ-ZS-20): las piezas que tocan el mundo, con `fetch` inyectado. `pg_dump` sólo se prueba por sus argumentos. */
const CFG = cargarConfigRespaldo({
  RESPALDO_HABILITADO: 'true', RESPALDO_S3_ENDPOINT: 'https://s3.ejemplo.test/', RESPALDO_S3_REGION: 'auto', RESPALDO_S3_BUCKET: 'copias',
  RESPALDO_S3_ACCESS_KEY_ID: 'id', RESPALDO_S3_SECRET_ACCESS_KEY: 'secreto', RESPALDO_AVISO_EMAIL: 'responsable@ejemplo.test',
  DATABASE_URL: 'postgres://u:p@h:5432/desk',
})
const AVISOS = { avisosWebhookUrl: 'https://n8n.ejemplo.test/webhook/avisos', avisosWebhookToken: 'tok', appBaseUrl: 'https://desk.ejemplo.test' }

function fichero(contenido: string) {
  const ruta = path.join(mkdtempSync(path.join(tmpdir(), 'dep-test-')), 'a.enc'); writeFileSync(ruta, contenido); return ruta
}

describe('subirObjeto', () => {
  it('PUT con estilo de ruta, Content-MD5, Content-Length y firma SigV4 sobre UNSIGNED-PAYLOAD', async () => {
    const f = vi.fn(async () => new Response('', { status: 200 }))
    await subirObjeto(CFG, fichero('cifrado'), 'diaria/desk-x.dump.enc', 'bWQ1', 7, f, new Date('2026-10-06T03:00:00Z'))
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }]
    expect(url).toBe('https://s3.ejemplo.test/copias/diaria/desk-x.dump.enc')
    expect(init.method).toBe('PUT')
    expect(init.headers['Content-MD5']).toBe('bWQ1')
    expect(init.headers['Content-Length']).toBe('7')
    expect(init.headers['x-amz-content-sha256']).toBe('UNSIGNED-PAYLOAD')
    expect(init.headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=id\/20261006\/auto\/s3\/aws4_request,SignedHeaders=content-length;content-md5;host;x-amz-content-sha256;x-amz-date,Signature=[0-9a-f]{64}$/)
  })

  it('una respuesta que no es 2xx lanza con el estado y el cuerpo', async () => {
    const f = vi.fn(async () => new Response('<Error>AccessDenied</Error>', { status: 403 }))
    await expect(subirObjeto(CFG, fichero('x'), 'k', 'm', 1, f, new Date())).rejects.toThrow(/S3 403: <Error>AccessDenied/)
  })
})

describe('avisarFallo', () => {
  it('manda un correo al responsable por el webhook de avisos, con su token', async () => {
    const f = vi.fn(async () => new Response('', { status: 200 }))
    await avisarFallo(CFG, AVISOS, 'Falló la copia nocturna', 'S3 403', f)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }]
    expect(url).toBe(AVISOS.avisosWebhookUrl)
    expect(init.headers['X-Avisos-Token']).toBe('tok')
    const item = JSON.parse(String(init.body)).avisos[0]
    expect(item).toMatchObject({ email: 'responsable@ejemplo.test', asunto: 'Falló la copia nocturna · Desk Ambientalia', texto: 'S3 403', url: AVISOS.appBaseUrl })
  })

  it('sin webhook o sin responsable no manda nada, y lo dice', async () => {
    const f = vi.fn(async () => new Response('', { status: 200 }))
    await expect(avisarFallo(CFG, { ...AVISOS, avisosWebhookUrl: '' }, 'a', 'b', f)).rejects.toThrow(/N8N_AVISOS_WEBHOOK_URL/)
    await expect(avisarFallo({ ...CFG, avisoEmail: '' }, AVISOS, 'a', 'b', f)).rejects.toThrow(/RESPALDO_AVISO_EMAIL/)
    expect(f).not.toHaveBeenCalled()
  })
})

describe('argumentosPgDump', () => {
  it('formato custom, sin dueños ni privilegios, y la URL de la base como último argumento', () => {
    expect(argumentosPgDump('postgres://u:p@h:5432/desk')).toEqual(['--format=custom', '--no-owner', '--no-privileges', '--dbname=postgres://u:p@h:5432/desk'])
  })
})
