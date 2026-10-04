# Diseño — `remision-creada-sin-salida` (F1B-03, `cierra: no`)

Medido en el worktree del cambio, sobre `main` en `2a74fdc`. Toda ruta y línea de este documento se leyó aquí; lo que
no, lleva la palabra «hipótesis».

## 1 · Enfoque técnico

Enfoque (a) de la propuesta: el predicado compartido admite el tercer origen y `botonRemision` gana una protección de
carga. Tres ficheros de código editados **en sitio** (ninguno cambia de número de líneas), dos ficheros de prueba
editados en sitio con lo nuevo **al final**, y un fichero de prueba de servidor **nuevo**. No hay esquema, ni SQL, ni
ruta nueva, ni transición nueva.

## 2 · Decisiones

| # | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| D1 | El predicado sigue siendo **lista literal** de lo permitido (`transitions.ts:164`) y es la **prueba** la que lo ata a `transitionById('habilitar_servicio').from` | Derivarlo en código de `TRANSICIONES_BASE` | El comentario `:160-161` declara la lista blanca como deliberada; derivado, un origen nuevo ganaría el botón sin que nadie lo decidiera, y la mutación del fichero vigilado dejaría de existir (no habría nada que ensuciar) |
| D2 | La prueba recorre el universo `ESTADOS` (`packages/shared/src/estados.ts:112`) y exige `true` exactamente en el `from` | Reutilizar `posteriores` de `transitions.test.ts:104-105` | `posteriores` sale de los `to` de `TRANSITIONS` y `Remisión creada` no es `to` de ninguna (no está en `TRANSITIONS`, `transitions.ts:135-137`): no la vería |
| D3 | La protección va en la **misma línea** `botonRemision.ts:31`, como segundo operando del `\|\|` | Un `if` propio | Un `if` añade una línea y desplaza `:33`, `:34-35`, `:39`, que la spec viva cita (`openspec/specs/remisiones/spec.md:185`, `:791`, `:802`) |
| D4 | La condición es `status === STATUS_REMISION_CREADA && remisiones === null` | `!remisiones?.length`; o proteger los tres estados | La lista vacía es justo el caso atascado y debe ofrecer el botón; en los otros dos estados `null` ya enseña el botón hoy y el criterio 5 lo conserva |
| D5 | El import de la prueba nueva de `transitions.test.ts` se añade en la línea 5 existente (`…from './transitions'; import { ESTADOS } from './estados'`) | Línea de import nueva | Es el patrón del repositorio (`apps/desk/server/services/ticketService.test.ts:6`) y no desplaza `:25-27`, `:73`, `:79-93`, citadas en `docs/sdd/F0-00_Baseline_as-built.md:167`, `:513` y en el archivo de `derivacion-repuestos-director-tecnico` |
| D6 | Prueba de servidor por **HTTP con el arnés** (`instalarArnes`, `appWith`, `userCookie(['Comercial'])`, `apps/desk/server/testing/appHarness.ts:34`, `:46`, `:91`), en `apps/desk/server/remisionCreadaSinSalida.test.ts` | Unidad sobre `executeTransition`, dentro de `ticketService.test.ts` | El criterio 6 pide el recorrido por las rutas (`routes/tickets.ts:192`, `routes/remision.ts:120`); y `ticketService.test.ts` es fichero citado |
| D7 | El ticket se siembra con `INSERT` directo en cada origen; la remisión que se crea va **sólo** por `POST /api/remisiones` | Llegar a `Remisión creada` por las rutas | Por las rutas ese estado sin vigente no se produce (`estadoPorRemision.ts:49-50`): el fixture sucio **es** el caso |

## 3 · Cambios, fichero a fichero

| Fichero | Líneas | Cambio | ¿Cambia el total? |
|---|---|---|---|
| `packages/shared/src/transitions.ts` | `:154-161` | Comentario reescrito en sus 8 líneas: el botón cabe en los tres orígenes de `habilitar_servicio`; en `Remisión creada` sirve al ticket sin entrada vigente; sigue siendo lista de lo permitido | No (397) |
| | `:164` | `return status === STATUS_OV_ASIGNADA \|\| status === STATUS_TICKET_CREADO \|\| status === STATUS_REMISION_CREADA` | |
| `apps/desk/src/lib/botonRemision.ts` | `:2` | El import gana `STATUS_REMISION_CREADA` | No (43) |
| | `:31` | `if (!puedeCrearRemisionDeEntrada(status) \|\| (status === STATUS_REMISION_CREADA && remisiones === null)) return {…}` | |
| | `:37-38` | Comentario en sus 2 líneas: la confirmada esconde el botón tanto si el ticket está a punto de pasar a `Remisión creada` como si ya está en ella y sano | |
| `apps/desk/src/components/TransitionPanel.tsx` | `:18-20` | Comentario en sus 3 líneas (sólo texto; `.tsx`, sin prueba) | No |
| `packages/shared/src/transitions.test.ts` | `:5`, `:95-98`, `:101-102` | Import (D5); título y comentario; `:102` pasa a `toBe(true)` | Sí, **+~22 tras `:127`** |
| `apps/desk/src/lib/botonRemision.test.ts` | `:15-20` | `:19` deja de afirmar `Remisión creada` y afirma otro estado posterior | Sí, **+~32 tras `:68`** |
| `apps/desk/server/remisionCreadaSinSalida.test.ts` | nuevo | ~58 líneas | — |

