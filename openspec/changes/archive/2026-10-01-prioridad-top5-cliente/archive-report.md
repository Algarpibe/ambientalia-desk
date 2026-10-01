# Archive report — `prioridad-top5-cliente` (F1B-07, `cierra: no`)

Archivado el 2026-10-01 en `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/`, sobre `ce21c66`. Escrito por
el orquestador con cifras re-ejecutadas por él; el borrador del subagente se descartó (su fusión duplicaba el delta en
`tickets-core`, ver «Contraste del subagente»).

## Línea R-1

**F1B-07, `cierra: no`.** Cubre de F1B-07 la prioridad del cliente Top 5 (lista en `public.cliente_prioridad`, prioridad
y ajuste por ticket con motivo y traza en `public.prioridad_ajustes`, con `puedeFijarPrioridadTop5`), «manda la más alta»
entre contrato y Top 5 al nacer, el bloqueo de la prioridad para el técnico en «Escalado a Revisión» y «Devolución a
corrección», y la cola del taller —«Mis tickets» y el tablero— ordenada en el servidor por urgencia y, dentro de ella,
por la fecha de «Habilitar Servicio» (`decision/e099-orden-cola-taller`). **Deja fuera:** la calificación de los
clientes sin contrato ni Top 5 (pregunta **3.b**), quién ajusta a mano fuera de los Top 5 —sin excepción del Director
Técnico— (**3.b.3**, `docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`), la lista de «Remisión creada» por antigüedad para
Comercial (**E-108**) y la propagación del Top 5 a los tickets abiertos (**E-109**). Los dos supuestos de E-099 que su
texto no cierra van como **E-110**.

## Fusión en las specs vivas

| Capacidad | Requisitos antes → después | Añadidos | Modificados en sitio | `--numstat` |
|---|---|---|---|---|
| `tickets-core` | 25 → 29 | RQ-TC-26, RQ-TC-27, RQ-TC-28, **RQ-TC-29** | RQ-TC-24 | +263 −16 |
| `transitions-st` | 19 → 22 | RQ-TS-20, RQ-TS-21, RQ-TS-22 | — | +111 −0 |
| `permissions` | 22 → 23 | RQ-PM-23 | RQ-PM-13, RQ-PM-20 | +44 −6 |
| `vistas-tablero` | 8 → 9 | RQ-VT-09 | — | +71 −0 |

- **RQ-TC-29 entra como requisito NUEVO**, aunque el delta lo ponía bajo «MODIFIED Requirements»: no existía en la spec
  viva (`grep` en `ce21c66` = 0). Se declara aquí porque el delta archivado sigue diciéndolo.
- Fusión total **489 + 22 = 511**, igual que la medida previa en un worktree aislado. Los añadidos van al final de la
  sección 3 de `tickets-core`, antes de la sección 3 de `transitions-st`, antes de la sección 4 de `permissions` y al
  final de `vistas-tablero`. RQ-TC-25, RQ-PM-14 y RQ-PM-21 siguen intactos tras los reemplazos.
- **W3 corregido al fusionar:** las secciones «Fuera de alcance» de los deltas NO se fusionan. Así no llegan a las vivas
  las frases de que el orden de «Mis tickets» no se decide (delta `tickets-core`, «Fuera de alcance»; delta
  `transitions-st`, última línea). `grep -i "mis tickets"` en `tickets-core`, `transitions-st` y `permissions` vivas = 0.
  El delta archivado las conserva como registro de lo que se propuso.

## Verify y advertencias

`verify-report.md`: **PASS WITH WARNINGS**, 0 críticos, 12 requisitos y 77 escenarios con prueba.
- **W1** — `top5-manual` dice «todos sus tickets la heredan» y el código lo cumple sólo con los nuevos (S-1). Abierto en
  **E-109**, dueño Gerencia.
- **W2** — criterio de éxito caduco («dentro de una prioridad en el orden de hoy»). **Corregido en sitio** en
  `proposal.md:225` antes de mover: ahora dice la fecha y hora de «Habilitar Servicio» (S-10).
- **W3** — corregido al fusionar (arriba).
- **W4** — los `.tsx` no tienen prueba posible (F0-00); el respaldo es la tabla de la regla 13 de `apply-progress.md` y
  la verificación P.2.

## Riesgo que queda vivo

**El alta acepta una prioridad sin permiso fuera del Top 5 y sin contrato.** Si el cliente no es Top 5 ni tiene
contrato vigente, `prioridadAlNacer` devuelve la del cuerpo tal cual, sin lista blanca ni guarda de cargo
(`packages/shared/src/contratos.ts:66-69`, llamada en `apps/desk/server/services/ticketService.ts:106`). Es el supuesto
S-3 y depende de la pregunta 3.b; no se corrige aquí. Va también en la nota de despliegue.

