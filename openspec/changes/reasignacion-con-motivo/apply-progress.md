# Progreso de aplicación — reasignacion-con-motivo (F1B-05)

## Lote 1 · dominio, esquema y datos

Commit de partida del intento: `821c348`. Worktree `C:\dev\Desk_2_R1.023-worktrees\reasignacion-con-motivo`. Modo: strict TDD, rojo visto antes de cada verde.

### Qué se hizo por tarea

- **1.2 / 1.3** `puedeReasignar` y `MENSAJES_REASIGNACION`: `packages/shared/src/reasignacion.ts:9-16` (los seis textos) y `packages/shared/src/reasignacion.ts:24-27` (el predicado, sobre `areasSiguientes` y `catalogoDelTicket`; sujeto ausente falla cerrado en `:25`).
- **1.4 / 1.5** `reasignacionDelCuerpo`: `packages/shared/src/reasignacion.ts:39-47`; el orden motivo, destino, igual al actual está en `:43-45`. Exportado con una línea nueva al final de `packages/shared/src/index.ts:38`.
- **1.6 / 1.7** Esquema: `CREATE TABLE IF NOT EXISTS public.reasignaciones` en `packages/zoho-sync/src/db/schema.sql:756` (CHECK nombrado en `:761`) e índice en `packages/zoho-sync/src/db/schema.sql:765`, ambos al final. `'reasignaciones'` añadido en sitio a `PUBLIC_TABLES`, `packages/zoho-sync/src/db/migrate.ts:73`. Recuentos movidos en sitio en `packages/zoho-sync/src/db/migrate.test.ts:282-286` (43 y 30) y `packages/zoho-sync/src/db/migrate.test.ts:652` (`+ 2` con su etiqueta); bloque nuevo al final desde `packages/zoho-sync/src/db/migrate.test.ts:785`.
- **1.8 / 1.9** Acceso a la traza: `apps/desk/server/db/reasignaciones.ts:15` (`ticketParaReasignar`), `:30-38` (`reasignar`, `UPDATE` condicionado más `INSERT` en `enTransaccion`), `:44` (`reasignacionesDelTicket`), `:50-52` (`usosEnReasignaciones`).
- **1.10 a 1.15** mutaciones: tabla de abajo.
- **1.17** medida: abajo. **1.1, 1.16 (detector de citas) y 1.18** quedan para el orquestador.

### Evidencia TDD (rojo → verde)

| Prueba | Rojo visto (razón) | Verde |
|---|---|---|
| `packages/shared/src/reasignacion.test.ts` bloque `puedeReasignar` + textos (9 pruebas) | `Failed to load url ./reasignacion`: el módulo no existía | 9 de 9 |
| mismo fichero, bloque `reasignacionDelCuerpo` (9 pruebas) | `reasignacionDelCuerpo is not a function` (9 fallos) | 18 de 18 |
| `migrate.test.ts`: recuentos (43, 30, `+2`) y 3 pruebas nuevas | 5 fallos: `expected [10, 29, 3] to deeply equal [10, 30, 3]`; `expected 157 to be 159`; tabla ausente en `information_schema`; la penúltima sentencia era un `CREATE UNIQUE INDEX`; el `INSERT` con motivo vacío no rechazaba | 54 de 54 |
| `apps/desk/server/db/reasignaciones.test.ts` (17 pruebas) | `Cannot find module './reasignaciones'` | 17 de 17 |

Pruebas nuevas: **38** (18 shared, 3 migrate, 17 datos), más 5 recuentos movidos en `migrate.test.ts`.

### Mutaciones (hechas una a una y restauradas; copia previa en un directorio temporal, verde confirmado al final)

| # | Mutación | Prueba que se puso roja | Mensaje |
|---|---|---|---|
| 1.10 | `CREATE TABLE IF NOT EXISTS reasignaciones` sin `public.` | guardián «toda tabla del esquema está clasificada…» y «el CREATE va calificado con public.…» | `expected [ 'reasignaciones' ] to deeply equal []`; `expected 'CREATE TABLE IF NOT EXISTS reasignaci…' to match /^CREATE TABLE IF NOT EXISTS public\.r…/` |
| 1.11 | quitar el `CHECK` del motivo | «el CHECK rechaza un motivo vacío con un INSERT directo…» | `promise resolved "{ rows: [], rowCount: 1 …}" instead of rejecting` |
| 1.12 | `puedeReasignar` siempre `true` | el barrido, «el barrido discrimina», «estado sin salida», «el cargo no abre la puerta», «sin áreas» | `servicio · OV asignada · Servicio Técnico: expected true to be false` |
| 1.13 | destino delante de motivo | «el motivo va antes que el destino», «…antes que cada falla del destino» y la de cuerpo no objeto (3 rojas) | `expected { ok: false, …(1) } to deeply equal { ok: false, …(1) }` |
| 1.14 | `INSERT` de la traza por `db` (fuera de la transacción) | «atómico: … BEGIN, UPDATE, INSERT, ROLLBACK» | `expected [ 'tx:BEGIN', 'tx:UPDATE', …(2) ] to deeply equal [ 'tx:BEGIN', 'tx:UPDATE', …(2) ]` |
| 1.15 | quitar `derivado_a = $3` y `IS NULL` del `UPDATE` | «dato viejo» (con `de` equivocado) y «dato viejo con `de: null`» | `expected true to be false // Object.is equality` |

