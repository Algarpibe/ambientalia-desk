# Tareas — `salidas-esperas` (F1C-03, `cierra: si`)

`strict_tdd`: cada lote abre con su prueba en ROJO, vista y anotada en `apply-progress.md` (salida y causa); luego el VERDE mínimo.
D* son de `design.md`; RQ-* de las deltas `specs/*/spec.md`; M* son las mutaciones obligatorias (se hacen con `herramientas/mut.mjs`,
que restaura y comprueba; nunca `git checkout` ni `git stash`). Nada desplaza líneas de ficheros muy citados (D1): se edita dentro de la
línea o al final. Cada lote es un intento del registro, con techo 800 y válvula 720 (estimación D8 ingenua × 1,8); si un lote mide
más de 600 antes de cerrar, sus pruebas de caracterización salen a un intento propio. Todo se ejecuta en el worktree
`C:\dev\Desk_2_R1.023-worktrees\salidas-esperas`.

**Cierre de lote (X.c):** códigos EN SERIE, uno tras otro: `npm run typecheck`, `npm run lint`,
`npx tsx apps/desk/server/citas/cli.ts --sha HEAD`, `npm test`; `apply-progress.md`; medida `git diff --shortstat --no-renames <base>`
más `wc -l` de lo nuevo sin trackear (binarios aparte). Commit en la rama al cerrar.

## Lote I3a — catálogo, interruptor (ids y visibilidad), config, plazos, cifras (~320 × 1,8 = 576; ≤ 720)

Ficheros: `transitions.ts:262` y `:330`, `config.ts:66`/`:125`, `appHarness.ts:46`/`:49`, `salidasEsperas.ts` (sólo constantes y
`motivoQuitada…`/`visibleConSalidasEsperas`), `plazosEsperas.ts`, `controlCalidad.ts:121-122` y `:7`, `index.ts:52`, `estados.ts:142`/`:145`/`:154`/`:158`,
`ticketService.ts:238` (comentario), vigilantes de D6 de `shared`, `cifras_ancladas` en `openspec/config.yaml`, mapa del blueprint.

- [x] I3a.1 Línea base: `npx vitest run packages/shared` en verde y `npm run typecheck` en 0, antes de tocar nada.
- [x] I3a.2 ROJO `packages/shared/src/salidasEsperas.test.ts` (RQ-TS-60, RQ-TS-61 pura): ids, áreas (`Comercial`/`Servicio Técnico`), `tipoEvento`
      (`Decisional`/`Compras / Logístico`), `fields: [comment()]`, ninguna en `DERIVACION_POR_DEFECTO` (heredan), `IDS_SALIDAS_NUEVAS`,
      `motivoQuitadaPorSalidasEsperas` (apagado → texto del D2; encendido o id ajena → `null`), disjunción `IDS_SALIDAS_NUEVAS ∩
      (IDS_CALIBRACION_DIRECTA ∪ {envio_control_calidad, finalizacion_servicio}) = ∅`. Rojo por módulo inexistente.
- [x] I3a.3 ROJO (RQ-TS-62/63 y c3): `invariantesGrafo.test.ts` (`:50-53`, `:172-174`, bloque nuevo al final: encendido, 4 entradas a `Por Facturar` sin CC con
      `cobro_diagnostico_espera`, tercer parámetro por defecto `false`), `mapaBlueprint.test.ts:52`/`:184`, `tipoEvento.test.ts`, `transitions.test.ts:123`/`:126`,
      `estados.test.ts:142-147`/`:177-179`, `cargos.test.ts:204-205`, `prioridad.test.ts:118-120`, `transitionsSoporteRemoto.test.ts`, `cifrasAncladas.test.ts`
      (40/23/49), `comentariosVigilados.test.ts`. **Se corren en rojo ANTES de escribir un número**; se anota lo medido y, si difiere de D6, gana la medida
      (se corrige D6 y la spec en el mismo commit). Confirmar por ejecución `reentrancia.test.ts` y `bodegaje.test.ts` (hipótesis sin cambio de D6).
