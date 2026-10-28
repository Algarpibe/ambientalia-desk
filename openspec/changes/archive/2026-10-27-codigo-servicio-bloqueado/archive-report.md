# Informe de archivo — `codigo-servicio-bloqueado` (`fuera-del-plan`, `cierra: no`)

Archivado el 2026-10-27 en la rama `codigo-servicio-bloqueado` (worktree hermano, base `aea714ac`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe.

**Sin fila del plan.** `tanda: fuera-del-plan`, con el motivo escrito en la cabecera de `proposal.md` (F1B-03 está cerrada por archivo y
reabrirla cambiaría el alcance de su fila). **Cubrió lo que pide `decision/ingreso-servicio-reescribe-codigo`: el servidor impide cambiar un
código de servicio ya fijado salvo al administrador, deja traza del valor previo y propone el deducido a los tickets sin código; dejó fuera
una vía para fijarlo fuera de `Ingresado` (P-2, P-3) y la revisión del maestro (P-4).** Por eso `cierra: no`. Decisiones citadas por clave
en `openspec/config.yaml` → `decisiones_de_gerencia_adenda`: `decision/ingreso-servicio-reescribe-codigo`, `decision/excepcion-plazo-rq-kp-26`.

## 1. Qué queda construido

`git diff --shortstat --no-renames 1fc261b4 dff16468`: 9 ficheros, 532 inserciones y 26 borrados (de ellos, `tasks.md` 18 y 18, y
`apply-progress.md` 108 nuevas).

| Pieza | Dónde |
|---|---|
| Regla pura: `cambiaCodigoSinPermiso`, `puedeCambiarCodigoServicio` (sólo `isAdmin`), `propuestaCodigoServicio`, `valoresConCodigoPrevio` | `packages/shared/src/codigoServicio.ts` (nuevo, 58 líneas), exportado en `packages/shared/src/index.ts:56` |
| Guarda `403` de escalón B, tras la prioridad y antes de todo `422` | `apps/desk/server/services/ticketService.ts:131` (en sitio) |
| Traza del valor previo en los `values` de la fila de `ticket_transitions` | `apps/desk/server/services/ticketService.ts:155` (en sitio) |
| `buildCodigoServicio` acepta la fecha como texto (día civil de Bogotá) | `packages/shared/src/ticketCreate.ts:7`, `:12` (en sitio) |
| Cliente: propone el código deducido y lo desbloquea al administrador | `apps/desk/src/components/TransitionPanel.tsx:8`, `:80`, `:174` (en sitio; fuera de la red de pruebas, F0-00) |

**Colocación:** inserciones = borrados en los tres ficheros citados (`ticketService.ts` 3 y 3, `ticketCreate.ts` 2 y 2, `TransitionPanel.tsx`
3 y 3) e `index.ts` 1 y 0: ninguna línea existente cambió de número. **Sin migración ni DDL**, sin interruptor nuevo y sin nota en `DEPLOY.md`
(S-2). **Bundle del cliente:** `dist/assets/index-F1jDYjEU.js` **427.510 B** (producción, `index-BFrlA0VZ.js`, 427.122 B: +388 B) y
`dist/assets/index-BXv9vVDm.css` 32.681 B, el mismo nombre que producción.

## 2. Rojo, verde y mutaciones

Detalle en `apply-progress.md`; el verificador las reprodujo (sección de mutaciones de `verify-report.md`).

- **Rojo primero:** `codigoServicio.test.ts` no cargaba (módulo ausente) y la prueba HTTP nació con 17 rojas por la razón correcta.
- **Pruebas nuevas:** 51 (30 en `packages/shared/src/codigoServicio.test.ts`, 21 en `apps/desk/server/codigoServicioBloqueado.test.ts`:
  CB-1 a CB-7, CB-6b y PCS-1 a PCS-5). Suite: de 5.681 a 5.732 pruebas (5.706 pasan, 26 saltadas).
- **M1 (posición):** cada una de las cinco pruebas de posición tiene una colocación que la pone roja. **Desvío del plan:** la colocación (c) de
  L1.13 no ponía PCS-4 en rojo; el apply añadió la (d), al final de la línea del `409` de estado, y PCS-4 cae ahí. `tasks.md` conserva el
  pronóstico original; la verdad está en `apply-progress.md` (S-3 del verificador).
- **M2 (condición) y M2b (fichero vigilado `packages/shared/src/transitions.ts:262`):** todas con su roja. Todo restaurado con `git diff` vacío y CRLF.

## 3. Spec viva

Las dos deltas son ADDED-only y se añadieron **al final** de su spec viva, por script, sin desplazar ninguna línea:

| Spec viva | Añadido | Requisitos | Escenarios | Líneas |
|---|---|---|---|---|
| `openspec/specs/tickets-core/spec.md` | `:4679-4811` | RQ-TC-81 a RQ-TC-83 | 16 | 4.677 → 4.811 |
| `openspec/specs/transitions-st/spec.md` | `:3406-3562` | RQ-TS-65 a RQ-TS-67 | 20 | 3.404 → 3.562 |

El script releyó cada tramo añadido y lo comparó línea a línea con el bloque de su delta: **idénticos**. 36 escenarios, los mismos 36 de las
deltas.

## 4. W-1 — resuelto corrigiendo la delta, no el código

El verificador (W-1 en `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/verify-report.md:222`) encontró que RQ-TS-66 exigía el
valor previo «leído dentro de la misma transacción de la escritura (RQ-TS-10)» y que el código lo toma de la fila leída antes del `BEGIN`.
**Decisión del analista, 2026-10-27: se corrige la delta.** Razones, comprobadas en el árbol de la rama:

- **Todo el motor lee la fila antes del `BEGIN`, no sólo la traza.** `executeTransition` la lee en `apps/desk/server/services/ticketService.ts:124`
  y de esa lectura salen el `409` de estado (`:126-127`), las guardas de prioridad y de código (`:131`) y la traza (`:155`); la transacción la
  abre después `applyTransition` (`packages/zoho-sync/src/db/repo.ts:322`, `BEGIN` en `packages/zoho-sync/src/db/repo.ts:338`).
- **No hay ningún bloqueo de fila:** `FOR UPDATE` aparece 0 veces en `packages/zoho-sync/src/db/repo.ts` y en
  `apps/desk/server/services/ticketService.ts`.
- **RQ-TS-10 promete escrituras atómicas, no lecturas dentro de la transacción** (`openspec/specs/transitions-st/spec.md:416-420`).
- **Arreglar sólo el valor previo dejaría la misma carrera abierta** en el `409` de estado y en la prioridad.

**Corrección, en sitio y antes de fusionar** (3 líneas por 3; la delta sigue con 172 líneas), en
`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/specs/transitions-st/spec.md:96-97`: el valor previo **SHALL** ser el del ticket
leído en el servidor —nunca el que envía el cliente—, en la misma lectura que usan las guardas de la transición, y la traza **SHALL**
escribirse en la misma transacción que el cambio (RQ-TS-10). El título del escenario de `:126` decía «el valor previo es el de la
transacción»: se reescribió en sitio a «el del ticket leído en el servidor». Ningún otro escenario de las dos deltas habla de lectura
transaccional. **CB-5 sigue cubriendo lo que queda** (`apps/desk/server/codigoServicioBloqueado.test.ts:96`: una clave de previo inyectada no
llega a la traza, y el administrador que inyecta un previo falso deja el del ticket). Ese texto corregido es el que se fusionó en el §3.

## 5. Antes de la mudanza

- **Parte revisable, medida antes de aplicar:** fusión 134 + 158 = 292 líneas, corrección de la delta 3 + 3 y este informe: muy por debajo
  de 800 (regla del archivo).
- **Rutas propias:** `git grep "openspec/changes/codigo-servicio-bloqueado"` da 0 fuera de la carpeta y 0 dentro: no hubo rutas que reescribir.
- **Citas:** fusionar al final no desplaza nada. El detector se puso rojo una vez en el verify por una cita del propio informe
  (`codigoServicio.ts:53-59`, con el fichero en 58 líneas) y se reparó en sitio en `6a91df13` (caso A).

## 6. Registro de intentos (`gentle-ai sdd-attempt`)

Medida de cada intento: `git diff --shortstat --no-renames` contra su partida más `wc -l` de lo nuevo sin trackear (nada sin trackear en
ninguno). Evidencia: sha256 de un texto con el SHA de HEAD y una línea «log, salida, sha256 del log» por comprobación.

| Intento | Contenido | Commit | Medida | Cierre |
|---|---|---|---|---|
| i1 | planificación | `1fc261b4` | 740 (supera el margen de 720 del objetivo, no el techo de 800; lo decide el analista) | `finish` passed |
| i2 | apply L1 | `dff16468` | 558 | `settle` passed |
| i3 | verify | `11658ec1`, `6a91df13` | 246 | `settle` passed |
| i4 | archive | el de este informe | se mide al cerrar | `settle` |

`npm test` del i2 salió 0 a la tercera pasada: las dos primeras salieron 1 **sólo** por «Timeout calling onTaskUpdate» con todas las pruebas
verdes, y quedan en la evidencia del intento. Memoria física medida antes de cada `npm test`: siempre por encima de 12.000 MB; el verificador
esperó una vez porque había 11.356 MB.

## 7. Verify y ejecución

Veredicto **PASS WITH WARNINGS**: 0 CRITICAL, 3 WARNING, 3 SUGGESTION. 33 escenarios cubiertos y pasados, 3 de verificación manual (RQ-TC-83,
`TransitionPanel.tsx`), 0 sin cubrir. W-1 está resuelto en el §4. W-2 va a la bandeja (§8). W-3 son los tres escenarios manuales, que quedan
para las pruebas en la aplicación. El sobre YAML declara `scenarios: 33/33`, porque el validador rechaza un `pass` con 33/36; los tres
manuales van aparte en el informe. Los cinco códigos (`npm test`, typecheck, lint 165/165, detector y build) salieron en 0 en el verify y se
repiten sobre el commit de este archivo antes del `settle`.

## 8. Hallazgos para la bandeja (R-3) — la rama no toca `docs/sdd/ENTRADA.md` ni `openspec/config.yaml`

- **H-1 · El motor de transiciones lee la fila antes del `BEGIN` y sin bloqueo de fila.** Ventana de carrera común al `409` de estado, a la
  prioridad y al código (`apps/desk/server/services/ticketService.ts:126`, `:131`). **Sin destino; lo asigna Supervisión.**
- **H-2 · Ordinal desfasado en la spec viva.** `openspec/specs/transitions-st/spec.md:1926` dice que la guarda de remisión es «la undécima» del
  orden de `executeTransition`; con la guarda del código es la duodécima. No es una cita `ruta:línea` y no se editó (W-2 del verify).

## 9. Supuestos reversibles — a la lista semanal

Los S-1 a S-8 de `proposal.md` §5, sin cambios en este archivo. El de más peso es S-1 (`fuera-del-plan`): si Gerencia lo cuenta en F1B-03
(P-1), se cambia la cabecera.

## 10. Tareas de persona — fuera del recuento (archivar no las da por hechas)

| # | Qué | Dueño | Destino |
|---|---|---|---|
| P-1 | Si el cambio cuenta en F1B-03 (S-1) | Supervisión / Gerencia | Cabecera y barrido |
| P-2 | Los tickets sin código que ya pasaron de `Ingresado` no tienen vía para fijarlo | Gerencia | Panel, apartado 06 |
| P-3 | Si el administrador puede corregir el código fuera de `Ingresado` | Gerencia | Panel, apartado 06 |
| P-4 | M1.1 y Anexo D nº 37 recogen el bloqueo y la propuesta | Gerencia | Próxima revisión del maestro |
| P-5 | Desplegar cliente y servidor tras la fusión | Despliegue | Producción |

## 11. Qué se verá en la aplicación

En `ingreso_a_servicio` y `calibracion_directa`: un usuario que no es administrador y cambia un código ya fijado recibe «El código de servicio
de este ticket ya está fijado: sólo un administrador puede cambiarlo» y el ticket no cambia. El administrador sí puede cambiarlo, y el
historial guarda el valor anterior y el nuevo. A un ticket sin código el panel le propone el deducido, editable. Las tres conductas de pantalla
son de verificación manual y van a la lista acumulada de pruebas en la aplicación.
