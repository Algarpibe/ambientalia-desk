# Tareas — Prioridad en tres niveles y ajuste por ticket del Director Técnico

Cambio `prioridad-tres-niveles` (`tanda: F1B-07`, `cierra: no`). Base `6344b4a`. Manda el diseño (`design.md`, D1 a D11
y §6 a §11). Cada lote es un intento del registro en este worktree (techo 800, válvula 720), con su fase de partida, sus
rojos, su código, sus mutaciones y su cierre, y deja el árbol en verde por sí solo. Orden: L1, L2, L3. Verify y archive
son fases aparte y **no** son casillas de este fichero.

**Reglas que valen en todo el fichero.**
- `strict_tdd`: toda tarea de código va precedida de su tarea de prueba en ROJO (fichero y nombre de la prueba) y luego
  VERDE. Las «caracterizaciones» nacen verdes y se dice así.
- Ediciones EN SITIO, cero líneas netas, en `ticketService.ts`, `routes/prioridad.ts`, `CreateTicket.tsx`,
  `PanelPrioridad.tsx`, `TransitionPanel.tsx`, `transitions.ts` y `contratos.ts`; `prioridad.ts` y `cargos.ts` sólo
  crecen **al final**. Pruebas nuevas en bloque al final del fichero (D11); las que se invierten, en sitio.
- Medida del intento: `git diff --shortstat --no-renames <commit de partida>` más `wc -l` de lo nuevo sin trackear
  (una línea modificada cuenta dos; binarios aparte). Si la estimación de un lote pasa de 720, se parte.
- Los CUATRO códigos de cierre se miran **uno a uno**, nunca uno solo en nombre de los demás: `npm test`,
  `npm run typecheck`, `npm run lint` y `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` sobre el
  commit del lote.

## Review Workload Forecast

| Lote | Pruebas (líneas) | Código + progreso + casillas | Estimación | Riesgo frente a 800 |
|---|---|---|---|---|
| L1 | ~330 (×1,5 por ediciones en sitio) | ~15 + ~45 + ~40 | ~560 a 640 | Medio, bajo la válvula; se re-mide en L1.11 |
| L2 | ~285 (×1,5) | ~25 + ~45 + ~40 | ~440 a 520 | Bajo |
| L3 | 0 (los `.tsx` no tienen red) | ~20 `.tsx` ×2 + ~150 de documentos + ~45 + ~40 | ~200 a 250 | Bajo |
| **Total** | | | **~1.200 a 1.410** | Tres intentos independientes |

Verify (~300 a 360 líneas) y archive son intentos propios, fuera de este recuento.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

*Motivo de «No»:* modo `auto`; ninguna casilla cambia el alcance, cuesta dinero ni toca producción; D9 (S-K) es un
supuesto reversible ya anotado en el diseño. No hay PR encadenado: la unidad es el intento, fusionado a `main` al cerrar.
*Medio:* L1 arrastra el recambio de pruebas de `Low` (6 ficheros) y se re-mide antes de escribir código.

### Unidades de trabajo

| Unidad | Meta | Prueba enfocada | Harness real | Frontera de reversión |
|---|---|---|---|---|
| L1 | Lista `High`/`Medium` y nacimiento `Medium` | `npx vitest run packages/shared/src/prioridad.test.ts packages/shared/src/contratos.test.ts apps/desk/server/services/ticketService.test.ts apps/desk/server/prioridadAlNacerVigencia.test.ts` | pg-mem, reloj falso sólo de `Date` | `git revert` del lote; sin esquema |
| L2 | Predicado, escalera del `POST`, guarda de transición, D9, sincronizador | `npx vitest run packages/shared/src/cargos.test.ts apps/desk/server/prioridadTop5.test.ts apps/desk/server/services/guardaPrioridad.test.ts` | pg-mem | `git revert` de L2 solo; L1 queda verde |
| L3 | Cliente consumiendo `shared` y cierre documental | `npm run build` más el detector de citas; pantalla: sección de personas | Compilación; sin red `.tsx` por decisión de Gerencia | `git revert` de L3; servidor intacto |

---

# LOTE L1 — Lista, nacimiento y borde de vigencia (≈ 560 a 640)

