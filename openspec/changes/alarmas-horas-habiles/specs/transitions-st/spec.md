# Delta for transitions-st

Cambio `alarmas-horas-habiles` (F1B-08, `cierra: no`). Base `4796aad`. Supuestos S-1..S-13 de
`proposal.md` y de la instrucción de la fase. Fuente de las tres alarmas: `decision/anexo-3-alerta`
(`openspec/config.yaml:2329`); del calendario: `decision/calendario-habil` (`openspec/config.yaml:2555`).

## MODIFIED Requirements

### Requirement: RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** seguir declarándose como **dato**, no derivarse del grafo, y **SHALL** medirse en **horas
HÁBILES**, no de reloj. La tabla de alarmas (`packages/shared/src/sla.ts`) **SHALL** tener exactamente
**tres** entradas:

| Estado | Umbral (horas hábiles) | Equivale a |
|---|---|---|
| `Notificado` | 9 | 1 día hábil |
| `Remisión creada` | 27 | 3 días hábiles |
| `Notificación cliente` | 36 | 4 días hábiles |

- El cómputo **SHALL** usar la función compartida `horasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:174`)
  con los cierres de `public.calendario_cierres`, y **MUST NOT** reimplementar el calendario (jornada L-V
  8-17 h, festivos de Colombia y cierres declarados): el tiempo fuera de jornada, en fin de semana, en
  festivo o en un cierre **MUST NOT** contar.
- La unidad **SHALL** seguir siendo la **hora**, no el día.
- En el instante **exacto** del vencimiento la alarma **MUST NOT** estar vencida: la comparación es
  **estricta** (`horas hábiles transcurridas > umbral`). Un plazo de nueve horas hábiles que saltara en la
  hora nueve exacta no sería un plazo de nueve horas.
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). Reentrar en el estado abre una entrada nueva y
  reinicia el reloj.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** medirse ni reportarse como vencido
  (supuesto S-10): no se sabe cuándo entró en su estado. Se documenta, no se inventa un origen; `created_time`
  dice cuándo nació el ticket, que es otra cosa. Esto acota la regla a los tickets que la aplicación ha movido.
