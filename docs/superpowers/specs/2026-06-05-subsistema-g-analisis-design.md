# Diseño — Subsistema G: Análisis (reportería e indicadores)

**Fecha:** 2026-06-05
**Estado:** Aprobado para planificación
**Parte de:** programa de autonomía de la plataforma. Indicadores de gestión desde los datos que ya
registramos.
**Depende de:** A (tickets tipados con fechas promovidas), B (`ticket_transitions`), H1 (sesiones + admin).

## Objetivo

Una página **"Análisis"** (solo admin) con los indicadores clave del servicio técnico, calculados desde
`tickets` (+ `ticket_transitions` a futuro), con selector de periodo y gráficos de barras propios.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Nombre | **"Análisis"** (producto) |
| Acceso | **Solo admin**; entrada = el **botón "Análisis" de la barra superior** (hoy inerte), funcional para admin |
| Indicadores v1 | KPIs + distribuciones + tendencia mensual |
| Gráficos | **Barras CSS/SVG propias**, sin dependencias nuevas |
| Periodo | Selector **último mes / trimestre / año / todo** |
| Tiempos por etapa | **Diferido a v2** (SQL más complejo; solo era-app) |

## Datos y cómputo

Se lee de **`tickets`**: `status`, `status_type`, `created_time`, `closed_time`, `fecha_finalizacion_st`,
`dias_entrega`, `marca`, cliente (`COALESCE(a.name, cl.name)` por las uniones a `accounts`/`clients`), técnico
(`agents.name` por `assignee_id`).
- **Finalización** de un ticket = `fecha_finalizacion_st` ó, si falta, `closed_time`.
- **Tiempo de servicio** (días) = finalización − `created_time`.
- **Cerrado** = `status_type = 'Closed'`.

Para robustez y test fácil (evitar aritmética de fechas frágil en pg-mem), el endpoint **trae las filas** y un
**`computeAnalisis(tickets, from, to)` puro** calcula todo en JS.

## Indicadores (v1)

**Tarjetas (KPIs):**
- **Activos** (ahora): tickets no cerrados.
- **Creados** (en el periodo): `created_time` en `[from, to]`.
- **Finalizados** (en el periodo): cerrados con finalización en `[from, to]`.
- **Tiempo promedio de servicio** (días): media de (finalización − creación) de los finalizados del periodo
  (null si no hay).
- **% Cumplimiento de promesa**: de los finalizados del periodo con `dias_entrega` numérico, % cuyo tiempo de
  servicio ≤ `dias_entrega` (null si no hay).

**Distribuciones (barras), ordenadas desc, top configurable:**
- **Por estado** — snapshot **actual** de los activos (cuántos en cada estado).
- **Por técnico** — de los **creados en el periodo** (carga recibida); sin asignar = "Sin asignar".
- **Por cliente** — de los creados en el periodo (top 10).
- **Por marca** — de los creados en el periodo.

**Tendencia mensual (barras):** por mes dentro del rango, **creados vs finalizados**.

## Backend

- `GET /api/analisis?range=mes|trimestre|anio|todo` (con sesión **+ admin**, `requireSuperAdmin`): mapea
  `range` → `[from, to]` (`todo` = sin cota inferior; `to` = ahora), trae las filas y devuelve `Analisis`.
- Repo `getAnalisisRows(db)` (SELECT ligero con las uniones) + helper puro `computeAnalisis(rows, from, to)`.
- Tipos compartidos (`shared/types.ts`):
```ts
export interface AnalisisPunto { label: string; value: number }
export interface AnalisisMes { mes: string; creados: number; finalizados: number }
export interface Analisis {
  activos: number
  creados: number
  finalizados: number
  tiempoPromedioDias: number | null
  cumplimientoPct: number | null
  porEstado: AnalisisPunto[]
  porTecnico: AnalisisPunto[]
  porCliente: AnalisisPunto[]
  porMarca: AnalisisPunto[]
  tendencia: AnalisisMes[]
}
export interface AnalisisRow {
  status: string
  statusType: string | null
  createdAt: string | null
  finalizadoAt: string | null   // fecha_finalizacion_st ?? closed_time
  diasEntrega: number | null
  marca: string | null
  cliente: string | null
  tecnico: string | null
}
```

## Frontend

- `src/components/Analisis.tsx` (overlay, pantalla completa): selector de rango (botones) + tarjetas KPI +
  secciones de barras (distribuciones) + barras de tendencia. Estados de carga/error.
- Componente reutilizable `BarList` (label · barra proporcional al máximo · valor).
- `src/api/client.ts`: `fetchAnalisis(range): Promise<Analisis>`.
- **Entrada**: en `src/components/Header.tsx`, el botón **"Análisis"** de `NAV_TABS` se vuelve funcional —
  `onClick` abre la página **solo si `user.isAdmin`** (para no-admin queda inerte como hoy). `src/App.tsx`
  añade el estado `showAnalisis` y rinde `<Analisis/>`. (El botón "Tickets" cierra/no abre nada; "Análisis"
  marca activo mientras está abierto.)

## Manejo de errores y seguridad
- Endpoint bajo `requireAuth` + `requireSuperAdmin` (no-admin → 403). Consultas con parámetros ligados.
- `computeAnalisis` tolera fechas nulas/inválidas (las omite del cálculo correspondiente).

## Pruebas
- **`computeAnalisis`** (puro): con un set de filas de ejemplo, verifica activos/creados/finalizados,
  tiempo promedio, % cumplimiento, distribuciones (estado/técnico/cliente/marca) y tendencia mensual; respeta
  el rango `[from, to]`.
- **Endpoint** (supertest+sesión): admin obtiene `Analisis`; **403** no-admin; **401** sin sesión; `range`
  acota.

## Fuera de alcance (v1)
- **Tiempos por etapa / cuello de botella** (desde `ticket_transitions`) → v2.
- Exportar a PDF/Excel, librería de gráficos, filtros combinados (técnico×cliente), drill-down a tickets.
