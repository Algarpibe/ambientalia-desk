# Tareas — Herramienta de migración de los tickets abiertos de Zoho Desk

Cambio `migracion-tickets-abiertos` (`tanda: F1F-01`, `cierra: no`). **Donde la spec y el diseño discrepan, manda el
diseño** (tarea 1.1). Tres lotes, como el diseño (D-15); la propuesta decía dos y queda superada en eso. Cada lote es un
intento del registro (techo 800, objetivo 720), con sus rojos, su código, sus mutaciones y su cierre, y deja el árbol
en verde por sí solo. Orden: lote 1, lote 2, lote 3. El orden de pruebas es **rojo antes que verde**: ninguna
tarea de producción precede a la de su prueba. Las mutaciones las reproduce el orquestador; el apply las ejecuta,
anota el mensaje literal y revierte.

## Review Workload Forecast

| Lote | Contenido | Producción | Pruebas (×1,8) | Documental y casillas | Estimado | Riesgo frente a 800 |
|---|---|---|---|---|---|---|
| 1 | Alinear deltas, núcleo puro, línea de `index.ts` | ~126 | ~220 | ~90 (deltas ~70, `apply-progress.md` ~20) | ~440 | Bajo |
| 2 | Barrido de lectores, ejecutor, ruta, sus pruebas | ~176 | ~390 | ~70 (`apply-progress.md` ~45, casillas ~25) | ~640 | Medio, bajo 720 |
| 3 | Procedimiento `.sql`, su guardián, bloque documental | ~85 | ~100 | ~110 (bloque ~70, casillas ~40) | ~295 | Bajo |

Total ~1.375 líneas en tres intentos. Hipótesis: son estimaciones. Si el barrido de lectores del lote 2 obliga a más
pruebas de las previstas y la medida pasa de 720, **se parte o se para y se consulta**; no se aprieta.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High

*Motivo de «High» y de «No»:* el total supera 400 líneas, pero la unidad no es el PR sino el intento del registro en su
worktree, fusionado a `main` al cerrar (regla del ciclo 3). Los supuestos de esta fase (tarea 1.1, ítems d y n) son
razonables y reversibles y no cambian el alcance de la fila.

### Unidades de trabajo

| Unidad | Meta | Prueba enfocada | Harness real | Frontera de reversión |
|---|---|---|---|---|
| 1 | Núcleo puro (RQ-TC-40, RQ-TC-41) y deltas alineados | `npx vitest run packages/shared/src/migracionTickets.test.ts` | Ninguno: función pura | `git revert` del lote; sin esquema |
| 2 | Ejecutor y ruta (RQ-ZS-17) y barrido de lectores | `npx vitest run apps/desk/server/db/migracionTicketsAbiertos.test.ts apps/desk/server/migracionTicketsAbiertosRuta.test.ts apps/desk/server/migracionMarcadorLectores.test.ts` | pg-mem con espía de SQL; sin servicios reales | `git revert`; la ruta y el ejecutor salen juntos |
| 3 | Procedimiento y reversión (RQ-ZS-18) | `npx vitest run apps/desk/server/db/migracionTicketsF1F01.test.ts` | pg-mem ejecutando el texto del `.sql` | `git revert`; sólo documento y prueba |

---

# LOTE 1 — Deltas alineados y núcleo puro (≈ 440)

Archivos: `specs/tickets-core/spec.md`, `specs/zoho-sync/spec.md` (edición), `packages/shared/src/migracionTickets.ts` y
su prueba (nuevos), `packages/shared/src/index.ts` (+1 línea).

