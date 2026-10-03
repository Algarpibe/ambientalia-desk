# Diseño: guarda de remisión vigente en «Habilitar Servicio» y OVI de garantía (F1B-03, parte L)

Medido el 2026-10-03 en el worktree `tipo-servicio-ticket-sin-ov`, partida `5f68822`. Toda línea citada se leyó en ese
árbol. Lo que no lleva ruta y línea lleva «hipótesis». Entradas: `proposal.md`, `exploration.md` y los dos deltas ya
escritos (`specs/transitions-st/spec.md`, `specs/remisiones/spec.md`) de esta misma carpeta.

**Tres correcciones a la propuesta, medidas al diseñar:**

1. **Hay una CUARTA implementación de «vigente», y está en el cliente.** `apps/desk/src/lib/botonRemision.ts:33` filtra
   `!r.anuladaAt && r.tipo === 'entrada'` y `apps/desk/src/lib/botonRemision.ts:39` exige `ok` u `ok_con_avisos`: es,
   letra por letra, la definición S-1. La propuesta (§4.1) contaba tres. El lote 2 la hace consumir el predicado (D6).
2. **Las pruebas afectadas no son «unas 30 en 6 ficheros»: son 31 puntos de edición en 8 ficheros** (§5). La búsqueda
   literal no caza `apps/desk/server/cargoPermiso.test.ts:260` ni los dos barridos de `apps/desk/server/permisos.test.ts`.
3. **Prioridad deja de ser hipótesis: no hay escenario.** `cambiaPrioridadSinPermiso` sale en `false` si la transición
   no declara un campo de prioridad (`packages/shared/src/prioridad.ts:82`), y `habilitar_servicio` no lo declara
   (`packages/shared/src/transitions.ts:189`).

## 1. Enfoque

Un predicado puro en `packages/shared` que lleva **las tres condiciones** de «vigente»; una lectura en el servidor que
**no lleva ninguna** (sólo la clave del ticket); una guarda de escalón B al final de `ticketService.ts`, llamada en la
línea 131 ya existente; y el cliente consumiendo el mismo predicado. En ficheros citados, sólo **ediciones en la misma
línea** o **añadidos al final** (regla de mutación 4), y eso incluye los ficheros de prueba.

No se toca `packages/shared/src/transitions.ts` ni el `from` (S-4, Q3), ni `apps/desk/server/db/estadoPorRemision.ts`,
ni `apps/desk/server/routes/remision.ts` en los lotes 1 y 2. Sin migración.

## 2. Decisiones

