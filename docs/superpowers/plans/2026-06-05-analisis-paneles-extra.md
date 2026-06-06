# Paneles extra en Análisis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a la página Análisis tres paneles: por tipo de servicio, por clasificación, y tiempo de gestión por estado (aproximación = antigüedad promedio de los activos en cada estado).

**Architecture:** Extender el pipeline existente: `AnalisisRow` (+ tipoServicio/clasificaciones) → `computeAnalisis` (+ porTipoServicio/porClasificacion/gestionPorEstado) ← `getAnalisisRows` (lee `tipo_servicio`/`classification`); `Analisis.tsx` renderiza los 3 paneles con el `BarList` existente (con unidad opcional).

**Tech Stack:** TypeScript ESM, pg-mem, Vitest 3.x, React 19 + Vite + Tailwind. Spec: `docs/superpowers/specs/2026-06-05-analisis-paneles-extra-design.md`.

**Contexto del repo:**
- `shared/types.ts`: `AnalisisPunto { label; value }`; `AnalisisRow { status; statusType; createdAt; finalizadoAt; diasEntrega; marca; cliente; tecnico }`; `Analisis { activos; creados; finalizados; tiempoPromedioDias; cumplimientoPct; porEstado; porTecnico; porCliente; porMarca; tendencia }`.
- `shared/analisis.ts`: `computeAnalisis(rows, from, to)`. Helpers internos: `parseDate`, `inRange(d, from, to)`, `bump(map, key)`, y `puntos(map, top?)` (ordena desc por value). Bloque "creado en rango" hace `bump(porMarca, r.marca || '—')`. El loop ya calcula `const created = parseDate(r.createdAt)` y `const cerrado = r.statusType === 'Closed'`.
- `server/analisis.ts`: `getAnalisisRows` hace `SELECT t.status, t.status_type, t.created_time, t.closed_time, t.fecha_finalizacion_st, t.dias_entrega, t.marca, COALESCE(a.name, cl.name) AS cliente, g.name AS tecnico FROM tickets t LEFT JOIN accounts a … LEFT JOIN clients cl … LEFT JOIN agents g …` y mapea con `toIso`. `tickets` tiene columnas `tipo_servicio` y `classification`.
- `src/components/Analisis.tsx`: `BarList({ title, data })` (barras CSS, celda de valor `w-8`); grid de distribuciones con 4 `<BarList>` (porEstado/porTecnico/porCliente/porMarca).
- Tests: `shared/analisis.test.ts` (rows literales + 2 its), `server/analisis.test.ts` (pg-mem).

---

## Estructura de archivos
- Modify `shared/types.ts` — campos nuevos en `AnalisisRow` y `Analisis`.
- Modify `shared/analisis.ts` (+ `shared/analisis.test.ts`) — agregaciones nuevas.
- Modify `server/analisis.ts` (+ `server/analisis.test.ts`) — columnas + mapeo.
- Modify `src/components/Analisis.tsx` — `BarList` con unidad + 3 paneles.

---

## Task 1: Tipos (`AnalisisRow` + `Analisis`)

**Files:** Modify `shared/types.ts`

- [ ] **Step 1: En `AnalisisRow`** (tras `tecnico: string | null`) añade:
```ts
  tipoServicio: string | null
  clasificaciones: string | null
```

- [ ] **Step 2: En `Analisis`** (tras `porMarca: AnalisisPunto[]`) añade:
```ts
  porTipoServicio: AnalisisPunto[]
  porClasificacion: AnalisisPunto[]
  gestionPorEstado: AnalisisPunto[]
```

- [ ] **Step 3:** Run `npx tsc -p tsconfig.server.json --noEmit 2>&1 | head` — Expected: errores SOLO en `shared/analisis.ts` (el `return` ya no cumple `Analisis`) y posiblemente en los tests/`getAnalisisRows` por los campos nuevos de `AnalisisRow`. Esos se resuelven en las tareas siguientes. (No commit aún si prefieres; o commitea el tipo:)
```bash
git add shared/types.ts
git commit -m "feat(analisis-extra): tipos AnalisisRow/Analisis (tipo de servicio, clasificación, gestión por estado)"
```

---

## Task 2: `computeAnalisis` — 3 agregaciones (TDD)

**Files:** Modify `shared/analisis.ts`, `shared/analisis.test.ts`

- [ ] **Step 1: Actualizar las filas existentes del test** para incluir los campos nuevos (si no, `tsc` del test falla). En `shared/analisis.test.ts`, reemplaza el array `rows` por:
```ts
const rows: AnalisisRow[] = [
  { status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-10T00:00:00Z', finalizadoAt: null, diasEntrega: null, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-05T00:00:00Z', diasEntrega: 5, marca: 'Horiba', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z', finalizadoAt: '2026-05-11T00:00:00Z', diasEntrega: 3, marca: 'Grimm', cliente: 'Otro', tecnico: 'Beto', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo' },
  { status: 'Finalizado', statusType: 'Closed', createdAt: '2025-01-01T00:00:00Z', finalizadoAt: '2025-01-02T00:00:00Z', diasEntrega: 5, marca: 'Grimm', cliente: 'ACME', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' },
]
```

