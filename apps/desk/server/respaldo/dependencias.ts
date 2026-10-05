import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { firmarPeticion } from './firmaS3'
import type { ConfigRespaldo } from './config'
import type { Dependencias } from './respaldo'

/**
 * Las dependencias reales del respaldo (F1F-02, RQ-ZS-20). `pg_dump` necesita el cliente de Postgres en la imagen
 * (`Dockerfile`), y su versión tiene que ser igual o mayor que la del servidor (hipótesis H-1 de la propuesta).
 */
export const argumentosPgDump = (databaseUrl: string): string[] => ['--format=custom', '--no-owner', '--no-privileges', `--dbname=${databaseUrl}`]

function volcar(cfg: ConfigRespaldo): ReturnType<Dependencias['volcar']> {
  const hijo = spawn('pg_dump', argumentosPgDump(cfg.databaseUrl), { stdio: ['ignore', 'pipe', 'pipe'] })
  let errores = ''
  hijo.stderr.on('data', (t: Buffer) => { errores = (errores + t.toString()).slice(-500) })
  const terminado = new Promise<void>((resolver, rechazar) => {
    hijo.on('error', (e) => rechazar(new Error(`no se pudo arrancar pg_dump: ${e.message}`)))
    hijo.on('close', (codigo) => (codigo === 0 ? resolver() : rechazar(new Error(`pg_dump salió con ${codigo}: ${errores.trim()}`))))
  })
  return { flujo: hijo.stdout, terminado }
}

/** El correo al responsable sale por el mismo webhook de n8n que los avisos (`apps/desk/server/avisosWebhook.ts`). */
export async function avisarFallo(cfg: ConfigRespaldo, avisos: Pick<AppConfig, 'avisosWebhookUrl' | 'avisosWebhookToken' | 'appBaseUrl'>, asunto: string, texto: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (!avisos.avisosWebhookUrl) throw new Error('N8N_AVISOS_WEBHOOK_URL sin configurar: el fallo del respaldo no llega por correo')
  if (!cfg.avisoEmail) throw new Error('RESPALDO_AVISO_EMAIL sin configurar: no hay a quién avisar')
  const item = { id: `respaldo-${Date.now()}`, email: cfg.avisoEmail, nombre: 'Responsable del respaldo', asunto: `${asunto} · Desk Ambientalia`, texto, url: avisos.appBaseUrl }
  const res = await fetchImpl(avisos.avisosWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Avisos-Token': avisos.avisosWebhookToken },
    body: JSON.stringify({ avisos: [item] }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`n8n respondió ${res.status}`)
}

/** `PUT` firmado, con la clave en estilo de ruta (`<endpoint>/<bucket>/<clave>`), que aceptan B2, R2 y S3. */
export async function subirObjeto(cfg: ConfigRespaldo, ruta: string, clave: string, md5Base64: string, tamano: number, fetchImpl: typeof fetch = fetch, fecha = new Date()): Promise<void> {
  const url = new URL(`${cfg.endpoint.replace(/\/+$/, '')}/${cfg.bucket}/${clave}`)
  // `Content-MD5` lo exige el bloqueo de borrado (Object Lock) en la subida; `UNSIGNED-PAYLOAD` evita leer el fichero dos veces.
  const cabeceras = firmarPeticion({ metodo: 'PUT', url, cabeceras: { 'Content-Length': String(tamano), 'Content-MD5': md5Base64 }, hashCuerpo: 'UNSIGNED-PAYLOAD', fecha }, cfg)
  delete cabeceras.host
  const res = await fetchImpl(url.toString(), { method: 'PUT', headers: cabeceras, body: Readable.toWeb(createReadStream(ruta)) as unknown as BodyInit, duplex: 'half' } as RequestInit)
  if (!res.ok) throw new Error(`S3 ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
}

export function dependenciasReales(cfg: ConfigRespaldo, avisos: Pick<AppConfig, 'avisosWebhookUrl' | 'avisosWebhookToken' | 'appBaseUrl'>): Dependencias {
  return {
    volcar: () => volcar(cfg),
    subir: (ruta, clave, md5, tamano) => subirObjeto(cfg, ruta, clave, md5, tamano),
    avisar: (asunto, texto) => avisarFallo(cfg, avisos, asunto, texto),
    ahora: () => new Date(),
    dirTemporal: tmpdir(),
  }
}
