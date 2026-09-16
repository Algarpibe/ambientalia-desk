# Diseño — `tercera-puerta-orden-venta` (desvío IV-4)

**Fase:** `sdd-design` · **Fecha:** 2026-09-16 · **Árbol:** `14b45ee`
**Preflight de sesión** (`openspec/config.yaml:26-30`): `interactive · hybrid · ask-on-risk · 800 · strict_tdd`
**Entradas:** `proposal.md` (contrato) y `exploration.md` de esta misma carpeta.
**`rules.design`** (`openspec/config.yaml:1159-1161`): no hay ninguna sentencia de creación de tabla en
esta tanda, así que la regla de calificar el esquema no tiene sujeto. La única lectura nueva contra la
base es el `SELECT ... FROM tickets` de `ticketConOrdenVenta` (`packages/zoho-sync/src/db/repo.ts:343`),
sin calificar, **igual que el `UPDATE tickets` que ya vive en `remision.ts:222`**: los dos resuelven a
`desk.tickets` por el `search_path=desk,public` de `packages/zoho-sync/src/db/pool.ts:5`. No se
introduce criterio nuevo.

> **Anclaje de este documento.** Lleva `**Árbol:** 14b45ee` en la cabecera, así que **todas** sus citas
> `ruta:línea` se leen contra esa revisión. No se renumeran después: el encabezado es su ancla.

---

## 1 · Enfoque técnico

Una guarda aditiva de once líneas dentro de un bloque que ya existe. No hay componente nuevo, ni
interfaz nueva, ni migración: se reutiliza `ticketConOrdenVenta` tal cual y se responde con el patrón
de respuesta del propio fichero.

Lo que de verdad decide esta fase no es el `if`: es **el orden**, **la secuencia de rojos que demuestra
que el orden está probado**, y **el barrido de citas que el desplazamiento obliga**. Las tres cosas
valen más líneas que la guarda.

---

## 2 · Decisiones de arquitectura

### D1 · Qué pasa con `ordenVentaUnTicket.test.ts:141-159` (pregunta A)

**Elección: FUNDIRLAS EN UNA. Se BORRA `:141-159` y sobrevive el ex-`it.fails` de `:161-176`.**

| Alternativa | Por qué se rechaza |
|---|---|
| Invertirla en el sitio (pasa a afirmar `409`) | Deja dos `it` con **el mismo montaje y las mismas aserciones**: `409`, `error` con `7001`, `ticketsConLaOrden()` = `{porId:[7001], porNumero:[7001]}`. La única aserción propia de la positiva, `expect(res.body.error).toBeUndefined()` (`:154`), se vuelve absurda cuando el error es justo lo que se espera. Es lo que pide literalmente el paso 4 de la cabecera (`:62-63`), escrito cuando la pareja aún tenía razón de ser |
| Retirar `:141-159` y dejar sólo el ex-`it.fails` | **Es la elegida**, formulada como fusión para que se vea que no se pierde nada |

**Razón, y es del propio fichero.** La cabecera `:48-53` justifica la pareja por un mecanismo concreto:
«un `it.fails` a solas pasa cuando el test falla POR CUALQUIER MOTIVO […]; la positiva afirma lo que HOY
ocurre, así que si mañana rompe otra cosa se pone roja por el motivo correcto». **Esa razón muere con el
`.fails`.** Un `it` normal que afirma `409` ya se pone rojo por el motivo correcto él solo. Mantener dos
sería conservar el andamio después del edificio. Resultado: **tres puertas, tres pruebas**, una cada una,
como ya están la 1 (`:97-113`) y la 2 (`:115-133`).

**Qué pasa con el comentario de cabecera que la razona:** no se borra, se reescribe por tramos, y cada
tramo según lo que afirme (tabla de la regla de mutación 4):

| Tramo | Qué es hoy | Qué se hace |
|---|---|---|
| `:16-20` | el mapa de las tres puertas, con la 3 en `201 ❌` | **Caso A** — pasa a decir la verdad de hoy: la 3 en `409 ✅`, con sus líneas de hoy |
| `:22-34` | «EL DEFECTO, VERIFICADO» + «ESTA TANDA NO LO ARREGLA» | **Caso C** — se conserva con su revisión y se añade qué lo cerró |
| `:35-46` | el aviso de la consulta 4.1 del runbook | **Caso C** — se conserva entero y se le añade el resultado del 2026-09-16: `0` filas sobre **población 1**, con la frase de `proposal.md` §12.1 al lado. Sin esa frase, un `0` que se cumple **por vacío** se leería como prueba de inocuidad |
| `:48-53` | por qué cuatro pruebas y no una | Se reescribe: es exactamente el argumento de D1 |
| `:55-64` | «QUÉ TIENE QUE HACER F1A, EN ESTE ORDEN» | **Caso C** — pasa a «qué se hizo, y en qué orden», con la revisión que lo cerró |
| `:66-71` | «VERIFICADO POR MUTACIÓN al escribirlas» | **Caso C, y es el tramo que nadie mira.** Afirma que *añadir* la llamada pone rojas las dos; con la llamada ya puesta **esa mutación no se puede reproducir**. Se ancla en su revisión y se enuncia la inversa: *quitar* la llamada pone roja la de la puerta 3 |

**El `describe` de `:135`** se titula hoy «la REMISIÓN DE ENTRADA (la que no comprueba nada)». El
paréntesis se vuelve falso en el mismo commit que la guarda: pasa a nombrar la puerta construida. Su
ayudante `ticketSinOrden()` (`:136-139`) **se queda** — lo usa la prueba superviviente — y su doc
contiene una de las cinco citas (§9).

