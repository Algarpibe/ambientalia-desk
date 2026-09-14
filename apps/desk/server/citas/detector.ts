/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * Orquesta cosecha.ts + resolucion.ts sobre el puerto `Repo`. El núcleo no lanza procesos: todo lo
 * que sabe de git le llega por este puerto.
 */
import { cosechar, type LineaFuente } from './cosecha'
import { construirIndice, resolverRuta, resolverToken, type Resolucion, type ResolucionLocal } from './resolucion'

export type { LineaFuente }

/** El puerto: lo único que el núcleo sabe de git (§5 del diseño). */
export interface Repo {
  /** Rutas trackeadas de un árbol. `null` si el objeto no está en el clon. */
  rutas(rev: string): string[] | null
  /** Líneas con candidatas del árbol, ya sin las exclusiones del barrido. */
  lineas(arbol: string, exclusiones: readonly string[]): LineaFuente[]
  /** Muchos objetos en UNA lectura, con clave `"<rev>:<ruta>"`. `null` = ausente o ambiguo. */
  leerLote(objetos: readonly string[]): Map<string, string | null>
  /** `null` si la revisión no pela a árbol. */
  arbol(rev: string): string | null
  identidades(): string[]
}

export interface ItemCita {
  fichero: string
  linea: number
  cita: string
  motivo: string
}

/** Desglose de las saltadas (§5 del diseño): nunca bloquean, pero la cifra sin barra es la única señal
 *  del hueco de RQ-CV-11. */
export interface Saltadas {
  sinBarra: number
  ambiguas: number
  directorios: number
  huerfanas: number
  /** El nombre de una anclada no resuelve en el índice del sha local, y su lectura literal en su
   *  propia revisión también falla: el "ancla ilegible" (tarea 2.26, decisión c de Gerencia). */
  anclasSinResolver: number
  /** Defensivo: una ruta trackeada por el índice cuyo contenido git no devuelve como blob (p. ej. un
   *  submódulo). Nunca se descarta en silencio (invariante de conservación, tarea 2.26). */
  noLegibles: number
}

export interface ResultadoDeteccion {
  comprobadas: number
  /** Toda cita cosechada, invariante de conservación (tarea 2.26): comprobadas + Σ saltadas +
   *  fueraDelRepositorio + noSonCitas + abreviadasRotas.length + bloqueantes.length + informadas
   *  SHALL sumar exactamente esta cifra. `caducadas` queda fuera: no es una cita cosechada. */
  cosechadas: number
  saltadas: Saltadas
  /** RQ-CV-04: su propia cifra, separada de las saltadas. */
  fueraDelRepositorio: number
  /** D3: puertos de URL, marcas ISO y horas; fuera de las cuatro cifras. */
  noSonCitas: number
  /** Rotas que la línea base absorbe: se informan y no bloquean. */
  informadas: number
  bloqueantes: ItemCita[]
  caducadas: ItemCita[]
  /** RQ-CV-06: informativas, nunca bloquean y nunca entran en la línea base (decisión Q9). */
  abreviadasRotas: ItemCita[]
  bloquea: boolean
}

export interface EntradaBase {
  fichero: string
  linea: number
  cita: string
  motivo: string
}

export interface OpcionesDetector {
  repo: Repo
  arbolLocal: string
  exclusiones: readonly string[]
  base: readonly EntradaBase[]
  /** Rutas del lado remoto del push y cómo nombrarlo en el motivo (RQ-CV-05). Sin él, el paso 5 no corre. */
  remoto?: { en: string; rutas: readonly string[] }
}

function lineaVacia(texto: string | undefined): boolean {
  return texto === undefined || texto.trim() === ''
}

/** Clave de la línea base: (fichero, cita), NUNCA la línea — una inserción encima de una entrada de
 *  la base no debe caducarla (§4 D6 del diseño). */
function clave(fichero: string, citaTexto: string): string {
  return `${fichero}\u0000${citaTexto}`
}

function agrupar<T extends { fichero: string; cita: string }>(items: readonly T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>()
  for (const item of items) {
    const k = clave(item.fichero, item.cita)
    const lista = mapa.get(k)
    if (lista) lista.push(item)
    else mapa.set(k, [item])
  }
  return mapa
}

/** RQ-CV-08: los DOS extremos del rango se comprueban por separado, y el motivo nombra cuál falla. */
function rotura(c: { desde: number; hasta: number }, contenido: string): { linea: number; motivo: string } | null {
  const lineasFichero = contenido.split('\n')
  if (c.desde < 1 || c.desde > lineasFichero.length) return { linea: c.desde, motivo: 'extremo inicial fuera de rango' }
  if (c.hasta < 1 || c.hasta > lineasFichero.length) return { linea: c.hasta, motivo: 'extremo final fuera de rango' }
  if (lineaVacia(lineasFichero[c.desde - 1])) return { linea: c.desde, motivo: 'extremo inicial en línea vacía' }
  return null
}

