# F0-05 · Mecanismo de reconciliación y bandeja de entrada

**Fecha:** 2026-09-17 · **Decidido por:** Gerencia (Alfonso) · **Estado:** encargo escrito, tanda por proponer

Este documento fija cómo se detecta el desvío entre lo que se construye y lo que dicen el plan y el maestro, y cómo entra al plan una idea nueva. Son tres piezas. Ninguna inventa herramienta: las tres se apoyan en lo que `hook-citas-pre-push` (15/09) y `openspec/config.yaml` ya dejaron montado.

**El problema que resuelve, con sus cuatro casos reales.** No es que alguien se salte el plan; es que hay cinco sitios donde vive la verdad —código, `openspec/`, plan, maestro y las decisiones que se toman en conversación— y corren a velocidades distintas.

| Forma del desvío | Caso ya ocurrido |
|---|---|
| Trabajo sin fila | `citas-verificables`: capacidad entera, tres cambios, un IV propio, invisible para el plan y para `capabilities` |
| Trabajo con fila y otro nombre | `tercera-puerta-orden-venta` **es** F1A-08; el avance sigue publicando 10/51 |
| Decisión sin ruteo | La §7.3 de `Decisiones_Gerencia_2026-09-10.md` estuvo **siete días** sin destino; §7.2 y §7.4 igual |
| Documento que envejece en silencio | El maestro fija «cuatro estados de espera» (M1.3.4, glosario Anexo E); `ESTADOS_EN_ESPERA` tiene **once** |

El principio ya está escrito en `openspec/config.yaml` → `unidad_de_avance.trazabilidad`: *«el as-built no se recuerda: se verifica»*. Lo que faltaba era quién lo ejecuta y cada cuánto.

---

## Pieza 1 · Contrato de cabecera en cada `proposal.md`

Todo `openspec/changes/<nombre>/proposal.md` nace con esta cabecera YAML, antes de cualquier prosa:

```yaml
---
tanda: F1A-08                 # ID del §5 del plan, o el literal `fuera-del-plan`
motivo: ""                    # OBLIGATORIO y no vacío si tanda es `fuera-del-plan`
capacidad: [remisiones, tickets-core]
maestro: ["M4.4", "nº 52"]    # pasajes del maestro que lo justifican; [] si ninguno
cierra: si                    # si | no — ¿deja la fila TERMINADA, o sólo avanza una parte?
toca_maestro: si              # si | no — ¿el maestro queda desactualizado al terminar?
---
```

**Qué hace exigible cada campo.**

- `tanda` — cierra el caso «trabajo con fila y otro nombre». Un cambio que realiza el contenido de una fila del §5 **lleva su ID**. Si no lo lleva, es trabajo fuera del denominador y tiene que decirlo.
- `motivo` — cierra el caso «trabajo sin fila». Un `fuera-del-plan` sin motivo escrito no se archiva.
- `capacidad` — alimenta la comprobación 1 del barrido. Una capacidad que aparece aquí y no está en `config.yaml → capabilities` es una capacidad huérfana, y se caza el mismo día en que nace.
- `maestro` — cierra «decisión sin ruteo» por el otro extremo: obliga a nombrar el pasaje que justifica el trabajo.
- `cierra` — **el campo que faltaba, y lo enseñó el propio retroajuste.** `vista-todos-y-estados-en-espera` hace contenido de F1B-08 y no la termina; sin este campo, «lleva el ID de la fila» y «la fila está cerrada» son la misma afirmación, y no lo son. Con él, el numerador cuenta sólo los `cierra: si` y la fila sigue parcial mientras haya trabajo suyo pendiente.
- `toca_maestro` — alimenta el expediente R08.x. Al cerrar cada revisión, la lista de cambios con `toca_maestro: si` **es** el índice de la clase A, en vez de reconstruirse a mano.

**Dónde se impone.** Regla escrita en `CLAUDE.md`, y comprobación añadida al hook de pre-push ya instalado y versionado por `hook-citas-pre-push`. La comprobación es de forma, no de criterio: existe la cabecera, los campos están, `motivo` no está vacío cuando toca. Si falla, el push no sale.

**Retroactividad.** Los ocho cambios ya archivados **no se reescriben**. Se les añade la cabecera en un único barrido declarado como tarea de la propia F0-05, con `tanda:` rellenado según el dictamen de Gerencia del punto siguiente.

**Dictamen que abre esto — DECIDIDO EL 17/09: SÍ.** Un trabajo cuenta como la tanda cuyo contenido realiza, aunque su carpeta se llame de otra manera (`decision/tanda-por-contenido`, E-001 de `docs/sdd/ENTRADA.md`). Consecuencia inmediata: `tercera-puerta-orden-venta` es **F1A-08**, el avance pasa a **11 / 51** y `orden-precedencia-guardas` será **F1B-10** por la misma regla.

