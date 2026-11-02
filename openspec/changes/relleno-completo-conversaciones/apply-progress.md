# apply-progress — `relleno-completo-conversaciones` (1G-01, `cierra: si`)

Modo: `strict_tdd`, artifact store `hybrid`. Árbol de partida del lote L1: `5ce2f54b`. Worktree propio
(`C:\dev\Desk_2_R1.023-worktrees\relleno-completo-conversaciones`). Este fichero se FUSIONA en los lotes siguientes, no se sobrescribe.

## Lote L1 — estado

| Tarea | Estado |
|---|---|
| L1.1 M0 | [x] Hecha por el orquestador en `5ce2f54b`: `npm test` → 333 ficheros pasados + 4 omitidos (337), 5776 pruebas pasadas + 26 omitidas (5802), 417 s, salida 0. Una primera pasada salió 1 SÓLO por dos `Timeout calling "onTaskUpdate"` con todo verde (546 s) |
| L1.2 ROJO `sync.syncTicketDetalle.test.ts` | [x] |
| L1.3 ROJO `rellenoConversaciones.test.ts` (recorrido) | [x] |
| L1.4 ROJO mismo fichero (detalle, clases) | [x] |
| L1.5 Rojo medido anotado | [x] (abajo) |
| L1.6 `sync.ts:18`, `:178`, `:179` en sitio | [x] `git diff --numstat` = `3	3`; `:180` sigue siendo el `throw` (`if (!res.ok) throw new Error(...)`) |
| L1.7 `rellenoConversaciones.ts` | [x] |
| L1.8 Verde | [x] los dos ficheros nuevos 18/18; `npm run typecheck` salida 0 (la hipótesis de tipos de D2 se confirma). La suite entera la corre el orquestador en L1.11 |
| L1.9 Mutaciones | [x] (tabla abajo) |
| L1.10 Casilla de la regla 13 | [x] (abajo) |
| L1.11 Cierre del lote | [x] Orquestador, sección «Cierre de L1» al final |
| B.1 Barrido | [x] (abajo) |

## Rojo medido (L1.5)

Método: antes de escribir producción, `packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` contra el `sync.ts` sin tocar, y
`apps/desk/server/rellenoConversaciones.test.ts` contra un ESQUELETO del módulo (los tipos del contrato D6 ya finales, `lanzar` que
termina al instante sin hacer nada y `recuento` que devuelve ceros). El esqueleto existe para que el rojo sea por la CONDUCTA y no por un
`import` roto. Ninguna salió roja por el arnés.

`packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` (2 rojas, 2 verdes de caracterización):

| Prueba | Resultado | Aserción / mensaje |
|---|---|---|
| con detalle no pide el detalle del ticket y deja la fila persistida | ROJA | `Zoho /tickets/T1 500` lanzado desde `sync.ts:180` (hizo la petición que no debía) |
| con detalle, una fila managed_by_app conserva su fila | ROJA | mismo error `Zoho /tickets/T1 500` |
| sin detalle hace lo de hoy: una petición de detalle con include y la persiste | verde (caracterización) | fija lo que ya hacía |
| sin detalle y con respuesta no ok sigue lanzando el error de hoy | verde (caracterización) | fija el `throw` de `:180` |

`apps/desk/server/rellenoConversaciones.test.ts` (13 rojas, 1 verde de nacimiento):

| Prueba | Resultado | Aserción |
|---|---|---|
| recorrido › orden ascendente por number, archivados incluidos, sin app- ni /tickets | ROJA | `expected [] to deeply equal [ …(3) ]` |
| recorrido › una sola petición de detalle por ticket | ROJA | `expected [] to have a length of 3 but got +0` |
| recorrido › desde=3 y limite=2 sólo piden los detalles de 3 y 4 | ROJA | `expected [] to deeply equal [ …(2) ]` |
| recorrido › limite=0 en el módulo no pide nada ni escribe nada y termina | VERDE al nacer | el esqueleto tampoco hace nada; es de caracterización y su detector está en la mutación Mx de abajo |
| recorrido › el límite cuenta sólo los de Zoho (app- dentro del tramo) | ROJA | `expected [] to deeply equal [ …(2) ]` |
| recorrido › recuento({ desde }) cuenta sin llamar a Zoho | ROJA | `expected { aRecorrer: +0, saltadosApp: +0 } to deeply equal { aRecorrer: 5, saltadosApp: 2 }` |
| detalle › persiste el detalle fresco por syncTicket | ROJA | `expected 'Viejo' to be 'Fresco'` |
| detalle › 404 e isTrashed/isDeleted sin escribir ni leer ni marcar | ROJA | `expected [] to deeply equal [ 1, 2, 3, 4 ]` |
| detalle › un 500 del detalle cuenta como «con error» y sigue | ROJA | `expected [] to deeply equal [ 1 ]` |
| lectura › archivado tipo #300 (7 + 1) completo | ROJA | `expected { completo: +0, descuadrado: +0, …(3) } to match object { completo: 1, descuadrado: +0 }` |
| lectura › descuadrado con número, esperado y guardadas | ROJA | `expected { completo: +0, descuadrado: +0, …(3) } to match object { completo: +0, descuadrado: 1 }` |
| lectura › sin threadCount sale «sin recuento» | ROJA | `expected [] to deeply equal [ 5 ]` |
| lectura › página que responde 500 sale «con error» y sigue | ROJA | `expected [] to deeply equal [ 2 ]` |
| lectura › cuenta las peticiones de detalle y de páginas, no las de contacto ni cuenta | ROJA | `expected false to be true` (no hubo petición de contacto: nada se procesó) |

