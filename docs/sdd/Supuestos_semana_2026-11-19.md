# Supuestos reversibles — lista semanal del 2026-11-19

**Fuera del plan.** Motivo: `decision/preguntas-de-detalle-sin-llegar`. Es la **tercera** lista. La primera,
`docs/sdd/Supuestos_semana_2026-11-02.md`, tenía 54 supuestos, y Gerencia los aceptó todos el 09/11/2026
(`decision/supuestos-02-11-aceptados`). La segunda, `docs/sdd/Supuestos_semana_2026-11-12.md`, tenía 170; en `b3fbe5b9` ninguna
decisión la acepta ni la corrige todavía (`git grep` de su nombre sobre `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y
`CLAUDE.md` da 0). Esta lista recoge lo que se archivó o se commiteó en `main` desde la del 12/11 (`96cba5ab`) y no está en ella:
tres cambios archivados, dos commits directos sin carpeta y los supuestos que el analista tomó fuera de un cambio.

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
la línea sin que nada se pusiera rojo (regla de mutación 4). `b3fbe5b9` es el `main` sobre el que se escribe la lista. Las
citas a `openspec/changes/archive/` no la llevan, porque esas carpetas no se editan después de archivar. Las del código de los
commits directos (sección 4) llevan el commit que las escribió.

---

## 1 · fuera-del-plan · `pool-conexion-cortada` (archivado el 2026-11-12)

Los dos pools de la base escuchan su evento de error: si el servidor corta una conexión en reposo, la App y el worker dejan una
línea en el registro, sin secretos, y siguen vivos. Atiende E-285, que la bandeja da por resuelta
(`docs/sdd/ENTRADA.md:2537` en `b3fbe5b9`). Supuestos S-1 a S-7 en la §5 de la propuesta
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:99-105`), «Todos reversibles; van a la lista semanal»
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:95`), y D-1 a D-9 en la §12 del diseño
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:239-247`). El informe de archivo manda los dieciséis y
destaca D-1 y D-7 (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/archive-report.md:74-77`).

**Una fila sin ID.** La ronda de preguntas que no se hizo manda a la lista, junto a S-4 y S-1, si el cliente que la App toma
prestado del pool merece su propio cambio
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:107-110`). Lo que la tanda hizo por defecto fue dejarlo
fuera y escribirlo como límite (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:80`). La propuesta no le da
alternativa, así que su «Cómo se deshace» lo escribe esta lista.

**No se cuentan** los tres apartados «Desvíos del diseño» de `apply-progress.md`, uno por lote
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:49`,
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:112` y
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:210`): no se declaran supuestos y el informe de
archivo no los manda a la lista. Uno de ellos cambia D-9, y va en su Estado. Tampoco se cuentan las sugerencias S-1 a S-4 del
verificador (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:152-155`), aunque coincidan en número
con las de la propuesta.

**Lo que pasó después, y se señala en Estado:** `cliente-prestado-conexion-cortada` (sección 2) construyó el cliente prestado y
convirtió en requisito una de las dos pruebas de caracterización de D-7.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La propuesta deja abierta la vía por la que sale la línea y la cierra el diseño, con estos datos: el paquete de la base no puede usar el registro de la App, el worker escribe por consola, y que EasyPanel enseñe la salida de errores es hipótesis | Cambiar la vía de registro | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:99` | para corregir; lo concreta D-1 |
| S-2 | La línea lleva un texto fijo, el mensaje y el código de error de PostgreSQL si lo hay; ni el objeto de error ni nada de la conexión | Añadir campos, sin secretos | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:100` | para corregir |
| S-3 | Sin interruptor ni variable nueva: escuchar el error no enciende ningún escritor, así que la regla de secretos no pide uno | Añadir la variable, con su línea en `.env.example` y en `DEPLOY.md` | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:101` | para corregir |
| S-4 | Una línea por cada conexión perdida, sin agrupar ráfagas; un reinicio de la base daría como mucho tantas líneas como conexiones en reposo tenga cada pool (10 por defecto) | Agrupar con una ventana de tiempo | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:102` | para corregir |
| S-5 | La prueba contra PostgreSQL real corre en un contenedor desechable con PostgreSQL 17, nunca contra producción, que es la 17.11 | Otra imagen | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:103` | para corregir |
| S-6 | La especificación sólo añade requisitos, desde RQ-ZS-58, sin modificar RQ-ZS-57, que dice que `DEPLOY.md` termina con la §26 | Modificar RQ-ZS-57 | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:104` | para corregir; así lo hizo la especificación: RQ-ZS-62 declara que la §27 sucede a la §26 (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/archive-report.md:70`) |
| S-7 | La lógica va en un módulo nuevo, porque el fichero de los pools no admite líneas nuevas sin desplazar citas | Llevarla al fichero de los pools, con barrido de citas | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:105` | para corregir |
| D-1 | La línea sale por la salida de errores del proceso (stderr) | Sacarla por la salida normal y cambiar la frase de la §27 de `DEPLOY.md` | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:239` | para corregir; que EasyPanel la enseñe sigue siendo hipótesis hasta la tarea de persona P-2 (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/archive-report.md:84`) |
| D-2 | La línea tiene la forma «texto — mensaje [código]» | Cambiar el texto fijo; la prueba de la §27 lo importa y habría que reescribirla | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:240` | para corregir |
| D-3 | El mensaje se junta en una sola línea, y las direcciones de conexión que lleve se sustituyen por «url omitida» | Quitar el saneado y su prueba | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:241` | para corregir |
| D-4 | El código se escribe si tiene hasta 32 letras, cifras o guiones bajos, para admitir los de PostgreSQL y los de Node | Admitir sólo el código de PostgreSQL, de cinco caracteres | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:242` | para corregir |
| D-5 | Un error que no es un objeto de error y un fallo interno tienen una redacción fija; si falla el propio registro, se ignora sin tumbar nada | Otra redacción | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:243` | para corregir |
| D-6 | La prueba contra PostgreSQL lanza un proceso hijo con tsx y le pasa la base por la variable de pruebas | Un solo proceso con `node --import tsx` | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:244` | para corregir |
| D-7 | Las dos situaciones que el cambio no cubre, una consulta en curso y el cliente prestado, se miden como pruebas de caracterización (I-3 e I-4): si una versión futura cambia ese comportamiento, se ponen rojas a propósito | Dejarlas como medición anotada y borrar las dos pruebas | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:245` | **superado en parte por un cambio posterior**: `cliente-prestado-conexion-cortada` convierte I-4 en requisito (S-7 de la sección 2, `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:167`); lo demás, para corregir |
| D-8 | Nombres del módulo, del proceso hijo de la prueba y de la prueba de la §27 | Renombrarlos; nadie los cita aún | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:246` | para corregir |
| D-9 | La base de pruebas corre en un contenedor llamado «pcc-pg», en el puerto 55433 | Otro nombre o puerto | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:247` | **corregido al aplicar**: se usó el puerto 55434, porque el 55433 lo ocupaba un contenedor ajeno (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:113`); lo demás, para corregir |
| (sin ID) · cliente prestado | El cliente que la App toma prestado del pool para una transacción queda fuera del cambio y se escribe como límite | Un cambio propio para el cliente prestado | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:80` | **superado por un cambio posterior**: lo construyó `cliente-prestado-conexion-cortada`, que atiende E-290 (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/archive-report.md:103`; sección 2) |

