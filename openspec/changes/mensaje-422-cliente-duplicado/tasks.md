# Tasks: mensaje-422-cliente-duplicado

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ≈295 (código ~14, tests ~55, delta de spec ~45, artefactos SDD ~180) |
| 800-line budget risk | Low (presupuesto de esta sesión: 800) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR única |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Baseline a batir (`b3fc829`): 112 ficheros / 999 pruebas pasadas, 1 fichero + 2 pruebas omitidas, exit 0.
Ninguna tarea puede bajar de esa cifra ni tocar las 2 omitidas.

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Mensaje `422` con nombre e id de los dos clientes, dentro de la rama (ii) | única | `npx vitest run apps/desk/server/services/ticketService.test.ts` | Verificación manual en `ambientalia-desk.ambientalia.cloud` (alta con equipo y cliente de formularios distintos) | `git revert` del commit: mismo `422 { error }`, sin migración ni dato escrito que deshacer (design §6) |

## No incluido en estas tareas

`getClient` filtrando por `contact_type`; desduplicar `books.contacts`; la precedencia `409`↔`422` del
alta (§4.1, punto abierto); pruebas `.tsx` (decisión de Gerencia, F0-00, 2026-09-08).

## Fase 1 · RED — las cuatro pruebas nuevas (`ticketService.test.ts`, describe `:361-398`)

- [x] 1.1 T1 · nombres duplicados — dentro del describe `la guarda equipo↔cliente`, añadir
      `equipoConCliente('eq-1','cli-A','Gecelca S.A. E.S.P.')` + `cliente('cli-B')` (mismo nombre
      literal que el helper siempre inserta: es el caso real de duplicado, sin tocar ningún helper) +
      body `clientId:'cli-B'`; afirmar con `toBe` el renderizado 1 completo de design §1.
- [x] 1.2 T2 · nombres distintos — `equipoConCliente('eq-1','cli-A','Ambientalia S.A.S.')` +
      `cliente('cli-B')`; `toBe` sobre la forma normal (design §1, renderizado con dos nombres reales).
- [x] 1.3 T3 · destino sin ficha en Books — `equipoConCliente('eq-1','cli-A','Gecelca S.A. E.S.P.')`
      SIN llamar a `cliente('cli-B')`; `toBe` sobre el renderizado 3 («sin ficha en Books»), no
      «Cliente no encontrado».
- [x] 1.4 T4 · equipo sin `cliente_nombre` — `equipoConCliente('eq-1','cli-A')` (sin tercer argumento)
      + `cliente('cli-B')`; `toBe` sobre el renderizado 2 («sin nombre en el equipo»).
- [x] 1.5 Ejecutado `npx vitest run apps/desk/server/services/ticketService.test.ts`: T1–T4 fallaron
      por `AssertionError` (comparación `toBe` de cadena), no por excepción ni 500. Fallos reales
      (`error` recibido, antes del GREEN):
      T1/T2/T3 → `El equipo 18A20070 es de «{nombre}» y el ticket se está creando para otro cliente.
      Corrige el cliente o el equipo.` (el mensaje viejo de `9ed5635`, sin id ni destino).
      T4 → `El equipo 18A20070 es de «cli-A» y el ticket se está creando para otro cliente. Corrige el
      cliente o el equipo.` (mismo mensaje viejo; `nombreEquipo = equipo.clienteNombre ?? equipo.clientId`
      caía al id porque no había `clienteNombre`). Las 30 pruebas previas del fichero siguieron en
      verde (red de seguridad confirmada antes de tocar producción).

## Fase 2 · GREEN (`ticketService.ts`, rama (ii), `:69-77` en el árbol de partida)

- [x] 2.1 Tras el `logger.warn` (línea sin mover): `const destino = await getClient(db, clientId)`
      (usa el `getClient` ya importado en `:4`, sin import nuevo), el ayudante local
      `lado(nombre, id, nota)` y `deQuien`/`paraQuien` según design §1–§2.
