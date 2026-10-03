# Archivo: guarda de remisión de entrada vigente en «Habilitar Servicio» (F1B-03, parte L)

## Cobertura de la fila F1B-03 (R-1)

**Cubre** de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83` la guarda de remisión de entrada vigente en «Habilitar Servicio», con su comodidad en el cliente y el aviso no bloqueante («tipo de servicio» y «ticket sin OV» ya estaban construidos, `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/proposal.md:48`); **deja fuera** la OVI de garantía, que no entró por no haber respuesta registrada a E-157, y la supresión de los prefijos, que va en un segundo cambio con el mismo `tanda:`.

Por eso la cabecera dice `cierra: no`, y F1B-03 **sigue «en curso»** en el barrido de reconciliación:
`apps/desk/server/reconciliacion/comprobaciones.ts:222` sólo saca de esa lista las tandas archivadas **con**
`cierra: si`. `apps/desk/server/reconciliacion/registro.test.ts:220` y `docs/sdd/RECONCILIACION.md:21` la listan entre
las siete en curso y **no se tocan** en este archivo.

## Commits de la rama `tipo-servicio-ticket-sin-ov` (desde `5f68822`)

| Commit | Qué |
|---|---|
| `ece1dea` | Planificación: exploración, propuesta, deltas, diseño y tareas |
| `a77ec68` | Corrección de la planificación: «vigente» es remisión de entrada creada y no anulada, a la letra; se retira el supuesto S-1 |
| `6dbae98` | Lote 1: guarda de remisión de entrada vigente en el servidor, con su prueba frente al recuento de `Remisión creada` |
| `613669b` | Lote 2: botón «Habilitar Servicio» con el predicado compartido, aviso de «remisión sin confirmar» y cierre de la guarda |
| `4d140d6` | Reconciliación: F1B-03 pasa a «en curso», siete tandas |
| `b34cf8d` | `verify-report.md` |
| (este) | Archivo: fusión de los dos deltas, mudanza a `archive/`, retirada de los dos deltas borrador, cierres en sitio del verify |

## Registro de intentos (`gentle-ai sdd-attempt`)

| Unidad | Partida | Commits | Líneas |
|---|---|---|---|
| Lote 1 | `a77ec68` | `6dbae98` | 691 |
| Lote 2 | `6dbae98` | `613669b`, `4d140d6` | 466 |
| Verify | `4d140d6` | `b34cf8d` | 205 |
| Este archivo | `b34cf8d` | (este) | la medida del intento del archive consta en el commit de archivo |

En los tres intentos cerrados el registro anotó la misma cifra que `git diff --shortstat --no-renames` contra el commit de
partida (595 + 96, 418 + 48 y 205 + 0). Ninguno pasó del techo de 800. El intento del archivo se abrió con techo 6.000,
por la mudanza de carpetas.

## Verify

`verify-report.md` (commit `b34cf8d`, sobre el árbol de `4d140d6`): **PASS WITH WARNINGS**, 0 CRITICAL, 3 WARNING,
4 SUGGESTION; 2 requisitos y 33 escenarios (27 de RQ-TS-33 y 6 de RQ-RE-20), todos con prueba que pasó. Sobre `4d140d6`:
`npm test` 2.632 verdes y 2 omitidas (178 ficheros y 1 omitido), `typecheck` limpio, `lint` 165 avisos y 0 errores,
detector de citas con 0 bloqueantes. Los hallazgos están en
`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/verify-report.md:184`.

| Hallazgo | Estado al archivar |
|---|---|
| W-1 | **Cerrado** en este archivo, en sitio: el comentario de `apps/desk/server/services/ticketService.test.ts:1277-1278` dice ya que el mutante equivalente es mover **el par** de guardas, y que mover sólo la guarda pone roja P2 |
| W-2 | **Cerrado** en este archivo, en sitio: `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/apply-progress.md:140` deja la comprobación en la app como pendiente de persona tras publicar |
| W-3 | **Cerrado** en este archivo: retirados los deltas borrador de `permissions` y `tickets-core`; la cabecera pasa a `capacidad: [transitions-st, remisiones]` (`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/proposal.md:4`) |
| S-1 | **Cerrado** en este archivo, en sitio: `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:28` dice que la fila de total lleva `estado` nulo (salida del `ROLLUP`) |
| S-2 | **Cerrado** en este archivo, en sitio: `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/apply-progress.md:105` cita la línea 339 de `TicketDetailView.tsx`, la que pasa `remisiones` al panel |
| S-3 | **Queda.** El `.tsx` no tiene red (F0-00): que el motivo llegue a `disabled` (`apps/desk/src/components/TransitionPanel.tsx:130`) y el aviso a la pantalla (`apps/desk/src/components/TransitionPanel.tsx:137`) lo cubre la verificación en la app. Dueño: persona de Comercial |
| S-4 | **Queda.** La tabla de RQ-TS-06 no lista la guarda nueva. Dueño: un cambio futuro de documentación de RQ-TS-06, sin tanda asignada |

## Fusión de los deltas en las specs vivas

| Spec | Numstat | Qué entra |
|---|---|---|
| `transitions-st` | +219 / −0 | RQ-TS-33 (27 escenarios) en `openspec/specs/transitions-st/spec.md:1807`, con sus supuestos como subapartado (`openspec/specs/transitions-st/spec.md:2008`) |
| `remisiones` | +76 / −0 | RQ-RE-20 (6 escenarios) en `openspec/specs/remisiones/spec.md:708` |
| **Total** | **295** | 2 requisitos, 33 escenarios |

Los dos requisitos entran **al final** de su spec, tras un separador, **sin mover ninguna línea existente**: un solo
tramo añadido por fichero, tras la última línea original (la 1801 y la 702). Como en la fusión de RQ-TS-32 (`c557273`),
no viajan a la spec viva el encabezado de alta del delta ni su apartado «Fuera de alcance — para el `archive-report`»,
cuyo contenido queda en los deltas archivados y en este informe. La tabla de supuestos de `transitions-st` pasa a
subapartado de RQ-TS-33, y la frase que hablaba de «la primera versión de este delta» dice ahora «de este requisito».

**Retirados sin fusionar:** los deltas borrador de `permissions` (121 líneas) y `tickets-core` (47), 168 en total. Eran
el borrador del lote 3 (OVI de garantía), que no entra en esta tanda.

## Barrido de citas (regla de mutación 4)

- **Construcción (lotes 1 y 2).** Cero desplazamientos en los 22 ficheros existentes tocados: todos los tramos son en
  sitio, línea por línea, o añadidos tras la última línea. De las citas del propio cambio, 17 describían el estado
  anterior y se anclaron a `a77ec68` (caso B); las citas vivas que caen sobre líneas editadas en sitio siguen diciendo
  lo mismo (caso A, sin cambio).
- **Detector.** Ejecutado sobre `b34cf8d`: 0 bloqueantes, 4.763 comprobadas, línea base 0, 12 abreviadas rotas
  informativas.
- **Este archivo.** La fusión añade al final de dos specs: ninguna cita existente se desplaza. Las citas con línea del
  bloque añadido, 17 en `transitions-st` y 8 en `remisiones`, se leyeron una a una contra el árbol de hoy; todas existen,
  no están vacías y dicen lo que afirman. Las dos de RQ-TS-33 a RQ-TS-03 (`openspec/specs/transitions-st/spec.md:98` y
  `openspec/specs/transitions-st/spec.md:101-103`) no se mueven. La de la línea 33 de `botonRemision.ts` conserva su
  ancla en `a77ec68`. Ninguna cita del bloque apunta a la carpeta anterior del cambio.

## Medida (regla del archivo)

Parte con carga de revisión, medida con `git diff --shortstat --no-renames HEAD` sobre `openspec/specs` y este informe:
**295** (fusión) + **139** (este informe) = **434** inserciones y 0 borrados, por debajo de 800. La mudanza de la carpeta
y la retirada de los 168 de borrador quedan fuera de esa parte. La cifra total del intento la registra quien commitea.

## Supuestos reversibles

Están en `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/proposal.md:176` y en el subapartado de
supuestos de RQ-TS-33. Los que conviene tener a la vista:

- **S-3:** la guarda alcanza a «Equipo nuevo», como a cualquier clasificación que pase por la transición.
- **S-4:** se conservan los tres orígenes de «Habilitar Servicio»; RQ-TS-02 no cambia.
- **Calibración directa:** fuera de este cambio; no se toca `packages/shared/src/transitions.ts`.

**«Vigente» NO es un supuesto:** es la letra de `docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356` —remisión de
entrada, creada y no anulada, con cualquier estado de envío—. El supuesto que exigía una remisión confirmada se retiró
en `a77ec68`.

## Tareas de persona (regla del ciclo 1: archivar no las da por hechas)

La tabla de origen es `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/tasks.md:128`. E-157, E-158 y
E-159 viven en la bandeja de entrada, que esta rama no contiene: se nombran por su identificador, sin línea.

| Tarea | Dueño | Destino |
|---|---|---|
| **E-157**: qué es «crear la OVI» en Desk y sus cinco preguntas (área del acto, aprobaciones, tickets que ya traen la OVI, sin cargos asignados, relación con el tipo «Garantía») | Gerencia, con el Director Técnico | Desbloquea la OVI de garantía, en un cambio propio; la respuesta, a `openspec/config.yaml` → `decisiones_de_gerencia_adenda` |
| **E-158**: ¿la guarda alcanza a «Equipo nuevo»? (se mantiene S-3: sí) | Gerencia, con Servicio Técnico | **Condición de publicación**, no de construcción ni de fusión |
| **E-159**: la decisión de la guarda no está registrada como clave en `openspec/config.yaml` | Sesión de supervisión | Bandeja |
| Ejecutar contra producción la consulta del 2026-09-25 y la del 2026-10-03, y entregar las cifras | Gerencia | Condición de publicación |
| Asignar `cargo_permiso` «Director Técnico» en producción | Gerencia o administrador | Condición de despliegue de la OVI de garantía, si llega a construirse |
| Comprobación de Drive y n8n sobre los prefijos | Gerencia | Segundo cambio de F1B-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:177`) |
| Verificación en la app tras desplegar: botón desactivado con el texto único sin remisión de entrada; **activo** con el aviso con la remisión sin confirmar; sin aviso con la confirmada | Persona de Comercial | Tras publicar el lote 2 |

