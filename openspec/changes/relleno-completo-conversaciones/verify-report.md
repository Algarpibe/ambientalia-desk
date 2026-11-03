# Informe de verificación — `relleno-completo-conversaciones` (1G-01, `cierra: si`)

evidence_revision: sha256:6913b71c22d294f91e77e6397179fb70e8b1a66b332ac5d4e3ed928a9d63b970

- Receta de `evidence_revision`: `printf '%s' "$(git rev-parse HEAD):$(git rev-parse HEAD^{tree})" | sha256sum`, sobre HEAD `e41215650aa8eb2d421332d885461f5f488a5534` y árbol `6b16f825bbe67b2b8a6ab5cb0a3b8813b4d49111`.
- Cambio: `relleno-completo-conversaciones`. Rama `relleno-completo-conversaciones`, partida `a729a371`, planificación `5ce2f54b`. Fecha: 2026-11-02.
- Modo: `strict_tdd` activo, verificación independiente. `apply-progress.md` se usó como mapa, nunca como prueba: todo lo de abajo se reprodujo.
- Tareas: L1.1-L1.11, L2.1-L2.11, L3.1-L3.15 y B.1 marcadas, y coinciden con el código (comprobado: `git diff --numstat a729a371` da 3/3 en `packages/zoho-sync/src/sync.ts`, 2/2 en `packages/zoho-sync/src/config.ts`, 4/4 en `apps/desk/server/app.ts`, 2/2 en `apps/desk/server/testing/appHarness.ts`, 2/2 en `apps/desk/server/deployConversaciones.test.ts`, 4/4 en `debt.md`, 32/0 en `DEPLOY.md`). V.1-V.3 siguen sin marcar: las marca el orquestador.

## Veredicto: PASS WITH WARNINGS

0 CRITICAL · 1 WARNING · 6 SUGGESTION. Los 19 escenarios tienen prueba que los fija. Se reprodujeron 42 mutaciones (las de `design.md` D11 en sus variantes, más `Pr`, `Mx1` y 19 propias): **ninguna salió verde**. Las cinco comprobaciones salen en 0.

## V.3 · Las cinco comprobaciones sobre HEAD, en serie

