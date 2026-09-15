# Propuesta: el detector comprueba el extremo FINAL y lee la abreviada en su ancla

**Tanda · base `8222dd9` (rama `main`) · cambio `detector-citas-extremos`**

Cierra los dos defectos que el cierre de IV-10 dejó vivos en el detector de citas: `rotura()` no mira si
el extremo final de un rango cae en línea vacía, y una abreviada que va detrás de una cita anclada se
atribuye a su fichero pero se lee contra el sha local.

> **Regla de método.** Toda cita a código o spec va **anclada a `8222dd9`** y se verificó leyendo el
> árbol de trabajo, que en esas rutas es idéntico a `8222dd9` (árbol limpio salvo ficheros no trackeados
> ajenos en `docs/`). Esta fase **no tiene `git` ni ejecuta el detector**: las cifras vienen de la
> exploración (Engram 597 y 598) y el historial de las reparaciones lo verificó el orquestador (Engram
> 601). Todo eso es **de segunda mano** y se marca como tal; `sdd-apply` lo vuelve a ejecutar. Los
> ejemplos de citas rotas del repositorio se nombran en prosa, sin forma de cita.

> **«Cita el apartado del maestro del que sale» — NO APLICA.** La tanda no sale del maestro: sale de los
> hallazgos que el cierre de IV-10 registró como pendientes de tanda SDD. Mismo tratamiento que dio a esta
> regla la propuesta archivada de `hook-citas-pre-push`.

---

## 1 · Intención

| | |
|---|---|
| **El problema (1)** | `rotura()` tiene tres ramas —inicial fuera de rango, final fuera de rango, inicial vacía— (`apps/desk/server/citas/detector.ts:111-113` en `8222dd9`) y ninguna para el final vacío. RQ-CV-08 lo exige en su texto, «ambos extremos por separado» (`openspec/specs/citas-verificables/spec.md:349-353` en `8222dd9`), pero sus escenarios sólo ejercitan final fuera de rango e inicial vacío (`openspec/specs/citas-verificables/spec.md:363-374` en `8222dd9`): **el código cumple los escenarios y no el texto** |
| **El problema (2)** | Las dos pasadas leen la abreviada en el sha local (`apps/desk/server/citas/detector.ts:174-176` en `8222dd9` y `apps/desk/server/citas/detector.ts:195` en `8222dd9`), aunque la cosecha ya rellena su ancla propia (`apps/desk/server/citas/cosecha.ts:133-136` en `8222dd9`) y la completa sí lee en la suya (`apps/desk/server/citas/detector.ts:124-126` en `8222dd9`, consumida en `apps/desk/server/citas/detector.ts:248` en `8222dd9`). Y la herencia no existe: la cosecha sólo guarda el NOMBRE del último fichero válido (`apps/desk/server/citas/cosecha.ts:106` en `8222dd9`, `apps/desk/server/citas/cosecha.ts:124-129` en `8222dd9`) |
| **Por qué ahora** | IV-10 dejó la línea base en 0 y los dos defectos anotados como vivos (`openspec/config.yaml:855-862` en `8222dd9`; `CLAUDE.md:319-324` en `8222dd9`). Gerencia abrió la tanda el 2026-09-15 (Engram 596) y respondió la ronda de preguntas (Engram 601, §2) |
| **Éxito** | Un rango que termina en línea vacía bloquea igual que uno que empieza en ella; una abreviada se lee en la revisión que su autor indicó; el hook queda en verde contra el propio repositorio con la base en 0; ninguna cita sale del invariante de conservación |

**Medición de partida, de segunda mano** (Engram 597, sobre `9de5d17`; `8222dd9` sólo añadió la
exploración, que sube las comprobadas a 1712 sin mover saltadas ni rotas): 1689 comprobadas, 139
ambiguas, 16 abreviadas rotas, 0 no legibles, 0 bloqueantes. Con los dos defectos arreglados en un
prototipo: 1694 comprobadas, 136 ambiguas, 10 abreviadas rotas, 1 no legible y **3 bloqueantes** (§5).
**Previsto tras la tanda, hipótesis:** 0 bloqueantes, 11 abreviadas rotas (las 10 más habilitar_servicio,
que en el prototipo salía no legible y por (d) va a rotas), 0 no legibles, 136 ambiguas; las
comprobadas las mide `sdd-tasks` con los artefactos nuevos dentro.

---

## 2 · Decisiones de Gerencia (2026-09-15) — registradas literalmente

