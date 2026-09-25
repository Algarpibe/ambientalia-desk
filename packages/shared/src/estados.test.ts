import { describe, it, expect } from 'vitest'
import {
  CLASIFICACION_EN_ESPERA, ESTADOS, ESTADOS_EN_ESPERA, ESTADOS_SIN_SALIDA, enEsperaDe, type EnEspera,
} from './estados'
import {
  TRANSITIONS, STATUS_OV_ASIGNADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA,
} from './transitions'

/**
 * El registro de estados. La prueba de coherencia contra el grafo —la condición innegociable de
 * §1.3— vive en `invariantesGrafo.test.ts` junto a los otros seis invariantes; aquí se fija la
 * CLASIFICACIÓN, que es decisión de Gerencia y no se deriva de nada.
 */
describe('registro de estados', () => {
  it('declara 22 estados, sin repetidos', () => {
    expect(ESTADOS).toHaveLength(22)
    expect(new Set(ESTADOS).size).toBe(22)
  })

  /**
   * Se afirman los CONJUNTOS y no los números por lo mismo que en el invariante de las compartidas:
   * mover `Solicitado` de interna a externa deja las cuentas 5/6/9/1 intactas y cambia lo que la
   * vista promete al usuario. Con la lista escrita, ese movimiento da rojo.
   */
  it('externa son exactamente estos cinco: el tercero es quien no somos nosotros', () => {
    expect(estadosCon('externa')).toEqual([
      'En Espera de Repuestos',
      'Servicio externo',
      'Notificación cliente',
      'Por Entregar',
      'Por Entregar / Sin facturar',
    ])
  })

  it('interna son exactamente estos seis: espera un acto de otra área de la casa', () => {
    expect(estadosCon('interna')).toEqual([
      'Notificación a Compras',
      'Notificación Comercial',
      'En espera de SKU inventario',
      'Solicitado',
      'Liberación Comercial',
      STATUS_REMISION_CREADA,
    ])
  })

  it('ninguna son exactamente estos nueve: el ticket está en manos de quien lo tiene', () => {
    expect(estadosCon('ninguna')).toEqual([
      'Ingresado',
      'Rev./Diagnostico',
      'Notificado',
      'En Proceso',
      'Continuación del proceso',
      'Por Facturar',
      'Finalizado',
      STATUS_OV_ASIGNADA,
      STATUS_TICKET_CREADO,
    ])
  })

  /**
   * `sin_clasificar` es VALOR VÁLIDO, no un hueco. `Pendiente` está pendiente de que Servicio Técnico
   * diga qué significa exactamente; hasta entonces se declara como lo que es. Un registro que
   * obligara a clasificarlo forzaría a inventar la respuesta, y la vista enseñaría una promesa que
   * nadie ha hecho.
   */
  it('sin_clasificar es valor válido, y hoy lo llevan Pendiente y Verificación', () => {
    expect(estadosCon('sin_clasificar')).toEqual(['Pendiente', 'Verificación'])
    expect(enEsperaDe('Pendiente')).toBe('sin_clasificar')
    expect(enEsperaDe('Verificación')).toBe('sin_clasificar')
  })

  it('5 + 6 + 9 + 2 = 22, y no hay ningún estado fuera de las cuatro clases', () => {
    const total = estadosCon('externa').length + estadosCon('interna').length
      + estadosCon('ninguna').length + estadosCon('sin_clasificar').length
    expect(total).toBe(ESTADOS.length)
  })

  /**
   * Las ONCE de la vista son externa + interna. Es lo único que `ESTADOS_EN_ESPERA` significa: son
   * las que el tablero enseña bajo «En espera».
   *
   * ⚠️ El reloj del SLA NO lee esta lista. Para en los tres BODEGAJES de M1.10, que son periodos
   * entre fechas y no estados. Ver la tabla de los tres criterios en `estados.ts`.
   *
   * El array se fija LEYENDO la salida real del filtro (`estados.ts:120`), no reordenando el
   * registro para que cuadre de memoria: `Por Entregar` y `Por Entregar / Sin facturar` caen EN
   * MEDIO —dentro del bloque `externa`—, no al final de las nueve que había antes.
   */
  it('las once en espera de la vista son externa + interna', () => {
    expect(ESTADOS_EN_ESPERA).toEqual([
      'En Espera de Repuestos',
      'Servicio externo',
      'Notificación cliente',
      'Por Entregar',
      'Por Entregar / Sin facturar',
      'Notificación a Compras',
      'Notificación Comercial',
      'En espera de SKU inventario',
      'Solicitado',
      'Liberación Comercial',
      STATUS_REMISION_CREADA,
    ])
  })

  it('enEsperaDe devuelve undefined para un estado que no existe', () => {
    expect(enEsperaDe('Estado inventado')).toBeUndefined()
  })
})

