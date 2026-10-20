# Progreso de aplicación — `calibracion-directa` (F1C-08)

Modo: `strict_tdd`, artefactos `hybrid`. Intento I3, lote 1a. Base del worktree `98b4f2f6`.

## Lote 1a — hecho (1a.1 a 1a.7; la 1a.8, códigos en serie, la ejecuta el orquestador)

### 1a.1 Línea base
`npx vitest run packages/shared` → 59 ficheros, 1.581 pruebas, todo verde. `npm run typecheck` → sin salida de error.

### 1a.2 ROJO · `packages/shared/src/calibracionDirecta.test.ts`
Rojo visto antes de escribir el módulo: `Failed to load url ./calibracionDirecta … Does the file exist?` (0 pruebas; causa: módulo inexistente).

### 1a.3 Reentrancia (RQ-TS-57) — MEDIDO POR EJECUCIÓN antes de escribir ningún número

Prueba desechable (`zz_medida_tmp.test.ts`, borrada) que aplica `tablaDeReentrancia`, `camposFechaReentrantes` y
`camposFechaReentrantesObligatorios` a `TRANSITIONS` + las dos transiciones añadidas EN MEMORIA:

| Catálogo | Ciclos (estados) | Transiciones internas con fecha | Campos reentrantes | Oblig./Opc. |
|---|---|---|---|---|
| hoy | 2 (9 y 2) | 9 | 10 | 8 / 2 |
| hoy + sólo `calibracion_directa` | 2 (9 y 2) | 9 | 10 | 8 / 2 |
| hoy + las dos | **1 (12)** | **13** | **12** | **10 / 2** |

Orden medido de los 12 estados: `Rev./Diagnostico`, `Notificado`, `En Espera de Repuestos`, `En Proceso`, `Notificación cliente`,
`Solicitado`, `Notificación a Compras`, `Notificación Comercial`, `En espera de SKU inventario`, `Servicio externo`,
`Continuación del proceso`, `Control de calidad`. Transiciones (declaración): `llegada_repuestos`, `aprobacion_y_repuestos`,
`aprobacion`, `notif_por_garantia`, `notif_cliente_comercial`, `notif_cliente_sku`, `solicitud_sku`, `reporte_por_garantia`,
`escalado_a_comercial`, `cal_sensores_proceso`, `cal_sensores_revision`, `retorno_servicio_externo`, `envio_control_calidad`.
Campos: los 10 de hoy + `Fecha Notificación por garantía` y `Fecha Revisión Informe` (en el sitio de declaración que dice D5).

**Coincide con D5 al detalle: no hay diferencia, así que D5 y RQ-TS-57/58 no se corrigen en sus cifras.** Sólo se sustituyó la
marca «a medir» por «medido por ejecución» (nota de método de `design.md`; escenario de RQ-TS-57 de la delta). Hallazgo extra:
el efecto viene sólo de `falla_calibracion`; `calibracion_directa` (de `Ingresado` a `En Proceso`) no entra en ningún ciclo.

ROJO visto (reentrancia.test.ts, catálogo sin las transiciones): 8 de 18 caen — «exactamente UN ciclo de doce estados»
(`expected [ …(2) ] to deeply equal [ [ 'Rev./Diagnostico', …(11) ] ]`), C2 (`…(9) to have a length of 13`),
C3 invertida (`['Rev./Diagnostico','Notificado'] to have a length of 12 but got 2`), «trece casos» (9 ≠ 13), «doce campos…
diez obligatorios» (10 ≠ 12; 8 ≠ 10) y las tres pruebas nuevas de R-1 (sin escape / con escape, causa, obligatorios).

### 1a.4 ROJO de las cifras (RQ-TS-58)
Con el catálogo aún sin tocar, tras editar los vigilantes EN SU LÍNEA: 21 pruebas rojas en 9 ficheros —
`expected 36 to be 38` (invariantesGrafo 2 y `cifrasAncladas`), `48 → 50` (unión), `44 → 46` (mapa, 3 pruebas), `[17,16,13,4] → [19,16,13,4]`
y `50 → 52` (tipoEvento), `31 → 33` (derivación), `estados.test.ts`: `11 → 10`, y el invariante 6 (`…(10) → …(12)`), bodegaje (`10 → 12`).
`decisionales.test.ts` (16) no cambia y sigue verde (las dos son Operativas).

