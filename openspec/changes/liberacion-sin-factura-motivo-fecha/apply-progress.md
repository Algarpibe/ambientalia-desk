# apply-progress — liberacion-sin-factura-motivo-fecha (F1C-05, `cierra: no`)

## Lote 1 — sin cambio de comportamiento (completo, sin commitear)

### 1.2 / 1.3 · Partida (remedida el 2026-10-04)

- Commit de partida del lote 1: `8c182fb` (fusión que apila F1B-07 y F1B-03). Intento del registro abierto por el orquestador; no hay otro intento SDD abierto en el árbol (1.3, declarado por el encargo).
- `schema.sql`: 714 líneas (previsto 707); las cuatro nuevas van en 715-718 (comentarios en 715-716, `ALTER` en 717 y 718).
- Guardián `migrate.test.ts:374-378`: 53 `ALTER` = 29 calificadas + 24 sin calificar (previsto 50/27/23). Objetivo: 55 / 29 / 26.
- `wc -l` antes: `schema.sql` 714 · `rows.ts` 132 · `index.ts` 33 · `fechasDerivadas.ts` 134 · `transitionExec.ts` 99 · `transitions.ts` 397 · `repo.test.ts` 520 · `migrate.test.ts` 765 · `transitionExec.test.ts` 280.
- Cifra verde de partida: 3.102 pruebas pasan y 2 omitidas, typecheck limpio, lint 165 avisos y 0 errores (dato del orquestador; no se re-ejecutó antes de tocar).
- Guardián posicional no nombrado en las tareas: `migrate.test.ts:652` (`toBe(ultima + 1 + 6 + 2 + 17 + 1 + 2)`), subido con un sumando `+ 2` y mensaje ampliado. Otras pruebas de `migrate.test.ts` que dependan de la última sentencia o del recuento: ninguna más (las de `:519-523` y `:537-550` cuentan desde el principio o por posición de una sentencia fija; todo `migrate.test.ts` quedó verde tras editar sólo `:374-378` y `:652`).

### 1.1 · Ediciones del delta `specs/transitions-st/spec.md` (líneas ORIGINALES, antes de editar; las ediciones desplazan lo posterior)

| # | Línea original | Edición |
|---|---|---|
| (a) | `:153-156`, `:200`, `:305` | «Motivo» entra como CLAVE `Motivo de liberación sin factura` (etiqueta visible «Motivo»): el párrafo de `PROMOTED_COLUMNS`, la fila «Campo Motivo» de la tabla de letra/supuesto y el escenario del catálogo |
| (b) | `:253-257` | el texto se escribe SIEMPRE en `custom_fields` (el de esta liberación o `null`, D7); la fuente de verdad sigue siendo la fila de traza |
| (c) | `:440-444` | escenario nuevo: segunda liberación por otro motivo y sin texto deja `custom_fields` con `null` |
| (d) | `:333` | el THEN pasa a `El motivo debe ser uno de: …`, sin exigir la palabra «Motivo» |
| (e) | `:120-123` | escenario `transitionExec.ts` pasa a «sólo cambia un comentario» (título incluido) |
| (f) | `:227-229` | la fecha se evalúa tal como llega, `AAAA-MM-DD` estricto, ISO con hora rechazado (D8) |
| (g) | `:144` | «27 etiquetas» caduco: recontado con una prueba desechable contra `8c182fb`: 28 claves `customField` (contando el `campoFecha`); con el cambio, 30, de las cuales 29 en `PROMOTED_COLUMNS` |
| extra | `:263` y `:402-405` | los recuentos `50/27/23 → 52/27/25` pasan a lo remedido: `53/29/24 → 55/29/26` (`:263`, título y THEN del escenario del esquema). No estaba en la lista de 1.1; sale de 1.2 |

El delta de `permissions` no se tocó.

### Rojos ejecutados antes de producción (strict_tdd)

