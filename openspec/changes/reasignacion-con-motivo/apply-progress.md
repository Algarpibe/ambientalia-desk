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

## Lote 3 · ruta, registro y sincronizador

Intento sobre el commit de partida `60a3ebd`, en el worktree `C:\dev\Desk_2_R1.023-worktrees\reasignacion-con-motivo`. Un solo ejecutor, strict TDD.

### Qué se hizo por tarea

- **3.2, 3.4, 3.6, 3.8, 3.10 (rojo)**: `apps/desk/server/routes/reasignacion.test.ts` (34 pruebas): escalones A y B (`:45`), C y los pares de posición (`:97`), éxito y D con el `409` determinista (`:180`), aviso y no interferencia (`:258`), barrido HTTP de estados por áreas (`:326`). Se escribió el fichero entero antes de la implementación y se vio en rojo entero.
- **3.3, 3.5, 3.7, 3.9 (verde)**: `apps/desk/server/routes/reasignacion.ts` (44 líneas, `registerReasignacionRoutes`): guarda A en `apps/desk/server/routes/reasignacion.ts:26-27`, B en `:28-29`, C (validador de `shared`) en `:30-32`, C (destino activo) en `:33-35`, D en `:36-39`, aviso en `:41` y respuesta en `:42`. Registro en sitio en `apps/desk/server/app.ts:22` (`import`, unido con `;` a la línea ya existente) y `apps/desk/server/app.ts:61` (llamada con `{ db, config }`).
- **3.11 (caracterización)**: `apps/desk/server/reasignacionSync.test.ts` (34 líneas): el ticket lo fabrica `upsertTicket`; precondición `managed_by_app === false`; `POST` `200`; segundo `upsertTicket` con `En Proceso`; `derivado_a` igual al destino y `managed_by_app` en `false`.
- **3.12 a 3.18 (mutaciones)** y **3.20 (medida)**: abajo. **3.19**: `npm test`, `typecheck` y `lint` en 0; el detector de citas lo corre el orquestador.

### Evidencia TDD (rojo → verde)

| Prueba | Rojo visto (razón) | Verde |
|---|---|---|
| `reasignacion.test.ts` entera, con la ruta sin registrar | `expected 404 to be 200`, `expected 404 to be 422`, `expected 'Ruta de API no encontrada' to be 'El motivo es obligatorio'`: la ruta no existía. Nacieron verdes por la misma razón (404 y 401 coinciden) «sin sesión» y «par 1 y 2» | 34 de 34 con la ruta |
| `reasignacionSync.test.ts` | caracterización de comportamiento ya cumplido por la ruta (diseño §6): nace verde; su detector es la mutación 3.16 | 1 de 1 |

Pruebas nuevas: **35** (34 de la ruta, 1 de sincronizador). Criterios de la propuesta cubiertos por la ruta: 1 a 4, 7 a 13 y 16; el 13 (traza que falla, `derivado_a` intacto) sigue en la capa de datos del lote 1 (pg-mem no revierte un `ROLLBACK`).

### Mutaciones (una a una, restauradas; verde confirmado)

| # | Mutación | Prueba que se puso roja | Mensaje |
|---|---|---|---|
| 3.12 | `403` delante del `404` (posición, movida físicamente) | par 1 y 2 | `expected 403 to be 404` |
| 3.13 | `422` delante del `403` (bloque C movido delante del B) | par 2 y 3 y el barrido HTTP | `expected 422 to be 403`; `servicio · OV asignada · Servicio Técnico: expected 422 to be 403` |
| 3.14 | destino delante de motivo (en el validador de `packages/shared/src/reasignacion.ts`) | par 3 y 4 de la ruta | `expected 'Falta la persona a la que se reasigna' to be 'El motivo es obligatorio'` |
| 3.15 | `puedeReasignar` siempre verdadero | 403 sin área, par 2 y 3, barrido HTTP y «Finalizado» | `expected 200 to be 403`; `expected 422 to be 403` |
| 3.16 | `managed_by_app = true` en el `UPDATE` | `reasignacionSync.test.ts` | `expected { status: 'Ingresado', …(2) } to match object { …(3) }` |
| 3.17 | quitar la supresión «a uno mismo» | «reasignarse a uno mismo no crea aviso» (ruta) | `expected 1 to be +0` |
| 3.18 | quitar la condición sobre `derivado_a` del `UPDATE` | dos de dato viejo (`reasignaciones.test.ts`) y el `409` de la ruta | `expected true to be false` |
| extra | guarda del destino (6) delante del validador | pares 3 y 4, 3 y 5/6, 4 y 5 y 5 y 6 | `expected 'La persona elegida no existe o está i…' to be 'El motivo es obligatorio'` |

