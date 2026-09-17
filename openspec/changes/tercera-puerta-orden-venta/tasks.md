# Tasks — `tercera-puerta-orden-venta` (desvío IV-4)

**Fase:** `sdd-tasks` · **Fecha:** 2026-09-16 · **Árbol de referencia:** `14b45ee`
**Contrato:** `design.md` (obs. 662). Toda cita `ruta:línea` de este documento se lee contra ese árbol,
salvo que diga lo contrario.

> ⚠️ **`apply-progress.md` está PRE-SEMBRADO con 0 tareas hechas** (precondición operativa del runbook,
> `proposal.md` §12.1: `0` filas sobre población `1`, por vacío — YA CUMPLIDA, no es tarea pendiente).
> `sdd-apply` **LEE ese fichero primero y FUSIONA su progreso encima; no lo sobrescribe.**

> ⚠️ **NO SON DOS CICLOS SDD.** R1 y R2 son **dos intentos del ledger y dos commits dentro del MISMO
> cambio** (`design.md` §11, recuadro «QUÉ ES UNA REBANADA»). Un solo `sdd-verify` y un solo
> `sdd-archive`, al final de las dos.

---

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | R1 ≈185 · R2 ≈237 · total ≈422 (medido, `design.md` §11) |
| 400-line budget risk | Low (por rebanada; el total ≈422 supera 400 pero el corte ya lo resuelve) |
| Chained PRs recommended | No — no son PRs separados: dos commits/intentos del ledger dentro del mismo cambio, cada uno medido contra su propio árbol de partida (`CLAUDE.md`, regla del ciclo 2) |
| Suggested split | Rebanada 1 (R1, la guarda) → Rebanada 2 (R2, barrido de citas + IV-11) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — no aplica: no es un encadenado de PRs (`stacked-to-main`/`feature-branch-chain`), es un único cambio con dos intentos de ledger secuenciales; se usa `pending` como valor nulo del contrato |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

**El corte ya está decidido por Gerencia el 2026-09-16** (`design.md` §11). No se replantea.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| R1 | La guarda: `remision.ts` + los dos ficheros de prueba, con las 5 citas de §8.2 del diseño | Mismo PR, commit 1 | `npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts apps/desk/server/remisiones.test.ts` | N/A — guarda de backend cubierta por integración vitest contra Postgres de pruebas; no hay escenario manual adicional | `git revert` del commit 1: la guarda es puramente aditiva, ningún dato ni columna nuevos |
| R2 | Las dos poblaciones del barrido de citas (§8.3+§8.4) + registro/cierre de IV-4/IV-11 | Mismo PR, commit 2 | N/A — no toca código ni aserciones (`design.md` §8.1 punto 5); verificación es el hook + lectura humana | Informe del hook de `pre-push` (citas) limpio, más lectura cita a cita | `git revert` del commit 2: sólo prosa y comentarios, ninguna aserción `expect(...)` tocada |

---

## Tareas cuyo dueño está fuera de este repositorio (regla del ciclo 1 de `CLAUDE.md`)

**No se cuentan como tareas de esta lista; archivar no las da por hechas.**

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Techo de líneas del `sdd-archive`, tras medir en worktree aislado | Gerencia | `proposal.md` §11, `design.md` §13. No bloquea el `apply` |
| ✅ **YA CUMPLIDA el 2026-09-16** — consulta 4.1 del runbook contra producción | Gerencia | `apply-progress.md` (resultado: `0` filas sobre población `1`, por vacío). Se declara aquí para que no se lea como pendiente |

---

## Rebanada R1 · La guarda (≈185 líneas — intento/commit 1)

Secuencia de rojos de `design.md` §5, bajo `strict_tdd`. Runner: `npm test` (`vitest run`); iteración con
`npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts`.

- [x] **1.1 [RED]** En `apps/desk/server/ordenVentaUnTicket.test.ts:161`, quitar el `.fails`. Correr
      `npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts`. **Confirmar rojo exclusivamente por
      «expected 201 to be 409»**; si el motivo es otro (import, 404, 500), el rojo no vale — parar y
      averiguar antes de seguir. (design.md R1)

