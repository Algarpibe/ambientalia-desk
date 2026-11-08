import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * verificacion-completitud (1G-03, D2, RQ-ZS-34) · la lista de discrepancias conocidas: DATOS versionados (`conocidas.json`) y un conjunto CERRADO
 * de reglas en el código. Se valida entera al cargar; un error nombra la entrada por su índice (y su entidad y entrada cuando son válidas) y
 * NUNCA repite un valor defectuoso: el mensaje acaba en el informe y en el `GET`.
 */
export const ENTIDADES = ['tickets', 'conversaciones', 'adjuntos', 'historia', 'contactos', 'cuentas'] as const
export type Entidad = (typeof ENTIDADES)[number]
export type Regla = 'nacidoEnLaApp' | 'conversacionAusenteEnZoho'

/** Parejas regla × entidad permitidas, UNA por línea: quitar una deja el fichero real sin cargar (M7). */
export const REGLAS: ReadonlyArray<readonly [Regla, Entidad]> = [
  ['nacidoEnLaApp', 'tickets'],
  ['nacidoEnLaApp', 'conversaciones'],
  ['nacidoEnLaApp', 'contactos'],
  ['nacidoEnLaApp', 'cuentas'],
  ['conversacionAusenteEnZoho', 'conversaciones'],
]

export interface EntradaConocida { entidad: Entidad; ids?: string[]; numeros?: number[]; regla?: Regla; causa: string; entrada: string }
export interface ListaConocidas { version: number; entradas: EntradaConocida[] }

export class ErrorLista extends Error {}

const CLAVES = new Set(['entidad', 'ids', 'numeros', 'regla', 'causa', 'entrada'])
const FORMA_ENTRADA = /^(E-\d+|DEPLOY\.md §\d+)$/
const texto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Lee `conocidas.json`, SÍNCRONA: `lanzar` lo es. Se llama en cada `lanzar` y `recuento`, nunca al arrancar. */
export const leerLista = (): string => readFileSync(fileURLToPath(new URL('./conocidas.json', import.meta.url)), 'utf8')

function validarEntrada(e: unknown, i: number, vistos: Map<string, number>): EntradaConocida {
  if (typeof e !== 'object' || e === null || Array.isArray(e)) throw new ErrorLista(`entrada ${i}: no es un objeto`)
  const o = e as Record<string, unknown>
  const entidad = ENTIDADES.find((x) => x === o.entidad)
  const entradaOk = typeof o.entrada === 'string' && FORMA_ENTRADA.test(o.entrada)
  const nombre = `entrada ${i}${entidad ? ` (${entidad}${entradaOk ? `, ${o.entrada}` : ''})` : ''}`
  const falla = (motivo: string): never => { throw new ErrorLista(`${nombre}: ${motivo}`) }
  if (!entidad) falla('entidad desconocida')
  if (Object.keys(o).some((k) => !CLAVES.has(k))) falla('clave de más')
  if (['ids', 'numeros', 'regla'].filter((k) => o[k] !== undefined).length !== 1) falla('debe llevar exactamente una de ids, numeros o regla')
  if (!texto(o.causa)) falla('falta `causa`')
  if (o.entrada === undefined || o.entrada === '') falla('falta `entrada`')
  if (!entradaOk) falla('`entrada` mal formada (E-<n> o DEPLOY.md §<n>)')
  if (o.ids !== undefined && !(Array.isArray(o.ids) && o.ids.length > 0 && o.ids.every((x) => texto(x) && !/\s/.test(x)))) falla('`ids` debe ser una lista de cadenas no vacías y sin espacios')
  if (o.numeros !== undefined && !(entidad === 'tickets' && Array.isArray(o.numeros) && o.numeros.length > 0 && o.numeros.every((n) => Number.isInteger(n) && n > 0))) falla('`numeros` sólo en tickets y como enteros positivos')
  if (o.regla !== undefined && !REGLAS.some(([r, ent]) => r === o.regla && ent === entidad)) falla('`regla` desconocida para esa entidad')
  const claves = [...((o.ids as string[] | undefined) ?? []).map((x) => `${entidad}:id:${x}`), ...((o.numeros as number[] | undefined) ?? []).map((n) => `tickets:numero:${n}`)]
  for (const k of claves) {
    const previa = vistos.get(k)
    if (previa !== undefined) falla(`repite un id o un número de la entrada ${previa}`)
    vistos.set(k, i)
  }
  return o as unknown as EntradaConocida
}

/** Valida y devuelve la lista, o lanza `ErrorLista`. */
export function cargarConocidas(contenido: string): ListaConocidas {
  let bruto: unknown
  try { bruto = JSON.parse(contenido) } catch { throw new ErrorLista('lista: JSON no válido') }
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) throw new ErrorLista('lista: debe ser un objeto')
  const { version, entradas } = bruto as Record<string, unknown>
  if (!Number.isInteger(version) || (version as number) < 1) throw new ErrorLista('lista: `version` debe ser un entero mayor o igual que 1')
  if (!Array.isArray(entradas)) throw new ErrorLista('lista: `entradas` debe ser una lista')
  const vistos = new Map<string, number>()
  return { version: version as number, entradas: entradas.map((e, i) => validarEntrada(e, i, vistos)) }
}
