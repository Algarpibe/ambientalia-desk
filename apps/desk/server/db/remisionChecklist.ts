import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { PerfilChecklist } from '@ambientalia/shared'

export interface ChecklistRow { id: string; perfil: string; item: string; orden: number; activo: boolean }

/**
 * ¿Hay algún ítem en la tabla? Permite distinguir dos casos que de otro modo son indistinguibles:
 * un perfil legítimamente sin checklist (Kunak) y el catálogo aún sin sembrar. Ambos devuelven
 * `[]`, y contarlos como lo mismo hace que la app afirme algo falso.
 */
export async function hayChecklist(db: Queryable): Promise<boolean> {
  const r = await db.query('SELECT 1 FROM remision_checklist LIMIT 1')
  return r.rows.length > 0
}

/** Ítems activos de un perfil, en el orden del catálogo. Un perfil sin ítems devuelve `[]` (Kunak). */
export async function getChecklist(db: Queryable, perfil: string): Promise<string[]> {
  const r = await db.query(
    'SELECT item FROM remision_checklist WHERE perfil = $1 AND activo = true ORDER BY orden, item',
    [perfil],
  )
  return r.rows.map((x: { item: string }) => x.item)
}

/** Todos los ítems de un perfil, incluidos los desactivados (para la pantalla de gestión). */
export async function listChecklist(db: Queryable, perfil: string): Promise<ChecklistRow[]> {
  const r = await db.query(
    'SELECT id, perfil, item, orden, activo FROM remision_checklist WHERE perfil = $1 ORDER BY orden, item',
    [perfil],
  )
  return r.rows.map((x: ChecklistRow) => ({ ...x, orden: Number(x.orden), activo: x.activo === true }))
}

/**
 * Siembra el catálogo inicial. **Idempotente y no destructiva**: inserta solo los pares (perfil, item)
 * que aún no existen y no toca los presentes, así que re-ejecutarla no duplica ni pisa ediciones —
 * ni reactiva lo que hayas desactivado. Pensada para dispararse a mano una vez, nunca al arrancar.
 *
 * Se comprueba con un SELECT previo en vez de `ON CONFLICT`, por dos motivos: no obliga a un índice único
 * sobre (perfil, item) —el operador puede repetir un ítem entre perfiles— y es el patrón que ya usa este
 * repo (`upsertContact`) por ser seguro en pg-mem, que no infiere el tipo de un `INSERT ... SELECT $n`.
 */
export async function seedChecklist(
  db: Queryable,
  seed: Partial<Record<PerfilChecklist, readonly string[]>>,
): Promise<{ insertados: number; existentes: number }> {
  let insertados = 0
  let existentes = 0
  for (const [perfil, items] of Object.entries(seed)) {
    for (const [i, item] of (items ?? []).entries()) {
      const ya = await db.query('SELECT 1 FROM remision_checklist WHERE perfil = $1 AND item = $2', [perfil, item])
      if (ya.rows.length > 0) { existentes++; continue }
      await db.query('INSERT INTO remision_checklist (perfil, item, orden) VALUES ($1, $2, $3)', [perfil, item, i])
      insertados++
    }
  }
  return { insertados, existentes }
}
