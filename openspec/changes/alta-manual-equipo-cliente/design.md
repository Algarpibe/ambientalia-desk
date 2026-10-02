# Diseño: alta manual de equipo y cliente desconocidos (F1B-15)

Medido el 2026-10-02 en el worktree `alta-manual-equipo-cliente`, partiendo de `132d25f`. Toda línea citada
se leyó en el worktree. Lo que no lleva ruta y línea lleva «hipótesis».

**Revisión del 2026-10-02** (`decision/f1b15-clientes-provisionales-sin-tocar-la-vista`, `openspec/config.yaml` →
`decisiones_de_gerencia_adenda`): la vista `public.clients` (`schema.sql:169-173`) **no cambia**. El sondeo 1.0
demostró que pg-mem no admite `CREATE OR REPLACE VIEW` sobre una vista existente (`View.drop` → «Method not
implemented», `node_modules/pg-mem/src/schema/view.ts:48`) ni parsea `DROP VIEW`. Se retira D3, se rehace D2 y
D12, y los provisionales se resuelven con una **segunda consulta** en `apps/desk/server` (RQ-TC-34, RQ-ZS-16).
`packages/zoho-sync/src/books/repo.ts` y el worker del hub no se tocan.

## 1. Enfoque

Cuatro piezas, cada una en módulo propio; en los ficheros muy citados sólo **ediciones en la misma línea** o
**añadidos al final** (regla de mutación 4):

1. **Datos**: tabla `public.clientes_provisionales` y columna `equipos.pendiente_validar`, al final de `schema.sql`.
   La vista queda intacta.
2. **Resolución de provisionales** en `apps/desk/server`: búsqueda, ficha, nombre en listados (D2, D13).
3. **Alta manual, enlace, validación y guarda B** (D7-D11).
4. **Interfaz**: modo manual en `CreateTicket.tsx`, aviso y acciones en `HojaDeVida.tsx`, marca en el listado.

## 2. Decisiones

