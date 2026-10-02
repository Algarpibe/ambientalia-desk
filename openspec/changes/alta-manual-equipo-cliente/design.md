# Diseño: alta manual de equipo y cliente desconocidos (F1B-15)

Medido el 2026-10-02 en el worktree `alta-manual-equipo-cliente`, partiendo de `132d25f`. Toda línea citada
se leyó en el worktree. Lo que no lleva ruta y línea lleva «hipótesis».

## 1. Enfoque

Tres piezas, cada una en módulo propio, y en los ficheros muy citados sólo **ediciones en la misma línea**
o **añadidos al final** (regla de mutación 4):

1. **Datos**: tabla `public.clientes_provisionales`, columna `equipos.pendiente_validar`, la vista
   `public.clients` con `UNION ALL` y la columna `provisional` al final.
2. **Servidor**: alta manual dentro de `createManagedTicket` (guardas A y C en sus escalones), enlace y
   validación por Comercial en rutas nuevas, guarda B en `executeTransition` para `habilitar_servicio`.
3. **Interfaz**: modo manual en `CreateTicket.tsx`, aviso y acciones en `HojaDeVida.tsx`.

## 2. Decisiones

| # | Decisión | Elegida | Descartadas y por qué |
|---|---|---|---|
| D1 | Dónde vive el cliente provisional | `public.clientes_provisionales`, **calificada**, al final de `schema.sql`, en `PUBLIC_TABLES` (`migrate.ts:70-73`, añadido en la misma línea `:73`) | Escribir en `books.contacts`: rompe la réplica del hub y es escribir datos de Zoho (`DEPLOY.md:33-42`, `p44`). Tabla en `desk`: `desk` es el dominio de Zoho Desk (`migrate.ts:62-64`) |
| D2 | Cómo la ven los 24 llamadores de `getClient` | La vista `public.clients` pasa a `books.contacts UNION ALL clientes_provisionales WHERE enlazado_a IS NULL`, columnas idénticas en orden y tipo, `provisional` **la última** | Segunda consulta en `getClient`/`searchClients`: `books/repo.ts` lo consume también el worker del hub, donde la tabla de la app puede no existir (`books/repo.ts:142-143` lo dice de `tickets`). Vista nueva `clientes_todos`: obliga a tocar los cinco `LEFT JOIN clients` (`db/repo.ts:147`, `:162`, `:182`, `:202`, `analisis.ts:16`) |
| D3 | Cómo se cambia la vista sin desplazar `schema.sql` | **Dos sentencias**: `:169-173` se edita en sitio —misma cuenta de líneas— para añadir `false AS provisional` al final de `:172`; al final del fichero, tras el `CREATE TABLE`, un segundo `CREATE OR REPLACE VIEW public.clients` con el `UNION ALL` | Sustituir `:169-173` por comentario: quita una sentencia antes de la posición 116 y rompe `migrate.test.ts:519` y `:537`. Una sola definición al final dejando `:169` intacta: en el segundo arranque `:169` intenta quitar una columna, Postgres lo rechaza y `migrate` lo traga con un `console.error` en cada arranque (`migrate.ts:29-34`) |
| D4 | Identificador del provisional | `prov-` + `randomUUID()`. Nunca colisiona con un `contact_id` de Books (hipótesis: son numéricos) | Secuencia numérica: colisión posible con Books dentro del `UNION ALL` |
| D5 | Columnas de `equipos` | Una sola: `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean`, **sin calificar** (`equipos` está en `DESK_TABLES`, `migrate.ts:63-64`), sin relleno, `NULL` ≡ no pendiente. «No catalogado» = `modelo_id IS NULL` con `modelo` en texto | Columnas de traza en `equipos` (`alta_manual_por/at/motivo`): duplican `public.equipos_cambios`, que ya es la tabla inmutable de quién y cuándo (`schema.sql:485-506`) |
| D6 | Traza | Equipo: filas en `equipos_cambios` con `campo` `altaManual` (motivo en `valor_nuevo`), `validacion` y `clientId` (enlace). Cliente: columnas de la propia tabla (`motivo`, `creado_por_*`, `created_at`, `enlazado_*`). El tipo `CambioEquipo['campo']` se amplía en sitio (`packages/shared/src/types.ts:555`) | Tabla de traza nueva: tercera tabla para lo mismo |
| D7 | Escalones del alta manual | **A** en `ticketService.ts:25` y en la línea vacía `:28`: presencia de serial, confirmación, modelo o (marca, texto, tipo), motivo y los cinco datos del cliente; `modeloId` existente. **C** en `:91`, junto a `validarCamposEquipoNuevo`: serial ≠ confirmación, campos reservados presentes, cliente provisional junto con `clientId` u orden de venta | Comparar el serial en `:25`: sería C antes que el A de `:39` y rompería el orden total (`transitions-st` §3.8) |
| D8 | Clasificación | `b.equipoManual` presente activa el modo manual en **cualquier** clasificación; sin él, `:24-27` se comportan como hoy | Sólo fuera de «Equipo nuevo»: E-129 dice «cualquier equipo» (`ENTRADA.md:1555`) |
| D9 | Guarda de «Habilitar Servicio» | **Escalón B**, `422`, al final de la cadena de `ticketService.ts:131`, tras `exigirVerificacion(gas)` y antes de `:132`. Predicado puro `motivoAltaPendiente` en `packages/shared/src/altaManual.ts`; la lectura (`getClient` + `getEquipo`) en una función al final de `ticketService.ts`, como `veredictoDeLiberacion` (`:241-245`), sin consultar nada si `t.id !== 'habilitar_servicio'` | Escalón C: no valida lo que la petición aporta, sino si la operación puede ocurrir sobre ese sujeto ahora (definición de B, `openspec/specs/transitions-st/spec.md:1156`). `409`: el `422` lo fija el criterio 5 de la propuesta; el escalón no se decide por código HTTP (`:1146-1147`). Supuesto reversible |
| D10 | Enlace del cliente | `POST /api/clientes-provisionales/:id/enlace {contactId}`. Orden: A `404` provisional (URL) · A `422` contacto ausente, inexistente o provisional · B `403` sin Comercial ni admin (`puedeEditarCamposRestringidos`, `equipoComercial.ts:31-33`) · B `409` ya enlazado. Escritura en **una** `enTransaccion`: `UPDATE clientes_provisionales … WHERE id=$1 AND enlazado_a IS NULL RETURNING id` (vacío → `409`), `UPDATE tickets SET client_id`, `UPDATE equipos SET client_id, cliente_nombre … RETURNING id`, una fila `clientId` por equipo en `equipos_cambios` | Enlace sin transacción: un fallo deja tickets y equipos repartidos entre dos ids (criterio 6). `SELECT … FOR UPDATE`: hipótesis de que pg-mem no lo soporta; el `UPDATE` condicional cierra la carrera igual |
| D11 | Validación del equipo | `POST /api/equipos/:id/validacion`. A `404` · B `403` · B `409` si no está pendiente. `pendiente_validar=false` + fila `validacion` vía `registrarEdicion` (`db/equiposCambios.ts:21-38`), misma transacción. Sin exigir modelo de catálogo (Q4) | Validar por el `PATCH` de `routes/equipos.ts:73`: mezclaría la decisión con la edición de campos |
| D12 | `searchClients`, contratos, Top 5, mantenedor | `searchClients` **devuelve** los provisionales sin enlazar con `provisional: true` (`contact_type` `'customer'`), para reutilizarlos y no duplicar. Contratos (`routes/contratos.ts:52`), Top 5 (`routes/prioridad.ts:38`) y mantenedor (`routes/equipos.ts:174`) **rechazan** un provisional con `422`, en la misma línea. `backfillClientId.ts:103` filtra `provisional = false` | Que el enlace reescriba también `contratos`, `cliente_prioridad` y `mantenedor_id`: choca con la clave primaria de `cliente_prioridad` (`schema.sql:607`) y la propuesta deja contratos y Top 5 fuera |

