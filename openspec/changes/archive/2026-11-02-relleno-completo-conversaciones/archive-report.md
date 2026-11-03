# Informe de archivo — `relleno-completo-conversaciones` (`tanda: 1G-01`, `cierra: si`)

Archivado el 2026-11-02 en la rama `relleno-completo-conversaciones` (worktree hermano, partida `a729a371`) y **sin fusionar a
`main`**: la tanda para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son
instantáneas de su momento; donde difieran, manda este informe. Decisión que construye, citada por clave (`openspec/config.yaml` →
`decisiones_de_gerencia_adenda`, sólo en la copia de trabajo de `main`): `decision/adelanto-09-11-empezar-1g`.

**Cobertura de la fila 1G-01, en una línea:** cubrió el relleno de detalle y conversaciones de todos los tickets de Zoho que Desk conoce,
archivados incluidos, lanzado a mano por un superadministrador tras un interruptor que nace cerrado, con verificación por ticket contra el
`commentCount` + `threadCount` del detalle fresco, resumen sin datos de cliente y el punto 2 de `debt.md` cerrado; dejó fuera su ejecución
en producción (P-2, de persona) y la completitud de tickets entre Zoho y Desk (1G-03). Junto con el mecanismo de `sync-conversaciones-zoho`
(archivado el 2026-10-29 con `cierra: no`), el contenido de la fila queda construido: por eso `cierra: si`. Archivar no da por hecha P-2.

## 1. Qué queda construido

`git diff --shortstat --no-renames a729a371 f78e39fe`: 22 ficheros, +2.278 −17; fuera de `openspec/`: 16 ficheros, +1.074 −17.

| Pieza | Dónde |
|---|---|
| La pasada: ids de `desk.tickets` sin los `app-`, detalle fresco, persistencia, lista entera, clase sobre lo guardado y visible, `429` reintentado y, agotado, corte con `cortadoEn`; resumen al log | `apps/desk/server/rellenoConversaciones.ts` (nuevo, 154 líneas) |
| `syncTicket(id, detalle?)`: persiste un detalle ya leído sin volver a pedirlo (3 líneas por 3) | `packages/zoho-sync/src/sync.ts:178-179` |
| `POST` y `GET /api/admin/relleno-conversaciones`, sólo superadministrador; el `403` del interruptor antes de validar; `limite=0` sólo cuenta; `GET` nunca lanza | `apps/desk/server/routes/rellenoConversaciones.ts` (nuevo, 49 líneas) |
| Interruptor `RELLENO_CONVERSACIONES_HABILITADO`, `=== 'true'` | `packages/zoho-sync/src/config.ts:66`, `:125` (en sitio) |
| Cableado en la App y en el arnés de pruebas | `apps/desk/server/app.ts:9`, `:22`, `:50`, `:57`; `apps/desk/server/testing/appHarness.ts:46`, `:49` (en sitio) |
| Despliegue | `DEPLOY.md:882` (§21, al final): las dos frases en `DEPLOY.md:884` y `:890`; la línea de entorno en `:899` |
| Punto 2 de `debt.md`, cerrado | `debt.md:602`, `:614`, `:616-617` (en sitio) |
| Pruebas nuevas | `rellenoConversaciones.test.ts` (422), `rellenoConversacionesPausas.test.ts` (73), `rellenoConversacionesRutas.test.ts` (189) y `deployRellenoConversaciones.test.ts` (47), en `apps/desk/server/`; `packages/zoho-sync/src/sync.syncTicketDetalle.test.ts` (49); +21 al final de `config.test.ts` y de `opcionesConversaciones.test.ts` |

**Colocación:** inserciones = borrados en todos los ficheros citados editados en sitio (`sync.ts` 3/3, `config.ts` 2/2, `app.ts` 4/4,
`appHarness.ts` 2/2, `deployConversaciones.test.ts` 2/2, `debt.md` 4/4 y, en el archivo, `registro.test.ts` 2/2): ninguna línea
existente cambió de número. `DEPLOY.md`, `config.test.ts` y `opcionesConversaciones.test.ts` sólo añaden al final. **Cliente:** ningún
fichero de `apps/desk/src`. El rol y el interruptor los impone el servidor (`apps/desk/server/routes/rellenoConversaciones.ts:36`,
`:46`, y el `403` en `apps/desk/server/routes/rellenoConversaciones.ts:17-18`); el cliente no decide nada (regla 13). `.env.example` no se
toca: su línea la añade Alfonso (P-1).

