# Propuesta: la vista «Todos» deja de mentir, y las esperas dejan de adivinarse

**Tanda A · F1B-08 · base `b0bb704` (rama `main`)**

Cinco piezas del mismo tablero. Tres cierran incumplimientos vivos registrados (IV-1, IV-5, IV-7),
una ejecuta una decisión de Gerencia del 10/09 y otra repara un detector que hoy vigila una copia de
sí mismo en vez del código.

> **Regla de método.** Toda cita de código lleva ruta y línea, verificada de disco en `b0bb704`
> durante esta sesión. Lo que no se pudo verificar contra el árbol lleva la palabra **hipótesis**
> delante. Tres afirmaciones heredadas del encargo salieron **falsas** al comprobarlas; van en §7.

---

## 1 · Intención

| | |
|---|---|
| **El problema** | El tablero tiene dos vistas que informan mal y ninguna lo dice. «Todos los Tickets» oculta los cerrados (`boardView.ts:49-50`); «Tickets en espera» reconoce 2 de los 8 estados de espera (`boardView.ts:35`), así que seis se listan como «abiertos» (`:43-44`) |
| **Por qué ahora** | Gerencia lo decidió el 10/09 (`Decisiones_Gerencia_2026-09-10.md:185-221` y `:316-329`). Los tres desvíos ya tienen destino asignado a F1B-08 (`openspec/config.yaml`, IV-1 `:317`, IV-5 `:478`, IV-7 `:602`) |
| **Éxito** | Lo que la etiqueta promete es lo que la lista devuelve; y la clasificación de espera la decide el registro de dominio, no una expresión regular sobre un nombre |

**Fuente en el maestro:** ítem 22, «Interfaz que replica la estructura de Zoho Desk», vía
`plan:157` («vistas de listado y ficha equivalentes a las de Zoho Desk»). Cita de segunda mano a
través de `openspec/config.yaml:328` y `:483`: **hipótesis** hasta comprobarla contra el `.md` del
maestro.

---

## 2 · Alcance

### Entra

1. **«Todos» devuelve también los cerrados**, activos primero y cerrados después, paginados.
2. **`case 'todos'` se separa de `default:`** — no es opcional (`Decisiones:212-215`).
3. **`boardView` consume `ESTADOS_EN_ESPERA`** y deja de usar `/espera/i` (IV-1).
4. **Se rehace el tripwire falso** de `estados.test.ts:113-121`.
5. **`Remisión creada` pasa a `en_espera` clase `interna`** (P21, `Decisiones:326-329`).
6. **`TicketCard` deja de tener un mapa de colores muerto** (IV-5, cosmético).

### No entra

- **La alarma de 72 h de `Remisión creada`** (`Decisiones:331-337`, `SLA_HORAS_POR_ESTADO`,
  `sla.ts:32-35`). Es la otra mitad de P21 y **choca con esta tanda**: ver §6, riesgo R-1.
- **`?scope=all`** (`tickets.ts:113-114`, `client.ts:14-17`). Sigue como está: sin uso en el front.
- Renombrar la vista a «Abiertos» — descartado por Gerencia (`Decisiones:187`).
- IV-2, IV-4, IV-8: puntos abiertos ajenos a este fichero.
- `jsdom`, `@testing-library` o ampliar `vitest.config.ts:17-20` a `*.test.tsx`. Prohibido por
  decisión de Gerencia (F0-00, §9.3; `openspec/config.yaml:45-53`).

---

## 3 · Enfoque, pieza a pieza

### Pieza 1 · «Todos» = activos + cerrados paginados

**Forma elegida: diferir y declarar.** La vista de aterrizaje sigue pidiendo los activos; los
cerrados se piden **al seleccionar** «Todos», paginados, reutilizando `fetchClosedTickets`.

Es la forma que Gerencia recomendó y delegó explícitamente («decisión de implementación, no de
Gerencia», `Decisiones:208-210`).

**Por qué no `?scope=all`, con la evidencia:**

- Los tres `SELECT` de `packages/zoho-sync/src/db/repo.ts` —`getActiveTickets:115`,
  `getClosedTickets:130`, `getAllTickets:150`— tienen el bloque `FROM/JOIN` **idéntico carácter a
  carácter**: los mismos seis `LEFT JOIN` en cinco líneas (`:119-123`, `:134-138`, `:154-158`).
  **Los JOIN no son el diferencial**: `getActiveTickets` los paga hoy en cada carga.
