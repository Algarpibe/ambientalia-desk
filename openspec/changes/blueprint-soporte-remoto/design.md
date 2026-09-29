# Diseño: blueprint de soporte remoto y campo «Modalidad» (F1B-06, cambio 2 de 2)

Base `66ab783` más los ficheros de planificación sin trackear de este cambio. Entradas: `proposal.md`,
`exploration.md` y los tres deltas de `specs/`. Toda cita a código es contra ese árbol. Lo que no lleva
ruta y línea lleva «hipótesis». Molde: `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/design.md`.

## 1 · Enfoque técnico

El del cambio 1, sin piezas nuevas de arquitectura: **tercer catálogo + tercera entrada del registro de
flujos**, más dos cosas propias de esta rama — el **estado de nacimiento** deja de ser fijo y aparece la
columna **`modalidad`**. Toda decisión de dominio vive en `packages/shared` (`flujos.ts`); el servidor la
impone (`repo.ts`, `ticketService.ts`) y el cliente sólo la consume (regla 13, puntos 1 y 3).

Principio de inserción (regla de mutación 4): **todo lo nuevo va al final del fichero o en una línea
existente**. Objetivo medido en §8: **0 líneas desplazadas** en todos los ficheros de producción tocados.

## 2 · Decisiones

### D1 · Catálogo `TRANSITIONS_SOPORTE_REMOTO` al final de `transitions.ts`

| Opción | Coste | Decisión |
|---|---|---|
| Fundir en `TRANSITIONS` | `En Proceso`, `Pendiente` y `Finalizado` son homónimos de servicio: mezclaría grafos en `transitionsForStatus` y `areasSiguientes` | Rechazada (RQ-SR-01) |
| Tras `TRANSITIONS_EQUIPO_NUEVO` (`:363`) | Desplaza `cfOvAdicional` (`:365-376`) | Rechazada |
| **Tras `:376`** | 0 desplazadas; reutiliza `comment()` (`:73-74`) y `derivacion()` (`:97-98`), ya evaluadas | **Elegida** |

| id | name | from → to | área | fields |
|---|---|---|---|---|
| `asignacion_soporte` | Asignación | Solicitud Soporte → En Proceso | Servicio Técnico (S-1) | `comment(), derivacion()` |
| `ejecutar_soporte` | Ejecutar | En Proceso → Finalizado | ídem | ídem |
| `soporte_pendiente` | Soporte pendiente | En Proceso → Pendiente | ídem | ídem |
| `continuacion_soporte` | Continuación soporte | Pendiente → En Proceso | ídem | ídem |

- Ids verificados libres en `packages/` (búsqueda de `id: '(asignacion|ejecutar|soporte_pendiente|continuacion_soporte)…'`: 0). Ninguno reutiliza `marcar_pendiente` (`:206`).
- S-1 sigue siendo supuesto: la hoja `DF-soporte-remoto-030226.xlsx` trae `ÁREA_RESPONSABLE` vacía (verificado por el orquestador). Un dato por fila.
- El comentario de `:366` («Va al FINAL del fichero») deja de ser literal: se reescribe **en su sitio**, mismo número de líneas, a «va detrás de `TRANSICIONES_BASE`» (caso A).

### D2 · Registro de flujos (`flujos.ts`, 106 líneas, 13 citas)

Las 13 citas vivas de `flujos.ts:` apuntan sólo a `:40`, `:46`, `:56` y `:74`. Todo en línea o al final:

| Punto | Cambio |
|---|---|
| `:7` | importa además `TRANSITIONS_SOPORTE_REMOTO` |
| `:9`, `:10` | comentario «Los dos flujos» → «Los flujos»; `Flujo = 'servicio' \| 'equipo-nuevo' \| 'soporte-remoto'` |
| `:21` | segunda propiedad en la misma línea: `'soporte-remoto': TRANSITIONS_SOPORTE_REMOTO,` (`Record<Flujo, …>` obliga en `tsc`) |
| `:57` | antepone en la misma línea `if (esClasificacionSoporteRemoto(ticket.classification) && ESTADOS_DEL_CATALOGO_SOPORTE_REMOTO.has(ticket.status)) return 'soporte-remoto';` |
| `:91` | `return NOMBRE_FLUJO[flujo]`, con `NOMBRE_FLUJO: Record<Flujo, string>` al final: un cuarto flujo sin nombre rompe `tsc` |
| Tras `:106` | `CLASIFICACION_SOPORTE_REMOTO: (typeof CLASIFICACIONES)[number] = 'Soporte remoto'` (enlace a `ticketCreate.ts:5`), `esClasificacionSoporteRemoto` (misma `normalizar`, `:32-34`), `ESTADOS_DEL_CATALOGO_SOPORTE_REMOTO`, `NOMBRE_FLUJO`, `estadoInicialDelAlta` (D4), `MODALIDADES`/`Modalidad`/`modalidadDelAlta` (D5) |

- Las constantes nuevas se declaran después de `flujoDelTicket` pero sólo se **leen al llamarla**, nunca al
  cargar el módulo, así que no hay zona muerta. *Hipótesis* a confirmar en el rojo: ningún módulo de
  `shared` llama a `flujoDelTicket` en su evaluación inicial.
- S-6: heredados SR en `En Proceso`/`Pendiente`/`Finalizado`/`Solicitud Soporte` pasan a su flujo; en
  cualquier otro estado siguen en `servicio` (misma regla que `:56-61` para equipo nuevo).

### D3 · `Solicitud Soporte` en `estados.ts` (190 líneas, 256 citas)

| Línea | Cambio (en línea) |
|---|---|
| `:101` | «sin clasificar (2)» → «(3)» |
| `:105` | `'Solicitud Soporte': 'sin_clasificar',` **antes** del `//` final (tras él quedaría comentado); el comentario nombra los dos estados |
| `:111` | «Los 22 estados» → «Los 23 estados» (caso A) |
| `:182` | segunda sentencia: `export const ESTADOS_SOLO_SOPORTE_REMOTO = ['Solicitud Soporte'] as const satisfies readonly Estado[]` |
| `:184`, `:185` | `EstadoServicio` excluye también `(typeof ESTADOS_SOLO_SOPORTE_REMOTO)[number]` |
| `:189` | el filtro excluye las dos listas |

- Va en `:182` y no al final porque `:188` evalúa `ESTADOS_SERVICIO` al cargar: declarada después, daría
  `ReferenceError`.
- `ESTADOS` pasa a 23; `ESTADOS_SERVICIO` sigue en 21 y **en el mismo orden** (el estado nuevo es el
  último): alias `e01…e21` y artefactos del mapa idénticos, sin regenerar.
- `fasesBlueprint.ts:68` (`satisfies Record<EstadoServicio, FaseId>`) sigue compilando por la exclusión.
- `comprobaciones.ts:151-162` (reconciliación) cuenta sólo líneas `externa`/`interna`: `:105` no le afecta.
- Pruebas que cambian **a propósito**: `estados.test.ts:15-17` (22→23), `:66-69` (título y lista
  `['Pendiente', 'Verificación', 'Solicitud Soporte']`, la aserción nueva en la misma línea `:69`), `:72`
  («5 + 6 + 9 + 3 = 23»); `invariantesGrafo.test.ts:163` («(23)»), `:172-174` (44 = 34 + 6 + 4);
  `flujos.test.ts:42-45` invertida.

### D4 · Nacimiento: la decide `shared`, la impone `createTicket`

| Opción | Problema | Decisión |
|---|---|---|
| Parámetro `estadoInicial` en `CreateTicketInput` | Cualquier llamador podría nacer un ticket en un estado arbitrario | Rechazada |
| Decidirlo en `ticketService.ts` | Segunda implementación si mañana hay otro llamador | Rechazada |
| **`estadoInicialDelAlta(clasificacion)` en `flujos.ts`, llamada dentro de `createTicket`** | Un solo escritor (`repo.ts:412`), un solo lugar de decisión | **Elegida** |

