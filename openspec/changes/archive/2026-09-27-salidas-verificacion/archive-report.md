# Informe de archivo: salidas-verificacion (F1A-03)

**Fecha de cierre**: 2026-09-27  
**Cambio**: `salidas-verificacion`  
**Fila**: F1A-03 (`plan:142`), clasificada como **cierra: no**

## Alcance cubierto (R-1 reconciliación)

Construye **E1 y E2** de F1A-03:
- **E1** · Salida aprobada `Verificación —Liberación→ Finalizado` (amplía `liberacion.from`)
- **E2** · Salida rechazada `Verificación → Notificado` (nueva transición `rechazo_verificacion`)
- **Invariante** · `sinSalida` de la unión pasa a exactamente `['Finalizado']`

**Dejó fuera:**
- **E3+E4** · Guarda de obligatoriedad por tipo de analizador y lista de gases patrón → `docs/sdd/ENTRADA.md:1187-1192` E-082 (dueño Gerencia/Calidad; destino propuesto: fila F1A-03)
- **E5** · Guarda de certificado en `Liberación` desde `Verificación` → `docs/sdd/ENTRADA.md:1194-1199` E-083 (dueño Gerencia/Calidad; destino propuesto: fila F1A-03)

Por eso **cierra: no** — fila F1A-03 sigue pendiente de esas dos puertas de guardián.

## Especificaciones sincronizadas

| Capacidad | Fichero | Acción | Detalles |
|---|---|---|---|
| `transitions-equipo-nuevo` | `openspec/specs/transitions-equipo-nuevo/spec.md` | MODIFIED | RQ-EN-01: tabla ampliada de 5 a 6 transiciones, `liberacion.from` + `rechazo_verificacion`; RQ-EN-02: referencias actualizado de 5 a 6 transiciones; se retiró la sección "Nota de despliegue" (bloqueo levantado); "Fuera de alcance" actualizado (E-082 y E-083 ahora nombradas con entrada en ENTRADA.md) |

**Merge verificado**: diff -r entre snapshot previa y archivo: sin diferencias (vacío).

## Despliegue

