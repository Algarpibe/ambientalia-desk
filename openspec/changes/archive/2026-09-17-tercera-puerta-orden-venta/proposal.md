# Propuesta — `tercera-puerta-orden-venta` (desvío IV-4)

**Fase:** `sdd-propose` · **Fecha:** 2026-09-16 · **Árbol:** `14b45ee`
**Preflight de sesión** (`openspec/config.yaml:26-30`): `interactive · hybrid · ask-on-risk · 800 · strict_tdd`
**Fuente en el maestro:** **M4.4** — `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:2071-2079`
(las tres variantes reales de orden de venta y la frase «Punto abierto nº 52»), y el **Anexo D nº 52**,
`R08.1.md:4058-4061`, cuya columna de apartado remite a M4.4 (`:4060`).
**Entrada:** `openspec/changes/tercera-puerta-orden-venta/exploration.md`. La ronda de preguntas que exige
el modo `interactive` se cerró el 2026-09-16 (§8 de la exploración): esta propuesta la respeta y no la reabre.

---

## 1 · Intención

La regla «una OV, un ticket» tiene **tres** puertas y sólo **dos** la comprueban.

| # | Dónde | Qué comprueba | Vías |
|---|---|---|---|
| 1 | `apps/desk/server/services/ticketService.ts:45-49` — alta del ticket | `ticketConOrdenVenta` → `409` | id + número |
| 2 | `apps/desk/server/services/ticketService.ts:132-136` — `habilitar_servicio` | `ticketConOrdenVenta` → `409` (`:134` la llamada, `:135` el mensaje) | **sólo número** |
| 3 | `apps/desk/server/routes/remision.ts:218-226` — remisión de entrada | **nada** | — |

La tercera escribe `orden_venta`, `fecha_orden_venta` y `salesorder_id` con un `UPDATE` (`:221-225`) cuya
única condición es `WHERE id = $1 AND COALESCE(orden_venta,'') = ''` (`:223`). Esa condición **protege otra
pregunta**: mira si el ticket DESTINO ya tiene orden, no si la orden que llega ya está en otro ticket.

**El daño está medido, no conjeturado.** `apps/desk/server/ordenVentaUnTicket.test.ts:141-159` en `14b45ee` —bloque que `79cf09b` retiró al fusionar D1— fija en
positivo el modo de fallo: `201` sin error de ningún tipo (`:153-154`) y la orden en los **dos** tickets por
sus dos vías (`:158`). Al lado, el `it.fails` de `:161-176` deja escrito el contrato de la corrección: `409`,
mensaje que nombre el ticket `7001` (`:172-173`) y la columna sin escribir (`:175`).