- `repo.ts:2` importa `estadoInicialDelAlta` (en línea). `:418` gana segunda sentencia
  `const estadoInicial = estadoInicialDelAlta(input.classification)`. `:422` y `:435` sustituyen
  `STATUS_TICKET_CREADO` por `estadoInicial`. Fila #1: `enviar`/`Comercial` sin cambio (S-7).
- Único camino al escritor: `createManagedTicket` → `crearTicketConEquipo` (`equipoNuevo.ts:80-99`) →
  `createTicket` (`equipoNuevo.ts:90`). Verificado: no hay otro llamador fuera de `repo.test.ts`.
- `estadoInicialDelAlta` usa `esClasificacionSoporteRemoto` (normalizada), el **mismo** predicado que
  `flujoDelTicket`: nacimiento y enrutado no pueden divergir (molde H5).
- Comentarios que afirman «nace en Ticket creado», reescritos en su sitio: `repo.ts:405-411`,
  `ticketService.ts:20`.

**Lectores que suponen «todo ticket nuevo nace en `Ticket creado`»:**

| Lector | Efecto sobre un SR en `Solicitud Soporte` | ¿Cambia? |
|---|---|---|
| `columns.ts:15` y `:45-46` | Cae en `otros` (`FALLBACK_COLUMN_ID`, `:38`). S-10 **verificado** | No (F1B-09) |
| `puedeCrearRemisionDeEntrada` (`transitions.ts:163-165`) | `false`: sin botón «Crear remisión». Coherente con «no exige remisión» | No |
| `estadoPorRemision.ts:41` | Sale sin tocar el ticket: `Solicitud Soporte` no está en los `from` | No |
| `habilitar_servicio` (`transitions.ts:178`) | No aplica: el SR nunca pasa por `Ticket creado` | No |
| `historial.ts:36`, `equipos.ts:286` | Titulan «Ticket creado» el EVENTO de creación, no el estado | No (caso A: sigue cierto) |
| `repo.test.ts:201`, `:211`; `tickets.test.ts:313`, `:366`; `ticketService.test.ts:295-299` | Todas dan de alta clasificaciones de servicio | No |

### D5 · `modalidad`: columna, validación y precedencia

**Columna.** Tras `schema.sql:573`, con comentario de dos líneas:
`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text;` — sin calificar, correcto por estar
`tickets` en `DESK_TABLES` (guardián `migrate.test.ts:345-351`). **Sin `CHECK`**, contra lo que pedía el
encargo: precedentes `schema.sql:358` (pg-mem trata los `CHECK` de forma desigual) y `:389` (la lista blanca
vive en `shared` y la valida el servidor); además un `ADD CONSTRAINT` no es idempotente y `migrate()` corre
en cada arranque. Fuera de `TICKET_COLS` (`repo.ts:44-54`). Mapeo en línea: `rows.ts:50`
(`modalidad?: string | null`), `mappers.ts:246` (`modalidad: row.modalidad ?? null`), `types.ts:131`
(`TicketDetail.modalidad?: string | null`). `SELECT t.*` (`repo.ts:196`) ya la trae.

**Escritura.** `CreateTicketInput` gana `modalidad?: string | null` en la misma línea `:401`; `:420`-`:422`
añaden columna, `$19` y `input.modalidad ?? null`; `:434` añade
`...(input.modalidad ? { modalidad: input.modalidad } : {})` al payload (RQ-TC-06).

**Validación** (`modalidadDelAlta(clasificacion, valor)` en `flujos.ts`; `exigirModalidad` al final de
`ticketService.ts`, tras `:234`, como `exigirMismoFlujo`):

| Clasificación | `modalidad` en el cuerpo | Resultado |
|---|---|---|
| SR | ausente (`=== undefined`) | `'remoto'` (RQ-SR-08) |
| SR | `'remoto'` / `'en sitio'` exactos | ese valor |
| SR | cualquier otro, incluidos `''`, `null`, `'Remoto'` | `422` nombrando `modalidad` |
| otra | ausente | `null` |
| otra | cualquier valor | `422` (RQ-SR-09) |

