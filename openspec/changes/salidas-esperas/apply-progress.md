# Apply-progress — `salidas-esperas` (F1C-03)

## Lote I3a — catálogo, interruptor (ids y visibilidad), config, plazos, cifras

Estado: I3a.1 a I3a.9 hechas; I3a.c (cierre de lote: lint, citas, suite entera, medida final, commit) la hace el orquestador.
Base del lote `9dac72c8`. `strict_tdd`.

### Rojo visto antes del verde

- **Línea base (I3a.1):** `npx vitest run packages/shared` 60 ficheros / 1.609 pruebas en verde; `npm run typecheck` 0.
- **Rojo (I3a.2-I3a.4), con el catálogo ORIGINAL en su sitio** (se restauró `transitions.ts` de `HEAD` para verlo): 15 pruebas rojas y dos ficheros que no cargan.
  `salidasEsperas.test.ts` y `plazosEsperas.test.ts`: módulos inexistentes. Cifras: `38 → 40` (invariante 2 y `cifrasAncladas`), `50 → 52` (unión y `transitionsSoporteRemoto`),
  `46 → 49` (mapa, dos sitios), `52 → 54` y `19/16/13/4 → 19/17/14/4` (`tipoEvento`), `33 → 35` heredan, `2200 → 2310` (`cargos`), `10 → 9` y `6 → 5` (`estados`),
  obligatorios de `prioridad`. Bloque nuevo de `invariantesGrafo.test.ts`: rojo en «cuatro entradas», «Solicitado sale por dos» y «cobro desde SKU» (catálogo sin las dos salidas).
- **Rojo al traer el catálogo nuevo** (antes de comentarios y cifras): `comentariosVigilados.test.ts` (a) «Hay NUEVE» y (c) «en las otras 51 transiciones»; y las pruebas de anti-desfase
  del mapa (`docs/artefactos/`) y de `cifras_ancladas`. Causa: los comentarios y el registro llevaban la cifra vieja.
- **Rojo no previsto por D6 (se anota como desviación y se corrige D6):** `decisionales.test.ts` (16 → 17 Decisionales: el cobro lo es) y `reasignacion.test.ts`
  (el barrido de `puedeReasignar` reproduce el predicado de `areasSiguientes`; hay que excluir el cobro, S-22). Las demás cifras de D6 coincidieron con la medida.
- Confirmado por ejecución, en verde sin cambio: `reentrancia.test.ts`, `bodegaje.test.ts`, `decisionales.test.ts` (salvo la cifra anotada).

### Verde

`transitions.ts:262` (las dos transiciones, misma línea física que `anulacion`, comentario «F1C-03 (RQ-TS-60)») y `:330` (`|| t.id === 'cobro_diagnostico_espera'`); `config.ts:66` y `:125`
(`salidasEsperas`, `=== 'true'`); `appHarness.ts:46`/`:49`; `salidasEsperas.ts` parcial (constantes, `motivoQuitadaPorSalidasEsperas`, `visibleConSalidasEsperas`);
`plazosEsperas.ts`; `controlCalidad.ts:7`/`:121-122` (tercer parámetro `salidasEsperas = false`); `index.ts:52`; `estados.ts:142/145/154/158` y `ticketService.ts:238` en sitio, mismo número de líneas;
`cifras_ancladas` (`config.yaml:1361-1364`, `:1368`) y mapa regenerado (`npm run generar-mapa-blueprint`: +8 líneas en tres ficheros de `docs/artefactos/`).
`tsc -b`: sin ciclo (`salidasEsperas.ts` no importa nada).

### Mutaciones (el repositorio no trae `herramientas/mut.mjs`; se usó un script de copia + `sed` + restauración por copia con comparación de hash; todas restauradas con hash igual)

