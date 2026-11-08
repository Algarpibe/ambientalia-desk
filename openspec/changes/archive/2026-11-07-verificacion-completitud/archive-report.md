# Informe de archivo — `verificacion-completitud` (`tanda: 1G-03`, `cierra: si`)

Archivado el 2026-11-07 en la rama `verificacion-completitud` (worktree hermano, partida `03ab82c2`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe. Decisión que construye, citada por clave (`openspec/config.yaml` →
`decisiones_de_gerencia_adenda`): `decision/adelanto-09-11-empezar-1g`.

**Cobertura de la fila 1G-03, en una línea (R-1):** cubrió la pasada de sólo lectura que compara Zoho Desk con PostgreSQL entidad por
entidad —tickets (departamento más archivados) en las dos direcciones, conversaciones por listas de ids, adjuntos por cantidad y bytes
frente a `desk.attachments` y frente al volumen, historia por id derivado, contactos y cuentas—, la clasificación de cada diferencia en
«conocida» (lista editable y validada) o «sin explicar», el veredicto por entidad y global, la ruta de superadministrador reanudable con
corte por `429` y el recuento sin Zoho; dejó fuera su ejecución en producción y su repetición el día del corte (P-1 a P-4, de persona), la
línea de `.env.example` (P-5), los huecos de Zoho Books de E-261 (S-d) y el volcado de Zoho como contraste (S-b). Las seis entidades de
`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:71` están cubiertas: por eso `cierra: si`.

## 1. Qué queda construido

- **Motor**, en `apps/desk/server/completitud/`: `comparar.ts` (32 líneas), `veredicto.ts` (20), `conocidas.json` (12) y `conocidas.ts`
  (69), `clasificar.ts` (47), `soloLectura.ts` (39), `lectores.ts` (90), `porTicket.ts` (99) y `verificacion.ts` (344). Tres fases: A, listas
  globales con re-verificación por id; B, por ticket; C, `desk.attachments` frente al volumen con `estadoCopia`, sin descargar nada.
- **Ruta** `apps/desk/server/routes/verificacionCompletitud.ts` (47): `POST` y `GET /api/admin/verificacion-completitud`, cadena rol →
  interruptor → validación en una línea; `limite=0` cuenta sin Zoho y sin interruptor; el `GET` sólo lee el estado.
- **En sitio, sin mover líneas:** `apps/desk/server/app.ts:22`, `apps/desk/server/app.ts:50` y `apps/desk/server/app.ts:57` (3/3);
  `packages/zoho-sync/src/config.ts:66` y `packages/zoho-sync/src/config.ts:125` (2/2, `=== 'true'`);
  `apps/desk/server/testing/appHarness.ts:46` y `apps/desk/server/testing/appHarness.ts:49` (2/2);
  `packages/zoho-sync/src/db/history.ts:8` (1/1, `export function eventId(`); `apps/desk/server/deployRellenoAdjuntos.test.ts:11`,
  `apps/desk/server/deployRellenoAdjuntos.test.ts:22`, `apps/desk/server/deployRellenoAdjuntos.test.ts:34` y
  `apps/desk/server/deployRellenoAdjuntos.test.ts:37` (4/4, la §22 deja de ser la última).
- **`DEPLOY.md` §23** (`DEPLOY.md:989`, 41 líneas al final): la variable con «Qué enciende», «Qué se rompe si se pone mal» y «Nace
  cerrado», y los pasos de persona.
- **Lista de conocidas** (versión 1, siete entradas, una por línea): la regla `nacidoEnLaApp` para tickets, conversaciones, contactos y
  cuentas (`DEPLOY.md` §23); el ticket #1017 (E-267); los adjuntos `495552000061185001` del #881 y `495552000057838002` del #925, en una
  entrada (`DEPLOY.md` §22); y la regla `conversacionAusenteEnZoho` (`DEPLOY.md` §19).
- **Spec viva:** RQ-ZS-34 a RQ-ZS-39 fusionados al final de `openspec/specs/zoho-sync/spec.md` (`openspec/specs/zoho-sync/spec.md:2090`
  a `openspec/specs/zoho-sync/spec.md:2306`).
- **Pruebas nuevas:** 9 ficheros, 162 pruebas (6.037 → 6.199). Nada bajo `apps/desk/src` (regla 13: el cliente no decide nada).

## 2. Intentos del registro, medidas y códigos

Medida propia = `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; en todos los intentos coincidió con el
registro. `npm test` de cierre, en serie con las otras cuatro comprobaciones y sobre el árbol commiteado.

| Intento | Contenido | Commits | Registro | `npm test` de cierre (memoria al arrancar, duración, salida) |
|---|---|---|---|---|
| base | `03ab82c2` | — | — | 10.509 MB, 279 s, 0 (6.037) |
| i1 | propuesta, delta de spec, guarda de `registro.test.ts` | `e9941944` | 422 | 9.718 MB, 335 s, 0 (6.037) |
| i2 | diseño (segunda vuelta), tareas, spec 2/2 | `3de383da` | 402 | 13.470 MB, 246 s, 0 (6.037) |
| i3 | L1 | `37aa6dff`, `52175178` | 382 | 10.516 MB, 256 s, 0 (6.061) |
| i4 | L2 | `d5443ef1`, `c67bef09` | 474 | 11.752 MB, 354 s, 0 (6.104) |
| i5 | L3 | `9cec0871`, `36f7ca51` | 429 | 11.818 MB, 351 s, 0 (6.128); detector 1, ver abajo |
| i6 | L4 | `79665e0a`, `7553c098` | 541 | 10.928 MB, 242 s, 0 (6.153) |
| i7 | L5 | `cdbee075`, `7a8bba7c` | 506 | 11.777 MB, 243 s, 0 (6.169) |
| i8 | L6 | `b8495fc5`, `4724f4fa` | 591 | 11.692 MB, 288 s, 0 (6.197) |
| i9 | verify y W-1/W-2 | `8ccae97a`, `36cb0035` | 178 | 12.277 MB, 244 s, 0 (6.199) |

- Typecheck, lint (165 avisos contra 165 en todos), detector y build salieron en 0 en todos los cierres, con una excepción: en i5 el
  detector dio 1 sobre `9cec0871` por una cita del propio `apply-progress.md` (línea 125: una ruta abreviada inexistente y abreviadas mal
  atribuidas). Se corrigió en sitio (1/1) en `36f7ca51`, con el detector en 0 y las abreviadas rotas de vuelta a 13, las de la base.
- Pasadas enteras de los agentes, además de las de cierre: L1 0 (245 s); L2, la primera **inválida** (1 roja por editar una prueba con la
  suite en marcha) y la segunda 0 (351 s); L3 **1** (una roja propia en `apps/desk/server/superficieSaliente.test.ts` por un comentario con
  la forma literal que ese barrido caza; corregido, y la pasada de cierre de i5 es el verde completo); L4 0 (329 s); L5 0 (250 s); L6 0.
- Desvíos declarados: el bloqueante de la puerta del diseño (los tickets `app-` no se piden por id) se resolvió en la spec, en sitio
  (`openspec/specs/zoho-sync/spec.md:2132` tras la fusión); L6 cambió 1/1 una prueba de L5 (`dir: null` → un directorio sin filas) porque
  la fase C deja adjuntos «sin comparar» sin directorio; L5 redactó `porTicket.ts` antes de correr su prueba (el rojo medido es el del motor
  sin cablear), anotado en `apply-progress.md`.

## 3. Archivo (i10)

Techo del intento: 2 × 1.251 (carpeta antes del informe) + 800 = 3.302. Parte con carga de revisión, medida antes de mover la carpeta:
la fusión del delta (218 inserciones, 0 borrados) más este informe. Fusión por `herramientas/fusiona.mjs` del worktree hermano: seis
bloques ADDED al final, idénticos bloque a bloque a la delta, salida 0; la spec pasa de 2.088 a 2.306 líneas, todas CRLF, y de 193 a 225
escenarios. `apps/desk/server/reconciliacion/registro.test.ts:218` y `apps/desk/server/reconciliacion/registro.test.ts:220`, en sitio y con
su rojo medido al mover la carpeta: «en curso» vuelve a OCHO y 1G-03 pasa a «cerradas por archivo». Las cifras finales del intento van en
la sección 9, que se escribe tras las comprobaciones.

## 4. Verificación y mutaciones

- **Verify (i9): PASS WITH WARNINGS.** 32/32 escenarios con prueba (31 cubiertos y 1 parcial, la variante única de E-266); CA-1 a CA-13
  mapeados. 45 mutaciones reproducidas con `perl` y restauración comprobada por `sha256sum`: las 31 del apply y 14 propias del verify.
  Todas las del apply dieron rojo por aserción salvo M3 (b) sola, que el diseño declara no discriminante sin un escritor.
- **W-1 y W-2, cerradas en i9** con dos pruebas al final de `apps/desk/server/completitud/verificacionGlobal.test.ts` y su rojo medido:
  quitar el `departmentId` de las listas de tickets da `[null, null]` frente a `['77', '77']`; quitar `hechaB` de la línea de `completa`
  da `[true, 'incompleto']` frente a `[false, 'incompleto']`. **W-3 queda declarada:** las envolturas de sólo lectura están probadas en
  `apps/desk/server/completitud/soloLectura.test.ts`, pero su cableado en el motor no es observable sin un escritor en la ruta.
- Tras la corrección: 0 CRITICAL · 1 WARNING (W-3) · 5 SUGGESTION.
- **Las tres familias que pide el encargo:** posición (P1 rol antes que interruptor, P2 interruptor antes que validación, P3 `429` antes
  de `404` y de `!res.ok`, P4 re-verificar por id antes de «falta en Zoho», P5-P6 orden de la clasificación, P7 `enMarcha` antes del primer
  `await`, P8 el corte antes de contar el ticket); fichero vigilado (M6 y M7 sobre el `conocidas.json` real, y E-267 → E-999999 que caza la
  comprobación de entradas); clasificación (quitar la entrada del #1017 lo vuelve «sin explicar», M7a; quitar una regla vuelve «sin
  explicar» sus filas, M7b; quitar la herencia, M9).

## 5. Obligaciones del encargo

- Medida = registro en los diez intentos; estimación ×1,8 por lote en `tasks.md` (740-775 frente a 800); ningún lote pasó de 591.
- `npm run lint -- --max-warnings 165` en cada cierre (165 contra 165: la base estaba en el umbral y no entró ningún aviso).
- `npm test` siempre con log en el scratchpad, con memoria libre al arrancar, duración y salida (sección 2).
- Mutaciones con `perl -i -pe '… if $. == N'`, nunca con `sed -i`; restauración comprobada por `sha256sum`, `git diff` y `file`.
- Barrido de la regla de mutación 4 sobre los ficheros muy citados editados en sitio (`config.ts`, `appHarness.ts`, `history.ts`,
  `app.ts`, `deployRellenoAdjuntos.test.ts`) y sobre `DEPLOY.md` y la spec viva, que sólo crecen al final: ninguna línea se movió. El caso
  B que creaba `packages/zoho-sync/src/db/history.ts:8` (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:47`) quedó anotado en sitio.
