# mensaje-422-cliente-duplicado · El 422 de la guarda equipo↔cliente tiene que decir QUIÉN

| Dato | Valor |
|---|---|
| Estado | **Propuesta — pendiente de visto bueno** |
| Base | `main` en `b3fc829` (la exploración se verificó contra `0a2c4ff`; el bloque afectado no cambió entre ambos) |
| Entradas | `openspec/changes/mensaje-422-cliente-duplicado/exploration.md` |
| Fuente en el maestro | **M1.1** (`R08.1.md:1048`) · **§1.4.3** (`R08.1.md:504`, `:532`) · **punto abierto nº 52** (`R08.1.md:2079`, sólo como límite) |
| Modo | `strict_tdd` · `artifact_store: hybrid` · `delivery_strategy: ask-on-risk` |

---

## 1 · El problema, y por qué ahora

`apps/desk/server/services/ticketService.ts:76` responde:

> `El equipo ${equipo.serial} es de «${nombreEquipo}» y el ticket se está creando para otro cliente. Corrige el cliente o el equipo.`

**Un nombre, ningún id, y al destino no lo identifica.** Los dos ids existen, pero sólo en el
`logger.warn` de `:74`, que vive en el servidor y no delante de quien podría reportarlo.

El falso positivo documentado lo vuelve indistinguible. `getClient` **no** filtra por `contact_type`
—a propósito y escrito (`packages/zoho-sync/src/books/repo.ts:111-116`)—, así que la misma empresa
puede existir como dos filas de `books.contacts`: el equipo apunta a una y el cuerpo o la OV a la
otra. Entonces **los dos lados se llaman igual** y el mensaje dice «es de ACME y se está creando para
otro cliente» cuando el otro también es ACME. Es exactamente la tercera forma del riesgo rector que
§1.4.3 nombra: un dato bien formado, que pasa cualquier lectura, «y que significa algo distinto de lo
que realmente ocurrió» (`R08.1.md:532`). Describe como discrepancia lo que es un duplicado.

**Ahora**, porque la guarda es de la tanda anterior (`9ed5635`) y todavía se sabe por qué está donde
está. Y porque el operario no tiene otra salida: `apps/desk/src/api/client.ts:293-294` lee
**únicamente** `body.error` y descarta el resto del cuerpo; `CreateTicket.tsx:195` lo mete en
`setError` y `:344` lo pinta. Lo que no vaya dentro de esa cadena de texto no le llega a nadie.

---

## 2 · Alcance — una pieza

Enfoque **1** de la exploración (`exploration.md:53-61`): una consulta `getClient` **sólo dentro de la
rama (ii)**, es decir en el camino de error, y el mensaje con **nombre e id de los dos clientes**. No
se mueve ninguna guarda: la posición de `:65-77` sigue siendo la que `:53-58` declara.

### 2.1 · Decisión A — el mensaje enseña SIEMPRE los dos nombres y los dos ids

La alternativa era enseñar el id sólo cuando los dos nombres coinciden. **Se descarta, y no por
gusto:**

1. **Ocultaría el id justo en la mitad de los duplicados.** Que dos filas sean la misma empresa no
   implica que se llamen igual: `apps/desk/server/backfillClientId.ts:41` documenta que «AMBIENTALIA»
   y «Ambientalia S.A.S.» son la misma, y `:42` que ese caso dejó **~352 equipos** sin `client_id`.
   Con nombres desiguales la variante condicional calla los ids y el operario ve dos nombres que
   parecen distintos y son el mismo cliente: la misma ceguera, un paso más allá.
2. **Exigiría una tercera implementación de «mismo nombre de cliente».** Ya hay dos y ya divergen:
   `normalizarNombreCliente` (`backfillClientId.ts:47-68`, pliega acentos y formas societarias) y el
   `LOWER(...) LIKE` de `searchClients` (`books/repo.ts:117-127`, que no pliega nada). `CLAUDE.md`
   registra esa divergencia como lo único que sus tres reglas de mutación **no** cazan.
3. **Una evidencia que sólo aparece a veces no es evidencia.** La rama rara es la que nadie ejercita
   y la primera que se pudre.

