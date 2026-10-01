---
tanda: F1B-07
motivo: ""
capacidad: [tickets-core, transitions-st, permissions, vistas-tablero]
maestro: ["M1.9.1", "§1.8", "Anexo D nº 53"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: prioridad del cliente y Top 5 (F1B-07, parte decidida)

Base `6055c4d`. Exploración en `openspec/changes/prioridad-top5-cliente/exploration.md`. Modo `auto` (producción,
`CLAUDE.md` «Regla de ejecución»): no hay ronda de preguntas; los supuestos S-1…S-9 son la superficie revisable.

## Intención

- `decision/top5-manual` (`openspec/config.yaml:1949-1965`, respuesta `:1954`): la prioridad automática sigue para
  todos; los Top 5 son la excepción, se fija a mano **sobre el cliente** y sus tickets la heredan; la pone el Director
  Comercial, que también mantiene la lista; el técnico no puede editarla; ese mismo cargo puede ajustar un ticket
  concreto con motivo escrito.
- `decision/anexo-53-contratos` (`:2448-2468`, regla `:2456`): contrato vigente → `High`; si además es Top 5, «manda la
  prioridad más alta de las dos». Consecuencia (3) `:2463`: F1B-07 modela la prioridad en el cliente.
- Cargo: `decision/c10-permisos-cargo` (`:1934`), `decision/c10b-gerente-director` (`:2589`); primitiva ya construida y
  sin llamador, `puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`, RQ-PM-20 en
  `openspec/specs/permissions/spec.md:359`).
- Hoy: `prioridadAlNacer` (`packages/shared/src/contratos.ts:66-69`) sólo conoce el contrato y acepta cualquier cadena
  (`:68`); se llama en `apps/desk/server/services/ticketService.ts:106`. La noción de Top 5 no existe en el código
  (`config.yaml:1961`, remedido en la exploración). Y el técnico **debe** elegir prioridad: `priority()` es obligatorio
  (`packages/shared/src/transitions.ts:83-84`) en `escalado_a_revision` y `devolucion_a_correccion` (`:192-195`), las
  dos de área Servicio Técnico — lo contrario de «edición manual bloqueada para el técnico»
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:162`).

## Alcance

**Dentro**
1. **Modelo en el cliente.** Tabla propia calificada `public.cliente_prioridad` (`client_id` PK texto sin FK,
   `top5` booleano, `prioridad`, `actualizado_por`, `actualizado_at`) al FINAL de
   `packages/zoho-sync/src/db/schema.sql` (hoy 601 líneas). El cliente es `books.contacts` expuesto por la vista
   `public.clients` (`schema.sql:169-173`), que no admite columnas; precedente `public.contratos` (`:561-573`).
2. **Fijar Top 5 y su prioridad**: rutas de lectura y escritura, escritura sólo con `puedeFijarPrioridadTop5` (se
   CONSUME, no se reescribe); valor en lista blanca `High | Medium | Low` (las opciones de `transitions.ts:84`); 422
   fuera de lista; 403 sin permiso.
3. **«Manda la más alta» dentro de `prioridadAlNacer`**, editando en sitio `contratos.ts:66-69` y la llamada
   `ticketService.ts:106` (sin mover líneas). Orden `High > Medium > Low`. Las cuatro combinaciones probadas:
   contrato sí/no × Top 5 sí/no. Ninguno de los dos → comportamiento de hoy (la pedida).
4. **Ajuste por ticket** de un cliente Top 5: motivo escrito obligatorio (422 si falta), sólo
   `puedeFijarPrioridadTop5`, traza en tabla propia calificada `public.prioridad_ajustes` (ticket, anterior, nueva,
   motivo, autor, fecha), **no** en `ticket_transitions`: una fila con el estado actual reiniciaría el SLA
   (`apps/desk/server/db/sla.ts:88-98`).
5. **Guarda del técnico en el SERVIDOR** para las dos transiciones (S-2).
6. **UI** (fuera de la red de pruebas, F0-00; no se propone `jsdom`): marcar Top 5 y fijar su prioridad desde el
   cliente; ajuste por ticket con motivo; `TransitionPanel` deja de exigir prioridad. Regla 13 / mutación 3: cada
   decisión del cliente con su línea de servidor, por escrito, en el cierre.
7. **«Mis tickets» ordenado de más a menos urgente, en el SERVIDOR** (corrección de lectura del 2026-10-01). Está
   decidido en lo que dice: M1.9.1 lo recoge en `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711`, fuera del único apartado
   marcado en revisión (el §3.2, `:2946-3122`), y el §1.8 «Decisiones estructurales ya tomadas» («cerradas en actas»,
   `:760`) lo da como implicación de la decisión del 14/08 en `:781`. Orden `Urgent > High > Medium > Low > sin
   prioridad`, con prueba. Hoy el servidor no ordena por prioridad (`packages/zoho-sync/src/db/repo.ts:151`, `ORDER BY
   t.created_time DESC NULLS LAST`) y la vista sólo filtra (`apps/desk/src/lib/boardView.ts:44-46`). Ruta propia y
   predicado compartido: `design.md` §12. **Dentro de la misma prioridad, la fecha y hora de «Habilitar Servicio»**
   (S-10, rehecho el 2026-10-01).
8. **El tablero se ordena igual** (añadido el 2026-10-01). Fuente: `decision/e099-orden-cola-taller`
   (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`, respuesta literal de E-099 en `docs/sdd/ENTRADA.md`):
   «la cola de trabajo del taller («Mis tickets» y el tablero) los ordena por la fecha y hora en que Comercial los
   habilitó («Habilitar Servicio») […] primero la prioridad […] y, entre tickets de la misma prioridad, el orden de
   habilitación comercial». **Una sola función de orden** en `packages/shared`, que consumen en el servidor
   `GET /api/mis-tickets` y el listado de activos que pinta el tablero (`GET /api/tickets`); dos implementaciones
   serían el molde H5. Los bodegajes en días naturales de la misma respuesta son de F1A-04 y no entran aquí.

