import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { extractServiceCode } from '@ambientalia/shared'

export async function backfillSerialFromSubject(db: Queryable): Promise<{ updated: number }> {
  const r = await db.query(
    `SELECT id, subject, serial, codigo_servicio FROM tickets
     WHERE managed_by_app = false AND (COALESCE(serial,'') = '' OR COALESCE(codigo_servicio,'') = '')`,
  )
  let updated = 0
  for (const row of r.rows as any[]) {
    const ext = extractServiceCode(row.subject)
    if (!ext) continue
    const newSerial = (row.serial == null || row.serial === '') ? ext.serial : row.serial
    const newCodigo = (row.codigo_servicio == null || row.codigo_servicio === '') ? ext.codigo : row.codigo_servicio
    if (newSerial !== row.serial || newCodigo !== row.codigo_servicio) {
      await db.query('UPDATE tickets SET serial=$1, codigo_servicio=$2, updated_at=now() WHERE id=$3', [newSerial, newCodigo, row.id])
      updated++
    }
  }
  return { updated }
}
