# apply-progress — `control-calidad-liberacion` (F1C-07, `cierra: no`)

## Lote 1a — catálogo, estado, fase, columna, mapa (intento I3) · HECHO

Tareas 1a.1 a 1a.7 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 1a.1 línea base | `npx vitest run packages/shared apps/desk/server`: `1 failed, 4399 passed`; `npm run typecheck` en 0. El rojo es `registro.test.ts:220` («en curso» ve F1C-07 por el `proposal.md` de la planificación): **anterior al lote**, no es de 1a | — |
| 1a.2 catálogo | `Error: Cannot find module './camposControlCalidad' imported from .../controlCalidadCatalogo.test.ts` (módulo inexistente) | `controlCalidadCatalogo.test.ts` 7/7 |
| 1a.3 vigilantes | `packages/shared`: `21 failed, 1516 passed` (conteos 33→36, 22→23, 25→26, 41→44, tipos 16/14/13/4→17/16/13/4, columna, fase 11→12) | tras 1a.4–1a.6: `58 files, 1546 passed` |
| 1a.4 código | — | `camposControlCalidad.ts` (nuevo) + `estados.ts:99`, `fasesBlueprint.ts:55`, `columns.ts:30`, `transitions.ts:74`/`:262`, `decisionales.ts:2`/`:46`, todo en su línea |
| 1a.5 `cifras_ancladas` | `cifrasAncladas.test.ts`: `expected 33 to be 36`, `22 to be 23`, `41 to be 44` | solo `openspec/config.yaml:1360-1383` (6 líneas cambiadas, 6/6) |
| 1a.6 mapa | `mapaBlueprint.test.ts` anti-desfase rojo (`difiere`) | `npx tsx scripts/generar-mapa-blueprint.ts`: 6 ficheros escritos, 3 con cambio de contenido (+28/-18 = **46** líneas; la hipótesis era ≈ 40) |

### Vigilantes que el lote movió además de los de D6 (consecuencia del ciclo En Proceso ⇄ Control de calidad y de los nuevos tipos)

`bodegaje.test.ts` (9→10 reentrantes), `cargos.test.ts` (1.925→2.090), `reentrancia.test.ts` (C2 gana el estado y `envio_control_calidad`; 8→9 casos; 9→10 campos, 7→8 obligatorios: **`Fecha Finalización ST` pasa a ser reentrante**, S-16 del diseño), `invariantesGrafo.test.ts:137`, `estados.test.ts` («ninguna» 13→14), `transitions.test.ts:123` (28→31 heredan), `transitionsSoporteRemoto.test.ts:58`, `comentariosVigilados.test.ts` (obliga a `ticketService.ts:238` «otras 44»→47, una línea, mismo largo), `decisionales.test.ts` (tabla 14→16 con `FIRMA_CC`), y en servidor `permisos.test.ts` (99→108, 59/40→65/43, 60/39→66/42, 891→972), `cargoPermiso.test.ts` (99→108), `flujoSoporteRemoto.test.ts:112` (45→48), `transicionesEjecucion.test.ts:185`/`:188`/`:285` (tres casos en `CASOS`, 39→42 ejecuciones).
Con el interruptor sin construir (lote 2a), el barrido ejecuta las tres nuevas con 200 como cualquier otra: es la caracterización de hoy y 2a/2b la mueven (`409`/`403`).

### Mutaciones (a mano, con copia de seguridad y `cmp` tras restaurar; `herramientas/mut.mjs` no existe en el árbol)

| Mutación | Prueba que la caza | Rojo | Restaurado |
|---|---|---|---|
| M12 · aprobación `to: 'Por Entregar'` (`transitions.ts:262`) | `controlCalidadCatalogo.test.ts` «tipos, áreas, recorridos y campos»; `transicionesEjecucion.test.ts` «cada caso declara los mismos extremos» y «las 36 salen de su origen…» | sí (3 rojos) | `cmp` idéntico; 22/22 verdes |
| M14 · quitar `|| IDS_FIRMA_CC.has(t.id)` (`decisionales.ts:46`) | `controlCalidadCatalogo.test.ts` «devuelven null para un Especialista»; `decisionales.test.ts` «RQ-PM-35 · las dos de firma…» | sí (2 rojos, repetida tras mover la prueba al final del fichero) | `cmp` idéntico; 27/27 verdes |

