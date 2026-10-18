import { describe, it, expect } from 'vitest'
import {
  ESTADO_ANULADO, CLAVE_MOTIVO_ANULACION, CLAVE_DETALLE_ANULACION, MOTIVOS_ANULACION, MOTIVO_QUE_EXIGE_DETALLE,
  camposAnulacion, erroresAnulacion, esAnulado,
} from './anulacion'
import { ESTADOS, ESTADOS_SERVICIO, ESTADOS_EN_ESPERA, ESTADOS_SIN_SALIDA, enEsperaDe } from './estados'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, type Transition } from './transitions'
import { transicionPorId, flujoDeTransicion } from './flujos'
import { canExecuteTransition } from './permissions'

/**
 * anulado-con-motivo (F1C-01), lote 1 · los motivos, la guarda de contenido y las tres transiciones de `Anulación`.
 *
 * La guarda se activa por el CAMPO y no por el id (diseño D1, D4 de F1C-05): se prueba sobre una transición SINTÉTICA y
 * sobre las tres reales. La lista es la de `R08.4.md:2139-2144`; «Creado por error» y «duplicado» no son motivos
 * (`R08.4.md:2145`: se borran).
 */
const M1 = 'El cliente no aprueba o se echa atrás'
const M2 = 'Sin solución técnica'
const M3 = 'Repuesto no disponible'
const M4 = 'Caducidad de espera: el cliente no responde ni retira el equipo'
const M5 = 'Otro'

const M_LISTA = `El motivo debe ser uno de: ${M1} · ${M2} · ${M3} · ${M4} · ${M5}`
const M_DETALLE = 'Falta el detalle del motivo: es obligatorio con el motivo «Otro»'

const sintetica: Pick<Transition, 'fields'> = {
  fields: [
    { key: 'comment', label: 'Comentario', kind: 'comment', required: false, target: 'comment' },
    { key: CLAVE_MOTIVO_ANULACION, label: 'Motivo', kind: 'select', required: true, target: 'customField', options: [M1, M2, M3, M4, M5] },
    { key: CLAVE_DETALLE_ANULACION, label: 'Detalle', kind: 'text', required: false, target: 'customField' },
  ],
}
const sinCampo: Pick<Transition, 'fields'> = { fields: sintetica.fields.filter((f) => f.key === 'comment') }
const v = (motivo: unknown, detalle?: unknown) => ({ [CLAVE_MOTIVO_ANULACION]: motivo, [CLAVE_DETALLE_ANULACION]: detalle })

describe('las constantes y la lista de motivos', () => {
  it('son las del diseño D1, letra por letra', () => {
    expect(ESTADO_ANULADO).toBe('Anulado')
    expect(CLAVE_MOTIVO_ANULACION).toBe('Motivo de anulación')
    expect(CLAVE_DETALLE_ANULACION).toBe('Detalle del motivo de anulación')
    expect(MOTIVO_QUE_EXIGE_DETALLE).toBe('Otro')
  })
  it('hay exactamente cinco motivos, en el orden del maestro (R08.4.md:2139-2144)', () => {
    expect([...MOTIVOS_ANULACION]).toEqual([M1, M2, M3, M4, M5])
  })
  it('«Creado por error» y «duplicado» no son motivos: se borran, no se anulan (R08.4.md:2145)', () => {
    const todos = MOTIVOS_ANULACION.map((m) => m.toLowerCase()).join('|')
    expect(todos).not.toContain('creado por error')
    expect(todos).not.toContain('duplicado')
  })
  it('«Otro» va el último: el arnés de pruebas toma options[0] y no debe caer en el que exige detalle', () => {
    expect(MOTIVOS_ANULACION[MOTIVOS_ANULACION.length - 1]).toBe(MOTIVO_QUE_EXIGE_DETALLE)
    expect(MOTIVOS_ANULACION[0]).not.toBe(MOTIVO_QUE_EXIGE_DETALLE)
  })
})