Ninguna quedó sin detector; no hizo falta prueba añadida.

### Comandos finales (código de salida mirado)

- `npm test`: 247 ficheros pasados, 2 saltados; 3.857 pruebas pasadas, 7 saltadas; salida **0**.
- `npm run typecheck`: salida **0**. `npm run lint`: salida **0**, 165 avisos, 0 errores.
- Detector de citas: no se corre aquí, es del orquestador.

### Cifras medidas (3.20)

`wc -l` de `apps/desk/server/app.ts`: 96 antes y 96 después (dos líneas modificadas, ninguna insertada); CRLF conservado. `git diff --shortstat --no-renames 60a3ebd`: 71 inserciones y 20 borrados (91, con este informe y `tasks.md`) más 439 sin trackear = **530** en total; sólo código y pruebas: 4 de diff más 439 sin trackear (`reasignacion.ts` 44, su prueba 361, `reasignacionSync.test.ts` 34), muy por debajo de 720.

### Desviaciones del diseño

1. La prueba de la ruta se escribió entera antes de la ruta (un solo rojo, un solo verde) y no por parejas 3.2/3.3, 3.4/3.5…; el rojo se vio por la razón correcta (ruta inexistente).
2. «Fallo del aviso tras la transacción» devuelve `500` (límite declarado de `notificarReasignacion`: si falla el `INSERT` del aviso, lanza con la reasignación ya hecha); la prueba lo fija junto con `derivado_a` y traza intactos.
3. Mutación extra (guarda 6 delante del validador) añadida a las del `tasks.md`.

## Lote 4 · cliente y documentos

Commit de partida del intento: `5d12bb9`. Modo: strict TDD; el rojo se exige sólo a `apps/desk/src/lib/reasignacion.test.ts` (los `.tsx` y `apps/desk/src/api/client.ts` están fuera de la red de pruebas por decisión de Gerencia, F0-00). No hay jsdom ni cambios en `vitest.config.ts`.

### Qué se hizo por tarea

- **4.2 / 4.3** `apps/desk/src/lib/reasignacion.test.ts` (8 pruebas) en rojo (`Failed to load url ./reasignacion`), luego `apps/desk/src/lib/reasignacion.ts`: `opcionesReasignacion` en `apps/desk/src/lib/reasignacion.ts:11` y `puedeEnviarReasignacion` en `apps/desk/src/lib/reasignacion.ts:19`, esta última es `reasignacionDelCuerpo(...).ok` de `shared`; 8 de 8 en verde. Una de las pruebas enfrenta ambas funciones con el validador de `shared` en cinco casos.
- **4.4** `reasignarTicket` al final de `apps/desk/src/api/client.ts:867` (+7 líneas, sólo por el final; 864 a 871).
- **4.5** `apps/desk/src/components/PanelReasignar.tsx` (70 líneas), con el molde y las clases de `apps/desk/src/components/PanelPrioridad.tsx`.
- **4.6** Montaje en sitio en `apps/desk/src/components/TicketDetailView.tsx`: `import` unido con `;` a la línea 15, `versionHistoria` unido a la 72, `key` en la 291 (DD-7) y el panel unido a la 320. **`wc -l`: 420 antes y 420 después**; CRLF conservado; nada se desplaza.
- **4.7** Tabla de la regla 13, abajo.
- **4.8 / 4.9 / 4.10** corrección 30 (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, +36 al final; los dos rangos del maestro, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2035` y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2060-2062`, releídos contra el `.md` antes de citarlos), apartado nuevo al final de `DEPLOY.md` (+29) y §9 al final del paquete de despliegue (+52, tras el §8).
- **4.11 NO HECHA, decide el orquestador.** `openspec/config.yaml` acaba en la lista `cierres_declarados_por_commit` (`openspec/config.yaml:4390`), que lee el barrido de cierres; la entrada de `decision/e089-e220-visibilidad-y-traspaso` está en `openspec/config.yaml:3992-4019`, en medio del fichero. No existe un patrón de «nota de aplicación» de una decisión que se anote al final (los bloques del final, `trabajo_sin_ficha_declarado` y `aprobaciones_de_techo_del_ledger_adenda`, son de otra clase), así que no se tocó el fichero.
- **4.12** barrido de citas, abajo. **Comentario de `apps/desk/server/db/historial.ts:128`** corregido en la misma línea: decía «no se registran eventos nuevos» y las reasignaciones sí tienen tabla propia; ahora «salvo las reasignaciones». Sin cambiar el número de líneas (162).
- **4.13** `npm test`, `typecheck`, `lint` y `build` abajo; el detector de citas es del orquestador. **4.14** medida abajo.

