import { describe, it, expect } from 'vitest'
import { transicionPorId, CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION, CLAVE_TEXTO_AUTORIZACION } from '@ambientalia/shared'
import { buildTransitionPlan } from './transitionExec'

/** Añadido por la verificación de F1C-05: el enrutado con el catálogo REAL (las pruebas del lote 1 usan uno sintético). */
describe('liberacion_sin_factura · el plan con el catálogo real', () => {
  it('motivo y fecha a columnas y el texto de la autorización a customFields, sin casilla', () => {
    const t = transicionPorId('liberacion_sin_factura')!
    const plan = buildTransitionPlan(t, { comment: 'x', [CLAVE_MOTIVO_LIBERACION]: 'm', [CLAVE_FECHA_PREVISTA_FACTURACION]: '2026-10-10', [CLAVE_TEXTO_AUTORIZACION]: 't' })
    expect(plan.errors).toEqual([])
    expect(plan.columns).toEqual({ liberacion_motivo: 'm', fecha_prevista_facturacion: '2026-10-10' })
    expect(plan.customFields).toEqual({ [CLAVE_TEXTO_AUTORIZACION]: 't' })
  })
})
