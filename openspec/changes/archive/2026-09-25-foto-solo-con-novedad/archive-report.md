# Informe de archivo — `foto-solo-con-novedad` (F1B-04, primer cambio, `cierra: no`)

**Qué parte de la fila cubre y qué deja fuera, en una línea (R-1):** de la fila F1B-04 «Recepción
unificada» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:159`) cubre «foto sólo con
novedad» —el técnico declara si el equipo llega con novedad y, si la hay, la remisión no se envía sin
fotos—; deja fuera la remisión con datos de cliente y equipo y los accesorios por lista cerrada (ya
construidos y probados antes de esta tanda), y la rotulación y el almacenamiento y los desplegables en
las etapas críticas, que esperan decisión de Gerencia (`docs/sdd/ENTRADA.md`, E-079 y E-080). La fila
sigue abierta.

## Commits

| SHA | Fecha | Qué |
|---|---|---|
| `a0a2935` | 2026-09-25 | E-079 y E-080 en la bandeja (antes de la ficha) |
| `d5d66a1` | 2026-09-25 11:24 | Ficha: `proposal.md`, delta de `remisiones`, `design.md`, `tasks.md` |
| `265cd45` | 2026-09-25 12:09 | Apply: columna `public.remisiones.hay_novedad`, predicado `faltaFotoPorNovedad` en `packages/shared/src/remision.ts`, sexta puerta de `POST /api/remisiones/:id/enviar`, pregunta en `CrearRemision.tsx`, pruebas, barrido de citas |
| `7aefbab` | 2026-09-25 12:10 | Citas: `CLAUDE.md` vuelve a cero líneas netas y se anclan a su revisión las citas que el apply desplazó |
| `bf58bdc` | 2026-09-25 12:34 | `verify-report.md` y casillas 10.3 y 10.4 de `tasks.md` |
| (este) | 2026-09-25 | Archivo: fusión de la delta y traslado de la carpeta |

## Verificación

`verify-report.md`: **pass con avisos** — 0 CRITICAL, 3 WARNING, 2 SUGGESTION; 4 requisitos y 10
escenarios automáticos cumplidos; `tasks.md` 49/49. `npm test` 1390 pasadas y 2 omitidas; `typecheck`,
`lint` (0 errores, 165 avisos, los de la base) y `build` con salida 0. El alta de remisión no ganó
guardas ni cambió de orden (IV-12 intacto), y el payload a n8n no cambió (`git diff` vacío en
`apps/desk/server/remisionWebhook.ts`). Los tres avisos son de estimación, no de comportamiento: el
desplazamiento real de citas fue mayor que el del diseño (`routes/remision.ts` +7 frente a +5), el
barrido completo encontró dos citas que la lista del diseño no tenía, y dos citas de
`docs/sdd/F0-00_Baseline_as-built.md` resultaron caso A y no B. Las dos sugerencias son informativas
(cobertura de rama de ficheros preexistentes; dos abreviadas rotas en el propio `apply-progress.md`).

## Tamaño real frente al ledger

Primera tanda con la medida propia de E-078 (`git add -N` de lo nuevo antes del `settle`).

| Fase | Ledger | Real (`git diff --shortstat --no-renames`) |
|---|---|---|
| Apply | 628 | 628 (541 añadidas, 87 borradas) |
| Verify | 327 | 327 (323 añadidas, 4 borradas) |
| Archive | lo registra el `settle` | traslado de 1.289 líneas (cuenta como borradas e insertadas) + fusión de la delta + este informe |

Con `git add -N`, el ledger y la medida real coinciden en las dos fases: la diferencia de las tandas
anteriores (1.110 frente a 555; 926 frente a 453) no aparece.

## Fusión de la delta

Por ID en `openspec/specs/remisiones/spec.md`: RQ-RE-08 (MODIFIED) sustituido entero —de cinco a seis
puertas, con sus cinco escenarios—, y RQ-RE-17, RQ-RE-18 y RQ-RE-19 (ADDED) a continuación de RQ-RE-16.
La tabla de evidencias de RQ-RE-08 se reapuntó a las líneas de hoy de `apps/desk/server/routes/remision.ts`
(guarda nueva `:285-289`, reclamación `:293-295`, sin ticket `:298`; las tres primeras puertas no se
movieron). **Corrección del orquestador:** el subagente de archivo había dejado los cinco escenarios de
RQ-RE-08 dentro de RQ-RE-15; se trasladaron a su requisito y los encabezados nuevos se igualaron al
formato de la spec viva.

## Barrido de citas (regla de mutación 4)

- El barrido del cambio se hizo en el apply (tabla en `apply-progress.md`) y lo completó `7aefbab`. El
  detector (`apps/desk/server/citas/cli.ts --sha HEAD`) salió con 0 en `7aefbab` y se vuelve a pasar sobre
  el commit de archivo antes del push.
- La única cita externa a `remisiones/spec.md` con número de línea fuera de `archive/` es la de
  `apps/desk/server/ordenVentaUnTicket.test.ts` a las líneas 74-80 (RQ-RE-02), anteriores a todo lo que la
  fusión cambió: no se desplaza.

## Comprobaciones de persona de RQ-RE-19 — archivar NO las da por hechas

Son de `apps/desk/src/components/CrearRemision.tsx`, fuera de la red de pruebas por decisión F0-00, y no
entran en el recuento de tareas (regla del ciclo 1).

| # | Comprobación | Dueño | Dónde queda escrito |
|---|---|---|---|
| Persona-1 | La pregunta «¿El equipo llega con novedad?» aparece al abrir el formulario, sin valor preseleccionado | Servicio Técnico, en la aplicación desplegada | `openspec/specs/remisiones/spec.md`, RQ-RE-19 |
| Persona-2 | Con «Sí» y cero fotos, el formulario no deja crear ni continuar | ídem | ídem |
| Persona-3 | El mensaje del `422` de la sexta puerta se entiende sin explicación adicional | ídem | ídem |

## Supuestos aplicados

- **Alcance:** sólo el elemento «foto sólo con novedad» de F1B-04, por decisión del usuario del
  2026-09-25; los elementos sin decidir van a Gerencia (E-079, E-080).
- **El vehículo es la remisión de entrada.** La regla del maestro está en M2.1, inspección visual previa
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1923`) y en el Anexo C.9
  (`:3894`), fuera de la tabla §3.2 en revisión.
