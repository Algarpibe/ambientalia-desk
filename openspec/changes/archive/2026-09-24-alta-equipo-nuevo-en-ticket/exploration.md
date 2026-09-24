> Exploración de TODA la fila F1B-14 («Alta y edición del equipo»), no sólo de este cambio. Copia íntegra de Engram `sdd/alta-edicion-equipo/explore` (obs. 1033, 2026-09-24): el explorador no pudo escribir el fichero y lo escribe `sdd-propose`. Las rutas y líneas son las medidas por el explorador ese día; léanse contra esa fecha.

## Exploration: alta-edicion-equipo (F1B-14, «Alta y edición del equipo», S–M)

### Fuente de alcance (literal)

`decision/equipo-nuevo-alta-en-ticket` (openspec/config.yaml:2758-2773): «Opción 2: fila propia, tamaño S... Cuando el ticket se clasifica como «Equipo nuevo», el alta permite registrar el equipo en ese mismo paso: serial, modelo del catálogo, cliente y fecha de factura como obligatorios; fecha de adquisición, fin de garantía, código interno, Drive y mantenedor como opcionales. El equipo queda creado en Registro de equipos y el ticket enlazado a él. Si el serial ya existe en el registro, no se crea otro: se ofrece el equipo existente. Para «Equipo para servicio de mantenimiento» y «Soporte remoto» se mantiene la regla actual: el equipo tiene que existir.»

`decision/edicion-datos-comerciales-equipo` (openspec/config.yaml:2775-2790): «Se reserva, por área y no por cargo. Fecha de factura, fin de garantía y mantenedor solo los pueden cambiar usuarios del área Comercial y los administradores... Fecha de adquisición, código interno y enlace de Drive los puede corregir cualquier usuario con sesión. Todo cambio en cualquiera de los seis campos queda registrado con persona, fecha y hora, valor anterior y valor nuevo, y se ve en la hoja de vida. La hoja de vida tiene su propio botón «Editar»... y el servidor aplica la restricción, no solo la pantalla. Se construye en la misma fila...»

Contexto de permisos: `decision/titularidad-mantenedor` (config.yaml:1778-1802) — mantenedor en hoja de vida, sólo él paga órdenes de ese equipo. `decision/c10-permisos-cargo` (config.yaml:1927-1947) — base por ÁREA, cargo sólo restringe con lista corta; esta decisión NO entra en esa lista (edicion-datos-comerciales-equipo:2782), así que no toca F1C-05.

### Current State (ruta:línea)

**Alta de ticket** — `apps/desk/server/services/ticketService.ts` `createManagedTicket` (:20-108):
- :22-23 `if (!equipoId) throw 422 'Falta el equipo'` — escalón A, exige SIEMPRE un equipo YA registrado, sin distinguir `clasificaciones`.
- :24-25 `getEquipo(db, equipoId)` (`apps/desk/server/db/equipos.ts:77-80`, SELECT por `id`) → 422 'Equipo no registrado' si no existe.
- :35-42 resolución de OV (si `salesOrderId`) → puede completar `clientId`/`ordenVenta`/`fechaOrdenVenta`.
- :59-77 guarda equipo↔cliente (escalón C, F1B-10/tickets-core RQ-TC-13): compara `clientId` final contra `equipo.clientId`.
- :81-86 obligatorios (cliente, tipoServicio, clasificaciones, prefijo) — escalón C.
- :87-88 cliente no existe en Books — escalón C.
- :94-98 OV ya asociada a otro ticket, 409 — escalón D, ÚLTIMA guarda (movida ahí por `orden-precedencia-guardas`, F1B-10).
- Orden total exigido: `tickets-core` RQ-TC-05 (spec.md:111-172) y `transitions-st` §3.8: A < B < C < D.

`packages/shared/src/ticketCreate.ts:5` `CLASIFICACIONES = ['Equipo para servicio de mantenimiento', 'Equipo nuevo', 'Soporte remoto']`. Sólo la primera tiene grafo construido; `tickets-core` §4.3 (spec.md:452-460) registra que «Equipo nuevo» y «Soporte remoto» no tienen grafo propio y hoy caen en el mismo (destino F1B-06, **no** de esta tanda).

**No existe** hoy ninguna función de búsqueda EXACTA por serial (`grep serial\s*=\s*\$|bySerial|porSerial` sólo devuelve coincidencias irrelevantes). `searchEquipos` (`db/equipos.ts:59-75`) es `LIKE`, parcial. Hay que CONSTRUIR `getEquipoBySerial` (exacto, normalizado trim+lower, igual criterio que `esFechaIso`/`urlSegura`) para «si el serial ya existe, se ofrece el equipo existente». `equipos.serial` no tiene `UNIQUE` en `schema.sql:189-201` (sólo índice), consistente con que hoy pueden convivir duplicados si nadie los evita a nivel de aplicación.

