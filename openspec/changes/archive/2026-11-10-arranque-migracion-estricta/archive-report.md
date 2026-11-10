# Informe de archivo — `arranque-migracion-estricta`

Cabecera R-1 (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:1-9`): `tanda: fuera-del-plan`,
motivo `decision/arranque-bloqueado-por-consola (2)`, `capacidad: [zoho-sync]`, `maestro: []`, `cierra: si`, `toca_maestro: no`,
`origen_cabecera: declarada`.

**Qué cubre de la decisión, en una línea:** el paso (2) entero —límite de espera en la puesta al día de la base del arranque de la
App, con rastro en el registro, y que una sentencia que falle detenga el arranque—; deja fuera el paso (1), configuración de la base
de producción, que es tarea de persona (P-3), y la medición de la consecuencia (3), también de persona (P-2).

Partida: `main` en `97539c73`. Rama `arranque-migracion-estricta`, worktree propio. Verify: PASS
(`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/verify-report.md`).

## 1 · Qué se construyó

| Pieza | Dónde |
|---|---|
| Módulo nuevo: cliente propio del pool, `SET lock_timeout` de sesión antes de la primera sentencia, ejecución sentencia a sentencia en autocommit, parada en el primer fallo, cliente destruido siempre | `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:79`, `:92`, `:86` |
| Constante del límite, 10 s, sin variable de entorno (S-2, S-3) | `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:15` |
| Arranque de la App: las dos líneas cambiadas en sitio, mismo número de líneas, `:8` intacta | `apps/desk/server/index.ts:26-27` |
| Worker, `migrate()` y `reorgToDesk()` para los demás llamadores, sin cambios (S-1) | `packages/zoho-sync/src/db/migrate.ts:24-36`, `:126-131`; `apps/hub-sync/src/hubSync.ts:13` |
| `DEPLOY.md` §26 al final: qué cambia, la línea del registro medida y qué hacer si la App no arranca | `DEPLOY.md:1112` |
| Spec viva: RQ-ZS-52 a RQ-ZS-57, añadidos al final | `openspec/specs/zoho-sync/spec.md:2713`, `:2738`, `:2768`, `:2797`, `:2832`, `:2860` |

Diseño elegido: cliente propio y no `SET LOCAL` en una transacción, porque esta convertiría la puesta al día en todo o nada y
retendría cada bloqueo exclusivo hasta el `COMMIT` (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/design.md`).
La hipótesis del brief —un `SET` por `pool.query` no se conserva en otra consulta del `Pool`— quedó **medida** por I-3.

## 2 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commits | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `634df678` | 395 |
| i2 | diseño y tareas | `18ae6188` | 382 |
| i3 | L1 módulo, pruebas unitarias, `index.ts:26-27`, M-1 a M-9 | `efe78667` | 527 |
| i4 | L2 integración contra PostgreSQL real y E-3 | `19c2a898` | 231 |
| i5 | L3 `DEPLOY.md` §26, guarda de la §25, barrido de citas | `53037eec`, `a7ee92de` | 221 |
| i6 | verify | `468f7f8a` | 134 |
| i7 | archivo | este commit | se mide al cerrar el intento, techo 3.300 (2 × 1.076 + 800, redondeado) |

Ningún intento pasó de 800. En cada uno, las cinco comprobaciones (typecheck, `npm run lint -- --max-warnings 165`, detector de citas
sobre el commit, `npm test` a log y build) salieron en 0 sobre el commit del intento. Pasadas fallidas, guardadas como evidencia del
`settle`: i5 (detector 1: una ruta abreviada con «…/» en la tabla del barrido se leía como fichero inexistente; corregida en
`a7ee92de`) e i6 (`npm test` 1 por `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts`, espera acotada y `ENOTEMPTY` al limpiar;
ajeno a la rama, que no toca `apps/desk/server/adjuntos`, y en verde 3 de 3 suelto; la segunda pasada salió 0). Lint: 165 avisos
contra 165 en todos. Build: el mismo bundle de cliente que `main` (`index-F1jDYjEU.js`). `npm test`: 6.435 pruebas en la partida,
6.462 al cerrar (+27), y 30 omitidas (+4, la integración, que se salta sin `TEST_DATABASE_URL`).

Parte con carga de revisión del archivo, medida antes de mover la carpeta: la fusión del delta, **+178 / −0**, más este informe.

## 3 · Pruebas y mutaciones

- Unitarias: `packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts` (U-1 a U-12) y `apps/desk/server/arranqueEstrictoIndice.test.ts`
  (lee `index.ts` como texto). Rojo previo anotado en `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/apply-progress.md`.
