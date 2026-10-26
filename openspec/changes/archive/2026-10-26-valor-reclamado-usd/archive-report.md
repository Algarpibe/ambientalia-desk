# Informe de archivo — `valor-reclamado-usd` (F1B-13, `cierra: no`)

Archivado el 2026-10-26 en la rama `valor-reclamado-usd` (worktree hermano, base `7cf5faf0`) y **sin fusionar a `main`**: la tanda para
antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su momento;
donde difieran, manda este informe.

**Fila F1B-13** («Ficha de garantía con el proveedor», `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:93`).
**Cubrió el valor reclamado tomado del costo (foto en USD al abrir la ficha, Σ cantidad × costo de catálogo, editable a mano y con su
origen) y la moneda de todos los importes de la ficha y de la medición; dejó fuera el envío físico de la pieza por remisión sin ticket,
que depende de F1B-16 («condicionada», `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96`), y la tarea de persona del recuento
de fichas previas con importe (P-1).** Por eso sigue `cierra: no`. La decisión está en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`,
citada por clave: `decision/f1b13-valor-reclamado-usd`.

## 1. Qué queda construido

`git diff --shortstat --no-renames 7cf5faf0 6aa23bba -- apps packages`: 16 ficheros, 631 inserciones y 60 borrados; de ellos, 9 ficheros
de código (151 y 35) y 7 de pruebas (480 y 25). Fuera de `apps` y `packages`, sólo la corrección 29 enmendada en sitio
(`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, 9 y 9) y los documentos de esta carpeta.

| Pieza | Dónde |
|---|---|
| Foto pura: Σ cantidad × costo, todo o nada (S-4), un solo redondeo a 2 decimales (S-6), origen `ovi` | `packages/shared/src/valorReclamado.ts` (nuevo, 88 líneas; la suma en `packages/shared/src/valorReclamado.ts:62`), exportado en `packages/shared/src/index.ts:55` |
| Origen al editar (S-5): conserva sólo si el número no cambia | `packages/shared/src/valorReclamado.ts:73` |
| El «sí» ignora el valor del cuerpo (S-2) | `packages/shared/src/garantiaProveedor.ts:151` |
| Moneda constante `USD`, sin columna ni migración (S-8, D-1) | `packages/shared/src/garantiaProveedor.ts:195` |
| Moneda en cada grupo de la medición (el cociente no la lleva) | `packages/shared/src/medicionGarantias.ts:63` |
| Moneda en toda ficha devuelta (lectura, «sí», «no», editar, avanzar) | `apps/desk/server/db/garantiaProveedor.ts:64` |
| Lectura de la orden y los costos para la foto, en TS y sin `jsonb` en SQL | `apps/desk/server/db/garantiaProveedor.ts:189-201` (`fotoDeLaOVI`, al final del fichero) |
| Guardar la foto en el «sí», tras G6 y sin rechazar nada (S-9) | `apps/desk/server/routes/garantiaProveedor.ts:57`, `apps/desk/server/db/garantiaProveedor.ts:99` |
| Escribir el origen que decide `shared` al editar | `apps/desk/server/routes/garantiaProveedor.ts:78`, `apps/desk/server/db/garantiaProveedor.ts:116` |
| Pantalla: moneda que llega junto a cada importe y en la captura; origen junto al reclamado; el «sí» no pide valor | `apps/desk/src/components/PanelGarantiaProveedor.tsx`, `apps/desk/src/components/MedicionGarantias.tsx` y `apps/desk/src/api/client.ts:848`, todo en sitio; `grep -rn "USD" apps/desk/src` = 0 |

`packages/shared/src/garantiaProveedor.ts:36` ya no dice «mientras no se calcule solo» y la constante del origen manual sigue en la línea
siguiente. **Colocación:** ninguna línea existente cambió de número en ningún fichero de código ni de pruebas (hunks N→N o añadidos al
final; lo comprobó el verificador, sección 6 de `openspec/changes/archive/2026-10-26-valor-reclamado-usd/verify-report.md`).
**Sin migración ni DDL:** `git diff --stat 7cf5faf0 6aa23bba` sobre `packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/db/migrate.ts`,
`DEPLOY.md` y `.env.example` sale vacío. Ningún interruptor nuevo.
**Bundle del cliente:** `dist/assets/index-BFrlA0VZ.js` **427.122 B** (producción, `index-Hz9CFuzO.js`, 426.836 B: +286 B) y
`dist/assets/index-BXv9vVDm.css` 32.681 B (mismo nombre que producción).

