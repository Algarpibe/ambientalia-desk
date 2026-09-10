# Apply Progress: mensaje-422-cliente-duplicado

**Batch**: 1 (first and only batch — no previous apply-progress existed for this change).
**Mode**: Strict TDD.
**Base**: `main` en `984b7aa`.

## Completed Tasks

- [x] 1.1–1.5 (Fase 1 · RED) — T1–T4 escritas en `ticketService.test.ts`, dentro del describe `la
      guarda equipo↔cliente`; confirmadas rojas por `AssertionError` de comparación de cadena, no por
      excepción/500. Red de seguridad previa: 30/30 pruebas del fichero en verde antes de tocar código.
- [x] 2.1–2.3 (Fase 2 · GREEN) — consulta `getClient`, ayudante `lado`, `deQuien`/`paraQuien` y nueva
      plantilla del `422` dentro de la rama (ii), después del `logger.warn` (byte a byte igual) y antes
      del `throw`. T1–T4 y las 30 pruebas previas en verde (34/34).
- [x] 3.1 (Fase 3 · REFACTOR) — contrastado contra design §2; sin cambios, coincide letra a letra.
- [x] 4.1–4.6 (Fase 4 · Mutaciones) — las seis ejecutadas de verdad, revertidas todas. Ver tabla abajo.
- [x] 5.1–5.2 (Fase 5 · Regresión) — confirmado en verde: `:369` (`toContain('cli-A')`, no detector de
      M-C4), el describe "no cambia lo que ya pasaba", y las pruebas de precedencia 409/422.
- [x] 6.1 (Fase 6 · re-anclaje E1, las 4 citas) + 6.1b (dos sitios más, hallazgo externo de `sdd-verify`
      de otra tanda en paralelo) + 6.2 (re-anclaje `RQ-TC-05`/`RQ-TC-13` en el delta de spec) + 6.3
      (verificación visual final). Ver tabla de re-anclaje abajo.
- [x] 7.1–7.3 (Fase 7 · compuertas) — `npm test`, `npm run typecheck`, `npm run lint`. Ver resultados
      abajo.

## Remaining Tasks (fuera del alcance de `sdd-apply` en este entorno)

- [ ] 7.4 — Verificación manual en `ambientalia-desk.ambientalia.cloud`: requiere sesión interactiva de
      navegador contra producción, no disponible en este entorno de ejecución. Queda para quien
      despliegue el cambio.
