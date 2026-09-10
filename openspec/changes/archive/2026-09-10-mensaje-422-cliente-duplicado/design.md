# Diseño · mensaje-422-cliente-duplicado

| Dato | Valor |
|---|---|
| Base | `main` en `984b7aa`. **Verificado**: el bloque `ticketService.ts:65-77` y las líneas que este diseño cita se leyeron contra este árbol, no contra `b3fc829` |
| Entradas | `proposal.md` · `exploration.md` · lectura directa del código citado |
| Modo | `interactive` · `strict_tdd` · `artifact_store: hybrid` · `ask-on-risk` · presupuesto 800 líneas |
| Alcance | El mensaje del `422` de la rama (ii) y su instrumentación de prueba. Ninguna guarda se mueve |

---

## 0 · Enmiendas a la propuesta, declaradas por delante

Tres. Se escriben aquí porque una propuesta y su diseño diciendo cosas distintas sin decirlo es el
modo de fallo que `CLAUDE.md` describe para sus propios registros.

**E1 · Las citas caducas de los dos ficheros de código son CUATRO, no dos.** La propuesta §2.3 listó
dos. Verificadas contra el árbol, hay cuatro dentro del mismo bloque que esta tanda abre:

| Cita | Dice | Hoy es | Estado |
|---|---|---|---|
| `ticketService.ts:56` | «`:54` (`if (!clientId) missing.push('cliente')`)» | `:82` | `:54` es línea del propio comentario |
| `ticketService.test.ts:250` | «obligatorios de `ticketService.ts:53-58`» | `:81-86` | `:53-58` son comentario |
| `ticketService.test.ts:303` | «`ticketService.ts:22-60`, de arriba abajo» | la cadena llega a `:88` | trunca la última guarda |
| `ticketService.test.ts:358` | «antes de los obligatorios (`:54` exige `clientId`)» | `:82` | `:54` es comentario |

Las otras del mismo bloque **están bien y no se tocan**: `test.ts:355` y `:373` citan `:39`
(correcto), `test.ts:357` cita `:45-49` (correcto), `ticketService.ts:63` cita `:39` (correcto).

**E2 · `RQ-TC-05` contradice al código en el orden 409 ↔ discrepancia, y hay que corregirlo en el
delta.** `openspec/specs/tickets-core/spec.md:121-122` numera la discrepancia como guarda **4** y el
`409` de la OV como **5**, y `:131-132` lo repite en prosa («inmediatamente después del bloque de la
orden de venta»). **El código hace lo contrario y está verificado**: el `409` vive en `:45-49` y la
guarda en `:65-77`. La propuesta no lo vio porque §2.4 sólo miró las citas de línea, no el orden de
las filas. Esto no es cosmético: es exactamente lo que **M-P2** mutaría, así que el delta de spec
**SHALL** invertir esas dos filas para que digan lo que el código hace. No es abrir el punto abierto
§4.1 —ése es *qué orden debe haber*—; es dejar de describir mal el que hay.

**E3 · El respaldo se decide por el NOMBRE, no por la fila.** La propuesta §2.2 escribió el respaldo
del destino como «`getClient` devolvió `null`». Insuficiente: `books.contacts.contact_name` es
**nullable** (`packages/zoho-sync/src/db/schema.sql:150`, `contact_name text`, sin `NOT NULL`) y
`clientToLite` no lo coalesce (`packages/zoho-sync/src/books/repo.ts:76`, `name: r.name`). Decidir
por `cliente === null` dejaría `«null» (cli-B)` en pantalla. Se decide por «hay nombre no vacío», con
**una sola** regla para los dos lados. Consecuencia declarada, sin maquillar: en el subcaso raro
«fila existe, `contact_name` NULL» la nota dirá *«sin ficha en Books»* cuando sí hay ficha. Se acepta
porque una tercera nota no está autorizada por la propuesta y el subcaso es más raro que la ausencia
de fila; queda anotado en §7.

---

## 1 · La cadena exacta del `422`

### La plantilla

```
El equipo {serial} es de {ladoEquipo} y el ticket se está creando para {ladoDestino}. Corrige el cliente o el equipo.
```

Cada lado se rinde con **la misma** regla, que es la novedad frente a `:75`:

| | Con nombre | Sin nombre |
|---|---|---|
| Equipo | `«{equipo.clienteNombre}» ({equipo.clientId})` | `{equipo.clientId} (sin nombre en el equipo)` |
| Destino | `«{destino.name}» ({clientId})` | `{clientId} (sin ficha en Books)` |

### Los tres renderizados, literales

Con el `serial` `'18A20070'` y el nombre `'Gecelca S.A. E.S.P.'` que los ayudantes vivos ya insertan
(`ticketService.test.ts:240`, `:247`):

1. **Los dos conocidos** — y el caso que motiva la tanda, porque los dos nombres son el mismo:

       El equipo 18A20070 es de «Gecelca S.A. E.S.P.» (cli-A) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.

2. **Equipo sin `cliente_nombre`**:

       El equipo 18A20070 es de cli-A (sin nombre en el equipo) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.

3. **Destino sin fila en Books**:

       El equipo 18A20070 es de «Gecelca S.A. E.S.P.» (cli-A) y el ticket se está creando para cli-B (sin ficha en Books). Corrige el cliente o el equipo.

**Los dos nombres salen de fuentes distintas y conviene decirlo**: el del equipo es
`equipos.cliente_nombre` (`db/equipos.ts:41`, `:76`) y el del destino es `books.contacts.contact_name`
por la vista `clients` (`schema.sql:169-173`). Para el **mismo** id pueden no coincidir. No se
reconcilian aquí: hacerlo sería la tercera implementación de «mismo nombre» que la propuesta §2.1
descarta.

---

## 2 · Dónde va la consulta, y por qué exactamente ahí

**Dentro de la rama (ii), después del `logger.warn` de `:74` y antes del `throw`.** Forma:

```ts
} else if (clientId && equipo.clientId && clientId !== equipo.clientId) {
  logger.warn({ equipoId: equipo.id, equipoClientId: equipo.clientId, clientId }, 'alta de ticket: el cliente no corresponde al equipo')
  // La consulta va DENTRO de la rama y DESPUÉS del warn: sólo se paga en el camino de error, y si
  // fallara, la señal ya está emitida. El ayudante vive aquí a propósito (design §2, §6).
  const destino = await getClient(db, clientId)
  const lado = (nombre: string | null | undefined, id: string, nota: string) =>
    nombre ? `«${nombre}» (${id})` : `${id} (${nota})`
  const deQuien = lado(equipo.clienteNombre, equipo.clientId, 'sin nombre en el equipo')
  const paraQuien = lado(destino?.name, clientId, 'sin ficha en Books')
  throw new HttpError(422, { error: `El equipo ${equipo.serial} es de ${deQuien} y el ticket se está creando para ${paraQuien}. Corrige el cliente o el equipo.` })
}
```

**Después del `warn` y no antes**: el `warn` es la señal a vigilar (§6). Si la consulta extra fallara,
poniéndola delante nos quedaríamos sin señal *y* sin mensaje; detrás, el rechazo queda registrado
pase lo que pase.

**Dentro de la rama y no fuera**: la marcha atrás declarada en la tanda anterior es «quitar **sólo**
la rama (ii) y conservar (i)»
(`…/archive/2026-09-09-cerrar-hallazgos-revision-f1b-01/design.md:85-88`). Todo lo nuevo —consulta,
ayudante, dos respaldos, mensaje— vive dentro del `else if`, así que esa marcha atrás sigue siendo un
borrado limpio, sin código huérfano. Es la razón de que `lado` no suba a módulo.

### Contra la alternativa: bajar la rama (ii) por debajo del `getClient` de `:87`

Es el enfoque 3 de la exploración (`exploration.md:68-73`) y la mutación **M-P1**. Se rechaza, y no
por gusto:

1. **Habría que partir (i) de (ii).** La rama (i) tiene que correr antes de `:82`
   (`if (!clientId) missing.push('cliente')`), o un cuerpo sin `clientId` cuyo equipo sí lo trae
   muere como «falta el cliente». Bajar (ii) rompe el `if / else if` en dos bloques separados por
   catorce líneas.
2. **Entre medias hay dos guardas, y las dos ganarían precedencia sobre la discrepancia**:

   | Guarda intermedia | Hoy | Con (ii) bajada |
   |---|---|---|
   | `:81-86` obligatorios → `422 'Faltan campos obligatorios: …'` | discrepancia | «Faltan campos obligatorios» |
   | `:88` → `422 'Cliente no encontrado'` | discrepancia | «Cliente no encontrado» |

