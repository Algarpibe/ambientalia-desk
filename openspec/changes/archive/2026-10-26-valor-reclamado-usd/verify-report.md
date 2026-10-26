```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:75eaa8f7831b820864b75c1a964f9e639a5330cd109805ddbcae6257cd67d933
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 45/45
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:9ad20e694e043d7dd8806a7debe01883d9de9298d1bb1e3bed066c2e71093255
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:72342aee52f6be5b00004c7d21c8383384f5292505b738d137efaf788b93c5ff
```

# Informe de verificación — `valor-reclamado-usd` (F1B-13, `cierra: no`)

**Cambio**: `valor-reclamado-usd` · **Rama**: `valor-reclamado-usd`, HEAD `234e9dd0`, base `7cf5faf0` · **Modo**: Strict TDD · **Fecha**: 2026-10-26
**Verificador**: independiente; no edita código ni pruebas ni commitea. Las mutaciones se restauraron byte a byte (`cmp`) y `git status` quedó limpio.
**Rehecho por el orquestador el 2026-10-26 a las 17:2x**, tras la 5.ª pasada de `npm test` (código 0): cambian el sobre, el veredicto,
la sección 2 y las secciones 11 y 12. Las secciones 3 a 10 son del verificador sobre `234e9dd0` y siguen valiendo: desde entonces no ha
cambiado ninguna línea de código (sólo `tasks.md` y este informe).

## Veredicto: PASS CON AVISOS

0 CRITICAL, 3 WARNING (W-1 resuelto en este commit; quedan W-2 y W-3), 5 SUGGESTION. Los 6 requisitos y los 45 escenarios tienen una prueba que pasó en ejecución; las cuatro
mutaciones pedidas (y una quinta) cayeron donde debían; typecheck, lint (165 contra 165), detector, `npm test` y build salen 0.
El CRITICAL de la versión anterior (C-1: `npm test` con código 1) queda resuelto **sin tocar una línea de código**: la 5.ª pasada,
a las 17:06 con el cargador conectado, sale 0 en 305 s, sin fallos y sin errores sin manejar. Las cuatro pasadas anteriores salieron 1
por plazos vencidos y errores del worker de vitest; su causa probable (la alimentación de la máquina) se deja como **hipótesis** (W-3).

## 1. Completitud

| Métrica | Valor |
|---|---|
| Tareas L1.1 a L1.10, L2.1 a L2.12, L3.1 a L3.9 | 31 de 31 marcadas `[x]` |
| `L1.c`, `L2.c`, `L3.c` (cierre del orquestador) | marcadas `[x]` en `openspec/changes/archive/2026-10-26-valor-reclamado-usd/tasks.md` en el mismo commit que este informe; la evidencia existe (commits `eaeda6e5`, `552140dd`, `1f3c85cc`) |
| `V.1` (esta fase) y `A.1` (archivo) | `V.1` marcada con este informe; `A.1` pendiente por diseño |

W-1 (resuelto): las tres casillas de cierre estaban sin marcar aunque sus commits y sus cifras existían; se marcan con este informe.

## 2. Ejecución (cadena, en el worktree)

