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

# Lote 3 · remisión de entrada, partida `81d8389`

Tareas 3.1-3.9 hechas. `ticketService.ts` y `apps/desk/src` intactos. Sin commit.

## Rojo → verde
- 3.2-3.4 · `npx vitest run apps/desk/server/oviGarantiaRemision.test.ts` con sólo el fichero de pruebas: 6 rojas de 23, 17 verdes. Rojas: RE-1 y RE-6 («expected 201 to be 403»), POS-RE-1 («expected 422 to be 403»), POS-RE-2 («expected 409 to be 403»), GA-RE-1 («expected 201 to be 422»), POS-RE-5 («expected 409 to be 422»). Nacieron verdes: RE-2, RE-3, RE-7, GA-RE-2, GA-RE-5 (el servidor aún no impone nada) y las CARACTERIZACIÓN RE-4, RE-5, RE-5b, POS-RE-0, POS-RE-3, POS-RE-4, POS-RE-6, POS-RE-7, POS-RE-8, GA-RE-3, GA-RE-4.
- 3.5 · código: `entrantesDeRemision` en `guardasOVI.ts` y la línea `remision.ts:220`. Verde: 73 pruebas con `oviGarantia.test.ts` (los lotes 2 y 3 juntos).
- Pruebas nuevas: 22 en `oviGarantiaRemision.test.ts` (las 23 de la primera ejecución menos una, POS-RE-9, que se retiró por no probar nada de la guarda nueva).

## remision.ts en sitio
`git diff --numstat 81d8389 -- apps/desk/server/routes/remision.ts` = **3 / 3** (`:4`, `:7`, `:220`). `wc -l`: **397 antes y 397 después**. Ninguna guarda existente se movió; `remisiones.test.ts` (`:988`, `:1246`) y `recepcion.test.ts` (`:245-273`) siguen verdes sin tocarlos (corren enteros dentro de `npm test`).

## ORDEN COMPLETO de las guardas del alta de remisión (`POST /api/remisiones`), como queda
| Línea | Código | Mensaje | Escalón |
|---|---|---|---|
| `remision.ts:123` | 422 | Falta el ticket | A |
| `remision.ts:125` | 422 | Ticket no encontrado | A |
| `remision.ts:127` | 422 | Fecha inválida | C (IV-12 punto 1) |
| `remision.ts:155` | 422 | Falta el serial del equipo… | A |
| `remision.ts:158` | 422 | error de la recepción (novedades) | C (IV-12 punto 3) |
| `remision.ts:177` | 409 | remisión sin desenlace (pendiente) | D |
| `remision.ts:197` | 422 | Ítems fuera del checklist | C |
| `remision.ts:220` | 422 | Orden de venta no encontrada | A |
| **`remision.ts:220` (NUEVA)** | **403** | **La orden de venta … es una OVI: asociarla … sólo lo hace el cargo Director Técnico** | **B** |
| `remision.ts:220` | 422 | cuarentena (sufijo no canónico) | C |
| `remision.ts:220` | 422 | contrato vencido | C |
| **`remision.ts:220` (NUEVA)** | **422** | **El ticket es de tipo de servicio Garantía y sólo admite una orden OVI…** | **C** |
| `remision.ts:232` | 409 | La orden de venta … ya está asociada al ticket #… | D |

**Dónde corre el `403` nuevo, dicho literalmente:** corre DETRÁS de las guardas de contenido de la fecha (`:127`, C), de la recepción (`:158`, C) y del checklist (`:197`, C), y DETRÁS de la guarda de unicidad de la remisión pendiente (`:177`, D); y corre DELANTE de la cuarentena, del contrato vencido, de la garantía (`:220`) y de la unicidad de la orden (`:232`, D). Es el **punto nuevo de IV-12** (el cuarto): B queda después de C y D porque el número de la orden sólo se conoce tras leer Books (`:219`). Se anota, no se corrige; POS-RE-3 (pendiente) y POS-RE-4 (checklist) lo caracterizan. La garantía (C) corre en su sitio: tras la existencia, el cargo, la cuarentena y el vencido, y antes de la unicidad (`:232`).

