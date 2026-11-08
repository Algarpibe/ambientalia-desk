// Barrido del repositorio contra las salidas a Zoho Desk (RQ-ZS-46, 1G-04, D-8).
//
// Es arnés de pruebas, no código de producción: vive en `testing/` por lo mismo que `appHarness.ts` y
// `superficieSaliente.ts`, y por eso ni este barrido ni aquél lo recorren —si no, las expresiones de
// este fichero se encontrarían a sí mismas—. NO depende de los límites de `superficieSaliente.ts`: no
// mira el verbo ni empareja paréntesis; busca SEÑALES de una salida a Desk en el código sin
// comentarios, y cada señal sólo vale en los ficheros de su lista cerrada.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Hallazgo {
  senal: string
  /** Ruta relativa a la raíz del repositorio, siempre con `/`. */
  fichero: string
  linea: number
}

export interface SinUso {
  senal: string
  fichero: string
}

export interface Fichero {
  ruta: string
  texto: string
}

/** Para cada señal, los ficheros donde vale. Una señal sin entrada no vale en ninguno. */
export type Permitidos = Record<string, readonly string[]>

/** Raíces que recorre el barrido, relativas a la raíz del repositorio. */
export const RAICES = ['apps/desk/server', 'apps/hub-sync', 'packages', 'scripts']

/** Sólo se mira código propio. Fuera: dependencias, compilados y el andamio de las pruebas. */
const IGNORAR = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.codegraph', '.atl', 'testing'])

