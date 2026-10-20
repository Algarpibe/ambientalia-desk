import { describe, expect, it } from 'vitest'
import {
  cargosHabilitados, contarRetrabajos, erroresContenidoControlCalidad, esFirmaControlCalidad, exigeGasPatron, intervino,
  mensajeSinFirma, motivoQuitadaPorInterruptor, prioridadTrasRechazo, quedaHabilitadoLibre, veredictoFirma, visibleConControlCalidad,
  type ContextoFirma, type FilaDeTraza, type UsuarioParaFirma,
} from './controlCalidad'
import { CLAVE_GAS_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC, ID_APROBACION_CC, ID_ENVIO_CC, ID_RECHAZO_CC } from './camposControlCalidad'

// Ids reales de los catálogos: Operativo, Decisional, Compras / Logístico y Administrativo (`tipoEvento.test.ts:12-26`).
const OPERATIVA = 'ingreso_a_servicio'
const DECISIONAL = 'escalado_a_revision'
const COMPRAS = 'solicitud_repuestos'
const ADMINISTRATIVA = 'facturado'

const u = (id: string, cargoPermiso: UsuarioParaFirma['cargoPermiso'], isAdmin = false): UsuarioParaFirma => ({ id, name: `Persona ${id}`, isAdmin, cargoPermiso })
const fila = (transitionId: string | null, performedById: string | null, performedBy: string | null = null): FilaDeTraza => ({ transitionId, performedById, performedBy })
const ctx = (usuariosActivos: UsuarioParaFirma[], extra: Partial<ContextoFirma> = {}): ContextoFirma => ({ usuariosActivos, derivadoA: null, traza: [], ...extra })

const COORD = u('c1', 'Coordinador Técnico')
const ESPEC = u('e1', 'Especialista técnico')
const DIRECTOR = u('d1', 'Director Técnico')
const TECNICO = u('t1', 'Técnico')
const ADMIN = u('a1', null, true)

describe('RQ-PM-33 · habilitados', () => {
  it('con un Coordinador activo, sólo el Coordinador', () => {
    expect(cargosHabilitados([COORD, ESPEC, DIRECTOR])).toEqual(['Coordinador Técnico'])
  })
  it('vacante: Director Técnico y Especialista técnico, nunca un Técnico', () => {
    expect(cargosHabilitados([ESPEC, DIRECTOR, TECNICO])).toEqual(['Director Técnico', 'Especialista técnico'])
    expect(veredictoFirma(TECNICO, ctx([ESPEC, DIRECTOR, TECNICO]))).toMatchObject({ puede: false, causa: 'no_habilitado' })
    expect(veredictoFirma(ESPEC, ctx([ESPEC, DIRECTOR, TECNICO]))).toEqual({ puede: true, via: 'habilitado' })
  })
  it('la vacante se mide sobre los activos: sin Coordinador activo firma el Especialista', () => {
    // `usuariosActivos` sólo trae activos; un Coordinador inactivo ni aparece y no cuenta como ocupante.
    expect(cargosHabilitados([ESPEC])).toEqual(['Director Técnico', 'Especialista técnico'])
    expect(veredictoFirma(ESPEC, ctx([ESPEC]))).toEqual({ puede: true, via: 'habilitado' })
  })
  it('con Coordinador activo ni el Especialista ni el Director firman', () => {
    for (const p of [ESPEC, DIRECTOR]) expect(veredictoFirma(p, ctx([COORD, p]))).toMatchObject({ puede: false, causa: 'no_habilitado', cargos: ['Coordinador Técnico'] })
  })
  it('un Técnico nunca firma', () => {
    expect(veredictoFirma(TECNICO, ctx([TECNICO]))).toMatchObject({ puede: false, causa: 'no_habilitado' })
    expect(veredictoFirma(TECNICO, ctx([COORD, TECNICO]))).toMatchObject({ puede: false, causa: 'no_habilitado' })
  })
  it('firma el Coordinador que no intervino', () => {
    expect(veredictoFirma(COORD, ctx([COORD]))).toEqual({ puede: true, via: 'habilitado' })
  })
  it('se decide por id contra los activos, no por el cargo de la sesión', () => {
    expect(veredictoFirma({ id: 'x9', name: 'Otro', isAdmin: false }, ctx([COORD]))).toMatchObject({ puede: false, causa: 'no_habilitado' })
  })
})

