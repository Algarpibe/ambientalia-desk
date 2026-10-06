# Preguntas para Gerencia — 2026-10-06

Una sola lista de lo que Gerencia tiene pendiente de responder, ordenada por los días de trabajo que desbloquea cada
respuesta. Medido sobre `bdbadee`. No sustituye a `docs/sdd/Preguntas_Gerencia_2026-09-29.md`: recoge de él lo que
sigue abierto y añade lo que entró después por la bandeja.

**Cómo leer las cifras.** Los días salen de la tabla de lo que falta de la R01.4
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:210-226`), con sus tallas: XS ≈ 0,5 d, S ≈ 1 d, M ≈ 2,5 d,
L ≈ 4,5 d (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:206`). **Esas tallas son estimaciones, no
medidas**, y el propio plan lo declara como hipótesis en esa línea. Cuando una pregunta tiene un intervalo, se ordena
por su extremo alto.

**Qué pasa el 09/11.** Ese día se rehace el margen con el ritmo real de las tandas cerradas desde el 01/10; si no
queda al menos una semana, se pasa al corte único del 01/02/2027
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:393`). Una fila que espera respuesta no se puede cerrar
aunque haya tiempo (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:268`), así que llega a esa cuenta como
pendiente. En cada pregunta, «si no se responde antes del 09/11» dice qué parte queda así.

**Dónde se registra cada respuesta.** En `openspec/config.yaml` → `decisiones_de_gerencia`, con la respuesta textual:
la bandeja no es fuente. Este documento **no propone nombres de clave nuevos**; donde ya existe una clave que la
respuesta precisa, se nombra. La clave la escribe quien registra la respuesta.

## Resumen

| # | Pregunta | Fila | Días que desbloquea | Marca |
|---|---|---|---|---|
| 1 | Pregunta 4 — qué son las «vistas equivalentes a Zoho» | F1B-08 | 1,0 a 2,5 | |
| 2 | E-157 — qué es «crear la OVI de garantía» en Desk | F1B-03 y F1B-13 | 2,0 | |
| 3 | E-089 y E-220 — qué estados ve cada área, y protocolo de traspaso | F1B-05 | 1,5 | |
| 4 | E-232 (E-100) — accesorios desde el catálogo de artículos | F1B-04 | 1,0 | |
| 5 | E-086 — año y tope de la ampliación de contrato | F1B-11 | 1,0 | |
| 6 | E-171, E-172 y E-173 — indicadores 51 y 55, y con qué se compara | F1F-05 | 1,0 | |
| 7 | E-094 — comprobar si Drive o alguna automatización depende del prefijo | F1B-03 | 0,5 | |
| 8 | Pregunta 3.b — calificación del cliente y niveles de prioridad | F1B-07 | 0,5 | |
| 9 | E-222 — mapa del blueprint para equipo nuevo y soporte remoto | F1B-09 | 0,5 | |
| 10 | E-158 — ¿la guarda de remisión alcanza a «Equipo nuevo»? | F1B-03 | 0 | **Sujeta el despliegue** |
| 11 | `p55c-proveedor-copia` — proveedor del almacenamiento de las copias | F1F-02 | 0 | **Cuesta dinero** |
| 12 | E-225 — dos estados sin columna en el tablero | F1B-08, a confirmar | sin talla | |
| 13 | E-154 — NIT genéricos en el alta manual | sin fila | sin talla | |
| 14 | E-155 — aviso de cliente provisional ya en Books | sin fila | sin talla | |
| 15 | E-160 — la derivación al Director Técnico, ¿se propone o se impone? | sin fila | sin talla | |
| 16 | F1A-09 — declararla hecha o descartarla | F1A-09 | 0 | |

Suma de las nueve primeras: **9,0 a 10,5 días**. Es suma de estimaciones: hipótesis.

---

## 1 · Pregunta 4 — F1B-08: qué son las «vistas equivalentes a Zoho»

- **Pregunta.** ¿Qué vistas de listado y qué campos de la ficha de Zoho Desk tiene que igualar Desk 2.0 para dar la
  paridad por cumplida?
