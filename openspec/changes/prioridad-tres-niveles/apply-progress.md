# Apply-progress — prioridad-tres-niveles · Lote L1

Partida `742e365` (sobre `6344b4a`). Lote L1: lista `High`/`Medium`, nacimiento `Medium` y borde de vigencia. Modo `strict_tdd`.
Sin commit: el orquestador comprueba, commitea y asienta.

## Partida (L1.1, L1.2)
- `wc -l` de partida: `prioridad.ts` 114, `contratos.ts` 298, `ticketService.ts` 277, `cargos.ts` 98.
- `npm test` en la partida: 258 ficheros pasan, 2 saltados; 4187 pruebas pasan, 7 saltadas; código 0.

## Rojos (L1.3 a L1.10), con su razón
| Prueba | Estado antes del código | Razón |
|---|---|---|
| `prioridad.test.ts` · lista literal `High, Medium`; `Low` no asignable; Top 5 guardado con `Low` no impone; `prioridadClienteDelCuerpo` y `ajusteDelCuerpo` rechazan `Low`; opciones del campo de transición | ROJO (5 fallos) | la lista seguía siendo de tres |
| `prioridadPropagada.test.ts` (Top 5 `Low` → `Medium`) | nace verde | cambio de dato para que compile; no hay rojo posible hasta que el tipo se estreche |
| `ticketService.test.ts` · filas sin contrato, sin prioridad, vencido, empieza mañana, subOV de otro cliente, TC24-9, TC24-13, TC24-15, TC28-2, y el bloque nuevo (4 + 2) | ROJO (14 fallos) | el alta aún leía `b.prioridad` y devolvía `Low`, `Urgent`, `High` o `null` |
| `trazaTop5AlNacer.test.ts` (6 pruebas) | ROJO | la base seguía siendo la pedida, no `Medium` |
| `prioridadTop5.test.ts` (TC27-9, TC29-3b), `propagarTop5.test.ts` (2) | nacen verdes | sólo sustituyen `Low` por un valor de la lista; no cambian de significado con el código viejo |
| `contratos.test.ts` · borde, función pura (4) | nace verde (caracterización) | la fórmula no cambia |
| `prioridadAlNacerVigencia.test.ts` (4) | ROJO sólo en «el día siguiente nace Medium» (`null` en lugar de `Medium`); las otras 3 nacen verdes | el día del fin, la zona y el fin movido por la ruta real ya funcionaban |

**Hipótesis del diseño confirmada:** el alta sin orden de venta se comporta igual bajo el reloj falso de sólo `Date`, y la ampliación por la ruta real
(`POST /api/contratos/:id/ampliar`) acepta ampliar con el reloj en el último día del contrato. No hizo falta variante.

## Válvula (L1.11)
Antes del código: 161 líneas tocadas en pruebas + 75 del fichero nuevo = 236. Proyección total ≈ 330, muy por debajo de 720. No se parte.

## Código (L1.12 a L1.15)
- `prioridad.ts`: lista `['High', 'Medium']` en sitio y `PRIORIDAD_POR_DEFECTO` al final (+3 netas).
- `transitions.ts:84`: opciones `['High', 'Medium']` en sitio.
- `contratos.ts`: parámetro `pedida` pasa a `respaldo` y su comentario se corrige; la fórmula no cambia.
- `prioridadPropagada.ts` y `prioridadCliente.ts`: sólo comentarios.
- `ticketService.ts`: import y las dos lecturas de `b.prioridad` pasan a la constante. `b.prioridad` ya no se lee en el alta.

## Hallazgo no previsto en el diseño
`apps/desk/server/tickets.test.ts` (hilo de conversaciones) enviaba `prioridad: 'Media'` en el alta y esperaba el texto «Prioridad: Media». Con el alta
sin leer el cuerpo, el texto dice «Prioridad: Medium». Se cambió la aserción en sitio (1 línea) y se dejó el cuerpo enviado, que ahora se ignora.
Efecto visible: el texto automático «Ticket creado para…» muestra el valor crudo `Medium` (como ya lo hacía con los valores de la lista); la traducción de
la presentación no es de este lote.

