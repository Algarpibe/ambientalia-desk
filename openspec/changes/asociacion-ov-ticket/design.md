# Diseño: asociación OV ↔ ticket (1 : N) propia de la aplicación y subOV de lote

Cambio 2 de 3 de F1B-11. Entrada: `proposal.md` de esta carpeta. Todas las líneas se leyeron contra el árbol de
`5ad3d37` el 2026-09-28; lo que no se pudo ejecutar va marcado **«hipótesis»**.

## Enfoque técnico

Una tabla nueva en `public` guarda cada asociación OV↔ticket con su traza; dos índices únicos parciales imponen «una
OV, un ticket vigente». Todo el código nuevo vive en **módulos nuevos**; en los ficheros muy citados sólo hay
ediciones **en sitio** (mismo número de líneas) o **al final**. La tercera vía entra **dentro** de
`ticketConOrdenVenta` (`packages/zoho-sync/src/db/repo.ts:362-379`), así que las tres llamadas de las puertas
(`apps/desk/server/services/ticketService.ts:96`, `:150`; `apps/desk/server/routes/remision.ts:230`) no cambian.

## 1 · Tabla, esquema, índices y pg-mem

**Esquema `public`** (S-1 confirmado): es dato propio de la app, como `public.remisiones` (`schema.sql:271`), y la
convención de `migrate.ts:66-73` pone ahí las tablas de la app; `DESK_TABLES` (`migrate.ts:63-64`) es el dominio de
Zoho Desk. El `CREATE` va calificado; las consultas van **sin calificar**, igual que el resto de tablas de la app
(`apps/desk/server/db/eliminarTicket.ts:41-43`: en pg-mem todo vive en `public`).

Al final de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `:525`), con comentario **sin punto y coma**
(`schema.sql:520-521`):

```sql
CREATE TABLE IF NOT EXISTS public.ov_asociaciones (
  id bigserial PRIMARY KEY,
  ticket_id text NOT NULL,
  numero text NOT NULL,              -- número congelado al asociar
  salesorder_id text,                -- id de Books; NULL si el número no resolvió (S-12)
  origen text NOT NULL,              -- alta | habilitar_servicio | remision | aprobacion | aprobacion_y_repuestos
  asociada_at timestamptz NOT NULL DEFAULT now(),
  asociada_por text,
  fecha_orden_compra date,           -- S-5
  liberada_at timestamptz,
  liberada_por text,
  motivo_liberacion text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_numero_vigente ON public.ov_asociaciones (numero) WHERE liberada_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_so_vigente ON public.ov_asociaciones (salesorder_id) WHERE liberada_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ov_asoc_ticket ON public.ov_asociaciones (ticket_id);
```

`ov_asociaciones` se añade **al final de la línea** `migrate.ts:73` (`PUBLIC_TABLES`), en sitio. Nunca hay `DELETE`.

| Decisión | Alternativa rechazada | Por qué |
|---|---|---|
| Id propio + dos índices parciales (por número y por id) | `salesorder_id` como PRIMARY KEY (`Decisiones_Gerencia_2026-09-10.md:147-150`) | No admite el historial que el mismo documento exige (`:480-481`): una subOV liberada se reasocia sin borrar la fila vieja |
| Índice también por `numero` | Sólo por `salesorder_id` | Las transiciones sólo traen el número (`TransitionPanel.tsx:243`); con `salesorder_id` NULL el índice por id no protege (`NULL` no colisiona) |

