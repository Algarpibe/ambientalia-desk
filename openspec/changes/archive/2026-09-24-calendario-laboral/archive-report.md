# Informe de archivo: calendario-laboral (F1B-12)

**Archivado el 2026-09-24** · verify: **pass_with_warnings** (0 CRITICAL, 1 WARNING, 2 SUGGESTION) ·
RDD apagado: archivo bajo la política ordinaria · primera tanda ejecutada en **modo producción**
(CLAUDE.md, «Regla de ejecución»).

## Cabecera R-1

    tanda: F1B-12
    capacidad: [calendario-laboral]
    maestro: ["Anexo D nº 3"]
    cierra: si
    toca_maestro: no

**Qué cubrió y qué dejó fuera (R-1):** cubrió las tres piezas de `decision/calendario-habil` —jornada
L-V 8-17 h, días no laborables (festivos de Colombia calculados por ley más cierres de la empresa) y una
única función de horas y días hábiles—; dejó fuera, por decisión, el paso de `'Notificado'` de 24 h de reloj
a 9 h hábiles y las otras dos alarmas (van en F1B-08, junto a la alerta de `anexo-3-alerta`), el reloj c7,
los indicadores y el planificador.

## Qué se entregó

| Pieza | Dónde |
|---|---|
| Módulo puro (festivos, `esDiaHabil`, `horasHabilesEntre`, `diasHabilesEntre`) | `packages/shared/src/calendarioLaboral.ts` + 27 pruebas |
| Tabla de cierres, días completos, esquema calificado | `public.calendario_cierres`, al final de `packages/zoho-sync/src/db/schema.sql` |
| Lector sin endpoint | `apps/desk/server/db/calendarioCierres.ts` + 2 pruebas pg-mem |
| Capacidad nueva (R-2) | `openspec/config.yaml` → `capabilities`, sustituyendo la línea en blanco que cerraba el bloque |
| Fila F1B-12 escrita | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md`, sección «G · Catálogo de filas», al final |
| Spec viva | `openspec/specs/calendario-laboral/spec.md` (12 requisitos, 18 escenarios) |

**Festivos:** los 18 de 2026 y los 18 de 2027 se comprueban fecha a fecha. Se calcularon tres veces por
separado —spec, orquestador y verificador, este último con otro algoritmo de Pascua— y coinciden las 36.
La base legal (Ley 51 de 1983) sigue siendo **hipótesis**: no hay texto legal en el repositorio.

## Supuestos del modo producción, anotados

1. El paso de `'Notificado'` a 9 h hábiles va en **F1B-08**, porque `anexo-3-alerta` declara
   `tanda_que_abre: "F1A-02 · F1B-08"` y F1A-02 está cerrada. Anotado en la sección G de la R01.3.
2. La hipótesis del diseño de que pg-mem convierte `date` a texto era falsa; el lector lee la fecha sin
   convertir y la normaliza (WARNING del verify).

## Incidencias corregidas por el orquestador

- Una línea de comentario añadida encima de `registro.test.ts:108` desplazaba citas: se dejó en la misma
  línea (+1/−1).
- El detector bloqueó `avisos.test.ts:1-10` (extremo final vacío): corregido a `:1-9`.
- El dato de persona estaba escrito como casilla y el router lo contaba como tarea pendiente: pasó a viñeta
  con dueño (regla del ciclo 1).

## Dato de persona pendiente (archivar NO lo da por hecho)

Las **fechas de cierre de fin de año** de la empresa: las fija Gerencia y las registra Alfonso por `INSERT`
directo en `public.calendario_cierres`, en producción. **No hay ninguna fecha decidida**: el `2026-12-31`
de la spec es un ejemplo de escenario de prueba, no un cierre.

## Ledger

Archivo adquirido con techo 2800 por si el `git mv` contaba doble: `git diff --cached --shortstat
--no-renames` da 931/931 sobre 931 líneas movidas sin cambiar un byte.
