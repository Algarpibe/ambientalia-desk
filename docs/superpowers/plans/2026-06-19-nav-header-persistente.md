# Nav: Header global persistente + sección activa marcada — Plan

> subagent-driven. Directo en `main`. Frontend-only (`apps/desk/src`). Sin cambio de API.

**Goal:** Al entrar a una sección del nav (Análisis/Clientes/Actividades), el **Header global superior persiste** (no lo tapa el overlay) y la **pestaña activa se resalta** (subrayado azul que ya usa el Header). La barra propia de cada sección se **adelgaza** (quitar `←` + título; conservar sus controles, p. ej. el selector de rango de Análisis). Navegar entre secciones y "Tickets" vuelve al tablero.

**Decisiones (confirmadas):** persistir Header + marcar activa; adelgazar la sub-barra de cada sección. Alcance = las 3 secciones del nav (Análisis, Clientes, Actividades). Los modales del menú de usuario (Users/Roles/Equipos/Config) y "Nuevo ticket" se quedan como están (no son secciones del nav).

## Contexto
- `Header.tsx`: `NAV_TABS` con `active:true` estático en 'Tickets'; los botones llaman `onOpenAnalisis/onOpenClientes/onOpenActividades`. Resalte activo = `border-b-2 border-blue-500 bg-white/5`.
- `App.tsx`: estados independientes `showAnalisis/showClientes/showActividades` (+ modales). Las secciones se renderizan en `<Suspense>` como overlays.
- Secciones (`Analisis.tsx`, `ClientesPage.tsx`, `ActividadesPage.tsx`): raíz `fixed inset-0 z-[70] ...` con barra oscura propia (`← arrow_back` + título + controles).

## Task 1: Estado de sección activa + mutuamente excluyentes (App.tsx)
**Files:** `apps/desk/src/App.tsx`
- Derivar `activeSection`: `const activeSection = showAnalisis ? 'analisis' : showClientes ? 'clientes' : showActividades ? 'actividades' : 'tickets'`.
- Hacer las 3 secciones **mutuamente excluyentes**: al abrir una, cerrar las otras. Helper:
  ```ts
  const abrirSeccion = (s: 'analisis'|'clientes'|'actividades'|'tickets') => {
    setShowAnalisis(s === 'analisis'); setShowClientes(s === 'clientes'); setShowActividades(s === 'actividades')
    if (s !== 'clientes') setClientesInitial(null)
  }
  ```
- Pasar al Header: `activeSection={activeSection}` y handlers que usen `abrirSeccion` (`onOpenAnalisis={() => abrirSeccion('analisis')}`, `onOpenClientes`, `onOpenActividades`, y nuevo `onOpenTickets={() => abrirSeccion('tickets')}`). Mantener `abrirCliente(kind,id)` (que setea clientesInitial + abre clientes) funcionando — debe cerrar análisis/actividades también.
- (El resto del layout queda igual; los overlays siguen renderizándose por sus `show*`.)

## Task 2: Header con sección activa + Tickets clickable (Header.tsx)
**Files:** `apps/desk/src/components/Header.tsx`
- Añadir prop `activeSection: 'tickets'|'analisis'|'clientes'|'actividades'` y `onOpenTickets: () => void` a la firma.
- Mapear cada `NAV_TAB` a una key: Tickets→'tickets', Análisis→'analisis', Actividades→'actividades', Clientes→'clientes' (Mensajería/Base de Conocimientos sin key → disabled como hoy).
- Quitar el `active:true` estático; calcular activo: `const isActive = key === activeSection`. Aplicar el estilo activo (`text-white border-blue-500 bg-white/5`) al que coincida.
- 'Tickets' ahora es clickable → `onOpenTickets` (vuelve al tablero). Análisis solo si `user?.isAdmin` (como hoy).

## Task 3: Secciones bajo el header + sub-barra adelgazada
**Files:** `apps/desk/src/components/Analisis.tsx`, `ClientesPage.tsx`, `ActividadesPage.tsx`
- En cada una, cambiar la raíz `fixed inset-0 z-[70]` → `fixed inset-x-0 bottom-0 top-[48px] z-20` (deja visible y clickable el Header global, que es `h-[48px] z-30`).
- **Adelgazar su barra superior:** quitar el botón `←`/`arrow_back` y el `<h1>` título; **conservar los controles propios** (Análisis: selector de rango Último mes/Trimestre/Año/Todo; Clientes/Actividades: buscador/filtros existentes). Si tras quitar título/back la barra queda vacía, eliminar la barra; si tiene controles, dejarla solo con ellos.
- **No** quitar la prop `onClose` ni la lógica `onSelectTicket` (ClientesPage/ActividadesPage la usan para abrir un ticket). `onClose` se sigue invocando desde el nav (Tickets) vía App; ya no hace falta un botón propio.
- Leer cada componente para adaptar su barra concreta (difieren).

## Verificación
- `npm run typecheck` (0), `npm run lint` (0 errores), `cd apps/desk && npx vite build` (OK), `npm test` (verde — los tests no cubren estos componentes, pero confirmar que nada rompe).
- Commit + push a `main`.

## Validación tras deploy (usuario)
- Abrir Análisis/Clientes/Actividades → el **nav superior sigue visible**, la pestaña activa **resaltada**; la sección muestra solo sus controles (sin "← Análisis"). "Tickets" vuelve al tablero. Saltar entre secciones funciona.

## Notas
- `top-[48px]` = altura del Header (`h-[48px]`). z: Header 30 > secciones 20 → header siempre encima/clickable. Los modales (Users/Roles/Equipos/Config/CreateTicket) siguen en `z-[50+]` cubriendo todo (son diálogos, OK).
- Si TicketDetailView (z alto) se abre desde Clientes/Actividades, su comportamiento no cambia.
