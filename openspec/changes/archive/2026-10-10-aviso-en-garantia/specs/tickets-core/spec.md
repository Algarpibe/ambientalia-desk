## ADDED Requirements

### RQ-TC-58 · El estado de garantía de un ticket es un predicado único de `packages/shared`: día de creación contra fin de garantía, en `America/Bogota`

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`) y maestro R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1611-1614`, `[DECIDIDO 30/09/2026]`): el distintivo se calcula por «fecha de creación ≤ fin de garantía», y sin fin registrado se muestra «Garantía sin dato».

El sistema **SHALL** tener **una sola** función pura en `packages/shared` (nombre y fichero los fija el diseño) que, dados el instante de creación del ticket y el fin de garantía del equipo, devuelve exactamente uno de tres valores: `en_garantia`, `sin_dato` o `vencida`.

- **Día de negocio.** El instante de creación **SHALL** convertirse al día civil de `America/Bogota` (`diaEnZona`, `packages/shared/src/fechasDerivadas.ts:63`) antes de comparar. **MUST NOT** compararse el instante en UTC ni recortar su texto ISO a diez caracteres.
- **Fin de garantía.** Es un día `YYYY-MM-DD` (`desk.equipos.fin_garantia`, tipo `date`). Se compara **como día**, nunca como instante.
- **Regla.** Si el fin es nulo, vacío o no es una fecha válida, el resultado **SHALL** ser `sin_dato`. Si no, y el día de creación es **menor o igual** que el fin, `en_garantia`; si es posterior, `vencida`. El día del fin cuenta como dentro de la garantía.
- **Sin equipo.** Un ticket sin equipo **MUST NOT** recibir ninguno de los tres valores: no tiene hoja de vida que completar (supuesto S3 de la propuesta). El predicado se invoca sólo cuando hay equipo.
- **Independiente del estado del ticket.** El resultado **MUST NOT** depender de si el ticket está abierto o cerrado (supuesto S4).
- **Calculado al leer.** No se guarda columna ni histórico: editar el `finGarantia` del equipo cambia el resultado de todos sus tickets, también los antiguos (supuesto S8). «Fecha de creación» es `tickets.created_time`, también en los venidos de Zoho (supuesto S9).
- **Regla invariable 13.** La fórmula vive sólo en `packages/shared`; el servidor la impone y el cliente **MUST NOT** reescribirla.

#### Scenario: creado a las 20:00 (−05:00) del día del fin, es «en garantía»
- GIVEN un fin de garantía `2026-03-15` y un ticket creado el `2026-03-15T20:00:00-05:00` (ya es el 16/03 en UTC)
- WHEN se evalúa el predicado
- THEN devuelve `en_garantia`

#### Scenario: creado a las 00:30 (−05:00) del día siguiente al fin, es «vencida»
- GIVEN un fin de garantía `2026-03-15` y un ticket creado el `2026-03-16T00:30:00-05:00`
- WHEN se evalúa el predicado
- THEN devuelve `vencida`

#### Scenario: creado un día antes del fin
- GIVEN un fin de garantía `2026-03-15` y un ticket creado el `2026-03-14T09:00:00-05:00`
- WHEN se evalúa el predicado
- THEN devuelve `en_garantia`

#### Scenario: la frontera no depende de la zona del proceso
- GIVEN los dos instantes frontera anteriores
- WHEN se evalúan con `TZ=UTC` y con `TZ=America/Bogota`
- THEN los resultados son idénticos (`en_garantia` y `vencida`)

#### Scenario: fin nulo, vacío o inválido es «sin dato»
- GIVEN un ticket con equipo cuyo fin de garantía es `null`, la cadena vacía o `no-es-fecha`
- WHEN se evalúa el predicado
- THEN devuelve `sin_dato` en los tres casos

#### Scenario: un ticket cerrado conserva su resultado
- GIVEN un ticket cerrado creado dentro de la garantía de su equipo
- WHEN se calcula su marca
- THEN es `en_garantia`, igual que si estuviera abierto