Pendiente para 2b (no existe la prueba HTTP todavía): «aprobado lleva a Por Facturar» (2c) y «el 403 es el de firmante» (2b) caerían en estas mismas mutaciones con su lote.

### Códigos de salida (fin del lote)

- `npm run typecheck`: **0**.
- `npm test` (suite completa): `1 failed | 301 passed` → código 1 por `registro.test.ts` «11f/05g» (anterior al lote; ver riesgos).
- `npx eslint` sobre los siete ficheros de shared tocados o nuevos: 0.

### Citas desplazadas (para el barrido de la regla de mutación 4, lote 3)

Ninguna inserción en ficheros de producción: `estados.ts`, `fasesBlueprint.ts`, `columns.ts`, `decisionales.ts`, `transitions.ts`, `ticketService.ts`, `openspec/config.yaml` dan inserciones = borrados. En pruebas: `decisionales.test.ts` +11 líneas **al final** (nada anterior se mueve), `invariantesGrafo.test.ts`, `reentrancia.test.ts` sin cambio de longitud. Fuera de eso se movió **contenido** sin mover líneas: `transitions.ts:262` (ahora lleva también las tres transiciones, caso A de `:262` en citas que describan «lo que hay en :262»), `estados.ts:99`, `columns.ts:30`, `fasesBlueprint.ts:55`/`:67`, `decisionales.ts:46`, `ticketService.ts:238` (texto). `docs/artefactos/` se renumeró (alias del mapa: sólo `Anulado`, más las aristas nuevas); ninguna cita `ruta:línea` apunta ahí.

### Ficheros tocados

Nuevos: `packages/shared/src/camposControlCalidad.ts`, `packages/shared/src/controlCalidadCatalogo.test.ts`, este `apply-progress.md`.
Modificados: `packages/shared/src/{estados,fasesBlueprint,columns,decisionales,transitions}.ts`; pruebas de `packages/shared/src/` (`cifrasAncladas`, `estados`, `invariantesGrafo`, `tipoEvento`, `decisionales`, `transitions`, `transitionsSoporteRemoto`, `fasesBlueprint`, `columns`, `mapaBlueprint`, `prioridad`, `migracionTickets`, `bodegaje`, `cargos`, `reentrancia`); `apps/desk/server/{permisos,cargoPermiso,flujoSoporteRemoto,transicionesEjecucion}.test.ts`; `apps/desk/server/services/ticketService.ts:238` (un número en un comentario); `openspec/config.yaml` (sólo `cifras_ancladas`); `docs/artefactos/blueprint-{completo,fase-2-diagnostico,fase-3-cierre}.md`; `tasks.md`.

### Riesgos y supuestos

- **Rojo anterior, fuera del lote:** `registro.test.ts` «11f/05g» espera ocho «en curso» y ve F1C-07 (nueve) desde que existe `openspec/changes/control-calidad-liberacion/proposal.md`; se arregla al decidir cómo cuenta la reconciliación una tanda en curso (la regla de avance exige archivo). No lo toqué: no está en el lote 1a.
- **Supuesto reversible:** `IDS_FIRMA_CC` y las constantes viven en `camposControlCalidad.ts` y no se reexportan por `index.ts` en 1a (el diseño sólo exporta `controlCalidad.ts`, lote 1b); `controlCalidad.ts` las reexportará o el servidor las importará de la ruta del fichero.
- `Fecha Finalización ST` pasa a campo reentrante obligatorio (S-16 ya lo preveía): tres vigilantes lo cuentan.

## Lote 1b — regla pura `controlCalidad.ts` (intento I4) · HECHO

Tareas 1b.1 a 1b.3 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 1b.1 prueba | `Failed to load url ./controlCalidad ... Does the file exist?`, `Tests no tests` (módulo inexistente) | — |
| 1b.2 código | — | `controlCalidad.test.ts` 35/35; `controlCalidad.ts` (111 líneas) y `export * from './controlCalidad'` al final de `index.ts` |

