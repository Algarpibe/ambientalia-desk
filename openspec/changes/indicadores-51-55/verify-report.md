```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:98a6a69f98f5287c4e8474df31a4b46fa8e3a520fb5efc6cfb0ffa843c9c273e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 83/83
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:6af60aa0cf1c307f9736b7531163644c11b44387d3962f19684c18ce5d301c0b
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:541ad36d1188f591acde2591790a82b0837bc424669645318f1a300a163f56da
```

# Verify — indicadores-51-55 (F1F-05, `cierra: no`)

Verificador independiente, 2026-10-07. Rama `indicadores-51-55`, cabeza `e365c68` (base `42a4828`), worktree aislado `C:\dev\Desk_2_R1.023-worktrees\indicadores-51-55`. Strict TDD activo; preflight auto · hybrid · 800 líneas. No se llamó a `gentle-ai sdd-attempt`, no hay commit ni push. Todo lo que dicen `apply-progress.md` y `tasks.md` se tomó como de segunda mano y se comprobó: ejecuciones, mutaciones y citas son mías. Las citas a ficheros que la tanda movió van ancladas a `e365c68` en la misma línea física.

## Veredicto: PASS WITH WARNINGS

**0 CRITICAL · 4 WARNING · 7 SUGGESTION.** Los cinco códigos de salida dan 0. De **107 mutaciones distintas** reproducidas (31 de la lista del diseño y 76 propias): **102 rojas, 3 equivalentes y 2 supervivientes reales**, las dos con la prueba que falta descrita abajo (W-1, W-2). Los 10 requisitos y los 83 escenarios de la delta tienen una prueba que corre en verde y afirma lo que el escenario dice.

## 1 · Ejecución (cada código lo corrí y lo miré)