| Mutación | Qué se hizo | Pruebas que se pusieron ROJAS |
|---|---|---|
| M5a | `anulacion` también desde `Solicitado` (`transitions.ts:262`) | `invariantesGrafo.test.ts` RQ-TS-63 ×2 («Solicitado sale por dos», «ninguna va a Anulado ni a Por Facturar»), M5 anulacion, M5 sin sin_pieza |
| M5b | `anulacion` también desde la espera de SKU | `estados.test.ts` «nueve estados tienen una sola salida» y «da cinco»; RQ-TS-63 ×2; M5 anulacion |
| M5c | `cobro_diagnostico_espera` también desde la espera de SKU | `estados.test.ts` nueve y cinco; RQ-TS-63 ×2 |
| M5d | quitar `sin_pieza_en_almacen` | `estados.test.ts` nueve y cinco; invariante 2 (40) y unión (52); RQ-TS-63; «las dos ids una sola vez» |
| M6a | `plazosEsperas.ts` importa `./sla` | `plazosEsperas.test.ts` prueba de fuente |
| M6b | `'Solicitado': 5` en `SLA_HORAS_POR_ESTADO` (`sla.ts`) | `plazosEsperas.test.ts` disjunción |
| M6c | plazo `Solicitado` 13 → 14 | plazos literales y `esperaVencida` |
| M9a | `atajo_sucio` (`En Proceso` → `Por Facturar`) en el catálogo real | 8 rojas: «cuatro entradas», «tres» apagado, tres de F1C-08, invariante 2 y unión |
| M9b | `entradasAPorFacturarSinControlCalidad` deja de mirar `Por Facturar` | 10 rojas: las de F1C-08, las de F1C-03 y las dos «atajo sucio» en memoria |
| M9c | el tercer parámetro se ignora | 4 rojas: F1C-08 encendido/apagado/escape y «SALIDAS_ESPERAS apagado: tres» |
| S-22 | quitar `|| t.id === 'cobro_diagnostico_espera'` de `areasSiguientes` | `reasignacion.test.ts` barrido de `puedeReasignar` |

Matiz sobre M5: `anulacion` o el cobro desde `Solicitado`/SKU no cambian el CONJUNTO de ids de la propiedad de las cuatro entradas (la arista nueva no se suma a un id ya presente ni va a `Por Facturar`
con id nuevo), así que quien las caza es RQ-TS-63 (salidas de `Solicitado` y SKU) y `estados.test.ts`; la propiedad de las cuatro entradas la caza M9a (id nuevo hacia `Por Facturar`).

### Fuera de este lote (lo verá el orquestador en la suite entera)

Las pruebas del SERVIDOR con cifras de D6 (`permisos.test.ts`, `cargoPermiso.test.ts`, `transicionesEjecucion.test.ts`, `flujoSoporteRemoto.test.ts`, `deployControlCalidad.test.ts`) son del lote I4/I3b y
quedarán rojas con el catálogo de 40: no se tocaron aquí.

### Medida (`git diff --shortstat --no-renames 9dac72c8` + `wc -l` de lo nuevo sin trackear)

Antes de este fichero: 23 ficheros, +143 −61 (204) más 180 de lo nuevo (`salidasEsperas.ts` 23, `plazosEsperas.ts` 30, sus dos pruebas 71 y 56) = 384; con este informe, unas 440. Sin binarios.
Códigos: `npx vitest run packages/shared` 0 (62 ficheros, 1.634 pruebas); `npm run typecheck` 0.

### Lote I3a · ampliación por la suite entera (12 rojas en 6 ficheros; un lote no se asienta en rojo)

Adelanta de I4 lo mínimo (marcado «parcial» en `tasks.md`: I4.2, I4.3, I4.4, I4.5). SIN regla del ejecutor ni motivo del respaldo (eso sigue siendo I4).

- **ROJO visto (nuevo `apps/desk/server/salidasEsperas.test.ts`, 8 pruebas):** con el interruptor apagado `cobro_diagnostico_espera` y `sin_pieza_en_almacen` daban 200 (esperado 409) y SE-1 (interruptor < área) daba 403 (esperado 409); las cinco restantes (encendido pasa por el área, SE-0 estado < interruptor, anulacion apagado) ya pasaban, como caracterización.
- **VERDE:** `exigirInterruptorSalidasEsperas` al final de `ticketService.ts`, llamada en `:128` junto a la de control de calidad (misma línea física); import de `motivoQuitadaPorSalidasEsperas` al final de `:6`. 8/8.
- **Barridos HTTP** (app `salidasEsperas: true` para las dos nuevas; comentario «I4: derivado_a = usuario de la sesión cuando entre la regla del ejecutor» en cada sitio):
  `transicionesEjecucion.test.ts` (40 transiciones, 47 ejecuciones, tabla de los cuatro estados sin salida con las dos nuevas), `cargoPermiso.test.ts` S21 (120 celdas),
  `flujoSoporteRemoto.test.ts` P8 (52), `permisos.test.ts` (matrices HTTP y puras).
- **Cifras puras medidas de `permisos.test.ts`:** 120 casos, 73 prohibidos y 47 permitidos (área); con la compuesta y sin cargo 74 y 46; barrido de cargo 1.080 (40 × 3 × 9). Coinciden con D6.
- `apps/desk/server/routes/reasignacion.test.ts:340`: el predicado del barrido HTTP excluye `cobro_diagnostico_espera` (S-22), como el puro.
- `reconciliacion/registro.test.ts:218-220`: «en curso» pasa de NUEVE a **DIEZ** con F1C-03 (`salidas-esperas`, `cierra: si`, sin archivar). **Tarea para I7:** al archivar el cambio vuelve a NUEVE (quitar `F1C-03` del arreglo y restituir el título).
- Mutación de posición SE-1 no ejecutada con herramienta: su prueba se vio ROJA antes de existir la guarda (403 en lugar de 409), que es la evidencia de que discrimina la posición.

