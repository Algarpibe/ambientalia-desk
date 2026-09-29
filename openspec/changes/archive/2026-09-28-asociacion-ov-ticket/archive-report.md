# Informe de archivo: asociacion-ov-ticket (F1B-11)

**Fecha de cierre**: 2026-09-28
**Cambio**: `asociacion-ov-ticket`
**Fila**: F1B-11, clasificada como **cierra: no** (cambio 2 de 3, secuenciales y uno por árbol; `proposal.md:49`)

## Alcance cubierto (R-1 reconciliación)

**`tanda: F1B-11`, `cierra: no`. Cubre el cambio 2 de 3 de F1B-11 —asociación OV↔ticket 1:N propia (`public.ov_asociaciones`), tercera vía en las tres puertas, subOV de lote con cuarentena en el escalón C, liberación con motivo sólo para Comercial y con la limpieza de columnas de S-7, y saldo por lote con `consumido`— y deja al cambio 3 el registro de contrato, la prioridad por contrato y el «% ejecutado» de `decision/anexo-53-contratos` (ejecutada = subOV con ticket finalizado), que es el que cierra la fila.**

Lo que construye, por requisito (citas contra el árbol de este archivo):

- **RQ-TC-17 (nuevo)** — tabla propia `public.ov_asociaciones` (`packages/zoho-sync/src/db/schema.sql:539`) con dos índices únicos parciales
  `WHERE liberada_at IS NULL` (`:552-553`); nunca se borra. Los tres escritores la escriben en la misma transacción que su columna: alta
  (`apps/desk/server/services/equipoNuevo.ts`), transición (`packages/zoho-sync/src/db/repo.ts:311`) y remisión de entrada
  (`apps/desk/server/routes/remision.ts:239-243`, dentro de `enTransaccion`). El `23505` de una carrera sale como `409`
  (`OvYaAsociadaError`, `packages/zoho-sync/src/db/ovAsociaciones.ts:49`; `apps/desk/server/app.ts:79`).
- **RQ-TC-08, RQ-TS-14, RQ-RE-16 (modificados)** — la tercera vía (asociación vigente) en las tres puertas, vía `ticketConOrdenVenta`;
  las pruebas de posición previas, incluida `apps/desk/server/remisiones.test.ts:988`, sin tocar.
- **RQ-TC-18 (nuevo)** — clasificador de subOV (`packages/shared/src/subOV.ts:32`): sufijo = resto que empieza por un no-dígito tras la base
  `OV(I)-AAAA-NNN…` (S-2 literal); la cuarentena es escalón **C** y precede a la unicidad (**D**) en alta (`ticketService.ts:96`),
  transición (`:134` antes de `:148-152`) y remisión (`remision.ts:220`).
- **RQ-TC-19 (nuevo)** — liberar exige área Comercial en el servidor (`apps/desk/server/routes/ovAsociaciones.ts:47`), `409` si ya liberada
  (`:48`) y motivo (`:51`); conserva la fila y, en la misma transacción (`:53`), pone a NULL `orden_venta`, `salesorder_id` y
  `fecha_orden_venta` del ticket sólo si contienen esa OV, con `ov_elegida_en_app_at` (`ovAsociaciones.ts:99`, `:114`).
- **RQ-TC-20 (nuevo)** — ficha del ticket con asociaciones vigentes y liberadas (`GET /api/tickets/:id/ov-asociaciones`).
- **RQ-TS-18 (nuevo) y RQ-TS-09 (modificado)** — `Aprobación` y `Aprobación y S. Repuestos` añaden una OV (`ovAdicional`) sin tocar la de
  entrada; la fecha de OC vive en la asociación (S-5), y en `aprobacion` sigue además en `fecha_orden_compra_final`, como hoy.
- **RQ-ZS-14 (nuevo)** — `soloLibres` excluye asociaciones vigentes y cuarentena (`packages/zoho-sync/src/books/repo.ts:159-162`, `:176`);
  saldo por lote (`packages/zoho-sync/src/books/subOV.ts:34`) con `consumido = consumidas / creadas` y cuarentena aparte (`:25`).

## Especificaciones sincronizadas

La fusión casa por ID de requisito; una MODIFIED reemplaza el bloque vivo y conserva su título (sin el prefijo `Requirement: `, como
`0338be6`). Las ADDED van al final de la última sección de requisitos, antes de «Comportamiento actual, a corregir». Las secciones «Fuera
de alcance de este delta» no se fusionan. Medida con `git diff --cached --numstat --no-renames`, igual a la medida previa en un worktree
descartado:

| Spec viva | Operaciones | +/− |
|---|---|---|
| `openspec/specs/tickets-core/spec.md` | RQ-TC-08 MODIFIED; RQ-TC-17 a RQ-TC-20 ADDED | +138 / −10 |
| `openspec/specs/transitions-st/spec.md` | RQ-TS-14 y RQ-TS-09 MODIFIED; RQ-TS-18 ADDED | +66 / −8 |
| `openspec/specs/remisiones/spec.md` | RQ-RE-16 MODIFIED | +39 / −24 |
| `openspec/specs/zoho-sync/spec.md` | RQ-ZS-14 ADDED | +31 / −0 |
| **Total** | sin REMOVED | **+274 / −42** |

RQ-TS-09 conserva la nota «F1A-04: 28 de 40» (`openspec/specs/transitions-st/spec.md:307-309`).

**Barrido de citas que desplaza la fusión (regla de mutación 4):**

