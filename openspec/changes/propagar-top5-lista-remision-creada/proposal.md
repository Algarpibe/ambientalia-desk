---
tanda: F1B-07
motivo: ""
capacidad: [tickets-core, vistas-tablero, zoho-sync]
maestro: ["M1.9.1"]
cierra: no
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — Propagar el Top 5 a los tickets abiertos y lista de «Remisión creada» para Comercial

Ampliación de F1B-07 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87`, `:174`, `:213`).
Exploración: `exploration.md` de esta carpeta. Citas comprobadas contra el worktree el 2026-10-04.

*Sobre la cabecera:* `zoho-sync` entra porque cambia lo que el sincronizador respeta (RQ-ZS-01). `toca_maestro: si`
porque el maestro vigente sólo habla de la prioridad **al nacer** (`R08.4.md:1973`) y la decisión que se construye
tiene `maestro_revision: "pendiente"` (`openspec/config.yaml:3400`).

## 1 · Intención

Gerencia, `decision/cola-del-taller-los-tres-cabos`, `respuesta_textual` (`openspec/config.yaml:3387-3388`):

> «(3) Se cambia. Al marcar un cliente como Top 5, sus tickets abiertos toman la nueva prioridad, cada uno con su
> traza; al desmarcarlo, vuelven a la prioridad calculada. En ningún caso se tocan los tickets con un ajuste manual
> con motivo, que mantienen el suyo.
> (4) Se construye. La lista de equipos en «Remisión creada» para Comercial se ordena por el tiempo transcurrido
> desde que el ticket entró en ese estado, que es el mismo reloj de la alarma de 3 días hábiles. Va antes del corte
> del 14/12.»

Hoy ocurre lo contrario de (3): el `PUT` del cliente sólo escribe `public.cliente_prioridad`
(`apps/desk/server/db/prioridadCliente.ts:57-65`) y dos pruebas lo fijan
(`apps/desk/server/prioridadTop5.test.ts:179-194`). De (4) no existe nada: ni consulta, ni vista.

## 2 · Alcance

### Dentro

1. **Marca de fila para la prioridad frente al sincronizador** (D-1, §4).
2. **Propagación** al marcar un cliente Top 5 o cambiar su prioridad: cada ticket abierto del cliente sin ajuste
   manual toma la prioridad, con una fila de traza por ticket.
3. **Reversión** al desmarcar: esos tickets vuelven a la prioridad calculada, con traza.
4. **Traza al nacer bajo Top 5**, para que la reversión tenga de dónde calcular (D-3, §4).
5. **Lista de «Remisión creada»**: consulta ordenada en el servidor y vista en el tablero.

### Fuera

- La pregunta 3.b (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`): calificación del cliente sin contrato ni
  Top 5, y quién ajusta a mano fuera de los Top 5. **Es lo que mantiene `cierra: no`.**
- El ajuste manual (`ajustarPrioridad`, `prioridadCliente.ts:91-96`) sigue marcando `managed_by_app`: no se migra a
  la marca nueva.
- Aviso de discrepancia con Zoho sobre la prioridad (el de la orden de venta no se replica).
- Relleno de datos, segmentación de la lista por área, escritura hacia Zoho (`decision/p44-escritura-zoho`).
- IV-12 y los `.tsx` de color.

## 3 · Capacidades

**Nuevas:** ninguna.

**Modificadas:**

| Capacidad | Requisito | Qué cambia |
|---|---|---|
| `tickets-core` | RQ-TC-24, `openspec/specs/tickets-core/spec.md:856-872` | Cae el «sólo al nacer» de `:870-871`. Los escenarios S-1 (`:953-958`) y S-9 (`:960-965`) se invierten |
| `tickets-core` | RQ-TC-27, `:1061` | El `PUT` propaga o revierte en la misma transacción |
| `tickets-core` | RQ-TC-29, `:1135-1146` | La traza gana origen; un ajuste manual exime al ticket de la propagación |
| `tickets-core` | nuevos | Propagación, reversión, exención, traza al nacer |
| `zoho-sync` | RQ-ZS-01, `openspec/specs/zoho-sync/spec.md:58` | Segunda marca de fila: la prioridad elegida en la aplicación no la pisa el sincronizador |
| `vistas-tablero` | RQ-VT-03, `openspec/specs/vistas-tablero/spec.md:91-109` | Pasa de «seis claves» (`:99`) a siete |
| `vistas-tablero` | nuevo | Lista de «Remisión creada» ordenada en el servidor |

