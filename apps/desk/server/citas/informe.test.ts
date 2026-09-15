import { describe, it, expect } from 'vitest'
import { detectar } from './detector'
import { informe } from './informe'
import { repoEnMemoria, cita, abreviada } from '../testing/reposDePrueba'

const NL = String.fromCharCode(10)

// Una ejecución con TODAS las categorías del §5 del diseño, una de cada, más una rota en la base.
const repo = repoEnMemoria({
  LOCAL: {
    'doc.md': [
      `Comprobada ${cita('a.md', 1)} y abreviada rota ${abreviada(9)}.`,
      `Sin barra ${cita('nada.md', 1)} y directorio ${cita('dir/sub', 1)}.`,
      `Ambigua ${cita('comun.md', 1)} y huérfana ${abreviada(1)}.`,
      `Fuera ${cita('~/x.md', 3)}, hora ${cita('10', 30)} y puerto ${cita('http://localhost', 3001)}.`,
      `Rota ${cita('a.md', 7)} y rota ya en la base ${cita('a.md', 8)}.`,
    ].join(NL),
    'a.md': ['uno', 'dos'].join(NL),
    'dir/sub/x.md': 'x',
    'a/comun.md': 'válida',
    'b/comun.md': '',
  },
})
const base = [{ fichero: 'doc.md', linea: 5, cita: cita('a.md', 8), motivo: 'extremo inicial fuera de rango' }]
const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base })
const texto = informe(resultado, { sha: 'abc1234', ref: 'refs/heads/main', indiceRemoto: 'origin/main' })

describe('informe · RQ-CV-10: cuatro cifras, desglose, «no son citas» y frases fijas (tareas 1.40-1.41)', () => {
  it('imprime las cuatro cifras por separado, con el desglose de las saltadas', () => {
    expect(texto).toMatch(/comprobadas \.+ 1$/m)
    expect(texto).toMatch(/saltadas \.+ 4 +\(sin barra y sin resolver 1 · ambiguas con alguna candidata válida 1 · directorios 1 · abreviadas huérfanas 1 · anclas sin resolver 0 · no legibles 0\)/)
    expect(texto).toMatch(/fuera del repositorio \.+ 1$/m)
    expect(texto).toMatch(/abreviadas rotas \.+ 1 +\(informativas: no bloquean\)/)
  })

  it('«no son citas» va en su propia línea, fuera de las cuatro cifras, y la base dice informadas y caducadas', () => {
    expect(texto).toMatch(/no son citas \.+ 2 +\(marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras\)/)
    expect(texto).toMatch(/índice remoto \.+ origin\/main$/m)
    expect(texto).toMatch(/línea base \.+ 1 informadas · 0 caducadas/)
  })

  it('lista la abreviada rota y la bloqueante con fichero, línea y motivo, nombrando el extremo que falla', () => {
    // H6: el motivo de la abreviada rota nombra el extremo que falla, como promete el título de la
    // prueba. `a.md` tiene 2 líneas, así que la 9 queda FUERA DE RANGO por el extremo inicial.
    expect(texto).toContain('doc.md, línea 1: ' + abreviada(9) + ' — abreviada rota (atribuida a a.md): extremo inicial fuera de rango (línea 9 de a.md)')
    expect(texto).toContain('doc.md, línea 5: ' + cita('a.md', 7) + ' — extremo inicial fuera de rango (línea 7 de a.md)')
  })

  it('declara lo que no comprueba, por qué las abreviadas no bloquean y las dos salidas, sin --no-verify', () => {
    expect(texto).toContain('NO comprueba que la línea diga lo que la frase afirma')
    expect(texto).toContain('su referente lo decide quien lee el contexto, no la sintaxis')
    expect(texto).toContain('reparar la cita, o añadirla a mano a la línea base')
    expect(texto).toContain('si el ancla va en la línea siguiente, júntala con su cita')
    expect(texto).not.toContain('--no-verify')
  })
})