Ronda de preguntas de `execution_mode: interactive`, **respondida** (Engram 601):

- **(a)** El extremo final en línea vacía BLOQUEA, igual que el inicial: RQ-CV-08 ya lo exige en su
  texto. Las 3 ambiguas que pasarían a bloquear se reparan DENTRO de la tanda, en un commit anterior o
  igual al que activa la comprobación; la línea base sigue en 0. Cada una se repara leyendo su frase.
- **(b)** La abreviada hereda el ancla de la última completa válida SÓLO en su misma línea física. Si la
  abreviada lleva ancla propia, la propia gana. Una mención de otro fichero sin número de línea corta la
  herencia.
- **(c)** Delta de `citas-verificables`: RQ-CV-08 gana el escenario del final vacío, incluido el caso
  ambiguo; RQ-CV-06 gana la herencia del ancla y qué pasa cuando falla.
- **(d)** Si la revisión de una abreviada (propia o heredada) no pela a árbol, o el fichero atribuido no
  existe en ella, cuenta en «abreviadas rotas» con un motivo que nombre la revisión, y nunca bloquea
  (`openspec/specs/citas-verificables/spec.md:215-216` en `8222dd9`). El único caso de hoy es la
  abreviada «128 en habilitar_servicio» de la línea 167 de docs/sdd/Puntos_para_Gerencia_2026-09-11.md:
  sale como informativa. Que `REVISION_RE` (`apps/desk/server/citas/cosecha.ts:60` en `8222dd9`) acepte
  cualquier palabra como ancla queda FUERA de alcance y se anota como hallazgo (que el cierre añada a
  `hallazgos_que_siguen_vivos`).
- **Fuera de alcance también:** la cita del test de transitionExec a rows.ts anotada en el triaje, y
  cualquier barrido semántico de `openspec/specs`.

---

## 3 · Alcance

### Entra

1. **Cuarta rama de `rotura()`**: final en línea vacía, motivo `extremo final en línea vacía`. Vale para
   la completa (cada candidata, `apps/desk/server/citas/detector.ts:267` en `8222dd9`) y para la abreviada
   (`apps/desk/server/citas/detector.ts:200` en `8222dd9`).
2. **Herencia del ancla en la cosecha**, con las reglas de (b).
3. **Lectura de la abreviada en su ancla** (propia o heredada) y el **fallo de ancla** a abreviadas rotas (d).
4. **Las tres reparaciones** del §5, antes o junto al commit que activa la cuarta rama.
5. **Delta de `citas-verificables`** (c): RQ-CV-08 y RQ-CV-06 modificados.
6. **Pruebas** del §6 y **cierre** del §9.

### No entra

- `REVISION_RE` aceptando cualquier palabra: hallazgo para `hallazgos_que_siguen_vivos` (d).
- Reparar la abreviada de habilitar_servicio: sale informativa por (d), y es el control real del fallo de ancla.
- La cita del test de transitionExec a rows.ts y cualquier barrido semántico de `openspec/specs`.
- Una cifra nueva en el informe: (d) fija «abreviadas rotas». Hipótesis: `apps/desk/server/citas/informe.ts` no cambia.
- `apps/desk/server/citas/resolucion.ts`: no interviene en ninguno de los dos defectos.
- **Observación, no reparación obligatoria:** la abreviada gemela de la línea 20 de routes/directory.ts
  (dice del 62 al 67) tiene el mismo desfase que la reparación 1, pero es huérfana —no hay fichero antes
  en su línea— y no bloquea. Que la tome o no lo deciden `sdd-design`/`sdd-tasks`.

---

## 4 · Enfoque

### Pieza 1 · La cuarta rama, y su POSICIÓN (regla de mutación 1)

Va **después** de la tercera. Dos posiciones cambian el motivo sin cambiar el bloqueo, y hay que fijarlas:

- **Antes de la tercera:** con los dos extremos vacíos el motivo pasaría a nombrar el final.
- **Antes de la segunda:** `lineaVacia` devuelve verdadero para `undefined`
  (`apps/desk/server/citas/detector.ts:87-89` en `8222dd9`), así que un final fuera de rango se informaría
  como «en línea vacía». La prueba de hoy **no lo caza**: sólo exige que el motivo contenga «final»
  (`apps/desk/server/citas/detector.test.ts:38` en `8222dd9`), y lo mismo la del inicial
  (`apps/desk/server/citas/detector.test.ts:50` en `8222dd9`).