- [x] I3a.4 ROJO `plazosEsperas.test.ts` (RQ-AV-25): plazos literales ER 79, `Solicitado` 13, SE 31, SKU 20; `MEDICION_PLAZOS_ESPERAS`; `diasEnEspera`; `esperaVencida = dias >= plazo`;
      disjunción `ESTADOS_SIN_SALIDA ∩ claves(SLA_HORAS_POR_ESTADO) = ∅` y `∩ claves(ALARMAS_SLA) = ∅`; prueba de fuente: el módulo no importa `sla.ts`.
- [x] I3a.5 VERDE: las dos transiciones en `transitions.ts:262` (misma línea, comentario «F1C-03 (RQ-TS-60)»); `|| t.id === 'cobro_diagnostico_espera'` en `areasSiguientes`
      (`:330`, S-22); `salidasEsperas` en `config.ts` (`=== 'true'`, nace cerrado); `appHarness` lo acepta en `false`; `salidasEsperas.ts` parcial; `plazosEsperas.ts`;
      tercer parámetro en `controlCalidad.ts:121`; `index.ts:52`; comentarios en sitio de `estados.ts` y `ticketService.ts:238`. Confirmar que `tsc -b` no da ciclo.
- [x] I3a.6 `cifras_ancladas` y `config.yaml:1361-1362`/`:1368` (46 → 49, 38 → 40) sólo en esos bloques; `npm run generar-mapa-blueprint`; su prueba anti-desfase en verde.
- [x] I3a.7 Mutación M5 (RQ-TS-60/63): añadir al catálogo en memoria una salida `anulacion` o de abandono desde `Solicitado` o desde SKU (o quitar `sin_pieza_en_almacen`):
      debe caer el bloque de c3 de `invariantesGrafo.test.ts` (las cuatro entradas) y `estados.test.ts` (nueve/cinco). Roja y restaurada.
- [x] I3a.8 Mutación M6 (RQ-AV-25): hacer que `PLAZO_DIAS_ESPERA` se derive de `SLA_HORAS_POR_ESTADO` (importarlo): debe caer la prueba de fuente de I3a.4 y la
      disjunción. Roja y restaurada.
- [x] I3a.9 Mutación sobre el catálogo en memoria (RQ-TS-63): añadir `{ ...finalizacion_servicio, id: 'atajo_sucio' }` a `Por Facturar`: cae `entradasAPorFacturarSinControlCalidad`. Roja y restaurada.
- [ ] I3a.c Cierre de lote. Estimación: **~576 líneas (bajo 720)**.

## Lote I3b — ejecutor, motivo del respaldo, compuesta, despliegue (~255 × 1,8 = 459; ≤ 720)

Ficheros: `salidasEsperas.ts` (resto), `salidasEsperas.test.ts` ampliada, `DEPLOY.md` §17, `.env.example`, `deploySalidasEsperas.test.ts` (nuevo),
`deployControlCalidad.test.ts:14`/`:17-20`.

- [ ] I3b.1 ROJO (RQ-PM-42/43 puras): `ejecutorDeSalida` — `null` apagado o fuera de alcance; `persona_a_cargo` (id = `derivadoA` y área); `respaldo` (admin o cargo de
      `cargosDecisionales(areaDeDecision(t), vacante)`); `denegado` con el mensaje de D2; derivado nulo/inactivo/ajeno = sólo pasa (b) (S-2); `areaDeDecision` no es `null` para las tres;
      `anulacion` desde `Rev./Diagnostico` NO es salida de espera; `erroresMotivoRespaldo` (ausente, en blanco, persona a cargo con texto → mensaje; `null`/`denegado` → `[]`);
      `puedeEjecutarConSalidasEsperas` frente a `puedeEjecutarTransicionConDecisionales` intacta. Rojo por funciones inexistentes.
- [ ] I3b.2 VERDE: `ejecutorDeSalida`, `erroresMotivoRespaldo`, `CAMPO_MOTIVO_RESPALDO` (fuera del catálogo), `puedeEjecutarConSalidasEsperas`, `SALIDAS_ESPERAS_APAGADO`.
- [ ] I3b.3 ROJO `deploySalidasEsperas.test.ts` (molde `deployControlCalidad.test.ts`): `DEPLOY.md` §17 con «**Qué enciende:**», «**Qué se rompe si se pone mal:**», «**Nace cerrado**»
      y `> SALIDAS_ESPERAS=`; `.env.example` con la variable tras `:43` y sus dos frases; `deployControlCalidad.test.ts` deja de exigir que §16 sea la última (se acota hasta §17).
