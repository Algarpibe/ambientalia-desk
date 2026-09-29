# Informe de verificación — `blueprint-soporte-remoto` (F1B-06, cambio 2 de 2, `cierra: si`)

| Dato | Valor |
|---|---|
| Fecha | 2026-09-29 |
| Árbol verificado | `main` @ `30b2019` (lotes `8fb8efd`, `93e8b15`, `30b2019`), base de planificación `66ab783` |
| Preflight | `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd` (`openspec/config.yaml:22-30`) |
| Modo | Strict TDD (`strict-tdd-verify.md`); runner `npm test` (vitest run) |
| Artefactos leídos | `CLAUDE.md`, `proposal.md`, `design.md`, `tasks.md`, `apply-progress.md`, las tres delta specs |

## Veredicto global: **PASS WITH WARNINGS**

**0 CRITICAL · 2 WARNING · 5 SUGGESTION.** Los 16 requisitos y los 56 escenarios se cumplen con prueba leída y ejecutada hoy; las cuatro
ejecuciones globales y el comando enfocado están en verde y las cifras coinciden con las del apply. Los dos WARNING son riesgos de
despliegue ya declarados por la propuesta (S-6 y S-1), no defectos del código. No se modificó ningún fichero de producción: `git status --short`
sólo lista los cinco `??` de `docs/sdd/` que ya estaban antes de empezar, y `git diff --quiet` sale limpio tras la mutación de muestra.

---

## 1 · Ejecución (hoy, sobre `30b2019`)

