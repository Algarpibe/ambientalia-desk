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