3. **Ninguna prueba viva lo caza.** Las dos de la guarda insertan `cliente('cli-B')`
   (`ticketService.test.ts:364`, `:379`), así que el destino siempre existe en Books y el segundo
   cambio es invisible. `:343-347` fija obligatorios ↔ cliente-inexistente, no obligatorios ↔
   discrepancia.
4. **Contradiría un `SHALL` que ya está escrito.** `spec.md:131-132` exige la guarda antes de las
   guardas 6 y 7 —los obligatorios y «Cliente no encontrado»—. Ese `SHALL` **no** es el punto abierto
   §4.1: §4.1 es la pareja `409` ↔ obligatorios (E2), otra.

Coste asumido, dicho entero: una consulta más al camino de error. El camino feliz no la ve, y sigue
pagando su único `getClient` en `:87`.

---

## 3 · `getClient` devolviendo `null`

**Alcanzable, y la evidencia es de posición.** El único `getClient` de la función está en `:87` y su
guarda «Cliente no encontrado» en `:88`: las dos **después** de `:69-77`. En la rama (ii), por tanto,
nadie ha comprobado todavía que `clientId` exista en `clients`. Y `clientId` puede haber llegado del
cuerpo sin validar (`:27`) o del `customer_id` de la orden (`:39`), que tampoco se contrasta contra
`books.contacts` en este camino.

**Comportamiento**: se rinde `{clientId} (sin ficha en Books)`, se mantiene el `422` de discrepancia,
no se lanza nada nuevo y no se toca ninguna precedencia. **La consulta extra MUST NOT convertir una
discrepancia en «Cliente no encontrado»** — eso es literalmente M-P1, y T3 lo fija.

---

## 4 · Tabla de mutaciones

Regla de mutación 1: la tabla lleva **posición**, no sólo contenido. **Las seis se ejecutan de verdad
y se escribe lo que devuelven; no se afirma que fallarían.** La columna «Resultado» la rellena
`sdd-apply`.

| # | Tipo | Mutación | Prueba que debe ponerse ROJA | Resultado observado |
|---|---|---|---|---|
| **M-P1** | POSICIÓN | Bajar la rama (ii) detrás del `getClient` de `:87` y reutilizar `cliente.name` | **T3** — hoy no la caza nadie (`test.ts:364`, `:379` insertan siempre `cliente('cli-B')`) | *(pendiente del apply)* |
| **M-P2** | POSICIÓN | Subir la rama (ii) por encima del `409` de `:45-49` | **Ninguna. Se espera VERDE** — ver §5 | *(pendiente del apply)* |
| **M-C1** | contenido | Poner `equipo.clientId` en los dos lados | **T1** (`toBe`: el destino debe decir `(cli-B)`) | *(pendiente del apply)* |
| **M-C2** | contenido | Rendir el id crudo del destino sin resolver su nombre (enfoque 2) | **T1** — fija los dos nombres en el caso duplicado | *(pendiente del apply)* |
| **M-C3** | contenido | Quitar el respaldo del destino sin nombre | **T3** — `«undefined» (cli-B)` o excepción, en vez de la nota | *(pendiente del apply)* |
| **M-C4** | contenido | Quitar el respaldo del equipo sin nombre | **T4** — y **`test.ts:369` NO basta**: su `toContain('cli-A')` sigue verde porque el id se enseña siempre | *(pendiente del apply)* |

Las cuatro pruebas afirman con `toBe` sobre la cadena completa, así que casi toda mutación de
contenido muere varias veces; la columna nombra el detector **por diseño**, el que la mata por la
razón correcta.

### 4.1 · Las cuatro pruebas, con su montaje

`equipoConCliente` (`test.ts:238-243`) ya acepta `clienteNombre`, y `cliente(id)` (`:246-248`) inserta
**siempre** `'Gecelca S.A. E.S.P.'` sea cual sea el id. **Ningún ayudante hay que tocar.**