| Comando | Resultado | Esperado por el apply | ¿Coincide? |
|---|---|---|---|
| `npm test` | **158 ficheros (157 pasan + 1 omitido) · 1938 tests pasan · 2 omitidos**, 0 fallos, 154,95 s | 158 · 1938 (+2 omitidos) | Sí |
| `npm run typecheck` (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`) | limpio, 0 errores | limpio | Sí |
| `npx eslint . --max-warnings 165` | **165 avisos, 0 errores**, salida 0 | 165 avisos, 0 errores | Sí |
| `npm run build` | verde (`built in 6.19s`), salida 0 | verde | Sí |
| Enfocado (15 ficheros de los tres lotes) | **15/15 ficheros · 431 tests pasan**, 20,58 s | 111 (5 de `shared`) y 320 (10 del lote 2), sin solape | Sí |

*Nota del enfocado:* el apply cita 111 (lote 1, 5 ficheros) y 320 (lote 2, 10 ficheros); el comando del encargo reúne 15 ficheros
distintos y da 431 = 111 + 320: los dos conjuntos no comparten fichero (corrección del orquestador al contrastar).
*Detector de citas* (`npx tsx apps/desk/server/citas/cli.ts --sha HEAD`, el del hook de `pre-push`): salida **0**, 2.999 comprobadas,
**0 bloqueantes**, línea base 0/0, cabeceras R-1 inválidas 0; **11 abreviadas rotas informativas**, las mismas 11 que
`CLAUDE.md` registra tras `detector-citas-extremos`; **ninguna** cae en esta carpeta (revisada la salida completa: `DEPLOY.md`, `transitionExec.ts`,
`permissions.ts`, dos abreviadas de otras specs que apuntan fuera de rango en `transitions.ts`, etc.).

## 2 · Cumplimiento Strict TDD (Step 5a)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD registrada | OK | `apply-progress.md:6-11`, `:60-69`, `:118-122`: tabla «rojo capturado antes del verde» por bloque, en tres lotes |
| Toda tarea de código tiene prueba | OK | Lote 1: 5 ficheros de `shared` (`transitionsSoporteRemoto.test.ts` nuevo, 4 ampliados). Lote 2: `flujoSoporteRemoto.test.ts` nuevo, `repo.test.ts`, `migrate.test.ts`, `permisos`, `transicionesEjecucion`, `avisoArea`. Lote 3: sin código probable (ver abajo) |
| Rojo confirmado | OK | Lote 1: 5 rojos (A), 9 (B), 29 (C); lote 2: 2 (A), 4 (B), 11 (C). Los ficheros de prueba existen y hoy pasan |
| Verde confirmado | OK | 15/15 y 158/158 hoy, contra las mismas pruebas |
| Lo que nace verde se declara y se discrimina por mutación | OK | `apply-progress.md:13-14`, `:68` lo declaran; su discriminación sale de las 9 mutaciones del lote 1 (`:17-27`), las 13 del lote 2 (`:73-86`) y las cuatro del orquestador (`:51`) |
| Triangulación | OK | `it.each` de 7 + 7 filas en `flujos.test.ts:229,233,246`, `A3` con 4 valores (`flujoSoporteRemoto.test.ts:157`), `repo.test.ts:475` con 2 clasificaciones; control con la vecina activa en A7/A8/A9 |
| Red de seguridad | OK | Línea base medida antes de cada lote: 156·1848, 157·1895, 158·1938 (`apply-progress.md:3`, `:57`, `:122`) |

**Lote 3 sin rojo (declarado, `apply-progress.md:121`):** cambia `CreateTicket.tsx`, `TicketProperties.tsx` (`.tsx`, fuera de la red por F0-00), un tipo
(`types.ts:321`) y un comentario (`equipoNuevo.ts:65-66`). Se sustituye por la tabla de la regla 13 (§6) y por `typecheck` + `build`, que hoy pasan.

**Mutación de muestra reproducida por mí (regla de mutación 1):** moví la guarda de modalidad de `ticketService.ts:91` para que corra
DESPUÉS de la cuarentena y del vencido (`:96`) y antes del `409` (`:97-100`). Resultado: `flujoSoporteRemoto.test.ts`, **1 rojo de 26, exactamente A8**
(`:214`, «posición M2»); las otras 25 siguen verdes, incluida A7. Coincide con `apply-progress.md:79`. Revertido con `git checkout -- apps/desk/server/services/ticketService.ts`;
`git diff --quiet` = limpio. (Un primer intento sin `;` tras `rm.valor` no compilaba y se descartó: no cuenta.)

### Distribución por capa (Step 5)
| Capa | Tests | Ficheros | Herramienta |
|---|---|---|---|
| Unidad (pura, sin BD ni HTTP) | mayoría de los nuevos en `shared` | 5 | vitest |
| Integración (HTTP real con `supertest` + pg-mem) | resto de los nuevos | `flujoSoporteRemoto`, `permisos`, `transicionesEjecucion`, `repo`, `migrate`, `avisoArea` | vitest + supertest + pg-mem |
| E2E / interfaz | 0 | 0 | no instalado por decisión de Gerencia (F0-00): no se registra como carencia |

*Hipótesis:* el reparto exacto por capa no se midió test a test. No hay herramienta de cobertura configurada; no se ejecutó (no es un fallo).

### Auditoría de calidad de aserciones (Step 5f)
Leídos enteros `flujoSoporteRemoto.test.ts` (306 líneas), `packages/zoho-sync/src/db/repo.test.ts:445-520`, `migrate.test.ts` (diff), `permisos.test.ts:304-334`,
`transicionesEjecucion.test.ts` (diff), `avisoArea.test.ts` (diff), y por `it(` los cinco de `shared`.
- Tautologías: **0**. Aserciones sin llamar a código de producción: **0**.
- **Bucles fantasma: 0.** Los bucles de `P2` (`:43`), `P8` (`:105`), `permisos.test.ts:311` y `transicionesEjecucion.test.ts` recorren catálogos constantes y **cada uno
  fija el recuento** (`n` = 4 en `flujoSoporteRemoto.test.ts:49`, 44 en `:112`, 12 casos en `permisos.test.ts:329`, 4 en `transicionesEjecucion.test.ts`), así que un catálogo vacío no pasaría en verde.
- Vacíos sin pareja: los `toEqual([])` de `transitionsSoporteRemoto.test.ts:45,48` (entradas de `Solicitud Soporte`, salidas de `Finalizado`) van con compañeras no vacías en la misma prueba.
- Acoplamiento a implementación: los `toContain('modalidad')` y `toContain('soporte remoto')` dependen del texto del mensaje, pero el contrato del spec es «nombrando el campo / el flujo». Aceptable.

**Aserciones: 0 CRITICAL, 0 WARNING.**

## 3 · Matriz de requisitos

Veredicto: CUMPLE / PARCIAL / NO CUMPLE / SIN PRUEBA POSIBLE. Las líneas de prueba son `it(` leídos hoy; el código citado también.

| Requisito | Código que lo cumple (leído hoy) | Pruebas | Veredicto |
|---|---|---|---|
| RQ-SR-01 catálogo separado, 4 sobre 4 | `transitions.ts:388-397` (4 entradas, `comment()` + `derivacion()`, todas `Servicio Técnico`); registro `flujos.ts:19-22` | `transitionsSoporteRemoto.test.ts:11,20,25,34,41`; `invariantesGrafo.test.ts:240,249,254`; `reentrancia.test.ts:208,214` | CUMPLE |
| RQ-SR-02 área Servicio Técnico (S-1) | `transitions.ts:389,391,393,395` (`area: 'Servicio Técnico'`) | `flujoSoporteRemoto.test.ts:31,39`; `permisos.test.ts:306,328`; `transicionesEjecucion.test.ts:395` | CUMPLE (supuesto S-1, ver W2) |
| RQ-SR-03 `Solicitud Soporte` registrado, excluido de servicio | `estados.ts:105` (`sin_clasificar`), `:182` (`ESTADOS_SOLO_SOPORTE_REMOTO`), `:188-190` (`ESTADOS_SERVICIO` lo excluye) | `estados.test.ts:15,66,72,220,225,232`; `invariantesGrafo.test.ts:163,177,183,233`; `flujos.test.ts:204` | CUMPLE |
| RQ-SR-04 nace en `Solicitud Soporte` | `repo.ts:418` (`estadoInicialDelAlta`), `:422` (`$16` = estado), `:435` (`$5` = `to_status`); `flujos.ts:138-140`; `ticketService.ts:24` (sigue exigiendo equipo) | `flujoSoporteRemoto.test.ts:142,166,194`; `repo.test.ts:456,465,475`; `flujos.test.ts:210,215,222` | CUMPLE |
| RQ-SR-05 ve y ejecuta sólo las cuatro; guarda 3 | `flujos.ts:56-61` (enrutado por clasificación **y** estado), `:101-106` (`fueraDeFlujo`), `:127-131` (nombre «soporte remoto»); `ticketService.ts:125` (llamada, ANTES de `:126-128` estado), `:231-234` (función) | `flujoSoporteRemoto.test.ts:52,62,73,83,92,100`; `flujos.test.ts:165,171,176,182,186,192,198` | CUMPLE |
| RQ-SR-06 ids únicos entre catálogos (S-8) | ids `asignacion_soporte`, `ejecutar_soporte`, `soporte_pendiente`, `continuacion_soporte` (`transitions.ts:389-395`); `marcar_pendiente` intacto | `transitionsSoporteRemoto.test.ts:55,61`; `invariantesGrafo.test.ts:172` (44 = 34+6+4, `Set` de 44) | CUMPLE |
| RQ-SR-07 dominio y 422 de modalidad, escalón C | `flujos.ts:143` (`MODALIDADES`), `:155-159`; `ticketService.ts:91` (tras `:83-90` y `validarCamposEquipoNuevo`, antes de `:96` y `:97-100`) | `flujoSoporteRemoto.test.ts:142,157,204,214,225`; `flujos.test.ts:229,233,246` | CUMPLE (selector `.tsx`: ver §6) |
| RQ-SR-08 default `remoto` en el servidor | `flujos.ts:156` (`valor === undefined` da `remoto`) | `flujoSoporteRemoto.test.ts:150`; `flujos.test.ts:233` | CUMPLE |
| RQ-SR-09 otra clasificación: NULL y 422 si se envía | `flujos.ts:161-162` | `flujoSoporteRemoto.test.ts:166,180`; `flujos.test.ts:233,246` | CUMPLE |
| RQ-SR-10 sólo lectura tras el alta | ningún `fields` lleva `modalidad` (`transitions.ts:389-396`); `modalidad` fuera de `TICKET_COLS` (`repo.ts:44-54`) y de `plan.columns` | `transitionsSoporteRemoto.test.ts:25`; `flujoSoporteRemoto.test.ts:117,258,273,282,294` (P9 y R1-R4) | CUMPLE (ficha `.tsx`: ver §6) |
| RQ-SR-11 fuera de `TICKET_COLS` | `repo.ts:44-54` sin `modalidad`; `schema.sql:5` (`ALTER TABLE tickets`, sin calificar, sin relleno ni `CHECK`) | `repo.test.ts:506,513`; `migrate.test.ts` (recuento 40/21 y bloque final, S-9) | CUMPLE |
| RQ-EN-04 (delta) tres flujos | `flujos.ts:56-61` | `flujos.test.ts:34,38,42,47,165,171,176`; `flujoEquipoNuevo.test.ts:81` | CUMPLE |
| RQ-TC-05 (delta) guarda de modalidad, escalón C | `ticketService.ts:91`; orden de las siete guardas `:23-24,:26-27,:37-39,:61-79,:83-88,:89-90,:96-100` releído | `ticketService.test.ts:323,345,356,424,490,537,545,573`; `flujoSoporteRemoto.test.ts:157,180,204` | CUMPLE |
| RQ-TC-06 (delta) alta atómica, dos filas | `repo.ts:412-452`; fila `:419-423`; foto `:428-436`, con `modalidad` en `values` sólo si existe (`:434`) | `repo.test.ts:456,465,475,486`; `flujoSoporteRemoto.test.ts:142` | CUMPLE |
| RQ-TC-07 (delta) fase inicial, excepción SR | `repo.ts:418`; `flujos.ts:138-140` | `repo.test.ts:456,475`; `flujoSoporteRemoto.test.ts:142,166`; `invariantesGrafo.test.ts:272,278` | CUMPLE |
| RQ-TC-10 (delta) tres ramas con grafo | `flujos.ts:19-22,56-61` | `flujos.test.ts:34,42,182`; `flujoSoporteRemoto.test.ts:31,100` | CUMPLE |

**Requisitos: 16 CUMPLE · 0 PARCIAL · 0 NO CUMPLE.** Las facetas de interfaz (selector y ficha) son SIN PRUEBA POSIBLE por F0-00 y se cubren en §6.

## 4 · Matriz de escenarios

Recuento leído del texto: `transitions-soporte-remoto` **31** `#### Scenario`, `transitions-equipo-nuevo` **5**, `tickets-core` **19**, más el bloque
Given/When/Then heredado de RQ-TC-06 (`tickets-core/spec.md:157-160`) = **56**. Coincide con el encargo. Todas las pruebas de las tablas pasan hoy (431/431 en el enfocado y 1938/1938 en la suite).

### 4.1 · `transitions-soporte-remoto` (31)
| # | Escenario | Prueba (`fichero:línea`) | Veredicto |
|---|---|---|---|
| 1 | Las cuatro existen con sus pares exactos | `transitionsSoporteRemoto.test.ts:11`; `invariantesGrafo.test.ts:240` | CUMPLE |
| 2 | Sin campos de fecha ni motivo obligatorio | `transitionsSoporteRemoto.test.ts:25`; `reentrancia.test.ts:214`; `invariantesGrafo.test.ts:254` | CUMPLE |
| 3 | Sin salida de anulación (S-5, mutación) | `transitionsSoporteRemoto.test.ts:20`; `invariantesGrafo.test.ts:249`; mutación 1.12 (`apply-progress.md:20`) | CUMPLE |
| 4 | Las cuatro exigen Servicio Técnico | `flujoSoporteRemoto.test.ts:39` (P2); `permisos.test.ts:306` (matriz 4×3 = 12); mutación 2.22 | CUMPLE |
| 5 | Usuario de Servicio Técnico las ejecuta | `flujoSoporteRemoto.test.ts:31` (P1); `transicionesEjecucion.test.ts:395` | CUMPLE |
| 6 | Unión de los tres catálogos deriva `ESTADOS` | `invariantesGrafo.test.ts:163` | CUMPLE |
| 7 | `Solicitud Soporte` no es de servicio | `estados.test.ts:225`, `:232` | CUMPLE |
| 8 | `Finalizado` sigue siendo el único sin salida | `invariantesGrafo.test.ts:177` | CUMPLE |
| 9 | Quitar `Ejecutar` (mutación) | `transitionsSoporteRemoto.test.ts:41` (`entradas('Finalizado')`); mutación 1.13: 10 rojos y el `3 · sin salida` NO se pone rojo, como dice el escenario | CUMPLE |
| 10 | Clase de espera de `Solicitud Soporte` | `estados.test.ts:221` | CUMPLE |
| 11 | Alta de soporte remoto | `flujoSoporteRemoto.test.ts:142` (A1); `repo.test.ts:456` | CUMPLE |
| 12 | Las otras clasificaciones no cambian | `flujoSoporteRemoto.test.ts:166` (A4); `repo.test.ts:475` | CUMPLE |
| 13 | Sin equipo sigue rechazado | `flujoSoporteRemoto.test.ts:194` (A6: mensaje exacto y cero filas) | CUMPLE |
| 14 | Solicitud Soporte sólo ofrece Asignación | `flujos.test.ts:182`; `flujoSoporteRemoto.test.ts:100` (P8: de 44 transiciones sólo una da 200) | CUMPLE |
| 15 | Bucle Pendiente y En Proceso | `flujoSoporteRemoto.test.ts:52` (P3) | CUMPLE |
| 16 | Ejecutar finaliza | `flujoSoporteRemoto.test.ts:62` (P4); `transitionsSoporteRemoto.test.ts:41` (`salidas('Finalizado')` vacío) | CUMPLE |
| 17 | Servicio sobre SR da 409 con el flujo | `flujoSoporteRemoto.test.ts:73` (P5); `flujos.test.ts:192` | CUMPLE |
| 18 | La guarda de flujo gana a la de estado (posición) | `flujoSoporteRemoto.test.ts:83` (P6); `flujos.test.ts:198`; mutación 2.21 (P6 y `flujoEquipoNuevo` P3) | CUMPLE |
| 19 | SR heredado en estado sólo de servicio no queda varado | `flujoSoporteRemoto.test.ts:92` (P7); `flujos.test.ts:171,176` | CUMPLE |
| 20 | Ninguna colisión de ids | `transitionsSoporteRemoto.test.ts:55`; `invariantesGrafo.test.ts:172` | CUMPLE |
| 21 | `marcar_pendiente` sigue siendo de servicio | `transitionsSoporteRemoto.test.ts:61`; `flujos.test.ts:186` | CUMPLE |
| 22 | Modalidad válida se guarda | `flujoSoporteRemoto.test.ts:142` (A1) | CUMPLE |
| 23 | Modalidad inválida da 422 (`presencial`, vacía, `Remoto`, `null`) | `flujoSoporteRemoto.test.ts:157` (A3, 4 valores); `flujos.test.ts:246` | CUMPLE |
| 24 | La guarda gana al 409 de la OV (posición) | `flujoSoporteRemoto.test.ts:204` (A7, con control); mutación 2.20 | CUMPLE |
| 25 | Sin modalidad se guarda `remoto` | `flujoSoporteRemoto.test.ts:150` (A2) | CUMPLE |
| 26 | Otra clasificación sin modalidad: NULL | `flujoSoporteRemoto.test.ts:166` (A4) | CUMPLE |
| 27 | Modalidad enviada con otra clasificación: 422 | `flujoSoporteRemoto.test.ts:180` (A5, dos ramas) | CUMPLE |
| 28 | Las transiciones no editan modalidad | `transitionsSoporteRemoto.test.ts:25` | CUMPLE |
| 29 | Un valor de modalidad en una transición no la cambia | `flujoSoporteRemoto.test.ts:117` (P9), `:258` (R1) | CUMPLE |
| 30 | La sincronización no toca modalidad | `repo.test.ts:513` (fila NO gestionada: el asunto cambia y la modalidad no) | CUMPLE |
| 31 | `TICKET_COLS` no contiene modalidad (mutación) | `repo.test.ts:506`; mutación 2.11 (M8): 2 rojos | CUMPLE |

### 4.2 · `transitions-equipo-nuevo` (5)
| # | Escenario | Prueba | Veredicto |
|---|---|---|---|
| 32 | EN heredado en estado sólo de servicio sigue en servicio | `flujos.test.ts:47`; `flujoEquipoNuevo.test.ts:81` (P5) | CUMPLE |
| 33 | EN en estado de su catálogo pasa a `equipo-nuevo` | `flujos.test.ts:34`, `:38` | CUMPLE |
| 34 | SR en estado de su catálogo pasa a `soporte-remoto` (los cuatro) | `flujos.test.ts:42` (invertida; los cuatro estados) | CUMPLE |
| 35 | SR heredado en `Rev./Diagnostico` o `Ticket creado` sigue en servicio | `flujos.test.ts:171`, `:176`; `flujoSoporteRemoto.test.ts:92` | CUMPLE |
| 36 | La clasificación desambigua `En Proceso` | `flujos.test.ts:165` | CUMPLE |

### 4.3 · `tickets-core` (19 + 1 heredado)
| # | Escenario | Prueba | Veredicto |
|---|---|---|---|
| 37 | El alta sin discrepancia no cambia | `ticketService.test.ts:490` | CUMPLE |
| 38 | Obligatorios ganan a la OV ya usada | `ticketService.test.ts:345` | CUMPLE |
| 39 | Cliente no encontrado gana a la OV ya usada | `ticketService.test.ts:356` | CUMPLE |
| 40 | La discrepancia equipo-cliente gana a la OV ya usada | `ticketService.test.ts:323` (N1) | CUMPLE |
| 41 | Equipo-cliente se resuelve antes de contar obligatorios | `ticketService.test.ts:424` (N2) | CUMPLE |
| 42 | Rama EN, obligatorios ausentes | `ticketService.test.ts:537` | CUMPLE |
| 43 | Rama EN, opcional inválido | `ticketService.test.ts:545` | CUMPLE |
| 44 | Las otras dos clasificaciones sin `equipoId` | `ticketService.test.ts:573`; `flujoSoporteRemoto.test.ts:194` | CUMPLE |
| 45 | Modalidad inválida en alta de SR | `flujoSoporteRemoto.test.ts:157` (A3) | CUMPLE |
| 46 | Modalidad enviada con otra clasificación | `flujoSoporteRemoto.test.ts:180` (A5) | CUMPLE |
| 47 | La guarda de modalidad gana a la OV ya usada | `flujoSoporteRemoto.test.ts:204` (A7) | CUMPLE |
| 48 | Alta SR deja las dos filas con `Solicitud Soporte` | `repo.test.ts:456` (fila, foto y `values.modalidad`); `flujoSoporteRemoto.test.ts:142` | CUMPLE |
| 49 | Alta de otra clasificación no cambia | `repo.test.ts:475`; `flujoSoporteRemoto.test.ts:166` | CUMPLE |
| 50 | Un fallo posterior revierte las dos filas | `repo.test.ts:486` (secuencia `BEGIN, INSERT ticket, INSERT foto, ROLLBACK`, sin `COMMIT`; pg-mem no revierte) | CUMPLE |
| 51 | Ningún ticket nace en `OV asignada` | `repo.test.ts:475` (`not.toBe('OV asignada')`), `:456` | CUMPLE |
| 52 | El estado inicial depende de la clasificación | `repo.test.ts:456,475`; `flujos.test.ts:210,215` | CUMPLE |
| 53 | EN deja de caer en el grafo de servicio | `flujos.test.ts:34,72`; `flujoEquipoNuevo.test.ts:28` | CUMPLE |
| 54 | SR deja de caer en el grafo de servicio | `flujos.test.ts:182`; `flujoSoporteRemoto.test.ts:31` | CUMPLE |
| 55 | La prueba «SR siempre servicio» se invierte | `flujos.test.ts:42` (SR a `soporte-remoto` en 4 estados y a `servicio` fuera) | CUMPLE |
| 56 | Bloque heredado de RQ-TC-06: foto ausente en tickets viejos, la historia cae a la fila | **Ninguna prueba nueva de este cambio.** Comportamiento preexistente en `repo.ts:424-427` y `ticketFuentes.ts:63-75`; este cambio no toca `ticketFuentes.ts` (`git diff 66ab783 HEAD --stat` no lo lista) | CUMPLE (heredado, sin cambio; hipótesis: lo cubre la spec de `trazas`) |

**Escenarios: 56 CUMPLE · 0 PARCIAL · 0 NO CUMPLE · 0 SIN PRUEBA POSIBLE** (55 con prueba de este cambio y 1 heredado sin tocar).
**Contraste con la matriz de `tasks.md`:** no la copié; releí cada prueba. Sin discrepancias de fondo. El único desfase es de forma: el escenario 16 lo cubre `transitionsSoporteRemoto.test.ts:41`
(`salidas('Finalizado')` vacío) y no el invariante `3` de la unión, que además no lo distingue (lo dice el propio escenario 9).

## 5 · Hipótesis de la spec comprobadas en código

| Hipótesis o afirmación | Comprobación | Resultado |
|---|---|---|
| S-10: `Solicitud Soporte` cae en `Otros` (`columns.ts:38`, `:45-46`) | `columns.ts:38` (`FALLBACK_COLUMN_ID = 'otros'`), `:45-46` (`?? FALLBACK_COLUMN_ID`); `flujos.test.ts:204` | Confirmada |
| D2: nada de `shared` invoca `flujoDelTicket` al cargar | la suite entera carga sin error; `flujos.ts:108-110` lo declara | Confirmada |
| Nacimiento y enrutado usan el MISMO predicado (molde H5) | `flujos.ts:116-119` lo usan `flujoDelTicket` (`:57`), `estadoInicialDelAlta` (`:139`) y `modalidadDelAlta` (`:155`); mutación 1.23 (H5) en rojo | Confirmada |
| El servidor impone la modalidad; el cliente es comodidad | ver §6 | Confirmada |
| La guarda 3 corre antes que la de estado | `ticketService.ts:125` (`exigirMismoFlujo`) precede a `:126-128`; P6 y mutación 2.21 | Confirmada |

## 6 · Regla 13 y `.tsx` (fuera de la red por F0-00; sin `jsdom`)

Se contrastó **cada línea de servidor** de la tabla de `apply-progress.md:127-137` con el fichero de hoy. Todas dicen lo que la fila afirma:

| Decisión del cliente (`CreateTicket.tsx` / `TicketProperties.tsx`) | Línea de servidor releída hoy | Prueba hoy | ¿Coincide? |
|---|---|---|---|
| Selector sólo en SR (`CreateTicket.tsx:45`, predicado de `shared`); clave omitida fuera (`:230`) | `ticketService.ts:91` y `flujos.ts:161-162` (422 fuera de SR) | `flujoSoporteRemoto.test.ts:180` | Sí |
| Preselecciona `remoto` (`:45`) | `flujos.ts:156` (ausente da `remoto`) | `:150` (A2) | Sí |
| Ofrece dos valores (`:422`, `MODALIDADES`) | `flujos.ts:157-159` y 422 en `ticketService.ts:91` | `:157` (A3) | Sí |
| Ficha en sólo lectura (`TicketProperties.tsx:144`) | `repo.ts:44-54` sin `modalidad`; `transitions.ts:389-396` sin `modalidad` | `:117`, `:258`, `:273`, `:282`, `:294`; `repo.test.ts:506`, `:513` | Sí |
| No elige el estado inicial | `repo.ts:418`, `:422`, `:435` | `repo.test.ts:456`; `flujoSoporteRemoto.test.ts:142` | Sí |
| Exige equipo salvo EN (`:222-224`, `:332`) | `ticketService.ts:24`, `:27` | `:194` (A6) | Sí |
| Datos obligatorios del equipo nuevo (`:223`) | `equipoNuevo.ts:41` (`exigirEquipoNuevo`) | `ticketService.test.ts:537` | Sí |
| Bloquea cliente y acota equipos (`:152`) | `ticketService.ts:61-79` | `ticketService.test.ts:323,383-424` | Sí |
| Ofrece sólo OV libres (`:122`) | `ticketService.ts:96-100` (409) | `ordenVentaUnTicket.test.ts` | Sí |
| `required` en tipo y clasificación (`:415`, `:419`) | `ticketService.ts:83-88` | `ticketService.test.ts:274` | Sí |
| Rellena prefijo, código y asunto (sugerencia editable) | `ticketService.ts:87` (prefijo), `:101-102` (código y asunto) | sin prueba: comodidad sin decisión | Sí |

Ninguna decisión del cliente queda sin línea de servidor: **el cliente no es la guarda en ninguna** (regla invariable 13, puntos 1-3). `CreateTicket.tsx:122` es
una llamada de búsqueda (`searchSalesOrders(ovQuery, clientId, true)`), correcta como «ofrece sólo OV libres». La verificación visual (posición del quinto elemento de la rejilla, desviación 3 del lote 3)
es de persona: **P.2**, fuera del recuento.

## 7 · Tareas

`tasks.md`: **69 casillas `[x]`, 0 abiertas** (`grep -c` de casillas abiertas = 0). Las tres tareas de persona P.1-P.3 (`tasks.md:392`, `:405`, `:408`) no llevan casilla y
se declaran aparte, con dueño y destino, por la regla del ciclo 1: **archivar no las da por hechas**. Cada tarea marcada tiene su rastro en el código de hoy: catálogo
(`transitions.ts:388-397`), registro (`flujos.ts`), estado (`estados.ts:105,182,188`), `ALTER` (`schema.sql:5`), escritor (`repo.ts:418-435`), guarda (`ticketService.ts:91`), tipo (`types.ts:321`),
cliente (`CreateTicket.tsx:45,230,422`) y ficha (`TicketProperties.tsx:144`). Desviación registrada y aceptada: 3.1 se hizo en `types.ts` y no en `client.ts`
(`apply-progress.md:157`); `tasks.md:85` todavía nombra `client.ts` en la previsión, cosa de plan y no de código.

## 8 · Criterios de éxito (`proposal.md:160-163`)

| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | Alta SR nace en `Solicitud Soporte`, fila #1 con ese `to_status`, modalidad guardada; inválida da 422 | `flujoSoporteRemoto.test.ts:142,157`; `repo.test.ts:456` | Cumplido |
| 2 | SR sólo ve y ejecuta sus 4; `marcar_pendiente` sobre SR da 409 | `flujoSoporteRemoto.test.ts:73,100`; `flujos.test.ts:182` | Cumplido |
| 3 | `flujos.test.ts:42-45` invertida; `sinSalida` de la unión = `['Finalizado']` | `flujos.test.ts:42`; `invariantesGrafo.test.ts:177` | Cumplido |
| 4 | Barrido de citas al cierre: 0 rotas nuevas | detector del hook sobre `HEAD`: salida 0, 0 bloqueantes, 11 abreviadas informativas ya conocidas, ninguna en esta carpeta; el barrido humano de `apply-progress.md:140-151` (130 resultados leídos) declara cada caso A/B | Cumplido, con la salvedad de que el detector no lee qué AFIRMA cada frase (regla de mutación 4) |

## 9 · Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W1 · S-6 cambia en vivo el flujo de los SR heredados en `En Proceso`, `Pendiente` o `Finalizado`** (`flujos.ts:56-57`; `tasks.md:317`, 3.11). Un ticket SR ya en `Pendiente` pierde las salidas de servicio
  (`servicio_externo_pendiente`, `diagnostico_complementario`) y pasa a ver sólo `Continuación soporte`. No es un defecto: es la decisión de la propuesta (`proposal.md:113`), con `P.1` (recuento de sólo lectura, Alfonso)
  como mitigación **antes de desplegar**, y P.1 está sin hacer. **Bloquea el despliegue, no el archivo.** Probabilidad media según la propuesta (`:150`).
- **W2 · El área de las cuatro transiciones es un supuesto (S-1), no un dato.** La hoja `DF-soporte-remoto-030226.xlsx` trae `ÁREA_RESPONSABLE` vacía y M1.5 no la dice. *Hipótesis*: `Asignación` podría ser de Comercial, que recibe la solicitud.
  Hoy `Comercial` recibe 403 en las cuatro (`permisos.test.ts:306`). Es un dato por transición (`transitions.ts:389`), reversible; lo cierra `P.3` (Gerencia / Servicio Técnico, `docs/sdd/ENTRADA.md`).

### SUGGESTION
- **S1 · Errata en una prueba:** `packages/zoho-sync/src/db/repo.test.ts:495` parte el SQL con la expresión regular `s+` (la letra «s» repetida) y no con la de espacios en blanco. Inocuo hoy (`BEGIN` y `ROLLBACK` van en mayúscula y no contienen `s` minúscula, y la secuencia esperada sale bien),
  pero un verbo con `s` minúscula saldría mal partido. Se puede corregir en el siguiente cambio que toque el fichero.
- **S2 · Legibilidad de `ticketService.ts:91` y `:96`:** varias sentencias en una línea (guarda de modalidad en `:91`; cuarentena, vencido y `enUso` en `:96`). Es deliberado para no desplazar citas (`apply-progress.md:102`, desviación 2) y las pruebas de posición
  (A7, A8, A9) lo blindan; el precio es una línea de más de 400 caracteres. No se toca sin barrido de la regla de mutación 4.
- **S3 · La tabla de evidencia TDD no usa el formato estándar** (columnas SAFETY NET y TRIANGULATE): los puntos de partida están en prosa (`apply-progress.md:3`, `:57`, `:122`) y la triangulación sale de los `it.each`. La información está; sólo cambia el formato.
- **S4 · *Hipótesis*, preexistente y fuera de alcance:** `ticketService.ts:24-25` compara `b.clasificaciones !== 'Equipo nuevo'` por igualdad exacta, mientras `esClasificacionSoporteRemoto` y `modalidadDelAlta` normalizan mayúsculas. La UI sólo emite el literal exacto, así que no hay caso observable;
  es el molde H5 (dos implementaciones de la misma noción). Candidato a nota, no a corrección de esta tanda.
- **S5 · El bloque heredado de RQ-TC-06 (foto ausente en tickets viejos) no tiene prueba propia en este cambio.** Es comportamiento preexistente que el cambio no toca; si Gerencia quiere ese Given/When/Then probado, es trabajo de `trazas`, no de F1B-06.

## 10 · Línea sobre `cierra: si`

La fila F1B-06 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:161`, y su fila de reparto `:498`; la R01.3 no reescribe ese §5 y sólo nombra la tanda en `:79` y `:110`) pide «Blueprints de **equipo nuevo** y **soporte remoto** (M1.4, M1.5) implementados en `transitions.ts` con la misma convención; hereda C12», con `decision/flujos-comercial-posible-cliente` recortando a **dos** ramas: este cambio
cubre la mitad de soporte remoto (catálogo de 4 transiciones sobre 4 estados, tercer flujo, `Solicitud Soporte` como estado de nacimiento y la Modalidad de `decision/anexo-43-en-sitio`, alcance añadido por `openspec/config.yaml:2416`) y, junto con `blueprint-equipo-nuevo` (archivado), **no queda fuera nada de las dos ramas**; quedan fuera a propósito la rama de servicio en sitio (2027 T2), la guarda de remisión (F1B-03), la columna de tablero propia (F1B-09) y M1.11/M1.12 (se quedan en Zoho CRM). Que C12 lo heredó `blueprint-equipo-nuevo` es *hipótesis*: no se re-verificó aquí. El `cierra: si` se sostiene; lo que falta es de persona (P.1-P.3).

## 11 · Contrato de fase
- **Veredicto:** PASS WITH WARNINGS (0 CRITICAL, 2 WARNING, 5 SUGGESTION).
- **Recomendado:** `sdd-archive`. Al archivar, la fusión del delta reescribe la sección 4.3 de `tickets-core` y la sección «Fuera de alcance» de `transitions-equipo-nuevo`, y el archive cuesta ~2 veces la carpeta por el ledger sin detección de renombrado (`CLAUDE.md`, regla del ciclo 2).
- **Riesgos que NO bloquean el archivo:** W1 (P.1 antes de desplegar) y W2 (P.3).
