import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { createWriteStream, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { cifrador } from './cifrado'
import { principal } from './descifrarCli'

/** F1F-02 (RQ-ZS-20): la herramienta de la prueba de restauración. La clave llega por entorno, nunca por argumento. */
describe('descifrarCli', () => {
  it('descifra con RESPALDO_CLAVE_CIFRADO y devuelve 0', async () => {
    const clave = randomBytes(32); const dir = mkdtempSync(path.join(tmpdir(), 'cli-'))
    const enc = path.join(dir, 'a.enc'); const out = path.join(dir, 'a.dump')
    await pipeline(Readable.from([Buffer.from('PGDMP datos')]), cifrador(clave), createWriteStream(enc))
    expect(await principal([enc, out], { RESPALDO_CLAVE_CIFRADO: clave.toString('base64') })).toBe(0)
    expect(readFileSync(out, 'utf8')).toBe('PGDMP datos')
  })

  it('sin argumentos o sin clave devuelve 2 y no escribe nada', async () => {
    expect(await principal([], { RESPALDO_CLAVE_CIFRADO: randomBytes(32).toString('base64') })).toBe(2)
    expect(await principal(['a', 'b'], {})).toBe(2)
  })
})