- El diferencial es la **cota**: `getAllTickets` no tiene `LIMIT` (`repo.ts:150-163`);
  `getClosedTickets` sí (`repo.ts:139`, `LIMIT $2 OFFSET $3`), con `pageSize = 50` impuesto en
  `tickets.ts:106`.
- **Diferir y declarar no es ocultar.** El requisito de Gerencia era que «Todos» no escondiera los
  726, no que los trajera de golpe. El rótulo usa el `total` que el servidor ya devuelve
  (`tickets.ts:110`), calculado por `countClosedTickets` (`repo.ts:145-148`) sin filtro de usuario.

**El patrón ya corre en el mismo componente**: `App.tsx:60-62` ramifica
`isClosed ? fetchClosedTickets(closedPage) : fetchActiveTickets()`, `App.tsx:58-59` gestiona la
página y la reinicia al cambiar de vista, y `App.tsx:126-134` pinta la paginación. No se inventa
mecanismo: se generaliza el que hay.

**Orden del resultado: activos primero, cerrados después. No mezclados por `created_time`.**
Las tres consultas comparten `ORDER BY t.created_time DESC NULLS LAST` (`repo.ts:124`, `:139`,
`:159`). Mezclar por esa clave hace que un cerrado de la página 2 sea más nuevo que un activo y
aterrice **en mitad de la lista**: «cargar más» produciría saltos. Con los dos bloques separados,
«cargar más» es un `append` y nada se mueve de sitio.

### Pieza 1-bis · `default:` deja de heredar el cuerpo de «todos»

Hoy `case 'todos':` y `default:` comparten cuerpo (`boardView.ts:49-50`), así que una clave
desconocida recibe la lista de «todos» **y** el rótulo «Todos los Tickets», porque `viewLabel`
tiene ese mismo respaldo (`boardView.ts:21-23`).

**Propuesta: `default:` devuelve VACÍO**, con el precedente exacto del propio fichero. La rama
`mios` sin usuario devuelve vacío y lo razona por escrito en `boardView.ts:38-39`: «enseñar el
tablero entero bajo el rótulo "Mis Tickets" haría creer que todo eso es suyo, que es la peor de las
dos mentiras posibles». Una clave desconocida bajo el rótulo «Todos los Tickets» es exactamente la
misma mentira.

⚠️ **El respaldo de `viewLabel` (`:22`) queda entonces incoherente**: lista vacía con rótulo «Todos
los Tickets». Va como pregunta al orquestador, §8-Q1.

### Pieza 2 · `boardView` consume `ESTADOS_EN_ESPERA` (IV-1)

Caso de libro de la **regla invariable 13**, punto 1: la regla existe en `packages/shared`, el
cliente la **consume**. No hay decisión que tomar.

| | |
|---|---|
| Existe | `packages/shared/src/estados.ts:111` — `ESTADOS_EN_ESPERA` |
| Lo reimplementa | `apps/desk/src/lib/boardView.ts:35` — `/espera/i.test(t.status ?? '')` |
| Punto de consumo limpio | `enEsperaDe(estado: string)` (`estados.ts:158-162`). Acepta `string`, que es el tipo de `Ticket.status`: **no hace falta cast** |
| Alcance del defecto | Acierta 2 de 8, cero falsos positivos (`transitions-st/spec.md:533-540`). Defecto **por defecto** |

### Pieza 3 · El tripwire de IV-1 es falso, y se rehace

`estados.test.ts:113-121` dice documentar el defecto, y su comentario `:110-111` afirma: «Si alguien
arregla `boardView.ts` antes, esta prueba dará rojo y habrá que retirarla». **Verificado: es falso.**

- Sus imports son sólo `./estados` y `./transitions` (`estados.test.ts:1-7`). **Nunca importa
  `boardView`.**
- `boardView` aparece en ese fichero **sólo dentro de comentarios** (`:105` y `:110`).
- `:114` reimplementa la regex localmente y compara `ESTADOS_EN_ESPERA` contra **su propia copia**.

