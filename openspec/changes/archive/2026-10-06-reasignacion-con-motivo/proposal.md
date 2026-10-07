---
tanda: F1B-05
motivo: ""
capacidad: [trazas, derivacion-avisos, permissions, tickets-core]
maestro: ["M1.9.2", "M1.9.1", "M1.10"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — Reasignar la persona a cargo sin cambiar de estado, con motivo, traza y aviso (F1B-05)

## Intención

Hoy la persona a cargo de un ticket (`tickets.derivado_a`, `packages/zoho-sync/src/db/schema.sql:123`) sólo se
escribe dentro de una transición (`apps/desk/server/services/ticketService.ts:138-142`). Si el trabajo cambia de
manos sin que el ticket cambie de estado, no hay forma de registrarlo: o se ejecuta una transición que no
corresponde, o el ticket sigue figurando a nombre de quien ya no lo lleva.

Gerencia aprobó construirlo ya (`decision/e089-e220-visibilidad-y-traspaso`, `openspec/config.yaml:3992-4019`;
respuesta textual en `openspec/config.yaml:4000`): reasignar sin cambiar estado, con motivo y aviso. El maestro lo
describe en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`, dentro del protocolo
de traspaso de M1.9.2 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:677`).

**Éxito:** una persona autorizada cambia la persona a cargo desde el detalle del ticket, escribe por qué, la
persona que lo recibe se entera en la aplicación y por correo, y el historial lo enseña como una línea propia con
origen, destino, motivo, fecha y hora, y quién lo hizo. El estado, el reloj de la alarma y los indicadores no se
mueven.

## Alcance

**Dentro**

1. Ruta `POST /api/tickets/:id/reasignar`, en módulo propio.
2. Tabla de traza `public.reasignaciones` y su lectura como evento del historial.
3. Predicado de permiso y validador del cuerpo en `packages/shared`, consumidos por servidor y cliente.
4. Aviso a la persona de destino, en la aplicación y por correo.
5. `usosDeUsuario` cuenta las reasignaciones.
6. Prueba de extremo a extremo de que el sincronizador conserva la reasignación.
7. Panel «Reasignar» en el detalle del ticket.
8. Corrección 30 del maestro, como texto.

**Fuera**

- Restricción por propietario del registro: después del corte, con F1C-05
  (`openspec/config.yaml:4011-4014`; `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2037`).