| # | Decisión | Elegida | Descartadas y por qué |
|---|---|---|---|
| D1 | Dónde vive el cliente provisional | `public.clientes_provisionales`, **calificada**, al final de `schema.sql`, en `PUBLIC_TABLES` (`migrate.ts:70-73`, añadido en la misma línea `:73`). Columnas: `id`, `razon_social`, `nit`, `contacto`, `telefono`, `correo`, `motivo`, `creado_por_id`, `creado_por_nombre`, `created_at`, `enlazado_a`, `enlazado_por_id`, `enlazado_por_nombre`, `enlazado_at` | Escribir en `books.contacts`: rompe la réplica del hub y es escribir datos de Zoho (`p44`). Tabla en `desk`: es el dominio de Zoho Desk (`migrate.ts:62-64`) |
| D2 | Cómo se resuelven los provisionales (**REHECHA**) | Servicio nuevo `apps/desk/server/services/clientes.ts` sobre lecturas de `apps/desk/server/db/clientesProvisionales.ts`. `obtenerCliente(db, id)`: **primero** `getClient` de Books (`books/repo.ts:129`) sin cambios; si devuelve `null` **y** el id empieza por `PREFIJO_PROVISIONAL`, lee `clientes_provisionales`; si está enlazado, devuelve el contacto de Books de `enlazado_a`. `buscarClientes(db, q, incluirProvisionales)`: `searchClients` de Books (`books/repo.ts:117`) más, si se pide, los provisionales **no enlazados** cuyo nombre o NIT casen. Todo resultado lleva `provisional: false\|true`. Detalle por llamador en §4 | Vista con `UNION ALL` (D2 y D3 anteriores): pg-mem no puede reemplazar la vista, y lo probado no sería lo que corre. Segunda consulta dentro de `books/repo.ts`: ese módulo lo consume también el worker del hub (`books/repo.ts:142-143`) y la decisión lo excluye. `JOIN` extra en `packages/zoho-sync/src/db/repo.ts:147`, `:162`, `:182`, `:202`: no es una segunda consulta en la capa de servicio de la app |
| D3 | ~~Vista en dos sentencias~~ | **RETIRADA el 2026-10-02.** `schema.sql:169-173` no se edita; no hay segunda definición de la vista, ni migración de vista en producción, ni `DROP VIEW` de reversión | — |
| D4 | Identificador del provisional | `prov-` + `randomUUID()` (`PREFIJO_PROVISIONAL` en `packages/shared/src/altaManual.ts`). El prefijo es lo que distingue un id provisional; un id de Books se resuelve por Books **antes** de mirar el prefijo, así que su camino no cambia (hipótesis: los `contact_id` de Books son numéricos y nunca empiezan por `prov-`) | Secuencia numérica: colisión posible con Books |
| D5 | Columnas de `equipos` | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean`, **sin calificar** (`equipos` está en `DESK_TABLES`, `migrate.ts:63-64`), sin relleno, `NULL` ≡ no pendiente. «No catalogado» = `modelo_id IS NULL` con `modelo` en texto | Columnas de traza en `equipos`: duplican `public.equipos_cambios` (`schema.sql:485-506`) |
| D6 | Traza | Equipo: filas en `equipos_cambios` con `campo` `altaManual`, `validacion` y `clientId`. Cliente: columnas de su tabla. `CambioEquipo['campo']` se amplía en sitio (`packages/shared/src/types.ts:555`) | Tabla de traza nueva |
| D7 | Escalones del alta manual | **A** en `ticketService.ts:25` y en la línea vacía `:28`: presencia de serial, confirmación, modelo o (marca, texto, tipo), motivo y los cinco datos; `modeloId` existente. **C** en `:91`, junto a `validarCamposEquipoNuevo`: serial ≠ confirmación, reservados presentes (salvo C-1), provisional junto con `clientId` u orden de venta | Comparar el serial en `:25`: C antes que el A de `:39` |
| D8 | Clasificación (**corregida por C-1**) | `b.equipoManual` activa el modo manual en cualquier clasificación. En «Equipo nuevo» la **fecha de factura sigue obligatoria** (F1B-14, `equipoNuevo.ts:40`) y el modo manual sólo relaja el modelo de catálogo; fuera de «Equipo nuevo» se rechazan fecha de factura, fin de garantía y mantenedor (RQ-HV-17) | Relajar también la fecha en «Equipo nuevo»: contradice `decision/equipo-nuevo-alta-en-ticket` |
| D9 | Guarda de «Habilitar Servicio» | Escalón **B**, `422`, al final de la cadena de `ticketService.ts:131`, tras `exigirVerificacion(gas)` y antes de `:132`. Predicado puro `motivoAltaPendiente` en `packages/shared/src/altaManual.ts`; la lectura usa `obtenerCliente` (campo `provisional`) y `getEquipo`, en función al final de `ticketService.ts`, sin consultar si `t.id !== 'habilitar_servicio'` | Escalón C (`transitions-st/spec.md:1156`). `409`: el `422` lo fija el criterio 5 |
| D10 | Enlace del cliente (alineado con RQ-TC-32) | `POST /api/clientes-provisionales/:id/enlace {contactId}`. Orden: A `404` provisional · A `404` contacto inexistente en Books (`getClient` de Books, que no ve provisionales) · B `403` sin Comercial ni admin (`equipoComercial.ts:31-33`) · B `409` ya enlazado · C `422` `contactId` ausente o con prefijo provisional. Una `enTransaccion`: `UPDATE clientes_provisionales … WHERE id=$1 AND enlazado_a IS NULL RETURNING id` (vacío → `409`), `UPDATE tickets SET client_id`, `UPDATE equipos SET client_id, cliente_nombre`, una fila `clientId` por equipo | Sin transacción: tickets y equipos repartidos. `SELECT … FOR UPDATE`: hipótesis de que pg-mem no lo soporta |
| D11 | Validación del equipo | `POST /api/equipos/:id/validacion`. A `404` · B `403` · B `409` si no está pendiente. `registrarEdicion` (`db/equiposCambios.ts:21-38`) | Por el `PATCH` de `routes/equipos.ts:73` |
| D12 | Contratos, Top 5, mantenedor, alta de equipos (**REHECHA**) | **Sin cambios de código.** Como la vista no ve provisionales, `getClient` de Books ya los rechaza: `routes/contratos.ts:52` (`422`), `routes/prioridad.ts:30` y `:38` (`404`), `routes/equipos.ts:56` (`422`) y `:171` (`422` de mantenedor). `backfillClientId.ts:103` lee la vista y no los ve. Se fijan con pruebas de caracterización | Rechazo explícito en cada ruta: código para algo que ya ocurre |
| D13 | Sólo el buscador del alta pide provisionales | `GET /api/clients?provisionales=1`; sin el parámetro la respuesta es la de hoy más `provisional: false`. Supuesto reversible | Incluirlos siempre: los selectores de contratos, Top 5 y mantenedor los ofrecerían y el servidor los rechazaría con «El cliente no existe» |

Riesgo aceptado de D10: un alta con el id provisional justo después del enlace queda apuntando a un provisional
enlazado. `obtenerCliente` sigue `enlazado_a`, así que su nombre se resuelve por Books y la guarda B no lo bloquea;
el `client_id` del ticket queda provisional. Ventana de milisegundos; se anota, no se cubre.

## 3. Flujo

```
CreateTicket ─GET /api/clients?provisionales=1─▶ buscarClientes ─▶ searchClients (Books) + clientesProvisionales
CreateTicket ─POST /api/tickets─▶ createManagedTicket
   A :25/:28 · … · :89 obtenerCliente · C :91 validarContenidoAltaManual · D :96
   └─ crearTicketConEquipo (enTransaccion): provisional → equipo (pendiente) → equipos_cambios → ticket → OV
