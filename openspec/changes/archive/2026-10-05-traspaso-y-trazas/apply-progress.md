# Progreso de apply — traspaso-y-trazas (F1B-05, `cierra: no`)

Modo: Strict TDD. Partida del lote 1: `540f31c`. Intento abierto por el orquestador; el apply no lo asienta ni commitea.

## Lote 1 — hecho (1.1 a 1.32 y 1.34; 1.33 a falta del detector de citas, que corre el orquestador tras el commit)

### Rojos observados (antes del verde)
| Tarea | Rojo literal |
|---|---|
| 1.3 | Con la prueba sin editar y `proposal.md` presente: `expected [ 'F0-04', 'F1B-03', 'F1B-04', …(7) ] to deeply equal [ …(6) ]`. Tras editarla (DIEZ, `'F1B-05'`) queda verde: la cabecera ya cuenta |
| 1.4 | `ALTER TABLE en schema.sql: expected 55 to be 59` |
| 1.5-1.7, 1.9 | `column "restaurada_at" does not exist` (cinco de seis; la sexta, listado y panel tras restaurar, ya era verde: guarda de regresión) |
| 1.8, 1.9 | `Cannot find module './remisionRestaurada'` |
| 1.10, 1.11 | `expected [ [ null, 'Ticket eliminado' ], …(1) ] to deeply equal [ Array(2) ]` y `expected { ticket_id: 'app-1', …(10) } to match object { liberada_por: 'Beto', …(1) }` |
| 1.12-1.14 | `Cannot find module './testing/escritoresTransiciones'` |

### Hallazgos del apply
- **Una segunda prueba de `migrate.test.ts` cuenta las sentencias tras `idx_prioridad_ajustes`** (`'las seis sentencias nuevas van DETRÁS de prioridad_ajustes…'`, línea 648): cayó con `expected 154 to be 150`. El diseño (§4, §9) sólo nombraba los recuentos de `:376-377`. Se editó EN SITIO (`+ 2 + 2` pasa a `+ 2 + 2 + 4` y el texto del mensaje, línea 652), sin mover líneas. Verde.
- **pg-mem acepta el `UPDATE` de un solo paso** de `design.md` §5: no hizo falta el respaldo de dos sentencias con `enTransaccion`.
- **Sin nombre en la sesión:** `users.name` es `NOT NULL`, así que no se puede sembrar un usuario sin nombre. La prueba envuelve la base para que la consulta de sesión devuelva `name: null` y ejercita el respaldo `TRANSITION_ACTOR` de la ruta.
- El mensaje del título de `migrate.test.ts:374` también pasó a 59/33/28 de public (misma línea).

### Mutaciones (aplicadas, revertidas y comprobado con `git diff` que no queda ninguna)
| # | Mutación | Resultado |
|---|---|---|
| M1 | Quitar del `SET` las dos asignaciones de copia | Rojo, 4 pruebas: «anular y restaurar por la ruta deja las cuatro columnas…» → `expected null to be 'Admin'`; también «sin nombre…», «anulada, restaurada y anulada de nuevo…» y «un segundo ciclo pisa el primero…» |
| M2 | Vaciado delante de la copia en el `SET` | **Verde (6/6): mutación equivalente.** pg-mem evalúa el lado derecho sobre la fila vieja, como PostgreSQL. No es prueba que falte. No se forzó |
| M3 | Quitar `AND anulada_at IS NOT NULL` | Rojo: «restaurar una remisión vigente responde 200 y no escribe nada» → `expected 2026-10-05T16:30:40.603Z to be null` |
| M4 | `null` en vez del respaldo en la ruta | `npm run typecheck`: `remision.ts(344,37): error TS2345: Argument of type 'string \| null' is not assignable to parameter of type 'string'`. Con `as never`: rojo «sin nombre en la sesión se escribe TRANSITION_ACTOR y no NULL» → `expected null to be 'Equipo Técnico'` |
| M5 | Quitar `liberada_por = $3` (y el parámetro) | Rojo, 2: «dos vigentes quedan con `liberada_por`…» (`ovAsociaciones.test.ts`) y «con dos vigentes y una liberada por otra persona…» (`eliminarTicket.test.ts`) |
| M6a | Quitar `performed_by` del escritor real (`migracionTicketsAbiertos.ts:79`) | Rojo: `Escritor de ticket_transitions que no nombra performed_by en: apps/desk/server/db/migracionTicketsAbiertos.ts` |
| M6b | Quitar `performed_by` del `.sql` real de `docs/sdd/` (línea 46, en copia restaurada) | Rojo: «el inventario es exactamente uno, y nombra `performed_by`» → `…no nombra performed_by en: docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` |
| M7 | Quitar `public.` a `restaurada_por` en `schema.sql` | Rojo, 3 en `migrate.test.ts`: «toda ALTER TABLE apunta a una tabla clasificada…» (`expected [ 'remisiones' ] to deeply equal []`), «las ALTER sin calificar son exactamente las de DESK_TABLES…» y el recuento (`expected 32 to be 33`) |

