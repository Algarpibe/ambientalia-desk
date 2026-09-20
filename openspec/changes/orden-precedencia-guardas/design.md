# Diseño — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-design` · **Fecha:** 2026-09-17 · **Árbol:** `60f03ae` (limpio)
**Preflight de sesión** (`openspec/config.yaml:25-30`, leído del fichero y no de memoria):
`interactive · hybrid · ask-on-risk · 800 · strict_tdd`
**Entradas:** `proposal.md` y los dos deltas de `specs/` de esta misma carpeta; `CLAUDE.md` del
repositorio (tres reglas, cuatro de mutación, dos del ciclo).
**`rules.design`** (`openspec/config.yaml:1266-1268`): esta tanda **no contiene ninguna sentencia de
creación de tabla**, así que la regla de calificar el esquema `desk.`/`public.` no tiene sujeto. No se
introduce ninguna lectura ni escritura nueva contra la base: los dos bloques que se mueven ya existen
y conservan su SQL palabra por palabra.

---

## ⚠️ Este documento RECOGE Y FIJA. No decide.

**Las decisiones de arquitectura de esta tanda están tomadas y verificadas por Gerencia en una ronda
de preguntas ya cerrada.** Aquí no se elige nada: se deja escrito, sin ambigüedad, qué tiene que hacer
`sdd-apply` y por qué, de modo que no pueda equivocarse. Quien lea esto buscando una fase donde
todavía se abre el abanico está leyendo el documento equivocado — esa fase fue la ronda de preguntas,
y su salida son las ocho entradas de abajo.

| Obs. | Decisión recogida |
|---|---|
| **#690** | P1 · opción (A), **reformulada por #700** |
| **#691** | P2 · §3.8(b) sale del reordenamiento; su `SHALL` se **CONSERVA** |
| **#692** | P3 · la regla `404`/`422` entra **escrita Y fijada por prueba** |
| **#693** | P4 · las seis afirmaciones vivas + nota de Caso C en los documentos fechados |
| **#700** | **ESCALERA A/B/C/D** — el `SHALL` se escribe sobre **qué clase de cosa se comprueba**, nunca sobre el código HTTP |
| **#702** | baja el `409` de OV en `executeTransition`: `ticketService.ts:132-136` detrás de `:140-144` |
| **#707** | escalera como **ORDEN TOTAL**; los dos incumplimientos del alta de remisión se registran como **IV-12** y **NO se arreglan aquí** |
| — | `ticketService.ts:94` («Cliente no encontrado») = **escalón C**, la frontera A/C |

> **Anclaje de este documento.** La cabecera dice `**Árbol:** 60f03ae`, así que **todas** sus citas
> `ruta:línea` se leen contra esa revisión. En cuanto `apply` mueva los dos bloques, este documento
> pasa a ser **Caso B** de la regla de mutación 4 (`CLAUDE.md`): se lee anclado, no se renumera.
>
> **`ad65161` ≡ `60f03ae` para `ticketService.ts` y `ticketService.test.ts`, y está comprobado, no
> supuesto.** El `proposal.md` y los dos deltas anclan a `ad65161`. Se leyeron contra el árbol de
> trabajo limpio de `60f03ae` **todas** las citas de `ticketService.ts` que este diseño reutiliza
> —`:23`, `:25`, `:37`, `:39`, `:43-49`, `:50-64`, `:54-58`, `:65-83`, `:82`, `:87-92`, `:88`, `:92`,
> `:93-94`, `:97`, `:117`, `:119`, `:120-122`, `:123-125`, `:127`, `:128`, `:129-131`, `:132-136`,
> `:134`, `:140-144`, `:143`, `:145`, `:147`— y **todas aciertan**; igual las de
> `ticketService.test.ts` (`:127`, `:144`, `:149`, `:154`, `:160`, `:166`, `:172-193`, `:186-192`,
> `:194`, `:205`, `:213`, `:218`, `:224`, `:238`, `:246-248`, `:250`, `:251`, `:273`, `:302-314`,
> `:315`, `:316`, `:321-326`, `:327`, `:336`, `:340`, `:343`). Lo que **sí** cambió entre las dos
> revisiones es `CLAUDE.md` y `openspec/config.yaml` (el registro de IV-12, hecho en el intento de
> `propose`), así que **las citas a esos dos ficheros de este diseño son de `60f03ae` y NO coinciden
> con las del `proposal.md`**.

---

## 1 · Camino rápido — lo que `apply` hace, en este orden

