/**
 * Orquesta "crear remisión → subir fotos → enviar a n8n", fuera del componente para poder probarlo:
 * el repo no tiene harness de componentes React, y aquí es donde vive el riesgo real —que un fallo a
 * mitad deje una remisión huérfana o cree una duplicada—, así que tiene que estar cubierto.
 *
 * Las dependencias entran por parámetro y no por import: así el test no necesita red, ni `File`, ni DOM.
 */

/** Lo que hay que recordar entre intentos para que un reintento CONTINÚE en vez de empezar de cero. */
export interface EstadoEnvio {
  /** Id de la remisión ya creada en la base. `null` = todavía no existe. */
  remisionId: string | null
  /** Cuántas fotos se subieron ya, en orden. Es el índice de la próxima que toca. */
  fotosSubidas: number
}

export interface PasosEnvio {
  /** Crea la remisión y devuelve su id. Solo se llama si el estado no trae una. */
  crear: () => Promise<string>
  subirFoto: (remisionId: string, indice: number) => Promise<void>
  enviar: (remisionId: string) => Promise<void>
  /**
   * Se llama tras CADA avance. Es la pieza que arregla el fallo: quien orquesta lo guarda en estado,
   * así que sobrevive al error y el reintento sabe por dónde iba.
   */
  onAvance: (estado: EstadoEnvio) => void
  /** Texto de progreso para la pantalla. Opcional: al test no le hace falta. */
  onProgreso?: (texto: string) => void
}

export interface ResultadoEnvio {
  remisionId: string
  /** Mensaje si el disparo a n8n falló. La remisión existe igual y se reintenta desde el panel. */
  errorEnvio: string | null
}

/**
 * Reanudable: `estado` dice qué se hizo ya y se continúa desde ahí. Un fallo de `crear` o de
 * `subirFoto` se propaga —el formulario tiene que enterarse—, pero para entonces `onAvance` ya
 * registró lo conseguido.
 *
 * `enviar` es la excepción y NO lanza: llegado ahí la remisión existe y sus fotos están subidas, así
 * que el sitio para reintentar es el panel de desenlace, no el formulario. Volver al formulario sería
 * justo lo que crea la remisión duplicada.
 */
export async function ejecutarEnvio(
  estado: EstadoEnvio,
  totalFotos: number,
  pasos: PasosEnvio,
  opciones: { omitirFotosPendientes?: boolean } = {},
): Promise<ResultadoEnvio> {
  let remisionId = estado.remisionId
  let fotosSubidas = estado.fotosSubidas

  if (!remisionId) {
    pasos.onProgreso?.('Guardando…')
    remisionId = await pasos.crear()
    fotosSubidas = 0
    pasos.onAvance({ remisionId, fotosSubidas })
  }

  if (!opciones.omitirFotosPendientes) {
    for (let i = fotosSubidas; i < totalFotos; i++) {
      pasos.onProgreso?.(`Subiendo foto ${i + 1} de ${totalFotos}…`)
      await pasos.subirFoto(remisionId, i)
      fotosSubidas = i + 1
      pasos.onAvance({ remisionId, fotosSubidas })
    }
  }

  pasos.onProgreso?.('Enviando…')
  let errorEnvio: string | null = null
  try {
    await pasos.enviar(remisionId)
  } catch (e) {
    errorEnvio = e instanceof Error ? e.message : String(e)
  }
  return { remisionId, errorEnvio }
}