- Segmentación de visibilidad: todos ven todo (`openspec/config.yaml:4002-4003`).
- Ausencias y disponibilidad por usuario: M6
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2036`).
- Vaciar la persona a cargo por esta vía; reasignar en bloque; relleno de datos anteriores.
- Cambios en `apps/desk/server/services/ticketService.ts` y en `packages/zoho-sync/src/db/repo.ts`: no se tocan.

## Capacidades

**Nuevas:** ninguna (R-2 no aplica).

**Modificadas**

| Capacidad | Qué cambia |
|---|---|
| `trazas` | Requisito nuevo (siguiente libre tras RQ-TZ-19, `openspec/specs/trazas/spec.md:704` en `821c348`): la reasignación guarda registro propio y SÍ se lee en el historial. Toca RQ-TZ-17 (ver D1). |
| `derivacion-avisos` | Requisito nuevo (tras RQ-AV-18, `openspec/specs/derivacion-avisos/spec.md:753`): aviso de reasignación, con su supresión. |
| `permissions` | Requisito nuevo (tras RQ-PM-26, `openspec/specs/permissions/spec.md:706` en `821c348`): quién reasigna. RQ-PM-11 (`openspec/specs/permissions/spec.md:251`) gana una fuente de «en uso». |
| `tickets-core` | Requisito nuevo: la ruta, su escalera de guardas y las reglas de contenido. |

`zoho-sync` no lleva delta: la prueba de D5 fija comportamiento que ya existe
(`packages/zoho-sync/src/db/repo.test.ts:47`). Hipótesis: si la fase de especificación encuentra un requisito de
esa spec que deba nombrarla, lo añade.

## Decisiones de diseño

### D1 · Traza en tabla propia, no en `ticket_transitions`

Tabla `public.reasignaciones`, calificada, **al final** de `packages/zoho-sync/src/db/schema.sql` (hoy termina en
`packages/zoho-sync/src/db/schema.sql:750-751`), con el patrón de `public.prioridad_ajustes`
(`packages/zoho-sync/src/db/schema.sql:613-622`): `id bigserial`, `ticket_id`, `de` (id de la persona anterior;
nulo si el ticket no tenía a nadie), `a` (id, obligatorio), `motivo` con `CHECK (motivo <> '')`,
`reasignado_por` (nombre, texto), `reasignado_at`. Un índice por `ticket_id`. Sin claves foráneas.

Por qué no una fila en `ticket_transitions` con `to_status` igual al estado actual, verificado:

| Lector | Qué haría con esa fila |
|---|---|
| `apps/desk/server/db/sla.ts:93-99` | Toma la entrada más reciente cuyo `to_status` es el estado actual: reiniciaría el reloj de la alarma. |
| `apps/desk/server/indicadores.ts:76` | Lee todas las filas como pasos del historial (`apps/desk/server/indicadores.ts:82`). Hipótesis sobre el efecto en cada indicador: no se leyó el cálculo. |
| `apps/desk/server/db/primerDerivado.ts:26-31` | Devuelve la primera fila con `derivado_a`: una reasignación en un ticket nunca derivado pasaría a ser «quien tomó el ticket». |
| `apps/desk/server/db/historial.ts:142-143` | Saldría como «Transición» y además como línea de traspaso. |
| `apps/desk/server/escritoresTransiciones.test.ts:57` | Inventario exacto de escritores: un quinto lo pone rojo aunque nombre al actor. |

El historial compone el evento al leer, en `apps/desk/server/db/historial.ts` (hoy junta tres fuentes en
`apps/desk/server/db/historial.ts:157`): título de reasignación con origen y destino resueltos por nombre, y
detalles De, A, Motivo y Reasignado por. El panel pinta hora, título y detalles sin conocer el tipo de evento
(`apps/desk/server/db/traspaso.ts:9`).

**Frente a RQ-TZ-17 y RQ-TZ-18.** RQ-TZ-17 exige declarar todo lo que cambia datos sin fila en
`ticket_transitions` (`openspec/specs/trazas/spec.md:639` en `821c348`) y cierra con que el historial no incorpora «ninguno de
esos registros propios» (`openspec/specs/trazas/spec.md:650` en `821c348`). La reasignación se declara ahí como registro propio
que **sí** entra, y esa frase pasa a referirse a los tres que no entran. RQ-TZ-18 prohíbe tabla y escritura nuevas
para la línea de traspaso **de una transición** (`openspec/specs/trazas/spec.md:659-661` en `821c348`): no cambia, porque la
reasignación no es una transición.

- **Supuesto reversible S-1:** `de` y `a` se guardan por id y se traducen al leer (mismo criterio que RQ-TZ-08,
  `openspec/specs/trazas/spec.md:192` en `821c348`); el actor, por nombre, como `performed_by`.

### D2 · Quién puede

Administrador, o usuario con alguna de las áreas de `areasSiguientes(estado, catalogoDelTicket(ticket))`
(`packages/shared/src/transitions.ts:327-334`, `packages/shared/src/flujos.ts:64-66`). Es el supuesto de la
consecuencia 4 de la decisión (`openspec/config.yaml:4013-4014`) y el criterio con que ya se ejecutan las
transiciones (`packages/shared/src/permissions.ts:4-7`).

El maestro dice otra cosa: «la persona a cargo y el Director o el Coordinador del área»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`). **La decisión gana** y aplaza
esa restricción a F1C-05; se entrega como corrección del maestro.

Predicado nuevo en `packages/shared` (regla invariable 13), junto a `SujetoDePermiso`
(`packages/shared/src/cargos.ts:37`).

- **Supuesto reversible S-2:** en un estado sin transiciones de salida, o fuera del catálogo del ticket, la lista
  de áreas es vacía y sólo reasigna un administrador.
- **Supuesto reversible S-3:** el cargo no interviene; ninguna excepción por cargo nueva.

### D3 · Contenido