**Bloqueador levantado**: el archivo de `blueprint-equipo-nuevo` (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:32`) declaraba que F1B-06 no se despliega sin F1A-03. Con este cambio en `main`, el bloqueo se levanta: **`main` es ahora desplegable respecto de F1B-06**.

## Ciclo SDD

| Fase | Commit(s) | Estado | Detalle |
|---|---|---|---|
| **Planificación** | `620ad7f` `f488c3d` | ✅ | Propuesta y spec delta escritas; planificación y tareas elaboradas |
| **Aplicación** | `c373bcc` `1cb43c7` | ✅ | Datos en `transitions.ts:359-362`; 6 ficheros de prueba modificados; 3 pruebas nuevas (suite 1442 → 1445; en los seis ficheros tocados, 71 → 74); 4 mutaciones ejecutadas; barrido de citas (regla 4, caso A/B/C); todo en verde |
| **Verificación** | `0ee7957` | ✅ **Pass con avisos** | Reporte: 0 CRITICAL, 1 WARNING, 1 SUGGESTION (ver abajo) |

**Ledger `sdd-attempt`:**
- Apply: 342 líneas cambiadas (git: 252 insertadas, 90 borradas)
- Verify: 123 líneas (reporte)

**CI:**
- Commit `f488c3d` (spec delta): run 36358691836 — ✅ success
- Commit `1cb43c7` (apply): run 36360337783 — ✅ success
- Commit `0ee7957` (verify): run 36361393514 — ✅ success

## Verificación y alertas

**Veredicto general**: `pass con avisos` (0 CRITICAL, 1 WARNING, 1 SUGGESTION)

### WARNING-1 · Discrepancia de recuento de tareas

**Artefacto**: `apply-progress.md:3` vs. `tasks.md` (línea de cierre de ambos)

**Lo que dice**:
- `apply-progress.md:3`: «20/20 tareas completas (Fases 1-5)»
- `tasks.md`: 26 tareas totales, todas [x] completas

**Causa**: no determinada. `tasks.md` tiene 26 casillas por fases (7+5+5+2+7, recuento del verify)
y todas están [x]; el «20/20» no corresponde a ningún recuento de ese fichero.

**Clasificación**: el recuento de `apply-progress.md:3` es incorrecto; la implementación no se ve
afectada (las 26 tareas están hechas y el verify las contrastó contra el código).

**Acción tomada**: Registrado como hallazgo conocido; no se edita `apply-progress.md`
(es un artefacto intermedio de la fase SDD).

### SUGGESTION · Frases estables con numeración anterior

**Ubicación**: 
- `apps/desk/server/permisos.test.ts:221`: comentario «cinco transiciones»
- `apps/desk/server/transicionesEjecucion.test.ts:290,311`: «cinco» (contexto de referencia histórica)

**Situación**: Frases de referencia al catálogo del estado PRE-cambio, ahora estables dentro de comentarios explicativos que no se tocan. Correctas en su histórico; su actualización es menor y se deja como follow-up (no fija nada observable hoy).

**Acción tomada**: Registrado; sin arreglo ahora (regla de mutación 4, Caso B — histórico con contexto).

## Tareas de persona — fuera del recuento SDD

Estas no cuentan como tareas de la tanda; **archivar este cambio no las marca como hechas**.

| Tarea | Dueño | Ubicación | Estado | Notas |
|---|---|---|---|---|
| **E-082** — Guarda de gas patrón por familia/tipo de analizador | Gerencia/Calidad | `docs/sdd/ENTRADA.md:1187-1192` | Abierta; destino propuesto fila F1A-03 | Criterio de aceptación E3/E4 del proposal; depende de compuesto catalógado |
| **E-083** — Guarda de certificado en `Liberación` desde `Verificación` | Gerencia/Calidad | `docs/sdd/ENTRADA.md:1194-1199` | Abierta; destino propuesto fila F1A-03 | Criterio de aceptación E5; contempla `R08.2.md:1520` |
| **Verificación en app tras despliegue** | Servicio Técnico / Gerencia | (sin fichero) | Por hacer | Seguir convención in-app post-despliegue sobre `ambientalia-desk.ambientalia.cloud` |
| **Comprobación de persona nº 2 (heredada)** | Servicio Técnico | `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:84-89` | Re-observar | «Ticket en `Verificación` cae en columna Otros» — re-evaluar tras este despliegue |

## Ajuste del maestro

**`toca_maestro: si`** — la aplicación suma una séptima transición (de 6 declaradas en M1.4 `R08.2.md:1493` a 7 reales).

**Línea de acción**: La corrección se entrega al expediente R08.3 para que Gerencia la pegue al `.docx` maestro, no se toca aquí. Fichero: `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (pendiente de crear entrada de corrección; fila §11.2 del expediente `docs/sdd/R08.3_Expediente_de_cambios.md:552` ya recoge la decisión, pero no la fila nueva de tabla).

## Regla de método — citas archivadas

**Barrido de la regla de mutación 4**: Ejecutado en apply-progress.md§Barrido. Casos identificados:

- **Caso A (reparadas, 4)**: `proposal.md` y especificaciones internas actualizadas al nuevo rango `:350-363`
- **Caso B (históricas, sin tocar, 3+)**: Citas en artefactos de salidas-verificacion propios y archivos de `blueprint-equipo-nuevo`
- **Caso C (cerrado)**: La discrepancia de numeración de invariante (1 vs 3) se cerró al retirar esa frase

Detector de `pre-push`: 0 bloqueantes, 12 abreviadas rotas preexistentes (informativas).

## Artefactos archivados

La carpeta `openspec/changes/archive/2026-09-27-salidas-verificacion/` contiene:
- ✅ `proposal.md`
- ✅ `specs/transitions-equipo-nuevo/spec.md` (delta)
- ✅ `design.md`
- ✅ `tasks.md` (26/26 [x])
- ✅ `apply-progress.md`

## Conclusión

Cambio **archivado y cerrado de ciclo SDD** (propuesta → spec → diseño → tareas → aplicación → verificación → archivo).

La fila F1A-03 **sigue pendiente** de E-082 y E-083 (guardias de negocio); archivar este cambio cierra la construcción de las dos salidas de `Verificación` pero no cierra la fila completa.

**Próximo paso**: Entrega de correcciones al maestro `.docx` para la R08.3, y, cuando Gerencia decida E-082/E-083, su construcción como contenido de la fila F1A-03, que es lo que falta para `cierra: si`.
