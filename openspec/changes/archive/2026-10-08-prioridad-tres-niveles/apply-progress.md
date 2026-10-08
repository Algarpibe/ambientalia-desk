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

---

# Apply-progress — prioridad-tres-niveles · Lote L3

Partida `aed4aa4` (cierre de L2, intento abierto por el orquestador). Lote L3: cliente consumiendo `shared` y cierre documental. Modo `strict_tdd`; los `.tsx` están fuera de la red de pruebas por decisión de Gerencia, así que no hay rojo posible ahí y no se escribió ninguna prueba `.tsx`. Sin commit: el orquestador comprueba, commitea y corre el detector (L3.16, quinta parte, queda sin marcar).

## Cliente (L3.2 a L3.6)
- `PanelPrioridad.tsx`: import (`:2`), comentario (`:11-12`) y `:27` pasan a `!!user && puedeAjustarPrioridadTicket(user)`; cae `data.top5 &&`. 4 inserciones = 4 borradas.
- `TransitionPanel.tsx`: import (`:8`) y filtro (`:160`) con el predicado nuevo. 2 = 2.
- `CreateTicket.tsx` (D10): `:47` y `:231` pasan a comentario de una línea; `:426-429` pasa a un `<span>` estático de cuatro líneas, «Prioridad: la asigna el sistema», que conserva la celda de la rejilla. El estado `prioridad` y su `setPrioridad` desaparecen, y el cuerpo del alta ya no la envía. 6 = 6.
- `Top5Panel.tsx` **no cambia** (ya consume la lista en `:87` y `:123` y el predicado del `PUT` en `:20`): confirmado por lectura.
- Ningún `.tsx` gana lógica: cambian un predicado importado y un bloque estático.
- `npm run build`, `npm run typecheck` y `npm run lint`: verdes (números en el cierre).

## Regla de mutación 3 (L3.7) — tabla final, decisión a decisión
Cada fila se verificó leyendo la línea del servidor en el árbol de hoy (worktree en `aed4aa4` más este lote). Las ediciones del servidor de L1 y L2 fueron en sitio, así que ninguna línea se desplazó.

| # | Decisión del cliente | Línea del cliente de hoy | Línea del servidor de hoy que la impone | Prueba que la impone |
|---|---|---|---|---|
| 1 | Qué prioridades ofrece al fijar un Top 5 | `apps/desk/src/components/Top5Panel.tsx:87`, `:123` (`PRIORIDADES_ASIGNABLES`) | `422` de `apps/desk/server/routes/prioridad.ts:42-43` (`prioridadClienteDelCuerpo`, que rechaza lo que no esté en la lista) | `TC27-5` (`apps/desk/server/prioridadTop5.test.ts:70`) y la paridad de listas de `packages/shared/src/prioridad.test.ts` (M5) |
| 2 | Qué prioridades ofrece al ajustar un ticket | `apps/desk/src/components/PanelPrioridad.tsx:67` | `422` de `apps/desk/server/routes/prioridad.ts:73-74` (`ajusteDelCuerpo`) | `TC29-3` (`apps/desk/server/prioridadTop5.test.ts:237`) y `TC29-3b` (`:247`) |
| 3 | A quién enseña «Ajustar» (ya sin exigir Top 5) | `apps/desk/src/components/PanelPrioridad.tsx:27` | `403` de `apps/desk/server/routes/prioridad.ts:71`, con `puedeAjustarPrioridadTicket` | P3 `TC29-7` (`apps/desk/server/prioridadTop5.test.ts:282`), P4 `TC29-8` (`:287`), `PM23-1` (`:359`); M1 y M4 |
| 4 | A quién enseña el campo de prioridad en una transición | `apps/desk/src/components/TransitionPanel.tsx:160` | `403` de `apps/desk/server/services/ticketService.ts:131` (`cambiaPrioridadSinPermiso`, `packages/shared/src/prioridad.ts:81-86`) | T4 (`apps/desk/server/services/guardaPrioridad.test.ts:165`), T5 (`:172`), `TS22-1` a `TS22-3` (`:123`, `:130`, `:137`); M2, M3, M4 |
| 5 | No ofrecer prioridad en el alta | `apps/desk/src/components/CreateTicket.tsx:426-429` (texto estático) | `apps/desk/server/services/ticketService.ts:106`: usa la constante y no lee `prioridad` del cuerpo (tampoco `:108`) | `sin contrato ni Top 5 nace Medium pidiendo %s` (`apps/desk/server/services/ticketService.test.ts:1474`); M6 |
| 6 | A quién enseña los controles del Top 5 | `apps/desk/src/components/Top5Panel.tsx:20` | `403` de `apps/desk/server/routes/prioridad.ts:40` (sin cambio) | `TC27-3` (`apps/desk/server/prioridadTop5.test.ts:58`) y `TC27-4` (`:65`) |
| 7 | Qué prioridades ofrece el campo de una transición | `apps/desk/src/components/TransitionPanel.tsx:260` pinta `f.options`, que son las de `packages/shared/src/transitions.ts:84` (la hipótesis del diseño queda **confirmada por lectura**) | `422` de `apps/desk/server/services/ticketService.ts:134`, que suma `erroresPrioridadPedida` (`packages/shared/src/prioridad.ts:120`) | D9: `apps/desk/server/services/guardaPrioridad.test.ts:179` (`Low` y `Urgent`); M8 |

