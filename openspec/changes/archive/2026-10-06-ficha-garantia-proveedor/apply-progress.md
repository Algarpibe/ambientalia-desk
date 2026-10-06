# Progreso de apply — `ficha-garantia-proveedor` (F1B-13, `cierra: no`)

## Lote 1a (partida `a64c6c8`) — PARADO POR LA VÁLVULA, capa de datos pasa al lote 1b

Medida con la capa de datos hecha y en verde: 61 (diff) + 690 (nuevos) = **751 > 720**. Se aplica la válvula del diseño
(`design.md` §11): la capa de datos y su prueba (340 líneas medidas) salen del árbol y pasan a 1b. Medida final del lote:
**411** (51 inserciones y 10 borrados en cinco ficheros, más 191 + 159 de los dos ficheros nuevos de `shared`).
`apply-progress.md` no cuenta.

### Tareas hechas

| Tarea | Rojo (razón) | Verde |
|---|---|---|
| 1a.1 | `garantiaProveedor.test.ts`: «Failed to load url ./garantiaProveedor» (el módulo no existe) | — |
| 1a.2 | — | 1a.1 en verde (todas las pruebas del fichero) |
| 1a.3 | — | `index.ts:37` en sitio, 1 inserción y 1 borrado |
| 1a.4 | PM20-2 roja al crear la llamada: recibido `[garantiaProveedor.ts, ordenOVI.ts]`, esperado `[ordenOVI.ts]` | edición en sitio de `cargos.test.ts:226-228`: `--numstat` 2/2; `packages/shared` 1058 verdes |
| 1a.5 | `[10, 28, 3]` ≠ `[10, 29, 3]` y «tabla no existe» (`expected [] to have a length of 1`) | — |
| 1a.6 | — | 51/51 en `migrate.test.ts` tras `schema.sql` (+27 al final) y `migrate.ts:73` (1/1) |
| 1a.7 | **H-1: pg-mem ACEPTA el `CHECK` compuesto** (la tabla se crea y la prueba de la tabla pasa). Sin respaldo, sin cambios | — |
| 1a.10 | ver abajo | restaurado y 51/51 |
| 1a.12 | — | ver cierre |
| 1a.13 | — | ver medida |

**Tareas NO hechas (pasan a 1b): 1a.8, 1a.9** (prueba y código de la capa de datos), **1a.11 en lo que toca a M-DB-1…3**
(las M-SH-1…4 sí están hechas). Los dos ficheros, completos, en verde (14 pruebas) y en CRLF, quedaron fuera del árbol
(copia en el directorio temporal de la sesión de apply): `apps/desk/server/db/garantiaProveedor.ts` (161 líneas) y
`apps/desk/server/db/garantiaProveedor.test.ts` (179). Cuando 1b los recupere, el orden TDD es: la prueba primero (roja
por «Cannot find module ./garantiaProveedor»), el código después.

### Desvíos del diseño

1. **`migrate.test.ts`, una línea en sitio más** (`:652`): el guardián «las seis sentencias nuevas van DETRÁS de
   prioridad_ajustes…» cuenta las sentencias del final de `schema.sql` y pasó de 154 a 157 con las tres de la tabla
   nueva (un `CREATE`, un índice único, un índice). Se sumó `+ 3` y la frase «y las tres de public.garantia_proveedor
   (F1B-13)» en la misma línea (1 inserción y 1 borrado, sin desplazar). El diseño §4 no la preveía; el cierre la añade
   a la lista de líneas cuyo CONTENIDO cambia para el barrido de citas.
2. **`GarantiaDelTicket` y `OviDelTicket`** viven (en la copia de la capa de datos) en el fichero de la capa de datos y no
   en `shared`: `design.md` §3 no los lista en `shared` y §5 los usa en la firma de `garantiaDelTicket`.
3. **`puedeGestionarReclamacion` acepta `null | undefined`** (devuelve `false`), como pide 1a.1 («sujeto ausente»).
4. Comentarios del `CREATE` en `schema.sql`: dos líneas de comentario antes de la sentencia (no por columna) y ninguna
   con punto y coma.

### Regla de mutación 2 — fichero vigilado (`migrate.test.ts`, 51 pruebas), cada una restaurada

