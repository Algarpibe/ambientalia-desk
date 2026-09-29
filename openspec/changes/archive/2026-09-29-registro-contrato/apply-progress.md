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

## Lote 4 · Informe trimestral — 2026-09-29

**Ledger:** objetivo generación 4, techo 800, 2 intentos. **Estimado antes de escribir:** ~690 (plan ~630 + la limpieza de
`LOTE_OV` + las pruebas de reversión y de consumido frente a ejecutado). La medida real va en el `settle`.

**Definición aplicada** (`decision/anexo-53-contratos`, `openspec/config.yaml:2457`; RQ-ZS-15): cada subOV creada está
**libre** (sin asociación vigente), **en curso** (asociación vigente a un ticket cuyo estado HOY no es `Finalizado`) o
**ejecutada** (ticket HOY en `Finalizado`), fechada por su PRIMERA fila de `ticket_transitions` hacia `Finalizado` (S-15).
% ejecutado = ejecutadas / creadas. Todo se lee hoy y nada se graba, así que las dos reversiones salen sin escritura: la
asociación liberada devuelve la subOV a libre; el ticket reabierto deja de estar ejecutado (y si vuelve a finalizar,
cuenta la primera llegada). Los trimestres salen de `trimestresDelContrato` (lote 1), sin reimplementarlo.

| Fichero | Edición | Forma |
|---|---|---|
| `books/subOV.ts` | `SubOVCreada`, `creadasDelLote` | AL FINAL, 49 → 66 (+17 −0); `:34-49` intactas |
| `shared/contratos.ts` | `diasEntre`, `porcentaje`, `estadoSubOV`, `INFORME_NO_DISPONIBLE`, tipos del informe | AL FINAL |
| `shared/contratos.ts` `:12-13`, `:107` | `LOTE_OV` retirado: sus dos líneas pasan a comentario EN SITIO (citas ancladas a `:65`) | EN SITIO |
| `db/informeContrato.ts` y su prueba | nuevos | — |
| `routes/contratos.ts` | `GET /api/contratos/:id/informe` (`404` antes de consultar) | al final de la función |
| `shared/contratos.test.ts` | casos de `LOTE_OV` → `esLote` en sitio; el enfrentamiento pasa a «el lote de toda subOV canónica es lote» | EN SITIO + AL FINAL |

**Rojos previos:** 4.1 → 3 (`diasEntre`, `porcentaje`, `estadoSubOV` inexistentes); los dos de trimestres nacen verdes
(regresión del lote 1, declarado en la tarea). 4.6 → 2. 4.11 → módulo inexistente. 4.16 → 7 (`401` y `200`); el `404` nace
verde porque la ruta no existía.

**Mutaciones reproducidas por el orquestador (diff visible, revertidas con `cmp`):**

| Mutación | Rojas |
|---|---|
| 4.5 · trimestre a partir del anterior (deriva) | 4 (31-ene, dos bisiestos, 31-ene del lote 4) |
| 4.10 · sin `'void'` en `creadasDelLote` | 3 (incluido el enfrentamiento con `saldoPorLote`) |
| 4.15a · «sólo los del trimestre» en vez de acumulado | 1 (20/50) |
| 4.15b · última llegada en vez de la primera | 1 |
| reabierta · ejecutada por haber llegado alguna vez a `Finalizado` | 1 |
| liberada · contar asociaciones liberadas | **0 en la primera pasada** → prueba nueva (el mismo ticket libera la 01 y se asocia a la 02) → 1 |
| `404` del informe sin filtro numérico | 1 |

La mutación «liberada» sobrevivió porque la consulta de tickets ya filtra por vigentes y cubre el caso de un solo ticket;
el hueco era un ticket con una asociación liberada y otra vigente. La prueba nueva nació verde (el código ya acertaba) y es
la que hoy pone roja esa mutación.

**Hueco declarado:** `huecos[]` dice que el documento «informe» del servicio no está en los datos (sólo
`fecha_revision_informe`) y cada servicio lleva `informe: 'No disponible en los datos'`; también declara `sinFecha`.