1. **Escribir N1 en rojo** (equipo↔cliente gana a la OV ya usada). Rojo natural, sin tocar producción.
2. **Mover G4**: el bloque `ticketService.ts:43-49` completo pasa detrás de `:94`. N1 se pone verde.
3. **Voltear `ticketService.test.ts:327` y `:336`** a `422`, con su aserción de texto.
4. **Mover el `409` de `executeTransition`**: `:129-136` detrás de `:144`.
5. **Voltear `ticketService.test.ts:205` en `60f03ae`** a `422`, **cambiando además la forma del cuerpo**.
6. **Escribir N2, N3 y N4**, que nacen verdes: el rojo de cada una se obtiene **mutando** (§5.2).
7. **Reescribir los tres comentarios** y los dos bloques de docblock del fichero de pruebas (§3.3).
8. **Reparar las seis afirmaciones vivas y añadir las cuatro notas de Caso C** (P4).
9. **Barrido de citas de cierre** (§6), por fichero citado y leyendo qué afirma cada frase.
10. `npm test`, `npm run typecheck`, `npm run lint`.

---

## 2 · Enfoque técnico, en una frase

**No hay componente nuevo, ni interfaz nueva, ni migración: se mueven dos bloques ya escritos dentro
de sus propias funciones y se les pone encima una prueba que fija su posición.** Todo el peso de la
tanda está en las tres cosas que no son el `if`: **la secuencia de rojos que demuestra que el orden
está probado**, **el barrido que el desplazamiento obliga**, y **los requisitos vivos que el
movimiento vuelve falsos**.

El criterio que ordena las guardas es el de la escalera A/B/C/D declarada en
`transitions-st` §3.8 del delta: **A** existencia < **B** estado y permiso < **C** contenido <
**D** unicidad, como **orden total**. El diseño no la reabre; la aplica.

---

## 3 · Los dos movimientos, con el orden resultante entero

### 3.1 · `createManagedTicket` — G4 baja detrás de G7

**Lo que se mueve es el bloque `ticketService.ts:43-49` COMPLETO** —el comentario `:43-44` y las cinco
líneas ejecutables `:45-49`, con su `const enUso` de `:45`— y aterriza **detrás de `:94`, antes de
`:95`**.

Orden resultante, entero:

| # | Guarda | Escalón | Respuesta | Línea en `60f03ae` |
|---|---|---|---|---|
| G1 | Falta el equipo | **A** | `422 'Falta el equipo'` | `:23` |
| G2 | El equipo no está en el catálogo | **A** | `422 'Equipo no registrado'` | `:25` |
| G3 | La OV no existe en Books | **A** | `422 'Orden de venta no encontrada'` | `:37` |
| G5 | Discrepancia equipo↔cliente | **C** | `422`, nombrando los dos clientes | `:65-83` |
| G6 | Faltan obligatorios | **C** | `422`, con todos en una lista | `:92` |
| G7 | El cliente no existe en Books | **C** | `422 'Cliente no encontrado'` | `:94` |
| **G4** | La OV ya está asociada a otro ticket | **D** | `409` | **`:45-49` ← baja** |

→ primera escritura: `createTicket` (`:97`).

**Por qué la vía elegida es bajar G4 y no subir G6/G7** (recogido de `proposal.md` §3.1): las dos
producen el mismo orden final `G1 G2 G3 G5 G6 G7 G4`, pero subir G6/G7 obliga a arrastrar también G5
(el bloque `:50-83`, 34 líneas) porque la rama (i) de `:65-68` **tiene que** rellenar `clientId` antes
de que `:88` lo cuente como ausente. Bajar G4 mueve 7 líneas y no toca esa dependencia.

### 3.2 · `executeTransition` — el `409` de la OV baja detrás de la derivación

**El bloque ejecutable es `ticketService.ts:132-136`, la `const nuevaOrdenVenta` de `:132` incluida**;
su comentario `:129-131` viaja con él. Destino: **detrás de `:140-144`, antes de `:145`**.

| # | Guarda | Escalón | Respuesta | Línea en `60f03ae` |
|---|---|---|---|---|
| 1 | La transición existe | **A** | `400 'Transición desconocida'` | `:117` |
| 2 | El ticket existe | **A** | `404 'Ticket no encontrado'` | `:119` |
| 3 | El estado actual está en el `from` | **B** | `409` | `:120-122` |
| 4 | El área del usuario cubre la de la transición | **B** | `403` | `:123-125` |
| 5 | Los obligatorios del plan están presentes | **C** | `422 { errors: plan.errors }` | `:128` |
| 6 | La persona a la que se deriva existe y está activa | **C** | `422 { errors: [...] }` | `:140-144` |
| **7** | La OV no está ya asociada a otro ticket | **D** | `409` | **`:132-136` ← baja** |

→ primera escritura: `applyTransition` (`:147`).

**Las tres comprobaciones que hacen legítimo el movimiento**, verificadas en el fichero:

1. **No hay dependencia de datos.** `nuevaOrdenVenta` (`:132`) y `derivadoA` (`:140`) salen los dos de
   `plan`, construido en `:127`. Son independientes.
2. **Sigue siendo la última guarda antes de escribir.** `applyTransition` está en `:147`, y el bloque
   aterriza antes. **Es el paralelo exacto de `createTicket` (`:97`) en la otra puerta** — que es lo
   que convierte «orden único» en una regla y no en dos arreglos que se parecen.
3. **`derivadoA` sigue declarado antes de su segundo uso** en `:161` (el aviso de derivación), que es
   posterior a la escritura.

