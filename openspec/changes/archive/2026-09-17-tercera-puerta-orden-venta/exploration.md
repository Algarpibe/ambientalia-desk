# Exploración — `tercera-puerta-orden-venta` (desvío IV-4)

**Fase:** `sdd-explore` · **Fecha:** 2026-09-16 · **Árbol:** `14b45ee`
**Preflight de sesión** (`openspec/config.yaml:26-30`): `interactive · hybrid · ask-on-risk · 800 · strict_tdd`
**Ledger al abrir:** `gentle-ai sdd-attempt status --change tercera-puerta-orden-venta` → `attempts: []`, `next_action: "begin"`.

> **Alcance de esta fase: SOLO exploración.** No hay propuesta, ni diseño, ni código, ni pruebas.
> Bajo `interactive`, la ronda de preguntas a Gerencia va ANTES de `sdd-propose`.

---

## 1 · El terreno, verificado línea a línea

### Las tres puertas de «una OV, un ticket»

| # | Dónde | Qué comprueba | Vías | Excluye el propio ticket |
|---|---|---|---|---|
| 1 | `apps/desk/server/services/ticketService.ts:45-49` — alta del ticket | `ticketConOrdenVenta(db, { salesorderId, numero: ordenVenta })` | **id + número** | no (el ticket aún no existe) |
| 2 | `apps/desk/server/services/ticketService.ts:132-136` — `habilitar_servicio` | `ticketConOrdenVenta(db, { numero: nuevaOrdenVenta }, id)` | **sólo número** | sí |
| 3 | `apps/desk/server/routes/remision.ts:218-226` — remisión de entrada | **nada** | — | — |

**Las dos puertas vivas NO hablan igual, y eso no estaba en el encargo.** La puerta 1 comprueba por las
dos vías; la puerta 2 sólo por número, porque `plan.columns.orden_venta` es un campo de texto de la
transición y ahí no hay id. Sus mensajes tampoco son idénticos: la puerta 1 usa un `cual` condicional
(`:47`) porque en el alta el número puede faltar; la puerta 2 (`:135`) siempre tiene número y no lo
necesita.

**El ayudante compartido** — `packages/zoho-sync/src/db/repo.ts:330-347`.
Firma `(db, ov: { salesorderId?, numero? }, excluirTicketId?)`. Sin ninguna vía devuelve `null` (`:339`).
La vía por número exige que `orden_venta` no esté vacía (`:338`).

### Lo que hace hoy la puerta que falta

`remision.ts:218-226`: si llega `b.salesOrderId`, resuelve la orden con `getSalesOrder`, responde 422 si
no existe, y ejecuta un `UPDATE` de `orden_venta`, `fecha_orden_venta` y `salesorder_id` condicionado en
el propio `WHERE` a que el ticket no tenga ya orden. Nunca llama a `ticketConOrdenVenta`.

El comentario `:214-216` explica que la condición va en el SQL y no en un `if` previo: para no pisar la
orden que el ticket ya tenga, y para que dos remisiones simultáneas no cuelen cada una la suya.
**Esa condición protege otra pregunta**: mira si el ticket DESTINO ya tiene orden, no si la orden que
llega ya está en otro ticket.

### Las guardas vecinas de `remision.ts`, en su orden real

1. `:127` — 422 de fecha
2. `:152-157` — 422 del serial. El comentario `:144-147` declara **«VA CON LOS OTROS 422 Y ANTES DEL 409»**
3. `:174-183` — 409 de remisión pendiente (saltable con `b.permitirSegunda === true`)
4. `:191-197` — 422 de ítems fuera del checklist
5. `:218-226` — el bloque de la OV
6. `:228-241` — `createRemision`

**Dato que corrige una lectura fácil:** el 422 del checklist ya corre DESPUÉS del 409 de pendiente. El
comentario de `:144-147` fija el orden de la pareja serial/pendiente, no una regla universal «todos los
422 antes de todos los 409» para el manejador entero.

### La decisión que lo legitima

`docs/sdd/Decisiones_Gerencia_2026-09-10.md:137-140`: «el `it.fails` de `:161` **debe ponerse verde**:
la tercera puerta sigue mereciendo construirse. **IV-4 pasa de bloqueado a construible.**»
Recogido ya en `openspec/specs/remisiones/spec.md:360-375` en `67a90c1`.

---

## 2 · Hallazgo adicional, no pedido: la divergencia `orden_venta` / `salesorder_id` por sincronización

Cadena verificada:

1. `packages/zoho-sync/src/db/repo.ts:58-59` — `upsertTicket` sólo se abstiene cuando
   `managed_by_app === true`. Si es `false`, reescribe todas las `TICKET_COLS` (`:44-54`), que incluyen
   `orden_venta` (`:48`) pero **no** `salesorder_id` (ausente de la lista).