- Límites: contra Zoho sólo `GET` (`soloGet`); contra PostgreSQL sólo `SELECT` (`soloSelect`, que además cuenta lo rechazado); ninguna
  tabla ni migración nueva; informe, `GET` y log con ids, números de ticket y recuentos, nunca nombres, correos, asuntos ni contenido.
- Contraste dato a dato de cada informe de subagente contra el árbol antes de cada settle: todas las cifras coincidieron.
- Los seis ficheros de Supervisión, intactos; ningún CSV ni JSON sin trackear; commits convencionales sin coautoría.

## 6. Supuestos

| Id | Estado al archivar |
|---|---|
| S-a | Aplicado: `VERIFICACION_COMPLETITUD_HABILITADA` nace cerrada; `limite=0` no la necesita |
| S-b | Aplicado: vía API; el volcado de Zoho queda fuera |
| S-c | Aplicado: verde = cero «sin explicar» con cobertura completa. **Posible pregunta para el apartado 06**: decide si el corte se puede hacer |
| S-d | Aplicado: E-261 fuera, sin destino inventado |
| S-e | Aplicado, **hipótesis sin medir**: `GET /tickets/{id}/attachments` como segunda fuente; si falla, es error del ticket |
| S-f | Aplicado, **hipótesis sin medir**: `GET /accounts` por páginas; `desk.accounts` es parcial por construcción |
| S-g | Aplicado: lo nacido en la app sale por regla de la lista; los tickets `app-` no se piden por id (spec, en sitio) |
| S-h | Aplicado: los 8 adjuntos del 06/11 no se precargan |
| S-i | Aplicado: peticiones y `429` por entidad en el informe |
| S-j | Aplicado: siete entradas validadas al cargar |
| S-k | Aplicado: el `departmentId` de la sincronización, ahora con prueba (W-1) |
| S-l | Aplicado: «hueco de lista» frente a «falta en Zoho» |
| S-m | Aplicado: informe en memoria; una reanudación sin la parte previa sale «incompleto»; un corte en la fase A se relanza sin `desde` |
| S-n | Aplicado: `cierra: si`; correr la pasada es de persona |

