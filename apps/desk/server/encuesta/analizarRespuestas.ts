// indicadores-51-55 (F1F-05), RQ-KP-20: analizador PURO del fichero de respuestas de la encuesta. TODO el formato que lee es
// SUPUESTO (S-D, S-E: no hay muestra real, tarea de persona P-1). Este módulo es lo ÚNICO que se sustituye cuando llegue la
// muestra: la huella y los tipos viven en `./respuesta` y no cambian. Importa sólo `./respuesta` y `instanteDeJornada`: nada del
// servidor, de la base, de la red ni del disco (lo fija la última prueba de su fichero de pruebas).
import { instanteDeJornada } from '@ambientalia/shared'
import { huellaRespuesta, type FilaEncuesta, type FilaRechazada } from './respuesta'

export const MOTIVOS_FILA = {
  sinTicket: 'falta el número de ticket',
  ticketNoNumerico: 'el número de ticket no es un número reconocible',
  sinMarca: 'falta la marca de tiempo',
  marcaIlegible: 'la marca de tiempo no es una fecha legible',
  sinCalificacion: 'falta la calificación',
} as const

export const ERRORES_CABECERA = {
  vacio: 'El fichero está vacío',
  faltan: (columnas: readonly string[]) => `El fichero no trae las columnas necesarias: ${columnas.join(', ')}`,
  ambigua: (columna: string) => `Más de una columna del fichero puede ser «${columna}»`,
}

export type AnalisisEncuesta =
  | { ok: true; leidas: number; filas: FilaEncuesta[]; rechazadas: FilaRechazada[] }
  | { ok: false; error: string }

/** Bytes → texto: UTF-8 y, si no es UTF-8 válido, windows-1252 (respaldo `latin1` si el entorno no conoce la etiqueta). El BOM se conserva. */
export function decodificarFichero(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  } catch {
    try {
      return new TextDecoder('windows-1252').decode(bytes)
    } catch {
      return Buffer.from(bytes).toString('latin1')
    }
  }
}

const SEPARADORES = [',', ';'] as const

/** Cuenta `,` y `;` fuera de comillas en el primer registro; gana el más frecuente y, a igualdad, `,`. */
function elegirSeparador(texto: string): string {
  const cuenta: Record<string, number> = { ',': 0, ';': 0 }
  let dentro = false
  for (const c of texto) {
    if (c === '"') dentro = !dentro
    else if (!dentro && (c === '\n' || c === '\r')) break
    else if (!dentro && (c === ',' || c === ';')) cuenta[c]++
  }
  return cuenta[';'] > cuenta[','] ? SEPARADORES[1] : SEPARADORES[0]
}

/** Registros RFC 4180: comillas dobles, `""` es una comilla, separador y saltos dentro de comillas son contenido. */
function leerRegistros(texto: string, sep: string): string[][] {
  const registros: string[][] = []
  let campos: string[] = []
  let campo = ''
  let entrecomillado = false
  let i = 0
  const cerrarCampo = () => { campos.push(campo); campo = '' }
  const cerrarRegistro = () => { cerrarCampo(); registros.push(campos); campos = [] }
  while (i < texto.length) {
    const c = texto[i]
    if (entrecomillado) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i += 2; continue }
        entrecomillado = false
      } else campo += c
    } else if (c === '"' && campo === '') entrecomillado = true
    else if (c === sep) cerrarCampo()
    else if (c === '\r' || c === '\n') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      cerrarRegistro()
    } else campo += c
    i++
  }
  if (campo !== '' || campos.length > 0) cerrarRegistro()
  return registros
}

const normalizarCabecera = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

interface Columna { nombre: string; exactos: readonly string[]; palabras: readonly string[] }
const COLUMNAS: Record<'ticket' | 'marca' | 'calificacion', Columna> = {
  ticket: { nombre: 'ticket', exactos: ['ticket', 'numero de ticket', 'numero del ticket', 'no ticket', 'n ticket', 'nro ticket', 'numero de servicio'], palabras: ['ticket'] },
  marca: { nombre: 'marca de tiempo', exactos: ['marca temporal', 'timestamp', 'fecha', 'fecha y hora', 'fecha de respuesta'], palabras: [] },
  calificacion: { nombre: 'calificación', exactos: ['calificacion', 'calificacion de satisfaccion', 'satisfaccion'], palabras: ['calificacion', 'satisf'] },
}

/** Índices que casan: primero por sinónimo exacto y, si ninguno, por palabra. */
function candidatas(cabeceras: readonly string[], c: Columna): number[] {
  const exactas = cabeceras.flatMap((h, i) => (c.exactos.includes(h) ? [i] : []))
  if (exactas.length > 0) return exactas
  return cabeceras.flatMap((h, i) => (c.palabras.some((p) => h.includes(p)) ? [i] : []))
}

const vacia = (r: readonly string[]) => r.every((c) => c.trim() === '')

