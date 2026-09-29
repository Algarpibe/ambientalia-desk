# Delta for derivacion-avisos

Cambio `alarmas-horas-habiles` (F1B-08, `cierra: no`). Base `4796aad`. Numeración: el último ID vivo es `RQ-AV-14`.

## ADDED Requirements

### Requirement: RQ-AV-15 · Aviso de alarma de SLA vencido al cargo declarado

Cuando una alarma de `transitions-st` RQ-TS-15 vence (y, en `Remisión creada`, se cumple RQ-TS-19), el sistema
**SHALL** crear un aviso con `crearAviso` (`apps/desk/server/db/avisos.ts:8`) para **cada usuario activo cuyo
`users.cargo` sea el cargo declarado** en la alarma (hoy `Coordinador Comercial`, `transitions-st` RQ-TS-16),
uno por destinatario y por alarma.

- La resolución del cargo a personas **SHALL** hacerla el **servidor** (regla invariable 13): una función
  `destinatariosDeCargo(db, cargo)` junto a `destinatariosDeArea` (`apps/desk/server/db/avisos.ts:74`); el
  cliente **MUST NOT** decidir a quién va.
- El texto del aviso **SHALL** nombrar el ticket, el estado vencido y el plazo en horas hábiles.
- El aviso **SHALL** entrar en `public.avisos` (fuente de verdad, RQ-AV-09) y el correo **SHALL** salir por
  `dispararAvisos` (`apps/desk/server/avisosWebhook.ts:53`) **después** de confirmada la transacción. Un
  fallo del correo (config vacía, `fetch` caído, tiempo agotado) **MUST NOT** deshacer la marca ni el aviso,
  **MUST NOT** hacer fallar la pasada ni la sincronización, y **SHALL** dejar `enviado_at` en `NULL`.
  A diferencia de `RQ-AV-14`, este aviso **SÍ** usa el canal de correo.
- **Sin nadie con el cargo (S-4, segunda revisión, 2026-09-29):** `users.cargo` es texto libre que existe para
  FIRMAR la remisión (`apps/desk/server/auth/routes.ts:67-68`), no para repartir avisos; un «Coord. Comercial»
  no casa. Si `destinatariosDeCargo` devuelve vacío, el sistema **SHALL** avisar al **área de respaldo**
  declarada en la alarma (hoy `Comercial`, `transitions-st` RQ-TS-16) con `destinatariosDeArea`
  (`apps/desk/server/db/avisos.ts:74`, sin actor) y **SHALL** emitir un único `logger.warn` que diga «sin
  Coordinador Comercial» (el cargo), el estado y el ticket. Si tampoco el área da nadie, **SHALL** escribir la
  marca con cero avisos y el mismo `warn`. Con alguien en el cargo, el área **MUST NOT** recibir el aviso. Que
  el cargo exista en producción es la tarea P.1, y deja de ser bloqueante.
- El aviso **SHALL** originarse únicamente en el proceso `ambientalia-desk`, no en `apps/hub-sync`.

#### Scenario: un aviso por cada usuario con el cargo
- GIVEN dos usuarios activos con `cargo = 'Coordinador Comercial'`, uno inactivo con el mismo cargo y uno activo con otro cargo
- WHEN vence la alarma de un ticket
- THEN se crean exactamente dos avisos, uno para cada usuario activo con el cargo

#### Scenario: el texto nombra ticket, estado y plazo
- GIVEN un ticket que vence en `Notificado`
- WHEN se crea el aviso
- THEN su texto contiene el identificador del ticket, `Notificado` y las 9 horas hábiles

#### Scenario: sin nadie con el cargo, el aviso va al área de respaldo con un warn
- GIVEN una alarma vencida, ningún usuario activo con el cargo y un usuario con un rol receptor del área `Comercial`
- WHEN corre la pasada
- THEN se crea un aviso por cada destinatario de `destinatariosDeArea('Comercial')`, se escribe la marca con ese número de avisos, y se emite un único `logger.warn` que dice «sin Coordinador Comercial» con el estado; si el área tampoco da nadie, marca con cero avisos y el mismo warn

