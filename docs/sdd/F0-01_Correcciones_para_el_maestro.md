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
| Tanda | F0-01, ampliado por **F0-02** (entradas 8–12) y **F0-03** (entrada 13) |
| Base | commit `a3a8f03` (F0-01) · commit `ad1875b` (las cinco de F0-02, entradas 8–12) · commit `da084e9` (la de F0-03, entrada 13) |
| Fuente de las correcciones | F0-00 (baseline as-built, correcciones desde maestro, respuestas de Gerencia) · **F0-02** (destilado de `openspec/specs/transitions-st/spec.md` contra el código) · **F0-03** (contraste del Anexo C.10 con la copia citable del acta del 03/09) |
| Fecha | 2026-09-08, ampliado el 2026-09-09 |

> **Por qué las de F0-02 viven en el fichero de F0-01 y no en uno propio.** El canal hacia el maestro
> es **uno**, y partirlo por tanda obligaría a Gerencia a abrir dos ficheros para pegar en el mismo
> anexo. El nombre conserva la tanda que lo creó; la procedencia de cada entrada va en su título.

---

## Anexo D — cuatro puntos nuevos

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

### D-nuevo 4 · El histórico que C1 deja sucio, y que su arreglo no repara

**Va en la misma entrada que C1**, porque es su consecuencia y se pierde si se anota aparte.

`liberacion_sin_facturar` es **columna promovida** (`rows.ts:121`, `schema.sql:39`), no un campo suelto en `custom_fields`. Y el defecto C1 no sólo deja pasar la transición: **escribe**. Como el checkbox nunca se valida, la casilla sin marcar se guarda como `false` (`transitionExec.ts:65`) mientras el ticket sí avanza a «Por Entregar / Sin facturar».

Consecuencia: **hoy hay filas en producción que afirman que el ticket NO se liberó sin facturar, estando exactamente en el estado de liberado sin facturar.** El arreglo de F1A-01 detiene la sangría; **no repara el histórico**. Quien audite liberaciones sin factura sobre esos datos estará auditando un dato falso.

Lo que hay que decidir, y no es de código:

1. Si se recalcula el histórico. El dato correcto **sí existe**: `ticket_transitions.values` guarda todos los valores de cada transición (`schema.sql:57-61`), así que las filas de `liberacion_sin_factura` permiten reconstruir qué se envió realmente. Es el mismo mecanismo que salva los diez campos de fecha reentrantes (D-nuevo 2).
2. Si en su lugar la columna se marca como no fiable antes de una fecha, y los informes la ignoran hasta ahí.

Medición previa, para dimensionarlo:

```sql
SELECT COUNT(*) AS liberados_sin_factura,
       COUNT(*) FILTER (WHERE liberacion_sin_facturar IS NOT TRUE) AS con_la_casilla_en_falso
FROM desk.tickets
WHERE status = 'Por Entregar / Sin facturar' OR id IN (
  SELECT ticket_id FROM desk.ticket_transitions WHERE transition_id = 'liberacion_sin_factura');
```

**Y el defecto tiene dos vías, no una** — el detalle que decide si el arreglo de F1A-01 es real:

`transitionExec.ts:44` define `empty` como `undefined`, `null` o cadena vacía. Para un checkbox eso significa que el campo **ausente** sí se caza, pero el campo **presente en `false`** no: `false` no es `empty`. Y la segunda es la vía normal, porque un formulario con la casilla desmarcada manda `false`. El arreglo son **dos piezas**: mover el bloque del checkbox entre `:70` y `:71`, **y** que el chequeo de obligatorio para `kind === 'checkbox'` sea `asBool(raw) !== true` en vez de `empty`. Está demostrado por mutación en `apps/desk/server/transicionesEjecucion.test.ts`: con sólo la primera pieza, las dos pruebas de la vía del `false` siguen verdes.

---

## Anexo I — doce correcciones trazables

Las **siete primeras** proceden de **F0-00**. Las **cinco últimas (8–12)** proceden de **F0-02**, al
destilar la spec as-built de `transitions-st` contra el código. Van en el registro del Anexo I con su
disposición, y el cambio se aplica en el sitio que indica la columna «Dónde».

