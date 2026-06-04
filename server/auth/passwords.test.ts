import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './passwords'

describe('passwords', () => {
  it('hashea (distinto del texto plano) y verifica correcto/incorrecto', async () => {
    const hash = await hashPassword('secreto-123')
    expect(hash).not.toBe('secreto-123')
    expect(await verifyPassword('secreto-123', hash)).toBe(true)
    expect(await verifyPassword('otra', hash)).toBe(false)
  })
})