**`pool-conexion-cortada`: 17 filas** (S-1 a S-7, D-1 a D-9 y una sin ID): una superada por un cambio posterior (la sin ID), una
superada en parte (D-7) y una corregida al aplicar (D-9). **Posible pregunta: 0.**

---

## 2 · fuera-del-plan · `cliente-prestado-conexion-cortada` (archivado el 2026-11-13)

El cliente que la App toma prestado del pool también escucha su evento de error. Si el servidor corta su conexión, deja una línea
en el registro y la operación de ese usuario falla sin confirmar su transacción, pero el proceso sigue vivo. Atiende E-290
(`docs/sdd/ENTRADA.md:2567` en `b3fbe5b9`), que salió del aviso W-1 del verify de la sección 1. Supuestos S-1 a S-8 en la §8 de
la propuesta (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:161-168`), «Todos reversibles; van
a la lista semanal» (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:157`), y D-1 a D-14 en la
§13 del diseño, «Decisiones y supuestos del diseño (a la lista semanal)»
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:278-291`). El informe de archivo manda los
veintidós y destaca S-1, S-2 y D-9
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/archive-report.md:78-81`).

**La tercera pregunta de su ronda no es un supuesto.** La propuesta manda «a la lista semanal o a Supervisión» si se retira la
precaución de la §26 de `DEPLOY.md`, que es cortar sólo la sesión de la consola
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:170-172`). El cambio no la retira, porque es un
procedimiento de persona (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:152-153`), y se la
deja a Supervisión. Supervisión ya la anotó en E-285: la precaución sigue vigente, con la razón corregida
(`docs/sdd/ENTRADA.md:2537` en `b3fbe5b9`).

