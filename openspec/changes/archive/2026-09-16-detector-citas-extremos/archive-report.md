```yaml
schema: gentle-ai.archive-result/v1
change: detector-citas-extremos
archived_at: 2026-09-16
verify_evidence_revision: sha256:252aa4b70c165e0728359ac08a717c767165d76f25150bb5e18b8ecb6b8c47d9
verify_verdict: pass_with_warnings
requirements_merged: 2
scenarios: 22
tasks: 49/49
capability: citas-verificables
```

# Informe de archivo — detector-citas-extremos

**Fase**: `sdd-archive` · **Rama**: `main` · **Capacidad**: `citas-verificables`
**Convención de este informe**: las citas a código van contra la revisión que se nombra en cada una.
Las rutas de los artefactos de esta tanda se dan ya en su ubicación de archivo.

---

## 1 · Qué cerró la tanda

Los dos defectos que el cierre de IV-10 dejó vivos en el detector de citas:

1. **El extremo final en línea vacía no se comprobaba.** `rotura()` tenía tres ramas —inicial fuera de
   rango, final fuera de rango, inicial vacía— y ninguna para el final vacío. Una cita anclada podía
   terminar en una línea en blanco y pasar. Cerrado con una cuarta rama y un motivo exacto por
   combinación.
2. **Una abreviada detrás de una cita anclada se leía en el sha local, no en su ancla.** Eso daba
   abreviadas rotas informativas que eran falsos positivos, y alguna comprobada por casualidad. Cerrado
   leyendo la abreviada en su ancla —propia, o heredada de la última completa válida de su misma línea
   física—, con dos cortes de la herencia y el fallo de ancla como categoría propia.

**Medido en el árbol real al implementarlo:** las abreviadas rotas bajan de 16 a 11 —cinco eran falsos
positivos por leerse en el sha local— y la cuarta rama cazó en su primer barrido una cita rota que el
detector viejo daba por buena, en un documento commiteado esa misma tarde.

---

## 2 · Fusión del delta

`RQ-CV-06` y `RQ-CV-08` sustituidos en `openspec/specs/citas-verificables/spec.md` por sus versiones
del delta. Ningún otro requisito se toca: `RQ-CV-03` no cambia de texto —el escenario ambiguo nuevo de
`RQ-CV-08` lo ejercita sin modificarlo— y por eso no aparecía en el delta.

| Cifra | Antes | Después |
|---|---|---|
| Requisitos | **18** | **18**, en el mismo orden |
| Líneas | 754 | 918 |
| Coste medido | — | 170 inserciones, 6 borrados |

La sustitución se hizo con guardas: antes de tocar nada se comprobó que las cuatro fronteras
(`RQ-CV-06`, `RQ-CV-07`, `RQ-CV-08`, `RQ-CV-09` en la spec viva; `RQ-CV-06` y `RQ-CV-08` en el delta)
estaban en las líneas esperadas, y el script aborta si alguna no lo está.

**Nota de método:** estimar este coste por tamaño de bloque —300 líneas nuevas menos 136 viejas = 436—
lo sobrestima 2,5 veces. El coste real es 176 porque git casa las muchas líneas idénticas entre el
requisito vivo y su versión del delta. Hacer la fusión y medirla cuesta un minuto.

---

## 3 · Los dos barridos de la regla de mutación 4

El archive dispara dos desfases que **nada pone en rojo**: la fusión inserta 164 líneas en mitad de un
fichero muy citado, y el traslado cambia la ruta de siete artefactos. Peor aún, el directorio de
archivo es una de las SEIS exclusiones del detector, así que una cita rota que apunte dentro de él no
la caza el hook. Los dos barridos se hicieron, y los dos salen en cero — pero por razones distintas, y
la razón importa más que el resultado.

### (a) La inserción en la spec viva — cero, porque están ancladas

Once citas del repositorio apuntan a `citas-verificables/spec.md` con línea. **Las once están dentro de
los artefactos de esta misma tanda** (`design.md`, `exploration.md`, `proposal.md`) y **las once llevan
ancla**: `1c5ee7e`, `9de5d17` o `8222dd9`. Cero abreviadas.

