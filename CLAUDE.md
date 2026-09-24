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

    docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md   (5.167 líneas)

Se regenera con `scripts/docx2md.sh <entrada.docx> [salida.md]`. No hay `pandoc` en las máquinas del
equipo: el script son veinte líneas sobre `unzip` y `sed`. Cada revisión del maestro se vuelve a
exportar; el `.docx` sigue siendo el original editable.

**Y la R08.1.md SE CONSERVA trackeada, a propósito: es la única forma de que 147 citas sigan siendo
verificables.** Las dos copias conviven y cada una tiene un oficio:

| Copia | Líneas | Para qué |
|---|---|---|
| `…R08.2.md` | 5.167 | **Toda cita NUEVA.** Es el maestro vigente |
| `…R08.1.md` | 4.935 | **Sólo para leer las 147 citas `R08.1.md:NNNN` que ya existen.** No se cita desde hoy |

> ⚠️ **Las 147 citas viejas NO se renumeran a la R08.2.** Es el **caso B** de la regla de mutación 4:
> afirman algo que era cierto de la R08.1, y su revisión va en la propia cita. Renumerarlas a ciegas
> las volvería falsas, y encima **parecería** reparado — que es exactamente el fallo que esa regla
> registra. La R08.2 tiene **+232 líneas** y el desplazamiento **no es uniforme**: el §3.2 se mueve
> +107 y el final del documento +232. Un `sed` sobre el número es el modo de fallo, no la reparación.

*Por qué se versiona la R08.2 el 2026-09-17:* el fichero llevaba dos días en el disco **sin trackear**
mientras `docs/sdd/R08.3_Expediente_de_cambios.md:10-12` —que sí está versionado— ya declaraba que «el
`.md` citable de partida es …R08.2.md». O sea que el repositorio afirmaba por escrito depender de un
fichero que no contenía. Quien clonara no podía comprobar ni una sola cita de ese expediente.

**La R08.3 todavía NO existe como `.md`**, y no es un olvido: `R08.3_Expediente_de_cambios.md` es un
encargo **pendiente de aplicar al `.docx`** («Destinatario: el proyecto de Claude que tiene el `.docx`
delante», `:4`). El día que Gerencia lo pegue y se reexporte, la citable pasa a ser la R08.3.md y esta
tabla gana una fila — la R08.2.md se queda, por la misma razón que hoy se queda la R08.1.md.

Las correcciones que el maestro necesita **no se aplican al `.docx`**: se entregan como texto en
`docs/sdd/F0-01_Correcciones_para_el_maestro.md` para que Gerencia las pegue.

**Un apartado del maestro está marcado `[EN REVISIÓN — R08]`, y citar un ítem suyo no es citar algo
acordado.** Es el **§3.2 «MVP — P0 · *Control y ejecución*»**. **Remedido contra la R08.2.md el
2026-09-17**, ocupa `:2946-3122`. Su tabla empieza en la cabecera de columnas `:2958` y termina en la
última fila, el ítem 28, `:3114-3119`. Las `:3120-3122` son tres notas posteriores, no filas. En
`:2948` el revisor marca **todo el backlog del MVP** como pendiente de revisar y discutir a fondo
—no objeta un ítem concreto: la lista se construyó antes de conocerse el as-built—, y en `:2949` el
maestro dice que **la tabla siguiente se mantiene como está, sin retocar, hasta esa sesión**,
remitiendo al **Anexo H** como lo que sí refleja el estado real.

*Los mismos límites en la R08.1.md, para leer las citas viejas:* §3.2 en `:2839-3015`, cabecera de
columnas `:2851`, ítem 28 `:3008-3012`, notas `:3013-3015`, marca `:2841`, «se mantiene» `:2842`.
El apartado se desplaza **+107 líneas** entre las dos copias; el final del documento, +232. Por eso
el desplazamiento no se aplica con una resta.

*Qué hacer con eso:* un ítem de esa tabla vale como **procedencia** —de dónde salió una fila del
plan— y NO como alcance acordado. Si una tanda nueva se apoya en uno para justificar su alcance, la
justificación operativa tiene que ser el plan o una decisión de Gerencia, no el ítem.

*Remedido el 2026-09-17, y la conclusión NO cambia: la marca no se propaga.* De las **147** citas
`R08.1.md:NNNN` del repositorio —eran 109 el 2026-09-13— sigue cayendo sólo **una** dentro del §3.2:
la de `openspec/specs/vistas-tablero/spec.md:9`, que apunta a `R08.1.md:2978` y ya lleva la marca
escrita. Hay además **tres** menciones SIN línea (`ítem 22 del maestro` en `openspec/config.yaml:412`,
`:631` y `:771`), y las tres usan el ítem exactamente como procedencia de `plan:163` para justificar
destinos **ya cerrados** (IV-1, IV-5, IV-7 → F1B-08): no hay nada que corregir en ellas.

⚠️ Esas tres **no las caza** ni `grep -rn "Fuente en el maestro" openspec/specs` ni un barrido de
`R08.1.md:[0-9]+`, porque no llevan número de línea. Hicieron falta **tres** detectores, que es el
mismo molde de siempre: un detector que no caza todo lo que la afirmación abarca.

*Y este mismo párrafo lo demostró otra vez al remedirlo:* decía las líneas 519 y 658; pasaron a ser la 557 y la 696, luego la 626 y la 766 al traer F0-05, y hoy, tras el corte del 21/09, son `:631` y
`:771`. Dos de sus tres referencias se habían desfasado **sin que nada se pusiera rojo**, y las dos
razones son las que esta sección ya tiene escritas, cada una en su sitio:

