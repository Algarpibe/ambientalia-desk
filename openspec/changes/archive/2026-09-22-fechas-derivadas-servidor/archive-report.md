# Archive Report — `fechas-derivadas-servidor` (F1A-07 · IV-2)

**Tanda:** F1A-07  
**Cambio:** `fechas-derivadas-servidor` (IV-2 — Fechas derivadas: recalcular en servidor)  
**Worktree:** `f1a-07-r1`  
**Fecha de archivo:** 2026-09-22  
**Commit final:** `9febbbf` (verify-report re-verificado, PASS WITH WARNINGS)

---

## Artefactos archivados (Engram)

| Artefacto | ID | Fecha de creación | Estado |
|---|---|---|---|
| `sdd/fechas-derivadas-servidor/proposal` | #837 | 2026-09-21 17:51:58 | Active, 246 líneas |
| `sdd/fechas-derivadas-servidor/spec` | #841 | 2026-09-21 18:10:57 | Active, revisiones: 2 |
| `sdd/fechas-derivadas-servidor/design` | #843 | 2026-09-21 18:17:01 | Active, 298 líneas |
| `sdd/fechas-derivadas-servidor/tasks` | #848 | 2026-09-21 19:14:27 | Active, 293 líneas (51/51 tasks marked complete) |
| `sdd/fechas-derivadas-servidor/verify-report` | #859 | 2026-09-22 08:50:31 | Active, PASS WITH WARNINGS (0 CRITICAL, 1 WARNING, 2 SUGGESTION) |

---

## Deltas de especificación — Fusión completada

Dos dominios tocados. Deltas completamente fundidos en las specs principales:

### `transitions-st` (openspec/specs/transitions-st/spec.md)

| Sección | Cambio | Líneas afectadas | Descripción |
|---|---|---|---|
| RQ-TS-06 | MODIFIED | Tabla de guardas (8 filas, antes 7) | Nueva fila 6: «fecha derivada sin fuente inválida» como escalón C, entre obligatorios (5) y derivación (7). Tabla reanclada contra `4976787`. |
| RQ-TS-08 | MODIFIED | Definición y escenarios | `buildTransitionPlan` deja de ser única validación de campos. Añadida segunda validación de contenido para las tres fechas derivadas en `executeTransition:132`, con nuevo escenario. |
| 3.8 | MODIFIED | Orden total, cuatro sub-secciones | Reancla citaciones a `ticketService.ts` (`:121`, `:123`, `:124-126`, `:127-129`, `:132`, `:136-140`, `:146-150`). Tabla de puertas: secuencia en `executeTransition` pasa de `A A B B C C D` a `A A B B C C C D` (nueva C de fecha derivada). Nuevo escenario final: garantía estructural para 3.8 (sin test de ejecución, única transición que declara `cfOrdenVenta` no declara fechas derivadas y viceversa). |

### `trazas` (openspec/specs/trazas/spec.md)

| Sección | Cambio | Líneas afectadas | Descripción |
|---|---|---|---|
| RQ-TZ-03 | MODIFIED | Definición expandida, nuevos escenarios | `values` guarda valor EFECTIVO para las tres fechas derivadas (no lo que mandó navegador si difiere). Excluye fechas derivadas cuando transición no las declara. Nuevos dos escenarios. |
| RQ-TZ-11 | MODIFIED | Título, definición, nuevo escenario | Título: «se proponen» → «se imponen» (servidor decide, no sugiere). Añadida aclaración: servidor consume instante para IMPONER con `executeTransition:132` descartando navegador. Nuevo escenario. |
| RQ-TZ-12 | ADDED | Nuevo requisito, 8 escenarios | El servidor impone las tres fechas derivadas (`ingreso_a_servicio`, `reporte_por_garantia`, `escalado_a_comercial`). Tabla de fuentes. Recalcular siempre ignora columna. Sin fuente: acepta tecleado válido o `422`. Dos huecos con dueño (F1B-03 y sin destino). |
| RQ-TZ-13 | ADDED | Nuevo requisito, 4 escenarios | Día en zona de negocio fijada (`America/Bogota`), no zona del proceso. Trampa: `new Date('2026-09-09')` es día 8 en Bogotá. `dia()` de bodegaje consume esta noción. |

---

## Verificación — Estado final

**Verdict final:** `PASS WITH WARNINGS` (commit `9febbbf`)

| Métrica | Valor | Notas |
|---|---|---|
| Requisitos | 7/7 (transitions-st 3 MODIFIED, trazas 2 MODIFIED + 2 ADDED) | Todos validados contra spec |
| Escenarios | 21/21 (8 transitions-st, 14 trazas, 1 garantía estructural sin test de ejecución) | 20/21 COMPLIANT con test runtime; 1/21 COMPLIANT-STRUCTURAL |
| Blockers | 0 | Ninguno |
| CRITICAL findings | 0 | Ninguno |
| Warnings | 1 | RQ-TZ-12 escenario 3.8: garantía estructural (sin GIVEN alcanzable hoy) — reapertura condicional si futura transición declara a la vez fecha derivada + `cfOrdenVenta` |
| Suggestions | 2 (heredadas, no remedidas) | Cobertura global de RPC, margen de `hook.bordes.test.ts` |
| Código verificado | Línea base: `4976787`; producción: `ad927dc` (sin diff desde verify anterior) | npm test: 1223/1223, npm run build: pass, typecheck: pass, lint: pass, detector de citas: pass |

---

## Criterios de cierre — Regla F0-05

**Cabecera SDD obligatoria (Rule R-1):**

```yaml
tanda: F1A-07
motivo: ""
capacidad: [trazas, transitions-st]
maestro: ["M1.10"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
```

**Línea de cierre (R-1.3):**