Verde tras L1.6-L1.7: `npx vitest run apps/desk/server/rellenoConversaciones.test.ts packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` →
2 ficheros, 18 pruebas pasadas.

## Mutaciones de L1 (L1.9)

`perl -i -pe '… if $. == N'`, restauración con perl inverso y `sha256sum` igual al de antes. `sync.ts` es CRLF en el árbol de trabajo
(434 líneas todas CRLF antes y después; el repositorio guarda LF, `git diff` no muestra cambios de final de línea) y el módulo es LF; no se
usó `sed -i`. `sync.ts` no se restauró con `git checkout` porque lleva la edición del lote.

| Id | Fichero:línea | Cambio | Pruebas rojas | Restauración |
|---|---|---|---|---|
| M3 | `apps/desk/server/rellenoConversaciones.ts:57` | `zoho: filas.filter((f) => !nacidoEnLaApp(f.id))` → `zoho: filas` | 3: «orden ascendente…», «el límite cuenta sólo los de Zoho», «recuento({ desde }) cuenta sin llamar a Zoho» | sha256 `352e03e7…5a78` igual |
| M8 | `packages/zoho-sync/src/sync.ts:179` | quita `if (detalle) return persistTicket(detalle); ` | 6: las 2 de `sync.syncTicketDetalle.test.ts` («con detalle no pide el detalle…», «una fila managed_by_app…») y 4 del módulo («orden…», «una sola petición de detalle por ticket», «desde=3 y limite=2», «el límite cuenta sólo los de Zoho») | sha256 `793c412a…1c44` igual; `git diff --numstat` = `3	3` |
| M9a | `apps/desk/server/rellenoConversaciones.ts:68` | `if (res.status === 404) return aNoEsta(numero)` → `if (false) …` (el 404 cae en `!res.ok`) | 1: «un 404 y un isTrashed/isDeleted… salen no está en Zoho» | sha256 igual |
| M9b | `apps/desk/server/rellenoConversaciones.ts:71` | `if (verdadero(isDeleted) \|\| verdadero(isTrashed)) …` → `if (false) …` | 1: la misma prueba | sha256 igual |
| M9b' | `apps/desk/server/rellenoConversaciones.ts:71` | solo se quita la rama de `isTrashed` (queda `isDeleted`) | 1: la misma prueba (`Z2` y `Z4` llevan `isTrashed`) | sha256 igual |
| Mx | `apps/desk/server/rellenoConversaciones.ts:93` | `limite === null ?` → `!limite ?` (`limite=0` tratado como «sin límite») | 1: «limite=0 en el módulo no pide nada…» (la que nació verde) | sha256 igual |

Ninguna mutación salió verde: no hizo falta añadir pruebas.

## Casilla de la regla invariable 13 (L1.10)

`git status --short` / `git diff --name-only` en el worktree: ningún fichero bajo `apps/desk/src`. El cliente no decide nada (no hay pantalla).
Lo único que toca el lote es servidor (`apps/desk/server/rellenoConversaciones.ts`) y `packages/zoho-sync/src/sync.ts`.

## Barrido de la regla de mutación 4 (B.1)

