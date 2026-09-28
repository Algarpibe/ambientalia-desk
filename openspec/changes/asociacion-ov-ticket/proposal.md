---
tanda: F1B-11
motivo: ""
capacidad: [tickets-core, transitions-st, remisiones, zoho-sync]
maestro: ["M4.4", "nº 52"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: asociación OV ↔ ticket (1 : N) propia de la aplicación y subOV de lote

Cambio **2 de 3** de F1B-11. El 1 (`parche-iv11-orden-venta`, archivado) puso la marca de fila; el 3 (registro de
contrato y prioridad, `decision/anexo-53-contratos`, `openspec/config.yaml:2448-2469`) es el que cierra la fila. Este
cubre el contenido de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:165`, como ya fijó el cambio 1
(`openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/proposal.md:38-39`).

## Intención

- Hoy un ticket sólo guarda UNA OV: `orden_venta` + `salesorder_id` en la fila (`packages/zoho-sync/src/db/schema.sql:187`,
  `packages/zoho-sync/src/db/repo.ts:48`). La segunda OV —la de reparación en `Aprobación`— no tiene dónde vivir, y la
  trazabilidad de la primera se pierde (maestro R08.2 §M4.4, `R08.2.md:2173`).
- Gerencia decidió `1 ticket : N OV`, sin tabla puente (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:112`, `:124-126`), y
  la asociación en tabla propia porque `books.sales_orders` es réplica del hub (`schema.sql:160-165`; decisión `:142-150`).
- La subOV de lote (opción A) exige cuarentena, saldo por lote, un ticket vigente por subOV y liberación con traza
  (`Decisiones_Gerencia_2026-09-10.md:429-490`; maestro `R08.2.md:2179-2184`).
- **Observación, no se corrige aquí:** `decision/n52-cardinalidad-ov` y `decision/subov-lote-convencion` NO tienen entrada
  `clave:` propia en `openspec/config.yaml → decisiones_de_gerencia` (sólo referencias, p. ej. `:596-611`, y la fila del
  plan `R01.1.md:387`). Toda cita a ellas va al documento del 10/09.

## Alcance

**Dentro**
1. Tabla `public.ov_asociaciones` (nombre: supuesto S-1): ticket, OV (`salesorder_id` + número congelado), transición que
   asocia, fecha y hora, persona, fecha de OC; liberación con fecha, hora, persona y motivo. **Nunca `DELETE`.**
2. Índice único parcial «una OV, un ticket vigente» sobre las no liberadas (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:475-476`).
3. Los tres escritores actuales (alta, `habilitar_servicio`, remisión de entrada) escriben además la asociación.
4. `Aprobación` y `Aprobación y S. Repuestos` **añaden** OV sin sustituir la de entrada (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:403-407`); la fecha
   de OC se guarda en esa asociación (`:409-415`).
5. Las tres puertas y el desplegable (`soloLibres`) leen una tercera vía: la asociación vigente.
6. SubOV: clasificador compartido del número, cuarentena (fuera del desplegable y de todo saldo, lista visible para
   Comercial), saldo por lote (creadas / consumidas / libres, % ejecutado), guarda de servidor.
7. Acción manual «liberar subOV/OV» con motivo, sólo Comercial, hasta que exista C2 (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:484-486`;
   `packages/shared/src/estados.ts` no contiene «Anulad»).
8. Ficha del ticket: lista de sus OV (vigentes y liberadas). `cf_n_ticket` sólo sugiere (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:152-154`).
9. Comprobar que el bodegaje de entrada cierra con la OV de `Habilitar Servicio`; ajustar si no.

**Fuera**
- Registro de contrato, vigencia por fecha, prioridad e informe trimestral → cambio 3 (`config.yaml:2453-2459`, `:1605-1623`).
- **IV-8** (guarda de titularidad con mantenedor): el código no conoce el mantenedor y su campo cae en F1B-02, destino
  propuesto (`config.yaml:1788-1794`). Este cambio NO añade ninguna guarda cliente-OV: una estricta bloquearía justo al
  mantenedor. El filtro por cliente del desplegable sigue siendo comodidad, no guarda (regla 13, punto 2, declarado).
- Relleno retroactivo de asociaciones para tickets existentes: datos de producción (motivo de parada 3).
- Retirar las tres guardas de aplicación en favor de la restricción de base de datos (ver «Marca y dos vías»).
- Subdividir desde Desk una OV de lote llegada sin subdividir (maestro `R08.2.md:2177`, abierto).
- IV-12 (orden del alta de remisión): no se reordena `remision.ts`.

## Capacidades

