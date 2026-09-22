# F1A-05 — Auditoría de blueprint tras las correcciones (`audit-F1A`)

| Dato | Valor |
|---|---|
| Tanda | `F1A-05`, fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:142` en `a5da6b8`; **hoy `:144`** |
| Fuente | `M11.6` del maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:2713`) |
| Commit auditado | `e8c5e90` (rama `main`). **Las citas de línea al plan (`plan:NNN` y `…ClaudeCode_R01.1.md:NNN`) de este documento se leen contra el plan en `a5da6b8` (539 líneas), NO contra el de hoy** (caso B/C de la regla de mutación 4 de `CLAUDE.md`): el plan creció a 598 líneas el 2026-09-17 al sincronizarse con el libro R01.3, y renumerarlas volvería falsas las frases que citan texto ya corregido. |
| Fecha | 2026-09-09 |
| Gate declarado en el plan | «—». La raya no es «ninguno»: nadie la rellenó. §0 la resuelve |

---

## 0 · Alcance: qué audita esta tanda, y por qué NO está bloqueada por C12

**La pregunta.** F1A cerró tres de sus cuatro correcciones —C1 (`ec0ed1f`), C11 (`6ea3ca8`,
`5218d11`) y C9 (`e8c5e90`)—. **C12 no**: F1A-03 está parada esperando a Gustavo/Calidad
(`docs/sdd/F1A-03_Agenda_P38_Verificacion.md`). Una «auditoría tras las correcciones» con una de las
cuatro sin hacer audita un estado intermedio, así que hay que decidir si se hace o se espera.

**La respuesta, con la línea del maestro.** `R08.1.md:2713` define la auditoría de blueprint así:

> «La lectura del código del flujo con IA —adoptada como herramienta de mejora continua el 20/08— es
> la que produjo la revisión R04 de este documento: detectó los cuatro estados sin salida, el ciclo
> reentrante, la ausencia de anulación y la guarda que no bloquea. **Conviene repetirla en cada hito
> del desarrollo**, y extenderla a los flujos de equipo nuevo y soporte remoto en cuanto estén
> implementados.»

**«Repetirla en cada hito» es una pasada periódica, no un gate que cierre la épica.** El maestro no
la condiciona a que estén hechas todas las correcciones de una épica; la condiciona a que haya un
hito. Tres correcciones que tocan el motor de transiciones son un hito.

→ **F1A-05 audita las TRES cerradas y declara C12 fuera.** No está bloqueada. Lo que queda fuera
queda escrito en §6.

**Y una segunda corrección al §0, que también es respuesta: la talla S es falsa.**

`plan:388` declara que `docs/artefactos/blueprintserviciotecnico.html` «se regenera en cada tanda
`audit-*`», y la fila `:142` hereda esa premisa para calcular la talla. **La premisa es falsa y ya
estaba registrada como falsa**: `docs/artefactos/NOTA.md:34-46` en `43821b8` lo verificó sobre el commit `a3a8f03`
—cero referencias a `blueprintserviciotecnico` en `apps/`, `packages/`, `scripts/` y `package.json`—
y concluye que las tandas `audit-*` tienen que **CONSTRUIR el generador, no invocarlo** (conclusión en `docs/artefactos/NOTA.md:55-56` en `43821b8`, corregida por c45bcb1). Se confirma
hoy sobre `e8c5e90`: `scripts/` contiene un solo fichero, `docx2md.sh`.

→ **Esta auditoría NO regenera el artefacto** y no reclama haberlo hecho. Construir el generador es
trabajo de otra talla y otro alcance, y sigue debiéndose. Registrado también en
`openspec/config.yaml:807-838` en `648432d`, la entrada `PF-1` de `premisas_falsas_corregidas`
(la tanda `hook-citas-pre-push` inserta `IV-10` justo delante y desplaza la entrada; caso B de la
regla de mutación 4 de `CLAUDE.md`, auditoría fechada al commit `e8c5e90`).

---

## 1 · Los cuatro hallazgos de la R04, con su estado hoy

