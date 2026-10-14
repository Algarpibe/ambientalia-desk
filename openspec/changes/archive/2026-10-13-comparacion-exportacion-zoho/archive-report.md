# Archive · `comparacion-exportacion-zoho` (F1F-05, `cierra: no`)

**Fecha:** 2026-10-13 · **Rama:** `comparacion-exportacion-zoho` · **Partida:** `62181fc` · **Informe escrito por el orquestador**, con
cifras medidas por él; la fusión del delta se hizo por script y no con el agente de archivo. La rama no está fusionada ni empujada.

**Qué parte de la fila F1F-05 cubre, en una línea:** la carga de la exportación de Zoho Desk para comparar los nueve indicadores
—lector, cruce por «ID», ruta de administrador y panel en «Análisis»—. **Deja fuera** la medición en paralelo de las cuatro semanas
desde el 16/11 y el juicio del 95 %, que son tarea de personas; por eso declara `cierra: no` y F1F-05 sigue en curso.

## Qué decisión construye

`decision/e171-e172-e173-indicadores-51-55` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06, tercera frase:
«Comparación: con la exportación de Zoho». Las dos primeras las construyó `indicadores-51-55`.

## Mediciones previas pedidas por el encargo

- **a) Clave de cruce.** «ID» (columna 1 del fichero, 18 dígitos) casa con `desk.tickets.id`: el sincronizador mapea `id: raw.id`
  (`packages/zoho-sync/src/db/mappers.ts:46`). Que «ID de la solicitud» (columna 8) sea el número del ticket es **hipótesis**: los
  valores de la muestra encajan, pero ninguna línea de código nombra esa cabecera. Por eso se cruza por «ID» y el número sólo se
  contrasta: si difiere, se cuenta y se lista.
- **b) Qué prohibía leer un fichero.** La decisión citaba la línea 257 de la spec viva y esa línea ya no lo decía. Eran tres
  requisitos: RQ-KP-14, RQ-KP-17 y RQ-KP-18 (que además prohibía una pantalla de carga). Los tres van modificados en el delta.
- **c) Columna 12 y el 47 (E-174).** Medido sobre las 640 filas de `docs/analisis-tickets/Tickets.csv`: «Tiempo permanecía» es el día
  de «Hora de actualización del estado» menos «Fecha Remisión Entrada» en 201 de 202 filas comparables, y en 202 de 202 con un día de
  tolerancia; la columna 12 no viene vacía en ninguna. Es el dato que le falta a la variante de Zoho del 47. **Esta tanda no cambia
  el 47 ni lee esa columna**: queda como hallazgo para Gerencia.

## Qué quedó construido

- **Lector puro** `apps/desk/server/comparacion/leerExportacion.ts`: exige doce columnas y, si falta alguna, falla nombrándola; sólo
  saca la clave, el número y las diez celdas de indicadores. Reutiliza el lector de registros de la encuesta, que sólo gana la palabra
  `export`. Un guardián enfrenta la cabecera de la muestra real con la del fixture.
- **Cruce puro** `apps/desk/server/comparacion/cruzarExportacion.ts`: por «ID», nunca por número ni aproximando. El ticket cruzado
  lleva como valores de Zoho sólo los de su fila; los datos sincronizados no completan nada.
- **Consulta** `apps/desk/server/db/ticketsPorId.ts`: sólo lectura, para separar «sólo en el fichero» de «en Desk fuera del periodo».
- **Ruta** `POST /api/indicadores/comparacion` (`apps/desk/server/routes/indicadoresComparacion.ts:25`): sólo administradores, con la
  escalera sesión `401` < administrador `403` < subida (`413`) < periodo `400` < sin fichero `400` < lector `400` < consultas. Devuelve
  recuentos, las listas de lo que no cruza en los dos sentidos y la comparación, **sin veredicto** y con la tolerancia de un día. Los
  valores entran por `valorDeZoho` y compara `compararIndicadores`: no hay segunda implementación.
- **Cliente**: panel «Comparar con la exportación de Zoho» en «Análisis», sólo para administradores
  (`apps/desk/src/components/ComparacionExportacion.tsx`); lo decidible está en `apps/desk/src/lib/comparacionExportacion.ts`, con pruebas.
- **`DEPLOY.md`**: sección nueva al final y un puntero en el §9.

**Sin migración, sin tabla, sin variable de entorno y sin escritura**: el fichero se sube, se compara y no se guarda. El `GET
/api/indicadores`, el 55, el 47 y las fórmulas y el orden de los otros ocho no cambian.

## Regla invariable 13 — decisiones del cliente y línea del servidor que impone cada una

