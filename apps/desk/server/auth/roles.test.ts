import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createRole, listRoles, getRole, updateRole } from './roles'

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('roles repo', () => {
  it('crea con áreas válidas (filtra inválidas) y lista', async () => {
    const r = await createRole(db, { name: 'Técnico', areas: ['Servicio Técnico', 'Inventado'] })
    expect(r.name).toBe('Técnico')
    expect(r.areas).toEqual(['Servicio Técnico'])
    expect(r.active).toBe(true)
    expect((await listRoles(db)).length).toBe(1)
    expect((await getRole(db, r.id))!.areas).toEqual(['Servicio Técnico'])
  })

  it('update name/areas/active', async () => {
    const r = await createRole(db, { name: 'X', areas: ['Comercial'] })
    await updateRole(db, r.id, { name: 'Comercial', areas: ['Comercial', 'Compras'], active: false })
    const got = await getRole(db, r.id)
    expect(got!.name).toBe('Comercial')
    expect(got!.areas).toEqual(['Comercial', 'Compras'])
    expect(got!.active).toBe(false)
  })
})