La regla de RQ-CV-03 no cambia (`apps/desk/server/citas/detector.ts:270-278` en `8222dd9`): una candidata
con final vacío pasa a contar como rota, y la ambigua bloquea sólo si lo está en todas.

### Pieza 2 · La herencia, en la cosecha

Junto al último fichero válido se guarda **el ancla de la completa que lo fijó**. Se reinicia cada vez
que cambia la atribución: completa válida (toma su ancla o ninguna), completa que no resuelve (corte 1,
ya deja la atribución vacía) y mención que resuelve (corte de (b)). El corte por barra de celda ya deja
huérfana la abreviada (`apps/desk/server/citas/cosecha.ts:137-141` en `8222dd9`). El ancla propia gana.
El campo `ancla` de `CitaAbreviada` ya existe (`apps/desk/server/citas/cosecha.ts:27-36` en `8222dd9`):
hipótesis, no hace falta tipo nuevo; `sdd-design` decide si distingue propia de heredada para el motivo.

### Pieza 3 · La lectura, en el detector

La abreviada atribuida se lee en su ancla, en las dos pasadas. Tres salidas, ninguna bloquea:

| Caso | Hoy | Tras la tanda |
|---|---|---|
| Ancla que no pela a árbol | se lee en local | **abreviadas rotas**, motivo con la revisión |
| Fichero atribuido ausente en la revisión | se lee en local | **abreviadas rotas**, motivo con revisión y fichero |
| Sin ancla y contenido local ilegible | `noLegibles` (`apps/desk/server/citas/detector.ts:196-198` en `8222dd9`) | sin cambio |

`noLegibles` y `anclasSinResolver` conservan su semántica documentada
(`apps/desk/server/citas/detector.ts:43-48` en `8222dd9`): no se ensanchan.

### Invariante de conservación — se mantiene

La suma de `apps/desk/server/citas/detector.ts:53-56` en `8222dd9` no cambia de forma: la cosecha no crea
citas nuevas, sólo rellena un campo. Cada caso nuevo cae en **exactamente un** sumando:

| Caso nuevo | Sumando |
|---|---|
| Completa (o ambigua rota en todas) con final vacío | `bloqueantes` (o `informadas` si la base la absorbe; hoy la base está en 0) |
| Ambigua con final vacío en una candidata y otra válida | `saltadas.ambiguas`, como hoy |
| Abreviada heredada o con ancla propia, válida / rota en contenido | `comprobadas` / `abreviadasRotas` |
| Fallo de ancla de abreviada | `abreviadasRotas` — nunca `bloqueantes`, `noLegibles` ni `anclasSinResolver` |
| Abreviada con ancla pero sin atribución | `saltadas.huerfanas`, como hoy |

---

## 5 · Las tres reparaciones — verificadas por el orquestador en `8222dd9`

Las tres son **caso A** de la tabla de la regla de mutación 4: la frase sigue siendo cierta del árbol de
hoy. El historial de `git` es de segunda mano (Engram 601); lo del árbol de hoy se leyó en esta fase.

| # | Dónde | Qué afirma la frase | Evidencia | Reparación |
|---|---|---|---|---|
| **1** | Línea 197 de apps/desk/server/admin.test.ts, **sólo el comentario**; cita directory.ts del 62 al 67 | «resolución de cliente por identidad, calcada de» ese rango | El comentario gemelo precisa «(contactos/cuentas de Zoho)» (`apps/desk/server/routes/directory.ts:19-24` en `8222dd9`). Esas rutas ocupan hoy `apps/desk/server/routes/directory.ts:74-79` en `8222dd9`. De segunda mano: `9ed5635` insertó 12 líneas encima, la ruta de clientes por id, y en su padre ocupaban 62-67; en el árbol de hoy ese bloque va de la 19 a la 30 con la línea en blanco, y 62 más 12 da 74, consistente. **La propuesta del analista (del 61 al 66) es INCORRECTA**: conserva la anchura pero apunta a la ruta de actividades (`apps/desk/server/routes/directory.ts:61-66` en `8222dd9`) | Ruta completa a routes/directory.ts, del 74 al 79 |
| **2** | Línea 189 de docs/sdd/Paquete_de_Despliegue_2026-09-10.md, fila 5 de la tabla de QA; cita vistas-tablero/spec.md del 35 al 40 | Dónde está el escenario que QA comprueba | Hoy el escenario «activos y cerrados, sin entrelazar» ocupa `openspec/specs/vistas-tablero/spec.md:35-39` en `8222dd9` y la 40 está vacía. De segunda mano: en `661c037`, que escribió la cita, ya era así | Sin ancla, ruta completa a openspec/specs/vistas-tablero/spec.md, del 35 al 39. La ruta completa quita además la ambigüedad con las dos copias archivadas |
| **3** | Línea 544 de openspec/specs/tickets-core/spec.md; cita migrate.ts del 70 al 74 | Ubicación de `PUBLIC_TABLES` | `PUBLIC_TABLES` ocupa `packages/zoho-sync/src/db/migrate.ts:70-73` en `8222dd9` y la 74 está vacía. Comprobado por el orquestador ejecutando `cosechar()` antes y después: las 10 abreviadas de las otras celdas de la fila siguen huérfanas por el corte de barra y ninguna pasa a atribuirse a migrate.ts | Ruta completa a packages/zoho-sync/src/db/migrate.ts, del 70 al 73 |