- [ ] I3b.4 VERDE: §17 tras §16 (`DEPLOY.md:776`) y `.env.example`; texto en español neutro.
- [ ] I3b.5 Mutación 2 sobre el FICHERO VIGILADO (regla de mutación 2): ensuciar `DEPLOY.md` (quitar «Nace cerrado» de §17, o poner la variable sin `>`) y `.env.example` (borrar la variable,
      o dejarla en `=true`): debe ponerse roja `deploySalidasEsperas.test.ts`. Restaurar los dos ficheros.
- [ ] I3b.6 Mutaciones de la regla pura: (M7a) cambiar `s.id === tk.derivadoA` por `!== `: cae «persona a cargo»; quitar el chequeo de área de (a): cae «derivado de otra área»;
      (M7b) dejar `esSalidaDeEspera` aceptando `anulacion` desde `Rev./Diagnostico`: cae «fuera de alcance».
- [ ] I3b.c Cierre de lote. Estimación: **~459 líneas (bajo 720)**.

## Lote I4 — servidor, ruta de contexto y cliente (~325 × 1,8 = 585; ≤ 720)

Ficheros: `ticketService.ts:128`/`:131`/`:134` y auxiliares al final y de `:6`, `services/decisionales.ts` (final), `routes/permisosSalidasEsperas.ts` (nuevo), `app.ts:22`/`:61`,
`apps/desk/src/api/client.ts` (final), `TransitionPanel.tsx:3`/`:8`/`:55`/`:57`/`:179`, `salidasEsperas.test.ts` HTTP, barridos de `permisos.test.ts`, `cargoPermiso.test.ts`,
`transicionesEjecucion.test.ts`, `flujoSoporteRemoto.test.ts`.

- [ ] I4.1 Línea base: suite del servidor en verde con I3a/I3b aplicados.
- [ ] I4.2 (parcial, adelantado en I3a: interruptor 409 y encendido pasa por el área) ROJO `apps/desk/server/salidasEsperas.test.ts` HTTP (RQ-TS-61/64, RQ-PM-42..45): apagado → `409` distinto del de estado en las dos nuevas; encendido, `cobro` desde `Servicio externo`
      y `sin_pieza` desde `Solicitado` dejan la traza con `performed_by_id`; `anulacion` desde ER/SE: persona a cargo sin motivo pasa, respaldo sin motivo `422`, respaldo con motivo pasa
      y el texto llega a la traza y NO a `custom_fields` (S-13); persona a cargo con motivo `422` (S-14); extraño `403` con el mensaje del ejecutor; DPC encendido: persona a cargo sin cargo
      pasa `cobro`, `rechazo_comercial` sigue igual (RQ-PM-43); vacante del Coordinador Técnico (S-21); `anulacion` desde `Rev./Diagnostico` sigue Decisional por cargo. Rojo por ids/guardas inexistentes.
- [ ] I4.3 (parcial, adelantado en I3a: SE-0 y SE-1) ROJO de posición, cada par activando DOS guardas a la vez (regla de mutación 1): SE-0 estado < interruptor; SE-1 interruptor < área; SE-2 área < ejecutor; SE-2b ejecutor < Decisionales
      (DPC encendido, Comercial sin cargo ni derivado en `cobro` → mensaje del ejecutor, no `mensajeDecisional`); SE-3 ejecutor < `422`; SE-5 un único `422` con `anulacion` sin «Motivo de anulación» y sin motivo del respaldo.
      Pares sin prueba posible declarados en el test (D3: lista corta, firma CC, prioridad, CC/calibración).
- [ ] I4.4 (parcial, adelantado en I3a: sólo los barridos HTTP con salidasEsperas: true, sin derivado_a) ROJO de la ruta `GET /api/permisos/salidas-esperas` (activo + vacante, misma función que la guarda) y de los barridos HTTP de D6 (`permisos` ×2 → 120 / 1.080, `cargoPermiso`,
      `transicionesEjecucion` 44 → 47, `flujoSoporteRemoto`) con `salidasEsperas: true` y `derivado_a` = usuario de la sesión; `anulacion` sigue en la app apagada.