/** Ticket recortado, con `#` opcional, entero positivo que cabe en `integer`; si no, el motivo. */
function leerTicket(bruto: string): { numero: number } | { motivo: string } {
  const t = bruto.trim()
  if (t === '') return { motivo: MOTIVOS_FILA.sinTicket }
  const digitos = t.replace(/^#\s*/, '')
  const numero = /^\d+$/.test(digitos) ? Number(digitos) : NaN
  if (!(numero >= 1 && numero <= 2147483647)) return { motivo: MOTIVOS_FILA.ticketNoNumerico }
  return { numero }
}

const ZONA = '(Z|[+-]\\d{2}:?\\d{2}|(?:GMT|UTC)[+-]\\d{1,2}(?::?\\d{2})?)'
const HORA = '(?:[ T]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?'
const COLA = `\\s*(a\\. ?m\\.?|p\\. ?m\\.?|am|pm)?\\s*${ZONA}?$`
const ISO = new RegExp(`^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})${HORA}${COLA}`, 'i')
const DIA_PRIMERO = new RegExp(`^(\\d{1,2})/(\\d{1,2})/(\\d{4})${HORA}${COLA}`, 'i')

/** Minutos de desplazamiento de una zona escrita (`Z`, `+01:00`, `GMT-5`, `UTC+2`). */
function desplazamiento(zona: string): number {
  if (zona.toUpperCase() === 'Z') return 0
  const m = /([+-])(\d{1,2}):?(\d{2})?$/.exec(zona)!
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0))
}

/** La marca de tiempo en ISO UTC, o `null` si no es legible. Sin zona es hora de pared de Bogotá (`instanteDeJornada`). */
function leerMarca(bruto: string): string | null {
  const t = bruto.trim()
  const iso = ISO.exec(t)
  const dp = iso ? null : DIA_PRIMERO.exec(t)
  const m = iso ?? dp
  if (!m) return null
  const [anio, mes, dia] = iso ? [Number(m[1]), Number(m[2]), Number(m[3])] : [Number(m[3]), Number(m[2]), Number(m[1])]
  const calendario = new Date(Date.UTC(anio, mes - 1, dia))
  if (calendario.getUTCMonth() !== mes - 1) return null
  let hora = m[4] === undefined ? 0 : Number(m[4])
  const minuto = m[5] === undefined ? 0 : Number(m[5])
  const segundo = m[6] === undefined ? 0 : Number(m[6])
  const meridiano = m[7]?.toLowerCase().replace(/[^ap]/g, '')
  if (meridiano) {
    if (hora < 1 || hora > 12) return null
    hora = (hora % 12) + (meridiano === 'p' ? 12 : 0)
  }
  if (hora > 23 || minuto > 59 || segundo > 59) return null
  const zona = m[8]
  if (zona) return new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, segundo) - desplazamiento(zona) * 60_000).toISOString()
  const diaCivil = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  // `instanteDeJornada` se equivoca un día entero con las horas 0 a 4 (la lectura aproximada en UTC cae el día anterior en Bogotá, y su
  // diferencia no lo contempla): se usa sólo para MEDIR el desplazamiento del día a mediodía, donde no hay vuelta, y se aplica a cualquier hora.
  const desplazamientoDelDia = instanteDeJornada(diaCivil, 12).getTime() - Date.UTC(anio, mes - 1, dia, 12)
  return new Date(Date.UTC(anio, mes - 1, dia, hora, minuto, segundo) + desplazamientoDelDia).toISOString()
}

/** Pura: mismo contenido, mismo resultado. */
export function analizarRespuestasEncuesta(contenido: string): AnalisisEncuesta {
  const texto = contenido.replace(/^\uFEFF/, '')
  if (texto.trim() === '') return { ok: false, error: ERRORES_CABECERA.vacio }
  const registros = leerRegistros(texto, elegirSeparador(texto))
  const posCabecera = registros.findIndex((r) => !vacia(r))
  if (posCabecera < 0) return { ok: false, error: ERRORES_CABECERA.vacio }
  const cabeceras = registros[posCabecera].map(normalizarCabecera)

  const encontradas = (Object.keys(COLUMNAS) as Array<keyof typeof COLUMNAS>).map((k) => ({ k, c: COLUMNAS[k], idx: candidatas(cabeceras, COLUMNAS[k]) }))
  const faltan = encontradas.filter((e) => e.idx.length === 0).map((e) => e.c.nombre)
  if (faltan.length > 0) return { ok: false, error: ERRORES_CABECERA.faltan(faltan) }
  const ambigua = encontradas.find((e) => e.idx.length > 1)
  if (ambigua) return { ok: false, error: ERRORES_CABECERA.ambigua(ambigua.c.nombre) }
  const pos = Object.fromEntries(encontradas.map((e) => [e.k, e.idx[0]])) as Record<keyof typeof COLUMNAS, number>

  const filas: FilaEncuesta[] = []
  const rechazadas: FilaRechazada[] = []
  for (let i = posCabecera + 1; i < registros.length; i++) {
    const r = registros[i]
    if (vacia(r)) continue
    const fila = i - posCabecera + 1
    const campo = (k: keyof typeof COLUMNAS) => r[pos[k]] ?? ''
    const ticket = leerTicket(campo('ticket'))
    if ('motivo' in ticket) { rechazadas.push({ fila, motivo: ticket.motivo }); continue }
    if (campo('marca').trim() === '') { rechazadas.push({ fila, motivo: MOTIVOS_FILA.sinMarca }); continue }
    const respondidaAt = leerMarca(campo('marca'))
    if (respondidaAt === null) { rechazadas.push({ fila, motivo: MOTIVOS_FILA.marcaIlegible }); continue }
    const calificacion = campo('calificacion').replace(/\s+/g, ' ').trim()
    if (calificacion === '') { rechazadas.push({ fila, motivo: MOTIVOS_FILA.sinCalificacion }); continue }
    filas.push({ fila, numeroTicket: ticket.numero, calificacion, respondidaAt, huella: huellaRespuesta({ numeroTicket: ticket.numero, calificacion, respondidaAt }) })
  }
  return { ok: true, leidas: filas.length + rechazadas.length, filas, rechazadas }
}
