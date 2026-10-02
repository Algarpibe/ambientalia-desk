# Diseño: alta manual de equipo y cliente desconocidos (F1B-15)

Medido el 2026-10-02 en el worktree `alta-manual-equipo-cliente`, partiendo de `132d25f`. Toda línea citada
se leyó en el worktree. Lo que no lleva ruta y línea lleva «hipótesis».

**Revisión del 2026-10-02** (`decision/f1b15-clientes-provisionales-sin-tocar-la-vista`, `openspec/config.yaml` →
`decisiones_de_gerencia_adenda`): la vista `public.clients` (`schema.sql:169-173`) **no cambia**. El sondeo 1.0
demostró que pg-mem no admite `CREATE OR REPLACE VIEW` sobre una vista existente (`View.drop` → «Method not
implemented», `view.ts` de pg-mem, línea 48 de `src/schema`) ni parsea `DROP VIEW`. Se retira D3, se rehace D2 y
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
| D7 | Escalones del alta manual | **A** en `ticketService.ts:25` y en `:28`, que era una línea vacía y hoy lleva `exigirClienteProvisional`: presencia de serial, confirmación, modelo o (marca, texto, tipo), motivo y los cinco datos; `modeloId` existente. **C** en `:91`, junto a `validarCamposEquipoNuevo`: serial ≠ confirmación, reservados presentes (salvo C-1), provisional junto con `clientId` u orden de venta. **D** en `:96`, junto a la unicidad de la OV: NIT del provisional ya en Books → `409` con el existente (P-B, §4.6) | Comparar el serial en `:25`: C antes que el A de `:39`. NIT en Books como `422` de C: es unicidad, no contenido (orden total de F1B-10) |
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

## 4. Lectores de clientes: en cuál entra el provisional y en cuál no

Inventario medido el 2026-10-02 en este worktree, tras fusionar `ad0f7a6`; cada línea se leyó en el árbol. Hay **dos
puntos de paso** en Books —`searchClients` (`books/repo.ts:117`) y `getClient` (`books/repo.ts:129`)—, **siete
lecturas SQL directas** de la vista y **ninguna clave foránea**: `tickets.client_id` (`schema.sql:185`) y
`equipos.client_id` (`schema.sql:208`) son `text`. Lo que no se cambia, se deja como está **a propósito** y con su
razón; nada queda «sin mirar». La regla general: el provisional entra donde un usuario **ve un ticket o un equipo que
ya lo lleva**, y no entra donde se **elige un cliente para un contrato, una prioridad o un mantenedor**, ni donde se
**valida que un cliente exista** en Books.

### 4.1 Búsqueda y ficha

| Sitio | Qué hace | ¿Provisional? | Cómo |
|---|---|---|---|
| `routes/directory.ts:16` · `GET /api/clients?search=` | Buscador de clientes (alta de ticket, contratos, Top 5, mantenedor, equipos) | **Sí, sólo con `provisionales=1`** (D13): lo pide el alta de ticket | `buscarClientes`; sin el parámetro, la respuesta de hoy más `provisional:false` |
| `routes/directory.ts:26` · `GET /api/clients/:id` | Ficha de cliente | **Sí** | `obtenerCliente`; `404` si no está en ninguno |
| `db/directory.ts:16-62` · `/api/accounts`, `/api/contacts` (`ClientesPage`, `ClienteDetalle`) | Directorio de cuentas de Zoho Desk | **No, a propósito**: lee `desk.accounts`/`desk.contacts`, no Books; el provisional no es una cuenta de Desk | Sin cambios |

### 4.2 Listados y detalle de tickets

