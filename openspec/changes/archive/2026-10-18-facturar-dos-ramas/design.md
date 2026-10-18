# Diseño — `facturar-dos-ramas` (F1C-02)

Lee `proposal.md` (medición y supuestos S-1 a S-11) y las deltas de `transitions-st` (RQ-TS-42, RQ-TS-43 y los MODIFIED)
y de `derivacion-avisos` (RQ-AV-23). Las líneas citadas son de `c8a1010`.

## D1 · Dónde vive cada pieza

| Pieza | Fichero | Forma |
|---|---|---|
| Estado `Pendiente de facturar` | `packages/shared/src/estados.ts` | entrada `'ninguna'` en la misma línea que `Ticket creado` y `Anulado` (`:99`), para no desplazar citas |
| Columna del tablero | `packages/shared/src/columns.ts` | en la línea de `Por Entregar` (`:33`), detrás de ella |
| Fase | `packages/shared/src/fasesBlueprint.ts` | `'cierre'`, en la línea de `Finalizado` y `Anulado` (`:67`) |
| Rama sin factura | `packages/shared/src/transitions.ts:248` | sólo cambia el `to` de `entrega_sin_factura` |
| «Facturar» | `packages/shared/src/transitions.ts:262` | al final de la línea de `anulacion`, como hizo F1C-01, para no insertar líneas |
| Claves y guarda de «Facturar» | `packages/shared/src/facturar.ts` (nuevo) | `CLAVE_NUMERO_FACTURA`, `CLAVE_FECHA_FACTURA`, `erroresFacturar`, `seRegistraEnCadaFactura` |
| Regla de vencimiento | `packages/shared/src/facturar.ts` | `facturacionVencida(fechaPrevista, hoy)`, pura |
| Guarda en el servidor | `apps/desk/server/services/ticketService.ts:134` | `erroresFacturar(t, values)` sumado al `422` agregado, en la misma línea |
| Lectura de candidatos | `apps/desk/server/db/facturacionVencida.ts` (nuevo) | `ticketsPendientesDeFacturarSinAvisar(db)` |
| Servicio de alarma | `apps/desk/server/services/avisoFacturacionVencida.ts` (nuevo) | molde `avisoReclamacionProveedor.ts` |
| Pasada | `apps/desk/server/index.ts:15` y `:88` | import y eslabón de la cadena, en sus líneas |
| Migración | `packages/zoho-sync/src/db/schema.sql` | una `ALTER` al final |
| Color de la tarjeta | `apps/desk/src/components/TicketCard.tsx:20` | en la línea de `Por Entregar / Sin facturar` |
| No prellenar la factura | `apps/desk/src/components/TransitionPanel.tsx:33` | `|| seRegistraEnCadaFactura(f.key)` en la condición |

Lo nuevo va en ficheros nuevos y lo que toca ficheros muy citados va **en su línea** (regla de mutación 4). Donde una
línea se retira, se deja un comentario en su sitio en lugar de borrarla.

## D2 · El catálogo

`entrega_sin_factura` conserva id, nombre, área (`Servicio Técnico`) y campos; sólo cambia `to`. `facturar`:

```ts
{ id: 'facturar', name: 'Facturar', from: ['Pendiente de facturar'], to: 'Finalizado', area: 'Comercial',
  fields: [comment(), cfText(CLAVE_NUMERO_FACTURA), cfDate(CLAVE_FECHA_FACTURA)] }
```

`cfText` y `cfDate` son obligatorios por defecto; `TRANSITIONS` añade la derivación como a todas (`transitions.ts:297`).
`CLAVE_FECHA_FACTURA` es exactamente «Fecha De Factura», la etiqueta de `PROMOTED_COLUMNS` (`rows.ts:111`), así que
`buildTransitionPlan` la manda a `tickets.fecha_factura` sin código nuevo (`transitionExec.ts:90-91`).
«Número de factura» no está en `PROMOTED_COLUMNS` y va a `custom_fields` y a la traza (S-1). `Finalizado` está en
`CLOSED_STATUSES` (`transitionExec.ts:5`): el ticket sale cerrado.

`facturar.ts` importa sólo de `fechasDerivadas.ts`; `transitions.ts` importa sus claves en la línea de
`camposAnulacion` (`:74`), como ya hizo F1C-01, para no añadir una línea de `import` arriba.

## D3 · La guarda de «Facturar»

