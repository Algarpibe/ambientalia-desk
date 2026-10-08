# Capacidad `mapa-blueprint` — generador determinista del mapa visual del flujo

| Dato | Valor |
|---|---|
| Capacidad | `mapa-blueprint` (nueva) |
| Cubre | Función pura grafo → Mermaid, CLI de escritura, el registro por flujo, los seis `.md` generados (cuatro de servicio, uno de equipo nuevo y uno de soporte remoto) y la guarda anti-desfase |
| Tanda que la escribe | `generador-mapa-blueprint` (F1A-06); extendida a los tres flujos por `mapa-blueprint-tres-flujos` (F1B-09) |
| Depende de | `transitions-st` (`TRANSITIONS`, `TRANSICION_REMISION_CONFIRMADA`/`RETIRADA`, `AREAS`, `areasForTransition`) `packages/shared/src/flujos.ts` (`CATALOGO_POR_FLUJO`) y `packages/shared/src/estados.ts` (`ESTADOS`, `ESTADOS_SIN_SALIDA`) |
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

La entrada de la función **SHALL** admitir parámetros **opcionales** (nombre del flujo y nombre del
fichero completo) sin perder compatibilidad: una llamada con los seis campos de hoy **MUST** seguir
produciendo la salida de servicio de siempre, y **MUST NOT** existir una segunda función generadora
duplicada (R2).

La escritura a disco **SHALL** vivir en una CLI delgada aparte, cuya única responsabilidad **SHALL**
ser volcar la salida de la función pura a los ficheros de `docs/artefactos/` de **los tres flujos**
(RQ-MB-03); **MUST NOT** contener lógica de grafo. Lo que la CLI **ESCRIBE** sale siempre del registro por
flujo de `packages/shared`, una función pura que la CLI y la prueba consumen por igual. La llamada de
servicio heredada en el guion (sus líneas 1 a 35, citadas por número desde ficheros que este cambio no
edita) se conserva sólo como **contraste**, nunca como fuente, y la CLI se detiene, antes de escribir
nada, si su salida difiere de la del registro.

#### Scenario: la función pura no importa `permissions.ts`
- GIVEN el módulo del generador en `packages/shared/src/`
- WHEN se inspeccionan sus imports
- THEN no aparece `permissions.ts` ni `canExecuteTransition`

#### Scenario: la CLI delega todo el cálculo a la función pura
- GIVEN la CLI de escritura
- WHEN se compara con el módulo de `packages/shared`
- THEN la CLI escribe a disco únicamente lo que devuelve el registro por flujo; ningún dato del grafo
  que se escriba se construye en la CLI, tampoco el de los flujos de equipo nuevo y soporte remoto; la
  llamada de servicio heredada sólo se compara con el registro y, si difiere, la CLI lanza antes de escribir

#### Scenario: la llamada de hoy sigue compilando y produce lo mismo
- GIVEN la llamada al generador con los seis campos actuales y sin parámetros opcionales
- WHEN se compila y se ejecuta
- THEN `npm run typecheck` pasa, la salida tiene las cuatro claves de servicio y `packages/shared/src/cifrasAncladas.test.ts` pasa sin haberse editado

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

### Requirement: RQ-MB-03 · Seis ficheros Mermaid, generados y marcados como tales

El generador **SHALL** producir los ficheros de `docs/artefactos/` con prefijo `blueprint-`, uno o más por
flujo de `CATALOGO_POR_FLUJO`:

- **Servicio:** exactamente cuatro ficheros —el diagrama completo `blueprint-completo.md` y una vista por
  cada una de las tres fases de M1.3.1 (`R08.2.md:1187-1191`)—. Estos cuatro **MUST** quedar byte a byte
  como estaban antes de este cambio (R3).
- **Cada flujo sin fases** (hoy `equipo-nuevo` y `soporte-remoto`): exactamente **un** fichero, su diagrama
  completo, con el nombre `blueprint-equipo-nuevo.md` y `blueprint-soporte-remoto.md` respectivamente (S-A).

