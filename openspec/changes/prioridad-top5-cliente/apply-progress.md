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
