# apply-progress: tipo-servicio-ticket-sin-ov (F1B-03, parte L)

**Lote 1 · tareas 1.1-1.46: 46/46.** Modo: Strict TDD. Worktree `tipo-servicio-ticket-sin-ov`, partida `a77ec68`. Lotes 2 y 3 pendientes. Línea base: `npm test` 2543 pasan, 1 roja (la de 1.2), 2 omitidas; typecheck limpio; lint 165 avisos, 0 errores. Cierre: `npm test` 2611 pasan, 0 rojas, 2 omitidas (178 ficheros, +1); typecheck limpio; lint 165, 0 errores.

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED (capturado) | GREEN | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2 | `reconciliacion/registro.test.ts:218-220` | Unidad | 22/23 (la roja es la tarea) | F1B-03 aparece «en curso»: Expected sin `F1B-03`, Received con él | 23/23, en sitio | ➖ misma línea | ➖ |
| 1.3-1.5 | `shared/src/remision.test.ts` | Unidad | 11/11 | 24 de 35 rojas: `esRemisionEntradaVigente is not a function` | 35/35 | ✅ 6 estados × 3 tipos de fila; 6 casos del texto | ➖ |
| 1.6 | (ayudante, sin prueba propia; lo ejercen 1.7-1.34) | — | N/A (nuevo) | N/A | ejercido | ➖ | ➖ |
| 1.7-1.12 | `services/ticketService.test.ts`, bloque RQ-TS-33 | Integración (pg-mem) | 125/125 | 16 rojas de 142 con la guarda ausente (sin remisión → 200 en vez de 422; anuladas, tipo distinto, motivo, equipo nuevo, espía de control) | 142/142 | ✅ 3 orígenes, 9 filas sucias, equipo nuevo, 3 espías | ➖ |
| 1.13-1.19 | ídem (P1 a P7) | Integración | ídem | P3, P4, P5 rojas con la guarda ausente; P1, P2, P6, P7 nacen verdes (su rojo es 1.35, 1.36, 1.40, 1.41) | verde | ✅ cada una activa dos guardas | ➖ |
| 1.20-1.21 | `db/remisionVigente.test.ts` (nuevo) | Integración | N/A (nuevo) | 10 rojas de 11: `vigenciaDeRemisiones is not a function`; la de `listRemisionesByTicket` nace verde | 11/11 | ✅ 5 coincidencias, 2 de `estado`, 1 de `tipo` | ➖ |
| 1.22-1.23 | (producción; lo cubren 1.3-1.21) | — | suite verde antes de la guarda (salvo 1.2) | las 16 rojas de 1.7-1.19 y las 10 de 1.20 | verde | ➖ | ➖ |
| 1.24-1.34 | las 8 suites adaptadas | Integración | verdes antes de la guarda | con la guarda: 15 rojas en `ticketService`, 11 en `transiciones`, 4 en `ordenVentaUnTicket` | `ticketService` 142/142; `transiciones` 26/26; `ordenVentaUnTicket` 10/10; las otras 5, 120/120 | ✅ controles de 1.33 y 1.34 | ➖ |
| 1.35-1.43 | mutaciones | — | verde | cada mutación en rojo: ver abajo | revertidas, `cmp` idéntico | — | — |

**Rojos de 1.33 y 1.34 (control):** sin la remisión de la línea 16, 6 de 26 en `transiciones.test.ts` (entre ellas «rechaza derivar a alguien que no existe…», por el texto de la persona que falta). Sin la de `:927`, roja «POSICIÓN habilitar_servicio: la OV en cuarentena YA está en otro ticket».

## Mutaciones (todas reproducidas, revertidas con `cmp` contra el GREEN; `git diff` de `estadoPorRemision.ts` vacío)

