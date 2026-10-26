---
tanda: F1B-13
motivo: ""
capacidad: [tickets-core]
maestro: ["Anexo D nº 7"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `valor-reclamado-usd`

Construye `decision/f1b13-valor-reclamado-usd` (Gerencia, 2026-10-26; `openspec/config.yaml:5434-5460`), que cierra la P-1
(`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:279`) y corrige el S-4
(`openspec/changes/archive/2026-10-06-ficha-garantia-proveedor/proposal.md:159`) de `ficha-garantia-proveedor`. Fila:
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`; regla de dominio: `CLAUDE.md:691-701`. Sin exploración previa.

*Sobre la cabecera.* `cierra: no`: queda el envío físico de la pieza por remisión sin ticket
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2667`), que depende de F1B-16, «condicionada»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`); la carga en ISO 14224 es otra fila
(`openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/archive-report.md:6-10`). `toca_maestro: si`: al
terminar queda desactualizado M4.4, «valor reclamado (tomado del costo de la OVI)», sin moneda
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2664`), porque el valor sale del costo de
catálogo del artículo y no de la OVI; y queda falsa la frase «las líneas de una OVI conservan el costo de referencia»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1232`), que contradice el hecho (b) medido
(`openspec/config.yaml:5444-5446`). El Anexo D nº 7 sigue siendo cierto: sólo nombra «valor reclamado y valor recuperado»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5699`). La corrección 29 queda caduca (§12).

## 1 · Intención

Hoy el valor reclamado lo teclea una persona al abrir la ficha, siempre con origen `manual`
(`apps/desk/server/db/garantiaProveedor.ts:95-100` en `c6147860`), y ningún importe dice su moneda: la pantalla pinta el número pelado
(`apps/desk/src/components/PanelGarantiaProveedor.tsx:26` en `c6147860`, `apps/desk/src/components/MedicionGarantias.tsx:16` en `c6147860`) y la spec
viva supone «pesos» (`openspec/specs/tickets-core/spec.md:2556-2557`), cuando el costo de Books está en USD
(`openspec/config.yaml:5439`). Al terminar: al responder «sí», el servidor guarda como foto el valor reclamado calculado de
las líneas de la OVI y del costo de catálogo, en USD y con origen `ovi`; corregirlo a mano lo deja `manual`; y cada importe
de la ficha y de la medición sale de la API y se pinta con «USD» al lado.

## 2 · Lo que hay hoy (medido)

- El «sí» lleva `valorReclamado` en el cuerpo (`packages/shared/src/garantiaProveedor.ts:68-70` en `c6147860`), validado como número ≥ 0
  (`packages/shared/src/garantiaProveedor.ts:137-138`); el panel lo captura
  (`apps/desk/src/components/PanelGarantiaProveedor.tsx:84-87` en `c6147860`).
- `editarFicha` reemplaza el valor sin tocar el origen (`apps/desk/server/db/garantiaProveedor.ts:114-121` en `c6147860`), y la spec lo
  exige (`openspec/specs/tickets-core/spec.md:2679`).
- Datos: `public.garantia_proveedor` sin columna de moneda (`packages/zoho-sync/src/db/schema.sql:727-751`);
  `books.sales_orders`, PK `salesorder_id`, con `raw` (`packages/zoho-sync/src/db/schema.sql:160-165`); `books.items` con
  `purchase_rate` (`packages/zoho-sync/src/db/schema.sql:380-384`). Las líneas de la orden no son tabla en `desk`: sólo
  `raw->'line_items'`, sin clave de costo (`openspec/config.yaml:5444-5446`); el costo está en `books.items`, relleno y
  mayor que 0 en las 15 líneas medidas (`openspec/config.yaml:5447-5448`).
- `ov_asociaciones.salesorder_id` admite NULL (`packages/zoho-sync/src/db/schema.sql:543`). Lo escriben con el id de Books
  el alta (`apps/desk/server/services/equipoNuevo.ts:91-95`) y la remisión (`apps/desk/server/routes/remision.ts:243`); las
  transiciones lo resuelven por número y lo dejan NULL si no resuelve (`packages/zoho-sync/src/db/ovAsociaciones.ts:163-166`).