**Posición:** segunda sentencia de `ticketService.ts:91`, tras `validarCamposEquipoNuevo` y antes de la
cuarentena/vencido de `:96` (C) y del `409` de `:97-100` (D). Orden resultante del escalón C: equipo↔cliente
(`:61-79`) < obligatorios (`:83-88`) < cliente (`:89-90`) < opcionales de equipo nuevo (`:91`) <
**modalidad** (`:91`) < cuarentena/vencido (`:96`). Va tras los obligatorios porque necesita
`clasificaciones` (`:86`). `:107` pasa `modalidad` a `crearTicketConEquipo` en la misma línea.

**Cliente** (`CreateTicket.tsx`, fuera de la red, F0-00): estado en `:45`, selector tras `:422` y payload
en `:230`, todo en línea; se muestra si `esClasificacionSoporteRemoto(clasificaciones)` y omite la clave en
otro caso. Lectura en `TicketProperties.tsx:141-144`, junto a la clasificación.

### D6 · Consumidores genéricos: heredan sin código

| Consumidor | Verificado | Cambio |
|---|---|---|
| Guarda 3 (`ticketService.ts:125`, `:231-234`) | `fueraDeFlujo` itera `CATALOGO_POR_FLUJO` (`flujos.ts:83-88`) | Ninguno |
| Avisos (`ticketService.ts:196`) | `catalogoDelTicket` en el estado de llegada | Ninguno |
| Panel (`TransitionPanel.tsx:56`) | `transicionesDelTicket` | Ninguno |
| SLA (`db/sla.ts:49`) | Sólo `Notificado` tiene SLA (`packages/shared/src/sla.ts:32-35`), que no está en el catálogo SR; el filtro `!== 'servicio'` excluye además SR si mañana se añade otro estado | **No hace falta exclusión explícita** |
| Escalado (`sla.test.ts:202`) | Ya recorre `CATALOGO_POR_FLUJO` | Ninguno |

### D7 · Invariantes

- `invariantesGrafo.test.ts:161`: la unión suma `TRANSITIONS_SOPORTE_REMOTO`. `sinSalida` de la unión
  sigue `['Finalizado']` (`:177-180`): `Solicitud Soporte` y `Pendiente` tienen salida en el catálogo SR.
- **Estados de entrada.** No existe invariante de alcanzabilidad: el 1 deriva estados de `from`/`to`, y
  `Ticket creado`/`OV asignada` sólo figuran como `from` de `habilitar_servicio`. `Solicitud Soporte` entra
  igual, como `from` de `asignacion_soporte`. Se añade al final un invariante explícito: los estados sin
  transición de entrada en la unión son exactamente `Remisión creada` (la aplica n8n), `OV asignada` (Zoho),
  `Ticket creado` y `Solicitud Soporte` (*hipótesis*, se fija en el rojo), y para cada una de las tres
  `CLASIFICACIONES`, `estadoInicialDelAlta` está declarado y `transicionesDelTicket` desde él no es vacío.
- Al final: `ESTADOS_SOLO_SOPORTE_REMOTO` = derivados(SR) − derivados(servicio ∪ EN); pares de RQ-SR-01;
  salidas de `Solicitud Soporte` = `['asignacion_soporte']`; campos = `['comment', 'derivado_a']`.

## 3 · Flujo de datos

    alta {clasificaciones, modalidad?} ──→ createManagedTicket ──→ exigirModalidad (:91, C)
                                                  │
              crearTicketConEquipo ──→ createTicket ──→ estadoInicialDelAlta ──→ INSERT (:420-422) + fila #1 (:428-436)
    ticket {classification, status} ──→ flujoDelTicket ──→ CATALOGO_POR_FLUJO['soporte-remoto']
              └── guarda 3 · avisos · panel · SLA (sin cambios)

## 4 · Ficheros