| Comprobación | Salida | Resultado |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm run lint -- --max-warnings 165` | 0 | **165 avisos**, 0 errores (umbral 165, delta 0) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | sin bloqueo: 7.948 comprobadas, 0 cabeceras R-1 inválidas, línea base 0 informadas; 14 abreviadas rotas informativas, ninguna de este cambio (están en `CLAUDE.md`, `docs/` y `openspec/changes/F0-04/proposal.md`, anteriores a `a729a371`) |
| `npm run build` | 0 | bundle `index-F1jDYjEU.js` 427,51 kB: no cambia, como se esperaba (cambio sólo de servidor) |
| `npm test` (una sola pasada) | 0 | **338 ficheros pasan + 4 omitidos (342); 5.836 pruebas pasan + 26 omitidas (5.862)**; 493,63 s; sin `Timeout calling "onTaskUpdate"`; no hizo falta repetir |

- Cifras del orquestador sobre `9a439c10` (338 + 4 ficheros, 5.836 + 26 pruebas): **coinciden exactamente**.
- Compuerta de memoria antes de `npm test`: `Memoria física disponible: 14,623 MB` (≥ 12.000). Pasada sola, con `timeout 600` y su salida íntegra a un log del scratchpad (`vf-npmtest-1.log`).
- Cobertura: `@vitest/coverage-v8` está instalado pero **no se ejecutó** (informativa, no bloquea; las 42 mutaciones dicen más de los ficheros cambiados que un porcentaje).

## V.1 · Escenarios contra pruebas (19/19)

| # | Escenario | Prueba (fichero:línea y nombre) | ¿Casa? |
|---|---|---|---|
| 1 | RQ-ZS-28 orden, filtro `app-`, archivados | `apps/desk/server/rellenoConversaciones.test.ts:97` «orden ascendente por number, archivados incluidos, sin el id app- ni la lista /tickets» (30/10/20, el 20 con `isArchived`, `app-uno`) | Sí |
| 2 | `desde` y `limite` | `apps/desk/server/rellenoConversaciones.test.ts:118` «desde=3 y limite=2 sólo piden los detalles de 3 y 4» (cinco tickets) | Sí |
| 3 | un ticket que cuadra | `apps/desk/server/rellenoConversaciones.test.ts:194` «archivado tipo #300 (7 + 1, 8 conversaciones) … completo con 8 filas sin marca» | Sí |
| 4 | descuadrado | `apps/desk/server/rellenoConversaciones.test.ts:204` (recuentos 8, Zoho 7; número, esperado y guardadas en el estado) | Sí |
| 5 | falta un recuento | `apps/desk/server/rellenoConversaciones.test.ts:213` (sin `threadCount`; ni completo ni descuadrado) | Sí |
| 6 | lectura fallida | `apps/desk/server/rellenoConversaciones.test.ts:223` (página `500` del 2.º, la pasada sigue con el 3.º) + `:357` (el motivo queda como primer fallo) | Sí (en dos pruebas) |
| 7 | ya no está en Zoho | `apps/desk/server/rellenoConversaciones.test.ts:166` (`404`, `isTrashed` e `isDeleted`, booleano o texto, con `marcar` encendido y una fila previa: ni escribe, ni lee, ni marca) | Sí |
| 8 | `managed_by_app` por el detalle fresco | `apps/desk/server/rellenoConversaciones.test.ts:258` (`raw` con 2+1, detalle fresco 7+1, 8 conversaciones; la fila conserva «De la app») | Sí |
| 9 | verificación sobre lo guardado y visible, tras marcar | `apps/desk/server/rellenoConversaciones.test.ts:268` (apagado ⇒ descuadrado) y `:277` (encendido ⇒ marcada y completo) | Sí |
| 10 | el resumen no lleva datos de cliente | `apps/desk/server/rellenoConversaciones.test.ts:380` (asunto, apellido, correo y empresa del fixture; el contacto y la cuenta se piden de verdad) | Sí |
| 11 | RQ-ZS-29 un `429` se reintenta | `apps/desk/server/rellenoConversaciones.test.ts:306` (misma petición ×3, `vistos429` = 2) + `apps/desk/server/rellenoConversacionesPausas.test.ts:33` (a los 2.000 ms, no antes) | Sí |
| 12 | `429` agotado en una página corta | `apps/desk/server/rellenoConversaciones.test.ts:330` (3 tickets, el 2.º con la página 2 en `429` siempre; el 3.º sin pedir; `cortadoEn` = 2) | Sí |
| 13 | otro fallo no corta | `apps/desk/server/rellenoConversaciones.test.ts:347` (`500` y `200`, y motivo `Zoho /tickets/Z1 500`) | Sí |
| 14 | el interruptor sólo abre con `'true'` | `packages/zoho-sync/src/config.test.ts:142`, `:147` (`TRUE`, `True`, `1`, `yes`, vacío, con espacios) y `:154` (independiente de los otros dos) | Sí |
| 15 | cerrado, `403` antes de validar | `apps/desk/server/rellenoConversacionesRutas.test.ts:64` (`limite=abc`) y `:71` (`desde=abc&limite=5`); «no se llama a Zoho» sólo lo aserta `:53` | Sí (ver S-2) |
| 16 | sólo superadministrador | `apps/desk/server/rellenoConversacionesRutas.test.ts:33` (403 en POST y GET con el interruptor abierto) y `:26` (401) | Sí |
| 17 | `POST` en segundo plano, `GET` nunca lanza | `apps/desk/server/rellenoConversacionesRutas.test.ts:137` (GET sin pasada, sin Zoho) y `:149` (POST con `zohoFetch` colgada: responde y la pasada arranca) | Sí |
| 18 | `POST` con la pasada en marcha | `apps/desk/server/rellenoConversacionesRutas.test.ts:175` y `apps/desk/server/rellenoConversaciones.test.ts:366` | Sí |
| 19 | `limite=0` sólo cuenta | `apps/desk/server/rellenoConversacionesRutas.test.ts:108` (`it.each` interruptor cerrado y abierto: 5 y 1, cero peticiones, cero filas escritas) | Sí |

**MUST NOT:** (a) no escribir ni marcar en «no está en Zoho»: `apps/desk/server/rellenoConversaciones.test.ts:166` con `marcar` encendido; (b) resumen sin asunto, contacto, empresa ni contenido: `:380`, y el tipo `EstadoRelleno` (`apps/desk/server/rellenoConversaciones.ts:23-29`) sólo lleva números de ticket y recuentos; (c) el `GET` nunca lanza: `apps/desk/server/routes/rellenoConversaciones.ts:46-48` y la mutación M5 (5 rojas).

### Auditoría de calidad de las aserciones (paso 5f)

0 tautologías, 0 bucles fantasma (los `for` recorren listas constantes no vacías; `f.every` sigue a `toHaveLength(8)`), 0 pruebas de humo, 0 `vi.mock` (los fixtures usan pg-mem y `createSync` reales). Los `toEqual([])` tienen compañera no vacía (`apps/desk/server/rellenoConversaciones.test.ts:177` frente a `:189`; `:274` frente a `:282`). Cada escenario con varias ramas tiene varias pruebas con valores esperados distintos. **Aserciones: 0 CRITICAL, 0 WARNING.**

### Cumplimiento de TDD (paso 5a)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia de TDD reportada | ⚠️ | `apply-progress.md` no lleva una tabla titulada «TDD Cycle Evidence»; lleva «Rojo medido» por lote con fichero › prueba › aserción (L1 `:23`, L2 `:162`, L3 `:299`). Ver W-1 |
| Todas las tareas tienen pruebas | ✅ | 7 ficheros de pruebas nuevos o ampliados y 1 en sitio, todos existen en HEAD |
| ROJO confirmado | ✅ | los ficheros existen; las rojas de L3 son el `404` del comodín, no fallos de importación |
| VERDE confirmado | ✅ | `npm test` 5.836 verdes; cada mutación restaurada deja las pruebas en verde |
| Triangulación | ✅ | 19 escenarios; +60 pruebas y +5 ficheros sobre el M0 de L1 (5.776 / 333, cifras de `openspec/changes/relleno-completo-conversaciones/apply-progress.md:10`) |
| Red de seguridad de ficheros modificados | ✅ | los 6 modificados lo fueron en sitio con inserciones = borrados (arriba) |

Capas: unitarias y de integración ligera sobre pg-mem y `supertest` (`appHarness`), con vitest; sin E2E ni de interfaz (decisión de Gerencia F0-00; no hay nada bajo `apps/desk/src`).

## V.2 · Mutaciones

Método: `perl -i -pe '… if $. == N'` (nunca `sed -i`), prueba focal del grupo afectado, restauración y comprobación de `sha256sum`, `file` y `git diff --stat` vacío. Líneas del árbol de HEAD.

| Id | Fichero:línea | Mutación | Rojas | Restauración |
|---|---|---|---|---|
| M1 | `apps/desk/server/rellenoConversaciones.ts:103` | `esperado` desde `tickets.raw` | 1 (`apps/desk/server/rellenoConversaciones.test.ts:258`) | sha `1b8adfccc8b5` igual (ver nota) |
| M2a | `apps/desk/server/rellenoConversaciones.ts:108` | contar lo recibido, no `visibles()` | 2 (`:268`, `:293`) | igual |
| M2b | `apps/desk/server/rellenoConversaciones.ts:76` | `source='zoho'` → `1=1` | 1 (`:285`) | igual |
| M2c (propia) | `apps/desk/server/rellenoConversaciones.ts:76` | quitar `ausente_en_zoho_at IS NULL` | 2 (`:277`, `:293`) | igual |
| M3 | `apps/desk/server/rellenoConversaciones.ts:61` | quitar el filtro `app-` | 7 (`:97`, `:146`, `apps/desk/server/rellenoConversacionesRutas.test.ts:108`×2, `:123`, `:149`…) | igual |
| M4 | `packages/zoho-sync/src/config.ts:125` | `=== 'true'` → `!== 'false'` | 4 (`packages/zoho-sync/src/config.test.ts:142`, `:147`, `:154` y `apps/desk/server/deployRellenoConversaciones.test.ts`) | `e326941b60cd` igual, CRLF |
| M5 | `apps/desk/server/routes/rellenoConversaciones.ts:47` | el `GET` llama a `lanzar` | 5 | `86b1222c023d` igual |
| M6a | `apps/desk/server/rellenoConversaciones.ts:92` | no cortar con 429 agotado del detalle | 2 (`:317`, `:399`) | igual |
| M6b | `apps/desk/server/rellenoConversaciones.ts:105` | no cortar con 429 agotado de página | 1 (`:330`) | igual |
| M7 | `apps/desk/server/rellenoConversaciones.ts:104` | `marcar: true` fijo en el módulo | 1 (`:268`) | igual |
| M7app | `apps/desk/server/app.ts:50` | `marcar: true` fijo en `app.ts` | 1 (`apps/desk/server/opcionesConversaciones.test.ts:38`) | `23c7126b5bd1` igual, CRLF |
| M8 | `packages/zoho-sync/src/sync.ts:179` | sin la rama de `detalle` | 9 (`packages/zoho-sync/src/sync.syncTicketDetalle.test.ts:22`, `:42` y 7 del recorrido) | `793c412adbad` igual, CRLF |
| M9a | `apps/desk/server/rellenoConversaciones.ts:96` | el `404` sin rama propia | 1 (`:166`) | igual |
| M9b | `apps/desk/server/rellenoConversaciones.ts:99` | ignorar `isDeleted` e `isTrashed` | 1 (`:166`) | igual |
| M9c | `apps/desk/server/rellenoConversaciones.ts:99` | sólo se quita `isTrashed` | 1 (`:166`) | igual |
| M10a | `DEPLOY.md:884` | quitar «Qué enciende» de la §21 | 1 (`apps/desk/server/deployRellenoConversaciones.test.ts`) | `a87d49213fae` igual, CRLF |
| M10b | `DEPLOY.md:872` | «Copia previa de» → «Copia de» en la §20 | 1 (`apps/desk/server/deployConversaciones.test.ts`) | igual |
| P1 | `apps/desk/server/routes/rellenoConversaciones.ts:36` y `:38` | el interruptor después de validar | 3 (`apps/desk/server/rellenoConversacionesRutas.test.ts:53`, `:64`, `:71`) | `86b1222c023d` igual |
| P2 | `apps/desk/server/rellenoConversaciones.ts:90` | variante `res.status === 429 && res.ok` (el 429 nunca se atiende) | 4 (`:306`, `:317`, `:399`, `apps/desk/server/rellenoConversacionesPausas.test.ts:33`) | igual |
| P3 | `apps/desk/server/rellenoConversaciones.ts:104` | `inicio` se toma después de leer | 1 (`:293`) | igual |
| P4 | `apps/desk/server/rellenoConversaciones.ts:143` y `:120` | `enMarcha` puesto tras el primer `await` | 2 (`:366`, `apps/desk/server/rellenoConversacionesRutas.test.ts:149`) | igual |
| Pr | `apps/desk/server/routes/rellenoConversaciones.ts:36` | interruptor antes de `requireSuperAdmin` | 1 (`apps/desk/server/rellenoConversacionesRutas.test.ts:44`) | igual |
| Mx1 | `apps/desk/server/routes/rellenoConversaciones.ts:17` | `limite=0` deja de ser libre | 2 (`:108`, `:123`) | igual |

Mutaciones propias, que nadie había probado (todas rojas, todas restauradas con sha igual):

| Id | Fichero:línea | Mutación | Rojas |
|---|---|---|---|
| X-GET403 | `apps/desk/server/routes/rellenoConversaciones.ts:46` | el interruptor también gobierna el `GET` | 2 (`apps/desk/server/rellenoConversacionesRutas.test.ts:78`, `:108`) |
| X-regex | `apps/desk/server/routes/rellenoConversaciones.ts:26` | `/^\d+$/` → `/^\d*$/` | 1 (`apps/desk/server/rellenoConversacionesRutas.test.ts:87`, el `limite=` vacío) |
| X-enMarcha | `apps/desk/server/rellenoConversaciones.ts:142` | quitar el rechazo del segundo `lanzar` | 1 (`:366`) |
| X-orden57 | `apps/desk/server/rellenoConversaciones.ts:57` | quitar `ORDER BY number` | 1 (`:97`) |
| X-desde | `apps/desk/server/rellenoConversaciones.ts:60` | `>= desde` → `> desde` | 2 (`:118`, `:146`) |
| X-limite | `apps/desk/server/rellenoConversaciones.ts:122` | quitar `slice(0, limite)` | 4 (`:118`, `:127`, `:137`, `apps/desk/server/rellenoConversacionesPausas.test.ts:33`) |
| X-motivo | `apps/desk/server/rellenoConversaciones.ts:72` | `??=` → `=` (el último fallo, no el primero) | 1 (`:347`) |
| X-clases (orden de D3) | `apps/desk/server/rellenoConversaciones.ts:105` y `:106` | `lista.error` antes de `lista.por429` | 1 (`:330`) |
| X-sinrec | `apps/desk/server/rellenoConversaciones.ts:107` | desactivar la clase «sin recuento» | 1 (`:213`) |
| X-pausa429 | `apps/desk/server/rellenoConversaciones.ts:91` | quitar la pausa del reintento | 1 (`apps/desk/server/rellenoConversacionesPausas.test.ts:33`) |
| X-pausaTk | `apps/desk/server/rellenoConversaciones.ts:125` | quitar la pausa entre tickets | 1 (`apps/desk/server/rellenoConversacionesPausas.test.ts:54`) |
| X-vistos | `apps/desk/server/rellenoConversaciones.ts:68` | no contar `vistos429` | 3 (`:306`, `:317`, `:330`) |
| X-igual | `apps/desk/server/rellenoConversaciones.ts:109` | `===` → `>=` | 2 (`:268`, `:293`) |
| X-app57 | `apps/desk/server/app.ts:57` | `habilitado: true` fijo | 4 (`apps/desk/server/opcionesConversaciones.test.ts:45` y 3 de `apps/desk/server/rellenoConversacionesRutas.test.ts`) |
| X-harness | `apps/desk/server/testing/appHarness.ts:49` | el arnés nace con el interruptor abierto | 3 (`apps/desk/server/rellenoConversacionesRutas.test.ts:53`, `:64`, `:71`) |
| X-s21rompe | `DEPLOY.md:890` | quitar «Qué se rompe si se pone mal» | 1 |
| X-s21env | `DEPLOY.md:899` | `RELLENO_CONVERSACIONES_HABILITADO=true` en la línea de entorno | 1 |
| X-s21copia | `DEPLOY.md:904` | quitar «Copia previa de» de la §21 | 1 |
| X-s21desde | `DEPLOY.md:911` | `desde=` → `hasta=` | 1 |

**Nota sobre mi propio método (sin consecuencias en el árbol).** (1) La primera mutación (M1) restauró con `git checkout`, que con `core.autocrlf=true` convirtió a CRLF un fichero que en el árbol de trabajo es LF (los ficheros nuevos de esta tanda son LF); lo devolví a LF y `sha256sum` volvió a `1b8adfccc8b5`, el mismo que registra `apply-progress.md`. Desde ahí restauré copiando una copia previa. (2) Lancé por error dos tandas a la vez sobre el mismo árbol; descarté todo lo medido durante el solape y repetí cada mutación afectada en una sola tanda en serie. (3) Un primer intento de X-regex no aplicó la sustitución (`diff` vacío, 21/21 verdes): era una no-mutación; repetida con otro patrón, es la fila de la tabla. **Estado final:** `git diff --stat` vacío; los dos ficheros nuevos que mutaron tienen los mismos sha que `apply-progress.md` (`1b8adfccc8b5` y `86b1222c023d`) y que los blobs de HEAD. `git status` puede seguir listando esos dos ficheros como `M` por la caché de metadatos de git (LF en disco con `autocrlf`), sin diferencia de contenido.

## Diseño y reglas

- **En sitio:** `git diff --numstat a729a371` da inserciones = borrados en `packages/zoho-sync/src/sync.ts` (3/3), `packages/zoho-sync/src/config.ts` (2/2), `apps/desk/server/app.ts` (4/4), `apps/desk/server/testing/appHarness.ts` (2/2), `apps/desk/server/deployConversaciones.test.ts` (2/2) y `debt.md` (4/4). Sólo al final: `DEPLOY.md` 32/0, `packages/zoho-sync/src/config.test.ts` 21/0, `apps/desk/server/opcionesConversaciones.test.ts` 21/0. Cumple D12.
- **Regla 13:** `git diff --name-only a729a371 HEAD` no toca nada bajo `apps/desk/src`; el rol (`apps/desk/server/routes/rellenoConversaciones.ts:36`, `:46`) y el interruptor (`:15-23`) los impone el servidor, con prueba (P1, Pr, M5, X-GET403).
- **Supervisión:** 0 ficheros de `CLAUDE.md`, `docs/sdd/ENTRADA.md`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`, `openspec/config.yaml` ni `.env*` en el diff. `.env.example` sin tocar (P-1).
- **Interruptor:** nace cerrado, `packages/zoho-sync/src/config.ts:125` (`rellenoConversacionesHabilitado: env.RELLENO_CONVERSACIONES_HABILITADO === 'true'`; M4: 4 rojas); `DEPLOY.md:882-911` §21 lleva «Qué enciende» (`:884`), «Qué se rompe si se pone mal» (`:890`), «Nace cerrado» (`:895`) y la línea `> RELLENO_CONVERSACIONES_HABILITADO=` vacía (`:899`).
- **Escalón B antes que C:** el `403` del interruptor va antes de validar (`apps/desk/server/routes/rellenoConversaciones.ts:36` frente a `:38`), fijado por P1 (3 rojas), Pr y X-GET403.
- **Medida:** `git diff --numstat --no-renames a729a371 HEAD` sin `openspec/`: 1.074 inserciones y 17 borrados (producción y pruebas, repartidas en tres lotes con cierre propio); `openspec/changes/relleno-completo-conversaciones/` suma 1.041 líneas antes de este informe.