## 7. Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Abrir `VERIFICACION_COMPLETITUD_HABILITADA` (`true`) en la App y redesplegar | Alfonso | `DEPLOY.md` §23 |
| P-2 | `limite=0` primero; después la pasada completa y el `GET` hasta `terminado: true`; si se corta, `desde=<cortadoEn>` sin redesplegar | Alfonso | `DEPLOY.md` §23 |
| P-3 | Pasar el resumen del `GET` final al analista y cerrar el interruptor, con redespliegue | Alfonso | `DEPLOY.md` §23 |
| P-4 | Repetir la pasada el día del corte, tras congelar Zoho y la sincronización final | Alfonso | `DEPLOY.md` §23 |
| P-5 | Añadir a `.env.example` las dos líneas de abajo: la terminal no puede leer ese fichero | Alfonso | este informe |

Líneas redactadas para `.env.example` (P-5):

    # VERIFICACION_COMPLETITUD_HABILITADA (1G-03, DEPLOY.md §23). Qué enciende: que un superadministrador lance POST /api/admin/verificacion-completitud, la pasada de sólo lectura que compara Zoho Desk con Desk. Qué se rompe si se pone mal: abierta por descuido gasta cuota diaria de Zoho Desk, compartida con la sincronización; cualquier valor distinto de 'true' la deja cerrada y el POST responde 403.
    VERIFICACION_COMPLETITUD_HABILITADA=