- [x] **1.2 [GREEN]** En `apps/desk/server/routes/remision.ts:5`, añadir `ticketConOrdenVenta` al import
      de `@ambientalia/zoho-sync/db/repo` que ya existe. Dentro de `if (b.salesOrderId)` (`:218-226`),
      **entre** el `422` de `:220` y el `UPDATE` de `:221-225`, insertar la guarda (D2+D3):
      `const enUso = await ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId)`;
      si hay coincidencia, `res.status(409).json({ error: 'La orden de venta ' + ov.number + ' ya está
      asociada al ticket #' + enUso.number }); return`. Comentario propio de la guarda, marcándola
      **transitoria** (se retira cuando llegue la tabla de `salesorder_id` como `PRIMARY KEY`,
      `Decisiones_Gerencia_2026-09-10.md:147-150`). **No tocar** el comentario de `:205-217`. (design.md
      R2, D2, D3, §10)

- [x] **1.3** Correr `npm test` completo. Confirmar: el ex-`it.fails` (`:161`) **VERDE**; `:141-159`
      **ROJA por «expected 409 to be 201»** — prevista y deseada, es la prueba por mutación de que la
      guarda cambió el comportamiento; **ninguna otra prueba cae**. (design.md R2)

- [x] **1.4 [FUSIÓN — D1]** En `ordenVentaUnTicket.test.ts`: borrar `:141-159`. Reescribir la cabecera
      por tramos según la tabla D1 de `design.md` §2: `:16-20` Caso A (mapa de las tres puertas, la 3 en
      `409 ✅`); `:22-34` Caso C; `:35-46` Caso C + resultado 2026-09-16 (población 1, `0` filas, con la
      frase de `proposal.md` §12.1 al lado); `:48-53` reescrito con el argumento de D1 (por qué ahora
      **tres** pruebas y no cuatro); `:55-64` Caso C («qué se hizo, y en qué orden»); `:66-71` Caso C
      invertida («quitar la llamada pone roja la puerta 3»). Retitular el `describe` de `:135` (pierde
      el paréntesis «la que no comprueba nada»). Correr `npm test` → **todo verde**. **A partir de aquí
      `remision.ts` no se vuelve a tocar**: su desplazamiento queda congelado para el barrido de R2.
      (design.md R3, D1)

- [x] **1.5** Re-anclar, en el mismo fichero y el mismo commit, las cinco citas de `design.md` §8.2:
      `:19`→`ticketService.ts:132-136` (Caso A); `:20`→bloque de la OV de hoy tras 1.2, con el
      `201❌→409✅` registrado en el tramo Caso C de 1.4 (Caso A en ubicación); `:23`→`ticketService.ts:45`
      y `:134` (Caso C: anclada a su revisión + qué la cerró); `:24`→`remision.ts:223` (Caso C: anclada +
      nota de que el `WHERE` ya no está «en lugar de» la guarda, sino **además**); `:136`→`remision.ts:223`
      (Caso A, doc del fixture). **Ninguna aserción `expect(...)` se toca.**

- [x] **1.6 [RED→GREEN, D4]** Al **final** de `apps/desk/server/remisiones.test.ts` (hoy termina en
      `:1006`, tras el `describe` de M5 `:990-1005`), escribir un `describe` nuevo con la prueba de
      posición: ticket dueño con la OV (número **y** `salesorder_id`) + ticket destino con **fixture
      propio**, sin `equipo_id` y sin serial — **no usar** `ticketSinOrden()` de
      `ordenVentaUnTicket.test.ts:138`, que sí trae `equipo_id` — con `client_id` para que `getClient`
      resuelva. Afirma: `422` y `/serial/i`, **no** `409`; las **tres** columnas del destino en `null`
      (`orden_venta`, `salesorder_id`, `fecha_orden_venta`, idioma de `remisiones.test.ts:1002-1004`); el
      ticket dueño sigue siendo el único con la orden. Correr → **VERDE**. (design.md R4)

