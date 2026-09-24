---
tanda: F1B-12
motivo: ""
capacidad: [calendario-laboral]
maestro: ["Anexo D nº 3"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: calendario laboral (jornada, festivos de Colombia, horas y días hábiles)

## Encuadre de la cabecera

- **`tanda: F1B-12`.** El contenido está decidido por Gerencia: «una tanda nueva de tamaño S» (`openspec/config.yaml:2534-2535`). **El ID sale de la R01.3**, que es el plan vigente y está commiteada (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:59`, «calendario laboral (F1B-12)»), no del borrador R01.2. La R01.3 no tiene §5 escrito, así que **esta misma ficha escribe la fila F1B-12** en una sección de catálogo añadida al final de la R01.3, para no desplazar citas (instrucción del usuario, 2026-09-24). No es `fuera-del-plan` porque el contenido tiene decisión.
- **`capacidad: [calendario-laboral]`, nueva.** R01.2 la etiqueta `kpis` (`:24`), pero la consumen las tres alarmas, el reloj c7, el tiempo promesa, el punto 33 y los indicadores (`config.yaml:2535`): es transversal. Por R-2, este cambio añade `calendario-laboral` a `openspec/config.yaml → capabilities`.
- **`maestro: ["Anexo D nº 3"]`**: `…R08.2.md:4010-4011` («¿24 o 48 horas?»), resuelto por `decision/anexo-3-alerta` (`config.yaml:2315-2329`). Consumidores con «días hábiles» en el maestro: tiempo promesa (`R08.2.md:4322`), tiempo de servicio (`:4592`).
- **`cierra: si`**: la fila son tres piezas —jornada, tabla de días no laborables, función única— y las tres entran. El paso de `'Notificado': 24` a 9 h hábiles lo pide la decisión «cuando la pieza exista» sin asignarle fila (`config.yaml:2535`, `:2539`); se deja fuera (pregunta 2). Si Gerencia lo mete aquí, `cierra` sigue en `si` y el alcance crece.
- **`toca_maestro: no`**: los pasajes que ya no son ciertos (`R08.2.md:1664`, `:2108`, `:3744`, «24/48 h») lo son por la decisión, no por esta tanda, y ya van por el expediente R08.3 (`config.yaml:2326`).

## Intención

Hoy el sistema no sabe cuándo se trabaja: `grep -rniE "festivo|holiday"` da 0 (`config.yaml:2538`), y `venceSlaEn` suma horas de reloj (`packages/shared/src/sla.ts:40-44`). Cuatro tandas dependen de contar en horas hábiles, y la decisión prohíbe que cada una construya su propio cálculo.

## Alcance

### Dentro
- Módulo puro en `packages/shared` con el molde de `fechasDerivadas.ts` (apto para navegador `:9`, `ZONA_NEGOCIO` `:13`, `Intl`, sin librerías).
- Jornada L-V 8:00-17:00, 9 h continuas (`config.yaml:2320`).
- Festivos de Colombia **calculados** para cualquier año: fijos, trasladables a lunes y dependientes de Pascua. La spec los fija contra el **calendario oficial**, y las pruebas comprueban **los festivos de 2026 y de 2027 fecha a fecha**, incluidos los trasladados a lunes y los de Semana Santa (usuario, 2026-09-24). *Hipótesis* sobre la base legal (no hay ley en el repo): Ley 51 de 1983.
- Cierres de empresa inyectados como parámetro; **sólo días completos** (usuario, 2026-09-24).
- Los cierres se registran por **alta directa en la base, sin pantalla**; los registra Alfonso (usuario, 2026-09-24).
- Escribir la fila F1B-12 en una sección de catálogo al final de la R01.3.
- Una función de horas hábiles y otra de días hábiles entre dos instantes.
- Tabla mínima de cierres en `public`, con esquema calificado, y su lector en el servidor.
- Alta de `calendario-laboral` en `capabilities` (R-2).

### Fuera
- Migrar `SLA_HORAS_POR_ESTADO` (`sla.ts:32-35`) y añadir las otras dos alarmas → F1B-08 / F1C-06.
- Reloj c7 → F1C-06; indicadores → F1F-05; punto 33.
- Planificador periódico; recálculo de tickets abiertos.
- Pantalla de administración de cierres (salvo respuesta distinta a la pregunta 1).

## Capacidades

### Nuevas
- `calendario-laboral`: jornada, días no laborables (festivos calculados + cierres) y el cálculo único de horas y días hábiles.

### Modificadas
- Ninguna.

## Enfoque

Enfoque 1 de la exploración. La ley vive en código y el dato de la empresa en la BD. La «tabla de días no laborables» de la decisión es la unión lógica de las dos cosas. El servidor es la autoridad y el cliente consume la misma función (regla 13, punto 1).

## Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/shared/src/` (módulo nuevo + pruebas + export) | Nuevo |
| `packages/zoho-sync/src/db/schema.sql`, `migrate.ts` | Tabla `public.*` de cierres |
| `apps/desk/server` | Lector de cierres |
| `openspec/config.yaml → capabilities` | Alta R-2 |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Error en algoritmo de Pascua o traslados | Media | Pruebas por años concretos contra fuente oficial |
| Deriva de zona horaria (servidor en UTC) | Media | Pruebas con instantes UTC que cruzan medianoche en Bogotá |
| El ID F1B-12 cambia al escribir el §5 | Baja | Salvedad escrita arriba |

## Plan de reversión

Pieza aditiva y sin consumidores en producción: se revierte el commit. La tabla nueva no la lee nadie más; `DROP TABLE public.<cierres>` si hace falta.

## Criterios de aceptación (strict TDD, rojo antes que verde)

1. Los festivos de al menos tres años concretos coinciden con la fuente oficial (la spec fija cuáles).
2. Un festivo que cae en martes se mueve al lunes siguiente; uno fijo no se mueve.
3. Jueves y Viernes Santo, Ascensión, Corpus y Sagrado Corazón salen de la Pascua de cada año.
4. Entre viernes 16:00 y lunes 9:00 hay 2 h hábiles; con un lunes festivo, 1 h.
5. Un instante en UTC se interpreta en `America/Bogota`.
6. Un cierre inyectado resta su día; sin cierres, el resultado depende sólo de la ley.
7. La mutación (regla 2) de quitar un festivo o un cierre pone roja alguna prueba.

## Ronda de preguntas de la propuesta (contestada por el usuario, 2026-09-24)

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Cómo se registran los cierres? | Alta directa en la base, sin pantalla; los registra Alfonso |
| 2 | El paso de `'Notificado'` de 24 h de reloj a 9 h hábiles, ¿va en esta fila? | **No va en esta fila.** Va en la misma tanda que construye la alerta de 4 días hábiles de `anexo-3-alerta`, para que las tres alarmas de `SLA_HORAS_POR_ESTADO` pasen a hábiles juntas. **Supuesto aplicado (modo producción, reversible):** esa fila es **F1B-08**, porque `anexo-3-alerta` declara `tanda_que_abre: "F1A-02 · F1B-08"` (`config.yaml:2329`) y F1A-02 está cerrada; así las tres alarmas pasan a hábiles juntas, que es lo que pide la respuesta. Se anota en la R01.3 junto a la fila F1B-12 |
| 3 | ¿Cierres de medio día? | No: sólo días completos |

**Dato de persona antes de cerrar la tanda (no es tarea; regla del ciclo 1):** las fechas de cierre de fin de año de la empresa. El orquestador se las pide al usuario antes de terminar la tanda; Alfonso las registra en la base.

No se preguntan dos cosas porque ya están resueltas. **Almuerzo:** «de 8 a 17 h (9 horas)» son 9 h continuas. **Sábados:** «de lunes a viernes». Las dos en `config.yaml:2320`.