## Nota de despliegue

Para el próximo paquete (los `Paquete_de_Despliegue_*` son registros fechados y no se editan). Literal en `tasks.md`,
«Nota para el cierre»:
1. **Esquema:** `public.cliente_prioridad` y `public.prioridad_ajustes`, aditivas, vacías, al final de `schema.sql`.
2. **Cambio visible (a):** el técnico ya no cambia la prioridad en «Escalado a Revisión» ni en «Devolución a
   corrección»: el campo desaparece y por API recibe 403.
3. **Cambio visible (b):** un ticket que nace sin prioridad, de un cliente sin Top 5 ni contrato, queda en «Otra
   prioridad» al escalar y al final de la cola.
4. **Cambio visible (c), E-099:** el tablero y «Mis tickets» se ordenan por urgencia y, dentro de ella, por la fecha de
   «Habilitar Servicio», del más antiguo al más nuevo; ya no del más nuevo al más viejo.
5. **Riesgo:** el alta acepta la prioridad del cuerpo sin permiso fuera del Top 5 y sin contrato (S-3, 3.b).
6. **Condición de uso:** hasta que alguien tenga `cargo_permiso` (P.1 de F1C-05), sólo el administrador marca Top 5 y
   ajusta.

## Tareas de persona — archivar NO las da por hechas

| | Dueño | Qué | Dónde queda escrita |
|---|---|---|---|
| P.1 | Director Comercial (hasta tener cargo, un administrador) | Marcar en producción la lista Top 5 y sus prioridades; depende de P.1 de F1C-05 | `tasks.md`, `proposal.md`, este informe |
| P.2 | Comercial y Servicio Técnico | Verificación en la app tras desplegar (`tasks.md`, P.2, puntos 1-5) | `tasks.md` |
| P.3 | Gerencia | Propagar o no el Top 5 a los tickets abiertos (S-1) | E-109 en `docs/sdd/ENTRADA.md` |
| P.4 | Gerencia | Confirmar S-10a y S-10b de E-099 | E-110 en `docs/sdd/ENTRADA.md` |

## Cifras re-ejecutadas por el orquestador (árbol del archive)

`npm test`: 165 ficheros pasan + 1 omitido, **2.206 pruebas pasan + 2 omitidas**. `npm run typecheck`: verde.
`npm run lint`: 0 errores, **165 avisos** (techo). `npm run build`: verde. `RECONCILIACION.md` no regenerado.

## Barrido de citas (regla de mutación 4)

La fusión desplaza líneas de tres specs vivas: `tickets-core` desde la 859, `transitions-st` desde la 745 y
`permissions` desde la 253. Hay 22 citas a esas specs detrás de esos puntos, y cada una se leyó:
- **Caso A, reparadas en sitio:** `docs/sdd/ENTRADA.md:1146` y `openspec/specs/hojas-vida/spec.md:185`
  (`transitions-st/spec.md:995-1000` → `:1106-1111`, la tabla canónica de escalones); `docs/sdd/ENTRADA.md:1248`
  (`permissions/spec.md:425-437` → `:463-475`, §4.3); y `openspec/specs/hojas-vida/spec.md:190`, en forma corta sin `specs/` delante (`transitions-st/spec.md:1003-1005` → `:1114-1116`, la excepción A/C). Esta última no la cazó el primer barrido, que exigía el prefijo `specs/`, y la bloqueó el detector en `pre-push`; se reparó en `d1592b5`.
- **Caso B, sin tocar:** las cuatro de `docs/sdd/Preguntas_Gerencia_2026-09-29.md` llevan ancla `en 53dd0ed`; las 14
  de carpetas archivadas y paquetes de despliegue son registros fechados.
- **Movimiento:** la única referencia viva a la ruta vieja de la carpeta (`docs/sdd/ENTRADA.md:1424`) apunta ya a la
  archivada.

## Contraste del subagente

Su borrador decía «897 líneas fusionadas» y «presupuesto de 5.500». Las dos cifras eran falsas: el techo aprobado es
5.000, y los 897 venían de pegar el delta **dos veces** en `tickets-core` (secciones sueltas «ADDED/MODIFIED
Requirements» en dos puntos), sin reemplazar en sitio el RQ-TC-24 viejo. Las cuatro specs vivas se devolvieron a
`ce21c66` y la fusión se rehízo con el procedimiento medido en el worktree. El movimiento sí era correcto: cada fichero
archivado es idéntico byte a byte al de `ce21c66`, salvo la línea de W2 en `proposal.md`.
