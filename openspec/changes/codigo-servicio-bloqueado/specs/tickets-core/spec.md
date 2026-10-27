# Delta para tickets-core — el código de servicio se propone, se fija una vez y luego queda bloqueado (`fuera-del-plan`, `cierra: no`)

Construye `decision/ingreso-servicio-reescribe-codigo` (Gerencia, 16/10/2026) con los supuestos S-1 a S-8 de `proposal.md`
y las tareas de persona P-1 a P-5 (no se redefinen aquí). Numeración comprobada contra `openspec/specs/tickets-core/spec.md`:
el último requisito vivo es RQ-TC-80; los nuevos son RQ-TC-81 a RQ-TC-83. Marcas bajo `strict_tdd`: **ROJO** nace rojo;
**CARACTERIZACIÓN** fija lo que ya hay. El cliente (`TransitionPanel.tsx`) es `.tsx` y queda fuera de la red de pruebas por
decisión de Gerencia (F0-00, `vitest.config.ts:16`, `:17-20`): sus escenarios son **VERIFICACIÓN MANUAL**, sin rojo previo.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: **ningún bloque MODIFIED**, ninguna edición en
sitio, ninguna línea de la spec viva se mueve. La guarda del servidor (escalón B, `403`), su traza y su posición están en el
delta de `transitions-st` (RQ-TS-65 a RQ-TS-67); este delta fija la regla de dominio y la propuesta.

**Fuera de este delta** (proposal §3 y §9): esquema y migración (S-2); el sync de filas no gestionadas (S-6); una vía de
edición fuera de `Ingresado` (P-2, P-3); cómo se guarda el valor (sin recortar).

## ADDED Requirements

### RQ-TC-81 · El código de servicio se fija una vez; con código ya fijado, sólo un administrador lo cambia

El código de servicio de un ticket **SHALL** fijarse **una sola vez**: el primer envío que lo pone en un ticket que no lo
tiene (SUPUESTO S-2). La memoria de ese hecho es **el propio código no vacío**: **MUST NOT** añadirse columna, marca por fila
ni migración. «**Ya lo tiene**» **SHALL** significar que el valor guardado, recortado, no es vacío (SUPUESTO S-4); un valor
guardado sólo de espacios es «no lo tiene». Desde que lo tiene, un valor **distinto** —comparado recortado, sin distinguir
nada más— **SHALL** ser rechazado por el servidor a todo usuario que no sea administrador (`transitions-st` RQ-TS-65), y
reenviar el **mismo** valor recortado **SHALL** pasar (SUPUESTO S-4: el cliente reenvía lo prellenado). El administrador
**SHALL** poder cambiarlo, con traza (`transitions-st` RQ-TS-66). El predicado «cambia el código sin permiso» (con código
previo no vacío tras recortar, uno nuevo que venga —no `undefined`, `null` ni `''`, la definición de vacío del plan— y
distinto tras recortar, de modo que uno de sólo espacios cuenta como distinto, y sin `isAdmin`) **SHALL** vivir **una sola vez** en
`packages/shared` y ser **consumido** por el servidor y el cliente (regla invariable 13, punto 1).

Aplica a **todo** ticket con código previo, también a uno que vino de Zoho con el código ya puesto: ese ticket llega a
`Ingresado` con el campo bloqueado (SUPUESTO S-6 deja fuera el sync de las filas no gestionadas). El código nombra la carpeta
de Drive del equipo; por eso el cambio no lo hace cualquiera.

#### Scenario: un ticket sin código recibe el primero — ROJO
- GIVEN un ticket de servicio en `Ingresado` con `codigo_servicio` nulo y un técnico no administrador
- WHEN ejecuta `ingreso_a_servicio` con un código cualquiera
- THEN responde `200` y el ticket queda con ese código

#### Scenario: un código guardado sólo de espacios cuenta como «no lo tiene» — ROJO
- GIVEN un ticket con `codigo_servicio` igual a `'   '` y un técnico no administrador
- WHEN ejecuta `ingreso_a_servicio` con un código válido
- THEN responde `200` y el ticket queda con ese código