**pg-mem soporta el índice único parcial — verificado por EJECUCIÓN el 2026-09-28 (orquestador, script en el scratchpad; con y sin el índice: con él, el duplicado vigente da 23505, un `UPDATE` de `liberada_at` saca la fila del índice y la OV se reasocia; sin él, el duplicado entra — el índice discrimina, y pg-mem nombra mal la restricción como `_pkey`).** Además, por lectura: pg-mem 3.0.14
compila el `WHERE` del índice (fichero index.js de pg-mem 3.0.14, fuera del repositorio, línea 11386), `add()` omite la fila si el predicado no se
cumple (líneas 10011-10017 del mismo fichero) y la unicidad se salta si la clave tiene nulos (línea 10025). **Verificado por ejecución (arriba):** que un `UPDATE`
que pone `liberada_at` saque la fila del índice (`delete()` en las líneas 10051-10063 de ese fichero no evalúa el predicado, pero tolera la
ausencia). En esta fase no había intérprete disponible; el primer RED del lote 1 lo ejecuta, y la prueba discrimina
en las dos direcciones (regla de mutación 2): (a) segunda asociación vigente del mismo número → error `23505`;
(b) **ensuciar `schema.sql` quitando `WHERE liberada_at IS NULL`** → la prueba «liberar y reasociar» se pone roja.
Si (b) no se pone roja, pg-mem no discrimina y la guarda se duplica en `asociarOV` con `SELECT` previo.

## 2 · Marca, dos vías y la tercera en las tres puertas

| Pieza | Qué pasa |
|---|---|
| `ov_elegida_en_app_at` (`repo.ts:73-81`) | Intacta. Sigue protegiendo `orden_venta`/`fecha_orden_venta` («OV de entrada»). La tabla nueva no la toca el sync (`upsertTicket` sólo escribe `tickets`, `repo.ts:89-93`) |
| Vía `salesorder_id` y vía número (`repo.ts:369-370`) | Se quedan tal cual |
| Tercera vía | Dentro de `ticketConOrdenVenta`: `OR id IN (SELECT ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL AND (salesorder_id = $s OR numero = $n))`, reescribiendo `repo.ts:367-378` **sin cambiar el número de líneas**; el comentario `:349-361` se reescribe igual («tres vías») |
| Puerta 1, alta (`ticketService.ts:96`) | Llamada intacta; gana la tercera vía por dentro. Escalón D, última guarda antes de escribir |
| Puerta 2, transición (`ticketService.ts:150`) | Llamada intacta; sigue pasando sólo el número, que ahora casa también con `numero` de la tabla. `:148` pasa a `plan.columns.orden_venta ?? plan.ovAdicional` (en sitio, §4) |
| Puerta 3, remisión (`remision.ts:230`) | Llamada intacta. El comentario `:221-229` se reescribe en sitio: la condición de retirada pasa a nombrar los índices de `ov_asociaciones` |

**Escritores** (todos idempotentes: si ya hay una vigente del mismo número para el mismo ticket, no hacen nada):
- **Alta:** en `crearTicketConEquipo` (`apps/desk/server/services/equipoNuevo.ts:80-92` en `5ad3d37`; hoy `:80-99` tras el lote 2, última función del fichero):
  las dos ramas pasan a una transacción que llama a `createTicket(q, …, { transaccionAbierta: true })` y después a
  `asociarOV`. Sólo si hay `salesorderId` (S-4 intacto). `repo.ts:412-452` no se toca.
- **Transición:** `repo.ts:311` en sitio añade, tras el `UPDATE`, `; await asociarDesdeTransicion(q, …, actor, transition.id)` dentro de
  la misma transacción (precedente de dos sentencias en una línea: `ticketService.ts:125`). Import en sitio en
  `repo.ts:4`.
- **Remisión de entrada:** `remision.ts:239` pasa a `const fijada = await db.query(`, `:241` añade `RETURNING id`, y
  `:243` añade `; if (fijada.rows.length) await asociarOV(…)`. Sólo asocia si el `UPDATE` condicional escribió. **Lo aplicado (`remision.ts:243`) usa `actor: req.user?.name ?? TRANSITION_ACTOR`** —por las trazas: queda quién capturó la OV, y `TRANSITION_ACTOR` sólo si no hay usuario— **y `fechaOrdenCompra: null`**, porque `ov.date` es la fecha de la orden de VENTA y no la de la orden de COMPRA que guarda esa columna (S-5).
  **Verificado por ejecución (2026-09-28):** `RETURNING id` en `UPDATE` bajo pg-mem devuelve la fila (no se usa `rowCount`: `eliminarTicket.ts:93` avisa de que no
  siempre lo expone). No es atómico con el `UPDATE` —como hoy el resto de ese manejador—; el hueco lo cubren las dos
  vías de columna.
