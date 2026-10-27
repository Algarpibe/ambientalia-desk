# Tareas — `codigo-servicio-bloqueado` (`fuera-del-plan`, `cierra: no`)

`strict_tdd`: rojo primero. Cada prueba lleva el escenario de la delta que cubre (`specs/tickets-core/spec.md`, `specs/transitions-st/spec.md`).
Decisiones D1-D12 en `design.md`. Donde la delta y el diseño difieren, **gana la delta**: son CINCO pruebas de posición (PCS-1…PCS-5; el
diseño tenía cuatro) y un código de sólo espacios cuenta como CAMBIO (`403`); vacío = `undefined`/`null`/`''` (`apps/desk/server/transitionExec.ts:44`).
**Colocación (regla de mutación 4):** las ediciones a ficheros citados son en sitio, en la MISMA línea física; lo nuevo va en ficheros nuevos
o al final (`index.ts` línea 56). Se comprueba con `git diff --numstat <partida>` (inserciones = borrados en `ticketService.ts`,
`ticketCreate.ts`, `TransitionPanel.tsx`; `index.ts` `1 0`) y `wc -l`.
**Mutaciones:** `perl -i -pe '… if $. == N'`, nunca `sed -i`; antes de cada una, copia al scratchpad y `file` (CRLF); al restaurar, `sha256sum`
del `git diff` igual y `file` con CRLF. Las rojas (`fichero › prueba`, con la aserción que cae) van a `apply-progress.md`.
**Lotes:** un solo lote L1 (~480 líneas estimadas). Si la medida real (`git diff --shortstat --no-renames <partida>` + `wc -l` de lo nuevo sin
trackear) pasa de **720**, se parte en L1 (shared + su prueba: L1.1-L1.5) y L2 (servidor + cliente + prueba HTTP: L1.6-L1.12), cada uno con su cierre.
**Cierre `L1.c` (orquestador), en serie y en primer plano:** `npm test` con log entero en el scratchpad (si sale 1 SÓLO por «Timeout calling
onTaskUpdate» con todo verde, se repite y se guarda la pasada fallida como evidencia); `npm run typecheck`; `npm run lint -- --max-warnings 165`
con la cifra 165/165; commit; `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` — los cinco = 0 en una cadena; `npm run build`
y anotar el bundle nuevo (el anterior: `index-BFrlA0VZ.js`); medida y `settle`.

## Lote L1 · apply (intento 2)

Conjunto: `npx vitest run packages/shared/src/codigoServicio.test.ts apps/desk/server/codigoServicioBloqueado.test.ts`, más la suite entera en M0.

### Rojo primero (D9)

- [x] L1.1 **M0 previo:** suite entera en verde sin tocar nada; anotar el recuento de ficheros y pruebas en `apply-progress.md`.
- [x] L1.2 Crear `packages/shared/src/codigoServicio.test.ts` (rojo: el módulo no existe). Tabla del predicado: sin campo; previo `null`/`''`/espacios
  (escenario «código guardado sólo de espacios cuenta como no lo tiene»); pedido `undefined`/`null`/`''` (caracterización «código vacío no
  dispara la guarda»); mismo valor con espacios («mismo valor pasa»); distinto sin y con admin; sólo espacios con previo → `true` («sólo
  espacios es un cambio»); cargo de dirección no exime. Transiciones con el campo = exactamente `['ingreso_a_servicio','calibracion_directa']`
  (S-7); ninguna lleva `priority` y el código a la vez, ni `Código Servicio` junto a un campo de orden de venta (D5).
- [x] L1.3 En el mismo fichero, propuesta («el prefijo sale de clasificación y tipo», «serie y modelo en orden», «partes ausentes se omiten»,
  «día civil de Bogotá: ISO `…T03:00:00Z` → día anterior; `YYYY-MM-DD` directa», «sin `created_time` válido se omite») y `valoresConCodigoPrevio`
  («admin cambia: previo y nuevo», «primer código sin previo», «mismo valor sin previo», «clave inyectada se borra»).