En total, `docs/artefactos/` **SHALL** contener seis `blueprint-*.md`. Cada fichero **SHALL** contener un
bloque Mermaid `stateDiagram-v2` cercado en Markdown, sin dependencia npm de renderizado, y **SHALL** abrir
con una cabecera que declare que es generado y que no debe editarse a mano. La cabecera de los flujos
nuevos nombra sus fuentes reales (S-G); la de servicio no cambia.

#### Scenario: se producen los seis ficheros esperados
- GIVEN una ejecución del generador sobre los tres flujos
- WHEN termina
- THEN existen seis ficheros `docs/artefactos/blueprint-*.md`: cuatro de servicio (uno completo y tres por fase) y uno completo por cada flujo nuevo, cada uno con un bloque ` ```mermaid stateDiagram-v2 ` `

#### Scenario: la cabecera generada avisa contra la edición manual
- GIVEN cualquiera de los seis ficheros
- WHEN se lee su cabecera
- THEN declara que el fichero es generado y que no se edita a mano

#### Scenario: los cuatro ficheros de servicio no cambian ni un byte
- GIVEN los cuatro ficheros de servicio de `docs/artefactos/` tal como están en `a26ed48`
- WHEN se regeneran con el cambio aplicado
- THEN `git diff --stat a26ed48 -- docs/artefactos/blueprint-completo.md docs/artefactos/blueprint-fase-*.md` queda vacío y la prueba anti-desfase existente pasa sin editarse

#### Scenario: sin parámetros opcionales la salida de servicio tiene las cuatro claves de hoy
- GIVEN la entrada de servicio sin nombre de flujo ni de fichero
- WHEN se genera
- THEN la salida tiene exactamente las cuatro claves de servicio, con los títulos de hoy

#### Scenario: con nombre de flujo y de fichero el título y la clave son los pedidos
- GIVEN una entrada con nombre de flujo y nombre de fichero completo explícitos
- WHEN se genera
- THEN la clave de salida es el nombre de fichero pedido y el título menciona el flujo pedido, no el de servicio

### Requirement: RQ-MB-04 · La fase de un estado es dato; la de una transición se deriva, las fronteras se repiten, y la guarda rige sólo si hay fases

Cuando un flujo **declara fases**, el mapa estado → fase **SHALL** declararse como dato de negocio, con
exactamente las mismas claves que los estados del flujo (para servicio, `ESTADOS_SERVICIO`, RQ-MB-07): un
estado sin fase asignada **MUST NOT** poder entrar en el grafo sin que el generador lo detecte y falle (guarda D-1).

La fase de una transición **SHALL** derivarse de la fase de su `from` y de su `to`, **MUST NOT**
declararse a mano. Cuando las fases de `from` y `to` **difieren**, la transición **SHALL** aparecer
en las vistas de **las dos** fases, marcada como transición de frontera en cada una — **MUST NOT**
existir una lista de transiciones frontera escrita a mano.

Cuando un flujo **no declara fases** (`fases` vacío, hoy `equipo-nuevo` y `soporte-remoto`), el generador
**MUST NOT** generar vistas por fase y **MUST NOT** ejecutar la guarda D-1: produce sólo el diagrama
completo (S-C). Declarar fases para esos flujos es dato de negocio y queda fuera de este cambio.

#### Scenario: una transición cuyo origen y destino caen en fases distintas aparece en las dos vistas
- GIVEN una transición cuyo `from` pertenece a la fase 1 y cuyo `to` pertenece a la fase 2
- WHEN se generan las vistas por fase
- THEN la transición aparece en la vista de la fase 1 y en la de la fase 2, anotada como frontera en
  ambas

#### Scenario: un estado sin fase asignada bloquea la generación
- GIVEN un flujo con fases declaradas y un estado suyo que no tiene entrada en el mapa estado → fase
- WHEN se ejecuta el generador
- THEN falla de forma explícita, en vez de omitir el estado en silencio