| Paso | Código | Cifra |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm run lint -- --max-warnings 165` | 0 | 0 errores, **165** avisos (igual que `main`; sin holgura) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 7778 comprobadas, línea base 0 informadas, 0 cabeceras inválidas; 13 abreviadas rotas informativas, ninguna sobre los ficheros de este cambio |
| `npm test` (5.ª pasada, 17:06, la del sobre) | **0** | 323 ficheros pasan y 4 omitidos; 5655 pruebas pasan y 26 omitidas; **0 fallos y 0 errores sin manejar**; 305,4 s |
| `npm run build` | 0 | 181 módulos; `dist/assets/index-BFrlA0VZ.js` **427.122 B**; `dist/assets/index-BXv9vVDm.css` 32.681 B |

Typecheck, lint y build, rehechos a las 17:2x sobre el mismo código, salen 0 (lint: 0 errores y 165 avisos contra 165); el detector,
sobre `HEAD`, 0 (7778 comprobadas; 13 abreviadas rotas informativas, ninguna de este cambio; línea base 0; cabeceras inválidas 0).

**Las cinco pasadas de `npm test` del verify, y la de referencia.** Todas sobre el mismo código (`234e9dd0`). Hora local de inicio;
duración, recogida (`collect`) y pruebas (`tests`, tiempo sumado de los workers) según el resumen de vitest de cada log.

| Pasada | Hora | Código | Pruebas | Errores sin manejar | Duración | Recogida | Pruebas (suma) |
|---|---|---|---|---|---|---|---|
| Referencia: `i5b`, cierre de L3 | 14:00 | 0 | 5655 de 5655 | 0 | 282,7 s | 94,5 s | 664,0 s |
| 1.ª | 14:32 | **1** | 1 fallida, 5654 pasan | 2 | 612,9 s | 215,9 s | 1199,4 s |
| 2.ª | 14:54 | **1** | 6 fallidas, 5649 pasan | 3 | 882,7 s | 194,0 s | 1795,6 s |
| 3.ª | 15:33 | **1** | 5655 de 5655 | 2 | 547,2 s | 196,1 s | 1295,3 s |
| 4.ª | 15:52 | **1** | 5655 de 5655 | 2 | 449,3 s | 161,4 s | 1234,5 s |
| 5.ª (cargador conectado) | 17:06 | **0** | 5655 de 5655 | 0 | 305,4 s | 91,9 s | 688,2 s |

En todas, 26 pruebas y 4 ficheros omitidos (integración sin `TEST_DATABASE_URL`). Los errores sin manejar son todos el mismo:
`Error: [vitest-worker]: Timeout calling "onTaskUpdate"`; en la 3.ª y la 4.ª son lo único que da el código 1.
Logs: `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-i5b-140047.log` (referencia), `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-verify-1432.log` (1.ª), `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-verify-1454.log` (2.ª), `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-verify-1533.log` (3.ª), `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-verify-155209.log` (4.ª) y `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/84c1492d-a31e-4017-b4bc-78051d53de6e/scratchpad/npmtest-vru-verify-1706.log` (5.ª, la del sobre).
Bundle: producción mide 426.836 B (`index-Hz9CFuzO.js`, medido el 24/10); el de la rama pesa +286 B y el CSS conserva el nombre `index-BXv9vVDm.css`: coherente con un cambio de pocas líneas de `.tsx`.

**Fallos de pruebas en la 1.ª y la 2.ª pasada: todos en `apps/desk/server/citas/` (detector de citas), todos `Test timed out` (60000 ms salvo uno de 30000 ms):**
1.ª pasada: `apps/desk/server/citas/hook.test.ts` > «hook · M5 … cita rota en fichero sin trackear se ignora; el mismo fichero, con `git add` Y COMMIT, bloquea» (61,9 s).
2.ª pasada: `apps/desk/server/citas/hook.bordes.test.ts` (2: ruta no ASCII; `--sha <rev>`), `apps/desk/server/citas/hook.test.ts` (3: M1, rama nueva, M29) y `apps/desk/server/citas/instalador.test.ts` (1: M11 signo 2).
**Reejecución en solitario (tras la 3.ª):** `hook.test.ts` 17 de 17 (199 s para 17 pruebas); `hook.bordes.test.ts` más `instalador.test.ts` con `--testTimeout=300000`, 15 de 15 (218 s). Ninguna de esas pruebas importa los módulos tocados (`garantiaProveedor`, `medicionGarantias`, `valorReclamado`).

**Causa: HIPÓTESIS, no medida.** Que las cuatro pasadas con código 1 se deban a la alimentación de la máquina —el portátil en
batería con el plan «Equilibrado»— y no al código. A favor: el mismo código da 0 a las 14:00 y a las 17:06; la 4.ª pasada tarda en
recoger 161,4 s frente a 94,5 s de `i5b` (×1,71) y suma 1234,5 s de pruebas frente a 664,0 s (×1,86), y la 5.ª vuelve a las cifras de
`i5b` (91,9 s y 688,2 s, ×0,97 y ×1,04); la batería se registró descargando tras la 4.ª (memoria del proyecto
`carga-maquina-npm-test`, 26/10) y conectada y cargando a las 16:0x (medida del analista) y a las 17:06 (`Win32_Battery`
`BatteryStatus` 2; `BatteryStatus` de WMI `PowerOnline` y `Charging` verdaderos; 47 %). En contra, o sin comprobar: no se midió si a
las 14:00 estaba conectado, y una sola pasada con cargador no separa la alimentación de otras cargas que cambiaran a la vez.
No hay `TEST_DATABASE_URL`: las pruebas de integración contra PostgreSQL real se omiten (26 pruebas omitidas, 4 ficheros). Aviso, no fallo; las de este cambio corren en pg-mem.

## 3. Cumplimiento de la spec (cada escenario contra su prueba pasada)

Prueba = `fichero > describe > it`. Verificada con `vitest --reporter=verbose` (211 pruebas verdes en los 7 ficheros del cambio).

### RQ-TC-78 · Foto al abrir (10 de 10)

| Escenario | Prueba | Código |
|---|---|---|
| suma cantidad por costo, 2 decimales | `packages/shared/src/valorReclamado.test.ts` > «2 × 150,54 + 1 × 10 = 311,08, origen ovi»; `apps/desk/server/db/garantiaProveedor.test.ts` > fotoDeLaOVI > «2 × 150,54 …»; la ruta > «con la orden y el catálogo completos» | `packages/shared/src/valorReclamado.ts:60`, `:62` |
| artículo repetido cuenta dos veces | shared «un artículo repetido … 40»; db «… 2 × 1 × 20 = 40» | `packages/shared/src/valorReclamado.ts:57-61` |
| redondeo único | shared «tres de 1 × 0,004 dan 0,01» | `packages/shared/src/valorReclamado.ts:62` |
| costo como texto | db «con node-postgres el costo llega como TEXTO y el raw como TEXTO» (301,08) | `apps/desk/server/db/garantiaProveedor.ts:199` (`numero()`) |
| cada hueco deja sin foto (10) | db, diez `it.each` «hueco · …» (§3.1); ruta: «sin foto (la asociación no tiene orden)» y «un hueco … artículo que el catálogo no tiene», ambas `201` | `packages/shared/src/valorReclamado.ts:39-40`, `:59` |
| nunca parcial | db «nunca parcial …»; shared «un artículo ausente del mapa o con costo 0 da SIN_FOTO» | `packages/shared/src/valorReclamado.ts:59` |
| valor del cuerpo ignorado sin 422 | shared bloque «el «sí» ignora el valor reclamado» (5); ruta 999, -1, abc, Infinity y «999 sin foto» | `packages/shared/src/garantiaProveedor.ts:151`, `:153` |
| editar sigue validando | shared «al editar sigue siendo error» (4); ruta «un valor -1 al editar sigue dando 422 (G14)» | `apps/desk/server/routes/garantiaProveedor.ts:77` |
| G1 a G6 en su orden | POS-RS-1 a POS-RS-7 sin tocar (sin hunks en ellas) y «la foto no es guarda …» | `apps/desk/server/routes/garantiaProveedor.ts:57`, tras la guarda de `:55` |
| la foto no se recalcula | db «la foto no se recalcula … (S-11)» | `apps/desk/server/db/garantiaProveedor.ts:99` |

### 3.1 Los diez huecos de S-4 (una prueba por hueco)

`apps/desk/server/db/garantiaProveedor.test.ts` > «fotoDeLaOVI: la foto del valor reclamado (RQ-TC-78)» > «hueco · …»: (1) asociación sin `salesorder_id`; (2) sin fila de la orden en `books.sales_orders`; (3) orden sin `line_items`; (4) `line_items` vacía; (5) una línea sin `item_id`; (6) cantidad 0; (7) cantidad en texto; (8) artículo ausente de `books.items`; (9) costo NULL; (10) costo 0. Los diez pasan y esperan `{ valorReclamado: null, origenValorReclamado: 'manual' }`. En la capa pura, `packages/shared/src/valorReclamado.test.ts` repite los de la mitad de la orden (sin lista, vacía, sin `item_id`, cantidad 0, negativa, no finita, en texto) y los de costo (ausente, 0, null, negativo, no finito).

### RQ-TC-79 · Origen al editar (5 de 5)

Los cinco en `packages/shared/src/valorReclamado.test.ts` > origenTrasEditar (NULL→NULL, X→X, X→Y, NULL→X, X→NULL) y en la ruta `apps/desk/server/routes/garantiaProveedor.test.ts` > «editar guarda el origen que decide shared» (X→X, X→Y, X→NULL, NULL→X con NULL→NULL). Código: `packages/shared/src/valorReclamado.ts:73`; escritura en `apps/desk/server/routes/garantiaProveedor.ts:78` y `apps/desk/server/db/garantiaProveedor.ts:116`, `:118`.

### RQ-TC-80 · Moneda (6 de 6)

| Escenario | Prueba | Código |
|---|---|---|
| cuatro respuestas llevan moneda | ruta «toda ficha devuelta lleva su moneda» (lectura, «sí», «no», editar, avanzar) | `apps/desk/server/db/garantiaProveedor.ts:64` |
| ficha previa en USD, nada reescrito | db «una ficha previa (valor 1500, origen manual, sin columna de moneda) …» (compara `SELECT *` antes y después) | ídem; sin DDL en el diff |
| cada grupo lleva moneda | shared «cada grupo trae moneda USD …»; `apps/desk/server/routes/medicionGarantias.test.ts` > «cada grupo trae moneda USD y la ruta devuelve exactamente lo de shared» | `packages/shared/src/medicionGarantias.ts:63` |
| el cociente no lleva moneda | shared, misma prueba (asserta la ausencia de `moneda` en el cociente) | `packages/shared/src/medicionGarantias.ts:63` |
| la medición no cambia | shared «CARACTERIZACIÓN: sumas, recuentos y orden idénticos; sólo se añade moneda» | ídem |
| pantalla (fuera de la red, F0-00) | sin prueba por decisión de Gerencia; `grep -rn "USD" apps/desk/src` = **0** (medido hoy) | sección 5 |

### MODIFIED (RQ-TC-45: 6 de 6; RQ-TC-47: 9 de 9; RQ-TC-65: 9 de 9)

- RQ-TC-45: «valor manual con su origen» y «foto de la OVI» por las pruebas de RQ-TC-78 y RQ-TC-79 de arriba; «RMA vacío» y «tres listas» ya existentes y verdes en `packages/shared/src/garantiaProveedor.test.ts`; los dos de calificación (tabla, sentencia sin calificar) en `packages/zoho-sync/src/db/migrate.test.ts`, verdes en la pasada entera. Las cifras «29 y 42» de la spec heredada ya no son las del guardián de hoy (47 tablas, 69 ALTER): arrastre de la spec viva, no de este cambio.
- RQ-TC-47: nueve escenarios con las pruebas de «avanzar y editar» y POS-ED-1 a POS-ED-3 de `apps/desk/server/routes/garantiaProveedor.test.ts`; sin hunks en ninguna.
- RQ-TC-65: nueve escenarios en `packages/shared/src/medicionGarantias.test.ts` (sumas de cuatro estados, rechazada, abierta y enviada, «no», sin valor, agrupación, acentos, cociente, vacía); sólo cambió la línea del constructor de la ficha y se añadió el bloque final.

**Resumen**: 45 de 45 escenarios cumplidos, 0 sin probar, 0 fallando (el de pantalla, fuera de la red por F0-00, se respalda con L2 y el grep).

## 4. Strict TDD

| Comprobación | Resultado |
|---|---|
| Evidencia TDD | tablas de rojos por lote en `openspec/changes/archive/2026-10-26-valor-reclamado-usd/apply-progress.md` (L1.5, L2.6); equivalen a la tabla del protocolo (S-A) |
| Ficheros de prueba existen y pasan | 7 de 7 verdes hoy |
| Rojos creíbles (contra la partida) | confirmados en 4: `git show c6147860:packages/shared/src/medicionGarantias.ts` no contiene `moneda`; `git show eaeda6e5:apps/desk/server/db/garantiaProveedor.ts` no tiene `fotoDeLaOVI` ni `moneda`; `git show eaeda6e5:apps/desk/server/routes/garantiaProveedor.ts` no calcula foto ni origen; `git show eaeda6e5:packages/shared/src/garantiaProveedor.ts` sigue pasando el cuerpo por `datosComunes(cuerpo)` (el «sí» validaría 999 y -1). `valorReclamado.ts` no existe en `c6147860` |
| Triangulación | adecuada: cinco casos de origen, diez huecos, tres fixtures de redondeo |
| Auditoría de aserciones | sin tautologías, sin bucles fantasma, sin `toBeDefined` solo; los `it.each` tienen tabla de 10 filas no vacía |
| `.tsx` | sin prueba por F0-00; correcto |

## 5. Regla 13 (casilla de `apply-progress.md`, leída línea a línea hoy)

C-1 a C-4 y las otras decisiones de los dos `.tsx` cuadran con el servidor. Rutas en `apps/desk/server/routes/garantiaProveedor.ts`: `:57` (foto), `:78` (origen), `:43`, `:71`, `:92` (403), `:74` (409 resuelta), `:77` (422), `:95` (409 paso), `:110` y `:119` (medición). Datos en `apps/desk/server/db/garantiaProveedor.ts`: `:64` (moneda), `:99` (origen de la foto), `:116` y `:118` (origen al editar), `:150-151` (pendiente y liberada). Reglas en `packages/shared/src/garantiaProveedor.ts`: `:151`, `:153`, `:137-138`, `:175-179`, `:182-183`, `:195`; y la etiqueta en `packages/shared/src/valorReclamado.ts:83`. Cada línea dice lo que la casilla afirma. Los `.tsx` no escriben moneda ni origen: `f.moneda`, `g.moneda` y `etiquetaOrigenValor` llegan del servidor. Única sin contrapartida declarada: ocultar el panel sin OVI (presentación pura). `grep -rn "USD" apps/desk/src` = 0.

## 6. Colocación y citas (regla de mutación 4)

`git diff -U0 --no-renames 7cf5faf0 HEAD -- apps packages`: todos los hunks de ficheros existentes son `-N,k +N,k` (misma cuenta) o inserciones al final; comprobada la longitud base de los ocho ficheros con inserción (196, 179, 442, 131, 178, 191, 54 y 245 líneas) contra el punto del hunk: coinciden. Ninguna línea existente cambió de número. `DEPLOY.md:490` cita `apps/desk/server/db/garantiaProveedor.ts:144`, que sigue siendo la consulta de lectura `SELECT ${COLUMNAS} FROM garantia_proveedor WHERE ticket_id = $1`. `openspec/specs/tickets-core/spec.md` no cita ninguno de estos ficheros con número de línea (barrido `grep -noE` sobre la spec, `CLAUDE.md`, `DEPLOY.md` y `openspec/config.yaml`: sólo `DEPLOY.md:490`). El detector sobre `HEAD` salió 0.

## 7. Mutaciones repetidas por el verificador (una a una, M0 antes)

M0 (los 4 ficheros de prueba afectados, sin mutar): 140 de 140 verdes. Restauración con `cmp` tras cada una.

| M | Cambio | Cayó (n) | Aserción |
|---|---|---|---|
| (a) | `packages/shared/src/valorReclamado.ts:60` sin `l.cantidad *` | 12 | shared «2 × 150,54 + 1 × 10 = 311,08»; db (2) y ruta (9: foto positiva, 999, -1, abc, Infinity, X→X, X→Y, X→NULL, -1 al editar) |
| (b) | `packages/shared/src/valorReclamado.ts:73` devuelve siempre el origen anterior | 5 | shared X→Y, NULL→X, X→NULL; ruta PUT X→Y y X→NULL |
| (c) | regla de mutación 2: `LINEAS_BASE` del fixture de db sin `item_id` en la 2.ª línea | 2 | db «2 × 150,54 + 1 × 10 = 311,08» y «la foto no se recalcula» |
| (d1) | `apps/desk/server/db/garantiaProveedor.ts:64` sin `moneda` | 8 | db (`aGarantia`, ficha previa, «sí», positiva) y ruta («toda ficha devuelta lleva su moneda», «sí» con 201, positiva, X→X) |
| (d2) | `packages/shared/src/medicionGarantias.ts:63` sin `moneda` | 3 | shared (2) y ruta de medición (1): `expected undefined to be 'USD'` |

En (c) los huecos que dependen de la base (1, 2, 8, 9 y 10) siguen en verde con la base sucia: los protege sólo la prueba positiva (debilidad ya anotada en L2.11; S-C).

## 8. Coherencia con el diseño

D-1 (moneda constante, sin DDL: el diff no toca `schema.sql`), D-2 y D-3 (módulo nuevo y dos funciones puras), D-4 y D-5 (lectura en la capa de datos; `RespuestaReclamacion` pierde el valor), D-6 (origen en `shared`), D-7 (un `moneda` por objeto), D-8 (`raw` objeto o texto; `numero()`), D-9 (un solo redondeo), D-10 (`moneda?` en el formulario): todas seguidas. El desvío de numeración del diseño (la línea de la moneda en el grupo es la 63, no la 62) está corregido en los tres documentos. Los cuatro desvíos de `apply-progress.md` («Desvíos del diseño») son razonables y no rompen la spec.

## 9. Inventario de importes sin moneda (L3.7), contrastado por otra vía

Reconstruido desde los esquemas (`packages/zoho-sync/src/db/schema.sql`, `packages/zoho-sync/src/booksHub/schema-books.sql`, `packages/zoho-sync/src/crmHub/schema-crm.sql`: columnas `numeric`, `amount`, `total`, `rate`), las consultas con `books.*` en `apps/desk/server` y `packages/zoho-sync/src/books/repo.ts`, y los `.tsx` que formatean importes. **No encuentro ningún importe que falte.** Confirmo: `total` de la orden de venta por la API (`packages/zoho-sync/src/books/repo.ts:106`, `:169`, `:180`; `packages/shared/src/types.ts:310`); las tablas de línea de `books.*` y `books.customer_payment_invoices` sin moneda en la fila; las seis tablas de CRM; `amount_usd` en `packages/zoho-sync/src/booksHub/salesRecords.ts:3`, anotado y no contado. No hay importes en `apps/desk/server/analisis.ts`, `apps/desk/server/indicadores.ts`, `apps/desk/server/db/contratos.ts` ni en las tablas de contratos (sólo fechas), ni en remisiones o catálogo. El `total: number` de `packages/shared/src/types.ts:683` es un recuento de filas borradas, no dinero. Hipótesis: una búsqueda por nombre de campo puede perder un importe con otro nombre. `books.retainer_invoices` lleva `currency_code` en la fila y está bien excluida.

## 10. Corrección 29 enmendada

`docs/sdd/F0-01_Correcciones_para_el_maestro.md`: sólo cambian las líneas 1454, 1474-1479 y 1482-1483 (`git diff -U0`: tres hunks N a N, 9 y 9 líneas); ninguna otra entrada se mueve. Dice lo que piden la decisión (`openspec/config.yaml:5434-5460`: USD, foto al abrir, cantidad × costo de catálogo sumado por línea, origen `ovi`, editable a mano, recuperado en USD) y el maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2664` «tomado del costo de la OVI» y `:1232` «las líneas conservan el costo»; `:2666` y `:2667` para lo construido y el envío por remisión; `:2668` la frase «Cierra el punto 7 del Anexo D»). P-2 (pegarlo en el maestro) sigue siendo de Gerencia.