## 3 · Alcance

**Dentro**

1. Foto al abrir: función pura en `packages/shared` (Σ cantidad × costo de catálogo, todo o nada, S-4); el servidor lee en
   TS el `raw` de la orden y los costos, sin funciones `jsonb` en SQL (pg-mem), y guarda el valor con origen `ovi`.
2. Editar: si el valor cambia, el origen pasa a `manual`; si no, se conserva (S-5). La regla, pura en `shared`.
3. Moneda: todo importe de la ficha (reclamado y recuperado) y de la medición (RQ-TC-65 a RQ-TC-68) sale de la API con su
   moneda al lado, USD; el `.tsx` pinta «USD» junto a cada importe y en cada campo de captura. Sin código de conversión
   (consecuencia (3), `openspec/config.yaml:5455`).
4. S-4 corregido en sitio: el comentario de `packages/shared/src/garantiaProveedor.ts:36-37` en `c6147860` deja de decir «mientras no se
   calcule solo», sin desplazar líneas.
5. Spec viva `tickets-core`: MODIFIED en sitio con el mismo número de líneas, y ADDED al final (§4).
6. Entregable del cierre: inventario de los demás importes de Desk sin moneda (§13).

**Fuera — y por eso `cierra: no`**

- El envío físico por remisión sin ticket (F1B-16) y la carga en ISO 14224 (otra fila).
- Reescribir datos previos (P-1 cuenta las fichas con importe) y corregir importes sin moneda fuera de F1B-13 (se inventarían).
- Recalcular la foto tras abrir (S-11), convertir monedas, mover guardas (G1 a G14 no cambian) y añadir interruptor (no hay
  escritor externo).

**Qué parte de la fila F1B-13 cubre, en una línea:** el valor reclamado tomado del costo (foto en USD, editable a mano) y la
moneda de todos los importes de la ficha y de la medición; deja fuera el envío físico por remisión sin ticket (F1B-16).

## 4 · Enfoque — regla invariable 13

- **`packages/shared`**: la foto y la regla del origen al editar, puras; las constantes del origen `ovi` y de la moneda, y la
  etiqueta visible del origen (S-7). Lo nuevo, al final del fichero o en módulo nuevo (lo decide el diseño), sin desplazar
  líneas citadas. Si la moneda viaja en el resultado de `medirGarantias`, la ruta sigue devolviendo lo de `shared` con un
  solo cambio (`openspec/specs/tickets-core/spec.md:4055-4058`).
- **Servidor**: en el «sí», tras G6 (`apps/desk/server/routes/garantiaProveedor.ts:55`) y antes del `INSERT`, lee la orden
  por `salesorder_id` (S-1) y los costos con `IN ($1,…)` (`apps/desk/server/db/garantiaProveedor.ts:172`), llama a `shared`
  y guarda su resultado. La foto no es guarda: nunca rechaza (S-9). En editar compara con la ficha ya leída
  (`apps/desk/server/routes/garantiaProveedor.ts:67`) mediante la regla de `shared`.
- **Cliente**: el formulario del «sí» deja de ofrecer el valor (S-2); la ficha pinta valor, moneda y origen tal como llegan.
  Fuera de la red de pruebas (F0-00): sin rojo previo; lo respalda la prueba de servidor (§6).
- **Spec**: un MODIFIED a mitad de una spec de 4.522 líneas conserva su número de líneas o desplaza todas las citas
  posteriores. Se reescriben en sitio sólo las frases que la decisión vuelve falsas: en RQ-TC-45, «en pesos»
  (`openspec/specs/tickets-core/spec.md:2556-2557`), «se construirán después» (`openspec/specs/tickets-core/spec.md:2567-2568`)
  y el escenario «no es automático» (`openspec/specs/tickets-core/spec.md:2590-2593`); en RQ-TC-47, «el origen MUST NOT
  cambiar» (`openspec/specs/tickets-core/spec.md:2679`); en RQ-TC-65, «pesos» (`openspec/specs/tickets-core/spec.md:3948-3949`).
  Lo nuevo va ADDED desde RQ-TC-78, tras RQ-TC-77 (`openspec/specs/tickets-core/spec.md:4498`): foto al abrir, origen al
  editar, y moneda en la API y en pantalla con su casilla de regla 13.

