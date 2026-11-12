# Supuestos reversibles — lista semanal del 2026-11-12

**Fuera del plan.** Motivo: `decision/preguntas-de-detalle-sin-llegar`. Es la **segunda** lista. La primera,
`docs/sdd/Supuestos_semana_2026-11-02.md`, tenía 54 supuestos, y Gerencia los aceptó todos el 09/11/2026
(`decision/supuestos-02-11-aceptados`). Esta lista recoge los cambios archivados desde entonces y los supuestos que el
analista tomó fuera de un cambio.

## Qué es

Es la lista de las decisiones de detalle que la construcción tomó **sin preguntar**, como supuesto reversible, agrupadas
por tanda. Cada fila dice qué se decidió, cómo se deshace y dónde está escrito. Gerencia corrige las que no comparta; las
demás quedan aceptadas al vencer el plazo. La escribe la construcción y Supervisión la lleva al panel.

## La regla

Se cita por clave, no por línea.

- **`decision/preguntas-de-detalle-sin-llegar`** (Gerencia, 06/10/2026; `openspec/config.yaml` →
  `decisiones_de_gerencia_panel`): consecuencias (3) y (4), y la «Regla de las preguntas a Gerencia» de `CLAUDE.md`.
  - (3) Lo que no frena una fila lo decide la construcción con su criterio por defecto. Lo escribe como **supuesto
    reversible** y lo publica **cada semana en una lista agrupada por tanda**.
  - (4) La lista la escribe la construcción en `docs/sdd/` y Supervisión la lleva al panel. La fecha de aceptación es la
    de publicación en el panel más 7 días.
- **El plazo:** `decision/supuestos-semanales-aceptacion` (Gerencia, 17/10/2026): «de acuerdo; lo que no corrija en una
  semana queda aceptado.»
- **El filtro del apartado 06** (consecuencia (2) de la primera decisión): sube como pregunta sólo lo que impide cerrar
  una fila, toca al cliente, toca dinero, permisos o datos de producción, o no se deshace sin coste. Lo demás va en esta
  lista.

## Fecha de aceptación

**La fija Supervisión al publicar esta lista en el panel:** fecha de publicación más 7 días. Hasta ese día, toda fila que
no tenga otra fuente está «para corregir». Lo que Gerencia no corrija en ese plazo queda aceptado con esa fecha.

## Cómo se lee

| Columna | Qué dice |
|---|---|
| ID | El del artefacto de la tanda. Un ID repetido en dos tandas es otro supuesto |
| Qué se decidió | En una frase, sin jerga de código |
| Cómo se deshace | La alternativa que escribe el propio artefacto, salvo donde la sección diga lo contrario |
| Dónde | `ruta:línea` del artefacto archivado que lo declara |
| Estado | «para corregir», salvo que conste otro estado con su fuente: aceptado, decidido, corregido, retirado, sin objeto o superado por un cambio posterior |

**«Posible pregunta para el apartado 06»** marca un supuesto que, por el filtro de la regla, quizá no debería serlo.
**Sigue en la lista**: es Supervisión quien decide si además lo sube como pregunta.

**Las citas a ficheros que se editan en sitio llevan detrás la revisión en que se leyeron** («en» y el commit). Son `openspec/config.yaml`,
`docs/sdd/ENTRADA.md`, el plan, el expediente y las specs vivas, y sin la revisión cualquier commit posterior desplazaría
la línea sin que nada se pusiera rojo (regla de mutación 4). `6991d1e9` es el `main` sobre el que se escribe la lista. Las
citas a `openspec/changes/archive/` no la llevan, porque esas carpetas no se editan después de archivar.

---

## 1 · 1G-01 · `relleno-completo-conversaciones` (archivado el 2026-11-02)

Una pasada que lanza a mano un superadministrador, tras un interruptor que nace cerrado, recorre todos los tickets de Zoho que
Desk conoce —archivados incluidos—, trae su detalle y sus conversaciones y dice, ticket a ticket, si cuadran con los recuentos de
Zoho, con un resumen sin datos de cliente. Supuestos S-1 a S-15 en la §6 de la propuesta
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:104-122`), y S-16 a S-32 en los tres apartados
«Supuestos nuevos» de `apply-progress.md`, uno por lote
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:105-118`,
`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:234-248` y
`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:414-423`). La numeración sigue de un
artefacto a otro y ningún ID se repite, así que no llevan prefijo. El informe de archivo los enumera en su §6 sin decir
expresamente que vayan a esta lista, y afirma que ninguno cambia el alcance de la fila, cuesta dinero, toca datos de producción
o contradice una decisión registrada
(`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/archive-report.md:102-114`).

**Cómo se deshace:** S-8, S-14 y S-15 llevan «—» en la columna de la propuesta, y S-19, S-21, S-24 y S-27 no escriben
alternativa: en esas siete lo escribe esta lista a partir del propio supuesto. S-16 y S-31 dicen «no hay nada que deshacer».

**Lo que pasó después, y se señala en Estado:** `decision/calificaciones-y-borrados-de-zoho` (Gerencia, 08/11/2026;
`openspec/config.yaml:6494` en `6991d1e9`) corrige en parte S-9 y S-10, y lo construyó `calificaciones-cuadre-conversaciones` (fuera del plan,
archivado el 2026-11-09). Y la pasada ya corrió en producción el 03/11/2026: 783 tickets, 731 completos, 51 descuadrados y 1 que
no está en Zoho (`docs/sdd/ENTRADA.md:2410` en `6991d1e9`).