`erroresFacturar(t, valores)` devuelve `[]` si la transición no declara `CLAVE_NUMERO_FACTURA` (molde
`erroresLiberacionSinFactura`, `liberacionSinFactura.ts:23-37`). Si la declara:

- número **presente** pero vacío tras `trim` → «Falta el número de factura: no puede quedar en blanco»;
- fecha **presente** y no `esFechaCalendarioReal` (`fechasDerivadas.ts:37`) → «Fecha inválida en el campo: Fecha De
  Factura».

La ausencia la pone `buildTransitionPlan` (`transitionExec.ts:76-77`), y en el `422` agregado sus errores van primero
(`ticketService.ts:134`): presencia antes que contenido, como PL-4 de F1C-05. Escalón C, detrás del `409` de estado
(`:126-128`) y del `403` de área (`:129-131`). No hay guarda nueva de escalón B: «Facturar» no tiene excepción de cargo.

## D4 · El invariante de las ramas (RQ-TS-43)

En `invariantesGrafo.test.ts`, dos pruebas nuevas al final:

1. Los componentes fuertemente conexos (`componentesFuertementeConexos`, `reentrancia.ts:129`) no contienen ningún estado
   de `ESTADOS_DE_CIERRE`, la lista de los cinco escrita en la prueba.
2. Las salidas de `Pendiente de facturar` son exactamente `facturar`, con destino `Finalizado`.

La mutación se prueba ensuciando el catálogo **en memoria** (`entrega_sin_factura` devuelta a `Por Facturar`, y una
transición de `Pendiente de facturar` a `Por Facturar`): la función pura recibe el catálogo por parámetro, así que la
prueba lo enfrenta a los dos catálogos sucios y exige que fallen. Es la regla de mutación 2: se muta lo vigilado, no el
vigilante.

## D5 · La reentrancia

`INDICADORES_G6` pierde la fila de la columna 47 (`reentrancia.ts:79`): su campo deja de ser reentrante y el guardián
K14 (`indicadores.test.ts:146`) lo exigiría. La línea se sustituye por un comentario en su sitio que dice que C4 la cerró.
Las cifras: `bodegaje.test.ts:113` 11 → 9; `invariantesGrafo.test.ts:138` (conjunto) sin `Fecha prevista de facturación`
ni `Fecha Remisión de Salida`; `reentrancia.test.ts` diez casos → ocho y tres ciclos → dos. Calculadas sobre el grafo
modificado antes de escribir la spec.

## D6 · La alarma

**Regla pura.** `facturacionVencida(fechaPrevista: DiaCivil | null, hoy: DiaCivil): boolean` → `fechaPrevista !== null &&
fechaPrevista < hoy` (comparación de cadenas `AAAA-MM-DD`, S-4). Vive en `packages/shared` porque es una regla de negocio.

**Candidatos.** `ticketsPendientesDeFacturarSinAvisar(db)`: `SELECT id, number, fecha_prevista_facturacion FROM tickets
WHERE status = 'Pendiente de facturar' AND fecha_prevista_facturacion IS NOT NULL AND (facturacion_avisada_para IS NULL
OR facturacion_avisada_para <> fecha_prevista_facturacion)`. Sin `IS DISTINCT FROM`, que pg-mem no garantiza. La fecha se
normaliza con `comoDiaCivil` (`calendarioCierres.ts:18`), no con `diaEnZona`: una columna `date` llega como `Date` a medianoche UTC y en Bogotá sería el día anterior (`fechasDerivadas.ts:58`). Visto al aplicar.

**Marca y avisos en una transacción** (`enTransaccion`), en este orden: destinatarios (Director Comercial por
`cargo_permiso`; si no, área Comercial; si no, `warn` y `false` sin marcar, S-7) → `UPDATE tickets SET
facturacion_avisada_para = $2 WHERE id = $1 AND status = 'Pendiente de facturar' AND fecha_prevista_facturacion = $2 AND
(facturacion_avisada_para IS NULL OR facturacion_avisada_para <> $2) RETURNING id` → si devuelve cero filas, `false` →
un `crearAviso` por destinatario. Sólo de bandeja (S-11): nada de `dispararAvisos`.

**La pasada.** `pasadaFacturacionVencida(db, hoy = hoyEnZona())` con puerta de un día civil por proceso (S-5) y
`try/catch` que registra y no lanza. Va en la cadena de `index.ts:88` detrás de `pasadaReclamaciones`.

