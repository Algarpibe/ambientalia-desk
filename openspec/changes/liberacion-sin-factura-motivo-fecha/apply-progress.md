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