- [x] **1.7 [Mutación M-a]** Subir la guarda nueva, **con su prelusión** (`getSalesOrder` + `422`), por
      encima del `422` del serial de `:152`, dejando el `UPDATE` donde está. Compilar y correr: la
      prueba de posición de 1.6 **debe** ponerse **ROJA con «expected 409 to be 422»** — si sigue verde,
      no prueba la posición y hay que rehacerla. **M5 debe seguir VERDE** (solapamiento cero: la OV
      `so-9` de `remisiones.test.ts:994-995` no la tiene ningún otro ticket). Revertir el movimiento.
      (design.md R5, M-a — regla de mutación 1)

- [x] **1.8 [Mutación M-b]** Bajar la guarda del serial por debajo del bloque de la OV. Compilar y
      correr: la prueba de posición **ROJA** («expected 409 to be 422») **y M5 ROJA** (el `UPDATE`
      escribe la OV en un rechazo). Deja registrado que las dos matan la misma mutación por lados
      distintos. **Revertir las dos** y correr la suite completa en verde. (design.md R5, M-b)

- [x] **1.9** Correr `npm test`, `npm run typecheck`, `npm run lint` → **verde**. Cierre de R1.
      (design.md R6)

---

## Rebanada R2 · El barrido de citas + registro de IV-4/IV-11 (≈237 líneas — intento/commit 2)

Procedimiento por cita, no por lista (`design.md` §8.1): leer qué AFIRMA la frase, clasificar
(A/B/C de la regla de mutación 4 de `CLAUDE.md`), anclar en la misma línea física si es B o C, no tocar
ninguna aserción, y sólo al final (aquí, en R2), cuando el desplazamiento de R1 ya está congelado.

- [x] **2.1 [Segundo pase, obligatorio]** Antes de reparar nada: repetir
      `git grep -rnoE "remision\.ts:[0-9]+(-[0-9]+)?" -- . ':!openspec/changes/archive'` y
      `git grep -rnoE "ordenVentaUnTicket\.test\.ts:[0-9]+(-[0-9]+)?" -- . ':!openspec/changes/archive'`
      sobre el árbol ya congelado por 1.4, **y además** un pase manual por **forma abreviada**
      (`` `:223` ``, `` `:161` ``, sin nombre de fichero) en los ficheros que ya citan cada módulo —
      **el grep completo no la caza** (`CLAUDE.md`, regla de mutación 4). Alcance: `apps/**`,
      `packages/**`, `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/**`, `docs/**` (incluido
      `docs/superpowers/**`). Fuera: `openspec/changes/archive/**`, y `proposal.md`/`exploration.md`/
      `design.md` de esta propia tanda (llevan `**Árbol:** 14b45ee` y quedan anclados por él).

### Población A — desplazamiento por el crecimiento de `remision.ts` (guarda de 1.2)

Regla de reparación (`design.md` §8.3): el bloque **sólo crece** y su comentario de cabecera
(`:205-217`) no se toca. Para cada cita, leer el `remision.ts` ya construido en 1.2-1.4 y recalcular:
si el rango cita **`:218-226`** completo (spanea el punto de inserción), **sólo el extremo final se
mueve** (`:218` se queda, `:226` sube lo que la guarda mida de verdad); cualquier línea o rango que
citen **sólo** puntos por debajo de `:220` se desplazan **enteros**, los dos extremos, la misma
cantidad. No se estima "+11": se mide contra el fichero real.

⚠️ **Dos exclusiones encontradas al verificar, que `design.md` §8.3 no nombra por separado** (su tabla
de 12 ficheros/34 aciertos no las excluye explícitamente, pero quedan fuera por la misma razón que ya
usa para la Población B):

- `openspec/specs/remisiones/spec.md:379` en `67a90c1` y `:386` en `67a90c1` citan `remision.ts:218-226`/`:223` **dentro de
  `### 5.1`** (`:353-417` en `67a90c1`), la sección que el delta de `remisiones` **RETIRA** entera. Se resuelven
  solas igual que las siete de Población B que ya caen en esa misma sección — no se reparan aquí.