- **Opciones** (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:107-109`): **(a)** que lo defina una medida de media hora
  con quien trabaja a diario en Zoho; **(b)** dar la paridad por cumplida con lo construido; **(c)** que Gerencia
  enumere directamente las vistas y los campos.
- **Desbloquea.** El cierre de F1B-08: le falta sólo esta mitad, sin contenido decidido, **1,0 a 2,5 días**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:214`). Con (b) la fila cierra sin construir nada.
- **Si no se responde antes del 09/11.** F1B-08 llega a la cuenta como pendiente y sin tamaño conocido.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`. Hoy no tiene clave ni entrada en la
  bandeja (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:111`).

## 2 · E-157 — F1B-03: qué es «crear la OVI de garantía» dentro de Desk

- **Pregunta.** Desk no escribe en Zoho y las OVI se crean en Books: cuando se decidió que la OVI de garantía la crea
  el Director Técnico, ¿qué acto es ése dentro de Desk?
- **Opciones** (`docs/sdd/ENTRADA.md:1778`): **(A)** que sólo el Director Técnico o un administrador puedan asociar una
  orden `OVI-` a un ticket; **(B)** un registro propio de OVI en Desk, que es alcance nuevo; **(C)** escribir en Books,
  que contradice `decision/p44-escritura-zoho`. Si la respuesta es (A), cuelgan cinco preguntas de detalle que están en
  esa misma entrada.
- **Desbloquea.** La parte de OVI de F1B-03 y, detrás, F1B-13, la ficha de garantía (`docs/sdd/ENTRADA.md:1779`).
  A F1B-03 le faltan 1,5 días entre la OVI y los prefijos (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:210`)
  y F1B-13 pesa 1,0 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:217`): **2,0 días**, contando 1,0 para la
  OVI (hipótesis: el plan no separa la cifra).
- **Si no se responde antes del 09/11.** Dos filas quedan pendientes: F1B-03 no puede cerrarse y F1B-13 no puede
  empezar.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`, como precisión de
  `decision/ovi-garantia-autor`.

## 3 · E-089 y E-220 — F1B-05: qué ve cada área, y el protocolo de traspaso

- **Pregunta E-089.** ¿Cada área ve sólo los tickets en «sus» estados, o todo el personal sigue viendo todos? El
  maestro dice lo primero y la aplicación hace lo segundo, a propósito (`docs/sdd/ENTRADA.md:1247`).
- **Opciones de E-089.** Tres, en `docs/sdd/Preguntas_Gerencia_2026-09-29.md:53-55`; la intermedia es un filtro por área
  que se puede quitar (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:54`). Dos de las tres piden además la matriz de qué
  estado es de qué área (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:57`).
- **Pregunta E-220.** ¿Se aprueba el protocolo de traspaso: reasignar un ticket sin cambiar su estado y con motivo,
  avisar a la persona, y restringir por propietario del registro? (`docs/sdd/ENTRADA.md:2108`). Opciones: aprobarlo
  entero, en parte o no aprobarlo.
- **Desbloquea.** El cierre de F1B-05: le faltan la visibilidad por área y el traspaso con motivo, **1,5 días**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:212`).
- **Si no se responde antes del 09/11.** F1B-05 queda pendiente. Si la respuesta a E-089 es «todos ven todo», esa
  mitad se cierra sin construir.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia` (`docs/sdd/ENTRADA.md:1251`). Si el
  protocolo se aprueba, lo que salga es una fila del plan (`docs/sdd/ENTRADA.md:2110`).

## 4 · E-232 (E-100) — F1B-04: accesorios desde el catálogo de artículos

- **Pregunta, en cinco puntos** (`docs/sdd/ENTRADA.md:2177-2181`): **(1)** ¿los accesorios de la remisión salen del
  catálogo de artículos de Zoho Books y no de una lista propia?; **(2)** ¿se muestra el nombre oficial tal como está en
  Books?; **(3)** ¿se muestra el número de parte, y de qué campo de Books sale?; **(4)** ¿se ofrecen sólo los
  accesorios del modelo del equipo, y dónde queda escrita esa relación?; **(5)** ¿la foto de cada accesorio va con los
  documentos del modelo, o es otra cosa?
- **Por qué hace falta.** La corrección E-100 lo describe, pero no tiene clave de decisión, y la tanda se paró sin
  empezar por eso (`docs/sdd/ENTRADA.md:2175`).
- **Desbloquea.** Lo último que le falta a F1B-04 antes del corte, **1,0 día**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:211`).
- **Si no se responde antes del 09/11.** F1B-04 queda pendiente por esa parte.
- **Dónde se registra.** Una clave de decisión en `openspec/config.yaml` con la respuesta
  (`docs/sdd/ENTRADA.md:2184`).

