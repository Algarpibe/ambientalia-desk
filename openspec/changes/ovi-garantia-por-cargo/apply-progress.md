# Apply-progress · `ovi-garantia-por-cargo` · lote 1 (`packages/shared`), partida `38078cc`

Tareas 1.1-1.11 hechas. Los lotes 2 y 3 no se tocan. Sin commit.

## Rojo → verde (`npx vitest run <fichero>`)
- 1.1 `subOV.test.ts` · rojo: 13 casos de `esOVI` con «esOVI is not defined» (el `it.each` de verdaderos y el de falsos); la CARACTERIZACIÓN de `clasificarOV` nació verde. Verde tras 1.2: 53 pruebas.
- 1.3 `ordenOVI.test.ts` · rojo: «Cannot find module './ordenOVI'»; tras crear el módulo con `cargos.ts` sin cambiar, 9 rojas en `motivoCargoOVI` (el Director Técnico sin área no pasaba, los demás cargos y el administrador por falta de `areas`). Verde tras 1.6.
- 1.5 `cargos.test.ts` · rojo: `:118-123` («expected false to be true») y PM20-2 («Array(1)» ≠ `['shared/src/ordenOVI.ts']`). El barrido 1.815 nació VERDE (sólo se quitó la línea de la primitiva y se cambió el número; es test-only). Verde tras 1.6 (40 ficheros, 1.034 pruebas en `packages/shared`).
- Pruebas nuevas: 14 en `subOV.test.ts` (13 casos de `esOVI` + 1 caracterización) y 26 en `ordenOVI.test.ts`; `cargos.test.ts` en sitio, sin pruebas añadidas.

## Mutaciones (cada una restaurada; `git diff` final sin restos)
| Id | Qué cambié | Roja |
|---|---|---|
| M-SH-1a | `PREFIJO_OVI = /^OVI-/` (sin `i`) | `esOVI … " ovi-2026-001 "`; `motivoCargoOVI … una OVI mal formada y en minúsculas sí` |
| M-SH-1b | `PREFIJO_OVI = /^OVI-\d{4}-\d{3,}/i` (sintaxis completa) | `esOVI … "OVI-26-1"`; `motivoCargoOVI … una OVI mal formada y en minúsculas sí` (sólo esas dos) |
| M-SH-1c | área Servicio Técnico devuelta a `puedeCrearOVIGarantia` | `cargos.test.ts … puedeCrearOVIGarantia: sin área, basta el cargo Director Técnico`; `ordenOVI.test.ts … motivoCargoOVI … Director Técnico` |
| M-RC-1 (parcial) | `ordenesQueEntran` sin la condición «ya la traía» | `número igual: no entra`, `número igual tras recortar: no entra`, `mismo salesorderId con número distinto: no entra (id igual)` |

## Cuatro comandos (códigos de salida)
`npm test` = 0 (234 ficheros pasan, 2 saltados; 3.562 pruebas, 7 saltadas) · `npm run typecheck` = 0 · `npm run lint` = 0 · `npm run build` = 0.

## Medida
`git diff --shortstat --no-renames 38078cc`: 6 ficheros, 44 inserciones, 18 borrados = 62; más `wc -l` nuevos: `ordenOVI.ts` 68 y `ordenOVI.test.ts` 111 = 179. **Total 241** frente a 387 (×1,8) y 720: holgado.
`git diff --numstat`: `cargos.ts` 5/5, `cargos.test.ts` 10/10, `index.ts` 1/1, `mantenimientoNovedades.ts` 1/1, `subOV.ts` 12/0 (sólo por el final), `subOV.test.ts` 15/1.