### 1.1 · Supuestos de la propuesta

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La pasada sólo se lanza con un interruptor nuevo, cerrado salvo que valga exactamente «true», que lee únicamente la App: el worker no registra estas rutas | Quitar el interruptor | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:108` | para corregir; que haya un interruptor que nace cerrado lo pide `decision/adelanto-09-11-empezar-1g`, consecuencia (5) (`openspec/config.yaml:5591` en `6991d1e9`): el supuesto es su nombre y su sitio |
| S-2 | Lanzar deja la pasada corriendo en segundo plano y consultar nunca la arranca; las dos cosas son sólo del superadministrador; con el interruptor cerrado se responde «sin permiso» antes de mirar los parámetros, y con una pasada en marcha no se lanza otra | Retirar la ruta | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:109` | para corregir |
| S-3 | Pedir la pasada con límite cero sólo cuenta cuántos tickets se recorrerían y cuántos nacidos en la App se saltan, sin llamar a Zoho ni escribir, y funciona con el interruptor cerrado | Quitar ese modo | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:110` | para corregir |
| S-4 | Los tickets se recorren por número, de menor a mayor; «desde» reanuda donde el resumen dijo que se cortó y «límite» permite una primera pasada corta de tanteo | Quitar los dos parámetros | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:111` | para corregir |
| S-5 | Por cada ticket se pide a Zoho su detalle actualizado, y el recuento sale siempre de él, nunca de la copia guardada en Desk | Volver a la lectura de ticket de siempre y al recuento guardado en Desk | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:112` | para corregir |
| S-6 | Un ticket «no está en Zoho» si Zoho responde que no existe (404) o lo da por borrado o en la papelera: no se escribe ni se marca nada y se lista por número; que Zoho responda 404 a un borrado es hipótesis | Cambiar la clasificación | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:113` | para corregir |
| S-7 | El detalle traído se guarda por la vía de siempre, así que un ticket que ya gestiona la App conserva su fila: manda la App | Dejar de guardar el detalle | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:114` | para corregir |
| S-8 | Marcar como ausentes las conversaciones que Zoho ya no devuelve sigue dependiendo del interruptor de marcado que ya existía; el interruptor nuevo no marca por sí solo | Que el interruptor nuevo baste para marcar | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:115` | para corregir |
| S-9 | Tras guardar y marcar, un ticket cuadra si sus conversaciones de Zoho visibles en Desk son tantas como dice el recuento de Zoho; si no, sale descuadrado; sin recuento, «sin recuento»; si falla la lectura, «con error»; con el marcado apagado, lo borrado en Zoho sale descuadrado a propósito | Cambiar la regla | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:116` | **corregido en parte** por `decision/calificaciones-y-borrados-de-zoho` (`openspec/config.yaml:6494` en `6991d1e9`): las calificaciones de satisfacción dejan de descuadrar, y lo construyó `calificaciones-cuadre-conversaciones` (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:18`); el resto, para corregir |
| S-10 | El resumen da recuentos por clase, números de los tickets que no cuadran (nunca asunto, contacto, empresa ni contenido), el motivo del primer fallo, las peticiones hechas, los avisos de límite y dónde se cortó; vive en memoria y va al registro de la App | Cambiar el formato | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:117` | **corregido en parte** por `decision/calificaciones-y-borrados-de-zoho` (`openspec/config.yaml:6494` en `6991d1e9`): «el resumen de esa pasada se guarda donde sobreviva a un redespliegue», construido por `calificaciones-cuadre-conversaciones` (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:20`); el contenido del resumen, para corregir |
| S-11 | Si Zoho limita las peticiones, en el detalle o en cualquier página: pausa de 2 segundos y hasta 3 repeticiones; agotadas, se corta la pasada entera; cualquier otro fallo se cuenta y se sigue; pausa de 150 milisegundos entre tickets | Cambiar las constantes | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:118` | para corregir |
| S-12 | La fila 1G-01 se da por cerrada con el relleno construido; ejecutarlo en producción es tarea de persona | Cambiar la cabecera a «no cierra» | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:119` | para corregir; la pasada ya corrió en producción el 03/11/2026 (`docs/sdd/ENTRADA.md:2410` en `6991d1e9`), así que la condición que lo habría cambiado ya no se da |
| S-13 | El punto 2 de la deuda técnica se da por cerrado y se corrige la frase que afirmaba reintentos ante el límite de Zoho, en su sitio y sin mover líneas; el punto I-3 no se toca | Revertir el commit | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:120` | para corregir |
| S-14 | «Los 986 tickets» de la fila se lee como «todos los tickets de Zoho», que es lo que dice el maestro, sin cambiar el alcance | Leer «986» como una cifra que la pasada tiene que alcanzar | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:121` | para corregir |
| S-15 | La prueba del registro de avance no se toca al planificar; al archivar, 1G-01 sale de «en curso» y entra en «cerradas por archivo», en su sitio y con el mismo número de líneas | Dejar 1G-01 «en curso» en esa prueba | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/proposal.md:122` | para corregir |

### 1.2 · Supuestos añadidos al aplicar (`apply-progress.md`)

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-16 | Para que las primeras pruebas fallaran por la conducta y no por falta de código, se escribió antes un esqueleto del módulo, sustituido después por el real | No hay nada que deshacer | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:107` | **sin objeto**: «no queda rastro en el árbol final» (`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:108`) |
| S-17 | En el primer lote, la pasada se marcaba «en marcha» después de la primera consulta y un segundo lanzamiento no se rechazaba | Lo deshizo el segundo lote | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:109` | **retirado** por S-27 (`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:248`) |
| S-18 | El contador de peticiones cubre el detalle y cada página de conversaciones desde el primer lote; los avisos de límite se cuentan aparte desde el segundo | Borrar el contador | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:112` | para corregir |
| S-19 | La hora de inicio y de fin de la pasada se toma del reloj del proceso, al empezar (tras consultar los tickets a recorrer) y al terminar | Tomarlas de la base de datos, o fijar el inicio antes de esa consulta | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:114` | para corregir |
| S-20 | La prueba del límite cero nació en verde y se conserva como caracterización; la pone en rojo una mutación | Borrar la prueba | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:116` | para corregir |
| S-21 | En el primer lote, lo guardado de un ticket descuadrado se contaba por lo recibido de Zoho, no por lo visible en Desk | Lo sustituyó el segundo lote por lo visible | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:118` | **retirado** por S-27 (`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:248`) |
| S-22 | El ticket en el que la pasada se corta por el límite de Zoho no cuenta como recorrido ni entra en ninguna clase; se reanuda desde él y se repite entero | Contarlo como recorrido antes de cortar | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:236` | para corregir |
| S-23 | El resumen va al registro de la App con una línea fija («terminada», o «cortada en el ticket N, X de Y recorridos»); si escribirlo falla, no tumba la pasada, y también se escribe una vez si falla la consulta inicial | Cambiar la función que lo escribe | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:238` | para corregir |
| S-24 | La cuenta de conversaciones visibles se pide a la base como número entero, una forma que la base de pruebas acepta tal cual | Escribir la consulta de otra forma, con una variante para la base de pruebas | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:242` | **superado por un cambio posterior**, no por el propio: `calificaciones-cuadre-conversaciones` cambió esa consulta (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:54`) |
| S-25 | El contador de avisos de límite cuenta cada uno que llega, también los que se reintentaron con éxito | Quitar el contador | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:243` | para corregir |
| S-26 | La prueba de «conversación guardada mientras se leía la lista» usa la hora real de la base y una espera de 25 milisegundos; si fallara, lo haría hacia el lado seguro | Borrar la prueba | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:245` | para corregir |
| S-27 | Se retiran S-17 y S-21: la pasada se marca «en marcha» antes de la primera espera, un segundo lanzamiento devuelve la que está en marcha, lo guardado de un descuadrado son las conversaciones visibles, y una pasada terminada se puede volver a lanzar | Rechazar el relanzamiento de una pasada ya terminada | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:248` | para corregir |
| S-28 | Sólo el valor literal «0» del límite cuenta sin lanzar; «00», con el interruptor abierto, lanza una pasada que no recorre nada | Tratar como cero cualquier valor numérico igual a cero | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:416` | para corregir |
| S-29 | Lanzar responde si se lanzó y el estado (con límite cero, los recuentos); consultar responde el estado | Cambiar las respuestas y sus pruebas | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:418` | para corregir; la consulta devuelve además la última pasada guardada desde `calificaciones-cuadre-conversaciones` (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:21`) |
| S-30 | Un parámetro repetido en la petición se rechaza como inválido (400) | Aceptar el primer valor | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:420` | para corregir |
| S-31 | Las mutaciones de prueba se restauraron copiando el fichero byte a byte y comprobando su huella, no con la operación inversa | No hay nada que deshacer | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:421` | **sin objeto**: «no hay nada que deshacer» (`openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:422`) |
| S-32 | La deuda técnica da su punto 2 por CERRADO aunque el relleno no se hubiera ejecutado todavía en producción | Quitar el añadido del título y rehacer las otras dos líneas | `openspec/changes/archive/2026-11-02-relleno-completo-conversaciones/apply-progress.md:423` | para corregir; la ejecución se hizo el 03/11/2026 (`docs/sdd/ENTRADA.md:2410` en `6991d1e9`) |

**1G-01: 32 filas** (S-1 a S-32): dos retiradas (S-17 y S-21), dos sin objeto (S-16 y S-31), una superada por un cambio posterior (S-24) y dos corregidas en parte
(S-9 y S-10). **Posible pregunta: 0.**

---

## 2 · F1B-04 · `cierre-f1b04-con-lo-construido` (archivado el 2026-11-03)

Cambio de cierre sin código: asienta que F1B-04 queda cerrada con lo construido en sus siete cambios anteriores, como pide
`decision/f1b04-recuento-no-retiene`, consecuencia (4) (`openspec/config.yaml:5616-5618` en `6991d1e9`). Su único efecto medible es que F1B-04
pasa a «cerradas por archivo» en el barrido del avance. Supuestos S-1 a S-5 en «Supuestos reversibles» de la propuesta
(`openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:146-154`); el informe de archivo los repite con
«plazo de corrección: una semana desde que se publique»
(`openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/archive-report.md:45-53`) y su tarea de persona P-6 los manda
a esta lista (`openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/archive-report.md:88`). Cuatro son de la
cabecera y de las citas del propio cambio; el quinto nombra un dueño.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La cabecera cita como fuente del maestro la de la fila en la R01.1 del plan (ítems 4 y 10, que valen como procedencia y no como alcance), más el pasaje M1.2 de la R08.4 | Sólo la fuente de la R01.1, como el precedente | `openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:150` | para corregir |
| S-2 | La cabecera declara la capacidad de reconciliación, porque el único efecto es el recuento del avance, y no las de remisiones y tickets de los cambios que construyeron la fila | Declarar las capacidades de remisiones y tickets | `openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:151` | para corregir |
| S-3 | La cabecera dice que el maestro no queda desactualizado, aunque su tabla de tandas siga marcando F1B-04 «Parcial»: esa columna es una foto de la revisión | Declarar que sí lo deja desactualizado, con el texto del estado nuevo para Gerencia | `openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:152` | para corregir; el texto del estado nuevo ya lo llevó Supervisión al expediente de la R08.5 (`docs/sdd/R08.4_Expediente_de_cambios.md:377` en `6991d1e9`) |
| S-4 | No se corrige la especificación de reconciliación, que da seis tandas «en curso» con la lista del 01/10 y nombra F1B-04, porque hacerlo exigía un delta de especificación y el encargo era sin él | Un delta del requisito RQ-RC-11 | `openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:153` | para corregir; la especificación lo sigue diciendo (`openspec/specs/reconciliacion/spec.md:347` en `6991d1e9`) |
| S-5 | Decidir qué se hace con los 106 accesorios escritos a mano sin artículo en Books le corresponde al Director Técnico, porque es quien añade a la lista del modelo; la decisión de Gerencia no nombra dueño ni acción | Que Gerencia nombre otro dueño, o ninguna acción («siguen funcionando sin SKU») | `openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/proposal.md:154` | para corregir · **posible pregunta para el apartado 06**: toca datos de producción; asigna a un cargo, sin decisión que lo nombre, qué hacer con 106 accesorios de 34 modelos que hoy están en producción (`openspec/config.yaml:5612-5613` en `6991d1e9`), y la tarea de persona P-2 ya se le asigna por este supuesto (`openspec/changes/archive/2026-11-03-cierre-f1b04-con-lo-construido/archive-report.md:84`) |

**F1B-04: 5 filas.** **Posible pregunta: 1** (S-5).

---

## 3 · 1G-02 · `persistencia-adjuntos` (archivado el 2026-11-04)

Los adjuntos de los tickets pasan a tener copia propia en un volumen de la App: un relleno manual trae los que ya existen, la
pasada periódica guarda los nuevos, y la descarga sirve la copia local y sólo los pide a Zoho si falta, dejando una línea en el
registro por cada caída. Supuestos S-a a S-c y S-1 a S-15 en la §5 de la propuesta
(`openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:93-110`), y los de cada lote en los cinco apartados
«Supuestos» de `apply-progress.md`
(`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:68-72`,
`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:160-165`,
`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:226-232`,
`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:302-308` y
`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:396-404`). El informe de archivo remite a esos dos
sitios, destaca los de más peso y añade dos sin ID, que van en 3.3
(`openspec/changes/archive/2026-11-04-persistencia-adjuntos/archive-report.md:109-120`); y afirma que ninguno cambia el alcance
de la fila, cuesta dinero, toca datos de producción ni contradice una decisión registrada
(`openspec/changes/archive/2026-11-04-persistencia-adjuntos/archive-report.md:122`).

**Prefijo de lote.** Los apartados de `apply-progress.md` numeran sus supuestos desde 1 en cada lote, y esos números chocan
entre lotes y con los de la propuesta; aquí llevan el lote delante: L4-1 es el supuesto 1 del lote L4, el que el informe de
archivo llama «L4, supuesto 1». **No se cuentan** las sugerencias S-1 a S-7 del verificador
(`openspec/changes/archive/2026-11-04-persistencia-adjuntos/verify-report.md:163-169`), aunque S-5 y S-6 coincidan en número con
los de la propuesta, ni las hipótesis del diseño, que no se declaran supuestos.

**Cómo se deshace:** la propuesta deja «—» en S-b, S-c y S-15, y ni los apartados de los lotes ni el informe de archivo traen
alternativa: en esas 34 filas lo escribe esta lista a partir del propio supuesto.

### 3.1 · Supuestos de la propuesta

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-a | El destino de los adjuntos es el volumen persistente de EasyPanel montado en la App, por el tamaño medido (2.602 MB) | Cambiar el destino | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:93` | **decidido** por Gerencia el 08/11/2026: «sí, el disco del servidor, opción 1», con volumen persistente y copia fuera del servidor como condiciones (`decision/adjuntos-en-el-disco-del-servidor`, `openspec/config.yaml:6406` en `6991d1e9`; respuesta en `openspec/config.yaml:6414` en `6991d1e9`) |
| S-b | Los adjuntos se traen por la API de Zoho, no del volcado «Copia de seguridad de datos»; ese volcado queda como contraste para 1G-03 | Traerlos del volcado de Zoho | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:94` | para corregir |
| S-c | Que Desk tenga 784 tickets frente a los ≈986 de Zoho es hipótesis, y la comprueba 1G-03 | Contar los tickets de Zoho antes, sin esperar a 1G-03 | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:95` | **sin objeto**: lo comprobó la primera pasada de 1G-03 en producción, el 08/11/2026: 785 de 785 tickets, y «986» era el número del último ticket, no un recuento (`docs/sdd/ENTRADA.md:2478` en `6991d1e9`; consecuencia (4) de `decision/copia-de-la-carpeta-de-adjuntos`, `openspec/config.yaml:6612` en `6991d1e9`) |
| S-1 | Dos interruptores separados, cerrados salvo que valgan exactamente «true» —uno para el relleno manual y otro para el guardado en la pasada periódica— y un directorio sin valor por defecto; sin directorio válido, o si cae dentro de la carpeta que la App publica, nada se escribe | Quitar las variables | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:96` | para corregir |
| S-2 | El relleno se lanza por una ruta de administración que responde enseguida y trabaja en segundo plano; consultar su estado nunca lo lanza; sólo un superadministrador; cerrado, responde 403 nombrando la variable antes de validar nada; con una pasada en marcha no lanza otra | Retirar la ruta | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:97` | para corregir |
| S-3 | Pedir el relleno con límite cero sólo cuenta los pendientes (número y megas), sin llamar a Zoho ni escribir, también con el interruptor cerrado; con límite N trae N adjuntos, y «desde» reanuda en un número de ticket | Quitar el modo | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:98` | para corregir |
| S-4 | Un adjunto está pendiente si no tiene copia registrada, o si su fichero falta o mide otra cosa; se recorre por número de ticket y luego por identificador, y relanzar sólo trae pendientes; el que no tiene ruta de Zoho, o una que no pasa la misma guarda que la descarga, cuenta «sin ruta» y no se pide | Cambiar la selección | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:99` | para corregir |
| S-5 | El fichero se llama como el identificador del adjunto, que se exige numérico (hipótesis: todos lo son), sin extensión y en un directorio plano; la base guarda ese nombre, nunca una ruta absoluta, y nada se lee fuera del directorio; se escribe a un temporal que luego se renombra, y un temporal nunca se sirve | Cambiar el formato | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:100` | para corregir |
| S-6 | Si los bytes recibidos no cuadran con el tamaño que Zoho declara, no se guarda y cuenta como fallido; sin tamaño, se compara con la longitud de la respuesta, y sin ninguno se guarda y se cuenta «sin tamaño comprobable» (hipótesis: el tamaño de Zoho es el número exacto de bytes) | Cambiar la regla | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:101` | para corregir |
| S-7 | Si Zoho responde que no existe (404), el adjunto cuenta como ausente en Zoho, no se guarda y se lista; sin columna nueva: el relleno lo reintenta al relanzarse y la pasada periódica no lo repite en el mismo proceso; los adjuntos de conversaciones marcadas ausentes se intentan igual | Cambiar la política | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:102` | para corregir |
| S-8 | Si Zoho limita las peticiones (429): pausa de 2 segundos y hasta 3 reintentos de la misma petición; agotados, se corta y se anota dónde; 150 ms entre adjuntos; otro fallo se cuenta y se sigue, y un error de disco corta, porque fallarían todos | Cambiar las constantes | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:103` | para corregir |
| S-9 | «Nuevo» es un pendiente de un ticket cuyas conversaciones acaba de guardar la pasada periódica de la App, con un tope por ciclo y sólo si esa pasada está encendida; abrir un ticket no descarga nada, y lo que no se traiga queda para el relleno (hipótesis: un comentario nuevo con adjunto mueve la fecha de modificación del ticket) | Cambiar la definición | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:104` | para corregir |
| S-10 | La copia local se sirve con el tipo de la fila, abierta en el navegador sólo si es imagen o PDF y como descarga en el resto (HTML y SVG incluidos), con el nombre codificado y la cabecera que impide al navegador adivinar el tipo (hipótesis: no está medido qué disposición manda hoy Zoho) | Cambiar las cabeceras | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:105` | para corregir |
| S-11 | Cada vez que la App tiene que pedir un adjunto a Zoho deja una línea en su registro con el identificador, el número de ticket, el motivo y la respuesta de Zoho; «qué queda por traer» es el recuento con límite cero, sin tabla nueva | Cambiar el formato | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:106` | para corregir |
| S-12 | El resumen del relleno vive en memoria y va al registro al terminar o cortarse, sólo con identificadores, números de ticket y cuentas; nunca nombre de fichero, asunto, contacto ni empresa | Cambiar el formato | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:107` | para corregir |
| S-13 | El punto 1 de `debt.md` se da por cerrado en su sitio, sin mover líneas | Revertir el commit | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:108` | para corregir |
| S-14 | La fila 1G-02 se declara cerrada (`cierra: si`) con lo construido; correr el relleno en producción es tarea de persona | Cambiar la cabecera | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:109` | para corregir; Supervisión ya escribe «1G-02 sigue cerrada» (`openspec/config.yaml:6436` en `6991d1e9`), que no es aceptación de Gerencia |
| S-15 | El relleno recorre lo que ya hay en la tabla de adjuntos de Desk; lo que traiga después el relleno de conversaciones de 1G-01 lo recoge otra pasada | Encadenar el relleno de adjuntos al de conversaciones | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/proposal.md:110` | para corregir |

### 3.2 · Supuestos de los lotes, en `apply-progress.md`

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| L1-1 | Ante una respuesta de error de Zoho, la función que guarda un adjunto no escribe y devuelve el código; quien la llama (el relleno o la pasada periódica) decide qué hacer con 429, 404 y el resto. El diseño no listaba ese resultado | Que la función de guardado trate cada código por sí misma | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:69` | para corregir |
| L1-2 | Para saber si el directorio cae fuera de la carpeta que la App publica se usa una comprobación más estricta que la del diseño: una subcarpeta suya llamada «..x» se rechaza, cuando la lectura literal del diseño la admitiría; ese caso no tiene prueba. La descripción la corrigió el orquestador en la misma viñeta | Aplicar la lectura literal del diseño | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:70` | para corregir |
| L1-3 | Cualquier error al pedir el adjunto a Zoho o al leer sus bytes cuenta como fallo de red | Distinguir el fallo al leer los bytes del fallo de red | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:71` | para corregir |
| L1-4 | Los datos de la fila del adjunto incluyen su nombre sólo para poder probar que el nombre no interviene en el fichero | Quitar el campo y la prueba que lo usa | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:72` | para corregir |
| L2-1 | Si el disco no deja leer la copia al servirla, la descarga cae a Zoho con el motivo «fichero ausente» en vez de dar error; sin prueba propia | Responder con error, o registrar un motivo propio de disco | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:161` | para corregir |
| L2-2 | Cuando no hay fila del adjunto, la línea de la caída lleva como identificador el último número de la ruta y el ticket vacío, porque el primer número es el identificador de Zoho del ticket, no el número de Desk | Buscar el número de Desk a partir del identificador de Zoho | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:162` | para corregir |
| L2-3 | Si el adjunto no tiene nombre, la descarga usa su identificador como nombre de fichero; la spec no dice nada | Otro nombre por omisión | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:163` | para corregir |
| L2-4 | Una segunda consulta del fichero da su tamaño para la respuesta; si el fichero desaparece entre medias, cae a Zoho con «fichero ausente» | Tomar el tamaño de la primera consulta | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:164` | para corregir |
| L2-5 | Si el envío de una copia local se corta a mitad (por ejemplo, el usuario cancela la descarga), lo atiende el manejador general de errores de la App; sin prueba propia | Tratarlo en la propia ruta, con su prueba | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:165` | para corregir |
| L3-1 | El límite del relleno cuenta los adjuntos que se piden: corta al llegar al primero que pasa del tope, y los que se clasifican antes sin pedirlos (sin ruta, ya presentes, identificador no numérico) cuentan siempre | Que el límite cuente todos los recorridos | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:227` | para corregir |
| L3-2 | Si no se puede consultar el directorio, el relleno se corta en el primer ticket pendiente, con motivo «disco» y el código de error del sistema | Cortar antes de empezar, sin número de reanudación | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:228` | para corregir |
| L3-3 | El recuento sin Zoho no cuenta los adjuntos de identificador no numérico (la pasada los lista como fallidos); si el disco falla durante el recuento, el error sube y la ruta decide la respuesta | Contarlos aparte en el recuento | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:229` | para corregir |
| L3-4 | El primer fallo de base de datos o de identificador se anota con un texto fijo, para no volcar al registro un identificador que no es numérico | Anotar el detalle del fallo | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:230` | para corregir |
| L3-5 | Sin directorio configurado, lanzar el relleno no arranca y deja un estado con sólo el error, sin marcarlo terminado | Marcarlo terminado con el error | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:231` | para corregir |
| L3-6 | Lanzar el relleno con límite cero no pide nada y termina; el recuento sin Zoho lo hace la ruta (lote L5) | Que lanzar con límite cero haga el recuento | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:232` | para corregir |
| L4-1 | En la pasada periódica, si Zoho limita las peticiones (429), se corta el guardado de adjuntos de ese ciclo sin reintentar, y el ciclo siguiente lo vuelve a pedir; el relleno, en cambio, reintenta tres veces | Reintentar tres veces, como el relleno | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:303` | para corregir |
| L4-2 | La pausa entre adjuntos de la pasada periódica es la misma que entre tickets (150 ms): un solo ajuste para las dos | Un ajuste propio para los adjuntos | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:304` | para corregir |
| L4-3 | La pasada periódica sólo considera pendientes los adjuntos con identificador numérico y ruta permitida; los demás no gastan petición ni se anotan, porque los cuenta el relleno | Anotarlos también en la pasada | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:305` | para corregir |
| L4-4 | La consulta de pendientes enumera los identificadores uno a uno en lugar de pasar una lista, para no depender de cómo trata las listas la base de pruebas | Pasar la lista | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:306` | para corregir |
| L4-5 | La protección del ciclo frente a un fallo del guardado de adjuntos cubre un fallo diferido, no uno inmediato; el guardado real no puede fallar de forma inmediata | Proteger también el fallo inmediato | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:307` | para corregir |
| L4-6 | La pasada periódica deja una línea en el registro sólo si pidió algún adjunto, con tickets, peticiones, guardados, ausentes, fallidos y corte | Una línea en cada ciclo | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:308` | para corregir |
| L5-1 | La prueba de la sección de despliegue de la tanda (§22 de `DEPLOY.md`) exige que sea la última; una sección posterior tendrá que corregir esa prueba en su sitio | No fijar la posición en la prueba | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:397` | **sin objeto**: 1G-03 añadió la §23 y corrigió esa prueba en su sitio, como preveía (`openspec/changes/archive/2026-11-07-verificacion-completitud/archive-report.md:26-28`) |
| L5-2 | Con el interruptor cerrado y sin directorio a la vez, el 403 nombra la variable del interruptor, que se comprueba primero; ninguna prueba fija ese caso doble | Nombrar las dos | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:398` | para corregir |
| L5-3 | El recuento con límite cero salta las dos guardas, la del interruptor y la del directorio: sin directorio todo es pendiente y no se escribe nada | Exigir el directorio también para contar | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:399` | para corregir |
| L5-4 | Los tres apartados de variables de la §22 van en un orden fijo, y los pasos de persona cuelgan de un cuarto apartado sin variable | Otro orden u otra estructura | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:400` | para corregir |
| L5-5 | El orden de los diez pasos de la §22 es de la construcción: abrir el guardado en la pasada periódica después del relleno completo y con la §18 encendida; es recomendación reversible, no regla del código | Otro orden | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:401` | para corregir |
| L5-6 | La frase «ampliar el volumen cuesta dinero y lo decide Gerencia» del paso de persona es redacción de la construcción | Otra redacción | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:402` | para corregir |
| L5-7 | Se añade una prueba fuera del encargo, la pasada completa por la ruta, para que quitar el directorio del cableado de la App se note (hipótesis: sin ella sólo lo vigilaría el tipado) | Quitar la prueba | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:403` | para corregir |
| L5-8 | La prueba «dentro de la carpeta publicada» coincide con la comprobación de la App mientras las pruebas corran desde la raíz del repositorio (hipótesis) | Fijar el directorio de trabajo en la prueba | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:404` | **corregido** al cerrar el lote: la prueba no depende del directorio de trabajo, porque ella y la App calculan la carpeta con el mismo (`openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:411`) |

### 3.3 · Añadidos por el informe de archivo, sin ID

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| (sin ID) · M0 de L5 | La pasada de pruebas de partida del lote L5 es la de cierre del lote L4, porque entre las dos sólo cambiaron documentos, como en L3 y L4 | Correr una pasada nueva al empezar cada lote | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/archive-report.md:118` | para corregir |
| (sin ID) · marca de evidencia | La marca de evidencia de la cabecera del informe de verificación sigue la receta del verificador, y la del registro de intentos es la huella del fichero de evidencia de cada intento: son dos marcas distintas | Unificar las dos marcas | `openspec/changes/archive/2026-11-04-persistencia-adjuntos/archive-report.md:119` | para corregir |

**1G-02: 49 filas** (S-a a S-c, S-1 a S-15, 29 de los lotes y 2 sin ID): una decidida por Gerencia (S-a), dos sin objeto (S-c
y L5-1) y una corregida (L5-8). **Posible pregunta: 0.**

---

## 4 · 1G-03 · `verificacion-completitud` (archivado el 2026-11-07)

Una pasada de sólo lectura compara Zoho Desk con PostgreSQL y con el volumen de adjuntos, entidad por entidad; cada diferencia
sale «conocida», con causa y entrada, o «sin explicar», y el resultado es un veredicto por entidad y uno global. Supuestos S-a a
S-n en la §5 de la propuesta (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:109-122`): S-a a S-i los
fija el encargo y S-j a S-n la propuesta
(`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:105`). El informe de archivo los da todos por
aplicados, señala S-e y S-f como hipótesis sin medir y repite la posible pregunta de S-c
(`openspec/changes/archive/2026-11-07-verificacion-completitud/archive-report.md:106-123`).

**No hay supuestos fuera de la propuesta.** `grep -rniE "supuesto"` sobre la carpeta del cambio da cinco aciertos: la §5 de la
propuesta y su cabecera de tabla, la §6 del informe de archivo, la delta de spec, que remite a «los supuestos S-a a S-n de
`proposal.md`» (`openspec/changes/archive/2026-11-07-verificacion-completitud/specs/zoho-sync/spec.md:3`), y un falso acierto,
«Presupuesto» (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:161`). `apply-progress.md` tiene tres
apartados «Decisiones de forma (el diseño no las fija)»
(`openspec/changes/archive/2026-11-07-verificacion-completitud/apply-progress.md:134`,
`openspec/changes/archive/2026-11-07-verificacion-completitud/apply-progress.md:209` y
`openspec/changes/archive/2026-11-07-verificacion-completitud/apply-progress.md:264`): no se declaran supuestos y el informe de
archivo no los manda a la lista, así que no se cuentan. Tampoco las sugerencias S-1 a S-5 del verificador
(`openspec/changes/archive/2026-11-07-verificacion-completitud/verify-report.md:126-130`).

**Cómo se deshace:** la propuesta deja «—» en S-b, S-f, S-h, S-i y S-m; en esas cinco lo escribe esta lista a partir del propio
supuesto.

**Lo que cambió desde el archivo.** La primera pasada en producción, el 08/11/2026 (`docs/sdd/ENTRADA.md:2477` en `6991d1e9`), y
`decision/contactos-y-cuentas-que-faltan` (`openspec/config.yaml:6618` en `6991d1e9`) dejan S-d y S-f decididos, la hipótesis de S-e
comprobada y S-c respondido en parte.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-a | La pasada completa va tras un interruptor que nace cerrado aunque sólo lee, porque gasta cuota diaria de Zoho Desk; cerrado, responde 403 nombrándolo, después de comprobar el rol y antes de validar; el recuento sin Zoho no lo necesita | Quitar la variable | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:109` | para corregir |
| S-b | Se compara por la API de Zoho; el volcado «Copia de seguridad de datos» queda como contraste opcional, fuera de esta tanda | Contrastar también contra el volcado | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:110` | para corregir |
| S-c | Verde es cero diferencias «sin explicar» en las seis entidades, con todos los tickets comparados y sin errores por ticket; una pasada cortada, parcial o con errores sale «incompleto», nunca verde | Cambiar la regla | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:111` | para corregir · **posible pregunta para el apartado 06**, que marca el propio cambio: la definición de verde decide si el corte se puede hacer (`openspec/changes/archive/2026-11-07-verificacion-completitud/archive-report.md:112`). La bandeja la enlaza con la pregunta de contactos y cuentas (`docs/sdd/ENTRADA.md:2499` en `6991d1e9`), y la respuesta usa el verde de 1G-03 como condición para la baja de Zoho, no para el corte (`openspec/config.yaml:6631` en `6991d1e9`); la definición de verde no la confirma ni la corrige |
| S-d | Los huecos de Zoho Books en el hub (E-261) quedan fuera: la fila habla de entidades de Zoho Desk y E-261 no tenía decisión; no se le inventa destino | Ampliar con una decisión | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:112` | **decidido** por Gerencia el 08/11/2026: E-261 va, con contactos y cuentas, en una tanda corta la semana del 14/12, fuera de 1G-03 (`decision/contactos-y-cuentas-que-faltan`, `openspec/config.yaml:6628` en `6991d1e9`) |
| S-e | Los adjuntos de Zoho son la unión, por identificador, de los de cada conversación y los del propio ticket, que se piden aparte (hipótesis: esa consulta existe y trae adjuntos que Desk nunca guarda); si falla, es error de ese ticket, no ausencia | Quitar la segunda fuente | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:113` | para corregir; la hipótesis quedó **comprobada** en producción: 201 adjuntos del propio ticket, en 186 tickets, que Zoho tiene y Desk no (`docs/sdd/ENTRADA.md:2484` en `6991d1e9`), a los que Gerencia da una fila nueva de 1G con 1G-03 repetida como prueba (`openspec/config.yaml:6632` en `6991d1e9`) |
| S-f | Las cuentas se piden por páginas a Zoho (hipótesis: la consulta existe); como Desk sólo guarda las que nombra un contacto o un ticket, lo probable es que salgan «sin explicar», y la tanda no les inventa una clase conocida | Darles una clase conocida en la lista | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:114` | **decidido** por Gerencia lo que la propuesta le dejaba (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:166`): la pasada dio 392 contactos y 210 cuentas de Zoho que Desk no tiene (`docs/sdd/ENTRADA.md:2495` en `6991d1e9`); no reciben clase conocida: se traen en una tanda corta la semana del 14/12, y la baja de Zoho exige verde también en ellos (`decision/contactos-y-cuentas-que-faltan`, `openspec/config.yaml:6624` en `6991d1e9` y `openspec/config.yaml:6631` en `6991d1e9`) |
| S-g | Lo nacido en la App (tickets con prefijo «app-», conversaciones que no vienen de Zoho, contactos y cuentas propios) sale de «falta en Zoho» por una regla de la lista editable, y los tickets «app-» no se piden a Zoho; quitar la regla los vuelve «sin explicar» | Quitar la regla | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:115` | para corregir |
| S-h | Los 8 adjuntos pendientes del 06/11 no tienen identificador y no se precargan en la lista: si salen sin copia, son «sin explicar» hasta volver a correr el relleno de adjuntos | Añadirlos a la lista de conocidas cuando se sepan sus identificadores | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:116` | para corregir; la medición del 08/11 cuenta 7, no 8 (`docs/sdd/ENTRADA.md:2502` en `6991d1e9`) |
| S-i | Las peticiones a Zoho y los avisos de límite (429) se cuentan por entidad y van en el informe, para medir el coste en cuota; el recuento sin Zoho da el mínimo estimado (hipótesis: tres peticiones por ticket más las páginas de las listas) | No contarlas | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:117` | para corregir |
| S-j | Cada entrada de la lista de diferencias conocidas lleva entidad, causa y entrada de la bandeja o apartado de `DEPLOY.md`, y o bien identificadores concretos o bien una regla de un conjunto cerrado; lo de un ticket conocido hereda su clase; una lista inválida impide lanzar y el error nombra la entrada; la que no explica nada sale «conocida sin uso» | Cambiar el formato | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:118` | para corregir |
| S-k | Se comparan los tickets del mismo departamento que usa la sincronización, y el informe lo declara (hipótesis: no hay tickets de Ambientalia en otro departamento) | Listar los departamentos | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:119` | para corregir · **posible pregunta para el apartado 06**: no se deshace sin coste; si hubiera tickets en otro departamento, la verificación no los vería y se perderían con la baja de Zoho. Es hipótesis sin medir (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:119`) y el inventario de Zoho deja «Departamentos» entre lo que falta por revisar (`docs/sdd/Inventario_ZohoDesk_Configuracion.md:107` en `6991d1e9`) |
| S-l | Un ticket, contacto o cuenta de Desk que no viene en la lista de Zoho se pide por su identificador antes de clasificarlo: si no existe, está borrado o en la papelera, «falta en Zoho»; si existe, «hueco de lista», que no es ausencia | Quitar la re-verificación | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:120` | para corregir |
| S-m | Dos pasadas sobre los mismos datos dan el mismo informe salvo instantes y peticiones; el informe vive en memoria, y una reanudación que perdió la parte previa, por un corte o un redespliegue, sale «incompleto», nunca verde | Guardar el informe en una tabla propia | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:121` | para corregir |
| S-n | La fila 1G-03 se declara cerrada (`cierra: si`) con lo construido; correr la pasada es tarea de persona | Cambiar la cabecera | `openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:122` | para corregir; Supervisión ya la trata como cerrada («1G-03, ya cerrada», `openspec/config.yaml:6548` en `6991d1e9`), que no es aceptación de Gerencia |

