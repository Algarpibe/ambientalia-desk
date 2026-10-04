```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:98e954c369c324086c4b0040f2dcfd971dfc00582e730eb9a961c12c2c8edd68
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 3/3
scenarios: 30/30
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:98e954c369c324086c4b0040f2dcfd971dfc00582e730eb9a961c12c2c8edd68
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verificación — busqueda-ticket-serial

Cambio `busqueda-ticket-serial` (`tanda: F1B-08`, `cierra: no`). Modo: `strict_tdd`, `hybrid`. Rama del mismo nombre,
cabeza `33c27cc`; lo propio son `9bf0fbf`, `4bc8196`, `09f622c` y `33c27cc`. Las fusiones `47127ff` y `33f08a5` apilan
trabajo ajeno y no se verifican aquí.

## Veredicto: PASS con avisos

0 CRITICAL, 3 WARNING, 4 SUGGESTION. Las 49 casillas de `tasks.md` están marcadas (0 pendientes); las comprobaciones de
persona y el recuento de tamaño están fuera del recuento por la regla del ciclo 1, con dueño y destino. Los cuatro
mandatos salen con código 0. Se aplicaron cuatro mutaciones propias: tres cayeron en rojo y una **sobrevivió** (hueco de
D8), que cierra la prueba nueva de este informe. El árbol quedó sólo con el informe y esa prueba.

## 1. Ejecución (códigos de salida literales, medidos aquí)

| Comando | Salida | Cifras |
|---|---|---|
| `npm test` | **0** | `Test Files 202 passed \| 1 skipped (203)`; `Tests 3162 passed \| 2 skipped (3164)` |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)` (la prueba nueva no suma avisos: `eslint` sobre ella, 0) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 5.133 comprobadas; 0 cabeceras R-1 inválidas; línea base 0 informadas, 0 caducadas; 13 abreviadas rotas (informativas) |

**Contraste.** `apply-progress.md` declara 3.158 pruebas al cierre del lote 2 (`:147`): coinciden con mi primera corrida
(3.158 y 2 omitidas). Las **3.162** de arriba son esas 3.158 más las **4** de `busquedaTicketsHuecos.test.ts` (§6). El
hash de `npm test` es el de esa segunda corrida; el de `typecheck` es idéntico al del informe de F1B-07 (misma salida
vacía). Lint y detector se midieron antes de añadir la prueba; el árbol sólo ganó un `.test.ts` sin avisos.

**Detector de citas:** sale con 0, sin bloqueantes. Las 13 abreviadas rotas no las introduce este cambio (la primera que
lista es `CLAUDE.md`, línea 349, sobre `recepcion.test.ts`).

## 2. Completitud

| Métrica | Valor |
|---|---|
| Casillas de `tasks.md` | 49 marcadas, 0 pendientes |
| Requisitos del delta | 3 (`RQ-VT-11` a `RQ-VT-13`) |
| Escenarios del delta | 30 (`grep -c "^#### Scenario"`): 22 + 4 + 4 |

## 3. Matriz de cumplimiento (requisito a prueba)

`S` = `apps/desk/server/busquedaTickets.test.ts`; `R` = `packages/zoho-sync/src/db/busquedaTickets.test.ts`;
`U` = `packages/shared/src/busquedaTickets.test.ts`; `C` = `apps/desk/server/db/busquedaConfrontacion.test.ts`;
`H` = `apps/desk/server/busquedaTicketsHuecos.test.ts` (nuevo de este informe).

### RQ-VT-11