| Spec | Citas completas fuera del archivo | Desplazadas | Caso | Reparación |
|---|---|---|---|---|
| `transitions-st` | `:30`, `:78-79` (antes de la primera inserción); `:327` en `ENTRADA.md:344`; `:774-779` y `:782-784` en `hojas-vida/spec.md:185`, `:190` | 3 | 2 A · 1 B | la tabla canónica de escalones se movió +58: `:774-779` → `:832-837` y `:782-784` → `:840-842`, comprobadas por contenido. `:327` va anclada `en a865ad3`: intacta |
| `remisiones` | `:74-80`; `:476-485` y subrangos en `Paquete_de_Despliegue_2026-09-27.md:444-450` | 4 | 4 B | ancladas `en ca56c62`: intactas |
| `zoho-sync` | `:221` (×6) | 0 | — | la inserción está en `:346` |
| `tickets-core` | ninguna en forma completa | 0 | — | — |

Segundo pase de la forma abreviada (`` `spec` :NNN ``) sin coincidencias vivas. Ninguna referencia viva a la ruta
`openspec/changes/asociacion-ov-ticket/` fuera de este archivo.

## Verificación

Re-verify **PASS WITH WARNINGS**: 10 requisitos, 24 escenarios, **24 PASS**, 0 CRITICAL (`verify-report.md`). El primer verify (`d9f51ae`)
dio **FAIL** —21 PASS, 2 PARTIAL, 1 FAIL—: liberar no limpiaba las columnas del ticket (RQ-TC-19). Lo cerró la remediación con RED previo
(las tres puertas seguían dando `409` tras liberar).

Cifras **re-ejecutadas por el orquestador** sobre el árbol de la remediación:

| Comando | Resultado |
|---|---|
| `npm test` | 150 ficheros y 1.622 pruebas en verde; 1 fichero y 2 pruebas omitidos (`migrate.integration.test.ts`) |
| `npm run typecheck` | salida 0 |
| `npx eslint . --max-warnings 165` | 165 avisos, 0 errores |
| `npm run build` | salida 0 |
| Evidencia | `sha256:2630e7af043f0daf26aa7169f25fc0d65d9c4f6b326d515227281ed59c8e8b4b` |

**Tres avisos vivos, registrados y no bloqueantes:**

1. **IV-12** — la cuarentena de la remisión (`remision.ts:220`) corre detrás del `409` de remisión pendiente (`remision.ts:177`). Es el molde
   de IV-12; se anota y no se reordena (`CLAUDE.md`, fila IV-12).
2. **El texto del `409` de la carrera** dice «ya está asociada a otro ticket», sin el número: tras un `23505` la transacción real de Postgres
   queda abortada y la consulta del ticket dueño fallaría. Con SAVEPOINT se podría, pero no se verificó en pg-mem (hipótesis).
3. **La atomicidad se prueba sólo por estructura.** pg-mem no deshace un `ROLLBACK`; lo que se prueba es que las dos sentencias de liberar y
   las dos de la remisión van por el MISMO cliente entre `BEGIN` y `COMMIT` (pool envoltorio que registra cliente y sentencia).

## Historia de fases y ledger

| Fase | Commit | Qué cubrió | Ledger = git |
|---|---|---|---|
| Lote 1 | `4501784` | tabla, índices parciales, `asociarOV` y liberación de la fila | 508 |
| Lote 2 | `2fca58c` | escritores y tercera vía en las tres puertas; `soloLibres`; liberación al eliminar el ticket | 635 |
| Lote 3 | `f3e8bdc` | `ovAdicional` en las dos aprobaciones | 321 |
| Lote 4 | `0537b3f` | arreglo de RQ-TS-18 (sin autorrelleno de `fecha_orden_venta`) y cuarentena C antes de D | 510 |
| Lote 5 | `1c1b5d7` | sufijo literal del clasificador; API de liberación, cuarentena y saldo con permisos por área | 494 |
| Lote 6 | `2c43e5c` | `consumido`, interfaz, IV-11 y barrido de cierre | 505 |
| Verify | `d9f51ae` | primer verify, FAIL | 303 |
| Remediación | `9de5a96`, `45f7403`, `3367e5d` | S-7, `23505` → `409`, remisión en transacción, spec y citas desplazadas | 330 |
| Archive | este commit | fusión, `git mv` de la carpeta y este informe | ver settle |

Objetivo del verify: 303 + 330 = 633 de 800. Techo del archive aprobado por Gerencia: 5.500.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

Dependen de datos de producción o de la app desplegada: no las puede hacer una tanda en el repositorio. **Archivar NO las da por hechas.**

- **P.1 · Alfonso** — ejecutar `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) sobre producción y devolver la salida: cuántas
  OV caen en cuarentena el día uno.
- **P.2 · Gerencia** — decidir el relleno retroactivo de asociaciones para tickets y OV anteriores a este cambio (dato de producción). Sin él,
  esas filas siguen expuestas al sincronizador e IV-11 sigue **REDUCIDO, no cerrado**.
- **P.3 · Comercial** — verificar en la app, tras desplegar, que la ficha lista las OV vigentes y liberadas, que «Liberar» exige área
  Comercial y motivo, y que la cuarentena y el saldo por lote se ven bien.
- **P.4 · Alfonso** — ejecutar la consulta 5 del mismo `.sql`: valores de `order_status` y `status` de `books.sales_orders`, para confirmar
  los literales `draft`/`void` de S-11, hoy **hipótesis**.

## Trazabilidad

- Carpeta archivada: `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/` (propuesta, diseño, tareas, apply-progress, verify-report
  y los cuatro deltas).
- IV-11: fila de `CLAUDE.md` en su sitio y `openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket` (lote 6).
- Precedente de formato: `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/archive-report.md` (cambio 1 de 3).