### Mutaciones (una a una con `node`, restauración comprobada por igualdad de contenido; ninguna en paralelo)

| Mutación | Prueba que la caza | Rojo |
|---|---|---|
| M3 sin `derivadoA` | «el técnico asignado intervino»; «quedaHabilitadoLibre ignora al habilitado que intervino» | sí (2) |
| M4 sin traza | «el autor de una fila Operativa intervino» + 4 más | sí (5) |
| M5 todo tipo conocido interviene | «Decisional, Compras / Logístico, Administrativo… NO son intervención» | sí (1) |
| M6 vacante siempre | «con un Coordinador activo, sólo el Coordinador» + 7 más | sí (8) |
| M7 Técnico habilitado | «vacante… nunca un Técnico», «un Técnico nunca firma» + 2 | sí (4) |
| M8 admin sin `quedaHabilitadoLibre` | «con otro habilitado libre, el administrador no firma» | sí (1) |
| M9 sin error de motivo | «el administrador de respaldo sin motivo…», «los errores van juntos» | sí (2) |
| M11b `contarRetrabajos` cuenta todas | «cuenta sólo los rechazos» + 1 | sí (2) |
| M13 siempre por nombre | «fila con id: se compara por id…» + 3 | sí (4) |
| M15a gas siempre / M15b gas nunca | «sin patrón vigente… no se exige» / «con patrón vigente se exige» | sí (2) / sí (1) |
| Prioridad: el rechazo no sube / Urgent baja | «el rechazo sube a High salvo Urgent» | sí / sí |
| Inactivo cuenta como Coordinador (vacante mal medida) | «la vacante se mide sobre los activos» + 1 | sí (2) |
| Admin que intervino firma | «si el administrador intervino, no firma» | sí (1) |
| Visibilidad: `finalizacion_servicio` siempre visible | «el envío sólo se ve…», «motivoQuitada…» | sí (2) |

### Códigos de salida

`npm run typecheck`: 0. `npx vitest run packages/shared`: 59 ficheros, 1581 pruebas, 0. `npx eslint` sobre `controlCalidad.ts`, `controlCalidad.test.ts`, `index.ts`: 0.

### Supuestos (reversibles)

- «Inactivo» se modela como ausente de `usuariosActivos` (el servidor sólo le pasa activos); la regla pura no filtra por activo. La prueba lo fija por ausencia.
- Mensajes de `mensajeSinFirma` y `motivoQuitadaPorInterruptor` son texto propio de 1b (el diseño no los fija); 2b/3 pueden afinarlos.
- `erroresContenidoControlCalidad`: «Motivo del rechazo» ausente NO da error (lo da `transitionExec.ts:76-77`); sólo el de espacios.
- `index.ts`: una línea al final; no se desplaza ninguna cita.

## Lote 2a — interruptor, traza y envío (intento I5) · HECHO

Tareas 2a.1 a 2a.5 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 2a.1 | `config.test.ts`: `expected undefined to be false`; `repo.test.ts` `performed_by_id`: rojo (columna y parámetro ausentes); `migrate.test.ts`: `ALTER TABLE en schema.sql: expected 67 to be 68` | `config.test` 13/13, `repo.test` 45/45, `migrate.test` verde |
| 2a.2 | `controlCalidad.test.ts`: 4 rojos de 8 (RQ-TS-47 apagado `expected 200 to be 409`; encendido + finalización `expected 200 to be 409`; CC-2 `expected 403 to be 409`; `performed_by_id`). Verdes de entrada, anotados: la caracterización apagada (`finalizacion_servicio` pasa), el envío encendido, CC-1 y el control «encendido sin área = 403» | 8/8 |
| 2a.3 | — | `config.ts:66` (campo, misma línea) y `:125` (lectura `=== 'true'`); `schema.sql` ALTER al final; `repo.ts:283`/`:329` (`actorId` en la línea del último parámetro), `:315-317`, `:333`, `:339`; `ticketService.ts:128` (llamada en la línea que cierra el estado) y `exigirInterruptorControlCalidad` AL FINAL (`:285`); `:155` pasa `user.id ?? null`; `appHarness.ts:46`/`:49` |
| 2a.4 | los barridos en rojo con el interruptor construido y sin ajustar: `permisos.test.ts` (4), `cargoPermiso.test.ts` S21, `transicionesEjecucion.test.ts` (el envío da 409 con la app apagada) | verdes con dos apps (apagada y encendida): el envío corre con la encendida, el resto con la apagada |

