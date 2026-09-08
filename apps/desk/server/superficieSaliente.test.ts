import { describe, it, expect } from 'vitest'
import { escanearSuperficieHttp, escanearFetchDelNavegador } from './testing/superficieSaliente'

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
 * de F0-04.
 *
 * POR QUÉ NO SE AFIRMAN LOS NÚMEROS DE LÍNEA aunque el proposal los nombre: una línea añadida más
 * arriba rompería la prueba sin que la superficie hubiera cambiado, y a la tercera vez que eso pasa
 * alguien «arregla» el invariante actualizando el número. Se afirma fichero + verbo, y la línea sale
 * en el mensaje de fallo, que es donde sirve.
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────
 * DOS BARRIDOS, PORQUE SON DOS PREGUNTAS DISTINTAS, Y NINGUNA EXCEPCIÓN NOMINAL
 *
 * Hubo una tercera prueba que aislaba `apps/desk/src/api/client.ts` como excepción documentada —el
 * ayudante del catálogo, cuyo verbo es una variable—. Se retiró: AISLAR UNA INSTANCIA TAPA UN CASO,
 * y el mes que viene alguien añade otro ayudante con método variable y la asercción no lo cubre. En
 * su lugar va la estructura:
 *
 *  a) el barrido de salientes se acota a CÓDIGO DE SERVIDOR. El navegador no puede alcanzar Zoho sin
 *     pasar por nuestro servidor, así que `apps/desk/src` no pertenece a esa pregunta.
 *  b) el navegador tiene su propia asercción, que caza la CLASE ENTERA: ningún `fetch` de
 *     `apps/desk/src` apunta a una URL absoluta.
 *
 * Con (b), `escribirCatalogo` (`client.ts:315-320`) —`(url, method, body)` genérico— deja de ser una
 * excepción que documentar y queda FUERA DE ALCANCE POR CONSTRUCCIÓN: la pregunta ya no es qué verbo
 * manda, sino a dónde. Y su `credentials: 'include'` es además la prueba de que va contra nuestro
 * propio origen — el navegador no manda la cookie de sesión a Zoho, y Zoho la rechazaría.
 */
describe('superficie HTTP saliente', () => {
  it('las llamadas no-GET que salen de la casa son exactamente estas seis, cada una etiquetada', () => {
    const { salientes, mismoOrigen, verboDinamico } = escanearSuperficieHttp()
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

    // Y los otros dos cubos del barrido, VACÍOS. No es un adorno: son las dos formas de que una
    // saliente nueva no aparezca arriba. En código de servidor una ruta que empieza por `/` no tiene
    // origen al que pegarse —eso era el navegador, que ya no se barre aquí— y un verbo que llega en
    // una variable es una puerta cuyo destino el barrido no puede leer. Que ambos estén a cero es lo
    // que hace de la lista de arriba la lista COMPLETA.
    expect(mismoOrigen.map((l) => `${l.archivo}:${l.linea}`)).toEqual([])
    expect(verboDinamico).toEqual([])
  })

  /**
   * (b) LA CLASE ENTERA DEL NAVEGADOR: ninguna pantalla habla con un tercero.
   *
   * Se mira EL ARGUMENTO de cada `fetch(`, no el fichero: en `apps/desk/src` hay ocho ocurrencias de
   * `https://` que no son destinos —los avatares de `<img>` de `Header.tsx`, `Sidebar.tsx` y
   * `mockData.ts`, un texto de relleno en `CatalogoEquipos.tsx` y cuatro URL de Drive en las fixturas
   * de `lib/eliminarTicket.test.ts`—, y una asercción de fichero entero daría rojo hoy mismo por
   * cosas que no son llamadas.
   *
   * Es una asercción de CLASE y no una lista: no enumera los destinos válidos —hoy son 74 rutas
   * `/api/…` y mañana serán 80— sino que niega la propiedad que importa. Por eso una pantalla nueva
   * no la toca, y un `fetch` a un tercero la rompe sea cual sea el fichero donde se escriba.
   */
  it('ningún fetch del navegador apunta a una URL absoluta', () => {
    const llamadas = escanearFetchDelNavegador()
    // Si el barrido dejara de encontrar llamadas, la prueba pasaría en vacío y no diría nada.
    expect(llamadas.length, 'el barrido del navegador no encontró ninguna llamada').toBeGreaterThan(0)

    const absolutas = llamadas.filter((l) => /:\/\//.test(l.destino))
    expect(absolutas.map((l) => `${l.archivo}:${l.linea} → ${l.destino}`)).toEqual([])

    // Y el otro lado de la misma moneda: cuando el destino SÍ es un literal, empieza por `/`. Sin
    // esto, un `fetch('//evil.example')` —URL absoluta sin esquema— pasaría por la rendija.
    const literalesFuera = llamadas
      .filter((l) => /^['"`]/.test(l.destino))
      .filter((l) => !/^['"`]\/(?!\/)/.test(l.destino))
    expect(literalesFuera.map((l) => `${l.archivo}:${l.linea} → ${l.destino}`)).toEqual([])
  })
})

/** El detalle con fichero y línea, para que el fallo diga dónde está la puerta nueva. */
function mensaje(salientes: { archivo: string; linea: number; verbo: string; destino: string }[]): string {
  return `salientes encontradas:\n${salientes.map((l) => `  ${l.archivo}:${l.linea} ${l.verbo} → ${l.destino}`).join('\n')}`
}
