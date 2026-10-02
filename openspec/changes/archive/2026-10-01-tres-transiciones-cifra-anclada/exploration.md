# Exploración — tres-transiciones-cifra-anclada (F1C-09)

Medido el 2026-10-01 sobre el árbol del worktree `tres-transiciones-cifra-anclada` (rama del mismo nombre).
CodeGraph no está indexado en este worktree: exploración con Read/Grep.

## 1. Las cuatro entradas del catálogo

| Qué | Dónde | Hoy | Tras F1C-09 |
|---|---|---|---|
| «Marcar como pendiente» | `packages/shared/src/transitions.ts:206-207` | En Proceso → Pendiente, Servicio Técnico | retirada |
| «Servicio externo» desde Pendiente | `packages/shared/src/transitions.ts:230-231` | Pendiente → Por Facturar | retirada |
| «Servicio externo» desde Notificado | `packages/shared/src/transitions.ts:232-233` | Notificado → Por Facturar | retirada |
| «Diagnóstico complementario» | `packages/shared/src/transitions.ts:244-245` | `from: ['Pendiente']` → Continuación del proceso | `from: ['En Proceso']` |

Las tres retiradas son de área simple `Servicio Técnico` y ninguna declara campo de fecha: no tocan
el emparejamiento de las ocho compartidas (`invariantesGrafo.test.ts:91-106`) ni los diez campos
reentrantes (`invariantesGrafo.test.ts:137-150`).

Comentarios con recuento en el mismo fichero: `transitions.ts:167` («2–35»), `:269` («las otras 32»),
`:272` («35 declaraciones»), `:289-290` y `:293` («34 entradas», «35.ª»), `:386` (cita `:206`).

## 2. «Pendiente» después del cambio

- En el catálogo de servicio se queda **sin entrada y sin salida**: su única entrada era `:206` y sus
  dos salidas, `:230` y `:244`. Deja de ser un estado derivado de `TRANSITIONS`.
- **Sigue vivo en soporte remoto**: `soporte_pendiente` y `continuacion_soporte`
  (`transitions.ts:393-396`). Por eso NO sale de `CLASIFICACION_EN_ESPERA` (`estados.ts:105`) y
  `ESTADOS` sigue en 23.