**Nuevas:** ninguna (supuesto S-6).
**Modificadas:**
- `tickets-core`: modelo `1 ticket : N OV`, tabla de asociación, liberación con traza, puerta 1 con tres vías, cuarentena.
- `transitions-st`: `habilitar_servicio` asocia; `Aprobación` / `Aprobación y S. Repuestos` añaden OV con fecha de OC; puerta 2.
- `remisiones`: RQ-RE-16 lee la tercera vía y el `UPDATE` asocia.
- `zoho-sync`: `soloLibres` excluye asociadas vigentes y cuarentena; saldo por lote sobre `books.sales_orders`.

## Marca y dos vías: qué pasa con ellas

| Pieza | Decisión en este cambio |
|---|---|
| `ov_elegida_en_app_at` (`repo.ts:73-81`; escritores `:305`, `:418-422`; `apps/desk/server/routes/remision.ts:240`) | **Se queda intacta.** Sigue protegiendo `orden_venta`/`fecha_orden_venta`, que pasan a leerse como «OV de entrada» de la ficha. La asociación vive en una tabla que el sync no escribe (`upsertTicket` sólo toca `tickets`, `repo.ts:64-95`) |
| Vía `salesorder_id` y vía número (`ticketConOrdenVenta`, `repo.ts:362-379`) | **Se quedan**, y se añade una tercera: asociación vigente, por id o por número congelado. Mismas llamadas, mismos sitios: `apps/desk/server/services/ticketService.ts:96`, `:150`, `remision.ts:230` |
| Las tres guardas de aplicación | **No se retiran.** El índice sólo cubre filas de la tabla; sin relleno de los tickets anteriores, retirarlas dejaría sin protección el histórico. La condición de retirada ya está escrita en `remision.ts:221-225` |
| Pruebas de posición | Intactas: `apps/desk/server/remisiones.test.ts:988` y `apps/desk/server/ordenVentaUnTicket.test.ts` sólo ganan casos añadidos al final |

**IV-11:** sigue **REDUCIDO, no cerrado**. Lo que se elija en la app desde este cambio queda en una tabla fuera del alcance
del sync, y la puerta 2 —que sólo compara por número (`ticketService.ts:150`)— gana la vía de la asociación. Siguen
expuestas las filas previas sin marca ni asociación; su relleno es la misma decisión de persona pendiente (P.2 del cambio 1).

## Enfoque

- **Esquema `public`, no `desk`.** Es tabla propia de la app, y la convención es que esas van calificadas en `public`
  (`packages/zoho-sync/src/db/migrate.ts:66-73`), igual que `public.remisiones`, que apunta a tickets por `ticket_id text`
  sin FK (`schema.sql:271-288`). `DESK_TABLES` es el dominio de Zoho Desk (`migrate.ts:62-64`). `CREATE TABLE
  IF NOT EXISTS public.…` calificado; se añade a `PUBLIC_TABLES` (edición en la misma línea).
- **Clave:** id propio + índice único parcial sobre `salesorder_id` de las no liberadas. La «`salesorder_id` como PRIMARY
  KEY» de `docs/sdd/Decisiones_Gerencia_2026-09-10.md:147-150` no admite el historial que el mismo documento exige después (`:480-481`): una subOV
  liberada debe poder reasociarse sin borrar la fila vieja.
- **Código nuevo en módulos nuevos** (acceso a datos de la asociación en `packages/zoho-sync`, clasificador de número en
  `packages/shared`); en los ficheros muy citados sólo ediciones en sitio o al final.
- **Precedencia (F1B-10):** cuarentena = escalón C; asociación vigente = escalón D, dentro de la guarda 409 existente.
- **Regla 13:** el cliente sólo muestra; bloquear, liberar y excluir los impone el servidor, con línea en el diseño.

## Supuestos reversibles (modo `auto`)

- **S-1** Nombre `public.ov_asociaciones`; lo fija el diseño.
- **S-2** **Cuarentena = número con sufijo que no casa `^OV-(\d{4})-(\d{3,4})-(\d{2})$`.** Una OV simple `OV-AAAA-NNN` y
  una `OVI-` son OV ordinarias, NO cuarentena. Fuentes: `docs/sdd/Decisiones_Gerencia_2026-09-10.md:459-461` («una OV **con sufijo**»;
  maestro `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:2181`) y la consulta (`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql:16`). Poner en
  cuarentena todo lo que no sea subOV sacaría del desplegable todas las OV normales y las OVI de garantía
  (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:381-396`). Confirmado por Gerencia el 2026-09-28.
- **S-3** Un lote llegado sin subdividir no se distingue de una OV normal: admite un ticket y el segundo recibe el 409.
- **S-4** Un alta con número tecleado que no resuelve en Books no crea asociación; queda como hoy.
- **S-5** La fecha de OC se copia a la asociación; las columnas y el historial del ticket no cambian (el bodegaje lee el
  historial, `packages/shared/src/bodegaje.ts:8-14`).
- **S-6** Sin capacidad nueva: evita insertar en mitad de `openspec/config.yaml → capabilities` (empieza en `:104`), fichero muy citado.
- **S-7** Liberar deja la OV libre para las tres puertas y el desplegable; cómo (excluir por asociación liberada o limpiar
  la columna) lo decide el diseño.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

- **Alfonso:** ejecutar `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) y devolver la salida. Sólo dice
  cuántas OV caen en cuarentena el día uno; no bloquea construir. Queda escrito en el `tasks.md`.