- Integración: `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts` (I-1 a I-4), molde de
  `apps/desk/server/db/migracionConcurrente.integration.test.ts:17-21`. En el CI corre con `TEST_DATABASE_URL`
  (`.github/workflows/ci.yml:45-47`). Medida a mano contra contenedores desechables locales: PostgreSQL 16.14 y 17.11, 4 de 4 en verde;
  SQLSTATE real al agotarse el límite: `55P03`, corte a los 10.105 ms. Contenedores borrados.
- E-3, arranque de verdad de `index.ts` con `tsx` contra el contenedor con un bloqueo `ACCESS EXCLUSIVE` abierto, desde un directorio sin
  `.env` y con variables ficticias: salida 1 a los 14 s, línea `Fallo al arrancar el servidor` con `ErrorLimiteEspera` y el mensaje
  completo, y ninguna línea «API en http». Por eso **S-7 no aplicó**: no hizo falta escribir también por `console.error`.
- Mutaciones (regla de mutación 1 y 2), todas rojas y restauradas byte a byte: M-1 (el `SET` después de la primera sentencia), M-2
  (intercambiar `index.ts:26` y `:27`), M-3, M-4 (volver a tolerar), M-5a, M-5b, M-6, M-7 (`release()` sin destruir, también contra
  PostgreSQL real), M-8 (leer una variable de entorno), M-9, M-10 (ensuciar `DEPLOY.md`) y la acotación de la guarda de la §25. El
  verificador reprodujo por su cuenta M-1, M-2 y M-4.

## 4 · Barrido de citas (regla de mutación 4)

Ficheros que cambiaron de contenido en líneas citadas: `apps/desk/server/index.ts` (`:26`, `:27`),
`apps/desk/server/modoSinZohoIndice.test.ts` (`:42`) y la guarda de `apps/desk/server/deployCalificacionesConversaciones.test.ts`.
`DEPLOY.md` sólo crece al final: sus 489 citas siguen en caso A. Trece citas de caso B se anclaron «en `97539c73`» en su misma línea
física, sin renumerar (siete paquetes `docs/sdd/Paquete_de_Despliegue_*`, tres artefactos de `archive/` y tres de este cambio); la
tabla completa está en `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/apply-progress.md`. Las tres de `archive/`, que
el detector no barre, se comprobaron a mano contra `97539c73`.

**Para Supervisión — citas de los seis ficheros, listadas y NO editadas:**

| Cita | Qué afirma | Caso tras este cambio |
|---|---|---|
| `docs/sdd/ENTRADA.md:2425` | el arranque migra antes de escuchar (`index.ts:27`, `:57`) y la migración sólo registra las que fallan (`migrate.ts:28-34`) | A para el orden; B para el arranque de la App, que hoy no tolera |
| `docs/sdd/ENTRADA.md:2430` | salida (1), un `lock_timeout` en la migración, sin destino | C: lo cierra este cambio |
| `docs/sdd/ENTRADA.md:2414` | dónde empieza la §25 de `DEPLOY.md` | A |
| `openspec/config.yaml:6478-6481` | la tolerancia de `migrate.ts:25-34` es deliberada; con el cambio la App dejaría de arrancar si una sentencia falla siempre | A de la función; la segunda frase es hoy lo construido |

`CLAUDE.md`, `docs/sdd/R08.4_Expediente_de_cambios.md` y los `docs/sdd/F0-05_*` no citan ninguno de los ficheros tocados.

## 5 · Supuestos para la lista semanal (reversibles)

S-1 sólo el arranque de la App es estricto; S-2 el límite es una constante documentada en `DEPLOY.md` §26; S-3 10 s por sentencia;
S-4 la lógica va en un módulo nuevo aunque la decisión nombra `migrate.ts`; S-5 la spec va como ADDED con precedencia declarada sobre
RQ-ZS-10 y RQ-ZS-51; S-6 la línea sale por el `logger`; S-7 no aplicó. Texto completo en
`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:120-126`.

## 6 · Tareas de persona — fuera del recuento; archivar NO las da por hechas

| | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar antes del 12/12 y comprobar que la App escucha | Alfonso | `DEPLOY.md` §26 |
| P-2 | ANTES de desplegar: medir las líneas «sentencia omitida» del registro de producción y si EasyPanel enseña stderr. Si alguna sentencia falla en cada arranque, con este cambio la App no arranca | Alfonso, con el analista | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/tasks.md:86` |
| P-3 | Paso 1 de la decisión: `idle_in_transaction_session_timeout` en la base de producción, con copia previa | Alfonso | `openspec/config.yaml:6474-6475` |

Riesgo abierto, el único WARNING del verify: la consecuencia (3) sólo está medida sobre una base vacía (I-1). La vuelta atrás es
redesplegar la imagen anterior. Cosmético, anotado: el registro repite el texto de la causa, porque pino imprime también `cause`.