| # | Decisión | Elegida | Descartadas y por qué |
|---|---|---|---|
| D1 | Dónde vive el predicado | Al **final** de `packages/shared/src/remision.ts` (tras `faltaFotoPorNovedad`, `packages/shared/src/remision.ts:110-112`), ya exportado por el índice del paquete. Tipo estructural propio, **sin `import`**, para no desplazar ninguna línea | Fichero nuevo `remisionVigente.ts`: obliga a tocar el índice y parte en dos el dominio de remisión. Junto a `motivoAltaPendiente` en `altaManual.ts`: no es alta manual. Importar `Remision` de `types.ts`: añade una línea arriba y desplaza el fichero |
| D2 | Qué lee el servidor | `vigenciaDeRemisiones(db, ticketId)`, al final de `apps/desk/server/db/remisiones.ts` (tras la línea 230): `SELECT tipo, estado, anulada_at FROM remisiones WHERE ticket_id = $1`. **La consulta no filtra nada**: las tres condiciones las aplica el predicado, que así es la única fuente y se puede mutar por datos (regla 2) | `SELECT … WHERE tipo='entrada' AND anulada_at IS NULL AND estado IN (…)`: sería la quinta implementación, en SQL. Reutilizar `listRemisionesByTicket` (`apps/desk/server/db/remisiones.ts:76-79`): ya filtra anuladas, así que quitar esa condición del predicado no pondría roja la guarda; trae `SELECT *`; y ata la guarda al listado del panel. Además su texto es el que lee `valoresConFechasDerivadas` (`apps/desk/server/services/valoresDeTransicion.ts:26`), y el espía de «sin consultas extra» no podría distinguirlas |
| D3 | Guarda | `exigirRemisionVigente(db, t, id)`, al final de `ticketService.ts` (tras la línea 264), llamada en la línea 131 inmediatamente detrás de `await exigirAltaValidada(db, t, current.row)` y delante del comentario de cierre. `422`, `{ error }`, escalón B. Sale sin consultar si `t.id !== 'habilitar_servicio'` (mismo gesto que `apps/desk/server/services/ticketService.ts:259`) | `409`: S-2. Dentro de `exigirAltaValidada`: mezcla dos requisitos y no deja probar su orden. En línea propia: desplaza 134 líneas citadas |
| D4 | Mensaje | Dos textos, los dos con «remisión de entrada vigente» (§4). El segundo avisa de que hay una remisión de entrada **sin confirmar** (`pendiente` o `error`, no anulada): es lo que hace accionable el coste de S-1. Ninguno contiene «cliente», «equipo» ni «provisional», para que P2 discrimine | Un solo texto: quien tiene una `pendiente` leería «crea la remisión» y crearía un duplicado (`409` de `apps/desk/server/routes/remision.ts:177`) |
| D5 | Molde H5 frente al recuento | **Prueba que las enfrenta**, no una sola fuente. `estadoPorRemision.ts` no se reescribe: su recuento (`apps/desk/server/db/estadoPorRemision.ts:43-47`) es SQL, no filtra `tipo`, y añadirlo cambia cuándo se mueve el estado (RQ-RE-11). La prueba (§8, lote 1) ejecuta las dos sobre la misma tabla de filas y **afirma** la divergencia de `tipo`: el día que alguien filtre `tipo` en el recuento, se pone roja y hay que moverla a propósito | Que el recuento llame al predicado: reescribe un fichero citado y cambia comportamiento fuera de alcance. Dejar las dos sin enfrentar: es H5 otra vez |
| D6 | Cliente | Lógica en `apps/desk/src/lib/habilitarServicio.ts` (nuevo, con prueba `.ts`): `motivoNoHabilitar(motivoAlta, remisiones)`. `TransitionPanel.tsx` sólo cambia en sus líneas 8, 70, 130 y 137. `botonRemision.ts` pasa a consumir el predicado en su línea 39, sin cambio de comportamiento (lo fija su prueba existente) | Lógica en el `.tsx`: fuera de la red de pruebas (F0-00). Dejar `botonRemision.ts` como está: cuarta copia viva |
| D7 | Orden de motivos en el cliente | El de la línea 131 del servidor: primero el de alta pendiente, luego el de remisión. Con `remisiones` nulo (cargando o error de carga, `apps/desk/src/components/TicketDetailView.tsx:53`) devuelve `null`: botón activo, decide el servidor | Mostrar los dos motivos: el servidor sólo contesta uno |
| D8 | Pruebas existentes | Ayudante compartido `conRemisionVigente` (§5). En los ficheros de prueba, la remisión se añade **en la misma línea** que crea el ticket, y el `import` en una línea de `import` existente: esos ficheros están citados (por búsqueda, 79 citas con línea a esas suites, a `db/remisiones.ts`, a `botonRemision.ts` y al `remision.ts` de `shared`, en 17 ficheros entre specs, `CLAUDE.md`, `openspec/config.yaml` y el propio código) | Cambiar el ayudante `ticket()` de cada suite para que cree la remisión siempre: esconde el requisito y deja sin poder escribir las pruebas «sin remisión». Dar remisión a TODOS los tickets de los barridos: `ingreso_a_servicio` lee la remisión para su fecha derivada y cambiaría lo que prueban |
| D9 | Interruptor de despliegue | **Ninguno.** Fusionar a `main` no publica (el despliegue es manual); el recuento es condición de despliegue (§12) | Variable de entorno que apague la guarda: un flag es superficie de configuración que documentar, y una guarda «sin excepciones» con interruptor tiene una |
| D10 | RQ-TS-06 | No se amplía (S-8). La posición se fija por pruebas y por RQ-TS-33 | — |

## 3. Flujo

```
TransitionPanel ─ motivoNoHabilitar(motivoAlta, remisiones) ─▶ motivoSinRemisionVigente (shared)   [comodidad]
POST /api/tickets/:id/transition ─▶ executeTransition
   A 400·404 → B flujo → B estado → B área → cargo·prioridad·verificación → exigirAltaValidada
   → exigirRemisionVigente ─▶ vigenciaDeRemisiones (db) ─▶ motivoSinRemisionVigente (shared) ─▶ 422 { error }
   → C obligatorios·fechas·cuarentena·certificado → C persona → C vencido → D OV ya asociada → applyTransition
```

## 4. Interfaces