1. **Son abreviadas**, y el detector no bloquea la forma abreviada (regla de mutación 4, último
   guion). El `openspec/config.yaml:412` completo sí entra en el barrido —el patrón de
   `apps/desk/server/citas/cosecha.ts:65` no exige extensión conocida, así que un `.yaml` se caza
   igual que un `.ts`—, pero las otras dos no llevan nombre de fichero y quedan en lectura humana.
2. **Y aunque fueran completas, tampoco bastaría:** el detector comprueba que la línea EXISTA y no
   esté vacía, nunca que DIGA lo que la frase afirma. Una cita desplazada a otra línea con texto
   pasa en verde.

Es la regla de mutación 4 aplicada a este fichero: **el que escribe la regla no está exento de ella.**

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

### Regla de redacción — no se mencionan reuniones

Gerencia, 2026-09-17, panel. **No menciones reuniones, ni celebradas ni previstas**, en ningún
documento del repositorio. Las decisiones se toman en la conversación de Cowork y en el panel.
Un gate pendiente se describe por **qué decide**, **a quién corresponde** y **qué desbloquea** —nunca
por una fecha de encuentro—. Si te encuentras una mención heredada mientras editas ese fichero,
quítala.

### Regla de secretos

> Un secreto no entra nunca en un chat, una captura o un prompt. Si aparece en uno, **está quemado**:
> se rota, no se reutiliza. Los valores viven sólo en el gestor de secretos del despliegue.
> Un interruptor que enciende un escritor **nace cerrado** (`=== 'true'`), y va en `.env.example` y
> `DEPLOY.md` con dos frases: qué enciende y qué se rompe si se pone mal. Un flag no documentado se
> trata como defecto, no como configuración.

*Por qué existe:* quince credenciales del proyecto se filtraron por ese canal —chats y capturas—
(`debt.md:31`, `debt.md:840`). Rotarlas y seguir pegándolas en chats es teatro.

---

## Las cuatro reglas de la mutación — qué mutar para no necesitar revisor

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
sintético de `migrate.test.ts:396-398`. Blindaje de intención, no corrección de un fallo.

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
escribir el `INSERT` (hoy la guarda existe, `ticketService.ts:43-77` — reapuntada por
`orden-precedencia-guardas`, F1B-10, 2026-09-17; el resto del párrafo se lee contra `607e26a`). En H4,
`apps/desk/src/components/CrearRemision.tsx:195` decidía con `!data.equipo.serial` —un serial de sólo
espacios es *truthy* en JS— mientras el servidor sí recortaba antes de decidir
(`routes/remision.ts:153`, `.trim()`); hoy el cliente recorta igual, en esa misma línea. Las dos
tandas conocían la regla 13; las dos la escribieron en sus artefactos; ninguna de las dos hizo la
comparación línea a línea.

### Regla de mutación 4 — mover una línea rompe el índice, y nada se pone rojo

