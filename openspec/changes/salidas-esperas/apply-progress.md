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

## Lote I4 — ejecutor en el servidor, motivo del respaldo, ruta de contexto y cliente

Estado: I4.1 a I4.8 hechas; I4.c (citas, medida final, commit) la hace el orquestador. Base del lote `3d33f071`. `strict_tdd`.

### Rojo visto antes del verde

- **I4.1:** la suite del servidor (`apps/desk/server`) en verde con I3a/I3b aplicados, antes de tocar código de I4.
- **I4.2/I4.3/I4.4 (`salidasEsperas.test.ts`, +21 pruebas HTTP):** 13 rojas de 28. Causas: sin guarda de ejecutor el extraño, el derivado de otra área y el Especialista técnico daban `200`
  (esperado `403`); el respaldo sin motivo y la persona a cargo con motivo daban `200` (esperado `422`); con DPC encendido la persona a cargo sin cargo daba `403` de Decisionales (esperado `200`);
  SE-2b daba el texto de Decisionales y no el del ejecutor; SE-3 daba `422` y no `403`; SE-5 daba el `422` del motivo de anulación SIN el del respaldo (el texto real del plan es «Falta el campo obligatorio: Motivo»,
  no la clave: la aserción se corrigió a ese texto y a `toHaveLength(2)`); la ruta daba `404` ×3. Las 15 verdes de entrada son las de I3a y las de caracterización (apagado, `Rev./Diagnostico`).
  SE-2 (área < ejecutor) pasa en verde desde el principio porque el área ya precedía: lo prueba la mutación, no el rojo previo.
- **Rojo de los barridos (con la guarda ya en su sitio):** 5 rojas en 3 ficheros antes de sembrar `derivado_a`: `permisos.test.ts` (matriz de Comercial, de Servicio Técnico y del administrador),
  `cargoPermiso.test.ts` S21 y `transicionesEjecucion.test.ts` «las 40 salen de su origen». Causa: sin `derivado_a` el usuario de la matriz no es la persona a cargo y el administrador es respaldo sin motivo
  (`403`/`422` en lugar de `200`). `flujoSoporteRemoto.test.ts` P8 sigue en verde sin sembrar nada: el `409` de flujo (`:126`) precede al ejecutor.
- Las dos pruebas de I3a «el administrador ejecuta el cobro / sin_pieza_en_almacen» pasaron a ser respaldo con motivo (un administrador que no es la persona a cargo es respaldo): ver sus títulos.

### Verde

- `ticketService.ts` sin desplazar una línea (la guarda, el motivo y las llamadas van dentro de `:131` y `:134`; imports al final de `:6` y `:7`; auxiliares al final del fichero):
  `:131` `const ejecutor = await veredictoEjecutorSalida(…); exigirEjecutorSalida(ejecutor)` tras `cargoFalta` y antes de Decisionales, que gana `&& !ejecutor`; `:134` `errRespaldo = erroresMotivoRespaldo(ejecutor, values)`
  en el `if` y en `errors` del mismo agregado; `:329` `veredictoEjecutorSalida` (sale sin consultar nada con el interruptor apagado o fuera de alcance) y `:335` `exigirEjecutorSalida`.
- `services/decisionales.ts:20` `contextoSalidasEsperas` (la vacante por `contextoDecisionales`, también con DPC apagado, S-21); `routes/permisosSalidasEsperas.ts` (nuevo) y `app.ts:22`/`:61` (registro al final de las dos líneas).
- Cliente: `client.ts:921` `getContextoSalidasEsperas`; `TransitionPanel.tsx` `:3`, `:8` (la compuesta sustituye a `puedeEjecutarTransicionConDecisionales`, que ya no se usa ahí), `:55` (estado `salidas`, apagado si falla), `:57` (compuesta +
  `visibleConSalidasEsperas`) y `:179` (campo «Motivo del respaldo» sólo cuando `ejecutorDeSalida` da `respaldo`). Las cinco son ediciones dentro de su línea: ninguna línea se desplaza.