- Motivo obligatorio: vacío o sólo espacios da `422`; se guarda recortado.
- Destino obligatorio, usuario existente y activo: `422`, mismo criterio que
  `apps/desk/server/services/ticketService.ts:138-142`.
- No se puede vaciar por esta vía.
- **Supuesto reversible S-4:** destino igual a la persona a cargo actual da `422`: no es una reasignación.
- **Supuesto reversible S-5:** reasignarse a uno mismo se permite y no genera aviso.
- **Supuesto reversible S-6:** el destino puede ser cualquier persona activa, sin exigir que sea del área. El
  maestro habla de «técnicos de la misma área»; la derivación de hoy tampoco lo exige.

### D4 · Aviso

A la persona de destino, en la aplicación (`apps/desk/server/db/avisos.ts:8-18`) y por correo
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2034`), con texto propio que incluye
el motivo y quién reasigna. Función pura aparte, como `avisoDerivacion`
(`apps/desk/server/services/avisoDerivacion.ts:30-38`), con la supresión de «a uno mismo» de RQ-AV-06
(`openspec/specs/derivacion-avisos/spec.md:251-261`).

Se escribe **fuera** de la transacción y un fallo del correo no tumba la acción: mismo patrón que
`apps/desk/server/services/ticketService.ts:157-164` (aviso después y fuera) y
`apps/desk/server/services/ticketService.ts:209-219` (el correo nunca tumba lo ya escrito; lo no sellado queda
para reintento).

- **Supuesto reversible S-7:** con copia al administrador, como el aviso de derivación
  (`apps/desk/server/services/ticketService.ts:181-183`). No se avisa a la persona de origen.

### D5 · Sincronizador

`derivado_a` está fuera de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:41-54`), así que la reasignación
sobrevive. La reasignación **no** pone `managed_by_app`: si lo pusiera, `upsertTicket` dejaría de sincronizar la
fila entera (`packages/zoho-sync/src/db/repo.ts:71`); es lo que sí hace una transición
(`packages/zoho-sync/src/db/repo.ts:298`).

Se prueba de extremo a extremo: ticket venido de Zoho → reasignar por la ruta → `upsertTicket` con un estado nuevo
de Zoho → `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` sigue `false`.

### D6 · Ruta y guardas

`POST /api/tickets/:id/reasignar`, en módulo propio, con el molde de
`apps/desk/server/routes/prioridad.ts:62-77`. Escalera: **A** existencia (`404`) < **B** permiso (`403`) <
**C** contenido (`422`: motivo; después destino ausente, destino igual al actual, destino inexistente o inactivo).
`UPDATE tickets SET derivado_a` más el alta de la traza en una transacción
(`apps/desk/server/db/transaccion.ts:13`). Registro en `apps/desk/server/app.ts:22` y
`apps/desk/server/app.ts:61`, sobre las líneas que ya existen; recibe `config` para el correo, como
`apps/desk/server/app.ts:59`.

Riesgo anotado para el diseño: dos reasignaciones simultáneas dejarían en la segunda un `de` que ya no es cierto.

### D7 · `usosDeUsuario`

Hoy cuenta dos referencias por id: `tickets.derivado_a` y `values->>'derivado_a'` de las transiciones
(`apps/desk/server/auth/users.ts:136-139`); lo guardado por nombre no cuenta
(`apps/desk/server/auth/users.ts:133-134`). Se añade una tercera: filas de `public.reasignaciones` con `de` o `a`
igual al id. `reasignado_por` es nombre y no cuenta.

### D8 · Cliente

Panel propio en la fila de paneles del detalle (`apps/desk/src/components/TicketDetailView.tsx:320`), con el patrón
de `PanelPrioridad` (`apps/desk/src/components/PanelPrioridad.tsx:16`): plegado, desplegable de persona, campo de
motivo, y los errores los dice el servidor (`apps/desk/src/components/PanelPrioridad.tsx:13`). No va junto a
«Derivado a» (`apps/desk/src/components/TicketProperties.tsx:120-130`) porque ese componente sólo recibe el detalle
y no tiene forma de avisar del cambio (`apps/desk/src/components/TicketProperties.tsx:93`).

La lógica decidible va en `apps/desk/src/lib/` con pruebas, como
`apps/desk/src/lib/personas.ts:18-30`. Sin jsdom ni testing-library.

