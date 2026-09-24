# Diseño: calendario laboral (F1B-12)

## Enfoque técnico

Enfoque 1 de la propuesta: **la ley vive en código, el dato de la empresa en la base.** Un módulo puro en
`packages/shared` calcula festivos, día hábil y horas/días hábiles, con los cierres **inyectados como
parámetro**; el servidor los lee de `public.calendario_cierres` y se los pasa. Mismo molde que
`packages/shared/src/fechasDerivadas.ts` (apto para navegador `:9`, `ZONA_NEGOCIO` `:13`, `Intl` `:46-48`).
Sin librerías de fechas (no hay ninguna en el monorepo, exploración §3). Sin consumidores en esta tanda.

## Decisiones

| # | Decisión | Alternativa rechazada | Razón |
|---|---|---|---|
| D1 | Fichero `packages/shared/src/calendarioLaboral.ts`, exportado con una línea **al final** de `packages/shared/src/index.ts` (hoy `:19` es la última) | Meterlo en `sla.ts` | `sla.ts` es un consumidor futuro (`:40-44`, horas de reloj); el calendario lo consumen seis piezas y es transversal |
| D2 | Día civil = `string` `YYYY-MM-DD` (`type DiaCivil = string`). Aritmética de días con `Date.UTC` + getters UTC (calendario puro, sin zona). Un instante se reduce a día con `diaEnZona` (`fechasDerivadas.ts:63-73`), **reutilizado, no reescrito** | `Date` a medianoche | `new Date('2026-09-09')` es medianoche UTC = día 8 en Bogotá (`fechasDerivadas.ts:59-61`). La cadena no tiene zona que derivar |
| D3 | Los bordes de la jornada (8:00 y 17:00 de Bogotá) se convierten a instante con un formateador `Intl` de hora/minuto construido una vez a nivel de módulo (A-7 de `fechasDerivadas.ts:44-45`) que mide el desplazamiento de la zona para ese día | Constante `-5 h` | Bogotá no tiene horario de verano, pero fijar el desplazamiento a mano es una segunda definición de la zona; se importa `ZONA_NEGOCIO` y no se redeclara |
| D4 | Festivos como **datos exportados** (tres tablas) + dos funciones de regla (`pascua`, `trasladarALunes`) | Lista por año | La decisión exige «generados por año según la ley» (`config.yaml:2534-2535`); datos exportados permiten la mutación de la regla 2 |
| D5 | Tabla `public.calendario_cierres`, añadida **al final** de `packages/zoho-sync/src/db/schema.sql`, calificada | `desk.*`, o sembrar festivos en la tabla | Es dato propio de la app, no de Zoho Desk: va con `avisos` (`schema.sql:131`) en `public`. Al final no desplaza citas `schema.sql:NNN` |
| D6 | Lector `apps/desk/server/db/calendarioCierres.ts`, molde de `apps/desk/server/db/avisos.ts` (`Queryable`, `:2`; `filas`, `:5`). **Sin endpoint ni ruta**: ningún consumidor existe en esta tanda (YAGNI). La primera tanda cliente que lo necesite añade `GET` | Endpoint ya | Una ruta sin consumidor es superficie sin prueba de uso; el cliente no calcula nada en F1B-12 |
| D7 | Exclusividad «ninguna otra pieza calcula horas hábiles»: **regla documental en la spec + barrido de cierre**, NO prueba automática | Prueba que busque cálculos en el código | Un detector por nombre sólo caza el nombre, no la noción (molde H5 de `CLAUDE.md`): daría verde falso. Única aritmética horaria hoy: `sla.ts:37,43` (reloj, fuera de alcance → F1B-08) y `ClienteDetalle.tsx:127` (formato de duración, no calendario) |
| D8 | Alta en `capabilities` **sustituyendo la línea en blanco** `config.yaml:312` (cierre del bloque) por `  - name: calendario-laboral`. `covers` y procedencia van en la cabecera de la spec | Bloque de 4-5 líneas tras `:311` | Insertar líneas desplaza TODAS las citas `config.yaml:NNNN` ≥ 312 (la propuesta cita `:2315-2545`; `CLAUDE.md` cita `:412`, `:631`, `:771`, `:832-837`, `:1485-1502`). Sustituir una línea desplaza cero. El lector de `reconcile` sólo exige `^ {2}- name: (.+)$` (`apps/desk/server/reconciliacion/comprobaciones.ts:89`) y corta en la línea `#` siguiente (`:98`) |
| D9 | Fila F1B-12 en una sección nueva **«G · Catálogo de filas»** al final de `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md` (hoy termina en `:207`) | Tocar §D.1 | Al final no desplaza nada; §5 no existe en la R01.3 |

