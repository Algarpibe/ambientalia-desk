# Delta para `zoho-sync`

## MODIFIED Requirements

### RQ-ZS-01 · `managed_by_app` es la frontera de escritura, no el discriminador de origen

Una fila con `managed_by_app = true` **MUST NOT** ser sobrescrita por el sync
(`packages/zoho-sync/src/db/repo.ts:66-71` para tickets, `:20-21` para contactos, `:14` para cuentas).

- En tickets, el `UPSERT` **SHALL** salir antes de escribir si la fila ya está gestionada por la app
  (`repo.ts:66-71`: `// no sobrescribir lo gestionado por la app`), y la columna **MUST NOT** estar
  entre las que el `ON CONFLICT` actualiza (`:88`).
- En cuentas, la exclusión **SHALL** ir en el propio `WHERE` del `ON CONFLICT` (`:14`).
- Lo que llega de Zoho **SHALL** nacer con `managed_by_app: false` y `source: 'zoho'`
  (`db/mappers.ts:53`, `:77`, `:85`).
- Lo que la app toca **SHALL** quedar marcado: `applyTransition` pone `managed_by_app=true` y
  `source='app'` en **cualquier** transición hecha desde Desk (`repo.ts:298`).

**Desde este cambio, dos columnas ganan una frontera propia, más fina que `managed_by_app`.** Cuando
la fila lleva la marca de fila `ov_elegida_en_app_at timestamptz` puesta (**supuesto S-1**, reversible:
nullable, fuera de `TICKET_COLS`, sin relleno de filas previas), `orden_venta` y `fecha_orden_venta`
**MUST NOT** ser sobrescritas por `upsertTicket`, aunque `managed_by_app` sea `false` en esa misma
fila. Es la excepción por columnas que reduce IV-11 para las filas marcadas.

- La marca **SHALL** ponerla, en la misma escritura, cualquiera de los **tres** escritores de la
  aplicación que fijan `orden_venta`: el alta de ticket (`repo.ts:420-421`), `writeTransition` cuando
  `plan.columns` incluye `orden_venta` —caso de `habilitar_servicio` (`transitions.ts:189`)—
  (`repo.ts:298`, `:301-306`), y el `UPDATE` de la remisión de entrada (capacidad `remisiones`, RQ-RE-16
  modificado, `apps/desk/server/routes/remision.ts:239-243`). `upsertTicket` **MUST NOT** ponerla
  nunca: es de lectura para el sync, nunca de escritura.
- Sin la marca, la fila **SHALL** seguir la regla de hoy sin cambios: `orden_venta` y
  `fecha_orden_venta` se sobrescriben con lo que traiga Zoho.
- `salesorder_id` **SHALL** seguir fuera de `TICKET_COLS` (`schema.sql:187`); su comportamiento
  **MUST NOT** cambiar por este parche.
- Una fila que ya tuviera su orden de venta elegida en la aplicación **antes** de este cambio
  **MUST NOT** recibir la marca de forma retroactiva: no hay relleno (supuesto S-1). Sigue expuesta al
  sync hasta que un escritor de la app vuelva a fijar su orden de venta.

**Y de ahí sale el matiz que importa:** por ese último punto, `managed_by_app` **MUST NOT** usarse
para saber si un ticket nació en la app. El guardia fiable es el prefijo `app-` del `id`, que es
inmutable. La regla completa es de `tickets-core` RQ-TC-01; aquí sólo se fija por qué esta columna no
sirve para eso.

(Previously: la excepción de escritura era sólo de fila entera, por `managed_by_app`. No existía
frontera por columna, así que una fila con `managed_by_app=false` perdía `orden_venta` y
`fecha_orden_venta` en cada pasada del sync aunque un escritor de la app las hubiera fijado — es el
desvío registrado como IV-11.)