**Comprobado sobre la propuesta.** `botonRemision.ts:17-28` no se toca: `openspec/specs/remisiones/spec.md:185` cita
`:34-35` y `:22-25` por contenido. Que cite además `:17-20` es **hipótesis** (no leído). El comentario `:37-38` sí da
por hecho que el ticket aún no llegó a `Remisión creada`, como dice la propuesta.

**Citas por debajo de lo que crece.** Ninguna: lo nuevo va tras la última línea de cada fichero de prueba, y las citas
`transitions.test.ts:N` y `botonRemision.test.ts:N` del repositorio (incluido `openspec/changes/archive/`) apuntan a
`:7`, `:25-27`, `:73`, `:79-93`.

**Cita que pasa a caso C al cerrar.** `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:141` cita
`transitions.ts:163-165` y `botonRemision.ts:31` para afirmar el caso sin salida: la línea seguirá existiendo y la frase
dejará de ser cierta. Se conserva con su revisión y se anota qué lo cerró. Las del archivo de `blueprint-soporte-remoto`
(`design.md:102`, `:216`, `tasks.md:304`) afirman el `false` fuera de la fase inicial: siguen ciertas.

## 4 · Plan de pruebas (`strict_tdd`)

| # | Dónde | Qué | Nace | Por qué |
|---|---|---|---|---|
| P1 | `transitions.test.ts`, `describe` nuevo al final | Para cada estado de `transitionById('habilitar_servicio')!.from`: `true`, con el estado en el mensaje. Para cada estado de `ESTADOS` fuera del `from`: `false` | **ROJA** | `transitions.ts:164` no admite `Remisión creada` |
| P2 | `transitions.test.ts:102` | `toBe(true)` | **ROJA** | Ídem |
| P3 | `botonRemision.test.ts`, `describe` nuevo | En `Remisión creada`: lista vacía, sólo anulada, sólo confirmada de `tipo: 'salida'`, pendiente (texto y `pendienteId`), sólo `error` | **ROJAS** las cinco | `botonRemision.ts:31` corta antes, por `transitions.ts:164` |
| P4 | ídem | En `Remisión creada`: confirmada `ok` y `ok_con_avisos` → no visible | Caracterización | Hoy `:31` ya devuelve no visible |
| P5 | ídem | `botonRemision(STATUS_REMISION_CREADA, null)` → no visible | Caracterización **con rojo intermedio** | Verde hoy por `:31`; al cambiar `:164` (paso 2) se pone roja, y la protección (paso 3) la devuelve a verde. El apply registra ese rojo |
| P6 | ídem | `null` en `OV asignada` y `Ticket creado` → visible | Caracterización | `:33` trata `null` como lista vacía |
| P7 | `remisionCreadaSinSalida.test.ts` | `it.each` de los tres orígenes: `422` con el texto único → `POST /api/remisiones` `201` → el ticket sigue en su origen → `habilitar_servicio` `200` → `Ingresado` | Caracterización | El alta no lee `found.row.status` (`remision.ts:120-264`) |
| P8 | ídem | Origen 3: `Remisión creada` con `remisionDePrueba(db, id, { tipo: 'salida' })` (`testing/remisionDePrueba.ts:20-32`), mismo recorrido | Caracterización | La guarda filtra `tipo` (`ticketService.ts:273-277`) |

Orden del apply: (1) P1-P8 escritas, rojo observado en P1-P3; (2) `transitions.ts:164`, y P5 pasa a roja; (3)
`botonRemision.ts:31`; (4) comentarios.

**Arnés de P7/P8.** Ticket: `INSERT INTO tickets (id, number, status, managed_by_app, serial)` con serial no vacío (el
alta lo exige, `remision.ts:153-155`; sin `equipo_id` lo toma de la fila). Alta: `{ ticketId, fecha, incluye: [] }` sin
`novedades`, que `resolverRecepcion` deja pasar (`services/recepcion.ts:16`). Transición:
`{ transitionId: 'habilitar_servicio', values: { 'Orden de Venta': 'OV-SS-n', Serial } }`, como
`transiciones.test.ts:212-214`. P7 **no** contiene ningún estado fuera de los tres orígenes (S-4, H-1).