describe('RQ-PM-33 · quién intervino', () => {
  it('el técnico asignado (derivado_a) intervino', () => {
    expect(intervino(COORD, { derivadoA: 'c1', traza: [] })).toBe(true)
    expect(veredictoFirma(COORD, ctx([COORD], { derivadoA: 'c1' }))).toMatchObject({ puede: false, causa: 'intervino' })
  })
  it('el autor de una fila Operativa intervino', () => {
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, 'c1')] })).toBe(true)
    expect(veredictoFirma(COORD, ctx([COORD], { traza: [fila(ID_ENVIO_CC, 'c1')] }))).toMatchObject({ puede: false, causa: 'intervino' })
  })
  it('Decisional, Compras / Logístico, Administrativo, la creación y un id desconocido NO son intervención', () => {
    for (const id of [DECISIONAL, COMPRAS, ADMINISTRATIVA, null, 'no_existe']) {
      expect(intervino(COORD, { derivadoA: null, traza: [fila(id, 'c1')] })).toBe(false)
    }
    expect(veredictoFirma(COORD, ctx([COORD], { traza: [fila(DECISIONAL, 'c1'), fila(COMPRAS, 'c1')] }))).toEqual({ puede: true, via: 'habilitado' })
  })
  it('fila con id: se compara por id aunque el nombre coincida o no', () => {
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, 'otro', COORD.name)] })).toBe(false)
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, 'c1', 'Nombre viejo')] })).toBe(true)
  })
  it('fila sin id: se compara por nombre exacto; un homónimo bloquea', () => {
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, null, COORD.name)] })).toBe(true)
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, null, 'persona c1')] })).toBe(false)
    expect(intervino(COORD, { derivadoA: null, traza: [fila(OPERATIVA, null, null)] })).toBe(false)
  })
})

describe('RQ-PM-34 · el administrador firma de respaldo', () => {
  it('sin habilitado libre y sin haber intervenido, firma como administrador', () => {
    const c = ctx([COORD, ADMIN], { traza: [fila(OPERATIVA, 'c1')] })
    expect(quedaHabilitadoLibre(c)).toBe(false)
    expect(veredictoFirma(ADMIN, c)).toEqual({ puede: true, via: 'administrador' })
  })
  it('con otro habilitado libre, el administrador no firma', () => {
    const c = ctx([COORD, ADMIN])
    expect(quedaHabilitadoLibre(c)).toBe(true)
    expect(veredictoFirma(ADMIN, c)).toMatchObject({ puede: false, causa: 'habilitado_libre' })
  })
  it('si el administrador intervino, no firma', () => {
    const c = ctx([COORD, ADMIN], { traza: [fila(OPERATIVA, 'c1'), fila(OPERATIVA, 'a1')] })
    expect(veredictoFirma(ADMIN, c)).toMatchObject({ puede: false, causa: 'intervino' })
  })
  it('un administrador habilitado que no intervino firma como habilitado', () => {
    const adminCoord = u('ac', 'Coordinador Técnico', true)
    expect(veredictoFirma(adminCoord, ctx([adminCoord]))).toEqual({ puede: true, via: 'habilitado' })
  })
  it('sin ningún habilitado activo, el administrador firma', () => {
    expect(veredictoFirma(ADMIN, ctx([TECNICO, ADMIN]))).toEqual({ puede: true, via: 'administrador' })
  })
  it('quedaHabilitadoLibre ignora al habilitado que intervino por derivado_a', () => {
    expect(quedaHabilitadoLibre(ctx([COORD], { derivadoA: 'c1' }))).toBe(false)
  })
})