| Fichero | Acción |
|---|---|
| `packages/shared/src/transitions.ts` | Catálogo tras `:376`; `:366` en su sitio |
| `packages/shared/src/estados.ts` | D3 |
| `packages/shared/src/flujos.ts` | D2, D4, D5 |
| `packages/zoho-sync/src/db/schema.sql` | `ALTER` tras `:573` |
| `packages/zoho-sync/src/db/repo.ts`, `rows.ts`, `mappers.ts`; `packages/shared/src/types.ts` | En línea (D4, D5) |
| `apps/desk/server/services/ticketService.ts` | `:6`, `:20`, `:91`, `:107` en línea; `exigirModalidad` al final |
| `apps/desk/src/components/CreateTicket.tsx`, `TicketProperties.tsx`, `apps/desk/src/api/client.ts` | En línea |
| `apps/desk/server/flujoSoporteRemoto.test.ts` | Crear (guarda 3, nacimiento, modalidad, posiciones) |
| Pruebas `shared` (`flujos`, `estados`, `invariantesGrafo`, `reentrancia`) y servidor (`migrate`, `repo`, `transicionesEjecucion`, `permisos`, `avisoArea`) | En línea lo deliberado; lo nuevo al final |

## 5 · Mutaciones (strict_tdd)

| # | Regla | Mutación | Debe ponerse rojo |
|---|---|---|---|
| M1 | 1 | Mover `exigirModalidad` antes de `validarCamposEquipoNuevo` | EN + opcional inválido + `modalidad` → espera el `422` de F1B-02 |
| M2 | 1 | Moverla tras la cuarentena (`:96`) | SR + `modalidad` inválida + OV en cuarentena → espera `422` de modalidad |
| M3 | 1 | Moverla tras el `409` (`:97-100`) | SR + `modalidad` inválida + OV en uso → `422`, no `409` |
| M4 | 1 | Guarda 3 tras `:126-128` | Servicio en `Rev./Diagnostico` + `asignacion_soporte` → mensaje de flujo |
| M5 | 2 | Escribir en `schema.sql` un `UPDATE tickets SET modalidad='remoto'` | Recuento de sentencias con `modalidad` = 1 (describe final de `migrate.test.ts`, molde `:432-444`) |
| M6 | 2 | `ALTER TABLE desk.tickets … modalidad` | `migrate.test.ts:374-385` (identidades calificadas) |
| M7 | 2 | En el catálogo, `from: ['Solicitud soporte']` (grafía de la hoja) | Invariantes 1 y 4 de la unión |
| M8 | 2 | Añadir `'modalidad'` a `TICKET_COLS` | Prueba final de `repo.test.ts` (ausencia + `upsertTicket` no la pisa) |
| M9 | — | Quitar `Solicitud Soporte` de `:182` | `tsc` en `fasesBlueprint.ts:68` e invariante 1 de servicio |
| M10 | — | `estadoInicialDelAlta` siempre `Ticket creado` | Nacimiento SR y estados de entrada |
| M11 | — | Quitar la condición de estado en `:57` | SR heredado en `Rev./Diagnostico` ve `[]` |

**Regla de mutación 3 — decisiones del cliente y su línea del servidor:**

| Decisión del cliente | Línea que la impone |
|---|---|
| Mostrar el selector sólo en SR / omitir la clave en otra clasificación | `exigirModalidad` (`ticketService.ts:91`): `422` si llega fuera de SR |
| Preseleccionar `remoto` | `modalidadDelAlta`: el servidor pone `remoto` si falta (comodidad) |
| Ofrecer sólo dos valores (de `MODALIDADES`) | `422` fuera del dominio |
| Enseñar la modalidad sólo en lectura | Ninguna ruta la escribe tras el alta; `buildTransitionPlan` ignora claves no declaradas (prueba RQ-SR-10) |
| No elegir el estado inicial | `createTicket` (`repo.ts:418`, `:422`) |
| Ofrecer sólo `Asignación` en `Solicitud Soporte` | Guarda 3 (`:125`) y estado (`:126-128`) |

