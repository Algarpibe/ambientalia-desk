# Delta for `zoho-sync`

Cambio `parche-iv11-orden-venta` (F1B-11, `cierra: no`). Añade una frontera de escritura **por
columna**, más fina que `managed_by_app`, para `orden_venta` y `fecha_orden_venta` cuando la fila
lleva una marca puesta por un escritor de la aplicación. Reduce IV-11 sin cerrarlo.

## MODIFIED Requirements

### Requirement: RQ-ZS-01 · `managed_by_app` es la frontera de escritura, no el discriminador de origen

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

## Fuera de alcance de este delta

- **Cambio 2 de F1B-11** — asociación OV↔ticket 1:N propia de la aplicación y subOV de lote
  (`decision/subov-lote-convencion`). No se toca ninguna tabla puente ni cardinalidad aquí.
- **Cambio 3 de F1B-11** — registro de contrato y prioridad (`decision/anexo-53-contratos`), que
  cierra la fila del plan (`cierra: si`). Este delta no cubre ese contenido.
- El relleno de filas existentes sin marca es decisión de persona, no de esta tanda (declarado en la
  propuesta; no se automatiza).