### 1a.5 VERDE
- `packages/shared/src/calibracionDirecta.ts` (nuevo, 44 líneas); `export * from './calibracionDirecta'` al final de `index.ts`.
- `ticketCreate.ts:51`: `export ` delante de `TIPO_CALIBRACION` (1/1).
- `transitions.ts:262`: los dos objetos, en la misma línea, antes del comentario (que gana «F1C-08 (RQ-TS-52)») (1/1).
- `controlCalidad.ts:7` (import) y `:105` (cláusula; mensaje «La calibración directa y su escape dependen de control de calidad, que está apagado») (2/2).
- **Hipótesis de D2 confirmada:** `tsc -b` y la suite no dan ciclo de módulos (`calibracionDirecta → ticketCreate → flujos/fechasDerivadas → transitions`, y `transitions` no importa `controlCalidad`).
- `npx vitest run packages/shared` → 60 ficheros, 1.604 pruebas, verde. `npm run typecheck` limpio.

**Rojos que NO estaban en la lista de tareas y aparecieron al mover el catálogo (cada uno visto en rojo tras el verde del catálogo, no antes):**
`transitions.test.ts` «Ingresado solo habilita…» (`Ingresado` ofrece ahora dos: `expected [ …(2) ] to have a length of 1`), `cargos.test.ts:204-205`
(`expected 2200 to be 2090`: 5 × 11 × (38 + 2)), `prioridad.test.ts:118-122` (obligatorios de las 38; `toHaveLength(38)`),
`transitionsSoporteRemoto.test.ts:57-58` (38 + 7 + 5 = 50), `comentariosVigilados.test.ts` (a) `estados.ts debe decir «Hay DIEZ»` →
`estados.ts:142` «Hay ONCE» → «Hay DIEZ» y (c) `ticketService.ts debe decir «en las otras 49 transiciones»` → `ticketService.ts:238` «47» → «49».
Todos editados dentro de su línea (ins = del). Honestidad de método: su rojo se vio después del verde del catálogo; el vigilante es un texto que sólo existe cuando el catálogo cambia.

### 1a.6 `cifras_ancladas` y mapa
`openspec/config.yaml` (sólo el bloque, 4/4 líneas, dentro de sus líneas): `pasos_del_mapa` 44 → 46, `transiciones` 36 → 38; `estados` 23 sin cambio.
(Las cifras 52 filas / 19·16·13·4 / 10 con una salida no viven en ese bloque: son de los vigilantes de 1a.4.)
Mapa regenerado con `npm run generar-mapa-blueprint` (6 ficheros escritos; +2 aristas en `blueprint-completo.md`, `blueprint-fase-1-entrada.md`
y `blueprint-fase-2-diagnostico.md`; los otros tres sin cambio real, sólo aviso de fin de línea). La prueba anti-desfase pasó de rojo a verde.

### 1a.7 Mutaciones (`herramientas/mut.mjs`; todas restauradas, `restaurado=true`, y `git diff --numstat` vuelve a 2/2 en `controlCalidad.ts` y 1/1 en `transitions.ts`)

