# Apply progress — detector-citas-extremos

Ejecutado el 2026-09-15. Citas en prosa a propósito: este fichero lo barre el hook, y los ejemplos de
citas rotas en forma de cita bloquearían.

## Intentos del ledger

| Intento | Estado | Qué pasó |
|---|---|---|
| 1 (ordinal 1, presupuesto 800) | `interrupted`, `blocked(maintainer_decision)`, 843 líneas contadas | Otra ventana commiteó 485 líneas ajenas en el mismo árbol durante el intento (expediente R08.3 y su reparación). El ledger mide el ÁRBOL, no el cambio: de las 843, sólo 358 eran de la tanda |
| Reset | Aplicado por Alfonso | Contador a 0; el árbol de referencia pasa a ser el de hoy |
| 2 (ordinal 2, presupuesto 800) | En curso | Cubre los commits 3 y 4 |

## Commits

| # | Sha | Contenido | Tamaño medido |
|---|---|---|---|
| 1 | `2a4c75a` | Las cinco reparaciones de citas y la anotación del triaje de B3 | 6 + / 6 − |
| 2 | `d8cf56c` | El rojo: DCE-P1 a DCE-P8, las siete filas de herencia y los tres asertos de H6 | 319 + / 27 − |
| 1b | `ff5ec4d` | Reparación nacida después: la cita del expediente R08.3 que terminaba en línea vacía | 1 + / 1 − |
| 3 | `9ed0254` | La implementación: cuarta rama de rotura(), lectura de la abreviada en su ancla, motivo con extremo | 79 + / 28 − (con tasks.md) |
| 4 | este | Cierre: barrido de la regla 4, los dos hallazgos como caso C y el alta del de REVISION_RE | — |

Tamaño contra el inicio del intento 2, medido con `git diff --shortstat` más `wc -l` de lo nuevo sin
trackear: **109 líneas** al cerrar el commit 3 (80 inserciones, 29 borrados, 0 ficheros nuevos sin
trackear), muy por debajo del corte de 560 que fijaba el plan.

## El rojo del commit 2 — 16 pruebas, verificado antes de implementar

`npx vitest run apps/desk/server/citas`: 16 fallidas y 98 pasadas, con producción intacta.

- DCE-P1, final vacío en una completa: `expected false to be true` sobre `bloquea`.
- DCE-P2, final vacío en una ambigua: mismo booleano; el segundo signo nace verde.
- DCE-P4 (i): `expected [ … ] to have a length of +0 but got 1`.
- DCE-P4 (ii), (iii) y los tres asertos de H6: fallan por el literal del motivo, que hoy sale sin el extremo.
- DCE-P5, DCE-P6 (b): la abreviada se leía en el sha local.
- DCE-P7 (i) y (ii): `expected [] to have a length of 1 but got +0`.
- DCE-P8: el total y la suma **pasan hoy**; sólo el desglose exacto se pone rojo, que es lo que el diseño
  predecía y lo que separa a DCE-M5 de una mutación invisible.
- Nacen verdes, como control: DCE-P3 entera, el segundo caso de DCE-P2, DCE-P6 (a) y cuatro filas de cosecha.

## Las mutaciones, tras el verde y antes del push

Procedimiento: copia fuera del repositorio, mutación, prueba nombrada en rojo, restauración y `cmp`.
Las once se restauraron con `cmp` en verde.

| Mutación | Prueba que se pone roja |
|---|---|
| DCE-M1, cuarta rama antes de la tercera | DCE-P3 (c) |
| DCE-M2, cuarta rama antes de la segunda | el aserto endurecido del extremo final fuera de rango |
| DCE-M3, la mención de otro fichero no reinicia | DCE-P6 (a) y la fila (d) |
| DCE-M4, la heredada gana a la propia | DCE-P5 y la fila (g) |
| DCE-M5, el fallo de ancla a «no legibles» | DCE-P7 (i) y (ii), y el desglose de DCE-P8 |
| DCE-M7, la completa sin ancla conserva la vigente | DCE-P4 (iii) y la fila (b) |
| DCE-M8, la revisión inexistente deja de comprobarse antes | DCE-P7 (i), por el literal |
| DCE-M9, la abreviada propaga su ancla propia | la fila (g) |
| DCE-M10, el corte 1 no reinicia el ancla | la fila (c) |
| DCE-M11, la abreviada pregunta al árbol sin caché | el contador de DCE-P4 (i): esperaba 1 y salieron 4 |

**DCE-M6**, sobre los ficheros vigilados reales, con un commit temporal (`git stash create`) porque el
detector lee el árbol commiteado y no el de trabajo:

- Reparaciones nº 1, 2 y 3: **rojas**, salida 1, con los motivos de ambigua rota en sus 2, 3 y 3 candidatas.
- Reparaciones nº 4 y 5: **verdes, medidas**, como declaraba el diseño. La nº 4 es un error de referente
  con las dos líneas del rango con contenido, y la nº 5 es una abreviada huérfana: el detector no las ve.
  Su vigilancia es lectura humana, y así queda registrado en el hueco H2.

## Efecto medido en el árbol real

| Cifra | Detector de hoy | Con la tanda |
|---|---|---|
| comprobadas | 1856 | 1861 |
| abreviadas rotas | 16 | 11 |
| bloqueantes | 0 | 0, tras reparar la cita nueva |

Cinco abreviadas reales dejan de figurar como rotas: se leían en el sha local en vez de en su ancla
heredada. Y la cuarta rama cazó en su primer barrido una cita rota del expediente R08.3, commiteado esa
misma tarde: es R-1 de la propuesta materializado, reparado en el commit 1b.

La abreviada de la línea 167 del documento de puntos para Gerencia sale, como pedía el criterio 7, en la
lista de abreviadas rotas con el motivo de revisión inexistente, porque su «ancla» es un nombre de función.

## Desviaciones y avisos

1. **`npm test` sale con código 1 sin ninguna prueba fallida**: 1131 pasan, 2 se saltan, y vitest añade un
   error de infraestructura (`Timeout calling "onTaskUpdate"` en un worker). Comprobado dos veces contra el
   árbol sin la tanda: ya salía igual. Es del entorno local, y el CI no lo reproduce.
2. **Una reparación nueva, no prevista** (commit 1b): la del expediente R08.3. Las reparaciones del commit 1
   se calcularon antes de que ese documento existiera, y la propia regla nueva lo cazó.
3. `typecheck` en verde y `lint` en 158 avisos, justo el techo del CI.