| # | Corrección | Dónde |
|---|---|---|
| 1 | M1.9.1: diez → **ocho** transiciones compartidas | Maestro |
| 2 | «trece indicadores» → **once** (G.6 tiene once). **Son tres líneas**, no sólo la fila del Anexo H | Anexo D (`:3927`) · nota de cobertura (`:4273`) · Anexo H (`:4599`) |
| 3 | «vía MCP» → cliente REST propio con OAuth2. **Son siete líneas**, con **cinco excepciones que no se tocan** y una entrada de glosario a reescribir | Cuerpo del maestro (seis) · Anexo H (`:4615`) · Anexo E (`:4159-4160`) |
| 4 | c.7 del baseline: las suscritas son `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items` — **no hay un `contacts` del lado desk** | Baseline |
| 5 | §3.e.3 y §8 del baseline: `vitest.config.ts:14,16-19` → **`:16`** (environment) y **`:17-20`** (include) | Baseline |
| 6 | G.5 col. 42: `habilitar_servicio` **no** escribe `Fecha Orden de Compra` (`transitions.ts:179-180`, divergencia documentada y razonada); col. 43 incompleta —también la escribe `aprobacion_y_repuestos` | Anexo G |
| 7 | §6.5 y §8 del baseline: las cuatro capacidades «sin diseño» sí tienen fuentes | Baseline |
| 8 | M1.9.2, fila `Aprobación`: el «**+ Director Técnico**» **no está implementado**. Retirarlo, o decidirlo y llevarlo al código | Maestro (`:1665`) |
| 9 | M1.3.8: la aritmética de alcanzabilidad mezcla dos convenciones de recuento, y el 20 **necesita el paso sin botón** | Maestro (`:1413`) |
| 10 | M1.9.2 «treinta y una» es **correcta**: **no tocar el maestro**. Lo que está mal son **dos** cuentas del docblock del código (`transitions.ts:262` y `:265`) | **Ninguno del maestro** — deuda de código, destino F1B-06 |
| 11 | M1.3.3: los dos pasos sin botón **sí** están declarados en el archivo de transiciones; lo que no está ahí es su `from`/`to` | Maestro (`:1151`) |
| 12 | M1.10: el pendiente «falta por confirmar que registre siempre el usuario» **está cerrado**. Y el Anexo H debe reflejarlo | Maestro (`:1677`) · Anexo H |

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

## Las cinco de F0-02 (8–12)

> Proceden de destilar `openspec/specs/transitions-st/spec.md` contra el código, sobre el commit
> `ad1875b`. Cada una lleva la cita del maestro y la evidencia de primera mano en el código, en la
> misma forma que las siete anteriores. La numeración `M-n` con la que aparecen en la spec se indica
> para poder cruzarlas.

### 8 · M1.9.2, fila `Aprobación` — el «+ Director Técnico» no existe en el código *(M-2 en la spec)*

**Texto actual, `.md` líneas 1663-1665** (tabla de las tres etapas que proponen destinatario, dentro
de M1.9.2, cuyo encabezado está en la línea 1651). La celda «Por qué» de la fila `Aprobación`:

> «El cliente aprobó y el trabajo vuelve al taller. Ahí no hay puesto fijo al que mandarlo: hay que
> devolvérselo a quien diagnosticó ese ticket. **+ Director Técnico**»

**Texto propuesto:** retirar el «+ Director Técnico», dejando

> «El cliente aprobó y el trabajo vuelve al taller. Ahí no hay puesto fijo al que mandarlo: hay que
> devolvérselo a quien diagnosticó ese ticket.»

**Evidencia de primera mano en el código.** `packages/shared/src/transitions.ts:267-275` declara el
mapa completo de propuestas de derivación. Son tres entradas, y la de `aprobacion` es:

```ts
aprobacion: { tipo: 'primerDerivado' },   // transitions.ts:274
```

`DerivacionPorDefecto` (`transitions.ts:51-53`) es una **unión de dos variantes** —`{ tipo: 'cargo';
cargo: string }` o `{ tipo: 'primerDerivado' }`—, y el propio fichero explica por qué es unión y no
dos campos sueltos: «para que "las dos cosas a la vez" ni siquiera se pueda escribir: serían dos
propuestas compitiendo por la misma casilla y habría que inventar un orden entre ellas»
(`transitions.ts:40-42`). O sea que el «+ Director Técnico» **no es que falte por implementar: hoy es
inexpresable** en el tipo.