describe('mensajeSinFirma', () => {
  it('nombra la transición y distingue las tres causas', () => {
    const m = (v: Parameters<typeof mensajeSinFirma>[1]) => mensajeSinFirma('aprobación de control de calidad', v)
    const a = m({ puede: false, causa: 'no_habilitado', cargos: ['Coordinador Técnico'] })
    const b = m({ puede: false, causa: 'intervino', cargos: [] })
    const c = m({ puede: false, causa: 'habilitado_libre', cargos: [] })
    for (const t of [a, b, c]) expect(t).toContain('aprobación de control de calidad')
    expect(a).toContain('Coordinador Técnico')
    expect(new Set([a, b, c]).size).toBe(3)
  })
})

describe('esFirmaControlCalidad', () => {
  it('sólo las dos de firma, no el envío', () => {
    expect(esFirmaControlCalidad(ID_APROBACION_CC)).toBe(true)
    expect(esFirmaControlCalidad(ID_RECHAZO_CC)).toBe(true)
    expect(esFirmaControlCalidad(ID_ENVIO_CC)).toBe(false)
    expect(esFirmaControlCalidad('finalizacion_servicio')).toBe(false)
  })
})

describe('RQ-TS-48 · gas patrón', () => {
  const hoy = '2026-10-20'
  const vigente = [{ compuesto: 'CO', disponible: true, vence: '2026-12-31' }]
  it('sin patrón vigente (o sin equipo, o compuesto no reconocido) no se exige', () => {
    expect(exigeGasPatron(ID_APROBACION_CC, 'CO', [], hoy)).toBe(false)
    expect(exigeGasPatron(ID_APROBACION_CC, 'CO', [{ compuesto: 'CO', disponible: true, vence: '2026-01-01' }], hoy)).toBe(false)
    expect(exigeGasPatron(ID_APROBACION_CC, null, vigente, hoy)).toBe(false)
    expect(exigeGasPatron(ID_APROBACION_CC, 'xyz', vigente, hoy)).toBe(false)
  })
  it('con patrón vigente del compuesto del equipo se exige, sólo en la aprobación', () => {
    expect(exigeGasPatron(ID_APROBACION_CC, 'CO', vigente, hoy)).toBe(true)
    expect(exigeGasPatron(ID_RECHAZO_CC, 'CO', vigente, hoy)).toBe(false)
    expect(exigeGasPatron(ID_ENVIO_CC, 'CO', vigente, hoy)).toBe(false)
  })
})

describe('RQ-TS-48 · errores de contenido', () => {
  const ok = { [CLAVE_GAS_CC]: true }
  it('la aprobación con gas exigido y sin marcar da un error', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: {}, via: 'habilitado', gasExigido: true })).toHaveLength(1)
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: ok, via: 'habilitado', gasExigido: true })).toEqual([])
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: {}, via: 'habilitado', gasExigido: false })).toEqual([])
  })
  it('el administrador de respaldo sin motivo (vacío o espacios) da error; con motivo no', () => {
    for (const v of [undefined, '', '   \t']) {
      expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: { [CLAVE_MOTIVO_FIRMA_ADMIN]: v }, via: 'administrador', gasExigido: false })).toHaveLength(1)
    }
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: { [CLAVE_MOTIVO_FIRMA_ADMIN]: ' porque sí ' }, via: 'administrador', gasExigido: false })).toEqual([])
  })
  it('un habilitado no necesita el motivo del administrador', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: {}, via: 'habilitado', gasExigido: false })).toEqual([])
  })
  it('los errores van juntos', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_APROBACION_CC, values: {}, via: 'administrador', gasExigido: true })).toHaveLength(2)
  })
  it('el rechazo con «Motivo del rechazo» de sólo espacios da error; el del administrador no cuenta en el rechazo', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_RECHAZO_CC, values: { [CLAVE_MOTIVO_RECHAZO_CC]: '   ' }, via: 'habilitado', gasExigido: false })).toHaveLength(1)
    expect(erroresContenidoControlCalidad({ transitionId: ID_RECHAZO_CC, values: { [CLAVE_MOTIVO_RECHAZO_CC]: 'mal sellado' }, via: 'administrador', gasExigido: false })).toEqual([])
    // el motivo ausente ya lo da el obligatorio de `transitionExec.ts:76-77`: aquí no se duplica
    expect(erroresContenidoControlCalidad({ transitionId: ID_RECHAZO_CC, values: {}, via: 'habilitado', gasExigido: false })).toEqual([])
  })
  it('el rechazo no exige gas', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_RECHAZO_CC, values: { [CLAVE_MOTIVO_RECHAZO_CC]: 'x' }, via: 'habilitado', gasExigido: true })).toEqual([])
  })
  it('fuera de las dos de firma no hay errores', () => {
    expect(erroresContenidoControlCalidad({ transitionId: ID_ENVIO_CC, values: {}, via: null, gasExigido: true })).toEqual([])
  })
})