| Mutación | Movimiento | Roja |
|---|---|---|
| m1 | quitar `r.tipo === 'entrada' &&` | 7: «tipo distinto» ×6 y `motivoSinRemisionVigente` «sólo de tipo distinto» |
| m2 | quitar `!r.anuladaAt` | 7: «entrada ANULADA» ×6 y «sólo anuladas» |
| m3 | filtro de estado `ok`/`ok_con_avisos` | 6 en `remision.test.ts`; con servidor y RQ-RE-20, 40 en total (los `200` todas: la lectura no trae `estado`) |
| P1 | llamada antes del `if` de la 129 | P1, P2 y 5 de F1B-15 (RQ-TS-32) |
| P2 | intercambiar las dos llamadas | P2 y 4 de F1B-15 |
| P3, P4 | llamada detrás de la 134 | P3 y P4 (misma mutación; P4 no añade discriminación); P5 verde |
| P5 | llamada detrás de la 152 | P3, P4 y P5 |
| P6 | al final de la 125 | P6, P1, P2 y 5 de F1B-15; P7 verde |
| P7 | entre el `404` y `exigirMismoFlujo` | P7, P6, P1, P2 y 5 de F1B-15 |
| m5 | quitar la salida temprana | 16: espías de `ingreso_a_servicio` y «Soporte remoto», más 14 transiciones que reciben el `422` |
| d1 | quitar `estado` del recuento | 2: filas `pendiente` y `error` |
| d2 | `AND tipo = 'entrada'` en el recuento | 1: fila `tipo` distinto |
| 1.21 | `AND estado <> 'error'` en `listRemisionesByTicket` (línea 77) | 1: «listRemisionesByTicket devuelve las no anuladas de cualquier estado» |

## Hipótesis comprobadas

- **(a)** `ovAsociaciones.test.ts` con la `ok` en `ovLiberada`: 45/45 verdes, la puerta 3 contesta `201`. Con una `pendiente` en su lugar: 3 rojas (puerta 3 y dos de transacciones, `409`). Confirma la razón del `ok` por omisión.
- **(b)** `transiciones.test.ts:201-204`: borrar `remisiones` ENTRE la primera y la segunda transición deja la prueba verde. Matiz: quitarla del ticket desde el principio no se puede, la primera transición (`habilitar_servicio`) la exige.

## Hallazgos y desviaciones

1. **El mutante equivalente del diseño está mal descrito.** Mover sólo la guarda delante de cargo, prioridad o verificación (dentro de la 131) la deja delante de `exigirAltaValidada` y **P2 se pone roja** (5 rojas). El equivalente real es mover **el par** `exigirAltaValidada` + `exigirRemisionVigente` delante de cargo: 251/251 verdes en las seis suites que llegan. Sigue declarado.
2. Las mutaciones de posición ponen rojas, además de la propia, las 5 pruebas de F1B-15 (RQ-TS-32) sin remisión: son colaterales, no defecto.
3. 1.12 y los espías (1.11): `ingreso_a_servicio` pide `Código Servicio`, `Fecha creación ticket` y `Fecha Remisión Entrada`; el espía lo usa con control de población (`habilitar_servicio` ejecuta la lectura nueva una vez).
4. Suites con extremos de línea mixtos (`transiciones.test.ts`): las ediciones se hacen antes del CR. Medido con `git diff`: sólo hunks en sitio o al final.
5. 1.21: el SQL de `listRemisionesByTicket` está en la línea 77 (dentro de 76-79).

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run packages/shared/src/remision.test.ts apps/desk/server/services/ticketService.test.ts apps/desk/server/db/remisionVigente.test.ts`: 188 pasan |
| Arnés real | `POST /api/tickets/:id/transition` contra pg-mem: `permisos`, `cargoPermiso`, `transicionesEjecucion`, `flujoEquipoNuevo`, `ovAsociaciones`, `transiciones`, `ordenVentaUnTicket`: 120 + 26 + 10 verdes |
| Frontera de reversión | `git revert` del lote; sólo la guarda: quitar `; await exigirRemisionVigente(db, t, id)` de la línea 131 |