**Qué hay que decidir, no sólo corregir.** Por su posición —al final de una celda de tabla, después
del punto— parece resto de edición del `.docx`. Pero si es una decisión real de Gerencia, entonces:

- no es una corrección de texto sino **alcance nuevo** para F1C-05, y
- obliga a cambiar `DerivacionPorDefecto` para admitir dos destinatarios, con el orden entre ellos
  decidido explícitamente, que es exactamente lo que el diseño del tipo quiso evitar.

Las dos primeras filas de esa misma tabla (`escalado_a_revision` → `Director Técnico`,
`escalado_a_comercial` → `Coordinador Comercial`) **sí** coinciden con el código
(`transitions.ts:269`, `:271`).

### 9 · M1.3.8 — la aritmética de alcanzabilidad mezcla dos convenciones *(M-3 en la spec)*

**Texto actual, `.md` línea 1413** (apartado M1.3.8, encabezado en la línea 1412):

> «Los 21 estados son alcanzables desde alguna de las dos entradas: **18 desde OV asignada, y desde
> Ticket creado los otros 20 —todos menos OV asignada—**. No hay estados huérfanos.»

**Texto propuesto:** sustituir por

> «Los 21 estados son alcanzables desde alguna de las dos entradas. Contando **sólo transiciones con
> botón**, cada entrada alcanza **18 estados además de sí misma**: desde `OV asignada` quedan fuera
> `Ticket creado` y `Remisión creada`; desde `Ticket creado`, `OV asignada` y `Remisión creada`.
> **`Remisión creada` no es alcanzable por ningún botón**: su única entrada es el paso sin botón de
> M1.3.3, y sumándolo `Ticket creado` alcanza los 20 restantes. No hay estados huérfanos ni
> callejones sin salida más allá de `Finalizado`.»

**Evidencia de primera mano en el código.** Cierre transitivo sobre las 34 transiciones de
`packages/shared/src/transitions.ts:171-256`:

| Desde | Alcanzados, contando el origen | No alcanzados |
|---|---|---|
| `OV asignada` | 19 | `Ticket creado`, `Remisión creada` |
| `Ticket creado`, sólo botones | 19 | `OV asignada`, `Remisión creada` |
| `Ticket creado` + el paso sin botón | 20 | `OV asignada` |

**Qué está mal, exactamente.** Las dos cifras del maestro son defendibles por separado y
**contradictorias juntas**: el 18 excluye el estado de origen y el 20 lo incluye. Y el 20 sólo se
alcanza contando el paso sin botón de `estadoPorRemision.ts:52-60`, que no es una transición del
grafo. En la misma base que la primera cifra —botones, sin contar el origen— son **18 y 18**.

La conclusión del maestro se sostiene: no hay huérfanos. Lo que no se sostiene es el recuento, y una
cifra que no se puede reproducir es la clase de dato que la R05 ya vio envejecer en silencio.

*(Dato que el maestro no dice y conviene que diga: `Finalizado` es el único estado sin salida —
`invariantesGrafo.test.ts:62-66`—, lo que ya afirma M1.3.8 en la línea 1414 y aquí queda respaldado
por prueba.)*

### 10 · M1.9.2 «treinta y una» es correcta — **NO TOCAR el maestro** *(M-5 en la spec)*

Esta entrada va en el registro **para cerrar la duda, no para cambiar el maestro**. Es el caso
inverso a las demás: el maestro tiene razón y el código no.

**Texto actual, `.md` línea 1653** (apartado M1.9.2):

> «Las 34 transiciones terminan en una casilla «Derivado a», y ninguna la exige. La razón es
> deliberada: derivar no puede frenar un ticket. **Treinta y una** heredan al responsable que el
> ticket ya traía; tres proponen a otro»

**Texto propuesto: ninguno.** 34 − 3 = **31**, y la cifra del maestro es exacta.

**Lo que sí está mal está en el código**, y son **dos** cuentas en el mismo docblock de
`DERIVACION_POR_DEFECTO` (`packages/shared/src/transitions.ts:258-266`):

| Línea | Dice | Es |
|---|---|---|
| `transitions.ts:262` | «Heredar al derivado anterior —lo que hacen **las otras 32**—» | **31** |
| `transitions.ts:265` | «en una lista de tres líneas se ve de un vistazo cuáles pisan lo heredado, y **en 35 declaraciones** no» | **34** |