- [x] 2.2 Sustituido el `throw` viejo por la plantilla de design §1 con `deQuien`/`paraQuien`.
- [x] 2.3 Repetido el comando de 1.5: T1–T4 en verde (34/34), y las tres pruebas ya existentes del
      mismo describe — incluida `:369` (`toContain('cli-A')`) — siguen en verde sin tocarlas.

## Fase 3 · REFACTOR

- [x] 3.1 Contrastado el bloque contra design §2: `lado` sigue local al `else if` (no sube a módulo),
      sin código muerto. Coincide letra a letra con el diseño; sin cambios.

## Fase 4 · Mutaciones — regla de mutación 1, las seis se ejecutaron de verdad

- [x] 4.1 M-P1 — bajada la rama (ii) detrás del `getClient` (línea `:93` en el árbol final antes de la
      mutación), reutilizando `cliente.name`; ejecutado T3 → **ROJA, como predicho**. Resultado
      observado: `Cliente no encontrado` en vez del mensaje de discrepancia (la guarda «Cliente no
      encontrado» ganó precedencia, exactamente lo que M-P1 debía demostrar). Revertido; suite completa
      del fichero vuelta a 34/34 verde tras revertir.
- [x] 4.2 M-P2 — subida la rama (ii) por encima del `409` de `:45-49`; ejecutada la suite completa
      (34 pruebas). **Resultado observado: VERDE, como predicho** (design §5: las dos pruebas del
      tramo 409 usan `equipo()`, que nunca fija `client_id`, así que la rama (ii) no se dispara).
      Registrado como hallazgo, no como defecto — no se abrió la precedencia `409`/`422` de
      `tickets-core` §4.1. Revertido.
- [x] 4.3 M-C1 — puesto `equipo.clientId` en el lado del destino (`paraQuien`); ejecutado T1 → **ROJA,
      como predicho**. Resultado observado: `...para «Gecelca S.A. E.S.P.» (cli-A)` en vez de
      `(cli-B)` — el id del destino salió igual al del equipo. Revertido.
- [x] 4.4 M-C2 — rendido el id crudo del destino sin resolver su nombre (`paraQuien = clientId`);
      ejecutado T1 → **ROJA, como predicho**. Resultado observado: `...para cli-B.` sin nombre ni
      paréntesis. Revertido.
- [x] 4.5 M-C3 — quitado el respaldo del destino sin ficha (`paraQuien` sin `lado`, literal con
      `destino?.name`); ejecutado T3 → **ROJA, como predicho**. Resultado observado:
      `...para «undefined» (cli-B)` en vez de `cli-B (sin ficha en Books)`. Revertido.
- [x] 4.6 M-C4 — quitado el respaldo del equipo sin nombre (`deQuien` literal con
      `equipo.clienteNombre`); ejecutado T4 → **ROJA, como predicho**. Resultado observado:
      `El equipo 18A20070 es de «undefined» (cli-A)...` en vez de `cli-A (sin nombre en el equipo)`.
      Confirmado explícitamente: `:369` (`toContain('cli-A')`) **no** se puso roja bajo esta mutación
      — sigue verde porque el id se muestra siempre y no es su detector, tal y como predijo el diseño.
      Revertido.
      Cierre de fase: diff final de `ticketService.ts` contrastado contra el estado post-GREEN — 0
      residuos de mutación, `git diff --stat` = 12 líneas (+/-) exactas del bloque de design §2.

## Fase 5 · Regresión — qué sigue verde y por qué

- [x] 5.1 Constancia dejada (este documento y el commit): `ticketService.test.ts:369` sigue en verde
      sin tocarla, y no sirve de detector del contenido nuevo (M-C4): contiene `'cli-A'` sea cual sea
      el mensaje.
- [x] 5.2 Confirmado en verde, sin tocarlas: el describe `la guarda equipo↔cliente no cambia lo que ya
      pasaba` y las pruebas de precedencia `409`/`422` (`createManagedTicket · el ORDEN en que se
      evalúan las guardas`) — las 34 pruebas del fichero pasan en la corrida final de fase 2/7.

## Fase 6 · Re-anclaje de citas — ÚLTIMA tarea del apply

