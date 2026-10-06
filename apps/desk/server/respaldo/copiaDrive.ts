import { pipeline } from 'node:stream/promises'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { cifrador, claveDesdeBase64 } from './cifrado'
import type { ConfigRespaldo } from './config'
import { faltantesDrive, type ConfigDrive } from './configDrive'
import { crearTokenDrive } from './driveAuth'
import { descargar, listarCarpeta, type ArchivoDrive } from './driveApi'
import { avisarFallo } from './dependencias'
import { aplicarCopia, claveObjeto, marcarDesaparecidos, planificar, type IndiceDrive } from './incremental'
import { escribirIndice, leerIndice } from './indiceDrive'
import { borrarVersion, subirMultiparte, type AlmacenS3 } from './multiparte'
import { aRetirar, quitarRetirados } from './retencion'

/** Id de Drive dentro de una URL: carpetas, ficheros, Docs/Sheets/Slides o `?id=`. `undefined` si no se reconoce. */
const idDeUrl = (u: string): string | undefined => /\/(?:folders|file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([\w-]+)/.exec(u)?.[1] ?? /[?&]id=([\w-]+)/.exec(u)?.[1]

/** `drive_url` de equipos que no caen en lo visto bajo la raíz (RQ-ZS-21, SHOULD). Las URL sin id reconocible se listan aparte. */
export function driveUrlsFuera(urls: string[], idsVistos: ReadonlySet<string>): { fuera: string[]; noReconocidas: string[] } {
  const r = { fuera: [] as string[], noReconocidas: [] as string[] }
  for (const u of urls.filter((x) => x.trim())) { const id = idDeUrl(u); if (!id) r.noReconocidas.push(u); else if (!idsVistos.has(id)) r.fuera.push(u) }
  return r
}

/**
 * La copia semanal de la carpeta de Drive (F1F-02, RQ-ZS-21): un documento cada vez, Drive → cifrador → multiparte, sin
 * disco. Todo lo del mundo se inyecta. NUNCA lanza: un fallo avisa al responsable (un solo aviso por pasada) y devuelve
 * el resultado. Lo que falla se reintenta la semana siguiente (S-6).
 */
type Token = () => Promise<string>
export interface DepsDrive {
  almacen: AlmacenS3
  token: Token
  listar: (raizId: string, token: Token) => Promise<{ archivos: ArchivoDrive[]; omitidos: string[]; carpetas?: string[] }>
  descargar: (a: ArchivoDrive, token: Token) => ReturnType<typeof descargar>
  avisar: (asunto: string, texto: string) => Promise<void>
  ahora: () => Date
  /** `drive_url` de los equipos (lectura). Opcional: sin él no hay aviso de URLs fuera de la raíz. */
  equiposConDrive?: () => Promise<string[]>
}
export interface ResultadoDrive { hecho: boolean; copiados: number; omitidos: string[]; fallos: string[]; retirados: number }
const ASUNTO = 'Falló la copia semanal de Drive'
const mensaje = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export function crearCopiadorDrive(cfg: ConfigDrive, base: ConfigRespaldo, deps: DepsDrive) {
  let enCurso = false
  const res = (r: Partial<ResultadoDrive>): ResultadoDrive => ({ hecho: false, copiados: 0, omitidos: [], fallos: [], retirados: 0, ...r })
  async function avisar(asunto: string, texto: string): Promise<void> {
    try { await deps.avisar(asunto, texto) } catch (e) { console.error('Copia de Drive: el aviso de fallo tampoco salió:', e) }
  }
  const abortar = async (motivo: string): Promise<ResultadoDrive> => { await avisar(ASUNTO, `No se hizo la copia de Drive: ${motivo}.`); return res({ fallos: [motivo] }) }

  async function pasada(): Promise<ResultadoDrive> {
    const falta = faltantesDrive(cfg, base)
    if (falta.length > 0) return abortar(`configuración incompleta: ${falta.join(', ')}`)
    const ahora = deps.ahora(); const iso = ahora.toISOString()
    const clave = claveDesdeBase64(base.claveCifrado)
    let indice: IndiceDrive
    try { indice = await leerIndice(deps.almacen, clave, iso) } catch (e) { return abortar(mensaje(e)) }
    let listado: Awaited<ReturnType<DepsDrive['listar']>>
    try { listado = await deps.listar(cfg.carpetaId, deps.token) } catch (e) { return abortar(`no se pudo listar la carpeta: ${mensaje(e)}`) }
    const omitidos = [...listado.omitidos]; const fallos: string[] = []; let copiados = 0

    for (const a of planificar(indice, listado.archivos)) {
      try {
        const d = await deps.descargar(a, deps.token)
        if ('omitido' in d) { omitidos.push(d.omitido); continue }
        const objeto = claveObjeto(a.id, ahora); let versionId: string | undefined
        // `pipeline` propaga los errores de los dos lados: si Drive corta, el sumidero lanza y `subirMultiparte` aborta la subida.
        await pipeline(d.flujo, cifrador(clave), async (fuente) => { versionId = (await subirMultiparte(deps.almacen, objeto, fuente as AsyncIterable<Buffer>)).versionId })
        indice = aplicarCopia(indice, a, { clave: objeto, versionId, copiadaEn: iso }); copiados++
      } catch (e) { fallos.push(`${a.ruta}: ${mensaje(e)}`) }
    }

    if (deps.equiposConDrive) {
      try {
        const { fuera, noReconocidas } = driveUrlsFuera(await deps.equiposConDrive(), new Set([...(listado.carpetas ?? []), ...listado.archivos.map((a) => a.id)]))
        omitidos.push(...fuera.map((u) => `drive_url fuera de la carpeta raíz, no se copia: ${u}`), ...noReconocidas.map((u) => `drive_url no reconocido: ${u}`))
      } catch (e) { fallos.push(`no se pudieron leer los drive_url de los equipos: ${mensaje(e)}`) }
    }

    indice = marcarDesaparecidos(indice, listado.archivos, true, iso)
    const borradas: Array<{ clave: string }> = []
    for (const r of aRetirar(indice, ahora)) {
      if (!r.versionId) { fallos.push(`${r.clave}: sin versionId (almacenamiento sin versionar), no se borra`); continue }
      const b = await borrarVersion(deps.almacen, r.clave, r.versionId)
      if (b.ok) borradas.push(r); else fallos.push(`${r.clave}: ${b.error}`)
    }
    indice = quitarRetirados(indice, borradas)
    let hecho = true
    try { await escribirIndice(deps.almacen, clave, indice) } catch (e) { hecho = false; fallos.push(`no se pudo escribir el índice (los objetos subidos se recopiarán la semana siguiente): ${mensaje(e)}`) }

    if (fallos.length || omitidos.length) {
      await avisar('La copia semanal de Drive terminó con avisos', [`Copiados: ${copiados}. Retirados por retención: ${borradas.length}.`,
        ...(fallos.length ? ['Fallos:', ...fallos.map((f) => `- ${f}`)] : []), ...(omitidos.length ? ['Omitidos (no copiados):', ...omitidos.map((o) => `- ${o}`)] : [])].join('\n'))
    }
    return res({ hecho, copiados, omitidos, fallos, retirados: borradas.length })
  }

  return {
    /** Orden FIJADO por prueba de posición: interruptor → pasada en curso → faltantes (dentro de `pasada`). */
    async lanzar(): Promise<ResultadoDrive | 'en-curso'> {
      if (!cfg.habilitado) return res({})
      if (enCurso) return 'en-curso'
      enCurso = true
      try { return await pasada() } catch (e) { return abortar(`error inesperado: ${mensaje(e)}`) } finally { enCurso = false }
    },
  }
}

/** Las dependencias reales. Crear el token no toca la red: sólo se pide cuando `lanzar` pasa las guardas. */
export function dependenciasRealesDrive(cfg: ConfigDrive, base: ConfigRespaldo, avisos: Pick<AppConfig, 'avisosWebhookUrl' | 'avisosWebhookToken' | 'appBaseUrl'>, equiposConDrive?: () => Promise<string[]>, fetchImpl: typeof fetch = fetch): DepsDrive {
  return {
    almacen: { cfg: base, fetchImpl, ahora: () => new Date() },
    token: crearTokenDrive(cfg.credencial, fetchImpl),
    listar: (raiz, token) => listarCarpeta(raiz, token, fetchImpl),
    descargar: (a, token) => descargar(a, token, fetchImpl),
    avisar: (asunto, texto) => avisarFallo(base, avisos, asunto, texto, fetchImpl),
    ahora: () => new Date(),
    equiposConDrive,
  }
}
