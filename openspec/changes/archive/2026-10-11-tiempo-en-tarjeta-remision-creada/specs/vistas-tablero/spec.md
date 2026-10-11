## ADDED Requirements

### Requirement: RQ-VT-16 · La lista de «Remisión creada» trae los días hábiles en el estado calculados por el servidor, y tarjeta, lista y tabla los pintan en gris

Fuente: `decision/f1b07-tiempo-en-tarjeta-y-cierre-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), que responde E-192; condición que dejó escrita `RQ-VT-10` (`openspec/specs/vistas-tablero/spec.md:398-402`). Supuestos T1 a T7 de `proposal.md`, reversibles hasta el 2026-10-18. `RQ-VT-10` **no** se modifica.

Cada elemento de `GET /api/remision-creada` **SHALL** traer `diasHabilesEnEstado: number | null`, calculado por el servidor:

- **Cuenta (T1).** Son los días hábiles **posteriores** al día de entrada y hasta hoy **inclusive**: la semántica `(desde, hasta]` de `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`). El día de entrada **MUST NOT** contar.
- **Calendario.** Festivos de Colombia y cierres sembrados (`esDiaHabil`, `packages/shared/src/calendarioLaboral.ts:139`). El día civil de entrada y el de hoy se toman en la zona de negocio (T6; la misma que usa `horasHabilesEntre`, `packages/shared/src/calendarioLaboral.ts:176-178`), no en UTC.
- **Instante de entrada.** El mismo de `RQ-VT-10`. Sin instante legible el campo es `null` (T3).
- **Sólo en esta lista (T5).** El listado de activos y «Mis tickets» **MUST NOT** traer el campo.
- **Fuera del orden.** El campo **MUST NOT** cambiar qué tickets salen ni su orden (`RQ-VT-10`).
- **Texto fijo, función pura de `packages/shared` (T2, T3).** `0` → «Menos de 1 día hábil»; `1` → «1 día hábil»; `n` ≥ 2 → «n días hábiles»; `null` → «Sin fecha de entrada»; campo ausente → nada que pintar.
- **Regla invariable 13.** El cliente **MUST NOT** calcular el número ni decidir el texto: sólo pinta lo que devuelve la función de `shared` (comodidad probada en el servidor).
- **Dos relojes, declarado.** La alarma mide **horas** hábiles (`Remisión creada`: 27, `packages/shared/src/sla.ts:34`); el distintivo cuenta **días civiles** hábiles. Pueden discrepar y no es un defecto de este requisito.

#### Scenario: el día de entrada no cuenta
- GIVEN un ticket que entró el `2026-03-05T10:00:00-05:00` (jueves)
- WHEN se calcula con hoy `2026-03-05`
- THEN el número es `0` y el texto «Menos de 1 día hábil»

#### Scenario: días entre semana
- GIVEN un ticket que entró el martes `2026-03-03` y hoy es el jueves `2026-03-05`
- WHEN se calcula
- THEN el número es `2` (miércoles y jueves) y el texto «2 días hábiles»

#### Scenario: salta el fin de semana
- GIVEN un ticket que entró el viernes `2026-03-06` y hoy es el lunes `2026-03-09`
- WHEN se calcula
- THEN el número es `1` y el texto «1 día hábil»

#### Scenario: salta un festivo
- GIVEN el lunes `2026-03-23` festivo (San José, jueves 19 trasladado), un ticket que entró el viernes `2026-03-20` y hoy el martes `2026-03-24`
- WHEN se calcula
- THEN el número es `1` y no `2`

#### Scenario: salta un cierre sembrado
- GIVEN el `2026-03-11` sembrado como cierre, un ticket que entró el lunes `2026-03-09` y hoy el jueves `2026-03-12`
- WHEN se calcula
- THEN el número es `2` y no `3`

#### Scenario: el día se toma en la zona de negocio
- GIVEN un ticket que entró el `2026-03-10T02:00:00Z` (el `2026-03-09` a las 21:00 en Bogotá) y hoy es el `2026-03-10` a mediodía en Bogotá
- WHEN se calcula
- THEN el número es `1` (contando desde el día 9 de Bogotá, no desde el 10 UTC)

#### Scenario: sin fecha de entrada
- GIVEN un ticket en `Remisión creada` sin fila de entrada en `ticket_transitions`
- WHEN se pide la lista
- THEN trae `diasHabilesEnEstado: null`, va al final como dice `RQ-VT-10` y su texto es «Sin fecha de entrada»

#### Scenario: la lista trae el campo para todos
- GIVEN tickets de `Remisión creada`, con y sin orden de venta
- WHEN se pide `GET /api/remision-creada`
- THEN cada elemento trae el campo, `number` o `null`

#### Scenario: los demás listados no traen el campo
- GIVEN tickets activos y tickets del usuario
- WHEN se piden `GET /api/tickets` y `GET /api/mis-tickets`
- THEN ningún elemento trae `diasHabilesEnEstado`

#### Scenario: el orden de la lista no cambia
- GIVEN los tickets de las pruebas de orden de `RQ-VT-10`
- WHEN se añade el campo
- THEN el orden y la prueba de «sin N+1» (3 contra 6 tickets) siguen iguales

#### Scenario: textos exactos y campo ausente
- GIVEN la función de texto de `shared`
- WHEN recibe `0`, `1`, `3`, `null` y `undefined`
- THEN devuelve «Menos de 1 día hábil», «1 día hábil», «3 días hábiles», «Sin fecha de entrada» y nada, respectivamente

#### Scenario: los dos relojes pueden discrepar
- GIVEN un ticket que entró el lunes `2026-03-02` a las 16:00 (Bogotá) y ahora es el jueves `2026-03-05` a las 09:00
- WHEN se calculan el distintivo y las horas hábiles (`horasHabilesEntre`)
- THEN el distintivo dice `3` días hábiles (martes, miércoles y jueves), las horas hábiles son `20` (1 + 9 + 9 + 1), por debajo de las 27 de la alarma, y no hay alarma

#### Scenario: manual — el distintivo es gris
- GIVEN la vista «Remisión creada» tras el despliegue, con un ticket de pocos días y otro de muchos
- WHEN se comparan sus distintivos de tiempo
- THEN ambos son grises, nunca ámbar ni rojo (T4)
- Verificación anotada con su resultado por una persona (`.tsx` fuera de la red, F0-00)

#### Scenario: manual — tarjeta, lista y tabla
- GIVEN la vista «Remisión creada» en `ambientalia-desk.ambientalia.cloud`
- WHEN se cambia entre tarjeta, lista y tabla
- THEN los tres modos muestran el distintivo (T7), y las demás vistas no lo muestran (T5)
- Verificación por persona, tras el despliegue; **archivar no la da por hecha** (regla del ciclo 1). No se propone `jsdom` ni `@testing-library`