- `openspec/specs/tickets-core/spec.md:413` en `67a90c1` cita `remision.ts:218-226` dentro de la narrativa
  `:410-415` en `67a90c1` que el delta de `tickets-core` **reescribe entera** (`MODIFIED Requirements`). Repararla en
  el fichero vivo se perdería al fusionar el delta: **no se toca aquí**, la reemplaza 2.3.

- [x] **2.2** Repasar y corregir, contra el `remision.ts` congelado, las citas de:
      `openspec/specs/remisiones/spec.md:31`, `:34`, `:35`, `:152`, `:203`, `:206`, `:222`, `:235`, `:270`, `:295`, `:487` en `67a90c1`, `:491` en `67a90c1`, `:503` en `67a90c1` (13 de las 15 originales; `:379` en `67a90c1`/`:386` en `67a90c1` excluidas, ver arriba) ·
      `openspec/specs/trazas/spec.md:228`, `:231` y `:233` ·
      `openspec/specs/transitions-st/spec.md:575` ·
      `docs/sdd/F0-01_Correcciones_para_el_maestro.md:545`, `:547` y `:549` ·
      `docs/sdd/F0-00_Baseline_as-built.md:173` y `:468` ·
      `docs/sdd/Puntos_para_Gerencia_2026-09-11.md:168` ·
      `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:350` ·
      `docs/superpowers/plans/2026-08-07-ficha-tecnica-modelo.md:31` ·
      `apps/desk/server/services/ticketService.ts:62` (comentario — código que ni `tsc` ni `eslint` ven,
      entra igual) · `CLAUDE.md:277` (fila IV-11, que **se queda**: sólo se renumera la cita, la fila no
      se toca) · `openspec/config.yaml:918` y `:938` (bloque `id: IV-11`, que se queda igual).
      **`openspec/config.yaml:446` y `CLAUDE.md:274` en `79cf09b` NO se tocan aquí**: van dentro de 2.7 y 2.8
      (cierre de IV-4), que les da un tratamiento distinto al simple desplazamiento.

- [x] **2.3** Verificar las citas de `remision.ts` **dentro de los dos deltas de esta misma tanda**
      (`openspec/changes/tercera-puerta-orden-venta/specs/remisiones/spec.md:30-31`, `:35`, `:37` y
      `specs/tickets-core/spec.md:42-43`) contra el `remision.ts` ya construido: describen la posición
      POST-guarda (`:218-226`, `:220`, `:221-225`, `:152-157`, `:223`) y hay que confirmar que coinciden
      con el rango real antes de que el `archive` funda el delta en la spec viva — si no coinciden, se
      corrigen **en el delta**, nunca en la spec vigente (el delta la sustituye al fusionar). ⚠️ El
      alcance de `design.md` §8.3 sólo excluye `proposal.md`/`exploration.md`/`design.md` de esta tanda,
      no sus propios deltas de spec: se nombra aquí para que no se pierda.

### Población B — la que genera 1.4 al borrar `:141-159` y quitar el `.fails` de `:161`

26 líneas distintas medidas (`design.md` §8.4). **8 se resuelven solas** (declaradas, no borradas de la
lista) y **18 son reparaciones reales** (9 Caso C + 9 Caso B), cada grupo con su propia casilla.

- [x] **2.4 [Declarar, no editar]** Las **8 auto-resueltas**, y por qué: `openspec/specs/remisiones/spec.md:368` en `67a90c1`, `:369` en `67a90c1`, `:391` en `67a90c1`, `:393` en `67a90c1`, `:406` en `67a90c1`, `:413` en `67a90c1`, `:414` en `67a90c1` (las siete caen dentro de `### 5.1`, que el delta
      de `remisiones` retira entera) y `openspec/specs/tickets-core/spec.md:414` en `67a90c1` (cae en la narrativa
      `:410-415` en `67a90c1` que el delta de `tickets-core` ya reescribe). No se tocan: desaparecen o se sustituyen
      solas cuando el `archive` funda los deltas.

- [x] **2.5 [Caso C]** `apps/desk/server/remisiones.test.ts:984` (comentario de prueba, CÓDIGO): anclar
      a su revisión y añadir que el `it.fails` de `ordenVentaUnTicket.test.ts:161` ya no existe como tal
      — la prueba pasa a afirmar el `409` en positivo (desde 1.4).