**Resultado: ninguna fila queda sin línea de servidor.** No hay hallazgo nuevo en esta tabla. Tres precisiones que no cambian el resultado:
- La fila 7 **no era** imponible antes de este cambio (`apps/desk/server/transitionExec.ts:88` escribe `String(raw)`); la impone D9 desde L2, y es el supuesto S-K.
- La fila 5 no es «el servidor lo impone» sino «el servidor no lo lee»: el cliente ya no envía nada; si alguien lo enviara a mano, se ignora.
- El texto de `PanelPrioridad.tsx` que enseña «cliente Top 5 (…)» en la cabecera es presentación de un dato del servidor (`top5`), no una decisión.

## Mutaciones M1 a M9 sobre el árbol final (L3.8)
Se corrió el conjunto `prioridad.test.ts`, `contratos.test.ts`, `cargos.test.ts`, `prioridadPropagada.test.ts`, `ticketService.test.ts`, `prioridadAlNacerVigencia.test.ts`, `prioridadTop5.test.ts`, `guardaPrioridad.test.ts`, `trazaTop5AlNacer.test.ts` y `propagarTop5.test.ts` (10 ficheros, 547 pruebas, verde en el árbol sin mutar). Cada mutación se hizo por script sobre el fichero, y se restauró con `git checkout` del fichero; tras cada una, `git diff --numstat` sobre `apps/desk/server`, `packages/shared` y `packages/zoho-sync` salió vacío.

