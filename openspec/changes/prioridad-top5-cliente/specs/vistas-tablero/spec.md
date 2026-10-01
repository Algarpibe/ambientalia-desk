# Delta for vistas-tablero

Cambio `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`). Añadido el 2026-10-01 por la corrección de
lectura del maestro: «Mis Tickets» SÍ está decidido en lo que dice. Fuentes:
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711` (M1.9.1, fuera del §3.2 en revisión,
`:2946-3122`) y `:781` (§1.8 «Decisiones estructurales ya tomadas», decisión del 14/08, «cerradas en actas» en `:760`).
**Rehecho el mismo día** con `decision/e099-orden-cola-taller` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`;
respuesta literal en `docs/sdd/ENTRADA.md`, E-099): el desempate dentro de una prioridad es la fecha y hora de
«Habilitar Servicio», y el orden vale también para el tablero. Supuestos S-10, S-10a y S-10b de `proposal.md`. Diseño
en `design.md` §12. Continúa `RQ-VT-01..08`.

## ADDED Requirements

### Requirement: RQ-VT-09 · La cola del taller («Mis Tickets» y el tablero) se ordena en el servidor por urgencia y habilitación comercial

El servidor SHALL servir ordenadas por la MISMA función de `packages/shared` las dos listas de la cola del taller:
el listado de activos que pinta el tablero (`GET /api/tickets`) y «Mis Tickets» —los tickets no cerrados derivados al
usuario de la sesión, la misma noción que hoy filtra `apps/desk/src/lib/boardView.ts:44-46`—. El orden SHALL ser:

1. Primero la prioridad: `Urgent > High > Medium > Low > sin prioridad`. Un valor que no sea uno de esos cuatro
   (vacío, `null` o desconocido) SHALL contar como «sin prioridad».
2. Dentro de una misma prioridad, la fecha y hora de la transición `habilitar_servicio`, **ascendente** (el que
   Comercial habilitó antes va delante).
   - Si el ticket la ejecutó más de una vez, SHALL contar la **última** (S-10a).
   - Si no tiene esa fila, SHALL contar su `created_time` (S-10b). Sin ninguna de las dos fechas, va al final de su
     prioridad.

- Las fechas de habilitación SHALL leerse en una sola consulta para toda la lista, no una por ticket (sin N+1).
- El predicado «es de Mis Tickets» SHALL tener una sola implementación, en `packages/shared`, que consumen el
  servidor y `applyBoardView`. Dos implementaciones de la misma noción es el molde H5.
- **Regla invariable 13:** el cliente MUST NOT reordenar ninguna de las dos listas: las enseña en el orden que recibe.
- No es una regla de visibilidad: el listado de activos sigue sirviendo todos los tickets a todo el mundo (comentario
  de `boardView.ts:33-36`).

#### Scenario: de más a menos urgente
- GIVEN cinco tickets abiertos derivados al usuario, con prioridad `Low`, `null`, `Urgent`, `Medium` y `High`
- WHEN el usuario pide «Mis Tickets»
- THEN llegan en el orden `Urgent`, `High`, `Medium`, `Low`, sin prioridad

#### Scenario: dentro de una prioridad, el que se habilitó antes
- GIVEN dos tickets `High` derivados al usuario, el primero creado después pero habilitado antes que el segundo
- WHEN el usuario pide «Mis Tickets»
- THEN el habilitado antes va delante, aunque se creara después

#### Scenario: si se habilitó dos veces, cuenta la última
- GIVEN un ticket `High` habilitado dos veces, la primera antes y la segunda después que otro ticket `High`
- WHEN se pide la cola
- THEN va detrás del otro

#### Scenario: sin fila de habilitación cuenta la creación
- GIVEN un ticket `High` sin fila de `habilitar_servicio`, creado entre las habilitaciones de otros dos `High`
- WHEN se pide la cola
- THEN queda entre los dos

#### Scenario: la urgencia manda sobre la habilitación
- GIVEN un ticket `Low` habilitado antes que un ticket `High`
- WHEN se pide la cola
- THEN el `High` va delante

#### Scenario: un valor desconocido cuenta como sin prioridad
- GIVEN tickets derivados al usuario con prioridad `Alta`, `''` y `null`, y uno `Low`
- WHEN el usuario pide «Mis Tickets»
- THEN el `Low` va primero y los otros tres detrás, entre ellos por su habilitación

#### Scenario: sólo los suyos y abiertos
- GIVEN un ticket derivado a otro usuario, uno cerrado derivado al usuario y uno sin derivar
- WHEN el usuario pide «Mis Tickets»
- THEN ninguno de los tres aparece

#### Scenario: el tablero se ordena con la misma función
- GIVEN los mismos tickets
- WHEN se pide el listado de activos
- THEN llegan todos, en el orden de la cola del taller

#### Scenario: sin N+1
- GIVEN una lista de activos de N tickets y otra de 2N
- WHEN se piden
- THEN el número de consultas a la base es el mismo en las dos

#### Scenario: la vista del cliente no reordena
- GIVEN una lista de «Mis Tickets» en el orden del servidor
- WHEN `applyBoardView` la filtra con la clave `mios`
- THEN devuelve los tickets en el mismo orden y con el mismo predicado que el servidor

## Fuera de alcance

- Si la «fecha promesa» del maestro es el tiempo promesa global de E-095: lo que sigue abierto de E-093, sin destino.
- La lista de «Remisión creada» para Comercial ordenada por antigüedad (misma respuesta de E-099): es otra vista.
- Los bodegajes en días naturales (misma respuesta): F1A-04.
