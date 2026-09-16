# Apply progress — detector-citas-extremos

Ejecutado el 2026-09-15. Citas en prosa a propósito: este fichero lo barre el hook, y los ejemplos de
citas rotas en forma de cita bloquearían.

## Intentos del ledger

| Intento | Estado | Qué pasó |
|---|---|---|
| 1 (ordinal 1, presupuesto 800) | `interrupted`, `blocked(maintainer_decision)`, 843 líneas contadas | Otra ventana commiteó 485 líneas ajenas en el mismo árbol durante el intento (expediente R08.3 y su reparación). El ledger mide el ÁRBOL, no el cambio: de las 843, sólo 358 eran de la tanda |
| Reset | Aplicado por Alfonso | Contador a 0; el árbol de referencia pasa a ser el de hoy |
| 2 (ordinal 2, presupuesto 800) | `passed`, 335 líneas | Cubre los commits 3 a 5 |
| 3 (ordinal 3, presupuesto 800) | **`failed`** | El `sdd-verify`: 2/2 requisitos, 22/22 escenarios, 12/13 criterios, 1 CRITICAL por `test_exit_code` 1 |
| Rescope a generación 4 | Firmado por Alfonso | Objetivo nuevo: la remediación. Arrastra `cumulative_attempts` 1 de 2, así que va a UN disparo |
| 4 (ordinal 4, presupuesto 800) | La remediación | Partir `hook.test.ts`, barrido de citas y la clave de la configuración |

## Commits

| # | Sha | Contenido | Tamaño medido |
|---|---|---|---|
| 1 | `2a4c75a` | Las cinco reparaciones de citas y la anotación del triaje de B3 | 6 + / 6 − |
| 2 | `d8cf56c` | El rojo: DCE-P1 a DCE-P8, las siete filas de herencia y los tres asertos de H6 | 319 + / 27 − |
| 1b | `ff5ec4d` | Reparación nacida después: la cita del expediente R08.3 que terminaba en línea vacía | 1 + / 1 − |
| 3 | `9ed0254` | La implementación: cuarta rama de rotura(), lectura de la abreviada en su ancla, motivo con extremo | 79 + / 28 − (con tasks.md) |
| 4 | `a00f037` | Cierre: barrido de la regla 4, los dos hallazgos como caso C y el alta del de REVISION_RE | 14 + / 6 − |
| 5 | `4382789` | El registro de la medición del código 1 contra el árbol previo a la tanda | 75 + / 4 − |
| 6 | `058e4e7` | **La remediación:** partir `hook.test.ts` en dos por el bloque de la línea 396 | 238 + / 210 − |
| 7 | este | La clave de la configuración renombrada y este registro | — |

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

## El código 1 de `npm test` — medido, no supuesto

Ninguna prueba falla. El código 1 lo pone vitest, no la suite: es un error de infraestructura,
`[vitest-worker]: Timeout calling "onTaskUpdate"`, una llamada RPC del worker al proceso principal que
vence por tiempo. Sale como «Unhandled Error» después del recuento, y vitest convierte cualquier
unhandled error en salida distinta de 0 aunque el recuento esté limpio.

Siete mediciones, todas en esta máquina, el 2026-09-16:

| # | Árbol | Comando | Recuento | Código |
|---|---|---|---|---|
| 1 | `a00f037` | `npm test` | 1131 pasan, 2 se saltan, 0 fallan | **1**, con un `onTaskUpdate` |
| 2 | `a00f037` | `npx vitest run apps/desk/server/citas`, cuatro veces | 114 pasan, 0 fallan, las cuatro | **1** las cuatro veces |
| 3 | `a00f037` | el mismo con `--no-file-parallelism` | 114 pasan, 0 fallan | **1** |
| 4 | `a00f037` | la prueba lenta aislada, con `-t "por encima de 1 MB no se trunca"` | 1 pasa, 25 se saltan, 19,34 s | **0** |
| 5 | `a00f037` | `npx vitest run apps/desk/server/citas/hook.test.ts` | 26 pasan, 72,32 s | **1** |
| 6 | **`6be9cf0`**, worktree aparte | `npx vitest run apps/desk/server/citas`, cuatro veces | 94 pasan, 0 fallan, las cuatro | **0, 0, 1, 1** |
| 7 | **`6be9cf0`**, worktree aparte | `npx vitest run apps/desk/server/citas/hook.test.ts`, tres veces | 25 pasan, ~68 s | **1, 1, 1** |