**Cierre:** `npm test` 1811 verdes (+27); typecheck limpio; lint 165, los mismos. Barrido: ninguna cita a `subOV.ts` pasa
de la línea 49 y `shared/src/subOV.ts` no se toca; `LOTE_OV` sale del código y sus cuatro menciones de `design.md` pasan a
`esLote` (la de `:62` dice que se retiró).

## Lote 5 · Ritmo y CSV — 2026-09-29

**Ledger:** objetivo generación 5, techo 800, 2 intentos. **Estimado antes de escribir:** ~580 (plan ~545 + la prueba
del fichero vigilado `index.ts` y la tabla ampliada de `celdaCSV`). La medida real va en el `settle`.

| Fichero | Edición | Forma |
|---|---|---|
| `shared/contratos.ts` | `ritmoInsuficiente`, `celdaCSV`, `csvDelInforme` | AL FINAL |
| `services/avisoRitmoContrato.ts` y su prueba | nuevos (`marcarYAvisarRitmo`, `avisarRitmoContratos`, `pasadaRitmoContratos`) | — |
| `index.ts` `:15`, `:88` | import al final de la línea; la pasada ANTES de `sync.syncRecent()` | EN SITIO, 99 → 99 (+2 −2) |
| `RemisionesPage.tsx` `:2`, `:85-88` | import; tres líneas de comentario y `const csvCampo = celdaCSV` | EN SITIO, 336 → 336 (+5 −5) |
| `db/avisos.ts` | no se toca | — |

**El `-5`.** Un NÚMERO pasa tal cual, también negativo: lo calcula el servidor (`diasHastaFin`), nadie lo teclea, y
neutralizarlo lo volvería texto y rompería ordenar y sumar en la hoja. Un TEXTO que empieza por `-` (también `"-5"`) se
neutraliza con `'`: en texto libre no hay forma barata de distinguirlo de `-5+cmd|…`. Por eso `celdaCSV` acepta
`string | number | null` y `csvDelInforme` pasa los números como números. `RemisionesPage` sólo pasa textos: su
comportamiento con `-` no cambia; lo único nuevo son TAB y CR.