### D2 · El orden dentro del bloque de la OV (pregunta B)

Dentro de `remision.ts:218-226` hoy sólo viven tres operaciones. La guarda es la segunda de cuatro:

```
if (b.salesOrderId) {
  1. getSalesOrder            (:219)   ← resuelve número y fecha contra Books
  2. 422 «Orden de venta no encontrada» (:220)
  3. GUARDA NUEVA → 409                 ← aquí
  4. UPDATE tickets ... WHERE ... COALESCE(orden_venta,'')='' (:221-225)
}
```

**Por qué después del `422` y no antes.** La guarda necesita `ov.number` para la vía «número» y para el
mensaje. Antes del `422`, `ov` puede ser `null`: la vía por número se perdería y la guarda quedaría
reducida a la vía por id — que es exactamente el agujero que la decisión 3 de la ronda prohíbe. Y hay un
motivo de semántica además del técnico: una OV que no existe es **entrada malformada (`422`)**, no un
**conflicto (`409`)**; invertirlo haría que un id inventado contestara «ya está asociada» a nadie.

**Por qué antes del `UPDATE`.** Después, la orden ya está escrita en los dos tickets y el `409` sería un
cartel sobre un daño hecho. Es literalmente el contrato del `it.fails` (`:174-175`).

**Por qué el bloque NO se mueve.** Queda donde está, detrás de las cuatro guardas anteriores —`:127`
fecha, `:152-157` serial, `:174-183` remisión pendiente, `:191-197` checklist— sin tocar ninguna. Mover
el bloque cambiaría **qué error oye el usuario**, que es el daño de H3. Tampoco se adelanta por encima
del `getClient` de `:203`: es una lectura sin efecto, y adelantarla sería mover el bloque.

**El `409` nuevo cae DESPUÉS del `422` del checklist, y eso NO contradice `:144-147`.** Ese comentario
declara «VA CON LOS OTROS 422 Y ANTES DEL 409» para la pareja serial/pendiente. Verificado en el árbol de
hoy: el `409` de pendiente (`:174-183`) **ya corre antes** del `422` del checklist (`:191-197`), así que
no existe ninguna regla universal «todos los 422 antes de todos los 409» en este manejador. Se deja
escrito aquí porque es la primera objeción que levantará cualquiera que lea el comentario de `:144-147`.

**El `WHERE ... COALESCE(orden_venta,'') = ''` (`:223`) se queda intacto**, como fija la propuesta:
responde a la otra pregunta (que no se pise la orden que el destino ya tenga) y protege la carrera de
dos remisiones simultáneas sobre el MISMO ticket.

**Y el porqué de la guarda va en SU PROPIO comentario, no en el del bloque (`:205-217`).** No es gusto:
el comentario del bloque está **por encima** de `:218`, así que engordarlo movería también el principio
del bloque. Dejándolo quieto, `remision.ts:218` **no se mueve** y el barrido de §8.3 se parte en dos
grupos con reparación distinta en vez de desplazarse entero. Una decisión de tres líneas que ahorra
más de treinta.

### D3 · La forma exacta de la llamada (pregunta C)

```ts
const enUso = await ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId)
if (enUso) {
  res.status(409).json({ error: `La orden de venta ${ov.number} ya está asociada al ticket #${enUso.number}` })
  return
}
```

Los tres argumentos, con las variables **que existen de verdad en ese ámbito**:

| Argumento | Valor | Por qué ése y no otro |
|---|---|---|
| `db` | `db` (`remision.ts:29`) | el `Queryable` del `deps` de la ruta |
| `salesorderId` | **`ov.id`**, no `String(b.salesOrderId)` | `ov.id` es el valor que el `UPDATE` escribe como `$4` (`:224`). La guarda tiene que comprobar **el mismo valor que la escritura va a poner**; usar el del cuerpo admite que guarda y escritura hablen de cosas distintas |
| `numero` | **`ov.number`** | `SalesOrderLite.number: string`, no opcional (`packages/shared/src/types.ts:306`); es el `$2` del `UPDATE` (`:224`) |
| `excluirTicketId` | **`ticketId`** (`:122`), el `$1` del `UPDATE` | Reconfirmar la propia OV no es duplicarla. `:123` ya garantiza que no está vacío, así que el `if (excluirTicketId)` de `repo.ts:341` **siempre** se cumple aquí: la exclusión nunca se cae sola |

**Las dos trampas del ayudante, resueltas por construcción:**

- `repo.ts:339` devuelve `null` sin ninguna vía. **Inalcanzable aquí:** estamos dentro de `if (b.salesOrderId)` y `ov.id` viene de la fila, así que la vía por id se añade siempre (`repo.ts:337`) y `vias.length >= 1`.
- `repo.ts:338` exige `COALESCE(orden_venta,'') <> ''` para la vía por número, y `if (ov.numero)` descarta la cadena vacía. Si una OV de Books llegara sin número, la guarda **degrada a una sola vía** en vez de romperse — y sigue en pie por la vía del id, que es la que el sync no borra (IV-11).

**Mensaje y patrón de respuesta.** Texto de `ticketService.ts:135`, sin el `cual` condicional de la
puerta 1 (`:47`): el `422` previo garantiza que la orden existe y trae número. Forma
`res.status(409).json({ … }); return`, **no `throw new HttpError`** — verificado: `HttpError` no aparece
ninguna vez en `apps/desk/server/routes/remision.ts`.

**Import.** `ticketConOrdenVenta` se añade al import que ya existe en `remision.ts:5`
(`import { getTicketWithRefs } from '@ambientalia/zoho-sync/db/repo'`). No hace falta import nuevo.

### D4 · Dónde vive la prueba de posición

**Elección: al FINAL de `apps/desk/server/remisiones.test.ts`, en un `describe` propio inmediatamente
después del de M5 (`:990-1005`).**

| Alternativa | Tradeoff |
|---|---|
| `ordenVentaUnTicket.test.ts` | Gana el ayudante `ticketsConLaOrden()` (`:88-95`). Pierde lo importante: queda **lejos de su gemela**. M5 y ella prueban las **mismas dos guardas** por lados distintos —M5 por lo que queda escrito, ésta por qué error se oye—, y separarlas reproduce la distancia que escondió el hueco de H3. Además obliga a insertar en medio del fichero, con su desplazamiento |
| **`remisiones.test.ts`, pegada a M5** | **Elegida.** M5 ya nombra IV-4 y el `it.fails` en su cabecera (`:982-986`): es donde esta conversación ya vive. Y al ir **al final del fichero** (hoy termina en `:1006`) **no desplaza ni una cita existente**, que bajo la regla de mutación 4 es un ahorro real. El coste es rehacer la aserción de las tres columnas, que es justo el idioma de M5 (`:1002-1004`) |

---

## 3 · Flujo de datos

```
POST /api/remisiones
   │
   ├─ 422 ticket / fecha ................................. :123-127
   ├─ 422 SERIAL ........................................ :152-157   ◄── la pareja que la
   ├─ 409 remisión pendiente ............................ :174-183       prueba de posición
   ├─ 422 ítems fuera del checklist ..................... :191-197       activa a la vez
   │
   └─ if (b.salesOrderId) ............................... :218
          getSalesOrder ──► Books (books.sales_orders) ... :219
          422 si no existe .............................. :220
          ticketConOrdenVenta(db, {id, número}, propio) ─► desk.tickets   ◄── GUARDA NUEVA
              └─ encontrado ──► 409, y NO se llega al UPDATE
          UPDATE tickets SET orden_venta, fecha_orden_venta, salesorder_id
                       WHERE id=$1 AND COALESCE(orden_venta,'')='' ... :221-225
   │
   └─ createRemision ─► 201 .............................. :228-245