| Comando | Salida | Resultado |
|---|---|---|
| `npm test` | **0** | 258 ficheros pasan y 2 saltados (260); **4.187 pruebas pasan, 7 saltadas (4.194)**; 185 s |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` sin errores |
| `npm run lint` | **0** | **165 problemas: 0 errores, 165 avisos** (los esperados; no suben) |
| `npm run build` | **0** | cliente compilado |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 6.747 comprobadas; 0 bloqueantes; línea base 0 informadas, 0 caducadas; 0 cabeceras R-1 inválidas; **13 abreviadas rotas** informativas, ninguna atribuida a un módulo de esta tanda |

`git status --short` quedó limpio tras la última mutación restaurada (sólo se añade este informe).

## 2 · Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · Superviviente real: la guarda «falta la marca de tiempo» se puede mover por delante de la del ticket y nada se pone rojo (regla de mutación 1).** `apps/desk/server/encuesta/analizarRespuestas.ts:175` en `e365c68` corre después de `:173-174`. Mutación: anteponer a `:173` una comprobación «marca vacía y ticket malo, motivo `sinMarca`»: 37 de 37 pruebas del analizador siguen verdes. Los pares de `analizarRespuestas.test.ts` («un motivo por fila, en el orden ticket, marca, calificación») usan `abc` con calificación vacía, marca ilegible con calificación vacía, ticket malo con marca ilegible, y `,12,` (marca y calificación ausentes con ticket válido), pero ningún par activa **a la vez** ticket malo y marca **vacía**. Prueba que falta: en esa misma prueba, dos filas `',abc,Bien'` (esperado `ticketNoNumerico`) y `',,Bien'` (esperado `sinTicket`). El orden ticket, marca, calificación es el que la delta fija (RQ-KP-20, «Un motivo por fila, en orden»).
- **W-2 · Superviviente real: la hora 24 se acepta.** `apps/desk/server/encuesta/analizarRespuestas.ts:140` en `e365c68` (`hora > 23`). Mutación a `hora > 24`: 37 de 37 verdes. La prueba «ilegible» (`analizarRespuestas.test.ts`, lista de `'2027-01-12 25:00'`, `'2027-01-12 08:60'`, `'2027-01-12 08:00:61'`…) no fija el borde. Prueba que falta: añadir `'2027-01-12 24:00'` a esa lista (esperado `marcaIlegible`). Con la mutación, `24:00` se leería como las 00:00 del día siguiente y la respuesta quedaría en otro día.
- **W-3 · Cuatro citas de estado de partida sin ancla (caso B, regla de mutación 4).** `openspec/changes/indicadores-51-55/design.md:90` cita `packages/shared/src/indicadores.test.ts:100-126`, `:106-111`, `:112-114` y `:115-125` como el «Hoy» («sin dato salvo entrada opcional», el `it.each` de dos instantes con `horaActualizacionEstado`). Esas líneas existen, pero **su contenido cambió** en el lote 1 (en `e365c68` el bloque se llama «51 y 55: el 51 sin fila de entrega y el 55 sin calificación» y sus casos son filas de entrega). Las filas vecinas (`:76`, `:306-315`, `:310`) sí llevan «en `42a4828`». El detector no lo ve porque comprueba que la línea exista, no que diga lo que la frase afirma. Reparación: «en `42a4828`» tras cada una, en la misma línea física.
- **W-4 · `tasks.md` queda con 17 casillas sin marcar (78 de 95), pero ninguna es trabajo real pendiente.** 1.21 a 1.23, 2.18 a 2.20, 3.16 a 3.18, 4.18 a 4.20 y 5.10 a 5.14 son commit, detector tras el commit y asentar el intento: del orquestador. Los cinco commits existen (`6fcf7e9`, `879d1d0`, `8abf407`, `cf004c4`, `e365c68`), el detector tras el commit lo corrí yo (salida 0) y 5.10 es lo que hace este verify (sección 1); sólo falta marcarlas y asentar. Se anota como WARNING y no como CRITICAL por esa razón: no hay código, prueba ni documento por hacer. Las tareas de persona P-1 a P-3 están fuera del recuento y declaradas aparte (regla del ciclo 1).

### SUGGESTION
- **SG-1 · `ON CONFLICT (huella) DO NOTHING` del `INSERT` de producción no tiene prueba que lo mire.** `apps/desk/server/db/encuestaRespuestas.ts:67` en `e365c68`. Quitarlo deja las 39 pruebas de capa de datos y de ruta verdes (equivalente en ejecución secuencial: la lectura previa de huellas ya excluye lo presente). La prueba «la red de la base» ejecuta un `INSERT` suelto, no `cargarRespuestas`. El límite lo declara el comentario de `apps/desk/server/db/encuestaRespuestas.ts:28-31` en `e365c68`: sólo se vería con dos cargas simultáneas.
- **SG-2 · Una aserción acopla a la forma del SQL.** La prueba «la cuarta consulta se acota por el periodo» de `apps/desk/server/indicadores.test.ts` compara el texto `FROM public.encuesta_respuestas e JOIN tickets t ON t.id = e.ticket_id WHERE `. Es una prueba de forma, declarada como tal por el apply (el `JOIN` solo no se distingue por la salida, porque `vistos.has` recorta igual: `apps/desk/server/indicadores.ts:87` en `e365c68`). Mutar el `JOIN` o los parámetros la pone roja (M18b, O67), así que cumple su cometido.
- **SG-3 · La evidencia TDD está en prosa por lote, no en una tabla única de ciclo.** `apply-progress.md` trae, por lote, «Pruebas añadidas y rojo previo observado» con el fallo de cada una, los «verdes de nacimiento» declarados como regresión y las mutaciones. Equivale a RED/GREEN/TRIANGULATE; sólo cambia el formato.
- **SG-4 · «Diez tickets, cuatro consultas» se prueba con 2 y con 20 tickets.** `it.each([2, 20])` de `apps/desk/server/indicadores.test.ts` afirma exactamente cuatro `SELECT`; con dos tamaños distintos queda probada la independencia del número de tickets, que es lo que el escenario pide.
- **SG-5 · Los paquetes 04 y 04b dicen «F1F-05 sólo lee (`apps/desk/server/indicadores.ts:51-55`)».** `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:383` y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:571`. La línea sigue siendo cierta de ese comentario (dice «lectura»), pero el homónimo F1F-05 de hoy sí escribe. Si se quiere evitar la lectura equivocada, anclar «en `42a4828`».
- **SG-6 · La tanda editó una línea de un informe archivado.** `openspec/changes/archive/2026-10-03-continuidad-indicadores/verify-report.md`: un ancla «en `42a4828`» (caso B). Es lo que la regla de mutación 4 pide para una cita que dejó de ser cierta, pero es un fichero archivado; queda anotado.
- **SG-7 · El hallazgo de `instanteDeJornada` está confirmado por mí.** `packages/shared/src/calendarioLaboral.ts:155` en `e365c68`: ejecutada con el día `2027-01-12`, la hora 0 da `2027-01-11T05:00:00.000Z`, la 2 `2027-01-11T07:00:00.000Z`, la 4 `2027-01-11T09:00:00.000Z` y la 8 `2027-01-12T13:00:00.000Z`. El analizador lo rodea midiendo el desplazamiento a mediodía (`apps/desk/server/encuesta/analizarRespuestas.ts:144-147` en `e365c68`) y no lo corrige; el destino queda «sin destino asignado» en el apartado 14 del paquete. Sin acción en esta tanda.

## 3 · Conformidad con el alcance (punto 2)

