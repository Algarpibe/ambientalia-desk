# Delta para transitions-st

## ADDED Requirements

### Requirement: RQ-TS-42 · Las dos ramas de cierre: `Pendiente de facturar` y «Facturar»

Fuente: `decision/c4-dos-ramas` (`openspec/config.yaml:1854`) y maestro M1.3.5
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1343-1361`; vías en `:1347-1352`).

**El estado.** `Pendiente de facturar` **SHALL** registrarse en `CLASIFICACION_EN_ESPERA` con clase `ninguna` (supuesto
S-3: como `Por Facturar`, espera un acto de Comercial dentro de la aplicación), **SHALL** ser estado de servicio, de la
fase `cierre`, con columna propia en el tablero, y **SHALL NOT** entrar en `ESTADOS_SIN_SALIDA`. Es abierto: produce
`statusType: 'Open'`.

**La rama sin factura.** `entrega_sin_factura` **SHALL** llevar de `Por Entregar / Sin facturar` a `Pendiente de facturar`,
con el mismo id, el mismo nombre, la misma área y los mismos campos. La rama con factura no cambia.

**La transición «Facturar».** `facturar` **SHALL** declararse en `TRANSITIONS` con `from: ['Pendiente de facturar']`,
`to: 'Finalizado'`, área `Comercial` (supuesto S-2) y, además del comentario y la derivación que llevan todas, dos campos
obligatorios: «Número de factura» (`text`, a `tickets.custom_fields` y a la traza; supuesto S-1) y «Fecha De Factura»
(`date`, que va a `tickets.fecha_factura` por `PROMOTED_COLUMNS`). Es la ÚNICA salida de `Pendiente de facturar`. No hay
estado «Facturado»: facturado es `fecha_factura`. `facturar` **SHALL NOT** tener excepción de cargo.

**La guarda.** Además de la presencia que ya impone `buildTransitionPlan`, el servidor **SHALL** rechazar en el `422`
agregado del escalón C un número de factura que quede vacío tras recortar y una fecha que no sea un día de calendario
real. El orden es el de F1B-10: el `409` de estado y el `403` de área van antes; dentro del `422`, la presencia va
delante del contenido.

**Regla invariable 13, decisión a decisión.**

| # | Lo que decide el cliente | Qué impone el servidor | Estado |
|---|---|---|---|
| 1 | El botón «Facturar» sólo aparece en `Pendiente de facturar` | `409` de estado (`ticketService.ts`, `t.from.includes`) | Espejo legítimo cuando su escenario esté en verde |
| 2 | El botón sólo lo ve Comercial | `403` de área (`canExecuteTransition`) | Espejo legítimo, ya probado por el barrido de permisos |
| 3 | Número y fecha obligatorios (asterisco) | `buildTransitionPlan` (presencia) y la guarda nueva (contenido) | Espejo legítimo cuando sus escenarios estén en verde |
| 4 | La fecha es una fecha (`input type="date"`) | La guarda nueva (día real) | Ídem |

#### Scenario: el catálogo declara el estado, la rama y «Facturar» — ROJO
- GIVEN `TRANSITIONS` y `CLASIFICACION_EN_ESPERA` tras el cambio
- WHEN se leen `entrega_sin_factura`, `facturar` y `Pendiente de facturar`
- THEN `entrega_sin_factura` va a `Pendiente de facturar`; `facturar` va de `Pendiente de facturar` a `Finalizado`, área
  `Comercial`, con «Número de factura» y «Fecha De Factura» obligatorios; y el estado es `ninguna`, de fase `cierre`

#### Scenario: «Facturar» registra la factura y su fecha y cierra el ticket — ROJO
- GIVEN un ticket en `Pendiente de facturar` y un usuario de Comercial
- WHEN ejecuta `facturar` con número `FV-1234` y fecha `2027-01-20`
- THEN responde `200`; el ticket queda en `Finalizado` con `status_type` `Closed`, `fecha_factura` `2027-01-20` y
  «Número de factura» `FV-1234` en `custom_fields` y en la traza

#### Scenario: «Facturar» sin factura o sin fecha no pasa — ROJO
- GIVEN un ticket en `Pendiente de facturar`
- WHEN se ejecuta `facturar` sin número, con un número de sólo espacios, sin fecha o con `2027-02-30`
- THEN responde `422` con el error de cada caso y el ticket no se mueve

#### Scenario: otra área no factura — ROJO
- GIVEN un ticket en `Pendiente de facturar` y un usuario sólo de Servicio Técnico
- WHEN ejecuta `facturar` con valores válidos
- THEN responde `403` de área y el ticket no se mueve

#### Scenario: las guardas de «Facturar» van en el orden de F1B-10 — ROJO
- GIVEN un ticket en `Por Facturar` y un cuerpo de `facturar` sin número
- WHEN lo ejecuta un usuario de Servicio Técnico
- THEN responde `409` de estado (no `403` ni `422`); en `Pendiente de facturar`, el mismo cuerpo da `403`; y un Comercial
  sin fecha y con número de espacios recibe un solo `422` con la presencia de la fecha antes que el contenido del número

### Requirement: RQ-TS-43 · Las dos ramas avanzan y no vuelven

El subgrafo de cierre —`Por Facturar`, `Liberación Comercial`, `Por Entregar`, `Por Entregar / Sin facturar` y
`Pendiente de facturar`— **SHALL NOT** contener ningún ciclo, y ninguna transición que salga de uno de ellos **SHALL**
llevar a un estado anterior del subgrafo. De `Pendiente de facturar` **SHALL** salirse sólo a `Finalizado`. Lo vigila un
invariante del grafo derivado de `TRANSITIONS`, no una lista escrita a mano.

Con el ciclo desaparece su reentrancia: `Fecha Remisión de Salida` y `Fecha prevista de facturación` **SHALL NOT** ser
campos de fecha reentrantes, y la fila de la columna 47 de `INDICADORES_G6` (`alcance: 'C4'`) **SHALL** salir del cruce,
porque su campo deja de serlo. Quedan **nueve** campos reentrantes (siete obligatorios), **ocho** casos y **dos** ciclos.

#### Scenario: no hay ciclo entre los estados de cierre — ROJO
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se calculan los componentes fuertemente conexos del grafo
- THEN ninguno contiene un estado de cierre, y los dos que quedan son los de diagnóstico y espera

#### Scenario: una transición que vuelva a cerrar el ciclo se pone en rojo — MUTACIÓN
- GIVEN el catálogo con `entrega_sin_factura` devuelta a `Por Facturar`, o con una transición de `Pendiente de facturar`
  a `Por Facturar`
- WHEN corre el invariante
- THEN falla

#### Scenario: de `Pendiente de facturar` sólo se sale a `Finalizado` — ROJO
- GIVEN `TRANSITIONS`
- WHEN se listan las salidas de `Pendiente de facturar`
- THEN son exactamente `[facturar]` y su destino es `Finalizado`

#### Scenario: la reentrancia pierde el ciclo de cierre — ROJO (prueba editada a propósito)
- GIVEN la tabla de reentrancia tras el cambio
- WHEN se cuentan casos y campos
- THEN hay ocho casos, nueve campos (siete obligatorios), sin `Fecha Remisión de Salida` ni `Fecha prevista de
  facturación`, e `INDICADORES_G6` ya no lleva la columna 47

## MODIFIED Requirements

### Requirement: RQ-TS-05 · Alcanzabilidad de los 22 estados de servicio

**Verificado por cierre transitivo** sobre `TRANSITIONS` (la cifra se fija en la prueba; la tabla es la
derivación):

| Desde | Estados alcanzados, contando el origen | No alcanzados |
|---|---|---|
| `OV asignada` | 20 | `Ticket creado`, `Remisión creada` |
| `Ticket creado`, sólo por botones | 20 | `OV asignada`, `Remisión creada` |
| `Ticket creado`, sumando el paso sin botón de RQ-TS-03 | 21 | `OV asignada` |

`Pendiente de facturar` (RQ-TS-42) se alcanza por `entrega_sin_factura`. (Previously, hasta F1C-02: 19, 19 y 20 sobre 21
estados. Hasta F1C-01: 18, 18 y 19 sobre 20 estados; `Anulado` (RQ-TS-40) se alcanza desde las dos esperas externas y los tres orígenes de Rechazo. Antes de F1C-09: 19, 19 y 20 sobre 21, por `Pendiente`.)

`Remisión creada` **MUST NOT** ser alcanzable por ninguna transición con botón; su única entrada es el paso
sin botón de `estadoPorRemision.ts`. No hay estados huérfanos y no hay callejones sin salida más allá de
`Finalizado` y `Anulado`.

**Discrepancia con el maestro (R08.1, histórica).** M1.3.8 (`R08.1.md:1413`) decía «18 desde `OV asignada`,
y desde `Ticket creado` los otros 20». Las dos cifras eran correctas pero no sobre la misma base. Con 22
estados de servicio la conclusión —«no hay estados huérfanos»— se sostiene.

#### Scenario: alcanzabilidad desde `OV asignada`
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se calcula el cierre transitivo desde `OV asignada`
- THEN alcanza 20 estados y no alcanza `Ticket creado` ni `Remisión creada`

#### Scenario: no hay huérfanos con el paso sin botón
- GIVEN `TRANSITIONS` y el paso `TRANSICION_REMISION_CONFIRMADA`
- WHEN se calcula el cierre desde `Ticket creado`
- THEN alcanza 21 estados, todos menos `OV asignada`

### 3.3 · C4 y la reentrancia — nueve campos de fecha (once hasta F1C-02) que una segunda pasada reescribe · **destino F1C-06, C9**

**Comportamiento actual.** El grafo tiene ciclos, y las transiciones internas a un ciclo reescriben sus campos de fecha
al recorrerlo otra vez. Los campos afectados **SHALL** ser exactamente **nueve**, derivados del grafo y no de una tabla
escrita a mano (`packages/shared/src/reentrancia.ts:218`, conjunto fijado en `invariantesGrafo.test.ts`).

**C4 está corregida (F1C-02, RQ-TS-43).** El ciclo entre `Por Facturar` y `Por Entregar / Sin facturar` desapareció:
`entrega_sin_factura` lleva a `Pendiente de facturar`, y de ahí sólo se sale a `Finalizado`. `Fecha Remisión de Salida`
se escribe una sola vez (maestro M1.3.5, `R08.4.md:1356`) y `Fecha prevista de facturación` deja de ser reentrante.
(Previously, hasta F1C-02: once campos, con el ciclo de cierre que podía recorrerse indefinidamente y pisaba `Fecha
Remisión de Salida`.)

**Lo que salva el caso, y por qué esto no obliga a rediseñar aquí:** `ticket_transitions.values` es
`jsonb` y guarda **todos** los valores de cada transición (`repo.ts:314-318`). Las columnas de
`tickets` guardan el **último** valor; el historial guarda **todos**. De ahí la regla que esta spec
deja escrita para `kpis` y F1C-06:

> **Los KPIs de G.6 SHALL calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`.**