**Alta y edición de equipos** — `apps/desk/server/routes/equipos.ts`:
- `POST /api/equipos` (:48-71) — sólo `requireAuth(db)`, sin gate de área. Exige `serial`, `clientId`, `modeloId`; NO comprueba si el serial ya existe (duplicable). Valida los 6 campos hoja de vida con `camposHojaDeVida` (:144-189), TODO opcional, "se corre entero antes de escribir nada" (regla de mutación 1 aplicada por la propia tanda F1B-02).
- `PATCH /api/equipos/:id` (:73-102) — sólo `requireAuth(db)`, **CUALQUIER sesión puede cambiar los 6 campos comerciales hoy**. Medido por E-071 (ENTRADA.md:1100) sobre `3f30710`. NO hay ninguna comprobación de área/cargo.
- `getModelo` deriva marca/modelo/tipo desde el catálogo (`db/catalogo.ts:135`).
- `hojas-vida` spec (spec.md:180-181) declara EXPLÍCITAMENTE fuera de alcance: «Permisos por área para escribir equipos: hoy basta `requireAuth`... esta spec no lo cambia» — ESTA SPEC HAY QUE ACTUALIZARLA (RQ-HV nuevo) porque `edicion-datos-comerciales-equipo` sí lo cambia, para 3 de los 6 campos.

**Permisos / áreas** — `packages/shared/src/permissions.ts:4` `canExecuteTransition(userAreas, isAdmin, transitionArea)`; `AREAS = ['Comercial', 'Servicio Técnico', 'Compras']` (`transitions.ts:310`). `apps/desk/server/auth/middleware.ts:32-35` `requireArea` (exige alguna área o admin, NO un área concreta). NO existe hoy un middleware/helper "exige área X concreta" reutilizable — hay que construirlo (p.ej. `userTieneArea(user, 'Comercial')` inline en la ruta, patrón ya usado en tests: `canExecuteTransition([area], false, t.area)`). `UserPublic.areas` viene de `rowToPublicUser` (`auth/users.ts:19-32`), admin ve las 3.

**Registro de cambios (auditoría)** — NO existe mecanismo reutilizable para equipos. `ticket_transitions` (schema.sql:57-62) es específico de tickets/Blueprint y vive en `zoho-sync`. `trazas` spec (spec.md) cubre sólo esa tabla. `ticket_history` es de Zoho (crudo). `avisos` es notificación, no historial. Grep de `old_value|new_value|valor_anterior|valor_nuevo|changed_by|audit` sobre `schema.sql` = 0 resultados. **Hace falta tabla nueva** (p.ej. `equipos_cambios`: id, equipo_id, campo, valor_anterior, valor_nuevo, usuario_id, performed_at) + escritura en `updateEquipo`/ruta PATCH + lectura expuesta en `GET /api/equipos/:id/historial` (ya existe, `equipos.ts:38-42`, `getEquipoHistorial`) o endpoint nuevo. La doctrina de referencia que la propia decisión cita es M11.4 (auditoría), la misma que ya aplica `trazas` a `ticket_transitions` (RQ-TZ-01).

**Cliente (.tsx, sin red de pruebas, decisión F0-00)**:
- `apps/desk/src/components/CreateTicket.tsx` — `submit()` (:180-197) exige `equipo` YA elegido de la lista (:183 `if (!equipo) setError('Selecciona un equipo registrado')`); el buscador (`searchEquipos`, :102-112) sólo lista existentes. Hay que añadir rama condicional cuando `clasificaciones === 'Equipo nuevo'`: formulario inline (serial, modeloId vía catálogo, fecha de factura obligatoria + opcionales) en vez de/además del buscador.
- `apps/desk/src/components/EquiposAdmin.tsx` — `EquipoForm` (:95-188+) YA IMPLEMENTA exactamente los campos necesarios (serial, marca/modelo del catálogo vía `getCatalogo`, cliente vía `searchClients`, los 6 campos hoja de vida, mantenedor) y llama a `createEquipo`/`updateEquipo` (`api/client.ts:397-405`). Botón «Editar» ya existe en la lista (:64) pero NO en `HojaDeVida.tsx`. **Alta oportunidad de reutilización**: extraer `EquipoForm` a fichero propio y reusarlo en `CreateTicket.tsx` (alta desde ticket) y en `HojaDeVida.tsx` (botón «Editar» nuevo), en vez de reescribir el formulario tres veces.
- `apps/desk/src/components/HojaDeVida.tsx` — sólo lectura hoy (confirmado por E-071: `grep -n "Editar|onSave"` sin aciertos). Cabecera de los 6 campos en :163-178. Hay que añadir botón «Editar» + sección de historial de cambios.