---

## 6 · El rojo primero (`strict_tdd: true`)

Referencias de hoy: `apps/desk/server/citas/detector.test.ts:6` en `8222dd9` (línea sola),
`apps/desk/server/citas/detector.test.ts:29` en `8222dd9` (final fuera de rango),
`apps/desk/server/citas/detector.test.ts:41` en `8222dd9` (inicial vacío) y el invariante
`apps/desk/server/citas/hook.test.ts:164-165` en `8222dd9`. El repositorio en memoria devuelve `null` para
una revisión que no tiene (`apps/desk/server/testing/reposDePrueba.ts:80-82` en `8222dd9`), así que el
caso «no pela» se puede montar sin `git`.

| # | Prueba | Hoy (rojo literal esperado) | Tras la tanda |
|---|---|---|---|
| **P1** | Espejo del final vacío en una completa: rango del 1 al 3, la 1 con contenido y la 3 vacía | Pasa: `bloquea` es `false` y `comprobadas` 1 → `expected false to be true` | Bloquea; motivo exacto `extremo final en línea vacía` |
| **P2** | Final vacío en una ambigua: dos candidatas, una con la 3 vacía y otra con dos líneas | Se salta: `saltadas.ambiguas` 1 → `expected false to be true` | Bloquea como `ambigua, rota en sus 2 candidatas` |
| **P3** | Posición (regla 1): los dos extremos vacíos; y final fuera de rango con motivo exacto | Los dos extremos: nace verde (motivo inicial). Fuera de rango: nace verde | Se fija el motivo **exacto**, no «contiene final» |
| **P4** | Herencia: completa anclada a `rev1` y abreviada a la 3, vacía en local y con contenido en `rev1`; y el signo contrario | `abreviadasRotas` 1 (se lee en local); el contrario sale comprobada | Comprobada; el contrario, rota |
| **P5** | Ancla propia gana: local y `rev1` con la 3 vacía, `rev2` con contenido, abreviada con ancla `rev2` | `abreviadasRotas` 1 | Comprobada |
| **P6** | Corte por mención: completa anclada a `rev1`, mención de otro fichero, abreviada; `rev1` no tiene ese fichero | Comprobada (se lee en local) | Comprobada. **Nace verde** (hipótesis a confirmar en apply) |
| **P7** | Fallo de ancla: (i) ancla propia a una revisión inexistente; (ii) revisión existente sin el fichero atribuido | Comprobada en los dos: `abreviadasRotas` 0 → `expected [] to have a length of 1 but got 0` | `abreviadasRotas` 1 con la revisión en el motivo; `bloquea` `false`; `noLegibles` 0 |
| **P8** | Invariante: un caso de cada camino nuevo suma `cosechadas` | Hipótesis: nace verde (la suma ya cuadra, los casos caen en otro sumando) | Verde; su detector es la mutación M5 |

**Mutaciones que ponen rojo lo que nace verde** (reglas de mutación 1 y 2):

| # | Mutación | Detector que debe ponerse rojo |
|---|---|---|
| **M1** | Cuarta rama antes de la tercera | P3, los dos extremos vacíos |
| **M2** | Cuarta rama antes de la segunda | P3, final fuera de rango con motivo exacto |
| **M3** | Quitar el reinicio del ancla en la rama de mención | P6: hereda `rev1`, fallo de ancla, `abreviadasRotas` 1 |
| **M4** | Invertir la precedencia (la heredada gana) | P5 |
| **M5** | Mandar el fallo de ancla a `noLegibles` o a `candidatosDeBloqueo` | P7 y P8 |
| **M6 · fichero vigilado** (regla 2) | Devolver al árbol el texto viejo de cualquiera de las tres reparaciones | El hook contra el propio repositorio bloquea; reparado, sale 0 |