- 1.4 `packages/shared/src/liberacionSinFactura.test.ts`: `Failed to load url ./liberacionSinFactura (resolved id: ./liberacionSinFactura) … Does the file exist?` (módulo inexistente). Tras crear el módulo y antes de exportar: `(0 , esFechaCalendarioReal) is not a function` en 17 pruebas.
- 1.5 `repo.test.ts`: (a) `expected [ 'codigo_servicio', …(39) ] to include 'liberacion_motivo'`; (b) `Column "liberacion_motivo" not found`.
- 1.6 `migrate.test.ts`: `ALTER TABLE en schema.sql: expected 53 to be 55` y, en el guardián posicional, `…: expected 148 to be 150`.
- 1.7(b) `transitionExec.test.ts`: `expected {} to deeply equal { liberacion_motivo: 'c', …(1) }`.
- 1.7(a) **CARACTERIZACIÓN**: nace verde (el motor ya exige la casilla marcada). Se valida por M10.
- Hallazgo del arnés: pg-mem no tiene `to_char(date, text)` ni `date::text`; la prueba 1.5(b) lee la columna cruda y compara el día en JS.

### Verde y cierre (1.19)

- `npm test`: **3.129 pasan, 2 omitidas** (197 ficheros pasan, 1 omitido). Código de salida **0**.
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: **165 avisos, 0 errores**. Código de salida **0**.

### Mutaciones (aplicadas, medidas, REVERTIDAS; las reproduce el orquestador)

- **M5** (regla 2): añadir al final de `schema.sql` `ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text;`. Caen: `toda ALTER TABLE apunta a una tabla clasificada…` → `expected [ 'public.tickets' ] to deeply equal []` (`migrate.test.ts:332-339`); `son 55 ALTER…` → `expected 56 to be 55` (el total salta antes que el de calificadas); el posicional de `:652`.
- **M6**: `repo.ts:45`, `'id','number','subject',` → `'liberacion_motivo','id','number','subject',`. Caen las dos de 1.5: `expected [ 'liberacion_motivo', 'id', …(59) ] to not include 'liberacion_motivo'` y la del sync (`expected { subject: 'Asunto de Zoho v2', …(3) } to deeply equal …`).
- **M9**, en `liberacionSinFactura.ts` (`:31`, `:32`, `:33`), una por una: quitar lista (`if (false) errores.push(`) → 4 caen (lista, igualdad exacta, no cadena, orden); quitar fecha → 7 caen (las cinco fechas malas, no cadena, orden); quitar texto (`if (false) {`) → 3 caen (tercer motivo sin texto, fecha ausente, orden); texto de sólo espacios aceptado (`texto.trim() !== ''` → `texto !== ''` en `:33`) → 1 cae (`el tercer motivo sin texto, con texto de sólo espacios…`); exigir texto con cualquier motivo (`motivo === MOTIVO_QUE_EXIGE_TEXTO &&` → `!vacio(motivo) &&`) → 13 caen.
- **M10**: `transitionExec.ts:76`, `f.kind === 'checkbox' ? asBool(raw) !== true : empty` → `empty`. Cae `casilla obligatoria (RQ-TS-08, sintética) > ausente y en false dan el mismo error…` → `expected [] to deeply equal [ Array(1) ]`.
- 1.17: tras las mutaciones, `git status` muestra sólo los ficheros del lote; `liberacionSinFactura.ts`, `schema.sql`, `repo.ts` y `transitionExec.ts` restaurados byte a byte (`repo.ts` y `transitionExec.ts` sin diff).

### 1.18 · Citas

- `git diff --numstat`: `rows.ts` 3/3 y `fechasDerivadas.ts` 1/1 (inserciones = borrados).
- `wc -l` tras: `index.ts` 34 (+1 al final, línea 34 y no la 32 prevista: el fichero ya tenía 33), `schema.sql` 718 (+4 al final), `rows.ts` 132, `fechasDerivadas.ts` 134, `transitionExec.ts` 99, `transitions.ts` 397.
- Las líneas 131 y 119 de `rows.ts` mantienen su número: el rango 85-132 del array no se mueve.

### Medida del lote (1.19)

`git diff --shortstat --no-renames 8c182fb` sobre los ficheros tocados + `wc -l` de lo nuevo sin trackear (`liberacionSinFactura.ts` 48, `liberacionSinFactura.test.ts` 137, este fichero). Sin binarios. Medido: 123 inserciones + 45 borrados = 168 (9 ficheros,  9 files changed, 123 insertions(+), 45 deletions(-)) + 265 sin trackear (48 + 137 + 80 de este fichero) = **≈ 433** (estimado 378, válvula 720, techo 800). Sin binarios.

### 1.20 · Regla 13 (diseño §11): PENDIENTE DE L2