Cuatro indicadores de G.6 —columnas 50, 53, 57 y 58— quedan rotos y **sin dueño** asignado
(`reentrancia.ts:71-83`). La columna 47, que era la de C4, sale del cruce con F1C-02: su campo dejó de ser reentrante.
F1C-02 resolvió C4 quitando el ciclo, no eligiendo entre las dos soluciones de P34 (`reentrancia.ts:32`), que siguen
siendo la vía para los ciclos que quedan.

### Requirement: RQ-TS-26 · La cifra anclada del maestro dice 33 / 41 / 22 en el mismo commit que el código

`openspec/config.yaml` **SHALL** declarar en `cifras_ancladas` `transiciones` = 33, `pasos_del_mapa` = 41 y
`estados` = 22 de servicio. La descripción de la capacidad `transitions-st` en `capabilities` **SHALL** decir «33
transiciones y 22 estados». Estos valores **SHALL** coincidir con `TRANSITIONS.length`, con las aristas del diagrama
completo y con `ESTADOS_SERVICIO.length`, y **SHALL** cambiar en el mismo commit que el código. El texto `codigo` de
`pasos_del_mapa` **SHALL** nombrar las 33 transiciones y la arista de `anulacion` desde sus cinco orígenes. (Previously,
hasta F1C-02: 32 / 40 / 21, fijadas por F1C-01; hasta F1C-01: 31 / 35 / 20, fijadas por F1C-09.)