**1G-03: 14 filas**, dos ya decididas por Gerencia (S-d y S-f). **Posible pregunta: 2** (S-c, que marca el propio cambio, y S-k).

---

## 5 · 1G-04 · `modo-sin-zoho` (archivado el 2026-11-08)

Interruptor `MODO_SIN_ZOHO_DESK`: abierto en la App y en el worker, ninguna petición sale hacia Zoho Desk —ni la renovación
del token—, la aplicación sirve lo que tiene en PostgreSQL, lo que sólo Zoho puede dar responde de forma explícita y cada
intento cortado queda registrado por origen; cerrado, todo queda como hoy. Supuestos S-a a S-p en la §5 de la propuesta
(`openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:126-147`): S-a a S-g los fija el encargo y S-h a S-p la
propuesta, «Todos reversibles» (`openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:128`). El informe de archivo
manda a esta lista **cinco**: S-j, S-k, S-l, S-n y S-p
(`openspec/changes/archive/2026-11-08-modo-sin-zoho/archive-report.md:58-60`). Son los mismos que nombra verify
(`openspec/changes/archive/2026-11-08-modo-sin-zoho/verify-report.md:217-219`), que además comprueba que el código respeta los
dieciséis (`openspec/changes/archive/2026-11-08-modo-sin-zoho/verify-report.md:197-215`), y los que la ronda de preguntas que
no se hizo manda a la lista (`openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:149-152`).

