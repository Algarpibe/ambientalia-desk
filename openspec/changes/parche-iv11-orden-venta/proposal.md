---
tanda: F1B-11
motivo: ""
capacidad: [zoho-sync, remisiones, derivacion-avisos]
maestro: []
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: parche de IV-11 — la orden de venta elegida en la aplicación no la pisa el sincronizador

Cambio **1 de 3** de F1B-11, secuenciales y uno por árbol (regla del ciclo 2).

## Intención

`upsertTicket` reescribe `orden_venta` y `fecha_orden_venta` en cada pasada (`packages/zoho-sync/src/db/repo.ts:44-54`,
`:62`) y sólo se abstiene con `managed_by_app === true` (`:58-59`); `salesorder_id` sobrevive porque está fuera de
`TICKET_COLS` (`packages/zoho-sync/src/db/schema.sql:187`). La fila acaba diciendo dos cosas. Gerencia eligió la
opción (c): si la OV se eligió en la aplicación manda la aplicación, si no manda Zoho (`openspec/config.yaml:1651-1659`),
con parche previo `tanda: F1B-11, cierra: no` (`:2097-2098`) y aviso a Comercial en vez de silencio (`:2114-2115`).

**Dónde muerde hoy, medido.** De los tres escritores de la OV en la aplicación, dos ya sacan el ticket del sync:
el alta inserta `managed_by_app = true` (`repo.ts:385-386` en `17ddfec`) y la transición `habilitar_servicio`
(`packages/shared/src/transitions.ts:189`) pasa por `writeTransition`, que lo pone (`repo.ts:271` en `17ddfec`). **El único camino
vivo es la remisión de entrada** (`apps/desk/server/routes/remision.ts:235-239` en `17ddfec`), que no toca la bandera.

## Alcance

**Dentro**
- Marca por fila «OV elegida en la aplicación» y columna anti-ruido, fuera de `TICKET_COLS`.
- `upsertTicket`: con la marca puesta, NO actualiza las dos columnas; el resto del ticket sigue sincronizando.
- Discrepancia → un aviso por ticket a Comercial (qué OV trae Zoho y cuál tiene la aplicación) con
  `crearAviso`/`destinatariosDeArea` (`apps/desk/server/db/avisos.ts:8-18`, `:74-93`); se reavisa sólo si cambia
  el valor de Zoho.

**Fuera**
- **Cambio 2:** asociación OV↔ticket 1:N propia de la app y subOV de lote (`decision/subov-lote-convencion`): todo el
  contenido de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:165`. **Cambio 3:** registro de contrato y
  prioridad (`decision/anexo-53-contratos`), que cierra la fila (`cierra: si`). Este cambio no cubre nada de la fila
  :165; cubre lo que la R01.2 le añadió (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md:64`).
- Relleno de filas existentes (datos de producción), espejo de Zoho, correo del aviso.

