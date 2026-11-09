import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PERMITIDOS, RAICES, barrer, leerArbol, sinComentarios } from './testing/barridoZohoDesk'

/**
 * RQ-ZS-46 — UN BARRIDO DEL REPOSITORIO PROHÍBE LLAMADAS A ZOHO DESK FUERA DE LA PUERTA (1G-04, D-8).
 *
 * Es independiente de `superficieSaliente.test.ts`: no depende de que el verbo sea un literal ni de que
 * el barrido viejo vea el fichero. Busca las SEÑALES de una salida a Desk (transporte, dominios, token,
 * instancias) en el código sin comentarios, y cada una sólo vale en su lista cerrada de ficheros.
 *
 * Se prueba en tres planos: la máquina de `sinComentarios`, un árbol sintético en memoria con una forma
 * por señal, y el árbol real del disco. Regla de mutación 2: lo vigilado es el árbol, así que la prueba
 * de verdad es ensuciar un fichero real (ver `apply-progress.md`).
 */

const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))

describe('sinComentarios', () => {
  it('quita el comentario de línea y conserva el salto', () => {
    const fuera = sinComentarios('const a = 1 // fetch(x)\nconst b = 2')
    expect(fuera).not.toContain('fetch')
    expect(fuera.split('\n')).toHaveLength(2)
    expect(fuera).toContain('const b = 2')
  })

  it('quita el comentario de bloque y conserva los saltos de su interior', () => {
    const origen = 'a\n/* desk.zoho.com\n   fetch(x)\n*/\nb'
    const fuera = sinComentarios(origen)
    expect(fuera).not.toContain('desk.zoho')
    expect(fuera).not.toContain('fetch')
    expect(fuera.split('\n')).toHaveLength(origen.split('\n').length)
    expect(fuera.split('\n')[4]).toBe('b')
  })

  it('no rompe un https:// dentro de una cadena, ni con comillas simples ni dobles', () => {
    expect(sinComentarios("const u = 'https://desk.zoho.com/api/v1' // nota")).toContain("'https://desk.zoho.com/api/v1'")
    expect(sinComentarios('const u = "http://x.test/a" // nota')).toContain('"http://x.test/a"')
    expect(sinComentarios("const u = 'https://x.test' // nota")).not.toContain('nota')
  })

  it('respeta las comillas escapadas dentro de una cadena', () => {
    const fuera = sinComentarios("const u = 'it\\'s // no es comentario' // sí lo es")
    expect(fuera).toContain('// no es comentario')
    expect(fuera).not.toContain('sí lo es')
  })

  it('conserva las plantillas, incluidas las ${…} anidadas, y quita el comentario que sigue', () => {
    const fuera = sinComentarios('const u = `${base}/api/v1//${`x${y}`}` // nota')
    expect(fuera).toContain('`${base}/api/v1//${`x${y}`}`')
    expect(fuera).not.toContain('nota')
  })

  it('quita un comentario dentro de una expresión ${…} de una plantilla', () => {
    const fuera = sinComentarios('const u = `a${ x /* fetch(y) */ }b`')
    expect(fuera).not.toContain('fetch')
    expect(fuera).toContain('`a${ x')
    expect(fuera).toContain('}b`')
  })

  it('un literal regex con // y comillas dentro se conserva, y el comentario que sigue se quita', () => {
    const a = sinComentarios("const r = /\\/\\/'x/g // nota")
    expect(a).toContain("/\\/\\/'x/g")
    expect(a).not.toContain('nota')
    const b = sinComentarios('const r = /[/]"/ // nota\nconst z = 1')
    expect(b).toContain('/[/]"/')
    expect(b).not.toContain('nota')
    expect(b).toContain('const z = 1')
  })

  it('una regex tras ( , : ! & | ? { } ; o al inicio de línea es regex; tras un identificador es división', () => {
    for (const previo of ['f(', 'f(a,', 'x:', '!', 'a &&', 'a ||', 'a ?', '{', '}', ';']) {
      const fuera = sinComentarios(`${previo} /'/ // nota`)
      expect(fuera, previo).toContain("/'/")
      expect(fuera, previo).not.toContain('nota')
    }
    const alInicio = sinComentarios("x\n/'/.test(y) // nota")
    expect(alInicio).toContain("/'/.test(y)")
    expect(alInicio).not.toContain('nota')
    const division = sinComentarios('const m = a / b / c // nota')
    expect(division).toContain('a / b / c')
    expect(division).not.toContain('nota')
  })
})