## 4 · Decisiones de diseño que la propuesta toma

### D-1 · Quién manda sobre la prioridad propagada: Zoho o la aplicación → **(C) marca por fila**

Evidencia:

- `priority` está en `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:45`) y `upsertTicket` sólo se abstiene con
  `managed_by_app === true` (`repo.ts:71`): sin protección, la propagación a un ticket de Zoho dura una pasada.
- **(A) `managed_by_app` en cada ticket tocado** es lo que hace hoy el ajuste manual (`prioridadCliente.ts:93`),
  pero de uno en uno. En masa es la salida que Gerencia descartó para la orden de venta: «Descarto (a) mientras
  convivamos con Zoho, porque congela el ticket entero» (`decision/e005-iv4-iv11`, `config.yaml:1654`).
- **(B) sólo los ya gestionados** incumple la letra: «sus tickets abiertos», sin excepción por origen.
- **(C)** aplica a la prioridad la regla que Gerencia dio para la orden: «si […] se eligió en la aplicación, manda
  la aplicación y el sincronizador no la pisa […]; si no, manda Zoho, como hoy» (`config.yaml:1652-1653`). El molde
  existe: `ov_elegida_en_app_at`, `repo.ts:73-78`.

**Ninguna decisión registrada resuelve este punto para la prioridad**; `e005-iv4-iv11` habla de la orden de venta.
Se toma (C) como **supuesto S-1**, razonable y reversible (columna aditiva que admite NULL; vaciarla devuelve el
mando a Zoho), y se apunta la pregunta E-nueva-1. No toca datos de producción al desplegar: nace vacía, sin relleno.

### D-2 · Qué es «la prioridad calculada» y cómo se vuelve a ella

La misma fórmula del alta, `prioridadAlNacer(base, contratoVigente, top5)` (`packages/shared/src/contratos.ts:66-69`):

- **Propagar:** `prioridadAlNacer(base, contrato, prioridadDelTop5)`. Con contrato vigente manda la más alta de las
  dos (`decision/anexo-53-contratos`, recogida en RQ-TC-24, `spec.md:863-864`).
- **Revertir:** `prioridadAlNacer(base, contrato, null)`.
- **`base`** = la prioridad que el ticket tenía antes de que el Top 5 la tocara: el `de` de su primera fila de
  propagación posterior a la última reversión.
- Si el resultado es igual a la prioridad actual, no se escribe ni se deja traza.

### D-3 · Traza al nacer bajo Top 5

Un ticket que nace bajo Top 5 no guarda la prioridad del cuerpo (`ticketService.ts:106`), así que sin traza no
tiene `base` y no podría «volver a la calculada». El alta deja una fila de origen Top 5 con `de` = la prioridad sin
Top 5. Cómo se hace atómica con el alta sin mover líneas de `crearTicketConEquipo` es del diseño.

### D-4 · La traza y la exención

`public.prioridad_ajustes` gana una columna `origen` (NULL = manual, que es lo que son todas las filas de hoy).
La lista de orígenes vive en `packages/shared`. **Exento = el ticket tiene al menos una fila manual**, antes o
después de una propagación.

### D-5 · La lista

Endpoint propio, ordenado en el servidor por la entrada al estado (`entradasActuales`,
`apps/desk/server/db/sla.ts:78-102`: el reloj de la alarma), el más antiguo primero. Vista nueva en
`FUNCTIONAL_VIEWS` con su `case` (RQ-VT-03), molde de «Mis Tickets» (`routes/prioridad.ts:83-86`, `App.tsx:69`).

## 5 · Supuestos (razonables y reversibles)