- **Eliminar ticket:** `eliminarTicket.ts:154` en sitio abre la transacción liberando las vigentes del ticket (motivo
  «Ticket eliminado»). Sin esto, una asociación vigente de un ticket borrado bloquearía la OV en el índice y ninguna
  puerta la vería (las tres leen `tickets`).

Pruebas de posición intactas: `apps/desk/server/remisiones.test.ts:988` no se toca; `ordenVentaUnTicket.test.ts`
sólo gana casos al final.

## 3 · S-7: liberar deja la OV libre para las dos vías de columna

**Elegido: limpiar la columna.** `liberarAsociacion` (módulo nuevo) hace, en una transacción: `UPDATE
ov_asociaciones SET liberada_at, liberada_por, motivo_liberacion WHERE id=$1 AND liberada_at IS NULL RETURNING …`, y
si `tickets.orden_venta` o `tickets.salesorder_id` de ese ticket son esa OV, los pone a NULL (y
`fecha_orden_venta`), fijando `ov_elegida_en_app_at = now()` para que el sync no la reponga (`repo.ts:76-78`). Si Zoho
sigue trayendo esa OV, `upsertTicket` avisa a Comercial una vez (`repo.ts:79-81`), que es lo correcto.

| Opción | Por qué no |
|---|---|
| Excluir por «asociación liberada» en las vías de columna | `Habilitar Servicio` enseña la OV de la columna **bloqueada** y la reenvía (`TransitionPanel.tsx:174`): reasociaría en silencio la OV liberada, o daría un 409 si ya la tomó otro ticket. Además exige subconsultas correlacionadas que pg-mem no resuelve (`books/repo.ts:150-153`) |

Límite (S-9): sólo se libera una **fila** de asociación. Un ticket anterior al cambio con la OV sólo en columna no es
liberable hasta que tenga asociación (la crea `Habilitar Servicio` al reenviarla, o el relleno P.2 de Gerencia).

## 4 · Aprobaciones: añadir OV sin sustituir la de entrada

**El riesgo es real.** Un campo con clave `'Orden de Venta'` casa en `LABEL_TO_COL` (`transitionExec.ts:4`, `:90-91`)
con la columna `orden_venta` (`rows.ts:99`) y la **sobrescribe**, y además `repo.ts:305` le pone la marca.

**Solución:** destino nuevo `'ovAdicional'` que nunca llega a columnas ni a `custom_fields`:
- `transitions.ts:17` en sitio: `FieldTarget` gana `| 'ovAdicional'`.
- `transitions.ts:199` y `:203` en sitio: cada `fields` gana `cfOvAdicional(…)`. **CORREGIDO en el lote 4 (RQ-TS-18 manda sobre este diseño):** `aprobacion_y_repuestos` lleva `cfOvAdicional()` SIN `campoFecha` —el `'Fecha Orden De Venta'` que este texto decía es la columna `fecha_orden_venta` (`rows.ts:108`), la fecha de la OV de ENTRADA: el autofill de `TransitionPanel.tsx:103` la pisaba y `:66` ocultaba al teclado el campo manual obligatorio—; 
  `aprobacion` conserva `'Fecha Orden de Venta Final'` (otra columna, `fecha_orden_venta_final`). Ningún servidor autorrellena nada: el autofill es comodidad del cliente (regla 13). 
  Opcional (S-10).
- `cfOvAdicional` va **al final de `transitions.ts`** como declaración `function` (se eleva; un `const` al final daría
  error de zona muerta porque `TRANSICIONES_BASE` se evalúa al cargar el módulo).