## 2. Rojo, verde y mutaciones

- Cada lote vio sus rojos antes del verde, por la causa esperada, y los anotó en `apply-progress.md` (L1.5, L2.6). Los dos `.tsx` quedan
  fuera de la red de pruebas por F0-00; los respalda la prueba de servidor.
- **M0 y las mutaciones (a), (b1), (b2), (c), (d1), (d2), (f), (g), (h) e (i): todas rojas** por la prueba esperada y restauradas byte a
  byte; (e) no aplica (sin DDL). Regla de mutación 1: mover la foto antes de G6 no cambia ninguna respuesta (la foto no es guarda). El
  verificador repitió (a), (b), (c), (d1) y (d2) por su cuenta.
- Debilidad anotada (S-C del verify): con el fixture sucio (mutación (c)) los cinco huecos que dependen de la base siguen en verde; sólo
  los protege la prueba positiva.

## 3. Spec viva

Fusión por script (`fusiona-vru.mjs`, en el directorio temporal de la sesión, no versionado), ensayada en seco y medida antes de aplicar:

- **RQ-TC-45, RQ-TC-47 y RQ-TC-65 (MODIFIED)**, casados por identificador y sustituidos en sitio en `openspec/specs/tickets-core/spec.md`,
  a igual longitud: 57, 62 y 80 líneas, con 6, 9 y 9 escenarios antes y después. Cambian 15 líneas: 12 en RQ-TC-45 (las 2556-2559,
  2567-2568, 2586, 2588 y 2590-2593), 2 en RQ-TC-47 (las 2679-2680) y 1 en RQ-TC-65 (la 3949). Se conservan las cabeceras vivas tal cual,
  incluido el «Requirement: » de RQ-TC-65, que la spec viva ya llevaba.
- **RQ-TC-78, RQ-TC-79 y RQ-TC-80 (ADDED)** al final, tras RQ-TC-77: `openspec/specs/tickets-core/spec.md:4524-4592`,
  `openspec/specs/tickets-core/spec.md:4594-4624` y `openspec/specs/tickets-core/spec.md:4626-4677` (69, 31 y 52 líneas; 10, 5 y 6 escenarios). La spec pasa de 4.522 a 4.677 líneas y de 499 a 520 escenarios.
- Comprobado por script: los seis bloques vivos son **idénticos** a los del delta. Ninguna cabecera hasta RQ-TC-77 cambia de línea
  (`diff` de las cabeceras antes y después: sólo el título del escenario reescrito en sitio en la línea 2590 y los añadidos).
- `git diff --numstat` de la fusión: **170 y 15 (185)**, medida en seco antes de aplicar y repetida al aplicar.

**Parte revisable** (regla del archivo): la fusión (185) más este informe. Sumados quedan muy por debajo de 800 (ver la sección 5).

## 4. Antes de la mudanza

- Cinco citas de `proposal.md` a líneas de la spec que la fusión reescribe describían la spec de antes («en pesos», «se construirán
  después», «no es automático», «el origen MUST NOT cambiar», «pesos») —ciertas hasta esta fusión, falsas desde ella: caso B—. Se anclan
  en su revisión, `en c6147860`, en la misma línea física (líneas 34, 45 y 94-96 de la propuesta), sin renumerar.
- Ninguna otra cita del repositorio cae en las líneas cambiadas. La del archivo de `medicion-garantias-por-marca` (rango 2420-2808, «RQ-TC-44
  a RQ-TC-48») abarca líneas que no se desplazan; registro fechado, no se toca.
- Las rutas a la propia carpeta (`openspec/changes/` seguido del nombre del cambio) se reescriben a la de archivo en el mismo commit:
  4 apariciones en 2 ficheros (`apply-progress.md` y `verify-report.md`). Nada fuera de la carpeta nombra su ruta (`git grep`).
- `tasks.md` marca `A.1`.

## 5. Registro de intentos (`gentle-ai sdd-attempt`)

Medida de cada intento = `git diff --shortstat --no-renames` contra su commit de partida más `wc -l` de lo nuevo sin trackear (siempre 0
al asentar). Ningún binario.