## Pruebas reescritas, una a una
- `prioridad.test.ts`: lista literal; `Low` en la tabla de no asignables; Top 5 con `Low` da `null`; `prioridadClienteDelCuerpo` suma `Low` a los rechazados; opciones de las transiciones; `ajusteDelCuerpo` suma `Low` a los rechazados; «igual a la actual» pasa de `Low` a `High` (con `Low` el rechazo ya sería por la lista, no por igualdad).
- `prioridadPropagada.test.ts`: dos pruebas con Top 5 `Low` pasan a `Medium` (sólo dato).
- `ticketService.test.ts`: tabla de prioridad al nacer (sin contrato, sin prioridad, vencido, empieza mañana: `Medium`); subOV de otro cliente: `Medium`; TC24-6 usa `Medium` en lugar de `Low`; TC24-8 con Top 5 `Medium`; TC24-9 (Urgent) nace `Medium`; TC24-13 con Top 5 `High` del cliente A para que discrimine; TC24-15 y TC28-2 nacen `Medium`. Bloque nuevo al final (3 pruebas, la primera en cuatro filas).
- `trazaTop5AlNacer.test.ts`: la base de la traza es `Medium` y no la pedida; «sin pedida» pasa a «Top 5 Medium nace igual a la base: sin traza»; «misma que la pedida» pasa a «Top 5 Medium y se pide High»; «contrato + Top 5 y cuerpo High» ahora SÍ deja traza; el `GET` de origen usa Top 5 `High`.
- `prioridadTop5.test.ts`: TC27-9 con `Medium`; TC29-3b con `High`/`High`.
- `propagarTop5.test.ts`: «contrato vigente y Top 5» y «Top 5 más bajo» con `Medium`.
- `tickets.test.ts`: ver el hallazgo de arriba.
- Sin editar y verdes: `contratos.test.ts` (las pruebas de `prioridadAlNacer` previas), `prioridadPropagada.test.ts` (desmarcar y `baseAlNacer`), `prioridadTop5.test.ts` (reversión), `propagarTop5.test.ts` (reversión).

## Mutaciones (L1.17)
| Mutación | Qué se rompió | Pruebas en rojo | Restaurado |
|---|---|---|---|
| M5 | `Low` vuelve a `PRIORIDADES_ASIGNABLES` y no a `transitions.ts` | 6: la lista literal, **la paridad** de las dos copias, `Low` no asignable, Top 5 con `Low`, `prioridadClienteDelCuerpo`, y «Top 5 guardado con Low nace Medium» | sí, `cmp` idéntico |
| M6 | `ticketService.ts` alta: `b.prioridad` en lugar de la constante | 15: toda la tabla de «nace Medium», TC24-9, TC24-13, TC24-15, TC28-2, las 4 del bloque nuevo + 1, y «el día siguiente nace Medium» | sí |
| M7 | `contratos.ts` `<` pasa a `<=` en `estadoContrato` | 12, en las **dos capas**: pura («el día del fin», «UTC siguiente») y servicio (los dos mismos), más los previos del fin de contrato | sí |
| M9 | datos: fila `cliente_prioridad` con `top5` y `Low`, sin tocar código | «Top 5 guardado con Low y sin contrato nace Medium» (rojo con el código viejo, verde con el nuevo; cae también con M5) | n/a |
| M1 a M4, M8 | n/a en L1 (su código nace en L2) | | |

## Cierre
- `npm test`: código 0; 259 ficheros pasan y 2 saltados; 4201 pruebas pasan y 7 saltadas (4187 de partida + 14 nuevas). Una primera pasada dio 1 fallo (`tickets.test.ts`, hallazgo de arriba), corregido y repetida.
- `npm run typecheck`: código 0.
- `npm run lint`: código 0; 165 avisos y 0 errores (la base).
- `git diff --numstat`: inserciones = borrados en `ticketService.ts` (3/3), `transitions.ts` (1/1), `contratos.ts` (3/3), `prioridadPropagada.ts` (1/1) y `prioridadCliente.ts` (2/2); `prioridad.ts` 5/2 (neto +3 al final).
- Medida del intento: `git diff --shortstat --no-renames 742e365` = 137 inserciones + 93 borrados = 230, más `wc -l` de lo nuevo sin trackear (75 de la prueba y 65 de este fichero) = 140; total 370, por debajo de 800. Sin binarios.
- Pendiente del orquestador: commit, detector de citas (`cli.ts --sha HEAD`) y asiento (L1.19, cuarta parte).