/** D6 y RQ-CV-09: un elemento del informe y de la base es el DOCUMENTO que cita, la línea de la cita y
 *  la cita literal. Nunca el fichero citado: dos documentos con la misma cita compartirían clave. */
function origen(c: { origenFichero: string; origenLinea: number; cruda: string }): Omit<ItemCita, 'motivo'> {
  return { fichero: c.origenFichero, linea: c.origenLinea, cita: c.cruda }
}

/** ¿En qué árbol se lee el contenido citado? El sha local, salvo que vaya anclada (D11). */
function arbolDeLectura(c: { ancla?: string }, arbolLocal: string): string {
  return c.ancla ?? arbolLocal
}

export function detectar(opciones: OpcionesDetector): ResultadoDeteccion {
  const { repo, arbolLocal, exclusiones, base } = opciones
  const remoto = opciones.remoto && { en: opciones.remoto.en, indice: construirIndice(opciones.remoto.rutas) }
  const rutas = repo.rutas(arbolLocal) ?? []
  const indice = construirIndice(rutas)
  const lineas = repo.lineas(arbolLocal, exclusiones)
  const citas = cosechar(lineas, { resuelveAFichero: (nombre) => indice.exactos.has(nombre) })

  // D11 / RQ-CV-01: TODAS las lecturas de contenido (sha local + anclas) van en UN solo `leerLote`,
  // nunca una llamada por cita. Primera pasada: reunir las claves que hacen falta.
  const objetosNecesarios = new Set<string>()
  const resoluciones = new Map<string, Resolucion>()
  // Tarea 2.26 (divergencia nº 8, primera mitad): el índice del sha local NO depende de la revisión
  // ancla, así que se resuelve una sola vez por nombre y se comparte entre todas sus anclas.
  const resolucionesAncla = new Map<string, ResolucionLocal>()
  function resolverParaAncla(nombre: string): ResolucionLocal {
    let r = resolucionesAncla.get(nombre)
    if (!r) {
      r = resolverToken(nombre, indice) // D4: exacta, sufijo, RQ-CV-03 si ambigua
      resolucionesAncla.set(nombre, r)
    }
    return r
  }
  for (const c of citas) {
    if (c.tipo === 'completa') {
      if (c.ancla !== undefined) {
        if (repo.arbol(c.ancla) !== null) {
          const r = resolverParaAncla(c.fichero)
          if (r.tipo === 'unico') objetosNecesarios.add(`${c.ancla}:${r.ruta}`)
          else if (r.tipo === 'ambiguo') for (const ruta of r.candidatos) objetosNecesarios.add(`${c.ancla}:${ruta}`)
          else objetosNecesarios.add(`${c.ancla}:${c.fichero}`) // no-resuelto: lectura literal declarada (§11 D)
        }
        continue
      }
      const r = resoluciones.get(c.fichero) ?? resolverRuta(c.fichero, indice, remoto)
      resoluciones.set(c.fichero, r)
      if (r.tipo === 'unico') objetosNecesarios.add(`${arbolLocal}:${r.ruta}`)
      if (r.tipo === 'ambiguo') for (const ruta of r.candidatos) objetosNecesarios.add(`${arbolLocal}:${ruta}`)
    } else if (c.tipo === 'abreviada' && c.atribuidoA !== null) {
      objetosNecesarios.add(`${arbolLocal}:${c.atribuidoA}`) // atribuidoA SIEMPRE está en indice.exactos
    }
  }
  const lote = repo.leerLote([...objetosNecesarios])

  const candidatosDeBloqueo: ItemCita[] = []
  const abreviadasRotas: ItemCita[] = []
  let comprobadas = 0
  const saltadas: Saltadas = { sinBarra: 0, ambiguas: 0, directorios: 0, huerfanas: 0, anclasSinResolver: 0, noLegibles: 0 }
  let fueraDelRepositorio = 0
  let noSonCitas = 0

  for (const c of citas) {
    if (c.tipo === 'abreviada') {
      if (c.atribuidoA === null) {
        saltadas.huerfanas++
        continue
      }
      // c.atribuidoA SIEMPRE está en indice.exactos: cosecha.ts atribuye con el MISMO índice (invariante
      // de conservación, tarea 2.26 — antes había aquí un chequeo redundante, código muerto).
      const contenido = lote.get(`${arbolLocal}:${c.atribuidoA}`)
      if (contenido === null || contenido === undefined) {
        saltadas.noLegibles++ // defensivo: tracked pero git no devuelve su contenido (p. ej. un submódulo)
        continue
      }
      if (rotura(c, contenido)) abreviadasRotas.push({ ...origen(c), motivo: `abreviada rota (atribuida a ${c.atribuidoA})` })
      else comprobadas++
      continue
    }
    if (c.tipo === 'fuera-de-repositorio') fueraDelRepositorio++
    if (c.tipo === 'no-es-cita') noSonCitas++
    if (c.tipo !== 'completa') continue

    if (c.ancla !== undefined && repo.arbol(c.ancla) === null) {
      candidatosDeBloqueo.push({ ...origen(c), motivo: `revisión inexistente (${c.ancla})` })
      continue
    }
    let rutasCandidatas = [c.fichero]
    // Tarea 2.26 (divergencia nº 8): si la resolución LOCAL de la anclada tuvo éxito, un contenido
    // ilegible bloquea como "fichero inexistente" (la ruta resuelta no existe en su revisión); si el
    // nombre no resolvió localmente, el `continue` de más abajo cuenta como "ancla sin resolver", nunca
    // en silencio.
    let ancladaResueltaPorIndiceLocal = false
    if (c.ancla === undefined) {
      const r = resoluciones.get(c.fichero)
      if (r?.tipo === 'inexistente') {
        candidatosDeBloqueo.push({ ...origen(c), motivo: 'fichero inexistente' })
        continue
      }
      if (r?.tipo === 'sin-barra') {
        saltadas.sinBarra++
        continue
      }
      if (r?.tipo === 'existia') {
        candidatosDeBloqueo.push({ ...origen(c), motivo: `fichero inexistente (existía en ${r.en})` })
        continue
      }
      if (r?.tipo === 'directorio') {
        saltadas.directorios++
        continue
      }
      if (r?.tipo === 'no-es-cita') {
        noSonCitas++
        continue
      }
      if (r?.tipo === 'unico') rutasCandidatas = [r.ruta]
      if (r?.tipo === 'ambiguo') rutasCandidatas = r.candidatos
    } else {
      const r = resolverParaAncla(c.fichero)
      if (r.tipo === 'unico') { rutasCandidatas = [r.ruta]; ancladaResueltaPorIndiceLocal = true }
      else if (r.tipo === 'ambiguo') { rutasCandidatas = r.candidatos; ancladaResueltaPorIndiceLocal = true }
      // 'no-resuelto': rutasCandidatas queda en [c.fichero] — lectura literal declarada (§11 D del diseño)
    }
    const contenidos = rutasCandidatas.map((ruta) => lote.get(`${arbolDeLectura(c, arbolLocal)}:${ruta}`))
    if (contenidos.some((contenido) => contenido === null || contenido === undefined)) {
      if (c.ancla === undefined) {
        saltadas.noLegibles++ // defensivo: tracked pero git no devuelve su contenido (p. ej. un submódulo)
      } else if (ancladaResueltaPorIndiceLocal) {
        candidatosDeBloqueo.push({ ...origen(c), motivo: 'fichero inexistente' })
      } else {
        saltadas.anclasSinResolver++ // el "ancla ilegible": ni resuelve localmente, ni lee por su ruta literal
      }
      continue
    }
    const roturas = contenidos.map((contenido) => rotura(c, contenido as string))
    const primera = roturas[0]
    // RQ-CV-03: con varias candidatas bloquea sólo si está rota en TODAS; si una la valida, se salta.
    if (primera && roturas.every((x) => x !== null)) {
      const motivo = roturas.length > 1 ? `ambigua, rota en sus ${roturas.length} candidatas` : primera.motivo
      candidatosDeBloqueo.push({ ...origen(c), motivo: `${motivo} (línea ${primera.linea} de ${c.fichero})` })
      continue
    }
    if (roturas.length > 1) {
      saltadas.ambiguas++
      continue
    }
    comprobadas++
  }

  // RQ-CV-09: la base casa por (fichero, cita) CON MULTIPLICIDAD, nunca por línea (D6). La consulta
  // a la base corre siempre ANTES de decidir el bloqueo final (M17).
  const porClaveCandidatos = agrupar(candidatosDeBloqueo)
  const porClaveBase = agrupar(base)

  const bloqueantes: ItemCita[] = []
  for (const [k, items] of porClaveCandidatos) {
    const enBase = porClaveBase.get(k)?.length ?? 0
    if (items.length > enBase) bloqueantes.push(...items.slice(enBase)) // M10: las de más bloquean
  }

  const caducadas: ItemCita[] = []
  for (const [k, entradas] of porClaveBase) {
    const actuales = porClaveCandidatos.get(k)?.length ?? 0
    if (actuales < entradas.length) {
      // M9: menos ocurrencias rotas que entradas → las que sobran ya no están rotas, el hook falla
      for (const entrada of entradas.slice(actuales)) {
        caducadas.push({ fichero: entrada.fichero, linea: entrada.linea, cita: entrada.cita, motivo: 'entrada de la base ya no está rota' })
      }
    }
  }

  const informadas = candidatosDeBloqueo.length - bloqueantes.length
  return {
    comprobadas, cosechadas: citas.length, saltadas, fueraDelRepositorio, noSonCitas, informadas,
    bloqueantes, caducadas, abreviadasRotas, bloquea: bloqueantes.length > 0 || caducadas.length > 0,
  }
}