| Id | Fichero · mutación | Cae |
|---|---|---|
| M2 | `controlCalidad.ts:105` sin la cláusula | `calibracionDirecta.test.ts` «apagado, las dos dan motivo y no se ven; encendido, null y se ven» (1 caída) |
| M5 | `calibracionDirecta.ts` atajo con `=== null` en vez de `!== TIPO_CALIBRACION` | 4: «otro tipo no pasa» (Mantenimiento, Garantía, sin tipo, `calibración`), «todos los tipos… salvo Calibración», «tres textos distintos», «el tipo gana a la OV» |
| M5b | ídem en el escape | 2: «escape: sólo Calibración…» y «tres textos distintos» |
| M1 (pura) | sin chequeo de OV | 3: «sin OV el atajo no pasa (M1)», «tres textos distintos», «visible = motivo === null» |
| M4 | sin `falla_calibracion` en el catálogo | 12 (reentrancia ×8, catálogo ×3, «el grafo ofrece el escape y su destino cotiza») |
| M4b | `falla_calibracion` → `Por Facturar` | 10 (entre ellas «el grafo ofrece el escape y su destino cotiza») |
| M4c | `falla_calibracion` → `Finalizado` | 2: «tipos, áreas, from/to…» y «el grafo ofrece el escape y su destino cotiza» |

### Medida del lote (`git diff --shortstat --no-renames 98b4f2f6` + `wc -l` de lo nuevo sin trackear)
Trackeado: 21 ficheros, 114 inserciones, 78 borrados (192). Sin trackear: `calibracionDirecta.ts` 44 + `calibracionDirecta.test.ts` 149 = 193.
Código y pruebas: **385**; con este `apply-progress.md` y las marcas de `tasks.md` queda por debajo de 720 (se mide de nuevo al cerrar, ver el mensaje de fase).
Regla de mutación 4: en `ticketCreate.ts`, `transitions.ts`, `controlCalidad.ts`, `estados.ts`, `ticketService.ts`, `estados.test.ts` ins = del; el único añadido de líneas en fichero muy citado es el final de `index.ts` y de `reentrancia.test.ts` (+29, al final).

### Desviaciones y avisos
1. Cinco vigilantes no listados en 1a.4 (arriba) y uno de producción tocado dentro de su línea: `estados.ts:142` (comentario) y `apps/desk/server/services/ticketService.ts:238` (comentario; lote 2 lo vuelve a ver).
2. D5 no se corrige: la medida coincide. Sólo se cambia «a medir» por «medido».
3. Quedan rojos FUERA de `packages/shared`, a cargo del lote 2 (tarea 2.5) — y uno que la tarea no nombra: `apps/desk/server/cargoPermiso.test.ts:266` (`expect(n).toBe(108)`, y su `diferencias`: con el interruptor apagado las dos nuevas darían `409`, ni 200 ni 403), además de `permisos.test.ts:368` y `:458` (972 → 1.026). No se ejecutaron (memoria de la máquina).

### Rojos del lote 1a vistos por el orquestador antes del verde (`npm test`: 14 fallos en 5 ficheros) y su verde
Todos editados dentro de su línea (ins = del); en cada caso las dos nuevas se ejecutan con el interruptor ENCENDIDO y, para que el caso no se rompa con la guarda del lote 2, con `tipo_servicio = 'Calibración'` y `orden_venta` sembrados.
- `permisos.test.ts` (8 pruebas, 23/23): `expected 114 to be 108`, `1026 to be 972`. Medido por ejecución: matriz de área **114 casos, 69 prohibidos, 45 permitidos**; compuesta sin cargo **114 = 70 / 44**; cargo × área × transición **1.026** (dos veces); las «36» pasan a 38. Verde.
- `cargoPermiso.test.ts` S21 (5/5): 108 → 114 celdas (38 × 3); mismo montaje que arriba. Verde, y la lista de `diferencias` no cambió (las nuevas dan 200 encendidas).
- `transicionesEjecucion.test.ts` (8/8): dos casos nuevos en `CASOS` (`calibracion_directa` Ingresado → En Proceso, `falla_calibracion` En Proceso → Rev./Diagnostico) y barrido de 42 → 44 ejecuciones. Verde.
- `flujoSoporteRemoto.test.ts` P8 (1/1): era sólo el contador (`expected 50 to be 48`), no un defecto del catálogo ni de la regla: las nuevas dan 409 desde `Solicitud Soporte`, y sólo `asignacion_soporte` da 200. Verde.
- `reconciliacion/registro.test.ts` 11f/05g (2/2): «en curso» pasa de NUEVE a DIEZ con F1C-08 (`calibracion-directa`, `cierra: si`, sin archivar). Verde.
Tras esto: `typecheck` 0, eslint limpio sobre los cinco ficheros.