- Barridos HTTP con `salidasEsperas: true` y `derivado_a` = usuario de la sesión en la línea del `INSERT` (`permisos.test.ts:54`/`:100`, `cargoPermiso.test.ts:260`, `transicionesEjecucion.test.ts:263`); `anulacion` sigue en la app apagada.
- Prueba nueva de disjunción (pares sin prueba posible de D3): ninguna de las tres salidas está en la lista corta, ni en la firma de control de calidad, ni en la calibración directa, ni en el envío a control de calidad.

### Mutaciones I4.6 / I4.7 (script `mut_i4.mjs` del scratchpad: copia, reemplazo exacto una vez, `salidasEsperas.test.ts`, restauración por copia; las 13 con hash igual)

| Mutación | Qué se hizo | Prueba(s) que cayó |
|---|---|---|
| SE-0 | `exigirInterruptorSalidasEsperas` antes del `409` de estado | SE-0 |
| I4.6a | el interruptor de salidas ANTES del de control de calidad (misma línea) | **ninguna: equivalente.** Conjuntos de ids disjuntos (declarado en D3; la disjunción la fija la prueba nueva y `salidasEsperas.test.ts` de `shared`) |
| SE-1 | interruptor después del área | SE-1 |
| SE-2 | `exigirEjecutorSalida` ANTES del área | «quien no es del área sigue recibiendo el 403 de área» y SE-2 |
| I4.6b | ejecutor antes de `cargoFalta` (tras el área) | **ninguna: equivalente.** Ninguna de las tres está en la lista corta (prueba de disjunción nueva) |
| SE-2b (sólo mover) | ejecutor después de Decisionales, conservando `&& !ejecutor` | **ninguna: equivalente por construcción.** Con `!ejecutor`, Decisionales no se evalúa cuando hay veredicto, así que el orden entre las dos no cambia ninguna respuesta; lo que fija esa posición es la condición (I4.7a) |
| SE-2b+ | ejecutor después de Decisionales Y sin `!ejecutor` | RQ-PM-43 y SE-2b |
| SE-3 | `exigirEjecutorSalida` después del `422` | SE-3 |
| SE-5 | `errRespaldo` fuera del agregado (su propio `422`) | SE-5 |
| I4.7a | quitar `&& !ejecutor` | RQ-PM-43 (persona a cargo sin cargo con DPC) |
| I4.7b | `denegado` tratado como respaldo (no lanza) | 5: extraño, S-2, Especialista técnico con Coordinador activo, SE-2b y SE-3 |
| extra | la vacante de la ruta siempre `false` | S-21 (HTTP) y la prueba de la ruta |
| extra | el ejecutor se calcula aunque el interruptor esté apagado | las dos de «apagado… no mira al ejecutor» |

Aviso para el verify: las tres mutaciones «equivalentes» no son un detector que falta, son pares sin prueba posible declarados (D3). La posición del ejecutor frente a Decisionales descansa en `!ejecutor`.

### TABLA DE LA REGLA 13 (I4.8, regla de mutación 3), decisión a decisión, con la línea REAL del servidor tras editar

| Decisión que toma el cliente (`TransitionPanel.tsx`) | Línea del servidor que la impone | Cómo se prueba |
|---|---|---|
| Oculta `cobro_diagnostico_espera` y `sin_pieza_en_almacen` con el interruptor apagado (`:57`, `visibleConSalidasEsperas`) | `ticketService.ts:128` (`409`, `exigirInterruptorSalidasEsperas`, definida `:318`) | `salidasEsperas.test.ts` «interruptor» y SE-0/SE-1 |
| Oculta las tres salidas a quien no es persona a cargo ni respaldo (`:57`, `puedeEjecutarConSalidasEsperas`) | `ticketService.ts:131` (`403`, `exigirEjecutorSalida`, `:335`; veredicto `:329`); el área precede en `:129` y la lista corta en `:131` | extraño `403`, S-2, SE-2, I4.7b |
| Ofrece `cobro` a la persona a cargo sin cargo con Decisionales encendido (`:57`) | `ticketService.ts:131` (`faltanDecisional` sólo con `!ejecutor`) | RQ-PM-43 HTTP; I4.7a |
| Pide «Motivo del respaldo» al respaldo (`:179`) | `ticketService.ts:134` (`422`, `errRespaldo`, regla `salidasEsperas.ts:70`) | respaldo sin motivo `422`, con motivo pasa; SE-5 |
| No lo pide a la persona a cargo (`:179`) | `ticketService.ts:134` (`422` si llega con texto, S-14) | S-14 |
| Vacante del Coordinador Técnico (contexto de `:55`) | `services/decisionales.ts:20` (`contextoSalidasEsperas`) usada por `ticketService.ts:329` y por `routes/permisosSalidasEsperas.ts:17`: la misma función | S-21 HTTP y prueba de la ruta; mutación «vacante siempre false» |
| Sin respuesta de la ruta, el panel asume apagado (`:55`, S-20) | **ninguna: degradación declarada.** Puede ofrecer `anulacion` desde ER/SE que el servidor encendido rechace con `403`/`422`; las dos nuevas no se ofrecen (apagado) | sin prueba (la interfaz queda fuera de la red) |