## 5 · E-086 — F1B-11: año y tope de la ampliación de contrato

- **Pregunta.** Un contrato se puede ampliar «dentro del mismo año» para consumir lo que no se ejecutó: ¿qué año
  cuenta, y hasta qué fecha como máximo se puede ampliar?
- **Opciones** (`docs/sdd/ENTRADA.md:1223`): el año natural, el año de la fecha de inicio del contrato o el de su fecha
  de fin. Con contratos que empiezan a mitad de año dan topes distintos (`docs/sdd/ENTRADA.md:1224`).
- **Desbloquea.** La ampliación del contrato y, con ella, el cierre de F1B-11 (`docs/sdd/ENTRADA.md:1228`): **1,0 día**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:216`).
- **Si no se responde antes del 09/11.** F1B-11 queda pendiente; un contrato vencido no se puede ampliar desde la
  aplicación.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`, como precisión de
  `decision/vigencia-contrato` (`docs/sdd/ENTRADA.md:1228`).

## 6 · E-171, E-172 y E-173 — F1F-05: los indicadores 51 y 55, y con qué se compara

- **Pregunta E-171.** El tiempo de recogida del equipo (indicador 51) se mide hasta una hora que Desk no guarda: ¿con
  qué hito se calcula? Opciones (`docs/sdd/ENTRADA.md:1848`): la remisión de salida, la última transición registrada,
  o empezar a guardar la hora del cambio de estado.
- **Pregunta E-172.** La aplicación no guarda la calificación de satisfacción (indicador 55): ¿se espera a cargar las
  respuestas de la encuesta, o se decide otra fuente? (`docs/sdd/ENTRADA.md:1854`).
- **Pregunta E-173.** Si los valores de Zoho no llegan por la sincronización, ¿la comparación de las cuatro semanas se
  hace cargando la exportación de Zoho, o de otra forma? (`docs/sdd/ENTRADA.md:1860`). Depende de una consulta previa en
  producción (`docs/sdd/ENTRADA.md:1862`).