- [x] **2.6 [Caso C]** `openspec/specs/transitions-st/spec.md:581` y `:582`: anclar a su revisión y añadir
      qué cerró el `it.fails` de `:161`.

- [x] **2.7 [Caso C + cierre IV-4, mismo bloque YAML]** `openspec/config.yaml`, bloque `id: IV-4`
      (`:444-508`): (a) Caso C en `:474` (campo `decidido`) y `:485-486` (campo `reasignado`) — anclar a
      su revisión (2026-09-10) y añadir qué lo cerró (`tercera-puerta-orden-venta`, guarda construida en
      1.2); (b) Caso A en `:446` (campo `ubicacion`) — actualizar al rango real de `remision.ts` tras
      1.4; (c) añadir `estado: CERRADO`, `cerrado_por: "tercera-puerta-orden-venta"`,
      `cerrado_verificado_en` (fecha + árbol del commit de R1) y un campo `por_que_esta_cerrado`
      apuntando a `RQ-RE-16` de `remisiones/spec.md` — mismo patrón que los bloques `id: IV-5` e
      `id: IV-6` de este mismo fichero (`:510-516` y equivalente).

- [x] **2.8 [Cierre IV-4 en `CLAUDE.md` — DOS sitios del recuento]** En la tabla de «Incumplimientos
      vivos»: **retirar** la fila
      `| — | apps/desk/server/routes/remision.ts:218-226 escribe salesorder_id... | CONSTRUIBLE desde
      el 2026-09-10... |` (fila 2, hoy `:274` — esto **absorbe** su reparación Caso C de Población B, no
      hace falta repararla aparte). **Añadir**, con el mismo patrón que los párrafos «IV-1/IV-3/IV-5/
      IV-6/IV-7/IV-10 está CERRADO», un párrafo **«IV-4 está CERRADO y ya no cuenta»**: guarda construida
      en `remision.ts` (bloque de la OV, tras el `422` de la orden y antes del `UPDATE`), requisito
      `RQ-RE-16` de `openspec/specs/remisiones/spec.md`, prueba que lo fija
      (`ordenVentaUnTicket.test.ts`, ex-`it.fails`, y la prueba de posición de 1.6).

      ⚠️ **El recuento hay que CAMBIARLO, no verificarlo — y son DOS sitios, no uno.** El encabezado
      `:255` dice **hoy** «**Cinco** desvíos vivos», porque esta misma tanda añadió IV-11. Al retirar la
      fila de IV-4 vuelve a ser **CUATRO**: `valoresTransicion.ts`, `ticketService.ts:39` (clientId),
      `por-entregar-es-espera` (color) e IV-11. **Cuéntalos contra la tabla ya editada**, no de memoria.

      ⚠️ Y el párrafo de `:259-262` —«*Eran **cuatro** hasta el 2026-09-16.* El quinto … (IV-11)»—
      **queda descolocado**: tras este cierre vuelven a ser cuatro, pero **no los mismos cuatro**.
      **Reescríbelo entero para que cuente las DOS cosas, cada una con su fecha**: el **alta de IV-11**
      el **2026-09-16**, registrada por la propuesta de esta misma tanda —que es lo que llevó el
      encabezado de cuatro a cinco—, y la **baja de IV-4** en la **fecha del commit de R1** (la misma
      que 2.7 escribe en `cerrado_verificado_en`), que lo devuelve a cuatro. Contar sólo el alta deja el
      párrafo afirmando un «quinto» que ya no existe; contar sólo la baja pierde por qué el encabezado
      llegó a decir cinco. Es el mismo modo de fallo que la fila que estamos retirando: un registro que
      sigue diciendo lo que era cierto ayer.

      ⚠️ **Esta casilla se QUEDA** (decisión de Gerencia, 2026-09-16) y cubre **los dos sitios**. No se
      da por cubierta por 2.7: 2.7 cierra IV-4 en `openspec/config.yaml`, y el recuento de `CLAUDE.md`
      es otro fichero, con encabezado (`:255`) y párrafo (`:259-262`) que se editan por separado.