### Mutaciones (una a una, restauración comprobada por comparación de bytes)

| Mutación | Prueba que la caza | Rojo |
|---|---|---|
| M1 `=== 'true'` → `!== 'false'` (`config.ts`; `'1'` y `''` están en la prueba) | `config.test.ts` «nace cerrado» | `expected true to be false` |
| M2 `config?.controlCalidadLiberacion === true` → `true` | caracterización apagada, «apagado, el envío da 409», CC-2 | 3 rojos |
| M2b → `false` | «encendido: el envío pasa», «finalización da 409», control 403, traza | 4 rojos |
| P1 el 409 del interruptor ANTES del de estado | CC-1 | `expected 'El envío a control de calidad está ap…' to contain 'no aplica desde'` |
| P2 el 409 DESPUÉS del 403 de área | CC-2 | `expected 403 to be 409` |
| M16 sin pasar el id (`ticketService.ts:155`) | «el envío guarda el id…» | `expected null to be '86aeb580…'` |
| M16b `actorId ?? null` → `null` (`repo.ts`) | `repo.test.ts` | `expected [ null, null, null ] to deeply equal [ 'user-7', null, null ]` |

### Códigos de salida

`npm run typecheck`: 0. `npx vitest run apps/desk/server packages/zoho-sync packages/shared`: 277 ficheros pasan, 3 omitidos; 4.828 pruebas, 11 omitidas; código 0. `npx eslint` sobre los once ficheros tocados: 0 errores (21 avisos `no-explicit-any` de los `as any` de las pruebas, del estilo del fichero).

### Supuestos (reversibles) y desvíos

- **Interpretación del encargo:** decía «apagado el envío pasa; encendido finalizacion_servicio pasa». La función pura de 1b (`motivoQuitadaPorInterruptor`) y RQ-TS-47 dicen lo contrario: apagado, el envío da 409 y `finalizacion_servicio` pasa; encendido, el envío pasa y `finalizacion_servicio` da 409. Se implementó y se probó lo que dicen la función y el diseño.
- **CC-1** se leyó como «el 409 de estado gana al del interruptor» (el diseño sitúa la guarda tras el estado); P1 la mueve antes y cae.
- **Barridos HTTP:** como cada posición del interruptor deja una salida en 409, los tres barridos usan dos apps (`apagada`, `encendida`) y eligen por `t.id`; `appHarness.ts:74` NO se toca (es de 2b).
- **Defecto cazado a tiempo:** el comentario de `schema.sql` llevaba un `;` y el divisor de sentencias de `migrate` partía la ALTER (`sentencia omitida … Unexpected end of input`); se quitó. Quien añada comentarios al final de `schema.sql` no debe usar `;`.
- Cuatro vigilantes posicionales de `migrate.test.ts` (los índices «por el final» de reasignaciones, contrato_ampliaciones y encuesta_respuestas, y la suma de la prueba de gases) subieron en uno; el recuento de ALTER pasa a 68 (28 sin calificar; `ticket_transitions` entre las tablas de Desk). El guardián de `ALTER` sin calificar la acepta (`ticket_transitions` es de `DESK_TABLES`).
- `controlCalidad.ts` y `camposControlCalidad.ts` (shared) sin cambios.

### Citas desplazadas (para el barrido del lote 3)