| | Supuesto | Reversión |
|---|---|---|
| S-1 | Marca por fila `prioridad_en_app_at` (D-1) | Vaciar la columna |
| S-2 | Tras revertir, la marca **se conserva**: la calculada la eligió la aplicación y se mantiene frente a Zoho | Vaciarla al revertir |
| S-3 | «Abierto» = `status_type <> 'Closed' OR status_type IS NULL` (`repo.ts:151`), esperas incluidas | Cambiar el predicado |
| S-4 | Una prioridad escrita por una transición (`repo.ts:300`) **no** es «ajuste manual con motivo»: no lleva motivo ni fila en `prioridad_ajustes`. No exime | Añadirla a la exención |
| S-5 | Top 5 más bajo que la prioridad actual, sin contrato: el ticket **baja** («toman la nueva prioridad»; es lo que hace el alta) | Usar `prioridadMasAlta` con la actual |
| S-6 | Cambiar la prioridad de un cliente que ya es Top 5 también propaga | — |
| S-7 | La lista trae **todos** los tickets en «Remisión creada», con o sin orden de venta; la alarma sólo mide los que no la tienen (`packages/shared/src/sla.ts:139`) | Filtrar en el endpoint |
| S-8 | Un ticket sin fila de entrada en `ticket_transitions` (`db/sla.ts:28-32`) va **al final** de la lista, no se omite | Omitirlo |
| S-9 | La lista la lee cualquier sesión, como todas las vistas (`boardView.ts:33-36`); «para Comercial» describe a quién sirve | Guarda de área en el endpoint |
| S-10 | Tickets nacidos bajo Top 5 **antes** de este cambio no tienen `base`: al desmarcar no se tocan. Hipótesis: en producción no hay ninguno, porque F1B-07 va en el paquete de despliegue pendiente | Relleno, decisión de persona |
| S-11 | El motivo de las filas de propagación y reversión es un texto fijo generado por el servidor (`motivo` es `NOT NULL` y no vacío, `schema.sql:618`) | — |

## 6 · Enfoque por pieza

| Pieza | Enfoque |
|---|---|
| Marca de sync | `upsertTicket` lee la marca en el `SELECT` de `repo.ts:67` y saca `priority` de `cols` en `:76-78`. La guarda de `managed_by_app` (`:71`) sigue primera |
| Propagación y reversión | Función nueva en `apps/desk/server/db/prioridadCliente.ts`, llamada desde el `PUT` (`routes/prioridad.ts:44`) dentro de `enTransaccion` junto con `fijarPrioridadCliente`: o se escribe todo o nada. Lecturas fijas, sin N+1. El cálculo, en `shared` |
| Respuesta del `PUT` | Añade cuántos tickets cambió, para que la pantalla lo diga |
| Lista | Fichero nuevo `apps/desk/server/db/listaRemisionCreada.ts` + `GET` en `routes/prioridad.ts`, al final. Devuelve cada ticket con su instante de entrada |
| Cliente | Clave nueva en `FUNCTIONAL_VIEWS`, `case` que no reordena, `fetch` en `api/client.ts`, rama en `App.tsx:69`, etiqueta en `Sidebar.tsx` |

## 7 · Regla invariable 13, decisión a decisión

| # | Decisión | Quién la impone | Línea del servidor |
|---|---|---|---|
| 1 | Quién marca o desmarca un Top 5 | Servidor, ya probado | `routes/prioridad.ts:40` |
| 2 | Qué tickets se tocan (del cliente, abiertos, sin ajuste manual) | Servidor. El cliente no envía lista de tickets | **Nueva**, en la llamada de `routes/prioridad.ts:44` |
| 3 | Qué prioridad toma cada uno | `shared`, consumida por el servidor | `packages/shared/src/contratos.ts:66-69` |
| 4 | Que el sincronizador no la pise | Servidor | **Nueva**, en `repo.ts:76-78` |
| 5 | El orden de la lista | Servidor. El cliente la enseña como llega (precedente: `apps/desk/src/lib/boardView.test.ts:138-143`) | **Nueva** |
| 6 | Quién puede «Habilitar Servicio» desde la lista | Servidor, ya probado | `ticketService.ts:126-131`; `packages/shared/src/transitions.ts:178` |
| 7 | Quién ve la lista | No es una guarda: lectura abierta (S-9) | `requireAuth` en la ruta nueva |

Lo que el cliente añade (el recuento de tickets cambiados, la vista) es comodidad: ninguna decide nada. Las filas
2, 4 y 5 se cierran con prueba de servidor antes que el cliente (`strict_tdd`).

## 8 · Cambios de esquema