| Qué se ensució en | Prueba roja | Restaurado |
|---|---|---|
| (a) `schema.sql`: `public.` fuera del `CREATE` | «toda tabla del esquema está clasificada, y en el esquema que su lista declara» | sí |
| (b) `migrate.ts:73`: sin `'garantia_proveedor'` | la misma y el recuento «son 42 tablas» | sí |
| (c) `schema.sql`: sin el `CREATE UNIQUE INDEX` | prueba del `23505` de la tabla nueva y el guardián de posición de las sentencias finales | sí |
| (d) `schema.sql`: `-- a; b` en un comentario del `CREATE` | las mismas dos que (c) | sí |
| (e) `schema.sql`: `CREATE TABLE garantia_x (id int)` SIN calificar, al final | guardián de clasificación, recuento de tablas y guardián de posición | sí; verde 51/51 |

### Mutaciones del lote (1a.11), cada una restaurada

| Id | Qué se movió | Prueba roja |
|---|---|---|
| M-SH-1 | `>` por `>=` en `reclamacionVencida` | «el día 59 no, el 60 no, el 61 sí» |
| M-SH-2 | `siguienteEstado('abierta')` devuelve `resuelta` | las dos de `siguienteEstado` y `motivoPasoNoPermitido` |
| M-SH-3 | quitar el recorte del fabricante | cuatro: «sí» recortado, sólo espacios (respuesta y ficha) |
| M-SH-4 | «rechazada» deja de rechazar el valor positivo | «rechazada acepta ausente y 0 y guarda 0…» |

Hechas también con la capa de datos (ya fuera del árbol, a repetir en 1b): **M-DB-1** quitar la traducción del `23505` →
roja la del error traducido; **M-DB-2** quitar `AND estado = $2` de `avanzarFicha` (rama «enviada») → roja «con el estado
viejo»; **M-DB-3** quitar el `continue` de «liberada sin respuesta» → roja esa prueba. ⚠️ La forma literal de M-DB-3 del
diseño (`pendiente` sin mirar `liberada`) NO se pone roja: con el `continue` delante, una liberada que llega al cálculo
siempre tiene respuesta y `pendiente` da lo mismo; la mutación que discrimina es la del `continue`.

### H-1 y H-2

- **H-1**: pg-mem acepta el `CHECK` compuesto, y lo impone (rechazó «sí» con motivo, «no» sin motivo y «no» con estado en
  la prueba de la capa de datos, hoy fuera del árbol). Sin respaldo.
- **H-2**: pg-mem devuelve `numeric` como NÚMERO (quitar el `Number()` del mapeador deja verde la prueba). El mapeador
  sigue cubriendo el texto de node-postgres, pero esa rama no la prueba ninguna prueba con pg-mem. Hipótesis para 1b.

### Gate pendiente fuera del lote

`apps/desk/server/reconciliacion/registro.test.ts:218-221` («en curso son exactamente DOCE») está roja DESDE la partida
`a64c6c8`: el commit de planificación metió el `proposal.md` de F1B-13 y la lista de tandas «en curso» pasó a trece
(`F1B-13` entre `F1B-11` y `F1C-05`). No es del lote 1a; el precedente es el commit
`8a9e742 test(reconciliacion): F1F-02 entra en curso`. Lo arregla quien commitea (título DOCE → TRECE y la lista).

## Lote 1b (partida `5e1d9bc`) — rutas, registro y pendientes del 1a

Medida: **587** (97 inserciones y 17 borrados en cinco ficheros, contra `5e1d9bc`, más 107 + 366 de las rutas y su prueba, nuevas sin trackear) (válvula 720, estimado 359). Cuatro códigos de cierre en 0 (ver la entrega del orquestador).

### Tareas hechas

| Tarea | Rojo (razón) | Verde |
|---|---|---|
| 1b.1 a 1b.4 | `routes/garantiaProveedor.test.ts` (37 pruebas): 33 rojas porque las rutas no existían (`404` «Ruta de API no encontrada» del comodín de `/api` frente a los `201/409/403/422` esperados); 4 nacían verdes por esperar `404` | — |
| 1b.5 | — | 37/37 con `routes/garantiaProveedor.ts` (107 líneas); una prueba tenía una columna inexistente (`creada_at`) y se corrigió en la prueba |
| 1b.6 | — | `app.ts:22` y `:61` en sitio: `--numstat` 2/2 (sin desplazar) |
| 1b.7 | — | PM20-2 verde (dos llamadores de la primitiva); `ticketService.ts` y `remision.ts` sin cambios (`git diff --stat` vacío) |
| 1a.8, 1a.9 | commit `5e1d9bc` | — |
| 1a.11 | ver las dos tablas de abajo | — |

### Mutaciones de posición y de condición del 1b (1b.8), cada una restaurada y verde después (37/37)