### Evidencia TDD (rojo a verde)

| Prueba | Rojo visto (razón) | Verde |
|---|---|---|
| `apps/desk/src/lib/reasignacion.test.ts`, `opcionesReasignacion` (3) y `puedeEnviarReasignacion` (5) | `Failed to load url ./reasignacion`: el módulo no existía | 8 de 8 |

Triangulación: persona a cargo presente, ausente (`null`) y no activa; motivo vacío y de espacios; destino igual y vacío; cinco casos contra `reasignacionDelCuerpo`.

### Tabla de la regla 13

Cada decisión que el cliente toma de verdad, con la línea del servidor LEÍDA en `apps/desk/server/routes/reasignacion.ts` y la prueba de `apps/desk/server/routes/reasignacion.test.ts`.

| Decisión del cliente (ruta:línea) | Qué la impone en el servidor | Prueba que lo fija |
|---|---|---|
| Muestra el panel sólo a quien `puedeReasignar` (`apps/desk/src/components/PanelReasignar.tsx:30`) | `apps/desk/server/routes/reasignacion.ts:29` (403 con el mismo predicado de `shared`) | `apps/desk/server/routes/reasignacion.test.ts:72`; barrido de estados por áreas `:330`; estado sin salida `:351` |
| No lo pinta sin sesión (`apps/desk/src/components/PanelReasignar.tsx:30`) | `apps/desk/server/routes/reasignacion.ts:23` (`requireAuth`, 401) | `apps/desk/server/routes/reasignacion.test.ts:46` |
| No ofrece a la persona a cargo (`apps/desk/src/lib/reasignacion.ts:12`) | `apps/desk/server/routes/reasignacion.ts:31-32` (422 «ya está a cargo», validador de `shared`) | `apps/desk/server/routes/reasignacion.test.ts:149`; par 5 y 6 `:141` |
| Ofrece sólo personas activas (`apps/desk/src/components/PanelReasignar.tsx:57`, de `/api/personas`) | `apps/desk/server/routes/reasignacion.ts:34-35` (422 de inexistente o inactivo) | `apps/desk/server/routes/reasignacion.test.ts:169` |
| No ofrece «Sin derivar» y desactiva el botón sin destino (`apps/desk/src/lib/reasignacion.ts:12`, `apps/desk/src/lib/reasignacion.ts:20`) | `apps/desk/server/routes/reasignacion.ts:31-32` (422 de destino obligatorio) | `apps/desk/server/routes/reasignacion.test.ts:155`; no vaciar `:163` |
| Desactiva el botón con motivo vacío o de espacios (`apps/desk/src/lib/reasignacion.ts:20`, `apps/desk/src/components/PanelReasignar.tsx:63`) | `apps/desk/server/routes/reasignacion.ts:31-32` (422 de motivo, mismo validador) | `apps/desk/server/routes/reasignacion.test.ts:105`; par 3 y 4 `:115` |
| Desactiva el botón con destino igual al actual (`apps/desk/src/lib/reasignacion.ts:20`) | `apps/desk/server/routes/reasignacion.ts:31-32` | `apps/desk/server/routes/reasignacion.test.ts:149` |
| Compara contra la persona a cargo que trae el ticket, que puede estar vieja (`apps/desk/src/components/PanelReasignar.tsx:57`) | `apps/desk/server/routes/reasignacion.ts:37-39` (el `UPDATE` condicionado da 409 si cambió) | `apps/desk/server/routes/reasignacion.test.ts:232` |
| Bloquea el botón mientras envía (`apps/desk/src/components/PanelReasignar.tsx:63`) | Comodidad contra el doble clic; la guarda real es el 409 de `apps/desk/server/routes/reasignacion.ts:37-39` | `apps/desk/server/routes/reasignacion.test.ts:232` |
| Enseña el error que dice el servidor (`apps/desk/src/components/PanelReasignar.tsx:40`); recarga ticket e historial (`apps/desk/src/components/TicketDetailView.tsx:320`) | No decide nada | — |

