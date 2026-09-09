# F0-03 · Memoria del proyecto — ordenar Engram, no crearlo

| Dato | Valor |
|---|---|
| Fase | Fase 0 — Cimientos SDD |
| Estado | **Propuesta — pendiente de visto bueno.** Bloqueada en un punto: ver §2.2 |
| Base | commit `749d205`, rama `main` |
| Definición en el plan | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:125`, con su fila de trazabilidad en `:406` |
| Apartado del maestro | **§1.8** (`R08.1.md:734-870`) · Anexo C.10 (`:3815-3830`) |
| Entradas | El maestro §1.8 · el baseline `docs/sdd/F0-00_Baseline_as-built.md` · el estado real del proyecto Engram `ambientalia-desk` |
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
2. **Carga las decisiones cerradas del §1.8 del maestro** como observaciones `decision/*`, una por
   decisión, cada una con su fecha, su implicación y **su línea del `.md` exportado**. La lista
   completa y revisable está en `openspec/changes/F0-03/decisiones-para-carga.md`.
3. **Retitula las siete observaciones sin título** y les pone `topic_key`, sin reescribir su
   contenido.
4. **Evalúa Git Sync** y entrega una recomendación con su porqué, no una instalación.
5. **No borra nada.** Si una observación quedó superada, se marca en su contenido; el registro se
   conserva, como se hizo con IV-3.

### 2.2 · ⚠️ El punto que bloquea: el «acta 03/09» no tiene copia citable

El plan encarga cargar «las decisiones cerradas (**§1.8 del documento maestro y acta 03/09**)»
(`:125`), y cita esa acta **14 veces** como fuente (`grep -c "acta 03/09"` sobre el plan = 14), cuatro
de ellas por número de tema: «tema 3» (`:183`), «tema 4» (`:188`), «tema 5» (`:429`), «tema 6»
(`:432`).

**El maestro dice, literalmente, que esa sesión no se había celebrado.** Anexo C.10 (`:3815-3816`):

> «C.10 — 03/09/2026 · Sesión convocada (**aún no celebrada**). Incorporada en la R08.1 como
> **convocatoria, no como acta**. A la fecha de cierre de esta revisión la sesión no se ha celebrado y
> el apartado de notas **está vacío en el origen**.»

Y lo repite en otros cuatro sitios: `:17`, `:161`, `:217`, y `:268` («queda por incorporar la reunión
del 03/09/2026, "Checklist dinámico" … **no disponible** al cerrar esta revisión»).

**Lectura, sin adornos.** El plan R01.1 es posterior al maestro R08.1 y cita el acta por número de
tema, así que su autor sí la tenía delante. Lo que no existe es una **copia citable en el
repositorio**: `find docs -iname '*acta*'` no devuelve nada, y `grep -rln "03/09" docs/ --include=*.md`
sólo encuentra el maestro, el plan y dos documentos de F0-00 que la citan de segunda mano.

Y la regla de método de `CLAUDE.md` es explícita sobre eso: «**una cita de segunda mano es una
hipótesis, aunque venga de un documento propio**». Cargar en Engram como `decision/*` lo que el plan
resume del acta sería crear autoridad a partir de una hipótesis, en el sistema cuyo propósito es
justamente que las tandas futuras no tengan que volver a las actas.

**La pregunta para Gerencia, y esta tanda no la responde:**

> ¿Se exporta el acta del 03/09 a `docs/Manifesto/` —como se hizo con el maestro, con
> `scripts/docx2md.sh`— para poder citarla por línea? ¿O F0-03 carga sólo el §1.8 y deja las
> decisiones del 03/09 fuera hasta que exista esa copia?

Mientras no se responda, **el punto 2 del alcance se limita al §1.8**. Es la mitad que sí se puede
citar por línea.

### 2.3 · Lo que esta tanda NO hace

- **No crea el proyecto Engram**, que existe desde F0-00 (§1).
- **No recarga el baseline de F0-00**, que ya está (§1). Sólo verifica que las ocho claves
  `baseline/*` siguen resolviendo.
- **No carga las decisiones del acta 03/09** hasta que haya copia citable (§2.2).
- **No instala Git Sync.** Lo evalúa y recomienda; instalarlo mueve secretos y datos de proyecto entre
  equipos, y eso es decisión de Gerencia bajo la regla de secretos.
- **No borra ni reescribe** observaciones existentes: sólo les pone título y clave.
- **No toca código.** `npm test`, `typecheck`, `lint` y `build` tienen que salir iguales.

---

## 3 · La convención de `topic_key` que se propone

El plan da el patrón y un ejemplo —`decision/c3-salida-esperas` (`:54`)— y nada más. Se propone
formalizarlo así, en `openspec/config.yaml`:

| Espacio | Qué guarda | Quién lo escribe | Ejemplo real o propuesto |
|---|---|---|---|
| `decision/` | Una decisión **de negocio** cerrada, con fecha y fuente citable | F0-03 para el §1.8; después, la tanda que traiga una nueva | `decision/serial-llave-de-entrada` |
| `baseline/` | El as-built verificado de F0-00, un frente por observación | F0-00 (**ya cargado**, ocho claves) | `baseline/motor-flujo` |
| `tanda/` | El cierre de una tanda: qué se hizo, qué quedó abierto | cada tanda, al terminar | `tanda/f0-02` |
| `iv/` | Un incumplimiento vivo, con su alcance y su destino | la tanda que lo encuentra | `iv/6-alter-sin-calificar` |
| `sdd/<proyecto>/` | Configuración de SDD del proyecto | `sdd-init` (**ya en uso**) | `sdd/ambientalia-desk/testing-capabilities` |

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
cuerpo la cita de su fuente por apartado y línea (`R08.1.md:NNN`). Sin ella no se carga. Es la regla
de método aplicada a la memoria: sin la cita, la observación es exactamente el «resumen de segunda
mano» que ya costó cuatro afirmaciones falsas en R01/R02.

---

## 4 · Criterio de hecho

1. `openspec/config.yaml` lleva la convención de `topic_key` del §3, con sus cinco espacios y sus
   cinco reglas.
2. Las **43** decisiones cerradas del §1.8 están cargadas como observaciones `decision/*`, una por
   decisión. La 17 (`:787`) **no**, porque el maestro la marca `[EN EVALUACIÓN — R08] No es una
   decisión cerrada` — y el plan pide las **cerradas**.
3. Cada observación `decision/*` lleva en su cuerpo la línea del `.md` exportado de la que sale, la
   fecha del acta que la cerró y su implicación, tal como el maestro las escribe.
4. Ninguna observación queda con el título vacío: las siete de §1.1 tienen título y `topic_key`.
5. Las ocho claves `baseline/*` de F0-00 siguen resolviendo con `mem_search`, y ninguna se ha
   reescrito.
6. Existe una recomendación escrita sobre Git Sync, con su porqué y su riesgo bajo la regla de
   secretos, en este mismo directorio.
7. El punto abierto del §2.2 —el acta del 03/09— está registrado donde se registran los puntos
   abiertos del proyecto, decida Gerencia lo que decida.
8. `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` siguen igual que antes de la
   tanda: F0-03 no toca código, así que cualquier cambio en esas cuatro cifras es un defecto de la
   tanda. Cifras de partida, medidas sobre `749d205`: **110 ficheros / 931 pruebas** (929 en verde, 2
   saltadas) · typecheck limpio · lint **0 errores / 161 avisos** · build correcto.

---

## 5 · Riesgos

| Riesgo | Mitigación |
|---|---|
| **Cargar 43 decisiones de golpe llena la memoria de ruido y `mem_context` deja de ser útil.** Es el fallo por exceso: si todo está en memoria, nada destaca | La lista se revisa **antes** de cargar (`decisiones-para-carga.md`), y cada entrada lleva propuesta de clave. Gerencia puede tachar filas. Además, `decision/*` no entra en `mem_context`, que muestra lo reciente: entra por `mem_search`, que es donde tiene que estar |
| **La memoria es un fichero local de un equipo.** `~/.engram/engram.db`, sin `.git` y sin remoto: si ese equipo se pierde, se pierde el trabajo de F0-00, F0-02 y F0-03 | Es exactamente lo que el punto 4 del alcance evalúa. Se entrega recomendación, no instalación, porque compartirla mueve datos del proyecto entre equipos |
| **El §1.8 envejece.** Es una tabla del maestro, y el maestro se revisa: la R09 puede cerrar la decisión 17 o abrir otras | La regla 3 del §3 lo cubre: la clave es estable y la observación se actualiza. Y cada observación cita su línea, así que la siguiente tanda puede volver a comprobarla |
| **Cargar el §1.8 y no el 03/09 deja la memoria a medias, y quien la consulte no lo sabrá** | Se carga una observación `decision/acta-03-09-pendiente` que lo diga con su evidencia, para que el hueco sea visible desde dentro de la propia memoria |