**Nota de alcance para los cambios 2 y 3, escrita ahora.** La tabla de asociación propia no contradice «sin tabla
puente»; el texto de la decisión dice (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:124-126`):
> «La subOV de lote era la única variante que hacía que una OV apuntara a varios tickets. Resuelta ésa, sólo queda que
> un ticket tenga varias OV: eso es 1:N desde el ticket, no N:M.»

## Capacidades

**Nuevas:** ninguna.
**Modificadas:**
- `zoho-sync`: RQ-ZS-01 gana una excepción por columnas — con la marca, `orden_venta` y `fecha_orden_venta` no se pisan.
- `remisiones`: RQ-RE-16 deja de llamar a IV-11 «fuera de alcance» (`openspec/specs/remisiones/spec.md:376-378`); el
  `UPDATE` pone la marca.
- `derivacion-avisos`: nueva clase de aviso — discrepancia de OV desde el sync, con regla anti-ruido.

## Enfoque

**La marca.** No existe con grano de fila (`openspec/config.yaml:1665-1669`).

| Candidata | Veredicto |
|---|---|
| `managed_by_app` | Descartada: es la opción (a) |
| `salesorder_id` no nulo | Hipótesis sin medir (37 usos); no la pone quien teclea el número |
| **`ov_elegida_en_app_at timestamptz` nullable** | **Recomendada**, supuesto reversible: explícita, fechada, fuera de `TICKET_COLS` |
| `orden_venta_origen text` | Equivalente, menos información |

La ponen los **tres** escritores (alta, `writeTransition` si `plan.columns.orden_venta`, remisión), para que la marca
diga la verdad aunque hoy sólo la remisión la necesite. `apps/desk/server/db/backfillFechaOrdenVenta.ts:51` sólo
rellena la fecha: no marca. Anti-ruido: `ov_zoho_avisada text`. Esquema: `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS`
**sin calificar** (tabla de `DESK_TABLES`); ningún `CREATE` nuevo.

**Filas existentes:** sin relleno. Siguen como hoy —manda Zoho— hasta que un escritor vuelva a elegir su OV.

**El aviso sale del proceso de la app, no del paquete.** `createSync` (`packages/zoho-sync/src/sync.ts:62`) recibe una
devolución opcional que sólo cablea `apps/desk/server/index.ts:20` en `17ddfec`; el worker del hub no la pasa. Mismo motivo que
`apps/desk/server/services/ticketService.ts:157-164`: `avisos` no es del paquete de sincronización.

**Regla 13.** Ninguna decisión nueva en cliente. La OV en gris del formulario la impone
`apps/desk/server/routes/remision.ts:237` en `17ddfec`.

## Áreas afectadas

| Área | Cambio |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` | Dos `ALTER` |
| `packages/zoho-sync/src/db/repo.ts` | `upsertTicket`, `createTicket`, `writeTransition` |
| `packages/zoho-sync/src/sync.ts` · `apps/desk/server/index.ts` | Devolución de discrepancia |
| `apps/desk/server/routes/remision.ts` | Marca en el `UPDATE` |
| `apps/desk/server/services/` | Servicio nuevo del aviso |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Insertar líneas en `repo.ts`/`remision.ts` desfasa citas (`:271`, `:330-347`, `:218-240`) | Alta | Barrido de la regla de mutación 4 en el cierre |
| Aviso cada 3 min (`packages/zoho-sync/src/config.ts:88`) | Media | `ov_zoho_avisada` + prueba de dos pasadas |
| Filas previas siguen expuestas | Media | Declarado; relleno = decisión de persona |

## Rollback

Revertir el commit. Las columnas nuevas son nullable y el sync no las lee sin el código: pueden quedarse.

## Dependencias

Ninguna técnica. **Tarea de persona** (regla del ciclo 1, fuera del recuento): Alfonso ejecuta
`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) y devuelve la salida; alimenta al cambio 2.

## Criterios de éxito

- [ ] Con marca, una pasada con otra OV no cambia `orden_venta` ni `fecha_orden_venta` y sí el resto.
- [ ] Sin marca, Zoho sigue mandando (prueba actual en verde).
- [ ] Discrepancia → un aviso a Comercial; segunda pasada igual → cero; valor Zoho nuevo → uno más.
- [ ] Zoho vacío no avisa (supuesto S-2). Guardián de `ALTER` de `migrate.test.ts` en verde.

## Cierre esperado

- **IV-11 → REDUCIDO, no cerrado**, en `CLAUDE.md` y `openspec/config.yaml` (IV-11): protegido lo marcado desde hoy;
  quedan las filas previas y la cura de raíz (cambio 2).
- `toca_maestro: si`. `docs/sdd/R08.3_Expediente_de_cambios.md:514` aún dice que la discrepancia se enseña en el
  espejo, y `e005c` no tiene fila en §11.2 aunque su `registro` lo afirma (`openspec/config.yaml:2122`): añadirla.
- `maestro: []`: las dos decisiones dicen «sin punto del Anexo D asignado» (`openspec/config.yaml:2106`, `:2123`).

## Supuestos reversibles (modo `auto`)

- **S-1** Marca `ov_elegida_en_app_at`, puesta por los tres escritores; sin relleno.
- **S-2** Zoho vacío no es discrepancia: sin write-back es el caso normal (`openspec/config.yaml:1124-1126`).
- **S-3** Aviso sólo en la bandeja; `enviado_at` queda NULL. Destinatarios: `destinatariosDeArea('Comercial')`, con
  administradores.

## Previsión de tamaño

Código ~140 + pruebas ~210 = **~350** (`--no-renames`). **Un apply ≤ 800 basta.** Verify-report y archive-report
van aparte, y el archive supera 800 por el `git mv` (regla del ciclo 2).