**Fuera**
- Calificación de los clientes sin contrato ni Top 5, número de niveles y quién ajusta fuera de Top 5: pregunta 3.b
  abierta (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`; quién ajusta, `:87`). El modelo de prioridad del maestro
  ocupa `R08.2.md:1696-1710` y su regla manual («sólo por superadministrador o Director Técnico») está en `:1709`, pero
  no es respuesta de Gerencia, y `decision/c10-permisos-cargo` cierra la lista de excepciones por cargo en tres
  (`openspec/config.yaml:1932-1934`): esta tanda **no** construye una excepción para el Director Técnico. Por eso
  `cierra: no`.
- **La «fecha promesa» del maestro** (`R08.2.md:1711`). El desempate ya no depende de ella: lo fija E-099
  (alcance 8). Lo que E-093 deja abierto —si esa «fecha promesa» es el tiempo promesa global de E-095, que va después
  del corte— no lo construye esta tanda.
- **La lista de «Remisión creada» para Comercial ordenada por antigüedad** (misma respuesta de E-099): es otra vista,
  no la cola del taller; queda fuera de esta tanda. Registrada como **E-108** en `docs/sdd/ENTRADA.md`, sin destino
  y con dueño propuesto (R-3).
- Propagación a los tickets abiertos que ya existan (S-1): punto abierto con dueño Gerencia, sin destino.
- Tope numérico de la lista (S-7).
- Tickets sin `client_id` (tickets de Zoho no enlazados): no heredan.
- `upsertTicket`, `TICKET_COLS` y el sincronizador (IV-11): no se tocan. `remision.ts` (IV-12): no se toca.

## Capacidades

**Nueva:** ninguna; R-2 no aplica y `config.yaml` no se toca. Justificación: la fila del plan asigna F1B-07 a
`tickets-core` (`plan:499`), y las otras tres ya existen (`vistas-tablero` está en `capabilities`,
`openspec/config.yaml:280`).
**Modificadas:**
- `tickets-core`: RQ-TC-24 (`openspec/specs/tickets-core/spec.md:856-868`, que deja fuera «la más alta de las dos» para
  F1B-07 en `:868`) pasa a combinar contrato y Top 5; requisitos nuevos de prioridad del cliente, lista Top 5 y ajuste
  con traza.
- `transitions-st`: `priority` deja de ser obligatorio en las dos transiciones y gana la guarda de servidor (mapa de
  campos en `openspec/specs/transitions-st/spec.md:310`).
- `permissions`: RQ-PM-20 (`permissions/spec.md:359-362`, «hoy no las llama nadie») — `puedeFijarPrioridadTop5` pasa a
  tener llamadores.
- `vistas-tablero`: requisito nuevo RQ-VT-09, «Mis tickets» y el tablero ordenados en el servidor por urgencia y, dentro
  de ella, por la habilitación comercial (la capacidad acaba hoy en RQ-VT-08).

## Enfoque

- **Dominio en `shared`**: función pura «la más alta» y lista blanca junto a `prioridadAlNacer`; la firma gana la
  prioridad Top 5 del cliente (o `null`).
- **Herencia al nacer (S-1)**: el alta lee `cliente_prioridad` del cliente del TICKET (`ticketService.ts:106`,
  `clientId!`), como RQ-TC-24 `:866`, no el de la OV.
- **Guarda (S-2)**: edición en sitio sobre `ticketService.ts:131`, tras el 403 de cargo y antes del 422 (`:132-134`).
  Regla de mutación 1: prueba de posición frente al 403 de área (gana el área) y frente al 422 (gana la guarda), con
  mutación de posición.
- **Sync (S-6)**: el ajuste marca `managed_by_app=true` en la misma transacción, como `writeTransition`
  (`packages/zoho-sync/src/db/repo.ts:298`); `upsertTicket` ya se abstiene ante esa marca (`:71`).

## Supuestos reversibles (modo `auto`)

- **S-1 · Herencia al nacer.** La prioridad Top 5 se aplica a los tickets **nuevos**. Los abiertos que existan cuando
  un cliente se marca Top 5 NO cambian solos; para ellos está el ajuste por ticket. `top5-manual` dice «todos sus
  tickets la heredan»: esta tanda lo cumple para los nuevos; la propagación a los abiertos queda como **punto abierto
  con dueño Gerencia**, sin destino inventado.
- **S-2 · Guarda del técnico.** `priority()` deja de ser obligatorio (edición en sitio de `transitions.ts:84`, sin mover
  líneas) y el servidor responde 403 si `values.priority` viene y es distinta de la actual, salvo admin o
  `puedeFijarPrioridadTop5`. Como las dos transiciones son de Servicio Técnico y el predicado exige área Comercial, en
  la práctica sólo el admin (o un usuario con las dos áreas y cargo Director Comercial) cambia ahí la prioridad.
- **S-3 · `Urgent`.** Existe en datos de Zoho (`packages/zoho-sync/src/db/mappers.ts:207`), no en `transitions.ts:84`. No se ofrece ni se asigna;
  si una comparación lo encuentra, se trata como superior a `High`. La pedida del alta sigue sin lista blanca
  (comportamiento de hoy, 3.b); un valor desconocido pierde siempre frente al Top 5 y al contrato.
- **S-4 · Área del predicado.** S-9 de F1C-05 (área Comercial) se confirma como supuesto: `top5-manual` no nombra área
  y c10 (`config.yaml:1932`) dice que la base sigue siendo el área. Un Director Comercial sin área Comercial queda fuera.
- **S-5 · Un solo predicado** para fijar prioridad, mantener la lista y ajustar por ticket («ese mismo cargo», `:1954`).
- **S-6 · Ajuste y sync.** Marcar `managed_by_app` congela la fila entera frente a Zoho, igual que la primera
  transición. Alternativa descartada: rechazar el ajuste sobre tickets no gestionados.
- **S-7 · Sin tope.** «Top 5» se toma como nombre, no como número (hipótesis); la UI muestra el recuento.
- **S-8 · Ajuste sólo en tickets de cliente Top 5** (fuera de Top 5 es la 3.b) → 409 en otro caso.
- **S-9 · Desmarcar Top 5** no toca los tickets ya creados.
- **S-10 · Desempate de la cola del taller («Mis tickets» y tablero). REHECHO el 2026-10-01** con
  `decision/e099-orden-cola-taller`: dentro de una misma prioridad, el que Comercial habilitó antes va delante (la
  fecha y hora de la transición `habilitar_servicio` en `ticket_transitions`, ascendente). Un valor que no sea
  `Urgent`, `High`, `Medium` ni `Low` (vacío, `null` o desconocido) cuenta como «sin prioridad» y va al final. Lo que
  E-099 NO dice, y por eso son supuestos:
  - **S-10a · Si se habilitó dos veces, cuenta la ÚLTIMA.** La respuesta habla de cuándo un equipo «sale de esa
    espera»; si volvió a ella y salió otra vez, la salida que lo puso en la cola actual es la última. Se prueba con
    un ticket que la ejecutó dos veces.
  - **S-10b · Sin fila de habilitación, cuenta su creación** (`created_time`). Los tickets traídos de Zoho, y los
    que nunca pasaron por la espera comercial, no tienen esa fila. Sin ninguna de las dos fechas, van al final de su
    prioridad. Se prueba con un ticket sin fila.
  - Antes del 2026-10-01 S-10 mantenía el orden de hoy (`repo.ts:151`, `created_time` descendente) a la espera de
    E-093; ese texto queda superado.

## Nadie con cargo (S-1 de F1C-05) y cambio visible

Con el predicado estricto, sólo el administrador fija prioridad, mantiene la lista y ajusta hasta que se asigne
`cargo_permiso`. Sin lista, nadie es Top 5 y la prioridad al nacer es la de hoy. **Cambio visible desde el
despliegue:** los técnicos dejan de poder cambiar la prioridad en `Escalado a Revisión` y `Devolución a corrección`
(sólo el admin). Va en el paquete de despliegue.

**Segundo cambio visible, encontrado por el diseño (`design.md` §6) y nota de despliegue:** un ticket que nace sin
prioridad y cuyo cliente no es Top 5 ni tiene contrato **se queda sin prioridad al escalar**: hasta hoy el técnico la
fijaba en ese paso (`priority()` obligatorio, `transitions.ts:83-84`) y desde el despliegue ya no puede. En «Modo de
prioridad» del tablero esos tickets caen al grupo «Otra prioridad» (`apps/desk/src/board.ts:35` la declara y `:45`
reparte a ella todo lo que no es `High`, `Urgent`, `Medium` ni `Low`; el diseño citaba `board.ts:41`, que es la lectura
`const p = t.priority`). Es consecuencia de S-2 **mientras la pregunta 3.b.3 siga pendiente**
(`Preguntas_Gerencia_2026-09-29.md:87`, quién ajusta a mano fuera de los Top 5) y no se corrige aquí: con esa respuesta
habría alguien con permiso para fijar la prioridad de esos tickets, y calificar a los clientes sin contrato ni Top 5 es
el resto de la 3.b. Va en el paquete de despliegue como cambio visible, junto al anterior. Y desde que «Mis tickets» se
ordena (alcance 7), esos tickets van **al final** de la lista de su técnico.

**Tercer cambio visible (alcance 8, E-099):** el tablero deja de listar los tickets del más nuevo al más viejo; dentro
de cada columna aparecen por prioridad y, en la misma prioridad, por quién habilitó Comercial antes.

## Pruebas que hoy fijan la prioridad obligatoria y se revisan

`apps/desk/server/tickets.test.ts:52`, `apps/desk/server/transitionExec.test.ts:136`, y los fixtures `VALORES_ESCALADO`
(`apps/desk/server/contratoErrores.test.ts:68`, `apps/desk/server/services/ticketService.test.ts:74`) y
`apps/desk/server/services/valoresDeTransicion.test.ts:157`: siguen mandando `priority`; con S-2 pueden pasar a 403 según
el usuario del fixture. Se decide caso a caso en `tasks`.

## Tareas de persona (regla del ciclo 1, fuera del recuento)

Archivar no las da por hechas.
- **P.1 · Director Comercial**: marcar la lista Top 5 y sus prioridades tras desplegar. Depende de P.1 de F1C-05
  (asignar `cargo_permiso`). Dato de producción. Destino: paquete de despliegue.
- **P.2 · Verificación en la app** tras desplegar. Destino: parte de la tanda.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| S-1 se lee como incumplir «todos la heredan» | Media | Supuesto visible, ajuste por ticket, punto abierto a Gerencia |
| Técnicos pierden el control de prioridad al desplegar | Alta | Anotado como cambio visible; admin cubre |
| Desplazar citas de `ticketService.ts`, `transitions.ts`, `contratos.ts` | Media | Edición en sitio; barrido de la regla 4 al cerrar |
| El ajuste congela un ticket de Zoho (S-6) | Media | Mismo efecto que la primera transición; documentado |
| Fixtures con `priority` cambian a 403 | Media | Revisión caso a caso en `tasks` |

## Previsión de tamaño

Medida: `git diff --shortstat --no-renames` + nuevo sin trackear. La exploración estima ~700-950 de código y pruebas.
**Re-estimado el 2026-10-01** con la corrección de «Mis tickets»; manda la tabla de `tasks.md` («Review Workload
Forecast»), que ya había subido el lote 1 a ~600 al meter en él las dos tablas.

| Lote | Contenido | Estimación (incl. apply-progress ~60) |
|---|---|---|
| 1 · Modelo y alta | `shared` (la más alta, lista blanca), las dos tablas, `db`, rutas del cliente, `ticketService.ts:106`, cuatro combinaciones | ~600 (sin cambio) |
| 2 · Ajuste, guarda y «Mis tickets» | ruta de ajuste, `transitions.ts:84`, guarda con prueba de posición, fixtures; orden por urgencia y `GET /api/mis-tickets` | ~570 (era ~410; +~160) |
| 3 · UI y cierre | panel Top 5, ajuste en ficha, `TransitionPanel`, «Mis tickets» consume el servidor, regla 13 por escrito, barrido regla 4 | ~400 (era ~380) |

Verify (informe ~300-360) y archive (dos veces la carpeta por el `git mv`, más fusión del delta y `archive-report`) son
intentos aparte; el archive supera 800.

## Rollback

Revertir los commits del lote. Las dos tablas son aditivas y sólo las lee este código; devolver `required: true` a
`priority()` y quitar la guarda restaura el comportamiento de las transiciones.

## Criterios de éxito

- [ ] Las cuatro combinaciones contrato × Top 5 dan la prioridad esperada al nacer; sin ninguno, la de hoy.
- [ ] Fijar Top 5 o ajustar: sin permiso → 403; valor fuera de lista → 422; ajuste sin motivo → 422; con cargo o admin → 200 y traza.
- [ ] El ajuste no escribe en `ticket_transitions` y no reinicia el SLA.
- [ ] Técnico que cambia la prioridad en las dos transiciones → 403; sin `priority` → la transición pasa.
- [ ] Mover la guarda delante del 403 de área o detrás del 422 pone la suite en rojo.
- [ ] `GET /api/mis-tickets` devuelve los tickets abiertos derivados al usuario en orden `Urgent > High > Medium > Low >
  sin prioridad`, y dentro de una prioridad por la fecha y hora de «Habilitar Servicio» (S-10); anular el orden pone la suite en rojo.

## Cierre esperado

- Línea del `archive-report`: «Cubre de F1B-07 la prioridad del cliente Top 5 (lista, prioridad y ajuste con motivo
  por el Director Comercial), "manda la más alta" con el contrato al nacer, el bloqueo de la prioridad para el
  técnico y el orden de "Mis tickets" de más a menos urgente en el servidor; deja fuera la calificación automática de
  los clientes sin contrato ni Top 5 y quién ajusta fuera de los Top 5 (3.b), el desempate por fecha promesa (E-093)
  y la propagación a los tickets abiertos existentes.»
- `toca_maestro: si`: el maestro da el encaje del Top 5 por pendiente (`R08.2.md:5022-5023`); M1.9.1 (`:1692`) no
  conoce el Top 5 como dato del cliente y atribuye el ajuste manual a superadministrador o Director Técnico
  (`:1709`), cosa que la tanda no construye porque es la pregunta 3.b.3; el orden de «Mis Tickets» (`:1711`) queda
  construido salvo el desempate por fecha promesa, que el maestro no define (E-093); el Anexo D nº 53 (`:4198-4199`) queda cerrado por
  `anexo-53-contratos` (`config.yaml:2459`). Texto para el expediente R08.3, sin tocar el `.docx`.
- Barrido de citas de la regla de mutación 4 sobre los ficheros muy citados que se toquen.
