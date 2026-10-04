# Informe de archivo — derivacion-repuestos-director-tecnico (F1C-11)

**Tanda:** F1C-11 · **cierra:** si · **Fecha:** 2026-10-03 · **Rama:** `derivacion-repuestos-director-tecnico`,
nacida de `main` en `f55b7d9`. La rama no se ha fusionado ni empujado: la fusión la autoriza el usuario.

## Qué parte de la fila cubre

**Cubre** la derivación de «Solicitud repuestos» al cargo Director Técnico, el retorno de «Entrega de Repuestos»
al técnico que tomó el ticket y el alta de «Especialista técnico» como octavo cargo. **Deja fuera** el respaldo
al Especialista técnico cuando el Director Técnico está ausente, que espera al registro de ausencias (1E), y la
restricción de quién puede ejecutar cada paso, que llega con el nivel de permisos de propietario del registro.
La fila pide sólo la derivación (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:109`), así que el
`cierra: si` se sostiene.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commits | Medida |
|---|---|---|
| Planificación | `870adb6` | 725 líneas, artefactos del cambio |
| Apply, lote único | `d179c12`, `3d1b753` | 487 (408 insertadas, 79 borradas) |
| Verify | `79180e6` | 220, el informe |
| Remediación del verify | `8f91947` | 33 (32 insertadas, 1 borrada), sólo pruebas |
| Archive, parte revisable | este commit | fusión en las specs vivas: 158 (130 insertadas, 28 borradas), más este informe |

`packages/shared/src/transitions.ts`, `cargos.ts` y `sla.ts` quedan a cero líneas netas respecto a `f55b7d9`
(397, 98 y 146 líneas), de modo que ninguna cita a esos ficheros se desplaza.

## Qué se fusionó en las specs vivas

- `openspec/specs/derivacion-avisos/spec.md`: RQ-AV-02 pasa de tres a cinco propuestas y de 28 a 26 transiciones
  que heredan, con los escenarios de `solicitud_repuestos`, `entrega_repuestos`, la caída a lo heredado y el
  servidor que no impone el destinatario. La cita del bloque queda en `packages/shared/src/transitions.ts:274-282`.
- `openspec/specs/permissions/spec.md`: RQ-PM-12 pasa de siete a ocho cargos; RQ-PM-20 y RQ-PM-23 se sustituyen
  enteros porque sus escenarios recorrían «siete cargos».

Ninguna capacidad es nueva, así que `openspec/config.yaml → capabilities` no cambia.

## Pruebas y comprobaciones al cierre

Ejecutadas en el worktree sobre el árbol de este commit: `npm test` con 178 ficheros y 2.641 pruebas en verde
(1 fichero y 2 pruebas omitidas), `npm run typecheck` con salida 0, `npm run lint` con 165 avisos y 0 errores, y
el detector de citas con salida 0.

## Mutaciones reproducidas

| Mutación | Qué se rompe | Quién la reprodujo |
|---|---|---|
| M1 · quitar `solicitud_repuestos` | cinco pruebas | apply y verify |
| M2 · quitar `entrega_repuestos` o pasarla a cargo | mapa entero y derivación inicial | apply |
| M3 · otro cargo en `solicitud_repuestos` | mapa entero y escalado | apply |
| M4 · mover «Especialista técnico» en `CARGOS` (posición) | lista en orden y guardián | apply y orquestador |
| M5 · alterar el nombre en `openspec/config.yaml:3494` (fichero vigilado) | guardián de las dos decisiones | apply y orquestador |
| M6 · quitar el octavo cargo | nueve pruebas | apply y verify |
| M7 · imponer el destinatario en el servidor | sólo la prueba de caracterización N5 | apply, verify y remediación |

Todas se revirtieron y el árbol quedó limpio tras cada una.

## Hallazgos del verify y qué se hizo

| Hallazgo | Qué se hizo |
|---|---|
| W1 · la lista de tandas «en curso» de `apps/desk/server/reconciliacion/registro.test.ts` incluía F1C-11 | Este commit la devuelve a siete, porque al archivar con `cierra: si` la tanda sale de «en curso» |
| W2 · citas y cifras de las specs vivas | Reparadas por la fusión. Las menciones que quedan de «tres entradas» y «siete cargos» son las notas de versión anterior de los propios requisitos |
| W3 · tres afirmaciones sin aserción por ejecución | Cerrado en `8f91947`: una prueba fija 5 propuestas y 26 heredadas, y otra que ningún estado con alarma es `En Proceso` ni `Solicitado`. El comentario de recuento sigue siendo de lectura |
| W4 · las tareas de persona sólo estaban en `tasks.md` | Escritas en `docs/sdd/ENTRADA.md` como E-162 |
| S1 · N5 usaba sesión de administrador | Cerrado en `8f91947`: la ejecuta un usuario de Servicio Técnico |
| S2 · una prueba del octavo cargo nace verde | Queda declarado en `apply-progress.md`; no se cambia |
| S3 · una cita de `transitions-st` ya desfasada en `f55b7d9` | Ajena a la tanda; no se toca |

## Supuestos aplicados

Los siete están en `proposal.md`, sección «Supuestos (modo producción)». El único que cambia lo que ve el
usuario es S-1: «deriva» se construye como la propuesta por defecto que ya existía —la casilla abre con el
Director Técnico y quien ejecuta puede cambiarla— y el servidor no impone el destinatario. Bajo la regla
invariable 13 es comodidad del cliente, no guarda. La pregunta de si debe imponerse está en
`docs/sdd/ENTRADA.md`, E-160.

## Entradas en la bandeja

- **E-160** · pregunta para Gerencia: ¿la derivación al Director Técnico se propone o se impone?
- **E-161** · hallazgo: `docs/artefactos/blueprintserviciotecnico.html` sigue diciendo que proponen tres.
- **E-162** · las dos tareas de persona de abajo, como condición de despliegue.

## Tareas de persona — archivar no las da por hechas

1. Asignar en producción el cargo «Especialista técnico» a Johny Luna.
2. Confirmar que el cargo de quien es Director Técnico en producción está escrito «Director Técnico». Si no
   casa, la casilla no propone a nadie y el ticket conserva el derivado que traía, sin aviso.

## Para el paquete de despliegue

Sin cambios de esquema ni variables de entorno. F1C-11 entra con E-162 como condición previa. El texto de
corrección del maestro (M1.9.2, «tres proponen») está en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`,
corrección nº 21.

## Pendiente al fusionar

`registro.test.ts` fija a mano la lista de tandas en curso; las ramas de F1B-04 y F1F-05 nacen de `f55b7d9` y
tocarán esa misma línea, así que es un conflicto previsible de fusión. La marca de «cerrada por archivo» en la
fila del plan y la regeneración de `docs/sdd/RECONCILIACION.md` se hacen en `main` tras la fusión.

## Barrido de citas a specs vivas desplazadas por este archivo (2026-10-04, fuera de intento)

La fusión de los requisitos de F1C-11 inserta líneas EN MEDIO de specs vivas ya citadas, así que la frase
«citas sin desplazar» de este cierre no era correcta. Método: para cada cita completa a una spec viva que
existe en `main` en `f55b7d9` —sin excluir `archive/`—, se comparó la línea citada en `f55b7d9` con la de
esta rama. Las citas que ya nombraban su revisión no cuentan: se leen en su ancla y este archivo no las toca.
Las tablas nombran fichero y línea en columnas separadas, a propósito, para que no tengan forma de cita.

**Sin ancla y afectadas: 34.** Ancladas a `f55b7d9`: 5. Rotas de antes: 29. Registros fechados sin editar: 0.

### Ancladas a `f55b7d9` (caso B): la línea de esa revisión dice lo que la frase afirma

| Fichero que cita | Línea | Spec viva citada | Línea(s) citada(s) | Qué le hace este archivo |
|---|---|---|---|---|
| 2026-10-02-alta-manual-equipo-cliente · apply-progress.md | 142 | permissions | 362 | pasa a la 392 |
| 2026-10-02-rechazo-solo-comercial · exploration.md | 85 | derivacion-avisos | 134 | pasa a la 204 |
| 2026-10-03-tipo-servicio-ticket-sin-ov · exploration.md | 66 | permissions | 411 a 418 | pasa a la 441; pasa a la 448 |
| 2026-10-03-tipo-servicio-ticket-sin-ov · proposal.md | 63 | permissions | 411 a 418 | pasa a la 441; pasa a la 448 |
| 2026-10-03-tipo-servicio-ticket-sin-ov · verify-report.md | 148 | permissions | 486 | pasa a la 518 |

### Rotas de antes: NO se anclan

En `f55b7d9` la línea citada ya no decía lo que la frase afirma —la desplazó un archivo anterior a esta tanda—,
así que anclarlas a esa revisión las volvería falsas con apariencia de reparadas. Quedan como estaban y se
listan aquí; este archivo las mueve otra vez, pero no las rompe: ya lo estaban.

| Fichero que cita | Línea | Spec viva citada | Línea(s) citada(s) | Qué le hace este archivo |
|---|---|---|---|---|
| 2026-09-21-orden-precedencia-guardas · design.md | 309 | permissions | 303 | pasa a la 333 |
| 2026-09-21-orden-precedencia-guardas · design.md | 407 | permissions | 303 | pasa a la 333 |
| 2026-09-25-blueprint-equipo-nuevo · apply-progress.md | 460 | derivacion-avisos | 119 | pasa a la 189 |
| 2026-09-25-blueprint-equipo-nuevo · apply-progress.md | 477 | derivacion-avisos | 110 | modificada |
| 2026-09-25-blueprint-equipo-nuevo · apply-progress.md | 479 | derivacion-avisos | 212 | pasa a la 282 |
| 2026-09-25-blueprint-equipo-nuevo · archive-report.md | 108 | derivacion-avisos | 107 a 141 | vacia; pasa a la 211 |
| 2026-09-25-blueprint-equipo-nuevo · design.md | 120 | derivacion-avisos | 212 | pasa a la 282 |
| 2026-09-25-blueprint-equipo-nuevo · tasks.md | 380 | derivacion-avisos | 212 | pasa a la 282 |
| 2026-09-25-blueprint-equipo-nuevo · verify-report.md | 121 | derivacion-avisos | 119 | pasa a la 189 |
| 2026-09-25-blueprint-equipo-nuevo · verify-report.md | 127 | derivacion-avisos | 212 | pasa a la 282 |
| 2026-09-27-salidas-verificacion · apply-progress.md | 71 | derivacion-avisos | 119 | pasa a la 189 |
| 2026-09-29-alarmas-horas-habiles · archive-report.md | 40 | derivacion-avisos | 454 | pasa a la 524 |
| 2026-09-29-blueprint-soporte-remoto · apply-progress.md | 145 | permissions | 301 | pasa a la 331 |
| 2026-09-29-blueprint-soporte-remoto · apply-progress.md | 158 | permissions | 301 | pasa a la 331 |
| 2026-09-30-permisos-por-cargo · apply-progress.md | 101 | derivacion-avisos | 415 | pasa a la 485 |
| 2026-09-30-permisos-por-cargo · apply-progress.md | 133 | derivacion-avisos | 415 | pasa a la 485 |
| 2026-09-30-permisos-por-cargo · design.md | 113 | permissions | 301 | pasa a la 331 |
| 2026-09-30-permisos-por-cargo · tasks.md | 11 | derivacion-avisos | 415 | pasa a la 485 |
| 2026-09-30-permisos-por-cargo · tasks.md | 220 | derivacion-avisos | 415 | pasa a la 485 |
| 2026-10-01-prioridad-top5-cliente · apply-progress.md | 49 | permissions | 310 | pasa a la 340 |
| 2026-10-01-prioridad-top5-cliente · apply-progress.md | 49 | permissions | 483 | pasa a la 515 |
| 2026-10-01-prioridad-top5-cliente · apply-progress.md | 99 | permissions | 310 | pasa a la 340 |
| 2026-10-01-prioridad-top5-cliente · apply-progress.md | 99 | permissions | 483 | pasa a la 515 |
| 2026-10-01-prioridad-top5-cliente · archive-report.md | 91 | permissions | 425 a 437 | vacia; pasa a la 468 |
| 2026-10-01-prioridad-top5-cliente · proposal.md | 26 | permissions | 359 | pasa a la 389 |
| 2026-10-01-prioridad-top5-cliente · proposal.md | 100 | permissions | 359 a 362 | pasa a la 389; pasa a la 392 |
| 2026-10-01-tres-transiciones-cifra-anclada · apply-progress.md | 89 | derivacion-avisos | 587 | pasa a la 657 |
| 2026-10-01-tres-transiciones-cifra-anclada · apply-progress.md | 90 | derivacion-avisos | 587 | pasa a la 657 |
| 2026-10-02-rechazo-solo-comercial · design.md | 19 | permissions | 529 | pasa a la 561 |
