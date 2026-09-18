/**
 * Comprobación de FORMA de la cabecera R-1 (capacidad `citas-verificables`, RQ-CV-19).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * Núcleo puro, sin git ni fs (§5 del diseño de F0-05). Parser propio de siete claves, sin dependencia
 * YAML (D3): sólo el bloque plano entre dos `---` al principio del fichero. No caza YAML anidado,
 * anclas, cadenas multilínea ni claves duplicadas — R-1 es un dominio cerrado y esa gramática aquí no
 * se quiere. Trata `\r` como blanco, porque un `proposal.md` puede llegar con CRLF (igual que
 * `apps/desk/server/citas/detector.ts`, que sólo parte por `\n`).
 *
 * La comprobación es de FORMA y DOMINIO CERRADO, nunca de criterio (RQ-CV-19): `tanda` y `motivo`
 * sólo comprueban presencia (y la regla cruzada de `fuera-del-plan`); `capacidad` y `maestro` sólo
 * comprueban que sean listas; `cierra`, `toca_maestro` y `origen_cabecera` comprueban su dominio
 * cerrado. Nunca que el ID exista, que el motivo sea razonable o que la procedencia sea cierta.
 */

export type OrigenCabecera = 'declarada' | `derivada-${string}`

export interface CabeceraR1 {
  tanda: string
  motivo: string
  capacidad: string[]
  maestro: string[]
  cierra: 'si' | 'no'
  toca_maestro: 'si' | 'no'
  origen_cabecera: OrigenCabecera
}

/** `campo: null` es el caso «falta el bloque entero», distinto a propósito de «falta un campo»: el
 *  mensaje del hook tiene que poder decir cuál de los dos es (RQ-CV-10). */
export interface CabeceraInvalida {
  fichero: string
  campo: string | null
  motivo: string
}

export interface ResultadoCabeceras {
  comprobadas: number
  invalidas: CabeceraInvalida[]
}

/** Orden de comprobación: presencia primero (en este orden), luego contenido por campo, en el mismo
 *  orden. Fija cuál «campo» se reporta cuando más de uno falla a la vez. */
const CAMPOS_OBLIGATORIOS = ['tanda', 'motivo', 'capacidad', 'maestro', 'cierra', 'toca_maestro', 'origen_cabecera'] as const

const DOMINIO_SI_NO = new Set(['si', 'no'])
const ORIGEN_RE = /^(declarada|derivada-.+)$/

function sinRetornoDeCarro(linea: string): string {
  return linea.replace(/\r$/, '')
}

function esDelimitador(linea: string | undefined): boolean {
  return linea !== undefined && sinRetornoDeCarro(linea).trim() === '---'
}

function valorEscalar(bruto: string): string {
  const t = bruto.trim()
  const m = /^"(.*)"$/.exec(t)
  return m ? m[1] : t
}

function esLista(bruto: string): boolean {
  return /^\[.*\]$/.test(bruto.trim())
}

function parsearBloque(lineas: readonly string[]): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const linea of lineas) {
    const m = /^([a-z_]+):\s*(.*)$/.exec(sinRetornoDeCarro(linea))
    if (m) mapa.set(m[1], m[2])
  }
  return mapa
}

/** El primer campo inválido, en el orden de `CAMPOS_OBLIGATORIOS`: primero presencia (los siete),
 *  luego contenido campo a campo. `null` si la cabecera es válida. */
function primerCampoInvalido(mapa: ReadonlyMap<string, string>): { campo: string; motivo: string } | null {
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!mapa.has(campo)) return { campo, motivo: `falta el campo '${campo}'` }
  }

  const tanda = valorEscalar(mapa.get('tanda') as string)
  if (tanda === '') return { campo: 'tanda', motivo: "'tanda' no puede estar vacío" }

  const motivo = valorEscalar(mapa.get('motivo') as string)
  if (tanda === 'fuera-del-plan' && motivo === '') {
    return { campo: 'motivo', motivo: "'motivo' es obligatorio y no vacío cuando 'tanda' es 'fuera-del-plan'" }
  }

  const capacidadBruta = mapa.get('capacidad') as string
  if (!esLista(capacidadBruta)) return { campo: 'capacidad', motivo: "'capacidad' debe ser una lista, como '[]' o '[nombre]'" }

  const maestroBruta = mapa.get('maestro') as string
  if (!esLista(maestroBruta)) return { campo: 'maestro', motivo: "'maestro' debe ser una lista, como '[]' o '[\"pasaje\"]'" }

  const cierra = valorEscalar(mapa.get('cierra') as string)
  if (!DOMINIO_SI_NO.has(cierra)) return { campo: 'cierra', motivo: `'cierra' debe ser 'si' o 'no', no '${cierra}'` }

  const tocaMaestro = valorEscalar(mapa.get('toca_maestro') as string)
  if (!DOMINIO_SI_NO.has(tocaMaestro)) {
    return { campo: 'toca_maestro', motivo: `'toca_maestro' debe ser 'si' o 'no', no '${tocaMaestro}'` }
  }

  const origen = valorEscalar(mapa.get('origen_cabecera') as string)
  if (!ORIGEN_RE.test(origen)) {
    return { campo: 'origen_cabecera', motivo: `'origen_cabecera' debe ser 'declarada' o 'derivada-<fecha>', no '${origen}'` }
  }

  return null
}

export function comprobarCabeceras(ficheros: readonly { ruta: string; texto: string }[]): ResultadoCabeceras {
  const invalidas: CabeceraInvalida[] = []
  for (const { ruta, texto } of ficheros) {
    const lineas = texto.split('\n')
    if (!esDelimitador(lineas[0])) {
      invalidas.push({ fichero: ruta, campo: null, motivo: 'falta el bloque de cabecera (la primera línea no es «---»)' })
      continue
    }
    const posicionCierre = lineas.slice(1).findIndex((l) => esDelimitador(l))
    if (posicionCierre === -1) {
      invalidas.push({ fichero: ruta, campo: null, motivo: 'falta el bloque de cabecera (no se cierra con «---»)' })
      continue
    }
    const mapa = parsearBloque(lineas.slice(1, 1 + posicionCierre))
    const invalido = primerCampoInvalido(mapa)
    if (invalido) invalidas.push({ fichero: ruta, campo: invalido.campo, motivo: invalido.motivo })
  }
  return { comprobadas: ficheros.length, invalidas }
}