| # | Escenario | Prueba | Resultado |
|---|---|---|---|
| 1 | número exacto, con y sin «#» | `S:33`, `R:50` | COMPLIANT |
| 2 | número parcial no encuentra | `S:38` (`q=86`), `R:58` | COMPLIANT |
| 3 | últimos dígitos de un serial | `S:41`, `R:82` | COMPLIANT |
| 4 | mayúsculas y espacios a los lados | `S:46`, `R:82` | COMPLIANT |
| 5 | espacio interior se conserva | `R:98` (sólo repositorio, no por HTTP) | COMPLIANT |
| 6 | serial del equipo enlazado, nuevo y viejo | `S:49`, `R:40`, `R:105` | COMPLIANT |
| 7 | sin serial en ningún sitio | `R:114` | COMPLIANT |
| 8 | dígitos buscan en número y serial | `R:72`, `U:44` | COMPLIANT |
| 9 | número fuera de `integer` no rompe | `R:65`, `U:61` (sin prueba HTTP: S1) | COMPLIANT |
| 10 | un «#» solo no es número | `S:62`, `U:54` | COMPLIANT |
| 11 | sin `q`, vacío o de espacios = hoy (activos, cerrados, «Mis») | `S:149`, `R:173` | COMPLIANT |
| 12 | cerrados: total filtrado y página 2 | `S:80`, `R:148` | COMPLIANT |
| 13 | página fuera de rango: `items` vacío, total filtrado | `S:91-93` | COMPLIANT |
| 14 | posición de la condición (cerrado/activo) | `R:124`, `R:138`, `S:96` | COMPLIANT |
| 15 | «Mis tickets» con `q`, en el orden de la cola | `S:106` | COMPLIANT |
| 16 | 65 da 422, 64 da 200 | `S:121` | COMPLIANT |
| 17 | 80 espacios = vacío | `S:133`, `U:35` | COMPLIANT |
| 18 | `?q=a&q=b` da 422 | `S:127-130` | COMPLIANT |
| 19 | sin sesión, `q` largo da 401 | `S:143` | COMPLIANT |
| 20 | la búsqueda no segmenta visibilidad | `S:69` | COMPLIANT |
| 21 | mutaciones del predicado, cada una con su rojo | procedimiento de `apply-progress.md` (MC-3, MC-6, MC-7 en `:44`, `:47`, `:48`); no reproducidas aquí, ver §6 | COMPLIANT (por registro) |
| 22 | el cliente sólo envía el texto | **PERSONA** (leído: `BuscadorTickets.tsx:12`, `src/lib/busquedaTickets.ts:14-16`; `conBusqueda` sólo decide si hay algo que enviar) | PERSONA |

### RQ-VT-12 y RQ-VT-13

| # | Escenario | Prueba | Resultado |
|---|---|---|---|
| 23 | mismo veredicto en los dos buscadores | `C:59` (11 casos; molde H5) | COMPLIANT |
| 24 | el autocompletado recorta los extremos | `C:59`, casos «espacios a los lados» y «sólo espacios» | COMPLIANT |
| 25 | `searchEquipos` conserva su comportamiento | `equipos.test.ts` verde sin tocarlo (suite completa) | COMPLIANT |
| 26 | una sola función de patrón | lectura: `apps/desk/server/db/equipos.ts:60` y `packages/shared/src/busquedaTickets.ts:36` llaman a `patronSerial` (`:15`); el SQL de tickets no construye patrón (`packages/zoho-sync/src/db/busquedaTickets.ts:21`). Salvedad D12: `equipos.ts:178` (`listEquiposManage`) conserva el suyo, declarado | COMPLIANT |
| 27-30 | cuatro escenarios manuales de `RQ-VT-13` | **PERSONA** (`.tsx` fuera de la red por F0-00; no se registra como carencia) | PERSONA |

**Escenarios sin prueba y sin motivo: ninguno.** Resumen: 26 de 26 automáticos o de lectura, 4 de persona.

## 4. Diferencias spec / diseño

Manda el diseño (`tasks.md:3`).

| Diferencia | Detalle |
|---|---|
| Subconsulta en vez de `LEFT JOIN` | El delta habla sólo de «equipo enlazado»; el SQL real es `t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $p)` (`packages/zoho-sync/src/db/busquedaTickets.ts:21`). H-1 se despejó con plan A. Sin contradicción con el delta |
| Mutación de posición | El delta (escenario 14) admite «ponerlo antes del filtro de estado»; es un mutante equivalente (`design.md:255-258`). La posición real es la de los paréntesis (`packages/zoho-sync/src/db/busquedaTickets.ts:22`, MP-1). Manda el diseño |
| **S-7 (lote 2): la caja no se enseña en `remision_creada`** | `apps/desk/src/App.tsx:107`: la caja va condicionada por `view !== 'remision_creada'`; `App.tsx:69` no pasa `q` a `fetchRemisionCreada()`; `routes/prioridad.ts:92-94` no lee `q`. **No contradice** `RQ-VT-11`, que enumera tres poblaciones (activos, cerrados, «Mis tickets»), ni los cuatro escenarios manuales. **Tensión con la letra de `RQ-VT-13`**: «la cabecera del listado SHALL tener una caja», sin excepción, y el delta no nombra S-7. Ver W1 |
| `countClosedTickets` gana el alias `t` | Lo manda el diseño §4; su SQL sin filtro no es carácter a carácter el de hoy (`repo.ts:173`); el resultado es el mismo y lo fija `R:173`. Declarado en `apply-progress.md:84` |
| MC-3 | El diseño preveía la confrontación verde; cae por exigir además el valor esperado (`apply-progress.md:44`). Desvío declarado, a favor |