| Prueba | Montaje | Afirma |
|---|---|---|
| **T1** · nombres duplicados | `equipoConCliente('eq-1','cli-A','Gecelca S.A. E.S.P.')` + `cliente('cli-B')`, cuerpo con `clientId:'cli-B'` | `422` y el renderizado 1 de §1, con `toBe` |
| **T2** · nombres distintos | `equipoConCliente('eq-1','cli-A','Ambientalia S.A.S.')` + `cliente('cli-B')` | `422` y la forma normal, con `toBe` |
| **T3** · destino sin ficha | `equipoConCliente('eq-1','cli-A','Gecelca S.A. E.S.P.')`, **sin** `cliente('cli-B')` | `422` y el renderizado 3 — **no** «Cliente no encontrado» |
| **T4** · equipo sin nombre | `equipoConCliente('eq-1','cli-A')` + `cliente('cli-B')` | `422` y el renderizado 2 |

T2 usa un nombre distinto en el **equipo**, no en Books: el lado del equipo nunca lee Books (§1).

### 4.2 · Mutaciones sin detector, declaradas

Dos, y se escriben porque callarlas sería vender la tabla como completa:

- **Subir el `getClient` por encima del `if` de `:65`.** El resultado observable es idéntico; lo único
  que cambia es que el camino feliz pagaría una consulta de más. No hay afirmación funcional que la
  mate. La guarda es el comentario, no una prueba.
- **Cambiar `nombre ?` por `nombre != null`.** Sólo difiere si `cliente_nombre` o `contact_name` valen
  `''`. Que existan filas así es **hipótesis** — no hay acceso a la base para comprobarlo—, y es la
  misma expresión, no otra rama: T4 la ejerce con `NULL`.

---

## 5 · M-P2 verde: es un hallazgo registrado, no un fallo

**Se dice por delante para que un verde no se lea como defecto nuevo.** Subir la rama (ii) por encima
del `409` de `:45-49` no pondrá roja ninguna prueba, y la causa está verificada: las dos pruebas del
tramo `409` (`test.ts:327-334`, `:336-341`) montan el equipo con `equipo()` (`:233-235`), que **nunca
fija `client_id`**, así que la rama (ii) no puede dispararse en ellas. Ningún caso vivo tiene a la vez
una OV duplicada **y** un equipo con cliente en conflicto.

Fijarlo exigiría afirmar quién gana entre el `409` de la OV y el `422` de discrepancia. Esa
precedencia es el **punto abierto** de `openspec/specs/tickets-core/spec.md` §4.1 (`:312-323`), con
`transitions-st` §3.8. Escribir esa prueba la cerraría de tapadillo, en una tanda cuyo no-objetivo
declarado es justamente no tocarla. **Se ejecuta, se registra el verde y no se prueba.** Y con E2, el
delta deja de decir que el orden es el contrario del que hay.

---

## 6 · Señal a vigilar, y salida si ocurre

**La señal.** El `logger.warn` de `:74` sigue **byte a byte igual** y sigue llevando `equipoId`,
`equipoClientId` y `clientId`. Lo que cambia es a qué sirve, ahora que los dos ids también llegan al
operario:

- **Sirve** para contar rechazos sin acceso a la base, y —esto es nuevo— para **correlacionar**: un
  operario que reporta «me salió *cli-A* / *cli-B*» apunta a una línea concreta del servidor. Antes no
  tenía ningún id que citar y la correlación era imposible.
- **No sirve** para tres cosas, y conviene no fingir lo contrario: (a) no lleva los dos **nombres**,
  así que por sí solo no distingue un duplicado de una discrepancia legítima —ese juicio sigue
  necesitando Books—; (b) no es un contador ni agrega nada, de modo que «cuántos de estos son
  duplicados» sigue sin respuesta (pregunta nº 2 de la propuesta, asumida fuera de esta tanda);
  (c) **no registra si el destino tenía ficha**, porque el `warn` se emite antes de la consulta a
  propósito (§2): el caso «sin ficha en Books» es visible en pantalla y ciego en el log.

**Salida si ocurre.** La misma que declaró la tanda anterior, y este diseño la conserva intacta:
quitar **sólo** la rama (ii) —el `422`— y conservar (i), que no bloquea a nadie y es la mitad que M1.1
exige. Todo lo que esta tanda añade vive dentro de esa rama, así que se va con ella sin dejar
huérfanos. Total: `git revert` devuelve el mensaje a la forma de `9ed5635`. Ninguna fila escrita
necesita reparación y el contrato de salida no cambia (sigue siendo `422` con `{ error }`).

---