/**
 * `sin_salida` — LA SEGUNDA CLASIFICACIÓN DE NEGOCIO, y se declara como dato igual que `en_espera`.
 *
 * Gerencia cerró el criterio de M1.3.4, así que los cuatro se DECLARAN. Lo que estas pruebas fijan
 * es la lista y el porqué; lo que NO hacen —a propósito— es derivarla del grafo.
 */
describe('estados sin salida (M1.3.4)', () => {
  /**
   * LA PRUEBA DE COHERENCIA, y todo lo que comprueba: que los cuatro son estados DECLARADOS.
   *
   * No los deduce. Una prueba que los dedujera de «salida única» daría CINCO —ver más abajo— y
   * estaría mal, así que el único acoplamiento admisible con el registro es la pertenencia: un
   * `sin_salida` que no sea un estado es un error de datos, y el tipo `Estado` ya no deja escribirlo.
   */
  it('los cuatro son estados declarados del registro', () => {
    for (const e of ESTADOS_SIN_SALIDA) {
      expect(ESTADOS.includes(e), `«${e}» no está en el registro de estados`).toBe(true)
    }
  })

  it('sin_salida son exactamente estos cuatro, y son los de M1.3.4', () => {
    expect(ESTADOS_SIN_SALIDA).toEqual([
      'En Espera de Repuestos',
      'Solicitado',
      'Servicio externo',
      'En espera de SKU inventario',
    ])
  })

  /**
   * LA LECCIÓN DE MÉTODO, en prueba: «salida única» NO es proxy de nada.
   *
   * Doce estados tienen una sola transición de salida. Entre ellos `Ingresado` y `Ticket creado`, que
   * son fases de trabajo corriente y no esperas de nadie. Quien intente derivar `sin_salida` contando
   * salidas se lleva estos doce, y no cuatro.
   */
  it('doce estados tienen una sola salida, así que contar salidas no clasifica nada', () => {
    expect(conUnaSolaSalida()).toHaveLength(12)
    expect(conUnaSolaSalida()).toContain('Ingresado')
    expect(conUnaSolaSalida()).toContain('Ticket creado')
  })

  /**
   * `Liberación Comercial` y `Remisión creada` eran, hasta `por-entregar-es-espera`, LOS DOS CASOS QUE
   * DISTINGUEN EL CRITERIO. Desde esta tanda son CUATRO, y la derivación sirve AÚN MENOS que antes de
   * decirlo: cruzar las dos propiedades derivables —estar en espera y tener salida única— daba SEIS y
   * ahora da OCHO, porque `Por Entregar` y `Por Entregar / Sin facturar` son dos más de los doce
   * estados con salida única (`entrega_al_cliente`, `entrega_sin_factura`) y ahora también están en
   * `ESTADOS_EN_ESPERA`.
   *
   * Las CUATRO que sobran se dividen en dos parejas, y NO comparten la misma razón:
   * - `Liberación Comercial` y `Remisión creada` quedan fuera porque su única salida —
   *   `habilitado_para_entrega` y `habilitar_servicio`, las dos área Comercial— es UN ACTO QUE SE
   *   EJECUTA EN LA APLICACIÓN: alguien pulsa el botón.
   * - `Por Entregar` y `Por Entregar / Sin facturar` NO comparten esa razón: sus únicas salidas
   *   (`entrega_al_cliente`, `entrega_sin_factura`) son área Servicio Técnico, y lo que las cierra es
   *   que el CLIENTE venga a recoger el equipo — un suceso fuera de la aplicación, no un botón interno.
   *   ⚠️ **Hallazgo 3, sin decidir aquí** (`design.md` §9 de `por-entregar-es-espera`): el discriminador
   *   de `ESTADOS_SIN_SALIDA` (`estados.ts:131-133`) nombra literalmente «una entrega física» como
   *   ejemplo de suceso externo, así que las dos PARECEN candidatas a `sin_salida` con ese criterio.
   *   Esta prueba NO las declara `sin_salida` — `ESTADOS_SIN_SALIDA` es lista cerrada por Gerencia
   *   (M1.3.4) y esta tanda no la reabre — sólo constata que la derivación las deja fuera de esa
   *   lista, igual que a las otras dos, y por una razón distinta. La pregunta queda para Gerencia, sin
   *   destino asignado.
   *
   * Ésta es la prueba que da rojo si alguien sustituye la lista declarada por una derivación.
   */
  it('la derivación da ocho, y las cuatro que sobran son Liberación Comercial, Remisión creada, Por Entregar y Por Entregar / Sin facturar: por eso no se deriva', () => {
    const derivadaMal = ESTADOS_EN_ESPERA.filter((e) => conUnaSolaSalida().includes(e))
    expect(derivadaMal).toHaveLength(8)
    expect(derivadaMal.filter((e) => !(ESTADOS_SIN_SALIDA as string[]).includes(e))).toEqual([
      'Por Entregar',
      'Por Entregar / Sin facturar',
      'Liberación Comercial',
      STATUS_REMISION_CREADA,
    ])
    // Y las salidas que dejan fuera a Liberación Comercial/Remisión creada son actos de la
    // aplicación, no sucesos del mundo.
    const salidasComercial = TRANSITIONS.filter((t) => t.from.includes('Liberación Comercial'))
    expect(salidasComercial.map((t) => `${t.id} · ${t.area}`)).toEqual(['habilitado_para_entrega · Comercial'])
    const salidasRemision = TRANSITIONS.filter((t) => t.from.includes(STATUS_REMISION_CREADA))
    expect(salidasRemision.map((t) => `${t.id} · ${t.area}`)).toEqual(['habilitar_servicio · Comercial'])
    // Las de Por Entregar y su gemela sin factura son área Servicio Técnico, no Comercial: no
    // comparten la razón de las dos de arriba. Ver el hallazgo 3 anotado encima.
    const salidasPorEntregar = TRANSITIONS.filter((t) => t.from.includes('Por Entregar'))
    expect(salidasPorEntregar.map((t) => `${t.id} · ${t.area}`)).toEqual(['entrega_al_cliente · Servicio Técnico'])
    const salidasSinFacturar = TRANSITIONS.filter((t) => t.from.includes('Por Entregar / Sin facturar'))
    expect(salidasSinFacturar.map((t) => `${t.id} · ${t.area}`)).toEqual(['entrega_sin_factura · Servicio Técnico'])
  })
})

/** Los estados de los que sale UNA sola transición. Se calcula aquí, y no se exporta a propósito. */
function conUnaSolaSalida(): string[] {
  const salidas = new Map<string, number>()
  for (const t of TRANSITIONS) {
    for (const f of t.from) salidas.set(f, (salidas.get(f) ?? 0) + 1)
  }
  return [...salidas].filter(([, n]) => n === 1).map(([e]) => e)
}

/** Los estados de una clase, en el orden en que están declarados en el registro. */
function estadosCon(clase: EnEspera): string[] {
  return ESTADOS.filter((e) => CLASIFICACION_EN_ESPERA[e] === clase)
}