| Comprobación | Resultado |
|---|---|
| Sin diff en `apps/desk/src`, `transitions.ts`, `bodegaje.ts`, `ticketService.ts`, `remision.ts`, `reentrancia.ts`, `docs/sdd/ENTRADA.md`, `openspec/config.yaml`, el plan R01.4 y `.env.example` | `git diff --stat 42a4828 e365c68 -- <esas rutas>`: vacío |
| `horaActualizacionEstado` en `apps` y `packages` (`.ts` y `.tsx`) | 0 resultados (sólo existe armado por concatenación en la prueba) |
| `CREATE TABLE` calificado y al final de `schema.sql` | `packages/zoho-sync/src/db/schema.sql:787` en `e365c68` (`public.encuesta_respuestas`) y el índice en `:796`; son la penúltima y la última sentencia; ensuciar el fichero lo pone rojo (M7, M10) |
| Ningún `UPDATE` ni `DELETE` sobre `encuesta_respuestas` en código no de pruebas | búsqueda en `apps` y `packages` (`.ts` y `.sql`): 0 |
| El `GET` no escribe | prueba «el GET no escribe» y la mutación O69 (un `UPDATE` tras el `SELECT`) la pone roja con 9 pruebas |
| Ficheros tocados fuera de lo previsto | sólo `DEPLOY.md`, `F0-01_Correcciones…`, los tres `Paquete_de_Despliegue_*` (anclas caso B) y el `verify-report.md` archivado (SG-6); todos documentales |
| Cambios mínimos en ficheros muy citados | `calendarioLaboral.ts` gana sólo `export` en `:155`; `migrate.ts:73` gana un nombre; `app.ts` cambia las líneas 22 y 61 en sitio (mismas líneas) |

Decisiones del diseño comprobadas contra el código: DD-1 y DD-2 (hito `transición de entrega` tras `Fecha Finalización ST`, `packages/shared/src/indicadores.ts:86` y `:133` en `e365c68`); S-A (última entrega por `performedAt`, `:260`); S-B (orden de motivos, `:230-231`); DD-7 (`insertadas` contada en memoria, `apps/desk/server/db/encuestaRespuestas.ts:71` en `e365c68`); DD-8 (`IN` por bloques, `apps/desk/server/db/encuestaRespuestas.ts:14`, `:37` y `:57` en `e365c68`); DD-10 y DD-12 (ruta `POST /api/indicadores/encuesta`, éxito `200`); DD-11 (la cuarta consulta ordena y el cálculo se queda con la última, `apps/desk/server/indicadores.ts:85-87` en `e365c68`); D5 (orden exacto sesión, administrador, multer, manejador, `apps/desk/server/routes/encuestaRespuestas.ts:19` en `e365c68`). Sin desviaciones.

## 4 · Regla 13 (punto 4): las seis líneas de la tabla de `tasks.md`

Ninguna decisión del cliente: no hay diff en `apps/desk/src`. Las seis filas, leídas por mí en `e365c68`:

| # | Línea citada | Qué dice la línea | ¿Coincide? |
|---|---|---|---|
| 1 | `apps/desk/server/routes/encuestaRespuestas.ts:19` | `app.post(…, requireAuth(db), requireAdmin, subida.single('file'), …)` | sí |
| 2 | `apps/desk/server/routes/encuestaRespuestas.ts:20` y `:22` | `if (!req.file)` con `400`; `if (!a.ok)` con `400` | sí |
| 3 | `apps/desk/server/encuesta/analizarRespuestas.ts:173-179` y `apps/desk/server/db/encuestaRespuestas.ts:48` | de la lectura del ticket a la comprobación de calificación vacía; `ticketId === undefined` con `MOTIVO_TICKET_INEXISTENTE` | sí |
| 4 | `apps/desk/server/encuesta/respuesta.ts:18` y `packages/zoho-sync/src/db/schema.sql:792` | `export function huellaRespuesta`; `huella text NOT NULL UNIQUE` | sí |
| 5 | `apps/desk/server/indicadores.ts:85` y `:87` | la consulta `ORDER BY e.respondida_at, e.id`; el bucle que deja la última | sí |
| 6 | `packages/shared/src/indicadores.ts:254` y `:257` | `TRANSICIONES_DE_ENTREGA`; `function hitoEntrega` | sí |

Cada una está además probada por mutación: la 1 y la 2 por M1 a M4 y O1 y O2; la 3 por M6 y O12; la 4 por M8 y M14; la 5 por M16 a M18; la 6 por M12, M13 y M19.

## 5 · Tabla 1 — cobertura de la spec (83 escenarios, 10 requisitos)