---

## 7 · Orden de commits

| # | Commit | Condición |
|---|---|---|
| 0 | Planificación: esta propuesta, delta de spec, `design.md`, `tasks.md` | **Antes** de que el intento de `sdd-apply` adquiera |
| 1 | Reparaciones de las tres citas | Antes o junto al 3; verde con el detector de hoy |
| 2 | Pruebas en rojo | Rojo literal del §6 |
| 3 | Implementación | Verde; activa la cuarta rama y la lectura en el ancla |
| 4 | Cierre (§9) | Barrido y registros |

Hipótesis operativa: los commits 2 y 3 viajan en el mismo push, para que el CI no vea el rojo aislado.

---

## 8 · Previsión de tamaño (contra `8222dd9`, presupuesto 800)

Medida real (regla del ciclo 2): `git diff --shortstat` contra `8222dd9` más `wc -l` de lo nuevo sin
trackear. **Todas las cifras son hipótesis** salvo la de esta propuesta, medida al escribirla.

| Bloque | Pieza | Líneas |
|---|---|---|
| **(i) Planificación** — commit 0, fuera de los intentos | `proposal.md` | 328 (medido) |
| | Delta de spec: RQ-CV-06 copiado entero (107) más 4 escenarios; RQ-CV-08 (29) más 2 | 190-240 |
| | `design.md` | 150-300 |
| | `tasks.md` | 120-220 |
| | **Subtotal (i)** | **~790-1090** |
| **(ii) Ledger de apply** | Reparaciones (3 líneas, más 1 si design toma la gemela) | 6-8 |
| | Pruebas: 8 `it` a 9-25 líneas (mediana y máximo, medidos por el orquestador) más asertos endurecidos | 75-210 |
| | `cosecha.ts` (prototipo +4/−1) y `detector.ts` (prototipo +3/−2), más motivo con revisión y fallo de ancla | 25-60 |
| | `apply-progress.md`, nuevo sin trackear (ceguera 1 del ledger) | 60-150 |
| | **Subtotal (ii)** | **~170-430** |
| **(iii) Cierre y archivo** | Barrido de la regla 4, `CLAUDE.md`, `openspec/config.yaml` | 20-70 |
| | `verify-report.md` y `archive-report.md` | 250-400 |
| | Fusión del delta en `openspec/specs/citas-verificables/spec.md` | 40-90 |
| | **Subtotal (iii)**, sin contar el traslado a `archive/` | **~310-560** |

**Riesgo contra 800:** (ii) **bajo**. (iii) **medio** sólo si el traslado de la carpeta a `archive/` se mide
como borrado más alta: sumaría dos veces (i). Con `delivery_strategy: ask-on-risk` esto **sólo se señala**.

---

## 9 · Cierre

1. **Barrido de la regla de mutación 4** sobre `apps/desk/server/citas/detector.ts` y
   `apps/desk/server/citas/cosecha.ts`: grep de citas completas (hoy 34 líneas en 6 ficheros, medido con
   Grep en esta fase; 14 son de la exploración, ancladas) y segundo pase de abreviadas en los ficheros que
   ya los citan. Cada resultado se resuelve por su caso A, B o C, leyendo la frase.
2. **Retirar los dos hallazgos** de `hallazgos_que_siguen_vivos` (`openspec/config.yaml:855` en `8222dd9`)
   y del párrafo de IV-10 (`CLAUDE.md:319-324` en `8222dd9`) como **caso C**: se conservan con su revisión
   y se añade qué los cerró.
3. **Añadir el hallazgo de `REVISION_RE`** a `hallazgos_que_siguen_vivos` (d).
4. **Actualizar las cifras del informe** que citen los documentos, si alguna cambia.

---

## 10 · Regla invariable 13

No toca `apps/desk/src`: el detector vive en `apps/desk/server/citas` y es código inerte fuera de producción.

---

## 11 · Capacidades

- **Nuevas:** ninguna.
- **Modificadas — `citas-verificables`:**
  - RQ-CV-08 (`openspec/specs/citas-verificables/spec.md:347-374` en `8222dd9`) gana el escenario del
    final vacío, simple y ambiguo, y la fijación del motivo exacto.
  - RQ-CV-06 (`openspec/specs/citas-verificables/spec.md:204-309` en `8222dd9`) gana la herencia del
    ancla, la precedencia de la propia, el corte por mención y el fallo de ancla.
  - RQ-CV-03 (`openspec/specs/citas-verificables/spec.md:121-125` en `8222dd9`) no cambia de texto: el
    escenario ambiguo nuevo lo ejercita.
  - Nota de forma: los dos requisitos se citan sin su línea en blanco final, porque tras la tanda un rango
    que termina en vacía bloquea.