**Nota de dominio importante**: «fecha de factura» del alta-equipo-nuevo es `EquipoInput.fechaFacturaCompra` (compra del equipo), **NO** `tickets.fecha_factura` (factura del servicio) — son nociones distintas y ya declaradas así en `hojas-vida` spec §0 (spec.md:22-26). No confundir al implementar.

### Capacidades OpenSpec afectadas
Ya existen y están registradas (config.yaml:104-151): `tickets-core`, `hojas-vida`, `permissions`, `trazas`. **No hay capacidad `catalogo-equipos`** como spec propia (no existe `openspec/specs/catalogo-equipos/spec.md`, sólo se menciona como referencia en otras specs) — no aplica R-2 para ella. La auditoría de cambios de equipo encaja mejor como requisitos nuevos DENTRO de `hojas-vida` (es el dato que audita) que como capacidad nueva o extensión de `trazas` (que es ticket-específica); no hace falta capacidad nueva → R-2 no se activa si se sigue esta recomendación.

### Enfoques

**A. Un solo cambio SDD** (proposal→spec→design→tasks→apply único, `tanda: F1B-14`, `cierra: si`), tres frentes (alta-desde-ticket + permisos/auditoría + cliente) en el mismo PR.
- Pros: una sola fila cerrada de una vez, un solo verify/archive-report, cumple literalmente "misma fila" de la decisión.
- Cons: estimación de línea (ver abajo) queda cerca o por encima del techo de 800 del preflight una vez se suman verify-report + archive-report (Regla del ciclo 2 de CLAUDE.md ya avisa de este patrón); mezcla server probado (strict_tdd) y cliente sin red de pruebas en el mismo diff, dificultando la revisión humana si RDD se reactivara.
- Esfuerzo: Medio-Alto.

**B. Dos cambios SDD secuenciales bajo la misma fila** (mismo precedente que F1B-11/R-4): (1) `alta-equipo-nuevo-en-ticket` — servidor (ticketService.ts, getEquipoBySerial) + cliente (CreateTicket.tsx), `tanda: F1B-14`, `cierra: no`; (2) `edicion-comercial-equipo` — permisos por área en PATCH, tabla de auditoría, botón Editar en HojaDeVida, `tanda: F1B-14`, `cierra: si`.
- Pros: cada cambio queda muy por debajo de 800 (ver estimación); aísla el riesgo — si la restricción por campo o la auditoría resultan más grandes de lo previsto, no arrastran el alta ya cerrada y verificada; permite frenar el segundo cambio si la duda bloqueante (ver abajo) sobre si la restricción también aplica al alta-desde-ticket no está resuelta, sin bloquear el primero.
- Cons: dos verify-report + dos archive-report (más overhead de fases); dos PRs a reconciliar contra la misma fila del plan.
- Esfuerzo: Medio (por cambio).
- **RECOMENDADO.**

**C. Diferir el cliente (.tsx) como "comprobación de persona"** — inviable: las dos decisiones piden literalmente el formulario inline y el botón «Editar» como alcance, no como opcional; no es análogo a RQ-HV-07 (que diferían sólo COMPROBACIONES automáticas imposibles por F0-00, no la construcción del feature).

### Estimación de líneas (servidor con pruebas + cliente sin pruebas, cuenta igual para el presupuesto de revisión)

Servidor (código+tests, strict_tdd):
- `ticketService.ts` (nueva rama «Equipo nuevo», reordena parte de la guardia de existencia): ~60-90
- `db/equipos.ts` `getEquipoBySerial` + helper de creación/reuso: ~35-50
- `routes/equipos.ts` gate de área en PATCH (3 campos) + escritura de auditoría: ~30-40
- tabla nueva `equipos_cambios` en `schema.sql` + guardianes de esquema (CLAUDE.md regla dura de calificación): ~15-20
- módulo de auditoría (escritura+lectura) + endpoint: ~60-90
- tests server (ticketService.test.ts, equipos.test.ts, db/equipos.test.ts): ~300-450
- Subtotal servidor: **~500-740**

