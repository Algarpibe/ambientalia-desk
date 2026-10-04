import {
  motivoNoEnviable, novedadesActivas, validarRecepcion,
  type CategoriaFoto, type NovedadCatalogo, type NovedadMarcada, type RemisionRecepcion,
} from '@ambientalia/shared'

/**
 * Lógica del formulario de recepción de la remisión de entrada (`recepcion-rotulacion-foto-entrada`, F1B-04;
 * RQ-RE-19). Pura y con prueba: `CrearRemision.tsx` está fuera de la red de pruebas por decisión de Gerencia
 * (F0-00), así que TODA decisión del formulario vive aquí y el `.tsx` sólo pinta y llama.
 *
 * Regla invariable 13: aquí no se reescribe ninguna regla. La validación y las fotos que faltan son las
 * funciones de `@ambientalia/shared` que el servidor ejecuta; este módulo sólo las enfrenta a lo que el
 * formulario tiene en pantalla. `File` es un tipo genérico: las pruebas pasan objetos simples.
 */

export interface FotoPlan<F = File> { file: F; categoria: CategoriaFoto; novedad: string | null }
export interface FotosDelFormulario<F = File> {
  equipo: F[]; accesorios: F[]; embalaje: F[]; porNovedad: Record<string, F[]>
}
export const FOTOS_VACIAS: FotosDelFormulario<never> = { equipo: [], accesorios: [], embalaje: [], porNovedad: {} }

/**
 * Marca o desmarca una novedad. La que EXCLUYE a las demás (marca `excluyeDemas` del catálogo, nunca la
 * clave) desmarca todo lo demás al marcarse, y marcar otra desmarca la excluyente.
 */
export function alternarNovedad(catalogo: readonly NovedadCatalogo[], marcadas: readonly string[], clave: string): string[] {
  if (marcadas.includes(clave)) return marcadas.filter((c) => c !== clave)
  const excluye = (c: string) => catalogo.find((n) => n.clave === c)?.excluyeDemas === true
  if (excluye(clave)) return [clave]
  return [...marcadas.filter((c) => !excluye(c)), clave]
}

/**
 * Aplana las fotos a UNA lista ordenada —equipo, accesorios, embalaje y las de cada novedad en el orden de
 * lo marcado—, que es el índice posicional que `ejecutarEnvio` necesita. Descarta las de novedades ya desmarcadas.
 */
export function planDeFotos<F>(fotos: FotosDelFormulario<F>, marcadas: readonly NovedadMarcada[]): FotoPlan<F>[] {
  const de = (categoria: CategoriaFoto, archivos: F[], novedad: string | null = null): FotoPlan<F>[] =>
    archivos.map((file) => ({ file, categoria, novedad }))
  return [
    ...de('equipo', fotos.equipo),
    ...de('accesorios', fotos.accesorios),
    ...de('embalaje', fotos.embalaje),
    ...marcadas.flatMap((m) => de('novedad', fotos.porNovedad[m.clave] ?? [], m.clave)),
  ]
}

const clasificadas = (plan: readonly FotoPlan<unknown>[]) => plan.map((p) => ({ categoria: p.categoria, novedad: p.novedad }))

/**
 * Por qué NO se puede crear todavía, o `null`: el error de `validarRecepcion` y, si no, el de `motivoNoEnviable`
 * sobre el plan completo (el servidor impone esto último en `/enviar`; aquí se dice antes de crear).
 */
export function motivoNoCreable(
  catalogo: readonly NovedadCatalogo[],
  cuerpo: { novedades: unknown; novedadOtro?: unknown; rotulado?: unknown },
  plan: readonly FotoPlan<unknown>[],
): string | null {
  const v = validarRecepcion(catalogo, cuerpo)
  if (!v.ok) return v.error
  const rem: RemisionRecepcion = { hayNovedad: v.valor.hayNovedad, novedades: v.valor.novedades, rotuladoAt: 'rotulado' }
  return motivoNoEnviable(rem, clasificadas(plan), catalogo)
}

/** «Continuar sin las fotos que faltan» sólo si lo YA subido (el prefijo del plan) cumple las puertas de envío. */
export function puedeContinuarSinPendientes(
  rem: RemisionRecepcion, plan: readonly FotoPlan<unknown>[], catalogo: readonly NovedadCatalogo[], fotosSubidas: number,
): boolean {
  return motivoNoEnviable(rem, clasificadas(plan.slice(0, fotosSubidas)), catalogo) === null
}

/**
 * Todo lo que el formulario deriva de su estado, en una llamada pura: la lista que se pinta (activas, por orden),
 * lo marcado, el plan de fotos, el cuerpo del alta, el motivo que impide crear y la remisión que `/enviar`
 * evaluaría (`null` mientras `validarRecepcion` rechace). El `.tsx` sólo lee este resultado.
 */
export function vistaDelFormulario<F>(
  catalogo: readonly NovedadCatalogo[], seleccion: readonly string[], otro: string, rotulado: boolean, fotos: FotosDelFormulario<F>,
) {
  const lista = novedadesActivas(catalogo)
  const marcadas: NovedadMarcada[] = lista.filter((n) => seleccion.includes(n.clave)).map(({ clave, etiqueta }) => ({ clave, etiqueta }))
  const plan = planDeFotos(fotos, marcadas)
  const cuerpo = { novedades: [...seleccion], novedadOtro: otro, rotulado }
  const v = validarRecepcion(catalogo, cuerpo)
  const remision: RemisionRecepcion | null = v.ok ? { hayNovedad: v.valor.hayNovedad, novedades: v.valor.novedades, rotuladoAt: 'rotulado' } : null
  return { lista, marcadas, plan, cuerpo, remision, motivo: motivoNoCreable(catalogo, cuerpo, plan) }
}
