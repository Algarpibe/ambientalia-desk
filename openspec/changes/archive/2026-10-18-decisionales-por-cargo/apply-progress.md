# Progreso de aplicación — `decisionales-por-cargo` (F1C-05, `cierra: no`)

`strict_tdd` activo. Cada verde lleva delante su rojo, visto en la terminal; las salidas son las de vitest, recortadas.

## Lote 1 — packages/shared y el interruptor (intento 3, desde `3c691e0`)

**Línea base (1.1):** `npx vitest run packages/shared packages/zoho-sync/src/config.test.ts` → 56 ficheros, 1.497 pruebas en
verde; `npm run typecheck` → 0; `npx eslint .` → 0 errores, 165 avisos.

| Tarea | Rojo | Verde |
|---|---|---|
| 1.2 → 1.3 regla pura (RQ-PM-29) | `decisionales.test.ts`: `Error: Cannot find module './decisionales'` · 1 fichero fallido, sin pruebas | `packages/shared/src/decisionales.ts` y `export * from './decisionales'` al final de `index.ts` → 18 pruebas en verde |
| 1.4 → 1.5 interruptor (RQ-PM-28) | `config.test.ts`: `AssertionError: expected undefined to be false` · 1 fallida, 11 en verde | `config.ts`: la interfaz en la línea 66 (sin desplazar) y la carga tras `:123` → 12 en verde |

**Refuerzo antes de mutar.** Al preparar M6 se vio que quitar la exclusión de la lista corta sobrevivía: el `Coordinador
Comercial` ya estaba entre los permitidos de Comercial y la compuesta lo seguía rechazando por la lista corta. Se añadió la
aserción que discrimina —un Comercial **sin cargo** en `liberacion_sin_factura`: la regla nueva no la reclama—, y M6a pasó a rojo.

**Mutaciones (1.6)**, con `herramientas/mut.mjs` (aplica, corre, restaura y comprueba; `restaurado=true` en las nueve):

| Id | Mutación | Resultado |
|---|---|---|
| M1a | `=== 'true'` → `!== 'false'` | ROJO, 1 fallida (`config.test.ts`) |
| M1b | `?.trim().toLowerCase() === 'true'` | ROJO, 1 fallida |
| M3 | `Técnico` en la lista técnica | ROJO, 3 fallidas |
| M4a | vacante siempre `true` | ROJO, 3 fallidas (Especialista con Coordinador activo) |
| M4b | vacante siempre `false` | ROJO, 3 fallidas (Especialista sin Coordinador) |
| M5a | `rechazo_revision` → Comercial | ROJO, 5 fallidas |
| M5b | `rechazo_garantia` fuera de la tabla (cae a `Comercial / Compras`) | ROJO, 4 fallidas |
| M6a | la regla nueva reclama la lista corta | ROJO, 1 fallida |
| M6b | además, la compuesta sin `puedeEjecutarTransicion` | ROJO, 2 fallidas |

**Guarda de citas.** `config.ts` +2 −1: la línea 66 cambia en su sitio y la carga entra tras `:123`; sólo se mueven las dos
últimas líneas del fichero, que nadie cita. `index.ts` y `config.test.ts` sólo crecen al final. `cargos.ts` no se toca.

## Lote 2 — servidor, ruta, cliente y DEPLOY.md (intento 4, desde `015a874`)

| Tarea | Rojo | Verde |
|---|---|---|
| 2.1 → 2.2/2.3 servidor y ruta (RQ-PM-28, -30, -31) | `decisionalesPorCargo.test.ts`: 8 fallidas, 8 en verde. Fallan el `403` de Decisionales (Técnico, Especialista con Coordinador activo, mixtas), el «no consulta» y las tres de la ruta (`404`) | `services/decisionales.ts`, la guarda en `ticketService.ts:131`, los imports en `:6`/`:7`, `routes/permisosDecisionales.ts` y su registro en `app.ts:61` → 16 en verde |

**La caracterización apagada, en verde desde el principio, como debe:** un Técnico ejecuta `escalado_a_revision` y el
ticket pasa a `Notificado`. Su primer intento cayó por otra guarda —el cuerpo llevaba `priority` y un Técnico no puede
cambiarla (F1B-07: «La prioridad del ticket la ajustan el Director Comercial o el Director Técnico»)—; se quitó `priority`,
que es opcional, y se anota en la prueba. Las verdes del rojo inicial que no son caracterización —Director Técnico,
administrador, Especialista sin Coordinador y las cinco de posición— pasan hoy porque la regla no existe; lo que las hace
discriminar son las mutaciones de abajo.

**Mutaciones (2.6)** contra `decisionalesPorCargo.test.ts`, con `herramientas/mut.mjs` (`restaurado=true` en todas):