## 5. Regla 13: las nueve filas del diseño §9, releídas

Cada línea la releí en el árbol de la cabeza `33c27cc`.

| # | Decisión del cliente | Línea del servidor (releída) | Veredicto |
|---|---|---|---|
| 1 | Envía el texto tal cual | `apps/desk/server/routes/tickets.ts:104` (`leerBusqueda`) y `routes/prioridad.ts:83` (`requireAuth(db), leerBusqueda,`); lee `util/busquedaTickets.ts:9` | consume; posición probada (`S:143`, MP-2) |
| 2 | No filtra por `q` lo recibido | `packages/zoho-sync/src/db/repo.ts:151`, `:166`, `:173`, `:186` (los fragmentos `and` y `where` de `sqlBusquedaTickets`) | consume |
| 3 | No normaliza | `packages/shared/src/busquedaTickets.ts:28-37` y `:15`; sólo `util/busquedaTickets.ts:9` lo llama | consume |
| 4 | `maxLength` 64 (`BuscadorTickets.tsx:19`) | `packages/shared/src/busquedaTickets.ts:33` da el 422 en `util/busquedaTickets.ts:10`; `S:121`, `U:35` | comodidad con imposición probada |
| 5 | Vuelve a la página 1 (`App.tsx:59`, `setClosedPage(1)` con `q` en las dependencias) | `routes/tickets.ts:109` total filtrado; `S:91-93` página 9 vacía con total | comodidad |
| 6 | Pagina con el `total` recibido | `routes/tickets.ts:109`, el mismo `busquedaDe(res)` que `:108`; la mutación MB (§6) lo pone en rojo | consume |
| 7 | Filtro de vista sobre el resultado | no es guarda; `boardView.ts` sin cambios en el diff | vista |
| 8 | «Mis tickets» con `q` | `routes/prioridad.ts:85` (`getActiveTickets(db, yo, busquedaDe(res))`, luego `esDeMisTickets`); la mutación MC (§6) lo pone en rojo | consume |
| 9 | Espera 300 ms; omite `q` vacío | sin regla de dominio: `S:149` (vacío = ausente en las tres rutas) | comodidad |

**Fila 5, matiz:** el reinicio de página vive sólo en el `.tsx` (`App.tsx:59`); si no existiera, el servidor da `items`
vacío con el `total` filtrado (`S:91-93`), así que es comodidad real. Ninguna decisión queda sólo en el cliente.

## 6. Cero líneas netas y mutaciones

### Cero líneas netas (`git diff --numstat 93e6741 HEAD`)

| Fichero | + / - | |
|---|---|---|
| `packages/zoho-sync/src/db/repo.ts` | 15 / 15 | cuadra |
| `apps/desk/server/db/equipos.ts` | 2 / 2 | cuadra |
| `apps/desk/server/routes/tickets.ts` | 5 / 5 | cuadra |
| `apps/desk/server/routes/prioridad.ts` | 3 / 3 | cuadra |
| `apps/desk/server/db/ticketsConCliente.ts` | 7 / 7 | cuadra |
| `apps/desk/src/api/client.ts` | 7 / 7 | cuadra |
| `apps/desk/src/App.tsx` | 8 / 8 | cuadra |
| `packages/shared/src/index.ts` | 1 / 0 | la línea admitida, al final |