**Aquí van los dieciséis**, porque la propuesta los declara todos supuestos reversibles: los cinco que el informe nombra, en
5.1; los once restantes, en 5.2. El diseño, `apply-progress.md` y la delta de spec no declaran supuestos propios, sólo citan
éstos (`grep -n -iE "supuesto|lista semanal|S-[a-z]\b"` sobre `design.md`, `apply-progress.md`, `tasks.md` y la delta: 33
aciertos, y todos remiten a S-a a S-p salvo uno, la palabra «presupuesto» de `tasks.md`). Las S-1 a S-5
de verify (`openspec/changes/archive/2026-11-08-modo-sin-zoho/verify-report.md:237-245`) son sugerencias del verificador, no
supuestos. **La propuesta no trae alternativa para S-a, S-c, S-g y S-l** (columna «—»): ahí «Cómo se deshace» lo escribe esta
lista. S-p deja sin hacer la «pasada periódica propia antes de 1G-04» que pide el punto abierto del maestro
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3478`); la propuesta lo anota para Supervisión
(`openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:199-201`).

### 5.1 · Los cinco que el informe de archivo manda a la lista

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-j | Lo que se salta a propósito en segundo plano (temporizadores, arranque, aperturas de ticket) no cuenta como intento; lo que una persona pide y se le niega cuenta aparte, como rechazo. Abrir un ticket que no está en la base local responde «no encontrado» y no deja rastro | Contar también los saltos, o los «no encontrado» de las aperturas (`openspec/changes/archive/2026-11-08-modo-sin-zoho/archive-report.md:59`), o no contar los rechazos | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:141` | para corregir |
| S-k | Lo que sólo Zoho puede dar responde con un error 503 y un mensaje que nombra el modo sin Zoho Desk, igual en todas las rutas, después de comprobar la sesión y el rol; la pantalla lo enseña tal cual llega | Otro código u otra posición | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:142` | para corregir |
| S-l | Un adjunto sin copia propia responde 503, «no está en el almacenamiento propio y la app está en modo sin Zoho Desk», y deja una línea de log sin nombre de fichero | Otro código u otro texto para el adjunto sin copia | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:143` | para corregir |
| S-n | Ningún aviso en pantalla y la interfaz no se toca: el mensaje lo da el servidor y la pantalla ya enseña el texto del error | Una tanda de interfaz | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:145` | para corregir |
| S-p | Las seis evaluaciones periódicas, entre ellas las alarmas de SLA y el aviso de ritmo de los contratos, siguen en el mismo temporizador, que sólo salta lo de Zoho Desk; no se les da una pasada propia | Una pasada propia, si Gerencia la pide | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:147` | para corregir |

