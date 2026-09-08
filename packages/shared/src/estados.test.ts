import { describe, it, expect } from 'vitest'
import {
  CLASIFICACION_EN_ESPERA, ESTADOS, ESTADOS_EN_ESPERA, enEsperaDe, type EnEspera,
} from './estados'
import { STATUS_OV_ASIGNADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA } from './transitions'

/**
 * El registro de estados. La prueba de coherencia contra el grafo —la condición innegociable de
 * §1.3— vive en `invariantesGrafo.test.ts` junto a los otros seis invariantes; aquí se fija la
 * CLASIFICACIÓN, que es decisión de Gerencia y no se deriva de nada.
 */
describe('registro de estados', () => {
  it('declara 21 estados, sin repetidos', () => {
    expect(ESTADOS).toHaveLength(21)
    expect(new Set(ESTADOS).size).toBe(21)
  })

  /**
   * Se afirman los CONJUNTOS y no los números por lo mismo que en el invariante de las compartidas:
   * mover `Solicitado` de interna a externa deja las cuentas 3/5/12/1 intactas y cambia lo que la
   * vista promete al usuario. Con la lista escrita, ese movimiento da rojo.
   */
  it('externa son exactamente estos tres: el tercero es quien no somos nosotros', () => {
    expect(estadosCon('externa')).toEqual([
      'En Espera de Repuestos',
      'Servicio externo',
      'Notificación cliente',
    ])
  })

  it('interna son exactamente estos cinco: espera un acto de otra área de la casa', () => {
    expect(estadosCon('interna')).toEqual([
      'Notificación a Compras',
      'Notificación Comercial',
      'En espera de SKU inventario',
      'Solicitado',
      'Liberación Comercial',
    ])
  })

  it('ninguna son exactamente estos doce: el ticket está en manos de quien lo tiene', () => {
    expect(estadosCon('ninguna')).toEqual([
      'Ingresado',
      'Rev./Diagnostico',
      'Notificado',
      'En Proceso',
      'Continuación del proceso',
      'Por Facturar',
      'Por Entregar',
      'Por Entregar / Sin facturar',
      'Finalizado',
      STATUS_OV_ASIGNADA,
      STATUS_TICKET_CREADO,
      STATUS_REMISION_CREADA,
    ])
  })

  /**
   * `sin_clasificar` es VALOR VÁLIDO, no un hueco. `Pendiente` está pendiente de que Servicio Técnico
   * diga qué significa exactamente; hasta entonces se declara como lo que es. Un registro que
   * obligara a clasificarlo forzaría a inventar la respuesta, y la vista enseñaría una promesa que
   * nadie ha hecho.
   */
  it('sin_clasificar es valor válido, y hoy solo lo lleva Pendiente', () => {
    expect(estadosCon('sin_clasificar')).toEqual(['Pendiente'])
    expect(enEsperaDe('Pendiente')).toBe('sin_clasificar')
  })

  it('3 + 5 + 12 + 1 = 21, y no hay ningún estado fuera de las cuatro clases', () => {
    const total = estadosCon('externa').length + estadosCon('interna').length
      + estadosCon('ninguna').length + estadosCon('sin_clasificar').length
    expect(total).toBe(ESTADOS.length)
  })

  /**
   * Las OCHO de la vista son externa + interna. Es lo único que `ESTADOS_EN_ESPERA` significa: son
   * las que el tablero enseña bajo «En espera».
   *
   * ⚠️ El reloj del SLA NO lee esta lista. Para en los tres BODEGAJES de M1.10, que son periodos
   * entre fechas y no estados. Ver la tabla de los tres criterios en `estados.ts`.
   */
  it('las ocho en espera de la vista son externa + interna', () => {
    expect(ESTADOS_EN_ESPERA).toEqual([
      'En Espera de Repuestos',
      'Servicio externo',
      'Notificación cliente',
      'Notificación a Compras',
      'Notificación Comercial',
      'En espera de SKU inventario',
      'Solicitado',
      'Liberación Comercial',
    ])
  })

  it('enEsperaDe devuelve undefined para un estado que no existe', () => {
    expect(enEsperaDe('Estado inventado')).toBeUndefined()
  })

  /**
   * POR QUÉ EXISTE ESTE REGISTRO, en una sola prueba.
   *
   * La vista de «En espera» decide hoy con `/espera/i` sobre el nombre del estado
   * (`apps/desk/src/lib/boardView.ts:35`). De las OCHO que Gerencia declaró en espera, esa regex
   * reconoce DOS: las únicas que llevan la palabra dentro. Las otras seis —incluidas las tres
   * externas, que son las que de verdad no dependen de nosotros— quedan fuera de la vista.
   *
   * F0-04 NO lo corrige: esto documenta el defecto tal como está. Que la vista consuma el registro
   * es F1A. Si alguien arregla `boardView.ts` antes, esta prueba dará rojo y habrá que retirarla —
   * que es exactamente lo que tiene que pasar.
   */
  it('documenta el defecto: la regex del tablero solo reconoce 2 de las 8 en espera', () => {
    const comoDecideHoyElTablero = (estado: string) => /espera/i.test(estado)
    const reconocidas = ESTADOS_EN_ESPERA.filter(comoDecideHoyElTablero)
    expect(reconocidas).toEqual(['En Espera de Repuestos', 'En espera de SKU inventario'])
    // Y al revés: no se le cuela ningún estado que NO esté en espera. El defecto es por defecto, no
    // por exceso — la vista enseña de menos, no de más.
    const coladas = ESTADOS.filter((e) => comoDecideHoyElTablero(e) && !ESTADOS_EN_ESPERA.includes(e))
    expect(coladas).toEqual([])
  })
})

/** Los estados de una clase, en el orden en que están declarados en el registro. */
function estadosCon(clase: EnEspera): string[] {
  return ESTADOS.filter((e) => CLASIFICACION_EN_ESPERA[e] === clase)
}
