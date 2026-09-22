# Capacidad `mapa-blueprint` — generador determinista del mapa visual del flujo

| Dato | Valor |
|---|---|
| Capacidad | `mapa-blueprint` (nueva) |
| Cubre | Función pura grafo → Mermaid, CLI de escritura, los cuatro `.md` generados y la guarda anti-desfase |
| Tanda que la escribe | `generador-mapa-blueprint` (F1A-06) |
| Depende de | `transitions-st` (`TRANSITIONS`, `TRANSICION_REMISION_CONFIRMADA`/`RETIRADA`, `AREAS`, `areasForTransition`) y `packages/shared/src/estados.ts` (`ESTADOS`, `ESTADOS_SIN_SALIDA`) |
| Fuente en el maestro | Anexo F (`R08.2.md:4412-4413`), M1.3.1 (`:1187-1191`), M1.3.7 (`:1301-1458`), C.11 (`:3991-3993`) |

## Purpose

El mapa visual del flujo de servicio técnico hoy no tiene generador: lo produjo una conversación de
agente y nadie puede reproducirlo (`docs/artefactos/NOTA.md:32-46`). Esta capacidad convierte el mapa
en una **proyección del código**, no en un entregable que alguien mantiene a mano: una función pura
recorre el grafo declarado en `transitions-st` y produce Markdown con Mermaid, y una prueba se pone
roja si el fichero commiteado y el grafo dejan de decir lo mismo.

## Requirements

### Requirement: RQ-MB-01 · Función pura, sin `fs` ni `permissions.ts`

El generador **SHALL** vivir como una función pura en `packages/shared/src/`, que recibe el grafo
declarado (`TRANSITIONS`, las dos transiciones sin botón, `ESTADOS`, `ESTADOS_SIN_SALIDA`, `AREAS` y
`areasForTransition`) y devuelve cadenas Mermaid, sin tocar disco ni proceso. **MUST NOT** leer
`packages/shared/src/permissions.ts`: su única función, `canExecuteTransition`, decide sobre un
usuario, y el mapa no tiene usuario.

La escritura a disco **SHALL** vivir en una CLI delgada aparte, cuya única responsabilidad **SHALL**
ser volcar la salida de la función pura a los cuatro ficheros de `docs/artefactos/`; **MUST NOT**
contener lógica de grafo.

#### Scenario: la función pura no importa `permissions.ts`
- GIVEN el módulo del generador en `packages/shared/src/`
- WHEN se inspeccionan sus imports
- THEN no aparece `permissions.ts` ni `canExecuteTransition`

#### Scenario: la CLI delega todo el cálculo a la función pura
- GIVEN la CLI de escritura
- WHEN se compara con el módulo de `packages/shared`
- THEN la CLI sólo invoca la función y escribe su resultado a disco; ningún dato del grafo se
  construye en la CLI

### Requirement: RQ-MB-02 · Una arista por origen, no una por transición declarada

El diagrama **SHALL** dibujar una arista de estado a estado por **cada elemento** del array `from` de
cada transición, no una arista por entrada del catálogo. Una transición con `from` de varios
elementos **SHALL** producir tantas aristas como orígenes.

El diagrama completo **SHALL** tener exactamente **38** aristas: las **36** que produce recorrer los
`from` de las 34 transiciones de `TRANSITIONS` —de ellas 3 nacen en `habilitar_servicio`, cuyo `from`
tiene tres elementos (`transitions.ts:178`)— más las **2** de los pasos sin botón. La cifra **SHALL**
fijarse por aserción, no por comentario (maestro M1.3.7, `:1301-1458`).

#### Scenario: `habilitar_servicio` dibuja tres aristas
- GIVEN la transición `habilitar_servicio`, cuyo `from` tiene tres estados
- WHEN se genera el diagrama
- THEN aparecen tres aristas distintas hacia `Ingresado`, una por cada origen

#### Scenario: el diagrama completo tiene 38 aristas
- GIVEN el grafo generado desde `TRANSITIONS` más las dos transiciones sin botón
- WHEN se cuentan las aristas del diagrama completo
- THEN el total es exactamente 38, fijado por una aserción de la prueba

### Requirement: RQ-MB-03 · Cuatro ficheros Mermaid, generados y marcados como tales

El generador **SHALL** producir exactamente cuatro ficheros en `docs/artefactos/`, con prefijo
`blueprint-`: el diagrama completo y una vista por cada una de las tres fases de M1.3.1
(`R08.2.md:1187-1191`). Cada fichero **SHALL** contener un bloque Mermaid `stateDiagram-v2` cercado en
Markdown, sin dependencia npm de renderizado. Cada fichero **SHALL** abrir con una cabecera que
declare que es generado y que no debe editarse a mano.