- [x] 1.1 **Alinear los deltas con el diseño** (documental; antes de editar, anotar `git rev-parse HEAD` como partida del
  lote 1 y comprobar que el intento está abierto en este worktree). Ediciones, una por una:
  - a. `tickets-core` RQ-TC-40 regla 1 contradice la regla 3: `Pendiente` **está** en `ESTADOS`. Escribir que «Pendiente» y
    «Entregado» se deciden **antes** que la identidad.
  - b. RQ-TC-40: añadir los cuatro nombres de regla (`identidad`, `entregado-a-finalizado`,
    `pendiente-servicio-a-en-proceso`, `pendiente-soporte-se-conserva`) y que el resultado lleva `statusTypeDestino`
    (`null` = no se cambia).
  - c. RQ-TC-40 regla 3 y RQ-TC-41 («Qué se cambia»): el `status_type` destino de «Pendiente» de servicio es `'Open'`
    (D-10), no el previo; quitar la «Hipótesis» sobre el `status_type` de un `Pendiente`.
  - d. RQ-TC-41: la función ya no recibe la vigencia de remisión; el plan es `planDeTicket(t, corte)` por ticket más
    `resumenDeMigracion`, y la vigencia la decide el ejecutor con `vigenciaDeRemisiones` y `motivoSinRemisionVigente`;
    el núcleo sólo aporta `esperaRemisionDeEntrada`. Rechazar un `corte` ausente o sin forma de fecha pasa a la ruta
    (`400`, D-11); el núcleo recibe un `Date` y, como **supuesto reversible no escrito en el diseño**, lanza
    `RangeError` si es inválido (sin él, una fecha inválida volvería todo «migrar»).
  - e. RQ-TC-41: precedencia fija ya-gobernado → tras-el-corte → sin-equivalencia → migrar (D-8). La viñeta «Sin
    equivalencia … su sola presencia marca bloqueado» se limita a los que se migrarían; ya está en el escenario
    «no bloquea».
  - f. RQ-TC-41: el informe lista `pendientes` por ticket (número, clasificación, destino), no clasificaciones
    distintas; `yaGobernados` son dos recuentos (`nacidosEnLaApp`, `deZoho`), no una lista con números; `sinEquivalencia`
    va agrupado por estado con recuento y números; `porEstado` lleva `cambiaEstado`. Reescribir el escenario «Totales y
    clasificaciones».
  - g. `zoho-sync` RQ-ZS-17, `UPDATE`: **quitar `modified_time = now()`**; `modified_time` no se toca y `updated_at = now()`
    sí (D-5); `source` se queda como está (D-4); `status_type` sólo cuando D-10 lo cambia. Añadir escenario «`modified_time`
    y `source` intactos».
  - h. RQ-ZS-17, marcador: `to_status` es `NULL` en las reglas de identidad y el destino va en `"values"` (D-6); en las
    dos reglas que cambian el estado, `to_status` es el destino. Listar las claves de `"values"` (`estado_previo`,
    `estado_destino`, `status_type_previo`, `managed_by_app_previo`, `regla`, `corte`, `ejecutado_por`) y `area`,
    `performed_by`, `transition_name`. Añadir escenario «el marcador de identidad no mueve `entradasActuales`».
  - i. RQ-ZS-17, `aplicar`: ausente o `false` → seco, `true` → aplica, **cualquier otro valor → `400`** (D-12). Reescribir el
    escenario «`aplicar` distinto de `true` también es seco».
  - j. RQ-ZS-17, `corte`: instante ISO con desfase; una fecha pelada es `400` (D-11). Añadir escenario.
  - k. RQ-ZS-17, negativa: `409` con el informe completo; en seco, `200` con `negativa` rellena (D-13). El informe lleva
    `negativa`, `aplicar`, `aplicado` (no «modo seco/aplicado»), `numeracion` (`masAltoAMarcar`, `base`, `arrastra`, D-7) y
    `avisos`. Añadir escenarios de `numeracion.arrastra` a un lado y otro de 10000.
  - l. RQ-ZS-17, transacción: en seco no se abre transacción (D-2); al aplicar la lectura va dentro (D-1); el `UPDATE`
    lleva `WHERE managed_by_app = false` con `RETURNING id` y, si no devuelve fila, se deshace todo (D-3). Añadir
    escenario.
  - m. RQ-ZS-18: el procedimiento es `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, reversión prefijada `-- REV `,
    una sentencia por regla que cambia el estado **más una para las filas de identidad** (restaura sólo
    `managed_by_app`); filtro por `"values"->>'status_type_previo'` (D-14). El diseño §8 sólo nombra las reglas que cambian
    el estado: la de identidad es un **hueco del diseño** que se cierra aquí, porque sin ella los marcadores de
    identidad no se borrarían.
  - n. RQ-ZS-17: mantener lo que el diseño no contradice —el informe va también al log (como `apps/desk/server/routes/admin.ts:88-92`)—
    y anotar que la línea «en `avisos`» de D-7 se lee como el campo `avisos` del informe, no como la tabla `avisos`
    (**hipótesis**; no hay tabla nueva).
  - o. Escribir en `apply-progress.md` la lista de estas ediciones (una línea cada una) y las dos referencias cruzadas del
    diseño que no cuadran (D-15 y el encargo hablan de «§7» y «§6», que son §9 y §8).
- [x] 1.2 Leer los moldes: `packages/shared/src/estados.ts:112`, `packages/shared/src/flujos.ts:116-119`,
  `packages/shared/src/transitions.ts:124`, `packages/shared/src/transitions.ts:142-143`; medir `wc -l` de
  `packages/shared/src/index.ts` (35 líneas con contenido).

**Rojo** (`packages/shared/src/migracionTickets.test.ts`, nuevo)
- [x] 1.3 RQ-TC-40: los 23 de `ESTADOS` salvo «Pendiente» dan identidad con `statusTypeDestino` nulo; «Entregado» no está
  en `ESTADOS` y va a «Finalizado» con `'Closed'`; «Pendiente» con clasificación «Reparación», `null` y vacía va a «En
  Proceso» con `'Open'`; con «Soporte remoto» y «soporte REMOTO» se conserva; con «Soporte remoto urgente» va a «En
  Proceso»; «En revisión externa», `entregado` y `Entregado ` dan `null`; el módulo no importa base, red, ficheros ni
  reloj (lectura de su fuente).
- [x] 1.4 RQ-TC-41, `planDeTicket`: precedencia con casos solapados (gobernado y sin equivalencia → `ya-gobernado`; tras el
  corte y sin equivalencia → `tras-el-corte`); `createdTime` igual al corte → `migrar`; `createdTime` nulo → `migrar`;
  `On Hold` migra; la lista de entrada no se muta (objetos congelados); `corte` inválido lanza `RangeError`.
- [x] 1.5 RQ-TC-41, `resumenDeMigracion` y `esperaRemisionDeEntrada`: cuenta por pareja y lista; `sinEquivalencia` agrupado;
  `yaGobernados` partido por `PREFIJO_TICKET_APP`; `trasElCorte`; `pendientes` por ticket; `masAltoAMarcar` sólo sobre los
  que migran (4100 y 4300 con 9000 gobernado y 9500 posterior → 4300) y `null` si ninguno; sin equivalencia gobernado o
  posterior al corte no bloquea; «OV asignada» y «Ticket creado» esperan remisión, «En Proceso» no.
- [x] 1.6 **EJECUTAR** el fichero y anotar el fallo literal en `apply-progress.md` (el módulo no existe).

**Verde**
- [x] 1.7 Crear `packages/shared/src/migracionTickets.ts`: constantes `ID_TRANSICION_MIGRACION`, `NOMBRE_TRANSICION_MIGRACION`,
  `ACTOR_MIGRACION`, tipos de §4 del diseño y `equivalenciaDeEstado` (Pendiente y Entregado antes que la identidad; consume
  `ESTADOS` y `esClasificacionSoporteRemoto`).
- [x] 1.8 En el mismo fichero: `planDeTicket` con la precedencia fija y `esperaRemisionDeEntrada` (con `STATUS_OV_ASIGNADA` y
  `STATUS_TICKET_CREADO`).
- [x] 1.9 En el mismo fichero: `ResumenMigracion` y `resumenDeMigracion` (sin `numeracion.arrastra` ni `base`: viven en el
  ejecutor, porque `APP_TICKET_NUMBER_BASE` es de `zoho-sync`).
- [x] 1.10 Añadir `export * from './migracionTickets'` como línea nueva tras `packages/shared/src/index.ts:35`.
- [x] 1.11 **EJECUTAR** el fichero de pruebas: todo verde.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] 1.12 **M1 (regla 1, posición):** en `equivalenciaDeEstado`, la identidad antes que «Pendiente». Debe caer «Pendiente de
  servicio va a En Proceso».
- [x] 1.13 **M2 (regla 1):** en `planDeTicket`, `sin-equivalencia` antes que `tras-el-corte`. Debe caer la precedencia
  «tras el corte y sin equivalencia».
- [x] 1.14 **M3 (idempotencia, núcleo):** quitar la rama `ya-gobernado`. Debe caer la precedencia «gobernado y sin
  equivalencia».
- [x] 1.15 **M4:** `masAltoAMarcar` sobre todos los planes. Debe caer «sólo sobre los que migran».
- [x] 1.16 **M5:** `>` por `>=` en la comparación con el corte. Debe caer «corte en el instante exacto».
- [x] 1.17 `git diff` de `migracionTickets.ts` y `index.ts`: no queda ninguna mutación; `index.ts` con una inserción y cero
  borrados.
- [x] 1.18 Escribir en `apply-progress.md` la regla 13 del lote: tabla y plan viven en `packages/shared`, consumen `ESTADOS`;
  el cliente no participa.
- [x] 1.19 **CIERRE LOTE 1:** `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y
  `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; anotar el CÓDIGO DE SALIDA de cada uno.
- [x] 1.20 Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; registrarla.
  Si pasa de 720, parar.

---

# LOTE 2 — Barrido de lectores, ejecutor y ruta (≈ 640)

Archivos: `apps/desk/server/db/migracionTicketsAbiertos.ts`, `apps/desk/server/db/migracionTicketsAbiertos.test.ts`,
`apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, `apps/desk/server/migracionMarcadorLectores.test.ts` (nuevos);
`apps/desk/server/routes/admin.ts` (sólo crece por el final).