- **Desbloquea.** Los indicadores 51 y 55 y el cierre de F1F-05 (`docs/sdd/ENTRADA.md:1850`,
  `docs/sdd/ENTRADA.md:1856`). El plan da lo que falta por S, **1,0 día**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:225`; hipótesis: el bloque no desglosa por fila).
- **Si no se responde antes del 09/11.** F1F-05 queda pendiente, y la medición en paralelo que empieza el 16/11
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`) arranca con el 51 y el 55 «sin dato». Lo ya construido
  tiene que estar en producción antes del 13/11 (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:168`): eso no depende de
  estas respuestas.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia` (`docs/sdd/ENTRADA.md:1851`).

## 7 · E-094 — F1B-03: comprobar si algo depende del prefijo

- **Qué se pide.** No es una decisión, es una comprobación: Gerencia decidió suprimir los cinco prefijos en los
  tickets nuevos y pidió comprobar antes de construir si algún nombre de carpeta de Drive o alguna automatización
  depende de ellos (`docs/sdd/ENTRADA.md:1331`). Es una medición fuera del repositorio, su dueño es Gerencia y nadie la
  ha hecho (`docs/sdd/ENTRADA.md:1334`).
- **Respuestas posibles.** «Nada depende», y se construye; o «depende esto», y se dice qué.
- **Desbloquea.** La supresión de los prefijos, **0,5 días** (talla XS,
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`).
- **Si no se responde antes del 09/11.** F1B-03 no puede cerrarse aunque la OVI esté resuelta; el alta sigue pidiendo
  el prefijo.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`, con el resultado de la comprobación.

## 8 · Pregunta 3.b — F1B-07: calificación del cliente y niveles de prioridad

- **Pregunta.** Para un cliente sin contrato y que no es Top 5, ¿de dónde sale su calificación y cuántos niveles de
  prioridad hay?
- **En tres puntos** (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:85-87`): **(1)** ¿se confirma el modelo de tres
  niveles, o se mantiene el de dos?; **(2)** ¿qué es «Valoración de Clientes» y cómo llega ese dato a Desk?; **(3)**
  ¿quién ajusta a mano la prioridad fuera de los Top 5?
- **Desbloquea.** Lo que le falta a F1B-07, **0,5 días** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:213`;
  hipótesis del propio plan).
- **Si no se responde antes del 09/11.** F1B-07 queda pendiente. Sin el punto (2), construir la regla sería inventar
  el dato (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:86`).
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`. Hoy no tiene entrada en la bandeja
  (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:89`).

## 9 · E-222 — F1B-09: mapa del blueprint para equipo nuevo y soporte remoto

- **Pregunta.** El mapa que se genera solo cubre el flujo de servicio técnico; los de equipo nuevo y soporte remoto
  se siguen dibujando a mano (`docs/sdd/ENTRADA.md:2118`). ¿Se extiende ahora o después del corte?
- **Opciones** (`docs/sdd/ENTRADA.md:2120`): con la fila del mapa en la aplicación, que va después del corte
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:80`), o en el repaso de cierre de F1B-09.
- **Desbloquea.** **0,5 días** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:215`; hipótesis del propio
  plan).
- **Si no se responde antes del 09/11.** F1B-09 no se cierra por esa parte; los dos mapas pueden quedar desfasados sin
  que ninguna prueba avise.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`. La entrada está sin destino asignado.

## 10 · E-158 — F1B-03: ¿la guarda de remisión alcanza a «Equipo nuevo»? — SUJETA EL DESPLIEGUE

- **Pregunta.** Desde que se publique, no se podrá habilitar un servicio sin remisión de entrada, sin excepciones. Un
  ticket de «Equipo nuevo» pasa por ese mismo paso: ¿lleva remisión de entrada en la práctica, o hay que exceptuarlo?
  (`docs/sdd/ENTRADA.md:1783`).
- **Opciones.** «Sí, también lleva remisión» y se publica tal cual; o «no», y hace falta una excepción por
  clasificación en un cambio nuevo (`docs/sdd/ENTRADA.md:1785`).
- **Desbloquea.** Publicar: no bloquea construir (`docs/sdd/ENTRADA.md:1784`), por eso cuenta 0 días. Es condición de
  parada del paquete de despliegue (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:97`). Si la respuesta es «no», la
  excepción no tiene talla en el plan.
- **Si no se responde antes del 09/11.** No se puede publicar nada de lo que va en ese paquete sin arriesgar que los
  tickets de equipo nuevo queden bloqueados el primer día. Arrastra a F1F-05, que tiene que estar en producción antes
  del 13/11 (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:168`).
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`, como precisión de
  `decision/anexo-43-en-sitio`.

## 11 · `p55c-proveedor-copia` — F1F-02: proveedor de las copias — CUESTA DINERO

- **Pregunta.** ¿Cuál de los tres proveedores recibe las copias de seguridad?
- **Opciones.** Backblaze B2, Cloudflare R2 o Amazon S3 (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:135`).
- **Desbloquea.** Encender la copia nocturna, la previa a cada cambio y la semanal de Drive: las tres están
  construidas y apagadas (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:126`). No queda construcción: 0 días.
  Lo que sigue son tareas de persona (`docs/sdd/Paquete_de_Despliegue_2026-10-06.md:59`).
- **Si no se responde antes del 09/11.** No sujeta el despliegue, pero mientras tanto la única copia es la manual
  (`docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:66`) y F1F-02 no puede cerrarse.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`. Hoy no tiene clave propia: está como
  consecuencia de `decision/p55b-destino-copia` (`openspec/config.yaml:2625`).

## 12 · E-225 — dos estados sin columna en el tablero

- **Pregunta.** «Verificación» y «Solicitud Soporte» caen en la columna «Otros» del tablero
  (`docs/sdd/ENTRADA.md:2133`): ¿se les da columna propia, y dentro de qué fila?
- **Opciones.** Hacerlo como contenido de F1B-08, que es el destino propuesto y está a confirmar
  (`docs/sdd/ENTRADA.md:2135`), o dejarlo para después del corte.
- **Desbloquea.** Que un soporte remoto recién creado se vea en su estado. **Sin talla en el plan.**
- **Si no se responde antes del 09/11.** No bloquea ninguna fila; esos tickets siguen en «Otros».
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`.

## 13 · E-154 — NIT genéricos en el alta manual

- **Pregunta.** Al dar de alta un cliente a mano, si su NIT coincide con uno de Books el alta se detiene y enseña los
  candidatos. ¿Hay NIT genéricos, como el de consumidor final, que no deban detenerla, y cuáles?
  (`docs/sdd/ENTRADA.md:1762`).
- **Opciones** (`docs/sdd/ENTRADA.md:1763`): una lista cerrada de NIT exentos, o dejarlo como está.
- **Desbloquea.** Decidir si hay cambio nuevo. La fila del alta manual ya está cerrada
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:218`). **Sin talla en el plan.**
- **Si no se responde antes del 09/11.** No bloquea ninguna fila; un cliente sin NIT propio no se puede dar de alta
  como provisional con un NIT genérico.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`; si hay trabajo, una fila del plan
  (`docs/sdd/ENTRADA.md:1764`).

## 14 · E-155 — aviso de cliente provisional que ya está en Books

- **Pregunta.** Si el cliente provisional aparece después en Books y nadie los enlaza, conviven los dos. ¿Se construye
  un aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar?
  (`docs/sdd/ENTRADA.md:1767`).
- **Opciones.** Construirlo, y decir en qué fila; o no construirlo.
- **Desbloquea.** Decidir si hay trabajo (`docs/sdd/ENTRADA.md:1769`). **Sin talla en el plan.**
- **Si no se responde antes del 09/11.** No bloquea ninguna fila; el enlace depende de que alguien se acuerde.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`. La entrada está sin destino asignado
  (`docs/sdd/ENTRADA.md:1770`).

## 15 · E-160 — la derivación al Director Técnico, ¿se propone o se impone?

- **Pregunta.** Al pedir repuestos, la aplicación propone derivar el ticket al Director Técnico, pero quien lo
  ejecuta puede elegir a otra persona. ¿Tiene que rechazar el servidor cualquier otra? (`docs/sdd/ENTRADA.md:1793`).
- **Opciones.** «Se propone» y queda como está; o «se impone», y hace falta un cambio nuevo con la guarda
  (`docs/sdd/ENTRADA.md:1795`).
- **Desbloquea.** Decidir si hay cambio. La fila ya está cerrada
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:223`). **Sin talla en el plan.**
- **Si no se responde antes del 09/11.** No bloquea ninguna fila.
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`.

## 16 · F1A-09 — declararla hecha o descartarla

- **Pregunta.** La fila «Barrido de citas tras la R08.2» figura como pendiente porque dos fuentes no coinciden: una
  revisión anterior del plan la da por construida y la lista de los partes no la incluye
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:348`). ¿Se declara hecha o se descarta?
- **Opciones.** Declararla hecha, descartarla, o pedir que se haga el barrido.
- **Desbloquea.** 0 días: no hay nada que construir (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:226`).
  Lo que cambia es la cuenta de filas.
- **Si no se responde antes del 09/11.** Sigue contando como una fila pendiente que pesa cero, y eso distorsiona la
  cuenta por filas (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:263`).
- **Dónde se registra.** `openspec/config.yaml` → `decisiones_de_gerencia`, y la fila del plan
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:79` en `bdbadee`).

---

## Lo que este documento no cubre

- **No es la lista completa de la bandeja.** Recoge las preguntas pedidas para este corte. Al leerlas aparecieron
  otras entradas abiertas con dueño Gerencia que **no se han analizado aquí**: E-090 (área de las transiciones de
  soporte remoto, `docs/sdd/ENTRADA.md:1254`), E-174 (`docs/sdd/ENTRADA.md:1864`) y E-221
  (`docs/sdd/ENTRADA.md:2112`). Puede haber más.
- **Las líneas de `docs/sdd/ENTRADA.md` son las de `bdbadee`.** El fichero tiene en el árbol de trabajo un bloque sin
  commitear que no es de esta sesión; está al final y no desplaza ninguna de las líneas citadas.
- **Las opciones de cada pregunta son las que traen las fuentes citadas.** Donde la fuente no las enumera, se han
  escrito las dos respuestas posibles («sí» o «no», «ahora» o «después»), sin añadir alternativas.