- **Sí / No / sin declarar.** Las remisiones anteriores y las históricas quedan sin declarar y no exigen
  foto.
- **La guarda va en el envío, no en el alta.** Las fotos se suben después de crear la remisión, y el alta
  no gana guardas mientras IV-12 no tenga decisión. Va antes de reclamar el envío para que un reintento
  tras subir la foto no quede bloqueado durante la ventana de reenvío.
- **Contestar la pregunta es una guarda sólo del cliente** (regla invariable 13, punto 2, declarada):
  exigirla en el servidor añadiría una guarda al alta. El servidor sí impone la consecuencia, la foto, en
  el envío.
- **El payload a n8n no cambia**; el flujo de producción no se toca.
- **Basta una foto**, y la marca de novedad no sale en el documento de Drive; si Gerencia quiere otra
  cosa, es reversible (preguntas de la propuesta).

## Sin dueño en esta tanda

Ninguno nuevo. Lo que queda abierto de la fila tiene entrada y dueño propuesto en `docs/sdd/ENTRADA.md`:
E-079 (rotulación y almacenamiento) y E-080 (etapas críticas), las dos para Gerencia.

## Trazabilidad Engram

`sdd/recepcion-unificada/explore` · `sdd/foto-solo-con-novedad/proposal` obs. #1057 · `/spec` #1058 ·
`/design` #1059 · `/tasks` #1060 · `/apply-progress` #1061 · `/verify-report` #1062 · este informe:
`sdd/foto-solo-con-novedad/archive-report`.
