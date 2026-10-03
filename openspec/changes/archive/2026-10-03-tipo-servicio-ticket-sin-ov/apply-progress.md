# apply-progress: tipo-servicio-ticket-sin-ov (F1B-03, parte L)

**Lote 1 · tareas 1.1-1.46: 46/46. Lote 2 · tareas 2.1-2.19: 19/19 (sección al final).** Modo: Strict TDD. Worktree `tipo-servicio-ticket-sin-ov`, partida del lote 1 `a77ec68`. Lote 3 bloqueado y fuera de la tanda (2.18). Línea base: `npm test` 2543 pasan, 1 roja (la de 1.2), 2 omitidas; typecheck limpio; lint 165 avisos, 0 errores. Cierre: `npm test` 2611 pasan, 0 rojas, 2 omitidas (178 ficheros, +1); typecheck limpio; lint 165, 0 errores.

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED (capturado) | GREEN | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2 | `reconciliacion/registro.test.ts:218-220` | Unidad | 22/23 (la roja es la tarea) | F1B-03 aparece «en curso»: Expected sin `F1B-03`, Received con él | 23/23, en sitio | ➖ misma línea | ➖ |
| 1.3-1.5 | `shared/src/remision.test.ts` | Unidad | 11/11 | 24 de 35 rojas: `esRemisionEntradaVigente is not a function` | 35/35 | ✅ 6 estados × 3 tipos de fila; 6 casos del texto | ➖ |
| 1.6 | (ayudante, sin prueba propia; lo ejercen 1.7-1.34) | — | N/A (nuevo) | N/A | ejercido | ➖ | ➖ |
| 1.7-1.12 | `services/ticketService.test.ts`, bloque RQ-TS-33 | Integración (pg-mem) | 125/125 | 16 rojas de 142 con la guarda ausente (sin remisión → 200 en vez de 422; anuladas, tipo distinto, motivo, equipo nuevo, espía de control) | 142/142 | ✅ 3 orígenes, 9 filas sucias, equipo nuevo, 3 espías | ➖ |
| 1.13-1.19 | ídem (P1 a P7) | Integración | ídem | P3, P4, P5 rojas con la guarda ausente; P1, P2, P6, P7 nacen verdes (su rojo es 1.35, 1.36, 1.40, 1.41) | verde | ✅ cada una activa dos guardas | ➖ |
| 1.20-1.21 | `db/remisionVigente.test.ts` (nuevo) | Integración | N/A (nuevo) | 10 rojas de 11: `vigenciaDeRemisiones is not a function`; la de `listRemisionesByTicket` nace verde | 11/11 | ✅ 5 coincidencias, 2 de `estado`, 1 de `tipo` | ➖ |
| 1.22-1.23 | (producción; lo cubren 1.3-1.21) | — | suite verde antes de la guarda (salvo 1.2) | las 16 rojas de 1.7-1.19 y las 10 de 1.20 | verde | ➖ | ➖ |
| 1.24-1.34 | las 8 suites adaptadas | Integración | verdes antes de la guarda | con la guarda: 15 rojas en `ticketService`, 11 en `transiciones`, 4 en `ordenVentaUnTicket` | `ticketService` 142/142; `transiciones` 26/26; `ordenVentaUnTicket` 10/10; las otras 5, 120/120 | ✅ controles de 1.33 y 1.34 | ➖ |
| 1.35-1.43 | mutaciones | — | verde | cada mutación en rojo: ver abajo | revertidas, `cmp` idéntico | — | — |

**Rojos de 1.33 y 1.34 (control):** sin la remisión de la línea 16, 6 de 26 en `transiciones.test.ts` (entre ellas «rechaza derivar a alguien que no existe…», por el texto de la persona que falta). Sin la de `:927`, roja «POSICIÓN habilitar_servicio: la OV en cuarentena YA está en otro ticket».

## Mutaciones (todas reproducidas, revertidas con `cmp` contra el GREEN; `git diff` de `estadoPorRemision.ts` vacío)