- **Gerencia:** relleno de asociaciones previas (P.2 del cambio 1,
  `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/archive-report.md:78`).

## Áreas afectadas

| Área | Cambio |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` · `migrate.ts` | Tabla e índice nuevos al final · `PUBLIC_TABLES` |
| `packages/zoho-sync/src/db/repo.ts` | `ticketConOrdenVenta`, `createTicket`, `writeTransition`, en sitio |
| `packages/zoho-sync/src/books/repo.ts` | `searchSalesOrders` (`soloLibres`, cuarentena), saldo por lote |
| `packages/shared/src/` | Clasificador de subOV (nuevo); campo «añade OV» en `transitions.ts:198-203` |
| `apps/desk/server/services/ticketService.ts` · `routes/remision.ts` | Asociación y tercera vía; comentario `:221-229` en sitio |
| `apps/desk/server/routes/` | Liberar, cuarentena, saldo (nuevas rutas) |
| `apps/desk/src/` | Ficha con N OV, liberar, lista de cuarentena y saldo (fuera de la red de pruebas, F0-00) |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| pg-mem no soporta el índice único parcial y la prueba pasa sin discriminar (hipótesis) | Media | Diseño lo comprueba; mutación 2: insertar la segunda asociación vigente y exigir rojo |
| Una OV liberada sigue bloqueada por las vías de columna | Alta | S-7 y prueba explícita de reasociación |
| El campo «añade OV» reescribe `orden_venta` por el motor (`transitions.ts:9`) | Media | Prueba: tras `Aprobación`, la OV de entrada no cambia |
| Desfase de citas en `repo.ts`, `remision.ts`, `schema.sql` | Alta | Sólo en sitio o al final; barrido de la regla de mutación 4 al cerrar |
| Tamaño: el cambio 1 estimó ~350 y midió 1.178 (`config.yaml:3125-3128`) | Alta | Tres lotes |

## Previsión de tamaño

Medida real (`git diff --shortstat --no-renames` + nuevo sin trackear), con el factor observado en el cambio 1:
**~2.400-2.800 líneas de apply** (código ~1.000, pruebas ~1.400, UI ~300). No cabe en un lote de 800.

| Lote | Contenido | Estimación |
|---|---|---|
| 1 · Núcleo | Tabla, índice, módulo de acceso, tres escritores, tercera vía en puertas y `soloLibres` | ~800 |
| 2 · N OV | Campo «añade OV» en las dos aprobaciones, fecha de OC, bodegaje, ficha del ticket | ~800 |
| 3 · SubOV | Clasificador, cuarentena, saldo por lote, liberar con motivo, guarda | ~900 (el `tasks.md` decide si se parte en 3a/3b) |

Verify y archive son intentos aparte; el archive supera 800 por el `git mv` (regla del ciclo 2).

## Rollback

Revertir los commits del lote. La tabla es nueva y nadie fuera de este código la lee: puede quedarse o borrarse sin tocar
`tickets`. La marca y las dos vías no se modifican.

## Criterios de éxito

- [ ] Un ticket con dos OV vigentes; la de entrada no cambia tras `Aprobación`.
- [ ] Segunda asociación vigente de la misma OV → 409 en las tres puertas y rojo en la base.
- [ ] Liberar: fila conservada con motivo; la OV vuelve al desplegable y es reasociable; sólo Comercial.
- [ ] OV con sufijo no canónico: fuera del desplegable y del saldo, en la lista; `OV-AAAA-NNN` y `OVI-` intactas.
- [ ] Saldo por lote correcto con subOV libres, consumidas y en cuarentena.
- [ ] `remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts` en verde sin cambios en sus casos existentes.

## Cierre esperado

- IV-11: adenda nueva al final de `config.yaml → adendas_incumplimientos_vivos`, y su fila de `CLAUDE.md` en sitio.
- `toca_maestro: no`: el maestro R08.2 ya describe este modelo (`R08.2.md:2160-2185`).