> Toda tanda que **INSERTE, BORRE o MUEVA** líneas en un fichero muy citado barre
> `grep -rnoE "<fichero>\\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio y comprueba **CADA** resultado
> contra el fichero, como parte del **CIERRE**.
>
> - **No basta con que la línea exista:** hay que leer qué **AFIRMA** la frase que cita y comprobar
>   que la línea lo dice. Cuatro rangos distintos citaban el mismo bloque de `estados.ts` y sólo uno
>   acertaba.
> - **Los RANGOS se desfasan por los dos extremos.** Comprueba el principio y el final por separado.
> - **La forma abreviada (`` `:92-96` ``, sin nombre de fichero) NO la captura ese grep.** Hace falta
>   un segundo pase en los ficheros que ya citan el módulo.
> - **Una cita en un comentario NO es una aserción:** ni `tsc`, ni `eslint`, ni las pruebas la ven.
>   Por eso va en el cierre y no se descubre sola.
> - **Un ejemplo de cita rota se escribe sin forma de cita, o el detector lo tratará como rota**
>   (`hook-citas-pre-push`, Q6). Se nombra en prosa, como «la línea 206 de este fichero», que cita el
>   `proposal.md` archivado de `por-entregar-es-espera` y en `984b797` era una línea vacía.
> - **El detector no bloquea la forma abreviada** (dos puntos y número, sin nombre de fichero): su
>   comprobación sigue siendo de lectura humana, con el informe del hook como ayuda
>   (`hook-citas-pre-push`, Q9).

*Por qué existe:* mover dos entradas de bloque en `packages/shared/src/estados.ts` (`4359b28`, que
añadió **+6 líneas** de comentario y con ellas corrió `100→106`, `106→112`, `114→120`) desfasó ~20
citas de medio repositorio, y el barrido de reparación de `30e698c` **dejó 16 más** —una de ellas
apuntando a una **línea vacía** desde un fichero de pruebas que esa misma tanda había editado
(`boardView.test.ts:80` → `estados.ts:87-88` en `5919b6e`). Engram obs. 505.

**Y la parte que sólo se ve al repararlas: una cita sólo es verificable contra una revisión.** Por eso
la reparación no es renumerar, son **tres casos**, y se decide leyendo qué afirma la frase:

| Caso | Qué afirma la frase | Reparación |
|---|---|---|
| **A · presente** | algo que sigue siendo cierto del árbol de hoy | se apunta a la línea de hoy |
| **B · histórico** | algo cierto en su momento y falso hoy —un paquete fechado, un «en su momento»— | se **nombra la revisión** en la cita (`estados.ts:114` en `eb98a59`). Renumerar a hoy volvería **FALSA** la frase: «nueve entradas» con el número de hoy dice once |
| **C · superado** | algo que otra tanda ya cerró | se conserva con su revisión y se añade qué lo cerró |

Renumerar a ciegas los tres casos por igual es el fallo que esto evita: convierte un registro fechado
en una afirmación falsa sobre el presente, y encima **parece** reparado. El otro modo de fallo tiene
el signo contrario —una cita que el barrido da por rota y está bien—: `transitions-st/spec.md:30`
citaba `estados.ts:59-103` en `ad1875b`, y 103 era `ESTADOS` cuando se escribió; `30e698c` lo llevó a `59-112`, que
es `ESTADOS` hoy. Correcta. Por eso el barrido se comprueba contra el fichero, nunca contra la lista.

**Lo que estas cuatro NO cazan.** H5 —la divergencia entre `normalizarNombreCliente`
(`apps/desk/server/backfillClientId.ts:47-68`, que pliega acentos y formas societarias) y el
`LOWER(...) LIKE '%q%'` de `searchClients` (`packages/zoho-sync/src/books/repo.ts:117-127`, que no
pliega nada)— es una divergencia **entre dos implementaciones de la misma noción**, ninguna de las
dos rota por separado. Para eso hace falta un lector, o una prueba que las enfrente. Que las tres
primeras cubran cuatro de cinco no las convierte en el revisor.

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

**Cuatro** desvíos vivos. Están anotados para que no se pierdan; **corregirlos no es tarea de la tanda
que los encuentre**, salvo que su destino sea esa tanda. La lista completa, con la misma información,
está también en `openspec/config.yaml` (`incumplimientos_vivos`).

**Dos movimientos el mismo día, 2026-09-16, y hay que contar los dos.** El **alta de IV-11** —la
divergencia `orden_venta`/`salesorder_id` por sincronización, encontrada al barrer las vías de escritura
de la orden de venta— la registró la propuesta de `tercera-puerta-orden-venta`, y llevó el encabezado de
cuatro a **cinco**. Ese mismo cambio, en su intento R1 (commit `79cf09b`), cerró **IV-4** —la tercera
puerta de «una OV, un ticket»—, y la **baja de IV-4** devuelve el encabezado a **cuatro**:
`valoresTransicion.ts`, `ticketService.ts:39` (clientId), `por-entregar-es-espera` (color) e IV-11.
Contar sólo el alta dejaría este párrafo afirmando un «quinto» que ya no existe; contar sólo la baja
perdería por qué el encabezado llegó a decir cinco.

**Y un tercer movimiento, el 2026-09-17, que devuelve el encabezado a CINCO.** El **alta de IV-12** —el
alta de remisión no cumple, en dos puntos, el orden total de precedencia que F1B-10 declara— la
registró la propuesta de `orden-precedencia-guardas`, y la registra **sin destino**, como IV-9 e IV-11.
Los cinco de hoy son: `valoresTransicion.ts`, `ticketService.ts:39` (clientId), `por-entregar-es-espera`
(color), IV-11 e IV-12. **Este párrafo se actualiza, no se reescribe**: la narración de 2026-09-16 sigue
siendo cierta de su fecha, y renumerarla o refundirla la volvería falsa sobre sí misma — es el Caso B de
la regla de mutación 4 aplicado al propio recuento.

**Y un cuarto movimiento, el 2026-09-21, que devuelve el encabezado a CUATRO.** La **baja de IV-2** —la
regla de dominio de `valoresTransicion.ts` sólo en cliente— la cerró F1A-07 (`fechas-derivadas-servidor`):
el servidor impone las tres fechas derivadas y el cliente pasa a comodidad probada. Los cuatro de hoy
son: `ticketService.ts:39` (clientId), `por-entregar-es-espera` (color), IV-11 e IV-12. Las narraciones de
2026-09-16 y 2026-09-17 quedan intactas, por la misma razón de siempre: son ciertas de su fecha.

> **⚠️ REGLA: un destino es una promesa, y hay que barrerla al cerrar la épica.** Cuando una épica se
> cierra, **compruébese si algún desvío la nombraba** y reasígnese en el mismo acto. Al cerrar F1A los
> **cuatro** desvíos seguían apuntando a «F1A»: quedaron sin dueño mientras este fichero seguía
> diciendo que lo tenían, y eso se carga en cada sesión y en cada sub-agente como si fuera cierto. Un
> destino que nombra una épica cerrada no es un destino. **Que lo cace el cierre, no el turno
> siguiente.** *(Barrido hecho el 2026-09-09.)*

| Regla | Incumplimiento | Destino |
|---|---|---|
| — | `apps/desk/server/services/ticketService.ts:39` — al completar `clientId` desde la orden de venta (`clientId = clientId ?? ov.clientId ?? null`), si el cuerpo YA trae su propio `clientId`, el de la OV nunca se contrasta con nada: un ticket puede quedar con cliente y equipo de un lado y la orden de venta de otro, sin ningún aviso. La guarda equipo↔cliente de `cerrar-hallazgos-revision-f1b-01` (P1, `:59-71`) compara el `clientId` final contra `equipo.clientId`, no contra `ov.clientId`, así que esta pareja queda fuera de su alcance a propósito (`proposal.md` §3) | **PUNTO ABIERTO, sin destino** — a propósito, criterio de aceptación nº 8 de `cerrar-hallazgos-revision-f1b-01`. ⚠️ **SIGUE VIVO, y su razón ha cambiado DOS veces.** La primera —«esperar a que Gerencia resuelva nº 52»— caducó el 2026-09-10: nº 52 está decidido, y resuelve **CARDINALIDAD, no TITULARIDAD** (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:178-181`). La segunda —«la titularidad sigue sin decidir»— **caducó el 2026-09-17**, y esta fila la arrastró hasta el 2026-09-21: `decision/titularidad-ov-equipo` (`openspec/config.yaml:1485-1502`) responde que la OV y el equipo **SÍ pueden ser de clientes distintos**, como excepción, en el caso del **mantenedor**; la ficha de IV-8 lo recoge en `titularidad_decidida_2026_09_17` (`openspec/config.yaml:832-837`). Lo que lo mantiene abierto HOY es que **el código no conoce la figura del mantenedor** —`grep -rni mantenedor packages/ apps/ --include=*.ts` da **0**—, y cómo la reconoce la aplicación está devuelta como pregunta abierta de Gerencia (`titularidad-mantenedor`). Destino **PROPUESTO F1B-11** hasta el 2026-09-21, en que Gerencia respondió esa pregunta (`decision/titularidad-mantenedor`, recogida el 2026-09-22): el mantenedor se apunta en la hoja de vida del equipo y sólo él puede pagar órdenes de ese equipo; cualquier otra discrepancia se bloquea. **DESTINO ESCRITO: F1B-11.** El campo de la hoja de vida cae en el contenido de F1B-02 (S39) y ahí el destino sigue **propuesto**, no escrito. **No usar nº 52 para justificar tocar la guarda equipo↔cliente** (`ticketService.ts:59-77`): sigue siendo cierto, y ahora con MÁS razón —una guarda estricta «cliente de la OV = cliente del equipo» bloquearía justo el caso del mantenedor— |
| 1 | **REDUCIDO por `por-entregar-es-espera` (2026-09-12).** Era el mismo desvío que IV-1, en tres puntos; ahora sobreviven **dos**, y los dos son para COLOR. `ClienteDetalle.tsx:18` —el que CLASIFICABA— pasó a consumir el predicado compartido `apps/desk/src/lib/enEspera.ts` y ya no cuenta aquí. Sobreviven `ClienteDetalle.tsx:22` (`/espera/i`, color del badge) y `apps/desk/src/components/TicketDetailView.tsx:245` (`/espera\|hold/i`, color del `className`), decisión de Gerencia Q1: `Por Entregar` no es un atasco y el tablero ya lo pinta azul (`TicketCard.tsx:21`). Ninguna de las dos lee `ESTADOS_EN_ESPERA` (`estados.ts:120`). **Remedido el 2026-09-12 contra los ONCE `en_espera` de hoy: siguen acertando 2** —`En Espera de Repuestos` y `En espera de SKU inventario`, el numerador no cambia porque ninguno de los dos estados reclasificados contiene «espera» ni «hold»— **y se les escapan NUEVE**: los siete de antes más `Por Entregar` y `Por Entregar / Sin facturar`, deliberadamente —Gerencia decidió que esos dos no pintan ámbar—. Es defecto **por defecto**, no por exceso, pero ya sólo afecta al color: la mitad de clasificación la cerró esta misma tanda. ⚠️ Los dos ficheros son `.tsx` y quedan **fuera de la red de pruebas** por decisión de Gerencia (`vitest.config.ts:16`, `:17-20`, `:57`; F0-00), así que **no admiten rojo previo bajo `strict_tdd`**, y esta vez arreglarlos con la lista **sería el defecto**: es justo lo que Q1 rechazó. Sigue siendo el molde de **H5** —dos implementaciones de la misma noción, ninguna rota por separado—, y las cuatro reglas de mutación no lo cazan | **SIN DESTINO ASIGNADO**, y se dice a propósito: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A. Que lo asigne quien decida el alcance — el arreglo de verdad es una sola fuente de color (`TicketCard.tsx:14`), no sustituir la regex por el registro. Todo lo que esa decisión necesita —las dos ubicaciones, la medición y el condicionante de las pruebas— está en `openspec/config.yaml` (IV-9) |
| — | **La sincronización DESASOCIA la orden de venta a medias, y deja la fila diciendo dos cosas.** Registrado el 2026-09-16 por `tercera-puerta-orden-venta`, que lo encontró barriendo las vías de escritura. **Las dos mitades:** `orden_venta` (`packages/zoho-sync/src/db/repo.ts:48`) y `fecha_orden_venta` (`:50`) están en `TICKET_COLS` (`:44-54`), así que el sync las reescribe; **`salesorder_id` está FUERA de esa lista**, porque se añadió después por `ALTER` (`packages/zoho-sync/src/db/schema.sql:187`), así que sobrevive. **La cadena:** `upsertTicket` (`repo.ts:56-68`) sólo se abstiene cuando `managed_by_app === true` (`:58-59`); el `UPDATE` de `apps/desk/server/routes/remision.ts:218-240` **no** pone esa bandera, mientras `applyTransition` sí (`repo.ts:271`); y el sync corre cada **180000 ms** por defecto (`packages/zoho-sync/src/config.ts:88`). Un ticket venido de Zoho al que la remisión le escribe la orden queda coherente sólo hasta la siguiente pasada que lo alcance. **Afecta TAMBIÉN a la puerta 2**, que comprueba **sólo por número** (`apps/desk/server/services/ticketService.ts:148`): si el sync vacía `orden_venta` y `salesorder_id` sobrevive, la puerta 2 tampoco encuentra ese ticket — la puerta 1 y la tercera sí, porque miran las dos vías, y por eso las dos vías son **requisito** de la tercera puerta y no preferencia. **Medición de Gerencia en producción del 2026-09-16: divergencia 0 sobre población 1 — y con población 1, un 0 no dice que no ocurra.** La remedición natural cae en **F1F-03** (`plan:221`, aceptación con servicios reales), que no es un destino: es dónde volvería a verse. Es el molde de **H5** —dos implementaciones de la misma noción, ninguna rota por separado—, y las cuatro reglas de mutación no lo cazan | **SIN DESTINO ASIGNADO**, y se dice a propósito: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A. Que lo asigne quien decida el alcance. Las dos salidas conocidas —que el escritor de la remisión ponga `managed_by_app`, o que `salesorder_id` entre en `TICKET_COLS` para que las dos mitades se borren juntas— **no son equivalentes y ninguna está decidida**. Todo lo que esa decisión necesita está en `openspec/config.yaml` (IV-11). **DECIDIDO el 2026-09-21, recogido el 2026-09-22** (`decision/e005-iv4-iv11`): ninguna de las dos salidas; **opción (c)** — si la orden de venta se eligió en la aplicación manda la aplicación, y el sincronizador no pisa `orden_venta` ni `fecha_orden_venta`; si no, manda Zoho. **DESTINO ESCRITO: F1B-11, con un parche antes**, cuyo vehículo en el plan está por decidir. Ojo: hoy no existe marca POR FILA de «elegida en la aplicación» —`managed_by_app` es del ticket entero—, y eso es diseño de la tanda |
| — | **El alta de remisión no cumple el orden único de precedencia, y son DOS puntos.** Registrado el 2026-09-17 por `orden-precedencia-guardas` (F1B-10), la tanda que declara ese orden como **orden total** sobre cuatro escalones —**A** existencia < **B** estado y permiso < **C** contenido < **D** unicidad— y lo aplica a las dos puertas del motor. **Los dos, medidos línea a línea:** (1) **C antes que A** — `apps/desk/server/routes/remision.ts:127` («Fecha inválida», validez de contenido) corre **ANTES** de `:155` («Falta el serial del equipo», existencia del sujeto); (2) **A después de C** — `apps/desk/server/routes/remision.ts:220` («Orden de venta no encontrada») corre **DESPUÉS** de `:127` y de `:197` («Ítems fuera del checklist»), los dos escalón C. **Los dos son OBSERVABLES:** una fecha mala sobre un ticket sin serial activa `:127` y `:155` a la vez y el usuario ve la de C — se le pide corregir la fecha cuando lo que va a bloquearle es el serial. **Ninguno de los dos depende** de cómo se clasifique el `409` de remisión pendiente (`:177`), que las obs. #700 y #707 fijan en **D**; y de mantenerlo en D se deduce **además** que ese `409` precede también a `:197` (C) y a `:220` (A) — se anota para que quien lo arregle no crea que bastan dos movimientos. **Lo que SÍ cumple, y por eso no se toca:** el `422` del serial (`:155`, A) gana al `409` pendiente (`:177`, D) **porque A precede a D**, así que el precedente de F1B-01 pasa a ser **consecuencia** del orden total en vez de excepción declarada, y `apps/desk/server/remisiones.test.ts:957` queda intacta. **Ninguna de las cuatro reglas de mutación lo caza**, y la razón importa: una prueba de posición fija un **PAR** de guardas, y aquí lo que falla es el orden del **CONJUNTO** — las ocho guardas del alta están probadas por pares donde hace falta y aun así la puerta incumple | **SIN DESTINO ASIGNADO**, y se dice a propósito: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A. **F1B-10 NO lo corrige:** P1 (obs. #690) mantiene el alta de remisión sin cambios y la obs. #707 lo confirma al desbloquear la tanda — mover guardas ahí reabriría el precedente que F1B-01 fijó a propósito, sin una decisión que lo pida, y tocar `remision.ts` activaría el barrido de la regla de mutación 4 sobre un tercer fichero muy citado. Que lo asigne quien decida el alcance; y antes hay algo **no técnico** que decidir, porque reordenar el alta cambia **qué error ve el técnico** en el formulario de entrada, que es la pantalla de campo del subsistema. Todo lo que esa decisión necesita está en `openspec/config.yaml` (IV-12) |

