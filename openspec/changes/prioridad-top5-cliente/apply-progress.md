# Apply-progress · `prioridad-top5-cliente` (F1B-07, `cierra: no`) · Lote 1

Fase 0 (0.1-0.4) y lote 1 (1.1-1.20) ejecutados; lotes 2 y 3 sin tocar. HEAD de partida `cdf610e`.
**Las casillas de `tasks.md` NO se marcaron:** cada una cuesta `+1 −1` en el ledger (24 casillas = +48) y habrían llevado el lote de 697 a ~745, por encima de la válvula de 720. Supuesto del orquestador (reversible): se marcan en el commit del lote 2, que tiene margen (~570 estimados).

## Base y cierre
- Base (0.2): 162 ficheros (161 pasan, 1 omitido), 2.046 pruebas (2.044 + 2 omitidas), **165 avisos**. `typecheck` verde.
- Cierre: 164 ficheros (163 + 1 omitido), 2.132 pruebas (2.130 + 2 omitidas), `typecheck` verde, **165 avisos** (cero nuevos, ningún `any`).
- 0.3: `schemaStatements()` = **N = 117**; la `ALTER` de `cargo_permiso` es la única que la menciona y está en la posición **116** (N−1). 0.4: `puedeFijarPrioridadTop5(` sin llamadores fuera de pruebas; `cliente_prioridad|prioridad_ajustes|Top5` = 0 fuera de `cargos*`.
- Medida: 16 ficheros, `633 insertions(+), 29 deletions(-)` = 662 sin este fichero (techo 800, válvula 720).
- En sitio, medido con `git diff --numstat` y `wc -l`: `contratos.ts` 242 (+5 −5), `ticketService.ts` 234 (+2 −2), `migrate.ts` 131 (+1 −1), `app.ts` 96 (+2 −2), `cargos.ts` 98 (+1 −1), `index.ts` 25→26 (+1 −0), `schema.sql` 601→622 (+21 −0).

## Rojos naturales confirmados (con su motivo)
- 1.1: `./prioridad` no existe (fichero entero rojo por importación). 1.2: 5 casos rojos de la tabla: el Top 5 se ignoraba (la función de hoy no lee el tercer argumento).
- 1.7: `[10, 22, 3]` ≠ `[10, 24, 3]` y 35 ≠ 37; las dos tablas no existen (6 rojos).
- 1.11-1.13: las rutas daban el 404 del comodín (`app.ts` `/api`); `PM20-2` sin llamador; el alta ignoraba el Top 5 (TC24-5, TC24-8, TC24-14 rojos).

## Nacidos verdes (declarados)
- `contratos.test.ts:77` y `:79` (el argumento de más se ignora). 1.7(b): la `ALTER` ya era N−1 (suelo de PM13-2, se discrimina con (o)).
- Alta: TC24-1..4, 10..12 (ya fijados), TC28-2, y además **TC24-6, TC24-9, TC24-13, TC24-15**: el comportamiento de hoy ya da ese resultado (el contrato ya da `High`; sin Top 5 no hay herencia).
- **TC24-16** se escribió en el mismo paso que `db/prioridadCliente.ts`: no se vio en rojo aislado.

## Hipótesis de 1.8: RESUELTA, sin plan B
pg-mem admite `CONSTRAINT <nombre> CHECK (motivo <> '')` a nivel de columna (rechaza `''`), `INSERT … ON CONFLICT (client_id) DO UPDATE … RETURNING` y el `LEFT JOIN` a la vista `clients`. Hipótesis de 1.12 (`node:fs` en `environment: 'node'`): también cierta.

## Mutaciones ejecutadas y revertidas (el árbol vuelve a su estado)
- (f) `prioridadMasAlta` devuelve `b`: 15 rojos (tabla de `prioridad.test.ts`, incluida «contrato + Low», y `contratos.test.ts`). (n) `'Alta'` en `PRIORIDADES_ASIGNABLES`: 5 rojos (igualdad con `transitions.ts:84`). (f2) `Urgent` fuera de `RANGO`: 2 rojos («`Urgent` gana a `High`»).
- (g) `cliente_prioridad` sin calificar: rojo el guardián de pertenencia y la prueba de calificación (el de recuento sigue verde: la tabla existe). (h) sin `CHECK`: rojo «motivo vacío». (o) sentencia delante de la `ALTER`: rojo la posición 116. (p) tablas intercambiadas: rojo el orden.
- (e) `null` como tercer argumento de `ticketService.ts:106`: rojos TC24-5, TC24-8, TC24-14. **TC24-6 no lo discrimina** (el contrato ya da `High`). (m) 404 detrás del 403: rojo «A < B». (p2) 422 antes del 403: rojo TC27-7. (q) `canExecuteTransition(…, 'Comercial')`: rojos TC27-3, TC27-7, TC28-1, PM23-1, PM20-2. (r) sin llamar al predicado: 8 rojos (PM20-2, TC27-3/4/7, TC28-1, PM23-1/2/3).
- **Reproducidas por el orquestador (2026-10-01), mismos rojos:** (f) 15, (f2) 2, (n) 5, (g) 2, (h) 1, (o) 1, (p) 1, (e) 3 (TC24-5, TC24-8, TC24-14), (m) 1, (p2) 1, (q) 5; restauradas con copia y `cmp`. (r) no se reprodujo.

