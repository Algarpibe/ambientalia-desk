# F0-01 · Correcciones para el documento maestro R08.1

> **Cómo se usa este fichero.** El documento maestro es un `.docx` y **no se edita desde el
> repositorio**: ninguna tanda lo modifica. Lo que sigue es **texto listo para pegar** en el maestro,
> por si Gerencia decide incorporarlo. Cada punto dice dónde va y, cuando la afirmación es sobre el
> maestro, trae la **línea exacta** de la copia citable
> `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md` (4.935 líneas,
> regenerable con `scripts/docx2md.sh`). Las líneas se refieren a **esa** exportación: si el maestro
> se revisa y se vuelve a exportar, hay que rehacerlas.

| Dato | Valor |
|---|---|
| Tanda | F0-01 |
| Base | commit `a3a8f03` |
| Fuente de las correcciones | F0-00 (baseline as-built, correcciones desde maestro, respuestas de Gerencia) |
| Fecha | 2026-09-08 |

---

## Anexo D — tres puntos nuevos

### D-nuevo 1 · La doble escritura Sheets / Postgres

Las remisiones de entrada se escriben **hoy en dos sitios**: la hoja `remisiones_entrada` de Google
Sheets y la base Postgres. La remisión de **salida** localiza la de entrada por número de serie sobre
la hoja de cálculo, así que salida tiene que leer de donde entrada escriba. Mientras las dos
escrituras convivan, el número de serie puede resolver a una entrada distinta según qué lado se
consulte.

**Hoy este punto sólo vive en `debt.md:419-420`.** No está en el Anexo D, y por tanto no está en
ninguna lista de decisiones pendientes que Gerencia revise.

**Decisión que se pide:** dónde quedan guardadas las remisiones de entrada — ¿siguen en Google
Sheets, o pasan a Postgres?

> **No es el punto P14, y P14 queda cerrado.** P14 preguntaba si `remisiones_entrada` viene de la
> plataforma de hojas de vida. Lo decide Desarrollo, y la auditoría de F0-00 ya respondió que **no**.
> Son dos preguntas distintas: P14 era sobre el *origen* del dato; ésta es sobre **dónde se escribe**
> y qué lee la remisión de salida.

### D-nuevo 2 · Cuatro indicadores rotos por reentrancia, fuera del alcance de C4 y de C9

Cuatro columnas del Anexo G calculan mal cuando un ticket vuelve a pasar por un estado por el que ya
había pasado. Ni la corrección **C4** ni la **C9** las cubren, así que hoy no tienen dueño:

**Las cuatro están localizadas y nombradas.** Viven en **G.6 «Indicadores calculados»**, cuyo
encabezado está en `.md:4436`. El número de columna, el nombre y la fórmula ocupan **líneas
distintas** —esa es la razón por la que una búsqueda por «47 Tiempo…» no encontraba nada—, así que
cada una se cita con sus tres líneas:

| Columna del Anexo G | Indicador | Nº col. | Nombre | Fórmula |
|---|---|---|---|---|
| **47** | Tiempo permanencia | `.md:4440` | `.md:4441` | `.md:4442` |
| **50 · 53** | Tiempo de servicio | `.md:4449` | `.md:4450` | `.md:4451` |
| **57** | Tiempo de cotización | `.md:4461` | `.md:4462` | `.md:4463` |
| **58** | Tiempo de orden de compra | `.md:4464` | `.md:4465` | `.md:4466` |

**Decisión que se pide:** si estas cuatro entran en el alcance de una corrección existente, si se
abre una nueva, o si se declaran inválidas hasta que exista el registro de estados.

> **Corrección de este fichero.** Una versión anterior de esta entrada daba las columnas 47, 57 y 58
> como «NO LOCALIZADAS» y pedía completar sus nombres antes de pegar. **Era falso:** las tres están
> en G.6 desde siempre, con las líneas de la tabla de arriba, verificadas contra
> `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md` el 2026-09-08. La
> entrada ya no tiene ningún hueco pendiente de verificación.

*Contexto útil, y una segunda razón para no dejar rota la columna 58:* `.md:1703` dice que el
bodegaje de proceso **«es exactamente la columna 58, que ya existe con el nombre "Tiempo de orden de
compra"»**. O sea que uno de los tres bodegajes del maestro se apoya directamente en una de estas
cuatro columnas rotas.

### D-nuevo 3 · Rotación de secretos

**Dueño: Alfonso García del Pino.**

Quince credenciales del proyecto se filtraron por chats y capturas (`debt.md:31`, `debt.md:840`). La
rotación se parte en dos:

