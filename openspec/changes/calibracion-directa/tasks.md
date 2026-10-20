# Tareas — `calibracion-directa` (F1C-08, `cierra: si`)

`strict_tdd`: cada lote abre con su prueba en ROJO, vista y anotada en `apply-progress.md` con la salida y la causa; luego el VERDE.
D* son de `design.md`; RQ-* y CD-* de las deltas `specs/*/spec.md`. Las mutaciones se hacen con `herramientas/mut.mjs` (restaura y
comprueba); nunca `git checkout` ni `git stash`. Nada desplaza líneas de ficheros muy citados (D10): se edita dentro de la línea o al final.
Cada lote cierra con «códigos EN SERIE: typecheck, lint, detector, test» (los ejecuta el orquestador, uno tras otro, por la memoria de
la máquina), `apply-progress.md` y la medida `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear. Estimación D12 (ingenua × 1,8): lote 1 = 630 > 600, así que se parte en 1a y 1b (D13).

## Lote 1a — catálogo, regla pura, interruptor, reentrancia, cifras (intento I3; ~280 × 1,8 = 504)

- [x] 1a.1 Línea base: `npx vitest run packages/shared` en verde y `npm run typecheck` en 0 (antes de tocar nada).
- [x] 1a.2 ROJO: `packages/shared/src/calibracionDirecta.test.ts` (RQ-TS-52, RQ-PM-39 pura, D2): tipos, áreas, `from`/`to`, descripción como único
      obligatorio; campos de `calibracion_directa` iguales a los de `ingreso_a_servicio` (molde H5); `ingreso_a_servicio` sin cambio;
      ninguna en `DERIVACION_POR_DEFECTO`; `CLAVE_DESCRIPCION_FALLA` es la key del catálogo; `motivoNoCalibracionDirecta` (sin OV, otro
      tipo, `calibración` en minúscula, escape con otro tipo, otra id → `null`); `erroresDescripcionFalla`; cláusula del interruptor.
      Rojo por módulo inexistente.
- [x] 1a.3 ROJO (reentrancia, RQ-TS-57): `reentrancia.test.ts` (`:27-40`, `:55-68`, `:77-81` invertida, `:83-85`, `:92-100`),
      `invariantesGrafo.test.ts:137-150`, `bodegaje.test.ts:113` con las cifras de D5 (1 ciclo de 12 estados, 13 transiciones, 12
      campos reentrantes, 10/2). **La prueba confirma por ejecución** las cifras calculadas a mano en D5: se corre en rojo ANTES de
      escribir ningún número en un vigilante, se anota lo medido, y si difiere gana la medida (se corrige D5 y la spec en el mismo commit).
      La prueba declara que el efecto viene de `falla_calibracion` (R-1). Prueba de alcance: desde `Rev./Diagnostico` se llega a `notif_cliente_comercial` (RQ-TS-55 grafo).
- [x] 1a.4 ROJO (cifras, RQ-TS-58): vigilantes en su línea: `cifrasAncladas.test.ts`, `estados.test.ts:146-149` (`toContain` →
      `not.toContain`, comentario `:142-144`), `invariantesGrafo.test.ts:172-174` (unión 48 → 50), `mapaBlueprint.test.ts:52`/`:184`
      (44 → 46), `transitions.test.ts`, `decisionales.test.ts` (16 sin cambio), derivación 5/33. Rojo por los conteos 36/38, 50/52, 17/19.
- [x] 1a.5 VERDE: `calibracionDirecta.ts` (D2) y `export * from './calibracionDirecta'` al final de `index.ts`; `export ` en `ticketCreate.ts:51`;
      los dos objetos en `transitions.ts:262` (misma línea, comentario «F1C-08 (RQ-TS-52)»); cláusula al final de `controlCalidad.ts:105`
      e import en `:7`. Confirmar que `tsc` no da ciclo de módulos (hipótesis de D2).
- [x] 1a.6 `cifras_ancladas` en `openspec/config.yaml` (38 / 23 / 46, 52 filas, 19·16·13·4, 10 con una salida): sólo ese bloque. Mapa
      regenerado con `scripts/generar-mapa-blueprint.ts` (`docs/artefactos/blueprint-*.md`); su prueba anti-desfase en verde.
- [x] 1a.7 Mutaciones: M2 (quitar la cláusula de `controlCalidad.ts:105`: cae «apagado… 409» y visibilidad pura); M5 (`!== null` en vez de
      `=== TIPO_CALIBRACION`: cae «otro tipo no pasa», con Mantenimiento, Garantía, sin tipo y `calibración`); M1 en la regla pura (sin
      chequeo de OV: cae «sin OV el atajo no pasa»); M4 (quitar `falla_calibracion`, o llevarla a `Por Facturar`/`Finalizado`: cae «el grafo
      ofrece el escape y su destino cotiza»). Rojas y restauradas.
- [ ] 1a.8 Códigos EN SERIE: typecheck, lint, detector, test. Medida y línea de estimación: **~504 líneas (bajo 800)**.

## Lote 1b — condición (3) como propiedad del grafo (intento I3b; ~60 × 1,8 = 108)

- [ ] 1b.1 ROJO: `entradasAPorFacturarSinControlCalidad` en la prueba de `invariantesGrafo.test.ts` (RQ-TS-56, D6): con `activo = true` el
      conjunto es exactamente `rechazo_comercial`, `rechazo_cliente`, `rechazo_revision`, las tres Decisionales; con `activo = false`, además
      `finalizacion_servicio`; sin `falla_calibracion` en memoria, son dos. Rojo por función inexistente.
- [ ] 1b.2 VERDE: función al final de `controlCalidad.ts` (tras el `export *` de `:114`), BFS por transiciones visibles sin entrar en `Control de calidad`.
- [ ] 1b.3 Mutación 2 sobre el catálogo en memoria (M3): añadir `{ ...finalizacion_servicio, id: 'atajo_sucio' }` o una Operativa de
      `Rev./Diagnostico` a `Por Facturar`: el conjunto gana una id y la prueba cae. Y la variante «el interruptor deja de quitar
      `finalizacion_servicio`» (M2 en la propiedad). Rojas y restauradas.
- [ ] 1b.4 Escenario de RQ-TS-56 «recorre atajo, `envio_control_calidad` y `aprobacion_control_calidad` hasta `Por Facturar`» queda para el HTTP del lote 2; aquí sólo el grafo.
- [ ] 1b.5 Códigos EN SERIE: typecheck, lint, detector, test. Estimación: **~108 líneas (bajo 800)**.

## Lote 2 — servidor (intento I4; ~310 × 1,8 = 558)

- [ ] 2.1 Línea base: suite del servidor en verde con el lote 1 aplicado.
- [ ] 2.2 ROJO: `apps/desk/server/calibracionDirecta.test.ts` HTTP (RQ-TS-53/54/55, RQ-PM-38/40/41): apagado, atajo y escape dan `409`
      (distinto del de estado); encendido, el atajo deja `En Proceso` con traza; sin OV `409`; OV por cada una de las tres vías (sólo
      `orden_venta`, sólo `salesorder_id`, sólo asociación vigente); otro tipo `409`; contenido de la OV no se lee (S-2); apagar con
      un ticket ya en `En Proceso` no vara `diagnostico_complementario` ni `notif_recotizacion`; escape con descripción (queda en
      `Rev./Diagnostico`, descripción en la traza y NO en el ticket, S-15); ausente, vacía y en blanco → `422`; un único `422` lista dos errores;
      encadenado `escalado_a_revision` → `escalado_a_comercial` → `notif_cliente_comercial`; atajo → `envio_control_calidad` →
      `aprobacion_control_calidad` → `Por Facturar` y `finalizacion_servicio` `409` (RQ-TS-56). Rojo por `404`/ids inexistentes en servidor.
- [ ] 2.3 ROJO de posición, cada una activando DOS guardas a la vez (regla de mutación 1): CD-1 (estado < interruptor), CD-2 (interruptor <
      condición (1)), CD-3 (condición (1) < `403` de área), CD-4 (tipo del escape < `422`), CD-5 (`403` de área < `422` de la descripción),
      CD-6 (interruptor < `422`). Rojo porque la guarda nueva aún no existe.
- [ ] 2.4 VERDE: `export ` en `apps/desk/server/db/sla.ts:105` (`conAsociacionVigente`); `exigirCalibracionDirecta` al final de `ticketService.ts`
      (molde `:285-288`) y llamada en `:128` tras `exigirInterruptorControlCalidad`; `delete plan.customFields[CLAVE_DESCRIPCION_FALLA]` en `:133`;
      `errFalla` en el `if` y en `errors` de `:134`; imports al final de `:5` y `:6`. Consulta de asociación sólo en el atajo y con las dos columnas vacías (D3).
- [ ] 2.5 Barridos HTTP: `permisos.test.ts` (matriz de transiciones × áreas con las dos nuevas; vigilantes de recuento) y
      `transicionesEjecucion.test.ts` (sembrar tipo «Calibración» y OV; app encendida para las dos).
- [ ] 2.6 Caracterización de S-16: el indicador 49 «Tiempo de diagnóstico» queda sin dato en tickets del atajo (`bodegaje.ts:94`, `:225-226`; `indicadores.ts:54`, `:133`).
- [ ] 2.7 Mutaciones: M1 (el servidor pasa `tieneOrdenVenta: true`) y M1b (sólo `orden_venta`): caen «sin OV…» y los casos de una sola vía; M7
      (`errFalla` fuera del agregado, o `required: false` en el catálogo): cae «descripción en blanco, 422» y «un único 422»; M8 (sin el `delete` de
      `:133`): cae «la descripción vive en la traza, no en el ticket»; M2 por HTTP: caen CD-2 y CD-6; **P1** (la guarda nueva antes del interruptor)
      cae en CD-2; **P2** (tras el `403` de área, `:129`) cae en CD-3; **P3** (tras el `422` agregado, `:134`) cae en CD-4 y CD-3; atajo para otro tipo (M5): cae «otro tipo no pasa»; atajo que se salta Control de calidad (M3): cae la propiedad y el recorrido HTTP; sin escape (M4) o escape que no cotiza: cae «el destino lleva a cotizar».
- [ ] 2.8 Códigos EN SERIE: typecheck, lint, detector, test. Estimación: **~558 líneas (bajo 800)**.

## Lote 3 — cliente, DEPLOY.md y cierre de citas (intento I5; ~45 × 1,8 = 81)

- [ ] 3.1 Cliente (D7): `TransitionPanel.tsx:57` gana `&& visibleCalibracionDirecta(...)` con `delTicket['Tipo de Servicio']` y `delTicket['Orden de Venta']`; import al final de `:3`. Sin prueba (`.tsx` fuera de la red, F0-00); lo cubre `npm run typecheck`.
- [ ] 3.2 ROJO y VERDE: `DEPLOY.md` §16 (`:776`), al final: la ruta directa y su escape cuelgan de `CONTROL_CALIDAD_LIBERACION`; qué enciende y qué se rompe. Si existe vigilante de presencia
      (molde de F1C-07), ROJO mutando el FICHERO vigilado (borrar la mención): se pone rojo; sin vigilante, se anota.
- [ ] 3.3 Tabla de la regla 13 (D8) cerrada decisión a decisión con la línea del servidor, en `apply-progress.md` (regla de mutación 3).
- [ ] 3.4 Barrido de la regla de mutación 4 (M9): `git diff --numstat` con inserciones = borrados en `transitions.ts`, `ticketService.ts` (salvo
      el final), `controlCalidad.ts` (salvo el final), `ticketCreate.ts`, `sla.ts`, `estados.test.ts`, `TransitionPanel.tsx` y los demás que se toquen; para cada uno
      `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` con cada resultado leído contra el fichero, más el pase de las abreviadas. Releer las citas a `ticketService.ts:128`, `:133-134`,
      `controlCalidad.ts:103-107`, `:105`, `transitions.ts:262`, `sla.ts:105-110`, cuyo TEXTO cambia.
- [ ] 3.5 Caso A: comentarios y citas con cifras (`estados.test.ts:142-144` «diez»); `npm run build` y diferencia del paquete.
- [ ] 3.6 Códigos EN SERIE: typecheck, lint, detector, test. Estimación: **~81 líneas (bajo 800)**. (Verify, I6, y archive, I7, son fases del ciclo, no tareas de este recuento.)

## Fuera del recuento — de personas (Regla del ciclo 1; **archivar no las da por hechas**)

- Gerencia: corregir en una semana la lista de supuestos S-1..S-16 (S-10..S-16 nuevos; en especial S-5/S-13 destino del escape y S-14 lectura de la condición (3)). Destino: parte semanal, grupo F1C-08.
- Gerencia: encender `CONTROL_CALIDAD_LIBERACION` (también enciende el atajo y el escape) junto con `DECISIONALES_POR_CARGO`.
- Supervisión: añadir la línea del interruptor a `.env.example` (esta sesión no puede editarlo).
- Supervisión: corrección de M2.1 del maestro (`R08.4.md:2285-2288`) como texto en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, para que Gerencia la pegue.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (×1,8) | 1a 504 · 1b 108 · 2 558 · 3 81 = 1.251 |
| 400-line budget risk | Medium (todos los lotes bajo 800; el 1a se parte para no pasar de 600) |
| Chained PRs recommended | No: un intento por lote en un worktree, una fusión al cerrar |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
