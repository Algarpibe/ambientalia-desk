# Apply-progress — `tercera-puerta-orden-venta` (desvío IV-4)

> Estado de tareas a fecha de hoy (2026-09-16, tras los intentos R1, R2 y R3): **28 de 28**
> (`1.1`–`1.9`, `2.1`–`2.15` y `3.1`–`3.4` hechas). R2 cerró su condición dura por decisión de
> Gerencia (anclar los seis bloqueantes que quedaban, ver más abajo). R3 remedia el CRITICAL que
> devolvió el `sdd-verify` de `f9c85de`. Este fichero fusiona el progreso encima de la pre-siembra
> original, de R1 y de R2 — no los sobrescribe.

## Rebanada R1 · La guarda — CERRADA el 2026-09-16 (intento/commit 1)

Secuencia de rojos ejecutada tal cual `design.md` §5 / `tasks.md` la definió, sin reordenar ninguna
casilla y sin dejar ninguna mutación aplicada al cierre:

| Tarea | Resultado |
|---|---|
| 1.1 [RED] | Quitado el `.fails` de `ordenVentaUnTicket.test.ts:161`. Rojo confirmado **exclusivamente** por `expected 201 to be 409` |
| 1.2 [GREEN] | Guarda `ticketConOrdenVenta` insertada en `remision.ts`, entre el `422` de la orden y el `UPDATE` (D2+D3). El bloque de la OV pasa de `:218-226` a `:218-240` (+14 líneas reales, no +11 estimadas) |
| 1.3 | `npm test` completo: ex-`it.fails` VERDE; `:141-159` ROJA por `expected 409 to be 201` (mutación deseada); ninguna otra prueba cayó (1130 verdes / 1 roja / 2 skip) |
| 1.4 [FUSIÓN D1] | Borrada `:141-159`; cabecera reescrita por tramos (Caso A/B/C); `describe` de la puerta 3 retitulado sin el paréntesis «la que no comprueba nada». `npm test` → todo verde (3/3 en el fichero) |
| 1.5 | Cinco citas re-ancladas: `:19`→`ticketService.ts:132-136` (A); `:20`→`remision.ts:218-240` (A, en el tramo del mapa); `:23`→`ticketService.ts:45,:134` en `b99d47a` (C, con qué lo cerró); `:24`→`remision.ts:223` en `b99d47a` (C, con nota de que hoy el WHERE, `:237`, queda ADEMÁS y no en lugar de); `:136`→`remision.ts:237` (A, doc del fixture) |
| 1.6 [RED→GREEN, D4] | Prueba de posición nueva al final de `remisiones.test.ts`, fixture propio (sin `equipo_id` ni serial, con `client_id`). VERDE al primer intento (54/54 en el fichero) |
| 1.7 [Mutación M-a] | Guarda subida con su prelusión por encima del 422 del serial (temporal). Prueba de posición → ROJA `expected 409 to be 422`; M5 → VERDE (solapamiento cero verificado). Revertido |
| 1.8 [Mutación M-b] | Guarda del serial bajada por debajo del bloque de la OV (temporal). Prueba de posición → ROJA `expected 409 to be 422`; M5 → ROJA (columnas escritas pese al rechazo). Las dos mutaciones revertidas; `npm test` → 1131 verdes / 0 rojas / 2 skip |
| 1.9 | `npm test`, `npm run typecheck`, `npm run lint` → los tres verdes (lint: 0 errores, sólo warnings preexistentes de `no-explicit-any` en ficheros no tocados por esta tanda) |

**Desviación respecto al contrato, declarada:** ninguna. El diseño (D1–D4, §5) se siguió literalmente.
La única corrección de cifra fue la propia (el bloque de la OV creció 14 líneas, no 11): no cambia
ninguna decisión, sólo el número exacto que las citas de 1.5 usan.

**Alcance de R1 respetado:** no se tocó ninguna casilla `2.x`; no se tocó `apps/desk/src/**`; no se
tocó `packages/zoho-sync/src/db/repo.ts`; no se corrió `sdd-verify` ni `sdd-archive`.

---

## Rebanada R2 · El barrido de citas + registro de IV-4/IV-11 — CERRADA el 2026-09-16 (intento/commit 2)

`remision.ts` **no se tocó** (congelado por 1.4). Todo lo de abajo es prosa/comentarios; ninguna
aserción `expect(...)` se tocó.

