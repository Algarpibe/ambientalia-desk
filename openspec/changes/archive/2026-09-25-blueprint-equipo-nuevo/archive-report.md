# Archive Report — `blueprint-equipo-nuevo` (F1B-06, primer cambio, `cierra: no`)

**Cambio cerrado en:** 2026-09-25, HEAD = `982eac2` (6 commits en la rama: `0ca870b` lote 1 shared,
`1b90a80` lote 2 servidor+guardianes+cliente, `6f31ae0` barrido de citas, `246023f`+`230d433` cierre
de tareas del orquestador, `982eac2` verify pass).

**Arquivos fusionados:** Cuatro deltas en `openspec/specs/` (3 MODIFIED, 1 NEW).

## Alcance — qué cubre este cambio de F1B-06

**Primera mitad de F1B-06** (`cierra: no`). Entrega:
- El catálogo de transiciones `TRANSITIONS_EQUIPO_NUEVO`, cinco entradas (RQ-EN-01)
- El estado nuevo `Verificación` registrado aparte del grafo de servicio (RQ-EN-07)
- El registro de flujos `flujos.ts` con enrutado por clasificación (RQ-EN-04)
- La guarda 3 en `executeTransition` que bloquea transiciones de otro flujo (RQ-EN-05, tercera en orden)
- Filtros en panel, avisos y SLA aplicados al flujo del ticket (RQ-EN-06)
- Extensión de guardianes del grafo al catálogo nuevo (invariantes, reentrancia, permisos, ejecucion)

**Fuera de este cambio:**
- `Soporte remoto` (M1.5) → segundo cambio de F1B-06 (`blueprint-soporte-remoto`, `cierra: si`)
- Las DOS salidas de `Verificación` (Liberación, rechazada→Notificado) y guarda de gas patrón → **F1A-03**
- Mapa de tablero generado de los tres flujos → F1B-09

**Contenido de especificaciones:**
- NEW `transitions-equipo-nuevo/spec.md` — 207 líneas, 7 requisitos (RQ-EN-01 a RQ-EN-07)
- MODIFIED `tickets-core/spec.md` — RQ-TC-10 (`:338-356`), dos de tres ramas con grafo
- MODIFIED `transitions-st/spec.md` — RQ-TS-06 (`:181-235`), guarda 3 nueva; RQ-TS-15 (`:427-463`), exclusión de flujo del SLA
- MODIFIED `derivacion-avisos/spec.md` — RQ-AV-04 (`:107-152`), catálogo del flujo

## Condición de despliegue — CRÍTICA PARA PRODUCCIÓN

**Este cambio NO se despliega a producción sin F1A-03.**

Con sólo 5 de las 6 filas del as-is de M1.4, un ticket `Equipo nuevo` que llegue a `Verificación`
queda sin ninguna transición ejecutable en el árbol. El orden de despliegue entre este cambio y F1A-03
decide si se despliega: F1A-03 es la tanda SIGUIENTE a ésta. El CI de este repositorio no despliega,
así que basta con respetar ese orden al desplegar manualmente o por infraestructura.

**Dónde queda escrito:** `tasks.md:56-67` (regla del ciclo 1); `verify-report.md:161-164`
(SUGGESTION-2 de verify).

## Estado final — autoridad de cierre

Todos los hechos de cierre descansan en commits ya en `main`:

| Artefacto | Observación | Commit |
|---|---|---|
| Código aplicado | Lote 1 + Lote 2 (94/94 tareas verdes) | `0ca870b`, `1b90a80` |
| Verificación | Paso con advertencias (0 CRITICAL, 4 WARNING, 2 SUGGESTION) | `982eac2` |
| Barrido de citas | 4 bloqueantes reparados (Caso A: 2 en deltas, Caso B: 1 en histórico) | `6f31ae0` |
| Tareas finales | Orquestador: 5.7, 13.7, 14.8 cerradas | `230d433` |

### Verificación de pruebas

**npm test:** 1442 pruebas en verde, 2 omitidas (por diseño). Nuevas: Lote 1, 32 unitarias (`apply-progress.md:160-161`), con el repositorio en 1422; Lote
2, +20 netas hasta 1442 (`apply-progress.md:341`). La batería de `flujoEquipoNuevo.test.ts`
cubre casos P1-P5 de la propuesta; `permisos.test.ts` matriz 5×3 nueva; `flujos.test.ts` 25 casos con
corrección (a) de `proposal.md`.