## Mutaciones (cada una restaurada desde copia; `git diff` final sin restos: sólo las ediciones del lote)
| Id | Qué cambié | Roja (nombre exacto, abreviado tras el id) |
|---|---|---|
| M-RE-1a | cargo de la remisión detrás de la cuarentena | POS-RE-1 |
| M-RE-1a2 | cargo detrás del vencido (también detrás de la cuarentena) | POS-RE-1 |
| M-RE-1b | cargo detrás del `409` de unicidad (`:232`) | RE-1, RE-6, POS-RE-1, POS-RE-2 |
| M-RE-1c | cargo delante de «no encontrada» (con `ov ?` para no romper) | NADA ROJO, declarado abajo |
| M-RE-1d | cargo delante de la remisión pendiente (`:177`) | POS-RE-3 y POS-RE-4 |
| M-RE-1e | cargo delante del checklist (`:197`) | POS-RE-4 |
| M-RE-2a | garantía detrás del `409` | GA-RE-1 y POS-RE-5 |
| M-RE-2b | garantía delante de la cuarentena | POS-RE-6 y POS-RE-7 |
| M-RE-2c | garantía delante del vencido | POS-RE-7 |
| M-RC-1 | `entrantesDeRemision` sin «ya la traía» (listas vacías) | RE-4, RE-5, RE-5b y GA-RE-4 |

Corridas contra `oviGarantiaRemision.test.ts`, `remisiones.test.ts` y `recepcion.test.ts` juntos: ninguna prueba existente de los dos últimos se puso roja en ninguna mutación que no fuera la del propio par.

## Pares NO observables, declarados
- **«No encontrada» frente a cargo:** si la orden no existe no hay número que juzgar, así que el cargo no tiene qué decir. M-RE-1c lo confirma (nada rojo); POS-RE-0 fija el comportamiento (CARACTERIZACIÓN).
- **Cargo frente a contrato vencido:** el vencido sólo juzga subOV canónicas (`OV-AAAA-NNN-NN`, `subOV.ts:23`, `contratos.ts:85-86`) y una OVI nunca lo es (su sufijo va a cuarentena, `subOV.ts:11`); ninguna petición activa las dos. Lo sujeta indirectamente POS-RE-1 (cargo antes que la cuarentena, y la cuarentena antes que el vencido).
- **Cargo frente a garantía:** como en los lotes 1-2, B y C no se cruzan con respuestas distintas útiles (una OVI cumple la garantía).
- **Ruta de remisión y permisos:** `requireAuth` sólo pide sesión (`remision.ts:120`): no hay área ni cargo para entrar; un usuario con el cargo y sin Servicio Técnico pasa (RE-2) y no se cambió ese permiso.

## Cuatro comandos (códigos de salida, sobre el árbol final)
`npm test` = 0 (236 ficheros pasan, 2 saltados; 3.635 pruebas, 7 saltadas) · `npm run typecheck` = 0 · `npm run lint` = 0 · `npm run build` = 0.

## Medida
`git diff --shortstat --no-renames 81d8389`: 2 ficheros, 18 inserciones, 6 borrados = 24; más `wc -l` nuevo: `oviGarantiaRemision.test.ts` 206. Total **230** frente a 272 (×1,8) y 720. `numstat`: `remision.ts` 3/3, `guardasOVI.ts` 15/3 (`entrantesDeRemision` y el auxiliar `yaLoTiene`).

## DESVIACIONES
1. `guardasOVI.ts` se refactorizó mínimamente: un auxiliar privado `yaLoTiene` (lo que el ticket ya tiene) lo consumen `entrantesDeTransicion` y `entrantesDeRemision`, para no duplicar la noción de «ya la traía» (borra 3 líneas del lote 2). El diseño estimaba +10; son +15/-3.
2. Mensajes y colocación como en `design.md` §5, salvo que la línea `:220` conserva el comentario final de escalón ampliado. Las pruebas añadidas fuera de la lista: POS-RE-0, POS-RE-7, POS-RE-8, RE-5b, RE-7, GA-RE-4, GA-RE-5.