| Decisión del cliente | Imposición en el servidor |
|---|---|
| El panel sólo se muestra a administradores | `apps/desk/server/auth/middleware.ts:27` (`403`), cableado en `apps/desk/server/routes/indicadoresComparacion.ts:25` |
| «Comparar» deshabilitado sin fichero | `apps/desk/server/routes/indicadoresComparacion.ts:29` |
| Selector limitado a `.csv` | `apps/desk/server/routes/indicadoresComparacion.ts:30-31` (el lector rechaza lo que no trae las columnas) |
| Muestra el mensaje de fichero grande | `apps/desk/server/app.ts:86`, con el límite de `apps/desk/server/util/subida.ts:6` |
| Envía las fechas sin validarlas | `apps/desk/server/routes/indicadoresComparacion.ts:27-28` |
| «Comparar» deshabilitado mientras envía | **Sin línea de servidor, a propósito**: evita el doble clic; la ruta sólo lee, así que dos envíos no dañan nada |
| «Filas rechazadas» = largo de la lista | No es una decisión: el servidor manda la lista sin un total aparte (aviso W4 del verify) |

## Medida, por intento (`git diff --shortstat --no-renames` contra el commit anterior; nada quedó sin trackear al medir)

| Intento | Commit | Líneas | Techo |
|---|---|---|---|
| Planificación 1 · propuesta | `9a7da86` | 318 | 800 |
| Planificación 2 · spec delta | `05668f8` | 385 | 800 |
| Planificación 3 · diseño y tareas | `b523352` | 464 | 800 |
| Lote 1 · lector | `49a13fe` | 568 | 800 |
| Lote 2 · cruce y consulta | `4984aee` | 391 | 800 |
| Lote 3 · ruta | `b1ad028` | 543 | 800 |
| Lote 4 · cliente y `DEPLOY.md` | `4c3cab8` | 531 | 800 |
| Verify | `aa50095` | 187 | 800 |
| Remediación del verify | `7fa2505` | 64 | 800 |

Ninguno superó el techo ni la válvula de 720, y los nueve asentaron sin bloqueo. No hay ficheros binarios.

## Verificación

- **Veredicto del verify independiente (`aa50095`):** PASS WITH WARNINGS; 0 críticos, 4 avisos, 6 sugerencias; los 44 escenarios con
  prueba en verde.
- **Mutaciones del verify:** 63; 56 rojas, 1 equivalente (el orden entre «ID repetido» e «ID no numérico», que no es observable) y 6
  supervivientes. Los seis tienen prueba desde `7fa2505`, cada una vista en rojo con su mutación.
- **Los cuatro códigos, ejecutados por el orquestador en `7fa2505` mirando cada código:** `npm test` 0 (4.666 pruebas pasan y 11
  omitidas), `npm run typecheck` 0, `npm run lint` 0 (165 avisos, 0 errores) y `npm run build` 0. Detector de citas: 0.
- **Partida:** 4.545 pruebas antes de la tanda, cifra derivada (4.573 tras el lote 1, que añadió 28); la tanda añade 121.
- **Lector contra la muestra real:** 640 filas leídas, 0 rechazadas, 0 valores ilegibles, sin mostrar ni guardar datos de contacto.

### Avisos que quedan abiertos

- **W2 · el 54 con un texto que no es «Cumple» ni «No cumple».** No se cuenta como «valor ilegible» y el par queda «sin comparar» sin
  listarse. En la muestra no ocurre (las 640 filas traen uno de los dos valores). Cerrarlo pide tocar la comparación compartida, que
  esta tanda tenía orden de no tocar: queda como pregunta.
- **W4 · «Filas rechazadas»** es la única cifra que el cliente deriva (el largo de la lista) en vez de copiarla.
- **«Tiempo de servicio» distinto de «Tiempo total servicio» en una fila:** gana la primera en silencio. En la muestra coinciden en
  las 640.
- **El `401` de sesión inválida** no lo fija la prueba de esta ruta; lo fija la prueba general de permisos.

## Incidencias de proceso

- **El detector bloqueó dos commits y los dos se corrigieron antes de asentar.** En el lote 1, una referencia en prosa del
  `apply-progress.md` tenía forma de cita con la ruta recortada. En el verify, el informe citaba líneas de los ficheros nuevos con una
  numeración que no era la del árbol; se corrigieron contra el fichero las bloqueantes y el informe lleva una nota que lo dice.
- **El diseño preveía insertar una línea en `Analisis.tsx`.** Se corrigió en el lote 4: `docs/sdd/ENTRADA.md`, que esta rama no toca,
  cita su línea 95. El panel se monta al final de una línea existente y el fichero sigue en 116 líneas.
- **El diseño y el lote 3 no pasaron por un validador de contexto fresco aparte:** los contrastó el orquestador contra el código.