**npm run typecheck:** 0 errores. Los dos `.tsx` tocados (`TransitionPanel.tsx`, `TicketDetailView.tsx`)
pasan sin cambio de comportamiento — RQ-EN-06 cumple regla invariable 13 punto 3.

**npm run lint:** 0 warnings nuevos (165 preexistentes, ninguno en ficheros de esta tanda).

**npm run build:** 112 módulos, sin error.

**Detector de citas:** 2346 comprobadas, 0 bloqueantes. 15 abreviadas rotas (informativas, todas
preexistentes al archivado).

### Regla invariable 13 — espejo probado

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Panel filtra transiciones por flujo (`TransitionPanel.tsx:56`) | Guarda 3 `executeTransition` (`ticketService.ts:125`, impuesta y probada en `flujoEquipoNuevo.test.ts` P1-P3) |
| Avisos por área se calculan sobre catálogo del flujo (`ticketService.ts:196`) | `catalogoDelTicket` desde estado de llegada, probado en `avisoArea.test.ts:8/8` |
| SLA excluye equipo-nuevo en `Notificado` (`db/sla.ts:49`) | Consulta filtra por `flujoDelTicket`, probado en `db/sla.test.ts:8/8` |

Ninguna decisión nueva del cliente queda sin línea del servidor probada. M14 (`TransitionPanel.tsx:56`)
queda correctamente declarada no detectable (`.tsx` fuera de vitest.config.ts:17-20, F0-00) y cubierta
por la guarda 3 del servidor.

### Comprobaciones de persona — deudoras para Servicio Técnico

Persona-1/2/3 (`tasks.md:411-421`):
1. Un ticket `Equipo nuevo` en `Ingresado` sólo ve el botón «Ingreso equipo nuevo»
2. Un ticket en `Verificación` cae en columna «Otros» del tablero (sin columna propia)
3. El mensaje de `409` de la guarda 3 se entiende sin explicación

Están en la spec tras fusión. **No son casillas contables, no cierran este cambio.**

## Especificaciones fusionadas

### Requisitos nuevos

- **RQ-EN-01** — Catálogo separado de 5 transiciones + invariante de la unión (Escenario: unión derivados = ESTADOS 22)
- **RQ-EN-02** — Área Servicio Técnico para las 5 (Escenario: Comercial → 403)
- **RQ-EN-03** — Entrada por `habilitar_servicio` compartido (Escenario: `Ticket creado` → `Ingresado`)
- **RQ-EN-04** — Routing: clasificación + estado en catálogo (Escenario: heredado en estado ajeno sigue a servicio)
- **RQ-EN-05** — Guarda 3, posición A<B (Escenario: flujo gana a estado)
- **RQ-EN-06** — Filtro en panel/avisos/SLA (Escenario: tres contextos, tres datos de prueba)
- **RQ-EN-07** — `Verificación` sin_clasificar, 2 campos, Otros (Escenario: columna de tablero)

### Requisitos modificados

- **RQ-TC-10** — De «sólo una rama» a «dos de tres ramas tienen grafo» (`tickets-core/spec.md:338-357`)
- **RQ-TS-06** — Tabla de guardas: 8→9 filas, guarda 3 nueva en escalón B (`transitions-st/spec.md:181-229`)
- **RQ-TS-15** — SLA excluye flujo≠servicio, aunque nombre coincida (`transitions-st/spec.md:440-493`)
- **RQ-AV-04** — Avisos usan catálogo del flujo, no siempre `TRANSITIONS` (`derivacion-avisos/spec.md:107-141`)

## Dependencias entre tandas

**F1A-03 es el desbloqueante de despliegue.** Define las DOS salidas de `Verificación` que F1B-06 deja
abierta. Sin ella, un ticket que llegue a `Verificación` queda varado (riesgo de propuesta, probabilidad
alta). El CI no despliega, así que basta respetar el orden.

**Tandas posteriores que la tocan:**
- F1B-09: mapa de tablero generado de los tres flujos
- F1C-02/03/05/06: permisos finos, tiempos, reentrancia, caso de uso

## Cierre de SDD

- **Estado:** Cambio archivado. Especificaciones fusionadas a `openspec/specs/`. Carpeta movida a
  `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/`.
- **Intento de ledger:** Lote 1 (689 líneas contra techo 800) + Lote 2 (850 contra techo 800, con reset
  del mantenedor: el exceso son 307 líneas de evidencia strict TDD en `apply-progress.md`; código y pruebas, 427). Verify aparte
  (164 líneas).
- **Siguiente:** F1A-03 (despliegue) o F1B-05/F1B-07 (según orden del plan).
