---
tanda: fuera-del-plan
motivo: "F1B-03 está cerrada por archivo (docs/sdd/RECONCILIACION.md:19) y reabrirla cambiaría el alcance de su fila. decision/ingreso-servicio-reescribe-codigo, consecuencia (4), nombra fuera-del-plan como la alternativa, y decision/excepcion-plazo-rq-kp-26, punto (3), es la orden de Gerencia del 27/10 de construirlo ahora."
capacidad: [tickets-core, transitions-st]
maestro: ["M1.1", "Anexo D nº 37"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `codigo-servicio-bloqueado`

Construye `decision/ingreso-servicio-reescribe-codigo` (Gerencia, 16/10/2026; `openspec/config.yaml` → `decisiones_de_gerencia_panel`).
Se cita por clave: hoy sólo vive en la copia de trabajo de `main`, sin commitear. La orden de hacerlo ahora es el punto (3) de la respuesta
textual de `decision/excepcion-plazo-rq-kp-26` (su consecuencia (4); `openspec/config.yaml` → `decisiones_de_gerencia_adenda`).
Exploración: Engram `sdd/codigo-servicio-bloqueado/explore`.

*Sobre la cabecera.* `fuera-del-plan`: F1B-03 figura entre las cerradas por archivo (`docs/sdd/RECONCILIACION.md:19`); S-1. `cierra: no`: no hay
fila que cerrar. `toca_maestro: si`: M1.1 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1143-1176`) describe el
código y sus prefijos pero no dice que quede bloqueado, ni quién lo cambia, ni qué se propone a un ticket de Zoho sin código; el Anexo D nº 37
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5771-5775`) tampoco. El §13 del expediente R08.4 (copia de trabajo de
`main`, sin commitear) ya pide que M1.1 y el nº 37 lo recojan: P-4.

## 1 · Intención

El código de servicio nombra la carpeta de Drive del equipo. Hoy sólo la pantalla impide cambiarlo, y un ticket de Zoho sin código lo recibe
tecleado a mano. Al terminar: el **servidor** rechaza un código distinto en un ticket que ya lo tiene, salvo a un administrador, y deja traza;
y a un ticket sin código la pantalla le propone el deducido como en el alta, que Servicio Técnico confirma o corrige una vez.

## 2 · Lo que hay hoy (medido)

- El campo es `cfText('Código Servicio')` en **dos** transiciones desde `Ingresado`: `ingreso_a_servicio`
  (`packages/shared/src/transitions.ts:190-191`) y `calibracion_directa` (`packages/shared/src/transitions.ts:262`). La decisión nombra sólo la
  primera; el bloqueo cubre las dos. Es obligatorio por defecto (`packages/shared/src/transitions.ts:77-78`, impuesto en
  `apps/desk/server/transitionExec.ts:77`), así que ningún ticket de servicio sale de `Ingresado` por la app sin código.
- Se pasa por el estado una sola vez: al catálogo de servicio sólo se llega a `Ingresado` desde `habilitar_servicio`
  (`packages/shared/src/transitions.ts:178`), cuyos orígenes son los tres estados previos; los dos pasos del servidor entre ellos
  (`packages/shared/src/transitions.ts:150-151`) no salen de ahí. La vuelta de `analisis_y_acciones` es del flujo de equipo nuevo
  (`packages/shared/src/transitions.ts:355`), cuyas transiciones no llevan el campo (`packages/shared/src/transitions.ts:351`).
- Columna promovida (`apps/desk/server/transitionExec.ts:4`, `:90-91`); `writeTransition` la escribe sin leer la anterior
  (`packages/zoho-sync/src/db/repo.ts:301-302`), pone `managed_by_app=true` (`packages/zoho-sync/src/db/repo.ts:298`) y guarda lo tecleado en
  `ticket_transitions` (`packages/zoho-sync/src/db/repo.ts:317`), sin el valor previo.
- **El bloqueo es sólo del cliente**: `yaLoTraeElTicket` (`apps/desk/src/components/TransitionPanel.tsx:32-36`) prellena y bloquea todo texto que el
  ticket ya trae (`apps/desk/src/components/TransitionPanel.tsx:80`, `:174`). En el servidor no hay comparación: regla 13, punto 2, el cliente **es** la guarda.
- Guardas de `executeTransition`: A (`apps/desk/server/services/ticketService.ts:123`, `:125`), estado `409` (`:126-128`), B (`:129-131`), C (`:132-147`),
  D (`apps/desk/server/services/ticketService.ts:148-152`). El molde es `cambiaPrioridadSinPermiso` (`packages/shared/src/prioridad.ts:81-86`), `403` en `apps/desk/server/services/ticketService.ts:131`.