**IV-1 está CERRADO EN `boardView.ts` y ya no cuenta ahí — pero el defecto no está cerrado, y esa
distinción es toda la entrada.** Era la clasificación de esperas por regex de
`apps/desk/src/lib/boardView.ts:35`. F1B-08 (`vista-todos-y-estados-en-espera`) lo cerró: `:2` importa
`ESTADOS_EN_ESPERA` de `@ambientalia/shared` y `:39` lo consume, así que las vistas `abiertos` (`:47`)
y `espera` (`:48`) leen hoy el registro y no el nombre del estado. **Lo que esa tanda no tocó son las
otras tres implementaciones del mismo predicado**, que están arriba como fila viva: cerrar IV-1 sin
abrirla habría perdido a los tres supervivientes. Se deja escrito aquí para que nadie lo vuelva a
anotar como vivo — ni, al revés, dé el asunto por resuelto.

**IV-2 está CERRADO y ya no cuenta.** Era la regla de dominio sólo en cliente de `valoresTransicion.ts`
(bloque de cabecera `:3-17`, implementada en `valoresConocidos`). F1A-07 (`fechas-derivadas-servidor`) lo
cerró: el servidor impone las tres fechas derivadas en `packages/shared/src/fechasDerivadas.ts` y las
aplica en `ticketService.ts:130`/`:132` vía `valoresConFechasDerivadas`, con los criterios 1-5, P-a, P-b
y las cinco mutaciones de A.5 en verde; el cliente pasa a consumir la MISMA fórmula compartida, comodidad
probada bajo la regla invariable 13, punto 3. Se deja escrito aquí para que nadie lo vuelva a anotar
como vivo.