- `transitionExec.ts:21` en sitio (`comment?: string; ovAdicional?: string`) y `:88` en sitio (dicho `:92` en el diseño original; corregido en el lote 6: la rama vive en `:88`)
  (`else if (f.target === 'ovAdicional') plan.ovAdicional = String(raw); else plan.customFields[…]`).
- `repo.ts:267` en sitio: `TransitionApply` gana `ovAdicional?: string`.

Por qué no `custom_fields`: la clave quedaría en el jsonb, `yaLoTraeElTicket` (`TransitionPanel.tsx:174`) podría
enseñar el campo bloqueado en la segunda vuelta del ciclo, y se reenviaría la OV anterior.

`asociarDesdeTransicion` asocia `plan.columns.orden_venta` (Habilitar) y `plan.ovAdicional` (aprobaciones), resuelve
`salesorder_id` por número contra `sales_orders` (si no resuelve, NULL — S-12) y copia la fecha de OC de
`plan.columns.fecha_orden_compra` o `fecha_orden_compra_final` (S-5). Bodegaje: sin cambio de código; lee el
historial por etiqueta (`bodegaje.ts:8-14`) y `'Fecha Orden De Venta'` de `aprobacion_y_repuestos` ya existía. Una
prueba fija que el de entrada cierra con el valor de `habilitar_servicio`.

## 5 · SubOV

| Pieza | Dónde |
|---|---|
| Clasificador | `packages/shared/src/subOV.ts` (nuevo, exportado al final de `index.ts:22`): `clasificarOV(numero)` → `ordinaria` \| `subov {lote, sufijo}` \| `cuarentena`; `motivoCuarentena`, `erroresCuarentena`. Regla: tras `trim`, casa `^OV-(\d{4})-(\d{3,4})-(\d{2})$` → subOV, lote `OV-AAAA-NNN`; `^OVI?-\d{4}-\d{3,}$` → ordinaria; esa base **seguida de un sufijo** (resto que EMPIEZA por un no-dígito: `OV-2026-00123` sin sufijo es ordinaria, `OV-2026-00123-01` es cuarentena; corregido en el lote 5) → cuarentena; cualquier otro formato → ordinaria (S-2, S-8) |
| Guarda de servidor (escalón C, antes de D) | Alta: `ticketService.ts:96` en sitio antepone `if (motivoCuarentena(ordenVenta)) throw new HttpError(422, …);`. Transición: `:134` en sitio suma `erroresCuarentena([plan.columns.orden_venta, plan.ovAdicional])` a los errores del `422` existente. Remisión: `remision.ts:220` en sitio, `if (!ov \|\| motivoCuarentena(ov.number))`, con el mensaje de «no encontrada» cuando `!ov` (A sigue primero). Imports en sitio: `ticketService.ts:6`, `remision.ts:4` |
| Desplegable | `books/repo.ts:160-161` en sitio: cada `NOT IN` suma el de las asociaciones vigentes (por id y por número). Cuarentena en TS (pg-mem no tiene operador `~`: 0 apariciones en `index.js`): `:163` pide `limit * 3` SIEMPRE, con o sin `soloLibres` (aceptado por Gerencia en la revisión del lote 4: 4.18 exige la cuarentena fuera en los dos casos y el filtro es de TS; puede devolver menos de `limit` si más de 2/3 de la página está en cuarentena; sensible a mayúsculas, aceptado), `:176` filtra `!esCuarentena` y corta a `limit`; import en sitio `:2` |
| Lista de cuarentena y saldo | `packages/zoho-sync/src/books/subOV.ts` (nuevo): `listarCuarentena`, `saldoPorLote` → creadas / consumidas (vigente) / libres / `consumido` (= consumidas / creadas, %); cuarentena fuera de todo saldo; liberada cuenta como libre. **Nombre del campo (2026-09-28, lote 6):** `consumido`, no `ejecutado`. `Decisiones_Gerencia_2026-09-10.md:472` definía «% ejecutado = consumidas / creadas», pero la decisión posterior `decision/anexo-53-contratos` (24/09, `openspec/config.yaml:2448`; informe trimestral `:2457`) redefine «ejecutada» como subOV con ticket FINALIZADO y «% ejecutado» = ejecutadas / creadas. Ese % ejecutado es del cambio 3 de F1B-11 (`proposal.md:49`) y NO se implementa aquí; este cambio expone `consumido` (asociación vigente / creadas) |
| Un ticket vigente por subOV | Los índices de §1 y las tres puertas |