## 8. Para Supervisión y la bandeja (R-3)

- **S-c al apartado 06:** la definición de verde decide si el corte se puede hacer.
- **Cuentas:** lo probable es que salgan «sin explicar», porque `desk.accounts` sólo recibe las cuentas que nombra un contacto o un ticket
  (`packages/zoho-sync/src/sync.ts:86-93`). Si importan para el corte y con qué clase, lo decide Gerencia; la tanda no inventa una clase.
- **E-261 (S-d)**, `books.contacts` y `books.sales_orders`: fuera, sin destino.
- **E-254 (d):** las peticiones por entidad de la primera pasada son la medida de la cuota.
- **E-266:** comparar por ids saca de la prueba del corte a los 51 tickets descuadrados por los hilos `FEEDBACK`; el criterio de marcado
  de 1G-01 no cambia.
- **Los dos adjuntos con `404`** (#881 y #925) no tienen entrada en la bandeja; la lista cita `DEPLOY.md` §22. Su traza es de Supervisión.
- **Maestro:** `toca_maestro: no`. Si la primera medida da cuentas o historia incompletas, queda desmentida desde esa fecha la frase de
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3445` sobre lo que «ya está en la base propia»: al expediente.
- **W-3** y las dos fuentes sin medir (S-e, S-f) se confirman o se descartan con la primera pasada en producción.
- **Reconciliación:** tras fusionar, 1G-03 cuenta como cerrada por archivo; la reconciliación de `main` se regenera como tras 1G-02.

## 9. Cierre del intento de archivo (i10)