- `config.ts`: +1 línea en `:125` (la lectura nueva); los dos `}` de cierre bajan una (`:125-126` pasan a `:126-127`). El campo `:66` va en la misma línea (cambia su texto).
- `repo.ts`: inserciones = borrados (7/7); cambia el texto de `:283`, `:315-317`, `:329`, `:333`, `:339`; ninguna línea se mueve.
- `schema.sql`: +4 líneas AL FINAL (nada se mueve).
- `ticketService.ts`: 14/3; cambian de texto `:6` (import), `:128` (llamada) y `:155` (`user.id ?? null`); +11 líneas al final (`:274-285` aprox.). Las citas a `:126-128` y `:155` conservan número.
- `appHarness.ts`: 2/2 en `:46` y `:49`. `migrate.test.ts`: 15/15, sin mover líneas (cambian títulos y desplazamientos «por el final»).

### Ficheros tocados

Nuevo: `apps/desk/server/controlCalidad.test.ts` (95 líneas). Modificados: `packages/zoho-sync/src/{config.ts,config.test.ts}`, `packages/zoho-sync/src/db/{schema.sql,repo.ts,repo.test.ts,migrate.test.ts}`, `apps/desk/server/services/ticketService.ts`, `apps/desk/server/testing/appHarness.ts`, `apps/desk/server/{permisos,cargoPermiso,transicionesEjecucion}.test.ts`, `tasks.md`, este fichero.

### Medida (antes de estos dos ficheros de documentación)

`git diff --shortstat --no-renames HEAD`: 11 ficheros, 73 inserciones, 36 borrados (109) + 95 líneas nuevas sin trackear = **204**; techo 800.

## Lote 2b — servicio de firma (intento I6) · HECHO

Tareas 2b.1 a 2b.4 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 2b.1 | `Failed to load url ./services/controlCalidad ... Does the file exist?` (módulo inexistente); con un esqueleto que devuelve `null`: `controlCalidad.test.ts` **13 rojos de 32**: 7 × `expected 200 to be 403`, 2 × `expected 200 to be 422`, `expected 422 to be 403` (CC-4), `expected [ Array(1) ] to have a length of 3 but got 1`, `c1: expected 200 to be 422` y `Puntos que fallaron en el diagnóstico revisados: expected { …(4) } to not have property` (S-17). Verdes de entrada, anotados: el Coordinador que aprueba, «Decisional/Compras/Administrativa no cuentan», Coordinador inactivo, administrador de respaldo con motivo, gas sin patrón vigente, CC-3, CC-5 y CC-6 (las guardas anteriores ya contestaban) | — |
| 2b.2 | — | `controlCalidad.test.ts` 33/33 (se añadió la de M14 por HTTP): `services/controlCalidad.ts` (nuevo, 40 líneas), `:131`, `:133`, `:134` en su línea, `exigirFirmaControlCalidad` al final de `ticketService.ts`, `export * from './camposControlCalidad'` al final de `controlCalidad.ts` (shared) |
| 2b.3 | `npx vitest run apps/desk/server packages/shared`: 4 rojos esperados — `permisos.test.ts` (Servicio Técnico sin cargo y administrador sin motivo), `cargoPermiso.test.ts` S21 (3 diferencias en vez de 1), `transicionesEjecucion.test.ts` (el administrador sin motivo da 422) | `appHarness.ts:74` rellena `CLAVE_MOTIVO_FIRMA_ADMIN`; `permisos.test.ts:64` espera 403 en las de firma para el usuario sin cargo; S21 espera TRES diferencias; 69/69 en los tres ficheros |

### Mutaciones (una a una con un script de la sesión: copia, mutación, prueba, restauración y comparación de bytes; `git diff` idéntico al final)