Es defecto de **comentario, no de comportamiento**: el mapa tiene tres entradas y `TRANSITIONS` tiene
34, y las dos cosas están probadas (`invariantesGrafo.test.ts:50-54`). El docblock también dice «las
35 etapas» en `transitions.ts:68` y «las 34 entradas … la 35.ª» en `:283`, que son las mismas dos
convenciones —34 transiciones o 35 filas del Blueprint de Zoho contando la creación— usadas sin
avisar en el mismo fichero.

**Destino: F1B-06**, la tanda que toca `transitions.ts`. Queda registrado como comportamiento actual
en `openspec/specs/transitions-st/spec.md` §3.9. **F0-02 no lo corrige: es código.**

### 11 · M1.3.3 — los dos pasos sin botón sí están declarados en el archivo de transiciones *(M-4 en la spec)*

**Texto actual, `.md` línea 1151** (apartado M1.3.3, encabezado en la línea 1150):

> «Dos de los 38 pasos del mapa no son transiciones con botón: los escribe el servidor cuando ocurre
> algo con la remisión, sin que nadie pulse nada. **Viven en apps/desk/server/db/estadoPorRemision.ts,
> no en el archivo de transiciones.**»

**Texto propuesto:** sustituir la última frase por

> «Su **declaración** vive en el archivo de transiciones —`packages/shared/src/transitions.ts`, junto
> a las 34—, y **quien los aplica** es `apps/desk/server/db/estadoPorRemision.ts`. Lo que no tienen
> es `from` ni `to`: no son grafo, y por eso quedan fuera de la lista que la pantalla ofrece como
> botones.»

**Evidencia de primera mano en el código.**

- Las dos constantes, con `id`, `name` y `area`, están en `transitions.ts:150-151`:
  `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA`. El comentario de `:146-149`
  dice por qué no están en `TRANSITIONS`: «ahí solo va lo que la interfaz ofrece como botón».
- `estadoPorRemision.ts:9-12` las **importa** de `@ambientalia/shared`; no las declara.
- Que no tienen `from` ni `to`, y que no se cuelan en `TRANSITIONS`, está probado:
  `invariantesGrafo.test.ts:120-127`.

**Por qué importa y no es cosmético.** Quien lea la frase actual buscará las dos pseudo-transiciones
en `estadoPorRemision.ts` y encontrará dos importaciones. Y, al revés, quien cuente `area:` en
`transitions.ts` encontrará **36** declaraciones y no 34 — que es la trampa que la entrada 1 de este
fichero ya tuvo que desactivar con una nota al pie.

### 12 · M1.10 — el pendiente sobre el «quién» de cada transición está cerrado *(M-6 en la spec)*

**Texto actual, `.md` línea 1677** (apartado M1.10, encabezado en la línea 1675). Última frase:

> «Conviene notar que el as-built ya escribe la marca de tiempo de cada transición; **lo que falta por
> confirmar es que registre siempre el usuario que la ejecutó.**»

**Texto propuesto:** sustituir la última frase por

> «El as-built escribe la marca de tiempo **y el usuario** de cada transición: `performed_by` se
> escribe en la misma sentencia que el resto de la fila del historial, y está comprobado en las 34
> transiciones. **Confirmado en F0-04**; queda por decidir el caso de la constante de respaldo, que
> sólo actúa si la sesión no trae nombre.»

**Evidencia de primera mano en el código.**

- `packages/zoho-sync/src/db/repo.ts:282-286` inserta en `ticket_transitions` las nueve columnas de
  la fila, `performed_by` incluida, en la misma sentencia que `from_status`, `to_status` y `area`. No
  hay camino que escriba la fila sin el actor.
- El actor es el usuario de la sesión: `apps/desk/server/services/ticketService.ts:111`
  (`const actor = user.name ?? TRANSITION_ACTOR`).
- Comprobado en **las 34 transiciones**, ejercitando **todos** los `from` de cada una —36 ejecuciones,
  porque `habilitar_servicio` tiene tres—: `apps/desk/server/transicionesEjecucion.test.ts:312-325`
  lee `transition_id`, `from_status`, `to_status`, `area` y `performed_by` de la fila resultante.