**Regla 13, decisión a decisión** (líneas de servidor nuevas se fijan en el `apply-progress.md` de su lote):

| Decisión que toma el cliente | Quién la impone en el servidor |
|---|---|
| El desplegable oculta OV usadas y en cuarentena | `searchSalesOrders` (`books/repo.ts:159-176` tras el cambio) |
| Botón «liberar» sólo para Comercial | Ruta nueva: `canExecuteTransition(areas, isAdmin, 'Comercial')` (`@ambientalia/shared`, consumida, no reescrita) |
| Motivo obligatorio al liberar | Ruta nueva, `422` si vacío tras `trim` |
| Filtro del desplegable por cliente | **Ninguna, a propósito**: comodidad, no guarda (IV-8, regla 13 punto 2, declarado) |

Liberar sigue la escalera de F1B-10: A asociación inexistente `404` < B no Comercial `403` / ya liberada `409` <
C motivo vacío `422`.

## 6 · Plan de desfase de citas (regla de mutación 4)

**Ninguna inserción a mitad de fichero en los ficheros muy citados.** Recuento de citas vivas (fuera de
`openspec/changes/archive/`) medido hoy con Grep equivalente a `git grep -c`:

| Fichero | Citas vivas totales | Ediciones | Tipo | Citas a releer (contenido cambia, número no) |
|---|---|---|---|---|
| `packages/zoho-sync/src/db/repo.ts` | 43 (`db/repo.ts:N`) | `:4`, `:267`, `:311`, `:349-361`, `:367-378` | EN SITIO | 4 externas (`ordenVentaUnTicket.test.ts:14`; `tickets-core` :306; `transitions-st` :399; `remisiones` :364) + 4 de este cambio |
| `apps/desk/server/routes/remision.ts` | 118 | `:4`, `:5`, `:220`, `:221-229`, `:239`, `:241`, `:243` | EN SITIO | 21 externas + 4 propias (entre ellas `CLAUDE.md` IV-12 `:220`, que sigue diciendo «Orden de venta no encontrada») |
| `apps/desk/server/services/ticketService.ts` | 156 | `:6`, `:96`, `:134`, `:148` | EN SITIO | ~30 externas + 5 propias (`transitions-st` :902-903 afirma C `:132-134` antes de D `:148-152`: sigue cierto) |
| `packages/zoho-sync/src/db/schema.sql` | 110 | tabla e índices | AL FINAL (tras `:525`) | 0 |
| `apps/desk/server/remisiones.test.ts` | 34 | ninguna | — | 0 |
| `packages/shared/src/transitions.ts` | 217 | `:17`, `:199`, `:203`; `cfOvAdicional` | EN SITIO + AL FINAL | 3 vivas (`bodegaje.test.ts:360`, `:362`; `transitions-st` :295) + históricas del maestro y F0 (caso B) |
| `apps/desk/server/transitionExec.ts` | 41 | `:21`, `:88` (`:92` en el diseño original) | EN SITIO | 2 vivas (`rows.ts:120`, `tickets-core` :328, las dos `:90-92`) |
| `packages/zoho-sync/src/books/repo.ts` | — | `:2`, `:160-161`, `:163`, `:176` | EN SITIO | 3 (`equipos.test.ts:458` y `F1B-01` `:145`; `Puntos_para_Gerencia` `:166-170`) |
| `packages/zoho-sync/src/db/migrate.ts` | — | `:73` | EN SITIO | 2 (`tickets-core` :666 y `Paquete_2026-09-27` :75, las dos `:70`) |
| `apps/desk/server/services/equipoNuevo.ts` | — | `:86-91` | AL FINAL (última función) | 1 (`hojas-vida` :273, `:80`, no cambia) |
| `apps/desk/server/db/eliminarTicket.ts` | 11 | `:154` | EN SITIO | 0 |
| `apps/desk/src/components/TicketDetailView.tsx` | 10 | import en una línea existente de `:7-24`; montaje **después de `:245`** | EN SITIO + MITAD | **0** vivas en o tras la línea de inserción (todas citan `:245`, `:208` o `:37`) |
| `apps/desk/server/app.ts` | 0 sin ancla | registro tras `:60` + import | MITAD | **0** vivas (las halladas llevan ancla `1d030d5`; las tres de `Triaje_Linea_Base_Citas_2026-09-15.md:71-73` se leen al cerrar — hipótesis: ancladas) |
| `CLAUDE.md` | — | fila IV-11 (una línea física); fila IV-12 si se amplía (R-3) | EN SITIO | la propia fila |
| `openspec/config.yaml` | — | adenda nueva **AL FINAL del fichero** (clave propia), remitida por clave desde la línea `estado:` de la ficha de IV-11 en su sitio — corrección del orquestador: `config.yaml` no admite inserción en mitad (convención de edición de los ficheros muy citados: en su sitio o al final) | FINAL | **0**: al ir al final no desplaza ninguna cita (`proposal.md:137` de este cambio, que cita `config.yaml:3125-3128`, sigue valiendo) |

