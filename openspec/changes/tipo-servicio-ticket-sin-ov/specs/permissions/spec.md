# Delta para permissions — OVI de garantía (F1B-03, parte L, lote 3)

> ## PENDIENTE DE Q1 — no construible hasta la respuesta
>
> **Todo este delta es un BORRADOR CONDICIONADO, no requisitos firmes.** El lote 3 está **BLOQUEADO** por la pregunta
> Q1 a Gerencia: «¿qué es crear la OVI de garantía dentro de Desk?». Las decisiones registradas dicen **quién** la crea
> (Director Técnico, `decision/ovi-garantia-autor`) pero no **qué es crearla**; Desk no escribe en Zoho
> (`decision/p44-escritura-zoho`) y las OVI se crean en Books. El texto de abajo está redactado **bajo la opción A** de la
> propuesta (restricción al **asociar** una orden `OVI-` a un ticket; las OVI se siguen creando en Books) y **sólo vale si
> Gerencia responde A**. Si responde B (registro propio en Desk, con tabla y migración) o C (escribir en Books,
> contradice p44), este delta se descarta y se abre cambio propio. Si no responde, `permissions` y `tickets-core` salen del
> cambio y la cabecera de la propuesta se corrige al archivar; el cambio se archiva sin el lote 3 y lo dice en su
> `archive-report.md`.
>
> **`sdd-tasks` SHALL tratar el lote 3 como lote bloqueado:** sin tarea de construcción ejecutable hasta que la respuesta
> de Q1 esté en `openspec/config.yaml` → `decisiones_de_gerencia`. Los lotes 1 y 2 no dependen de él.

## MODIFIED Requirements — BORRADOR, condicionado a Q1 = A

### RQ-PM-20 · Primitivas con llamador: OVI de garantía y Top 5 *(borrador)*

`shared` **SHALL** exportar `puedeCrearOVIGarantia` (Director Técnico o admin; área Servicio Técnico,
`packages/shared/src/cargos.ts:71-74`) y `puedeFijarPrioridadTop5` (Director Comercial o admin). `puedeFijarPrioridadTop5`
**tiene llamadores** desde F1B-07. `puedeCrearOVIGarantia` **SHALL tener llamador** en las tres puertas que asocian una orden
a un ticket (RQ-PM-24). La prueba de las primitivas **SHALL** decir que las dos tienen llamador: la que hoy afirma que
`puedeCrearOVIGarantia` no tiene ninguno (`packages/shared/src/cargos.test.ts:226-228`) **SHALL** invertirse. El comentario
«HOY NO LA LLAMA NADIE» (`packages/shared/src/cargos.ts:67-74`) y el título de la prueba
(`packages/shared/src/cargos.test.ts:117`) **SHALL** cambiar en sitio, sin añadir líneas.
(Previously: `puedeCrearOVIGarantia` «sigue sin llamador»; «este cambio MUST NOT construir el acto de la OVI de garantía»,
`openspec/specs/permissions/spec.md:411-418`.)

#### Scenario: Por cargo y admin *(sin cambio)*
- GIVEN cada uno de los siete cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

#### Scenario: Las dos primitivas tienen llamador *(borrador)*
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las dos primitivas
- THEN cada una tiene al menos uno en el servidor

## ADDED Requirements — BORRADOR, condicionado a Q1 = A

### RQ-PM-24 · Asociar una orden `OVI-` a un ticket exige el cargo *(borrador)*

Asociar a un ticket una orden de venta cuyo número sea `OVI-` (`packages/shared/src/subOV.ts:10`) **SHALL** exigir
`puedeCrearOVIGarantia` en el **servidor**, en las **tres** puertas que asocian una orden, y en todas con el mismo
predicado y el mismo mensaje en español:

| Puerta | Dónde | Respuesta |
|---|---|---|
| Alta del ticket | `apps/desk/server/services/ticketService.ts:37-44` | `403` |
| Transición (`plan.columns.orden_venta` u `ovAdicional`) | `apps/desk/server/services/ticketService.ts:148-152` | `403` |
| Remisión de entrada | `apps/desk/server/routes/remision.ts:220` y `:243` | `403` |

Las demás órdenes **MUST NOT** verse afectadas. El cargo **SHALL** seguir sin conceder nada que el área niegue (RQ-PM-21),
y **SHALL** seguir estricto mientras nadie tenga cargo asignado: sólo el administrador asocia una OVI (RQ-PM-22). La guarda
**MUST NOT** añadir vías de escritura de la orden ni cambiar la asociación propia OV↔ticket (IV-11).