## Lote 1b — hecho (1b.1 a 1b.4; la 1b.5, códigos en serie, la ejecuta el orquestador)

Intento I3b. Base del worktree `4f835bd0`. Ficheros: `packages/shared/src/controlCalidad.ts` (+función al FINAL; el import de tipo `Transition` en la línea 7, ya existente) y `packages/shared/src/invariantesGrafo.test.ts` (import en la línea 6 y describe nuevo al final).

### 1b.1 ROJO
Antes de escribir la función: `npx vitest run packages/shared/src/invariantesGrafo.test.ts` → 5 caen de 35 (30 verdes), todas con
`TypeError: (0 , entradasAPorFacturarSinControlCalidad) is not a function or its return value is not iterable`. Causa: función inexistente.
Cinco pruebas: encendido (tres rechazos, los tres Decisionales), apagado, sin `falla_calibracion` (dos), y las dos de catálogo ensuciado en memoria (M3).

### 1b.2 VERDE
`entradasAPorFacturarSinControlCalidad(ts, activo)` al final de `controlCalidad.ts` (tras el `export *`): BFS desde `En Proceso` por transiciones visibles
(`visibleConControlCalidad`) sin entrar en `Control de calidad`; devuelve las ids visibles con `to === 'Por Facturar'` y algún `from` alcanzado. Sin ciclo de módulos (`import type`).
Resultado: `invariantesGrafo.test.ts` 35/35 y `controlCalidad*` verdes.

### 1b.3 Mutaciones (`herramientas/mut.mjs`, restauradas, `restaurado=true`)
| Id | Mutación | Cae |
|---|---|---|
| M2 (propiedad) | `finalizacion_servicio && activo` → `&& false` (el interruptor deja de quitarla) | 2: «encendido: exactamente los tres rechazos…» y «sin falla_calibracion… son dos» |
| BFS entra en QA | el BFS deja de excluir `Control de calidad` | 2: las mismas |
| M3 en memoria | atajo sucio (`{ ...finalizacion_servicio, id: 'atajo_sucio' }`) sumado al catálogo de la prueba «son dos» | 1: «sin falla_calibracion… son dos» |
Las dos pruebas M3 propias del describe (atajo sucio desde `En Proceso`; Operativa desde `Rev./Diagnostico`) ensucian el catálogo en memoria y afirman que el conjunto gana la id: están en verde porque la función SÍ detecta el crecimiento.

### 1b.4
El recorrido HTTP (atajo → `envio_control_calidad` → `aprobacion_control_calidad` → `Por Facturar`) queda para el lote 2; aquí sólo el grafo.

### Desviación (aclaración de RQ-TS-56, no de su fondo)
El encargo y la spec dicen «apagado, además `finalizacion_servicio`». Medido: apagado el conjunto es `rechazo_comercial`, `rechazo_cliente` y `finalizacion_servicio`
(tres): `rechazo_revision` NO entra, porque el escape `falla_calibracion` también cuelga del interruptor (`controlCalidad.ts:105`) y apagado no es visible. «Además» es válido sólo respecto de los dos rechazos del catálogo previo. La prueba fija esos tres; la redacción de la delta podría decir «apagado, `finalizacion_servicio` en lugar de `rechazo_revision`» (pendiente de ajuste por el orquestador; no toqué la spec).

## Lote 2 — servidor (2.1 a 2.7; la 2.8, códigos en serie, la ejecuta el orquestador)

Intento I4. Base del worktree `0f33d25a`. Ficheros: `apps/desk/server/calibracionDirecta.test.ts` (nuevo, 288), `apps/desk/server/services/ticketService.ts` (19/5), `apps/desk/server/db/sla.ts` (1/1).

