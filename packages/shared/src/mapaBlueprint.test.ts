import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { generarMapaBlueprint, type EntradaMapa, type PasoSinBoton } from './mapaBlueprint'
import { TRANSITIONS, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'
import { ESTADOS_SERVICIO, ESTADOS_SIN_SALIDA } from './estados'
import { FASES, FASE_POR_ESTADO } from './fasesBlueprint'

// `mapaBlueprint.ts` recorre el grafo y devuelve los cuatro `.md` (RQ-MB-01..05). El diff
// anti-desfase (RQ-MB-06) va en su propio bloque al final, tras B.2.2 volcar a disco.

const SIN_BOTON: PasoSinBoton[] = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA]

function entradaReal(): EntradaMapa {
  return {
    transiciones: TRANSITIONS,
    sinBoton: SIN_BOTON,
    estados: ESTADOS_SERVICIO,
    sinSalida: ESTADOS_SIN_SALIDA,
    fases: FASES,
    fasePorEstado: FASE_POR_ESTADO,
  }
}

describe('mapaBlueprint — motor puro', () => {
  it('RQ-MB-03 · genera exactamente cuatro ficheros, con estos nombres', () => {
    const salida = generarMapaBlueprint(entradaReal())
    expect(Object.keys(salida).sort()).toEqual([
      'blueprint-completo.md',
      'blueprint-fase-1-entrada.md',
      'blueprint-fase-2-diagnostico.md',
      'blueprint-fase-3-cierre.md',
    ])
  })

  it('los cuatro ficheros llevan cabecera de generado y un bloque ```mermaid stateDiagram-v2', () => {
    const ficheros = Object.values(generarMapaBlueprint(entradaReal()))
    expect(ficheros, 'guarda contra el bucle fantasma').toHaveLength(4)
    for (const contenido of ficheros) {
      expect(contenido).toMatch(/generad[oa]/i)
      expect(contenido).toMatch(/no edit/i)
      expect(contenido).toContain('```mermaid')
      expect(contenido).toContain('stateDiagram-v2')
    }
  })

  it('RQ-MB-02 · el diagrama completo tiene 35 aristas, 3 con origen en Habilitar Servicio', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const completo = salida['blueprint-completo.md']
    // El patrón exige alias `eNN` a los dos lados: la cabecera HTML cierra con un `-->` suelto
    // (`<!-- ... -->`) que un patrón desnudo `/-->/ ` contaría como arista fantasma.
    const aristas = completo.match(/e\d{2} --> e\d{2}/g) ?? []
    expect(aristas).toHaveLength(35)
    const desdeHabilitar = completo.match(/: Habilitar Servicio/g) ?? []
    expect(desdeHabilitar).toHaveLength(3)
  })

  it('RQ-MB-02 · marca las dos transiciones sin botón, cada una con una arista', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const completo = salida['blueprint-completo.md']
    expect(completo.match(/\(sin botón\)/g) ?? []).toHaveLength(2)
    expect(completo).toContain('Remisión creada (sin botón)')
    expect(completo).toContain('Remisión anulada (sin botón)')
  })

  it('RQ-MB-04 · guarda de EJECUCIÓN (D-1) · un estado sin fase asignada hace fallar la generación', () => {
    const entrada = entradaReal()
    const sinContinuacion = Object.fromEntries(
      Object.entries(entrada.fasePorEstado).filter(([estado]) => estado !== 'Continuación del proceso'),
    ) as typeof entrada.fasePorEstado
    expect(() => generarMapaBlueprint({ ...entrada, fasePorEstado: sinContinuacion })).toThrow(/Continuación del proceso/)
  })

  it('guarda de alias · un estado referenciado por una arista pero AUSENTE de `estados` hace fallar la generación', () => {
    // El invariante 1 del grafo ya evita esto con datos reales: se inyecta a propósito para
    // ejercitar la guarda defensiva de `aliasDe`, distinta de la de fase de D-1.
    const entrada = entradaReal()
    const conEstadoFantasma: EntradaMapa = {
      ...entrada,
      sinBoton: [
        ...entrada.sinBoton,
        { id: 'fantasma', name: 'Transición fantasma', from: ['Estado Fantasma'], to: 'Ingresado', area: 'Comercial' },
      ],
      fasePorEstado: { ...entrada.fasePorEstado, 'Estado Fantasma': 'entrada' },
    }
    expect(() => generarMapaBlueprint(conEstadoFantasma)).toThrow(/Estado Fantasma/)
  })

  it('marcasArea · un área fuera del catálogo conocido se muestra literal, no se pierde ni rompe', () => {
    const entrada = entradaReal()
    const conAreaDesconocida: EntradaMapa = {
      ...entrada,
      sinBoton: [
        ...entrada.sinBoton,
        { id: 'area_rara', name: 'Transición de área rara', from: ['Ingresado'], to: 'Finalizado', area: 'Área Desconocida' },
      ],
    }
    const salida = generarMapaBlueprint(conAreaDesconocida)
    expect(salida['blueprint-completo.md']).toContain('Transición de área rara (sin botón) [Área Desconocida]')
  })

  it('RQ-MB-04 · una transición cuyo from/to caen en fases distintas aparece en las DOS vistas, anotada', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const entradaView = salida['blueprint-fase-1-entrada.md']
    const diagnosticoView = salida['blueprint-fase-2-diagnostico.md']
    expect(entradaView).toMatch(/Ingreso a Servicio \[frontera\]/)
    expect(diagnosticoView).toMatch(/Ingreso a Servicio \[frontera\]/)
  })

  it('RQ-MB-04 · las claves del mapa de fases usadas son exactamente ESTADOS (cobertura completa)', () => {
    const salida = generarMapaBlueprint(entradaReal())
    // Los 20 estados aparecen entre las cuatro vistas (cada uno en su fase nativa al menos).
    const completo = salida['blueprint-completo.md']
    for (const estado of ESTADOS_SERVICIO) expect(completo).toContain(estado)
  })

  it('RQ-MB-05 · la leyenda nombra las tres áreas base y una compuesta lleva las dos marcas', () => {
    const completo = generarMapaBlueprint(entradaReal())['blueprint-completo.md']
    expect(completo).toContain('Comercial')
    expect(completo).toContain('Servicio Técnico')
    expect(completo).toContain('Compras')
    expect(completo).toMatch(/Llegada de repuestos \[C\]\[CO\]/)
  })

  it('RQ-MB-05 · ningún fichero generado contiene fichas de hallazgos (H-2)', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const ficheros = Object.values(salida)
    expect(ficheros, 'guarda contra el bucle fantasma').toHaveLength(4)
    for (const contenido of ficheros) {
      expect(contenido.length, 'guarda contra el bucle fantasma: fichero no vacío').toBeGreaterThan(0)
      expect(contenido).not.toMatch(/hallazgo/i)
    }
  })

  it('los cuatro estados de ESTADOS_SIN_SALIDA llevan la marca ·espera· (M1.3.7)', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const diagnosticoView = salida['blueprint-fase-2-diagnostico.md']
    expect(ESTADOS_SIN_SALIDA.length, 'guarda contra el bucle fantasma: hay cuatro estados que recorrer').toBe(4)
    for (const estado of ESTADOS_SIN_SALIDA) expect(diagnosticoView).toContain(`${estado} ·espera·`)
  })

  it('determinismo · dos ejecuciones seguidas producen exactamente el mismo contenido no vacío', () => {
    const primera = generarMapaBlueprint(entradaReal())
    const segunda = generarMapaBlueprint(entradaReal())
    expect(primera['blueprint-completo.md']?.length ?? 0, 'guarda contra el falso determinismo de un mapa vacío').toBeGreaterThan(100)
    expect(segunda).toEqual(primera)
  })
})