| # | Decide el cliente | Imposición del servidor | Estado |
|---|---|---|---|
| 1 | Motivo obligatorio | `transitionExec.ts:77`, `422` en `ticketService.ts:134` | pendiente de L2 |
| 2 | Fecha obligatoria | igual | pendiente de L2 |
| 3 | Sólo tres motivos | guarda nueva, `ticketService.ts:134` | pendiente de L2 (en L1 la guarda existe pero no está cableada) |
| 4 | La fecha es un día | guarda nueva | pendiente de L2 |
| 5 | Texto con el tercer motivo | guarda nueva | pendiente de L2 |
| 6 | Quién ve el botón | `ticketService.ts:129-131` | pendiente de L2 |
| 7 | No prellenar ni bloquear al re-liberar | sin contrapartida | pendiente de L2 |

### Desviaciones respecto al diseño

1. `index.ts`: la línea nueva es la 34, no la 32 (el fichero ya tenía 33).
2. Recuentos: 55 / 29 / 26 en lugar de 52 / 27 / 25 (árbol remedido); también en el delta.
3. Guardián posicional `migrate.test.ts:652` editado (no estaba en las tareas).
4. La guarda además rechaza un motivo o una fecha que no son cadena (el diseño lo deja implícito en «igualdad exacta» y «cadena AAAA-MM-DD»).
5. Dos comentarios de `schema.sql` y el docblock de la guarda están en español; sin `;` dentro de los comentarios SQL.

## Lote 2 — el cambio (completo, sin commitear)

### 2.1 · Partida (remedida el 2026-10-04)

- Commit de partida del lote 2: `0f3cafc` (cierre del lote 1). Intento del registro abierto por el orquestador (casilla 2.1); este lote no ejecutó `gentle-ai sdd-attempt`.
- `wc -l` antes: `packages/shared/src/transitions.ts` 397 · `apps/desk/server/services/ticketService.ts` 277 · `apps/desk/src/components/TransitionPanel.tsx` 267 · `apps/desk/src/components/TicketProperties.tsx` 200 · `apps/desk/server/transicionesEjecucion.test.ts` 453 · `packages/shared/src/reentrancia.test.ts` 218 · `packages/shared/src/invariantesGrafo.test.ts` 329 · `packages/shared/src/bodegaje.test.ts` 432 · `packages/shared/src/prioridad.test.ts` 224 · `apps/desk/server/transitionExec.ts` 99.
- Líneas remedidas por CONTENIDO, todas en el sitio que el diseño nombra: el `import` en `apps/desk/server/services/ticketService.ts:6`; `plan` y `delete plan.customFields[...]` en `apps/desk/server/services/ticketService.ts:133`; `errCuarentena`/`errCertificado` y el `422` en `apps/desk/server/services/ticketService.ts:134`; el bloque de cargo en `apps/desk/server/services/ticketService.ts:131`; el comentario de la casilla en `apps/desk/server/transitionExec.ts:73`; la línea de la liberación en `packages/shared/src/transitions.ts:247`; la excepción de `debt.md:652`. Nada se movió respecto al diseño.
- Cifra verde de partida: 3.129 pruebas pasan y 2 omitidas (cierre del lote 1).

### Rojos ejecutados antes de producción (strict_tdd)

- 2.2 `packages/shared/src/liberacionSinFactura.test.ts`: `expected undefined to match object { label: 'Motivo', …(3) }` y `expected [ Array(1) ] to deeply equal [ …(3) ]` (la línea 247 aún declara la casilla). 2 rojas.
- 2.3/2.4 `apps/desk/server/liberacionSinFactura.test.ts`: 17 rojas, 2 nacieron verdes. Fallos literales: `expected [ Array(1) ] to deeply equal [ …(2) ]` (presencia de motivo y fecha, PL-4); `expected [ Array(1) ] to deeply equal [ Array(1) ]` (lista, fecha, texto: el `422` seguía nombrando la casilla); `expected 422 to be 200` (los caminos válidos). **PL-1** roja por su control (administrador: `expected [ Array(1) ] to deeply equal [ Array(1) ]`). **PL-1 bis** y **PL-2** nacen verdes: CARACTERIZACIÓN (los 403 de área y el 409 ya ganaban al 422).
- 2.5 `apps/desk/server/transicionesEjecucion.test.ts`, bloque C1 reescrito en sus 63 líneas: `expected [ Array(1) ] to include 'Falta el campo obligatorio: Motivo'` (x2) y `expected 422 to be 200`.
- 2.6 `packages/shared/src/reentrancia.test.ts`: `expected [ { id: 'entrega_sin_factura', …(3) } ] to deeply equal [ { …(4) }, { …(4) } ]`, `to have a length of 10 but got 9`, `to have a length of 11 but got 10`; `packages/shared/src/invariantesGrafo.test.ts`: `expected [ …(10) ] to deeply equal [ …(11) ]`; `packages/shared/src/bodegaje.test.ts`: `expected [ …(10) ] to have a length of 11 but got 10`.
- 2.7 `packages/shared/src/prioridad.test.ts` (TS20-4): `expected { habilitar_servicio: [ …(2) ], …(30) } to deeply equal { habilitar_servicio: [ …(2) ], …(30) }`. El literal `OBLIGATORIOS_ANTES` no se tocó: la excepción se declara en el cálculo de `esperado` y en el título.