| Tarea | Resultado |
|---|---|
| 2.1 [Segundo pase] | Repetidos los dos `git grep` de `design.md` §8.3/§8.4 sobre el árbol de 1.4, más pase manual de forma abreviada en los ficheros que ya citan cada módulo. Alcance respetado (`apps/**`, `packages/**`, `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/**`, `docs/**`; fuera `openspec/changes/archive/**` y `proposal.md`/`exploration.md`/`design.md` de esta tanda) |
| 2.2 | **13 líneas** de `openspec/specs/remisiones/spec.md` recalculadas contra el `remision.ts` real. **Hallazgo no anticipado por `design.md` §8.3**: varias (`:31`,`:35`,`:152`,`:203`,`:206`,`:222`,`:235`,`:270`,`:295`,`:487` en `67a90c1`,`:503` en `67a90c1`) no eran un simple `+14` — venían ya desfasadas **+29 desde F1B-01** (nunca corregidas tras esa tanda), y sólo se detectó comparando el contenido señalado (b99d47a) contra el árbol real, no por aritmética. Verificado con `git show b99d47a:…\|nl` línea a línea antes de fijar cada número. Además: `trazas/spec.md` (3), `transitions-st/spec.md` (1), `F0-01_Correcciones_para_el_maestro.md` (3), `F0-00_Baseline_as-built.md` (2, una de ellas con tres números en un solo backtick — reformateada a tres citas separadas), `Puntos_para_Gerencia_2026-09-11.md` (1), `plan R01.1.md` (1), `ficha-tecnica-modelo.md:31` (1, era uno de los 20 bloqueantes de partida), `ticketService.ts:62` (comentario, código), `tickets-core/spec.md:413` (spec viva), `openspec/config.yaml` (2, `:918` y `:938` del bloque IV-11), `CLAUDE.md` (fila IV-11, sólo la cita, hoy `:280` tras 2.8) |
| 2.3 | Deltas de esta tanda verificados contra `remision.ts` real: `specs/remisiones/spec.md` delta `:30-31` (`:218-226`→`:218-240`) y `:37` (`:223`→`:237`); `specs/tickets-core/spec.md` delta `:42` (`:218-226`→`:218-240`, `:221-225`→`:235-239`) |
| 2.4 [Declarar] | 8 auto-resueltas declaradas, no editadas: `remisiones/spec.md:368,369,391,393,406,413,414` (dentro de §5.1, que el delta retira) y `tickets-core/spec.md:414` (dentro de la narrativa que el delta reescribe). Desaparecen o se sustituyen solas al fundir el `archive` |
| 2.5 [Caso C] | `remisiones.test.ts:982-986` reescrito: tiempo pasado, `it.fails` anclado a `b99d47a`, y nota explícita de cierre por `tercera-puerta-orden-venta` (`79cf09b`) |
| 2.6 [Caso C] | `transitions-st/spec.md:580-583` reescrito: confiaba/había/quedaba en pasado, ancla `b99d47a` para el `it.fails` y el `:156-158`, nota de cierre |
| 2.7 [Caso C + cierre IV-4] | Bloque `id: IV-4` de `config.yaml`: `ubicacion` a `:218-240` (Caso A); `decidido` y `reasignado` anclados con nota de qué cerró el `it.fails`; añadidos `estado: CERRADO`, `cerrado_por: "tercera-puerta-orden-venta"`, `cerrado_verificado_en: "2026-09-16, base 79cf09b"` y `por_que_esta_cerrado` (apunta a `RQ-RE-16`), mismo patrón que `IV-5`/`IV-6`. YAML validado con `js-yaml` tras el cambio |
| 2.8 [DOS sitios] | `CLAUDE.md`: retirada la fila de IV-4 de la tabla de «Incumplimientos vivos»; encabezado `:255` de **Cinco** a **Cuatro**; párrafo `:259-262` reescrito contando **las dos cosas con sus fechas** (alta de IV-11 el 2026-09-16 por esta misma propuesta, baja de IV-4 en el commit de R1, `79cf09b`, mismo día); añadido el párrafo **«IV-4 está CERRADO y ya no cuenta»** entre IV-3 e IV-5, mismo patrón que los demás cierres |
| 2.9 [Caso B] | `Decisiones_Gerencia_2026-09-10.md:137-140` reescrito en pasado, `ordenVentaUnTicket.test.ts:141-159` en `b99d47a` y `:161` en `b99d47a` anclados, con nota de cierre por `79cf09b` |
| 2.10 [Caso B] | `F1B-01_Serial_llave_de_entrada.md:141-144` y `:220-224` reescritos en pasado con ancla `b99d47a` y nota de cierre |
| 2.11 [Caso B] | `Puntos_para_Gerencia_2026-09-11.md:173` y `:177` anclados a `b99d47a` con nota de cierre |
| 2.12 [Declarar] | `R08.3_Expediente_de_cambios.md:321` verificada: ya ancla contra `6be9cf0`, correcta de fábrica. Sin editar |
| 2.13 [Verificación] | IV-11 comprobado: una sola fila en `CLAUDE.md` (hoy `:280`), un solo bloque `id: IV-11` en `openspec/config.yaml:930`, consistentes tras 2.2 y 2.8, sin duplicar |
| 2.14 | Las 9 citas de `tasks.md` con varios números dentro de un solo par de acentos (líneas 163,165,166,172,177,200,241,245,248) reescritas con **una cita por par de acentos** |
| 2.15 [Cierre — CONDICIÓN DURA CUMPLIDA tras la decisión de Gerencia, ver nota] | `npm test` → **1131 verdes / 0 rojas / 2 skip** (sin código tocado). Detector sobre el commit final de R2: de los **20** bloqueantes de partida (`79cf09b`) a **0**, código de salida **0**. El primer commit de R2 se quedaba en **6** con salida **1**; Gerencia ordenó anclar los seis y así se hizo |