- [x] 2.1 Anotar `git rev-parse HEAD` (partida del lote 2), comprobar el intento y medir `wc -l` de `routes/admin.ts` (213 líneas con
  contenido) y `packages/shared/src/index.ts`.
- [x] 2.2 Leer los moldes: `apps/desk/server/db/transaccion.ts:13-28`, `packages/zoho-sync/src/db/repo.ts:331-346`,
  `apps/desk/server/routes/altaManual.test.ts:158`, `apps/desk/server/testing/appHarness.ts:34-40`,
  `apps/desk/server/db/clientesProvisionales.ts:94`.
- [x] 2.3 **BARRIDO de lectores de `ticket_transitions`** contra una fila marcador con `transition_id` desconocido y
  `to_status = NULL`. El diseño sólo leyó `apps/desk/server/db/sla.ts:88-95` y `apps/desk/server/db/informeContrato.ts:34`.
  Leer, y escribir el resultado con ruta y línea en `apply-progress.md`: `apps/desk/server/indicadores.ts:76`,
  `apps/desk/server/db/fechasTicket.ts:28`, `apps/desk/server/db/primerDerivado.ts:26`,
  `apps/desk/server/db/colaTaller.ts:14`, `apps/desk/server/db/ticketFuentes.ts:19`, `apps/desk/server/db/equipos.ts:275`,
  `apps/desk/server/db/historial.ts:137`, `apps/desk/server/db/conversacion.ts:140`,
  `apps/desk/server/db/certificadosFabrica.ts:16`, `apps/desk/server/db/eliminarTicket.ts:53`,
  `apps/desk/server/auth/users.ts:138`, `apps/desk/server/routes/tickets.ts:139`; en `packages/shared/src`:
  `bodegaje.ts`, `reentrancia.ts`, `etapasDesdeHistoria.ts`, `contratos.ts`, `transitions.ts`, `types.ts`; en
  `packages/zoho-sync/src`: `sync.ts`, `db/history.ts`, `db/repo.ts`. Repetir `grep -rn "ticket_transitions" apps packages
  --include=*.ts` (sin pruebas) y `grep -rnE "to_status|transition_id" ...` por si hay lectores con otro alias, y anotar
  los que se añadan. Por lector: ¿trata el marcador como una entrada de estado, una transición del blueprint, una
  derivación, una liberación o una fecha de evento? Qué ve el usuario.
