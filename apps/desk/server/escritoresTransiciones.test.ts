import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { escritoresDeTransiciones, nombraActor, type EscritorTransicion } from './testing/escritoresTransiciones'

/**
 * RQ-TZ-16 · todo `INSERT INTO ticket_transitions` de producción nombra `performed_by`.
 *
 * QUÉ COMPRUEBA: que cada escritor que encuentra en el código fuente (leído como texto) NOMBRA la columna
 * `performed_by` en su lista de columnas, y que el inventario de escritores es exactamente el declarado.
 * QUÉ NO COMPRUEBA (S-6): que el valor llegue relleno en ejecución, ni ve un nombre de tabla interpolado
 * (`INSERT INTO ${tabla}`), ni una columna nombrada dentro de un comentario del propio `INSERT`. No hay
 * `NOT NULL` en la tabla y no se toca ninguna fila.
 *
 * La raíz se resuelve como en `reconciliacion/registro.test.ts` (`path.resolve(__dirname, …)`), que ya lee ficheros reales.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const OMITIDOS = new Set(['node_modules', 'dist', '.git', 'testing'])

type Fuente = { ruta: string; texto: string }

/** `.ts` de `apps/` y `packages/` que no son pruebas ni viven bajo `testing/`. Rutas con `/`, relativas a la raíz. */
function fuentesDeProduccion(dir = ''): Fuente[] {
  const abs = path.join(RAIZ, dir)
  return readdirSync(abs, { withFileTypes: true }).flatMap((d): Fuente[] => {
    const rel = dir ? `${dir}/${d.name}` : d.name
    if (d.isDirectory()) return OMITIDOS.has(d.name) ? [] : fuentesDeProduccion(rel)
    if (!d.name.endsWith('.ts') || d.name.endsWith('.test.ts')) return []
    return [{ ruta: rel, texto: readFileSync(path.join(RAIZ, rel), 'utf8') }]
  })
}
const enRaiz = (...dirs: string[]): Fuente[] => dirs.flatMap((d) => fuentesDeProduccion(d))

/** Procedimientos `.sql` de `docs/sdd/`: se vigilan en un caso aparte y no cuentan entre los escritores de producción. */
const procedimientosSql = (): Fuente[] =>
  readdirSync(path.join(RAIZ, 'docs/sdd')).filter((n) => n.endsWith('.sql'))
    .map((n) => ({ ruta: `docs/sdd/${n}`, texto: readFileSync(path.join(RAIZ, 'docs/sdd', n), 'utf8') }))

/** El barrido: cero escritores no es éxito, y cada uno ha de nombrar `performed_by`. Lanza nombrando el fichero. */
function barrer(ficheros: Fuente[]): EscritorTransicion[] {
  const escritores = escritoresDeTransiciones(ficheros)
  if (escritores.length === 0) throw new Error('El barrido no encontró ningún escritor de ticket_transitions: cero escritores no es éxito')
  const sin = escritores.filter((e) => !nombraActor(e))
  if (sin.length > 0) throw new Error(`Escritor de ticket_transitions que no nombra performed_by en: ${[...new Set(sin.map((e) => e.ruta))].join(', ')}`)
  return escritores
}
const inventario = (es: EscritorTransicion[]): Record<string, number> =>
  es.reduce<Record<string, number>>((m, e) => ({ ...m, [e.ruta]: (m[e.ruta] ?? 0) + 1 }), {})

const REPO = 'packages/zoho-sync/src/db/repo.ts'
const MIGRACION = 'apps/desk/server/db/migracionTicketsAbiertos.ts'
const PROCEDIMIENTO = 'docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql'

describe('RQ-TZ-16 · barrido de escritores de `ticket_transitions` (nombra la columna; no ve el valor ni una tabla interpolada)', () => {
  it('encuentra exactamente los cuatro escritores de hoy y todos nombran `performed_by`', () => {
    const escritores = barrer(enRaiz('apps', 'packages'))
    expect(inventario(escritores)).toEqual({ [REPO]: 3, [MIGRACION]: 1 })
    expect(escritores.every(nombraActor)).toBe(true)
  })

  it('un escritor sintético copiado de uno real, al que se le quita `performed_by`, pone el barrido en rojo nombrando el fichero', () => {
    const real = enRaiz('apps/desk/server/db').find((f) => f.ruta === MIGRACION)!
    expect(() => barrer([real])).not.toThrow()
    const sucio = { ruta: 'fixture/escritorSinActor.ts', texto: real.texto.replace(/performed_by/g, 'hecho_por') }
    expect(() => barrer([sucio])).toThrow(/fixture\/escritorSinActor\.ts/)
  })

  it('un `INSERT` sin lista de columnas cuenta como infractor', () => {
    const f = { ruta: 'fixture/sinLista.ts', texto: 'const q = `INSERT INTO ticket_transitions SELECT * FROM otra`' }
    expect(escritoresDeTransiciones([f])).toEqual([{ ruta: 'fixture/sinLista.ts', columnas: null }])
    expect(() => barrer([f])).toThrow(/fixture\/sinLista\.ts/)
  })

  it('calificado con esquema y repartido en varias líneas se encuentra, y pasa si nombra la columna', () => {
    const texto = (cols: string) => `const q = \`\n  insert into desk.ticket_transitions\n    (ticket_id,\n     ${cols}\n     "values")\n  VALUES ($1, $2, $3)\``
    const bueno = { ruta: 'fixture/multilinea.ts', texto: texto('performed_by,') }
    expect(escritoresDeTransiciones([bueno])).toEqual([{ ruta: 'fixture/multilinea.ts', columnas: ['ticket_id', 'performed_by', 'values'] }])
    expect(barrer([bueno])).toHaveLength(1)
    expect(() => barrer([{ ruta: 'fixture/multilinea.ts', texto: texto('area,') }])).toThrow(/fixture\/multilinea\.ts/)
  })

  it('un árbol donde el patrón no encuentra nada falla: cero escritores no es éxito', () => {
    expect(() => barrer([])).toThrow(/cero escritores/)
    expect(() => barrer([{ ruta: 'fixture/otraTabla.ts', texto: 'INSERT INTO tickets (id) VALUES ($1)' }])).toThrow(/cero escritores/)
  })

  it('un nombre de tabla que sólo empieza igual no cuenta como escritor', () => {
    expect(escritoresDeTransiciones([{ ruta: 'fixture/prefijo.ts', texto: 'INSERT INTO ticket_transitions_copia (ticket_id) VALUES ($1)' }])).toEqual([])
  })
})

describe('RQ-TZ-16 · procedimientos `.sql` de `docs/sdd/` (caso aparte, no cuentan entre los cuatro)', () => {
  it('el inventario es exactamente uno, y nombra `performed_by`', () => {
    const escritores = barrer(procedimientosSql())
    expect(inventario(escritores)).toEqual({ [PROCEDIMIENTO]: 1 })
    expect(escritores[0].columnas).toContain('performed_by')
  })

  it('un `.sql` de procedimiento sin `performed_by` pone el caso en rojo nombrando el fichero (se ensucia una copia del real)', () => {
    const real = procedimientosSql().find((f) => f.ruta === PROCEDIMIENTO)!
    const sucio = { ruta: 'docs/sdd/Fixture_sin_actor.sql', texto: real.texto.replace(/performed_by/g, 'hecho_por') }
    expect(() => barrer([sucio])).toThrow(/Fixture_sin_actor\.sql/)
  })
})