**El matiz que la corrección debe conservar, no esconder.** `TRANSITION_ACTOR`
(`apps/desk/server/transitionActor.ts:3`) sigue existiendo como respaldo, con el valor
`'Equipo Técnico'` y configurable por entorno. Hay **un** camino por el que puede llegar a escribirse
en el historial, y no es el endpoint de transición: el **callback de n8n** de la remisión
(`apps/desk/server/routes/remision.ts:320`), que aplica el paso sin botón de M1.3.3. Esa petición **no
tiene sesión** —n8n no manda la cookie—, así que firma quien creó la remisión y cae al marcador sólo
si la remisión no trae autor, que es el caso de las históricas (`routes/remision.ts:315-319`).

Los otros dos usos del respaldo —anular y restaurar remisión, `routes/remision.ts:282` y `:292`— van
detrás de `requireAuth` y `requireAdmin` (`:275` y `:287`), así que ahí `req.user.name` está siempre
presente y el `?? TRANSITION_ACTOR` es defensivo, no alcanzable. En el endpoint de transición tampoco
se alcanza: el middleware exige sesión (`apps/desk/server/routes/tickets.ts:35`).

Decir «confirmado» a secas dejaría el maestro afirmando algo más fuerte de lo que el código sostiene:
lo confirmado es que **ninguna fila del historial se escribe sin actor**, no que el actor sea siempre
una persona identificada.

**Y el Anexo H.** La fila de servicio técnico de H.2 (`.md:4493-4496`) y la tabla de correcciones de
H.3 deberían reflejar que la red de pruebas del motor existe desde F0-04: 110 ficheros y 931 pruebas
sobre el commit `ad1875b`, frente a los 96 y 830 del baseline.

---

## La de F0-03 (13)

> Procede de contrastar el Anexo C.10 del maestro contra la copia citable del acta
> `docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md` (480 líneas, exportada de Notion en el commit
> `da084e9`). No es un número mal contado como las cinco de F0-02: es **un apartado que describe un
> estado que dejó de ser cierto**.

### 13 · Anexo C.10 — la sesión del 03/09 **sí se celebró** *(F0-03)*

**Texto actual, `.md` líneas 3815-3816** (Anexo C.10, encabezado en la 3815):

> «**C.10 — 03/09/2026 · Sesión convocada (aún no celebrada)**
> Incorporada en la R08.1 como convocatoria, no como acta. **A la fecha de cierre de esta revisión la
> sesión no se ha celebrado y el apartado de notas está vacío en el origen.**»

**Texto propuesto:** sustituir el encabezado y el primer párrafo por

> «**C.10 — 03/09/2026 · Sesión celebrada**
> La sesión se celebró el 03/09/2026 a las 14:00 por Google Meet, con Alfonso García del Pino
> (Gerencia, moderador), Gustavo Novoa (Dirección Técnica) y Johny Luna (Servicio Técnico). Trató
> ocho temas y dejó **doce decisiones escritas** y **doce tareas con responsable**. El acta completa
> es la fuente citable del repositorio: `docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md`. Su
> parte III contiene el acta; sus partes I y II son la convocatoria previa y **no registran
> decisiones**. La siguiente sesión queda fijada para el **viernes 11/09/2026**.»

**Por qué el apartado quedó caduco, que es lo que hay que evitar la próxima vez.** La R08.1 se cerró
**antes** del 03/09 y no se volvió a tocar después. El propio maestro anticipa el mecanismo del fallo
en tres sitios más, que arrastran la misma frase y hay que corregir con ésta: `:17` («La sesión del
03/09 aún no se ha celebrado», en el índice), `:161` (misma frase en el índice de anexos) y `:217`
(cuerpo del §1.2). Y `:268` dice «queda por incorporar la reunión del 03/09/2026, "Checklist
dinámico", **no disponible al cerrar esta revisión**»: esa reunión **es** la del acta, y su tema 3
—la tabla de puntos de control de Grimm y Horiba— es justamente el «checklist dinámico» que se echaba
en falta (`acta:337-357`).

Es exactamente el punto abierto **nº 61** del propio maestro, «Mecanismo de incorporación de actas»
(`acta:122`, citándolo): «La del 27/08 estuvo cinco revisiones sin entrar en el documento. Quién
avisa, con qué cadencia y contra qué fuente se comprueba». La del 03/09 iba camino de repetirlo.

**Evidencia de primera mano en el acta.**

- **Se celebró:** `acta:280-283` — fecha 03/09/2026, hora 02:00 PM, Google Meet, moderador Alfonso
  García del Pino Beneítez. `acta:286-288` lista los tres participantes.