### 3.3 · Los comentarios: qué se reescribe y por qué

| Tramo | Qué dice hoy | Qué se hace |
|---|---|---|
| `ticketService.ts:43-44` | «Una OV, un ticket. El buscador ya solo ofrece las libres…» | Viaja con el bloque y **se reescribe para declarar el escalón D y su posición** (última guarda antes de `createTicket`, `:97`), no la anécdota del buscador |
| `ticketService.ts:50-64` | razona la posición de G5 con **dos** motivos: **(a)** la rama (i) tiene que rellenar `clientId` antes de `:88`; **(b)** «meterla antes del 409 alteraría el tramo 409/422 que `ticketService.test.ts` declara y deja explícitamente sin decidir (**no es esta tanda**)» | **(a) sobrevive**: sigue siendo la restricción dura. **(b) CADUCA — ésta ES la tanda.** Se sustituye por la referencia al escalón C y a `tickets-core` RQ-TC-05/RQ-TC-13, y **la posición de G5 sale del comentario y entra en la spec**: es el molde de **H3** de `CLAUDE.md` —posición declarada por comentario y no fijada por prueba— y cerrarlo es trabajo de esta tanda (N1 y N2, §5.2) |
| `ticketService.ts:129-131` | «La segunda puerta por la que una OV entra en un ticket…» | Viaja con el bloque y se reescribe para declarar el escalón D y el paralelo con el alta |
| `ticketService.test.ts:127-142` | «EL ORDEN, DECLARADO. ticketService.ts, líneas 82 a 110» + «DOS TRAMOS… 2. 422 antes que 409 de la OV» | **Reescrito.** El rango 82 a 110 ya era falso antes de esta tanda (`executeTransition` empieza en `:108`), y el tramo 2 deja de ser una rareza para ser consecuencia del orden total |
| `ticketService.test.ts:172-193` | «⚠️ ESTA PRUEBA Y LA DE `:327` DICEN LO CONTRARIO» y «**La precedencia NO está decidida**… es una fila que falta» (`:186-192`) | **Reescrito** — es la reparación P4 del fichero de pruebas. Tras la tanda ya no se contradicen y la fila existe |
| `ticketService.test.ts:302-314` en `60f03ae` y `:321-326` | «EL ORDEN, DECLARADO. ticketService.ts, líneas 22 a 94» + «EL TRAMO QUE SORPRENDE» + «al fijarla una de las dos pruebas cambiará» | **Reescritos.** El rango 22 a 94 sigue acertando por casualidad tras el movimiento (las guardas siguen ocupando `22`–`94`), pero **lo que el bloque afirma deja de ser cierto**, y una cita se comprueba por lo que afirma, no por que la línea exista |

---

## 4 · Mapa de renumeración — la herramienta del barrido

Los dos movimientos, **tomados solos y antes de reescribir los comentarios de §3.3**, son
permutaciones puras de tramos contiguos: el fichero no cambia de longitud. De ahí sale un mapa que
convierte el barrido de §6 en trabajo mecánico y comprobable:

| Tramo en `60f03ae` | Tramo tras los dos movimientos | Desplazamiento |
|---|---|---|
| `1–42` | `1–42` | 0 |
| **`43–49`** (bloque OV del alta) | **`88–94`** | **+45** |
| `50–94` | `43–87` | **−7** |
| `95–128` | `95–128` | 0 |
| **`129–136`** (bloque OV de `executeTransition`) | **`137–144`** | **+8** |
| `137–144` | `129–136` | **−8** |
| `145–fin` | igual | 0 |

Comprobaciones de consistencia: `:45` → `:90`, `:49` → `:94`, `:65` → `:58`, `:92` → `:85`,
`:94` → `:87`, `:134` → `:142`, `:140` → `:132`, `:144` → `:136`.

> **⚠️ El mapa sirve para saber QUÉ citas son candidatas, nunca para escribir el número final.** Los
> tres comentarios se reescriben (§3.3) y eso altera el conteo. **El número final se lee del fichero,
> siempre** — es literalmente la regla del proyecto: «el barrido se comprueba contra el fichero, nunca
> contra la lista» (`CLAUDE.md`, regla de mutación 4).

---

## 5 · Las pruebas

### 5.1 · Las tres que voltean — con la forma exacta de la aserción

