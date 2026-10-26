import { DataType, type IMemoryDb } from 'pg-mem'

/**
 * Imitación de pg-mem para la forma SQL de la regla de estados (RQ-ZS-24; `design.md` «pg-mem», D5).
 *
 * pg-mem 3.0.14 no trae `btrim` ni `regexp_replace`, y `sqlEstadoNormalizado` (`packages/shared/src/normalizarEstado.ts`) emite
 * `regexp_replace(btrim(col), ' {2,}', ' ', 'g')`. Esto registra SÓLO eso y nada más:
 *   - `btrim(text)`: recorta únicamente U+0020, como `btrim` de un argumento en PostgreSQL (no toca tabuladores ni NBSP).
 *   - `regexp_replace(text, text, text, text)`: SÓLO acepta el patrón `' {2,}'`, el reemplazo `' '` y la bandera `'g'`. Cualquier otra
 *     combinación lanza «imitación fuera de alcance»: una imitación general daría por buenas consultas que PostgreSQL real lee distinto.
 * Con argumento `NULL` las dos devuelven `NULL` (pg-mem no llama a la función con nulos salvo `allowNullArguments`).
 *
 * El parecido con PostgreSQL real lo fija `apps/desk/server/db/normalizarEstado.integration.test.ts` (en CI, contra PostgreSQL 17).
 */
const PATRON = ' {2,}'
const REEMPLAZO = ' '
const BANDERAS = 'g'

export function conFuncionesDeEstado(mem: IMemoryDb): IMemoryDb {
  mem.public.registerFunction({
    name: 'btrim',
    args: [DataType.text],
    returns: DataType.text,
    implementation: (texto: string) => texto.replace(/^ +| +$/g, ''),
  })
  mem.public.registerFunction({
    name: 'regexp_replace',
    args: [DataType.text, DataType.text, DataType.text, DataType.text],
    returns: DataType.text,
    implementation: (texto: string, patron: string, reemplazo: string, banderas: string) => {
      if (patron !== PATRON || reemplazo !== REEMPLAZO || banderas !== BANDERAS) {
        throw new Error(`pg-mem: imitación fuera de alcance de regexp_replace(…, '${patron}', '${reemplazo}', '${banderas}'): sólo ' {2,}', ' ', 'g'`)
      }
      return texto.replace(/ {2,}/g, ' ')
    },
  })
  return mem
}
