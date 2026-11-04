# apply-progress — `persistencia-adjuntos` (1G-02)

Modo: Strict TDD. Partida: `ad404b30`. Estado tras el intento i2 (lote L1): L1.1-L1.5, L1.7 y L1.8 hechas; L1.6 (suite entera) y L1.9 (cierre) pendientes del orquestador.

## Lote L1 — intento i2

### L1.1 · M0 (hecha por el orquestador)
`npm test` entero en `ad404b30`: 338 ficheros pasan, 4 omitidos; 5.836 pruebas pasan, 26 omitidas; 466,24 s; código 0.

### Rojo medido (L1.4), contra un esqueleto de `almacen.ts` con las firmas y valores incorrectos (no un import roto)
`rutaAdjunto.test.ts` (10 rojas, esqueleto con `RUTA_ADJUNTO_ZOHO = /^$/` y `dirAdjuntos` → `'x'`):
- › el literal de attachment.ts se encuentra y tiene el mismo texto que la copia › `expected '^\/tickets\/\d+\/(comments|threads)\/…' to be '^$'`
- › `/tickets/100/comments/200/attachments/300/content` → true en la copia › `expected false to be true`
- › `/tickets/1/threads/2/attachments/3/content` → true en la copia › `expected false to be true`
- › (ruta vacía) → false en la copia › `expected true to be false`
- dirAdjuntos (D7) › ausente/vacía, relativa, la propia dist y lo que cuelga, válida, hermana/«..x», sin segundo argumento (6) › `expected 'x' to be null` / `to be '<ruta>'`

`almacen.test.ts` (30 rojas según el informe del agente; el esqueleto devolvía `{estado:'sinRuta'}` y `'sinCopia'`):
- guardarAdjunto › guardado correcto (3), nombre sale del id (2) › `expected { estado: 'sinRuta' } to deeply equal { estado: 'guardado', …}` / `expected [] to deeply equal [ '4002' ]`
- id no numérico (5 casos) › `expected { estado: 'sinRuta' } to deeply equal { estado: 'fallido', motivo: 'id' }`
- bytes contra size (5), sin size (4), UPDATE falla (1) › `expected { estado: 'sinRuta' } to deeply equal {…}`
- fallo a mitad de escritura, rename que falla, directorio ausente › `promise resolved "{ estado: 'sinRuta' }" instead of rejecting`
- ErrorDisco es un Error con name y code › `expected 'Error' to be 'ErrorDisco'`
- estadoCopia (6) › `expected 'sinCopia' to be 'ausente'|'otroTamano'|'presente'`, y `promise resolved "'sinCopia'" instead of rejecting`
- Las que pasaban contra el esqueleto: los 4 casos `sinRuta` (el esqueleto devolvía `sinRuta`; los casos de ruta válida de las demás pruebas triangulan que la guarda discrimina) y los 3 `sinCopia` de `estadoCopia` (triangulados por las pruebas de `ausente`/`presente`). Las pruebas de `NOMBRE_ADJUNTO` pasaron con el esqueleto porque la constante ya era la definitiva (estructural, una sola salida por entrada).