**IV-3 está CERRADO y ya no cuenta.** Era el espejo de `canExecuteTransition` en
`apps/desk/src/components/TransitionPanel.tsx:56-58`. F0-04 lo cerró:
`apps/desk/server/permisos.test.ts:41-110` barre las 34 transiciones × 3 áreas contra el servidor, y
`:35-39` declara el efecto —el filtro del navegador pasa a ser **comodidad legítima** bajo la regla
invariable 13, porque la imposición del servidor está probada—. Se deja escrito aquí para que nadie lo
vuelva a anotar como vivo.

**IV-4 está CERRADO y ya no cuenta.** Era la tercera puerta de «una OV, un ticket» sin comprobar,
`apps/desk/server/routes/remision.ts:218-240` (bloque de la orden de venta). `tercera-puerta-orden-venta`
lo cerró: la guarda llama a `ticketConOrdenVenta` tras el `422` «Orden de venta no encontrada» y antes
del `UPDATE`, fijada por `RQ-RE-16` (`openspec/specs/remisiones/spec.md`). Lo prueban el ex-`it.fails`
de `ordenVentaUnTicket.test.ts` (hoy en positivo, con `409`) y la prueba de posición de
`remisiones.test.ts` que valida el ORDEN, no sólo la condición (regla de mutación 1 de este mismo
fichero). Se deja escrito aquí para que nadie lo vuelva a anotar como vivo.

