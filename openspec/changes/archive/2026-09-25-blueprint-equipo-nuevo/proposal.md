---
tanda: F1B-06
motivo: ""
capacidad: [transitions-equipo-nuevo, tickets-core, transitions-st, derivacion-avisos]
maestro: ["M1.4"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: blueprint de equipo nuevo y enrutado por clasificación

Primer cambio de F1B-06 (`plan:161`, catálogo `:498`, talla L). El segundo, `blueprint-soporte-remoto`
(`cierra: si`), hace la rama de M1.5. R-4: los dos llevan `F1B-06` y nada más.

## Intención

- Hoy un ticket `Equipo nuevo` cae en el grafo de servicio técnico, que no es el suyo
  (`tickets-core` §4.3, `openspec/specs/tickets-core/spec.md:552-557`; RQ-TC-10, `:350-352`).
- M1.4 declara la rama «aún no implementada» (`R08.2.md:1492`) y trae su as-is: seis filas, cinco
  estados (`R08.2.md:1493-1514`), evidencia de 181 tickets (`:1518`).
- Éxito: cada ticket ve y ejecuta **sólo** las transiciones del grafo de su clasificación, impuesto en
  el servidor (regla 13).

## Alcance

**Dentro**
- Mecanismo de enrutado: clasificación → flujo (`packages/shared/src/ticketCreate.ts:5`), con
  normalización de mayúsculas (Zoho escribe «Equipo Nuevo», `docs/sdd/Decisiones_Gerencia_2026-09-10.md:23`).
- Catálogo de equipo nuevo con la convención de `Transition` (`transitions.ts:55-62`) y la casilla de
  derivación en todas (`:295-298`), **añadido al final de `transitions.ts`**.
- Guarda en `executeTransition` (`apps/desk/server/services/ticketService.ts:122-128`): transición de
  otro flujo → `409`.
- Filtro por flujo en: panel de transiciones (`TransitionPanel.tsx:56`), avisos por área
  (`avisoArea.ts`, vía `areasSiguientes`, `transitions.ts:327`) y SLA de `Notificado`
  (`sla.ts:32-35`, `apps/desk/server/db/sla.ts:40-45`).
- Estado nuevo `Verificación`, registrado aparte del registro de servicio.
- Guardianes del grafo extendidos al catálogo nuevo (invariantes, reentrancia, permisos, ejecución).
- Spec nueva `transitions-equipo-nuevo`; delta de `tickets-core` (§4.3, RQ-TC-10).

**Fuera**
- Soporte remoto (M1.5): segundo cambio.
- Salidas de `Verificación` (Liberación desde `Verificación` y rechazada → `Notificado`) y guarda de
  gas patrón: **F1A-03** (`plan:142`; `openspec/config.yaml:1981`).
- Guarda de `habilitar_servicio` (F1B-03). M1.11/M1.12 (`config.yaml:1741-1744`).
- Columna propia de tablero para `Verificación` (cae en `Otros`, `columns.ts:34,45-46`); mapa generado
  de los tres flujos (F1B-09, `plan:166`).

## Supuestos (reversibles, aplicados por la regla de ejecución)

| # | Supuesto |
|---|---|
| s1 | Réplica del as-is: estados y nombres tal cual. |
| s2 | Área por equivalencia con servicio; ninguna fuente accesible la da (el maestro no la trae, no hay acceso a Zoho). Ver tabla. |
| s3 | Entrada a `Ingresado` por `habilitar_servicio` (`transitions.ts:178`); encaja con el alta de RQ-TC-15, que nace en `Ticket creado`. |
| s4 | **Se declaran 5 de las 6 filas**: `Liberación` sólo desde `En Proceso`. La fila `Verificación —Liberación→ Finalizado` es contenido de F1A-03 (`plan:142`, `config.yaml:1981`); declararla aquí rompería R-1/R-4. `Verificación` queda sin salida hasta F1A-03, como excepción nombrada en el invariante. |
| s5 | Tickets `Equipo nuevo` cuyo estado no existe en su grafo (`Rev./Diagnostico`, `Ticket creado`…) siguen en el de servicio: no quedan varados y no se tocan datos. Caso real de mezcla: #979 (`Decisiones_Gerencia_2026-09-10.md:105-108`). |
| s6 | El SLA de 24 h de `Notificado` es del blueprint de servicio (`sla.ts:7`): no aplica a equipo nuevo. |
| s7 | `Verificación` clasifica `sin_clasificar` (valor válido, `estados.ts:53-54`). Campos: comentario y derivación; ninguna fuente da otros. |

| Transición | Origen → destino | Área | De dónde sale |
|---|---|---|---|
| Ingreso equipo nuevo | Ingresado → En Proceso | Servicio Técnico | `ingreso_a_servicio` (`transitions.ts:190`) |
| Producto no conforme | En Proceso → Notificado | Servicio Técnico | `escalado_a_revision` (`:192`) |
| Análisis y acciones | Notificado → Ingresado | Servicio Técnico | `devolucion_a_correccion` (`:194`) |
| Verificación | En Proceso → Verificación | Servicio Técnico | sin equivalente |
| Liberación | En Proceso → Finalizado | Servicio Técnico | `finalizacion_servicio` (`:222`), mismo origen; *hipótesis* alternativa: Comercial, por `liberacion_sin_factura` (`:246`) |

*Hipótesis:* el «5 transiciones» de Zoho (`Inventario_ZohoDesk_Configuracion.md:43`) cuenta `Liberación` una vez con dos orígenes.

## Capacidades

- **Nueva** `transitions-equipo-nuevo`: ya está en `capabilities` (`config.yaml:113-121`), sin spec. R-2 se cumple creando la spec.
- **Modificada** `tickets-core`: §4.3 pasa a comportamiento construido; RQ-TC-10 deja de decir «los tres caen en el mismo grafo».

## Enfoque

Catálogo **separado** (`TRANSITIONS` sigue siendo el de servicio) más un registro de flujos, en vez
de fundirlo en `TRANSITIONS`: los estados comparten nombre (`Ingresado`, `En Proceso`, `Notificado`,
`Finalizado`) y toda función por estado (`transitionsForStatus`, `areasSiguientes`,
`destinatarioDelEscalado`) mezclaría los grafos. Coste: los guardianes que esperaban «ponerse rojos»
cuando F1B-06 entrara en `TRANSITIONS` no lo ven solos; se extienden al registro.

## Coste de citas (regla de mutación 4)

- `transitions.ts:NNN`: 267 citas en 73 ficheros; `estados.ts` (líneas 80-199): 141. Solo se añade al **final** → **0 desplazadas**.
- «34 transiciones» / «21 estados»: siguen ciertas (caso A: `TRANSITIONS` sigue siendo servicio).
- **17 líneas en 9 ficheros** predicen que F1B-06 entra en `TRANSITIONS` (p. ej. `transicionesEjecucion.test.ts:135`, `sla.ts:83`, `invariantesGrafo.test.ts:11-12`). Caso A: se reescriben en su sitio, sin cambiar el número de líneas, o se vuelven ciertas extendiendo el guardián.

## Tamaño y lotes (≤800)

| Lote | Contenido | Estimación |
|---|---|---|
| 1 · shared | catálogo, enrutado, `Verificación`, filtro SLA, guardianes, pruebas unitarias, apply-progress | ~500 |
| 2 · servidor + cliente | guarda `409`, avisos, consulta SLA, panel; barridos de ejecución/permisos, caso heredado (s5) | ~470 |

Aparte: verify-report ~350; archive ≈ 2× carpeta + fusión (se mide, no se estima).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| s4 deja `Verificación` sin salida en el árbol | Alta | **Este cambio NO se despliega a producción sin F1A-03** (las dos salidas de `Verificación`): un ticket de equipo nuevo que llegue a `Verificación` se quedaría sin salida. El CI no despliega, así que basta con respetar el orden al desplegar. El plan se contradice en el orden —`plan:142` pone F1A-03 antes de F1B-06; `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:60` dice que F1A-03 depende de F1B-06 porque el estado no existe—; decisión del orquestador (2026-09-25): F1B-06 crea el estado y F1A-03 le da las salidas, y F1A-03 es la tanda siguiente |
| Área equivocada (s2) → permisos mal | Media | Tabla explícita; se corrige en un dato |
| Literal de clasificación de Zoho distinto | Media | Normalización + prueba con «Equipo Nuevo» |
| s5 cambia en vuelo el grafo de un ticket ya en `En Proceso` | Baja | Recuento de solo lectura para Gerencia |

## Reversión

Revertir los commits: el catálogo es aditivo, sin migración ni datos; sin el enrutado todo vuelve a servicio.

## Criterios de éxito

- [ ] Ticket `Equipo nuevo` en `Ingresado` ve y ejecuta sólo «Ingreso equipo nuevo»; `ingreso_a_servicio` → `409`.
- [ ] Un ticket de servicio no ve ninguna transición de equipo nuevo.
- [ ] `Notificado` de equipo nuevo no aparece en `ticketsConSlaVencido`.
- [ ] Guardianes extendidos: cada una de las cinco tiene caso de ejecución y de permisos.
- [ ] Barrido de citas al cierre: 0 rotas nuevas.

## Proposal question round (modo `auto`: no se pregunta; queda para revisión)

1. ¿Adelantar F1A-03 a este cambio para no dejar `Verificación` sin salida? (cambiaría el alcance de dos filas → decisión de Gerencia).
2. ¿`Liberación` es de Servicio Técnico o de Comercial?
3. ¿Los tickets heredados deben quedarse en servicio (s5) o pasar a su grafo?
