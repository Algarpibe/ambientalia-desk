# Diseño: columna propia para `Verificación` y `Solicitud Soporte`

Dos entradas de datos en `COLUMNS`; el reparto se deriva de la lista
(`packages/shared/src/columns.ts:40-42`), sin lógica nueva. Todo va EN SITIO: ningún fichero citado
cambia de número de líneas salvo `columns.test.ts`, que sólo crece por el final.

## D1 · `packages/shared/src/columns.ts` — líneas `:15` y `:20` (el fichero conserva 47)
```ts
  { id: 'ticket_creado', label: 'Ticket creado', statuses: [STATUS_TICKET_CREADO] }, { id: 'solicitud_soporte', label: 'Solicitud Soporte', statuses: ['Solicitud Soporte'] }, // soporte-remoto: estado de nacimiento, junto a 'Ticket creado'; misma línea para no desplazar citas (decision/e225-columna-propia-dos-estados)
  { id: 'proceso', label: 'En Proceso', statuses: ['En Proceso'] }, { id: 'verificacion', label: 'Verificación', statuses: ['Verificación'] }, // equipo-nuevo: sólo se llega desde 'En Proceso'; misma línea para no desplazar citas (decision/e225-columna-propia-dos-estados)
```
- Posición: nacimiento en `packages/shared/src/flujos.ts:139`; única entrada a `Verificación` en
  `packages/shared/src/transitions.ts:357`. Idioma de la línea doble: `packages/shared/src/estados.ts:182`.
- `max-len`: **no existe**. `eslint.config.js:29-32` declara una sola regla propia (`no-explicit-any`).
  Que los conjuntos heredados de `eslint.config.js:20-23` no la traigan es **hipótesis** hasta `npm run lint`.
- El comentario no lleva forma de cita con número de línea: el detector no tiene nada que romper.

## D2 · `packages/shared/src/columns.test.ts` — `:1-40` conservan su posición
`:2`, sin añadir línea (precedente `packages/shared/src/transitions.test.ts:5`; los vecinos importan de
`./estados`, no del índice: `sla.test.ts:3`, `migracionTickets.test.ts:8`); y `:7-8` de la lista `:6-11`:
```ts
import { COLUMNS, columnForStatus } from './columns'; import { ESTADOS } from './estados'
      'ov_asignada', 'ticket_creado', 'solicitud_soporte', 'remision_creada', 'ingresado', 'revision', 'notificado',
      'proceso', 'verificacion', 'solicitado', 'espera_repuestos', 'espera_sku', 'notif_compras', 'continuacion',
```

## D3 · Prueba exhaustiva — desde `:42`, tras una línea vacía
```ts
// Columna de cada uno de los 23 estados ANTES del cambio (medida sobre 7a2b1c8).
const COLUMNA_ANTES: Record<string, string> = {"En Espera de Repuestos":"espera_repuestos","Servicio externo":"servicio_externo","Notificación cliente":"notif_cliente","Por Entregar":"por_entregar","Por Entregar / Sin facturar":"entregar_sin_facturar","Notificación a Compras":"notif_compras","Notificación Comercial":"notif_comercial","En espera de SKU inventario":"espera_sku","Solicitado":"solicitado","Liberación Comercial":"comercial","Remisión creada":"remision_creada","Ingresado":"ingresado","Rev./Diagnostico":"revision","Notificado":"notificado","En Proceso":"proceso","Continuación del proceso":"continuacion","Por Facturar":"por_facturar","Finalizado":"otros","OV asignada":"ov_asignada","Ticket creado":"ticket_creado","Pendiente":"pendiente","Verificación":"otros","Solicitud Soporte":"otros"}

describe('columna propia de Verificación y Solicitud Soporte (decision/e225-columna-propia-dos-estados)', () => {
  it('(a) la tabla tiene por claves exactamente ESTADOS, en los dos sentidos', () => { expect(Object.keys(COLUMNA_ANTES).sort()).toEqual([...ESTADOS].sort()) })
  it('(b) sólo esos dos estados cambian de columna', () => { expect(ESTADOS.filter((e) => columnForStatus(e) !== COLUMNA_ANTES[e]).sort()).toEqual(['Solicitud Soporte', 'Verificación']) })
  it('(c) sus columnas son verificacion y solicitud_soporte, con ese único estado cada una', () => {
    expect(columnForStatus('Verificación')).toBe('verificacion')
    expect(columnForStatus('Solicitud Soporte')).toBe('solicitud_soporte')
    expect(COLUMNS.find((c) => c.id === 'verificacion')?.statuses).toEqual(['Verificación'])
    expect(COLUMNS.find((c) => c.id === 'solicitud_soporte')?.statuses).toEqual(['Solicitud Soporte'])
  })
  it('(d) otros sigue siendo la última columna y no declara estados', () => { expect(COLUMNS[COLUMNS.length - 1]).toEqual({ id: 'otros', label: 'Otros', statuses: [] }) })
  it('(e) el único estado del registro que cae en otros es Finalizado', () => { expect(ESTADOS.filter((e) => columnForStatus(e) === 'otros')).toEqual(['Finalizado']) })
  it('(f) ningún estado está declarado en dos columnas', () => { const declarados = COLUMNS.flatMap((c) => c.statuses); expect(new Set(declarados).size).toBe(declarados.length) })
})
```
`ESTADOS` es `packages/shared/src/estados.ts:112`. La tabla coincide entrada a entrada con
`columns.ts:14-34` de hoy. (c) fija los `statuses` exactos y se añade (f): ver M4.