- **La parte barata, de esta semana:** las credenciales que se rotan sin coordinar con nadie —tokens
  de aplicación propia, contraseñas de base de datos internas—.
- **La parte coordinada, de F0-04:** las que obligan a parar o redesplegar servicios, o a avisar a
  terceros.

Y la regla que evita repetirlo, ya incorporada a `CLAUDE.md` como **regla de secretos**: un secreto
que aparece en un chat, una captura o un prompt **está quemado**; se rota, no se reutiliza.

---

## Anexo I — siete correcciones trazables

Las siete proceden de **F0-00**. Van en el registro del Anexo I con su disposición, y el cambio se
aplica en el sitio que indica la columna «Dónde».

| # | Corrección | Dónde |
|---|---|---|
| 1 | M1.9.1: diez → **ocho** transiciones compartidas | Maestro |
| 2 | «trece indicadores» → **once** (G.6 tiene once). **Son tres líneas**, no sólo la fila del Anexo H | Anexo D (`:3927`) · nota de cobertura (`:4273`) · Anexo H (`:4599`) |
| 3 | «vía MCP» → cliente REST propio con OAuth2. **Son siete líneas**, con **cinco excepciones que no se tocan** y una entrada de glosario a reescribir | Cuerpo del maestro (seis) · Anexo H (`:4615`) · Anexo E (`:4159-4160`) |
| 4 | c.7 del baseline: las suscritas son `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` — **no hay un `contacts` del lado desk** | Baseline |
| 5 | §3.e.3 y §8 del baseline: `vitest.config.ts:14,16-19` → **`:16`** (environment) y **`:17-20`** (include) | Baseline |
| 6 | G.5 col. 42: `habilitar_servicio` **no** escribe `Fecha Orden de Compra` (`transitions.ts:179-180`, divergencia documentada y razonada); col. 43 incompleta —también la escribe `aprobacion_y_repuestos` | Anexo G |
| 7 | §6.5 y §8 del baseline: las cuatro capacidades «sin diseño» sí tienen fuentes | Baseline |

### 1 · M1.9 — diez → ocho transiciones compartidas

**Texto actual, `.md` línea 1636** (apartado M1.9, cuyo encabezado está en la línea 1613):

> «[AS-BUILT] Los permisos por área viven en packages/shared/src/permissions.ts, en un solo sitio y
> no repartidos por la interfaz. Cada transición declara el área o áreas que pueden ejecutarla:
> Comercial, Servicio Técnico o Compras. **Diez de las 34 transiciones son compartidas por dos
> áreas.**»

**Texto propuesto:** sustituir la última frase por

> «**Ocho** de las 34 transiciones son compartidas por dos áreas.»

**Evidencia de primera mano en el código.** `packages/shared/src/transitions.ts` declara 34
transiciones. Las de área compartida son **ocho**, en dos grupos:

- `Comercial / Compras` (cinco): `llegada_repuestos` (`:196`), `aprobacion_y_repuestos` (`:198`),
  `notif_por_garantia` (`:208`), `rechazo_garantia` (`:214`), `solicitud_sku` (`:216`).
- `Comercial / Servicio Técnico` (tres): `rechazo_comercial` (`:234`), `rechazo_cliente` (`:236`),
  `rechazo_revision` (`:238`).

Las 26 restantes declaran un área única: nueve `Comercial` y diecisiete `Servicio Técnico`.

*(El fichero tiene 36 declaraciones con `area:`, no 34: las dos de más son
`TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA`, `:150-151`, pseudo-transiciones de
remisión declaradas fuera de `TRANSICIONES_BASE`. No cuentan en el total de 34 ni son compartidas.)*

### 2 · «Trece indicadores» → once — **son TRES líneas, no una**

La cifra correcta es la del propio **Anexo G.6**, que tiene **once** indicadores (encabezado en
`.md:4436`; las columnas son 47, 48, 49, 50, 51, 53, 54, 56, 57, 58 y 59). La cifra «trece» no
aparece sólo en el Anexo H: aparece **tres veces** en el maestro, y **las tres dicen lo mismo y las
tres están mal**.

`grep -n "trece indicadores"` sobre la exportación devuelve exactamente estas tres:

| Línea | Dónde | Texto actual |
|---|---|---|
| **`.md:3927`** | Anexo D, punto 16 | «…Parcialmente cubierto por el Anexo G, que documenta los **trece** indicadores calculados y sus fórmulas.» |
| **`.md:4273`** | Nota «Sobre la cobertura» | «…aunque el Anexo G cubre buena parte de su contenido: los **trece** indicadores calculados y sus fórmulas.» |
| **`.md:4599`** | Anexo H, fila **H.4 · M7** | «Parcial: **trece** indicadores se calculan hoy sobre la tabla de tickets (Anexo G)» |

**Texto propuesto:** sustituir «trece» por **«once»** en las tres. Por ejemplo, en `.md:4599`:

> «Parcial: **once** indicadores se calculan hoy sobre la tabla de tickets (Anexo G)»

> **Advertencia.** **Corregir sólo la fila del Anexo H deja dos vivas.** El Anexo H diría «once» y el
> cuerpo del documento seguiría diciendo «trece» en dos sitios, que es exactamente la clase de
> incoherencia que esta corrección existe para cerrar. Las tres líneas van en el mismo pase.

### 3 · «vía MCP» → cliente REST propio con OAuth2 — **siete líneas, cinco excepciones y un glosario**

> ## ⚠️ NO HAGAS UN BUSCAR-Y-REEMPLAZAR SOBRE «MCP»
>
> «MCP» aparece **trece veces** en el maestro. **Sólo siete son el error.** Un reemplazo ciego
> **corrompe cinco menciones correctas** —las que hablan de MCP como herramienta de la capa de
> conocimiento, donde MCP sí es lo que se quiere decir— y deja el glosario definiendo el término por
> un uso que nunca ocurrió. La clasificación de abajo es línea a línea y está verificada contra
> `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md` el 2026-09-08.

**El hecho.** MCP **no interviene en el camino de datos**. La conexión Zoho → PostgreSQL es un
**cliente REST propio con OAuth2** (refresh token por servicio). No es un detalle de redacción: es
otro componente.

#### 3.a · El error — «Zoho → PostgreSQL vía MCP» (SIETE, todas a corregir)

No hay una única cadena literal que las cubra: el maestro dice «vía MCP», «mediante MCP» y «conexión
MCP» según el sitio. Por eso cada línea va con **su** texto exacto:

| Línea | Texto actual (cadena exacta a buscar) |
|---|---|
| **`.md:472`** | «Conexión Zoho → PostgreSQL **vía MCP** ya operativa, con actualización cada tres minutos.» |
| **`.md:923`** | «Conexión Zoho → PostgreSQL **vía MCP**» *(línea entera, encabezado de tabla o ficha)* |
| **`.md:2650`** | «[LOGRADO 21/08] Se conectó con éxito Zoho a la base de datos externa PostgreSQL **mediante MCP**. La información —tickets, órdenes de venta y contactos— se actualiza cada tres minutos.» |
| **`.md:2948`** | «Base de datos PostgreSQL propia; Zoho en solo lectura (**conexión MCP ya lograda**)» |
| **`.md:3655`** | «Logro: se conectó Zoho a la base PostgreSQL **mediante MCP**; tickets, órdenes de venta y contactos se actualizan cada tres minutos.» |
| **`.md:4225`** | «**Conexión MCP a PostgreSQL**, autocompletado por serial, OV previa a la recepción, menú visual de accesorios, interfaz que replica Zoho Desk, piloto Grimm EDM 180/280 y el módulo de digitalización del conocimiento.» |
| **`.md:4615`** | «Construido. Conexión Zoho → PostgreSQL **vía MCP** operativa, actualización cada tres minutos» *(Anexo H, fila H.4 · M11)* |

**Texto propuesto** — sustituir en las siete la mención de MCP por el componente real. Por ejemplo,
en `.md:4615`:

> «Construido. Conexión Zoho → PostgreSQL mediante **cliente REST propio con OAuth2** (refresh token
> por servicio), operativa, actualización cada tres minutos»

Y en `.md:2650`:

> «[LOGRADO 21/08] Se conectó con éxito Zoho a la base de datos externa PostgreSQL mediante un
> **cliente REST propio con OAuth2**. La información —tickets, órdenes de venta y contactos— se
> actualiza cada tres minutos.»

Las siete van **en el mismo pase**: si sólo se corrige el Anexo H, el Anexo H dirá una cosa y el
cuerpo del documento otra en seis sitios.

#### 3.b · Las excepciones — MCP legítimo (CINCO, **NO TOCAR**)

Estas cinco hablan de MCP como **herramienta de la capa de conocimiento**, que es un uso correcto del
término y una vía todavía abierta en el proyecto. Van nombradas una a una para que nadie las meta en
el pase de corrección:

| Línea | Texto — **se deja tal cual** |
|---|---|
| **`.md:259`** | «Alternativas al RAG a evaluar con prototipo: wiki tipo Obsidian y **MCP contra NotebookLM**. Deja en suspenso la elección de pgvector.» |
| **`.md:2709`** | «**Google Stitch (beta, con capacidades MCP y Antigravity)** — genera rápidamente interfaces móvil, tablet y escritorio.» |
| **`.md:2767`** | «**MCP contra NotebookLM** o contra los notebooks propios» |
| **`.md:2768`** | «En lugar de construir el almacén vectorial, **se consulta por MCP** una herramienta que ya resuelve la recuperación.» |
| **`.md:4055`** | «Elegir la vía de la capa de conocimiento con un prototipo: RAG con almacén vectorial, wiki tipo Obsidian, o **MCP contra NotebookLM**. Sustituye al punto 27.» |

#### 3.c · Caso aparte — la entrada de glosario del Anexo E (`.md:4159-4160`)

No es ni error ni excepción: es una **definición que hay que REESCRIBIR, no borrar**.

- **`.md:4159`** — el término: «MCP»
- **`.md:4160`** — la definición: «Model Context Protocol — **vía por la que se conectó Zoho a la base
  PostgreSQL externa**.»

**El problema:** si se corrigen las siete de §3.a y se deja esto intacto, **el glosario define el
término por un uso que nunca ocurrió**. Queda peor que antes: la única definición del documento
apuntaría al único sitio donde el hecho es falso.

**Dos salidas, y hay que elegir una:**

1. **Reescribir la definición**, si MCP sigue vivo en el proyecto como vía de la capa de conocimiento
   (§3.b lo respalda: `.md:259`, `.md:2767`, `.md:2768`, `.md:4055`). Texto propuesto:

   > «**MCP** · Model Context Protocol — protocolo por el que un agente consulta herramientas
   > externas. En este proyecto es una de las vías candidatas para la capa de conocimiento (contra
   > NotebookLM o contra los notebooks propios). **No interviene en la conexión Zoho → PostgreSQL**,
   > que es un cliente REST propio con OAuth2.»

2. **Retirar la entrada** del Anexo E, si se decide que MCP deja de usarse en el proyecto. En ese caso
   hay que retirar también las cinco menciones de §3.b, y eso ya no es una corrección: es una decisión
   de alcance.

**Recomendación: la opción 1.** Las cinco menciones de §3.b están vivas y sin decidir, así que el
término hace falta en el glosario. La frase final —«no interviene en la conexión Zoho → PostgreSQL»—
es la que impide que el error vuelva dentro de tres revisiones.

### 4 · Baseline c.7 — las cuatro tablas suscritas

**Texto actual, `docs/sdd/F0-00_Baseline_as-built.md` línea 125:**

> «**c.7 — Sólo 4 tablas se replican del hub a `desk-db`.** `contacts`, `activities`, `clients`
> (vista sobre `books.contacts`) y `sales_orders`, vía replicación lógica de Postgres.»

**Texto propuesto:**

> «**c.7 — Sólo 4 tablas se replican del hub a `desk-db`.** `desk.activities`, `books.contacts`,
> `books.sales_orders` y `books.items`, vía replicación lógica de Postgres (`zoho_ref_pub` →
> `zoho_ref_sub`). **No hay un `contacts` del lado `desk` en la suscripción**: `desk.contacts` es
> otra tabla, la escribe el sync local y no se replica.»

**Evidencia de primera mano.** `debt.md:298-301` registra la verificación en producción del
2026-08-10: `pg_subscription_rel` con las cuatro tablas en estado `r` — `desk.activities`,
`books.contacts`, `books.sales_orders`, `books.items`. La lista del baseline es la de **antes** de la
fase 2 de reorganización de esquemas, que sustituyó `clients` y `sales_orders` por `books.contacts` y
`books.sales_orders` (`docs/superpowers/plans/2026-06-18-reorg-esquemas-fase2.md:183-184`).

### 5 · Baseline §3.e.3 y §8 — las líneas de `vitest.config.ts`

El baseline cita `vitest.config.ts:14` para `environment` y `:16-19` para `include`. **Las dos son
incorrectas.** Los valores reales del fichero son:

- **`vitest.config.ts:16`** — `environment: 'node'`
- **`vitest.config.ts:17-20`** — el bloque `include` con `apps/**/*.test.ts` y `packages/**/*.test.ts`

(La línea 14 es un cierre de llave del bloque `resolve.alias`.)