## DESVIACIONES
1. Los números de línea del diseño para `cargos.test.ts` (`:117-123`, `:185`, `:204-205`, `:226-229`) son los reales del árbol (título en `:117`); se editó en sitio con el mismo número de líneas.
2. Texto del `403`: se usó el de `design.md` §3 («La orden de venta ${n} es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico»); `specs/permissions/spec.md` RQ-PM-24 escribe «Asociar una orden OVI a un ticket sólo lo hace el cargo Director Técnico». No coinciden: decide el orquestador antes del lote 2 (las pruebas HTTP deben fijar uno).
3. `ordenesQueEntran` recorta también los números que el ticket ya tiene antes de compararlos (diseño: sólo el recibido); no cambia ningún caso del diseño.
4. `puedeCrearOVIGarantia` ahora acepta `Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>` (diseño §3).

# Lote 2 · alta y transiciones, partida `d6a2957`

Tareas 2.1-2.14 hechas. El lote 3 no se toca (`remision.ts` y `apps/desk/src` intactos). Sin commit.

## Rojo → verde (`npx vitest run apps/desk/server/oviGarantia.test.ts`)
- 2.2/2.3 · rojo (8 de 13): AL-1, AL-4/5 (×3), AL-6, AL-7 con «expected 201 to be 403» / «promise resolved instead of rejecting»; POS-AL-3 y POS-AL-4 con «expected 422 to be 403». Nacieron verdes (CARACTERIZACIÓN): AL-2, AL-3, AL-8, POS-AL-1, POS-AL-2. Verde tras 2.4.
- 2.5 · rojo (3): GA-AL-1 y GA-AL-4 «expected 201 to be 422», POS-AL-5 «expected 409 to be 422». Nacieron verdes: GA-AL-2, GA-AL-3 (tras corregir el cuerpo, que sin `clientId` daba 422 por «cliente»), GA-AL-5, POS-AL-6. Verde tras 2.6.
- 2.7 · rojo (11): TR-1/3/5 y RC-4/5/6 «expected 200 to be 403»; POS-TR-3, 3b, 4 «expected 422 to be 403»; POS-TR-5 y 5b «expected 409 to be 403». Nacieron verdes: TR-2/4/6, RC-1/2/3/7 (la central, RC-1, es CARACTERIZACIÓN: sin guarda no hay nada que reconfirmar; la cierra M-RC-1), POS-TR-1, POS-TR-2, EQ-1. Verde tras 2.8.
- 2.9 · rojo (4): GA-TR-1 y GA-TR-2 «expected 200 to be 422», POS-TR-6 «expected 409 to be 422», POS-TR-7 «length 2 but got 1». Nacieron verdes: GA-TR-3, GA-TR-4. Verde tras 2.10.
- Añadidas al pasar (no estaban en la lista): RC-7 (OV adicional ya traída), POS-TR-5b (OV adicional comparte la puerta de POS-TR-5), POS-AL-7 y POS-TR-8 (garantía frente al contrato vencido). Total: 51 pruebas en `oviGarantia.test.ts`.

## Mutaciones (cada una restaurada desde copia; `git diff` final sin restos: sólo los 10+10 de las ediciones)
| Id | Qué cambié | Roja (nombre exacto, abreviado tras el id) |
|---|---|---|
| M-AL-1 | llamada extra `exigirCargoOVI(entrantesDeAlta(ordenVenta, null), sujeto)` antes del `if (b.salesOrderId)` | POS-AL-2 |
| M-AL-2a | cargo del alta movido detrás de equipo↔cliente (antes de `const tipoServicio`) | POS-AL-3 |
| M-AL-2b | cargo del alta movido detrás de los obligatorios (antes de `const cliente = prov`) | POS-AL-3 y POS-AL-4 |
| M-AL-3a | garantía del alta detrás del `409` (antes de `const codigoServicio`) | POS-AL-5 |
| M-AL-3b | garantía del alta delante de la cuarentena | POS-AL-6 |
| M-AL-3c | garantía del alta delante del vencido | POS-AL-7 |
| M-TR-1a | cargo de transiciones antes del área (`:129`) | POS-TR-2 |
| M-TR-1b | cargo de transiciones antes del `409` de estado (`:126`) | POS-TR-1 y POS-TR-2 |
| M-TR-2a | cargo al final de `:131` (tras `exigirRemisionVigente`) | POS-TR-3 y POS-TR-3b |
| M-TR-2b | cargo detrás del `422` agregado (`:134`) | POS-TR-3, POS-TR-3b y POS-TR-4 |
| M-TR-2c | cargo detrás del `409` de unicidad | POS-TR-3, 3b, 4, POS-TR-5 y POS-TR-5b |
| M-TR-3 | garantía fuera del agregado, tras el `409` | GA-TR-1, GA-TR-2, POS-TR-6 y POS-TR-7 |
| M-TR-3b | garantía fuera del agregado, tras el vencido | POS-TR-7 y POS-TR-8 |
| M-RC-1 | `entrantesDeTransicion` sin «ya la traía» (`numeros`/`salesorderIds` vacíos) | RC-1 (Zoho), RC-2, RC-3, RC-7 y GA-TR-3 |
| M-SH-1a | `PREFIJO_OVI` sin la `i` | AL-4/AL-5 (` ovi-2026-001 `) y RC-6 |
| M-SH-1c | área Servicio Técnico devuelta a `puedeCrearOVIGarantia` | AL-2, GA-AL-2, GA-AL-4, GA-AL-5, TR-2, TR-4, TR-6, GA-TR-4 |

