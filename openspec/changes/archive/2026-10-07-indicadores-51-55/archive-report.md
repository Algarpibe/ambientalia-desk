# Archive · `indicadores-51-55` (F1F-05, `cierra: no`)

**Fecha:** 2026-10-07 · **Rama:** `indicadores-51-55` · **Partida:** `42a4828` · **Informe escrito por el orquestador**, con cifras
medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1F-05 cubre, en una línea:** el cálculo del indicador 51 desde la transición de entrega y el almacén, la
carga y la lectura del indicador 55 desde las respuestas de la encuesta. **Deja fuera la comparación con la exportación de Zoho**,
que la misma decisión pide y que es contenido de la fila; por eso declara `cierra: no` y F1F-05 sigue en curso.

## Qué decisión construye

`decision/e171-e172-e173-indicadores-51-55` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), de 2026-10-06: «51: la
transición de entrega. 55: las respuestas cargadas de la encuesta. Comparación: con la exportación de Zoho.» Se construyen las dos
primeras frases; la tercera no.

## Qué quedó construido

- **El 51 en el módulo puro** `packages/shared/src/indicadores.ts`: día de la última transición de entrega (`entrega_al_cliente` o
  `entrega_sin_factura`) menos la finalización del servicio, en días naturales con signo. Dos o más entregas marcan reentrante. Sin
  fila de entrega sale «sin dato» con su motivo; un ticket movido sólo en Zoho no tiene esa fila. La entrada opcional
  `horaActualizacionEstado` ya no existe. Un guardián enfrenta la constante de entregas al catálogo de transiciones.
- **Almacén** `public.encuesta_respuestas`, calificada y al final del esquema (`packages/zoho-sync/src/db/schema.sql:787`), con la
  huella única (`packages/zoho-sync/src/db/schema.sql:792`) y su índice por ticket (`packages/zoho-sync/src/db/schema.sql:796`).
  Nace vacía. Nada la actualiza ni la borra.
- **Analizador aislado** `apps/desk/server/encuesta/analizarRespuestas.ts`: puro, sólo importa la huella y la conversión de zona. Es
  lo único que se sustituye cuando llegue una muestra real del fichero.
- **Capa de datos de la carga** `apps/desk/server/db/encuestaRespuestas.ts`: una lectura de tickets por número, una de huellas
  presentes y una escritura; sin consulta por fila. Recargar el mismo fichero no duplica.
- **Ruta de carga** `POST /api/indicadores/encuesta`, sólo administradores, con la sesión y el permiso delante de la subida
  (`apps/desk/server/routes/encuestaRespuestas.ts:19`). Responde `{ leidas, insertadas, duplicadas, rechazadas }`. Quien carga sale
  de la sesión, nunca del cuerpo.
- **El 55 en la lectura**: cuarta consulta, acotada al periodo, que deja la última respuesta de cada ticket
  (`apps/desk/server/indicadores.ts:85`). El `GET /api/indicadores` sigue sin escribir.

## Lo que no se construyó, y por qué

- **La comparación con la exportación de Zoho.** Fuera del alcance autorizado para esta tanda; es lo que mantiene abierta la fila.
- **Pantalla de carga.** No se toca `apps/desk/src`; la carga se invoca por HTTP con sesión de administrador.
- **Columna `canal` y la tableta.** Recorte declarado (supuesto S-G).

## Supuestos anotados que quedan vivos (reversibles; para Gerencia en el §14 del paquete de despliegue del 06/10)

| Supuesto | Qué supone | Cómo se revierte |
|---|---|---|
| S-A | Con dos entregas vale la última | Una línea en la función del hito |
| S-D | El fichero identifica el ticket por su número | Se sustituye el analizador |
| S-E | El fichero es un CSV de exportación de Google Forms; **no hay muestra en el repositorio** | Se sustituye el analizador |
| S-F | Carga por `POST` de administrador, sin interruptor y sin pantalla | Añadir interruptor o pantalla |
| S-G | Sin columna `canal` | Un `ALTER TABLE … ADD COLUMN` |