## 11. Hallazgos

**CRITICAL**
- Ninguno. C-1 de la versión anterior (`npm test` con código 1) queda **resuelto por la 5.ª pasada** (17:06, código 0, 305,4 s, 0 fallos y 0
  errores sin manejar), sin tocar código, plazos, `maxWorkers` ni `cederAlBucle`.

**WARNING**
- W-1 (resuelto en este commit). `L1.c`, `L2.c` y `L3.c` estaban sin marcar en `openspec/changes/archive/2026-10-26-valor-reclamado-usd/tasks.md` aunque sus commits existían.
- W-2. `fotoDeLaOVI` (`apps/desk/server/db/garantiaProveedor.ts:189-201`) no rechaza ante huecos de DATOS, pero un error de la consulta (p. ej. un esquema `books` ausente) se propaga y la ruta (`apps/desk/server/routes/garantiaProveedor.ts:57`) da 500 en vez de «sí» sin foto. En producción `books.items` existe (la usa `apps/desk/server/db/catalogoArticulos.ts`); sólo afectaría a un entorno sin réplica de Books. La spec dice «no rechaza nada» sobre los datos, no sobre la infraestructura.
- W-3. `npm test` entero salió 1 en cuatro pasadas seguidas sobre el mismo código (sección 2): 7 pruebas del detector de citas con el
  plazo vencido en las dos primeras y, en las cuatro, 2 o 3 «Timeout calling onTaskUpdate» del worker de vitest. Ninguna toca este
  cambio y la 5.ª sale 0, pero la suite depende de que la máquina no vaya lenta; la causa (alimentación) es hipótesis.

