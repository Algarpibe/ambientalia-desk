# Informe de verify: rotulado-tras-enviar (F1B-04, `cierra: no`)

Verificador independiente. Rama `rotulado-tras-enviar`, HEAD `17ec156`, partida del cambio `a947b48`. No se confió en `openspec/changes/rotulado-tras-enviar/apply-progress.md`: todo lo de abajo se leyó en el código o se ejecutó.

## Veredicto: PASS con avisos — 0 CRITICAL · 3 WARNING · 3 SUGGESTION

Los escenarios con prueba pasan en verde y las doce mutaciones propias pusieron roja la prueba esperada. Los avisos son un hueco de cobertura declarado (AV22-l), `DEPLOY.md` sin documentar las columnas y un dato de n8n de segunda mano. Ninguno bloquea el archivo.

## Códigos de salida (corridos por mí, mirando cada código)

| Orden | Código | Resultado |
|---|---|---|
| `npm test` | 0 | 271 ficheros pasan, 3 omitidos (274) · 4545 pruebas pasan, 11 omitidas (4556) |
| `npm run typecheck` | 0 | sin errores |
| `npx eslint . --max-warnings 165` | 0 | 165 avisos, 0 errores (en el tope exacto) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | 7370 comprobadas, 0 bloqueantes, 0 cabeceras R-1 inválidas, línea base 0; 16 abreviadas rotas (informativas) |
| `npm run build` | 0 | `index-DFb6M5Q9.js`, 412,90 kB (gzip 118,88 kB) |

De las 16 abreviadas rotas, 13 son de otros ficheros y ya estaban; 3 son de `openspec/changes/rotulado-tras-enviar/apply-progress.md` (S1).

## Escenarios → pruebas (todas verdes en `npm test`)

| Escenario | Prueba | ¿Afirma lo que dice? |
|---|---|---|
| R40-a, b, c | `apps/desk/server/rotulado.test.ts:109`, `:125`, `:135` | Sí. R40-a manda persona y hora falsas y exige las del servidor, en `ok` y `ok_con_avisos`; R40-c incluye dos simultáneas (`[200, 409]`) |
| R40-d1 a d6 | `apps/desk/server/rotulado.test.ts:156`, `:163`, `:169`, `:176`, `:183`, `:190` | Sí. Cada una activa las dos guardas del par y afirma código y texto; d6 además comprueba que la traza no cambia |
| R40-e | `apps/desk/server/rotulado.test.ts:202` | Sí, pero nace verde (no hay producto que lo ponga rojo): es no-regresión del callback. Ver punto 2 |
| R40-f | `apps/desk/server/rotulado.test.ts:213` | Sí |
| R41-a | `packages/shared/src/rotulado.test.ts:11` (siete casos) | Sí, una por fila de la tabla |
| R41-b, R41-c | `apps/desk/server/rotulado.test.ts:227`, `:249` (ocho filas) | Sí: enfrenta la marca del servidor con la acción real |
| R41 MANUAL | no automático | De persona (los `.tsx` están fuera de la red); la lógica está cubierta por `apps/desk/src/lib/rotuladoVista.test.ts:15` a `:57` |
| R42-a, b, d | `apps/desk/server/rotulado.test.ts:42`, `:54`, `:68` | Sí |
| R42-c | `packages/zoho-sync/src/db/novedadesSiembra.test.ts:165` y `packages/zoho-sync/src/db/migrate.test.ts:374` | Sí; el guardián muerde (mutación 11) |
| AV22-a a k, m, t | `apps/desk/server/services/avisoEtiquetaNoGenerada.test.ts:46` a `:196` y `packages/shared/src/rotulado.test.ts:40` a `:61` | Sí (a: ausente, `null`, vacío, espacios y sin `resultado`) |
| **AV22-l** | `apps/desk/server/services/avisoEtiquetaNoGenerada.test.ts:169` | **Parcial** (W2): afirma 200, resultado guardado, ningún aviso y `logger.error`; no afirma que la marca no quede |
| RQ-RE-23 (rotulado ignorado), RQ-RE-24 (alta sin rotulado, `true` sin traza, legado) | `apps/desk/server/recepcion.test.ts:86`, `:144`, `:189`; `packages/shared/src/recepcion.test.ts:79` | Sí; la aserción de `apps/desk/server/recepcion.test.ts:161` es vacua (S2) |
| RQ-RE-08, RQ-RE-26 (sin rotulado se envía; orden de fotos) | `apps/desk/server/recepcion.test.ts:370`, `:463`; `packages/shared/src/recepcion.test.ts:272` | Sí |
| RQ-RE-38 (traza de casillas con persona del alta) | `apps/desk/server/recepcion.test.ts:570` | Parcial: afirma persona e instante común, no la cota contra el reloj (S2) |
| RQ-RE-19 (formulario sin casilla) | `apps/desk/src/lib/recepcionForm.test.ts:66`, `:88` | Parcial por decisión de Gerencia: la parte `.tsx` es de persona |
| RQ-RE-05 (comentario de `ok_con_avisos`) | ninguna | Texto, no comportamiento; leído en el punto 10 |