S-B, S-C y S-H están en la tabla de supuestos de la spec viva. **El formato del fichero (S-D y S-E) es el riesgo principal:** si el
formulario no recoge el número de ticket, todas las filas se rechazarían; el almacén, la ruta y el cálculo no cambiarían.

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames` más lo nuevo sin trackear)

| Intento | Commit | Líneas (registro) | Techo |
|---|---|---|---|
| Lote 1 · el 51 | `6fcf7e9` | 317 | 800 |
| Lote 2a · tabla, huella y capa de datos | `879d1d0` | 523 | 800 |
| Lote 2b · analizador | `8abf407` | 566 | 800 |
| Lote 3 · ruta y lectura | `cf004c4` | 588 | 800 |
| Lote 4 · cierre documental | `e365c68` | 321 | 800 |
| Verify | `8406926` | 189 | 800 |
| Remediación del verify | `e1199a4` | 60 | 800 |

Ningún intento superó el techo. La planificación (`4773b23`, 1.771 líneas de artefactos) se commiteó antes de abrir el primer intento.

## Verificación

- **Veredicto del verify independiente:** PASS WITH WARNINGS, 0 críticos, 4 avisos, 7 sugerencias; 10 de 10 requisitos y 83 de 83
  escenarios con prueba en verde.
- **Mutaciones del verify:** 107 distintas; 102 rojas, 3 equivalentes y 2 supervivientes reales. Los dos supervivientes (el orden
  ticket/marca vacía y la hora 24) tienen prueba desde `e1199a4`, reproducida en rojo con su mutación. La hora 24 ya la rechazaba el
  código: faltaba la prueba, no había defecto.
- **Cierres ejecutados por el orquestador en `e1199a4`:** 4.187 pruebas pasan y 7 saltadas; typecheck 0; lint 0 con 165 avisos y 0
  errores; detector de citas 0. El `build` lo ejecutó el verify en `e365c68`, con código 0.
- **Partida:** 4.066 pruebas en `42a4828`; la tanda añade 121.

## Incidencias de proceso

- **El asiento del lote 3 afirmó «detector 0» y el detector salía con 1.** El orquestador encadenó mal el comando y asentó sin mirar
  ese código. Eran cinco citas de los propios artefactos del cambio a líneas que el lote 3 desplazó. El lote 4 las ancló a su
  revisión y su asiento deja escrita la corrección. Desde entonces el asiento sólo se ejecuta si la cadena entera sale con 0.
- **El agente del lote 4 se cortó por un fallo de red** a mitad del barrido de citas. Se reanudó con su contexto tras revisar el
  árbol: ocho ficheros, todas sustituciones de una línea, ninguna a medias.
- **La hipótesis 8 del diseño falló:** supertest pierde la conexión cuando el servidor responde 401 o 403 sin leer un cuerpo de más
  de 10 MB. Esos casos usan un auxiliar de prueba sobre `node:http`.

## Fusión del delta (por script, bloque a bloque)

`openspec/specs/kpis/spec.md` pasa de 523 a 985 líneas. Los bloques se casaron por identificador `RQ-KP-NN`, no por título, porque
RQ-KP-09 cambia de título. Comprobado tras fusionar, bloque a bloque contra la delta:

| Bloque | Operación | Líneas | Resultado |
|---|---|---|---|
| RQ-KP-02 | sustituido | 56 | idéntico |
| RQ-KP-09 | sustituido | 85 | idéntico |
| RQ-KP-10 | sustituido | 40 | idéntico |
| RQ-KP-11 | sustituido | 50 | idéntico |
| RQ-KP-14 | sustituido | 16 | idéntico |
| RQ-KP-18 | sustituido | 27 | idéntico |
| RQ-KP-19 a RQ-KP-22 | añadidos al final | 56, 118, 126 y 39 | idénticos |

Tabla de supuestos: retirada la fila SP-8 y añadidas S-A a S-H al final. La spec viva queda con 22 requisitos y conserva sus fines
de línea. No hay capacidad nueva, así que `capabilities` no cambia (R-2).

## Citas (regla de mutación 4)

- La fusión desplaza la spec viva desde su línea 34. Las once citas por línea a esa spec que hay en los artefactos del cambio y en el
  §14 del paquete de despliegue describen el estado anterior: **caso B**, ancladas a `42a4828`.
- El barrido del lote 4 ancló, según su tabla en `apply-progress.md`, 57 citas a módulos que la tanda movió; las cinco que bloqueaban el detector las comprobó el orquestador (detector en 0 tras `e365c68`).
- **Queda sin tocar, a propósito:** `openspec/config.yaml` cita, en la ficha de la decisión, líneas del estado anterior (el módulo de
  indicadores, la ruta y la spec). Son caso B y les corresponde nombrar la revisión `42a4828`. Esta rama no toca ese fichero; está
  anotado para Supervisión en el §14 del paquete.
- **Queda sin hacer:** unas 70 citas históricas a los contadores de `migrate.test.ts` en `openspec/changes/archive/`. No bloquean el
  detector. Anclarlas todas a una sola revisión afirmaría algo falso de las anteriores; pide un barrido propio, cita a cita.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de mover la carpeta: fusión del delta 532 (497 + 35), anclas de las once citas 22, y este
informe (145). Total medido con `git diff --shortstat --no-renames` antes de mover: 699 (653 + 46), bajo 800. La mudanza de la carpeta no tiene carga de revisión.

## Consecuencia en el avance

Ninguna cifra se mueve. F1F-05 **sigue en curso**: el numerador no cuenta un `cierra: no`.

## Hallazgo ajeno a la tanda

`instanteDeJornada` (`packages/shared/src/calendarioLaboral.ts:155`) devuelve el día anterior con las horas 0 a 4. Medido por
ejecución en el lote 4 y repetido por el verify: para el día 2027-01-12 la hora 0 da `2027-01-11T05:00:00.000Z` y la hora 8 da
`2027-01-12T13:00:00.000Z`, que es la correcta. Hoy no afecta a nadie: sus llamadores usan 08:00 y 17:00, y el analizador mide el
desplazamiento a mediodía. La causa es hipótesis. Esta tanda sólo exporta la función; no la corrige.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

**No tienen entrada en `docs/sdd/ENTRADA.md`**: el fichero tiene cambios de Supervisión sin commitear y esta rama no lo toca. El
texto propuesto de cada entrada está en el §14 del paquete de despliegue del 06/10.

| Id | Dueño | Qué | Dónde queda escrito |
|---|---|---|---|
| P-1 | Comercial | Entregar una muestra real de la exportación del formulario de la encuesta | paquete, §14 |
| P-2 | Administrador | Cargar las respuestas reales, en enero de 2027 | paquete, §14 |
| P-3 | Quien despliega | Desplegar: la migración crea una tabla nueva vacía | paquete, §14, y `DEPLOY.md` |
| — | Gerencia | Confirmar S-D, S-E y S-G | paquete, §14 |
| — | Supervisión | Abrir las entradas de la bandeja y anotar el caso B de `openspec/config.yaml` | paquete, §14 |