```ts
// packages/shared/src/remision.ts — al final
export interface RemisionParaVigencia { tipo: string; estado: string; anuladaAt: string | null }
export function esRemisionEntradaVigente(r: RemisionParaVigencia): boolean
//   r.tipo === 'entrada' && !r.anuladaAt && (r.estado === 'ok' || r.estado === 'ok_con_avisos')
export function motivoSinRemisionVigente(remisiones: readonly RemisionParaVigencia[]): string | null

// apps/desk/server/db/remisiones.ts — al final
export async function vigenciaDeRemisiones(db: Queryable, ticketId: string): Promise<RemisionParaVigencia[]>

// apps/desk/server/services/ticketService.ts — al final
async function exigirRemisionVigente(db: Queryable, t: Transition, ticketId: string): Promise<void>

// apps/desk/src/lib/habilitarServicio.ts — nuevo
export function motivoNoHabilitar(motivoAlta: string | null, remisiones: readonly RemisionParaVigencia[] | null | undefined): string | null
```

`estado: string` y no la unión: la columna no tiene `CHECK` y llega con un cast sin validar (comentario de
`packages/shared/src/remision.ts:70-73`); un estado desconocido no cuenta como vigente. `Remision` es asignable a
`RemisionParaVigencia`, así que el cliente pasa su prop sin convertir.

**Texto exacto del `422`:**

- Sin remisión de entrada utilizable:
  `No se puede habilitar el servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.`
- Con alguna de entrada, no anulada y sin confirmar:
  `No se puede habilitar el servicio: falta una remisión de entrada vigente. El ticket tiene una remisión de entrada sin confirmar: reenvíala desde el ticket o espera a que se confirme.`

Ediciones en sitio del lote 1: importación del predicado en `apps/desk/server/services/ticketService.ts:6`, de la
lectura en `apps/desk/server/services/ticketService.ts:5`, del tipo en `apps/desk/server/db/remisiones.ts:3`, y la
llamada en `apps/desk/server/services/ticketService.ts:131`. Cuatro líneas editadas, ninguna insertada antes del final.

## 5. Ayudante de pruebas y lista medida de pruebas afectadas

**Ayudante:** `apps/desk/server/testing/remisionDePrueba.ts` (nuevo, junto a `arbolDePrueba.ts` y `reposDePrueba.ts`).
Recibe `db` porque `ticketService.test.ts` levanta la suya y no usa el arnés.

```ts
export async function remisionDePrueba(db: Queryable, ticketId: string,
  over?: { id?: string; tipo?: string; estado?: string; anulada?: boolean; origen?: string }): Promise<string>
export const conRemisionVigente = (db: Queryable, ticketId: string) => remisionDePrueba(db, ticketId)
```

Por defecto inserta `tipo 'entrada'`, `estado 'ok'`, sin anular (columnas de `packages/zoho-sync/src/db/schema.sql:271-287`).
`remisionDePrueba` con `over` es además la herramienta para ensuciar filas en las pruebas nuevas.

**Lista medida.** De las 70 menciones literales en 17 ficheros, y de las suites que recorren el catálogo sin nombrar la
transición, llegan a la guarda nueva y se pondrían rojas:

| Fichero | Puntos de edición (línea que crea el ticket) | Llamadas que llegan a la guarda |
|---|---|---|
| `apps/desk/server/services/ticketService.test.ts` | **14**: líneas 104, 197, 208, 713, 723, 733, 915, 927, 1055, 1066, 1073, 1081, 1087 y 1231 | 17 (18 ejecuciones, por el `it.each` de la 1063) |
| `apps/desk/server/transiciones.test.ts` | **7**: el ayudante `ticketEnFaseInicial` (línea 16, sirve a seis pruebas) y las líneas 304, 316, 371, 398, 412 y 437 | 12 (13 ejecuciones) |
| `apps/desk/server/ordenVentaUnTicket.test.ts` | **4**: líneas 139, 278, 294 y 308 | 5 |
| `apps/desk/server/permisos.test.ts` | **2**: los barridos de las líneas 54-55 y 100-101, condicionados a `t.id === 'habilitar_servicio'` | 2: el usuario de Comercial y el administrador |
| `apps/desk/server/cargoPermiso.test.ts` | **1**: línea 260, misma condición | 1 (Comercial) |
| `apps/desk/server/transicionesEjecucion.test.ts` | **1**: líneas 263-264, misma condición | 3 (los tres orígenes) |
| `apps/desk/server/flujoEquipoNuevo.test.ts` | **1**: línea 68 (P4) | 1 |
| `apps/desk/server/routes/ovAsociaciones.test.ts` | **1**: línea 170 (`ovLiberada`) | 1 (puerta 2) |
| **Total** | **31 puntos en 8 ficheros**, más 8 `import` en sitio | 42 |