### 2.1 Línea base
Los barridos del lote 1a (`permisos`, `cargoPermiso`, `transicionesEjecucion`, `flujoSoporteRemoto`, `db/sla`, `controlCalidad`) se corrieron con la guarda ya puesta (ver 2.5), 6 ficheros / 157 pruebas en verde. No se corrió una base aislada ANTES de tocar `ticketService.ts` (el estado de partida es el que el orquestador dio por verde al cerrar 1a).

### 2.2 y 2.3 ROJO (antes de tocar `ticketService.ts`)
`npx vitest run apps/desk/server/calibracionDirecta.test.ts` → **10 caen de 26 (16 verdes)**; causa común: la guarda nueva no existe.
- `expected 200 to be 409`: «sin OV» (M1), «asociación LIBERADA no cuenta», «otro tipo no pasa» (`c1` Mantenimiento: `[ 'c1', 200 ]`), «otro tipo, el escape», CD-4.
- `expected 200 to be 422`: descripción en blanco (`[ 'en blanco', 200 ]`), «el 422 es UNO», y la mitad 422 de la prueba de control.
- `expected { Object (Descripción de la falla) } to not have property` (S-15: la descripción seguía en `tickets.custom_fields`).
- `expected 403 to be 409` (CD-3: condición (1) incumplida Y sin área contestaba el 403).
Verdes ya antes del servidor, por la cláusula del lote 1a (`controlCalidad.ts:105`): los dos «apagado → 409», CD-1, CD-2, CD-5, CD-6, las tres vías de OV, S-2, el recorrido a `Por Facturar`, el encadenado de cotización y S-16. **CD-2 y CD-6 sólo se prueban de verdad con las mutaciones P1/M2** (abajo): el rojo previo no es posible porque el interruptor ya existía.

### 2.4 VERDE
- `sla.ts:105`: `export` en `conAsociacionVigente` (1/1).
- `ticketService.ts`: `:5` import `tieneOrdenVenta, conAsociacionVigente` de `../db/sla`; `:6` suma `motivoNoCalibracionDirecta, erroresDescripcionFalla, CLAVE_DESCRIPCION_FALLA`; `:128` `; await exigirCalibracionDirecta(db, t, current.row)` tras `exigirInterruptorControlCalidad`; `:133` `delete plan.customFields[CLAVE_DESCRIPCION_FALLA]`; `:134` `errFalla` en el `if` y en `errors`; `exigirCalibracionDirecta` al FINAL (consulta de asociación sólo en el atajo y con las dos columnas vacías). Inserciones 19, borrados 5: las 5 son las líneas editadas dentro de sí mismas; el resto es el auxiliar final. Nada se desplaza.
- Resultado: `calibracionDirecta.test.ts` 26/26; `tsc -p apps/desk/tsconfig.server.json --noEmit` limpio.

### Códigos y mensajes de las guardas nuevas
| Guarda | Código | Mensaje |
|---|---|---|
| Atajo, tipo ≠ `Calibración` (exacto) | `409` | La calibración directa es sólo para tickets de tipo de servicio Calibración |
| Atajo, sin OV por ninguna de las tres vías | `409` | La calibración directa exige una orden de venta asignada al ticket |
| Escape, tipo ≠ `Calibración` | `409` | "Falla en calibración" es sólo para tickets de tipo de servicio Calibración |
| Interruptor apagado (las dos; ya del lote 1a) | `409` | La calibración directa y su escape dependen de control de calidad, que está apagado |
| Descripción de sólo espacios | `422` (`errors`) | "Descripción de la falla" no puede estar en blanco |
| Descripción ausente o vacía (ya existía) | `422` | Falta el campo obligatorio: Descripción de la falla |

### 2.5 Barridos
No hizo falta tocar nada más: `permisos.test.ts` (38 × 3, 114/1.026), `cargoPermiso.test.ts` S21 (114), `transicionesEjecucion.test.ts` (44) y `flujoSoporteRemoto.test.ts` ya siembran tipo y OV y encienden la app (lote 1a) y siguen verdes con la guarda. Además `db/sla.test.ts`, `controlCalidad.test.ts`, `comentariosVigilados.test.ts`, `ordenVentaUnTicket.test.ts`: verdes.