/** Una forma por señal, escrita en código (`ruta` es el fichero ensuciado). */
const FORMAS: { senal: string; ruta: string; texto: string }[] = [
  { senal: 'transporte', ruta: 'sint/get-implicito.ts', texto: "await fetch('https://desk.zoho.com/api/v1/tickets')" },
  { senal: 'transporte', ruta: 'sint/fetch-impl.ts', texto: 'const r = await fetchImpl(url)' },
  { senal: 'dominio-desk', ruta: 'sint/dominio.ts', texto: "const base = 'https://desk.zoho.eu'" },
  { senal: 'token-peticion', ruta: 'sint/token.ts', texto: 'const t = `${cuentas}/oauth/v2/token`' },
  { senal: 'instancia-cliente', ruta: 'sint/instancia.ts', texto: 'const c = createZohoClient({ config })' },
  { senal: 'cliente-http', ruta: 'sint/http.ts', texto: "import http from 'node:http'\nhttp.request(opciones)" },
]

describe('barrer · árbol sintético en memoria', () => {
  const ficheros = (soloComentarios: boolean) =>
    FORMAS.map((f) => ({
      ruta: f.ruta,
      texto: sinComentarios(
        soloComentarios
          ? f.texto.split('\n').map((l) => `// ${l}`).join('\n') + '\n/* ' + f.texto.replace(/\n/g, ' ') + ' */\n'
          : f.texto,
      ),
    }))

  it('cada forma fuera de la lista pone el barrido en rojo y nombra el fichero ensuciado', () => {
    const { hallazgos } = barrer(ficheros(false), {})
    for (const f of FORMAS) {
      const mios = hallazgos.filter((h) => h.fichero === f.ruta)
      expect(mios.map((h) => h.senal), f.ruta).toContain(f.senal)
    }
  })

  it('la misma forma escrita sólo en comentarios no cuenta', () => {
    const { hallazgos } = barrer(ficheros(true), {})
    expect(hallazgos).toEqual([])
  })

  it('la línea del hallazgo es la del código, aunque haya comentarios de varias líneas antes', () => {
    const texto = sinComentarios('/* a\n b\n c */\n\nconst x = fetchImpl(u)')
    const { hallazgos } = barrer([{ ruta: 'sint/l.ts', texto }], {})
    expect(hallazgos).toEqual([{ senal: 'transporte', fichero: 'sint/l.ts', linea: 5 }])
  })

  it('una señal vale sólo en los ficheros de su lista', () => {
    const fichs = [
      { ruta: 'ok/cliente.ts', texto: 'fetch(a)' },
      { ruta: 'mal/otro.ts', texto: 'fetch(b)' },
    ]
    const { hallazgos, sinUso } = barrer(fichs, { transporte: ['ok/cliente.ts'] })
    expect(hallazgos).toEqual([{ senal: 'transporte', fichero: 'mal/otro.ts', linea: 1 }])
    expect(sinUso).toEqual([])
  })

  it('sinUso lista la pareja permitida sin coincidencia real, y la del fichero que no existe', () => {
    const fichs = [{ ruta: 'ok/cliente.ts', texto: 'const a = 1' }]
    const { hallazgos, sinUso } = barrer(fichs, { transporte: ['ok/cliente.ts', 'ok/fantasma.ts'] })
    expect(hallazgos).toEqual([])
    expect(sinUso).toEqual([
      { senal: 'transporte', fichero: 'ok/cliente.ts' },
      { senal: 'transporte', fichero: 'ok/fantasma.ts' },
    ])
  })

  it('la lectura del modo va con límites de palabra: el mensaje no es una lectura', () => {
    const lee = barrer([{ ruta: 'a.ts', texto: 'if (env.MODO_SIN_ZOHO_DESK === 1) {}' }], {})
    expect(lee.hallazgos.map((h) => h.senal)).toContain('lectura-modo')
    const mensaje = barrer([{ ruta: 'b.ts', texto: "export const MENSAJE_MODO_SIN_ZOHO_DESK = 'x'" }], {})
    expect(mensaje.hallazgos).toEqual([])
  })

  it('no casa lo vecino: prefetch(, booksAccountsDomain y crmAccountsDomain', () => {
    const texto = 'prefetch(a)\nconst a = config.booksAccountsDomain + config.crmAccountsDomain'
    expect(barrer([{ ruta: 'c.ts', texto }], {}).hallazgos).toEqual([])
  })

  it('las señales de destino se ven dentro de cadenas y plantillas', () => {
    const texto = sinComentarios('const u = `${config.apiDomain}/api/v1/tickets`')
    const senales = barrer([{ ruta: 'd.ts', texto }], {}).hallazgos.map((h) => h.senal)
    expect(senales).toEqual(expect.arrayContaining(['campo-dominio', 'base-api']))
  })
})