Tres sentencias, **al final** de `packages/zoho-sync/src/db/schema.sql` (hoy termina en `:707`), sin relleno:

| Sentencia | Calificación |
|---|---|
| `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz;` | **Sin calificar**: `tickets` es de `desk` |
| `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` | `public.` |
| `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;` | `public.` |

La tercera hace falta para revertir a «sin prioridad». Hipótesis: `pg-mem` admite `DROP NOT NULL`; lo comprueba el
diseño, y si no, lo dice antes de `tasks`. La marca nueva **no** entra en `TICKET_COLS`.

## 9 · Pruebas

**Se invierten** (el par de `apps/desk/server/prioridadTop5.test.ts`, no el del alta):

| Prueba | Hoy | Pasa a afirmar |
|---|---|---|
| TC24-14, `:180-185` | dos tickets `Low` conservan `Low` | los dos quedan `High`, con una fila de traza cada uno |
| TC24-15, `:187-193` | desmarcar no cambia el ticket | el ticket vuelve a su calculada, con traza |

El `describe` de `:179` cambia de título. Las de `apps/desk/server/services/ticketService.test.ts:1154` y `:1160`
son del alta y **no se tocan**.

**Nuevas**, con sus mutaciones: exención por ajuste manual (antes y después de propagar); cerrados intactos;
contrato + Top 5 `Low` da `High`; cliente ajeno intacto; ticket de Zoho propagado sobrevive a `upsertTicket` y
conserva el resto de columnas sincronizadas; `managed_by_app` no cambia al propagar; reversión a NULL; transacción
que falla no deja nada a medias; ciclo marcar-desmarcar-marcar; orden de la lista y ticket sin entrada al final;
guardián de esquema ensuciando el fichero vigilado (regla de mutación 2); posición de la exención frente al filtro
de abiertos (regla de mutación 1).

## 10 · Ficheros muy citados (regla de mutación 4)

| Fichero | Cómo se evita desplazar |
|---|---|
| `packages/zoho-sync/src/db/repo.ts` | Edición **en sitio** de `:67`, `:70` y `:76-78`: mismas líneas, cero netas. Se comprueba con `git diff --numstat` (inserciones = borrados) |
| `packages/zoho-sync/src/db/schema.sql` | Sólo se añade al final |
| `apps/desk/src/lib/boardView.ts` | La clave nueva en la línea de `mios` (`:15`) y el `case` en una línea existente del `switch`: cero netas |
| `routes/prioridad.ts`, `db/prioridadCliente.ts` | Sólo se añade al final; el `PUT` se edita en `:44` sin añadir líneas |
| Specs vivas | No se tocan hasta el archivo; las fusiona el delta |

Al cierre de cada lote, barrido de citas completas y abreviadas sobre los ficheros tocados, leyendo qué afirma cada
frase. `Sidebar.tsx`, `App.tsx` y `api/client.ts` sí ganan líneas: entran en el barrido.

## 11 · Lotes

Un intento del registro por lote, en el worktree. Estimación = líneas de prueba × 1,8 + casillas de `tasks.md`.
Válvula 720, techo 800.

| Lote | Contenido | Pruebas | Estimación |
|---|---|---|---|
| L1 | Marca de prioridad frente al sincronizador: columna, `upsertTicket`, guardián de esquema | ~60 | ~120 |
| L2 | Propagación, reversión, origen de la traza, traza al nacer, inversión de TC24-14/15, respuesta del `PUT` | ~210 | ~400 |
| L3 | Lista de «Remisión creada»: consulta, endpoint, vista y cliente (~40 de `.tsx`, sin prueba por decisión de Gerencia) | ~110 | ~250 |