**IV-5 está CERRADO y tampoco cuenta.** Era el mapa de colores muerto de
`apps/desk/src/components/TicketCard.tsx:14-23`, con claves en mayúsculas que sólo casaban con
`mockData.ts`. F1B-08 lo cerró reclavando `statusColorMap` a los nombres reales de los estados y
retirando el campo `label`: el lookup de `:26` ya casa con datos reales y `bg-slate-100` vuelve a ser
el respaldo en vez del único resultado. Sigue siendo cosmético, como decía su ficha. Se deja escrito
aquí para que nadie lo vuelva a anotar como vivo.

**IV-6 está CERRADO y tampoco cuenta.** Eran las `ALTER TABLE` sin calificar de
`packages/zoho-sync/src/db/schema.sql`. F1B-01 lo cerró extendiendo el guardián a `^ALTER TABLE`
(`migrate.test.ts`, `altersDelEsquema()` + tres pruebas) **y calificando 13 sentencias, no 23**: las
de `public`, porque extender el guardián sin tocar el `.sql` lo dejaba rojo para siempre; las 11 de
`DESK_TABLES` siguen sin calificar, que es lo correcto. Detalle en
`docs/sdd/F1B-01_Serial_llave_de_entrada.md` §4.

**IV-7 está CERRADO y tampoco cuenta.** Era la vista «todos» de `boardView.ts:49-50`, que ocultaba los
cerrados y compartía cuerpo con la rama `default`. F1B-08 lo cerró en sus **dos** mitades, que hacían
falta las dos: `:53` es hoy `case 'todos': return tickets`, sin filtro —opción (b) de
`decision/vista-todos-tablero`, decidida por Gerencia el 2026-09-10—, y `:54` es
`default: return vistaNoReconocida(key)`, separado, con la guarda de `:59` tipada `never`, de modo que
olvidar el `case` de una vista nueva pasa a ser error de compilación en vez de un filtro silencioso.
Se deja escrito aquí para que nadie lo vuelva a anotar como vivo.

**IV-10 está CERRADO y tampoco cuenta.** Era la línea base de citas `ruta:línea` ya rotas que el detector de
`hook-citas-pre-push` genera en `apps/desk/server/citas/lineaBase.jsonl` para imponerse en `pre-push`. La cerró
la reparación por bloques que decidió Gerencia el 2026-09-15 (P.2 de `hook-citas-pre-push`), como trabajo
documental directo y aprobada bloque a bloque: la base bajó de **37** entradas (28 claves, medida el
2026-09-14 sobre `73a9acb`) a **23** con B1 (`37d6e71`), a **13** con B2 (`e982672`), a **7** con B3
(`334142b`) y a **0** con B4 (`23b2349`), todo el 2026-09-15. El fichero se queda, vacío: la base sólo encoge
y no crece desde el hook, así que una cita rota nueva bloquea siempre, y saltarse el hook con `--no-verify`
sigue sin ser una salida legítima. El detalle fila a fila está en
`docs/sdd/Triaje_Linea_Base_Citas_2026-09-15.md`. **Lo que NO se cerró con IV-10 — y está CERRADO desde el
2026-09-15 por la tanda `detector-citas-extremos`.** Eran dos: (1) el detector sólo comprobaba que el extremo
INICIAL no cayera en línea vacía, no el final (`apps/desk/server/citas/detector.ts:109-115` en `d2a89e9`); y
(2) una abreviada detrás de una cita anclada se atribuía a su fichero pero se leía contra el sha local, no
contra el ancla (`apps/desk/server/citas/detector.ts:174-176` en `d2a89e9`, y la lectura de la línea 195 de
ese mismo fichero), lo que daba abreviadas rotas informativas que eran falsos positivos y alguna comprobada
por casualidad. Los cerró `9ed0254`: `rotura()` gana una cuarta rama para el final vacío, la abreviada se lee
en su ancla —propia o heredada de la última completa válida de su misma línea física— y su motivo nombra la
revisión y el extremo que falla. *Medido en el árbol real al implementarlo:* las abreviadas rotas bajan de 16
a 11 —cinco eran falsos positivos por leerse en el sha local— y la cuarta rama cazó en su primer barrido una
cita rota que el detector viejo daba por buena. Se deja escrito aquí para que nadie lo vuelva a anotar como
vivo. **Lo que sí sigue vivo es otra cosa**, y no la cierra esa tanda: el patrón que reconoce un ancla
(`apps/desk/server/citas/cosecha.ts:60` en `d2a89e9`) acepta **cualquier palabra** como revisión, así que un
nombre de función detrás de «en» se lee como ancla.