Coste asumido: el mensaje es más largo en el caso común. Es un camino de error, se lee una vez, y la
longitud es barata al lado de estar equivocado. Precedente escrito en la casa:
`apps/desk/server/routes/remision.ts:171-172` —«sin él, lo único que puede hacer quien lo recibe es
volver a intentarlo a ciegas»—. Ojo al matiz: allí el id viaja en un campo aparte (`:179`,
`remisionId`); aquí **no cabe esa forma**, porque `client.ts:293-294` sólo mira `error`.

El id de contacto de Books **no es secreto**: ya viaja al navegador bajo sesión por `searchClients`
(`books/repo.ts:117-127`) y por `EquipoLite.clientId` (`packages/shared/src/types.ts:345`).

### 2.2 · Decisión B — qué dice cuando `getClient` devuelve `null`

Es alcanzable: «Cliente no encontrado» es una guarda **posterior** (`:88`), así que en `:69-77` la
fila puede no existir. Y los dos respaldos **no significan lo mismo**, así que no se escriben iguales:

| Lado | Con dato | Sin dato | Qué significa el hueco |
|---|---|---|---|
| Equipo | `«Gecelca S.A. E.S.P.» (cli-A)` | `cli-A (sin nombre en el equipo)` | `equipos.cliente_nombre` vacío (`db/equipos.ts:41`); Books puede tener la ficha |
| Destino | `«Gecelca S.A. E.S.P.» (cli-B)` | `cli-B (sin ficha en Books)` | `getClient` devolvió `null` (`books/repo.ts:129-131`) |

Copiar el `equipo.clienteNombre ?? equipo.clientId` de `:75` a los dos lados diría «`cli-B` (cli-B)» y
callaría el único dato nuevo. **El id se enseña siempre; lo que cambia es la nota.** No se altera
ninguna precedencia: no hay `throw` nuevo ni guarda movida.

### 2.3 · Decisión C — las dos citas caducas entran

Entran, y por qué: **no están sólo desplazadas, apuntan a otra regla.**

| Cita | Dice | Hoy es | A qué apunta hoy |
|---|---|---|---|
| `ticketService.ts:56` | «`:54` (`if (!clientId) missing.push('cliente')`)» | `:82` | `:54` es una línea del propio comentario |
| `ticketService.test.ts:250` | «el bloque de obligatorios de `ticketService.ts:53-58`» | `:81-86` | `:53-58` son comentario |

Las dos viven dentro del bloque que esta tanda abre de todos modos y son la regla de método aplicada
a nuestros propios comentarios. **Se re-anclan al FINAL del apply**, no al principio: este cambio
añade líneas dentro de `:69-77` y vuelve a mover los dos destinos.

Por arrastre entran también las citas que estén **dentro de los requisitos que el delta reescribe** —
`RQ-TC-05` (`openspec/specs/tickets-core/spec.md:111-132`, cuyo `:20-71`, `:53-58` y `:59-60` ya no
corresponden) y `RQ-TC-13` (`:239-260`, cuyo `:67` tampoco): reescribir un requisito conservando una
cita que se sabe falsa sería estrenar el incumplimiento. **Queda fuera** `RQ-TC-04` (`spec.md:100`,
`ticketService.ts:64-66` para una lectura que hoy ocurre en `:24`): otro requisito, no lo toca este
delta. Se anota **sin inventarle destino**, igual que el criterio nº 8 de la tanda anterior.

### 2.4 · Decisión D — la tabla de mutaciones (regla de mutación 1)

**Las mutaciones se ejecutan de verdad y se registra lo que devuelven; no se afirma que fallarían.**

| # | Mutación | Prueba que debe ponerse ROJA |
|---|---|---|
| **M-P1** · POSICIÓN | Bajar la rama (ii) detrás del `getClient` de `:87` y reutilizar `cliente.name` (enfoque 3, `exploration.md:68-73`) | **Nueva**: cuerpo con un `clientId` que NO está en Books + equipo con otro → hoy 422 de discrepancia; movida, «Cliente no encontrado». Hoy no la caza nadie: las dos pruebas vivas insertan `cliente('cli-B')` (`ticketService.test.ts:364`, `:379`) |
| **M-P2** · POSICIÓN | Subir la rama (ii) por encima del 409 de la OV (`:45-49`), contra lo que declara `:57-58` | **Se espera VERDE, y eso es el hallazgo que se registra.** Fijarlo exigiría una prueba sobre la precedencia 409/422 que `tickets-core` §4.1 declara punto abierto: se deja constancia de que ese orden no está probado y por qué esta tanda no lo prueba |
| **M-C1** | Poner el id del equipo en los dos lados | **Nueva**: dos ids con el MISMO nombre → el mensaje contiene `cli-A` **y** `cli-B` |
| **M-C2** | Devolver el id crudo del destino sin resolver su nombre (enfoque 2) | **Nueva** (la misma): el mensaje contiene el nombre del destino |
| **M-C3** | Quitar el respaldo de `getClient === null` | **Nueva** (la de M-P1): el mensaje dice `cli-B` y «sin ficha en Books» |
| **M-C4** | Quitar el respaldo de `equipo.clienteNombre` nulo | **Nueva**: `ticketService.test.ts:369` NO basta — su `toContain('cli-A')` seguiría verde por el id |