describe('leerArbol · disco', () => {
  const dir = mkdtempSync(join(tmpdir(), 'barrido-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  const poner = (rel: string, texto: string) => {
    const ruta = join(dir, rel)
    mkdirSync(join(ruta, '..'), { recursive: true })
    writeFileSync(ruta, texto)
  }
  poner('apps/desk/server/a.ts', "const a = 1 // fetch(x)\nconst u = 'https://x.test'")
  poner('apps/desk/server/b.test.ts', 'fetch(x)')
  poner('apps/desk/server/c.test.tsx', 'fetch(x)')
  poner('apps/desk/server/testing/d.ts', 'fetch(x)')
  poner('apps/desk/server/node_modules/e.ts', 'fetch(x)')
  poner('apps/desk/server/dist/f.js', 'fetch(x)')
  poner('apps/hub-sync/src/g.mjs', '/* fetch(x) */ const g = 2')
  poner('packages/p/src/h.cjs', 'const h = 3')
  poner('packages/p/src/i.tsx', 'const i = 4')
  poner('packages/p/src/j.md', 'fetch(x)')
  poner('scripts/k.sh', '# fetch(x)\ncurl https://x.test')
  poner('apps/desk/src/l.ts', 'fetch(x)')

  it('lee las cuatro raíces, con las extensiones de código, y deja fuera pruebas e ignorados', () => {
    const rutas = leerArbol(dir, RAICES).map((f) => f.ruta).sort()
    expect(rutas).toEqual([
      'apps/desk/server/a.ts',
      'apps/hub-sync/src/g.mjs',
      'packages/p/src/h.cjs',
      'packages/p/src/i.tsx',
      'scripts/k.sh',
    ])
  })

  it('los .ts pasan por sinComentarios y el .sh se lee tal cual', () => {
    const porRuta = new Map(leerArbol(dir, RAICES).map((f) => [f.ruta, f.texto]))
    expect(porRuta.get('apps/desk/server/a.ts')).not.toContain('fetch')
    expect(porRuta.get('apps/desk/server/a.ts')).toContain("'https://x.test'")
    expect(porRuta.get('apps/hub-sync/src/g.mjs')).not.toContain('fetch')
    expect(porRuta.get('scripts/k.sh')).toContain('# fetch(x)')
  })

  it('una raíz que no existe se salta sin fallar', () => {
    expect(leerArbol(dir, ['no/existe'])).toEqual([])
  })
})

describe('barrido del repositorio real', () => {
  const arbol = leerArbol(RAIZ, RAICES)
  const { hallazgos, sinUso } = barrer(arbol, PERMITIDOS)

  it('recorre ficheros de verdad (el número sale en el mensaje) y sólo código propio', () => {
    expect(arbol.length, `ficheros recorridos: ${arbol.length}`).toBeGreaterThan(0)
    expect(arbol.some((f) => f.ruta === 'packages/zoho-sync/src/zohoClient.ts')).toBe(true)
    expect(arbol.some((f) => f.ruta === 'scripts/docx2md.sh')).toBe(true)
    expect(arbol.filter((f) => /\.test\.tsx?$/.test(f.ruta) || /(^|\/)testing\//.test(f.ruta) || f.ruta.includes('\\'))).toEqual([])
  })

  it('ninguna señal de Zoho Desk fuera de su lista cerrada', () => {
    const detalle = hallazgos.map((h) => `${h.senal} en ${h.fichero}:${h.linea}`)
    expect(detalle, `ficheros recorridos: ${arbol.length}`).toEqual([])
  })

  it('la lista cerrada no contiene un sitio sin señal real', () => {
    const detalle = sinUso.map((s) => `${s.senal} sin uso en ${s.fichero}`)
    expect(detalle, `ficheros recorridos: ${arbol.length}`).toEqual([])
  })

  it('los ficheros nuevos de 1G-04 no figuran en ninguna lista', () => {
    const nuevos = [
      'packages/zoho-sync/src/modoSinZoho.ts',
      'apps/desk/server/cicloPeriodico.ts',
      'apps/desk/server/routes/modoSinZohoDesk.ts',
    ]
    for (const lista of Object.values(PERMITIDOS)) for (const n of nuevos) expect(lista).not.toContain(n)
  })
})