Archivos: `prioridad.ts` (+3 al final), `transitions.ts`, `contratos.ts`, `prioridadPropagada.ts`,
`prioridadCliente.ts` (comentarios), `ticketService.ts` (0 netas), y las pruebas de §6 y §9 del diseño.

**Fase de partida**
- [x] L1.1 Anotar `git rev-parse HEAD` (debe ser `6344b4a` o su fusión) como commit de partida de L1 y abrir el intento
  del registro en el worktree. Medir `wc -l` de `prioridad.ts`, `contratos.ts`, `ticketService.ts` y `cargos.ts`.
- [x] L1.2 Correr `npm test`, `npm run typecheck`, `npm run lint` en la partida y anotar el recuento de pruebas.

**Rojo**
- [x] L1.3 `packages/shared/src/prioridad.test.ts`, en sitio (`:10`, `:23`, `:52`, `:112-116`, `:137`): «la lista
  asignable es High, Medium», «Low no es asignable», «un Top 5 guardado con Low no impone» (`prioridadTop5` da
  `null`), «prioridadClienteDelCuerpo y ajusteDelCuerpo rechazan Low». ROJO.
- [x] L1.4 `packages/shared/src/prioridadPropagada.test.ts` `:45-47` y `:51-55`: los Top 5 que asignan `Low` pasan a
  `Medium` (si no, dejan de compilar). Las `:48-50` y `:81-88` quedan intactas y verdes (sostienen S-I).
- [x] L1.5 `apps/desk/server/services/ticketService.test.ts`, en sitio: filas `:962-970`, `:977-982`, `:1127-1131`,
  `:1133-1140`, `:1142-1146`, `:1148-1152` (Top 5 del cliente A pasa a `High` para que discrimine), `:1160-1164`,
  `:1166-1171`. Al final, bloque nuevo: «sin contrato ni Top 5 nace Medium pidiendo High / Low / Urgent / nada»,
  «Top 5 Medium con contrato nace High», «Top 5 guardado con Low y sin contrato nace Medium». ROJO e INVERSIÓN.
- [x] L1.6 `apps/desk/server/trazaTop5AlNacer.test.ts` `:30-37`, `:39-45`, `:47-53`, `:55-60`, `:77-82`, `:84-88`,
  `:100-108`: INVERSIÓN, nacer bajo Top 5 `High` da traza con `de` = `Medium`; desmarcar devuelve a `Medium`.
- [x] L1.7 `apps/desk/server/prioridadTop5.test.ts` `:113-123` y `:247-251`, y `apps/desk/server/propagarTop5.test.ts`
  `:76-82` y `:84-88`: sustituir `Low` por `Medium` como valor de Top 5 (en L2 se editan el resto de `prioridadTop5.test.ts`).
- [x] L1.8 **Borde, función pura.** `packages/shared/src/contratos.test.ts`, bloque al final: «el día del fin da High»,
  «el día siguiente da Medium», «un instante que en UTC ya es el día siguiente y en la zona sigue siendo el del fin da
  High» (`fechasDerivadas.ts:13`), «con el fin movido, el día siguiente al fin original da High». CARACTERIZACIÓN: nace
  verde. Las `:75-80` y `:219-236` no se editan.
- [x] L1.9 **Borde, servicio.** Crear `apps/desk/server/prioridadAlNacerVigencia.test.ts`: los mismos cuatro casos por
  `createManagedTicket`, reloj falso sólo de `Date`, ampliación por la ruta real (molde
  `apps/desk/server/ampliacionContratoPuertas.test.ts:40-41`, `:59-63`, `:75-79`). ROJO en «el siguiente día da
  Medium». Hipótesis a confirmar: el alta sin orden de venta se comporta igual bajo ese reloj; si no, anotarlo.
- [x] L1.10 Correr las pruebas de L1.3 a L1.9 y anotar rojo/verde de cada una **y la razón del rojo**; una que nazca
  verde sin ser caracterización es un detector que no existe: se arregla antes de seguir.