## 5 · Supuestos reversibles

| # | Supuesto | Por qué | Alternativa |
|---|---|---|---|
| S-1 | La OVI se busca por `ov_asociaciones.salesorder_id`, PK de `books.sales_orders`; si es NULL, no hay foto | Lo da Books en el alta y la remisión (§2); `salesorder_number` no tiene restricción de unicidad (`packages/zoho-sync/src/db/schema.sql:160-165`) y en el alta el número puede ser el tecleado y no el de Books (`apps/desk/server/services/ticketService.ts:42`) | Caer al `ovi_numero` cuando el id es NULL, exigiendo una sola fila (molde `packages/zoho-sync/src/books/subOV.ts:41-44`) |
| S-2 | Un `valorReclamado` en el cuerpo del «sí» se ignora, no se rechaza; el formulario deja de pedirlo | Molde RQ-TC-62 (`openspec/specs/tickets-core/spec.md:3759`): un cliente en caché sigue funcionando; y nadie conoce la foto antes de abrir | Usarlo como valor manual cuando no hay foto; o `422` |
| S-3 | Sin foto: valor NULL y origen `manual` | Es como quedan hoy todas las fichas (`apps/desk/server/db/garantiaProveedor.ts:99` en `c6147860`): una sola forma de decir «lo pone una persona» | Origen NULL hasta que alguien escriba |
| S-4 | Todo o nada: sin fila de la orden, sin `line_items` o vacía, una línea sin `item_id`, sin cantidad finita mayor que 0, o un artículo ausente de `books.items` o con `purchase_rate` NULL o ≤ 0 → sin foto | Una suma parcial es un importe falso con apariencia de dato | Sumar las líneas válidas y marcar la foto como parcial |
| S-5 | «Cambia» se juzga por número: NULL→NULL y X→X conservan el origen; X→NULL, NULL→X y X→Y pasan a `manual` | Guardar sin tocar el valor no es corregirlo | Toda edición pasa a `manual` |
| S-6 | La suma se redondea a 2 decimales una sola vez, al final | El centavo de dólar es la unidad; redondear por línea acumula error | Por línea; o sin redondeo |
| S-7 | La ficha enseña el origen junto al valor («calculado de la OVI» / «a mano»), con etiqueta de `shared` | Quien lee sabe si el número es del catálogo o de una persona | No enseñarlo |
| S-8 | Moneda: **constante o columna; lo cierra el diseño** (debajo) | — | — |
| S-9 | La foto va tras G6 y antes del `INSERT`, sin transacción propia | No rechaza nada: G1 a G6 y sus pruebas de posición no cambian | En la transacción del `INSERT` |
| S-10 | No se lee la moneda de la orden (`currency_code`, `packages/zoho-sync/src/db/schema.sql:162`): el costo de catálogo está en la moneda base, USD. **Hipótesis** fuera del artículo 300-P-C | Hecho (a) de la decisión (`openspec/config.yaml:5442-5443`) | Negar la foto si algo indica otra moneda |
| S-11 | La foto no se recalcula si el catálogo cambia después | Es lo que «foto» significa en la decisión | Un acto de recálculo |

**S-8, enmarcado.** (a) *Constante* en `shared`: la API pone `USD` al lado de cada importe; sin migración, pero toda ficha
previa se pinta en USD aunque alguna se anotara en pesos (P-1 dice cuántas mirar). (b) *Columna* en
`public.garantia_proveedor` (`ALTER TABLE public.garantia_proveedor ADD COLUMN IF NOT EXISTS …`, al final de `schema.sql`):
las fichas previas quedan con moneda NULL, que es lo exacto, pero la medición tiene que decidir qué hace con un importe sin
moneda, y hay despliegue con migración. Ningún supuesto contradice una decisión de `openspec/config.yaml` leída aquí.

## 6 · Casilla de regla 13 (regla de mutación 3)