Las mediciones 6 y 7 son las que faltaban, y se hicieron en un worktree separado, fuera del repositorio
y fuera de cualquier directorio temporal del sistema, con `npm ci --ignore-scripts` propio —el
`--ignore-scripts` evita que el `prepare` reinstale los hooks del árbol viejo en el `.git` compartido—.
Se borró al terminar y este árbol quedó idéntico: mismo HEAD y los mismos diez documentos sin trackear
que ya estaban antes.

**Veredicto: el código 1 es ANTERIOR a la tanda.** La medición 7 lo fija sin ambigüedad: en `6be9cf0`,
que es el árbol de partida, `hook.test.ts` sale en 1 con el mismo error las tres veces, con sus 25
pruebas en verde.

**Y la trampa del método, que conviene dejar escrita.** El protocolo pedía *una* corrida sobre
`6be9cf0`, y esa corrida dio **0** — igual que la segunda. De haber parado ahí, la conclusión habría
sido la contraria y la falsa: «lo introdujo la tanda». El fallo es intermitente, así que un solo
disparo no distingue «no ocurre» de «no ocurrió esta vez». Es el molde de siempre: un detector que no
caza todo lo que la afirmación abarca. Hicieron falta cuatro corridas para verlo, y la medición 7
—atacar el fichero culpable en vez de la carpeta— para dejarlo determinista.

**La causa, acotada por eliminación.** No es el paralelismo entre ficheros: la medición 3 lo desactiva
y el error sigue. No es la prueba lenta: la medición 4 la aísla y sale en 0. Es la duración acumulada
de `hook.test.ts` dentro de un único worker —unos 68-72 s—, que deja al proceso principal sin respuesta
más tiempo del que aguanta el RPC. Ese fichero nació en la tanda anterior, la del hook, y ya llegaba a
68 s en `6be9cf0`.

**Lo que sí cambió la tanda: la frecuencia, no el defecto.** Añadió una prueba a ese fichero (25 → 26)
y unos 4 s. Con eso la carpeta entera pasa de intermitente (1 en dos de cuatro corridas, medición 6) a
constante (1 en las cuatro, medición 2). El defecto es anterior; la tanda lo hace visible siempre.

El CI no lo reproduce, con un matiz que conviene no borrar: allí el paso no es `npm test`, es
`npm run test:coverage` (`vitest run --coverage`), sobre Linux y otra máquina. Su corrida sobre el
commit 4 salió en verde. O sea que la evidencia del CI dice «no ocurre con ESE comando en ESA máquina»,
no «el mismo comando sale en 0».

## La remediación del 2026-09-16 — partir `hook.test.ts`

El `sdd-verify` salió **FAIL** por este código 1: su Decision Gate («Test command exits non-zero →
CRITICAL») no admite excepción por causa, y el runtime nativo lo dijo con todas las letras —
`test_exit_code must be zero for archive readiness`—. Que el 1 sea anterior a la tanda es contexto,
no una eximente. Gerencia firmó el `rescope` a generación 4 y se hizo.

**La causa, medida y no configurable.** El RPC de vitest usa el `DEFAULT_TIMEOUT` de birpc, 60.000 ms,
y `hook.test.ts` tardaba 63-72 s en un solo worker. Cuando la llamada `onTaskUpdate` no se contesta a
tiempo, vitest la declara «Unhandled Error» después del recuento y el proceso sale distinto de 0
aunque no falle ninguna prueba.