| Mutación | Movimiento | Roja |
|---|---|---|
| m1 | quitar `r.tipo === 'entrada' &&` | 7: «tipo distinto» ×6 y `motivoSinRemisionVigente` «sólo de tipo distinto» |
| m2 | quitar `!r.anuladaAt` | 7: «entrada ANULADA» ×6 y «sólo anuladas» |
| m3 | filtro de estado `ok`/`ok_con_avisos` | 6 en `remision.test.ts`; con servidor y RQ-RE-20, 40 en total (los `200` todas: la lectura no trae `estado`) |
| P1 | llamada antes del `if` de la 129 | P1, P2 y 5 de F1B-15 (RQ-TS-32) |
| P2 | intercambiar las dos llamadas | P2 y 4 de F1B-15 |
| P3, P4 | llamada detrás de la 134 | P3 y P4 (misma mutación; P4 no añade discriminación); P5 verde |
| P5 | llamada detrás de la 152 | P3, P4 y P5 |
| P6 | al final de la 125 | P6, P1, P2 y 5 de F1B-15; P7 verde |
| P7 | entre el `404` y `exigirMismoFlujo` | P7, P6, P1, P2 y 5 de F1B-15 |
| m5 | quitar la salida temprana | 16: espías de `ingreso_a_servicio` y «Soporte remoto», más 14 transiciones que reciben el `422` |
| d1 | quitar `estado` del recuento | 2: filas `pendiente` y `error` |
| d2 | `AND tipo = 'entrada'` en el recuento | 1: fila `tipo` distinto |
| 1.21 | `AND estado <> 'error'` en `listRemisionesByTicket` (línea 77) | 1: «listRemisionesByTicket devuelve las no anuladas de cualquier estado» |

## Hipótesis comprobadas

- **(a)** `ovAsociaciones.test.ts` con la `ok` en `ovLiberada`: 45/45 verdes, la puerta 3 contesta `201`. Con una `pendiente` en su lugar: 3 rojas (puerta 3 y dos de transacciones, `409`). Confirma la razón del `ok` por omisión.
- **(b)** `transiciones.test.ts:201-204`: borrar `remisiones` ENTRE la primera y la segunda transición deja la prueba verde. Matiz: quitarla del ticket desde el principio no se puede, la primera transición (`habilitar_servicio`) la exige.

## Hallazgos y desviaciones

