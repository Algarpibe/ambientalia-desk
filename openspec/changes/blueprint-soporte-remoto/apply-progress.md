# apply-progress — `blueprint-soporte-remoto` · Lote 1 (`shared`) · Strict TDD

Base `47db1bc` (docs sobre `66ab783`). Línea base antes de tocar: `npm test` 156 ficheros · 1848 tests (+2 omitidos), `packages/shared` 24 · 394.
Tareas 1.1–1.25 hechas; A.1 y 0.3 previas. Lote 2 y 3 sin empezar.

## Evidencia TDD (rojo capturado antes del verde)
| Bloque | Fichero de prueba | Rojo (por qué) | Verde |
|---|---|---|---|
| A · Estado (1.1-1.4) | `estados.test.ts` | 5 rojos: `ESTADOS` 22≠23; `sin_clasificar` sin el tercero; `Solicitud Soporte` `undefined`; `ESTADOS[último]` = `Verificación`; `ESTADOS_SOLO_SOPORTE_REMOTO is not iterable` | 15/15; `tsc -b` limpio |
| B · Catálogo (1.6-1.11) | `transitionsSoporteRemoto.test.ts` (nuevo, 6 casos), `reentrancia.test.ts` (+2), `invariantesGrafo.test.ts` | 9 rojos (`undefined.map`, `Target cannot be null`, ciclo = 3 por caer en `TRANSITIONS`); `invariantesGrafo` NO cargó (`TRANSITIONS_SOPORTE_REMOTO is not iterable` al evaluar el `UNION`): 3 ficheros rojos | catálogo verde; queda 1 rojo esperado (`flujoDeTransicion('soporte_pendiente')`) hasta el bloque C |
| C · Flujos (1.16-1.20) | `flujos.test.ts` (+22 casos con `it.each`), `invariantesGrafo.test.ts` (+2) | 29 rojos: 3 invertidos/deliberados (`:42-45` `servicio`≠`soporte-remoto`; «tres entradas»; `Object.keys`), el resto `esClasificacionSoporteRemoto`/`estadoInicialDelAlta`/`modalidadDelAlta`/`MODALIDADES` no existen, y `SR en Solicitud Soporte` ve `[]` | 81/81 en los tres ficheros; 111/111 en los cinco del comando enfocado |

**Nacen VERDES (declarado):** `sinSalida = ['Finalizado']` (unión, en sitio); `marcar_pendiente` resuelve a servicio; SR en `Rev./Diagnostico` y `Ticket creado` ve las de `TRANSITIONS`;
`columnForStatus('Solicitud Soporte') = 'otros'` (S-10, `columns.ts:38`, `:45-46`); los EN heredados (`flujos.test.ts:34-36`, `:47-49`); y el invariante «sin transición de entrada = `Remisión creada`, `OV asignada`, `Ticket creado`, `Solicitud Soporte`» (la hipótesis se confirmó en el primer intento, sin ajuste).

## Mutaciones (todas revertidas; `cmp` con la copia verde = idénticas)
| # | Mutación | Rojo |
|---|---|---|
| 1.5 (M9) | `ESTADOS_SOLO_SOPORTE_REMOTO = []` | `estados.test.ts` ×2 (`ESTADOS_SERVICIO` 21/orden; lista) y `tsc` `fasesBlueprint.ts:68` TS1360 |
| 1.12 | `anular_soporte` `Solicitud Soporte → Finalizado` | 12: 1.6(a)(b)(c)(d)(f)(e), reentrancia, unión 44, y los 4 de `invariantes del catálogo` |
| 1.13 | borrar `ejecutar_soporte` | 10, incl. 1.6(f); `3 · sin salida` NO se pone rojo (confirma la spec) |
| 1.14 | `soporte_pendiente` → id `marcar_pendiente` | 6, incl. 1.6(e) (ids únicos, 43≠44) y unión 44 |
| 1.15 (M7) | `from: ['Solicitud soporte']` | 9: 1.6(a)(b), unión `1`, `3` y `4`, `ESTADOS_SOLO…`, pares y S-5 |
| 1.21 (M11) | quitar la condición de estado en `flujos.ts:57` | 3: inversión `:42-45`, SR en `Rev./Diagnostico` y en `Ticket creado` ven `[]` |
| 1.22 (M10) | `estadoInicialDelAlta` siempre `Ticket creado` | 3: nacimiento SR, nacimiento=enrutado, invariante de entrada |
| 1.23 (H5) | comparar con el literal `'Soporte remoto'` | 2: «soporte remoto» normalizado (nacimiento y enrutado divergen) |
| 1.24 | `modalidadDelAlta` normaliza a minúsculas | 1: fila `SR con "Remoto" → error` |

