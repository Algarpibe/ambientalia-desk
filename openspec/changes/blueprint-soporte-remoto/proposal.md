---
tanda: F1B-06
motivo: ""
capacidad: [transitions-soporte-remoto, transitions-equipo-nuevo, tickets-core]
maestro: ["M1.5", "M1.2", "Anexo D nº 43"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: blueprint de soporte remoto y campo «Modalidad»

Segundo y último cambio de F1B-06 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:161`,
catálogo `plan:498`, talla L). El primero fue `blueprint-equipo-nuevo` (archivado el 2026-09-25). R-4:
un solo `tanda:`.

## Intención

- Hoy un ticket `Soporte remoto` cae en el grafo de servicio técnico, por escrito y a propósito
  (`openspec/specs/tickets-core/spec.md:504-508`; `packages/shared/src/flujos.test.ts:42-45`).
- M1.5 trae el as-is completo (`R08.2.md:1551-1568`) y el Anexo H lo da por «No construido»
  (`R08.2.md:4642-4645`).
- `decision/anexo-43-en-sitio` manda registrar en 2026 las visitas en sitio por esta rama, «que no
  exige remisión», con el campo «Modalidad: remoto / en sitio» (`openspec/config.yaml:2413`,
  consecuencia (2) en `:2416`).
- Éxito: un ticket `Soporte remoto` nace en `Solicitud Soporte`, ve y ejecuta **sólo** las cuatro
  transiciones de M1.5, impuesto en el servidor, y lleva una modalidad validada por el servidor.

## Lectura de M1.5, estado a estado

Fuente: `R08.2.md:1551-1568`, «[AS-IS]», hoja `DFsoporteremoto030226` y blueprint de Zoho; las cuatro
transiciones «coinciden» (`R08.2.md:1552`).

| Origen | Transición | Destino | Líneas |
|---|---|---|---|
| Solicitud Soporte | Asignación | En Proceso | `R08.2.md:1556-1558` |
| En Proceso | Ejecutar | Finalizado | `R08.2.md:1559-1561` |
| En Proceso | Soporte pendiente | Pendiente | `R08.2.md:1562-1564` |
| Pendiente | Continuación soporte | En Proceso | `R08.2.md:1565-1567` |

- Cuatro estados (`R08.2.md:3650`); disparador «Solicitud de soporte», terminal `Finalizado` (M1.2,
  `R08.2.md:1115-1117`); el bucle de pausa mide la espera del cliente (`R08.2.md:1568`).
- **M1.5 NO dice:** qué área ejecuta cada transición, qué campos lleva, cómo nace el ticket, si hay
  anulación ni qué clase de espera tiene `Solicitud Soporte`. Todo eso son supuestos (abajo).

## Decisión sobre `cierra: si`

| Contenido de la fila F1B-06 | Dónde queda |
|---|---|
| Equipo nuevo (M1.4) con la convención de `transitions.ts` | Hecho: `blueprint-equipo-nuevo` (`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:11-17`) |
| Soporte remoto (M1.5) | **Este cambio** |
| Campo «Modalidad» (alcance añadido, `openspec/config.yaml:2416`) | **Este cambio** |
| «hereda C12» | Satisfecho sin trabajo aquí (ver abajo) |
| Flujos comercial y posible-cliente | Fuera de Desk 2.0 en 2026 por decisión (`plan:393`): F1B-06 construye **dos** ramas |

**«hereda C12» no es contenido de F1B-06.** C12 es la fila F1A-03 (`plan:142`: «Se hace antes de
F1B-06, que la hereda»): F1B-06 recibe las salidas, no las construye. Las dos salidas de
`Verificación` están en `main` desde `salidas-verificacion` (`packages/shared/src/transitions.ts:359-362`;
`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:9-12`). Lo que falta de C12
—guardas de obligatoriedad, gases patrón y certificado— queda destinado a la fila F1A-03, no a F1B-06
(`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:14-18`).

**Veredicto:** con soporte remoto + Modalidad la fila queda completa → `cierra: si`. Las tareas de
persona de abajo no la reabren (regla del ciclo 1). Si spec o diseño recortan cualquiera de las dos
piezas, `cierra` pasa a `no`.

## Alcance

**Dentro**
- Flujo `soporte-remoto`: catálogo de 4 transiciones **al final** de `transitions.ts` (tras `:376`),
  registro en `flujos.ts` (`CATALOGO_POR_FLUJO`, `flujoDelTicket`, nombre del flujo en el `409`).
- `Solicitud Soporte` en `estados.ts` por la técnica de la misma línea (`:105`), excluido de
  `ESTADOS_SERVICIO` (`:182-190`) igual que `Verificación`.
- Nacimiento en `Solicitud Soporte` cuando la clasificación es `Soporte remoto`
  (`packages/zoho-sync/src/db/repo.ts:420-435`); el resto sigue naciendo en `Ticket creado`.
- Guarda 3 heredada (`apps/desk/server/services/ticketService.ts:231-234`); consumidores genéricos por
  flujo sin cambio de código (panel, avisos, SLA).
- Columna `modalidad` en `desk.tickets`, **fuera de `TICKET_COLS`** (`repo.ts:44-54`), fijada en el
  alta y validada en el servidor (`422`); selector en `CreateTicket.tsx` (fuera de la red de pruebas,
  F0-00) y lectura en la ficha.
- `Finalizado` sigue siendo el único estado sin salida de la unión (`invariantesGrafo.test.ts`).
- Inversión deliberada de `flujos.test.ts:42-45`.

**Fuera**
- Rama de servicio en sitio: 2027 T2 (`openspec/config.yaml:2413`, `:2415`).
- Guarda de remisión: F1B-03 (`openspec/config.yaml:2417`).
- Columna propia de tablero para `Solicitud Soporte` (F1B-09) y mapa generado (después del corte,
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:79`).
- Relleno de `modalidad` en tickets heredados y migración de datos.