## Lote I3b — ejecutor, motivo del respaldo, despliegue

Estado: I3b.1 a I3b.6 hechas; I3b.c (citas, medida final, commit) la hace el orquestador. Base del lote `df53227f`. `strict_tdd`.

### Rojo visto antes del verde

- **I3b.1:** `salidasEsperas.test.ts` ampliada (+17 pruebas, RQ-PM-42/43/44 puras): **16 rojas, 9 en verde** (las 9 de I3a); causa, `TypeError: … is not a function` (las funciones no existían).
  Verde: 25/25. `tsc -b` sin ciclo (`salidasEsperas.ts` ahora importa `permissions`, `decisionales`, `cargos`).
- **I3b.3:** `deploySalidasEsperas.test.ts` (nuevo, 9 pruebas): **7 rojas, 2 en verde** (la ausencia de `true` y la lectura `=== 'true'`); causa, sin §17 ni variable en `.env.example`.
  Tras añadir la §17 se vio la tercera roja prevista: `deployControlCalidad.test.ts` «es la última» (la §16 ya no cierra el fichero); se acotó la §16 hasta la §17, en una sola línea (+0 líneas, sin desplazar `:17`/`:35`).
- Verde: 15/15 en los dos ficheros.

### Verde

`salidasEsperas.ts`: `ORIGENES_ANULACION_EN_ESPERA`, `CLAVE_MOTIVO_RESPALDO`, `CAMPO_MOTIVO_RESPALDO` (fuera del catálogo), `ContextoSalidasEsperas`, `SALIDAS_ESPERAS_APAGADO`, `EjecutorSalida`,
`esSalidaDeEspera`, `ejecutorDeSalida`, `erroresMotivoRespaldo`, `puedeEjecutarConSalidasEsperas`. `DEPLOY.md` §17 (tras la §16, solo añade al final: no desplaza líneas).
`.env.example`: comentario de dos frases y `SALIDAS_ESPERAS=` vacío tras `CONTROL_CALIDAD_LIBERACION=` (la edición NO fue denegada: no hay parte bloqueada).

### Mutaciones (scripts de copia + `sed` + restauración por copia y hash; todas restauradas con hash igual)

| Mutación | Qué se hizo | Prueba(s) que cayó |
|---|---|---|
| I3b.5 A | `DEPLOY.md` §17 sin «**Nace cerrado**» | `deploySalidasEsperas` «nace cerrado, lo decide Gerencia…» |
| I3b.5 B | `DEPLOY.md` §17 con `SALIDAS_ESPERAS=` sin `>` | `deploySalidasEsperas` «lleva la línea de entorno, vacía» |
| I3b.5 C | `.env.example` sin la variable | `deploySalidasEsperas` «la variable está…» y «la línea anterior es su comentario» |
| I3b.5 D | `.env.example` con `SALIDAS_ESPERAS=true` | las dos anteriores y «no hay ninguna línea que la deje en true» |
| M7a-1 | `s.id === tk.derivadoA` → `!==` | 6: persona a cargo, respaldo, denegado, S-2 y dos de RQ-PM-43 |
| M7a-2 | quitar el chequeo de área de (a) | «el derivado de otra área no es persona a cargo» |
| M7b | `esSalidaDeEspera` acepta `anulacion` de cualquier origen | 3: «esSalidaDeEspera…», «apagado o fuera de alcance» y «idéntica a la compuesta de Decisionales» |
| M7c (extra) | compuesta sin `v.via !== 'denegado'` | «rige aunque DPC esté apagado…» |

Scripts: `mut_i3b5.sh` y `mut_i3b6.sh` en el scratchpad de la sesión (no se versionan).

### Códigos y medida

`npm run typecheck` 0; `npm run lint` 0; `npm test` 0 (311 ficheros pasan, 3 omitidos; 5.271 pruebas pasan, 11 omitidas). Citas (`cli.ts --sha HEAD`) y commit: orquestador.
Tras esos códigos sólo se tocó una línea de `deployControlCalidad.test.ts` (fusión en una línea); se volvió a correr su fichero (6/6) y eslint sobre él.
Medida: `git diff --shortstat --no-renames df53227f` 5 ficheros +239 −7 (más este informe y `tasks.md`) y 73 de `deploySalidasEsperas.test.ts` sin trackear: ~350, bajo 650. Sin binarios.
Aviso para el barrido de citas: `deployControlCalidad.test.ts:17` y `:35` (verify-report archivado de control-calidad-liberacion) siguen en su línea.