2. `remision.ts:218-226` escribe las tres columnas pero **no** pone `managed_by_app = true`.
   `applyTransition` sí lo hace (`repo.ts:271`).
3. `packages/zoho-sync/src/config.ts:88` — `syncIntervalMs` por defecto **180000 ms (3 min)**.

**Consecuencia:** un ticket venido de Zoho (`managed_by_app = false`) al que la remisión le escribe la
orden conserva las dos columnas coherentes sólo hasta la siguiente pasada del sync que lo alcance. En
esa pasada `orden_venta` vuelve a lo que diga Zoho —a menudo nula, porque no hay write-back— mientras
`salesorder_id` sobrevive. La misma fila pasa a decir cosas distintas por sus dos vías, y la vía
«número» de `ticketConOrdenVenta` deja de encontrar ese ticket aunque la vía «id» sí lo encuentre.

*(Hipótesis, no verificada: el criterio exacto de la ventana de «recientes» de `syncRecent`.)*

**Por qué importa aquí:** convierte la elección de vías (§3.2) en una decisión con consecuencia
demostrada por código, no en una preferencia de estilo.

---

## 3 · Las seis preguntas del encargo

### 3.1 · Dónde va la guarda, y qué pasa con la condición del `UPDATE`

La llamada va dentro del bloque de la OV, después de resolver la orden (tras el 422 «Orden de venta no
encontrada») y ANTES del `UPDATE`. El `it.fails` ya fija esa posición como contrato: llamarla después
del `UPDATE` dejaría la orden escrita en los dos tickets igualmente.

**La condición del `WHERE` se queda sin tocar.** Protege una pregunta distinta.

| Caso | Hoy | Recomendación |
|---|---|---|
| (a) OV libre + ticket sin orden | 201, escribe | sin cambios |
| (b) **OV en otro ticket** + ticket sin orden | **201, la duplica — el defecto IV-4** | **409, no se llega al `UPDATE`** |
| (c) OV libre + ticket CON orden propia distinta | no-op silencioso: la condición no casa, responde 201 sin aviso | **no tocarlo en esta tanda**, pero nombrarlo en el diseño para que no se lea como olvido |
| (d) OV que ya es la del propio ticket (reconfirmación) | no-op | **excluir el propio ticket**, como la puerta 2 |

Sobre (c): el cliente ya pinta el campo en gris cuando el ticket trae orden (`remision.ts:214-216` lo
declara), así que sólo ocurre por carrera o por cliente HTTP directo. Cambiar su respuesta es una
decisión de UX que el encargo no pide.

Sobre (d): sin la exclusión, un reenvío de la misma OV al mismo ticket (reintento de red, doble clic) se
rechazaría a sí mismo con un 409 sin sentido.

### 3.2 · Por qué vías comprobar: **las dos**

La remisión trae `b.salesOrderId` y resuelve el número con `getSalesOrder`, así que las dos vías están
disponibles sin coste extra. El propio comentario del ayudante ya avisa del caso asimétrico
(`repo.ts:322-324`: «no siempre hay `salesorder_id` … los tickets venidos de Zoho o creados tecleando
el número únicamente tienen `orden_venta`»), y el hallazgo de §2 añade el caso simétrico: un ticket
puede quedarse sólo con `salesorder_id`.

**Recomendado:** llamar con las dos vías y con el propio ticket excluido.

### 3.3 · Código y mensaje

**409**, estilo puerta 2: el mismo texto que `ticketService.ts:135`, nombrando la orden y el número del
ticket que ya la tiene. El `cual` condicional de la puerta 1 no hace falta: el 422 previo garantiza que
la orden existe y trae número.

El `it.fails` (`ordenVentaUnTicket.test.ts:172-175`) sólo exige que el error contenga `7001` y que la
orden se quede donde estaba; los dos formatos lo satisfarían, pero el de la puerta 2 es el consistente.

**Nota de estilo obligatoria:** `remision.ts` responde con `res.status(...).json(...); return` en todo el
fichero, no con `throw new HttpError(...)` como `ticketService.ts`. El 409 nuevo sigue el patrón de su
fichero, no el de las otras dos puertas.

### 3.4 · La POSICIÓN, y la prueba que hoy falta (regla de mutación 1)

La posición no es una elección: la guarda necesita la orden resuelta, que sólo existe en ese bloque, así
que queda detrás de las cuatro guardas anteriores sin mover nada. **Lo que hay que probar es que esa
precedencia se mantiene**, y hoy no hay ninguna prueba que active el 422 del serial y el 409 nuevo a la
vez.

`remisiones.test.ts:990-1005` (M5) prueba el 422 del serial contra la condición silenciosa del `UPDATE`,
no contra `ticketConOrdenVenta`: su ticket no tiene competencia por la OV.

