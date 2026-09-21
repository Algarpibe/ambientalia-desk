---
tanda: F1B-10
motivo: ""
capacidad: [transitions-st, tickets-core]
maestro: ["nº 52"]
cierra: si
toca_maestro: no
origen_cabecera: derivada-17/09
---

# Propuesta — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-propose` · **Árbol de referencia:** `ad65161` (limpio)
**Redactada el 2026-09-17 · ACTUALIZADA dos veces el mismo día**, por obs. **#700** (la escalera
A/B/C/D supersede la REDACCIÓN de P1, no su intención), obs. **#702** (el `409` de la OV de
`executeTransition` baja detrás del `422` de derivación) y obs. **#707** (la escalera se escribe como
**orden total**; el `409` de remisión pendiente vuelve a **D**; el alta de remisión se registra como
desvío vivo y no se corrige aquí).

**Toda cita `ruta:línea` de este documento se lee contra `ad65161`.** Esta tanda MUEVE líneas en
`ticketService.ts`, así que a partir de su `apply` este documento es **Caso B** de la regla de
mutación 4: se lee anclado a `ad65161`, no renumerado a hoy. **El plan se cita siempre contra
`ad65161`**, porque está modificado en local.

**Procedencia:** `plan:425` — «Orden único de precedencia entre guardas», capacidades
`transitions-st` y `tickets-core`, talla **M**, bloqueo «ninguno técnico; el orden se declara en la
spec». Entrada 5.a de `docs/sdd/F0-01_Correcciones_para_el_plan.md:243`.
**Cita del maestro** (`rules.proposal`, `openspec/config.yaml:1260` en `21b16ec`): la guarda cuya precedencia se
ordena es «una OV, un ticket», punto abierto nº 52, `R08.1.md:2079` — fuera del §3.2 marcado
`[EN REVISIÓN — R08]` (`:2839-3015`), así que es procedencia válida.

**Decisiones de entrada, cerradas:** obs. **#690** (P1), **#691** (P2), **#692** (P3), **#693** (P4),
cierre en **#694**; más **#700**, **#702** y **#707**. Cambian **cómo se expresa** el orden único y
**qué bloques se mueven**; el criterio de fondo de P1 —primero lo que el usuario puede arreglar— no
cambia en ningún punto.

---

## 0 · Qué se decidió, y por qué la redacción vieja no podía sostenerse

