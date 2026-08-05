import { describe, it, expect } from 'vitest'
import { perfilChecklist, PERFILES_CHECKLIST, ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA, urlSegura } from './remision'

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
  })
})