**`permisos.test.ts`, comprobado:** sí llega. Cada ticket nace en `t.from[0]`, que para esta transición es
`OV asignada` (`packages/shared/src/transitions.ts:178`), así que pasa flujo y estado. Servicio Técnico y Compras
reciben el `403` de área antes (`apps/desk/server/services/ticketService.ts:129-131`) y **no** llegan; Comercial y el
administrador sí, y su `200` esperado pasaría a `422`. Los barridos de equipo nuevo y soporte remoto no contienen la
transición y no se tocan.

**No llegan, y no se tocan:** los 6 ficheros de `packages` (grafo, catálogo, repositorio);
`apps/desk/server/transitionExec.test.ts` (plan puro); `misTickets.test.ts` y `prioridadTop5.test.ts` (filas a mano);
`remisiones.test.ts` (sólo comentarios); `apps/desk/src/lib/valoresTransicion.test.ts`; y, del bloque de F1B-15
(`apps/desk/server/services/ticketService.test.ts:1188-1264`), todas menos la de la línea 1230: les contesta antes el
`403` o el `422` de alta pendiente.

**Dos verdes por la razón equivocada, si se aplicara la guarda sin el ayudante:** la prueba de
`apps/desk/server/transiciones.test.ts:230-234` sólo mira el código `422` (hoy por la persona derivada; pasaría a serlo
por la remisión), y el primer aserto de `apps/desk/server/services/ticketService.test.ts:929-930`. El ayudante las
devuelve a lo que dicen probar; se comprueban a mano en el apply.

**Hipótesis a comprobar en el apply:** (a) en `ovAsociaciones.test.ts`, la remisión `ok` añadida en `ovLiberada` no
altera la puerta 3: `remisionPendienteDe` sólo mira `pendiente` (`apps/desk/server/db/remisiones.ts:69`); (b) en
`apps/desk/server/transiciones.test.ts:201-204`, la segunda transición lee la remisión para su fecha derivada, pero el
aserto es sobre avisos y no depende de su resultado.

## 6. Ficheros y lotes

| Fichero | Acción | Lote |
|---|---|---|
| `packages/shared/src/remision.ts` | Al final: tipo, predicado, motivo | 1 |
| `packages/shared/src/remision.test.ts` | Al final: pruebas del predicado | 1 |
| `apps/desk/server/db/remisiones.ts` | Línea 3 en sitio; `vigenciaDeRemisiones` al final | 1 |
| `apps/desk/server/services/ticketService.ts` | Líneas 5, 6 y 131 en sitio; `exigirRemisionVigente` al final | 1 |
| `apps/desk/server/services/ticketService.test.ts` | 14 líneas en sitio; bloque RQ-TS-33 al final | 1 |
| `apps/desk/server/db/remisionVigente.test.ts` | Nuevo: enfrentamiento con el recuento (RQ-RE-20) | 1 |
| `apps/desk/server/testing/remisionDePrueba.ts` | Nuevo: ayudante | 1 |
| Las otras 7 suites de §5 | En sitio | 1 |
| `apps/desk/src/lib/habilitarServicio.ts` y su `.test.ts` | Nuevos | 2 |
| `apps/desk/src/lib/botonRemision.ts` | Línea 39 en sitio | 2 |
| `apps/desk/src/components/TransitionPanel.tsx` | Líneas 8, 70, 130 y 137 en sitio | 2 |
| `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` | Nuevo (§12) | 2 |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | Texto para los pasajes de la propuesta §0 | 2 |
| Citas que el barrido de §9 dé por reparar | En sitio | 2 |
| `packages/shared/src/cargos.ts`, `cargos.test.ts`, `ticketService.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/server/routes/tickets.ts`, buscadores | **BLOQUEADO** (§10) | 3 |

## 7. Casilla de la regla 13 (lote 2)

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Desactivar «Habilitar Servicio» sin remisión de entrada vigente | `exigirRemisionVigente`, llamada en `apps/desk/server/services/ticketService.ts:131`; probada por §8. Espejo legítimo (punto 3) |
| Qué es «vigente» | No decide: consume `motivoSinRemisionVigente` de `packages/shared` (punto 1) |
| Enseñar primero el motivo de alta pendiente y después el de remisión | El orden de las dos llamadas de esa misma línea 131, fijado por P2 |
| Con las remisiones sin cargar, dejar el botón activo | No es decisión: se abstiene y contesta el servidor |
| Desactivar con alta pendiente (F1B-15) | `exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`. Sin cambios |
| Ofrecer sólo las transiciones del área y cargo | `apps/desk/server/services/ticketService.ts:129-131`. Sin cambios |
| No ofrecer «Crear remisión» con una ya confirmada (`botonRemision.ts`, línea 39) | **Sin imposición, y ya era así:** el servidor sólo rechaza con una `pendiente` (`apps/desk/server/routes/remision.ts:174-183`). Es presentación mientras la pantalla refresca, no una regla; este cambio sólo sustituye la condición por el predicado, sin tocar el comportamiento. Se deja escrito para que no se lea como espejo |
| Texto del motivo y `title` | Presentación; el texto es el del servidor porque sale de la misma función |

