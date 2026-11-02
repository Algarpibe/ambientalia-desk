# Supuestos reversibles — lista semanal del 2026-11-02

**Fuera del plan.** Motivo: `decision/preguntas-de-detalle-sin-llegar`. Es la **primera** lista: según el encargo de
Supervisión, desde el 09/10/2026 no se había publicado ninguna, y a `aea55fb9` ningún fichero versionado de `docs/sdd/` lleva
«Supuestos» en el nombre.

## Qué es

La lista de las decisiones de detalle que la construcción tomó **sin preguntar**, como supuesto reversible, agrupadas por
tanda. Cada fila dice qué se decidió, cómo se deshace y dónde está escrito. Gerencia corrige las que no comparta; las demás
quedan aceptadas al vencer el plazo. La escribe la construcción; Supervisión la lleva al panel.

## La regla

- **`decision/preguntas-de-detalle-sin-llegar`** (Gerencia, 06/10/2026; `openspec/config.yaml` →
  `decisiones_de_gerencia_panel`), consecuencias (3) y (4), y la «Regla de las preguntas a Gerencia» de `CLAUDE.md`. **Se
  citan por clave y por título, no por línea:** a 02/11/2026 las dos viven sólo en la copia de trabajo de Supervisión, sin
  commitear, y su texto no es verificable desde el repositorio.
  - (3) Lo que no frena una fila lo decide la construcción con su criterio por defecto, lo escribe como **supuesto
    reversible** y lo publica **cada semana en una lista agrupada por tanda**.
  - (4) La lista la escribe la construcción en `docs/sdd/` y Supervisión la lleva al panel; la fecha de aceptación es la de
    publicación en el panel más 7 días.
- **Lo versionado:** Gerencia confirmó el plazo el 17/10/2026 en `decision/supuestos-semanales-aceptacion`
  (`openspec/config.yaml:4993-5010` en `aea55fb9`): «de acuerdo; lo que no corrija en una semana queda aceptado.»
- **El filtro del apartado 06** (consecuencia (2) de la misma decisión): sube como pregunta sólo lo que impide cerrar una
  fila, toca al cliente, toca dinero, permisos o datos de producción, o no se deshace sin coste. Lo demás va en esta lista.

## Fecha de aceptación

**La fija Supervisión al publicar esta lista en el panel:** fecha de publicación + 7 días. Hasta ese día toda fila sin otra
fuente está «para corregir»; lo que Gerencia no corrija en ese plazo queda aceptado con esa fecha.

## Cómo se lee

| Columna | Qué dice |
|---|---|
| ID | El del artefacto de la tanda. Un ID repetido en dos tandas es otro supuesto |
| Qué se decidió | En una frase, sin jerga de código |
| Cómo se deshace | La alternativa que el propio artefacto escribe, salvo donde la sección dice lo contrario |
| Dónde | `ruta:línea` del artefacto archivado que lo declara |
| Estado | «para corregir», salvo que conste aceptado o corregido, con su fuente |

**«Posible pregunta para el apartado 06»** marca un supuesto que, por el filtro de la regla, quizá no debería serlo. **Sigue
en la lista**; decide Supervisión si además lo sube como pregunta.

---

## 1 · F1B-13 · `valor-reclamado-usd` (archivado el 2026-10-26)

Valor reclamado al proveedor calculado del costo de catálogo, y moneda junto a cada importe de la garantía al proveedor.
Los supuestos S-1 a S-11 están en la §5 de la propuesta
(`openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:100-120`), y el informe de archivo los manda a esta
lista bajo F1B-13 (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:116-120`). El diseño manda
también sus decisiones D-1 a D-10 (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:215`): D-1 es S-8;
las otras nueve van en 1.2.