**Tabla de la regla 13 (regla de mutación 3).** El servidor aún no existe: la columna nombra el requisito, y el
cierre de la tanda la rellena con ruta y línea.

| Decisión del cliente | Qué la impone en el servidor |
|---|---|
| Muestra el panel sólo a quien puede reasignar | Guarda B (`403`) con el mismo predicado de `packages/shared` |
| No ofrece a la persona a cargo actual | `422` de destino igual al actual |
| Ofrece sólo personas activas (`apps/desk/server/routes/directory.ts:49-51`) | `422` de destino inexistente o inactivo |
| No ofrece «Sin derivar» | `422` de destino obligatorio |
| Desactiva el botón con motivo vacío o de sólo espacios | `422` de motivo, con el mismo validador de `packages/shared` |
| Recarga ticket e historial al terminar | No decide nada |

## ¿Cierra F1B-05?

La fila es «Roles, traspaso, checkbox comercial, trazas»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:85`). Al 2026-10-05 le faltaban dos cosas
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:212`;
`openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:5`):

| Pieza | Situación |
|---|---|
| Visibilidad por área | Se cierra sin construir (`openspec/config.yaml:4002-4003`) |
| Reasignación con motivo y aviso | Este cambio |
| Línea de traspaso, trazas, casilla comercial | Construidas (`openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:5`) |
| Aviso personal al derivar | Construido (`apps/desk/server/services/ticketService.ts:169-185`) |
| «Mis tickets» de la persona de destino | Construido (`apps/desk/server/routes/prioridad.ts:83-86`, `packages/shared/src/prioridad.ts:112`) |
| Restricción por propietario | Fuera de la fila: F1C-05 (`openspec/config.yaml:4011-4012`) |
| Ausencias | Fuera de la fila: M6 |

No queda contenido construible de la fila. La decisión lo dice igual (`openspec/config.yaml:4015`).
**`cierra: si`.** Lo que queda abierto del cambio anterior son comprobaciones de persona y avisos del verify
(`openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:36-39`), no contenido de la fila.

Consecuencia al archivar: F1B-05 sale de «en curso», y la prueba que fija esa lista
(`apps/desk/server/reconciliacion/registro.test.ts:218-222`) cambia en el archivo, no antes. La tanda sólo cuenta
en el avance cuando esté archivada con verify PASS.

## Criterios de aceptación

1. Un usuario del área del estado reasigna: `200`, `derivado_a` cambia, `status` no.
2. Tras reasignar no hay fila nueva en `ticket_transitions`; el inventario de escritores sigue igual.
3. La entrada de `entradasActuales` para ese ticket es la misma antes y después.
4. `primerDerivado` devuelve lo mismo antes y después.
5. Hay una fila en `public.reasignaciones` con origen, destino, motivo recortado, actor y fecha.
6. El historial enseña un evento de reasignación con De, A, Motivo y Reasignado por; el origen nulo se lee «Sin derivar».
7. Sin área del estado y sin ser administrador: `403`. Administrador: pasa.
8. Estado sin transiciones de salida: `403` para no administradores.
9. Ticket inexistente: `404`, aunque el cuerpo sea inválido y el usuario no tenga permiso.
10. Motivo vacío o de espacios: `422`. Destino ausente, igual al actual, inexistente o inactivo: `422`.
11. El destino recibe aviso en la aplicación con el motivo y el nombre de quien reasigna; reasignarse a uno mismo no crea aviso.
12. Con el correo fallando, la respuesta es `200` y la reasignación y su traza quedan escritas.
13. Si falla el alta de la traza, `derivado_a` no cambia.
14. Tras `upsertTicket` con datos nuevos de Zoho, `derivado_a` se conserva, el estado de Zoho entra y `managed_by_app` es `false`.
15. No se puede borrar a un usuario que figura como origen o destino de una reasignación.
16. El predicado del cliente y la guarda del servidor son la misma función; un barrido de estados por áreas lo fija.
17. `npm test`, `npm run typecheck`, `npm run lint` y el detector de citas, en 0.

## Mutaciones que la tanda hará sobre sí misma

