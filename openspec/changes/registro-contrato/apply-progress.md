# Apply progress — `registro-contrato` (F1B-11, cambio 3 de 3)

## Lote 1 · Modelo y vigencia — 2026-09-28

**Ledger:** objetivo generación 1, ordinal 1, techo 800, 2 intentos. **Estimado antes de escribir:** ~600.

### Qué entra

| Fichero | Cambio | Forma |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | `public.contratos` calificada, `CHECK` de fechas, `idx_contratos_lote` (único), `idx_contratos_cliente` | AL FINAL (554 → 573) |
| `packages/zoho-sync/src/db/migrate.ts:73` | `'contratos'` al final de `PUBLIC_TABLES` | EN SITIO (+1 −1) |
| `packages/zoho-sync/src/db/migrate.test.ts:282-286` | 33 tablas, `[10, 20, 3]` | EN SITIO (+5 −5) |
| `apps/desk/server/db/calendarioCierres.ts:18` | `export function comoDiaCivil` (S-18) | EN SITIO (+1 −1) |
| `packages/shared/src/calendarioLaboral.ts:66` | `export function sumarDias`, reutilizado por los trimestres | EN SITIO (+1 −1) |
| `packages/shared/src/index.ts` | `export * from './contratos'` | AL FINAL (23 → 24) |
| `packages/shared/src/contratos.ts` (nuevo) | `LOTE_OV`, `fechaCalendario`, `estadoContrato`, `motivoVencido`, `hoyEnZona`, `prioridadAlNacer`, `trimestresDelContrato`, `trimestreEn`, tipos | — |
| `apps/desk/server/db/contratos.ts` (nuevo) | `crearContrato` (traduce `23505`), `listarContratos`, `contratoPorId`, `contratoDelLote`, `contratosDelCliente`; sin `DELETE` ni `UPDATE` (S-13) | — |
| `design.md` §7, `:163` | dependencia de la pasada de sincronización (`index.ts:85-93`) | EN SITIO: `tasks.md:26` cita `design.md:181` y `:186` |
| `docs/sdd/ENTRADA.md` | E-087, sin destino | AL FINAL |

**Reutilizado, no reescrito:** la zona (`diaEnZona`, `fechasDerivadas.ts:63-73`, con `ZONA_NEGOCIO`), la aritmética de días
(`sumarDias`, `calendarioLaboral.ts:66`) y la normalización de `date` (`comoDiaCivil`). Lo único nuevo es `sumarMeses`
con recorte a fin de mes, que ninguno de los dos módulos tenía.

**Adelantado del lote 4, a petición de la supervisión:** `trimestresDelContrato` y `trimestreEn`. `tasks.md` 4.1 y 4.3
lo dicen en su sitio: el caso de 4.1 queda como regresión, sin rojo previo.

**Hipótesis del diseño resuelta:** pg-mem **SÍ** impone el `CHECK` (mutación M2). La salida de reserva de 1.21 no se usa.

### Rojos previos (capturados antes de cada GREEN)

| Tarea | Rojo |
|---|---|
| 1.1 | `expected [ 10, 19, 3 ] to deeply equal [ 10, 20, 3 ]` |
| 1.3 | 19 × `fechaCalendario is not a function` |
| 1.7 | 14 fallos: `estadoContrato` / `motivoVencido is not a function` |
| 1.11 | 11 fallos: `prioridadAlNacer` / `hoyEnZona is not a function` |
| trimestres | 11 fallos: `trimestresDelContrato` / `trimestreEn is not a function` |
| 1.15 | `Cannot find module './contratos'` |

Bordes de vigencia con prueba: inicio = hoy, fin = hoy, fin = ayer, víspera del inicio, contrato de un día, 23:30 de
Bogotá del 31-dic (04:30Z del 1-ene) frente a 00:00 (05:00Z), cambio de trimestre (31-dic → 1-ene), fin de mes
(31-ene → 30-abr → 31-jul → 31-oct), bisiesto (30-nov → 29-feb de 2028 y 28-feb de 2027; 29-feb → 28-feb de 2029).

### Mutaciones reproducidas (todas revertidas y comprobadas con `cmp`)

| # | Mutación | Resultado |
|---|---|---|
| M1 | `schema.sql`: `idx_contratos_lote` sin `UNIQUE` | ROJO, 2 (duplicado traducido e `INSERT` directo) |
| M2 | `schema.sql`: sin `CHECK` | ROJO, 1 (`fecha_fin < fecha_inicio`) |
| M3 | `schema.sql`: `CREATE TABLE contratos` SIN `public.` | ROJO, 1 (guardián: tabla en otro esquema) |
| M4 | `migrate.ts:73` sin `'contratos'` | ROJO, 2 (guardián y recuento) |
| D1 | `hoy <= inicio` (inicio excluido) | ROJO, 3 |
| D2 | `fin <= hoy` (fin excluido) | ROJO, 4 |
| D3 | trimestres encadenados en vez de desde el inicio | ROJO, 3 |
| D4 | sin recorte a fin de mes | ROJO, 3 |
| D5 | «hoy» en UTC del proceso | ROJO, 1 |

### Cierre

`npm test` 1683 verdes (2 omitidas); `npm run typecheck` limpio; `npm run lint` 165 avisos, los mismos de antes.
Barrido de citas: sin desplazamientos (todo en sitio o al final); `migrate.ts:70-73` sigue definiendo `PUBLIC_TABLES`;
las menciones de «19» y «32» son de planificación o históricas (caso B).