---

## 12 · Áreas afectadas

| Área | Impacto |
|---|---|
| `apps/desk/server/citas/detector.ts` | Cuarta rama; lectura de la abreviada en su ancla; fallo de ancla |
| `apps/desk/server/citas/cosecha.ts` | Herencia del ancla y sus cortes |
| `apps/desk/server/citas/detector.test.ts`, `cosecha.test.ts`, `hook.test.ts` | P1-P8 |
| `apps/desk/server/admin.test.ts`, `docs/sdd/Paquete_de_Despliegue_2026-09-10.md`, `openspec/specs/tickets-core/spec.md` | Una línea cada uno (§5) |
| `CLAUDE.md`, `openspec/config.yaml` | Cierre (§9) |

---

## 13 · Riesgos

| # | Riesgo | Prob. | Mitigación |
|---|---|---|---|
| R-1 | La cuarta rama activa sin las reparaciones pone el hook en rojo contra el repositorio | Alta si se desordena | Commit 1 antes o junto al 3; criterio 9 |
| R-2 | Artefactos nuevos de esta tanda con rangos que terminan en vacía, que la cuarta rama bloquearía | Media | Citas ancladas y comprobadas por los dos extremos; el hook corre sobre el árbol final |
| R-3 | Una abreviada heredada falsa se vuelve «válida por casualidad» en su ancla | Baja | Es la lectura que decidió Gerencia; P4 fija los dos signos |
| R-4 | Traslado a `archive/` medido como borrado más alta (§8) | Media | Sólo se señala (ask-on-risk) |
| R-5 | Dos tandas SDD en el mismo árbol se imputan líneas (regla del ciclo 2) | Media | Una tanda por árbol; worktree si hace falta otra |
| R-6 | Cifras del §1 de segunda mano | Cierta | `sdd-tasks` y `sdd-apply` las vuelven a medir |

---

## 14 · Supuestos que spec y design deben fijar

Lectura literal de (b), a confirmar por Gerencia sólo si spec o design la ven ambigua:

1. Una mención del **mismo** fichero no corta la herencia: la última completa válida sigue siendo la misma.
2. Una completa válida **sin ancla** posterior a una anclada deja la abreviada siguiente sin ancla.
3. El motivo de una abreviada heredada **rota por contenido** también nombra la revisión (hipótesis; (d) sólo lo exige para el fallo de ancla).

---

## 15 · Reversión

`git revert` de los commits 2 y 3 devuelve el detector de hoy. Las reparaciones del commit 1 **no se
revierten**: son válidas con cualquiera de los dos detectores. Sin efecto en datos ni en producción.

---

## 16 · Criterios de aceptación

1. Planificación commiteada antes de que el intento de `sdd-apply` adquiera.
2. `rotura()` bloquea el final vacío con motivo exacto `extremo final en línea vacía`, en completa simple y ambigua rota en todas.
3. P3 fija el motivo exacto; las mutaciones M1 y M2 lo ponen rojo.
4. La abreviada se lee en su ancla propia o, si no la tiene, en la heredada de la última completa válida de su línea física.
5. La herencia se corta con una mención de otro fichero (M3 en rojo) y cede ante el ancla propia (M4 en rojo).
6. El fallo de ancla va a abreviadas rotas con la revisión en el motivo, nunca bloquea y no toca `noLegibles` (M5 en rojo).
7. La abreviada de habilitar_servicio figura en abreviadas rotas como informativa.
8. El invariante de conservación se cumple con un caso de cada camino nuevo.
9. Las tres citas del §5 están reparadas en un commit anterior o igual al que activa la cuarta rama, y M6 se ejecutó.
10. Hook en verde contra el propio repositorio tras la tanda: 0 bloqueantes, 0 caducadas, base en 0.
11. `npm test`, `npm run typecheck` y `npm run lint` en verde.
12. Delta de `citas-verificables` con RQ-CV-08 y RQ-CV-06 modificados según (c).
13. Barrido de la regla 4 hecho; hallazgos retirados como caso C; hallazgo de `REVISION_RE` añadido.

---

## 17 · Dependencias

Ninguna bloqueante. La base en 0 (IV-10) es precondición y ya se cumple, de segunda mano (Engram 597).