## Capacidades

- **Nueva** `transitions-soporte-remoto`: ya declarada en `capabilities` (`openspec/config.yaml:123-127`);
  R-2 se cumple creando la spec. No hay que añadirla.
- **Modificada** `tickets-core`: RQ-TC-10 (tres de tres ramas con grafo), RQ-TC-06 y RQ-TC-07
  (`Solicitud Soporte` como estado de nacimiento de soporte remoto), RQ-TC-05 (guarda de modalidad,
  escalón C).
- **Modificada** `transitions-equipo-nuevo`: RQ-EN-04 deja de decir que `Soporte remoto` enruta
  siempre a servicio (`openspec/specs/transitions-equipo-nuevo/spec.md:146-147`).
- **`transitions-st`**: RETIRADA de `capacidad` tras la fase de spec. El motor gana un tercer catálogo, pero
  ningún requisito vivo dice «dos flujos»: la fila 3 de RQ-TS-06 ya es genérica por flujo
  (`openspec/specs/transitions-st/spec.md:193`) y la nota de `:1164-1165` sigue siendo cierta. Sin delta.

## Supuestos (reversibles, regla de ejecución)

| # | Supuesto | Dónde se revierte |
|---|---|---|
| S-1 | Las 4 transiciones son de `Servicio Técnico` (mismo criterio que s2 del cambio 1) | Un dato por transición en el catálogo |
| S-2 | `Solicitud Soporte` clasifica `sin_clasificar` | `estados.ts:105` |
| S-3 | Campos: `comment()` y `derivacion()`, como el cambio 1 | Catálogo |
| S-4 | Modalidad: `remoto` / `en sitio`, por defecto `remoto`, fijada en el alta, sólo lectura después; en otra clasificación queda `NULL` y enviarla da `422` | Validador del alta y `CreateTicket.tsx` |
| S-5 | Sin transición de anulación: M1.5 tal cual | Catálogo (y C2 cuando llegue) |
| S-6 | SR heredados en `En Proceso`/`Pendiente`/`Finalizado` pasan a su flujo (criterio s5 del cambio 1); en cualquier otro estado siguen en servicio | `flujoDelTicket` |
| S-7 | Fila #1 de `ticket_transitions`: `enviar`/`Comercial`, sólo cambia `to_status` | `repo.ts:428-436` |
| S-8 | Ids nuevos y únicos entre catálogos (`Soporte pendiente` ≠ `marcar_pendiente`, `transitions.ts:206`) | Catálogo |
| S-9 | Heredados SR con `modalidad` `NULL`, sin relleno | Una migración aparte, si Gerencia la pide |
| S-10 | `Solicitud Soporte` cae en la columna genérica del tablero (*hipótesis*, se comprueba en diseño) | F1B-09 |