### 2.15 — los 6 bloqueantes que quedaban, ANCLADOS LOS SEIS por decisión de Gerencia (2026-09-16)

El detector sobre el primer commit de R2 informaba **6** bloqueantes (de los 20 de `79cf09b`), código de
salida 1. Esta sección decía antes que ninguno se reparaba desde `apply` y que los cerraría el `archive`.
**Gerencia decidió lo contrario: se anclan los SEIS, no cuatro** — y el argumento no es de alcance, es de
cadena. El `alcance` de `design.md` §8.3 es un acuerdo de esta tanda; **el hook no lo lee**. Con
cualquiera de los seis vivo no se puede empujar NADA —ni R1, ni R2, ni el `verify-report`, ni el
`archive`—, y el `archive` llega DESPUÉS del empuje: «ya los cierra el archive» dejaba la cadena entera
en local hasta el final.

| # | Dónde | Caso | Ancla puesta |
|---|---|---|---|
| 1 | `proposal.md`, línea 27 | C | a `14b45ee`, donde el bloque existía, más qué lo cerró: `79cf09b`, la fusión D1 |
| 2 | `exploration.md`, línea 174 | C | ídem |
| 3 | `design.md`, línea 32 | C | ídem, en el propio título de D1 |
| 4 | `design.md`, línea 342 | B | a `79cf09b`, que es donde esa fila de `CLAUDE.md` todavía existía. La rompió **la casilla 2.8 de esta misma tanda** al retirar la fila de IV-4: regla de mutación 4 aplicada a la tanda contra sí misma, y así queda escrito en la línea 343 |
| 5 | `openspec/specs/remisiones/spec.md`, línea 391 | C | ídem que 1-3 |
| 6 | `openspec/specs/tickets-core/spec.md`, línea 407 | C | ídem que 1-3 |

**Lo que se dice sin disimularlo, porque Gerencia lo pidió así:** las anclas 5 y 6 son **dos líneas
tiradas**. El `archive` borra esas dos secciones enteras al fundir los deltas —`### 5.1` de `remisiones`
y el requisito 4.2 de `tickets-core`—, así que ese trabajo se pierde. Se hacen igual, y a cambio se
obtiene una cosa concreta y fechada: que `main` vuelva a ser empujable **hoy**, en vez de al final de la
cadena.

Las seis anclas son **neutras en número de líneas**: cada una se escribió dentro de su propia línea
física, que es donde el detector exige que viva el ancla. Ninguna cita ajena se desplazó, así que el
barrido no se muerde la cola.

**Resultado medido sobre el commit final de R2:** `cli.ts --sha HEAD` → **1944 citas comprobadas, 0
bloqueantes, código de salida 0**. Las 12 abreviadas rotas siguen ahí y siguen siendo informativas. **La
línea base sigue en `0 informadas · 0 caducadas` y no se tocó:** reparar era la única salida admitida.
### Autobarrido de `CLAUDE.md` tras 2.8 (regla de mutación 4 aplicada a esta misma tanda)

