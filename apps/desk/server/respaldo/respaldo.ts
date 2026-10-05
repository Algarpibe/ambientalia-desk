import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { rm, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { cifrador, claveDesdeBase64 } from './cifrado'
import { faltantes, type ConfigRespaldo } from './config'

/**
 * Respaldo de la base `desk` (F1F-02, RQ-ZS-20): volcar → cifrar a un temporal → MD5 → subir → borrar el temporal.
 * Las dependencias que tocan el mundo se inyectan (`dependencias.ts` da las reales). Nunca lanza: si algo falla avisa
 * al responsable y devuelve el motivo, porque un respaldo que falla no puede tumbar la aplicación.
 */
export type Motivo = 'nocturna' | 'previa'
export type Clase = 'diaria' | 'semanal' | 'mensual' | 'previa'
export type Resultado = { hecho: true; clave: string } | { hecho: false; motivo: string }

export interface Dependencias {
  /** Arranca `pg_dump`: su salida, y una promesa que se rechaza si termina mal. */
  volcar: () => { flujo: Readable; terminado: Promise<void> }
  subir: (ruta: string, clave: string, md5Base64: string, tamano: number) => Promise<void>
  avisar: (asunto: string, texto: string) => Promise<void>
  ahora: () => Date
  dirTemporal: string
}

/** Retención 7/4/12 de `decision/p55-backup` por prefijo: la borran las reglas de ciclo de vida del almacenamiento. En UTC. */
export function claseDe(motivo: Motivo, fecha: Date): Clase {
  if (motivo === 'previa') return 'previa'
  if (fecha.getUTCDate() === 1) return 'mensual'
  return fecha.getUTCDay() === 0 ? 'semanal' : 'diaria'
}

export const claveObjeto = (motivo: Motivo, fecha: Date): string =>
  `${claseDe(motivo, fecha)}/desk-${fecha.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-')}.dump.enc`

const NOMBRE: Record<Motivo, string> = { nocturna: 'la copia nocturna', previa: 'la copia previa a un cambio' }

export function crearRespaldador(cfg: ConfigRespaldo, deps: Dependencias) {
  let enCurso = false

  async function avisar(asunto: string, texto: string): Promise<void> {
    try { await deps.avisar(asunto, texto) } catch (e) { console.error('Respaldo: el aviso de fallo tampoco salió:', e) }
  }

  async function copiar(motivo: Motivo): Promise<Resultado> {
    const falta = faltantes(cfg)
    if (falta.length > 0) {
      const motivoTexto = `configuración incompleta: ${falta.join(', ')}`
      await avisar(`Falló ${NOMBRE[motivo]}`, `No se hizo ${NOMBRE[motivo]} de Desk: ${motivoTexto}.`)
      return { hecho: false, motivo: motivoTexto }
    }
    const fecha = deps.ahora()
    const clave = claveObjeto(motivo, fecha)
    const temporal = path.join(deps.dirTemporal, path.basename(clave))
    try {
      const { flujo, terminado } = deps.volcar()
      // `allSettled` y no `all`: si fallan los dos, el segundo rechazo no queda sin atender; el de `pg_dump` va primero porque explica más.
      const fin = await Promise.allSettled([terminado, pipeline(flujo, cifrador(claveDesdeBase64(cfg.claveCifrado)), createWriteStream(temporal))])
      const fallo = fin.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (fallo) throw fallo.reason
      const md5 = createHash('md5')
      await pipeline(createReadStream(temporal), md5)
      await deps.subir(temporal, clave, md5.digest('base64'), (await stat(temporal)).size)
      return { hecho: true, clave }
    } catch (e) {
      const motivoTexto = e instanceof Error ? e.message : String(e)
      await avisar(`Falló ${NOMBRE[motivo]}`, `Falló ${NOMBRE[motivo]} de Desk (${clave}): ${motivoTexto}`)
      return { hecho: false, motivo: motivoTexto }
    } finally {
      await rm(temporal, { force: true })
    }
  }

  return {
    enCurso: () => enCurso,
    /** `'en-curso'` si ya hay una copia corriendo: dos `pg_dump` a la vez sólo duplican la carga. */
    async lanzar(motivo: Motivo): Promise<Resultado | 'en-curso'> {
      if (!cfg.habilitado) return { hecho: false, motivo: 'RESPALDO_HABILITADO apagado' }
      if (enCurso) return 'en-curso'
      enCurso = true
      try { return await copiar(motivo) } finally { enCurso = false }
    },
  }
}