## 5 · Mutaciones que reproduce el orquestador

| # | Receta | Debe ponerse rojo |
|---|---|---|
| M1a | `transitions.ts:164`: quitar `\|\| status === STATUS_REMISION_CREADA` | P1 (mensaje con «Remisión creada»), P2 y las cinco de P3. P7/P8 siguen verdes: no usan el predicado |
| M1b | `:164`: quitar `status === STATUS_OV_ASIGNADA \|\|` | P1 («OV asignada»), `transitions.test.ts:99`, `botonRemision.test.ts:12`, P6 |
| M1c | `:164`: quitar `status === STATUS_TICKET_CREADO \|\|` | P1 («Ticket creado»), `transitions.test.ts:100`, P6 y el resto de `botonRemision.test.ts` |
| M2 | `transitions.ts:178`: añadir `'Origen ficticio'` al `from` | P1, con «Origen ficticio» en el mensaje. **Hipótesis:** caen además `cifrasAncladas` o `invariantesGrafo` (no leídos); la que discrimina es P1 |
| M3a | `botonRemision.ts:31`: quitar el segundo operando | P5 |
| M3b | `:31`: dejar `remisiones === null` sin la condición de estado | P6 |
| M3c | `:31`: `remisiones === null` → `!remisiones?.length` | P3, fila de lista vacía |
| M3-pos | Sacar la protección a un `if` propio tras `:40`, o invertir los operandos del `\|\|` | **Nada: mutante equivalente, declarado** |

**Por qué M3-pos no tiene prueba de posición (regla de mutación 1).** No existe un par de guardas que ordenar. `null`
implica `vigentes = []` (`:33`), así que con `null` ni la rama de pendiente (`:34-35`) ni la de confirmada (`:39-40`)
pueden dispararse: ninguna entrada activa la protección y una vecina a la vez. Y con el predicado en `false`, las dos
mitades del `||` devuelven el mismo objeto. El orden no es observable; lo que sí lo es —la condición— lo cubren M3a-c.

## 6 · Regla invariable 13

| Decisión del cliente | Línea del servidor |
|---|---|
| Ofrecer «Crear remisión» en los tres orígenes | `remision.ts:120-264` acepta, `201` en `:263`; fijado por P7/P8 |
| No ofrecerlo en los demás estados | **Ninguna** (H-1, previo, no se corrige; E-184) |
| No ofrecerlo en `Remisión creada` con `null` | **Ninguna, y no la necesita**: presentación |
| No ofrecerlo con una confirmada (`botonRemision.ts:39-40`) | **Ninguna**, ya era así |
| Reetiquetar con una pendiente (`:34-35`) | `remision.ts:174-183`, `409` en `:177` |

## 7 · Qué no se toca

- `exigirRemisionVigente` (`ticketService.ts:273-277`, llamada en `:131`): «sin excepciones» según la propuesta §4.
- `POST /api/remisiones`: una guarda de estado sería un punto más de IV-12 y cambia alcance.
- `TRANSITIONS`, `TRANSICION_REMISION_CONFIRMADA`/`RETIRADA` (`transitions.ts:150-151`), `estados.ts`,
  `estadoPorRemision.ts`: el cambio no añade ni quita `from`/`to`, así que cifras ancladas y mapa del blueprint quedan
  intactos (criterio 8: pasan sin editarse).

## 8 · Tamaño (válvula 720)

| Concepto | Líneas |
|---|---|
| Código, alta más baja: `transitions.ts` 18, `botonRemision.ts` 8, `TransitionPanel.tsx` 6 | 32 |
| Pruebas brutas: 8 + 22 + 6 + 32 + 58 = 126; × 1,8 | ~227 |
| `tasks.md` (casillas) y `apply-progress.md` | ~80 |
| **Lote de aplicación** | **~340** |

Un solo lote. La medida real se toma al cerrar con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo.

## 9 · Matriz de amenazas, migración

N/A: sin rutas nuevas, subprocesos ni integración de procesos. Sin migración ni datos.

## 10 · Dudas abiertas

Ninguna bloquea. Una **hipótesis** que resuelve la primera ejecución de P7: que `habilitar_servicio` por HTTP no pida
nada más que orden de venta y serial sobre un ticket sembrado con cinco columnas (así lo hace
`transiciones.test.ts:16`, `:212-214`, con remisión insertada a mano).