Cliente (.tsx, sin pruebas, cuenta igual en el diff):
- Si se EXTRAE `EquipoForm` a fichero propio para reusar en los 3 sitios: el diff duplica esas líneas (borradas de `EquiposAdmin.tsx` + insertadas en el fichero nuevo), aunque el contenido no cambie — mismo efecto que "regla del ciclo 2" describe para `git mv` sin `--no-renames`, aplicado aquí a nivel de PR humano, no de `sdd-attempt`. Riesgo real de inflar el diff visible en ~140-180 líneas "fantasma".
- `CreateTicket.tsx` rama condicional «Equipo nuevo»: ~100-160
- `HojaDeVida.tsx` botón Editar + sección de historial: ~70-110
- Subtotal cliente: **~170-270** (sin extraer) o **~350-450** (extrayendo `EquipoForm`)

**Total estimado: ~670-1000+ líneas**, según se extraiga o no el formulario compartido. Cerca o por encima del techo de 800 del preflight si va en un solo cambio → refuerza la recomendación B. Si finalmente se hace un solo cambio (A), recomendar NO extraer `EquipoForm` a fichero propio (aceptar algo de duplicación de subformulario) para no inflar el diff con líneas "fantasma" de motion, y verificar el diff con el mismo cuidado que la Regla del ciclo 2 exige para `sdd-attempt` (`git diff --shortstat` normal aquí sí cuenta el movimiento, a diferencia del ledger).

### Riesgos
1. La restricción por área del PATCH (3 campos) puede necesitar extenderse también al `POST` (alta) si Gerencia confirma que aplica también a fecha de factura tecleada en el alta-desde-ticket — ver duda bloqueante.
2. `equipos.serial` sin `UNIQUE` en schema — el guard de "si ya existe, se ofrece el existente" es puramente de aplicación (no de base de datos); una carrera entre dos altas simultáneas del mismo equipo nuevo no está cubierta por un `UNIQUE` (fuera de alcance salvo que Gerencia lo pida).
3. La tabla de auditoría nueva activa la regla dura de `CLAUDE.md` (calificar esquema explícitamente) y el guardián de `ALTER`/`CREATE` de `migrate.test.ts` — hay que darla de alta correctamente calificada desde el principio (evita repetir IV-6).
4. `hojas-vida` spec.md:180-181 queda desactualizada en cuanto se construya esto — hay que tocarla en el mismo cambio que construye el PATCH restringido, o quedará una afirmación falsa en la propia spec (regla de método).
5. Extraer `EquipoForm` a fichero propio para reutilizarlo en 3 sitios duplica el diff visible aunque no cambie contenido (riesgo de presupuesto de revisión, ver estimación).
6. Los `.tsx` tocados quedan sin red de pruebas por decisión de Gerencia (F0-00) — no proponer jsdom; documentar «comprobación de persona» para lo que sólo se puede verificar a mano (botón Editar, formulario inline, sección de historial).

### Dudas

**(a) Con supuesto razonable y reversible — propuesto:**
1. La restricción por área (`edicion-datos-comerciales-equipo`) se lee literalmente como aplicable sólo al **`PATCH`** (edición de un equipo ya existente) — la propia decisión dice «hoy cualquiera con sesión puede CAMBIAR» y cita `routes/equipos.ts:73` (el PATCH). Supuesto: el `POST` (alta, tanto desde `EquiposAdmin` como desde el ticket de «Equipo nuevo») **NO** queda restringido por esta tanda — se deja como hoy, cualquier sesión puede fijar el valor inicial. Reversible: añadir el mismo gate al handler de POST es un cambio pequeño y aislado si Gerencia lo pide después.
2. «Si el serial ya existe... se ofrece el equipo existente» — no se especifica la UX. Supuesto: el servidor reutiliza el `id` existente de forma transparente (devuelve el equipo ya registrado, sin crear fila nueva) y el cliente muestra el equipo encontrado en el mismo bloque de vista previa que ya usa `CreateTicket.tsx:294-299`, sin bloquear el alta. Reversible: es sólo tratamiento visual.
3. Comparación de serial para el reuso: normalizada `trim()` + `toLowerCase()`, igual criterio que el resto del repo (`esFechaIso`, `routes/equipos.ts:50`). Reversible.
4. `equipo.clientId` para el equipo nuevo creado desde el ticket = el `clientId` YA RESUELTO del ticket (cuerpo u OV, líneas 27-42), no un campo separado que el usuario tenga que repetir — evita que la propia guarda equipo↔cliente (:59-77) se dispare contra un equipo que acaba de nacer. Reversible en diseño, pero cambia el ORDEN de guardas de la rama nueva (ver duda bloqueante 2 abajo, relacionada).
5. La sección de historial de cambios en `HojaDeVida.tsx` se muestra como bloque propio, ordenado de más reciente a más antiguo, separado de la cronología de tickets/remisiones (no mezclado). Cosmético, reversible.

