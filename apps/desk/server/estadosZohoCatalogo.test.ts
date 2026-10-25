import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ESTADOS, normalizarEstado } from '@ambientalia/shared'
import { leerRegistros } from './encuesta/analizarRespuestas'

/**
 * Catálogo de estados de Zoho (RQ-ZS-24, «El catálogo»): la columna «Estado» de `docs/analisis-tickets/Tickets.csv` (exportación
 * del 08/09), leída SÓLO en lectura. No es la lista completa de Zoho (S-6). El BOM se retira como en `comparacion/leerExportacion.ts`.
 */
const RUTA = resolve(__dirname, '../../../docs/analisis-tickets/Tickets.csv')
const BOM = String.fromCharCode(0xfeff)

function leerEstados(contenido: string): string[] {
  const texto = contenido.startsWith(BOM) ? contenido.slice(1) : contenido
  const [cabecera, ...filas] = leerRegistros(texto, ',')
  const col = cabecera.indexOf('Estado')
  if (col === -1) throw new Error('El CSV no tiene la columna «Estado»')
  return filas.filter((f) => f.length > col && f[col] !== '').map((f) => f[col])
}

/** El comprobador: los estados (normalizados, distintos) que NO son un nombre del registro. */
function ajenosAlRegistro(contenido: string): string[] {
  const conocidos = new Set<string>(ESTADOS)
  return [...new Set(leerEstados(contenido).map(normalizarEstado))].filter((e) => !conocidos.has(e))
}

describe('catálogo de estados de Zoho', () => {
  const contenido = readFileSync(RUTA, 'utf8')
  const crudos = leerEstados(contenido)

  it('el fichero trae valores y contiene Notificación  Comercial con dos espacios', () => {
    expect(crudos.length).toBeGreaterThan(50)
    expect(crudos).toContain('Notificación  Comercial')
  })

  it('cada valor distinto, normalizado, es un nombre del registro', () => {
    expect(ajenosAlRegistro(contenido)).toEqual([])
  })

  it('ningún valor trae tabulador ni NBSP (S-1)', () => {
    expect(crudos.filter((e) => /[\t\u00a0]/.test(e))).toEqual([])
  })

  it('mutación 2: una fila con un estado ajeno al registro hace que el comprobador lo devuelva', () => {
    const [cabecera] = contenido.replace(BOM, '').split(/\r?\n/)
    const col = leerRegistros(cabecera, ',')[0].indexOf('Estado')
    const celdas = leerRegistros(cabecera, ',')[0].map((_, i) => (i === col ? 'Estado ajeno' : 'x'))
    expect(ajenosAlRegistro(contenido + '\n' + celdas.join(','))).toEqual(['Estado ajeno'])
  })
})