Las seis cayeron en la prueba que el diseño §7 nombra; ninguna quedó sin detector.

### Comandos finales (código de salida mirado)

- `npm test`: 243 ficheros pasados, 2 saltados; 3.798 pruebas pasadas, 7 saltadas; salida **0**.
- `npm run typecheck`: salida **0**.
- `npm run lint`: salida **0**, 165 avisos, 0 errores (tope 165).
- Detector de citas (`cli.ts --sha HEAD`): no se corre aquí, es del orquestador.

### Cifras medidas (1.17)

`git diff --shortstat --no-renames 821c348`: 5 ficheros, 69 inserciones, 22 borrados (incluye `tasks.md`: 15 y 15). Sin trackear: `reasignacion.ts` 47, `reasignacion.test.ts` 133, `db/reasignaciones.ts` 53, `db/reasignaciones.test.ts` 157, este fichero. Código y pruebas sin `tasks.md` ni este informe: 54+7 trackeadas, 390 nuevas = **451**; con `tasks.md` (30) y este informe (56) suman **537**, por debajo de 720 (válvula no activada, el par `db/reasignaciones` se queda en el lote 1).

### Desviaciones del diseño

1. `reasignar` usa dos `UPDATE` (`IS NULL` y `= $3`, `apps/desk/server/db/reasignaciones.ts:32-34`) en vez de un solo texto con `$3` nulo: el diseño §3(c) lo permitía (DD-1 nombra las dos formas); evita depender de cómo pg-mem compara un parámetro nulo.
2. `usosEnReasignaciones` usa un solo `COUNT` con `de = $1 OR a = $1` (pg-mem admite el parámetro repetido, la hipótesis del diseño se confirma); una fila con la misma persona en origen y destino cuenta una vez.
3. `MENSAJES_REASIGNACION` se declara como objeto literal sin anotación de tipo (el diseño daba la forma del tipo); el tipo inferido es el mismo.
4. Texto añadido a la etiqueta de `migrate.test.ts:652` («y las dos de public.reasignaciones (F1B-05)») además de la suma, como pedía el diseño.

## Lote 2 · aviso, usos, borrado e historial

Commit de partida del intento: `289236b`. Modo: strict TDD, rojo visto antes de cada verde. Sin rutas, sin `app.ts`, sin cliente, sin documentos fuera de este informe y de `tasks.md`.

### Qué se hizo por tarea

- **2.2** Lectura de `apps/desk/server/db/eliminarTicket.ts` y de lo que lo cubre. Las pruebas que llevaban recuentos de tablas eran DOS, no una: `apps/desk/server/db/eliminarTicket.test.ts` (`LAS_ONCE` en `:20`, las filas de la huella en `:68` y `:118`, la lista en `:93`) y `apps/desk/server/tickets.test.ts:521` (`filas` de la ruta `DELETE`, de 10 a 11), que el diseño no nombraba y que `npm test` destapó en rojo.
- **2.3 / 2.4** `avisoReasignacion`: `apps/desk/server/services/avisoReasignacion.ts:16` (texto con nombre y motivo) y supresión «a uno mismo» en `apps/desk/server/services/avisoReasignacion.ts:17`. Reutiliza `AvisoNuevo` sin tocar `ticketService.ts`.
- **2.5 / 2.6** `notificarReasignacion`: `apps/desk/server/services/avisoReasignacion.ts:28`; un solo elemento con `conCopia: true`, `dispararAvisos` en `apps/desk/server/services/avisoReasignacion.ts:38`, sellado sólo si salió y `logger.warn` si no. El administrador que es también destino no recibe dos: lo evita `dispararAvisos`, y una prueba lo fija.
- **2.7 / 2.8** `usosDeUsuario`: `import` en `apps/desk/server/auth/users.ts:4`, comentario («Tres») en `apps/desk/server/auth/users.ts:128` y la suma en `apps/desk/server/auth/users.ts:139`. Sin cambiar el número de líneas (158).
- **2.9 / 2.10** S-8: `reasignaciones` sobre la línea de `ticket_history`, `apps/desk/server/db/eliminarTicket.ts:54`, antes de `tickets`; el comentario «Las diez hijas» en `apps/desk/server/db/eliminarTicket.ts:32`. Sin cambiar el número de líneas (189).
- **2.11 / 2.12** `apps/desk/server/db/eventoReasignacion.ts:13` (puro, «Sin derivar» en `:14`) y `apps/desk/server/db/eventoReasignacion.ts:30` (nombres con `SELECT id, name FROM users` en `:33`, sólo si hay filas). Historial: `import` en `apps/desk/server/db/historial.ts:3` y unión a cuatro fuentes en `apps/desk/server/db/historial.ts:157`; el comentario de cabecera de `getHistorialTicket` reescrito en su misma línea. Sin cambiar el número de líneas (162).
- **2.13 a 2.14** mutaciones: tabla de abajo. **2.1, 2.15 (detector de citas) y 2.17** quedan para el orquestador.

