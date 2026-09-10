# Informe de archivo — `mensaje-422-cliente-duplicado`

## Metadatos del archivo

| Campo | Valor |
|---|---|
| Cambio | `mensaje-422-cliente-duplicado` |
| Fecha de archivo | 2026-09-10 |
| Fase | sdd-archive |
| Veredicto | **PASS** · 0 CRITICAL · 0 WARNING · 3 SUGGESTION (informativas) |
| Estado | **Archivado y cerrado** |
| Ruta de archivo | `openspec/changes/archive/2026-09-10-mensaje-422-cliente-duplicado/` |

## Identificadores de observación (trazabilidad)

Las cinco observaciones de Engram que sustentan este cambio:

1. **#382** (`sdd/mensaje-422-cliente-duplicado/proposal`) — Propuesta: El 422 de la guarda equipo↔cliente lleva UN nombre y NINGÚN id; adopción del enfoque 1 (una consulta `getClient` extra en rama ii) y mensaje con nombre e id de dos clientes
2. **#385** (`sdd/mensaje-422-cliente-duplicado/spec`) — Delta de spec para `tickets-core` con correcciones a RQ-TC-05 (orden de guardas, citas, formato de evidencia) y ampliación de RQ-TC-13 (mensaje con id de ambos lados, notas, escenarios)
3. **#386** (`sdd/mensaje-422-cliente-duplicado/design`) — Diseño: consulta `getClient` dentro de rama (ii), plantilla de mensaje, ayudante local `lado(nombre, id, nota)`, tabla de mutaciones con 6 ejercitadas de verdad
4. **#389** (`sdd/mensaje-422-cliente-duplicado/tasks`) — Plan de 25 tareas (Fases 1-7): RED → GREEN → REFACTOR → Mutaciones → Regresión → Re-anclaje de citas → Compuertas. Fase 8 (V1) es un handoff a persona, no contado
5. **#424** (`sdd/mensaje-422-cliente-duplicado/verify-report`) — Verificación PASS: 2/2 requisitos y 8/8 escenarios COMPLIANT; 1003 pruebas (fueron 999, +4 exactas T1-T4); 0 avisos nuevos en lint; typecheck 0 errores

## Hechos finales de estado (autoridad)

**Implementación verificada y enviada.**

- **Commit de implementación:** `c4fc97d` (ya en `origin/main`)
- **Base de diseño anterior al cambio:** `984b7aa`
- **HEAD actual:** `4e0b542` (3 commits posteriores para decisión OV↔ticket cardinidad)
- **Timestamp de commit:** 2026-09-09
- **Cambios de código:** 65 insertions, 8 deletions en `apps/desk/server/services/ticketService.ts` y `.test.ts`

**Tiempo de veredicto:** El cambio fue verificado el 2026-09-10 tras un reset manual del ledger por `Alfonso`.

### Incidente del ledger de runtime (registrado, no bloqueante)

La primera ronda de `sdd-verify` devolvió un falso positivo: `blocked(maintainer_decision)` con `changed_lines: 1718` contra presupuesto de 800 líneas. **La causa:** una segundo tanda (`reasignar-desvios-huerfanos`) se archivaba simultáneamente en el mismo árbol de trabajo, inflando el contador. Reset manual el 2026-09-10 02:00 UTC por `Alfonso`, `--request-id reset-422-2026-09-10-02`. La cifra de reasignamiento (`lifetime_changed_lines: 1718`) se preservó como historia; `cumulative_changed_lines` se puso a 0. La **segunda ronda de verify cerró con `cumulative_changed_lines: 0`**, que es el número que zanja la cuestión.

*Lección método:* un `changed_lines` inflado no indica un cambio defectuoso, sino una coexistencia de tandas. El reset no toca el código del cambio, sólo el estado del ledger.

## Merge de specs verificado (autoridad)

**Overlap check: SEGURO**

El delta (`openspec/changes/mensaje-422-cliente-duplicado/specs/tickets-core/spec.md`) modifica **sólo** RQ-TC-05 y RQ-TC-13:
- RQ-TC-05: actualización de citas de línea (`:20-71` → `:20-105`), reorden de guardas 4 y 5 (ahora `: 45-49` y `:65-83`), adición de "(Previously...)" explicativa
- RQ-TC-13: ampliación de requisito 2 con formato completo de mensaje, notas de respaldo, y nueva nota "sin ficha en Books"

Los tres commits posteriores (`ce0856c`, `3c01dbb`, `4e0b542`) tocaron §4.1 (precedencia 409/422) y §4.2 (cardinalidad OV), **no tocaron RQ-TC-05 ni RQ-TC-13**. Confirmado con:
```bash
git diff 984b7aa..4e0b542 -- openspec/specs/tickets-core/spec.md | grep -E "RQ-TC-05|RQ-TC-13" | wc -l
# 0
```