Heredado, no nuevo: ocultar «Crear remisión» fuera de la fase inicial (`transitions.ts:163-165`) no tiene
contrapartida en `routes/remision.ts` (0 usos de `puedeCrearRemisionDeEntrada`). El SR lo hereda; es F1B-03.

## 6 · Matriz de amenazas

N/A — sin enrutado de red, shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables.

## 7 · Despliegue y reversión

- La `ALTER` la aplica `migrate()` al arrancar, como `schema.sql:524`. Aditiva y nullable.
- Reversión del código: la columna se queda; el código viejo la ignora (`SELECT t.*` sólo añade una clave).
  **Pero un SR ya nacido en `Solicitud Soporte` quedaría sin transiciones** con el código viejo (estado fuera
  del registro, `flujoDelTicket` → `servicio`). Antes de revertir hay que contarlos; moverlos es dato de
  producción y decisión de persona.

## 8 · Puntos de inserción (citas con ripgrep, incluye sin trackear; se remiden con `git grep` en tasks)

| Fichero | Líneas | Citas `fichero:N` | Inserción | Desplazadas |
|---|---|---|---|---|
| `transitions.ts` | 376 | 377 | tras `:376`; `:366` en su sitio | 0 |
| `estados.ts` | 190 | 256 | `:101`, `:105`, `:111`, `:182`, `:184-185`, `:189` | 0 |
| `flujos.ts` | 106 | 13 | `:7`, `:9-10`, `:21`, `:57`, `:91`; resto tras `:106` | 0 |
| `ticketService.ts` | 235 | 496 | `:6`, `:20`, `:91`, `:107`; función tras `:234` | 0 |
| `schema.sql` | 573 | 200 | tras `:573` | 0 |
| `zoho-sync/src/db/repo.ts` | 452 | 95 (`db/repo.ts:`) | `:2`, `:401`, `:405-411`, `:418`, `:420-422`, `:434-435` | 0 |
| `rows.ts` · `mappers.ts` · `types.ts` | 132 · 261 · 810 | 42 · 9 · 40 | `:50` · `:246` · `:131` | 0 |
| `migrate.test.ts` | 444 | 55 | `:374`, `:376`, `:378`; describe tras `:444` | 0 |
| `invariantesGrafo.test.ts` | 219 | ≈62 | `:3`, `:5`, `:154-158`, `:161`, `:163`, `:172-174`; final | 0 |
| `estados.test.ts` | — | ≈77 | `:15-17`, `:66-69`, `:72` | 0 |
| `flujos.test.ts` | 140 | 5 (de este cambio) | `:3-6`, `:42-45`, `:136-138`; final | 0 |
| `CreateTicket.tsx` | 455 | 31 | `:3`, `:45`, `:230`, `:422` | 0 (objetivo) |
| `TicketProperties.tsx`, `api/client.ts` | — | a medir | en línea | 0 (objetivo) |

Cierre (regla 4): releer las citas cuyo **contenido** cambia: `ticketService.ts:91`, `:107`, `:20`;
`repo.ts:405-411`, `:418-422`, `:434-435`; `estados.ts:101-111`, `:182-189`; `flujos.ts:56-61`, `:90-92`;
`transitions.ts:365-376`; `invariantesGrafo.test.ts:163`, `:172`. **Deriva previa hallada:**
`equipoNuevo.ts:65` cita `ticketService.ts:89` para `validarCamposEquipoNuevo`, que está en `:91`, y la
llama «la última guarda del escalón C», falso ya hoy por `:96`: se repara en el cierre (caso A).

## 9 · Desacuerdos y avisos

1. **Sin `CHECK`** en la columna, contra el encargo (D5). La propuesta no lo pedía.
2. Delta `tickets-core` RQ-TC-10 cita «obligatoriedad en `ticketService.ts:56`»: hoy es `:86`. Corregir en spec.
3. `estadoInicialDelAlta` normaliza (como `flujoDelTicket`); la spec dice `clasificaciones = 'Soporte remoto'`
   literal. Es superconjunto coherente: el alta no valida `clasificaciones` contra `CLASIFICACIONES` (`:86`).