### Evidencia TDD (rojo → verde)

| Prueba | Rojo visto (razón) | Verde |
|---|---|---|
| `avisoReasignacion.test.ts`, bloque puro (3) | `Failed to load url ./avisoReasignacion`: el módulo no existía | 3 de 3 |
| mismo fichero, `notificarReasignacion` (7) | `notificarReasignacion is not a function` (7 fallos) | 10 de 10 |
| `users.test.ts`, bloque «uso en reasignaciones» (4) | `promise resolved "undefined" instead of rejecting` (x2), `expected +0 to be 1`; la cuarta es caracterización (nace verde) | 17 de 17 |
| `eliminarTicket.test.ts`, recuentos movidos (4) + bloque S-8 (2) | `expected 1 to be +0` (huérfana en `reasignaciones`), `expected [ Array(10) ] to deeply equal [ …(10) ]`, `expected undefined to be 1` | 17 de 17 |
| `eventoReasignacion.test.ts`, evento puro (3) | `Failed to load url ./eventoReasignacion` | 3 de 3 |
| mismo fichero, `getHistorialTicket` (5) | con el módulo creado y el historial SIN la cuarta fuente: `expected [] to deeply equal [ 'AppReasignacion' ]` (3 fallos; las dos de «no escribe» y «no pide usuarios» nacen verdes, son de restricción) | 8 de 8 |

Pruebas nuevas: **24** (10 aviso, 4 usos, 2 S-8, 8 evento/historial), más 4 recuentos movidos en `eliminarTicket.test.ts` y 1 en `tickets.test.ts`.

### Mutaciones (una a una, restauradas; verde confirmado al final)

| # | Mutación | Prueba que se puso roja | Mensaje |
|---|---|---|---|
| 2.13 | quitar la supresión «a uno mismo» (`avisoReasignacion.ts:17`) | «reasignarse a uno mismo no crea aviso» (pura) y «reasignarse a uno mismo no escribe ni manda nada» | `expected { userId: 'u-1', …(1) } to be null`; `expected [ { column: 1 } ] to deeply equal []` |
| 2.14 | quitar la tercera fuente de `usosDeUsuario` (`users.ts:139`) | los tres del bloque nuevo (origen, destino, recuento) | `promise resolved "undefined" instead of rejecting`; `expected +0 to be 1` |
| extra | quitar `reasignaciones` de `TABLAS` (`eliminarTicket.ts:54`) | los cuatro de `eliminarTicket.test.ts` (huérfanas, lista de once, S-8, simulacro) | `expected 1 to be +0`; `expected [ Array(10) ] to deeply equal …` |
| extra | quitar la cuarta fuente de `historial.ts:157` | las tres de integración de `eventoReasignacion.test.ts` | `expected [] to deeply equal [ 'AppReasignacion' ]` |

Las cuatro cayeron donde se esperaba; ninguna quedó sin detector.

### Comandos finales (código de salida mirado)

- `npm test`: 245 ficheros pasados, 2 saltados; 3.822 pruebas pasadas, 7 saltadas; salida **0** (a la primera pasada falló `tickets.test.ts:521`, ver 2.2; recuento movido).
- `npm run typecheck`: salida **0**. `npm run lint`: salida **0**, 165 avisos, 0 errores.
- Detector de citas: no se corre aquí, es del orquestador.

### Cifras medidas (2.16)

`wc -l` antes y después de los tres ficheros muy citados, igual: `historial.ts` 162 → 162, `users.ts` 158 → 158, `eliminarTicket.ts` 189 → 189. Fin de línea CRLF conservado en todos.
`git diff --shortstat --no-renames 289236b` (sin este informe ni `tasks.md`): 97 inserciones, 23 borrados en 6 ficheros (120). Sin trackear: `avisoReasignacion.ts` 41, su prueba 119, `eventoReasignacion.ts` 36, su prueba 94 (290). Código y pruebas: **410**, por debajo de 720 (válvula no activada; con este informe y `tasks.md` el total queda en la cifra que mida el orquestador al asentar).

### Desviaciones del diseño

1. `tickets.test.ts:521` (recuento de la ruta `DELETE`) no estaba en el diseño: movido de 10 a 11 en su misma línea.
2. El comentario de cabecera de `getHistorialTicket` y el de `eliminarTicket.ts:32` se reescribieron en sitio («y sus reasignaciones», «Las diez hijas»), porque dejaban de ser ciertos.
3. El texto del aviso, que el diseño no fija, es `{actor} te reasignó el ticket #{n}. Motivo: {motivo}`.
4. `LAS_DIEZ` pasó a `LAS_ONCE` en la prueba de `eliminarTicket` (renombre local, no cambia ninguna cita).
