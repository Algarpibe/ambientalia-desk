import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * verificacion-completitud (1G-03, D4, CA-10) · sólo lectura por construcción, y cada intento de escribir queda CONTADO.
 * Un rechazo se REGISTRA (un total y el tipo: la primera palabra en mayúsculas, `VARIAS` o el verbo HTTP; nunca la sentencia ni los
 * parámetros) y DESPUÉS lanza `ErrorEscritura`. El registro es lo que cuenta: `persistEach` y los `ensure*` de `sync.ts` se tragan la excepción.
 * El verbo HTTP se lee de `init` por acceso, sin clave literal ni desestructurado: el barrido de `testing/superficieSaliente.ts` los clasificaría.
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export interface RegistroEscrituras { total: number; tipos: string[] }
export class ErrorEscritura extends Error {}

export const crearRegistroEscrituras = (): RegistroEscrituras => ({ total: 0, tipos: [] })

function rechazar(registro: RegistroEscrituras, tipo: string): never {
  registro.total++
  if (!registro.tipos.includes(tipo)) registro.tipos = [...registro.tipos, tipo].sort()
  throw new ErrorEscritura(`escritura rechazada: ${tipo}`)
}

/** Una segunda sentencia (un `;` que no sea el final) es `VARIAS`; si no, la primera palabra, en mayúsculas, o `DESCONOCIDA`. */
const tipoDeSentencia = (sql: string): string => (sql.trim().replace(/;$/, '').includes(';') ? 'VARIAS' : /^\s*([A-Za-z]+)/.exec(sql)?.[1]?.toUpperCase() ?? 'DESCONOCIDA')
const esSelect = (sql: string): boolean => /^\s*select\b/i.test(sql) && tipoDeSentencia(sql) !== 'VARIAS'

export function soloSelect(db: Queryable, registro: RegistroEscrituras = crearRegistroEscrituras()): Queryable {
  return {
    query: async (sql, params) => {
      if (!esSelect(sql)) rechazar(registro, tipoDeSentencia(sql))
      return db.query(sql, params)
    },
  }
}

export function soloGet(zohoFetch: ZohoFetch, registro: RegistroEscrituras = crearRegistroEscrituras()): ZohoFetch {
  return async (path, init) => {
    if ((init?.method ?? 'GET').toUpperCase() !== 'GET') rechazar(registro, (init?.method ?? '').toUpperCase())
    return zohoFetch(path, init)
  }
}
