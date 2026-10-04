# Informe de archivo — continuidad-indicadores (F1F-05)

**Tanda:** F1F-05 · **cierra:** no · **Fecha:** 2026-10-03 · **Rama:** `continuidad-indicadores`, nacida de
`main` en `f55b7d9`. La rama no se ha fusionado ni empujado: la fusión la autoriza el usuario.

## Qué parte de la fila cubre

**Cubre** el cálculo de siete de los nueve indicadores a la letra del maestro (47, 49, 50·53, 54, 57, 58 y 59),
la tabla exportable en JSON y CSV para administradores y la comparación por pares con el valor de Zoho.
**Deja fuera** el tiempo de recogida (51) y la satisfacción (55), que salen «sin dato» porque a la aplicación le
falta el hito y la letra de Gerencia manda decirlo y decidirlo aparte; y la comparación efectiva, que depende de
saber si los valores de Zoho llegan sincronizados. Por eso lleva `cierra: no`: la fila
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129` pide nueve y sigue en curso.

## Commits y medidas

Las medidas son `git diff --shortstat --no-renames` entre commits, y coinciden con el registro de intentos.

| Fase | Commit | Medida |
|---|---|---|
| Planificación | `579eb5c` | 1.485 líneas, artefactos del cambio |
| Lote 1 · hitos, tiempos naturales, 51 y 55 sin dato | `24e636a` | 415 (386 insertadas, 29 borradas) |
| Lote 2 · días hábiles, cumplimiento, variantes de Zoho | `e252518` | 392 (357, 35) |
| Lote 3 · lectura en servidor y ruta JSON | `d25ecda` | 362 (346, 16) |
| Lote 4 · CSV y enlace de descarga | `d0a7c85` | 256 (237, 19) |
| Lote 5a · comparación por pares | `37bd97f` | 443 (414, 29) |
| Lote 5b · cierre documental | `3c669e7` | 232 (214, 18) |
| Verify | `710a34e` | 257, el informe |
| Remediación del verify | `17cdf05` | 52 (44, 8) |
| Archive, parte revisable | este commit | la spec nueva, 523 líneas, más este informe |

## Qué se creó en las specs vivas

`openspec/specs/kpis/spec.md`, nueva, con 18 requisitos. Es una copia byte a byte de la spec del cambio,
comprobada con `cmp`. La capacidad `kpis` ya estaba declarada en `openspec/config.yaml → capabilities`, así que
R-2 no pide nada más.

## Qué hace y qué no hace

- Sólo lectura: tres consultas, sea cual sea el número de tickets. No añade tablas, columnas, variables de
  entorno ni escritores, no escribe contra Zoho y no cambia el sincronizador.
- No hay umbral, semáforo ni veredicto: la aplicación publica los porcentajes y las diferencias, y el 95 % lo
  juzgan las personas.
- Sin valor de Zoho con que comparar, el resumen lo dice y no da porcentaje.

## Pruebas y comprobaciones al cierre

Ejecutadas en el worktree sobre el árbol de este commit, mirando el código de salida de cada una: `npm test`
(184 ficheros y 2.816 pruebas en verde; 1 fichero y 2 pruebas omitidas), `npm run typecheck`, `npm run lint`
(165 avisos, 0 errores) y el detector de citas.

## Fórmulas de Zoho comprobadas contra el export

El lote 1 comprobó con un script de un solo uso, no versionado, las fórmulas de la variante de Zoho sobre las 640
filas de `docs/analisis-tickets/Tickets.csv`. La tabla completa está en `apply-progress.md`. Lo que importa:

- El 57, el 58, el 59, el 51 y el 54 cuadran en todas sus filas comparables.
- El 47, el 49 y el 50·53 cuadran salvo cinco filas de borde, que terminan en sábado o cruzan un festivo.
- Zoho cuenta de lunes a viernes y no descuenta festivos. Con el calendario laboral, en los intervalos que traen
  festivo cuadran 0 de 57 en el 49 y 1 de 33 en el 50·53. La medición a la letra quedará por debajo del 95 % en
  esos tickets por fórmula, no por error.

## Mutaciones reproducidas

| Mutación | Quién la reprodujo |
|---|---|
| Posición: administrador por debajo de la validación o de la consulta; sesión por debajo de administrador | apply y verify |
| Quitar la guarda de administrador | orquestador |
| Fórmula: hábiles por naturales, hitos invertidos, primer valor en vez del último | apply |
| Dato vigilado: quitar un festivo del calendario laboral | apply y orquestador |
| Hito faltante: el 51 devolviendo un número; la variante del 47 cayendo en la remisión de salida | apply y verify |
| La variante de Zoho descontando festivos | apply y verify |
| Comparación: tolerancia de dos días | apply y orquestador |
| Comparación: par sin valor de Zoho contado como coincidencia; porcentaje con cero pares | apply y verify |
| CSV: quitar el escapado de fórmulas | apply y orquestador |
| CSV: comillas, separador, saltos de línea, BOM, fin de línea, números negativos | apply |
| Sólo lectura: un `UPDATE` añadido a la ruta o a la lectura | remediación |

Todas se revirtieron y el árbol quedó limpio. Una sobrevive y es equivalente: quitar el charset de la cabecera
del CSV no cambia nada observable, porque el servidor lo añade al enviar texto.

## Hallazgos del verify y qué se hizo

| Hallazgo | Qué se hizo |
|---|---|
| W1 · la spec citaba un rango incompleto de la bandeja y remitía a la propuesta | Cerrado en `17cdf05` |
| W2 · añadir un `UPDATE` a la ruta no ponía roja ninguna prueba | Cerrado en `17cdf05`: toda sentencia de la ruta tiene que ser un `SELECT`, en JSON y en CSV |
| W3 · tamaño de la parte revisable del archivo | Medido antes de aplicar: la spec, 523, más este informe, bajo 800 |
| W4 · sin periodo la ruta carga todos los tickets, sin tope, y el enlace no pasa periodo | No se corrige; queda como riesgo para el paquete de despliegue |
| W5 · un ticket sin fecha de creación se descartaba aunque no hubiera periodo | Cerrado en `17cdf05`, con prueba roja primero |
| S1 · faltaban los casos literales de tiempos negativos | Cerrado en `17cdf05` |
| S2 · elegir la marca de ingreso para el 49 no tiene pregunta propia | Se queda anotado; E-177 sólo pregunta la unidad |
| S3 · una cita de la spec prueba poco | Se queda |
| S4 · en el lote 5a el módulo se escribió antes que su prueba | Declarado en `apply-progress.md`; el rojo se recuperó apartando el fichero |

## Supuestos aplicados

- El 49 va en días hábiles; la letra no da la unidad.
- El 59 es orden de venta menos cotización, en días naturales; no tenía fórmula escrita y cuadra en el export.
- Reentrancia: vale el último valor, con una marca de «reentrante»; no se resuelve el punto 66 del maestro.
- El periodo filtra por el día de creación del ticket; sin periodo salen todos.
- El CSV va en formato largo, con separador `;`, fin de línea CRLF y BOM.
- Se publican dos lecturas del 95 %: por indicador y por ticket.

Lo que cambia cifras que verá Gerencia y no es supuesto, se construyó a la letra: el calendario laboral con
festivos, el 49 «sin dato» en tickets heredados sin marca de ingreso, y el 54 «sin dato» sin tiempo promesa.

## Entradas en la bandeja

E-171 a E-180 son preguntas para Gerencia: el hito del 51, la fuente del 55, cómo comparar si los valores de Zoho
no llegan, la diferencia del 47, el 54 sin tiempo promesa y sin finalización, la unidad del 49, la fórmula del
59, cuál es el 95 %, y la fecha de orden de venta final. E-181 recoge las tareas de persona. E-182 es el hallazgo
medido de que Zoho no descuenta festivos.

## Tareas de persona — archivar no las da por hechas

1. Ejecutar en producción la consulta de sólo lectura de `DEPLOY.md` para saber si los valores que calcula Zoho
   llegan en los datos sincronizados. No se ha ejecutado ni probado contra el PostgreSQL de producción.
2. Desplegar antes del viernes 13/11/2026 para medir desde el 16/11; el CI no despliega.
3. La comprobación de las cuatro semanas y la explicación escrita de cada diferencia mayor de un día.
4. Comprobar en la aplicación el enlace de descarga y que la hoja de cálculo abre el CSV sin asistente.

## Para el paquete de despliegue

Sin cambios de esquema ni variables de entorno. F1F-05 entra con E-181 como condición previa. Riesgos a recoger:
la ruta sin periodo no tiene tope de tamaño, y cómo entrega la base real una columna de fecha sólo se probó con
filas simuladas.

## Pendiente al fusionar

- `apps/desk/server/reconciliacion/registro.test.ts` fija a mano la lista de tandas en curso y esta rama le añade
  F1F-05; las ramas de F1C-11 y F1B-04 tocan la misma línea: conflicto previsible.
- `docs/sdd/ENTRADA.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` y `DEPLOY.md` reciben texto al final
  también en las otras dos ramas: se resuelve conservando todas las partes. Las tres ramas numeran su corrección
  del maestro como 21, así que dos se renumeran.
- La nota de la capacidad `kpis` en `openspec/config.yaml` dice que la spec se archiva con este cambio; tras la
  fusión conviene que diga que ya existe.