- **Ocho temas tratados:** `acta:292-299`, con su desarrollo en `acta:303-450`.
- **Doce decisiones escritas.** Salen de **siete** bloques `**Decisiones tomadas:**` —`acta:311`,
  `:329`, `:348`, `:380`, `:400`, `:422` y `:439`—, con 1 + 1 + 2 + 1 + 4 + 1 + 2 viñetas. **La cifra
  la produjo un comando**, no una lectura:

  ```
  awk '/^\*\*Decisiones tomadas:\*\*/{en=1;next} en&&/^- /{t++} en&&(/^\*\*/||/^## /){en=0} END{print t}'
  ```

  El tema 4 —criterios de falla y encadenamiento— es el único de los ocho que **no** deja decisión:
  sólo tarea (`acta:368-370`). Conviene que el Anexo C.10 lo diga, porque Gerencia lo señaló como «el
  punto más crítico por resolver» (`acta:366`).
- **Doce tareas con responsable:** el plan de acción consolidado de `acta:465-480`, seis de ellas con
  fecha límite 11/09/2026.
- **La siguiente sesión:** `acta:442` («Trasladar la siguiente sesión al viernes 11/09/2026») y
  `acta:462`.

**El matiz que la corrección debe conservar, y es el que más importa.** El fichero tiene **dos
partes que no son lo mismo**: la convocatoria (partes I y II, `acta:26-267`) y el acta (parte III,
`acta:268-480`). La convocatoria lleva **45 casillas**, de las que **tres** están marcadas `[x]`
—`acta:121`, `:170`, `:173`— y las 42 restantes no. **Una casilla marcada no es una decisión**, y de
las tres sólo una tiene respaldo en el acta:

| Casilla marcada en la convocatoria | ¿La respalda el acta? |
|---|---|
| `:170` «¿Entra el módulo de informes en la Fase 1?» | **Sí.** Decisión en `acta:402`, tema 6 |
| `:173` **P10** — validación de informes antes de emitir, con firma por etapa | **No.** Se *discutió* —`acta:397`, «se planteó la necesidad de una etapa de revisión con dos personas»— pero está en el **resumen de la discusión**, no en ningún bloque de decisiones |
| `:121` **P62** — qué se hace con la capa as-built | **No, y ni siquiera se trató.** `grep` de `P62`, `as-built`, `capa as` y `Anexo H` sobre la parte III entera no devuelve **ninguna** línea |

**Por eso el punto abierto nº 62 sigue vivo, y el Anexo C.10 debe decirlo.** El maestro lo describe
en `:215`: el 27/08 se acordó retirar las referencias a lo construido, y la revisión posterior
encargó el Anexo H; son criterios opuestos y «no me corresponde elegir». La convocatoria lo llevó
marcado al orden del día (`acta:121`), la sesión no lo trató, y la **regla de la sesión** que la
propia convocatoria fija (`acta:114-116`) dice qué pasa entonces:

> «Cada bloque sale con una de dos cosas: una decisión escrita, o un responsable con una fecha. Lo que
> no salga con ninguna de las dos **vuelve al Anexo D y bloquea la construcción del módulo al que
> pertenece**.»

**Texto propuesto para el punto 62 del Anexo D:** añadir al final

> «Llevado al orden del día de la sesión del 03/09/2026 (bloque 0 de la convocatoria) y **no tratado
> en ella**: el acta no registra decisión ni responsable. Por la regla de la sesión, vuelve al Anexo D.
> Sigue abierto, y con él sigue abierta la contradicción entre retirar la capa as-built y mantener el
> Anexo H.»

Ese punto tiene ahora una consecuencia concreta que antes era hipotética: F0-02 escribió **siete
specs as-built** en `openspec/specs/`. Si la sesión decidiera retirar la capa as-built del `.docx`,
esas siete specs pasan a ser **la única copia** de ese contenido, no una duplicada — que es
exactamente lo que el proposal de F0-02 anticipó en su §6.

---
## Qué NO contiene este fichero

- No aplica ningún cambio al `.docx`. Es texto propuesto, no un parche.
- No modifica los proposals de `openspec/changes/`.
- Los **cinco incumplimientos vivos** del código no van aquí: van en `CLAUDE.md` y en
  `openspec/config.yaml` (`incumplimientos_vivos`), porque son deuda de código, no correcciones del
  maestro.
