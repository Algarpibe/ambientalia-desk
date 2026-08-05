import { describe, it, expect, vi } from 'vitest'
import { ejecutarEnvio, type EstadoEnvio, type PasosEnvio } from './envioRemision'

/** Pasos falsos con contadores; `avances` acumula lo que el componente guardaría en estado. */
function pasosFalsos(over: Partial<PasosEnvio> = {}) {
  const avances: EstadoEnvio[] = []
  const pasos: PasosEnvio = {
    crear: vi.fn(async () => 'rem-1'),
    subirFoto: vi.fn(async () => {}),
    enviar: vi.fn(async () => {}),
    onAvance: (e) => { avances.push(e) },
    ...over,
  }
  return { pasos, avances }
}

const NUEVO: EstadoEnvio = { remisionId: null, fotosSubidas: 0 }

describe('ejecutarEnvio', () => {
  it('flujo feliz: crea, sube todas las fotos en orden y envía', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio(NUEVO, 2, pasos)
    expect(pasos.crear).toHaveBeenCalledTimes(1)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(1, 'rem-1', 0)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(2, 'rem-1', 1)
    expect(pasos.enviar).toHaveBeenCalledWith('rem-1')
    expect(r).toEqual({ remisionId: 'rem-1', errorEnvio: null })
  })

  // El corazón del arreglo: con una remisión ya creada NO se crea otra.
  it('no vuelve a crear si el estado ya trae una remisión', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 0 }, 1, pasos)
    expect(pasos.crear).not.toHaveBeenCalled()
    expect(pasos.subirFoto).toHaveBeenCalledWith('rem-9', 0)
    expect(r.remisionId).toBe('rem-9')
  })

  it('reanuda las fotos desde donde se quedó, sin resubir las hechas', async () => {
    const { pasos } = pasosFalsos()
    await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 2 }, 4, pasos)
    expect(pasos.subirFoto).toHaveBeenCalledTimes(2)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(1, 'rem-9', 2)
    expect(pasos.subirFoto).toHaveBeenNthCalledWith(2, 'rem-9', 3)
  })

  // Sin esto el arreglo no sirve: el avance tiene que quedar registrado ANTES de propagar el fallo,
  // porque es lo único que permite que el reintento continúe en vez de empezar de cero.
  it('si una foto falla, propaga el error pero deja registrado lo ya subido', async () => {
    const { pasos, avances } = pasosFalsos({
      subirFoto: vi.fn(async (_id: string, i: number) => { if (i === 1) throw new Error('sin cobertura') }),
    })
    await expect(ejecutarEnvio(NUEVO, 3, pasos)).rejects.toThrow('sin cobertura')
    expect(avances.at(-1)).toEqual({ remisionId: 'rem-1', fotosSubidas: 1 })
    expect(pasos.enviar).not.toHaveBeenCalled()
  })

  it('omitirFotosPendientes salta las fotos que faltan y envía igual', async () => {
    const { pasos } = pasosFalsos()
    const r = await ejecutarEnvio({ remisionId: 'rem-9', fotosSubidas: 1 }, 3, pasos, { omitirFotosPendientes: true })
    expect(pasos.subirFoto).not.toHaveBeenCalled()
    expect(pasos.enviar).toHaveBeenCalledWith('rem-9')
    expect(r.errorEnvio).toBeNull()
  })

  // Un disparo fallido NO es un fallo del envío: la remisión existe y se reintenta desde el panel.
  it('un fallo de enviar no lanza: vuelve como errorEnvio', async () => {
    const { pasos } = pasosFalsos({ enviar: vi.fn(async () => { throw new Error('n8n caído') }) })
    const r = await ejecutarEnvio(NUEVO, 0, pasos)
    expect(r).toEqual({ remisionId: 'rem-1', errorEnvio: 'n8n caído' })
  })
})