| Id | Qué se movió | Prueba roja |
|---|---|---|
| M-POS-1 | G2 antes de G1 | POS-RS-1 |
| M-POS-2 | G3 antes de G2 | POS-RS-2 |
| M-POS-3 | G4 antes de G3 | POS-RS-3 |
| M-POS-4 | G5 antes de G4 | POS-RS-4 |
| M-POS-5 | G6 antes de G5 | POS-RS-5 |
| M-POS-6 | G6 antes de G2 | POS-RS-5, POS-RS-6, POS-RS-7 (3 rojas) |
| M-POS-7 | G6 antes de G3 | POS-RS-5, POS-RS-7 |
| M-POS-8 | G8 antes de G7 | POS-AV-1 |
| M-POS-9 | G9 antes de G8 | POS-AV-2 |
| M-POS-10 | G10 antes de G9 | POS-AV-3 y «saltar, retroceder y avanzar una resuelta» |
| M-POS-11 | G12 antes de G11 | POS-ED-1 |
| M-POS-12 | G13 antes de G12 | POS-ED-2 |
| M-POS-13 | G14 antes de G13 | POS-ED-3 |
| M-RT-1 | G7 y G11 sin mirar `reclama` | «una ficha inexistente… respuesta no dan 404», POS-AV-1 y POS-ED-1 |
| M-CARRERA | sin traducir `ReclamacionYaRespondidaError` | «la carrera de dos respuestas… nunca un 500» (la carrera SÍ llega al `23505` con pg-mem) |

Las trece posiciones se hicieron con un script que mueve el bloque entero de cada guarda (no sólo la condición). Para que la
mutación de G10 antes de G9 fallara por orden y no por una referencia sin declarar, `const a` (el destino del cuerpo) se lee al
principio del manejador de avanzar.

### Pendientes del lote 1a, hechos aquí

| Id | Qué se movió en `apps/desk/server/db/garantiaProveedor.ts` | Prueba roja |
|---|---|---|
| M-DB-1 | quitar la traducción del `23505` | «una segunda respuesta… ReclamacionYaRespondidaError» |
| M-DB-2 | quitar `AND estado = $2` de `avanzarFicha` (rama «enviada» y, aparte, rama «resuelta») | «con el estado viejo no toca nada y devuelve null» (las dos) |
| M-DB-3 | quitar el `continue` de «liberada sin respuesta» | «liberada SIN respuesta no sale…» |
| M-DB-3 (forma del diseño) | `pendiente: respuesta === null` (sin mirar `liberada`) | NO se pone roja: equivalente, 15/15 verde. `design.md` §9 y `tasks.md` 1a.11 corregidos |
| H-2 | quitar el `Number()` del mapeador | la prueba nueva «el mapeador convierte a number los valores que la base entrega como texto» |

H-2: prueba nueva en `db/garantiaProveedor.test.ts` con un `Queryable` falso que devuelve `valor_reclamado: '800000.50'` y
`valor_recuperado: '300'` como texto; sale `number`. Todas restauradas y 15/15 verde.

### Desvíos del diseño

1. **Orden de los manejadores en el fichero:** responder, editar, avanzar (el diseño §6 lista avanzar antes que editar). No cambia
   ninguna guarda.
2. **Carrera de avanzar (`avanzarFicha` devuelve `null`):** el `409` lleva el texto de G9 calculado sobre el estado RE-LEÍDO
   (`motivoPasoNoPermitido(actual.estado, a)`), porque con el estado ya leído G9 era `null` y no daba texto; sin fila vuelve a
   un texto genérico. El diseño decía «el texto de G9».
3. **Pruebas con usuarios de correo propio** (`usuario(areas, cargo)` como `oviGarantia.test.ts`) en vez de `userCookie`: permite
   varios usuarios en una prueba (administrador, Director Comercial). La carrera de dos respuestas lleva una sola sesión.
4. **`const a` hoisted** en el manejador de avanzar (ver arriba).

## Lote 2 · aviso de 60 días + cliente

Partida `50aa56d`. Servidor con rojo previo (la prueba nació roja: módulo inexistente; la de `index.ts` roja hasta cablear la línea).
**Excepción declarada, no mía:** `PanelGarantiaProveedor.tsx`, el montaje en `TicketDetailView.tsx` y las llamadas de `client.ts` son
`.tsx`/cliente fuera de la red de pruebas por decisión de Gerencia (`CLAUDE.md`, «Pruebas de interfaz»; `vitest.config.ts:16-20`): sin rojo previo,
sin `jsdom` ni `@testing-library`; se verifican con `typecheck`, `lint` y `build`.

### Mutaciones del lote (cada una vista en rojo y restaurada)