**Y una segunda frontera por columna, para la prioridad** (`propagar-top5-lista-remision-creada`,
F1B-07). Cuando la fila lleva la marca de fila `prioridad_en_app_at timestamptz` puesta (**supuesto S-1
de ese cambio**, reversible: columna de `tickets` que admite NULL, fuera de `TICKET_COLS`, sin relleno de
filas previas; vaciarla devuelve el mando sobre `priority` a Zoho), `priority` **MUST NOT** ser
sobrescrita por `upsertTicket`, aunque `managed_by_app` sea `false` en esa misma fila. Aplica a la
prioridad la misma regla que Gerencia dio para la orden de venta: si se eligió en la aplicación manda la
aplicación; si no, manda Zoho (`decision/e005-iv4-iv11`).

- La marca **SHALL** ponerla, en la misma escritura que cambia `tickets.priority`, la propagación y la
  reversión del Top 5 (`tickets-core` RQ-TC-35 y RQ-TC-36), sobre cada ticket cuya prioridad escriban.
  Tras una reversión la marca **SHALL** conservarse (supuesto S-2 de ese cambio): la prioridad calculada
  la eligió la aplicación y se mantiene frente a Zoho.
- `upsertTicket` **MUST NOT** ponerla ni quitarla nunca.
- Sin la marca, la fila **SHALL** seguir la regla de hoy sin cambios: `priority` se sobrescribe con lo
  que traiga Zoho.
- La guarda de fila entera por `managed_by_app` **SHALL** seguir siendo la primera: con
  `managed_by_app = true` el `upsertTicket` sale antes de escribir nada, marcas puestas o no.
- Las dos marcas **SHALL** ser independientes: `ov_elegida_en_app_at` protege `orden_venta` y
  `fecha_orden_venta`; `prioridad_en_app_at` protege sólo `priority`. Una fila con las dos puestas
  conserva las tres columnas y actualiza el resto de `TICKET_COLS`.
- El ajuste manual de la prioridad de un ticket (`tickets-core` RQ-TC-29) **SHALL** seguir marcando
  `managed_by_app`; no se migra a la marca nueva.
- Sobre la prioridad **no** hay aviso de discrepancia con Zoho: el aviso de la orden de venta no se replica.
- Una fila cuya prioridad ya se hubiera fijado en la aplicación **antes** de este cambio **MUST NOT**
  recibir la marca de forma retroactiva: no hay relleno.
- La columna se crea con `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz`,
  **sin calificar** (`tickets` es de `desk`, ver la topología de dos esquemas), al **final** de
  `packages/zoho-sync/src/db/schema.sql`, sin mover ninguna línea anterior.
- **Regla invariable 13:** que el sincronizador no pise la prioridad lo impone `upsertTicket` en el servidor
  y es la única comprobación que hay; el cliente no participa.

#### Scenario: Los tres escritores de la app ponen la marca al fijar la orden de venta
- GIVEN un alta de ticket con orden de venta, una transición cuyo `plan.columns` incluye
  `orden_venta` (p. ej. `habilitar_servicio`), o el `UPDATE` de una remisión de entrada que captura
  la orden
- WHEN cualquiera de los tres escribe `orden_venta` sobre la fila
- THEN esa misma escritura deja la marca `ov_elegida_en_app_at` puesta

#### Scenario: El sincronizador nunca escribe la marca
- GIVEN cualquier fila que `upsertTicket` procese, marcada o no
- WHEN corre `upsertTicket`
- THEN la marca no cambia por esa pasada

#### Scenario: Con la marca puesta, una pasada del sync no pisa las dos columnas
- GIVEN un ticket con la marca puesta y `orden_venta`/`fecha_orden_venta` distintas a las que trae
  Zoho en esta pasada
- WHEN `upsertTicket` procesa la fila
- THEN `orden_venta` y `fecha_orden_venta` quedan igual que antes de la pasada
- AND el resto de columnas de `TICKET_COLS` se actualiza con normalidad

#### Scenario: Sin la marca, Zoho sigue mandando
- GIVEN un ticket sin la marca puesta
- WHEN `upsertTicket` procesa una pasada con valores de Zoho distintos a los guardados
- THEN `orden_venta` y `fecha_orden_venta` se sobrescriben con los de Zoho, igual que hoy

#### Scenario: `salesorder_id` no cambia de comportamiento
- GIVEN cualquier fila, marcada o no
- WHEN el sync corre
- THEN `salesorder_id` sigue fuera de `TICKET_COLS` y su comportamiento no cambia por este parche