---

# Apply-progress — prioridad-tres-niveles · Lote L2

Partida `605b9ab` (cierre de L1). Lote L2: predicado `puedeAjustarPrioridadTicket`, escalera del `POST` sin `409`, guarda de transición, D9 (S-K) y sincronizador. Modo `strict_tdd`. Sin commit: el orquestador comprueba, commitea y corre el detector.

## Partida (L2.1)
`wc -l` de partida: `cargos.ts` 98, `routes/prioridad.ts` 95, `guardaPrioridad.test.ts` 142.

## Rojos (L2.2 a L2.14), con su razón
| Prueba | Estado antes del código | Razón |
|---|---|---|
| `cargos.test.ts` · matriz del predicado (3 pruebas) y tercer llamador (`PM20-2`) | ROJO | el predicado no existía |
| `prioridad.test.ts` · `cambiaPrioridadSinPermiso` con Director Técnico; mensaje con «Director Técnico»; `erroresPrioridadPedida` (3) | ROJO | ni predicado ni función ni texto nuevo |
| `prioridadTop5.test.ts` · TC29-4, TC29-5 (inversión 409 a 200), TC29-7 (P3), TC29-8 (P4), PM23-1 (3 aceptados) | ROJO | el `POST` aún tenía B1 y el predicado del Director Comercial |
| `prioridadTop5.test.ts` · bloque nuevo: sin cliente con traza, texto del 403, matriz de diez sujetos sobre cliente no Top 5, Director Técnico sin área, sincronizador | ROJO | mismas razones; el sincronizador cae por el `403` |
| `prioridadTop5.test.ts` · P1 (`POSICIÓN A < B2`) y P2 (`POSICIÓN B2 < C`) | nacen verdes (existentes) | declaradas en el diseño |
| `prioridadTop5.test.ts` · P5 (inexistente Y cuerpo inválido, admin) | nace verde (caracterización) | el `404` ya ganaba |
| `guardaPrioridad.test.ts` · Director Técnico cambia en las dos transiciones (2), técnico con el texto nuevo, T5, D9 `Low` y `Urgent` (2) | ROJO | `403` por el predicado viejo; el servidor no validaba la lista |
| `guardaPrioridad.test.ts` · T4 (Director Técnico sin Servicio Técnico: `403` de área), «reenviar la misma heredada `Low`/`Urgent` pasa», posición de D9 | nacen verdes (caracterización) | el área ya ganaba y D9 aún no existía; la tarea decía ROJO para T4, pero hoy el `403` de área ya se da. Se prueba que discrimina con la mutación «el cargo abre la transición» (abajo) |

## Código (L2.15 a L2.18)
- `cargos.ts`: `CARGOS_AJUSTE_PRIORIDAD_TICKET` y `puedeAjustarPrioridadTicket` al final (+8); comentario de `puedeFijarPrioridadTop5` en sitio. `EXCEPCIONES_POR_CARGO` y `:80-83` intactos.
- `prioridad.ts`: import, `MENSAJE_PRIORIDAD_BLOQUEADA`, comentario `:78-79` y `:85` en sitio; `erroresPrioridadPedida` al final (+8).
- `routes/prioridad.ts`: `:5`, `:47-49`, `:67-71` en sitio, 9 insertadas = 9 borradas. Las dos guardas `409` se retiraron y sus tres líneas pasan a un comentario de tres líneas (qué había, hasta `6344b4a`, qué decisión lo levantó: `p3b-prioridad-tres-niveles`). `:66`, `:73-74` no se movieron.
- `ticketService.ts`: `:6` y `:134` en sitio (2/2). `:131` no se tocó. D9 pasa `b.values` y `current.row.priority`, como `:131`.

