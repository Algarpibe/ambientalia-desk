import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { generarMapaBlueprint, type EntradaMapa, type PasoSinBoton } from './mapaBlueprint'
import { TRANSITIONS, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'
import { ESTADOS, ESTADOS_SIN_SALIDA } from './estados'
import { FASES, FASE_POR_ESTADO } from './fasesBlueprint'

// `mapaBlueprint.ts` recorre el grafo y devuelve los cuatro `.md` (RQ-MB-01..05). El diff
// anti-desfase (RQ-MB-06) va en su propio bloque al final, tras B.2.2 volcar a disco.

const SIN_BOTON: PasoSinBoton[] = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA]

function entradaReal(): EntradaMapa {
  return {
    transiciones: TRANSITIONS,
    sinBoton: SIN_BOTON,
    estados: ESTADOS,
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

  it('RQ-MB-02 · el diagrama completo tiene 38 aristas, 3 con origen en Habilitar Servicio', () => {
    const salida = generarMapaBlueprint(entradaReal())
    const completo = salida['blueprint-completo.md']
    // El patrón exige alias `eNN` a los dos lados: la cabecera HTML cierra con un `-->` suelto
    // (`<!-- ... -->`) que un patrón desnudo `/-->/ ` contaría como arista fantasma.
    const aristas = completo.match(/e\d{2} --> e\d{2}/g) ?? []
    expect(aristas).toHaveLength(38)
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
    const sinPendiente = Object.fromEntries(
      Object.entries(entrada.fasePorEstado).filter(([estado]) => estado !== 'Pendiente'),
    ) as typeof entrada.fasePorEstado
    expect(() => generarMapaBlueprint({ ...entrada, fasePorEstado: sinPendiente })).toThrow(/Pendiente/)
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
    // Los 21 estados aparecen entre las cuatro vistas (cada uno en su fase nativa al menos).
    const completo = salida['blueprint-completo.md']
    for (const estado of ESTADOS) expect(completo).toContain(estado)
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
