import type { PersonaLite, DerivacionPorDefecto } from '@ambientalia/shared'
import { etiquetaPersona } from '@ambientalia/shared'

export interface OpcionPersona { valor: string; etiqueta: string }

/**
 * Las opciones del desplegable «Derivado a».
 *
 * Vive aquí y no en el componente por la razón de siempre: no hay harness de React, y esto es lógica
 * que se rompe en silencio.
 *
 * **El caso que justifica la función entera**: un ticket derivado a alguien que después se da de baja.
 * Esa persona ya no viene entre las activas, así que el desplegable no encontraría su valor y se
 * pintaría en blanco; la siguiente transición mandaría la casilla vacía y **borraría la derivación sin
 * que nadie lo pidiera**. Por eso al derivado actual se le conserva su opción aunque esté inactivo, y
 * se le marca para que quien mire sepa que hay que reasignar.
 */
export function opcionesPersona(
  activas: PersonaLite[],
  derivadoActual: PersonaLite | null,
): OpcionPersona[] {
  // Derivar es opcional: quitar la derivación tiene que ser tan fácil como ponerla.
  const opciones: OpcionPersona[] = [{ valor: '', etiqueta: 'Sin derivar' }]

  if (derivadoActual && !activas.some((p) => p.id === derivadoActual.id)) {
    opciones.push({ valor: derivadoActual.id, etiqueta: `${etiquetaPersona(derivadoActual)} (inactivo)` })
  }
  for (const p of activas) opciones.push({ valor: p.id, etiqueta: etiquetaPersona(p) })
  return opciones
}

/**
 * `cargo` es texto libre que se teclea a mano, así que emparejar por igualdad exacta es emparejar por
 * suerte: «coordinador comercial» con minúscula o un espacio de sobra apagarían la propuesta en
 * silencio, y nadie relacionaría la causa con el efecto.
 */
const normalizar = (s: string): string =>
  s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

/**
 * Con quién abre la casilla «Derivado a» al desplegar el formulario de una etapa.
 *
 * Por omisión se HEREDA a quien ya lo tenía, que es lo que evita que confirmar una etapa le borre el
 * responsable al ticket. Pero una etapa puede declarar a quién le pasa el trabajo (`porDefecto`), y
 * entonces ESO gana: «Escalado a comercial» saca el ticket de Servicio Técnico, así que dejar heredado
 * al técnico lo derivaría justo a quien deja de tocarle.
 *
 * Sea cual sea la vía, la propuesta tiene que estar entre las ACTIVAS. Proponer a alguien de baja
 * dejaría el desplegable sin ese valor y por tanto en blanco, y confirmar la etapa borraría la
 * derivación sin que nadie lo pidiera — el mismo agujero que tapa `opcionesPersona`, que solo conserva
 * al derivado vigente.
 *
 * Sigue siendo una propuesta, no una imposición: la casilla se puede cambiar antes de confirmar.
 *
 * Vive aquí y no en el componente por lo de siempre: no hay harness de React, y esto es una regla de
 * negocio —a quién le toca— que se rompe sin fallar nada.
 */
export function derivacionInicial(
  porDefecto: DerivacionPorDefecto | undefined,
  ctx: {
    activas: PersonaLite[]
    /** A quién se derivó el ticket la primera vez, o `null` si nunca se derivó. */
    primerDerivado: string | null
    /** A quién lo trae derivado ahora. */
    heredado: string | null
  },
): string | null {
  const activa = (id: string | null): string | null =>
    (id && ctx.activas.some((p) => p.id === id) ? id : null)

  // Cero coincidencias es «eso no está definido todavía», no «esta etapa no deriva»: se cae a lo
  // heredado, que es el comportamiento de las otras 32 etapas.
  if (porDefecto?.tipo === 'primerDerivado') return activa(ctx.primerDerivado) ?? ctx.heredado
  if (porDefecto?.tipo === 'cargo') {
    const buscado = normalizar(porDefecto.cargo)
    // La primera de la lista, que llega ordenada por nombre desde `listPersonas`: con dos personas del
    // mismo cargo la propuesta tiene que ser siempre la misma, no la que toque ese día.
    const persona = ctx.activas.find((p) => p.cargo != null && normalizar(p.cargo) === buscado)
    return persona?.id ?? ctx.heredado
  }
  return ctx.heredado
}