- Formato: `buildCodigoServicio` (`packages/shared/src/ticketCreate.ts:12-14`) omite las partes vacías sin error; prefijo `prefijoDeducido`
  (`packages/shared/src/ticketCreate.ts:47-49`, `decision/prefijo-de-que-se-deduce`).
- Otros escritores: el sync, con `codigo_servicio` en `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:47`), que salta las filas con
  `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:71`); `mappers.ts` sólo si viene vacío (`packages/zoho-sync/src/db/mappers.ts:65`);
  `backfillSerial` sólo filas no gestionadas y con código vacío (`apps/desk/server/backfillSerial.ts:7`, `:14`). No hay `PATCH` de tickets (exploración).

## 3 · Alcance y enfoque

**Dentro.**
1. `packages/shared`: un predicado puro «cambia el código sin permiso» (con código previo no vacío, uno nuevo distinto tras recortar, y sin `isAdmin`)
   y la función de la propuesta (S-3), consumidos por servidor y cliente (regla 13, punto 1).
2. Servidor: guarda `403`, escalón B, en **toda** transición que lleve `Código Servicio` (S-7); traza del cambio del administrador (S-5).
3. Cliente (`TransitionPanel.tsx`): prellenar la propuesta si el ticket no tiene código; desbloquear el campo al administrador. Cambia el bundle.
4. Specs: ADDED al **final** de `tickets-core` y de `transitions-st`; ningún bloque MODIFIED.

**Fuera:** esquema y migración (S-2); el sync de filas no gestionadas (S-6); una ruta de edición fuera de `Ingresado` (P-2, P-3); cómo se guarda el
valor —sin recortar, `apps/desk/server/transitionExec.ts:34`—; `openspec/config.yaml` y `docs/sdd/ENTRADA.md` en la rama.
**Qué cubre, en una línea:** las consecuencias (1) y (2) de la decisión; la (3c) queda como P-2.

## 4 · Capacidades

**Nuevas:** ninguna (la rama no puede declarar capacidades). **Modificadas:** `tickets-core` — la propuesta y la regla «una vez, y luego bloqueado»;
`transitions-st` — la guarda, su posición y su traza (moldes RQ-TS-21 y RQ-TS-22, `openspec/specs/transitions-st/spec.md:885`, `:967`).

## 5 · Supuestos reversibles

`execution_mode: auto` (`openspec/config.yaml:25-30`): sin ronda de preguntas. Ninguno cambia una fila, cuesta dinero, toca producción ni contradice
una decisión; van a la lista semanal (`decision/preguntas-de-detalle-sin-llegar`).

| # | Supuesto | Por qué | Cómo se revierte |
|---|---|---|---|
| S-1 | `fuera-del-plan` | Literal del encargo; F1B-03 cerrada | Gerencia pide que cuente en F1B-03 (P-1): se cambia la cabecera |
| S-2 | «Una sola vez» = el primer envío que fija código a un ticket sin él. La memoria es el propio código no vacío: sin columna ni migración (sin nota en `DEPLOY.md`) | `Ingresado` se cruza una vez y el campo es obligatorio (§2) | Si la propuesta debe guardarse antes de la transición, marca por fila (molde `prioridad_en_app_at`, `packages/zoho-sync/src/db/repo.ts:78`) |
| S-3 | Propuesta = `buildCodigoServicio` con `prefijoDeducido(clasificación, tipo de servicio)`, serie y modelo del ticket y el día civil de Bogotá de `created_time`; lo que falte se omite como en el alta | *Hipótesis:* la carpeta de Drive nació con el ticket, no hoy; el alta usa la fecha del momento porque crea el ticket | Usar «hoy» o `Fecha creación ticket` |
| S-4 | «Ya lo tiene» = valor recortado no vacío; reenviar el mismo valor recortado no es cambio | El cliente reenvía lo prellenado (`apps/desk/src/components/TransitionPanel.tsx:80`) | Comparación literal |
| S-5 | El administrador cambia el código por las mismas dos transiciones; la traza es la fila de `ticket_transitions` (quién, cuándo, valor nuevo) más el valor previo en sus `values`. Sin tabla | Es la traza que ya existe (`packages/zoho-sync/src/db/repo.ts:317`) | Tabla propia (molde `public.prioridad_ajustes`) y ruta propia (P-3) |
| S-6 | El sync sobre filas con `managed_by_app=false` queda fuera: hasta la primera transición manda Zoho; después la protege `managed_by_app` | Molde de la opción (c) de `decision/e005-iv4-iv11` | Excluir `codigo_servicio` del upsert cuando no está vacío |
| S-7 | La guarda es escalón B (permiso del sujeto), `403`, en cualquier transición con el campo; el diseño fija el sitio sin desplazar líneas citadas | Mismo molde que la prioridad | Otro escalón, con sus pruebas de posición |
| S-8 | Sin interruptor | Restringe, no enciende un escritor | Interruptor que nazca cerrado |