Siglas: SH `packages/shared/src/indicadores.test.ts`; SV `apps/desk/server/indicadores.test.ts`; RI `apps/desk/server/routes/indicadores.test.ts`; AN `apps/desk/server/encuesta/analizarRespuestas.test.ts`; HU `apps/desk/server/encuesta/respuesta.test.ts`; DB `apps/desk/server/db/encuestaRespuestas.test.ts`; RT `apps/desk/server/routes/encuestaRespuestas.test.ts`; MG `packages/zoho-sync/src/db/migrate.test.ts`. Todas corrieron en verde (sección 1). Marca ✅ = cumple (prueba que corre y afirma lo que dice el escenario).

**RQ-KP-02 (6)** ✅ historial gana = SH «K9 el historial gana»; sin historial = SH «K8 heredado»; último valor = SH «dos cotizaciones…»; instante cercano a medianoche = SH «la finalización se lee en Bogotá» y el borde `2027-01-09T03:00:00Z` del 51; marca de entrega sin columna = SH «con finalización y Fecha Remisión de Salida pero sin fila de entrega» (la mutación M20 la pone roja); el hito de entrega lleva su fuente = SH it.each «una entrega_al_cliente» (`fuente` `transicion`).

**RQ-KP-09 (12)** ✅ 51 con una entrega = SH it.each «una entrega_al_cliente» y SV «el 51 desde el historial, de punta a punta»; `entrega_sin_factura` = SH it.each fila 2; dos entregas = SH it.each «dos entregas» y «filas desordenadas»; entrega anterior = SH it.each «entrega anterior» (−2 con `orden_invertido`); sin fila de entrega = SH «51 sin dato: motivos y orden» (1.º); entrega sin finalización = SH (2.º) y K13; sin entrega ni finalización = SH (3.º, el par de posición; M5 lo pone roja); constante no inventa transiciones = SH «guardián de TRANSICIONES_DE_ENTREGA» (a) y (b); ya no existe la entrada = SH «ya no existe la entrada de hora…» (dos ficheros); 55 con respuesta = SH «el 55 con calificación Excelente», RI «dos respuestas… el 55 sale calculado» (`estado` `calculado`) y SH «las unidades y el orden» (`unidad`; O61 la pone roja); 55 sin respuesta = SH, SV «sin respuesta» y RI; valor de Zoho = SH «el 55 sin calificación y con Good de Zoho».

**RQ-KP-10 (6)** ✅ cotización escrita dos veces, una sola vez y ticket heredado = las tres de SH ya existentes («dos cotizaciones…», «una sola cotización…», «sin historial: null»); el 51 con dos filas de entrega = SH «51 reentrante: las dos entregas se cuentan juntas» (mismo id y `entrega_sin_factura` más `entrega_al_cliente`; O60 la pone roja); una sola fila y sin historial = SH «una sola fila de entrega: false; ticket sin historial: null».

**RQ-KP-11 (7)** ✅ 50·53, 49, 54 sin promesa, 54 difiere y 47 de Zoho = las pruebas existentes de SH (sólo cambió el tercer argumento de la del 47); el 51 sin variante de Zoho = SH «el 51 calculado sigue sin variante de Zoho» (O62 la pone roja); el 55 con variante igual = SH «el 55 con calificación Excelente: valor y variante son la misma letra» (O63).

**RQ-KP-14 (2)** ✅ diez tickets = SV it.each `[2, 20]` «EXACTAMENTE cuatro consultas, todas SELECT» (SG-4); veinte tickets = SV «veinte tickets, algunos con respuestas y otros sin ellas» y RI «veinte tickets… cuatro lecturas de datos… en JSON y en CSV».

**RQ-KP-18 (3)** ✅ una petición no deja rastro = RI (`noSelect(todas)` en la prueba de la comparación y en la de veinte tickets); sin elementos de tablero = RI «sin veredicto en la respuesta y con las mismas cuatro lecturas»; la carga no abre la puerta a otras escrituras = RT «RQ-KP-18 · tras una carga válida las únicas sentencias de escritura nombran public.encuesta_respuestas» (comprueba por texto de sentencia que sólo hay `INSERT INTO public.encuesta_respuestas`).

