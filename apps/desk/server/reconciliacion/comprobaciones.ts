/**
 * Las seis comprobaciones del barrido de reconciliación (capacidad `reconciliacion`, RQ-RC-01).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * `npm run reconcile` bajo `tsx`. NADA de producción lo importa — `guardianes.test.ts` recorre el
 * grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * NÚCLEO PURO (§5 del diseño de F0-05): sin git y sin fs. Todo lo que sabe del entorno son las cuatro
 * operaciones de `Arbol`, y eso es lo que permite probarlo con un árbol sintético en memoria.
 *
 * LÍMITE QUE GOBIERNA LA CAPACIDAD ENTERA: este barrido NO arregla ningún desvío, los hace visibles.
 * Un barrido que además corrige es un barrido en el que nadie puede confiar, porque ya no se sabe si
 * el número bajó porque el problema se fue o porque el barrido lo tapó.
 *
 * D9: el código de salida se decide AQUÍ, con la marca `bloqueante`, nunca leyendo el texto del
 * informe — derivarlo del texto ataría el contrato a la redacción, y la primera reescritura del
 * mensaje cambiaría el comportamiento sin que ninguna prueba lo notara.
 */
import { comprobarCabeceras } from '../citas/cabecera'

const SALTO = String.fromCharCode(10)

export interface Hallazgo {
  clave: string
  detalle: string
}

export interface Comprobacion {
  id: 1 | 2 | 3 | 4 | 5 | 6
  titulo: string
  /** RQ-RC-03: sólo la 1 y la 3 mueven el código de salida. */
  bloqueante: boolean
  cifras: readonly string[]
  hallazgos: readonly Hallazgo[]
}

/** El puerto: lo único que el núcleo sabe del entorno. */
export interface Arbol {
  leer(ruta: string): string | null
  listar(prefijo: string): string[]
  sinTrackear(prefijo: string): string[]
  head(): { sha: string; fecha: string; limpio: boolean }
}

const RUTA_CONFIG = 'openspec/config.yaml'
const RUTA_PLAN = 'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md'
const RUTA_ESTADOS = 'packages/shared/src/estados.ts'
const PREFIJO_SPECS = 'openspec/specs/'
const PREFIJO_CHANGES = 'openspec/changes/'
const PREFIJO_DOCS_SDD = 'docs/sdd'
const SUFIJO_SPEC = '/spec.md'
const SUFIJO_PROPOSAL = '/proposal.md'
const FUERA_DEL_PLAN = 'fuera-del' + '-plan'
const ESTADO_CERRADO = 'CERRADO'
/** La R01.1 ya no es el plan del denominador: sólo sigue siendo la fuente de la guarda (b) de RQ-RC-06. */
const RUTA_PLAN_FUENTES = 'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md'
const PREFIJO_ARCHIVO = PREFIJO_CHANGES + 'archive/'

const ordenar = (xs: readonly string[]): string[] => [...xs].sort()

const sinRetorno = (linea: string): string => linea.replace(/\r$/, '')

/** Lista YAML plana: `clave:` y debajo `  - valor`. No es un parser de YAML y no pretende serlo. */
function listaYaml(texto: string, clave: string): string[] {
  const lineas = texto.split(SALTO).map(sinRetorno)
  const inicio = lineas.findIndex((l) => l.trimEnd() === clave + ':')
  if (inicio === -1) return []
  const valores: string[] = []
  for (const linea of lineas.slice(inicio + 1)) {
    const item = /^ {2}- (.+)$/.exec(linea)
    if (item) {
      valores.push(item[1]!.trim())
      continue
    }
    if (linea.trim() === '' || linea.startsWith('  ')) continue
    break
  }
  return valores
}

/**
 * Bloques `- <campoClave>: X` bajo una clave, con su cuerpo, para poder leerles un campo escalar.
 *
 * El campo que encabeza cada bloque NO siempre es `id`: `capabilities` los encabeza con `name`, y
 * leerlas como lista plana daba las nueve specs de disco por huérfanas. Se parametriza en vez de
 * escribir un segundo parser, que sería el molde de H5.
 */
function entradasYaml(texto: string, clave: string, campoClave = 'id'): { id: string; cuerpo: string }[] {
  const lineas = texto.split(SALTO).map(sinRetorno)
  const inicio = lineas.findIndex((l) => l.trimEnd() === clave + ':')
  if (inicio === -1) return []
  const reCabeza = new RegExp('^ {2}- ' + campoClave + ': (.+)$')
  const entradas: { id: string; cuerpo: string[] }[] = []
  for (const linea of lineas.slice(inicio + 1)) {
    const cabeza = reCabeza.exec(linea)
    if (cabeza) {
      entradas.push({ id: cabeza[1]!.trim(), cuerpo: [] })
      continue
    }
    if (linea.trim() === '') continue
    if (!linea.startsWith('  ')) break
    entradas[entradas.length - 1]?.cuerpo.push(linea)
  }
  return entradas.map((e) => ({ id: e.id, cuerpo: e.cuerpo.join(SALTO) }))
}