`visibleConSalidasEsperas` NO oculta `anulacion` (sólo las dos nuevas dependen del interruptor): quien la ve desde ER/SE sin ser persona a cargo ni respaldo es filtrado por la compuesta, y si el panel fallara, recibe el `403` del ejecutor.

### Códigos y medida

En serie, logs en `C:\dev\Desk_2_R1.023-worktrees\sal-i4-*.log`: `npm run typecheck` 0; `npm run lint` 0 (0 errores, 165 avisos preexistentes); `npm test` 0 (311 ficheros pasan, 3 omitidos; 5.292 pruebas pasan, 11 omitidas); `npm run build` 0.
Después de esos códigos sólo se tocaron `tasks.md` y este informe (sin código).
Medida: `git diff --shortstat --no-renames 3d33f071` 10 ficheros +280 −35 (antes de `tasks.md` y de este informe) y 19 de `routes/permisosSalidasEsperas.ts` sin trackear: ~335 de código y pruebas, ~400 con este informe; bajo 650. Sin binarios.
Citas (`cli.ts --sha HEAD`) y commit: orquestador. Ninguna línea de `ticketService.ts`, `app.ts` ni `TransitionPanel.tsx` se desplazó; los muy citados de esta tanda se barren en I5.10.

## Lote I5 — alarma de caducidad, cableado, barrido de citas

Estado: I5.1 a I5.10 hechas; I5.c (citas del hook, medida final, commit) la hace el orquestador. Base del lote `59c8b76e`. `strict_tdd`.

### Rojo visto antes del verde

- **I5.1-I5.3 (38 pruebas en 3 ficheros):** `plazosEsperas.test.ts` (+5 RQ-AV-26: textos, clase por `enEsperaDe`, `ALARMA_ESPERA`) cayó 5 de 12 con `textoAvisoEspera is not a function` / `Cannot convert undefined or null to object`;
  `esperasVencidas.test.ts` y `avisoSalidasEsperas.test.ts` no cargaban (`Cannot find module './esperasVencidas'` / `'./avisoSalidasEsperas'`). Verde al primer intento tras el código: 38/38.
- **Un solo ajuste tras el verde:** `tsc` (no vitest) rechazó `desde: ultimo.desde` (`string | Date`); se envolvió en `new Date(...)`. Se re-corrieron los tres ficheros y la serie entera.

### Verde

`packages/shared/src/plazosEsperas.ts` (al final: `ALARMA_ESPERA`, `textoAvisoEspera`; la clase sale de `enEsperaDe`, sin importar `sla.ts`); `apps/desk/server/db/esperasVencidas.ts` (`ticketsEnEspera`: tres consultas fijas, la entrada es el último paso de
`secuenciaDelReloj`; sin secuencia no se mide, S-16); `apps/desk/server/services/avisoSalidasEsperas.ts` (`avisarSalidasEsperas`, `pasadaSalidasEsperas(db, config, hoy)`: apagado sale sin consumir el día; un fallo en un ticket no para a los demás;
`marcarYAvisarAlarma` reutilizada; cargos y, sólo sin cargos, el área de respaldo; el derivado de Comercial se suma sólo en las externas). Cableado en `apps/desk/server/index.ts` en sus dos líneas (`:15` import al final, `:88` tras `pasadaFacturacionVencida`):
`git diff -U0` da sólo `@@ -15 +15` y `@@ -88 +88`, ninguna línea desplazada. Sin migración: se reutiliza `public.alarmas_avisadas`.
El pg-mem no honra el `ROLLBACK`: «el primero se reintenta en la pasada siguiente» no se puede ver en la prueba y descansa en que `marcarYAvisarAlarma` pone la marca dentro de la transacción (estructura heredada de F1B-08).
El filtro por flujo `servicio` de `ticketsEnEspera` es defensivo: ninguna de las cuatro esperas está en los catálogos de `equipo-nuevo` ni de `soporte-remoto`, así que ninguna prueba real lo ejercita (declarado en el test).