### Barrido de citas (regla de mutación 4, tarea 1.32)
Método: `git grep -noE` con la ruta completa de las siete formas de `.ts` y de `schema.sql`, sin `openspec/changes/archive/` ni este cambio (376 y 294 citas), cruzadas por script con las líneas editadas; segundo pase de la forma abreviada (`:NN`) en los ficheros que ya citan cada módulo.
- **Desplazamiento: cero, confirmado.** `wc -l` idéntico a 1.1 en `remisiones.ts` (240), `routes/remision.ts` (397), `historial.ts` (162), `ovAsociaciones.ts` (184), `eliminarTicket.ts` (189), `routes/tickets.ts` (223) y `migrate.test.ts` (765). `schema.sql` pasa de 718 a 724 sólo por el final; ninguna cita apunta más allá de la 718 salvo las ya existentes hasta `:718`.
- **Citas cuyo texto cambió:** `eliminarTicket.ts:154` ×4 (`Paquete_de_Despliegue_2026-09-29.md:454`, `:728`; `…-09-30.md:632`; `…-10-01.md:853`): la llamada ahora lleva actor — **caso B**, paquetes fechados, no se tocan. `migrate.test.ts:374-376` ×1 (`Paquete_de_Despliegue_2026-10-04b.md:474`): recuentos 55/29 hoy 59/33 — **caso B**, no se toca.
- **Caso A, siguen ciertas:** `openspec/specs/trazas/spec.md:141` (`historial.ts:131-161`) y `:471` (`historial.ts:66-121`, tres eventos de remisión: lo sigue siendo la función).
- **Abreviadas:** ninguna apunta a las líneas editadas. `openspec/specs/remisiones/spec.md:277` ya trae su revisión (`a0a2935`, caso B). El resto de coincidencias de `:NN` son de otros ficheros (ruido del segundo pase, leído una a una). `registro.test.ts` no tiene citas.
- Ninguna cita de `ovAsociaciones.ts` apunta a `:132` o posterior, como afirmaba el diseño §9.

### Cierre (códigos de salida literales)
- `npm test`: **exit 0** — 214 ficheros pasan, 2 saltados; 3325 pruebas pasan, 7 saltadas.
- `npm run typecheck`: **exit 0**.
- `npm run lint -- --max-warnings 165`: **exit 0** — 0 errores, 165 avisos (no suben).
- Detector de citas tras el commit: lo corre el orquestador.

### Medida (1.34), sin commitear, partida `540f31c`
`git diff --shortstat --no-renames 540f31c`: 12 ficheros, 130 inserciones y 62 borrados (192); más `wc -l` de lo nuevo sin trackear: 436 (cinco ficheros de código y prueba, 383, y este fichero, 53). **Total 628** (techo 800, objetivo 720). Ficheros binarios: ninguno.

## Lote 2 — hecho (2.1 a 2.29; 2.28 a falta del detector de citas, que corre el orquestador tras el commit)