## Mutaciones reproducidas por mí (todas restauradas con `git checkout`)

| # | Mutación | Prueba roja | Restaurada |
|---|---|---|---|
| 1 | Intercambio 404↔403 (`apps/desk/server/routes/remision.ts:409` y `:410`) | R40-d2 (única) | Sí |
| 2 | Intercambio 409 anulada↔422 legado (`:411` y `:412`) | R40-d4 (única) | Sí |
| 3 | Intercambio 422 sin envío↔409 ya confirmada (reordenado limpio, `ya` definido antes) | R40-d6 (única) | Sí |
| 4 | Quitar `rotulado_at IS NULL` del `UPDATE` de `confirmarRotulado` | R40-c (única) | Sí |
| 5 | `vistaRotulado` recalcula por estado en vez de leer `pendienteRotular` | RV-1 y las dos RV-4 | Sí |
| 6 | Quitar `enviado_por_id` del `UPDATE` de `reclamarEnvio` | R42-a y R42-b | Sí |
| 7 | `liberarEnvio` sin limpiar `enviado_por_id` | R42-d | Sí |
| 8 | `etiquetaNoGenerada` avisa también con `error` | AV22-c (pura y de servicio) | Sí |
| 9 | Quitar `AND aviso_sin_etiqueta_at IS NULL` | AV22-e (dos) y AV22-f | Sí |
| 10 | Quitar el `try`/`catch` (el `catch` relanza) | AV22-l (única) | Sí |
| 11 | Quitar `public.` de la `ALTER` de `aviso_sin_etiqueta_at` en `packages/zoho-sync/src/db/schema.sql` | Tres del guardián de `packages/zoho-sync/src/db/migrate.test.ts` (calificadas, clasificadas, recuento 66) | Sí |
| 12 | Decidir por el texto de la respuesta en vez de `dymoId` | AV22-b y AV22-d | Sí |

La primera versión del intercambio 3 (por números de línea) dejaba `ya` usada antes de definirse y ponía roja R40-c por ese motivo, no por la posición: la rehice limpia. `git status --short` quedó vacío tras cada restauración.

## Verificación por punto

