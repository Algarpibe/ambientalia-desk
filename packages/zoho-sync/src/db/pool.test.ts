import { describe, it, expect } from 'vitest'
import { createPoolFromUrl } from './pool'

describe('createPoolFromUrl', () => {
  it('crea un Pool con la connectionString dada', () => {
    const p = createPoolFromUrl('postgres://u:p@h:5432/db')
    expect(p).toBeTruthy()
    expect(typeof (p as any).query).toBe('function')
    return p.end()
  })
})