- Un estado **sin entrada** en la tabla **MUST NOT** vencer nunca.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA` ni la clasificación de espera. `Remisión creada` (`interna`) y
  `Notificación cliente` (`externa`) están en la vista de esperas y a la vez tienen alarma: la vista y la
  alarma son criterios independientes (`transitions-st` §3.7).
- La alarma **SHALL** ser independiente del reloj del SLA de `c7`: **MUST NOT** detenerse porque el ticket
  esté en `Notificación cliente`, y el reloj de `c7` (F1C-06) queda fuera de este requisito.
- La alarma **SHALL** aplicarse sólo a tickets cuyo flujo aplicable es `servicio` (supuesto S-9 revisado): un
  ticket `Equipo nuevo` en `Notificado` **MUST NOT** medirse, como ya fija `transitions-equipo-nuevo` RQ-EN-06
  (supuesto s6 de `blueprint-equipo-nuevo`), que este cambio no toca. Los tres estados con alarma son del
  catálogo de servicio; el único que se cruza con otro flujo es `Notificado`.
- Quien **dispara** la evaluación es la pasada periódica del servidor (`derivacion-avisos` RQ-AV-17); este
  requisito sólo fija la regla de vencimiento.

(Previously: «Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h» de reloj, comparación estricta sobre
horas naturales, y «El reloj **MUST NOT** aplicarse a un ticket cuyo flujo aplicable no es el de servicio».
La última viñeta decía que nada dispara y que no hay planificador; el disparo lo fija ahora RQ-AV-17. Las
sustituciones de las cifras de `ESTADOS_EN_ESPERA` de las notas históricas no cambian.)

#### Scenario: la tabla tiene exactamente tres alarmas, en horas hábiles
- GIVEN la tabla de alarmas de `packages/shared/src/sla.ts`
- WHEN se inspeccionan sus entradas
- THEN son exactamente `Notificado` 9, `Remisión creada` 27 y `Notificación cliente` 36, todas en horas hábiles

#### Scenario: exactamente en el umbral no vence, ni siquiera fuera de jornada
- GIVEN un ticket que entró en `Notificado` el lunes a las 8:00
- WHEN se evalúa el lunes a las 17:00 (9 h hábiles exactas) y el lunes a las 23:00 (fuera de jornada, sin horas nuevas)
- THEN en ninguno de los dos instantes está vencido

#### Scenario: un milisegundo después del umbral, vence
- GIVEN el mismo ticket, entrado en `Notificado` el lunes a las 8:00
- WHEN se evalúa el martes a las 8:00:00.001
- THEN está vencido (9 h hábiles y un milisegundo > 9)

#### Scenario: el fin de semana no cuenta
- GIVEN un ticket que entró en `Notificado` el viernes a las 16:00 (1 h hábil ese día)
- WHEN se evalúa el lunes a las 16:00 (1 + 8 = 9 h hábiles) y el lunes a las 16:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí; el sábado y el domingo no sumaron nada

#### Scenario: un festivo no cuenta
- GIVEN un ticket que entró en `Notificado` el viernes a las 8:00 y un lunes festivo de Colombia siguiente
- WHEN se evalúa el martes a las 8:00 (9 h hábiles: sólo las del viernes) y el martes a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí; sin el festivo habría vencido el lunes

#### Scenario: un cierre de `public.calendario_cierres` no cuenta
- GIVEN un ticket que entró en `Notificado` el lunes a las 8:00 y un cierre declarado el martes
- WHEN se evalúa el miércoles a las 8:00 y el miércoles a las 8:00:00.001
- THEN en el primer instante no está vencido (9 h hábiles exactas, las del lunes) y en el segundo sí

#### Scenario: `Remisión creada` vence pasadas 27 horas hábiles exactas
- GIVEN un ticket que entró en `Remisión creada` un lunes a las 8:00, sin festivos ni cierres esa semana
- WHEN se evalúa el miércoles a las 17:00 (27 h hábiles exactas) y el jueves a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí

#### Scenario: `Notificación cliente` vence pasadas 36 horas hábiles exactas
- GIVEN un ticket que entró en `Notificación cliente` un lunes a las 8:00, sin festivos ni cierres esa semana
- WHEN se evalúa el jueves a las 17:00 (36 h hábiles exactas) y el viernes a las 8:00:00.001
- THEN en el primer instante no está vencido y en el segundo sí

#### Scenario: reentrar reinicia el reloj, se mide desde la última entrada
- GIVEN un ticket que entró en `Notificado` hace muchas horas hábiles, salió, y volvió a entrar hace 2 h hábiles
- WHEN se evalúa
- THEN no está vencido: el origen es la última entrada, no la primera

#### Scenario: un ticket sin foto de entrada no se mide
- GIVEN un ticket replicado de Zoho en `Notificado` sin ninguna fila en `ticket_transitions`
- WHEN se evalúa la alarma
- THEN no se reporta vencido, por muchas horas que hayan pasado desde `created_time`

#### Scenario: la alarma no lee la clasificación de espera
- GIVEN `Remisión creada` y `Notificación cliente`, que pertenecen a `ESTADOS_EN_ESPERA`, y con alarma declarada
- WHEN se calcula el vencimiento de cada uno
- THEN el resultado no cambia si se altera la clasificación de espera, y la aserción antigua «ningún estado con SLA está en `ESTADOS_EN_ESPERA`» (`packages/shared/src/sla.test.ts:51-55`) se reformula a propósito por «la alarma no lee `ESTADOS_EN_ESPERA`»

#### Scenario: el estado `Notificado` del catálogo `Equipo nuevo` no se mide
- GIVEN un ticket cuyo flujo aplicable es `Equipo nuevo`, en `Notificado`, con más de 9 h hábiles desde su entrada
- WHEN se evalúa la alarma
- THEN no está entre los vencidos (RQ-EN-06)

### Requirement: RQ-TS-16 · A quién se escala — la segunda pieza de C11, cerrada en F1A-02

El destinatario de cada alarma **SHALL** ser un **cargo declarado como dato en la propia tabla de alarmas**
(`packages/shared/src/sla.ts`), no derivado de las transiciones salientes del estado (supuesto S-8). Las
tres alarmas de `RQ-TS-15` **SHALL** declarar el cargo `Coordinador Comercial`.

- Todo estado con alarma **SHALL** tener cargo declarado y no vacío; declarar una alarma sin cargo **MUST**
  ponerse en rojo en una prueba antes de llegar a producción (sustituye al invariante «todo estado con SLA
  tiene destinatario derivado», `packages/shared/src/sla.test.ts:188-191`).
- El cargo de `Notificado` coincide hoy con el que proponen sus transiciones salientes
  (`escalado_a_comercial`), pero esa coincidencia **MUST NOT** ser la fuente: `Notificado` → `Coordinador
  Comercial` es un supuesto (S-3; ninguna decisión lo nombra) y se revierte cambiando un literal de la tabla.
- `Remisión creada` → `Coordinador Comercial` lo fija `decision/escalado-remision-creada`
  (`openspec/config.yaml:1429-1431`) y `decision/escalado-destinatario-doble`
  (`openspec/config.yaml:1499-1500`); `Notificación cliente`, `decision/anexo-3-alerta`.
- La resolución del cargo a personas concretas la hace el servidor (`derivacion-avisos` RQ-AV-15).
- Qué se hace con `destinatarioDelEscalado` y con el caso `Rev./Diagnostico` → Director Técnico, que no tiene
  alarma, lo decide el diseño; esta spec **no** exige conservarlos ni retirarlos.

(Previously: «El destinatario del escalado SHALL derivarse de la tabla de derivación por cargo que ya existe,
no de una jerarquía aparte», con los tres casos `{hay: true}` / `ningun_cargo` / `ambiguo`, «exactamente dos
estados con destinatario» y `ticketsConSlaVencido` devolviéndolo junto al ticket. Sustituido porque `R08.1.md:1575`
lo proponía como camino, no como mandato, y las decisiones de Gerencia nombran el cargo directamente.)

#### Scenario: toda alarma declara un cargo
- GIVEN la tabla de alarmas
- WHEN se recorren sus tres entradas
- THEN cada una tiene el cargo `Coordinador Comercial`

#### Scenario: una alarma sin cargo pone en rojo la prueba
- GIVEN una entrada de alarma de prueba con el cargo vacío
- WHEN corre la prueba de invariantes de la tabla
- THEN falla, nombrando el estado

#### Scenario: cambiar el cargo no depende del grafo
- GIVEN la alarma de `Remisión creada` con otro cargo declarado en la tabla
- WHEN se resuelve su destinatario
- THEN se resuelve el cargo declarado, sin consultar `TRANSITIONS` ni `DERIVACION_POR_DEFECTO`

## ADDED Requirements

### Requirement: RQ-TS-19 · `Remisión creada` sólo alarma si el ticket no tiene orden de venta

La alarma de `Remisión creada` **SHALL** disparar sólo cuando el ticket **no tiene orden de venta por ninguna
vía**, conforme a `decision/escalado-remision-creada` (`openspec/config.yaml:1429-1431`) y al supuesto S-6:

- ni `orden_venta` con valor,
- ni `salesorder_id` con valor,
- ni una asociación **vigente** (`liberada_at IS NULL`) en `public.ov_asociaciones` (`packages/zoho-sync/src/db/schema.sql:539`).

El predicado **SHALL** usar la MISMA definición de tres vías que `ticketConOrdenVenta` (las tres puertas de la
OV), que responde la pregunta inversa y no se puede llamar tal cual; una prueba **SHALL** enfrentar los dos. Un ticket con
orden de venta vencido en `Remisión creada` **MUST NOT** generar aviso **ni** marca de alarma. La condición
se evalúa en cada pasada: si más adelante pierde toda orden y sigue en el estado y vencido, alarma entonces.

#### Scenario: sin orden de venta por ninguna vía y vencido, alarma
- GIVEN un ticket en `Remisión creada`, con más de 27 h hábiles, sin `orden_venta`, sin `salesorder_id` y sin asociación vigente
- WHEN corre la pasada
- THEN dispara la alarma

#### Scenario: con `orden_venta`, sin alarma
- GIVEN el mismo ticket, con `orden_venta` informada y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: con `salesorder_id`, sin alarma
- GIVEN el mismo ticket, sólo con `salesorder_id` informado (sin `orden_venta`) y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: con asociación vigente, sin alarma
- GIVEN el mismo ticket, sólo con una fila vigente en `public.ov_asociaciones`, y 28 h hábiles
- WHEN corre la pasada
- THEN no hay aviso ni marca

#### Scenario: una asociación liberada no cuenta como orden de venta
- GIVEN el mismo ticket, sólo con una fila de `public.ov_asociaciones` con `liberada_at` informado, y 28 h hábiles
- WHEN corre la pasada
- THEN dispara la alarma

#### Scenario: las otras dos alarmas no miran la orden de venta
- GIVEN un ticket en `Notificado` vencido y con orden de venta
- WHEN corre la pasada
- THEN dispara la alarma: la condición de orden de venta es sólo de `Remisión creada`

## Fuera de alcance de este delta

- **§3.7 y §3.10 de la spec viva** (narrativa, no requisitos) hablan de «no hay planificador» y de que el
  destinatario se deriva del grafo: no se modifican por fusión de delta; su corrección la hace el
  `archive-report` como edición documental.
- **El reloj del SLA de `c7`** (F1C-06), el tiempo promesa y la fecha prevista de facturación.
- **«Vistas equivalentes a Zoho»** (pregunta 4 de `docs/sdd/Preguntas_Gerencia_2026-09-29.md`): por eso `cierra: no`.
- **Cómo se guarda la marca y quién dispara la pasada:** `derivacion-avisos` RQ-AV-16 y RQ-AV-17.
- **Ampliar el SLA a más estados:** lo decide Gerencia.