## Fusión del delta (por script, bloque a bloque)

`openspec/specs/kpis/spec.md` pasa de 985 a 1.278 líneas y de 22 a 28 requisitos. Comprobado tras fusionar: los nueve bloques son
idénticos a los del delta, y los tres modificados conservan todos los escenarios que tenían.

| Bloque | Operación | Resultado |
|---|---|---|
| RQ-KP-14, RQ-KP-17, RQ-KP-18 | sustituidos (netos +6, +7 y +7 líneas) | idénticos al delta; 2, 2 y 3 escenarios vivos conservados, más uno nuevo cada uno |
| RQ-KP-23 a RQ-KP-28 | añadidos al final | idénticos al delta |
| Tabla de supuestos | fila SP-9 sustituida en su línea; S-I a S-Q añadidas tras S-H | 9 filas nuevas |

No hay capacidad nueva, así que `capabilities` no cambia (R-2).

## Citas (regla de mutación 4)

- La fusión desplaza la spec viva desde su línea 43. Las seis citas por línea a esa spec que tenía la propuesta de este cambio
  describen el estado anterior: **caso B**, ancladas a `62181fc`. Las de cambios archivados anteriores ya llevaban ancla.
- **Queda sin tocar, a propósito:** `openspec/config.yaml` cita, en la ficha de la decisión, la línea 257 de la spec viva sin ancla.
  Ya no decía lo que la frase afirma antes de esta tanda; tras la fusión sigue cayendo en una línea con texto, así que no bloquea.
  Esta rama no toca ese fichero: anotado para Supervisión.
- Ficheros citados editados en sitio, sin mover líneas: `apps/desk/server/app.ts` (líneas 22 y 61), `apps/desk/src/components/Analisis.tsx`
  (6 y 91), `apps/desk/server/encuesta/analizarRespuestas.ts` (54) y `DEPLOY.md` (269). Los demás sólo crecen por el final.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de mover la carpeta: fusión del delta y tabla de supuestos más las anclas de la propuesta,
322 (307 + 15), y este informe, 162. Total medido con `git diff --shortstat --no-renames` antes de mover: 484 (469 + 15), bajo 800. La mudanza de la carpeta no tiene carga de revisión; el intento se abrió con
techo 5.000 declarando la regla del archivo.

## Supuestos reversibles — para la lista semanal; plazo de corrección: una semana desde su publicación

| Supuesto | Qué supone | Cómo se revierte |
|---|---|---|
| S-I | La exportación de noviembre trae las mismas columnas que la muestra de enero | Si cambia, la carga responde `400` nombrando la columna; se ajusta el lector |
| S-J | El fichero no se guarda | Añadir almacén (tabla y migración) |
| S-K | Se exigen las doce columnas que se leen, no las 59 | Una constante del lector |
| S-L | Un ticket del periodo ausente del fichero no se completa con lo sincronizado | Una línea del cruce |
| S-M | Con un «ID» repetido vale la primera fila | Una línea del lector |
| S-N | Un ticket del fichero que está en Desk fuera del periodo se cuenta aparte | Quitar la consulta |
| S-O | El `400` del periodo precede al del fichero | Orden de dos líneas de la ruta |
| S-P | Una celda que no se puede leer se lista como «valor ilegible» | Una línea del lector |
| S-Q | Los listados salen completos, sin paginar | Añadir paginación |

## Consecuencia en el avance

Ninguna cifra se mueve. F1F-05 **sigue en curso**: el numerador no cuenta un `cierra: no`.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

**No tienen entrada en `docs/sdd/ENTRADA.md`**: ese fichero tiene cambios de Supervisión sin commitear y esta rama no lo toca.

| Id | Dueño | Qué | Qué desbloquea |
|---|---|---|---|
| P-1 | Quien administra | Exportar los tickets de Zoho Desk en CSV cada semana desde el 16/11 y subirlos en «Análisis», sin abrirlos con una hoja de cálculo | La comparación de las cuatro semanas |
| P-2 | Quien despliega | Desplegar antes del viernes 13/11; no hay migración | Medir desde el 16/11 |
| P-3 | Gerencia, con Servicio Técnico y Comercial | Juzgar el 95 % y explicar por escrito cada diferencia mayor de un día | Dar los nueve por buenos y cerrar la fila |
| — | Gerencia | E-174 (con el hallazgo de la columna 12), E-175 a E-180 y E-182, que siguen abiertas; el aviso W2 del 54; y confirmar los supuestos | Cómo se lee cada diferencia |
| — | Supervisión | Abrir las entradas de la bandeja y anotar el caso B de `openspec/config.yaml` | La traza |