| # | Decisión del cliente | La impone |
|---|---|---|
| 1 | No ofrece el valor en el «sí» | El servidor ignora el del cuerpo (S-2), con prueba de servidor |
| 2 | Pinta «USD» junto a cada importe y en los campos de captura | La moneda llega en la respuesta: el `.tsx` no la decide ni la escribe como literal |
| 3 | Pinta el origen | Etiqueta de `shared` sobre el origen que guarda el servidor |
| 4 | Manda el valor editado tal cual | El servidor decide el origen (S-5) |

Las líneas del servidor aún no existen: el diseño nombra la ruta y el cierre del lote escribe la línea, decisión a decisión.

## 7 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `tickets-core` — MODIFIED en sitio de RQ-TC-45, -47 y -65 (§4); ADDED desde RQ-TC-78.

## 8 · Disciplina que se verifica

- `strict_tdd`: rojo antes de cada verde, en `shared`, capa de datos y rutas.
- Mutaciones, con **M0** (sin mutar, verde) y cada una **roja**: (a) quitar la cantidad de la suma; (b) dejar el origen en
  `ovi` al editar; (c) ensuciar el fixture con una línea sin `item_id` (regla de mutación 2: se muta lo vigilado); (d) quitar
  la moneda de la respuesta; y, si el diseño elige columna, (e) escribir en `schema.sql` el `ALTER` sin esquema y ver rojo
  el guardián. Se registran en `apply-progress.md`.
- Barrido de citas al cerrar (regla de mutación 4) en cada fichero donde se inserten o muevan líneas, spec viva incluida.
- `npm run typecheck`, `npm run lint -- --max-warnings 165`, detector, `npm test` en serie con log y `npm run build`: salen 0.

## 9 · Áreas afectadas y estimación por intento

| Área | Líneas |
|---|---|
| `packages/shared` (foto, origen, constantes, S-4 en sitio, moneda de la medición) + pruebas | 55 + 135 |
| `apps/desk/server/db/garantiaProveedor.ts` + prueba | 40 + 60 |
| `apps/desk/server/routes/garantiaProveedor.ts` + pruebas de rutas y de la medición | 12 + 120 |
| `PanelGarantiaProveedor.tsx`, `MedicionGarantias.tsx`, `api/client.ts` | 37 |
| Sólo si columna: `schema.sql`, guardián y `DEPLOY.md` | 17 |

| Intento | Estimado |
|---|---|
| Propuesta (este fichero) | ~230 |
| Spec: delta con tres MODIFIED completos (58, 63 y 81 líneas) y tres ADDED | ~340 |
| Diseño / tareas | ~250 / ~110 |
| Aplicar, un lote | **~460** (constante) / **~480** (columna) |
| Verify (`verify-report.md`; precedente 358) | ~300 |
| Archivo: fusión del delta (se mide en worktree, no se estima) y `archive-report.md` con inventario | ~230 + fusión |

Todo cabe bajo la válvula de 720. Si la spec la pasara por los MODIFIED, se parte en dos intentos. Cada intento se mide con
`git diff --shortstat --no-renames` contra su partida más `wc -l` de lo nuevo sin trackear.

## 10 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| La OVI aún no ha llegado a `books.sales_orders` al responder (réplica) | Media | Sin foto y origen `manual` (S-4); la persona lo escribe |
| Fichas previas anotadas en pesos y pintadas como USD | Media; volumen sin medir | P-1; con columna, moneda NULL |
| Columna: migración en el despliegue e importes sin moneda en la medición | Sólo con (b) | DDL al final de `schema.sql`, calificado; mutación (e); nota en `DEPLOY.md` |
| `purchase_rate` en otra moneda para algún artículo | Baja (hipótesis S-10) | Foto editable a mano y origen visible |
| Coma flotante en la suma | Media | S-6, con casos de prueba con decimales |
| Un cliente en caché manda `valorReclamado` en el «sí» | Baja | S-2: se ignora |

## 11 · Marcha atrás