**Prueba que falta:** ticket destino SIN serial (ni equipo con serial) **más** una OV que ya pertenece a
otro ticket. Se afirma **422 «Falta el serial», no 409**, que el ticket dueño sigue siendo el único, y
que el destino sigue con las tres columnas vacías. Sólo se rompe si alguien invierte el orden real.

Secundarias, no bloqueantes: la pareja equivalente contra el 422 del checklist, y otra contra el 409 de
remisión pendiente (para fijar qué 409 gana cuando los dos aplican). Ninguna tiene precedente textual
declarado como el de serial/pendiente.

### 3.5 · Otras vías de escritura

Barrido sobre `orden_venta` y `salesorder_id`, contrastado dos veces:

| Vía | Veredicto |
|---|---|
| `packages/zoho-sync/src/db/repo.ts:385-387` — `createTicket` | detrás de la puerta 1 |
| `packages/zoho-sync/src/db/repo.ts:271-279` — el `UPDATE` dinámico de `applyTransition` (`orden_venta` está en `PROMOTED_COLUMNS`, `:48`) | detrás de la puerta 2 |
| `packages/zoho-sync/src/db/repo.ts:56-68` — **`upsertTicket`, el sync** | **cuarta vía real.** No ASOCIA por decisión de nadie, pero puede DESASOCIAR en silencio. Ver §2. Fuera de alcance |
| `apps/desk/server/db/backfillFechaOrdenVenta.ts:51` | sólo `fecha_orden_venta`. No es puerta |
| `backfillEquipoId.ts`, `backfillSerial.ts`, `db/resolutions.ts` | sus `UPDATE` sobre `tickets` no tocan columnas de OV |
| `/api/remisiones/:id/enviar` y `remisionWebhook.ts` | generan documento y disparo a n8n; no escriben en `tickets` |
| `apps/hub-sync/src/*.ts`, `routes/admin.ts` | sin resultados |
| `orden_venta_final` | **no existe.** Sólo `fecha_orden_venta_final`, una fecha sincronizada sin escritor propio en la app |

### 3.6 · Pruebas: inventario y carencias

**Hay hoy** (`npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts` → 4 passed, 2026-09-16):

- `ordenVentaUnTicket.test.ts:97-113` — puerta 1, verde
- `ordenVentaUnTicket.test.ts:115-133` — puerta 2, verde
- `ordenVentaUnTicket.test.ts:141-159` en `14b45ee` (bloque retirado por `79cf09b`, fusión D1) — puerta 3, el daño fijado **en positivo** (201, y la orden en los dos tickets)
- `ordenVentaUnTicket.test.ts:161-176` — el `it.fails` esperando 409
- `remisiones.test.ts:990-1005` (M5) — el 422 del serial sin dejar nada escrito

**Rojo de partida bajo `strict_tdd`:** quitar el `.fails` de `:161` y verlo rojo **por «expected 201 to
be 409»**, no por otro motivo.

**Falta:** la prueba de posición de §3.4. Ojo: escrita hoy pasaría en verde por el motivo equivocado
—hoy el bloque de la OV nunca rechaza nada—, igual que le pasó a M5 con el serial.

**Sin cobertura:** la divergencia de §2. Si Gerencia decide cerrarla, la prueba la demuestra (no la
arregla): ticket no gestionado por la app, la remisión le escribe la OV, una pasada del sync con una
fila de Zoho sin esa orden, y se afirma que `orden_venta` volvió a vaciarse mientras `salesorder_id`
sigue con el valor viejo.

---

## 4 · Citas caducas en el propio fichero de pruebas (regla de mutación 4)

**Cinco**, todas Caso B (ciertas al escribirse, falsas hoy), todas en `ordenVentaUnTicket.test.ts`:

| Línea | Dice | Hoy |
|---|---|---|
| `:19` | `ticketService.ts:99-102` (puerta 2) | `:132-136` |
| `:20` | `remision.ts:189-197` (puerta 3) | `:189-197` **es hoy la guarda del CHECKLIST**, otro bloque. La puerta 3 está en `:218-226` |
| `:23` | `ticketService.ts:45` y `:100` | `:45` sigue bien; `:100` → `:134` |
| `:24` | `remision.ts:194` | `:223` |
| `:136` | «el `WHERE` de `remision.ts:194`» | `:223` |

`openspec/config.yaml` y `openspec/specs/remisiones/spec.md:377-399` en `67a90c1` ya llevan las correctas, y hasta
anotan el corrimiento. Sólo el test conserva las viejas. **Ninguna la caza un detector automático**:
`:23`, `:24` y `:136` van en prosa o en forma abreviada.

Re-anclarlas debe ser la **última** tarea del apply, cuando se conozca el desplazamiento final.