**Lo que la decisión cuesta de verdad, y no es sólo el retroajuste.** Al proponerla se dijo que lo único que costaba era repasar los ocho archivados. Eso es el coste mecánico —diez minutos— y no el coste real. Hay tres, y los tres se cierran aquí porque F0-05 todavía no está construida:

1. **Cobertura parcial.** Ya resuelto arriba con el campo `cierra`. Sin él, la regla convierte cada cambio parcial en una discusión.

2. **El numerador ahora se mueve por dos razones distintas, y hay que decir cuál.** El 17/09 pasó de 10 a 11 sin que nadie escribiera código: lo movió un dictamen. Es correcto, pero un lector que vea la serie sin más creerá que fue un día productivo. **Regla:** cada corte publica su numerador con el motivo del cambio —`por trabajo` o `por dictamen`—, igual que el denominador ya va fechado. El parte lo escribe; `unidad_de_avance` lo recoge como regla (d), junto a las tres que ya tiene.

3. **La afirmación es autocertificada, y ése es el riesgo serio.** El `tanda:` lo escribe el mismo agente que hace el trabajo, y nada lo comprueba. `verify: pass` demuestra que el cambio hizo lo que decía **su propio** `tasks.md`, no lo que pide la fila del plan: son dos documentos y nadie los enfrenta. Antes del dictamen no importaba, porque reclamar un ID no daba nada; ahora da una tanda cerrada. **Dos guardas, las dos baratas:** (a) el `archive-report.md` de todo cambio con `tanda:` declara en una línea qué parte del contenido de esa fila cubrió y qué dejó fuera —es lo que sostiene el `cierra`—; (b) la comprobación 2 de `npm run reconcile` marca como **sin verificar** toda fila dada por cerrada cuya `maestro:` no cite ninguna de las fuentes que el §5 declara para ella. No lo rechaza: lo enseña, que es lo que hace un barrido.

**Lo que la decisión NO cuesta**, y conviene decirlo porque fue la correcta: no obliga a rehacer nada, no reabre ninguna tanda, y la alternativa era peor — el trabajo hecho y el plan diciendo que no, indefinidamente.

---

## Pieza 2 · El barrido, en dos niveles

### 2.a · Determinista — `npm run reconcile`

Un comando que escribe **un solo fichero**, `docs/sdd/RECONCILIACION.md`, con la fecha y el commit contra el que se midió. Seis comprobaciones, todas sin criterio: o cuadran o no.

| # | Comprueba | Estado hoy (17/09) |
|---|---|---|
| 1 | `config.yaml → capabilities` **vs** `openspec/specs/*/spec.md` en disco | **15 declaradas · 9 ficheros · 2 huérfanas** (`citas-verificables`, `vistas-tablero`) |
| 2 | Tandas del §5 **vs** cabeceras `tanda:` de los changes archivados | El numerador real del avance. Hoy publica 10; con el dictamen, 11 |
| 3 | Cambios con `tanda: fuera-del-plan`, con su motivo | Hoy siete, sin motivo escrito en ninguno |
| 4 | IVs vivos sin destino · gates sin sesión · claves `decision/*` sin fila en §4.5 | **5 IV vivos** (2 con destino, 3 sin) · **6 claves** sin fila |
| 5 | **Cifras ancladas**: números que el maestro fijó a mano y el código puede haber movido | esperas **4 / 11** · pasos **38 / 36** · transiciones 34 · estados 21 |
| 6 | Ficheros de `docs/sdd` sin trackear en git | Seis, uno de ellos el propio `R08.3_Expediente_de_cambios.md` |

**Diseño.** Mismo patrón que el detector de citas (`apps/desk/server/citas/cli.ts`): lee ficheros, no interpreta. Salida estable y ordenada, para que el `git diff` del fichero **sea** la lista de desvíos nuevos desde la última pasada. Exit code ≠ 0 sólo si la comprobación 1 o la 3 encuentran algo, que son las dos que significan trabajo huérfano.

**La comprobación 5 necesita una lista, y es la única parte que exige criterio humano.** Se escribe una vez, en `openspec/config.yaml` bajo una clave nueva `cifras_ancladas`, con esta forma: qué número, dónde lo dice el maestro, de dónde se saca el del código, y si divergir es un error o una diferencia legítima de criterio —las esperas son el segundo caso: el maestro cuenta *estados sin salida de emergencia* y el código registra *estados cuya espera es externa*, y el problema no es que difieran sino que **llevan el mismo nombre y nadie lo escribió**.

### 2.b · Semántico — el parte, lunes y jueves 07:00

Tarea programada que corre fuera de la terminal, con acceso a `docs/sdd` y `openspec`. En cada corte:

1. Ejecuta o lee `RECONCILIACION.md` y toma su `git diff` desde el corte anterior.
2. Lee el `git log` del periodo, los changes nuevos y los cambios de `config.yaml`.
3. Compara contra el maestro vigente y el plan —**esta parte exige leer, y es la que lo determinista no caza**: «el maestro dice X y el código hace Y» cuando X no es un número.
4. Triaja lo que haya entrado en `ENTRADA.md` desde el corte anterior y propone destino para cada entrada.
5. Escribe `docs/sdd/Parte_YYYY-MM-DD.md` —**una página, no nueve**— y lo entrega.

**Regla del parte:** cada desvío va con el comando que lo comprueba. Sin desvíos, el parte es una línea. Un parte que no cabe en una página significa que el corte anterior falló, y eso se dice en el propio parte.

**Por qué lunes y jueves, y no «tiempo real».** Un observador que mire cada commit no sirve: el desvío no se ve en un commit, se ve en el agregado. El lunes prepara la semana; el jueves deja a Gerencia lo pendiente antes del fin de semana. Latencia de horas, que es la útil.

---

## Pieza 3 · `docs/sdd/ENTRADA.md` — una bandeja, tres salidas

El problema no es capturar la idea: es que llegue al sitio correcto de los cuatro. Forma fija por entrada:

```markdown
## E-014 · 2026-09-17 · idea
**Qué:** una frase, no un párrafo.
**De dónde viene:** chat del 17/09 · acta · Gustavo · medición en Zoho · revisión de código
**Afecta a:** módulo del maestro · tanda · capacidad · (nada todavía)
**Estado:** nueva → triada → ruteada → cerrada
**Destino:** —
```

**La regla dura, y es toda la pieza: toda entrada acaba en EXACTAMENTE UNO de tres sitios.**

1. Una fila del §5 del plan —existente o nueva—.
2. Un punto abierto del Anexo D, **con dueño y fecha**.
3. Un pasaje del expediente R08.x.

Si no cabe en ninguno de los tres, es que hay una decisión de alcance pendiente: se queda como punto abierto **con dueño**, nunca en el aire. Eso es exactamente lo que le faltó a la §7.3 y al servicio en sitio.

Una entrada `ruteada` no se borra: se marca, con su destino escrito. El fichero es el histórico de por dónde entró cada cosa.

---

## Reparto de responsabilidad

| Actor | Qué hace | Qué NO hace |
|---|---|---|
| **Claude Code** (terminal) | Construye. Declara la cabecera. Pasa el verify | **No decide alcance.** No inventa destinos para desvíos ni para entradas |
| **La sesión de supervisión** (fuera de la terminal) | Reconcilia, triaja, prepara decisiones. Verifica contra Zoho y contra producción cuando hace falta | **No construye.** No toca código |
| **Gerencia** (Alfonso) | Decide alcance | — |

Este reparto ya existe de hecho. Escribirlo es lo que lo hace exigible.

---

## Qué hay que hacer para ponerlo en pie

| # | Tarea | Quién | Bloquea a |
|---|---|---|---|
| 1 | ~~**Dictamen:** un cambio que realiza una fila del §5 cuenta como esa tanda~~ **HECHO 17/09 — sí** | Gerencia | — |
| 2 | Escribir la cabecera en `CLAUDE.md` como regla | Claude Code (F0-05) | 3, 4 |
| 3 | Añadir la comprobación de forma al hook de pre-push | Claude Code (F0-05) | — |
| 4 | Retroajustar la cabecera en los ocho changes archivados | Claude Code (F0-05) | Comprobación 2 del barrido |
| 5 | Escribir `cifras_ancladas` en `config.yaml` | Gerencia + Claude Code | Comprobación 5 |
| 5b | Añadir la regla (d) a `unidad_de_avance`: el numerador se publica con su motivo, `por trabajo` o `por dictamen` | Claude Code (F0-05) | Que la serie de avance sea legible |
| 5c | Las dos guardas del autocertificado: línea de cobertura en el `archive-report.md`, y marca «sin verificar» en la comprobación 2 | Claude Code (F0-05) | Que `tanda:` no sea una declaración sin contraste |
| 6 | Construir `npm run reconcile` con las seis comprobaciones | Claude Code (F0-05) | El parte determinista |
| 7 | Crear `docs/sdd/ENTRADA.md` y sembrarlo | hecho el 17/09 | — |
| 8 | Tarea programada del parte, lunes y jueves 07:00 | hecho el 17/09 | — |
| 9 | Versionar `docs/sdd` | Gerencia | Que el barrido 6 deje de tener trabajo |

**Talla propuesta de F0-05: S.** Son cinco tareas de fichero y una de script, sin lógica de dominio. Se propone como tanda de Fase 0 aunque F0 esté cerrada, porque es cimiento de método y no de producto: lo mismo que fueron F0-01 a F0-04.