2.8 INSERTA (párrafo «Dos movimientos…» y párrafo «IV-4 está CERRADO») y BORRA (la fila de IV-4) líneas
de `CLAUDE.md`, que es exactamente el disparador que la regla de mutación 4 de ese mismo fichero exige
barrer. `git grep -rnoE "CLAUDE\.md:[0-9]+(-[0-9]+)?"` tras 2.8 encontró **10** citas vivas: `:171-205`,
`:186-190` y `:249` (tres citas de `citas-verificables/spec.md`, todas ANTES del punto de edición,
intactas) y **cinco** que citaban `:274` o `:277` (la fila de IV-4, retirada, y la fila de IV-11,
desplazada). Reparadas: `apply-progress.md` (dos, con el número real de hoy) y `tasks.md:173` (una,
anclada a `79cf09b` porque describe el estado ANTES del cierre). **Dejadas sin tocar, y declaradas
aquí:** `tasks.md:171` y `:256` siguen citando `CLAUDE.md:277` para la fila de IV-11 — hoy esa fila vive
en `:280` y `:277` es la fila de `valoresTransicion.ts` —, porque son texto de tarea ya ejecutada (el
mismo patrón que el resto de `tasks.md` conserva sus números originales para tareas 1.x cerradas) y el
detector no los marca bloqueantes (la línea 277 tiene contenido, sólo que distinto del que la frase
describe). Y **`design.md`, línea 342**, que cita la antigua línea 274 de `CLAUDE.md` para señalar una
cita que el propio `design.md` esperaba que 2.x renumerara: **no se puede tocar** (`design.md` está
fuera de alcance, anclado a
`14b45ee`), y la decisión real de 2.8 —retirar la fila entera, no renumerar su cita interna— es una
decisión POSTERIOR a `design.md` que lo deja desactualizado por un motivo legítimo. Es un bloqueante
nuevo, nacido de esta misma tanda, y se declara sin maquillar en vez de esconderse.

### Reparaciones adicionales, fuera del inventario de tasks.md pero dentro del mandato de `design.md` §8.1/§8.4

- **`openspec/changes/tercera-puerta-orden-venta/specs/remisiones/spec.md`, línea 92**: la nota de migración citaba la sección 353 a 417 de `remisiones/spec.md` sin calificar el directorio, y el detector la marcaba ambigua/rota (una de las 20 de partida). Al calificar el directorio salió un SEGUNDO defecto, éste sí nuevo de encontrar: la línea 417 está en blanco —separa `### 5.1` de `### 5.2`—, así que el rango real de la sección es 353 a 416. Corregida a `openspec/specs/remisiones/spec.md:353-416` en `67a90c1`. (`design.md`, línea 7, y `tasks.md`, línea 154, repiten la forma abreviada de la sección vieja, no bloqueante y fuera del alcance de esta tanda —`design.md` por estar excluido, `tasks.md` por no ser una tarea asignada— y se dejan como residuo documentado, no como defecto escondido).
- **`openspec/changes/tercera-puerta-orden-venta/specs/tickets-core/spec.md:37-38`** (recuadro copiado verbatim): `design.md` §8.4 asigna esta reparación "en el delta, en R7" sin numerarla como tarea propia. Reescrita en pasado con ancla `b99d47a` y nota de cierre — era una de las 20 bloqueantes de partida.

### Deuda de redacción encontrada y DEJADA SIN TOCAR — fuera del alcance literal de 2.2/2.7/2.8

Varias citas reparadas en 2.2 conservan una prosa que ya no es exacta sobre el PRESENTE (p. ej. «es la
tercera puerta —abierta—» en `remisiones/spec.md:34/491`, «una tercera sin comprobar» en
`Puntos_para_Gerencia_2026-09-11.md:168`, «IV-4 pasa de bloqueado a construible» en el `plan R01.1.md:350`,
la fila «Alta de remisión | No» de `transitions-st/spec.md:575`, y «con una puerta sin comprobar» en el
comentario de `ticketService.ts:62`). `design.md` §8.3 encuadra 2.2 como recálculo de **líneas**, no como
reescritura de contenido, y cada uno de esos sitios queda fuera de los task 2.5–2.11 (Población B) que sí
autorizan reescribir prosa. Se listan aquí explícitamente para que no se lean como olvido: tocar más de
lo que 2.2 pide habría sido la clase de scope creep que este mismo documento pide evitar en otras tandas.