#### Scenario: Una fila existente no recibe la marca por sí sola
- GIVEN una fila cuya orden de venta ya se eligió en la aplicación antes de desplegar este cambio
- WHEN se despliega el cambio
- THEN esa fila no recibe la marca de forma retroactiva y sigue expuesta al sync hasta el siguiente
  escritor de la app que vuelva a fijar su orden de venta

#### Scenario: Con `prioridad_en_app_at` puesta, una pasada del sync no pisa `priority` y sí el resto
- GIVEN un ticket de Zoho con `managed_by_app = false` y la marca de prioridad puesta, con `priority`
  `High` en la base y `Low` en lo que trae Zoho, y otra columna de `TICKET_COLS` (p. ej. `subject`)
  distinta
- WHEN `upsertTicket` procesa la fila
- THEN `priority` sigue `High`
- AND `subject` y el resto de columnas de `TICKET_COLS` se actualizan con normalidad
- AND `managed_by_app` sigue `false`

#### Scenario: Sin `prioridad_en_app_at`, Zoho sigue mandando sobre `priority`
- GIVEN un ticket sin la marca de prioridad y con `priority` distinta a la que trae Zoho
- WHEN `upsertTicket` procesa la fila
- THEN `priority` se sobrescribe con la de Zoho, igual que hoy

#### Scenario: Una prioridad propagada sobrevive a la pasada siguiente del sync
- GIVEN un ticket de Zoho al que la propagación del Top 5 (`tickets-core` RQ-TC-35) cambió la prioridad
- WHEN corre `upsertTicket` con otra prioridad en el payload
- THEN `tickets.priority` conserva la propagada
- AND `managed_by_app` sigue `false`

#### Scenario: Tras revertir, la prioridad calculada también sobrevive al sync (S-2)
- GIVEN un ticket de Zoho propagado y luego revertido por la desmarcación del cliente
- WHEN corre `upsertTicket` con otra prioridad en el payload
- THEN `tickets.priority` conserva la calculada y la marca sigue puesta

#### Scenario: `upsertTicket` nunca escribe `prioridad_en_app_at`
- GIVEN una fila con la marca de prioridad y otra sin ella
- WHEN `upsertTicket` procesa las dos
- THEN la marca de ninguna cambia por esa pasada

#### Scenario: La guarda de `managed_by_app` sigue primera
- GIVEN una fila con `managed_by_app = true` y con las dos marcas (`ov_elegida_en_app_at` y
  `prioridad_en_app_at`) puestas
- WHEN `upsertTicket` procesa un payload con valores distintos en todo
- THEN no se escribe ninguna columna y no se avisa ninguna discrepancia

#### Scenario: Las dos marcas son independientes
- GIVEN una fila con las dos marcas puestas, `managed_by_app = false`, y un payload distinto en
  `orden_venta`, `fecha_orden_venta`, `priority` y `subject`
- WHEN `upsertTicket` procesa la fila
- THEN `orden_venta`, `fecha_orden_venta` y `priority` conservan lo guardado
- AND `subject` se actualiza
- AND una fila con sólo la marca de prioridad sí actualiza `orden_venta` y `fecha_orden_venta`

#### Scenario: El ajuste manual de prioridad sigue usando `managed_by_app`
- GIVEN un ticket al que un usuario con permiso ajusta la prioridad a mano (`tickets-core` RQ-TC-29)
- WHEN termina el ajuste
- THEN `managed_by_app` es `true` y la marca `prioridad_en_app_at` no se ha puesto por esa vía

#### Scenario: La columna nueva es sin calificar, va al final y no entra en `TICKET_COLS`
- GIVEN `schema.sql` y `TICKET_COLS`
- WHEN se recorren sus sentencias `ALTER TABLE` y la lista de columnas
- THEN la de `prioridad_en_app_at` es `ALTER TABLE tickets ...` sin calificar, va detrás de todas las anteriores,
  y `prioridad_en_app_at` no está en `TICKET_COLS`
- AND el guardián de calificación de `migrate.test.ts` sigue en verde