| Regla | Mutación | Debe ponerse rojo |
|---|---|---|
| 1 · posición | Mover el `403` delante del `404` | Prueba con ticket inexistente y usuario sin permiso |
| 1 · posición | Mover el `422` delante del `403` | Prueba con cuerpo inválido y usuario sin permiso |
| 1 · posición | Mover destino delante de motivo | Prueba con los dos inválidos |
| 2 · fichero vigilado | Escribir el `CREATE TABLE` sin `public.` en `schema.sql` | Guardián de `packages/zoho-sync/src/db/migrate.test.ts:271` |
| 2 · fichero vigilado | Quitar el `CHECK` del motivo en `schema.sql` | Prueba de la tabla |
| 3 · regla 13 | Hacer que el predicado devuelva siempre verdadero | Barrido de permisos contra la ruta |
| — | Añadir `managed_by_app=true` al `UPDATE` | Prueba de D5 |
| — | Sacar el alta de la traza de la transacción | Criterio 13 |
| — | Quitar la supresión «a uno mismo» | Criterio 11 |
| — | Quitar la tercera consulta de `usosDeUsuario` | Criterio 15 |

## Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/shared/src/` (módulo nuevo y su prueba; `index.ts`) | Nuevo |
| `packages/zoho-sync/src/db/schema.sql` | Añadido al final |
| `packages/zoho-sync/src/db/migrate.ts` (`PUBLIC_TABLES`, `packages/zoho-sync/src/db/migrate.ts:73`) | Modificado en sitio |
| `packages/zoho-sync/src/db/migrate.test.ts` (`packages/zoho-sync/src/db/migrate.test.ts:282-283`, `packages/zoho-sync/src/db/migrate.test.ts:652`; bloque nuevo al final) | Modificado |
| `apps/desk/server/db/` (acceso a la traza, evento del historial) | Nuevo |
| `apps/desk/server/db/historial.ts` | Modificado |
| `apps/desk/server/routes/` (módulo de la ruta) y `apps/desk/server/services/` (aviso) | Nuevo |
| `apps/desk/server/app.ts` | Modificado en sitio |
| `apps/desk/server/auth/users.ts` | Modificado |
| `apps/desk/src/api/client.ts`, `apps/desk/src/lib/`, `apps/desk/src/components/` (panel y `TicketDetailView.tsx`) | Nuevo y modificado |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, `DEPLOY.md`, `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, `openspec/config.yaml` | Al cierre |

**Ficheros muy citados y barrido de citas (regla de mutación 4).** `schema.sql` sólo crece por el final: no
desplaza nada. `app.ts` y `migrate.ts` se editan sobre líneas existentes. `historial.ts` y `users.ts` sí pueden
desplazar líneas: el cierre barre las citas completas a esos dos ficheros y a `migrate.test.ts`, y hace el segundo
pase de las abreviadas en los ficheros que ya los citan. La fusión del delta de `trazas` desplaza lo que sigue a
RQ-TZ-17: barrido de las citas a esa spec en el archivo.

## Lotes y estimación

Techo 800 por intento, válvula a 720. Estimación en bruto por 1,8. Cada lote es un intento, en el worktree de la tanda.

| Lote | Contenido | Bruto | × 1,8 |
|---|---|---|---|
| 1 · dominio y esquema | Predicado y validador en `shared` con pruebas; tabla, `PUBLIC_TABLES` y guardianes; acceso a la traza con prueba; `usosDeUsuario` | 320 | 576 |
| 2 · ruta, aviso y sincronizador | Ruta con sus pruebas de posición, permiso y contenido; aviso puro y correo; registro en `app.ts`; prueba de D5 | 335 | 603 |
| 3 · historial, cliente y documentos | Evento del historial; cliente de API, lógica en `lib` con prueba y panel; corrección 30; `DEPLOY.md`; traspaso en el paquete de despliegue | 345 | 621 |
| 4 · verify | Informe (sumando obligatorio; precedente de 358 líneas) y remediación | — | intento propio |

El archivo se mide aparte con la regla del archivo. Si un lote pasa de 720 al medirlo, se parte antes de asentar.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Otro lector de `ticket_transitions` o de `derivado_a` no inventariado | Baja | D1 no escribe en esa tabla; criterios 2 a 4 |
| Reasignaciones simultáneas con `de` falso | Baja | Resolver en diseño |
| S-2 deja sin poder reasignar a quien lleva un ticket en un estado sin salida | Media | Supuesto reversible; pregunta a Gerencia |
| El panel se ve mal en la aplicación | Media | `.tsx` fuera de la red de pruebas: tarea de persona P-1 |
| Estimación corta | Media | Medir antes de asentar; partir |

## Plan de reversión

Revertir la fusión de la rama. La tabla `public.reasignaciones` puede quedarse: nada más la lee. Los valores de
`derivado_a` ya reasignados se conservan y siguen siendo válidos, porque es la misma columna que escriben las
transiciones. Sin variables de entorno, sin relleno y sin interruptor.

## Dependencias

Ninguna externa. El correo usa el webhook de avisos que ya existe.

## Ronda de preguntas de la propuesta

Modo `auto`: no se pregunta antes de seguir. Los supuestos S-1 a S-7 quedan para revisión de Gerencia; los que
cambian lo que ve el usuario son S-2 (estados sin salida), S-4 (mismo destino), S-5 (a uno mismo) y S-6 (destino de
cualquier área). Ninguno cambia el alcance de la fila ni toca datos de producción.

## `toca_maestro: si`

Corrección **30** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (la última es la 29,
`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1456`; la 27 ya la anuncia,
`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1419-1421`):

- `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035`: quién reasigna pasa a
  «cualquiera del área del estado, o un administrador», hasta la restricción por propietario.
- `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062`: la pieza pasa a
  construida y la fila F1B-05 deja de estar «sin empezar».

El `.docx` no se toca.

## Tareas de personas — archivar no las da por hechas

Fuera del recuento de tareas.

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| P-1 · Verificar en la aplicación el panel, el aviso y la línea del historial | Analista | Tras el despliegue | Paquete de despliegue de la tanda |
| P-2 · Confirmar o corregir S-2, S-4, S-5 y S-6 | Gerencia | Panel | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` (traspaso de la tanda). `docs/sdd/ENTRADA.md` no se toca: tiene cambios de Supervisión sin commitear en `main`, y la entrada la abre Supervisión |
| P-3 · Pegar la corrección 30 en el maestro | Gerencia | Maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-4 · Desplegar y comprobar que existe `public.reasignaciones` en producción | Mantenedor | Producción | `DEPLOY.md` |