**RQ-KP-19 (7)** ✅ la tabla existe, calificada, siete columnas, sin `canal`, índice = MG «el CREATE va calificado con public. y es la PENÚLTIMA sentencia…» y «la tabla existe tras migrate»; el guardián de esquema la vigila = MG «toda tabla del esquema está clasificada…» y «PUBLIC_TABLES la contiene» (M7 y M11 rojas); huella repetida no inserta = MG «un segundo INSERT con la misma huella falla con 23505» y DB «recarga del mismo fichero»; dos respuestas del mismo ticket = MG (misma prueba) y DB «dos respuestas del mismo ticket con distinta marca»; cada campo cuenta = HU «cada campo de la huella cuenta» (M14 a, b, c); ignora lo que no es contenido = HU (espacios, desplazamiento, NFC, sin `cargadoPor` en la firma) y DB «una recarga por otra persona sigue siendo duplicada»; la base rechaza lo incompleto = MG «la base rechaza ticket_id, calificacion, respondida_at, huella y cargado_por nulos, y una calificacion vacía» (M9, O20 a O22, O26).

**RQ-KP-20 (15)** ✅ separador `;` con BOM y separador `,` = AN «separador `;` con BOM y separador `,` dan las mismas filas» (más «el BOM se descarta antes de leer»); columnas por nombre = AN «reconoce las columnas por nombre…»; cabecera irreconocible = AN (nombra TODAS las que faltan); fichero vacío = AN «fichero vacío, de blancos o sólo con BOM»; cabecera ambigua = AN (dos pruebas); una fila mala no tira las demás = AN «su fila es la 3 y leídas es 3»; un motivo por fila, en orden = AN «un motivo por fila…» (cubre los pares que dice el escenario; el par de W-1 queda sin fijar); marca ausente = AN «marca ausente»; líneas en blanco = AN «una línea en blanco entre dos filas»; calificación recortada = AN «la calificación se guarda recortada…»; ticket no reconocible = AN «ticket: vacío, no numérico, `#123`…»; marca en Bogotá = AN «sin zona es hora de pared de Bogotá» (M25) y la propiedad con `diaEnZona`; marca ilegible = AN «ilegible…» (el borde de W-2 queda sin fijar); pureza = AN «importa SÓLO ./respuesta…».

**RQ-KP-21 (19)** ✅ sin sesión (válido, vacío, otro campo, sobre el límite) = RT it.each «sin cookie…» y «401 ↔ 413» (4 escenarios); con sesión y sin rol (válido, vacío, cabecera irreconocible, otro campo, sobre el límite) = RT it.each «usuario sin administrador con %s» y «403 ↔ 413»; sin fichero = RT «administrador sin fichero»; fichero vacío = RT «hipótesis 4»; cabecera irreconocible = RT; fichero en otro campo (administrador) = RT «campo intruso»; administrador sobre el límite = RT `413`; carga válida = RT «carga válida: 200 con { leidas: 4, … }»; ticket inexistente = RT y DB; huella repetida dentro del fichero = RT y DB; el actor sale de la sesión = RT (M26); recarga = RT y DB; dos respuestas del mismo ticket = RT y DB; filas malas mezcladas = RT. Pruebas de posición (regla de mutación 1) con dos guardas activas a la vez: M1, M2, M3 y M4 las ponen rojas (sección 6).

**RQ-KP-22 (6)** ✅ dos respuestas = SV y RI «dos respuestas del mismo ticket»; se carga primero la más reciente = SV (M16, O65, O66); desempate por id = SV (id explícito en orden inverso; M17); sin respuesta = SV, RI y SH; el `GET` no escribe = SV «el GET no escribe» y RI (O69); fuera del periodo = SV «la respuesta de un ticket de otro periodo…» y RI (M18a, M18b).

## 6 · Tabla 2 — mutaciones reproducidas por mí

Método: cada una se aplicó sobre el fichero indicado, se corrió el conjunto de pruebas afectado, se anotó cuántas se pusieron rojas y cuál la cazó, y se restauró con `git checkout -- <fichero>` (nunca `git stash`). Las líneas son las de `e365c68`.

### 6.1 · Las del diseño (D9), 31 ejecuciones — todas rojas