- [x] L1.11 **Válvula.** Medir lo escrito (`git diff --shortstat --no-renames` + `wc -l`), sumar código (~15),
  `apply-progress.md` (~45) y casillas (~40). Si pasa de 720, parar y partir en L1a (lista: L1.3, L1.4, L1.12, L1.13) y
  L1b (nacimiento: el resto) y avisar al orquestador.

**Verde**
- [x] L1.12 `packages/shared/src/prioridad.ts` `:12-13` en sitio (lista `High`, `Medium`); al final,
  `export const PRIORIDAD_POR_DEFECTO: PrioridadAsignable = 'Medium'` (+3 netas, D1).
- [x] L1.13 `packages/shared/src/transitions.ts:84` en sitio: opciones `High`, `Medium` (cero netas). Paridad:
  `prioridad.test.ts:12-19`.
- [x] L1.14 `packages/shared/src/contratos.ts` `:65`, `:66`, `:68`: parámetro `pedida` pasa a `respaldo` y su comentario
  se corrige en sitio (D2); mismos retoques de comentario en `packages/shared/src/prioridadPropagada.ts:35` y
  `apps/desk/server/db/prioridadCliente.ts:127-128`. La fórmula no cambia.
- [x] L1.15 `apps/desk/server/services/ticketService.ts` `:6` (import), `:106` y `:108` (la constante en lugar de
  `b.prioridad`), en sitio. Comprobar por lectura que `b.prioridad` ya no se lee en todo el alta.
- [x] L1.16 Correr las pruebas de L1.3 a L1.9: todas verdes. Las verdes-sin-editar de §9 del diseño
  (`contratos.test.ts:75-80`, `:219-236`; `prioridadPropagada.test.ts:48-50`, `:81-88`; `prioridadTop5.test.ts:179-194`;
  `propagarTop5.test.ts:99-106`, `:108-114`, `:174-184`) siguen verdes **sin editarse**.

**Mutaciones (regla 1, 2 y datos)**
- [x] L1.17 Ejecutar las mutaciones M1 a M9 que ya tienen objeto en este lote y anotar rojo/verde de cada una, y que
  tras revertirla vuelve el verde: **M5** (`Low` vuelve a una sola de las dos listas: cae la paridad
  `prioridad.test.ts:12-19`), **M6** (`ticketService.ts:106` vuelve a `b.prioridad`: cae «nace Medium pida lo que
  pida»), **M7** (`contratos.ts:43` `<` a `<=`: cae el borde, el día del fin, en las dos capas), **M9** (datos: fila de
  `cliente_prioridad` con `top5` verdadero y `Low`, sin tocar código: el alta nace `Medium`). **M1 a M4 y M8: no
  aplican todavía** (su código nace en L2); se anota «n/a en L1».

**Cierre**
- [x] L1.18 `git diff --numstat <partida>` por fichero: inserciones = borrados en `ticketService.ts`,
  `transitions.ts`, `contratos.ts`, `prioridadPropagada.ts` y `prioridadCliente.ts`; `prioridad.ts` sólo `+3`
  al final. Cualquier otra cifra, se corrige antes de cerrar.