**Precio de D8:** la entrada rompe la forma visual del bloque (sin `covers` ni línea en blanco antes del
comentario `:313`). Se acepta: la alternativa obliga a renumerar decenas de citas en tres ficheros.
Condición: en `apply` se comprueba que la línea a sustituir **siga siendo** la en blanco que cierra
`capabilities`, sea cual sea su número ese día.

## Interfaces

```ts
export type DiaCivil = string // 'YYYY-MM-DD', día de calendario en ZONA_NEGOCIO
export const JORNADA = { diasSemana: [1, 2, 3, 4, 5], inicioHora: 8, finHora: 17 } as const // 9 h continuas
export const FESTIVOS_FIJOS: ReadonlyArray<{ mes: number; dia: number; nombre: string }>        // 6
export const FESTIVOS_TRASLADABLES: ReadonlyArray<{ mes: number; dia: number; nombre: string }> // 7, al lunes
export const FESTIVOS_DE_PASCUA: ReadonlyArray<{ desplazamiento: number; trasladable: boolean; nombre: string }> // 5
export function domingoDePascua(anio: number): DiaCivil              // algoritmo anónimo gregoriano (Meeus/Jones/Butcher)
export function festivosDeColombia(anio: number): DiaCivil[]         // 18, ordenados, sin repetidos
export function esDiaHabil(dia: DiaCivil, cierres: ReadonlySet<DiaCivil>): boolean
export function horasHabilesEntre(desde: Date, hasta: Date, cierres: ReadonlySet<DiaCivil>): number // fraccionario; 0 si hasta <= desde
export function diasHabilesEntre(desde: DiaCivil, hasta: DiaCivil, cierres: ReadonlySet<DiaCivil>): number // días hábiles d con desde < d <= hasta
// servidor
export async function listarCierres(db: Queryable): Promise<DiaCivil[]> // SELECT fecha::text … ORDER BY fecha
```

Reglas de datos (Ley 51 de 1983, *hipótesis* de base legal; la spec fija el calendario oficial 2026-2027):
- **Fijos** (no se mueven): 1-ene, 1-may, 20-jul, 7-ago, 8-dic, 25-dic.
- **Trasladables** (al lunes siguiente si no caen en lunes, también desde domingo): 6-ene, 19-mar, 29-jun,
  15-ago, 12-oct, 1-nov, 11-nov.
- **De Pascua**: Jueves Santo −3 y Viernes Santo −2 (no se mueven); Ascensión +39, Corpus +60 y Sagrado
  Corazón +68, trasladados al lunes (quedan en +43, +64, +71).
- `horasHabilesEntre` recorre los días civiles de `diaEnZona(desde)` a `diaEnZona(hasta)`, y suma la
  intersección de `[desde, hasta]` con la ventana 8:00-17:00 de cada día hábil. Un día festivo o cerrado
  que coincide con fin de semana no resta dos veces (es un conjunto).