La **especificación viviente fue actualizada en el archivo sin revertir ninguna sección posterior**.

## Citación verificada (30 líneas)

Las 30 citas de la delta y del cambio se han verificado contra el árbol final (HEAD `4e0b542`):
- `openspec/changes/mensaje-422-cliente-duplicado/specs/tickets-core/spec.md` (delta): 25 citas (funciones, filas de tabla, 4 viñetas, RQ-TC-13 puntos 1-3, consecuencia declarada)
- `ticketService.test.ts`: 2 citas (línea 327, rango 171-193) — hallazgo externo aditivo del verify
- `ticketService.test.ts`: 2 citas (línea 194 y rango 171-193) — sitio B, sin cambios
- `R08.1.md:2071-2079` (maestro, punto abierto nº 52): 1 cita

**Resultado:** 0 caducas. Todas correctas contra el código en HEAD. El re-anclaje de Fase 6 (apply-progress, tasks.md líneas 112-137) se sostiene contra la realidad de `ticketService.ts`, no contra lo reportado.

## Hallazgo externo: M-P2 VERDE, registrado

Durante la Fase 4 (tabla de mutaciones), la mutación M-P2 (subir rama (ii) sobre el `409` de la OV en `:45-49`) devolvió **VERDE**, cuando la predicción esperaba que requeriría corregir la precedencia 409/422 de `tickets-core` §4.1 (punto abierto).

**Causa:** Las dos pruebas de precedencia del tramo 409 (`ticketService.test.ts:327-334` y `:336-341`) usan `equipo()` (`:233-235`), que NUNCA fija `client_id`, así que la rama (ii) es estructuralmente incapaz de dispararse en esas pruebas. El verde es consistente con la posición de las pruebas, no con la decisión del punto abierto §4.1.

**Registro:** No es un defecto del cambio; es un hallazgo de cobertura del espacio de pruebas. Declarado en design.md §5 y registrado sin bloqueo en verify-report.

## Tarea 7.4: Handoff a persona, fuera del recuento

La Fase 8 del plan contiene **una** tarea de handoff (`7.4 · Verificación en la app`), clasificada como trabajo de persona bajo el ciclo SDD (CLAUDE.md, Contexto SDD, Regla del ciclo 1). No es contada en las 25 tareas porque:

1. Su dueño es explícito: la persona que despliegue
2. Tiene destino explícito: la sala de producción (`ambientalia-desk.ambientalia.cloud`)
3. Su bloqueo (20 commits undeployed desde `e8c5e90`) es externo al cambio

**Estado de bloqueo registrado:**
- **CI no despliega:** El flujo actual verifica (npm test, typecheck, lint) pero no despliega. La acción requiere ejecución manual
- **Aviso pendiente a Comercial:** La transición `habilitado_para_entrega` ahora exige «Fecha de aviso al cliente» (packages/shared/src/transitions.ts:259-260), porque `cfDate` es `required = true` en `:75`. Publicar sin aviso deja Comercial sin poder ejecutar esa transición

Estos dos hechos son **precondiciones documentadas** de la verificación en vivo, no defectos del cambio.

## Decisiones explícitas (ámbito)

Este cambio **no** incluye:
- Filtrado de `getClient` por `contact_type`; desduplicación de `books.contacts` (fuera de alcance)
- Precedencia 409/422 del alta; es un punto abierto de `tickets-core` §4.1 sin decisión
- Pruebas `.tsx` (decisión de Gerencia F0-00, 2026-09-08)
- Cambio de comportamiento del ~3,4 % de equipos sin `client_id` enlazado

## Cierre

**Status:** ARCHIVADO

El cambio `mensaje-422-cliente-duplicado` se cierra con veredicto PASS de la fase de verificación. El código fue implementado en commit `c4fc97d`, verificado el 2026-09-10 tras reset del ledger de runtime, y la especificación fue fusionada en la rama principal del 2026-09-10. La única dependencia no resuelta es la verificación manual en producción, que es un handoff a persona y no bloquea el archivo del cambio.

Cinco observaciones de Engram (#382, #385, #386, #389, #424) trazan la completa historia del cambio desde propuesta hasta verificación.

---

**Archivado por:** Claude Haiku 4.5 · Modelo de sesión `claude-haiku-4-5-20251001`  
**Sesión:** https://claude.ai/code/session_01SqgZHWKpEcCZ11z5ztn8oa  
**Timestamp:** 2026-09-10 13:36 UTC