Riesgo aceptado de D2/D10: un alta con el id provisional que entre justo después del enlace queda apuntando a un
provisional que la vista ya no enseña. Ventana de milisegundos con dos personas a la vez; se anota, no se cubre.

## 3. Flujo

```
CreateTicket (modo manual) ─POST /api/tickets─▶ createManagedTicket
   A :25 exigirEquipoManual · A :28 exigirClienteProvisional · … · C :91 validarContenidoAltaManual · D :96
   └─ crearTicketConEquipo (enTransaccion): cliente provisional → equipo (pendiente) → equipos_cambios(altaManual) → ticket → OV
HojaDeVida ─POST …/enlace─▶ enTransaccion: provisional.enlazado_a → tickets.client_id → equipos.client_id → equipos_cambios(clientId)
HojaDeVida ─POST /api/equipos/:id/validacion─▶ registrarEdicion: pendiente_validar=false + equipos_cambios(validacion)
TransitionPanel ─habilitar_servicio─▶ executeTransition :131 … exigirVerificacion → exigirAltaValidada (B, 422) → :132 C
```

## 4. Ficheros y líneas

| Fichero | Acción | Dónde |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | Editar `:172` en sitio; añadir al final la tabla, el `ALTER` de `equipos` y la vista final (comentarios sin punto y coma, `migrate.ts:20`) | Lote 1 |
| `packages/zoho-sync/src/db/migrate.ts` | `clientes_provisionales` al final de `:73` | Lote 1 |
| `packages/zoho-sync/src/db/migrate.test.ts` | Cifras en sitio (`:286` 39→40; `:374-378` 43→44, sin calificar 22→23); pruebas nuevas al final | Lote 1 |
| `packages/zoho-sync/src/books/repo.ts` | `provisional` en `:76-78`, `:120` y `:130`, en sitio | Lote 1 |
| `packages/shared/src/types.ts` | `provisional?` en `:301`, `pendienteValidar?` en `EquipoLite`, campos nuevos en `:555`, en sitio | Lote 1 |
| `packages/shared/src/altaManual.ts` (+ export al final de `index.ts`) | Nuevo: `PREFIJO_PROVISIONAL`, `motivoAltaPendiente`, `serialesCoinciden` | Lotes 1-2 |
| `apps/desk/server/services/altaManual.ts` | Nuevo: `exigirEquipoManual`, `exigirClienteProvisional`, `validarContenidoAltaManual`, `escribirAltaManual(q, …)` | Lote 1 |
| `apps/desk/server/services/ticketService.ts` | En sitio: `:21` (`actorId`), `:24`, `:25`, `:28` (vacía), `:89`, `:91`, `:107`; `:5`/`:6` imports; `:131` cola. Función nueva **al final** | Lotes 1-2 |
| `apps/desk/server/services/equipoNuevo.ts` | `crearTicketConEquipo` (`:80-99`, final del fichero) llama a `escribirAltaManual` | Lote 1 |
| `apps/desk/server/db/equipos.ts` | `pendiente_validar` en el `INSERT` de `createEquipo` (desde `:119`) y en `getEquipo`, en sitio | Lote 1 |
| `apps/desk/server/routes/tickets.ts` | `:125` pasa `req.user?.id` | Lote 1 |
| `apps/desk/server/db/clientesProvisionales.ts`, `routes/altaManual.ts` | Nuevos: lectura, enlace transaccional, validación | Lote 2 |
| `routes/contratos.ts:52`, `routes/prioridad.ts:38`, `routes/equipos.ts:174`, `backfillClientId.ts:103` | Rechazo / filtro del provisional, en sitio | Lote 2 |
| `apps/desk/src/components/CreateTicket.tsx`, `HojaDeVida.tsx`, `TransitionPanel.tsx`, `src/api/client.ts` (al final) | Interfaz | Lote 3 |

