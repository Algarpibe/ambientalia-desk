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
- **Sin nadie con el cargo:** si `destinatariosDeCargo` devuelve vacío, el sistema **SHALL** escribir la marca
  (RQ-AV-16) con cero avisos, **MUST NOT** crear aviso y **SHALL** emitir un único `logger.warn` que nombre el
  cargo y el estado; la marca impide repetirlo en las pasadas siguientes (S-4 revisado). Coste aceptado: si el
  cargo se da de alta después, esa entrada ya no avisa. Que el cargo exista en producción es la tarea P.1.
- El aviso **SHALL** originarse únicamente en el proceso `ambientalia-desk`, no en `apps/hub-sync`.

#### Scenario: un aviso por cada usuario con el cargo
- GIVEN dos usuarios activos con `cargo = 'Coordinador Comercial'`, uno inactivo con el mismo cargo y uno activo con otro cargo
- WHEN vence la alarma de un ticket
- THEN se crean exactamente dos avisos, uno para cada usuario activo con el cargo

#### Scenario: el texto nombra ticket, estado y plazo
- GIVEN un ticket que vence en `Notificado`
- WHEN se crea el aviso
- THEN su texto contiene el identificador del ticket, `Notificado` y las 9 horas hábiles

#### Scenario: sin nadie con el cargo, marca sin aviso y un warn
- GIVEN una alarma vencida y ningún usuario activo con el cargo
- WHEN corre la pasada
- THEN no se crea aviso, se escribe la marca con cero avisos, y se emite un `logger.warn` con el cargo y el estado

#### Scenario: la pasada siguiente no repite el warn
- GIVEN el escenario anterior y, después, un usuario activo con el cargo
- WHEN corre la siguiente pasada
- THEN no se crea aviso ni se emite otro warn para esa entrada: ya está marcada (coste aceptado de S-4)

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
- **Primera pasada tras el despliegue (S-13):** las entradas que ya estaban vencidas **SHALL** avisarse
  también, una vez por entrada por la misma marca; **MUST NOT** haber corte por fecha de despliegue. Es una
  ráfaga esperada y se anuncia en la nota de despliegue.
- Una entrada de `Remisión creada` con orden de venta no vence, así que **MUST NOT** dejar marca; una entrada vencida sin nadie con el cargo **SHALL** dejarla (S-4 revisado).

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

#### Scenario: la primera pasada avisa también lo ya vencido
- GIVEN tickets que vencieron antes del despliegue, sin ninguna marca
- WHEN corre la primera pasada
- THEN cada entrada vencida recibe su aviso y su marca una vez, sin corte por fecha

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