- [x] L1.4 Crear `apps/desk/server/codigoServicioBloqueado.test.ts` con el arnés de `apps/desk/server/testing/appHarness.ts` (`instalarArnes`,
  `appWith({ controlCalidadLiberacion: true })`, `adminCookie`, `userCookie`; molde `apps/desk/server/calibracionDirecta.test.ts:25-38`).
  Rojo previo: hoy un técnico con código distinto recibe `200`.
  - **CB-1** técnico, código distinto, las dos transiciones → `403` con el mensaje, estado y columna intactos, 0 trazas.
  - **CB-2** mismo valor con espacios → `200`. **CB-3** ticket sin código → `200` y columna fijada. **CB-4** admin → `200`, columna nueva, traza con previo y nuevo.
  - **CB-5** clave `Código Servicio anterior` inyectada en un primer código → no llega a la traza («previo del servidor, no del cliente»).
  - **CB-6** `''` con código → `422` «Falta el campo obligatorio: Código Servicio». **CB-6b** sólo espacios con código → `403`.
  - **CB-7** `CLAVE_CODIGO_SERVICIO` es la `label` de `codigo_servicio` en `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:86`) y
    `etiquetaCampo(CLAVE_CODIGO_SERVICIO_ANTERIOR)` la deja igual. Cargo de dirección no exime; transición sin el campo no interviene; reenvío del prellenado pasa.
- [x] L1.5 En el mismo fichero, **posición** con dos guardas activas a la vez: **PCS-1** Comercial con código distinto → `403` de área; **PCS-2**
  técnico con código distinto y sin `Fecha Remisión Entrada` → `403` nuevo, no `422`; **PCS-3** `calibracion_directa` con tipo `Mantenimiento`
  y código distinto → `409` de la condición (1); **PCS-4** transición lanzada desde un estado que no es `Ingresado`, con código distinto →
  `409` de estado (NO está en el diseño: se añade aquí); **PCS-5** el atajo con el interruptor apagado y código distinto → `409` de interruptor.
  Confirmar que las diez-quince rojas caen por la razón correcta (módulo ausente o `200`), no por un error de arnés.

### Implementación (verde)

- [x] L1.6 (D1) Crear `packages/shared/src/codigoServicio.ts` (~50 líneas): `CLAVE_CODIGO_SERVICIO`, `CLAVE_CODIGO_SERVICIO_ANTERIOR`,
  `MENSAJE_CODIGO_BLOQUEADO` («El código de servicio de este ticket ya está fijado: sólo un administrador puede cambiarlo»),
  `puedeCambiarCodigoServicio`, `cambiaCodigoSinPermiso` (D2, con la definición de vacío de `transitionExec.ts:44`), `propuestaCodigoServicio`
  (D3), `valoresConCodigoPrevio` (D6, molde `packages/shared/src/gasPatron.ts:96-99`). Verde la prueba de L1.2-L1.3.
- [x] L1.7 (D1) `packages/shared/src/index.ts`: añadir `export * from './codigoServicio'` como **línea 56 nueva al final** (hoy acaba en `:55`).
- [x] L1.8 (D3) `packages/shared/src/ticketCreate.ts`, en sitio: `:7` `yymmdd(d: Date)` → `yymmdd(d: unknown)`; `:12` `fecha: Date` →
  `fecha: Date | string | null`. El alta sigue pasando `new Date()` (`ticketService.ts:101`); la suite de `ticketCreate` sigue verde.
- [x] L1.9 (D4) `apps/desk/server/services/ticketService.ts:131`, en sitio, tras el `throw` de prioridad y antes de `const entran`:
  `if (cambiaCodigoSinPermiso(t, b.values, current.row.codigo_servicio ?? null, user)) throw new HttpError(403, { error: MENSAJE_CODIGO_BLOQUEADO })`
  con comentario corto sin `;`. Y `:6`: añadir los tres nombres al final de la lista de importación.