#### Scenario: un ticket de Zoho que ya trae código llega bloqueado — ROJO
- GIVEN un ticket sincronizado desde Zoho en `Ingresado`, con `codigo_servicio` ya puesto, sin que la app lo haya tocado
- WHEN un técnico no administrador ejecuta `ingreso_a_servicio` con un código distinto
- THEN responde `403` y el código no cambia

#### Scenario: no hay columna ni marca nueva — CARACTERIZACIÓN
- GIVEN el esquema de `packages/zoho-sync/src/db/schema.sql` antes y después del cambio
- WHEN corre el guardián de tablas y sentencias de `migrate.test.ts`
- THEN sus recuentos no cambian y ninguna sentencia nueva menciona el código de servicio

#### Scenario: el predicado vive una sola vez en `shared` — ROJO
- GIVEN el predicado «cambia el código sin permiso» de `packages/shared`
- WHEN se evalúa con (previo `A`, nuevo `B`, no admin), (previo `A`, nuevo ` A `, no admin), (previo vacío, nuevo `B`, no admin), (previo `A`, nuevo `B`, admin), (previo `A`, nuevo `'   '`, no admin) y (previo `A`, nuevo `''`, no admin)
- THEN da verdadero en el primero y en el de sólo espacios, y falso en los demás

### RQ-TC-82 · A un ticket sin código se le propone el deducido, igual que en el alta

Una función pura de `packages/shared` **SHALL** calcular la **propuesta** de código para un ticket que no lo tiene
(SUPUESTO S-3), componiendo `buildCodigoServicio` (`packages/shared/src/ticketCreate.ts:12-14`) con
`prefijoDeducido(clasificación, tipo de servicio)` (`packages/shared/src/ticketCreate.ts:47-49`), la **serie** y el **modelo** del
ticket y el **día civil de `America/Bogota` de `created_time`** del ticket (no el de hoy). El nombre y la firma los fija el
diseño; la consumen el cliente y las pruebas. Lo que falte (serie, modelo o fecha) **SHALL** omitirse **sin error**, como
en el alta: la función **MUST NOT** lanzar. La fecha **MUST** salir en `AAMMDD`.

La propuesta es una **sugerencia**: Servicio Técnico la confirma o la corrige una vez (RQ-TC-81), y el servidor **MUST NOT**
exigir que el valor enviado coincida con ella.

#### Scenario: el prefijo sale de la clasificación y del tipo — ROJO
- GIVEN tickets con clasificación `Equipo nuevo`, `Soporte remoto`, `Equipo para servicio de mantenimiento` con tipo `Calibración`, con tipo `Protocolo` y con cualquier otro tipo, y misma serie, modelo y fecha
- WHEN se calcula la propuesta de cada uno
- THEN los prefijos son `HV`, `SR`, `CG`, `PRO` y `MT`

#### Scenario: serie y modelo se componen en orden — ROJO
- GIVEN clasificación de mantenimiento, tipo `Reparación`, serie `18A18102`, modelo `EDM180C` y `created_time` del 2026-10-26 a las 15:00 en Bogotá
- WHEN se calcula la propuesta
- THEN es `MT_18A18102_EDM180C_261026`

#### Scenario: una serie o un modelo ausentes se omiten sin error — ROJO
- GIVEN un ticket sin modelo, y otro sin serie ni modelo
- WHEN se calcula la propuesta de cada uno
- THEN la primera es `MT_<serie>_<AAMMDD>`, la segunda `MT_<AAMMDD>`, y ninguna lanza

#### Scenario: el día es el civil de Bogotá de `created_time`, no el UTC ni el de hoy — ROJO
- GIVEN un `created_time` de `2026-10-27T03:00:00Z` (22:00 del 26 en Bogotá) y otro de `2026-10-27T12:00:00Z`
- WHEN se calcula la propuesta de cada uno en cualquier fecha de ejecución
- THEN terminan en `261026` y en `261027`