### Verde (2.8 a 2.13)

- 2.8 `packages/shared/src/transitions.ts`: sólo la línea 247, texto exacto del diseño §3. 397 líneas antes y después; numstat 1/1.
- 2.9 `apps/desk/server/services/ticketService.ts`: línea 6 (tres símbolos), línea 133 (`txtLib` al final, D7), línea 134 (`errLiberacion` tras `errCertificado`, en la condición y al final del array). numstat 3/3, 277 líneas.
- 2.10 `apps/desk/server/transitionExec.ts:73`: comentario en su sitio, con `2a74fdc`. numstat 1/1.
- 2.11 `apps/desk/src/components/TransitionPanel.tsx` líneas 8, 28-30 y 33; `apps/desk/src/components/TicketProperties.tsx` líneas 76 y 184, en su sitio. numstat 5/5 y 2/2.
- 2.12 `debt.md:652`: nombra `2a74fdc`. numstat 1/1.
- 2.13 `npm test` en verde (ver cierre).

### Mutaciones (aplicadas, medidas y REVERTIDAS; recetas exactas para el orquestador)

Todas son sustitución de texto literal, una sola pieza por fichero y aparición única. Tras cada una se restauró el fichero byte a byte (comprobado con `cmp`).

- **M1** · `apps/desk/server/services/ticketService.ts`. Antes: `const cargoFalta = cargoQueFaltaParaTransicion(t.id, user);` Después: `{ const e = erroresLiberacionSinFactura(t, b.values); if (e.length) throw new HttpError(422, { errors: e }) } const cargoFalta = cargoQueFaltaParaTransicion(t.id, user);` Cae PL-1 (`expected 422 to be 403`) y PL-4 (`expected [ Array(1) ] to deeply equal [ …(2) ]`: la lista se lanza sin la presencia).
- **M2** · el mismo fichero. Antes: `  if (!t.from.includes(current.row.status)) {` Después: `  { const e = erroresLiberacionSinFactura(t, b.values); if (e.length) throw new HttpError(422, { errors: e }) } if (!t.from.includes(current.row.status)) {` Cae PL-1, PL-1 bis (`expected 422 to be 403`), PL-2 (`expected 422 to be 409`) y PL-4.
- **M3** · el mismo fichero, dos piezas. (a) Antes: ` || errCertificado.length || errLiberacion.length) throw new HttpError(422, { errors: [...plan.errors, ...erroresFecha, ...errCuarentena, ...errCertificado, ...errLiberacion] })` Después: ` || errCertificado.length) throw new HttpError(422, { errors: [...plan.errors, ...erroresFecha, ...errCuarentena, ...errCertificado] })` (b) Antes: `  const errVencido = await erroresContratoVencido(` Después: `  if (errLiberacion.length) throw new HttpError(422, { errors: errLiberacion }); const errVencido = await erroresContratoVencido(` Cae PL-4 (`expected [ Array(1) ] to deeply equal [ …(2) ]`). **PL-3 no existe** (ver desviaciones).
- **M4** · el mismo fichero. Antes: `errors: [...plan.errors, ...erroresFecha, ...errCuarentena, ...errCertificado, ...errLiberacion] })` Después: `errors: [...errLiberacion, ...plan.errors, ...erroresFecha, ...errCuarentena, ...errCertificado] })` Cae PL-4 (`expected [ …(2) ] to deeply equal [ …(2) ]`, orden invertido).
- **M7a** · `packages/shared/src/transitions.ts`. Antes: `'Autorización excepcional de Dirección Comercial'] }, cfDate('Fecha prevista` Después: `'Autorización excepcional de Dirección Comercial', 'Otro motivo'] }, cfDate('Fecha prevista` Cae el literal de tres opciones (`expected [ …(4) ] to deeply equal [ …(3) ]`) y, por HTTP, la lista, mayúsculas, PL-1 y PL-4 (`expected 200 to be 422`).
- **M7b** · el mismo fichero. Antes: `'Servicio incluido en contrato con facturación periódica', 'Autorización excepcional de Dirección Comercial'] }, cfDate('Fecha prevista` Después: `'Autorización excepcional de Dirección Comercial'] }, cfDate('Fecha prevista` Cae el literal (`expected [ …(2) ] to deeply equal [ …(3) ]`) y 6 pruebas HTTP más.
- **M8** · el mismo fichero. Antes: `'Autorización excepcional de Dirección Comercial'] }, cfDate('Fecha prevista` Después: `'Autorizacion excepcional de Dirección Comercial'] }, cfDate('Fecha prevista` Caen las dos del módulo, el literal y `el motivo que exige texto es una de las opciones del catálogo` (`expected [ …(3) ] to include 'Autorización excepcional de Dirección…'`), más 9 HTTP.