| Prueba | Hoy | Después | Detalle que `apply` NO puede improvisar |
|---|---|---|---|
| `ticketService.test.ts:327` | `409` + `r.body.error` = `'La orden de venta OV-DUP ya está asociada al ticket #8101'` | **`422`** + `r.body.error` = `'Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones, prefijo'` | El montaje (`:328-331`) usa `equipo()` **sin** `client_id` y un cuerpo sin ninguno de los cuatro obligatorios, así que la lista sale entera |
| `ticketService.test.ts:336` | `409`, **sin ninguna aserción de texto** (`:340`) | **`422`** + **aserción de texto nueva**: `r.body.error` = `'Cliente no encontrado'` | El montaje (`:337-339`) manda `CAMPOS_OK` (`:251`) y no inserta `cliente()`, así que el único `422` alcanzable es el de `:94`. **La aserción de texto es obligatoria**: un `toBe(422)` a secas no distingue cuál de las tres guardas C ganó, y una prueba que no distingue no es una prueba de posición (regla de mutación 1) |
| `ticketService.test.ts:205` en `60f03ae` | `409` + **`r.body.error`** (`:213`) | **`422`** + **`r.body.errors`** = `['La persona a la que se deriva no existe o está dada de baja']` | **Cambia la FORMA del cuerpo, no sólo el número.** La guarda de derivación lanza `{ errors: [...] }` (`:143`), no `{ error }`. La forma correcta ya está a la vista en `:224` |

### 5.2 · Las cuatro nuevas, y **qué rojo tiene cada una**

**Son cuatro y sólo cuatro.** Tres nacen verdes porque el comportamiento ya existe; bajo `strict_tdd`
su rojo se obtiene **mutando el código, corriendo la suite y revirtiendo**.

| # | Prueba | Par que fija | Rojo previo | Cómo se obtiene, exactamente |
|---|---|---|---|---|
| **N1** | equipo↔cliente gana a la OV ya usada | **G4 vs G5** | **NATURAL** | Se escribe **antes** de mover G4. Montaje: `equipoConCliente('eq-1','cli-A')` (`:238`), cuerpo con `clientId:'cli-B'` y `ordenVenta:'OV-DUP'` ya usada. Hoy contesta `409`; la prueba espera `422` con el mensaje de `:82`. **Rojo sin tocar producción**, y se pone verde con el movimiento de §3.1 |
| **N2** | dentro de C, equipo↔cliente se resuelve antes de contar los obligatorios | **G5 vs G6** | **POR MUTACIÓN** | Escenario del delta `tickets-core`: sin `clientId` en el cuerpo, equipo con `client_id` válido, los demás obligatorios vacíos → `422` listando los que faltan **sin «cliente»** entre ellos. **Mutación:** mover el bloque `:65-83` detrás de `:92`; la lista pasa a incluir «cliente» → rojo; revertir |
| **N3** | el sujeto direccionado por la URL responde `404` | P3 | **POR MUTACIÓN** | `executeTransition` con un `id` de ruta inexistente → `404` (`:119`). **Mutación:** cambiar ese `404` por `422`, correr, ver el rojo, revertir |
| **N4** | la entidad referenciada desde el cuerpo responde `422` | P3 | **POR MUTACIÓN** | Mismo endpoint, `id` de ruta que **sí** existe y `derivado_a` inexistente → `422` (`:143`). **Mutación:** cambiar ese `422` por `404`, correr, ver el rojo, revertir |

**Tres precisiones que deciden si la mutación vale o es teatro:**

1. **La mutación tiene que poner roja LA PRUEBA NUEVA, no sólo la suite.** Invertir el `404` de `:119`
   también pone roja `ticketService.test.ts:149`, que ya existía; si sólo se observa esa, el detector
   nuevo sigue sin demostrarse. **La evidencia que se registra en el `apply-progress` es el nombre del
   `it` nuevo en rojo**, más la mutación aplicada y el `git diff` de la reversión.
2. **Regla de mutación 1 completa, en los dos sentidos.** Tras fijar el orden, mover cada `409` por
   encima de su vecina y comprobar el rojo: G4 por encima de G5 → N1 roja; G4 por encima de G6/G7 →
   `:327`/`:336` rojas; el `409` de `executeTransition` por encima de `:140-144` → `:205` roja.
3. **P3 no toca producción.** `proposal.md` §5 lo excluye expresamente: ningún código, texto ni guarda
   de `ticketService.ts` ni de `remision.ts` cambia por el contrato de errores. Las mutaciones de N3 y
   N4 son temporales y se revierten en el mismo paso.

**El guión de P3 va en fichero nuevo: `apps/desk/server/contratoErrores.test.ts`** —nombre en la
convención de los vecinos (`ordenVentaUnTicket.test.ts`, `transicionesEjecucion.test.ts`)— y contiene
N3 y N4, los dos lados de la misma regla. N1 y N2 van en `ticketService.test.ts`, con las demás
pruebas de posición.

### 5.3 · Las que quedan INTACTAS, y no es una lista decorativa

`ticketService.test.ts:144`, `:149`, **`:154`**, **`:160`**, **`:166`**, **`:194`**, **`:218`**,
`:316`, `:343` y **`apps/desk/server/remisiones.test.ts:957`**.

- **`:154`, `:160` y `:166`** son las tres pruebas que respaldan el `SHALL` de §3.8(b) que P2
  **conserva**: el `409` de estado antes del `403` de área es **sub-orden dentro del escalón B**, no
  una inversión que haya que excusar. Tocarlas sería deshacer P2.