| Mutación | Cambio | Pruebas en rojo |
|---|---|---|
| M1 | el `403` de `routes/prioridad.ts:71` baja detrás de `:74` | 2: P2 (`POSICIÓN B2 < C`) y P3 (`TC29-7`) |
| (P1) | el `403` sube por encima del `404` | 1: `POSICIÓN A < B2` |
| M2 | la guarda de prioridad de `ticketService.ts:131` sube antes del área (`:129`) | 2: T1 (`TS22-1`) y la prueba del `403` que nombra el área de `ticketService.test.ts` |
| M2 sobre T4 | **T4 no cae con M2** (el Director Técnico pasa el predicado, así que subir la guarda no cambia su veredicto): el diseño suponía lo contrario. T4 cae con «el cargo abre la transición» (`canExecuteTransition(...) \|\| puedeAjustarPrioridadTicket(user)` en `:129`) | 2: T4 y `TS21-8` |
| M3 | la misma guarda baja detrás del `throw` de `:134` | 2: T2 (`TS22-2`) y la posición de D9 (permiso gana a lista) |
| M4 | `CARGOS_AJUSTE_PRIORIDAD_TICKET` vacío | 11: P4 (`TC29-8`), T5, `PM23-1`, las dos matrices, el Director Técnico en las dos transiciones, sin área, el sincronizador y `cambiaPrioridadSinPermiso` |
| M5 | `Low` vuelve a `PRIORIDADES_ASIGNABLES` (no a `transitions.ts`) | 9: lista literal, **paridad** de las dos copias, `Low` no asignable, Top 5 con `Low`, `prioridadClienteDelCuerpo`, D9 en `prioridad.test.ts` y en `guardaPrioridad.test.ts` (2) y «Top 5 guardado con `Low` nace `Medium`» |
| M6 | `ticketService.ts:106` y `:108` vuelven a `b.prioridad` | 21 (tabla de «nace `Medium`», trazas, TC24-9, TC24-13, TC24-15, TC28-2, bloque nuevo, borde «el día siguiente») |
| M7 | `contratos.ts:43` `<` a `<=` | 12, en las dos capas: pura y servicio (el día del fin y el instante de UTC siguiente), más los previos |
| M8 | `erroresPrioridadPedida` retirada de `ticketService.ts:134` | 2: D9 `Low` y `Urgent` |
| M9 | datos: fila `cliente_prioridad` con `top5` verdadero y `Low`, sin tocar código | la prueba «Top 5 guardado con `Low` y sin contrato nace `Medium`» está verde en el árbol final, y cae con M5 y con M6 |

Ninguna mutación quedó verde.

## Barrido de citas (regla de mutación 4) — L3.9
**Medida real del desplazamiento.** `git diff 6344b4a -- packages/shared/src/prioridad.ts` muestra que **no se desplazó ninguna línea anterior a la 115**: las ediciones de L1 y L2 en ese fichero son todas en sitio (líneas 10, 12, 13, 55, 78, 79 y 85) y todo lo añadido (`PRIORIDAD_POR_DEFECTO`, `erroresPrioridadPedida`) cae al final. La premisa de que `PRIORIDAD_POR_DEFECTO` ganó 3 líneas tras la 13 no se sostiene contra el diff; por eso las citas con número ≥ 14 siguen apuntando a la misma línea que en `6344b4a`. `cargos.ts` sólo ganó 9 al final (más el comentario de la línea 78, en sitio). `git diff --numstat 6344b4a` confirma inserciones = borrados en `routes/prioridad.ts` (9/9), `ticketService.ts` (4/4), `contratos.ts` (3/3), `transitions.ts` (1/1), `prioridadPropagada.ts` (1/1), `prioridadCliente.ts` (2/2) y los tres `.tsx` (12/12).

**Método.** Barrido de completas (`<fichero>:N(-M)`) sobre los ficheros de texto trackeados, para los 11 ficheros tocados, quedándose con las citas cuyo rango roza una línea modificada; segundo pase para las abreviadas (`:N`) en las líneas que mencionan `prioridad.ts`. 407 citas rozan una línea tocada: 237 en `openspec/changes/archive/` (excluido del detector y de este lote), 63 en `docs/sdd/` (paquetes y partes fechados), 79 en los artefactos de este cambio y 28 vivas.

**Citas tocadas, con su caso** (todas EN SITIO, sin añadir ni quitar líneas):

