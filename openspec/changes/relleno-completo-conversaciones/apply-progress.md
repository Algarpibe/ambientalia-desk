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
| M3 | `apps/desk/server/rellenoConversaciones.ts:57` en `6bd57424` | `zoho: filas.filter((f) => !nacidoEnLaApp(f.id))` → `zoho: filas` | 3: «orden ascendente…», «el límite cuenta sólo los de Zoho», «recuento({ desde }) cuenta sin llamar a Zoho» | sha256 `352e03e7…5a78` igual |
| M8 | `packages/zoho-sync/src/sync.ts:179` | quita `if (detalle) return persistTicket(detalle); ` | 6: las 2 de `sync.syncTicketDetalle.test.ts` («con detalle no pide el detalle…», «una fila managed_by_app…») y 4 del módulo («orden…», «una sola petición de detalle por ticket», «desde=3 y limite=2», «el límite cuenta sólo los de Zoho») | sha256 `793c412a…1c44` igual; `git diff --numstat` = `3	3` |
| M9a | `apps/desk/server/rellenoConversaciones.ts:68` en `6bd57424` | `if (res.status === 404) return aNoEsta(numero)` → `if (false) …` (el 404 cae en `!res.ok`) | 1: «un 404 y un isTrashed/isDeleted… salen no está en Zoho» | sha256 igual |
| M9b | `apps/desk/server/rellenoConversaciones.ts:71` en `6bd57424` | `if (verdadero(isDeleted) \|\| verdadero(isTrashed)) …` → `if (false) …` | 1: la misma prueba | sha256 igual |
| M9b' | `apps/desk/server/rellenoConversaciones.ts:71` en `6bd57424` | solo se quita la rama de `isTrashed` (queda `isDeleted`) | 1: la misma prueba (`Z2` y `Z4` llevan `isTrashed`) | sha256 igual |
| Mx | `apps/desk/server/rellenoConversaciones.ts:93` en `6bd57424` | `limite === null ?` → `!limite ?` (`limite=0` tratado como «sin límite») | 1: «limite=0 en el módulo no pide nada…» (la que nació verde) | sha256 igual |

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
| `apps/desk/server/rellenoConversaciones.ts:13` → `sync.ts:178-179` | `syncTicket(id, detalle)` | Cierta |
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

## Lote L2 — estado

Árbol de partida del lote L2: `734e556a` (código de L1 en `6bd57424`). Mismo worktree. Tocados: `apps/desk/server/rellenoConversaciones.ts`,
`apps/desk/server/rellenoConversaciones.test.ts`, el nuevo `apps/desk/server/rellenoConversacionesPausas.test.ts`, este fichero y `tasks.md`.

| Tarea | Estado |
|---|---|
| L2.1 M0 | [x] Hecha por el orquestador sobre `b70c2a76` (`734e556a` sólo añade Markdown): `npm test` → 335 ficheros pasados + 4 omitidos (339), 5.794 pruebas pasadas + 26 omitidas (5.820), 407 s, salida 0 |
| L2.2 ROJO verificación | [x] |
| L2.3 ROJO 429 y corte | [x] |
| L2.4 ROJO concurrencia y resumen | [x] |
| L2.5 ROJO pausas | [x] |
| L2.6 Rojo medido anotado | [x] (abajo) |
| L2.7 `rellenoConversaciones.ts` | [x] |
| L2.8 Verde | [x] focales 30/30; regresiones cercanas 16 ficheros, 145 pruebas; `npm run typecheck` salida 0; `eslint --max-warnings 0` salida 0. La suite entera la corre el orquestador en L2.11 |
| L2.9 Mutaciones | [x] (tabla abajo) |
| L2.10 Casilla de la regla 13 | [x] `git status --short`: ningún fichero bajo `apps/desk/src`; el cliente no decide nada |
| L2.11 Cierre del lote | [ ] del orquestador |
| B.1 Barrido de L2 | [x] (abajo) |

## Rojo medido de L2 (L2.6)

Método: las pruebas finales de L2 contra el módulo de L1 tal como está en `HEAD` (`git show HEAD:apps/desk/server/rellenoConversaciones.ts`
puesto en su sitio durante la pasada y restaurado después, `sha256` igual). El módulo de L1 ya tenía el contrato D6 completo, así que el rojo
es por la CONDUCTA y ninguna salió roja por el arnés. 30 pruebas: 12 rojas, 18 verdes (las 14 de L1 más 4 nacidas verdes, de caracterización).
Una primera pasada del rojo midió «429 agotado en una página» con `expected null to be 2` porque el ayudante de prueba contaba los intentos
por página y no por ticket (nunca disparaba el 429): se corrigió el ayudante y el rojo de abajo es el de la prueba corregida.

Rojas (fichero › grupo › prueba → aserción):

