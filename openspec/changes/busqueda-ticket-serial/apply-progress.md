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

---

## Lote 2 · Puertas y cliente (intento 2) — casillas 2.1 a 2.22

Commit de partida: `33f08a5` (fusión que apila F1B-07). **2.1:** el orquestador abrió el intento 2 en el registro; este lote no ejecutó `gentle-ai sdd-attempt`. Nada commiteado.

`wc -l` ANTES / DESPUÉS: `routes/tickets.ts` 223 / 223 · `routes/prioridad.ts` 95 / 95 · `db/ticketsConCliente.ts` 40 / 40 · `src/api/client.ts` 808 / 808 · `src/App.tsx` 183 / 183.

### Línea base (2.1) y remedida (2.2)

`npm test` exit=0 (199 ficheros pasan + 1 omitido; 3.138 pruebas pasan, 2 omitidas) · `npm run lint` exit=0 (165 avisos, 0 errores) · `npm run typecheck` exit=2 **medido con el rojo 2.3 ya escrito**: `apps/desk/src/lib/busquedaTickets.test.ts(2,58): error TS2307: Cannot find module './busquedaTickets'`; es el rojo, no el árbol de partida. El mismo comando da exit=0 al cierre (2.21). Hipótesis: la línea base real de `typecheck` en `33f08a5` es 0 (no se midió con el árbol limpio).

Remedida de las líneas del diseño §5 lote 2 sobre `33f08a5`: todas donde dice el diseño (`tickets.ts` 13, 35, 104, 108, 109, 114; `prioridad.ts` 7, 83, 85; `ticketsConCliente.ts` 6, 26-33; `client.ts` 1, 19-20, 25-26, 743-744; `App.tsx` 17, 58, 59, 63, 66, 69, 71, 107).

**S-7 (supuesto del orquestador, por F1B-07):** `App.tsx:69` tiene una tercera rama, `view === 'remision_creada' ? fetchRemisionCreada()`. Esa lista NO admite `q` (ni `/api/remision-creada` ni `fetchRemisionCreada` se tocan). Supuesto razonable y reversible: en la vista `remision_creada` la caja NO se enseña (`{view !== 'remision_creada' && <BuscadorTickets onBuscar={setQ} />}` en la línea 107, delante de `<ViewModeMenu …/>`), y `q` va como argumento de `fetchMisTickets(q)` y `fetchActiveTickets(q)`, no de `fetchRemisionCreada()`.

### Rojos observados (2.3 a 2.5)

- 2.3 `apps/desk/src/lib/busquedaTickets.test.ts`: `Error: Cannot find module './busquedaTickets' imported from '…/apps/desk/src/lib/busquedaTickets.test.ts'`.
- 2.4 `apps/desk/server/busquedaTickets.test.ts`, 10 rojas (la ruta ignora `q`):
  - número: `expected [ '#7', '#864', '#8640' ] to deeply equal [ '#864' ]`
  - últimos dígitos: `expected [ '#1', '#2' ] to deeply equal [ '#1' ]`
  - serial corregido del equipo: `expected [ '#10', '#11' ] to deeply equal [ '#10' ]`
  - `scope=all`: `expected [ '#1', '#2' ] to deeply equal [ '#2' ]`
  - `%23`: `expected [ { id: 't-1', number: '#1', …(19) } ] to deeply equal []`
  - sin segmentar por área: `expected [ '#1', '#2' ] to deeply equal [ '#1' ]`
  - cerrados, total filtrado: `expected 58 to be 55 // Object.is equality`
  - cerrado/activo por número: `expected [ '#865' ] to deeply equal []`
  - «Mis tickets»: `expected [ '#2', '#3', '#1' ] to deeply equal [ '#2', '#1' ]`
  - validación: `expected 200 to be 422 // Object.is equality`
- 2.5 **CARACTERIZACIÓN, nacieron VERDES (declarado):** la `401` de 65 caracteres sin sesión en las dos rutas, y «q ausente, vacío y de espacios dan el mismo cuerpo» en activos, cerrados y «Mis tickets». **Además nació verde** «80 espacios es lo mismo que no buscar» (no estaba entre las rojas previstas: hoy `q` se ignora, así que daba igual). Total: 10 rojas + 3 verdes en ese fichero.

### Verde (2.6 a 2.13)