Partida del lote 2: `4d88bd8`. Intento abierto por el orquestador; el apply no lo asienta ni commitea. Medidas previas (2.1): `historial.ts` 162 líneas, `ENTRADA.md` 2100, `F0-01_Correcciones_para_el_maestro.md` 1367.

### Hipótesis de `design.md` §7 (2.3), ejecutada
`areasSiguientes('Ingresado', catalogoDelTicket(...))` = `['Servicio Técnico']`: **se cumple**, «Ingresado» tiene área siguiente. Por eso se ponen rojas las pruebas existentes de 2.11-2.14. Además: `OV asignada` → `['Comercial']`, `Finalizado` → `[]`. Para la prueba de «Equipo nuevo» se buscó un estado donde los dos catálogos difieran: `Verificación` da `['Servicio Técnico']` con `TRANSITIONS_EQUIPO_NUEVO` y `[]` con `TRANSITIONS`.

### Rojos observados
| Tarea | Rojo literal |
|---|---|
| 2.4-2.10 | `Error: Cannot find module './traspaso' imported from '…/apps/desk/server/db/traspaso.test.ts'` (el módulo no existía; las pruebas del fichero no llegan a correr) |
| 2.11 (`historial.test.ts:23-26`) | `expected [ …(3) ] to deeply equal [ …(2) ]` |
| 2.12 (`historial.test.ts:69`) | `expected [ Array(3) ] to deep equally contain { label: 'Estado', …(1) }` (`eventos[0]` pasa a ser el traspaso) |
| 2.13 (`historial.test.ts:189`) | `expected [ …(3) ] to deeply equal [ 'Transición: Habilitar', …(1) ]` |
| 2.14 (`tickets.test.ts:118`) | `expected { eventName: 'AppTraspaso', …(4) } to match object { title: 'Transición: Habilitar' }` |
| 2.14 (`tickets.test.ts:133-136`) | `expected [ 'Remisión de entrada creada', …(3) ] to deeply equal [ 'Remisión de entrada creada', …(2) ]` |

Orden real: el rojo de las cinco pruebas existentes sólo existe una vez escrito el código (`traspaso.ts` y `historial.ts`), así que se ejecutaron DESPUÉS de 2.15-2.16 y ANTES de editarlas (sin ese código no hay nada que las ponga rojas); antes de tocar producción estaban verdes (57/57). `migracionMarcadorLectores.test.ts:62-71` sigue verde **sin editarse**; `historial.test.ts:161-176` (la cadena de derivaciones, filtra por «Derivado a») también, por D-16. Las pruebas del propio `traspaso.test.ts` salieron verdes a la primera tras escribir el módulo (20/20).

### Pruebas existentes actualizadas (en sitio, sin cambiar su número de líneas)
`historial.test.ts`: `:24` y `:189` ganan `'Traspaso: Admin → Servicio Técnico'` encima de su transición; `:68-71` busca la transición por título (`find`) y no por `eventos[0]`. `tickets.test.ts`: `:118` pasa a comparar los dos títulos y `:135` gana el traspaso.
### Mutaciones (aplicadas, revertidas, y comprobado que no queda ninguna)
| # | Mutación | Resultado |
|---|---|---|
| M1 | Quitar la exclusión del marcador (`traspaso.ts`) | Rojo, 2: «marcador con destino relleno y área siguiente: ninguna» → `expected [ { eventName: 'AppTraspaso', …(4) } ] to deeply equal []`, y «el marcador de F1F-01 no da traspaso…» → `expected [ Array(3) ] to deeply equal [ 'AppTransition', 'AppTransition' ]` |
| M2 | Posición: exclusión del marcador detrás del cálculo del destino y por destino vacío (`!destino \|\| (marcador && to_status == null)`) | Rojo, las mismas 2 que M1. **Nota:** el diseño decía «mover y devolver por destino vacío»; mover la comprobación por identificador detrás del destino, sin cambiar su criterio, queda **verde** (mutación equivalente, la comprobé primero por error), así que la que discrimina es la que cambia el criterio |
| M3 | Posición: emisión `[transición, traspaso]` (`historial.ts`) | Rojo, 2: «con la misma hora, el traspaso queda en el índice anterior al de su transición (D-13)» → `expected [ …(2) ] to deeply equal [ …(2) ]` y «resuelve el nombre de la persona derivada…» |
| M4 | `areasSiguientes` sustituida por la lista fija `['Servicio Técnico']` | Rojo, 3: «varias áreas se unen…» (`expected 'Traspaso: Luz → Servicio Técnico' to be 'Traspaso: Luz → Comercial'`), «estado terminal sin persona…» y **«“Equipo nuevo” usa su catálogo y no TRANSITIONS»** → `expected [ { eventName: 'AppTraspaso', …(4) } ] to deeply equal []`. Cae el caso nombrado y dos más |
| M5 | Regla 2: consulta a `prioridad_ajustes` en el compositor (`historial.ts`) | Rojo, 1: «historial.ts, ticketFuentes.ts, remisionRestaurada.ts y traspaso.ts no nombran esos registros» → `historial.ts nombra prioridad_ajustes: expected '…' not to contain 'prioridad_ajustes'`. La prueba de eventos NO cae (la consulta no emitía nada): lo que caza una consulta es la de texto; lo que caza un evento es la otra. Cada una vigila una cosa |