### Mutaciones (script `mut_i5.mjs` del scratchpad: copia, reemplazo exacto una vez, las tres pruebas, restauración por copia; todas con hash igual; log `sal-i5-mut.log`)

| Mutación | Qué se hizo | Prueba(s) que cayó |
|---|---|---|
| M1a | tras avisar, `UPDATE  tickets SET status = 'Finalizado'` (con dos espacios, para no tocar la prueba de fuente) | «nunca ejecuta… ningún estado cambia» y «la reentrada» |
| M1b | tras avisar, `INSERT INTO ticket_transitions` | «nunca ejecuta» (comportamiento), la prueba de FUENTE y «la reentrada» |
| M2 | `esperaVencida` con `dias >= plazo - 1` | `plazosEsperas` «dia del plazo vence», las cuatro «un día antes no avisa» y «la reentrada» (6) |
| M3 | avisar sin marcar (`INSERT INTO avisos` directo, sin `marcarYAvisarAlarma`) | «dos pasadas, un aviso», «la reentrada» y «una vez por día civil» (3) |
| M4a | texto de `Solicitado` con «o anular» | 3: pura «internas escalan», pura «no nombran salida» y la integración «internas escalan» |
| M4b | texto de SKU con «o cobrar» | las mismas 3 |

La primera ejecución del script abortó en M2 por una cadena no única (`dias >= plazo }`): el `finally` restauró (hash igual) y se volvió a lanzar con la cadena `plazo !== undefined && dias >= plazo`. M1 corrió antes del aborto.

### I5.9 Corrección del maestro (D13)

`docs/sdd/F0-01_Correcciones_para_el_maestro.md`, entrada **37** al final (la última era la 36): M1.3.4, citando `R08.4.md:1338-1340` y las filas `:1327`, `:1330`, `:1333`, `:1336` (leídas una a una). Plazos 79/31/20/13 provisionales (21/10/2026), la caducidad sugiere o escala y nunca ejecuta,
persona a cargo con respaldo y motivo, y las dos transiciones nuevas («Cobro de diagnóstico», «Sin pieza en almacén»). No se tocó el `.docx`.

**Nota R-7 para el `archive-report` (expediente, no se corrige aquí):** `estados.ts:131-140` sigue describiendo «la única salida» y «un alta en otro sistema» para las esperas, desfasado con c3 (D10 sólo corrigió `:154`/`:158`).

### I5.10 Barrido de citas (regla de mutación 4)