- **`:194`** es la que ya declara el orden bueno en `executeTransition` (`422` de obligatorios gana al
  `409` de la OV). El movimiento de §3.2 **no la afecta**: su montaje no lleva derivación.
- **`:218`** cierra la cadena por el otro extremo: derivación inexistente **sin** OV de por medio.
- **`remisiones.test.ts:957`** es el caso del que nació la regla de mutación 1 de `CLAUDE.md`. Bajo la
  escalera, el `422` del serial (`remision.ts:155`, **A**) gana al `409` de remisión pendiente
  (`:177`, **D**) **porque A precede a D**: pasa de excepción declarada a **consecuencia deducida**, y
  por eso la prueba no se toca ni se reescribe.

---

## 6 · El barrido de cierre — inventario medido contra `60f03ae`

**Se hace por FICHERO CITADO, no por el tema de la tanda**, con
`grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"`, **más un segundo pase para la forma abreviada**
(`` `:134-135` ``, sin nombre de fichero, que ese `grep` no captura), **comprobando los dos extremos
de cada rango por separado** y **leyendo qué afirma la frase**.

### 6.1 · Las tres que un barrido por tema se salta — y son las que más fácil se pierden

Ninguna de las tres habla de precedencia: las tres son **IV-11, la puerta 2 «sólo por número»**. Un
barrido guiado por el asunto de la tanda no las mira.

| Sitio | Cita | Qué afirma | Caso | Reparación |
|---|---|---|---|---|
| `CLAUDE.md:332` | `ticketService.ts:134` | «la puerta 2 comprueba **sólo por número**» | **A** (sigue siendo cierto) | reapuntar (`:134` → la línea del `ticketConOrdenVenta` de `executeTransition` tras el movimiento) |
| `openspec/config.yaml:984` | `ticketService.ts:134` | misma afirmación, campo `afecta_tambien_a_la_puerta_2` del bloque IV-11 | **A** | reapuntar |
| `openspec/config.yaml:987` | `ticketService.ts:45-49` | «La puerta 1 … SÍ, porque mira las dos vías» | **A** | reapuntar los **dos** extremos |

### 6.2 · El resto del inventario vivo, medido

| Sitio | Cita(s) | Caso | Nota |
|---|---|---|---|
| `openspec/config.yaml:455` | `:45-48` y `:134-135` | **B** | Bloque IV-4, `estado: CERRADO`, `cerrado_verificado_en: 2026-09-16, base 79cf09b`. **Se ancla a su revisión, no se renumera** |
| `openspec/config.yaml:478` | `:45-48` y la **abreviada** `:134-135` | **B** | Mismo bloque, campo `decidido:` (fechado 2026-09-10). ⚠️ **Es la abreviada que el `grep` no caza** |
| `openspec/config.yaml:721`, `:736` | `:65-77`, `:65-83` | **A** | G5 se desplaza −7 |
| `CLAUDE.md:208` | `:50-78` | **A** parcial | La frase es histórica (se lee contra `607e26a`) **salvo el paréntesis «hoy la guarda existe»**, que es presente |
| `CLAUDE.md:330` | `:39`, `:65-83` | `:39` sin cambio; `:65-83` **A** | IV-8, vivo |
| `openspec/specs/transitions-st/spec.md:306` | `:140-144` | **A** | RQ-TS-12; la derivación sube a `:132-136`. **No está en la tabla de cinco sitios del delta** |
| `openspec/specs/transitions-st/spec.md:573`, `:574`, `:577` | `:45-49`, `:134-135` | **ver §7** | ⚠️ **No es sólo el número: `:573` y `:577` se vuelven FALSOS** |
| `openspec/specs/tickets-core/spec.md:181`, `:185`, `:401` | `:43-49`, `:43-44`, `:45-48` + abreviada `:134-135` | **A** | RQ-TC-08 y §4.2 siguen siendo ciertos; sólo derivan los números |
| `openspec/specs/tickets-core/spec.md:87`, `:100`, `:214`, `:474`, `:476`, `:479` | `:61-62`, `:64-66`, `:56`, `:69-70`, `:53-58` | **A**, y varias **ya falsas antes** | Se clasifican leyendo la frase; las ya falsas se **registran**, no se renumeran a ciegas |
| `openspec/specs/remisiones/spec.md:330`, `:342` | `:135`, `:134-135` | **A** | Semánticamente intactas |
| `openspec/specs/permissions/spec.md:71`, `:86`, `:301`, `:303` | `:89`, `:90`, `:89-91`, `:86-88` | **ya falsas antes de esta tanda** | Apuntan al bloque de obligatorios del alta cuando hablan del `403` de transición (`:123-125`). **Se registran como hallazgo; corregirlas no es tarea de esta tanda** (`CLAUDE.md`) salvo la referencia a «las dos inversiones» de `:303`, §7 |
| `apps/desk/server/ordenVentaUnTicket.test.ts:19`, `:20` | `:45-49`, `:132-136` | **A** | El mapa de las tres puertas |
| `apps/desk/server/ordenVentaUnTicket.test.ts:25` | `:45` y `:134` **en `b99d47a`** | **B** | **Lleva ancla propia: NO se renumera.** Es el ejemplo bueno de cómo se escriben |
| `apps/desk/server/remisiones.test.ts:903`, `permisos.test.ts:30`, `:53`, `transicionesEjecucion.test.ts:115` | `:53-58`, `:89`, `:86`, `:86` | **A** / ya falsas | Ficheros que el `grep` alcanza y el `proposal.md` §8.2 no nombraba |
| `DEPLOY.md:160` | `:141` | **A** | Cae en el tramo que sube a `:133` |
| `docs/sdd/*`, `docs/runbooks/*`, `docs/Manifesto/*`, `openspec/changes/F0-0*/` | varias | **B** | Documentos **fechados**: se anclan a su fecha. Renumerarlos los volvería falsos sobre sí mismos |
| el plan R01.1, en sus líneas 367 y 380 — **se nombra en prosa a propósito**: escrita con forma de cita, la ruta abreviada la lee el detector como fichero inexistente y bloquea el push (misma razón que la fila de abajo) | `:117`, `:39` | **sin clasificar** | **VETO LEVANTADO el 20/09**, clave `decision/veto-plan-r01-1` en `openspec/config.yaml`. Su premisa —«está modificado en local»— caducó: el fichero está LIMPIO en los cuatro árboles de trabajo y se commiteó dos veces desde que se escribió el veto, `ce93480` (17/09) y `5cfd056` (18/09). Ya no hace falta anclarlo a `ad65161` para citar el plan. Lo que sigue pendiente es LEER esas dos citas y clasificarlas: el veto impidió hacerlo y nadie lo ha hecho todavía |
| `openspec/changes/archive/**` | decenas | **B/C** | **No se renumeran nunca.** Y si hace falta nombrarlas, **se nombran en prosa y sin forma de cita** — escritas como cita el detector las trata como rotas (Q6 de `hook-citas-pre-push`) |