**El corte está forzado, no elegido.** Midiendo el coste por bloque `describe` —parseando las
duraciones por prueba del reporter— el reparto sale así en orden de fichero:

| Acumulado | Bloque |
|---|---|
| 35,3 s | hasta el bloque de D12 inclusive (once bloques) |
| **+20,6 s** | **«ruta no ASCII y `git grep` por encima de 1 MB», DOS pruebas, el 27 % del fichero** |
| 75,7 s | el resto hasta el final |

Si ese bloque se queda arriba, el acumulado es 55,9 s y pasa del objetivo de 45. Si baja, arriba
quedan 35,3 y abajo 40,4. Ningún otro corte deja las dos mitades por debajo de 45: uno más tarde deja
el bloque grande arriba, y uno más temprano engorda la cola a 47,0. Es, además, el más pequeño que
cumple.

**Ni una aserción, ni un orden, ni un fixture cambian.** Sólo se mueven bloques `describe` completos,
los ocho del final, a `hook.bordes.test.ts`.

**Y ninguna línea de la mitad que se queda se desplaza.** El único import que quedaba sin usar arriba
era `spawnSync` —y la regla de lint que lo caza es **error**, no aviso, así que dejarlo habría tumbado
el CI—. Se sustituyó por un comentario de UNA línea que dice dónde fue el resto: documenta y conserva
el índice a la vez. El `git diff` tiene sólo dos hunks, las líneas 1-6 y la cola desde 393, y los once
bloques que se quedan están en líneas idénticas.

### Las doce corridas, antes y después

| Comando | Antes (sin partir) | Después |
|---|---|---|
| `hook.test.ts` solo | 26 pruebas · 67,7 / 70,5 / 68,7 s · **1, 1, 1** | 17 pruebas · 33,8 / 32,8 / 30,4 s · **0, 0, 0** |
| `hook.bordes.test.ts` solo | no existía | 9 pruebas · 39,9 / 40,5 / 41,6 s · **0, 0, 0** |
| la carpeta `citas` entera | 114 pruebas · 66,5 / 62,2 / 67,2 s · **1, 1, 1** | 114 pruebas · 41,0 / 39,4 / 38,7 s · **0, 0, 0** |
| `npm test` | 1131 + 2 saltadas · 68,3 / 68,0 / 57,3 s · **1, 1, 0** | 1131 + 2 saltadas · 47,6 / 46,3 / 45,7 s · **0, 0, 0** |

**El recuento no cambia:** 17 + 9 = 26, las mismas 26 de antes; 114 en la carpeta; 1131 pasadas y 2
saltadas en la suite. Ése es el control de `strict_tdd` de esta remediación: partir ficheros no cambia
comportamiento y no admite rojo previo, así que lo que se comprueba es que no se pierde ni se duplica
una sola prueba.

**Un dato del ANTES que conviene no perder:** `npm test` daba **1, 1, 0**, no siempre 1. Y la corrida
que pasaba era también la más corta —57,3 s frente a 68,3 y 68,0—: cuando la suite entera iba más
rápida, la llamada cruzaba por debajo de los 60 s. Es la misma causa vista por el otro signo, y por eso
el listón de esta remediación era que saliera 0 **las tres veces**, no una.

De propina, la suite entera baja de unos 68 s a unos 46 s de reloj: `hook.test.ts` era el camino
crítico de la corrida en paralelo.

### El barrido de la regla de mutación 4: cero reparaciones, medido

Partir un fichero muy citado es justo el caso que la regla 4 vigila. Se barrieron las **25** citas del
fichero seguidas de dos puntos y número que hay en el repositorio, y el resultado es cero trabajo, por
dos razones distintas:

- **23 apuntan por debajo del corte** y su contenido es **idéntico**, comprobado comparando el md5 de
  la primera y la última línea de cada rango antes y después (los dos extremos por separado, como
  manda la regla). No es que «la línea exista»: es que dice exactamente lo mismo.