describe('camposAnulacion', () => {
  it('devuelve el motivo (select, obligatorio, customField, con las cinco options) y el detalle (texto, no obligatorio)', () => {
    const [motivo, detalle, ...resto] = camposAnulacion()
    expect(resto).toEqual([])
    expect(motivo).toMatchObject({ key: CLAVE_MOTIVO_ANULACION, kind: 'select', required: true, target: 'customField' })
    expect(motivo.options).toEqual([...MOTIVOS_ANULACION])
    expect(detalle).toMatchObject({ key: CLAVE_DETALLE_ANULACION, kind: 'text', required: false, target: 'customField' })
  })
  it('cada llamada da campos nuevos: mutar uno no contamina a las otras transiciones', () => {
    expect(camposAnulacion()[0]).not.toBe(camposAnulacion()[0])
    expect(camposAnulacion()[0].options).not.toBe(camposAnulacion()[0].options)
  })
})

describe('erroresAnulacion · el motivo', () => {
  it('un motivo fuera de la lista da el error de lista, con las cinco opciones unidas por « · »', () => {
    expect(erroresAnulacion(sintetica, v('Creado por error'))).toEqual([M_LISTA])
  })
  it('la igualdad es exacta: mayúsculas y espacios sobrantes se rechazan', () => {
    expect(erroresAnulacion(sintetica, v(M2.toUpperCase()))).toEqual([M_LISTA])
    expect(erroresAnulacion(sintetica, v(M2 + ' '))).toEqual([M_LISTA])
  })
  it('un motivo que no es cadena se rechaza', () => {
    expect(erroresAnulacion(sintetica, v(5))).toEqual([M_LISTA])
    expect(erroresAnulacion(sintetica, v(['Otro']))).toEqual([M_LISTA])
  })
  it.each([M1, M2, M3, M4])('el motivo «%s» pasa sin detalle', (motivo) => {
    expect(erroresAnulacion(sintetica, v(motivo))).toEqual([])
  })
  it('la PRESENCIA no es suya: un motivo ausente o vacío no da error aquí (lo dice buildTransitionPlan)', () => {
    expect(erroresAnulacion(sintetica, {})).toEqual([])
    expect(erroresAnulacion(sintetica, v(''))).toEqual([])
    expect(erroresAnulacion(sintetica, v(null))).toEqual([])
    expect(erroresAnulacion(sintetica, v(undefined))).toEqual([])
  })
})

describe('erroresAnulacion · el detalle de «Otro» (S-6)', () => {
  it.each([['ausente', undefined], ['vacío', ''], ['de sólo espacios', '   '], ['que no es cadena', 7]])('«Otro» con detalle %s da el error del detalle', (_n, detalle) => {
    expect(erroresAnulacion(sintetica, v(M5, detalle))).toEqual([M_DETALLE])
  })
  it('«Otro» con un detalle de texto pasa', () => {
    expect(erroresAnulacion(sintetica, v(M5, 'El cliente se mudó'))).toEqual([])
  })
  it('otro motivo no exige detalle aunque venga vacío', () => {
    expect(erroresAnulacion(sintetica, v(M3, ''))).toEqual([])
  })
})

describe('erroresAnulacion · se activa por el CAMPO, no por el id', () => {
  it('una transición sin el campo del motivo no da ningún error, sea cual sea el valor', () => {
    expect(erroresAnulacion(sinCampo, v('Creado por error'))).toEqual([])
    expect(erroresAnulacion(sinCampo, v(M5))).toEqual([])
  })
  it('los valores que no son objeto no revientan', () => {
    expect(erroresAnulacion(sintetica, null)).toEqual([])
    expect(erroresAnulacion(sintetica, undefined)).toEqual([])
    expect(erroresAnulacion(sintetica, 'texto')).toEqual([])
  })
  it('la lista de errores sale de las options del propio campo, no de una copia', () => {
    const otraLista: Pick<Transition, 'fields'> = { fields: [{ ...sintetica.fields[1], options: ['A', 'B'] }] }
    expect(erroresAnulacion(otraLista, v(M1))).toEqual(['El motivo debe ser uno de: A · B'])
  })
})

describe('esAnulado', () => {
  it('es la igualdad con «Anulado»', () => {
    expect(esAnulado('Anulado')).toBe(true)
    expect(esAnulado('anulado')).toBe(false)
    expect(esAnulado('Finalizado')).toBe(false)
    expect(esAnulado('')).toBe(false)
  })
})

