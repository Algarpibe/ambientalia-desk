/**
 * Adaptador y punto de entrada del barrido de reconciliación (capacidad `reconciliacion`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * `npm run reconcile` bajo `tsx`. NADA de producción lo importa — `guardianes.test.ts` recorre el
 * grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * D6 · ADAPTADOR DE GIT PROPIO Y MÍNIMO, SIN IMPORTAR `citas/git.ts`. Las seis comprobaciones
 * necesitan DOS operaciones de git —el `HEAD` con su fecha y limpieza, y los ficheros sin trackear—;
 * el resto es lectura de disco. Importar el adaptador del detector acoplaría las dos capacidades:
 * un cambio en el adaptador del hook rompería el barrido, y al revés. Extraer un adaptador común
 * sería refactorizar un fichero muy citado y disparar el barrido de la regla de mutación 4 sobre un
 * tercer fichero dentro de esta misma tanda. Quince líneas cuestan menos que cualquiera de las dos.
 *
 * D8 · LO MEDIDO ES EL ÁRBOL DE TRABAJO, etiquetado con `HEAD` y con su limpieza. La comprobación 6
 * cuenta ficheros SIN TRACKEAR, que por definición no están en ningún commit: leer del commit la
 * dejaría siempre en cero, y si las otras cinco leyeran del commit mientras la sexta lee el disco el
 * informe mezclaría dos árboles sin decirlo. Se lee uno solo y se dice cuál.
 *
 * D9 · el código de salida sale de la marca `bloqueante` del núcleo, nunca del texto del informe.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Arbol } from './comprobaciones'
import { reconciliar } from './comprobaciones'
import { informe } from './informe'

const SALTO = String.fromCharCode(10)
const NUL = String.fromCharCode(0)
const MAX_BUFFER = 64 * 1024 * 1024

export const RUTA_INFORME = 'docs/sdd/RECONCILIACION.md'

/** Un fallo operativo de git o de disco: el CLI lo convierte en salida 2, nunca en un pase. */
export class ErrorDeEntorno extends Error {}

export interface EntradaCli {
  arbol: Arbol
  escribir(ruta: string, texto: string): void
}

export interface SalidaCli {
  codigo: 0 | 1 | 2
  texto: string
}

function git(cwd: string, args: readonly string[]): string {
  const r = spawnSync('git', ['-c', 'core.quotepath=off', ...args], {
    cwd,
    env: process.env,
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (r.error) throw new ErrorDeEntorno(r.error.message)
  if (r.status !== 0) throw new ErrorDeEntorno(String(r.stderr ?? '').trim() || 'git salió con código ' + String(r.status))
  return String(r.stdout ?? '')
}

/** Rutas de disco bajo un prefijo, en POSIX y relativas a la raíz, sin entrar en `node_modules`. */
function listarDisco(raiz: string, prefijo: string): string[] {
  const absoluto = path.join(raiz, prefijo)
  let entradas: string[]
  try {
    entradas = readdirSync(absoluto)
  } catch {
    return []
  }
  const rutas: string[] = []
  for (const nombre of entradas) {
    if (nombre === 'node_modules' || nombre === '.git') continue
    const relativa = prefijo.endsWith('/') ? prefijo + nombre : prefijo + '/' + nombre
    if (statSync(path.join(raiz, relativa)).isDirectory()) rutas.push(...listarDisco(raiz, relativa))
    else rutas.push(relativa)
  }
  return rutas
}

/** El `Arbol` real: dos llamadas a git y lectura de disco. Nada más del entorno entra al núcleo. */
export function arbolDeDisco(raiz: string): Arbol {
  return {
    leer(ruta) {
      try {
        return readFileSync(path.join(raiz, ruta), 'utf8')
      } catch {
        return null
      }
    },
    listar: (prefijo) => listarDisco(raiz, prefijo),
    sinTrackear(prefijo) {
      const salida = git(raiz, ['status', '--porcelain', '-z', '--untracked-files=all', '--', prefijo])
      return salida
        .split(NUL)
        .filter((l) => l.startsWith('?? '))
        .map((l) => l.slice(3))
    },
    head() {
      const [sha = '', fecha = ''] = git(raiz, ['log', '-1', '--format=%h' + SALTO + '%cs']).split(SALTO)
      const limpio = git(raiz, ['status', '--porcelain', '-z']).trim() === ''
      return { sha: sha.trim(), fecha: fecha.trim(), limpio }
    },
  }
}

/**
 * Puro respecto al proceso: no toca `process.exit` ni `process.stdout`, para que las pruebas lo
 * llamen en proceso. Defecto cerrado — cualquier excepción sale como código 2 con su mensaje, nunca
 * como un pase silencioso.
 */
export function ejecutar({ arbol, escribir }: EntradaCli): SalidaCli {
  try {
    const comprobaciones = reconciliar(arbol)
    const texto = informe(comprobaciones, arbol.head())
    escribir(RUTA_INFORME, texto)
    const bloquea = comprobaciones.some((c) => c.bloqueante && c.hallazgos.length > 0)
    return { codigo: bloquea ? 1 : 0, texto }
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e)
    return { codigo: 2, texto: 'reconcile: fallo operativo — ' + mensaje }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = process.cwd()
  const { codigo, texto } = ejecutar({
    arbol: arbolDeDisco(raiz),
    // Se escribe el fichero AQUÍ, nunca por redirección: en PowerShell 5.1 la redirección escribe UTF-16.
    escribir: (ruta, contenido) => writeFileSync(path.join(raiz, ruta), contenido, 'utf8'),
  })
  process.stderr.write(
    codigo === 2 ? texto + SALTO : 'reconcile: escrito ' + RUTA_INFORME + ' · código ' + String(codigo) + SALTO,
  )
  process.exitCode = codigo
}