| Sitio | Qué hace | ¿Provisional? | Cómo |
|---|---|---|---|
| `packages/zoho-sync/src/db/repo.ts:147`, `:162`, `:182`, `:202` (`getActiveTickets`, `getClosedTickets`, `getAllTickets`, `getTicketWithRefs`) → tablero, `/api/mis-tickets` (`routes/prioridad.ts:85`), cerrados, todos, ficha del ticket (`routes/tickets.ts:130`), respuestas de alta y transición, `GET /api/remisiones/nueva` (`routes/remision.ts:62`) | Nombre del cliente por `LEFT JOIN clients` | **Sí, con marca** | `db/ticketsConCliente.ts` (envoltorio, detalle abajo); los `JOIN` no se tocan |
| `db/ticketFuentes.ts:172` → historial (`db/historial.ts:134`) y conversación (`db/conversacion.ts:149`) | Campo «Cliente» y «Ticket creado para X» | **Sí, sin marca** | `obtenerCliente`, en sitio |
| `db/equipos.ts:59` · `GET /api/equipos?clientId=` | Equipos de un cliente | **Sí, ya funciona**: filtra por `client_id` y enseña `cliente_nombre` copiado | Sin cambios |
| `HojaDeVida.tsx` (`eq.clienteNombre`) | Nombre del cliente en la hoja de vida | **Sí, ya funciona** por la copia de `cliente_nombre` que escribe el alta | Sin cambios; la marca de «pendiente» la pone el lote 4 |

**Nombre en los listados.** Los cuatro `LEFT JOIN clients` de `packages/zoho-sync/src/db/repo.ts:147`, `:162`,
`:182`, `:202` no se tocan. `apps/desk/server/db/ticketsConCliente.ts` (nuevo) envuelve `getActiveTickets`,
`getClosedTickets`, `getAllTickets` y `getTicketWithRefs` con la misma firma: si `refs.accountName` es nulo y el
`client_id` lleva el prefijo, una consulta `WHERE id IN (…)` sobre los provisionales rellena el nombre y pone
`refs.clienteProvisional = true`. Los llamadores sólo cambian su línea de import: `routes/tickets.ts:5`,
`routes/prioridad.ts:4`, `services/ticketService.ts:2`, `routes/remision.ts:5`. La marca viaja por
`TicketRefs` (`packages/zoho-sync/src/db/mappers.ts:185`) y el mapeo (`:199` listado, `:246` ficha), en sitio, y el
tipo `Ticket` de `packages/shared/src/types.ts:8` (corregido al aplicar: `:99` era `accountName` del ticket crudo de Zoho). Supuesto reversible: `mappers.ts` no es `books/repo.ts` ni el
worker, y el cambio es un campo opcional.

### 4.3 Informes

| Sitio | Qué hace | ¿Provisional? | Cómo |
|---|---|---|---|
| `analisis.ts:17` · `GET /api/analisis` | Cliente por ticket en el análisis | **Sí, sin marca** | Segunda consulta tras el `SELECT`, en `analisis.ts` (poco citado) |
| `db/prioridadCliente.ts:49` · `GET /api/top5` | Nombre en el Top 5 | **No, a propósito**: un provisional no puede entrar en el Top 5 (`routes/prioridad.ts:38`, D12) | Sin cambios |
| `db/informeContrato.ts` · `GET /api/contratos/:id/informe` | Informe de contrato | **No**: no lee cliente; y un provisional no puede tener contrato (`routes/contratos.ts:52`) | Sin cambios |

### 4.4 Avisos y documentos que salen de la app

| Sitio | Qué hace | ¿Provisional? | Cómo |
|---|---|---|---|
| `services/avisoRitmoContrato.ts:40` | Nombre en el aviso de ritmo de contrato | **No, a propósito**: sólo hay avisos de contratos, y un provisional no tiene contrato | Sin cambios |
| `services/avisoDiscrepanciaOV.ts`, `avisoArea.ts`, `avisoDerivacion.ts`, `alarmasSla.ts`, `avisosWebhook.ts` | Avisos | **No aplica**: no leen cliente | Sin cambios |
| `routes/remision.ts:203` · `POST /api/remisiones` | Copia `empresa` y `persona_contacto` en la remisión (`:258`) | **Sí** | `obtenerCliente`, en sitio |
| `routes/remision.ts:307` + `remisionWebhook.ts:31` · `POST /api/remisiones/:id/enviar` (carga a n8n) | Nombre, dirección, teléfono, NIT, correo del documento | **Sí** | `obtenerCliente`, en sitio; el provisional no tiene dirección: la carga la lleva vacía |
| `db/remisiones.ts:95` | Listado de remisiones | **Ya funciona**: lee la copia `r.empresa` | Sin cambios |