- [ ] L1.19 Los CUATRO códigos, uno a uno: `npm test` (verde), `npm run typecheck` (verde), `npm run lint` (verde) y,
  tras commitear el lote, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` (sin bloqueantes). Anotar
  la salida de cada uno.
- [x] L1.20 Ejecutar la medida del intento (`git diff --shortstat --no-renames` contra la partida más `wc -l` de lo
  nuevo sin trackear) y registrar ESA cifra; debe ser ≤ 800.
- [x] L1.21 Escribir `apply-progress.md` de L1 (rojos con su razón, mutaciones, medida) y marcar casillas.

---

# LOTE L2 — Predicado, escalera del `POST`, guarda de transición, D9 y sincronizador (≈ 440 a 520)

Archivos: `cargos.ts` (+~10 al final), `prioridad.ts` (+~8 al final), `routes/prioridad.ts` (0 netas),
`ticketService.ts` (0 netas), y las pruebas de §6 del diseño.

**Fase de partida**
- [ ] L2.1 Anotar `git rev-parse HEAD` (cierre de L1) como commit de partida de L2 y abrir su intento. Medir `wc -l` de
  `cargos.ts` (98), `routes/prioridad.ts` y `guardaPrioridad.test.ts`.

**Rojo**
- [ ] L2.2 `packages/shared/src/cargos.test.ts`, al final: «`puedeAjustarPrioridadTicket`: matriz de los ocho cargos,
  sin cargo y administrador, con área Comercial, con Servicio Técnico y sin área» (sólo Director Comercial, Director
  Técnico y administrador pasan, el Director Técnico también sin área, S-F); y el tercer llamador en la prueba de
  llamadores (`:226-229`). ROJO. Queda fuera del barrido de `:177-207`, como `puedeCrearOVIGarantia` (`:185`).
- [ ] L2.3 **Inversiones del `POST`.** `apps/desk/server/prioridadTop5.test.ts` en sitio: `:260-267` y `:269-273` de
  `409` a `200`; `:359-375` (matriz de sujetos); el `403` con el texto nuevo del diseño §3. Al final: «ticket sin
  cliente se ajusta con `200` y traza» (D7) y «matriz de diez sujetos, tres aceptados». INVERSIÓN y ROJO.
- [ ] L2.4 **P1** (A<B: ticket inexistente Y sin cargo, `404`): ya existe en `prioridadTop5.test.ts:304-307`, verde.
  Mutación que caza: subir el `403` por encima del `404`.
- [ ] L2.5 **P2** (B<C: Coordinador Comercial Y sin motivo, cliente Top 5, `403`): ya existe en `:292-295`, verde.
  Mutación: bajar el `403` detrás del `422`.
- [ ] L2.6 **P3**, en sitio sobre `:282-285`: Coordinador Comercial Y sin motivo, cliente **no** Top 5 → `403`. ROJO
  (hoy daría `409`). Mutación: bajar el `403` detrás del `422`.
- [ ] L2.7 **P4**, en sitio sobre `:287-290`: Director Técnico Y sin motivo, cliente no Top 5 → `422`. ROJO. Mutaciones:
  reponer B1 (daría `409`); quitar al Director Técnico (daría `403`).
- [ ] L2.8 **P5**, nueva al final: ticket inexistente Y cuerpo inválido, administrador → `404`. Nace verde
  (caracterización); mutación: validar el cuerpo antes de buscar el ticket.
- [ ] L2.9 **Transición.** `apps/desk/server/services/guardaPrioridad.test.ts`, al final: «el Director Técnico cambia la
  prioridad en las dos transiciones que la llevan» y «un técnico recibe `403`». ROJO.
- [ ] L2.10 **T1** (existe `:123-128`, verde): sin área Servicio Técnico Y prioridad distinta → `403` que nombra el
  área; mutación: subir la guarda de prioridad por encima del área (M2). **T2** (existe `:130-135`, verde): técnico con
  prioridad distinta Y sin «Días de entrega» → `403` de prioridad; mutación: bajar la guarda detrás del primer `422`
  (M3). **T3** (existe `:137-141`, verde): estado que no aplica Y prioridad distinta → `409`; mutación: subir la guarda
  por encima del estado.
- [ ] L2.11 **T4**, nueva: Director Técnico **sin** Servicio Técnico Y prioridad distinta → `403` que nombra el área.
  Mutación: que el cargo abra la transición. **T5**, nueva: Director Técnico con prioridad distinta Y sin «Días de
  entrega» → `422`, no `403`. ROJO. Mutación: quitar al Director Técnico del predicado.
- [ ] L2.12 **D9 (S-K), las dos cosas.** `prioridad.test.ts`, al final, sobre `erroresPrioridadPedida`: (a) rechaza: la
  transición declara el campo y la pedida es no vacía, distinta de la actual y no asignable (`Low`, `Urgent`) → un
  error con «La prioridad debe ser una de: High, Medium». (b) NO rechaza: reenviar la actual aunque sea `Low` o `Urgent`
  heredada, pedida vacía, valor asignable, y campo no declarado por la transición. En `guardaPrioridad.test.ts`:
  «`Low` pedida por quien tiene permiso es `422`» (ROJO) y «reenviar la MISMA prioridad heredada `Low` pasa»
  (caracterización, junto a `:60-64`). Mutación (M8): retirar la función de `ticketService.ts:134`.
- [ ] L2.13 **Sincronizador.** `prioridadTop5.test.ts`, al final, gemela de `:320-331` con su arnés
  (`ticketRowFromZoho`, `upsertTicket`; sujeto con `:34-38`): cliente **sin** fila en `cliente_prioridad`; dos tickets
  con `ticketDe`, `managed_by_app` falso comprobado; el Director Técnico (área Servicio Técnico) ajusta el primero y
  recibe `200`; `upsertTicket` con otra prioridad no lo cambia; el segundo, de control, sí cambia. ROJO hasta que
  L2.15 dé permiso. La sostiene `packages/zoho-sync/src/db/repo.ts:71`, no la marca de `:76-78`.
- [ ] L2.14 Correr las pruebas nuevas y anotar rojo/verde de cada una con su razón (las existentes P1, P2, T1, T2, T3
  y las caracterizaciones nacen verdes y se declaran).

**Verde**
- [ ] L2.15 `packages/shared/src/cargos.ts`, al final (tras `:98`): `CARGOS_AJUSTE_PRIORIDAD_TICKET: readonly Cargo[] =
  ['Director Técnico']` y `puedeAjustarPrioridadTicket(s)` = `puedeFijarPrioridadTop5(s)` o cargo efectivo en la lista.
  Sin tocar `EXCEPCIONES_POR_CARGO` ni `:80-83`.
- [ ] L2.16 `packages/shared/src/prioridad.ts`: `:10` (import), `:55` (texto de `MENSAJE_PRIORIDAD_BLOQUEADA`),
  `:77-79` (comentario) y `:85` (`cambiaPrioridadSinPermiso` consume el predicado nuevo), en sitio; al final,
  `erroresPrioridadPedida(t, valores, actual): string[]` (D9).
- [ ] L2.17 `apps/desk/server/routes/prioridad.ts`: `:5` (import), `:47-49` (comentario), `:67-71` en sitio: las dos
  guardas `409` se retiran y sus tres líneas se compensan con un comentario de tres líneas (qué había, hasta qué
  revisión, qué decisión lo levantó); `:70` queda «B · permiso» y `:71` el `403` con el predicado nuevo y el texto del
  diseño §3. `:66`, `:73-74` no se mueven. `:40` (el `PUT`) no se toca.
- [ ] L2.18 `apps/desk/server/services/ticketService.ts`: `:6` y `:134` en sitio (suma `erroresPrioridadPedida` al
  `422` agregado). `:131` **no se toca**.
- [ ] L2.19 Correr todas las pruebas de L2: verdes; y las de L1 siguen verdes.

**Mutaciones**
- [ ] L2.20 Ejecutar las mutaciones M1 a M9 y anotar rojo/verde de cada una: **M1** (el `403` de `routes/prioridad.ts:71`
  detrás de `:74`: caen P2 y P3), **M2** (`ticketService.ts:131`, guarda de prioridad antes de `:129`: caen T1 y T4),
  **M3** (la misma guarda detrás del `throw` de `:134`: cae T2), **M4** (`CARGOS_AJUSTE_PRIORIDAD_TICKET` vacío: caen
  P4, T5, la matriz y el sincronizador), **M8** (retirar `erroresPrioridadPedida` de `:134`: cae «`Low` pedida con
  permiso es `422`»), y repetir **M5, M6, M7, M9** de L1 sobre el árbol actual. Cada mutación se revierte y se
  confirma el verde.

**Cierre**
- [ ] L2.21 `git diff --numstat <partida>`: inserciones = borrados en `routes/prioridad.ts` y `ticketService.ts`;
  `cargos.ts` y `prioridad.ts` sólo con adiciones al final (más las líneas en sitio de `prioridad.ts`).
- [ ] L2.22 Los CUATRO códigos, uno a uno: `npm test`, `npm run typecheck`, `npm run lint` y, tras commitear,
  `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`. Anotar la salida de cada uno.
- [ ] L2.23 Ejecutar la medida del intento y registrar ESA cifra (≤ 800).
- [ ] L2.24 Escribir `apply-progress.md` de L2 y marcar casillas.

---

# LOTE L3 — Cliente y cierre documental (≈ 200 a 250)

Archivos: `CreateTicket.tsx`, `PanelPrioridad.tsx`, `TransitionPanel.tsx` (0 netas, sin red de pruebas por decisión de
Gerencia: no se propone `jsdom`); documentos de §11 del diseño. **No se toca `CLAUDE.md`, ni `docs/sdd/ENTRADA.md`, ni
las specs vivas.**

**Fase de partida**
- [ ] L3.1 Anotar `git rev-parse HEAD` (cierre de L2) como partida de L3 y abrir su intento.

**Cliente** (el servidor ya impone cada decisión desde L1 y L2; no hay rojo posible en `.tsx`, y se dice)
- [ ] L3.2 `apps/desk/src/components/PanelPrioridad.tsx`: `:2` import, `:11-12` comentario y `:27` pasa a
  `!!user && puedeAjustarPrioridadTicket(user)` (cae `data.top5 &&`). Cero netas.
- [ ] L3.3 `apps/desk/src/components/TransitionPanel.tsx`: `:8` import y `:160` con el predicado nuevo. Cero netas.
- [ ] L3.4 `apps/desk/src/components/CreateTicket.tsx` (D10): `:47` y `:231` a comentario de una línea; `:426-429` a un
  `<span>` estático de cuatro líneas («Prioridad: la asigna el sistema») que conserva la celda de la rejilla. Cero netas.
- [ ] L3.5 Confirmar por lectura que `apps/desk/src/components/Top5Panel.tsx` **no cambia** (ya consume la lista, `:87`,
  `:123`, y el predicado del `PUT`, `:20`).
- [ ] L3.6 Correr `npm run build`, `npm run typecheck` y `npm run lint`: verdes (el único detector del cliente).

**Regla de mutación 3 (tabla escrita, decisión a decisión)**
- [ ] L3.7 Verificar cada fila del §8 del diseño contra el servidor, por escrito en `apply-progress.md` (decisión,
  línea del cliente de hoy, línea del servidor de hoy y prueba que la impone): (1) `Top5Panel.tsx:87`, `:123` ↔ `422`
  `routes/prioridad.ts:42-43`; (2) `PanelPrioridad.tsx:67` ↔ `422` `routes/prioridad.ts:73-74`; (3) `PanelPrioridad.tsx:27`
  ↔ `403` `routes/prioridad.ts:71` (P3, P4); (4) `TransitionPanel.tsx:160` ↔ `403` `ticketService.ts:131` (T4, T5);
  (5) `CreateTicket.tsx:426-429` ↔ `ticketService.ts:106` no lee `prioridad` (M6); (6) `Top5Panel.tsx:20` ↔ `403`
  `routes/prioridad.ts:40`; (7) campo de transición ↔ `422` `ticketService.ts:134` (D9, M8; la hipótesis del formulario
  se marca «hipótesis»). Si alguna fila queda sin línea que la imponga, es un hallazgo y se registra, no se omite.

**Mutaciones**
- [ ] L3.8 Ejecutar las mutaciones M1 a M9 sobre el árbol final del cambio y anotar rojo/verde de cada una (las nueve
  existen ya), confirmando el verde tras revertir cada una.

**Cierre documental (D11)**
- [ ] L3.9 **Barrido de citas (regla de mutación 4)** de los ficheros que hayan cambiado de líneas: `git diff --numstat`
  de los cuatro `.tsx`, `routes/prioridad.ts`, `ticketService.ts`, `contratos.ts` y `transitions.ts` (sin
  desplazamiento si inserciones = borrados); para cada uno, `grep -rnoE "<fichero>\.tsx?:[0-9]+(-[0-9]+)?"` y leer qué
  AFIRMA cada cita, con los dos extremos de cada rango; atención a `routes/prioridad.ts` `:67-71` y a `prioridad.ts`
  `:13`, `:55`, `:77-85`. Segundo pase para las abreviadas en los ficheros que ya citan el módulo. Registrar el
  resultado fila a fila.
- [ ] L3.10 `openspec/config.yaml`, en sitio y sin mover líneas: anclar a `6344b4a` las cuatro citas que pasan a caso
  C, con qué las cerró: `:4143` (`prioridad.ts:13`), `:4150` (`prioridad.ts:79`), `:4151` (`routes/prioridad.ts:71`) y
  `:4153` (`routes/prioridad.ts:69`). La de `:4148` sigue siendo cierta y no se toca.
- [ ] L3.11 Añadir al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` la entrada M1.9.1 (molde de
  `:1322-1344`) sobre la R08.4: `…R08.4.md:1982` (Alta o Media), `:1986-1987` (Media, sin «baja», lo ligado a la
  valoración queda [ABIERTO]) y `:1990` (ajuste en cualquier ticket, con motivo, Director Comercial, Director Técnico o
  administrador). Decir que NO da por decididos S-A a S-K.