## B.1 · Barrido de la regla de mutación 4

`grep -rnoE` sobre todo el repositorio (sin `node_modules`, `.git`, `dist`, `_to_delete`) a las líneas sustituidas y a `rellenoConversaciones.ts:N`:

- **Vivas, leídas contra lo que afirman:** `DEPLOY.md:784`, `:794`, `:819`, `:826`, `:845`, `:863` y `:895` citan `packages/zoho-sync/src/config.ts:125` para «nace cerrado `=== 'true'`»: esa línea sigue siendo la de los interruptores (el nuevo entra en la misma línea). `openspec/specs/zoho-sync/spec.md:665` cita `apps/desk/server/testing/appHarness.ts:46` y `:49` como andamiaje: siguen siendo el tipo y el literal de `config` del arnés. `DEPLOY.md:691` y `openspec/specs/zoho-sync/spec.md:1462` citan `apps/desk/server/app.ts:90-92` (el manejador `500`): no se movió. `apps/desk/server/rellenoConversaciones.ts:13` cita `packages/zoho-sync/src/sync.ts:178-179` (`syncTicket(id, detalle)`): cierta. `debt.md:614` cita `apps/desk/server/backfill.ts:40`: es el `429` → `sleep(2000)` de la lista, cierta.
- **Archivadas y fechadas** (`openspec/changes/archive/`, `docs/sdd/Paquete_de_Despliegue_*`): unas 120 apariciones de las líneas 22 y 90-92 de `app.ts`, 66 y 125 de `config.ts`, 46 de `appHarness.ts` y 179 de `sync.ts`… Como todo se editó **en sitio** y cada línea conserva su papel (importaciones, tipo `AppConfig`, bloque de interruptores, literal de `config` del arnés, petición de detalle), son registros fechados (caso B); **no las releí una a una** (limitación declarada), y ninguna cita viva las usa para afirmar el contenido anterior.
- **Abreviadas:** el detector no las bloquea; el informe del hook no lista ninguna atribuida a un fichero de este cambio.
- **Artefactos del cambio, presente:** las citas de `openspec/changes/relleno-completo-conversaciones/apply-progress.md:206-218`, `:352` y `:384-385` a `apps/desk/server/rellenoConversaciones.ts` y a `apps/desk/server/routes/rellenoConversaciones.ts` (`:17`, `:36`, `:38`, `:39`, `:46`, `:47`), a `DEPLOY.md:872`/`:884`, y las de `design.md` a `packages/zoho-sync/src/sync.ts:112-123`, `:180-181`, `:216-217`, `:222-224`, `:228`, `:238`, `:316`, a `DEPLOY.md:880` (fin de la §20) y `DEPLOY.md:860-861` (`proposal.md:151`) son ciertas en HEAD. Las de la tabla de L1 (`openspec/changes/relleno-completo-conversaciones/apply-progress.md:69-74`) llevan su revisión `en 6bd57424`. Ninguna cita del presente que fuera cierta de `a729a371` ha dejado de serlo: **no hay WARNING de citas.**

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · `apply-progress.md` no usa el formato «TDD Cycle Evidence».** La evidencia de ROJO existe y es sustancial (por lote, fichero › prueba › aserción medida: `openspec/changes/relleno-completo-conversaciones/apply-progress.md:299-343`), pero no hay una tabla RED/GREEN/TRIANGULATE/SAFETY NET por tarea. El ROJO ya no se puede reproducir; el VERDE y la triangulación sí se comprobaron (`npm test` y 42 mutaciones). No bloquea el archivo; en el siguiente cambio, añadir la tabla por tarea.