Nuevos: `apps/desk/src/lib/busquedaTickets.ts`, `apps/desk/server/util/busquedaTickets.ts`, `apps/desk/src/components/BuscadorTickets.tsx`. Editados en su sitio: `ticketsConCliente.ts` (importación de tipo + parámetro opcional `busqueda` en las tres firmas, pasado a `repo`), `routes/tickets.ts` (13, 104, 108, 109, 114; la 35 no se toca), `routes/prioridad.ts` (7, 83, 85), `client.ts` (1, 19-20, 25-26, 743-744; `fetchTickets` sin tocar, D11), `App.tsx` (17, 58, 59, 63, 66, 69, 71, 107). Las dos suites del lote: 20 pruebas pasan (13 de servidor + 7 de `lib`).

### Mutaciones (2.14 a 2.16)

Copias de seguridad fuera del repositorio y restauración con `cp` + `cmp` (no `git checkout`).

| # | Fichero · original → mutado | Cae (mensaje literal) |
|---|---|---|
| MP-2 (tickets) | `routes/tickets.ts:35` `app.use('/api/tickets', requireAuth(db))` → `app.use('/api/tickets', leerBusqueda, requireAuth(db))`; y `:104` `app.get('/api/tickets', leerBusqueda, asyncHandler(` → `app.get('/api/tickets', asyncHandler(` | «MP-2 · 65 caracteres SIN sesión → 401, no 422, en las dos rutas»: `AssertionError: expected 422 to be 401 // Object.is equality` (primera aserción, la de `/api/tickets`) |
| MP-2 (prioridad), por separado | `routes/prioridad.ts:83` `requireAuth(db), leerBusqueda, asyncHandler(` → `leerBusqueda, requireAuth(db), asyncHandler(` | la misma prueba, `expected 422 to be 401`, en la aserción de `/api/mis-tickets` (`busquedaTickets.test.ts:146`). Se probó con `tickets.ts` restaurado, para que la primera aserción no tapara a la segunda |
| MC-9 | `shared/busquedaTickets.ts:33` quitar `if (texto.length > BUSQUEDA_MAX) return { ok: false, error: … }` | HTTP: «65 caracteres con sesión → 422…»: `expected 200 to be 422 // Object.is equality`; unitaria de shared «el tope de 64 se mide sobre el texto YA recortado»: `expected { ok: true, …(1) } to deeply equal { ok: false, …(1) }` |

2.16: tras revertir, `cmp` de `tickets.ts`, `prioridad.ts` y `shared/busquedaTickets.ts` contra sus copias: idénticos; `grep leerBusqueda` en `routes/` da sólo la importación, `prioridad.ts:83` (`requireAuth(db), leerBusqueda,`) y `tickets.ts:104` (ninguna mutación en el árbol); la comprobación de longitud sigue en `busquedaTickets.ts:33`.

### Evidencia TDD (resumen)

| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.3, 2.6 | `apps/desk/src/lib/busquedaTickets.test.ts` | Unitaria | N/A (nuevo) | Módulo inexistente | 7/7 | `?`/`&`, codificación, tres temporizadores | Sin cambios |
| 2.4, 2.5, 2.7-2.10 | `apps/desk/server/busquedaTickets.test.ts` | Integración HTTP (pg-mem) | `tickets.test.ts` y `misTickets.test.ts` verdes (línea base global) | 10 rojas | 13/13 | tres rutas, tres alcances, 401/422 | Sin cambios |
| 2.11-2.13 | — (`.tsx` y `client.ts` fuera de la red por F0-00) | — | typecheck | — | typecheck verde | — | — |

### Cierre (2.17 a 2.22)

- 2.17: `git diff --numstat`: `ticketsConCliente.ts` 7/7, `prioridad.ts` 3/3, `tickets.ts` 5/5, `App.tsx` 8/8, `client.ts` 7/7; `repo.ts` y `equipos.ts`: sin cambios en este lote (`git diff 33f08a5` vacío). `wc -l` idéntico en los cinco. Ninguna línea se movió.
- 2.21: `npm test` exit=0 (201 ficheros pasan + 1 omitido; 3.158 pruebas pasan, 2 omitidas = 3.138 + 20 nuevas); `npm run typecheck` exit=0; `npm run lint` exit=0 (165 avisos, 0 errores).
- 2.22: medida: `git diff --shortstat --no-renames 33f08a5` = 30 inserciones y 30 borrados en las cinco fuentes (60) **más** `tasks.md` (22/22 = 44) y este fichero, + `wc -l` de lo nuevo sin trackear: 160 + 18 + 27 + 54 + 17 = 276. La cifra definitiva la fija el orquestador al medir. Sin binarios.

### Barrido de citas (2.18, regla de mutación 4) — sólo LISTADO

