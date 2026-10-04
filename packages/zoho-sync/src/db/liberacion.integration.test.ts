import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import {
  transicionPorId, textoAutorizacionAGuardar,
  CLAVE_MOTIVO_LIBERACION as MOTIVO, CLAVE_FECHA_PREVISTA_FACTURACION as FECHA, CLAVE_TEXTO_AUTORIZACION as TEXTO,
} from '@ambientalia/shared'
import { reorgToDesk, migrate } from './migrate'
import { applyTransition, type TransitionApply } from './repo'
import { PROMOTED_COLUMNS } from './rows'

/**
 * prueba-integracion-mezcla-jsonb (E-206; aviso W2 del verify de F1C-05) · la mezcla de `custom_fields` de
 * `writeTransition` (`packages/zoho-sync/src/db/repo.ts:309`, `custom_fields || $N::jsonb`) contra PostgreSQL REAL.
 *
 * Por qué existe: pg-mem no sabe mezclar jsonb y el arnés HTTP lo emula con `{...actual, ...nuevos}`
 * (`apps/desk/server/testing/appHarness.ts:105-117`). Desde F1C-05 «Liberación sin factura» usa esa mezcla SIEMPRE,
 * y que el operador real hiciera lo mismo que la emulación era hipótesis. Aquí se enfrentan los dos.
 *
 * Aislamiento: `migrate.integration.test.ts` hace `DROP SCHEMA desk CASCADE` sobre la base de `TEST_DATABASE_URL`
 * y vitest corre los ficheros en paralelo. Esta prueba crea SU base en el mismo servidor y la borra al terminar.
 */
const url = process.env.TEST_DATABASE_URL
const d = url ? describe : describe.skip

const T = transicionPorId('liberacion_sin_factura')!
const col = (label: string) => PROMOTED_COLUMNS.find((p) => p.label === label)!.col as string
const A = 'Fecha de corte de facturación del cliente'
const C = 'Autorización excepcional de Dirección Comercial'

/**
 * El plan con la FORMA que produce el servidor. `buildTransitionPlan` vive en `apps/desk/server/transitionExec.ts`
 * y este paquete no puede importar de `apps/`, así que se arma aquí con las piezas reales que sí están a mano:
 * motivo y fecha van a su columna porque están en `PROMOTED_COLUMNS` (`apps/desk/server/transitionExec.ts:90-91`;
 * la fecha, recortada a diez caracteres, `:33`), y el texto lo fija `textoAutorizacionAGuardar` —recortado, o
 * `null`— en `apps/desk/server/services/ticketService.ts:133`. La forma la prueba
 * `apps/desk/server/liberacionVerificacion.test.ts:9-12`.
 */
function planDeLiberacion(valores: Record<string, unknown>): TransitionApply {
  const texto = textoAutorizacionAGuardar(T, valores)
  if (texto === undefined) throw new Error('la transición de liberación ya no declara el campo del motivo')
  return {
    status: T.to, statusType: 'Open', comment: String(valores.comment),
    columns: { [col(MOTIVO)]: String(valores[MOTIVO]), [col(FECHA)]: String(valores[FECHA]).slice(0, 10) },
    customFields: { [TEXTO]: texto },
  }
}

/** Lo que hace el arnés con esa misma sentencia (`apps/desk/server/testing/appHarness.ts:110-111`). */
const emulacion = (actual: unknown, nuevos: Record<string, unknown>) => ({ ...((actual ?? {}) as Record<string, unknown>), ...nuevos })

