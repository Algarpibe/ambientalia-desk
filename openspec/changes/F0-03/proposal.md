---
tanda: F0-03
motivo: ""
capacidad: []
maestro: ["§1.8", "Anexo C.10"]
cierra: si
toca_maestro: si
origen_cabecera: derivada-17/09
---

# F0-03 · Memoria del proyecto — ordenar Engram, no crearlo

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD |
| Estado | **Aprobada y ejecutada el 2026-09-09.** Visto bueno de Gerencia a las tres clases (a), (b) y (c); la carga en Engram se hizo sobre `f51846f` |
| Base | commit `da084e9`, rama `main`. **Las citas de línea al plan (`plan:NNN` y `…ClaudeCode_R01.1.md:NNN`) de este documento se leen contra el plan en `a5da6b8` (539 líneas), NO contra el de hoy** (caso B/C de la regla de mutación 4 de `CLAUDE.md`): el plan creció a 598 líneas el 2026-09-17 al sincronizarse con el libro R01.3, y renumerarlas volvería falsas las frases que citan texto ya corregido. |
| Definición en el plan | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:125`, con su fila de trazabilidad en `:406`, las dos en `da084e9`; **hoy `:127` y `:457`** |
| Apartados de las fuentes | Maestro **§1.8** (`R08.1.md:734-870`) y Anexo C.10 (`:3815-3816`, **caduco**: §2.2) · **Acta del 03/09**, parte III (`Desk2.0_Acta_Sesion_2026-09-03.md:268-480`) |
| Entradas | El maestro §1.8 · **el acta del 03/09** (480 líneas, exportada de Notion en `da084e9`) · el baseline `docs/sdd/F0-00_Baseline_as-built.md` · el estado real del proyecto Engram `ambientalia-desk` |
| Depende de | F0-00 (hecha) · F0-01 (hecha) · F0-02 (hecha: siete specs, commit `fa445ac`) |
| Habilita | Que cualquier sesión recupere el estado del proyecto con `mem_context` sin releer actas |
| Talla / semana | S · S37 (plan R01.1 §5, `:406`) |
| Modo | Sin código. `strict_tdd` no aplica; la disciplina equivalente es la cita con apartado y línea |

---

## 0 · Método

Rigen las reglas de `CLAUDE.md`: **apartado y línea del `.md` exportado** en toda afirmación sobre el
maestro, **ruta y línea** sobre el código, y la palabra **hipótesis** delante de lo demás. Y la regla
que F0-02 se ganó y esta tanda hereda:

> **Toda cifra la produce un comando, y el comando queda escrito junto a ella.** Los cuatro errores de
> recuento de F0-02 —15 requisitos, 6 entradas de §3, las dos de `schema.sql` y «cinco ALTER»— son los
> cuatro que se contaron a ojo. Ninguna cifra salida de un script ha fallado.

---

## 1 · Corrección de alcance: el proyecto Engram ya existe

El plan (`:125`) encarga «**Proyecto Engram**; carga de las decisiones cerradas … y del baseline de
F0-00; convención de `topic_key`; evaluar Git Sync». Escrito en S37, daba por hecho que la tanda
crearía el proyecto. **No lo crea: lo ordena.** Verificado en esta sesión antes de escribir:

| Qué dice el plan | Estado real, verificado | Evidencia |
|---|---|---|
| «Proyecto Engram» (crear) | **Existe**, se llama `ambientalia-desk` y se autodetecta por el remoto git | `mem_current_project` → `{"project":"ambientalia-desk","project_source":"git_remote"}` |
| «Carga … del baseline de F0-00» | **Ya cargado**, ocho observaciones con clave estable | `mem_search` → `baseline/mapa-del-proyecto` (#215), `baseline/motor-flujo` (#217), `baseline/zoho-sync` (#218), `baseline/ui` (#219), `baseline/esquema-datos` (#220), `baseline/superpowers` (#221), `baseline/deuda` (#222), `baseline/pruebas` (#223) |
| «Carga de las decisiones cerradas … como observaciones `decision/*`» | **NO cargadas.** Hay **cuatro** observaciones de tipo `decision` y **ninguna** es una decisión de negocio del §1.8 | `mem_search type=decision` → #216 (preflight SDD), #226 (respuestas de Gerencia R02), #236 (§9 del baseline), #250 (alcance de F0-04). Las cuatro son decisiones **de proceso**, no de negocio |
| «Convención de `topic_key`» | **No escrita en ningún sitio del repositorio.** `grep -rn "topic_key" openspec/config.yaml CLAUDE.md` no devuelve nada; sólo aparece en el plan (`:54`, `:125`, `:281`) y en tres documentos de F0-00 | El uso real es *de facto*: `baseline/*` y `sdd/ambientalia-desk/*` |
| «Evaluar Git Sync» | **No configurado.** La memoria es un SQLite local de un solo equipo | `ls -a ~/.engram/` → `engram.db`, `engram.db-wal`, `engram.db-shm`, `protocol-mode.json`. **No hay `.git`** ni remoto |

Ese cambio de alcance es el mismo patrón que F0-01 ya registró como `PF-1` y que F0-04 registró en su
§1: **el plan describe un punto de partida que las tandas anteriores movieron.** Se propone anotarlo
como `PF-2` en `openspec/config.yaml` (`premisas_falsas_corregidas`) si Gerencia da el visto bueno a
este proposal.

### 1.1 · El desorden concreto que esta tanda arregla

No es que falte memoria: es que la que hay **no se encuentra por su nombre**. De las 20 observaciones
que devuelve el barrido más amplio (`mem_search` con `match_mode: any`, límite 20), **siete llegan con
el título vacío** —#225, #226, #229, #232, #235, #237, #238—. Son de las más sustanciales que tiene el
proyecto: incluyen las respuestas de Gerencia a las diez preguntas del baseline (#226) y las dos
correcciones al maestro (#235, #238).

Una observación sin título y sin `topic_key` sólo se encuentra por búsqueda de texto completo. Es
exactamente el hueco que el plan quería cerrar: «de modo que una tanda posterior las encuentre con
`mem_search` **sin releer actas**» (`plan:54`).

---

## 2 · Alcance

### 2.1 · Lo que esta tanda sí hace

1. **Fija la convención de `topic_key`** por escrito, en `openspec/config.yaml`, con su espacio de
   nombres y sus reglas (§3).
2. **Carga las decisiones cerradas de las dos fuentes** como observaciones `decision/*`, una por
   decisión, cada una con su fecha, su implicación y **su línea del `.md` exportado**: **43** del §1.8
   del maestro y **12** de la sesión del 03/09, **55** en total. La lista completa y revisable está en
   `openspec/changes/F0-03/decisiones-para-carga.md`.
3. **Carga los tres temas que la sesión no cerró** como `punto-abierto/*`, para que el hueco sea
   visible desde dentro de la memoria (§2.2). Eran dos cuando se escribió este proposal; la
   revisión de la lista encontró el tercero —el tema 4—, que sale tratado y sin decisión.
4. **Retitula las observaciones sin título** y les pone `topic_key`, sin reescribir su
   contenido.
5. **Evalúa Git Sync** y entrega una recomendación con su porqué, no una instalación.
6. **No borra nada.** Si una observación quedó superada, se marca en su contenido; el registro se
   conserva, como se hizo con IV-3.

### 2.2 · El acta del 03/09: resuelta, con una trampa dentro

**El bloqueo que este proposal declaró el 2026-09-09 está levantado.** La copia citable existe:
`docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md`, 480 líneas, exportada de Notion en el commit
`da084e9`. No hacía falta `scripts/docx2md.sh` porque el acta no vivía en un `.docx` sino en Notion,
como el propio plan declara en su cabecera (`plan:4`).

**Y mi premisa se quedaba corta en lo que importa: la sesión sí se celebró.** El acta la fecha el
03/09/2026 a las 14:00 por Google Meet, con los tres convocados presentes (`acta:280-288`). Lo que
está caduco es el **Anexo C.10 del maestro** (`R08.1.md:3815-3816`), que sigue diciendo «aún no
celebrada» y «el apartado de notas está vacío en el origen»: la R08.1 se cerró antes de la sesión y no
se volvió a tocar. **Va como entrada 13 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`**, y no
va sola: el maestro arrastra la misma frase en **diez** líneas, de las que dos —`:1820` (M2.1) y
`:1911` (M2.5)— no son índice ni anexo, sino apartados sustantivos que se declaran incompletos
cuando ya no lo están.

Es, además, la segunda ocurrencia del punto abierto **nº 61** del propio maestro —«Mecanismo de
incorporación de actas … la del 27/08 estuvo cinco revisiones sin entrar en el documento»
(`acta:122`)—. La del 03/09 iba camino de repetirlo.

#### La trampa: el fichero tiene dos partes y no son lo mismo

| Parte | Líneas | Qué es | ¿Registra decisiones? |
|---|---|---|---|
| I y II | `:26-267` | **La convocatoria.** Orden del día con casillas, preparado **antes** de la sesión | **No** |
| III | `:268-480` | **El acta.** Lo que ocurrió | **Sí**, en siete bloques |

La convocatoria lleva **45 casillas** —`grep -cE '^- \[[ x]\]'` = 45, de las que **3** están marcadas
`[x]` y **42** no—, y las 45 están en las partes I y II: ninguna a partir de `:268`. **Una casilla
marcada no es una decisión.** Es un tema que alguien quiso llevar a la mesa.

De las tres marcadas, sólo **una** tiene respaldo en el acta:

| Línea | Casilla `[x]` | ¿La respalda el acta? |
|---|---|---|
| `:170` | ¿Entra el módulo de informes en la Fase 1? | **Sí**, decisión en `:402` |
| `:173` | **P10** — validación de informes antes de emitir, con firma por etapa | **No.** Se discutió (`:397`) pero dentro de «Resumen de la discusión», no de ningún bloque de decisiones |
| `:121` | **P62** — qué se hace con la capa as-built | **No, y ni siquiera se trató.** Cero apariciones de `P62`, `as-built`, `capa as` y `Anexo H` en toda la parte III |

#### Lo que eso significa para el riesgo que F0-02 anotó

El §6 del proposal de F0-02 registró la contradicción entre retirar la capa as-built (acordado el
27/08) y mantener el Anexo H (encargado después), y la dejó a la sesión del 03/09. **La sesión no la
trató.** El riesgo **sigue abierto, exactamente como estaba**, y ahora con una consecuencia más
concreta: F0-02 escribió siete specs as-built; si se retirara esa capa del `.docx`, esas siete specs
pasan a ser la única copia de ese contenido.

La **regla de la sesión** que la propia convocatoria fija (`acta:114-116`) dice qué pasa con P10 y P62:

> «Cada bloque sale con una de dos cosas: una decisión escrita, o un responsable con una fecha. Lo que
> no salga con ninguna de las dos **vuelve al Anexo D y bloquea la construcción del módulo al que
> pertenece**.»

Por eso las dos se cargan como `punto-abierto/*` y **no** como `decision/*` (punto 3 del §2.1).
Cargarlas como decisión sería crear autoridad desde una casilla; no cargarlas dejaría a quien consulte
la memoria viendo doce decisiones del 03/09 sin saber que dos temas del orden del día se cayeron.

#### La fecha que esto pone en el calendario

El acta traslada la siguiente sesión al **viernes 11/09/2026** (`acta:442`, decisión del tema 8, y
`acta:462`). Hoy es **09/09**.

Eso tiene efecto directo sobre el plan, y **el plan no se toca**: se anota. Su §4.5 «Gates: decisiones
que abren tandas» (`plan:343-365`) declara **19** claves `decision/*` para decisiones futuras, de las
que **siete filas nombran el 11/09** —`grep` sobre `:348-365` buscando `11/09`—:

| Clave del plan | Tanda que abre |
|---|---|
| `decision/p21-ingreso-sin-ov` | F1B-03 |
| `decision/p8-p54-drive` | F1B-02 |
| `decision/p45-macro-fases` | F1D-03 |
| `decision/flujos-comercial-posible-cliente` | F1B-06 |
| `decision/top5-prioridad` | F1B-07 |
| `decision/c2-anulado` | F1C-01 (11/09 o 18/09) |
| `decision/p14-remisiones-entrada` | F1E-01 |

Y el acta pone **siete tareas con fecha límite 11/09** en su plan de acción (`acta:465-480`, filas 3,
4, 5, 6, 8, 11 y 12).

**Las 19 claves del plan no chocan con las 55 de esta carga.** Verificado con `comm -12`: intersección
vacía. Son dos familias que conviven — el plan escribe la clave **antes** de que la decisión exista,
esta lista la escribe **después**— y cuando una de las 19 se cierre el viernes pasa a ser del mismo
tipo que estas 55.

### 2.3 · Lo que esta tanda NO hace

- **No crea el proyecto Engram**, que existe desde F0-00 (§1).
- **No recarga el baseline de F0-00**, que ya está (§1). Sólo verifica que las ocho claves
  `baseline/*` siguen resolviendo.
- **No carga como decisión ninguna casilla de la convocatoria.** Sólo lo que la parte III registra en
  un bloque `Decisiones tomadas:` (§2.2). P10, P62 y el tema 4 van como `punto-abierto/*`, no como `decision/*`.
- **No decide sobre P62 ni sobre la capa as-built.** La sesión no lo trató; esta tanda lo registra
  como abierto y nada más.
- **No cambia el plan.** La fecha del 11/09 y los siete gates que dependen de ella se anotan, no se
  reordenan: reordenar tandas es de Gerencia.
- **No instala Git Sync.** Lo evalúa y recomienda; instalarlo mueve secretos y datos de proyecto entre
  equipos, y eso es decisión de Gerencia bajo la regla de secretos.
- **No borra ni reescribe** observaciones existentes: sólo les pone título y clave.
- **No toca código.** `npm test`, `typecheck`, `lint` y `build` tienen que salir iguales.

---

## 3 · La convención de `topic_key` que se propone

El plan no da sólo el patrón: **ya declara 19 claves `decision/*`** en su §4.5 «Gates: decisiones que
abren tandas» (`plan:343-365`), escritas para decisiones que aún no existen. La convención no se
inventa aquí, se **formaliza** en `openspec/config.yaml` alrededor de lo que ya hay:

| Espacio | Qué guarda | Quién lo escribe | Ejemplo real o propuesto |
|---|---|---|---|
| `decision/` | Una decisión **de negocio** cerrada, con fecha y fuente citable | F0-03 para las 55 pasadas; el plan §4.5 ya reservó 19 para las futuras | `decision/informes-en-fase-1` (acta `:402`) |
| `punto-abierto/` | Un tema que la sesión **no cerró con decisión**. Si además sale sin responsable, la regla de la sesión lo devuelve al Anexo D; si sale con tarea y fecha, no vuelve, pero sigue abierto | la tanda que lo constata | `punto-abierto/p62-capa-as-built` |
| `baseline/` | El as-built verificado de F0-00, un frente por observación | F0-00 (**ya cargado**, ocho claves) | `baseline/motor-flujo` |
| `tanda/` | El cierre de una tanda: qué se hizo, qué quedó abierto | cada tanda, al terminar | `tanda/f0-02` |
| `iv/` | Un incumplimiento vivo, con su alcance y su destino | la tanda que lo encuentra | `iv/6-alter-sin-calificar` |
| `sdd/<proyecto>/` | Configuración de SDD del proyecto | `sdd-init` (**ya en uso**) | `sdd/ambientalia-desk/testing-capabilities` |

**`punto-abierto/` es el espacio que esta tanda añade, y lo añade porque hacía falta.** Sin él, P10 y
P62 sólo tendrían dos destinos: cargarlos como `decision/*` —falso— o no cargarlos —y entonces la
memoria enseñaría doce decisiones del 03/09 sin decir que dos temas se cayeron—. Un hueco que no se ve
desde dentro de la memoria es el mismo fallo que esta tanda viene a arreglar.

**Cinco reglas, y el porqué de cada una:**

1. **Minúsculas y `kebab-case`.** Una clave que sólo difiere en mayúsculas es una clave distinta y el
   `upsert` deja de funcionar.
2. **Sin fecha en la clave.** La fecha va en el cuerpo. Una clave con fecha crea una observación nueva
   cada vez en lugar de actualizar la que hay, que es justo lo contrario de lo que `topic_key` sirve.
3. **Una clave = un hecho duradero.** Si un hecho se supera, se **actualiza** su observación y se
   escribe dentro qué lo superó. No se crea `decision/x-v2`.
4. **La clave nombra el hecho, no la tanda que lo encontró.** `decision/serial-llave-de-entrada`, no
   `decision/f0-03-punto-10`. La tanda va en el cuerpo, porque el hecho sobrevive a la tanda.
5. **Toda observación con `topic_key` lleva título.** Es lo que hoy falla en siete de ellas (§1.1).

**Y la regla que ata la convención al repositorio:** una observación `decision/*` **debe** llevar en su
cuerpo la cita de su fuente por apartado y línea —`R08.1.md:NNN` o
`Desk2.0_Acta_Sesion_2026-09-03.md:NNN`—. Sin ella no se carga. Es la regla de método aplicada a la
memoria: sin la cita, la observación es exactamente el «resumen de segunda mano» que ya costó cuatro
afirmaciones falsas en R01/R02.

**Verificado que las dos familias no chocan.** Las 55 claves de esta carga y las 19 del plan §4.5 se
compararon con `comm -12` sobre las dos listas ordenadas: **intersección vacía**. El plan escribe la
clave *antes* de que la decisión exista; esta lista, *después*. Cuando una de las 19 se cierre el
viernes, pasa a ser del mismo tipo que estas 55 sin pisar ninguna.

---

## 4 · Criterio de hecho

1. `openspec/config.yaml` lleva la convención de `topic_key` del §3, con sus **seis** espacios y sus
   cinco reglas.
2. Las **55** decisiones cerradas están cargadas como observaciones `decision/*`, una por decisión:
   **43** del §1.8 del maestro y **12** de la parte III del acta del 03/09.
   - Del §1.8 se excluye la **17** (`:787`), que el maestro marca `[EN EVALUACIÓN — R08] No es una
     decisión cerrada`; el plan pide las **cerradas**.
   - Del acta **no se excluye ninguna**: las 12 salen de bloques `Decisiones tomadas:`.
3. Cada observación `decision/*` lleva en su cuerpo **la línea del `.md` exportado** de la que sale,
   su fecha y su implicación, tal como la fuente las escribe. Ninguna se carga sin esa cita.
4. Los **tres** temas sin decisión están cargados como `punto-abierto/*`, **nunca** como
   `decision/*`, con la evidencia de lo que el acta sí y no respalda: P10 (`acta:173`), P62
   (`acta:121`) —los dos sin responsable, vuelven al Anexo D— y el **tema 4** (`acta:359-370`),
   tratado y sin decisión pero con tarea y fecha (`acta:474`), que no vuelve y sigue abierto.
5. Ninguna observación queda con el título vacío. El §1.1 decía siete; el barrido completo sobre
   `engram export` dio **nueve** —las siete más #227 y #253—, y #225 tampoco tenía `topic_key`.
   Las nueve quedan con título y la #225 con clave, sin tocar su contenido.
6. Las ocho claves `baseline/*` de F0-00 siguen resolviendo con `mem_search`, y ninguna se ha
   reescrito.
7. Existe una recomendación escrita sobre Git Sync, con su porqué y su riesgo bajo la regla de
   secretos, en este mismo directorio.
8. La entrada **13** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md` recoge las **diez**
   ubicaciones en las que el maestro arrastra la frase caduca, agrupadas por peso y separadas en
   tres clases —apartado sustantivo, índice y tarea—, con texto propuesto para el Anexo C.10, para
   M2.1 y M2.5 (`R08.1.md:1820`, `:1911`) y para el punto 62 del Anexo D.
9. Las claves cargadas **no chocan** con las que el plan reserva: `comm -12` sobre las dos listas
   ordenadas da intersección vacía, repetido **después** de cargar. Y son **20**, no 19: la tabla de
   gates del §4.5 llega a `:367` —no a `:365`, como decía este proposal—, y hay una vigésima clave en
   `:534`. La comprobación se hizo contra las 20.
10. `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` siguen igual que antes de la
    tanda: F0-03 no toca código, así que cualquier cambio en esas cuatro cifras es un defecto de la
    tanda. Cifras de partida, medidas sobre `749d205` y confirmadas sobre `da084e9`: **110 ficheros /
    931 pruebas** (929 en verde, 2 saltadas) · typecheck limpio · lint **0 errores / 161 avisos** ·
    build correcto.
    **Medidas de nuevo al cerrar F0-03, sobre `f51846f` + los cambios de esta tanda: idénticas.**
    110 ficheros / 931 pruebas (929 en verde, 2 saltadas, 10,09 s) · `tsc -b` con salida 0 ·
    161 avisos y 0 errores de lint · build correcto en 1,98 s. `git ls-files dist` está vacío, así
    que el build no ensucia el árbol.

---

## 5 · Riesgos

| Riesgo | Mitigación |
|---|---|
| **Cargar 55 decisiones de golpe llena la memoria de ruido y `mem_context` deja de ser útil.** Es el fallo por exceso: si todo está en memoria, nada destaca | La lista se revisa **antes** de cargar (`decisiones-para-carga.md`), y cada entrada lleva propuesta de clave. Gerencia puede tachar filas. Además, `decision/*` no entra en `mem_context`, que muestra lo reciente: entra por `mem_search`, que es donde tiene que estar |
| **La memoria es un fichero local de un equipo.** `~/.engram/engram.db`, sin `.git` y sin remoto: si ese equipo se pierde, se pierde el trabajo de F0-00, F0-02 y F0-03 | Es exactamente lo que el punto 4 del alcance evalúa. Se entrega recomendación, no instalación, porque compartirla mueve datos del proyecto entre equipos |
| **El §1.8 envejece.** Es una tabla del maestro, y el maestro se revisa: la R09 puede cerrar la decisión 17 o abrir otras | La regla 3 del §3 lo cubre: la clave es estable y la observación se actualiza. Y cada observación cita su línea, así que la siguiente tanda puede volver a comprobarla |
| **El acta también envejece, y de la peor manera: por lo que NO dice.** Las 12 decisiones son fáciles de leer; los dos temas que se cayeron, no | Los dos van cargados como `punto-abierto/*` (§2.2). El riesgo real era el contrario —cargar P62 como decisión porque su casilla estaba marcada— y esta lista lo bloquea explícitamente |
| **La sesión del 11/09 desplaza siete gates del plan y esta carga se queda desactualizada en dos días** | No se queda: las 55 son decisiones **pasadas**, con fecha y fuente. Lo que el 11/09 cierre se guarda con las claves que el plan §4.5 ya tiene reservadas, y que se verificó que no chocan con éstas |
| **El Anexo C.10 caduco no es un caso aislado: es el punto abierto nº 61 repitiéndose** | La entrada 13 del fichero de correcciones lo nombra así, no como una errata suelta. Corregir C.10 sin nombrar el mecanismo dejaría el siguiente acta expuesto al mismo retraso |