Listados ─▶ db/ticketsConCliente (getActive/Closed/All/TicketWithRefs) ─▶ repo de zoho-sync + nombres provisionales
HojaDeVida ─POST …/enlace─▶ enTransaccion · ─POST /api/equipos/:id/validacion─▶ registrarEdicion
TransitionPanel ─habilitar_servicio─▶ :131 … exigirVerificacion → exigirAltaValidada (B, 422)
```

## 4. Llamadores: quién necesita los provisionales

Medido hoy: **12 llamadas** a `getClient` en `apps/desk/server` sin pruebas; la cifra de 24 de `proposal.md:55` no
se reproduce (hipótesis: contaba importaciones, comentarios y pruebas).

| Llamador | ¿Provisionales? | Cómo |
|---|---|---|
| `services/ticketService.ts:89` | Sí: un ticket de un equipo manual o un provisional reutilizado | `obtenerCliente`, en sitio; import `:4` en sitio |
| `services/ticketService.ts:73` | Sí, sólo el nombre del mensaje `422` | `obtenerCliente`, en sitio |
| `routes/directory.ts:26` (ficha) | Sí | `obtenerCliente`; `404` si no está en ninguno |
| `routes/directory.ts:16` (búsqueda) | Sí, con `provisionales=1` | `buscarClientes`; import `:3` en sitio |
| `routes/remision.ts:203`, `:307` | Sí: documento de remisión | `obtenerCliente`, en sitio; import `:10` en sitio |
| `routes/equipos.ts:81` (`PATCH`) | Sólo si es el **mismo** cliente que ya tiene el equipo | `clienteParaEquipo(db, id, actual.clientId)`, en sitio: un provisional distinto → `null` → `422` |
| `routes/equipos.ts:56`, `:171`; `routes/contratos.ts:52`; `routes/prioridad.ts:30`, `:38`; `services/avisoRitmoContrato.ts:40` | No | Sin cambios (D12) |

Otras lecturas de la vista: `db/ticketFuentes.ts:172-174` (nombre para historial y conversación) → `obtenerCliente`,
en sitio, sí. `analisis.ts:12-16` → `t.client_id` en `:12` y nombres provisionales con una segunda consulta tras
`:18`, sí, sin marca. `db/equipos.ts:167`, `db/equiposCambios.ts:50-51` (mantenedor) y `db/prioridadCliente.ts:49`
(Top 5) → no: allí nunca hay provisional.

**Nombre en los listados.** Los cuatro `LEFT JOIN clients` de `packages/zoho-sync/src/db/repo.ts:147`, `:162`,
`:182`, `:202` no se tocan. `apps/desk/server/db/ticketsConCliente.ts` (nuevo) envuelve `getActiveTickets`,
`getClosedTickets`, `getAllTickets` y `getTicketWithRefs` con la misma firma: si `refs.accountName` es nulo y el
`client_id` lleva el prefijo, una consulta `WHERE id IN (…)` sobre los provisionales rellena el nombre y pone
`refs.clienteProvisional = true`. Los llamadores sólo cambian su línea de import: `routes/tickets.ts:5`,
`routes/prioridad.ts:4`, `services/ticketService.ts:2`, `routes/remision.ts:5`. La marca viaja por
`TicketRefs` (`packages/zoho-sync/src/db/mappers.ts:185`) y el mapeo (`:199` listado, `:246` ficha), en sitio, y el
tipo `Ticket` de `packages/shared/src/types.ts:99`. Supuesto reversible: `mappers.ts` no es `books/repo.ts` ni el
worker, y el cambio es un campo opcional.

## 5. Ficheros y lotes

| Fichero | Acción | Lote |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | Sólo **al final**: `CREATE TABLE public.clientes_provisionales` y el `ALTER` de `equipos`. `:169-173` intacta | 1 |
| `packages/zoho-sync/src/db/migrate.ts` | `clientes_provisionales` al final de `:73` | 1 |
| `packages/zoho-sync/src/db/migrate.test.ts` | En sitio: `:284`, `:285`, `:286` 39→40; `:376` 43→44; `:378` 22→23 (`:377` sigue en 21). Al final: prueba de la vista intacta | 1 |
| `packages/shared/src/types.ts`, `altaManual.ts`, `index.ts` | `provisional?` en `:301`; `clienteProvisional?` en `:99`; `pendienteValidar?`; `:555`. `PREFIJO_PROVISIONAL`, `serialesCoinciden`; export al final | 1 |
| `apps/desk/server/db/clientesProvisionales.ts`, `services/clientes.ts`, `db/ticketsConCliente.ts` | Nuevos: lecturas, `obtenerCliente`, `buscarClientes`, `clienteParaEquipo`, envoltorio de listados | 1 |
| `routes/directory.ts:3`, `:16`, `:26`; `routes/remision.ts:5`, `:10`, `:203`, `:307`; `routes/tickets.ts:5`; `routes/prioridad.ts:4`; `routes/equipos.ts:81`; `db/ticketFuentes.ts:172-174`; `analisis.ts`; `mappers.ts:185`, `:199`, `:246` | En sitio (salvo `analisis.ts`, poco citado) | 1 |
| `services/altaManual.ts` (nuevo), `ticketService.ts` (`:21`, `:24`, `:25`, `:28`, `:89`, `:91`, `:107`, imports), `equipoNuevo.ts:80-99`, `db/equipos.ts`, `routes/tickets.ts:125` | Alta manual | 2 |
| `db/clientesProvisionales.ts` (enlace), `routes/altaManual.ts` (nuevo), `ticketService.ts:131` cola y función al final, `packages/shared/src/altaManual.ts` (`motivoAltaPendiente`) | Enlace, validación, guarda B | 3 |
| `CreateTicket.tsx`, `HojaDeVida.tsx`, `TransitionPanel.tsx`, `TicketCard.tsx`, `src/api/client.ts` (al final) | Interfaz | 4 |

`books/repo.ts`, la vista, `contratos.ts`, `backfillClientId.ts` y el worker **no** figuran en el diff.

## 6. Casilla de la regla 13

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Pide el serial dos veces y avisa si difieren | `validarContenidoAltaManual`, `ticketService.ts:91` (C) |
| Oculta fin de garantía y mantenedor (y la fecha de factura fuera de «Equipo nuevo», C-1) | El mismo validador (`CAMPOS_COMERCIALES_RESTRINGIDOS`, `equipoComercial.ts:14`) |
| Exige los cinco datos y el motivo | `exigirClienteProvisional`, `ticketService.ts:28` (A) |
| Ofrece el equipo existente si el serial ya está | `exigirEquipoManual` con `getEquipoBySerial` (gesto de `equipoNuevo.ts:46-47`) |
| No combina provisional con OV o cliente existente | `validarContenidoAltaManual`, `:91` (C) |
| Sólo el buscador del alta ofrece provisionales | No es la guarda: `getClient` de Books los rechaza en `contratos.ts:52`, `prioridad.ts:30`/`:38`, `equipos.ts:56`/`:171` (D12) |
| No deja reasignar un equipo a otro provisional | `clienteParaEquipo`, `routes/equipos.ts:81` |
| Desactiva «Habilitar Servicio» con algo pendiente | `exigirAltaValidada`, cola de `ticketService.ts:131` (B) |
| «Enlazar» y «Validar» sólo a Comercial o admin | `403` de `routes/altaManual.ts` |
| Marca «provisional» en buscador, ficha y listado | Sin imposición: presentación de `provisional` / `clienteProvisional` |

Las líneas de las rutas nuevas se fijan en `verify`, contra el árbol de ese día.

## 7. Pruebas (strict TDD) y mutaciones

| Prueba | Fichero | Lote |
|---|---|---|
| RQ-TC-34: búsqueda con ambos y marcas; enlazado no listado; ficha provisional; ficha de Books idéntica con `provisional:false`; inexistente `404`; listado con nombre y marca; prioridad de Books con espía (cero consultas a `clientes_provisionales` para un id de Books) | `services/clientes.test.ts`, `db/ticketsConCliente.test.ts` | 1 |
| RQ-ZS-16: guardianes, vista intacta (texto de `:169-173` igual al de `132d25f`, sin `clientes_provisionales` ni `provisional`) | `migrate.test.ts` | 1 |
| Alta: criterios 1-4, C-1, atomicidad, espías (TC-33), P3 | `services/altaManual.test.ts` | 2 |
| Enlace y validación (orden `404`·`403`·`409`·`422`), guarda B, P1, P2 | `routes/altaManual.test.ts`, `ticketService.test.ts` al final | 3 |
| D12: un id provisional rechazado en contratos, Top 5, mantenedor y alta de equipos | `routes/altaManual.test.ts` | 3 |

Las de D12 nacen **verdes** (caracterización): su rojo previo se obtiene por mutación, cambiando `getClient` por
`obtenerCliente` en `contratos.ts:52` → rojo; se revierte.

**Regla 1, posición:** (P1) pendiente + sin Comercial → `403`; mover la guarda antes de `:129` → rojo. (P2)
pendiente + Comercial sin OV obligatoria → `422` de pendiente, no el de `:134`. (P3) serial distinto + OV usada →
`422`, no `409`; mover la comparación detrás de `:96` → rojo. (P4) en `obtenerCliente`, poner la consulta de
provisionales antes que Books → rojo la prueba de prioridad.

**Regla 2, ensuciar lo vigilado:** (m1) quitar `public.` del `CREATE TABLE` nuevo; (m2) `ALTER TABLE public.equipos`;
(m3) añadir `clientes_provisionales` o una columna `provisional` a `:169-173`; (m4) quitar la entrada de
`PUBLIC_TABLES`. Cada una pone rojo un guardián y se revierte con `git diff`.

## 8. Barrido de citas al cierre (regla 4)

`grep -rnoE "(ticketService|schema|migrate|equipoNuevo|repo|equipos|types|directory|remision|tickets|prioridad|ticketFuentes|analisis|mappers)\.(ts|sql):[0-9]+(-[0-9]+)?"`
más el pase abreviado. Se esperan **cero desplazamientos** salvo `analisis.ts`; cambia lo que **afirman**
`ticketService.ts:89`, `:131`, `remision.ts:203`/`:307` y `directory.ts:21-26`: se leen y se reparan por caso A/B/C.

## 9. Presupuesto

Un intento por lote, en este worktree. Techo 800, válvula 720. Medida: `git diff --shortstat --no-renames` contra
el commit de partida más `wc -l` de lo nuevo sin trackear.

| Intento | Contenido | Estimación |
|---|---|---|
| Lote 1 | Esquema, tipos, resolución de provisionales (RQ-ZS-16, RQ-TC-34) | ~340 (código ~140, pruebas ~200) |
| Lote 2 | Alta manual y traza (RQ-TC-30/31/33, RQ-HV-16/17, C-1) | ~360 (código ~140, pruebas ~220) |
| Lote 3 | Enlace, validación, guarda B, caracterización de D12 | ~320 (código ~110, pruebas ~210) |
| Lote 4 | Interfaz (`.tsx` fuera de la red, F0-00) | ~270 |

Total ~1.290 frente a ~1.085 del diseño anterior: +205, por encima de las 100-150 de la decisión. La diferencia son
las pruebas de RQ-TC-34 (siete escenarios) y la caracterización de D12; la vista retirada ahorra ~70. Ningún lote
pasa de 400.

## 10. Matriz de amenazas

N/A: sin rutas de shell, subprocesos, automatización de VCS ni clasificación de ejecutables.

## 11. Despliegue

Aditivo: una tabla y una columna nuevas. No hay migración de vista. Reversión: `git revert` de los lotes; la tabla
y la columna quedan sin uso (borrarlas toca producción y lo decide una persona).

## 12. Preguntas abiertas

Ninguna bloquea. Q1-Q4 siguen como supuestos de la propuesta. Supuestos nuevos, reversibles: D13 (parámetro
`provisionales=1`) y la marca en `mappers.ts` (§4).
