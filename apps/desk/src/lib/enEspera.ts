import { ESTADOS_EN_ESPERA } from '@ambientalia/shared'

/**
 * ¿Este estado es de los que la vista enseña bajo «En espera»?
 *
 * NO es lógica nueva: es el `.includes` que `boardView.ts:39` ya hacía, con domicilio propio para que
 * los DOS sitios que CLASIFICAN lo compartan. El criterio «externa o interna» vive en
 * `estados.ts:120-123` y no se reescribe aquí (regla invariable 13, punto 1).
 *
 * Un estado que no esté en el registro devuelve `false`, igual que hacía `boardView.ts:39`: no lo
 * esconde —cae en «abiertos», que se ve—, y quien vigila los estados no declarados es el invariante 1
 * de `invariantesGrafo.test.ts`. Ver `enEsperaDe` (`estados.ts:169`) si hace falta la CLASE.
 */
export function esEstadoEnEspera(status?: string | null): boolean {
  return (ESTADOS_EN_ESPERA as readonly string[]).includes(status ?? '')
}
