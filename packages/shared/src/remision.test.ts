import { describe, it, expect } from 'vitest'
import { perfilChecklist, PERFILES_CHECKLIST, ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura, faltaFotoPorNovedad, esRemisionEntradaVigente, motivoSinRemisionVigente, esRemisionConfirmada } from './remision'

describe('perfilChecklist', () => {
  it('resuelve por MODELO antes que por marca (igual que el Switch del flujo)', () => {
    expect(perfilChecklist('Grimm', 'EDM 280')).toBe('grimm_edm280')
    expect(perfilChecklist('Grimm', 'EDM180')).toBe('grimm_edm180')
    expect(perfilChecklist('Grimm', 'EDM180C')).toBe('grimm_edm180') // "contiene", no "igual"
  })

  it('Horiba se parte por modelo: solo la serie AP tiene checklist propio', () => {
    expect(perfilChecklist('Horiba', 'APMA-370')).toBe('horiba_ap')
    expect(perfilChecklist('Horiba', 'APNA-370')).toBe('horiba_ap')
    expect(perfilChecklist('Horiba', 'OCMA-550')).toBe('otro')
    expect(perfilChecklist('Horiba', 'U-51')).toBe('otro')
  })

  it('resuelve las marcas con perfil propio', () => {
    expect(perfilChecklist('Environics', '6103')).toBe('environics')
    expect(perfilChecklist('Kunak', 'AIR')).toBe('kunak')
  })

  it('las marcas sin checklist propio caen en "otro"', () => {
    for (const m of ['Durag', 'TCA', 'Ambientalia']) expect(perfilChecklist(m, 'x')).toBe('otro')
  })

  // El Switch original NO define `fallbackOutput`: una marca desconocida se descartaba en silencio.
  // Aquí el fallback es explícito, que es justamente el agujero que se quería cerrar.
  it('una marca desconocida cae en "otro" en vez de perderse', () => {
    expect(perfilChecklist('Teledyne', '9110')).toBe('otro')
    expect(perfilChecklist(null, null)).toBe('otro')
    expect(perfilChecklist('', '')).toBe('otro')
  })

  it('no distingue mayúsculas ni espacios sobrantes', () => {
    expect(perfilChecklist('  grimm ', ' edm 280 ')).toBe('grimm_edm280')
    expect(perfilChecklist('HORIBA', 'apma-370')).toBe('horiba_ap')
    expect(perfilChecklist('environics', '6103')).toBe('environics')
  })

  it('todo perfil devuelto está en PERFILES_CHECKLIST', () => {
    const casos = [['Grimm', 'EDM 280'], ['Grimm', 'EDM180'], ['Horiba', 'APMA-370'], ['Horiba', 'U-51'],
      ['Environics', '6103'], ['Kunak', 'AIR'], ['Teledyne', '9110']] as const
    for (const [ma, mo] of casos) expect(PERFILES_CHECKLIST).toContain(perfilChecklist(ma, mo))
  })
})

describe('ETIQUETA_ESTADO_REMISION', () => {
  it('traduce los cuatro estados conocidos', () => {
    expect(ETIQUETA_ESTADO_REMISION.pendiente).toBe('Enviando…')
    expect(ETIQUETA_ESTADO_REMISION.ok).toBe('Creada')
    expect(ETIQUETA_ESTADO_REMISION.ok_con_avisos).toBe('Creada con avisos')
    expect(ETIQUETA_ESTADO_REMISION.error).toBe('Falló')
  })

  // La columna no tiene CHECK y `toRemision` castea sin validar: indexar este mapa TIENE que poder
  // fallar sin lanzar, o un estado inesperado tumbaría la pantalla entera.
  it('un estado desconocido no está en el mapa y tiene su valor por defecto', () => {
    expect(ETIQUETA_ESTADO_REMISION['inventado']).toBeUndefined()
    expect(ETIQUETA_ESTADO_REMISION_DESCONOCIDA).toBe('Estado desconocido')
  })
})

describe('urlSegura', () => {
  it('acepta https y rechaza todo lo demás', () => {
    expect(urlSegura('https://drive.google.com/x')).toBe('https://drive.google.com/x')
    expect(urlSegura('http://drive.google.com/x')).toBeNull()
    expect(urlSegura('javascript:alert(1)')).toBeNull()
    expect(urlSegura(null)).toBeNull()
    expect(urlSegura(undefined)).toBeNull()
    // Se interpola en `href="…"`: una comilla se saldría del atributo. La URL legítima la trae %22.
    expect(urlSegura('https://drive.google.com/x" onmouseover="alert(1)')).toBeNull()
  })
})