**Atomicidad por estructura.** pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`, T0), así que «un fallo de
`crearAviso` deja la marca sin cambiar» no se puede ver en la tabla. Se prueba con un rastreador que etiqueta quién
recibe cada sentencia: `cliente:BEGIN, cliente:UPDATE, cliente:SELECT, cliente:INSERT, cliente:ROLLBACK` y nada por el
pool. En Postgres de verdad, esa secuencia en un mismo cliente revierte también la marca.

**Rojos previos:** 5.1 → 23 (`ritmoInsuficiente`, `celdaCSV`, `csvDelInforme` inexistentes). 5.6 → módulo inexistente;
tras el GREEN del servicio quedó roja sólo la del fichero vigilado `index.ts:88`, hasta editar `index.ts`.

**Mutaciones reproducidas por el orquestador (diff visible, revertidas con `cmp`):**

| Mutación | Rojas |
|---|---|
| 5.5 · sin TAB ni CR en los prefijos | 2 |
| 5.10a · `UPDATE` sin `AND COALESCE(…) < $2` | **0 en la primera pasada** → prueba nueva de `marcarYAvisarRitmo` dos veces en el mismo trimestre → 1 |
| 5.10b · `crearAviso` por el pool, fuera de la transacción | 3 |
| una vez por día · sin la variable de módulo | 1 |
| nunca lanza · sin el `try/catch` de la pasada | 1 |
| `-5` numérico tratado como texto | 2 |
| sin `k < 2` (evaluar en el trimestre 1) | 1 |
| prefiltro de la marca en `avisarRitmoContratos` | 0 — **declarado**: es una optimización (no calcular el informe de un contrato ya avisado); el `UPDATE` condicional cubre el caso |

5.10a sobrevivía porque el prefiltro repetía la guarda antes de llegar al `UPDATE`. La guarda que protege de dos
evaluaciones que leen la marca antes de escribirla es la del `UPDATE`, y ahora tiene su prueba.

**Cierre:** `npm test` 1848 verdes (+37); typecheck limpio; lint 165, los mismos. Barrido: ninguna línea de `index.ts` ni
de `RemisionesPage.tsx` se desplaza; las citas a `index.ts:85`, `:85-93`, `RemisionesPage.tsx:107-115`, `:119`, `:132`
siguen ciertas; `RemisionesPage.tsx:86` (dos citas: `design.md:279`, `tasks.md:314`) es caso B, anclada `en 5d93eb7`.

## Lote 6 · Interfaz y cierre — 2026-09-29

**Ledger:** objetivo generación 6, techo 800, 2 intentos. **Estimado antes de escribir:** ~600 (plan ~570 + la prueba de
`index.ts` reescrita). La medida real va en el `settle`.

**Primera tarea — la prueba de `index.ts` fija el ORDEN, no la línea.** La del lote 5 comparaba `index.ts` línea 88 y 15
con su sangría exacta: una línea añadida arriba la ponía roja sin romper nada. Ahora busca el cuerpo del `setInterval`
(hasta el `}, config.syncIntervalMs)` que lo cierra), exige que en él haya UNA sola sentencia con `sync.syncRecent()` y que
esté encadenada detrás de `pasadaRitmoContratos(pool)`, y que exista el import; sin números de línea ni sangría.
Mutaciones reproducidas: (a) invertir el orden (`sync.syncRecent().then(() => pasadaRitmoContratos(pool))`) → **rojo**;
(b) una línea en blanco arriba del todo (`index.ts` pasa a 100 líneas) → **verde**. Las dos revertidas con `cmp`.

| Fichero | Edición | Forma |
|---|---|---|
| `api/client.ts` | `listarContratos`, `crearContrato`, `contratoPorId`, `informeDeContrato`, `contratoDelTicket` y tres tipos | AL FINAL, 670 → 704 |
| `ContratosPanel.tsx`, `ContratoFicha.tsx`, `MarcaContrato.tsx` | nuevos | — |
| `Configuracion.tsx` `:2`, `:33`, `:127`, `:165` | import; `'contratos'` en la unión; segunda entrada en la misma línea; segunda sentencia | EN SITIO, 244 → 244 (+4 −4) |
| `TicketDetailView.tsx` `:15`, `:320` | import; `MarcaContrato` junto a `PanelOvAsociaciones` | EN SITIO, 420 → 420 (+2 −2) |
| `docs/sdd/R08.3_Expediente_de_cambios.md` | §12, texto para el maestro (`:2182`, `:2185`, M4.4) | AL FINAL, 657 → 674 |

**Regla 13, decisión a decisión (regla de mutación 3), contra la línea REAL del servidor de hoy:**

| Decisión del cliente | Dónde | Quién la impone en el servidor |
|---|---|---|
| El botón «Nuevo contrato» sólo lo ven Comercial y administradores | `ContratosPanel.tsx`, `canExecuteTransition` consumido | `routes/contratos.ts:43` (`403`, antes de leer el cuerpo); matriz por área en `routes/contratos.test.ts` |
| La entrada «Contratos por lote» y la ficha las ve cualquier usuario con sesión | `Configuracion.tsx:127` | `routes/contratos.ts:24`, `:28`, `:65` (`requireAuth`, sin área: S-16) |
| El formulario de alta no valida nada (lote, fechas, fin ≥ inicio, cliente, lote libre) | `ContratosPanel.tsx` → `mensajeDelServidor` | `routes/contratos.ts:49` (lote con `esLote`), `:50` (fechas), `:51` (fin ≥ inicio), `:52` (cliente), `:55` y `:59` (`409`); en la base, `schema.sql:570` (`CHECK`) y `:572` (índice único) |
| El `type="date"` de las fechas | `ContratosPanel.tsx` | Comodidad de entrada, no guarda: `:50` rechaza cualquier otra forma (`31/12/2026` → `422`, probado) |
| Ningún campo se puede editar ni borrar después del alta: no hay pantalla ni botón | `ContratosPanel.tsx`, `ContratoFicha.tsx` | Ausencia de ruta: `routes/contratos.ts` sólo registra `GET` y `POST`; `PUT`/`PATCH`/`DELETE` caen en el `404` JSON de `/api` |
| Ningún campo del alta se bloquea en el cliente | `ContratosPanel.tsx` | No hay decisión que espejar: todos los campos los valida `:49-52` |
| La marca «de contrato» en el ticket, sin control para ponerla ni quitarla | `MarcaContrato.tsx` | `routes/contratos.ts:36` → `db/contratos.ts:106` (`contratoDelTicket`, derivado al leer); ningún endpoint la acepta (prueba «no fijable») |
| Estado, saldo, % ejecutado, en curso, libres, días, trimestres y servicios | `ContratoFicha.tsx` sólo los enseña | `routes/contratos.ts:28` (estado y saldo) y `:65` → `db/informeContrato.ts` |
| Prioridad `High` por contrato: el formulario de alta de ticket no cambia | — | `ticketService.ts:106` (`prioridadAlNacer`) |
| Neutralizar fórmulas en el CSV | `ContratoFicha.tsx` (BOM y `Blob`) | **Ninguna, a propósito**: el fichero lo genera el navegador. La regla vive en `packages/shared/src/contratos.ts:219` (`celdaCSV`) y `:233` (`csvDelInforme`), probadas en node |

Ninguna decisión se queda sin línea: no hay guarda que viva sólo en el cliente.

**Barrido completo (6.9).** Script que cruza cada cita `fichero:N(-M)` sin ancla con las líneas que el cambio tocó desde
`5e8f6d4` en los catorce ficheros de `design.md` §8: 97 coincidencias, 39 de ellas de `tasks.md`/`apply-progress.md`. Ninguna
edición del cambio desplazó líneas, así que las citas de rango (`remision.ts:218-244`, `ticketService.ts:114-223`,
`index.ts:85-93`, `migrate.ts:70-73`) siguen abarcando el mismo bloque. Leídas una a una las de una sola línea: siguen
ciertas, **salvo un hallazgo PREVIO al cambio**: `openspec/specs/transitions-st/spec.md:32` y `:1052` citan
`ticketService.ts:145` como «el actor es el usuario de la sesión», y esa línea ya era un comentario en `5e8f6d4`; hoy el
actor está en `ticketService.ts:153`. No lo causa este cambio y no se corrige aquí; queda para el verify/archive.
`git diff --stat HEAD -- CLAUDE.md openspec/config.yaml` vacío.

**Criterios de éxito de `proposal.md`, uno a uno:** (1) `High` con contrato vigente — `ticketService.test.ts`, lote 2;
(2) vencido en las tres puertas con posición — lote 2; (3) ficha de ticket de contrato y deja de serlo al vencer — lote 3,
`db/contratos.test.ts` y `MarcaContrato.tsx`; (4) 30 % ejecutado y 50 % consumido a la vez — `informeContrato.test.ts`;
(5) informe por trimestre exportable con el hueco declarado — lotes 4 y 5; (6) aviso una vez por trimestre —
`avisoRitmoContrato.test.ts`; (7) `remisiones.test.ts:988` intacta y `ordenVentaUnTicket.test.ts` sin cambios — `git diff
5e8f6d4`: dos imports en sitio y 71 líneas al final en el primero, cero en el segundo.

**Para el `archive-report`:** cubre de la fila F1B-11 el registro de contrato, la prioridad por contrato, la guarda de
vencido, el ticket de contrato derivado, el informe trimestral exportable y el aviso de ritmo; deja fuera la ampliación
(E-086) y la regla Top 5 (F1B-07). `cierra: no`.

**Cierre:** `npm test` 1848 verdes; typecheck limpio; lint 165, los mismos; `npm run build` compila.
