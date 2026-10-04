# Progreso de aplicación — `migracion-tickets-abiertos` (F1F-01)

Modo: strict TDD, `auto · hybrid · ask-on-risk · 800`. Los lotes 2 y 3 fusionan aquí.

## Lote 1 — deltas alineados y núcleo puro

Partida del lote: `18dc1f93ef488ceb09791b38c895b14ac1230e39` (`git rev-parse HEAD` en el worktree
`migracion-tickets-abiertos`; intento abierto con el token indicado por el orquestador).

### Tareas hechas

1.1 a 1.20, salvo lo que se anota abajo en «Pendiente del orquestador» (el `cli.ts` de citas y la medida final con
sus códigos). 1.17: `git diff` de `packages/shared/src/index.ts` da una inserción y cero borrados; el núcleo quedó sin
mutaciones (comparado byte a byte con la copia previa a las mutaciones).

### 1.1 — ediciones a los deltas (el diseño manda), una línea cada una

- a. `tickets-core` RQ-TC-40: «Pendiente» y «Entregado» se deciden antes que la identidad; la regla 1 excluye a «Pendiente».
- b. RQ-TC-40: los cuatro nombres de regla y `statusTypeDestino` (`null` = no se cambia).
- c. RQ-TC-40 regla 3: `statusTypeDestino = 'Open'` (D-10); quitada la «Hipótesis» sobre el `status_type` de un `Pendiente`.
- d. RQ-TC-41: `planDeTicket(t, corte)` + `resumenDeMigracion` + `esperaRemisionDeEntrada`; la vigencia es del ejecutor;
  `corte` ausente o sin forma de fecha es `400` de la ruta; el núcleo lanza `RangeError` si el `Date` es inválido
  (**supuesto reversible no escrito en el diseño**).
- e. RQ-TC-41: precedencia fija ya-gobernado → tras-el-corte → sin-equivalencia → migrar; el bloqueo se limita a los que se migrarían.
- f. RQ-TC-41: `pendientes` por ticket, `yaGobernados` en dos recuentos, `sinEquivalencia` agrupado, `porEstado` con
  `cambiaEstado`; escenario «Totales…» reescrito (más escenarios de precedencia y de `esperaRemisionDeEntrada`).
- g. `zoho-sync` RQ-ZS-17: fuera `modified_time = now()`; `updated_at` sí; `source` intacto; `status_type` sólo si D-10;
  escenario «`modified_time` y `source` intactos».
- h. RQ-ZS-17 marcador: `to_status` `NULL` en identidad (D-6), claves de `"values"`, `area`, `performed_by`,
  `transition_name`; escenario «el marcador de identidad no mueve `entradasActuales`».
- i. RQ-ZS-17 `aplicar`: ausente o `false` seco, `true` aplica, otro valor `400` (D-12); escenario reescrito.
- j. RQ-ZS-17 `corte`: instante ISO con desfase, fecha pelada `400` (D-11); escenario nuevo.
- k. RQ-ZS-17 negativa: `409` con informe completo, en seco `200` con `negativa` rellena (D-13); informe con `negativa`,
  `aplicar`, `aplicado`, `numeracion`, `avisos`; escenario de `numeracion.arrastra` a un lado y otro de 10000.
- l. RQ-ZS-17 transacción: en seco no hay transacción (D-2); al aplicar la lectura va dentro (D-1); `UPDATE … WHERE
  managed_by_app = false RETURNING id` y se deshace todo si no devuelve fila (D-3); escenario nuevo.
