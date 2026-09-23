# F1B-01 — Código único por serial, serial obligatorio en la remisión, autocompletado

| Dato | Valor |
|---|---|
| Tanda | `F1B-01`, fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:150` · talla **M** (`:413`), las dos en `a5da6b8`; **hoy `:156` y `:468`** |
| Fuentes | Ítems 1 y 19 del §3.1 · **M1.1** del maestro (`R08.1.md:1042-1049`) |
| Base | commit `c45bcb1`, rama `main` |
| Fecha | 2026-09-09 |
| Gate | Ninguno (decidido 14/08 y 20/08) |
| Incumplimiento vivo que aterriza aquí | **IV-6** — las `ALTER TABLE` fuera de la red del guardián |

---

## 1 · El alcance real, medido antes de escribir nada

El plan pide tres entregables. **Uno ya estaba hecho, otro no existía, y del tercero faltaba menos de
lo que parecía — pero por una causa que nadie había nombrado.**

| # | Entregable del plan | Estado a `c45bcb1` | Qué hace esta tanda |
|---|---|---|---|
| 1 | Código único de ticket basado en serial | **YA ESTABA** | Nada. Hallazgo §1.1 |
| 2 | Serial obligatorio en la remisión | **NO ESTABA** | Se construye |
| 3 | Autocompletado por serial (cliente, modelo, OV activas) | **A MEDIAS** | Se cierra |
| — | IV-6 · guardián de `ALTER TABLE` | Hueco abierto | Se cierra |

### 1.1 · Entregable 1 — ya estaba, y el problema que resolvía lo cerró la R08

`buildCodigoServicio` (`packages/shared/src/ticketCreate.ts:12-14`) construye
`PREFIJO_serie_modelo_AAMMDD` desde el serial del equipo; `buildSubject` (`:16-18`) arma el asunto;
`defaultPrefijoFor` (`:47-49`) deriva el prefijo del tipo de servicio. El alta lo escribe **una sola
vez** (`ticketService.ts:61`) y ningún `UPDATE` lo recalcula.

**Y eso es exactamente lo que el maestro pedía.** El problema de origen (`R08.1.md:639`) era «un
equipo entra por calibración, se detecta falla y requiere correctivo → **duplicidad y confusión de
códigos**». La R08 lo cierra en el punto abierto nº 37 (`:1067`): el prefijo «es sólo una formalidad …
puede derivarse automáticamente de la clasificación y del tipo de servicio en lugar de teclearse». Es
literalmente `defaultPrefijoFor`, y el código no cambia después de crearse, que es lo que impide la
duplicidad.

**Sobre el `UNIQUE` que NO se ha puesto, y por qué.** `codigo_servicio` es `text` sin restricción
(`schema.sql:28`). Se comprobó qué pasaría si dos tickets compartieran código y **el daño es
cosmético**: el enlace ticket ↔ equipo del historial se hace **por serial**
(`db/equipos.ts:253-256`), no por el código, que sólo se muestra (`HojaDeVida.tsx:70`,
`db/historial.ts:44`) y sirve de fuente al backfill (`backfillSerial.ts:11-16`). Un `UNIQUE` sobre una
columna derivada rechazaría en producción el segundo servicio legítimo del mismo equipo el mismo día,
y nadie ha decidido que eso deba pasar. **Se registra como pregunta, no se construye.**

### 1.2 · Entregable 2 — no estaba, y el hueco tenía una puerta concreta

`R08.1.md:1045` — «[DECIDIDO] El campo número de serie es obligatorio al crear la remisión». No
estaba: `schema.sql:279` declara `serial text` (admite `NULL`), y `routes/remision.ts` sólo validaba
ticket y fecha; el serial se **derivaba** con `eq?.serial ?? found.row.serial ?? null`.

**Quién caía por ahí.** Un ticket nacido en la app siempre trae serial: el alta exige `equipoId` del
catálogo (`ticketService.ts:22-25`) y el equipo lo lleva. El hueco es **la otra entrada** —la que
M1.3.2 llama la que «nunca se cruza» con aquélla—: un ticket sincronizado de Zoho llega sin serial
—por eso `habilitar_servicio` lo exige (`transitions.ts:189`)— y **nada impedía remisionarlo antes**.

Y el daño no era la columna vacía: la remisión es el documento que **acompaña al equipo**. Sin serial
no dice cuál entró.

### 1.3 · Entregable 3 — la mitad que faltaba, y la causa que nadie había nombrado

La spec ya lo tenía registrado como «implementado a medias» (`tickets-core` §5.2, M-4): traía modelo y
cliente, no asociaba las órdenes de venta. **El diagnóstico era correcto y la causa no estaba dicha.**

Lo que se encontró al mirar: `CreateTicket.tsx` resolvía el cliente del equipo **POR NOMBRE**
—`searchClients(e.clienteNombre)` y comparación normalizada—, que es **exactamente el apaño que el
servidor abandonó el 2026-08-09**. El comentario de `searchEquipos` lo dice con todas las letras
(`db/equipos.ts:46-54`):

> «La acotación es por `client_id` y nada más … Ese apaño dejó de hacer falta cuando
> `backfill-client-id` enlazó el 96,6 %, y cobraba un precio: bastaba que dos clientes compartieran un
> fragmento del nombre para que salieran los equipos del otro.»

**El servidor lo había abandonado; el cliente seguía haciéndolo.** Y no por descuido: `equipos.client_id`
existe (`schema.sql:208`) pero `EquipoLite` no lo llevaba, así que el formulario no tenía alternativa.

De ahí sale la mitad que faltaba casi gratis: `CreateTicket.tsx:83-93` ya carga las órdenes de venta
**activas y libres** en cuanto hay `clientId` (`books/repo.ts:145` filtra `order_status = 'open'` y
descarta las que ya están en otro ticket). **No hacía falta un endpoint: hacía falta un campo.**

### 1.4 · Hallazgo de método: menos trabajo del que el plan decía, por una causa mejor

Los tres entregables suman **menos** de lo que la fila del plan sugiere —uno hecho, otro de un campo—,
así que **no hay corrección de talla que llevar al fichero de correcciones**. Lo que sí queda escrito
es que el diagnóstico de la spec (M-4) nombraba el síntoma y no la causa, y que la causa era un apaño
que este mismo repositorio ya había identificado y retirado **en el otro lado de la misma frontera**.

---

## 2 · El rojo de partida

Pruebas primero, por aserción. Tres piezas, y cada una arrancó en rojo por la razón correcta.

| Pieza | Prueba | Rojo de partida |
|---|---|---|
| **A** · guardián `ALTER TABLE` | «toda ALTER TABLE apunta a una tabla clasificada…» | `expected [ 'users', 'users', 'users', …(10) ] to deeply equal []` — **13 sentencias** sobre tablas de `public` |
| **A** | «las ALTER sin calificar son exactamente las de DESK_TABLES…» | mismas 13 |
| **A** | «son 29 ALTER…» | **verde de entrada**, y eso es el hallazgo: las cifras de la spec (28 / 5 / 23) ya eran 29 / 5 / 24 |
| **B** · serial obligatorio | «un ticket de Zoho sin serial NO puede remisionarse» | `expected 201 to be 422` |
| **B** | «el serial en blanco es tan ausente como el NULL» | `expected 201 to be 422` |
| **B** | «con serial propio y sin equipo del catálogo…» | **verde**: fija que la guarda no rompe lo que ya funcionaba |
| **B** | «M5 · con equipo del catálogo, manda el serial del equipo…» | **verde**: fija la precedencia que la guarda no debe alterar |
| **C** · `clientId` en `EquipoLite` | «searchEquipos devuelve el clientId» | `expected undefined to be 'cli-amb'` |
| **C** | «getEquipo también lo devuelve» | `expected undefined to be 'cli-gec'` |
| **C** | «del serial al client_id, y del client_id a las OV activas y libres» | rojo, y con un fallo propio: `column "order_status" does not exist` — la vista lo saca de `raw` (`schema.sql:176-182`) |
| **C** | «M5 · un equipo sin client_id lo devuelve ausente…» | **verde**: `undefined` ya era el valor correcto |

---

## 3 · Mutaciones

**Nota sobre el detector, porque es la primera lección de la tanda.** El primer detector greppeaba
`Tests N failed` en la salida de `vitest`, y **las tres primeras mutaciones «sobrevivieron»**. No
sobrevivían: la salida lleva códigos ANSI y el `grep` nunca casaba. El detector se rehízo sobre el
**código de salida**, con una ejecución de control sin mutar para comprobar que distingue verde de
rojo. *Una mutación que sobrevive con un detector no validado no es información.*

| # | Pieza | Mutación | Resultado |
|---|---|---|---|
| A1 | guardián | Quitar `public.` a `ALTER TABLE public.remisiones` (`:291`) | **MUERTA** |
| A2 | guardián | Poner `desk.` a `ALTER TABLE tickets` (`:123`) | **MUERTA** |
| A3 | guardián | **(M5)** Añadir una `ALTER` nueva sin calificar sobre `public.users` | **MUERTA** — es literalmente el caso que dejó pasar `e8c5e90` |
| B1 | serial | `!serial` → `serial === null` (la cadena en blanco pasaría) | **MUERTA** |
| B2 | serial | Guardar sobre `found.row.serial` en vez del valor resuelto | **MUERTA** |
| B3 | serial | **(M5)** Mover la guarda **después** del bloque de la orden de venta | **SOBREVIVIÓ** → §3.1 |
| C1 | `clientId` | **(M5)** Devolver `''` en vez de `undefined` cuando no hay dueño | **MUERTA** |
| C2 | `clientId` | Quitar `client_id` del `SELECT` de `searchEquipos` | **MUERTA** |

### 3.1 · La M5 que sobrevivió, y cómo se alcanza

Mover la guarda después del bloque de la orden de venta **no cambia el código de respuesta ni el
cuerpo**: sigue siendo `422`. Cambia **qué queda escrito** al rechazar. El bloque de la OV hace un
`UPDATE tickets SET orden_venta, fecha_orden_venta, salesorder_id` (`remision.ts:214-222`) *antes* de
llegar a la guarda: la petición se rechaza, quien la hizo entiende que no pasó nada, y el ticket se ha
quedado con una orden de venta encima.

**Se fue a buscar cómo se alcanza antes de darla por no alcanzable, y se alcanza con una petición
normal:** un ticket de Zoho sin serial más un `salesOrderId`. Y ahí el daño no es genérico — esa
escritura es la **tercera puerta** de «una OV, un ticket», la que pone `salesorder_id` sin llamar a
`ticketConOrdenVenta` (**IV-4**, `tickets-core` §4.2, con su `it.fails` en
`ordenVentaUnTicket.test.ts:161` en `b99d47a` — CERRADO por `tercera-puerta-orden-venta`, `79cf09b`). Un
rechazo que igualmente quemara la OV era ese mismo modo de fallo disparado desde una petición que **ni
siquiera prosperó**.

La prueba que la mata no comprueba el `422` —eso ya estaba—: comprueba que **el ticket no cambió**
(`remisiones.test.ts`, «M5 · con orden de venta y sin serial: 422 y el ticket sigue sin OV»).
Reaplicada la mutación con la prueba dentro: **muerta**.

---

## 4 · IV-6 · qué costó de verdad

**El guardián se extendió, y esa parte de la entrada era exacta.** `migrate.test.ts` añade
`altersDelEsquema()` y tres pruebas, reutilizando las **mismas tres listas** que el guardián de
`CREATE`: si los dos leyeran de fuentes distintas podrían discrepar sobre dónde vive una tabla, que es
justo el error a cazar.

**Pero hubo que calificar 13 sentencias, y eso la entrada no lo decía.** Extender el guardián sin
tocar el `.sql` lo habría dejado **rojo para siempre**: las 13 `ALTER` sobre tablas de `public` ya
estaban ahí. Se calificaron ésas —`users` (3), `roles` (1), `avisos` (1), `remisiones` (7),
`catalogo_modelos` (1)—, que son el hueco de verdad; las **11 de `DESK_TABLES` siguen sin calificar**,
que es lo correcto.

**«No reescribir 23» era correcto en el número, no en el gesto.** El número a tocar era **13**, y las
otras 10 —hoy 11— no se tocan porque calificarlas **rompe la migración**: el esquema `desk` sólo existe
tras `reorgToDesk`, que no corre en los tests, y `migrate` es tolerante por sentencia, así que fallarían
en silencio. Que las 13 de `public` sí se pudieran calificar **no se supuso**: `public` existe en
pg-mem —`schema.sql:271` ya crea `public.remisiones` así— y la suite entera pasó sin un cambio más.

**Y la cifra de la entrada estaba caduca antes de cerrarse.** Decía 28 totales / 23 sin calificar / 10
sobre Desk; al llegar F1B-01 eran **29 / 24 / 11**. La que entró es
`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_aviso_cliente` (`schema.sql:448`), de **F1A-04**
(`e8c5e90`, hace tres días). Está **bien** sin calificar. El hallazgo es que **nadie lo comprobó** —que
es exactamente lo que el hueco permitía, demostrado sin necesidad de un ejemplo inventado.

Hoy: **29 `ALTER`, 18 calificadas** (13 de `public` + 5 de `books.contacts`), **11 sin calificar**,
todas sobre `DESK_TABLES`.

*Fuera de alcance, registrado:* el guardián cubre `ALTER TABLE`, no `CREATE INDEX` (`:288` sobre
`remisiones`) ni el `UPDATE` de `:320`, que están sin calificar y comparten el modo de fallo. Son otra
clase de sentencia y otra entrada; no se amplían aquí para no confundir el alcance de IV-6.

---

## 5 · Cifras, invariantes y specs

### 5.1 · Las cuatro cifras

| Comando | Resultado |
|---|---|
| `npm test` | **verde** — 113 ficheros, **990 tests** (988 pasan, 2 saltados). Eran 978 |
| `npm run typecheck` | **verde** — 0 errores |
| `npm run lint` | **verde** — 0 errores / **158 avisos** (sin moverse desde el baseline) |
| `npm run build` | **verde** |

**+12 pruebas**: 4 del guardián de `ALTER`, 5 del serial obligatorio (una de ellas la que mata la M5
superviviente), 4 del `clientId`. Cobertura sigue por encima del umbral del CI.

### 5.2 · Qué invariantes tocó

**Ninguno de los seis del grafo.** F1B-01 no toca `transitions.ts` ni el registro de estados. Los
guardianes que sí crecieron son los del **esquema**, y son otra familia:

| Guardián | Antes | Después |
|---|---|---|
| `CREATE TABLE` clasificado | 29 tablas, tres listas | **sin cambios** |
| `ALTER TABLE` clasificado | **no existía** | 3 pruebas, mismas tres listas |

### 5.3 · Qué caducó en las specs

| Dónde | Qué decía | Acción |
|---|---|---|
| `tickets-core` §5.2 **M-4** | «Implementado a medias … **Punto a decidir**: si se implementa o si la decisión se reformula» | **CERRADO**, con la causa que faltaba |
| `tickets-core` §5.3 | «23 sentencias fuera de la red del guardián», 28 / 5 / 23 | **CERRADO (IV-6)**, y registrada la caducidad de la cifra |
| `openspec/config.yaml` · `IV-6` | Mismo alcance y mismas cifras | **Cerrado**, con qué costó de verdad |
| `CLAUDE.md` · tabla de incumplimientos | «**Cinco** desvíos vivos» | **Cuatro.** IV-6 tachado con su cierre |
| `remisiones` | No tenía requisito de serial | **RQ-RE-15** nuevo |

**Y un hallazgo que NO se corrige aquí:** `tickets-core` §4.1 y §4.2 declaran **«destino F1A»** —la
inversión `409`/`422` del alta y la tercera puerta de la OV—, y **F1A cerró sin tocar ninguna de las
dos**: `ticketService.ts:43-49` sigue evaluando el `409` antes del `422`, y el `it.fails` de
`ordenVentaUnTicket.test.ts:161` en `b99d47a` seguía esperando —**cerrado por
`tercera-puerta-orden-venta`, `79cf09b`**—. La inversión 409/422 del alta no es de esta tanda —y §4.1
avisa de que «corregir una sin la otra deja el problema»—, pero **su destino declarado ya pasó**.
Necesita uno nuevo.

---

## 6 · Dónde se nota en la aplicación, y con qué datos

Tres cambios visibles. Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia, así que
**esto es lo que hay que mirar a mano**.

### 6.1 · Alta de ticket — el serial trae el cliente y sus órdenes de venta

**Pantalla:** *Crear ticket*. **Antes:** al elegir el equipo, el cliente se rellenaba sólo si su
nombre casaba con uno de Books; las órdenes de venta había que buscarlas escribiendo.
**Ahora:** al elegir el equipo, el cliente queda fijado por identidad y **la lista de órdenes de venta
se abre sola** con las activas y libres de ese cliente.

| Paso | Dato de prueba | Qué debe verse |
|---|---|---|
| 1 | Abrir *Crear ticket* sin tocar el cliente | El buscador de OV pide 2 caracteres |
| 2 | En **Equipo**, teclear un serial real del catálogo y elegirlo | El campo **Cliente** se rellena y queda **en gris** (bloqueado) |
| 3 | Mirar **Orden de venta** sin escribir nada | Aparecen ya las OV **de ese cliente**, sólo confirmadas y sólo libres |
| 4 | Elegir una y crear | El ticket sale con cliente, equipo, marca, modelo y código `PREFIJO_serie_modelo_AAMMDD` |

**Caso a comprobar aparte (el ~3,4 %):** un equipo **sin `client_id`**. El cliente **no** queda
bloqueado y sale el aviso ámbar «El equipo figura a nombre de …, que no coincide con ningún cliente de
Books». Ésa es la vía por nombre, que sobrevive sólo como respaldo.

> Para elegir el dato: `SELECT serial, cliente_nombre, client_id FROM desk.equipos WHERE active AND client_id IS NOT NULL LIMIT 5;`
> y para el caso del respaldo, el mismo con `client_id IS NULL`.
> ⚠️ En `psql` la base es `desk` y `equipos` vive en el esquema `desk`.

### 6.2 · Crear remisión — el serial es obligatorio

**Pantalla:** *Ticket → Crear remisión*.

| Paso | Dato de prueba | Qué debe verse |
|---|---|---|
| 1 | Abrir el formulario en un **ticket de Zoho que no haya pasado por «Habilitar Servicio»** | Bajo **Equipo**, aviso ámbar: «Este ticket no tiene número de serie, y la remisión no puede emitirse sin él…» |
| 2 | Intentar crearla igualmente | El servidor responde **422** y **no se crea nada** |
| 3 | Ejecutar «Habilitar Servicio» capturando el serial, y volver a abrir | El aviso desaparece y la remisión se crea con normalidad |
| 4 | Repetir en un ticket **nacido en la app** | Nada cambia: siempre tuvo serial |

> Para elegir el dato: `SELECT id, number, subject FROM desk.tickets WHERE managed_by_app = false AND COALESCE(serial,'') = '' AND equipo_id IS NULL LIMIT 5;`

**El aviso de la pantalla es comodidad, no guarda** (regla invariable 13): quien lo imponga es el
servidor, y está probado. El aviso existe para decir **qué hacer**, no para impedirlo.

### 6.3 · Lo que NO se nota

El código de servicio se sigue construyendo igual y el esquema no cambió de forma: calificar 13
`ALTER` con `public.` apunta a la misma tabla a la que ya apuntaban. **Si algo cambia de sitio tras el
despliegue, es un defecto, no el efecto esperado.**