- [ ] I4.5 (parcial, adelantado en I3a: sólo exigirInterruptorSalidasEsperas en ticketService.ts:128) VERDE: guardas en `ticketService.ts:128`, `:131` y `:134` y auxiliares (`exigirInterruptorSalidasEsperas`, `veredictoEjecutorSalida`, `exigirEjecutorSalida`); `contextoSalidasEsperas`; ruta y registro
      en `app.ts`; `getContextoSalidasEsperas`; `TransitionPanel` (estado `salidas`, compuesta, `visibleConSalidasEsperas`, campo del motivo). Imports al final de su línea.
- [ ] I4.6 Mutaciones de posición (M7, regla de mutación 1): mover cada guarda nueva antes y después de su vecina: `exigirInterruptorSalidasEsperas` antes de `exigirInterruptorControlCalidad`
      (cae SE-0), antes del área (SE-1), `exigirEjecutorSalida` antes de `cargoFalta` (SE-2), después de Decisionales (SE-2b), `errRespaldo` antes del `403` (SE-3), fuera del agregado (SE-5). Cada una debe poner roja su prueba.
- [ ] I4.7 Mutación de condición: Decisionales aplicado también con `ejecutor` (quitar `!ejecutor`): cae RQ-PM-43; `denegado` tratado como `respaldo`: cae el `403`.
- [ ] I4.8 Tabla de la regla 13 por escrito (regla de mutación 3), decisión a decisión, con la línea REAL del servidor tras editar: oculta las dos con interruptor apagado → `ticketService.ts:128`;
      oculta a quien no es persona a cargo ni respaldo → `:131`; ofrece `cobro` a la persona a cargo sin cargo → `:131`; pide/no pide «Motivo del respaldo» → `:134`; vacante → `services/decisionales.ts`;
      sin respuesta de la ruta, apagado (S-20, degradación declarada). Se pega en `apply-progress.md` y en el `verify`.
- [ ] I4.c Cierre de lote. Estimación: **~585 líneas (bajo 720)**.

## Lote I5 — alarma de caducidad, cableado, barrido de citas (~335 × 1,8 = 603; ≤ 720)

Ficheros: `db/esperasVencidas.ts`, `services/avisoSalidasEsperas.ts` (nuevos), `index.ts:88`/`:15`, `plazosEsperas.ts` (textos `textoAvisoEspera`, `ALARMA_ESPERA`), sus pruebas, corrección del maestro (D13).

- [ ] I5.1 ROJO `esperasVencidas.test.ts` y `avisoSalidasEsperas.test.ts` (RQ-AV-26/27, BD real o harness): entrada = último paso de `secuenciaDelReloj` (funde app y Zoho; sin secuencia no se mide, S-16);
      vencida a `dias >= plazo` y no antes; un aviso por (ticket, estado, `entrada_at`) vía `marcarYAvisarAlarma`; reentrada da otra `entrada_at` y otro aviso; destinatarios por cargo (+ derivado de Comercial en externas;
      área de respaldo sólo sin cargos, S-19); lista vacía no marca y se reintenta (S-18); apagado no consume el día; una pasada por día civil; un fallo en un ticket no para a los demás; sólo bandeja (S-17).
- [ ] I5.2 ROJO de textos (D4 d): externas nombran la decisión («cobrar el diagnóstico o anular»); internas (`Solicitado`, SKU) NO nombran `Anulado`, `Por Facturar`, «anular» ni «cobrar»; la clase sale de `enEsperaDe`, sin redeclararla.
- [ ] I5.3 ROJO «nunca ejecuta»: dos pasadas sobre un vencido en cada espera, ningún `status` cambia y `ticket_transitions` no gana filas; prueba de fuente (molde `comentariosVigilados.test.ts:22`): los dos ficheros
      nuevos no importan `ticketService`, `applyTransition` ni `writeTransition` y no contienen `UPDATE tickets` ni `INSERT INTO ticket_transitions`.