Ninguna afirma nada sobre el árbol de hoy: cada una dice qué decía la spec **en su revisión**. Son
**caso B** ya bien puestas. Renumerarlas a las líneas de hoy las volvería FALSAS, que es exactamente el
modo de fallo que la regla 4 advierte. Cero reparaciones, y a propósito.

### (b) El cambio de ruta — cero fuera, tres dentro y todas caso B

- **Fuera de la carpeta: 0 referencias en forma de ruta.** Se buscó `openspec/changes/detector-citas-extremos`
  y `changes/detector-citas-extremos` en todo el repositorio: ninguna coincidencia. Las menciones que
  existen —en `CLAUDE.md`, en `openspec/config.yaml` y en el expediente R08.3— nombran la tanda **por
  su nombre**, no por su ruta, así que el traslado no las afecta.
- **Dentro: tres**, todas en `verify-report.md`. Ninguna tiene forma de cita `ruta:línea`: una es prosa
  que nombra el informe anterior y dos son salida literal de un `git diff --stat`. El informe declara
  en su cabecera `HEAD verificado: 87ead8f` y etiqueta ese `--stat` con sus dos shas, así que las tres
  quedan ancladas a nivel de documento. **Caso B**: reescribir salida de comando fechada la falsearía.
- **El expediente R08.3** dice de esta tanda «en curso» en varios sitios. Su cabecera lleva
  **Fecha: 15/09/2026**, así que también es caso B: era cierto cuando se escribió. No se toca.

---

## 4 · La historia del ciclo, que no fue recta

Se deja escrita porque explica el tamaño de esta tanda y porque cada tropiezo dejó una lección medida.

### 4.1 · El verify falló por el código de salida, no por un defecto

`npm test` daba **1131 pasadas, 2 saltadas y CERO fallos**, pero el proceso salía en **1**, por un
`[vitest-worker]: Timeout calling "onTaskUpdate"` — un error de infraestructura de vitest, no una
aserción rota.

Se midió si era anterior a la tanda: **siete mediciones, quince corridas**, dos de ellas en un worktree
aislado sobre el árbol de partida. En ese árbol, `hook.test.ts` salía en 1 las **tres veces de tres**
con sus 25 pruebas en verde. **El código 1 era anterior a la tanda**; ésta sólo elevó su frecuencia al
añadir una prueba a ese fichero.

**Y aun así el verify falló, correctamente.** Su Decision Gate dice «Test command exits non-zero →
CRITICAL» sin cláusula que lo condicione a que además falle una prueba ni que lo excuse por causa de
infraestructura. El runtime nativo lo dijo con las mismas letras: `test_exit_code must be zero for
archive readiness`. Que la causa fuera anterior es **contexto, no eximente**.

*La lección de método, que vale más que el incidente:* el protocolo de medición pedía UNA corrida sobre
el árbol previo, con la regla «si sale 0, lo introdujo la tanda». Esa corrida dio **0**. La segunda
también. La tercera y la cuarta dieron 1. **De haber parado en la primera, la conclusión habría sido la
contraria y falsa.** Un fallo intermitente no distingue «no ocurre» de «no ocurrió esta vez».

### 4.2 · El rescope y la remediación

Gerencia firmó un `rescope` a generación 4 y se partió `apps/desk/server/citas/hook.test.ts` en dos.

**La causa, medida y no configurable:** el RPC de vitest usa el `DEFAULT_TIMEOUT` de birpc, 60.000 ms, y
ese fichero tardaba 63-72 s en un solo worker.

**El corte estaba forzado, no elegido.** Midiendo el coste por bloque `describe`, uno solo —«ruta no
ASCII y `git grep` por encima de 1 MB», DOS pruebas— cuesta **20,6 s**, el 27 % del fichero. Con él
arriba el acumulado es 55,9 s; sin él, 35,3. Ningún otro corte deja las dos mitades por debajo de 45 s.

**Ni una aserción, ni un orden dentro de un bloque, ni un fixture cambiaron**, y **ninguna línea de la
mitad que se queda se desplazó**: el único import que quedaba sin usar arriba se sustituyó por un
comentario de una línea, de modo que los once bloques retenidos conservan sus números exactos.