- **2 cruzan el corte**, las dos en el informe de verificación archivado de `hook-citas-pre-push`, que
  vive bajo el directorio de archivo — una de las SEIS exclusiones del barrido del detector, así que
  ni se comprueban. Y son **caso B** bien puestas: ese informe declara en su cabecera que todas sus
  citas van contra su propia revisión. Se comprobó además que **ya estaban desfasadas antes de esta
  partición**: en el árbol anterior esa línea era una llave de cierre y el bloque que la frase nombra
  estaba ochenta líneas más abajo. Renumerarlas volvería falsa una frase fechada.

### La clave de la configuración de OpenSpec

La clave de IV-10 se llamaba `hallazgos_que_siguen_vivos` y su valor empezaba por «CERRADOS el
2026-09-15». El nombre decía lo contrario que el contenido, en el fichero que se carga en **cada**
sesión y en cada sub-agente. Renombrada a `hallazgos_cerrados_por_detector_citas_extremos`. El
hallazgo que sí sigue vivo ya tenía clave propia, `hallazgo_revision_re`, y se queda.

**Lo que NO se hizo, a propósito:** los nueve sitios de los artefactos de la tanda que nombran la clave
vieja no se tocan. Son registros fechados. En su lugar, la clave nueva lleva seis líneas de comentario
que dicen cómo se llamaba y por qué cambió, para que quien siga esas referencias no se quede sin hilo.

## Criterio de aceptación nº 11 — cerrado en sus dos mitades

El criterio dice «`npm test`, `npm run typecheck` y `npm run lint` en verde». «Verde» son dos cosas
distintas, y **desde la remediación del 2026-09-16 coinciden**:

| Mitad | Cifra | Estado |
|---|---|---|
| Ninguna prueba falla | 1131 pasan, 2 se saltan, **0 fallan** | **cumplida** |
| El proceso sale en N | **N = 0**, las tres corridas | **cumplida** |
| `npm run typecheck` | — | sale en **0** |
| `npm run lint` | 158 avisos, 0 errores — el techo exacto del CI, sin moverse | sale en **0** |

*Antes de la remediación esta tabla decía «N = 1 · no cumplida en la letra», y la razón —un
`Timeout calling "onTaskUpdate"` anterior a la tanda— estaba medida en siete mediciones. Se deja
escrito que estuvo así: el criterio no se declaró verde mientras salía en 1.*

## Desviaciones y avisos

1. **`npm test` salía con código 1 sin ninguna prueba fallida. CERRADO el 2026-09-16** partiendo
   `hook.test.ts`; las tres corridas salen en 0. Se conserva la historia porque es lo que explica la
   partición: era `Timeout calling "onTaskUpdate"` de vitest, medido en siete mediciones y quince
   corridas, anterior a la tanda —reproducido en el árbol de partida tres veces de tres sobre el
   fichero culpable—, y la tanda sólo elevó su frecuencia al añadir una prueba a ese fichero. *(Este
   punto decía antes «comprobado dos veces contra el árbol sin la tanda: ya salía igual», sin registrar
   comando ni cifras; luego se midió, y luego se arregló.)*
2. **Una reparación nueva, no prevista** (commit 1b): la del expediente R08.3. Las reparaciones del
   commit 1 se calcularon antes de que ese documento existiera, y la propia regla nueva lo cazó.
3. `typecheck` en verde y `lint` en 158 avisos, justo el techo del CI.
4. **Lo que hay que vigilar de la partición:** `hook.bordes.test.ts` es la mitad más ajustada,
   39,9-41,6 s contra un objetivo de 45 y un umbral real de 60. **La mitad de ese fichero es el bloque
   de 20,6 s.** Si ese bloque crece, es el que hay que volver a partir. No es deuda: es dónde mirar si
   el código 1 reaparece.