**Sin alternativa en el artefacto:** D-7 y D-10 llevan «—»; en las dos, «Cómo se deshace» lo escribe esta lista. **No se cuentan**
las sugerencias S-1 a S-3 del verificador
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/verify-report.md:160-162`), ni la «desviación menor del
diseño» del primer lote, que no se declara supuesto
(`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/apply-progress.md:27`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | El texto fijo de la línea es «Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue», seguido del mensaje y, si lo hay, del código; es distinto del de E-285 para que las pruebas no cuenten una línea por la otra | Otro texto; la §27 y su guarda lo leen del código | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:161` | para corregir |
| S-2 | Una línea por cliente, la de su primer error; los siguientes del mismo cliente se callan, y un corte de varias conexiones prestadas da una línea por cada una, sin agrupar | Una línea por evento, o agrupar | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:162` | para corregir |
| S-3 | La línea sale por el mismo canal que la de E-285, la salida de errores (D-1 de la sección 1); que EasyPanel la enseñe sigue siendo hipótesis | Otro canal de registro | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:163` | para corregir |
| S-4 | Sin interruptor ni variable: escuchar el error no enciende ningún escritor, así que la regla de secretos no pide uno | Una variable, con su línea en `.env.example` y en `DEPLOY.md` | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:164` | para corregir |
| S-5 | La prueba contra PostgreSQL real corre en un contenedor desechable con PostgreSQL 17.10, nunca contra producción, que es la 17.11 | Otra imagen | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:165` | para corregir |
| S-6 | La especificación añade requisitos desde RQ-ZS-63, y la fase de especificación elige entre modificar RQ-ZS-62 o declarar que el requisito nuevo prevalece sobre él | La otra vía | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:166` | para corregir; la especificación eligió la precedencia declarada (RQ-ZS-67), sin modificar RQ-ZS-62 (`openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/archive-report.md:73-74`) |
| S-7 | La prueba I-4 deja de ser caracterización y pasa a requisito: el cliente prestado ya no tumba el proceso | Dejar I-4 como estaba y añadir otra prueba | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:167` | para corregir |
| S-8 | El proceso hijo de la prueba gana los modos que hagan falta, o se crea otro; lo decide el diseño | Otro proceso hijo | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/proposal.md:168` | para corregir; lo concreta D-4 |
| D-1 | La lógica va al final del módulo de la sección 1, con un único enganche en su línea 44: no se tocan ni los seis sitios que toman un cliente prestado ni el fichero de los pools | Devolver la línea 44 a como estaba y borrar el bloque final | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:278` | para corregir |
| D-2 | Las pruebas unitarias nuevas, U-11 a U-19, van al final de su fichero, con un pool y unos clientes simulados | Borrarlas | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:279` | para corregir |
| D-3 | I-4 se reescribe en su sitio, con sus once líneas; I-1, I-2 e I-3 cuentan, en su sitio, las dos clases de línea; las pruebas nuevas van antes del cierre | Devolver I-4 a caracterización (S-7) | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:280` | para corregir |
| D-4 | El proceso hijo se amplía en su sitio, sin crear un segundo hijo que duplicaría el protocolo | Otro proceso hijo (S-8) | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:281` | para corregir |
| D-5 | La guarda de la §27 se amplía en su sitio, y lo nuevo va al final | Otra forma de la guarda | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:282` | para corregir |
| D-6 | La §27 de `DEPLOY.md` se corrige en sitio en sus ocho renglones, y lo nuevo va en un bloque al final, para que siga siendo la última sección | Otro reparto del texto | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:283` | para corregir |
| D-7 | Cada mutación de prueba toca una sola línea, y se restaura comprobando su huella | Mutar por bloques; en el producto no queda nada que deshacer | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:284` | para corregir |
| D-8 | La medición corre en el contenedor de pruebas del orquestador, en el puerto 55432, con el rojo de la integración antes de tocar el módulo | Otro contenedor u otra imagen | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:285` | para corregir |
| D-9 | Los lotes se reordenan: la integración pasa al primero, delante del módulo, para ver su rojo antes de escribir el código; cambia la decisión 9 del orquestador | Volver al reparto del encargo y medir el rojo con la línea 44 devuelta a como estaba | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:286` | para corregir |
| D-10 | La pregunta de la §26 se responde con I-4 a I-6 y con los rechazos de la operación | Responderla con otra medida | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:287` | para corregir |
| D-11 | El proceso hijo espera, con un tope, a que el cliente se cierre antes de la siguiente consulta, para que la línea y el número de errores no dependan de una carrera | Quitar la espera y fijar sólo «una línea, la que salga» | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:288` | para corregir |
| D-12 | Se recuerda qué clientes tienen ya oyente sin retener los descartados, y el oyente de cada cliente no se quita: un error tardío no hace ruido | Una lista que se vacíe al retirar el cliente del pool | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:289` | para corregir |
| D-13 | Los nombres de las funciones, constantes y pasos nuevos son paralelos a los de E-285 | Renombrarlos; nadie los cita | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:290` | para corregir |
| D-14 | La guarda de la §27 exige «su transacción no se confirma» y «no se corta», y prohíbe «sigue muriendo» | Otras frases | `openspec/changes/archive/2026-11-13-cliente-prestado-conexion-cortada/design.md:291` | para corregir |

