# Progreso de aplicación — `pool-conexion-cortada` (E-285)

## Lote L1 (intento i3) — HECHO salvo L1.1 y L1.9 (los corre el orquestador)

Modo: strict TDD. Partida de la medida: `a98a113d`. Worktree propio. `node_modules` no se cita por ruta.

### Casillas
- [ ] L1.1 M0 (`npm test` entero en la partida): no lo corrió este lote; lo corre el orquestador.
- [x] L1.2 a L1.8 hechas (ver abajo). [ ] L1.9: cierre y commit, del orquestador.

### Red de seguridad
`npx vitest run packages/zoho-sync/src/db/pool.test.ts` antes de tocar nada: 2/2 en verde.

### Rojos anotados (fichero › prueba › aserción)
1. U-1 (con sólo `./pool` importado; rojo por la razón correcta, «lanza», no «módulo inexistente»), 3 pruebas:
   `packages/zoho-sync/src/db/conexionPerdida.test.ts › U-1 … › createPool desk | createPool public | createPoolFromUrl: un oyente de error y emit('error') no lanza › expected [Function] to not throw an error but 'Error: x' was thrown`.
   Primer intento de la prueba (con `listenerCount` antes de `emit`): rojo `expected +0 to be 1`; se invirtió el orden de las dos aserciones para que el rojo fuera el de «lanza» que pide `tasks.md`.
2. Resto, con el esqueleto de `conexionPerdida.ts` sin lógica (16 rojas de 19 en total):
   - U-2, U-3 (dos), U-4, U-5, U-8: `pool.emit('error', …)` sobre un `EventEmitter` sin oyente lanza el propio error (`Connection terminated unexpectedly`, `terminating connection due to administrator command`, `m`, `uno`; U-8: `expected [Function] to not throw … 'Error: x' was thrown`). Rojo por «lanza», no por aserción de contenido: el esqueleto no engancha ningún oyente.
   - U-6: `expected '' to contain '<url omitida>'`.
   - U-7 (cinco entradas): `expected '' to be 'Pool de la base: se perdió una conexi…'`.
   - U-10 › sólo la 1 importa el módulo y sólo la 6 y la 10 envuelven el new Pool: `expected 'import { Pool } from 'pg'' to contain 'from './conexionPerdida''`.
   - U-9 y las dos primeras de U-10 nacen verdes (caracterizan lo que `pool.ts` ya cumple en `96cba5ab`: límites por defecto, 11 líneas, literales); U-9 no es trivial: afirma `max` igual a 10 y la igualdad con un `new Pool` de referencia.
3. Tras el módulo (L1.4): quedan rojas sólo U-1 (3) y U-10 (la tercera): 15 verdes de 19.
4. Tras `pool.ts` (L1.5): 19/19 y `pool.test.ts` 2/2 = 21 en verde.

### Evidencia de `pool.ts` (L1.5)
`git diff --numstat -- packages/zoho-sync/src/db/pool.ts` = `3	3`; `wc -l` = 11; `file` = CRLF (igual que la partida). Sólo las líneas 1, 6 y 10, con el texto de `design.md` §4.

### Mutaciones (protocolo: `git add` antes; `perl -i -pe '… if $. == N'`; restauración con `git checkout --` desde el índice, `git diff --quiet` = 0 y `file` CRLF tras cada una)
Líneas de `packages/zoho-sync/src/db/conexionPerdida.ts` medidas en el momento: 43 (`pool.on`), 15 (mensaje), 38 (`registrar`), 39 (`catch`), 10 (sustitución de URL); `packages/zoho-sync/src/db/pool.ts:10`.
| Mutación | Cambio | Se puso rojo |
|---|---|---|
| M-1 | `// pool.on('error', oyente)` (`:43`) | 9: U-1 (las tres), U-2, U-3 (dos), U-4, U-5, U-8. U-8 también: sin oyente no hay registrar al que llamar. Lo previsto (U-1 a U-5) y U-8 de más |
| M-2 | `pool.ts:10` vuelve a `return new Pool({ connectionString })` | 2: sólo el caso `createPoolFromUrl` de U-1 y la tercera de U-10 |
| M-3 | mensaje pasa a `JSON.stringify(err)` (`:15`) | 7: U-2, U-3 (dos), U-4, U-5, U-6, U-7 (getter). Incluye U-4, que es la prevista; las demás caen porque `JSON.stringify` de un `Error` da `{…}` sin `message` |
| M-4 | `console.error(lineaConexionPerdida(err), err)` en vez de `registrar(…)` (`:38`) | 3: U-2, U-4 (dos argumentos) y U-8 (el registrar inyectado nunca se llama) |
| M-5 | `} catch {` pasa a `} catch (e) { throw e` (`:39`) | 1: U-8 |
| M-6 | se quita el `.replace` de URL (`:10`) | 1: U-6 |
Ninguna mutación quedó sin rojo: no hubo hallazgo de prueba floja.

### Verificaciones
- Focal: `conexionPerdida.test.ts` + `pool.test.ts`: 2 ficheros, 21/21 en verde.
- `npm run typecheck`: salida 0 (el genérico sobre `EventEmitter` lo acepta `tsc` sin aserciones: hipótesis del diseño cerrada).
- `npm run lint -- --max-warnings 165`: salida 0, **165 avisos contra 165**; ninguno en los ficheros del lote.
- L1.8: `git diff --name-only` sin nada bajo `apps/desk/src`; `git diff --quiet a98a113d -- packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/schema.sql .env.example` = 0.
- Ficheros nuevos convertidos a CRLF con `perl` y comprobados con `file`.

### Desvíos del diseño (con su porqué)
1. U-2 a U-5 enganchan `escucharConexionPerdida(new EventEmitter())` con el `console.error` por defecto espiado, en vez de `createPool`: así M-2 queda acotado a `createPoolFromUrl` (U-1 y U-10), como pide `design.md` §7. El cableado de `createPool` lo cubre U-1.
2. M-5: no se puede «quitar el `try`» con un cambio de una línea sin romper la sintaxis; se muta el `catch` para que relance (mismo efecto: el registrar que lanza sale por el `emit`).
3. Los rojos de U-2 a U-5 y U-8 con el esqueleto son «lanza» y no de contenido (el esqueleto no tiene oyente); los de contenido se ven en las mutaciones M-3, M-4 y M-6.
4. El módulo separa `sanear`, `mensajeDe` y `codigoDe` como funciones privadas (comportamiento de §3 intacto); el oyente es una constante y `pool.on('error', oyente)` queda en su propia línea (M-1).
5. U-9 compara con un `new Pool` de referencia las cinco claves de `options`; no se pudo observar un rojo previo porque describe lo que ya es cierto (caracterización declarada arriba).

### Medida del intento (i3)
Ver línea final, anotada con todo en el índice.

`git diff --cached --shortstat --no-renames a98a113d` con todo en el índice: 5 ficheros, 324 inserciones y 10 borrados (334 líneas; incluye este fichero y las casillas de `tasks.md`). Sin ficheros nuevos sin trackear fuera del índice (`wc -l` = 0), sin binarios. Muy por debajo de 800.

### Cierre del lote (orquestador)
- **M0 (L1.1):** `npm test` entero en la partida `a98a113d`, la misma del intento i2: salida 0, 376 ficheros y 6.462 pruebas en verde (30 omitidas), 283 s, 5.854 MB libres al arrancar.
- **Las cinco comprobaciones (L1.9)** corren sobre el commit de este lote; su resultado queda en el `settle` del intento i3 y al principio del bloque de L2 de este fichero.
