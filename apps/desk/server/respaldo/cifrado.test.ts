import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
import { claveDesdeBase64, cifrador, descifrarBuffer, descifrarFichero, MAGIA } from './cifrado'

/** F1F-02 (RQ-ZS-20): el volcado sale cifrado del servidor (AES-256-GCM) y sólo se recupera con la clave. */
const CLAVE = randomBytes(32)

async function cifrarAFichero(datos: Buffer, clave: Buffer, ruta: string) {
  await pipeline(Readable.from([datos.subarray(0, 7), datos.subarray(7)]), cifrador(clave), createWriteStream(ruta))
}

describe('cifrado del respaldo', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'respaldo-'))
  const enc = path.join(dir, 'a.enc'); const dec = path.join(dir, 'a.dump')

  it('ida y vuelta: lo descifrado es byte a byte lo volcado, y lo cifrado no lo contiene', async () => {
    const datos = Buffer.concat([Buffer.from('PGDMP volcado de prueba '), randomBytes(5000)])
    await cifrarAFichero(datos, CLAVE, enc)
    const cifrado = readFileSync(enc)
    expect(cifrado.subarray(0, MAGIA.length).equals(MAGIA)).toBe(true)
    expect(cifrado.includes(Buffer.from('PGDMP'))).toBe(false)
    expect(cifrado.length).toBe(MAGIA.length + 12 + datos.length + 16)
    await descifrarFichero(enc, dec, CLAVE)
    expect(readFileSync(dec).equals(datos)).toBe(true)
  })

  it('con otra clave no descifra', async () => {
    await cifrarAFichero(Buffer.from('secreto'), CLAVE, enc)
    await expect(descifrarFichero(enc, dec, randomBytes(32))).rejects.toThrow()
  })

  it('un byte alterado hace fallar la etiqueta', async () => {
    await cifrarAFichero(Buffer.from('un volcado cualquiera'), CLAVE, enc)
    const b = readFileSync(enc); b[MAGIA.length + 12 + 3] ^= 1; writeFileSync(enc, b)
    await expect(descifrarFichero(enc, dec, CLAVE)).rejects.toThrow()
  })

  it('un fichero que no es un respaldo se rechaza por la cabecera', async () => {
    writeFileSync(enc, Buffer.alloc(64, 7))
    await expect(descifrarFichero(enc, dec, CLAVE)).rejects.toThrow(/no es un respaldo/)
  })

  it('la clave tiene que ser exactamente de 32 bytes en base64', () => {
    expect(claveDesdeBase64(CLAVE.toString('base64')).equals(CLAVE)).toBe(true)
    for (const mala of ['', 'corta', randomBytes(16).toString('base64'), randomBytes(33).toString('base64')]) expect(() => claveDesdeBase64(mala)).toThrow(/32 bytes/)
  })

  it('limpieza', () => { rmSync(dir, { recursive: true, force: true }) })
})

describe('descifrarBuffer (el índice de Drive, en memoria)', () => {
  const cifrarEnMemoria = async (datos: Buffer, clave: Buffer) => { const c = cifrador(clave); c.end(datos); return Buffer.concat(await c.toArray()) }
  it('ida y vuelta con cifrador; lanza con otra clave, con un byte alterado y con algo que no es un respaldo', async () => {
    const datos = Buffer.from('{"formato":1}')
    const enc = await cifrarEnMemoria(datos, CLAVE)
    expect(descifrarBuffer(enc, CLAVE).equals(datos)).toBe(true)
    expect(() => descifrarBuffer(enc, randomBytes(32))).toThrow()
    expect(() => descifrarBuffer(Buffer.concat([enc.subarray(0, 20), Buffer.from([enc[20] ^ 1]), enc.subarray(21)]), CLAVE)).toThrow()
    expect(() => descifrarBuffer(Buffer.from('no soy un respaldo, ni de lejos, de verdad'), CLAVE)).toThrow(/cabecera/)
    expect(() => descifrarBuffer(Buffer.alloc(3), CLAVE)).toThrow(/cabecera/)
  })
  it('un documento vacío también vuelve', async () => {
    expect(descifrarBuffer(await cifrarEnMemoria(Buffer.alloc(0), CLAVE), CLAVE)).toHaveLength(0)
  })
})
