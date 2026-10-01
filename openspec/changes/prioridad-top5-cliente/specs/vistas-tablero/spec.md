# Delta for vistas-tablero

Cambio `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`). Añadido el 2026-10-01 por la corrección de
lectura del maestro: «Mis Tickets» SÍ está decidido en lo que dice. Fuentes:
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711` (M1.9.1, fuera del §3.2 en revisión,
`:2946-3122`) y `:781` (§1.8 «Decisiones estructurales ya tomadas», decisión del 14/08, «cerradas en actas» en `:760`).
Supuesto S-10 de `proposal.md`. Diseño en `design.md` §12. Continúa `RQ-VT-01..08`.

## ADDED Requirements

### Requirement: RQ-VT-09 · «Mis Tickets» se ordena en el servidor de más a menos urgente

El servidor SHALL servir la lista de «Mis Tickets» —los tickets no cerrados derivados al usuario de la sesión, la
misma noción que hoy filtra `apps/desk/src/lib/boardView.ts:44-46`— ya ordenada por prioridad:
`Urgent > High > Medium > Low > sin prioridad`. Un valor que no sea uno de esos cuatro (vacío, `null` o desconocido)
SHALL contar como «sin prioridad».

- Dentro de una misma prioridad, el orden SHALL ser el de hoy: el del listado de activos
  (`packages/zoho-sync/src/db/repo.ts:151`, `created_time` descendente y sin fecha al final). Es el supuesto S-10: el
  desempate «FIFO inteligente por fecha promesa» de `:1711` no se construye, porque el maestro no define la fecha
  promesa (pregunta E-093 de `docs/sdd/ENTRADA.md`).
- El predicado «es de Mis Tickets» SHALL tener una sola implementación, en `packages/shared`, que consumen el
  servidor y `applyBoardView`. Dos implementaciones de la misma noción es el molde H5.
- **Regla invariable 13:** el cliente MUST NOT reordenar la lista: la enseña en el orden que recibe.
- No es una regla de visibilidad: el listado general sigue sirviendo todos los tickets a todo el mundo (comentario de
  `boardView.ts:33-36`) y su orden no cambia.

#### Scenario: de más a menos urgente
- GIVEN cinco tickets abiertos derivados al usuario, con prioridad `Low`, `null`, `Urgent`, `Medium` y `High`
- WHEN el usuario pide «Mis Tickets»
- THEN llegan en el orden `Urgent`, `High`, `Medium`, `Low`, sin prioridad

#### Scenario: dentro de una prioridad, el orden de hoy
- GIVEN dos tickets `High` derivados al usuario, el primero creado antes que el segundo
- WHEN el usuario pide «Mis Tickets»
- THEN el creado después va delante, como en el listado de activos

#### Scenario: un valor desconocido cuenta como sin prioridad
- GIVEN tickets derivados al usuario con prioridad `Alta`, `''` y `null`, y uno `Low`
- WHEN el usuario pide «Mis Tickets»
- THEN el `Low` va primero y los otros tres detrás, entre ellos en el orden de hoy

#### Scenario: sólo los suyos y abiertos
- GIVEN un ticket derivado a otro usuario, uno cerrado derivado al usuario y uno sin derivar
- WHEN el usuario pide «Mis Tickets»
- THEN ninguno de los tres aparece

#### Scenario: el listado general no cambia de orden
- GIVEN los mismos tickets
- WHEN se pide el listado de activos
- THEN el orden es el de hoy, `created_time` descendente, sin ordenar por prioridad

#### Scenario: la vista del cliente no reordena
- GIVEN una lista de «Mis Tickets» en el orden del servidor
- WHEN `applyBoardView` la filtra con la clave `mios`
- THEN devuelve los tickets en el mismo orden y con el mismo predicado que el servidor

## Fuera de alcance

- El desempate por fecha promesa: E-093, dueño Gerencia, sin destino.
- Ordenar las demás vistas del tablero por prioridad: el maestro sólo lo dice de «Mis Tickets».