---

## 5 · Regla invariable 13 — no hay espejo nuevo

El único contacto con `apps/desk/src` es `CrearRemision.tsx:75` y el desplegable que consume
`searchSalesOrders(soloLibres)`: una lista pre-filtrada, no una decisión de negocio duplicada. Es el
mismo patrón «comodidad, no guarda» que `repo.ts:322` ya declara para las puertas 1 y 2. Cerrar IV-4 no
introduce espejo, y no hace falta tocar el cliente.

---

## 6 · Enfoques comparados

| # | Enfoque | Pros | Contras | Esfuerzo |
|---|---|---|---|---|
| **1** | **Las dos vías, excluyendo el propio ticket, 409 estilo puerta 2** | cierra el hueco de §2; consistente con la puerta 1; reutiliza el ayudante sin tocarlo | ninguno relevante: mismo coste | Bajo |
| 2 | Sólo por número, como la puerta 2 | más fácil de justificar por analogía | deja fuera al ticket cuya `orden_venta` borró el sync pero conserva `salesorder_id` — §2, demostrado por código | Bajo |
| 3 | Mover el bloque de la OV a otra posición | — | no lo pide el encargo ni la decisión; tocaría guardas fuera de alcance | — |

**Recomendado: enfoque 1.**

---

## 7 · Presupuesto (regla del ciclo 2)

El ledger mide `git diff --shortstat --no-renames`: un `git mv` cuesta el doble de las líneas movidas.

- **Apply:** `remision.ts` ≈ +8/+12 · `ordenVentaUnTicket.test.ts` (invertir el `.fails`, reparar cinco
  citas, prueba de posición) ≈ +50/+70 · delta de `remisiones/spec.md` ≈ +30/+50 · artefactos SDD
  ≈ 200/300. **Total ≈ 290/430 — cabe holgado bajo 800.**
- **Archive:** carpeta previsible ≈ 830/1450 líneas, doblada por el `--no-renames` ≈ 1660/2900, más la
  fusión del delta (se MIDE, no se estima) y el `archive-report` (precedentes reales: 110, 125, 148,
  181, 240, 264). **Total ≈ 1800/3300 — por encima del techo de 800.**

**Necesita techo específico de Gerencia para el `sdd-archive`**, como `detector-citas-extremos` el
2026-09-16. Sugerido 2500-3000, a confirmar midiendo en un worktree aislado antes de archivar.

---

## 8 · Ronda de preguntas — RESUELTA el 2026-09-16

Las cuatro se plantearon a Gerencia en la ronda previa a `sdd-propose` que exige el modo `interactive`.
Respuestas, que son las que la propuesta tiene que respetar:

| # | Pregunta | Decisión |
|---|---|---|
| 1 | La remisión de entrada no aparece en la lista de puntos de captura de `Decisiones_Gerencia_2026-09-10.md:156-164`. ¿Qué es? | **Tercer punto de captura legítimo.** La lista quedó incompleta por omisión, no por decisión. Se construye la guarda; el delta de spec corrige la lista. El alcance de la tanda es el previsto |
| 2 | `:147-150` fija como destino una tabla propia con `salesorder_id` como `PRIMARY KEY`, que jubila las tres guardas de aplicación. ¿Construir la tercera ahora o esperar? | **Construir ahora igualmente**, aceptando que se retirará cuando llegue la tabla. Es lo que `:137-140` ordena literalmente, y evita la ventana sin protección |
| 3 | La divergencia `orden_venta`/`salesorder_id` por sincronización (§2): ¿se corrige, y dónde? | **Fuera de esta tanda.** Se registra como desvío aparte, con su medición y sin destino inventado. ⚠️ **Esto convierte la recomendación de §3.2 —comprobar por las DOS vías— en requisito, no en preferencia**: es lo único que mantiene la guarda en pie mientras la divergencia siga viva |
| 4 | Techo de líneas para el `sdd-archive` (§7) | **Medir primero, pedir después.** La tanda abre con el techo de 800 del preflight, que basta para todo menos el archive; antes de archivar se mide el coste real en un worktree aislado y se pide el número exacto |

**Consecuencia para `sdd-propose`:** el enfoque 1 de §6 queda fijado, y su parte de «las dos vías» pasa
de recomendación a requisito por la respuesta 3. La corrección de la divergencia del sync y el caso (c)
de §3.1 quedan explícitamente FUERA del alcance.

---

## 9 · Riesgos

- El caso (c) queda como no-op silencioso sin cobertura, y esta tanda no propone cubrirlo.
- Si se elige el enfoque 2, la guarda nace con el agujero de §2 — demostrado, no hipotético.
- El `sdd-archive` no cabe en 800.
- Las cinco citas caducas seguirán acumulando desfase si no se re-anclan al cierre.