// RQ-MB-06 · anti-desfase: diff de cadenas contra el `.md` en disco (no el patrón de
// `migrate.test.ts` — la fuente ya es TS tipado, `design.md` §9). Las dos mutaciones (regla de
// mutación 2 y la transición sintética sin regenerar) se ejercitan a mano vía Bash y quedan
// documentadas en `apply-progress.md` — mismo molde que la mutación de compilación de la Unidad A
// (A.1.3): no viven como pruebas permanentes que muten disco en cada `npm test`.
describe('mapaBlueprint — RQ-MB-06 · anti-desfase contra docs/artefactos/', () => {
  const RUTA_ARTEFACTOS: Record<string, URL> = {
    'blueprint-completo.md': new URL('../../../docs/artefactos/blueprint-completo.md', import.meta.url),
    'blueprint-fase-1-entrada.md': new URL('../../../docs/artefactos/blueprint-fase-1-entrada.md', import.meta.url),
    'blueprint-fase-2-diagnostico.md': new URL('../../../docs/artefactos/blueprint-fase-2-diagnostico.md', import.meta.url),
    'blueprint-fase-3-cierre.md': new URL('../../../docs/artefactos/blueprint-fase-3-cierre.md', import.meta.url),
  }

  // `.gitattributes` fija LF en el índice pero deja CRLF en el árbol de Windows; el generador
  // produce LF siempre (D-5), así que se normaliza al leer disco para comparar por contenido.
  function normalizarFinDeLinea(texto: string): string {
    return texto.replace(/\r\n/g, '\n')
  }

  it('el contenido regenerado desde el import real es igual al commiteado en disco', () => {
    const regenerado = generarMapaBlueprint(entradaReal())
    const nombres = Object.keys(RUTA_ARTEFACTOS)
    expect(nombres, 'guarda contra el bucle fantasma').toHaveLength(4)
    for (const nombre of nombres) {
      const enDisco = normalizarFinDeLinea(readFileSync(RUTA_ARTEFACTOS[nombre], 'utf8'))
      expect(regenerado[nombre], `${nombre}: el generador no produjo este fichero`).toBeDefined()
      expect(regenerado[nombre]).toBe(enDisco)
    }
  })
})