## 7 · Ficheros, y el re-anclaje al FINAL

| Fichero | Acción | Qué |
|---|---|---|
| `apps/desk/server/services/ticketService.ts` | Modificar | Consulta, ayudante `lado`, dos respaldos y mensaje dentro de `:69-77`; re-anclar `:56` |
| `apps/desk/server/services/ticketService.test.ts` | Modificar | T1–T4 en el `describe` de `:361-398`; re-anclar `:250`, `:303`, `:358` |
| `openspec/specs/tickets-core/spec.md` (delta) | Modificar | `RQ-TC-13` punto 2 y `RQ-TC-05` fila de la discrepancia; corregir el orden de E2; purgar citas caducas |

**El re-anclaje es el ÚLTIMO paso del apply.** No es preferencia de estilo: este cambio inserta ~6
líneas dentro de `:69-77` y vuelve a mover los destinos. Re-anclar primero es garantizar dejarlas
caducas otra vez.

Valores esperados **a confirmar al final del apply**, no verificados —dependen de cuántas líneas de
comentario acabe teniendo el bloque—:

| Cita | Debería pasar a decir |
|---|---|
| `ticketService.ts:56` | ≈ `:88` (`if (!clientId) missing.push('cliente')`) |
| `ticketService.test.ts:250` | ≈ `:87-92` (bloque de obligatorios) |
| `ticketService.test.ts:303` | ≈ `ticketService.ts:22-94` |
| `ticketService.test.ts:358` | ≈ `:88` |

En el delta de spec: `RQ-TC-05` `:114` (`:20-71` → el rango real de la función), `:123` (`:53-58`),
`:124` (`:59-60`), `:127` (`test.ts:247`), `:128` (`:57`); `RQ-TC-13` `:242` (`:67`). Todas ellas
**se recalculan contra el árbol** al cerrar el apply.

---

## 8 · Matriz de amenazas

| Frontera | Aplicabilidad |
|---|---|
| Enrutado / clasificación de ficheros ejecutables | N/A — no se clasifica ni ejecuta ningún fichero |
| Shell y subprocesos | N/A — la tanda no ejecuta comandos |
| Selección de repositorio Git · índice · push · PR | N/A — no hay invocación de Git en el código |

La única frontera real es **HTTP**, y no cambia: mismo `422`, mismo cuerpo `{ error }`
(`util/httpError.ts` → `app.ts:78`), sin ruta nueva. El único dato que sale y antes no salía es el
`clientId` de Books, que **no es secreto**: ya viaja al navegador bajo sesión por `searchClients`
(`books/repo.ts:117-127`) y por `EquipoLite.clientId` (`packages/shared/src/types.ts:345`).

---

## 9 · Lo que queda abierto

- [ ] **Precedencia `409` ↔ `422` del alta** (`spec.md` §4.1, `:312-323`, con `transitions-st` §3.8).
      Sigue sin decidir. Este diseño la esquiva —M-P2 se registra y no se prueba— y sólo corrige la
      **descripción** equivocada de `RQ-TC-05` (E2).
- [ ] **`cliente_nombre` / `contact_name` con `''`.** Hipótesis: no hay acceso a la base. El
      comportamiento de `:75` ante `''` ya era `«»` antes de esta tanda; el ayudante `lado` lo mejora
      de paso y no se prueba aparte (§4.2).
- [ ] **Fila en Books con `contact_name` NULL** (`schema.sql:150`, verificado nullable). Rinde
      *«sin ficha en Books»* aunque la ficha exista. Una tercera nota no está autorizada por la
      propuesta. **Sin destino inventado.**
- [ ] **Duplicados en `books.contacts`.** Esta tanda hace el duplicado *legible*; no lo mide ni lo
      desduplica. `getClient` sigue sin filtrar por `contact_type`, a propósito
      (`books/repo.ts:111-116`).
- [ ] **`RQ-TC-04` (`spec.md:100`)** cita `ticketService.ts:64-66` para una lectura que hoy ocurre en
      `:24`. Otro requisito, fuera de este delta. **Anotado sin destino inventado**, igual que el
      criterio nº 8 de la tanda anterior.
- [ ] **Las citas caducas de `spec.md` §4.1** (`:320-322`: `:50-58`, `test.ts:295`). Están en la
      sección del punto abierto, que este delta no reescribe. Anotadas, sin destino.