Son **cuatro** pruebas nuevas, no seis: dos mutaciones comparten detector.

| Prueba | Caza |
|---|---|
| T1 · dos ids con el mismo nombre → mensaje completo con `toBe` | M-C1, M-C2 |
| T2 · nombres distintos, los dos en Books → mensaje completo con `toBe` | M-C2 (fija la forma normal) |
| T3 · destino que NO está en Books → 422 de discrepancia, con «sin ficha en Books» | **M-P1**, M-C3 |
| T4 · equipo sin `cliente_nombre` → «sin nombre en el equipo», con el id | M-C4 |

### 2.5 · Capacidades (contrato con `sdd-spec`)

| Nuevas | — **Ninguna** |
|---|---|
| Modificadas | `tickets-core` — `RQ-TC-13` punto 2 («el mensaje **SHALL** nombrar al cliente del equipo») pasa a exigir **nombre e id de los dos** y fija los dos respaldos; `RQ-TC-05` fila 4 recoge la nueva forma. Escenarios nuevos: nombres duplicados, destino sin ficha en Books, equipo sin `cliente_nombre` |

---

## 3 · Qué NO hace

- **No** hace que `getClient` filtre por `contact_type`: ese no-filtro es deliberado y documentado
  (`books/repo.ts:111-116`).
- **No** desduplica `books.contacts`.
- **No** toca la precedencia 409/422 del alta (`openspec/specs/tickets-core/spec.md:312-316`). M-P1
  fija la pareja *422-discrepancia vs 422-cliente-no-encontrado*, que es **otra**; M-P2 se ejecuta y
  se registra, pero no se prueba, precisamente para no endurecer el punto abierto.
- **No** compara los dos nombres para añadir una pista del tipo «puede ser el mismo cliente
  duplicado»: sería la tercera implementación de «mismo nombre» (§2.1, punto 2).
- **No** toca pruebas `.tsx` ni la red que las excluye (F0-00, 2026-09-08).
- **No** toca `apps/desk/src`: la guarda es de servidor y no tiene espejo — regla invariable 13,
  punto 2, no punto 3.
- **No** quita el `logger.warn` de `:74`: es la señal a vigilar del falso positivo
  (`…/archive/2026-09-09-cerrar-hallazgos-revision-f1b-01/design.md:81-83`).

---

## 4 · Talla, y si hacen falta PR encadenadas

| Frente | Líneas estimadas |
|---|---|
| `ticketService.ts` (consulta, dos respaldos, mensaje, comentario re-anclado) | ~14 |
| `ticketService.test.ts` (4 pruebas + comentario re-anclado) | ~55 |
| Delta de spec `tickets-core` | ~45 |
| Artefactos SDD (proposal · design · tasks · verify) | ~180 |
| **Total** | **≈ 295** |

**Decisión previa al apply: No. PR encadenadas: No. Riesgo sobre el presupuesto: Bajo.** Cabe bajo
las dos cifras en juego, así que la discrepancia del §7 no cambia el resultado aquí.

---

## 5 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Una consulta más en el alta | Baja | Cae **sólo** en el camino de error, dentro de la rama (ii). El camino feliz no la ve |
| M-P2 sale verde y se lee como «hay un fallo nuevo» | Media | No lo hay: el orden ya estaba sin probar antes de esta tanda. Se registra como constancia, no como regresión |
| El mensaje se lee como una fuga de datos | Baja | §2.1: el id ya viaja al navegador por dos vías bajo sesión (`books/repo.ts:117-127`, `types.ts:345`) |
| Re-anclar citas al principio del apply y volver a dejarlas caducas | Media | §2.3 lo fija como **último** paso; `sdd-tasks` lo ordena así |
| El mensaje más largo estorba en pantalla | Baja | `CreateTicket.tsx:344` lo pinta en un bloque con `rounded p-2`, sin truncado ni altura fija |