- [x] **2.9 [Caso B]** `docs/sdd/Decisiones_Gerencia_2026-09-10.md:137` y `:138` (`:138` sólo sale por
      abreviada): anclar en su revisión (2026-09-10), **sin renumerar** — son ciertas en su momento, no
      hoy.

- [x] **2.10 [Caso B]** `docs/sdd/F1B-01_Serial_llave_de_entrada.md:142`, `:143`, `:222` y `:223` (`:142` y
      `:222` sólo salen por el texto «`it.fails`»): anclar en su revisión, **sin renumerar**.

- [x] **2.11 [Caso B]** `docs/sdd/Puntos_para_Gerencia_2026-09-11.md:173` y `:177`: anclar en su revisión
      (2026-09-11), **sin renumerar**.

- [x] **2.12 [Caso B, ya correcta — declarar]** `docs/sdd/R08.3_Expediente_de_cambios.md:321`: **ya
      ancla** («contra `6be9cf0`»). Comprobar que sigue siendo exacta y declararla correcta de fábrica;
      no necesita edición.

- [x] **2.13 [Verificación IV-11]** Confirmar que el registro de IV-11 (ya presente:
      `CLAUDE.md:277` fila de «Incumplimientos vivos», y `openspec/config.yaml` bloque `id: IV-11`,
      `:916-…`) queda consistente **después** de 2.2 (renumeración de su cita a `remision.ts`) y de 2.8
      (retirada de la fila de IV-4, que no debe arrastrar ni duplicar la fila de IV-11). No se crea
      registro nuevo: sólo se verifica que el ya existente sobrevive intacto y bien anclado.

- [x] **2.14 [Citas rotas que introdujo ESTA tanda — tipo NUEVO, fuera del inventario de 26 + 31]**
      Las **nueve** citas de este mismo `tasks.md` que el detector da por **bloqueantes** con el motivo
      «fichero inexistente», en las líneas **163, 165, 166, 172, 177, 200, 241, 245 y 248**. El defecto
      es de **ESCRITURA, no de desplazamiento**: llevan **varias citas dentro de UN SOLO par de
      acentos** —la ruta y, detrás, dos o más números de línea separados por comas, todos dentro del
      mismo par—, y el detector cosecha **todo** el contenido del acento como nombre de fichero, comas
      incluidas, y lo da por inexistente. **No están en el inventario de 26 + 31** de `design.md` §8.3
      y §8.4: las introdujo esta misma tanda al escribir `tasks.md`, así que 2.1 no las vio.
      **Reparación:** cada cita en **su propio par de acentos**, o las adicionales **en prosa** («y
      también las líneas 231 y 233»). ⚠️ **NO se añade NADA a la línea base**: está en **0** desde que
      se cerró IV-10, sólo encoge, y reabrirla sería el peor arreglo posible. Las líneas de esta
      reparación **CUENTAN** en la medida del intento.

- [x] **2.15 [Cierre de R2]** `npm test` → verde (sin código tocado, sólo para confirmar que nada se
      rompió). **Y la condición dura, que no es `npm test`:**
      `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit de R2>` → **0 bloqueantes y
      código de salida 0**. Medido sobre `79cf09b` el 2026-09-16 salía con **código 1 y 20
      bloqueantes**, nueve de ellos los de 2.14. El detector **NO basta por sí solo**: `remision.ts`
      sólo crece, así que ninguna cita desplazada cae en línea vacía y el detector pasaría con citas ya
      mintiendo. **Lectura manual, cita a cita**, de las tareas 2.2 a 2.14 contra el fichero final, con
      el informe del detector como ayuda, no como sustituto.

---

## Rebanada R3 · Remediación del CRITICAL del `sdd-verify` (intento/commit 3)

