# Diseño: guarda de remisión vigente en «Habilitar Servicio» y OVI de garantía (F1B-03, parte L)

Medido el 2026-10-03 en el worktree `tipo-servicio-ticket-sin-ov`, partida `5f68822`. Toda línea citada se leyó en ese
árbol. Lo que no lleva ruta y línea lleva «hipótesis». Entradas: `proposal.md`, `exploration.md` y los dos deltas ya
escritos (`specs/transitions-st/spec.md`, `specs/remisiones/spec.md`) de esta misma carpeta.

**Revisado el 2026-10-03 (revisión de la planificación):** el supuesto S-1 queda retirado y «vigente» se construye a la
letra de Gerencia —remisión de entrada, creada y no anulada, con cualquier estado de envío—. Lo que cambió, y por qué,
está en la última sección de este documento.

**Tres correcciones a la propuesta, medidas al diseñar:**

1. **Hay una CUARTA implementación de «vigente», y está en el cliente.** `apps/desk/src/lib/botonRemision.ts:33` en `a77ec68` filtra
   `!r.anuladaAt && r.tipo === 'entrada'` y llama `vigentes` al resultado: es, letra por letra, la definición que se
   construye. `apps/desk/src/lib/botonRemision.ts:39` en `a77ec68` añade encima una noción distinta, «confirmada» (`ok` u
   `ok_con_avisos`), que **no** es «vigente». La propuesta contaba tres implementaciones. El lote 2 hace que la línea 33
   consuma el predicado y que la 39 consuma el de «confirmada» (D6).
2. **Las pruebas afectadas no son «unas 30 en 6 ficheros»: son 31 puntos de edición en 8 ficheros** (§5). La búsqueda
   literal no caza `apps/desk/server/cargoPermiso.test.ts:260` ni los dos barridos de `apps/desk/server/permisos.test.ts`.
3. **Prioridad deja de ser hipótesis: no hay escenario.** `cambiaPrioridadSinPermiso` sale en `false` si la transición
   no declara un campo de prioridad (`packages/shared/src/prioridad.ts:82`), y `habilitar_servicio` no lo declara
   (`packages/shared/src/transitions.ts:189`).

## 1. Enfoque

Un predicado puro en `packages/shared` que lleva **las dos condiciones** de «vigente» (`tipo` de entrada y no anulada;
el estado de envío no entra); una lectura en el servidor que **no lleva ninguna** (sólo la clave del ticket); una guarda
de escalón B al final de `ticketService.ts`, llamada en la línea 131 ya existente; y el cliente consumiendo el mismo
predicado, más un aviso **no bloqueante** de «remisión sin confirmar» que es sólo presentación. En ficheros citados, sólo **ediciones en la misma
línea** o **añadidos al final** (regla de mutación 4), y eso incluye los ficheros de prueba.

No se toca `packages/shared/src/transitions.ts` ni el `from` (S-4, Q3), ni `apps/desk/server/db/estadoPorRemision.ts`,
ni `apps/desk/server/routes/remision.ts` en los lotes 1 y 2. Sin migración.

## 2. Decisiones