#### Scenario: con alguien en el cargo, el área no recibe el aviso
- GIVEN una alarma vencida, un usuario activo con el cargo y otro con un rol receptor del área `Comercial`
- WHEN corre la pasada
- THEN sólo el usuario con el cargo recibe aviso y no se emite ningún warn

#### Scenario: un fallo del correo no tumba nada
- GIVEN una alarma vencida y un canal de correo que falla o agota su tiempo
- WHEN corre la pasada
- THEN el aviso y la marca quedan escritos, `enviado_at` queda `NULL`, la pasada termina sin lanzar y la sincronización continúa

#### Scenario: config de correo vacía es un no-op explícito
- GIVEN las variables de correo sin configurar
- WHEN vence una alarma
- THEN el aviso entra en la aplicación y el correo no se intenta, sin error

### Requirement: RQ-AV-16 · Una alarma por entrada al estado: la marca anti-duplicado

El sistema **SHALL** avisar **una sola vez por entrada**: la identidad de una alarma es la terna
**(ticket, estado, instante de entrada)** (supuesto S-2). El sistema **SHALL** registrar la marca y crear los
avisos de esa alarma en la **misma transacción**, con una escritura idempotente sobre la terna
(`public.alarmas_avisadas`, `INSERT … ON CONFLICT DO NOTHING RETURNING`): si no hay fila devuelta, **MUST NOT**
crearse ningún aviso.

- Dos pasadas seguidas, o dos pasadas concurrentes, sobre la misma entrada vencida **MUST NOT** producir más
  de un aviso por destinatario.
- **Reentrar** en el estado es una **entrada nueva** (otro instante) y **SHALL** poder generar una alarma
  nueva cuando vuelva a vencer.
- Si la transacción falla, no queda marca sin aviso ni aviso sin marca.
- **Primera pasada tras el despliegue (S-13, revisado 2026-09-29):** el correo enviado no se recupera, así que
  el valor por defecto es el que no hace daño. La primera pasada **SHALL** fijar un **corte** persistente
  (`public.alarmas_corte`, una fila, escrita una sola vez con el instante de esa pasada). Toda entrada que ya
  estuviera vencida en el corte **SHALL** marcarse con cero avisos y **MUST NOT** avisar (la marca del tablero
  sí sale; el correo, no). Las que venzan después del corte avisan normal. El corte **MUST NOT** moverse con
  un reinicio del proceso. Encender la ráfaga es decisión de Gerencia (P.3).
- Una entrada de `Remisión creada` con orden de venta no vence, así que **MUST NOT** dejar marca; una entrada vencida sin nadie ni en el cargo ni en el área **SHALL** dejarla con cero avisos.

#### Scenario: dos pasadas no duplican
- GIVEN un ticket vencido en `Notificado` y un usuario con el cargo
- WHEN corre la pasada dos veces seguidas
- THEN hay un solo aviso para ese usuario y una sola marca

#### Scenario: dos pasadas concurrentes no duplican
- GIVEN el mismo ticket y dos pasadas que evalúan a la vez
- WHEN las dos intentan marcar
- THEN una gana la marca y crea el aviso; la otra no devuelve fila y no crea nada

#### Scenario: reentrar vuelve a avisar
- GIVEN la alarma de una entrada ya avisada, y el ticket sale y vuelve a entrar en `Notificado` y vuelve a vencer
- WHEN corre la pasada
- THEN se crea una marca nueva (mismo ticket y estado, otro instante de entrada) y un aviso nuevo

#### Scenario: la marca distingue estados
- GIVEN un ticket avisado en `Notificado` que pasa después a `Remisión creada` y vence
- WHEN corre la pasada
- THEN se crea un aviso nuevo: la terna difiere en el estado