| # | Hallazgo de la R04 (`:2713`) | Estado a `e8c5e90` | Evidencia | Dueño |
|---|---|---|---|---|
| 1 | **La guarda que no bloquea** | **CERRADO**, y sigue cerrado | `apps/desk/server/transitionExec.ts:76-77` — `const faltaObligatorio = f.kind === 'checkbox' ? asBool(raw) !== true : empty`, y va **antes** del bloque del checkbox (`:78-84`), que es la mitad del arreglo. Probado en `transitionExec.test.ts:83`, `:90-133` | C1 · F1A-01 (`ec0ed1f`) |
| 2 | **Los cuatro estados sin salida** | **SIGUEN**, los cuatro | `packages/shared/src/estados.ts:151-160` — `En Espera de Repuestos`, `Solicitado`, `Servicio externo`, `En espera de SKU inventario`. F1A no los tocó | C3 · **F1C-03** (`plan:168`), bloqueada por la decisión `decision/c3-salida-esperas` (`plan:356`) |
| 3 | **El ciclo reentrante** | **SIGUE**, y son exactamente los mismos diez campos | `packages/shared/src/invariantesGrafo.test.ts:137-149` — la lista no ha crecido ni menguado. El campo nuevo de F1A-04 **no** entró en ella, y eso está probado donde se añadió (`bodegaje.test.ts:111-116`) | C4 · **F1C-02** (`plan:167`) y F1C-06 |
| 4 | **La anulación** | **SIN CONSTRUIR** | No existe ningún estado `Anulado` en `packages/shared/src/estados.ts`. No hay transición ni motivo tipificado | C2 · **F1C-01** (`plan:166`), bloqueada por **P32** |

**Lectura.** F1A movió **uno** de los cuatro. Los otros tres son épica 1C y ninguno estaba en el
alcance de 1A, así que no es un incumplimiento: es el reparto que el plan ya declaraba. Lo que esta
auditoría añade es que **están medidos**, no supuestos.

---

## 2 · La columna 58: el `alcance: null` SIGUE SIENDO CIERTO, y no por lo que parecía

**La circularidad, confirmada.** `packages/shared/src/reentrancia.ts:82` declara la columna 58
—«Tiempo de orden de compra»— con campos `['Fecha Orden de Compra', 'Fecha de Cotización']` y
`alcance: null`, es decir, **rota por reentrancia y sin dueño**. Y `R08.1.md:1697` define el bodegaje
de proceso como `Fecha Orden de Compra − Fecha de Cotización`: **los mismos dos campos**. El módulo
que F1A-04 acaba de construir se calcula sobre el par exacto que F0-04 declaró roto y huérfano.

**La pregunta era si F1A-04 le dio dueño sin que nadie lo escribiera. La respuesta es NO, y hay que
separar dos cosas que se parecen:**

**(a) La mitad de reentrancia sí quedó neutralizada.** `bodegaje.ts` lee `ticket_transitions`, no
`tickets.*` (`packages/shared/src/bodegaje.ts:8-18`), que es exactamente la regla que F0-04 dejó
escrita en `reentrancia.ts:24`. Un ticket que da dos vueltas al ciclo de cotización produce **dos**
bodegajes de proceso, y está probado (`bodegaje.test.ts:127`). Por columna saldría uno.

**(b) Pero la columna 58 tiene un SEGUNDO defecto que leer el historial no arregla, y es el que
manda.** `Fecha Orden de Compra` la escribe **una sola transición**: `aprobacion_y_repuestos`
(`packages/shared/src/transitions.ts:199`). La otra rama de aprobación —`aprobacion`, la que no pide
repuestos— escribe «Fecha Orden de Compra **Final**», y además **opcional**
(`transitions.ts:202-203`). Está documentado desde F0-04 en `reentrancia.test.ts:118-140`.