---

## Precondición operativa — RESUELTA el 2026-09-16, y el `apply` puede seguir

`apps/desk/server/ordenVentaUnTicket.test.ts:35-46` declara la **consulta 4.1 del runbook** como
precondición de tapar la tercera puerta, y dice por qué no es un trámite: si alguien en Comercial
descubrió que remisionando sí se puede duplicar una orden, esa es hoy su vía de trabajo, y taparla sin
mirar antes «no arregla un defecto: rompe un flujo real, en producción, sin aviso» (`:42-43`).

Gerencia la ejecutó en `psql` contra producción el **2026-09-16**:

```sql
SELECT salesorder_id, COUNT(*), array_agg(number ORDER BY number)
FROM desk.tickets WHERE COALESCE(salesorder_id,'') <> ''
GROUP BY salesorder_id HAVING COUNT(*) > 1;
```

### Las dos cifras, que van siempre juntas

| Cifra | Valor |
|---|---|
| Filas devueltas (órdenes en más de un ticket) | **0** |
| Población (tickets con `salesorder_id` no vacío en toda la base) | **1** |

### La lectura, que es la parte que importa

**El alcance NO cambia. El `apply` puede seguir.** No hay histórico que romper ni flujo real que cortar.

⚠️ **Pero la precondición se cumple POR VACÍO, no por comprobación.** Con población 1 un duplicado es
aritméticamente imposible: la consulta agrupa por `salesorder_id` y filtra `HAVING COUNT(*) > 1`, y con
un solo ticket en el universo ninguna agrupación puede pasar de uno. Ese `0` **no dice que nadie esté
usando la puerta abierta**; dice que **nadie pudo**.

Es una cifra **sin poder de refutación**. Separarla de su población la convertiría en una afirmación
sobre el sistema, y es una muestra de un caso. Por eso las dos van siempre juntas, aquí y en `proposal.md`
§12.1.

**La ventana en la que ese `0` empieza a significar algo es F1F-03** (`plan:214`, aceptación con
servicios reales), cuando la población deje de ser 1. **No es un destino**: es dónde volvería a verse.

Es la misma población 1 sobre la que se midió **IV-11** (la divergencia `orden_venta`/`salesorder_id`
por sincronización, en la tabla de «Incumplimientos vivos» de `CLAUDE.md` y en
`openspec/config.yaml`), y no es casualidad: las dos cifras miran al único ticket que hoy tiene
`salesorder_id`. Cuando F1F-03 repueble esa columna, **las dos hay que remedirlas**, no sólo una.

---

## Qué NO cambia por esto

- La tercera puerta se construye igual: la decisión de Gerencia (`Decisiones_Gerencia_2026-09-10.md:137-140`)
  no dependía de esta consulta. La consulta protegía al histórico, y no hay histórico.
- Sigue sin poder usarse este `0` para argumentar que la divergencia del sync (IV-11) no ocurre. Es la
  misma población, con la misma advertencia.
- Las tres exclusiones de alcance de `proposal.md` §2 siguen en pie.

---

## Rebanada R3 · Remediación del CRITICAL del `sdd-verify` — CERRADA el 2026-09-16 (intento/commit 3)

**De quién era el hueco, dicho sin adornos.** El `sdd-verify` de `f9c85de` salió `fail` con un
CRITICAL: el delta `specs/remisiones/spec.md:74` declara con `SHALL` el escenario «Reenviar la misma
orden al propio ticket no se rechaza a sí mismo» (RQ-RE-16, escenario 3) y ninguna prueba lo
ejercitaba. **El defecto es de `design.md`/`tasks.md`, no de la ejecución de R1/R2**: las casillas
1.1–1.6 planificaron el `409`, la fusión D1 y la prueba de posición; ninguna planificó una prueba
para el escenario 3, así que R1/R2 no se la saltaron — nunca se les pidió. R3 añade la casilla que
faltaba y la ejecuta.