### 5.2 · El resto de la §5 de la propuesta

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-a | No hay copia de pruebas: la tanda se prueba con pruebas automáticas y la semana en producción queda como tarea de persona, con decisión de Gerencia (P-3) | Sin alternativa propia: deshacerlo pide una copia de pruebas que Gerencia decidió no montar | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:132` | **sin objeto como supuesto**: lo fijan `decision/e013-staging-f0-04` (`openspec/config.yaml:1521` en `6991d1e9`) y `decision/e013b-copia-pruebas` («No la montamos», `openspec/config.yaml:1693` en `6991d1e9`) |
| S-b | Books y CRM quedan fuera del corte: la fila habla de Zoho Desk, y esos dos tienen conexión y credenciales propias | Ampliar el corte con una decisión | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:133` | para corregir |
| S-c | Los flujos de n8n quedan fuera, porque no están en el repositorio; si alguno llama a Zoho Desk, el interruptor no lo corta (hipótesis) | Revisar los flujos de n8n y cortar también, fuera del repositorio, lo que llame a Zoho Desk | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:134` | para corregir; ver S-o |
| S-d | El código de respuesta y el mensaje de cada función en modo sin Zoho los decide la tanda (los concretan S-k y S-l) | Cambiar la respuesta | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:135` | para corregir |
| S-e | El registro de lo cortado vive en memoria, por servicio, sin tabla: un reinicio lo vacía, y el log conserva la primera aparición de cada origen | Guardarlo en una tabla, con su migración | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:136` | para corregir |
| S-f | El interruptor se llama `MODO_SIN_ZOHO_DESK` y su consulta de estado es `/api/admin/modo-sin-zoho-desk`; se lee al arrancar, así que abrirlo o cerrarlo pide redesplegar los dos servicios | Renombrarlos | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:137` | para corregir |
| S-g | La aplicación sigue exigiendo las credenciales de Zoho Desk al arrancar; quitarlas es del paso 5 del corte | Dejar de exigirlas antes del paso 5 | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:138` | para corregir |
| S-h | El corte se señala con un error propio, de mensaje fijo y sin ruta ni identificadores, que no se confunde con «Zoho caído»; el intento se cuenta antes de cortarlo, para que quede registrado aunque quien llamó se trague el error | Otra forma de corte | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:139` | para corregir |
| S-i | El origen de cada corte es el recurso de Zoho, reducido a una lista cerrada, más quién llamó; un llamador sin etiqueta aparece igual (cómo se sabe quién llamó es hipótesis) | Cambiar el origen | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:140` | para corregir; la hipótesis sobre quién llamó sigue abierta en el contenedor de producción (`openspec/changes/archive/2026-11-08-modo-sin-zoho/archive-report.md:52-53`) |
| S-m | La especificación sólo añade requisitos, y el nuevo declara que, con el interruptor abierto, prevalece sobre todo requisito que mande llamar a Zoho Desk | Modificar en su sitio el requisito RQ-ZS-31 | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:144` | para corregir |
| S-o | La tanda cierra su fila: el corte cubre toda salida a Zoho Desk del repositorio, y la semana en producción queda como tarea de persona | Cambiar la cabecera a «no cierra» | `openspec/changes/archive/2026-11-08-modo-sin-zoho/proposal.md:146` | para corregir; Supervisión anotó la fila «cerrada por archivo» el 10/11/2026 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:133` en `6991d1e9`), que no es aceptación de Gerencia · **posible pregunta para el apartado 06**: impide cerrar una fila; la fila es «la tanda que da la garantía» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:26` en `6991d1e9`) y el cierre deja fuera la semana en producción (P-3) y los flujos de n8n, que podrían llamar a Zoho Desk sin pasar por el interruptor (S-c) |

**1G-04: 16 filas** (S-a a S-p), una sin objeto como supuesto (S-a). **Posible pregunta: 1** (S-o).

---

## 6 · fuera-del-plan · `calificaciones-cuadre-conversaciones` (archivado el 2026-11-09)

Que una calificación de satisfacción deje de impedir el cuadre de conversaciones, para que en los tickets que la tienen se
marque —ocultar, no borrar— lo que Zoho ya no tiene; que el resumen de cada pasada del relleno se guarde donde sobreviva a un
redespliegue, con la medida de peticiones; y poder relanzar la pasada sobre los 51 tickets de E-266. Construye
`decision/calificaciones-y-borrados-de-zoho`, precisada por `decision/calificaciones-junto-con-que`. Supuestos S-1 a S-11 en
la §5 de la propuesta (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:85-101`); el
diseño añade S-12 (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:156`) y S-13 y S-14
(`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:274-275`) y los manda a la lista. El
informe de archivo manda los catorce y, con ellos, las tres preguntas de producto de la §6 de la propuesta
(`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:72-78`; las preguntas, en
`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:106-109`). La pregunta (1) es S-4; la (2)
y la (3) no tienen supuesto propio y van como filas sin ID, con lo que la tanda hace por defecto.