#### Scenario: editar el fin de garantía recalcula
- GIVEN un ticket creado el `2026-03-20` de un equipo con fin `2026-03-15` (`vencida`)
- WHEN Comercial cambia el fin del equipo a `2026-04-01` y se vuelve a calcular
- THEN el resultado es `en_garantia`, sin haber escrito nada en el ticket

### RQ-TC-59 · El servidor calcula la marca de garantía del ticket y la entrega en el detalle y en la búsqueda de equipos

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`); maestro R08.4 (`R08.4.md:1611-1614`).

El detalle del ticket (`GET /api/tickets/:id`) **SHALL** traer la marca de garantía calculada por el servidor con el predicado de `RQ-TC-58` (nombre y forma del campo los fija el diseño). La marca **SHALL** calcularse con una consulta aparte del fin de garantía del equipo del ticket, **sin unir `equipos` en las consultas de tickets** y sin tocar el esquema. Si el ticket no tiene equipo, la marca **SHALL** estar ausente. El fin de garantía **SHALL** leerse como día `YYYY-MM-DD` sin pasar por un `Date` en la zona del proceso. Si la consulta del fin falla, la marca queda sin calcular y la respuesta **MUST** servirse igual (la marca nunca bloquea la lectura).

La búsqueda de equipos (`searchEquipos`) **SHALL** devolver el `finGarantia` de cada equipo, para que el aviso de `RQ-TC-60` lo evalúe con el mismo predicado. Es un dato que ya ve cualquier sesión por `GET /api/equipos/:id`; no se añade permiso.

La marca es una vista: **MUST NOT** escribir en la base, ni cambiar el estado del ticket, ni producir transición, ni avisar por correo o bandeja.

#### Scenario: el detalle trae «en garantía»
- GIVEN un ticket cuyo equipo tiene fin de garantía posterior al día de creación del ticket
- WHEN se pide `GET /api/tickets/:id`
- THEN la respuesta trae la marca `en_garantia`

#### Scenario: el detalle trae «sin dato»
- GIVEN un ticket con equipo sin fin de garantía registrado
- WHEN se pide el detalle
- THEN la marca es `sin_dato`

#### Scenario: el detalle de un ticket vencido trae «vencida»
- GIVEN un ticket creado después del fin de garantía de su equipo
- WHEN se pide el detalle
- THEN la marca es `vencida`, que el cliente no pinta

#### Scenario: ticket sin equipo, sin marca
- GIVEN un ticket sin `equipo_id`
- WHEN se pide el detalle
- THEN la marca está ausente y no se consulta `equipos`

#### Scenario: el `date` se lee sin desfase de zona
- GIVEN un equipo con `fin_garantia` `2026-03-15` y el servidor corriendo bajo una zona distinta de `America/Bogota`
- WHEN se calcula la marca de un ticket creado el `2026-03-15T20:00:00-05:00`
- THEN es `en_garantia` (el fin se leyó como `2026-03-15` exacto)

#### Scenario: la consulta del fin falla, el detalle se sirve
- GIVEN un fallo al leer `equipos`
- WHEN se pide el detalle
- THEN responde `200` con el ticket, sin la marca

#### Scenario: la búsqueda de equipos trae el fin de garantía
- GIVEN un equipo con fin de garantía `2026-03-15`
- WHEN se llama a `searchEquipos` que lo devuelve
- THEN el resultado lleva `finGarantia` igual a `2026-03-15`, y el campo ausente si el equipo no lo tiene

#### Scenario: calcular la marca no escribe nada
- GIVEN un ticket con marca calculable
- WHEN se pide el detalle
- THEN no hay filas nuevas en `ticket_transitions`, el estado no cambia y no se escribe ninguna columna de garantía

### RQ-TC-60 · Aviso al elegir equipo en el alta y sugerencia de «Reporte por garantía» en Notificado; ninguno bloquea ni rellena (verificación manual)

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`): aviso «al elegir el equipo» y sugerencia en Notificado «sin obligar»; maestro R08.4 (`R08.4.md:1611-1614`; `R08.4.md:1477`, `R08.4.md:4550`: la aplicación sugiere, no obliga).

