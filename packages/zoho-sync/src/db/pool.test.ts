import { describe, it, expect } from 'vitest'
import { createPool, createPoolFromUrl } from './pool'
import type { AppConfig } from '../config'

describe('createPoolFromUrl', () => {
  it('crea un Pool con la connectionString dada', () => {
    const p = createPoolFromUrl('postgres://u:p@h:5432/db')
    expect(p).toBeTruthy()
    expect(typeof (p as any).query).toBe('function')
    return p.end()
  })
})

describe('createPool search_path', () => {
  it('añade options search_path solo si dbSchema=desk', async () => {
    const desk = createPool({ databaseUrl: 'postgres://u:p@h:5432/db', dbSchema: 'desk' } as AppConfig)
    expect((desk as any).options.options).toBe('-c search_path=desk,public')
    await desk.end()
    const pub = createPool({ databaseUrl: 'postgres://u:p@h:5432/db', dbSchema: 'public' } as AppConfig)
    expect((pub as any).options.options).toBeUndefined()
    await pub.end()
  })
})