#### Scenario: se producen los cuatro ficheros esperados
- GIVEN una ejecución del generador
- WHEN termina
- THEN existen cuatro ficheros `docs/artefactos/blueprint-*.md`: uno completo y tres por fase, cada
  uno con un bloque ` ```mermaid stateDiagram-v2 ` `

#### Scenario: la cabecera generada avisa contra la edición manual
- GIVEN cualquiera de los cuatro ficheros
- WHEN se lee su cabecera
- THEN declara que el fichero es generado y que no se edita a mano

### Requirement: RQ-MB-04 · La fase de un estado es dato; la de una transición se deriva, y las fronteras se repiten

El mapa estado → fase **SHALL** declararse como dato de negocio, con exactamente las mismas claves
que `ESTADOS` (`estados.ts:112`): un estado sin fase asignada **MUST NOT** poder entrar en el grafo
sin que el generador lo detecte y falle.

La fase de una transición **SHALL** derivarse de la fase de su `from` y de su `to`, **MUST NOT**
declararse a mano. Cuando las fases de `from` y `to` **difieren**, la transición **SHALL** aparecer
en las vistas de **las dos** fases, marcada como transición de frontera en cada una — **MUST NOT**
existir una lista de transiciones frontera escrita a mano.

#### Scenario: una transición cuyo origen y destino caen en fases distintas aparece en las dos vistas
- GIVEN una transición cuyo `from` pertenece a la fase 1 y cuyo `to` pertenece a la fase 2
- WHEN se generan las vistas por fase
- THEN la transición aparece en la vista de la fase 1 y en la de la fase 2, anotada como frontera en
  ambas

#### Scenario: un estado sin fase asignada bloquea la generación
- GIVEN un estado de `ESTADOS` que no tiene entrada en el mapa estado → fase
- WHEN se ejecuta el generador
- THEN falla de forma explícita, en vez de omitir el estado en silencio

### Requirement: RQ-MB-05 · Leyenda por área en el diagrama completo, sin fichas de hallazgos

El diagrama completo **SHALL** incluir una leyenda que relacione cada área de `AREAS`
(`transitions.ts:310`) —descompuesta por `areasForTransition` en las combinadas (`:313-315`)— con su
marca visual. Ninguno de los cuatro ficheros **MUST NOT** incluir fichas de hallazgos de auditoría:
esa distribución vive en los documentos de auditoría, decisión ya tomada del maestro (Anexo F,
`R08.2.md:4412-4413`).

#### Scenario: la leyenda cubre las tres áreas base y las compartidas
- GIVEN el diagrama completo generado
- WHEN se inspecciona su leyenda
- THEN nombra `Comercial`, `Servicio Técnico` y `Compras`, y una transición de área compartida (p. ej.
  `Comercial / Compras`) queda identificable por las dos marcas

#### Scenario: ningún fichero generado contiene fichas de hallazgos
- GIVEN los cuatro ficheros generados
- WHEN se inspecciona su contenido
- THEN ninguno incluye una sección de hallazgos de auditoría

### Requirement: RQ-MB-06 · Prueba anti-desfase: el fichero commiteado es el que manda

Una prueba **SHALL** regenerar los cuatro ficheros desde el import real del catálogo de transiciones y
**SHALL** compararlos con el contenido commiteado en `docs/artefactos/`; una discrepancia **SHALL**
poner la prueba en rojo. La prueba **SHALL** ser un diff de cadenas contra el `.md` en disco, **NO**
el patrón de `packages/zoho-sync/src/db/migrate.test.ts` —que existe porque `schema.sql` es texto
crudo sin tipar—: aquí la fuente ya es TypeScript tipado.

**Mutación exigida sobre el fichero vigilado (regla de mutación 2, `CLAUDE.md`).** Editar a mano un
`blueprint-*.md` commiteado **SHALL** poner la prueba en rojo. Mutar únicamente el generador **MUST
NOT** bastar como prueba: sólo demostraría que se ejecuta, no que vigila el fichero.

Una transición añadida al grafo sin regenerar los ficheros **SHALL** producir el mismo rojo.

#### Scenario: el fichero commiteado editado a mano pone la prueba en rojo
- GIVEN uno de los cuatro `blueprint-*.md` commiteados, editado a mano sin volver a ejecutar el
  generador
- WHEN corre la prueba anti-desfase
- THEN falla, señalando la diferencia entre lo generado y lo commiteado

#### Scenario: una transición nueva sin regenerar también pone la prueba en rojo
- GIVEN el catálogo de transiciones con una entrada añadida a mano en la prueba, sin regenerar los
  `.md`
- WHEN corre la prueba anti-desfase
- THEN falla, porque lo commiteado ya no coincide con lo que produce el import real