## Cierre (1.25)
- Enfocado (5 ficheros de `shared`): 5/5 · 111 tests. `npm test`: **157 ficheros · 1895 tests (+2 omitidos)**, 0 rojos (+1 fichero, +47 tests). Ningún rojo fuera de `shared`: `permisos`, `sla.test.ts:202` y `transicionesEjecucion` siguen verdes.
- `npm run typecheck` limpio; `npx eslint . --max-warnings 165` = 165 warnings, 0 errores (sin avisos en los ocho ficheros tocados).
- Recuentos: `estados.ts` **190 sin cambio** (`7 7`; ningún hunk con más `+` que `-`); `transitions.ts` 376→397 (`22 1`: `:366` + 21 al final); `flujos.ts` 106→163 (`63 6`: cinco líneas en sitio + 57 al final).
- Medida del lote: tracked `--no-renames HEAD -- packages/shared` (con el nuevo tras `add -N`) 412+ / 41−; sin trackear 0; `apply-progress.md` 49 (`wc -l`). Total `git diff --shortstat --no-renames HEAD` con los dos nuevos tras `add -N`: 487+ 66− = 553 (incluye 25 casillas de `tasks.md`) ≪ 800.
- Barrido de citas (regla 4): ninguna línea se desplazó. Releído lo que cambia de contenido: `estados.ts:105` (`proposal.md:109`, paquetes de despliegue) sigue cierto; `:101-105` (`fasesBlueprint.ts:40`) cierto; `:112` `ESTADOS` cierto;
  `flujos.ts:56-61` (paquetes de despliegue 09-27/09-29, `exploration.md:27`) cierto pero INCOMPLETO: `:57` ahora enruta también SR (caso A, sólo prosa de despliegue); `transitions.ts:365-376` y `invariantesGrafo.test.ts:163` sólo se citan en `design`/`tasks`.

## Desviaciones
1. **`invariantesGrafo.test.ts:6`** lleva TRES `import` en una línea (`; import …`) para no insertar líneas arriba (`:3`, `:5` y ~62 citas): estilo poco común, deliberado. `estados.test.ts:3` y `flujos.test.ts:3` igual (nombres añadidos en la misma línea).
2. **Retorno de `modalidadDelAlta`** `{ valor } | { error }` (hipótesis de 1.16 confirmada); `estadoInicialDelAlta` devuelve `string` (no el tipo `Estado`) para no atar `flujos.ts` a un import nuevo de `estados`.
3. `modalidadDelAlta('Equipo nuevo', null)` → error (`null` cuenta como valor enviado; `design` D5 sólo fija `=== undefined` como ausente): fila extra de la tabla, revisable.
4. 1.6(e) («`soporte_pendiente` resuelve a `soporte-remoto`») sólo se pone verde al llegar `flujos.ts` (bloque C), no en 1.11: dependencia de orden que la tarea no anticipaba.
5. `flujos.ts:21` y `:57` cambian en la MISMA línea (dos sentencias); `estados.ts:182` lleva dos sentencias con `;` y un comentario final.

## Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Comando enfocado | `npx vitest run estados.test.ts transitionsSoporteRemoto.test.ts reentrancia.test.ts invariantesGrafo.test.ts flujos.test.ts` → 5 ficheros · 111 passed |
| Runtime | N/A: node puro (`vitest.config.ts:16`), sin frontera de red/BD en el lote 1 |
| Rollback | `git revert` del commit del lote 1 (8 ficheros de `shared`); ojo S-6: SR heredados en `En Proceso`/`Pendiente`/`Finalizado` cambian de flujo en vivo |

**Reproducido por el orquestador (regla de mutación 2, sobre el catálogo vigilado):** rojo previo con los tres ficheros de producción de `47db1bc` = 42 fallos y `invariantesGrafo.test.ts` sin cargar (91 de 111). M-A, transición a un estado sin salida y sin registrar (`En Proceso → 'Estado fantasma'`): 12 rojos (invariantes 1 y 4 de la unión, pares, (e)); el invariante 3 NO, porque recorre el registro. M-D, estado REGISTRADO sin salida (se retira `asignacion_soporte`): 19 rojos, entre ellos «3 · sin salida en la unión es exactamente Finalizado». M-B, id repetido entre catálogos (`soporte_pendiente` → `marcar_pendiente`): 7 rojos. M-C, id repetido dentro del catálogo: 5 rojos. Las cuatro revertidas con `cmp`.

---

# Lote 2 · Servidor y BD · Strict TDD