**SUGGESTION**
- S-A. Los rojos se anotan por lote, no con la tabla literal «TDD Cycle Evidence»; equivalente y suficiente.
- S-B. De los diez huecos sólo dos tienen prueba de ruta con `201` (sin orden y artículo ausente); los otros ocho se prueban en la capa de datos, que es el mismo camino de código. Aceptable.
- S-C. Los cinco huecos que dependen de la base pasan por la razón equivocada si se ensucia el fixture (mutación (c)); una prueba que falle por su cuenta con la base completa los blindaría.
- S-D. La spec viva hereda «29 y 42» en el escenario de calificación de RQ-TC-45; al fusionar no conviene tocar esa cifra (la fusión es a igual longitud) y la vigila el guardián de `packages/zoho-sync/src/db/migrate.test.ts`.
- S-E. Medir la fusión del delta ANTES de aplicar el archivo (regla del archivo, techo 2 × carpeta + 800).

## 12. Siguiente

`sdd-archive`: la repetición de `npm test` salió 0, este informe queda en PASS CON AVISOS y las casillas de cierre están marcadas (W-1). Tareas de persona fuera del recuento: P-1 (SQL de lectura de fichas con importe, Alfonso) y P-2 (pegar la corrección 29 en el maestro, Gerencia); archivar no las da por hechas.