| # | Trabajo | Commit de cierre | Medida | Resultado |
|---|---|---|---|---|
| 1 | Propuesta y diseño | `86418630` | 445 | passed |
| 2 | Delta de `tickets-core` y tareas | `c6147860` | 461 | passed |
| 3 | Apply L1 (`shared`) | `eaeda6e5` | 321 | passed |
| 4 | Apply L2 (servidor) | `2bf0c72b` | 495 | passed |
| 5 | Apply L3 (cliente y cierre) | `234e9dd0` | 224 | passed |
| 6 | Verify | `6aa23bba` | 208 | passed |
| 7 | Archivo (la mudanza cuenta doble) | este commit | 2.875 + este informe (167) = **3.042** | ver el `settle` |

El intento 7 se abrió con techo 3.490 (dos veces la carpeta, 1.345 líneas, más 800). Su parte revisable, medida antes de aplicar, es la
fusión (185) más este informe (167): **352**. El resto es la mudanza (1.345 borradas y 1.345 añadidas), que el registro cuenta dos veces
por medir sin detección de renombrado; los anclajes y las rutas reescritas son ediciones en sitio dentro de ella.

## 6. Verify y ejecución

- **Verify: PASS CON AVISOS** (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/verify-report.md`, sobre validado por
  `gentle-ai sdd-verify-validate`): 6/6 requisitos y 45/45 escenarios, 0 críticos; W-1 resuelto (casillas de cierre marcadas en `6aa23bba`),
  W-2 y W-3 vivos (abajo).
- **W-2.** Un error de infraestructura en la lectura de la foto (p. ej. sin esquema `books`) da 500 en vez de «sí» sin foto. En producción
  `books.items` existe; sólo afectaría a un entorno sin réplica de Books.
- **W-3.** `npm test` entero salió 1 en cuatro pasadas seguidas sobre el mismo código (14:32, 14:54, 15:33 y 15:52: 1 y 6 plazos vencidos en
  `apps/desk/server/citas/`, y 2 o 3 «Timeout calling onTaskUpdate» del worker de vitest en cada una) y 0 en la quinta, a las 17:06 con el
  cargador conectado (5655 de 5655, 0 errores, 305,4 s). Causa probable, la alimentación de la máquina: **hipótesis**, con las cifras en
  la sección 2 del verify. No se tocaron plazos, `maxWorkers` ni `cederAlBucle`.
- **Cadena del archivo** (sobre este commit, en serie): sus códigos van en el `settle` del intento 7 y en el parte de la tanda.

## 7. Pendiente fuera de la rama (la rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`)

- **Inventario de importes sin moneda (sección 10)** para la bandeja (R-3): entra en `docs/sdd/ENTRADA.md` al fusionar, con dueño.
- **P-1**, si alguna ficha previa resulta estar en pesos: punto abierto con dueño en `docs/sdd/ENTRADA.md` (toca datos de producción).
- Los supuestos de la sección 8, a la lista semanal bajo F1B-13 (regla de las preguntas a Gerencia).

## 8. Supuestos reversibles — a la lista semanal, bajo F1B-13

Los once de la propuesta (S-1 a S-11, sección 5 de `proposal.md`). S-8 lo cerró el diseño: moneda constante `USD` en `shared`, sin columna
ni migración. **S-10** (el costo de catálogo está en USD fuera del artículo medido) sigue siendo hipótesis; la foto es editable a mano y su
origen se ve. **S-11** (la foto no se recalcula) lo fija una prueba.

## 9. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño |
|---|---|---|
| P-1 | Contar con SQL de sólo lectura las fichas previas con algún importe, por si alguna se anotó en pesos (la consulta está en la sección 12 de `proposal.md`) | Alfonso |
| P-2 | Pegar en el maestro la corrección 29 enmendada (`docs/sdd/F0-01_Correcciones_para_el_maestro.md`) | Gerencia |
| P-3 | Desplegar (sin migración ni DDL) y comprobar en la app que la ficha y la medición enseñan «USD» y el origen del valor | Usuario |

## 10. Inventario de importes de Desk sin moneda (R-3: entrada para la bandeja; no se corrige ninguno)