Detector: `grep -rnoE "[A-Za-z./_-]*sync\.ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (excluidos `node_modules`, `.git`, `dist`,
`.codegraph`), 208 hallazgos de `…sync.ts:N`, de los que se descartó lo que no es `packages/zoho-sync/src/sync.ts` (`hubSync`,
`booksHub/sync.ts`). Se compararon los rangos contra las líneas 18, 178, 179 y 180. Hallazgos que las cubren, leídos contra lo que AFIRMAN:

| Cita | Afirma | Veredicto |
|---|---|---|
| `openspec/specs/zoho-sync/spec.md:367` y `:754`, `openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/design.md:10` → `sync.ts:14-24` | la interfaz `Sync` (inventario de entidades) | Cierta: `:14-24` sigue siendo `interface Sync` (`:18` cambió en sitio) |
| `openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/proposal.md:45` → `sync.ts:178-182` | el cuerpo de `syncTicket`, que relee por detalle | Cierta: `:178-182` sigue siendo `syncTicket` y, sin `detalle`, hace lo mismo |
| `openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/design.md:16` → `sync.ts:179` | el detalle es la misma petición que usa `syncTicket` | Cierta: `:179` conserva la petición de detalle tras `if (detalle) return persistTicket(detalle);` |
| `openspec/changes/relleno-completo-conversaciones/{proposal.md:52,:112; design.md:20,:30,:35,:154,:169; tasks.md}` → `:179`, `:180`, `:18`, `:178` | el diseño y las tareas de este cambio | Ciertas: `:179` sigue siendo la petición de detalle y `:180` el `throw` |
| `proposal.md:52` → `:187` (abreviada) y `conversaciones.ts:70` | `syncConversations` lee sin reintentos | Cierta: `sync.ts:187` es `leerConversaciones(zohoFetch, id)` y no se movió (mismo número de líneas) |
| `apps/desk/server/rellenoConversaciones.ts:12` → `sync.ts:178-179` | `syncTicket(id, detalle)` | Cierta |
| `spec.md:368` → `booksHub/sync.ts:8-18` | otro fichero (Books) | No aplica |

Segundo pase (abreviadas, `:18`/`:178`/`:179`/`:180` sin nombre de fichero) en los ficheros que citan `sync.ts` (los tres de `openspec/changes/archive/2026-10-06-sync-tickets-por-modificacion/`,
`openspec/specs/zoho-sync/spec.md`, los del propio cambio): sin hallazgos nuevos aparte de los de la tabla; las demás abreviadas
`:178`/`:179` del repositorio son de `repo.ts`, `schema.sql` y `books/repo.ts`, no de `sync.ts`. Como la sustitución fue en sitio y con
el mismo número de líneas, ninguna otra línea de `sync.ts` se desplazó. **Hipótesis** (lectura humana, sin detector): el detector de citas
no bloquea la forma abreviada.

## Supuestos nuevos

- **S-16 · El esqueleto de arranque del módulo.** Para que las pruebas de L1 nazcan rojas por la conducta se escribió primero un
  esqueleto con los tipos de D6 y se sustituyó por el módulo real; no queda rastro en el árbol final. Cómo se deshace: no hay nada que deshacer.
- **S-17 · `enMarcha` pasa a `true` DESPUÉS del primer `await` (la consulta del tramo) y `lanzar` no rechaza el segundo.** Es el estado
  deliberado de L1, porque `enMarcha` antes del primer `await` y el rechazo son de L2 (P4 y la prueba de dos `lanzar`). `lanzar` devuelve una
  copia del estado en `{ lanzada: true }` siempre. Cómo se deshace: L2.7 mueve la asignación y añade la guarda.
- **S-18 · `peticiones` se cuenta ya en L1** (envoltorio `contado` de D3, que cubre detalle y páginas); `vistos429` queda en 0 hasta L2, que
  es quien cuenta y reintenta el 429 del detalle. Un 429 del detalle en L1 cae en «con error». Cómo se deshace: borrar el contador.
- **S-19 · `inicio` y `fin` del estado** son cadenas ISO tomadas del reloj del proceso al empezar (tras la consulta del tramo) y al terminar;
  no se tocan por lo demás. El resumen y la línea de log son de L2.
- **S-20 · La prueba `limite=0` del módulo nació verde** (el esqueleto tampoco recorría nada). Se conserva como caracterización y su detector
  es la mutación Mx (`limite === null` → `!limite`), que la pone roja. Cómo se deshace: borrar la prueba.
- **S-21 · `guardadas` de un descuadrado cuenta, en L1, los ids ÚNICOS RECIBIDOS** (el `Set` de la lista), no las filas visibles. L2 lo sustituye
  por la consulta de D3 y es exactamente lo que M2 reintroducirá.

## Desvíos del diseño

Ninguno. Dos matices: (a) `tramo()` castea `number` con `Number()` por si pg-mem lo devolviera como texto (D4 no lo decía); (b) el módulo
copia `dormir` y `readData` de `conversaciones.ts:59` y `:13` porque ninguno se exporta (no se tocó `conversaciones.ts`, D12).

## Cierre de L1 (L1.11, orquestador)

Sobre `b70c2a76` (código en `6bd57424`; `b70c2a76` sólo repara siete citas de este fichero, escritas con `…/` y que el detector daba
por «fichero inexistente»), en serie:

| Comprobación | Salida | Dato |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint -- --max-warnings 165` | 0 | 165 avisos contra 165: ninguno nuevo |
| detector `--sha HEAD` | 0 | 7.875 citas comprobadas; 14 abreviadas rotas informativas, las mismas 14 ficheros que en `5ce2f54b` |
| `npm run build` | 0 | `index-F1jDYjEU.js` 427,51 kB, el mismo bundle: L1 no toca el cliente |
| `npm test` | 0 | 335 ficheros pasados + 4 omitidos (339), 5.794 pruebas pasadas + 26 omitidas (5.820), 407 s; memoria antes, 14.282 MB |

Contraste del orquestador: M8 reproducida (`perl` en `packages/zoho-sync/src/sync.ts:179`), 6 rojas, las mismas que la tabla de arriba;
restaurada con `git checkout`, `git diff` vacío y el fichero sigue CRLF.