**Diferencia ajena contra `93e6741`:** `openspec/config.yaml` sale con 0 / 23. No es de este cambio: `93e6741` **no es
ancestro** de la cabeza (la base común es `8fd977d`) y las 23 líneas son `decision/orden-cuatro-tandas-04-10`, que `main`
ganó después en `1bc4a45`. Esta rama no toca ese fichero (`git log 93e6741..HEAD` sobre él sale vacío), así que
la fusión no debería conflictuar. Fuera de eso sólo difieren los ficheros propios del cambio. Ningún fichero muy citado
movió una línea, así que no hay barrido de citas que repetir.

### Medida del intento (para el ledger del orquestador; no la registro yo)

`git diff --shortstat --no-renames 33f08a5 HEAD` (lote 2, todo commiteado): 13 ficheros, **438 / 53 = 491**.
`git diff --shortstat --no-renames 47127ff 4bc8196` (lote 1): **524 / 44 = 568**. Los dos bajo 720. Mi prueba nueva
(50 líneas) y este informe se suman al intento de verificación, no a esos.

### Mutaciones propias (distintas de MP-1, MP-2, MC-1 a MC-9)

Copia de seguridad fuera del repositorio, restauración con `cp`. Se corrieron siete ficheros de prueba (103 pruebas).

| # | Mutación | Resultado |
|---|---|---|
| **MA** | `packages/shared/src/busquedaTickets.ts:33`: medir la longitud sobre `q` crudo (`q.length`) en vez de `texto.length` (S-9) | **Cae:** `H` (64 con espacios a los lados) y `U:35`. No cae `S:133` (80 espacios): el vacío sale antes, en `:32` |
| **MB** | `routes/tickets.ts:109`: `countClosedTickets(db, busquedaDe(res))` pasa a `countClosedTickets(db)` (regla 13 fila 6, nivel de ruta; `apply` sólo mutó el repositorio, MC-8) | **Cae:** `S:80` y `H` (scope=closed). Cubierto |
| **MC** | `routes/prioridad.ts:85`: `getActiveTickets(db, yo, busquedaDe(res))` pasa a `getActiveTickets(db, yo)` | **Cae:** `S:106` («Mis tickets»). Cubierto |
| **MD** | `packages/zoho-sync/src/db/busquedaTickets.ts:21`: la subconsulta pasa a `WHERE active = true AND LOWER(serial)` (contradice D8) | **SOBREVIVIÓ:** 103 de 103 verdes. D8 («un ticket existe aunque su equipo esté desactivado») no estaba fijado. **Cerrado** con la cuarta prueba de `H`: con la mutación cae `expected [] to deeply equal [ '#9' ]` |

Estado final del árbol tras revertir: sólo este informe y `apps/desk/server/busquedaTicketsHuecos.test.ts`
(`git status --short`).

### Pruebas añadidas (`busquedaTicketsHuecos.test.ts`, 50 líneas con cabecera, sin `as any`, 4 pruebas)

Nacen verdes (CARACTERIZACIÓN de huecos); la de D8 se probó roja por mutación (MD).

1. **S-4 por HTTP:** `q=%25` y `q=_` son comodines y un ticket sin serial no casa; `q=A_-1` encuentra `AB-1`.
2. **S-9 por HTTP:** 64 caracteres tras recortar, con espacios a los lados, dan 200 y encuentran; 65 dan 422.
3. **`scope=closed` y `scope=all`:** `items` y `total` salen del mismo filtro con comodín; `scope=all` junta activos y cerrados.
4. **D8:** un equipo con `active = false` sigue encontrando su ticket por su serial.

## 7. Coherencia (diseño)

| Decisión | ¿Seguida? | Notas |
|---|---|---|
| D1 normalizador único en `packages/shared` | Sí | `busquedaTickets.ts:15`, `:28`; consumido por `equipos.ts:60` y `util/busquedaTickets.ts:9` |
| D2 subconsulta `IN` | Sí | `packages/zoho-sync/src/db/busquedaTickets.ts:21` |
| D3 fragmento fuera de `repo.ts` | Sí | cero líneas netas en `repo.ts` (15/15) |
| D4 validación en la ruta, detrás de `requireAuth` | Sí | `tickets.ts:35` y `:104`; `prioridad.ts:83`; `S:143` |
| D5/D6 `q` repetido da 422; longitud sobre lo recortado | Sí | `packages/shared/src/busquedaTickets.ts:30`, `:33` |
| D7 patrón con el texto entero, `#` incluido | Sí | `:36`; `U:50` |
| D8 sin filtrar `equipos.active` en tickets | Sí (ahora fijado) | MD sobrevivía; cuarta prueba de `H` |
| D9/D10 reinicio de página en `App.tsx`; `aplazar` en `.ts` | Sí | `App.tsx:59`; `src/lib/busquedaTickets.ts:14-16` |
| D11 `fetchTickets` sin `q` | Sí | `client.ts:15-17` intacto |
| D12 `listEquiposManage` no se unifica | Sí | `equipos.ts:178` conserva su patrón; pregunta de bandeja 6 |