Arregles o no `boardView.ts`, esa prueba sigue verde para siempre. **Es la regla de mutación 2 al
revés: un guardián que vigila una copia del código en vez del código.**

La prueba roja de IV-1 **debe importar `applyBoardView`** y afirmar sobre **su salida**. Se comprueba
mutando: con la regex vieja, roja; con `ESTADOS_EN_ESPERA`, verde. Si no se mueve al mutar, sigue
siendo una copia.

**Y hay control de mutación gratis, ya presente en el árbol:** `boardView.test.ts:11` fija
`status: 'En espera de repuesto'` — **un estado que no existe en el registro**. El real es
`'En Espera de Repuestos'` (`estados.ts:61`, mayúscula y plural). Verificado: esa cadena literal
aparece en código **sólo en esa línea** (las otras dos coincidencias son documentación:
`docs/superpowers/plans/2026-06-05-sidebar-vistas-funcionales.md:44` y
`docs/sdd/F0-00_Baseline_as-built.md:83`). En cuanto `boardView` consuma el registro,
`boardView.test.ts:20` y `:21` se ponen **rojas solas**, y corregir el fixture es justo lo que
demuestra que el detector **discrimina**.

### Pieza 4 · `Remisión creada` → `en_espera` clase `interna` (P21)

`estados.ts:90` la clasifica hoy como `'ninguna'`, así que los equipos parados en bodega no aparecen
como espera en ningún sitio (`Decisiones:321`, `:326-329`).

**Clase `interna`, derivada del discriminador escrito, no elegida:** `interna` es «esperamos a otra
área de la casa» (`estados.ts:67`); Comercial es un área de la casa; y el precedente exacto es
`'Liberación Comercial': 'interna'` (`estados.ts:74`), que entra y sale por transiciones de Comercial.

**El conjunto pasa de 8 a 9. Éstas son TODAS las pruebas vivas que lo fijan, verificadas de disco:**

| Prueba | Qué fija hoy | Efecto |
|---|---|---|
| `estados.test.ts:33-41` | `interna` son exactamente **cinco** | **ROJA** → seis |
| `estados.test.ts:43-58` | `ninguna` son exactamente **doce**, con `STATUS_REMISION_CREADA` en `:56` | **ROJA** → once |
| `estados.test.ts:84-95` | `ESTADOS_EN_ESPERA` es exactamente esa lista de **ocho** | **ROJA** → nueve |
| `estados.test.ts:176-185` | «la derivación da **cinco**, y la quinta es `Liberación Comercial`» | **ROJA** → seis (ver abajo) |
| `estados.test.ts:71-75` | `3 + 5 + 12 + 1 = 21` sumando longitudes | **VERDE**: 3+6+11+1 sigue siendo 21 |
| `estados.test.ts:14-18` | 21 estados, sin repetidos | **VERDE**: el registro no cambia de tamaño |
| `estados.test.ts:113-121` | El tripwire falso | **VERDE**: `Remisión creada` no contiene «espera» |
| `sla.test.ts:50-54` | El reloj y la vista no leen la misma lista | **VERDE hoy** — ver §6 R-1 |

**La cuarta fila no es un ajuste de cifra, y hay que decidirla con el ojo abierto.**
`estados.test.ts:176-185` cruza «estar en espera» con «tener salida única» y afirma que da cinco,
siendo la quinta `Liberación Comercial`. Verificado: `'Remisión creada'` aparece en el `from` de
**exactamente una** transición, `habilitar_servicio` (`transitions.ts:178`). Al entrar en
`ESTADOS_EN_ESPERA` el cruce da **seis**, y el filtro de `:179-181` devolvería
`['Liberación Comercial', 'Remisión creada']`.

**Y eso no rompe el criterio: lo confirma.** La única salida de `Remisión creada` es
`habilitar_servicio`, área Comercial — **un acto que se ejecuta en la aplicación**, alguien pulsa el
botón. Es literalmente la razón por la que `Liberación Comercial` queda fuera de `ESTADOS_SIN_SALIDA`
(`estados.ts:126-130`). O sea que `Remisión creada` es un **segundo caso que distingue el criterio**,
no una excepción: **no entra en `ESTADOS_SIN_SALIDA`**, y la prosa de la prueba pasa de «la quinta»
a «las dos que sobran», con la misma derivación.