- [ ] **Step 2: Añadir aserciones de distribución** dentro del primer `it` (tras la línea de `porMarca`):
```ts
    expect(a.porTipoServicio.find((p) => p.label === 'Mantenimiento')?.value).toBe(2)
    expect(a.porTipoServicio.find((p) => p.label === 'Calibración')?.value).toBe(1)
    expect(a.porClasificacion.find((p) => p.label === 'Equipo nuevo')?.value).toBe(2)
```

- [ ] **Step 3: Añadir un test nuevo de `gestionPorEstado`** (al final del `describe`):
```ts
  it('gestionPorEstado = antigüedad promedio (días) de los activos por estado', () => {
    const to = new Date('2026-05-31T00:00:00Z')
    const base = { finalizadoAt: null, diasEntrega: null, marca: null, cliente: null, tecnico: null, tipoServicio: null, clasificaciones: null }
    const r: AnalisisRow[] = [
      { ...base, status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-21T00:00:00Z' }, // 10 días
      { ...base, status: 'Ingresado', statusType: 'Open', createdAt: '2026-05-11T00:00:00Z' }, // 20 días
      { ...base, status: 'En proceso', statusType: 'Open', createdAt: '2026-05-30T00:00:00Z' }, // 1 día
      { ...base, status: 'Finalizado', statusType: 'Closed', createdAt: '2026-05-01T00:00:00Z' }, // excluido (cerrado)
    ]
    const a = computeAnalisis(r, null, to)
    expect(a.gestionPorEstado).toEqual([
      { label: 'Ingresado', value: 15 },
      { label: 'En proceso', value: 1 },
    ])
  })
```

- [ ] **Step 4:** Run `npx vitest run shared/analisis.test.ts` — confirm FAIL (campos/propiedades no existen aún).

- [ ] **Step 5: Implementar en `shared/analisis.ts`.** Declara los acumuladores nuevos junto a los existentes (tras `const porMarca = new Map<string, number>()`):
```ts
  const porTipoServicio = new Map<string, number>()
  const porClasificacion = new Map<string, number>()
  const gestion = new Map<string, { sum: number; n: number }>()
```

- [ ] **Step 6:** En el bloque `if (inRange(created, from, to)) { … }`, junto a `bump(porMarca, r.marca || '—')`, añade:
```ts
      bump(porTipoServicio, r.tipoServicio || '—')
      bump(porClasificacion, r.clasificaciones || '—')
```

- [ ] **Step 7:** Acumular la gestión de activos. Dentro del loop, donde ya existe `if (!cerrado) { activos++; bump(porEstado, r.status || '—') }`, **amplía ese bloque** para sumar la edad:
```ts
    if (!cerrado) {
      activos++; bump(porEstado, r.status || '—')
      if (created) {
        const edadDias = (to.getTime() - created.getTime()) / 86400000
        if (edadDias >= 0) {
          const g = gestion.get(r.status || '—') ?? { sum: 0, n: 0 }
          g.sum += edadDias; g.n++; gestion.set(r.status || '—', g)
        }
      }
    }
```
  (Si `const created = parseDate(r.createdAt)` se declara DESPUÉS de este bloque en el código actual, mueve la
  declaración de `created` para que quede ANTES del bloque `if (!cerrado)`, o calcula `parseDate(r.createdAt)` aquí.)

- [ ] **Step 8:** En el `return`, añade los 3 campos (tras `porMarca: puntos(porMarca, 10),`):
```ts
    porTipoServicio: puntos(porTipoServicio, 10),
    porClasificacion: puntos(porClasificacion, 10),
    gestionPorEstado: [...gestion.entries()]
      .map(([label, { sum, n }]) => ({ label, value: Math.round((sum / n) * 10) / 10 }))
      .sort((a, b) => b.value - a.value),
```

- [ ] **Step 9:** Run `npx vitest run shared/analisis.test.ts` — confirm PASS.

- [ ] **Step 10:** Run `npx tsc -b && npx eslint shared/analisis.ts shared/analisis.test.ts` — sin errores; eslint 0.

- [ ] **Step 11: Commit**
```bash
git add shared/analisis.ts shared/analisis.test.ts shared/types.ts
git commit -m "feat(analisis-extra): computeAnalisis con porTipoServicio/porClasificacion/gestionPorEstado"
```

---

## Task 3: `getAnalisisRows` — columnas + mapeo (TDD)

**Files:** Modify `server/analisis.ts`, `server/analisis.test.ts`