/** Campo escalar `clave: valor` dentro de un cuerpo ya acotado. */
function campo(cuerpo: string, clave: string): string | null {
  for (const linea of cuerpo.split(SALTO)) {
    const m = new RegExp('^\\s*' + clave + ':\\s*(.*)$').exec(sinRetorno(linea))
    if (m) return m[1]!.trim().replace(/^["'>|]\s*/, '').replace(/["']$/, '')
  }
  return null
}

/** El bloque de cabecera R-1 de un `proposal.md`: lo que hay entre los dos primeros delimitadores. */
const bloque = (texto: string): string => texto.split('---')[1] ?? ''

/**
 * Los `proposal.md` del árbol, ordenados. La VALIDEZ de la cabecera NO se reimplementa aquí: la
 * decide `comprobarCabeceras` (R1), que es la única implementación de esa noción. Lo que se hace
 * aquí es leer dos campos de un bloque YA validado, que es lectura y no una segunda validación —
 * duplicar la validación sería el molde de H5 que `CLAUDE.md` registra.
 */
function proposals(arbol: Arbol): { ruta: string; texto: string }[] {
  return arbol
    .listar(PREFIJO_CHANGES)
    .filter((r) => r.endsWith(SUFIJO_PROPOSAL))
    .sort()
    .map((ruta) => ({ ruta, texto: arbol.leer(ruta) ?? '' }))
}

/** Las filas del apartado 5 del plan: ID de tanda → su columna de FUENTES, que es la cuarta. */
function filasDelPlan(plan: string): Map<string, string> {
  const filas = new Map<string, string>()
  for (const m of plan.matchAll(/^\| (F[01][A-F]?-\d\d) \|.*$/gm)) {
    const columnas = m[0].split('|').map((c) => c.trim())
    filas.set(m[1]!, columnas[4] ?? '')
  }
  return filas
}

/** La lista `maestro: [...]` de una cabecera R-1, ya sin corchetes ni comillas. */
function listaMaestro(cabecera: string): string[] {
  return (campo(cabecera, 'maestro') ?? '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((x) => x.trim().replace(/^["']/, '').replace(/["']$/, ''))
    .filter((x) => x !== '')
}

/** `ESTADOS_EN_ESPERA` se DERIVA de las clases `externa` e `interna`, no es una lista aparte. */
function esperasDelCodigo(fuente: string): number {
  const lineas = fuente.split(SALTO).map(sinRetorno)
  const inicio = lineas.findIndex((l) => l.includes('CLASIFICACION_EN_ESPERA'))
  if (inicio === -1) return 0
  let cuenta = 0
  for (const linea of lineas.slice(inicio + 1)) {
    if (/^\}/.test(linea)) break
    // Anclado por los dos extremos a propósito: un comentario que NOMBRE una clase no es una entrada.
    if (/^\s*'[^']+':\s*'(externa|interna)'\s*,?\s*$/.test(linea)) cuenta += 1
  }
  return cuenta
}

// ── Las seis ────────────────────────────────────────────────────────────────────────────────────

/** 1 · `capabilities` frente a specs en disco. Huérfana es SPEC SIN DECLARAR, nunca al revés. */
function capacidades(arbol: Arbol): Comprobacion {
  const config = arbol.leer(RUTA_CONFIG) ?? ''
  // Las capacidades se declaran como bloques `- name: X`, no como lista plana. Las dos formas se
  // admiten, pero NUNCA a la vez: `listaYaml` también caza `- name: X` como elemento suelto, y
  // concatenarlas contaba cada capacidad DOS veces. Lo destapó el barrido real, no una prueba.
  const porNombre = entradasYaml(config, 'capabilities', 'name').map((e) => e.id)
  const declaradas = porNombre.length > 0 ? porNombre : listaYaml(config, 'capabilities')
  const enDisco = arbol
    .listar(PREFIJO_SPECS)
    .filter((r) => r.endsWith(SUFIJO_SPEC))
    .map((r) => r.slice(PREFIJO_SPECS.length, r.length - SUFIJO_SPEC.length))
  const huerfanas = ordenar(enDisco.filter((n) => !declaradas.includes(n)))
  return {
    id: 1,
    titulo: 'Capacidades declaradas frente a specs en disco',
    bloqueante: true,
    cifras: [
      String(declaradas.length) + ' declaradas',
      String(enDisco.length) + ' ficheros',
      String(huerfanas.length) + ' huérfanas',
    ],
    hallazgos: huerfanas.map((n) => ({ clave: n, detalle: 'spec en disco que no está en capabilities' })),
  }
}

/**
 * 2 · Numerador del avance en CIFRAS SEPARADAS por origen (RQ-RC-05): por archivo, por commit
 * declarado y «en curso». Nunca se suman, y nunca hay cabecera retroactiva — inventarla sería fabricar
 * evidencia. Sólo cuenta lo ARCHIVADO (`decision/avance-cuenta-lo-planificado`): un plan commiteado,
 * una propuesta o código en curso no suman. El denominador sale del §C de la R01.4 (RQ-RC-12).
 */
function numerador(arbol: Arbol): Comprobacion {
  const config = arbol.leer(RUTA_CONFIG) ?? ''
  const idsC = tandasDelPlan(arbol.leer(RUTA_PLAN) ?? '')
  const filas = filasDelPlan(arbol.leer(RUTA_PLAN_FUENTES) ?? '')
  const ficheros = proposals(arbol)
  const invalidas = new Set(comprobarCabeceras(ficheros).invalidas.map((i) => i.fichero))
  const cambios = ficheros
    .filter((f) => !invalidas.has(f.ruta))
    .map((f) => ({
      archivada: f.ruta.startsWith(PREFIJO_ARCHIVO),
      cierra: campo(bloque(f.texto), 'cierra') === 'si',
      tanda: campo(bloque(f.texto), 'tanda') ?? '',
      maestro: listaMaestro(bloque(f.texto)),
    }))
    .filter((x) => x.tanda !== '' && x.tanda !== FUERA_DEL_PLAN)
  const delPlan = cambios.filter((x) => idsC.has(x.tanda))
  const archivo = new Set(delPlan.filter((x) => x.archivada && x.cierra).map((x) => x.tanda))
  const { completas, defectos } = cierresPorCommit(config)
  const commit = new Set(completas)
  // La resta va DESPUÉS de filtrar los defectos: `commit` sólo trae entradas completas. Restar antes
  // dejaría fuera de «en curso» a una tanda cuyo bloque no cuenta (P2).
  const enCurso = ordenar([...new Set(delPlan.filter((x) => !(x.archivada && x.cierra)).map((x) => x.tanda))]).filter(
    (t) => !archivo.has(t) && !commit.has(t),
  )
  const cerradas = ordenar([...new Set([...archivo, ...commit])])
  const hallazgos: Hallazgo[] = []
  const sinFuente: string[] = []
  for (const tanda of cerradas) {
    const fuente = filas.get(tanda)
    // Sin fila en la R01.1, o con una fila que no declara fuentes, no hay nada que cruzar y marcar sería ruido.
    if (fuente === undefined || fuente === '' || fuente === '—') {
      sinFuente.push(tanda)
      continue
    }
    // El `maestro:` se toma de las cabeceras válidas `cierra: si` de la tanda, archivadas o no; sin ninguna
    // (una cerrada por commit sin cabecera), no hay con qué contrastar y no se marca.
    const declaradas = cambios.filter((x) => x.tanda === tanda && x.cierra)
    if (declaradas.length === 0 || declaradas.some((x) => x.maestro.some((m) => fuente.includes(m)))) continue
    hallazgos.push({ clave: tanda, detalle: 'sin verificar: su `maestro:` no cita ninguna fuente de su fila de la R01.1 (' + fuente + ')' })
  }
  hallazgos.push(...defectos)
  for (const t of ordenar([...archivo].filter((x) => commit.has(x)))) {
    hallazgos.push({ clave: t, detalle: 'está en las dos poblaciones: un `proposal.md` en archive/ con `cierra: si` y `cierres_declarados_por_commit`; deben ser disjuntas' })
  }
  if (idsC.size === 0) {
    hallazgos.push({ clave: '§C', detalle: 'denominador sin leer: el §C (encabezado `## C ·` con filas de tanda) no está en ' + RUTA_PLAN + '; el barrido no cae a otra sección ni a otro plan' })
  }
  return {
    id: 2,
    titulo: 'Numerador del avance (§C de la R01.4) — cifras separadas, nunca una suma',
    bloqueante: false,
    cifras: [
      String(archivo.size) + ' cerradas por archivo: ' + (ordenar([...archivo]).join(', ') || '—'),
      String(commit.size) + ' cerradas por commit declarado: ' + (ordenar([...commit]).join(', ') || '—'),
      String(enCurso.length) + ' en curso, aparte y sin sumar: ' + (enCurso.join(', ') || '—'),
      idsC.size === 0 ? 'denominador: sin leer (§C no encontrado)' : 'denominador: ' + String(idsC.size) + ' tandas del §C de la R01.4',
      String(sinFuente.length) + ' cerradas sin fuente declarada en la R01.1: ' + (sinFuente.join(', ') || '—'),
      String(hallazgos.filter((h) => h.detalle.startsWith('sin verificar')).length) + ' marcadas sin verificar',
    ],
    hallazgos,
  }
}

/** 3 · Cambios fuera del plan, con su motivo. Sin motivo escrito, bloquea. */
function fueraDelPlan(arbol: Arbol): Comprobacion {
  const sinMotivo: Hallazgo[] = []
  let cuantos = 0
  for (const { ruta, texto } of proposals(arbol)) {
    const cabecera = bloque(texto)
    if (campo(cabecera, 'tanda') !== FUERA_DEL_PLAN) continue
    cuantos += 1
    if ((campo(cabecera, 'motivo') ?? '').replace(/["']/g, '').trim() === '') {
      sinMotivo.push({ clave: ruta, detalle: 'tanda fuera del plan sin motivo escrito' })
    }
  }
  return {
    id: 3,
    titulo: 'Cambios fuera del plan, con su motivo',
    bloqueante: true,
    cifras: [String(cuantos) + ' fuera del plan', String(sinMotivo.length) + ' sin motivo'],
    hallazgos: sinMotivo.sort((a, b) => (a.clave < b.clave ? -1 : 1)),
  }
}

/**
 * 4 · Incumplimientos vivos, contados POR EL CAMPO `estado` y nunca por su ausencia (RQ-RC-08).
 *
 * La distinción no es cosmética: **un barrido que cuenta ausencias miente en cuanto alguien añade una
 * entrada y se olvida del campo**. Una entrada sin `estado` no es un incumplimiento vivo, es un
 * DEFECTO DE REGISTRO, y sale como tal para que se arregle escribiéndolo — que es la única salida.
 */
function incumplimientos(arbol: Arbol): Comprobacion {
  const entradas = entradasYaml(arbol.leer(RUTA_CONFIG) ?? '', 'incumplimientos_vivos')
  const hallazgos: Hallazgo[] = []
  let vivos = 0
  let cerrados = 0
  let defectos = 0
  for (const e of entradas) {
    const estado = campo(e.cuerpo, 'estado')
    // `null` es «no hay línea»; la cadena vacía es «hay línea y no dice nada». Las dos son el mismo
    // defecto de registro, y ninguna de las dos es una declaración de que siga vivo.
    if (estado === null || estado.trim() === '') {
      defectos += 1
      hallazgos.push({ clave: e.id, detalle: 'defecto de registro: la entrada no declara `estado`' })
      continue
    }
    if (estado === ESTADO_CERRADO) {
      cerrados += 1
      continue
    }
    vivos += 1
    hallazgos.push({ clave: e.id, detalle: 'incumplimiento vivo, declarado por el campo `estado`: ' + estado })
  }
  return {
    id: 4,
    titulo: 'Incumplimientos vivos, gates y claves de decisión',
    bloqueante: false,
    cifras: [
      String(entradas.length) + ' entradas',
      String(vivos) + ' vivos',
      String(cerrados) + ' cerrados',
      String(defectos) + ' defectos de registro',
    ],
    hallazgos,
  }
}

/**
 * 5 · Cifras ancladas. LEE `packages/shared`, NUNCA la documentación — ni siquiera el propio
 * `config.yaml` (RQ-RC-04). El 2026-09-17 un hallazgo salió FALSO por leer el registro para
 * comprobar el registro, y ése es exactamente el molde que este requisito cierra.
 *
 * La clasificación de la divergencia se REPRODUCE, no se reinterpreta: la decide la entrada.
 */
function cifrasAncladas(arbol: Arbol): Comprobacion {
  const config = arbol.leer(RUTA_CONFIG) ?? ''
  const cifras: string[] = []
  const hallazgos: Hallazgo[] = []
  for (const entrada of entradasYaml(config, 'cifras_ancladas')) {
    const maestro = (campo(entrada.cuerpo, 'maestro') ?? '—').split(' ')[0]!
    // La clasificación se REPRODUCE, no se reinterpreta: la decide la entrada, no el barrido.
    const esError = /^ERROR/i.test(campo(entrada.cuerpo, 'divergencia') ?? '')
    if (entrada.id !== 'esperas') {
      // Sin lectura de código no hay divergencia que reportar. Marcarla afirmaría que se midió algo
      // que nadie midió, y ése es el molde del hallazgo falso del 2026-09-17 al revés.
      cifras.push(entrada.id + ': maestro ' + maestro + ' · sin lectura de código')
      continue
    }
    const delCodigo = String(esperasDelCodigo(arbol.leer(RUTA_ESTADOS) ?? ''))
    cifras.push('esperas: código ' + delCodigo + ' · maestro ' + maestro)
    if (delCodigo !== maestro && esError) {
      hallazgos.push({ clave: entrada.id, detalle: 'diverge del maestro y su propia entrada lo declara ERROR' })
    }
  }
  return {
    id: 5,
    titulo: 'Cifras ancladas — leídas del código, no del registro',
    bloqueante: false,
    cifras,
    hallazgos,
  }
}

/** 6 · Ficheros de `docs/sdd` sin trackear. No es cifra fija: es lo que git mida en ese momento. */
function sinTrackear(arbol: Arbol): Comprobacion {
  const rutas = ordenar(arbol.sinTrackear(PREFIJO_DOCS_SDD))
  return {
    id: 6,
    titulo: 'Ficheros de docs/sdd sin trackear',
    bloqueante: false,
    cifras: [String(rutas.length) + ' sin trackear'],
    hallazgos: rutas.map((r) => ({ clave: r, detalle: 'en disco y fuera del índice' })),
  }
}

/**
 * El tramo de un plan que sigue a un encabezado: las líneas hasta el primer separador `---` suelto.
 * El separador de columnas de una tabla empieza por barra vertical y no casa. Sin encabezado, tramo vacío:
 * nunca se cae a otra sección (RQ-RC-12).
 */
function tramoDelPlan(texto: string, encabezado: RegExp): string[] {
  const lineas = texto.split(SALTO).map(sinRetorno)
  const inicio = lineas.findIndex((l) => encabezado.test(l))
  if (inicio === -1) return []
  const resto = lineas.slice(inicio + 1)
  const fin = resto.findIndex((l) => /^---\s*$/.test(l))
  return fin === -1 ? resto : resto.slice(0, fin)
}

/** Los IDs de tanda del §C, con o sin negrita, en las cinco familias del plan; cada uno cuenta una vez. */
function tandasDelPlan(plan: string): Set<string> {
  const ids = new Set<string>()
  for (const linea of tramoDelPlan(plan, /^## C · /)) {
    const m = /^\| \*{0,2}((?:F0|F1[A-F]|1[GH]|F[2-5])-\d\d)\*{0,2} \|/.exec(linea)
    if (m) ids.add(m[1]!)
  }
  return ids
}

/**
 * `cierres_declarados_por_commit`: bloques `- id:` con `commit:` y `prueba:` en UNA línea (RQ-RC-10). Una
 * entrada a la que falte uno, o vacío, o plegado (`prueba: >` se lee vacío), es DEFECTO y no cuenta. Un
 * elemento de la lista plana antigua (`- F0-01`) es defecto «sin forma de bloque». Lectura con el mismo par
 * que `capacidades`: `entradasYaml` más `listaYaml`, sin parser nuevo.
 */
function cierresPorCommit(config: string): { completas: string[]; defectos: Hallazgo[] } {
  const clave = 'cierres_declarados_por_commit'
  const completas: string[] = []
  const defectos: Hallazgo[] = []
  for (const e of entradasYaml(config, clave)) {
    const faltan = ['commit', 'prueba'].filter((k) => (campo(e.cuerpo, k) ?? '') === '')
    if (faltan.length === 0) {
      completas.push(e.id)
      continue
    }
    defectos.push({ clave: e.id, detalle: 'defecto de registro: la entrada no declara ' + faltan.map((k) => '`' + k + '`').join(' ni ') + ' (falta, va vacío o plegado)' })
  }
  for (const suelto of listaYaml(config, clave).filter((v) => !v.startsWith('id:'))) {
    defectos.push({ clave: suelto, detalle: 'defecto de registro: elemento sin forma de bloque `- id:` con `commit` y `prueba`' })
  }
  return { completas, defectos }
}

/** Las seis, en orden fijo. El orden es parte del contrato de determinismo (RQ-RC-02). */
export function reconciliar(arbol: Arbol): readonly Comprobacion[] {
  return [
    capacidades(arbol),
    numerador(arbol),
    fueraDelPlan(arbol),
    incumplimientos(arbol),
    cifrasAncladas(arbol),
    sinTrackear(arbol),
  ]
}
