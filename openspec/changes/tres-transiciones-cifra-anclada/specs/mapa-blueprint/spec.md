# Delta para `mapa-blueprint` — 35 pasos y mapa regenerado (F1C-09)

## ADDED Requirements

### Requirement: RQ-MB-07 · Las fases del mapa cubren los 20 estados de servicio y el mapa regenerado coincide con el generador

`FASE_POR_ESTADO` **SHALL** tener exactamente las claves de `ESTADOS_SERVICIO` (20) y **SHALL NOT** contener
`Pendiente`; el reparto por fase **SHALL** ser 4·11·5 (antes 4·12·5). Los cuatro
`docs/artefactos/blueprint-*.md` **SHALL** regenerarse con `scripts/generar-mapa-blueprint.ts` en el mismo
commit que el catálogo, y **SHALL NOT** mencionar `marcar_pendiente`, `servicio_externo_pendiente` ni
`servicio_externo_notificado`. La guarda D-1 (un estado sin fase bloquea la generación) **SHALL** seguir
probándose con **otro** estado de servicio distinto de `Pendiente`, y quitarlo **SHALL** poner la prueba en
rojo.

#### Scenario: `Pendiente` no tiene fase y el reparto es 4·11·5
- GIVEN `FASE_POR_ESTADO` tras el cambio
- WHEN se lee su contenido
- THEN no tiene `Pendiente` y reparte 4, 11 y 5 estados entre las tres fases

#### Scenario: los cuatro ficheros regenerados coinciden y no nombran las retiradas
- GIVEN los cuatro `blueprint-*.md` commiteados
- WHEN corre la prueba anti-desfase y se buscan las tres ids retiradas
- THEN la prueba pasa y ninguna id aparece

#### Scenario: la guarda D-1 sigue discriminando con otro estado
- GIVEN un estado de servicio (distinto de `Pendiente`) quitado del mapa estado → fase
- WHEN se ejecuta el generador
- THEN falla de forma explícita; con `Pendiente` quitado, en cambio, el generador no falla porque ya no es de servicio

#### Scenario: mutación — un `.md` sin regenerar pone la prueba en rojo
- GIVEN el catálogo nuevo y `blueprint-completo.md` de antes del cambio
- WHEN corre la prueba anti-desfase
- THEN falla (regla de mutación 2, fichero vigilado)

## MODIFIED Requirements

### Requirement: RQ-MB-02 · Una arista por origen, no una por transición declarada

El diagrama **SHALL** dibujar una arista de estado a estado por **cada elemento** del array `from` de cada
transición, no una arista por entrada del catálogo. Una transición con `from` de varios elementos **SHALL**
producir tantas aristas como orígenes.

El diagrama completo **SHALL** tener exactamente **35** aristas: las **33** que produce recorrer los `from`
de las 31 transiciones de `TRANSITIONS` —de ellas 3 nacen en `habilitar_servicio`, cuyo `from` tiene tres
elementos (`transitions.ts:178`)— más las **2** de los pasos sin botón. La cifra **SHALL** fijarse por
aserción, no por comentario (maestro M1.3.7).
(Previously: 38 aristas = 36 de las 34 transiciones + 2.)

#### Scenario: `habilitar_servicio` dibuja tres aristas
- GIVEN la transición `habilitar_servicio`, cuyo `from` tiene tres estados
- WHEN se genera el diagrama
- THEN aparecen tres aristas distintas hacia `Ingresado`, una por cada origen

#### Scenario: el diagrama completo tiene 35 aristas
- GIVEN el grafo generado desde `TRANSITIONS` más las dos transiciones sin botón
- WHEN se cuentan las aristas del diagrama completo
- THEN el total es exactamente 35, fijado por una aserción de la prueba (`mapaBlueprint.test.ts`)

#### Scenario: el diagrama no dibuja ninguna arista que toque `Pendiente`
- GIVEN el diagrama completo generado
- WHEN se buscan aristas con origen o destino `Pendiente`
- THEN no hay ninguna, porque `Pendiente` ya no es estado de servicio

## REMOVED Requirements

Ninguno.