| Mutación | Prueba que la caza | Rojo |
|---|---|---|
| P3 · el 403 de firmante antes del de área (tras el `409` del interruptor) | CC-3 | sí (1) |
| P4 · el 403 de firmante tras el `422` agregado | CC-4 | sí (1) |
| P4b · el 403 de firmante tras `valoresConFechasDerivadas` pero antes del `422` | — | **no cae (33/33): NO observable**, ver abajo |
| P5 · `errCC` fuera del agregado, lanzado aparte tras la persona derivada (`:138-142`) | «los errores van juntos» | sí (1); ver nota |
| P6 · el `409` del interruptor tras el `422` | CC-2 y CC-6 | sí (2) |
| P7 · el `409` de estado tras el `422` | CC-1 y CC-5 | sí (2) (la primera versión de CC-5 llevaba un cuerpo válido y no discriminaba: se corrigió y se repitió) |
| M3 · `intervino` sin `derivadoA` | «M3 · el técnico asignado…» y «el administrador firma de respaldo si el único Coordinador intervino» | sí (2) |
| M4 · `intervino` sin traza | «M4 · quien envió…» y «el administrador que intervino no firma» | sí (2) |
| M14 · quitar `\|\| IDS_FIRMA_CC.has(t.id)` (`decisionales.ts:46`) | «M14 · con Decisionales por cargo encendido el 403 es el de firmante» | sí (1) |
| Mact · usuarios sin `WHERE active = true` | «con el Coordinador inactivo la plaza está vacante…» | sí (1) |
| Msolo · el veredicto consulta también fuera de las de firma | «sólo se consulta para las dos de firma» | sí (1) |
| Mgas0 / Mgas1 · gas nunca / siempre exigido (servicio) | «M15 · con patrón vigente…» y «errores juntos» / siete pruebas | sí (2) / sí (7) |
| Mvia · la vía de firma siempre `null` | M9 y «errores juntos» | sí (2) |
| Mtraza · sin borrar `CLAVES_SOLO_TRAZA_CC` de `custom_fields` | «las claves del acto no se escriben en tickets.custom_fields» | sí (1) |
| Mfirma · `exigirFirmaControlCalidad` no lanza | nueve pruebas (M3, M4, Especialista, Técnico, M8, intervino, sin cargo, M14, CC-4) | sí (9) |
| Mdec · `esFirmaControlCalidad` sólo la aprobación | rechazo sin cargo, M4, rechazo en blanco | sí (3) |

**No observable, y se declara (regla de mutación 1):** (a) P4b: entre la firma y el `422` sólo está `valoresConFechasDerivadas`, que devuelve errores y no lanza, así que su posición relativa a las de firma no cambia ninguna respuesta. (b) La forma literal de P5 del diseño (`errCC` DESPUÉS de la persona derivada, `:138-142`) no puede probarse por HTTP con una persona derivada inválida: `aprobacion_control_calidad` y `rechazo_control_calidad` no declaran el campo de derivación (`transitions.ts:98`), así que `plan.columns[CLAVE_DERIVACION]` nunca existe en ellas. Lo que sí se fija es que `errCC` va DENTRO del agregado (la variante «lanzar `errCC` aparte» cae en «los errores van juntos»). (c) Del `409` del interruptor frente a un `422` de contenido de las de firma: el interruptor sólo quita el envío y `finalizacion_servicio`, que no tienen contenido de firma; se probó frente a un `422` genérico del envío (CC-6). (d) La firma frente a la prioridad, la OVI y la verificación: declarada en el diseño (D6), orden escrito, no probado.

### Códigos de salida

- `npm run typecheck`: 0. `npm run lint`: 0 errores, **165 avisos** (línea base intacta; las pruebas nuevas no usan `as any`: la única conversión es `as unknown as Queryable`).
- Suites (`apps/desk/server`, `packages/shared`, `packages/zoho-sync`): código real al pie.

### Supuestos (reversibles) y desvíos

- **`export * from './camposControlCalidad'`** al final de `packages/shared/src/controlCalidad.ts` (3 líneas): el servidor necesita `CLAVES_SOLO_TRAZA_CC`, `CLAVE_MOTIVO_FIRMA_ADMIN`, etc. y 1a no las reexportó por `index.ts`; así `index.ts` no cambia y no hay colisión de nombres (`tsc -b` en 0).
- **La vía de firma no tiene columna**: RQ-TZ-23 se cumple con `performed_by`/`performed_by_id` (de 2a) y el motivo del administrador en `values`; el diseño no pide una columna `via` y no se añadió.
- **`valoresValidos` rellena el motivo del administrador siempre** (`appHarness.ts:74`): las pruebas que quieren la ausencia lo ponen a `''` explícito.
- **Interpretación de P4**: el diseño dice «tras `valoresConFechasDerivadas`»; como esa posición no es observable (P4b), P4 se ejerció como «tras el `422` agregado», que es la que protege el criterio «el 403 de firmante gana a un 422 de checklist».
- `contextoFirma` hace tres consultas por firma (usuarios activos, `derivado_a`, traza); no se relee tras escribir (eso es 2c).
- El 403 de firmante usa `user.id ?? ''` si el usuario no trae id (no ocurre con sesión real): sin id nadie puede ser «habilitado», sólo el administrador por su vía.