| Mutación | Dónde | Rojas | La caza |
|---|---|---|---|
| M1 `subida.single` delante de `requireAdmin` | `apps/desk/server/routes/encuestaRespuestas.ts:19` | 2 | «403 ↔ multer» (campo `intruso`) y «403 ↔ 413» |
| M2 `subida.single` delante de `requireAuth` | `apps/desk/server/routes/encuestaRespuestas.ts:19` | 4 | los pares «401 ↔ multer», «401 ↔ 413» y los dos de 403 |
| M3 `requireAdmin` delante de `requireAuth` | `apps/desk/server/routes/encuestaRespuestas.ts:19` | 20 | las de 401 y las de la carga |
| M4a quitar `!req.file` | `apps/desk/server/routes/encuestaRespuestas.ts:20` | 1 | «administrador sin fichero» |
| M4b quitar `!a.ok` | `apps/desk/server/routes/encuestaRespuestas.ts:22` | 3 | cero bytes, cabecera irreconocible, «el fichero malo gana a la carga» |
| M5 permutar las ausencias de `v51` | `packages/shared/src/indicadores.ts:230-231` | 1 | «sin entrega ni finalización manda el primer motivo» |
| M6 calificación antes que ticket | `apps/desk/server/encuesta/analizarRespuestas.ts:173` | 1 | «un motivo por fila, en orden» |
| M7 `CREATE` sin `public.` | `packages/zoho-sync/src/db/schema.sql:787` | 2 | guardián de clasificación y bloque nuevo |
| M8 sin `UNIQUE` de `huella` | `packages/zoho-sync/src/db/schema.sql:792` | 1 | `23505` |
| M9a quitar `NOT NULL` de `ticket_id`; M9b quitar el `CHECK` | `packages/zoho-sync/src/db/schema.sql:789` y `:790` | 1 y 1 | «la base rechaza…» |
| M10 un `CREATE` delante del de `contrato_ampliaciones` | `packages/zoho-sync/src/db/schema.sql:773` | 4 | posiciones del bloque nuevo y de las pruebas vecinas |
| M11 quitar el nombre de `PUBLIC_TABLES` | `packages/zoho-sync/src/db/migrate.ts:73` | 3 | clasificación, recuento y `PUBLIC_TABLES la contiene` |
| M12 renombrar `entrega_al_cliente` en el catálogo | `packages/shared/src/transitions.ts:250` | 2 | guardián (a) y (b) |
| M13a quitar un id; M13b añadir uno inventado | `packages/shared/src/indicadores.ts:254` | 3 y 2 | (b) y el escenario de `entrega_sin_factura`; (a) y (b) |
| M14a, b, c huella sin ticket, sin calificación, sin instante | `apps/desk/server/encuesta/respuesta.ts:21` | 2, 3, 2 | «cada campo cuenta» y «la fórmula es la de la spec» |
| M16 `ORDER BY … DESC` | `apps/desk/server/indicadores.ts:85` | 4 | «dos respuestas», «más reciente primero», desempate y la de la ruta |
| M17 quitar `e.id` del `ORDER BY` | `apps/desk/server/indicadores.ts:85` | 1 | «desempate por id» |
| M18a quitar `vistos.has` | `apps/desk/server/indicadores.ts:87` | 1 | «ticket de otro periodo» |
| M18b quitar el `JOIN` con el periodo | `apps/desk/server/indicadores.ts:85` | 1 | «la cuarta consulta se acota por el periodo» (prueba de forma, SG-2) |
| M19 `hitoEntrega` toma la primera entrega | `packages/shared/src/indicadores.ts:260` | 4 | «dos entregas» y «filas desordenadas» |
| M20 caer en `Fecha Remisión de Salida` sin fila de entrega | `packages/shared/src/indicadores.ts:229` | 1 | «con finalización y Fecha Remisión de Salida pero sin fila de entrega» |
| M21 signo invertido | `packages/shared/src/indicadores.ts:232` | 12 | el 51 en todas sus formas y la de punta a punta |
| M22 día en UTC | `packages/shared/src/indicadores.ts:260` | 2 | borde `2027-01-09T03:00:00Z` |
| M23 sin filtro de huellas presentes | `apps/desk/server/db/encuestaRespuestas.ts:60` | 3 | las dos «recarga» y «recarga por otra persona» |
| M24 una consulta de ticket por fila | `apps/desk/server/db/encuestaRespuestas.ts:36` | 2 | «con 20 filas» y «con trozo = 2» |
| M25 marca sin zona leída como UTC | `apps/desk/server/encuesta/analizarRespuestas.ts:147` | 7 | «marca de tiempo en Bogotá» y las que dependen de ella |
| M26 `cargado_por` del cuerpo | `apps/desk/server/routes/encuestaRespuestas.ts:24` | 1 | «el actor sale de la sesión» |

No reproducidas, con motivo: M15 no se puede mutar como dice el diseño porque la firma de `huellaRespuesta` no admite `cargadoPor` ni la fila (lo cubre la prueba de firma de HU); se sustituyó por O28 (meter ruido en la mezcla), roja con 2. M12 «aparte» (dar `Fecha Remisión de Salida` a otra transición) y M4c (cargar antes de comprobar `!req.file`) no se repitieron: la segunda es equivalente por el propio diseño (`cargarRespuestas` con `filas` vacío no toca la base). M27 no aplica.

### 6.2 · Propias (76 distintas)