```sql
CREATE TABLE IF NOT EXISTS public.calendario_cierres (
  fecha date PRIMARY KEY,            -- sólo días completos (proposal, pregunta 3)
  motivo text NOT NULL,
  registrado_por text NOT NULL,      -- texto libre: alta directa por SQL, sin FK a users
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Flujo de datos

    Alfonso ──INSERT SQL──→ public.calendario_cierres
                                  │ listarCierres(db)  (apps/desk/server/db/calendarioCierres.ts)
                                  ▼
    ley (código) ──→ calendarioLaboral.ts ←── Set<DiaCivil> de cierres
                         │ horasHabilesEntre / diasHabilesEntre
                         ▼
             consumidores futuros (F1B-08, F1C-06, nº 33, F1F-05) — ninguno en esta tanda

## Cambios de ficheros

| Fichero | Acción | Qué |
|---|---|---|
| `packages/shared/src/calendarioLaboral.ts` (+`.test.ts`) | Crear | Módulo y pruebas |
| `packages/shared/src/index.ts` | Modificar | `export * from './calendarioLaboral'` al final |
| `packages/zoho-sync/src/db/schema.sql` | Modificar | `CREATE TABLE` al final, calificado |
| `packages/zoho-sync/src/db/migrate.ts` | Modificar | `'calendario_cierres'` en `PUBLIC_TABLES`, **en la misma línea** `:73` (no desplaza `:63-64,70-73,80`, citadas en `CLAUDE.md`) |
| `packages/zoho-sync/src/db/migrate.test.ts` | Modificar | Recuento `:282-287`: 29→30 y 16→17, **editado en su sitio** (no desplaza `:319`, `:396-398`) |
| `apps/desk/server/db/calendarioCierres.ts` (+`.test.ts`) | Crear | Lector y prueba pg-mem |
| `openspec/config.yaml` | Modificar | D8, sustituye una línea |
| `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md` | Modificar | D9, sección añadida al final |

No se toca `apps/desk/src`: la regla de mutación 3 no aplica (ninguna decisión nueva en el cliente).
No hay interruptor ni escritor nuevo: la regla de secretos (`.env.example`, `DEPLOY.md`) no aplica.

## Estrategia de prueba (strict TDD, rojo antes que verde)

| Capa | Qué | Cómo |
|---|---|---|
| Unidad | Pascua 2026 (5-abr) y 2027 (28-mar) + un año extremo | `domingoDePascua` |
| Unidad | Los 18 festivos de 2026 y de 2027 **fecha a fecha** contra la lista oficial literal | `toEqual` sobre el array completo |
| Unidad | Traslado: 6-ene-2027 (miércoles) → 11-ene; 15-ago-2027 (domingo) → 16-ago; 29-jun-2026 (lunes) no se mueve; 20-jul fijo no se mueve | casos puntuales |
| Unidad | Horas: viernes 16:00 → lunes 9:00 = 2 h; con lunes festivo (18-may-2026) = 1 h; instantes en `Z` que cruzan medianoche en Bogotá; `hasta <= desde` = 0 | `Date` con `Z` explícito |
| Unidad | Cierre inyectado resta su día; sin cierres, sólo la ley | `Set` vacío vs. con fecha |
| Integración | `listarCierres` devuelve `YYYY-MM-DD` sin deriva, ordenado | pg-mem + `migrate` (molde `avisos.test.ts:9`) |
| Guardián | La tabla nueva está clasificada en `public` | `migrate.test.ts:266-287` existentes |

**Mutaciones obligatorias antes de cerrar (reglas 1 y 2):** quitar una entrada de cada tabla de festivos
→ rojo; mover 6-ene de trasladables a fijos → rojo (2027); borrar el cierre insertado → rojo; escribir
en `schema.sql` el `CREATE` **sin calificar** → rojo el guardián (regla 2: se ensucia el fichero vigilado);
cambiar `finHora` a 18 → rojo. Regla 1: comprobar que el orden fin de semana/festivo/cierre en
`esDiaHabil` es irrelevante (conjunto), y decirlo.

**Cierre (regla 4):** el diseño busca desplazamiento cero; el barrido `grep -rnoE` sobre `config.yaml`,
`schema.sql`, `migrate.ts`, `migrate.test.ts` e `index.ts` **se hace igual**, y confirma con
`git diff --numstat` que ninguno cambió de longitud antes de sus líneas citadas.

## Matriz de amenazas

N/A: sin enrutado, shell, subprocesos, automatización de VCS ni integración de procesos. Riesgos de dominio:
deriva UTC (D2/D3, pruebas con `Z`); cierre mal tecleado por SQL (PK impide duplicados, `date` rechaza
días imposibles; un cierre en fin de semana es inocuo); el `CREATE` sin calificar (guardián).

## Migración / despliegue

Aditivo. `migrate` crea la tabla al arrancar (tolerante por sentencia, `migrate.ts:24-36`). Vacía hasta
que Alfonso registre los cierres de fin de año (dato de persona, no tarea).

## Estimación (ledger 800)

Código y pruebas ~480 (módulo 150, pruebas 220, lector+prueba 90, resto 20); documental ~15. `apply` cabe.
`verify-report` (~300) y `archive` (doble por `git mv`) van en intentos aparte, con su propio presupuesto.

## Preguntas abiertas

- [ ] *Hipótesis*: pg-mem devuelve `fecha::text` como `YYYY-MM-DD`. Si no, el lector normaliza un `Date`
  con getters locales (node-postgres crea medianoche local); la prueba de integración lo decide.
- [ ] `sumarHorasHabiles` (vencimiento como instante, análogo a `venceSlaEn`) no entra: lo añade a ESTE
  módulo la primera tanda que lo necesite (F1B-08), no un módulo propio.