```

---

## 4 · Cambios por fichero

| Fichero | Acción | Qué cambia |
|---|---|---|
| `apps/desk/server/routes/remision.ts` | Modificar | Import de `ticketConOrdenVenta` en `:5`; guarda + `409` dentro del bloque de la OV. **El comentario de `:205-217` NO se toca** (D2): mantiene fijo el `:218` del bloque y parte el barrido en dos grupos |
| `apps/desk/server/ordenVentaUnTicket.test.ts` | Modificar | Quitar `.fails` de `:161`; borrar `:141-159`; reescribir la cabecera por tramos (D1); retitular el `describe` de `:135`; re-anclar las cinco citas (§9) |
| `apps/desk/server/remisiones.test.ts` | Modificar | `describe` nuevo **al final** con la prueba de posición; re-anclar la cita de `:984` |
| `packages/zoho-sync/src/db/repo.ts` | **Sin tocar** | `ticketConOrdenVenta` se reutiliza tal cual |
| `apps/desk/src/**` | **Sin tocar** | §7 |
| `CLAUDE.md`, `openspec/config.yaml` | Modificar | Registro del desvío IV-11 y barrido de citas (§9). **No en esta fase**: es trabajo del `apply` |

---

## 5 · Secuencia de rojos bajo `strict_tdd` (pregunta D)

Runner: `npm test` (`vitest run`). Durante la iteración,
`npx vitest run apps/desk/server/ordenVentaUnTicket.test.ts`.

| # | Paso | Estado esperado, y **el mensaje exacto se anota** |
|---|---|---|
| **R1** | Quitar `.fails` de `:161`. Nada más | **ROJO por `expected 201 to be 409`.** Si es rojo por otra cosa —import, 404, 500— **el rojo no vale**: se para y se averigua |
| **R2** | Escribir la guarda (D2+D3) | El ex-`it.fails` **VERDE**. Y `:141-159` se pone **ROJA por `expected 409 to be 201`** — prevista por escrito en `:67-68` y **deseada**: es la prueba por mutación de que la guarda es lo que cambió el comportamiento. Se corre `npm test` **entero**: ninguna otra debe caer |
| **R3** | Fundir (D1): borrar `:141-159`, reescribir cabecera y `describe` | Todo verde. **A partir de aquí `remision.ts` NO se vuelve a tocar**: su desplazamiento queda congelado y es el que usa el barrido de §9 |
| **R4** | **Ahora** se escribe la prueba de posición (D4) | **VERDE** |
| **R5** | Las dos mutaciones que la validan (§8) | Rojo y vuelta atrás, según §8 |
| **R6** | `npm test`, `npm run typecheck`, `npm run lint` | Verde |
| **R7** | **Última tarea:** re-anclaje y barrido de citas (§9) | `npm test` verde; informe del hook de `pre-push` limpio |

### La trampa de la prueba de posición, resuelta por escrito

Escrita hoy, **pasaría en verde por el motivo equivocado**: hoy el bloque de la OV no rechaza nada, así
que un ticket sin serial contesta `422` porque es la única guarda que hay, no porque una preceda a otra.
Es el mismo fallo de M5 con el serial.

**Cuándo se escribe:** en **R4**, con la guarda ya viva y verde. Antes de R2 no habría dos guardas que
ordenar.

**Cómo se demuestra que prueba lo que dice** — no se argumenta, se ejecuta (R5):

- **M-a · la mutación para la que existe.** Subir la guarda nueva **con su prelusión** (`getSalesOrder` +
  `422`) por encima del `422` del serial de `:152`, dejando el `UPDATE` donde está. Compila y corre.
  → **La prueba de posición TIENE que ponerse ROJA con `expected 409 to be 422`.** Si sigue verde, no
  prueba la posición y hay que rehacerla.
  → Y en la misma corrida **M5 sigue VERDE**: su OV `so-9` (`remisiones.test.ts:994-995`) no la tiene
  ningún otro ticket, así que la guarda devuelve `null` y no dispara. **Ése es el solapamiento cero**, y
  es lo que dice que la prueba nueva no es una copia de M5.
- **M-b · la inversa.** Bajar la guarda del serial por debajo del bloque de la OV. → la prueba de
  posición **ROJA** (`expected 409 to be 422`) **y M5 ROJA** (el `UPDATE` escribe la OV en un rechazo).
  Deja registrado que las dos matan la misma mutación **por lados distintos**: M5 por lo que queda
  escrito, ésta por qué error se oye.
- Se revierten las dos y se vuelve a correr la suite entera en verde.

**Montaje de la prueba de posición.** Ticket dueño con la OV (número **y** `salesorder_id`) + ticket
destino **sin `equipo_id` y sin `serial`** —cuidado: `ticketSinOrden()` de `ordenVentaUnTicket.test.ts:138`
sí trae `equipo_id`, así que el destino necesita fixture propio— con `client_id` para que `getClient`
resuelva. Afirma: **`422` y `/serial/i`, NO `409`**; las **tres** columnas del destino en `null`
(`orden_venta`, `salesorder_id`, `fecha_orden_venta`, idioma de `remisiones.test.ts:1002-1004`); y el
ticket dueño sigue siendo el único con la orden.

### Lo que la suite de hoy dice sobre regresiones — verificado, no supuesto

| Prueba | Con la guarda puesta |
|---|---|
| `remisiones.test.ts:196-221` — captura la OV y no pisa la que ya hubiera | **Verde.** `ov1` sólo la tiene `t1`, y `t1` va **excluido**; `ov2`/`OV-OTRA` no la tiene nadie. Es también el **caso (c)**: sigue siendo un no-op silencioso con `201`, y esta tanda no lo toca |
| `remisiones.test.ts:223-230` — OV inexistente → `422` | **Verde.** El `422` sigue delante |
| `remisiones.test.ts:991-1005` — M5 | **Verde.** Sin competencia por la OV |
| `ordenVentaUnTicket.test.ts:97-113` y `:115-133` — puertas 1 y 2 | **Verdes.** No se tocan |

---

## 6 · Regla invariable 13 — decisión a decisión (pregunta F)

Verificado leyendo los ficheros, no de memoria. Enumeradas **todas** las decisiones que el cliente toma
sobre la orden de venta en el formulario de remisión:

| # | Decisión del cliente | Dónde | Línea del servidor que la impone | Veredicto |
|---|---|---|---|---|
| 1 | **Si el ticket ya tiene orden, no se puede cambiar** (pinta un `readOnly` en vez del buscador, así que `ordenVenta` se queda `null` y `:75` manda `salesOrderId: undefined`) | `CrearRemision.tsx:215-216` | `remision.ts:223` — `WHERE … COALESCE(orden_venta,'') = ''`. **Probada**: `remisiones.test.ts:216-220` manda `ov2` a un ticket que ya tiene `OV-2026-300` y afirma que no se pisó | **Comodidad legítima.** Punto 3 de la regla 13 cumplido |
| 2 | **Sólo se ofrecen órdenes libres** (`soloLibres = true`) | `BuscadorOrdenVenta.tsx:40` → `client.ts:272-276` → `directory.ts:57-58` → `books/repo.ts:159-162` | **Hasta hoy, NINGUNA en el camino de escritura.** El filtro se calcula en el servidor y está probado (`admin.test.ts:171-187`), pero eso prueba **la lista**, no el `POST` | **Éste ES IV-4.** Hoy la lista pre-filtrada **es la guarda**, y vive donde no se puede confiar en ella (punto 2 de la regla 13). **Esta tanda le da su contrapartida**: la guarda nueva. Después de la tanda pasa a ser comodidad legítima |
| 3 | **La OV es opcional** (sin asterisco, «Opcional · buscar si ya existe…») | `CrearRemision.tsx:211-212`, `:223` | `remision.ts:218` — todo el bloque va dentro de `if (b.salesOrderId)` | Coincide. Sin espejo |
| 4 | **Manda el id, nunca el número ni la fecha** | `CrearRemision.tsx:75` | `remision.ts:219-220` — `getSalesOrder` resuelve número y fecha, `422` si no existe | Sin espejo posible: el cliente no tiene qué duplicar |
| 5 | **El buscador se acota al cliente del ticket** | `CrearRemision.tsx:220` → `books/repo.ts:149` | **Ninguna en el camino de escritura.** Nada impide mandar el id de una OV de otro cliente | **Sin contrapartida, y NO se cierra aquí.** Es la pregunta de la **TITULARIDAD**, que sigue abierta: IV-8, y el nº 52 es cardinalidad, no titularidad (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:178-181`). Se nombra para que no se lea como olvido |

**Conclusión, y corrige por matiz a `proposal.md` §7.** No es sólo que «no haya espejo nuevo»: es que
**esta tanda RETIRA un espejo que ya existía** (la fila 2). Ésa es la formulación exacta de lo que IV-4
cierra bajo la regla 13. Y deja una decisión de cliente sin contrapartida, la fila 5, **a propósito y
con dueño nombrado**. No hace falta tocar `apps/desk/src`.

---

## 7 · Reglas de mutación 1 y 2 (pregunta G)

**Regla 1 — muta la POSICIÓN.** Cubierta por la prueba de D4, y la cobertura **se ejecuta**, no se
declara: M-a y M-b de §5. La comprobación de que se rompe al mover la guarda es literalmente M-a, con su
mensaje esperado (`expected 409 to be 422`) y con M5 verde al lado como prueba de solapamiento cero. Si
M-a dejara la prueba verde, el detector no existe y hay que rehacerla antes de seguir.

**Regla 2 — muta el FICHERO VIGILADO: NO APLICA, y se dice por qué.** No hay ningún guardián nuevo que
lea un fichero de datos. Lo que la guarda consulta es una **tabla** (`desk.tickets`), y su fixture ya
*es* el dato: la prueba escribe el ticket dueño y la OV en la base, que es el equivalente exacto de
«ensuciar el fichero vigilado». Los dos guardianes-de-fichero del repositorio quedan fuera de alcance:
el de `ALTER TABLE` sobre `schema.sql` (`packages/zoho-sync/src/db/migrate.test.ts`), que esta tanda no
toca, y el detector de citas, cuya discriminación ya la cerró `detector-citas-extremos` (`9ed0254`,
2026-09-15). Forzar la regla 2 aquí sería inventar un guardián para poder mutarlo.

---

## 8 · El re-anclaje y el barrido de citas (pregunta E)

### 8.1 · Procedimiento, por cita y no por lista

1. Leer **qué AFIRMA la frase**, no sólo si la línea existe.
2. Clasificarla con la tabla de la regla de mutación 4 (A presente · B histórico · C superado).
3. Si es B o C, **comprobarla en la revisión donde fue cierta** antes de anclarla:
   `git log -L <n>,<m>:<fichero>` para dar con el commit, y
   `git show <sha>:<fichero>` para leer la línea. **Si en esa revisión tampoco decía lo que la frase
   afirma, no es Caso B: era un error desde el principio** y se repara contra hoy.
4. Anclar **en la misma línea física**: `` `ticketService.ts:99-102` en `<sha>` ``.
5. **Ninguna aserción `expect(...)` se toca.** Sólo prosa y comentarios.
6. **Al final**, en R7, cuando el desplazamiento ya no cambie.

### 8.2 · Las cinco de `ordenVentaUnTicket.test.ts` — y la propuesta se corrige

`proposal.md` §2.6 las da **todas Caso B**. Leídas una a una, **ninguna lo es**: tres son Caso A y dos
son Caso C. El trabajo y el coste en líneas son los mismos; lo que cambia es la reparación, y
renumerar un Caso C a ciegas es justo el fallo que la regla evita.

| Cita | Qué afirma | Caso | Reparación |
|---|---|---|---|
| `:19` → `ticketService.ts:99-102` | «la puerta 2 es Habilitar Servicio y devuelve 409, y está aquí» — **sigue siendo cierto hoy**; sólo se movió | **A** | A la línea de hoy (`:132-136`) |
| `:20` → `remision.ts:189-197` | «la puerta 3 es la remisión de entrada, y devuelve 201 ❌». **La peor:** `:189-197` es hoy la guarda del **CHECKLIST**, otro bloque — ya estaba rota **antes** de esta tanda | **A** en la ubicación | Al bloque de la OV de hoy (post-R2). El `201 ❌ → 409 ✅` lo registra el tramo Caso C de la cabecera |
| `:23` → `ticketService.ts:45` y `:100` | «`ticketConOrdenVenta` sólo se llama en `:45` y `:100`; la tercera puerta no la llama» — **esta tanda la vuelve FALSA** | **C** | Se conserva anclada en su revisión (donde hay que verificar que `:100` era la puerta 2) y se añade qué lo cerró |
| `:24` → `remision.ts:194` | «lo que tiene **en su lugar** es la condición del `UPDATE`». El `WHERE` sobrevive; el «en su lugar» no | **C** | Anclada en su revisión, más una línea: hoy el `WHERE` sigue, y ya no está *en lugar de* la guarda sino **además** |
| `:136` → `remision.ts:194` | doc del fixture: «sin orden, para que la condición del `WHERE` deje pasar» — **cierto hoy**, describe para qué sirve el montaje | **A** | A la línea del `WHERE` de hoy (post-R2) |

### 8.3 · El barrido que la propuesta NO cuenta — MEDIDO, no estimado

La guarda mete **11 líneas** en `remision.ts` justo detrás de `:220`. Medido con
`git grep -rnoE "remision\.ts:[0-9]+(-[0-9]+)?" -- . ':!openspec/changes/archive'` y filtrando línea
≥ 218: **34 aciertos vivos en 12 ficheros.**

| Fichero | Aciertos |
|---|---|
| `openspec/specs/remisiones/spec.md` | 15 |
| `openspec/specs/trazas/spec.md` | 3 |
| `openspec/config.yaml` | 3 |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | 3 |
| `docs/sdd/F0-00_Baseline_as-built.md` | 2 |
| `CLAUDE.md` | 2 |
| `openspec/specs/transitions-st/spec.md` · `openspec/specs/tickets-core/spec.md` | 1 + 1 |
| `docs/sdd/Puntos_para_Gerencia_2026-09-11.md` · `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` | 1 + 1 |
| `docs/superpowers/plans/2026-08-07-ficha-tecnica-modelo.md` | 1 |
| `apps/desk/server/services/ticketService.ts` | 1 |

⚠️ **El último es CÓDIGO, no documentación.** `ticketService.ts` cita `remision.ts` en un comentario, y
un comentario **no es una aserción**: no lo ven ni `tsc`, ni `eslint`, ni las pruebas. Entra en el
barrido igual que los `.md`, y es justo la clase de cita que se descubre en el cierre o no se descubre.

**Dos grupos, porque no se reparan igual:**

| Grupo | Qué es | Cómo se mueve | Reparación |
|---|---|---|---|
| **G1 · DENTRO del bloque** (`:218-226`, `:223`, `:214-222`…) | el bloque **sólo crece**, y su comentario de cabecera no se toca (D2) | **el inicio `:218` NO se mueve; el final sí** (`:226` → ≈`:237`). Una línea suelta de dentro y por debajo del punto de inserción —el `:223` del `WHERE`— se desplaza **+11** | Se recalcula **sólo el extremo que cambia**. La regla de mutación 4 avisa: los rangos se desfasan **por los dos extremos**, y aquí se desfasa uno solo — comprobarlos por separado es lo que evita «repararlo» mal |
| **G2 · POR DEBAJO de `:226`** (`:232-245`, `:264`, `:266`, `:275`, `:282`, `:301-303`, `:310-320`, `:315-319`, `:320`…) | nada que ver con la OV: `createRemision`, `/enviar`, fotos, trazas | se desplazan **enteras, +11, los dos extremos** | Renumerar los dos extremos — **si la frase habla del presente (Caso A)**. Si es un registro fechado, se ancla |

**Y el otro grep, aparte de esos 34:**
`git grep -rnoE "ordenVentaUnTicket\.test\.ts:[0-9]+(-[0-9]+)?"` — borrar `:141-159` sube el ex-`it.fails`
~19 líneas. **~15 aciertos vivos**, incluidos `apps/desk/server/remisiones.test.ts:984`, `CLAUDE.md:274`
(que cita `:150-158`, **dentro del bloque borrado**) y `openspec/specs/remisiones/spec.md:406` (cita
`:158`, **borrada también**). Casi todos dicen «el `it.fails` de `:161`»: **Caso C** — se anclan y se
añade qué lo cerró. **No se renumeran**, o dirían que hay un `it.fails` donde ya no lo hay.

**Segundo pase obligatorio** sobre la forma abreviada (`` `:161` ``, `` `:223` ``, sin nombre de
fichero) en los ficheros que ya citan cada módulo: los dos greps de arriba **no la cazan**.

**Alcance:** `apps/**`, `packages/**`, `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/**`,
`docs/` — **incluido `docs/superpowers/**`**, que no se excluye: sus planes son registros fechados, así
que entran en el barrido con reparación **Caso B** (anclar, no renumerar), que también cuesta líneas.
**Fuera:** `openspec/changes/archive/**`, y los artefactos de esta tanda (`proposal.md`,
`exploration.md`, `design.md`), que llevan `**Árbol:** 14b45ee` en su cabecera y quedan anclados por él.

**El hook NO puede hacer este trabajo.** `apps/desk/server/citas/lineaBase.jsonl` está **vacío** desde
`23b2349`, así que una cita rota nueva bloquea el `pre-push` — pero lo que comprueba es que la línea
exista y no esté vacía. `remision.ts` sólo **crece**: ninguna cita desplazada caerá en línea vacía ni
fuera de rango, así que **el hook pasará con los 34 aciertos ya mintiendo**. La comprobación es de
lectura humana, cita a cita, con el informe del hook como ayuda.

**Obligación cruzada para los deltas de `sdd-spec`** (que ya están cerrados): citan líneas de
`remision.ts` que esta tanda va a mover. **Su barrido es tarea de R7, no de esta fase**; si no se hace,
la fusión del archive reintroduce citas caducas en `openspec/specs/remisiones/spec.md`.

### 8.4 · La SEGUNDA población, medida el 2026-09-16 — y por qué crece la estimación

El barrido tiene **dos** poblaciones, no una. La primera es la de §8.3: las **34** citas vivas de
`remision.ts:<n≥218>` en 12 ficheros, que se desplazan porque la guarda inserta líneas.

**La segunda la genera R3**, al borrar `:141-159` y quitarle el `.fails` a `:161`. Medida sobre el
árbol, con los dos pases que la regla de mutación 4 exige:

| | |
|---|---|
| Líneas distintas que mencionan ese tramo | **26** |
| — de ellas, **se resuelven solas** | **8** — las siete de `remisiones/spec.md` (`:368`, `:369`, `:391`, `:393`, `:406`, `:413`, `:414`) caen dentro de la §5.1 que el delta RETIRA, y `tickets-core/spec.md:414` cae en la narrativa que el delta ya reescribe |
| — **reparaciones reales** | **18** — 9 Caso C y 9 Caso B |
| — de ellas, ya correcta de fábrica | **1** — `R08.3_Expediente_de_cambios.md:321`, que ya ancla («contra `6be9cf0`») |

**Quince de las 26 no las caza el grep completo.** Sólo salen por forma abreviada o por el texto
`it.fails`: `config.yaml:486` (`` `:150-158` ``), `tickets-core/spec.md:407-408`,
`Decisiones_Gerencia_2026-09-10.md:138`, `F1B-01_Serial_llave_de_entrada.md:142` y `:222`,
`remisiones/spec.md:368/391/393/406/413`, `transitions-st/spec.md:581`. Es exactamente lo que
`CLAUDE.md` avisa: «la forma abreviada NO la captura ese grep; hace falta un segundo pase en los
ficheros que ya citan el módulo».

**Por qué sube la cifra y no es un renumerado.** La estimación vieja metía «~15 de
`ordenVentaUnTicket.test.ts` a +1/-1», como si bastara cambiar el número. **No basta:** las 18
**AFIRMAN que hay un `it.fails` esperando**, y tras el apply eso es falso. Caso C **añade** la
cláusula de qué lo cerró; Caso B **añade** el ancla de revisión. Las dos crecen. Medido a ~2 ins / ~1
del por reparación: **36 ins / 18 del**, frente a los 15/15 presupuestados. Diferencia: **+21 ins /
+3 del**.

⚠️ **Dos de las 18 están en el delta de `tickets-core` de esta misma tanda** (`:407-408` del recuadro
copiado verbatim): dicen que `:141-159` fija el daño y que `:161` deja el `it.fails` esperando. Tras
el apply las dos mitades son falsas, y al fusionar el archive las escribiría en la spec viva. **Se
reparan EN EL DELTA**, no en el fichero vivo, y en R7, cuando R3 haya congelado el desplazamiento.

⚠️ **Las de `openspec/config.yaml` (`:474`, `:485`, `:486`) pesan más que las demás**: ese fichero se
carga en cada sesión y en cada sub-agente, así que una afirmación falsa ahí se propaga a todo lo que
venga después.

---

## 9 · Matriz de amenazas

**N/A.** No hay frontera de enrutado, shell, subproceso, automatización de VCS/PR, clasificación de
ficheros ejecutables ni integración de procesos. No se registra ninguna ruta nueva ni se altera el orden
de registro: se añade una rama de rechazo dentro de un manejador que ya existe. Lo único que entra del
exterior es `b.salesOrderId`, que **ya** viaja parametrizado (`$1` de `getSalesOrder`,
`packages/zoho-sync/src/books/repo.ts:180`) y que la guarda vuelve a pasar parametrizado
(`repo.ts:342-345`). Sin tareas derivadas.

---

## 10 · Migración y despliegue

**Ninguna.** Ni esquema, ni migración, ni bandera, ni dato que rellenar. La guarda es puramente
aditiva: añade un `409` a un camino que hoy contesta `201`. El rollback es `git revert` del commit de la
tanda, como fija `proposal.md` §10.

**La guarda es transitoria y se dice en el código.** `Decisiones_Gerencia_2026-09-10.md:147-150` fija
como destino una tabla propia con `salesorder_id` como `PRIMARY KEY`, que jubila las tres guardas de
aplicación. El comentario de la guarda nueva debe decirlo, o la próxima tanda la leerá como definitiva.

---

## 11 · Presupuesto — contraste con la propuesta

`proposal.md` §11 estima el `apply` en **≈290/430** (rango bajo/alto). **El diseño real da ≈422 líneas
cambiadas: FUERA del rango de la propuesta por arriba, y con la composición mal repartida.**

*(Esta cifra se corrigió dos veces el 2026-09-16: ≈333 → ≈398 al medir la primera población de citas,
y ≈398 → ≈422 al medir la segunda, la que R3 genera al borrar `:141-159`. Las dos veces subió por lo
mismo: el barrido de citas se había estimado a ojo en vez de medirse. Detalle en §8.4.)*

| Fichero / concepto | ins | del | Nota |
|---|---|---|---|
| `routes/remision.ts` | 12 | 1 | 11 de la guarda + import reescrito. **Sin las 3 del comentario del bloque**: D2 |
| `ordenVentaUnTicket.test.ts` | 60 | 84 | cabecera por tramos (D1) + borrar `:141-159` + cinco citas |
| `remisiones.test.ts` | 27 | 1 | prueba de posición al final + cita de `:984` |
| **Barrido de citas (§8.3)** | **85** | **57** | **CORREGIDO EL 2026-09-16 — era 64/54.** Ver §8.4 |
| `CLAUDE.md` + `openspec/config.yaml` (IV-11, §13 nº 9) | 25 | 10 | líneas distintas de las del barrido en esos mismos ficheros |
| `apply-progress.md` | 60 | 0 | |
| **Total** | **≈269** | **≈153** | **≈422 líneas cambiadas contra el techo de 800. Cabe — pero SUPERA la guarda de 400 de carga de revisión** |

### Decisión de entrega — tomada el 2026-09-16

Con ≈422 medidas, Gerencia eligió **DOS REBANADAS ENCADENADAS** (`delivery_strategy: ask-on-risk`, la
guarda se disparó y se resolvió partiendo). El corte cae solo: las dos no comparten ningún fichero
salvo los dos de prueba, y el barrido va último de todas formas porque necesita el desplazamiento ya
congelado. `sdd-tasks` emite el `Review Workload Forecast` contra este corte, no contra el total.

> **⚠️ QUÉ ES UNA REBANADA AQUÍ, Y QUÉ NO ES. Precisión de Gerencia del 2026-09-16.**
>
> Las dos rebanadas viven en **EL MISMO cambio `tercera-puerta-orden-venta`**. Son **dos intentos del
> ledger y dos commits**, cada uno con su verificación propia. **NO son dos ciclos SDD** con
> `proposal.md`, `design.md`, delta de spec, `verify` y `archive` cada uno.
>
> **El porqué es aritmético, no de gusto.** Ese papeleo costaría más que el trabajo: el ledger mide
> `git diff --shortstat --no-renames`, así que un `sdd-archive` cuesta **el doble** de su carpeta de
> artefactos (probado el 2026-09-16 en `detector-citas-extremos`: 440 líneas revisables contaron
> **4.502**). **Dos** archives pasarían de **4.000 líneas** para un cambio de código de **≈185**.
> Partir en dos ciclos convertiría una tanda XS en la más cara de la épica, y ni una sola de esas
> líneas extra sería revisable.
>
> **Y por eso las dos caben holgadas en 800 sin pedir nada:** cada intento del ledger **se mide contra
> su PROPIO árbol de partida**, no acumulado. La rebanada 2 arranca desde el árbol que dejó la 1, así
> que sus ≈237 líneas son las suyas. El techo de 800 del preflight basta para las dos.
>
> Lo único que sigue sin caber es el `sdd-archive` —**uno solo**, al final—, que se mide aparte y cuyo
> techo se pide **después** de medirlo en worktree aislado.

**Las dos correcciones a la estimación de la propuesta:**

1. **De más:** §11 metía «artefactos SDD ≈ 200/300», pero `design.md` y `tasks.md` se escriben **antes**
   de abrir el intento del `apply`, así que quedan en su árbol de partida y no entran en su diff.
2. **De menos:** no contaba el barrido de §8.3, que son **118 líneas medidas** y **no es opcional**.

### El ledger y lo no trackeado — el dato va al revés de lo que parece

**Lo nuevo sin trackear el ledger lo cuenta como CERO, no por `wc -l`.** Es uno de los dos desvíos que
cuentan **de MENOS** de la regla del ciclo 2 de `CLAUDE.md`, y está medido por ejecución: el intento 1 de
`hook-citas-pre-push` registró **55** con **928** líneas nuevas sin trackear, y el corte 1b-i registró
**238** frente a **529** con git porque **291** eran ficheros nuevos. Donde `wc -l` de lo no trackeado sí
entra es en **la MEDIDA REAL para ESTIMAR** —`git diff --shortstat --no-renames` contra el commit de
partida **más** `wc -l` de lo nuevo—, precisamente porque el ledger se queda corto. **Son dos cosas
distintas: lo que el ledger CUENTA y lo que la estimación honesta SUMA.**

**Consecuencia:** dejar `design.md` sin trackear **no infla** el intento, lo **desinfla**. Aun así
conviene **commitear los artefactos SDD antes de `gentle-ai sdd-attempt`** — pero por la razón buena: para
que el número del ledger y el de la medida real **coincidan**, y no se arrastre un descuadre que luego
haga parecer que sobra presupuesto donde no sobra.

El `archive` (≈1800/3300) no se mueve por este diseño: no hay ficheros nuevos ni `git mv`. Sigue
necesitando techo propio de Gerencia, medido antes en worktree aislado.

### Guarda de carga de revisión — cambia de veredicto

**≈422 contra el presupuesto de 400 (`additions + deletions`): SUPERADO, no «en el límite».** Con la
estimación vieja de ≈333 se podía decir «un solo PR»; con ≈398 estaba en la raya; con las dos
poblaciones medidas (§8.4), ya no hay raya que discutir.

**El corte está DECIDIDO, no propuesto:** Gerencia eligió dos rebanadas el 2026-09-16. Respeta el
orden de §5, porque el barrido va último de todas formas.

| Rebanada | Qué | ≈ líneas | Verificación propia |
|---|---|---|---|
| 1 | La guarda (R1-R6): `remision.ts`, los dos ficheros de prueba, las cinco citas de §8.2 | ≈185 | `npm test`, `typecheck`, `lint`, y las mutaciones M-a/M-b |
| 2 | Las DOS poblaciones del barrido (§8.3 + §8.4) + el registro de IV-11 (R7) | ≈237 | Informe del hook de `pre-push` limpio + lectura cita a cita |

⚠️ **Ninguna de las dos comparte fichero con la otra salvo los dos de prueba**, y en ésos la rebanada 1
toca cuerpo y la 2 toca sólo comentarios de cita. No hay solapamiento que resolver.

Las líneas exactas de la guarda (`Decision needed before apply`, `Chained PRs recommended`,
`400-line budget risk`) las emite **`sdd-tasks`**, no esta fase. Lo que el diseño aporta es el número
medido y el corte que lo hace posible.

---

## 12 · Fuera de alcance, nombrado para que no se lea como olvido

| Qué | Por qué |
|---|---|
| **IV-11**, la divergencia `orden_venta`/`salesorder_id` por el sync | Decisión 3 de la ronda. Se cita como **razón** de las dos vías (D3) y no se diseña |
| **El caso (c)** — OV libre + ticket con orden propia distinta | Hoy no-op silencioso con `201`, y **con prueba viva que lo fija**: `remisiones.test.ts:216-220`. Sigue igual después de la tanda. Cambiar su respuesta es UX que nadie ha pedido |
| La guarda equipo↔cliente de `ticketService.ts:65-83` | IV-8 abierto; nº 52 es cardinalidad, no titularidad. Ver también la fila 5 de §6 |
| Las puertas 1 y 2 | Se quedan (`Decisiones_Gerencia_2026-09-10.md:128-133`) |
| `apps/desk/src/**` | §6 |

---

## 13 · Preguntas abiertas

- [ ] **Techo de líneas del `sdd-archive`** — Gerencia, después de medir en worktree aislado. No bloquea
      el `apply`. Dueño fuera del repositorio (`proposal.md` §12).
- [ ] **Destino del desvío IV-11** — sin asignar a propósito.
- [ ] Ninguna pregunta técnica bloquea el diseño. A, B, C, D, E, F y G quedan decididas arriba.