Base `8fb8efd` (lote 1 commiteado). Tareas 2.1–2.25 hechas (más `fasesBlueprint.ts:40` y `fasesBlueprint.test.ts:28`, del orquestador, contados). Línea base: `npm test` 157 ficheros · 1895 tests. Cierre: **158 · 1938** (+1 fichero, +43), 0 rojos.
Lote 3 sin empezar.

## Evidencia TDD (rojo capturado antes del verde)
| Bloque | Fichero | Rojo (por qué) | Verde |
|---|---|---|---|
| A · Columna (2.1-2.4) | `migrate.test.ts` (3 en sitio + describe final) | 2: «expected 39 to be 40» y «sentencias que mencionan modalidad: 0 ≠ 1» | 24/24, `migrate.integration` omitido como antes |
| B · Escritor (2.7-2.10) | `repo.test.ts` (+7 casos) | 4: SR nace en `Ticket creado` ×2 (`modalidad` y estado), «modalidad» sin columna escrita, sync/col | 41/41; `repo.ts` `13 13`, 452 sin cambio |
| C · Alta y guarda (2.13, 2.16) | `flujoSoporteRemoto.test.ts` (nuevo, 26) | **11 rojos**: A1, A2, A3×4, A5, A7, A8, A9, A10 (la guarda y el campo no existían; A1/A2 ya tenían el estado bien por el bloque B, y fallaban por `modalidad`) | 26/26 |
| D · Barridos (2.14) | `permisos` (+4), `transicionesEjecucion` (+3), `avisoArea` (+2) | ninguno: nacen VERDES | 49/49 |

**Nacen VERDES (declarado, 2.8 y 2.15):** en `repo.test`: EN y mantenimiento en `Ticket creado` (regresión de nacimiento, `it.each`), «ninguno en `OV asignada`», rollback, `TICKET_COLS` sin `modalidad`; en `flujoSoporteRemoto`: P1-P9, A4, A6 y R1-R4 (el lote 1 ya entrega el enrutado y ninguna vía escribe `modalidad`); los tres barridos. Su rojo sale de las mutaciones de abajo.
El rollback se prueba por la SECUENCIA de verbos (`BEGIN, INSERT ticket, INSERT foto (falla), ROLLBACK`, sin `COMMIT`): pg-mem no revierte (`transaccion.test.ts:25`).

## Mutaciones (todas revertidas con `cmp` contra la copia verde)
| # | Mutación | Rojo |
|---|---|---|
| 2.5 M5 | `UPDATE tickets SET modalidad='remoto'` en `schema.sql` | 1: sentencias con `modalidad` = 2 |
| 2.6 M6 | `ALTER TABLE desk.tickets … modalidad` | 3: identidades calificadas, recuento 20≠19, «schema not found: desk» |
| 2.11 M8 | `'modalidad'` en `TICKET_COLS` | 2: ausencia y «no la pisa» (se separó en dos pruebas: la primera tapaba a la segunda) |
| 2.12 | `:435` en `'Ticket creado'` con `:422` en `estadoInicial` | 2: SR `to_status` ≠ `status` (repo) y A1 (HTTP) |
| 2.18 M1 | la guarda de modalidad ANTES de `validarCamposEquipoNuevo` | 1: **A9** |
| 2.19 M2 | tras la cuarentena/vencido (`:96`), antes del 409 | 1: **A8** (A7 sigue verde: el 409 aún va detrás) |
| 2.20 M3 | tras el 409 (`:97-100`) | 2: **A7** y A8 (queda detrás de las dos vecinas) |
| 2.21 M4 | guarda 3 (`:125`) tras la de estado | 2: **P6** y `flujoEquipoNuevo` P3 |
| 2.22 | `area: 'Comercial'` en `asignacion_soporte` | 9: matriz 4×3 (Comercial y Servicio Técnico), P1, P2, P8, R1, `transitionsSoporteRemoto` (d), 2 de `avisoArea` |
| 2.23a | sin el 422 de modalidad fuera de SR (`flujos.ts:162`) | 5: 3 de la tabla D5, A5, A9 |
| 2.23b | sin el default `remoto` | 3: 2 de la tabla D5 (1.16) y A2 |
| R-1 | `plan.columns.modalidad = values.modalidad` en `executeTransition` | 2: **P9** y R1 |
| R-2 | `UPDATE … modalidad=$4` en `db/resolutions.ts:12` | 1: **R2** (un primer intento con comilla mal escapada no compiló: descartado, no cuenta) |