## 6 · Disciplina que se verifica

- **`strict_tdd`.** Rojo previo: un no administrador manda un código distinto a un ticket que ya lo tiene, y hoy responde `200`.
- **Mutación 1 (posición), con M0 verde primero:** frente al `403` de área (`apps/desk/server/services/ticketService.ts:129-130`), frente al `422` de C
  (obligatorio ausente) y frente a la condición de `calibracion_directa` (`apps/desk/server/services/ticketService.ts:128`). Frente a `cambiaPrioridadSinPermiso` **no es observable**: ninguna
  transición lleva a la vez prioridad y código; se dice en el diseño, no se finge una prueba.
- **Mutación 2:** no aplica; ninguna guarda lee un fichero de datos.
- **Mutación 3 (regla 13), casilla por casilla:** bloquear → la guarda nueva; desbloquear al administrador → la salida `isAdmin` de esa guarda;
  prellenar → comodidad que no bloquea nada (Servicio Técnico puede corregirla), sin contrapartida; obligatorio → `apps/desk/server/transitionExec.ts:77`.
  Los `.tsx` siguen fuera de la red de pruebas (F0-00).
- **Mutación 4:** ediciones en la misma línea y código nuevo al final de fichero; barrido de citas de todo fichero cuyas líneas se muevan.
- **Cinco códigos por intento, todos 0:** `npm test` (log en el scratchpad; si sale 1 sólo por «Timeout calling onTaskUpdate» con todo verde, se repite y
  se guarda la pasada fallida), `npm run typecheck`, `npm run lint -- --max-warnings 165`, commit, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`.

## 7 · Estimación por intento

Medida: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear. Techo 800; se parte por encima de 720.

| Intento | Contenido | Estimado |
|---|---|---|
| i1 · planificación | propuesta (~150), dos deltas (~140), diseño (~170), tareas (~90) | ~550 |
| i2 · apply | shared + pruebas (~120), servidor + pruebas (~250), cliente (~15), `apply-progress.md` (~120) | ~505 |
| i3 · verify | `verify-report.md` (~360) y casillas | ~380 |
| i4 · archive | techo 2 × carpeta (~1.050) + 800; lo revisable —fusión (~140) + `archive-report.md` (~150)— ≤ 800, medido antes | ~2.400 |

Ciclo completo hasta archivar; **se para antes de fusionar** (fusiona el analista).

## 8 · Riesgos y marcha atrás

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Gerencia esperaba corrección del administrador en cualquier estado | Media | P-3 |
| Un ticket de Zoho cambia de código por el sync antes de tocarlo la app | Baja | S-6; reversible |
| Una edición desplaza citas de `ticketService.ts` | Media | Edición en la línea; barrido (mutación 4) |
| `npm test` intermitente por carga | Media | Log entero; repetición documentada |

**Marcha atrás:** revertir la fusión. Sin datos, esquema ni interruptor que deshacer; el cliente vuelve con el despliegue anterior.

## 9 · Tareas de persona — fuera del recuento

No son tareas del `tasks.md` (regla del ciclo 1). **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Si cuenta en F1B-03 (S-1) | Supervisión / Gerencia | Cabecera y barrido | Aquí y en el `archive-report.md` |
| P-2 | Los tickets sin código que ya pasaron de `Ingresado` (los de la migración F1F-01 del 12/12, consecuencia (3c)) no tienen vía para fijarlo | Gerencia | Panel, apartado 06 | Aquí y en el `archive-report.md` |
| P-3 | Si el administrador debe poder corregir el código fuera de `Ingresado` (hoy, S-5, sólo por las dos transiciones) | Gerencia | Panel, apartado 06 | Aquí y en el `archive-report.md` |
| P-4 | M1.1 y Anexo D nº 37 recogen el bloqueo y la propuesta | Gerencia | Próxima revisión del maestro (§13 del expediente) | Aquí y en el `archive-report.md` |
| P-5 | Desplegar cliente y servidor tras la fusión | Despliegue | Producción | Paquete de despliegue |

## 10 · Criterios de éxito

- [ ] Un no administrador recibe `403` al mandar un código distinto a un ticket que lo tiene, en las dos transiciones; nada se escribe.
- [ ] El administrador lo cambia con `200`, y la fila de `ticket_transitions` guarda el valor previo y el nuevo.
- [ ] Un ticket sin código acepta el primero; reenviar el mismo valor recortado pasa.
- [ ] La pantalla propone el código deducido a un ticket sin código y desbloquea el campo al administrador.
- [ ] M0 verde; pruebas de posición rojas al mover la guarda; barrido de citas registrado; cinco códigos en 0 por intento; bundle nuevo anotado.