#### Scenario: un flujo sin fases produce sólo su diagrama completo y la guarda no se ejecuta
- GIVEN una entrada con `fases` vacío y `fasePorEstado` vacío, con estados y transiciones válidos
- WHEN se ejecuta el generador
- THEN no lanza, devuelve un solo fichero (el diagrama completo) y no genera ninguna vista por fase

#### Scenario: mutación — quitar la guarda cuando hay fases declaradas pone la prueba en rojo
- GIVEN el generador con la guarda D-1 eliminada para las entradas con fases declaradas
- WHEN corre la prueba de la guarda, con un estado de servicio quitado del mapa estado → fase
- THEN la prueba falla, porque el generador ya no lanza

#### Scenario: mutación — aplicar la guarda también sin fases pone la prueba en rojo
- GIVEN el generador con la guarda D-1 aplicada incondicionalmente
- WHEN corre la prueba del flujo sin fases
- THEN falla, porque el generador lanza para el primer estado

### Requirement: RQ-MB-05 · Leyenda por área en el diagrama completo de cada flujo, sin fichas de hallazgos

El diagrama completo **de cada flujo** **SHALL** incluir una leyenda que relacione cada área de `AREAS`
(`transitions.ts:310`) —descompuesta por `areasForTransition` en las combinadas (`:313-315`)— con su
marca visual. La leyenda de los flujos nuevos lista las tres áreas de `AREAS` aunque el flujo sólo use
alguna (S-B). Ningún fichero generado, de ningún flujo, **SHALL** incluir fichas de hallazgos de auditoría:
esa distribución vive en los documentos de auditoría, decisión ya tomada del maestro (Anexo F,
`R08.2.md:4412-4413`).

#### Scenario: la leyenda cubre las tres áreas base y las compartidas
- GIVEN el diagrama completo generado
- WHEN se inspecciona su leyenda
- THEN nombra `Comercial`, `Servicio Técnico` y `Compras`, y una transición de área compartida (p. ej.
  `Comercial / Compras`) queda identificable por las dos marcas

#### Scenario: la leyenda también está en el diagrama completo de los flujos nuevos
- GIVEN `blueprint-equipo-nuevo.md` y `blueprint-soporte-remoto.md` generados
- WHEN se inspecciona la leyenda de cada uno
- THEN ambos nombran `Comercial`, `Servicio Técnico` y `Compras`

#### Scenario: ningún fichero generado contiene fichas de hallazgos
- GIVEN los seis ficheros generados
- WHEN se inspecciona su contenido
- THEN ninguno incluye una sección de hallazgos de auditoría

### Requirement: RQ-MB-06 · Prueba anti-desfase: el fichero commiteado es el que manda, para todos los flujos

Una prueba **SHALL** regenerar los ficheros de **todos** los flujos desde el import real de
`CATALOGO_POR_FLUJO` y **SHALL** compararlos con el contenido commiteado en `docs/artefactos/`; una
discrepancia **SHALL** poner la prueba en rojo. La prueba **SHALL** ser un diff de cadenas contra el `.md`
en disco, **NO** el patrón de `packages/zoho-sync/src/db/migrate.test.ts` —que existe porque `schema.sql` es
texto crudo sin tipar—: aquí la fuente ya es TypeScript tipado.

La prueba **SHALL** ser **exhaustiva sobre las claves de `CATALOGO_POR_FLUJO`**: recorre
`Object.keys(CATALOGO_POR_FLUJO)`, cada flujo **SHALL** aportar al menos un fichero, y un flujo del registro
sin fichero en disco **SHALL** poner la prueba en rojo. Añadir una clave al registro sin su mapa **MUST** poner
la suite roja.

**Mutación exigida sobre el fichero vigilado (regla de mutación 2, `CLAUDE.md`).** Editar a mano **cualquiera
de los seis** `blueprint-*.md` commiteados **SHALL** poner la prueba en rojo. Mutar únicamente el generador
**MUST NOT** bastar como prueba: sólo demostraría que se ejecuta, no que vigila el fichero.