#### Scenario: las tres cifras coinciden con el código
- GIVEN `cifras_ancladas` y el código tras el cambio
- WHEN se comparan
- THEN 33 = `TRANSITIONS.length`, 41 = aristas del diagrama completo y 22 = `ESTADOS_SERVICIO.length`

#### Scenario: la mención a `Pendiente` de `esperas` queda coherente
- GIVEN la entrada `esperas` de `cifras_ancladas`
- WHEN se lee su recuento de estados de servicio
- THEN no cuenta `Pendiente` entre los 22; el recuento de espera que lee el barrido es el del código (12 desde E-226, `RQ-TS-39`)


### Requirement: RQ-TS-35 · «Liberación sin factura» deja de ser una casilla: exige Motivo de lista cerrada y Fecha prevista de facturación

**La letra de Gerencia** (`decision/anexo-33-checkbox`, `respuesta_textual`, 2026-09-24; el maestro vigente la recoge en
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:5127-5129`, «M1.3.5 · nº 33»):

> «Deja de ser un checkbox. La transición «Liberación sin factura», que sólo ejecuta el Director Comercial, exige dos campos
> obligatorios en su lugar: (1) Motivo, de una lista cerrada: fecha de corte de facturación del cliente · servicio incluido
> en contrato con facturación periódica · autorización excepcional de Dirección Comercial, con texto obligatorio; y (2) Fecha
> prevista de facturación. Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa al Director
> Comercial. Las liberaciones registradas antes del arreglo del 09/09 conservan su casilla tal como se guardó y se marcan
> según el criterio ya decidido para el histórico (c2); no se reescriben.»

**Qué se construye y qué es letra frente a supuesto.**

| Pieza | Letra o supuesto | Contenido |
|---|---|---|
| La casilla desaparece | Letra («Deja de ser un checkbox») | `liberacion_sin_factura` **SHALL NOT** declarar ningún `checkbox`; la casilla no convive con los campos nuevos |
| Campo Motivo | Letra | `select`, **obligatorio**, clave `Motivo de liberación sin factura` y etiqueta visible «Motivo» (diseño D2) |
| Campo Fecha | Letra | `date`, **obligatorio**, etiqueta «Fecha prevista de facturación» |
| Lista cerrada de **tres** motivos | Letra (el texto) / **supuesto S-3** (la mayúscula inicial) | véase abajo |
| Texto de la autorización | Letra en que existe un texto obligatorio; **supuesto S-1** en que sólo lo exige el tercer motivo; **supuesto S-2** en la etiqueta | campo `text`, `required` en el catálogo **falso**; lo exige la guarda del servidor |
| Sólo el Director Comercial | Letra, **ya construida** | `RQ-PM-17` de `permissions`; este requisito no la toca |
| Motivo y fecha en columnas propias | **Supuesto S-4** | columnas anulables de `tickets`, sin relleno |
| La transición deja de escribir `liberacion_sin_facturar` | **Supuesto S-6** (consecuencia de «Deja de ser un checkbox») | véase «Persistencia» |

**La lista cerrada, a la letra.** Las opciones del campo Motivo **SHALL** ser exactamente tres, **en este orden**
(la tercera no puede ir delante: el arnés de pruebas toma la primera opción de todo `select`, `appHarness.ts:78`):

1. «Fecha de corte de facturación del cliente»
2. «Servicio incluido en contrato con facturación periódica»
3. «Autorización excepcional de Dirección Comercial»

El texto de cada opción es el de la decisión, **letra por letra**; sólo la mayúscula inicial es supuesto S-3.

**La guarda del servidor (escalón C).** El servidor **SHALL** imponer el contenido de la liberación; no basta con el
desplegable ni con `input type="date"` del cliente. Hoy el servidor no comprueba las opciones de ningún `select`
(`buildTransitionPlan` sólo mira presencia, `transitionExec.ts:76-77`), así que sin esta guarda el desplegable sería la
única guarda de la lista cerrada. La guarda **SHALL** vivir en `packages/shared`, **SHALL** ser una función pura sobre la
transición y los valores, y **SHALL** leer las opciones **del propio campo del catálogo** (una sola fuente de la lista).
Comprueba tres cosas, y sólo sobre lo que **llega**:

1. **Motivo en la lista.** Un motivo presente que **no** sea igual, carácter por carácter, a una de las tres opciones
   **SHALL** producir un error de la guarda. Un motivo ausente **MUST NOT** producir error de la guarda: lo dice el
   obligatorio de presencia (`Falta el campo obligatorio: Motivo`, `RQ-TS-08`).
2. **Fecha de calendario real.** Una fecha prevista presente que no sea un día real del calendario en formato
   `YYYY-MM-DD` (p. ej. `2026-02-30`, o una fecha en otra forma) **SHALL** producir un error de la guarda. La fecha se
   evalúa **tal como llega**: `AAAA-MM-DD` estricto, y un ISO con hora (`2026-10-04T10:00:00Z`) se rechaza (diseño D8; el
   motor recortaría sin validar, `transitionExec.ts:33`). Una fecha ausente la dice el obligatorio de presencia.
3. **Texto con la autorización excepcional (supuesto S-1).** Con el motivo «Autorización excepcional de Dirección
   Comercial», un texto ausente, vacío o **de sólo espacios** **SHALL** producir un error de la guarda que nombre el campo
   («Texto de la autorización», supuesto S-2). Con el primer o el segundo motivo el texto **MUST NOT** ser obligatorio.

Los errores de la guarda **SHALL** salir en el **mismo** `422 { errors }` agregado que los de presencia y los de las fechas
derivadas (`ticketService.ts:134`), **detrás** de ellos y en una sola respuesta; el mensaje **SHALL** nombrar qué campo
falla y por qué, de modo accionable. El texto exacto de cada mensaje lo decide el diseño.

**La fecha puede ser pasada (supuesto SP-1).** La letra no exige que la fecha sea futura; el servidor **MUST NOT** rechazar
una fecha por ser pasada. Es la pregunta abierta E-nueva-1 de la propuesta (con fecha pasada, la alarma de F1C-02 saltaría
nada más liberar); si Gerencia contesta que debe ser futura, es un cambio posterior.

**Posición exacta (escalón C).** La guarda **SHALL** ir **dentro** del `422` agregado, en la misma sentencia que los
obligatorios, las fechas derivadas, la cuarentena y el certificado, **detrás** de ellos. Queda **detrás** del `403` de
área y del `403` de cargo (escalón B, `RQ-PM-17`, `RQ-PM-18`) y del `409` de estado, y **delante** del `422` de la persona
derivada (`ticketService.ts:138-142`). El `409` de orden de venta (`ticketService.ts:148-152`) **no** se puede activar a la
vez que esta guarda, porque `liberacion_sin_factura` no declara ningún campo de orden de venta: ese par no admite prueba de
posición y no se finge una.

**Persistencia.** Con `200`:

- el motivo **SHALL** quedar en una columna propia de `tickets` y la fecha prevista en otra, ambas anulables y fuera de
  `TICKET_COLS` (supuesto S-4: nombres `liberacion_motivo` y `fecha_prevista_facturacion`, `text` y `date`);
- el texto **SHALL** escribirse **siempre** en `tickets.custom_fields` —el de esta liberación o `null` (diseño D7)— y los
  **tres** valores en `ticket_transitions.values` (`packages/zoho-sync/src/db/repo.ts:314-318` guarda todos los valores).
  `custom_fields` se fusiona (`custom_fields || …`, `repo.ts:307-310`), pero como el texto se escribe siempre, una
  liberación sin texto deja `null` y no hereda la autorización de una anterior. **La fuente de verdad de cada liberación
  sigue siendo su fila de traza**: el texto que cuenta para una liberación es el de **su** fila de traza;
- `liberacion_sin_facturar` **SHALL** quedar sin tocar por la transición (supuesto S-6);
- las filas de `tickets` y de `ticket_transitions` que ya existen **MUST NOT** modificarse, marcarse ni rellenarse al
  aplicar el esquema o el cambio (el marcado del histórico es de `p64-historico-c1`).

El esquema **SHALL** añadir las dos columnas con `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS` **sin calificar** (`tickets`
es de `DESK_TABLES`), al final de `schema.sql`; el recuento de sentencias `ALTER` pasa de 53 / 29 / 24 a 55 / 29 / 26 (remedido el 2026-10-04 contra `8c182fb`).

**La sincronización no pisa motivo ni fecha.** Las dos columnas **MUST NOT** estar en `TICKET_COLS`: `upsertTicket`
construye su `SET` sólo con esa lista (`repo.ts:44-54`, `:76-91`), así que el sincronizador nunca las reescribe; y además
sale entero si la fila es `managed_by_app` (`repo.ts:71`), que `writeTransition` marca (`repo.ts:298`). Molde:
`fecha_aviso_cliente` (`repo.test.ts`, guarda propia).

**Re-liberación.** Desde F1C-02 el grafo ya no la produce: `entrega_sin_factura` lleva a `Pendiente de facturar`
(RQ-TS-42) y las ramas no vuelven (RQ-TS-43). Sigue siendo posible en los tickets que volvieron a `Por Facturar` por el
ciclo antes de F1C-02, que se quedan donde están (supuesto S-9 de F1C-02), y para ellos rige lo que sigue. (Previously,
hasta F1C-02: el ciclo `Por Facturar` → `Por Entregar / Sin facturar` → `Por Facturar` podía recorrerse más de una vez.)
En cada liberación el servidor **SHALL** exigir motivo y fecha de nuevo,
leyendo **sólo el cuerpo** de la petición, y **SHALL** escribir los valores de esa liberación; la traza conserva **todas**
las liberaciones. Los campos de esta transición **MUST NOT** quedar bloqueados ni prellenados con el valor de la liberación
anterior en el cliente: `yaLoTraeElTicket` deja de aplicar a ellos.

**Reentrancia.** Desde F1C-02 `Fecha prevista de facturación` **SHALL NOT** ser reentrante: el ciclo de cierre
desapareció (RQ-TS-43) y la tabla de reentrancia queda en **nueve** campos (siete obligatorios) y **ocho** casos. En un
ticket que se re-libera desde el histórico, la columna guarda el **último** valor y la traza **todos**
(`reentrancia.ts:16-24`). (Previously, hasta F1C-02: once campos, nueve obligatorios, diez casos, con la fecha prevista
entre ellos.)

**Regla invariable 13, decisión a decisión.**

| # | Lo que decide el cliente | Qué impone el servidor | Estado |
|---|---|---|---|
| 1 | Motivo obligatorio (asterisco) | `buildTransitionPlan` (`transitionExec.ts:77`), traducido a `422` en `ticketService.ts:134` | Espejo legítimo: imposición probada |
| 2 | Fecha obligatoria | la misma | Espejo legítimo |
| 3 | El motivo sólo puede ser uno de tres (desplegable) | **La guarda nueva** (lista cerrada) | Espejo legítimo **sólo cuando** sus escenarios estén en verde; hoy no existe y el desplegable sería la única guarda |
| 4 | La fecha es una fecha (`input type="date"`) | **La guarda nueva** (día real) | Ídem; hoy el servidor sólo recorta (`transitionExec.ts:33`) |
| 5 | Texto exigido con el tercer motivo | **La guarda nueva** | El cliente **no decide nada**: pinta siempre el campo, sin asterisco, y el `422` nombra lo que falta |
| 6 | El botón sólo lo ve quien puede | `403` de área y de cargo (`ticketService.ts:129-131`) | Espejo legítimo, ya probado (`RQ-PM-17`, `RQ-PM-18`) |
| 7 | No bloquear ni prellenar en una segunda liberación | No necesita contrapartida: el servidor exige los obligatorios en cada ejecución y lee sólo el cuerpo | Comodidad |

Además, el cliente **SHALL** mostrar el motivo y la fecha en la ficha del ticket (supuesto S-5); es presentación, no decide
ni impide nada.

**Fuera de este requisito, a propósito.** (a) La **alarma por fecha vencida** y el estado «Pendiente de facturar»: los
construye F1C-02 (RQ-TS-42 y `derivacion-avisos` RQ-AV-23). (b) El **marcado del histórico** de liberaciones con casilla (`p64-historico-c1`): este cambio
no toca filas viejas. (c) **Decisionales** y propietario del registro (resto de F1C-05). (d) Exigir que la fecha sea futura
(SP-1). (e) Borrar la columna `liberacion_sin_facturar` o su entrada en `PROMOTED_COLUMNS`. (f) Cualquier cambio de las
demás guardas de `executeTransition` (IV-12 incluido).

#### Scenario: El catálogo declara motivo, fecha y texto, y ninguna casilla — ROJO
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se lee `liberacion_sin_factura`
- THEN declara el comentario, «Motivo» (clave `Motivo de liberación sin factura`, `select`, obligatorio), «Fecha prevista de facturación» (`date`, obligatoria) y el
  texto de la autorización (`text`, no obligatorio en el catálogo), y **no** declara ningún campo `checkbox`

#### Scenario: Las tres opciones, a la letra y en orden — ROJO
- GIVEN el campo «Motivo» de `liberacion_sin_factura`
- WHEN se leen sus opciones
- THEN son exactamente «Fecha de corte de facturación del cliente», «Servicio incluido en contrato con facturación
  periódica» y «Autorización excepcional de Dirección Comercial», en ese orden

#### Scenario: `transitions.ts` conserva su número de líneas — COMPROBACIÓN DE CIERRE
- GIVEN `packages/shared/src/transitions.ts` en `2a74fdc` y tras el cambio
- WHEN se comparan
- THEN tienen el mismo número de líneas y sólo difiere la declaración de `liberacion_sin_factura`; se comprueba en el
  `verify`, no con una prueba de ejecución

#### Scenario: Sin motivo, el obligatorio de presencia responde 422 y el ticket no se mueve — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida y sin motivo
- THEN `422` con «Falta el campo obligatorio: Motivo», el ticket sigue en `Por Facturar` y no se escribe fila de traza

#### Scenario: Sin fecha, el obligatorio de presencia responde 422 — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y sin fecha
- THEN `422` con «Falta el campo obligatorio: Fecha prevista de facturación» y el ticket sigue en `Por Facturar`

#### Scenario: Un motivo fuera de la lista se rechaza aunque lo envíe el cliente — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con una fecha válida y un motivo que no es ninguna de las tres opciones
- THEN `422` con el error `El motivo debe ser uno de: …` (diseño §4, que lista las tres opciones y no contiene la palabra
  «Motivo» con mayúscula), sin cambio de estado ni fila de traza

#### Scenario: La igualdad con la lista es exacta — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con una fecha válida y un motivo que sólo difiere de una opción en las mayúsculas
- THEN `422` por motivo fuera de la lista

#### Scenario: Una fecha que no es un día real se rechaza — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y la fecha `2026-02-30`
- THEN `422` con un error que nombra «Fecha prevista de facturación» y el ticket sigue en `Por Facturar`

#### Scenario: Una fecha en otra forma se rechaza — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con motivo válido y la fecha `04/10/2026`
- THEN `422` por fecha

#### Scenario: Una fecha pasada se acepta (supuesto SP-1) — ROJO
- GIVEN un Director Comercial, un ticket en `Por Facturar` y una fecha de calendario real anterior a hoy
- WHEN ejecuta `liberacion_sin_factura` con motivo válido
- THEN responde `200`

#### Scenario: La autorización excepcional sin texto se rechaza (supuesto S-1) — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida, el motivo «Autorización excepcional de Dirección Comercial» y sin texto
- THEN `422` con un error que nombra «Texto de la autorización»

#### Scenario: La autorización excepcional con texto de sólo espacios se rechaza — ROJO
- GIVEN el mismo caso, con el texto `"   "`
- WHEN se ejecuta
- THEN `422`; el texto se comprueba **tras recortar espacios**

#### Scenario: La autorización excepcional con texto se acepta — ROJO
- GIVEN el mismo caso, con un texto no vacío
- WHEN se ejecuta
- THEN responde `200` y el ticket pasa a `Por Entregar / Sin facturar`

#### Scenario: Los otros dos motivos no exigen texto (supuesto S-1) — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con fecha válida y el primer motivo, y en otro ticket con el segundo, ambos sin texto
- THEN ambos responden `200`

#### Scenario: Los errores de contenido salen juntos y detrás de los de presencia — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura` con el tercer motivo, sin texto y sin fecha
- THEN la respuesta es un solo `422 { errors }` con el error de presencia de la fecha antes que el error de texto

#### Scenario: Con 200 se escriben las columnas, el texto y la traza, y no la casilla — ROJO
- GIVEN un Director Comercial y un ticket en `Por Facturar` con `liberacion_sin_facturar` en un valor conocido
- WHEN ejecuta `liberacion_sin_factura` con el tercer motivo, una fecha válida y un texto
- THEN `liberacion_motivo` y `fecha_prevista_facturacion` quedan escritas, el texto queda en `custom_fields`, los tres valores
  quedan en `ticket_transitions.values` y `liberacion_sin_facturar` conserva el valor que tenía

#### Scenario: El texto no se guarda en columna — ROJO
- GIVEN `PROMOTED_COLUMNS` tras el cambio
- WHEN se busca la etiqueta del texto de la autorización
- THEN no está, y el plan de la transición lo lleva a `customFields`

#### Scenario: Las dos columnas están fuera de `TICKET_COLS` — GUARDIÁN
- GIVEN `TICKET_COLS` tras el cambio
- WHEN se comprueba su contenido
- THEN no contiene ni `liberacion_motivo` ni `fecha_prevista_facturacion`; meter una de las dos en la lista debe poner en
  rojo la guarda de `repo.test.ts` (mutación)

#### Scenario: El sincronizador no pisa motivo ni fecha — ROJO
- GIVEN un ticket cuyo motivo y fecha ya se escribieron por la transición
- WHEN `upsertTicket` procesa ese ticket con una fila de Zoho distinta
- THEN motivo y fecha conservan el valor escrito por la aplicación

#### Scenario: El esquema añade las dos columnas sin calificar y el recuento es 55 / 29 / 26 — GUARDIÁN
- GIVEN `schema.sql` tras el cambio
- WHEN el guardián de `migrate.test.ts` recorre las sentencias `ALTER TABLE`
- THEN hay 55 en total, 29 calificadas y 26 sin calificar, y las dos nuevas van sin calificar al final del fichero;
  escribir en el fichero vigilado la misma sentencia calificada como `public.tickets` debe poner en rojo el guardián
  (regla de mutación 2)

#### Scenario: Aplicar el esquema no toca filas existentes — CARACTERIZACIÓN
- GIVEN filas de `tickets` y de `ticket_transitions` anteriores al cambio, algunas con la casilla
- WHEN se aplica el esquema nuevo
- THEN ninguna fila cambia y las dos columnas nuevas quedan en `NULL`

#### Scenario: PL-1 — el 403 de cargo gana a la lista cerrada — CARACTERIZACIÓN (el control con administrador, ROJO)
- GIVEN un Comercial sin cargo, un ticket en `Por Facturar` y un cuerpo con fecha válida y un motivo fuera de la lista
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403` de cargo, no `422`; con un administrador y el mismo cuerpo responde el `422` de la lista

#### Scenario: PL-1 bis — el 403 de área gana a la lista cerrada — CARACTERIZACIÓN
- GIVEN un usuario de `Compras` sin cargo, un ticket en `Por Facturar` y el mismo cuerpo
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` nombra el área, no la lista

#### Scenario: PL-2 — el 409 de estado gana a la lista cerrada — CARACTERIZACIÓN
- GIVEN un ticket fuera de `Por Facturar` y un cuerpo con un motivo fuera de la lista
- WHEN un administrador ejecuta `liberacion_sin_factura`
- THEN responde `409`, no `422`

#### Scenario: PL-3 — la lista cerrada gana a la persona derivada inexistente — ROJO
- GIVEN un administrador, un ticket en `Por Facturar` y un cuerpo con un motivo fuera de la lista **y** una persona derivada
  que no existe
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde el `422` de la lista y su cuerpo **no** contiene el mensaje de la persona derivada

#### Scenario: PL-4 — la presencia va delante del contenido, en un solo 422 — ROJO
- GIVEN un administrador y un cuerpo sin fecha y con un motivo fuera de la lista
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde un solo `422 { errors }` en el que el error de presencia de la fecha aparece **antes** que el de la lista

#### Scenario: Una segunda liberación exige de nuevo motivo y fecha, y no hereda los anteriores — ROJO
- GIVEN un ticket liberado con unos valores que vuelve a estar en `Por Facturar` (histórico anterior a F1C-02)
- WHEN un Director Comercial ejecuta otra vez `liberacion_sin_factura` sin motivo ni fecha
- THEN `422` de presencia; y con valores nuevos válidos responde `200`, las columnas pasan a los valores nuevos y la traza
  tiene dos filas de `liberacion_sin_factura` con sus valores distintos

#### Scenario: Una segunda liberación por otro motivo y sin texto deja el texto en null — ROJO
- GIVEN un ticket liberado con el tercer motivo y un texto que vuelve a estar en `Por Facturar` (histórico anterior a F1C-02)
- WHEN un Director Comercial ejecuta otra vez `liberacion_sin_factura` con el primer motivo, una fecha válida y sin texto
- THEN responde `200` y `tickets.custom_fields` lleva `null` en «Texto de la autorización», no el de la primera liberación;
  la fila de traza de la primera conserva su texto (diseño D7)

#### Scenario: El cliente no bloquea ni prellena los campos de la liberación en una segunda vez — PERSONA
- GIVEN un ticket que ya trae motivo y fecha de una liberación anterior y vuelve a estar en `Por Facturar`
- WHEN el Director Comercial abre el panel de «Liberación sin factura»
- THEN motivo, fecha y texto aparecen vacíos y editables, sin casilla y con el texto siempre pintado y sin asterisco

#### Scenario: La ficha enseña motivo y fecha (supuesto S-5) — PERSONA
- GIVEN un ticket liberado con los campos nuevos
- WHEN se abre su ficha
- THEN muestra el motivo y la fecha prevista de facturación junto a la casilla histórica

#### Scenario: El cargo sigue siendo Director Comercial — CARACTERIZACIÓN
- GIVEN valores válidos de los campos nuevos (el arnés usa la primera opción del `select` y `2026-01-15`)
- WHEN los ejecutan un Director Comercial y un Comercial sin cargo
- THEN el primero recibe `200` y el segundo `403`; el barrido de cargo mantiene la misma única diferencia (`RQ-TS-30`)

#### Scenario: La fecha prevista ya no es reentrante — ROJO (prueba editada a propósito)
- GIVEN el catálogo tras F1C-02
- WHEN corren la tabla de reentrancia y el invariante 6
- THEN la tabla declara ocho casos y nueve campos de fecha reentrantes, siete obligatorios, sin «Fecha prevista de
  facturación», derivados del grafo y no de una lista escrita a mano

#### Scenario: Lo que queda fuera no se construye — CARACTERIZACIÓN
- GIVEN el cambio completo
- WHEN se busca una regla de Decisionales o el propietario del registro
- THEN no existen: son del resto de F1C-05, y archivar este cambio no los da por hechos; la alarma y el estado
  «Pendiente de facturar» los construye F1C-02

