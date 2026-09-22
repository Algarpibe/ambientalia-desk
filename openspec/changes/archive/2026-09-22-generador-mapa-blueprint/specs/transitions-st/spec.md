# Delta for transitions-st

Contexto: `openspec/specs/transitions-st/spec.md`. `generador-mapa-blueprint` (F1A-06 · P-2) hace que
los dos pasos sin botón declaren `from`/`to` explícitos, para que el generador del mapa los recorra sin
una tercera copia hardcodeada. **Toda cita `ruta:línea` de este delta se lee contra `125ae3e`** (regla
de mutación 4, `CLAUDE.md`); `transitions.ts:150-151` se edita **en sitio** —sin insertar ni borrar
líneas (propuesta §5.6)—, así que las citas de este párrafo no se desfasan por esta tanda, pero el
barrido de cierre (propuesta §8) se hace igual sobre los ~180 usos de `transitions.ts` en el árbol de
cierre.

**MODIFICA:** `RQ-TS-03` — las dos constantes ganan `from`/`to`; muere la frase «Lo que no está en el
archivo de transiciones es el `from`/`to`, porque no son grafo»; `estadoPorRemision.ts:41` (la guarda
de fase) y `:49` (la elección de destino) pasan a derivarse de la declaración en vez de literales
propios.

**Nota de alcance, declarada — no un olvido.** El §4 de la propuesta menciona también un cambio en
`RQ-TS-01` («el invariante 5b cambia de "siguen sin `from`/`to`" a "los declaran"»). Verificado contra
la spec viva: la tabla de los siete invariantes de `RQ-TS-01` (`:56-66`) no cita ni describe la prueba
`5b`; esa prueba (`invariantesGrafo.test.ts:120-127`) ya estaba citada, por línea, dentro de
`RQ-TS-03` antes de esta tanda. La inversión de `5b` queda capturada ahí, donde ya vivía la cita —
`RQ-TS-01` no afirma nada sobre esas líneas que esta tanda vuelva falso, así que no lleva bloque
`MODIFIED` propio.

## MODIFIED Requirements

### Requirement: RQ-TS-03 · Dos pasos sin botón, aplicados por el servidor

Dos pasos del mapa **SHALL** aplicarse sin que nadie pulse nada, y **MUST NOT** figurar en
`TRANSITIONS` (`transitions.ts:146-151`; prueba de la exclusión, invertida por esta tanda, en
`invariantesGrafo.test.ts:120-127`):

| Constante | De | A | Disparador |
|---|---|---|---|
| `TRANSICION_REMISION_CONFIRMADA` | `Ticket creado` | `Remisión creada` | Existe al menos una remisión confirmada y vigente |
| `TRANSICION_REMISION_RETIRADA` | `Remisión creada` | `Ticket creado` | Se anula la última confirmada |

- El destino **SHALL** derivarse del recuento de remisiones confirmadas y vigentes, no de quién llama
  (`estadoPorRemision.ts:36-60`). Sólo cuentan las de estado `ok` u `ok_con_avisos` y sin
  `anulada_at` (`:43-47`).
- Es el **único paso reversible automático** del mapa (maestro M1.3.3, `:1161`).
- Un ticket que ya pasó de la fase temprana **MUST NOT** retroceder al anular una remisión
  (`estadoPorRemision.ts:41`).

**Las dos constantes SHALL declarar `from`/`to` explícitos** (`transitions.ts:150-151`), con el par
exacto de la tabla de arriba. Declararlos **MUST NOT** convertirlas en botón: **SHALL** seguir sin
`fields`, **SHALL** seguir siendo de área `Servicio Técnico` a secas y **SHALL** seguir fuera de
`TRANSITIONS`. `estadoPorRemision.ts:41` (la guarda de fase) y `:49` (la elección de destino) **SHALL**
derivarse de `TRANSICION_REMISION_CONFIRMADA.from`/`.to` y `TRANSICION_REMISION_RETIRADA.from`/`.to`, y
**MUST NOT** volver a codificar `STATUS_TICKET_CREADO`/`STATUS_REMISION_CREADA` como literales sueltos
en ese fichero: la declaración pasa a ser la única fuente, y `estadoPorRemision.ts` deja de ser una
tercera copia del mismo par.

(Previously: «Lo que no está en el archivo de transiciones es el `from`/`to`, porque no son grafo» —
las dos constantes sólo declaraban `id`, `name` y `area`, y `estadoPorRemision.ts` reconstruía el par
`Ticket creado`/`Remisión creada` con literales propios, duplicando la declaración de
`transitions.ts:142-144`.)

**Discrepancia de ubicación con el maestro, ahora también de contenido.** M1.3.3 (`R08.2.md:1198`)
dice que los dos pasos viven en `estadoPorRemision.ts`, «no en el archivo de transiciones», y que «lo
que no tienen es `from` ni `to`». Lo primero sigue siendo exacto para la *aplicación* del paso y sigue
siendo falso para su *declaración*; lo segundo, que antes era cierto, pasa a ser **falso** con esta
tanda. La corrección va como entrada 17 de `F0-01_Correcciones_para_el_maestro.md` (propuesta §8).

#### Scenario: las dos constantes declaran su `from`/`to` exacto
- GIVEN `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA`
- WHEN se inspeccionan sus propiedades
- THEN cada una tiene `from` y `to`, con el par de la tabla de arriba, y ninguna aparece en
  `TRANSITIONS`

#### Scenario: `estadoPorRemision.ts` deja de duplicar los nombres de estado como literales
- GIVEN la guarda de fase (`estadoPorRemision.ts:41`) y la elección de destino (`:49`)
- WHEN se comparan con las dos constantes de `transitions.ts`
- THEN las dos leen `.from`/`.to` de las constantes; ningún literal `'Ticket creado'` ni
  `'Remisión creada'` queda escrito aparte en `estadoPorRemision.ts`

#### Scenario: sin regresión de comportamiento — `estadoPorRemision.test.ts` sigue verde sin tocar sus aserciones
- GIVEN la suite `estadoPorRemision.test.ts` tal como existe hoy
- WHEN se ejecuta tras esta tanda
- THEN pasa entera, sin que ninguna de sus aserciones necesite cambiar — es refactor de fuente, no
  cambio de comportamiento (criterio 6 de la propuesta, §7)