| Cita | Dónde | Caso | Qué se hizo |
|---|---|---|---|
| `packages/shared/src/prioridad.ts:13` | `openspec/config.yaml:4143` | **C** | anclada a `6344b4a`; añade que la retiró `prioridad-tres-niveles` |
| `packages/shared/src/prioridad.ts:79` | `openspec/config.yaml:4150` | **C** | ídem; la levantó `prioridad-tres-niveles` |
| `apps/desk/server/routes/prioridad.ts:71` | `openspec/config.yaml:4151` | **C** | ídem; el predicado nuevo lo cambió `prioridad-tres-niveles` |
| `apps/desk/server/routes/prioridad.ts:69` | `openspec/config.yaml:4153` | **C** | ídem; el límite lo levantó `prioridad-tres-niveles` |
| `prioridad.ts:13` y `transitions.ts:84` («Low era asignable») | `proposal.md:31` | **B** | anclada a `6344b4a` |
| `contratos.ts:66-69` («no existía media el resto») | `proposal.md:33` | **B** | ídem |
| `prioridad.ts:79` y `routes/prioridad.ts:71` («no podía ajustar») | `proposal.md:34` | **B** | ídem |
| `routes/prioridad.ts:67-69` («sólo se admitía en Top 5») | `proposal.md:35` | **B** | ídem |
| `CreateTicket.tsx:426-429` («lista escrita a mano») | `proposal.md:124` | **B** | ídem |
| `routes/prioridad.ts:68-69` y `:67-69` (las dos guardas `409`) | `design.md:30` | **B** | ídem, con nombre de fichero completo |
| abreviadas `:106` y `:108` (lecturas de `b.prioridad`) y «acababa en `:114`» | `design.md:25` | **B** | nombre de fichero completo y `6344b4a`; el detector dejó de atribuirlas a `prioridadPropagada.ts` (abreviadas rotas de 15 a 13, las 13 que quedan son anteriores a este cambio) |

**Citas que rozan líneas tocadas y NO se tocan, con su caso:**
- **A (siguen ciertas)**: `ticketService.ts:134` en `transitions-st/spec.md` (9), `transitions-equipo-nuevo/spec.md` (3), `config.yaml:579` y `fechasDerivadas.ts:106` (la línea 134 sigue siendo el `422` agregado; sólo ganó un término); `transitions.ts:84` en `prioridad.test.ts:8`, `:82`, `prioridad.ts:12` (sigue siendo la línea de la lista de opciones); `routes/prioridad.ts:71`, `:66`, `:73-74` y `ticketService.ts:106`, `:131`, `:134` en `design.md`, `proposal.md` y `tasks.md` cuando son el plan o la descripción de un cambio en sitio.
- **Ya ancladas antes**: `contratos.test.ts:75` (`ticketService.ts:106 en 9288779`) y `tickets-core/spec.md:865` en `6344b4a` (`ticketService.ts:106 en 9288779`).
- **Documentos fechados** (no se editan; son caso B de origen): `docs/sdd/Paquete_de_Despliegue_2026-10-01.md` (37, entre ellas `routes/prioridad.ts:47-49`, `:69`, `:71` y `PanelPrioridad.tsx:27`), `Paquete_de_Despliegue_2026-09-29/30/10-03/10-04b`, `Preguntas_Gerencia_2026-09-29.md`, `Brecha_Maestro_R08.2_2026-09-17.md`, `F0-00_Baseline_as-built.md`, `F1B-09_Auditoria_blueprint_audit-F1B.md` y 237 citas bajo `openspec/changes/archive/`. **Ninguna bloquea** (el detector las lee contra su propia revisión o la línea existe y no está vacía).
- `exploration.md` de este cambio describe `6344b4a` («Hoy…») y no se edita.

**Para el archivo (specs vivas, que este lote no toca):** `tickets-core/spec.md:865` en `6344b4a` (RQ-TC-24: «la que hoy resulte del cuerpo, o ninguna») y `:861` quedan sustituidos por el delta de este cambio; `transitions-st/spec.md` RQ-TS-20 (`:837`, opciones con `Low`) y RQ-TS-21 (`:866-867`, `:871-872`) y `permissions/spec.md` RQ-PM-20/23 los reescribe la fusión. Ninguna de sus citas con número a ficheros tocados queda desfasada fuera de esas frases.