- [ ] **Step 1: Extender el test** `server/analisis.test.ts`. En el `INSERT` del único caso, añade `tipo_servicio` y `classification`, y añade aserciones. Reemplaza el cuerpo del `it` por:
```ts
    await db.query("INSERT INTO agents (id,name,source) VALUES ('g1','Ana','zoho')")
    await db.query("INSERT INTO tickets (id,number,subject,status,status_type,created_time,fecha_finalizacion_st,dias_entrega,marca,assignee_id,tipo_servicio,classification) VALUES ('t1',1,'A','Finalizado','Closed','2026-05-01T00:00:00Z','2026-05-06',5,'Grimm','g1','Mantenimiento','Equipo para servicio')")
    const rows = await getAnalisisRows(db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ status: 'Finalizado', statusType: 'Closed', diasEntrega: 5, marca: 'Grimm', tecnico: 'Ana', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo para servicio' })
    expect(rows[0].finalizadoAt?.slice(0, 10)).toBe('2026-05-06')
    expect(rows[0].createdAt?.slice(0, 10)).toBe('2026-05-01')
```

- [ ] **Step 2:** Run `npx vitest run server/analisis.test.ts` — confirm FAIL (tipoServicio/clasificaciones undefined).

- [ ] **Step 3: En `server/analisis.ts`**, añade las columnas al `SELECT` (tras `t.marca,`):
```ts
            t.tipo_servicio, t.classification,
```
  y en el `.map`, tras `marca: x.marca ?? null,` añade:
```ts
    tipoServicio: x.tipo_servicio ?? null, clasificaciones: x.classification ?? null,
```

- [ ] **Step 4:** Run `npx vitest run server/analisis.test.ts` — confirm PASS.

- [ ] **Step 5:** Run `npx tsc -p tsconfig.server.json --noEmit && npx eslint server/analisis.ts` — typecheck limpio; eslint 0.

- [ ] **Step 6: Commit**
```bash
git add server/analisis.ts server/analisis.test.ts
git commit -m "feat(analisis-extra): getAnalisisRows lee tipo_servicio + classification"
```

---

## Task 4: UI — 3 paneles en `Analisis.tsx`

**Files:** Modify `src/components/Analisis.tsx`

- [ ] **Step 1: `BarList` con unidad opcional.** Reemplaza la firma y la celda del valor. Cambia
  `function BarList({ title, data }: { title: string; data: AnalisisPunto[] }) {` por:
```tsx
function BarList({ title, data, unit }: { title: string; data: AnalisisPunto[]; unit?: string }) {
```
  y dentro, la línea del valor
  `<span className="w-8 text-right font-bold text-slate-700">{d.value}</span>`
  por:
```tsx
            <span className="w-12 text-right font-bold text-slate-700">{d.value}{unit ? ` ${unit}` : ''}</span>
```

- [ ] **Step 2: Añadir los 2 paneles de distribución** al grid existente. Tras
  `<BarList title="Por marca (periodo)" data={data.porMarca} />` añade:
```tsx
              <BarList title="Por tipo de servicio (periodo)" data={data.porTipoServicio} />
              <BarList title="Por clasificación (periodo)" data={data.porClasificacion} />
```

- [ ] **Step 3: Añadir el panel de gestión** debajo del grid de distribuciones. Justo tras el `</div>` que cierra
  ese grid (`<div className="grid grid-cols-1 md:grid-cols-2 gap-4"> … </div>`) y antes del `</div>` del contenedor
  `flex flex-col gap-4`, añade:
```tsx
            <BarList title="Tiempo de gestión por estado (días, activos)" data={data.gestionPorEstado} unit="d" />
```

- [ ] **Step 4:** Run `npx tsc -b && npx eslint src/components/Analisis.tsx && npx vite build` — sin errores; eslint 0; build OK.

- [ ] **Step 5: Commit**
```bash
git add src/components/Analisis.tsx
git commit -m "feat(analisis-extra): paneles por tipo de servicio, clasificación y tiempo de gestión por estado"
```

---

## Task 5: Verificación completa

- [ ] **Step 1:** Run `npm test && npx tsc -b && npx tsc -p tsconfig.server.json --noEmit && npx eslint . && npx vite build`
Expected: tests PASS (incl. `shared/analisis.test.ts`, `server/analisis.test.ts`); ambos `tsc` exit 0; eslint **0 errores**; build OK.

- [ ] **Step 2: Verificación manual (tras desplegar)**
1. Abrir **Análisis** → aparecen "Por tipo de servicio" y "Por clasificación" en el grid de distribuciones.
2. Aparece "Tiempo de gestión por estado (días, activos)" con barras y el valor en días (p.ej. `12.3 d`).
3. Cambiar el selector de rango actualiza tipo de servicio/clasificación (creados-en-rango); gestión por estado
   refleja los activos actuales.

- [ ] **Step 3: Commit final (si hubo ajustes)**
```bash
git add -A
git commit -m "chore(analisis-extra): verificado"
```

---

## Notas de cierre
- `gestionPorEstado` es una **aproximación** (antigüedad de los activos), no el tiempo real por etapa
  (`ticket_transitions`), que sigue diferido (Análisis v2).
- Las distribuciones por tipo de servicio/clasificación cuentan **creados en el rango** (coherente con
  porMarca/porTécnico/porCliente).