- [x] 2.4 **Rojo/caracterización del barrido** (`apps/desk/server/migracionMarcadorLectores.test.ts`, nuevo): sembrar un marcador
  y llamar a cada lector del 2.3 que se pueda llamar sobre pg-mem. Un lector que se comporta mal es una prueba **roja**
  que se anota; uno que no, nace verde como caracterización. **No se arregla fuera de alcance:** todo lo no resuelto va a
  `apply-progress.md` como pregunta para la bandeja, sin tocar el lector.
- [x] 2.5 Rojo, ejecutor, seco (`apps/desk/server/db/migracionTicketsAbiertos.test.ts`, nuevo): con `aplicar` ausente y con
  `false` el espía de SQL no ve `BEGIN` ni escritura y las filas quedan idénticas; el informe trae todos sus campos.
- [x] 2.6 Rojo, ejecutor, aplicar: marcador y `UPDATE` por ticket dentro de una transacción y en ese orden (espía);
  `to_status` `NULL` en identidad con el destino en `"values"` y destino en las dos reglas de cambio; `status_type`
  `'Closed'` para «Entregado», `'Open'` para «Pendiente» de servicio, intacto en identidad; `managed_by_app = true`;
  `modified_time`, `source` y `closed_time` intactos; `updated_at` cambia.
