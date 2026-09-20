import { describe, it, expect } from 'vitest'
import { ejecutar } from './cli'
import { repoGitTemporal, cita, type RepoGitDePrueba } from '../testing/reposDePrueba'

/**
 * Pruebas del CLI para la activación de la cabecera R-1 (capacidad `citas-verificables`, F0-05 R1
 * «el contrato»). Repositorios git temporales y aislados, como `hook.test.ts` (§8 del diseño).
 */
const SALTO = String.fromCharCode(10)
const CEROS = '0'.repeat(40)

function push(r: RepoGitDePrueba, local: string, remoto: string, ref = 'refs/heads/main') {
  const texto = `${ref} ${local} ${ref} ${remoto}${SALTO}`
  return ejecutar({ argv: [], entrada: () => texto, cwd: r.dir, env: r.env })
}

describe('cli · D2 y RQ-CV-20: el alcance de cabeceras incluye openspec/changes/archive/ (R1.3.1, R1.3.2)', () => {
  it('un proposal.md ARCHIVADO sin cabecera sale en la cifra de cabeceras R-1 inválidas', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'openspec/changes/archive/2020-01-01-viejo/proposal.md': '# Propuesta vieja, sin cabecera' + SALTO,
      })
      const local = r.commit('archivado sin cabecera')
      const { texto, codigo } = push(r, local, CEROS)
      expect(texto).toMatch(/cabeceras R-1 inválidas \.+ 1/)
      expect(codigo).toBe(1)
    } finally {
      r.borrar()
    }
  })
})

describe('cli · M4, regla de mutación 1 (posición): cita rota y cabecera inválida en el MISMO push se nombran las DOS (R1.3.5)', () => {
  it('el mensaje declara la cita bloqueante y la cabecera inválida a la vez, y el código sale 1', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'citado.md': 'una línea',
        'doc.md': `Ver ${cita('citado.md', 5)}.`,
        'openspec/changes/archive/2020-01-01-viejo/proposal.md': '# Propuesta vieja, sin cabecera' + SALTO,
      })
      const local = r.commit('cita rota + cabecera inválida a la vez')
      const { texto, codigo } = push(r, local, CEROS)
      expect(texto).toMatch(/cabeceras R-1 inválidas \.+ 1/)
      expect(texto).toContain('doc.md, línea 1: ' + cita('citado.md', 5))
      expect(codigo).toBe(1)
    } finally {
      r.borrar()
    }
  })
})