### 4.5 Validaciones de existencia y selectores de contrato, prioridad y mantenedor

| Sitio | ¿Provisional? | Por qué |
|---|---|---|
| `services/ticketService.ts:89` (alta) y `:73` (mensaje `422`) | **Sí** | Un ticket de un provisional reutilizado; `obtenerCliente`, en sitio |
| `routes/equipos.ts:81` (`PATCH`) | **Sólo el mismo** que ya tiene el equipo | `clienteParaEquipo`: un provisional distinto → `422` |
| `routes/equipos.ts:56` (`POST`), `:171` (mantenedor), `routes/contratos.ts:52`, `routes/prioridad.ts:30`, `:38` | **No, a propósito** (D12) | Contrato, prioridad, mantenedor y alta de equipo fuera del ticket exigen cliente de Books; `getClient` ya los rechaza |
| `db/equipos.ts:167`, `db/equiposCambios.ts:50-51` | **No, a propósito** | Nombre del **mantenedor**, que nunca es provisional (`routes/equipos.ts:171`) |
| `backfillClientId.ts:103`, `:115` | **No, a propósito** | Sólo reconcilia equipos con `client_id IS NULL`; un equipo provisional lleva `prov-…` y no entra |
| `books/repo.ts:145-181` (órdenes de venta) | **No aplica** | Un provisional no lleva orden de venta (C, `validarContenidoAltaManual`) |
| `apps/hub-sync` | **No aplica** | Escribe `books.contacts`, no lo lee |

### 4.6 Cuando el cliente se da de alta después en Books

**Cómo se une.** Comercial crea el contacto a mano en Books (RQ-TC-33: la app no escribe en Zoho); el hub lo replica
a `books.contacts` y aparece en la vista. Desde ese momento, y **hasta que alguien enlace**, el buscador del alta
enseña los dos —el de Books con `provisional:false` y el provisional marcado—. La unión es el **enlace** (D10,
RQ-TC-32), que en una sola transacción:

1. marca el provisional como enlazado (`enlazado_a`, quién, cuándo), así que **deja de listarse** (RQ-TC-34);
2. reescribe `tickets.client_id` y `equipos.client_id` + `equipos.cliente_nombre` de **todos** sus tickets y equipos
   al id de Books, con una fila `clientId` por equipo en `equipos_cambios`.

**Por qué no se pierden tickets.** No hay clave foránea que romper (`schema.sql:185`, `:208`); la reescritura es una
`enTransaccion` (todo o nada, escenario «fallo a mitad»); el sincronizador **no pisa** `client_id`, porque no está en
`TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:43-54`); `backfillClientId.ts:115` sólo toca `client_id IS NULL`; y
un id provisional que se quede suelto (riesgo aceptado de D10) lo sigue resolviendo `obtenerCliente` por `enlazado_a`.
Contratos, prioridad y mantenedor no hay que reescribirlos: nunca pudieron apuntar a un provisional (D12).

**Lo que queda a propósito con el nombre provisional:** la remisión ya emitida conserva su `empresa` copiada
(`routes/remision.ts:203`, comentario de `:201`): es un documento, y no puede desdecir lo que dijo. Caso histórico.