## D4 · `packages/shared/src/flujos.test.ts` — `:125-128` y `:204-206`, en sitio (258 líneas)
```ts
describe('RQ-EN-07 (tablero) · Verificación tiene columna propia', () => {
  it('columnForStatus("Verificación") es "verificacion" (columna propia, ya no FALLBACK_COLUMN_ID; decision/e225-columna-propia-dos-estados)', () => {
    expect(columnForStatus('Verificación')).toBe('verificacion')
  })
```
```ts
  it('S-10 INVERTIDA · Solicitud Soporte tiene columna propia (decision/e225-columna-propia-dos-estados; antes caía en Otros)', () => {
    expect(columnForStatus('Solicitud Soporte')).toBe('solicitud_soporte')
  })
```
El «contraste» de `:130-132` no se toca: sigue siendo cierto.

## D5 · Orden TDD estricto
1. **Rojo** — D2, D3 y D4 sin tocar `columns.ts`. Fallos esperados: lista de ids (21 recibidos frente
   a 23); (b) recibe `[]`; (c) recibe `'otros'`; (e) recibe `['Finalizado', 'Verificación',
   'Solicitud Soporte']`; las dos de `flujos.test.ts` reciben `'otros'`. (a), (d) y (f) nacen verdes,
   y es correcto: son guardas, no impulsoras.
2. **Verde** — las dos líneas de D1. Después `npm test`, `npm run typecheck`, `npm run lint`.

## D6 · Mutaciones del cierre (sobre `columns.ts`)
| # | Mutación | Debe ponerse rojo |
|---|---|---|
| M1 | quitar `verificacion` | (b), (c), lista de ids, `flujos.test.ts:126-128` |
| M2 | quitar `solicitud_soporte` | (b), (c), lista de ids, `flujos.test.ts:204-206` |
| M3 | mover una de las dos | **sólo** la lista de ids (`columns.test.ts:6-11`); la exhaustiva sigue verde |
| M4 | añadir `'Pendiente'` a los `statuses` de una de las dos | (c) y (f); **(b) NO** |

**M4, desviación sobre el encargo:** (b) no puede cazar `'Pendiente'`. `Object.fromEntries` conserva
la última pareja de cada clave (`columns.ts:40-42`) y la columna `pendiente` (`:27`) va después de las
dos nuevas, así que `columnForStatus('Pendiente')` no cambia. Por eso (c) fija los `statuses` exactos y
existe (f). (b) sí caza un ajeno cuya columna va ANTES: `'Ingresado'` (`:17`) en `verificacion`.

## D7 · Regla invariable 13 y consecuencia S-3
No se toca `apps/desk/src`: el cliente consume la lista — `apps/desk/src/board.ts:2` (import), `:7`
(los grupos nacen de `COLUMNS`), `:9` (`columnForStatus`), y `apps/desk/src/App.tsx:120` la pasa al
tablero. Ninguna decisión nueva del cliente; no hay tabla que rellenar.

**S-3 pasa de hipótesis a HECHO, y más estrecho:** `apps/desk/src/components/KanbanBoard.tsx:17` pinta
`visibleColumns(columns, counts, hideEmpty)`; una columna propia vacía se oculta con `hideEmpty`
(`apps/desk/src/board.ts:26-27`), que vale `true` por defecto (`apps/desk/src/boardSettings.ts:10`).
Las dos columnas vacías se ven **sólo** si el usuario desactivó «ocultar vacías». No se corrige aquí.

## D8 · Barrido de citas (regla de mutación 4) — de comprobación
`grep -rnoE "(columns|columns\.test|flujos\.test)\.ts:[0-9]+(-[0-9]+)?"` más `wc -l`: `columns.ts`
47 y `flujos.test.ts` 258, como hoy; cada cita debe seguir apuntando a la misma línea. Segundo pase,
abreviadas, en los ficheros que ya citan el módulo. Citas cuyo TEXTO deja de ser cierto sin moverse:

| Cita | Qué hace la rama |
|---|---|
| `openspec/specs/transitions-equipo-nuevo/spec.md:264-267`, escenario `:269-272`, título `:256` | delta de `sdd-spec` |
| `openspec/specs/transitions-soporte-remoto/spec.md:108-109` | delta de `sdd-spec` |
| `openspec/config.yaml:4193-4195` («dos pruebas que hoy afirman lo contrario», «hoy lo prohíben») | **nada**: traspaso a Supervisión |
| `docs/sdd/ENTRADA.md:2133` («no tienen columna») | **nada**: traspaso a Supervisión |
| `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:258-260` (B-4, «caen en Otros») | **nada**: traspaso a Supervisión |

Los paquetes de despliegue fechados y `openspec/changes/archive/` son caso B: no se tocan.

## Amenazas, despliegue y preguntas abiertas
Matriz de amenazas: N/A (sin rutas, shell ni subprocesos). Sin migración ni interruptor; reversión:
revertir el commit del apply. Preguntas que bloqueen: ninguna; S-1, S-2 y S-3 siguen siendo de Gerencia.