## Mutaciones (L2.20)
| Mutación | Cambio | Pruebas en rojo |
|---|---|---|
| M1 | `403` del `POST` detrás del `422` | P3 (`TC29-7`) y P2 (`POSICIÓN B2 < C`) |
| P1 | `403` del `POST` por encima del `404` | `POSICIÓN A < B2` |
| P4 (a) | reponer B1 (`409`) | `TC29-4`, `TC29-5`, P3, P4, D7, texto del `403`, matriz, Director Técnico sin área, sincronizador (9) |
| P4 (b) | el `POST` vuelve a `puedeFijarPrioridadTop5` (quitar al Director Técnico) | P4 (`TC29-8`), `PM23-1`, matriz, sin área, sincronizador (5) |
| P5 | validar el cuerpo antes de buscar el ticket | P5, `TC29-3`, P3, P2 (4) |
| M2 | guarda de prioridad antes del área (`ticketService.ts:131`) | T1 (`TS22-1`) |
| M2 sobre T4 | **T4 NO la cae**: el Director Técnico pasa el predicado, así que subir la guarda no cambia su veredicto (el diseño suponía T4 en M2). T4 se cae con otra mutación: «el cargo abre la transición» (`canExecuteTransition(...) \|\| cargo === 'Director Técnico'`) | T4 |
| M3 | guarda de prioridad detrás del `throw` del `422` | T2 (`TS22-2`) |
| T3 | guarda de prioridad antes del estado | `TS22-3` (y `TS22-1`) |
| M4 | `CARGOS_AJUSTE_PRIORIDAD_TICKET` vacío | P4, T5, las dos matrices, Director Técnico en las dos transiciones, sin área, sincronizador, `cambiaPrioridadSinPermiso` (11) |
| M8 | retirar `erroresPrioridadPedida` de `ticketService.ts:134` | D9 `Low` y `Urgent` (2) |
| D9 posición | `erroresPrioridadPedida` antes de la guarda de permiso | posición de D9 y `TS22-2` |
| M5 | `Low` vuelve a `transitions.ts:84` | paridad y `TS20-3` (2). Con `Low` en `PRIORIDADES_ASIGNABLES`: 7 (lista, paridad, `Low` no asignable, Top 5 con `Low`, `prioridadClienteDelCuerpo`, D9, «Top 5 guardado con `Low` nace `Medium`») |
| M6 | `ticketService.ts:106` y `:108` vuelven a `b.prioridad` | 21 (tabla de «nace `Medium`», trazas, TC24-9, TC24-13, TC24-15, TC28-2, bloque nuevo) |
| M7 | `contratos.ts:43` `<` a `<=` | 12, en las dos capas (pura y servicio) |
| M9 | datos: fila `top5` verdadero con `Low`, sin tocar código | «Top 5 guardado con `Low` y sin contrato nace `Medium`» cae con M5 y con M6; verde con el código |

Cada mutación se revirtió restaurando una copia y comprobando `git diff --numstat`: `contratos.ts` y `transitions.ts` sin diferencias frente a `605b9ab`, el resto con las cifras del cierre.

## Sincronizador (L2.13)
Ticket de un cliente SIN fila en `cliente_prioridad`, `managed_by_app` falso comprobado, ajustado por un Director Técnico con Servicio Técnico (200, marca `true`); la segunda pasada de `upsertTicket` con otra prioridad no lo cambia, y el de control sí. La sostiene `packages/zoho-sync/src/db/repo.ts:71`; no se tocó.

## Pruebas de posición y mutación que cazó cada una
P1 (`POSICIÓN A < B2`): 403 sobre 404. P2 (`POSICIÓN B2 < C`) y P3 (`TC29-7`): M1. P4 (`TC29-8`): reponer B1 y quitar al Director Técnico. P5: validar antes de buscar. T1 (`TS22-1`): M2. T2 (`TS22-2`): M3. T3 (`TS22-3`): guarda sobre el estado. T4: «el cargo abre la transición». T5: M4. D9: M8 y la posición de D9.

## Cierre
- `npm test`: código 0; 259 ficheros pasan y 2 saltados; 4226 pruebas pasan y 7 saltadas (4201 de partida + 25 nuevas).
- `npm run typecheck`: código 0.
- `npm run lint`: código 0; 165 avisos y 0 errores (la base).
- Pendiente del orquestador: commit y detector de citas (`cli.ts --sha HEAD`), por eso L2.22 queda sin marcar.
- Medida del intento: `git diff --shortstat --no-renames 605b9ab` = 321 inserciones + 60 borrados = 381 (antes de esta línea), sin ficheros nuevos sin trackear ni binarios; por debajo de 800.