Ninguna decisión del cliente queda sin línea de servidor. Matiz sin maquillar: el 403 del panel y el de la ruta salen de la misma función de `shared` (`packages/shared/src/reasignacion.ts:24-27`); lo que el cliente NO puede saber es el estado de otra sesión, y eso lo cubre el 409.

### Barrido de citas (4.12, regla de mutación 4)

Se barrió TODO el repositorio (incluido `openspec/changes/archive/`) con la ruta o el nombre del fichero más `:NN` o `:NN-MM` para siete ficheros: 778 citas completas en total, y **250** caen en una línea editada o la abarcan. Ningún fichero cambió de número de líneas (`historial.ts` 162, `users.ts` 158, `eliminarTicket.ts` 189, `app.ts` 96, `TicketDetailView.tsx` 420), así que nada se desplaza. Reparto de las 250: 138 en 16 cambios archivados (no se tocan), 64 en los documentos del propio cambio, 17 en specs vivas y 31 en documentos de `docs/`. **Ninguna cita completa en código `.ts`/`.tsx`.**

- **A, presente y cierta (no se toca):** las citas a `users.ts` en las líneas 137, 138, 128-131, 133-134 y 125-140 (de `openspec/changes/reasignacion-con-motivo/specs/permissions/spec.md` y de `openspec/specs/permissions/spec.md`; la línea dice lo mismo que antes); las dos de `docs/sdd/Paquete_de_Despliegue_2026-09-10.md` a la línea 138 de `users.ts`; las 11 citas a la línea 61 de `app.ts` de los paquetes de despliegue de `2026-09-29` a `2026-10-04b` y las de las líneas 22 y 61 del propio cambio (la línea sigue montando las rutas que decían, más una); las cuatro a la línea 320 de `TicketDetailView.tsx` de los paquetes `09-29`, `09-30` y `10-01` y la de `openspec/changes/reasignacion-con-motivo/proposal.md:181`; las de `migrate.ts` en las líneas 70-73 de `openspec/specs/gases-patron/spec.md`, `openspec/specs/remisiones/spec.md`, `openspec/specs/zoho-sync/spec.md` y la de las líneas 63-80; las de los documentos del cambio a `historial.ts` (3, 157), `users.ts` (4), `eliminarTicket.ts` (32, 54) y `migrate.test.ts` (282-286, 652).
- **B, histórica o fechada (no se toca):** `openspec/changes/reasignacion-con-motivo/proposal.md:175` («hoy cuenta dos», líneas 136-139 de `users.ts`), `proposal.md:352`, `design.md:24` y `specs/tickets-core/spec.md:158` (`eliminarTicket.ts` 45-56 «no las incluye», descripción del estado de partida); `docs/sdd/F0-00_Baseline_as-built.md:73` y `:482` (`eliminarTicket.ts` 45-56, «nueve tablas hijas», baseline de 2026-09-08); los paquetes `2026-09-27:75`, `09-29:121`, `09-30:156` y `10-01:230` (`migrate.ts` 70-73), y `10-01:1749`, `10-03:241`, `10-04:313`, `10-04b:483` (`migrate.ts` línea 73, «al final de la línea»: hoy el final es otro); `docs/superpowers/plans/2026-06-19-hardening-fase-b.md:13` (`app.ts` 55-61 con revisión nombrada `1d030d5`); `openspec/specs/gases-patron/spec.md:198` (`migrate.test.ts` línea 283, «medidos sobre `f5255d2`»); `openspec/specs/tickets-core/spec.md:1441` (`migrate.ts` 70-73, recuento fechado de tablas).
- **Dejan de ser ciertas hoy, y están en specs VIVAS (no se tocan; las corrige la fusión del delta en el archivo):**
  1. `openspec/specs/trazas/spec.md:28` (línea 157 de `historial.ts`, «`[...zoho, ...transiciones, ...remisiones]` ordenado»): esa línea une ahora cuatro fuentes.
  2. `openspec/specs/trazas/spec.md:484` (línea 157 de `historial.ts`, mismo literal de tres fuentes, en la tabla de contraste con el diseño de agosto).
  3. `openspec/specs/trazas/spec.md:141` (líneas 131-161 de `historial.ts`, «la unión en `:157`»): la ubicación sigue siendo cierta, la frase que la rodea («tres fuentes», sin registro propio) no; la sustituye el delta de RQ-TZ-06. Las de `trazas/spec.md:29` y `:151` (líneas 126-131 y 126-129, «derivada al leer») siguen ciertas.
  4. `openspec/specs/tickets-core/spec.md:601` (líneas 31-33 de `eliminarTicket.ts`, «nueve tablas hijas más la cabecera»): hoy son diez. El delta de `tickets-core` no modifica ese requisito vivo: **queda desfasada tras el archivo salvo que alguien la corrija**; se anota para el orquestador.
  5. Las frases «dos referencias» de `openspec/specs/permissions/spec.md:257-266` (RQ-PM-11): la sustituye el delta de `permissions` en el archivo.