// F1C-09 (E-140): `Pendiente` sale del catálogo de servicio y ninguna arista del mapa lo toca.
describe('mapaBlueprint — F1C-09 · Pendiente fuera del mapa de servicio', () => {
  it('ninguna arista ni estado del diagrama completo menciona Pendiente, y quedan 35 aristas', () => {
    const completo = generarMapaBlueprint(entradaReal())['blueprint-completo.md']
    expect(completo.match(/e\d{2} --> e\d{2}/g) ?? []).toHaveLength(35)
    expect(completo).not.toContain('Pendiente')
    expect(completo).not.toContain('Marcar como pendiente')
  })
})

// F1B-09 (`mapa-blueprint-tres-flujos`), lote 1 · motor: tres campos opcionales, cabecera por plantilla y
// guarda D-1 sólo con fases. Todo lo nuevo de este fichero va AQUÍ, al final, importaciones incluidas: las
// líneas 46 y 168 están citadas por número desde otros ficheros (regla de mutación 4 de `CLAUDE.md`).
describe('mapaBlueprint — F1B-09 · campos opcionales y guarda condicionada', () => {
  const FUENTES_DE_SERVICIO = '`transitions.ts`, `estados.ts` y `fasesBlueprint.ts`'

  // P1 · sin fases la guarda D-1 no rige: hoy lanza para el primer estado (RQ-MB-04, escenario nuevo).
  it('P1 · RQ-MB-04 · con `fases` vacío y `fasePorEstado` vacío no lanza y devuelve un solo fichero', () => {
    const entrada: EntradaMapa = {
      transiciones: [
        { id: 'a', name: 'Paso A', from: ['Uno'], to: 'Dos', area: 'Comercial', fields: [] },
      ],
      sinBoton: [],
      estados: ['Uno', 'Dos'],
      sinSalida: [],
      fases: [],
      fasePorEstado: {},
    }
    let salida: Record<string, string> = {}
    expect(() => {
      salida = generarMapaBlueprint(entrada)
    }).not.toThrow()
    expect(Object.keys(salida)).toEqual(['blueprint-completo.md'])
  })

  // P2 · los tres opcionales mandan sobre el valor por defecto en título, clave y cabecera (RQ-MB-03).
  it('P2 · RQ-MB-03 · con nombre de flujo, de fichero y fuentes, la clave, el título y la cabecera son los pedidos', () => {
    const salida = generarMapaBlueprint({
      ...entradaReal(),
      nombreFlujo: 'Flujo de prueba',
      nombreFicheroCompleto: 'blueprint-prueba.md',
      fuentes: '`una-fuente.ts` y `otra-fuente.ts`',
    })
    expect(Object.keys(salida)).toContain('blueprint-prueba.md')
    expect(Object.keys(salida)).not.toContain('blueprint-completo.md')
    const completo = salida['blueprint-prueba.md']
    expect(completo).toContain('# Mapa del Blueprint de Flujo de prueba — diagrama completo')
    expect(completo).not.toContain('Servicio Técnico — diagrama completo')
    expect(completo).toContain('`una-fuente.ts` y `otra-fuente.ts`')
    expect(completo).not.toContain(FUENTES_DE_SERVICIO)
    // La vista por fase usa el mismo nombre de flujo en su título.
    expect(salida['blueprint-fase-1-entrada.md']).toContain('# Mapa del Blueprint de Flujo de prueba — fase «')
  })

  // P3 · NACE VERDE a propósito: es la guarda de R3. Sin opcionales, o con los tres valores de hoy escritos a
  // mano, la salida de servicio es la de siempre (las cuatro claves; los bytes los vigila la prueba de la línea 168).
  it('P3 · R3 · sin opcionales la salida de servicio tiene las cuatro claves de hoy, y con los tres valores por defecto escritos es idéntica', () => {
    const sinOpcionales = generarMapaBlueprint(entradaReal())
    expect(Object.keys(sinOpcionales).sort()).toEqual([
      'blueprint-completo.md',
      'blueprint-fase-1-entrada.md',
      'blueprint-fase-2-diagnostico.md',
      'blueprint-fase-3-cierre.md',
    ])
    const conPorDefecto = generarMapaBlueprint({
      ...entradaReal(),
      nombreFlujo: 'Servicio Técnico',
      nombreFicheroCompleto: 'blueprint-completo.md',
      fuentes: FUENTES_DE_SERVICIO,
    })
    expect(conPorDefecto).toEqual(sinOpcionales)
  })
})

