# Tareas — liberacion-sin-factura-motivo-fecha (F1C-05, `cierra: no`)

Entradas: `proposal.md`, `design.md`, deltas `specs/transitions-st/spec.md` (RQ-TS-35) y `specs/permissions/spec.md`.
Ante diferencia spec/diseño manda el diseño (D2, D7). Cada lote es un intento independiente del registro (techo 800, válvula 720)
y deja el árbol en verde por sí solo. Nada de commit ni push desde estas tareas; no se escribe en `docs/sdd/ENTRADA.md`,
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` (salvo la sección de L2 que fija el diseño §12), ni en `openspec/config.yaml`.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | L1 ≈ 378 · L2 ≈ 545 (suma ≈ 923) |
| Riesgo contra 400 líneas | High (suma); cada lote < 720 |
| PRs encadenados | No: dos intentos del registro sobre la misma rama |
| Reparto | L1 (sin cambio de comportamiento) → L2 (el cambio) |
| Estrategia de entrega | ask-on-risk, review_budget_lines 800 |
| Estrategia de cadena | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| L1 | Columnas, guarda inerte, guardianes, sintética | `npx vitest run packages/shared/src/liberacionSinFactura.test.ts packages/zoho-sync/src/db/repo.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/transitionExec.test.ts` | `npm test` | Revertir el intento L1; columnas inertes |
| L2 | Línea 247, cableado, cliente, C1, PL-1..4, reentrancia | `npx vitest run apps/desk/server/liberacionSinFactura.test.ts apps/desk/server/transicionesEjecucion.test.ts packages/shared/src/reentrancia.test.ts` | `npm test` + comprobaciones de persona (§P) | Revertir L2 devuelve la casilla; L1 queda |

---

# LOTE 1 — sin cambio de comportamiento (≈ 378)

## L1·A Partida y documental

- [x] 1.1 (documental) Alinear los deltas con D2 y D7. Localizar y editar en `specs/transitions-st/spec.md`:
  (a) `:153-156` y `:200`/`:305` — la etiqueta «Motivo» entra en `PROMOTED_COLUMNS` como CLAVE `Motivo de liberación sin factura` (etiqueta visible «Motivo»);
  (b) `:253-257` — "una liberación sin texto no borra el de una anterior" pasa a: el texto se escribe SIEMPRE en `custom_fields` (el de esta liberación o `null`, D7); la fuente de verdad sigue siendo la fila de traza;
  (c) `:440-444` — añadir escenario: segunda liberación por otro motivo sin texto deja `custom_fields` con `null`;
  (d) `:333` — el mensaje de la guarda es `El motivo debe ser uno de: …` (no contiene «Motivo» con mayúscula): reescribir el THEN para no exigir esa palabra;
  (e) `:120-123` (escenario «`transitionExec.ts` no cambia») — diseño §5 edita el comentario de la línea 73: matizar a "sólo cambia un comentario";
  (f) `:227-229` — añadir que la fecha se evalúa tal como llega (AAAA-MM-DD estricto, ISO con hora rechazado, D8);
  (g) `:144` — "27 etiquetas" queda caduco: recontar. Anotar cada edición con su línea en `apply-progress.md`.
- [x] 1.2 REMEDIR en `apply-progress.md` (el orquestador fusiona antes ramas ajenas): commit de partida; última línea de `packages/zoho-sync/src/db/schema.sql` (previsto 707); recuentos del guardián de `packages/zoho-sync/src/db/migrate.test.ts` (previsto 50/27/23, `:374-378`); `wc -l` de `schema.sql`, `rows.ts`, `index.ts`, `fechasDerivadas.ts`, `transitionExec.ts`, `transitions.ts` (397), `repo.test.ts`, `migrate.test.ts`, `transitionExec.test.ts`; cifra verde de `npm test`. Recalcular sobre lo medido las líneas 710/711 y el recuento 52/27/25.
- [x] 1.3 Abrir el intento L1 y registrar el commit de partida y que no hay otro intento SDD abierto en el árbol.

## L1·B Rojos (se EJECUTAN antes de tocar producción; anotar el fallo literal)

- [x] 1.4 ROJA: crear `packages/shared/src/liberacionSinFactura.test.ts` con transición SINTÉTICA (campo clave `Motivo de liberación sin factura` con las tres opciones): motivo fuera de lista; igualdad exacta (mayúsculas); fecha `2026-02-30`, `04/10/2026`, ISO con hora; tercer motivo sin texto, con `"   "` y con texto; primer y segundo motivo sin texto; vacíos (`undefined`, `null`, `''`) sin error; transición sin el campo → `[]`; orden de mensajes; `textoAutorizacionAGuardar` (`undefined`/recortado/`null`); `seVuelveAPedirEnCadaLiberacion` (las tres claves); `esFechaCalendarioReal` importable; mensajes exactos del diseño §4. Ejecutar y anotar el fallo (módulo inexistente).
- [x] 1.5 ROJAS al final de `packages/zoho-sync/src/db/repo.test.ts` (molde `:279-288` y `:513-519`): (a) las dos columnas fuera de `TICKET_COLS` y dentro de `PROMOTED_COLUMNS` con etiqueta y tipo; (b) fila NO gestionada con las dos columnas puestas, segunda pasada de `upsertTicket`: cambia el asunto, no las columnas. Ejecutar y anotar el fallo.
- [x] 1.6 ROJA: editar en su sitio el recuento de `migrate.test.ts:374-378` a 52/27/25 (título y cifras; conjuntos de `:382-385` y guardianes `:332-339`, `:345-352` intactos). Ejecutar: rojo hasta editar `schema.sql`.
- [x] 1.7 Al final de `apps/desk/server/transitionExec.test.ts`: (a) SINTÉTICA de casilla obligatoria (ausente, `false`, marcada) con transición fabricada en la prueba — **nace verde** (caracterización), se valida en la mutación M10; (b) ROJA de enrutado: las dos etiquetas van a columna (fecha recortada a día) y el texto a `customFields`. Ejecutar y anotar.

## L1·C Verde (producción, sin cambio de comportamiento)

- [x] 1.8 `packages/shared/src/fechasDerivadas.ts:37`: anteponer `export` a `esFechaCalendarioReal`. `git diff --numstat` = 1/1.
- [x] 1.9 Crear `packages/shared/src/liberacionSinFactura.ts` (≈ 50 líneas) con las cuatro constantes, `erroresLiberacionSinFactura`, `textoAutorizacionAGuardar`, `seVuelveAPedirEnCadaLiberacion`, activándose por el campo (D4), lista = `options` del propio campo (D5), mensajes exactos del diseño §4 en ese orden. Añadir en `packages/shared/src/index.ts` la línea nueva al final (línea 32 prevista).
- [x] 1.10 `packages/zoho-sync/src/db/schema.sql`: cuatro líneas al final (dos comentarios sin `;`, luego `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text;` y `… fecha_prevista_facturacion date;`), SIN calificar.
- [x] 1.11 `packages/zoho-sync/src/db/rows.ts`: (a) línea 50, campos opcionales de `TicketRow`; (b) línea 131, las dos entradas de `PROMOTED_COLUMNS` (`liberacion_motivo` con clave `Motivo de liberación sin factura`, `fecha_prevista_facturacion` con `Fecha prevista de facturación`) en la misma línea; (c) línea 119, "el ÚNICO…" → "el PRIMERO…". Comprobar con `git diff --numstat` que inserciones = borrados.
- [x] 1.12 Ejecutar las pruebas de 1.4-1.7 en verde; la sintética 1.7(a) sigue verde.

## L1·D Mutaciones del lote (aplicar, ver qué cae, anotar mensaje literal, REVERTIR)

- [x] 1.13 M5 (regla 2, fichero vigilado): escribir en `schema.sql` `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text;` → debe caer `migrate.test.ts:332-339` y el recuento de calificadas.
- [x] 1.14 M6: meter `'liberacion_motivo'` en `TICKET_COLS` (`repo.ts:44-54`) → deben caer las dos pruebas de 1.5.
- [x] 1.15 M9: en la guarda, uno a uno: quitar cada una de las tres comprobaciones; aceptar texto de sólo espacios; exigir texto con cualquier motivo → una prueba del módulo cae por cada una.
- [x] 1.16 M10: `transitionExec.ts:76` a `empty` para la casilla → cae la sintética vía `false`.
- [x] 1.17 `git diff` confirma que ninguna mutación quedó aplicada.

## L1·E Comprobaciones de citas y cierre

- [x] 1.18 `git diff --numstat` de `rows.ts`, `fechasDerivadas.ts` (inserciones = borrados); `wc -l` de `index.ts`, `schema.sql` frente a la medida de 1.2.
- [x] 1.19 CIERRE L1: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores); anotar el CÓDIGO DE SALIDA de cada uno (`${PIPESTATUS[0]}` si se canaliza). Medida del intento: `git diff --shortstat --no-renames` contra el commit de partida + `wc -l` de lo nuevo sin trackear; binarios aparte. Si supera 720, partir.
- [x] 1.20 Regla 13 (las siete filas del diseño §11) escrita en `apply-progress.md` como "pendiente de L2"; cerrar el intento L1.

---

# LOTE 2 — el cambio (≈ 545)

## L2·A Partida

- [ ] 2.1 Abrir el intento L2 (nuevo commit de partida = cierre de L1). REMEDIR: `wc -l` de `transitions.ts` (397), `ticketService.ts`, `TransitionPanel.tsx`, `TicketProperties.tsx`, `transicionesEjecucion.test.ts`, `reentrancia.test.ts`, `invariantesGrafo.test.ts`, `bodegaje.test.ts`, `prioridad.test.ts`; líneas 6, 133, 134 de `ticketService.ts`; cifra verde de `npm test`.

## L2·B Rojos (EJECUTAR y anotar el fallo literal)

- [ ] 2.2 ROJA al final de `packages/shared/src/liberacionSinFactura.test.ts`: el catálogo declara exactamente las tres opciones en orden (literales en la prueba), `MOTIVO_QUE_EXIGE_TEXTO` es una de ellas, las tres claves son las de los campos `customField` de `liberacion_sin_factura`, ninguna casilla. Fallo esperado: la línea 247 aún declara la casilla.
- [ ] 2.3 Crear `apps/desk/server/liberacionSinFactura.test.ts` (≈ 150 líneas): criterios 3 a 8 de la propuesta por HTTP (sin motivo, sin fecha, fuera de lista, mayúsculas, `2026-02-30`, `04/10/2026`, fecha pasada → 200, tercer motivo sin texto / `"   "` / con texto, primero y segundo sin texto, errores juntos con presencia delante, escritura de columnas/texto/traza y `liberacion_sin_facturar` intacta); segunda liberación sin texto deja `null` y con valores nuevos dos filas de traza; `upsertTicket` con `custom_fields` vacío no borra el texto. ROJAS.
- [ ] 2.4 En el mismo fichero, pruebas de POSICIÓN con motivo y fecha presentes y `'Otro motivo'`: PL-1 (cargo gana; control con administrador: 422; ROJA por el control), PL-1 bis (⚠ diferencia spec/diseño: existe en la spec, no en el diseño; se incluye, 403 de área), PL-2 (409 gana; nace verde, caracterización), PL-3 (lista gana a persona inexistente; ROJA), PL-4 (sin fecha + fuera de lista: un solo 422, presencia delante; ROJA). Ejecutar y anotar.
- [ ] 2.5 Reescribir en su sitio el bloque C1 de `apps/desk/server/transicionesEjecucion.test.ts:41-103` conservando sus 63 líneas (motivo ausente, motivo vacío, válidos con las dos columnas escritas); anclar la narración de `:8-40` a `2a74fdc` (caso B). Ejecutar: rojo.
- [ ] 2.6 Editar a propósito las cinco de reentrancia: `reentrancia.test.ts:43-52`, `:83-85` (diez casos), `:87-100` (once campos, nueve obligatorios); `invariantesGrafo.test.ts:137-150` (once, la fecha nueva delante de «Fecha Remisión de Salida»); `bodegaje.test.ts:105-113` (once). Ejecutar: rojo.
- [ ] 2.7 `prioridad.test.ts:106`: NO tocar el literal; declarar la excepción en el cálculo de `esperado` (`:120`) y en el título de `:118`. Ejecutar: rojo.

## L2·C Verde

- [ ] 2.8 `packages/shared/src/transitions.ts`: SOLO la línea 247, con el texto exacto del diseño §3. `wc -l` antes y después = 397; `git diff --numstat` = 1/1.
- [ ] 2.9 `apps/desk/server/services/ticketService.ts`: línea 6 (tres símbolos en el `import`), línea 133 (`txtLib` → `plan.customFields[CLAVE_TEXTO_AUTORIZACION]`, D7), línea 134 (`errLiberacion` tras `errCertificado`, en la condición y al final del array). Inserciones = borrados.
- [ ] 2.10 `apps/desk/server/transitionExec.ts:73`: comentario en su sitio (caso B, `2a74fdc`). `git diff --numstat` 1/1.
- [ ] 2.11 `apps/desk/src/components/TransitionPanel.tsx`: líneas 8, 33 y 28-30 como el diseño §7. `TicketProperties.tsx`: líneas 76 y 184 en su sitio. Sin cambio de nº de líneas (`git diff --numstat`).
- [ ] 2.12 `debt.md:652` ("el único `required`…"): nombrar la revisión `2a74fdc` (caso B).
- [ ] 2.13 Todo lo de 2.2-2.7 en verde.

## L2·D Mutaciones (aplicar, anotar mensaje literal, REVERTIR)

- [ ] 2.14 M1 (posición): bloque `erroresLiberacionSinFactura` al principio de `ticketService.ts:131` → cae PL-1.
- [ ] 2.15 M2: el mismo bloque antes de la línea 126 → cae PL-2.
- [ ] 2.16 M3: quitar `errLiberacion` de condición y array de la 134 y lanzarlo tras la 142 → caen PL-3 y PL-4.
- [ ] 2.17 M4: `...errLiberacion` delante de `...plan.errors` → cae PL-4.
- [ ] 2.18 M7 (fichero vigilado, línea 247): añadir una cuarta opción; luego quitar una → cae la prueba del literal de tres opciones.
- [ ] 2.19 M8: cambiar una letra del tercer motivo → cae la prueba que ata `MOTIVO_QUE_EXIGE_TEXTO` a las opciones.
- [ ] 2.20 `git diff` confirma que no queda ninguna mutación (M1-M4, M7, M8; M5, M6, M9, M10 fueron de L1).

## L2·E Regla 13, citas y comprobaciones de línea

- [ ] 2.21 Regla 13 por escrito en `apply-progress.md`: las siete filas del diseño §11, cada decisión del cliente con la línea final del servidor que la impone.
- [ ] 2.22 `git diff --numstat` de `ticketService.ts` (6, 133, 134), `transitionExec.ts` (73), `rows.ts`, `TransitionPanel.tsx`, `TicketProperties.tsx`: inserciones = borrados; `wc -l` de `transitions.ts` = 397.

## L2·F Barrido y textos para el orquestador (en `apply-progress.md`)

- [ ] 2.23 Barrido de citas, regla de mutación 4, sin excluir `openspec/changes/archive/`: `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` y releer las que AFIRMAN la casilla en `transitions.ts:247` (`transitionExec.ts:73`, `transicionesEjecucion.test.ts:13`, `debt.md:652`, `spec.md:918`, `F0-00_Baseline_as_built.md`, `Paquete_de_Despliegue_2026-10-01.md:743`) y las que afirman «diez campos reentrantes» (`transitions-st/spec.md:64`, `:981`, `trazas/spec.md:91`, `:494`, las pruebas de 2.6). LISTAR y clasificar A/B/C. Segundo pase de formas abreviadas en los ficheros que citan el módulo. Las specs vivas y los documentos fechados NO se editan: las once "ediciones en sitio al archivar" las aplica el orquestador.
- [ ] 2.24 Redactar en `apply-progress.md` (sin numerar) el texto de corrección del maestro (`toca_maestro: si`, diseño §12) y la sección de `F0-01_Correcciones_para_el_maestro.md`, añadida al final solo si el diseño lo fija así (≈ 30 líneas, número lo pone el orquestador).
- [ ] 2.25 Redactar, sin número, las preguntas para la bandeja: E-nueva-1 (¿fecha futura?), E-nueva-2 (¿texto para los tres motivos?), E-nueva-3 (recuentos por `liberacion_sin_facturar`), E-nueva-4 (tickets liberados con casilla al desplegar), más la que añade el diseño: D7 (el texto se sobrescribe a `null` en cada liberación) y la reentrancia (la columna guarda el último valor; la traza, todos).
- [ ] 2.26 Paquete de despliegue: dejar anotadas en `apply-progress.md` las dos `ALTER` (líneas realmente medidas) y las comprobaciones de persona de §P.

## L2·G Cierre

- [ ] 2.27 CIERRE L2: `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores), con CÓDIGO DE SALIDA de cada uno. Medida del intento: `git diff --shortstat --no-renames` contra el commit de partida de L2 + `wc -l` de lo nuevo sin trackear. Si pasa de ~620 en la medición intermedia (tras 2.13), parar y proponer corte: sacar 2.24 y la sección de `F0-01` a un lote documental L3.

---

# §P Comprobaciones de PERSONA — fuera del recuento

Dueño: Gerencia / quien opere la aplicación (Director Comercial). Destino: paquete de despliegue del siguiente corte. Quedan escritas en `apply-progress.md` (2.26) y en el parte. **Archivar el cambio NO las da por hechas.**

- P1 En la aplicación, liberar un ticket en `Por Facturar` con cada uno de los tres motivos; se ven tres campos y ninguna casilla.
- P2 El tercer motivo exige el texto; sin él la aplicación lo rechaza y nombra lo que falta.
- P3 Entregar, volver a `Por Facturar` y liberar otra vez: motivo, fecha y texto salen vacíos y editables, sin bloqueo, y no se hereda el texto de la primera.
- P4 La ficha del ticket enseña motivo y fecha; el historial enseña los tres valores de cada liberación.
- P5 Existe alguien con el cargo Director Comercial en producción.

## Cobertura de la spec

Escenarios de `transitions-st` (RQ-TS-06, RQ-TS-08, RQ-TS-09, RQ-TS-35) y `permissions` (RQ-PM-18): cubiertos por 1.4-1.7, 2.2-2.7. Escenarios PERSONA: solo en §P.