- Consecuencia obligada: pasa a `ESTADOS_SOLO_SOPORTE_REMOTO` (`estados.ts:182`), y `ESTADOS_SERVICIO`
  (`estados.ts:188-190`) baja de **21 a 20**. Lo exige el invariante 1 (`invariantesGrafo.test.ts:35-42`,
  declarados == derivados). El maestro ya lo dice: «20 · Estados … Pendiente deja de usarse aquí y
  solo existe en soporte remoto» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1253-1254`).
- `FASE_POR_ESTADO` (`packages/shared/src/fasesBlueprint.ts:57`) pierde `'Pendiente'`: la guarda
  `satisfies Record<EstadoServicio, FaseId>` (`:29`) lo rechazaría como propiedad de más. Reparto de
  fases 4·12·5 → 4·11·5 (`fasesBlueprint.test.ts:17`).
- Invariante 3, «Finalizado es el único sin salida» (`invariantesGrafo.test.ts:62-66`): se mantiene.
  Notificado conserva tres salidas; Pendiente deja de contar en servicio. En la unión (`:177-181`)
  Pendiente sigue saliendo por `continuacion_soporte`.
- Estados sin entrada en la unión (`invariantesGrafo.test.ts:272-276`): no cambia, Pendiente entra por
  `soporte_pendiente`.
- `ESTADOS_SIN_SALIDA` (`estados.ts:151-160`) y `ESTADOS_EN_ESPERA` (`estados.ts:120-123`): no cambian.
- Columna del tablero `pendiente` (`packages/shared/src/columns.ts:27`): se queda, la usa soporte remoto.
- Reloj del SLA: `sla.ts` sólo nombra «Pendiente» en un comentario (`packages/shared/src/sla.ts:15`).
  Hipótesis: no hay lista del reloj que lo contenga hoy, así que R08.4.md:1626 («sale también de la
  lista del reloj») no exige código en esta tanda. Lo confirma el diseño.

## 3. Guardianes que fijan 34 / 38 / 21 (todos cambian en el mismo commit)

| Fichero | Líneas | Hoy → tras F1C-09 |
|---|---|---|
| `packages/shared/src/invariantesGrafo.test.ts` | `:45`, `:50-54` | 34/21 → 31/20 |
| | `:172-175` | unión 44 → 41 |
| | `:233-238` | solo-SR `['Solicitud Soporte']` → incluye `Pendiente` |
| `packages/shared/src/mapaBlueprint.test.ts` | `:46-52` | 38 aristas → 35 |
| | `:65-71` | la guarda D-1 usa `Pendiente` como estado a quitar: hay que elegir otro estado de servicio |
| | `:111` | «21 estados» → 20 |
| `packages/shared/src/mapaBlueprint.ts` | `:139` | comentario 21/38 → 20/35 |
| `packages/shared/src/fasesBlueprint.test.ts` | `:17`, `:28-30` | 4·12·5 → 4·11·5; la prueba de Pendiente desaparece o se invierte |
| `packages/shared/src/reentrancia.test.ts` | `:29-34`, `:54-57` | C2 «nueve estados» → ocho (sale Pendiente) |
| `packages/shared/src/prioridad.test.ts` | `:92`, `:104-105`, `:118-119` | mapa por id de las 34 → 31 |
| `packages/shared/src/cargos.test.ts` | `:112`, `:204` | 5×10×(34+3)=1.850 → 5×10×(31+3)=1.700 |
| `packages/shared/src/fechasDerivadas.test.ts` | `:82` | «31 restantes» → 28 |
| `packages/shared/src/transitionsSoporteRemoto.test.ts` | `:57`, `:61-63` | 34+6+4 → 31+6+4; el caso (e) usa `marcar_pendiente` |
| `packages/shared/src/flujos.test.ts` | `:189-193` | usa `marcar_pendiente` como transición de servicio sobre un SR |
| `apps/desk/server/permisos.test.ts` | `:43`, `:72`, `:89`, `:368` | 34×3=102 (60/42) → 31×3=93 (54/39); 816 → 744 |
| `apps/desk/server/cargoPermiso.test.ts` | `:250` | «102 celdas (34×3)» → 93 (31×3) |
| `apps/desk/server/transicionesEjecucion.test.ts` | `:117`, `:165`, `:175-176`, `:182`, `:188`, `:250`, `:283` | 34/36 ejecuciones → 31/33; `diagnostico_complementario` desde En Proceso |
| `apps/desk/server/flujoSoporteRemoto.test.ts` | `:73-76`, `:112` | P5 usa `marcar_pendiente`; 44 → 41 |
| `docs/artefactos/blueprint-*.md` (4) | — | se regeneran con `scripts/generar-mapa-blueprint.ts`; los vigila `mapaBlueprint.test.ts:154-159` |

Comentarios con «34» que no son aserción (regla de mutación 4, se barren): `estados.ts:4`,
`permisos.test.ts:11`, `:24`, `transicionesEjecucion.test.ts:106-133`, `appHarness.ts:61`,
`ticketService.test.ts:12`, `bodegaje.ts:28`, `bodegaje.test.ts:38`, `sla.ts:14`, `sla.test.ts:22`,
`valoresDeTransicion.ts:10`, `fechasDerivadas.ts:89`.

## 4. Registro y specs

- `openspec/config.yaml:1360-1370` (`pasos_del_mapa` 38, `transiciones` 34); `:1371-1383` (`estados` 21);
  `:1342-1345` y `:1356-1359` (`esperas`, menciona Pendiente entre los 21); `:110` (`capabilities` →
  `transitions-st`, «Las 34 transiciones y 21 estados»).
- `npm run reconcile`, comprobación 5, sólo lee código para `esperas`
  (`apps/desk/server/reconciliacion/comprobaciones.ts:343-348`): `transiciones` y `estados` se
  imprimen como «maestro N · sin lectura de código». La cifra 31/35 la imponen las pruebas, no el barrido.
- Specs con requisitos que nombran 34/38/21 o las ids retiradas: `transitions-st/spec.md:43`, `:61`,
  `:156`, `:249-254`, `:363`, `:372`; `mapa-blueprint/spec.md:50-63`; `permissions/spec.md:62`, `:73`;
  `derivacion-avisos/spec.md:55-63`, `:79`, `:582-583`; `transitions-soporte-remoto/spec.md:197`,
  `:217`, `:224-225` (`marcar_pendiente` como ejemplo de id de servicio).

## 5. Datos de producción

- `desk.ticket_transitions` (`packages/zoho-sync/src/db/schema.sql:57-61`): `transition_id`,
  `transition_name`, `from_status`, `to_status`, `area`, `performed_by`, `values`, `performed_at`.
  El historial no se reescribe: las filas con `marcar_pendiente`, `servicio_externo_*` o
  `diagnostico_complementario` desde Pendiente se quedan como están.
- **El sincronizador pisa `status` de los tickets que gobierna Zoho**: `upsertTicket` sólo se abstiene
  con `managed_by_app === true` (`packages/zoho-sync/src/db/repo.ts:71`), y corre cada 180.000 ms
  (`packages/zoho-sync/src/config.ts:88`). Un `UPDATE` sobre un ticket con `managed_by_app = false`
  volvería a «Pendiente» en la siguiente pasada.
- Flujo de un ticket: soporte remoto sólo si la clasificación normalizada es «Soporte remoto» y el
  estado es de su catálogo (`packages/shared/src/flujos.ts:56-60`); todo lo demás es servicio.
- Patrón de script de producción: `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:1-27`
  (cabecera con quién lo ejecuta, recuentos previos, esquema calificado, idempotencia declarada).