// F1B-09, lote 2 · el registro por flujo (`mapaPorFlujo.ts`) y la prueba anti-desfase de los TRES flujos.
// Las importaciones de este bloque van aquí, al final, por la misma razón que el bloque de arriba.
import { readdirSync } from 'node:fs'
import { CATALOGO_POR_FLUJO, flujoDelTicket, type Flujo } from './flujos'
import { TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, type Transition } from './transitions'
import { ESTADOS } from './estados'
import { entradaMapaDelFlujo, estadosDelCatalogo, ficherosDelMapa, mapasPorFlujo } from './mapaPorFlujo'

const DIRECTORIO_ARTEFACTOS = new URL('../../../docs/artefactos/', import.meta.url)
const FLUJOS = Object.keys(CATALOGO_POR_FLUJO) as Flujo[]
const CLASIFICACION_DEL_FLUJO: Record<Flujo, string> = {
  servicio: 'Servicio',
  'equipo-nuevo': 'Equipo nuevo',
  'soporte-remoto': 'Soporte remoto',
}
const ARISTA = /e\d{2} --> e\d{2}/g
const NODO = /^ {4}state ".+" as e\d{2}$/gm

/**
 * Lo esperado frente a lo que hay en `docs/artefactos/` (D13): falta en disco, difiere, sobra en disco.
 * Lee el directorio y filtra `blueprint-*.md`, así que un flujo nuevo no queda fuera sin que la prueba se entere.
 */