### 6.3 · Los propios deltas de esta tanda también entran en el barrido

Los dos ficheros de `openspec/changes/orden-precedencia-guardas/specs/` citan `ticketService.ts` en
sus **cuerpos normativos**. Hay que separar dos cosas que el delta ya distingue pero que `apply`
puede confundir:

- **La cabecera y los «(Previously: …)»** narran el movimiento: son **Caso B**, anclados a `ad65161`
  por declaración propia del delta. **No se renumeran.**
- **Las tablas normativas** (`RQ-TS-06`, `RQ-TC-05`, `RQ-TC-13`, §3.8) afirman la posición de cada
  guarda **tras** la tanda. Cuando el `archive` las funda en `openspec/specs/`, pasan a ser requisitos
  vivos sobre el árbol de hoy: son **Caso A** y **se reapuntan en el barrido de cierre**. Dejarlas en
  la numeración de `ad65161` publicaría una spec viva que miente sobre su propio código.

**El hook de `pre-push` no sustituye nada de esto.** `apps/desk/server/citas/detector.ts:109-119`
(`rotura()`) comprueba que cada extremo del rango esté dentro del fichero y no caiga en línea vacía;
**no lee qué afirma la frase**. Las afirmaciones caducas que
esta tanda repara no son citas rotas: son prosa, no entran en la línea base, y se quedan mintiendo sin
que nada se ponga rojo.

---

## 7 · Los requisitos vivos que la tanda vuelve FALSOS

Esto no es barrido de citas: es **contenido normativo que deja de ser cierto**. Va aparte porque un
número mal es un despiste y un `SHALL` falso es un contrato roto.

| Sitio | Qué afirma hoy | Tras la tanda | ¿Lo cubre un delta? |
|---|---|---|---|
| `openspec/specs/tickets-core/spec.md:268` (RQ-TC-13, desde `:247`) | «La posición de la guarda —tras el `409` de la OV (`:45-49`) y antes de los obligatorios (`:87-92`)— … **SHALL** seguir igual» | **FALSO**: la guarda deja de ir después del `409` y pasa a ir antes | **SÍ** — delta `tickets-core`, RQ-TC-13. **Es trabajo declarado, no una nota**: la tanda rompe esa frase y la corrige **en el mismo acto**, no en un barrido posterior |
| `openspec/specs/tickets-core/spec.md:114-127` (RQ-TC-05) | tabla del alta con el `409` de la OV en la fila 4 | **FALSO** | **SÍ** — delta `tickets-core` |
| `openspec/specs/tickets-core/spec.md:353-394` (§4.1) | «el `409` de la OV gana al `422` de obligatorios», talla «6 de 12» | **FALSO** | **SÍ** — delta `tickets-core`, con la talla recontada a **3 de 12** |
| `openspec/specs/transitions-st/spec.md:152-167` (RQ-TS-06) | tabla con la OV antes de la derivación | **FALSO** | **SÍ** — delta `transitions-st` |
| `openspec/specs/transitions-st/spec.md:675-722` (§3.8) | «**Dos** inversiones de precedencia», tabla de **cinco** guardas por puerta, pruebas `:295` y `:176` | **FALSO por partida triple** | **SÍ** — delta `transitions-st`. **La tabla del §3.8(a) se REHACE con las SIETE guardas reales, no se parchea**: hoy declara `createManagedTicket` en `ticketService.ts:22-60` y `executeTransition` en `:82-110`, rangos que se cortan justo donde empieza G5 (`:65`), y cita como contradictorias `ticketService.test.ts:295` y `:176` cuando las reales son **`:194`** y **`:327`** |
| **`openspec/specs/transitions-st/spec.md:573`** (§3.4) | «Creación de ticket … El `409` de la OV **gana**» | **FALSO** | ⚠️ **NO** |
| **`openspec/specs/transitions-st/spec.md:577`** (§3.4) | «Las dos primeras **no son equivalentes**: comprueban la misma regla en **órdenes opuestos**» | **FALSO** — tras la tanda evalúan en el mismo orden | ⚠️ **NO** |
| `openspec/specs/permissions/spec.md:303` | «Es **una de las dos inversiones** de precedencia: `transitions-st` §3.8 b)» | Queda descolgada: §3.8 deja de tener «dos inversiones» y §3.8(b) sobrevive como sub-orden de B | ⚠️ **NO** (parcial) |