### Pieza 5 · El mapa de colores muerto de `TicketCard` (IV-5)

`TicketCard.tsx:14-23` tiene claves en MAYÚSCULAS que nunca casan con estados reales, así que el
lookup de `:26` cae siempre en el respaldo `bg-slate-100`. Hoy no pinta mal: **pinta neutro**.

**La raíz es otra de la que decía el encargo — corregido en §7.2.** No es el import: es que las
claves del mapa son los **valores literales de `status` del array de datos simulados**
(`mockData.ts:11`, `:48`, `:60`, `:85`, `:97`, `:110`, `:122`, `:134`), mientras el ticket real trae
los nombres del dominio.

⚠️ **IV-5 no admite rojo previo bajo `strict_tdd`, y se declara en vez de disimularse:**

- `vitest.config.ts:16` fija `environment: 'node'`; `:17-20` incluye sólo `apps/**/*.test.ts` y
  `packages/**/*.test.ts`. Los `.ts` del cliente **sí** entran —`boardView.ts` tiene su
  `boardView.test.ts`—; los 39 `.tsx` quedan fuera. `vitest.config.ts:57` los excluye también del
  coverage, y `:45-47` escribe por qué.
- Es **decisión explícita de Gerencia** (F0-00, 2026-09-08), no un olvido.
- **Qué es, entonces:** un cambio cosmético **sin detector automático posible**, en un fichero que el
  proyecto decidió dejar fuera de la red de pruebas. No se finge una prueba, no se instala nada, y
  **no se registra como carencia ni como riesgo**: registrar como riesgo una decisión de Gerencia es
  medirla como si fuera un fallo.
- **Criterio de aceptación manual que lo sustituye:** en `ambientalia-desk.ambientalia.cloud`, modo
  «estado», comprobar que al menos un ticket en `En Proceso` y uno en `Notificación cliente` pintan
  con color y no con `bg-slate-100`. Verificación por persona, anotada como tal.

---

## 4 · Regla de mutación 3 — la casilla de la regla 13, marcada por escrito

Esta tanda toca `apps/desk/src` en las cinco piezas. **Enumeración decisión a decisión, con la línea
del servidor que la impone o la declaración de que no la hay.**

| # | Decisión que toma el cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|---|
| 1 | Qué tickets muestra cada vista (`applyBoardView`, `boardView.ts:34-52`) | **Ninguna** — `tickets.ts:104-116` devuelve la misma lista a todo usuario autenticado | **Comodidad legítima, ya adjudicada.** No hay nada que guardar: el servidor no segmenta visibilidad por decisión escrita (`boardView.ts:29-32`, `docs/modelo-autorizacion.md`), y `openspec/specs/permissions/spec.md:267-271` §4.4 lo declara correcto |
| 2 | Qué estados cuentan como «en espera» (`boardView.ts:35` → `ESTADOS_EN_ESPERA`) | **Ninguna, y no hace falta** | **Consumo de dominio, regla 13 punto 1.** Ninguna conducta del servidor depende de esta lista: es presentación de un registro compartido. El desvío no era «vive en el cliente», era «lo reescribe» |
| 3 | Paginar el bloque de cerrados de «Todos» | **`tickets.ts:106`** (`pageSize = 50`) y **`:107`** (`Math.max(1, Number(page) \|\| 1)`) | **Comodidad con imposición probada.** El tamaño de página lo fija el servidor; el cliente no puede pedir más. Probado en `tickets.test.ts:84` y `:90-99` |
| 4 | Qué es «cerrado» (`statusType === 'Closed'`, `boardView.ts:37`) | **`repo.ts:139`** (`WHERE t.status_type = 'Closed'`) y **`repo.ts:124`** (`<> 'Closed' OR IS NULL`) | **Espejo legítimo:** la imposición del servidor está probada (`tickets.test.ts:72`, `:87`). Cumple el punto 3 de la regla 13 |
| 5 | Qué devuelve una clave de vista desconocida (`default:`) | **Ninguna** | **Presentación, no guarda.** Es un emparejamiento entre rótulo y contenido; el servidor no conoce el concepto de «vista» |
| 6 | El color de la tarjeta (`TicketCard.tsx:14-26`) | **Ninguna** | **Presentación pura.** Ninguna decisión de negocio depende del color |