**`cliente-prestado-conexion-cortada`: 22 filas** (S-1 a S-8 y D-1 a D-14). **Posible pregunta: 0.**

---

## 3 · F1F-01 · `marcador-migracion-lectores` (archivado el 2026-11-17)

La migración del 12/12 deja una fila en el historial de cada ticket abierto, el «marcador». Con este cambio, esa fila queda como
rastro y no cuenta ni se enseña como etapa: el historial la redacta en español como «Migración desde Zoho Desk», la conversación
y la hoja de vida la ocultan, y la alarma y los relojes fechan con la fecha de Zoho. Construye
`decision/marcador-migracion-en-pantallas` (Gerencia, 17/11/2026; `openspec/config.yaml:6766` en `b3fbe5b9`) y resuelve E-215 a
E-217 y E-291. Supuestos S-1 a S-9 en la §5 de la propuesta
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:121-139`) y S-10 a S-13 en la §12 del diseño
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:235-242`). El informe de archivo manda los trece,
destaca S-1, S-2, S-3, S-10 y S-11
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/archive-report.md:83-88`), y su tarea de persona pide a Gerencia
revisarlos en esta lista (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/archive-report.md:95`).

**Qué dejó decidido Gerencia y qué es supuesto.** Gerencia respondió «si» al criterio por defecto que propuso el analista: la
fila se conserva como rastro, no cuenta ni se muestra como etapa y, donde se enseñe, va en español
(`openspec/config.yaml:6769-6772` en `b3fbe5b9`). Pero la misma decisión declara ese criterio reversible y manda anotarlo como
supuesto en la propuesta (consecuencia (1), `openspec/config.yaml:6774` en `b3fbe5b9`), y deja al diseño cómo se obtiene la
fecha de Zoho (consecuencia (4), `openspec/config.yaml:6777` en `b3fbe5b9`). Por eso las trece filas están «para corregir». El
verificador comprueba que ninguna contradice `decision/h1-fechas-migrados`: S-6 y S-10 son su lectura estricta, y S-1, S-10, S-11
y S-12 son criterio que la decisión deja al diseño
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:146`).

**D-2 y D-3 no llevan fila propia**, aunque el diseño también los llama supuesto reversible
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:255`). D-3 es S-10, que lo nombra. D-2 es cuál de
las fechas de Zoho se usa en S-4 y S-5 (la última entrada en Zoho al estado previo), y va escrito en esas dos filas.

