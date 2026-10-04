# Exploración — `propagar-top5-lista-remision-creada` (F1B-07, `cierra: no`)

Volcado de la exploración guardada en Engram (`sdd/propagar-top5-lista-remision-creada/explore`, obs. 1344), que
no pudo escribirse a fichero en su fase. **Todas las citas de abajo se han vuelto a comprobar contra el árbol del
worktree (rama nacida de `main` en `2a74fdc`) el 2026-10-04**; lo que la comprobación corrigió va marcado como
«corregido». Lo que no se pudo comprobar lleva la palabra «hipótesis».

## 1 · Qué se pide

`decision/cola-del-taller-los-tres-cabos`, `respuesta_textual` (`openspec/config.yaml:3387-3388`):

> «(3) Se cambia. Al marcar un cliente como Top 5, sus tickets abiertos toman la nueva prioridad, cada uno con su
> traza; al desmarcarlo, vuelven a la prioridad calculada. En ningún caso se tocan los tickets con un ajuste manual
> con motivo, que mantienen el suyo.
> (4) Se construye. La lista de equipos en «Remisión creada» para Comercial se ordena por el tiempo transcurrido
> desde que el ticket entró en ese estado, que es el mismo reloj de la alarma de 3 días hábiles. Va antes del corte
> del 14/12.»

Fila del plan: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`, `:174` y `:213`.

## 2 · Estado actual, pieza (3)

| Hecho | Dónde |
|---|---|
| Tabla del Top 5 por cliente | `packages/zoho-sync/src/db/schema.sql:606-612` (`public.cliente_prioridad`) |
| Traza de ajustes por ticket: `de` admite NULL, `a` es `NOT NULL`, `motivo` `NOT NULL` y no vacío; **no hay columna de origen**, todas las filas de hoy son manuales | `schema.sql:613-622` |
| El `PUT` del cliente sólo escribe la fila del cliente | `apps/desk/server/routes/prioridad.ts:34-45` → `fijarPrioridadCliente`, `apps/desk/server/db/prioridadCliente.ts:57-65` (ninguna consulta toca `tickets`) |
| La prioridad sólo se calcula al nacer | `apps/desk/server/services/ticketService.ts:106` → `prioridadAlNacer`, `packages/shared/src/contratos.ts:66-69` (corregido: el fichero es el de `shared`) |
| «La más alta de las dos» y el orden `Urgent > High > Medium > Low` | `packages/shared/src/prioridad.ts:22-28` |
| El ajuste manual: `UPDATE` de `priority` + `managed_by_app = true` + fila de traza, en una transacción | `prioridadCliente.ts:91-96` |
| «Abierto» en el servidor = `status_type <> 'Closed' OR status_type IS NULL` | `packages/zoho-sync/src/db/repo.ts:151`. Ojo: la vista «abiertos» del cliente (`apps/desk/src/lib/boardView.ts:47`) excluye además las esperas y **no** es esta noción |
| Una transición también puede escribir `priority`, sin traza en `prioridad_ajustes` | `repo.ts:300`; guarda del técnico en `packages/shared/src/prioridad.ts:81-86`, aplicada en `ticketService.ts:131` |
| Pruebas que fijan lo contrario de la decisión | `apps/desk/server/prioridadTop5.test.ts:179-194` (TC24-14 y TC24-15). Las homónimas de `apps/desk/server/services/ticketService.test.ts:1154` y `:1160` son del **alta** y siguen ciertas |
| Requisito vivo a reescribir | `openspec/specs/tickets-core/spec.md:856-872` en `27379a0` (RQ-TC-24; el «sólo al nacer» está en `:870-871`) y los escenarios S-1 y S-9 de `:953-965` |

### Hallazgo clave (D-1)

`priority` está en `TICKET_COLS` (`repo.ts:45`) y `upsertTicket` sólo se abstiene con `managed_by_app === true`
(`repo.ts:71`). Un ticket venido de Zoho al que la propagación le cambie la prioridad la pierde en la pasada
siguiente del sincronizador. El molde para proteger columnas sueltas ya existe: `ov_elegida_en_app_at`
(`repo.ts:73-78`), que saca `orden_venta` y `fecha_orden_venta` de la lista de columnas.

Salidas: (A) marcar `managed_by_app` en cada ticket tocado; (B) propagar sólo a los ya gestionados por la app;
(C) marca por fila sólo para la prioridad. La propuesta decide.

## 3 · Estado actual, pieza (4)

| Hecho | Dónde |
|---|---|
| El reloj de la alarma: última entrada del ticket a su estado actual, una consulta para todos | `apps/desk/server/db/sla.ts:78-102` (`entradasActuales`) |
| Umbral de «Remisión creada»: 27 h hábiles | `packages/shared/src/sla.ts:34` (corregido: la cifra vive en `shared`, no en `db/sla.ts`) |
| La alarma sólo mide los que **no** tienen orden de venta | `packages/shared/src/sla.ts:139` (`soloSinOrdenVenta`), aplicada en `db/sla.ts:57` |
| Un ticket sin fila en `ticket_transitions` no se puede medir | `db/sla.ts:28-32` |
| Catálogo de vistas y `case` obligatorio | `apps/desk/src/lib/boardView.ts:7-16`, `:38-56`, `:59`; `openspec/specs/vistas-tablero/spec.md:91-109` (RQ-VT-03, que nombra «seis claves» en `:99`) |
| Molde de vista servida y ordenada por el servidor | `GET /api/mis-tickets`, `routes/prioridad.ts:83-86`; cliente en `apps/desk/src/App.tsx:69` |
| La lectura no se segmenta por área | comentario de `boardView.ts:33-36` |
| La acción «Habilitar Servicio» ya la guarda el servidor | `packages/shared/src/transitions.ts:178` (área Comercial); `ticketService.ts:126-131` (estado y área) |

## 4 · Fuera, y por qué `cierra: no`

La pregunta 3.b (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`: calificación del cliente sin contrato ni
Top 5, y quién ajusta a mano fuera de los Top 5) sigue abierta. No bloquea ninguna de las dos piezas.

## 5 · Recomendación de la exploración

Un cambio, un solo `tanda:` (R-4), partido en lotes: las dos piezas juntas pasan de 800 líneas. La estimación por
lote se rehace en la propuesta.
