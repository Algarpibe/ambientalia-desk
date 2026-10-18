# Informe de archivo — `facturar-dos-ramas` (F1C-02, `cierra: si`)

**Qué parte de F1C-02 cubre y qué deja fuera:** cubre la fila entera, «C4 facturar ↔ entregar en dos ramas, y alarma de la
fecha prevista de facturación (E-102)» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:100`): el estado
`Pendiente de facturar`, la rama sin factura que acaba en él, la transición «Facturar» a `Finalizado` con factura y fecha
impuestas en el servidor, las ramas sin ciclo y la alarma al Director Comercial. Deja fuera, como tareas de persona, las
pruebas en la app, el despliegue con su migración, la revisión de los supuestos y las cifras del maestro.

## Qué quedó construido

- **Estado:** `Pendiente de facturar`, de clase `ninguna` (S-3), fase `cierre`, columna propia del tablero; en la línea de
  `Anulado` (`packages/shared/src/estados.ts:99`, delante de él), sin desplazar citas.
- **Rama sin factura:** `entrega_sin_factura` lleva a `Pendiente de facturar` (`packages/shared/src/transitions.ts:248`);
  mismo id, área y campos.
- **«Facturar»:** `Pendiente de facturar` → `Finalizado`, área Comercial, sin excepción de cargo (S-2), con «Número de
  factura» (a `custom_fields` y a la traza, S-1) y «Fecha De Factura» (a `tickets.fecha_factura`), en la línea de
  `anulacion` (`transitions.ts:262`). Guarda de contenido en `packages/shared/src/facturar.ts`, sumada al `422` del escalón C
  (`apps/desk/server/services/ticketService.ts:134`), detrás del `409` de estado y del `403` de área.
- **Sin ciclo:** dos invariantes nuevos en `packages/shared/src/invariantesGrafo.test.ts` (ningún componente fuertemente
  conexo toca un estado de cierre; de `Pendiente de facturar` sólo se sale con «Facturar»), con su mutación en memoria.
  La reentrancia baja de 11 a 9 campos (7 obligatorios), de 10 a 8 casos y de 3 a 2 ciclos; la columna 47 sale de
  `INDICADORES_G6` (`packages/shared/src/reentrancia.ts:79`, comentario en su sitio). `Fecha Remisión de Salida` se escribe
  una sola vez.
- **Alarma:** `apps/desk/server/services/avisoFacturacionVencida.ts` y `apps/desk/server/db/facturacionVencida.ts`. Vence el
  día siguiente a la fecha prevista (S-4); aviso de bandeja (S-11) al Director Comercial por `cargo_permiso`, con respaldo al
  área Comercial (S-7); una vez por ticket y fecha, con la marca `tickets.facturacion_avisada_para` (S-6); pasada diaria
  (S-5) en la cadena de `apps/desk/server/index.ts:88`. Nunca mueve el ticket.
- **Cliente:** «Número de factura» y «Fecha De Factura» no se prellenan ni se bloquean (`TransitionPanel.tsx:33`, S-12);
  color de la tarjeta (`TicketCard.tsx:20`).
- **Histórico:** ninguna fila vieja se toca. Las liberaciones anteriores al 09/09 no tienen fecha prevista y no generan
  alarma; los tickets que ya volvieron a `Por Facturar` por el ciclo se quedan ahí (S-9).

**Migración de base de datos:** una sola sentencia, aditiva, al final de `packages/zoho-sync/src/db/schema.sql`:
`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS facturacion_avisada_para date` (sin calificar: `tickets` es de `DESK_TABLES`).
La aplica `migrate` al arrancar. Sin relleno.

## El grafo de cierre, antes y después

| | Antes (`37817ef`) | Después |
|---|---|---|
| Con factura | `Por Facturar` → Facturado → `Liberación Comercial` → Habilitado para entrega → `Por Entregar` → Entrega al cliente → `Finalizado`; o facturado y cierre de TK → `Finalizado` | igual |
| Sin factura | `Por Facturar` → Liberación sin factura → `Por Entregar / Sin facturar` → Entrega al cliente sin factura → **`Por Facturar`** (ciclo) | `Por Facturar` → Liberación sin factura → `Por Entregar / Sin facturar` → Entrega al cliente sin factura → **`Pendiente de facturar` → Facturar → `Finalizado`** |

## Specs: fusión por script, sin desplazar ninguna cita

Los cuatro bloques MODIFIED de `transitions-st` (RQ-TS-05 `:167-196`, §3.3 `:1067-1086`, RQ-TS-26 `:1669-1685`, RQ-TS-35
`:2177-2473`) se compactaron en la delta a la longitud exacta del vivo, uniendo líneas de un mismo párrafo, y se
sustituyeron en su sitio. Las ADDED van al final: RQ-TS-42 (`:2730-2789`) y RQ-TS-43 (`:2791-2822`) en `transitions-st`, y
RQ-AV-23 (`openspec/specs/derivacion-avisos/spec.md:1174-1251`). El script comprobó que los siete bloques vivos son
idénticos a la delta. Ninguna línea anterior a cada bloque se movió: `transitions-st` +137/−43, `derivacion-avisos` +79/−0.

## Regla de mutación 4

Ningún fichero muy citado cambió de longitud: `estados.ts`, `transitions.ts`, `reentrancia.ts`, `columns.ts`,
`fasesBlueprint.ts`, `ticketService.ts`, `index.ts`, `TicketCard.tsx` y `TransitionPanel.tsx` llevan inserciones = borrados;
`reentrancia.test.ts` quedó en +24/−24; `invariantesGrafo.test.ts`, `repo.test.ts` y `schema.sql` sólo crecen al final. Las
citas a líneas cuyo contenido cambió se leyeron una a una (`apply-progress.md`, «Regla de mutación 4»): caso A todas las
que describen el presente, caso B las de documentos fechados. El detector sale con 0.

## Intentos (registro de `gentle-ai sdd-attempt`)

| # | Unidad | Commits | Medida (`--no-renames`) |
|---|---|---|---|
| 1 | planificación 1 | `7ccebd2`, `c8a1010` | 718 contra `37817ef` |
| 2 | planificación 2 | `97d6f6e` | 212 |
| 3 | lote 1 | `8167a80` | 656 |
| 4 | lote 2 | `10ea400` | 436 |
| 5 | verify | `6de6952` | 126 |
| 6 | archive | este commit y el de la reconciliación | revisable: fusión 259 y este informe; el resto es la mudanza |

## Códigos y bundle

- Códigos sobre el commit de archivo: los del cierre, en el informe de la tanda (test, typecheck, lint con 165 avisos de
  partida, detector).
- Bundle: `index-*.js` pasa de 417.868 bytes (`index-JtLEpPmB.js`, `37817ef`) a 418.292 (`index-C7NdRWwC.js`): +424. Los
  demás chunks no cambian de tamaño.

## Avisos del verify y su destino

- W1 y W2: escenarios sin prueba heredados (alcanzabilidad de RQ-TS-05, medida 20/20/21 por el verificador y cierta; la
  coherencia de `esperas`). Mismo hueco que dejó F1C-01; queda anotado.
- W3: `apply-progress.md` no lleva la tabla «TDD Cycle Evidence» con sus columnas; el rojo de cada tarea está escrito y el
  verificador lo contrastó.
- W4: las tres pruebas «las dos capas, por separado» se escribieron tras ver sobrevivir M9, M9b, M10 y M10b; declarado.
- W5: los dos hallazgos van abajo, «Para la bandeja»: la rama no escribe en `docs/sdd/ENTRADA.md`.
- S1: corregido en sitio en `6de6952` (tarea 1.7). S2-S5: anotados; S3 es E-246.

## Supuestos para la lista semanal (F1C-02)

- S-1: «registra la factura» es su número, campo de texto obligatorio, sin columna propia.
- S-2: «Facturar» es de Comercial y sin excepción de cargo.
- S-3: `Pendiente de facturar` es `ninguna`, como `Por Facturar`, y no es `sin_salida`.
- S-4: vence el día siguiente a la fecha prevista, en día civil de Bogotá.
- S-5: la alarma se evalúa una vez al día por proceso.
- S-6: un aviso por ticket y fecha prevista; una fecha nueva puede volver a avisar.
- S-7: sin Director Comercial, al área Comercial; sin nadie, no marca y reintenta.
- S-8: la fecha de factura no se exige pasada ni futura.
- S-9: los tickets que ya volvieron a `Por Facturar` por el ciclo se quedan; pueden cerrar por `facturado_cierre`.
- S-10: la antigüedad se mide con el historial y la alarma; un indicador propio no está decidido.
- S-11: el aviso es sólo de bandeja, sin correo.
- S-12: número y fecha de factura se piden siempre vacíos, en cualquier transición.

Cómo se revierte cada uno: `proposal.md` §5.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Desplegar en EasyPanel; la columna `facturacion_avisada_para` la crea `migrate` al arrancar | quien despliegue |
| P-2 | Recorrer las pruebas en la app de F1C-02 en la ronda final | Gerencia |
| P-3 | Revisar S-1 a S-12 en la lista semanal | Gerencia |
| P-4 | Pegar en el maestro 22 estados, 33 transiciones y 41 pasos | Gerencia |

## Para la bandeja (no se corrige aquí)

- `facturado` y `facturado_cierre` (`packages/shared/src/transitions.ts:240-243`) escriben «Fecha De Factura» sin guarda de
  contenido: una fecha imposible daría `500`, como daba «Facturar» antes de su guarda (rojo de 1.8 en `apply-progress.md`).
- Un `;` dentro de un comentario de `schema.sql` parte la sentencia, y `migrate` la descarta con un `console.error`
  (`packages/zoho-sync/src/db/migrate.ts:20`, `:29-34`): una `ALTER` puede quedarse sin aplicar en silencio.
- E-246: siguen sin corregir los «31» de `apps/desk/server/services/valoresDeTransicion.ts:10`, `packages/shared/src/bodegaje.ts:28`,
  `packages/shared/src/sla.ts:14` y `packages/shared/src/sla.test.ts:22`, que esta tanda no tocó.
- RQ-TS-01 (`openspec/specs/transitions-st/spec.md:43`, `:64`) dice 31 transiciones sobre 20 estados y «diez» campos
  reentrantes: caduco desde antes de F1C-01.
- La consecuencia 5 de `decision/anexo-33-checkbox` («Director Comercial sigue sin existir como cargo en el código») está
  caducada: el cargo existe (`packages/shared/src/cargos.ts:12-15`).