### Verde (L1.5/L1.6 parcial)
- `npx vitest run apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → 2 ficheros pasan, **73 pruebas pasan** (código 0).
- `npm run typecheck` → código 0.
- `npm run lint -- --max-warnings 165` → 165 avisos contra 165 (0 errores), código 0; 0 avisos nuevos.
- La suite entera (resto de L1.6) y las cinco comprobaciones de L1.9 las corre el orquestador.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L1.2/L1.5 guardarAdjunto | `apps/desk/server/adjuntos/almacen.test.ts` | Integración (pg-mem + fs real) | N/A (nuevo) | medido, 30 rojas | 73/73 | varios casos por regla (ids, hrefs, tamaños) | sin cambios |
| L1.2/L1.5 estadoCopia | `apps/desk/server/adjuntos/almacen.test.ts` | Integración (fs real) | N/A (nuevo) | medido | pasa | 9 casos | sin cambios |
| L1.3/L1.5 dirAdjuntos y tabla H5 | `apps/desk/server/adjuntos/rutaAdjunto.test.ts` | Unidad | N/A (nuevo) | medido, 10 rojas | pasa | 11 rutas × 2 expresiones, 6 de dirAdjuntos | sin cambios |

Una corrección dentro del lote: tras el verde, `FilaAdjunto` ganó `name?` y el arnés de pruebas lo pasa en la fila, porque sin él M2a no habría tenido de dónde leer `name` y la prueba «`name` con `../` no influye» no habría sido capaz de caer (mutar el sitio equivocado). `apps/desk/server/adjuntos/almacen.ts:32`.

### Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → código 0, 73 pasan |
| Arnés real | `fs.mkdtemp` en `os.tmpdir()` por prueba, pg-mem con `migrate`, `zohoFetch` falsa; sin frontera HTTP en este lote |
| Frontera de vuelta atrás | borrar `apps/desk/server/adjuntos/` (los tres ficheros nuevos) y revertir los `[x]` de L1 en `tasks.md` |

### Mutaciones (L1.7)
Líneas medidas sobre el `almacen.ts` final (131 líneas, sha256 `7c28c32d…d8e2` idéntico antes y después de cada mutación).

| Id | Fichero:línea mutada | Mutación | Pruebas que caen | Restaurado |
|---|---|---|---|---|
| M2a | `apps/desk/server/adjuntos/almacen.ts:93` | `join(d.dir, fila.id)` → `join(d.dir, String(fila.name ?? fila.id))` | 4: guarda los bytes con el id como nombre…; con la copia ya guardada…; **name con ../ no influye…**; otro name… | sí, copia byte a byte + sha256 igual |
| M2b | `apps/desk/server/adjuntos/almacen.ts:92` | `writeFile(tmp, …)` → `writeFile(join(d.dir, fila.id), …)` | 11, entre ellas name con ../ no influye, **fallo a mitad de escritura (fs inyectado)…** y rename que falla | sí, sha256 igual |
| M3 | `apps/desk/server/adjuntos/almacen.ts:88` | `datos.length !== anunciado` → `false` | 3: **bytes de menos…**, bytes de más…, Content-Length distinto… | sí, sha256 igual |
| M7a | `apps/desk/server/adjuntos/almacen.ts:16` | `\d+` → `\w+` en `RUTA_ADJUNTO_ZOHO` (todas) | 5: el literal de attachment.ts… mismo texto que la copia; 3 rutas «→ false en la copia»; zoho_href `/tickets/abc/…` → sinRuta | sí, sha256 igual |
| P4 | `apps/desk/server/adjuntos/almacen.ts:92` | `UPDATE storage_path` antepuesto a `writeFile`/`rename` | 4: fallo a mitad de escritura; **rename que falla…storage_path sigue nulo (P4)**; directorio ausente; UPDATE falla | sí, sha256 igual |
| M7b | `apps/desk/server/routes/attachment.ts:17` | `\d+` → `\w+` (todas) | 4: el literal… mismo texto que la copia; 3 rutas «→ false en el literal leído de attachment.ts» | sí: mutación revertida con perl por línea; `git diff --stat -- apps/desk/server/routes/attachment.ts` vacío y `file` dice «with CRLF line terminators» |

Script de la tanda: fuera del repositorio, en el scratchpad de la sesión (perl por número de línea, nunca `sed -i`).

**Contraste del orquestador (antes del commit de L1):** recuento medido con la prueba focal fichero a fichero: `apps/desk/server/adjuntos/almacen.test.ts` 37 pruebas y `apps/desk/server/adjuntos/rutaAdjunto.test.ts` 36 (el informe del agente decía 40 y 33; el total, 73, coincide). Mutaciones reproducidas: **M3** (`apps/desk/server/adjuntos/almacen.ts:88`, `datos.length !== anunciado` → `false`) tumba las mismas 3 pruebas (bytes de menos, bytes de más, `Content-Length` distinto) y el sha256 vuelve a `7c28c32d72d2e991…`; **M7b sólo en la primera aparición** de `\d+` en `apps/desk/server/routes/attachment.ts:17` tumba 2 (igualdad del literal con la copia y `/tickets/abc/…` → false en el literal leído); restaurado con `git checkout`, `git diff --stat` vacío y `file` con CRLF. Ojo de método: en esta terminal un `perl -pe 's/\\d\+/…/'` entre comillas simples NO casó el texto `\d+` y dejó el fichero sin mutar; con `\x5c` (`s/\x5cd[+]/\x5cw+/`) sí. Una mutación que no muta da verde y parece «sin detector»: se comprueba con `sed -n Np` antes de correr la suite.

### L1.8 · casilla de la regla 13
`git diff --name-only` → sólo `openspec/changes/persistencia-adjuntos/tasks.md` (las casillas). `git ls-files --others --exclude-standard` → `apps/desk/server/adjuntos/{almacen.test.ts, almacen.ts, rutaAdjunto.test.ts}` y este `apply-progress.md`. Nada bajo `apps/desk/src`.

### Supuestos
1. Respuesta no ok de Zoho: `guardarAdjunto` devuelve `{ estado: 'respuesta', status }` sin escribir; el motor (L3, D4) decide `429`/`404`/otros. Variante no listada en D2: `apps/desk/server/adjuntos/almacen.ts:42` y `:82`.
2. `dirAdjuntos`: «fuera de dist» se decide con `rel === '..' || rel.startsWith('..' + sep)` en vez de «empieza por `..`» del diseño (`apps/desk/server/adjuntos/almacen.ts:129`). *Corregido por el orquestador al contrastar:* el efecto real es que una carpeta HIJA de `dist` llamada `..x` (relativa `..x`) se rechaza, cuando la lectura literal de D7 la daría por buena; la prueba de `apps/desk/server/adjuntos/rutaAdjunto.test.ts:70-75` fija una hermana (`dist-otro`) y una `..x` HERMANA (relativa `../..x`), que salen fuera con las dos lecturas. La hija `..x` no tiene prueba; la variante es más estricta que D7, no menos.
3. `guardarAdjunto` captura cualquier error de `zohoFetch`/`arrayBuffer` como `fallido:red` (incluida la lectura del cuerpo).
4. Se añade `name?` a `FilaAdjunto` sólo para poder probar que no interviene.

### Cierre del lote L1 (L1.6 y L1.9, orquestador, sobre `b0cbae47`)
- `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**; detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` 0; `npm run build` 0 (`index-F1jDYjEU.js` 427,51 kB, el mismo bundle: L1 no toca el cliente).
- `npm test`, pasada 1: memoria libre al arrancar **10.863 MB**, duración **463 s**, código **0**; 340 ficheros pasan y 4 omitidos; 5.909 pruebas pasan y 26 omitidas (las 5.836 de M0 más las 73 nuevas). Desde el 04/11 no hay compuerta de memoria (corrección del usuario al encargo 17): se anotan memoria al arrancar, duración y código de cada pasada. Una pasada anterior, con la compuerta aún vigente, no se lanzó con 9.160 MB.
- Medida del intento i2 contra `ad404b30` (`git diff --shortstat --no-renames`): el commit de L1 son 5 ficheros, +541 −7 = 548; este cierre suma `tasks.md` y `apply-progress.md`, y la medida final va en la evidencia del asiento. Sin trackear: 0.
- Barrido B.1: L1 no edita ningún fichero muy citado. `apps/desk/server/routes/attachment.ts` sólo se mutó y se restauró: sus citas `:14`, `:17` y `:21-30` (esta, anclada en `d26ef8a5`) siguen diciendo lo que afirman. Las nueve citas `apps/desk/server/adjuntos/almacen.ts:NN` de este fichero (ocho líneas distintas; `:92` dos veces) se comprobaron contra el fichero: `:16`, `:32`, `:42`, `:82`, `:88`, `:92`, `:93` y `:129` dicen lo que afirman.