**Conclusión de la casilla:** seis decisiones, dos con línea de servidor probada (3 y 4), cuatro sin
ella — y **ninguna de las cuatro es una guarda**, porque no existe regla de servidor que puedan estar
esquivando. Esta tanda no crea ni una guarda en el cliente.

---

## 5 · Tabla de mutaciones

Una fila por pieza. Una prueba verde no dice que la guarda funcione; dice que la prueba no sabe
distinguir. Cada fila lleva su **ejecución de control**, porque un detector que devuelve cero sin
haberse validado no es un cero.

| # | Qué se muta | Detector que se pone rojo | Ejecución de control que valida el detector |
|---|---|---|---|
| **P1** | **Posición/estructura de la guarda** (regla 1): volver a fusionar `case 'todos':` con `default:` en `boardView.ts` | La prueba nueva «todos incluye los cerrados» y la nueva «clave desconocida devuelve vacío», las dos en `boardView.test.ts` | Aplicar la mutación y exigir **exactamente 2 fallos, ambos nombrados**. Si falla 1 o 0, las dos ramas no están fijadas por separado y la separación es declarativa |
| **P1-bis** | **No cambia el resultado: cambia el coste y la forma.** `tickets.ts:106`, `pageSize` 50 → 5 | `apps/desk/server/tickets.test.ts:84` (`expect(res.body.pageSize).toBe(50)`) | Con los 3 cerrados que siembra `tickets.test.ts:57-63`, `items` es **idéntico** (3 ≤ 5): `:86` y `:87` siguen verdes y **sólo `:84`** se pone roja. Si se pusiera roja alguna más, la prueba estaría midiendo el contenido cuando cree medir el sobre |
| **P2** | **Posición de la guarda** (regla 1): quitar el conjunto `statusType !== 'Closed'` de la rama `espera` (`boardView.ts:44`) | Hoy: **NINGUNO**. El fixture no tiene ningún ticket `Closed` en estado de espera — `'c'` es `Closed` pero `'Finalizado'` (`boardView.test.ts:12`) | **Ése es el hallazgo, no el arreglo.** El control es: correr la mutación **antes** de tocar nada y confirmar que la suite sigue verde. Obliga a añadir al fixture un ticket `Closed` con estado de la lista, y esa prueba nueva es el detector |
| **P3** | **El fichero vigilado** (regla 2): restaurar `/espera/i` en `boardView.ts:35` con el registro ya consumido | El tripwire **nuevo** de `boardView.test.ts`, que importa `applyBoardView` y afirma sobre su salida | **Correr la MISMA mutación contra los dos detectores.** El viejo (`estados.test.ts:113-121`) se queda **verde**; el nuevo se pone **rojo**. Que discrepen es la prueba de que el viejo vigilaba una copia — y de que el nuevo no |
| **P4** | **El valor vigilado**: devolver `estados.ts:90` a `'ninguna'` (y, como segunda pasada, mover `'Solicitado'` de `interna` a `externa`) | `estados.test.ts:33-41`, `:43-58`, `:84-95` y `:176-185` — las cuatro | **Comprobar que `estados.test.ts:71-75` sigue VERDE bajo las dos mutaciones.** La suma `3+5+12+1` no distingue un traslado entre clases, y su propio comentario (`:20-24`) ya lo dice. Si alguien «arregla» la tanda tocando sólo la suma, el detector real no se ha movido |
| **P5** | **La clave del mapa**: romper a propósito una entrada de `TicketCard.tsx:14-23` | **NINGUNO, y es la conclusión declarada, no una carencia** | Contar los ficheros y pruebas de `npm test` **antes y después** de editar `TicketCard.tsx` y exigir que la cifra sea **idéntica**. Eso prueba de disco lo que `vitest.config.ts:17-20` declara. El detector es una persona: el criterio manual de §3, Pieza 5 |

**Control transversal de todo barrido.** Cualquier enumeración que se use como evidencia (contar
consumidores, buscar cadenas literales) debe validarse con un **control positivo** —una búsqueda que
tiene que devolver ≥ 1 sobre una cadena que se sabe presente— antes de dar por bueno un cero. En este
repositorio ya se dio un barrido por limpio porque el `grep` estaba escrito sin `-E` y el `|` era un
carácter literal: devolvía cero siempre.

