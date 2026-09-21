# Archive Report — `orden-precedencia-guardas` (F1B-10)

**Fecha de archivo**: 2026-09-21 · **Árbol de trabajo**: f1b-10-r1 · **HEAD**: 7bf0626

## Resumen Ejecutivo

Tanda F1B-10 cerrada y archivada. Implementó el orden total de precedencia de guardas declarado en el plan (`plan:425`) en las **dos puertas del motor** (alta de ticket e intentos de transición), aplicó pruebas de posición que fijan la cadena A < B < C < D, registró el desvío vivo IV-12 (el alta de remisión no cumple ese orden, decisión de Gerencia de no tocar esa puerta). **Cierra el alcance declarado en proposal.md** sin tocar remisiones. Verify R2 **PASS con 0 blockers / 0 critical / 0 warnings / 0 suggestions**.

## Estado Final

### Verificación

- **Verify R2**: PASS
- **Evidence revision**: sha256:915ac0f340db6daacbca871eaa3d1d8551458a7e08c66f423b7504aa08035be0
- **Requisitos**: 6/6 (3 en transitions-st, 3 en tickets-core)
- **Escenarios**: 18/18 (5 en transitions-st, 13 en tickets-core)
- **Pruebas**: 1183 pasadas (sube de 1182 por N5 en remisiones.test.ts, IV-12, commit f337a96)
- **Build**: typecheck exit 0, sin salida
- **Lint**: exit 0, 158 warnings preexistentes (ninguno en código de esta tanda)

### Tareas

- **Total**: 44 (37 de R1/R2 + 7 de Fase 11)
- **Completas**: 44/44 — 0 sin marcar
- **Bloqueantes**: 0

### Hallazgos de R1 (todos cerrados en R2)

| Hallazgo | Cierre | Evidencia |
|---|---|---|
| CRITICAL — IV-12 sin prueba | Cerrado | N5 en `remisiones.test.ts` (f337a96), prueba de posición de las dos guardas (fecha + serial) |
| WARNING-1 — tabla TDD incompleta | Cerrado | `apply-progress.md:22-37`, tabla restituida con fila 11 |
| WARNING-2 — cita de commit R2 rota | Cerrado | `apply-progress.md:6` corregida a 7daedf4 (ancestro verificado) |
| WARNING-3 — deriva de línea en tasks.md | Cerrado | 9 pruebas verificadas línea a línea contra `ticketService.test.ts` |
| WARNING-4 — Engram vs disco | Cerrado | Ambas copias miden hoy 519/705 |

## Fusión de Especificaciones

### Tickets-Core (`openspec/specs/tickets-core/spec.md`)

| Elemento | Acción | Línea nueva | Detalles |
|---|---|---|---|
| RQ-TC-05 | MODIFIED | 111 | Orden de las guardas del alta, en bloque compacto |
| 4.1 · Precedencia 409/422 | RENAMED+MODIFIED | 380 | Antiguo título preservado como Caso B; anchored a ad65161 |
| RQ-TC-13 | MODIFIED | 274 | Guarda equipo↔cliente impone interpretación única de identidad |

**Delta cost**: +62 líneas (prev. 49), -22 líneas (prev. 50)

### Transitions-ST (`openspec/specs/transitions-st/spec.md`)

| Elemento | Acción | Línea nueva | Detalles |
|---|---|---|---|
| RQ-TS-06 | MODIFIED | 148 | Orden de las 7 guardas (GWT embebido) |
| 3.4 · OV en executeTransition | MODIFIED | 566 | Las dos primeras puertas de la OV evalúan en el mismo orden |
| 3.8 · Precedencia: dos inversiones | RENAMED+MODIFIED | 703 | Patrón de dos violaciones; `:120-122` antes del `422` en executeTransition + C antes de A en alta de remisión (IV-12) |

**Delta cost**: +189 líneas (prev. 57), -133 líneas (prev. 29)

**Total merge cost**: 251 insertions + 155 deletions (medido con `--no-renames`)

### Verificación de conteo (post-fusión)

- `^### 4\.1 · ` en tickets-core: **1**, título cierre correcto
- `^### 3\.8 · ` en transitions-st: **1**, título cierre correcto
- `^### RQ-TC-05 · ` en tickets-core: **1**
- `^### RQ-TC-13 · ` en tickets-core: **1**
- `^### RQ-TS-06 · ` en transitions-st: **1**
- `^### 3\.4 · ` en transitions-st: **1**
- `^### Requirement:` en ambas: **0** (bloques MODIFIED reemplazados)

Nota histórica: el texto «Dos inversiones de precedencia entre guardas» sobrevive una vez en transitions-st:3.8 como nota (Previously: …), que es el patrón correcto.

## Reparación de Citas

### Caso B — Revisión Histórica

**Archivo afectado**: `openspec/config.yaml:1348`

