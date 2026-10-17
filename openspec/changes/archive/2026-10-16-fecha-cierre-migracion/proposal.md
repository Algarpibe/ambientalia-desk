---
tanda: F1F-01
motivo: ""
capacidad: [tickets-core, zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: fecha de cierre de «Entregado» en la migración, con marca de origen

`cierra: no` — F1F-01 sigue pendiente del suplente del 12/12 (`DEPLOY.md:693`, «no nombra al suplente») y de la
pasada en seco en producción (E-211, `openspec/config.yaml:4761-4763`), que son tareas de personas.

## Intención

Gerencia decidió (`decision/migracion-e207-e212`, `openspec/config.yaml:4737-4770`; consecuencia (1) en `:4747-4751`):
«"Entregado" → "Finalizado", cerrado con la fecha de cierre de Zoho o, si no tiene, la de la migración marcada como tal».

Hueco actual, medido:
- La conversión existe: `packages/shared/src/migracionTickets.ts:36` (destino `Finalizado`, regla `entregado-a-finalizado`, `statusTypeDestino: 'Closed'`).
- El ejecutor escribe marcador (`apps/desk/server/db/migracionTicketsAbiertos.ts:73-82`) y `UPDATE` (`:84-89`) sin `closed_time`; un `grep closed_time` en ese fichero y en `migracionTickets.ts` da 0.
- La spec lo fija hoy al revés: `openspec/specs/tickets-core/spec.md:2111` en `164d322` («`closed_time` no se toca», supuesto S-2 de aquel cambio) y `openspec/specs/zoho-sync/spec.md:851` en `164d322`, `:915`, `:935`, `:1040`, `:1081-1083`. La decisión de Gerencia sustituye ese supuesto.

Resultado: un «Entregado» migrado queda `Closed` con `closed_time` NULL.

## Alcance

### Dentro
1. **Regla pura** al final de `packages/shared/src/migracionTickets.ts` (regla 13; al final para no desplazar líneas citadas): p. ej. `cierreDeMigracion(equivalencia, closedTimeZoho, instanteMigracion) → { closedTime, origen: 'zoho' | 'migracion' } | null` (`null` si `statusTypeDestino !== 'Closed'`).
2. **Ejecutor**: leer `closed_time`, aplicar la regla, escribirlo en el `UPDATE` sólo cuando la regla cierra, y dejar en `values` del marcador `cierre_origen` y `closed_time_previo`. Sin columna nueva, sin `ALTER`, sin variable en `DEPLOY.md`.
3. **Informe en seco**: cuántos cierres llevan fecha de Zoho y cuántos la de la migración, para que Gerencia lo vea antes de aplicar.
4. **Reversión SQL** (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:58-92`, RQ-ZS-18 en `openspec/specs/zoho-sync/spec.md:1023` en `164d322`): restaurar `closed_time` desde `closed_time_previo` en la regla `entregado-a-finalizado`; el comentario de `:65` («No toca closed_time») se corrige.
5. **Pruebas que se invierten**: `apps/desk/server/db/migracionTicketsF1F01.test.ts:93` y `:188-191` (la reversión ya no deja `closed_time` intacto) y `apps/desk/server/db/migracionTicketsAbiertos.test.ts:85` (el ejecutor ya no conserva `closed_time` en el «Entregado»). Esta última no estaba en la medición de partida.

### Fuera
- Corregir los lectores de `closed_time` en Análisis y en la ficha de cliente (hallazgo H-1).
- Marca visible en la interfaz; columna nueva de origen.
- El resto de F1F-01 (suplente, pasada en seco real, estados sin equivalencia).

## Capacidades

### Nuevas
- Ninguna.

### Modificadas
- `tickets-core`: RQ-TC-40, regla 2 (`spec.md:2111`) y su escenario (`:2149`): «Entregado» cierra con fecha de Zoho o de la migración, marcada.
- `zoho-sync`: RQ-ZS-17 (ejecutor e informe, `spec.md:851`, `:915`, `:935`) y RQ-ZS-18 (reversión, `:1040`, `:1081-1083`).

## Enfoque

Regla en `shared`, ejecutor que la consume, marca en el JSON del marcador ya existente. Precedencia: `closed_time` de Zoho no nulo gana; si es nulo, el instante de la migración con `cierre_origen: 'migracion'`.

## Supuestos reversibles

- **S-1** «La fecha de la migración» = el instante de la ejecución con `aplicar=true`, uno por ejecución e igual para todos los tickets. Alternativa: el `corte`.
- **S-2** «Marcada como tal» = `cierre_origen` en `values` del marcador; no hay marca visible.
- **S-3** Rama Zoho: el `closed_time` existente se conserva tal cual, con `cierre_origen: 'zoho'`.
- **S-4** Sólo la regla que cierra (`statusTypeDestino === 'Closed'`) toca `closed_time`; las demás, no.
- **S-5** Cómo llega `closed_time` al ejecutor sin desplazar líneas citadas de `migracionTickets.ts:41-49` lo decide el diseño; si desplaza, barrido de la regla de mutación 4.

**Hipótesis** (no medible desde el repositorio, sin acceso a producción): la lectura filtra abiertos (`migracionTicketsAbiertos.ts:33`), así que un «Entregado» con `closed_time` no nulo sería un reabierto; la rama Zoho será rara. La pasada en seco (punto 3) lo cuenta.

## Hallazgo H-1 — sin corregir aquí

Dos lectores de `closed_time`: `apps/desk/server/analisis.ts:26` en `73bd52f` (`fecha_finalizacion_st ?? closed_time`, que alimenta finalizados y días en `packages/shared/src/analisis.ts:59-63`) y la ficha de cliente (`apps/desk/server/db/directory.ts:28` → `apps/desk/src/components/ClienteDetalle.tsx:124-126` en `73bd52f`). Hoy un migrado sin fecha no cuenta; tras el cambio contará como cerrado el día de la migración, salvo que tenga `fecha_finalizacion_st` (hipótesis: no se sabe cuántos la tienen). `apps/desk/server/indicadores.ts:16` lee `fecha_finalizacion_st`: sin efecto. **Pregunta abierta para Gerencia:** ¿se excluyen de Análisis y de la ficha las fechas con `cierre_origen: 'migracion'`?

## Reglas de mutación para apply

1. No se añade guarda: la de posición no aplica. Sí se muta la **precedencia** Zoho/migración y debe ponerse rojo.
2. La prueba de la reversión vigila un `.sql`: quitar la restauración de `closed_time` del fichero y ver rojo.
3. Sin cambios en `apps/desk/src`.
4. `migracionTicketsAbiertos.ts` está citado (`openspec/config.yaml:4749`, `:4759`; specs): el cierre barre sus citas y las de `migracionTickets.ts`.

## Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/shared/src/migracionTickets.ts` | Modificado (función al final) |
| `apps/desk/server/db/migracionTicketsAbiertos.ts` | Modificado |
| `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` | Modificado (reversión) |
| `apps/desk/server/db/*.test.ts`, `packages/shared/src/migracionTickets.test.ts` | Modificado |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Análisis cuenta cierres con fecha de migración (H-1) | Media | Pregunta a Gerencia; la marca permite filtrarlos después |
| Barrido de citas incompleto | Media | Regla de mutación 4 en el cierre |
| SQL de reversión probado sólo en pg-mem | Baja | Ya declarado en el `.sql:68`; la persona lee el `SELECT` previo |

## Reversión del cambio

`git revert` del cambio; la migración aún no se ha aplicado en producción (E-211 pendiente), así que no hay datos que deshacer. Si ya se aplicó, la reversión SQL restaura `closed_time_previo`.

## Criterios de éxito

- [ ] Un «Entregado» sin `closed_time` queda con el instante de la migración y `cierre_origen: 'migracion'`; con `closed_time`, lo conserva y `cierre_origen: 'zoho'`.
- [ ] El informe en seco cuenta las dos ramas.
- [ ] La reversión deja `closed_time` como estaba; mutar el `.sql` la pone roja.
- [ ] Las otras tres reglas no tocan `closed_time`.

## Presupuesto estimado (techo 800, válvula 720 por intento)

| Fase | Líneas |
|---|---|
| Propuesta | ~130 |
| Spec (dos deltas) | ~150 |
| Diseño + tareas | ~200 |
| Apply (código + pruebas + `.sql`) | ~150-220 |
| Verify (informe) | ~250-350 |
| Archive (informe + fusión, medida) | ~150 + fusión; la mudanza no cuenta (E-150) |

## Ronda de preguntas

`execution_mode: auto` (`openspec/config.yaml:22-30`): no se para. Supuestos S-1 a S-5 a la lista semanal (E-237). Única pregunta que sube: H-1.