d('liberación sin factura · la mezcla de custom_fields en PostgreSQL real (E-206)', () => {
  let admin: Pool
  let pool: Pool
  const base = `liberacion_it_${process.pid}_${Date.now()}`

  beforeAll(async () => {
    admin = new Pool({ connectionString: url })
    await admin.query(`CREATE DATABASE ${base}`)
    const propia = new URL(url!)
    propia.pathname = `/${base}`
    pool = new Pool({ connectionString: propia.toString(), options: '-c search_path=desk,public' })
    await pool.query('CREATE SCHEMA IF NOT EXISTS books') // schema.sql referencia books.* (calificado)
    await reorgToDesk(pool)
    await migrate(pool)
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${base} WITH (FORCE)`)
    await admin?.end()
  }, 60_000)

  async function ticket(id: string, number: number, customFields?: string) {
    if (customFields === undefined) await pool.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,'Liberación','Por Facturar')", [id, number])
    else await pool.query("INSERT INTO tickets (id, number, subject, status, custom_fields) VALUES ($1,$2,'Liberación','Por Facturar',$3::jsonb)", [id, number, customFields])
  }
  const liberar = (id: string, valores: Record<string, unknown>) =>
    applyTransition(pool, id, 'Por Facturar', { id: T.id, name: T.name, area: T.area }, planDeLiberacion(valores), 'Prueba', valores)
  async function fila(id: string) {
    const r = await pool.query(
      `SELECT status, managed_by_app, liberacion_motivo, fecha_prevista_facturacion::text AS fecha, custom_fields,
              jsonb_typeof(custom_fields) AS forma, custom_fields ? $2 AS tiene_clave, jsonb_typeof(custom_fields -> $2) AS tipo_clave
       FROM tickets WHERE id=$1`, [id, TEXTO])
    return r.rows[0] as {
      status: string; managed_by_app: boolean; liberacion_motivo: string | null; fecha: string | null
      custom_fields: unknown; forma: string; tiene_clave: boolean | null; tipo_clave: string | null
    }
  }

  it('el esquema real quedó montado en la base propia, con tickets en desk y la columna NOT NULL con su valor por defecto', async () => {
    const r = await pool.query("SELECT table_schema, is_nullable, column_default FROM information_schema.columns WHERE table_name='tickets' AND column_name='custom_fields'")
    expect(r.rows).toEqual([{ table_schema: 'desk', is_nullable: 'NO', column_default: "'{}'::jsonb" }])
  })

  it('(a) primera liberación con texto: las claves previas se conservan, la del texto queda con el valor nuevo y motivo y fecha van a sus columnas', async () => {
    const previas = { 'Campo de Zoho': 'valor previo', 'Otro campo de Zoho': null, [TEXTO]: 'texto anterior' }
    await ticket('a1', 9001, JSON.stringify(previas))
    await liberar('a1', { comment: 'liberado', [MOTIVO]: C, [FECHA]: '2026-10-10', [TEXTO]: '  Autoriza la Dirección  ' })
    const f = await fila('a1')
    expect(f.custom_fields).toEqual({ 'Campo de Zoho': 'valor previo', 'Otro campo de Zoho': null, [TEXTO]: 'Autoriza la Dirección' })
    expect(f.custom_fields).toEqual(emulacion(previas, { [TEXTO]: 'Autoriza la Dirección' }))
    expect(f).toMatchObject({ status: 'Por Entregar / Sin facturar', managed_by_app: true, liberacion_motivo: C, fecha: '2026-10-10' })
    const traza = await pool.query("SELECT to_status, values FROM ticket_transitions WHERE ticket_id='a1'")
    expect(traza.rows).toHaveLength(1)
    expect(traza.rows[0].values[TEXTO]).toBe('  Autoriza la Dirección  ')
  })

  it('(b) segunda liberación SIN texto: la clave sigue presente con null de JSON (no el texto viejo, no ausente), igual que la emulación', async () => {
    await ticket('b1', 9002, JSON.stringify({ 'Campo de Zoho': 'valor previo' }))
    await liberar('b1', { comment: 'primera', [MOTIVO]: C, [FECHA]: '2026-10-10', [TEXTO]: 'primera' })
    const antes = await fila('b1')
    expect(antes.custom_fields).toEqual({ 'Campo de Zoho': 'valor previo', [TEXTO]: 'primera' })

    const segunda = { comment: 'segunda', [MOTIVO]: A, [FECHA]: '2026-11-01' }
    expect(planDeLiberacion(segunda).customFields).toEqual({ [TEXTO]: null }) // lo que manda el plan: la clave, con null
    await pool.query("UPDATE tickets SET status='Por Facturar' WHERE id='b1'")
    await liberar('b1', segunda)

    const f = await fila('b1')
    expect(f.tiene_clave).toBe(true)
    expect(f.tipo_clave).toBe('null')
    expect(f.custom_fields).toEqual({ 'Campo de Zoho': 'valor previo', [TEXTO]: null })
    expect(f.custom_fields).toEqual(emulacion(antes.custom_fields, { [TEXTO]: null }))
    expect(f).toMatchObject({ liberacion_motivo: A, fecha: '2026-11-01' })
    expect((await pool.query("SELECT 1 FROM ticket_transitions WHERE ticket_id='b1'")).rows).toHaveLength(2)
  })

  it('(c) custom_fields NULL de SQL no es alcanzable: la columna lo rechaza, y un ticket sin el campo nace en {} y la mezcla funciona', async () => {
    // Por qué importa: en PostgreSQL `NULL || jsonb` es NULL, y la mezcla borraría el campo entero sin error.
    const crudo = await pool.query('SELECT (NULL::jsonb || $1::jsonb) IS NULL AS es_null', [JSON.stringify({ [TEXTO]: 't' })])
    expect(crudo.rows[0].es_null).toBe(true)
    await expect(pool.query("INSERT INTO tickets (id, number, status, custom_fields) VALUES ('c0', 9003, 'Por Facturar', NULL)")).rejects.toMatchObject({ code: '23502' })
    await ticket('c1', 9004)
    await expect(pool.query("UPDATE tickets SET custom_fields = NULL WHERE id='c1'")).rejects.toMatchObject({ code: '23502' })
    await liberar('c1', { comment: 'x', [MOTIVO]: C, [FECHA]: '2026-10-10', [TEXTO]: 'ok' })
    expect((await fila('c1')).custom_fields).toEqual({ [TEXTO]: 'ok' })
  })

  /*
   * CARACTERIZACIÓN de una divergencia con la emulación, en un estado que el código NO produce. La columna sí admite
   * el `null` de JSON (`'null'::jsonb` no es NULL de SQL), y sobre él `||` no mezcla: concatena y deja un ARRAY. La
   * emulación, con su `?? {}` (`apps/desk/server/testing/appHarness.ts:110`), daría un objeto. Ningún escritor deja
   * ese valor: el sincronizador escribe siempre un objeto (`packages/zoho-sync/src/db/mappers.ts:44`, `:60`), el alta
   * no nombra la columna (`packages/zoho-sync/src/db/repo.ts:420`) y la transición mezcla sobre lo que haya. Sólo lo
   * dejaría una escritura a mano en la base. Se fija para que, si algún día un escritor lo produce, se sepa qué pasa.
   */
  it('(d) sobre un custom_fields con null de JSON —sólo posible a mano— el operador real deja un array, y la emulación daría un objeto', async () => {
    await ticket('d1', 9005, 'null')
    await liberar('d1', { comment: 'x', [MOTIVO]: C, [FECHA]: '2026-10-10', [TEXTO]: 'ok' })
    const f = await fila('d1')
    expect(f.forma).toBe('array')
    expect(f.custom_fields).toEqual([null, { [TEXTO]: 'ok' }])
    expect(f.custom_fields).not.toEqual(emulacion(null, { [TEXTO]: 'ok' }))
  })
})