**Consecuencia medida sobre el código que acaba de entrar:** para un ticket aprobado **sin
repuestos**, el bodegaje de proceso **no vale cero, no existe**. La regla 3 del recorrido
(`bodegaje.ts:162-164`) no cierra un periodo abierto con la fecha de consulta, así que el periodo
se queda corriendo y no entra en la lista. Y leer el historial no lo salva: **el valor nunca se
escribió bajo esa etiqueta, en ninguna fila**. La reentrancia pisa un valor que está en otro sitio;
esto no escribe ninguno.

→ **`alcance: null` en `reentrancia.ts:82` es correcto y no hay que tocarlo.** F1A-04 no le dio dueño
a la columna 58: le dio implementación a la **magnitud** de M1.10, que es otro objeto. El dueño de la
mitad que queda es **F1C-02** (`plan:167`).

**Lo que esta auditoría sí cambió: la rama que no funciona no tenía ni una línea que lo dijera.** Las
doce pruebas de recorrido de `bodegaje.test.ts` usan **todas** `aprobacion_y_repuestos`. Se añaden
dos pruebas (`bodegaje.test.ts`, nº 19 y nº 20) que fijan el hallazgo donde se rompe: la rama sin
repuestos no produce periodo de proceso, y «Fecha Orden de Compra» tiene un solo escritor. El día que
F1C-02 le dé un segundo, la nº 20 se pone roja **al lado del arreglo**.

---

## 3 · Construido y NO cableado — una categoría distinta de «pendiente»

`packages/shared/src/bodegaje.ts` (236 líneas, 21 pruebas) está **exportado** desde
`packages/shared/src/index.ts:6` y **nadie lo consume**: no hay endpoint, ni pantalla, ni KPI.
Verificado por búsqueda de `periodosDeBodegaje`, `diasDeBodegaje` y `marcaIngresoAServicio` en
`apps/` y `packages/`: los únicos usos vivos están dentro del propio paquete y sus pruebas.

**No es lo mismo que «pendiente».** Un pendiente no se ha escrito; esto está escrito, probado y
compilando, y su riesgo es el contrario: envejece en silencio mientras nadie lo llama, y el día que
alguien lo cablee puede llevar meses de deriva respecto al esquema que lee.

**Quién lo cablea:** la capacidad **`kpis`** (`openspec/config.yaml:225`), fase 2. El propio
`config.yaml:228-241` ya lo dejó registrado con las palabras exactas: «F1A-04 adelantó de esta
capacidad la PIEZA DE DOMINIO de C9, y sólo ésa … LO QUE SIGUE EN FASE 2: los indicadores en sí. No
hay módulo de KPIs ni pantalla, y el 48 y el 49 tienen su ancla pero no están calculados. La
capacidad NO tiene spec y sigue debiéndose.»

→ Registrado como **construido, no cableado**. Destino: `kpis` (F1C-06 para C7+C9, `plan:171`). No
hay nada que corregir aquí; hay algo que **no perder de vista**.

---

## 4 · Cambio operativo con impacto en personas — el campo obligatorio nuevo

**El hecho.** `packages/shared/src/transitions.ts:259-260` — la transición `habilitado_para_entrega`
(«Habilitado para entrega», área **Comercial**, de `Liberación Comercial` a `Por Entregar`) pasó a
llevar `cfDate('Fecha de aviso al cliente')`. Y `cfDate` es `required = true` **por omisión**
(`transitions.ts:74-75`), así que el campo es **OBLIGATORIO**.

**No es un defecto.** C9 lo necesita, y la razón está escrita y probada: opcional, el bodegaje de
salida no valdría cero, sería **incalculable para siempre**, porque nadie vuelve a pasar por esa
etapa (`transitions.ts:256-258`, prueba `bodegaje.test.ts:95`). El maestro lo pide en `:1704`.

**Pero es un cambio operativo, y una auditoría que no lo registre no está auditando.** Con estas
palabras:

> **El día que esto se despliegue, nadie de Comercial podrá ejecutar «Habilitado para entrega» sin
> rellenar una fecha que ayer no existía.** La transición se usa a diario y hoy sólo pide un
> comentario.

**Cómo se comporta exactamente**, para que el aviso al equipo sea correcto y no alarmista:

| Capa | Qué hace | Evidencia |
|---|---|---|
| Pantalla | Pinta el campo de fecha automáticamente y le pone asterisco rojo | `apps/desk/src/components/TransitionPanel.tsx:253`, `:209` |
| Pantalla | **NO bloquea el envío** — el asterisco es aviso, no guarda | no hay más usos de `required` en ese fichero |
| Servidor | Rechaza con `Falta el campo obligatorio: Fecha de aviso al cliente` | `apps/desk/server/transitionExec.ts:77` |

Es el reparto correcto bajo la **regla invariable 13**: la imposición está en el servidor y el
cliente es comodidad. El efecto práctico es que quien no rellene la fecha **verá un error tras
pulsar**, no un botón deshabilitado.

**Aviso que el equipo necesita ANTES del despliegue** (una nota, no una formación):

1. **A quién:** a Comercial, que es el área de la transición.
2. **Qué decir:** «Habilitado para entrega» pasa a pedir **la fecha en que se avisó al cliente de
   que el equipo está listo**. Es obligatoria; sin ella la transición no se ejecuta y sale un error.
3. **Por qué:** hasta hoy ese dato se aproximaba con la hora del último cambio de estado, que
   atribuye al cliente la demora en avisarle (`R08.1.md:1704`). Es el arranque del bodegaje de
   salida.
4. **Qué NO se rompe:** ningún ticket ya en `Por Entregar` se ve afectado; el campo se pide al
   ejecutar la transición, no retroactivamente.

---

## 5 · Cifras, invariantes y specs

### 5.1 · Las cuatro cifras, medidas con esta tanda dentro

| Comando | Resultado |
|---|---|
| `npm test` | **verde** — 113 ficheros (112 pasan, 1 saltado), **978 tests** (976 pasan, 2 saltados) |
| `npm run typecheck` | **verde** — salida 0, sin diagnósticos |
| `npm run lint` | **verde** — `0 errors, 158 warnings` (157 `no-explicit-any` + 1 `react-hooks/exhaustive-deps`) |
| `npm run build` | **verde** — bundle 350,14 kB (gzip 102,69 kB) |

Contraste con el baseline de F0-00 (`a3a8f03`): 830 → 978 tests; **158 → 158 avisos**, es decir, las
cuatro tandas de F1A no añadieron **ni un solo aviso** de lint.

**Y hay una quinta cifra que el baseline no tenía y que el CI ya exige.** `edbce13` (2026-09-08)
instaló el proveedor de cobertura y lo metió en el CI (`.github/workflows/ci.yml:39`), con umbrales
en `vitest.config.ts:58-63`. Medido a F1A-05: **94,31 lines · 81,97 branches · 98,28 functions ·
94,31 statements**, contra umbrales de 92 / 78 / 96 / 92 → **verde**.

**⚠️ La cifra de lint es engañosa si se mide en local, y esto es un hallazgo (A-5).** `eslint .`
devuelve **161** —no 158— en cuanto existe el directorio `coverage/`, porque `eslint.config.js:9`
ignora `dist`, `.agent`, `tmp-app` y `docs` pero **no** `coverage/`, y el informe generado aporta 3
avisos de «Unused eslint-disable directive» sobre `block-navigation.js`, `prettify.js` y `sorter.js`.
El directorio está en `.gitignore:18`, así que no se versiona, pero **sí se linta**.

En el CI no salta hoy sólo por el **orden** de los pasos: `lint` (`ci.yml:35`) corre **antes** que
`test:coverage` (`ci.yml:39`). Y el techo no lleva holgura a propósito —`--max-warnings 158`,
`ci.yml:28-35`, «la holgura convierte un trinquete en un adorno»—, así que **invertir esos dos pasos
rompe el CI**, y quien lo mida en local después de un `npm run test:coverage` verá 161 y creerá que
introdujo tres avisos. La cifra comparable es `npx eslint . --ignore-pattern "coverage/**"`.