Suma ~770: las dos piezas juntas no caben en un intento. Si `tasks` mide L2 por encima de 720, se parte en L2a
(propagación y reversión) y L2b (traza al nacer). Antes de cerrar cada intento se ejecuta la medida:
`git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

## 12 · Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| D-1 no es lo que Gerencia quiere para la prioridad | Media | S-1 reversible; E-nueva-1 |
| Desplazar citas de `repo.ts` o `boardView.ts` | Media | §10 |
| `pg-mem` no admite `DROP NOT NULL` | Baja | Se comprueba en diseño |
| Propagar a muchos tickets con consultas por ticket | Baja | Lecturas fijas; prueba de recuento de consultas |
| La traza al nacer obliga a tocar `crearTicketConEquipo` | Media | Diseño; si pasa de la válvula, L2b |
| Un Top 5 baja tickets que estaban más altos (S-5) | Media | A la letra; E-nueva-3 |

**Condiciones de parada: ninguna.** No hay coste, no hay relleno ni escritura sobre datos de producción al
desplegar, no cambia el alcance de la fila y ningún supuesto contradice una decisión registrada.

## 13 · Reversión

- Código: `git revert` de cada lote, en orden inverso; L3 es independiente de L1 y L2.
- Esquema: las dos columnas son aditivas y admiten NULL; pueden quedarse. `DROP NOT NULL` no se deshace mientras
  existan filas con `a` NULL.
- Datos: cada cambio de prioridad queda en `prioridad_ajustes` con su `de`; deshacer una propagación es desmarcar
  al cliente. Vaciar `prioridad_en_app_at` devuelve la prioridad a Zoho.

## 14 · Paquete de despliegue

- **Esquema:** las tres sentencias del §8, que aplica la migración al arrancar. Sin relleno.
- **Condición:** los Top 5 marcados antes del despliegue no se propagan solos; se propaga al volver a guardarlos.
- **Comprobaciones de persona en la aplicación** (fuera del recuento de tareas, con dueño Comercial):
  1. Marcar un cliente Top 5 y ver sus tickets abiertos con la prioridad nueva y su traza.
  2. Desmarcarlo y verlos volver.
  3. Comprobar que un ticket con ajuste manual no cambió.
  4. Tras una pasada del sincronizador (3 min), un ticket venido de Zoho conserva la prioridad propagada.
  5. Abrir la lista de «Remisión creada» y ver el más antiguo arriba.

## 15 · Preguntas para `docs/sdd/ENTRADA.md`

- **E-nueva-1** · Sobre la prioridad propagada a un ticket venido de Zoho, ¿manda la aplicación (S-1)? Y tras
  desmarcar, ¿sigue mandando la aplicación o vuelve a mandar Zoho (S-2)?
- **E-nueva-2** · Una prioridad cambiada por el Director Comercial en una transición, sin motivo escrito, ¿cuenta
  como «ajuste manual con motivo» (S-4)?
- **E-nueva-3** · Si el Top 5 es más bajo que la prioridad que el ticket ya tenía, ¿el ticket baja (S-5)?
- **E-nueva-4** · ¿La lista trae todos los equipos en «Remisión creada» o sólo los que no tienen orden de venta,
  que son los que mide la alarma (S-7)?

## 16 · Criterios de aceptación

1. Marcar Top 5 `High` a un cliente con dos tickets abiertos `Low` los deja `High`, con una fila de traza por
   ticket (anterior, nueva, autor, fecha, origen).
2. Desmarcarlo los devuelve a `Low`, con traza; un ticket de cliente con contrato vigente queda `High`.
3. Un ticket con un ajuste manual no cambia al marcar, al cambiar la prioridad ni al desmarcar.
4. Los tickets cerrados y los de otros clientes no cambian.
5. Con contrato vigente y Top 5 `Low`, el ticket queda `High`.
6. Tras propagar a un ticket de Zoho, `upsertTicket` con otra prioridad no la cambia y sí actualiza las demás
   columnas; `managed_by_app` sigue `false`.
7. Si falla una escritura, no cambian ni la fila del cliente ni ningún ticket.
8. Un ticket nacido bajo Top 5 vuelve a su calculada al desmarcar.
9. La lista devuelve los tickets en «Remisión creada» del más antiguo al más reciente por su entrada al estado,
   con el mismo instante que usa la alarma; los que no tienen entrada, al final.
10. El cliente enseña la lista sin reordenar y toda clave de `FUNCTIONAL_VIEWS` tiene su `case`.
11. `repo.ts` y `boardView.ts` cierran con cero líneas netas; el barrido de citas, sin roturas nuevas.
12. Cada lote cierra por debajo de 800 líneas medidas; `npm test`, `npm run typecheck` y `npm run lint` en verde.
13. Las mutaciones del §9 se ponen rojas.