Rojas (71), por grupos (entre paréntesis, pruebas rojas):
- **Ruta** (O1 a O8): quitar `requireAdmin` (6), quitar `requireAuth` (20), `rechazadas` sin ordenar (1), sólo las del analizador (2), `leidas` igual a las filas buenas (2), estado `201` (7), `duplicadas` en 0 (3), mensaje de cabecera genérico (1).
- **Capa de datos** (O9 a O13, O15 a O18): duplicada dentro del fichero contada como insertada (3), `insertadas` igual a las filas leídas (8), `duplicadas` sin las presentes (2), ticket inexistente ignorado (3), `ticket_id` igual al número en vez del id (3), `cargado_por` fijo (4), `INSERT` por fila (2), sin transacción (20, por rotura de la función), `IN` sin bloques (1).
- **Esquema, regla de mutación 2** (O20 a O26): sin `NOT NULL` en `respondida_at`, `cargado_por`, `huella` (con `UNIQUE`) o `calificacion` (1 cada una), columna `canal` (1), sin el índice (1), `UNIQUE(ticket_id, huella)` en vez de `huella` sola (1).
- **Huella** (O27 a O33): sin versión (1), sin NFC (1), sin colapsar espacios (1), sin recorte (1), con mayúsculas plegadas (2), instante crudo (1), `md5` (2).
- **Analizador** (O35, O36, O38 a O53, O55 a O58, O71, O73 a O75): calificación antes que marca (1), calificación de sólo espacios válida (1), ticket `0` válido (1), tope `integer` más uno (1), cabecera sin minúsculas (28), sin quitar acentos (7), BOM sin quitar (1), `fila` desfasada en uno (6), `leidas` sin rechazadas (1), línea en blanco que cuenta (2), separador siempre coma (5), empate a `;` (1), `DD/MM` invertido (4), 31/02 aceptado (2), `p. m.` ignorada (1), «12 a. m.» mal (1), zona escrita ignorada (1), signo de zona invertido (1), comilla doblada rota (1), ambigua que toma la primera (2), «faltan» que nombra sólo una (2), sinónimo por palabra retirado (1), decodificar sin `fatal` (2), una fila mala rechaza todo el fichero (2), marca sin hora a 00:00 UTC (1), guarda `sinMarca` retirada (2).
- **Cálculo y lectura** (O59 a O70, O72): 51 sin exigir finalización (2), reentrante que cuenta un solo id (1), unidad del 55 cambiada (1), 51 con variante calculada (1), 55 con variante distinta (1), orden de hito invertido (1), `ORDER BY` sólo por id (1), id antes que fecha (1), `JOIN` sin periodo pero con `vistos` (1), el 55 toma la primera (4), el `GET` que escribe (9), la calificación no llega a `tablaIndicadores` (4), ruta sin registrar en `app.ts` (26).

Equivalentes (3), con razón:
- **O14** quitar `ON CONFLICT (huella) DO NOTHING` (`apps/desk/server/db/encuestaRespuestas.ts:67` en `e365c68`): 39 de 39 verdes. La lectura previa de huellas ya excluye lo presente; sólo cambia ante dos cargas simultáneas, que el comentario de `apps/desk/server/db/encuestaRespuestas.ts:28-31` en `e365c68` declara como límite (SG-1).
- **O19** quitar el `return` temprano de `filas.length === 0` (`apps/desk/server/db/encuestaRespuestas.ts:32` en `e365c68`): 39 de 39 verdes. Con la base de la prueba (sin `connect`) un lote vacío no emite ninguna sentencia aunque no haya `return`; con un pool real emitiría un `BEGIN` y un `COMMIT` vacíos, inocuos.
- **O37b** que la expresión del ticket admita el signo (`apps/desk/server/encuesta/analizarRespuestas.ts:104` en `e365c68`): 45 de 45 verdes. El número negativo lo rechaza igualmente `numero >= 1` en `:105`; son dos guardas redundantes (la prueba de «cero» fija la segunda).

Supervivientes reales (2): **W-1** (guarda `sinMarca` por delante de la del ticket; O34 y O76 son la misma) y **W-2** (hora 24, O54).

## 7 · Citas (punto 5, regla de mutación 4)