| Fichero | Prueba | Aserción |
|---|---|---|
| `rellenoConversaciones.test.ts` | verificación › una fila de Zoho visible que ya no viene (marcar apagado) | `expected { completo: 1, descuadrado: +0, …(3) } to match object { completo: +0, descuadrado: 1 }` |
| idem | verificación › una fila guardada durante la lectura no se marca | `expected [] to deeply equal [ { numero: 4, esperado: 3, …(1) } ]` |
| idem | 429 › un 429 del detalle dos veces y luego 200 | `expected [ Array(1) ] to deeply equal [ …(3) ]` (L1 lo trata como «con error», una sola petición) |
| idem | 429 › 429 del detalle que agota los reintentos corta | `expected null to be 2` (`cortadoEn`) |
| idem | 429 › 429 agotado en una página corta | `expected null to be 2` (`cortadoEn`) |
| idem | 429 › otro fallo no corta (motivo del primer fallo) | `expected undefined to be 'Zoho /tickets/Z1 500'` |
| idem | 429 › una página fallida deja su motivo | `expected undefined to be 'Zoho /tickets/Z1/conversations 500'` |
| idem | concurrencia › dos `lanzar` seguidos lanzan uno | `expected [ true, true ] to deeply equal [ true, false ]` |
| idem | resumen › una vez a `registrar`, sin asunto, contacto ni empresa | `expected "spy" to be called 1 times, but got 0 times` |
| idem | resumen › al cortarse, una sola llamada a `registrar` | `expected "spy" to be called 1 times, but got 0 times` |
| idem | resumen › sin `registrar`, una línea al logger | `expected "noop" to be called 1 times, but got 0 times` |
| `rellenoConversacionesPausas.test.ts` | un 429 del detalle se repite a los 2000 ms, no antes | `expected [ Array(1) ] to deeply equal [ …(2) ]` |

Nacidas VERDES (caracterización; su detector es la mutación que se indica):

| Prueba | Detector |
|---|---|
| `managed_by_app` con `raw` viejo se juzga por el detalle fresco | M1 |
| la misma fila con marcar encendido queda marcada y sale completo | M2a (también la pone roja la prueba de marcar apagado), M7 |
| una fila `source='app'` no cuenta | M2b |
| `rellenoConversacionesPausas.test.ts` › la pasada espera `PAUSA_ENTRE_TICKETS_MS` entre tickets | Mp2 |

Verde tras L2.7: `npx vitest run apps/desk/server/rellenoConversaciones.test.ts apps/desk/server/rellenoConversacionesPausas.test.ts` → 2 ficheros, 30 pruebas pasadas.

## Mutaciones de L2 (L2.9)

`perl -i -pe '… if $. == N'` (nunca `sed -i`); los dos ficheros de L2 llevan mi edición sin commitear, así que la restauración es con perl
inverso y `sha256sum` igual al de antes (`1b8adfccc8b5…` en todas; `file`: `JavaScript source, Unicode text, UTF-8 text`, LF como antes, sin CRLF).
Líneas de `apps/desk/server/rellenoConversaciones.ts` en el árbol final de este lote.

| Id | Fichero:línea | Cambio | Pruebas rojas | Restauración |
|---|---|---|---|---|
| M1 | `apps/desk/server/rellenoConversaciones.ts:103` | `esperadoDeZoho(detalle)` → `esperadoDeZoho` de `SELECT raw FROM tickets` | 1: «un managed_by_app con raw viejo…» | sha igual |
| M2a | `apps/desk/server/rellenoConversaciones.ts:108` | `await visibles(id)` → ids únicos RECIBIDOS (`new Set(lista.items…).size`) | 2: «fila visible que ya no viene (marcar apagado)» y «fila guardada durante la lectura» | sha igual |
| M2b | `apps/desk/server/rellenoConversaciones.ts:76` | `source='zoho' AND` → `1=1 AND` en la consulta | 1: «una fila source=app no cuenta» | sha igual |
| M6a | `apps/desk/server/rellenoConversaciones.ts:92` | `return 'corte'` → `return aError(numero, 'mutado')` (429 agotado del detalle no corta) | 2: «429 del detalle que agota los reintentos corta» y «al cortarse, una sola llamada a registrar» | sha igual |
| M6b | `apps/desk/server/rellenoConversaciones.ts:105` | `return 'corte'` → `void 0` (`lista.por429` no corta) | 1: «429 agotado en una página corta» | sha igual |
| M7 | `apps/desk/server/rellenoConversaciones.ts:104` | `{ esperado, marcar, inicio }` → `marcar: true` fijo | 1: «fila visible que ya no viene (marcar apagado)» | sha igual |
| P2 | `apps/desk/server/rellenoConversaciones.ts:90` | `res.status === 429` → `res.status === 429 && res.ok` | 4: «429 dos veces y luego 200», «429 agotado en el detalle», «al cortarse, una llamada a registrar» y la de pausas «a los 2000 ms» | sha igual |
| P3 | `apps/desk/server/rellenoConversaciones.ts:101` y `:102` | `inicio` se toma DESPUÉS de leer (`:101` anulado, `const inicio = …` añadido tras `:102`) | 1: «fila guardada durante la lectura no se marca» | sha igual |
| P4 | `apps/desk/server/rellenoConversaciones.ts:143` y `:120` | `enMarcha: true` fuera de `lanzar` y puesto tras el primer `await` (`estado.enMarcha = true` antes de `estado.inicio`) | 1: «dos lanzar seguidos lanzan uno» | sha igual |
| P5 (extra, regla de mutación 1) | `apps/desk/server/rellenoConversaciones.ts:105` | `if (lista.error) …` ANTES de `if (lista.por429) …` | 1: «429 agotado en una página corta» | sha igual |
| Mp1 (extra) | `apps/desk/server/rellenoConversaciones.ts:91` | `await dormir(pausa429Ms)` → `void 0` | 1: pausas «a los 2000 ms, no antes» | sha igual |
| Mp2 (extra) | `apps/desk/server/rellenoConversaciones.ts:125` | `await dormir(pausaMs)` → `void 0` | 1: pausas «espera 150 ms entre un ticket y el siguiente» | sha igual |
| Mv (extra) | `apps/desk/server/rellenoConversaciones.ts:68` | `estado.vistos429++` → `void 0` | 3: «429 dos veces y luego 200», «429 agotado en el detalle», «429 agotado en una página» | sha igual |