function desfases(ficheros: Record<string, string>, directorio: URL): string[] {
  const resultado: string[] = []
  const enDisco = readdirSync(directorio).filter((n) => /^blueprint-.*\.md$/.test(n))
  for (const [nombre, contenido] of Object.entries(ficheros)) {
    if (!enDisco.includes(nombre)) {
      resultado.push(`${nombre}: falta en disco`)
      continue
    }
    const actual = readFileSync(new URL(nombre, directorio), 'utf8').replace(/\r\n/g, '\n')
    if (actual !== contenido) resultado.push(`${nombre}: difiere`)
  }
  for (const nombre of enDisco) {
    if (!(nombre in ficheros)) resultado.push(`${nombre}: sobra en disco`)
  }
  return resultado
}

function transicionInyectada(desde: string, hasta: string): Transition {
  return { id: 'inyectada_por_la_prueba', name: 'Transición inyectada por la prueba', from: [desde], to: hasta, area: 'Servicio Técnico', fields: [] }
}

describe('mapaPorFlujo — RQ-MB-08 · un mapa por flujo desde CATALOGO_POR_FLUJO', () => {
  it('P4 · el registro tiene exactamente las claves de CATALOGO_POR_FLUJO y cada flujo aporta al menos un fichero', () => {
    const mapas = mapasPorFlujo()
    expect(Object.keys(mapas).sort()).toEqual([...FLUJOS].sort())
    expect(FLUJOS.length, 'guarda contra el bucle fantasma').toBe(3)
    for (const flujo of FLUJOS) expect(Object.keys(mapas[flujo]).length, flujo).toBeGreaterThanOrEqual(1)
  })

  it('P5 · equipo nuevo: 5 estados en su orden y 7 aristas; soporte remoto: 4 y 4; sin marcas de servicio y con la leyenda', () => {
    const mapas = mapasPorFlujo()
    const casos = [
      { flujo: 'equipo-nuevo' as const, fichero: 'blueprint-equipo-nuevo.md', estados: ['Ingresado', 'En Proceso', 'Notificado', 'Verificación', 'Finalizado'], aristas: 7 },
      { flujo: 'soporte-remoto' as const, fichero: 'blueprint-soporte-remoto.md', estados: ['Solicitud Soporte', 'En Proceso', 'Finalizado', 'Pendiente'], aristas: 4 },
    ]
    for (const c of casos) {
      expect(Object.keys(mapas[c.flujo]), c.flujo).toEqual([c.fichero])
      expect(entradaMapaDelFlujo(c.flujo).estados, c.flujo).toEqual(c.estados)
      const contenido = mapas[c.flujo][c.fichero]
      expect(contenido.match(ARISTA) ?? [], `${c.flujo}: aristas`).toHaveLength(c.aristas)
      expect(contenido.match(NODO) ?? [], `${c.flujo}: estados`).toHaveLength(c.estados.length)
      for (const marca of ['(sin botón)', '·espera·', '[frontera]']) expect(contenido, `${c.flujo}: ${marca}`).not.toContain(marca)
      for (const area of ['Comercial', 'Servicio Técnico', 'Compras']) expect(contenido, `${c.flujo}: leyenda ${area}`).toContain(`— ${area}`)
    }
  })

  it('P5b · cada estado derivado enruta a su flujo con flujoDelTicket, y ningún otro estado conocido enruta a él', () => {
    const universo = new Set<string>(ESTADOS)
    for (const catalogo of Object.values(CATALOGO_POR_FLUJO)) {
      for (const t of catalogo) {
        t.from.forEach((e) => universo.add(e))
        universo.add(t.to)
      }
    }
    for (const flujo of ['equipo-nuevo', 'soporte-remoto'] as const) {
      const derivados = new Set(entradaMapaDelFlujo(flujo).estados)
      const clasificacion = CLASIFICACION_DEL_FLUJO[flujo]
      expect(derivados.size, flujo).toBeGreaterThan(0)
      for (const estado of derivados) {
        expect(flujoDelTicket({ classification: clasificacion, status: estado }), `${flujo}: ${estado}`).toBe(flujo)
      }
      const queEnrutan = [...universo].filter((estado) => flujoDelTicket({ classification: clasificacion, status: estado }) === flujo)
      expect(new Set(queEnrutan), flujo).toEqual(derivados)
    }
  })

  it('P5c · la entrada de servicio del registro lleva ESTADOS_SERVICIO (identidad) y genera lo mismo que la entrada escrita a mano', () => {
    const entrada = entradaMapaDelFlujo('servicio')
    expect(entrada.estados).toBe(ESTADOS_SERVICIO)
    expect(generarMapaBlueprint(entrada)).toEqual(generarMapaBlueprint(entradaReal()))
    expect(mapasPorFlujo().servicio).toEqual(generarMapaBlueprint(entradaReal()))
  })

  it('P9 · un estado nuevo en el catálogo de un flujo derivado aparece en `estados` y como nodo del mapa', () => {
    for (const [flujo, base] of [
      ['equipo-nuevo', TRANSITIONS_EQUIPO_NUEVO],
      ['soporte-remoto', TRANSITIONS_SOPORTE_REMOTO],
    ] as const) {
      const catalogo = [...base, transicionInyectada(base[0].from[0], 'Estado Inventado')]
      expect(estadosDelCatalogo(catalogo), flujo).toContain('Estado Inventado')
      const entrada = entradaMapaDelFlujo(flujo, catalogo)
      expect(entrada.estados, flujo).toContain('Estado Inventado')
      const completo = Object.values(generarMapaBlueprint(entrada))[0]
      expect(completo, flujo).toMatch(/state "Estado Inventado" as e\d{2}/)
    }
  })

  it('P10 · ficherosDelMapa lanza si dos flujos producen el mismo nombre, y mapasPorFlujo lanza nombrando la clave de un flujo sin complemento', () => {
    expect(() => ficherosDelMapa({ uno: { 'blueprint-x.md': 'a' }, dos: { 'blueprint-x.md': 'b' } })).toThrow(/blueprint-x\.md/)
    const conCuarto = { ...CATALOGO_POR_FLUJO, 'cuarto-flujo': TRANSITIONS_EQUIPO_NUEVO } as unknown as Record<Flujo, readonly Transition[]>
    expect(() => mapasPorFlujo(conCuarto)).toThrow(/cuarto-flujo/)
  })
})