**Aviso en el alta.** Al elegir un equipo existente en `CreateTicket`, el cliente **SHALL** mostrar el aviso «En garantía» si el predicado de `RQ-TC-58`, evaluado con el instante actual y el `finGarantia` que devuelve la búsqueda de equipos, da `en_garantia`, y «Garantía sin dato» si da `sin_dato`; con `vencida`, no muestra nada. Es **informativo**: **MUST NOT** bloquear el alta, rellenar campos ni cambiar la selección. El ticket que se cree recibe la marca del servidor (`RQ-TC-59`). Al dar de alta un **equipo nuevo** desde el ticket **no** hay aviso (supuesto S5: la fecha la teclea el usuario y no hay contrapartida probada en servidor antes de crear).

**Sugerencia en Notificado.** Con el ticket en `Notificado` y la marca `en_garantia` del detalle, `TransitionPanel` **SHALL** destacar la salida «Reporte por garantía» (`packages/shared/src/transitions.ts:218`) y mostrar una línea de texto que explique la sugerencia. **MUST NOT** ocultar, deshabilitar ni preseleccionar ninguna de las otras salidas de `Notificado` (`devolucion_a_correccion`, `escalado_a_comercial`); las tres siguen sujetas a `canExecuteTransition` exactamente como hoy. La sugerencia **MUST NOT** tener guarda ni imposición en el servidor, ni cambiar el grafo de transiciones, los permisos o `ticketService.ts` (supuesto S7).

**Regla invariable 13.** Ninguna de las dos decisiones impone nada: avisan. Por eso no nombran línea del servidor que las imponga; el cliente **MUST NOT** recalcular la marca del detalle, sólo leerla. El aviso del alta usa el predicado compartido, no una copia.

**Verificación manual.** Los puntos tocan `.tsx` (`CreateTicket.tsx`, `TransitionPanel.tsx`), que queda **fuera de la red de pruebas** por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este requisito **no admite escenario automatizado**. **No** se propone `jsdom` ni `@testing-library` (mismo precedente que `RQ-VT-13`). La lógica que sí es `.ts` se prueba en `RQ-TC-58` y `RQ-TC-59`. Verificación por persona, **tras el despliegue** y sin contar como tarea de la tanda (regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — aviso «En garantía» al elegir equipo
- GIVEN el formulario de alta en `ambientalia-desk.ambientalia.cloud`, tras el despliegue, y un equipo con fin de garantía igual o posterior a hoy
- WHEN se elige ese equipo en la búsqueda
- THEN se ve el aviso «En garantía», y el formulario sigue permitiendo crear el ticket y no cambia ningún otro campo

#### Scenario: manual — aviso «Garantía sin dato»
- GIVEN un equipo sin fin de garantía registrado
- WHEN se elige en el alta
- THEN se ve «Garantía sin dato», y un equipo con garantía vencida no muestra ningún aviso

#### Scenario: manual — equipo nuevo sin aviso
- GIVEN el alta con «Equipo nuevo» y una fecha de fin de garantía tecleada
- WHEN se completa el formulario
- THEN no aparece aviso de garantía; el ticket creado sí lleva la marca del servidor en su cabecera

#### Scenario: manual — Notificado con garantía, la sugerencia no oculta ni bloquea las otras salidas
- GIVEN un ticket en `Notificado` con marca `en_garantia` y un usuario que puede ejecutar las tres salidas
- WHEN se abre el panel de transiciones
- THEN «Reporte por garantía» aparece destacado con su línea de texto, y «Devolución a corrección» y «Escalado a Comercial» siguen visibles y habilitadas, ninguna preseleccionada

#### Scenario: manual — Notificado sin garantía, sin sugerencia
- GIVEN un ticket en `Notificado` con marca `sin_dato`, `vencida` o ausente
- WHEN se abre el panel de transiciones
- THEN no hay destacado ni línea de sugerencia, y las tres salidas están como hoy

#### Scenario: la sugerencia no cambia las guardas del servidor
- GIVEN un usuario sin permiso para «Reporte por garantía»
- WHEN intenta ejecutarla con el ticket en `Notificado` y marca `en_garantia`
- THEN el servidor responde exactamente lo que respondía antes de este cambio