1. **Escenarios.** Tabla de arriba; no falta ninguno.
2. **No bloquea (núcleo).** Barrido `rotulad` sobre `packages/shared/src` y `apps/desk/server` sin pruebas: las apariciones son comentarios, el predicado `pendienteDeRotular` y `puedeConfirmarRotulado` (`packages/shared/src/rotulado.ts:15`), el mapeo `toRemision` (`apps/desk/server/db/remisiones.ts:26`), `confirmarRotulado` (`apps/desk/server/db/remisiones.ts:247`) y la ruta propia (`apps/desk/server/routes/remision.ts:406`). Dentro de la ruta, `rem.rotuladoAt` (`:415`) sólo impide REPETIR la propia confirmación. Ninguna transición, alarma, vista del tablero, indicador ni guarda de envío lee `rotuladoAt` ni `pendienteRotular`; en el cliente sólo lo lee `apps/desk/src/lib/rotuladoVista.ts:20` para pintar. R40-e fija que el callback `ok` avanza el ticket sin confirmar; nace verde, y la ausencia de lectores la fija el barrido, no una prueba roja.
3. **Alta y envío, IV-12.** `git diff -U0 a947b48 -- packages/shared/src/recepcion.ts`: cinco hunks en sitio (`:65`, `:72`, `:101`, `:148`, `:155`), 206 líneas antes y después, mismos pasos en el mismo orden. Un `rotulado: true` con persona y hora falsas no escribe traza (`apps/desk/server/recepcion.test.ts:144`). La traza de casillas sale del usuario y la hora del alta (`apps/desk/server/db/remisiones.ts:50`, `apps/desk/server/recepcion.test.ts:570`).
4. **Acción de confirmar.** Orden en `apps/desk/server/routes/remision.ts:406` a `:418`: 401 (`requireAuth`) < 404 `:409` < 403 `:410` < 409 anulada `:411` < 422 legado `:412` < 422 sin envío `:413` < 409 ya confirmada `:415` y `:417`. Los textos coinciden con los del delta. Una sola vez por `UPDATE` condicional (`apps/desk/server/db/remisiones.ts:249`); persona (`req.user!.name`) y hora (`now()`) del servidor. Tres intercambios y el `AND` quitado: mutaciones 1 a 4.
5. **`pendienteRotular`.** Lo calcula el servidor (`apps/desk/server/db/remisiones.ts:26`); el cliente lo lee (`apps/desk/src/lib/rotuladoVista.ts:20`). Mutación 5.
6. **`enviado_por_id`.** Se escribe en el mismo `UPDATE` que gana la reclamación; `liberarEnvio` lo limpia. Mutaciones 6 y 7.
7. **Aviso.** `etiquetaNoGenerada` (`packages/shared/src/rotulado.ts:31`) avisa con `ok`/`ok_con_avisos` y `dymoId` no cadena o vacío tras `trim`; con `error` no. El servicio no lee `paso` para decidir: sólo lo copia al texto (`apps/desk/server/services/avisoEtiquetaNoGenerada.ts:31`). Una vez por remisión por la marca con `UPDATE` condicional (`apps/desk/server/services/avisoEtiquetaNoGenerada.ts:60`); destinatarios antes de la marca (`apps/desk/server/services/avisoEtiquetaNoGenerada.ts:56`); sin destinatarios no se marca; sólo bandeja. Mutaciones 8, 9, 10 y 12. Sobre AV22-l ver W2.
8. **Esquema.** `packages/zoho-sync/src/db/schema.sql:831` (`ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS enviado_por_id text;`) y `packages/zoho-sync/src/db/schema.sql:832` (`… aviso_sin_etiqueta_at timestamptz;`), al final del fichero (828 → 832 líneas), ambas calificadas. Mutación 11. No hay relleno: PS-12 inserta una fila sin las columnas y las lee `NULL`.
9. **Regla 13 / mutación 3.** Comprobé línea a línea la tabla del cliente de `apply-progress.md`: `apps/desk/server/db/remisiones.ts:26`, `apps/desk/server/routes/remision.ts:410` a `:418` y `packages/shared/src/recepcion.ts:65`, `:101`, `:155` dicen lo que la tabla afirma. Ninguna decisión del cliente queda sin línea del servidor. `git diff --stat a947b48 -- apps/desk/src`: sólo lo previsto (`ConfirmarRotulado.tsx`, `rotuladoVista.ts`, `client.ts`, `CrearRemision.tsx`, `PanelRemisiones.tsx`, `ResultadoRemision.tsx`, `recepcionForm.ts` y sus pruebas).
10. **Comentarios de `ok_con_avisos`.** `packages/shared/src/types.ts:701` y `apps/desk/server/db/remisiones.ts:130` lo atribuyen («según leyó el analista en el flujo el 2026-10-12»). `apps/desk/src/components/ResultadoRemision.tsx:152` dice «falló un paso que no lo invalida»: neutro, no afirma que sea la etiqueta. Correcto.
11. **Lo que no debía tocarse.** `git diff --stat a947b48 -- openspec/specs CLAUDE.md openspec/config.yaml docs/sdd/ENTRADA.md docs/sdd/TRASPASO_2026-10-08.md` sale vacío. n8n no se tocó ni puede tocarse desde el repositorio (vive en el servidor de n8n).
12. **Códigos y build.** Tabla de arriba.
13. **Mutación 4.** `wc -l` antes → después: `packages/shared/src/recepcion.ts` 206 → 206, `packages/shared/src/types.ts` 810 → 810, `apps/desk/server/routes/remision.ts` 397 → 420 (hunk al final; ninguna cita a las líneas 397 a 420 de ese fichero), `apps/desk/server/db/remisiones.ts` 240 → 253 (al final), `packages/zoho-sync/src/db/schema.sql` 828 → 832 (al final), `packages/zoho-sync/src/db/migrate.test.ts` 911 → 911, `apps/desk/src/components/CrearRemision.tsx` 396. El resto son hunks en sitio. Barrí las citas completas con `git grep` sobre `a947b48` (sin excluir el archivo) contra las líneas tocadas; ver «Citas que afirman algo falso».
14. **`DEPLOY.md`.** No documenta las columnas nuevas ni qué comprobar al desplegar (W1).
15. **R-1.** La cabecera de `openspec/changes/rotulado-tras-enviar/proposal.md` tiene siete campos: `tanda: F1B-04`, `cierra: no`, `toca_maestro: si`, `origen_cabecera: declarada`. Existe `openspec/changes/rotulado-tras-enviar/correccion-maestro.md` (31 líneas). El detector no marca cabeceras inválidas.
16. **Tareas.** 39 de 39 marcadas (lotes 16 + 9 + 8 + 6). Las seis de personas están fuera del recuento y ninguna describe trabajo que una tanda pueda hacer en el repositorio.