- [x] 6.1 Con el código final, recalculadas las cuatro citas de E1 (todo lo desde la antigua `:78`
      se desplazó **+6**, y el bloque de la guarda 5 pasó de `:65-77` a `:65-83`):
      | Cita | Decía | Pasa a decir | Verificado en |
      |---|---|---|---|
      | `ticketService.ts:56` | `:54` | `:88` | lectura del fichero final, línea 88 = `if (!clientId) missing.push('cliente')` |
      | `ticketService.test.ts:250` | `ticketService.ts:53-58` | `ticketService.ts:87-92` | bloque obligatorios (missing[] → throw), líneas 87-92 |
      | `ticketService.test.ts:303` | `ticketService.ts:22-60` | `ticketService.ts:22-94` | cadena de guardas completa, hasta «Cliente no encontrado» en :94 |
      | `ticketService.test.ts:358` | `:54` | `:88` | mismo target que la fila 1 |
- [x] 6.1b **Dos sitios más, entrados por un hallazgo externo de `sdd-verify` de otra tanda en
      paralelo (no por el diseño de esta tanda)**: `ticketService.test.ts:176` y `:179` citaban
      `:319` (línea vacía / cierre de `describe`, nada ahí); el test real
      («la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422») está en `:327`,
      verificado leyendo el fichero final. Corregidas las dos apariciones a `:327`. El comentario
      gemelo de `:321-326` ya citaba bien `:194` y `:171-193` — verificado que sigue así tras mis
      inserciones (que ocurren después, en el describe de `:361+`, y no desplazan nada anterior).
- [x] 6.2 Reancladas, dentro del delta `specs/tickets-core/spec.md`, las citas de `RQ-TC-05` y
      `RQ-TC-13` que dependían del bloque desplazado: función `:20-99`→`:20-105`; fila 5
      `:65-77`→`:65-83`; fila 6 `:81-86`→`:87-92`; fila 7 `:87-88`→`:93-94`; viñeta prefijo
      `:85`→`:91`; nota «Previously» orden `:76`→`:82`; RQ-TC-13 «antes de crear el ticket»
      `:91`→`:97`; «Cliente no encontrado es guarda posterior» `:88`→`:94`; posición de la guarda
      `:81-86`→`:87-92`. Actualizada también la nota de procedencia de cabecera del delta: ya no dice
      «provisional», dice que el reanclaje está hecho y documenta el desplazamiento (+6 desde la
      antigua `:78`, `:65-77`→`:65-83`).
- [x] 6.3 Verificado visualmente contra el fichero final — no de memoria — releyendo
      `ticketService.ts` completo (líneas 1-105), `ticketService.test.ts` en los tramos tocados, y el
      delta de spec completo (125 líneas). Ninguna cita de 6.1/6.1b/6.2 quedó caduca.

## Fase 7 · Compuertas finales

- [x] 7.1 `npm test` completo: **112 ficheros / 1003 pruebas pasadas, 1 fichero + 2 pruebas omitidas,
      exit 0**. Contra el baseline `b3fc829` (112/999, 1+2 omitidas): **+4 pruebas exactas** (T1-T4),
      0 rotas, 0 borradas, mismas 2 omitidas.
- [x] 7.2 `npm run typecheck`: verde, sin salida, exit 0.
- [x] 7.3 `npm run lint`: 0 errores, 158 avisos — los 158 son preexistentes en `packages/zoho-sync`
      (`@typescript-eslint/no-explicit-any`); **0 avisos nuevos** en `ticketService.ts` ni
      `ticketService.test.ts` (confirmado con grep dirigido).
- [ ] 7.4 Verificación en la app (`ambientalia-desk.ambientalia.cloud`): pendiente — requiere sesión
      interactiva en el navegador contra producción, fuera del alcance de este entorno de ejecución.
      Queda para quien despliegue el cambio, junto al criterio de aceptación §8 de la propuesta.
- [ ] 7.5 Commit: el orquestador hace el commit, no `sdd-apply` (regla explícita de esta sesión:
      «No commit. El orquestador hace el commit»). Árbol de trabajo dejado con los cambios sin
      commitear.