| # | Decisión | Elegida | Descartadas y por qué |
|---|---|---|---|
| D1 | Dónde vive el predicado, y qué es | `esRemisionEntradaVigente(r)` = `r.tipo === 'entrada' && !r.anuladaAt`: **a la letra** de Gerencia («vigente (no anulada)», `docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`; «creada y no anulada», `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). **El estado de envío no entra en el predicado de bloqueo.** Al **final** de `packages/shared/src/remision.ts` (tras `faltaFotoPorNovedad`, `packages/shared/src/remision.ts:110-112`), ya exportado por el índice del paquete. Tipo estructural propio, **sin `import`**, para no desplazar ninguna línea. Un **segundo predicado**, `esRemisionConfirmada(r)` (`ok` u `ok_con_avisos`), se añade en el lote 2, también al final: alimenta **sólo** el aviso del cliente y la línea 39 de `botonRemision.ts`; ninguna guarda lo llama | Exigir además `estado` `ok` u `ok_con_avisos` (el supuesto S-1, retirado): contradice la letra sin decisión que lo respalde y ata «Habilitar Servicio» a que n8n responda. Fichero nuevo `remisionVigente.ts`: obliga a tocar el índice y parte en dos el dominio de remisión. Junto a `motivoAltaPendiente` en `altaManual.ts`: no es alta manual. Importar `Remision` de `types.ts`: añade una línea arriba y desplaza el fichero |
| D2 | Qué lee el servidor | `vigenciaDeRemisiones(db, ticketId)`, al final de `apps/desk/server/db/remisiones.ts` (tras la línea 230): `SELECT tipo, anulada_at FROM remisiones WHERE ticket_id = $1`. **La consulta no filtra nada**: las dos condiciones las aplica el predicado, que así es la única fuente y se puede mutar por datos (regla 2). **`estado` ya no se lee:** nada del servidor lo usa —la guarda no lo mira y el aviso es del cliente, que ya tiene las remisiones con su estado en la prop `remisiones`—, y una columna leída sin uso invita a filtrar por ella | `SELECT … WHERE tipo='entrada' AND anulada_at IS NULL`: sería la quinta implementación, en SQL. Seguir leyendo `estado` «por si acaso»: dato sin consumidor en el servidor. Reutilizar `listRemisionesByTicket` (`apps/desk/server/db/remisiones.ts:76-79`): ya filtra anuladas, así que quitar esa condición del predicado no pondría roja la guarda; trae `SELECT *`; y ata la guarda al listado del panel. Además su texto es el que lee `valoresConFechasDerivadas` (`apps/desk/server/services/valoresDeTransicion.ts:26`), y el espía de «sin consultas extra» no podría distinguirlas |
| D3 | Guarda | `exigirRemisionVigente(db, t, id)`, al final de `ticketService.ts` (tras la línea 264), llamada en la línea 131 inmediatamente detrás de `await exigirAltaValidada(db, t, current.row)` y delante del comentario de cierre. `422`, `{ error }`, escalón B. Sale sin consultar si `t.id !== 'habilitar_servicio'` (mismo gesto que `apps/desk/server/services/ticketService.ts:259`) | `409`: S-2. Dentro de `exigirAltaValidada`: mezcla dos requisitos y no deja probar su orden. En línea propia: desplaza 134 líneas citadas |
| D4 | Mensaje | **Un solo texto de bloqueo** en el `422` (§4): «…falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.». Con la definición a la letra, quien recibe el `422` no tiene ninguna remisión de entrada sin anular, así que «crea la remisión» es siempre la acción correcta. No contiene «cliente», «equipo» ni «provisional», y el de alta pendiente no contiene «remisión de entrada» (`packages/shared/src/altaManual.ts:76`, la línea 77 del mismo fichero): **P2 sigue discriminando con un solo texto**. El aviso de «remisión sin confirmar» va **aparte**, en el cliente, y no bloquea (D6) | Dos textos, el segundo para «hay una sin confirmar»: era lo que hacía accionable el coste de S-1; retirado S-1, ese caso ya no se rechaza y el segundo texto no tiene cuándo salir. Poner el aviso en el cuerpo del `200`: cambia el contrato de la ruta para un dato que el cliente ya tiene |
| D5 | Molde H5 frente al recuento | **Prueba que las enfrenta y AFIRMA su divergencia**, no una sola fuente. `estadoPorRemision.ts` no se reescribe: su recuento (`apps/desk/server/db/estadoPorRemision.ts:43-47`) cuenta sólo las confirmadas y no filtra `tipo`, y eso es lo que mueve el estado `Remisión creada` (RQ-TS-03, `openspec/specs/transitions-st/spec.md:98`, `openspec/specs/transitions-st/spec.md:101-103`; RQ-RE-11). Las dos nociones **divergen a propósito en `estado`** —consecuencia declarada de construir «vigente» a la letra— y **siguen divergiendo en `tipo`**. La prueba (§8, lote 1) ejecuta las dos sobre la misma tabla de filas y fija el veredicto de cada una, fila a fila: un ticket en `Ticket creado` con una remisión de entrada `pendiente`, la guarda **habilita** y el recuento **no** lo pasa a `Remisión creada`. Si alguien alinea una con otra sin decisión —filtra `estado` en el predicado, lo quita del recuento, o filtra `tipo` en el recuento—, se pone roja y hay que moverla a propósito | Que el recuento llame al predicado: reescribe un fichero citado y cambiaría cuándo se mueve el estado, que es RQ-TS-03 y está fuera de alcance. Que la guarda use el recuento: es S-1 por otra puerta. Dejar las dos sin enfrentar: es H5 otra vez |
| D6 | Cliente | Lógica en `apps/desk/src/lib/habilitarServicio.ts` (nuevo, con prueba `.ts`): `motivoNoHabilitar(motivoAlta, remisiones)`, que bloquea, y `avisoRemisionSinConfirmar(remisiones)`, que **no** bloquea: devuelve texto cuando hay al menos una remisión de entrada vigente y ninguna de las vigentes está confirmada. `TransitionPanel.tsx` sólo cambia en sus líneas 8, 70, 130 y 137. `botonRemision.ts`: la línea 33 pasa a `.filter(esRemisionEntradaVigente)` (misma condición, letra por letra) y la 39 a `vigentes.some(esRemisionConfirmada)`, con el `import` en su línea 2; la 34 (la `pendiente` que reetiqueta el botón) **se queda como está**. Sin cambio de comportamiento (lo fijan sus siete pruebas existentes) | Lógica en el `.tsx`: fuera de la red de pruebas (F0-00). Dejar `botonRemision.ts` como está: una copia de «vigente» y otra de «confirmada» vivas en el cliente, y el aviso sería una tercera |
| D7 | Orden de motivos en el cliente | El de la línea 131 del servidor: primero el de alta pendiente, luego el de remisión. Con `remisiones` nulo (cargando o error de carga, `apps/desk/src/components/TicketDetailView.tsx:53`) las dos funciones devuelven `null`: botón activo, sin aviso, decide el servidor. El aviso sólo se muestra con el botón **activo** (si hay motivo de bloqueo, manda el motivo) | Mostrar los dos motivos: el servidor sólo contesta uno |
| D8 | Pruebas existentes | Ayudante compartido `conRemisionVigente` (§5). En los ficheros de prueba, la remisión se añade **en la misma línea** que crea el ticket, y el `import` en una línea de `import` existente: esos ficheros están citados (por búsqueda, 79 citas con línea a esas suites, a `db/remisiones.ts`, a `botonRemision.ts` y al `remision.ts` de `shared`, en 17 ficheros entre specs, `CLAUDE.md`, `openspec/config.yaml` y el propio código) | Cambiar el ayudante `ticket()` de cada suite para que cree la remisión siempre: esconde el requisito y deja sin poder escribir las pruebas «sin remisión». Dar remisión a TODOS los tickets de los barridos: `ingreso_a_servicio` lee la remisión para su fecha derivada y cambiaría lo que prueban |
| D9 | Interruptor de despliegue | **Ninguno.** Fusionar a `main` no publica (el despliegue es manual); el recuento es condición de despliegue (§12) | Variable de entorno que apague la guarda: un flag es superficie de configuración que documentar, y una guarda «sin excepciones» con interruptor tiene una |
| D10 | RQ-TS-06 | No se amplía (S-8). La posición se fija por pruebas y por RQ-TS-33 | — |

## 3. Flujo

```
TransitionPanel ─ motivoNoHabilitar(motivoAlta, remisiones) ─▶ motivoSinRemisionVigente (shared)   [comodidad; bloquea]
TransitionPanel ─ avisoRemisionSinConfirmar(remisiones) ─▶ esRemisionEntradaVigente · esRemisionConfirmada (shared)   [presentación; NO bloquea]
POST /api/tickets/:id/transition ─▶ executeTransition
   A 400·404 → B flujo → B estado → B área → cargo·prioridad·verificación → exigirAltaValidada
   → exigirRemisionVigente ─▶ vigenciaDeRemisiones (db) ─▶ motivoSinRemisionVigente (shared) ─▶ 422 { error }
   → C obligatorios·fechas·cuarentena·certificado → C persona → C vencido → D OV ya asociada → applyTransition
```

## 4. Interfaces

```ts
// packages/shared/src/remision.ts — al final (lote 1)
export interface RemisionParaVigencia { tipo: string; anuladaAt: string | null }
export function esRemisionEntradaVigente(r: RemisionParaVigencia): boolean
//   r.tipo === 'entrada' && !r.anuladaAt          ← el estado de envío NO entra
export function motivoSinRemisionVigente(remisiones: readonly RemisionParaVigencia[]): string | null
//   null si alguna es vigente; si no, el texto único del 422

// packages/shared/src/remision.ts — al final (lote 2; sólo presentación, ninguna guarda lo llama)
export function esRemisionConfirmada(r: { estado: string }): boolean
//   r.estado === 'ok' || r.estado === 'ok_con_avisos'

// apps/desk/server/db/remisiones.ts — al final
export async function vigenciaDeRemisiones(db: Queryable, ticketId: string): Promise<RemisionParaVigencia[]>

// apps/desk/server/services/ticketService.ts — al final
async function exigirRemisionVigente(db: Queryable, t: Transition, ticketId: string): Promise<void>

// apps/desk/src/lib/habilitarServicio.ts — nuevo (lote 2)
type RemisionDelPanel = RemisionParaVigencia & { estado: string }
export function motivoNoHabilitar(motivoAlta: string | null, remisiones: readonly RemisionParaVigencia[] | null | undefined): string | null
export function avisoRemisionSinConfirmar(remisiones: readonly RemisionDelPanel[] | null | undefined): string | null
//   texto si hay ≥ 1 vigente y ninguna de las vigentes está confirmada; null en cualquier otro caso (también con null)
```

`RemisionParaVigencia` no lleva `estado`: el predicado de bloqueo no lo mira y la lectura del servidor no lo trae (D2).
`esRemisionConfirmada` recibe `estado: string` y no la unión: la columna no tiene `CHECK` y llega con un cast sin
validar (comentario de `packages/shared/src/remision.ts:70-73`); un estado desconocido no cuenta como confirmada, pero
**sí** cuenta como vigente si la fila es de entrada y no está anulada. `Remision` es asignable a los dos tipos, así
que el cliente pasa su prop sin convertir.

**Texto exacto del `422` — uno solo:**

`No se puede habilitar el servicio: falta una remisión de entrada vigente. Crea la remisión de entrada desde el ticket.`

**Texto del aviso del cliente (no bloqueante; no viaja en ninguna respuesta del servidor):**

`Remisión de entrada sin confirmar: el servicio se puede habilitar, pero el documento de la remisión todavía no está generado.`

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

**Por qué `ok` y no `pendiente`, ahora que cualquier estado habilita — decidido leyendo el código:**

- **Una `ok` insertada a mano NO mueve el ticket a `Remisión creada`.** El estado sólo lo mueve
  `sincronizarEstadoPorRemision`, y sólo se llama desde tres rutas de remisión: anular
  (`apps/desk/server/routes/remision.ts:336`), restaurar (`apps/desk/server/routes/remision.ts:346`) y la confirmación
  del envío (`apps/desk/server/routes/remision.ts:374`). El ayudante hace un `INSERT` directo y no pasa por ninguna.
  Los asertos que esperan que el ticket siga en `Ticket creado` (por ejemplo
  `apps/desk/server/ordenVentaUnTicket.test.ts:150` y la línea 287 del mismo fichero) no cambian. Comprobado además por
  búsqueda: ninguna de las ocho suites adaptadas llama a las rutas de anular, restaurar ni confirmar.
- **Una `pendiente` NO es más inocua: rompe una prueba.** `ovLiberada` (`apps/desk/server/routes/ovAsociaciones.test.ts:170`)
  crea el ticket que las tres puertas comparten, y la puerta 3 espera `201` al crear una remisión sobre él
  (`apps/desk/server/routes/ovAsociaciones.test.ts:183`). Con una `pendiente` del ayudante, `remisionPendienteDe`
  (`apps/desk/server/db/remisiones.ts:67-73`) la encontraría y la ruta contestaría `409`
  (`apps/desk/server/routes/remision.ts:177`). Con una `ok` no.
- El ayudante representa el caso normal (remisión confirmada); `pendiente` y `error` los insertan a propósito, con
  `over`, las pruebas nuevas que afirman que también habilitan.

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
`apps/desk/server/transiciones.test.ts:230-234` en `a77ec68` sólo mira el código `422` (hoy por la persona derivada; pasaría a serlo
por la remisión), y el primer aserto de `apps/desk/server/services/ticketService.test.ts:929-930` en `a77ec68`. El ayudante las
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
| `apps/desk/server/db/remisionVigente.test.ts` | Nuevo: la guarda frente al recuento, con sus dos divergencias afirmadas (RQ-RE-20) | 1 |
| `apps/desk/server/testing/remisionDePrueba.ts` | Nuevo: ayudante | 1 |
| Las otras 7 suites de §5 | En sitio | 1 |
| `packages/shared/src/remision.ts` y `packages/shared/src/remision.test.ts` | Al final: `esRemisionConfirmada` y su tabla de estados | 2 |
| `apps/desk/src/lib/habilitarServicio.ts` y su `.test.ts` | Nuevos: `motivoNoHabilitar` y `avisoRemisionSinConfirmar` | 2 |
| `apps/desk/src/lib/botonRemision.ts` | Líneas 2, 33 y 39 en sitio; la 34 no se toca | 2 |
| `apps/desk/src/components/TransitionPanel.tsx` | Líneas 8, 70, 130 y 137 en sitio | 2 |
| `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` | Nuevo (§12) | 2 |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md` | Texto para los pasajes de la propuesta §0 | 2 |
| Citas que el barrido de §9 dé por reparar | En sitio | 2 |
| `packages/shared/src/cargos.ts`, `cargos.test.ts`, `ticketService.ts`, `apps/desk/server/routes/remision.ts`, `apps/desk/server/routes/tickets.ts`, buscadores | **BLOQUEADO** (§10) | 3 |

## 7. Casilla de la regla 13 (lote 2)

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Desactivar «Habilitar Servicio» sin remisión de entrada vigente (creada y no anulada) | `exigirRemisionVigente`, llamada en `apps/desk/server/services/ticketService.ts:131`; probada por §8. Espejo legítimo (punto 3) |
| Qué es «vigente» | No decide: consume `motivoSinRemisionVigente` y `esRemisionEntradaVigente` de `packages/shared` (punto 1). El estado de envío no entra, ni en el cliente ni en el servidor |
| **Avisar de «remisión sin confirmar»**, sin desactivar el botón | **Sin imposición del servidor, y no la necesita: es PRESENTACIÓN.** El servidor habilita igual con la remisión `pendiente` o en `error`; el aviso no impide ni decide nada. No es un espejo de ninguna guarda. Si el dato está caduco, lo peor que pasa es un aviso de más o de menos |
| Qué es «confirmada» (para el aviso y para la línea 39 de `botonRemision.ts`) | No decide: consume `esRemisionConfirmada` de `packages/shared`. Es la misma noción que cuenta el recuento del servidor (`apps/desk/server/db/estadoPorRemision.ts:43-47`), que sigue en SQL y **no** se reescribe: dos implementaciones, declaradas (D5) |
| Qué remisiones mira el botón «Crear remisión» (`botonRemision.ts`, línea 33) | Era una copia de «vigente» en el cliente; pasa a consumir `esRemisionEntradaVigente` (punto 1). Sin cambio de comportamiento |
| Reetiquetar el botón con una `pendiente` (`botonRemision.ts`, línea 34) | Se queda como está. La imposición vecina existe: el `409` de `apps/desk/server/routes/remision.ts:174-183` |
| Enseñar primero el motivo de alta pendiente y después el de remisión | El orden de las dos llamadas de esa misma línea 131, fijado por P2 |
| Con las remisiones sin cargar, dejar el botón activo | No es decisión: se abstiene y contesta el servidor |
| Desactivar con alta pendiente (F1B-15) | `exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`. Sin cambios |
| Ofrecer sólo las transiciones del área y cargo | `apps/desk/server/services/ticketService.ts:129-131`. Sin cambios |
| No ofrecer «Crear remisión» con una ya confirmada (`botonRemision.ts`, línea 39) | **Sin imposición, y ya era así:** el servidor sólo rechaza con una `pendiente` (`apps/desk/server/routes/remision.ts:174-183`). Es presentación mientras la pantalla refresca, no una regla; este cambio sólo sustituye la condición por `esRemisionConfirmada`, sin tocar el comportamiento. Se deja escrito para que no se lea como espejo |
| Texto del motivo, `title` y texto del aviso | Presentación; el texto del motivo es el del servidor porque sale de la misma función. El del aviso es sólo del cliente |

Las líneas de las funciones nuevas se fijan en `verify`, contra el árbol de ese día.

## 8. Pruebas (strict TDD: rojo antes que código) y mutaciones

| Prueba | Fichero | Lote |
|---|---|---|
| Predicado: tabla `tipo` × anulada × `estado` (el estado **no** cambia el veredicto: `pendiente`, `error`, `ok`, `ok_con_avisos` y desconocido cuentan igual); lista vacía; el texto único | `packages/shared/src/remision.test.ts`, al final | 1 |
| RQ-TS-33: tres orígenes sin remisión (`422`, sin cambio de estado ni traza) y con ella (`200`); anulada y tipo distinto no habilitan; `pendiente` (desde `Ticket creado`, sin pasar por `Remisión creada`), `error`, `ok_con_avisos`, histórica y segunda tras anulada **sí**; equipo nuevo sin y con; texto único y accionable; P1 a P7; hechos estructurales; espía | `apps/desk/server/services/ticketService.test.ts`, al final | 1 |
| RQ-RE-20: guarda frente a recuento, fila a fila; coinciden en `ok`, `ok_con_avisos`, anulada, histórica y vigente tras anulada; **divergencia de `estado` afirmada** (`pendiente`, `error`: la guarda habilita, el recuento no mueve el ticket) y **divergencia de `tipo` afirmada**; `remisionPendienteDe` y `listRemisionesByTicket` sin cambio | `apps/desk/server/db/remisionVigente.test.ts` | 1 |
| `esRemisionConfirmada`: tabla de estados (`ok`, `ok_con_avisos` sí; `pendiente`, `error`, desconocido no) | `packages/shared/src/remision.test.ts`, al final | 2 |
| `motivoNoHabilitar`: orden, nulo, vigente (también `pendiente`: no bloquea). `avisoRemisionSinConfirmar`: única vigente `pendiente` o `error` → texto; alguna vigente confirmada → `null`; sin vigentes → `null` (manda el motivo); anulada o de otro tipo no cuentan; nulo → `null` | `apps/desk/src/lib/habilitarServicio.test.ts` | 2 |
| `botonRemision`: las siete pruebas existentes siguen verdes sin tocarlas | `apps/desk/src/lib/botonRemision.test.ts` | 2 |

El recuento se observa por su efecto: un ticket en `Ticket creado` pasa o no a `Remisión creada` tras
`sincronizarEstadoPorRemision` (molde de `apps/desk/server/db/estadoPorRemision.test.ts:56-62`).

**La tabla que la prueba de RQ-RE-20 afirma, fila a fila** (un ticket en `Ticket creado` con esa única fila, salvo la quinta):

| Fila | Guarda: ¿habilita? | Recuento: ¿pasa a `Remisión creada`? | |
|---|---|---|---|
| entrada, `ok`, no anulada | sí | sí | coinciden |
| entrada, `ok_con_avisos`, no anulada | sí | sí | coinciden |
| entrada, histórica `ok`, no anulada | sí | sí | coinciden |
| entrada, `ok`, anulada | no | no | coinciden |
| entrada anulada y otra entrada `ok` posterior | sí | sí | coinciden |
| entrada, `pendiente`, no anulada | **sí** | **no** | **divergencia declarada: `estado`** |
| entrada, `error`, no anulada | **sí** | **no** | **divergencia declarada: `estado`** |
| tipo distinto de entrada, `ok`, no anulada | **no** | **sí** | **divergencia declarada: `tipo`** |

La sexta fila es la consecuencia declarada de la propuesta §4.1: el ticket sigue en `Ticket creado` y aun así se
habilita desde ahí. La prueba la nombra en su título y en un comentario que remite a RQ-RE-20; no es un defecto a
corregir, y quien quiera cambiarla necesita una decisión.

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
campo de prioridad, se pone roja y pide su prueba de posición. Mientras tanto, el mutante **equivalente** (no lo caza
nada, y se declara) es mover **el PAR** `exigirAltaValidada` + `exigirRemisionVigente` delante de cargo, de prioridad o de
verificación. **Corregido en el lote 2, medido en el lote 1:** mover SÓLO `exigirRemisionVigente` delante de ellos la deja
delante de `exigirAltaValidada` y **P2 se pone roja** (5 rojas); mover el par entero deja 251 de 251 verdes en las seis
suites que llegan. La primera redacción de este párrafo decía que bastaba mover la guarda sola: era falso.

**Regla 2.** No hay guardián de fichero de datos en este cambio. Su equivalente es mutar el predicado con filas sucias,
no retocar la guarda. Las pruebas ensucian los datos vigilados (filas de `remisiones`) y cada mutación del predicado
debe poner roja una prueba concreta:

- **(m1)** quitar `r.tipo === 'entrada'` → roja «tipo distinto de entrada no cuenta».
- **(m2)** quitar `!r.anuladaAt` → roja «anulada no habilita» y «sin remisión vigente desde `Remisión creada`».
- **(m3)** **reintroducir el filtro de estado** (exigir `ok` u `ok_con_avisos`, que es el S-1 retirado) → rojas
  «`pendiente` habilita» y «`error` habilita» en la tabla del predicado, y las filas sexta y séptima de la tabla de
  RQ-RE-20. En el bloque del servicio se ponen rojas además **todas** las de `200`, porque la lectura del servidor ya no
  trae `estado` (D2): se anota, no resta discriminación. Es la mutación que impide que S-1 vuelva sin decisión.
- **(m4)** *(lote 2, sobre `esRemisionConfirmada`)* quitar `ok_con_avisos` → roja su fila en la tabla de estados y la
  del aviso «con una vigente en `ok_con_avisos` no hay aviso».
- **(m5)** quitar la salida temprana por `t.id` → roja la del espía, que busca el texto
  `SELECT tipo, anulada_at FROM remisiones` en `ingreso_a_servicio` (que sí lee remisiones por la otra consulta) y en
  una transición de soporte remoto.

**Mutaciones de la divergencia (RQ-RE-20), sobre el recuento.** `estadoPorRemision.ts` no se edita en este cambio, pero
se muta **temporalmente** para probar que la prueba discrimina en los dos sentidos, y se revierte dejando
`git diff -- apps/desk/server/db/estadoPorRemision.ts` vacío: (d1) quitar del recuento la condición de `estado` → rojas
las filas sexta y séptima; (d2) añadirle `AND tipo = 'entrada'` → roja la octava. Con m3, d1 y d2, alinear cualquiera
de las dos nociones con la otra pone la prueba en rojo.

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
- `apps/desk/src/lib/botonRemision.ts`, líneas 2, 33 y 39 (la 34 no cambia).
- Los 31 puntos de §5: las citas a esas líneas de prueba (p. ej. las de `openspec/specs/remisiones/spec.md` y
  `openspec/specs/transitions-st/spec.md`) siguen diciendo lo mismo; se comprueba una a una.

Pase de **abreviadas** (el detector no las bloquea): `CLAUDE.md`, `openspec/config.yaml`,
`openspec/specs/transitions-st/spec.md`, `openspec/specs/tickets-core/spec.md`, `openspec/specs/remisiones/spec.md`,
`openspec/specs/permissions/spec.md` y los comentarios de `ticketService.ts`. Principio y final de cada rango por
separado. En el archive, la fusión del delta **inserta** líneas en dos specs vivas: segundo barrido sobre las citas a
`transitions-st/spec.md` y `remisiones/spec.md`, separando casos A, B y C.

## 10. Lote 3 · OVI de garantía — **BLOQUEADO: no construible hasta la respuesta de Gerencia (Q1)**

Esbozo bajo la opción A (restricción al asociar). Nada de esto entra en `tasks.md` como tarea ejecutable.

**Regla de corte.** Q1 y las cinco preguntas de abajo están abiertas como **E-157** en `docs/sdd/ENTRADA.md`, con dueño
Gerencia. Si al terminar el lote 2 no hay respuesta **registrada**, el lote 3 **no entra en esta tanda**: los deltas
borrador de `permissions` y `tickets-core` de esta carpeta salen del cambio antes de archivar (no se fusionan ni viajan
al archivo), la cabecera del `proposal.md` pasa a `capacidad: [transitions-st, remisiones]` y el `archive-report.md`
dice que la OVI de garantía queda para un cambio propio.

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
| **1 · Guarda en servidor** | 46: predicado y texto único 16, lectura 10, guarda 12, cuatro líneas en sitio 8 | 83 | 220: predicado 30, RQ-TS-33 130, enfrentamiento con sus divergencias 60 | 100: ayudante 22, 31 puntos × 2 = 62, 8 `import` × 2 = 16 | `tasks.md` 10 | **≈ 376** | 344 |
| **2 · Cliente, aviso y cierre** | 42: `habilitarServicio.ts` 22 (motivo y aviso), `esRemisionConfirmada` 6, `botonRemision.ts` tres líneas en sitio 6, `TransitionPanel.tsx` cuatro líneas en sitio 8 | 76 | 67: `habilitarServicio.test.ts` 55, tabla de `esRemisionConfirmada` 12 | — | consulta SQL 55, correcciones del maestro 30, citas 30, `tasks.md` 8 | **≈ 241** (con el ×1,8) | 479 |
| **3 · OVI (BLOQUEADO)** | ≈ 70 con cuatro entradas y buscadores | 126 | ≈ 230 | por medir | 10 | **≈ 310, a reestimar tras Q1** | ≈ 410 |
| Verify | — | — | — | — | `verify-report.md` 300-360 | **≈ 360**, intento propio | 360 |
| Archive | — | — | — | — | Revisable: fusión de dos deltas ADDED (315 líneas tras la revisión de la planificación: 231 de `transitions-st` y 84 de `remisiones`; **se mide**, no se estima) más `archive-report.md` 110-264 → hipótesis 425-580. Si el lote 3 no entra, la retirada de los dos deltas borrador son 168 líneas borradas, sin carga de revisión, que se anotan aparte. Mudanza ≈ 1.400-1.550 líneas × 2, sin techo (regla del archivo) | **revisable ≤ 800; se mide antes de aplicar** | si pasa, se para y se consulta |

Se toma el mayor de los dos: la enumeración en los lotes 1 y 3, el ×1,8 en el 2. Ningún lote llega a la válvula. Si el lote 1 midiera
más de 720 al cerrar la parte de pruebas existentes, se parte en 1a (predicado, lectura, guarda y pruebas nuevas, con
las 8 suites adaptadas, porque sin ellas la suite queda roja) y 1b (enfrentamiento RQ-RE-20).

**Recalculado en la revisión de la planificación del 2026-10-03.** El lote 1 baja de ≈ 389 a ≈ 376: el predicado pierde
una condición y el `422` un texto (−8 de código), la tabla del predicado se acorta (−10) y el enfrentamiento gana las
filas de divergencia (+5). El lote 2 sube de ≈ 201 a ≈ 241: gana el aviso, el segundo predicado y dos líneas más en
`botonRemision.ts` (+14 de código, +26 de pruebas). Los dos siguen lejos de la válvula. Si el lote 3 no entra en la
tanda, su fila no se ejecuta y el archive fusiona sólo los dos deltas de `transitions-st` y `remisiones`.

## 12. Despliegue

**Qué cambia para el usuario el día que se publica.** Un ticket en `Ticket creado`, `OV asignada` o `Remisión creada`
sin ninguna remisión de entrada no anulada deja de poder habilitarse: el botón aparece desactivado con el motivo, y el
servidor contesta `422`. **Quién queda bloqueado al publicar:** los tickets sin remisión de entrada (o con todas
anuladas), entre ellos los venidos de Zoho que esperan en `OV asignada` y los de «Equipo nuevo» (Q5, E-158, condición
de publicación). **Quién ya no:** los que tienen la remisión de entrada `pendiente` o en `error`; se habilitan, y el
cliente muestra el aviso no bloqueante de «remisión sin confirmar». Lo habilitado desde Zoho no pasa por la aplicación y
la guarda no lo ve.

**El recuento que pide el maestro** (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`), leído entero:

- **Mide el histórico de llegadas**, no los tickets que hoy esperan: cuenta los que ya pasaron por la transición
  (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:31-36`) y si tenían remisión al llegar. Responde a
  lo que el maestro pide contar y sirve tal cual para eso.
- **Su «vigente» es LA MISMA que la de la guarda:** tipo `entrada` y `anulada_at IS NULL`, **sin** filtro de estado
  (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:58-65`; lo dice también su propia cabecera,
  `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:17`). Su cifra `sin_remision_al_llegar` es, con la
  definición a la letra, **lo que la guarda habría bloqueado**, no una cota inferior: la primera versión de este diseño
  decía «cota inferior» porque comparaba contra S-1, que exigía confirmación. Corregido. Queda una salvedad que es de la
  propia consulta y no de la definición: mira `anulada_at` tal como está hoy, no como estaba al llegar
  (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:26-27`). No se edita (está fechada: caso B).
- **No mide la población que queda bloqueada al publicar**, y por eso la segunda consulta **sigue haciendo falta**:
  la del 25/09 parte de quienes ya ejecutaron `habilitar_servicio`; los tickets que HOY están en los tres estados de
  origen todavía no la han ejecutado y no aparecen en ella. Hipótesis: un ticket que ya llegó a `Ingresado` no vuelve a
  un estado de origen, con lo que las dos poblaciones no se solapan; la consulta nueva no depende de que sea cierto.

Por eso el lote 2 escribe una **segunda consulta**, sólo de lectura, en fichero nuevo: tickets que hoy están en los tres
orígenes, por estado, clasificación y `managed_by_app`, repartidos con la definición a la letra en **«sin remisión de
entrada vigente»** (los que quedarán bloqueados), **«con remisión de entrada vigente y alguna confirmada»** y **«con
remisión de entrada vigente y ninguna confirmada»** (se habilitan; verán el aviso). Escribirla es trabajo de la tanda;
**ejecutarla es de persona**:

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Ejecutar las dos consultas contra producción y entregar las cifras | Gerencia | Condición de **publicación**, no de construcción ni de fusión a `main` | Panel y `docs/sdd/ENTRADA.md`; paquete de despliegue de la fecha |
| Responder Q5 (¿alcanza a «Equipo nuevo»?) | Gerencia | Condición de **publicación** | `docs/sdd/ENTRADA.md` → E-158 |
| Comprobar en la aplicación el botón desactivado con el texto único, y el aviso no bloqueante con una remisión sin confirmar | Gerencia | Verificación tras publicar el lote 2 | `archive-report.md` |
| Responder Q1 y las cinco preguntas de §10 | Gerencia, con el Director Técnico | Bloquea el lote 3 | `docs/sdd/ENTRADA.md` → E-157 |

No son tareas de esta tanda y archivar no las da por hechas (regla del ciclo 1).

**Reversión.** Sin migración ni dato nuevo. Revertir el commit de fusión del lote devuelve el comportamiento anterior;
para retirar sólo la guarda basta quitar su llamada de la línea 131. Revertir el lote 1 con el 2 publicado deja el botón
desactivado sin imposición detrás: se revierten en orden inverso.

## 13. Matriz de amenazas

N/A: sin rutas de shell, subprocesos, automatización de VCS, clasificación de ejecutables ni integración de procesos.
El cambio no añade ninguna ruta HTTP.

## 14. Preguntas abiertas

- [ ] **Q1** (qué es «crear la OVI» en Desk) más las cinco de §10: **bloquean el lote 3**; abiertas como **E-157** en
  `docs/sdd/ENTRADA.md`. No bloquean los lotes 1 y 2. Sin respuesta registrada al terminar el lote 2, el lote 3 no
  entra en esta tanda (§10).
- [ ] Q2 (calibración directa): supuesto aplicado, no entra. Revisado y mantenido en la revisión de la planificación
  del 2026-10-03; no es una confirmación de Gerencia.
- [ ] Q3 (retirar el origen `Ticket creado`): supuesto S-4, se conserva. Revisado y mantenido en la misma revisión; no
  es una confirmación de Gerencia. Con la definición a la letra ese origen **tiene uso**: remisión creada y aún sin
  confirmar.
- [x] Q4 («vigente» exige confirmación): **resuelta por la letra**, no por una respuesta nueva de Gerencia. Es la
  aplicación de §7.3 (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`) y del maestro
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`): basta creada y no anulada. S-1,
  retirado.
- [ ] Q5 (alcanza a «Equipo nuevo»): se mantiene S-3. **Condición de publicación**, abierta como **E-158** con dueño
  Gerencia.
- [ ] La decisión `habilitar-servicio-sin-remision` no está registrada en `openspec/config.yaml`: **E-159**.
- [ ] Hallazgo para el orquestador: el delta de `transitions-st` remite a un borrador del lote 3 «en el delta de
  `permissions` y `tickets-core`», y esos dos ficheros **sí existen** en la carpeta del cambio (borrador, bloqueado por Q1).
- [ ] Riesgo aceptado: con el dato de remisiones caduco en pantalla, el botón puede quedar desactivado cuando el
  servidor ya aceptaría; se resuelve al recargar la ficha. Hipótesis: `TicketDetailView.tsx` ya recarga las remisiones
  tras cada cambio de remisión.

## 15. Revisión de la planificación — 2026-10-03

Qué cambió respecto de la primera versión de estos artefactos, y por qué. Nada de esto toca código: el apply no se
había lanzado.

| Qué | Antes | Ahora | Por qué |
|---|---|---|---|
| **S-1** | «Vigente» = entrada, no anulada y con `estado` `ok` u `ok_con_avisos` | **Retirado.** «Vigente» = entrada, creada y no anulada, con cualquier estado de envío | Contradecía la letra de Gerencia («vigente (no anulada)», `docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`; «creada y no anulada», `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`) sin una decisión que lo respaldara, y ataba «Habilitar Servicio» a que n8n responda |
| **D1, D2, §4** | Predicado con tres condiciones; la lectura traía `tipo`, `estado` y `anulada_at` | Predicado con dos condiciones; la lectura trae `tipo` y `anulada_at`. Segundo predicado `esRemisionConfirmada`, sólo para presentación | El estado de envío no entra en el bloqueo, y nada del servidor lo usa |
| **D4** | Dos textos de `422`, el segundo para «remisión sin confirmar» | **Un solo** texto de `422`; el «sin confirmar» pasa a un aviso del cliente, no bloqueante | Sin S-1 una remisión sin confirmar ya no se rechaza. P2 sigue discriminando con un texto |
| **RQ-TS-33** | `pendiente` y `error` no habilitaban (`422`); 26 escenarios | `pendiente` y `error` **habilitan** (`200`); siguen bloqueando sin remisión, sólo anulada(s) y tipo distinto; escenario nuevo del aviso; **27** escenarios | Consecuencia directa de la definición |
| **m3, m4** | m3 aceptar `pendiente` → roja; m4 quitar `ok_con_avisos` del predicado de bloqueo → roja | m3 **reintroduce** el filtro de estado y debe poner roja «`pendiente` habilita»; m4 pasa al lote 2, sobre `esRemisionConfirmada`. Nuevas d1 y d2, sobre el recuento | Las mutaciones vigilan la definición vigente; m3 es ahora la que impide que S-1 vuelva sin decisión |
| **Regla 13 (§7)** | Una decisión nueva del cliente: desactivar el botón | Dos: desactivar el botón (con imposición probada) y el aviso de «sin confirmar», que es **presentación sin imposición**, y se dice así. `botonRemision.ts`: la línea 33 consume «vigente», la 39 consume «confirmada», la 34 se queda | El aviso no es un espejo; la línea 33 es letra por letra el predicado nuevo, no la 39 |
| **D5 / RQ-RE-20** | La guarda y el recuento debían **coincidir** en todos los casos de entrada; única divergencia, `tipo`; 5 escenarios | Divergen **a propósito** en `estado` y siguen divergiendo en `tipo`; la prueba **afirma** las dos divergencias, fila a fila; **6** escenarios | El estado `Remisión creada` se deriva sólo de confirmadas (RQ-TS-03, `apps/desk/server/db/estadoPorRemision.ts:43-47`) y este cambio no lo toca. Un ticket en `Ticket creado` con una remisión `pendiente` se habilita desde ahí: **consecuencia declarada, no defecto** |
| **Q3, nota** | «Con S-1 el origen `Ticket creado` queda en la práctica sin uso» | Ese origen **sí tiene uso**: remisión creada y aún sin confirmar | La nota dependía de S-1 |
| **§12** | La consulta del 25/09 daba una «cota inferior» | Mide **lo mismo** que la guarda. La segunda consulta se mantiene (la del 25/09 mide llegadas históricas, no los tickets que hoy esperan) y se reparte con la definición nueva. La lista de bloqueados al publicar pierde «remisión `pendiente` o en `error`» | La consulta nunca filtró por estado; la comparación era contra S-1 |
| **Preguntas** | Q4 y Q5 «a confirmar antes de publicar» | Q4 resuelta por la letra (no es una respuesta nueva de Gerencia). Q2 y Q3, supuestos revisados y mantenidos. Q5, condición de publicación (E-158). Q1 y las de OVI, E-157. E-159: decisión sin registrar en `openspec/config.yaml` | Cada pregunta abierta queda con dueño y con su entrada en la bandeja |
| **Lote 3** | «Se replanifica cuando llegue la respuesta» | Sin respuesta registrada al terminar el lote 2, **no entra en esta tanda**; los deltas borrador de `permissions` y `tickets-core` salen del cambio antes de archivar y la cabecera pasa a `capacidad: [transitions-st, remisiones]` | Para que el cambio pueda cerrarse sin depender de una respuesta que no tiene fecha |
| **Ayudante de pruebas** | Insertaba una remisión «confirmada» porque era lo único que habilitaba | Sigue insertando `ok`, ahora por decisión razonada (§5): una `ok` a mano no mueve el estado, y una `pendiente` rompería la puerta 3 de `ovAsociaciones.test.ts` | Cualquier estado habilita; había que elegir |
| **Presupuesto (§11)** | Lote 1 ≈ 389, lote 2 ≈ 201 | Lote 1 ≈ 376, lote 2 ≈ 241 | Un texto y una condición menos en el lote 1; aviso y segundo predicado en el lote 2 |