- [x] 2.7 Rojo, ejecutor, negativa: con el sin equivalencia **último** de la lista y `aplicar=true`, el espía no registra
  `INSERT` ni `UPDATE`, ni siquiera sobre los que sí migraban; el informe lleva `negativa`; un sin equivalencia gobernado o
  posterior al corte no bloquea (D-8).
- [x] 2.8 Rojo, ejecutor, frontera: segunda pasada sin marcador ni `UPDATE` nuevos; `upsertTicket` posterior no altera la
  fila migrada y sí la de un ticket sin migrar; cerrados, posteriores al corte y gobernados quedan idénticos.
- [x] 2.9 Rojo, ejecutor, resto: el marcador de identidad no mueve `entradasActuales`; `sinRemisionVigente` con y sin remisión
  y sin crear ninguna; `numeracion.arrastra` falso en 9999 y verdadero en 10000; un `UPDATE` que no devuelve fila (la fila
  pasó a `managed_by_app = true` entre lectura y escritura) lanza y deja tablas intactas; fallo forzado en el segundo
  `UPDATE` deshace el primero (espía con `ROLLBACK`).
- [x] 2.10 Rojo, ruta (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, nuevo): `401` sin sesión, `403` sin rol sin
  invocar al ejecutor; `400` sin `corte`, con fecha pelada y con `corte` sin desfase; `400` con `aplicar=1` y `aplicar=TRUE`,
  también en seco y sin leer nada.
- [x] 2.11 Rojo, ruta, respuestas y solapamientos: `200` en seco por defecto; `200` en seco con negativa rellena; `409` con el
  informe completo al aplicar con negativa; `200` al aplicar; informe igual en seco y al aplicar; el informe va al log;
  solapamientos del §7: no administrador con `corte` inválido ve `403`; `corte` inválido con un sin equivalencia en la base
  ve `400`; un migrable y un sin equivalencia con `aplicar=true` no dejan ni `INSERT` ni `UPDATE`.
- [x] 2.12 **EJECUTAR** los cuatro ficheros y anotar el fallo literal de cada rojo en `apply-progress.md`.

**Verde**
- [x] 2.13 Crear `apps/desk/server/db/migracionTicketsAbiertos.ts`: lectura única del §5 (sin `NOT EXISTS` ni `TRIM`),
  clasificación con el núcleo, `vigenciaDeRemisiones` y `motivoSinRemisionVigente` por ticket del subconjunto, `numeracion`
  (`base` de `APP_TICKET_NUMBER_BASE`), `avisos` e informe; el camino seco no abre transacción.
- [x] 2.14 En el mismo fichero, camino de aplicar: `enTransaccion`, lectura por el mismo cliente, negativa antes del primer
  `INSERT`, por ticket marcador y luego `UPDATE … WHERE id=$1 AND managed_by_app = false RETURNING id` (sin `modified_time`,
  sin `source`; `status_type` según D-10).
- [x] 2.15 `routes/admin.ts`: ruta `POST /api/admin/migrar-tickets-abiertos` tras `apps/desk/server/routes/admin.ts:212`
  con `requireAuth`, `requireSuperAdmin`, validación de `corte` y `aplicar` antes del ejecutor, `409` con el informe,
  `logger.info` del informe, y el `import` del ejecutor tras la llave de cierre.
- [x] 2.16 **EJECUTAR `npm run lint`** y confirmar que el `import` tardío de `admin.ts` se acepta. Si no, **plan B:** `import`
  arriba del fichero más el barrido de citas de la regla de mutación 4 sobre `admin.ts` (2.31). Anotarlo.
- [x] 2.17 **EJECUTAR** los cuatro ficheros: todo verde.
- [x] 2.18 `git diff --numstat` y `git diff` de `routes/admin.ts`: sin borrados salvo, si hizo falta, el plan B; las líneas 1 a 212 no se
  mueven; `wc -l` antes y después.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] 2.19 **M1:** quitar el seco por defecto (`aplicar` ausente escribe). Cae «`200` en seco por defecto» (ruta) y «seco: ni
  `BEGIN` ni escrituras» (ejecutor).
