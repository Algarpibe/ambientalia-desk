import { esRemisionConfirmada, esRemisionEntradaVigente, motivoSinRemisionVigente, type RemisionParaVigencia } from '@ambientalia/shared'

type RemisionDelPanel = RemisionParaVigencia & { estado: string }

/**
 * Por qué se desactiva «Habilitar Servicio» (RQ-TS-33). **Comodidad, no guarda:** la impone el servidor
 * (`exigirRemisionVigente`, escalón B) y el cliente sólo adelanta su respuesta. El orden es el de la guarda
 * del servidor: primero el alta pendiente (F1B-15), luego la remisión. Con las remisiones sin cargar
 * (`null`/`undefined`: cargando o error de carga) se abstiene y decide el servidor.
 *
 * No redefine «vigente»: lo consume de `@ambientalia/shared` (regla invariable 13, punto 1). Una vigente en
 * CUALQUIER estado de envío habilita; el «sin confirmar» no bloquea, es `avisoRemisionSinConfirmar`.
 */
export function motivoNoHabilitar(
  motivoAlta: string | null,
  remisiones: readonly RemisionParaVigencia[] | null | undefined,
): string | null {
  if (motivoAlta) return motivoAlta
  if (!remisiones) return null
  return motivoSinRemisionVigente(remisiones)
}

/**
 * Aviso NO bloqueante: hay al menos una remisión de entrada vigente y ninguna de las vigentes está confirmada.
 * **Presentación sin imposición del servidor**: el servidor habilita igual con la remisión `pendiente` o en
 * `error`. `null` en cualquier otro caso, también con las remisiones sin cargar; con el botón desactivado
 * manda el motivo de bloqueo y el panel no lo muestra.
 */
export function avisoRemisionSinConfirmar(remisiones: readonly RemisionDelPanel[] | null | undefined): string | null {
  const vigentes = (remisiones ?? []).filter(esRemisionEntradaVigente)
  if (vigentes.length === 0 || vigentes.some(esRemisionConfirmada)) return null
  return 'Remisión de entrada sin confirmar: el servicio se puede habilitar, pero el documento de la remisión todavía no está generado.'
}