Muestra de **más de 70 citas** `ruta:línea` comprobadas contra el fichero y contra lo que la frase afirma: las de `DEPLOY.md` (`schema.sql:787`, `:792`, `:796`, `encuestaRespuestas.ts:19`, `indicadores.ts:85`, y `app.ts:86`, que es el `413` del manejador central); la corrección 33 (`R08.4.md:6299`, `:2957`, `:2963`, `:2969`, `:2970`: cada una dice lo que la corrección cita); el apartado 14 del paquete de 2026-10-06 (`indicadores.ts:254` y `:257`, `schema.sql:787`, `encuestaRespuestas.ts:19`, `indicadores.ts:85`, `calendarioLaboral.ts:155` y `:155-166`, `R08.4.md:2969` y `:2970`); y de `design.md`, `proposal.md`, `tasks.md` y `apply-progress.md`: las ancladas a `42a4828` contra `git show 42a4828:<ruta>` (`indicadores.ts:228-232`, `:241`, `:246`, `:133`, `:86`; `migrate.test.ts:282`, `:283`, `:284-286`, `:652`, `:794`, `:796`, `:798`, `:822`, `:825`, `:837`, `:839`, `:840`; `indicadores.test.ts:76`, `:306-315`, `:310`, `:6`, `:53`, `:58`, `:78`, `:13`, `:183`, `:186`, `:190`) y las vivas (`middleware.ts:14-23` y `:26-29`, `app.ts:84-89`, `subida.ts:10-11`, `transaccion.ts:13-28`, `appHarness.ts:34-40`, `:46` y `:86-95`, `reentrancia.ts:78-83`, `migrate.test.ts:266-275` y `:825-858`, `indicadores.ts:76`, `:77`, `:84`, `:223`, `:233`, `:238`).

**Falsas: ninguna.** Las cuatro de W-3 existen y están en rango, pero hablan del estado de partida sin decirlo. Además comprobé que las demás citas al módulo del servidor (`:76`, `:57-64`, `:61`, `:69`) y al de `packages/shared` (`:125`, `:134`, `:141`) siguen diciendo lo mismo: el cambio del servidor empieza en la línea 85 y el fichero de `packages/shared` sólo creció al final. Las 13 abreviadas rotas del detector son anteriores a la tanda (ninguna atribuida a `indicadores`, `schema.sql`, `migrate`, `encuesta` ni `calendarioLaboral`).

## 8 · Casillas (punto 7)

78 hechas de 95; 17 pendientes (W-4): 1.21 a 1.23, 2.18 a 2.20, 3.16 a 3.18, 4.18 a 4.20 y 5.10 a 5.14, todas del orquestador (commit, detector tras el commit, asentar el intento, cierre y medida del lote 4). Trabajo real sin hacer: **ninguno**. Tareas de persona P-1, P-2 y P-3: fuera del recuento, con dueño, destino y dónde queda escrito (`tasks.md`, «Tareas de personas»); archivar no las da por hechas.

## 9 · Sostén del `cierra: no` (punto 8)

La tanda cubre el cálculo del 51 desde la transición de entrega y el almacén, la carga y la lectura del 55 (tabla `public.encuesta_respuestas`, analizador supuesto, `POST /api/indicadores/encuesta` y cuarta consulta del `GET`), y deja fuera la comparación con la exportación de Zoho, el canal de la encuesta y toda pantalla de carga; por eso la fila F1F-05 no se cierra.

## 10 · TDD estricto

- **Evidencia reportada:** sí, por lote en `apply-progress.md` («Pruebas añadidas y rojo previo observado», con el fallo de cada una; «verdes de nacimiento» declarados), no como una única tabla (SG-3).
- **RED:** todos los ficheros de prueba existen (`analizarRespuestas.test.ts`, `respuesta.test.ts`, `encuestaRespuestas.test.ts` en `db` y en `routes`, y las ediciones de `indicadores.test.ts` ×3 y `migrate.test.ts`). **GREEN:** todos pasan en la corrida completa y se volvieron a correr tras cada mutación restaurada.
- **Triangulación:** adecuada. Ejemplos: 6 casos en el it.each del 51, dos ids de entrega por separado y juntos, 2 y 20 tickets, tres campos de huella, 15 escenarios del analizador.
- **Calidad de aserciones:** sin tautologías ni bucles que puedan correr en vacío (el bucle sobre `TRANSICIONES_DE_ENTREGA` va precedido de una aserción de longitud). Los `toEqual([])` de «ninguna sentencia nombra la tabla» tienen la contraparte positiva en «carga válida» y en RQ-KP-18, que sí ve sentencias. Un acoplamiento a la forma del SQL declarado (SG-2). Sin `vi.mock`.
- **Capas:** todo unitario o de integración con base en memoria (`pg-mem`) y `supertest`; sin `jsdom` por decisión de Gerencia (F0-00).

## 11 · Veredicto

**PASS WITH WARNINGS.** Sin CRITICAL: los 10 requisitos y los 83 escenarios están cubiertos por pruebas en verde, las cinco salidas dan 0, el alcance es el declarado y la regla 13 cumple línea a línea. Antes de archivar conviene cerrar W-1 y W-2 (dos aserciones nuevas en `analizarRespuestas.test.ts`) y W-3 (cuatro anclas «en `42a4828`» en `design.md`), y marcar las casillas de W-4 al asentar; ninguna cambia el comportamiento construido.
