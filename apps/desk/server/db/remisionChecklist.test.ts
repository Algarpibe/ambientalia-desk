import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { seedChecklist, getChecklist, listChecklist } from './remisionChecklist'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const SEED = { horiba_ap: ['Brackets', 'Cable de poder'], environics: ['Conexión en T'] } as const

describe('remision_checklist', () => {
  it('siembra los ítems conservando el orden del catálogo', async () => {
    expect(await seedChecklist(db, SEED)).toEqual({ insertados: 3, existentes: 0 })
    expect(await getChecklist(db, 'horiba_ap')).toEqual(['Brackets', 'Cable de poder'])
    expect(await getChecklist(db, 'environics')).toEqual(['Conexión en T'])
  })

  // Es lo que la hace segura de re-ejecutar: sembrar dos veces no duplica ni pisa ediciones.
  it('sembrar de nuevo no duplica ni reescribe', async () => {
    await seedChecklist(db, SEED)
    expect(await seedChecklist(db, SEED)).toEqual({ insertados: 0, existentes: 3 })
    expect((await getChecklist(db, 'horiba_ap')).length).toBe(2)
  })

  it('añade solo lo nuevo si el catálogo crece', async () => {
    await seedChecklist(db, SEED)
    const r = await seedChecklist(db, { ...SEED, horiba_ap: ['Brackets', 'Cable de poder', 'Cap Nut'] })
    expect(r).toEqual({ insertados: 1, existentes: 3 })
    expect(await getChecklist(db, 'horiba_ap')).toEqual(['Brackets', 'Cable de poder', 'Cap Nut'])
  })

  it('un ítem desactivado desaparece del checklist pero sigue en la gestión', async () => {
    await seedChecklist(db, SEED)
    await db.query("UPDATE remision_checklist SET activo = false WHERE item = 'Brackets'")
    expect(await getChecklist(db, 'horiba_ap')).toEqual(['Cable de poder'])
    expect((await listChecklist(db, 'horiba_ap')).map((r) => r.item)).toEqual(['Brackets', 'Cable de poder'])
  })

  // Kunak existe como perfil pero su formulario nunca tuvo checklist: debe devolver vacío, no fallar.
  it('un perfil sin ítems devuelve una lista vacía', async () => {
    await seedChecklist(db, SEED)
    expect(await getChecklist(db, 'kunak')).toEqual([])
  })
})
