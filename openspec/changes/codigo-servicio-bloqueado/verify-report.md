```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:2e6340370bbbada90a5e058ea852ee60117e06e6367e4768fcd741c0eb35067c
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 33/33
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:9fb84903a1230155557490ac056507d84d435d5e0870c84a9235f1a9dbbc6179
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:c3a7dae9433cd253d861d61b03c5a194fa9c6459f059bbcd7be28e47502ccede
```

# Informe de verificación — `codigo-servicio-bloqueado` (`fuera-del-plan`, `cierra: no`)

**Cambio**: `codigo-servicio-bloqueado` · **Rama**: misma, HEAD `dff16468` (árbol `18447dda`), planificación `1fc261b4`, partida `aea714ac` · **Modo**: Strict TDD · **Fecha**: 2026-10-27
**Verificador**: independiente (intento 3, tarea V.1); no escribió el código, no edita código ni pruebas, no commitea. Árbol limpio antes y después (`git status --short` vacío).
**`evidence_revision`**: sha256 de la cadena `<commit>:<árbol>` = `dff16468b70dc0740bc80360ca025b7804c51889:18447ddaae47e83478e2f6eb94e187ff5a4a7609`
(de `git rev-parse HEAD` y `HEAD^{tree}`; el árbol estaba limpio, así que el digest identifica los bytes verificados).
**Recuentos del sobre**: 6 requisitos (RQ-TC-81 a -83, RQ-TS-65 a -67) cumplidos; 36 escenarios en las deltas (16 en `tickets-core`, 20 en `transitions-st`).
El sobre cuenta 33/33: los escenarios con prueba ejecutable. El validador nativo rechaza un veredicto de paso con un recuento incompleto (33/36), así que los 3 manuales se declaran APARTE:
33 con prueba que pasó y **3 de VERIFICACIÓN MANUAL** (`TransitionPanel.tsx`, fuera de la red por F0-00) que NO se cuentan como pasados.

## Veredicto: PASS CON AVISOS

0 CRITICAL · 3 WARNING · 3 SUGGESTION. Los cinco códigos en 0. M0, M1 y M2 reproducidas: cada mutación pone en rojo la prueba prevista.
Fuera de este informe: los tres escenarios manuales del cliente y las tareas de persona.

## 1. Completitud

| Métrica | Valor |
|---|---|
| Tareas L1.1-L1.18 | 18/18 marcadas y comprobadas contra el código (`tasks.md:20-79`) |
| L1.c (orquestador) | pendiente por diseño: los cinco códigos de abajo son la repetición independiente |
| V.1 / A.1 / A.2 | V.1 es este informe; A.1 y A.2 son del archivo |
| Tareas de persona P-1..P-5 | fuera del recuento (regla del ciclo 1); archivar NO las da por hechas |

Código entregado (`git diff --stat 1fc261b4 HEAD`): `packages/shared/src/codigoServicio.ts` (58, nuevo), su prueba (143) y la prueba HTTP
`apps/desk/server/codigoServicioBloqueado.test.ts` (196); en sitio: `ticketService.ts` 3/3, `ticketCreate.ts` 2/2, `TransitionPanel.tsx` 3/3,
`packages/shared/src/index.ts` línea 56 (`1 0`). Ningún fichero de esquema, `migrate` ni `.sql` tocado desde `aea714ac`.

## 2. Ejecución (los cinco códigos, en serie)