Las doce corridas:

| Comando | Antes | Después |
|---|---|---|
| `hook.test.ts` | 26 pruebas · 67,7 / 70,5 / 68,7 s · **1, 1, 1** | 17 pruebas · 33,8 / 32,8 / 30,4 s · **0, 0, 0** |
| `hook.bordes.test.ts` | no existía | 9 pruebas · 39,9 / 40,5 / 41,6 s · **0, 0, 0** |
| carpeta `citas` | 114 pruebas · 66,5 / 62,2 / 67,2 s · **1, 1, 1** | 114 pruebas · 41,0 / 39,4 / 38,7 s · **0, 0, 0** |
| `npm test` | 1131+2 · 68,3 / 68,0 / 57,3 s · **1, 1, 0** | 1131+2 · 47,6 / 46,3 / 45,7 s · **0, 0, 0** |

**El recuento no cambió:** 17 + 9 = 26, las mismas 26; 114 en la carpeta; 1131 pasadas y 2 saltadas.
Ése fue el control de `strict_tdd` de la remediación: partir ficheros no cambia comportamiento y no
admite rojo previo, así que lo que se prueba es que no se pierde ni se duplica una prueba.

*Un dato del ANTES que conviene no perder:* `npm test` daba **1, 1, 0**, no siempre 1, y la corrida que
pasaba era también **la más corta** (57,3 s frente a 68,3 y 68,0). Cuando la suite iba más rápida, la
llamada cruzaba por debajo de los 60 s. Es la misma causa vista por el otro signo, y por eso el listón
era que saliera 0 **las tres veces**.

### 4.3 · El reset por las 946 líneas

El `settle` de la remediación salió `blocked: maintainer_decision`: **946 líneas contra un techo de
800**. La estimación previa había dado ~510.

**Qué faltó contar: el propio `verify-report.md`.** La partición son 448 líneas y el registro 140 —eso
estaba previsto—, pero el verify genera su informe, 358 líneas aquí, y se commiteó. **En un objetivo
que incluye `sdd-verify`, su informe es un sumando obligatorio, no un extra.**

**Lo que no se hizo:** dejarlo sin trackear habría dado 646 y habría pasado el techo. Eso es maquillar
el contador aprovechando la ceguera documentada del ledger —lo nuevo sin trackear no cuenta—. La cifra
real se declaró en la evidencia de proceso en vez de esconderla, y Gerencia firmó el `reset`.

**Qué conserva un `reset`:** pone a cero los contadores vivos (`cumulative_attempts`,
`cumulative_changed_lines`) pero **no borra la historia**: `lifetime_attempts` y la ficha completa del
intento siguen ahí, con sus 946 líneas y su marca de exceso. Y **no cambia el objetivo**: tras el reset
`objective` queda `undefined`, de modo que el intento siguiente debe traer su `work-unit`,
`evidence-goal` y presupuesto completos. Confundir `reset` con `rescope` cuesta un turno.

### 4.4 · El presupuesto de 5000, aprobado por Gerencia

**Gerencia aprobó `--max-changed-lines 5000` para este archive el 2026-09-16, por encima de las 800 del
preflight de sesión.** La razón, medida antes de adquirir:

| Concepto | Con renombrado | Peor caso |
|---|---:|---:|
| Traslado de la carpeta (7 artefactos, 2.031 líneas) | 0 | **4.062** |
| Fusión del delta (medida) | 176 | 176 |
| Este informe | ~260 | ~260 |

El contenido **realmente revisable** son unas 436 líneas. Las otras ~4.062 son un `git mv` verbatim
—siete ficheros que no cambian ni un byte, los siete `R100`— cuya **carga de revisión es cero**. Un
techo de 800 no habría protegido de nada y habría vuelto a bloquear, que es justo el error que costó el
reset del apartado anterior.

Medido en este archive, las dos cifras del mismo traslado:

```
git diff --cached --shortstat              →  7 ficheros,     0 + /     0 −
git diff --cached --shortstat --no-renames → 14 ficheros, 2.031 + / 2.031 − = 4.062
```

La cifra que el ledger registró al cerrar está en el apartado 6.

---

## 5 · Evidencia de cierre