## 5. Casilla de la regla 13

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Pide el serial dos veces y avisa si difieren | `validarContenidoAltaManual`, llamada en `ticketService.ts:91` (C) |
| Oculta fecha de factura, fin de garantía y mantenedor en modo manual | El mismo validador rechaza las tres claves (`CAMPOS_COMERCIALES_RESTRINGIDOS`, `equipoComercial.ts:14`) |
| Exige los cinco datos del cliente y el motivo | `exigirClienteProvisional`, `ticketService.ts:28` (A) |
| Ofrece el equipo existente si el serial ya está | `exigirEquipoManual` reutiliza `getEquipoBySerial` (mismo gesto que `equipoNuevo.ts:46-47`) |
| No deja combinar cliente provisional con orden de venta o cliente existente | `validarContenidoAltaManual`, `:91` (C) |
| Desactiva «Habilitar Servicio» con algo pendiente | `exigirAltaValidada`, cola de `ticketService.ts:131` (B) |
| Enseña «Enlazar» y «Validar» sólo a Comercial o admin | `403` de `routes/altaManual.ts` |
| Etiqueta los provisionales en el buscador | Sin imposición: es presentación del campo `provisional` de la vista |

Las líneas de las rutas nuevas se fijan en `verify`, contra el árbol de ese día.

