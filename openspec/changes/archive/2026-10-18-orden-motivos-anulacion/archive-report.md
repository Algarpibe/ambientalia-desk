# Informe de archivo — `orden-motivos-anulacion` (F1C-01, `cierra: no`)

**Cubre de F1C-01:** el orden de presentación de los motivos de anulación que pide `decision/f1c01-motivos-esperas`
(«sólo como comodidad de pantalla»). **Deja fuera:** nada de la fila; F1C-01 ya la cerró el archivo de
`anulado-con-motivo`, y este cambio no la reabre (SA-1).

## Qué se archiva

- `motivosAnulacionOrdenados(estado)` al final de `packages/shared/src/anulacion.ts` (`:61-72`). En `En Espera de
  Repuestos` y `Servicio externo` devuelve «Repuesto no disponible», «Sin solución técnica», y los otros tres en su orden
  base, con «Otro» el último; en el resto de estados, una copia de `MOTIVOS_ANULACION` (`:22-28`).
- `apps/desk/src/components/TransitionPanel.tsx` la consume en `:163` para el campo `CLAVE_MOTIVO_ANULACION`, con el
  import en `:8`. El fichero sigue con 267 líneas.
- Pruebas: un `describe` nuevo al final de `packages/shared/src/anulacion.test.ts` (`:188-219`).
- El servidor no cambia: `git diff 8f629b5 -- apps/desk/server` está vacío.

## Intentos del registro

| Intento | Commit | Medida (`--no-renames` + sin trackear) | Registro | Códigos |
|---|---|---|---|---|
| 1 · planificación | `569054c` | 271 + 0 | 271 | 0 · 0 · 0 · 0 |
| 2 · apply | `2e62591` | 99 + 0 | 99 | 0 · 0 · 0 · 0 |
| 3 · verify | `67c261e` | 61 + 0 | 61 | 0 · 0 · 0 · 0 |
| 4 · archive | este commit | ver abajo | — | — |

Códigos: `npm test`, `npm run typecheck`, `npm run lint` y el detector de citas, en ese orden.

## TDD y mutaciones

Rojo: 23 de 61 caen con «motivosAnulacionOrdenados is not a function». Verde: 61 de 61. Las mutaciones del apply
(`apply-progress.md`) ponen la suite en rojo todas. El orquestador reprodujo M1 (no reordenar en las esperas: 2 rojas) y
M4 («Otro» primero fuera de las esperas: 10 rojas); el verify, una variante de M3b (2 rojas).

## Fusión del delta

`RQ-TS-41` se añadió por script al final de `openspec/specs/transitions-st/spec.md`: 2.681 → 2.728 líneas, un único
hunk `@@ -2681,0 +2682,47 @@`. El bloque vivo es idéntico al del delta (`diff`) y conserva sus cinco escenarios. Ningún
requisito MODIFIED.

## Regla invariable 13

| Decisión del cliente | Línea del servidor |
|---|---|
| El orden del desplegable del motivo | ninguna: presentación (consecuencia 2 de `decision/f1c01-motivos-esperas`) |
| En qué estados se reordena | ninguna: no hay restricción por origen (consecuencia 1) |
| Ofrecer sólo los cinco motivos | `packages/shared/src/anulacion.ts:50` vía `apps/desk/server/services/ticketService.ts:134`; probado en `apps/desk/server/anulacion.test.ts:80-86` |

## Regla de mutación 4

`anulacion.ts` (59 → 72), `anulacion.test.ts` de `shared` (186 → 219) y la spec viva sólo crecen al final;
`TransitionPanel.tsx` conserva su número de líneas. Ninguna cita del repositorio apunta más allá del final viejo de la
spec (barrido de `transitions-st/spec.md:NNNN`). Las de `anulacion(.test).ts` que da el `grep` fuera de este cambio
están en el `verify-report.md` archivado de `anulado-con-motivo` y apuntan al fichero de pruebas del servidor.

## Supuestos reversibles (lista semanal)

SA-1 a SA-4, con su forma de revertirse en `proposal.md` §6.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Revisar SA-1 a SA-4 en la lista semanal | Gerencia |
| P-2 | Comprobar tras el despliegue que en las dos esperas el desplegable abre con «Repuesto no disponible» | quien despliegue |

El cambio altera el bundle del cliente: `index-BKKKYfFl.js` en `8f629b5`, `index-JtLEpPmB.js` en `2e62591`.