| Id | Qué se movió | Prueba roja |
|---|---|---|
| M-AV-1 | quitar `AND aviso_60_at IS NULL` del `UPDATE` | «el UPDATE por sí solo: dos marcas…» y «dos pasadas concurrentes…» (la de pasadas secuenciales NO se pone roja: `fichasSinResolverNiAvisar` ya filtra por la marca; el `UPDATE` es la guarda de la carrera) |
| M-AV-2a | `crearAviso(db, …)` en vez de `(q, …)` (aviso fuera de la transacción) | las dos de estructura y «la pasada no lanza aunque crearAviso falle» |
| M-AV-2b | marcar sin crear el aviso | 13 rojas (todas las que miran avisos) |
| M-AV-2c | marcar ANTES de buscar destinatarios (D-11) | «sin nadie… no se marca» y las dos de estructura (orden SELECT→UPDATE) |
| M-AV-3 | `destinatariosDeCargoPermiso` filtra por `cargo` (firma) | 11 rojas, entre ellas «filtra por cargo_permiso…» |
| M-AV-3b | no cortar si no hay destinatarios (marcar igual) | «sin nadie ni en el cargo ni en el área…» |
| M-AV-5 | quitar el respaldo al área | «respaldo: si nadie lleva el cargo…» y «un usuario inactivo… avisa el área» |
| M-AV-6 | la pasada relanza el error | «con la base caída, la pasada resuelve…» |
| M-FV-5 | quitar `pasadaReclamaciones(pool)` de la línea de `index.ts:88` | «index.ts: la línea de la pasada periódica…» |

`avisoRitmoContrato.test.ts` y `alarmasSla.test.ts` NO se tocaron y siguen verdes: la línea cumple el texto
`pasadaRitmoContratos(pool).then(() => sync.syncRecent())` y el orden alarmas → ritmo → sincronización.

### Tabla de la regla invariable 13 (regla de mutación 3), con líneas REALES del árbol construido

Cliente: `apps/desk/src/components/PanelGarantiaProveedor.tsx` (`PG`). Servidor: `apps/desk/server/routes/garantiaProveedor.ts` (`RT`).

| # | Decisión del cliente | Cliente | La impone en el servidor |
|---|---|---|---|
| 1 | Enseña la pregunta, el formulario de edición, el botón de paso y el de resolver sólo a quien `puedeGestionarReclamacion` | `PG:176` (predicado), `:166`, `:122`, `:129`, `:141` | responder `RT:43` (G2), avanzar `RT:92` (G8), editar `RT:71` (G12) |
| 2 | Ofrece la pregunta «¿Se reclama?» sólo en la fila `pendiente` (vigente y sin respuesta) | `PG:166` | liberada `RT:45` (G3), no OVI `RT:47` (G4), ya respondida `RT:55` y `:59` (G6) |
| 3 | Las tres opciones del «no» salen de `MOTIVOS_NO_RECLAMA` | `PG:94` | motivo fuera de lista `RT:51-52` (G5, `validarRespuesta`) |
| 4 | Ofrece sólo el paso siguiente (`siguienteEstado`) | `PG:125`, `:126` | `RT:94-95` (G9) |
| 5 | Rellena el fabricante con `fabricantePropuesto` | `PG:84` | nada: es relleno; el servidor sólo exige fabricante no vacío (`RT:51-52` G5, `RT:76-77` G14) |
| 6 | Pinta «Pendiente de respuesta» | `PG:158` | no decide nada |
| 7 | Oculta Editar y los pasos en una ficha resuelta | `PG:122` | `RT:74` (G13) |
| 8 | Al resolver como «rechazada» no pide valor recuperado | `PG:146` | `RT:97-98` (G10, `validarPaso` acepta ausente y `0`) |
| 9 | No pinta el panel si no hay OVI | `PG:178` | no decide nada |
| 10 (no listada en el diseño) | Un campo numérico vacío viaja como `null`; uno no numérico viaja como texto, sin validar | `PG:27` (`numeroDelCampo`) | `RT:51-52` (G5), `RT:77` (G14), `RT:98` (G10): el servidor rechaza con `422` y el panel enseña su texto |

Ninguna decisión queda sin línea de servidor salvo las de «no decide nada» y el relleno (5), que el diseño ya declaraba así.

### Medida y desvíos

- Medida (`git diff --shortstat --no-renames 50aa56d` más `wc -l` de lo nuevo): ver el informe de entrega; no hay binarios.
- Desvío 1: el texto del aviso usa `diaEnZona(respondidaAt)` para «se abrió el …» (día civil de negocio), igual que el cálculo del vencimiento.
- Desvío 2: `numeroDelCampo` (decisión 10) no estaba en la tabla de §8 del diseño; se añade aquí con su línea.
- Límite conocido (2.8): liberar una orden en `PanelOvAsociaciones` no recarga este panel hasta reabrir el ticket.