---

## 6 · Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R-1** | **Colisión con la otra mitad de P21.** `sla.test.ts:50-54` afirma que ningún estado con SLA está en `ESTADOS_EN_ESPERA`. Hoy queda **verde** porque el único estado con SLA es `Notificado` (`sla.ts:32-35`), clase `ninguna`. Pero `Decisiones:331-337` manda añadir `'Remisión creada': 72` a ese mismo registro: en cuanto esa tanda aterrice, `sla.test.ts:52` se pone **roja** — y **no porque nada esté mal** | **Alta**, en la tanda siguiente | Esta tanda **planta la mitad de la mina y lo declara**. La regla escrita (`estados.ts:26-33`, `transitions-st/spec.md:550-565`) dice que la vista y el reloj son **independientes**, no disjuntos: un estado **MAY** estar `en_espera` sin parar reloj. La prueba afirma algo **más fuerte** que la regla. **Decisión para el orquestador**, §8-Q3 — no la toma esta tanda |
| **R-2** | **Presupuesto de revisión.** Código y pruebas ≈ 130-205 líneas, holgado bajo 800. Pero `changed_lines` se mide diffeando el **árbol entero** del intento (`CLAUDE.md`, regla del ciclo 2), y los artefactos SDD cuentan: en la tanda del 10/09 el `verify-report` sumó +206 y el `archive-report` +125 | **Media** | `delivery_strategy: ask-on-risk` → **no lo decide esta tanda**. Queda marcado para el orquestador, §8-Q4 |
| **R-3** | **Paralelismo.** Dos tandas SDD sobre `C:\dev\Desk_2_R1.023` se imputan las líneas entre sí; desbloquearlo exige `sdd-attempt reset`, reservado a un mantenedor | Media | **Una tanda por árbol de trabajo.** Si hace falta otra en paralelo, worktree aislado |
| **R-4** | **Citas que se descuelgan.** `permissions/spec.md:269-274` cita `boardView.ts:34-52` y `:35`; los dos rangos se mueven en esta tanda | Alta | Reanclar al archivar. Precedente en el propio repositorio: `4e0b542`, «reanclar la tabla de guardas» |
| **R-5** | **Percepción de lentitud** al entrar en «Todos» y ver aparecer los cerrados en un segundo bloque | Baja | Es el efecto buscado por `Decisiones:208-210` («rápido al entrar, honesto al pedirlo»), y el rótulo declara el `total` desde el principio |

---

## 7 · Correcciones — tres afirmaciones heredadas que salieron falsas

### 7.1 · `Decisiones_Gerencia_2026-09-10.md:205` dice «cinco `LEFT JOIN`». Son **seis**

Escritos en cinco líneas, que es de donde sale la confusión. En `repo.ts:119-123`: `accounts`,
`agents`, `clients`, `contacts`, `users` y `ticket_reads`. Idénticos en `:134-138` y `:154-158`.
**No cambia la decisión** —el argumento del coste no se apoyaba en los JOIN sino en la falta de
cota—, pero la cifra se corrige aquí para que no se propague.

### 7.2 · La raíz de IV-5 **no** es el import de `TicketCard.tsx:2`

El encargo afirmaba que `TicketCard.tsx:2` importa `Ticket` de `'../data/mockData'` «y no de
`@ambientalia/shared`, y por eso las claves casan con mockData». **Verificado de disco: falso como
causa.** `mockData.ts:1-2` es literalmente `import type { Ticket } from '@ambientalia/shared'` /
`export type { Ticket }`: **reexporta el tipo compartido**. El tipo que recibe `TicketCard` es el
mismo, y `KanbanBoard.tsx:27` le pasa tickets reales sin conflicto.

La causa real son los **valores** del array simulado usados como claves del mapa (`mockData.ts:11`,
`:48`, `:60`, `:85`, `:97`, `:110`, `:122`, `:134`). El import es higiene —una indirección
innecesaria a través de un módulo de datos de prueba—, no el defecto.

### 7.3 · `estados.test.ts:110-111` afirma que se pondrá roja al arreglar `boardView`. No lo hará