> **✅ ARREGLADO en el commit siguiente (§8).** `coverage` entró en `globalIgnores`
> (`eslint.config.js:9-16`). Desde ahí, `eslint .` da **158 con `coverage/` presente o ausente**, y
> el orden de los pasos del CI deja de ser una dependencia. Las cuatro medidas están en §8.1.

### 5.2 · Qué invariantes tocó esta tanda

**Ninguno.** Los seis invariantes del grafo (`packages/shared/src/invariantesGrafo.test.ts:29`,
`:45`, `:57`, `:69`, `:85`, `:130`) siguen verdes sin modificación. En particular el **invariante
6** —los diez campos de fecha reentrantes— se comprobó explícitamente en §1 y no se movió.

F1A-05 **no toca código de producción**. Añade dos pruebas de caracterización a
`packages/shared/src/bodegaje.test.ts` y corrige dos textos caducos (§5.3).

### 5.3 · Qué caducó en las specs y en la configuración

| Dónde | Qué dice | Por qué caducó | Acción |
|---|---|---|---|
| `openspec/config.yaml` · `coverage.available: false` | «`@vitest/coverage-v8` no está instalado; `vitest.config.ts` no declara sección coverage» | **La afirmación más caduca de las tres.** Era cierta al baseline `a3a8f03` (2026-08-20) y falsa desde `edbce13` (2026-09-08): el proveedor está en `package.json:57`, el script en `:24`, la sección en `vitest.config.ts:49-64` con cuatro umbrales, y el CI la ejecuta (`ci.yml:45`) | **Corregido** en esta tanda, con la medida de hoy |
| `openspec/config.yaml` · `quality_tools.linter` | «…; **sin `--max-warnings`**» | También falso desde `edbce13`: el CI corre `npm run lint -- --max-warnings 158` (`ci.yml:35`), un trinquete sin holgura. La cifra de avisos en sí **no** había caducado: siguen siendo 158 | **Corregido**, con el aviso de A-5 sobre medirlo en local |
| `openspec/config.yaml` · `ci:` | «npm ci -> typecheck -> lint -> test -> build» | El paso es `test:coverage`, no `test`, y `lint` lleva techo | **Corregido** en esta tanda |
| `openspec/specs/trazas/spec.md` §3.4 | «destino F1A-04 → F1C», y describe la vía preferida como leer la marca de `Ingreso a Servicio` | F1A-04 lo construyó, y **no así**: la R08 (`:1694`) sustituyó esa prescripción de la R05 por el par de campos `Fecha Orden De Venta − Fecha Remisión Entrada` (`bodegaje.ts:59-65`). La marca de `Ingreso a Servicio` quedó como ancla de los indicadores **48 y 49**, no del bodegaje de entrada | **Corregido** en esta tanda |
| `openspec/config.yaml` · `estado_al_baseline` | 158 avisos, 830 tests, «coverage: false» implícito | **NO caducó.** Es un snapshot fechado del commit `a3a8f03` y es correcto como registro histórico. No se toca | Se deja intacto |
| Capacidad `kpis` | No tiene spec | Sigue debiéndose, y ahora con código de dominio ya escrito apuntando a ella (§3) | Registrado, no corregido |

---

## 6 · Lo que esta auditoría NO hizo, declarado

1. **C12 (F1A-03)** — parada esperando a Gustavo/Calidad. No auditada. Cuando cierre, la pasada de
   `audit-F1A` sobre las salidas aprobada/rechazada de `Verificación` está por hacer.
2. **El artefacto `docs/artefactos/blueprintserviciotecnico.html` NO se regeneró.** No hay generador
   (§0). Sigue con fecha de generación **2026-08-21**, y por tanto **no refleja** ni C1 ni C11 ni C9.
   Es el mayor desfase abierto de esta auditoría: el único mapa visual del flujo que existe describe
   un flujo anterior a las tres correcciones.
3. **Los flujos de equipo nuevo y soporte remoto** — `:2713` pide extender la auditoría a ellos «en
   cuanto estén implementados». No lo están: son F1B-06.
4. **Los cinco incumplimientos vivos de `CLAUDE.md`** no se corrigieron. No son de esta tanda y
   siguen con su destino asignado.

