import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, schemaStatements, type Queryable } from './migrate'

/**
 * F1B-04 (`recepcion-rotulacion-foto-entrada`) · RQ-RE-21 · el catálogo de novedades de entrada es DATO.
 *
 * Vigila `schema.sql` (regla de mutación 2): cada prueba se rompe ensuciando el fichero, no el guardián.
 */
async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  return db
}

const sinComentarios = (stmt: string): string => stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
const sentenciasDeSiembra = (): string[] =>
  schemaStatements().map(sinComentarios).filter((s) => /^INSERT INTO public\.catalogo_novedades\b/i.test(s))

const LISTA: [string, string, number][] = [
  ['sin_novedad', 'Sin novedad', 10],
  ['golpe_carcasa', 'Golpe o abolladura en la carcasa', 20],
  ['rayon_estetico', 'Rayón o daño estético', 30],
  ['pantalla_danada', 'Pantalla o display dañado', 40],
  ['conector_danado', 'Conector o puerto dañado', 50],
  ['falta_accesorio', 'Falta un accesorio', 60], ['accesorio_fuera_de_lista', 'Accesorio fuera de lista', 65],
  ['embalaje_inadecuado', 'Embalaje inadecuado o dañado', 70],
  ['humedad_suciedad', 'Humedad, suciedad o contaminación visible', 80],
  ['sello_roto', 'Sello o precinto roto', 90],
  ['otro', 'Otro', 100],
]

const COLUMNAS_NUEVAS = [
  ['remisiones', 'novedades'], ['remisiones', 'novedad_otro'], ['remisiones', 'rotulado_at'], ['remisiones', 'rotulado_por'],
  ['remision_fotos', 'categoria'], ['remision_fotos', 'novedad'],
] as const

describe('F1B-04 · siembra de public.catalogo_novedades (RQ-RE-21)', () => {
  it('1 · tras migrate hay once filas, en el orden de la lista y con sus etiquetas', async () => {
    const db = await freshDb()
    const r = await db.query('SELECT clave, etiqueta, orden FROM public.catalogo_novedades ORDER BY orden')
    expect(r.rows.map((f) => [f.clave, f.etiqueta, Number(f.orden)])).toEqual(LISTA)
  })

  it('2 · las once están activas, sólo sin_novedad excluye a las demás y sólo accesorio_fuera_de_lista y otro exigen texto', async () => {
    const db = await freshDb()
    const r = await db.query('SELECT clave, activo, excluye_demas, exige_texto FROM public.catalogo_novedades ORDER BY orden')
    expect(r.rows).toHaveLength(11)
    expect(r.rows.every((f) => f.activo === true)).toBe(true)
    expect(r.rows.filter((f) => f.excluye_demas === true).map((f) => f.clave)).toEqual(['sin_novedad'])
    expect(r.rows.filter((f) => f.exige_texto === true).map((f) => f.clave)).toEqual(['accesorio_fuera_de_lista', 'otro'])
  })

  it('3 · reejecutar las sentencias de siembra no lanza y deja once filas', async () => {
    const db = await freshDb()
    const siembra = sentenciasDeSiembra()
    expect(siembra.length).toBeGreaterThan(0)
    for (const s of siembra) await db.query(s)
    const r = await db.query('SELECT count(*) AS n FROM public.catalogo_novedades')
    expect(Number(r.rows[0].n)).toBe(11)
  })

  it('4 · reejecutar la siembra conserva lo editado (etiqueta, activo y marcas)', async () => {
    const db = await freshDb()
    await db.query("UPDATE public.catalogo_novedades SET etiqueta = 'Rayón (editada)', activo = false WHERE clave = 'rayon_estetico'")
    await db.query("UPDATE public.catalogo_novedades SET exige_texto = false WHERE clave = 'otro'")
    await db.query("UPDATE public.catalogo_novedades SET excluye_demas = true, orden = 35 WHERE clave = 'pantalla_danada'")
    for (const s of sentenciasDeSiembra()) await db.query(s)
    const r = await db.query('SELECT clave, etiqueta, activo, excluye_demas, exige_texto, orden FROM public.catalogo_novedades')
    expect(r.rows).toHaveLength(11)
    const por = (k: string) => r.rows.find((f) => f.clave === k)
    expect(por('rayon_estetico')).toMatchObject({ etiqueta: 'Rayón (editada)', activo: false })
    expect(por('otro')).toMatchObject({ exige_texto: false })
    expect(por('pantalla_danada')).toMatchObject({ excluye_demas: true, orden: 35 })
  })

  it('5 · la siembra son exactamente once sentencias, una por fila', () => {
    const siembra = sentenciasDeSiembra()
    expect(siembra).toHaveLength(11)
    for (const s of siembra) expect(s, 'cada fila lleva su ON CONFLICT (clave) DO NOTHING').toMatch(/ON CONFLICT \(clave\) DO NOTHING$/i)
  })

  it('6 · las seis columnas existen tras migrate y sólo las crean seis ALTER, sin relleno de filas existentes', async () => {
    const db = await freshDb()
    for (const [tabla, columna] of COLUMNAS_NUEVAS) {
      const r = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2",
        [tabla, columna],
      )
      expect(r.rows, `${tabla}.${columna} existe`).toHaveLength(1)
    }
    // Sentencias que nombran una de las seis columnas sobre remisiones o remision_fotos: ni una más que las seis ALTER.
    const nombres = /\b(novedades|novedad_otro|rotulado_at|rotulado_por|categoria|novedad)\b/i
    const relacionadas = schemaStatements().map(sinComentarios)
      .filter((s) => /\bremisiones\b|\bremision_fotos\b/i.test(s) && nombres.test(s))
    expect(relacionadas, 'sentencias de schema.sql que tocan las columnas nuevas').toHaveLength(6)
    for (const s of relacionadas) expect(s).toMatch(/^ALTER TABLE public\.(remisiones|remision_fotos) ADD COLUMN IF NOT EXISTS /i)
  })
})