**Por qué existe esta rebanada, dicho sin adornos.** El `sdd-verify` de `f9c85de` salió **`fail`** con un
CRITICAL: el delta `openspec/changes/tercera-puerta-orden-venta/specs/remisiones/spec.md:74` declara con
**SHALL** el escenario «Reenviar la misma orden al propio ticket no se rechaza a sí mismo» y **ninguna
prueba lo ejercita**. Los tres `it` de `apps/desk/server/ordenVentaUnTicket.test.ts` (`:118`, `:136`,
`:161`) dicen los tres «rechaza con 409 una orden que ya está en otro ticket», y las cinco llamadas con
`salesOrderId` de `apps/desk/server/remisiones.test.ts` no reenvían a un ticket su propia orden.

**El hueco NO es de la ejecución, es del plan.** Las casillas 1.1 a 1.6 planificaron el `409`, la fusión
D1 —una prueba por puerta— y la prueba de posición. **Ninguna planificó una prueba para el escenario 3**,
así que el `apply` no se la saltó: nunca se la pidieron. La casilla que sigue es la que faltaba, y se
escribe aquí para que **la cuenta de casillas refleje el trabajo real** en vez de esconder el hueco en el
registro del `apply`.

- [x] **3.1 [La prueba que faltaba — escenario 3 de RQ-RE-16]** En
      `apps/desk/server/ordenVentaUnTicket.test.ts`, dentro del `describe` de la puerta 3, un `it` nuevo:
      un ticket **cuya orden de venta YA es la que llega en la remisión** (reintento de red, doble clic).
      Afirma **`201`**, que **NO** hay `409`, y que el `UPDATE` es **no-op**: `orden_venta`,
      `fecha_orden_venta` y `salesorder_id` valen **lo mismo** después que antes. El fixture necesita
      serial —o equipo del catálogo— para no chocar con el `422` del serial, que va por encima.

- [x] **3.2 [Mutación M-c — el rojo que sí existe]** ⚠️ Bajo `strict_tdd`, la prueba de 3.1 **NACE
      VERDE**, porque la exclusión ya está construida. **No se declara un rojo que no existe.** Lo que se
      declara es la MUTACIÓN que la pone roja: **quitar el tercer argumento (`ticketId`) de la llamada a
      `ticketConOrdenVenta` en `apps/desk/server/routes/remision.ts:230`** → la prueba de 3.1 **debe**
      ponerse **ROJA con un `409`**. Se deja **el literal exacto** del mensaje de fallo en el registro.
      Restaurar y comprobar la reversión con `git diff --exit-code` sobre `remision.ts`, que tiene que
      salir **limpio**. Es la regla de mutación 1 de `CLAUDE.md` aplicada al argumento en vez de a la
      posición.

- [x] **3.3 [La cita incoherente del delta]** En
      `openspec/changes/tercera-puerta-orden-venta/specs/remisiones/spec.md`, **línea 79**: la cita
      abreviada del `WHERE` del `UPDATE` dice la línea **223** —donde estaba antes de R1— mientras la
      **línea 37 del mismo documento** ya dice la **237**, que es la correcta hoy. **El mismo documento
      sitúa el mismo `WHERE` en dos sitios.** No la caza el detector, porque la forma abreviada es
      informativa y no bloquea; la caza **contrastar las citas del documento entre sí**. Corregir a la
      237, en su misma línea física.

- [x] **3.4 [Cierre de R3]** `npm test` → **0 fallos**, `npm run typecheck` y `npm run lint` limpios, y
      la condición dura: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <commit de R3>` →
      **0 bloqueantes, código de salida 0**, con la línea base en **0 informadas · 0 caducadas**, que no
      se toca. `apply-progress.md` recoge la remediación **y a quién pertenecía el hueco**.

---

## Notas de cierre para `sdd-apply`

- El orden R1 → R2 no se invierte: R2 depende de que R1 haya congelado el desplazamiento real de
  `remision.ts` (1.4). No se adelanta ninguna tarea de R2 antes de cerrar 1.9.
- Ningún archivo de `apps/desk/src/**` se toca (regla invariable 13, `design.md` §6: la fila 2 de la
  tabla —el filtro `soloLibres`— pasa de guarda a comodidad legítima sin tocar el cliente).
- `packages/zoho-sync/src/db/repo.ts` no se toca: `ticketConOrdenVenta` se reutiliza tal cual.