describe('RQ-TS-49 · prioridad tras el rechazo', () => {
  it('el rechazo sube a High salvo que ya sea Urgent (S-10)', () => {
    for (const p of [null, 'Low', 'Medium', 'High', 'otra']) expect(prioridadTrasRechazo(ID_RECHAZO_CC, p)).toBe('High')
    expect(prioridadTrasRechazo(ID_RECHAZO_CC, 'Urgent')).toBeNull()
  })
  it('fuera del rechazo no toca la prioridad', () => {
    for (const id of [ID_APROBACION_CC, ID_ENVIO_CC, 'finalizacion_servicio']) expect(prioridadTrasRechazo(id, 'Low')).toBeNull()
  })
})

describe('RQ-TZ-24 · contarRetrabajos', () => {
  it('cuenta sólo los rechazos', () => {
    const traza = [ID_ENVIO_CC, ID_RECHAZO_CC, ID_ENVIO_CC, ID_RECHAZO_CC, ID_APROBACION_CC].map((transitionId) => ({ transitionId }))
    expect(contarRetrabajos(traza)).toBe(2)
  })
  it('traza vacía, sin rechazos o con ids nulos o ausentes: 0 y no lanza', () => {
    expect(contarRetrabajos([])).toBe(0)
    expect(contarRetrabajos([{ transitionId: ID_ENVIO_CC }, { transitionId: ID_APROBACION_CC }])).toBe(0)
    expect(contarRetrabajos([{ transitionId: null }, {}, { transitionId: undefined }])).toBe(0)
  })
})

describe('RQ-PM-37 · visibilidad según el interruptor', () => {
  it('el envío sólo se ve con el interruptor; finalizacion_servicio sólo sin él; las demás siempre', () => {
    expect(visibleConControlCalidad(ID_ENVIO_CC, false)).toBe(false)
    expect(visibleConControlCalidad(ID_ENVIO_CC, true)).toBe(true)
    expect(visibleConControlCalidad('finalizacion_servicio', false)).toBe(true)
    expect(visibleConControlCalidad('finalizacion_servicio', true)).toBe(false)
    for (const id of [ID_APROBACION_CC, ID_RECHAZO_CC, 'facturar']) for (const a of [false, true]) expect(visibleConControlCalidad(id, a)).toBe(true)
  })
  it('motivoQuitadaPorInterruptor da texto cuando la quita y null cuando no', () => {
    expect(motivoQuitadaPorInterruptor(ID_ENVIO_CC, false)).toEqual(expect.any(String))
    expect(motivoQuitadaPorInterruptor('finalizacion_servicio', true)).toEqual(expect.any(String))
    expect(motivoQuitadaPorInterruptor(ID_ENVIO_CC, true)).toBeNull()
    expect(motivoQuitadaPorInterruptor('facturar', true)).toBeNull()
  })
})