## No observables, declarados
- Cargo frente a garantía en el alta y en las transiciones: el cargo corre en B y la garantía en C, y ninguna entrada produce las dos a la vez con respuestas distintas útiles (una OV ordinaria no pide cargo; una OVI cumple la garantía): no hay par que fijar.
- Cargo frente al `403` de prioridad de `:131`: ninguna de las tres transiciones con campo de orden tiene campo de prioridad (`transitions.ts:189`, `:199`, `:203`), así que no hay petición que active las dos.
- La «OV adicional» comparte la misma llamada que «Habilitar Servicio»: se demuestra con POS-TR-4 (aprobacion_y_repuestos), POS-TR-5b y GA-TR-2 propias, que se ponen rojas con M-TR-2b/2c y M-TR-3.

## Cuatro comandos (códigos de salida)
`npm test` = 0 (235 ficheros pasan, 2 saltados; 3.613 pruebas, 7 saltadas) · `npm run typecheck` = 0 (la primera vez dio 2: un `Record<string, unknown>` sin tipar en la prueba; corregido y repetido, 0) · `npm run lint` = 0 · `npm run build` = 0. Tras la corrección de tipos de la prueba se repitieron typecheck, lint y `oviGarantia.test.ts` (51 verdes); `npm test` completo y `build` corrieron justo antes de ese cambio, que es sólo de tipos.

## ticketService.ts en sitio
`git diff --numstat d6a2957`: `ticketService.ts` 9/9, `tickets.ts` 1/1. `wc -l ticketService.ts`: 277 antes y 277 después. `tasks.md` decía «tickets.ts también» en sitio: cumplido.

## Medida
`git diff --shortstat --no-renames d6a2957`: 2 ficheros, 10 inserciones, 10 borrados = 20; más `wc -l` nuevos: `guardasOVI.ts` 41 y `oviGarantia.test.ts` 376 = 417. Total de código y pruebas **437** frente a 549 (×1,8) y 720. Más este apartado y las casillas de `tasks.md` (documentación).

## DESVIACIONES
1. `getTicketWithRefs` SÍ entrega `salesorder_id` en `row` (hipótesis confirmada por el tipo `TicketRow` y por RC-3/`ticketConOrdenVenta`); `entrantesDeTransicion` lo lee de `row`.
2. `oviGarantia.test.ts` pesa 376 líneas contra 240 estimadas (51 pruebas, cuatro más que el diseño); `guardasOVI.ts` 41 contra 45. El lote queda holgado bajo 720.
3. Al editar `ticketService.ts:131` la herramienta de edición recortó un espacio final; se detectó con M-TR-2a («ocurrencias: 0») y se restauró (`const gas = await`), con numstat 9/9 comprobado después.
4. El texto del `403` es el de `ordenOVI.ts`, como decidió el orquestador.