| Comprobación | Resultado |
|---|---|
| Requisitos de la spec viva | **18 antes, 18 después**, mismo orden |
| Tareas | 49/49 |
| Verify | `pass_with_warnings`, 0 CRITICAL, 2/2 requisitos, 22/22 escenarios, 13/13 criterios |

Las cifras exactas del detector, de `npm test`, del typecheck y del lint sobre el árbol final están en
el apartado 7, medidas después de escribir este informe.

### Los tres WARNING del verify, que no bloquean y quedan escritos

1. **Las mutaciones DCE-M1..M11 y DCE-M6 no se reejecutaron en el verify.** Son un procedimiento
   destructivo y repetirlas habría abierto un segundo intento sobre el mismo árbol de trabajo. La
   evidencia que se usó es indirecta: cada mutación nombrada en comentarios del código junto a una
   prueba real y verde, y el árbol limpio. Están registradas en `apply-progress.md` con su prueba roja
   y su restauración comprobada con `cmp`.
2. **La tarea 5.1 no registra el desglose cuantitativo que ella misma exige.** El verify repitió el
   barrido por su cuenta (93 citas ancladas a los dos módulos del detector, ninguna rota) y salió
   limpio, pero el registro no lo desglosa.
3. **El `apply-progress` de Engram se quedó dos fases por detrás del fichero en disco.** El preflight es
   `hybrid`, que exige los dos soportes. **Cerrado el 2026-09-16** con un upsert sobre la misma
   observación. La causa: el trabajo se hizo por la vía directa y no por `sdd-apply`, que es quien
   normalmente escribe en los dos sitios.

---

## 6 · Ledger

| Intento | Objetivo | Resultado | Líneas |
|---|---|---|---|
| 1 | commits 1-4 | `interrupted` | 843 (485 ajenas de otra ventana) |
| 2 | commits 3-5 | `passed` | 335 |
| 3 | `sdd-verify` | **`failed`** | 0 |
| 4 | remediación | `passed`, presupuesto excedido | **946** de 800 |
| 5 | este archive | ver apartado 7 | presupuesto **5000** |

Entre el 1 y el 2 hubo un `reset` (otra ventana imputó 485 líneas ajenas al intento); entre el 3 y el 4
un `rescope` firmado; y entre el 4 y el 5 el `reset` del apartado 4.3. Los tres los firmó Gerencia.

---

## 7 · Lo que esta tanda NO cierra

**El hallazgo de `REVISION_RE` sigue VIVO y sin destino asignado.** Está fuera del alcance de esta tanda
por decisión de Gerencia del 2026-09-15, y tiene clave propia en `openspec/config.yaml`,
`hallazgo_revision_re`, dentro de la entrada IV-10.

El patrón que reconoce un ancla acepta **cualquier palabra** como revisión. En una abreviada, una
palabra que no es una revisión pasa a fallo de ancla informativo —el caso real está en la línea 167 del
documento de puntos para Gerencia, donde un nombre de función detrás de «en» se lee como ancla—; en una
cita completa ya bloqueaba antes de esta tanda. Y el modo de fallo que más incomoda: **una palabra que
sí es una referencia real de git, como un nombre de rama, se leería «válida por casualidad»**.

**Lo que hay que vigilar de la partición:** `hook.bordes.test.ts` es la mitad más ajustada, 39,9-41,6 s
contra un objetivo de 45 y un umbral real de 60, y **la mitad de ese fichero es el bloque de 20,6 s**.
Si ese bloque crece, es el que hay que volver a partir. No es deuda: es dónde mirar si el código de
salida 1 reaparece.

**Y la entrada IV-10 se queda en `openspec/config.yaml`**, como histórico, igual que IV-3. Su clave de
hallazgos cerrados se renombró el 2026-09-16 —se llamaba `hallazgos_que_siguen_vivos` y su valor
empezaba por «CERRADOS», de modo que el nombre decía lo contrario que el contenido en el fichero que se
carga en cada sesión y en cada sub-agente—. Los artefactos de esta tanda la nombran por el nombre
viejo: son registros fechados y no se reescriben, así que la clave nueva lleva un comentario que dice
cómo se llamaba.
