// La exportación de Zoho Desk (F1F-05, RQ-KP-23, D1): texto → filas de DOCE columnas. PURO: no conoce la base ni el disco.
import { normalizarNombreZoho, valorDeZoho, type ColumnaIndicador, type FilaRechazadaExportacion, type ValorIlegible } from '@ambientalia/shared'
import { leerRegistros } from '../encuesta/analizarRespuestas'

export const COLUMNA_ID = 'ID', COLUMNA_NUMERO = 'ID de la solicitud'

/** Las diez cabeceras de la muestra con su columna de indicador. Un guardián las enfrenta a `NOMBRES_ZOHO` y a la muestra. */
export const COLUMNAS_INDICADOR: ReadonlyArray<{ nombre: string; columna: ColumnaIndicador }> = [
  { nombre: 'Tiempo permanecía', columna: '47' },
  { nombre: 'Tiempo de diagnóstico', columna: '49' },
  { nombre: 'Tiempo de servicio', columna: '50_53' },
  { nombre: 'Tiempo total servicio', columna: '50_53' },
  { nombre: 'Tiempo recogida del equipo', columna: '51' },
  { nombre: 'Cumplimiento del tiempo  promesa', columna: '54' },
  { nombre: 'Calificación de satisfacción', columna: '55' },
  { nombre: 'Tiempo de cotización', columna: '57' },
  { nombre: 'Tiempo de orden de compra', columna: '58' },
  { nombre: 'Tiempo de orden de Venta', columna: '59' },
]

export const ERRORES_EXPORTACION = {
  vacio: 'El fichero está vacío',
  sinFilas: 'El fichero no trae ninguna fila de datos',
  binario: 'El fichero no es un CSV legible: expórtelo de Zoho Desk en CSV y súbalo tal cual',
  faltan: (columnas: readonly string[]) => `El fichero no trae las columnas necesarias: ${columnas.join(', ')}`,
  repetida: (columna: string) => `La columna «${columna}» aparece más de una vez en el fichero`,
}

/** Ningún motivo interpola la celda (RQ-KP-27): dicen qué falla, no qué dice. */
export const MOTIVOS_EXPORTACION = {
  idVacio: 'la columna «ID» está vacía',
  idRepetido: 'la columna «ID» repite la de una fila anterior',
  idNoDigitos: 'la columna «ID» no es sólo dígitos; si el fichero pasó por una hoja de cálculo, expórtelo de nuevo',
} as const

export interface FilaExportacion { fila: number; id: string; numero: number | null; campos: Record<string, string> }

export type LecturaExportacion =
  | { ok: false; error: string }
  | { ok: true; leidas: number; filas: FilaExportacion[]; rechazadas: FilaRechazadaExportacion[]; ilegibles: ValorIlegible[] }

const BOM = String.fromCharCode(0xfeff)
const SOLO_DIGITOS = /^\d+$/
const vacia = (r: readonly string[]) => r.every((c) => c.trim() === '')

/**
 * Orden de los errores de fichero: vacío, binario, columnas que faltan (todas), columna repetida, sin filas. Separador FIJO coma (DD-4).
 * Sólo salen las doce columnas; el «ID» malo da un motivo sin la celda, y el número ilegible no rechaza la fila.
 */
export function leerExportacion(contenido: string): LecturaExportacion {
  const texto = contenido.startsWith(BOM) ? contenido.slice(1) : contenido
  if (texto.trim() === '') return { ok: false, error: ERRORES_EXPORTACION.vacio }
  if (texto.includes('\u0000')) return { ok: false, error: ERRORES_EXPORTACION.binario }
  const registros = leerRegistros(texto, ',')
  const posCabecera = registros.findIndex((r) => !vacia(r))
  if (posCabecera === -1) return { ok: false, error: ERRORES_EXPORTACION.vacio }
  const cabecera = registros[posCabecera].map(normalizarNombreZoho)
  const exigidas = [COLUMNA_ID, COLUMNA_NUMERO, ...COLUMNAS_INDICADOR.map((c) => c.nombre)]
  const posiciones = exigidas.map((nombre) => cabecera.flatMap((h, i) => (h === normalizarNombreZoho(nombre) ? [i] : [])))
  const faltan = exigidas.filter((_, i) => posiciones[i].length === 0)
  if (faltan.length > 0) return { ok: false, error: ERRORES_EXPORTACION.faltan(faltan) }
  const repetida = exigidas.find((_, i) => posiciones[i].length > 1)
  if (repetida !== undefined) return { ok: false, error: ERRORES_EXPORTACION.repetida(repetida) }
  const datos = registros.flatMap((r, i) => (i > posCabecera && !vacia(r) ? [{ fila: i + 1, celdas: r }] : []))
  if (datos.length === 0) return { ok: false, error: ERRORES_EXPORTACION.sinFilas }

  const celdaDe = (celdas: readonly string[], nombre: string) => celdas[posiciones[exigidas.indexOf(nombre)][0]] ?? ''
  const filas: FilaExportacion[] = [], rechazadas: FilaRechazadaExportacion[] = [], ilegibles: ValorIlegible[] = []
  const vistos = new Set<string>()
  for (const { fila, celdas } of datos) {
    const id = celdaDe(celdas, COLUMNA_ID).trim()
    const motivo = id === '' ? MOTIVOS_EXPORTACION.idVacio : !SOLO_DIGITOS.test(id) ? MOTIVOS_EXPORTACION.idNoDigitos : vistos.has(id) ? MOTIVOS_EXPORTACION.idRepetido : null
    if (motivo !== null) { rechazadas.push({ fila, columna: COLUMNA_ID, motivo }); continue }
    vistos.add(id)
    const numero = celdaDe(celdas, COLUMNA_NUMERO).trim()
    const campos: Record<string, string> = {}
    for (const { nombre, columna } of COLUMNAS_INDICADOR) {
      const celda = celdaDe(celdas, nombre)
      campos[nombre] = celda
      if (celda.trim() !== '' && valorDeZoho(columna, [{ [nombre]: celda }]) === null) ilegibles.push({ fila, columna: nombre })
    }
    filas.push({ fila, id, numero: SOLO_DIGITOS.test(numero) ? Number(numero) : null, campos })
  }
  return { ok: true, leidas: filas.length + rechazadas.length, filas, rechazadas, ilegibles }
}