| Tarea | Resultado |
|---|---|
| 3.1 [La prueba que faltaba] | Nuevo `it` en `ordenVentaUnTicket.test.ts`, dentro del `describe` de la puerta 3 (líneas 178-205): un ticket (`t-propia`) cuya `orden_venta`/`salesorder_id` YA son los que llega la remisión. Afirma `201`, `res.body.error` indefinido, y el `UPDATE` no-op comparando la fila completa (`orden_venta`, `salesorder_id`, `fecha_orden_venta`) ANTES y DESPUÉS con `toEqual` — no sólo el número de filas. Ejecutada: **NACIÓ VERDE** (4/4 en el fichero), tal como anticipaba la propia tarea: la exclusión del propio ticket ya existe en `remision.ts:230` desde R1 |
| 3.2 [Mutación M-c] | Se quitó el tercer argumento (`ticketId`) de `ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId)` en `remision.ts:230`. La prueba de 3.1 se puso **ROJA**, literal exacto capturado: `AssertionError: expected 409 to be 201` en `ordenVentaUnTicket.test.ts:200:24` (las otras 3 pruebas del fichero siguieron verdes: solapamiento cero, igual que las mutaciones M-a/M-b de R1). Revertido el argumento; `git diff --exit-code apps/desk/server/routes/remision.ts` → **código de salida 0**, diff vacío. Regla de mutación 1 de `CLAUDE.md` aplicada al argumento de exclusión en vez de a la posición de la guarda |
| 3.3 [Cita incoherente del delta] | `specs/remisiones/spec.md:79`: la cita abreviada del `WHERE` decía `:223` (dónde estaba ANTES de R1) mientras la línea 37 del mismo documento ya decía `:237` (la correcta, tras R1). Corregida a `:237`, en su misma línea física — sin insertar ni borrar ninguna línea del documento |
| 3.4 [Cierre de R3] | Ver evidencia completa abajo |

### Barrido de citas (regla de mutación 4 de `CLAUDE.md`), disparado por 3.1