P1 (obs. #690) declaró el orden único como **«422 → 409 en las tres puertas»** y añadió que **«ninguna
guarda se mueve de sitio»**. Medido, ninguna de las dos frases podía cumplirse:

1. **El orden es posicional.** Para que el `422` de obligatorios (`ticketService.ts:92`) gane al `409`
   de la OV (`:45-49`), o el `409` baja o los `422` suben. No hay tercera vía.
2. **La forma «todo 422 antes de todo 409» es falsa hoy.** `executeTransition` pone el `409` de estado
   de origen (`:120-122`) antes del `422` de obligatorios (`:128`) —y `ticketService.test.ts:160` lo
   fija en verde—, que es **exactamente la cadena que P2 (obs. #691) declaró deliberada y correcta**.
   P1 y P2 se contradecían tal como estaban redactadas.

**Obs. #700 lo resuelve en la raíz:** el eje nunca fueron los códigos HTTP, sino **qué clase de cosa se
comprueba**. **Obs. #702 retira el corolario que sobrevivía:** `executeTransition` quedaba excluido
«porque ya va 422 → 409», premisa que #700 retiró, así que la exclusión cae con ella. **Obs. #707
cierra la forma:** la escalera se escribe como **orden total**, y lo que no la cumple se **registra**
en vez de recortarla.

---

## 1 · Intención

Hoy el motor no tiene **un** contrato de errores: tiene tres, uno por puerta, y cada uno es el que le
salió a quien lo escribió. Quien manda un formulario a medias con una orden ya usada recibe la queja
de la orden en el alta y la de los campos en `habilitar_servicio`
(`transitions-st/spec.md:698-702`). Esta tanda declara **un orden total de precedencia**, lo aplica a
las dos puertas del motor, lo fija con pruebas de posición, **registra la puerta que no lo cumple** y
repara el registro caduco que decía que el plan no tenía fila para esto.

## 2 · El orden único es un ORDEN TOTAL sobre cuatro escalones

> **Regla de redacción, vinculante para `sdd-spec`: ningún `SHALL` de esta tanda se escribe por código
> HTTP.** Se escribe por escalón. El código de respuesta es **consecuencia** del escalón y del canal,
> nunca el criterio. (obs. #700, confirmada por #707)

> **`SHALL`, sin recortes:** `A < B < C < D` es un **orden total** sobre las guardas. **Toda** guarda
> de un escalón anterior **SHALL** evaluarse antes que **cualquier** guarda de un escalón posterior.
> No se acota por grupo, no se enuncia como «precedencia observable» y no admite excepción escrita.
> Así `plan:425` entrega lo que encarga: un orden **único**. (obs. #707)

| Escalón | Qué clase de cosa comprueba | Guardas, verificadas en `ad65161` |
|---|---|---|
| **A · existencia** | ¿está presente y **existe** aquello que la petición direcciona, o que aporta por identificador? | `:117` transición desconocida · `:119` ticket no encontrado · `:23` falta el equipo · `:25` equipo no registrado · `:37` OV no encontrada · `remision.ts:123` falta el ticket · `:125` ticket no encontrado · `:155` falta el serial · `:220` OV no encontrada |
| **B · estado y permiso del sujeto** | ¿puede esta operación ocurrir sobre este sujeto **ahora**? | `:120-122` estado de origen · `:123-125` área |
| **C · contenido** | ¿es **válido y coherente** lo que la petición aporta como contenido? | `:65-83` equipo↔cliente · `:92` obligatorios · `:94` cliente no encontrado · `:128` obligatorios del plan · `:140-144` derivación · `remision.ts:127` fecha inválida · `:197` ítems fuera del checklist |
| **D · unicidad sobre un valor aportado** | ¿el valor aportado **choca con otro registro**? | `:45-49` y `:132-136` OV ya usada · `remision.ts:177` remisión pendiente · `:230-234` tercera puerta |

**La frontera A/C, que es donde se decide casi todo.** Dos guardas se apoyan en ella y conviene dejar
escrito por qué caen donde caen, o `sdd-spec` las clasificará al revés:

- **`:94` «Cliente no encontrado» es C, no A.** No comprueba una entidad aportada tal cual: comprueba
  el `clientId` **ya resuelto**, que en ese punto pudo venir del cuerpo, de la orden de venta (`:39`)
  o del equipo (`:68`). Valida el resultado de una resolución, no un identificador recibido.
- **`:140-144` «la persona a la que se deriva» es C, no A** (obs. #702, que lo clasifica así
  expresamente). No es existencia pura: rechaza también a quien existe pero está dado de baja
  (`:143`, `!persona?.active`). Existencia **más** una condición es validez.

**El criterio de fondo de P1 sobrevive intacto:** primero lo que el usuario puede arreglar (A y C),
después lo que no (D). La escalera sólo lo hace decible sin contradecir a P2.

### Sub-orden dentro de un escalón

Dos guardas del mismo escalón no las ordena la escalera: las ordena la dependencia de datos, y se
fijan por prueba. Los dos casos vivos: **presencia antes que validez** —`:128` (falta el campo) antes
de `:140-144` (el valor no resuelve)— y **el hueco se rellena antes de contarlo** —`:65-83` antes de
`:92`, porque la rama (i) (`:65-68`) tiene que poner `clientId` antes de `:88`
(`if (!clientId) missing.push('cliente')`)—. **El `409` de estado y el `403` de área son los dos
escalón B**, así que el `SHALL` de §3.8(b) que P2 conserva es sub-orden dentro del escalón, no una
inversión que haya que excusar.

### Las tres puertas contra el orden total

| Puerta | Secuencia de escalones | Veredicto |
|---|---|---|
| `createManagedTicket`, tras §3.1 | **A A A C C C D** | **cumple** |
| `executeTransition`, tras §3.2 | **A A B B C C D** | **cumple** |
| Alta de remisión (**no se toca**) | **A A C A D C A D** | **INCUMPLE en dos puntos → IV-12, §12.3** |

**El precedente de F1B-01 es una CONSECUENCIA, no una excepción.** `remision.ts:155` —el `422` del
serial, escalón A— gana al `409` de remisión pendiente (`:177`, escalón D) **porque A precede a D**.
No hay nada que declarar aparte: la prueba de posición `remisiones.test.ts:957`, el caso del que nació
la regla de mutación 1 de `CLAUDE.md`, queda **intacta**. Así se redacta en la spec — es más fuerte
que declararlo aparte, porque una regla con excepciones se recuerda mal y una consecuencia se deduce.

**Y la spec NO dirá que las tres puertas cumplen.** Dirá que el orden total es uno, que las dos
puertas del motor lo cumplen tras esta tanda, y que el alta de remisión **no lo cumple**, con las dos
líneas y la referencia a IV-12. Una regla verdadera con un incumplimiento registrado es contrato; una
regla recortada hasta que todo encaje es la mentira que esta tanda repara.

## 3 · El movimiento — una regla aplicada dos veces

**El `409` de unicidad (escalón D) es la última guarda antes de la escritura, en las dos puertas del
motor.** No son dos decisiones: es la misma regla aplicada dos veces, que es lo que `plan:425` promete
al decir «orden **único**».

### 3.1 · `createManagedTicket` — baja el bloque `:43-49` detrás de `:94`

Las siete guardas reales hoy: G1 `:23` (A) · G2 `:25` (A) · G3 `:37` (A) · G4 `:45-49` **409** (D) ·
G5 `:65-83` (C, posición declarada sólo por comentario en `:54-58`) · G6 `:92` (C) · G7 `:94` (C).

| Vía | Qué mueve | Coste | Veredicto |
|---|---|---|---|
| **1 · bajar G4** | el bloque `:43-49` (7 líneas) pasa detrás de `:94`, antes de `:95` | 7 líneas movidas | **ELEGIDA** |
| 2 · subir G6/G7 | obliga a mover también G5 (bloque `:50-83`, 34 líneas) | ~40 líneas movidas | descartada |

**Las dos producen el MISMO orden final** (`G1 G2 G3 G5 G6 G7 G4`); se diferencian sólo en qué líneas
se mueven. Gana la vía 1 por tres razones medidas:

1. **La restricción dura de G5 se respeta por construcción.** La razón **(a)** de `:54-58` sigue viva:
   la rama (i) tiene que rellenar `clientId` antes de `:88`, o un cuerpo sin `clientId` cuyo equipo sí
   lo trae moriría como «falta el cliente». La vía 1 no toca G5 ni `:88`.
2. **La razón (b) —«no es esta tanda»— caduca aquí.** Ésta ES la tanda. El comentario `:50-64` se
   reescribe sí o sí, y con él **la posición de G5 sale del comentario y entra en la spec**: es el
   molde de **H3** de `CLAUDE.md` —posición declarada por comentario y no fijada por prueba— y
   cerrarlo es trabajo de esta tanda.
3. **G4 sigue antes de cualquier escritura:** la primera es `createTicket` (`:97`).

### 3.2 · `executeTransition` — baja el bloque `:129-136` detrás de `:144` (obs. #702)

El bloque ejecutable es `:132-136` (la `const` de `:132` incluida); su comentario `:129-131` viaja con
él. Destino: detrás de `:140-144`, antes de `:145`.

| Orden resultante | Guarda | Escalón |
|---|---|---|
| `:117` | 400 transición desconocida | A |
| `:119` | 404 ticket no encontrado | A |
| `:120-122` | 409 estado de origen | B |
| `:123-125` | 403 área | B |
| `:128` | 422 obligatorios del plan (presencia) | C |
| `:140-144` | 422 derivación (validez del valor aportado) | C |
| `:132-136` | 409 OV ya usada | **D ← baja** |

Tres comprobaciones hechas contra el código antes de proponerlo:

- **No hay dependencia de datos que lo impida.** `nuevaOrdenVenta` (`:132`) y `derivadoA` (`:140`)
  salen los dos de `plan`, construido en `:127`. Son independientes entre sí.
- **Sigue siendo la última guarda antes de la escritura:** la primera escritura es `applyTransition`
  en `:147`, y el bloque aterriza antes.
- **`derivadoA` sigue declarado antes de su segundo uso** en `:161` (el aviso de derivación), que es
  posterior a la escritura.

**Ninguna prueba nueva hace falta para este par.** `ticketService.test.ts:205` en `ad65161` **ya es** prueba de
posición: manda `'Orden de Venta': 'OV-DUP'` y `derivado_a: 'no-existe'` a la vez (`:210`). Se
**voltea** de `409` a `422`. Y `:218` —una sola guarda, sin OV de por medio— sobrevive **intacta**.

### 3.3 · El alta de remisión no se toca

P1 la mantiene sin cambios y obs. #707 lo confirma. Su incumplimiento del orden total se **registra**
como **IV-12** (§12.3), no se corrige aquí.

## 4 · Las pruebas, completas y en las dos direcciones

**Cambian — 3 de las 12:**

| Prueba | Hoy | Después | Motivo |
|---|---|---|---|
| `ticketService.test.ts:327` | 409 | **422** | P1 · G4 vs G6 |
| `ticketService.test.ts:336` | 409 | **422** | P1 · G4 vs G7 |
| `ticketService.test.ts:205` en `ad65161` | 409 | **422** | obs. #702 · OV vs derivación |

**Intactas — las otras 9, más la de remisión:** `ticketService.test.ts:144`, `:149`, **`:154`**,
**`:160`**, **`:166`**, **`:194`**, **`:218`**, `:316`, `:343`, y
**`apps/desk/server/remisiones.test.ts:957`**.

**Nuevas — 4, y sólo 4:**

| Prueba | Par | ¿Rojo previo? |
|---|---|---|
| equipo↔cliente gana a la OV ya usada | **G4 vs G5** | **natural** (hoy contesta 409) |
| equipo↔cliente gana a los obligatorios | **G5 vs G6** | **por mutación** (hoy ya gana; se distingue por el texto, como `:343`) |
| sujeto direccionado por la URL → 404 | P3 | **por mutación** |
| entidad referenciada desde el cuerpo → 422 | P3 | **por mutación** |

Las dos primeras son obligatorias porque hoy **no existe** prueba de posición para esos dos pares: su
orden vive sólo en el comentario `:54-58`, y bajo la regla de mutación 1 eso «es tanto como decir
ninguna».

**`strict_tdd` y las tres que nacen verdes.** El comportamiento ya existe, así que el rojo se consigue
**mutando** —invertir las dos guardas o los dos códigos, correr la suite, verla roja— y revirtiendo con
`git diff`. **Es obligación declarada del `apply-progress`: sin esa evidencia registrada, el detector
no existe.** Y regla de mutación 1 completa: tras fijar el orden, mover cada `409` arriba y abajo de su
vecina y comprobar el rojo en ambos sentidos.

**El recuento de `transitions-st/spec.md:682`, recalculado CONTANDO** (P2 lo exige así, no restando):
cambian **3 de 12**, no 6. El bloque de precedencia crece a **16** con las cuatro nuevas.

## 5 · Alcance

### Entra

1. **Los dos movimientos** de §3.1 y §3.2, con sus comentarios (`:43-44`, `:50-64`, `:129-131`)
   reescritos para declarar el escalón, no la anécdota.
2. **Las tres pruebas que voltean** (`:327`, `:336`, `:205`) y **las cuatro nuevas** de §4.
3. **P2 · spec:** §3.8 pasa de «Dos inversiones» a **una**; el `SHALL` de §3.8(b) se conserva como
   sub-orden dentro del escalón B, con sus tres pruebas de respaldo (`:154`, `:160`, `:166`) y la nota
   de alcance que la propia spec ya trae (`:710-715`: el middleware exige sesión en
   `routes/tickets.ts:35` — «inconsistencia de contrato, no fuga»); el recuento de `:682` se recalcula.
4. **La tabla del §3.8(a) se REHACE entera**, no se parchea: hoy declara `createManagedTicket` en
   `ticketService.ts:22-60` y `executeTransition` en `:82-110` con **cinco** guardas, y los dos rangos
   se cortan justo donde empieza G5 (`:65`). Las reales son **siete**. Sus citas de pruebas (`:295` y
   `:176`) también están caducas: las reales son `:327` y `:194`.
5. **`tickets-core` §4.1 se REESCRIBE**, por lo mismo: cita «`ticketService.ts:43-49` antes de
   `:81-86`» (`spec.md:368`) y hoy los obligatorios están en `:92` y el cliente en `:94`.
6. **P3 · contrato de errores** como regla escrita más prueba que la fije: sujeto direccionado por la
   URL → `404`; entidad referenciada desde el cuerpo o desde datos guardados → `422`.
7. **P4 · seis reparaciones vivas** (`transitions-st/spec.md:675`, `:679-680`, `:685`;
   `tickets-core/spec.md:358`, `:366`; `ticketService.test.ts:186-192`) **más cuatro notas de Caso C**
   en los documentos fechados (`F0-01_Correcciones_para_el_plan.md:243`,
   `Puntos_para_Gerencia_2026-09-11.md:366`, `:369`, `:373`,
   `Decisiones_Gerencia_2026-09-10.md:598`), conservando su texto.
8. **El registro del desvío IV-12** en `CLAUDE.md` y `openspec/config.yaml` — **hecho ya, en este
   mismo intento de `propose`** (§12.3).
9. **El barrido de citas de cierre** (§8).

### No entra

- **Reordenar el alta de remisión.** Es IV-12, registrado y **sin destino** (§12.3).
- **Agregar los dos errores en una sola respuesta.** Punto abierto nº 1; sube la talla (obs. #690).
- **Desduplicar el literal `'Ticket no encontrado'`.** Punto abierto nº 2.
- **Cambiar ningún código de respuesta, texto o guarda de `remision.ts` o `tickets.ts`.** P3 lo excluye
  a propósito: tocarlos activaría la regla de mutación 4 sobre dos ficheros muy citados más.
- **La tercera puerta de la OV** (`remision.ts:230-234`) y el `422` del serial
  (`remisiones.test.ts:957`): ya probados por posición; la spec los recoge, no los reabre.
- **IV-8** (`ticketService.ts:39`) e **IV-11**: siguen vivos y sin destino. No son precedencia.
- **`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`**: veto explícito de Gerencia, está
  modificado en local. Se cita anclado a `ad65161` y no se toca.

## 6 · Capacidades — contrato con `sdd-spec`

### Nuevas
- Ninguna.

### Modificadas
- **`transitions-st`**: §3.8 reescrita — el orden total A/B/C/D como `SHALL` **por clase, nunca por
  código**; tabla de las siete guardas reales; el `409` de unicidad como última guarda antes de la
  escritura en las dos puertas del motor; el `SHALL` de §3.8(b) conservado como sub-orden de B;
  recuento recalculado; el incumplimiento del alta de remisión declarado con sus dos líneas y su
  referencia a IV-12; más el `SHALL` del contrato de errores `404`/`422` (P3).
- **`tickets-core`**: §4.1 reescrita — el `409` de la OV pasa a ser la última guarda del alta de
  ticket, y la posición de la guarda equipo↔cliente entra en la spec en vez de vivir en un comentario.

## 7 · La talla: **M → L**, con el número delante y con la razón

`plan:425` dice **M**, y esa talla se fijó cuando la fila prometía «ninguno técnico; el orden se
declara en la spec» — es decir, **cuando se creía que la tanda no tocaba código**. Hoy toca dos
bloques de código en dos funciones, voltea tres pruebas, añade cuatro, reescribe dos secciones de spec
(92 líneas), repara seis afirmaciones vivas, anota cuatro documentos fechados, **registra un desvío
nuevo en dos ficheros de contexto de sesión** y arrastra un barrido de citas sobre tres ficheros muy
citados. **La razón del retalle no es que sea más grande: es que la premisa que fijó la M resultó
falsa.** Se retalla a **`L`**. *(Confirmado por Gerencia el 2026-09-17.)*

### Presupuesto por intento del ledger (techo 800)

El ledger mide **inserciones + borrados sin detección de renombrado**, así que una sección reescrita
cuesta las líneas viejas **más** las nuevas, y un bloque movido cuesta el doble de lo movido.

| Intento | Estimación | ¿Cabe? |
|---|---|---|
| **`sdd-propose` (éste)** | **608 medidas** = `proposal.md` **525** (fichero nuevo sin trackear: el ledger puede registrar 0 por el desvío conocido, y la medida real es `wc -l`) + `openspec/config.yaml` **71** + `CLAUDE.md` **12** | **sí**, con 192 de margen |
| `sdd-spec` | ~240 (deltas, ficheros nuevos) | sí |
| `sdd-design` | ~200 | sí |
| `sdd-tasks` | ~130 | sí |
| **`sdd-apply`** | **≈ 666** — ver desglose | **sí, con 134 de margen** |
| `sdd-verify` | informe ~300 | sí |
| `sdd-archive` | **no se cifra aquí** — ver método abajo | — |

**Nota sobre este intento.** El registro de IV-12 se ha hecho **aquí**, no en `apply`, porque es
trabajo documental directo (obs. **#469**) y porque un desvío que espera a una fase posterior es un
desvío que se pierde. Su coste medido: **71 líneas** en `openspec/config.yaml` (el bloque IV-12) y
**12** en `CLAUDE.md` (encabezado de cuatro a cinco, el párrafo que narra el movimiento, y la fila de
la tabla). Sumadas a las **525** del `proposal.md`, este intento mide **608** y le quedan **192** de
margen.

**Desglose de `sdd-apply`** (rehecho tras obs. #702; la estimación vieja de ≈500 es anterior y no se
usa). **Obs. #707 no lo mueve**: el registro de IV-12 se paga en este intento, no en `apply`.

| Pieza | Líneas |
|---|---|
| `ticketService.ts` — mover `:43-49` (14) + comentario G5 `:50-64` (29) + comentario nuevo de G4 (8) + mover `:129-136` (16) + comentario `:129-131` (~11) | **78** |
| `ticketService.test.ts` — `:327` y su bloque `:321-326` (30) + `:336` (13) + `:205` (12) + bloque `:172-193` (40, incluye la reparación P4 de `:186-192`) + bloque `:302-314` (27) + dos pruebas de posición nuevas (26) | **148** |
| Guión del contrato de errores (P3), fichero nuevo | **60** |
| Barrido de citas de cierre (§8) | **80** |
| Informe `apply-progress` — **sumando obligatorio, no extra** | **300** |
| **Total** | **≈ 666** |

**El informe se cuenta porque olvidarlo ya costó un `reset` en este proyecto:** una remediación
presupuestó ~510 y gastó 946 contra un techo de 800, y la diferencia era el `verify-report.md` que la
propia fase escribe (358 líneas).

### Rebanadas — planificadas, con disparador medible

Con 666 sobre 800 el margen es **134**, y eso es estrecho para un informe estimado. La rebanada **no
se improvisa al aplicar**: el corte está decidido aquí, y se dispara con una medida, no con una
impresión.

> **Disparador:** antes de escribir el `apply-progress`, medir en worktree aislado
> `git diff --shortstat --no-renames` contra el commit de partida, más `wc -l` de lo nuevo sin
> trackear. **Si el código, las pruebas y el barrido pasan de 500, se parte.**

Una rebanada son **dos intentos del ledger y dos commits del mismo cambio**, no dos ciclos SDD:

- **Rebanada 1 · el orden.** Los dos movimientos (`:43-49` y `:129-136`), las tres pruebas que
  voltean, las dos pruebas de posición nuevas, los comentarios. Unidad completa: arranca de un árbol
  verde, termina en un árbol verde, se revierte sola con un `git revert`.
- **Rebanada 2 · el contrato de errores y el registro.** El guión de P3, la reparación de
  `ticketService.test.ts:186-192` y el barrido de citas de §8. Depende de la 1 sólo para las líneas
  finales del barrido.

### `sdd-archive` — el método, no la cifra

**No se fija un número aquí, y es deliberado: la regla del proyecto es que antes de pedir techo se
mide, y hoy no hay nada que medir** — los artefactos de `spec`, `design`, `tasks`, `apply` y `verify`
todavía no existen. Cuando se llegue al `archive`, se mide **por el método del precedente** (obs.
Engram **#681**), en worktree aislado:

1. `git diff --shortstat --no-renames` contra el commit de partida — nunca `--shortstat` a secas: el
   `git mv` de la carpeta cuesta **el doble** de las líneas movidas, una vez borradas y otra
   insertadas, aunque git las marque `R100` y no cambie un byte.
2. **La fusión del delta se MIDE haciéndola**, no se estima: estimarla por tamaño de bloque dio 436 en
   un precedente cuyo coste real fueron 176, porque git casa las líneas idénticas entre el requisito
   vivo y su versión del delta.
3. Sumar el `archive-report.md` que la propia fase escribe (precedentes reales: 110, 125, 148, 181,
   240 y 264).
4. **Con ese número medido delante**, pedir el techo a Gerencia — antes de lanzar la fase, no al
   bloquearse. Desbloquear exige `gentle-ai sdd-attempt reset`, que la herramienta reserva a un
   mantenedor: un descuido aquí para la tanda y necesita a una persona.

## 8 · Los dos barridos de la regla de mutación 4

### 8.1 · El de este intento — HECHO

Insertar IV-12 desplaza todo lo que va debajo en los dos ficheros. Barrido ejecutado con
`grep -rnoE "(CLAUDE\.md|config\.yaml):[0-9]+(-[0-9]+)?"` sobre el repositorio, y cada resultado
comprobado contra el fichero:

- **Una sola cita viva se desplazó, y era de este mismo documento:** `rules.proposal` pasó de
  la línea 1189 a la 1260 (+71). Corregida en la cabecera, en la misma edición. Después, la fusión con F0-05 la llevó a `openspec/config.yaml:1500`.
- **`CLAUDE.md:91` y `:104`** (→ `config.yaml:407`) y **`CLAUDE.md:474`** (→ `config.yaml:22-30`)
  apuntan a líneas **anteriores** a la inserción: comprobado, no se mueven. *(El encargo las citaba
  como la línea 405; hoy es `:474` — fue la línea 414 cuando el párrafo del recuento añadió nueve líneas por encima, y la fusión de main con F0-05 la desplazó sesenta más.)*
- **Las specs vivas** citan `config.yaml:72-77`, `:83-85`, `:87-89`, `:114-116`, `:117`, `:118-120`,
  `:122-125`, `:129-131`, `:133-135`, `:145-147`, `:29`, y `CLAUDE.md:171-205` en `648432d`, `:186-190`, `:249`:
  **todas por encima de las dos inserciones.** No se mueven.
- **`openspec/changes/archive/`**: decenas de citas a los dos ficheros. Son **Caso B/C y NO se
  renumeran**; se conservan con su revisión. Renumerarlas a hoy las volvería falsas sobre su propia
  fecha — incluidas las de las líneas 28 y 270 del `proposal.md` de `detector-citas-extremos`, que
  apuntan al rango 319-324 de `CLAUDE.md`, el rango exacto de la tabla que hoy gana una fila.
  *(Las dos se nombran aquí EN PROSA y sin forma de cita, a propósito: escritas como cita, el
  detector las trata como rotas —Q6 de `hook-citas-pre-push`— y el 2026-09-17 bloquearon un `push`
  por eso mismo. Es el ejemplo de esa regla, no una excepción a ella.)*
- **Segundo pase, forma abreviada** (`` `:349` ``, sin nombre de fichero): ese `grep` no la captura.
  Revisadas por lectura las líneas vivas que ya citan los dos módulos; ninguna hereda un ancla
  desplazada, porque el único ancla que se movió es el de este documento.

### 8.2 · El de `apply` — obligación de CIERRE, todavía pendiente

`apply` mueve líneas en `ticketService.ts`, que es un fichero muy citado. En el cierre:

1. `grep -rnoE "ticketService\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio, y **cada** resultado
   comprobado contra el fichero **leyendo qué afirma la frase**, no sólo que la línea exista.
2. **Segundo pase** para la forma abreviada en los ficheros que ya citan el módulo.
3. **Rangos: los dos extremos por separado.**
4. Cada cita se clasifica **A (presente) / B (histórico, se ancla a su revisión) / C (superado)**.
5. Alcanza al menos a `CLAUDE.md`, `openspec/config.yaml`, las dos specs y el fichero de pruebas, que
   citan `ticketService.ts:39`, `:43-49`, `:50-64`, `:54-58`, `:65-77`, `:65-83`, `:81-86`, `:82`,
   `:88`, `:92`, `:94`, `:22-60`, `:22-94`, `:82-110`, `:120-122`, `:123-125`, `:132-136` y
   `:140-144`. **Ojo a `ticketService.ts:134`**, que está **dentro** del bloque que baja y lo citan
   IV-11 en los dos sitios —`CLAUDE.md` y `openspec/config.yaml`—: es la cita que más fácil se pasa
   por alto, porque no habla de precedencia sino de la puerta 2.
6. El hook de `pre-push` **no sustituye esto**: `apps/desk/server/citas/detector.ts:109-119` sólo
   comprueba rango y línea vacía en los dos extremos. **No lee qué afirma la frase.** Las afirmaciones
   caducas que esta tanda repara no son citas rotas: son prosa, no entran en la línea base, y se
   quedan mintiendo sin que nada se ponga rojo.

## 9 · Áreas afectadas

| Área | Impacto | Qué cambia |
|---|---|---|
| `apps/desk/server/services/ticketService.ts` | Modificado | `:43-49` baja detrás de `:94`; `:129-136` baja detrás de `:144`; tres comentarios reescritos |
| `apps/desk/server/services/ticketService.test.ts` | Modificado | `:327`, `:336` y `:205` voltean; bloques `:172-193` y `:302-314` reescritos; 2 pruebas de posición nuevas |
| Guión del contrato de errores (P3) | Nuevo | 2 casos, uno por lado de la regla |
| `openspec/specs/transitions-st/spec.md` | Modificado | §3.8 (`:675-723`) reescrita vía delta |
| `openspec/specs/tickets-core/spec.md` | Modificado | §4.1 (`:353-395`) reescrita vía delta |
| `CLAUDE.md` | **Modificado, ya** | recuento de cuatro a cinco, párrafo del movimiento, fila de IV-12 |
| `openspec/config.yaml` | **Modificado, ya** | bloque `IV-12` en `incumplimientos_vivos` |
| `docs/sdd/` (4 ficheros) | Modificado | notas de Caso C — **trabajo documental directo**, fuera del ciclo |
| `apps/desk/server/routes/remision.ts` | **NO se toca** | su incumplimiento se registra como IV-12 |
| `docs/sdd/Desk2.0_Plan_..._R01.1.md` | **NO se toca** | veto de Gerencia; se cita anclado a `ad65161` |

**Reparto** (obs. **#469**, `decision/reparto-sdd`): el código y las pruebas van bajo ciclo SDD; el
registro de IV-12 y las cuatro notas de Caso C van como **documentación directa**; las dos specs van
por delta SDD porque son artefactos del ciclo, no documentación.

## 10 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| `sdd-spec` escribe algún `SHALL` por código HTTP y reintroduce la contradicción P1/P2 | **Alta** si no se lee §2 | La regla de redacción está en §2 como vinculante; la tabla de escalones es la forma normativa |
| `sdd-spec` recorta el orden total para que el alta de remisión encaje | **Alta** si no se lee §2 | §2 lo prohíbe expresamente: la regla es total y el incumplimiento se declara con sus dos líneas |
| `sdd-spec` clasifica `:94` o `:140-144` en A en vez de C, y aparece un incumplimiento inventado | Media | La frontera A/C está escrita en §2 con el porqué de cada una |
| Las tres comprobaciones que **nacen verdes** se dan por buenas sin mutar | Media | §4 lo declara obligación del `apply-progress`, con el `git diff` de reversión como evidencia |
| El barrido de `apply` se salta `ticketService.ts:134`, que cita IV-11 y no habla de precedencia | Media | Nombrada aparte en §8.2, punto 5 |
| `apply` se pasa de 800 por el informe | Media | §7 fija el disparador medible de 500 y el corte de las dos rebanadas |
| `archive` bloquea por presupuesto y exige `reset` de mantenedor | Media | §7 fija el método de medida y ordena pedirlo **antes** de lanzar la fase |
| Reparar de memoria los documentos fechados y volverlos falsos | Media | P4 fija Caso C: se conserva el texto y se añade qué lo cerró. Nunca se reescribe |
| Dos tandas SDD a la vez sobre el mismo árbol | Baja | Regla del ciclo 2: una tanda por árbol de trabajo |

## 11 · Plan de reversión

- **Código:** `git revert` del commit de la rebanada 1 devuelve los dos bloques a `:45-49` y `:132-136`
  y las expectativas de `:327`, `:336` y `:205` a `409`. No hay migración, ni escritura, ni estado
  persistido: la reversión es total y no deja rastro en la base de datos.
- **Specs:** los deltas viven en `openspec/changes/orden-precedencia-guardas/specs/` hasta el
  `archive`; antes de fusionar, borrar la carpeta revierte sin tocar `openspec/specs/`.
- **Registro de IV-12 y notas de Caso C:** son aditivos y conservan el texto original; quitarlos es
  borrar el bloque y la fila añadidos, más devolver el encabezado de `CLAUDE.md` a «Cuatro».

## 12 · Puntos abiertos — dueño **GERENCIA**, y NO son requisitos de esta tanda

Son **tres**. *(El de la versión anterior —«el `422` de derivación de `executeTransition` incumple el
orden único»— **queda RETIRADO: está decidido** por obs. #702 y entra en el alcance, §3.2.)*

### 12.1 · (A) no elimina el doble viaje: lo invierte de sentido

Un `409` de OV ya usada no se arregla rellenando campos, así que el usuario rellenará los obligatorios
y sólo entonces descubrirá que la orden está tomada. `transitions-st/spec.md:700-702` se queja justo
de «dos viajes para dos problemas que ya se conocían en el primero». El arreglo completo es **(A) +
agregar los dos errores en una sola respuesta**, y eso sube la talla.

### 12.2 · El literal duplicado sigue vivo

`'Ticket no encontrado'` en 6 sitios: 4 × `404` (`remision.ts:43`, `tickets.ts:95`, `:134`,
`ticketService.ts:119`) y 2 × `422` (`remision.ts:125`, `:293`). Con P3 el contrato de **códigos**
queda correcto y el usuario sigue sin poder distinguir las dos situaciones, porque el **texto** es el
mismo.

### 12.3 · **IV-12 · El alta de remisión no cumple el orden total, en dos puntos**

**Desvío vivo, registrado el 2026-09-17 y SIN DESTINO ASIGNADO.** Ya está escrito en `CLAUDE.md`
(encabezado, párrafo del movimiento y fila de la tabla) y en `openspec/config.yaml` (bloque `IV-12`).

**Los dos incumplimientos, medidos línea a línea:**

1. **C antes que A** — `apps/desk/server/routes/remision.ts:127` («Fecha inválida», validez de
   contenido) corre **ANTES** de `:155` («Falta el serial del equipo», existencia del sujeto).
2. **A después de C** — `apps/desk/server/routes/remision.ts:220` («Orden de venta no encontrada»)
   corre **DESPUÉS** de `:127` y de `:197` («Ítems fuera del checklist»), los dos escalón C.

**Los dos son OBSERVABLES:** una fecha mala sobre un ticket sin serial activa `:127` y `:155` a la vez,
y el usuario ve la de C — se le pide corregir la fecha cuando lo que va a bloquearle es el serial.
**Ninguno de los dos depende** de cómo se clasifique el `409` de remisión pendiente (`:177`), que obs.
#700 y #707 fijan en **D**. Y de mantenerlo en D se deduce **además** que ese `409` precede a `:197`
(C) y a `:220` (A): se anota para que quien lo arregle no crea que bastan dos movimientos.

**Por qué no se arregla aquí.** P1 mantiene el alta de remisión sin cambios y obs. #707 lo confirma al
desbloquear la tanda. Mover guardas ahí reabriría el precedente que F1B-01 fijó a propósito
(`remisiones.test.ts:957`) sin una decisión que lo pida, y tocar `remision.ts` activaría el barrido de
la regla de mutación 4 sobre un tercer fichero muy citado.

**Sin destino, y se dice a propósito:** asignar una épica de memoria es lo que dejó cuatro desvíos
huérfanos al cerrar F1A. Que lo asigne quien decida el alcance — y antes hay algo **no técnico** que
decidir, porque reordenar el alta cambia **qué error ve el técnico** en la pantalla de campo.

*(Ninguno de los tres se cuenta como tarea: son decisiones de personas, no trabajo que una tanda pueda
hacer en este repositorio. Regla del ciclo 1 — **archivar esta tanda no los da por hechos**.)*

## 13 · Criterios de aceptación

- [ ] `createManagedTicket` evalúa `G1 G2 G3 G5 G6 G7 G4` y `executeTransition` evalúa
      `:117 :119 :120-122 :123-125 :128 :140-144 :132-136`; en las dos, el `409` de unicidad es la
      **última guarda antes de la primera escritura** (`:97` y `:147` en `ad65161`).
- [ ] `ticketService.test.ts:327`, `:336` y `:205` esperan `422`; `:144`, `:149`, `:154`, `:160`,
      `:166`, `:194`, `:218`, `:316`, `:343` y `remisiones.test.ts:957` siguen verdes **sin tocarse**.
- [ ] Existen las pruebas de posición **G4 vs G5** y **G5 vs G6**, y cada una se pone roja al
      intercambiar las dos guardas que fija.
- [ ] La posición de la guarda equipo↔cliente está **en la spec**, no sólo en el comentario `:54-58`.
- [ ] **Ningún `SHALL` de las dos specs está redactado por código HTTP**, y el orden se declara
      **total**, sin recortes ni excepciones.
- [ ] El precedente de F1B-01 aparece en la spec como **consecuencia** de que A precede a D, no como
      excepción declarada.
- [ ] La spec **declara que el alta de remisión no cumple**, con las dos líneas y la referencia a
      IV-12; no recorta la regla para que encaje.
- [ ] §3.8 declara el orden total por escalones, con la tabla de las **siete** guardas reales y el
      recuento recalculado a **3 de 12**; el `SHALL` de §3.8(b) se conserva como sub-orden de B.
- [ ] `tickets-core` §4.1 reescrita, sin las citas caducas `:43-49`/`:81-86`.
- [ ] El `SHALL` del contrato de errores `404`/`422` existe y su guión se pone rojo al invertir
      cualquiera de los dos códigos. **Ningún código, texto o guarda de producción cambió por P3.**
- [ ] Las **seis** afirmaciones vivas reparadas y las **cuatro** notas de Caso C añadidas conservando
      el texto original.
- [ ] **IV-12 registrado** en `CLAUDE.md` y `openspec/config.yaml`, con el encabezado en **cinco** y
      el párrafo del recuento actualizado sin reescribir la narración de 2026-09-16.
- [ ] Barrido de citas de §8.2 hecho y registrado, con los tres casos A/B/C clasificados, incluida
      `ticketService.ts:134`.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde.
- [ ] Los tres puntos abiertos del §12 quedan registrados con dueño Gerencia y **sin destino
      inventado**.

## 14 · Dependencias

- Ninguna técnica.
- **Techo de `archive` medido y aprobado** antes de lanzar la fase (§7).