## Medida de cada lote (registro = git, todos)

`git diff --shortstat --no-renames` contra la partida del lote más `wc -l` de lo nuevo sin trackear; el registro de intentos coincide con git en los cuatro.
Ninguno cruza la válvula de 720 ni el techo de 800.

| Lote | Commit | Líneas |
|---|---|---|
| 1a (`shared`, esquema, guardián) | `42b5f20` | **514** |
| 1a-2 (capa de datos y su prueba) | `5e1d9bc` | **340** |
| 1b (rutas y su prueba) | `50aa56d` | **587** |
| 2 (aviso de 60 días y panel) | `a4bb24d` | **674** |

Corrige lo que decía el lote 2 más arriba («ver el informe de entrega»): su medida es 674, la que el verify también midió (S-6).

## Cierre tras el verify (remediación de los avisos)

Partida `4a69412`. Todas las pruebas van al final de su fichero, salvo S-3 (en sitio, sin desplazar líneas). Cada una se vio en rojo por la mutación
que sobrevivió al verify, y todas se restauraron (el diff de cada fichero de producción quedó vacío).

| Aviso | Prueba nueva | Mutación que la pone roja |
|---|---|---|
| W-1 | `routes/garantiaProveedor.test.ts` · «respondidaPor guarda el nombre…» | C-RT-17: `por: user.name` → literal. Roja 1 |
| W-2 | `avisoReclamacionProveedor.test.ts` · dos usuarios en el cargo; dos en el área de respaldo | C-SV-11: `destinatarios.slice(0, 1)`. Rojas 2 |
| W-3 | rutas · editar con carrera; avanzar con carrera (texto del paso); avanzar sin fila (texto de recarga) | C-RT-19 quitar el 409 de editar (roja 1); C-RT-20 quitar el de avanzar (rojas 2); C-RT-18 cambiar el texto de recarga (roja 1) y quitar el texto del paso releído (roja 1) |
| S-1 | `shared/src/garantiaProveedor.test.ts` · RMA, pieza y valor como cadena (CARACTERIZACIÓN: la spec pide texto y número, y el código ya los exige) | C-SH-13 (roja 1), C-SH-9 (rojas 2), C-SH-16 (roja 1) |
| S-2 | `avisoReclamacionProveedor.test.ts` · ficha resuelta entre la selección y el `UPDATE` | C-SV-3: quitar `AND estado <> 'resuelta'`. Roja 1 |
| S-3 | `db/garantiaProveedor.test.ts:51-54`, título corregido y aserción del origen `manual`, en sitio | origen `null` si el valor es `null`. Roja 1 |
| S-7 | rutas · «el 403, el 422 y el 404 de responder no escriben ninguna fila» | G2 sin `return` (roja 2) y G4 sin `return` (roja 1); G5 sin `return` NO la pone roja y no es una mutación válida: sin valor válido la ruta falla antes de escribir |

Las carreras de W-3 se simulan envolviendo `db` (`conCarrera`): justo antes de la sentencia de escritura otra persona cambia la ficha, o la
escritura no encuentra fila. No se retuerce el código de producción.

**S-4**: `tasks.md` 1a.9 decía «las nueve funciones»; son ocho más la clase de error. Corregido en sitio.
**S-5 (hipótesis del verify, leída)**: `fmtDia` (`PanelGarantiaProveedor.tsx:25`) recorta el ISO UTC con `slice(0, 10)` y el aviso usa `diaEnZona`
(`avisoReclamacionProveedor.ts:56`): una respuesta dada entre las 19:00 y las 24:00 de Bogotá se ve con un día de más en el panel. **No se cambió**:
ningún componente del cliente usa hoy un formateador de día en zona de negocio (`diaEnZona` de `shared` no se importa en `apps/desk/src`; los demás
paneles usan `slice(0, 10)`, `toLocaleDateString` o `Intl.DateTimeFormat` sin zona fija), así que la edición no era «en sitio con uno ya usado».
**Citas (regla de mutación 4)**: barrido de `verify-report.md`, `apply-progress.md`, `design.md` y `proposal.md` contra los cinco ficheros del cambio, en el
árbol final. Rota: `verify-report.md` §3, G13, «`db:224`» (el fichero tiene 161 líneas; era la 117 + 107), reapuntada a `db:117`. El resto dice lo que afirma.