3.1 INSERTA 28 líneas en `ordenVentaUnTicket.test.ts` (un fichero muy citado), así que se barrió
`grep -rnoE "ordenVentaUnTicket\.test\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio completo. **23
resultados**, comprobados cada uno contra el fichero final:

- **22 de 23 siguen siendo exactos.** Todas las líneas citadas (155, 157, 158, 161, 172-176 y sus
  rangos) están **antes** del punto de inserción (que entra tras la línea 176, antigua `})` de la
  puerta 3): 3.1 no tocó ni desplazó ni una sola línea de las ya existentes, sólo añadió después.
  Incluye las citas ancladas a revisiones pasadas (`b99d47a`, `6be9cf0`), que ya eran históricas y
  siguen siéndolo.
- **1 de 23 quedó desactualizada por la propia inserción de 3.1, y se REPARÓ — Caso B de la regla de
  mutación 4.** El informe de `sdd-verify` (`verify-report.md`, línea 107) fijaba el rango completo
  del `describe` de la puerta 3 en el fichero de pruebas de la orden de venta, para su propio
  `evidence_revision` (`sha256:f4330d894d879600d06c93f63badc9d37e7e662b2a2a8bd805eab256be62db2c`,
  hash de `f9c85de`). En ese árbol el extremo final de ese rango era el cierre del `describe`; tras la
  inserción de 3.1 esa misma línea física quedó en blanco (separa el `it` viejo del nuevo), y el
  detector la marca bloqueante por extremo final vacío. Cierto en su momento, falso hoy — Caso B—,
  así que la cita se ancló a su revisión (con «en» seguido del hash entre acentos, en la misma línea
  física) en vez de renumerarla: renumerar a la línea de hoy habría estirado el rango fuera del bloque
  que el informe describe, y habría sido una afirmación distinta a la que el informe hizo el día del
  veredicto. La aserción de fondo del informe —el número de línea que afirma el `409`— sigue siendo
  literalmente cierta hoy: no se movió. Es la única línea de `verify-report.md` que esta rebanada
  toca, y sólo para anclar; ningún veredicto, criterio ni evidencia del informe se reescribió.

### Task 3.4 — Evidencia de cierre

| Comprobación | Comando | Resultado |
|---|---|---|
| Suite completa | `npm test` | **1132 passed, 2 skipped, 0 failed** (121 ficheros + 1 skip) |
| Typecheck | `npm run typecheck` | Limpio, sin salida (0 errores) |
| Lint | `npm run lint` | **0 errores, 158 warnings** preexistentes de `no-explicit-any`, en ficheros no tocados por R3 (`packages/zoho-sync/src/**`, mismos que R1 ya declaró) |
| Condición dura (detector), primera pasada | `--sha f2b4e72` (commit de R3 antes de reparar la cita) | **2 bloqueantes, código de salida 1**: uno era esta misma declaración del párrafo anterior, escrita con forma de cita en vez de en prosa (autoinfligido); el otro era `verify-report.md`, línea 107 |
| Condición dura (detector), pasada final | `--sha 95ee3ba` (commit de R3 con la cita de `verify-report.md:107` anclada y esta declaración reescrita sin forma de cita) | **1962 comprobadas, 0 bloqueantes, código de salida 0.** 12 abreviadas rotas, informativas, mismas que R2 |
| Línea base de citas | `apps/desk/server/citas/lineaBase.jsonl` | **Sin tocar — sigue en `0 informadas · 0 caducadas`** |

### Work Unit Evidence (R3)

| Evidencia | Valor |
|---|---|
| Comando de prueba focalizado y resultado exacto | `npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts` → antes de la mutación: **4/4 passed**; con la mutación M-c aplicada: **3 passed / 1 failed**, literal `AssertionError: expected 409 to be 201` en `:200:24`; tras revertir: **4/4 passed** de nuevo |
| Comando/escenario de arnés en tiempo real y resultado exacto | Integración HTTP real vía `supertest` contra la app Express completa (`createApp`) sobre Postgres simulado (`pg-mem`, migraciones reales de `migrate()`): `POST /api/remisiones` con `salesOrderId` igual al que el ticket destino ya tiene → `201`, fila de `tickets` (`orden_venta`, `salesorder_id`, `fecha_orden_venta`) idéntica antes y después (no-op verificado por comparación de fila completa, no sólo del código de estado) |
| Límite de reversión (rollback boundary) | El único cambio de comportamiento reversible de forma aislada es el `it` nuevo de `ordenVentaUnTicket.test.ts` (líneas 178-205) y la corrección de cita en `specs/remisiones/spec.md:79`; ninguno de los dos toca `remision.ts` (la mutación de 3.2 se revirtió antes de commitear, confirmado con `git diff --exit-code` en código de salida 0) ni ningún otro fichero de producción. Revertir el commit de R3 entero deja R1+R2 intactos: no hay dependencia hacia adelante |

### TDD Cycle Evidence (R3)

| Tarea | Fichero de prueba | Capa | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1 | `ordenVentaUnTicket.test.ts` | Integración (HTTP + pg-mem) | ✅ 3/3 (baseline antes de editar) | ⚠️ **No hay RED por ausencia de código** — la exclusión (`remision.ts:230`, tercer argumento) ya la construyó R1; la prueba nace verde, tal como `tasks.md` 3.2 anticipa explícitamente. El ROJO que demuestra que la prueba vigila algo real se obtiene por **MUTACIÓN** en la tarea 3.2, no por TDD clásico | ✅ 4/4, ejecutado | ➖ Escenario único (RQ-RE-16 sólo declara un caso para el reenvío a sí mismo) | ➖ Ninguno necesario |
| 3.2 | (mutación temporal sobre `remision.ts`, sin fichero de prueba propio) | N/A — verificación por mutación, no TDD | N/A | ✅ **Éste es el rojo real**: mutación M-c ejecutada, literal `AssertionError: expected 409 to be 201`, capturado y revertido | N/A (no se escribió código de producción nuevo; se restauró el original) | N/A | N/A |
| 3.3 | `specs/remisiones/spec.md` (prosa/cita) | Documental, no código | N/A | N/A | N/A | N/A | N/A |

**Desviación respecto al ciclo RED→GREEN clásico, declarada:** 3.1 no sigue el orden RED-antes-que-GREEN
porque la producción ya existía (construida en R1, casilla 1.2). `tasks.md` 3.2 ya anticipa esto
explícitamente («la prueba de 3.1 NACE VERDE… no se declara un rojo que no existe») y sustituye el RED
por una prueba de mutación, que es exactamente lo que exige la regla de mutación 1 de `CLAUDE.md`
para una guarda ya construida. No es una tarea saltada: es la forma correcta de probar una exclusión
que ya está en producción.

**Alcance de R3 respetado:** no se tocó ninguna casilla `1.x`/`2.x`; no se tocó
`apps/desk/src/**`; no se tocó `packages/zoho-sync/src/db/repo.ts`; no se corrió `sdd-verify` ni
`sdd-archive`; `remision.ts` no tiene diff neto (la mutación de 3.2 se revirtió antes de commitear).