Detallado en §3, Pieza 3. Es el objeto de la propia Pieza 3.

---

## 8 · Ronda de preguntas de propuesta

`execution_mode: interactive`. No puedo preguntar directamente desde esta fase, así que las
preguntas van escritas para que el orquestador las traslade **antes de `sdd-spec` / `sdd-design`**.
Cada una lleva el supuesto con el que la propuesta sigue si nadie responde.

| # | Pregunta | Supuesto vigente si no hay respuesta |
|---|---|---|
| **Q1** | Si `default:` devuelve vacío, **¿qué rótulo se pinta?** Hoy `viewLabel` cae en «Todos los Tickets» (`boardView.ts:22`), así que una clave desconocida daría lista vacía bajo el rótulo de la vista más poblada — la misma clase de mentira que `mios` evita a propósito | El respaldo de `viewLabel` pasa a un rótulo neutro que no promete un conjunto (p. ej. «Vista no reconocida») |
| **Q2** | En «Todos», **¿el usuario debe ver dónde acaban los activos y empiezan los cerrados**, o basta con que la lista esté ordenada? Afecta a si hace falta separador visible o sólo orden | Sólo orden: activos y luego cerrados, sin separador, con el `total` en el rótulo |
| **Q3** | **¿Acepta Gerencia que un estado esté a la vez «en espera» para la vista y con reloj de SLA?** Es lo que pasará con `Remisión creada` al llegar la alarma de 72 h (`Decisiones:331-337`). La regla escrita dice que las dos listas son independientes; `sla.test.ts:50-54` afirma además que son **disjuntas**, que es más fuerte | Son independientes, no disjuntas. La prueba se reformula en la tanda de la alarma, no en ésta |
| **Q4** | Con `ask-on-risk`: **¿se acepta el intento completo bajo 800 líneas** contando los artefactos SDD, o se parte la tanda? Ver R-2 | Se acepta como una sola tanda, con los informes SDD escritos en corto |

---

## 9 · Capacidades

> Contrato con `sdd-spec`. Investigado sobre `openspec/specs/`.

### Capacidades nuevas

- **`vistas-tablero`**: las vistas funcionales del tablero (`FUNCTIONAL_VIEWS`, `viewLabel`,
  `applyBoardView`), qué promete cada rótulo y qué devuelve cada clave, incluida la desconocida.
  **Hoy no existe spec.** Verificado: en `openspec/specs/` no hay ninguna aparición de
  `applyBoardView` ni de «Todos los Tickets»; la única mención del fichero es
  `permissions/spec.md:267-274`, que declara el filtro **correcto** sin especificar su
  comportamiento.

### Capacidades modificadas

- **`transitions-st`**: §3.6 (`spec.md:520-548`) — IV-1 pasa de «comportamiento actual, a corregir» a
  cerrado. §3.7 (`:550-572`) y la tabla de `:555-559` — `en_espera` pasa de **8 a 9 estados**.
  `RQ-TS-15` (`:365-367`) — su demostración («el único estado con SLA no es ninguno de los ocho»)
  cambia de redacción aunque el requisito no cambia.

### No modificadas, pero con citas que se descuelgan

- **`permissions`** §4.4 (`spec.md:267-274`): rangos `boardView.ts:34-52` y `:35`. Reanclar al
  archivar (R-4). El requisito no cambia.

---

## 10 · Áreas afectadas y estimación

| Área | Impacto | Qué cambia | Líneas est. |
|---|---|---|---|
| `apps/desk/src/lib/boardView.ts` | Modificado | Consume `ESTADOS_EN_ESPERA`; `todos` deja de filtrar cerrados; `default` se separa | 10-15 |
| `apps/desk/src/lib/boardView.test.ts` | Modificado | Fixture corregido; tripwire real de IV-1; casos de `todos` y `default`; ticket `Closed` en espera (P2) | 45-65 |
| `apps/desk/src/App.tsx` | Modificado | «Todos» pide también los cerrados, paginados; paginación visible en esa vista | 15-25 |
| `packages/shared/src/estados.ts` | Modificado | `Remisión creada` de `ninguna` a `interna`, con su derivación escrita | 5-10 |
| `packages/shared/src/estados.test.ts` | Modificado | Cuatro pruebas al nuevo reparto; se retira el tripwire falso; prosa de `:176-185` | 35-50 |
| `apps/desk/src/components/TicketCard.tsx` | Modificado | Claves reales o retirada del mapa; import directo de `@ambientalia/shared` | 12-20 |
| `apps/desk/src/api/client.ts` | Posible | Sólo si hace falta un combinador; se prefiere reutilizar lo existente | 0-10 |
| **Total código + pruebas** | | | **~130-205** |