## Hallazgos

- **W1 · WARNING · `DEPLOY.md` sin las dos columnas.** `DEPLOY.md:248` sólo cita seis columnas (`novedades`, `novedad_otro`, `rotulado_at`, `rotulado_por` y dos de fotos) y `DEPLOY.md:254` afirma que el `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`); ya no nombra `rotulado_at` ni `rotulado_por`. Faltan `enviado_por_id` y `aviso_sin_etiqueta_at`: sin la primera el envío falla y sin la segunda cae el aviso, y la migración tolera la sentencia omitida. Lo corrige el orquestador en el archivo.
- **W2 · WARNING · AV22-l: atomicidad marca + avisos sin prueba con PostgreSQL real.** Confirmado: pg-mem no revierte un `ROLLBACK` (`apps/desk/server/db/transaccion.test.ts:25`), y los tres ficheros de integración (`apps/desk/server/db/migracionConcurrente.integration.test.ts`, `packages/zoho-sync/src/db/liberacion.integration.test.ts`, `packages/zoho-sync/src/db/migrate.integration.test.ts`) no tocan el aviso y se omiten sin base. La garantía «si falla un aviso no queda la marca» descansa en la estructura de `enTransaccion` (`apps/desk/server/services/avisoEtiquetaNoGenerada.ts:56` a `:61`), no en una fila comprobada. Riesgo si falla: remisión marcada sin avisos, que no se reintenta. No bloquea; cubrirlo exige prueba de integración con base real.
- **W3 · WARNING · el disparador descansa en datos de segunda mano.** Que `dymoId` llegue vacío cuando la etiqueta falla lo leyó el analista en el nodo de n8n, sin ejecución real (`packages/shared/src/rotulado.ts:25`). Está declarado como hipótesis en código y propuesta, y contrastarlo es tarea de persona; mientras tanto son posibles falsos avisos o avisos que no salen.
- **S1 · SUGGESTION.** `openspec/changes/rotulado-tras-enviar/apply-progress.md:90` trae tres abreviadas rotas informativas (una se atribuye a `apps/desk/server/routes/remision.ts` cuando era de `packages/shared/src/types.ts`). Reescribirlas con ruta completa antes de archivar.
- **S2 · SUGGESTION.** `apps/desk/server/recepcion.test.ts:161` (`expect(despues).toBeGreaterThanOrEqual(antes)`) es vacua desde que el alta no escribe `rotulado_at`; nada fija ya que la hora de la traza de casillas esté entre `antes` y `despues` (sólo se fija el instante común, `apps/desk/server/recepcion.test.ts:570`).
- **S3 · SUGGESTION.** La prueba de `apps/desk/server/recepcion.test.ts:273` ya no fija una posición (el rotulado dejó de ser guarda); sigue verde y es inocua, pero conserva un contexto viejo.