Ninguna mutación salió verde: no hizo falta añadir pruebas. Una primera pasada de M2a y M2b corrió sobre un fichero mal restaurado por un
defecto de mi guion (asignaciones de prefijo en el orden equivocado); se restauró con copia byte a byte, se corrigió el guion y las dos se
repitieron: la tabla es la de la repetición. P2 es una mutación equivalente al orden (con `&& res.ok` el 429, que no es `ok`, cae a la guarda
`!res.ok` como si la del 429 fuera detrás); una línea de código no se puede «mover» con `perl` por número de línea.

## Barrido de la regla de mutación 4 (B.1, L2)

Detector: `grep -rnoE "rellenoConversaciones\.ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (sin `node_modules`, `.git`, `dist`, `.codegraph`). Los
únicos hallazgos están en este fichero (seis, todos de L1). Los cinco de la tabla de mutaciones de L1 (`:57`, `:68`, `:71` ×2, `:93`) son
Caso B (histórico: afirman algo cierto de `6bd57424`) y se ANCLARON a esa revisión en vez de renumerarse; el sexto, `:12` → `sync.ts:178-179`
de la tabla del barrido de L1, es Caso A (presente) y se reapuntó a `apps/desk/server/rellenoConversaciones.ts:13`, donde está hoy esa frase.
Segundo pase (abreviadas `:NN` sin nombre de fichero) en los ficheros que citan el módulo (este y los del cambio): sin hallazgos. **Hipótesis**
(lectura humana): el detector no bloquea la forma abreviada.

## Supuestos nuevos (L2)

- **S-22 · Un ticket cortado por 429 no suma a `recorridos` ni a ninguna clase.** El corte deja `cortadoEn` = su número y se relanza con
  `desde=<cortadoEn>`, que lo repite entero por `upsert`. Cómo se deshace: mover `estado.recorridos++` antes del `break` en `pasada`.
- **S-23 · `registrar` por omisión:** `logger.info({ resumen }, texto)` de `apps/desk/server/util/logger.ts` (existe con esa forma: `pino`, nivel
  `silent` bajo `VITEST`). El texto es «relleno-completo-conversaciones: terminada | cortada en el ticket N, X de Y recorridos». Si `registrar`
  lanza, se traga (el resumen no tumba la pasada). También se llama UNA vez cuando falla la consulta inicial (`error`). Cómo se deshace: cambiar
  `registrarEnLog`.
- **S-24 · La consulta de D3 usa `count(*)::int`:** pg-mem la acepta sin cambio, así que no hizo falta una forma alternativa.
- **S-25 · El 429 del detalle y de las páginas se cuenta en `contado`** (envoltorio de toda petición de detalle y de páginas): `vistos429` incluye
  cada 429 visto, también los reintentados. 2 reintentados + 200 ⇒ 2; agotado ⇒ 4 (1 + 3 reintentos). Cómo se deshace: borrar la línea del contador.
- **S-26 · «Fila guardada durante la lectura» (P3) se prueba con la hora real de la base:** el ayudante inserta la fila a mitad de la primera
  página y espera 25 ms reales. Si `created_at` e `inicio` coincidieran en el milisegundo la fila tampoco se marcaría (la guarda es `<`), así que el
  fallo posible es hacia el lado seguro; la mutación P3 la pone roja en la medida (1 de 1). Cómo se deshace: borrar la prueba.
- **S-27 · Se retiran S-17 y S-21 de L1.** `enMarcha` pasa a `true` en `lanzar` antes del primer `await` y el segundo `lanzar` devuelve
  `{ lanzada: false, estado }`; `guardadas` de un descuadrado son las filas visibles de la consulta, ya no los ids recibidos. El estado de partida
  de `lanzar` nunca se rechaza tras terminar: una pasada terminada se puede relanzar.

## Desvíos del diseño (L2)

Ninguno. Matices: (a) el ayudante `servidor` de `apps/desk/server/rellenoConversaciones.test.ts` ganó un tercer parámetro opcional
(`fallos`, `alLeer`, `extra`) sin cambiar las pruebas de L1, que pasan igual; (b) P4 y P3 se mutaron con dos ediciones de línea (quitar y poner),
porque `perl` por número de línea no mueve código.
