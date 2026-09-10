# Desk 2.0 — Ambientalia

Contexto permanente del repositorio. Lo lee Claude Code en cada sesión, **también los sub-agentes**,
que no leen el documento maestro. Lo que tenga que aplicarse siempre vive aquí, no sólo en el maestro.

Idioma: **español**, registro neutro y profesional. Documentación, `debt.md` y comentarios del código
están en español. Identificadores, rutas, claves de configuración y nombres de capacidad se quedan en
su forma original.

---

## Mapa del proyecto

Monorepo TypeScript con `npm workspaces` (`packages/*`, `apps/*`), paquete raíz `desk-ambientalia`.

| Ruta | Qué es |
|---|---|
| `apps/desk/src` | Cliente React 19 + Vite 6 + Tailwind 3.4 |
| `apps/desk/server` | API Express 5. Sirve además el `dist/` compilado, en el mismo puerto |
| `apps/hub-sync` | Worker de sincronización contra el hub Zoho (Desk, Books, CRM) |
| `packages/shared` | **Núcleo de dominio.** Transiciones, permisos, tipos. Fuente única de reglas |
| `packages/zoho-sync` | Sincronización Zoho Desk ↔ PostgreSQL, configuración y capa de acceso a datos |

### Comandos

```bash
npm test         # vitest run
npm run typecheck  # tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
npm run lint     # eslint .
npm run build    # build del cliente
```

### El documento maestro citable

El maestro es un `.docx` y **no se edita desde el repositorio**. La copia citable por línea es:

    docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md   (4.935 líneas)

Se regenera con `scripts/docx2md.sh <entrada.docx> [salida.md]`. No hay `pandoc` en las máquinas del
equipo: el script son veinte líneas sobre `unzip` y `sed`. Cada revisión del maestro se vuelve a
exportar; el `.docx` sigue siendo el original editable.