- [ ] L3.12 Adenda al final de `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`: qué entra (sin esquema, sin variables, sin
  relleno); la consulta de sólo lectura del §8 de la propuesta, literal y marcada **«no ejecutada»**; la condición (un
  Top 5 guardado con `Low` deja de imponer hasta volver a guardarlo); y las tareas de persona P-1, P-2 y P-6.
- [ ] L3.13 Dentro de esa misma adenda, redactar las entradas propuestas para la bandeja **SIN número** (las asigna
  Supervisión): las cuatro preguntas del §14 de la propuesta, más la pregunta de S-K (¿se mantiene el `422` de lista en
  la transición?) y los hallazgos de `GET /api/top5` (lecturas divergentes de «es Top 5» con `Low` guardado) y de la
  columna `Low` del tablero. No tocar `docs/sdd/ENTRADA.md`.
- [ ] L3.14 Comprobar con `git diff --name-only <partida de L1>` que `CLAUDE.md`, `docs/sdd/ENTRADA.md`,
  `openspec/specs/**` y `packages/zoho-sync/src/db/repo.ts` **no** aparecen.

**Cierre**
- [ ] L3.15 `git diff --numstat <partida de L3>` por fichero: inserciones = borrados en los tres `.tsx`; confirmar
  además el estado final de L1 y L2 (`ticketService.ts`, `routes/prioridad.ts`, `transitions.ts`, `contratos.ts`).