**Posición del escalón C (regla 1):** A9 (vecina anterior: opcionales de EN, F1B-02), A8 (vecina siguiente: cuarentena de `:96`), A7 (D, el 409). Cada uno lleva un CONTROL con la modalidad válida, donde gana la vecina (prueba que las dos guardas estaban activas).
Orden resultante: equipo↔cliente < obligatorios < cliente < opcionales EN < **modalidad** < cuarentena/vencido < D.

## Sólo lectura tras el alta, impuesto por el servidor (requisito 4)
Barrido de `UPDATE tickets` en `apps/` y `packages/`: transición (`applyTransition`, R1 ×4 transiciones, en `values` y en la raíz), resolución (`PUT …/resolution`, R2), liberar OV (`PUT /api/ov-asociaciones/:id/liberar`, R3), remisión de entrada (`POST /api/remisiones`, su `UPDATE`, R4) y sync (`repo.test`, fila NO gestionada: el asunto cambia y `modalidad` no). Las demás (`backfill*`, `history_synced_at`, avisos) son de proceso, no de ruta con cuerpo. `POST …/reply` no escribe `tickets`.

## Cierre (2.25)
- Enfocado (10 ficheros): 10/10 · 320 tests. `npm test` 158 · 1938 (+2 omitidos). `npm run typecheck` limpio. `npm run lint`: 165 avisos, 0 errores (sin nuevos).
- Recuentos: `repo.ts` 452 `13 13`; `ticketService.ts` 234 sin cambio de largo, `4 4` (`:6`, `:20`, `:91`, `:107`; ver desviación 2); `schema.sql` 573→576 `3 0`; `migrate.test.ts` 444→464 `23 3`; `rows.ts`, `mappers.ts`, `types.ts` `1 1`, largos sin cambio (132, 261, 810).
- Regresión (2.24): `ticketService`, `ordenVentaUnTicket`, `remisiones`, `flujoEquipoNuevo` verdes; sus ficheros sin diff.
- Barrido de citas (regla 4): ninguna línea de producción se desplazó. Releído lo que cambia de contenido: `openspec/specs/tickets-core/spec.md:28` («Ticket creado», `repo.ts:422`, `:435`) queda **incompleta** (SR nace en `Solicitud Soporte`, caso A, la corrige el delta/3.7); `repo.ts:418-422` (paquete 09-29:169, la marca de OV en el `INSERT`) sigue cierta. Sin citas vivas a `ticketService.ts:91`/`:107`. Pendiente para 3.7: `equipoNuevo.ts:65` cita `:89` (deriva previa) y el barrido completo.

## Desviaciones
1. **Matriz 4×3: 8 prohibidos y 4 permitidos**, no «sólo Comercial = 403»: `Compras` también da 403 (las cuatro son `Servicio Técnico`).
2. **`ticketService.ts` sigue en 234 líneas (corrección del orquestador):** el subagente puso el helper `exigirModalidad` al final (234→245, como decía 2.16); supervisión pidió el mismo largo, así que la guarda va EN LÍNEA en `:91` (`modalidadDelAlta` + `HttpError 422`), como las de `:96`. M1-M3 y la de sólo lectura, re-reproducidas sobre esa forma: A9, A8, A7+A8, P9+R1, R2.
3. A1/A2 fallaban por `modalidad`, no por el estado: el bloque B (2.9) ya estaba verde cuando se corrió la serie A (orden de tareas de 2.9 antes de 2.13).
4. El número de `null` en modalidad para clasificaciones ≠ SR da 422 (desviación 3 del lote 1, confirmada por A3/A5).
5. Se añadió `P8` sobre las 44 transiciones (no sólo la lista de Servicio Técnico) y `R1-R4`: más de lo que 2.13 pedía, por el requisito de sólo lectura.

## Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Comando enfocado | los 6 de la tabla + `ticketService`, `remisiones`, `ordenVentaUnTicket`, `flujoEquipoNuevo` → 10 ficheros · 320 passed |
| Runtime | pg-mem + `appHarness` (HTTP real con supertest); pg-mem no revierte `ROLLBACK`: atomicidad por secuencia de verbos |
| Rollback | `git revert` del commit del lote 2; la columna `modalidad` queda (aditiva); SR nacidos en `Solicitud Soporte` quedan sin transiciones con el código viejo |

**Medida del lote 2:** `git diff --shortstat --no-renames HEAD` (con `flujoSoporteRemoto.test.ts` tras `add -N`, y con las dos ediciones del orquestador, `tasks.md` 25 y este fichero) = 16 ficheros, 644+ / 53− = **~697** ≪ 800; la válvula de 2.14 (640 tras 2.13) no se activó: tras 2.13 el acumulado era 472.