## Adenda tras el diseño — cuatro ajustes, anotados por el orquestador

El diseño (`openspec/changes/reasignacion-con-motivo/design.md`) encontró cuatro cosas que esta propuesta no recogía. Se aplican y quedan escritas aquí:

1. **Escalón D, `409`.** La carrera de dos reasignaciones simultáneas que D6 dejaba «para el diseño» se resuelve con un `UPDATE` condicionado a la persona a cargo leída: quien pierde recibe `409`, sin traza y sin aviso. La escalera de D6 pasa a A < B < C < D (RQ-TC-50).
2. **Supuesto reversible S-8.** Eliminar un ticket borra también sus filas de `public.reasignaciones`. `apps/desk/server/db/eliminarTicket.ts:45-56` no las barre hoy, y las filas huérfanas seguirían contando en `usosDeUsuario`: esa persona no se podría borrar nunca. Amplía «Áreas afectadas» a `apps/desk/server/db/eliminarTicket.ts`.
3. **RQ-TZ-06 también se modifica.** El requisito vivo dice que el historial combina tres fuentes y que no registra eventos en tabla propia (`openspec/specs/trazas/spec.md:139` en `821c348`, `openspec/specs/trazas/spec.md:149` en `821c348`); con este cambio son cuatro y la cuarta sí guarda registro propio. El delta de `trazas` lleva el bloque modificado.
4. **Cuatro lotes de construcción, no tres.** Con la cuenta por fichero del diseño, los lotes 2 y 3 de la tabla de arriba salían en 736 líneas, por encima de la válvula de 720. Los lotes vigentes son los del diseño, §8: 650, 499, 610 y 540 estimadas, más el verify en intento propio.