Las correcciones que el maestro necesita **no se aplican al `.docx`**: se entregan como texto en
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` para que Gerencia las pegue.

---

## Las tres reglas

### Regla invariable 13 — dónde vive la lógica de dominio

> 1. Si una regla existe en `packages/shared`, el cliente la **consume**; nunca la reescribe.
> 2. Si una decisión **no tiene contrapartida en el servidor**, el cliente no es un espejo: es la
>    guarda. Y una guarda en el cliente no es una guarda.
> 3. Un espejo sólo es legítimo cuando la imposición del servidor **está probada**.

*Por qué existe:* un espejo sin prueba en el servidor no es redundancia defensiva, es la única
comprobación que hay, y vive en el sitio donde no se puede confiar en ella. La regla obliga a decir
cuál de los dos casos es cada vez.

### Regla de método — verificado o hipótesis

> Toda afirmación sobre el comportamiento del código lleva **ruta y línea**; toda afirmación sobre el
> maestro lleva **apartado y línea del `.md`**; lo demás lleva la palabra **«hipótesis»** delante.
> **Una cita de segunda mano es una hipótesis, aunque venga de un documento propio.**

*Por qué existe:* cuatro afirmaciones de las respuestas R01/R02 salieron falsas por citar el maestro
desde el baseline en vez de desde el maestro. La segunda frase no es retórica: es exactamente el
fallo que se produjo.

### Regla de secretos

> Un secreto no entra nunca en un chat, una captura o un prompt. Si aparece en uno, **está quemado**:
> se rota, no se reutiliza. Los valores viven sólo en el gestor de secretos del despliegue.
> Un interruptor que enciende un escritor **nace cerrado** (`=== 'true'`), y va en `.env.example` y
> `DEPLOY.md` con dos frases: qué enciende y qué se rompe si se pone mal. Un flag no documentado se
> trata como defecto, no como configuración.

*Por qué existe:* quince credenciales del proyecto se filtraron por ese canal —chats y capturas—
(`debt.md:31`, `debt.md:840`). Rotarlas y seguir pegándolas en chats es teatro.

---

## Las tres reglas de la mutación — qué mutar para no necesitar revisor

Las de arriba dicen **qué** hay que cumplir. Estas dicen **dónde mirar** para enterarse de que no se
cumple, sin que haga falta que otro lo lea. Salieron de la revisión adversaria de F1B-01
(`git diff c45bcb1 607e26a`, 2026-09-09): de sus cinco hallazgos, **cuatro** los caza una mutación que
la tanda podía haber hecho sola. Una prueba verde no dice que la guarda funcione; dice que la prueba
no sabe distinguir. La mutación es la pregunta que lo averigua: **rómpelo a propósito y mira si
alguien se queja.** Si nadie se queja, el detector no existe.

### Regla de mutación 1 — muta la POSICIÓN de la guarda, no sólo su condición

> Al añadir una guarda, no basta con comprobar que su condición se detecta. **Muévela**: ponla antes
> o después de la guarda vecina y vuelve a correr la suite. Si sigue verde, el orden **no está
> probado** — y si el código declara por comentario que ese orden es deliberado, esa declaración es
> hoy la única prueba que hay, que es tanto como decir ninguna.

*Por qué existe:* H3 de aquella revisión, **ya cerrado por `9ed5635`**. En `607e26a`,
`apps/desk/server/routes/remision.ts:152-157` (el 422 del serial) corría antes de `:174-183` (el 409 de
remisión pendiente) y `:144-147` **declaraba por escrito que era a propósito** —«VA CON LOS OTROS 422
Y ANTES DEL 409»—, pero ninguna prueba lo fijaba: las del 409 usaban `preparar()`, que siempre da
serial, y las del 422 nunca tenían remisión previa. **Cero solapamiento**, así que mover la guarda no
rompía nada y el usuario pasaba de oír «falta el serial» a oír «ya tienes una remisión sin desenlace»
—cierto, y no es su problema—. La prueba que faltaba activa las dos guardas a la vez y hoy está en
`apps/desk/server/remisiones.test.ts:957`. Mutar la condición no lo habría enseñado; mutar la posición
sí.

### Regla de mutación 2 — si la guarda vigila un fichero de datos, muta el FICHERO VIGILADO

> Un guardián que lee un fichero (un `.sql`, un `.env.example`, un catálogo, un JSON) se prueba
> **ensuciando el fichero**, no retocando el guardián. Escribe en él exactamente la sentencia que
> debería rechazar y comprueba que se pone rojo. Mutar el guardián sólo demuestra que el guardián se
> ejecuta; mutar lo vigilado demuestra que **discrimina**.

*Por qué existe:* H2 de aquella revisión, **ya cerrado por `9ed5635`**. El guardián de `ALTER TABLE`
que F1B-01 añadió filtra por el **nombre pelado** de la tabla
(`packages/zoho-sync/src/db/migrate.test.ts:319`, `a.tabla`), y `contacts` es la única colisión entre
las tres listas de `packages/zoho-sync/src/db/migrate.ts:63-64,70-73,80`: está en `DESK_TABLES` y,
calificada, en `BOOKS_TABLES`. Una `ALTER TABLE contacts …` escrita para Books pasaba el guardián como
tabla de Desk. **No había bug vivo** —`packages/zoho-sync/src/db/pool.ts:5` fija
`search_path=desk,public` y `books` nunca está ahí, así que una `ALTER` sin calificar aterriza en
`desk.contacts`—: había un guardián diciendo que estaba bien lo que no lo estaba. Y sólo se ve
escribiendo esa sentencia en el fichero vigilado, que es exactamente lo que hace hoy el fixture
sintético de `migrate.test.ts:391-393`. Blindaje de intención, no corrección de un fallo.

### Regla de mutación 3 — la regla 13 es una casilla que se marca, no un principio que se recuerda

> Antes de cerrar cualquier tanda que toque `apps/desk/src`, **enumera** las decisiones que el cliente
> toma —qué bloquea, qué rellena solo, qué avisa— y para cada una **nombra la línea del servidor** que
> la impone. Sin línea, la decisión es la guarda, y la guarda vive donde no se puede confiar en ella.
> La comparación se hace por escrito, decisión a decisión: la regla 13 recordada de memoria es
> exactamente la que se salta.

*Por qué existe:* H1 y H4 de aquella revisión, dos hallazgos del mismo molde. **Los dos están cerrados
por `9ed5635`, así que lo de abajo se lee contra `607e26a`, no contra el árbol de hoy** — mirar hoy
esas líneas enseña el arreglo, no el fallo. En H1, `apps/desk/src/components/CreateTicket.tsx:148-151`
fijaba `clientId` desde el equipo y `:118`/`:257` bloqueaban el campo, mientras que en el servidor
**no había ninguna comparación** entre `equipo.clientId` y el del cuerpo entre traer el equipo y
escribir el `INSERT` (hoy la guarda existe, `ticketService.ts:50-78`). En H4,
`apps/desk/src/components/CrearRemision.tsx:195` decidía con `!data.equipo.serial` —un serial de sólo
espacios es *truthy* en JS— mientras el servidor sí recortaba antes de decidir
(`routes/remision.ts:153`, `.trim()`); hoy el cliente recorta igual, en esa misma línea. Las dos
tandas conocían la regla 13; las dos la escribieron en sus artefactos; ninguna de las dos hizo la
comparación línea a línea.

**Lo que estas tres NO cazan.** H5 —la divergencia entre `normalizarNombreCliente`
(`apps/desk/server/backfillClientId.ts:47-68`, que pliega acentos y formas societarias) y el
`LOWER(...) LIKE '%q%'` de `searchClients` (`packages/zoho-sync/src/books/repo.ts:117-127`, que no
pliega nada)— es una divergencia **entre dos implementaciones de la misma noción**, ninguna de las
dos rota por separado. Para eso hace falta un lector, o una prueba que las enfrente. Que estas reglas
cubran cuatro de cinco no las convierte en el revisor.

---

## Topología de dos esquemas

PostgreSQL con **dos esquemas** en la base `desk`:

| Esquema | Tablas |
|---|---|
| `desk` | `tickets`, `ticket_transitions`, `activities`, `contacts`, `accounts`, `agents`, `conversations`, `attachments`, `ticket_history`, `equipos` |
| `public` | `catalogo_*`, `remisiones*`, `avisos`, `users`, `roles`, `sessions` |

**Regla dura: toda sentencia de creación de tabla califica el esquema explícitamente**
(`CREATE TABLE ... desk.x` o `public.x`). Un `CREATE` sin calificar ya aterrizó una tabla en el
esquema equivocado en producción.

Hay además una **segunda base de datos**, `zoho-hub`, que publica cuatro tablas hacia `desk` por
replicación lógica. Ver `DEPLOY.md`.

---

## Pruebas de interfaz: excluidas por decisión, no por olvido

`vitest.config.ts:16` fija `environment: 'node'`; `vitest.config.ts:17-20` incluye sólo
`apps/**/*.test.ts` y `packages/**/*.test.ts`. Los 39 ficheros `.tsx` (6.329 líneas) de
`apps/desk/src` quedan fuera de la red de pruebas **por decisión explícita de Gerencia**
(F0-00, 2026-09-08).

**No proponer instalar `jsdom` ni `@testing-library`**, ni ampliar `vitest.config.ts` a `*.test.tsx`,
ni registrar esto como carencia o riesgo en fases posteriores, sin una decisión de Gerencia que
reabra el punto.

---

## Incumplimientos vivos — registrados, no corregidos

**Seis** desvíos vivos. Están anotados para que no se pierdan; **corregirlos no es tarea de la tanda
que los encuentre**, salvo que su destino sea esa tanda. La lista completa, con la misma información,
está también en `openspec/config.yaml` (`incumplimientos_vivos`).

> **⚠️ REGLA: un destino es una promesa, y hay que barrerla al cerrar la épica.** Cuando una épica se
> cierra, **compruébese si algún desvío la nombraba** y reasígnese en el mismo acto. Al cerrar F1A los
> **cuatro** desvíos seguían apuntando a «F1A»: quedaron sin dueño mientras este fichero seguía
> diciendo que lo tenían, y eso se carga en cada sesión y en cada sub-agente como si fuera cierto. Un
> destino que nombra una épica cerrada no es un destino. **Que lo cace el cierre, no el turno
> siguiente.** *(Barrido hecho el 2026-09-09.)*

| Regla | Incumplimiento | Destino |
|---|---|---|
| 1 | `apps/desk/src/lib/boardView.ts:35` clasifica esperas por regex sobre el nombre del estado (`/espera/i`) y diverge del registro de `estados.ts`. **Cuantificado en F0-02: acierta 2 de los 8 estados `en_espera` y no tiene ningún falso positivo.** Se le escapan `Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`, `Solicitado` y `Liberación Comercial`. Es defecto **por defecto**, no por exceso: no hay que estrechar el criterio, hay que sustituirlo por `ESTADOS_EN_ESPERA` | **F1B-08** (`plan:157`, ítem 22 «Interfaz que replica la estructura de Zoho Desk»): alimenta las vistas `abiertos` (`:43`) y `espera` (`:44`). **La dependencia que el destino viejo nombraba ya está satisfecha**: `ESTADOS_EN_ESPERA` existe (`estados.ts:111`) y `boardView.ts` no lo importa |
| — | `apps/desk/src/lib/boardView.ts:49-50` — la vista **«todos» no enseña todos**: devuelve `statusType !== 'Closed'`. Y comparte cuerpo con la rama `default`, así que cualquier clave no reconocida también oculta los cerrados, sin decirlo. Medido en el Zoho Desk de producción: **726 tickets cerrados**. Se cruza con el de `:35`: como `abiertos` y `espera` usan esa regex, hoy **seis estados de espera se listan como «abiertos»** | **F1B-08, tras decisión de Gerencia.** Dos salidas y **la elección no es técnica**: (a) **renombrar** la vista a «Abiertos», que altera menos lo que el equipo tiene aprendido; (b) **cambiar lo que devuelve**, que cumple la expectativa del usuario y la vista homónima de Zoho Desk, a cambio de meter 726 cerrados por omisión. La rama `default` es defecto en los dos casos |
| 1 | `apps/desk/src/lib/valoresTransicion.ts` — regla de dominio sólo en cliente (declarada en el bloque de cabecera `:3-17`, implementada en `valoresConocidos`, `:49-79`) | **PUNTO ABIERTO PARA GERENCIA.** Ninguna tanda lo cubre, y **tampoco es una fila que falte**: el destino viejo («F1A o F1C, decisión de alcance») *era* el aviso de que nadie había decidido. Las tres fechas que deriva son **operandos de KPI** —`Fecha Remisión Entrada` abre el bodegaje de entrada (`bodegaje.ts:60-66`)—, así que no es cosmético. O el servidor las impone, o se declara que son prellenado y los KPIs dicen que su fuente es opcional |
| — | `apps/desk/server/routes/remision.ts:218-226` escribe `salesorder_id` sin llamar a `ticketConOrdenVenta` — la regla «una OV, un ticket» tiene **tres** puertas y sólo **dos** la comprueban | **PUNTO ABIERTO Nº 52 DEL MAESTRO.** `R08.1.md:2071-2079` lista tres variantes reales y habituales y concluye que **«ninguna de las tres encaja en un modelo de "una OV, un ticket"»**. Cerrar la tercera puerta endurecería una regla que el maestro pone en duda: si nº 52 se resuelve a favor de las variantes, el arreglo es **retirar** las dos puertas existentes, no añadir la tercera. El daño ya está medido (`ordenVentaUnTicket.test.ts:150-158`) y hay un `it.fails` esperando (`:161`) |
| — | `apps/desk/src/components/TicketCard.tsx:14-23` — mapa de colores muerto: claves en mayúsculas (`INGRESADO`, `PROCESO`…) que sólo casan con `mockData.ts`, nunca con los estados reales | **F1B-08**, cosmético. Misma fila que los dos de `boardView`: la tarjeta es del listado. Hoy no pinta mal, pinta neutro — cae siempre en el respaldo `bg-slate-100` |
| — | `apps/desk/server/services/ticketService.ts:39` — al completar `clientId` desde la orden de venta (`clientId = clientId ?? ov.clientId ?? null`), si el cuerpo YA trae su propio `clientId`, el de la OV nunca se contrasta con nada: un ticket puede quedar con cliente y equipo de un lado y la orden de venta de otro, sin ningún aviso. La guarda equipo↔cliente de `cerrar-hallazgos-revision-f1b-01` (P1, `:65-77`) compara el `clientId` final contra `equipo.clientId`, no contra `ov.clientId`, así que esta pareja queda fuera de su alcance a propósito (`proposal.md` §3) | **PUNTO ABIERTO, sin destino** — a propósito, criterio de aceptación nº 8 de `cerrar-hallazgos-revision-f1b-01`. Misma familia que IV-4 (`routes/remision.ts:218-226`, «una OV, un ticket» con puertas sin comprobar) y toca el mismo punto abierto nº 52 del maestro (`R08.1.md:2071-2079`): cerrarlo antes de que Gerencia resuelva nº 52 podría endurecer una regla que el propio maestro pone en duda |

**IV-3 está CERRADO y ya no cuenta.** Era el espejo de `canExecuteTransition` en
`apps/desk/src/components/TransitionPanel.tsx:56-58`. F0-04 lo cerró:
`apps/desk/server/permisos.test.ts:41-110` barre las 34 transiciones × 3 áreas contra el servidor, y
`:35-39` declara el efecto —el filtro del navegador pasa a ser **comodidad legítima** bajo la regla
invariable 13, porque la imposición del servidor está probada—. Se deja escrito aquí para que nadie lo
vuelva a anotar como vivo.

**IV-6 está CERRADO y tampoco cuenta.** Eran las `ALTER TABLE` sin calificar de
`packages/zoho-sync/src/db/schema.sql`. F1B-01 lo cerró extendiendo el guardián a `^ALTER TABLE`
(`migrate.test.ts`, `altersDelEsquema()` + tres pruebas) **y calificando 13 sentencias, no 23**: las
de `public`, porque extender el guardián sin tocar el `.sql` lo dejaba rojo para siempre; las 11 de
`DESK_TABLES` siguen sin calificar, que es lo correcto. Detalle en
`docs/sdd/F1B-01_Serial_llave_de_entrada.md` §4.

> **La lección de método, que vale más que las dos entradas.** Este fichero y `openspec/config.yaml`
> **pueden estar caducos**: los dos daban IV-3 por vivo cuando F0-04 llevaba días habiéndolo cerrado.
> Antes de citar cualquiera de los dos como autoridad sobre el estado del código, **compruébalo contra
> el código**. Es la regla de método aplicada a los propios registros del proyecto.

---

## Contexto SDD

- Configuración: `openspec/config.yaml` (capacidades, preflight, reglas por fase, unidad de avance).
- **El preflight de sesión está FIJADO en fichero y gana.** `openspec/config.yaml:22-30`:
  `interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd`. Su comentario lo dice por escrito —
  «corrige cualquier valor distinto que aparezca en un prompt de arranque»—, y eso incluye lo que se
  derive del resumen de Engram o del propio encargo de la sesión. **Léelo antes de declarar ningún
  preflight.** El 2026-09-10 se declaró de memoria y salieron mal dos de los cuatro (`auto` por
  `interactive`, 400 por 800): no cambió el resultado, pero se saltó la ronda de preguntas que
  `interactive` exige antes de `sdd-propose`.
- Propuestas: `openspec/changes/<ID>/proposal.md`.
- Baseline as-built de partida: `docs/sdd/F0-00_Baseline_as-built.md`.
- La unidad de avance son **las tandas del §5 del plan, ponderadas por talla**. Se publican siempre
  dos cifras —tandas cerradas y % de esfuerzo estimado— con el denominador fechado. Detalle en
  `openspec/config.yaml` (`unidad_de_avance`).

### Las dos reglas del ciclo — las dos salieron de tropezar con él

#### Regla del ciclo 1 — una tarea de una persona no es una unidad de trabajo

> Un cambio cuyas tareas pendientes son decisiones o comprobaciones **de personas** SÍ se puede
> archivar. Lo que no se puede es **contarlas como tareas**: `~/.claude/skills/_shared/sdd-status-contract.md:138`
> y `:141` exigen que *todas* estén completas para que `verify` y `archive` pasen a `ready`, y una
> casilla cuyo dueño está fuera del repositorio no la marca ninguna tanda. Se sacan del recuento y se
> declaran aparte, en una sección con **dueño, destino y dónde queda escrito**, diciendo
> explícitamente que **archivar no las da por hechas**.

*Por qué existe:* el 2026-09-10 se dio por sentado lo contrario —«ese cambio no se cierra nunca por esa
vía»— y era falso. `reasignar-desvios-huerfanos` pasó de `9/12 · verify: blocked` a
`10/10 · verify: ready` **cambiando sólo la FORMA de su `tasks.md`**, mismo repositorio, mismo minuto,
sin tocar una línea de código; y `mensaje-422-cliente-duplicado` pasó de `24/26` a `25/25` igual.
El límite del ciclo es real, pero **muerde sólo si modelas una entrega como trabajo pendiente**. El
aviso estaba a la vista las dos veces: el encabezado de la sección ya decía «de Gerencia, no de esta
tanda».

*Y el reverso, que es la parte que se puede hacer trampa:* antes de sacar una casilla del recuento,
comprueba que **no describe trabajo que una tanda podría hacer en este repositorio**. Si lo describe,
es una tarea de verdad y sacarla es maquillar el contador.

#### Regla del ciclo 2 — una tanda SDD por árbol de trabajo, nunca dos a la vez

> `gentle-ai sdd-attempt` mide `changed_lines` diffeando el **ÁRBOL ENTERO** entre el principio y el
> final del intento, no el cambio. Dos tandas SDD corriendo a la vez sobre el mismo working tree se
> imputan las líneas la una a la otra. Si hacen falta dos en paralelo, van en **worktrees aislados**,
> uno por cambio.

*Por qué existe:* el 2026-09-10 se lanzó el `sdd-archive` de `reasignar-desvios-huerfanos` y el
`sdd-apply` de `mensaje-422-cliente-duplicado` al mismo tiempo sobre `C:\dev\Desk_2_R1.023`. El
`settle` del segundo devolvió `blocked(maintainer_decision)` con **`changed_lines: 1718` contra un
presupuesto de 800** — y las suyas eran **73** (`ticketService.ts` +9/-3, `ticketService.test.ts`
+56/-5: 65 inserciones y 8 borrados, `git diff --shortstat e09fb0d c4fc97d -- apps/desk/server/services/`).
Las otras ~1.645 eran el `verify-report.md` (+206) y el `archive-report.md` (+125) de la
primera y sus fusiones en `openspec/specs/`. El diff de los dos árboles del propio intento lo enseña
en una línea.

*Lo que cuesta, y por eso no es un detalle:* desbloquearlo exige `gentle-ai sdd-attempt reset`, que la
herramienta **reserva a un mantenedor y nunca hace sola**. O sea que un descuido de paralelismo del
agente **para la tanda y necesita a una persona** para arrancar otra vez. Ganar diez minutos de reloj
cuesta un turno entero.