## Queda anotado

- **Mutante equivalente declarado:** mover **el par** `exigirAltaValidada` + `exigirRemisionVigente` delante de cargo,
  prioridad o verificación no lo caza ninguna prueba
  (`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/design.md:264-267`). Mover sólo la guarda nueva sí
  pone roja P2.
- **P4 no discrimina frente a P3:** las dos se ponen rojas con la misma mutación (la guarda detrás de la línea 134 de
  `ticketService.ts`); P4 documenta la pareja con la cuarentena, no añade detección.
- **La tabla de RQ-TS-06 de la spec viva sigue sin listar la guarda nueva** (S-4): el orden completo lo fijan hoy sólo
  las pruebas P1 a P7.
- **La consulta SQL nueva no se ha ejecutado:** está escrita y es de sólo lectura; ejecutarla es tarea de persona.
- **S-3** del verify: la pantalla queda a la verificación en la app.

## Pendiente tras este commit

- **La fusión de la rama a `main`:** es del orquestador y **aún NO está hecha**; nada de esta tanda está fusionado ni
  publicado.
- **Paquete de despliegue siguiente:** debe incluir esta guarda con sus condiciones de publicación (E-158 y las cifras
  de las dos consultas) y la verificación en la app.
- La OVI de garantía y la supresión de los prefijos siguen pendientes dentro de F1B-03.