Notas: la prueba que ata `MOTIVO_QUE_EXIGE_TEXTO` a las opciones se partió en su propia `it` tras la primera pasada de M8, porque dentro de la del literal quedaba tapada por la comparación anterior. 2.20: `git diff` confirma que no queda ninguna (los dos ficheros restaurados son idénticos a la copia previa y `git grep` no halla `Otro motivo` ni `Autorizacion` fuera de pruebas).

### 2.21 · Regla 13, decisión a decisión (las siete filas del diseño §11, con la línea FINAL del servidor)

| # | Decide el cliente | Lo impone el servidor | Prueba |
|---|---|---|---|
| 1 | Motivo obligatorio (asterisco, `apps/desk/src/components/TransitionPanel.tsx:209`) | `apps/desk/server/transitionExec.ts:77`; `422` en `apps/desk/server/services/ticketService.ts:134` | `apps/desk/server/transicionesEjecucion.test.ts` (vías ausente y vacía) y la de presencia de `apps/desk/server/liberacionSinFactura.test.ts` |
| 2 | Fecha obligatoria | igual | PL-4 y la de presencia |
| 3 | Sólo tres motivos (desplegable, `apps/desk/src/components/TransitionPanel.tsx:257-261`) | guarda nueva, `apps/desk/server/services/ticketService.ts:134` | motivo fuera de lista y mayúsculas |
| 4 | La fecha es un día (`apps/desk/src/components/TransitionPanel.tsx:254`) | guarda nueva, misma línea | `2026-02-30`, `04/10/2026` y fecha con hora |
| 5 | Texto con el tercer motivo; el campo se pinta siempre sin asterisco | guarda nueva, misma línea | tercer motivo sin texto y con espacios |
| 6 | Quién ve el botón (`apps/desk/src/components/TransitionPanel.tsx:56-58`) | `apps/desk/server/services/ticketService.ts:129-131` | PL-1 y PL-1 bis, más la matriz de `apps/desk/server/permisos.test.ts` |
| 7 | No prellenar ni bloquear al re-liberar (`apps/desk/src/components/TransitionPanel.tsx:33`) | sin contrapartida necesaria: el servidor lee sólo el cuerpo (`apps/desk/server/transitionExec.ts:43`), exige en cada ejecución y reescribe el texto en `apps/desk/server/services/ticketService.ts:133` | segunda liberación por HTTP (D7) y el predicado `seVuelveAPedirEnCadaLiberacion` atado al catálogo |

Las filas 3 a 5 son espejo legítimo: la imposición del servidor está probada con el lote 2 en verde. La fila 7 es comodidad: ninguna decisión del cliente queda sin línea de servidor.

### 2.22 · Comprobaciones de línea

`git diff --numstat` (inserciones = borrados): `packages/shared/src/transitions.ts` 1/1, `apps/desk/server/services/ticketService.ts` 3/3, `apps/desk/server/transitionExec.ts` 1/1, `apps/desk/src/components/TransitionPanel.tsx` 5/5, `apps/desk/src/components/TicketProperties.tsx` 2/2, `debt.md` 1/1. `packages/zoho-sync/src/db/rows.ts` no se tocó en este lote. `wc -l` de `packages/shared/src/transitions.ts`: 397.