#### Scenario: sin `created_time` válido la fecha se omite — ROJO
- GIVEN un ticket sin `created_time` o con uno ilegible
- WHEN se calcula la propuesta
- THEN no lanza y el código sale sin el sufijo de fecha

#### Scenario: el servidor no exige que coincida con la propuesta — ROJO
- GIVEN un ticket sin código y un código tecleado distinto de la propuesta
- WHEN un técnico no administrador ejecuta `ingreso_a_servicio` con él
- THEN responde `200` y se guarda lo tecleado

### RQ-TC-83 · El cliente prellena y desbloquea por comodidad; no decide nada que el servidor no imponga (regla invariable 13)

`TransitionPanel.tsx` **SHALL**, en las transiciones que llevan `Código Servicio`:

- **prellenar** la propuesta de RQ-TC-82 cuando el ticket **no** tiene código (hoy `yaLoTraeElTicket`,
  `apps/desk/src/components/TransitionPanel.tsx:32-36`, sólo prellena lo que el ticket ya trae); el campo queda **editable**;
- **seguir mostrando bloqueado** el código cuando el ticket lo tiene y el usuario no es administrador
  (`apps/desk/src/components/TransitionPanel.tsx:80`, `:174`);
- **desbloquear** el campo al administrador, aunque el ticket ya tenga código.

Las tres son **comodidad probada** bajo la regla invariable 13, punto 3, sólo en la medida en que el servidor impone lo mismo:
el bloqueo y el desbloqueo se apoyan en RQ-TS-65 y en el predicado de `shared` (RQ-TC-81), que el cliente **consume** y no
reescribe; el cliente **MUST NOT** contener una segunda copia de la regla. Prellenar **no bloquea nada** y no tiene
contrapartida: Servicio Técnico puede corregir la propuesta.

**Casilla de regla invariable 13** (regla de mutación 3), decisión a decisión. La línea del servidor la escribe el cierre del
lote, porque la guarda nace en él.

| # | Decisión del cliente | `shared` | La impone el servidor |
|---|---|---|---|
| C-1 | Bloquear el código si el ticket ya lo tiene | predicado de RQ-TC-81 | la guarda `403` de RQ-TS-65 |
| C-2 | Desbloquear al administrador | la salida `isAdmin` de ese predicado | la misma guarda: deja pasar al administrador |
| C-3 | Prellenar la propuesta | función de RQ-TC-82 | **ninguna**: comodidad pura; no bloquea nada |
| C-4 | El código es obligatorio | `packages/shared/src/transitions.ts:77-78` | `apps/desk/server/transitionExec.ts:77` |

#### Scenario: un ticket sin código ve la propuesta en un campo editable — VERIFICACIÓN MANUAL
- GIVEN un ticket de servicio en `Ingresado` sin código
- WHEN un técnico abre `Ingreso a servicio`
- THEN el campo trae el código propuesto, puede editarlo, y al enviar el servidor acepta lo que quede escrito

#### Scenario: un ticket con código lo ve bloqueado para quien no es administrador — VERIFICACIÓN MANUAL
- GIVEN un ticket en `Ingresado` con código y un técnico no administrador
- WHEN abre `Ingreso a servicio` o `Calibración directa`
- THEN el campo muestra el código y no se puede editar

#### Scenario: el administrador ve el campo desbloqueado — VERIFICACIÓN MANUAL
- GIVEN el mismo ticket y un administrador
- WHEN abre cualquiera de las dos transiciones
- THEN el campo es editable y al enviar un código distinto el servidor responde `200`

#### Scenario: saltarse el cliente no salta la guarda — ROJO
- GIVEN un no administrador que manda a mano, sin pasar por la pantalla, un código distinto a un ticket que ya lo tiene
- WHEN el servidor recibe la transición
- THEN responde `403` (la imposición no depende de que el cliente bloquee el campo)

#### Scenario: el cliente reenvía lo prellenado y pasa — ROJO
- GIVEN un ticket con código y un no administrador cuya pantalla reenvía el mismo código, con espacios alrededor
- WHEN envía la transición
- THEN el servidor no ve un cambio y responde `200`