Hay que corregirlo en **cinco sitios del baseline**, que repiten la misma cita: líneas **27** (§3,
punto 3), **161** (§3 e.3), **244** (tabla de desvíos, fila «Anexo H (alcance)»), **509** (§8, tabla
de decisiones) y **588** (§8, punto 3 de preguntas a Gerencia).

### 6 · Anexo G, columnas 42 y 43

**Columna 42 — `Fecha Orden de Compra`. Texto actual, `.md` líneas 4400-4402:**

> «42 · Fecha Orden de Compra · **Habilitar Servicio** · Aprobación · Aprobación y S. Repuestos.»

**Texto propuesto:** retirar «Habilitar Servicio».

> «42 · Fecha Orden de Compra · Aprobación · Aprobación y S. Repuestos.»

**Evidencia de primera mano en el código.** `packages/shared/src/transitions.ts:179-180` documenta la
omisión y la razona: *«Sin `Fecha de Cotización` ni `Fecha Orden de Compra`: en esta etapa no aportan
—la cotización y la compra pueden no existir todavía, igual que la orden de venta— y las dos tienen
su propia etapa más adelante»*. La lista de campos de `habilitar_servicio` (`:189`) confirma que el
campo no está. **Es una divergencia documentada y razonada, no un defecto:** lo que hay que corregir
es el Anexo G, no el código.

**Columna 43 — `Fecha Orden De Venta`. Texto actual, `.md` líneas 4397-4399:**

> «43 · Fecha Orden De Venta · **Habilitar Servicio.** Formaliza la activación del ticket.»

**Texto propuesto:** añadir la segunda transición que la escribe.

> «43 · Fecha Orden De Venta · Habilitar Servicio (formaliza la activación del ticket) **y Aprobación
> y S. Repuestos**.»

**Evidencia de primera mano.** `packages/shared/src/transitions.ts:199` — la transición
`aprobacion_y_repuestos` declara `fields: [comment(), cfDate('Fecha Orden de Compra'), cfDate('Fecha
Orden De Venta')]`. Escribe las dos columnas, la 42 y la 43.

### 7 · Baseline §6.5 y §8 — las cuatro capacidades «sin diseño» sí tienen fuentes

**Texto actual, `docs/sdd/F0-00_Baseline_as-built.md` línea 497:**

> «**Cuatro capacidades de §2.3 no tienen ni diseño histórico ni código: sus specs no se destilan, se
> escriben.** Son `transitions-equipo-nuevo`, `transitions-soporte-remoto`, `diagnostico-checklist` e
> `informes`.»

**Texto propuesto:** sustituir por

> «Cuatro capacidades de §2.3 no tienen código, pero **sí tienen diseño de partida**. La afirmación
> anterior de este baseline era falsa para las cuatro, y la causa fue de alcance: la auditoría leyó
> `docs/superpowers/` y `debt.md`, y no leyó `docs/analisis-tickets/` ni `docs/inspecciones/`.»
>
> | Capacidad | Fuente |
> |---|---|
> | `diagnostico-checklist` | `docs/inspecciones/` — Grimm EDM180 y Horiba AP370 |
> | `informes` | `docs/inspecciones/` — columna «Comentario de falla (informe al cliente)» |
> | `transitions-equipo-nuevo` | `docs/analisis-tickets/DF-equipo-nuevo-030226.xlsx` |
> | `transitions-soporte-remoto` | `docs/analisis-tickets/DF-soporte-remoto-030226.xlsx` |

La corrección afecta al mismo texto en **§6.5** y en **§8**. Va acompañada de la frontera de alcance
para F0-02: **estructura sí, contenido no** — la spec captura la forma (esquema de campos, tres
niveles de criterio de falla, N1/N2/N3, encadenamiento, captura tipada, foto por novedad, enlace
ítem→SKU), no los ítems concretos, que son dato semilla de F1D.

> **Advertencia de trazabilidad.** `docs/analisis-tickets/` **no está en el repositorio**:
> `git ls-files docs/analisis-tickets/` devuelve vacío. Quien clone el repositorio no puede verificar
> esta corrección hasta que se versione `docs/`, que es una decisión abierta de Gerencia.

---

## Qué NO contiene este fichero

- No aplica ningún cambio al `.docx`. Es texto propuesto, no un parche.
- No modifica los proposals de `openspec/changes/`.
- Los **cinco incumplimientos vivos** del código no van aquí: van en `CLAUDE.md` y en
  `openspec/config.yaml` (`incumplimientos_vivos`), porque son deuda de código, no correcciones del
  maestro.