| Id | Mutación | Resultado |
|---|---|---|
| M2 | la guarda ignora el interruptor (`true ?`) | ROJO, 2 (caracterización apagada y «no consulta») |
| M2b | el contexto consulta aunque esté apagado | ROJO, 2 («no consulta» y la ruta apagada) |
| M3 | `Técnico` en la lista técnica | ROJO, 1 |
| M4a | vacante siempre | ROJO, 2 (Especialista con Coordinador activo y la ruta) |
| M4b | nunca vacante | ROJO, 3 |
| M5a | `rechazo_revision` → Comercial | ROJO, 1 (mixtas) |
| M6 | se quita el `403` de cargo de la lista corta | ROJO, 2 (sin cargo y Coordinador Comercial en `liberacion_sin_factura`) |
| M7a | guarda nueva delante del `409` de estado | ROJO, 2 |
| M7b | guarda nueva delante del `403` de área | ROJO, 1 |
| M7c | guarda nueva delante del `403` de cargo de la lista corta | **SOBREVIVE — mutación equivalente** |
| M8 | guarda nueva detrás del `422` de derivación (`ticketService.ts:141`) | ROJO, 1 |
| M6a+M7c | sin la exclusión de la lista corta y con la guarda delante del cargo | ROJO, 1 |
| M6a (servidor) | sin la exclusión, guarda en su sitio | sobrevive en el servidor (la caza `decisionales.test.ts`, lote 1) |

**Por qué M7c es equivalente, y qué la fija.** La regla nueva no reclama las transiciones de la lista corta
(`cargosQueFaltanParaDecisional` devuelve `null` para ellas), así que el `403` de cargo y el de Decisionales **nunca se
activan en la misma petición**: ningún cuerpo distingue su orden. Lo observable es la consecuencia —en `liberacion_sin_factura`
manda el mensaje de hoy, que nombra sólo al Director Comercial— y eso sí lo fija la prueba: si alguien quita la exclusión,
el orden pasa a importar y M6a+M7c se pone roja. Con la exclusión en su sitio, M6a sola sobrevive en el servidor porque el
`403` de cargo, más estricto, va antes; la caza la prueba pura del lote 1.

**Cliente (2.4).** `getContextoDecisionales` al final de `apps/desk/src/api/client.ts`; en `TransitionPanel.tsx` el estado y
el `useEffect` en la línea 55, el filtro en la 57 y los imports en la 3 y la 8. Sin prueba: `.tsx` fuera de la red por
decisión de Gerencia (F0-00); lo comprueba `npm run typecheck`.

**Regla 13 — decisiones del cliente, línea a línea (regla de mutación 3):**

| Decisión del cliente | Línea del servidor que la impone | Prueba |
|---|---|---|
| Ocultar una Decisional a quien no tiene el cargo de su área (encendido) | `apps/desk/server/services/ticketService.ts:131`, el `403` de Decisionales | `decisionalesPorCargo.test.ts`, «un Técnico recibe 403…», M2, M3 |
| Mostrarla al Especialista técnico sólo con el Coordinador vacante | `ticketService.ts:131` con `contextoDecisionales` (`apps/desk/server/services/decisionales.ts:10-13`) | las dos del Especialista, M4a, M4b |
| Saber si el interruptor está encendido y si el Coordinador está vacante | `apps/desk/server/routes/permisosDecisionales.ts:16-17`, que llama a la misma `contextoDecisionales` | las tres de la ruta, M2b, M4a |
| Si la ruta falla, no filtrar (contexto apagado) | `ticketService.ts:131`: el `403` sigue mandando | — (comodidad; la guarda está probada) |
| Ocultar `liberacion_sin_factura` a quien no es Director Comercial | `ticketService.ts:131`, el `403` de cargo (RQ-PM-17, sin cambio) | «la lista corta no se relaja», M6 |

Las cinco tienen línea en el servidor: el filtro del panel es comodidad legítima (regla invariable 13, punto 3).

**Guarda de citas (2.7).** `git diff --numstat`: `ticketService.ts` 3/3, `app.ts` 2/2, `appHarness.ts` 2/2 y
`TransitionPanel.tsx` 4/4 —ninguna línea se mueve—; `client.ts` y `DEPLOY.md` sólo crecen al final. Barrido de
`config.ts:12[4-9]` en todo el árbol: una sola cita, la nueva de `DEPLOY.md` §15, correcta.

**Paquete del cliente (2.8).** `index-a-eCb2uc.js` 419.482 bytes → `index-BOdjeBia.js` 420.931: **+1.449**, por la regla
compartida y la llamada nueva que viajan al cliente.

**Migración:** ninguna (`cargo_permiso` ya existe, RQ-PM-13).