**El sincronizador.** La columna no entra en `TICKET_COLS`; una prueba de `repo.test.ts` lo fija. Y aunque entrara, la
fila es `managed_by_app` (D2 de la propuesta).

## D7 · El cliente

El cliente no decide nada nuevo que el servidor no imponga, salvo una comodidad:

| # | Lo que decide el cliente | Qué impone el servidor | Estado |
|---|---|---|---|
| 1 | El botón «Facturar» sólo en `Pendiente de facturar` | `409` de estado | Espejo legítimo con su escenario en verde |
| 2 | Sólo Comercial lo ve | `403` de área | Espejo legítimo, barrido de permisos |
| 3 | Número y fecha obligatorios | presencia (`transitionExec.ts:76-77`) y contenido (D3) | Espejo legítimo con sus escenarios en verde |
| 4 | No prellenar ni bloquear número ni fecha de factura con lo que traiga el ticket (S-12) | No necesita contrapartida: el servidor lee sólo el cuerpo | Comodidad. El predicado `seRegistraEnCadaFactura` vive en `packages/shared` y tiene su prueba |
| 5 | Color de la tarjeta y columna del tablero | No decide nada | Presentación |

**S-12 (supuesto nuevo):** «Fecha De Factura» y «Número de factura» se piden siempre vacíos, en cualquier transición,
porque son los de la factura que se registra en ese momento. Afecta también a `facturado` y `facturado_cierre`. Se
revierte quitando la condición de `TransitionPanel.tsx:33`.

## D8 · Lo que cuenta o vigila, y cuánto se mueve

| Vigilante | Antes → después |
|---|---|
| `cifras_ancladas` + `cifrasAncladas.test.ts:24` | 32 / 21 / 40 → 33 / 22 / 41 |
| `capabilities` → `transitions-st` (`openspec/config.yaml:110`) | «32 transiciones y 21 estados» → «33 … 22» |
| `invariantesGrafo.test.ts:51-52` | 32, 21 → 33, 22 |
| `estados.test.ts:16`, `:226` | 24 → 25; 21 → 22 |
| `migracionTickets.test.ts:27-28` | 24 / 23 → 25 / 24 |
| `prioridad.test.ts:119` | 32 → 33 |
| `mapaBlueprint.test.ts:52`, `:184` y los artefactos | 40 → 41; se regeneran con `npm run generar-mapa-blueprint` |
| `permisos.test.ts:245` y los barridos por transición | 21 → 22 y la transición nueva en las matrices |
| `reentrancia.test.ts`, `bodegaje.test.ts:113`, `invariantesGrafo.test.ts:138` | D5 |
| `migrate.test.ts` (recuento de `ALTER`) | +1 sin calificar, de `DESK_TABLES` |
| `registro.test.ts:218-220` | nueve en curso hasta el archivo; ocho y F1C-02 por archivo al cerrar |

Las cifras exactas de los barridos se leen del rojo de cada prueba al aplicar, no se estiman: la prueba se ve en rojo con
la cifra vieja y se corrige en su línea.

## D9 · Mutaciones exigidas (las del encargo)

| Mutación | Dónde se ve el rojo |
|---|---|
| «Facturar» sin número, con número de espacios, sin fecha, con fecha imposible | `facturar.test.ts` y la prueba HTTP de la transición |
| Salir de `Pendiente de facturar` a algo que no sea `Finalizado` | invariante D4.2 |
| Una transición que vuelva a cerrar el ciclo | invariante D4.1, con el catálogo sucio |
| Alarma con la fecha no vencida, con el ticket facturado, dos avisos por el mismo vencimiento | `avisoFacturacionVencida.test.ts` |
| Área o cargo distinto que pasa | `403` de Servicio Técnico; `EXCEPCIONES_POR_CARGO` sin `facturar` |
| Posición de la guarda frente a sus vecinas | una prueba con `409`, `403` y `422` activables a la vez; mover `erroresFacturar` delante del `403` la pone en rojo |

Cada una se reproduce a mano en el apply y se anota en `apply-progress.md` con el rojo que dio.

## D10 · Lotes

- **Lote 1** (intento 3): D1 a D5, D7, D8 y la guarda. Toca `packages/shared`, `ticketService.ts`, el cliente y las cifras.
- **Lote 2** (intento 4): D6 entero y la migración.

Cada lote empieza por sus pruebas en rojo.