## 8. Hallazgos

**CRITICAL:** ninguno.

**WARNING**

- **W1 · S-7 no está en el delta.** `RQ-VT-13` dice «la cabecera del listado SHALL tener una caja» y no nombra la
  excepción de la vista `remision_creada` (`App.tsx:107`). No es un fallo de código: es una divergencia
  delta-implementación que el archivo fusionaría tal cual. Quien archive debe añadir S-7 a la fusión; la pregunta 5 de
  la bandeja (`apply-progress.md:189`) ya lo recoge sin número.
- **W2 · Texto de búsqueda residual al volver de `remision_creada` (hipótesis: `.tsx`, no probado).** Al pasar a
  `remision_creada` la caja se desmonta (`App.tsx:107`) y su `texto` local se pierde (`BuscadorTickets.tsx:11`), pero
  `q` sigue en `App.tsx:58`. Al volver a «Todos» o «Mis tickets» la caja nace vacía y la primera petición lleva el `q`
  viejo hasta que, 300 ms después, el efecto de `BuscadorTickets.tsx:12` llama a `onBuscar` con texto vacío. Se
  autocorrige; el efecto visible es un listado filtrado por un texto que la caja no muestra durante unos 300 ms, y una
  petición extra. Además la pregunta 1 de la bandeja («se conserva el texto», `apply-progress.md:185`) deja de ser
  cierta tras pasar por esa vista. Para comprobar en la aplicación; no bloquea.
- **Remediación de W1 y W2 por el orquestador, dentro de este mismo intento.** W1: el delta de `RQ-VT-13` gana el
  párrafo **[SUPUESTO S-7]**, que la fusión del archivo lleva a la spec viva. W2: el efecto de la línea 59 de
  `apps/desk/src/App.tsx` vacía `q` al entrar en `remision_creada` (edición en su sitio, numstat 1/1), así que al volver
  la caja nace vacía y `q` también; sigue siendo `.tsx` sin prueba automática y queda para comprobación de persona.
- **W3 · Diferencia ajena contra `93e6741`** (`openspec/config.yaml`, -23). No es del cambio, pero quien compare contra
  esa base la verá. La base real es `8fd977d` (§6).

**SUGGESTION**

- **S1** Falta una prueba por HTTP de un `q` de dígitos que no cabe en `integer` (`99999999999`): lo fijan `R:65` y
  `U:61`, y la ruta no añade lógica, pero el escenario 9 del delta habla de «responde 200».
- **S2** El espacio interior (escenario 5) sólo se prueba en repositorio (`R:98`) y el escenario 21 sólo por registro
  de `apply-progress.md`; barato añadir el caso por HTTP.
- **S3** `design.md` §8 y `tasks.md:60` (MC-3) siguen diciendo que la confrontación queda verde; no lo está. Sólo
  documental, y es un desvío ya declarado.
- **S4** Numerar en la bandeja el hallazgo D12 (`listEquiposManage`, `equipos.ts:178`) y la pregunta 5.

## 9. Comprobaciones de persona (fuera del recuento; archivar NO las da por hechas)

Cuatro escenarios de `RQ-VT-13` y el recuento de `desk.tickets` / `desk.equipos`, con dueño QA / quien despliegue y
destino tras el despliegue (`tasks.md:124-127`).

## Veredicto

**PASS con avisos.** Cuatro mandatos en 0, 30/30 escenarios cubiertos (26 con prueba o lectura, 4 de persona), regla 13
releída fila a fila y cero líneas netas en los siete ficheros muy citados. Una de cuatro mutaciones propias sobrevivió
(D8) y quedó cerrada con una prueba nueva; los tres avisos no bloquean el archivo.
