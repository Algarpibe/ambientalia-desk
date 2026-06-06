# Diseño — Paneles extra en Análisis (tipo de servicio, clasificación, tiempo de gestión)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Contexto:** La página **Análisis** ya muestra KPIs, distribuciones (estado/técnico/cliente/marca) y tendencia.
Se complementa con 3 paneles inspirados en el dashboard "Panel Tecnico" de Zoho.
**Depende de:** subsistema G (Análisis: `shared/analisis.ts`, `server/analisis.ts`, `src/components/Analisis.tsx`).

## Decisiones (confirmadas)

| Panel | Cálculo |
|---|---|
| **Por tipo de servicio** | Conteo de tickets **creados en el rango**, agrupado por `tipo_servicio` |
| **Por clasificación** | Conteo de tickets **creados en el rango**, agrupado por `classification` |
| **Tiempo de gestión por estado** | Promedio de **días desde creación** de los tickets **activos** (`statusType !== 'Closed'`) que hoy están en cada estado; edad = `to − createdAt` |

## Datos disponibles
- `tickets.tipo_servicio` (columna real) y `tickets.classification` (columna real, ya leída en el detalle).
- `AnalisisRow.createdAt` ya existe; `status`/`statusType` ya existen.

## Cambios

### `shared/types.ts`
- `AnalisisRow`: añadir `tipoServicio: string | null`, `clasificaciones: string | null`.
- `Analisis`: añadir `porTipoServicio: AnalisisPunto[]`, `porClasificacion: AnalisisPunto[]`,
  `gestionPorEstado: AnalisisPunto[]` (en `gestionPorEstado`, `value` = días, 1 decimal).

### `shared/analisis.ts` (`computeAnalisis`)
- En el bloque de "creado en rango" (junto a `porMarca`), acumular `porTipoServicio` (`r.tipoServicio || '—'`)
  y `porClasificacion` (`r.clasificaciones || '—'`).
- Nuevo acumulador para activos: por cada fila con `statusType !== 'Closed'` y `createdAt` válido,
  `edadDias = (to − createdAt)/86400000`; si `>= 0`, sumar a `gestionPorEstado[status]` (suma + conteo).
  Resultado: `value = round(suma/conteo, 1)`, ordenado desc por `value`.
- Devolver los 3 nuevos campos (distribuciones con `puntos(map)`; gestión con el promedio).

### `server/analisis.ts` (`getAnalisisRows`)
- SQL: añadir `t.tipo_servicio, t.classification`.
- Map: `tipoServicio: x.tipo_servicio ?? null`, `clasificaciones: x.classification ?? null`.

### `src/components/Analisis.tsx`
- `BarList`: añadir prop opcional `unit?: string`; mostrar `{value}{unit ? ' '+unit : ''}` y ensanchar la
  celda del valor a `w-12` (para "12.3 d").
- Añadir al grid de distribuciones: `<BarList title="Por tipo de servicio (periodo)" data={data.porTipoServicio} />`
  y `<BarList title="Por clasificación (periodo)" data={data.porClasificacion} />`.
- Añadir un panel: `<BarList title="Tiempo de gestión por estado (días, activos)" data={data.gestionPorEstado} unit="d" />`.

## Pruebas
- **`computeAnalisis`** (extender `shared/analisis.test.ts`):
  - Añadir `tipoServicio`/`clasificaciones` a las filas existentes (para que `tsc` pase) + aserciones:
    `porTipoServicio` y `porClasificacion` cuentan solo creados-en-rango.
  - Nuevo test de `gestionPorEstado`: 2 activos "Ingresado" con edades 10 y 20 días → `value 15`; 1 activo
    "En proceso" edad 1 → `value 1`; cerrados excluidos; orden desc.
- **`getAnalisisRows`** (extender `server/analisis.test.ts`): un ticket con `tipo_servicio`/`classification`
  se mapea a `tipoServicio`/`clasificaciones`.
- Analisis.tsx: cubierto por `tsc`/build + verificación manual.

## Fuera de alcance (v1)
- Tiempo **real** por etapa (duración en cada estado vía `ticket_transitions`) — sigue diferido (Análisis v2).
- Selector de agente / "últimos 7 días" exacto de Zoho (se usa el selector de rango existente).