### Citas desplazadas (para el barrido del lote 3)

- `ticketService.ts` (14/5 contra HEAD): ninguna línea se mueve. Cambia el TEXTO de `:6` (import: +`mensajeSinFirma`, `CLAVES_SOLO_TRAZA_CC`, `VeredictoFirma`), `:7` (import del servicio), `:131` (+ `firmaCC` y `exigirFirmaControlCalidad`, tras el comentario de Decisionales), `:133` (+ el `for` que borra `CLAVES_SOLO_TRAZA_CC`) y `:134` (+ `errCC`, en la condición y en el agregado); +9 líneas AL FINAL (`exigirFirmaControlCalidad`). Las citas a `:128`, `:131`, `:133-134` y `:155` conservan número; releerlas por su texto.
- `appHarness.ts`: 2/2 (`:5` import y `:74` misma línea). `controlCalidad.ts` (shared): +3 al final. `permisos.test.ts`: 2/2 (`:5`, `:64`). `cargoPermiso.test.ts`: 2/2 (título y esperado de S21). Nada más se mueve.
- El fichero tiene finales de línea mixtos (CRLF y LF) desde antes del lote; los edité sin tocar ninguno.

### Ficheros tocados

Nuevo: `apps/desk/server/services/controlCalidad.ts` (40 líneas). Modificados: `apps/desk/server/services/ticketService.ts`, `apps/desk/server/testing/appHarness.ts`, `apps/desk/server/controlCalidad.test.ts` (+230), `apps/desk/server/permisos.test.ts`, `apps/desk/server/cargoPermiso.test.ts`, `packages/shared/src/controlCalidad.ts`, `tasks.md`, este fichero. `transicionesEjecucion.test.ts` no necesitó cambios (lo arregló `appHarness.ts:74`).

### Medida (antes de estos dos ficheros de documentación)

`git diff --shortstat --no-renames HEAD`: 6 ficheros, 253 inserciones, 12 borrados (265) + 40 líneas nuevas sin trackear (`services/controlCalidad.ts`) = **305**; techo 800, válvula 720. RQ-TS-48 se quedó en este lote.

### Códigos al cierre del lote 2b

`npx vitest run apps/desk/server packages/shared packages/zoho-sync`: código **0**, 277 ficheros pasan (3 omitidos), 4.853 pruebas pasan (11 omitidas). `npm run typecheck`: 0. `npm run lint`: 0 errores, 165 avisos.

## Lote 2c — prioridad, aviso y ruta (intento I7) · HECHO

Tareas 2c.1 a 2c.3 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 2c.1 | `controlCalidad.test.ts` (tercera parte, 13 pruebas): 6 rojos de 46 — `r1: expected 'Medium' to be 'High'`, `expected 'Low' to be 'High'`, `expected 'Medium' to be 'High'` (sin permiso de prioridad), `expected [] to deeply equal [ Array(1) ]` (aviso ausente), `expected 404 to be 200` (ruta), y `expected 200 to be 403` en «sólo el envío avisa» (error mío de la prueba: el administrador de respaldo SÍ puede rechazar; se corrigió el esperado a 200, no el código). Verdes de entrada, anotados: aprobado lleva a `Por Facturar`, Urgent no se rebaja, aprobación no toca prioridad, retrabajo contable (traza real: envío, rechazo, envío, rechazo, envío, aprobación = 2), Director Técnico sin aviso, sin aviso con firmante libre, S-18 | — |
| 2c.2 | — | 46/46: `prioCC` en `ticketService.ts:133` (misma línea), `avisarSinFirmanteLibre` en `:155` (misma línea), `avisarSinFirmanteLibre` al final de `services/controlCalidad.ts`, `destinatariosAdministradores` al final de `db/avisos.ts`, `routes/permisosControlCalidad.ts` (nuevo, 18 líneas) registrado en `app.ts:22`/`:61` |