> **La lección de método, que vale más que las entradas cerradas de arriba.** Este fichero y `openspec/config.yaml`
> **pueden estar caducos**: los dos daban IV-3 por vivo cuando F0-04 llevaba días habiéndolo cerrado.
> Antes de citar cualquiera de los dos como autoridad sobre el estado del código, **compruébalo contra
> el código**. Es la regla de método aplicada a los propios registros del proyecto.

---

## Reconciliación y bandeja de entrada (F0-05, 17/09/2026)

Mecanismo completo: `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md`. Tres reglas.

**R-1 · Cabecera obligatoria del proposal, con SIETE campos.** Todo `openspec/changes/<nombre>/proposal.md`
empieza con este YAML, antes de cualquier prosa:

    ---
    tanda: F1A-08                 # ID del §5 del plan, o el literal `fuera-del-plan`
    motivo: ""                    # obligatorio y NO vacío si tanda es `fuera-del-plan`
    capacidad: [remisiones, tickets-core]
    maestro: ["M4.4", "nº 52"]    # pasajes que lo justifican; [] si ninguno
    cierra: si                    # si | no — ¿deja la fila TERMINADA, o sólo avanza una parte?
    toca_maestro: si              # si | no — ¿queda el maestro desactualizado al terminar?
    origen_cabecera: declarada    # declarada (la escribe quien hace el trabajo) | derivada-<fecha>
    ---

Un trabajo que realiza el contenido de una fila del §5 **LLEVA SU ID**, aunque la carpeta se llame de
otra manera. Si no lo lleva, es trabajo fuera del denominador de avance y tiene que declararlo con
motivo escrito. Respaldo: **decisión de Gerencia del 2026-09-17**, `decision/tanda-por-contenido`
(E-001 de `docs/sdd/ENTRADA.md`). Precedentes que la regla cierra: `tercera-puerta-orden-venta` ES
F1A-08 y no lo decía; `citas-verificables` nació como capacidad entera sin fila y sin entrada en
`capabilities`.

**`cierra` no es decorativo, y es lo que separa dos cosas que no son la misma.** Llevar el ID de una
fila y cerrarla son afirmaciones distintas: `vista-todos-y-estados-en-espera` hace contenido de
F1B-08 y NO la termina. El numerador del avance cuenta sólo los `cierra: si`.

**La cabecera la escribe quien hace el trabajo, así que se declara y no se da por probada.** El
`verify: pass` demuestra que el cambio cumplió su propio `tasks.md`, no lo que pide la fila del plan
—son dos documentos y nadie los enfrenta—. Por eso el `archive-report.md` de todo cambio con `tanda:`
dice en UNA línea qué parte del contenido de esa fila cubrió y qué dejó fuera; es lo que sostiene el
`cierra`, y lo que el barrido contrasta.

**R-2 · Toda capacidad nueva se declara.** Si un cambio crea `openspec/specs/<nombre>/spec.md`, en el
MISMO cambio se añade `<nombre>` a `openspec/config.yaml → capabilities`. Una spec que no está en
`capabilities` no la carga el preflight: existe y es invisible.

**R-3 · La bandeja tiene tres salidas y ninguna más.** Las ideas, correcciones y hallazgos entran por
`docs/sdd/ENTRADA.md`. Toda entrada acaba en EXACTAMENTE UNO de tres sitios: una fila del §5 del
plan, un punto abierto del Anexo D con dueño y fecha, o un pasaje del expediente R08.x. Si no cabe en
ninguno, hay una decisión de alcance pendiente y se queda como punto abierto CON DUEÑO — nunca en el
aire. No se inventa destino: asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al
cerrar F1A.

**R-4 · Un cambio lleva UN SOLO `tanda:`. No existe «cuenta en parte».** Gerencia, 2026-09-24, panel
(`decision/e001-por-entregar`): «no existe "cuenta en parte"; cada cambio lleva un único ID de tanda o
`fuera-del-plan` con motivo». `cierra:` dice si la fila TERMINA; R-4 dice que el `tanda:` es ÚNICO y
excluyente. Llevar `tanda: X` con `cierra: no` NO es contar en parte: es trabajo de esa fila que no la
cierra, y es lo que Gerencia eligió el 23/09 para el parche de F1B-11. Lo que no vale es repartir un
cambio entre dos filas.

**R-5 · Si un cambio toca `openspec/specs/`, lleva ficha. Si no, puede ir directo y el barrido lo lista.**
Gerencia, 2026-09-23, panel (`decision/trabajo-sin-ficha`). La regla se apoya en una comprobación, no en
la disciplina: `npm run reconcile` lista los commits de `main` que tocan `apps/` o `packages/` y que
ninguna ficha reclama, y el parte de cada corte los enseña. **Esa comprobación todavía no existe**
(E-060), así que hasta que se construya la regla está escrita y no se hace cumplir sola.