describe('el estado «Anulado»', () => {
  it('está registrado con clase «ninguna»: no es una espera', () => {
    expect(enEsperaDe('Anulado')).toBe('ninguna')
    expect(ESTADOS).toContain('Anulado')
    expect(ESTADOS_EN_ESPERA).not.toContain('Anulado')
  })
  it('es de servicio y va el último de ESTADOS_SERVICIO; no entra en ESTADOS_SIN_SALIDA (S-4)', () => {
    expect(ESTADOS_SERVICIO[ESTADOS_SERVICIO.length - 1]).toBe('Anulado')
    expect(ESTADOS_SIN_SALIDA).not.toContain('Anulado')
  })
  it('es terminal: ninguna transición de ningún catálogo sale de él', () => {
    const todas = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO]
    expect(todas.filter((t) => t.from.includes('Anulado'))).toEqual([])
    expect(todas.filter((t) => t.to === 'Anulado').map((t) => t.id).sort()).toEqual(['anulacion', 'anulacion_equipo_nuevo', 'anulacion_soporte'])
  })
})

describe('las tres transiciones reales (D3)', () => {
  const casos: [string, string, readonly Transition[], string[]][] = [
    ['servicio', 'anulacion', TRANSITIONS, ['En Espera de Repuestos', 'Servicio externo', 'Rev./Diagnostico', 'Notificación Comercial', 'Notificación cliente']],
    ['equipo-nuevo', 'anulacion_equipo_nuevo', TRANSITIONS_EQUIPO_NUEVO, ['Ingresado', 'En Proceso', 'Notificado', 'Verificación']],
    ['soporte-remoto', 'anulacion_soporte', TRANSITIONS_SOPORTE_REMOTO, ['En Proceso', 'Pendiente']],
  ]
  it.each(casos)('flujo %s · %s está en su catálogo, a Anulado, área Comercial, con los orígenes exactos', (flujo, id, catalogo, origenes) => {
    const t = catalogo.find((x) => x.id === id)!
    expect(t).toBeDefined()
    expect(t.name).toBe('Anulación')
    expect(t.to).toBe('Anulado')
    expect(t.area).toBe('Comercial')
    expect([...t.from]).toEqual(origenes)
    expect(flujoDeTransicion(id)).toBe(flujo)
    expect(transicionPorId(id)).toBe(t)
  })
  it.each(casos)('flujo %s · %s lleva comment, el motivo obligatorio con las cinco options y el detalle; no declara derivación', (flujo, id, catalogo) => {
    const t = catalogo.find((x) => x.id === id)!
    expect(t.fields[0]).toMatchObject({ kind: 'comment', target: 'comment' })
    const motivo = t.fields.find((f) => f.key === CLAVE_MOTIVO_ANULACION)!
    expect(motivo).toMatchObject({ kind: 'select', required: true, target: 'customField' })
    expect(motivo.options).toEqual([...MOTIVOS_ANULACION])
    expect(t.fields.find((f) => f.key === CLAVE_DETALLE_ANULACION)).toMatchObject({ kind: 'text', required: false })
    // El catálogo de servicio añade «Derivado a» a TODA transición (`transitions.ts:297`); los otros dos no la declaran.
    expect(t.fields.filter((f) => f.target === 'derivacion')).toHaveLength(flujo === 'servicio' ? 1 : 0)
    expect(t.fields.filter((f) => f.target !== 'derivacion')).toHaveLength(3)
  })
  it.each(casos)('flujo %s · %s la ejecuta Comercial y no Servicio Técnico', (_f, id) => {
    const t = transicionPorId(id)!
    expect(canExecuteTransition(['Comercial'], false, t.area)).toBe(true)
    expect(canExecuteTransition(['Servicio Técnico'], false, t.area)).toBe(false)
  })
  it('Solicitado y En espera de SKU inventario no se anulan (c3); Solicitud Soporte tampoco (S-3)', () => {
    expect(TRANSITIONS.find((x) => x.id === 'anulacion')!.from).not.toContain('Solicitado')
    expect(TRANSITIONS.find((x) => x.id === 'anulacion')!.from).not.toContain('En espera de SKU inventario')
    expect(TRANSITIONS_SOPORTE_REMOTO.find((x) => x.id === 'anulacion_soporte')!.from).not.toContain('Solicitud Soporte')
  })
})