- [ ] L3.16 Los CUATRO códigos, uno a uno, más el build: `npm test`, `npm run typecheck`, `npm run lint`,
  `npm run build` y, tras commitear, `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`. Anotar la salida.
- [ ] L3.17 Ejecutar la medida del intento y registrar ESA cifra (≤ 800).
- [ ] L3.18 Escribir `apply-progress.md` de L3 (incluida la tabla de L3.7) y marcar casillas.

---

## Tareas de personas — FUERA del recuento

Regla del ciclo 1: no son casillas, no las marca ninguna tanda. **Archivar este cambio NO las da por hechas.**

| | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Ejecutar en producción la consulta de sólo lectura del §8 de la propuesta y devolver el resultado | Persona con acceso a la base de producción | Paquete de despliegue | Adenda de `docs/sdd/Paquete_de_Despliegue_2026-10-08.md` (L3.12) |
| P-2 | Volver a guardar con `High` o `Medium` cada Top 5 que la consulta 3 devuelva (los que tuvieran `Low`) | Director Comercial | Paquete de despliegue | La misma adenda |
| P-3 | Responder a los supuestos S-A a S-K y a las preguntas propuestas | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` | Entradas propuestas de la adenda (L3.13), que Supervisión numera |
| P-4 | Definir qué es la «valoración del cliente» y cómo llega a Desk | Gerencia | Punto abierto de F1B-07 | La decisión `p3b-prioridad-tres-niveles`, consecuencia (3) |
| P-5 | Pegar en el maestro las correcciones de M1.9.1 | Gerencia | Expediente del maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` (L3.11) |
| P-6 | Comprobar en la aplicación tras desplegar: alta sin contrato nace media; el Director Técnico ajusta un ticket de un cliente que no es Top 5; un técnico no puede | Comercial y Servicio Técnico | Paquete de despliegue | La adenda |