## Citas que afirman algo falso

Barrido sobre `a947b48` (sin excluir `openspec/changes/archive`): 143 citas completas tocan líneas modificadas; casi todas siguen ciertas (la línea conserva su contenido). Las que dejan de serlo:

| Caso | Cita | Por qué | ¿La rama puede tocarla? |
|---|---|---|---|
| A | `DEPLOY.md:254` hacia `apps/desk/server/db/remisiones.ts:47` | el `INSERT` ya no nombra `rotulado_at` ni `rotulado_por` | Sí; la corrige el orquestador (W1) |
| C | `openspec/specs/remisiones/spec.md:170` (cita abreviada del comentario de `apps/desk/server/db/remisiones.ts`, líneas 129 a 131) | cita el comentario viejo («algún aviso (correo o Telegram)») | No (`openspec/specs`); la sustituye el delta de RQ-RE-05 al archivar |
| B | `docs/sdd/ENTRADA.md:1828` hacia `packages/shared/src/recepcion.ts:101` | describe el problema que E-167 cierra | No (`docs/sdd/ENTRADA.md`); la supervisión marca E-167 |
| B | `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:210`, `:335`, `:585`, `:602`; `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:255`, `:474`, `:511`, `:863`, `:919`; `docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:337`; `docs/sdd/Paquete_de_Despliegue_2026-10-09.md:493` | paquetes fechados (casilla de rotulado, `INSERT` con `rotulado_at`, guarda de `recepcion.ts` línea 101) | Sí, pero son históricos: se nombra la revisión, no se renumera |
| B | `openspec/changes/archive/2026-10-03-recepcion-rotulacion-foto-entrada/verify-report.md:89`, `:101`, `:136`, `:148`, `:158` y `design.md:193`, `:244`, `:246`, `:447`; `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/design.md:38`, `proposal.md:36` | afirman el estado anterior (guarda de rotulado, `rotulado?` en el cliente, firma de `recepcionForm.ts`) | Archivo: no se reescribe |

Ninguna de las cuatro rutas protegidas (`CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `docs/sdd/TRASPASO_2026-10-08.md`) tiene una cita caso A: las de `CLAUDE.md:349`, `openspec/config.yaml:1206` y `docs/sdd/ENTRADA.md:1838` hacia `apps/desk/server/recepcion.test.ts:245` a `:273` siguen ciertas (PA-1, PA-2 y el 409 fijan serial < novedades < pendiente). Ninguna línea existente cambió de número: no hay nada que renumerar.

## Qué falta para cerrar la fila F1B-04

Con E-167 construida, según `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211` y la propuesta, queda sólo el recuento de modelos sin accesorios contra producción y la decisión de Gerencia sobre si retiene la fila, más E-163 a E-166 sin contenido decidido ni talla: todo es tarea o decisión de persona (regla del ciclo 1), nada que una tanda pueda construir en el repositorio. `cierra: no` es coherente.

## Tareas de personas — archivar no las da por hechas

| Tarea | Dueño |
|---|---|
| Contrastar con una ejecución real de n8n qué llega en `dymoId` (W3) | Quien administra n8n |
| Verificar en la aplicación, tras desplegar, los puntos de D13 | Servicio Técnico |
| Pegar la corrección del maestro (`openspec/changes/rotulado-tras-enviar/correccion-maestro.md`) | Gerencia |
| Recuento de modelos sin accesorios y si retiene la fila F1B-04 | Gerencia · Servicio Técnico |
| Marcar E-167 cerrada y actualizar E-163 a E-166 en `docs/sdd/ENTRADA.md` | Sesión de supervisión |
| Corregir, si procede, S1 a S12 antes del 2026-10-19 | Gerencia |

Pendiente del orquestador (no es de personas): documentar las dos columnas en `DEPLOY.md` (W1) y reescribir las tres abreviadas de `apply-progress.md` (S1).