- [x] 2.20 **M2 (regla 1):** mover la negativa detrás de la primera escritura. Cae «negativa total» por el espía.
- [x] 2.21 **M3 (regla 1):** invertir marcador y `UPDATE`. Cae «orden por espía».
- [x] 2.22 **M4:** quitar `managed_by_app = true` del `UPDATE`. Cae «`upsertTicket` posterior no altera la fila».
- [x] 2.23 **M5:** quitar la rama `ya-gobernado`. Cae «segunda pasada sin cambios» (ejecutor) y la precedencia (núcleo).
- [x] 2.24 **M6:** quitar `requireSuperAdmin` de la ruta. Cae `403`.
- [x] 2.25 **M7 (D-6):** rellenar `to_status` en identidad. Cae «el marcador de identidad no mueve `entradasActuales`».
- [x] 2.26 **M8 (D-5):** añadir `modified_time = now()` al `UPDATE`. Cae «`modified_time` intacto».
- [x] 2.27 **M9 (regla 1, 2 y 3):** validar `corte` antes de `requireSuperAdmin`. Cae «no administrador con `corte` inválido ve
  `403`».
- [x] 2.28 **M10 (regla 1, 3 y 4):** llamar al ejecutor antes de validar `corte`. Cae «`corte` inválido con un sin equivalencia
  ve `400`».
- [x] 2.29 **M11 (D-12):** tratar `aplicar=1` como seco. Cae «`400` con `aplicar=1`».
- [x] 2.30 `git diff` de `routes/admin.ts`, `migracionTicketsAbiertos.ts` y `shared/`: no queda ninguna mutación.

**Barrido de citas (regla de mutación 4)**
- [x] 2.31 `grep -rnoE "admin\.ts:[0-9]+(-[0-9]+)?"` y `grep -rnoE "index\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio, más
  el segundo pase de abreviadas (`:NN`) en los ficheros que ya citan cada módulo. Comprobar CADA resultado contra el
  fichero, leyendo qué afirma la frase; clasificar A, B o C las que pasen a afirmar algo falso. No editar specs vivas ni
  documentos fechados; la lista va en `apply-progress.md`.

**Cierre**
- [x] 2.32 **CIERRE LOTE 2:** `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y
  `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; anotar el CÓDIGO DE SALIDA de cada uno.
- [x] 2.33 Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; registrarla.
  Si pasa de 720, parar y consultar.

---

# LOTE 3 — Procedimiento `.sql`, su guardián y bloque documental (≈ 295)

Archivos: `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, `apps/desk/server/db/migracionTicketsF1F01.test.ts` (nuevos);
`apply-progress.md`.

- [x] 3.1 Anotar `git rev-parse HEAD` (partida del lote 3) y comprobar el intento.
- [x] 3.2 Leer los moldes: `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`,
  `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts:29-34`, `apps/desk/server/auth/users.ts:138`.

**Rojo** (`apps/desk/server/db/migracionTicketsF1F01.test.ts`, nuevo)
- [x] 3.3 Comportamiento sobre pg-mem, ejecutando el texto de la reversión tras migrar con el ejecutor: restaura `status`,
  `status_type` y `managed_by_app` de «Entregado», «Pendiente» de servicio e identidad; borra sólo marcadores de lo
  restaurado; un ticket con transición posterior no se revierte, conserva su marcador y el procedimiento lo lista; reversión
  repetida sin cambios; `closed_time` intacto.
- [x] 3.4 Estructura: un único `BEGIN` y un único `COMMIT`; toda sentencia nombra `desk.tickets` o `desk.ticket_transitions`;
  la reversión va prefijada `-- REV `; una sentencia por cada regla que cambia el estado más una de identidad.
- [x] 3.5 **EJECUTAR** y anotar el fallo literal (el `.sql` no existe).

**Verde**
- [x] 3.6 Crear `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`: cabecera con requisitos de persona (copia de la base,
  sincronización completa reciente, pasada en seco, comprobar que `numeracion.arrastra` es `false`), pasos, bloque
  `-- REV ` con las tres sentencias, el `SELECT` de los movidos después y la nota de que revertir devuelve `managed_by_app`
  a `false` y el sincronizador vuelve a sobrescribir.
- [x] 3.7 **EJECUTAR** el fichero de pruebas: todo verde.