**Posición (escalones).** El permiso es de escalón B (estado y permiso): en el alta y en la transición **SHALL** ir tras la
existencia de la orden y antes del contenido. En la **remisión de entrada** la guarda **SHALL** entrar en el mismo `if` que
«Orden de venta no encontrada» (`apps/desk/server/routes/remision.ts:220`) **sin mover** las guardas de las líneas 127, 155, 177
y 197, de modo que queda **detrás del `409` de remisión pendiente**: es el mismo molde ya registrado como IV-12 y no se corrige
aquí.

**Consecuencia de la opción A que Gerencia debe aceptar a sabiendas.** `puedeCrearOVIGarantia` exige el **área Servicio
Técnico** y `habilitar_servicio` es de **área Comercial** (`packages/shared/src/transitions.ts:178`): un Director Técnico sin
área Comercial sólo podría asociar la OVI en el alta o en la remisión de entrada, y Comercial no podría teclearla en la
transición.

**Regla 13.** Si el cliente oculta o rechaza una `OVI-` a quien no puede asociarla, esa decisión **SHALL** tener su imposición
en las tres líneas de arriba; sin ellas el cliente sería la guarda.

#### Scenario: Director Técnico asocia una OVI en el alta *(borrador)*
- GIVEN un usuario de Servicio Técnico con cargo Director Técnico
- WHEN crea un ticket con una orden `OVI-`
- THEN responde `201` y la orden queda asociada

#### Scenario: Quien no es Director Técnico no asocia una OVI en el alta *(borrador)*
- GIVEN un usuario de Comercial sin cargo
- WHEN crea un ticket con una orden `OVI-`
- THEN responde `403` y no se crea ningún ticket

#### Scenario: El administrador pasa sin cargo *(borrador)*
- GIVEN un administrador sin `cargo_permiso`
- WHEN asocia una orden `OVI-` en cualquiera de las tres puertas
- THEN la acción pasa

#### Scenario: Una orden ordinaria no se ve afectada *(borrador)*
- GIVEN un usuario sin cargo
- WHEN asocia una orden que no es `OVI-` en las tres puertas
- THEN las tres pasan como hoy

#### Scenario: Transición: la OVI se rechaza a quien no puede *(borrador)*
- GIVEN un usuario de Comercial sin cargo que ejecuta una transición con una orden `OVI-` en sus valores
- WHEN se evalúa la transición
- THEN responde `403`, y el ticket no cambia

#### Scenario: Remisión de entrada: la OVI se rechaza a quien no puede *(borrador)*
- GIVEN una remisión de entrada con una orden `OVI-` y un usuario sin cargo ni administración
- WHEN se envía
- THEN responde `403` y no se escribe ni la asociación ni la orden en el ticket

#### Scenario: Posición por puerta *(borrador)*
- GIVEN, en cada puerta, un caso que activa a la vez la guarda de la OVI y su vecina inmediata (la orden inexistente en el alta y en la remisión; el contenido en la transición)
- WHEN se evalúa
- THEN contesta la guarda que el escalón ordena (A antes que B antes que C antes que D), y mover la guarda de la OVI pone la prueba en rojo

#### Scenario: Sin cargos asignados sólo pasa el administrador *(borrador, RQ-PM-22)*
- GIVEN un entorno donde nadie tiene `cargo_permiso`
- WHEN un usuario no administrador asocia una `OVI-`
- THEN responde `403`

## Supuestos y preguntas ligadas

- **Q1 (bloquea el lote)**: A / B / C. Subpregunta: ¿un ticket de tipo de servicio «Garantía» debe llevar una OVI, y una
  OVI sólo puede ir en tickets de garantía? Hoy no hay relación entre los dos datos, y este borrador **no** la crea.
- **Persona (no es tarea):** asignar `cargo_permiso` «Director Técnico» en producción. Dueño: Gerencia o administrador.
  Condición de despliegue del lote 3; archivar no la da por hecha.
- Fuera de alcance, aunque Q1 = A: ficha de reclamación al fabricante (F1B-13), exclusión de las OVI en indicadores,
  guarda de titularidad (IV-8: una OVI a nombre de Ambientalia chocaría con ella el día que exista).