// Cierre tras el verify (W4). NACE VERDE. «Migrar dos veces no pisa» para la fila de F1B-04, por COMPORTAMIENTO: se edita en la
// base y se vuelve a migrar. La prueba 4 sólo editaba tres de las diez filas antiguas.
describe('F1B-04 · accesorio_fuera_de_lista tras migrar dos veces (RQ-RE-34)', () => {
  it('7 · volver a migrar conserva la etiqueta, el activo y las marcas editadas de la fila nueva', async () => {
    const db = await freshDb()
    await db.query("UPDATE public.catalogo_novedades SET etiqueta = 'Fuera de lista (editada)', activo = false, exige_texto = false, orden = 66 WHERE clave = 'accesorio_fuera_de_lista'")
    await migrate(db)
    const r = await db.query("SELECT etiqueta, activo, exige_texto, orden FROM public.catalogo_novedades WHERE clave = 'accesorio_fuera_de_lista'")
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]).toMatchObject({ etiqueta: 'Fuera de lista (editada)', activo: false, exige_texto: false })
    expect(Number(r.rows[0].orden)).toBe(66)
    const n = await db.query('SELECT count(*) AS n FROM public.catalogo_novedades')
    expect(Number(n.rows[0].n)).toBe(11)
  })
})

// recepcion-exencion-foto-y-casilla (F1B-04) · RQ-RE-37 y RQ-RE-38 · la marca de exencion y las cuatro columnas de traza.
// Vigila `schema.sql` (regla de mutacion 2): se rompen ensuciando el fichero, no el guardian.
describe('recepcion-exencion-foto-y-casilla · exenta_de_foto y casillas con traza (RQ-RE-37, RQ-RE-38)', () => {
  it('PS-8 · sólo falta_accesorio nace exenta de foto; las otras diez siguen en false', async () => {
    const db = await freshDb()
    const r = await db.query('SELECT clave, exenta_de_foto FROM public.catalogo_novedades ORDER BY orden')
    expect(r.rows).toHaveLength(11)
    expect(r.rows.filter((f) => f.exenta_de_foto === true).map((f) => f.clave)).toEqual(['falta_accesorio'])
    expect(r.rows.filter((f) => f.exenta_de_foto === false)).toHaveLength(10)
  })

  it('PS-9 · volver a migrar devuelve la marca a una fila desmarcada y no toca las otras diez', async () => {
    const db = await freshDb()
    await db.query("UPDATE public.catalogo_novedades SET exenta_de_foto = false WHERE clave = 'falta_accesorio'")
    await db.query("UPDATE public.catalogo_novedades SET exenta_de_foto = true WHERE clave = 'otro'")
    await migrate(db)
    const r = await db.query('SELECT clave, exenta_de_foto FROM public.catalogo_novedades ORDER BY orden')
    const por = (k: string) => r.rows.find((f) => f.clave === k)
    expect(por('falta_accesorio')).toMatchObject({ exenta_de_foto: true })
    // la migración no es un normalizador: una marca puesta a mano en otra fila se queda como está
    expect(por('otro')).toMatchObject({ exenta_de_foto: true })
    expect(r.rows.filter((f) => f.exenta_de_foto === false)).toHaveLength(9)
    expect(r.rows).toHaveLength(11)
  })

  it('PS-10 · exactamente dos sentencias nombran exenta_de_foto, las dos calificadas y con su guarda de idempotencia', () => {
    const nombran = schemaStatements().map(sinComentarios).filter((s) => /\bexenta_de_foto\b/i.test(s))
    expect(nombran).toHaveLength(2)
    expect(nombran[0]).toMatch(/^ALTER TABLE public\.catalogo_novedades ADD COLUMN IF NOT EXISTS exenta_de_foto boolean NOT NULL DEFAULT false$/)
    expect(nombran[1]).toMatch(/^UPDATE public\.catalogo_novedades SET exenta_de_foto = true WHERE clave = 'falta_accesorio' AND exenta_de_foto IS NOT TRUE$/)
  })

  it('PS-11 · las cuatro columnas de traza existen NULL-ables y las crean cuatro ALTER calificadas, sin relleno', async () => {
    const db = await freshDb()
    const cols = ['sin_accesorios_at', 'sin_accesorios_por', 'sin_embalaje_at', 'sin_embalaje_por']
    // pg-mem declara `is_nullable = 'NO'` para toda columna: la NULL-abilidad se prueba por comportamiento, con una fila que no las trae
    await db.query("INSERT INTO public.remisiones (id, ticket_id, fecha) VALUES ('rem-ps11', 't1', '2026-10-12')")
    const r = await db.query(`SELECT ${cols.join(', ')} FROM public.remisiones WHERE id = 'rem-ps11'`)
    expect(r.rows).toHaveLength(1)
    for (const c of cols) expect(r.rows[0][c], `${c} sin relleno`).toBeNull()
    const nombran = schemaStatements().map(sinComentarios).filter((s) => /\bsin_(accesorios|embalaje)_(at|por)\b/i.test(s))
    expect(nombran).toHaveLength(4)
    for (const s of nombran) expect(s).toMatch(/^ALTER TABLE public\.remisiones ADD COLUMN IF NOT EXISTS sin_(accesorios|embalaje)_(at timestamptz|por text)$/)
  })
})
