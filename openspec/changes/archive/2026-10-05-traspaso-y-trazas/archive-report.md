# Informe de archivo — `traspaso-y-trazas`

**Tanda:** F1B-05 · **`cierra: no`** · **Fecha:** 2026-10-05 · **Rama:** `traspaso-y-trazas`, apilada sobre `migracion-tickets-abiertos` en `9cfd37d`. Sin fusionar.

**Cobertura de la fila (R-1):** F1B-05 cubre aquí el traspaso (línea propia en el historial, compuesta al leer) y los huecos de traza fuera de `ticket_transitions` (restauración de remisión, liberación por borrado, barrido de escritores); confirma la casilla «Cumple condiciones comerciales» como construida y opcional; deja fuera la mitad de visibilidad por área, que espera la respuesta a E-089, y el protocolo de traspaso que el maestro marca como propuesto (reasignación con motivo). Por eso no cierra la fila.

## Qué se construyó

- **Restauración con rastro** — `restaurarRemision` (`apps/desk/server/db/remisiones.ts`) guarda quién y cuándo restaura y copia la anulación que deshace, en cuatro columnas nuevas de `public.remisiones`, con un solo `UPDATE` que no escribe si la remisión está vigente. El historial enseña la anulación previa y la restauración (`apps/desk/server/db/remisionRestaurada.ts`).
- **Liberación por borrado con actor** — `liberarAsociacionesDeTicket` rellena `liberada_por`; `eliminarTicket` exige el actor por tipo cuando no es pasada en seco.
- **Barrido de escritores** — `apps/desk/server/escritoresTransiciones.test.ts` compara un inventario exacto de los escritores de `ticket_transitions` (cuatro en el código y un procedimiento `.sql` de `docs/sdd/`) y exige que nombren `performed_by`. Un escritor nuevo lo pone rojo aunque cumpla.
- **Línea de traspaso** — `apps/desk/server/db/traspaso.ts`, módulo puro: «Traspaso: origen → destino», con la persona derivada o, si no la hay, las áreas siguientes del estado de llegada. No consulta, no escribe y no crea avisos. Excluye la creación y el marcador de la migración de F1F-01.
- **Excepciones de traza declaradas** — ajustes de prioridad, asociaciones de orden de venta y cambios comerciales del equipo guardan su propio rastro y no entran en el historial; una prueba lo fija.

Sin cambios en el cliente: ningún `.tsx` tocado. Nada se ejecutó contra una base real.

## Intentos y medida

Medida de cada intento: `git diff --shortstat --no-renames` contra su commit de partida, más lo nuevo sin trackear. Coincide con el registro en los tres.

| Intento | Commit | Líneas | Pruebas | Mutaciones |
|---|---|---|---|---|
| Planificación (fuera de intento) | `540f31c` | — | — | — |
| Lote 1 · trazas y barrido | `4d88bd8` | 630 | 3.325 | 7 (una equivalente) |
| Lote 2 · traspaso y documentos | `9858ca2` | 421 | 3.345 | 5 |
| Verify y remediación | `5e449da` | 244 | 3.347 | 4 en el verify y la de contraste tras remediar |

Antes de cada asiento el orquestador ejecutó pruebas, typecheck, lint (165 avisos, sin margen) y detector de citas, los cuatro en 0. Las mutaciones de los lotes las aplicó la fase de aplicar; el verify reprodujo cuatro por su cuenta y el orquestador, la de contraste.

## Verify

PASS con avisos, 0 críticos, 8 requisitos y 30 escenarios (28 observados por una prueba, 2 de forma parcial al escribir el informe).

- **Remediado en el mismo intento:** W-1 y W-2 (el destino por varias áreas y por un área nueva no tenían prueba; ahora un barrido de todo el catálogo lo fija, y la mutación que quedaba verde queda roja) y W-3 (tres citas abreviadas mal atribuidas).
- **Queda abierto, y archivar no lo cierra:**
  - W-4 — la posición de la copia dentro del `SET` es equivalente en pg-mem y en PostgreSQL; la restauración no tiene prueba de integración contra una base real.
  - W-5 — la evidencia de TDD va como rojos literales por tarea, no en la tabla de la plantilla.
  - La restauración concurrente no la ejerce ninguna prueba; la sostiene la semántica del `UPDATE` con su condición.
  - Que el panel pinte bien los eventos nuevos se comprobó leyendo `apps/desk/src/components/HistoriaPanel.tsx`, no con una prueba de interfaz; la comprobación en la aplicación es tarea de persona.

## Desviaciones respecto al diseño

- Una segunda prueba de `packages/zoho-sync/src/db/migrate.test.ts` cuenta las sentencias posteriores a `idx_prioridad_ajustes` y el diseño no la preveía; se ajustó en sitio.
- La mutación de posición dentro del `SET` es equivalente; la que discrimina es quitar la copia.
- La mutación de la exclusión del marcador discrimina cambiando el criterio a destino vacío, no sólo moviéndola.
- `apps/desk/server/reconciliacion/registro.test.ts` pasa de nueve a diez tandas «en curso»: entra F1B-05.

## Supuestos aplicados, todos reversibles

Sólo se construye la presentación derivada del traspaso, sin aprobar el protocolo; se guarda sólo el último ciclo de anular y restaurar; no hay relleno de datos anteriores; hay línea por cada transición con destino resoluble, aunque la persona o el área no cambien («Comercial → Comercial» también sale); un identificador que no resuelve se enseña tal cual; el barrido comprueba que la columna se nombra, no que el valor no sea nulo.

## Specs vivas

Fusionadas por script con comprobación de identidad contra el delta: RQ-TZ-14 a RQ-TZ-19 al final de `openspec/specs/trazas/spec.md` y RQ-AV-18 al final de `openspec/specs/derivacion-avisos/spec.md`. **Un MODIFIED:** RQ-TZ-06 crece 14 líneas y desplaza lo que le sigue en la spec de trazas. Barrido de las 14 citas afectadas: 6 seguían ciertas y se anclaron a la revisión que las escribió (caso B); 8, de cambios archivados, ya no coincidían con su revisión antes de esta fusión y se dejan como estaban. La fila D-2 y el párrafo de alcance de la spec de trazas dejan de afirmar «tres eventos» de remisión. No se crea ninguna capacidad (R-2 no aplica).

## Bandeja

E-219 (el actor que no es una persona no se distingue en el historial), E-220 (aprobación del protocolo de traspaso) y E-221 (excepciones de traza y límite del último ciclo), las tres con dueño Gerencia. Siguiente entrada libre: E-222. Corrección 26 del maestro escrita en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`; siguiente corrección: 27.

## Tareas de personas — archivar no las da por hechas

Responder E-089; aprobar o no el protocolo de traspaso (E-220); decidir cómo se identifica el actor que no es una persona (E-219); pegar la corrección 26 en el maestro; verificar en la aplicación la línea de traspaso y la restauración; desplegar y comprobar las cuatro columnas en producción; decidir si se rellenan las restauraciones y liberaciones anteriores.

## Para el paquete de despliegue

Cuatro columnas nuevas en `public.remisiones` (`restaurada_at`, `restaurada_por`, `anulacion_previa_at`, `anulacion_previa_por`), que aplica la migración al arrancar. Sin variables nuevas, sin relleno y sin endpoint nuevo.