## 6. Pruebas (strict TDD) y mutaciones

Cada prueba nace roja antes de su código. Sondeo primero, en lote 1: **hipótesis** de que pg-mem admite
`CREATE OR REPLACE VIEW` sobre una vista existente y `UNION ALL` con `NULL::text`; si no, se para y se
consulta antes de seguir (cambia D2).

| Prueba | Fichero |
|---|---|
| Un id de Books se resuelve igual que antes y con `provisional: false` (RQ-ZS-09); un provisional sin enlazar se resuelve con `true`; uno enlazado deja de resolverse | `books/repo.test.ts` |
| Alta: criterios 1-4, transacción (fallo del `INSERT` del ticket no deja cliente ni equipo) | `services/altaManual.test.ts` |
| Enlace y validación: criterios 6-7, `404/403/409/422` y su orden | `routes/altaManual.test.ts` |
| Guarda: criterio 5 y soporte remoto sin bloqueo (Q3) | `ticketService.test.ts`, al final |

**Regla 1, posición** (las dos pruebas que activan la guarda nueva **y** una vecina a la vez):
- P1: ticket pendiente + usuario sin Comercial → `403` de área. Mover la guarda antes de `:129` → rojo.
- P2: ticket pendiente + Comercial sin la orden de venta obligatoria → `422` de pendiente, no el de
  obligatorios de `:134`. Mover la guarda detrás de `:134` → rojo.
- P3 (alta): serial que no coincide + orden de venta ya usada → `422` (C) y no `409` (D). Mover la comparación detrás de `:96` → rojo.

**Regla 2, ensuciar `schema.sql`** (cada una debe poner rojo un guardián y se revierte con `git diff`):
quitar `public.` del `CREATE TABLE` nuevo; calificar `ALTER TABLE public.equipos …`; mover `provisional`
fuera del final en cualquiera de las dos vistas; quitar `false AS provisional` de `:172`; quitar
`WHERE enlazado_a IS NULL`; quitar la entrada de `PUBLIC_TABLES`. Las tres de la vista las caza una prueba
estática nueva que compara las listas de columnas de las dos sentencias.

## 7. Barrido de citas al cierre (regla 4)

`grep -rnoE "(ticketService|schema|migrate|equipoNuevo|repo|equipos|types|contratos|prioridad|backfillClientId)\.(ts|sql):[0-9]+(-[0-9]+)?"`
sobre el repositorio, más un segundo pase por la forma abreviada en los ficheros que citan esos módulos.
Se espera **cero desplazamientos** (todo en sitio o al final); lo que sí cambia es lo que **afirman**
`schema.sql:169-173` (ahora con `provisional`) y `ticketService.ts:131` (un eslabón más): se leen y se
reparan por caso A/B/C. `transitions.ts` no se toca.

## 8. Lotes y presupuesto

Un intento por lote, en este worktree. Techo 800, válvula 720. Medida: `git diff --shortstat --no-renames`
contra el commit de partida más `wc -l` de lo nuevo sin trackear.

| Intento | Contenido | Estimación |
|---|---|---|
| Lote 1 | Esquema, vista, `PUBLIC_TABLES`, alta manual y traza | ~475 (código ~190, pruebas ~285) |
| Lote 2 | Enlace, validación, guarda, rechazos de D12 | ~330 (código ~130, pruebas ~200) |
| Lote 3 | Interfaz (`.tsx` fuera de la red, F0-00) | ~280 |

Si el lote 1 cruza 720 antes de cerrar, se parte en 1a (esquema y vista, ~150) y 1b (alta, ~325).

## 9. Matriz de amenazas

N/A: sin rutas de shell, subprocesos, automatización de VCS ni clasificación de ejecutables.

## 10. Despliegue

Aditivo. En cada arranque se aplican las dos definiciones de la vista, una detrás de otra; entre ellas, los
provisionales no se ven durante ese instante del arranque. Reversión: `git revert`, y la vista vuelve a ser
la de `:169-173` en el siguiente despliegue con un `DROP VIEW` manual previo (quitar una columna no lo admite
`CREATE OR REPLACE`). Esa reversión toca producción: la decide una persona.

## 11. Preguntas abiertas

Ninguna bloquea. Q1-Q4 siguen como supuestos de la propuesta.