Reglas para `apply`: nada de líneas de import nuevas en cabecera de estos ficheros (se añade el nombre a una línea de
import existente, o una segunda sentencia en esa línea); `transitions.ts` nunca gana líneas antes de `:295`.

## 7 · Lotes de `apply` (≤ 800 líneas reales cada uno, `apply-progress.md` incluido)

Medida: `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear. Una edición en sitio cuenta 2
(borrada + insertada). El cambio 1 midió 3,4 veces su estimación (`proposal.md:137`); estas cifras ya lo descuentan.

| Lote | Contenido | Código | Pruebas | Artefactos | Total | Depende de |
|---|---|---|---|---|---|---|
| 1 · Tabla y unicidad | `schema.sql`, `migrate.ts:73`, `db/ovAsociaciones.ts` (`asociarOV`, `liberarAsociacion` con limpieza de columna, `liberarAsociacionesDeTicket`, `listarAsociaciones`); RED de pg-mem (§1) | ~170 | ~300 | ~100 | ~570 | — |
| 2 · Escritores y puertas | `repo.ts` en sitio, `equipoNuevo.ts`, `remision.ts` `:5`/`:221-243`, `eliminarTicket.ts:154`, `books/repo.ts:160-161`; pruebas de tercera vía en las tres puertas, S-7 y reasociación, al final de `ordenVentaUnTicket.test.ts` y en fichero nuevo | ~110 | ~370 | ~100 | ~580 | 1 |
| 3 · Varias OV por ticket | `transitions.ts`, `transitionExec.ts`, `repo.ts:267`, `ticketService.ts:148`, `asociarDesdeTransicion` con `ovAdicional` y fecha de OC; prueba «la OV de entrada no cambia tras `Aprobación`» y bodegaje | ~60 | ~340 | ~100 | ~500 | 2 |
| 4 · Cuarentena | `shared/subOV.ts` + prueba de tabla, guardas en sitio (`ticketService.ts:6`/`:96`/`:134`, `remision.ts:4`/`:220`), desplegable (`books/repo.ts:2`/`:163`/`:176`); pruebas de posición C antes de D en las tres puertas | ~90 | ~400 | ~100 | ~590 | 1-3 |
| 5 · API de servidor | `books/subOV.ts` (cuarentena, saldo por lote), `routes/ovAsociaciones.ts` (lista por ticket, liberar, cuarentena, saldo), `app.ts`; pruebas de rutas y escalera de liberar | ~250 | ~350 | ~100 | ~700 | 4 |
| 6 · Interfaz y cierre | `client.ts` (al final), ficha con N OV y liberar, lista de cuarentena y saldo (`.tsx`, fuera de la red, F0-00); fila IV-11 de `CLAUDE.md`, adenda en `config.yaml`, barrido de citas | ~350 | 0 | ~140 | ~490 | 5 |

Una tanda SDD por árbol (regla del ciclo 2): los lotes van en serie. Verify y archive son intentos aparte.

## Estrategia de pruebas (strict_tdd)

| Capa | Qué | Cómo |
|---|---|---|
| Datos | Índices parciales, idempotencia, liberar/reasociar, eliminación | pg-mem; mutación 2 sobre `schema.sql` |
| Servicio | Tercera vía en las tres puertas; entrada intacta tras `Aprobación`; cuarentena C antes de D | pg-mem + `appHarness`; mutación 1: mover la guarda de cuarentena detrás de la de unicidad debe poner rojo |
| Motor | `ovAdicional` no llega a `columns` ni a `custom_fields` | `transitionExec.test.ts`; mutación: clave `'Orden de Venta'` → rojo |
| Clasificador | `OV-AAAA-NNN`, `OV-AAAA-NNNN-NN`, `OVI-`, sufijos raros, espacios | tabla de casos en `subOV.test.ts` |

## Matriz de amenazas

N/A — sin enrutado, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migración / despliegue

`CREATE … IF NOT EXISTS`: la tabla nace vacía. Sin relleno (datos de producción, tarea de persona P.2). Rollback:
revertir los commits del lote; la tabla puede quedarse.

## Supuestos nuevos (reversibles, modo `auto`)

- **S-7 resuelto:** liberar limpia la columna del ticket si guarda esa OV y fija la marca (§3).
- **S-8** Una `OVI-` con sufijo va a cuarentena (tiene sufijo y no casa el patrón canónico, letra de S-2).
- **S-9** Sólo se liberan filas de asociación; la OV sólo-en-columna de tickets previos no es liberable.
- **S-10** El campo «OV adicional» de las dos aprobaciones es opcional.
- **S-11** Saldo por lote: «creadas» son las subOV del lote en `sales_orders` con cualquier `order_status` salvo
  borrador y anulada; «consumidas», las que tienen asociación vigente. **Hipótesis:** los literales `draft` y `void` que filtra `saldoPorLote` (`books/subOV.ts:18`) no están verificados contra datos reales; los comprueba la consulta de la tarea de persona P.4 (`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql`, consulta 5) y hasta entonces siguen siendo hipótesis.
- **S-12** En transiciones, la asociación se escribe aunque el número no resuelva en Books (`salesorder_id` NULL); el
  índice por número la protege. En el alta sigue S-4.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| pg-mem y el índice parcial | Verificado por ejecución (§1); el RED del lote 1 lo fija igualmente en las dos direcciones, con la mutación 2 sobre `schema.sql` |
| Carrera entre la puerta y el `INSERT`: `23505` sale como `500` | Probabilidad baja; las vías de columna siguen protegiendo. Registrado, no se corrige aquí |
| La guarda de cuarentena en `remision.ts:220` queda detrás del `409` de remisión pendiente (`:177`, D): es el molde de IV-12 | Se anota en la fila IV-12 al cerrar (en sitio); IV-12 no se reordena (`proposal.md:56`) |
| Añadir un campo `ordenVenta` a dos transiciones rompe invariantes del grafo o el mapa del Blueprint (`invariantesGrafo.test.ts`, `mapaBlueprint`) | Se ejecutan en el lote 3; si hace falta, se regenera el mapa |
| `FieldTarget` con un `switch` exhaustivo en otro sitio | `npm run typecheck` en el lote 3 |

## Preguntas abiertas

Ninguna bloquea. S-8 a S-12 son supuestos reversibles; la salida de `Consulta_SubOV_formato_2026-09-27.sql` sólo
cuantifica la cuarentena del día uno.