**Las tres últimas filas son un hallazgo de esta fase, no del encargo.** La tabla de cinco sitios del
delta de `transitions-st` afirma que «ninguna de las cinco se vuelve semánticamente falsa con el
movimiento»; eso es cierto de las cinco que enumera, y `:573`/`:577` **no están entre ellas**. Son el
molde exacto de la regla de mutación 4: *no basta con que la línea exista, hay que leer qué afirma la
frase*. Queda registrado en §11 como pregunta abierta, porque cambiar un requisito vivo se hace por
delta y el alcance de los deltas está cerrado por las ocho decisiones.

---

## 8 · Flujo de datos

Ninguno nuevo. Lo que cambia es **el punto de la secuencia en el que la petición muere**:

```
  POST /api/tickets                      POST /api/tickets/:id/transition
        │                                            │
   [A] equipo, catálogo, OV existe          [A] transición, ticket existe
        │                                            │
        │                                   [B] estado de origen, área
        │                                            │
   [C] equipo↔cliente, obligatorios,        [C] obligatorios del plan,
       cliente en Books                         derivación válida
        │                                            │
   [D] OV ya usada   ← baja aquí           [D] OV ya usada   ← baja aquí
        │                                            │
   createTicket (:97)                       applyTransition (:147)
```

**Cero lectura nueva contra la base y cero escritura nueva.** `ticketConOrdenVenta` se sigue llamando
una vez por puerta, con los mismos argumentos; sólo se llama **más tarde**. Consecuencia medible: en
el camino de error por contenido, esa consulta **deja de ejecutarse** — la petición muere antes.

---

## 9 · Ficheros

| Fichero | Acción | Qué cambia |
|---|---|---|
| `apps/desk/server/services/ticketService.ts` | Modificar | `:43-49` baja detrás de `:94`; `:129-136` baja detrás de `:144`; tres comentarios reescritos (§3.3) |
| `apps/desk/server/services/ticketService.test.ts` | Modificar | `:327`, `:336`, `:205` voltean (§5.1); bloques `:127-142`, `:172-193`, `:302-314`, `:321-326` reescritos; **N1 y N2** nuevas |
| `apps/desk/server/contratoErrores.test.ts` | **Crear** | **N3 y N4**, los dos lados del contrato `404`/`422` |
| `openspec/specs/transitions-st/spec.md` | Modificar (vía delta + barrido) | §3.8 y RQ-TS-06 por delta; `:306`, `:573`, `:574`, `:577` por barrido/§7 |
| `openspec/specs/tickets-core/spec.md` | Modificar (vía delta + barrido) | RQ-TC-05, §4.1 y RQ-TC-13 por delta; `:181`, `:185`, `:401` y demás por barrido |
| `openspec/specs/remisiones/spec.md`, `.../permissions/spec.md` | Modificar (barrido) | sólo citas |
| `CLAUDE.md`, `openspec/config.yaml` | Modificar (barrido) | sólo citas. **IV-12 ya está registrado** en el intento de `propose` |
| `docs/sdd/` (4 ficheros) | Modificar | notas de **Caso C** (P4), **conservando el texto original** |
| `apps/desk/server/routes/remision.ts` | **NO se toca** | Su incumplimiento es **IV-12**, registrado y sin destino |
| `docs/sdd/Desk2.0_Plan_..._R01.1.md` | **NO se toca** | Veto de Gerencia |

---

## 10 · Estrategia de pruebas y regla 13