**Detector.** Ensayo antes de commitear: se construyó un commit suelto con el árbol de trabajo (sin mover ninguna referencia) y se corrió `cli.ts --sha` sobre él: sin citas bloqueantes; 13 abreviadas rotas informativas, todas anteriores a este cambio. La pasada oficial sobre el commit real es del orquestador.

## Documentos (L3.10 a L3.14)
- `openspec/config.yaml`: 4 líneas en sitio (`:4143`, `:4150`, `:4151`, `:4153`), 4 = 4. Cada ancla se comprobó contra `git show 6344b4a:<ruta>` (línea 13 de `prioridad.ts` con `Low`; 79 «Sin excepción para el Director Técnico»; 69 el `409` de no-Top-5; 71 el `403` del predicado viejo). Sin claves ni decisiones nuevas; `:4148` no se toca.
- `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: entrada **34** (el último número era 33), M1.9.1, sobre la R08.4: `…R08.4.md:1982`, `:1986-1987` y `:1990`, leídas por mí en el `.md` (1982 «La que fije el Director Comercial (Alta, Media o Baja)»; 1986 «Media o Baja» y 1987 su criterio; 1989 el `[ABIERTO]` que se conserva; 1990 el «Ajuste por ticket»). No da por decididos S-A a S-K.
- `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`: apartado 2 «Añadido por `prioridad-tres-niveles` (F1B-07, `cierra: no`)» al final: qué entra y qué no (sin esquema, sin variables, sin relleno), efectos al desplegar, la consulta de sólo lectura marcada «NO EJECUTADA» con las columnas confirmadas contra `schema.sql`, S-A a S-K (S-A y S-J subrayados), las siete entradas propuestas sin número, la tabla de personas P-1 a P-6 y por qué no cierra F1B-07. Confirmado con ruta y línea el hallazgo de `GET /api/top5` (`routes/prioridad.ts:23-25` y `prioridadCliente.ts:46-50`: filtra sólo por `top5 = true`).
- L3.14: `git diff --name-only 6344b4a` no contiene `CLAUDE.md`, `docs/sdd/ENTRADA.md`, `openspec/specs/**`, `packages/zoho-sync/src/db/repo.ts`, `schema.sql`, `RECONCILIACION.md` ni el paquete del 06/10.

## Cierre (L3.15 a L3.18)
- `git diff --numstat aed4aa4`: ver la lista completa en el informe de fase. Inserciones = borrados en los tres `.tsx` (6/6, 4/4, 2/2), `design.md` (2/2), `proposal.md` (5/5) y `config.yaml` (4/4); los dos documentos `docs/sdd` sólo añaden (31 y 110). Estado final de L1 y L2 frente a `6344b4a`: `ticketService.ts` 4/4, `routes/prioridad.ts` 9/9, `transitions.ts` 1/1, `contratos.ts` 3/3.
- `npm test`: código 0; 259 ficheros pasan y 2 saltados; 4226 pruebas pasan y 7 saltadas (la misma cifra que al cierre de L2: este lote no añade pruebas).
- `npm run typecheck`: código 0.
- `npm run lint`: código 0; 165 avisos y 0 errores (la base).
- `npm run build`: código 0; el cliente compila (`CreateTicket`, `PanelPrioridad` y `TransitionPanel` incluidos).
- Pendiente del orquestador: commit y detector de citas (`cli.ts --sha HEAD`), por eso L3.16 queda sin marcar.
- Medida del intento: `git diff --shortstat --no-renames aed4aa4` = 278 inserciones + 40 borrados = 318, sin ficheros nuevos sin trackear ni binarios (se midió con este bloque ya escrito); por debajo de 800 y de la válvula de 720.

## Remediación tras el verify

Lote único de remediación de los avisos del verify (`verify-report.md`, W1 a W4 y S1). Código de producción sin tocar (`git diff` sólo muestra pruebas y artefactos). Las pruebas son de caracterización: nacen verdes; cada una se demostró discriminante con una mutación del código de producción, restaurada con `git checkout` (sin rastro en `git diff`).

| Aviso | Qué se hizo | Prueba | Mutación que la pone roja |
|---|---|---|---|
| W1 | `Low` añadido en sitio a los dos bucles de ruta (inserciones = borrados, 5/5 en el fichero). En TC29-3 el ticket sembrado pasó de `Low` a `Medium`: con `Low` actual, el `422` lo daba «igual a la actual» y no la lista, y la prueba no discriminaba | `apps/desk/server/prioridadTop5.test.ts:70` (TC27-5) y `apps/desk/server/prioridadTop5.test.ts:237` (TC29-3) | `PRIORIDADES_ASIGNABLES` de `packages/shared/src/prioridad.ts` con `Low` añadido: caen las dos (2 en rojo) |
| W3a | Top 5 guardado con `Low` y contrato vigente: el alta nace `High` | `apps/desk/server/services/ticketService.test.ts:1494` (bloque nuevo, al final) | el alta ignora el contrato si el cliente tiene fila Top 5 (`ticketService.ts:106`): cae ella y otras dos (3 en rojo) |
| W3b | Fila sembrada con `Low`, se vuelve a guardar con `High`: impone, propaga y deja traza `Low`→`High` | `apps/desk/server/propagarTop5.test.ts:239` (bloque nuevo, al final) | `cambioPorTop5` devuelve `null` si el actual es `Low`: cae ella (14 en rojo en total) |
| W3c | Los tres «conserva»: tras un alta nueva del mismo cliente, `Low`, `Urgent` y sin prioridad quedan igual y sin traza; tras un `PUT` que desmarca la fila `Low`, igual | `apps/desk/server/services/ticketService.test.ts:1494` y `apps/desk/server/propagarTop5.test.ts:239` | alta que reescribe a `Medium` los tickets del cliente: cae la de alta (1); `cambioPorTop5` sin la salida «sin base» y con base `Medium`: cae la del `PUT` (3 en rojo) |
| W2 | Retirado el escenario «un alta sin `client_id` nace `Medium`» y corregida la frase del cuerpo de RQ-TC-24: el alta sin cliente responde `422` (`apps/desk/server/services/ticketService.ts:84` y `apps/desk/server/services/ticketService.ts:88`) | — | — |
| S1 | `design.md` §7, fila M2: sólo T1; T4 cae con «el cargo abre la transición» | — | — |
| W4 | No se toca: divergencia declarada, sin destino | — | — |

**Hallazgo sobre los «conserva».** Un `PUT` que vuelve a guardar el Top 5 con `High` SÍ cambia un ticket abierto `Low` a `High` (propagación, RQ-TC-35): la regla "conserva" de RQ-TC-56 vale al entrar en vigor y frente a un alta o una desmarcación, no frente a un nuevo guardado con una prioridad de la lista. Por eso el escenario del delta y las pruebas se escribieron con el `PUT` que desmarca; el que guarda con `High` lo cubre W3b. El texto del delta ya dice «al entrar en vigor», no se modificó.

## Corrección del ajuste manual (2026-10-08, tras el verify)

Intento propio, techo 300. Corrige D8 y S-J: `ajustarPrioridad` (`apps/desk/server/db/prioridadCliente.ts:93`) pasa a proteger sólo la prioridad.

- **De dónde salía S-6.** De un supuesto de tanda de `prioridad-top5-cliente` (su `proposal.md`, «S-6 · Ajuste y sync»), no de una decisión: `openspec/config.yaml` no fija `managed_by_app` para el ajuste en `decision/top5-manual`, `decision/cola-del-taller-los-tres-cabos` ni `decision/p3b-prioridad-tres-niveles`. El «no se migra» de `zoho-sync` RQ-ZS-01 es una exclusión de alcance de `propagar-top5-lista-remision-creada`.
- **Lo que escribe ahora:** `priority`, `prioridad_en_app_at = now()` y `updated_at`. Lo que deja de escribir: `managed_by_app = true`, `source = 'app'` y `modified_time = now()`. Un ticket que ya era `managed_by_app` lo sigue siendo. Mismas líneas en el fichero: ninguna cita se desplaza; `packages/zoho-sync/src/db/repo.ts` no se toca.
- **`modified_time` se quita, y no es opcional.** La marca de agua del sincronizador es `max(modified_time)` de las filas con `managed_by_app = false` (`packages/zoho-sync/src/sync.ts:381`). Mientras el ajuste ponía `managed_by_app`, su `now()` quedaba fuera de ese máximo; al dejar de ponerla entraría, y adelantaría la marca con el reloj local por encima de lo que Zoho aún no ha entregado. Consecuencia declarada: el ajuste ya no marca el ticket como no leído (`packages/zoho-sync/src/db/repo.ts:139` compara `read_at` con `modified_time`), tampoco en los tickets de la aplicación. Es lo mismo que hace la propagación (`apps/desk/server/db/prioridadCliente.ts:118`).
- **Sin relleno.** Los tickets ajustados antes de este cambio conservan `managed_by_app`: dato de producción, decisión de persona.

| Prueba | Qué fija | Mutación que la pone roja |
|---|---|---|
| TC29-11 (`apps/desk/server/prioridadTop5.test.ts:320`), invertida en sitio | (a) ticket de Zoho ajustado: `managed_by_app`, `source` y `modified_time` intactos; `upsertTicket` con otro estado y otra prioridad actualiza el estado y conserva la prioridad; (b) la traza se escribe con origen vacío | `managed_by_app = true`: 3 rojas (ella, la gemela y la de `propagarTop5.test.ts`). `source = 'app'`: 1. `modified_time = now()`: 1. Sin la marca: 4. Sin el `INSERT` de la traza: 8 |
| TC29-11b (`apps/desk/server/prioridadTop5.test.ts:466`), nueva, al final del fichero | Un ticket que ya era `managed_by_app` lo sigue siendo y recibe la marca | Sin la marca: roja |
| Gemela del Director Técnico (`apps/desk/server/prioridadTop5.test.ts:449`) y `apps/desk/server/propagarTop5.test.ts:186` | `managed_by_app` sigue falso tras el ajuste; la marca queda puesta | `managed_by_app = true`: rojas las dos |
| `packages/shared/src/prioridadPropagada.test.ts:66`, una aserción añadida | Desmarcar sin base y CON contrato vigente no toca el ticket | Quitar la salida «sin base» de `cambioPorTop5` (`packages/shared/src/prioridadPropagada.ts:46`): sobrevivía a las 1.229 pruebas de `propagarTop5.test.ts` y `packages/shared`; ahora 1 roja |

**Contraste de la remediación, por el orquestador.** Las cinco mutaciones de la tabla de «Remediación tras el verify» se repitieron una a una sobre `f08bed2` y dieron los mismos recuentos (2, 3, 14, 1 y 3 rojas), con el árbol restaurado después de cada una.

**Delta de `zoho-sync` (intento propio, mismo día).** La spec viva decía lo contrario de lo construido: RQ-ZS-01 fijaba que el ajuste manual «SHALL seguir marcando `managed_by_app`; no se migra a la marca nueva» (`openspec/specs/zoho-sync/spec.md:121-122` en `6344b4a`) y lo repetía en un escenario (`openspec/specs/zoho-sync/spec.md:212-215` en `6344b4a`). El cambio gana una cuarta capacidad: `specs/zoho-sync/spec.md` trae el bloque `MODIFIED` de RQ-ZS-01, generado por script desde el bloque vivo, con cinco líneas distintas y las mismas 165 de largo, de modo que la spec viva no se desplaza al fusionar. El ensayo de `fusiona.mjs --dry` da 15 bloques: 14 `MODIFIED` y 1 `ADDED`. Antes de este delta eran 13 `MODIFIED` y 1 `ADDED`, no 12 como decía el traspaso.
