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
| L2.11 Cierre del lote | [x] Orquestador, sección «Cierre de L2» al final |
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

## Cierre de L2 (L2.11, orquestador)

Sobre `16f54ec4`, en serie:

| Comprobación | Salida | Dato |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint -- --max-warnings 165` | 0 | 165 avisos contra 165: ninguno nuevo |
| detector `--sha HEAD` | 0 | 7.895 citas comprobadas; las mismas 14 abreviadas rotas informativas de `5ce2f54b` |
| `npm run build` | 0 | `index-F1jDYjEU.js` 427,51 kB, el mismo bundle: L2 no toca el cliente |
| `npm test` | 0 | 336 ficheros pasados + 4 omitidos (340), 5.810 pruebas pasadas + 26 omitidas (5.836), 441 s; memoria antes, 13.891 MB |

Contraste del orquestador: M2a reproducida (`perl` en `apps/desk/server/rellenoConversaciones.ts:108`, contar los ids únicos recibidos en
vez de `visibles(id)`), 2 rojas, las mismas que la tabla de L2; restaurada con `perl` inverso y el mismo `sha256`.

## Lote L3 — estado

Árbol de partida del lote L3: `82649404` (código de L2 en `16f54ec4`; `82649404` sólo añade Markdown). Mismo worktree. Tocados: `packages/zoho-sync/src/config.ts`,
`packages/zoho-sync/src/config.test.ts`, `apps/desk/server/app.ts`, `apps/desk/server/testing/appHarness.ts`, `apps/desk/server/opcionesConversaciones.test.ts`,
`apps/desk/server/deployConversaciones.test.ts`, `DEPLOY.md`, `debt.md`, los nuevos `apps/desk/server/routes/rellenoConversaciones.ts`,
`apps/desk/server/rellenoConversacionesRutas.test.ts` y `apps/desk/server/deployRellenoConversaciones.test.ts`, este fichero y `tasks.md`.

| Tarea | Estado |
|---|---|
| L3.1 M0 | [x] Hecha por el orquestador sobre `16f54ec4` (`82649404` sólo añade Markdown): `npm test` → 336 ficheros pasados + 4 omitidos (340), 5.810 pruebas pasadas + 26 omitidas (5.836), 441 s, salida 0 |
| L3.2 ROJO `config.test.ts` | [x] |
| L3.3 ROJO `opcionesConversaciones.test.ts` | [x] |
| L3.4 ROJO `rellenoConversacionesRutas.test.ts` | [x] |
| L3.5 ROJO `deployRellenoConversaciones.test.ts` | [x] |
| L3.6 Rojo medido anotado | [x] (abajo) |
| L3.7 `config.ts`, `app.ts`, `appHarness.ts` en sitio | [x] `git diff --numstat 82649404`: `config.ts` 2/2, `app.ts` 4/4, `appHarness.ts` 2/2 (inserciones = borrados); los tres siguen CRLF |
| L3.8 `routes/rellenoConversaciones.ts` | [x] |
| L3.9 `DEPLOY.md` §21 | [x] sólo añade (32/0); `.env.example` sin tocar |
| L3.10 Guarda que cuenta el árbol | [x] `deployConversaciones.test.ts:20` y `:23` en sitio (2/2, CRLF); rojo previo medido abajo |
| L3.11 `debt.md` | [x] `:602`, `:614`, `:616-617` en sitio (4/4, CRLF); `:631-634` sin tocar |
| L3.12 Verde | [x] focales y regresiones cercanas (abajo); `npm run typecheck` salida 0; eslint (abajo). La suite entera la corre el orquestador en L3.15 |
| L3.13 Mutaciones | [x] (tabla abajo) |
| L3.14 Casilla de la regla 13 y regla de mutación 3 | [x] (abajo) |
| L3.15 Cierre del lote | [x] Orquestador, sección «Cierre de L3» al final |
| B.1 Barrido de L3 | [x] (abajo) |

## Rojo medido de L3 (L3.6)

Método: las pruebas finales de L3 contra el árbol de `82649404` + las pruebas (sin tocar producción ni `DEPLOY.md`). Los dos ficheros de pruebas
de rutas y de `DEPLOY.md` se ejecutaron de verdad; ninguna salió roja por el arnés: las rojas de las rutas son un `404` con el cuerpo del
comodín `{ error: 'Ruta de API no encontrada' }` (la ruta no existe), no un fallo de importación. 26 rojas de 44 (las 18 verdes son las
anteriores de `config.test.ts` y `opcionesConversaciones.test.ts`).

| Fichero › prueba | Aserción medida |
|---|---|
| `config.test.ts` › nace cerrado: sin la variable, o vacía | `expected undefined to be false` |
| `config.test.ts` › sólo el literal "true" lo enciende | `false: expected undefined to be false` |
| `config.test.ts` › es independiente de los dos interruptores… | `expected [ undefined, false, false ] to deeply equal [ true, false, false ]` |
| `opcionesConversaciones.test.ts` › crearRellenoConversaciones pasa `opcionesConversaciones(config).marcarAusentes`… | `expected '' to contain 'marcar: opcionesConversaciones(config…'` (la línea no existe) |
| `opcionesConversaciones.test.ts` › el interruptor del relleno llega a la ruta como booleano estricto | `expected '' to contain 'habilitado: config.rellenoConversacio…'` |
| `rellenoConversacionesRutas.test.ts` › sin sesión, 401 en POST y en GET | `expected 404 to be 401` |
| idem › un usuario que no es superadministrador… 403 en POST y en GET | `expected 404 to be 403` |
| idem › con el interruptor cerrado, el rol va ANTES | `expected 404 to be 403` |
| idem › POST cerrado: 403 que nombra la variable y ofrece limite=0 | `expected 404 to be 403` |
| idem › cerrado y limite=abc: 403 y no 400 | `expected 404 to be 403` |
| idem › cerrado y desde=abc&limite=5: 403 y no 400 | `expected 404 to be 403` |
| idem › el GET no lo gobierna el interruptor | `expected 404 to be 200` |
| idem › limite no numérico, negativo, decimal o vacío: 400 | `limite=abc: expected 404 to be 400` |
| idem › desde no numérico: 400 | `expected 404 to be 400` |
| idem › limite=0 sólo cuenta (abierto=false / abierto=true) | `expected 404 to be 200` ×2 |
| idem › con desde=3 cuenta sólo del 3 en adelante | `expected { error: 'Ruta de API no encontrada' } to deeply equal { aRecorrer: 3, saltadosApp: 1 }` |
| idem › limite=0 de un no superadministrador sigue siendo 403 | `expected 404 to be 403` |
| idem › el GET sin pasada devuelve «sin pasada» y NO lanza | `expected 404 to be 200` |
| idem › el POST responde SIN esperar la pasada | `expected 404 to be 200` |
| idem › el POST pasa desde y limite a la pasada | `expected 404 to be 200` |
| idem › un segundo POST con la pasada en marcha no lanza otra | `expected undefined to be true` |
| `deployRellenoConversaciones.test.ts` › la sección existe, tras la §20, y es la última | `expected -1 to be greater than -1` |
| idem › dice qué enciende y qué se rompe | `expected '' to contain '**Qué enciende:**'` |
| idem › nace cerrado… línea de entorno vacía | `expected '' to contain '**Nace cerrado**'` |
| idem › pide la copia previa de desk-db… | `expected '' to contain 'Copia previa de `desk-db`'` |

Rojo de la guarda que cuenta el árbol (L3.10), medido DESPUÉS de escribir la §21 y ANTES de corregir `deployConversaciones.test.ts`:
`deployConversaciones.test.ts` › las tres secciones existen tras la §17, en orden, y la §20 es la última → `expected [ '## 20.', '## 21.' ] to have a length of 1 but got 2`
(la única roja de los dos ficheros de `DEPLOY.md`; las demás de ese fichero seguían verdes). Es el rojo que D8 predijo en `:27`.

Dos defectos de MIS pruebas, corregidos antes del verde y que no son rojo del arnés de producción: (a) `limite=0 sólo cuenta` pedía `adminCookie()` dos
veces en la misma prueba y el arnés (`instalarArnes`/`createUser`) falla con la segunda por usuario duplicado (`insert into "users"…`), así que se
guarda la `cookie` una vez; (b) una sustitución mía con `perl` dejó un `XX` suelto en una línea que se reparó a mano. Tras ambas, 40/40.

Verde tras L3.7-L3.11: `npx vitest run apps/desk/server/deploy*.test.ts packages/zoho-sync/src/config.test.ts apps/desk/server/opcionesConversaciones.test.ts
apps/desk/server/rellenoConversaciones*.test.ts` → 9 ficheros, 93 pruebas pasadas.

## Mutaciones de L3 (L3.13)

`perl -i -pe '… if $. == N'` (nunca `sed -i`). Restauración por copia byte a byte de una copia hecha antes de mutar (equivale al perl inverso) y `sha256sum`
igual al de antes; `file` comprobado (`app.ts`, `config.ts` y `DEPLOY.md` siguen CRLF; los demás LF como antes). Líneas del árbol final de este lote.

| Id | Fichero:línea | Cambio | Pruebas rojas | Restauración |
|---|---|---|---|---|
| M3 | `apps/desk/server/rellenoConversaciones.ts:61` | `zoho: filas.filter((f) => !nacidoEnLaApp(f.id))` → `zoho: filas` (ya no se filtra `app-`) | 4: `limite=0` abierto=false, abierto=true, `desde=3` y «el POST responde SIN esperar…» (`aRecorrer` 6 en vez de 5) | sha `1b8adfccc8b59f0e…` igual |
| M4 | `packages/zoho-sync/src/config.ts:125` | `env.RELLENO_CONVERSACIONES_HABILITADO === 'true'` → `!== 'false'` | 4: las 3 de `config.test.ts` y «nace cerrado… el código lo lee así» de `deployRellenoConversaciones.test.ts` | sha `e326941b60cd32a4…` igual; CRLF |
| M5 | `apps/desk/server/routes/rellenoConversaciones.ts:47` | el `GET` llama a `relleno.lanzar({})` antes de `res.json(relleno.estado())` | 5: «el GET sin pasada… NO lanza», «el GET no lo gobierna el interruptor», «un usuario que no es superadministrador… no se lanza nada» y las dos de `limite=0` (el `GET` final ve `enMarcha: true`) | sha `86b1222c023d630a…` igual |
| M7 | `apps/desk/server/app.ts:50` | `marcar: opcionesConversaciones(config).marcarAusentes === true` → `marcar: true` | 1: «crearRellenoConversaciones pasa opcionesConversaciones(config).marcarAusentes…» (fichero vigilado, regla de mutación 2) | sha `23c7126b5bd19b96…` igual; CRLF |
| M10a | `DEPLOY.md:884` | se quita `**Qué enciende:**` de la §21 | 1: «dice qué enciende y qué se rompe si se pone mal» | sha `a87d49213fae7b85…` igual; CRLF |
| M10b | `DEPLOY.md:872` | `Copia previa de` → `Copia de` en la §20 | 1: «la §20 pide la copia previa de desk-db y nombra la ruta del relleno» (`deployConversaciones.test.ts`; sin la acotación de `:20` seguiría verde porque la §21 trae la misma frase) | sha igual; CRLF |
| P1 (posición) | `apps/desk/server/routes/rellenoConversaciones.ts:36` y `:38` | `interruptorRelleno(habilitado)` fuera de la cadena y la misma guarda puesta DESPUÉS de la validación | 3: «POST cerrado…», «cerrado y limite=abc: 403 y no 400» y «cerrado y desde=abc&limite=5: 403 y no 400» | sha `86b1222c023d630a…` igual |
| Pr (extra, regla de mutación 1) | `apps/desk/server/routes/rellenoConversaciones.ts:36` | `interruptorRelleno` ANTES de `requireSuperAdmin` | 1: «con el interruptor cerrado, el rol va ANTES…» | sha igual |
| Mx1 (extra) | `apps/desk/server/routes/rellenoConversaciones.ts:17` | `!habilitado && req.query.limite !== '0'` → `!habilitado` (el recuento ya no es libre) | 2: `limite=0` abierto=false y `desde=3` | sha igual |

Ninguna mutación salió verde: no hizo falta añadir pruebas. Una primera pasada de Mx1 apuntó a la línea 16 por error (la línea es la 17), el `sha256` no cambió
y la prueba pasó: era una no-mutación, se repitió en la 17 y es la fila de la tabla.

## Comprobaciones de L3 (L3.12)

- `npm run typecheck`: salida 0.
- `npx eslint --max-warnings 0` sobre los ficheros `.ts` tocados y nuevos: salida 1 SÓLO por 8 avisos `no-explicit-any` de `packages/zoho-sync/src/config.test.ts` en
  las líneas `:67`-`:97`, que ya estaban antes de este lote (mi bloque empieza en la `:141`); el resto de los ficheros, 0 avisos. Delta de avisos del lote: 0 (el
  repo sigue en el tope de 165).
- Regresiones cercanas: `apps/desk/server/deploy*.test.ts`, `packages/zoho-sync/src/config.test.ts`, `apps/desk/server/opcionesConversaciones.test.ts`,
  `apps/desk/server/admin.test.ts`, `apps/desk/server/rellenoConversaciones*.test.ts`, `apps/desk/server/backfill.test.ts` y `apps/desk/server/auth/routes.test.ts`
  → 12 ficheros, 147 pruebas pasadas, salida 0.

## Casilla de la regla invariable 13 y regla de mutación 3 (L3.14)

`git diff --name-only 82649404` y `git status --short`: ningún fichero bajo `apps/desk/src`. El cliente no decide nada (no hay pantalla). Decisiones y la línea del servidor que las impone:

| Decisión | Quién | Línea del servidor |
|---|---|---|
| Hay sesión | servidor | `requireAuth` (`apps/desk/server/auth/middleware.ts:14`), en la cadena de `apps/desk/server/routes/rellenoConversaciones.ts:36` y `:46`; probada por «sin sesión, 401» |
| Sólo superadministrador | servidor | `requireAdmin` (`apps/desk/server/auth/middleware.ts:26`) importado como `requireSuperAdmin`, `apps/desk/server/routes/rellenoConversaciones.ts:36` y `:46`; probada en POST y GET |
| El interruptor cerrado impide lanzar | servidor | `interruptorRelleno`, `apps/desk/server/routes/rellenoConversaciones.ts:17`, leído de `packages/zoho-sync/src/config.ts:125` y cableado en `apps/desk/server/app.ts:57`; probada su posición (P1, Pr) |
| `limite=0` sólo cuenta | servidor | `apps/desk/server/routes/rellenoConversaciones.ts:39` (`relleno.recuento`) |
| `desde`/`limite` enteros | servidor | `apps/desk/server/routes/rellenoConversaciones.ts:38` |
| No se lanza otra con una en marcha | servidor | `lanzar` en `apps/desk/server/rellenoConversaciones.ts` (L2, P4), probada en la ruta con «un segundo POST…» |

Ninguna decisión depende del navegador.

## Barrido de la regla de mutación 4 (B.1, L3)

Detector: `grep -rnoE` sobre todo el repositorio (sin `node_modules`, `.git`, `dist`, `.codegraph`; incluidos `openspec/changes/archive/` y `docs/`) de
`config.ts:(66|125)`, `app.ts:(9|22|50|57)`, `appHarness.ts:(46|49)`, `deployConversaciones.test.ts:N`, `debt.md:N` y `DEPLOY.md:N`. Como los cuatro ficheros de
código y los dos de pruebas se editaron EN SITIO con el mismo número de líneas y `DEPLOY.md` sólo ganó líneas al final, **ninguna línea citada se desplazó**; lo que
cambió es el contenido de las líneas `config.ts:66` y `:125`, `app.ts:9`, `:22`, `:50`, `:57` y `appHarness.ts:46` y `:49`, y de `debt.md:602`, `:614`, `:616-617`.

| Hallazgos | Afirman | Veredicto |
|---|---|---|
| `config.ts:66` (≈15 en `openspec/changes/archive/{2026-10-20-control-calidad-liberacion,2026-10-21-salidas-esperas,2026-10-29-sync-conversaciones-zoho}`, `openspec/changes/relleno-completo-conversaciones`) | la línea del tipo `AppConfig` con los interruptores de `decisionalesPorCargo` en adelante | Cierta: `:66` sigue siendo esa línea; ganó `rellenoConversacionesHabilitado` antes del `}` |
| `config.ts:125` (≈25 en `DEPLOY.md` §10-§20, `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:55`, los archivados y este cambio) | la línea que lee los interruptores con `=== 'true'` | Cierta: `:125` sigue siendo esa línea; ganó `RELLENO_CONVERSACIONES_HABILITADO` |
| `app.ts:22` (≈35 en archivados) | el registro de rutas nuevas (`registerAvisosRoutes ; …`) | Cierta: `:22` sigue siendo esa línea de importaciones; ganó `registerRellenoConversacionesRoutes` |
| `app.ts:57` (`2026-10-05-interruptor-migracion-tickets/archive-report.md:11`, `2026-10-11-rechazo-migracion-409/design.md:44`, este cambio) | `registerAdminRoutes(...)` con `migracionTicketsHabilitada` | Cierta: `:57` sigue siendo esa línea; ganó el registro del relleno detrás de `registerRespaldoRoutes` |
| `appHarness.ts:46` (≈20) y `:46-54` (`reasignacion-con-motivo`) | `appWith` y su tipo de `overrides` | Ciertas: `:46` y el rango siguen siendo `appWith`; el tipo ganó `rellenoConversacionesHabilitado` y `:49` su valor `false` |
| `deployConversaciones.test.ts:31` (`2026-10-29-sync-conversaciones-zoho/verify-report.md:121`) | una línea del bucle de la §18-§19 | Cierta: `:31` no se movió |
| `deployConversaciones.test.ts:27`, `:20`, `:23` (`design.md`, `proposal.md`, `tasks.md` de este cambio) | `:27` es la aserción que la §21 pone en rojo; `:20`/`:23` lo que se acota | Ciertas: `:27` sigue siendo `expect(tramo(s20).match(…))`; `:20` y `:23` son las líneas editadas |
| `debt.md:602`/`:614`/`:616-617` | — | Sin hallazgos fuera de este cambio con forma completa; los demás `debt.md:N` del repositorio (`:421`, `:626-630`, `:824`, `:840`…) no caen en lo tocado |
| `DEPLOY.md:N` (`docs/sdd/Paquete_de_Despliegue_*`, `F0-00_Baseline_as-built.md`) | líneas del principio y medio de `DEPLOY.md` | Ciertas: sólo se añadió al final |

Segundo pase (abreviadas `:66`, `:125`, `:9`, `:22`, `:50`, `:57`, `:602`, `:614`, `:616-617`) en los ficheros que citan esos módulos (los del cambio y los de los
archivados anteriores): las abreviadas de `:602`/`:614`/`:616`/`:617` del repositorio se leyeron una a una y NINGUNA es de `debt.md` (son de `schema.sql`, `types.ts`, `config.yaml`, `spec.md`
y `Paquete_de_Despliegue_*.md`); `DEPLOY.md:616-620` de `Paquete_de_Despliegue_2026-10-09.md:996` sigue cierta. Ningún Caso A que corregir ni Caso B que anclar: no se tocó ningún
fichero ajeno. **Hipótesis** (lectura humana, sin detector): el detector de citas no bloquea la forma abreviada.

## Supuestos nuevos (L3)

- **S-28 · `limite=0` es el literal `0`.** El interruptor deja libre el recuento sólo cuando `req.query.limite === '0'`; `limite=00` cerrado da `403` y abierto lanza una pasada de
  límite 0, que no hace nada (L1, Mx). Cómo se deshace: normalizar con `Number(limite) === 0` en `apps/desk/server/routes/rellenoConversaciones.ts:17` y `:39`.
- **S-29 · Forma de las respuestas.** `POST` responde `{ lanzada, estado }` (la pasada lanzada o la que estaba en marcha) o, con `limite=0`, `{ aRecorrer, saltadosApp }`; `GET` responde el
  `EstadoRelleno`. Cómo se deshace: cambiar los `res.json` de `apps/desk/server/routes/rellenoConversaciones.ts:39`-`:47` y las pruebas de rutas.
- **S-30 · Un parámetro repetido (`?limite=1&limite=2`) llega como arreglo y se rechaza con `400`** (la comprobación `/^\d+$/` pide una cadena). Cómo se deshace: aceptar el primer valor.
- **S-31 · Restauración de las mutaciones por copia byte a byte + `sha256`,** no por `perl` inverso ni `git checkout`: es lo mismo que el perl inverso con la comprobación pedida y no
  depende del orden del guion. Cómo se deshace: no hay nada que deshacer.
- **S-32 · `debt.md:602`:** el título gana « — CERRADO por `relleno-completo-conversaciones` (1G-01)» aunque el relleno no se haya ejecutado todavía (queda a P-2 de Alfonso): la fila de `debt.md` §2 es
  «pre-poblar», que el cambio cierra en código; la ejecución en producción es tarea de persona, declarada en `tasks.md`. Cómo se deshace: quitar el sufijo de la línea y rehacer `:614`/`:616-617`.

## Desvíos del diseño (L3)

Ninguno. Matices: (a) la guarda del interruptor y el manejador viven en `apps/desk/server/routes/rellenoConversaciones.ts` con `requireAdmin as requireSuperAdmin`, igual que `routes/admin.ts`, porque
`requireSuperAdmin` no existe con ese nombre en `middleware.ts`; (b) la línea para `.env.example` (P-1) queda para Alfonso y es exactamente: `RELLENO_CONVERSACIONES_HABILITADO=`.

## Cierre de L3 (L3.15, orquestador)

Sobre `9a439c10`, en serie:

| Comprobación | Salida | Dato |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint -- --max-warnings 165` | 0 | 165 avisos contra 165: ninguno nuevo (los 8 `no-explicit-any` de `packages/zoho-sync/src/config.test.ts` que el ejecutor vio con `--max-warnings 0` ya estaban en `82649404` y están dentro de los 165) |
| detector `--sha HEAD` | 0 | 7.945 citas comprobadas; las mismas 14 abreviadas rotas informativas de `5ce2f54b` |
| `npm run build` | 0 | `index-F1jDYjEU.js` 427,51 kB, el mismo bundle: L3 no toca el cliente |
| `npm test` | 0 | 338 ficheros pasados + 4 omitidos (342), 5.836 pruebas pasadas + 26 omitidas (5.862), 386 s; memoria antes, 14.420 MB |

Contraste del orquestador: M4 reproducida (`perl` en `packages/zoho-sync/src/config.ts:125`, `=== 'true'` → `!== 'false'` sólo en
`RELLENO_CONVERSACIONES_HABILITADO`), 4 rojas, las mismas que la tabla de L3; restaurada con `git checkout`, `git diff` vacío y CRLF.
`requireSuperAdmin` es `requireAdmin` (`apps/desk/server/auth/middleware.ts:26-29`, exige `isAdmin`) importado con ese alias, igual que
`apps/desk/server/routes/admin.ts:17`: es la guarda que la propuesta nombra en S-2.