**Presupuesto:** `review_budget_lines: 800`. El código cabe con holgura. El intento completo depende
de los artefactos SDD y del aislamiento del árbol: ver R-2, R-3 y Q4. **`ask-on-risk` → la decisión
es del orquestador, no de esta tanda.**

---

## 11 · Plan de reversión

Las cinco piezas son independientes y se revierten por separado.

| Pieza | Reversión |
|---|---|
| 1 y 1-bis | `git revert` de los cambios de `boardView.ts` y `App.tsx`. No hay migración, esquema ni escritura: es lectura y presentación |
| 2 y 3 | Revertir `boardView.ts:35` y `boardView.test.ts`. El registro de `packages/shared` no se toca en estas dos |
| 4 | Devolver `estados.ts:90` a `'ninguna'` y las cuatro pruebas a su redacción anterior. **Sin efecto en datos**: la clasificación es un dato en código, no una columna |
| 5 | Revertir `TicketCard.tsx`. El respaldo `bg-slate-100` (`:26`) vuelve a cubrirlo todo |

Ninguna pieza toca el esquema de base de datos, ni escribe hacia Zoho, ni depende de `ENABLE_WRITES`.

---

## 12 · Criterios de aceptación

- [ ] «Todos» devuelve activos **y** cerrados; el rótulo declara el `total` del servidor.
- [ ] Los cerrados llegan paginados y el orden es activos → cerrados, sin entrelazar.
- [ ] `case 'todos':` y `default:` tienen cuerpos distintos, y hay una prueba por cada uno.
- [ ] `boardView.ts` importa de `packages/shared` y no queda ninguna `/espera/i` en el fichero.
- [ ] Los seis estados que hoy se escapan aparecen bajo «Tickets en espera» y desaparecen de
      «Tickets abiertos», comprobado en prueba, no de memoria.
- [ ] El tripwire de IV-1 importa `applyBoardView`, y **se ha comprobado mutando** que se pone rojo
      con la regex vieja mientras `estados.test.ts:113-121` se quedaba verde.
- [ ] El tripwire falso (`estados.test.ts:101-121`) ya no existe.
- [ ] `ESTADOS_EN_ESPERA` tiene nueve entradas y `Remisión creada` es `interna`; `ESTADOS_SIN_SALIDA`
      sigue teniendo cuatro.
- [ ] `estados.test.ts:176-185` explica las **dos** que sobran con la misma derivación de siempre.
- [ ] Las seis filas de la tabla de la regla 13 (§4) están comprobadas línea a línea, no de memoria.
- [ ] Las seis filas de la tabla de mutaciones (§5) se han **ejecutado**, incluidas sus ejecuciones
      de control, y P2 se corrió **antes** de tocar nada.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` en verde; `lint` sin superar
      los 158 avisos del trinquete (`ci.yml:41`).
- [ ] Verificación manual de IV-5 hecha por una persona y anotada con su resultado.
- [ ] Q1-Q4 respondidas o su supuesto aceptado por escrito.

---

## 13 · Dependencias

- **Ninguna bloqueante.** `ESTADOS_EN_ESPERA` existe desde F0-04 (`estados.ts:111`) y la decisión de
  Gerencia sobre «Todos» está cerrada (`Decisiones:185-221`).
- ⚠️ **Gate de F1B-08:** la fila lleva P44, política de **escritura** contra Zoho. Esta tanda es
  **sólo lectura y presentación**, así que no debería gatearla; si el gate resultara bloqueante, la
  salida escrita es sacar estas piezas a una fila propia, no dejarlas otra vez sin dueño
  (`openspec/config.yaml:334-338`).
- **Acopla con la tanda de la alarma de 72 h** de P21 en un solo punto, R-1. No la bloquea.