### SUGGESTION
- **S-1 · `limite=00` (ceros a la izquierda).** `apps/desk/server/routes/rellenoConversaciones.ts:26` acepta `^\d+$` y `:39` compara con el literal `'0'`: con el interruptor abierto, `limite=00` lanza una pasada vacía que reinicia el estado y borra el resumen anterior; cerrado, da `403`. `openspec/changes/relleno-completo-conversaciones/apply-progress.md:417` ya lo declara como supuesto. Sin prueba; riesgo bajo.
- **S-2 · El escenario 15 no aserta «no se llama a Zoho» con `limite=abc`.** Sólo `apps/desk/server/rellenoConversacionesRutas.test.ts:53` lo comprueba (sin parámetros). Añadir `expect(zohoFetch).not.toHaveBeenCalled()` en `:64` y `:71`.
- **S-3 · P2 y P3 se reprodujeron en variante, no en la forma literal** de `design.md` D11 (P2: guarda del `429` después de `!res.ok`; P3: `inicio` movido tras la lectura). Las variantes ponen rojas las pruebas que D11 nombra (4 y 1); la reordenación literal de P2 exige mover un bloque de varias líneas y no se hizo.
- **S-4 · Reloj real en `apps/desk/server/rellenoConversaciones.test.ts:297`:** `await new Promise((r) => setTimeout(r, 25))` separa `created_at` de `inicio`. Pasó en todas las tandas, pero es sensible a un reloj lento; un `created_at` explícito lo haría determinista.
- **S-5 · `motivoPrimerFallo` puede traer texto de un error de Postgres** (`apps/desk/server/rellenoConversaciones.ts:72`, `:113`). `design.md` D6 lo declara hipótesis; ninguna prueba la fija más allá de los errores de Zoho de `apps/desk/server/rellenoConversaciones.test.ts:347`.
- **S-6 · Pendientes de archivo, no de este cambio:** `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` cambian en el archive (S-15, tarea A.4); fusión de RQ-ZS-28 y RQ-ZS-29 al final de `openspec/specs/zoho-sync/spec.md` (A.2).

## Resumen

PASS WITH WARNINGS · 0 CRITICAL · 1 WARNING · 6 SUGGESTION. Siguiente: `sdd-archive` (las tareas de persona van aparte, regla del ciclo 1; archivar no las da por hechas).