describe('mapaPorFlujo — RQ-MB-06 · anti-desfase de los tres flujos contra docs/artefactos/', () => {
  it('P6 · lo generado por el registro es igual a lo commiteado, en los seis ficheros y sin ficheros de más', () => {
    const ficheros = ficherosDelMapa()
    // Primero las discrepancias, para que un flujo sin fichero en disco diga «falta en disco» y no sólo «hay siete».
    expect(desfases(ficheros, DIRECTORIO_ARTEFACTOS)).toEqual([])
    expect(Object.keys(ficheros), 'guarda contra el bucle fantasma').toHaveLength(6)
  })

  it('P7 · un fichero sintético añadido a lo esperado sale exactamente como «falta en disco»', () => {
    const ficheros = { ...ficherosDelMapa(), 'blueprint-sintetico.md': 'contenido' }
    expect(desfases(ficheros, DIRECTORIO_ARTEFACTOS)).toEqual(['blueprint-sintetico.md: falta en disco'])
  })

  it.each(FLUJOS)('P8 · %s · una transición inyectada en su catálogo, sin regenerar, sale como «difiere» en el fichero de ese flujo y en ningún otro', (flujo) => {
    const primera = CATALOGO_POR_FLUJO[flujo][0]
    const inyectada = transicionInyectada(primera.from[0], primera.to)
    const mapas = mapasPorFlujo({ ...CATALOGO_POR_FLUJO, [flujo]: [...CATALOGO_POR_FLUJO[flujo], inyectada] })
    const diferencias = desfases(ficherosDelMapa(mapas), DIRECTORIO_ARTEFACTOS)
    const propios = Object.keys(mapas[flujo])
    const completo = entradaMapaDelFlujo(flujo).nombreFicheroCompleto ?? 'blueprint-completo.md'
    expect(diferencias, flujo).toContain(`${completo}: difiere`)
    for (const d of diferencias) expect(propios.some((n) => d === `${n}: difiere`), `${flujo}: ${d}`).toBe(true)
    expect(mapas[flujo][completo], flujo).toContain(inyectada.name)
  })
})