**Por qué ahora.** `docs/sdd/Decisiones_Gerencia_2026-09-10.md:137-140` ordena literalmente que «el `it.fails`
de `:161` **debe ponerse verde**… **IV-4 pasa de bloqueado a construible**». Está recogido en `plan:350`
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:350`) y en `openspec/specs/remisiones/spec.md:353-399` en `67a90c1`.

---

## 2 · Alcance

### Entra

1. **La tercera puerta.** Llamar a `ticketConOrdenVenta` (`packages/zoho-sync/src/db/repo.ts:330-347`) por las
   **dos vías** (`salesorderId` + `numero`) y con el **propio ticket excluido**, dentro del bloque
   `if (b.salesOrderId)` de `remision.ts:218-226`, **después** del `422` «Orden de venta no encontrada» (`:220`)
   y **antes** del `UPDATE` (`:221-225`).
2. **Rojo de partida bajo `strict_tdd`:** quitar el `.fails` de `ordenVentaUnTicket.test.ts:161` y verlo rojo
   **por «expected 201 to be 409»**, no por otro motivo.
3. **Invertir la prueba positiva** de `:141-159`, que hoy afirma el defecto.
4. **La prueba de POSICIÓN que hoy no existe** (regla de mutación 1 de `CLAUDE.md`).
5. **Delta de spec** sobre la capacidad `remisiones`.
6. **Re-anclar las cinco citas caducas** de `ordenVentaUnTicket.test.ts` (`:19`, `:20`, `:23`, `:24`, `:136`),
   como **última** tarea del apply.

### NO entra — explícito y a propósito

| Fuera | Por qué |
|---|---|
| La divergencia `orden_venta`/`salesorder_id` por sincronización | Decisión 3 de la ronda. **Se REGISTRA como desvío vivo, no se corrige.** Ver §5 |
| El **caso (c)** de `exploration.md:102`: OV libre + ticket con orden propia distinta, hoy no-op silencioso con `201` | Se nombra para que no se lea como olvido. Cambiar su respuesta es una decisión de UX que nadie ha pedido |
| La guarda equipo↔cliente de `ticketService.ts:65-83` | **IV-8 sigue ABIERTO.** Nº 52 es CARDINALIDAD, no TITULARIDAD (`Decisiones_Gerencia_2026-09-10.md:176-181`). No se usa nº 52 para justificar tocarla |
| Las puertas 1 y 2 | La decisión dice que se quedan (`Decisiones_Gerencia_2026-09-10.md:128-133`) |
| Cualquier cambio en `apps/desk/src` | No hace falta: ver §7 |
| La condición `COALESCE(orden_venta,'') = ''` del `WHERE` (`:223`) | Protege la carrera de dos remisiones sobre el MISMO ticket. Es otra pregunta y se queda intacta |

---

## 3 · Capacidades

### Nuevas
- Ninguna.

### Modificadas
- **`remisiones`**: `POST /api/remisiones` pasa a rechazar con `409` una orden de venta ya asociada a otro
  ticket, antes de escribir nada. El delta sustituye el escenario que hoy fija el defecto
  (`openspec/specs/remisiones/spec.md:401` en `67a90c1` y siguientes) y **corrige por omisión la lista de puntos de
  captura** de `Decisiones_Gerencia_2026-09-10.md:156-164`, que nombra dos («Nuevo ticket» y
  «Habilitar Servicio → Ingresado») y omite la remisión de entrada: según la decisión 1 de la ronda, la
  omisión fue de redacción, no de criterio — la remisión de entrada es un **tercer punto de captura legítimo**.

---

## 4 · Enfoque

**Enfoque 1 de `exploration.md:224`**, fijado por la ronda.

- **Posición.** No es una elección de estilo: la guarda necesita la orden ya resuelta, que sólo existe dentro
  de ese bloque. Queda detrás de las cuatro guardas anteriores —`:127` (fecha), `:152-157` (serial),
  `:174-183` (remisión pendiente), `:197` (checklist)— **sin mover ninguna**.
- **Las dos vías son REQUISITO, no preferencia.** Lo impone la decisión 3 de la ronda: si la divergencia del
  sync queda fuera de la tanda, la guarda tiene que **aguantarla en pie**. Comprobar sólo por número —como la
  puerta 2 (`ticketService.ts:134`)— dejaría fuera al ticket al que el sync le vació `orden_venta` mientras
  `salesorder_id` sobrevivía; ese caso está demostrado por código en §5, no supuesto.
- **El propio ticket, excluido**, como la puerta 2. Sin la exclusión, reenviar la misma OV al mismo ticket
  (reintento de red, doble clic) se rechazaría a sí mismo con un `409` sin sentido.
- **Código y forma.** `409` con el **texto** de la puerta 2 (`ticketService.ts:135`), pero con el **patrón de
  respuesta de su propio fichero**: `res.status(409).json({ error: … }); return`. **No** `throw new HttpError`.
  *Verificado:* `HttpError` no aparece **ninguna vez** en `apps/desk/server/routes/remision.ts` (0 coincidencias).
- **La prueba de posición** (regla de mutación 1): ticket destino **sin serial** —ni equipo con serial— **más**
  una OV que **ya pertenece a otro ticket**. Afirma **`422` «Falta el serial», no `409`**, que ninguna de las
  tres columnas del destino se escribió (`orden_venta`, `fecha_orden_venta`, `salesorder_id`) y que el ticket
  dueño sigue siendo el único. Hoy no existe: `remisiones.test.ts:990-1005` (M5) prueba el `422` del serial
  contra la condición silenciosa del `UPDATE`, no contra `ticketConOrdenVenta` — su ticket no tiene competencia
  por la OV, así que **cero solapamiento**. Es el mismo molde que H3 en `CLAUDE.md`.
- **Las cinco citas caducas** son **Caso B** de la tabla de la regla de mutación 4: **se comprueba cada una en
  la revisión donde fue cierta antes de anclarla**, **sin tocar ninguna aserción**, y **con el ancla en la misma
  línea física**. Ninguna la caza un detector automático: `:23`, `:24` y `:136` van en prosa o en forma abreviada.

---

## 5 · La guarda es TRANSITORIA, y se dice por escrito

`Decisiones_Gerencia_2026-09-10.md:147-150` fija como destino una **tabla propia de la app con `salesorder_id`
como `PRIMARY KEY`**, que convierte «una OV, un ticket» en **restricción de la base de datos** «en vez de tres
guardas de aplicación que hay que mantener sincronizadas». Esta tanda construye **la tercera de esas tres**, y
`:137-140` ordena construirla igualmente para no dejar la ventana sin protección.

**Esto va también en `openspec/config.yaml` (entrada IV-4), y la duplicación es deliberada:** los artefactos de
un cambio archivado no los lee nadie en la sesión siguiente. Un destino que sólo vive en un documento cerrado
**no es un destino** — es el mismo modo de fallo que dejó cuatro desvíos huérfanos al cerrar F1A.

---

## 6 · Hallazgo, fuera de alcance: la CUARTA vía de escritura

`upsertTicket` (`packages/zoho-sync/src/db/repo.ts:56-68`) es una cuarta vía sobre las mismas columnas. **No
ASOCIA por decisión de nadie, pero puede DESASOCIAR en silencio.** La cadena, verificada:

1. `orden_venta` (`repo.ts:48`) y `fecha_orden_venta` (`:50`) están en `TICKET_COLS` (`:44-54`), así que el
   sync las reescribe. **`salesorder_id` está FUERA de esa lista**, porque se añadió después por `ALTER`
   (`packages/zoho-sync/src/db/schema.sql:187`), así que sobrevive.
2. `upsertTicket` sólo se abstiene cuando `managed_by_app === true` (`repo.ts:58-59`). El `UPDATE` de
   `remision.ts:218-226` **no** pone esa bandera; `applyTransition` sí (`repo.ts:271`).
3. El sync corre cada **180000 ms** por defecto (`packages/zoho-sync/src/config.ts:88`).

**Consecuencia:** un ticket venido de Zoho al que la remisión le escribe la orden conserva las dos columnas
coherentes sólo hasta la siguiente pasada del sync que lo alcance; entonces la misma fila pasa a decir cosas
distintas por sus dos vías. **Y afecta también a la puerta 2**, que comprueba sólo por número
(`ticketService.ts:134`): si el sync vacía `orden_venta` y `salesorder_id` sobrevive, la puerta 2 tampoco
encuentra ese ticket. La puerta 1 y la nueva sí, porque miran las dos vías.

Se registra como **desvío vivo** en `CLAUDE.md` y en `openspec/config.yaml`, **sin destino asignado y dicho a
propósito**. Aquí queda como hallazgo del barrido de vías de escritura, no como trabajo de esta tanda.

---

## 7 · Regla invariable 13 — no hay espejo nuevo

El único contacto con `apps/desk/src` es `CrearRemision.tsx:75` —que manda `salesOrderId: ordenVenta?.id`— y
el desplegable que consume `searchSalesOrders(…, soloLibres)` (`apps/desk/src/api/client.ts:271-275`, cuyo
propio comentario de `:271` declara que «deja fuera las órdenes que ya usa otro ticket de Desk»): una lista
pre-filtrada, no una decisión de negocio duplicada. Es el mismo
patrón «comodidad, no guarda» que el comentario de `repo.ts:322-324` ya declara para las puertas 1 y 2.
**Cerrar IV-4 no introduce espejo y no hace falta tocar el cliente.**

---

## 8 · Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `apps/desk/server/routes/remision.ts` | Modificado | +1 llamada a `ticketConOrdenVenta` y +1 respuesta `409`, dentro de `:218-226` |
| `apps/desk/server/ordenVentaUnTicket.test.ts` | Modificado | Quitar el `.fails`; invertir la positiva; añadir la prueba de posición; re-anclar cinco citas |
| `openspec/specs/remisiones/` (delta) | Modificado | Requisito nuevo + corrección de la lista de puntos de captura |
| `packages/zoho-sync/src/db/repo.ts` | **Sin tocar** | `ticketConOrdenVenta` se reutiliza tal cual |
| `apps/desk/src/**` | **Sin tocar** | §7 |

---

## 9 · Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La prueba de posición nace verde **por el motivo equivocado** si se escribe antes que la guarda (hoy el bloque de la OV no rechaza nada), igual que le pasó a M5 con el serial | Alta si no se ordena | Se escribe **después** de la guarda y se valida mutando la POSICIÓN, no sólo la condición |
| Tapar una puerta que alguien esté usando en producción para duplicar OV | Media | `ordenVentaUnTicket.test.ts:35-46` ordena correr la consulta 4.1 del runbook **antes** del código. Dueño fuera del repositorio: ver §12 |
| El `409` bloquea un reenvío legítimo al mismo ticket | Baja | La exclusión del propio ticket, punto 1 de §4 |
| La guarda nace con el agujero de la divergencia del sync si se comprueba sólo por número | Demostrado por código, no hipotético | Las dos vías, §4 |
| Las cinco citas caducas se re-anclan a ciegas y un Caso B se vuelve falso sobre el presente | Media | Caso B de la regla de mutación 4: comprobar en la revisión donde fue cierta, no renumerar |
| El `sdd-archive` no cabe en el techo de 800 | Alta | §11: medir antes en worktree aislado y pedir el techo exacto |

---

## 10 · Rollback

Revertir el commit de la tanda. La guarda es **puramente aditiva**: no cambia ninguna columna, ningún esquema,
ninguna migración ni ningún contrato de respuesta existente — sólo añade una respuesta `409` a un camino que
hoy devuelve `201`. No hay dato escrito que deshacer, así que el rollback es `git revert` y nada más. Las
pruebas revertidas vuelven a su estado de hoy, incluido el `it.fails`, que es exactamente el registro del
defecto sin corregir.

---

## 11 · Presupuesto (regla del ciclo 2 de `CLAUDE.md`)

El ledger mide `git diff --shortstat --no-renames` contra el árbol de partida, más `wc -l` de lo nuevo sin
trackear.

| Fase | Estimado | Contra el techo de 800 |
|---|---|---|
| `apply` | **≈290/430 líneas** | **Cabe holgado** |
| `archive` | **≈1800/3300 líneas** | **NO cabe** |

- ⚠️ **`apply` y `verify` se miden cada uno contra su PROPIO árbol de partida, no acumulados.** La estimación
  de una fase no es el presupuesto de la otra.
- ⚠️ **El informe que `verify` genera es sumando obligatorio de su propia medida**, no un extra. Precedentes
  reales de `verify-report.md` / `archive-report.md`: 110, 125, 148, 181, 240, 264, 358.
- **Antes de archivar** hay que medir el coste real en un **worktree aislado** con
  `git diff --shortstat --no-renames` contra el commit de partida (más `wc -l` de lo nuevo sin trackear) y
  **pedir a Gerencia el techo exacto**. Es la decisión 4 de la ronda: medir primero, pedir después.
- Y **una tanda SDD por árbol de trabajo**: nada de lanzar otra fase SDD en paralelo sobre
  `C:\dev\Desk_2_R1.023`.

---

## 12 · Tareas cuyo dueño está FUERA de este repositorio (regla del ciclo 1)

**No se cuentan como tareas y archivar no las da por hechas.** Ninguna de las tres describe trabajo que una
tanda pueda hacer aquí dentro.

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| ✅ **CUMPLIDA el 2026-09-16** · Correr la **consulta 4.1 del runbook** contra producción antes de tapar la puerta, y decidir sobre lo que devuelva (filas > 0 exige además un plan para quien lo esté usando) | Gerencia | `apps/desk/server/ordenVentaUnTicket.test.ts:35-46`, que la escribe entera; resultado y lectura justo debajo |
| **Techo de líneas del `sdd-archive`**, tras la medición en worktree aislado | Gerencia | §11 de esta propuesta; decisión 4 de `exploration.md:258` |
| **Destino del desvío nuevo** (la divergencia del sync) | Quien decida el alcance | `CLAUDE.md`, tabla de «Incumplimientos vivos», y `openspec/config.yaml` (`incumplimientos_vivos`) |

### 12.1 · Consulta 4.1 del runbook — resultado y cómo hay que leerlo

Gerencia la ejecutó en `psql` contra producción el **2026-09-16**. **Las dos cifras, que van siempre
juntas:**

| Cifra | Valor |
|---|---|
| Filas devueltas (órdenes en más de un ticket) | **0** |
| Población (tickets con `salesorder_id` no vacío en toda la base) | **1** |

**El alcance NO cambia y el `apply` puede seguir.**

⚠️ **Pero la precondición se cumple POR VACÍO, no por comprobación.** Con población 1, un duplicado es
aritméticamente imposible: la consulta agrupa por `salesorder_id` y pide `HAVING COUNT(*) > 1`, y con un
solo ticket en el universo ninguna agrupación puede pasar de uno. Ese `0` **no dice que nadie esté usando
la puerta abierta**; dice que **nadie pudo**. Es una cifra sin poder de refutación, no una prueba de
inocuidad — y escribirla sin esta frase al lado convertiría una muestra de un caso en una afirmación
sobre el sistema.

Lo que el test temía (`ordenVentaUnTicket.test.ts:41-45`: «si alguien en Comercial descubrió que
remisionando SÍ se puede, esa es hoy la vía por la que trabaja») sigue **sin descartar**. Lo que ha
cambiado es que hoy **no hay histórico que romper**, que es lo que la precondición bloqueaba.

**La ventana en la que ese `0` empieza a significar algo es F1F-03** (`plan:214`, aceptación con
servicios reales), donde la población deja de ser 1. **No es un destino**: es dónde volvería a verse.
Es la misma ventana y la misma población 1 que la medición de **IV-11** (`CLAUDE.md`, tabla de
«Incumplimientos vivos»), y no es casualidad: las dos miden sobre el único ticket que hoy tiene
`salesorder_id`.

---

## 13 · Criterios de éxito

- [ ] El `.fails` de `ordenVentaUnTicket.test.ts:161` se quitó y se vio **rojo por «expected 201 to be 409»**,
      no por otro motivo, antes de escribir la guarda.
- [ ] La prueba de `:141-159` está invertida: afirma `409` y ya no describe el defecto como comportamiento actual.
- [ ] La guarda llama a `ticketConOrdenVenta` por las **dos vías** y con el **propio ticket excluido**, después
      del `422` de `:220` y antes del `UPDATE`.
- [ ] El `409` usa `res.status(409).json({ … }); return`, con el texto de `ticketService.ts:135`.
- [ ] La condición `COALESCE(orden_venta,'') = ''` del `WHERE` sigue **intacta**.
- [ ] Existe la prueba de posición, y afirma `422` «Falta el serial» —no `409`— con las tres columnas del
      destino sin escribir.
- [ ] Las cinco citas caducas están re-ancladas como Caso B, sin tocar ninguna aserción, con el ancla en la
      misma línea física.
- [ ] `npm test` en verde y `npm run typecheck` sin errores.
- [ ] `CLAUDE.md` y `openspec/config.yaml` registran el desvío de la divergencia del sync, y el recuento de
      desvíos vivos de `CLAUDE.md` concuerda con la tabla.

---

## 14 · Dependencias

Ninguna técnica. La única precondición operativa era la consulta 4.1 del runbook, que no ejecutaba esta
tanda, y **quedó resuelta el 2026-09-16** con `0` filas sobre población `1` (§12.1). **El `apply` ya no
tiene nada que esperar** — con la salvedad, escrita en §12.1, de que ese `0` se cumple por vacío y no
refuta nada.

Sigue **abierta** la única decisión que bloquea el cierre, y no bloquea el `apply`: el techo de líneas
del `sdd-archive` (§11), que se pide **después** de medir en worktree aislado.