**El «supuesto del orquestador» de la P-3 es supuesto, no tarea de persona, y va como fila sin ID.**
(`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:133`;
`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:104`.) La tarea P-3 —correr la
consulta y que Supervisión cierre E-257— es de persona y queda fuera del recuento. Pero lleva dentro una decisión de detalle
que la construcción tomó sin preguntar, porque `decision/calificaciones-junto-con-que` le encarga comprobar si E-257
desapareció sin decir cómo (`openspec/config.yaml:6646` en `6991d1e9`): que esa comparación de recuentos es la que mide E-257 y que «0 filas»
la cierra. El propio artefacto la llama supuesto, y se puede cambiar antes de correr la consulta.

**Sin alternativa en el artefacto:** S-3, S-8 y S-11 (columna «—»), S-12 y S-14 (el diseño no la escribe) y el supuesto de la
P-3: ahí «Cómo se deshace» lo escribe esta lista. La de S-13 es la que el diseño descartó.

**IDs que se repiten y no entran:** S-1, S-2, S-3, S-12 y S-15 de la delta de spec
(`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/specs/zoho-sync/spec.md:21-25`) son los de 1G-01
(`sync-conversaciones-zoho`), que el requisito modificado arrastra de la spec viva; el S-12 de allí («sólo las venidas de Zoho»)
no es el S-12 de esta tanda. Las S-1 a S-4 de verify
(`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/verify-report.md:184-187`) son sugerencias del
verificador. Como ninguno entra en la tabla, no hace falta prefijo.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | Para dar por completa la lista de un ticket se descuentan de lo recibido las calificaciones de satisfacción; para marcar lo ausente se usan todas, así que una calificación que llega nunca se marca. Se rechaza «recibido ≥ contado» porque marcaría como borrada una conversación que Zoho sí tiene | Sumar a lo esperado las calificaciones recibidas (el artefacto la da por la misma aritmética) | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:91` | para corregir; la decisión deja esta elección a la construcción: «lo decide la construcción y lo anota como supuesto» (`decision/calificaciones-y-borrados-de-zoho`, `openspec/config.yaml:6494` en `6991d1e9`) |
| S-2 | Una calificación se reconoce porque Zoho la entrega con canal «FEEDBACK» (hipótesis: ningún dato del repositorio lo prueba); si no fuera así, la calificación cuenta como hoy y nunca se marca de más | Cambiar la regla con la que se reconoce una calificación | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:92` | para corregir; sigue siendo hipótesis hasta la tarea de persona P-1 (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:131`) |
| S-3 | Una sola regla compartida reconoce las calificaciones, y la usan el cuadre y la verificación del relleno, para que las cuatro comparaciones digan lo mismo | Una regla en cada sitio que compara | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:93` | para corregir |
| S-4 | Una calificación guardada que Zoho ya no devuelve, con la lista completa, se marca y deja de verse como cualquier otra conversación; si reaparece, se desmarca sola | Excluir las calificaciones del marcado | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:94` | para corregir |
| S-5 | El resumen de cada pasada del relleno se guarda en una tabla nueva del esquema `public`, una fila por pasada, escrita al lanzar y completada al terminar; un fallo al guardar no corta la pasada, y sólo guarda números de ticket y recuentos | Volver a dejar el resumen sólo en el log | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:95` | para corregir |
| S-6 | El resumen guardado cuenta las peticiones a Zoho pero no las lecturas de contacto y cuenta, como mucho 3 por ticket; el límite queda escrito, y con esa medida se cierra E-254 (d) | Contarlas | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:96` | para corregir; el diseño corrigió en sitio el tope, de 2 a 3 (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:170`) |
| S-7 | Los tickets a relanzar se dan como una lista de números separados por comas; pedirlo a la vez por números y por fecha de inicio se rechaza por ambiguo | Intersecar las dos condiciones en vez de rechazar | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:97` | para corregir |
| S-8 | No hay interruptor nuevo: todo queda tras los dos que ya existen, el del relleno y el de marcar lo ausente, sin líneas nuevas para la configuración | Un interruptor propio, que nazca cerrado | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:98` | para corregir · **posible pregunta para el apartado 06**: toca datos de producción; sin interruptor propio, desde el despliegue la pasada periódica marca lo ausente en los tickets con calificación que se modifiquen (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:269-270`), porque el interruptor de marcar está encendido desde el 30/10 (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:90`) |
| S-9 | La especificación modifica en su sitio, con el mismo número de líneas, los dos requisitos del cuadre y de la verificación, para no desplazar una cita; lo nuevo se añade al final | Añadir requisitos nuevos que prevalezcan sobre los antiguos, como hizo 1G-04 | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:99` | para corregir |
| S-10 | Un número de la lista que no está en la base no se recorre y se nombra en la respuesta y en el resumen; los tickets nacidos en la App se saltan como hoy | Rechazar la petición con error | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:100` | para corregir |
| S-11 | Relanzar es repetir la pasada tal como es: refresca el detalle del ticket y vuelve a guardar sus conversaciones; se lee dentro de «volver a lanzar la pasada», y lo único nuevo en producción son las marcas de los 51, la fila del resumen y una tabla vacía | Un relance que sólo escriba las marcas, sin refrescar el detalle del ticket | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:101` | para corregir · **posible pregunta para el apartado 06**: toca datos de producción; el relance vuelve a escribir el detalle y las conversaciones de los 51 tickets, y lo lee dentro del límite de Gerencia «No toca datos de producción más allá de marcar como borrado lo que Zoho ya no tiene» (`decision/calificaciones-y-borrados-de-zoho`, `openspec/config.yaml:6494` en `6991d1e9`) |
| S-12 | Como mucho 200 números por petición: cubre los 51 con margen | Otro tope, o ninguno | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:156` | para corregir |
| S-13 | El resumen guardado no lleva el progreso ticket a ticket: sólo la fila al lanzar y al terminar | Guardar el progreso ticket a ticket, la alternativa que el diseño descartó (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:84`) | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:274` | para corregir |
| S-14 | La consulta del estado puede dar la pasada por terminada un instante antes de que la fila guardada lo diga; quien la lee espera a que lo diga | Guardar el cierre antes de dar la pasada por terminada | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:274` | para corregir |
| (sin ID) · pregunta 2 de la §6 | El resumen guardado sólo lo ve el superadministrador, como hoy la ruta del relleno | Que lo vea además otro rol | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:108` | para corregir |
| (sin ID) · pregunta 3 de la §6 | Los tickets que sigan sin cuadrar tras el relance por otra causa no se reintentan en esta tanda; el resumen los nombra, con su clase (`openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/archive-report.md:97`) | Reintentarlos en esta misma tanda | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:108-109` | para corregir |
| (sin ID) · en la P-3 | La consulta de la tarea P-3 —tickets archivados cuyas conversaciones visibles, sin calificaciones, no casan con los recuentos de Zoho guardados en el ticket— es la que mide E-257, y «0 filas» la cierra, salvo los que la pasada clasifique «no está en Zoho» o «sin recuento» | Medirla con otro criterio, por ejemplo con recuentos frescos de Zoho en vez de los guardados en el ticket, que en los tickets gestionados por la App pueden ser viejos | `openspec/changes/archive/2026-11-09-calificaciones-cuadre-conversaciones/proposal.md:133` | para corregir |

**fuera-del-plan: 17 filas** (S-1 a S-14 y tres sin ID). **Posible pregunta: 2** (S-8 y S-11).

---

## 7 · fuera-del-plan · `arranque-migracion-estricta` (archivado el 2026-11-10)

La puesta al día de la base que hace el arranque de la App espera como mucho un límite fijo por sentencia, y la primera
sentencia que falla o agota ese límite detiene el arranque con una línea en el registro que dice cuál fue y por qué; el worker
del hub sigue como estaba. Construye el paso (2) de `decision/arranque-bloqueado-por-consola`. Supuestos S-1 a S-7 en la §5 de
la propuesta (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:114-126`), que los declara todos
reversibles y para la lista semanal (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:116`); el
informe de archivo los repite para esta lista y dice que S-7 no aplicó
(`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/archive-report.md:87-92`). **Una fila sin ID:** la «Ronda de
preguntas» manda también a la lista si la §26 de `DEPLOY.md` basta como procedimiento ante un arranque detenido
(`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:128-131`); el informe de archivo no la repite, y
como la propuesta no le da alternativa, su «Cómo se deshace» lo escribe esta lista. La propia propuesta señala S-3 y S-1 como
los que más conviene que Gerencia lea (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:185`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | Sólo el arranque de la App se detiene ante un fallo de la puesta al día de la base; el worker del hub y las pruebas siguen saltándose la sentencia que falla y continuando | Extender el comportamiento estricto al worker, con otra ficha | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:120` | para corregir |
| S-2 | El límite de espera es un valor fijo del código, no una variable de configuración, y se documenta en la §26 de `DEPLOY.md`; cambiarlo exige publicar | Convertirlo en variable de entorno, con su línea en `.env.example` | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:121` | para corregir |
| S-3 | El límite es de 10 segundos por sentencia, no un tope total: la primera sentencia que lo agota detiene el arranque | Cambiar ese valor fijo | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:122` | para corregir |
| S-4 | La decisión habla de corregir `migrate.ts`; se construye en un módulo nuevo que reutiliza sus listas de sentencias, porque ese fichero está muy citado y lo usan llamadores que siguen tolerantes | Llevar la lógica a `migrate.ts`, en su sitio | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:123` | para corregir |
| S-5 | La especificación sólo añade requisitos nuevos, que declaran que en el arranque de la App prevalece lo estricto, sin modificar los dos anteriores que dicen lo contrario (RQ-ZS-10 y RQ-ZS-51) | Modificar RQ-ZS-10 y RQ-ZS-51 | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:124` | para corregir |
| S-6 | La línea que explica la parada sale por el registro de la App, no por el canal de errores, para no depender de que el panel de despliegue lo muestre; lleva la sentencia, el error y, si es el límite, su valor | Otra vía de registro | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:125` | para corregir |
| S-7 | Si la prueba del arranque real no veía esa línea en el registro, el módulo la escribiría además por el canal de errores, justo antes de parar | Quitar esa segunda escritura | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:126` | **sin objeto: no aplicó**; la prueba del arranque real vio la línea (`openspec/changes/archive/2026-11-10-arranque-migracion-estricta/archive-report.md:61`; `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/apply-progress.md:89`) |
| (sin ID) | La §26 de `DEPLOY.md` basta como procedimiento ante un arranque detenido: buscar la línea del registro, cortar la sesión que bloquea o volver a la imagen anterior | Completar el procedimiento con lo que Gerencia pida | `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/proposal.md:130` | para corregir |

**fuera-del-plan (`arranque-migracion-estricta`): 8 filas**, una sin objeto (S-7). **Posible pregunta: 0.**

---

## 8 · F1B-13 · `cierre-f1b13-con-lo-construido` (archivado el 2026-11-10)

Cierre sin código de F1B-13 con lo construido, por `decision/filas-que-no-cierran-antes-del-corte` (1): contrasta pieza a pieza
la fila con sus tres cambios archivados, pasa el envío físico de la pieza a F1B-16 y corrige en su sitio la prueba que fija la
lista «en curso». Supuestos S-1 a S-5 en «Supuestos reversibles» de la propuesta, con su alternativa
(`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:222-230`); el informe de archivo los repite con
plazo de una semana desde que se publiquen
(`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:52-60`), y su tarea de persona P-8 pide a
Gerencia revisarlos en esta lista
(`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:102`). Los supuestos de la fila sin lista
aceptada —los de `medicion-garantias-por-marca` y los S-1 a S-12 de `ficha-garantia-proveedor`— los nombran la propuesta y el
informe (`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:185-188`;
`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:79-81`), y la P-7 deja a Supervisión
decidir en qué lista entran
(`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:101`): no se detallan aquí.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La cabecera cita como pasajes del maestro M4.4 y el Anexo D nº 7, como el primer cambio de la fila | Citar sólo el Anexo D nº 7, como los dos últimos cambios de la fila | `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:226` | para corregir |
| S-2 | La cabecera declara como capacidad sólo la reconciliación, porque el único efecto del cierre es el recuento del avance y la prueba que lo fija | Declarar las tres capacidades del primer cambio de la fila: `tickets-core`, `permissions` y `derivacion-avisos` | `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:227` | para corregir |
| S-3 | El cierre declara que no deja el maestro desactualizado: el «Sin empezar» del §3.3 es una foto de la revisión y la corrección de contenido ya está entregada en la nº 29; si su punto 3 debe decir que el envío físico pasa a F1B-16 lo decide quien la pegue | Declarar que sí lo deja, con el texto nuevo del §3.3 y del punto 3 de la corrección 29 para Gerencia | `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:228` | para corregir |
| S-4 | La carga de las piezas con fallas repetidas en la taxonomía ISO 14224 no es contenido de F1B-13: ni la fila ni su remanente la nombran, y la decisión de respaldo la engancha a la de la taxonomía, cuya tanda es F1D-07 | Que Gerencia la asigne a F1B-13 y la fila no cierre hasta que exista la taxonomía, o que la sitúe por escrito en F1D-07 | `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:229` | para corregir · **posible pregunta para el apartado 06**: decide si la fila cierra —su alternativa deja F1B-13 sin cerrar hasta que exista la taxonomía— y la pieza queda sin destino escrito (`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:69-73`); la P-6 ya pide a Gerencia situar esa fila (`openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/archive-report.md:100`) |
| S-5 | La comprobación de las fichas anteriores con importe, por si alguna se anotó en pesos (P-1 de `valor-reclamado-usd`), sigue abierta con su dueño aunque el supuesto de la moneda única (S-8) esté aceptado | Que Gerencia la dé por cerrada con S-8 | `openspec/changes/archive/2026-11-10-cierre-f1b13-con-lo-construido/proposal.md:230` | para corregir; S-8 de `valor-reclamado-usd` lo aceptó `decision/supuestos-02-11-aceptados`, y la comprobación figura en la bandeja como E-282, abierta (`docs/sdd/ENTRADA.md:2513` en `6991d1e9`) |

**F1B-13: 5 filas.** **Posible pregunta: 1** (S-4).

---

## 9 · F1C-05 · `cierre-f1c05-nivel-cargo` (archivado el 2026-11-10)

Cierre sin código de F1C-05 en su nivel cargo, por `decision/filas-que-no-cierran-antes-del-corte` (2): contrasta la fila con
sus tres cambios archivados, deja el propietario del registro en F1C-13 y corrige en su sitio la prueba que fija la lista «en
curso». Supuestos S-1 a S-6 en «Supuestos reversibles» de la propuesta, con su alternativa
(`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:240-249`); el informe de archivo los repite
(`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/archive-report.md:60-70`) y su P-9 pide a Gerencia revisarlos en
esta lista (`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/archive-report.md:119`). El verificador subraya que S-4
y S-5 son supuestos y no decisiones
(`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/verify-report.md:57-58`). Los S-1 a S-6 de
`decisionales-por-cargo`, supuestos de la fila sin lista aceptada, los nombran la propuesta y el informe
(`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:183-185`;
`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/archive-report.md:94-95`), y la P-8 deja a Supervisión decidir su
lista (`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/archive-report.md:118`): no se detallan aquí.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La cabecera cita como pasajes del maestro M1.9.1 y el Anexo D nº 39, como `permisos-por-cargo`; M1.9.1 es la fuente de la fila en la R01.1, y sin él el recuento la marcaría «sin verificar» | Citar M1.9 y el Anexo D nº 39, como `decisionales-por-cargo`, que también casa con la fuente de la fila | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:244` | para corregir |
| S-2 | La cabecera declara como capacidad sólo la reconciliación, porque el único efecto del cierre es el recuento del avance y la prueba que lo fija | Declarar las tres capacidades de los cambios de la fila: `permissions`, `transitions-st` y `trazas` | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:245` | para corregir |
| S-3 | El cierre declara que no deja el maestro desactualizado: lo que dice de F1C-05 es una foto de la revisión, sólo cambia el ID de la fila del propietario, y el texto nuevo va a Supervisión | Declarar que sí lo deja, con el texto nuevo de M1.9.1, del §3.3 y del Anexo D para Gerencia | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:246` | para corregir |
| S-4 | Lo construido, verificado y archivado detrás de un interruptor que una decisión mantiene apagado hasta enero (los Decisionales por cargo) cuenta como construido | Que la fila no cierre hasta encender el interruptor en enero; el propio artefacto advierte que eso contradiría la consecuencia (2), que la cierra antes del corte | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:247` | para corregir |
| S-5 | Que sólo la persona a cargo pueda reasignar, y que Solicitud / Entrega de repuestos sólo la hagan sus dos ejecutores, son del nivel «propietario del registro» y van con él a F1C-13, aunque esa fila no las nombre | Que Gerencia las sitúe en otra fila | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:248` | para corregir · **posible pregunta para el apartado 06**: toca permisos; dos restricciones de permiso salen de la fila cerrada por supuesto, sin decisión que las sitúe, hacia una fila que no las nombra (`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/verify-report.md:57-58`) |
| S-6 | Los dos campos de cargo (E-092, Anexo D nº 75) son una pregunta de Gerencia, no pieza de la fila; si la respuesta pide unificarlos, es trabajo nuevo con su fila | Que Gerencia la asigne a F1C-13 | `openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/proposal.md:249` | para corregir; la pregunta de fondo ya es la tarea de persona P-2 de Gerencia, sin destino a propósito (`openspec/changes/archive/2026-11-10-cierre-f1c05-nivel-cargo/archive-report.md:112`) |

**F1C-05: 6 filas.** **Posible pregunta: 1** (S-5).

---

## 10 · F1C-07 · `cierre-f1c07-con-lo-construido` (archivado el 2026-11-10)

Cierre sin código de F1C-07 con lo construido, por `decision/e248-adelanto-f1c` (3): Control de calidad queda construido detrás
de un interruptor apagado hasta enero; la foto del equipo embalado y la guarda de salida pasan a F1B-17, y la firma con imagen a
F1E-04. Supuestos S-1 a S-7 en «Supuestos reversibles» de la propuesta, con su alternativa
(`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:250-260`); el informe de archivo los repite y
aclara que S-5 y S-6 fijan sólo un destino: si Gerencia los corrige, la fila sigue cerrada
(`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/archive-report.md:56-69`). Su P-1 pide a Gerencia confirmar
o corregir esos dos destinos en esta lista
(`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/archive-report.md:103`), y la P-8, revisar los siete
(`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/archive-report.md:110`). Los S-1 a S-18 de
`control-calidad-liberacion`, supuestos de la fila sin lista aceptada, los nombra la propuesta
(`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:187-188`), y la P-5 deja a Supervisión decidir
su lista (`openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/archive-report.md:107`): no se detallan aquí.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La cabecera cita como pasajes del maestro M9.1, M1.7 y M2.5, como `control-calidad-liberacion`; M9.1 es la fuente de la fila en la R01.1 | Citar sólo M9.1, que también casa con la fuente de la fila | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:254` | para corregir |
| S-2 | La cabecera declara como capacidad sólo la reconciliación, porque el único efecto del cierre es el recuento del avance y la prueba que lo fija | Declarar las cuatro capacidades del cambio de la fila: `transitions-st`, `permissions`, `derivacion-avisos` y `trazas` | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:255` | para corregir |
| S-3 | El cierre declara que no deja el maestro desactualizado aunque M9.1, M1.7 y el §3.3 sí lo quedan, siguiendo el precedente de los cierres sin código de F1B-04, F1B-13 y F1C-05; el propio supuesto reconoce que va contra la letra de la regla de la cabecera, y el texto nuevo va a Supervisión | Declarar que sí lo deja, con el texto nuevo de M9.1, M1.7 y el §3.3 para Gerencia | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:256` | para corregir |
| S-4 | Lo construido, verificado y archivado detrás del interruptor de Control de calidad, que una decisión mantiene apagado hasta enero, cuenta como construido; la misma decisión ordena cerrar con lo construido | Que la fila no cierre hasta encender el interruptor en enero; el propio artefacto advierte que eso contradiría la consecuencia (3) | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:257` | para corregir |
| S-5 | La pieza «el checklist revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida» va a F1E-03, sin respuesta de Gerencia que fije ese destino; no condiciona el cierre | Que Gerencia la sitúe en otra fila | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:258` | para corregir; Supervisión anotó ese destino como nota de precisión de `decision/c6-qa-liberacion`, «pendiente de su P-1» (`openspec/config.yaml:1891` en `6991d1e9`), que no es respuesta de Gerencia |
| S-6 | El indicador de retrabajo de M7.1 va a la tanda de indicadores de Fase 2 (`kpis`), no a F1F-05, que tiene lista cerrada de nueve; F1C-07 deja el registro del retrabajo y su conteo | Que Gerencia lo sitúe en F1F-05 o en otra fila | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:259` | para corregir; la bandeja lo registra como punto abierto E-283, con dueño Gerencia (`docs/sdd/ENTRADA.md:2519` en `6991d1e9`) |
| S-7 | El «checklist firmado» que pide la guarda de salida se da por construido como la firma registrada en la traza; a F1B-17 pasa sólo exigirlo al salir de «Por Entregar» | Que Gerencia entienda por «firmado» la firma con imagen, que va a F1E-04 | `openspec/changes/archive/2026-11-10-cierre-f1c07-con-lo-construido/proposal.md:260` | para corregir |

**F1C-07: 7 filas.** **Posible pregunta: 0.**

---

## 11 · F1B-09 · `cierre-f1b09-repaso-auditoria` (archivado el 2026-11-12)

Cierre de F1B-09 por `decision/f1b09-epica-1b-antes-del-corte`: repaso de la auditoría del blueprint sobre el código de hoy, con
diecinueve discrepancias y un destino cada una (bandeja o fila de 2027), corrección de las dos líneas de las especificaciones que
aún mandaban a F1B-09 trabajo hecho y de la prueba que la marcaba «en curso». Supuestos S-1 a S-6 en «Supuestos reversibles» de
la propuesta, con su alternativa
(`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:145-154`); el informe de archivo los repite
(`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/archive-report.md:91-101`) y su P-5 pide a Gerencia
revisarlos en esta lista
(`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/archive-report.md:132`). **S-2 se corrigió en el verify:**
el verificador encontró que no se sostenía
(`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/verify-report.md:34-37`); la propuesta archivada lleva la
versión corregida, marcada «Corregido en el verify», y es la que va en la tabla. La versión de la planificación daba el flujo de
la remisión no auditado por cosa de la remisión de entrada y mandaba todas las discrepancias a la bandeja
(`openspec/changes/cierre-f1b09-repaso-auditoria/proposal.md:149` en `4594beb0`). Ningún artefacto del cambio menciona supuestos
de la fila sin lista aceptada: `grep -n -i -E "sin lista|nunca publicad|Supuestos_semana"` sobre sus `.md`, deltas incluidas, da
0.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | Es discrepancia lo que la auditoría, o un registro vivo que la sigue, afirma y no coincide con `main`, y todo hallazgo abierto con un destino que ya no lo es; lo confirmado, y lo superado con su registro al día, va en el contraste y no en la lista | Listar también como discrepancia todo lo superado, aunque su registro ya esté al día | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:149` | para corregir |
| S-2 | El flujo de la remisión que la auditoría no revisó es común a todas las remisiones, así que esa discrepancia se parte en dos: el envío va a F1B-16 (D-15) y la anulación, la restauración y la respuesta de n8n a F1B-17 (D-17); las demás van a la bandeja | Que las dos vayan a la bandeja y Supervisión las sitúe | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:150` | **corregido en el verify** (`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/verify-report.md:34`); la versión corregida sigue para corregir: D-15 y D-17 llevan destino de 2027 por supuesto y no por decisión, y si Gerencia lo corrige van a la bandeja (`openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/verify-report.md:61`) |
| S-3 | Las dos líneas de las especificaciones que mandaban a F1B-09 trabajo hecho se corrigen por delta, fusionada por script línea a línea, aunque no son requisitos | Editarlas en su sitio durante la aplicación, sin delta, como el precedente de `cifras-caducas-y-lectores-de-servicio` | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:151` | para corregir |
| S-4 | Los commits que se citan para la columna propia del tablero y para el mapa generado de los tres flujos son las fusiones en `main`, con el archivo de cada uno al lado | Citar sólo el commit de archivo | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:152` | para corregir |
| S-5 | Las otras cuatro líneas desfasadas de las mismas dos secciones «Fuera de alcance» no se tocan y van a la lista de discrepancias (D-13) | Corregirlas en la misma delta | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:153` | para corregir |
| S-6 | El repaso no rehace lo que la auditoría declaró no haber hecho y queda fuera de una lectura del árbol (la aplicación desplegada, el cliente entero, «cliente sin ruta», la ejecución de B-3, el contraste de cada tanda con su informe y el flujo de la remisión); dice, para cada punto, si sigue igual y por qué | Ampliar el repaso a alguno de esos puntos, con otra talla | `openspec/changes/archive/2026-11-12-cierre-f1b09-repaso-auditoria/proposal.md:154` | para corregir |

**F1B-09: 6 filas**, una corregida en el verify (S-2). **Posible pregunta: 0.**

---

## 12 · Supuestos del analista fuera de un cambio

Son decisiones de detalle del analista que no pertenecen a ningún cambio archivado: configuración de producción, límites de
las pruebas y una pasada en seco. Ninguna fuente trae columna de alternativa, así que «Cómo se deshace» lo escribe esta
lista. La fila E-268 (3) no estaba en el encargo de esta lista; entra porque la bandeja la manda a «la siguiente» lista
(`docs/sdd/ENTRADA.md:2430` en `6991d1e9`), que es esta.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| E-268 (1) | El límite de 15 minutos para transacciones ociosas se fijó sólo en la base `desk` (`ALTER DATABASE`), no en todo el servidor de `desk-db` | Quitarlo con `ALTER DATABASE desk RESET idle_in_transaction_session_timeout`, o fijarlo en todo el servidor | `openspec/config.yaml:6475` en `6991d1e9` (`decision/arranque-bloqueado-por-consola`, consecuencia (1): «Sólo afecta a la base `desk` (supuesto del analista)») | para corregir |
| E-268 (3) | Desde el 03/11, toda consulta de persona en `desk-db` va en forma `psql -c "…"`, que sale sola, y todo despliegue empieza comprobando que no queda ninguna sesión `idle in transaction` | Volver a las consolas interactivas sin comprobación previa | `docs/sdd/ENTRADA.md:2428` en `6991d1e9` | **decidido por Gerencia** el 08/11/2026: «El procedimiento de consultas y publicaciones se mantiene» (`decision/arranque-bloqueado-por-consola`, consecuencia (4), `openspec/config.yaml:6482` en `6991d1e9`) |
| E-287 | Las dos pruebas de conversaciones que rozaban los 5 s del CI llevan un límite propio de 20 s, también en local | Quitar el límite propio y dejar el de toda la suite | `packages/zoho-sync/src/conversaciones.test.ts:311` en `13b9a694` y `packages/zoho-sync/src/sync.conversaciones.test.ts:61` en `13b9a694`; registro en `docs/sdd/ENTRADA.md:2549` en `6991d1e9` | para corregir |
| E-288 | En el CI toda prueba tiene 20 s de límite (`--testTimeout=20000`); en local sigue el de 5 s | Quitar la opción del CI, o subir también el límite local | `.github/workflows/ci.yml:45` en `de9dcd73`; registro en `docs/sdd/ENTRADA.md:2561` en `6991d1e9`, que la manda a esta lista | para corregir |
| Pasada en seco F1F-01 | El corte de la pasada en seco se puso al final del día en que se hizo (`2026-11-12T23:59:00-05:00`), para que entraran todos los abiertos | Repetir la pasada con otro corte; no escribe nada, así que repetirla no cuesta | `openspec/config.yaml:5646` en `6991d1e9` (`decision/f1f01-fecha-pasada-en-seco`, consecuencia (5)) registra el corte; el porqué no estaba escrito en el repositorio y queda escrito aquí | para corregir. La pasada ya se hizo el 12/11 y es sólo de lectura |

**Analista: 5 filas**, una decidida por Gerencia (E-268 (3)). **Posible pregunta: 0.**

---

## Recuento de esta lista

«Con otro estado» cuenta las filas que ya no están para corregir, con su fuente en la fila: decididas, retiradas, sin objeto
o superadas. Las corregidas en parte o en el verify siguen en la lista, porque lo que queda de ellas sigue para corregir.

| § | Tanda | Cambio | Filas | Con otro estado | Corregidas en parte o en el verify | Posible pregunta para el apartado 06 |
|---|---|---|---|---|---|---|
| 1 | 1G-01 | `relleno-completo-conversaciones` | 32 | 5 (S-16, S-17, S-21, S-24, S-31) | 2 (S-9, S-10) | 0 |
| 2 | F1B-04 | `cierre-f1b04-con-lo-construido` | 5 | 0 | 0 | 1 (S-5) |
| 3 | 1G-02 | `persistencia-adjuntos` | 49 | 3 (S-a, S-c, L5-1) | 1 (L5-8) | 0 |
| 4 | 1G-03 | `verificacion-completitud` | 14 | 2 (S-d, S-f) | 0 | 2 (S-c, S-k) |
| 5 | 1G-04 | `modo-sin-zoho` | 16 | 1 (S-a) | 0 | 1 (S-o) |
| 6 | fuera-del-plan | `calificaciones-cuadre-conversaciones` | 17 | 0 | 0 | 2 (S-8, S-11) |
| 7 | fuera-del-plan | `arranque-migracion-estricta` | 8 | 1 (S-7) | 0 | 0 |
| 8 | F1B-13 | `cierre-f1b13-con-lo-construido` | 5 | 0 | 0 | 1 (S-4) |
| 9 | F1C-05 | `cierre-f1c05-nivel-cargo` | 6 | 0 | 0 | 1 (S-5) |
| 10 | F1C-07 | `cierre-f1c07-con-lo-construido` | 7 | 0 | 0 | 0 |
| 11 | F1B-09 | `cierre-f1b09-repaso-auditoria` | 6 | 0 | 1 (S-2) | 0 |
| 12 | — | supuestos del analista | 5 | 1 (E-268 (3)) | 0 | 0 |
| | | **Total** | **170** | **13** | **4** | **8** |

---

## Anexo de la lista del 02/11

Los 270 supuestos de 32 cambios del anexo de `docs/sdd/Supuestos_semana_2026-11-02.md` siguen siendo de Supervisión, y aquí
no se detallan. **Ninguna decisión posterior dice a qué lista van:** `decision/supuestos-02-11-aceptados` acepta sólo los 54
de la lista. Además, `grep -n -i "sin lista aceptada\|anexo de supuestos\|nunca publicados\|supuestos nunca"` sobre
`openspec/config.yaml` y `CLAUDE.md` da 0. Los cierres de F1B-13, F1C-05 y F1C-07 dejan esa elección a Supervisión, cada uno
con su tarea de persona (secciones 8 a 10).