**Lo que no se cuenta.** El orquestador corrigió S-4 y S-9 antes del primer commit
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:187-188`): la propuesta archivada lleva la versión
corregida, y es la que va en la tabla. No se cuentan las desviaciones del diseño de los dos lotes, que `apply-progress.md`
declara «ninguna de regla» (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/apply-progress.md:72` y
`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/apply-progress.md:174`), ni las sugerencias del verificador. Las
marcas «SUPUESTO S-n» de las deltas de spec remiten a estos mismos trece.

**Cómo se deshace:** la propuesta y el diseño nombran sólo la pieza que hay que cambiar. Para S-10, esta lista añade la
alternativa que el diseño descartó; para S-11, el diseño no dice hacia qué cambiarla.

**La migración del 12/12.** Ninguno de estos supuestos escribe datos. El cambio sólo lee, no trae migración de base, y se deshace
revirtiendo la fusión y redesplegando el servidor
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:179-180`). Pero deciden cómo se ven y se cuentan los
tickets migrados desde ese día, y la tarea de persona es desplegar el servidor antes
(`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/archive-report.md:94`). Con el plazo de una semana, si la lista
se publica antes del 05/12, la fecha de aceptación cae antes de la migración.

- **S-11 lleva la marca de posible pregunta.** El verificador pide que Gerencia lo vea antes del 12/12, porque cambia el reloj
  de tickets de producción y el número afectado no está medido
  (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:153`).
