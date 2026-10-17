# Delta para tickets-core — medición de garantías con el proveedor por marca (F1B-13, `cierra: no`)

Numeración comprobada contra `openspec/specs/tickets-core/spec.md`: el último requisito vivo es RQ-TC-64 (`:3857`); los
nuevos son RQ-TC-65 a RQ-TC-68. El delta **no modifica** ningún requisito vivo: todo es añadido. Supuestos S-1 a S-6:
los de `proposal.md` §6, todos reversibles. Marcas bajo `strict_tdd`: **ROJO** nace rojo. La vista (RQ-TC-68) es `.tsx` y
queda fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16`, `:17-20`): sin rojo previo.

**Fuera de este delta** (nota, no requisito), por `cierra: no`: la carga de las fallas repetidas en la taxonomía ISO 14224
(`decision/anexo-56-taxonomia`, otra fila: aquí sólo se muestran); el valor reclamado tomado del costo de la OVI (sigue a
mano); el envío físico de la pieza por remisión sin ticket (F1B-16). Tampoco: migración, columna nueva, interruptor,
exportación, filtros por fecha ni gráficos. No se especifican.

Datos de partida (medidos): la ficha es `packages/zoho-sync/src/db/schema.sql:727-749` y su tipo
`packages/shared/src/garantiaProveedor.ts:43-64`; un «no» no es ficha (`estado` nulo, CHECK de `schema.sql:748`). El
`fabricante` es obligatorio en un «sí» (`garantiaProveedor.ts:125-132`); `pieza_referencia` es opcional (`:133-136`);
`valor_reclamado` es numérico opcional ≥ 0 (`:137-138`); `valor_recuperado` es obligatorio al resolver y 0 en «rechazada»
(`:175-185`).

## ADDED Requirements

### RQ-TC-65 · Medición por fabricante: lo reclamado frente a lo recuperado, calculada sólo en `shared`

El sistema **SHALL** calcular la medición por fabricante con **una única función pura** en `packages/shared`
(regla invariable 13, puntos 1 y 3). La agrupación, la normalización y las sumas **MUST** vivir sólo ahí: ni el servidor
ni el cliente las reescriben.

**Qué fichas entran.** Sólo las fichas con `reclama = true`. Una respuesta «no» **MUST NOT** entrar en ninguna cifra, ni
en ningún recuento.

**Agrupación (SUPUESTO S-1, reversible).** «Por marca» es por el `fabricante` de la ficha, **recortado de espacios y sin
distinguir mayúsculas**; no se pliegan acentos. Dos fichas cuyos fabricantes sólo difieren en mayúsculas o en espacios de
los extremos **SHALL** caer en el mismo grupo. La etiqueta que se muestra del grupo **SHALL** ser determinista (no
depender del orden de entrada de las fichas).

**Reclamado.** La suma de `valor_reclamado` de **TODAS** las fichas «sí» que lo traen, **en cualquier estado**: abiertas,
enviadas y resueltas.

**Recuperado.** La suma de `valor_recuperado` de las fichas en estado «resuelta».

**Casos que quedan escritos sin ambigüedad:**

- Las reclamaciones **rechazadas** cuentan como **reclamadas** (con su `valor_reclamado`) y con **0 recuperado**.
- Las fichas **abiertas** y **enviadas** cuentan como **reclamadas** y **NO** como recuperadas: no aportan nada a lo
  recuperado mientras no estén resueltas.
- Las fichas «sí» **sin `valor_reclamado`** **SHALL** contarse **aparte**, por fabricante, y **MUST NOT** sumar nada al
  reclamado (ni un 0 en silencio). Su `valor_recuperado`, si estuviera resuelta, sí suma a lo recuperado.

**Qué se da por fabricante, además de las dos sumas:** el número de fichas «sí»; cuántas siguen sin resolver (abiertas y
enviadas); el desglose de resultados de las resueltas; y el recuento de fichas sin valor reclamado.

**Cociente (SUPUESTO S-6, reversible).** El cociente recuperado/reclamado **SHALL** darse sólo cuando lo reclamado es
mayor que 0; si lo reclamado es 0, el cociente es «no disponible» y **MUST NOT** ser 0, ni infinito, ni `NaN`. Los
importes son pesos, sin conversión (SUPUESTO S-3, hipótesis heredada de la ficha); no se fijan umbrales (S-5).

#### Scenario: lo reclamado suma todos los estados y lo recuperado sólo las resueltas — ROJO
- GIVEN cuatro fichas «sí» de «Acme»: abierta con reclamado 100, enviada con 200, resuelta con 300 y recuperado 250,
  y rechazada con 400 y recuperado 0
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 1000 y recuperado 250, con 4 fichas, 2 sin resolver (la abierta y la enviada) y el
  desglose de resultados de las resueltas

#### Scenario: la rechazada cuenta como reclamada con 0 recuperado — ROJO
- GIVEN una única ficha «sí» de «Acme», rechazada, con `valor_reclamado` 500 y `valor_recuperado` 0
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 500, recuperado 0 y cociente 0 (porque lo reclamado es mayor que 0)

#### Scenario: la abierta y la enviada cuentan como reclamadas y no como recuperadas — ROJO
- GIVEN dos fichas «sí» de «Acme», una abierta con 100 y una enviada con 200, y ninguna resuelta
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 300 y recuperado 0, con 2 sin resolver

#### Scenario: una ficha «no» no cuenta en nada — ROJO
- GIVEN una respuesta «no» sobre una OVI de «Acme» y ninguna ficha «sí»
- WHEN se calcula la medición con ese conjunto
- THEN «Acme» no aparece, y ningún total ni recuento la incluye

#### Scenario: una ficha «sí» sin valor reclamado se cuenta aparte y no suma — ROJO
- GIVEN dos fichas «sí» de «Acme»: una con reclamado 100 y otra sin `valor_reclamado`
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 100, 2 fichas y 1 ficha sin valor reclamado; el reclamado no suma 0 por la segunda

#### Scenario: el fabricante se agrupa recortado y sin distinguir mayúsculas — ROJO
- GIVEN una ficha «sí» de `Acme` y otra de `  ACME ` con reclamados 100 y 50
- WHEN se calcula la medición
- THEN hay un solo grupo con reclamado 150 y 2 fichas; la etiqueta mostrada no depende del orden de entrada

#### Scenario: los acentos no se pliegan (S-1) — ROJO
- GIVEN una ficha «sí» de `Müller` y otra de `Muller`
- WHEN se calcula la medición
- THEN son dos grupos distintos

#### Scenario: sin reclamado el cociente no está disponible (S-6) — ROJO
- GIVEN un fabricante cuyas fichas «sí» no traen `valor_reclamado`, o lo traen en 0
- WHEN se calcula la medición
- THEN su cociente es «no disponible», no 0, ni infinito, ni `NaN`

#### Scenario: sin fichas la medición es vacía — ROJO
- GIVEN ninguna ficha «sí»
- WHEN se calcula la medición
- THEN el resultado no tiene fabricantes ni fallas repetidas y no lanza error

### RQ-TC-66 · Piezas con fallas repetidas, calculadas sólo en `shared`

La misma función pura de `shared` **SHALL** devolver las piezas con fallas repetidas. La regla es un **SUPUESTO S-2,
reversible** (se revierte añadiendo el modelo del ticket a la clave, una ventana de N meses, o cambiando el umbral):

- La **clave** es el par (`fabricante`, `pieza_referencia`), **ambos recortados de espacios y sin distinguir
  mayúsculas** (los mismos criterios de S-1).
- Una pieza es **falla repetida** si su clave aparece en **2 o más** fichas «sí».
- Cuentan fichas **en cualquier estado** (abierta, enviada o resuelta, con cualquier resultado, también «rechazada») y **sin ventana de tiempo**.
- Una ficha **sin `pieza_referencia`** (ausente, vacía o sólo espacios) **MUST NOT** contar; el `pieza_serial` **no**
  forma parte de la clave.
- Una ficha «no» **MUST NOT** contar.

Por cada pieza repetida **SHALL** darse el fabricante, la referencia, el número de fichas y la lista de los tickets de
esas fichas, en un orden determinista (no dependiente del orden de entrada). Una pieza con una sola ficha **MUST NOT**
aparecer. El resultado sólo se muestra: no escribe en ninguna taxonomía (nota de fuera de alcance).

#### Scenario: frontera, una ficha no es repetida y dos sí — ROJO
- GIVEN una ficha «sí» de «Acme» con referencia `X-100`
- WHEN se calcula la medición
- THEN `X-100` no aparece como falla repetida
- AND al añadir una segunda ficha «sí» de «Acme» con `X-100` aparece con 2 fichas

#### Scenario: mayúsculas y espacios no parten la clave — ROJO
- GIVEN una ficha «sí» de `Acme` con referencia `x-100` y otra de ` ACME` con referencia ` X-100 `
- WHEN se calcula la medición
- THEN hay una falla repetida con 2 fichas

#### Scenario: cualquier estado cuenta y no hay ventana — ROJO
- GIVEN dos fichas «sí» de «Acme» con la misma referencia: una rechazada de hace dos años y otra abierta de hoy
- WHEN se calcula la medición
- THEN la pieza sale como falla repetida con 2 fichas

#### Scenario: sin referencia no cuenta — ROJO
- GIVEN dos fichas «sí» de «Acme», ambas sin `pieza_referencia` (una vacía y otra de sólo espacios)
- WHEN se calcula la medición
- THEN no hay falla repetida, aunque tengan el mismo `pieza_serial`

#### Scenario: la misma referencia de otro fabricante no se junta — ROJO
- GIVEN una ficha «sí» de «Acme» y otra de «Beta», ambas con la referencia `X-100`
- WHEN se calcula la medición
- THEN no hay falla repetida

#### Scenario: una ficha «no» no cuenta — ROJO
- GIVEN una ficha «sí» de «Acme» con `X-100` y una respuesta «no» sobre una OVI cuyo ticket tiene la misma pieza
- WHEN se calcula la medición
- THEN no hay falla repetida

### RQ-TC-67 · Lectura de la medición: `GET` de servidor con sesión y sin más permiso

El servidor **SHALL** exponer un `GET` nuevo que sirve la medición de RQ-TC-65 y RQ-TC-66. La ruta **SHALL** pasar
sólo por `requireAuth` y **MUST NOT** exigir ningún permiso, cargo ni rol adicional (SUPUESTO S-4, reversible: se revierte
añadiendo `requireAdmin` o un predicado de `shared` a la ruta y al acceso). Es el mismo nivel que la lectura de la ficha
(`apps/desk/server/routes/garantiaProveedor.ts:18`, `:31`). **MUST NOT** copiarse el nivel de Análisis o Indicadores, que
piden `requireAdmin` (`apps/desk/server/routes/analisis.ts:5`, `:11`; `apps/desk/server/routes/indicadores.ts:41`).

El servidor **SHALL** leer todas las fichas «sí» en la capa de datos, entregarlas a la función de `shared` y devolver
**su resultado tal cual**. **MUST NOT** agrupar, sumar, normalizar ni decidir qué es repetido por su cuenta. Es lectura
pura: **MUST NOT** escribir nada, y la única guarda de la ruta es la sesión (`401`); no hay pruebas de posición porque no
hay otra guarda. La respuesta es la misma para todo usuario con sesión.

#### Scenario: sin sesión, 401 — ROJO
- GIVEN una petición sin sesión
- WHEN llama al `GET` de la medición
- THEN responde `401` y no consulta las fichas

#### Scenario: cualquier usuario con sesión recibe la medición — ROJO
- GIVEN un usuario con sesión, sin cargo de Director Técnico ni rol de administrador
- WHEN llama al `GET` de la medición
- THEN responde éxito con el resultado de la función de `shared` sobre las fichas «sí»

#### Scenario: dos usuarios distintos reciben lo mismo — ROJO
- GIVEN dos usuarios con sesión de roles distintos y las mismas fichas
- WHEN ambos llaman al `GET`
- THEN reciben la misma medición

#### Scenario: el servidor sirve el resultado de `shared` sin recalcular — ROJO
- GIVEN fichas «sí» de varios estados, con una «no» y una sin valor reclamado
- WHEN se llama al `GET`
- THEN el cuerpo es igual al que devuelve la función de `shared` sobre esas mismas fichas
- AND en la capa de servidor no existe suma ni agrupación propia (se comprueba al revisar el código, no por una prueba)

#### Scenario: la lectura no escribe — ROJO
- GIVEN fichas existentes
- WHEN se llama al `GET`
- THEN ninguna ficha ni respuesta cambia

### RQ-TC-68 · Vista de sólo lectura de la medición, para todo usuario con sesión

El cliente **SHALL** ofrecer una vista nueva, accesible desde `apps/desk/src/components/Header.tsx`, que muestre lo que
sirve el `GET` de RQ-TC-67: por fabricante, lo reclamado, lo recuperado, el cociente (o «no disponible»), el número de
fichas, las sin resolver y las sin valor reclamado; y la lista de piezas con fallas repetidas. El acceso a la vista
**SHALL** enseñarse a todo usuario con sesión; esa decisión no tiene otra imposición que la sesión del `GET`
(RQ-TC-67, regla invariable 13, punto 3).

La vista **SHALL** ser de sólo lectura y pintar lo que sirve el servidor:

- **MUST NOT** agrupar, sumar, normalizar ni decidir qué es una falla repetida (eso es RQ-TC-65 y RQ-TC-66).
- **MUST NOT** fijar umbrales, porcentajes de alarma ni colores de semáforo (SUPUESTO S-5, reversible): ningún estado
  de la medición se pinta como bueno o malo.
- **MUST NOT** ofrecer ninguna escritura: ni botones de acción, ni formularios, ni exportación, ni filtros por fecha, ni
  gráficos.
- **SHALL** enseñar los recuentos junto a las sumas (riesgo: pocas fichas al principio hacen poco significativas las
  cifras), y un estado vacío en español cuando no hay fichas «sí».
- Todo texto visible **SHALL** estar en español.

Al ser `.tsx`, queda fuera de la red de pruebas (F0-00); su criterio es de revisión: el fichero no contiene agrupaciones ni
sumas propias.

#### Scenario: cualquier usuario con sesión ve el acceso y la vista
- GIVEN un usuario con sesión, sin cargo ni rol especial
- WHEN abre la aplicación
- THEN el acceso a la vista aparece en la cabecera y la vista muestra la medición servida

#### Scenario: la vista no calcula nada
- GIVEN el código de la vista
- WHEN se revisa
- THEN no contiene `reduce`/sumas, agrupaciones ni normalización de fabricante o referencia: sólo pinta los campos del `GET`

#### Scenario: sin umbrales ni semáforos
- GIVEN un fabricante con cociente 0 y otro con cociente 1
- WHEN se muestran en la vista
- THEN ambos se pintan con el mismo estilo neutro, sin color de alerta

#### Scenario: sin escrituras
- GIVEN la vista abierta
- WHEN se recorre
- THEN no existe ningún control que cree, edite o borre una ficha ni una respuesta

#### Scenario: sin fichas «sí», estado vacío
- GIVEN que el `GET` devuelve ningún fabricante ni piezas repetidas
- WHEN se abre la vista
- THEN se enseña un texto en español que dice que aún no hay reclamaciones, sin tablas vacías ni error