#### Scenario: marca y aviso van en la misma transacción
- GIVEN un fallo forzado al crear el aviso, después de escribir la marca
- WHEN corre la pasada
- THEN no queda marca escrita, y la pasada siguiente reintenta el aviso

#### Scenario: lo vencido antes del corte se marca sin avisar; lo posterior avisa
- GIVEN un ticket que ya estaba vencido cuando corrió la primera pasada, y otro que vence después
- WHEN corren la primera pasada y una posterior
- THEN el primero queda marcado con cero avisos, sin correo y con la marca de tablero si su alarma la lleva; el segundo recibe su aviso normal

#### Scenario: el corte no se mueve con un reinicio
- GIVEN un corte ya fijado y un ticket que venció después del corte, sin marca todavía
- WHEN el proceso se reinicia y corre la pasada
- THEN el corte sigue siendo el primero y el ticket recibe su aviso

#### Scenario: `Remisión creada` con orden de venta no deja marca
- GIVEN un ticket vencido en `Remisión creada` con orden de venta
- WHEN corre la pasada
- THEN no hay marca; si más tarde pierde toda orden y sigue vencido, la pasada siguiente sí avisa

### Requirement: RQ-AV-17 · La pasada de alarmas: disparo, tolerancia a fallos y dependencia de la sincronización

El sistema **SHALL** evaluar las alarmas en una **pasada del servidor** (`pasadaAlarmas`) encadenada en la
pasada periódica de `apps/desk/server/index.ts` junto a `pasadaRitmoContratos` (supuesto S-1); la cadencia
efectiva es `syncIntervalMs` (180 000 ms por defecto).

- En cada pasada, para cada ticket con alarma por su estado actual, **SHALL** calcularse el vencimiento con
  `horasHabilesEntre` y los cierres vigentes leídos de `public.calendario_cierres`.
- Un error al evaluar un ticket **MUST NOT** impedir evaluar los demás, ni la sincronización de Zoho, ni el
  arranque; **SHALL** registrarse y seguir.
- **Requisito no funcional — dependencia (E-087, `docs/sdd/ENTRADA.md:1230-1236`):** las alarmas dependen de
  esa pasada, que hoy es la de la sincronización con Zoho. Al retirar la sincronización sin trasladar la
  llamada a un planificador propio, las alarmas **callarían sin que nada se ponga rojo**. El `archive-report`
  **SHALL** añadir una adenda a E-087 declarando este segundo dependiente.
- Los tickets sin foto de entrada (`transitions-st` RQ-TS-15) **MUST NOT** medirse en la pasada.

#### Scenario: un error en un ticket no detiene el resto
- GIVEN dos tickets vencidos y una fallo de lectura en el primero
- WHEN corre la pasada
- THEN el segundo recibe su aviso y la pasada devuelve el control sin lanzar

#### Scenario: la pasada no bloquea la sincronización
- GIVEN un fallo global en `pasadaAlarmas` (p. ej. no se pueden leer los cierres)
- WHEN corre la pasada periódica
- THEN la sincronización de Zoho se ejecuta igual y el fallo queda registrado

#### Scenario: los cierres se leen en cada pasada
- GIVEN un cierre añadido a `public.calendario_cierres` entre dos pasadas
- WHEN corre la segunda pasada
- THEN el vencimiento lo descuenta

#### Scenario: la pasada ignora tickets sin foto de entrada
- GIVEN un ticket replicado de Zoho en `Notificado`, sin filas en `ticket_transitions`
- WHEN corre la pasada
- THEN no se crea marca ni aviso

## Fuera de alcance de este delta

- **`DERIVACION_POR_DEFECTO` y `RQ-AV-02`** (`openspec/specs/derivacion-avisos/spec.md:67-70`): no se tocan.
- **Planificador propio independiente de Zoho** (E-087): sólo se registra la dependencia.
- **Reglas de la vista** (marca de tablero): `vistas-tablero` RQ-VT-07.
- **`RQ-AV-14`** (ritmo de contrato, sólo bandeja): no cambia.