| # | Comando | Salida | Evidencia |
|---|---|---|---|
| 1 | `npm test` | **0** · 329 ficheros (325 pasan, 4 saltados) · 5.732 pruebas (5.706 pasan, 26 saltadas) · 324,95 s | memoria libre antes: **12.467 MB**; log `C:\Users\algar\AppData\Local\Temp\claude\C--dev-Desk-2-R1-023\93c22b83-cd18-419d-a489-3b25fc82b53d\scratchpad\verify-npmtest-1652.log`; sin «Timeout onTaskUpdate» |
| 2 | `npm run typecheck` | **0** · 27 s | `…\scratchpad\verify-typecheck.log` |
| 3 | `npm run lint -- --max-warnings 165` | **0** · **165** avisos, 0 errores: 165/165 | `…\scratchpad\verify-lint.log` |
| 4 | `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** · 7.599 comprobadas, línea base 0 informadas · 0 caducadas, cabeceras R-1 inválidas 0, **13** abreviadas rotas informativas | `…\scratchpad\verify-citas.log` |
| 5 | `npm run build` | **0** · bundle **`index-F1jDYjEU.js`** (427,51 kB) + `index-BXv9vVDm.css` (el CSS no cambia) | coincide con el esperado; anterior `index-BFrlA0VZ.js` |

**Memoria (regla dura).** Primera medición antes de `npm test`: **11.356 MB** (< 12.000): no lancé. Tras typecheck, lint, citas y build (en serie) la memoria
subió a **12.155 MB** y a **12.467 MB** inmediatamente antes de lanzar. Un único `npm test`, sin repeticiones.
Las 13 abreviadas rotas del código 4 son informativas y no bloquean; la única atribuida a `ticketService.ts`
(`docs/sdd/Puntos_para_Gerencia_2026-09-11.md:167`, «revisión inexistente») es anterior a este cambio y no toca sus líneas.
Control M0: el conjunto da **51/51 verdes** antes y después de cada tanda de mutaciones (30 en `codigoServicio.test.ts`, 21 en `codigoServicioBloqueado.test.ts`).
La suite coincide con el M0 posterior del apply (329 ficheros, 5.732 pruebas, +2 y +51 sobre 327/5.681).

## 3. Cumplimiento de escenarios (36)

Pruebas: **S** = `packages/shared/src/codigoServicio.test.ts`, **H** = `apps/desk/server/codigoServicioBloqueado.test.ts`. Las 51 pasan.

### 3.1 `tickets-core` (16)

| Requisito | Escenario | Prueba (fichero > nombre) | Resultado |
|---|---|---|---|
| RQ-TC-81 | Ticket sin código recibe el primero | H > CB-3 `null` y `''` | COMPLIANT |
| RQ-TC-81 | Código sólo de espacios cuenta como «no lo tiene» | H > CB-3 con espacios; S > previo de espacios y de espacio-tabulador | COMPLIANT |
| RQ-TC-81 | Ticket de Zoho con código llega bloqueado | H > CB-1 (el bloqueo es por dato, no por origen de la fila) | COMPLIANT, ver S-2 |
| RQ-TC-81 | No hay columna ni marca nueva | `migrate.test.ts` (guardián existente, verde) + `git diff aea714ac HEAD` sin `schema`/`migrate`/`.sql` | COMPLIANT (sin prueba nueva, ver S-2) |
| RQ-TC-81 | El predicado vive una vez en `shared` | S > tabla del predicado (los seis casos del escenario) y H > CB-1, que lo consume desde `ticketService.ts:131` | COMPLIANT |
| RQ-TC-82 | Prefijo por clasificación y tipo | S > `propuestaCodigoServicio` > «el prefijo sale…» (HV, SR, CG, PRO, MT) | COMPLIANT |
| RQ-TC-82 | Serie y modelo en orden | S > «serie y modelo se componen en orden…» da `MT_18A18102_EDM180C_261026` | COMPLIANT |
| RQ-TC-82 | Serie o modelo ausentes se omiten | S > «las partes ausentes se omiten sin lanzar» | COMPLIANT |
| RQ-TC-82 | Día civil de Bogotá de `created_time` | S > «el día es el civil de Bogotá…» (`T03:00:00Z` da 26; `T12:00:00Z` da 27) y «una YYYY-MM-DD pasa directa» | COMPLIANT |
| RQ-TC-82 | Sin `created_time` válido la fecha se omite | S > «sin created_time válido…» (null, undefined, vacío, texto, ISO sin zona) | COMPLIANT |
| RQ-TC-82 | El servidor no exige que coincida con la propuesta | H > CB-3 (`OTRO` no coincide con ninguna propuesta; 200 y se guarda) | COMPLIANT |
| RQ-TC-83 | Ticket sin código ve la propuesta editable | `TransitionPanel.tsx:80` | **VERIFICACIÓN MANUAL** (F0-00), no pasado |
| RQ-TC-83 | Ticket con código lo ve bloqueado (no admin) | `TransitionPanel.tsx:174` | **VERIFICACIÓN MANUAL**, no pasado |
| RQ-TC-83 | El administrador ve el campo desbloqueado | `TransitionPanel.tsx:174` | **VERIFICACIÓN MANUAL**, no pasado |
| RQ-TC-83 | Saltarse el cliente no salta la guarda | H > CB-1 (petición HTTP a mano, 403, nada escrito) | COMPLIANT |
| RQ-TC-83 | El cliente reenvía lo prellenado y pasa | H > CB-2 (código con espacios alrededor, 200) | COMPLIANT |

### 3.2 `transitions-st` (20)

| Requisito | Escenario | Prueba | Resultado |
|---|---|---|---|
| RQ-TS-65 | No admin, distinto, `ingreso_a_servicio`: 403 y nada escrito | H > CB-1 `ingreso_a_servicio` (mensaje, estado, columna, 0 trazas) | COMPLIANT |
| RQ-TS-65 | Lo mismo en `calibracion_directa` | H > CB-1 `calibracion_directa` | COMPLIANT |
| RQ-TS-65 | Mismo valor con espacios pasa | H > CB-2; S > «mismo valor, también con espacios» | COMPLIANT |
| RQ-TS-65 | El administrador cambia el código | H > CB-4 (las dos transiciones, 200, columna nueva) | COMPLIANT |
| RQ-TS-65 | Ticket sin código acepta cualquier valor | H > CB-3 (null, vacío, espacios) | COMPLIANT |
| RQ-TS-65 | Cargo de dirección no exime | H > CB-1 «un cargo de dirección no exime» (Director Técnico); S > Director Técnico y Director Comercial | COMPLIANT |
| RQ-TS-65 | Código vacío no dispara la guarda (422) | H > CB-6 vacío da 422 «Falta el campo obligatorio: Código Servicio» | COMPLIANT (caracterización) |
| RQ-TS-65 | Sólo espacios es un cambio (403) | H > CB-6b; S > «un valor de sólo espacios con previo es un CAMBIO» | COMPLIANT |
| RQ-TS-65 | Sin la clave o en transición sin el campo no interviene | H > CB-7 `escalado_a_revision` (200, código intacto); S > cuerpo `{}`/`null`/`undefined` y transición sin campo | COMPLIANT |
| RQ-TS-65 | La guarda no depende del cliente | H > CB-1 | COMPLIANT |
| RQ-TS-66 | Admin cambia: traza con previo y nuevo | H > CB-4 (clave = nuevo, clave anterior = previo) | COMPLIANT |
| RQ-TS-66 | El primer código no deja previo | H > CB-3 (sin clave anterior en la traza) | COMPLIANT |
| RQ-TS-66 | Admin reenvía el mismo valor: sin previo | H > CB-4 «reenvía el mismo valor, con espacios» | COMPLIANT |
| RQ-TS-66 | El 403 no deja traza | H > CB-1 (0 trazas) y CB-6b | COMPLIANT |
| RQ-TS-66 | El previo es el del ticket, no el del cuerpo | H > CB-5 (admin inyecta un previo falso; sale el del ticket) | **PARCIAL**: falta «misma transacción», ver W-1 |
| RQ-TS-67 | PCS-1 área gana al código | H > PCS-1 | COMPLIANT (roja por M1 b, c, d) |
| RQ-TS-67 | PCS-2 el 403 del código gana al 422 | H > PCS-2 (con contraste admin y mismo código, que dan 422) | COMPLIANT (roja por M1 a) |
| RQ-TS-67 | PCS-3 el 409 de la condición (1) gana | H > PCS-3 (tipo y sin OV; con la condición cumplida, 403) | COMPLIANT (roja por M1 c, d) |
| RQ-TS-67 | PCS-4 el 409 de estado gana | H > PCS-4 | COMPLIANT (roja sólo por M1 d) |
| RQ-TS-67 | PCS-5 el 409 del interruptor gana | H > PCS-5 (app con interruptor apagado) | COMPLIANT (roja por M1 c, d) |

Sin escenarios sin cubrir. Las dos observaciones «no observable, no se finge prueba» de RQ-TS-67 (frente a la prioridad y frente a D) las fijan
S > «ninguna lleva a la vez priority y el código» y «ninguna lleva el código junto a un campo de orden de venta»: leen el catálogo, no fingen una posición.

## 4. Mutaciones reproducidas por el verificador

Método: copia del fichero al scratchpad antes de cada tanda (`v-ticketService.ts.orig`, `v-codigoServicio.ts.orig`, `v-transitions.orig`);
`perl -pi` con `$. == N` (nunca `sed -i`); `file` con CRLF antes y después; restauración por copia; `git diff --quiet` y `git status --short` limpios al final de cada tanda.
Conjunto: `npx vitest run packages/shared/src/codigoServicio.test.ts apps/desk/server/codigoServicioBloqueado.test.ts`. M0 antes y después: 51/51.
(Un primer intento mío con `perl -i` sin `-p` no aplicó nada y dio 51 verdes: error de herramienta, repetido con `-pi`; el `git diff --numstat` de cada tanda lo comprueba.)

### 4.1 M1 · posición de la guarda (`ticketService.ts`; la guarda vive en la línea 131, entre la prioridad y `const entran`)

| Colocación | Cambio | Rojas (fichero > prueba > aserción) |
|---|---|---|
| (a) | quitar de `:131`, añadir al final de `:134` | H > **PCS-2** > `expected 422 to be 403` (1 roja) |
| (b) | al final de `:128` | H > **PCS-1** > `expected 'El código de servicio de este ticket …' to contain 'Tu rol no tiene permiso para esta tra…'` (1 roja) |
| (c) | tras el `}` inicial de `:128` | H > **PCS-1** (misma aserción), **PCS-3** `expected 403 to be 409`, **PCS-5** `expected 403 to be 409` (3 rojas; PCS-4 sigue verde) |
| (d) | al final de `:125`, antes del 409 de estado | H > **PCS-1**, **PCS-3**, **PCS-4**, **PCS-5** (4 rojas; PCS-4 `expected 403 to be 409`) |

Cada tanda tuvo `git diff --numstat` = `2 2`. **Las cinco pruebas de posición tienen al menos una colocación que las pone rojas**: PCS-1 en b/c/d,
PCS-2 en a, PCS-3 en c/d, PCS-4 **sólo** en d, PCS-5 en c/d. Confirmado el desvío del apply: la colocación (c) de `tasks.md` L1.13 NO pone roja PCS-4
(la guarda queda tras el `}` que cierra el 409 de estado), y (d) existe por eso; la prueba PCS-4 discrimina.

### 4.2 M2 · condición (`codigoServicio.ts`)

| Mutación | Rojas (todas por la razón correcta) |
|---|---|
| `:41` quitar `&& !puedeCambiarCodigoServicio(s)` | 6: S > «valor distinto: dispara sin administrador y no con administrador» y «sólo espacios es un CAMBIO» (`expected true to be false`); H > CB-4 (dos) y CB-5 «admin que inyecta un previo falso» (`expected 403 to be 200`); H > PCS-2 (`expected 403 to be 422`) |
| `:37` y `:41` quitar `trim()` | 5: S > «mismo valor, también con espacios», previo de espacios, previo espacio-tabulador; H > CB-2 y CB-3 con espacios (`expected 403 to be 200`) |
| `:38` quitar la salida del previo vacío | 8: S > previo `null`, vacío, espacios, espacio-tabulador; H > CB-3 (tres) y CB-5 «primer código con clave inyectada» (`expected 403 to be 200`) |
| `:26` espacios como vacío (`esVacio`) | 2: S > «sólo espacios con previo es un CAMBIO» (`expected false to be true`); H > CB-6b (`expected 200 to be 403`) |
| `:54` no borrar la clave inyectada | 2: S > «una clave inyectada se borra siempre»; H > CB-5 (`expected 'FALSO' to be undefined`) |

Mi primer intento de la mutación de `:26` no aplicó el cambio (la regexp ignoraba el `\r` del CRLF); repetida con `\r?`, aplicó y puso las dos rojas de la tabla.
**M2b (fichero vigilado, además)**: `packages/shared/src/transitions.ts:262`, `cfText('Código Servicio')` por `cfText('Codigo Servicio')`: 4 rojas
(S > «son exactamente ingreso_a_servicio y calibracion_directa»; H > CB-1 y CB-4 de `calibracion_directa`; H > PCS-3). Restaurado; `git diff` vacío y `file` con CRLF.

## 5. Cumplimiento de TDD estricto (`strict-tdd-verify.md`)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | AVISO | `apply-progress.md:17-23` y `:36-60` dan rojo medido, mutaciones y rojas, pero no en formato de tabla «TDD Cycle Evidence» (ver S-1) |
| Ficheros de prueba existen | OK | 2/2 |
| Rojo primero | OK | declarado: 17 rojas por la razón correcta en HTTP y módulo ausente en `shared`; **PCS-1, PCS-4 y PCS-5 nacieron verdes** (la guarda no existía) y su valor es la mutación M1, que reproduje |
| Verde confirmado | OK | 51/51 y suite entera en 0 |
| Triangulación | OK | tablas con varios casos (`it.each` previo/pedido, cuatro colocaciones, admin/no admin, dos transiciones) |
| Safety net | OK | M0 previo 327/5.681 sin tocar nada; ningún fichero de pruebas existente cambió |
| Capas | n/d | unitaria (`shared`): 30; integración HTTP con `supertest` y Postgres de prueba: 21; E2E: 0; cliente `.tsx` sin red por F0-00 |
| Cobertura | n/d | sin herramienta de cobertura configurada para el cambio |
| Calidad de aserciones | OK | 0 tautologías, 0 bucles fantasma (los `for` recorren listas constantes no vacías); los `toEqual([])` del catálogo tienen compañera positiva (`toEqual(['calibracion_directa','ingreso_a_servicio'])`) y M2b muestra que el filtro discrimina |

## 6. Regla invariable 13 (casilla M3) releída en este árbol

Confirmo la tabla de `apply-progress.md:63-69` con las líneas de hoy; cada decisión del cliente tiene su línea en el servidor o está declarada como comodidad:

| Decisión del cliente | `shared` (releído) | Servidor (releído) | Estado |
|---|---|---|---|
| C-1 bloquear si el ticket ya tiene código | `cambiaCodigoSinPermiso`, `codigoServicio.ts:35-42`; el cliente conserva `yaLoTraeElTicket`, `TransitionPanel.tsx:32-36` | `ticketService.ts:131`, 403 con `MENSAJE_CODIGO_BLOQUEADO`; CB-1 y PCS-1..5 | espejo legítimo (punto 3): imposición probada |
| C-2 desbloquear al administrador | `puedeCambiarCodigoServicio`, `codigoServicio.ts:20-22`; el cliente lo consume en `TransitionPanel.tsx:174` | misma línea `:131` deja pasar al admin; CB-4 | espejo legítimo |
| C-3 prellenar la propuesta | `propuestaCodigoServicio`, `codigoServicio.ts:45-47`; consumida en `TransitionPanel.tsx:80` | **ninguna**: comodidad pura (CB-3: el servidor acepta cualquier primer valor no vacío) | declarada |
| C-4 asterisco de obligatorio | `transitions.ts:191` y `:262` (`cfText('Código Servicio')`, `required` por defecto) | `transitionExec.ts:77` («Falta el campo obligatorio») con la definición de vacío de `:44`; CB-6 | espejo legítimo |
| Traza del previo | `valoresConCodigoPrevio`, `codigoServicio.ts:53-59` | `ticketService.ts:155` (el cliente no la calcula) | sólo servidor |

El cliente no contiene una segunda copia de la regla: importa `CLAVE_CODIGO_SERVICIO`, `propuestaCodigoServicio` y `puedeCambiarCodigoServicio` de `@ambientalia/shared`
(`TransitionPanel.tsx:8`). El `!!user &&` de `:174` pide el sujeto; no es una regla.

## 7. Barrido de citas (M4)

Repetí lo esencial de L1.17 sobre `HEAD`: `git grep -noE "ticketService\.ts:[0-9]+(-[0-9]+)?"` excluyendo `openspec/changes/archive` y los `Paquete_de_Despliegue_*`
fechados (caso B): **38** citas cuyo rango toca 6, 131 o 155. Las ediciones son en sitio y ninguna línea se movió (`git diff --numstat 1fc261b4`: 3/3, 2/2, 3/3, `1 0`),
así que sólo podía fallar una frase que afirme más de lo que la línea ya decía. Leí qué AFIRMA cada una de las de código vivo, specs vivas y docs
(`cargoPermiso.test.ts:17`, `controlCalidad.test.ts:105`, `decisionalesPorCargo.test.ts:14`, `TransitionPanel.tsx:57`, `config.yaml:4350`,
`permissions/spec.md:590,1322`, `transitions-st/spec.md:1800,1927,1947`, `zoho-sync/spec.md:1542`, `F1B-09…:194`, `DEPLOY.md:785`): todas dicen que
`:131` contiene la guarda de cargo, de ejecutor, de Decisionales, de firma, de verificación, de alta validada o de remisión vigente, o que `:155` aplica la transición;
la línea sigue diciendo eso (con una guarda más, antes de `const entran`). `transitions-st/spec.md:1927` («inmediatamente después» de `exigirAltaValidada`) sigue cierta:
la guarda nueva no se interpone entre alta validada y remisión. **0 rotas en caso A, 0 reparaciones necesarias.** El detector (código 4) da 0 bloqueos y línea base vacía.
No repetí a mano el segundo pase de abreviadas: me apoyo en el informe del detector (ninguna de las 13 abreviadas rotas depende de las líneas tocadas) y en el pase del apply
(`apply-progress.md:76-78`).

## 8. Desvíos del apply, revisados

**(i) L1.13(c) no ponía PCS-4 en rojo y se añadió (d)**: confirmado por reproducción (sección 4.1). Es un defecto del texto de `tasks.md` (la colocación (c) estaba mal pronosticada),
corregido a tiempo en el apply y registrado en `apply-progress.md:50-56`; no afecta al código. Ver S-3.

**(ii) La spec viva `transitions-st` dice «la undécima (décima hasta F1B-03)» y con la guarda nueva sería la duodécima**: confirmado en
`openspec/specs/transitions-st/spec.md:1926`. La guarda de remisión sigue **inmediatamente después** de `exigirAltaValidada` y antes de los obligatorios, y la lista
«Queda detrás de: … prioridad (B), cargo de la OVI que entra …» sigue siendo cierta. Sólo el **ordinal** de prosa queda desfasado en uno.
**Decisión: WARNING para la bandeja (R-3)**, no CRITICAL: no es una cita `ruta:línea`, ninguna prueba ni cita depende de él, y esta delta es ADDED-only (RQ-TS-67 declara que no edita RQ-TS-06).
Salida propuesta: entrada en `docs/sdd/ENTRADA.md` para reescribir el ordinal en la próxima tanda que toque esa spec, con el molde del precedente («décima hasta F1B-03»).
No he editado ninguna spec viva.

## 9. Coherencia con el diseño

| Decisión | Resultado |
|---|---|
| D1 módulo `shared`, `index.ts:56` al final | OK: `export * from './codigoServicio'` |
| D2 predicado con la definición de vacío de `transitionExec.ts:44` | OK: `esVacio` idéntica; S > «pedido undefined/null/vacío» |
| D3 propuesta con día de Bogotá, `ticketCreate.ts:7`/`:12` en sitio | OK: `yymmdd(d: unknown)`, `fecha: Date \| string \| null`; el alta sigue pasando `new Date()` |
| D4 guarda en `:131` en sitio | OK: tras la prioridad y antes de `const entran` |
| D6 traza `valoresConCodigoPrevio` en `:155` | OK en sitio; ver W-1 sobre la transacción |
| D7 cliente, tres ediciones en sitio | OK: `:8`, `:80`, `:174` (sin prueba, manual) |
| La delta gana al diseño: cinco PCS | OK: cinco pruebas de posición; CB-6b incluida |
| Sin interruptor (S-8), sin esquema (S-2/S-5) | OK: ningún flag ni `.sql` nuevo |

## 10. Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · RQ-TS-66 pide el previo «leído dentro de la misma transacción de la escritura (RQ-TS-10)», y el código lo lee ANTES.**
  `apps/desk/server/services/ticketService.ts:155` pasa `current.row.codigo_servicio`, que viene de `getTicketWithRefs` (`:124`), una lectura anterior y fuera de la transacción de
  `applyTransition` (`packages/zoho-sync/src/db/repo.ts:338-342`, el `BEGIN` se abre después). Dos administradores a la vez podrían dejar un previo que ya no es el vigente;
  la guarda `403` tiene la misma ventana, como el resto de guardas de `executeTransition`. Ni el diseño (D6) ni la propuesta lo reconocen, y ninguna prueba lo cubre (CB-5 prueba que el previo
  no viene del cliente, no que sea transaccional). Hipótesis: el riesgo real es bajo (un administrador corrige un código a mano). Salida: o se declara como supuesto en el `archive-report.md`
  y se baja el texto del requisito a «leído del ticket antes de escribir», o se lee con bloqueo dentro de `writeTransition`. Decide quien fija el alcance; no bloquea.
- **W-2 · Ordinal «undécima» de la spec viva** (sección 8 ii): `openspec/specs/transitions-st/spec.md:1926`. A la bandeja (R-3).
- **W-3 · Los tres escenarios de `TransitionPanel.tsx` no tienen prueba** (RQ-TC-83): VERIFICACIÓN MANUAL por decisión F0-00; son el único código del cambio sin red (`:8`, `:80`, `:174`).
  El `bloqueado` de `:174` combina cuatro condiciones en una línea. Quedan para la lista de pruebas en la app (acumuladas, no por tanda). No propongo `jsdom` ni `@testing-library`.

### SUGGESTION
- **S-1 · Formato de la evidencia TDD.** `apply-progress.md` no trae la tabla «TDD Cycle Evidence» (RED/GREEN/TRIANGULATE/SAFETY NET por tarea); la evidencia está repartida en prosa y tablas de mutación. Sin consecuencia para el veredicto.
- **S-2 · Dos escenarios sin prueba escrita para ellos**: «un ticket de Zoho con código llega bloqueado» (cubierto por CB-1, que no marca la fila como sincronizada; el bloqueo es por dato, así que es equivalente) y «no hay columna ni marca nueva» (cubierto por el guardián existente de `migrate.test.ts` y por `git diff`).
- **S-3 · `tasks.md` L1.13(c) queda con el pronóstico incorrecto** (da PCS-3, PCS-4 y PCS-5 como rojas en (c)); la verdad está en `apply-progress.md`. Conviene una nota en `archive-report.md`. Además `ticketService.ts:131` sube a 1.870 caracteres (de 1.630), consecuencia de la colocación en sitio.

## 11. Medida del intento (regla del ciclo 2)

`git diff --shortstat --no-renames dff16468` al empezar este verify: vacío (árbol limpio). Del apply, contra `1fc261b4` y sin `tasks.md`: **514 inserciones y 8 borrados (522)**.
Lo único nuevo sin trackear de este intento es este informe (`wc -l` en la devolución del verificador). Binarios: ninguno. Muy por debajo del techo de 720 (800).

## 12. Qué queda

- Para el archive (A.1/A.2): sin CRITICAL. Antes de fusionar, decidir W-1 (declararlo en `archive-report.md` o abrirlo a la bandeja) y llevar W-2 a la bandeja.
- Pruebas en la app (acumuladas): los tres escenarios de RQ-TC-83 con un ticket sin código y otro con código, como técnico y como administrador.
- Pendientes de personas P-1..P-5: no se tocan; archivar no las da por hechas.
