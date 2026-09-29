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

## Lote 2 · Prioridad y guarda en las tres puertas — 2026-09-28

**Ledger:** objetivo generación 2, techo 800, 2 intentos. **Estimado antes de escribir:** ~530.

**Escalón elegido: C, no B.** Justificación escrita en su sitio en `design.md` §4 (`:88`): B es estado y permiso
**del sujeto** (el ticket, `transitions-st/spec.md:835`); el contrato entra por un valor aportado (la subOV), que es C
(`:836`), con el precedente exacto de la persona derivada dada de baja (`:198`, `:843-844`). Dentro de C, el último.

| Fichero | Edición | Forma |
|---|---|---|
| `ticketService.ts` `:5`, `:6`, `:96`, `:106`, `:143-147` | imports; vencido tras la cuarentena en el alta; `prioridadAlNacer`; comentario 5 → 4 y guarda en `:147` | EN SITIO, 234 → 234 (+9 −9) |
| `remision.ts` `:5`, `:220` | import; vencido tras A/cuarentena y antes de D | EN SITIO, 397 → 397 (+2 −2) |
| `db/contratos.ts` | `hayContratoVigente`, `motivoContratoVencido`, `erroresContratoVencido` (deciden en `shared`) | AL FINAL |
| `ticketService.test.ts`, `remisiones.test.ts`, `db/contratos.test.ts` | pruebas nuevas; imports en sitio | AL FINAL; `remisiones.test.ts:988` intacta |
| `repo.ts` | **no se toca**: `ticketConOrdenVenta` sirve tal cual | — |

**Rojos previos:** 2.1 → 7 fallos `is not a function`. 2.5 → 3 (`expected 'Low'/null to be 'High'`); los 5 restantes nacen
verdes (regresión). 2.10 → 2 (`no lanzó ninguno`, `expected 409 to be 422`); vecinas verdes. 2.15 → 4 (dos de ellos
`expected 409 to be 422`). 2.20 → 2 (`expected 201 to be 422`, `expected 409 to be 422`). Tras el GREEN de la remisión
falló la segunda petición de la prueba de posición por el ARNÉS (dos `adminCookie()` → `users_pkey`), no por la guarda: se
corrigió la prueba (una sesión por prueba).

**Mutaciones reproducidas (todas revertidas con `cmp`):**

| Puerta | Mutación | Rojas |
|---|---|---|
| prioridad | argumento `false` / `true` | 3 / 5 |
| alta | vencido tras D · antes de faltantes · antes de cliente · antes de equipo nuevo | 1 · 3 · 2 · 1 |
| transición | vencido tras D · antes de la persona · antes de obligatorios | 2 · 1 · 2 |
| remisión | vencido tras D · antes de ítems · antes de la pendiente (IV-12) | 1 · 1 · 2 |

**Cuarentena + vencido:** inobservable como posición (excluyentes para un mismo número); la prueba escrita discrimina
sacar el lote por prefijo (`OV-2026-170-X9` → mensaje de cuarentena, sin «contrato»).

**Cierre:** `npm test` 1722 verdes; typecheck limpio; lint 165. Barrido: cinco citas a `ticketService.ts:106` que describían
la regla anterior (proposal `:26`, design `:65`, delta `tickets-core :229`, `contratos.ts:65`, `contratos.test.ts:75`) son
caso B y quedan ancladas `en 9288779`; las de `:96`, `:143-152` y `remision.ts:220` siguen ciertas.

## Lote 3 · API y ticket de contrato — 2026-09-29

**Ledger:** objetivo generación 3, techo 800, 2 intentos. **Estimado antes de escribir:** ~620 (plan ~540 + la prueba de
«derivado, no fijable», la matriz por área y `esLote` con su enfrentamiento). La medida real va en el `settle`.

**Desvío declarado (supuesto reversible, petición de la supervisión):** el lote se decide con `esLote` —nuevo en
`packages/shared/src/contratos.ts`, AL FINAL—, que pregunta a `clasificarOV` (`subOV.ts:32-36`) si `lote + '-01'` es una
subOV canónica de ese mismo lote. No hay regex nueva: `ovAsociaciones.ts:21` deja la suya (ahora es un comentario) y
`:36` usa `esLote`. `LOTE_OV` se queda (lo usan sus pruebas del lote 1) y una prueba enfrenta los dos en 11 textos
(molde H5). Citas afectadas, caso B, ancladas `en 285ecf4`: `design.md:62` y delta `tickets-core :86`.

