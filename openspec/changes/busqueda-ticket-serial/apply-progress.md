# Apply-progress: busqueda-ticket-serial

Cambio `busqueda-ticket-serial` · `tanda: F1B-08` · `cierra: no` · Modo: Strict TDD · Store: hybrid.

## Lote 1 · Núcleo (intento 1) — casillas 1.1 a 1.27

Commit de partida: `47127ff71cdab653dc0ae723164c4e10b13029e4`.

`wc -l` ANTES / DESPUÉS: `repo.ts` 452 / 452 · `equipos.ts` 420 / 420 · `index.ts` 31 / 32 (la única línea añadida admitida).

### Línea base (1.2)

`npm test` exit=0 (189 ficheros pasan + 1 omitido; 2.991 pruebas pasan, 2 omitidas) · `npm run typecheck` exit=0 · `npm run lint` exit=0 (165 avisos, 0 errores).
Líneas del diseño §5 lote 1 remedidas en el árbol: `repo.ts` 129 (importación), 142-143, 151-152, 157-158, 166-167, 172-173, 177-178, 186-187 (coinciden con el diseño); `equipos.ts` 6 y 60; `index.ts` 31 (última).

### H-1 (1.3 a 1.5): plan A, la subconsulta FUNCIONA en pg-mem

Rojo observado de la primera prueba (`busquedaTickets.test.ts`, sólo con importación de TIPO, así que el rojo no es «módulo inexistente» sino filtro ignorado):
`AssertionError: expected [ 1001, 1002 ] to deeply equal [ 1001 ]`.
Tras `sqlBusquedaTickets` + cablear sólo `getActiveTickets`: verde (1 prueba). Probada también la forma con número (`t.number = $d OR … IN (SELECT …)`) en las pruebas de número y de posición. **No hubo plan B ni C**; no hay error de pg-mem que anotar. El contrato de `sqlBusquedaTickets` es el del diseño (síncrono, sin `db`).

### Rojos observados (1.4, 1.6, 1.7, 1.8)

- 1.6 `packages/shared/src/busquedaTickets.test.ts`: `Error: Cannot find module './busquedaTickets' imported from '…/packages/shared/src/busquedaTickets.test.ts'`.
- 1.7 (tras 1.5, antes de 1.9) 14 rojas, todas `(0 , leerBusquedaTickets) is not a function` (el helper de la prueba usa la pieza compartida); la de sin filtro nació VERDE (**CARACTERIZACIÓN**, declarada). Tras 1.9 y antes de 1.11, rojos reales de repositorio (los de `getActiveTickets` ya estaban cableados desde 1.5 y pasaron a verde con 1.9):
  - recuento y página 2: `expected 7 to be 5 // Object.is equality`
  - `getAllTickets`: `expected [ 8001, 8002, 8003 ] to deeply equal [ 8001, 8002 ]`
  - (la prueba de posición ya pasaba sólo con activos; su parte de cerrados usa `getClosedTickets(…, f)` y `countClosedTickets(db, f)` que por JS ignoran el argumento extra, y la mutación MP-1 prueba que discrimina).
- 1.8 confrontación (tras 1.9, antes de 1.12): nacen rojos SÓLO los casos de espacios: `'espacios a los lados'` y `'sólo espacios'` → `expected false to be true // Object.is equality`. El resto nace verde (**CARACTERIZACIÓN** de `searchEquipos`). Antes de 1.9 todos eran `(0 , leerBusquedaTickets) is not a function`.

### Verde (1.9 a 1.13)

`packages/shared/src/busquedaTickets.ts` (nuevo) + `export * from './busquedaTickets'` última línea de `index.ts`; `packages/zoho-sync/src/db/busquedaTickets.ts` (nuevo); `repo.ts` y `equipos.ts` editados en su sitio. 1.13: `equipos.test.ts` verde sin tocarlo. Las 4 suites del lote: 72 pruebas pasan (10 shared + 15 repositorio + 11 confrontación + 36 de `equipos.test.ts`).

### Mutaciones (1.14 a 1.23)