| Capa | Qué se prueba | Cómo |
|---|---|---|
| Unidad / servicio | Las **siete** guardas del alta y las **siete** de `executeTransition`, por posición | `ticketService.test.ts`, contra Postgres de pruebas, igual que hoy |
| Contrato de errores | `404` del sujeto de la URL frente a `422` de la referencia del cuerpo | `contratoErrores.test.ts`, rojo por mutación |
| Regresión | Las 9 pruebas intactas + `remisiones.test.ts:957` | `npm test` completo |
| E2E / interfaz | **N/A** | Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00; `vitest.config.ts:16`, `:17-20`) |

**Regla invariable 13, casilla marcada (regla de mutación 3).** Esta tanda **no toca
`apps/desk/src`**: no añade ni modifica ninguna decisión del cliente, así que no hay ninguna decisión
de cliente que emparejar con una línea del servidor. **Las siete guardas del alta y las siete de la
transición viven todas en el servidor y están impuestas ahí**; el cliente sólo recibe el código y el
texto. La casilla queda marcada por ausencia de sujeto, escrito y no recordado.

**Matriz de amenazas: `N/A`** — no hay enrutado nuevo, ni comandos de shell, ni subprocesos, ni
automatización de VCS/PR, ni clasificación de ficheros ejecutables, ni integración de procesos. Los
dos movimientos son internos a dos funciones y no cambian ninguna superficie expuesta.

**Migración / despliegue: ninguna.** No hay esquema, ni dato persistido, ni bandera de configuración.
La reversión es `git revert` del commit del orden y devuelve los dos bloques a `:45-49` y `:132-136`.

---

## 11 · Riesgos y preguntas abiertas

| Riesgo | Prob. | Mitigación escrita |
|---|---|---|
| `apply` mueve sólo `:133-136` y deja atrás la `const` de `:132` | Media | §3.2 lo dice con el número: **el bloque ejecutable es `:132-136`, la `const` incluida** |
| `apply` voltea `:205` cambiando sólo el número y deja `r.body.error` | **Alta** | §5.1 fija la forma: la guarda de derivación lanza `{ errors: [...] }` (`:143`), como `:224` |
| `apply` deja `:336` con un `toBe(422)` sin texto y la prueba deja de distinguir | Media | §5.1 lo declara aserción obligatoria, con su razón (regla de mutación 1) |
| Las tres comprobaciones que nacen verdes se dan por buenas sin mutar | Media | §5.2 fija la mutación de cada una **y** exige que el rojo se observe en la prueba nueva, no en la suite |
| El barrido se salta `ticketService.ts:134` (IV-11, no habla de precedencia) | Media | §6.1, tabla propia con los tres sitios |
| El barrido se salta la **forma abreviada** (`config.yaml:478`, `tickets-core:401`) | Media | §6 exige el segundo pase; §6.2 nombra los dos sitios medidos |
| Se renumeran a ciegas los documentos fechados y se vuelven falsos sobre su propia fecha | Media | §6.2 los marca **Caso B** uno a uno; P4 fija Caso C: se conserva el texto y se añade qué lo cerró |
| Los cuerpos normativos de los deltas se publican con la numeración de `ad65161` | Media | §6.3 separa cabecera (B) de tabla normativa (A) |
| `apply` se pasa de 800 por el informe | Media | `proposal.md` §7: disparador medible de 500 y corte en dos rebanadas ya decidido |

**Preguntas abiertas — NO son requisitos de esta tanda:**

- [ ] **`transitions-st` §3.4 (`:573`, `:577`) se vuelve falso y ningún delta lo cubre** (§7). Las tres
      salidas conocidas —añadir §3.4 a los `MODIFIED Requirements` del delta de `transitions-st`;
      tratarlo como reparación P4 de afirmación viva; o registrarlo y dejarlo para la tanda que toque
      §3.4— **no son equivalentes y ninguna está decidida.** Requiere decisión de alcance antes de
      `sdd-tasks`.
- [ ] **`permissions/spec.md:303`** remite a «las dos inversiones» de §3.8, que tras la tanda ya no
      son dos. Misma pregunta de alcance, menor.
- [ ] **Citas ya falsas antes de esta tanda** en `permissions/spec.md:71`, `:86`, `:301`, `:303`,
      `permisos.test.ts:30`, `:53` y `transicionesEjecucion.test.ts:115`. Se **registran**; corregirlas
      no es tarea de la tanda que las encuentra (`CLAUDE.md`), pero el barrido las va a sacar y alguien
      tiene que decir qué se hace con ellas.
- [ ] Los **tres puntos abiertos** de `proposal.md` §12 —agregar los dos errores en una respuesta, el
      literal `'Ticket no encontrado'` duplicado, e **IV-12**— siguen con dueño **Gerencia** y sin
      destino inventado. **Archivar esta tanda no los da por hechos** (regla del ciclo 1).

---

## 12 · Criterio de cierre de esta fase

El diseño está completo cuando `sdd-apply` puede ejecutar §1 sin volver a preguntar **qué** se mueve,
**dónde** aterriza, **qué** aserción cambia de forma, **qué rojo** tiene cada comprobación nueva y
**qué citas** hay que barrer. Lo que sigue abierto está en §11 y es alcance, no diseño.