Las líneas de las funciones nuevas se fijan en `verify`, contra el árbol de ese día.

## 8. Pruebas (strict TDD: rojo antes que código) y mutaciones

| Prueba | Fichero | Lote |
|---|---|---|
| Predicado: tabla `tipo` × `estado` × anulada; estado desconocido; lista vacía; los dos textos | `packages/shared/src/remision.test.ts`, al final | 1 |
| RQ-TS-33: tres orígenes sin remisión (`422`, sin cambio de estado ni traza) y con ella (`200`); `pendiente`, `error`, anulada y tipo distinto no habilitan; `ok_con_avisos`, histórica y segunda tras anulada sí; equipo nuevo sin y con; texto accionable; P1 a P7; hechos estructurales; espía | `apps/desk/server/services/ticketService.test.ts`, al final | 1 |
| RQ-RE-20: guarda frente a recuento, caso a caso, y la divergencia de `tipo` afirmada; `remisionPendienteDe` y `listRemisionesByTicket` sin cambio | `apps/desk/server/db/remisionVigente.test.ts` | 1 |
| `motivoNoHabilitar`: orden, nulo, vigente, sin confirmar | `apps/desk/src/lib/habilitarServicio.test.ts` | 2 |
| `botonRemision`: las siete pruebas existentes siguen verdes sin tocarlas | `apps/desk/src/lib/botonRemision.test.ts` | 2 |

El recuento se observa por su efecto: un ticket en `Ticket creado` pasa o no a `Remisión creada` tras
`sincronizarEstadoPorRemision` (molde de `apps/desk/server/db/estadoPorRemision.test.ts:56-62`).

**Regla 1, posición.** Cada escenario activa las dos guardas a la vez.

| Par | Escenario | Respuesta | Movimiento que la pone roja |
|---|---|---|---|
| P1 · área | Ticket en `Ticket creado`, sin remisión, sin cliente ni equipo; usuario de Servicio Técnico | `403` de permiso | Llamar a la guarda antes del `if` de la línea 129 → `422` |
| P2 · alta validada | Cliente provisional y equipo pendiente, sin remisión; Comercial; valores completos | `422` que contiene «provisional» y no «remisión de entrada» | Intercambiar las dos llamadas de la línea 131 |
| P3 · obligatorios | Sin remisión; Comercial; `values` vacío | `422` con `error` de remisión y `errors` ausente | Mover la llamada detrás de la línea 134 |
| P4 · cuarentena | Sin remisión; orden en cuarentena y serial presentes | `422` con `error`, sin `errors` | **El mismo que P3**: cuarentena y obligatorios salen del mismo `throw` (`apps/desk/server/services/ticketService.ts:134`), no hay posición intermedia. Se conserva porque el delta lo pide; no añade discriminación |
| P5 · OV ya asociada | Sin remisión; valores completos; la orden ya está en otro ticket | `422` de remisión, no `409` | Mover la llamada detrás de la línea 152. Distinto de P3: con la llamada entre la 134 y la 148, P3 se pone roja y P5 no |
| P6 · estado | Ticket de servicio en `Ingresado`, sin remisión; Comercial | `409` «no aplica desde el estado» | Llamar a la guarda al final de la línea 125 → `422` |
| P7 · flujo | Ticket «Soporte remoto» en `Solicitud Soporte` (`packages/shared/src/flujos.ts:56-61`), sin remisión | `409` que nombra los dos flujos | Llamar a la guarda en la línea 125, entre el `404` y `exigirMismoFlujo` → `422`. Con la llamada detrás de `exigirMismoFlujo`, P6 se pone roja y P7 no |

**Sin escenario posible — comprobado en el código, y fijado por una prueba estructural:**

