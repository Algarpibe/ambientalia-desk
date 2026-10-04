---
tanda: F1B-03
motivo: ""
capacidad: [remisiones, transitions-st]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `remision-creada-sin-salida`

Medido en el worktree del cambio, sobre `main` en `2a74fdc`. La cabecera no se ajusta: las dos capacidades son las que
cambian (§7), ningún pasaje del maestro justifica el arreglo y ninguno queda desactualizado. **Hipótesis** sobre lo
segundo: sólo se buscó «Remisión creada» en la R08.4.md; lo más cercano es
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1289`, que no dice en qué estados se ofrece
«Crear remisión».

El encargo es `decision/orden-cuatro-tandas-04-10`. **No está en el `openspec/config.yaml` de este worktree** (0
coincidencias): sus condiciones se toman del encargo recibido, no de una línea leída aquí.

## 1 · Intención

Un ticket en `Remisión creada` sin remisión de entrada vigente no tiene salida desde la pantalla:

- `habilitar_servicio` sale de ese estado (`packages/shared/src/transitions.ts:178`) y la guarda responde `422`
  (`apps/desk/server/services/ticketService.ts:273-277`, llamada en `:131`) con un texto que manda crear la remisión
  (`packages/shared/src/remision.ts:131-135`).
- El botón que la crearía no aparece: `puedeCrearRemisionDeEntrada` sólo admite `OV asignada` y `Ticket creado`
  (`packages/shared/src/transitions.ts:163-165`), y es lo primero que mira `botonRemision`
  (`apps/desk/src/lib/botonRemision.ts:31`), único consumidor, usado en `apps/desk/src/components/TransitionPanel.tsx:54`.

Éxito: desde cada uno de los tres orígenes de `habilitar_servicio`, ese ticket tiene una acción que lo desbloquea, y una
prueba lo fija.

## 2 · De dónde sale ese ticket (la solución depende de esto)

**Por las rutas de la aplicación no se produce.** La única escritura de `Remisión creada` es
`sincronizarEstadoPorRemision`, que con cero confirmadas elige la retirada
(`apps/desk/server/db/estadoPorRemision.ts:49-50`); la anulación la invoca
(`apps/desk/server/routes/remision.ts:336`), así que anular la última confirmada devuelve el ticket a `Ticket creado`,
donde el botón ya existe. Un ticket de Zoho no entra en la fase (`estadoPorRemision.ts:41`; RQ-TS-02,
`openspec/specs/transitions-st/spec.md:79-81`).

Quedan tres orígenes, los tres **hipótesis** (no hay recuento de producción):

1. Escritura directa en la base: un `INSERT` no sincroniza (`apps/desk/server/testing/remisionDePrueba.ts:11`).
2. Petición caída entre la anulación (`remision.ts:333`) y su sincronización (`:336`), que no comparten transacción.
3. Remisión confirmada de tipo distinto de entrada: el recuento no filtra `tipo` (`estadoPorRemision.ts:43-47`) y la
   guarda sí (`packages/shared/src/remision.ts:126-128`). Declarado en RQ-RE-20
   (`openspec/specs/remisiones/spec.md:812-814`); hoy no existe otro tipo.

**Consecuencia para la solución:** el estado es anómalo y no se puede cerrar su origen sin tocar datos o el blueprint.
Lo que cabe es que el ticket que ya está ahí tenga salida. Y el origen 3 pide que la salida no dependa de que no haya
ninguna confirmada: `botonRemision` filtra por entrada vigente (`botonRemision.ts:33`), así que con una confirmada de
otro tipo sigue ofreciendo crear.

## 3 · Qué acepta hoy el servidor

**El alta de remisión no mira el estado del ticket.** `POST /api/remisiones`
(`apps/desk/server/routes/remision.ts:120-264`) tiene salidas de error en nueve líneas —`:123`, `:125`, `:127`, `:155`, `:158`,
`:177`, `:197`, `:220`, `:232`— y ninguna lee `found.row.status`; crea en `:246` y responde `201` en `:263`. Acepta, por
tanto, **cualquier estado**, incluidos los tres orígenes. La salida ya existe en el servidor; la tapa el predicado.

Este cambio **fija por prueba** que el alta responde `201` en los tres orígenes. Que también lo haga en el resto de
estados queda como comportamiento actual sin decidir (§6, hueco H-1), no como requisito.

## 4 · Alcance

### Dentro

- `puedeCrearRemisionDeEntrada` admite además `Remisión creada`, en su misma línea (`transitions.ts:164`); el comentario
  `:154-161` se reescribe en sitio.
- `botonRemision` devuelve «no visible» en `Remisión creada` mientras las remisiones no han cargado (`null`), en la
  misma línea `:31`, con el import de `:2` ampliado.
- Comentario de `TransitionPanel.tsx:18-20`, reescrito en sitio (sólo texto; `.tsx`, sin prueba).
- Pruebas: predicado, botón y servidor (§9).
- Delta de specs (§7).

### Fuera

- La guarda `exigirRemisionVigente`: «se mantiene sin excepciones» (`openspec/config.yaml:2417`). No se toca.
- Una guarda de estado en el alta (enfoque a'): sería un punto más de IV-12 y cambia alcance.
- `TRANSITIONS`, las dos constantes sin botón (`transitions.ts:150-151`), `estados.ts` y `estadoPorRemision.ts`.
- E-158 (`docs/sdd/ENTRADA.md:1782`) e IV-12.
- Reconciliar tickets en producción y ejecutar recuentos.
- La transacción anulación/sincronización (origen 2).

### Condición de parada — confirmada, no se activa

El enfoque no cambia ninguna transición ni estado del blueprint: `puedeCrearRemisionDeEntrada` no forma parte de
`TRANSITIONS` ni de las cifras ancladas, y no se añade ni se quita ningún `from`/`to`. La alternativa que sí lo haría
—un botón de vuelta `Remisión creada` → `Ticket creado`— choca con RQ-TS-03
(`openspec/specs/transitions-st/spec.md:90`, fila `:99`) y queda descartada.

## 5 · Enfoque

Enfoque (a) de la exploración, validado contra el código, con una protección:

| Situación en `Remisión creada` | Botón tras el cambio | Línea |
|---|---|---|
| Remisiones sin cargar (`null`) | no visible | `botonRemision.ts:31` (nueva condición) |
| Sin entrada vigente (lista vacía, sólo anuladas, o sólo de otro tipo) | «Crear remisión» | `:33`, `:42` |
| Entrada vigente pendiente | «Remisión pendiente de envío» | `:34-35` |
| Entrada vigente confirmada (ticket sano) | no visible | `:39-40` |
| Entrada vigente sólo en error | «Crear remisión» (la guarda ya pasa; inocuo) | `:42` |

**Por qué la protección:** `remisiones` llega `null` mientras carga y se queda `null` si la primera carga falla
(`apps/desk/src/hooks/useAsync.ts:12`, `:24-25`; `apps/desk/src/components/TicketDetailView.tsx:53`, `:339`). Sin ella,
todo ticket sano en `Remisión creada` enseñaría «Crear remisión» en ese intervalo.

**Discrepancia con la exploración: ninguna de fondo.** Un matiz: el comentario de `botonRemision.ts:37-38` da por hecho
que el ticket aún no llegó a `Remisión creada`; hay que reescribirlo en sitio. El bloque `:17-28` **no se toca**: la spec
viva cita `:22-25` y `:17-20` por contenido (`openspec/specs/remisiones/spec.md:185-187`).

## 6 · Regla invariable 13, decisión a decisión

| Decisión del cliente | Línea del servidor que la impone | Qué se hace |
|---|---|---|
| Ofrecer «Crear remisión» en los tres orígenes (`botonRemision.ts:31`) | El alta acepta: `remision.ts:120-264`, `201` en `:263` | Punto 1: predicado de `packages/shared`. Prueba de servidor nueva |
| **No** ofrecerlo en el resto de estados (`transitions.ts:163-165`) | **Ninguna** | **H-1, hueco previo:** el botón es la única guarda. No se corrige (alcance); pregunta E-184 |
| No ofrecerlo en `Remisión creada` sin cargar (nuevo) | **Ninguna, y no la necesita** | Presentación: no impide nada, el servidor crearía igual |
| No ofrecerlo con una confirmada (`botonRemision.ts:39-40`) | **Ninguna**, ya era así | Presentación; sin cambio |
| Reetiquetar con una pendiente (`:34-35`) | `remision.ts:174-183`, `409` en `:177` | Imposición existente; sin cambio |
| Desactivar «Habilitar Servicio» (`TransitionPanel.tsx:130`) | `ticketService.ts:131`, `:273-277` | Espejo probado; sin cambio |

## 7 · Capacidades

### Nuevas

Ninguna.

### Modificadas

- `transitions-st`: requisito **nuevo** RQ-TS-34 — desde cada origen de `habilitar_servicio`, un ticket sin remisión de
  entrada vigente tiene una acción que lo desbloquea; el predicado se ata a `transitionById('habilitar_servicio').from`.
  RQ-TS-33 (`openspec/specs/transitions-st/spec.md:1807` en `6186c98`) **no se modifica**: su escenario `:1883-1886` sigue siendo
  cierto. RQ-TS-02 (`:71`) y RQ-TS-03 (`:90`) tampoco.
- `remisiones`: requisito **nuevo** RQ-RE-28 — el alta responde `201` en los tres orígenes, y el botón en
  `Remisión creada` (tabla de §5). RQ-RE-06 (`openspec/specs/remisiones/spec.md:172`), RQ-RE-11 (`:304`) y RQ-RE-20
  (`:780`) no cambian.

Se añaden requisitos en vez de modificar RQ-TS-33 para no copiar su bloque entero al delta. Numeración libre comprobada:
0 usos de RQ-TS-34 y RQ-RE-28 en `openspec/`.

## 8 · Ficheros citados que se tocan (regla de mutación 4)

| Fichero | Cómo no se desplazan líneas |
|---|---|
| `packages/shared/src/transitions.ts` (282 citas en 62 ficheros, sin contar `archive/`) | Edición en sitio de `:154-161` y `:164`; sigue en 397 líneas |
| `apps/desk/src/lib/botonRemision.ts` (citado en `remisiones/spec.md:185`, `:791`, `:802`) | Edición en sitio de `:2`, `:31`, `:37-38`; sigue en 43 líneas; `:17-28` intacto |
| `apps/desk/src/components/TransitionPanel.tsx` | Edición en sitio de `:18-20` |
| `packages/shared/src/transitions.test.ts` | `:101-102` en sitio; lo nuevo, al final |
| `apps/desk/src/lib/botonRemision.test.ts` | `:15-20` en sitio; lo nuevo, al final |
| Prueba de servidor | Fichero **nuevo** en `apps/desk/server/`: no desplaza `remisiones.test.ts` ni `ticketService.test.ts` |

Cierre: `wc -l` de los tres primeros igual que al empezar, más barrido de citas completas y abreviadas a `:154-165` de
`transitions.ts` y a `botonRemision.ts`, leyendo qué afirma cada frase.

## 9 · Criterios de aceptación

1. `puedeCrearRemisionDeEntrada` es `true` para **cada** estado de `transitionById('habilitar_servicio').from`,
   recorrido desde el catálogo, y `false` para el resto del blueprint.
2. **Mutación del fichero vigilado (regla 2):** quitar de `transitions.ts:164` cualquiera de los tres estados pone roja
   la prueba del criterio 1; se ejecuta tres veces, una por estado, y se anota. Añadir un cuarto origen a
   `habilitar_servicio` sin tocar el predicado también la pone roja.
3. `botonRemision` en `Remisión creada`: las cinco filas de la tabla de §5, una aserción por fila.
4. Mutación: retirar la condición de «sin cargar» pone roja la fila de `null`; retirar `Remisión creada` del predicado
   pone rojas las filas visibles.
5. `botonRemision` en `OV asignada` y `Ticket creado` con `null` sigue visible (la protección es sólo de
   `Remisión creada`), fijado por prueba.
6. **Servidor, por cada uno de los tres orígenes:** ticket sin remisión vigente → `habilitar_servicio` da `422` con el
   texto único → `POST /api/remisiones` da `201` → `habilitar_servicio` deja de dar `422` y el ticket llega a
   `Ingresado`. Por HTTP (`apps/desk/server/routes/tickets.ts:192`), sin `INSERT` directo de la remisión.
7. Variante del origen 3: en `Remisión creada` con una confirmada de tipo distinto de entrada, el mismo recorrido.
8. Las pruebas de la guarda (`apps/desk/server/services/ticketService.test.ts:1280-1310`), `invariantesGrafo`,
   `cifrasAncladas` y `mapaBlueprint` pasan **sin editarse**.
9. `npm test`, `npm run typecheck` y `npm run lint` en verde; rojo previo escrito antes del código (`strict_tdd`).
10. Los tres ficheros de §8 conservan su número de líneas y el barrido de citas no deja ninguna rota.

Bajo `strict_tdd`, los criterios 5 y 6 nacen verdes (el cliente y el servidor ya se comportan así): son
**caracterización** que fija lo que hoy nada fija. El rojo previo de la tanda son los criterios 1 y 3.

## 10 · Supuestos (razonables y reversibles)

| # | Supuesto | Reversión |
|---|---|---|
| S-1 | Ofrecer «Crear remisión» en `Remisión creada` no contradice ninguna decisión: sólo lo afirmaban un comentario y dos pruebas anteriores a F1B-03 (`transitions.test.ts:101-102`, `botonRemision.test.ts:15-19`). **Hipótesis:** búsqueda no exhaustiva en `config.yaml` | Devolver `:164` a dos estados |
| S-2 | Con las remisiones sin cargar, en `Remisión creada` el botón se esconde. Coste: un ticket atascado cuya carga falla no ve el botón hasta recargar | Quitar la condición de `:31` |
| S-3 | No se añade guarda de estado al alta | Cambio aparte, si Gerencia lo pide |
| S-4 | La prueba de servidor fija sólo los tres orígenes, no «cualquier estado» | Ampliar o invertir cuando se decida H-1 |

## 11 · Preguntas para la bandeja (al cerrar; siguiente libre E-184, tras `docs/sdd/ENTRADA.md:1909`)

- **E-184 · pregunta · Gerencia.** ¿Debe el servidor impedir crear una remisión de entrada fuera de la fase inicial
  (H-1)? Hoy sólo lo impide el botón. Desbloquea: cerrar el hueco de la regla 13; cambia qué error ve el técnico.
- **E-185 · pendiente · persona con acceso a producción.** ¿Existe hoy algún ticket en `Remisión creada` sin entrada
  vigente? No cambia el arreglo, sólo su urgencia.
- **E-186 · hallazgo · supervisión.** Anulación y sincronización no comparten transacción (`remision.ts:333`, `:336`).
- **E-187 · hallazgo · supervisión.** Con la remisión de salida, el origen 3 deja de ser hipotético.

## 12 · Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Botón de más en tickets sanos durante la carga | Baja | Protección de `:31`, criterios 3 y 4 |
| Desplazar citas de `transitions.ts` | Media | Edición en sitio y criterio 10 |
| Segunda remisión en un ticket ya remisionado | Baja | `botonRemision.ts:39-40` lo esconde; el `409` de `remision.ts:177` cubre la pendiente |
| Tras crearla, un envío en error devuelve el ticket a `Ticket creado` | Baja | Correcto por RQ-TS-03; **hipótesis:** ninguna prueba recorre esa cadena |
| El comentario de `.tsx` queda sin red de pruebas | Segura | Sólo texto; comprobación de persona |

## 13 · Reversión

Revertir el commit: `transitions.ts:164` vuelve a dos estados, `botonRemision.ts:31` a su condición original y las
pruebas a su aserto anterior. Sin migración, sin datos, sin cambio de esquema. Las remisiones creadas mientras estuvo
activo son remisiones legítimas y no hay que deshacerlas.

## 14 · Estimación de líneas (válvula 720, techo 800)

Un solo lote de aplicación.

| Concepto | Líneas |
|---|---|
| Código (`transitions.ts`, `botonRemision.ts`, comentario de `TransitionPanel.tsx`), contando alta y baja | ~28 |
| Pruebas: ~106 brutas × 1,8 | ~191 |
| Casillas de `tasks.md` (~20) | ~20 |
| `apply-progress.md` | ~60 |
| **Lote de aplicación** | **~300** |
| Artefactos de planificación, si caen en un intento | ~400 |
| `verify-report.md` | ~220 |
| Archivo: fusión del delta (se mide) más `archive-report.md` | ~250 |

Ningún intento se acerca a 720. La medida real se toma al cerrar cada intento con
`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.

## 15 · Dependencias

Ninguna externa. `cierra: no`: este cambio arregla el caso sin salida de F1B-03 y no termina la fila.