Medido el 2026-10-26 por el aplicador (L3.7 de `apply-progress.md`) y contrastado por otra vía por el verificador (sección 9 del verify);
el orquestador releyó hoy cada línea citada. **Hipótesis:** una búsqueda por nombre de campo puede perder un importe con otro nombre.
**33 importes sin moneda en tres superficies** (1 por la API, 15 en `books.*`, 17 en CRM), más 1 anotado. Ninguno lo teclea una persona:
todos llegan por replicación desde Zoho Books o Zoho CRM.

**A. Lo que la API de Desk devuelve sin moneda (1).** `total` de la orden de venta: la vista expone `total` sin `currency_code`
(`packages/zoho-sync/src/db/schema.sql:178`; la moneda existe en la tabla base, `packages/zoho-sync/src/db/schema.sql:162`), lo leen
`packages/zoho-sync/src/books/repo.ts:106`, `packages/zoho-sync/src/books/repo.ts:169` y `packages/zoho-sync/src/books/repo.ts:180`, lo tipa
`packages/shared/src/types.ts:310` y sale por `GET /api/sales-orders` (`apps/desk/server/routes/directory.ts:53`). Ningún componente lo pinta hoy.

**B. `books.*` (réplica en `desk` y su hub): 15 columnas en 5 tablas sin moneda en la fila.**
- `books.items`: `rate`, `purchase_rate` (`packages/zoho-sync/src/db/schema.sql:382`; hub `packages/zoho-sync/src/booksHub/schema-books.sql:5`).
  `purchase_rate` es el costo del que F1B-13 hace la foto; su moneda es S-10.
- `books.salesorder_line_items`, `books.invoice_line_items` y `books.purchase_order_line_items`: `rate`, `bcy_rate`, `item_total` cada una
  (`packages/zoho-sync/src/booksHub/schema-books.sql:11`, `packages/zoho-sync/src/booksHub/schema-books.sql:24` y `packages/zoho-sync/src/booksHub/schema-books.sql:53`).
- `books.customer_payment_invoices`: `amount_applied`, `tax_amount_withheld`, `total`, `balance`
  (`packages/zoho-sync/src/booksHub/schema-books.sql:38`; la moneda está en el padre, `packages/zoho-sync/src/booksHub/schema-books.sql:30`).

**C. Anotado, no contado (1).** `amount_usd` (`packages/zoho-sync/src/booksHub/salesRecords.ts:3`): la moneda va en el nombre de la columna.

**D. CRM en el hub `zoho-hub`, no en la base `desk`: 17 columnas en 6 tablas sin moneda.** `crm.deals` (`amount`, `expected_revenue`;
`packages/zoho-sync/src/crmHub/schema-crm.sql:11-12`), `crm.products` (`unit_price`; `packages/zoho-sync/src/crmHub/schema-crm.sql:38`),
`crm.quotes` (`sub_total`, `tax`, `discount`, `grand_total`; `packages/zoho-sync/src/crmHub/schema-crm.sql:45`), `crm.campaigns`
(`expected_revenue`, `budgeted_cost`, `actual_cost`; `packages/zoho-sync/src/crmHub/schema-crm.sql:51-52`), `crm.visits` (`revenue`;
`packages/zoho-sync/src/crmHub/schema-crm.sql:60`) y `crm.quote_line_items` (`list_price`, `total`, `discount`, `total_after_discount`,
`tax`, `net_total`; `packages/zoho-sync/src/crmHub/schema-crm.sql:67`).

**Ya con moneda por F1B-13:** `valor_reclamado` y `valor_recuperado` (`packages/zoho-sync/src/db/schema.sql:740`,
`packages/zoho-sync/src/db/schema.sql:744`), con `moneda` en toda respuesta. Si Desk debe guardar la moneda junto a los demás lo decide Gerencia.

## 11. Qué se verá en la aplicación

Al desplegar: al responder «sí» a «¿Se reclama al fabricante?», la ficha nace con el valor reclamado ya calculado de la OVI (o vacío, si
falta algún dato), con «USD» al lado y la etiqueta de su origen; el formulario del «sí» ya no pide el valor. Corregirlo a mano lo marca
como escrito a mano. La medición por fabricante enseña «USD» junto a lo reclamado y lo recuperado. Las fichas previas conservan su valor y
se pintan en USD (por eso P-1).