Todas con copia de seguridad fuera del repositorio y restauración con `cp` (no `git checkout`); tras la última, `cmp` de los cuatro ficheros contra las copias y `git diff` revisado: ninguna queda. Ficheros de prueba a correr en todas: `packages/zoho-sync/src/db/busquedaTickets.test.ts packages/shared/src/busquedaTickets.test.ts apps/desk/server/db/busquedaConfrontacion.test.ts`.

| # | Fichero · original → mutado | Cae (mensaje literal) |
|---|---|---|
| MP-1 | `zoho-sync/db/busquedaTickets.ts`: `` conNumero ? `(t.number = $${desde} OR ${serial})` : `(${serial})` `` → `` conNumero ? `t.number = $${desde} OR ${serial}` : `${serial}` `` | «posición… (por serial y por equipo)»: `expected [ 6001, 6002, 6004 ] to deeply equal [ 6001, 6002 ]`; «la rama del número…»: `expected [ 6011, 6010 ] to deeply equal [ 6010 ]` |
| MC-1 | mismo fichero: quitar ` OR t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $${p})` de `const serial` | H-1 `expected [] to deeply equal [ 1001 ]`; «serial de equipo corregido» `expected [] to deeply equal [ 4001 ]`; las dos de posición (`[ 6001 ]` vs `[ 6001, 6002 ]`; `[]` vs `[ 6011 ]`) |
| MC-2 | `shared/busquedaTickets.ts`: `numero: n !== null && n <= INTEGER_MAX ? n : null` → `numero: null` | «el número coincide exacto»: `expected [] to deeply equal [ 864 ]`; además 3 unitarias, «dígitos buscan en número Y serial», «sin serial… sí por su número», posición con dígitos |
| MC-3 | mismo: `` `%${q.trim().toLowerCase()}%` `` → `` `${q.trim().toLowerCase()}%` `` | unitarias `expected 'abc-123%' to be '%abc-123%'`; repositorio «últimos dígitos…» `expected [] to deeply equal [ 2001 ]`. **Desvío del diseño:** la confrontación NO se queda verde: cae `'últimos dígitos'` y `'centro del serial'` (`expected false to be true`), porque por mandato de la casilla 1.8 exige además el valor esperado. Sólo la igualdad A = B habría seguido verde |
| MC-4 | `apps/desk/server/db/equipos.ts` línea 60: `const like = patronSerial(q)` → `` const like = `%${q.toLowerCase()}%` `` | confrontación `'espacios a los lados'` y `'sólo espacios'`: `expected false to be true // Object.is equality` |
| MC-5 | `shared/busquedaTickets.ts`: `patron: patronSerial(texto)` → `` patron: `%${texto}%` `` | unitaria `lo que no es sólo dígitos…`; confrontación `'q en mayúsculas contra serial en minú…'` `expected false to be true`; 3 de repositorio |
| MC-6 | `zoho-sync/db/busquedaTickets.ts`: `` `LOWER(t.serial) LIKE `` → `` `t.serial LIKE `` | repositorio «últimos dígitos, centro y serial guardado en mayúsculas» `expected [] to deeply equal [ 2001 ]` (+ 10 más y 4 de confrontación) |
| MC-7 | mismo: `t.number = $${desde}` → `t.number >= $${desde}` | «número coincide exacto» `expected [ 8640, 864 ] to deeply equal [ 864 ]`; «número parcial» `expected [ 8640, 864 ] to deeply equal []` (+3) |
| MC-8 | `repo.ts` línea 173: quitar `${b.and}` de `countClosedTickets` (`…'Closed'` + `` `, b.params ``) | recuento filtrado: `expected 7 to be 5 // Object.is equality` |

**Equivalente descartado (no se dio por bueno):** mover el predicado al otro lado del filtro de estado conserva los paréntesis y el `AND` conmuta; no se probó como posición. La posición válida es MP-1.

### Regla 13, decisión a decisión (1.25; diseño §9 filas 2, 3 y 6 del lote 1)

En el lote 1 no hay cliente: se escribe qué línea del servidor impone cada decisión que el cliente tomará en el lote 2. Líneas remedidas tras el cambio.

| # | Decisión del cliente | Línea del servidor que la impone | Clase |
|---|---|---|---|
| 2 | No filtra por `q` lo recibido | `packages/zoho-sync/src/db/repo.ts:151`, `:166`, `:173`, `:186` (`${b.and}` / `${b.where}`), probado por `busquedaTickets.test.ts` (MC-8 y MP-1 las ponen rojas) | consume |
| 3 | No normaliza (ni `#`, ni minúsculas, ni recorte) | `packages/shared/src/busquedaTickets.ts:29-37` (`leerBusquedaTickets`) y `:16` (`patronSerial`), probado por `packages/shared/src/busquedaTickets.test.ts` y mutaciones MC-2, MC-3, MC-5 | consume |
| 6 | Pagina con el `total` recibido | `repo.ts:173` (`countClosedTickets` con el mismo filtro que `getClosedTickets` en `:166`); el cableado de la ruta (`routes/tickets.ts:109`) es del lote 2 | consume (ruta, en el lote 2) |
| — | Autocompletado de la recepción (S-3) | `apps/desk/server/db/equipos.ts:60` consume `patronSerial`; fijado por `busquedaConfrontacion.test.ts` y MC-4 | consume |

Ninguna decisión queda sólo en el cliente.

### Evidencia TDD (resumen)

| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.3-1.5 | `zoho-sync/src/db/busquedaTickets.test.ts` | Integración (pg-mem) | N/A (nuevo) | Escrita y ejecutada | Pasó | con número / sin número | Sin cambios |
| 1.6, 1.9 | `shared/src/busquedaTickets.test.ts` | Unitaria | N/A (nuevo) | Módulo inexistente | 10/10 | tabla del diseño | Sin cambios |
| 1.7, 1.10, 1.11 | `zoho-sync/src/db/busquedaTickets.test.ts` | Integración (pg-mem) | 3 suites de `repo` antes de editar (línea base global verde) | 14 rojas; luego `expected 7 to be 5` / getAll | 15/15 | posición ×2, paginación, sin filtro | Sin cambios |
| 1.8, 1.12 | `apps/desk/server/db/busquedaConfrontacion.test.ts` | Integración (pg-mem) | `equipos.test.ts` verde | espacios ×2 rojos | 11/11 | 11 casos | Sin cambios |

### Cierre (1.24 a 1.27)

- 1.24: `git diff --numstat`: `repo.ts` 15/15, `equipos.ts` 2/2, `index.ts` 1/0 (la línea admitida); `wc -l` idéntico en `repo.ts` y `equipos.ts`.
- 1.26: `npm test` exit=0 (192 ficheros pasan + 1 omitido; 3.027 pruebas pasan, 2 omitidas = 2.991 + 36 nuevas); `npm run typecheck` exit=0; `npm run lint` exit=0 (165 avisos, 0 errores).
- 1.27: medida: `git diff --shortstat --no-renames 47127ff` = 4 ficheros, 45 inserciones y 44 borrados (89; incluye 27 casillas de `tasks.md`) + `wc -l` de lo nuevo sin trackear: 70 + 86 + 66 + 37 + 196 + 24 = 479. **Total ≈ 568** (tope 800, válvula 720). Sin binarios.

### Desvíos y hallazgos

- MC-3: la confrontación cae (ver tabla); el diseño preveía verde.
- `countClosedTickets` gana el alias `t` (lo manda el diseño §4), así que su SQL SIN filtro no es carácter a carácter el de hoy (`FROM tickets t WHERE t.status_type = 'Closed'` y `params []`); el resultado es el mismo y la prueba de sin filtro lo fija. Los otros tres conservan el SQL idéntico.
- La primera prueba de H-1 usa sólo importación de tipo, así que su rojo es «filtro ignorado» y no «módulo inexistente».
- D12 sin cambios: `listEquiposManage` (`equipos.ts:175`) conserva su patrón propio.