- [x] L1.10 (D6) `ticketService.ts:155`, en sitio: `valoresConMotivo(values, gas)` → `valoresConCodigoPrevio(valoresConMotivo(values, gas), t, current.row.codigo_servicio ?? null)`.
  Verde CB-1…CB-7 y PCS-1…PCS-5.
- [x] L1.11 (D7) `apps/desk/src/components/TransitionPanel.tsx`, tres ediciones en sitio (fuera de la red de pruebas, F0-00): `:8` importar
  `CLAVE_CODIGO_SERVICIO, propuestaCodigoServicio, puedeCambiarCodigoServicio`; `:80` tras `previos[f.key] = delTicket[f.key]` el
  `else if (f.key === CLAVE_CODIGO_SERVICIO) previos[f.key] = propuestaCodigoServicio({ … })`; `:174` el bloqueo de `yaLoTraeElTicket` se
  suspende para el administrador. Cubre los escenarios «VERIFICACIÓN MANUAL» (no se prueban; quedan para las pruebas en la app).
- [x] L1.12 `npm run typecheck` = 0 y la suite entera en verde (M0 posterior); `git diff --numstat` cumple la colocación; medir contra 720.

### Mutaciones y barrido (D10)

- [x] L1.13 **M1 posición**, en `ticketService.ts`: (a) quitar la guarda de `:131` y añadirla al final de `:134` → roja PCS-2 (da `422`);
  (b) llevarla al final de `:128` → roja PCS-1; (c) llevarla tras el `}` inicial de `:128` → rojas PCS-3, PCS-4 y PCS-5. Si alguna colocación
  no pone en rojo la prueba prevista, la prueba no discrimina: se corrige antes de seguir. Restaurar de la copia, `sha256` y `file` (CRLF).
- [x] L1.14 **M2 condición**, en `codigoServicio.ts`: quitar `!puedeCambiarCodigoServicio(s)` → rojas la fila de admin y CB-4; quitar los
  `trim()` → rojas «mismo valor con espacios» y CB-2; quitar la salida del previo vacío → rojas su fila y CB-3; tratar `' '` como vacío
  → rojas «sólo espacios es un cambio» y CB-6b. Restaurar y comprobar.
- [x] L1.15 **M2b fichero vigilado:** `packages/shared/src/transitions.ts:262`, `cfText('Código Servicio')` → `cfText('Codigo Servicio')` →
  rojas la lista de transiciones con el campo y CB-1 del atajo. Restaurar; `git diff -- packages/shared/src/transitions.ts` vacío.
- [x] L1.16 **M3 casilla de la regla 13** (D8): escribir en `apply-progress.md` la tabla decisión a decisión (bloquear → `ticketService.ts:131`,
  leída al cerrar; desbloquear al admin → `puedeCambiarCodigoServicio`; prellenar → comodidad sin contrapartida; asterisco →
  `transitionExec.ts:77`), con las líneas releídas, no las del diseño.
- [x] L1.17 **M4 barrido de citas:** `git grep -noE "ticketService\.ts:[0-9]+(-[0-9]+)?"`, `"ticketCreate\.ts:[0-9]+(-[0-9]+)?"`,
  `"TransitionPanel\.tsx:[0-9]+(-[0-9]+)?"`; de cada resultado cuyo rango toque `ticketService.ts` 6, 131 o 155, `ticketCreate.ts` 7 o 12,
  o `TransitionPanel.tsx` 8, 80 o 174, leer qué AFIRMA la frase y clasificar A/B/C. Segundo pase de abreviadas en los ficheros del primero:
  `git grep -nE "(^|[^0-9A-Za-z_./])(:6|:7|:8|:12|:80|:131|:155|:174)([^0-9]|$)" -- <ficheros>`. Reparar sólo los casos A.