- **Archivadas (138, no se tocan):** línea 22 de `app.ts` (16), línea 61 (11), `migrate.ts` 70-73 (22), línea 73 (40), 62-73 y 66-73 (3), `migrate.test.ts` en 282-287 y 266-287 (22), línea 283 (3), 648-652 y 652 (3), `TicketDetailView.tsx` líneas 15 (8) y 320 (4), `users.ts` línea 138 (4) y línea 4 (1), `historial.ts` (3), `eliminarTicket.ts` 45-56 (1). Clasificadas B o C por pertenecer a un cambio archivado; no se leyeron una a una.
- **Segundo pase de las abreviadas (`:NN`):** no se hizo con herramienta; el detector de citas no las bloquea (regla de mutación 4, último guion) y ninguna edición de este lote movió una línea, por lo que ninguna abreviada puede haberse desplazado. Es una hipótesis, no una medición.

### Comandos finales (código de salida mirado)

- `npm test`: salida **0**; 248 ficheros pasados, 2 saltados; 3.865 pruebas pasadas, 7 saltadas.
- `npm run typecheck`: salida **0**. `npm run lint`: salida **0**, 165 avisos, 0 errores. `npm run build`: salida **0** (`built`).
- Detector de citas (`cli.ts --sha HEAD`): no se corre aquí, es del orquestador.

### Cifras medidas (4.14)

`git diff --shortstat --no-renames 5d12bb9`: 6 ficheros, 129 inserciones y 5 borrados (134). Sin trackear: `PanelReasignar.tsx` 70, `lib/reasignacion.ts` 21, `lib/reasignacion.test.ts` 61 (152). Total **286**, sin este informe ni `tasks.md`; con ellos queda muy por debajo de 720 (válvula no activada). Sin binarios. `docs/sdd/ENTRADA.md`, `CLAUDE.md`, `ticketService.ts` y `repo.ts` sin tocar.

### Desviaciones del diseño

1. 4.11 (`openspec/config.yaml`) no se hizo: ver arriba.
2. Se corrigió el comentario de `apps/desk/server/db/historial.ts:128` (código del lote 2, no una cita), en la misma línea.
3. El panel recibe `derivadoActual` como `PersonaLite | null` (como `TransitionPanel`) y no como id, para pintar «a cargo de» sin otra consulta; `actualId` se deriva dentro.