- **Cargo:** `EXCEPCIONES_POR_CARGO.transiciones` sólo contiene `liberacion_sin_factura` (`packages/shared/src/cargos.ts:32`).
- **Prioridad:** la transición no declara campo de prioridad (`packages/shared/src/transitions.ts:189`) y la guarda sale en `false` (`packages/shared/src/prioridad.ts:82`).
- **Verificación:** el veredicto es `null` salvo en `liberacion` (`apps/desk/server/services/ticketService.ts:242`).

La prueba afirma los dos primeros hechos sobre el catálogo: si `habilitar_servicio` gana una excepción de cargo o un
campo de prioridad, se pone roja y pide su prueba de posición. Mientras tanto, mover la guarda nueva delante de cargo,
prioridad o verificación **dentro de la línea 131** es un mutante equivalente: no lo caza nada, y se declara.

**Regla 2.** No hay guardián de fichero de datos en este cambio. Su equivalente es mutar el predicado con filas sucias,
no retocar la guarda: (m1) quitar `tipo` → roja «tipo distinto»; (m2) quitar la anulación → roja «anulada»; (m3) aceptar
`pendiente` → roja; (m4) quitar `ok_con_avisos` → roja. Y (m5) quitar la salida temprana por `t.id` → roja la del espía,
que busca el texto `SELECT tipo, estado, anulada_at FROM remisiones` en `ingreso_a_servicio` (que sí lee remisiones por
la otra consulta) y en una transición de soporte remoto.

**Regla 3.** §7.

## 9. Barrido de citas al cierre (regla 4)

```
grep -rnoE "(ticketService|ticketService\.test|remisiones|remisiones\.test|remision|remision\.test|estadoPorRemision|botonRemision|TransitionPanel|transiciones\.test|permisos\.test|cargoPermiso\.test|transicionesEjecucion\.test|flujoEquipoNuevo\.test|ordenVentaUnTicket\.test|ovAsociaciones\.test)\.(ts|tsx):[0-9]+(-[0-9]+)?" --include=*.md --include=*.yaml --include=*.ts --include=*.tsx .
```

Se esperan **cero desplazamientos**. Cambia lo que **dicen** las líneas editadas en sitio, y cada cita a ellas se lee:

- `apps/desk/server/services/ticketService.ts`, línea 131 (y las citas a `:129-131`): toda frase que la describa como
  «la última guarda de B» o «tras `exigirAltaValidada` van los obligatorios» pasa a caso A reparado o caso B con revisión.
  Incluye el comentario de la línea 254 de ese mismo fichero.
- `apps/desk/src/components/TransitionPanel.tsx`, líneas 70, 130 y 137. Las citas a su línea 56 no cambian.
- `apps/desk/src/lib/botonRemision.ts`, línea 39.
- Los 31 puntos de §5: las citas a esas líneas de prueba (p. ej. las de `openspec/specs/remisiones/spec.md` y
  `openspec/specs/transitions-st/spec.md`) siguen diciendo lo mismo; se comprueba una a una.

Pase de **abreviadas** (el detector no las bloquea): `CLAUDE.md`, `openspec/config.yaml`,
`openspec/specs/transitions-st/spec.md`, `openspec/specs/tickets-core/spec.md`, `openspec/specs/remisiones/spec.md`,
`openspec/specs/permissions/spec.md` y los comentarios de `ticketService.ts`. Principio y final de cada rango por
separado. En el archive, la fusión del delta **inserta** líneas en dos specs vivas: segundo barrido sobre las citas a
`transitions-st/spec.md` y `remisiones/spec.md`, separando casos A, B y C.

## 10. Lote 3 · OVI de garantía — **BLOQUEADO: no construible hasta la respuesta de Gerencia (Q1)**

Esbozo bajo la opción A (restricción al asociar). Nada de esto entra en `tasks.md` como tarea ejecutable.

**El hallazgo, medido.** `puedeCrearOVIGarantia` exige área Servicio Técnico **y** cargo Director Técnico, o ser
administrador (`packages/shared/src/cargos.ts:71-74`; lo fija `packages/shared/src/cargos.test.ts:117`). Puerta a puerta:

| Puerta | Quién llega hoy | Qué implica la primitiva tal cual |
|---|---|---|
| Alta (`apps/desk/server/services/ticketService.ts:37-44`, y el número suelto del cuerpo en la línea 30 del mismo fichero) | `POST /api/tickets` (`apps/desk/server/routes/tickets.ts:124`); hipótesis: cualquier usuario autenticado | Funciona para un Director Técnico. `createManagedTicket` no recibe áreas ni cargo (`apps/desk/server/services/ticketService.ts:21`): cambia su firma en sitio y su llamador. Hay que mirar el número **final** (tras la línea 42), no sólo `salesOrderId` |
| Transición (`apps/desk/server/services/ticketService.ts:148`) | «Habilitar Servicio» es de Comercial (`packages/shared/src/transitions.ts:178`) | El `403` de área llega antes: un Director Técnico sin área Comercial **nunca** alcanza la puerta, y Comercial no tiene el cargo. Sólo pasa un administrador o alguien con las dos áreas y el cargo. En la práctica, la OVI no podría asociarse por aquí |
| Transición, segunda vía | Las aprobaciones llevan «OV adicional» (`packages/shared/src/transitions.ts:375`), que también llega a la línea 148 | La propuesta habla de tres puertas; por número de entradas son **cuatro**. Mismo problema de área |
| Remisión (`apps/desk/server/routes/remision.ts:220`) | Cualquier usuario autenticado (`apps/desk/server/routes/remision.ts:120`) | Funciona para un Director Técnico. La guarda entra en el `if` de la línea 220, sin mover nada (IV-12): es un permiso (B) que corre **detrás** de C (líneas 127 y 197) y de D (línea 177). Es un **tercer punto** del mismo molde de IV-12: se registra en su ficha, no se corrige |

Forma prevista, si A: predicado puro `esOVIGarantia(numero)` y `motivoOVISinPermiso(numeros, sujeto)` en
`packages/shared` (junto a `packages/shared/src/subOV.ts:24`, que ya reconoce el prefijo); en la transición, llamada en
la línea 131 leyendo los campos de tipo orden de venta de `b.values`, como hace la guarda de prioridad; excluyendo la
orden que el ticket **ya tiene** (reconfirmar no es asociar). IV-11: no añade vías de escritura. IV-8: no toca la guarda
equipo↔cliente.

**Qué hay que preguntar además de Q1:**

1. **Área del acto.** ¿Se mantiene S-9 (área Servicio Técnico), con lo que la OVI sólo entra por alta o remisión y
   Comercial no puede teclearla en «Habilitar Servicio»; o el acto pide sólo el cargo, sin área? Decide si la puerta de
   la transición es utilizable. Corresponde a Gerencia; desbloquea el diseño de esa puerta.
2. **Aprobaciones.** ¿La restricción alcanza a la «OV adicional» de las dos aprobaciones?
3. **Tickets que ya traen la OVI** (venidos de Zoho con el número en su columna): ¿reconfirmarla en «Habilitar
   Servicio» cuenta como asociar? Si cuenta, Comercial no podría habilitarlos.
4. **Sin cargos asignados** sólo pasa el administrador (RQ-PM-22): ¿aceptable el día de publicar, o se asigna antes?
5. La subpregunta de la propuesta: relación entre tipo de servicio «Garantía» y OVI.

## 11. Presupuesto

Un intento por lote, en este worktree, uno a la vez. Techo 800, válvula 720. Medida real: `git diff --shortstat
--no-renames` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear. Una edición en sitio
cuenta **2** (una línea borrada y una insertada).

| Lote | Código | Pruebas ×1,8 | Pruebas por enumeración | Pruebas existentes (medido) | Otros | **Total** | Margen a 720 |
|---|---|---|---|---|---|---|---|
| **1 · Guarda en servidor** | 54: predicado y textos 24, lectura 10, guarda 12, cuatro líneas en sitio 8 | 97 | 225: predicado 40, RQ-TS-33 130, enfrentamiento 55 | 100: ayudante 22, 31 puntos × 2 = 62, 8 `import` × 2 = 16 | `tasks.md` 10 | **≈ 389** | 331 |
| **2 · Cliente y cierre** | 28: `habilitarServicio.ts` 18, `botonRemision.ts` 2, `TransitionPanel.tsx` 8 | 50 | 45 | — | consulta SQL 55, correcciones del maestro 30, citas 30, `tasks.md` 8 | **≈ 201** (con el ×1,8) | 519 |
| **3 · OVI (BLOQUEADO)** | ≈ 70 con cuatro entradas y buscadores | 126 | ≈ 230 | por medir | 10 | **≈ 310, a reestimar tras Q1** | ≈ 410 |
| Verify | — | — | — | — | `verify-report.md` 300-360 | **≈ 360**, intento propio | 360 |
| Archive | — | — | — | — | Revisable: fusión de dos deltas ADDED (264 líneas hoy; **se mide**, no se estima) más `archive-report.md` 110-264 → hipótesis 380-530. Mudanza ≈ 1.500 líneas × 2, sin techo (regla del archivo) | **revisable ≤ 800; se mide antes de aplicar** | si pasa, se para y se consulta |