- m. RQ-ZS-18: `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, prefijo `-- REV `, una sentencia por regla que cambia el
  estado más una de identidad (restaura sólo `managed_by_app`), filtro por `"values"->>'status_type_previo'`; el
  hueco del diseño §8 queda declarado.
- n. RQ-ZS-17: el informe va también al log; «en `avisos`» de D-7 se lee como el campo del informe (**hipótesis**).
- o. Esta lista, y las referencias cruzadas del diseño: `openspec/changes/migracion-tickets-abiertos/design.md:47` (D-15)
  dice «§8» para los lotes y los lotes son el §9 (`openspec/changes/migracion-tickets-abiertos/design.md:197`); la
  tabla de pruebas y mutaciones es el §8 (`openspec/changes/migracion-tickets-abiertos/design.md:171`). No encontré
  ningún «§7» mal citado en el diseño: los «solapamientos del §7» de `tasks.md` apuntan bien al orden de guardas
  (`openspec/changes/migracion-tickets-abiertos/design.md:157`).

### Rojo (1.6)

`npx vitest run packages/shared/src/migracionTickets.test.ts` con la prueba escrita y sin módulo:

    Error: Cannot find module './migracionTickets' imported from '…/packages/shared/src/migracionTickets.test.ts'
     Test Files  1 failed (1)
          Tests  no tests

Verde (1.11): `Test Files 1 passed (1)`, `Tests 30 passed (30)`.

### Tabla de mutaciones (reproducibles; el fichero se restauró tras cada una)

Todas sobre `packages/shared/src/migracionTickets.ts`; se corre `npx vitest run packages/shared/src/migracionTickets.test.ts`.

| # | Edición exacta | Rojo (resultado medido) |
|---|---|---|
| M1 (regla 1, posición) | Insertar, **antes** de la línea `  if (estadoZoho === 'Pendiente') {`, la línea `  if (ESTADOS_DE_LA_APP.has(estadoZoho)) return { destino: estadoZoho as Estado, regla: 'identidad', statusTypeDestino: null }` | 5 caen, entre ellas ««Pendiente» de servicio va a «En Proceso» con status_type «Open»» |
| M2 (regla 1) | Intercambiar las dos ramas `else if (t.createdTime !== null && new Date(t.createdTime).getTime() > corte.getTime()) accion = 'tras-el-corte'` y `else if (equivalencia === null) accion = 'sin-equivalencia'` | 2 caen: «precedencia: tras el corte y sin equivalencia es «tras-el-corte»» y «un sin equivalencia gobernado o posterior al corte no bloquea…» |
| M3 (idempotencia) | `  if (t.managedByApp) accion = 'ya-gobernado'` → `  if (false) accion = 'ya-gobernado'` | 6 caen, entre ellas «precedencia: gobernado y sin equivalencia es «ya-gobernado»» |
| M4 | Sacar `r.masAltoAMarcar = r.masAltoAMarcar === null ? t.number : Math.max(r.masAltoAMarcar, t.number)` de la rama que migra y ponerlo como primera línea del cuerpo del `for` (sobre todos los planes) | 2 caen: «masAltoAMarcar es sólo sobre los que migran» y «masAltoAMarcar es null si nada migra». (Quitar la línea sin más también la deja roja: cae sólo la primera) |
| M5 | `getTime() > corte.getTime()` → `getTime() >= corte.getTime()` | 1 cae: «corte en el instante exacto: createdTime igual al corte se migra» |

Una primera versión de M1 (sólo anteponer la identidad para los no-«Pendiente») no rompía nada, como es de esperar: no
cambia ningún resultado. La que vale es la de la tabla.

### Regla 13 del lote (1.18)

La tabla de equivalencias y el plan viven en `packages/shared/src/migracionTickets.ts` y consumen `ESTADOS`
(`packages/shared/src/estados.ts:112`) y `esClasificacionSoporteRemoto` (`packages/shared/src/flujos.ts:116-119`); no
duplican la lista de nombres ni el predicado. El cliente (`apps/desk/src`) no participa: este lote no lo toca.

### Desviaciones del diseño y de las tareas

- **Ninguna de comportamiento.** `Equivalencia`, `TicketParaMigrar`, `PlanTicket` y las tres funciones siguen el §4 del diseño.
- `ResumenMigracion` (diseño §4 sólo lo nombra) se concretó con los campos del informe que salen del núcleo: `abiertos`,
  `migrables`, `porEstado`, `sinEquivalencia`, `yaGobernados`, `trasElCorte`, `pendientes`, `masAltoAMarcar`.
  `sinRemisionVigente`, `numeracion`, `negativa`, `avisos` y `aplicar/aplicado` son del ejecutor.
- Decisiones menores de ese resumen, **supuestos reversibles** y sin cambio de alcance: `porEstado` y `pendientes` cuentan
  sólo los que se migran; `equivalencia` se calcula siempre en `planDeTicket` (también para gobernados y posteriores al
  corte), y `accion` decide qué se hace con ella; `createdTime` con texto no interpretable se trata como no posterior al corte.
- `npm test` sale con código 1 **por una prueba ajena a este lote** (ver «Riesgos»).

### Para la bandeja

- `apps/desk/server/reconciliacion/registro.test.ts:220` fija «en curso» en exactamente OCHO tandas
  (`'F0-04'`, `'F1B-03'`, `'F1B-04'`, `'F1B-07'`, `'F1B-08'`, `'F1B-11'`, `'F1C-05'`, `'F1F-05'`). Al existir el
  `proposal.md` de este cambio (`tanda: F1F-01`, `cierra: no`) aparece una novena, `F1F-01`, y la prueba cae: fallaba
  ya en `18dc1f9` antes de tocar nada de producción. No se tocó (fuera de alcance); necesita decisión de quien lleve la
  reconciliación (¿actualizar la cifra a NUEVE al fusionar?).

### Medida y cierre (1.19, 1.20)

Ver el informe de retorno del apply: códigos de salida de `npm test` (1, por lo de arriba), `npm run typecheck` (0) y
`npm run lint -- --max-warnings 165` (0, 165 avisos). El detector de citas lo corre el orquestador tras su commit.

### Añadido por el orquestador al cerrar el lote 1

- La prueba `apps/desk/server/reconciliacion/registro.test.ts:218` contaba ocho tandas «en curso» sobre el árbol real; la cabecera de esta propuesta (`tanda: F1F-01`, `cierra: no`) añade la novena. Se actualizó la cifra y la lista (entra `F1F-01` entre `F1C-05` y `F1F-05`), igual que hicieron F1B-03 y F1F-05 al entrar. Cuenta en la medida del lote: 2 líneas insertadas y 2 borradas.
- Las cinco mutaciones (M1 a M5) las reprodujo el orquestador con `mut.mjs`: 5, 2, 6, 2 y 1 pruebas en rojo, y el fichero restaurado tras cada una.

## Lote 2 — barrido de lectores, ejecutor y ruta

Partida del lote: `d2e421f297e8ceefb674fba52dc70f293a3361b6` (`git rev-parse HEAD`; intento abierto, token indicado por el orquestador). `apps/desk/server/routes/admin.ts` tenía 213 líneas y `packages/shared/src/index.ts` 36 (no se toca en este lote). Tareas 2.1 a 2.31 y 2.33 hechas; **2.32 queda sin marcar** (el detector de citas lo corre el orquestador).

### Barrido de lectores de `ticket_transitions` (2.3), contra un marcador con `transition_id` desconocido y `to_status` NULL (o relleno)

Prueba: `apps/desk/server/migracionMarcadorLectores.test.ts` (5 pruebas; **todas nacieron verdes**, como caracterización: ningún lector falla ni lanza; los «raros» son de presentación y quedan fijados tal cual).

| Lector (ruta:línea) | Trata el marcador como… | Qué ve el usuario |
|---|---|---|
| `apps/desk/server/db/sla.ts:88` | Entrada de estado SÓLO si `to_status` coincide con el actual: identidad (NULL) no cuenta (D-6); «Entregado»/«Pendiente» sí, con la fecha de la migración | Alarma: el reloj de un «Pendiente»→«En Proceso» arranca el día de la migración, no el de Zoho (bandeja B5) |
| `apps/desk/server/db/informeContrato.ts:34` | Fecha de finalización si `to_status = 'Finalizado'` (sólo «Entregado»); no ejercitado sobre pg-mem (exige tablas de Books): lectura del código | La fecha de ejecución de una subOV «Entregado» es la de la migración (bandeja B1, ya conocida del diseño §12) |
| `apps/desk/server/indicadores.ts:76` | Un paso más del historial; ninguna clave de `values` es un hito | `reentrante` pasa de `null` («sin dato», `packages/shared/src/indicadores.ts:134`) a `false` en los tickets migrados sin otra historia (bandeja B2) |
| `apps/desk/server/db/fechasTicket.ts:28` | No: filtra por `transition_id` | Nada |
| `apps/desk/server/db/primerDerivado.ts:26` | No: busca `derivado_a` en `values`; el marcador no la lleva | Nada |
| `apps/desk/server/db/colaTaller.ts:14` | No: `transition_id = 'habilitar_servicio'` | Nada |
| `apps/desk/server/db/ticketFuentes.ts:19` | No es «creación»: `from_status` es el estado previo, nunca el centinela | Nada |
| `apps/desk/server/db/equipos.ts:275` | Una etapa más de la hoja de vida, con `toStatus` NULL en identidad | La tarjeta del ticket muestra «Migración de ticket abierto…» (bandeja B4) |
| `apps/desk/server/db/historial.ts:137` | «Transición: Migración de ticket abierto de Zoho (F1F-01)», `Estado: En Proceso → —` y los campos de `values` | Etiquetas en crudo: «Estado previo», «Status type previo», «Managed by app previo» (inglés), «Corte», «Ejecutado por» (bandeja B3) |
| `apps/desk/server/db/conversacion.ts:140` | Igual, como mensaje privado del hilo | Igual que el historial (B3) |
| `apps/desk/server/db/certificadosFabrica.ts:16` | No: `transition_id = 'liberacion'` | Nada |
| `apps/desk/server/db/eliminarTicket.ts:53` | Borra por `ticket_id`; no lee valores | Nada |
| `apps/desk/server/auth/users.ts:138` | No: `values->>'derivado_a'` | Nada |
| `apps/desk/server/routes/tickets.ts:139` | Sólo comentario; usa `fechasTicket` y `primerDerivado` | Nada |
| `packages/shared/src`: `bodegaje.ts`, `reentrancia.ts`, `etapasDesdeHistoria.ts`, `contratos.ts`, `transitions.ts`, `types.ts` | `bodegaje.ts` lee claves de `values` (el marcador no las trae) y `marcaIngresoAServicio` filtra por `transition_id`; `etapasDesdeHistoria.ts` lee la historia de Zoho, no esta tabla; el resto, sólo comentarios | Nada |
| `packages/zoho-sync/src`: `sync.ts`, `db/history.ts`, `db/repo.ts` | `repo.ts` sólo ESCRIBE (`:255`, `:315`, `:429`); `sync.ts` y `history.ts`, comentarios | Nada |

`grep -rn "ticket_transitions" apps packages --include=*.ts` (sin pruebas) y `grep -rnE "to_status|transition_id|\btt\."` no trajeron lectores nuevos: los únicos con otro acceso son los de `sla.ts`, `fechasTicket.ts` e `indicadores.ts`, ya en la tabla. Ninguno se arregla aquí.

### Rojos (2.12), literales

- Ejecutor: `Error: Cannot find module './migracionTicketsAbiertos' imported from '…/apps/desk/server/db/migracionTicketsAbiertos.test.ts'`.
- Ruta (sin la ruta montada): 16 de 16 caen, todas con `expected 404 to be 401|403|400|409|200` (p. ej. `expected 404 to be 401 // Object.is equality`).
- Lectores: caracterización, verde desde el principio (la primera versión del test de la hoja de vida falló sólo por la forma del objeto, corregida antes de producción).

### Verde, citas y `admin.ts` (2.15 a 2.18, 2.31)

- **Plan A:** `npm run lint -- --max-warnings 165` ACEPTA el `import` tardío de `admin.ts` (sin error ni aviso nuevo en ese fichero). No hay plan B ni barrido de movimientos: `git diff --numstat` de `admin.ts` da `21 0`; las líneas 1 a 212 no se movieron; sólo se desplazó la llave de cierre (era la 213, hoy la 233; `wc -l` 213 → 234 con la línea del `import`).
- Barrido `grep -rnoE "admin\.ts:[0-9]+(-[0-9]+)?"`: todas las citas son de artefactos de este cambio y apuntan a las líneas 17, 83-92, 177 y 212, **que no se movieron** (siguen diciendo lo mismo). La única afectada es la de `design.md:58`, que cita la línea 213, hoy VACÍA: **caso B** (histórico), se le añadió la revisión `en d2e421f`. `packages/shared/src/index.ts`: no se tocó en este lote.
- Forma: el `UPDATE` usa `status_type = COALESCE($3::text, status_type)` en una sola sentencia en lugar de dos variantes (D-10 igual: `null` = no se cambia).

### Mutaciones (reproducibles; se restauró cada fichero)

Pruebas corridas: las cuatro (`apps/desk/server/db/migracionTicketsAbiertos.test.ts`, `apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, `apps/desk/server/migracionMarcadorLectores.test.ts`, `packages/shared/src/migracionTickets.test.ts`). E = `apps/desk/server/db/migracionTicketsAbiertos.ts`, R = `apps/desk/server/routes/admin.ts`. «Mover líneas a-b tras c» = cortar esas líneas del fichero (CRLF) y pegarlas detrás de la línea c original.

| # | Fichero | Edición exacta | Cae |
|---|---|---|---|
| M1a | E | `opts.aplicar === true` → `opts.aplicar !== false` | 2: «con aplicar ausente y con false: ni BEGIN…» y «numeracion.arrastra…» |
| M1b | R | `const aplicar = pedido === 'true'` → `const aplicar = pedido !== 'false'` | 2: «200 en seco por defecto…» y «200 al aplicar, con el informe igual…» |
| M2 (regla 1) | E | Mover la línea 70 (`if (informe.negativa) return informe // …`) tras la 90 (dentro del bucle, tras el primer `UPDATE`) | 3: «con un sin equivalencia el ÚLTIMO…», «un migrable y un sin equivalencia con aplicar=true no dejan ni INSERT ni UPDATE», «409 con el informe completo…» |
| M3 (regla 1) | E | Mover las líneas 78-82 (el `INSERT` del marcador) tras la 90 (el `throw` del `UPDATE` sin fila) | 1: «marcador y UPDATE por ticket… en ese orden» |
| M4 | E | `managed_by_app = true, updated_at = now()` → `updated_at = now()` | 4: «el marcador lleva to_status NULL…», «un sin equivalencia ya gobernado…», «upsertTicket posterior no altera la fila migrada…», «200 al aplicar…» |
| M5 | `packages/shared/src/migracionTickets.ts` | `  if (t.managedByApp) accion = 'ya-gobernado'` → `  if (false) accion = 'ya-gobernado'` | 8 (6 del núcleo, «un sin equivalencia ya gobernado…» y «segunda pasada sin marcador ni UPDATE nuevos…», que lanza `El ticket 4400 pasó a estar gobernado…`) |
| M6 | R | `'/api/admin/migrar-tickets-abiertos', requireAuth(db), requireSuperAdmin,` → `'/api/admin/migrar-tickets-abiertos', requireAuth(db),` | 2: «sin rol de administrador: 403…» y «un no administrador con corte inválido ve 403, no 400» |
| M7 (D-6) | E | `eq.destino === t.status ? null : eq.destino, ACTOR_MIGRACION` → `eq.destino, ACTOR_MIGRACION` | 2: «el marcador lleva to_status NULL…» y «el marcador de identidad no mueve entradasActuales…» |
| M8 (D-5) | E | `managed_by_app = true, updated_at = now()` → `managed_by_app = true, modified_time = now(), updated_at = now()` | 1: «el marcador lleva to_status NULL… la fila cambia lo justo» |
| M9 (regla 1, 2 y 3) | R | Dos ediciones: (1) `'/api/admin/migrar-tickets-abiertos', requireAuth(db), requireSuperAdmin,` → `'/api/admin/migrar-tickets-abiertos', requireAuth(db),` y (2) delante de la línea `    const aplicar = pedido === 'true'` insertar la línea `    if (!req.user?.isAdmin) { res.status(403).json({ error: 'No admin' }); return }` | 1: «un no administrador con corte inválido ve 403, no 400» |
| M10 (regla 1, 3 y 4) | R | Mover las líneas 225-226 (las dos guardas `400`) tras la 228 (`const informe = await migrarTicketsAbiertos…`) | 8 de «guardas, en orden» (7 `400 …, sin leer nada` y «corte inválido con un sin equivalencia… ve 400»; `500` o «leyó tickets») |
| M11 (D-12) | R | `pedido !== 'true' && pedido !== 'false'` → `pedido !== 'true' && pedido !== 'false' && pedido !== '1'` | 1: «400 aplicar=1, sin leer nada» |

Ninguna equivalente. Notas: M1a y M1b son dos porque la ruta fija `aplicar` por su cuenta y la mutación del ejecutor no la rompe; M5 cae también por la guarda `WHERE managed_by_app = false … RETURNING id`, que es la segunda red de la idempotencia. Los números de línea de M2, M3 y M10 son los de los ficheros tal como quedan al cierre del lote (CRLF).

### Regla 13 y regla de mutación 3 (ruta)

El servidor decide `aplicar` (`true`/`false`, otro valor `400`), `corte`, la negativa (`409`) y el `403`; el cliente no participa y este lote no toca `apps/desk/src`.

### Para la bandeja (sin numerar: a numerar por el orquestador)

- B1. El informe de contrato toma como fecha de ejecución la primera fila con `to_status = 'Finalizado'` (`apps/desk/server/db/informeContrato.ts:34`): un «Entregado» migrado muestra la fecha de la migración. ¿Se acepta?
- B2. Los tickets migrados sin otra historia dejan de tener `reentrante = null` y pasan a `false` (`packages/shared/src/indicadores.ts:134`, historial no vacío). ¿Se acepta o se excluye el marcador de ese conteo?
- B3. El historial y el hilo del ticket enseñan el marcador con etiquetas en crudo, entre ellas «Managed by app previo» y «Status type previo» (`apps/desk/server/db/ticketFuentes.ts:82`, `etiquetaCampo`). ¿Se añaden etiquetas propias en español o se oculta el marcador de esas dos vistas?
- B4. La hoja de vida del equipo lista el marcador como una etapa (`apps/desk/server/db/equipos.ts:275`). ¿Se deja como traza visible (diseño §12) o se filtra?
- B5. En «Pendiente»→«En Proceso» y «Entregado»→«Finalizado» el marcador lleva `to_status`, y por eso el reloj de la alarma (`apps/desk/server/db/sla.ts:88`) arranca en la fecha de la migración. ¿Es lo deseado?

### Desviaciones del diseño y de las tareas

- Tarea 2.4: ninguna prueba nació roja (los lectores no fallan). Tarea 2.12: los rojos del ejecutor y la ruta son los de arriba.
- `UPDATE` con `COALESCE` en una sentencia (arriba). El `409` se decide en la ruta (`aplicar && informe.negativa`); el ejecutor devuelve el informe con `negativa` y `aplicado: false`.
- La ruta valida `corte` con una expresión de forma (`YYYY-MM-DDThh:mm[:ss[.f]]` más `Z` o `±hh:mm`) y además exige fecha real; `aplicar` repetido en la URL (`aplicar=a&aplicar=b`) es `400` (no es `string`). **Supuestos reversibles, no escritos en el diseño.**
- El actor del marcador (`values.ejecutado_por`) es el nombre del usuario de la sesión (`req.user.name`); `performed_by` lleva `ACTOR_MIGRACION`.
- `design.md:58`: cita con revisión (caso B).

### Cierre y medida del lote 2 (2.32 parcial, 2.33)

Códigos de salida REALES: `npm test` **0** (210 ficheros pasan y 2 saltados; 3281 pruebas pasan y 7 saltadas; sin fallo de worker, corrido dos veces), `npm run typecheck` **0**, `npm run lint -- --max-warnings 165` **0** (165 avisos, 0 errores: no se añade ninguno). El detector de citas (`cli.ts --sha HEAD`) NO se corrió: es del orquestador (2.32 sin marcar).

Medida (`git diff --shortstat --no-renames d2e421f`, antes de esta sección): 136 inserciones y 33 borrados en 4 ficheros seguidos (`admin.ts` +21; `tasks.md` 32 casillas = 32+32; `design.md` 1+1; `apply-progress.md` el resto) más `wc -l` de lo nuevo sin trackear: 177 + 95 + 78 + 119 = 469. **Total 644 con esta sección (142 + 33 + 469), por debajo de 720.**