**Cambio realizado**: Anclada a revisión `7bf0626`

Línea original (MEDIDO EL 2026-09-20):
```
`openspec/changes/orden-precedencia-guardas/design.md` y su texto condiciona el veto
```

Línea reparada (Caso B, retiene ruta original + ancla de revisión):
```
`openspec/changes/orden-precedencia-guardas/design.md` en `7bf0626` y su texto condiciona el veto
```

**Justificación**: La frase afirma algo cierto de su fecha (2026-09-20, el veto era vigente entonces). No se reapunta al archivo, se nombra la revisión en la misma línea física. (Regla de mutación 4 del CLAUDE.md, Caso B.)

### Otras citas verificadas

- `tickets-core/spec.md:372` y `transitions-st/spec.md:692`: Se retiran con los bloques MODIFIED (rerouted al archivo)
- `CLAUDE.md:262 → transitions-st/spec.md:30`: No se mueve (primera línea editada cae en línea 152, diferencia de offset)
- `plan R01.1:367 → transitions-st/spec.md:78-79`: No se mueve por mismo motivo
- **33 citas dentro de la carpeta**: Silenciadas al mover a archivo (detector excluye `archive/`)

## Alcance y Cierre

### Lo que cubre esta tanda

**Requisitos del plan (`plan:425`)**: «Orden único de precedencia entre guardas»

1. ✅ Declaración en spec del orden total A < B < C < D sobre cuatro escalones
2. ✅ Aplicación a **dos puertas** (alta de ticket + executeTransition)
3. ✅ Pruebas de posición que fijan la cadena observable
4. ✅ Registro del desvío observado (IV-12, alta de remisión)

### Lo que NO cubre (por decisión de Gerencia)

**Puerta del alta de remisión** (`routes/remision.ts`):
- El orden se declara como **total en las tres puertas** (spec 3.8)
- **La tercera puerta NO se toca** — decisión de Gerencia (obs. #707, 2026-09-17)
- La divergencia (fecha C antes de serial A) se registra como **IV-12 SIN DESTINO**

**Por qué `cierra: si` es correcto**:

El `cierra` se sostiene por **decisión documentada de Gerencia** que aparece en ficheros que la sesión carga:
- `openspec/config.yaml:1100-1113` (IV-12, entrada Anexo D)
- `CLAUDE.md` (fila IV-12 de incumplimientos vivos)

La palabra «cierra» afirma que la **fila del plan está terminada**, no que el defecto esté corregido. El defecto es IV-12 vivo, pero el plan (`plan:425`) pedía **un orden declarado**, y eso está hecho. El servidor lo impone en dos puertas. La tercera queda fuera por decisión operativa de alcance, registrada con dueño.

**IV-12 sigue VIVO. Archive NO lo cierra, NO le asigna épica.** No se edita `CLAUDE.md` ni `openspec/config.yaml` (IV-12).

## Artefactos Archivados

```
openspec/changes/archive/2026-09-21-orden-precedencia-guardas/
├── proposal.md (36.168 bytes)
├── specs/
│   ├── tickets-core/spec.md (delta)
│   └── transitions-st/spec.md (delta)
├── design.md (34.657 bytes)
├── tasks.md (17.806 bytes, 44/44 checked)
├── apply-progress.md (19.142 bytes)
├── verify-report.md (18.466 bytes)
├── exploration.md (12.364 bytes)
└── archive-report.md (this file)
```

**Verificación de copia**: `diff -r` post-move vacío (comprobado contra snapshot pre-move)

## Métricas y Presupuesto

| Métrica | Valor |
|---|---|
| Techo aprobado (2026-09-21) | 6.200 líneas |
| Medición medida anterior | 5.613 líneas |
| Esta tanda (cifra reservada para oracle) | — líneas |
| Margen disponible | — |

**Nota**: El cierre de git diff para el ledger se mide DESPUÉS de este commit.

## Observaciones Finales

1. **Spec compliance**: Los 18 escenarios de los dos deltas están implementados y probados. La prueba N5 (IV-12) mide la posición de dos guardas conflictivas y fija ambos mensajes.

2. **Trazabilidad**: Los cinco hallazgos de R1 (1 CRITICAL + 4 WARNING) están cerrados con evidencia verificada. Las citas se reparan según Caso B (anclaje de revisión).

3. **Deuda registrada**: IV-12 queda como punto abierto sin destino de EPG, para que lo asigne quien decida el alcance futuro de remisiones.

4. **Merge success**: La fusión de dos deltas se hace sin conflictos. El script validado produce exactamente 6 líneas de traza (3 MODIFIED + 3 RENAMED+MODIFIED).

5. **Task closure**: Todos los 44 tasks están marcados completados. Verify R2 valida que sí lo están.

---

**Cierre**: 2026-09-21, f1b-10-r1, 7bf0626
