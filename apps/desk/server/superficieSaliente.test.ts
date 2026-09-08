import { describe, it, expect } from 'vitest'
import { escanearSuperficieHttp } from './testing/superficieSaliente'

/**
 * INVARIANTE 7 — LA SUPERFICIE SALIENTE (§2 y §6 del proposal F0-04).
 *
 * Convierte la regla invariable 6 —«la app sólo escribe hacia fuera por estas puertas»— en prueba.
 * Hasta ahora era una frase en un documento, y una frase no impide que la tanda que viene añada un
 * `POST` a un servicio nuevo sin que nadie lo revise: la revisión de código es el único filtro, y no
 * falla en rojo.
 *
 * ⚠️ SE AFIRMA EL CONJUNTO, no el número. Cualquier saliente nueva rompe esta prueba HASTA QUE
 * ALGUIEN LA AÑADA A LA LISTA A PROPÓSITO, con su etiqueta. Ése es todo el mecanismo.
 *
 * POR QUÉ VIVE AQUÍ y no en `packages/shared`, que es donde están los otros seis invariantes:
 * `shared` no hace ni una llamada HTTP, y este barrido lee del disco el repositorio entero. Metido
 * allí sacaría de un segundo el ciclo focalizado del motor, que es lo que hace cómodo el `strict_tdd`
 * de F0-04. El barrido cubre `apps/` y `packages/` completos, no sólo este servidor.
 *
 * POR QUÉ NO SE AFIRMAN LOS NÚMEROS DE LÍNEA aunque el proposal los nombre: una línea añadida más
 * arriba rompería la prueba sin que la superficie hubiera cambiado, y a la tercera vez que eso pasa
 * alguien «arregla» el invariante actualizando el número. Se afirma fichero + verbo, y la línea sale
 * en el mensaje de fallo, que es donde sirve.
 */
describe('superficie HTTP saliente', () => {
  it('las llamadas no-GET que salen de la casa son exactamente estas seis, cada una etiquetada', () => {
    const { salientes } = escanearSuperficieHttp()
    const etiquetas: Record<string, string> = {
      // OAuth: refrescar el token contra Zoho. Una por cada uno de los tres productos.
      'packages/zoho-sync/src/tokenManager.ts · POST': 'OAuth — token de Zoho Desk',
      'packages/zoho-sync/src/books/booksClient.ts · POST': 'OAuth — token de Zoho Books',
      'packages/zoho-sync/src/crmHub/crmClient.ts · POST': 'OAuth — token de Zoho CRM',
      // n8n: los dos disparadores de flujo. Los dos van con su token de cabecera.
      'apps/desk/server/avisosWebhook.ts · POST': 'n8n — disparo de avisos',
      'apps/desk/server/remisionWebhook.ts · POST': 'n8n — disparo de remisión',
      // La única escritura hacia Zoho Desk desde la app, y va gateada.
      'apps/desk/server/routes/tickets.ts · POST': 'Zoho Desk — envío de la respuesta al cliente, gateado',
    }
    const encontradas = salientes.map((l) => `${l.archivo} · ${l.verbo}`)
    expect(encontradas, mensaje(salientes)).toEqual(Object.keys(etiquetas).sort())
  })

  /**
   * El resto de escrituras del repositorio son del navegador contra NUESTRO propio servidor:
   * `apps/desk/src/api/client.ts` entero. No salen de la casa, van a `/api/...` en el mismo origen, y
   * por eso no cuentan como superficie saliente. Se comprueba que siguen siendo sólo ésas: el día
   * que una pantalla llame directamente a un tercero, dejará de estar en esta lista y aparecerá en
   * la de arriba, que es exactamente lo que se quiere que pase.
   */
  it('las demás escrituras son del navegador contra nuestro propio servidor', () => {
    const { mismoOrigen } = escanearSuperficieHttp()
    expect([...new Set(mismoOrigen.map((l) => l.archivo))]).toEqual(['apps/desk/src/api/client.ts'])
  })

  /**
   * Un verbo que no es un literal —`fetch(url, { method, ... })`— es un agujero en el barrido: no se
   * puede saber qué manda sin ejecutarlo. Hay UNO, y es el escritor del catálogo del navegador, que
   * recibe la ruta `/api/catalogo/...` de sus llamadores. Se fija para que un segundo agujero no
   * pueda aparecer callado.
   */
  it('sólo hay un sitio donde el verbo no es literal, y es del navegador', () => {
    const { verboDinamico } = escanearSuperficieHttp()
    expect(verboDinamico).toEqual(['apps/desk/src/api/client.ts'])
  })
})

/** El detalle con fichero y línea, para que el fallo diga dónde está la puerta nueva. */
function mensaje(salientes: { archivo: string; linea: number; verbo: string; destino: string }[]): string {
  return `salientes encontradas:\n${salientes.map((l) => `  ${l.archivo}:${l.linea} ${l.verbo} → ${l.destino}`).join('\n')}`
}