**Mutaciones (aplicar, anotar mensaje literal, REVERTIR)**
- [x] 3.8 **M1:** quitar del `.sql` la reversión de una regla. Debe caer «una sentencia por regla» (guardián).
- [x] 3.9 **Regla de mutación 2 (fichero vigilado):** escribir en el `.sql` `UPDATE tickets SET status = 'x';` sin calificar. Debe
  caer «toda tabla calificada».
- [x] 3.10 **Regla de mutación 2:** añadir un segundo `COMMIT` y, aparte, quitar el prefijo `-- REV ` de una sentencia. Deben
  caer «un único `BEGIN`/`COMMIT`» y «reversión prefijada».
- [x] 3.11 `git diff` del `.sql` y de la prueba: no queda ninguna mutación.

**Bloque documental final** (sólo en `apply-progress.md`; no se escribe en `docs/sdd/ENTRADA.md` ni en `openspec/config.yaml`)
- [x] 3.12 Redactar, sin número y marcadas «a numerar por el orquestador», las **siete** preguntas para la bandeja: las seis de la
  propuesta (`proposal.md`, «Preguntas para la bandeja») y la que halló el diseño: el informe de contrato toma la
  primera fila con `to_status = 'Finalizado'` (`apps/desk/server/db/informeContrato.ts:34`), así que un «Entregado» migrado
  muestra la fecha de la migración como su fecha de finalización. Añadir las del barrido 2.3 que quedaron sin resolver.
- [x] 3.13 Redactar las notas «para el paquete de despliegue»: sin esquema (`packages/zoho-sync/src/db/schema.sql` no figura en
  `git diff --stat <partida lote 1>`) y sin variable de entorno nueva, **medido** con un `grep` de `process.env` sobre
  ese diff y dado el recuento; la ruta es sólo para superadministrador; el procedimiento va en el `.sql`.
- [x] 3.14 Escribir la línea de la regla de mutación 3 (este cambio no añade ninguna decisión de cliente: no toca `apps/desk/src`)
  y la regla 13 de la ruta: qué decide el servidor (`aplicar`, `corte`, negativa, `403`) y que el cliente no participa.
- [x] 3.15 Línea única de cobertura para el `archive-report.md`: qué parte de F1F-01 cubre el cambio (herramienta, informe,
  reversión) y qué deja fuera (cotejo de la hoja de Google y ejecución), que es lo que sostiene `cierra: no`.

**Cierre**
- [x] 3.16 **CIERRE LOTE 3:** `npm test`, `npm run typecheck`, `npm run lint -- --max-warnings 165` y
  `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`; anotar el CÓDIGO DE SALIDA de cada uno.
- [x] 3.17 Medida del intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; registrarla.
  Si pasa de 720, parar.

---

# Tareas de PERSONA — fuera del recuento

*Regla del ciclo 1: no son casillas ni trabajo de una tanda; **archivar este cambio no las da por hechas**.*

| # | Tarea | Dueño | Qué desbloquea | Dónde queda escrita |
|---|---|---|---|---|
| 1 | Copia de la base y pasada en seco sobre producción, y leer el informe (estados sin equivalencia, sin remisión vigente) | La persona con acceso a producción | Saber qué estados no tienen equivalencia y decidir a dónde van | Cabecera de `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` y `apply-progress.md` |
| 2 | Sincronización completa y reciente antes de marcar (S-7) | La persona con acceso a producción | Que lo marcado sea lo último que dijo Zoho | Ídem |
| 3 | Comprobar que `numeracion.arrastra` es `false` en la pasada en seco; si es `true`, no aplicar y consultar a Gerencia | La persona con acceso a producción | Evitar un salto irreversible de la numeración propia | Ídem y diseño §6 |
| 4 | Ejecutar con `aplicar=true` el fin de semana del corte, con la fecha que confirme Gerencia | La persona con acceso a producción | El corte | Ídem |
| 5 | Averiguar quién rellena la hoja de Google y para qué | Gerencia | El cotejo, y F1B-16 y F1B-17 | `openspec/config.yaml` → `decision/p14b-hoja-google` |
| 6 | Cotejo una a una de la hoja de Google | Gerencia designa | Cerrar F1F-01 | La misma decisión |
| 7 | Respuestas de Gerencia a las siete preguntas de la bandeja | Gerencia | La ejecución, no la construcción | `docs/sdd/ENTRADA.md` (lo escribe el orquestador, no el apply) |

La fusión de cada lote a `main` y el asiento del intento (settle) son del orquestador y del analista; no son casillas de
este cambio y archivar no los da por hechos.