describe('faltaFotoPorNovedad', () => {
  // RQ-RE-18. El servidor (RQ-RE-08) y el formulario (RQ-RE-19) consumen esta MISMA función.
  it('bloquea solo cuando hay novedad declarada y cero fotos', () => {
    expect(faltaFotoPorNovedad(true, 0)).toBe(true)
    expect(faltaFotoPorNovedad(true, 1)).toBe(false)
    expect(faltaFotoPorNovedad(false, 0)).toBe(false)
    expect(faltaFotoPorNovedad(null, 0)).toBe(false)
  })
})

// RQ-TS-33 / RQ-RE-20. «Vigente» = remisión de ENTRADA, creada y NO anulada, sea cual sea su estado de
// envío (Gerencia, `docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`). El estado no entra: una `pendiente`
// o en `error` habilita igual. Regla de mutación 2: la tabla ensucia los datos vigilados (tipo × anulada × estado).
describe('esRemisionEntradaVigente: tipo × anulada × estado', () => {
  const ESTADOS: (string | undefined)[] = ['ok', 'ok_con_avisos', 'pendiente', 'error', 'zzz_desconocido', undefined]
  const fila = (tipo: string, anuladaAt: string | null, estado?: string) => ({ tipo, anuladaAt, ...(estado === undefined ? {} : { estado }) })

  it.each(ESTADOS)('entrada NO anulada cuenta con estado %s', (estado) => {
    expect(esRemisionEntradaVigente(fila('entrada', null, estado))).toBe(true)
  })

  it.each(ESTADOS)('entrada ANULADA no cuenta con estado %s', (estado) => {
    expect(esRemisionEntradaVigente(fila('entrada', '2026-10-01T10:00:00Z', estado))).toBe(false)
  })

  it.each(ESTADOS)('tipo distinto de entrada no cuenta con estado %s, anulada o no', (estado) => {
    expect(esRemisionEntradaVigente(fila('salida', null, estado))).toBe(false)
    expect(esRemisionEntradaVigente(fila('salida', '2026-10-01T10:00:00Z', estado))).toBe(false)
  })
})

describe('motivoSinRemisionVigente', () => {
  const TEXTO = 'No se puede habilitar el servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.'
  const ANULADA = '2026-10-01T10:00:00Z'

  it('lista vacía → el texto único', () => {
    expect(motivoSinRemisionVigente([])).toBe(TEXTO)
  })

  it('sólo anuladas → el texto', () => {
    expect(motivoSinRemisionVigente([{ tipo: 'entrada', anuladaAt: ANULADA }, { tipo: 'entrada', anuladaAt: ANULADA }])).toBe(TEXTO)
  })

  it('sólo de tipo distinto de entrada → el texto', () => {
    expect(motivoSinRemisionVigente([{ tipo: 'salida', anuladaAt: null }])).toBe(TEXTO)
  })

  it('con una vigente (aunque haya anuladas) → null', () => {
    expect(motivoSinRemisionVigente([{ tipo: 'entrada', anuladaAt: ANULADA }, { tipo: 'entrada', anuladaAt: null }])).toBeNull()
  })

  it('con una vigente pendiente o en error (el estado no entra) → null', () => {
    expect(motivoSinRemisionVigente([{ tipo: 'entrada', anuladaAt: null, estado: 'pendiente' } as never])).toBeNull()
    expect(motivoSinRemisionVigente([{ tipo: 'entrada', anuladaAt: null, estado: 'error' } as never])).toBeNull()
  })

  it('el texto es accionable y no menciona cliente, equipo ni provisional (P2 discrimina con un solo texto)', () => {
    expect(motivoSinRemisionVigente([])).not.toMatch(/cliente|equipo|provisional/i)
    expect(motivoSinRemisionVigente([])).toContain('Crea la remisión de entrada')
  })
})

describe('esRemisionConfirmada (RQ-TS-33: sólo presentación; ninguna guarda la llama)', () => {
  it.each([
    ['ok', true],
    ['ok_con_avisos', true],
    ['pendiente', false],
    ['error', false],
    ['algo_desconocido', false],
    ['', false],
  ])('estado %j → %s', (estado, esperado) => {
    expect(esRemisionConfirmada({ estado })).toBe(esperado)
  })
})