Esta tanda cierra **la derivación de las tres fechas en el servidor** (IV-2). El servidor ahora impone
`Fecha creación ticket`, `Fecha Remisión Entrada` y `Fecha Revisión Informe` cuando existen fuentes
(´created_time`, remisión vigente más reciente, instante de `escalado_a_revision`), en columna e historial.
El cliente consume la fórmula compartida como comodidad bajo la regla 13 (imposición probada en servidor).

**Deja abierto por designio de Gerencia, sin destino nuevo:** El hueco de `Fecha Remisión Entrada` tecleada
sin remisión de entrada en Desk (F1B-03, §4 de proposal.md). El hueco de `Fecha Revisión Informe` sin fila
en Zoho (sin destino; propuesta es F1B-03 para ambos o pregunta de Gerencia). Ambos son huecos residuales
declarados en el requisito RQ-TZ-12.

**Deja abierto por garantía estructural:** El escenario 3.8 del verify (precedencia de fecha derivada C
antes de OV D) es garantía estructural documentada, no escenario con test de ejecución — ninguna de las
34 transiciones reales declara a la vez una fecha derivada y `cfOrdenVenta`. Reapertura **condicionada**:
si en el futuro una transición real llega a declararlos juntos, el requisito vuelve a exigir test de
integración exacto (nota escrita en el propio delta).

**Otros incumplimientos vivos (abiertos, no tocados):**
- **IV-12** sigue vivo: el alta de remisión no cumple el orden total de precedencia (C antes que A en dos puntos).
  Sin corrección en esta tanda. Propósito: `remision.ts` no se toca sin decisión de Gerencia (precedente F1B-01).

**Maestro (M1.10):** Entrada 16 registrada en `docs/sdd/F0-01_Correcciones_para_el_maestro.md` para
documentar la vía sin fuente (D-3): el servidor acepta lo tecleado si es fecha real cuando no hay fuente,
en vez de ignorar sin más. El `.docx` sigue siendo original editable; la R08.3 cita esta entrada cuando
se reexporte.

---

## Cambios en la capacidad

Ambas capacidades `transitions-st` y `trazas` ya figuraban en `openspec/config.yaml:capabilities`.
No fue necesario añadirlas (Rule R-2 de F0-05).

---

## Resumen mecánico del archive

| Operación | Resultado |
|---|---|
| Deltas de spec (transitions-st, trazas) | Fundidos de forma dirigida en specs principales |
| Carpeta de cambio | Movida a `openspec/changes/archive/2026-09-22-fechas-derivadas-servidor/` con `git mv` |
| Artefactos verificados | Todos presentes: proposal.md, design.md, exploration.md, tasks.md, verify-report.md, specs/{domain}/spec.md |
| Tareas (tasks.md) | 51/51 completadas |
| Estado de verificación | PASS WITH WARNINGS (terminal: NO CRITICAL) |

---

## Notas de transporte

- **Zona horaria:** La fórmula `diaEnZona()` en `packages/shared/src/fechasDerivadas.ts` usa
  `Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', ... })`. Hipótesis verificada
  localmente: `node:22-alpine` traerá ICU completo. Comprobación en contenedor real pendiente
  (persona con acceso EasyPanel).

- **Bodegaje en producción:** P-3 cambia cómo se interpreta un instante en ventana 00:00–04:59 UTC.
  Hipótesis: nadie escribe instantes sin desplazamiento en `ticket_transitions.values`. Comprobación
  sobre `ticket_transitions.values` en base de producción pendiente (persona con acceso DB).

- **Regla de mutación 4 — Verificación de citas al archivar:** Las citas de `ticketService.ts:130` y
  `:132` en los deltas fusionados describen el contenido NUEVO (después de editar en sitio durante
  apply). Verificadas línea a línea al momento del archive contra el árbol de `9febbbf`.

- **Sub-orden dentro de escalón C en 3.8:** Presencia de obligatorios (`:132`) antes que validez de
  fecha derivada (`:132`, fijada por el diseño) antes que derivación (`:136-140`). Probado por
  mutación de posición en `valoresDeTransicion.test.ts:176-197` (casos P-a/P-b).

---

## Línea temporal

| Fecha | Hito |
|---|---|
| 2026-09-21 | Propuesta aprobada (obs. #835–#840) |
| 2026-09-21 | Specificaciones delta (obs. #841) |
| 2026-09-21 | Diseño (obs. #843) |
| 2026-09-21 | Tareas (obs. #848) |
| 2026-09-21 | Apply Unit A (shared + servidor; 540–710 líneas) |
| 2026-09-21 | Apply Unit B (cliente + cierre; 250–385 líneas) — **Fallido inicialmente (CRITICAL en RQ-TZ-12)** |
| 2026-09-22 | Re-verificación Unit A+B completa (obs. #859, PASS WITH WARNINGS) — 2 CRITICAL resueltos, 1 WARNING (garantía estructural), 2 SUGGESTION (heredadas) |
| 2026-09-22 | Archive (este documento) |

---

## Observaciones de Engram referenciadas

Para traceabilidad completa, todas las observaciones SDD que fundamentan este archive:

- #835: Ronda de preguntas cerrada (D-1, D-2, D-3 de proposal)
- #837: Proposal
- #840: Exploración (consumidores, vías, decisiones)
- #841: Spec deltas
- #843: Diseño
- #846: Tasks (review workload forecast)
- #848: Tareas SDD completas
- #859: Verify-report final (PASS WITH WARNINGS, 0 CRITICAL)

---

**Cierre archivado por: Claude Haiku 4.5, 2026-09-22**  
**Autorización: Ledger token `sha256:a4562ba88031ae6d3dc19d6befba1b1309a8528060a7d3167478d256e8df6669` (acquire confirmed)**