---

## 6 · Rollback

Una sola pieza, sin migración, sin dato escrito que deshacer y sin cambio de contrato de salida
(sigue siendo `422` con `{ error }`). `git revert` del commit devuelve el mensaje de `9ed5635`; la
guarda y su código de respuesta no se tocan, así que revertir **no** reabre el desvío que cerró la
tanda anterior. Las pruebas nuevas se van con él.

---

## 7 · Criterio de aceptación

1. `npm test` en verde con **más** pruebas que el baseline y **cero** pruebas del baseline rotas o
   borradas. `ticketService.test.ts:369` sigue pasando sin tocarla.
2. Existen las **cuatro** pruebas nuevas, y consta que se vieron en rojo antes del arreglo.
3. Las **seis** mutaciones de §2.4 se **ejecutaron**, y el resultado de cada una está escrito —
   incluido el verde esperado de M-P2.
4. El mensaje enseña nombre e id de los dos lados en el caso normal, y la nota correcta en cada uno
   de los dos respaldos de §2.2.
5. `ticketService.ts:56` y `ticketService.test.ts:250` citan la línea que existe **después** del
   cambio; el delta de `RQ-TC-05` y `RQ-TC-13` no conserva ninguna cita caduca.
6. `spec.md:100` (`RQ-TC-04`, `:64-66`) queda anotado como caduco **sin destino inventado**.
7. `npm run typecheck` en verde y `npm run lint` sin avisos nuevos.
8. Verificación en la app sobre `ambientalia-desk.ambientalia.cloud`: alta con equipo de un cliente y
   cliente distinto en el formulario; el bloque rojo de `CreateTicket.tsx:344` enseña los dos ids.

---

## 8 · Ronda de preguntas de propuesta — pendiente de Gerencia

El preflight de la sesión llegó con `execution_mode: auto` y esta fase no tiene canal para preguntar.
Se dejan escritas, con la hipótesis que la propuesta ha asumido para cada una:

> **Resuelto por el orquestador el 2026-09-10, después de escribir esta sección.** El `auto` era un
> error del orquestador, no del prompt de arranque: `openspec/config.yaml:22-30` fija
> `execution_mode: interactive` y `review_budget_lines: 800`, y dice por escrito que **corrige
> cualquier valor distinto que aparezca en un prompt de arranque**. El preflight vigente de esta
> sesión es `interactive · hybrid · ask-on-risk · 800 · strict_tdd`. El desvío no cambió el resultado
> —≈295 líneas caben bajo los dos presupuestos—, pero sí se saltó la ronda de preguntas.
>
> **La nº 1 está contestada, y no por hipótesis:** el encargo de la sesión pide literalmente «los DOS
> nombres y los DOS **ids** en el mensaje». Es el id, no el NIT. El NIT queda como posible añadido
> futuro, no como sustituto, tal y como la propuesta ya asumió.
>
> Las nº 2, 3 y 4 se quedan como están: dos son fuera de alcance declarado de esta tanda y la tercera
> es una confirmación cuya respuesta contraria no cambiaría el diseño, sólo su justificación.

1. **¿Es el id de Books el identificador que Gerencia quiere ver en un error de pantalla, o prefiere
   el NIT** (`ClientLite.nit`, `books/repo.ts:76`)? *Asumido: el id, porque es la clave con la que se
   consulta y el NIT puede faltar. El NIT sería un añadido, no un sustituto.*
2. **¿Quiere Gerencia que el sistema cuente los 422 de esta guarda** para saber cuántos son
   duplicados y no discrepancias? *Asumido: no en esta tanda; el `logger.warn` de `:74` sigue siendo
   la señal, tal como lo fijó el `design.md` anterior.*
3. **Si el duplicado resulta ser frecuente, ¿la salida es desduplicar `books.contacts` o retirar la
   guarda?** *Asumido: ninguna de las dos aquí; la marcha atrás sigue siendo la del `design.md:85-88`.*
4. **¿Confirma Gerencia que el operario que recibe este mensaje puede escalarlo a alguien con acceso
   a Books?** *Asumido: sí — de eso depende que el id sea accionable y no sólo ruido.*