1. **El mutante equivalente del diseño está mal descrito.** Mover sólo la guarda delante de cargo, prioridad o verificación (dentro de la 131) la deja delante de `exigirAltaValidada` y **P2 se pone roja** (5 rojas). El equivalente real es mover **el par** `exigirAltaValidada` + `exigirRemisionVigente` delante de cargo: 251/251 verdes en las seis suites que llegan. Sigue declarado.
2. Las mutaciones de posición ponen rojas, además de la propia, las 5 pruebas de F1B-15 (RQ-TS-32) sin remisión: son colaterales, no defecto.
3. 1.12 y los espías (1.11): `ingreso_a_servicio` pide `Código Servicio`, `Fecha creación ticket` y `Fecha Remisión Entrada`; el espía lo usa con control de población (`habilitar_servicio` ejecuta la lectura nueva una vez).
4. Suites con extremos de línea mixtos (`transiciones.test.ts`): las ediciones se hacen antes del CR. Medido con `git diff`: sólo hunks en sitio o al final.
5. 1.21: el SQL de `listRemisionesByTicket` está en la línea 77 (dentro de 76-79).

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run packages/shared/src/remision.test.ts apps/desk/server/services/ticketService.test.ts apps/desk/server/db/remisionVigente.test.ts`: 188 pasan |
| Arnés real | `POST /api/tickets/:id/transition` contra pg-mem: `permisos`, `cargoPermiso`, `transicionesEjecucion`, `flujoEquipoNuevo`, `ovAsociaciones`, `transiciones`, `ordenVentaUnTicket`: 120 + 26 + 10 verdes |
| Frontera de reversión | `git revert` del lote; sólo la guarda: quitar `; await exigirRemisionVigente(db, t, id)` de la línea 131 |

---

# Lote 2 · tareas 2.1-2.19: 19/19

Modo: Strict TDD. Partida del intento: `6dbae98` (cierre del lote 1). Línea base (2.1): `npm test` 2611 pasan, 0 rojas, 2 omitidas (178 ficheros); typecheck limpio; lint 165 avisos, 0 errores. Cierre: `npm test` 2632 pasan (+21), 0 rojas, 2 omitidas (178 ficheros pasan y 1 omitido); typecheck limpio; lint 165 avisos, 0 errores; `npm run build` ✓.

**Nota sobre una pasada roja que NO era defecto:** una primera ejecución de `npm test` lanzada en paralelo con `typecheck` y `lint` dio 5 rojas y 2 errores por carga (769 s frente a 118 s); repetida sola, 2632 verdes. Se anota para que nadie la corra a la vez con las otras.

## TDD Cycle Evidence (lote 2)

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED (capturado) | GREEN | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.3 (tabla) | `packages/shared/src/remision.test.ts`, al final | Unidad | 35/35 | 6 rojas de 41: `TypeError: esRemisionConfirmada is not a function` | 41/41 | ✅ 6 estados (`ok`, `ok_con_avisos`, `pendiente`, `error`, desconocido, vacío) | ➖ |
| 2.2, 2.3 | `apps/desk/src/lib/habilitarServicio.test.ts` (nuevo) | Unidad | N/A (nuevo) | la suite no carga: módulo `./habilitarServicio` inexistente | 13/14 (la 14.ª es 2.4) | ✅ 6 de `motivoNoHabilitar`, 6 del aviso | ➖ |
| 2.4 | ídem, bloque «el cliente no redefine…» | Estructural | N/A | con `habilitarServicio.ts` creado y `botonRemision.ts` sin tocar: `AssertionError: expected 'import type { Remision } from …' to match /esRemisionEntradaVigente\|motivoSinRemisionVigente/` | 14/14 tras 2.7 | ✅ dos ficheros | ➖ |
| 2.5 | (producción; lo cubren 2.2-2.4) | — | — | las del renglón anterior | verde | ➖ | ➖ |
| 2.7 | `apps/desk/src/lib/botonRemision.test.ts` | Unidad | 7/7 | las 7 siguen verdes sin tocarlas; la mutación `vigentes.some(() => true)` NO ponía roja ninguna: se añade al final una prueba (`error` vigente no es confirmada) → roja con el mutante: `expected { visible: false … } to deeply equal { visible: true … }` | 8/8 | ✅ | ➖ |
| 2.8 | `TransitionPanel.tsx` (`.tsx`, fuera de la red, F0-00) | — | — | N/A: sin rojo previo por decisión de Gerencia | `typecheck` limpio, `npm run build` ✓ | ➖ | ➖ |

## Mutaciones del lote 2 (2.6, 2.7): todas reproducidas y revertidas (`cmp` contra copia previa: idénticas)

| Mutación | Movimiento | Roja |
|---|---|---|
| orden invertido | primero remisión, luego alta | 1: «con alta pendiente y sin remisión devuelve el de alta primero» |
| nulo | `motivoSinRemisionVigente(remisiones ?? [])` | 1: «con las remisiones sin cargar … no bloquea: decide el servidor» |
| el aviso bloquea | `motivoNoHabilitar` devuelve el aviso con una vigente | 1: «con una vigente en CUALQUIER estado no bloquea…» |
| avisa con confirmada | quitar `\|\| vigentes.some(esRemisionConfirmada)` | 3: «una pendiente y otra ok», «ok_con_avisos», «pendiente anulada junto a ok» |
| m4 | quitar `ok_con_avisos` de `esRemisionConfirmada` | 2: su fila de la tabla y «vigente en ok_con_avisos: sin aviso» |
| botón: vigente | `.filter(() => true)` (línea 33) | 1: «una remisión anulada no cuenta» (ya la caza una de las siete) |
| botón: confirmada | `vigentes.some(() => true)` (línea 39) | **ninguna de las siete**: declarado; prueba nueva al final → roja |

## Casilla de la regla 13 (2.11) — por escrito, decisión a decisión, contra el árbol de hoy

Guarda: `exigirRemisionVigente` (`apps/desk/server/services/ticketService.ts:273-277`), llamada en `apps/desk/server/services/ticketService.ts:131`, detrás de `exigirAltaValidada` (`:258-264`). Área y cargo: `:129-131` (el `403` de área, `:129-130`; el de cargo, en la propia `:131`).

| Decisión del cliente (línea del cliente) | Línea del servidor que la impone | Veredicto |
|---|---|---|
| Desactivar «Habilitar Servicio» sin remisión de entrada vigente (`TransitionPanel.tsx:70`, `:130`, vía `motivoNoHabilitar`) | `apps/desk/server/services/ticketService.ts:131` → `:273-277`: `422` con el mismo texto; lo prueba el bloque RQ-TS-33 de `ticketService.test.ts` (1.7-1.19) | Espejo legítimo (punto 3): imposición probada |
| Qué es «vigente» (`habilitarServicio.ts`, `botonRemision.ts:33`) | No decide: consume `esRemisionEntradaVigente` / `motivoSinRemisionVigente` de `packages/shared/src/remision.ts`; el servidor llama a las mismas (`ticketService.ts:275`) | Punto 1: la misma función en las dos orillas; la vigila la prueba estructural 2.4 |
| **Avisar «remisión sin confirmar» sin desactivar el botón** (`TransitionPanel.tsx:70`, `:137`, vía `avisoRemisionSinConfirmar`) | **NINGUNA, y no la necesita.** El servidor habilita igual con la remisión `pendiente` o en `error` (`ticketService.ts:273-277` no mira `estado`; `vigenciaDeRemisiones` no lo lee, `apps/desk/server/db/remisiones.ts:237`). Probado por «`pendiente` habilita» y «`error` habilita» | **Presentación sin imposición.** No es espejo de ninguna guarda: un aviso de más o de menos no cambia lo que el servidor permite |
| Qué es «confirmada» (aviso y `botonRemision.ts:39`) | No decide: consume `esRemisionConfirmada` (`packages/shared/src/remision.ts`). Es la misma noción que cuenta el recuento de `Remisión creada` (`apps/desk/server/db/estadoPorRemision.ts:43-47`, en SQL, no reescrito): dos implementaciones, declaradas y enfrentadas por `remisionVigente.test.ts` (RQ-RE-20) | Sin guarda que la use |
| Qué remisiones mira «Crear remisión» (`botonRemision.ts:33`) | Antes copia de «vigente»; ahora consume el predicado compartido (punto 1). Sin cambio de comportamiento | — |
| **No ofrecer «Crear remisión» con una ya confirmada** (`botonRemision.ts:39`) | **NINGUNA, y ya era así.** El servidor sólo rechaza una segunda remisión con una `pendiente` (`apps/desk/server/routes/remision.ts:174-183`, el `409` de la 177), no con una confirmada | **Presentación mientras la pantalla refresca; no es una regla ni un espejo.** Este cambio sólo sustituye la condición por `esRemisionConfirmada` |
| Reetiquetar el botón con una `pendiente` (`botonRemision.ts:34`, sin tocar) | `apps/desk/server/routes/remision.ts:174-183` | Imposición vecina existente |
| Mostrar primero el motivo de alta y luego el de remisión (`habilitarServicio.ts`, `motivoNoHabilitar`) | El orden de las dos llamadas de la misma línea 131 del servidor, fijado por P2 (`ticketService.test.ts`, bloque RQ-TS-33) | Probado |
| Con las remisiones sin cargar, botón activo y sin aviso (`TicketDetailView.tsx:339` pasa `null`) | No es decisión: se abstiene y contesta el servidor (`ticketService.ts:131`) | — |
| Desactivar con alta pendiente (`TransitionPanel.tsx:70`, `motivoAlta`) | `exigirAltaValidada`, `apps/desk/server/services/ticketService.ts:258-264`; sin cambios | F1B-15 |
| Ofrecer sólo transiciones del área y cargo (`TransitionPanel.tsx:56-58`) | `apps/desk/server/services/ticketService.ts:129-131`; sin cambios | Espejo probado (IV-3 cerrado) |
| Texto del motivo, `title` y texto del aviso | Presentación. El del motivo es el del servidor (misma función); el del aviso es sólo del cliente | — |

## Barrido de citas (regla de mutación 4) — 2.12 a 2.15

- **Comprobación de que no hay desplazamientos** (`git diff -U0 a77ec68 -- <fichero>` por cada fichero existente tocado): sólo hunks en sitio (una línea por una) o añadidos al final. Ficheros con hunks: los 8 de pruebas del lote 1, `ticketService.ts` (5, 6, 131 en sitio; +13 al final), `remisiones.ts` (3 en sitio; +10 al final), `remision.ts` de shared (+34 al final), `remision.test.ts` (2 en sitio; +65 al final), `botonRemision.ts` (2, 33, 39 en sitio), `botonRemision.test.ts` (+7 al final), `TransitionPanel.tsx` (8, 70, 130, 137 en sitio), `registro.test.ts` (218, 220 en sitio). **Cero desplazamientos.** Única excepción de líneas: `design.md` de este cambio gana 3 líneas (corrección del mutante equivalente) tras la 265; nada lo cita con línea (`grep` vacío).
- **`grep` exacto del diseño §9, sobre todo el repositorio sin excluir `openspec/changes/archive/`:** 2.177 citas. Se filtraron las que caen sobre una línea editada en sitio: **174**. Resultado:
  - **Vivas (25): todas siguen diciendo lo mismo, caso A sin cambio.** Las de `ticketService.ts:131`/`:129-131`/`:125-131`/`:114-223` afirman el `403` de área, el `403` de cargo, la prioridad o el orden de la cadena: la línea 131 sigue conteniendo el cargo y la prioridad (la guarda nueva es una llamada más en esa línea). Las de `permisos.test.ts:41-110`/`:89-109` afirman que el barrido de 34 × 3 contra el servidor existe: sigue siendo cierto con la edición en sitio de las líneas 55 y 101. `botonRemision.ts:2` (baseline F0-00) afirma que importa `puedeCrearRemisionDeEntrada` de shared: sigue siendo cierto.
  - **Archivadas y paquetes de despliegue fechados (118):** registros fechados, caso B por naturaleza (ciertos en su revisión); la línea existe y no está vacía. Sin tocar.
  - **De este mismo cambio (31 citas): 17 caso B reparado con revisión nombrada** (`en a77ec68`) —las que describen el estado ANTERIOR—: `botonRemision.ts:33` y `:39` (`design.md:13,15`; `proposal.md:72,73,79,138,139`; `specs/remisiones/spec.md:16`; `tasks.md:87` ×2), `ticketService.ts:114-223` (`proposal.md:25`, `exploration.md:44`) y las líneas de prueba endurecidas (`transiciones.test.ts:230-234`/`:233-234` y `ticketService.test.ts:929-930`: `design.md:165,166`; `tasks.md:67,68`). Las otras 14 describen el estado nuevo (`ticketService.ts:131` como llamada de la guarda, `:5`, `:6`, `remisiones.ts:3`, `:129-131`, etc.) o no cambian de sentido: caso A.
  - La frase «última guarda de B» / «tras `exigirAltaValidada` van los obligatorios» **no existe** en ningún documento vivo (`grep` sólo la halla en el `design.md` §9 de este cambio, que la cita como ejemplo), y el comentario de la línea 254 de `ticketService.ts` dice «antes de los obligatorios (`:131`)», que sigue siendo cierto.
- **Pase de abreviadas (2.13)** en `CLAUDE.md`, `openspec/config.yaml`, las cuatro specs vivas y los comentarios de `ticketService.ts`: las abreviadas `` `:131` ``, `` `:129-131` ``, `` `:33` ``, `` `:39` ``, `` `:70` ``, `` `:130` ``, `` `:137` `` y `` `:2` `` que aparecen son de OTROS ficheros (`transitionExec.ts`, `design H2`, `repo.ts`, el `ticketService.ts:39` del `clientId`…) o repiten lo que sigue siendo cierto (`:129-131` = área y cargo). **Cero reparaciones.** Hallazgo: tres ficheros archivados citan `registro.test.ts:218-220`/`:220` hablando de «seis en curso»; las ediciones del lote 1 los dejan como registro fechado (caso B natural, intactos).
- **Detector (2.15):** ver el informe de cierre en la respuesta del apply.

## 2.18 · Corte del lote 3

Comprobado en `openspec/config.yaml` (`decisiones_de_gerencia` y `decisiones_de_gerencia_adenda`; última clave `decision/cuarta-tanda-f1b03-parte-l`, `:3727`) y en `docs/sdd/ENTRADA.md`: **NO consta respuesta registrada a Q1.** La única decisión sobre la OVI es `decision/ovi-garantia-autor` (`openspec/config.yaml:1543`), que dice QUIÉN la crea (Director Técnico), no QUÉ es crearla en Desk. E-157 existe en `main` como **ABIERTA** y no en este worktree, que parte de `5f68822`. **El lote 3 NO entra en esta tanda.** Pendiente para el archive (instrucciones de `tasks.md`): retirar `specs/permissions/spec.md` y `specs/tickets-core/spec.md` (deltas borrador) y pasar la cabecera de `proposal.md` a `capacidad: [transitions-st, remisiones]`. No se hace aquí.

## Hallazgos y desviaciones (lote 2)

1. **Corrección documental hecha:** el «mutante equivalente» de `design.md` §8 y de la tarea 1.12 decía que mover la guarda sola dentro de la línea 131 no lo caza nada; medido en el lote 1, mover SÓLO `exigirRemisionVigente` la deja delante de `exigirAltaValidada` y P2 se pone roja; el equivalente real es mover EL PAR (251/251 verdes). Corregido en los dos sitios.
2. **Prueba añadida que el diseño no listaba (2.7, prevista en la tarea):** `botonRemision.test.ts`, al final, «con una remisión en error sigue ofreciendo crear otra»; la mutación sobre la línea 39 no ponía roja ninguna de las siete.
3. `TransitionPanel.tsx:70`: las dos constantes nuevas (`motivoBloqueo`, `avisoSinConfirmar`) se insertan ANTES del comentario `// F1B-15…` que cierra esa línea (si no, quedarían dentro del comentario).
4. `TransitionPanel.tsx:137`: el aviso se pinta con el mismo color ámbar que el motivo y sólo con el botón activo (`habilita && !motivoBloqueo && avisoSinConfirmar`).
5. `F0-01_Correcciones_para_el_maestro.md`: entrada 20 al FINAL del fichero (tras «Qué NO contiene»), para no desplazar nada; ninguna cita viva apunta a líneas ≥ 1100 de ese fichero (`grep` vacío). Usa la R08.4 como copia citable.
6. La consulta SQL nueva no se ha podido ejecutar aquí (sin `psql` ni `DATABASE_URL`): sólo se escribe; ejecutarla es de persona.
7. Una lectura de sólo consulta (`git grep` de E-157) se hizo contra el árbol principal para la tarea 2.18; no se escribió nada fuera del worktree.

## Work Unit Evidence (lote 2)

| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run packages/shared/src/remision.test.ts apps/desk/src/lib/habilitarServicio.test.ts apps/desk/src/lib/botonRemision.test.ts`: 3 ficheros, 63 pasan |
| Arnés real | `npm run build` ✓. Comprobación de persona en la app (`.tsx` fuera de la red, F0-00): pendiente de realizar tras publicar. Comportamiento esperado: botón desactivado con el texto único sin remisión; activo con aviso con una `pendiente`; sin aviso con la confirmada. |
| Frontera de reversión | `git revert` del lote 2, **antes** que el 1 si ambos están publicados |