/** Las señales de una salida a Zoho Desk, con la expresión que las reconoce (tabla de D-8). */
const SENALES: { nombre: string; patron: RegExp }[] = [
  { nombre: 'transporte', patron: /\b(?:fetch|fetchImpl)\s*\(/ },
  {
    nombre: 'cliente-http',
    patron: /\bhttps?\.(?:request|get)\s*\(|(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(?\s*)['"](?:(?:node:)?https?|undici|axios|node-fetch|got)['"]/,
  },
  { nombre: 'dominio-desk', patron: /desk\.zoho\./ },
  { nombre: 'base-api', patron: /\/api\/v1\b/ },
  { nombre: 'ruta-desk-zohoapis', patron: /\/desk\/v\d/ },
  { nombre: 'campo-dominio', patron: /\b(?:apiDomain|accountsDomain)\b/ },
  { nombre: 'dominio-cuentas', patron: /accounts\.zoho\./ },
  { nombre: 'token-peticion', patron: /oauth\/v2\/token/ },
  { nombre: 'token-cabecera', patron: /Zoho-oauthtoken/ },
  {
    nombre: 'variables-desk',
    patron: /\bZOHO_(?:API_DOMAIN|ACCOUNTS_DOMAIN|REFRESH_TOKEN|ORG_ID|DEPARTMENT_ID|CLIENT_ID|CLIENT_SECRET)\b/,
  },
  // Con límites de palabra: `MENSAJE_MODO_SIN_ZOHO_DESK` es un texto, no una lectura del modo.
  { nombre: 'lectura-modo', patron: /\bMODO_SIN_ZOHO_DESK\b/ },
  { nombre: 'instancia-cliente', patron: /\bcreateZohoClient\s*\(/ },
  { nombre: 'instancia-token', patron: /\bcreateTokenManager\s*\(/ },
  { nombre: 'token', patron: /\bgetAccessToken\s*\(/ },
]

/**
 * LA LISTA CERRADA. Medida con grep sobre el árbol de 1G-04 (L6), por fichero y no por línea: una
 * línea que se mueva no la rompe. Un transporte nuevo, a Desk o a otro tercero, entra aquí a propósito.
 * Los ficheros nuevos de 1G-04 (`modoSinZoho.ts`, `cicloPeriodico.ts`, `routes/modoSinZohoDesk.ts`)
 * no figuran porque no tienen ninguna señal real.
 */
export const PERMITIDOS: Permitidos = {
  transporte: [
    'packages/zoho-sync/src/zohoClient.ts',
    'packages/zoho-sync/src/tokenManager.ts',
    'packages/zoho-sync/src/books/booksClient.ts',
    'packages/zoho-sync/src/crmHub/crmClient.ts',
    'apps/desk/server/avisosWebhook.ts',
    'apps/desk/server/remisionWebhook.ts',
    'apps/desk/server/respaldo/dependencias.ts',
    'apps/desk/server/respaldo/driveApi.ts',
    'apps/desk/server/respaldo/driveAuth.ts',
    'apps/desk/server/respaldo/multiparte.ts',
  ],
  'cliente-http': [],
  'dominio-desk': ['packages/zoho-sync/src/config.ts'],
  'base-api': ['packages/zoho-sync/src/zohoClient.ts'],
  'ruta-desk-zohoapis': [],
  'campo-dominio': [
    'packages/zoho-sync/src/config.ts',
    'packages/zoho-sync/src/zohoClient.ts',
    'packages/zoho-sync/src/tokenManager.ts',
  ],
  'dominio-cuentas': ['packages/zoho-sync/src/config.ts'],
  'token-peticion': [
    'packages/zoho-sync/src/tokenManager.ts',
    'packages/zoho-sync/src/books/booksClient.ts',
    'packages/zoho-sync/src/crmHub/crmClient.ts',
  ],
  'token-cabecera': [
    'packages/zoho-sync/src/zohoClient.ts',
    'packages/zoho-sync/src/books/booksClient.ts',
    'packages/zoho-sync/src/crmHub/crmClient.ts',
  ],
  'variables-desk': ['packages/zoho-sync/src/config.ts'],
  'lectura-modo': ['packages/zoho-sync/src/config.ts'],
  'instancia-cliente': [
    'packages/zoho-sync/src/zohoClient.ts',
    'apps/desk/server/index.ts',
    'apps/hub-sync/src/hub-sync.ts',
  ],
  'instancia-token': [
    'packages/zoho-sync/src/tokenManager.ts',
    'apps/desk/server/index.ts',
    'apps/hub-sync/src/hub-sync.ts',
  ],
  token: ['packages/zoho-sync/src/tokenManager.ts', 'packages/zoho-sync/src/zohoClient.ts'],
}

/** Tras estos caracteres (o al inicio de línea) una `/` abre un literal regex y no es una división. */
const ANTES_DE_REGEX = '(,=:[!&|?{};'

/**
 * Quita los comentarios `//` y `/* *\/` de un texto de TypeScript o JavaScript SIN tocar lo que parece
 * comentario y no lo es: cadenas `'` y `"`, plantillas con sus `${…}` anidadas y literales regex.
 * Conserva los saltos de línea (los números de línea no cambian). Las cadenas se conservan porque las
 * señales de destino (`apiDomain`, `/api/v1`…) viven dentro de plantillas.
 */
export function sinComentarios(texto: string): string {
  const n = texto.length
  let i = 0
  let salida = ''
  // Último carácter no blanco emitido en esta línea; '' = inicio de línea.
  let ultimo = ''

  const emitir = (c: string) => {
    salida += c
    if (c === '\n') ultimo = ''
    else if (!/\s/.test(c)) ultimo = c
  }

  const cadena = (comilla: string) => {
    emitir(texto[i++])
    while (i < n) {
      const c = texto[i]
      if (c === '\\' && i + 1 < n) {
        emitir(c)
        emitir(texto[i + 1])
        i += 2
        continue
      }
      if (c === '\n') return // cadena sin cerrar: no se arrastra a las líneas siguientes
      emitir(c)
      i++
      if (c === comilla) return
    }
  }

  const regex = () => {
    emitir(texto[i++])
    let clase = false
    while (i < n) {
      const c = texto[i]
      if (c === '\n') return
      if (c === '\\' && i + 1 < n) {
        emitir(c)
        emitir(texto[i + 1])
        i += 2
        continue
      }
      emitir(c)
      i++
      if (c === '[') clase = true
      else if (c === ']') clase = false
      else if (c === '/' && !clase) return
    }
  }

  const plantilla = () => {
    emitir(texto[i++])
    while (i < n) {
      const c = texto[i]
      if (c === '\\' && i + 1 < n) {
        emitir(c)
        emitir(texto[i + 1])
        i += 2
        continue
      }
      if (c === '`') {
        emitir(c)
        i++
        return
      }
      if (c === '$' && texto[i + 1] === '{') {
        emitir(c)
        emitir('{')
        i += 2
        codigo(true)
        if (i < n) emitir(texto[i++]) // la `}` que cierra la expresión
        continue
      }
      emitir(c)
      i++
    }
  }

  // `enPlantilla`: se vuelve al encontrar la `}` que cierra el `${`, sin consumirla.
  function codigo(enPlantilla: boolean) {
    let llaves = 0
    while (i < n) {
      const c = texto[i]
      const sig = texto[i + 1]
      if (c === '/' && sig === '/') {
        while (i < n && texto[i] !== '\n') i++
        continue
      }
      if (c === '/' && sig === '*') {
        i += 2
        let saltos = ''
        while (i < n && !(texto[i] === '*' && texto[i + 1] === '/')) {
          if (texto[i] === '\n') saltos += '\n'
          i++
        }
        i += 2
        emitir(' ')
        for (const s of saltos) emitir(s)
        continue
      }
      if (c === "'" || c === '"') {
        cadena(c)
        continue
      }
      if (c === '`') {
        plantilla()
        continue
      }
      if (c === '/' && (ultimo === '' || ANTES_DE_REGEX.includes(ultimo))) {
        regex()
        continue
      }
      if (c === '{') llaves++
      else if (c === '}') {
        if (enPlantilla && llaves === 0) return
        llaves--
      }
      emitir(c)
      i++
    }
  }

  codigo(false)
  return salida
}

/** Número de línea (desde 1) del índice dado. */
function lineaDe(texto: string, indice: number): number {
  let linea = 1
  for (let k = 0; k < indice; k++) if (texto.charCodeAt(k) === 10) linea++
  return linea
}

/**
 * Busca cada señal en cada fichero (el texto ya viene sin comentarios). Una señal fuera de su lista es
 * un hallazgo. `sinUso` lista cada pareja permitida sin coincidencia real: la lista no puede guardar
 * sitios que ya no tienen la señal.
 */
export function barrer(
  ficheros: Fichero[],
  permitidos: Permitidos,
): { hallazgos: Hallazgo[]; sinUso: SinUso[] } {
  const hallazgos: Hallazgo[] = []
  const usados = new Set<string>()

  for (const f of ficheros) {
    for (const { nombre, patron } of SENALES) {
      const global = new RegExp(patron.source, 'g')
      const lineas = new Set<number>()
      let m: RegExpExecArray | null
      while ((m = global.exec(f.texto)) !== null) lineas.add(lineaDe(f.texto, m.index))
      if (lineas.size === 0) continue
      if ((permitidos[nombre] ?? []).includes(f.ruta)) {
        usados.add(`${nombre}\u0000${f.ruta}`)
        continue
      }
      for (const linea of [...lineas].sort((a, b) => a - b)) hallazgos.push({ senal: nombre, fichero: f.ruta, linea })
    }
  }

  const sinUso: SinUso[] = []
  for (const [senal, lista] of Object.entries(permitidos)) {
    for (const fichero of lista) if (!usados.has(`${senal}\u0000${fichero}`)) sinUso.push({ senal, fichero })
  }
  return { hallazgos, sinUso }
}

/**
 * Lee del disco el código propio de las raíces dadas. `.ts`, `.tsx`, `.js`, `.mjs` y `.cjs` pasan por
 * `sinComentarios`; el `.sh` se lee tal cual (ante la duda, rojo). Fuera: pruebas y `IGNORAR`.
 * Las rutas salen relativas a `raiz`, con `/`, también en Windows. Una raíz que no existe se salta.
 */
export function leerArbol(raiz: string, raices: readonly string[]): Fichero[] {
  const encontrados: Fichero[] = []
  const recorrer = (dir: string, relativa: string) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      if (IGNORAR.has(entrada.name)) continue
      const ruta = join(dir, entrada.name)
      const rel = `${relativa}/${entrada.name}`
      if (entrada.isDirectory()) {
        recorrer(ruta, rel)
        continue
      }
      if (/\.test\.tsx?$/.test(entrada.name)) continue
      if (/\.(?:tsx?|js|mjs|cjs)$/.test(entrada.name)) {
        encontrados.push({ ruta: rel, texto: sinComentarios(readFileSync(ruta, 'utf8')) })
      } else if (/\.sh$/.test(entrada.name)) {
        encontrados.push({ ruta: rel, texto: readFileSync(ruta, 'utf8') })
      }
    }
  }
  for (const r of raices) {
    const abs = join(raiz, r)
    if (existsSync(abs)) recorrer(abs, r)
  }
  return encontrados
}