Se toma el mayor de los dos: la enumeración en los lotes 1 y 3, el ×1,8 en el 2. Ningún lote llega a la válvula. Si el lote 1 midiera
más de 720 al cerrar la parte de pruebas existentes, se parte en 1a (predicado, lectura, guarda y pruebas nuevas, con
las 8 suites adaptadas, porque sin ellas la suite queda roja) y 1b (enfrentamiento RQ-RE-20).

## 12. Despliegue

**Qué cambia para el usuario el día que se publica.** Un ticket en `Ticket creado`, `OV asignada` o `Remisión creada`
sin remisión de entrada confirmada y no anulada deja de poder habilitarse: el botón aparece desactivado con el motivo,
y el servidor contesta `422`. Afecta también a los tickets venidos de Zoho que esperan en `OV asignada`, a los de
«Equipo nuevo» (Q5) y a los que tienen la remisión `pendiente` o en `error` porque n8n no confirmó (Q4). Lo habilitado
desde Zoho no pasa por la aplicación y la guarda no lo ve.

**El recuento que pide el maestro** (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`), leído:

- **Mide el histórico**, no lo que la guarda va a bloquear: cuenta los tickets que ya pasaron por la transición
  (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:31-36`) y si tenían remisión al llegar. Responde a
  lo que el maestro pide contar y sirve tal cual para eso.
- **Su «vigente» es más ancha que S-1:** entrada y no anulada, **sin** mirar `estado`
  (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:63-65`). Cuenta como «con remisión» una `pendiente`
  o en `error`, que la guarda rechazará. Su cifra `sin_remision_al_llegar` es por tanto una **cota inferior** de lo que
  S-1 habría bloqueado. No se edita (está fechada: caso B); se anota al entregar la cifra.
- **No mide la población que queda bloqueada al publicar:** los tickets que HOY están en los tres estados de origen.

Por eso el lote 2 escribe una **segunda consulta**, sólo de lectura, en fichero nuevo: tickets en los tres orígenes,
por estado, clasificación y `managed_by_app`, repartidos en «con remisión vigente (S-1)», «con remisión sin confirmar»
y «sin ninguna». Escribirla es trabajo de la tanda; **ejecutarla es de persona**:

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Ejecutar las dos consultas contra producción y entregar las cifras | Gerencia | Condición de **publicación**, no de construcción ni de fusión a `main` | Panel y `docs/sdd/ENTRADA.md`; paquete de despliegue de la fecha |
| Comprobar en la aplicación el botón desactivado y los dos textos | Gerencia | Verificación tras publicar el lote 2 | `archive-report.md` |
| Responder Q1 a Q5 | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` | Panel |

No son tareas de esta tanda y archivar no las da por hechas (regla del ciclo 1).

**Reversión.** Sin migración ni dato nuevo. Revertir el commit de fusión del lote devuelve el comportamiento anterior;
para retirar sólo la guarda basta quitar su llamada de la línea 131. Revertir el lote 1 con el 2 publicado deja el botón
desactivado sin imposición detrás: se revierten en orden inverso.

## 13. Matriz de amenazas

N/A: sin rutas de shell, subprocesos, automatización de VCS, clasificación de ejecutables ni integración de procesos.
El cambio no añade ninguna ruta HTTP.

## 14. Preguntas abiertas

- [ ] **Q1** (qué es «crear la OVI» en Desk) más las cinco de §10: **bloquean el lote 3**. No bloquean los lotes 1 y 2.
- [ ] Q2 (calibración directa): supuesto aplicado, no entra.
- [ ] Q3 (retirar el origen `Ticket creado`): supuesto S-4, se conserva.
- [ ] Q4 («vigente» exige confirmación): supuesto S-1. Reversible en una línea del predicado; a confirmar antes de publicar.
- [ ] Q5 (alcanza a «Equipo nuevo»): supuesto S-3; a confirmar antes de publicar.
- [ ] Hallazgo para el orquestador: el delta de `transitions-st` remite a un borrador del lote 3 «en el delta de
  `permissions` y `tickets-core`», y esos dos ficheros **sí existen** en la carpeta del cambio (borrador, bloqueado por Q1).
- [ ] Riesgo aceptado: con el dato de remisiones caduco en pantalla, el botón puede quedar desactivado cuando el
  servidor ya aceptaría; se resuelve al recargar la ficha. Hipótesis: `TicketDetailView.tsx` ya recarga las remisiones
  tras cada cambio de remisión.