- [x] L1.18 Escribir `apply-progress.md` (~120 líneas): M0, rojas por mutación, tabla M3, barrido, medida, exclusiones (binarios aparte).
- [ ] L1.c (orquestador) Cierre del lote: los cinco códigos en 0 en una cadena, bundle nuevo anotado, medida ≤ 720 y `settle`.

## Verify y archive (un intento cada uno)

- [ ] V.1 `sdd-verify` (i3), por un actor independiente: reproducir M1 y M2 con su control M0, escenario por escenario de las dos deltas
  (los «VERIFICACIÓN MANUAL» se marcan como tales, no como pasados); repetir los cinco códigos y el barrido; `verify-report.md`.
- [ ] A.1 `sdd-archive` (i4, techo 2 × carpeta + 800): medir ANTES la parte revisable (fusión + `archive-report.md`) ≤ 800; si la supera, parar
  y consultar. Fusionar las dos deltas ADDED-only al final de `openspec/specs/tickets-core/spec.md` y `openspec/specs/transitions-st/spec.md`
  por script, y comparar cada bloque vivo contra su delta (idénticos). `archive-report.md` lo escribe el orquestador con cifras medidas.
- [ ] A.2 Mover la carpeta a `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado` (o la fecha del archivo); `git show --numstat`
  del commit de archivo contiene SÓLO este cambio; barrido de citas y los cinco códigos en 0. **PARAR antes de fusionar a `main`** (fusiona el analista).

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son trabajo de este repositorio. **Archivar NO las da por hechas.** Detalle en `proposal.md` §9.

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Si el cambio cuenta en F1B-03 (S-1) | Supervisión / Gerencia | Cabecera y barrido | `proposal.md` §9 y `archive-report.md` |
| P-2 | Tickets sin código que ya pasaron de `Ingresado` (migración F1F-01) no tienen vía para fijarlo | Gerencia | Panel, apartado 06 | `proposal.md` §9 y `archive-report.md` |
| P-3 | Si el administrador puede corregir el código fuera de `Ingresado` | Gerencia | Panel, apartado 06 | `proposal.md` §9 y `archive-report.md` |
| P-4 | M1.1 y Anexo D nº 37 recogen el bloqueo y la propuesta | Gerencia | Próxima revisión del maestro (§13 del expediente) | `proposal.md` §9 y `archive-report.md` |
| P-5 | Desplegar cliente y servidor tras la fusión | Despliegue | Producción | Paquete de despliegue |

## Review Workload Forecast

| Intento | Contenido | Estimado (medido al cierre) |
|---|---|---|
| i1 · planificación | propuesta, dos deltas, diseño, tareas | ~550 |
| i2 · apply | shared ~50 + prueba ~100; prueba HTTP ~190 (con PCS-4/6b, ~210); 8 líneas en sitio (~16); `index.ts` +1; `apply-progress.md` ~120 | ~490-510 |
| i3 · verify | `verify-report.md` ~360 | ~380 |
| i4 · archive | mudanza 2 × carpeta (~1.050) + 800; revisable (fusión ~140 + informe ~150) ≤ 800 | ~2.400 |

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500 en i2 (código + pruebas + informe); ~1.900 en total con informes y mudanza |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Una rama; sin PR. Se fusiona a `main` tras la verificación del analista, como el precedente. Partir L1/L2 sólo si i2 pasa de 720 |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No — el total de la rama supera 400 líneas, pero la entrega es por fusión tras la verificación del analista, y cada intento va bajo el techo de 720/800
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| L1 | Guarda `403` + traza + propuesta (shared, servidor, cliente) | Fusión de la rama | `npx vitest run packages/shared/src/codigoServicio.test.ts apps/desk/server/codigoServicioBloqueado.test.ts` | Arnés HTTP `appHarness.ts` (CB-1…CB-7, PCS-1…PCS-5); `.tsx` por verificación manual | Revertir la fusión; sin datos, esquema ni interruptor |