Método: `git grep` de `(ruta/)?(tickets|prioridad|ticketsConCliente|client|App|repo|equipos).tsx?:N(-M)?` sobre todo el repositorio, SIN excluir `openspec/changes/archive/`, filtrado por el nombre con prefijo del fichero editado y quedándose con las citas cuyo rango CUBRE una línea editada en el lote 1 o 2: **122 citas** (69 fuera del archivo, 53 en `archive/`), en 34 ficheros. Como no se movió ninguna línea, ninguna cita de ese conjunto está desplazada; lo que puede estar mal es lo que la frase AFIRMA de una línea cuyo contenido cambió.

**B · histórico (cierto antes, falso hoy; se nombra la revisión `33f08a5`):**
- `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:153` y `docs/sdd/ENTRADA.md:1582`: `routes/tickets.ts:105-114` «sólo acepta `scope` y `page`» → ahora acepta `q`.
- `exploration.md:14` («Sólo lee `scope` y `page`: no hay parámetro de búsqueda») y `:22` (`App.tsx:98-110` «no tiene caja de búsqueda»); `specs/vistas-tablero/spec.md:270` (`App.tsx:98-110`, «hoy sin caja de búsqueda»).
- `equipos.ts:59-74`/`:60` «sin recortar» / «cosa que hoy no hace»: `exploration.md:55`, `proposal.md:33` y `:132`, `specs/vistas-tablero/spec.md:223` y `:232`, `design.md:85` («lo que hace hoy `searchEquipos`»). `equipos.ts:60` es hoy `patronSerial(q)`.
- `archive/2026-09-10-vista-todos-y-estados-en-espera/`: `design.md:167` (`useAsync deps [user.id, view, closedPage]`), `proposal.md:87` (`fetchActiveTickets()`, `App.tsx:58-59`), `tasks.md:227` y `verify-report.md:230` («`App.tsx:58-59` sin cambios»): las líneas 58, 59, 63 y 71 llevan hoy `q`.

**C · superado:** `apply-progress.md:61` (lote 1) «el cableado de la ruta (`routes/tickets.ts:109`) es del lote 2» → cerrado por este lote (`tickets.ts:109` pasa `busquedaDe(res)`).

**A · presente (sigue cierta; el contenido de la línea ganó un argumento o una llamada, pero lo que se afirma de ella es lo mismo):** el resto de las 122. Entre ellas: `Decisiones_Gerencia_2026-09-10.md:197` (`tickets.ts:114` llama a `getActiveTickets`), `Paquete_de_Despliegue_2026-09-10.md:67` y `:213` (`App.tsx:60-72`, `:66` dos peticiones en paralelo), `Paquete_de_Despliegue_2026-10-01.md:744`, `:758`, `:777`, `:778` (`prioridad.ts:20-87`, `:83-86`, `:85`, `App.tsx:69`), `design.md:111`, `:193`, `:266-273`, `proposal.md:104`, `:114`, `:118-121`, `:164`, `exploration.md:10-24` salvo lo dicho en B, las specs vivas `tickets-core/spec.md:107` y `:1701`, `hojas-vida/spec.md:127`, `vistas-tablero/spec.md:27`, y las citas de `archive/` a `repo.ts:151` («abierto», `ORDER BY created_time DESC`), `repo.ts:166`, `prioridad.ts:83-86`/`:85`, `App.tsx:69`, `client.ts:19`/`:25`/`:706-757`, `archive/2026-10-01-prioridad-top5-cliente/design.md:301` (sigue cierto del cambio que describe).
- No se editó ninguna (no se tocan specs vivas ni documentos fechados). La lista completa de las 122 no se copia aquí: se regenera con el patrón de arriba; la clasificación A es por lectura de las frases, no automática (**hipótesis** sobre las del archivo no leídas íntegras: se leyó la línea que contiene la cita, no el párrafo entero).

**Segundo pase (forma abreviada `:NN`):** un grep de las abreviadas cuyo número cae en una línea editada, dentro de los 34 ficheros que ya citan los módulos, da **259 coincidencias (153 en `archive/`)**. **Hipótesis:** casi todas son ruido, porque ese grep no atribuye la abreviada a su fichero (una `:59` puede ser de `App.tsx`, de `equipos.ts` o de otro módulo); no se clasificaron una a una y quedan para lectura humana, con las B de arriba como guía. No se afirma que ninguna esté rota.

### Regla 13, decisión a decisión (2.19; diseño §9, las nueve filas, líneas remedidas tras el cambio)