| Fichero | Edición | Forma |
|---|---|---|
| `app.ts` `:22`, `:61` | import y registro al final de las líneas existentes | EN SITIO, 96 → 96 |
| `routes/ovAsociaciones.ts` `:5`, `:21`, `:36` | import de `esLote`; regex propia → comentario; `esLote(lote)` | EN SITIO, 57 → 57 |
| `routes/contratos.ts`, `routes/contratos.test.ts` | nuevos | — |
| `db/contratos.ts`, `db/contratos.test.ts`, `shared/contratos.ts`, `shared/contratos.test.ts` | `contratoDelTicket`, `esLote` y pruebas | AL FINAL (imports en sitio) |

**Matriz de permisos por endpoint** (`routes/contratos.test.ts`, `ROLES` × cada ruta):

| Rol | `POST /api/contratos` | `GET /api/contratos` · `/:id` · `/api/tickets/:id/contrato` |
|---|---|---|
| sin sesión | 401 | 401 |
| Servicio Técnico | 403, sin fila | 200 |
| Compras sola | 403, sin fila | 200 |
| Comercial | 201, `creadoPor` de la sesión | 200 |
| Comercial + Compras | 201 | 200 |
| administrador sin área | 201 | 200 |

**Rojos previos:** 3.1 → 6 `contratoDelTicket is not a function` + 14 de `esLote`. 3.5/3.9 → 40 (rutas inexistentes: `404`).
Tras el GREEN, dos fallos eran de la PRUEBA: el orden esperado de claves (`creadoPor` < `createdAt`) y el alta de ticket sin
`clientId` (`422 Faltan campos obligatorios: cliente`); se corrigió la prueba, no el código.

**«Derivado, no fijable»:** un alta de ticket con `deContrato/de_contrato/esContrato/contrato/contratoId/contrato_id` a
verdadero y sin subOV → `{ deContrato: false }`; otra con esos campos a falso y subOV de lote con contrato vigente →
`deContrato: true`; ni `tickets` ni `ov_asociaciones` tienen columna que case `/contrat/i`. El alta del contrato ignora `id`,
`creadoPor`, `createdAt`, `ritmoAvisadoTrimestre` y las marcas del cuerpo.

**Mutaciones reproducidas por el orquestador (revertidas con `cmp`):**

| Mutación | Rojas |
|---|---|
| M1 · `403` movido tras la validación de contenido | 2 (`403` con cuerpo inválido; posición B) |
| M2 · consulta de unicidad antes del contenido | 1 (posición C < D) |
| M3 · sin guarda `403` | 4 (ST, Compras, cuerpo inválido, posición) |
| M4 · sin traducir `ContratoDuplicadoError` | 1 (carrera → 500) |
| M5 · `:id` sin filtro numérico | 1 (`abc` → 500) |
| M6 · lote por prefijo en vez de `clasificarOV` (3.15) | 1 (ordinaria `OV-2026-170` pasaba a ser de contrato) |
| M7 · contar asociaciones liberadas | 1 |
| M8 · `esLote` sin exigir `c.lote === valor` | 2 (`' OV-2026-170'`; enfrentamiento) |
| M9 · `creadoPor` tomado del cuerpo | 1 (no fijable) |

Nota de método: las tres primeras tentativas de M1, M2 y M6 no se aplicaron (no hay Python; y el heredoc de esta shell
colapsa `\`, lo que dejó M6 como `OV-d{4}`, que rompía todo por otra razón). Sus verdes/rojos se descartaron y se
repitieron con `diff` visible de cada mutación antes de correr.

**Cierre:** `npm test` 1784 verdes (+62); typecheck limpio; lint 165, los mismos. Barrido: `app.ts` y `ovAsociaciones.ts`
no mueven líneas; las citas a `ovAsociaciones.ts:13-14`, `:26`, `:30`, `:34`, `:36`, `:44`, `:47`, `:48`, `:50`, `:51`,
`:54` siguen ciertas; `:21` (dos citas) caso B, anclada.
