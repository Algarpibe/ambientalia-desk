/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * (unidad 3) recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 */

/** Una línea candidata cosechada del árbol (RQ-CV-01): dónde vive y qué dice. */
export interface LineaFuente {
  fichero: string
  n: number
  texto: string
}

export interface CitaCompleta {
  tipo: 'completa'
  fichero: string
  desde: number
  hasta: number
  ancla?: string
  origenFichero: string
  origenLinea: number
  cruda: string
}

export interface CitaAbreviada {
  tipo: 'abreviada'
  desde: number
  hasta: number
  atribuidoA: string | null
  ancla?: string
  origenFichero: string
  origenLinea: number
  cruda: string
}

export interface CitaFueraDeRepositorio {
  tipo: 'fuera-de-repositorio'
  token: string
  origenFichero: string
  origenLinea: number
}

export interface NoEsCita {
  tipo: 'no-es-cita'
  token: string
  motivo: 'url-sin-ruta'
  origenFichero: string
  origenLinea: number
}

export type Cita = CitaCompleta | CitaAbreviada | CitaFueraDeRepositorio | NoEsCita

export interface OpcionesCosecha {
  resuelveAFichero(nombre: string): boolean
}

/** "`<ruta>:<N>` en `<rev>`" — el ancla vive en la MISMA línea física que su cita (D2). */
const REVISION_RE = /^\s+en\s+`([\w.-]+)`/

/** Un nombre de fichero candidato: segmentos con letras, dígitos, `.`, `_`, `-`, separados por `/`.
 *  Admite empezar por punto (requisito b) y no exige extensión conocida (requisito a). */
const NOMBRE_FICHERO = /^[\w.-]+(?:\/[\w.-]+)*$/

type SpanClasificado =
  | { tipo: 'completa-cruda'; fichero: string; desde: number; hasta: number }
  | { tipo: 'abreviada-cruda'; desde: number; hasta: number }
  | { tipo: 'mencion'; nombre: string }
  | { tipo: 'fuera-de-repositorio' }
  | { tipo: 'no-es-cita' }
  | { tipo: 'ignorar' }

function clasificarSpan(contenido: string): SpanClasificado {
  const conLinea = /^(.*):(\d+)(?:-(\d+))?$/.exec(contenido)
  if (!conLinea) {
    return NOMBRE_FICHERO.test(contenido) ? { tipo: 'mencion', nombre: contenido } : { tipo: 'ignorar' }
  }
  const nombre = conLinea[1]
  const desde = Number(conLinea[2])
  const hasta = conLinea[3] !== undefined ? Number(conLinea[3]) : desde
  if (nombre === '') return { tipo: 'abreviada-cruda', desde, hasta }

  // RQ-CV-04: evaluado ANTES que cualquier otra regla de resolución.
  if (nombre.startsWith('~/') || nombre.startsWith('/') || /^[A-Za-z]:[\\/]/.test(nombre)) {
    return { tipo: 'fuera-de-repositorio' }
  }
  // RQ-CV-16 / D3: un host:puerto DENTRO de una URL con esquema, sin ruta tras el host, no es cita.
  if (nombre.includes('://')) {
    const resto = nombre.slice(nombre.indexOf('://') + 3)
    return resto.includes('/') ? { tipo: 'fuera-de-repositorio' } : { tipo: 'no-es-cita' }
  }
  return { tipo: 'completa-cruda', fichero: nombre, desde, hasta }
}

function cosecharLinea(linea: LineaFuente, opciones: OpcionesCosecha): Cita[] {
  const { texto } = linea
  const spanRe = /`([^`\n]+)`/g
  const resultado: Cita[] = []
  const spans: { contenido: string; inicio: number; fin: number; cruda: string }[] = []
  let m: RegExpExecArray | null
  while ((m = spanRe.exec(texto))) spans.push({ contenido: m[1], inicio: m.index, fin: m.index + m[0].length, cruda: m[0] })

  // RQ-CV-06 (Lbc): último fichero VÁLIDO anterior por índice, para atribuir una abreviada. `Fin` es
  // dónde terminó su span: el corte 2 (D1) mira si hay una barra de celda ENTRE ese punto y la abreviada.
  let ultimoFicheroValido: string | null = null
  let ultimoFicheroValidoFin = 0

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i]
    const clasificado = clasificarSpan(span.contenido)

    if (clasificado.tipo === 'completa-cruda') {
      const anclaMatch = REVISION_RE.exec(texto.slice(span.fin))
      const ancla = anclaMatch?.[1]
      // el texto literal de la cita (D6): incluye " en `<rev>`" cuando va anclada
      const cruda = ancla !== undefined ? `${span.cruda} en \`${ancla}\`` : span.cruda
      if (ancla !== undefined) i++ // el siguiente span es la revisión: ya consumido aquí
      resultado.push({
        tipo: 'completa', fichero: clasificado.fichero, desde: clasificado.desde, hasta: clasificado.hasta,
        ancla, origenFichero: linea.fichero, origenLinea: linea.n, cruda,
      })
      // D1, corte 1: una completa que NO resuelve corta la atribución de las abreviadas siguientes.
      if (opciones.resuelveAFichero(clasificado.fichero)) {
        ultimoFicheroValido = clasificado.fichero
        ultimoFicheroValidoFin = span.fin
      } else {
        ultimoFicheroValido = null
      }
      continue
    }

    if (clasificado.tipo === 'abreviada-cruda') {
      const anclaMatch = REVISION_RE.exec(texto.slice(span.fin))
      const ancla = anclaMatch?.[1]
      if (ancla !== undefined) i++
      // D1, corte 2: una barra de celda entre el último fichero válido y esta abreviada la deja huérfana.
      const cruzaBarra = texto.slice(ultimoFicheroValidoFin, span.inicio).includes('|')
      resultado.push({
        tipo: 'abreviada', desde: clasificado.desde, hasta: clasificado.hasta,
        atribuidoA: cruzaBarra ? null : ultimoFicheroValido,
        ancla, origenFichero: linea.fichero, origenLinea: linea.n, cruda: span.cruda,
      })
      continue
    }

    if (clasificado.tipo === 'mencion') {
      // requisito (d): una mención PELADA (sin número de línea) cuenta como fichero al que atribuir
      // sólo si resuelve a un fichero trackeado — nunca por sí sola, sin comprobarlo.
      if (opciones.resuelveAFichero(clasificado.nombre)) {
        ultimoFicheroValido = clasificado.nombre
        ultimoFicheroValidoFin = span.fin
      }
      continue
    }

    if (clasificado.tipo === 'fuera-de-repositorio') {
      resultado.push({ tipo: 'fuera-de-repositorio', token: span.contenido, origenFichero: linea.fichero, origenLinea: linea.n })
      continue
    }

    if (clasificado.tipo === 'no-es-cita') {
      resultado.push({ tipo: 'no-es-cita', token: span.contenido, motivo: 'url-sin-ruta', origenFichero: linea.fichero, origenLinea: linea.n })
      continue
    }
  }
  return resultado
}

/** Cosecha todas las líneas candidatas del árbol. Puro: no sabe nada de git. */
export function cosechar(lineas: readonly LineaFuente[], opciones: OpcionesCosecha): Cita[] {
  const resultado: Cita[] = []
  for (const linea of lineas) resultado.push(...cosecharLinea(linea, opciones))
  return resultado
}