### 2.23 · Barrido de citas (regla de mutación 4)

Se barrió la búsqueda de citas a `transitions.ts` sobre todo el repositorio, incluido `openspec/changes/archive/`, y se filtraron las que contienen la línea 247. Como la línea 247 cambió EN SU SITIO y el fichero sigue en 397 líneas, ninguna cita se DESPLAZA: el barrido es de afirmación, no de numeración.

- **A, presentes, reparadas en este lote:** `apps/desk/server/transitionExec.ts:73`, `apps/desk/server/transicionesEjecucion.test.ts:13`, `debt.md:652` y `packages/shared/src/liberacionSinFactura.test.ts:13`. Todas quedan ancladas en la misma línea física (`en 2a74fdc`, la última en `0f3cafc`).
- **B, históricas, NO se editan** (documentos fechados): `docs/sdd/F0-00_Baseline_as-built.md` líneas 67, 69, 237, 238, 302, 481, 523 y 547; las de `openspec/changes/archive/2026-09-12-por-entregar-es-espera/` (informe y propuesta), `openspec/changes/archive/2026-09-30-permisos-por-cargo/` (diseño y tareas) y `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/design.md`. Afirman algo cierto de su fecha.
- **A, a editar por el orquestador al archivar (spec viva):** `openspec/specs/transitions-st/spec.md:918` (la que dice que la casilla es `cfCheck` obligatorio). Va con las once ediciones en sitio.
- **Rangos amplios** (`171-256`, `178-255`, `171-263`) citan el bloque entero del catálogo: siguen ciertos.
- **Sin cambio y correcta:** `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:743` cita la línea 246 (cabecera de la transición), que no cambió.
- **«Diez campos reentrantes» / «nueve casos»:** afirman la cifra de antes `docs/sdd/Decisiones_Gerencia_2026-09-10.md:410` (B, dato fechado), `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:58` y `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:212` (B), los archivados de `tres-transiciones-cifra-anclada` y `rechazo-solo-comercial` (B), `openspec/changes/F0-04/proposal.md:34` y `openspec/changes/F0-04/proposal.md:113` (B), y en las specs vivas `openspec/specs/transitions-st/spec.md:981` (título «diez campos»), `openspec/specs/transitions-st/spec.md:1492`, `openspec/specs/transitions-st/spec.md:1523`, `openspec/specs/transitions-st/spec.md:1697`, `openspec/specs/transitions-st/spec.md:1746` y `openspec/specs/trazas/spec.md:494` (A o B según la frase; las decide el orquestador al archivar). Las pruebas de 2.6 y el comentario de `packages/shared/src/bodegaje.test.ts:105` ya dicen once.
- **Segundo pase (forma abreviada):** sin hallazgos nuevos en `apps/desk/server/transitionExec.ts`, `apps/desk/server/transicionesEjecucion.test.ts`, `apps/desk/server/transitionExec.test.ts`, `apps/desk/server/permisos.test.ts` ni `debt.md`: ninguna abreviada `:24x` cita la casilla.
- El detector (`.githooks/pre-push`) trabaja sobre revisiones y no sobre el árbol sin commitear: **hipótesis** de que da 0, queda para el orquestador tras el commit.

### 2.24 · Texto de corrección para el maestro (sin número; `toca_maestro: si`)