**P-B · Lo que SÍ resuelve: no se crea un provisional de un cliente que ya está en Books.** Decidido por el usuario el
2026-10-02, dentro de esta tanda. El alta manual compara el NIT del provisional con los de la vista y, si casa,
responde `409` (escalón D, junto a la unicidad de la OV en `ticketService.ts:96`) con el `id` y el nombre del cliente
existente, sin escribir nada; el formulario lo ofrece para usarlo. **Normalización** (supuesto reversible): se compara
la parte anterior al primer guion, sólo dígitos —«900.123.456-7» ≡ «900123456»—; un DV pegado sin guion
(«9001234567») sólo casa si es exactamente base + DV del NIT de Books (`nitCoincide`, tarea 2.7b). **Orden dentro
de D:** NIT antes que OV, para que el `409` de la OV siga siendo el último (RQ-TC-31), fijado en
`primerConflictoUnicidad` (P6, §7). **Lectura**: `SELECT id, name, nit
FROM clients WHERE nit IS NOT NULL` y comparación en JS, en `db/clientesProvisionales.ts`; no usa `regexp_replace`
para que lo probado en pg-mem sea lo que corre (hipótesis: el coste de recorrer los contactos es aceptable para un alta
manual, que es excepcional). Sin NIT casado, el alta sigue. No cubre el caso de P-A: un contacto que **llega después**
a Books.

**Lo que este cambio NO resuelve — pendiente con fila** (en «Tareas de persona» de `tasks.md`, y en
`docs/sdd/ENTRADA.md` al archivar, R-3):

- **P-A · Nadie avisa de que el contacto ya está en Books.** El enlace es manual; si Comercial no lo hace, conviven
  los dos y los tickets nuevos pueden seguir yendo al provisional (P-B no lo impide: el NIT entró en Books después del
  alta, y el alta de un ticket nuevo elige el cliente en el buscador, no crea otro provisional). Salida posible: un
  aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar. Decide alcance y destino
  Gerencia.

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
| Exige los cinco datos y el motivo | `exigirClienteProvisional`, `ticketService.ts`, en `:28`, que era una línea vacía (A) |
| Ofrece el equipo existente si el serial ya está | `exigirEquipoManual` con `getEquipoBySerial` (gesto de `equipoNuevo.ts:46-47`) |
| Ofrece el cliente de Books si el NIT ya está (P-B) | `409` del escalón D, `ticketService.ts:96` |
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
provisionales antes que Books → rojo la prueba de prioridad. (P5) serial distinto (C) + NIT ya en Books (D) → `422`,
no `409`; mover la comprobación del NIT delante de `:91` → rojo. (P6) NIT en Books y OV ya usada a la vez en
`primerConflictoUnicidad` → gana el NIT; invertir el orden → rojo. Por la API no compiten (provisional + OV es C).

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
| Lote 2 | Alta manual y traza (RQ-TC-30/31/33, RQ-HV-16/17, C-1, P-B) | ~400 (código ~160, pruebas ~240) |
| Lote 3 | Enlace, validación, guarda B, caracterización de D12 | ~320 (código ~110, pruebas ~210) |
| Lote 4 | Interfaz (`.tsx` fuera de la red, F0-00) | ~270 |

Total ~1.330 frente a ~1.085 del diseño anterior: +245, por encima de las 100-150 de la decisión. La diferencia son
las pruebas de RQ-TC-34 (siete escenarios), la caracterización de D12 y P-B (~40); la vista retirada ahorra ~70.
Ningún lote pasa de 400.

## 10. Matriz de amenazas

N/A: sin rutas de shell, subprocesos, automatización de VCS ni clasificación de ejecutables.

## 11. Despliegue

Aditivo: una tabla y una columna nuevas. No hay migración de vista. Reversión: `git revert` de los lotes; la tabla
y la columna quedan sin uso (borrarlas toca producción y lo decide una persona).

## 12. Preguntas abiertas

Ninguna bloquea. Q1-Q4 siguen como supuestos de la propuesta. Supuestos nuevos, reversibles: D13 (parámetro
`provisionales=1`), la marca en `mappers.ts` (§4.2) y la normalización del NIT de P-B (§4.6). Queda fuera, como
pendiente con fila y dueño Gerencia, P-A (aviso cuando el contacto aparece en Books después), §4.6.