**Guardas que cuentan el árbol**, corregidas en sitio con su molde: `apps/desk/server/deployConversaciones.test.ts:20` (la §20 deja de ser
la última sección y su tramo para en la §21) y `apps/desk/server/reconciliacion/registro.test.ts:218`, `:220` (1G-01 sale de «en curso» al
archivar). La segunda, con rojo medido al mover la carpeta (1 roja: el `toEqual` de «en curso» ya no trae 1G-01) y verde tras corregirla
(23 de 23).

## 2. Intentos del registro, medidas y códigos

Medida = `git diff --shortstat --no-renames` contra la partida del intento + `wc -l` de lo nuevo sin trackear (0 al asentar en todos).

| Intento | Commits | Medida | Qué | Códigos (typecheck · lint · citas · build · test) |
|---|---|---|---|---|
| i1 | `5ce2f54b` | 595 | planificación: proposal, spec, design y tasks | 0 · 0 · 0 · 0 · 0 (la 1.ª pasada de `npm test` dio 1 sólo por dos «Timeout calling onTaskUpdate», todo verde; 0 al repetir) |
| i2 | `6bd57424`, `b70c2a76`, `734e556a` | 561 | L1: `syncTicket(id, detalle?)`, recorrido, detalle, persistencia, lectura y clases | 0 · 0 · 0 · 0 · 0 (el detector dio 1 por siete citas de `apply-progress.md` con ruta abreviada; rutas completas en `b70c2a76`) |
| i3 | `16f54ec4`, `82649404` | 516 | L2: verificación tras marcar, `429`, `enMarcha`, resumen | 0 · 0 · 0 · 0 · 0 |
| i4 | `9a439c10`, `e4121565` | 592 | L3: interruptor, cableado, rutas, `DEPLOY.md` §21 y `debt.md` | 0 · 0 · 0 · 0 · 0 |
| i5 | `dfb6eb17`, `f78e39fe` | 169 | `verify-report.md` | 0 · 0 · 0 · 0 · 0 (una abreviada nueva del informe, atribuida al fichero equivocado, pasó a ruta completa en `f78e39fe`) |
| i6 | este commit | ver §3 | archivo | ver §3 |

Lint, siempre 165 avisos contra el umbral de 165. Memoria física antes de cada `npm test`: entre 13.070 y 14.623 MB; la primera lectura
de i1 dio 11.704 MB, por debajo de 12.000, y tres lecturas seguidas dieron unos 14.000 antes de seguir (consta en el registro). Logs en el
scratchpad de la sesión.

## 3. Archivo (i6)

**Parte revisable, medida antes de asentar:** la fusión, +121 −0, y este informe, +132: 253, por debajo de 800. Fusión
por script (`fusiona.mjs`, sólo ADDED, al final) con identidad bloque a bloque: `openspec/specs/zoho-sync/spec.md` 1.820 → 1.941
(RQ-ZS-28 desde `openspec/specs/zoho-sync/spec.md:1822`, 64 líneas; RQ-ZS-29 desde `:1887`, 55 líneas). Se conserva CRLF y ninguna
línea viva se mueve. La capacidad ya estaba en `capabilities`, así que R-2 no aplica. La rama no toca `openspec/config.yaml` ni
`docs/sdd/ENTRADA.md`.

La carpeta pasa a `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/`. Las cinco citas con línea que `verify-report.md`
hacía a `apply-progress.md` por la ruta vieja se reapuntan a la nueva (caso A: mismo contenido, mismas líneas). Las dos menciones sin
línea de la ruta vieja son históricas y se quedan (caso B): el barrido B.1 de `apply-progress.md` y la medida de `verify-report.md`.

Las cinco comprobaciones sobre el árbol archivado: typecheck 0; lint 0 (165 contra 165); build 0 (`index-F1jDYjEU.js`, 427,51 kB, sin
cambio); `npm test` 0 (338 ficheros y 4 saltados, 5.836 pruebas y 26 saltadas, 412 s, con 14.245 MB libres, una sola pasada); detector de
citas 0 sobre el commit. Medida del intento contra `f78e39fe`: +1.459 −1.206 = 2.665 sin renombrado (con renombrado, +264 −11), 0 sin trackear, con un techo de 3.500, que es dos veces la carpeta más 800.