- [ ] I5.4 VERDE: `ticketsEnEspera(db)` (tres consultas fijas, molde `relojSla.ts:75-85`), `pasadaSalidasEsperas` (molde `avisoFacturacionVencida.ts:53-81`), cableado en `index.ts:88` tras `pasadaFacturacionVencida`.
- [ ] I5.5 Mutación M1 (RQ-AV-26): hacer que la pasada llame a `applyTransition`/cambie el `status` al vencer: cae «nunca ejecuta» (comportamiento y fuente). Roja y restaurada.
- [ ] I5.6 Mutación M2 (RQ-AV-26): `esperaVencida` con `dias >= plazo - 1` (aviso antes del plazo): cae el escenario «un día antes no avisa». Roja y restaurada.
- [ ] I5.7 Mutación M3 (RQ-AV-27): quitar el `INSERT` de `marcarYAvisarAlarma` (o avisar sin marcar) en la segunda pasada: cae «un solo aviso por vencimiento». Roja y restaurada.
- [ ] I5.8 Mutación M4 (RQ-AV-26): texto de `Solicitado`/SKU con «anular» o «cobrar» (espera interna que sugiere salida en vez de escalar): cae la prueba de textos. Roja y restaurada.
- [ ] I5.9 Corrección del maestro (D13) y nota R-7 de `estados.ts:131-140` para el `archive-report`; sin tocar el `.docx`.
- [ ] I5.10 **Barrido de citas (regla de mutación 4)** al cerrar, sobre los muy citados que se tocaron: `transitions.ts`, `estados.ts`, `ticketService.ts`, `config.ts`, `controlCalidad.ts`, `DEPLOY.md`
      (y `schema.sql` sólo si se tocara). Para cada uno: `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"`, cada resultado leído contra el fichero (qué AFIRMA la frase, principio y final del rango por separado),
      segundo pase de abreviadas en los ficheros que ya citan el módulo, casos A/B/C; el detector no basta.
- [ ] I5.c Cierre de lote. Estimación: **~603 líneas (bajo 720)**.

## I6 — verify y I7 — archive

- [ ] I6.1 `sdd-verify` en su intento propio: PASS contra RQ-TS-56/60..64, RQ-PM-42..45, RQ-AV-25..27; las mutaciones M1-M8 reportadas rojas y restauradas; tabla de la regla 13 contrastada línea a línea; códigos en serie; el informe cuenta en la estimación.
- [ ] I7.1 `sdd-archive` con techo 2 × carpeta + 800 (la mudanza cuesta el doble por `--no-renames`). Regla del archivo: lo revisable (fusión del delta en las specs vivas + `archive-report.md`)
      ≤ 800, medido ANTES de aplicar con `git diff --shortstat --no-renames`; si lo supera, se para y se consulta. Fusión por script comparando bloques; informe escrito por mí; códigos de salida antes de asentar.
      `archive-report.md` con UNA línea de qué cubrió de F1C-03 (sostiene `cierra: si`); `git show --numstat` del commit de archivo: sólo el cambio archivado. Sin sacar a nadie del recuento (ver abajo).

## Tareas de persona (fuera del recuento)

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar no las da por hechas.**

| Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Preguntas S-1, S-2 y S-12 al apartado 06 del panel (sólo las que frenan; el resto, supuesto reversible con plazo semanal, E-237) | Gerencia | decisión en `decisiones_de_gerencia` | `openspec/config.yaml` y `docs/sdd/ENTRADA.md` |
| Prueba en la app al final (lista acumulada, F1C-03 se suma tras F1C-01) | Gerencia / verificación | paso a paso sobre ambientalia-desk | `pruebas-en-la-app-pendientes` y el `archive-report` |
| Encender `SALIDAS_ESPERAS=true` en el despliegue (nace cerrado; vuelta atrás: quitarlo) | Gerencia | gestor de secretos del despliegue | `DEPLOY.md` §17 |
| Recalcular plazos 79/31/20/13 con medición nueva (hoy provisionales, `medicion/p90-esperas-2026-10-21`) | Gerencia (mide) / construcción (aplica en `plazosEsperas.ts`) | cambio nuevo con su medición fechada | `openspec/config.yaml` → `mediciones_de_produccion` |
