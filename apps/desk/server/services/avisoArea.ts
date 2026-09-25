import { areasSiguientes, type Transition } from '@ambientalia/shared'

/**
 * A qué áreas hay que avisar tras dejar un ticket en `estado`.
 *
 * Es `areasSiguientes` MENOS las áreas de quien acaba de actuar, que es la definición literal que dio
 * el usuario: se avisa cuando interviene **otro** perfil. Sin la resta, «Facturado» —que deja el
 * ticket en una fase que también es de Comercial— le avisaría a Comercial de que le toca a Comercial,
 * y la campana se convierte en ruido que la gente aprende a ignorar.
 *
 * Se restan las áreas del USUARIO, no las de la transición: un administrador las tiene todas, así que
 * no dispara avisos de área. Es deliberado (ver el spec) — si hace el trabajo de las tres áreas, no
 * hay a quién pasarle el testigo.
 */
export function areasAAvisar(estado: string, areasActor: string[], catalogo?: readonly Transition[]): string[] {
  return areasSiguientes(estado, catalogo).filter((a) => !areasActor.includes(a))
}

export function textoAvisoArea(c: { ticketNumero: number; estado: string; actorNombre: string }): string {
  return `${c.actorNombre} dejó el ticket #${c.ticketNumero} en «${c.estado}»: le toca a tu área`
}