- [ ] 7.5 — Commit: por instrucción explícita de esta sesión ("No commit. El orquestador hace el
      commit"), `sdd-apply` deja el árbol de trabajo con los cambios sin commitear.

**24/26 tareas completas** (25 originales de `tasks.md` + 1 tarea 6.1b añadida por el hallazgo externo
del coordinador, registrada aparte y NO parte del diseño original). Las 2 restantes están fuera del
alcance ejecutable de este agente, no bloqueadas por defecto.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1–1.5 / 2.1–2.3 | `apps/desk/server/services/ticketService.test.ts` | Unit (integración con `pg-mem`) | ✅ 30/30 antes de tocar código | ✅ T1–T4 escritas primero, fallaron por `AssertionError` de cadena (no excepción/500) | ✅ 34/34 tras implementar `getClient`+`lado`+plantilla | ✅ 4 casos (T1 duplicados, T2 distintos, T3 sin ficha, T4 sin nombre) — la plantilla literal se generalizó desde el primer intento porque el diseño ya la fijaba entera, no hubo Fake-It intermedio | ✅ Contrastado contra design §2 (fase 3); sin cambios — ya coincidía letra a letra |

## Test Summary

- **Total tests written**: 4 (T1, T2, T3, T4)
- **Total tests passing**: 34/34 en `ticketService.test.ts` (30 preexistentes + 4 nuevas)
- **Layers used**: Unit/integración con `pg-mem` (4)
- **Approval tests**: N/A — no hubo tarea de refactoring de comportamiento existente, sólo de
  contenido de mensaje dentro de una rama ya cubierta
- **Pure functions created**: 1 (`lado`, local al bloque `else if`, no sube a módulo por decisión de
  design §2)

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npx vitest run apps/desk/server/services/ticketService.test.ts` → 34/34 passed (final) |
| Runtime harness command/scenario and exact result | `npm test` completo → 112 ficheros / 1003 pruebas pasadas, 1 fichero + 2 omitidas, exit 0 |
| Rollback boundary | `git revert` del commit único: todo lo nuevo vive dentro de la rama `else if` (`:69-83`); quitarla deja `(i)` intacta y el `422` vuelve a la forma de `9ed5635`. Sin migración, sin dato escrito que reparar |

## Mutation Table — resultados observados (regla de mutación 1)

| # | Tipo | Mutación | Prueba esperada ROJA | Predicción | **Resultado observado** |
|---|---|---|---|---|---|
| M-P1 | POSICIÓN | Rama (ii) bajada detrás del `getClient` (`:93` final), reutilizando `cliente.name` | T3 | ROJA | **ROJA, confirmado.** `body.error` = `'Cliente no encontrado'` en vez del mensaje de discrepancia — la guarda «Cliente no encontrado» ganó precedencia, la razón exacta que predijo el diseño. Revertido; 34/34 verde tras revertir |
| M-P2 | POSICIÓN | Rama (ii) subida por encima del `409` de `:45-49` | Ninguna — se esperaba VERDE | VERDE | **VERDE, confirmado.** 34/34 pasaron sin cambios; causa verificada: las dos pruebas del tramo 409 (`:327`, `:336`) montan el equipo con `equipo()`, que nunca fija `client_id`, así que la rama (ii) no se dispara en ellas. Registrado como hallazgo, no como defecto — no se abrió la precedencia 409/422 de `tickets-core` §4.1. Revertido |
| M-C1 | contenido | `equipo.clientId` en el lado del destino (`paraQuien`) | T1 | ROJA | **ROJA, confirmado.** `...para «Gecelca S.A. E.S.P.» (cli-A)` en vez de `(cli-B)`. Revertido |
| M-C2 | contenido | Id crudo del destino sin resolver nombre (`paraQuien = clientId`) | T1 | ROJA | **ROJA, confirmado.** `...para cli-B.` sin nombre ni paréntesis. Revertido |
| M-C3 | contenido | Quitar el respaldo del destino sin ficha | T3 | ROJA | **ROJA, confirmado.** `...para «undefined» (cli-B)` en vez de `cli-B (sin ficha en Books)`. Revertido |
| M-C4 | contenido | Quitar el respaldo del equipo sin nombre | T4, y `:369` NO debe ponerse roja | ROJA (T4), verde (`:369`) | **Ambas predicciones confirmadas.** T4: `«undefined» (cli-A)` en vez de `cli-A (sin nombre en el equipo)` → ROJA. `:369` (`toContain('cli-A')`) siguió VERDE — el id se muestra siempre, no es su detector. Revertido |

Todas revertidas; `git diff --stat apps/desk/server/services/ticketService.ts` final = 12 líneas
(+/-), exactamente el bloque de design §2, sin residuos de mutación.

## Re-anchoring Table (Phase 6, LAST step)

### E1 — las cuatro citas originales (código)

| Cita | Decía | Pasa a decir | Verificado |
|---|---|---|---|
| `ticketService.ts:56` | `:54` | `:88` | línea 88 = `if (!clientId) missing.push('cliente')` |
| `ticketService.test.ts:250` | `ticketService.ts:53-58` | `ticketService.ts:87-92` | bloque obligatorios (missing[] → throw) |
| `ticketService.test.ts:303` | `ticketService.ts:22-60` | `ticketService.ts:22-94` | cadena de guardas completa hasta «Cliente no encontrado» |
| `ticketService.test.ts:358` | `:54` | `:88` | mismo target que la fila 1 |

### Sitio A/B — hallazgo EXTERNO, no del diseño de esta tanda

Recibido a mitad de tarea de otro `sdd-verify` corriendo en paralelo sobre el mismo árbol, verificado
por el coordinador contra `984b7aa` y por mí contra el árbol final antes de tocarlo:

- **Sitio A** (`ticketService.test.ts:176` y `:179`): citaban `:319` (línea vacía/cierre de
  `describe`, nada ahí). El test real («la orden de venta ya usada gana a los obligatorios que
  faltan: 409, no 422») está en `:327`. Corregidas las dos apariciones a `:327`.
- **Sitio B** (`:321-326`): ya citaba bien `:194` y `:171-193` — verificado que sigue así tras mis
  inserciones, que ocurren en el describe de `:361+` y no desplazan nada anterior.

### Delta de spec (`RQ-TC-05` / `RQ-TC-13`)

| Ubicación | Decía | Pasa a decir |
|---|---|---|
| Rango de la función | `ticketService.ts:20-99` | `:20-105` |
| Fila 5 (discrepancia) | `:65-77` | `:65-83` |
| Fila 6 (obligatorios) | `:81-86` | `:87-92` |
| Fila 7 (cliente no existe) | `:87-88` | `:93-94` |
| Viñeta prefijo | `:85` | `:91` |
| Nota «Previously», orden | `:76` | `:82` |
| RQ-TC-13, antes de crear el ticket | `:91` | `:97` |
| RQ-TC-13, «Cliente no encontrado» guarda posterior | `:88` | `:94` |
| RQ-TC-13, posición de la guarda | `:81-86` | `:87-92` |

Nota de cabecera del delta actualizada: ya no dice «provisional», documenta el desplazamiento (+6
desde la antigua `:78`, `:65-77`→`:65-83`) y que el reanclaje está hecho.

## Final Gates — real numbers

| Gate | Resultado |
|---|---|
| `npm test` | **112 ficheros / 1003 pruebas pasadas, 1 fichero + 2 pruebas omitidas, exit 0.** Baseline `b3fc829`: 112/999, 1+2 omitidas → **+4 pruebas exactas**, 0 rotas, 0 borradas, mismas 2 omitidas |
| `npm run typecheck` | Verde, sin salida, exit 0 |
| `npm run lint` | 0 errores, 158 avisos — todos preexistentes en `packages/zoho-sync` (`@typescript-eslint/no-explicit-any`); 0 avisos nuevos en los ficheros tocados (confirmado con grep dirigido) |

## Final message string (as it now reads in code)

```
El equipo {serial} es de {deQuien} y el ticket se está creando para {paraQuien}. Corrige el cliente o el equipo.
```

Donde `deQuien`/`paraQuien` = `lado(nombre, id, nota)`:
`nombre ? \`«${nombre}» (${id})\` : \`${id} (${nota})\``, con nota `'sin nombre en el equipo'` para
el lado del equipo y `'sin ficha en Books'` para el lado solicitado.

Ejemplo real (T1, caso que motiva la tanda):
```
El equipo 18A20070 es de «Gecelca S.A. E.S.P.» (cli-A) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.
```

## Files Changed

| File | Action | What Was Done |
|------|--------|----------------|
| `apps/desk/server/services/ticketService.ts` | Modified | Consulta `getClient`, ayudante `lado`, `deQuien`/`paraQuien`, nueva plantilla del `422` dentro de la rama (ii); re-anclada la cita interna `:56`→`:88` |
| `apps/desk/server/services/ticketService.test.ts` | Modified | T1–T4 nuevas en el describe `la guarda equipo↔cliente`; re-ancladas 6 citas (4 de E1 + 2 del hallazgo externo A) |
| `openspec/changes/mensaje-422-cliente-duplicado/specs/tickets-core/spec.md` | Modified | Re-ancladas 9 citas de `RQ-TC-05`/`RQ-TC-13`; actualizada la nota de procedencia de cabecera |
| `openspec/changes/mensaje-422-cliente-duplicado/tasks.md` | Modified | Las 25 tareas originales + 6.1b marcadas `[x]` salvo 7.4/7.5 (fuera de alcance de este agente) |

## Deviations from Design

Ninguna en el código de producción ni en las pruebas — implementación letra a letra con design §1–§2.

Dos desviaciones de **alcance del re-anclaje**, ambas aditivas y documentadas:
1. Se corrigieron dos citas más (`:176`, `:179` → `:327`) que no estaban en la lista de E1, por
   instrucción explícita del coordinador a mitad de tarea, con hallazgo de otra tanda `sdd-verify` en
   paralelo, verificado contra el árbol antes de aplicarlo.
2. Se actualizó la nota de cabecera del delta de spec (ya no dice «provisional») aunque tasks.md 6.2
   no lo pedía explícitamente por nombre — se hizo por consistencia con la regla de método (no dejar
   una nota que se autocalifica de caduca cuando ya no lo es).

## Issues Found

Ninguno nuevo. Los seis puntos abiertos que design §9 ya declaraba (precedencia 409/422, nombres
vacíos, `contact_name` NULL, deduplicación de `books.contacts`, cita caduca de `RQ-TC-04`, citas
caducas de spec.md §4.1) siguen abiertos, sin tocar, tal y como el diseño instruye.