Método: `git diff -U0 --no-renames 24b86092` por fichero; en los doce muy citados que tocó la rama (`transitions.ts`, `estados.ts`, `ticketService.ts`, `config.ts` de zoho-sync, `controlCalidad.ts`, `app.ts`, `TransitionPanel.tsx`, `index.ts`, `deployControlCalidad.test.ts`, `openspec/config.yaml`,
`decisionales.ts`, `appHarness.ts`; `DEPLOY.md`, `.env.example`, `client.ts` y `shared/index.ts` sólo AÑADEN al final, base 810/43/918/51 líneas) **ninguna línea se desplazó**: los hunks son de una línea (`-N +N`) o inserciones tras el final. Se comprobó por script (`subseq_i5.mjs`, la línea vieja es subsecuencia de la nueva):
- **Inserción pura (caso A, siguen ciertas):** `transitions.ts:262` y `:330`; `ticketService.ts:6`, `:7`, `:128`, `:131`; `config.ts:66`, `:125`; `controlCalidad.ts:7`, `:119`, `:121`, `:122`; `app.ts:22`, `:61`; `TransitionPanel.tsx:3`, `:55`, `:179`; `index.ts:15`, `:88`; `deployControlCalidad.test.ts:14`, `:17`; `decisionales.ts:2`; `appHarness.ts:46`, `:49`.
- **Texto reemplazado (las únicas que pueden volver falsa una cita):** `estados.ts:142`, `:145`, `:154`, `:158`; `ticketService.ts:134` (sólo añade `...errRespaldo` al agregado) y `:238` (49 → 51); `TransitionPanel.tsx:8` y `:57` (la compuesta sustituye a `puedeEjecutarTransicionConDecisionales`); `openspec/config.yaml:1361`, `:1362`, `:1364`, `:1368` (cifras ancladas).
- **Cifras del barrido (`barrido_i5.mjs`, citas completas `fichero:N(-M)` sobre todo lo trackeado, antes de filtrar):** 948 abarcan alguna de las líneas cambiadas; con sólo las 12 de texto reemplazado, 339 (46 `estados.ts`, 177 `ticketService.ts`, 100 `TransitionPanel.tsx`, 16 `config.yaml`; el nombre pelado `index.ts`/`app.ts`/`config.ts` mezcla ficheros homónimos, así que son cota superior).
  Se leyeron las ~75 vivas (fuera de `openspec/changes/archive/`, de los `Paquete_de_Despliegue_*` y de esta carpeta): 1 reparada, el resto ciertas (A) o registros fechados.
- **Segundo pase de abreviadas** (`:N` a ≤3 líneas del nombre del fichero, `abrev_i5.mjs`): 48 coincidencias, todas ciertas (`:134`, `:132-134`, `:127-165` siguen siendo el agregado de `422`) o propias de esta carpeta; `CLAUDE.md:349 :158` es de `remision.ts`, falso positivo.
- **Reparada (caso B, 1):** `docs/sdd/ENTRADA.md:2148`, `estados.ts:144-145` citaba «da SEIS», que la rama cambió a «da CINCO»: ahora lleva `en 24b86092`, donde la línea 145 todavía lo decía.
- **No aplican, ya desfasadas ANTES de esta rama (pre-existentes, no se tocan):** `ENTRADA.md:2148 ticketService.ts:238` («las otras 43»; en la base ya decía 49); `openspec/specs/transitions-st/spec.md:2591` `estados.ts:145` («da OCHO»; en la base decía SEIS); `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:173` `config.yaml:1360-1361`/`:1367-1368`
  (plan fechado: «34 a 31», «38 a 35»); las citas de `transitions.ts:262` que describen el docblock de `DERIVACION_POR_DEFECTO` (F0-01, specs `derivacion-avisos` y `transitions-st`, caso B de la R08.1); todo `openspec/changes/archive/` y los `Paquete_de_Despliegue_*` (registros fechados, caso B por construcción).
- Resultado de `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`: salida 0, 0 bloqueantes, 13 abreviadas rotas informativas (ninguna de las tocadas aquí); se repetirá tras el commit.

### Códigos y medida

En serie, logs en `C:\dev\Desk_2_R1.023-worktrees\sal-i5-*.log`: `npm run typecheck` 0 (tras el ajuste de `new Date`); `npm run lint` 0 (0 errores, 165 avisos preexistentes); `npm test` 0 (313 ficheros pasan, 3 omitidos; 5.323 pruebas pasan, 11 omitidas); `npm run build` 0.
Medida: `git diff --shortstat --no-renames 59c8b76e` 5 ficheros +104 −5 (antes de `tasks.md` y de este informe) y 457 líneas sin trackear (`esperasVencidas.ts` 60 y su prueba 87, `avisoSalidasEsperas.ts` 86 y su prueba 224): ~566 de código y pruebas; con este informe y `tasks.md` (`git diff --shortstat --no-renames 59c8b76e` final: 7 ficheros +172 −15, más las 457), **644**; bajo 650 por poco. Sin binarios.