## 4. Verificación y mutaciones

`verify-report.md` (sobre `e4121565`) da **PASS WITH WARNINGS**: 0 CRITICAL, 1 WARNING y 6 SUGGESTION. Los 19 escenarios tienen una
prueba que los fija, y de las 42 mutaciones reproducidas ninguna salió verde. El orquestador reprodujo, por su cuenta, una en cada lote
(M8, 6 rojas; M2a, 2; M4, 4) y en el verify M2c (2 rojas), y restauró cada vez con `git diff` vacío. W-1, que la evidencia TDD vaya por
lote y no en una tabla por tarea, no pide código. S-1 a S-6 quedan como sugerencias y ninguna cambia la conducta pedida.

Mutaciones de `design.md` D11, todas en rojo:
- **Quitar o invertir cada guarda (M1-M10):** la clase sobre lo guardado y visible, el filtro `app-`, el interruptor, la ruta, el
  reintento y el corte del `429`, el `404` y la papelera, el detalle fresco en `syncTicket` y las dos frases de `DEPLOY.md` §21.
- **Mover las cuatro guardas cuyo orden importa:**
  - P1: el interruptor después de validar.
  - P2: el `429` después de `!res.ok`.
  - P3: `inicio` después de leer.
  - P4: `enMarcha` tras el primer `await`.

## 5. Reglas del encargo

- **`strict_tdd`:** el rojo se midió antes del verde en los tres lotes. Está en los apartados «Rojo medido» de
  `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:23`, `:162` y `:299`.
- **Regla 13:** nada bajo `apps/desk/src`. La casilla está escrita en
  `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:78` y `:375`.
- **Interruptor:** nace cerrado y tiene sus dos frases en `DEPLOY.md`. La línea de `.env.example` la añade Alfonso (P-1).
- **Ficheros de Supervisión:** la rama no toca ninguno de los seis.
- **Regla de mutación 4:**
  - Se barrió en cada lote, en `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:83`, `:225` y `:390`.
  - Al archivar no se mueve ninguna línea citada: la fusión va al final y `registro.test.ts` se edita en sitio.

## 6. Supuestos

S-1 a S-15 están en `proposal.md` y S-16 a S-32 en `apply-progress.md` (apartados «Supuestos nuevos»). Los de más peso:
- **S-6:** «no está en Zoho» es un `404`, o `isDeleted`/`isTrashed` a true. Que Zoho responda `404` a un borrado es hipótesis.
- **S-14:** «los 986 tickets» se lee como «todos los tickets de Zoho».
- **S-22:** el ticket donde se corta no cuenta como recorrido.
- **S-25:** `vistos429` cuenta todos los `429`.
- **S-28:** sólo el literal «0» de `limite` cuenta sin lanzar.
- **S-29:** las formas de las respuestas.
- **S-30:** un parámetro repetido da `400`.
- **S-32:** `debt.md` dice CERRADO aunque la ejecución en producción sea P-2.

Ninguno cambia el alcance de la fila, cuesta dinero, toca datos de producción o contradice una decisión registrada.

## 7. Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` la línea `RELLENO_CONVERSACIONES_HABILITADO=` | Alfonso | este informe y `DEPLOY.md:899` |
| P-2 | Copia previa de `desk-db`, abrir el interruptor y redesplegar; `limite=0`, una pasada corta, la completa y `desde` si se corta | Alfonso | `DEPLOY.md` §21 |
| P-3 | Pasar el resumen al analista y llevar los descuadrados y los «no está en Zoho» a la bandeja | Alfonso / analista | bandeja (R-3), Supervisión |

## 8. Para la bandeja (R-3)

- **«unos 986»:** el maestro dice «unos 986 desde 2021»
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3450`). Es el número más alto del 03/09, no un total:
  Zoho cuenta 782 tickets. La corrección es de Supervisión.
- **El `404` de un ticket borrado:** que Zoho responda así es hipótesis (S-6). Lo confirmará la primera pasada real.
- **Cuota de la API de Zoho (E-254):** sigue sin medirse. **Hipótesis:** unas 1.600 peticiones para la pasada completa.
- **H-4 (`managed_by_app`):** la pasada periódica y la lectura al abrir siguen igual. Esta pasada sólo lo cubre en su recorrido.
- **S-1 del verify:** `limite=00` pasa la validación pero no es el literal «0», así que con el interruptor abierto lanza una pasada vacía.