Una transición añadida, quitada o cambiada en el catálogo de **cualquiera de los tres flujos** sin regenerar
los ficheros **SHALL** producir el mismo rojo, en el fichero de ese flujo.

Los comandos de verificación del cambio son los de `CLAUDE.md`: `npm test`, `npm run typecheck` y
`npm run lint`.

#### Scenario: el fichero commiteado editado a mano pone la prueba en rojo
- GIVEN uno de los seis `blueprint-*.md` commiteados, editado a mano sin volver a ejecutar el
  generador
- WHEN corre la prueba anti-desfase
- THEN falla, señalando la diferencia entre lo generado y lo commiteado

#### Scenario: una transición nueva sin regenerar también pone la prueba en rojo
- GIVEN el catálogo de transiciones con una entrada añadida a mano en la prueba, sin regenerar los
  `.md`
- WHEN corre la prueba anti-desfase
- THEN falla, porque lo commiteado ya no coincide con lo que produce el import real

#### Scenario: mutación del catálogo de CADA flujo pone la suite en rojo sin regenerar
- GIVEN, por separado para `servicio`, `equipo-nuevo` y `soporte-remoto`, una transición añadida, quitada o cambiada en el catálogo de ese flujo, sin regenerar
- WHEN corre la suite
- THEN falla la prueba anti-desfase, en el fichero de ese flujo, en tres ejecuciones registradas; para los dos flujos nuevos hay además una prueba permanente que inyecta un catálogo mutado y asevera el nombre de la transición inyectada, no sólo que difiera

#### Scenario: ensuciar el fichero vigilado de cada flujo pone la suite en rojo
- GIVEN, uno por ejecución, cada uno de los seis `blueprint-*.md` editado a mano
- WHEN corre la suite
- THEN falla la prueba anti-desfase existente para los cuatro de servicio y la nueva para `blueprint-equipo-nuevo.md` y `blueprint-soporte-remoto.md`

#### Scenario: el registro es exhaustivo sobre las claves de `CATALOGO_POR_FLUJO`
- GIVEN el registro por flujo
- WHEN se comparan sus claves con `Object.keys(CATALOGO_POR_FLUJO)`
- THEN son exactamente las mismas, y cada flujo aporta al menos un fichero

#### Scenario: un cuarto flujo sin mapa pone la suite en rojo
- GIVEN un registro con un cuarto flujo sintético que no tiene fichero en disco
- WHEN corre la prueba de exhaustividad
- THEN falla, por el fichero sin pareja
### Requirement: RQ-MB-07 · Las fases del mapa de servicio cubren los 20 estados de servicio y el mapa regenerado coincide con el generador

`FASE_POR_ESTADO` **SHALL** tener exactamente las claves de `ESTADOS_SERVICIO` (20) y **SHALL NOT** contener
`Pendiente`; el reparto por fase **SHALL** ser 4·11·5 (antes 4·12·5). Los cuatro `blueprint-*.md` **de
servicio** (`blueprint-completo.md` y las tres vistas por fase) **SHALL** regenerarse con
`scripts/generar-mapa-blueprint.ts` en el mismo commit que el catálogo, y **SHALL NOT** mencionar
`marcar_pendiente`, `servicio_externo_pendiente` ni `servicio_externo_notificado`. La guarda D-1 (un estado
sin fase bloquea la generación) **SHALL** seguir probándose con **otro** estado de servicio distinto de
`Pendiente`, y quitarlo **SHALL** poner la prueba en rojo.

#### Scenario: `Pendiente` no tiene fase y el reparto es 4·11·5
- GIVEN `FASE_POR_ESTADO` tras el cambio
- WHEN se lee su contenido
- THEN no tiene `Pendiente` y reparte 4, 11 y 5 estados entre las tres fases

#### Scenario: los cuatro ficheros regenerados coinciden y no nombran las retiradas
- GIVEN los cuatro `blueprint-*.md` de servicio commiteados
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

### Requirement: RQ-MB-08 · Un mapa por flujo desde `CATALOGO_POR_FLUJO`, con los estados derivados del catálogo