Tras cada mutación se restauró desde una copia y se comprobó con `diff` que `traspaso.ts` e `historial.ts` quedaban idénticos; `git diff` de `historial.ts` sólo muestra los cuatro cambios del verde (consulta con `transition_id`, `flatMap`, y el `import` unido con `;` de la línea 3). `historial.ts` conserva 162 líneas.

### Ejemplo literal de la línea (formato real, sin tocar `HistoryEvent`)
Con persona (Ana deriva a Beto, etapa «Habilitar Servicio»):
`title: "Traspaso: Ana → Beto"`, `details: [{ label: "De", value: "Ana" }, { label: "A", value: "Beto" }, { label: "Por la etapa", value: "Habilitar Servicio" }]`.
Con área (Luz ejecuta una transición que deja el ticket en «Ingresado», sin `derivado_a`):
`title: "Traspaso: Luz → Servicio Técnico"`, `details: [{ label: "De", value: "Luz" }, { label: "A", value: "Servicio Técnico" }, { label: "Por la etapa", value: "Habilitar Servicio" }]`. Varias áreas se unen con coma. `eventName: "AppTraspaso"`, `time` = el de la transición.

### Bloque documental
- 2.24 `docs/sdd/ENTRADA.md`: E-219 (actor que no es persona), E-220 (protocolo sin aprobar) y E-221 (excepciones de traza y límite de S-2/S-3) al final, tras E-218 (comprobado que era la última), dueño Gerencia, destino punto abierto (R-3). El hallazgo del lote 1 (el diseño omitía la prueba de `migrate.test.ts` que cuenta las sentencias tras `idx_prioridad_ajustes`, ajustada en sitio) **no va a la bandeja**: ya está resuelto y no tiene destino que decidir; queda como nota de este fichero (lote 1, «Hallazgos») y como lección de diseño: al añadir sentencias a `schema.sql`, buscar TODOS los recuentos de `migrate.test.ts`, no sólo el de `:376-377`.
- 2.25 `docs/sdd/F0-01_Correcciones_para_el_maestro.md`: corrección 26 al final, tras la 25; citas contra el maestro verificadas por `grep -n`: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062` (fila, estado y recomendación «sin empezar»), `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2029-2033` (registro del traspaso), `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2085` (actor de respaldo).
- Ambos ficheros usan fin de línea CRLF; lo añadido también.

### 2.26 (a) Casilla de la regla de mutación 3
El cambio **no añade decisiones de cliente ni toca `apps/desk/src`** (ningún `.tsx`; la forma de `HistoryEvent` no cambia y el panel pinta hora, título y detalles). Decisión del cliente ↔ línea del servidor (de `proposal.md`):

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Con quién abre «Derivado a» | Ninguna: es una propuesta, no una guarda; el servidor sólo comprueba que la persona existe y está activa (`apps/desk/server/services/ticketService.ts:138-142`). Se declara y no se cambia |
| Qué personas ofrece el desplegable | `apps/desk/server/services/ticketService.ts:138-142` |
| La casilla comercial no es obligatoria | Catálogo compartido (`packages/shared/src/transitions.ts:189`), probado en `apps/desk/server/transitionExec.test.ts:101-111` |
| Anular y restaurar sólo para administradores | `apps/desk/server/routes/remision.ts:329`, `apps/desk/server/routes/remision.ts:341` |

### 2.26 (b) Nota para el paquete de despliegue
Cuatro columnas anulables en `public.remisiones` (`restaurada_at`, `restaurada_por`, `anulacion_previa_at`, `anulacion_previa_por`), aplicadas por `migrate` al arrancar, idempotentes. **Sin variables de entorno, sin flag y sin relleno.** Tras el arranque, comprobar que las cuatro columnas existen (S-3). Las restauraciones y liberaciones anteriores al despliegue siguen sin rastro. Reversión: revertir la rama; las columnas quedan sin uso.

### 2.26 (c) Línea de cobertura para el `archive-report.md` (R-1)
`traspaso-y-trazas` cubre de F1B-05 las **trazas que faltaban** (restauración de remisión con rastro, actor en la liberación por borrado, barrido de escritores de `ticket_transitions`) y la **línea de traspaso derivada al leer** del historial; deja fuera la **visibilidad por área** (E-089) y el **protocolo de traspaso sin aprobar** (reasignación con motivo, aviso personal, propietario del registro; E-220), y por eso `cierra: no`.

### Barrido de citas (regla de mutación 4, tarea 2.27)
Método: `git grep -noE "historial\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio, sin `openspec/changes/archive/` ni este cambio, 15 citas; segundo pase de la forma abreviada en `openspec/specs/trazas/spec.md` (único fichero que las usa para este módulo) y barrido de lo añadido a `ENTRADA.md` y a las correcciones, leído contra el fichero.
- **Desplazamiento: cero, confirmado.** `historial.ts` mide 162 líneas, igual que en 2.1. El diseño (§9) acierta.
- **Líneas cuyo texto cambió** (`:3` import, `:137` consulta, `:142-143` composición): sólo se cita `:137`, en `migracionMarcadorLectores.test.ts:62` («lo enseñan como «Transición»»): sigue siendo la consulta de `ticket_transitions`. **Caso A, cierta.** La spec `trazas` cita `:136-144` (fuente de transiciones) y `:141` (`nombresDerivados`, sin cambio): ciertas.
- **El resto** (`:157` unión, `:126-132`, `:131-161`, `:146-148`, `:27-31`, `:18-23`, `:66-121`, `:5-8`, `:44`, `:79`): líneas sin tocar, afirmación comprobada línea a línea. Caso A.
- **Textos añadidos:** E-219 a E-221 citan `transitionActor.ts:3`, `remision.ts:344`, `tickets.ts:91` y las líneas `:2035`, `:2037`, `:2085` del maestro; la corrección 26, `:2060-2062`, `:2029-2033` y `:2085`. Todas verificadas contra el fichero.

### Cierre (códigos de salida literales)
- `npm test`: **exit 0** — 215 ficheros pasan, 2 saltados; 3345 pruebas pasan, 7 saltadas (lote 1: 3325; +20 de `traspaso.test.ts`).
- `npm run typecheck`: **exit 0**.
- `npm run lint -- --max-warnings 165`: **exit 0** — 0 errores, 165 avisos (no suben).
- Detector de citas tras el commit: lo corre el orquestador.

### Medida (2.29), sin commitear, partida `4d88bd8`
`git diff --shortstat --no-renames 4d88bd8`: 7 ficheros, 157 inserciones y 43 borrados (200); más `wc -l` de lo nuevo sin trackear: 221 (`traspaso.ts` 46, `traspaso.test.ts` 175). **Total 421** (techo 800, objetivo 720), medido con este fichero ya escrito; la cifra cambia en pocas líneas al añadir esta. Ficheros binarios: ninguno.