### 2.6 S-16
Dos pruebas en `calibracionDirecta.test.ts`: un ticket que tomó el atajo (traza real por HTTP) da el indicador 49 `sin_dato`; contraste con `ingreso_a_servicio` y la misma revisión, que da `valor`.

### 2.7 Mutaciones (`herramientas/mut.mjs`, todas `restaurado=true`; `git status` tras todas: sólo los 3 ficheros del lote)
| Id | Mutación | Cae |
|---|---|---|
| M1 | `tieneOrdenVenta: true` | «sin OV» (M1), «asociación liberada», CD-3 |
| M1b | sólo `orden_venta` y sin asociación | «la OV por cualquiera de las tres vías» |
| M1c | sin la vía de asociación | la misma |
| M7a | `errFalla` fuera del `if` | «ausente, vacía o en blanco», «el 422 es UNO», control 422 |
| M7b | `errFalla` fuera de `errors` | las dos primeras |
| M7c | `required: false` en el catálogo | «ausente…» (servidor) y «único obligatorio» (compartido) |
| M8 | sin el `delete` | «la descripción va a la traza y NO al ticket» |
| M2 | sin la cláusula de `controlCalidad.ts:105` | 2 «apagado → 409», CD-2, CD-6 y la pura del lote 1a |
| P1 | guarda nueva antes del interruptor | CD-2 |
| P2 | guarda nueva tras el `403` de área | CD-3 |
| P3 | guarda nueva tras el `422` agregado | CD-3 y CD-4 |
| M5 | `tipoServicio: 'Calibración'` fijo | «otro tipo no pasa», «otro tipo, el escape», CD-4 |
| M3 | atajo `Ingresado` → `Por Facturar` | recorrido HTTP (RQ-TS-56), «encendido, el atajo deja… En Proceso», «apagar con un ticket ya en el atajo…», catálogo |
| M3b | atajo también desde `En Proceso` a `Por Facturar` | la propiedad D6 (2: «los tres rechazos» y «son dos») además de lo anterior |
| M4 | sin `falla_calibracion` | 20 (grafo, cifras, «apagado, el escape»…) |
| M4b | escape → `Por Facturar` | «el grafo ofrece el escape y su destino cotiza», D6, «el destino lleva a cotizar» (HTTP) |
Observación: M3 puro (atajo `Ingresado` → `Por Facturar`) NO lo ve la propiedad D6 porque `Ingresado` no se alcanza desde `En Proceso`; lo ve el recorrido HTTP. M3b sí cae en la propiedad.

### Desviaciones del diseño
1. **«Un único 422 lista los dos» no es realizable con `falla_calibracion`**: su único obligatorio es la descripción, y ausente (`plan.errors`) y en blanco (`errFalla`) son excluyentes; no hay segundo error de contenido posible para una Calibración. La prueba afirma `errors` igual a `["\"Descripción de la falla\" no puede estar en blanco"]` y M7a/M7b/M7c la hacen caer. La spec (RQ-TS-55, escenario) pide «otro campo obligatorio ausente»: queda para ajuste del orquestador.
2. La firma del auxiliar recibe `row` con `salesorder_id?` opcional (`TicketRow` lo declara opcional).
3. «Escape sin tomar el atajo» se siembra directo en `En Proceso` (tipo Calibración), no recorriendo ingreso/cotización/aprobación.
4. 2.1 sin base aislada previa (ver arriba).

### Medida del lote (`git diff --shortstat --no-renames 0f33d25a` + `wc -l` de lo nuevo sin trackear)
Trackeado: 2 ficheros, 20 inserciones, 6 borrados (26). Sin trackear: `calibracionDirecta.test.ts` 288. **Código y pruebas: 314**; con este apartado y las marcas de `tasks.md` (~+75) queda en ~390, por debajo de 720.