## Enfoque

El del cambio 1: catálogo separado + registro de flujos; inserciones al final o en la misma línea para
no desplazar citas (`transitions.ts` ~374, `estados.ts` ~254, `ticketService.ts` ~487 según
`exploration.md:47-54`). `ALTER TABLE tickets` sin calificar, correcto para `DESK_TABLES` (IV-6).

## Tareas de persona (no cuentan como tareas; archivar no las da por hechas)

| # | Qué | Dueño | Dónde queda |
|---|---|---|---|
| P.1 | Recuento de solo lectura: `SELECT status, count(*) FROM desk.tickets WHERE lower(trim(classification)) = 'soporte remoto' GROUP BY status;` — cuántos SR cambian de flujo por S-6 | Alfonso | `tasks.md` y parte |
| P.2 | En `ambientalia-desk.ambientalia.cloud`: alta SR nace en `Solicitud Soporte` con modalidad visible; sólo ve «Asignación»; bucle `Pendiente` ↔ `En Proceso` | Alfonso / Servicio Técnico | `tasks.md` |
| P.3 | Confirmar área de las 4 transiciones (S-1) | Gerencia / Servicio Técnico | `docs/sdd/ENTRADA.md` |

P.1 no bloquea: S-6 no toca datos, sólo cómo se leen.

## Tamaño y lotes (≤800)

| Lote | Contenido | Estimación |
|---|---|---|
| 1 · shared | catálogo, registro, estado, validador de modalidad, guardianes, pruebas, apply-progress | ~520 |
| 2 · servidor + BD + cliente | `ALTER`, `createTicket`, alta, mappers, barridos de ejecución/permisos, `CreateTicket.tsx`, ficha, barrido de citas, apply-progress | ~550 |

Aparte: spec + diseño + tareas ~900 (repartir en dos intentos); verify-report ~350 (sumando
obligatorio); archive ≈ 2× carpeta (~4.000) + fusión medida → pedirá techo de mantenedor, como el
precedente de 5.000 (`CLAUDE.md`, regla del ciclo 2).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| S-6 cambia en vuelo el grafo de SR ya en `Pendiente` (pierde salidas de servicio) | Media | P.1 antes de desplegar |
| La sincronización pisa `modalidad` | Baja | Fuera de `TICKET_COLS` + prueba |
| Área equivocada (S-1) | Media | Un dato; P.3 |

## Reversión

Revertir los commits; la columna `modalidad` es aditiva y nullable (se deja o se borra sin pérdida).

## Criterios de éxito

- [ ] Alta SR → `Solicitud Soporte`, fila #1 con ese `to_status`, modalidad guardada; modalidad inválida → `422`.
- [ ] SR sólo ve y ejecuta sus 4; `marcar_pendiente` sobre SR → `409`.
- [ ] `flujos.test.ts:42-45` invertida; `sinSalida` de la unión = `['Finalizado']`.
- [ ] Barrido de citas al cierre: 0 rotas nuevas.

## Proposal question round (modo `auto`: no se pregunta; queda para revisión)

1. ¿Las cuatro transiciones son de Servicio Técnico, o alguna de Comercial?
2. ¿Un SR en `Pendiente` de hoy debe perder las salidas de servicio (S-6)?
3. ¿La modalidad puede corregirse después del alta?