---

## 7 · Hallazgos nuevos de F1A-05, en una línea cada uno

| # | Hallazgo | Categoría | Destino |
|---|---|---|---|
| A-1 | El bodegaje de proceso **no es calculable** para la rama de aprobación sin repuestos, y leer el historial no lo arregla porque el valor nunca se escribe bajo esa etiqueta | Defecto de dominio, ya con dueño | **F1C-02** |
| A-2 | `bodegaje.ts` está **construido y no cableado**: exportado, probado, sin un solo consumidor | Deriva silenciosa | `kpis` (F1C-06) |
| A-3 | «Habilitado para entrega» pasa a exigir una fecha nueva: **cambio operativo con impacto en Comercial** | Aviso previo al despliegue, no defecto | Gerencia / Comercial |
| A-4 | El artefacto de blueprint describe un flujo **anterior** a C1, C11 y C9, y no hay forma de regenerarlo | Documentación caduca sin vía de arreglo | **§8.2** — aviso de caducidad puesto; corrección al plan como entrada 4; construir el generador queda sin dimensionar |
| A-5 | `eslint.config.js` no ignoraba `coverage/`, así que la cifra de avisos subía de 158 a 161 en cualquier máquina que hubiera corrido `npm run test:coverage`. En el CI sólo se salvaba por el orden de los pasos, y el techo `--max-warnings 158` no lleva holgura | Cifra inestable + CI frágil | **§8.1 — ARREGLADO** |

---

## 8 · Cierre de los dos hallazgos que quedaron sin tanda

### 8.1 · A-5 — arreglado, con las cuatro cifras medidas

`eslint.config.js:16` — `globalIgnores(['dist', '.agent', 'tmp-app', 'docs', 'coverage'])`.

| Medida | Cifra |
|---|---|
| `eslint .` **con** `coverage/` presente, antes del arreglo | **161** (158 + 3 × «Unused eslint-disable directive» de `block-navigation.js`, `prettify.js`, `sorter.js`) |
| `eslint .` **sin** `coverage/` | **158** |
| El trinquete del CI (`ci.yml:41`) | **158**, sin holgura |
| `eslint .` **con** `coverage/` presente, después del arreglo | **158** ✅ |

Medidas sobre el mismo árbol, con `coverage/` realmente en disco en la primera y la cuarta. Y
`npm run lint -- --max-warnings 158` —el comando exacto del CI— pasa con salida **0** teniendo
`coverage/` delante, cosa que antes fallaba.

**Qué arregla:** que la cifra deje de depender de si esa máquina ha corrido `test:coverage` alguna
vez. Nada más.

**Qué NO arregla, dicho porque es justo lo que se pidió no dar por trivial:** no baja el techo del CI
—sigue en 158— y **no le da holgura**. `ci.yml:28-31` declara que la holgura convierte un trinquete
en un adorno, y eso no ha cambiado. Los 3 avisos que desaparecen nunca fueron deuda del proyecto: son
de un informe generado que no debía estar en el denominador.

**¿Hay que fijar por escrito el orden de `ci.yml:41` y `ci.yml:45`? No — y ésa es la parte que
importa.** Antes del arreglo el orden **era** una dependencia real y no declarada: el CI pasaba
únicamente porque `lint` corría antes de que `test:coverage` creara el directorio, e invertir los dos
pasos habría roto la compilación sin que ningún fichero explicara por qué. Declarar ese orden lo
habría dejado igual de frágil, sólo que con una nota.

Lo correcto era **eliminar la dependencia**, y es lo que se hizo: con `coverage` en `globalIgnores`
los dos pasos son conmutables. Verificado, no supuesto — la cuarta medida de la tabla se tomó con
`coverage/` en disco, es decir, en el estado que produce `test:coverage`. Es además el patrón que el
propio fichero ya seguía para `dist`, que genera `npm run build` y lleva ignorado desde siempre.