Sección «La de F1C-05, liberación sin factura (N)» para `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (el orquestador pone el número, que será el 25, y la pega al archivar). Pasaje: línea 1842 de la R08.4.md, que dice «El único caso afectado era «Liberación del ticket sin facturar»». Texto a pegar tras ese párrafo:

> «[CONSTRUIDO] La transición «Liberación sin factura» ya no lleva casilla. Exige Motivo, de una lista cerrada de tres —fecha de corte de facturación del cliente, servicio incluido en contrato con facturación periódica, autorización excepcional de Dirección Comercial—, y Fecha prevista de facturación; con el tercer motivo exige además el texto de la autorización. El servidor rechaza un motivo fuera de la lista y una fecha que no sea un día real. Las liberaciones anteriores conservan su casilla. La alarma por fecha vencida sigue pendiente (F1C-02).»

### 2.25 · Preguntas para la bandeja (sin número)

1. **¿Fecha futura?** La fecha prevista no se exige futura (la letra no lo pide; una fecha pasada se acepta y una prueba lo fija). Con fecha pasada la alarma de F1C-02 saltaría nada más liberar.
2. **¿Texto para los tres motivos?** Hoy sólo la autorización excepcional lo exige; los otros dos lo aceptan opcional.
3. **Recuentos por `liberacion_sin_facturar`.** Las liberaciones nuevas no marcan la casilla ni esa columna: quien cuente por ellas verá vacío tras el despliegue. ¿Se cuenta desde ahora por el motivo?
4. **Tickets liberados con casilla al desplegar.** Los que estén en `Por Entregar / Sin facturar` no tienen motivo ni fecha: ¿se les pide al construir F1C-02 o quedan fuera de la alarma?
5. **D7, el texto se sobrescribe.** Cada liberación escribe el texto de ESTA liberación o `null` en `custom_fields`; la fuente de verdad es la fila de traza. ¿Basta, o se quiere conservar el último texto no vacío?
6. **Reentrancia.** La columna `fecha_prevista_facturacion` guarda el último valor; la traza guarda todos. La fecha nueva entra en los campos reentrantes (once, nueve obligatorios).

### 2.26 · Paquete de despliegue

- **Esquema `desk`, dos `ALTER` realmente medidas:** `packages/zoho-sync/src/db/schema.sql:717` (`liberacion_motivo text`) y `packages/zoho-sync/src/db/schema.sql:718` (`fecha_prevista_facturacion date`). Anulables, sin relleno, sin calificar.
- **Comprobaciones de persona (§P, fuera del recuento; archivar NO las da por hechas):** P1 liberar en `Por Facturar` con cada motivo, tres campos y ninguna casilla; P2 el tercer motivo exige el texto y el rechazo nombra lo que falta; P3 entregar, volver a `Por Facturar` y liberar otra vez, con motivo, fecha y texto vacíos y editables; P4 la ficha enseña motivo y fecha y el historial los tres valores; P5 existe alguien con el cargo Director Comercial en producción.

### Cierre (2.27)

- `npm test`: **3.151 pasan, 2 omitidas** (198 ficheros pasan, 1 omitido). Código de salida **0**.
- `npm run typecheck`: código de salida **0**.
- `npm run lint`: **165 avisos, 0 errores**. Código de salida **0**.
- Medida del lote: `git diff --shortstat --no-renames 0f3cafc` = 15 ficheros, 237 inserciones y 84 borrados (321) + `wc -l` de lo nuevo sin trackear (`apps/desk/server/liberacionSinFactura.test.ts` 146) = **≈ 467** (estimado 545, válvula 720, techo 800). Sin binarios. Medición intermedia tras 2.13: 306 antes de las casillas y de este fichero.

### Desviaciones respecto al diseño

1. **PL-3 no existe.** La transición no declara el campo de derivación (`packages/shared/src/transitions.ts:98` define el campo `derivacion`, pero la línea 247 no lo usa), así que la guarda de «persona derivada inexistente» nunca se dispara con esta transición y no hay par que probar. M3 cae sólo por PL-4.
2. **PL-1 bis sí se incluye** (existe en la spec y no en el diseño): 403 de área, nace verde como caracterización.
3. **Arnés (`apps/desk/server/testing/appHarness.ts`):** pg-mem no sabe `jsonb || jsonb` (lo trata como texto y revienta). Con D7 la liberación escribe SIEMPRE una clave de `custom_fields`, y la matriz de 31, la de permisos, `cargoPermiso` y `guardaGasPatron` pasaron a dar 500. Se añadió `emularMezclaJsonb` (~20 líneas, en el arnés compartido): emula la misma mezcla leyendo antes la fila y sólo toca esa sentencia. Hasta F1C-05 ninguna prueba HTTP escribía una clave fuera de `PROMOTED_COLUMNS`. **Hipótesis:** en PostgreSQL real el operador funciona (es la sentencia de producción de `packages/zoho-sync/src/db/repo.ts:309`, sin cambios), pero ninguna prueba de este repositorio lo ejercita con un servidor real.
4. La narración de `apps/desk/server/transicionesEjecucion.test.ts:9` y `:13` quedó anclada con `2a74fdc` en las dos líneas que afirman la casilla; el resto de su narración no se tocó.
5. Se partió la prueba de M8 en dos (ver mutaciones).
6. «Una segunda liberación» se prueba por HTTP con el mismo administrador: el segundo `liberar` reutiliza su cookie (crear dos administradores choca con la clave única).