**R-6 · Una ficha del panel que describe lo que se verá lleva la marca «Aún no construido» mientras la tanda
no esté terminada.** Gerencia, 2026-09-24, panel (dentro de la idea `25i881jbkytb1kqj0wqb`): las fichas del apartado 02
describen lo que se podrá ver **cuando la tanda esté construida**, y sin la marca se leen como si ya estuviera en la
aplicación. La marca va junto a «Qué se podrá ver», visible, en toda ficha cuyo estado no sea cerrado. Es regla de
redacción del panel, y la aplica la sesión de supervisión en cada corte.

**Y la bandeja NO ES FUENTE.** `ENTRADA.md` guarda la traza de por dónde entró cada cosa; nadie la
carga al arrancar, y mencionarla aquí no la carga. La DECISIÓN vive en `openspec/config.yaml` →
`decisiones_de_gerencia`, con su respuesta textual, y si es un gate además en su fila de la tabla
§4.5 del plan. Toda respuesta de Gerencia aterriza en un fichero que la sesión CARGA, sea gate o
no. Una decisión que sólo esté en la bandeja no ha llegado: trátala como pendiente y dilo.

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

> `gentle-ai sdd-attempt` mide `changed_lines` diffeando el árbol entre el principio y el final del
> intento, no el cambio. Dos tandas SDD corriendo a la vez sobre el mismo working tree se imputan las
> líneas la una a la otra. Si hacen falta dos en paralelo, van en **worktrees aislados**, uno por cambio.
>
> **Y no cuenta todo el árbol: tiene TRES desvíos medidos — dos que cuentan de MENOS y uno que cuenta
> de MÁS.** (1) Lo nuevo sin trackear no cuenta: el intento 1 de `hook-citas-pre-push` registró 55 con
> 928 líneas nuevas sin trackear, y el corte 1b-i registró 238 frente a 529 con git porque 291 eran
> ficheros nuevos. (2) Un fichero que era binario para git en el árbol de partida cuenta 0: el intento 2
> registró 144 frente a 247 trackeadas, y las 103 que faltaban eran de `detector.ts`, que en `ef08129`
> llevaba un NUL. Con todo trackeado y sin binarios (corte 1b-ii) contó 843, lo mismo que git.
> (3) **Y el que cuenta de MÁS: el ledger mide SIN detección de renombrado.** Probado por ejecución el
> 2026-09-16 en el `sdd-archive` de `detector-citas-extremos`: contra el MISMO par de árboles,
> `git diff --shortstat` da **440** y `git diff --shortstat --no-renames` da **4.502**, y el ledger
> registró **4.502**. O sea que **un `git mv` cuesta el DOBLE de las líneas movidas** —una vez borradas
> y otra insertadas—, aunque git las marque `R100` y no cambie un byte. **Un `sdd-archive` cuesta dos
> veces el tamaño de la carpeta, más la fusión del delta y el `archive-report`.** **La medida real es
> `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.**

*Por qué existe:* el 2026-09-10 se lanzó el `sdd-archive` de `reasignar-desvios-huerfanos` y el
`sdd-apply` de `mensaje-422-cliente-duplicado` al mismo tiempo sobre `C:\dev\Desk_2_R1.023`. El
`settle` del segundo devolvió `blocked(maintainer_decision)` con **`changed_lines: 1718` contra un
presupuesto de 800** — y las suyas eran **73** (`ticketService.ts` +9/-3, `ticketService.test.ts`
+56/-5: 65 inserciones y 8 borrados, `git diff --shortstat e09fb0d c4fc97d -- apps/desk/server/services/`).
Las otras ~1.645 eran el `verify-report.md` (+206) y el `archive-report.md` (+125) de la
primera y sus fusiones en `openspec/specs/`. El diff de los dos árboles del propio intento lo enseña
en una línea.

*El precedente del archive, que es lo que fija el tamaño del presupuesto:* el `sdd-archive` de
`detector-citas-extremos` movió siete artefactos de 2.031 líneas. Con el techo de **800** del preflight
se habría pasado **5,6 veces**; Gerencia aprobó **5.000** el 2026-09-16 y quedaron **498** de margen.
La justificación que hace legítimo pedir tanto no es el tamaño, es que **4.062 de esas 4.502 líneas son
un `git mv` verbatim cuya carga de revisión es CERO**: el contenido realmente revisable eran 440.

*Y la lección de estimación, que costó un `reset`:* **en un objetivo que incluya `verify` o `archive`,
el informe que esa fase GENERA es un sumando obligatorio, no un extra.** La remediación de esa misma
tanda presupuestó ~510 y gastó **946** contra un techo de 800, y la diferencia era el `verify-report.md`
que el propio verify escribe: **358 líneas**. El `archive-report.md` de esa tanda fueron **264** (los
cinco precedentes reales miden 110, 125, 148, 181 y 240). **La fusión del delta NO se estima, se mide:**
estimarla por tamaño de bloque —300 líneas nuevas menos 136 viejas— daba 436, y el coste real fue
**176**, porque git casa las muchas líneas idénticas entre el requisito vivo y su versión del delta.
Hacer la fusión en un worktree y medirla cuesta un minuto.

*Lo que cuesta, y por eso no es un detalle:* desbloquearlo exige `gentle-ai sdd-attempt reset`, que la
herramienta **reserva a un mantenedor y nunca hace sola**. O sea que un descuido de paralelismo del
agente **para la tanda y necesita a una persona** para arrancar otra vez. Ganar diez minutos de reloj
cuesta un turno entero.