**(b) Bloqueantes — requieren decisión de Gerencia antes de `sdd-propose`, o cambian alcance/tocan producción/contradicen config.yaml:**
1. **¿La restricción por área también debe aplicar al alta-desde-ticket cuando el usuario teclea la fecha de factura obligatoria?** La razón que Gerencia da para restringir («deciden si un servicio se cobra y a quién puede pagarlo») aplica igual de fuerte al fijar el valor inicial que al editarlo después, pero `tickets-core` RQ-TC-05 dice explícitamente que el alta de ticket **MUST NOT** gatear por área (`routes/tickets.ts:35`, `:124-126`). Extender la restricción ahí cambiaría quién puede abrir un ticket de «Equipo nuevo» completo (p.ej. un técnico de Servicio Técnico no podría terminarlo sin Comercial), lo cual contradice una regla ya escrita (RQ-TC-05) y toca producción. **Bajo el supuesto (a1) esto no se construye**; si Gerencia confirma que SÍ debe aplicar, cambia el diseño del flujo de alta.
2. **Orden de guardas de la rama nueva («Equipo nuevo»)**: hoy la guarda de existencia del equipo (escalón A) es la PRIMERA (líneas 22-25), antes incluso de resolver la OV. Para la rama nueva, crear-o-reusar el equipo depende de tener ya el `clientId` resuelto (que hoy sólo se conoce después de la resolución de OV, líneas 27-42) y de los datos del propio formulario (serial, modeloId, fecha de factura). Esto implica que, para `clasificaciones === 'Equipo nuevo'`, el orden efectivo de "qué se resuelve primero" YA NO puede ser A-antes-que-todo: hace falta una subtabla de precedencia propia para esta rama, análoga a la de `RQ-TC-05`, y decidir explícitamente en `design.md` si eso es un escalón A alternativo o si técnicamente pasa a ser parte del escalón C (contenido) porque depende de datos del cuerpo. Esto es una decisión de diseño con implicación directa en qué mensaje de error ve primero el usuario (mismo tipo de problema que registra IV-12 para `remision.ts`) — no tiene un supuesto seguro por defecto porque cambia UX y hay precedente (`orden-precedencia-guardas`) de que mover el orden de guardas sin decisión expresa es justamente el tipo de incumplimiento vivo que el proyecto ya tiene abierto (IV-12).
3. **¿Extender la tabla de auditoría nueva a otros datos maestros más adelante, o queda cerrada a los 6 campos de hoja de vida?** La decisión dice literalmente «todo cambio en cualquiera de los SEIS campos» — no incluye `serial`, `clientId`, `modeloId`, `active`. Construir la tabla de forma genérica (campo, valor_anterior, valor_nuevo) sin decidir su alcance final podría dar la impresión de que audita más de lo que audita. Se recomienda escribirlo así en la spec (sólo los 6), pero es Gerencia quien decide si el alcance se amplía — no bloquea la construcción de esta tanda con alcance de 6 campos, pero si se ignora puede leerse como alcance ya decidido cuando no lo está.

### Recomendación

Enfoque **B** (dos cambios SDD secuenciales, `tanda: F1B-14`, uno con `cierra: no` y el segundo `cierra: si`), en este orden:
1. `alta-equipo-nuevo-en-ticket` — servidor (`getEquipoBySerial`, rama nueva en `createManagedTicket`) + `CreateTicket.tsx`. Bloqueada por la duda (b2) de orden de precedencia — debe resolverse en `design.md` de ESE cambio antes de `sdd-tasks`, con supuesto (a1) aplicado (sin gate de área en el alta).
2. `edicion-comercial-equipo` — `routes/equipos.ts` PATCH gate de 3 campos + tabla de auditoría + `HojaDeVida.tsx` botón Editar + actualización de `hojas-vida` spec.md:180-181. Puede arrancar en paralelo o después del primero; no depende técnicamente de él salvo por compartir la fila.

No extraer `EquipoForm` a fichero propio salvo que el presupuesto de línea lo permita cómodamente tras medir el diff real; si se hace, medirlo con `git diff --shortstat` (no asumir).

### Ready for Proposal
Parcial. El enfoque de alta (cambio 1) puede pasar a `sdd-propose` en cuanto se acepte el supuesto (a1) y se resuelva (b2) en design — ninguna de las dos exige volver a Gerencia si se documenta como supuesto reversible. El cambio 2 (edición+auditoría) puede proponerse en paralelo, pero su decisión de si el gate se extiende al POST (duda b1) debería confirmarse con Gerencia antes de cerrar `design.md`, o quedar escrita como supuesto (a1) explícito y reversible en el propio proposal.