### Mutaciones (una a una, `mut.mjs` de la sesión: copia, mutación, prueba, restauración y comparación de bytes; ninguna en paralelo)

| Mutación | Prueba que la caza | Rojo |
|---|---|---|
| M11a · sin `prioCC` (rechazo no sube) | «el rechazo sube la prioridad…», «desde Low…», «sin permiso de prioridad…» | sí (3) |
| `prioridadTrasRechazo` baja `Urgent` | «Urgent no se rebaja al rechazar» | sí (1) |
| `plan.priority = undefined` | las mismas tres de M11a | sí (3) |
| Aprobado no lleva a Por Facturar (`transitions.ts:262` `to: 'Por Entregar'`) | «aprobado lleva a Por Facturar…», «el Coordinador… aprueba», «el retrabajo queda en la traza…» | sí (3) |
| Retrabajo no contable (`contarRetrabajos` devuelve 0) | «el retrabajo queda en la traza y contarRetrabajos lo cuenta» | sí (1) |
| Aviso no sale (sin la llamada) | «M10 · sin firmante libre: avisan…» | sí (1) |
| Aviso sale con firmante libre | «con un habilitado libre… no se avisa» | sí (1) |
| M10 · aviso al Director Técnico (consulta `cargo_permiso = 'Director Técnico'`) | «M10 · sin firmante libre…» y «no va a nadie por ser Director Técnico» | sí (2) |
| S-12 · el actor se avisa a sí mismo | las dos anteriores | sí (2) |
| Aviso a administrador inactivo | «M10 · sin firmante libre…» | sí (1) |
| Ruta siempre `activo: true` | «devuelve { activo }…» | sí (1) |

**Declarado:** la primera pasada de «ruta siempre true» cambió el comentario del fichero (primera coincidencia) y no cayó; se repitió sobre `activo: config…` y cae. La primera forma de M10 (`destinatariosDeCargoPermiso` sin importar) también daba rojo, pero por un `ReferenceError` tragado por el `try/catch`; se repitió como mutación de la consulta.

### Códigos de salida

`npm run typecheck`: 0. `npm run lint`: 0 errores, **165 avisos** (línea base intacta; sin `as any` nuevos). `npx vitest run apps/desk/server packages/shared packages/zoho-sync`: código **0**, 277 ficheros pasan (3 omitidos), 4.866 pruebas pasan (11 omitidas).

### Supuestos (reversibles)

- El aviso lo escribe `avisarSinFirmanteLibre` con `crearAviso` (sólo bandeja, sin correo, S-13); no pasa por `porCorreo`/`dispararAvisos`.
- Texto literal del delta RQ-AV-24 con `ticket_id`.
- El rechazo por un administrador de respaldo no exige motivo de administrador (`erroresContenidoControlCalidad` solo lo pide en la aprobación).

### Citas desplazadas (para el barrido del lote 3)

Ninguna línea se mueve. `ticketService.ts` 4/4: cambia el TEXTO de `:6` (+`prioridadTrasRechazo`), `:7` (+`avisarSinFirmanteLibre`), `:133` (+`prioCC`) y `:155` (+la llamada). `app.ts` 2/2 en `:22` y `:61`. `db/avisos.ts` +12 al final; `services/controlCalidad.ts` +18 al final (más un import en `:2` y dos en `:7-8`... los imports de `services/controlCalidad.ts` suben de 8 a 10 líneas: **el fichero es nuevo de 2b y sin citas aún**).

### Ficheros tocados

Nuevo: `apps/desk/server/routes/permisosControlCalidad.ts`. Modificados: `apps/desk/server/{app.ts,controlCalidad.test.ts,db/avisos.ts,services/controlCalidad.ts,services/ticketService.ts}`, `tasks.md`, este fichero.

### Medida

`git diff --shortstat --no-renames HEAD`: 5 ficheros, 159 inserciones, 8 borrados (167) + 18 líneas nuevas sin trackear = **185**; techo 800, válvula 720.