## Barrido de la regla de mutación 4
- Ningún fichero muy citado perdió ni ganó líneas (`+n −n`); los añadidos de `schema.sql`, `index.ts` y las pruebas van al final. Sin desplazamientos: `migrate.ts:63-64`, `:70-73`, `migrate.test.ts` y `app.ts:61` siguen señalando lo mismo.
- Caso A, reparadas: `contratos.ts:65` (comentario, «la más alta»), `cargos.ts:78` («la llama el PUT») y el título de `cargos.test.ts:117`.
- Caso B, sin tocar: `Paquete_de_Despliegue_2026-09-29/30.md` (fechados). `Preguntas_Gerencia_2026-09-29.md:77` dice «`High` al nacer si el lote tiene contrato vigente»: sigue cierto.
- `openspec/specs/tickets-core/spec.md:863-868` (`ticketService.ts:106` en `9288779`) queda para el delta de RQ-TC-24 al archivar. `contratos.test.ts:75` conserva «High con contrato vigente»: describe la fila con Top 5 `null`.

## Lote 2a — `priority` opcional, guarda del técnico y ajuste por ticket (2.1 a 2.13; sin commit)
- **Hecho:** 0.1-0.4, 1.1-1.20 (lote 1, `1550b07`) y 2.1-2.13 marcadas en `tasks.md`. NO hecho: bloque C (2.14-2.19) ni lote 3.
- **GREEN en el orden de C-9:** `transitions.ts:84` (`required: false`, `+1 −1`, 397 líneas) y luego la guarda en `ticketService.ts:131` (`+2 −2` con el lote 1, 234 líneas, import en `:6`, cero líneas insertadas). Sin excepción para el Director Técnico (pregunta 3.b.3); `cargos.ts` sólo ganó el texto del comentario de `:78` (en sitio).
- **Literal de 2.1** (obligatorios de las 34, antes de tocar `:84`): pegado en `prioridad.test.ts` (`OBLIGATORIOS_ANTES`); TS20-4 lo compara con `TRANSITIONS`.
- **Rojos naturales:** `prioridad.test.ts` (`ajusteDelCuerpo` y `cambiaPrioridadSinPermiso` no existían; TS20-3/4 por `required: true`), TS20-1 (`transitionExec.test.ts`), TS21-1/2/4/5/9 y TS22-2 (hoy 200 o 422, sin guarda) y `ticketService.test.ts:120` (422 por «Falta … Prioridad»). Ajuste: 19 de 20 pruebas nuevas rojas por el 404 del comodín (`app.ts:73`), comparando el cuerpo.
- **Nacieron verdes (declarado):** TS21-3, TS21-6, TS21-7, TS21-8, TS21-10, TS22-1, TS22-3, `ticketService.test.ts:109` reescrita (`habilitar_servicio`); y del ajuste, «A < B₂» (el comodín da 404; lo discrimina el mensaje de TC29-9 y la mutación m2) y «sin sesión es 401».
- **Desviación declarada (TC29-12):** el encargo pedía comprobar que `priority` y `managed_by_app` «quedan como estaban». pg-mem NO revierte un `ROLLBACK` (`transaccion.test.ts:25`), así que la atomicidad se prueba con un rastreador de verbos que separa el pool de la conexión de la transacción: `tx:BEGIN, tx:UPDATE, tx:INSERT, tx:ROLLBACK`. TC29-12b prueba aparte el `CHECK` contra la base real.
- **Pruebas de posición:** TS22-1 `guardaPrioridad.test.ts` (área), TS22-2 (422), TS22-3 (409); ajuste: TC29-7, TC29-8, «B₂ < C», TC29-9 y «A < B₂» en `prioridadTop5.test.ts`.
- **Mutaciones, ejecutadas y revertidas con `cmp`:** (a) rojos TS22-1 y el 403 de área de `ticketService.test.ts:96-101`; (b) rojo TS22-2; (c) 4 rojos (TS22-1, TS22-3 y dos de `ticketService.test.ts`); (d) 8 rojos (incluida la matriz de `permisos.test.ts`, TS20-1/3/4, TS21-4); (s) rojos TS21-10 (puro y de servicio). Ajuste: (i) TC29-11; (j) TC29-10; (k) TC29-7; (k2) «B₂ < C», TC29-7 y TC29-8; (l) «B₂ < C»; (m2) «A < B₂» y TC29-7; (t) TC29-12 (la primera versión del rastreador NO la cazaba: no distinguía pool de conexión; corregida).
- **Orden entre las dos 403 de `:131`: inobservable** (la única excepción de cargo, `liberacion_sin_factura`, no tiene campo de prioridad).
- **Cierre:** `npm test` 164 ficheros pasan + 1 omitido, 2.181 pruebas pasan + 2 omitidas; `typecheck` verde; `lint` 165 avisos (cero nuevos, ningún `any`).
- **Barrido regla 4 (nada se movió: todo en sitio o al final):** `ticketService.ts:129-131` (`permissions/spec.md:310`, `transitions-st/spec.md:33`, `:1222`, `transitions-equipo-nuevo/spec.md:51`) y `:131` (`permissions/spec.md:402`) siguen ciertos: caso A. `transitions.ts:84` (`tickets-core/spec.md:860`, `Preguntas_Gerencia_2026-09-29.md:77`) sigue cierto. **Caso C, sin tocar:** `permissions/spec.md:483` (M-3, «no hay bloqueo… hoy un técnico cambia la prioridad») y `Paquete_de_Despliegue_2026-09-29.md:574` / `2026-09-30.md:826` (R10 «SIGUE VIVO») quedan superados por `ticketService.ts:131`; se cierran al archivar y en el paquete del lote 3. `ticketService.test.ts:96-101` es el mismo texto; `permisos.test.ts:30` sin cambio.
- **Diseño §3:** cuatro detalles de forma escritos con línea, más el 404/422 del ajuste.