Para **cada** clave de `CATALOGO_POR_FLUJO` (`packages/shared/src/flujos.ts`), una función pura de
`packages/shared` (fichero nuevo, S-I) **SHALL** construir la entrada del generador de ese flujo; la CLI y la
prueba anti-desfase **SHALL** consumir **esa misma** función, y **MUST NOT** existir dos construcciones
paralelas de la entrada (molde H5 de `CLAUDE.md`).

Los catálogos de los tres flujos **SHALL** salir de `CATALOGO_POR_FLUJO`. Los estados de `equipo-nuevo` y de
`soporte-remoto` **SHALL** derivarse del catálogo —orígenes y destinos de sus transiciones, por primera
aparición, orígenes antes que destino (S-E)—; **MUST NOT** existir ninguna lista de transiciones ni de
estados de esos dos flujos escrita a mano. `servicio` conserva `ESTADOS_SERVICIO`, los dos pasos sin botón y
`FASES` y **MUST NOT** derivarse del catálogo (S-F): derivarlo reordenaría los alias y cambiaría los
ficheros de servicio (RQ-MB-03).

Las cifras de los dos flujos nuevos **SHALL** fijarse por aserción, no por comentario:

| Flujo | Estados | Aristas |
|---|---|---|
| `equipo-nuevo` | 5 | 7 (seis transiciones; `liberacion` tiene dos orígenes) |
| `soporte-remoto` | 4 | 4 (cuatro transiciones) |

Los ficheros de los dos flujos nuevos **MUST NOT** contener la marca `(sin botón)` ni la marca `·espera·`:
ninguno de los dos tiene pasos sin botón ni estados sin salida, y la clase de espera de `Pendiente` está sin
decidir (S-D).

#### Scenario: el registro tiene exactamente las claves de `CATALOGO_POR_FLUJO`
- GIVEN el registro por flujo
- WHEN se enumeran sus claves
- THEN son `servicio`, `equipo-nuevo` y `soporte-remoto`, las mismas que `Object.keys(CATALOGO_POR_FLUJO)`

#### Scenario: los estados de los flujos nuevos se derivan del catálogo
- GIVEN los catálogos de `equipo-nuevo` y `soporte-remoto`
- WHEN el registro por flujo construye sus entradas
- THEN la lista de estados de cada entrada es el conjunto de `from` y `to` de su catálogo, por primera aparición, sin ninguna lista escrita a mano

#### Scenario: equipo nuevo tiene 5 estados y 7 aristas
- GIVEN el mapa generado de `equipo-nuevo`
- WHEN se cuentan sus estados y sus aristas
- THEN hay exactamente 5 estados y 7 aristas, fijado por aserción de la prueba

#### Scenario: soporte remoto tiene 4 estados y 4 aristas
- GIVEN el mapa generado de `soporte-remoto`
- WHEN se cuentan sus estados y sus aristas
- THEN hay exactamente 4 estados y 4 aristas, fijado por aserción de la prueba

#### Scenario: los flujos nuevos no llevan `(sin botón)` ni `·espera·`
- GIVEN `blueprint-equipo-nuevo.md` y `blueprint-soporte-remoto.md` generados
- WHEN se buscan las cadenas `(sin botón)` y `·espera·`
- THEN ninguna aparece en ninguno de los dos

#### Scenario: servicio conserva su lista y no se deriva del catálogo
- GIVEN la entrada de `servicio` del registro por flujo
- WHEN se lee su lista de estados
- THEN es `ESTADOS_SERVICIO` en su orden de hoy, y los cuatro ficheros de servicio no cambian

#### Scenario: añadir una clave a `CATALOGO_POR_FLUJO` sin mapa pone la suite en rojo
- GIVEN una clave nueva en `CATALOGO_POR_FLUJO` sin fichero en `docs/artefactos/`
- WHEN corren `npm run typecheck` y la suite
- THEN `tsc` falla por los `Record<Flujo, …>` y la prueba de exhaustividad de RQ-MB-06 falla
