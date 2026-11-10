import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * `arranque-migracion-estricta` (RQ-ZS-55, `design.md` §3 y §5), fichero vigilado (regla de mutación 2) y prueba de POSICIÓN
 * (regla de mutación 1). Nadie importa `index.ts` porque arranca `main()` al cargarse: se lee el texto (molde de
 * `modoSinZohoIndice.test.ts`). Las líneas 26 y 27 cambian EN SITIO: el fichero conserva su número de líneas, para que las
 * citas `index.ts:NN` del repositorio sigan apuntando a lo que dicen.
 */
const texto = readFileSync(path.resolve(__dirname, 'index.ts'), 'utf8')
const lineas = texto.split(/\r?\n/)
const LINEAS_EN_97539C73 = 119 // split(/\r?\n/).length de index.ts en 97539c73 (118 saltos de línea y un final vacío)
const LINEA_8_EN_97539C73 = "import { migrate, reorgToDesk, reseedTicketNumber } from '@ambientalia/zoho-sync/db/migrate'"
const l26 = lineas[25]
const l27 = lineas[26]

describe('index.ts · la puesta al día estricta conserva el fichero (RQ-ZS-55)', () => {
  it('mismo número de líneas que en 97539c73 y finales de línea homogéneos (todos CRLF o ninguno)', () => {
    expect(lineas).toHaveLength(LINEAS_EN_97539C73)
    const crlf = (texto.match(/\r\n/g) ?? []).length
    const lf = (texto.match(/\n/g) ?? []).length
    expect(crlf === 0 || crlf === lf, `CRLF=${crlf} LF=${lf}`).toBe(true)
  })

  it('la línea 8 es idéntica a la de 97539c73: reorgToDesk y migrate se siguen importando ahí', () => {
    expect(lineas[7]).toBe(LINEA_8_EN_97539C73)
  })
})

describe('index.ts · posición: el límite antes de la reorganización, la reorganización antes de la migración', () => {
  it(':26 abre la puesta al día, antes del if de DB_SCHEMA, y éste antes de aplicar(reorgToDesk)', () => {
    const a = l26.indexOf('abrirPuestaAlDiaEstricta(pool)')
    const b = l26.indexOf("if (config.dbSchema === 'desk')")
    const c = l26.indexOf('aplicar(reorgToDesk)')
    expect(a, 'falta abrirPuestaAlDiaEstricta(pool) en :26').toBeGreaterThanOrEqual(0)
    expect(b, "falta el if de DB_SCHEMA en :26").toBeGreaterThan(a)
    expect(c, 'falta aplicar(reorgToDesk) en :26').toBeGreaterThan(b)
  })

  it(':27 aplica la migración y cierra la sesión', () => {
    expect(l27).toContain('aplicar(migrate)')
    expect(l27).toContain('cerrar()')
  })

  it('fuera de :26 y :27 ninguna línea aplica un paso, y ninguna llama ya a migrate(pool) ni a reorgToDesk(pool)', () => {
    lineas.forEach((l, i) => {
      if (i === 25 || i === 26) return
      expect(l, `la línea ${i + 1} no debería contener aplicar(`).not.toContain('aplicar(')
    })
    expect(lineas.filter((l) => l.includes('migrate(pool)'))).toHaveLength(0)
    expect(lineas.filter((l) => l.includes('reorgToDesk(pool)'))).toHaveLength(0)
  })

  it('las dos líneas llevan await y son contiguas', () => {
    expect(l26).toContain('await ')
    expect(l27).toContain('await ')
    expect(l26.indexOf('await ')).toBeLessThan(l26.indexOf('aplicar(reorgToDesk)'))
    expect(l27.indexOf('await ')).toBeLessThan(l27.indexOf('aplicar(migrate)'))
  })

  it('app.listen( aparece después de :27 y el catch de main conserva el aviso y la salida distinta de 0', () => {
    const escucha = lineas.findIndex((l) => l.includes('app.listen('))
    expect(escucha).toBeGreaterThan(26)
    const c = lineas.findIndex((l) => l.includes('main().catch'))
    expect(c).toBeGreaterThan(escucha)
    const bloque = lineas.slice(c, c + 6).join('\n')
    expect(bloque).toContain('Fallo al arrancar el servidor')
    expect(bloque).toContain('process.exit(1)')
  })
})

describe('index.ts · el módulo que importa :26 existe de verdad', () => {
  it('el especificador del import() de :26 resuelve y exporta abrirPuestaAlDiaEstricta', async () => {
    const m = /import\('([^']+)'\)/.exec(l26)
    expect(m, 'falta el import() dinámico en :26').not.toBeNull()
    expect(m![1]).toBe('@ambientalia/zoho-sync/db/puestaAlDiaEstricta')
    const modulo = await import(/* @vite-ignore */ m![1])
    expect(typeof modulo.abrirPuestaAlDiaEstricta).toBe('function')
  })
})
