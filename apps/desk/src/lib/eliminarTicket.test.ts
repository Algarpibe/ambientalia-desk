import { describe, it, expect } from 'vitest'
import { hayRastroEnDrive, resumenEnTexto } from './eliminarTicket'
import type { ResumenEliminacion } from '@ambientalia/shared'

const base: ResumenEliminacion = {
  ticket: { id: 'app-1', numero: 10002, asunto: 'Medidor de grasas', estado: 'Ingresado' },
  filas: [
    { tabla: 'remision_fotos', etiqueta: 'Fotos de remisión', borradas: 4 },
    { tabla: 'remisiones', etiqueta: 'Remisiones', borradas: 1 },
    { tabla: 'conversations', etiqueta: 'Conversaciones', borradas: 0 },
    { tabla: 'tickets', etiqueta: 'El ticket', borradas: 1 },
  ],
  total: 6,
  drive: [{
    remisionId: 'rem-1',
    etiqueta: 'Remisión de entrada del 2026-03-04',
    carpetaUrl: 'https://drive.google.com/drive/folders/CAR',
    documentoUrl: null,
    pdfUrl: 'https://drive.google.com/file/d/PDF1/view',
    dymoUrl: null,
  }],
  remisionesSinRastro: 0,
  actividadesQueQuedan: 0,
  dryRun: true,
}

describe('hayRastroEnDrive', () => {
  it('avisa cuando alguna remisión dejó documentos', () => {
    expect(hayRastroEnDrive(base)).toBe(true)
  })
  it('no avisa cuando no hay ninguno', () => {
    expect(hayRastroEnDrive({ ...base, drive: [] })).toBe(false)
  })
})

describe('resumenEnTexto', () => {
  const texto = resumenEnTexto(base)

  // Es lo que el administrador copia ANTES de confirmar: si un enlace no está aquí, se pierde.
  it('lleva todos los enlaces de Drive que existen', () => {
    expect(texto).toContain('https://drive.google.com/drive/folders/CAR')
    expect(texto).toContain('https://drive.google.com/file/d/PDF1/view')
  })

  it('identifica el ticket', () => {
    expect(texto).toContain('#10002')
    expect(texto).toContain('Medidor de grasas')
  })

  // Las tablas vacías también: el cero es la prueba de que se miró, y en una copia de seguridad
  // «Conversaciones: 0» y la ausencia de la línea no significan lo mismo.
  it('lleva las filas, incluidas las que van a cero', () => {
    expect(texto).toContain('Fotos de remisión: 4')
    expect(texto).toContain('Conversaciones: 0')
  })

  it('no inventa líneas de Drive cuando no hay documentos', () => {
    expect(resumenEnTexto({ ...base, drive: [] })).not.toContain('drive.google.com')
  })
})