Revertir los commits. Las fichas abiertas con origen `ovi` conservan su valor, y el código anterior lee el origen como
texto sin interpretarlo (`apps/desk/server/db/garantiaProveedor.ts:61`). Si el diseño elige columna, queda sin lectores
(hipótesis: `migrate` no borra columnas). Ningún dato previo se habrá reescrito.

## 12 · Tareas de persona — fuera del recuento

No son tareas del `tasks.md` (regla del ciclo 1). **Archivar este cambio no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Listar con SQL de sólo lectura las fichas con algún importe, por si alguna se anotó en pesos (consulta debajo) | Alfonso | Si alguna está en pesos: punto abierto con dueño en `docs/sdd/ENTRADA.md` para que Gerencia decida su corrección, que toca datos de producción (una ficha resuelta no se edita y el valor recuperado no tiene ruta de edición) | Esta sección y el `archive-report.md`; la entrada de la bandeja, en `main` al fusionar (la rama no edita `ENTRADA.md`) |
| P-2 | Pegar en el maestro la corrección 29 enmendada | Gerencia | El maestro deja de decir «tomado del costo de la OVI» y que las líneas conservan el costo | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |

```sql
-- P-1 · base desk, sólo lectura. Un 0 vale lo mismo en cualquier moneda.
SELECT id, ovi_numero, fabricante, estado, valor_reclamado, valor_recuperado, respondida_at
FROM public.garantia_proveedor
WHERE reclama AND (valor_reclamado IS NOT NULL OR valor_recuperado IS NOT NULL)
ORDER BY id;
```

**Corrección para el maestro (supuesto reversible: enmendar la 29 en sitio, no abrir otra).** Su punto 2
(`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1474-1476`) pasa a «valor reclamado en USD, foto al abrir la ficha:
cantidad × costo de catálogo del artículo, sumado por línea de la OVI; editable a mano, y la ficha guarda su origen», con
el recuperado anotado en USD, y suma la línea 1232 del maestro: el costo lo conserva el catálogo, no la línea. El punto 3
(`docs/sdd/F0-01_Correcciones_para_el_maestro.md:1477-1480`) se pone al día: construidos el valor automático y las dos
mediciones; falta el envío físico. Se reescribe dentro de sus líneas; si no cabe, barrido de las citas a ese fichero.

## 13 · Entregable del cierre: importes sin moneda

El `archive-report.md` lleva el inventario de los demás importes que Desk guarda o devuelve sin moneda, cada uno con ruta y
línea, como entrada para la bandeja (R-3). Esta tanda no corrige ninguno (`CLAUDE.md:691-701`).

## 14 · Criterios de éxito

- [ ] Un «sí» sobre una OVI con todas sus líneas completas guarda Σ cantidad × costo, a 2 decimales, con origen `ovi`.
- [ ] Con cualquier hueco de S-4, o con `salesorder_id` NULL, valor NULL y origen `manual`; nunca una suma parcial.
- [ ] Un `valorReclamado` en el cuerpo del «sí» no cambia nada; al editar, los cinco casos de S-5 dan el origen de S-5.
- [ ] Las cuatro respuestas de la ficha y la de la medición llevan USD junto a cada importe, y la pantalla lo pinta.
- [ ] `packages/shared/src/garantiaProveedor.ts:36` ya no dice «mientras no se calcule solo» y la constante sigue en la 37.
- [ ] M0 verde y (a) a (d) —y (e) si hay columna— rojas, registradas; las pruebas de posición de G1 a G14, sin tocar y verdes.
- [ ] La spec viva conserva sus líneas hasta RQ-TC-77; lo nuevo empieza en RQ-TC-78; barrido de citas hecho.
- [ ] Typecheck, lint (165), detector, `npm test` y build salen 0.
- [ ] El `archive-report.md` dice qué parte de F1B-13 cubre y lleva el inventario de §13.

## 15 · Ronda de preguntas

`execution_mode: auto` (`openspec/config.yaml:25-30`): no se para. Ningún supuesto cambia el alcance, cuesta dinero, toca
datos de producción ni contradice una decisión; S-1 a S-11 van a la lista semanal y S-8 lo cierra el diseño por escrito.