- **S-6 y S-10 no la llevan.** Son la lectura estricta de una decisión registrada
  (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:146`), y el número de tickets de S-10 ya lo
  da el informe de la migración
  (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:236`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | El historial enseña el marcador como un evento propio, titulado «Migración desde Zoho Desk», con el estado en Zoho, el estado en Desk, la regla traducida, el corte y quién la ejecutó; los campos técnicos no se enseñan | Cambiar cómo se presenta el evento | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:121` | para corregir |
| S-2 | La conversación del ticket no enseña el marcador: el hilo cuenta lo que le pasó al equipo, y la migración no le pasó al equipo | Enseñarlo con la presentación de S-1 | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:125` | para corregir |
| S-3 | La hoja de vida del equipo no enseña el marcador | Quitar el filtro, o enseñarlo con la presentación de S-1 | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:127` | para corregir |
| S-4 | La alarma de cada estado no toma la hora del marcador. Si la migración deja el ticket en su estado, el marcador no da entrada; si se lo cambia, el ticket entra en el estado nuevo con la fecha de Zoho de S-5, que es la última entrada en Zoho al estado previo (D-2). La historia de Zoho sólo se lee para los tickets con marcador | Cambiar la regla compartida | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:128` | para corregir |
| S-5 | El reloj de Análisis y el de las esperas aplican la misma regla: si el marcador no cambia el estado, no es un paso; si lo cambia, el estado nuevo empieza con la fecha de Zoho | Cambiar la regla compartida | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:130` | para corregir |
| S-6 | Sin fecha de Zoho, el ticket queda sin dato: nunca se usa la fecha de la migración ni la de creación del ticket. Que la historia de Zoho de los migrados esté completa es hipótesis; si no lo está, esos tickets quedan sin dato | Tomar la fecha de otra de las fuentes de la §4 de la propuesta | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:132` | para corregir |
| S-7 | Al borrar un ticket, el marcador cuenta entre lo que se borra | Excluirlo del recuento | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:135` | para corregir |
| S-8 | La regla va en un módulo nuevo del núcleo compartido, para no mover líneas citadas; la pantalla no lo usa, así que el cliente no cambia | Mover la regla a otro sitio | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:136` | para corregir; la hipótesis de que el cliente no cambia se comprobó: el paquete del cliente sale idéntico (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:163`) |
| S-9 | El traspaso reconoce el marcador con la misma función compartida que los demás, en lugar de su comparación propia | Volver a la comparación propia | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:138` | para corregir |
| S-10 | «Finalizado» se fecha con el cierre de Zoho, el mismo que usa el informe de contrato. Un ticket cuyo cierre puso la propia migración queda sin entrada y sin reloj, y cuántos son lo da el informe de la migración | Cambiar la regla de «Finalizado»; la alternativa que el diseño descartó es la última entrada en Zoho a «Entregado» (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:27`) | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:235` | para corregir; es el punto (3) de la ronda de preguntas de la propuesta (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/proposal.md:186`) |
| S-11 | Si un marcador que cambia el estado no tiene fecha de Zoho, toda la secuencia del reloj del ticket queda sin dato, aunque después haya transiciones reales; es el mismo criterio que hoy se aplica a un hueco. En las esperas sólo afecta a un «Pendiente» que la migración pasa a «En Proceso» y que luego entra en una espera | Cambiar cómo la secuencia resuelve el marcador; el diseño no dice hacia qué | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:238` | para corregir · **posible pregunta para el apartado 06**: toca tickets de producción y no se deshace sin coste. Desde el 12/12, mientras no se corrija, un migrado así queda sin reloj y, si entra en una espera, fuera de su alarma (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:238-240`). No está medido cuántos son, y el verificador pide que Gerencia lo vea antes del 12/12 (`openspec/changes/archive/2026-11-17-marcador-migracion-lectores/verify-report.md:153`) |
| S-12 | El corte de la migración se enseña tal como se guardó, en formato ISO y en hora UTC | Cambiar la presentación | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:241` | para corregir |
| S-13 | Una regla de migración desconocida que deja el estado relleno no da fecha: queda sin dato | Cambiar la elección de regla (D-4 del diseño) | `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:242` | para corregir |

**F1F-01: 13 filas** (S-1 a S-13). **Posible pregunta: 1** (S-11).

---

## 4 · fuera-del-plan · commits directos sin carpeta

Desde la lista anterior, dos commits directos en `main` tocan `apps/` o `packages/`
(`git log --no-merges --first-parent 96cba5ab..b3fbe5b9 -- apps packages`), y los dos tomaron un supuesto. No tienen carpeta de
cambio, así que «Dónde» cita el código en el commit que lo escribió y la traza de la bandeja.

- **`338c920f` (E-284).** Su mensaje termina con «Fuera del plan, supuesto reversible del analista (lista semanal).» No escribe
  alternativa, así que «Cómo se deshace» lo escribe esta lista.
- **`8d85ad84` (E-246).** La traza de la bandeja escribe el supuesto y su alternativa: «Las dos de 48 son un supuesto
  reversible: si se leen sólo del catálogo de servicio, serían 36» (`docs/sdd/ENTRADA.md:2280` en `b3fbe5b9`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| E-284 · `338c920f` | Las dos esperas del final de la pasada, en la prueba del relleno de adjuntos, cuentan tiempo real hasta 4 segundos, por debajo del límite local de 5 segundos por prueba, en vez de un número fijo de vueltas | Otro límite de tiempo | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:393-398` en `338c920f`; traza en `docs/sdd/ENTRADA.md:2530` en `b3fbe5b9` | para corregir |
| E-246 · `8d85ad84` | Las dos frases que contaban «31» transiciones sin fechas derivadas dicen hoy 48, las de los tres flujos, porque el servidor aplica esa regla a los tres catálogos | Escribir 36, sólo las del catálogo de servicio, en las dos líneas y en su sitio | `apps/desk/server/services/valoresDeTransicion.ts:10` en `8d85ad84` y `packages/shared/src/fechasDerivadas.ts:89` en `8d85ad84`; traza en `docs/sdd/ENTRADA.md:2280` en `b3fbe5b9` | para corregir |

**Commits directos: 2 filas.** **Posible pregunta: 0.**

---

## 5 · Supuestos del analista fuera de un cambio

**0 filas.** `git diff 96cba5ab b3fbe5b9 -- docs/sdd/ENTRADA.md openspec/config.yaml` añade 67 líneas y quita 27. Buscando en lo
añadido «supuest», «reversible», «por defecto» y «criterio» salen cinco líneas, y ninguna es un supuesto del analista fuera de un
cambio:

- **La traza de E-246** (`docs/sdd/ENTRADA.md:2280` en `b3fbe5b9`) es el supuesto de `8d85ad84`, que va en la sección 4.
- **El estado de E-266** (`docs/sdd/ENTRADA.md:2414` en `b3fbe5b9`) se reescribió en su misma línea al cerrarla. Su «lo decide la
  construcción y lo anota como supuesto» cita la respuesta de Gerencia, y ese supuesto ya estaba en la lista del 12/11 (S-1 de
  `calificaciones-cuadre-conversaciones`).
- **Las otras tres son de `decision/marcador-migracion-en-pantallas`** (`openspec/config.yaml:6770`, `openspec/config.yaml:6774`
  y `openspec/config.yaml:6777`, las tres en `b3fbe5b9`). El criterio por defecto lo propuso el analista, pero Gerencia lo
  respondió el 17/11 y la tanda lo lleva como S-1 a S-3. La fecha que deja al diseño son S-4, S-5 y S-10 (sección 3).

**Tampoco son supuestos tomados:**

- **E-292** lleva un destino «propuesto, no decidido», que espera la decisión de Gerencia
  (`docs/sdd/ENTRADA.md:2584` en `b3fbe5b9`).
- **`338c920f`** llama a su supuesto «del analista» en el mensaje, pero es un commit directo y va en la sección 4.

**Analista: 0 filas.** **Posible pregunta: 0.**

---

## Recuento de esta lista

«Con otro estado» cuenta las filas que ya no están para corregir, con su fuente en la fila: decididas, retiradas, sin objeto
o superadas. Las superadas en parte y las corregidas al aplicar siguen en la lista, porque lo que queda de ellas sigue para
corregir.

| § | Tanda | Cambio | Filas | Con otro estado | Superadas en parte o corregidas al aplicar | Posible pregunta para el apartado 06 |
|---|---|---|---|---|---|---|
| 1 | fuera-del-plan | `pool-conexion-cortada` | 17 | 1 (sin ID · cliente prestado) | 2 (D-7, D-9) | 0 |
| 2 | fuera-del-plan | `cliente-prestado-conexion-cortada` | 22 | 0 | 0 | 0 |
| 3 | F1F-01 | `marcador-migracion-lectores` | 13 | 0 | 0 | 1 (S-11) |
| 4 | fuera-del-plan | commits directos `338c920f` y `8d85ad84` | 2 | 0 | 0 | 0 |
| 5 | — | supuestos del analista | 0 | 0 | 0 | 0 |
| | | **Total** | **54** | **1** | **2** | **1** |