| # | Qué hace el cliente | Línea del servidor que lo impone (remedida) | Clase |
|---|---|---|---|
| 1 | Envía el texto tal cual | `apps/desk/server/routes/tickets.ts:104` y `apps/desk/server/routes/prioridad.ts:83` (`leerBusqueda`; lee con `apps/desk/server/util/busquedaTickets.ts:9`); la posición detrás de `requireAuth` la fija MP-2 | consume |
| 2 | No filtra por `q` lo recibido | `packages/zoho-sync/src/db/repo.ts:151`, `:166`, `:173`, `:186` (`${b.and}` / `${b.where}`); la ruta pasa el filtro en `routes/tickets.ts:108`, `:109`, `:114` y `routes/prioridad.ts:85` | consume |
| 3 | No normaliza (ni `#`, ni minúsculas, ni recorte) | `packages/shared/src/busquedaTickets.ts:28-37` (`leerBusquedaTickets`) y `:15` (`patronSerial`), llamado sólo desde `leerBusqueda` (`util/busquedaTickets.ts:9`) | consume |
| 4 | `maxLength` 64 en la caja (`BuscadorTickets.tsx:19`) | `422` de `leerBusqueda` por `shared/busquedaTickets.ts:33`, probado por HTTP y por MC-9 | comodidad con imposición probada |
| 5 | Vuelve a la página 1 al cambiar `q` (`App.tsx:59`) | `total` filtrado en `routes/tickets.ts:109`; una página fuera de rango da `items: []` con el `total` filtrado (probado: `page=9`) | comodidad |
| 6 | Pagina con el `total` recibido | `routes/tickets.ts:109` (el mismo `busquedaDe(res)` que `:108`; probado: total 55, página 2 con 5) | consume |
| 7 | Filtro de vista sobre el resultado (`applyBoardView`) | no es guarda; no cambia | vista |
| 8 | «Mis tickets» con `q` (`App.tsx:69`) | `routes/prioridad.ts:85` (`getActiveTickets(db, yo, busquedaDe(res))`, luego `esDeMisTickets`); probado: sólo los del usuario y en el orden de RQ-VT-09 | consume |
| 9 | Espera 300 ms entre pulsaciones y omite `q` si la caja está vacía (`BuscadorTickets.tsx:12`, `conBusqueda`) | sin regla de dominio: `q` ausente, vacío y de espacios dan el mismo cuerpo, probado en las tres rutas | comodidad |

Ninguna decisión queda sólo en el cliente. Añadido por S-7: en `remision_creada` el cliente no enseña la caja (`App.tsx:107`); no es guarda, porque el servidor de esa lista (`routes/prioridad.ts:92-94`) no lee `q`.

### Preguntas para la bandeja (2.20; SIN número: «a numerar por el orquestador»)

1. **S-6 · vista activa:** ¿la búsqueda debe conservarse al cambiar de vista (`q` compartido, lo que hace hoy) o reiniciarse? Supuesto vigente: se conserva el texto.
2. **Número exacto o parcial:** hoy «864» encuentra el ticket 864 por número exacto y el resto por serial (parcial). ¿Debe el número casar también por prefijo o por trozo? Supuesto vigente: exacto.
3. **Relleno de `tickets.serial` en históricos:** los tickets antiguos pueden no tener copia del serial y la búsqueda los encuentra sólo por el equipo enlazado. ¿Se rellena `tickets.serial` en los históricos? Requiere medición previa en producción (cuántos tickets con `serial` nulo y `equipo_id` nulo) y es decisión de persona sobre datos de producción.
4. **Alcance de la paridad con Zoho:** ¿debe la búsqueda cubrir también el asunto, el cliente y el contacto? Supuesto vigente: sólo número y serial.
5. **Remisión creada:** ¿debe la búsqueda cubrir también la lista de Remisión creada? (S-7: hoy la caja no se enseña en esa vista y `/api/remision-creada` no admite `q`.)
6. **Hallazgo D12 (sin destino inventado):** `listEquiposManage` (`apps/desk/server/db/equipos.ts:175`) tiene su propio patrón de serial y no recorta los extremos; es una noción hermana de `patronSerial`. Decide el alcance quien lo asigne.

### Desvíos y hallazgos del lote 2

- Ninguno respecto al diseño en código. `BuscadorTickets.tsx` y los cambios de `client.ts` y `App.tsx` no tienen prueba automática (`.tsx` fuera de la red por F0-00; `client.ts` sólo por typecheck); las comprobaciones de persona de RQ-VT-13 siguen fuera del recuento.
- Los ficheros nuevos van en LF (como los del lote 1); los editados conservan CRLF.