Queda una línea de comentario en `ci.yml:33-37` para quien vaya a reordenar esos pasos: dice que la
dependencia existió, que ya no existe, y por qué. **Un comentario que dice «esto ya no ata» es lo
contrario de un orden declarado.**

**La lección, que vale más que los tres avisos.** Se reportaron **161 contra un techo de 158** durante
varios turnos sin que ninguna de las dos partes lo cuestionara. La cifra no cuadraba con el trinquete
que el propio repositorio declara, y aun así pasó como dato. Un número que se copia sin cruzarlo con
la puerta que tiene que atravesar no es una medida: es una costumbre.

### 8.2 · A-4 — para qué sirve el artefacto, y qué se hizo mientras se decide

**La pregunta correcta no era si A-4 es tanda nueva o alcance de F1B-09** —`plan:158` hereda la misma
premisa, con el mismo gate «—» y la misma talla S (`plan:421`), así que la corrección es del plan y va
antes que ninguna construcción—. La pregunta es para qué sirve el fichero, ahora que F1A-05 ha
demostrado que la auditoría se hace sin él.

**Respuesta: (a), y lo dice el maestro.** `R08.1.md:4272`, dentro del **Anexo F — Fuentes** (`:4201`):

> «Artefacto de apoyo. El mapa visual del blueprint —diagrama completo, leyenda por área y fichas de
> los hallazgos— vive como artefacto interactivo bajo el título «Blueprint de Servicio Técnico — mapa
> de transiciones». **Es la fuente gráfica de §M1.3 y se actualiza con cada auditoría del código.**»

El `<title>` del fichero es exactamente esa cadena, así que la identificación no es inferencia. **El
maestro lo adoptó como fuente propia, con función declarada y cadencia declarada**: no es el andamio
de una conversación de agosto. Descarta (b).

**Lo que sí cambió** es que las dos funciones que `plan:388` trataba como una se han separado, y
F1A-05 es la prueba:

| Función | ¿Quién la cumple hoy? |
|---|---|
| **Auditar el flujo** | El documento de auditoría. **No necesita el artefacto** — éste se produjo leyendo el código |
| **Ser la fuente gráfica de §M1.3 para personas** — diagrama, leyenda por área, fichas | **Nada más.** `docs/blueprint-servicio-tecnico.md` es texto, es anterior a la app y el maestro no lo cita |

Por eso la talla **S** no es falsa del todo: es correcta para auditar —queda demostrado— y es falsa
para regenerar. Son dos trabajos, y sólo el segundo necesita generador. Redactado como **entrada 4**
de `docs/sdd/F0-01_Correcciones_para_el_plan.md`, con los tres cambios propuestos a `plan:388`,
`plan:142`/`:158` y `plan:412`/`:421`.

**Queda un residuo de (c), y es honesto decirlo:** el Anexo F dice para qué sirve, pero **nadie ha
verificado quién lo abre ni con qué frecuencia**. Eso es lo que decide si construir el generador
merece una tanda o si el artefacto se congela como histórico —el precedente es `docs/superpowers/`,
que F0-00 §6 indexó en vez de borrar, y donde un diseño se autodeclara «SUPERADO» en su propia
cabecera—. **Es agenda de Gerencia, no tanda.**

**Y lo que sí era responsabilidad de esta tanda, hecho.** El fichero describía el flujo anterior a
C1, C11 y C9 **sin ninguna marca que lo dijera**: cualquiera que lo abriera leía comportamiento que
ya no existe. Lleva ahora un aviso de caducidad incrustado justo después de `<body>`, con
`id="aviso-caducidad-f1a-05"`: fecha del artefacto, las tres correcciones que no refleja con sus
commits, que no hay generador, y a dónde ir para leer el flujo vigente.

El cambio es de **1.471 bytes en la línea 1**, verificado byte a byte —de 3.370.299 a 3.371.770, y
todo desde la línea 2 idéntico—. Coste asumido y escrito en `docs/artefactos/NOTA.md` §7: el fichero
es `-diff -merge` y añade un blob de ~898 KiB al historial. Se acepta porque la alternativa era dejar
circulando un mapa que miente sin decirlo.