### 1.1 · Supuestos de la propuesta

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La orden de venta de la garantía (OVI) se busca por el identificador de Books guardado en la asociación; si falta, no se calcula el valor y lo escribe una persona | Buscarla también por su número cuando falte el identificador, exigiendo que haya una sola | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:104` | para corregir |
| S-2 | Si una pantalla antigua manda el valor al responder «sí», se ignora sin error; el formulario deja de pedirlo | Usar ese valor como manual cuando no hay cálculo, o rechazarlo con error | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:105` | para corregir |
| S-3 | Sin cálculo, la ficha queda sin valor y con origen «a mano» | Dejar el origen vacío hasta que alguien escriba | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:106` | para corregir |
| S-4 | Todo o nada: si falta un dato en cualquier línea de la orden (artículo, cantidad o costo de catálogo), no se calcula nada y lo escribe una persona | Sumar las líneas válidas y marcar el valor como parcial | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:107` | para corregir |
| S-5 | El origen pasa a «a mano» sólo si la edición cambia el número; guardar sin cambiarlo conserva el origen | Toda edición pasa a «a mano» | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:108` | para corregir |
| S-6 | La suma se redondea a centavos de dólar una sola vez, al final | Redondear por línea, o no redondear | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:109` | para corregir |
| S-7 | La ficha muestra junto al valor si es «calculado de la OVI» o «a mano» | No mostrarlo | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:110` | para corregir |
| S-8 (= D-1) | La moneda es una constante, USD, para todas las fichas, sin columna en la base: las fichas anteriores también se muestran en USD | Una columna de moneda, con migración; antes, revisar las fichas anteriores (tarea de persona P-1, `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:192`) | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:111`; lo cierra `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:24` | para corregir · **posible pregunta para el apartado 06**: toca dinero y datos de producción; una ficha anterior anotada en pesos se muestra como USD (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:40`) |
| S-9 | El cálculo se hace después de las comprobaciones de la respuesta y antes de guardarla, y nunca rechaza una respuesta | Hacerlo dentro de la misma operación de guardado | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:112` | para corregir |
| S-10 | No se lee la moneda de la orden de venta: se da por hecho que el costo de catálogo está en USD (hipótesis fuera del artículo medido) | No calcular cuando algo indique otra moneda | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:113` | para corregir · **posible pregunta para el apartado 06**: toca dinero; si un artículo tuviera el costo en otra moneda, la ficha reclamaría un importe en moneda equivocada, y sigue siendo hipótesis (`openspec/changes/archive/2026-10-26-valor-reclamado-usd/archive-report.md:119`) |
| S-11 | El valor calculado es una foto: no se recalcula si el catálogo cambia después | Añadir un acto de recálculo | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:114` | para corregir |
| (sin ID) | La corrección al maestro se hace enmendando en su sitio la nº 29, no abriendo otra | Abrir una corrección nueva | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/proposal.md:203` | para corregir |

### 1.2 · Decisiones del diseño que el propio diseño manda a la lista

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| D-2 | El cálculo vive en un módulo nuevo del núcleo compartido; las constantes, al final del fichero de la garantía | Todo al final del fichero de la garantía | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:25` | para corregir |
| D-3 | Dos funciones separadas: una lee las líneas de la orden y otra calcula el valor | Una sola función | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:26` | para corregir |
| D-4 | La lectura de Books la hace la capa de datos y la ruta la pasa al guardado, sin desplazar líneas citadas | Calcularla dentro del guardado, o leer en la ruta con líneas nuevas | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:27` | para corregir |
| D-5 | La respuesta «sí» deja de llevar el campo del valor | Conservar el campo, siempre vacío | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:28` | para corregir |
| D-6 | La regla del origen al editar vive en el núcleo compartido y la aplica la ruta | Decidirla en la consulta a la base | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:29` | para corregir |
| D-7 | Un solo campo de moneda por ficha y otro por grupo de la medición | Un campo por importe, o uno global en la medición | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:30` | para corregir |
| D-8 | Se aceptan los dos formatos en que llegan los datos de la orden (objeto o texto) y el costo se convierte a número | Fiarse del tipo que entrega el controlador de la base | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:31` | para corregir |
| D-9 | El redondeo de S-6 se hace con una fórmula única, una vez | Por línea | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:32` | para corregir |
| D-10 | El formulario del «sí» no tiene campo de valor; el de edición lleva la moneda en su etiqueta | Reusar la opción existente del formulario (`conRma`) | `openspec/changes/archive/2026-10-26-valor-reclamado-usd/design.md:33` | para corregir |

**F1B-13: 21 filas** (S-1 a S-11, una sin ID y D-2 a D-10). **Posible pregunta: 2** (S-8 y S-10).

---

## 2 · F1B-09 · `areas-soporte-remoto` (archivado el 2026-10-27)

Pasa el área de las cuatro transiciones de soporte remoto de supuesto a decisión de Gerencia
(`decision/e090-areas-soporte-remoto`). **`grep «S-[0-9]»` sobre sus artefactos no da ningún supuesto propio:** los aciertos
son el S-1 de `blueprint-soporte-remoto`, que este cambio cierra
(`openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:26`), y las sugerencias S-1 a S-3 del verificador
(`openspec/changes/archive/2026-10-27-areas-soporte-remoto/verify-report.md:80-82`), que no son supuestos. **Sí tiene
tabla de supuestos, con letras:** S-A a S-H, «para no confundirlos con el S-1 de `blueprint-soporte-remoto`», y la propia
propuesta los manda a la lista semanal de F1B-09
(`openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:77-78`). S-H se añadió al aplicar
(`openspec/changes/archive/2026-10-27-areas-soporte-remoto/apply-progress.md:87`).

Los ocho son de redacción y de citas; ninguno cambia el comportamiento de la aplicación: ningún área cambia
(`openspec/changes/archive/2026-10-27-areas-soporte-remoto/apply-progress.md:45`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-A | Además del comentario y de la prueba (d), se corrigen las otras tres líneas de código y pruebas que daban la misma razón, ya falsa («por equivalencia») | Corregir sólo el comentario y la prueba (d) | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:82` | para corregir |
| S-B | No se toca la línea de «Fuera de alcance» de F1B-06 que dice «confirmación del área (P.3)»: es la foto de lo que esa tanda dejó fuera | Reescribirla en su sitio | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:83` | para corregir |
| S-C | Se quedan las cifras históricas «4×3» y «(4 permitidos, 8 prohibidos)» en la cabecera de una prueba; la cuenta vigente la fija otra | Ponerlas al día | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:84` | para corregir |
| S-D | Una cita de `openspec/config.yaml` se ancla a su revisión como registro de su fecha (caso B) | Tratarla como superada (caso C) y añadir qué la cerró | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:85` | para corregir |
| S-E | Cambia el título del requisito RQ-SR-02, porque «por equivalencia» deja de ser cierto | Conservar el título | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:86` | para corregir |
| S-F | La introducción de la spec conserva la frase de la hoja vacía y añade la fecha de la decisión | Sustituir la frase | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:87` | para corregir |
| S-G | En la misma línea de `openspec/config.yaml` se ancla también la cita hermana a `transitions-equipo-nuevo` | Dejarla sin ancla y anotarla | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:88` | para corregir |
| S-H | (Añadido al aplicar.) Las citas de dos paquetes de despliegue fechados se anclan a la revisión en que se escribieron | Dejarlas sin ancla y anotarlas | `openspec/changes/archive/2026-10-27-areas-soporte-remoto/proposal.md:89` | para corregir |

**F1B-09: 8 filas.** **Posible pregunta: 0.**

---

## 3 · fuera-del-plan · `codigo-servicio-bloqueado` (archivado el 2026-10-27)

El servidor impide cambiar el código de servicio de un ticket que ya lo tiene, salvo a un administrador, y la pantalla
propone el código deducido a un ticket sin él. Supuestos S-1 a S-8 en la §5 de la propuesta
(`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:71-85`); el informe de archivo los manda a esta
lista «sin cambios» (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/archive-report.md:116-119`).

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | El cambio va fuera del plan y no cuenta en F1B-03, que está cerrada por archivo | Contarlo en F1B-03: se cambia la cabecera | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:78` | **aceptado** por Gerencia el 28/10/2026 (`docs/sdd/Paquete_de_Despliegue_2026-10-28.md:54-58`); registrado como `decision/codigo-servicio-fuera-del-plan` en la copia de trabajo de Supervisión, sin commitear, y por eso se cita por clave |
| S-2 | «Una sola vez» es el primer envío que fija el código a un ticket que no lo tiene; la memoria es el propio código, sin columna nueva ni migración | Una marca por fila, si la propuesta tuviera que guardarse antes de la transición | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:79` | para corregir |
| S-3 | El código propuesto se arma como en el alta, con la fecha (día de Bogotá) en que se creó el ticket; lo que falte se omite | Usar la fecha de hoy, o el campo «Fecha creación ticket» | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:80` | para corregir |
| S-4 | «Ya tiene código» quiere decir un valor no vacío tras quitar espacios; reenviar el mismo valor no cuenta como cambio | Comparación literal | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:81` | para corregir |
| S-5 | El administrador cambia el código por las mismas dos transiciones desde «Ingresado»; la traza es el registro de la transición (quién, cuándo, valor nuevo y valor previo), sin tabla propia | Tabla y ruta propias para la corrección del administrador | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:82` | para corregir · **posible pregunta para el apartado 06**: toca permisos (qué puede hacer el administrador y por qué vía); su pregunta hermana, P-3, ya está destinada al apartado 06 (`openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:133`) |
| S-6 | La sincronización con Zoho sobre tickets que la App todavía no gestiona queda fuera: hasta la primera transición en la App manda Zoho | Que la sincronización no pise un código ya escrito | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:83` | para corregir |
| S-7 | El bloqueo responde como falta de permiso (403), en cualquier transición que lleve el campo | Otro tipo de error, con sus pruebas de orden | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:84` | para corregir |
| S-8 | Sin interruptor: restringe, no enciende ningún escritor | Un interruptor que nazca cerrado | `openspec/changes/archive/2026-10-27-codigo-servicio-bloqueado/proposal.md:85` | para corregir |

**fuera-del-plan: 8 filas**, una ya aceptada (S-1). **Posible pregunta: 1** (S-5).

---

## 4 · 1G-01 · `sync-conversaciones-zoho` (archivado el 2026-10-29)

El hilo de un ticket de Zoho se trae entero, paginado; lo que Zoho ya no devuelve se marca y deja de mostrarse, sin
borrarse; y una pasada periódica trae las conversaciones de los tickets modificados. Supuestos S-1, S-1b y S-2 a S-16 en la
§5 de la propuesta (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:93-113`); el informe de
archivo los da por «aplicados tal cual» y dice que S-16 se añadió al cerrar el intento 1
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:86-89`).

**La propuesta no trae columna de alternativa**: aquí «Cómo se deshace» lo escribe esta lista a partir del propio supuesto.

| ID | Qué se decidió | Cómo se deshace | Dónde | Estado |
|---|---|---|---|---|
| S-1 | La pasada periódica y el marcado de lo ausente dependen de dos interruptores separados, cerrados salvo que valgan exactamente «true» | Un solo interruptor, u otros nombres | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:97` | para corregir |
| S-1b | Sólo la App lee esos interruptores; el worker del hub, que comparte la configuración, nunca los lee | Leerlos de la configuración común, con lo que también los vería el worker | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:98` | para corregir |
| S-2 | Una columna nueva, «ausente en Zoho», en la tabla de conversaciones; vacía quiere decir presente; sin relleno | Dejar de usar la columna; retirarla pide una migración aparte | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:99` | para corregir |
| S-3 | Una lista se da por completa sólo si las conversaciones distintas recibidas cuadran con los recuentos de Zoho; si Zoho no da recuento, no se da por completa | Tratar un recuento ausente como cero | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:100` | para corregir |
| S-4 | La pasada periódica compara con el detalle recién leído; la apertura y el relleno, con el último guardado. En los tickets que gestiona la App, la apertura y el relleno no marcan | Pedir el detalle a Zoho también en la apertura, con una petición más por ticket | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:101` | para corregir |
| S-5 | Si Zoho limita las peticiones: pausa de 2 segundos y hasta 3 reintentos por página; agotados, se corta la pasada de ese ciclo y se anotan los tickets que quedaron | Reintentar sin tope, como el relleno | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:102` | para corregir |
| S-6 | Pausa de 150 milisegundos entre tickets en la pasada, la misma del relleno | Otra pausa | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:103` | para corregir |
| S-7 | Un ticket cuya versión ya se trajo no se vuelve a pedir mientras el proceso siga vivo; un redespliegue lo olvida y cuesta una petición de más | Guardar esa memoria en la base | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:104` | para corregir |
| S-8 | Si el ciclo de sincronización cae al modo de «página 1», la pasada de conversaciones no corre ese ciclo | Correr la pasada sin recuentos, sin marcar nada | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:105` | para corregir |
| S-9 | La lectura por páginas (100 por página, hasta 20 páginas) va sin interruptor, porque corrige la lectura que ya existía | Ponerla tras un interruptor | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:106` | para corregir · **posible pregunta para el apartado 06**: toca datos de producción; escribe en la base de producción sin interruptor y está desplegada desde el 30/10/2026 (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:108`) |
| S-10 | Lo recibido antes de que falle una página se guarda; sólo el marcado exige la lista completa | Descartar lo de un ticket cuya lista falla | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:107` | para corregir |
| S-11 | Una conversación marcada que Zoho vuelve a devolver se desmarca, con o sin interruptor | Desmarcar sólo con el interruptor encendido | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:108` | para corregir; lo aprobó el analista el 29/10 (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:88`), que no es aceptación de Gerencia |
| S-12 | Sólo se marcan conversaciones venidas de Zoho, nunca las escritas en la App | Quitar la condición de origen | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:109` | para corregir |
| S-13 | Las marcadas dejan de mostrarse desde un solo sitio, la consulta del hilo, y sus adjuntos con ellas | Filtrar en cada pantalla | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:110` | para corregir |
| S-14 | El relleno que pide la decisión es el que ya existía, sin código nuevo | Un relleno propio | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:111` | para corregir |
| S-15 | Sólo se marcan conversaciones guardadas antes de empezar a leer la lista del ticket | Quitar ese corte de tiempo | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:112` | para corregir |
| S-16 | 1G-01 figura «en curso» en el registro de avance y sigue así tras archivar, porque el cambio no cierra la fila | Sacarla de «en curso» en ese registro | `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/proposal.md:113` | para corregir |

**1G-01: 17 filas.** **Posible pregunta: 1** (S-9).

---

## Recuento de esta lista

| Tanda | Filas | Aceptadas con fuente | Posible pregunta para el apartado 06 |
|---|---|---|---|
| F1B-13 | 21 | 0 | 2 (S-8, S-10) |
| F1B-09 | 8 | 0 | 0 |
| fuera-del-plan (`codigo-servicio-bloqueado`) | 8 | 1 (S-1) | 1 (S-5) |
| 1G-01 | 17 | 0 | 1 (S-9) |
| **Total** | **54** | **1** | **4** |

---

## Anexo · Supuestos tomados y nunca publicados; decide Supervisión en qué lista entran

Los cambios archivados con fecha de carpeta igual o posterior al 2026-10-09 en `openspec/changes/archive/`, menos los cuatro
de arriba: **32**. Sin detallar. **Cómo se cuenta:** «en la propuesta» son las filas o viñetas de la sección de supuestos
del `proposal.md` tal como está hoy; «añadidos después» son los que se declaran fuera de él (diseño, deltas de spec o
informe de archivo). No se cuentan las sugerencias del verificador, las tareas de persona, los riesgos ni las notas de
implementación que el informe de archivo no manda a la lista. El total es lo que **declara** cada cambio: incluye los que
el propio artefacto da después por decididos, retirados o sin objeto, que se señalan en la última columna.

| Carpeta | Tanda | En la propuesta | Añadidos después | Total | Dónde | Nota |
|---|---|---|---|---|---|---|
| `2026-10-10-aviso-en-garantia` | F1B-18 | 9 | 0 | 9 | `openspec/changes/archive/2026-10-10-aviso-en-garantia/proposal.md:96-104` | |
| `2026-10-11-migracion-una-sola-ejecucion` | F1F-01 | 7 | 0 | 7 | `openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/proposal.md:85-91` | |
| `2026-10-11-rechazo-migracion-409` | F1F-01 | 7 | 0 | 7 | `openspec/changes/archive/2026-10-11-rechazo-migracion-409/proposal.md:71-77` | |
| `2026-10-11-tiempo-en-tarjeta-remision-creada` | F1B-07 | 7 | 0 | 7 | `openspec/changes/archive/2026-10-11-tiempo-en-tarjeta-remision-creada/proposal.md:66-72` | IDs T1 a T7. No cuenta los cinco «heredados de la fila» (E-188 a E-191 y E-193), que aplicaron cambios anteriores |
| `2026-10-12-aplica-resuelto-hacia-n8n` | F1B-04 | 7 | 0 | 7 | `openspec/changes/archive/2026-10-12-aplica-resuelto-hacia-n8n/proposal.md:67-73` | |
| `2026-10-12-recepcion-exencion-foto-y-casilla` | F1B-04 | 7 | 3 | 10 | `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/proposal.md:80-86`; añadidos en `openspec/changes/archive/2026-10-12-recepcion-exencion-foto-y-casilla/archive-report.md:85-87` | |
| `2026-10-12-rotulado-tras-enviar` | F1B-04 | 14 | 0 | 14 | `openspec/changes/archive/2026-10-12-rotulado-tras-enviar/proposal.md:110-123` | G1 y G2 constan como aprobados |
| `2026-10-13-comparacion-exportacion-zoho` | F1F-05 | 9 | 0 | 9 | `openspec/changes/archive/2026-10-13-comparacion-exportacion-zoho/proposal.md:142-150` | |
| `2026-10-14-prefijo-deducido-en-el-alta` | F1B-03 | 7 | 0 | 7 | `openspec/changes/archive/2026-10-14-prefijo-deducido-en-el-alta/proposal.md:132-138` | |
| `2026-10-16-fecha-cierre-migracion` | F1F-01 | 5 | 0 | 5 | `openspec/changes/archive/2026-10-16-fecha-cierre-migracion/proposal.md:57-61` | |
| `2026-10-17-busqueda-cliente-y-codigo` | F1F-03 | 4 | 0 | 4 | `openspec/changes/archive/2026-10-17-busqueda-cliente-y-codigo/proposal.md:76-84` | |
| `2026-10-17-cierre-f0-04-por-dictamen` | F0-04 | 0 | 0 | 0 | — | Sin sección de supuestos; la palabra no aparece en ninguno de sus `.md` |
| `2026-10-17-cierre-f1b08-con-lo-construido` | F1B-08 | 3 | 0 | 3 | `openspec/changes/archive/2026-10-17-cierre-f1b08-con-lo-construido/proposal.md:97-99` | |
| `2026-10-17-cifras-caducas-y-lectores-de-servicio` | F1B-09 | 1 | 0 | 1 | `openspec/changes/archive/2026-10-17-cifras-caducas-y-lectores-de-servicio/proposal.md:78-79` | Va dentro de «Riesgos» |
| `2026-10-17-espera-y-areas-equipo-nuevo` | F1B-09 | 5 | 0 | 5 | `openspec/changes/archive/2026-10-17-espera-y-areas-equipo-nuevo/proposal.md:67-73` | |
| `2026-10-17-fecha-migracion-fuera-de-cifras` | F1F-01 | 6 | 0 | 6 | `openspec/changes/archive/2026-10-17-fecha-migracion-fuera-de-cifras/proposal.md:59-64` | |
| `2026-10-17-medicion-garantias-por-marca` | F1B-13 | 6 | 2 | 8 | `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/proposal.md:81-86`; añadidos en `openspec/changes/archive/2026-10-17-medicion-garantias-por-marca/design.md:146-147` | S-4 sustituido por una decisión el 17/10 |
| `2026-10-18-anulado-con-motivo` | F1C-01 | 10 | 0 | 10 | `openspec/changes/archive/2026-10-18-anulado-con-motivo/proposal.md:94-103` | |
| `2026-10-18-decisionales-por-cargo` | F1C-05 | 6 | 0 | 6 | `openspec/changes/archive/2026-10-18-decisionales-por-cargo/proposal.md:134-141` | |
| `2026-10-18-facturar-dos-ramas` | F1C-02 | 12 | 0 | 12 | `openspec/changes/archive/2026-10-18-facturar-dos-ramas/proposal.md:121-132` | |
| `2026-10-18-orden-motivos-anulacion` | F1C-01 | 4 | 0 | 4 | `openspec/changes/archive/2026-10-18-orden-motivos-anulacion/proposal.md:66-69` | |
| `2026-10-18-tiempos-ficha-cliente` | F1F-03 | 5 | 0 | 5 | `openspec/changes/archive/2026-10-18-tiempos-ficha-cliente/proposal.md:71-75` | |
| `2026-10-18-tipo-evento-transicion` | F1C-04 | 8 | 0 | 8 | `openspec/changes/archive/2026-10-18-tipo-evento-transicion/proposal.md:181-188` | S-1 y S-2 decididos por Gerencia; S-8 retirado |
| `2026-10-19-reloj-sla-esperas` | F1C-06 | 9 | 2 | 11 | `openspec/changes/archive/2026-10-19-reloj-sla-esperas/proposal.md:112-124`; añadidos en `openspec/changes/archive/2026-10-19-reloj-sla-esperas/design.md:64-68` | |
| `2026-10-20-calibracion-directa` | F1C-08 | 9 | 7 | 16 | `openspec/changes/archive/2026-10-20-calibracion-directa/proposal.md:138-149`; añadidos en `openspec/changes/archive/2026-10-20-calibracion-directa/design.md:216-226` | |
| `2026-10-20-control-calidad-liberacion` | F1C-07 | 9 | 9 | 18 | `openspec/changes/archive/2026-10-20-control-calidad-liberacion/proposal.md:140-148`; los 18, en `openspec/changes/archive/2026-10-20-control-calidad-liberacion/archive-report.md:115-123` | Cuatro de los añadidos están en los deltas de spec |
| `2026-10-21-salidas-esperas` | F1C-03 | 11 | 13 | 24 | `openspec/changes/archive/2026-10-21-salidas-esperas/proposal.md:137-150`; añadidos en `openspec/changes/archive/2026-10-21-salidas-esperas/design.md:191-196` | S-1 a S-3 y S-12 retirados; S-13, S-14, S-15 y S-21 sin objeto |
| `2026-10-22-filtro-indicadores-por-flujo` | F1F-05 | 8 | 4 | 12 | `openspec/changes/archive/2026-10-22-filtro-indicadores-por-flujo/proposal.md:92-99`; añadidos en `openspec/changes/archive/2026-10-22-filtro-indicadores-por-flujo/design.md:249-252` | |
| `2026-10-23-poblacion-cierre-variante-47-51` | F1F-05 | 11 | 2 | 13 | `openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/proposal.md:75-111`; añadidos en `openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/archive-report.md:102-103` | |
| `2026-10-24-comparacion-juzga-variante` | F1F-05 | 7 | 1 | 8 | `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/proposal.md:84-109`; añadido en `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/archive-report.md:95-96` | |
| `2026-10-24-creacion-manual-49` | F1F-05 | 5 | 0 | 5 | `openspec/changes/archive/2026-10-24-creacion-manual-49/proposal.md:91-98` | |
| `2026-10-25-normalizar-estados-zoho` | F1F-01 | 9 | 0 | 9 | `openspec/changes/archive/2026-10-25-normalizar-estados-zoho/proposal.md:116-133` | |
| **Total (32 cambios)** | | **227** | **43** | **270** | | |
